import { int, bigint, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json, date, uniqueIndex, index, foreignKey } from "drizzle-orm/mysql-core";

// User table (from template)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  googleId: varchar("googleId", { length: 255 }),
  activeEstablishmentId: int("activeEstablishmentId"),
  defaultEstablishmentId: int("defaultEstablishmentId"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// User-Establishment relationship (multi-establishment support)
export const userEstablishments = mysqlTable("user_establishments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  role: mysqlEnum("role", ["owner", "staff"]).default("owner").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_user_establishments_userId").on(table.userId),
  index("idx_user_establishments_establishmentId").on(table.establishmentId),
]);
export type UserEstablishment = typeof userEstablishments.$inferSelect;
export type InsertUserEstablishment = typeof userEstablishments.$inferInsert;

// Establishment settings
export const establishments = mysqlTable("establishments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: text("logo"),
  logoBlur: text("logoBlur"),
  coverImage: text("coverImage"),
  coverBlur: text("coverBlur"),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 50 }),
  complement: varchar("complement", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isOpen: boolean("isOpen").default(false).notNull(),
  menuSlug: varchar("menuSlug", { length: 100 }).unique(),
  whatsapp: varchar("whatsapp", { length: 30 }),
  whatsappBotEnabled: boolean("whatsappBotEnabled").default(false).notNull(), // Toggle para ativar/desativar bot do WhatsApp (n8n)
  botOrdersEnabled: boolean("botOrdersEnabled").default(false).notNull(), // Toggle: bot pode retirar pedidos via WhatsApp
  botQuestionsEnabled: boolean("botQuestionsEnabled").default(true).notNull(), // Toggle: bot responde perguntas básicas
  instagram: varchar("instagram", { length: 100 }),
  acceptsCash: boolean("acceptsCash").default(true).notNull(),
  acceptsCard: boolean("acceptsCard").default(true).notNull(),
  acceptsPix: boolean("acceptsPix").default(false).notNull(),
  pixKey: varchar("pixKey", { length: 255 }),
  pixHolderName: varchar("pixHolderName", { length: 255 }),
  acceptsBoleto: boolean("acceptsBoleto").default(false).notNull(),
  allowsDelivery: boolean("allowsDelivery").default(true).notNull(),
  allowsPickup: boolean("allowsPickup").default(true).notNull(),
  allowsDineIn: boolean("allowsDineIn").default(false).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: int("reviewCount").default(0).notNull(),
  publicNote: varchar("publicNote", { length: 100 }),
  publicNoteCreatedAt: timestamp("publicNoteCreatedAt"),
  noteStyle: varchar("noteStyle", { length: 50 }).default("default"),
  noteExpiresAt: timestamp("noteExpiresAt"),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  // Tempo de entrega
  deliveryTimeEnabled: boolean("deliveryTimeEnabled").default(false).notNull(),
  deliveryTimeMin: int("deliveryTimeMin").default(20),
  deliveryTimeMax: int("deliveryTimeMax").default(60),
  // Pedido mínimo
  minimumOrderEnabled: boolean("minimumOrderEnabled").default(false).notNull(),
  minimumOrderValue: decimal("minimumOrderValue", { precision: 10, scale: 2 }).default("0"),
  // Taxa de entrega
  deliveryFeeType: mysqlEnum("deliveryFeeType", ["free", "fixed", "byNeighborhood", "byRadius"]).default("free").notNull(),
  deliveryFeeFixed: decimal("deliveryFeeFixed", { precision: 10, scale: 2 }).default("0"),
  // Frete grátis acima de valor mínimo
  freeDeliveryEnabled: boolean("freeDeliveryEnabled").default(false).notNull(),
  freeDeliveryMinValue: decimal("freeDeliveryMinValue", { precision: 10, scale: 2 }).default("0"),
  // Controle de fechamento manual
  manuallyClosed: boolean("manuallyClosed").default(false).notNull(),
  manuallyClosedAt: timestamp("manuallyClosedAt"),
  // Controle de abertura manual (fora do horário)
  manuallyOpened: boolean("manuallyOpened").default(false).notNull(),
  manuallyOpenedAt: timestamp("manuallyOpenedAt"),
  // Programa de Recompensas (exclusivo: fidelidade OU cashback)
  rewardProgramType: mysqlEnum("rewardProgramType", ["none", "loyalty", "cashback"]).default("none").notNull(),
  // Cashback
  cashbackEnabled: boolean("cashbackEnabled").default(false).notNull(),
  cashbackPercent: decimal("cashbackPercent", { precision: 5, scale: 2 }).default("0"),
  cashbackApplyMode: mysqlEnum("cashbackApplyMode", ["all", "categories"]).default("all").notNull(),
  cashbackCategoryIds: json("cashbackCategoryIds").$type<number[]>(),
  cashbackAllowPartialUse: boolean("cashbackAllowPartialUse").default(true).notNull(),
  // Cartão Fidelidade
  loyaltyEnabled: boolean("loyaltyEnabled").default(false).notNull(),
  loyaltyStampsRequired: int("loyaltyStampsRequired").default(6),
  loyaltyCouponType: mysqlEnum("loyaltyCouponType", ["fixed", "percentage", "free_delivery"]).default("fixed"),
  loyaltyCouponValue: decimal("loyaltyCouponValue", { precision: 10, scale: 2 }).default("10"),
  loyaltyMinOrderValue: decimal("loyaltyMinOrderValue", { precision: 10, scale: 2 }).default("0"),
  // Dados da Conta
  email: varchar("email", { length: 320 }),
  cnpj: varchar("cnpj", { length: 20 }),
  responsibleName: varchar("responsibleName", { length: 255 }),
  responsiblePhone: varchar("responsiblePhone", { length: 30 }),
  // Stripe Connect - Pagamento Online
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // ID da connected account no Stripe
  onlinePaymentEnabled: boolean("onlinePaymentEnabled").default(false).notNull(), // Se pagamento online está ativo
  stripeOnboardingComplete: boolean("stripeOnboardingComplete").default(false).notNull(), // Se onboarding foi concluído
  // Paytime - Pagamento PIX Online
  paytimeEnabled: boolean("paytimeEnabled").default(false).notNull(), // Se pagamento PIX online via Paytime está ativo
  paytimeCardEnabled: boolean("paytimeCardEnabled").default(false).notNull(), // Se pagamento com cartão online via Paytime está ativo
  paytimeCardFeePassthrough: boolean("paytimeCardFeePassthrough").default(true).notNull(), // Se a taxa de R$0,99 do cartão online é repassada ao cliente (true = cliente paga)
  // Paytime - Onboarding (Fase 4)
  paytimeEstablishmentId: varchar("paytimeEstablishmentId", { length: 100 }), // ID do sub-estabelecimento na Paytime
  paytimeOnboardingStatus: mysqlEnum("paytimeOnboardingStatus", ["not_started", "pending", "submitted", "approved", "rejected"]).default("not_started").notNull(),
  paytimeGatewayActive: boolean("paytimeGatewayActive").default(false).notNull(),
  paytimeBankingActive: boolean("paytimeBankingActive").default(false).notNull(), // Gateway 6 (Banking Paytime) ativo
  paytimeSubPaytimeActive: boolean("paytimeSubPaytimeActive").default(false).notNull(), // Gateway 4 (SubPaytime) ativo
  paytimeKycUrl: varchar("paytimeKycUrl", { length: 1024 }), // URL para jornada KYC do titular
  paytimeKycStatus: mysqlEnum("paytimeKycStatus", ["not_started", "waiting_kyc", "pending", "approved", "rejected"]).default("not_started").notNull(),
  paytimeSplitConfigured: boolean("paytimeSplitConfigured").default(false).notNull(),
  paytimeSplitRuleId: varchar("paytimeSplitRuleId", { length: 100 }),
  // Dados do representante legal (para cadastro Paytime)
  representativeName: varchar("representativeName", { length: 255 }),
  representativeLastName: varchar("representativeLastName", { length: 255 }),
  representativeCpf: varchar("representativeCpf", { length: 20 }),
  representativeEmail: varchar("representativeEmail", { length: 320 }),
  representativePhone: varchar("representativePhone", { length: 30 }),
  representativeBirthDate: varchar("representativeBirthDate", { length: 10 }),
  cnae: varchar("cnae", { length: 20 }),
  razaoSocial: varchar("razaoSocial", { length: 255 }),
  nomeFantasia: varchar("nomeFantasia", { length: 255 }),
  // Segurança
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorEmail: varchar("twoFactorEmail", { length: 320 }),
  // Timezone (IANA)
  timezone: varchar("timezone", { length: 100 }).default("America/Sao_Paulo").notNull(),
  // Plano / Trial
  planType: mysqlEnum("planType", ["trial", "free", "lite", "basic", "pro", "enterprise"]).default("trial").notNull(), // 'free' e 'enterprise' mantidos no enum para compatibilidade com dados existentes, mas não devem ser usados para novos cadastros
  trialStartDate: timestamp("trialStartDate").defaultNow(),
  trialDays: int("trialDays").default(15).notNull(),
  // Stripe Subscription
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "annual"]),
  planExpiresAt: timestamp("planExpiresAt"),
  planActivatedAt: timestamp("planActivatedAt"),
  // Configuração de acionamento do entregador
  driverNotifyTiming: mysqlEnum("driverNotifyTiming", ["on_accepted", "on_ready"]).default("on_ready").notNull(),
  // Quem informa que saiu para entrega: "driver" = entregador, "attendant" = atendente (global)
  departureNotifyBy: mysqlEnum("departureNotifyBy", ["driver", "attendant"]).default("driver").notNull(),
  // Avaliações
  ownerDisplayName: varchar("ownerDisplayName", { length: 11 }),
  reviewsEnabled: boolean("reviewsEnabled").default(true).notNull(),
  // Chat do menu público
  publicChatEnabled: boolean("publicChatEnabled").default(true).notNull(),
  fakeReviewCount: int("fakeReviewCount").default(355),
  // Agendamento de pedidos
  schedulingEnabled: boolean("schedulingEnabled").default(false).notNull(), // Habilitar agendamento
  schedulingMinAdvance: int("schedulingMinAdvance").default(60).notNull(), // Antecedência mínima em minutos (ex: 60 = 1h)
  schedulingMaxDays: int("schedulingMaxDays").default(7).notNull(), // Antecedência máxima em dias (ex: 7 dias)
  schedulingInterval: int("schedulingInterval").default(30).notNull(), // Intervalo entre horários em minutos (15, 30, 60)
  schedulingMoveMinutes: int("schedulingMoveMinutes").default(30).notNull(), // Minutos antes para mover para fila normal
  // Aceitar pedidos automaticamente
  autoAcceptOrders: boolean("autoAcceptOrders").default(false).notNull(),
  // Meta de tempo de preparo (em minutos)
  prepGoalMinutes: int("prepGoalMinutes").default(30),
  // Créditos de melhoria de imagem com IA
  aiImageCredits: int("aiImageCredits").default(0).notNull(),
  aiCreditsGranted: boolean("aiCreditsGranted").default(false).notNull(), // se já recebeu os 4 créditos grátis
  // Nomes customizados dos status de pedidos (ex: {"new": "Novos", "preparing": "Cozinha", "ready": "Prontos", "completed": "Entregues"})
  customStatusLabels: json("customStatusLabels").$type<Record<string, string>>(),
  // Telegram Bot — Notificações de pedidos
  // Cor do background do menu público (hue-rotate em graus, null = padrão vermelho)
  menuBackgroundHue: int("menuBackgroundHue"),
  telegramEnabled: boolean("telegramEnabled").default(false).notNull(),
  telegramChatId: varchar("telegramChatId", { length: 100 }),
  // Regras de estoque mínimo (thresholds personalizáveis)
  stockLowThreshold: int("stockLowThreshold").default(10).notNull(),
  stockCriticalThreshold: int("stockCriticalThreshold").default(3).notNull(),
  stockOutThreshold: int("stockOutThreshold").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Taxas de maquininha/gateway por forma de pagamento (% cobrada)
  feePixOnline: decimal("feePixOnline", { precision: 5, scale: 2 }),
  feePixStatic: decimal("feePixStatic", { precision: 5, scale: 2 }),
  feeCard: decimal("feeCard", { precision: 5, scale: 2 }),
  serviceChargePercent: decimal("serviceChargePercent", { precision: 5, scale: 2 }).default("0").notNull(),
  serviceChargeDestination: varchar("serviceChargeDestination", { length: 20 }).default("staff"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_establishments_userId").on(table.userId),
]);

