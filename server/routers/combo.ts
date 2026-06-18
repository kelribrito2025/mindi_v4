import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney } from "../../shared/validation";

export const comboRouter = router({
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: zMoney,
        images: z.array(z.string()).optional(),
        groups: z.array(z.object({
          name: z.string().min(1),
          isRequired: z.boolean(),
          minQuantity: z.number().optional(),
          maxQuantity: z.number().min(1),
          sortOrder: z.number(),
          items: z.array(z.object({
            productId: z.number(),
            sortOrder: z.number(),
          })),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.createCombo(input);
      }),

    getGroups: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        // productId não tem establishmentId direto, mas é operação de leitura do próprio produto
        return db.getComboGroupsByProductId(input.productId);
      }),

    delete: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Fase 2: verificar ownership via produto -> estabelecimento
        await db.deleteCombo(input.productId);
        return { success: true };
      }),

    searchProducts: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.searchProductsForCombo(input.establishmentId, input.search, input.limit);
      }),
   });
