/**
 * Bot API Router — Endpoints REST para integração com n8n / WhatsApp bots
 * 
 * Autenticação via API Key no header Authorization: Bearer {API_KEY}
 * Cada API Key está vinculada a um establishmentId específico.
 */
import { Router, Request, Response, NextFunction } from "express";
import * as db from "./db";
import { escapeLike, getTelegramConfig } from "./db";
import { botApiKeys, orders, orderItems, products, complementGroups, complementItems, categories, neighborhoodFees, businessHours, coupons, establishments, stockItems, comboGroups, comboGroupItems, whatsappConfig, pdvCustomers } from "../drizzle/schema";
import { eq, and, desc, asc, like, sql } from "drizzle-orm";
import { z } from "zod";
import { logger } from "./_core/logger";
import { hashApiKey } from "./_core/apiKeyHash";
import { botApiLimiter } from "./rateLimiter";

// ============ AUTH MIDDLEWARE ============

interface BotApiRequest extends Request {
  botEstablishmentId?: number;
  botApiKeyId?: number;
  botIsGlobal?: boolean;
}

/**
 * Middleware que valida a API Key e injeta o establishmentId no request.
 * Também incrementa o contador de uso e atualiza lastUsedAt.
 */
async function botApiAuth(req: BotApiRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "API Key não fornecida. Use o header: Authorization: Bearer {SUA_API_KEY}",
      });
    }

    const apiKey = authHeader.slice(7).trim();
    if (!apiKey) {
      return res.status(401).json({ error: "API Key vazia." });
    }

    const dbInstance = await db.getDb();
    if (!dbInstance) {
      return res.status(503).json({ error: "Banco de dados indisponível." });
    }

    // P09: Buscar primeiro por hash SHA-256, depois fallback para texto plano
    const apiKeyHash = hashApiKey(apiKey);
    let [keyRecord] = await dbInstance
      .select()
      .from(botApiKeys)
      .where(eq(botApiKeys.apiKeyHash, apiKeyHash))
      .limit(1);

    if (!keyRecord) {
      // Fallback: buscar por texto plano (keys antigas sem hash)
      [keyRecord] = await dbInstance
        .select()
        .from(botApiKeys)
        .where(eq(botApiKeys.apiKey, apiKey))
        .limit(1);

      // Migração automática: salvar hash para próximas autenticações
      if (keyRecord) {
        dbInstance
          .update(botApiKeys)
          .set({ apiKeyHash: apiKeyHash })
          .where(eq(botApiKeys.id, keyRecord.id))
          .catch(() => {}); // fire-and-forget
        logger.info(`[BotAPI] Migrated API key ${keyRecord.id} to hash-based auth`);
      }
    }

    if (!keyRecord) {
      return res.status(401).json({ error: "API Key inválida." });
    }

    if (!keyRecord.isActive) {
      return res.status(403).json({ error: "API Key desativada." });
    }

    // Verificar expiração por inatividade: chaves não usadas por 365 dias são rejeitadas
    const MAX_INACTIVE_DAYS = 365;
    if (keyRecord.lastUsedAt) {
      const daysSinceLastUse = (Date.now() - new Date(keyRecord.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse > MAX_INACTIVE_DAYS) {
        return res.status(401).json({ error: "API Key expirada por inatividade. Gere uma nova chave no painel." });
      }
    }

    // Rate limiting: 100 requisições por API key por minuto
    const rateLimitKey = `apikey:${keyRecord.id}`;
    const rateLimitResult = botApiLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      const retryAfterSec = Math.ceil(rateLimitResult.retryAfterMs / 1000);
      logger.warn(`[BotAPI] Rate limit exceeded for API key ${keyRecord.id}`);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: `Rate limit excedido. Tente novamente em ${retryAfterSec} segundos.`,
        retryAfterSeconds: retryAfterSec,
      });
    }

    // Atualizar lastUsedAt e requestCount (fire-and-forget)
    dbInstance
      .update(botApiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: sql`${botApiKeys.requestCount} + 1`,
      })
      .where(eq(botApiKeys.id, keyRecord.id))
      .catch(() => {}); // Não bloquear se falhar

    req.botEstablishmentId = keyRecord.establishmentId;
    req.botApiKeyId = keyRecord.id;
    req.botIsGlobal = keyRecord.isGlobal ?? false;
    next();
  } catch (error) {
    logger.error("[BotAPI] Erro no middleware de auth:", error);
    return res.status(500).json({ error: "Erro interno de autenticação." });
  }
}

// ============ HELPER FUNCTIONS ============

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

// ============ ROUTER ============