export type Establishment = typeof establishments.$inferSelect;
export type InsertEstablishment = typeof establishments.$inferInsert;

// Product categories
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Disponibilidade por dias e horarios (mesmo padrao dos complement_items)
  availabilityType: mysqlEnum("availabilityType", ["always", "scheduled"]).default("always").notNull(),
  availableDays: json("availableDays").$type<number[]>(), // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  availableHours: json("availableHours").$type<{ day: number; startTime: string; endTime: string }[]>(), // Horarios por dia
  isUpsell: boolean("isUpsell").default(false).notNull(),
  // Sistema Rascunho vs Publicado
  version: mysqlEnum("version", ["draft", "published"]).default("published").notNull(),
  publishedSourceId: int("publishedSourceId"), // ID do registro publicado que originou este rascunho
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_categories_establishmentId").on(table.establishmentId),
  index("idx_categories_version").on(table.establishmentId, table.version),
]);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Products
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: json("images").$type<string[]>(),
  enhancedImages: json("enhancedImages").$type<string[]>(), // Imagens melhoradas por IA (Nano Banana)
  blurPlaceholder: text("blurPlaceholder"),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  stockQuantity: int("stockQuantity"),
  hasStock: boolean("hasStock").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  printerId: int("printerId"), // ID da impressora/setor para este produto (ex: Cozinha, Sushi Bar)
  isCombo: boolean("isCombo").default(false).notNull(), // Se é um combo (produto composto por grupos de itens)
  cost: decimal("cost", { precision: 10, scale: 2 }), // Custo do produto (CMV) para cálculo do DRE
  isUpsellPinned: boolean("isUpsellPinned").default(false).notNull(),
  promotionalPrice: decimal("promotionalPrice", { precision: 10, scale: 2 }), // Preço promocional (null = sem promoção)
  // Sistema Rascunho vs Publicado
  version: mysqlEnum("version", ["draft", "published"]).default("published").notNull(),
  publishedSourceId: int("publishedSourceId"), // ID do registro publicado que originou este rascunho
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_products_categoryId").on(table.categoryId),
  index("idx_products_establishmentId").on(table.establishmentId),
  index("idx_products_printerId").on(table.printerId),
  index("idx_products_status").on(table.status),
  index("idx_products_version").on(table.establishmentId, table.version),
]);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Product complements/add-ons groups
export const complementGroups = mysqlTable("complementGroups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  minQuantity: int("minQuantity").default(0).notNull(),
  maxQuantity: int("maxQuantity").default(1).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  groupType: mysqlEnum("groupType", ["complement", "included"]).default("complement").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  // Sistema Rascunho vs Publicado
  version: mysqlEnum("version", ["draft", "published"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_complementGroups_productId").on(table.productId),
  index("idx_complementGroups_version").on(table.version),
]);

export type ComplementGroup = typeof complementGroups.$inferSelect;
export type InsertComplementGroup = typeof complementGroups.$inferInsert;

// Complement items
export const complementItems = mysqlTable("complementItems", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  // Complementos Globais - novos campos
  priceMode: mysqlEnum("priceMode", ["normal", "free"]).default("normal").notNull(), // normal = preço base, free = grátis
  sortOrder: int("sortOrder").default(0).notNull(),
  // Disponibilidade por dias e horários
  availabilityType: mysqlEnum("availabilityType", ["always", "scheduled"]).default("always").notNull(), // always = sempre disponível, scheduled = dias/horários específicos
  availableDays: json("availableDays").$type<number[]>(), // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  availableHours: json("availableHours").$type<{ day: number; startTime: string; endTime: string }[]>(), // Horários por dia
  badgeText: varchar("badgeText", { length: 50 }),
  // Gratuidade por contexto de pedido (max 2 podem ser true)
  freeOnDelivery: boolean("freeOnDelivery").default(false).notNull(),
  freeOnPickup: boolean("freeOnPickup").default(false).notNull(),
  freeOnDineIn: boolean("freeOnDineIn").default(false).notNull(),
  // Item exclusivo por produto: quando preenchido, o item só aparece neste produto
  description: text("description"), // Descrição opcional do complemento (exibida no menu público)
  exclusiveProductId: int("exclusiveProductId"), // null = global (aparece em todos), preenchido = só neste produto
  // Controle de estoque do complemento
  hasStock: boolean("hasStock").default(false).notNull(), // Se o controle de estoque está ativado
  stockQuantity: int("stockQuantity"), // Quantidade em estoque (null = sem controle)
  // Sistema Rascunho vs Publicado
  version: mysqlEnum("version", ["draft", "published"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_complementItems_groupId").on(table.groupId),
  index("idx_complementItems_version").on(table.version),
]);

export type ComplementItem = typeof complementItems.$inferSelect;
export type InsertComplementItem = typeof complementItems.$inferInsert;

// Orders
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 30 }),
  customerAddress: text("customerAddress"),
  status: mysqlEnum("status", ["pending_confirmation", "new", "preparing", "ready", "out_for_delivery", "completed", "cancelled", "scheduled"]).default("pending_confirmation").notNull(),
  deliveryType: mysqlEnum("deliveryType", ["delivery", "pickup", "dine_in"]).default("delivery").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "pix", "boleto", "card_online", "pix_online"]).default("cash").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  couponCode: varchar("couponCode", { length: 50 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  changeAmount: decimal("changeAmount", { precision: 10, scale: 2 }),
  cancellationReason: text("cancellationReason"),
  // Campos para pedidos externos (iFood, Rappi, etc)
  source: mysqlEnum("source", ["internal", "ifood", "rappi", "ubereats", "pdv"]).default("internal").notNull(),
  externalId: varchar("externalId", { length: 100 }), // ID do pedido na plataforma externa
  externalDisplayId: varchar("externalDisplayId", { length: 50 }), // ID de exibição (ex: #1234)
  externalStatus: varchar("externalStatus", { length: 50 }), // Status original da plataforma
  externalData: json("externalData").$type<Record<string, unknown>>(), // Dados completos do pedido externo
  // Controle de notificação ao entregador (evitar duplicatas)
  deliveryNotified: boolean("deliveryNotified").default(false).notNull(),
  // Agendamento de pedidos
  isScheduled: boolean("isScheduled").default(false).notNull(), // Se é um pedido agendado
  scheduledAt: timestamp("scheduledAt"), // Data/hora agendada para o pedido
  movedToQueue: boolean("movedToQueue").default(false).notNull(), // Se já foi movido para a fila principal
  movedToQueueAt: timestamp("movedToQueueAt"), // Quando foi movido para a fila
  newAt: timestamp("newAt"), // Quando o pedido entrou no status Novo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
  acceptedAt: timestamp("acceptedAt"),
  readyAt: timestamp("readyAt"),
  // Coordenadas do endereço de entrega (para link de navegação no Google Maps)
  customerLat: varchar("customerLat", { length: 30 }),
  customerLng: varchar("customerLng", { length: 30 }),
}, (table) => [
  index("idx_orders_establishmentId").on(table.establishmentId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_est_status").on(table.establishmentId, table.status),
  index("idx_orders_est_status_created").on(table.establishmentId, table.status, table.createdAt),
  index("idx_orders_status_newAt").on(table.status, table.newAt),
  index("idx_orders_status_readyAt").on(table.status, table.readyAt),
]);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Order items
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  complements: json("complements").$type<{ name: string; price: number; quantity: number; isIncluded?: boolean; groupType?: "complement" | "included" }[]>(),
  notes: text("notes"),
  printerId: int("printerId"), // ID da impressora/setor deste item (copiado do produto)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_orderItems_orderId").on(table.orderId),
  index("idx_orderItems_productId").on(table.productId),
]);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;


// Stock item categories
export const stockCategories = mysqlTable("stockCategories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockCategory = typeof stockCategories.$inferSelect;
export type InsertStockCategory = typeof stockCategories.$inferInsert;

// Stock items (ingredients and supplies)
export const stockItems = mysqlTable("stockItems", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  currentQuantity: decimal("currentQuantity", { precision: 10, scale: 2 }).default("0").notNull(),
  minQuantity: decimal("minQuantity", { precision: 10, scale: 2 }).default("0").notNull(),
  maxQuantity: decimal("maxQuantity", { precision: 10, scale: 2 }),
  unit: mysqlEnum("unit", ["kg", "g", "L", "ml", "unidade", "pacote", "caixa", "dúzia"]).default("unidade").notNull(),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }),
  linkedProductId: int("linkedProductId"),
  status: mysqlEnum("status", ["ok", "low", "critical", "out_of_stock"]).default("ok").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_stockItems_establishmentId").on(table.establishmentId),
  index("idx_stockItems_categoryId").on(table.categoryId),
]);

export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = typeof stockItems.$inferInsert;

// Stock movements (history of entries and exits)
export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  stockItemId: int("stockItemId").notNull(),
  type: mysqlEnum("type", ["entry", "exit", "adjustment", "loss"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  previousQuantity: decimal("previousQuantity", { precision: 10, scale: 2 }).notNull(),
  newQuantity: decimal("newQuantity", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  orderId: int("orderId"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_stockMovements_stockItemId").on(table.stockItemId),
  index("idx_stockMovements_orderId").on(table.orderId),
]);

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;


// Coupons
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  code: varchar("code", { length: 15 }).notNull(),
  type: mysqlEnum("type", ["percentage", "fixed"]).default("percentage").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }),
  quantity: int("quantity"),
  usedCount: int("usedCount").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  activeDays: json("activeDays").$type<string[]>(),
  validOrigins: json("validOrigins").$type<string[]>(),
  startTime: varchar("startTime", { length: 5 }),
  endTime: varchar("endTime", { length: 5 }),
  status: mysqlEnum("status", ["active", "inactive", "expired", "exhausted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_coupons_establishmentId").on(table.establishmentId),
  index("idx_coupons_status").on(table.status),
]);

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// Reviews table (avaliações do restaurante)
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(), // Para identificar cliente único
  rating: int("rating").notNull(), // 1-5 estrelas
  comment: text("comment"),
  // Resposta do restaurante
  responseText: text("responseText"), // Texto da resposta pública
  responseDate: timestamp("responseDate"), // Data da resposta
  // Controle de visualização
  isRead: boolean("isRead").default(false).notNull(), // Se foi visualizada pelo restaurante
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_establishmentId").on(table.establishmentId),
  index("idx_reviews_orderId").on(table.orderId),
]);

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;


// Business hours (horários de funcionamento)
export const businessHours = mysqlTable("businessHours", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  isActive: boolean("isActive").default(true).notNull(), // Toggle ON/OFF
  openTime: varchar("openTime", { length: 5 }), // Formato HH:MM (ex: "18:00")
  closeTime: varchar("closeTime", { length: 5 }), // Formato HH:MM (ex: "23:00")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_businessHours_estId").on(table.establishmentId),
]);

export type BusinessHours = typeof businessHours.$inferSelect;
export type InsertBusinessHours = typeof businessHours.$inferInsert;


// Taxas de entrega por bairro
export const neighborhoodFees = mysqlTable("neighborhoodFees", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  neighborhood: varchar("neighborhood", { length: 255 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_neighborhoodFees_estId").on(table.establishmentId),
]);

export type NeighborhoodFee = typeof neighborhoodFees.$inferSelect;
export type InsertNeighborhoodFee = typeof neighborhoodFees.$inferInsert;

// Taxa de entrega por raio (km)
export const radiusFees = mysqlTable("radiusFees", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  maxKm: decimal("maxKm", { precision: 6, scale: 2 }).notNull(), // Até X km
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_radiusFees_estId").on(table.establishmentId),
]);

