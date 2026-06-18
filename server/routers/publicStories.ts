import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const publicStoriesRouter = router({
    // Listar stories ativos de um estabelecimento (público)
    getActive: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const stories = await db.getActiveStoriesByEstablishment(input.establishmentId);

        // O admin pode vincular stories ao productId da versão draft, enquanto o menu público
        // renderiza a versão publicada. Converter aqui mantém o botão "Ver produto" funcional.
        const resolvedStories = await Promise.all(
          stories.map(async (story) => {
            if (story.type === 'product' && story.productId) {
              const product = await db.getProductById(story.productId);
              if (product && product.version === 'draft' && product.publishedSourceId) {
                return { ...story, productId: product.publishedSourceId };
              }
            }
            return story;
          })
        );

        return resolvedStories;
      }),

    // Verificar se tem stories ativos (público, leve) - retorna IDs para comparação de cache
    hasActive: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const ids = await db.getActiveStoryIds(input.establishmentId);
        return { hasStories: ids.length > 0, count: ids.length, storyIds: ids };
      }),

    // Registar view de story (público)
    recordView: publicProcedure
      .input(z.object({ storyId: z.number(), sessionId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "sessionId deve conter apenas caracteres alfanuméricos, hífens e underscores") }))
      .mutation(async ({ input }) => {
        return db.recordStoryView(input.storyId, input.sessionId);
      }),

    // Registar evento de story (público) - click, add_to_cart, order_completed
    recordEvent: publicProcedure
      .input(z.object({
        storyId: z.number(),
        establishmentId: z.number(),
        eventType: z.enum(["click", "add_to_cart", "order_completed"]),
        productId: z.number().optional(),
        orderId: z.number().optional(),
        orderValue: z.string().optional(),
        sessionId: z.string().max(64).regex(/^[a-zA-Z0-9_-]+$/, "sessionId inválido").optional(),
      }))
      .mutation(async ({ input }) => {
        return db.recordStoryEvent({
          storyId: input.storyId,
          establishmentId: input.establishmentId,
          eventType: input.eventType,
          productId: input.productId ?? null,
          orderId: input.orderId ?? null,
          orderValue: input.orderValue ?? null,
          sessionId: input.sessionId ?? null,
        });
      }),
  });
