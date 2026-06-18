import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { makeRequest } from "../_core/map";

export const radiusFeesRouter = router({
  // Listar faixas de raio de um estabelecimento (público para o cardápio)
  list: publicProcedure
    .input(z.object({
      establishmentId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getRadiusFeesByEstablishment(input.establishmentId);
    }),

  // Sincronizar faixas de raio (batch - admin)
  sync: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      fees: z.array(z.object({
        id: z.number().optional(),
        maxKm: z.string(),
        fee: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const updated = await db.syncRadiusFees(input.establishmentId, input.fees);
      return updated;
    }),

  // Calcular taxa de entrega por distância (público - usado no checkout)
  calculateFee: publicProcedure
    .input(z.object({
      establishmentId: z.number(),
      customerAddress: z.string().min(1, "Endereço é obrigatório"),
    }))
    .query(async ({ input }) => {
      // Get establishment info (lat/lng)
      const establishment = await db.getEstablishmentById(input.establishmentId);
      if (!establishment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      }

      if (!establishment.latitude || !establishment.longitude) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Estabelecimento não possui coordenadas configuradas",
        });
      }

      // Get radius fees
      const fees = await db.getRadiusFeesByEstablishment(input.establishmentId);
      if (fees.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhuma faixa de distância configurada",
        });
      }

      // Calculate distance using Google Maps Distance Matrix
      const origin = `${establishment.latitude},${establishment.longitude}`;
      const destination = input.customerAddress;

      try {
        const result = await makeRequest<{
          rows: Array<{
            elements: Array<{
              distance: { value: number; text: string };
              duration: { value: number; text: string };
              status: string;
            }>;
          }>;
          status: string;
        }>("/maps/api/distancematrix/json", {
          origins: origin,
          destinations: destination,
          mode: "driving",
          units: "metric",
        });

        if (result.status !== "OK" || !result.rows?.[0]?.elements?.[0]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não foi possível calcular a distância. Verifique o endereço.",
          });
        }

        const element = result.rows[0].elements[0];
        if (element.status !== "OK") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Endereço não encontrado ou rota indisponível.",
          });
        }

        const distanceKm = element.distance.value / 1000; // Convert meters to km

        // Find the matching fee range (sorted by maxKm ascending)
        const matchingFee = fees.find(f => distanceKm <= parseFloat(f.maxKm));

        if (!matchingFee) {
          // Distance exceeds all configured ranges
          return {
            distanceKm: Math.round(distanceKm * 10) / 10,
            distanceText: element.distance.text,
            durationText: element.duration.text,
            fee: null,
            outOfRange: true,
            maxRange: parseFloat(fees[fees.length - 1].maxKm),
          };
        }

        return {
          distanceKm: Math.round(distanceKm * 10) / 10,
          distanceText: element.distance.text,
          durationText: element.duration.text,
          fee: matchingFee.fee,
          outOfRange: false,
          maxRange: parseFloat(fees[fees.length - 1].maxKm),
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao calcular distância: " + (error.message || "erro desconhecido"),
        });
      }
    }),
});
