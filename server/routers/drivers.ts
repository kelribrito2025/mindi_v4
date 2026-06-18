import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { buildDriverDeliveryMessage } from '../driverMessage';
import { buildDriverButtons } from '../driverButtons';
import { logger } from "../_core/logger";
import { or } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const driverRouter = router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const allDrivers = await db.getDriversByEstablishment(establishment.id);
        
        // Enrich each driver with 7-day stats and pending total
        const enriched = await Promise.all(
          allDrivers.map(async (driver) => {
            const last7 = await db.getDriverDeliveriesLast7Days(driver.id);
            const pendingTotal = await db.getDriverPendingTotal(driver.id);
            return {
              ...driver,
              deliveriesLast7Days: last7.count,
              repasseLast7Days: last7.totalRepasse,
              pendingTotal,
            };
          })
        );
        
        return enriched;
      }),

    metrics: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getDriverMetrics(establishment.id);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const driver = await db.getDriverById(input.id);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, driver.establishmentId);
        return driver;
      }),

    getDetailMetrics: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ ctx, input }) => {
        const driver = await db.getDriverById(input.driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, driver.establishmentId);
        return db.getDriverDetailMetrics(input.driverId);
      }),

    getDeliveries: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ ctx, input }) => {
        const driver = await db.getDriverById(input.driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, driver.establishmentId);
        return db.getDeliveriesByDriverWithOrders(input.driverId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email().optional().or(z.literal('')),
        whatsapp: z.string().min(1, 'WhatsApp é obrigatório'),
        isActive: z.boolean().default(true),
        departureNotifyBy: z.enum(['driver', 'attendant']).default('driver'),
        repasseStrategy: z.enum(['none', 'neighborhood', 'fixed', 'percentage']).default('neighborhood'),
        fixedValue: z.string().optional(),
        percentageValue: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const id = await db.createDriver({
          establishmentId: establishment.id,
          name: input.name,
          email: input.email || null,
          whatsapp: input.whatsapp,
          isActive: input.isActive,
          departureNotifyBy: input.departureNotifyBy,
          repasseStrategy: input.repasseStrategy,
          fixedValue: input.fixedValue || null,
          percentageValue: input.percentageValue || null,
        });
        
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal('')),
        whatsapp: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
        departureNotifyBy: z.enum(['driver', 'attendant']).optional(),
        repasseStrategy: z.enum(['none', 'neighborhood', 'fixed', 'percentage']).optional(),
        fixedValue: z.string().optional().nullable(),
        percentageValue: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const driver = await db.getDriverById(input.id);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, driver.establishmentId);
        const { id, ...data } = input;
        await db.updateDriver(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const driver = await db.getDriverById(input.id);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, driver.establishmentId);
        await db.deleteDriver(input.id);
        return { success: true };
      }),

    // Assign a driver to an order (create delivery record)
    assignToOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        driverId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Check if delivery already exists for this order
        const existing = await db.getDeliveryByOrderId(input.orderId);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Este pedido já possui um entregador atribuído' });
        
        const driver = await db.getDriverById(input.driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
        
        const deliveryFee = parseFloat(order.deliveryFee || '0');
        
        // Calculate repasse based on strategy
        let repasseValue = 0;
        if (driver.repasseStrategy === 'neighborhood') {
          repasseValue = deliveryFee; // Same as delivery fee
        } else if (driver.repasseStrategy === 'fixed') {
          repasseValue = parseFloat(driver.fixedValue || '0');
        } else if (driver.repasseStrategy === 'percentage') {
          const pct = parseFloat(driver.percentageValue || '0');
          repasseValue = deliveryFee * (pct / 100);
        }
        
        const deliveryId = await db.createDelivery({
          establishmentId: establishment.id,
          orderId: input.orderId,
          driverId: input.driverId,
          deliveryFee: String(deliveryFee),
          repasseValue: String(repasseValue.toFixed(2)),
          paymentStatus: 'pending',
          whatsappSent: false,
        });
        
        // Auto-send WhatsApp notification to driver (skip if already notified)
        let whatsappSent = false;
        const alreadyNotified = order.deliveryNotified;
        if (!alreadyNotified) {
          try {
            if (driver.isActive) {
              const config = await db.getWhatsappConfig(establishment.id);
              if (config && config.status === 'connected') {
                const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
                const wa = await getWhatsAppProvider(establishment.id);
                if (wa.isAvailable()) {
                  const message = buildDriverDeliveryMessage(order, deliveryFee);
                  const departureNotifyBy = await db.getDepartureNotifyBy(establishment.id);
                  const includeDepartureButton = departureNotifyBy !== 'attendant' && driver.departureNotifyBy !== 'attendant';
                  const buttons = buildDriverButtons(order.orderNumber, order.customerAddress, order.customerLat, order.customerLng, { includeDepartureButton });
                  const btnResult = await wa.sendButtons(driver.whatsapp, message, buttons, 'Clique para atualizar o status');
                  if (!btnResult.success) {
                    await wa.sendText(driver.whatsapp, message);
                  }
                  await db.markDeliveryWhatsappSent(deliveryId);
                  whatsappSent = true;
                }
              }
            }
          } catch (error) {
            logger.error('[Driver WhatsApp] Erro ao enviar notificação automática:', error);
          }
          await db.markOrderDeliveryNotified(input.orderId);
        } else {
          whatsappSent = true; // Já notificado no aceite
        }
        
        return { deliveryId, whatsappSent };
      }),

    // Mark delivery as paid
    markAsPaid: protectedProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Get delivery details before marking as paid
        const delivery = await db.getDeliveryById(input.deliveryId);
        if (!delivery) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entrega não encontrada' });
        
        // Get driver info for description
        const driver = await db.getDriverById(delivery.driverId);
        const driverName = driver?.name || 'Entregador';
        
        // Get establishment
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Mark delivery as paid
        await db.markDeliveryAsPaid(input.deliveryId);
        
        // Register as expense in Finanças
        const repasseValue = parseFloat(delivery.repasseValue || '0');
        if (repasseValue > 0) {
          const categoryId = await db.getOrCreateEntregadoresCategory(establishment.id);
          await db.createExpense({
            establishmentId: establishment.id,
            categoryId,
            description: `Repasse entrega - ${driverName} (Pedido #${delivery.orderId})`,
            amount: repasseValue.toFixed(2),
            paymentMethod: 'pix',
            date: new Date(),
          });
        }
        
        return { success: true };
      }),

    // Send WhatsApp notification to driver
    sendWhatsappNotification: protectedProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get delivery by ID using a helper
        const del = await db.getDeliveryById(input.deliveryId);
        
        if (!del) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entrega não encontrada' });
        if (del.whatsappSent) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Notificação já foi enviada' });
        
        const driver = await db.getDriverById(del.driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        
        const order = await db.getOrderById(del.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
        
        const config = await db.getWhatsappConfig(order.establishmentId);
        if (!config || config.status !== 'connected') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não está conectado' });
        }

        const message = buildDriverDeliveryMessage(order);

        try {
          const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
          const wa = await getWhatsAppProvider(order.establishmentId);
          if (!wa.isAvailable()) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não está disponível' });
          }
          const departureNotifyBy = await db.getDepartureNotifyBy(order.establishmentId);
          const includeDepartureButton = departureNotifyBy !== 'attendant' && driver.departureNotifyBy !== 'attendant';
          const buttons = buildDriverButtons(order.orderNumber, order.customerAddress, order.customerLat, order.customerLng, { includeDepartureButton });
          const btnResult = await wa.sendButtons(driver.whatsapp, message, buttons, 'Clique para atualizar o status');
          if (!btnResult.success) {
            await wa.sendText(driver.whatsapp, message);
          }
          await db.markDeliveryWhatsappSent(input.deliveryId);
          return { success: true };
        } catch (error) {
          logger.error('[Driver WhatsApp] Erro ao enviar:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao enviar mensagem WhatsApp' });
        }
      }),

    // Get active drivers for assignment dropdown
    listActive: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getActiveDriversByEstablishment(establishment.id);
      }),

    // Check if a WhatsApp number is valid
    checkWhatsApp: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken || config.status !== 'connected') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não está conectado. Configure na página de Configurações.' });
        }
        
        const { checkWhatsAppNumber } = await import('../_core/uazapi');
        const result = await checkWhatsAppNumber(config.instanceToken, input.phone);
        
        return {
          exists: result.exists,
          verifiedName: result.verifiedName,
          error: result.error,
        };
      }),

    // Get delivery info for an order
    getByOrderId: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const delivery = await db.getDeliveryByOrderId(input.orderId);
        if (!delivery) return null;
        const driver = await db.getDriverById(delivery.driverId);
        return { ...delivery, driver };
      }),

    // Get driver notify timing setting
    getNotifyTiming: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const timing = await db.getDriverNotifyTiming(establishment.id);
        return { timing };
      }),

    // Update driver notify timing setting
    updateNotifyTiming: protectedProcedure
      .input(z.object({ timing: z.enum(["on_accepted", "on_ready"]) }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.updateDriverNotifyTiming(establishment.id, input.timing);
        return { success: true };
      }),

    // Get who notifies departure setting
    getDepartureNotifyBy: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const departureNotifyBy = await db.getDepartureNotifyBy(establishment.id);
        return { departureNotifyBy };
      }),

    // Update who notifies departure setting
    updateDepartureNotifyBy: protectedProcedure
      .input(z.object({ departureNotifyBy: z.enum(["driver", "attendant"]) }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.updateDepartureNotifyBy(establishment.id, input.departureNotifyBy);
        return { success: true };
      }),
  });