export type RadiusFee = typeof radiusFees.$inferSelect;
export type InsertRadiusFee = typeof radiusFees.$inferInsert;


// Cartão de Fidelidade - Configurações do estabelecimento
// (campos adicionados na tabela establishments via migration)

// Cartões de fidelidade dos clientes
export const loyaltyCards = mysqlTable("loyaltyCards", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  password4Hash: varchar("password4Hash", { length: 255 }).notNull(), // Hash da senha de 4 dígitos
  stamps: int("stamps").default(0).notNull(), // Número atual de carimbos
  totalStampsEarned: int("totalStampsEarned").default(0).notNull(), // Total de carimbos já ganhos (histórico)
  couponsEarned: int("couponsEarned").default(0).notNull(), // Total de cupons já ganhos
  activeCouponId: int("activeCouponId"), // Cupom ativo disponível para uso (legado, manter para compatibilidade)
  activeCouponIds: json("activeCouponIds").$type<number[]>(), // Array de IDs de cupons ativos disponíveis
  registeredByCustomer: boolean("registeredByCustomer").default(false).notNull(), // true = cliente se cadastrou voluntariamente, false = criado automaticamente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_loyaltyCards_estId").on(table.establishmentId),
]);

export type LoyaltyCard = typeof loyaltyCards.$inferSelect;
export type InsertLoyaltyCard = typeof loyaltyCards.$inferInsert;

// Histórico de carimbos (stamps) do cartão fidelidade
export const loyaltyStamps = mysqlTable("loyaltyStamps", {
  id: int("id").autoincrement().primaryKey(),
  loyaltyCardId: int("loyaltyCardId").notNull(),
  orderId: int("orderId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull(),
  orderTotal: decimal("orderTotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_loyaltyStamps_cardId").on(table.loyaltyCardId),
  index("idx_loyaltyStamps_orderId").on(table.orderId),
]);

export type LoyaltyStamp = typeof loyaltyStamps.$inferSelect;
export type InsertLoyaltyStamp = typeof loyaltyStamps.$inferInsert;


// Impressoras térmicas para impressão automática de pedidos
export const printers = mysqlTable("printers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nome identificador (ex: "Cozinha", "Balcão")
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(), // IP da impressora na rede local
  port: int("port").default(9100).notNull(), // Porta padrão ESC/POS
  printerType: varchar("printerType", { length: 20 }).default("all").notNull(), // Tipo: all, kitchen, counter, bar
  categoryIds: text("categoryIds"), // JSON array de IDs de categorias para esta impressora
  isActive: boolean("isActive").default(true).notNull(), // Se a impressora está ativa
  isDefault: boolean("isDefault").default(false).notNull(), // Se é a impressora padrão
  deviceId: varchar("deviceId", { length: 128 }), // ID único do dispositivo (para auto-registro via app)
  deviceModel: varchar("deviceModel", { length: 128 }), // Modelo do dispositivo (ex: "SM-A546B")
  platform: varchar("platform", { length: 20 }), // Plataforma: android, windows, ios
  lastSeenAt: timestamp("lastSeenAt"), // Última vez que o dispositivo se conectou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_printers_establishmentId").on(table.establishmentId),
]);

export type Printer = typeof printers.$inferSelect;
export type InsertPrinter = typeof printers.$inferInsert;

// Configurações de impressão do estabelecimento
export const printerSettings = mysqlTable("printerSettings", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  autoPrintEnabled: boolean("autoPrintEnabled").default(false).notNull(), // Impressão automática ativada
  printOnNewOrder: boolean("printOnNewOrder").default(true).notNull(), // Imprimir ao receber novo pedido
  printOnStatusChange: boolean("printOnStatusChange").default(false).notNull(), // Imprimir ao mudar status
  copies: int("copies").default(1).notNull(), // Número de cópias
  showLogo: boolean("showLogo").default(true).notNull(), // Mostrar logo no cupom
  logoUrl: text("logoUrl"), // URL do logo personalizado (se diferente do estabelecimento)
  showQrCode: boolean("showQrCode").default(false).notNull(), // Mostrar QR Code no cupom
  qrCodeUrl: text("qrCodeUrl"), // URL da imagem do QR Code para pagamento
  headerMessage: text("headerMessage"), // Mensagem personalizada no cabeçalho
  footerMessage: text("footerMessage"), // Mensagem personalizada no rodapé
  paperWidth: varchar("paperWidth", { length: 10 }).default("80mm").notNull(), // Largura do papel: 58mm ou 80mm
  // POSPrinterDriver - Impressão automática via servidor
  posPrinterEnabled: boolean("posPrinterEnabled").default(false).notNull(), // Usar POSPrinterDriver
  posPrinterLinkcode: varchar("posPrinterLinkcode", { length: 100 }), // Código de link do terminal
  posPrinterNumber: int("posPrinterNumber").default(1).notNull(), // Número da impressora (1, 2, 3...)
  // Impressão Direta via Rede Local (Socket TCP)
  directPrintEnabled: boolean("directPrintEnabled").default(false).notNull(), // Usar impressão direta
  directPrintIp: varchar("directPrintIp", { length: 50 }), // IP da impressora
  directPrintPort: int("directPrintPort").default(9100).notNull(), // Porta da impressora
  // Configurações de fonte para impressão térmica
  fontSize: int("fontSize").default(12).notNull(), // Tamanho da fonte geral
  fontWeight: int("fontWeight").default(500).notNull(), // Peso da fonte geral
  titleFontSize: int("titleFontSize").default(16).notNull(), // Tamanho da fonte de títulos
  titleFontWeight: int("titleFontWeight").default(700).notNull(), // Peso da fonte de títulos
  itemFontSize: int("itemFontSize").default(12).notNull(), // Tamanho da fonte de itens
  itemFontWeight: int("itemFontWeight").default(700).notNull(), // Peso da fonte de itens
  obsFontSize: int("obsFontSize").default(11).notNull(), // Tamanho da fonte de observações
  obsFontWeight: int("obsFontWeight").default(500).notNull(), // Peso da fonte de observações
  showDividers: boolean("showDividers").default(false).notNull(), // Mostrar divisores
  boxPadding: int("boxPadding").default(12).notNull(), // Espaçamento interno das caixas com bordas redondas
  itemBorderStyle: varchar("itemBorderStyle", { length: 20 }).default("rounded").notNull(), // Estilo de borda dos itens: rounded ou dashed
  // Configurações de fonte específicas para Mindi Printer (independentes da impressão normal)
  mindiFontSize: int("mindiFontSize").default(12).notNull(), // Tamanho da fonte geral (Mindi)
  mindiFontWeight: int("mindiFontWeight").default(500).notNull(), // Peso da fonte geral (Mindi)
  mindiTitleFontSize: int("mindiTitleFontSize").default(16).notNull(), // Tamanho da fonte de títulos (Mindi)
  mindiTitleFontWeight: int("mindiTitleFontWeight").default(700).notNull(), // Peso da fonte de títulos (Mindi)
  mindiItemFontSize: int("mindiItemFontSize").default(12).notNull(), // Tamanho da fonte de itens (Mindi)
  mindiItemFontWeight: int("mindiItemFontWeight").default(700).notNull(), // Peso da fonte de itens (Mindi)
  mindiObsFontSize: int("mindiObsFontSize").default(11).notNull(), // Tamanho da fonte de observações (Mindi)
  mindiObsFontWeight: int("mindiObsFontWeight").default(500).notNull(), // Peso da fonte de observações (Mindi)
  mindiShowDividers: boolean("mindiShowDividers").default(false).notNull(), // Mostrar divisores (Mindi)
  mindiBoxPadding: int("mindiBoxPadding").default(12).notNull(), // Espaçamento interno (Mindi)
  mindiItemBorderStyle: varchar("mindiItemBorderStyle", { length: 20 }).default("rounded").notNull(), // Estilo de borda (Mindi)
  mindiPaperWidth: varchar("mindiPaperWidth", { length: 10 }).default("80mm").notNull(), // Largura do papel (Mindi)
  mindiShowLogo: boolean("mindiShowLogo").default(true).notNull(), // Mostrar logo (Mindi)
  mindiHeaderMessage: text("mindiHeaderMessage"), // Mensagem cabeçalho (Mindi)
  mindiFooterMessage: text("mindiFooterMessage"), // Mensagem rodapé (Mindi)
  mindiBeepOnPrint: boolean("mindiBeepOnPrint").default(false).notNull(), // Bipe ao imprimir (Mindi)
  mindiHtmlPrintEnabled: boolean("mindiHtmlPrintEnabled").default(true).notNull(), // Impressão HTML ativada (Mindi)
  // Preferência de impressão padrão ao aceitar pedidos
  defaultPrintMethod: mysqlEnum("defaultPrintMethod", ["normal", "android", "automatic"]).default("normal").notNull(), // Método de impressão favorito: normal (webview), automatic (Mindi Printer via SSE)
  // Modo de impressão HTML vs ESC/POS
  htmlPrintEnabled: boolean("htmlPrintEnabled").default(true).notNull(), // Usar layout HTML (mais flexível) ou ESC/POS (compatível)
  beepOnPrint: boolean("beepOnPrint").default(false).notNull(), // Emitir bipe sonoro ao imprimir (comando ESC/POS)
  // API Key para integração com app de impressora externo (sem OAuth)
  printerApiKey: varchar("printerApiKey", { length: 64 }), // Chave de API para endpoint SSE da impressora
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_printerSettings_estId").on(table.establishmentId),
]);

export type PrinterSettings = typeof printerSettings.$inferSelect;
export type InsertPrinterSettings = typeof printerSettings.$inferInsert;


// Push Subscriptions para notificações PWA
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(), // URL do endpoint de push
  p256dh: text("p256dh").notNull(), // Chave pública do cliente
  auth: text("auth").notNull(), // Chave de autenticação
  userAgent: text("userAgent"), // User agent do dispositivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_pushSubs_establishmentId").on(table.establishmentId),
  index("idx_pushSubs_userId").on(table.userId),
]);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;


// Configuração de integração com WhatsApp via UAZAPI
export const whatsappConfig = mysqlTable("whatsappConfig", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  subdomain: varchar("subdomain", { length: 100 }), // Legado - não usado mais
  token: varchar("token", { length: 500 }), // Legado - não usado mais
  instanceId: varchar("instanceId", { length: 100 }), // ID da instância UAZAPI (criada automaticamente)
  instanceToken: varchar("instanceToken", { length: 500 }), // Token da instância (gerado automaticamente)
  status: mysqlEnum("status", ["disconnected", "connecting", "connected"]).default("disconnected").notNull(),
  connectedPhone: varchar("connectedPhone", { length: 30 }), // Número conectado
  lastQrCode: text("lastQrCode"), // Último QR code gerado (base64)
  qrCodeExpiresAt: timestamp("qrCodeExpiresAt"), // Quando o QR code expira
  // Configurações de notificação
  requireOrderConfirmation: boolean("requireOrderConfirmation").default(false).notNull(), // Exigir confirmação do cliente via botões do WhatsApp
  notifyOnNewOrder: boolean("notifyOnNewOrder").default(true).notNull(), // Notificar cliente quando pedido é criado
  notifyOnPreparing: boolean("notifyOnPreparing").default(true).notNull(), // Notificar quando pedido está sendo preparado
  notifyOnReady: boolean("notifyOnReady").default(true).notNull(), // Notificar quando pedido está pronto
  notifyOnCompleted: boolean("notifyOnCompleted").default(true).notNull(), // Notificar quando pedido é finalizado
  notifyOnCancelled: boolean("notifyOnCancelled").default(true).notNull(), // Notificar quando pedido é cancelado
  notifyOnOutForDelivery: boolean("notifyOnOutForDelivery").default(true).notNull(), // Notificar quando pedido saiu para entrega
  // Templates de mensagem personalizados
  templateNewOrder: text("templateNewOrder"), // Template para novo pedido
  templatePreparing: text("templatePreparing"), // Template para preparando
  templateReady: text("templateReady"), // Template para pronto (delivery)
  templateReadyPickup: text("templateReadyPickup"), // Template para pronto (retirada/consumo no local)
  templateCompleted: text("templateCompleted"), // Template para finalizado
  templateCancelled: text("templateCancelled"), // Template para cancelado
  templateOutForDelivery: text("templateOutForDelivery"), // Template para saiu para entrega
  // Reserva de mesa
  notifyOnReservation: boolean("notifyOnReservation").default(true).notNull(), // Enviar confirmação de reserva por WhatsApp
  templateReservation: text("templateReservation"), // Template para reserva de mesa
  // P10: Token secreto para autenticação do webhook
  webhookSecret: varchar("webhookSecret", { length: 128 }),
  // Official WhatsApp Cloud API fields (provider = 'official')
  provider: mysqlEnum("provider", ["uazapi", "official"]).default("uazapi").notNull(),
  wabaId: varchar("wabaId", { length: 100 }),         // WhatsApp Business Account ID
  phoneNumberId: varchar("phoneNumberId", { length: 100 }), // Phone Number ID from Meta
  accessToken: text("accessToken"),                   // Long-lived access token per establishment
  businessId: varchar("businessId", { length: 100 }), // Meta Business ID
  metaWebhookSecret: varchar("metaWebhookSecret", { length: 128 }), // HMAC secret for Meta webhook
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_whatsappConfig_estId").on(table.establishmentId),
]);

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;


