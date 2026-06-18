import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { asc, desc } from "drizzle-orm";
import { assertEstablishmentOwnership } from "./helpers";
import { assertCanCreateProduct, assertCanUseStockControl } from "./planGuard";
import { auditLog } from '../_core/auditLog';
import { logger } from "../_core/logger";
import { mindiStoragePut } from "../mindiStorage";
import { nanoid } from "nanoid";
import { processImage, processSingleImage, generateBlurPlaceholder } from "../imageProcessor";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney, zMoneyOptional } from "../../shared/validation";
import { autoSyncPrice, autoSyncStatus, getProductMapping } from "../ifoodSync";
import { getIfoodConfig } from "../db";

export const productRouter = router({
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        version: z.enum(['draft', 'published']).optional(),
        search: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
        hasStock: z.boolean().optional(),
        orderBy: z.enum(["name", "price", "salesCount"]).optional(),
        orderDir: z.enum(["asc", "desc"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, ...filters } = input;
        const result = await db.getProductsByEstablishment(establishmentId, filters);
        
        // Calcular quais produtos estão bloqueados pelo limite do plano
        const est = await db.getEstablishmentById(establishmentId);
        const planType = est?.planType ?? 'trial';
        const limits = (await import('../../shared/planLimits')).getPlanLimits(planType);
        
        if (limits.maxProducts !== null && result.products) {
          // Query LEVE: buscar apenas id, categoryId, sortOrder, status (sem complementCount)
          const allProducts = await db.getActiveProductIdsForPlanLimit(establishmentId, input.version || 'draft');
          const allCategories = await db.getCategoriesByEstablishment(establishmentId, input.version || 'draft');
          
          // Criar mapa de sortOrder das categorias para ordenar produtos por categoria
          const categorySortMap = new Map<number, number>();
          allCategories.forEach((cat: any) => categorySortMap.set(cat.id, cat.sortOrder));
          
          // Filtrar apenas produtos ativos e ordená-los pela ordem das categorias, depois pelo sortOrder do produto
          const activeProducts = allProducts
            .filter((p: any) => p.status === 'active')
            .sort((a: any, b: any) => {
              const catSortA = categorySortMap.get(a.categoryId ?? 0) ?? 999999;
              const catSortB = categorySortMap.get(b.categoryId ?? 0) ?? 999999;
              if (catSortA !== catSortB) return catSortA - catSortB;
              return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            });
          
          // Os primeiros N produtos (seguindo a ordem das categorias) são os permitidos
          const allowedIds = new Set(activeProducts.slice(0, limits.maxProducts).map((p: any) => p.id));
          
          // Marcar produtos que excedem o limite
          const productsWithPlanInfo = result.products.map((p: any) => ({
            ...p,
            planBlocked: p.status === 'active' && !allowedIds.has(p.id),
          }));
          
          return {
            ...result,
            products: productsWithPlanInfo,
            planLimit: limits.maxProducts,
            activeCount: activeProducts.length,
          };
        }
        
        return {
          ...result,
          products: result.products?.map((p: any) => ({ ...p, planBlocked: false })) || [],
          planLimit: null,
          activeCount: null,
        };
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
        return product;
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number().nullable().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: zMoney,
        images: z.array(z.string()).optional(),
        blurPlaceholder: z.string().nullable().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
        stockQuantity: z.number().nullable().optional(),
        hasStock: z.boolean().optional(),
        printerId: z.number().nullable().optional(),
        cost: z.string().nullable().optional(),
        promotionalPrice: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await assertCanCreateProduct(input.establishmentId);
        // Bloquear controle de estoque no plano Free
        if (input.hasStock) {
          await assertCanUseStockControl(input.establishmentId);
        }
        const id = await db.createProduct(input);
        // Criar automaticamente item de estoque quando controle de estoque está ativado
        if (input.hasStock) {
          try {
            await db.createStockItem({
              establishmentId: input.establishmentId,
              name: input.name,
              currentQuantity: input.stockQuantity ? String(input.stockQuantity) : "0",
              minQuantity: "0",
              unit: "unidade",
              linkedProductId: id,
            });
          } catch (e) {
            logger.error("Erro ao criar item de estoque automaticamente:", e);
          }
        }
        auditLog({ type: "product.create", userId: ctx.user.id, establishmentId: input.establishmentId, metadata: { productId: id } });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().nullable().optional(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        price: zMoneyOptional,
        images: z.array(z.string()).nullable().optional(),
        blurPlaceholder: z.string().nullable().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
        stockQuantity: z.number().nullable().optional(),
        hasStock: z.boolean().optional(),
        printerId: z.number().nullable().optional(),
        cost: z.string().nullable().optional(),
        promotionalPrice: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        // Verificar se o produto existe e ownership
        const existingProduct = await db.getProductById(id);
        if (!existingProduct) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, existingProduct.establishmentId);
        // Bloquear controle de estoque no plano Free
        if (input.hasStock === true) {
          await assertCanUseStockControl(existingProduct.establishmentId);
        }
        await db.updateProduct(id, data);
        // Se desativou controle de estoque, remover item de estoque vinculado
        if (input.hasStock === false) {
          try {
            const existingStockItem = await db.getStockItemByLinkedProductId(id);
            if (existingStockItem) {
              await db.deleteStockItem(existingStockItem.id);
              logger.info(`[Estoque] Removido item de estoque vinculado ao produto ${id}`);
            }
          } catch (e) {
            logger.error("Erro ao remover item de estoque automaticamente:", e);
          }
        }
        // Se ativou controle de estoque, verificar se já existe item de estoque vinculado
        if (input.hasStock && existingProduct) {
          try {
            const existingStockItem = await db.getStockItemByLinkedProductId(id);
            if (!existingStockItem) {
              // Criar item de estoque vinculado ao produto
              await db.createStockItem({
                establishmentId: existingProduct.establishmentId,
                name: input.name || existingProduct.name,
                currentQuantity: input.stockQuantity !== undefined && input.stockQuantity !== null ? String(input.stockQuantity) : "0",
                minQuantity: "0",
                unit: "unidade",
                linkedProductId: id,
              });
            } else {
              // Atualizar quantidade do item de estoque existente
              await db.updateStockItem(existingStockItem.id, {
                currentQuantity: input.stockQuantity !== undefined && input.stockQuantity !== null ? String(input.stockQuantity) : existingStockItem.currentQuantity,
                name: input.name || existingStockItem.name,
              });
            }
          } catch (e) {
            logger.error("Erro ao criar/atualizar item de estoque automaticamente:", e);
          }
        }
        // Sincronizar stockItem vinculado quando apenas stockQuantity é atualizado (sem hasStock no input)
        // Isso cobre o caso de edição inline no catálogo
        if (input.hasStock === undefined && input.stockQuantity !== undefined && existingProduct.hasStock) {
          try {
            const existingStockItem = await db.getStockItemByLinkedProductId(id);
            if (existingStockItem) {
              await db.updateStockItem(existingStockItem.id, {
                currentQuantity: input.stockQuantity !== null ? String(input.stockQuantity) : existingStockItem.currentQuantity,
              });
              logger.info(`[Estoque] StockItem sincronizado para produto ${id}: qty=${input.stockQuantity}`);
            }
          } catch (e) {
            logger.error("Erro ao sincronizar stockItem automaticamente:", e);
          }
        }
        // Invalidar cache do menu público
        db.invalidatePublicMenuCache(existingProduct.establishmentId);
        
        // Auto-sync com iFood se houver mapeamento
        try {
          const ifoodConfig = await getIfoodConfig(existingProduct.establishmentId);
          if (ifoodConfig?.merchantId) {
            if (data.price !== undefined || data.promotionalPrice !== undefined) {
              const updatedProduct = await db.getProductById(id);
              if (updatedProduct) {
                const price = parseFloat(String(updatedProduct.price)) || 0;
                const promoPrice = updatedProduct.promotionalPrice ? parseFloat(String(updatedProduct.promotionalPrice)) : undefined;
                await autoSyncPrice(
                  existingProduct.establishmentId,
                  ifoodConfig.merchantId,
                  id,
                  promoPrice || price,
                  promoPrice ? price : undefined
                );
              }
            }
            if (data.status) {
              await autoSyncStatus(
                existingProduct.establishmentId,
                ifoodConfig.merchantId,
                id,
                data.status
              );
            }
          }
        } catch (e) {
          logger.error("[iFood Auto-Sync] Erro ao sincronizar produto com iFood:", e);
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
        await db.deleteProduct(input.id);
        auditLog({ type: "product.delete", userId: ctx.user.id, establishmentId: product.establishmentId, metadata: { productId: input.id } });
        return { success: true };
      }),

    toggleStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "paused"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
        
        // Se está tentando ativar, verificar se o produto está dentro do limite do plano
        if (input.status === 'active') {
          const est = await db.getEstablishmentById(product.establishmentId);
          const planType = est?.planType ?? 'trial';
          const limits = (await import('../../shared/planLimits')).getPlanLimits(planType);
          if (limits.maxProducts !== null) {
            const allProducts = await db.getProductsByEstablishment(product.establishmentId, {});
            const activeProducts = Array.isArray(allProducts) 
              ? allProducts.filter((p: any) => p.status === 'active') 
              : (allProducts?.products?.filter((p: any) => p.status === 'active') ?? []);
            if (activeProducts.length >= limits.maxProducts) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: `Limite de ${limits.maxProducts} produtos ativos atingido no plano atual. Faça upgrade para ativar mais produtos.`,
              });
            }
          }
        }
        
        await db.toggleProductStatus(input.id, input.status);
        
        // Auto-sync status com iFood se houver mapeamento
        try {
          const ifoodConfig = await getIfoodConfig(product.establishmentId);
          if (ifoodConfig?.merchantId) {
            await autoSyncStatus(
              product.establishmentId,
              ifoodConfig.merchantId,
              input.id,
              input.status
            );
          }
        } catch (e) {
          logger.error("[iFood Auto-Sync] Erro ao sincronizar status com iFood:", e);
        }
        
        return { success: true };
      }),
    
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
        await assertCanCreateProduct(product.establishmentId);
        const newId = await db.duplicateProduct(input.id);
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
        const firstProduct = await db.getProductById(input[0].id);
        if (!firstProduct) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, firstProduct.establishmentId);
        await db.reorderProducts(input);
        return { success: true };
      }),

    // Melhorar imagem do produto com IA (Nano Banana)
    enhanceImage: protectedProcedure
      .input(z.object({
        productId: z.number(),
        imageUrl: z.string().url(),
        imageIndex: z.number().default(0), // Índice da imagem no array de images
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);

        // Verificar créditos de imagem IA
        const credits = await db.getAiImageCredits(product.establishmentId);
        if (credits <= 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Seus créditos de melhoria de imagem acabaram. Compre mais créditos para continuar.' });
        }

        const { enhanceProductImage } = await import('../imageEnhancer');
        const result = await enhanceProductImage(input.imageUrl, product.establishmentId);

        // Baixar a imagem melhorada e aplicar o mesmo pipeline de otimização do upload normal
        const enhancedResponse = await fetch(result.enhancedUrl);
        if (!enhancedResponse.ok) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao baixar imagem melhorada para otimização' });
        }
        const enhancedBuffer = Buffer.from(await enhancedResponse.arrayBuffer());

        // Processar: WebP + resize (1200px main + 400px thumb) + blur placeholder
        const processed = await processImage(enhancedBuffer);
        const id = nanoid(12);
        const folder = `est/${product.establishmentId}/products`;
        const mainFileName = `${folder}/enhanced_${id}.webp`;
        const thumbFileName = `${folder}/enhanced_${id}_thumb.webp`;

        const [mainResult, thumbResult] = await Promise.all([
          mindiStoragePut(mainFileName, processed.mainBuffer, "image/webp"),
          mindiStoragePut(thumbFileName, processed.thumbBuffer, "image/webp"),
        ]);

        const optimizedUrl = mainResult.url;

        // Atualizar o array enhancedImages do produto
        const currentEnhanced = (product.enhancedImages as string[] | null) || [];
        const newEnhanced = [...currentEnhanced];
        // Garantir que o array tem o tamanho correto
        while (newEnhanced.length <= input.imageIndex) {
          newEnhanced.push('');
        }
        newEnhanced[input.imageIndex] = optimizedUrl;

        // Atualizar blurPlaceholder se for a primeira imagem
        const updateData: any = { enhancedImages: newEnhanced };
        if (input.imageIndex === 0) {
          updateData.blurPlaceholder = processed.blurDataUrl;
        }

        await db.updateProduct(input.productId, updateData);

        // Consumir 1 crédito após sucesso
        const remainingCredits = await db.consumeAiImageCredit(product.establishmentId, ctx.user.id);

        return {
          enhancedUrl: optimizedUrl,
          originalUrl: result.originalUrl,
          remainingCredits: remainingCredits ?? 0,
        };
      }),

    // Reverter imagem melhorada para a original
    revertEnhancedImage: protectedProcedure
      .input(z.object({
        productId: z.number(),
        imageIndex: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);

        const currentEnhanced = (product.enhancedImages as string[] | null) || [];
        const newEnhanced = [...currentEnhanced];
        if (input.imageIndex < newEnhanced.length) {
          newEnhanced[input.imageIndex] = '';
        }

         await db.updateProduct(input.productId, {
          enhancedImages: newEnhanced,
        });
        return { success: true };
      }),
    toggleUpsellPinned: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
        const newValue = !product.isUpsellPinned;
        await db.updateProduct(input.id, { isUpsellPinned: newValue });
        db.invalidatePublicMenuCache(product.establishmentId);
        return { success: true, isUpsellPinned: newValue };
      }),

    batchPromo: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number(),
        discountPercent: z.number().min(1).max(99),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const result = await db.getProductsByEstablishment(input.establishmentId, {
          categoryId: input.categoryId,
          status: 'active',
        });
        let updated = 0;
        for (const product of result.products) {
          const originalPrice = Number(product.price);
          if (originalPrice <= 0) continue;
          const promoPrice = (originalPrice * (1 - input.discountPercent / 100)).toFixed(2);
          await db.updateProduct(product.id, { promotionalPrice: promoPrice });
          updated++;
        }
        db.invalidatePublicMenuCache(input.establishmentId);
        auditLog({ type: 'product.update', userId: ctx.user.id, establishmentId: input.establishmentId, metadata: { action: 'batchPromo', categoryId: input.categoryId, discountPercent: input.discountPercent, updated } });
        return { success: true, updated };
      }),

    batchRemovePromo: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const result = await db.getProductsByEstablishment(input.establishmentId, {
          categoryId: input.categoryId,
        });
        let updated = 0;
        for (const product of result.products) {
          if (product.promotionalPrice && Number(product.promotionalPrice) > 0) {
            await db.updateProduct(product.id, { promotionalPrice: null });
            updated++;
          }
        }
        db.invalidatePublicMenuCache(input.establishmentId);
        auditLog({ type: 'product.update', userId: ctx.user.id, establishmentId: input.establishmentId, metadata: { action: 'batchRemovePromo', categoryId: input.categoryId, updated } });
        return { success: true, updated };
      }),
});
