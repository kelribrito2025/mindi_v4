import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import * as db from "../db";

export const cashRegisterRouter = router({
  // Obter sessão atual (aberta) do caixa
  getCurrentSession: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getCashCurrentSession(input.establishmentId);
    }),

  // Abrir caixa
  openSession: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      openingAmount: z.number().min(0),
      observation: z.string().optional(),
      operatorName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const opName = input.operatorName || ctx.user.name || "Operador";
      return db.cashOpenSession(input.establishmentId, opName, ctx.user.id, input.openingAmount, input.observation);
    }),

  // Fechar caixa
  closeSession: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      sessionId: z.number(),
      closingAmount: z.number().min(0).optional(),
      closingObservation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashCloseSession(input.establishmentId, input.sessionId, input.closingAmount, input.closingObservation);
    }),

  // Registrar sangria
  registerSangria: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      sessionId: z.number(),
      amount: z.number().positive(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashAddMovement(input.establishmentId, input.sessionId, "sangria", input.amount, input.reason);
    }),

  // Registrar reforço
  registerReforco: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      sessionId: z.number(),
      amount: z.number().positive(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashAddMovement(input.establishmentId, input.sessionId, "suprimento", input.amount, input.reason);
    }),

  // Obter movimentações da sessão
  getMovements: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      sessionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashGetMovements(input.sessionId);
    }),

  // Obter vendas da sessão
  getSessionSales: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      sessionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashGetSessionSales(input.establishmentId, input.sessionId);
    }),
  // Breakdown de pagamentos da sessão
  getPaymentBreakdown: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      sessionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashGetPaymentBreakdown(input.establishmentId, input.sessionId);
    }),

  // Histórico de sessões
  getHistory: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      limit: z.number().min(1).max(500).default(30),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.cashGetHistory(input.establishmentId, input.limit);
    }),

  // Obter operadores
  getOperators: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getCashOperators(input.establishmentId);
    }),

  // Criar novo operador
  createOperator: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.createCashOperator(input.establishmentId, input.name.trim());
    }),

  // Atualizar operador
  updateOperator: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      operatorId: z.number(),
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.updateCashOperator(input.operatorId, input.establishmentId, input.name.trim());
    }),

  // Excluir operador (soft delete)
  deleteOperator: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      operatorId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.deleteCashOperator(input.operatorId);
    }),

  // ─── Taxas por forma de pagamento ─────────────────────────────
  getPaymentFees: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentById(input.establishmentId);
      if (!est) return { feePixOnline: null, feePixStatic: null, feeCard: null };
      return {
        feePixOnline: est.feePixOnline ? parseFloat(est.feePixOnline) : null,
        feePixStatic: est.feePixStatic ? parseFloat(est.feePixStatic) : null,
        feeCard: est.feeCard ? parseFloat(est.feeCard) : null,
      };
    }),

  setPaymentFees: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      feePixOnline: z.number().min(0).max(100).nullable().optional(),
      feePixStatic: z.number().min(0).max(100).nullable().optional(),
      feeCard: z.number().min(0).max(100).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const updateData: Record<string, string | null> = {};
      if (input.feePixOnline !== undefined) {
        updateData.feePixOnline = input.feePixOnline !== null ? input.feePixOnline.toFixed(2) : null;
      }
      if (input.feePixStatic !== undefined) {
        updateData.feePixStatic = input.feePixStatic !== null ? input.feePixStatic.toFixed(2) : null;
      }
      if (input.feeCard !== undefined) {
        updateData.feeCard = input.feeCard !== null ? input.feeCard.toFixed(2) : null;
      }
      if (Object.keys(updateData).length > 0) {
        await db.updateEstablishmentFees(input.establishmentId, updateData);
      }
      return { success: true };
    }),
});