// Fila de impressão para app Android
export const printQueue = mysqlTable("printQueue", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId").notNull(),
  printerId: int("printerId"), // Impressora específica (null = impressora padrão)
  status: mysqlEnum("status", ["pending", "printing", "completed", "failed"]).default("pending").notNull(),
  copies: int("copies").default(1).notNull(),
  errorMessage: text("errorMessage"), // Mensagem de erro se falhou
  printedAt: timestamp("printedAt"), // Quando foi impresso
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_printQueue_establishmentId").on(table.establishmentId),
  index("idx_printQueue_status").on(table.status),
]);

export type PrintQueue = typeof printQueue.$inferSelect;
export type InsertPrintQueue = typeof printQueue.$inferInsert;

// Configuração de integração com iFood (Fluxo OAuth Distribuído)
export const ifoodConfig = mysqlTable("ifoodConfig", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  // Tokens OAuth (obtidos via fluxo distribuído)
  accessToken: text("accessToken"), // Token de acesso atual
  refreshToken: text("refreshToken"), // Token para renovar acesso
  tokenExpiresAt: timestamp("tokenExpiresAt"), // Quando o token expira
  // Código de verificação temporário (usado durante autorização)
  authorizationCodeVerifier: varchar("authorizationCodeVerifier", { length: 255 }),
  userCode: varchar("userCode", { length: 50 }), // Código exibido para o usuário
  userCodeExpiresAt: timestamp("userCodeExpiresAt"), // Quando o código expira
  // Informações da loja no iFood
  merchantId: varchar("merchantId", { length: 100 }), // ID da loja no iFood (UUID)
  merchantName: varchar("merchantName", { length: 255 }), // Nome da loja no iFood
  // Status
  isActive: boolean("isActive").default(false).notNull(), // Integração ativa
  isConnected: boolean("isConnected").default(false).notNull(), // Conectado ao iFood
  lastTokenRefresh: timestamp("lastTokenRefresh"), // Último refresh do token
  // Configurações de comportamento
  autoAcceptOrders: boolean("autoAcceptOrders").default(false).notNull(), // Aceitar pedidos automaticamente
  notifyOnNewOrder: boolean("notifyOnNewOrder").default(true).notNull(), // Notificar sobre novos pedidos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_ifoodConfig_estId").on(table.establishmentId),
]);

export type IfoodConfig = typeof ifoodConfig.$inferSelect;
export type InsertIfoodConfig = typeof ifoodConfig.$inferInsert;

// Tabela de deduplicação de eventos do iFood (Fase 1 - Infraestrutura)
export const ifoodProcessedEvents = mysqlTable("ifood_processed_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  eventCode: varchar("eventCode", { length: 50 }).notNull(),
  orderId: varchar("orderId", { length: 255 }),
  merchantId: varchar("merchantId", { length: 255 }),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // TTL para limpeza automática
}, (table) => [
  index("idx_ifood_events_eventId").on(table.eventId),
  index("idx_ifood_events_expiresAt").on(table.expiresAt),
]);

export type IfoodProcessedEvent = typeof ifoodProcessedEvents.$inferSelect;
export type InsertIfoodProcessedEvent = typeof ifoodProcessedEvents.$inferInsert;


// Menu sessions for tracking active viewers
export const menuSessions = mysqlTable("menu_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  establishmentId: int("establishmentId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_menuSessions_estId").on(table.establishmentId),
]);

export type MenuSession = typeof menuSessions.$inferSelect;
export type InsertMenuSession = typeof menuSessions.$inferInsert;

// Menu views daily aggregation for historical data
export const menuViewsDaily = mysqlTable("menu_views_daily", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  viewCount: int("viewCount").default(0).notNull(),
  uniqueVisitors: int("uniqueVisitors").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuViewsDaily = typeof menuViewsDaily.$inferSelect;
export type InsertMenuViewsDaily = typeof menuViewsDaily.$inferInsert;


// Menu views hourly aggregation for heatmap
export const menuViewsHourly = mysqlTable("menu_views_hourly", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hour: int("hour").notNull(), // 0-23
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuViewsHourly = typeof menuViewsHourly.$inferSelect;
export type InsertMenuViewsHourly = typeof menuViewsHourly.$inferInsert;


// SMS Balance - Saldo de SMS por estabelecimento
export const smsBalance = mysqlTable("sms_balance", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 4 }).default("0").notNull(), // Saldo em reais (4 casas para suportar R$ 0,097/SMS)
  costPerSms: decimal("costPerSms", { precision: 10, scale: 4 }).default("0.0970").notNull(), // Custo por SMS (padrão R$ 0,097)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_smsBalance_estId").on(table.establishmentId),
]);

export type SmsBalance = typeof smsBalance.$inferSelect;
export type InsertSmsBalance = typeof smsBalance.$inferInsert;

// SMS Transactions - Histórico de transações de SMS (créditos e débitos)
export const smsTransactions = mysqlTable("sms_transactions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  type: mysqlEnum("type", ["credit", "debit"]).notNull(), // credit = recarga, debit = envio
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(), // Valor da transação (4 casas para precisão)
  smsCount: int("smsCount").default(0).notNull(), // Quantidade de SMS (para débitos)
  balanceBefore: decimal("balanceBefore", { precision: 10, scale: 4 }).notNull(), // Saldo antes
  balanceAfter: decimal("balanceAfter", { precision: 10, scale: 4 }).notNull(), // Saldo depois
  description: varchar("description", { length: 255 }), // Descrição da transação
  campaignName: varchar("campaignName", { length: 255 }), // Nome da campanha (para débitos)
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // ID do pagamento Stripe (para recargas via cartão)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_smsTx_establishmentId").on(table.establishmentId),
]);

export type SmsTransaction = typeof smsTransactions.$inferSelect;
export type InsertSmsTransaction = typeof smsTransactions.$inferInsert;




// Espaços de mesas (áreas do restaurante)
export const tableSpaces = mysqlTable("tableSpaces", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TableSpace = typeof tableSpaces.$inferSelect;
export type InsertTableSpace = typeof tableSpaces.$inferInsert;

// Mesas do estabelecimento
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  spaceId: int("spaceId"), // ID do espaço onde a mesa está localizada
  number: int("number").notNull(), // Número da mesa
  name: varchar("name", { length: 100 }), // Nome opcional (ex: "Mesa VIP", "Varanda")
  capacity: int("capacity").default(4).notNull(), // Capacidade de pessoas
  status: mysqlEnum("status", ["free", "occupied", "reserved", "requesting_bill"]).default("free").notNull(),
  currentGuests: int("currentGuests").default(0).notNull(), // Quantidade atual de pessoas
  occupiedAt: timestamp("occupiedAt"), // Quando a mesa foi ocupada
  reservedFor: timestamp("reservedFor"), // Horário da reserva (se reservada)
  reservedName: varchar("reservedName", { length: 255 }), // Nome da reserva
  reservedPhone: varchar("reservedPhone", { length: 30 }), // Telefone da reserva
  reservedGuests: int("reservedGuests"), // Quantidade de pessoas da reserva
  isActive: boolean("isActive").default(true).notNull(), // Se a mesa está ativa
  deletedAt: timestamp("deletedAt"), // Quando a mesa foi excluída (soft delete)
  sortOrder: int("sortOrder").default(0).notNull(), // Ordem de exibição
  label: varchar("label", { length: 15 }), // Identificação opcional da mesa (ex: "João", "Aniversário")
  // Campos para mesas combinadas
  mergedIntoId: int("mergedIntoId"), // ID da mesa principal quando esta mesa foi juntada a outra
  mergedTableIds: text("mergedTableIds"), // JSON array com IDs das mesas que foram juntadas a esta (ex: "[2,3]")
  displayNumber: varchar("displayNumber", { length: 50 }), // Número de exibição para mesas combinadas (ex: "1-3")
  requestingBillAt: timestamp("requestingBillAt"), // Quando a conta foi solicitada
  requestingBillBy: varchar("requestingBillBy", { length: 255 }), // Nome de quem solicitou a conta
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_tables_establishmentId").on(table.establishmentId),
  index("idx_tables_spaceId").on(table.spaceId),
  index("idx_tables_status").on(table.status),
]);

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

// Comandas (vinculadas a mesas ou avulsas)
export const tabs = mysqlTable("tabs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  tableId: int("tableId"), // Mesa vinculada (null para comanda avulsa)
  tabNumber: varchar("tabNumber", { length: 50 }).notNull(), // Número da comanda
  customerName: varchar("customerName", { length: 255 }), // Nome do cliente
  customerPhone: varchar("customerPhone", { length: 30 }), // Telefone do cliente
  status: mysqlEnum("status", ["open", "requesting_bill", "closed", "cancelled"]).default("open").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  serviceCharge: decimal("serviceCharge", { precision: 10, scale: 2 }).default("0").notNull(), // Taxa de serviço (10%)
  total: decimal("total", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // Forma de pagamento ao fechar
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0").notNull(), // Valor pago
  changeAmount: decimal("changeAmount", { precision: 10, scale: 2 }).default("0").notNull(), // Troco
  notes: text("notes"), // Observações gerais
  openedAt: timestamp("openedAt").defaultNow().notNull(), // Quando a comanda foi aberta
  closedAt: timestamp("closedAt"), // Quando foi fechada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_tabs_establishmentId").on(table.establishmentId),
  index("idx_tabs_tableId").on(table.tableId),
  index("idx_tabs_status").on(table.status),
]);

export type Tab = typeof tabs.$inferSelect;
export type InsertTab = typeof tabs.$inferInsert;

// Itens da comanda
export const tabItems = mysqlTable("tabItems", {
  id: int("id").autoincrement().primaryKey(),
  tabId: int("tabId").notNull(), // Comanda vinculada
  productId: int("productId").notNull(), // Produto
  productName: varchar("productName", { length: 255 }).notNull(), // Nome do produto (snapshot)
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // Preço unitário
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(), // Preço total (qty * unit + complementos)
  complements: json("complements").$type<Array<{ name: string; price: number; quantity: number; isIncluded?: boolean; groupType?: "complement" | "included" }>>(), // Complementos
  notes: text("notes"), // Observações do item
  status: mysqlEnum("status", ["pending", "preparing", "ready", "delivered", "cancelled"]).default("pending").notNull(),
  orderedAt: timestamp("orderedAt").defaultNow().notNull(), // Quando foi pedido
  deliveredAt: timestamp("deliveredAt"), // Quando foi entregue
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_tabItems_tabId").on(table.tabId),
]);

export type TabItem = typeof tabItems.$inferSelect;
export type InsertTabItem = typeof tabItems.$inferInsert;

