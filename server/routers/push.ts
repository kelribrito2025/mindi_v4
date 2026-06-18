import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const pushRouter = router({
    // Obter chave pública VAPID para o cliente
    getVapidPublicKey: publicProcedure
      .query(async () => {
        const { getVapidPublicKey } = await import('../_core/webPush');
        return { publicKey: getVapidPublicKey() };
      }),
    
    // Registrar subscription de push
    subscribe: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Usuário não autenticado',
          });
        }
        
        const id = await db.upsertPushSubscription({
          establishmentId: input.establishmentId,
          userId,
          endpoint: input.subscription.endpoint,
          p256dh: input.subscription.keys.p256dh,
          auth: input.subscription.keys.auth,
          userAgent: input.userAgent,
        });
        
        logger.info(`[Push] Subscription registrada para estabelecimento ${input.establishmentId}, usuário ${userId}`);
        
        return { success: true, id };
      }),
    
    // Cancelar subscription de push
    unsubscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePushSubscription(input.endpoint);
        logger.info('[Push] Subscription removida');
        return { success: true };
      }),
    
    // Listar subscriptions do estabelecimento (para debug/admin)
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getPushSubscriptionsByEstablishment(input.establishmentId);
      }),
    
    // Enviar notificação de teste
    sendTest: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { sendPushNotification } = await import('../_core/webPush');
        const subscriptions = await db.getPushSubscriptionsByEstablishment(input.establishmentId);
        
        if (subscriptions.length === 0) {
          return { success: false, message: 'Nenhuma subscription encontrada' };
        }
        
        let sent = 0;
        let failed = 0;
        
        for (const sub of subscriptions) {
          try {
            const success = await sendPushNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              {
                title: '🔔 Teste de Notificação',
                body: 'Esta é uma notificação de teste do sistema de pedidos.',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: 'test-notification',
                vibrate: [200, 100, 200],
              }
            );
            
            if (success) {
              sent++;
            } else {
              // Subscription inválida, remover
              await db.deletePushSubscriptionById(sub.id);
              failed++;
            }
          } catch (error) {
            logger.error('[Push] Erro ao enviar notificação de teste:', error);
            failed++;
          }
        }
        
        return { 
          success: sent > 0, 
          message: `Enviadas: ${sent}, Falhas: ${failed}`,
          sent,
          failed,
        };
      }),
  });
