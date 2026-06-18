import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const tableSpacesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) return [];
    return db.getTableSpaces(establishment.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      
      // Check for duplicate name
      const existing = await db.getTableSpaceByName(establishment.id, input.name);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Já existe um espaço com esse nome" });
      
      const id = await db.createTableSpace({
        establishmentId: establishment.id,
        name: input.name,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      
      // Verificar que o espaço pertence ao estabelecimento do usuário
      const spaces = await db.getTableSpaces(establishment.id);
      const space = spaces.find(s => s.id === input.id);
      if (!space) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: este espaço não pertence ao seu estabelecimento" });
      
      await db.updateTableSpace(input.id, { name: input.name });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      
      // Verificar que o espaço pertence ao estabelecimento do usuário
      const spaces = await db.getTableSpaces(establishment.id);
      const space = spaces.find(s => s.id === input.id);
      if (!space) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: este espaço não pertence ao seu estabelecimento" });
      
      await db.deleteTableSpace(input.id);
      return { success: true };
    }),
  // Buscar percentual de taxa de serviço do estabelecimento
  getServiceChargePercent: protectedProcedure.query(async ({ ctx }) => {
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) return { percent: "0" };
    return { percent: establishment.serviceChargePercent || "0" };
  }),
  // Atualizar percentual de taxa de serviço
  updateServiceChargePercent: protectedProcedure
    .input(z.object({
      percent: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      const percentValue = parseFloat(input.percent);
      if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Percentual inválido (0-100)" });
      }
      await db.updateEstablishment(establishment.id, { serviceChargePercent: input.percent } as any);
      return { success: true };
    }),
});