// Pagamentos avulsos (abatimentos por valor na comanda)
export const tabPayments = mysqlTable("tabPayments", {
  id: int("id").autoincrement().primaryKey(),
  tabId: int("tabId").notNull(), // Comanda vinculada
  tableId: int("tableId").notNull(), // Mesa vinculada
  establishmentId: int("establishmentId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor pago
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // Forma de pagamento
  notes: text("notes"), // Observações
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_tabPayments_tabId").on(table.tabId),
]);

export type TabPayment = typeof tabPayments.$inferSelect;
export type InsertTabPayment = typeof tabPayments.$inferInsert;

// Campanhas SMS agendadas
export const scheduledCampaigns = mysqlTable("scheduled_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  recipients: json("recipients").notNull(), // Array de { phone: string, name?: string }
  recipientCount: int("recipientCount").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(), // Data/hora para disparo
  status: mysqlEnum("status", ["pending", "sent", "cancelled", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"), // Quando foi efetivamente disparada
  successCount: int("successCount").default(0).notNull(), // SMS enviados com sucesso
  failCount: int("failCount").default(0).notNull(), // SMS que falharam
  costPerSms: decimal("costPerSms", { precision: 10, scale: 4 }).default("0.097").notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_schedCampaigns_estId").on(table.establishmentId),
  index("idx_schedCampaigns_status").on(table.status),
]);

export type ScheduledCampaign = typeof scheduledCampaigns.$inferSelect;
export type InsertScheduledCampaign = typeof scheduledCampaigns.$inferInsert;

// Pedidos online pendentes de pagamento (dados salvos antes do checkout Stripe)
export const pendingOnlineOrders = mysqlTable("pending_online_orders", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(), // Stripe checkout session ID
  establishmentId: int("establishmentId").notNull(),
  orderData: json("orderData").notNull(), // JSON completo com dados do pedido e itens
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  resultOrderId: int("resultOrderId"), // ID do pedido criado após pagamento
  resultOrderNumber: varchar("resultOrderNumber", { length: 50 }), // Número do pedido criado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_pendingOrders_estId").on(table.establishmentId),
  index("idx_pendingOrders_status").on(table.status),
]);
export type PendingOnlineOrder = typeof pendingOnlineOrders.$inferSelect;
export type InsertPendingOnlineOrder = typeof pendingOnlineOrders.$inferInsert;


// Clientes PDV - salvar dados de clientes para reaproveitamento no PDV
export const pdvCustomers = mysqlTable("pdv_customers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  phone: varchar("phone", { length: 30 }).notNull(), // Telefone como identificador principal (somente dígitos)
  name: varchar("name", { length: 255 }),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 50 }),
  complement: varchar("complement", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"), // Anotações internas do restaurante sobre o cliente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_pdvCustomers_estId").on(table.establishmentId),
]);

export type PdvCustomer = typeof pdvCustomers.$inferSelect;
export type InsertPdvCustomer = typeof pdvCustomers.$inferInsert;


// Combo Groups - Grupos dentro de um combo (ex: "Escolha seu lanche", "Escolha sua bebida")
export const comboGroups = mysqlTable("comboGroups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(), // ID do produto-combo pai
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Escolha seu lanche"
  isRequired: boolean("isRequired").default(true).notNull(), // Obrigatório ou opcional
  minQuantity: int("minQuantity").default(1).notNull(), // Quantidade mínima que o cliente deve escolher
  maxQuantity: int("maxQuantity").default(1).notNull(), // Quantidade máxima que o cliente pode escolher
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_comboGroups_productId").on(table.productId),
]);

export type ComboGroup = typeof comboGroups.$inferSelect;
export type InsertComboGroup = typeof comboGroups.$inferInsert;

// Combo Group Items - Itens vinculados a cada grupo do combo
export const comboGroupItems = mysqlTable("comboGroupItems", {
  id: int("id").autoincrement().primaryKey(),
  comboGroupId: int("comboGroupId").notNull(), // ID do grupo
  productId: int("productId").notNull(), // ID do produto vinculado
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_comboGroupItems_groupId").on(table.comboGroupId),
]);

export type ComboGroupItem = typeof comboGroupItems.$inferSelect;
export type InsertComboGroupItem = typeof comboGroupItems.$inferInsert;

// Delivery drivers
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Quem informa que saiu para entrega para este entregador: "driver" = entregador, "attendant" = atendente
  departureNotifyBy: mysqlEnum("departureNotifyBy", ["driver", "attendant"]).default("driver").notNull(),
  // Repasse strategy: "neighborhood" = valor por bairro, "fixed" = valor fixo, "percentage" = percentual da taxa
  repasseStrategy: mysqlEnum("repasseStrategy", ["none", "neighborhood", "fixed", "percentage"]).default("neighborhood").notNull(),
  fixedValue: decimal("fixedValue", { precision: 10, scale: 2 }),
  percentageValue: decimal("percentageValue", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_drivers_establishmentId").on(table.establishmentId),
]);

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

// Deliveries (link between orders and drivers)
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId").notNull(),
  driverId: int("driverId").notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).notNull(),
  repasseValue: decimal("repasseValue", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  whatsappSentAt: timestamp("whatsappSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_deliveries_estId").on(table.establishmentId),
  index("idx_deliveries_orderId").on(table.orderId),
  index("idx_deliveries_driverId").on(table.driverId),
]);

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;


// ============ FINANÇAS ============

// Categorias de despesa
export const expenseCategories = mysqlTable("expenseCategories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6b7280"), // Cor para gráficos
  isDefault: boolean("isDefault").default(false).notNull(), // Categorias padrão do sistema
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_expenseCats_estId").on(table.establishmentId),
]);

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

// Despesas (gastos)
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  categoryId: int("categoryId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "pix", "card", "transfer"]).default("cash").notNull(),
  date: timestamp("date").notNull(), // Data do gasto
  notes: text("notes"), // Observação opcional
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_expenses_establishmentId").on(table.establishmentId),
  index("idx_expenses_categoryId").on(table.categoryId),
]);

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// Metas mensais de lucro
export const monthlyGoals = mysqlTable("monthlyGoals", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  targetProfit: decimal("targetProfit", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_monthlyGoals_estId").on(table.establishmentId),
]);

export type MonthlyGoal = typeof monthlyGoals.$inferSelect;
export type InsertMonthlyGoal = typeof monthlyGoals.$inferInsert;

// Despesas Recorrentes
export const recurringExpenses = mysqlTable("recurringExpenses", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  type: mysqlEnum("type", ["expense", "revenue"]).default("expense").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  categoryId: int("categoryId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "pix", "card", "transfer"]).default("cash").notNull(),
  frequency: mysqlEnum("frequency", ["weekly", "monthly", "yearly"]).default("monthly").notNull(),
  executionDay: int("executionDay").notNull(), // dia do mês (1-31) ou dia da semana (0-6, 0=domingo)
  executionMonth: int("executionMonth"), // mês (1-12), apenas para frequência anual
  generateAsPending: boolean("generateAsPending").default(false).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"), // null = sem fim
  active: boolean("active").default(true).notNull(),
  lastGeneratedAt: timestamp("lastGeneratedAt"), // última vez que gerou lançamento
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_recurringExp_estId").on(table.establishmentId),
]);

export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type InsertRecurringExpense = typeof recurringExpenses.$inferInsert;

// Histórico de alterações em despesas recorrentes
export const recurringExpenseHistory = mysqlTable("recurringExpenseHistory", {
  id: int("id").autoincrement().primaryKey(),
  recurringExpenseId: int("recurringExpenseId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  field: varchar("field", { length: 100 }).notNull(), // campo alterado (amount, frequency, description, etc.)
  oldValue: varchar("oldValue", { length: 500 }).notNull(),
  newValue: varchar("newValue", { length: 500 }).notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => [
  index("idx_recurringExpHist_expId").on(table.recurringExpenseId),
]);

export type RecurringExpenseHistoryEntry = typeof recurringExpenseHistory.$inferSelect;
export type InsertRecurringExpenseHistoryEntry = typeof recurringExpenseHistory.$inferInsert;

// Metas financeiras personalizadas (múltiplas por mês)
export const financialGoals = mysqlTable("financialGoals", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["profit", "revenue", "savings", "custom"]).default("custom").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_financialGoals_estId").on(table.establishmentId),
]);

export type FinancialGoal = typeof financialGoals.$inferSelect;
export type InsertFinancialGoal = typeof financialGoals.$inferInsert;

// Metas semanais de faturamento
export const weeklyGoals = mysqlTable("weeklyGoals", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  targetRevenue: decimal("targetRevenue", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_weeklyGoals_estId").on(table.establishmentId),
]);

export type WeeklyGoal = typeof weeklyGoals.$inferSelect;
export type InsertWeeklyGoal = typeof weeklyGoals.$inferInsert;


// ============ CASHBACK ============

// Transações de cashback (geração e uso)
export const cashbackTransactions = mysqlTable("cashbackTransactions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  type: mysqlEnum("type", ["credit", "debit"]).notNull(), // credit = geração, debit = uso
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor do cashback
  orderId: int("orderId"), // Pedido que gerou ou consumiu o cashback
  orderNumber: varchar("orderNumber", { length: 50 }),
  description: varchar("description", { length: 500 }),
  balanceBefore: decimal("balanceBefore", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_cashbackTx_estId").on(table.establishmentId),
  index("idx_cashbackTx_orderId").on(table.orderId),
]);

export type CashbackTransaction = typeof cashbackTransactions.$inferSelect;
export type InsertCashbackTransaction = typeof cashbackTransactions.$inferInsert;

// Saldo de cashback por cliente por estabelecimento
export const cashbackBalances = mysqlTable("cashbackBalances", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  totalEarned: decimal("totalEarned", { precision: 10, scale: 2 }).default("0").notNull(),
  totalUsed: decimal("totalUsed", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_cashbackBal_estId").on(table.establishmentId),
]);

export type CashbackBalance = typeof cashbackBalances.$inferSelect;
export type InsertCashbackBalance = typeof cashbackBalances.$inferInsert;


// ============ BOT API ============

// API Keys para integração com bots externos (n8n, WhatsApp, etc.)
export const botApiKeys = mysqlTable("botApiKeys", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nome descritivo (ex: "n8n WhatsApp Bot")
  apiKey: varchar("apiKey", { length: 128 }).notNull().unique(), // Chave de API (bot_ + 64 hex chars) - mantido para fallback
  apiKeyHash: varchar("apiKeyHash", { length: 64 }), // P09: Hash SHA-256 da API key
  isActive: boolean("isActive").default(true).notNull(),
  isGlobal: boolean("isGlobal").default(false).notNull(), // Se true, acessa todos os estabelecimentos
  lastUsedAt: timestamp("lastUsedAt"), // Último uso da chave
  requestCount: int("requestCount").default(0).notNull(), // Contador de requisições
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_botApiKeys_estId").on(table.establishmentId),
  index("idx_botApiKeys_hash").on(table.apiKeyHash),
]);

export type BotApiKey = typeof botApiKeys.$inferSelect;
export type InsertBotApiKey = typeof botApiKeys.$inferInsert;


// Logs de impressao
export const printLogs = mysqlTable("printLogs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull(),
  trigger: mysqlEnum("trigger", ["new_order", "accept", "manual", "reprint"]).default("new_order").notNull(),
  method: mysqlEnum("method", ["sse", "pos_driver", "socket_tcp", "direct"]).default("sse").notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "failed"]).default("sent").notNull(),
  printerConnections: int("printerConnections").default(0).notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_printLogs_establishmentId").on(table.establishmentId),
]);

export type PrintLog = typeof printLogs.$inferSelect;
export type InsertPrintLog = typeof printLogs.$inferInsert;


// Feedback / Sugestões dos utilizadores
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId"),
  type: mysqlEnum("type", ["bug", "suggestion", "question", "other", "praise"]).default("suggestion").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  screenshotUrl: text("screenshotUrl"),
  page: varchar("page", { length: 255 }), // página de onde o feedback foi enviado
  status: mysqlEnum("status", ["new", "read", "in_progress", "resolved", "closed"]).default("new").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_feedbacks_establishmentId").on(table.establishmentId),
  index("idx_feedbacks_status").on(table.status),
]);

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

