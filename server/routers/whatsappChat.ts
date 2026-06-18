import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

async function getEstabId(userId: number): Promise<number> {
  const est = await db.getEstablishmentByUserId(userId);
  if (!est) throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento não encontrado" });
  return est.id;
}

export const whatsappChatRouter = router({
  /**
   * Envia uma mensagem de texto via UAZAPI.
   * O frontend salva a mensagem no localStorage.
   * Aceita remoteJid (string) para identificar o destinatário.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(), // legacy, ignorado
        text: z.string().min(1).max(4096),
        remoteJid: z.string().min(1), // ex: "5511987654321@s.whatsapp.net"
      })
    )
    .mutation(async ({ ctx, input }) => {
      const establishmentId = await getEstabId(ctx.user.id);

      const config = await db.getWhatsappConfig(establishmentId);
      if (!config || config.status !== 'connected') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp não configurado ou desconectado" });
      }

      const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
      const wa = await getWhatsAppProvider(establishmentId);

      // Extrair telefone do remoteJid
      const phone = input.remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
      const result = await wa.sendText(phone, input.text);

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao enviar mensagem" });
      }

      return {
        success: true,
        messageId: result.messageId || null,
      };
    }),

  /**
   * Assumir conversa (mudar de bot para human).
   * Aceita remoteJid (string) para identificar a conversa.
   * Tenta atualizar no banco se a conversa existir lá (para o n8n saber).
   */
  takeOver: protectedProcedure
    .input(z.object({ conversationId: z.string() })) // remoteJid
    .mutation(async ({ ctx, input }) => {
      const establishmentId = await getEstabId(ctx.user.id);

      // Tentar atualizar no banco se a conversa existir (para o bot/n8n saber)
      try {
        const conv = await db.getConversationByRemoteJid(establishmentId, input.conversationId);
        if (conv) {
          await db.updateConversationStatus(conv.id, "human");
        }
      } catch {
        // Não bloquear se não existir no banco
      }

      return { success: true };
    }),

  /**
   * Devolver conversa ao bot.
   * Aceita remoteJid (string) para identificar a conversa.
   */
  returnToBot: protectedProcedure
    .input(z.object({ conversationId: z.string() })) // remoteJid
    .mutation(async ({ ctx, input }) => {
      const establishmentId = await getEstabId(ctx.user.id);

      // Tentar atualizar no banco se a conversa existir (para o bot/n8n saber)
      try {
        const conv = await db.getConversationByRemoteJid(establishmentId, input.conversationId);
        if (conv) {
          await db.updateConversationStatus(conv.id, "bot");
        }
      } catch {
        // Não bloquear se não existir no banco
      }

      return { success: true };
    }),

  /**
   * Retorna mapa de telefones de entregadores cadastrados.
   * Usado pelo frontend para cross-referenciar contatos do chat com entregadores.
   * Retorna: { [phoneNormalized]: driverName }
   */
  getDriverPhones: protectedProcedure
    .query(async ({ ctx }) => {
      const establishmentId = await getEstabId(ctx.user.id);
      const allDrivers = await db.getDriversByEstablishment(establishmentId);

      // Normalizar telefones dos entregadores para facilitar comparação
      // Remove tudo que não é dígito e garante que tenha código do país
      const driverMap: Record<string, string> = {};
      for (const driver of allDrivers) {
        if (!driver.whatsapp) continue;
        const clean = driver.whatsapp.replace(/\D/g, "");
        // Armazenar com e sem código do país para garantir match
        const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
        const withoutCountry = clean.startsWith("55") ? clean.slice(2) : clean;
        driverMap[withCountry] = driver.name;
        driverMap[withoutCountry] = driver.name;
        // Também armazenar o número original limpo
        driverMap[clean] = driver.name;
      }

      return driverMap;
    }),
  // ==================== PUBLIC CHAT (Admin side) ====================

  /**
   * Lista conversas do chat público (agrupadas por orderId).
   * Retorna conversas com última mensagem, unread count, etc.
   */
  getPublicConversations: protectedProcedure
    .query(async ({ ctx }) => {
      const establishmentId = await getEstabId(ctx.user.id);
      return db.getPublicChatConversations(establishmentId);
    }),

  /**
   * Busca mensagens de uma conversa do chat público (por orderId).
   */
  getPublicMessages: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const establishmentId = await getEstabId(ctx.user.id);
      // Verify the order belongs to this establishment
      const order = await db.getOrderById(input.orderId);
      if (!order || order.establishmentId !== establishmentId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      return db.getPublicChatMessages(input.orderId);
    }),

  /**
   * Admin responde ao cliente no chat público.
   * Salva no DB e envia via SSE para o cliente.
   */
  sendPublicReply: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      content: z.string().min(1).max(4096),
    }))
    .mutation(async ({ ctx, input }) => {
      const establishmentId = await getEstabId(ctx.user.id);

      // Verify the order belongs to this establishment
      const order = await db.getOrderById(input.orderId);
      if (!order || order.establishmentId !== establishmentId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      // Save message to DB
      const messageId = await db.createPublicChatMessage({
        establishmentId,
        orderId: input.orderId,
        customerPhone: order.customerPhone || '',
        customerName: order.customerName || null,
        content: input.content,
        direction: "outgoing",
        isRead: true, // admin's own message is always read
      });

      // Send to customer via public chat SSE
      const { notifyPublicChatNewMessage } = await import('../_core/sse');
      notifyPublicChatNewMessage(establishmentId, input.orderId, {
        id: messageId,
        content: input.content,
        direction: 'outgoing',
        createdAt: new Date().toISOString(),
      });

      return { success: true, messageId };
    }),

  /**
   * Marca mensagens do chat público como lidas (para um pedido).
   */
  markPublicAsRead: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const establishmentId = await getEstabId(ctx.user.id);
      // Verify the order belongs to this establishment
      const order = await db.getOrderById(input.orderId);
      if (!order || order.establishmentId !== establishmentId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      await db.markPublicChatAsRead(input.orderId);
      return { success: true };
    }),

  /**
   * Retorna contagem total de mensagens não lidas do chat público.
   */
  getPublicUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const establishmentId = await getEstabId(ctx.user.id);
      const count = await db.getPublicChatUnreadCount(establishmentId);
      return { count };
    }),
});
