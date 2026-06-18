import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { z } from "zod";
import { zMoney, zMoneyOptional } from "../../shared/validation";

export const financeRouter = router({
    // Categorias de despesa
    listCategories: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getExpenseCategories(input.establishmentId);
      }),
    
    createCategory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.createExpenseCategory(input);
        return { id };
      }),
    
    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getExpenseCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, category.establishmentId);
        const { id, ...data } = input;
        await db.updateExpenseCategory(id, data);
        return { success: true };
      }),
    
    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getExpenseCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, category.establishmentId);
        try {
          await db.deleteExpenseCategory(input.id);
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),
    
    // Despesas
    listExpenses: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categoryId: z.number().optional(),
        paymentMethod: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, ...filters } = input;
        return db.getExpenses(establishmentId, filters);
      }),
    
    createExpense: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number(),
        description: z.string().min(1),
        amount: zMoney,
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.createExpense({
          ...input,
          date: new Date(input.date),
        });
        return { id };
      }),
    
    updateExpense: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        description: z.string().min(1).optional(),
        amount: zMoneyOptional,
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]).optional(),
        date: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const expense = await db.getExpenseById(input.id);
        if (!expense) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Despesa não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, expense.establishmentId);
        const { id, date, ...data } = input;
        await db.updateExpense(id, {
          ...data,
          ...(date ? { date: new Date(date) } : {}),
        });
        return { success: true };
      }),
    
    deleteExpense: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const expense = await db.getExpenseById(input.id);
        if (!expense) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Despesa não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, expense.establishmentId);
        await db.deleteExpense(input.id);
        return { success: true };
      }),
    
    // Resumo financeiro
    summary: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getFinanceSummary(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),
    
    // Gráfico de evolução
    chart: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['week', 'month']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getFinanceChart(input.establishmentId, input.period ?? 'week');
      }),
    
    // Despesas por categoria
    expensesByCategory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getExpensesByCategory(input.establishmentId, input.period ?? 'month');
      }),
    
    // Meta mensal
    getGoal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getMonthlyGoal(input.establishmentId, input.month, input.year);
      }),
    
    setGoal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
        targetProfit: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.upsertMonthlyGoal(input);
        return { id };
      }),

    // Metas financeiras personalizadas (múltiplas)
    listGoals: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.listFinancialGoals(input.establishmentId, input.month, input.year);
      }),

    createGoalCustom: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
        name: z.string().min(1),
        targetValue: z.string(),
        type: z.enum(["profit", "revenue", "savings", "custom"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.createFinancialGoal(input);
        return { id };
      }),

    updateGoalCustom: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
        name: z.string().min(1).optional(),
        targetValue: z.string().optional(),
        type: z.enum(["profit", "revenue", "savings", "custom"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { id, establishmentId, ...data } = input;
        await db.updateFinancialGoal(id, establishmentId, data);
        return { success: true };
      }),

    deleteGoalCustom: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.deleteFinancialGoal(input.id, input.establishmentId);
        return { success: true };
      }),

    // Meta semanal
    getWeeklyGoal: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getWeeklyGoal(input.establishmentId);
      }),

    setWeeklyGoal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        targetRevenue: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.upsertWeeklyGoal(input);
        return { id };
      }),

    deleteWeeklyGoal: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.deleteWeeklyGoal(input.establishmentId);
        return { success: true };
      }),

    deleteMonthlyGoal: protectedProcedure
      .input(z.object({ establishmentId: z.number(), month: z.number(), year: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.deleteMonthlyGoal(input.establishmentId, input.month, input.year);
        return { success: true };
      }),

    // Receitas diárias (faturamento consolidado por dia)
    listDailyRevenue: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
        source: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, ...filters } = input;
        return db.getDailyRevenue(establishmentId, filters);
      }),

    // Lançamentos futuros (próximas ocorrências de recorrentes)
    upcomingRecurring: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getUpcomingRecurringExpenses(input.establishmentId);
      }),

    // Marcar lançamento futuro como pago
    markUpcomingAsPaid: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        recurringId: z.number(),
        frequency: z.string(),
        description: z.string(),
        categoryId: z.number(),
        amount: zMoney,
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]),
        dueDate: z.string(),
        type: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        if (input.frequency === 'once') {
          await db.updateExpense(input.recurringId, {
            date: new Date(),
            notes: `Pago via lançamento futuro (avulso #${input.recurringId}, venc:${input.dueDate})`,
          });
          return { success: true, action: 'updated' as const, expenseId: input.recurringId, originalDate: input.dueDate };
        } else {
          const id = await db.createExpense({
            establishmentId: input.establishmentId,
            categoryId: input.categoryId,
            description: input.description,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            date: new Date(input.dueDate),
            notes: `Pago via lançamento futuro (recorrência #${input.recurringId}, venc:${input.dueDate})`,
          });
          return { success: true, action: 'created' as const, expenseId: id, originalDate: null };
        }
      }),

    // Desfazer marcação de pago
    undoMarkAsPaid: protectedProcedure
      .input(z.object({
        expenseId: z.number(),
        action: z.enum(['created', 'updated']),
        originalDate: z.string().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership via expense
        const expense = await db.getExpenseById(input.expenseId);
        if (!expense) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Despesa não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, expense.establishmentId);
        if (input.action === 'created') {
          await db.deleteExpense(input.expenseId);
          return { success: true };
        } else if (input.action === 'updated' && input.originalDate) {
          await db.updateExpense(input.expenseId, {
            date: new Date(input.originalDate),
            notes: '',
          });
          return { success: true };
        }
        return { success: false };
      }),

    // Despesas Recorrentes
    listRecurring: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.listRecurringExpenses(input.establishmentId);
      }),

    createRecurring: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        type: z.enum(["expense", "revenue"]),
        description: z.string(),
        categoryId: z.number(),
        amount: zMoney,
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]),
        frequency: z.enum(["weekly", "monthly", "yearly"]),
        executionDay: z.number(),
        executionMonth: z.number().optional(),
        generateAsPending: z.boolean(),
        startDate: z.string(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.createRecurringExpense({
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          notes: input.notes ?? null,
        });
        return { id };
      }),

    updateRecurring: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        amount: zMoneyOptional,
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]).optional(),
        frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
        executionDay: z.number().optional(),
        executionMonth: z.number().nullable().optional(),
        generateAsPending: z.boolean().optional(),
        endDate: z.string().nullable().optional(),
        active: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { id, establishmentId, endDate, ...data } = input;
        const updateData: any = { ...data };
        if (endDate !== undefined) {
          updateData.endDate = endDate ? new Date(endDate) : null;
        }
        await db.updateRecurringExpense(id, establishmentId, updateData);
        return { success: true };
      }),

    recurringHistory: protectedProcedure
      .input(z.object({
        recurringExpenseId: z.number(),
        establishmentId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getRecurringExpenseHistory(input.recurringExpenseId, input.establishmentId);
      }),

    deleteRecurring: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
        deleteFutureExpenses: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        if (input.deleteFutureExpenses) {
          await db.deactivateRecurringExpense(input.id, input.establishmentId);
        } else {
          await db.deleteRecurringExpense(input.id, input.establishmentId);
        }
        return { success: true };
      }),

    processRecurring: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.processRecurringExpenses(input.establishmentId);
      }),

    getMonthlyComparison: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getMonthlyComparison(input.establishmentId);
      }),

    revenueByChannel: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getRevenueByChannel(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),

    revenueByPaymentMethod: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getRevenueByPaymentMethod(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),

    paymentMethodDaily: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getPaymentMethodDailyBreakdown(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),
  });
