import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const chatShortcutsRouter = router({
  // Listar atalhos do estabelecimento
  list: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.getChatShortcuts(input.establishmentId);
    }),

  // Criar novo atalho
  create: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      title: z.string().min(1).max(100),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return db.createChatShortcut({
        establishmentId: input.establishmentId,
        title: input.title,
        message: input.message,
      });
    }),

  // Atualizar atalho
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      title: z.string().min(1).max(100).optional(),
      message: z.string().min(1).max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const { id, establishmentId, ...data } = input;
      await db.updateChatShortcut(id, establishmentId, data);
      return { success: true };
    }),

  // Reordenar atalhos
  reorder: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      orderedIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.reorderChatShortcuts(input.establishmentId, input.orderedIds);
      return { success: true };
    }),

  // Excluir atalho
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.deleteChatShortcut(input.id, input.establishmentId);
      return { success: true };
    }),
});
