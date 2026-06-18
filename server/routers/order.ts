import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney, zMoneyOptional } from "../../shared/validation";
import { createPixTransaction } from "../paytime";
import { generateStatusMessage, sendImageMessage, sendTextMessage } from "../_core/uazapi";
import QRCode from "qrcode";

export const orderRouter = router({
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getOrdersByEstablishment(input.establishmentId, input.status);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) return null;
        await assertEstablishmentOwnership(ctx.user.id, order.establishmentId);
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
        await assertEstablishmentOwnership(ctx.user.id, order.establishmentId);
        await db.updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        orderNumber: z.string(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        deliveryType: z.enum(["delivery", "pickup", "dine_in"]).default("delivery"),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto"]).default("cash"),
        subtotal: zMoney,
        deliveryFee: zMoney.default("0"),
        discount: zMoneyOptional,
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        total: zMoney,
        changeAmount: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["pending_confirmation", "new", "preparing", "ready", "completed", "cancelled"]).optional(),
        source: z.enum(["internal", "ifood", "rappi", "ubereats", "pdv"]).optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: zMoney,
          totalPrice: zMoney,
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number().default(1),
            isIncluded: z.boolean().optional(),
            groupType: z.enum(["complement", "included"]).optional(),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { items, couponId, ...rawOrderData } = input;
        const isPdvOrder = !rawOrderData.source || rawOrderData.source === "pdv";
        const orderData = isPdvOrder
          ? {
              ...rawOrderData,
              source: "pdv" as const,
              status: "preparing" as const,
            }
          : rawOrderData;

        const result = await db.createOrderWithNumber(orderData, items.map(item => ({
          ...item,
          orderId: 0, // Will be set in db function
        })));
        
        // Incrementar uso do cupom se foi aplicado
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
        }
        
        // Deduzir estoque (produtos + complementos) automaticamente
        // createOrderWithNumber NÃO chama deductStockForOrder, então chamamos aqui
        if (result) {
          try {
            await db.deductStockForOrder(result.id);
          } catch (stockError) {
            logger.error('[CreateOrder] Erro ao deduzir estoque:', stockError);
          }
        }
        
        return result;
      }),

    createWithPixWhatsapp: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        orderNumber: z.string(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        deliveryType: z.enum(["delivery", "pickup", "dine_in"]).default("delivery"),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto", "pix_online"]).default("pix"),
        subtotal: zMoney,
        deliveryFee: zMoney.default("0"),
        discount: zMoneyOptional,
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        total: zMoney,
        changeAmount: z.string().optional(),
        notes: z.string().optional(),
        source: z.enum(["internal", "ifood", "rappi", "ubereats", "pdv"]).optional(),
        deliveryAddress: z.object({
          street: z.string(),
          number: z.string(),
          complement: z.string().optional(),
          neighborhood: z.string(),
          reference: z.string().optional(),
        }).optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string().optional(),
          quantity: z.number(),
          unitPrice: zMoney.optional(),
          price: zMoney.optional(),
          totalPrice: zMoney.optional(),
          complements: z.array(z.object({
            complementId: z.number().optional(),
            name: z.string().optional(),
            price: z.union([zMoney, z.number()]),
            quantity: z.number().default(1),
            isIncluded: z.boolean().optional(),
            groupType: z.enum(["complement", "included"]).optional(),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

        const customerPhoneDigits = (input.customerPhone || '').replace(/\D/g, '');
        if (!customerPhoneDigits || customerPhoneDigits.length < 10 || customerPhoneDigits.length > 13) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Informe um telefone válido do cliente para enviar a cobrança pelo WhatsApp.' });
        }

        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        }
        if (!establishment.paytimeEnabled || !establishment.paytimeEstablishmentId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'PIX online Paytime não está habilitado neste estabelecimento.' });
        }

        const whatsappConfig = await db.getWhatsappConfig(input.establishmentId);
        if (!whatsappConfig || whatsappConfig.status !== 'connected' || !whatsappConfig.instanceToken) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não está conectado para este estabelecimento.' });
        }

        const totalAmount = Number(input.total);
        const amountCents = Math.round(totalAmount * 100);
        if (!Number.isFinite(amountCents) || amountCents < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor do pedido inválido para cobrança PIX.' });
        }

        const { items, couponId, deliveryAddress, ...rawOrderData } = input;
        const orderData = {
          ...rawOrderData,
          customerPhone: customerPhoneDigits,
          paymentMethod: 'pix_online' as any,
          status: 'pending_confirmation' as any,
          source: 'pdv' as any,
        };
        const orderItems = items.map((item) => {
          const unitPrice = item.unitPrice ?? item.price ?? '0';
          return {
            productId: item.productId,
            productName: item.productName || `Produto #${item.productId}`,
            quantity: item.quantity,
            unitPrice,
            totalPrice: item.totalPrice || (Number(unitPrice) * item.quantity).toFixed(2),
            complements: item.complements?.map((comp) => ({
              name: comp.name || 'Complemento',
              price: Number(comp.price),
              quantity: comp.quantity,
            })) || [],
            notes: item.notes,
            orderId: 0,
          };
        });

        const order = await db.createOrderWithNumber(orderData as any, orderItems as any, { skipSSE: true });
        const referenceId = `pdv_pix_whatsapp_${order.id}_${Date.now()}`;

        try {
          const transaction = await createPixTransaction({
            amount: amountCents,
            interest: 'STORE',
            reference_id: referenceId,
            sub_establishment_id: establishment.paytimeEstablishmentId || undefined,
            client: {
              first_name: input.customerName || undefined,
              phone: customerPhoneDigits,
            },
            info_additional: [
              { key: 'Pedido', value: `#${order.orderNumber}` },
              { key: 'Origem', value: 'PDV WhatsApp' },
              { key: 'Estabelecimento', value: establishment.name || 'Mindi' },
            ],
          });

          await db.createPaytimeTransaction({
            establishmentId: input.establishmentId,
            orderId: order.id,
            paytimeTransactionId: transaction._id,
            paytimeGatewayKey: transaction.gateway_key || null,
            referenceId,
            paymentType: 'PIX',
            status: 'PENDING',
            amountCents,
            emv: transaction.emv || null,
          });

          if (couponId) {
            await db.incrementCouponUsage(couponId);
          }

          const customerName = input.customerName || 'Cliente';
          const customerAddressForTemplate = input.deliveryType === 'delivery' && input.deliveryAddress
            ? [
                `${input.deliveryAddress.street}, ${input.deliveryAddress.number}${input.deliveryAddress.complement ? ` - ${input.deliveryAddress.complement}` : ''}`,
                input.deliveryAddress.neighborhood,
              ].filter(Boolean).join(', ') + (input.deliveryAddress.reference ? ` (Ref: ${input.deliveryAddress.reference})` : '')
            : input.customerAddress || '';

          if (!transaction.emv) {
            throw new Error('Código PIX indisponível na resposta da Paytime');
          }

          const qrCodeBase64 = await QRCode.toDataURL(transaction.emv, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 2,
            width: 512,
          });

          const orderSummaryMessage = generateStatusMessage(
            'new',
            order.orderNumber,
            customerName,
            establishment.name || 'Restaurante',
            whatsappConfig.templateNewOrder,
            input.deliveryType,
            null,
            orderItems.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: String(item.unitPrice),
              totalPrice: String(item.totalPrice),
              complements: item.complements as any,
              notes: item.notes || null,
            })),
            input.total,
            undefined,
            'pix',
            undefined,
            null,
            customerAddressForTemplate,
            null,
            input.deliveryFee || null,
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

          logger.info('[PDV PIX WhatsApp] Cobrança criada e enviada', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            transactionId: transaction._id,
            establishmentId: input.establishmentId,
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
          logger.error('[PDV PIX WhatsApp] Erro ao criar/enviar cobrança:', error?.message || error);
          try {
            await db.updateOrderStatus(order.id, 'cancelled');
          } catch (cancelError: any) {
            logger.error('[PDV PIX WhatsApp] Erro ao cancelar pedido após falha:', cancelError?.message || cancelError);
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error?.message || 'Erro ao criar e enviar cobrança PIX pelo WhatsApp.',
          });
        }
      }),
  });