// Stories do Menu (estilo Instagram) — com tipos de venda
export const storyTypeEnum = mysqlEnum("storyType", ["simple", "product", "promo"]);
export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  // Tipo do story: simple (imagem), product (destacar produto), promo (promoção)
  type: storyTypeEnum.default("simple").notNull(),
  // Para tipo "product": ID do produto vinculado
  productId: int("productId"),
  // Para tipo "promo": dados da promoção
  promoTitle: varchar("promoTitle", { length: 120 }),
  promoText: varchar("promoText", { length: 255 }),
  promoPrice: varchar("promoPrice", { length: 20 }),
  // Para tipo "promo": validade da promoção (null = sem limite)
  promoExpiresAt: timestamp("promoExpiresAt"),
  // Para tipo "promo": estilo do badge de preço (circle, ribbon, top-center)
  priceBadgeStyle: mysqlEnum("priceBadgeStyle", ["circle", "ribbon", "top-center"]).default("circle"),
  // Para tipos "product" e "promo": texto do botão de ação
  actionLabel: varchar("actionLabel", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => [
  index("idx_stories_establishmentId").on(table.establishmentId),
]);
export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

// Story Views - Analytics de visualizações de stories
export const storyViews = mysqlTable("storyViews", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => [
  index("idx_storyViews_storyId").on(table.storyId),
]);
export type StoryView = typeof storyViews.$inferSelect;
export type InsertStoryView = typeof storyViews.$inferInsert;

// Story Events - Analytics de conversão (cliques, carrinho, pedidos)
export const storyEvents = mysqlTable("storyEvents", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  eventType: mysqlEnum("eventType", ["click", "add_to_cart", "order_completed"]).notNull(),
  productId: int("productId"),
  orderId: int("orderId"),
  orderValue: decimal("orderValue", { precision: 10, scale: 2 }),
  sessionId: varchar("sessionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_storyEvents_storyId").on(table.storyId),
  index("idx_storyEvents_estId").on(table.establishmentId),
]);
export type StoryEvent = typeof storyEvents.$inferSelect;
export type InsertStoryEvent = typeof storyEvents.$inferInsert;

// Histórico de créditos de melhoria de imagem com IA
export const aiImageCreditLogs = mysqlTable("ai_image_credit_logs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["use", "purchase", "bonus", "refund"]).notNull(),
  quantity: int("quantity").notNull(), // positivo para compra/bonus, negativo para uso
  balanceAfter: int("balanceAfter").notNull(),
  description: varchar("description", { length: 255 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }), // referência ao checkout session do Stripe
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_aiImageCredits_estId").on(table.establishmentId),
]);
export type AiImageCreditLog = typeof aiImageCreditLogs.$inferSelect;
export type InsertAiImageCreditLog = typeof aiImageCreditLogs.$inferInsert;


// Collaborators (staff access management)
export const collaborators = mysqlTable("collaborators", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  permissions: json("permissions").$type<string[]>().notNull().default([]),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_collaborators_estId").on(table.establishmentId),
]);
export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = typeof collaborators.$inferInsert;

// Order counters for atomic order number generation
export const orderCounters = mysqlTable("order_counters", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  counterDate: varchar("counterDate", { length: 10 }).notNull(), // YYYY-MM-DD
  counter: int("counter").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uniq_est_date").on(table.establishmentId, table.counterDate),
]);
export type OrderCounter = typeof orderCounters.$inferSelect;
export type InsertOrderCounter = typeof orderCounters.$inferInsert;

// Admin audit log for tracking admin actions
export const adminAuditLog = mysqlTable("admin_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 50 }).notNull(),
  targetId: int("targetId"),
  targetName: varchar("targetName", { length: 255 }),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_auditLog_adminId").on(table.adminId),
  index("idx_auditLog_action").on(table.action),
  index("idx_auditLog_createdAt").on(table.createdAt),
]);
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

// ============ EMAIL VERIFICATION ============

// Códigos de verificação de email para onboarding
export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 5 }).notNull(), // Código de 5 dígitos
  attempts: int("attempts").default(0).notNull(), // Tentativas de validação
  verified: boolean("verified").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Expira em 10 minutos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_emailVerif_email").on(table.email),
]);

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;


// ============ WHATSAPP CHAT ============

// Conversas do WhatsApp (cada contato = uma conversa)
export const whatsappConversations = mysqlTable("whatsapp_conversations", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  remoteJid: varchar("remoteJid", { length: 100 }).notNull(), // número@s.whatsapp.net
  phone: varchar("phone", { length: 30 }).notNull(), // número formatado
  contactName: varchar("contactName", { length: 255 }), // nome do contato (pushName)
  profilePicUrl: text("profilePicUrl"), // foto do perfil
  lastMessageText: text("lastMessageText"), // preview da última mensagem
  lastMessageAt: timestamp("lastMessageAt"), // timestamp da última mensagem
  unreadCount: int("unreadCount").default(0).notNull(), // mensagens não lidas
  status: mysqlEnum("status", ["bot", "human", "closed"]).default("bot").notNull(), // quem está atendendo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("idx_wc_estab_jid").on(table.establishmentId, table.remoteJid),
  index("idx_wc_estab").on(table.establishmentId),
]);

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;

// Mensagens do WhatsApp
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(), // FK para whatsapp_conversations
  establishmentId: int("establishmentId").notNull(),
  remoteJid: varchar("remoteJid", { length: 100 }).notNull(),
  messageId: varchar("messageId", { length: 200 }), // ID da mensagem na UAZAPI
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).notNull(), // recebida ou enviada
  senderName: varchar("senderName", { length: 255 }), // nome de quem enviou
  messageType: mysqlEnum("messageType", ["text", "image", "audio", "video", "document", "sticker", "location", "contact", "other"]).default("text").notNull(),
  content: text("content"), // texto da mensagem
  mediaUrl: text("mediaUrl"), // URL da mídia (se houver)
  timestamp: timestamp("timestamp").defaultNow().notNull(), // quando a mensagem foi enviada/recebida
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_wm_conv").on(table.conversationId),
  index("idx_wm_estab").on(table.establishmentId),
  index("idx_wm_timestamp").on(table.timestamp),
]);

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;


// Fechamentos Programados
export const scheduledClosures = mysqlTable("scheduled_closures", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  // Tipo: "specific_date" = data específica, "recurring" = regra recorrente
  type: mysqlEnum("type", ["specific_date", "recurring"]).notNull(),
  // Para datas específicas: a data exata
  specificDate: date("specificDate"),
  // Para regras recorrentes: tipo da regra
  // "last_sunday" = último domingo do mês
  // "last_saturday" = último sábado do mês
  // "last_friday" = última sexta do mês
  // "first_sunday" = primeiro domingo do mês
  // "first_saturday" = primeiro sábado do mês
  // "first_monday" = primeira segunda do mês
  // "every_sunday" = todo domingo
  // "every_monday" = toda segunda
  // "every_tuesday" = toda terça
  // "every_wednesday" = toda quarta
  // "every_thursday" = toda quinta
  // "every_friday" = toda sexta
  // "every_saturday" = todo sábado
  recurringRule: varchar("recurringRule", { length: 50 }),
  // Motivo/descrição do fechamento
  reason: varchar("reason", { length: 255 }),
  // Se está ativo
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_sc_estab").on(table.establishmentId),
  index("idx_sc_type").on(table.type),
  index("idx_sc_date").on(table.specificDate),
]);

export type ScheduledClosure = typeof scheduledClosures.$inferSelect;
export type InsertScheduledClosure = typeof scheduledClosures.$inferInsert;

// ==================== CHANGELOG ====================

export const changelogVersions = mysqlTable("changelog_versions", {
  id: int("id").primaryKey().autoincrement(),
  version: varchar("version", { length: 20 }).notNull(), // e.g. "2.6.0"
  title: varchar("title", { length: 200 }).notNull(), // e.g. "Melhorias no cardápio"
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ChangelogVersion = typeof changelogVersions.$inferSelect;
export type InsertChangelogVersion = typeof changelogVersions.$inferInsert;

export const changelogEntries = mysqlTable("changelog_entries", {
  id: int("id").primaryKey().autoincrement(),
  versionId: int("version_id").notNull(),
  type: mysqlEnum("type", ["feature", "improvement", "fix"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ce_version").on(table.versionId),
]);

export type ChangelogEntry = typeof changelogEntries.$inferSelect;
export type InsertChangelogEntry = typeof changelogEntries.$inferInsert;

export const changelogLikes = mysqlTable("changelog_likes", {
  id: int("id").primaryKey().autoincrement(),
  versionId: int("version_id").notNull(),
  establishmentId: int("establishment_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_cl_version").on(table.versionId),
  index("idx_cl_establishment").on(table.establishmentId),
  uniqueIndex("uniq_cl_version_establishment").on(table.versionId, table.establishmentId),
  foreignKey({
    columns: [table.versionId],
    foreignColumns: [changelogVersions.id],
    name: "fk_changelog_likes_version",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.establishmentId],
    foreignColumns: [establishments.id],
    name: "fk_changelog_likes_establishment",
  }).onDelete("cascade"),
]);

export type ChangelogLike = typeof changelogLikes.$inferSelect;
export type InsertChangelogLike = typeof changelogLikes.$inferInsert;


// Chat shortcuts (quick messages)
export const chatShortcuts = mysqlTable("chat_shortcuts", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishment_id").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  message: text("message").notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_cs_establishment").on(table.establishmentId),
]);

export type ChatShortcut = typeof chatShortcuts.$inferSelect;
export type InsertChatShortcut = typeof chatShortcuts.$inferInsert;


// ============ ORDER LOGS ============
// Tabela de logs de pedidos para diagnóstico de erros e auditoria do fluxo de criação
export const orderLogs = mysqlTable("order_logs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishment_id"),
  orderId: int("order_id"), // null se o pedido falhou antes de ser criado
  customerId: int("customer_id"),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  level: mysqlEnum("level", ["info", "warn", "error"]).default("info").notNull(),
  event: varchar("event", { length: 100 }).notNull(), // ex: "order_created", "order_failed", "price_mismatch", "payment_failed"
  message: text("message").notNull(), // descrição legível do evento
  details: json("details").$type<Record<string, unknown>>(), // dados extras (preços, itens, erros, stack trace, etc.)
  source: varchar("source", { length: 50 }).default("server").notNull(), // "server", "publicMenu", "stripeConnect", "botApi", "whatsapp"
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_orderLogs_establishment").on(table.establishmentId),
  index("idx_orderLogs_orderId").on(table.orderId),
  index("idx_orderLogs_level").on(table.level),
  index("idx_orderLogs_event").on(table.event),
  index("idx_orderLogs_createdAt").on(table.createdAt),
]);

export type OrderLog = typeof orderLogs.$inferSelect;
export type InsertOrderLog = typeof orderLogs.$inferInsert;


// ─── Paytime Payment Transactions ──────────────────────────────
// Armazena apenas IDs de referência da Paytime e dados de negócio locais.
// Dados detalhados (valores, taxas, status) são consultados via API Paytime quando necessário.
export const paytimeTransactions = mysqlTable("paytime_transactions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId"), // Referência ao pedido local (pode ser null se pagamento avulso)
  paytimeTransactionId: varchar("paytimeTransactionId", { length: 100 }).notNull(), // _id da Paytime
  paytimeGatewayKey: varchar("paytimeGatewayKey", { length: 100 }), // gateway_key da Paytime
  referenceId: varchar("referenceId", { length: 100 }), // reference_id enviado na criação
  paymentType: mysqlEnum("paymentType", ["PIX", "CREDIT_CARD", "BOLETO"]).default("PIX").notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "CANCELLED", "REFUNDED", "EXPIRED", "PAID", "FAILED", "WAITING_ANTIFRAUD"]).default("PENDING").notNull(),
  amountCents: int("amountCents").notNull(), // Valor em centavos
  emv: text("emv"), // String EMV para QR Code PIX (copia-e-cola)
  antifraudId: varchar("antifraudId", { length: 255 }), // ID do antifraude IDPAY
  antifraudSession: text("antifraudSession"), // Token JWT do SDK IDPAY
  antifraudRequired: varchar("antifraudRequired", { length: 20 }), // "IDPAY" ou "THREEDS"
  cardBrand: varchar("cardBrand", { length: 50 }), // Bandeira do cartão (Visa, Mastercard, etc)
  cardLast4: varchar("cardLast4", { length: 4 }), // Últimos 4 dígitos do cartão
  installments: int("installments").default(1), // Número de parcelas
  paidAt: timestamp("paidAt"), // Quando foi confirmado o pagamento
  statusOrigin: varchar("statusOrigin", { length: 20 }).default("webhook"), // Origem da atualização: webhook, fallback, manual
  fallbackCheckedAt: timestamp("fallbackCheckedAt"), // Última vez que o fallback verificou esta transação
  fallbackAttempts: int("fallbackAttempts").default(0).notNull(), // Número de tentativas de fallback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_paytime_establishmentId").on(table.establishmentId),
  index("idx_paytime_orderId").on(table.orderId),
  index("idx_paytime_transactionId").on(table.paytimeTransactionId),
  index("idx_paytime_status").on(table.status),
]);

