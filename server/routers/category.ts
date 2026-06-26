import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { assertCanCreateCategory, assertCanScheduleCategory } from "./planGuard";
import { z } from "zod";

export const categoryRouter = router({
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number(), version: z.enum(['draft', 'published']).optional() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const categories = await db.getCategoriesByEstablishment(input.establishmentId, input.version || 'draft');
        
        // Calcular quais categorias estão bloqueadas pelo limite do plano
        const est = await db.getEstablishmentById(input.establishmentId);
        const planType = est?.planType ?? 'trial';
        const limits = (await import('../../shared/planLimits')).getPlanLimits(planType);
        
        if (limits.maxCategories !== null) {
          const activeCategories = categories.filter((c: any) => c.isActive);
          const allowedIds = new Set(activeCategories.slice(0, limits.maxCategories).map((c: any) => c.id));
          return categories.map((c: any) => ({
            ...c,
            planBlocked: c.isActive && !allowedIds.has(c.id),
          }));
        }
        
        return categories.map((c: any) => ({ ...c, planBlocked: false }));
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await assertCanCreateCategory(input.establishmentId);
        const id = await db.createCategory(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        availabilityType: z.enum(["always", "scheduled"]).optional(),
        availableDays: z.array(z.number()).nullable().optional(),
        availableHours: z.array(z.object({
          day: z.number(),
          startTime: z.string(),
          endTime: z.string(),
        })).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, category.establishmentId);
        // Bloquear agendamento de disponibilidade no plano Free
        if (input.availabilityType === 'scheduled') {
          await assertCanScheduleCategory(category.establishmentId);
        }
        // Se está tentando ativar, verificar limite do plano
        if (input.isActive === true) {
          const est = await db.getEstablishmentById(category.establishmentId);
          const planType = est?.planType ?? 'trial';
          const limits = (await import('../../shared/planLimits')).getPlanLimits(planType);
          if (limits.maxCategories !== null) {
            const allCategories = await db.getCategoriesByEstablishment(category.establishmentId);
            const activeCategories = allCategories.filter((c: any) => c.isActive);
            if (activeCategories.length >= limits.maxCategories) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: `Limite de ${limits.maxCategories} categorias ativas atingido no plano atual. Faça upgrade para ativar mais categorias.`,
              });
            }
          }
        }
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        // Invalidar cache do menu publico ao alterar categoria
        db.invalidatePublicMenuCache();
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, category.establishmentId);
        await db.deleteCategory(input.id);
        return { success: true };
      }),
    
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, category.establishmentId);
        await assertCanCreateCategory(category.establishmentId);
        const newId = await db.duplicateCategory(input.id);
        return { id: newId };
      }),

    reorder: protectedProcedure
      .input(z.array(z.object({
        id: z.number(),
        sortOrder: z.number(),
      })))
      .mutation(async ({ ctx, input }) => {
        if (input.length === 0) {
          return { success: true };
        }
        // Verificar ownership da primeira categoria para validar acesso
        const firstCategory = await db.getCategoryById(input[0].id);
        if (!firstCategory) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, firstCategory.establishmentId);
        await db.reorderCategories(input);
        return { success: true };
      }),
    toggleUpsell: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
        }
        await assertEstablishmentOwnership(ctx.user.id, category.establishmentId);
        const newValue = !category.isUpsell;
        let limitApplied = false;
        let totalProducts = 0;
        // Se está ativando e a categoria tem mais de 9 produtos ativos,
        // marcar a categoria como sugestão mas limitar a exibição no getUpsellSuggestions (já faz limit)
        // Não bloquear — apenas informar ao usuário que só os primeiros 9 serão exibidos
        if (newValue) {
          const { total: activeCount } = await db.getProductsByEstablishment(category.establishmentId, { categoryId: input.id, status: 'active', limit: 1 });
          totalProducts = activeCount;
          if (activeCount > 9) {
            limitApplied = true;
          }
        }
        await db.updateCategory(input.id, { isUpsell: newValue });
        db.invalidatePublicMenuCache(category.establishmentId);
        return { 
          success: true, 
          isUpsell: newValue,
          limitApplied,
          totalProducts,
          message: limitApplied 
            ? `Categoria marcada como sugestão. Esta categoria tem ${totalProducts} produtos ativos — apenas os 9 primeiros serão exibidos como sugestão.`
            : undefined
        };
      }),
    createPizzaCategory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        priceRule: z.enum(["highest", "average"]),
        isActive: z.boolean(),
        sizes: z.array(z.object({
          name: z.string().min(1),
          slices: z.number().min(1),
          maxFlavors: z.number().min(1).max(4),
          imageUrl: z.string().nullable(),
          pdvCode: z.string().nullable(),
          isActive: z.boolean(),
        })),
        crusts: z.array(z.object({
          name: z.string().min(1),
          price: z.string(),
          pdvCode: z.string().nullable(),
          isActive: z.boolean(),
        })),
        edges: z.array(z.object({
          name: z.string().min(1),
          price: z.string(),
          pdvCode: z.string().nullable(),
          isActive: z.boolean(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await assertCanCreateCategory(input.establishmentId);
        const categoryId = await db.createPizzaCategory(input);
        return { id: categoryId };
      }),
  
    getPizzaConfig: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ ctx, input }) => {
        const config = await db.getPizzaConfigByCategory(input.categoryId);
        return config;
      }),

    updatePizzaSize: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slices: z.number().optional(),
        maxFlavors: z.number().optional(),
        price: z.string().optional(),
        pdvCode: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updatePizzaSize(id, data);
        return { success: true };
      }),

    addPizzaSize: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        establishmentId: z.number().optional(),
        name: z.string().min(1),
        slices: z.number(),
        maxFlavors: z.number(),
        price: z.string(),
        pdvCode: z.string().nullable(),
        isActive: z.boolean(),
        sortOrder: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get establishmentId from category if not provided
        let establishmentId = input.establishmentId;
        if (!establishmentId) {
          const cat = await db.getCategoryById(input.categoryId);
          establishmentId = cat?.establishmentId || 1;
        }
        await db.addPizzaSize({ ...input, establishmentId });
        return { success: true };
      }),

    deletePizzaSize: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePizzaSize(input.id);
        return { success: true };
      }),

    updatePizzaCrust: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.string().optional(),
        pdvCode: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updatePizzaCrust(id, data);
        return { success: true };
      }),

    addPizzaCrust: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string().min(1),
        price: z.string(),
        pdvCode: z.string().nullable(),
        isActive: z.boolean(),
        sortOrder: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addPizzaCrust(input);
        return { success: true };
      }),

    deletePizzaCrust: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePizzaCrust(input.id);
        return { success: true };
      }),

    updatePizzaEdge: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.string().optional(),
        pdvCode: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updatePizzaEdge(id, data);
        return { success: true };
      }),

    addPizzaEdge: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string().min(1),
        price: z.string(),
        pdvCode: z.string().nullable(),
        isActive: z.boolean(),
        sortOrder: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addPizzaEdge(input);
        return { success: true };
      }),

    deletePizzaEdge: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePizzaEdge(input.id);
        return { success: true };
      }),
});
