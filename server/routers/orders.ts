import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { buildDriverDeliveryMessage } from '../driverMessage';
import { buildDriverButtons } from '../driverButtons';
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createPixTransaction, refundPaytimeTransaction } from "../paytime";
import { confirmIfoodOrder, startIfoodOrderPreparation, readyToPickupIfoodOrder, dispatchIfoodOrder, requestIfoodOrderCancellation } from "../ifood";
import { hasAutomaticOrderNotifications } from "../../shared/planLimits";
import { generateStatusMessage, sendImageMessage, sendTextMessage } from "../_core/uazapi";
import QRCode from "qrcode";

// Helper: dado um orderId, busca o pedido e verifica ownership
async function assertOrderOwnership(userId: number, orderId: number) {
  const order = await db.getOrderById(orderId);
  if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
  await assertEstablishmentOwnership(userId, order.establishmentId);
  return order;
}

function getIfoodDeliveredBy(order: { externalData?: unknown } | null | undefined): string | null {
  if (!order?.externalData) return null;

  try {
    const data = typeof order.externalData === 'string'
      ? JSON.parse(order.externalData || '{}')
      : order.externalData;

    const deliveredBy = (data as any)?.delivery?.deliveredBy || (data as any)?.delivery?.delivered_by;
    return typeof deliveredBy === 'string' ? deliveredBy.toUpperCase() : null;
  } catch {
    return null;
  }
}

function isIfoodMarketplaceDelivery(order: { source?: string | null; deliveryType?: string | null; externalData?: unknown } | null | undefined): boolean {
  return order?.source === 'ifood' && order.deliveryType === 'delivery' && getIfoodDeliveredBy(order) === 'IFOOD';
}

async function notifyCustomerOutForDelivery(
  establishmentId: number,
  order: NonNullable<Awaited<ReturnType<typeof db.getOrderById>>>,
  context: string,
) {
  let customerNotified = false;

  try {
    const establishment = await db.getEstablishmentById(establishmentId);
    if (!hasAutomaticOrderNotifications(establishment?.planType)) {
      logger.info('[WhatsApp] Notificação automática ao cliente bloqueada para o plano:', establishment?.planType || 'desconhecido');
      return false;
    }

    if (order.customerPhone) {
      const config = await db.getWhatsappConfig(establishmentId);
      if (config && config.status === 'connected' && (config.notifyOnOutForDelivery !== false)) {
        const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
        const wa = await getWhatsAppProvider(establishmentId);
        if (wa.isAvailable()) {
          const orderItems = await db.getOrderItems(order.id);
          await wa.sendOrderNotification(
            order.customerPhone,
            'out_for_delivery',
            {
              customerName: order.customerName || 'Cliente',
              orderNumber: order.orderNumber,
              establishmentName: establishment?.name || 'Restaurante',
              template: config.templateOutForDelivery || null,
              deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
              cancellationReason: null,
              orderItems: orderItems.map(item => ({
                productName: item.productName,
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                complements: item.complements as Array<{ name: string; price: number; quantity: number }> | string | null,
                notes: item.notes,
              })),
              orderTotal: order.total,
              paymentMethod: order.paymentMethod,
              customerAddress: order.customerAddress,
            }
          );
          customerNotified = true;
          logger.info(`[markReadyAndAssign] Notificação de saída enviada ao CLIENTE (${context}) - Pedido ${order.orderNumber}`);
        }
      }
    }
  } catch (error) {
    logger.error(`[WhatsApp] Erro ao notificar cliente sobre saiu para entrega (${context}):`, error);
  }

  return customerNotified;
}

