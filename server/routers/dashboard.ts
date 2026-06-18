import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const dashboardRouter = router({
    stats: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getDashboardStats(input.establishmentId, input.period ?? 'today', input.startDate, input.endDate);
      }),
    
    weeklyStats: protectedProcedure
      .input(z.object({ establishmentId: z.number(), days: z.number().min(1).max(90).optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getWeeklyStats(input.establishmentId, input.days ?? 7);
      }),
    
    recentOrders: protectedProcedure
      .input(z.object({ 
        establishmentId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getRecentOrders(input.establishmentId, input.limit);
      }),
    
    lowStock: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getLowStockProducts(input.establishmentId);
      }),
    
    weeklyRevenue: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const result = await db.getRevenueByPeriod(input.establishmentId, input.period ?? 'week', input.startDate, input.endDate);
        logger.info(`[weeklyRevenue] estId=${input.establishmentId} period=${input.period} thisWeekOrders=${JSON.stringify(result.thisWeekOrders)} thisWeekTotalOrders=${result.thisWeekTotalOrders} thisWeekTotal=${result.thisWeekTotal}`);
        return result;
      }),
    
    conversionRate: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getConversionRate(input.establishmentId, input.period ?? 'today', input.startDate, input.endDate);
      }),

    topProducts: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getTopProducts(input.establishmentId, input.period ?? 'today', input.limit ?? 10, input.startDate, input.endDate);
      }),

    ordersByDeliveryType: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getOrdersByDeliveryType(input.establishmentId, input.period ?? 'today', input.startDate, input.endDate);
      }),

    avgPrepTime: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getAvgPrepTime(input.establishmentId, input.period ?? 'today', input.startDate, input.endDate);
      }),

    avgPrepTimeTrend: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getAvgPrepTimeTrend(input.establishmentId, input.period ?? 'today', input.startDate, input.endDate);
      }),

    prepTimeAnalysis: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getPrepTimeAnalysis(input.establishmentId, input.period ?? 'week', input.startDate, input.endDate);
      }),

    updatePrepGoal: protectedProcedure
      .input(z.object({ establishmentId: z.number(), goalMinutes: z.number().min(5).max(120) }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.updatePrepGoal(input.establishmentId, input.goalMinutes);
        return { success: true };
      }),

    customerInsights: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getCustomerInsights(input.establishmentId);
      }),
    revenueByHour: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month', 'custom']).default('today'), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getRevenueByHour(input.establishmentId, input.period, input.startDate, input.endDate);
      }),

    // Onboarding checklist - verifica status de configuração do estabelecimento
    onboardingChecklist: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) return null;

        // 1. Verificar se tem categorias
        const categories = await db.getCategoriesByEstablishment(input.establishmentId);
        const hasCategories = categories.length > 0;

        // 2. Verificar se tem produtos
        const productsResult = await db.getProductsByEstablishment(input.establishmentId);
        const hasProducts = (productsResult?.products?.length ?? 0) > 0;

        // 3. Verificar se configurou atendimento (horários de funcionamento)
        // O checklist deve validar que o restaurante definiu ao menos um dia activo
        // com horário completo, pois há operações legítimas que abrem em poucos dias.
        const businessHours = await db.getBusinessHoursByEstablishment(input.establishmentId);
        const activeConfiguredDays = new Set(
          businessHours
            .filter(h => h.isActive && h.openTime && h.closeTime)
            .map(h => h.dayOfWeek)
        );
        const hasBusinessHours = activeConfiguredDays.size > 0;

        // 4. Verificar se conectou WhatsApp
        const whatsappCfg = await db.getWhatsappConfig(input.establishmentId);
        const hasWhatsappConnected = whatsappCfg?.status === 'connected';

        // 5. Verificar se tem pedidos (testou um pedido)
        const recentOrders = await db.getRecentOrders(input.establishmentId, 1);
        const hasOrders = recentOrders.length > 0;

        // 6. Verificar se adicionou foto e capa
        const hasLogo = !!establishment.logo;
        const hasCover = !!establishment.coverImage;
        const hasPhotos = hasLogo && hasCover;

        // 7. Verificar se cadastrou chave Pix
        const hasPixKey = !!establishment.pixKey && establishment.pixKey.trim().length > 0;

        const steps = [
          { id: 'category', label: 'Criar primeira categoria', completed: hasCategories, href: '/catalogo?action=new-category' },
          { id: 'products', label: 'Adicionar primeiros produtos', completed: hasProducts, href: '/catalogo?action=new-product' },
          { id: 'business_hours', label: 'Configurar atendimento', completed: hasBusinessHours, href: '/configuracoes?section=atendimento&scrollTo=horarios-funcionamento' },
          { id: 'photos', label: 'Adicionar foto e capa', completed: hasPhotos, href: '/configuracoes?section=estabelecimento' },
          { id: 'pix_key', label: 'Cadastrar chave Pix', completed: hasPixKey, href: '/configuracoes?section=atendimento&scrollTo=formas-pagamento' },
          { id: 'whatsapp', label: 'Conectar WhatsApp', completed: hasWhatsappConnected, href: '/pedidos?connectWhatsapp=true' },
          { id: 'sound_notification', label: 'Ativar notificação sonora', completed: false, href: '#sound' },
          { id: 'test_order', label: 'Testar um pedido', completed: hasOrders, href: establishment.menuSlug ? `/menu/${establishment.menuSlug}` : '/pdv' },
        ];

        const completedCount = steps.filter(s => s.completed).length;
        const allCompleted = completedCount === steps.length;

        // Etapas "core" (permanentes) — exclui sound_notification e whatsapp que são voláteis
        // sound_notification: sempre false no backend (controlado por localStorage do browser)
        // whatsapp: pode desconectar a qualquer momento
        const volatileStepIds = ['sound_notification', 'whatsapp'];
        const coreSteps = steps.filter(s => !volatileStepIds.includes(s.id));
        const coreCompletedCount = coreSteps.filter(s => s.completed).length;
        const coreAllCompleted = coreCompletedCount === coreSteps.length;

        return {
          steps,
          completedCount,
          totalSteps: steps.length,
          allCompleted,
          coreAllCompleted,
          establishmentName: establishment.name,
          menuSlug: establishment.menuSlug || null,
        };
      }),
  });
