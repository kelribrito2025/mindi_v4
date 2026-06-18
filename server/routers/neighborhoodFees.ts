import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney, zMoneyOptional } from "../../shared/validation";

export const neighborhoodFeesRouter = router({
    // Listar taxas por bairro de um estabelecimento (público para o cardápio)
    list: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getNeighborhoodFeesByEstablishment(input.establishmentId);
      }),
    
    // Criar nova taxa por bairro (admin)
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        neighborhood: z.string().min(1, "Nome do bairro é obrigatório"),
        fee: zMoney,
        pinned: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.createNeighborhoodFee(input);
        return { id };
      }),
    
    // Atualizar taxa por bairro (admin)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        neighborhood: z.string().min(1).optional(),
        fee: zMoneyOptional,
        pinned: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fee = await db.getNeighborhoodFeeById(input.id);
        if (!fee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Taxa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, fee.establishmentId);
        const { id, ...data } = input;
        await db.updateNeighborhoodFee(id, data);
        return { success: true };
      }),
    
    // Deletar taxa por bairro (admin)
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fee = await db.getNeighborhoodFeeById(input.id);
        if (!fee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Taxa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, fee.establishmentId);
        await db.deleteNeighborhoodFee(input.id);
        return { success: true };
      }),
    
    // Deletar todas as taxas de um estabelecimento (admin)
    deleteAll: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.deleteAllNeighborhoodFees(input.establishmentId);
        return { success: true };
      }),

    // Sincronizar todas as taxas por bairro de uma vez (batch)
    sync: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        fees: z.array(z.object({
          id: z.number().optional(),
          neighborhood: z.string(),
          fee: zMoney,
          pinned: z.boolean().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const updated = await db.syncNeighborhoodFees(input.establishmentId, input.fees);
        return updated;
      }),
  });