export const ordersRouter = router({
    // List all orders for admin
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        source: z.enum(["internal", "ifood", "rappi", "ubereats", "pdv"]).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getAllOrdersByEstablishment(input.establishmentId, {
          status: input.status,
          limit: input.limit,
          offset: input.offset,
          source: input.source,
          startDate: input.startDate,
          endDate: input.endDate,
        });
      }),
    
    // Get active orders (new, preparing, ready)
    getActive: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getActiveOrdersByEstablishment(input.establishmentId);
      }),
    
    // Get single order with items
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await assertOrderOwnership(ctx.user.id, input.id);
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
    
    // Update order status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]),
        cancellationReason: z.string().optional(),
        ifoodCancellationCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ownedOrder = await assertOrderOwnership(ctx.user.id, input.id);
        const isIfoodOrderWithExternalId = ownedOrder.source === 'ifood' && Boolean(ownedOrder.externalId);
        const normalizedIfoodCancellationCode = input.ifoodCancellationCode?.trim();
        let ifoodCancellationSynced = false;

        // Para pedidos iFood, o cancelamento precisa ser aceito pelo marketplace antes de alterar o status local.
        // Isso evita divergência em que o Mindi marca como cancelado, mas o iFood mantém o pedido ativo.
        if (input.status === 'cancelled' && isIfoodOrderWithExternalId) {
          if (!normalizedIfoodCancellationCode) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Selecione um motivo de cancelamento válido do iFood antes de cancelar o pedido.',
            });
          }

          try {
            await requestIfoodOrderCancellation(
              ownedOrder.externalId!,
              normalizedIfoodCancellationCode,
              ownedOrder.establishmentId,
              input.cancellationReason
            );
            ifoodCancellationSynced = true;
            logger.info(`[iFood Sync] Pedido ${ownedOrder.externalId} cancelamento aceito com código ${normalizedIfoodCancellationCode}`);
          } catch (cancelError: any) {
            const errorDetail = cancelError?.message || 'Erro desconhecido';
            logger.warn(`[iFood Sync] Cancelamento no iFood recusado para ${ownedOrder.externalId}: ${errorDetail}. Pedido mantido sem alteração local.`);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Cancelamento no iFood não aprovado: ${errorDetail}`,
            });
          }
        }

        await db.updateOrderStatus(input.id, input.status, input.cancellationReason);
        
        // Track iFood cancellation warning
        let ifoodWarning: string | null = null;
        
        // ─── Sincronizar status com iFood se pedido for de origem iFood ───
        const orderForIfood = await db.getOrderById(input.id);
        if (orderForIfood && orderForIfood.source === 'ifood' && orderForIfood.externalId) {
          const externalId = orderForIfood.externalId!;
          try {
            switch (input.status) {
              case 'preparing':
                // Aceitar pedido = confirm + startPreparation
                await confirmIfoodOrder(externalId, orderForIfood.establishmentId);
                await startIfoodOrderPreparation(externalId, orderForIfood.establishmentId);
                await db.updateOrderExternalStatus(input.id, 'CONFIRMED');
                logger.info(`[iFood Sync] Pedido ${externalId} confirmado e preparo iniciado`);
                break;
              case 'ready':
                await readyToPickupIfoodOrder(externalId, orderForIfood.establishmentId);
                await db.updateOrderExternalStatus(input.id, 'READY_TO_PICKUP');
                logger.info(`[iFood Sync] Pedido ${externalId} marcado como pronto (${getIfoodDeliveredBy(orderForIfood) || 'MERCHANT'})`);
                break;
              case 'out_for_delivery':
                if (isIfoodMarketplaceDelivery(orderForIfood)) {
                  logger.info(`[iFood Sync] Pedido ${externalId} entregue pelo iFood: dispatch MERCHANT ignorado; fluxo seguirá por eventos de logística`);
                  break;
                }

                await dispatchIfoodOrder(externalId, orderForIfood.establishmentId);
                await db.updateOrderExternalStatus(input.id, 'DISPATCHED');
                logger.info(`[iFood Sync] Pedido ${externalId} despachado como entrega própria MERCHANT`);
                break;
              case 'cancelled':
                if (ifoodCancellationSynced) {
                  logger.info(`[iFood Sync] Pedido ${externalId} cancelamento já sincronizado com código ${normalizedIfoodCancellationCode}`);
                } else if (normalizedIfoodCancellationCode) {
                  await requestIfoodOrderCancellation(
                    externalId,
                    normalizedIfoodCancellationCode,
                    orderForIfood.establishmentId,
                    input.cancellationReason
                  );
                  logger.info(`[iFood Sync] Pedido ${externalId} cancelamento solicitado com código ${normalizedIfoodCancellationCode}`);
                }
                await db.updateOrderExternalStatus(input.id, 'CANCELLED');
                break;
            }
          } catch (ifoodError: any) {
            logger.error('[iFood Sync] Erro ao sincronizar status com iFood:', {
              orderId: input.id,
              externalId: orderForIfood.externalId,
              status: input.status,
              error: ifoodError?.message,
            });
            // Não reverter o status local, mas informar o frontend do erro
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Status local atualizado, mas falhou ao sincronizar com iFood: ${ifoodError?.message || 'Erro desconhecido'}`,
            });
          }
        }
        
        // Enviar notificação via WhatsApp (fire-and-forget: não bloqueia a resposta ao frontend)
        // O status já foi salvo no banco, então a notificação é disparada em background
        const whatsappStatus = input.status;
        const whatsappOrderId = input.id;
        const whatsappCancellationReason = input.cancellationReason;
        
        (async () => {
          try {
            const order = await db.getOrderById(whatsappOrderId);
            if (order) {
              const orderEstablishment = await db.getEstablishmentById(order.establishmentId);
              if (!hasAutomaticOrderNotifications(orderEstablishment?.planType)) {
                logger.info('[WhatsApp] Notificação automática de status bloqueada para o plano:', orderEstablishment?.planType || 'desconhecido');
                return;
              }
            }
            if (order && order.customerPhone) {
              const config = await db.getWhatsappConfig(order.establishmentId);
              if (config && config.status === 'connected') {
                // Verificar se deve notificar para este status
                // Quando existem entregadores e pedido é delivery, suprimir notificação 'ready' ao cliente
                // O entregador é quem controla: ao clicar "Sair para entrega" o cliente será notificado
                let suppressReadyForDriver = false;
                if (whatsappStatus === 'ready' && order.deliveryType === 'delivery') {
                  const activeDrivers = await db.getActiveDriversByEstablishment(order.establishmentId);
                  if (activeDrivers.length > 0) {
                    suppressReadyForDriver = true;
                    logger.info('[WhatsApp] Notificação ready suprimida - entregador controla o fluxo');
                  }
                }
                
                const shouldNotify = 
                  (whatsappStatus === 'preparing' && config.notifyOnPreparing) ||
                  (whatsappStatus === 'ready' && config.notifyOnReady && !suppressReadyForDriver) ||
                  (whatsappStatus === 'out_for_delivery' && (config.notifyOnOutForDelivery !== false)) ||
                  (whatsappStatus === 'completed' && config.notifyOnCompleted) ||
                  (whatsappStatus === 'cancelled' && config.notifyOnCancelled);
                
                if (shouldNotify) {
                  const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
                  const wa = await getWhatsAppProvider(order.establishmentId);
                  if (wa.isAvailable()) {
                    const establishment = await db.getEstablishmentById(order.establishmentId);
                    const orderItems = await db.getOrderItems(order.id);

                    // Cashback info — só relevante para pedidos completed
                    let cashbackInfo: { cashbackEarned: string; cashbackTotal: string } | null = null;
                    if (whatsappStatus === 'completed' && order.customerPhone) {
                      try {
                        const estData = await db.getEstablishmentById(order.establishmentId);
                        if (estData?.cashbackEnabled && estData?.rewardProgramType === 'cashback') {
                          const cashbackTx = await db.getCashbackTransactionByOrderId(order.id);
                          if (cashbackTx && parseFloat(cashbackTx.amount) > 0) {
                            const balance = await db.getCashbackBalance(order.establishmentId, order.customerPhone);
                            cashbackInfo = {
                              cashbackEarned: cashbackTx.amount,
                              cashbackTotal: balance?.balance || '0.00',
                            };
                          }
                        }
                      } catch (cbErr) {
                        logger.error('[WhatsApp] Erro ao buscar cashback info:', cbErr);
                      }
                    }

                    await wa.sendOrderNotification(
                      order.customerPhone,
                      whatsappStatus as 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled',
                      {
                        customerName: order.customerName || 'Cliente',
                        orderNumber: order.orderNumber,
                        establishmentName: establishment?.name || 'Restaurante',
                        template: whatsappStatus === 'preparing' ? config.templatePreparing :
                                  whatsappStatus === 'ready' ? (
                                    (order.deliveryType === 'pickup' || order.deliveryType === 'dine_in')
                                      ? (config.templateReadyPickup || config.templateReady)
                                      : config.templateReady
                                  ) :
                                  whatsappStatus === 'out_for_delivery' ? (config.templateOutForDelivery || null) :
                                  whatsappStatus === 'completed' ? config.templateCompleted :
                                  whatsappStatus === 'cancelled' ? config.templateCancelled : null,
                        deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
                        cancellationReason: whatsappCancellationReason || order.cancellationReason,
                        orderItems: orderItems.map(item => ({
                          productName: item.productName,
                          quantity: item.quantity ?? 1,
                          unitPrice: item.unitPrice,
                          totalPrice: item.totalPrice,
                          complements: item.complements as Array<{ name: string; price: number; quantity: number }> | string | null,
                          notes: item.notes,
                        })),
                        orderTotal: order.total,
                        paymentMethod: order.paymentMethod,
                        cashbackInfo,
                        customerAddress: order.customerAddress,
                      }
                    );
                  }
                }
              }
            }
          } catch (error) {
            logger.error('[WhatsApp] Erro ao enviar notificação (background):', error);
            // Fire-and-forget: erro logado mas não afeta o fluxo principal
          }
        })();

        // Acionamento automático do entregador quando timing = on_accepted
        if (input.status === 'preparing') {
          try {
            const order = await db.getOrderById(input.id);
            if (order && order.deliveryType === 'delivery' && !order.deliveryNotified) {
              const timing = await db.getDriverNotifyTiming(order.establishmentId);
              if (timing === 'on_accepted') {
                const establishment = await db.getEstablishmentByUserId((await db.getEstablishmentById(order.establishmentId))?.userId || 0);
                const estId = order.establishmentId;
                const activeDrivers = await db.getActiveDriversByEstablishment(estId);
                
                if (activeDrivers.length === 1) {
                  // Auto-assign single driver and notify
                  const driver = activeDrivers[0];
                  const deliveryFee = parseFloat(order.deliveryFee || '0');
                  let repasseValue = 0;
                  if (driver.repasseStrategy === 'neighborhood') repasseValue = deliveryFee;
                  else if (driver.repasseStrategy === 'fixed') repasseValue = parseFloat(driver.fixedValue || '0');
                  else if (driver.repasseStrategy === 'percentage') repasseValue = deliveryFee * (parseFloat(driver.percentageValue || '0') / 100);

                  const existingDelivery = await db.getDeliveryByOrderId(input.id);
                  if (!existingDelivery) {
                    const deliveryId = await db.createDelivery({
                      establishmentId: estId,
                      orderId: input.id,
                      driverId: driver.id,
                      deliveryFee: String(deliveryFee),
                      repasseValue: String(repasseValue.toFixed(2)),
                      paymentStatus: 'pending',
                      whatsappSent: false,
                    });

                    const driverWhatsappAllowed = hasAutomaticOrderNotifications(establishment?.planType);
                    if (!driverWhatsappAllowed) {
                      logger.info('[Driver Notify] WhatsApp automático ao entregador bloqueado para o plano:', establishment?.planType || 'desconhecido');
                    }
                    const config = driverWhatsappAllowed ? await db.getWhatsappConfig(estId) : null;
                    if (config && config.status === 'connected') {
                      const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
                      const wa = await getWhatsAppProvider(estId);
                      if (wa.isAvailable()) {
                        const message = buildDriverDeliveryMessage(order, deliveryFee);
                        const departureNotifyBy = await db.getDepartureNotifyBy(estId);
                        const includeDepartureButton = departureNotifyBy !== 'attendant' && driver.departureNotifyBy !== 'attendant';
                        const buttons = buildDriverButtons(order.orderNumber, order.customerAddress, order.customerLat, order.customerLng, { includeDepartureButton });
                        const btnResult = await wa.sendButtons(driver.whatsapp, message, buttons, 'Clique para atualizar o status');
                        if (!btnResult.success) {
                          await wa.sendText(driver.whatsapp, message);
                        }
                        await db.markDeliveryWhatsappSent(deliveryId);
                      }
                    }
                    await db.markOrderDeliveryNotified(input.id);
                    logger.info(`[Driver Notify] Entregador ${driver.name} acionado automaticamente (on_accepted) para pedido ${order.orderNumber}`);
                  }
                } else if (activeDrivers.length > 1) {
                  // Múltiplos entregadores: retornar lista para seleção no frontend (não fazer broadcast)
                  logger.info(`[Driver Notify] ${activeDrivers.length} entregadores disponíveis (on_accepted) para pedido ${order.orderNumber} - aguardando seleção`);
                  return {
                    success: true,
                    action: 'choose_driver_on_accept',
                    orderId: input.id,
                    drivers: activeDrivers.map(d => ({
                      id: d.id,
                      name: d.name,
                      whatsapp: d.whatsapp,
                    })),
                  };
                }
              }
            }
          } catch (error) {
            logger.error('[Driver Notify] Erro ao acionar entregador no aceite:', error);
          }
        }
        
        // ─── Estorno automático para pedidos cancelados com pagamento online ───
        if (input.status === 'cancelled') {
          (async () => {
            try {
              const cancelledOrder = await db.getOrderById(input.id);
              if (cancelledOrder && (cancelledOrder.paymentMethod === 'pix_online' || cancelledOrder.paymentMethod === 'card_online')) {
                const ptTx = await db.getPaytimeTransactionByOrderId(input.id);
                if (ptTx && ['PAID', 'APPROVED'].includes(ptTx.status)) {
                  logger.info('[Paytime Auto-Refund] Iniciando estorno automático:', {
                    orderId: input.id,
                    paymentMethod: cancelledOrder.paymentMethod,
                    paytimeTransactionId: ptTx.paytimeTransactionId,
                  });
                  
                  const refundResult = await refundPaytimeTransaction(ptTx.paytimeTransactionId, false);
                  await db.updatePaytimeTransactionStatus(ptTx.paytimeTransactionId, 'REFUNDED');
                  
                  logger.info('[Paytime Auto-Refund] Estorno concluído:', {
                    orderId: input.id,
                    refundStatus: refundResult.status,
                  });
                } else if (ptTx) {
                  logger.info('[Paytime Auto-Refund] Transação não elegível para estorno:', {
                    orderId: input.id,
                    currentStatus: ptTx.status,
                  });
                }
              }
            } catch (refundError: any) {
              // Fire-and-forget: erro logado mas não afeta o cancelamento do pedido
              logger.error('[Paytime Auto-Refund] Erro ao estornar (background):', {
                orderId: input.id,
                error: refundError?.message,
              });
            }
          })();
        }
        
        return { success: true, ifoodWarning };
      }),

    // Smart driver assignment: mark as ready and auto-assign driver
    markReadyAndAssign: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        driverId: z.number().optional(), // If provided, assign this specific driver
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento n\u00e3o encontrado' });

        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });

        // Verify the order belongs to this establishment
        if (order.establishmentId !== establishment.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este estabelecimento' });
        }

        // Only apply driver assignment for delivery orders
        // Pickup and dine_in orders don't need a driver
        if (order.deliveryType !== 'delivery') {
          await db.updateOrderStatus(input.orderId, 'ready');
          return { action: 'marked_ready', driverId: null, whatsappSent: false };
        }

        // Pedidos iFood com deliveredBy=IFOOD têm logística própria do marketplace.
        // O painel apenas sinaliza pronto; atribuição/despacho/conclusão vêm por eventos iFood.
        if (isIfoodMarketplaceDelivery(order)) {
          await db.updateOrderStatus(input.orderId, 'ready');
          let ifoodWarning: string | null = null;

          if (order.externalId) {
            try {
              await readyToPickupIfoodOrder(order.externalId, order.establishmentId);
              await db.updateOrderExternalStatus(input.orderId, 'READY_TO_PICKUP');
              logger.info(`[iFood Sync] Pedido ${order.orderNumber} marcado como pronto para retirada por entregador iFood`);
            } catch (err: any) {
              const errorDetail = err?.message || 'Erro desconhecido';
              logger.warn(`[iFood Sync] Falha ao marcar pronto para entregador iFood: ${errorDetail}`);
              ifoodWarning = `Sincronização iFood falhou: ${errorDetail}`;
            }
          }

          return { action: 'ifood_delivery', driverId: null, whatsappSent: false, ifoodWarning };
        }

        // Check if delivery already exists
        const existingDelivery = await db.getDeliveryByOrderId(input.orderId);
        if (existingDelivery) {
          // Se já foi atribuído (ex: on_accepted), marcar como pronto.
          // Quando o atendente é responsável pela saída, o cliente precisa ser notificado agora,
          // pois o entregador não receberá/acionará o botão "Sair para entrega".
          if (order.deliveryNotified) {
            await db.updateOrderStatus(input.orderId, 'ready');
            // Sync with iFood: readyToPickup (sinaliza que pedido está pronto)
            if (order.source === 'ifood' && order.externalId) {
              try {
                await readyToPickupIfoodOrder(order.externalId, order.establishmentId);
                await db.updateOrderExternalStatus(input.orderId, 'READY_TO_PICKUP');
                logger.info(`[iFood Sync] Pedido ${order.orderNumber} marcado como pronto no iFood (existingDelivery)`);
              } catch (err: any) {
                logger.warn(`[iFood Sync] Falha ao marcar pronto no iFood: ${err?.message}`);
              }
            }

            const departureNotifyBy = await db.getDepartureNotifyBy(establishment.id);
            const existingDriver = await db.getDriverById(existingDelivery.driverId);
            const attendantResponsible = departureNotifyBy === 'attendant' || existingDriver?.departureNotifyBy === 'attendant';
            let customerNotified = false;

            if (attendantResponsible) {
              customerNotified = await notifyCustomerOutForDelivery(establishment.id, order, 'atendente responsável em entrega já atribuída');
              if (customerNotified) {
                await db.updateOrderStatus(input.orderId, 'out_for_delivery');
              }
            } else {
              logger.info('[markReadyAndAssign] Pedido marcado como pronto - entregador controla o fluxo via WhatsApp');
            }
            
            return { action: 'assigned', driverId: existingDelivery.driverId, whatsappSent: true, deliveryId: existingDelivery.id, customerNotified };
          }
          throw new TRPCError({ code: 'CONFLICT', message: 'Pedido já possui entregador atribuído' });
        }

        // Get active drivers
        const activeDrivers = await db.getActiveDriversByEstablishment(establishment.id);

        let driverId = input.driverId;

        // If no specific driver provided, check logic
        if (!driverId) {
          if (activeDrivers.length === 0) {
            // No active drivers: mark as out_for_delivery and send WhatsApp notification to customer
            await db.updateOrderStatus(input.orderId, 'out_for_delivery');
            // Sync with iFood: readyToPickup + dispatch (fluxo completo para entrega própria)
            let ifoodWarning: string | null = null;
            if (order.source === 'ifood' && order.externalId) {
              try {
                // Passo 1: Marcar como pronto (readyToPickup)
                await readyToPickupIfoodOrder(order.externalId, order.establishmentId);
                await db.updateOrderExternalStatus(input.orderId, 'READY_TO_PICKUP');
                logger.info(`[iFood Sync] Pedido ${order.orderNumber} marcado como pronto no iFood`);
                // Passo 2: Despachar (dispatch com deliveredBy: MERCHANT)
                await dispatchIfoodOrder(order.externalId, order.establishmentId);
                await db.updateOrderExternalStatus(input.orderId, 'DISPATCHED');
                logger.info(`[iFood Sync] Pedido ${order.orderNumber} despachado no iFood (markReadyAndAssign, sem entregadores)`);
              } catch (err: any) {
                const errorDetail = err?.message || 'Erro desconhecido';
                logger.warn(`[iFood Sync] Falha ao sincronizar com iFood: ${errorDetail}`);
                ifoodWarning = `Sincronização iFood falhou: ${errorDetail}`;
              }
            }
            
            // Send WhatsApp notification to customer about out_for_delivery
            const customerNotified = await notifyCustomerOutForDelivery(establishment.id, order, 'sem entregadores ativos');
            
            return { action: 'marked_ready', driverId: null, whatsappSent: customerNotified, ifoodWarning };
          } else if (activeDrivers.length === 1) {
            // Only 1 active driver: auto-assign
            driverId = activeDrivers[0].id;
          } else {
            // 2+ active drivers: return list for modal selection
            // First mark as ready
            await db.updateOrderStatus(input.orderId, 'ready');
            return {
              action: 'choose_driver',
              drivers: activeDrivers.map(d => ({
                id: d.id,
                name: d.name,
                whatsapp: d.whatsapp,
              })),
              driverId: null,
              whatsappSent: false,
            };
          }
        }

        // Assign driver and change status to out_for_delivery
        const driver = await db.getDriverById(driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador n\u00e3o encontrado' });

        const deliveryFee = parseFloat(order.deliveryFee || '0');

        // Calculate repasse
        let repasseValue = 0;
        if (driver.repasseStrategy === 'neighborhood') {
          repasseValue = deliveryFee;
        } else if (driver.repasseStrategy === 'fixed') {
          repasseValue = parseFloat(driver.fixedValue || '0');
        } else if (driver.repasseStrategy === 'percentage') {
          const pct = parseFloat(driver.percentageValue || '0');
          repasseValue = deliveryFee * (pct / 100);
        }

        // Create delivery record
        const deliveryId = await db.createDelivery({
          establishmentId: establishment.id,
          orderId: input.orderId,
          driverId,
          deliveryFee: String(deliveryFee),
          repasseValue: String(repasseValue.toFixed(2)),
          paymentStatus: 'pending',
          whatsappSent: false,
        });

        // Update order status to out_for_delivery
        await db.updateOrderStatus(input.orderId, 'out_for_delivery');
        // Sync with iFood: readyToPickup + dispatch (fluxo completo para entrega própria)
        let ifoodWarning: string | null = null;
        if (order.source === 'ifood' && order.externalId) {
          try {
            // Passo 1: Marcar como pronto (readyToPickup)
            await readyToPickupIfoodOrder(order.externalId, order.establishmentId);
            await db.updateOrderExternalStatus(input.orderId, 'READY_TO_PICKUP');
            logger.info(`[iFood Sync] Pedido ${order.orderNumber} marcado como pronto no iFood`);
            // Passo 2: Despachar (dispatch com deliveredBy: MERCHANT)
            await dispatchIfoodOrder(order.externalId, order.establishmentId);
            await db.updateOrderExternalStatus(input.orderId, 'DISPATCHED');
            logger.info(`[iFood Sync] Pedido ${order.orderNumber} despachado no iFood (markReadyAndAssign, com entregador)`);
          } catch (err: any) {
            const errorDetail = err?.message || 'Erro desconhecido';
            logger.warn(`[iFood Sync] Falha ao sincronizar com iFood: ${errorDetail}`);
            ifoodWarning = `Sincronização iFood falhou: ${errorDetail}`;
          }
        }

        const departureNotifyBy = await db.getDepartureNotifyBy(establishment.id);
        const attendantResponsible = departureNotifyBy === 'attendant' || driver.departureNotifyBy === 'attendant';

        // Send WhatsApp notification to driver (skip if already notified on_accepted)
        let whatsappSent = false;
        const alreadyNotified = order.deliveryNotified;
        if (!alreadyNotified) {
          try {
            const driverWhatsappAllowed = hasAutomaticOrderNotifications(establishment.planType);
            if (!driverWhatsappAllowed) {
              logger.info('[Driver WhatsApp] Notificação automática ao entregador bloqueada para o plano:', establishment.planType || 'desconhecido');
            }
            const config = driverWhatsappAllowed ? await db.getWhatsappConfig(establishment.id) : null;
            if (config && config.status === 'connected') {
              const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
              const wa = await getWhatsAppProvider(establishment.id);
              if (wa.isAvailable()) {
                const message = buildDriverDeliveryMessage(order, deliveryFee);
                const buttons = buildDriverButtons(order.orderNumber, order.customerAddress, order.customerLat, order.customerLng, { includeDepartureButton: !attendantResponsible });
                // Tentar com botões primeiro; cair em texto simples se falhar
                const btnResult = await wa.sendButtons(driver.whatsapp, message, buttons, 'Clique para atualizar o status');
                if (!btnResult.success) {
                  await wa.sendText(driver.whatsapp, message);
                }
                await db.markDeliveryWhatsappSent(deliveryId);
                whatsappSent = true;
              }
            }
          } catch (error) {
            logger.error('[Driver WhatsApp] Erro ao enviar notificação:', error);
          }
          await db.markOrderDeliveryNotified(input.orderId);
        } else {
          whatsappSent = true; // Já foi enviado no aceite
        }

        let customerNotified = false;
        if (attendantResponsible) {
          customerNotified = await notifyCustomerOutForDelivery(establishment.id, order, 'atendente responsável');
        } else {
          // Entregador é responsável: ele controla o fluxo via botões WhatsApp
          logger.info('[markReadyAndAssign] Notificação ready suprimida - entregador controla o fluxo via WhatsApp');
        }

        return { action: 'assigned', driverId, whatsappSent, deliveryId, ifoodWarning, customerNotified };
      }),

    // ===== EDIÇÃO DE PEDIDO =====
    
    // Buscar produtos do cardápio para adicionar ao pedido
    searchProducts: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        search: z.string().min(1),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.searchProductsForOrder(input.establishmentId, input.search);
      }),

    // Atualizar quantidade de um item do pedido
    updateItemQuantity: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        quantity: z.number().min(1),
        orderId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertOrderOwnership(ctx.user.id, input.orderId);
        const item = await db.updateOrderItemQuantity(input.itemId, input.quantity);
        const totals = await db.recalculateOrderTotals(input.orderId);
        return { item, totals };
      }),

    // Remover item do pedido
    removeItem: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        orderId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertOrderOwnership(ctx.user.id, input.orderId);
        const removed = await db.deleteOrderItem(input.itemId);
        const totals = await db.recalculateOrderTotals(input.orderId);
        return { removed, totals };
      }),

    // Adicionar novo item ao pedido
    addItem: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        complements: z.array(z.object({
          name: z.string(),
          price: z.number(),
          quantity: z.number(),
        })).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertOrderOwnership(ctx.user.id, input.orderId);
        const item = await db.addOrderItem(
          input.orderId,
          input.productId,
          input.quantity,
          input.complements,
          input.notes,
        );
        const totals = await db.recalculateOrderTotals(input.orderId);
        return { item, totals };
      }),

    // Atualizar forma de entrega e pagamento do pedido
    updateOrderDetails: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        deliveryType: z.enum(['delivery', 'pickup', 'dine_in']),
        paymentMethod: z.enum(['cash', 'card', 'pix', 'card_online', 'pix_online']),
        deliveryFee: z.number().min(0).nullable().optional(),
        changeAmount: z.number().min(0).nullable().optional(),
        customerAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertOrderOwnership(ctx.user.id, input.orderId);
        const order = await db.updateOrderFulfillmentAndPayment(input.orderId, {
          deliveryType: input.deliveryType,
          paymentMethod: input.paymentMethod,
          deliveryFee: input.deliveryFee,
          changeAmount: input.changeAmount,
          ...(input.customerAddress !== undefined && { customerAddress: input.customerAddress }),
        });
        return { order };
      }),

    sendExistingOrderPixWhatsappCharge: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await assertOrderOwnership(ctx.user.id, input.orderId);
        const establishment = await db.getEstablishmentById(order.establishmentId);
        if (!establishment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado.' });
        }

        const onlinePixEnabled = Boolean((establishment as any).paytimeEnabled || (establishment as any).onlinePaymentEnabled);
        if (!onlinePixEnabled || !(establishment as any).paytimeEstablishmentId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pix online/Celcoin não está ativo para este estabelecimento.' });
        }

        const customerPhoneDigits = String(order.customerPhone || '').replace(/\D/g, '');
        if (!customerPhoneDigits) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Informe o telefone do cliente para enviar a cobrança pelo WhatsApp.' });
        }

        const amountCents = Math.round(Number(order.total || 0) * 100);
        if (!Number.isFinite(amountCents) || amountCents < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor do pedido inválido para cobrança PIX.' });
        }

        const existingTransaction = await db.getPaytimeTransactionByOrderId(order.id);
        if (existingTransaction?.status === 'PENDING' && existingTransaction.paytimeTransactionId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este pedido já possui uma cobrança PIX pendente.' });
        }

        const whatsappConfig = await db.getWhatsappConfig(order.establishmentId);
        if (!whatsappConfig || whatsappConfig.status !== 'connected' || !whatsappConfig.instanceToken) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não conectado para envio da cobrança.' });
        }

        const orderItems = await db.getOrderItems(order.id);
        const referenceId = `pedido_pix_whatsapp_${order.id}_${Date.now()}`;

        try {
          const transaction = await createPixTransaction({
            amount: amountCents,
            interest: 'STORE',
            reference_id: referenceId,
            sub_establishment_id: (establishment as any).paytimeEstablishmentId || undefined,
            client: {
              first_name: order.customerName || undefined,
              phone: customerPhoneDigits,
            },
            info_additional: [
              { key: 'Pedido', value: `#${order.orderNumber}` },
              { key: 'Origem', value: 'Pedido WhatsApp' },
              { key: 'Estabelecimento', value: establishment.name || 'Mindi' },
            ],
          });

          if (!transaction.emv) {
            throw new Error('Código PIX indisponível na resposta da Paytime');
          }

          await db.createPaytimeTransaction({
            establishmentId: order.establishmentId,
            orderId: order.id,
            paytimeTransactionId: transaction._id,
            paytimeGatewayKey: transaction.gateway_key || null,
            referenceId,
            paymentType: 'PIX',
            status: 'PENDING',
            amountCents,
            emv: transaction.emv || null,
          });

          await db.updateOrderFulfillmentAndPayment(order.id, {
            deliveryType: order.deliveryType as any,
            paymentMethod: 'pix_online' as any,
            deliveryFee: order.deliveryFee !== null && order.deliveryFee !== undefined ? Number(order.deliveryFee) : null,
            changeAmount: null,
            ...(order.customerAddress !== undefined && { customerAddress: order.customerAddress || '' }),
          }, { allowOnlinePaymentConversion: true });
          await db.updateOrderStatus(order.id, 'pending_confirmation' as any);

          const qrCodeBase64 = await QRCode.toDataURL(transaction.emv, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 2,
            width: 512,
          });

          const customerName = order.customerName || 'Cliente';
          const orderSummaryMessage = generateStatusMessage(
            'new',
            order.orderNumber,
            customerName,
            establishment.name || 'Restaurante',
            whatsappConfig.templateNewOrder,
            order.deliveryType as any,
            null,
            orderItems.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: String(item.unitPrice),
              totalPrice: String(item.totalPrice),
              complements: item.complements as any,
              notes: item.notes || null,
            })),
            String(order.total),
            undefined,
            'pix',
            undefined,
            null,
            order.customerAddress || '',
            null,
            order.deliveryFee || null,
            customerPhoneDigits
          );

          const qrCaption = '👆🏼 Escaneie o Qr Code acima para pagar\n👇🏼 Ou copie o código Pix abaixo:';
          const pixCodeMessage = transaction.emv;

          const summaryResult = await sendTextMessage(whatsappConfig.instanceToken, customerPhoneDigits, orderSummaryMessage);
          if (!summaryResult.success) {
            throw new Error(summaryResult.message || 'Falha ao enviar resumo do pedido pelo WhatsApp');
          }

          const qrResult = await sendImageMessage(whatsappConfig.instanceToken, customerPhoneDigits, qrCodeBase64, qrCaption);
          if (!qrResult.success) {
            throw new Error(qrResult.message || 'Falha ao enviar QR Code PIX pelo WhatsApp');
          }

          const codeResult = await sendTextMessage(whatsappConfig.instanceToken, customerPhoneDigits, pixCodeMessage);
          if (!codeResult.success) {
            throw new Error(codeResult.message || 'Falha ao enviar código PIX pelo WhatsApp');
          }

          logger.info('[Pedidos PIX WhatsApp] Cobrança criada e enviada', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            transactionId: transaction._id,
            establishmentId: order.establishmentId,
            sentMessages: 3,
          });

          return {
            id: order.id,
            orderNumber: order.orderNumber,
            transactionId: transaction._id,
            emv: transaction.emv,
            qrCodeBase64,
            amountCents,
            status: 'PENDING',
          };
        } catch (error: any) {
          logger.error('[Pedidos PIX WhatsApp] Erro ao criar/enviar cobrança:', error?.message || error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error?.message || 'Erro ao criar e enviar cobrança PIX pelo WhatsApp.',
          });
        }
      }),

    updateOrderCustomer: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        customerName: z.string().trim().min(1, 'Informe o nome do cliente.'),
        customerPhone: z.string().trim().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertOrderOwnership(ctx.user.id, input.orderId);
        const order = await db.updateOrderCustomer(input.orderId, {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
        });
        return { order };
      }),

    // Buscar complementos de um produto (para modal de complementos na edição de pedido)
    getProductComplements: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) return [];
        
        // Verify ownership via product's establishment
        await assertEstablishmentOwnership(ctx.user.id, product.establishmentId);
        
        if (product.isCombo) {
          const comboGroupsData = await db.getComboGroupsByProductId(input.productId);
          const convertedComboGroups = comboGroupsData.map(group => ({
            id: group.id,
            productId: group.productId,
            name: group.name,
            minQuantity: group.minQuantity ?? (group.isRequired ? 1 : 0),
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder,
            items: group.items
              .filter(item => item.productStatus === 'active')
              .map(item => ({
                id: item.id,
                groupId: group.id,
                name: item.productName || 'Produto',
                price: item.productPrice || '0',
                imageUrl: item.productImages?.[0] || null,
                isActive: item.productStatus === 'active',
                priceMode: (Number(item.productPrice) > 0 ? 'normal' : 'free') as 'normal' | 'free',
                sortOrder: item.sortOrder,
              })),
          }));
          const complementGroupsData = await db.getComplementGroupsByProduct(input.productId);
          const complementGroupsWithItems = await Promise.all(
            complementGroupsData
              .filter(group => group.isActive !== false)
              .map(async (group) => {
                const items = await db.getComplementItemsByGroup(group.id);
                return { ...group, items: items.filter(item => item.isActive !== false) };
              })
          );
          return [...convertedComboGroups, ...complementGroupsWithItems];
        }
        
        const groups = await db.getComplementGroupsByProduct(input.productId);
        const groupsWithItems = await Promise.all(
          groups
            .filter(group => group.isActive !== false)
            .map(async (group) => {
              const items = await db.getComplementItemsByGroup(group.id);
              return {
                ...group,
                items: items.filter(item => item.isActive !== false),
              };
            })
        );
        return groupsWithItems;
      }),

    // Get active drivers count for smart assignment UI
    getActiveDriversForAssignment: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return { count: 0, drivers: [] };
        const drivers = await db.getActiveDriversByEstablishment(establishment.id);
        return {
          count: drivers.length,
          drivers: drivers.map(d => ({ id: d.id, name: d.name, whatsapp: d.whatsapp })),
        };
      }),
  });
