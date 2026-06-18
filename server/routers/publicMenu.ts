import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { zMoney, zMoneyOptional, parseMoney, validateOrderTotal } from "../../shared/validation";

/**
 * Calcula o preço efetivo de um complemento considerando priceMode e gratuidade por tipo de entrega.
 * Replica a mesma lógica do frontend (getComplementPrice no PublicMenu.tsx).
 */
function getServerComplementPrice(
  item: { price: string; priceMode: string; freeOnDelivery: boolean; freeOnPickup: boolean; freeOnDineIn: boolean },
  deliveryType: 'delivery' | 'pickup' | 'dine_in'
): number {
  if (item.priceMode === 'free') {
    // Verificar gratuidade por contexto específico
    if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
    if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
    if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
    // Se nenhum contexto marcado, é grátis em todos (comportamento original)
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    // Se tem contextos marcados mas o atual não é um deles, cobra normal
    return parseFloat(item.price);
  }
  // Mesmo sem priceMode 'free', verificar flags de gratuidade por contexto
  if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
  if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
  if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
  return parseFloat(item.price);
}

type RadiusDeliveryFeeResult = {
  distanceKm: number;
  distanceText: string;
  durationText: string;
  fee: string | null;
  outOfRange: boolean;
  maxRange: number;
};

const RECEIPT_TOKEN_VERSION = "v1";
const RECEIPT_ALLOWED_PLAN_TYPES = new Set(["free", "trial", "lite"]);

function getReceiptSigningSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required to sign public order receipt links");
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signReceiptPayload(payload: string) {
  return createHmac("sha256", getReceiptSigningSecret())
    .update(payload)
    .digest("base64url");
}

function createOrderReceiptToken(orderId: number, establishmentId: number) {
  const payload = base64UrlEncode(JSON.stringify({ orderId, establishmentId, purpose: "whatsapp-order-receipt" }));
  const signature = signReceiptPayload(payload);
  return `${RECEIPT_TOKEN_VERSION}.${payload}.${signature}`;
}

function verifyOrderReceiptToken(token: string, expectedOrderId: number) {
  const [version, payload, signature] = token.split(".");
  if (version !== RECEIPT_TOKEN_VERSION || !payload || !signature) {
    return null;
  }

  const expectedSignature = signReceiptPayload(payload);
  const providedBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  const parsed = JSON.parse(base64UrlDecode(payload)) as { orderId?: number; establishmentId?: number; purpose?: string };
  if (
    parsed.purpose !== "whatsapp-order-receipt" ||
    parsed.orderId !== expectedOrderId ||
    typeof parsed.establishmentId !== "number"
  ) {
    return null;
  }

  return parsed;
}

function getPublicAppBaseUrl() {
  return (
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    "https://app.mindi.com.br"
  ).replace(/\/$/, "");
}

function createOrderReceiptTokenizedUrl(orderId: number, establishmentId: number) {
  const token = createOrderReceiptToken(orderId, establishmentId);
  return `${getPublicAppBaseUrl()}/recibo/${orderId}?token=${encodeURIComponent(token)}`;
}

function createOrderReceiptUrl(orderId: number, establishmentId: number) {
  const token = createOrderReceiptToken(orderId, establishmentId);
  return {
    receiptToken: token,
    receiptUrl: `${getPublicAppBaseUrl()}/recibo/${orderId}`,
  };
}

async function calculateServerRadiusDeliveryFee(input: {
  establishmentId: number;
  establishmentLatitude?: string | null;
  establishmentLongitude?: string | null;
  customerLat?: string | null;
  customerLng?: string | null;
}): Promise<RadiusDeliveryFeeResult> {
  if (!input.establishmentLatitude || !input.establishmentLongitude) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Estabelecimento sem coordenadas" });
  }

  if (!input.customerLat || !input.customerLng) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione seu endereço usando a busca de endereço" });
  }

  const fees = await db.getRadiusFeesByEstablishment(input.establishmentId);
  if (fees.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma faixa de raio configurada" });
  }

  const { makeRequest } = await import("../_core/map");
  const origin = `${input.establishmentLatitude},${input.establishmentLongitude}`;
  const destination = `${input.customerLat},${input.customerLng}`;

  const result = await makeRequest<{
    rows: Array<{
      elements: Array<{
        distance: { value: number; text: string };
        duration: { value: number; text: string };
        status: string;
      }>;
    }>;
    status: string;
  }>("/maps/api/distancematrix/json", {
    origins: origin,
    destinations: destination,
    mode: "driving",
    units: "metric",
  });

  if (result.status !== "OK" || !result.rows?.[0]?.elements?.[0]) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível calcular a distância" });
  }

  const element = result.rows[0].elements[0];
  if (element.status !== "OK") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Rota indisponível" });
  }

  const distanceKm = element.distance.value / 1000;
  const matchingFee = fees.find((fee) => distanceKm <= parseFloat(fee.maxKm));
  const maxRange = parseFloat(fees[fees.length - 1].maxKm);

  if (!matchingFee) {
    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      distanceText: element.distance.text,
      durationText: element.duration.text,
      fee: null,
      outOfRange: true,
      maxRange,
    };
  }

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceText: element.distance.text,
    durationText: element.duration.text,
    fee: matchingFee.fee,
    outOfRange: false,
    maxRange,
  };
}