export type PaytimeTransaction = typeof paytimeTransactions.$inferSelect;
export type InsertPaytimeTransaction = typeof paytimeTransactions.$inferInsert;


// ============ PLAN CONFIGURATION (Admin-editable) ============

// Preços dos planos (editáveis pelo admin)
export const planPrices = mysqlTable("plan_prices", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 50 }).notNull().unique(), // trial, lite, basic, pro
  displayName: varchar("displayName", { length: 100 }), // Nome exibido (editável pelo admin)
  monthlyPriceCents: int("monthlyPriceCents").notNull().default(0), // Preço mensal em centavos
  annualPriceCents: int("annualPriceCents").notNull().default(0), // Preço anual em centavos
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlanPrice = typeof planPrices.$inferSelect;
export type InsertPlanPrice = typeof planPrices.$inferInsert;

// Features/recursos dos planos (editáveis pelo admin)
export const planFeatures = mysqlTable("plan_features", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 50 }).notNull(), // trial, lite, basic, pro
  text: text("text").notNull(), // Texto do recurso
  sortOrder: int("sortOrder").notNull().default(0), // Ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_planFeatures_planId").on(table.planId),
]);
export type PlanFeature = typeof planFeatures.$inferSelect;
export type InsertPlanFeature = typeof planFeatures.$inferInsert;

// Sugestões fixas (sempre sugerir) — unifica isUpsell (categoria) e isUpsellPinned (produto)
export const fixedSuggestions = mysqlTable("fixed_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  type: mysqlEnum("type", ["product", "category"]).notNull(), // tipo do item sugerido
  productId: int("productId"), // preenchido quando type = 'product'
  categoryId: int("categoryId"), // preenchido quando type = 'category'
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  // Regras de horário
  scheduleEnabled: boolean("scheduleEnabled").default(false).notNull(),
  scheduleDays: json("scheduleDays").$type<number[]>(), // 0=Dom, 1=Seg, ..., 6=Sab
  scheduleStartTime: varchar("scheduleStartTime", { length: 5 }), // "11:00"
  scheduleEndTime: varchar("scheduleEndTime", { length: 5 }), // "14:00"
  scheduleLabel: varchar("scheduleLabel", { length: 50 }), // "Almoço", "Jantar", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_fixedSuggestions_establishmentId").on(table.establishmentId),
  index("idx_fixedSuggestions_productId").on(table.productId),
  index("idx_fixedSuggestions_categoryId").on(table.categoryId),
]);
export type FixedSuggestion = typeof fixedSuggestions.$inferSelect;
export type InsertFixedSuggestion = typeof fixedSuggestions.$inferInsert;

// Escopo opcional por categoria para sugestões fixas.
// Sem registros nesta tabela, a sugestão fixa permanece global.
export const fixedSuggestionCategoryScopes = mysqlTable("fixed_suggestion_category_scopes", {
  id: int("id").autoincrement().primaryKey(),
  fixedSuggestionId: int("fixedSuggestionId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_fixedSuggestionCategoryScopes_fixedSuggestionId").on(table.fixedSuggestionId),
  index("idx_fixedSuggestionCategoryScopes_categoryId").on(table.categoryId),
  uniqueIndex("idx_fixedSuggestionCategoryScopes_unique").on(table.fixedSuggestionId, table.categoryId),
  foreignKey({
    columns: [table.fixedSuggestionId],
    foreignColumns: [fixedSuggestions.id],
    name: "fk_fixed_scopes_fixed_suggestion",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [categories.id],
    name: "fk_fixed_scopes_category",
  }).onDelete("cascade"),
]);
export type FixedSuggestionCategoryScope = typeof fixedSuggestionCategoryScopes.$inferSelect;
export type InsertFixedSuggestionCategoryScope = typeof fixedSuggestionCategoryScopes.$inferInsert;

// Sugestões vinculadas (cross-sell contextual) — quando pedir X, sugerir Y
// Um gatilho (trigger) pode ter N produtos sugeridos (relação 1:N via linked_suggestion_items)
export const linkedSuggestions = mysqlTable("linked_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  triggerProductId: int("triggerProductId").notNull(), // produto gatilho
  isActive: boolean("isActive").default(true).notNull(),
  // Regras de horário
  scheduleEnabled: boolean("scheduleEnabled").default(false).notNull(),
  scheduleDays: json("scheduleDays").$type<number[]>(), // 0=Dom, 1=Seg, ..., 6=Sab
  scheduleStartTime: varchar("scheduleStartTime", { length: 5 }), // "11:00"
  scheduleEndTime: varchar("scheduleEndTime", { length: 5 }), // "14:00"
  scheduleLabel: varchar("scheduleLabel", { length: 50 }), // "Almoço", "Jantar", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_linkedSuggestions_establishmentId").on(table.establishmentId),
  index("idx_linkedSuggestions_triggerProductId").on(table.triggerProductId),
]);
export type LinkedSuggestion = typeof linkedSuggestions.$inferSelect;
export type InsertLinkedSuggestion = typeof linkedSuggestions.$inferInsert;

// Itens sugeridos de uma sugestão vinculada (N sugeridos por gatilho)
export const linkedSuggestionItems = mysqlTable("linked_suggestion_items", {
  id: int("id").autoincrement().primaryKey(),
  linkedSuggestionId: int("linkedSuggestionId").notNull(), // FK para linked_suggestions
  suggestedProductId: int("suggestedProductId").notNull(), // produto sugerido
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_linkedSuggestionItems_linkedSuggestionId").on(table.linkedSuggestionId),
  index("idx_linkedSuggestionItems_suggestedProductId").on(table.suggestedProductId),
]);
export type LinkedSuggestionItem = typeof linkedSuggestionItems.$inferSelect;
export type InsertLinkedSuggestionItem = typeof linkedSuggestionItems.$inferInsert;

// ==================== USER PREFERENCES ====================
// Tabela genérica de preferências do usuário (chave-valor)
// Usada para persistir banners dismissidos, modais vistos, tooltips, etc.
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId"),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_userPrefs_userId").on(table.userId),
  index("idx_userPrefs_estId").on(table.establishmentId),
  uniqueIndex("uniq_userPrefs_user_est_key").on(table.userId, table.establishmentId, table.key),
]);
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;


// Onboarding Draft - salvar rascunho do cadastro Banking para continuar depois
export const onboardingDrafts = mysqlTable("onboarding_drafts", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  step: int("step").notNull().default(1),
  data: json("data").$type<{
    razaoSocial?: string;
    nomeFantasia?: string;
    document?: string;
    cnae?: string;
    email?: string;
    phone?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    repFirstName?: string;
    repLastName?: string;
    repCpf?: string;
    repEmail?: string;
    repPhone?: string;
    repBirthDate?: string;
  }>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uniq_onbDraft_estId").on(table.establishmentId),
]);
export type OnboardingDraft = typeof onboardingDrafts.$inferSelect;
export type InsertOnboardingDraft = typeof onboardingDrafts.$inferInsert;

// Tabela de disputas/negociações do iFood (Fase 4 - Handshake Platform)
export const ifoodDisputes = mysqlTable("ifood_disputes", {
  id: int("id").primaryKey().autoincrement(),
  disputeId: varchar("disputeId", { length: 64 }).notNull(),
  orderId: varchar("orderId", { length: 64 }).notNull(),
  establishmentId: int("establishmentId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // CANCELLATION, PARTIAL_CANCELLATION, PROPOSED_AMOUNT_REFUND, PROPOSED_ADDITIONAL_TIME
  handshakeType: varchar("handshakeType", { length: 64 }).notNull(), // FULL, PARTIAL
  message: text("message"), // Customer justification
  expiresAt: timestamp("expiresAt").notNull(),
  timeoutAction: varchar("timeoutAction", { length: 64 }).notNull(), // ACCEPT, REJECT
  status: mysqlEnum("status", ["PENDING", "ACCEPTED", "REJECTED", "ALTERNATIVE", "EXPIRED"]).default("PENDING").notNull(),
  alternativesJson: text("alternativesJson"), // JSON of available alternatives
  metadataJson: text("metadataJson"), // JSON of items, evidences, reasons
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uniq_ifood_disputes_disputeId").on(table.disputeId),
  index("idx_ifood_disputes_orderId").on(table.orderId),
  index("idx_ifood_disputes_estId").on(table.establishmentId),
  index("idx_ifood_disputes_status").on(table.status),
]);
export type IfoodDispute = typeof ifoodDisputes.$inferSelect;
export type InsertIfoodDispute = typeof ifoodDisputes.$inferInsert;


// ============================
// Pagamento de Assinaturas via Paytime (PIX + Cartão) + Gateway Config
// ============================

// Configurações globais de gateways de pagamento (admin)
export const gatewaySettings = mysqlTable("gateway_settings", {
  id: int("id").autoincrement().primaryKey(),
  gateway: varchar("gateway", { length: 50 }).notNull().unique(), // "stripe_card", "paytime_pix", "paytime_card"
  enabled: boolean("enabled").default(false).notNull(),
  displayName: varchar("displayName", { length: 100 }), // Nome exibido ao restaurante
  sortOrder: int("sortOrder").default(0).notNull(), // Ordem de exibição
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GatewaySetting = typeof gatewaySettings.$inferSelect;
export type InsertGatewaySetting = typeof gatewaySettings.$inferInsert;

// Assinaturas de planos (controle de recorrência)
export const planSubscriptions = mysqlTable("plan_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  planId: varchar("planId", { length: 50 }).notNull(), // lite, basic, pro
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "annual"]).notNull(),
  gateway: varchar("gateway", { length: 50 }).notNull(), // "stripe_card", "paytime_pix", "paytime_card"
  status: mysqlEnum("status", ["active", "pending", "past_due", "canceled", "expired", "canceling"]).default("pending").notNull(),
  // Paytime-specific
  paytimeTransactionId: varchar("paytimeTransactionId", { length: 100 }), // Última transação
  paytimeCardToken: varchar("paytimeCardToken", { length: 500 }), // Token do cartão para cobrança recorrente
  paytimeCardBrand: varchar("paytimeCardBrand", { length: 50 }),
  paytimeCardLast4: varchar("paytimeCardLast4", { length: 4 }),
  // Stripe-specific
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  // Valores
  amountCents: int("amountCents").notNull(), // Valor da cobrança em centavos
  // Datas
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"), // Data de renovação
  gracePeriodEnd: timestamp("gracePeriodEnd"), // Data limite de carência (currentPeriodEnd + 2 dias para PIX)
  canceledAt: timestamp("canceledAt"),
  // Controle de renovação
  lastPaymentAt: timestamp("lastPaymentAt"),
  nextRenewalAt: timestamp("nextRenewalAt"),
  renewalAttempts: int("renewalAttempts").default(0).notNull(),
  lastRenewalError: text("lastRenewalError"),
  // Notificações de renovação
  renewalNotifiedAt: timestamp("renewalNotifiedAt"), // Quando enviou notificação de renovação PIX
  renewalPixEmv: text("renewalPixEmv"), // QR Code PIX da renovação pendente
  renewalPixTransactionId: varchar("renewalPixTransactionId", { length: 100 }),
  // Retention & cancel fields
  cancelReason: text("cancelReason"),
  cancelAt: timestamp("cancelAt"), // Data em que o plano expira de fato após cancelamento
  discountPercent: int("discountPercent").default(0).notNull(), // Desconto ativo (0 = sem desconto)
  discountUntil: timestamp("discountUntil"), // Até quando o desconto vale
  discountMonthsRemaining: int("discountMonthsRemaining").default(0).notNull(), // Meses restantes com desconto
  lastRetentionOfferAt: timestamp("lastRetentionOfferAt"), // Controle 1x/ano
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_planSubs_establishmentId").on(table.establishmentId),
  index("idx_planSubs_status").on(table.status),
  index("idx_planSubs_nextRenewal").on(table.nextRenewalAt),
  index("idx_planSubs_gateway").on(table.gateway),
]);
export type PlanSubscription = typeof planSubscriptions.$inferSelect;
export type InsertPlanSubscription = typeof planSubscriptions.$inferInsert;