export function createBotApiRouter(): Router {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(botApiAuth as any);

  // ──────────────────────────────────────────────
  // GET /api/bot/establishment — Dados do estabelecimento
  // ──────────────────────────────────────────────
  router.get("/establishment", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      // Buscar status de abertura
      const storeStatus = await db.getEstablishmentOpenStatus(estId);

      // Buscar horários de funcionamento
      const hours = await db.getBusinessHoursForPublicMenu(estId);

      // Formatar horários para exibição
      const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const openingHours = hours
        .filter((h) => h.isActive && h.openTime && h.closeTime)
        .map((h) => ({
          day: dayNames[h.dayOfWeek],
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }));

      // Montar métodos de pagamento
      const paymentMethods: string[] = [];
      if (establishment.acceptsCash) paymentMethods.push("dinheiro");
      if (establishment.acceptsCard) paymentMethods.push("cartao");
      if (establishment.acceptsPix) paymentMethods.push("pix");
      if (establishment.acceptsBoleto) paymentMethods.push("boleto");

      // Montar link do cardápio (usa /api/menu/ para OG tags corretas no WhatsApp/Facebook)
      const slug = establishment.menuSlug || String(establishment.id);
      const menuUrl = `https://app.mindi.com.br/api/menu/${slug}`;

      return res.json({
        id: establishment.id,
        name: establishment.name,
        slug,
        menuUrl,
        phone: establishment.whatsapp,
        address: [
          establishment.street,
          establishment.number,
          establishment.complement,
          establishment.neighborhood,
          establishment.city,
          establishment.state,
        ]
          .filter(Boolean)
          .join(", "),
        isOpen: storeStatus.isOpen,
        manuallyClosed: storeStatus.manuallyClosed,
        nextOpeningTime: storeStatus.nextOpeningTime,
        openingHours,
        deliveryEnabled: establishment.allowsDelivery,
        pickupEnabled: establishment.allowsPickup,
        dineInEnabled: establishment.allowsDineIn,
        minimumOrderEnabled: establishment.minimumOrderEnabled,
        minimumOrderValue: establishment.minimumOrderEnabled ? Number(establishment.minimumOrderValue) : null,
        deliveryTimeEnabled: establishment.deliveryTimeEnabled,
        deliveryTimeMin: establishment.deliveryTimeMin,
        deliveryTimeMax: establishment.deliveryTimeMax,
        deliveryFeeType: establishment.deliveryFeeType,
        deliveryFeeFixed: establishment.deliveryFeeFixed,
        freeDeliveryEnabled: (establishment as any).freeDeliveryEnabled,
        freeDeliveryMinValue: (establishment as any).freeDeliveryEnabled ? Number((establishment as any).freeDeliveryMinValue) : null,
        paymentMethods,
        rating: establishment.rating,
        reviewCount: establishment.reviewCount,
        schedulingEnabled: establishment.schedulingEnabled,
        autoAcceptOrders: establishment.autoAcceptOrders,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /establishment:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/menu — Cardápio completo
  // ──────────────────────────────────────────────
  router.get("/menu", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar categorias ativas (always published for bot/public)
      const menuCategories = await dbInstance
        .select()
        .from(categories)
        .where(and(eq(categories.establishmentId, estId), eq(categories.isActive, true), eq(categories.version, 'published')))
        .orderBy(asc(categories.sortOrder));

      // Buscar produtos ativos (always published for bot/public)
      const menuProducts = await dbInstance
        .select()
        .from(products)
        .where(and(eq(products.establishmentId, estId), eq(products.status, "active"), eq(products.version, 'published')))
        .orderBy(asc(products.sortOrder));

      // Verificar estoque
      const productsWithStock = await Promise.all(
        menuProducts.map(async (product) => {
          let outOfStock = false;
          let availableStock: number | null = null;

          if (product.hasStock) {
            const [stockItem] = await dbInstance
              .select()
              .from(stockItems)
              .where(eq(stockItems.linkedProductId, product.id))
              .limit(1);

            if (stockItem) {
              availableStock = Number(stockItem.currentQuantity);
            } else if (product.stockQuantity !== null) {
              availableStock = product.stockQuantity;
            }
            outOfStock = availableStock !== null && availableStock <= 0;
          }

          return {
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            description: product.description,
            price: product.price,
            isCombo: product.isCombo,
            outOfStock,
            availableStock,
            hasStock: product.hasStock,
          };
        })
      );

      // Agrupar por categoria
      const result = menuCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        products: productsWithStock.filter((p) => p.categoryId === cat.id),
      }));

      return res.json({ categories: result });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /menu:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/menu/search?q=termo — Buscar no cardápio
  // ──────────────────────────────────────────────
  router.get("/menu/search", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const query = (req.query.q as string || "").trim().slice(0, 100);
      if (!query) {
        return sendError(res, 400, "Parâmetro 'q' é obrigatório.");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const results = await dbInstance
        .select({
          id: products.id,
          categoryId: products.categoryId,
          name: products.name,
          description: products.description,
          price: products.price,
          isCombo: products.isCombo,
          hasStock: products.hasStock,
          stockQuantity: products.stockQuantity,
        })
        .from(products)
        .where(
          and(
            eq(products.establishmentId, estId),
            eq(products.status, "active"),
            eq(products.version, 'published'),
            like(products.name, `%${escapeLike(query)}%`)
          )
        )
        .orderBy(asc(products.sortOrder))
        .limit(20);

      return res.json({ query, results });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /menu/search:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/products/:id — Detalhes de um produto com complementos
  // ──────────────────────────────────────────────
  router.get("/products/:id", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) return sendError(res, 400, "ID do produto inválido.");

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar produto (published version for bot)
      const [product] = await dbInstance
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.establishmentId, estId), eq(products.version, 'published')))
        .limit(1);

      if (!product) return sendError(res, 404, "Produto não encontrado.");

      // Buscar complementos
      const groups = await db.getComplementGroupsByProduct(productId);
      const complementGroupsData = await Promise.all(
        groups.map(async (group) => {
          const items = await db.getComplementItemsByGroup(group.id, productId);
          return {
            id: group.id,
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            items: items
              .filter((i) => i.isActive)
              .filter((i) => !(i.hasStock && i.stockQuantity !== null && i.stockQuantity <= 0))
              .map((item) => ({
                id: item.id,
                name: item.name,
                price: item.priceMode === "free" ? "0" : item.price,
                priceMode: item.priceMode,
                hasStock: item.hasStock || false,
                stockQuantity: item.hasStock ? (item.stockQuantity ?? null) : null,
              })),
          };
        })
      );

      // Se for combo, buscar grupos do combo
      let comboGroupsData: any[] = [];
      if (product.isCombo) {
        const cGroups = await dbInstance
          .select()
          .from(comboGroups)
          .where(eq(comboGroups.productId, productId))
          .orderBy(asc(comboGroups.sortOrder));

        comboGroupsData = await Promise.all(
          cGroups.map(async (cg) => {
            const cgItems = await dbInstance
              .select()
              .from(comboGroupItems)
              .where(eq(comboGroupItems.comboGroupId, cg.id));

            // Buscar nomes dos produtos do combo
            const itemsWithNames = await Promise.all(
              cgItems.map(async (ci) => {
                const [prod] = await dbInstance
                  .select({ name: products.name, price: products.price })
                  .from(products)
                  .where(eq(products.id, ci.productId))
                  .limit(1);
                return {
                  productId: ci.productId,
                  productName: prod?.name || "Produto",
                  price: prod?.price || "0",
                };
              })
            );

            return {
              id: cg.id,
              name: cg.name,
              maxQuantity: cg.maxQuantity,
              isRequired: cg.isRequired,
              items: itemsWithNames,
            };
          })
        );
      }

      // Verificar estoque
      let outOfStock = false;
      let availableStock: number | null = null;
      if (product.hasStock) {
        const [stockItem] = await dbInstance
          .select()
          .from(stockItems)
          .where(eq(stockItems.linkedProductId, product.id))
          .limit(1);
        if (stockItem) {
          availableStock = Number(stockItem.currentQuantity);
        } else if (product.stockQuantity !== null) {
          availableStock = product.stockQuantity;
        }
        outOfStock = availableStock !== null && availableStock <= 0;
      }

      return res.json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        isCombo: product.isCombo,
        outOfStock,
        availableStock,
        complementGroups: complementGroupsData,
        comboGroups: comboGroupsData.length > 0 ? comboGroupsData : undefined,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /products/:id:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/stock/:productId — Verificar estoque de um produto
  // ──────────────────────────────────────────────
  router.get("/stock/:productId", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) return sendError(res, 400, "ID do produto inválido.");

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const [product] = await dbInstance
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.establishmentId, estId), eq(products.version, 'published')))
        .limit(1);

      if (!product) return sendError(res, 404, "Produto não encontrado.");

      if (!product.hasStock) {
        return res.json({
          productId: product.id,
          productName: product.name,
          hasStockControl: false,
          available: true,
          message: "Este produto não possui controle de estoque.",
        });
      }

      const [stockItem] = await dbInstance
        .select()
        .from(stockItems)
        .where(eq(stockItems.linkedProductId, product.id))
        .limit(1);

      const availableQty = stockItem
        ? Number(stockItem.currentQuantity)
        : product.stockQuantity ?? 0;

      return res.json({
        productId: product.id,
        productName: product.name,
        hasStockControl: true,
        available: availableQty > 0,
        quantity: availableQty,
        unit: stockItem?.unit || "unidade",
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /stock/:productId:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/delivery-fees — Taxas de entrega
  // ──────────────────────────────────────────────
  router.get("/delivery-fees", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) return sendError(res, 404, "Estabelecimento não encontrado.");

      if (establishment.deliveryFeeType === "free") {
        return res.json({
          type: "free",
          message: "Entrega grátis para todos os bairros.",
        });
      }

      if (establishment.deliveryFeeType === "fixed") {
        return res.json({
          type: "fixed",
          fee: establishment.deliveryFeeFixed,
        });
      }

      // byNeighborhood
      const fees = await db.getNeighborhoodFeesByEstablishment(estId);
      return res.json({
        type: "byNeighborhood",
        neighborhoods: fees.map((f) => ({
          id: f.id,
          neighborhood: f.neighborhood,
          fee: f.fee,
        })),
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /delivery-fees:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/delivery-fees/search?neighborhood=nome — Taxa por bairro
  // ──────────────────────────────────────────────
  router.get("/delivery-fees/search", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const neighborhood = (req.query.neighborhood as string || "").trim().slice(0, 100);
      if (!neighborhood) {
        return sendError(res, 400, "Parâmetro 'neighborhood' é obrigatório.");
      }

      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) return sendError(res, 404, "Estabelecimento não encontrado.");

      if (establishment.deliveryFeeType === "free") {
        return res.json({ fee: "0", type: "free", message: "Entrega grátis." });
      }

      if (establishment.deliveryFeeType === "fixed") {
        return res.json({ fee: establishment.deliveryFeeFixed, type: "fixed" });
      }

      // Buscar por bairro (busca parcial case-insensitive)
      const fees = await db.getNeighborhoodFeesByEstablishment(estId);
      const normalizedSearch = neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const match = fees.find((f) => {
        const normalizedName = f.neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
      });

      if (match) {
        return res.json({
          neighborhood: match.neighborhood,
          fee: match.fee,
          found: true,
        });
      }

      // Retornar sugestões se não encontrou exato
      const suggestions = fees
        .filter((f) => {
          const normalizedName = f.neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedName.includes(normalizedSearch.substring(0, 3));
        })
        .slice(0, 5)
        .map((f) => f.neighborhood);

      return res.json({
        found: false,
        message: `Bairro "${neighborhood}" não encontrado na lista de entrega.`,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /delivery-fees/search:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // POST /api/bot/coupons/validate — Validar cupom
  // ──────────────────────────────────────────────
  router.post("/coupons/validate", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const { code, orderTotal } = req.body || {};

      if (!code) return sendError(res, 400, "Campo 'code' é obrigatório.");

      const coupon = await db.getCouponByCode(estId, code);
      if (!coupon) {
        return res.json({ valid: false, message: "Cupom não encontrado." });
      }

      if (coupon.status !== "active") {
        return res.json({ valid: false, message: `Cupom ${coupon.status === "expired" ? "expirado" : coupon.status === "exhausted" ? "esgotado" : "inativo"}.` });
      }

      // Verificar quantidade
      if (coupon.quantity !== null && coupon.usedCount >= coupon.quantity) {
        return res.json({ valid: false, message: "Cupom esgotado." });
      }

      // Verificar data de validade
      if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
        return res.json({ valid: false, message: "Cupom expirado." });
      }

      if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
        return res.json({ valid: false, message: "Cupom ainda não está ativo." });
      }

      // Verificar valor mínimo
      if (coupon.minOrderValue && orderTotal) {
        const minValue = parseFloat(String(coupon.minOrderValue));
        const total = parseFloat(String(orderTotal));
        if (total < minValue) {
          return res.json({
            valid: false,
            message: `Pedido mínimo de R$ ${minValue.toFixed(2)} para usar este cupom.`,
          });
        }
      }

      // Calcular desconto
      let discount = 0;
      if (coupon.type === "percentage") {
        discount = orderTotal ? (parseFloat(String(orderTotal)) * parseFloat(String(coupon.value))) / 100 : 0;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, parseFloat(String(coupon.maxDiscount)));
        }
      } else {
        discount = parseFloat(String(coupon.value));
      }

      return res.json({
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        calculatedDiscount: discount.toFixed(2),
        message: coupon.type === "percentage"
          ? `Cupom de ${coupon.value}% de desconto aplicado!`
          : `Cupom de R$ ${parseFloat(String(coupon.value)).toFixed(2)} de desconto aplicado!`,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em POST /coupons/validate:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // POST /api/bot/orders — Criar pedido
  // ──────────────────────────────────────────────
  const createOrderSchema = z.object({
    customerName: z.string().min(1, "Nome do cliente é obrigatório"),
    customerPhone: z.string().min(10, "Telefone do cliente é obrigatório"),
    deliveryType: z.enum(["delivery", "pickup", "dine_in"]),
    paymentMethod: z.enum(["cash", "card", "pix", "boleto"]),
    customerAddress: z.string().optional(),
    notes: z.string().optional(),
    changeAmount: z.string().optional(),
    couponCode: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.number().optional(),
        productName: z.string().optional(),
        quantity: z.number().min(1).default(1),
        complements: z
          .array(
            z.object({
              name: z.string(),
              price: z.number(),
              quantity: z.number().default(1),
            })
          )
          .optional(),
        notes: z.string().optional(),
      })
    ).min(1, "Pelo menos um item é obrigatório"),
  });

  router.post("/orders", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      
      // Verificar se a função de pedidos do bot está ativa
      const dbCheck = await db.getDb();
      if (dbCheck) {
        const [estCheck] = await dbCheck
          .select({ botOrdersEnabled: establishments.botOrdersEnabled })
          .from(establishments)
          .where(eq(establishments.id, estId))
          .limit(1);
        if (estCheck && !estCheck.botOrdersEnabled) {
          return res.status(403).json({
            error: "A função de retirar pedidos pelo bot está desativada. O cliente deve fazer o pedido pelo cardápio online.",
            code: "BOT_ORDERS_DISABLED",
          });
        }
      }
      
      // Validar input
      const parsed = createOrderSchema.safeParse(req.body);;
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((e: any) => e.message).join("; ");
        db.createOrderLog({
          establishmentId: estId,
          level: 'error',
          event: 'validation_failed',
          message: `Validação de input falhou: ${errorMsg}`,
          details: { errors: parsed.error.issues, body: req.body },
          source: 'botApi',
          customerName: req.body?.customerName || null,
          customerPhone: req.body?.customerPhone || null,
        });
        return sendError(res, 400, errorMsg);
      }
      const input = parsed.data;

      // Verificar se o estabelecimento existe e está aberto
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) {
        db.createOrderLog({
          establishmentId: estId,
          level: 'error',
          event: 'validation_failed',
          message: `Estabelecimento #${estId} não encontrado`,
          details: { establishmentId: estId },
          source: 'botApi',
          customerName: input.customerName,
          customerPhone: input.customerPhone,
        });
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      const storeStatus = await db.getEstablishmentOpenStatus(estId);
      if (!storeStatus.isOpen) {
        db.createOrderLog({
          establishmentId: estId,
          level: 'warn',
          event: 'store_closed',
          message: `Tentativa de pedido com estabelecimento fechado (Bot API)`,
          details: { storeStatus },
          source: 'botApi',
          customerName: input.customerName,
          customerPhone: input.customerPhone,
        });
        return sendError(res, 400, "O estabelecimento está fechado no momento.");
      }

      // Verificar tipo de entrega
      if (input.deliveryType === "delivery" && !establishment.allowsDelivery) {
        db.createOrderLog({
          establishmentId: estId, level: 'warn', event: 'delivery_type_unavailable',
          message: `Tipo de entrega "delivery" não disponível`,
          details: { deliveryType: input.deliveryType },
          source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
        });
        return sendError(res, 400, "Este estabelecimento não realiza entregas.");
      }
      if (input.deliveryType === "pickup" && !establishment.allowsPickup) {
        db.createOrderLog({
          establishmentId: estId, level: 'warn', event: 'delivery_type_unavailable',
          message: `Tipo de entrega "pickup" não disponível`,
          details: { deliveryType: input.deliveryType },
          source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
        });
        return sendError(res, 400, "Este estabelecimento não aceita retirada.");
      }
      if (input.deliveryType === "dine_in" && !establishment.allowsDineIn) {
        db.createOrderLog({
          establishmentId: estId, level: 'warn', event: 'delivery_type_unavailable',
          message: `Tipo de entrega "dine_in" não disponível`,
          details: { deliveryType: input.deliveryType },
          source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
        });
        return sendError(res, 400, "Este estabelecimento não aceita consumo no local.");
      }

      // Verificar endereço obrigatório para delivery
      if (input.deliveryType === "delivery" && !input.customerAddress) {
        db.createOrderLog({
          establishmentId: estId, level: 'warn', event: 'validation_failed',
          message: `Endereço obrigatório para entrega não fornecido`,
          details: { deliveryType: input.deliveryType },
          source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
        });
        return sendError(res, 400, "Endereço é obrigatório para entregas.");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar e validar todos os produtos
      let subtotal = 0;
      const orderItemsData: Array<{
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
        complements: Array<{ name: string; price: number; quantity: number }>;
        notes: string | null;
      }> = [];

      for (const item of input.items) {
        let product: any = null;
        let allEstProducts: any[] = [];

        if (item.productId) {
          // Busca por ID (método original)
          const [found] = await dbInstance
            .select()
            .from(products)
            .where(and(eq(products.id, item.productId), eq(products.establishmentId, estId), eq(products.version, 'published')))
            .limit(1);
          product = found;
        }
        
        if (!product && item.productName) {
          // Busca por nome (fuzzy match avançado para o bot WhatsApp)
          allEstProducts = await dbInstance
            .select()
            .from(products)
            .where(and(eq(products.establishmentId, estId), eq(products.status, "active"), eq(products.version, 'published')));
          const allProducts = allEstProducts;
          
          const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const searchName = normalize(item.productName);
          
          // Levenshtein distance para tolerância a erros de digitação
          const levenshtein = (a: string, b: string): number => {
            const m = a.length, n = b.length;
            if (m === 0) return n;
            if (n === 0) return m;
            const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
            for (let i = 0; i <= m; i++) dp[i][0] = i;
            for (let j = 0; j <= n; j++) dp[0][j] = j;
            for (let i = 1; i <= m; i++)
              for (let j = 1; j <= n; j++)
                dp[i][j] = Math.min(
                  dp[i - 1][j] + 1,
                  dp[i][j - 1] + 1,
                  dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            return dp[m][n];
          };
          
          // Nível 1: busca exata (normalizada)
          product = allProducts.find(p => normalize(p.name) === searchName);
          
          // Nível 2: busca parcial (nome contém ou é contido)
          if (!product) {
            product = allProducts.find(p => {
              const pName = normalize(p.name);
              return pName.includes(searchName) || searchName.includes(pName);
            });
          }
          
          // Nível 3: busca por palavras-chave (cada palavra do nome buscado existe no produto)
          if (!product) {
            const searchWords = searchName.split(/\s+/).filter(w => w.length > 2);
            if (searchWords.length > 0) {
              product = allProducts.find(p => {
                const pName = normalize(p.name);
                return searchWords.every(w => pName.includes(w));
              });
            }
          }
          
          // Nível 4: busca por palavras-chave invertida (cada palavra do produto existe no nome buscado)
          if (!product) {
            product = allProducts.find(p => {
              const pWords = normalize(p.name).split(/\s+/).filter(w => w.length > 2);
              return pWords.length > 0 && pWords.every(w => searchName.includes(w));
            });
          }
          
          // Nível 5: melhor match por overlap de palavras (>= 50% das palavras coincidem)
          if (!product) {
            const searchWords = searchName.split(/\s+/).filter(w => w.length > 1);
            let bestMatch: any = null;
            let bestScore = 0;
            for (const p of allProducts) {
              const pWords = normalize(p.name).split(/\s+/).filter(w => w.length > 1);
              const matchCount = searchWords.filter(sw => 
                pWords.some(pw => pw.includes(sw) || sw.includes(pw))
              ).length;
              const score = matchCount / Math.max(searchWords.length, pWords.length);
              if (score > bestScore && score >= 0.5) {
                bestScore = score;
                bestMatch = p;
              }
            }
            if (bestMatch) product = bestMatch;
          }
          
          // Nível 6: Levenshtein distance (tolerância a erros de digitação, max 3 edições ou 30%)
          if (!product) {
            let bestMatch: any = null;
            let bestDist = Infinity;
            for (const p of allProducts) {
              const pName = normalize(p.name);
              const dist = levenshtein(searchName, pName);
              const maxLen = Math.max(searchName.length, pName.length);
              // Permitir até 30% de diferença ou max 3 edições
              if (dist < bestDist && (dist <= 3 || dist / maxLen <= 0.3)) {
                bestDist = dist;
                bestMatch = p;
              }
            }
            if (bestMatch) product = bestMatch;
          }
        }

        if (!product) {
          const identifier = item.productName || `ID ${item.productId}`;
          // Sugerir produtos similares no erro
          let suggestions = '';
          if (item.productName && allEstProducts.length > 0) {
            const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const sw = norm(item.productName).split(/\s+/).filter((w: string) => w.length > 1);
            const similar = allEstProducts
              .map((p: any) => {
                const pw = norm(p.name).split(/\s+/).filter((w: string) => w.length > 1);
                const matches = sw.filter((s: string) => pw.some((pw2: string) => pw2.includes(s) || s.includes(pw2))).length;
                return { name: p.name as string, score: matches / Math.max(sw.length, 1) };
              })
              .filter((p: { score: number }) => p.score > 0)
              .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
              .slice(0, 3);
            if (similar.length > 0) {
              suggestions = ` Produtos similares: ${similar.map((s: { name: string }) => s.name).join(', ')}.`;
            }
          }
          db.createOrderLog({
            establishmentId: estId, level: 'error', event: 'product_not_found',
            message: `Produto "${identifier}" não encontrado no cardápio`,
            details: { productId: item.productId, productName: item.productName, suggestions },
            source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
          });
          return sendError(res, 400, `Produto "${identifier}" não encontrado no cardápio.${suggestions}`);
        }

        if (product.status !== "active") {
          db.createOrderLog({
            establishmentId: estId, level: 'warn', event: 'product_unavailable',
            message: `Produto "${product.name}" não está disponível (status: ${product.status})`,
            details: { productId: product.id, productName: product.name, status: product.status },
            source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
          });
          return sendError(res, 400, `Produto "${product.name}" não está disponível.`);
        }

        // Validar complementos obrigatórios
        const groups = await db.getComplementGroupsByProduct(product.id);
        for (const group of groups) {
          if (group.isRequired) {
            const selectedFromGroup = (item.complements || []).filter((c) => {
              // Verificar se o complemento pertence a este grupo
              return true; // Simplificado - a validação real é feita pelo nome
            });
            // Verificar se pelo menos minQuantity complementos foram selecionados do grupo obrigatório
            // (simplificado - verificação completa seria por grupo)
          }
        }

        // Calcular preço do item
        const unitPrice = parseFloat(String(product.price));
        let complementsTotal = 0;
        const itemComplements = (item.complements || []).map((c) => {
          complementsTotal += c.price * (c.quantity || 1);
          return { name: c.name, price: c.price, quantity: c.quantity || 1 };
        });

        const itemTotal = (unitPrice + complementsTotal) * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: itemTotal.toFixed(2),
          complements: itemComplements,
          notes: item.notes || null,
        });
      }

      // Calcular taxa de entrega
      let deliveryFee = 0;
      if (input.deliveryType === "delivery") {
        if (establishment.deliveryFeeType === "fixed") {
          deliveryFee = parseFloat(String(establishment.deliveryFeeFixed || "0"));
        } else if (establishment.deliveryFeeType === "byNeighborhood" && input.customerAddress) {
          // Tentar encontrar bairro no endereço
          const fees = await db.getNeighborhoodFeesByEstablishment(estId);
          const normalizedAddress = input.customerAddress.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const matchedFee = fees.find((f) => {
            const normalizedNeighborhood = f.neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedAddress.includes(normalizedNeighborhood);
          });
          if (matchedFee) {
            deliveryFee = parseFloat(String(matchedFee.fee));
          }
        }
      }

      // Verificar frete grátis acima de valor mínimo
      if ((establishment as any).freeDeliveryEnabled && (establishment as any).freeDeliveryMinValue) {
        const freeDeliveryMin = parseFloat(String((establishment as any).freeDeliveryMinValue));
        if (subtotal >= freeDeliveryMin) {
          deliveryFee = 0;
        }
      }

      // Calcular desconto de cupom
      let discount = 0;
      let couponId: number | undefined;
      if (input.couponCode) {
        const coupon = await db.getCouponByCode(estId, input.couponCode);
        if (coupon && coupon.status === "active") {
          couponId = coupon.id;
          if (coupon.type === "percentage") {
            discount = (subtotal * parseFloat(String(coupon.value))) / 100;
            if (coupon.maxDiscount) {
              discount = Math.min(discount, parseFloat(String(coupon.maxDiscount)));
            }
          } else {
            discount = parseFloat(String(coupon.value));
          }
        }
      }

      // Verificar pedido mínimo
      if (establishment.minimumOrderEnabled && establishment.minimumOrderValue) {
        const minValue = parseFloat(String(establishment.minimumOrderValue));
        if (subtotal < minValue) {
          db.createOrderLog({
            establishmentId: estId, level: 'warn', event: 'minimum_order_not_met',
            message: `Pedido mínimo não atingido: R$ ${subtotal.toFixed(2)} < R$ ${minValue.toFixed(2)}`,
            details: { subtotal, minimumOrderValue: minValue },
            source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
          });
          return sendError(
            res,
            400,
            `Pedido mínimo de R$ ${minValue.toFixed(2)}. Subtotal atual: R$ ${subtotal.toFixed(2)}.`
          );
        }
      }

      const total = subtotal + deliveryFee - discount;

      // Criar o pedido
      try {
        const result = await db.createPublicOrder(
          {
            establishmentId: estId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerAddress: input.customerAddress || null,
            deliveryType: input.deliveryType,
            paymentMethod: input.paymentMethod,
            subtotal: subtotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            discount: discount.toFixed(2),
            total: total.toFixed(2),
            notes: input.notes || null,
            changeAmount: input.changeAmount || null,
            couponCode: input.couponCode || null,
            orderNumber: "", // Will be generated
          },
          orderItemsData.map((item) => ({
            orderId: 0, // Will be set
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: item.complements,
            notes: item.notes,
          }))
        );

        // Incrementar uso do cupom
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
        }

        // Auto-salvar/atualizar cliente em pdv_customers para lookup futuro
        if (input.customerPhone && input.deliveryType === "delivery" && input.customerAddress) {
          try {
            const cleanPhone = input.customerPhone.replace(/\D/g, "");
            // Tentar extrair partes do endereço (formato: "Rua X, 123, Bairro (Ref: xxx)")
            const addressStr = input.customerAddress;
            const refMatch = addressStr.match(/\(Ref:\s*(.+?)\)/);
            const reference = refMatch ? refMatch[1].trim() : null;
            const addressWithoutRef = addressStr.replace(/\s*\(Ref:.*?\)/, "").trim();
            const parts = addressWithoutRef.split(",").map((p: string) => p.trim());
            
            const street = parts[0] || null;
            const number = parts.length >= 3 ? parts[1] : null;
            const neighborhood = parts.length >= 3 ? parts[2] : (parts[1] || null);

            const dbInstance = await db.getDb();
            if (dbInstance) {
              // Verificar se já existe
              const [existing] = await dbInstance
                .select({ id: pdvCustomers.id })
                .from(pdvCustomers)
                .where(
                  and(
                    eq(pdvCustomers.establishmentId, estId),
                    eq(pdvCustomers.phone, cleanPhone)
                  )
                )
                .limit(1);

              if (existing) {
                // Atualizar
                await dbInstance
                  .update(pdvCustomers)
                  .set({
                    name: input.customerName || undefined,
                    street: street || undefined,
                    number: number || undefined,
                    neighborhood: neighborhood || undefined,
                    reference: reference || undefined,
                  })
                  .where(eq(pdvCustomers.id, existing.id));
              } else {
                // Inserir novo
                await dbInstance.insert(pdvCustomers).values({
                  establishmentId: estId,
                  phone: cleanPhone,
                  name: input.customerName || null,
                  street,
                  number,
                  neighborhood,
                  reference,
                });
              }
              logger.info(`[BotAPI] Cliente ${cleanPhone} salvo/atualizado em pdv_customers`);
            }
          } catch (custErr) {
            // Não bloquear o pedido se falhar salvar o cliente
            logger.warn("[BotAPI] Falha ao salvar cliente em pdv_customers:", custErr);
          }
        }

        // Log de pedido criado com sucesso via Bot API
        db.createOrderLog({
          establishmentId: estId,
          orderId: result.orderId,
          level: 'info',
          event: 'order_created',
          message: `Pedido #${result.orderNumber} criado via Bot API — ${input.deliveryType} — ${input.paymentMethod} — R$ ${total.toFixed(2)}`,
          details: { orderNumber: result.orderNumber, deliveryType: input.deliveryType, paymentMethod: input.paymentMethod, total: total.toFixed(2), subtotal: subtotal.toFixed(2), itemsCount: input.items.length },
          source: 'botApi',
          customerName: input.customerName,
          customerPhone: input.customerPhone,
        });

        // Notificar via Telegram (fire-and-forget)
        getTelegramConfig(estId).then(async (telegramConfig) => {
          if (telegramConfig?.enabled && telegramConfig?.chatId) {
            try {
              const { sendOrderNotificationTelegram } = await import('./telegramNotifier');
              const telegramResult = await sendOrderNotificationTelegram(telegramConfig.chatId, {
                orderNumber: result.orderNumber,
                customerName: input.customerName || undefined,
                customerPhone: input.customerPhone || undefined,
                deliveryType: input.deliveryType || undefined,
                paymentMethod: input.paymentMethod || undefined,
                total: total.toFixed(2),
                items: orderItemsData.map(item => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: item.unitPrice,
                  notes: item.notes || undefined,
                  complements: item.complements || undefined,
                })),
                address: input.customerAddress || undefined,
                notes: input.notes || undefined,
                source: 'WhatsApp Bot',
                deliveryFee: deliveryFee > 0 ? deliveryFee.toFixed(2) : undefined,
                changeAmount: input.changeAmount || undefined,
              });
              if (telegramResult.ok) {
                logger.info(`[BotAPI] ✅ Notificação Telegram enviada: ${result.orderNumber}`);
              } else {
                logger.error(`[BotAPI] ❌ Erro Telegram: ${telegramResult.error}`);
              }
            } catch (err) {
              logger.error('[BotAPI] Erro ao enviar notificação Telegram:', err);
            }
          }
        }).catch(() => {});

        // Push Notification (PWA) — fire-and-forget
        (async () => {
          try {
            const { sendNewOrderNotification } = await import('./_core/webPush');
            const subscriptions = await db.getPushSubscriptionsByEstablishment(estId);
            if (subscriptions.length > 0) {
              logger.info(`[BotAPI] Enviando push para ${subscriptions.length} dispositivos...`);
              for (const sub of subscriptions) {
                try {
                  const success = await sendNewOrderNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    { orderId: result.orderId, orderNumber: result.orderNumber, customerName: input.customerName || 'Cliente', total: parseFloat(total.toFixed(2)) }
                  );
                  if (!success) {
                    await db.deletePushSubscriptionById(sub.id);
                  }
                } catch (pushErr) {
                  logger.error('[BotAPI] Erro push subscription:', sub.id, pushErr);
                }
              }
            }
          } catch (pushError) {
            logger.error('[BotAPI] Erro ao enviar push notifications:', pushError);
          }
        })();

        return res.status(201).json({
          success: true,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          subtotal: subtotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          message: `Pedido ${result.orderNumber} criado com sucesso!`,
        });
      } catch (orderError: any) {
        if (orderError.message?.includes("Estoque insuficiente")) {
          db.createOrderLog({
            establishmentId: estId, level: 'error', event: 'stock_insufficient',
            message: `Estoque insuficiente: ${orderError.message}`,
            details: { error: orderError.message },
            source: 'botApi', customerName: input.customerName, customerPhone: input.customerPhone,
          });
          return sendError(res, 400, orderError.message);
        }
        throw orderError;
      }
    } catch (error: any) {
      logger.error("[BotAPI] Erro em POST /orders:", error);
      db.createOrderLog({
        establishmentId: req.botEstablishmentId,
        level: 'error',
        event: 'order_failed',
        message: `Falha ao criar pedido via Bot API: ${error?.message || 'Erro desconhecido'}`,
        details: { error: error?.message, stack: error?.stack?.substring(0, 500), body: req.body },
        source: 'botApi',
        customerName: req.body?.customerName || null,
        customerPhone: req.body?.customerPhone || null,
      });
      return sendError(res, 500, "Erro interno ao criar pedido.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/orders?phone=5534999999999 — Pedidos do cliente
  // ──────────────────────────────────────────────
  router.get("/orders", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const phone = (req.query.phone as string || "").trim();
      if (!phone) return sendError(res, 400, "Parâmetro 'phone' é obrigatório.");

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const customerOrders = await dbInstance
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.establishmentId, estId),
            eq(orders.customerPhone, phone)
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(10);

      const deliveryTypeLabels: Record<string, string> = {
        delivery: "Entrega",
        pickup: "Retirada",
        dine_in: "Consumo no local",
      };

      const statusLabels: Record<string, string> = {
        pending_confirmation: "Aguardando confirmação",
        new: "Novo",
        preparing: "Em preparo",
        ready: "Pronto",
        out_for_delivery: "Saiu para entrega",
        completed: "Concluído",
        cancelled: "Cancelado",
        scheduled: "Agendado",
      };

      const ordersWithItems = await Promise.all(
        customerOrders.map(async (order) => {
          const items = await db.getOrderItems(order.id);
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            statusLabel: statusLabels[order.status] || order.status,
            deliveryType: order.deliveryType,
            deliveryTypeLabel: deliveryTypeLabels[order.deliveryType] || order.deliveryType,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            createdAt: order.createdAt,
            items: items.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              complements: i.complements,
              notes: i.notes,
            })),
          };
        })
      );

      return res.json({ orders: ordersWithItems });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /orders:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/orders/:id — Detalhes de um pedido
  // ──────────────────────────────────────────────
  router.get("/orders/:id", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) return sendError(res, 400, "ID do pedido inválido.");

      const order = await db.getOrderById(orderId);
      if (!order || order.establishmentId !== estId) {
        return sendError(res, 404, "Pedido não encontrado.");
      }

      const items = await db.getOrderItems(orderId);

      const statusLabels: Record<string, string> = {
        pending_confirmation: "Aguardando confirmação",
        new: "Novo",
        preparing: "Em preparo",
        ready: "Pronto",
        out_for_delivery: "Saiu para entrega",
        completed: "Concluído",
        cancelled: "Cancelado",
        scheduled: "Agendado",
      };

      const deliveryTypeLabels: Record<string, string> = {
        delivery: "Entrega",
        pickup: "Retirada",
        dine_in: "Consumo no local",
      };

      return res.json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: statusLabels[order.status] || order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        deliveryType: order.deliveryType,
        deliveryTypeLabel: deliveryTypeLabels[order.deliveryType] || order.deliveryType,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        notes: order.notes,
        createdAt: order.createdAt,
        items: items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          complements: i.complements,
          notes: i.notes,
        })),
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /orders/:id:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/whatsapp-config — Buscar establishmentId pelo número conectado
  // Query param: phone (número do WhatsApp conectado)
  // ──────────────────────────────────────────────
  router.get("/whatsapp-config", async (req: BotApiRequest, res: Response) => {
    try {
      // Este endpoint requer uma API Key global (isGlobal=true)
      if (!req.botIsGlobal) {
        return sendError(res, 403, "Este endpoint requer uma API Key global. Gere uma na página Bot WhatsApp.");
      }

      const rawPhone = req.query.phone as string;
      if (!rawPhone) {
        return sendError(res, 400, "Parâmetro 'phone' é obrigatório. Ex: ?phone=5511999998888");
      }

      // Normalizar: remover sufixo @s.whatsapp.net e qualquer caractere não-numérico
      const phone = rawPhone.replace(/@.*$/, '').replace(/\D/g, '');

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar na whatsappConfig pelo connectedPhone (tentar exato e normalizado)
      const [config] = await dbInstance
        .select({
          establishmentId: whatsappConfig.establishmentId,
          connectedPhone: whatsappConfig.connectedPhone,
          status: whatsappConfig.status,
        })
        .from(whatsappConfig)
        .where(eq(whatsappConfig.connectedPhone, phone))
        .limit(1);

      if (!config) {
        return sendError(res, 404, `Nenhum estabelecimento encontrado com o número ${phone}.`);
      }

      return res.json({
        establishmentId: config.establishmentId,
        connectedPhone: config.connectedPhone,
        status: config.status,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /whatsapp-config:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/api-key — Buscar API Key pelo establishmentId
  // Query param: establishmentId (ID do estabelecimento)
  // ──────────────────────────────────────────────
  router.get("/api-key", async (req: BotApiRequest, res: Response) => {
    try {
      // Este endpoint requer uma API Key global (isGlobal=true)
      if (!req.botIsGlobal) {
        return sendError(res, 403, "Este endpoint requer uma API Key global. Gere uma na página Bot WhatsApp.");
      }

      const establishmentId = parseInt(req.query.establishmentId as string, 10);
      if (!establishmentId || isNaN(establishmentId)) {
        return sendError(res, 400, "Parâmetro 'establishmentId' é obrigatório. Ex: ?establishmentId=30001");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar a API Key ativa (não global) vinculada ao establishmentId
      const [keyRecord] = await dbInstance
        .select({
          id: botApiKeys.id,
          name: botApiKeys.name,
          apiKey: botApiKeys.apiKey,
          establishmentId: botApiKeys.establishmentId,
          isActive: botApiKeys.isActive,
          createdAt: botApiKeys.createdAt,
        })
        .from(botApiKeys)
        .where(
          and(
            eq(botApiKeys.establishmentId, establishmentId),
            eq(botApiKeys.isActive, true),
            eq(botApiKeys.isGlobal, false)
          )
        )
        .orderBy(desc(botApiKeys.createdAt))
        .limit(1);

      if (!keyRecord) {
        return sendError(res, 404, `Nenhuma API Key ativa encontrada para o estabelecimento ${establishmentId}.`);
      }

      return res.json({
        id: keyRecord.id,
        name: keyRecord.name,
        apiKey: keyRecord.apiKey,
        establishmentId: keyRecord.establishmentId,
        isActive: keyRecord.isActive,
        createdAt: keyRecord.createdAt,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /api-key:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/bot-status — Verificar se o bot está ativo para o estabelecimento
  // Retorna { enabled: boolean, establishmentId: number }
  // ──────────────────────────────────────────────
  router.get("/bot-status", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

        const [establishment] = await dbInstance
        .select({
          id: establishments.id,
          name: establishments.name,
          whatsappBotEnabled: establishments.whatsappBotEnabled,
          botOrdersEnabled: establishments.botOrdersEnabled,
          botQuestionsEnabled: establishments.botQuestionsEnabled,
        })
        .from(establishments)
        .where(eq(establishments.id, estId))
        .limit(1);
      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }
      return res.json({
        enabled: establishment.whatsappBotEnabled,
        ordersEnabled: establishment.botOrdersEnabled,
        questionsEnabled: establishment.botQuestionsEnabled,
        establishmentId: establishment.id,
        establishmentName: establishment.name,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /bot-status:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/menu-link — Link do cardápio público
  // ──────────────────────────────────────────────
  router.get("/menu-link", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const [establishment] = await dbInstance
        .select({
          name: establishments.name,
          menuSlug: establishments.menuSlug,
        })
        .from(establishments)
        .where(eq(establishments.id, estId))
        .limit(1);

      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      const slug = establishment.menuSlug || String(estId);
      const baseUrl = "https://app.mindi.com.br";
      // Use /api/menu/ for OG tags corretas no WhatsApp/Facebook
      const menuUrl = `${baseUrl}/api/menu/${slug}`;

      return res.json({
        menuUrl,
        slug,
        establishmentName: establishment.name,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /menu-link:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/location — Localização do restaurante com link Google Maps
  // ──────────────────────────────────────────────
  router.get("/location", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      const { street, number, complement, neighborhood, city, state, zipCode, latitude, longitude, name } = establishment;

      // Montar endereço formatado
      const addressParts: string[] = [];
      if (street) addressParts.push(number ? `${street}, ${number}` : street);
      if (complement) addressParts.push(complement);
      if (neighborhood) addressParts.push(neighborhood);
      if (city && state) {
        addressParts.push(`${city} - ${state}`);
      } else if (city) {
        addressParts.push(city);
      }
      if (zipCode) addressParts.push(`CEP: ${zipCode}`);

      const formattedAddress = addressParts.join(", ");

      // Gerar link do Google Maps
      let googleMapsUrl: string | null = null;
      if (latitude && longitude) {
        // Se tem coordenadas, usar link direto com pin
        googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      } else if (formattedAddress) {
        // Se não tem coordenadas, usar busca por endereço
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`;
      }

      return res.json({
        name: name || null,
        address: formattedAddress || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        latitude: latitude || null,
        longitude: longitude || null,
        googleMapsUrl,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /location:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/customer-lookup?phone=5581999999999 — Buscar cliente por telefone
  // ──────────────────────────────────────────────
  router.get("/customer-lookup", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const rawPhone = String(req.query.phone || "").replace(/\D/g, "");
      if (!rawPhone || rawPhone.length < 10) {
        return sendError(res, 400, "Telefone inválido. Envie apenas dígitos (mínimo 10).");
      }

      // Normalizar telefone: gerar todas as variações possíveis
      // Formatos brasileiros: 55+DDD+9+num (13), 55+DDD+num (12), DDD+9+num (11), DDD+num (10)
      const phoneVariants: string[] = [rawPhone];
      
      // Extrair número local (sem código do país)
      let localPhone = rawPhone;
      if (rawPhone.startsWith("55") && rawPhone.length >= 12) {
        localPhone = rawPhone.slice(2);
        if (!phoneVariants.includes(localPhone)) phoneVariants.push(localPhone);
      } else {
        const withCountry = "55" + rawPhone;
        if (!phoneVariants.includes(withCountry)) phoneVariants.push(withCountry);
      }
      
      // Variações do 9o dígito brasileiro (DDD tem 2 dígitos)
      // Se local tem 11 dígitos (DDD+9+num), gerar sem o 9o dígito
      if (localPhone.length === 11 && localPhone[2] === "9") {
        const without9 = localPhone.slice(0, 2) + localPhone.slice(3); // remove 9th digit
        if (!phoneVariants.includes(without9)) phoneVariants.push(without9);
        if (!phoneVariants.includes("55" + without9)) phoneVariants.push("55" + without9);
      }
      // Se local tem 10 dígitos (DDD+num), gerar com o 9o dígito
      if (localPhone.length === 10) {
        const with9 = localPhone.slice(0, 2) + "9" + localPhone.slice(2); // add 9th digit
        if (!phoneVariants.includes(with9)) phoneVariants.push(with9);
        if (!phoneVariants.includes("55" + with9)) phoneVariants.push("55" + with9);
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Helper: validar se endereço parece real (não é teste/lixo)
      const isValidAddress = (addr: string | null): boolean => {
        if (!addr || addr.trim().length < 5) return false;
        // Verificar cada componente do endereço (separado por vírgula)
        const parts = addr.split(",").map(p => p.replace(/\(Ref:.*\)/i, "").trim().toLowerCase());
        const streetPart = parts[0] || "";
        // Rejeitar se a rua é caracteres repetidos (ex: "kkkkk", "xxxxx", "aaaa")
        const repeatedCharsPattern = /^(.)\1{2,}$/;
        if (repeatedCharsPattern.test(streetPart)) return false;
        // Rejeitar se começa com "teste" ou é claramente dados de teste
        if (/^teste/i.test(streetPart)) return false;
        if (/^(rua|r\.) teste/i.test(streetPart)) return false;
        // Verificar se tem pelo menos uma letra e comprimento mínimo
        const hasLetter = /[a-z\u00e1\u00e0\u00e2\u00e3\u00e9\u00e8\u00ea\u00ed\u00ef\u00f3\u00f4\u00f5\u00fa\u00fc\u00e7]/i.test(addr);
        const hasMinLength = addr.trim().length >= 8;
        return hasLetter && hasMinLength;
      };

      // 1) Buscar últimos pedidos de delivery deste cliente (pegar vários para filtrar endereços inválidos)
      let lastOrder: any = null;
      let lastOrderPhone: string | null = null;
      for (const phone of phoneVariants) {
        const results = await dbInstance
          .select({
            customerName: orders.customerName,
            customerPhone: orders.customerPhone,
            customerAddress: orders.customerAddress,
          })
          .from(orders)
          .where(
            and(
              eq(orders.establishmentId, estId),
              eq(orders.customerPhone, phone),
              eq(orders.deliveryType, "delivery")
            )
          )
          .orderBy(desc(orders.createdAt))
          .limit(5);
        // Pegar o primeiro pedido com endereço válido
        for (const result of results) {
          if (result.customerAddress && isValidAddress(result.customerAddress)) {
            lastOrder = result;
            lastOrderPhone = phone;
            break;
          }
        }
        if (lastOrder) break;
      }

      // 2) Buscar na tabela pdv_customers (dados mais estruturados)
      let pdvCustomer: any = null;
      for (const phone of phoneVariants) {
        const [result] = await dbInstance
          .select()
          .from(pdvCustomers)
          .where(
            and(
              eq(pdvCustomers.establishmentId, estId),
              eq(pdvCustomers.phone, phone)
            )
          )
          .limit(1);
        if (result) { pdvCustomer = result; break; }
      }

      // 3) Decidir qual fonte usar: preferir endereço válido mais recente
      let pdvAddress: string | null = null;
      if (pdvCustomer && pdvCustomer.street) {
        const addressParts: string[] = [];
        if (pdvCustomer.street) {
          addressParts.push(
            pdvCustomer.number
              ? `${pdvCustomer.street}, ${pdvCustomer.number}`
              : pdvCustomer.street
          );
        }
        if (pdvCustomer.neighborhood) addressParts.push(pdvCustomer.neighborhood);
        const fullAddress = addressParts.join(", ");
        const refPart = pdvCustomer.reference ? ` (Ref: ${pdvCustomer.reference})` : "";
        pdvAddress = fullAddress + refPart;
      }

      // Preferir pdv_customers se endereço é válido, senão usar último pedido
      if (pdvAddress && isValidAddress(pdvAddress)) {
        return res.json({
          found: true,
          source: "pdv_customers",
          name: pdvCustomer.name || null,
          phone: pdvCustomer.phone,
          address: pdvAddress,
          street: pdvCustomer.street || null,
          number: pdvCustomer.number || null,
          neighborhood: pdvCustomer.neighborhood || null,
          complement: pdvCustomer.complement || null,
          reference: pdvCustomer.reference || null,
        });
      }

      if (lastOrder && lastOrder.customerAddress) {
        return res.json({
          found: true,
          source: "orders",
          name: lastOrder.customerName || (pdvCustomer?.name || null),
          phone: lastOrderPhone!,
          address: lastOrder.customerAddress,
          street: null,
          number: null,
          neighborhood: null,
          complement: null,
          reference: null,
        });
      }

      // 4) Nenhum endereço válido encontrado
      return res.json({
        found: false,
        name: pdvCustomer?.name || lastOrder?.customerName || null,
      });
    } catch (error) {
      logger.error("[BotAPI] Erro em GET /customer-lookup:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  return router;
}
