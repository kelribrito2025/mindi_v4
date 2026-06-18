import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const schedulingRouter = router({
    // Buscar configurações de agendamento
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const config = await db.getSchedulingConfig(establishment.id);
        return config;
      }),

    // Atualizar configurações de agendamento
    updateConfig: protectedProcedure
      .input(z.object({
        schedulingEnabled: z.boolean().optional(),
        schedulingMinAdvance: z.number().min(15).max(1440).optional(),
        schedulingMaxDays: z.number().min(1).max(30).optional(),
        schedulingInterval: z.number().refine(v => [15, 30, 60].includes(v!), { message: 'Intervalo deve ser 15, 30 ou 60 minutos' }).optional(),
        schedulingMoveMinutes: z.number().min(5).max(120).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.updateSchedulingConfig(establishment.id, input);
        return { success: true };
      }),

    // Buscar configurações de agendamento (público - por slug)
    getPublicConfig: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const dbi = await db.getDb();
        if (!dbi) return null;
        const { establishments: est } = await import('../../drizzle/schema');
        const [estab] = await dbi.select({
          schedulingEnabled: est.schedulingEnabled,
          schedulingMinAdvance: est.schedulingMinAdvance,
          schedulingMaxDays: est.schedulingMaxDays,
          schedulingInterval: est.schedulingInterval,
        }).from(est).where(eq(est.menuSlug, input.slug)).limit(1);
        return estab || null;
      }),

    // Buscar horários de funcionamento públicos (por slug)
    getPublicBusinessHours: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const dbi = await db.getDb();
        if (!dbi) return [];
        const { establishments: est, businessHours: bh } = await import('../../drizzle/schema');
        const [estab] = await dbi.select({ id: est.id }).from(est).where(eq(est.menuSlug, input.slug)).limit(1);
        if (!estab) return [];
        const hours = await dbi.select().from(bh).where(eq(bh.establishmentId, estab.id)).orderBy(asc(bh.dayOfWeek));
        return hours;
      }),

    // Buscar pedidos agendados por data
    getByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const orders = await db.getScheduledOrdersByDate(establishment.id, input.date);
        // Buscar itens de cada pedido
        const dbi = await db.getDb();
        if (!dbi) return [];
        const { orderItems: oi } = await import('../../drizzle/schema');
        const result = [];
        for (const order of orders) {
          const items = await dbi.select().from(oi).where(eq(oi.orderId, order.id));
          result.push({ ...order, items });
        }
        return result;
      }),

    // Buscar pedidos agendados por range de datas
    getByRange: protectedProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getScheduledOrdersByRange(establishment.id, input.startDate, input.endDate);
      }),

    // Contagem de pedidos agendados pendentes (para badge na sidebar)
    pendingCount: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return { count: 0 };
        const count = await db.getScheduledPendingCount(establishment.id);
        return { count };
      }),

    // Contagem de pedidos por mês (para calendário)
    getMonthCounts: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getScheduledOrderCountsByMonth(establishment.id, input.year, input.month);
      }),

    // Aceitar pedido agendado antecipadamente
    accept: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.acceptScheduledOrder(input.orderId);
        return { success: true };
      }),

    // Cancelar pedido agendado
    cancel: protectedProcedure
      .input(z.object({ orderId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.cancelScheduledOrder(input.orderId, input.reason);
        return { success: true };
      }),

    // Reagendar pedido
    reschedule: protectedProcedure
      .input(z.object({ orderId: z.number(), scheduledAt: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.rescheduleOrder(input.orderId, new Date(input.scheduledAt));
        return { success: true };
      }),
  });