// Configuração do WhatsApp da plataforma (Mindi) para envio de cobranças
export const platformWhatsappConfig = mysqlTable("platform_whatsapp_config", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: varchar("instanceId", { length: 100 }), // ID da instância UAZAPI
  instanceToken: varchar("instanceToken", { length: 500 }), // Token da instância
  instanceName: varchar("instanceName", { length: 100 }).default("mindi_platform").notNull(),
  status: mysqlEnum("status", ["disconnected", "connecting", "connected"]).default("disconnected").notNull(),
  connectedPhone: varchar("connectedPhone", { length: 30 }), // Número conectado
  connectedName: varchar("connectedName", { length: 200 }), // Nome do perfil WhatsApp
  lastQrCode: text("lastQrCode"), // Último QR code gerado (base64)
  // Templates de mensagem para cobranças
  templateRenewalPix: text("templateRenewalPix"), // Template para cobrança PIX
  templateRenewalCard: text("templateRenewalCard"), // Template para cobrança cartão
  templatePlanActivated: text("templatePlanActivated"), // Template para plano ativado
  templatePlanExpiring: text("templatePlanExpiring"), // Template para plano expirando
  templatePlanDeactivated: text("templatePlanDeactivated"), // Template para plano desativado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlatformWhatsappConfig = typeof platformWhatsappConfig.$inferSelect;
export type InsertPlatformWhatsappConfig = typeof platformWhatsappConfig.$inferInsert;


// ============================
// Mapeamento de Produtos Locais ↔ iFood
// ============================

// Mapeia produtos locais para seus equivalentes no catálogo iFood
export const ifoodProductMapping = mysqlTable("ifood_product_mapping", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  localProductId: int("localProductId").notNull(), // ID do produto na tabela products
  localCategoryId: int("localCategoryId"), // ID da categoria local
  ifoodItemId: varchar("ifoodItemId", { length: 100 }).notNull(), // ID do item no iFood
  ifoodProductId: varchar("ifoodProductId", { length: 100 }).notNull(), // ID do product no iFood
  ifoodCategoryId: varchar("ifoodCategoryId", { length: 100 }).notNull(), // ID da categoria no iFood
  ifoodCatalogId: varchar("ifoodCatalogId", { length: 100 }).notNull(), // ID do catálogo no iFood
  lastSyncedAt: timestamp("lastSyncedAt"), // Última sincronização
  syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "error"]).default("synced").notNull(),
  syncError: text("syncError"), // Mensagem de erro da última tentativa
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_ifood_mapping_estId").on(table.establishmentId),
  index("idx_ifood_mapping_localProductId").on(table.localProductId),
  index("idx_ifood_mapping_ifoodItemId").on(table.ifoodItemId),
  uniqueIndex("uniq_ifood_mapping_est_product").on(table.establishmentId, table.localProductId),
]);
export type IfoodProductMapping = typeof ifoodProductMapping.$inferSelect;
export type InsertIfoodProductMapping = typeof ifoodProductMapping.$inferInsert;

// Mapeia categorias locais para categorias no iFood
export const ifoodCategoryMapping = mysqlTable("ifood_category_mapping", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  localCategoryId: int("localCategoryId").notNull(), // ID da categoria na tabela categories
  ifoodCategoryId: varchar("ifoodCategoryId", { length: 100 }).notNull(), // ID da categoria no iFood
  ifoodCatalogId: varchar("ifoodCatalogId", { length: 100 }).notNull(), // ID do catálogo no iFood
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_ifood_cat_mapping_estId").on(table.establishmentId),
  uniqueIndex("uniq_ifood_cat_mapping_est_cat").on(table.establishmentId, table.localCategoryId),
]);
export type IfoodCategoryMapping = typeof ifoodCategoryMapping.$inferSelect;
export type InsertIfoodCategoryMapping = typeof ifoodCategoryMapping.$inferInsert;

// Mapeia complementos locais para complementos no iFood
export const ifoodComplementMapping = mysqlTable("ifood_complement_mapping", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  localGroupId: int("localGroupId").notNull(), // ID do complementGroup local
  localItemId: int("localItemId"), // ID do complementItem local (null = mapeamento de grupo)
  ifoodOptionGroupId: varchar("ifoodOptionGroupId", { length: 100 }), // ID do optionGroup no iFood
  ifoodOptionId: varchar("ifoodOptionId", { length: 100 }), // ID da option no iFood
  ifoodProductId: varchar("ifoodProductId", { length: 100 }), // ID do product no iFood (para a option)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_ifood_comp_mapping_estId").on(table.establishmentId),
  index("idx_ifood_comp_mapping_localGroupId").on(table.localGroupId),
]);
export type IfoodComplementMapping = typeof ifoodComplementMapping.$inferSelect;
export type InsertIfoodComplementMapping = typeof ifoodComplementMapping.$inferInsert;


// ============================
// Chat do Cardápio Público
// ============================
export const publicChatMessages = mysqlTable("public_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId").notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  content: text("content").notNull(),
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).notNull(),
  mediaUrl: text("mediaUrl"),
  mediaType: varchar("mediaType", { length: 20 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_pcm_estab").on(table.establishmentId),
  index("idx_pcm_order").on(table.orderId),
  index("idx_pcm_phone_estab").on(table.customerPhone, table.establishmentId),
]);
export type PublicChatMessage = typeof publicChatMessages.$inferSelect;
export type InsertPublicChatMessage = typeof publicChatMessages.$inferInsert;

// ============================
// Cash Register (Controle de Caixa)
// ============================
export const cashSessions = mysqlTable("cashSessions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  operatorId: int("operatorId"), // userId do operador (se logado)
  openingAmount: decimal("openingAmount", { precision: 10, scale: 2 }).default("0").notNull(), // Fundo de troco
  closingAmount: decimal("closingAmount", { precision: 10, scale: 2 }), // Valor contado no fechamento
  expectedAmount: decimal("expectedAmount", { precision: 10, scale: 2 }), // Valor esperado calculado
  difference: decimal("difference", { precision: 10, scale: 2 }), // Diferença (contado - esperado)
  observation: text("observation"), // Observação na abertura
  closingObservation: text("closingObservation"), // Observação no fechamento
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_cashSessions_estab").on(table.establishmentId),
  index("idx_cashSessions_estab_status").on(table.establishmentId, table.status),
]);
export type CashSession = typeof cashSessions.$inferSelect;
export type InsertCashSession = typeof cashSessions.$inferInsert;

export const cashMovements = mysqlTable("cashMovements", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  sessionId: int("sessionId").notNull(), // FK para cashSessions
  type: mysqlEnum("type", ["sangria", "suprimento"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  operatorName: varchar("operatorName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_cashMovements_session").on(table.sessionId),
  index("idx_cashMovements_estab").on(table.establishmentId),
]);
export type CashMovement = typeof cashMovements.$inferSelect;
export type InsertCashMovement = typeof cashMovements.$inferInsert;

// ============ OPERADORES DE CAIXA ============
export const cashOperators = mysqlTable("cashOperators", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_cashOperators_estab").on(table.establishmentId),
]);
export type CashOperator = typeof cashOperators.$inferSelect;
export type InsertCashOperator = typeof cashOperators.$inferInsert;

// ============ LEMBRETES DE CAIXA ============
export const cashReminderSettings = mysqlTable("cashReminderSettings", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  openReminderEnabled: boolean("openReminderEnabled").default(true).notNull(),
  closeReminderEnabled: boolean("closeReminderEnabled").default(true).notNull(),
  openReminderDelayMinutes: int("openReminderDelayMinutes").default(5).notNull(),
  closeReminderBeforeMinutes: int("closeReminderBeforeMinutes").default(5).notNull(),
  maxCloseReminders: int("maxCloseReminders").default(3).notNull(),
  respectClosedDays: boolean("respectClosedDays").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_cashReminderSettings_estab").on(table.establishmentId),
]);
export type CashReminderSettings = typeof cashReminderSettings.$inferSelect;
export type InsertCashReminderSettings = typeof cashReminderSettings.$inferInsert;

export const cashReminderLogs = mysqlTable("cashReminderLogs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  reminderType: mysqlEnum("reminderType", ["open", "close"]).notNull(),
  reminderDate: varchar("reminderDate", { length: 10 }).notNull(), // YYYY-MM-DD
  sentCount: int("sentCount").default(1).notNull(),
  lastSentAt: timestamp("lastSentAt").defaultNow().notNull(),
  dismissed: boolean("dismissed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_cashReminderLogs_estab_date").on(table.establishmentId, table.reminderDate),
  index("idx_cashReminderLogs_estab_type_date").on(table.establishmentId, table.reminderType, table.reminderDate),
]);
export type CashReminderLog = typeof cashReminderLogs.$inferSelect;
export type InsertCashReminderLog = typeof cashReminderLogs.$inferInsert;

// ─── Cancel Retention Offers ───
export const cancelRetentionOffers = mysqlTable("cancel_retention_offers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  subscriptionId: int("subscriptionId").notNull(),
  cancelReason: mysqlEnum("cancelReason", ["too_expensive", "not_using", "missing_features", "found_alternative", "technical_issues", "other"]).notNull(),
  cancelReasonText: text("cancelReasonText"),
  offerType: varchar("offerType", { length: 50 }).notNull(),
  offerAccepted: boolean("offerAccepted").default(false).notNull(),
  discountPercent: int("discountPercent").notNull(),
  discountMonths: int("discountMonths").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_cancelRetention_estab").on(table.establishmentId),
  index("idx_cancelRetention_sub").on(table.subscriptionId),
]);
export type CancelRetentionOffer = typeof cancelRetentionOffers.$inferSelect;
export type InsertCancelRetentionOffer = typeof cancelRetentionOffers.$inferInsert;

// Tabela de substituições de complementos inclusos
export const complementSubstitutions = mysqlTable("complement_substitutions", {
  id: int("id").autoincrement().primaryKey(),
  complementItemId: int("complement_item_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  additionalPrice: int("additional_price").default(0).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_complement_substitutions_item_id").on(table.complementItemId),
]);
export type ComplementSubstitution = typeof complementSubstitutions.$inferSelect;
export type InsertComplementSubstitution = typeof complementSubstitutions.$inferInsert;

// ============ SSE CONNECTIVITY LOGS ============
export const sseConnectivityLogs = mysqlTable("sse_connectivity_logs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishment_id").notNull(),
  event: mysqlEnum("event", ["disconnected", "order_missed", "reconnected"]).notNull(),
  message: text("message").notNull(),
  orderId: int("order_id"),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sseConnLogs_establishment").on(table.establishmentId),
  index("idx_sseConnLogs_event").on(table.event),
  index("idx_sseConnLogs_createdAt").on(table.createdAt),
]);
export type SseConnectivityLog = typeof sseConnectivityLogs.$inferSelect;
export type InsertSseConnectivityLog = typeof sseConnectivityLogs.$inferInsert;