export const publicMenuRouter = router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.getPublicMenuData(input.slug);
      }),

    // Buscar horários de funcionamento públicos
    getBusinessHours: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getBusinessHoursForPublicMenu(input.establishmentId);
      }),

    // Buscar info de complementos por IDs (para verificar mudança de preço ao trocar tipo de entrega)
    getComplementItemsInfo: publicProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .query(async ({ input }) => {
        return db.getComplementItemsByIds(input.ids);
      }),

    getProductComplements: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        // Verificar se o produto é um combo
        const product = await db.getProductById(input.productId);
        if (!product) return [];

        // Se for combo, buscar TANTO comboGroups QUANTO complementGroups (importados dos itens)
        if (product.isCombo) {
          // 1. Buscar comboGroups (grupos definidos na criação do combo)
          const comboGroupsData = await db.getComboGroupsByProductId(input.productId);
          const convertedComboGroups = comboGroupsData.map(group => ({
            id: group.id,
            productId: group.productId,
            name: group.name,
            minQuantity: group.minQuantity ?? (group.isRequired ? 1 : 0),
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
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
                availabilityType: 'always' as const,
                availableDays: null,
                availableHours: null,
                badgeText: null,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
              })),
          }));

          // 2. Buscar complementGroups (importados dos itens que tinham complementos)
          const complementGroupsData = await db.getComplementGroupsByProduct(input.productId);
          const complementGroupsWithItems = await Promise.all(
            complementGroupsData
              .filter(group => group.isActive !== false) // Filtrar grupos pausados
              .map(async (group) => {
                const items = await db.getComplementItemsByGroup(group.id);
                return { ...group, items: items.filter(item => {
                  if (!item.isActive) return false;
                  if (item.hasStock && item.stockQuantity !== null && item.stockQuantity <= 0) return false;
                  return true;
                }) };
              })
          );

          // 3. Combinar ambos os tipos de grupos
          return [...convertedComboGroups, ...complementGroupsWithItems];
        }

        // Se NÃO for combo, buscar complementos normais
        const groups = await db.getComplementGroupsByProduct(input.productId);

        // Obter timezone do estabelecimento
        const tz = await db.getEstablishmentTimezone(product.establishmentId);
        const localTime = db.getLocalDate(tz);
        const currentDay = localTime.getDay();
        const currentTime = localTime.toTimeString().slice(0, 5);

        // Usar funcao compartilhada isScheduleAvailable (com suporte a meia-noite)
        const groupsWithItems = await Promise.all(
          groups
            .filter(group => group.isActive !== false) // Filtrar grupos pausados
            .map(async (group) => {
              const items = await db.getComplementItemsByGroup(group.id);
              return {
                ...group,
                items: items.filter(item => {
                  if (!item.isActive) return false;
                  if (item.hasStock && item.stockQuantity !== null && item.stockQuantity <= 0) return false;
                  return db.isScheduleAvailable(item, currentDay, currentTime);
                }),
              };
            })
        );
        return groupsWithItems;
      }),

    // Buscar taxas de entrega por bairro
    getNeighborhoodFees: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getNeighborhoodFeesByEstablishment(input.establishmentId);
      }),

    getRadiusFees: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getRadiusFeesByEstablishment(input.establishmentId);
      }),

    calculateDeliveryFeeByRadius: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerLat: z.string(),
        customerLng: z.string(),
      }))
      .query(async ({ input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        }
        return calculateServerRadiusDeliveryFee({
          establishmentId: input.establishmentId,
          establishmentLatitude: establishment.latitude,
          establishmentLongitude: establishment.longitude,
          customerLat: input.customerLat,
          customerLng: input.customerLng,
        });
      }),

    // Create order from public menu
    createOrder: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerName: z.string().min(1, "Nome é obrigatório"),
        customerPhone: z.string(),
        customerAddress: z.string().optional(),
        customerLat: z.string().optional(),
        customerLng: z.string().optional(),
        deliveryType: z.enum(["delivery", "pickup", "dine_in"]),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto", "card_online", "pix_online"]),
        subtotal: zMoney,
        deliveryFee: zMoneyOptional,
        discount: zMoneyOptional,
        total: zMoney,
        notes: z.string().optional(),
        changeAmount: z.string().optional(),
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        loyaltyCardId: z.number().optional(),
        isScheduled: z.boolean().optional(),
        scheduledAt: z.string().optional(),
        cashbackAmount: zMoneyOptional,
        cashbackCustomerPhone: z.string().optional(),
        isWhatsappLite: z.boolean().optional(),
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
      .mutation(async ({ input }) => {
        const { items, couponId, loyaltyCardId, isScheduled, scheduledAt, cashbackAmount, cashbackCustomerPhone, isWhatsappLite, ...orderData } = input;

        logger.info('[CreateOrder] Iniciando criação de pedido:', {
          establishmentId: orderData.establishmentId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          deliveryType: orderData.deliveryType,
          paymentMethod: orderData.paymentMethod,
          itemsCount: items.length,
          total: orderData.total,
        });

        // Verificar se o estabelecimento está aberto
        const establishment = await db.getEstablishmentById(orderData.establishmentId);
        if (!establishment) {
          db.createOrderLog({
            establishmentId: orderData.establishmentId,
            level: 'error',
            event: 'validation_failed',
            message: `Estabelecimento #${orderData.establishmentId} não encontrado`,
            details: { establishmentId: orderData.establishmentId },
            source: 'publicMenu',
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
          });
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estabelecimento não encontrado',
          });
        }

        // Verificar se o estabelecimento está aberto (cálculo dinâmico baseado em horários de funcionamento)
        // Plano Lite (WhatsApp): pular verificação de loja aberta
        const storeStatus = await db.getEstablishmentOpenStatus(orderData.establishmentId);

        if (!storeStatus.isOpen && !isWhatsappLite) {
          db.createOrderLog({
            establishmentId: orderData.establishmentId,
            level: 'warn',
            event: 'store_closed',
            message: `Tentativa de pedido com estabelecimento fechado`,
            details: { storeStatus },
            source: 'publicMenu',
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
          });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'O estabelecimento está fechado no momento. Não é possível realizar pedidos.',
          });
        }

        // Validar disponibilidade usando timezone do estabelecimento
        const orderTz = establishment.timezone || 'America/Sao_Paulo';
        const orderLocalTime = db.getLocalDate(orderTz);
        const currentDay = orderLocalTime.getDay();
        const currentTime = orderLocalTime.toTimeString().slice(0, 5);

        // Validar disponibilidade das categorias dos produtos
        const productIds = Array.from(new Set(items.map(i => i.productId)));
        for (const productId of productIds) {
          const product = await db.getProductById(productId);
          if (product && product.categoryId) {
            const category = await db.getCategoryById(product.categoryId);
            if (category && !db.isScheduleAvailable(
              {
                availabilityType: category.availabilityType,
                availableDays: category.availableDays as number[] | null,
                availableHours: category.availableHours as { day: number; startTime: string; endTime: string }[] | null,
              },
              currentDay,
              currentTime
            )) {
              db.createOrderLog({
                establishmentId: orderData.establishmentId,
                level: 'warn',
                event: 'category_unavailable',
                message: `Categoria "${category.name}" indisponível neste horário`,
                details: { categoryId: category.id, categoryName: category.name, currentDay, currentTime },
                source: 'publicMenu',
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
              });
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `A categoria "${category.name}" não está disponível neste horário.`,
              });
            }
          }
        }

        // Validar disponibilidade dos complementos (usando funcao compartilhada com suporte a meia-noite)
        for (const item of items) {
          if (item.complements && item.complements.length > 0) {
            const groups = await db.getComplementGroupsByProduct(item.productId);
            for (const group of groups) {
              const complementItems = await db.getComplementItemsByGroup(group.id);

              for (const complement of item.complements) {
                const dbComplement = complementItems.find(c => c.name === complement.name);
                if (dbComplement) {
                  if (!dbComplement.isActive) {
                    db.createOrderLog({
                      establishmentId: orderData.establishmentId,
                      level: 'warn',
                      event: 'complement_unavailable',
                      message: `Complemento "${complement.name}" inativo`,
                      details: { complementName: complement.name, productName: item.productName },
                      source: 'publicMenu',
                      customerName: orderData.customerName,
                      customerPhone: orderData.customerPhone,
                    });
                    throw new TRPCError({
                      code: 'BAD_REQUEST',
                      message: `O complemento "${complement.name}" não está mais disponível.`,
                    });
                  }

                  if (!db.isScheduleAvailable(dbComplement, currentDay, currentTime)) {
                    db.createOrderLog({
                      establishmentId: orderData.establishmentId,
                      level: 'warn',
                      event: 'complement_schedule',
                      message: `Complemento "${complement.name}" fora do horário`,
                      details: { complementName: complement.name, productName: item.productName, currentDay, currentTime },
                      source: 'publicMenu',
                      customerName: orderData.customerName,
                      customerPhone: orderData.customerPhone,
                    });
                    throw new TRPCError({
                      code: 'BAD_REQUEST',
                      message: `O complemento "${complement.name}" não está disponível neste horário.`,
                    });
                  }

                  // Verificar estoque do complemento
                  if (dbComplement.hasStock && dbComplement.stockQuantity !== null && dbComplement.stockQuantity <= 0) {
                    db.createOrderLog({
                      establishmentId: orderData.establishmentId,
                      level: 'warn',
                      event: 'complement_out_of_stock',
                      message: `Complemento "${complement.name}" sem estoque`,
                      details: { complementName: complement.name, productName: item.productName, stockQuantity: dbComplement.stockQuantity },
                      source: 'publicMenu',
                      customerName: orderData.customerName,
                      customerPhone: orderData.customerPhone,
                    });
                    throw new TRPCError({
                      code: 'BAD_REQUEST',
                      message: `O complemento "${complement.name}" está sem estoque.`,
                    });
                  }
                }
              }
            }
          }
        }

        // ── Validação server-side de preços ──
        // Recalcular subtotal com base nos preços reais do banco
        let serverSubtotal = 0;
        for (const item of items) {
          const product = await db.getProductById(item.productId);
          if (!product) {
            db.createOrderLog({
              establishmentId: orderData.establishmentId,
              level: 'error',
              event: 'product_not_found',
              message: `Produto "${item.productName}" (ID: ${item.productId}) não encontrado`,
              details: { productId: item.productId, productName: item.productName },
              source: 'publicMenu',
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
            });
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Produto "${item.productName}" não encontrado.`,
            });
          }

          const realUnitPrice = parseFloat(product.price);
          const claimedUnitPrice = parseMoney(item.unitPrice);

          // Calcular complementos reais (considerando gratuidade por tipo de entrega)
          let complementsTotal = 0;
          if (item.complements && item.complements.length > 0) {
            const groups = await db.getComplementGroupsByProduct(item.productId);
            for (const complement of item.complements) {
              let foundPrice = complement.price; // fallback
              for (const group of groups) {
                const groupItems = await db.getComplementItemsByGroup(group.id, item.productId);
                const dbItem = groupItems.find(ci => ci.name === complement.name);
                if (dbItem) {
                  // Aplicar mesma lógica de gratuidade do frontend (getComplementPrice)
                  foundPrice = getServerComplementPrice(dbItem, orderData.deliveryType);
                  break;
                }
              }
              complementsTotal += foundPrice * (complement.quantity || 1);
            }
          }

          // Verificar se o preço unitário informado é consistente (tolerância de R$ 0.02)
          const expectedUnitPrice = realUnitPrice + complementsTotal;
          if (Math.abs(claimedUnitPrice - expectedUnitPrice) > 0.02) {
            logger.warn('[CreateOrder] Preço unitário inconsistente (ignorado):', {
              productId: item.productId,
              productName: item.productName,
              claimedUnitPrice,
              expectedUnitPrice,
              realProductPrice: realUnitPrice,
              complementsTotal,
            });
            // Log de inconsistência de preço
            db.createOrderLog({
              establishmentId: orderData.establishmentId,
              level: 'warn',
              event: 'price_mismatch',
              message: `Preço inconsistente no produto "${item.productName}": cliente enviou R$ ${claimedUnitPrice.toFixed(2)}, esperado R$ ${expectedUnitPrice.toFixed(2)}`,
              details: { productId: item.productId, productName: item.productName, claimedUnitPrice, expectedUnitPrice, realProductPrice: realUnitPrice, complementsTotal },
              source: 'publicMenu',
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
            });
          }

          serverSubtotal += expectedUnitPrice * item.quantity;
        }

        // Arredondar para 2 casas
        serverSubtotal = Math.round(serverSubtotal * 100) / 100;

        // Verificar se o subtotal informado é consistente
        const claimedSubtotal = parseMoney(orderData.subtotal);
        if (Math.abs(serverSubtotal - claimedSubtotal) > 0.10) {
          logger.warn('[CreateOrder] Subtotal inconsistente (ignorado):', {
            serverSubtotal,
            claimedSubtotal,
            diff: Math.abs(serverSubtotal - claimedSubtotal),
          });
          // NOTA: Validação de subtotal desativada temporariamente para não bloquear pedidos
        }

        // Validar consistência do total (subtotal - discount + deliveryFee - cashback)
        const totalCheck = validateOrderTotal({
          claimedSubtotal: orderData.subtotal,
          claimedDeliveryFee: orderData.deliveryFee || '0',
          claimedDiscount: orderData.discount || '0',
          claimedTotal: orderData.total,
          claimedCashback: cashbackAmount,
        });

        if (!totalCheck.valid) {
          logger.warn('[CreateOrder] Total inconsistente (ignorado):', totalCheck);
          // NOTA: Validação de total desativada temporariamente para não bloquear pedidos
        }

        // Geocodificar endereço quando digitado manualmente (sem lat/lng)
        let finalLat = orderData.customerLat || null;
        let finalLng = orderData.customerLng || null;

        if (!finalLat && !finalLng && orderData.customerAddress && orderData.deliveryType === 'delivery') {
          try {
            const { makeRequest } = await import('../_core/map');
            // Enriquecer endereço com cidade/estado do estabelecimento para melhor precisão
            let geocodeAddress = orderData.customerAddress;
            if (establishment?.city) geocodeAddress += `, ${establishment.city}`;
            if (establishment?.state) geocodeAddress += ` - ${establishment.state}`;
            geocodeAddress += ', Brasil';

            const geocodeResult = await makeRequest<{ results: Array<{ geometry: { location: { lat: number; lng: number } } }>; status: string }>(
              '/maps/api/geocode/json',
              { address: geocodeAddress }
            );

            if (geocodeResult.status === 'OK' && geocodeResult.results.length > 0) {
              const location = geocodeResult.results[0].geometry.location;
              finalLat = String(location.lat);
              finalLng = String(location.lng);
              logger.info('[CreateOrder] Endereço geocodificado com sucesso:', { geocodeAddress, lat: finalLat, lng: finalLng });
            } else {
              logger.warn('[CreateOrder] Geocodificação falhou:', { geocodeAddress, status: geocodeResult.status });
            }
          } catch (geoError) {
            logger.warn('[CreateOrder] Erro ao geocodificar endereço:', geoError);
            // Não bloquear o pedido se a geocodificação falhar
          }
        }

        if (establishment.deliveryFeeType === 'byRadius' && orderData.deliveryType === 'delivery') {
          const radiusDeliveryFee = await calculateServerRadiusDeliveryFee({
            establishmentId: orderData.establishmentId,
            establishmentLatitude: establishment.latitude,
            establishmentLongitude: establishment.longitude,
            customerLat: finalLat,
            customerLng: finalLng,
          });

          if (radiusDeliveryFee.outOfRange || !radiusDeliveryFee.fee) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Endereço fora da área de entrega. Raio máximo: ${radiusDeliveryFee.maxRange} km.`,
            });
          }

          orderData.deliveryFee = radiusDeliveryFee.fee;
          const normalizedTotal =
            parseMoney(orderData.subtotal) +
            parseMoney(radiusDeliveryFee.fee) -
            parseMoney(orderData.discount || '0') -
            parseMoney(cashbackAmount || '0');
          orderData.total = normalizedTotal.toFixed(2);
        }

        try {
          const result = await db.createPublicOrder(
          {
            establishmentId: orderData.establishmentId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress || null,
            customerLat: finalLat,
            customerLng: finalLng,
            deliveryType: orderData.deliveryType,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            deliveryFee: orderData.deliveryFee || "0",
            discount: orderData.discount || "0",
            total: orderData.total,
            notes: orderData.notes || null,
            changeAmount: orderData.changeAmount || null,
            couponCode: orderData.couponCode || null,
            isScheduled: isScheduled || false,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            movedToQueue: false,
            orderNumber: "", // Will be generated in db function
          },
          items.map(item => ({
            orderId: 0, // Will be set in db function
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: (item.complements || []).map(c => ({ ...c, quantity: c.quantity || 1 })),
            notes: item.notes || null,
          })),
          isWhatsappLite ? { isWhatsappLite: true } : undefined
        );

        // Increment coupon usage if coupon was used
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
        }

        // Processar uso de cashback se foi utilizado
        if (cashbackAmount && cashbackCustomerPhone && result && parseFloat(cashbackAmount) > 0) {
          try {
            const cashbackUsed = parseFloat(cashbackAmount);
            // Validar saldo no backend
            const balance = await db.getCashbackBalance(orderData.establishmentId, cashbackCustomerPhone);
            if (balance && parseFloat(balance.balance) >= cashbackUsed) {
              await db.debitCashback({
                establishmentId: orderData.establishmentId,
                customerPhone: cashbackCustomerPhone,
                amount: cashbackUsed.toFixed(2),
                orderId: result.orderId,
              });
              logger.info('[CreateOrder] Cashback utilizado:', cashbackUsed, 'para pedido:', result.orderId);
            } else {
              logger.warn('[CreateOrder] Saldo de cashback insuficiente:', balance?.balance, 'necessário:', cashbackUsed);
            }
          } catch (error) {
            logger.error('[CreateOrder] Erro ao processar cashback:', error);
            // Não lançar erro para não impedir o pedido
          }
        }

        // Consumir cupom de fidelidade e resetar cartão se foi usado
        if (loyaltyCardId && result) {
          try {
            // Limpar o cupom ativo e resetar os carimbos do cartão
            await db.consumeLoyaltyCardCoupon(loyaltyCardId);
            logger.info('[CreateOrder] Cupom de fidelidade consumido, cartão resetado:', loyaltyCardId);
          } catch (error) {
            logger.error('[CreateOrder] Erro ao consumir cupom de fidelidade:', error);
            // Não lançar erro para não impedir o pedido
          }
        }

        logger.info('[CreateOrder] Pedido criado com sucesso:', result);

        // Log de pedido criado com sucesso
        db.createOrderLog({
          establishmentId: orderData.establishmentId,
          orderId: result?.orderId,
          level: 'info',
          event: 'order_created',
          message: `Pedido #${result?.orderNumber} criado com sucesso — ${orderData.deliveryType} — ${orderData.paymentMethod} — R$ ${orderData.total}`,
          details: { orderNumber: result?.orderNumber, deliveryType: orderData.deliveryType, paymentMethod: orderData.paymentMethod, total: orderData.total, subtotal: orderData.subtotal, itemsCount: items.length },
          source: 'publicMenu',
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
        });

        // NOTA: a dedução de estoque de produtos e complementos já é feita
        // automaticamente em db.createPublicOrder -> deductStockForOrder.
        // Não deduzir novamente aqui para evitar desconto duplicado.

        // Salvar/atualizar dados do cliente na tabela pdv_customers
        // Isso permite que o PDV encontre clientes que vieram do menu público
        if (result && orderData.customerPhone) {
          try {
            const customerPhone = orderData.customerPhone.replace(/\D/g, "");
            if (customerPhone.length >= 8) {
              // Para pedidos de entrega, tentar extrair campos do endereço
              let street: string | undefined;
              let number: string | undefined;
              let neighborhood: string | undefined;
              let complement: string | undefined;

              if (orderData.deliveryType === 'delivery' && orderData.customerAddress) {
                // Endereço vem no formato: "Rua X, 123 - Compl - Bairro (Ref: ...)"
                const addressParts = orderData.customerAddress.split(' - ');
                if (addressParts.length >= 1) {
                  const streetAndNumber = addressParts[0].split(', ');
                  street = streetAndNumber[0]?.trim();
                  number = streetAndNumber[1]?.trim();
                }
                if (addressParts.length >= 3) {
                  complement = addressParts[1]?.trim();
                  neighborhood = addressParts[2]?.replace(/\s*\(Ref:.*\)/, '').trim();
                } else if (addressParts.length >= 2) {
                  neighborhood = addressParts[1]?.replace(/\s*\(Ref:.*\)/, '').trim();
                }
              }

              await db.upsertPdvCustomer({
                establishmentId: orderData.establishmentId,
                phone: customerPhone,
                name: orderData.customerName || undefined,
                street,
                number,
                complement,
                neighborhood,
              });
              logger.info('[CreateOrder] Cliente salvo/atualizado em pdv_customers:', { phone: customerPhone, name: orderData.customerName });
            }
          } catch (customerError) {
            logger.error('[CreateOrder] Erro ao salvar cliente em pdv_customers:', customerError);
            // Não lançar erro para não impedir o pedido
          }
        }

        // Adicionar pedido à fila de impressão automática
        logger.info('[CreateOrder] Verificando impressão automática para pedido:', result?.orderId, 'estabelecimento:', orderData.establishmentId);
        if (result && result.orderId) {
          try {
            // Verificar se impressão automática está ativada
            const printerSettingsData = await db.getPrinterSettings(orderData.establishmentId);
            logger.info('[CreateOrder] Configurações de impressão:', printerSettingsData?.autoPrintEnabled, printerSettingsData);
            if (printerSettingsData?.autoPrintEnabled) {
              await db.addToPrintQueue({
                establishmentId: orderData.establishmentId,
                orderId: result.orderId,
                copies: 1
              });
              logger.info('[CreateOrder] Pedido adicionado à fila de impressão:', result.orderId);
            }
          } catch (printError) {
            logger.error('[CreateOrder] Erro ao adicionar à fila de impressão:', printError);
            // Não lançar erro para não impedir o pedido
          }
        }

        if (result && result.orderId && isWhatsappLite && RECEIPT_ALLOWED_PLAN_TYPES.has(String(establishment.planType || "").toLowerCase())) {
          const receipt = createOrderReceiptUrl(result.orderId, orderData.establishmentId);
          return {
            ...result,
            ...receipt,
          };
        }

        return result;
        } catch (error: any) {
          logger.error('[CreateOrder] Erro ao criar pedido:', error);
          logger.error('[CreateOrder] Dados do pedido:', {
            establishmentId: orderData.establishmentId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            deliveryType: orderData.deliveryType,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            total: orderData.total,
            itemsCount: items.length,
          });

          // Log de erro na criação do pedido
          db.createOrderLog({
            establishmentId: orderData.establishmentId,
            level: 'error',
            event: 'order_failed',
            message: `Falha ao criar pedido: ${error?.message || 'Erro desconhecido'}`,
            details: { error: error?.message, stack: error?.stack?.substring(0, 500), customerName: orderData.customerName, customerPhone: orderData.customerPhone, deliveryType: orderData.deliveryType, paymentMethod: orderData.paymentMethod, total: orderData.total, subtotal: orderData.subtotal, itemsCount: items.length },
            source: 'publicMenu',
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
          });
          throw error;
        }
      }),

    // Get order by number (for tracking) - legacy, returns most recent match
    getOrderByNumber: publicProcedure
      .input(z.object({
        orderNumber: z.string(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getPublicOrderByNumber(input.orderNumber, input.establishmentId);
      }),

    // Get order by unique ID (for tracking - preferred over getOrderByNumber)
    getOrderById: publicProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getPublicOrderById(input.orderId);
      }),

    getOrderReceiptAccess: publicProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado.' });
        }

        const establishment = await db.getEstablishmentById(order.establishmentId);
        const planType = String(establishment?.planType || '').toLowerCase();
        if (!RECEIPT_ALLOWED_PLAN_TYPES.has(planType)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Recibo público disponível apenas para pedidos WhatsApp dos planos Grátis e Starter.' });
        }

        return {
          receiptUrl: createOrderReceiptTokenizedUrl(order.id, order.establishmentId),
        };
      }),

    getOrderReceipt: publicProcedure
      .input(z.object({
        orderId: z.number(),
        token: z.string().min(16),
      }))
      .query(async ({ input }) => {
        let tokenPayload: { orderId?: number; establishmentId?: number } | null = null;
        try {
          tokenPayload = verifyOrderReceiptToken(input.token, input.orderId);
        } catch (error) {
          logger.warn('[OrderReceipt] Token de recibo inválido:', error instanceof Error ? error.message : String(error));
          tokenPayload = null;
        }

        if (!tokenPayload?.establishmentId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Link de recibo inválido.' });
        }

        const order = await db.getOrderById(input.orderId);
        if (!order || order.establishmentId !== tokenPayload.establishmentId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado.' });
        }

        const establishment = await db.getEstablishmentById(order.establishmentId);
        const planType = String(establishment?.planType || '').toLowerCase();
        if (!RECEIPT_ALLOWED_PLAN_TYPES.has(planType)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Recibo público disponível apenas para pedidos WhatsApp dos planos Grátis e Starter.' });
        }

        const items = await db.getOrderItems(order.id);
        return {
          order,
          items,
          establishment: establishment ? {
            id: establishment.id,
            name: establishment.name,
            whatsapp: establishment.whatsapp,
            address: [establishment.street, establishment.number, establishment.neighborhood, establishment.city].filter(Boolean).join(', '),
            logo: establishment.logo,
            menuSlug: establishment.menuSlug,
            slug: establishment.menuSlug,
            planType: establishment.planType,
          } : null,
        };
      }),

    // Get orders by phone (for order history)
    getOrdersByPhone: publicProcedure
      .input(z.object({
        phone: z.string(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getOrdersByPhone(input.phone, input.establishmentId);
      }),

    // Validate coupon for checkout
    validateCoupon: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        code: z.string().min(1, "Código do cupom é obrigatório"),
        orderValue: z.number().min(0),
        deliveryType: z.enum(["delivery", "pickup", "self_service"]),
      }))
      .query(async ({ input }) => {
        return db.validateCoupon(
          input.establishmentId,
          input.code.toUpperCase(),
          input.orderValue,
          input.deliveryType
        );
      }),

    // Check if customer can review (last review > 30 days ago)
    canReview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerPhone: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const lastReview = await db.getLastReviewByCustomer(
          input.establishmentId,
          input.customerPhone
        );

        if (!lastReview) {
          return { canReview: true, lastReviewDate: null };
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const canReview = new Date(lastReview.createdAt) < thirtyDaysAgo;
        return {
          canReview,
          lastReviewDate: lastReview.createdAt,
          daysUntilNextReview: canReview ? 0 : Math.ceil((new Date(lastReview.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))
        };
      }),

    // Create review from public menu
    createReview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        orderId: z.number().optional(),
        customerName: z.string().min(1, "Nome é obrigatório"),
        customerPhone: z.string().min(1, "Telefone é obrigatório"),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Avaliações vinculadas a pedido são controladas por orderId: cada pedido pode ser avaliado uma única vez.
        if (input.orderId) {
          const existingReview = await db.getReviewByOrderId(input.orderId);
          if (existingReview) {
            throw new Error("Este pedido já foi avaliado.");
          }
        } else {
          // Avaliações sem pedido seguem a regra geral de 30 dias por cliente.
          const lastReview = await db.getLastReviewByCustomer(
            input.establishmentId,
            input.customerPhone
          );

          if (lastReview) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (new Date(lastReview.createdAt) >= thirtyDaysAgo) {
              throw new Error("Você já avaliou este restaurante nos últimos 30 dias.");
            }
          }
        }

        // Normalizar telefone removendo caracteres especiais
        const normalizedPhone = input.customerPhone.replace(/[^0-9]/g, '');

        const reviewId = await db.createReview({
          establishmentId: input.establishmentId,
          orderId: input.orderId || null,
          customerName: input.customerName,
          customerPhone: normalizedPhone,
          rating: input.rating,
          comment: input.comment || null,
        });
        return { success: true, reviewId };
      }),

    // Get reviews for establishment
    getReviews: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getReviewsByEstablishment(input.establishmentId, input.limit || 50);
      }),

    // ==================== PUBLIC CHAT ====================

    // Find active order for a customer by phone (used for cross-domain support)
    chatGetActiveOrder: publicProcedure
      .input(z.object({
        phone: z.string(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getActiveOrderByPhone(input.phone, input.establishmentId);
      }),
    // Check if customer can chat (has active order + phone matches)
    chatCanChat: publicProcedure
      .input(z.object({
        orderId: z.number(),
        phone: z.string(),
        establishmentId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.canCustomerChat(input.orderId, input.phone);
      }),

    // Get chat messages for an order
    chatGetMessages: publicProcedure
      .input(z.object({
        orderId: z.number(),
        phone: z.string(),
        establishmentId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        // Validate ownership first
        const { canChat } = await db.canCustomerChat(input.orderId, input.phone);
        if (!canChat) return [];
        return db.getPublicChatMessages(input.orderId);
      }),

    // Customer sends a message
    chatSend: publicProcedure
      .input(z.object({
        orderId: z.number(),
        phone: z.string(),
        customerName: z.string().optional(),
        content: z.string().min(1).max(2000),
        establishmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate ownership
        const { canChat, reason } = await db.canCustomerChat(input.orderId, input.phone);
        if (!canChat) {
          throw new TRPCError({ code: "FORBIDDEN", message: reason || "Cannot chat" });
        }

        // Get order to find establishmentId
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Save message to DB
        const messageId = await db.createPublicChatMessage({
          establishmentId: order.establishmentId,
          orderId: input.orderId,
          customerPhone: input.phone.replace(/\D/g, ''),
          customerName: input.customerName || order.customerName || null,
          content: input.content,
          direction: "incoming",
          isRead: false,
        });

        // Notify admin via existing chat SSE (with source indicator)
        const { notifyChatNewMessage } = await import('../_core/sse');
        notifyChatNewMessage(order.establishmentId, {
          source: 'public_menu',
          orderId: input.orderId,
          orderNumber: order.orderNumber,
          phone: input.phone.replace(/\D/g, ''),
          customerName: input.customerName || order.customerName || '',
          content: input.content,
          direction: 'incoming',
          messageId,
          createdAt: new Date().toISOString(),
        });

        // Send push notification to admin devices
        try {
          const { sendPushNotification } = await import('../_core/webPush');
          const subscriptions = await db.getPushSubscriptionsByEstablishment(order.establishmentId);
          if (subscriptions.length > 0) {
            const customerDisplay = input.customerName || order.customerName || 'Cliente';
            for (const sub of subscriptions) {
              try {
                const success = await sendPushNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  {
                    title: `\uD83D\uDCAC Mensagem do Card\u00e1pio`,
                    body: `${customerDisplay}: ${input.content.slice(0, 100)}`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-96x96.png',
                    tag: `public-chat-${input.orderId}`,
                    data: { url: '/chat', orderId: input.orderId },
                  }
                );
                if (!success) {
                  await db.deletePushSubscriptionById(sub.id);
                }
              } catch { /* ignore individual push errors */ }
            }
          }
        } catch { /* don't fail the message send due to push errors */ }

        return { success: true, messageId };
      }),

    // Customer sends an image
    chatSendImage: publicProcedure
      .input(z.object({
        orderId: z.number(),
        phone: z.string(),
        customerName: z.string().optional(),
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
        establishmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate ownership
        const { canChat, reason } = await db.canCustomerChat(input.orderId, input.phone);
        if (!canChat) {
          throw new TRPCError({ code: "FORBIDDEN", message: reason || "Cannot chat" });
        }

        // Get order
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Upload image to S3
        const { mindiStoragePut } = await import('../mindiStorage');
        const { nanoid } = await import('nanoid');
        const buffer = Buffer.from(input.base64, 'base64');
        const ext = input.mimeType === 'image/png' ? 'png' : input.mimeType === 'image/gif' ? 'gif' : input.mimeType === 'image/jpeg' ? 'jpg' : 'webp';
        const fileKey = `chat/public/${order.establishmentId}/${nanoid()}.${ext}`;
        const { url: mediaUrl } = await mindiStoragePut(fileKey, buffer, input.mimeType);

        // Save message to DB with media
        const messageId = await db.createPublicChatMessage({
          establishmentId: order.establishmentId,
          orderId: input.orderId,
          customerPhone: input.phone.replace(/\D/g, ''),
          customerName: input.customerName || order.customerName || null,
          content: '📷 Imagem',
          direction: "incoming",
          mediaUrl,
          mediaType: 'image',
          isRead: false,
        });

        // Notify admin via SSE
        const { notifyChatNewMessage } = await import('../_core/sse');
        notifyChatNewMessage(order.establishmentId, {
          source: 'public_menu',
          orderId: input.orderId,
          orderNumber: order.orderNumber,
          phone: input.phone.replace(/\D/g, ''),
          customerName: input.customerName || order.customerName || '',
          content: '📷 Imagem',
          direction: 'incoming',
          messageId,
          mediaUrl,
          mediaType: 'image',
          createdAt: new Date().toISOString(),
        });

        // Send push notification
        try {
          const { sendPushNotification } = await import('../_core/webPush');
          const subscriptions = await db.getPushSubscriptionsByEstablishment(order.establishmentId);
          if (subscriptions.length > 0) {
            const customerDisplay = input.customerName || order.customerName || 'Cliente';
            for (const sub of subscriptions) {
              try {
                const success = await sendPushNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  {
                    title: `📷 Imagem do Cardápio`,
                    body: `${customerDisplay} enviou uma imagem`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-96x96.png',
                    tag: `public-chat-${input.orderId}`,
                    data: { url: '/chat', orderId: input.orderId },
                  }
                );
                if (!success) {
                  await db.deletePushSubscriptionById(sub.id);
                }
              } catch { /* ignore */ }
            }
          }
        } catch { /* don't fail */ }

        return { success: true, messageId, mediaUrl };
      }),

    // Check if customer has a delivered/completed order pending review.
    pendingReview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerPhone: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const lastReview = await db.getLastReviewByCustomer(
          input.establishmentId,
          input.customerPhone
        );

        if (lastReview) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (new Date(lastReview.createdAt) >= thirtyDaysAgo) {
            return { hasPendingReview: false, order: null };
          }
        }

        const allOrders = await db.getOrdersByPhone(input.customerPhone, input.establishmentId);
        const completedOrder = allOrders.find((order: any) =>
          order.status === 'completed' || order.status === 'delivered'
        );

        if (!completedOrder) {
          return { hasPendingReview: false, order: null };
        }

        const existingReview = await db.getReviewByOrderId(completedOrder.id);
        if (existingReview) {
          return { hasPendingReview: false, order: null };
        }

        return {
          hasPendingReview: true,
          order: {
            id: completedOrder.id,
            orderNumber: completedOrder.orderNumber,
            customerName: completedOrder.customerName,
            customerPhone: completedOrder.customerPhone,
            createdAt: completedOrder.createdAt,
          },
        };
      }),

    // Get upsell suggestions for checkout
    getUpsellSuggestions: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        cartProductIds: z.array(z.number()),
        cartCategoryIds: z.array(z.number()),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getUpsellSuggestions(
          input.establishmentId,
          input.cartProductIds,
          input.cartCategoryIds,
          input.limit || 6
        );
      }),
  });
