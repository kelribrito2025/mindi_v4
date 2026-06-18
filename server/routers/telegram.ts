import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { sendTelegramTestMessage } from "../telegramNotifier";

export const telegramRouter = router({
  // Buscar configuração atual do Telegram
  getConfig: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const config = await db.getTelegramConfig(input.establishmentId);
      return config ?? { enabled: false, chatId: null };
    }),

  // Conectar Telegram (salvar chat_id e ativar)
  connect: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      chatId: z.string().min(1, "Chat ID é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

      // Validar o chat_id enviando uma mensagem de teste
      const testResult = await sendTelegramTestMessage(input.chatId);
      if (!testResult.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Não foi possível enviar mensagem para este Chat ID. Verifique se o bot @Mindi_pedidos_bot foi adicionado ao chat. Erro: ${testResult.error}`,
        });
      }

      await db.saveTelegramConfig(input.establishmentId, input.chatId);
      logger.info(`[Telegram] Conectado para estabelecimento ${input.establishmentId}, chatId: ${input.chatId}`);

      return { success: true, message: "Telegram conectado com sucesso!" };
    }),

  // Desconectar Telegram
  disconnect: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      await db.disconnectTelegram(input.establishmentId);
      logger.info(`[Telegram] Desconectado para estabelecimento ${input.establishmentId}`);
      return { success: true };
    }),

  // Enviar mensagem de teste
  sendTest: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

      const config = await db.getTelegramConfig(input.establishmentId);
      if (!config?.chatId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Telegram não está configurado. Conecte primeiro.",
        });
      }

      const result = await sendTelegramTestMessage(config.chatId);
      if (!result.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha ao enviar mensagem de teste: ${result.error}`,
        });
      }

      return { success: true, message: "Mensagem de teste enviada!" };
    }),

  // Toggle ativar/desativar notificações
  toggle: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

      // Verificar se tem chat_id antes de ativar
      if (input.enabled) {
        const config = await db.getTelegramConfig(input.establishmentId);
        if (!config?.chatId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Conecte o Telegram primeiro antes de ativar as notificações.",
          });
        }
      }

      await db.toggleTelegramEnabled(input.establishmentId, input.enabled);
      logger.info(`[Telegram] Notificações ${input.enabled ? "ativadas" : "desativadas"} para estabelecimento ${input.establishmentId}`);
      return { success: true, enabled: input.enabled };
    }),
});
