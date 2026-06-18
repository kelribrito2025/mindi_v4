import {
  eq, desc, asc, and, like, notLike, sql, gte, lte, lt, gt, or, ne, inArray, isNull, isNotNull, getTableColumns } from "drizzle-orm";
import {
  drizzle } from "drizzle-orm/mysql2";
import {
  notifyNewOrder, notifyOrderUpdate, notifyOrderStatusUpdate, notifyPrintOrder, getPrinterConnectionCount } from "./_core/sse";
import {
  sendSMS, sendOrderReadySMS, isValidPhoneNumber } from "./_core/sms";
import {
  cashReminderSettings,
  cashReminderLogs,
  CashReminderSettings,
  CashReminderLog,
  InsertUser, users,
  userEstablishments,
  establishments, InsertEstablishment, Establishment,
  categories, InsertCategory, Category,
  products, InsertProduct, Product,
  complementGroups, InsertComplementGroup,
  complementItems, InsertComplementItem,
  orders, InsertOrder, Order,
  orderItems, InsertOrderItem,
  stockCategories, InsertStockCategory, StockCategory,
  stockItems, InsertStockItem, StockItem,
  stockMovements, InsertStockMovement, StockMovement,
  coupons, InsertCoupon, Coupon,
  reviews, InsertReview, Review,
  businessHours, InsertBusinessHours, BusinessHours,
  neighborhoodFees, InsertNeighborhoodFee, NeighborhoodFee,
  radiusFees, InsertRadiusFee, RadiusFee,
  loyaltyCards, InsertLoyaltyCard, LoyaltyCard,
  loyaltyStamps, InsertLoyaltyStamp, LoyaltyStamp,
  printers, InsertPrinter, Printer,
  printerSettings, InsertPrinterSettings, PrinterSettings,
  pushSubscriptions, InsertPushSubscription, PushSubscription,
  whatsappConfig, InsertWhatsappConfig, WhatsappConfig,
  printQueue, InsertPrintQueue, PrintQueue,
  ifoodConfig, InsertIfoodConfig, IfoodConfig,
  menuSessions, InsertMenuSession, MenuSession,
  menuViewsDaily, InsertMenuViewsDaily, MenuViewsDaily,
  menuViewsHourly, InsertMenuViewsHourly, MenuViewsHourly,
  smsBalance, InsertSmsBalance, SmsBalance,
  smsTransactions, InsertSmsTransaction, SmsTransaction,
  tableSpaces, InsertTableSpace, TableSpace,
  tables, InsertTable, Table,
  tabs, InsertTab, Tab,
  tabItems, InsertTabItem, TabItem,
  tabPayments, InsertTabPayment, TabPayment,
  scheduledCampaigns, InsertScheduledCampaign, ScheduledCampaign,
  pdvCustomers, InsertPdvCustomer, PdvCustomer,
  comboGroups, InsertComboGroup, ComboGroup,
  comboGroupItems, InsertComboGroupItem, ComboGroupItem,
  drivers, InsertDriver, Driver,
  deliveries, InsertDelivery, Delivery,
  expenseCategories, InsertExpenseCategory, ExpenseCategory,
  expenses, InsertExpense, Expense,
  monthlyGoals, InsertMonthlyGoal, MonthlyGoal,
  recurringExpenses, InsertRecurringExpense, RecurringExpense,
  recurringExpenseHistory, InsertRecurringExpenseHistoryEntry,
  financialGoals, InsertFinancialGoal, FinancialGoal,
  cashbackTransactions, InsertCashbackTransaction, CashbackTransaction,
  cashbackBalances, InsertCashbackBalance, CashbackBalance,
  printLogs, InsertPrintLog, PrintLog,
  botApiKeys, InsertBotApiKey, BotApiKey,
  feedbacks, InsertFeedback, Feedback,
  stories, InsertStory, Story,
  storyViews, InsertStoryView, StoryView,
  storyEvents, InsertStoryEvent, StoryEvent,
  aiImageCreditLogs, InsertAiImageCreditLog, AiImageCreditLog,
  collaborators, InsertCollaborator, Collaborator,
  orderCounters, InsertOrderCounter, OrderCounter,
  emailVerificationCodes, InsertEmailVerificationCode, EmailVerificationCode,
  whatsappConversations, InsertWhatsappConversation, WhatsappConversation,
  whatsappMessages, InsertWhatsappMessage, WhatsappMessage,
  publicChatMessages,
  cashSessions, InsertCashSession, CashSession,
  cashMovements, InsertCashMovement, CashMovement, InsertPublicChatMessage, PublicChatMessage,
  cashOperators, InsertCashOperator, CashOperator,
  weeklyGoals, InsertWeeklyGoal, WeeklyGoal,
  scheduledClosures, InsertScheduledClosure, ScheduledClosure,
  changelogVersions, InsertChangelogVersion, ChangelogVersion,
  changelogEntries, InsertChangelogEntry, ChangelogEntry,
  changelogLikes, InsertChangelogLike, ChangelogLike,
  chatShortcuts, InsertChatShortcut, ChatShortcut,
  orderLogs, InsertOrderLog, OrderLog,
  paytimeTransactions, InsertPaytimeTransaction, PaytimeTransaction,
  fixedSuggestions, InsertFixedSuggestion, FixedSuggestion,
  fixedSuggestionCategoryScopes, InsertFixedSuggestionCategoryScope, FixedSuggestionCategoryScope,
  linkedSuggestions, InsertLinkedSuggestion, LinkedSuggestion,
  linkedSuggestionItems, InsertLinkedSuggestionItem, LinkedSuggestionItem,
  userPreferences, InsertUserPreference, UserPreference,
  onboardingDrafts, InsertOnboardingDraft, OnboardingDraft,
  ifoodDisputes, InsertIfoodDispute, IfoodDispute
} from "../drizzle/schema";
import { logger } from "./_core/logger";
import { ENV } from "./_core/env";
import crypto from 'crypto';
import { hashApiKey } from "./_core/apiKeyHash";
import { hasAutomaticOrderNotifications } from "../shared/planLimits";

/**
 * Escapa caracteres especiais do LIKE (% e _) para evitar wildcards indesejados
 */
export function escapeLike(value: string): string {
  return value.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      logger.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ TIMEZONE HELPERS ============

/**
 * Busca o timezone IANA configurado para um estabelecimento.
 * Retorna 'America/Sao_Paulo' como fallback se não encontrado.
 */
// Cache de timezone por estabelecimento (TTL: 5 minutos) para evitar queries repetidas
const _tzCache = new Map<number, { tz: string; expires: number }>();
export async function getEstablishmentTimezone(establishmentId: number): Promise<string> {
  const cached = _tzCache.get(establishmentId);
  if (cached && cached.expires > Date.now()) return cached.tz;

  const db = await getDb();
  if (!db) return 'America/Sao_Paulo';
  const result = await db.select({ timezone: establishments.timezone })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);
  const tz = result[0]?.timezone || 'America/Sao_Paulo';
  _tzCache.set(establishmentId, { tz, expires: Date.now() + 5 * 60 * 1000 });
  return tz;
}

/**
 * Retorna a data/hora atual no timezone do estabelecimento como objeto Date local.
 * ATENÇÃO: o Date retornado tem os valores corretos em getFullYear/getMonth/getDate/getHours
 * mas internamente o JS pode tratá-lo como UTC. Use fmtLocalDate() para formatar.
 */
export function getLocalDate(timezone: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * Formata uma Date local como 'YYYY-MM-DD' sem usar toISOString() (que converte para UTC).
 */
export function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Formata uma Date local como 'YYYY-MM-DD HH:MM:SS' sem usar toISOString().
 */
export function fmtLocalDateTime(d: Date): string {
  return `${fmtLocalDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/**
 * Formata uma Date usando componentes UTC, útil para comparar timestamps
 * gravados em UTC sem deslocar o dia local do estabelecimento.
 */
function fmtUtcDateTime(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
}

/**
 * Converte uma data/hora civil no timezone do estabelecimento para UTC.
 * Ex.: 2026-06-01 00:00 em America/Fortaleza vira 2026-06-01 03:00 UTC.
 */
function zonedDateTimeToUtc(
  date: string,
  timeZone: string,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  const [year, month, day] = date.split('-').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  const getOffsetMs = (utcDate: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(utcDate);

    const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value || 0);
    const zonedAsUtc = Date.UTC(
      value('year'),
      value('month') - 1,
      value('day'),
      value('hour') % 24,
      value('minute'),
      value('second')
    );

    return zonedAsUtc - utcDate.getTime();
  };

  let utc = new Date(localAsUtc - getOffsetMs(new Date(localAsUtc)));
  utc = new Date(localAsUtc - getOffsetMs(utc));
  return utc;
}

// ============ SCHEDULE AVAILABILITY ============

/**
 * Verifica se um item agendado (categoria ou complemento) esta disponivel
 * no dia/horario atual. Suporta horarios que cruzam meia-noite (ex: 22:00 - 02:00).
 * @param item Objeto com availabilityType, availableDays e availableHours
 * @param currentDay Dia da semana atual (0=Dom...6=Sab)
 * @param currentTime Horario atual no formato "HH:MM"
 */
export function isScheduleAvailable(
  item: {
    availabilityType: string | null;
    availableDays: number[] | null;
    availableHours: { day: number; startTime: string; endTime: string }[] | null;
  },
  currentDay: number,
  currentTime: string
): boolean {
  // Se e "always" ou nao tem tipo definido, esta sempre disponivel
  if (!item.availabilityType || item.availabilityType === 'always') return true;

  // Se e "scheduled", verificar dias e horarios
  if (item.availabilityType === 'scheduled') {
    // Se nao tem dias configurados, considerar indisponivel
    if (!item.availableDays || item.availableDays.length === 0) return false;

    // Se tem horarios configurados, verificar com suporte a meia-noite
    if (item.availableHours && item.availableHours.length > 0) {
      // 1) Verificar horarios do dia atual
      if (item.availableDays.includes(currentDay)) {
        const dayHours = item.availableHours.filter(h => h.day === currentDay);
        for (const h of dayHours) {
          if (h.endTime < h.startTime) {
            // Horario cruza meia-noite (ex: 22:00 - 02:00)
            // Parte de hoje: currentTime >= startTime (22:00 ate 23:59)
            if (currentTime >= h.startTime) return true;
          } else {
            // Horario normal no mesmo dia (ex: 08:00 - 18:00)
            if (currentTime >= h.startTime && currentTime <= h.endTime) return true;
          }
        }
      }

      // 2) Verificar horarios do dia anterior que cruzam meia-noite
      const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1;
      if (item.availableDays.includes(yesterdayDay)) {
        const yesterdayHours = item.availableHours.filter(h => h.day === yesterdayDay);
        for (const h of yesterdayHours) {
          if (h.endTime < h.startTime) {
            // Horario de ontem cruza meia-noite
            // Parte de hoje: currentTime < endTime (00:00 ate 02:00)
            if (currentTime < h.endTime) return true;
          }
        }
      }

      return false;
    }

    // Se tem dias mas nao tem horarios configurados, considera o dia inteiro
    return item.availableDays.includes(currentDay);
  }

  return true;
}

// ============ PUBLIC MENU CACHE ============

interface PublicMenuCacheEntry {
  data: any;
  expiresAt: number;
}

const publicMenuCache = new Map<string, PublicMenuCacheEntry>();
const PUBLIC_MENU_CACHE_TTL = 30_000; // 30 seconds

export function getPublicMenuFromCache(slug: string): any | null {
  const entry = publicMenuCache.get(slug);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  // Limpar entrada expirada
  if (entry) publicMenuCache.delete(slug);
  return null;
}

export function setPublicMenuCache(slug: string, data: any): void {
  publicMenuCache.set(slug, {
    data,
    expiresAt: Date.now() + PUBLIC_MENU_CACHE_TTL,
  });
}

export function invalidatePublicMenuCache(establishmentId?: number): void {
  if (!establishmentId) {
    publicMenuCache.clear();
    return;
  }
  // Invalidar todas as entradas (nao sabemos o slug a partir do id)
  // Para cache pequeno isso e aceitavel
  publicMenuCache.clear();
}

// ============ HELPER FUNCTIONS ============

/**
 * Gera um código único para cupom de fidelidade
 * Formato: FID + 5 caracteres alfanuméricos (total 8 chars)
 * Verifica unicidade no banco antes de retornar
 * @param establishmentId ID do estabelecimento
 * @param maxAttempts Número máximo de tentativas (padrão: 10)
 */
export async function generateUniqueLoyaltyCouponCode(establishmentId: number, maxAttempts = 10): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 0, 1 para evitar confusão

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Gerar código aleatório
    let shortCode = '';
    for (let i = 0; i < 5; i++) {
      shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const couponCode = `FID${shortCode}`;

    // Verificar se já existe no banco (globalmente, não apenas no estabelecimento)
    const existing = await db.select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, couponCode))
      .limit(1);

    if (existing.length === 0) {
      // Código único encontrado
      return couponCode;
    }

    logger.info(`[Fidelidade] Código ${couponCode} já existe, tentando novamente (tentativa ${attempt + 1}/${maxAttempts})`);
  }

  // Se todas as tentativas falharem, usar timestamp como fallback
  const fallbackCode = `FID${Date.now().toString(36).slice(-5).toUpperCase()}`;
  logger.warn(`[Fidelidade] Máximo de tentativas atingido, usando código fallback: ${fallbackCode}`);
  return fallbackCode;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    logger.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get users by email: database not available");
    return [];
  }

  return await db.select().from(users).where(eq(users.email, email));
}

export async function createUserWithPassword(data: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: 'email',
    lastSignedIn: new Date(),
  });

  return getUserByEmail(data.email);
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get user by googleId: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithGoogle(data: { name: string; email: string; googleId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `google_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    googleId: data.googleId,
    loginMethod: 'google',
    lastSignedIn: new Date(),
  });

  return getUserByEmail(data.email);
}

export async function linkGoogleId(userId: number, googleId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ googleId, loginMethod: 'google' }).where(eq(users.id, userId));
}

export async function unlinkGoogleId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ googleId: null }).where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ============ PASSWORD RESET FUNCTIONS ============
export async function setPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    resetToken: token,
    resetTokenExpiresAt: expiresAt,
  }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    passwordHash,
    resetToken: null,
    resetTokenExpiresAt: null,
  }).where(eq(users.id, userId));
}

// ============ ESTABLISHMENT FUNCTIONS ============
export async function getEstablishmentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userResult = await db.select({
    activeEstablishmentId: users.activeEstablishmentId,
    defaultEstablishmentId: users.defaultEstablishmentId,
  }).from(users).where(eq(users.id, userId)).limit(1);

  const preferredEstablishmentId = userResult[0]?.activeEstablishmentId ?? userResult[0]?.defaultEstablishmentId ?? null;

  if (preferredEstablishmentId) {
    const ownership = await db.select({ id: userEstablishments.id })
      .from(userEstablishments)
      .where(and(
        eq(userEstablishments.userId, userId),
        eq(userEstablishments.establishmentId, preferredEstablishmentId)
      ))
      .limit(1);

    if (ownership.length > 0) {
      const activeResult = await db.select()
        .from(establishments)
        .where(eq(establishments.id, preferredEstablishmentId))
        .limit(1);
      if (activeResult.length > 0) return activeResult[0];
    }
  }

  const linkedResult = await db.select({ establishmentId: userEstablishments.establishmentId })
    .from(userEstablishments)
    .where(eq(userEstablishments.userId, userId))
    .orderBy(userEstablishments.createdAt)
    .limit(1);

  if (linkedResult.length > 0) {
    const result = await db.select()
      .from(establishments)
      .where(eq(establishments.id, linkedResult[0].establishmentId))
      .limit(1);
    if (result.length > 0) return result[0];
  }

  const legacyResult = await db.select()
    .from(establishments)
    .where(eq(establishments.userId, userId))
    .orderBy(asc(establishments.id))
    .limit(1);
  return legacyResult.length > 0 ? legacyResult[0] : null;
}

export async function getUserEstablishments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const linkedRows = await db.select({
    id: userEstablishments.id,
    establishmentId: userEstablishments.establishmentId,
    role: userEstablishments.role,
    createdAt: userEstablishments.createdAt,
    name: establishments.name,
    logo: establishments.logo,
    menuSlug: establishments.menuSlug,
    isOpen: establishments.isOpen,
  })
    .from(userEstablishments)
    .innerJoin(establishments, eq(userEstablishments.establishmentId, establishments.id))
    .where(eq(userEstablishments.userId, userId))
    .orderBy(userEstablishments.createdAt);

  if (linkedRows.length > 0) return linkedRows;

  const legacyRows = await db.select({
    establishmentId: establishments.id,
    name: establishments.name,
    logo: establishments.logo,
    menuSlug: establishments.menuSlug,
    isOpen: establishments.isOpen,
  })
    .from(establishments)
    .where(eq(establishments.userId, userId))
    .orderBy(asc(establishments.id));

  return legacyRows.map((row) => ({
    id: null,
    role: "owner" as const,
    createdAt: null,
    ...row,
  }));
}

async function assertUserCanAccessEstablishment(userId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ownership = await db.select({ id: userEstablishments.id })
    .from(userEstablishments)
    .where(and(
      eq(userEstablishments.userId, userId),
      eq(userEstablishments.establishmentId, establishmentId)
    ))
    .limit(1);

  if (ownership.length > 0) return true;

  const legacyOwner = await db.select({ id: establishments.id })
    .from(establishments)
    .where(and(eq(establishments.id, establishmentId), eq(establishments.userId, userId)))
    .limit(1);

  if (legacyOwner.length === 0) return false;

  await addUserEstablishment(userId, establishmentId, "owner");
  return true;
}

export async function setActiveEstablishment(userId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const canAccess = await assertUserCanAccessEstablishment(userId, establishmentId);
  if (!canAccess) {
    throw new Error("Estabelecimento não encontrado para este utilizador.");
  }

  await db.update(users)
    .set({ activeEstablishmentId: establishmentId })
    .where(eq(users.id, userId));
}

export async function clearActiveEstablishment(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ activeEstablishmentId: null })
    .where(eq(users.id, userId));
}

export async function countUserEstablishments(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const linkedCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(userEstablishments)
    .where(eq(userEstablishments.userId, userId));

  const linkedTotal = Number(linkedCount[0]?.count ?? 0);
  if (linkedTotal > 0) return linkedTotal;

  const legacyCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(establishments)
    .where(eq(establishments.userId, userId));

  return Number(legacyCount[0]?.count ?? 0);
}

export async function addUserEstablishment(userId: number, establishmentId: number, role: "owner" | "staff" = "owner") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select({ id: userEstablishments.id })
    .from(userEstablishments)
    .where(and(
      eq(userEstablishments.userId, userId),
      eq(userEstablishments.establishmentId, establishmentId)
    ))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const result = await db.insert(userEstablishments).values({ userId, establishmentId, role });
  return result[0]?.insertId;
}

export async function setDefaultEstablishment(userId: number, establishmentId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (establishmentId !== null) {
    const canAccess = await assertUserCanAccessEstablishment(userId, establishmentId);
    if (!canAccess) {
      throw new Error("Estabelecimento não encontrado para este utilizador.");
    }
  }

  await db.update(users)
    .set({ defaultEstablishmentId: establishmentId })
    .where(eq(users.id, userId));
}

export async function getDefaultEstablishmentId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({ defaultEstablishmentId: users.defaultEstablishmentId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0]?.defaultEstablishmentId ?? null;
}

export async function getEstablishmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(establishments).where(eq(establishments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Busca um estabelecimento pelo paytimeEstablishmentId (ID do sub-EC na Paytime).
 * Usado pelo webhook updated-establishment-status para mapear o EC Paytime ao local.
 */
export async function getEstablishmentByPaytimeId(paytimeId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(establishments)
    .where(eq(establishments.paytimeEstablishmentId, paytimeId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createEstablishment(data: InsertEstablishment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gerar ID sequencial baixo (MAX(id) + 1) em vez de depender do auto_increment do TiDB
  // que gera IDs muito altos (30001, 60018, 90001, etc.)
  const maxIdResult = await db.select({ maxId: sql<number>`COALESCE(MAX(${establishments.id}), 0)` })
    .from(establishments);
  const nextId = (maxIdResult[0]?.maxId ?? 0) + 1;

  // Limpar dados residuais/órfãos que possam existir para este ID
  // Cada delete tem try/catch individual para que uma falha não bloqueie os outros
  const cleanupOps = [
    async () => {
      // Limpar complementItems via products que pertencem a este establishment
      await db.execute(sql`DELETE ci FROM \`complementItems\` ci INNER JOIN \`complementGroups\` cg ON ci.\`groupId\` = cg.\`id\` INNER JOIN \`products\` p ON cg.\`productId\` = p.\`id\` WHERE p.\`establishmentId\` = ${nextId}`);
    },
    async () => {
      // Limpar complementGroups via products
      await db.execute(sql`DELETE cg FROM \`complementGroups\` cg INNER JOIN \`products\` p ON cg.\`productId\` = p.\`id\` WHERE p.\`establishmentId\` = ${nextId}`);
    },
    async () => await db.delete(products).where(eq(products.establishmentId, nextId)),
    async () => await db.delete(categories).where(eq(categories.establishmentId, nextId)),
    async () => await db.delete(businessHours).where(eq(businessHours.establishmentId, nextId)),
    async () => {
      await db.execute(sql`DELETE FROM \`orderItems\` WHERE \`orderId\` IN (SELECT \`id\` FROM \`orders\` WHERE \`establishmentId\` = ${nextId})`);
    },
    async () => await db.delete(orders).where(eq(orders.establishmentId, nextId)),
  ];

  for (const op of cleanupOps) {
    try {
      await op();
    } catch (cleanupError) {
      logger.warn('[createEstablishment] Erro ao limpar dados residuais (não bloqueante):', cleanupError);
    }
  }

  const result = await db.insert(establishments).values({ ...data, id: nextId });
  return nextId;
}

export async function updateEstablishment(id: number, data: Partial<InsertEstablishment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(establishments).set(data).where(eq(establishments.id, id));
}

export async function updateEstablishmentFees(id: number, data: Record<string, string | null>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(establishments).set(data as any).where(eq(establishments.id, id));
}
/**
 * Ativa um plano pago para o estabelecimento, removendo o estado de trial.
 * Chamado após confirmação de pagamento via Stripe.
 */
export async function activatePlan(
  establishmentId: number,
  planType: 'lite' | 'basic' | 'pro',
  options?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    billingPeriod?: 'monthly' | 'annual';
    planExpiresAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    planType,
    trialStartDate: null,
    planActivatedAt: new Date(),
    ...(options?.stripeCustomerId && { stripeCustomerId: options.stripeCustomerId }),
    ...(options?.stripeSubscriptionId && { stripeSubscriptionId: options.stripeSubscriptionId }),
    ...(options?.billingPeriod && { billingPeriod: options.billingPeriod }),
    ...(options?.planExpiresAt && { planExpiresAt: options.planExpiresAt }),
  }).where(eq(establishments.id, establishmentId));
}

export async function deactivatePlan(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    planType: 'trial',
    stripeSubscriptionId: null,
    billingPeriod: null,
    planExpiresAt: null,
  }).where(eq(establishments.id, establishmentId));
}

export async function updateSubscriptionId(establishmentId: number, stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    stripeSubscriptionId,
  }).where(eq(establishments.id, establishmentId));
}

export async function getEstablishmentByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(establishments).where(eq(establishments.stripeCustomerId, stripeCustomerId)).limit(1);
  return result[0] || null;
}

export async function toggleEstablishmentOpen(id: number, isOpen: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (isOpen) {
    // Abrir: limpar fechamento manual, marcar abertura manual
    await db.update(establishments).set({
      isOpen: true,
      manuallyClosed: false,
      manuallyClosedAt: null,
      manuallyOpened: true,
      manuallyOpenedAt: new Date(),
    }).where(eq(establishments.id, id));
  } else {
    // Fechar: marcar fechamento manual, limpar abertura manual
    await db.update(establishments).set({
      isOpen: false,
      manuallyClosed: true,
      manuallyClosedAt: new Date(),
      manuallyOpened: false,
      manuallyOpenedAt: null,
    }).where(eq(establishments.id, id));
  }
}

export async function savePublicNote(id: number, note: string, noteStyle?: string, validityDays?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const days = validityDays || 7;
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await db.update(establishments).set({
    publicNote: note,
    publicNoteCreatedAt: now,
    noteStyle: noteStyle || "default",
    noteExpiresAt: expiresAt,
  }).where(eq(establishments.id, id));
}

export async function removePublicNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    publicNote: null,
    publicNoteCreatedAt: null,
  }).where(eq(establishments.id, id));
}

export async function getEstablishmentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(establishments).where(eq(establishments.menuSlug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function isSlugAvailable(slug: string, excludeEstablishmentId?: number) {
  const db = await getDb();
  if (!db) return false;

  const conditions = [eq(establishments.menuSlug, slug)];
  if (excludeEstablishmentId) {
    conditions.push(sql`${establishments.id} != ${excludeEstablishmentId}`);
  }

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(establishments)
    .where(and(...conditions));

  return (result[0]?.count ?? 0) === 0;
}

export async function getPublicMenuData(slug: string) {
  // Verificar cache primeiro
  const cached = getPublicMenuFromCache(slug);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return null;

  // Get establishment by slug
  const establishment = await getEstablishmentBySlug(slug);
  if (!establishment) return null;

  // Verificar se o trial expirou - se sim, bloquear o menu público
  if (establishment.planType === 'trial' && establishment.trialStartDate) {
    const now = new Date();
    const trialStart = new Date(establishment.trialStartDate);
    const trialEnd = new Date(trialStart.getTime() + establishment.trialDays * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    if (daysRemaining === 0) {
      // Trial expirado - retornar dados mínimos com flag de bloqueio
      return {
        establishment: {
          ...establishment,
          trialBlocked: true,
        },
        categories: [],
        products: [],
        trialBlocked: true,
      };
    }
  }

  // Get categories (always from published version for public menu)
  const rawMenuCategories = await db.select().from(categories)
    .where(and(
      eq(categories.establishmentId, establishment.id),
      eq(categories.isActive, true),
      eq(categories.version, 'published')
    ))
    .orderBy(asc(categories.sortOrder));
  // Safeguard: ensure only published categories
  const menuCategories = rawMenuCategories.filter(c => c.version === 'published');

  // Get active products (always from published version for public menu)
  const rawMenuProducts = await db.select().from(products)
    .where(and(
      eq(products.establishmentId, establishment.id),
      eq(products.status, 'active'),
      eq(products.version, 'published')
    ))
    .orderBy(asc(products.sortOrder));
  // Safeguard: ensure only published products
  const menuProducts = rawMenuProducts.filter((p: any) => p.version === 'published');

  // Aplicar limite do plano: apenas os primeiros N produtos ativos aparecem no menu público
  // Ordenar por categoria (sortOrder) primeiro, depois por sortOrder do produto dentro da categoria
  const { getPlanLimits } = await import('../shared/planLimits');
  const planLimits = getPlanLimits(establishment.planType);

  let limitedMenuProducts = menuProducts;
  if (planLimits.maxProducts !== null) {
    // Criar mapa de sortOrder das categorias
    const catSortMap = new Map<number, number>();
    menuCategories.forEach((cat) => catSortMap.set(cat.id, cat.sortOrder));

    // Ordenar produtos pela ordem das categorias, depois pelo sortOrder do produto
    const sortedByCategory = [...menuProducts].sort((a, b) => {
      const catSortA = catSortMap.get(a.categoryId ?? 0) ?? 999999;
      const catSortB = catSortMap.get(b.categoryId ?? 0) ?? 999999;
      if (catSortA !== catSortB) return catSortA - catSortB;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    // Pegar os primeiros N produtos seguindo a ordem das categorias
    const allowedIds = new Set(sortedByCategory.slice(0, planLimits.maxProducts).map(p => p.id));
    limitedMenuProducts = menuProducts.filter(p => allowedIds.has(p.id));
  }

  const tz = establishment.timezone || 'America/Sao_Paulo';
  const localTime = getLocalDate(tz);
  const currentDay = localTime.getDay();
  const currentTime = localTime.toTimeString().slice(0, 5);

  // Para produtos publicados com preço zerado, calcular o menor preço de complemento pago.
  // O menu público não carrega os complementos na listagem, por isso o campo é enriquecido aqui.
  const zeroPriceProductIds = limitedMenuProducts
    .filter((product) => Number(product.price) === 0)
    .map((product) => product.id);
  const minComplementPriceByProductId = new Map<number, string>();

  if (zeroPriceProductIds.length > 0) {
    const complementPriceRows = await db
      .select({
        productId: complementGroups.productId,
        price: complementItems.price,
        priceMode: complementItems.priceMode,
        freeOnDelivery: complementItems.freeOnDelivery,
        freeOnPickup: complementItems.freeOnPickup,
        freeOnDineIn: complementItems.freeOnDineIn,
        hasStock: complementItems.hasStock,
        stockQuantity: complementItems.stockQuantity,
        availabilityType: complementItems.availabilityType,
        availableDays: complementItems.availableDays,
        availableHours: complementItems.availableHours,
      })
      .from(complementGroups)
      .innerJoin(complementItems, eq(complementItems.groupId, complementGroups.id))
      .where(and(
        inArray(complementGroups.productId, zeroPriceProductIds),
        eq(complementGroups.version, 'published'),
        eq(complementItems.version, 'published'),
        eq(complementGroups.groupType, 'complement'),
        eq(complementGroups.isActive, true),
        eq(complementItems.isActive, true),
        sql`${complementItems.price} > 0`
      ));

    complementPriceRows.forEach((row) => {
      if (row.hasStock && row.stockQuantity !== null && row.stockQuantity <= 0) return;
      if (!isScheduleAvailable(row, currentDay, currentTime)) return;

      const isGloballyFree =
        row.priceMode === 'free' &&
        !row.freeOnDelivery &&
        !row.freeOnPickup &&
        !row.freeOnDineIn;
      if (isGloballyFree) return;

      const price = Number(row.price);
      if (!Number.isFinite(price) || price <= 0) return;

      const currentMin = minComplementPriceByProductId.get(row.productId);
      if (currentMin === undefined || price < Number(currentMin)) {
        minComplementPriceByProductId.set(row.productId, price.toFixed(2));
      }
    });
  }

  // Check stock for products with hasStock enabled
  const productsWithStockInfo = await Promise.all(
    limitedMenuProducts.map(async (product) => {
      const minComplementPrice = minComplementPriceByProductId.get(product.id) ?? null;

      if (product.hasStock) {
        // Check linked stock item
        const stockItem = await db.select()
          .from(stockItems)
          .where(eq(stockItems.linkedProductId, product.id))
          .limit(1);

        const linkedStock = stockItem.length > 0 ? stockItem[0] : null;
        const availableQty = linkedStock
          ? Number(linkedStock.currentQuantity)
          : (product.stockQuantity !== null ? product.stockQuantity : null);
        const isOutOfStock = availableQty !== null && availableQty <= 0;

        return {
          ...product,
          minComplementPrice,
          outOfStock: isOutOfStock,
          availableStock: availableQty,
        };
      }
      return {
        ...product,
        minComplementPrice,
        outOfStock: false,
        availableStock: null, // null = sem controle de estoque, quantidade ilimitada
      };
    })
  );

  // Calcular status de abertura no servidor (fonte de verdade)
  // Isso garante que frontend e backend usem a mesma lógica
  const storeStatus = await getEstablishmentOpenStatus(establishment.id);

  // Filtrar categorias agendadas fora do horario
  const availableCategories = menuCategories.filter(cat =>
    isScheduleAvailable(
      {
        availabilityType: cat.availabilityType,
        availableDays: cat.availableDays as number[] | null,
        availableHours: cat.availableHours as { day: number; startTime: string; endTime: string }[] | null,
      },
      currentDay,
      currentTime
    )
  );

  // Pagamento online aparece se SubPaytime estiver ativo OU se KYC estiver aprovado
  // Mantém os flags internos como pré-requisito e apenas controla a exposição no menu público
  const kycApproved = establishment.paytimeKycStatus === 'approved';
  const subPaytimeActive = establishment.paytimeSubPaytimeActive === true;
  const onlinePaymentAllowed = subPaytimeActive || kycApproved;

  const result = {
    establishment: {
      ...establishment,
      // Sobrescrever com status calculado pelo servidor
      computedIsOpen: storeStatus.isOpen,
      computedManuallyClosed: storeStatus.manuallyClosed,
      computedScheduledClosure: storeStatus.scheduledClosure ?? false,
      computedScheduledClosureReason: storeStatus.scheduledClosureReason ?? null,
      computedNextOpeningTime: storeStatus.nextOpeningTime ?? null,
      // Pagamento online só aparece se permitido pela regra pública E flags ativos
      paytimeEnabled: establishment.paytimeEnabled && onlinePaymentAllowed,
      paytimeCardEnabled: establishment.paytimeCardEnabled && onlinePaymentAllowed,
      onlinePaymentEnabled: establishment.onlinePaymentEnabled && onlinePaymentAllowed,
    },
    categories: availableCategories,
    products: productsWithStockInfo,
    trialBlocked: false,
  };

  // Armazenar no cache
  setPublicMenuCache(slug, result);

  return result;
}

// ============ ACCOUNT & SECURITY FUNCTIONS ============

export async function getEstablishmentAccountData(establishmentId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    id: establishments.id,
    name: establishments.name,
    email: establishments.email,
    cnpj: establishments.cnpj,
    responsibleName: establishments.responsibleName,
    responsiblePhone: establishments.responsiblePhone,
    twoFactorEnabled: establishments.twoFactorEnabled,
    twoFactorEmail: establishments.twoFactorEmail,
    ownerDisplayName: establishments.ownerDisplayName,
  }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);

  if (result.length === 0) return null;
  const row = result[0];
  // Se responsibleName estiver vazio, usar ownerDisplayName como fallback
  return {
    ...row,
    responsibleName: row.responsibleName || row.ownerDisplayName || null,
  };
}

export async function updateEstablishmentAccountData(
  establishmentId: number,
  data: {
    name?: string;
    email?: string | null;
    cnpj?: string | null;
    responsibleName?: string | null;
    responsiblePhone?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set(data).where(eq(establishments.id, establishmentId));
}

export async function updateEstablishmentAccountDataAndUserEmail(
  establishmentId: number,
  data: {
    name?: string;
    email?: string | null;
    cnpj?: string | null;
    responsibleName?: string | null;
    responsiblePhone?: string | null;
  },
  userId: number,
  email: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    await tx.update(establishments).set(data).where(eq(establishments.id, establishmentId));
    await tx.update(users).set({ email }).where(eq(users.id, userId));
  });
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateUserName(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function updateUserEmail(userId: number, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ email }).where(eq(users.id, userId));
}

export async function updateTwoFactorSettings(
  establishmentId: number,
  enabled: boolean,
  email?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: { twoFactorEnabled: boolean; twoFactorEmail?: string | null } = {
    twoFactorEnabled: enabled,
  };

  if (email !== undefined) {
    updateData.twoFactorEmail = email || null;
  }

  await db.update(establishments).set(updateData).where(eq(establishments.id, establishmentId));
}

// ============ CATEGORY FUNCTIONS ============
export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCategoriesByEstablishment(establishmentId: number, version: 'draft' | 'published' = 'draft') {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(categories)
    .where(and(
      eq(categories.establishmentId, establishmentId),
      eq(categories.version, version)
    ))
    .orderBy(asc(categories.sortOrder));

  // Safeguard: filter out any categories that don't match the requested version
  // This protects against stale Drizzle prepared statements during hot reloads
  const filtered = result.filter(c => c.version === version);
  if (filtered.length !== result.length) {
    logger.warn(`[getCategoriesByEstablishment] Version mismatch detected! Requested: ${version}, got ${result.length} rows, ${result.length - filtered.length} had wrong version. Recreating DB connection.`);
    // Force recreate the DB connection to fix stale state
    _db = null;
  }

  return filtered;
}

/**
 * Lightweight query: returns only id, categoryId, sortOrder, status for plan limit calculation.
 * Avoids the heavy complementCount subquery and all other expensive fields.
 */
export async function getActiveProductIdsForPlanLimit(establishmentId: number, version: 'draft' | 'published') {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    sortOrder: products.sortOrder,
    status: products.status,
  }).from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.version, version)
    ))
    .orderBy(asc(products.sortOrder));
  return result;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar o maior sortOrder existente para este estabelecimento (only draft)
  const existingCategories = await db.select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(and(
      eq(categories.establishmentId, data.establishmentId),
      eq(categories.version, 'draft')
    ))
    .orderBy(desc(categories.sortOrder))
    .limit(1);

  const maxSortOrder = existingCategories.length > 0 ? existingCategories[0].sortOrder : -1;
  const newSortOrder = maxSortOrder + 1;

  const result = await db.insert(categories).values({
    ...data,
    version: 'draft',
    sortOrder: newSortOrder,
  });
  return result[0].insertId;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(eq(categories.id, id));
}

export async function duplicateCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar categoria original
  const [original] = await db.select().from(categories).where(eq(categories.id, id));
  if (!original) throw new Error("Category not found");

  // Buscar maior sortOrder
  const existingCategories = await db.select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.establishmentId, original.establishmentId))
    .orderBy(desc(categories.sortOrder))
    .limit(1);
  const maxSortOrder = existingCategories.length > 0 ? existingCategories[0].sortOrder : -1;

  // Criar nova categoria (always as draft)
  const result = await db.insert(categories).values({
    name: `${original.name} (cópia)`,
    establishmentId: original.establishmentId,
    description: original.description,
    isActive: original.isActive,
    sortOrder: maxSortOrder + 1,
    version: 'draft',
  });
  const newCategoryId = result[0].insertId;

  // Duplicar produtos da categoria
  const categoryProducts = await db.select().from(products)
    .where(eq(products.categoryId, id))
    .orderBy(asc(products.sortOrder));

  for (const product of categoryProducts) {
    const { id: productId, createdAt, updatedAt, publishedSourceId, ...productData } = product;
    const newProductResult = await db.insert(products).values({
      ...productData,
      categoryId: newCategoryId,
      version: 'draft',
      publishedSourceId: null,
    });
    const newProductId = newProductResult[0].insertId;

    // Duplicar complementos do produto (always as draft)
    const groups = await getComplementGroupsByProduct(productId);
    for (const group of groups) {
      const { id: groupId, productId: _, createdAt: __, items, ...groupData } = group;
      const newGroupResult = await db.insert(complementGroups).values({
        ...groupData,
        productId: newProductId,
        version: 'draft',
      });
      const newGroupId = newGroupResult[0].insertId;

      for (const item of (items || [])) {
        const { id: itemId, groupId: _, createdAt: __, ...itemData } = item;
        await db.insert(complementItems).values({
          ...itemData,
          groupId: newGroupId,
          version: 'draft',
        });
      }
    }
  }

  return newCategoryId;
}

export async function reorderCategories(categoryOrders: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const { id, sortOrder } of categoryOrders) {
    await db.update(categories).set({ sortOrder }).where(eq(categories.id, id));
  }
}

export async function reorderProducts(productOrders: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const { id, sortOrder } of productOrders) {
    await db.update(products).set({ sortOrder }).where(eq(products.id, id));
  }
}

// ============ PRODUCT FUNCTIONS ============
export async function getProductsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    categoryId?: number;
    status?: "active" | "paused" | "archived";
    hasStock?: boolean;
    orderBy?: "name" | "price" | "salesCount";
    orderDir?: "asc" | "desc";
    limit?: number;
    offset?: number;
    version?: 'draft' | 'published';
  }
) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };

  const conditions = [
    eq(products.establishmentId, establishmentId),
    eq(products.version, filters?.version || 'draft'),
  ];

  if (filters?.search) {
    // Case-insensitive search using LOWER()
    conditions.push(sql`LOWER(${products.name}) LIKE LOWER(${`%${escapeLike(filters.search)}%`})`);
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(products.status, filters.status));
  }
  if (filters?.hasStock !== undefined) {
    conditions.push(eq(products.hasStock, filters.hasStock));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Build order by
  let orderByClause;
  const dir = filters?.orderDir === "desc" ? desc : asc;
  switch (filters?.orderBy) {
    case "name":
      orderByClause = dir(products.name);
      break;
    case "price":
      orderByClause = dir(products.price);
      break;
    case "salesCount":
      orderByClause = desc(products.salesCount);
      break;
    default:
      orderByClause = asc(products.sortOrder);
  }

  let query = db.select({
    ...getTableColumns(products),
  }).from(products).where(whereClause).orderBy(orderByClause);
  if (filters?.limit) {
    query = query.limit(filters.limit) as typeof query;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as typeof query;
  }
  const rawProductList = await query;
  // Batch query: get complement counts for all products in one query (replaces N correlated subqueries)
  let complementCountMap = new Map<number, number>();
  if (rawProductList.length > 0) {
    const productIds = rawProductList.map((p: any) => p.id);
    const counts = await db.select({
      productId: complementGroups.productId,
      count: sql<number>`COUNT(${complementItems.id})`,
    })
      .from(complementGroups)
      .leftJoin(complementItems, eq(complementItems.groupId, complementGroups.id))
      .where(inArray(complementGroups.productId, productIds))
      .groupBy(complementGroups.productId);
    for (const row of counts) {
      complementCountMap.set(row.productId, Number(row.count));
    }
  }
  const productList = rawProductList.map((p: any) => ({
    ...p,
    complementCount: complementCountMap.get(p.id) ?? 0,
  }));

  // Safeguard: filter out any products that don't match the requested version
  // This protects against stale Drizzle prepared statements during hot reloads
  const requestedVersion = filters?.version || 'draft';
  const filteredProducts = productList.filter((p: any) => p.version === requestedVersion);
  if (filteredProducts.length !== productList.length) {
    logger.warn(`[getProductsByEstablishment] Version mismatch detected! Requested: ${requestedVersion}, got ${productList.length} rows, ${productList.length - filteredProducts.length} had wrong version. Recreating DB connection.`);
    _db = null;
  }

  return { products: filteredProducts, total: filteredProducts.length };
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDraftProductByPublishedSourceId(publishedId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({ id: products.id, stockQuantity: products.stockQuantity })
    .from(products)
    .where(and(
      eq(products.publishedSourceId, publishedId),
      eq(products.version, 'draft'),
      eq(products.establishmentId, establishmentId),
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values({ ...data, version: 'draft' });
  return result[0].insertId;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(products).where(eq(products.id, id));
}

export async function toggleProductStatus(id: number, status: "active" | "paused") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(products).set({ status }).where(eq(products.id, id));
}

export async function duplicateProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const original = await getProductById(id);
  if (!original) throw new Error("Product not found");

  const { id: _, createdAt, updatedAt, publishedSourceId, ...productData } = original;
  const newProduct = {
    ...productData,
    name: `${original.name} (cópia)`,
    version: 'draft' as const,
    publishedSourceId: null,
  };

  const result = await db.insert(products).values(newProduct);
  const newProductId = result[0].insertId;

  // Duplicar grupos de complementos (always as draft)
  const groups = await getComplementGroupsByProduct(id);
  for (const group of groups) {
    const { id: groupId, productId: _, createdAt: __, ...groupData } = group;
    const newGroupResult = await db.insert(complementGroups).values({
      ...groupData,
      productId: newProductId,
      version: 'draft',
    });
    const newGroupId = newGroupResult[0].insertId;

    // Duplicar itens do grupo
    const items = await getComplementItemsByGroup(groupId);
    for (const item of items) {
      const { id: itemId, groupId: _, createdAt: __, ...itemData } = item;
      await db.insert(complementItems).values({
        ...itemData,
        groupId: newGroupId,
        version: 'draft',
      });
    }
  }

  return newProductId;
}

export async function getLowStockProducts(establishmentId: number, threshold: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.hasStock, true),
      eq(products.status, 'active'),
      sql`${products.stockQuantity} IS NOT NULL AND ${products.stockQuantity} <= 0`
    ))
    .orderBy(asc(products.stockQuantity));
}

// ============ STOCK (BASED ON PRODUCTS) ============

/**
 * Lista produtos com controle de estoque ativado, com filtros opcionais.
 * Retorna dados do produto + nome da categoria.
 */
export async function getStockProductsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    categoryId?: number;
    status?: "ok" | "low" | "critical" | "out_of_stock";
    page?: number;
    perPage?: number;
  },
  thresholds?: { low: number; critical: number; out: number }
) {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page: 1, perPage: 25, totalPages: 0 };

  const conditions: any[] = [
    eq(products.establishmentId, establishmentId),
    eq(products.hasStock, true),
    eq(products.status, 'active'),
    eq(products.version, 'draft'),
  ];

  if (filters?.search) {
    conditions.push(like(products.name, `%${escapeLike(filters.search)}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  const rows = await db.select({
    id: products.id,
    name: products.name,
    categoryId: products.categoryId,
    categoryName: categories.name,
    stockQuantity: products.stockQuantity,
    images: products.images,
    price: products.price,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(products.name));

  // Calcular status baseado na quantidade (usando thresholds personalizáveis)
  const tLow = thresholds?.low ?? 10;
  const tCritical = thresholds?.critical ?? 3;
  const tOut = thresholds?.out ?? 0;
  const result = rows.map(row => {
    const qty = row.stockQuantity ?? 0;
    let status: string;
    if (qty <= tOut) status = "out_of_stock";
    else if (qty <= tCritical) status = "critical";
    else if (qty <= tLow) status = "low";
    else status = "ok";

    return { ...row, status };
  });

  // Filtrar por status se necessário
  const filtered = filters?.status
    ? result.filter(r => r.status === filters.status)
    : result;

  // Paginação
  const page = filters?.page ?? 1;
  const perPage = filters?.perPage ?? 25;
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;
  const items = filtered.slice(offset, offset + perPage);

  return { items, total, page, perPage, totalPages };
}

/**
 * Resumo do estoque baseado em products com hasStock = true
 */
export async function getStockProductsSummary(
  establishmentId: number,
  thresholds?: { low: number; critical: number; out: number }
) {
  const db = await getDb();
  if (!db) return { total: 0, ok: 0, low: 0, critical: 0, outOfStock: 0 };

  const tLow = thresholds?.low ?? 10;
  const tCritical = thresholds?.critical ?? 3;
  const tOut = thresholds?.out ?? 0;

  const rows = await db.select({ stockQuantity: products.stockQuantity })
    .from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.hasStock, true),
      eq(products.status, 'active'),
      eq(products.version, 'draft'),
    ));

  let ok = 0, low = 0, critical = 0, outOfStock = 0;
  for (const row of rows) {
    const qty = row.stockQuantity ?? 0;
    if (qty <= tOut) outOfStock++;
    else if (qty <= tCritical) critical++;
    else if (qty <= tLow) low++;
    else ok++;
  }

  return { total: rows.length, ok, low, critical, outOfStock };
}

/**
 * Contagem de produtos sem estoque (para badge)
 */
export async function getProductsOutOfStockCount(establishmentId: number): Promise<{ count: number }> {
  const db = await getDb();
  if (!db) return { count: 0 };
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.hasStock, true),
      eq(products.status, 'active'),
      eq(products.version, 'draft'),
      sql`${products.stockQuantity} IS NOT NULL AND ${products.stockQuantity} <= 0`
    ));
  return { count: Number(result[0]?.count || 0) };
}

// ============ COMPLEMENT FUNCTIONS ============
export async function getComplementItemById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [item] = await db.select().from(complementItems)
    .where(eq(complementItems.id, id))
    .limit(1);
  return item || null;
}

export async function getComplementItemsByIds(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];

  return db.select({
    id: complementItems.id,
    name: complementItems.name,
    price: complementItems.price,
    priceMode: complementItems.priceMode,
    freeOnDelivery: complementItems.freeOnDelivery,
    freeOnPickup: complementItems.freeOnPickup,
    freeOnDineIn: complementItems.freeOnDineIn,
  }).from(complementItems)
    .where(inArray(complementItems.id, ids));
}

export async function getComplementGroupById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [group] = await db.select().from(complementGroups)
    .where(eq(complementGroups.id, id))
    .limit(1);
  return group || null;
}

export async function getComplementGroupsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];

  // Buscar grupos
  const groups = await db.select().from(complementGroups)
    .where(eq(complementGroups.productId, productId))
    .orderBy(asc(complementGroups.sortOrder));

  // Buscar itens de cada grupo
  const groupsWithItems = await Promise.all(
    groups.map(async (group) => {
      const items = await db.select().from(complementItems)
        .where(eq(complementItems.groupId, group.id))
        .orderBy(asc(complementItems.sortOrder));
      return {
        ...group,
        items,
      };
    })
  );

  return groupsWithItems;
}

export async function getComplementItemsByGroup(groupId: number, forProductId?: number) {
  const db = await getDb();
  if (!db) return [];

  const allItems = await db.select().from(complementItems)
    .where(eq(complementItems.groupId, groupId))
    .orderBy(asc(complementItems.sortOrder));

  // If forProductId is provided, filter out exclusive items that belong to other products
  if (forProductId) {
    return allItems.filter(item =>
      !item.exclusiveProductId || item.exclusiveProductId === forProductId
    );
  }

  return allItems;
}

export async function createComplementGroup(data: InsertComplementGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(complementGroups).values(data);
  return result[0].insertId;
}

export async function updateComplementGroup(id: number, data: Partial<InsertComplementGroup>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(complementGroups).set(data).where(eq(complementGroups.id, id));
}

export async function deleteComplementGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(complementItems).where(eq(complementItems.groupId, id));
  await db.delete(complementGroups).where(eq(complementGroups.id, id));
}

export async function createComplementItem(data: InsertComplementItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(complementItems).values(data);
  return result[0].insertId;
}

export async function updateComplementItem(id: number, data: Partial<InsertComplementItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Evitar erro "No values to set" quando não há campos para atualizar
  if (Object.keys(data).length === 0) return;

  await db.update(complementItems).set(data).where(eq(complementItems.id, id));
}

export async function deleteComplementItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(complementItems).where(eq(complementItems.id, id));
}

// Buscar todos os complementos de um estabelecimento (para gestão global)
export async function getAllComplementItemsByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os produtos do estabelecimento
  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(eq(products.establishmentId, establishmentId));

  if (establishmentProducts.length === 0) return [];

  const productIds = establishmentProducts.map(p => p.id);

  // Buscar todos os grupos de complementos desses produtos
  const allGroups = await db.select()
    .from(complementGroups)
    .where(inArray(complementGroups.productId, productIds));

  if (allGroups.length === 0) return [];

  const groupIds = allGroups.map(g => g.id);

  // Buscar todos os itens de complemento desses grupos
  const allItems = await db.select()
    .from(complementItems)
    .where(inArray(complementItems.groupId, groupIds))
    .orderBy(asc(complementItems.name));

  // Agrupar por nome para identificar complementos únicos
  // (mesmo complemento pode estar em vários grupos/produtos)
  const uniqueComplements = new Map<string, {
    id: number;
    name: string;
    price: string;
    isActive: boolean;
    priceMode: "normal" | "free";
    usageCount: number;
    groupIds: number[];
    availabilityType: "always" | "scheduled";
    availableDays: number[] | null;
    availableHours: { day: number; startTime: string; endTime: string }[] | null;
    badgeText: string | null;
  }>();

  for (const item of allItems) {
    const key = item.name.toLowerCase().trim();
    if (uniqueComplements.has(key)) {
      const existing = uniqueComplements.get(key)!;
      existing.usageCount++;
      if (!existing.groupIds.includes(item.groupId)) {
        existing.groupIds.push(item.groupId);
      }
    } else {
      uniqueComplements.set(key, {
        id: item.id,
        name: item.name,
        price: item.price,
        isActive: item.isActive,
        priceMode: (item.priceMode as "normal" | "free") || "normal",
        usageCount: 1,
        groupIds: [item.groupId],
        availabilityType: (item.availabilityType as "always" | "scheduled") || "always",
        availableDays: item.availableDays as number[] | null,
        availableHours: item.availableHours as { day: number; startTime: string; endTime: string }[] | null,
        badgeText: item.badgeText ?? null,
      });
    }
  }

  return Array.from(uniqueComplements.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Atualizar todos os complementos com o mesmo nome (para propagar alterações globais)
export async function updateComplementItemsByName(
  establishmentId: number,
  complementName: string,
  data: {
    name?: string;
    isActive?: boolean;
    priceMode?: "normal" | "free";
    price?: string;
    availabilityType?: "always" | "scheduled";
    availableDays?: number[] | null;
    availableHours?: { day: number; startTime: string; endTime: string }[] | null;
    badgeText?: string | null;
    description?: string | null;
    freeOnDelivery?: boolean;
    freeOnPickup?: boolean;
    freeOnDineIn?: boolean;
    hasStock?: boolean;
    stockQuantity?: number | null;
  },
  scopeGroupIds?: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se scopeGroupIds foi fornecido, atualizar apenas os itens draft desses grupos específicos
  if (scopeGroupIds && scopeGroupIds.length > 0) {
    await db.update(complementItems)
      .set(data)
      .where(
        and(
          inArray(complementItems.groupId, scopeGroupIds),
          eq(complementItems.name, complementName),
          eq(complementItems.version, 'draft')
        )
      );
    return;
  }

  // Caso contrário, atualizar apenas em produtos draft do estabelecimento
  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return;

  const productIds = establishmentProducts.map(p => p.id);

  const allGroups = await db.select()
    .from(complementGroups)
    .where(and(
      inArray(complementGroups.productId, productIds),
      eq(complementGroups.version, 'draft')
    ));

  if (allGroups.length === 0) return;

  const groupIds = allGroups.map(g => g.id);

  await db.update(complementItems)
    .set(data)
    .where(
      and(
        inArray(complementItems.groupId, groupIds),
        eq(complementItems.name, complementName),
        eq(complementItems.version, 'draft')
      )
    );
}

// ============ GLOBAL COMPLEMENT GROUP MANAGEMENT ============

// Get all complement groups across all products of an establishment
// Each group is independent - no auto-sync between groups with same name
export async function getAllComplementGroupsByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all draft products for this establishment
  const establishmentProducts = await db.select({ id: products.id, name: products.name })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return [];

  const productIds = establishmentProducts.map(p => p.id);
  const productMap = new Map(establishmentProducts.map(p => [p.id, p.name]));

  // Get all draft complement groups for these products
  const allGroups = await db.select()
    .from(complementGroups)
    .where(and(
      inArray(complementGroups.productId, productIds),
      eq(complementGroups.version, 'draft')
    ))
    .orderBy(asc(complementGroups.name));

  if (allGroups.length === 0) return [];

  // Get all draft items for all groups
  const allGroupIds = allGroups.map(g => g.id);
  const allItems = await db.select()
    .from(complementItems)
    .where(and(
      inArray(complementItems.groupId, allGroupIds),
      eq(complementItems.version, 'draft')
    ))
    .orderBy(asc(complementItems.sortOrder));

  // Build items map by groupId
  const itemsByGroupId = new Map<number, typeof allItems>();
  for (const item of allItems) {
    if (!itemsByGroupId.has(item.groupId)) {
      itemsByGroupId.set(item.groupId, []);
    }
    itemsByGroupId.get(item.groupId)!.push(item);
  }

  // Each group is independent - return all groups with their items
  // Group by name for the /complementos page display (aggregate view)
  const uniqueGroups = new Map<string, {
    name: string;
    groupIds: number[];
    productIds: number[];
    productCount: number;
    complementCount: number;
    minQuantity: number;
    maxQuantity: number;
    isRequired: boolean;
    isActive: boolean;
    items: any[];
  }>();

  for (const group of allGroups) {
    const key = group.name.toLowerCase().trim();

    if (uniqueGroups.has(key)) {
      const existing = uniqueGroups.get(key)!;
      if (!existing.groupIds.includes(group.id)) {
        existing.groupIds.push(group.id);
      }
      if (!existing.productIds.includes(group.productId)) {
        existing.productIds.push(group.productId);
        existing.productCount++;
      }
    } else {
      uniqueGroups.set(key, {
        name: group.name,
        groupIds: [group.id],
        productIds: [group.productId],
        productCount: 1,
        complementCount: 0,
        minQuantity: group.minQuantity,
        maxQuantity: group.maxQuantity,
        isRequired: group.isRequired,
        isActive: group.isActive,
        items: [],
      });
    }
  }

  // Assign items to their groups (deduplicate by name within the same group-name)
  // Exclusive items are NOT deduplicated - they appear individually with product info
  for (const item of allItems) {
    const group = allGroups.find(g => g.id === item.groupId);
    if (!group) continue;

    const key = group.name.toLowerCase().trim();
    const uniqueGroup = uniqueGroups.get(key);
    if (!uniqueGroup) continue;

    // Exclusive items always appear individually (not deduplicated)
    if (item.exclusiveProductId) {
      uniqueGroup.items.push({
        ...item,
        usageCount: 1,
        isExclusive: true,
        exclusiveProductName: productMap.get(item.exclusiveProductId) || 'Produto',
      });
      uniqueGroup.complementCount++;
      continue;
    }

    // Check if we already have a global item with this name in this group-name aggregate
    const existingItem = uniqueGroup.items.find(
      (i: any) => i.name.toLowerCase().trim() === item.name.toLowerCase().trim() && !i.isExclusive
    );

    if (!existingItem) {
      uniqueGroup.items.push({
        ...item,
        usageCount: 1,
        isExclusive: false,
        exclusiveProductName: null,
      });
      uniqueGroup.complementCount++;
    } else {
      existingItem.usageCount = (existingItem.usageCount || 1) + 1;
    }
  }

  return Array.from(uniqueGroups.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Pause/activate all complement groups with the same name across all products
export async function toggleComplementGroupByName(
  establishmentId: number,
  groupName: string,
  isActive: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return;

  const productIds = establishmentProducts.map(p => p.id);

  // Update all draft groups with this name
  await db.update(complementGroups)
    .set({ isActive })
    .where(
      and(
        inArray(complementGroups.productId, productIds),
        eq(complementGroups.name, groupName),
        eq(complementGroups.version, 'draft')
      )
    );
}

// Delete all complement groups with the same name across all products
export async function deleteComplementGroupByName(
  establishmentId: number,
  groupName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return;

  const productIds = establishmentProducts.map(p => p.id);

  // Find all draft groups with this name
  const groupsToDelete = await db.select({ id: complementGroups.id })
    .from(complementGroups)
    .where(
      and(
        inArray(complementGroups.productId, productIds),
        eq(complementGroups.name, groupName),
        eq(complementGroups.version, 'draft')
      )
    );

  if (groupsToDelete.length === 0) return;

  const groupIds = groupsToDelete.map(g => g.id);

  // Delete all draft items in these groups
  await db.delete(complementItems).where(
    and(
      inArray(complementItems.groupId, groupIds),
      eq(complementItems.version, 'draft')
    )
  );

  // Delete the groups themselves
  await db.delete(complementGroups).where(inArray(complementGroups.id, groupIds));
}

// Update group rules (min, max, required) globally by name
export async function updateComplementGroupRulesByName(
  establishmentId: number,
  groupName: string,
  data: {
    name?: string;
    minQuantity?: number;
    maxQuantity?: number;
    isRequired?: boolean;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return;

  const productIds = establishmentProducts.map(p => p.id);

  await db.update(complementGroups)
    .set(data)
    .where(
      and(
        inArray(complementGroups.productId, productIds),
        eq(complementGroups.name, groupName),
        eq(complementGroups.version, 'draft')
      )
    );
}

// Delete a complement item by name across all groups of an establishment
export async function deleteComplementItemByName(
  establishmentId: number,
  itemName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return;

  const productIds = establishmentProducts.map(p => p.id);

  const allGroups = await db.select({ id: complementGroups.id })
    .from(complementGroups)
    .where(and(
      inArray(complementGroups.productId, productIds),
      eq(complementGroups.version, 'draft')
    ));

  if (allGroups.length === 0) return;

  const groupIds = allGroups.map(g => g.id);

  await db.delete(complementItems)
    .where(
      and(
        inArray(complementItems.groupId, groupIds),
        eq(complementItems.name, itemName),
        eq(complementItems.version, 'draft')
      )
    );
}

// Add a complement item to all groups with a specific name across all products
export async function addComplementItemToGroupByName(
  establishmentId: number,
  groupName: string,
  itemData: { name: string; price: string; sortOrder?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.establishmentId, establishmentId), eq(products.version, 'draft')));

  if (establishmentProducts.length === 0) return;

  const productIds = establishmentProducts.map(p => p.id);

  // Find all draft groups with this name
  const groups = await db.select({ id: complementGroups.id })
    .from(complementGroups)
    .where(
      and(
        inArray(complementGroups.productId, productIds),
        eq(complementGroups.name, groupName),
        eq(complementGroups.version, 'draft')
      )
    );

  // Add the item to each group as draft
  for (const group of groups) {
    await db.insert(complementItems).values({
      groupId: group.id,
      name: itemData.name,
      price: itemData.price,
      sortOrder: itemData.sortOrder ?? 999,
      version: 'draft',
    });
  }

  return groups.length;
}

// Add an exclusive complement item to a specific product within a group
export async function addExclusiveComplementItem(
  establishmentId: number,
  groupName: string,
  productId: number,
  itemData: { name: string; price: string; sortOrder?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find the group for this specific product
  const group = await db.select({ id: complementGroups.id })
    .from(complementGroups)
    .where(
      and(
        eq(complementGroups.productId, productId),
        eq(complementGroups.name, groupName)
      )
    )
    .limit(1);

  if (group.length === 0) {
    throw new Error(`Grupo "${groupName}" não encontrado para este produto`);
  }

  // Insert the item with exclusiveProductId set as draft
  const result = await db.insert(complementItems).values({
    groupId: group[0].id,
    name: itemData.name,
    price: itemData.price,
    sortOrder: itemData.sortOrder ?? 999,
    exclusiveProductId: productId,
    version: 'draft',
  });

  return { id: Number(result[0].insertId), groupId: group[0].id };
}

// Remove an exclusive complement item
export async function removeExclusiveComplementItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify it's actually an exclusive item
  const item = await db.select().from(complementItems)
    .where(eq(complementItems.id, itemId))
    .limit(1);

  if (item.length === 0) throw new Error("Item não encontrado");
  if (!item[0].exclusiveProductId) throw new Error("Este item não é exclusivo - use a exclusão global");

  await db.delete(complementItems).where(eq(complementItems.id, itemId));
  return { success: true };
}

// Get global template prices for complements by establishment
// Returns a map: { "groupName::itemName" => templatePrice }
// The template price is the most common (mode) price across all instances of the same complement
export async function getGlobalTemplatePrices(establishmentId: number) {
  const db = await getDb();
  if (!db) return {};

  // Get all products for this establishment
  const establishmentProducts = await db.select({ id: products.id })
    .from(products)
    .where(eq(products.establishmentId, establishmentId));

  if (establishmentProducts.length === 0) return {};

  const productIds = establishmentProducts.map(p => p.id);

  // Get all complement groups for these products
  const allGroups = await db.select()
    .from(complementGroups)
    .where(inArray(complementGroups.productId, productIds));

  if (allGroups.length === 0) return {};

  const allGroupIds = allGroups.map(g => g.id);

  // Get all items
  const allItems = await db.select()
    .from(complementItems)
    .where(inArray(complementItems.groupId, allGroupIds));

  // Build a map: groupName::itemName => array of prices
  const priceMap = new Map<string, string[]>();

  for (const item of allItems) {
    const group = allGroups.find(g => g.id === item.groupId);
    if (!group) continue;

    const key = `${group.name.toLowerCase().trim()}::${item.name.toLowerCase().trim()}`;
    if (!priceMap.has(key)) {
      priceMap.set(key, []);
    }
    priceMap.get(key)!.push(item.price);
  }

  // For each key, find the most common price (mode)
  const result: Record<string, string> = {};
  const priceEntries = Array.from(priceMap.entries());
  for (const [key, prices] of priceEntries) {
    if (prices.length <= 1) {
      // Only one instance, it IS the template
      result[key] = prices[0];
      continue;
    }

    // Find mode (most frequent price)
    const freq = new Map<string, number>();
    for (const p of prices) {
      freq.set(p, (freq.get(p) || 0) + 1);
    }
    let modePrice = prices[0];
    let maxCount = 0;
    const freqEntries = Array.from(freq.entries());
    for (const [p, count] of freqEntries) {
      if (count > maxCount) {
        maxCount = count;
        modePrice = p;
      }
    }
    result[key] = modePrice;
  }

  return result;
}

// ============ ORDER FUNCTIONS ============
export async function getOrdersByEstablishment(
  establishmentId: number,
  status?: "new" | "preparing" | "ready" | "completed" | "cancelled",
  includePendingConfirmation?: boolean
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(orders.establishmentId, establishmentId)];
  if (status) {
    conditions.push(eq(orders.status, status));
  } else if (!includePendingConfirmation) {
    // Por padrão, excluir pedidos aguardando confirmação do cliente
    conditions.push(ne(orders.status, 'pending_confirmation'));
  }

  // Otimização: para pedidos concluídos/cancelados, limitar a 200 mais recentes
  // Para pedidos ativos (sem filtro de status), buscar todos os ativos + 200 finalizados
  if (status === 'completed' || status === 'cancelled') {
    return db.select().from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(200);
  }

  if (!status) {
    // Buscar pedidos ativos (sem limite) + finalizados (limitados)
    const activeConditions = [
      eq(orders.establishmentId, establishmentId),
      inArray(orders.status, ['new', 'preparing', 'ready', 'out_for_delivery'] as const),
    ];
    const finishedConditions = [
      eq(orders.establishmentId, establishmentId),
      inArray(orders.status, ['completed', 'cancelled'] as const),
    ];

    const [activeOrders, finishedOrders] = await Promise.all([
      db.select().from(orders)
        .where(and(...activeConditions))
        .orderBy(desc(orders.createdAt)),
      db.select().from(orders)
        .where(and(...finishedConditions))
        .orderBy(desc(orders.createdAt))
        .limit(200),
    ]);

    // Combinar e ordenar por data decrescente
    return [...activeOrders, ...finishedOrders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return db.select().from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/**
 * Atualiza a quantidade de um item do pedido e recalcula o totalPrice.
 * Retorna o item atualizado.
 */
export async function updateOrderItemQuantity(itemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
  if (!item) throw new Error("Item not found");

  const unitPrice = Number(item.unitPrice);
  // Recalcular complementos
  const complementsTotal = (item.complements || []).reduce((sum, c) => sum + (c.price * (c.quantity || 1)), 0);
  const newTotal = ((unitPrice + complementsTotal) * quantity).toFixed(2);

  await db.update(orderItems).set({ quantity, totalPrice: newTotal }).where(eq(orderItems.id, itemId));
  return { ...item, quantity, totalPrice: newTotal };
}

/**
 * Remove um item do pedido.
 */
export async function deleteOrderItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
  if (!item) throw new Error("Item not found");

  await db.delete(orderItems).where(eq(orderItems.id, itemId));
  return item;
}

/**
 * Adiciona um novo item ao pedido a partir de um produto do cardápio.
 */
export async function addOrderItem(orderId: number, productId: number, quantity: number, complements?: { name: string; price: number; quantity: number }[], notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new Error("Product not found");

  const unitPrice = Number(product.price);
  const complementsTotal = (complements || []).reduce((sum, c) => sum + (c.price * (c.quantity || 1)), 0);
  const totalPrice = ((unitPrice + complementsTotal) * quantity).toFixed(2);

  const [result] = await db.insert(orderItems).values({
    orderId,
    productId,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    totalPrice,
    complements: complements || null,
    notes: notes || null,
    printerId: product.printerId,
  });

  return {
    id: result.insertId,
    orderId,
    productId,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    totalPrice,
    complements: complements || null,
    notes: notes || null,
  };
}

/**
 * Recalcula e atualiza subtotal e total do pedido baseado nos itens atuais.
 */
export async function recalculateOrderTotals(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");

  const deliveryFee = Number(order.deliveryFee) || 0;
  const discount = Number(order.discount) || 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  await db.update(orders).set({
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
  }).where(eq(orders.id, orderId));

  return { subtotal: subtotal.toFixed(2), total: total.toFixed(2), deliveryFee: order.deliveryFee, discount: order.discount };
}

const ORDER_DETAIL_EDITABLE_SOURCES = new Set(["internal", "pdv"]);
const ORDER_DETAIL_EDITABLE_STATUSES = new Set(["pending_confirmation", "new", "preparing", "ready", "out_for_delivery", "scheduled"]);
const ORDER_ONLINE_PAYMENT_METHODS = new Set(["card_online", "pix_online"]);

export type EditableOrderDeliveryType = "delivery" | "pickup" | "dine_in";
export type EditableOrderPaymentMethod = "cash" | "card" | "pix" | "card_online" | "pix_online";

export async function updateOrderFulfillmentAndPayment(
  orderId: number,
  input: {
    deliveryType: EditableOrderDeliveryType;
    paymentMethod: EditableOrderPaymentMethod;
    deliveryFee?: number | null;
    changeAmount?: number | null;
    customerAddress?: string;
  },
  options?: {
    allowOnlinePaymentConversion?: boolean;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");

  if (!ORDER_DETAIL_EDITABLE_SOURCES.has(order.source)) {
    throw new Error("Pedidos de origem externa não podem ter pagamento ou entrega editados manualmente.");
  }

  if (!ORDER_DETAIL_EDITABLE_STATUSES.has(order.status)) {
    throw new Error("Pedidos finalizados ou cancelados não podem ter pagamento ou entrega editados.");
  }

  const isChangingPaymentMethod = input.paymentMethod !== order.paymentMethod;
  const allowOnlinePaymentConversion = Boolean(options?.allowOnlinePaymentConversion);
  if (
    isChangingPaymentMethod
    && !allowOnlinePaymentConversion
    && (ORDER_ONLINE_PAYMENT_METHODS.has(order.paymentMethod) || ORDER_ONLINE_PAYMENT_METHODS.has(input.paymentMethod))
  ) {
    throw new Error("Pagamentos online não podem ser alterados manualmente por este modal.");
  }

  if (!ORDER_ONLINE_PAYMENT_METHODS.has(input.paymentMethod)) {
    const [establishment] = await db.select({
      acceptsCash: establishments.acceptsCash,
      acceptsCard: establishments.acceptsCard,
      acceptsPix: establishments.acceptsPix,
    }).from(establishments).where(eq(establishments.id, order.establishmentId)).limit(1);

    const paymentMethodEnabled = (
      (input.paymentMethod === "cash" && establishment?.acceptsCash)
      || (input.paymentMethod === "card" && establishment?.acceptsCard)
      || (input.paymentMethod === "pix" && establishment?.acceptsPix)
    );

    if (!paymentMethodEnabled) {
      throw new Error("Esta forma de pagamento não está habilitada nas configurações do estabelecimento.");
    }
  }

  const nextCustomerAddress = input.customerAddress !== undefined
    ? input.customerAddress.trim()
    : (order.customerAddress ?? "");

  let nextDeliveryFee = Number(order.deliveryFee) || 0;
  if (input.deliveryType === "delivery") {
    if (!nextCustomerAddress || nextCustomerAddress.trim().length === 0) {
      throw new Error("Informe um endereço no pedido antes de alterar a entrega para delivery.");
    }

    if (input.deliveryFee !== undefined && input.deliveryFee !== null) {
      nextDeliveryFee = input.deliveryFee;
    } else if (order.deliveryType !== "delivery") {
      throw new Error("Informe a taxa de entrega ao alterar o pedido para delivery.");
    }
  } else {
    nextDeliveryFee = 0;
  }

  if (!Number.isFinite(nextDeliveryFee) || nextDeliveryFee < 0) {
    throw new Error("A taxa de entrega deve ser maior ou igual a zero.");
  }

  const subtotal = Number(order.subtotal) || 0;
  const discount = Number(order.discount) || 0;
  const total = Math.max(0, subtotal + nextDeliveryFee - discount);

  let nextChangeAmount: string | null = null;
  if (input.paymentMethod === "cash") {
    if (input.changeAmount !== undefined && input.changeAmount !== null) {
      if (!Number.isFinite(input.changeAmount) || input.changeAmount < 0) {
        throw new Error("O valor de troco deve ser maior ou igual a zero.");
      }
      if (input.changeAmount > 0 && input.changeAmount < total) {
        throw new Error("O valor de troco deve ser maior ou igual ao total do pedido.");
      }
      nextChangeAmount = input.changeAmount.toFixed(2);
    }
  }

  await db.update(orders).set({
    deliveryType: input.deliveryType,
    paymentMethod: input.paymentMethod,
    deliveryFee: nextDeliveryFee.toFixed(2),
    changeAmount: nextChangeAmount,
    total: total.toFixed(2),
    ...(input.customerAddress !== undefined && { customerAddress: nextCustomerAddress }),
  }).where(eq(orders.id, orderId));

  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  notifyOrderUpdate(order.establishmentId, {
    id: orderId,
    deliveryType: input.deliveryType,
    paymentMethod: input.paymentMethod,
    deliveryFee: nextDeliveryFee.toFixed(2),
    changeAmount: nextChangeAmount,
    total: total.toFixed(2),
    ...(input.customerAddress !== undefined && { customerAddress: nextCustomerAddress }),
    updatedAt: new Date(),
  });

  return updatedOrder;
}

export async function updateOrderCustomer(
  orderId: number,
  input: {
    customerName: string;
    customerPhone?: string | null;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");

  if (!ORDER_DETAIL_EDITABLE_SOURCES.has(order.source)) {
    throw new Error("Pedidos de origem externa não podem ter o cliente editado manualmente.");
  }

  if (!ORDER_DETAIL_EDITABLE_STATUSES.has(order.status)) {
    throw new Error("Pedidos finalizados ou cancelados não podem ter o cliente editado.");
  }

  const nextCustomerName = input.customerName.trim();
  const nextCustomerPhone = input.customerPhone?.trim() || null;

  if (!nextCustomerName) {
    throw new Error("Informe o nome do cliente.");
  }

  await db.update(orders).set({
    customerName: nextCustomerName,
    customerPhone: nextCustomerPhone,
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId));

  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  notifyOrderUpdate(order.establishmentId, {
    id: orderId,
    customerName: nextCustomerName,
    customerPhone: nextCustomerPhone,
    updatedAt: new Date(),
  });

  return updatedOrder;
}

/**
 * Busca produtos ativos do cardápio para adicionar ao pedido (busca por nome).
 */
export async function searchProductsForOrder(establishmentId: number, search: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: products.id,
    name: products.name,
    price: products.price,
    images: products.images,
    categoryId: products.categoryId,
    isCombo: products.isCombo,
    complementCount: sql<number>`(
      SELECT COUNT(*) FROM complementItems ci
      INNER JOIN complementGroups cg ON ci.groupId = cg.id
      WHERE cg.productId = products.id
    )`.as('complementCount'),
  })
    .from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.status, 'active'),
      sql`LOWER(${products.name}) LIKE LOWER(${'%' + escapeLike(search) + '%'})`
    ))
    .limit(20);
}

/**
 * Busca itens do pedido com informações da impressora associada ao produto
 */
export async function getOrderItemsWithPrinter(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  const items = await db.select({
    id: orderItems.id,
    orderId: orderItems.orderId,
    productId: orderItems.productId,
    productName: orderItems.productName,
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    totalPrice: orderItems.totalPrice,
    notes: orderItems.notes,
    complements: orderItems.complements,
    printerId: products.printerId,
    printerName: printers.name,
    printerIp: printers.ipAddress,
    printerPort: printers.port,
    printerActive: printers.isActive
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .leftJoin(printers, eq(products.printerId, printers.id))
  .where(eq(orderItems.orderId, orderId));

  return items;
}

/**
 * Gera o próximo número de pedido diário (#P1, #P2, etc.)
 * Reinicia automaticamente à 00:00 no fuso horário do estabelecimento.
 */
async function getNextDailyOrderNumber(establishmentId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar timezone do estabelecimento
  const estResult = await db.select({ timezone: establishments.timezone })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);
  const timezone = estResult.length > 0 ? estResult[0].timezone : 'America/Sao_Paulo';

  // Calcular data atual no fuso horário do estabelecimento (YYYY-MM-DD)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayStr = formatter.format(now);

  try {
    // Método atômico: INSERT ... ON DUPLICATE KEY UPDATE counter = counter + 1
    // Isso garante que mesmo com requisições paralelas, cada uma recebe um número único
    await db.execute(
      sql`INSERT INTO order_counters (establishmentId, counterDate, counter)
          VALUES (${establishmentId}, ${todayStr}, 1)
          ON DUPLICATE KEY UPDATE counter = counter + 1`
    );

    // Ler o valor atualizado
    const [result] = await db.select({ counter: orderCounters.counter })
      .from(orderCounters)
      .where(and(
        eq(orderCounters.establishmentId, establishmentId),
        eq(orderCounters.counterDate, todayStr)
      ))
      .limit(1);

    if (result) {
      return `#P${result.counter}`;
    }
  } catch (atomicError) {
    logger.error('[getNextDailyOrderNumber] Erro no método atômico, usando fallback:', atomicError);
  }

  // Fallback: método antigo (não atômico, mas funciona se a tabela order_counters não existir)
  const utcFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const parts = utcFormatter.formatToParts(now);
  const localTimeStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
  const localTime = new Date(localTimeStr);
  const startOfDayLocal = new Date(`${todayStr}T00:00:00`);
  const offsetMs = now.getTime() - localTime.getTime();
  const startOfDayUTC = new Date(startOfDayLocal.getTime() + offsetMs);

  const lastOrderResult = await db.select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      gte(orders.createdAt, startOfDayUTC)
    ))
    .orderBy(desc(orders.id))
    .limit(1);

  let nextNumber = 1;
  if (lastOrderResult.length > 0 && lastOrderResult[0].orderNumber) {
    const match = lastOrderResult[0].orderNumber.match(/#P(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `#P${nextNumber}`;
}

export async function createOrderWithNumber(data: InsertOrder, items: InsertOrderItem[], options?: { skipSSE?: boolean }): Promise<{ id: number; orderNumber: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ===== VALIDAÇÃO DE ESTOQUE =====
  // Verificar se há estoque suficiente para todos os itens ANTES de criar o pedido
  const productIds = items.map(i => i.productId).filter(Boolean);
  if (productIds.length > 0) {
    const productsWithStock = await db.select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.hasStock, true)
      ));

    if (productsWithStock.length > 0) {
      const linkedStockItemsList = await getStockItemsByLinkedProductIds(productsWithStock.map(p => p.id));
      const stockMap = new Map<number, number>();

      for (const si of linkedStockItemsList) {
        if (si.linkedProductId) {
          stockMap.set(si.linkedProductId, Number(si.currentQuantity));
        }
      }

      for (const p of productsWithStock) {
        if (!stockMap.has(p.id)) {
          stockMap.set(p.id, p.stockQuantity ?? 0);
        }
      }

      const requestedQty = new Map<number, { qty: number; name: string }>();
      for (const item of items) {
        if (item.productId && stockMap.has(item.productId)) {
          const existing = requestedQty.get(item.productId);
          if (existing) {
            existing.qty += (item.quantity ?? 1);
          } else {
            requestedQty.set(item.productId, { qty: item.quantity ?? 1, name: item.productName || '' });
          }
        }
      }

      const insufficientItems: string[] = [];
      Array.from(requestedQty.entries()).forEach(([productId, { qty, name }]) => {
        const available = stockMap.get(productId) ?? 0;
        if (qty > available) {
          insufficientItems.push(`${name}: solicitado ${qty}, disponível ${available}`);
        }
      });

      if (insufficientItems.length > 0) {
        logger.info('[DB:createOrderWithNumber] Estoque insuficiente:', insufficientItems);
        throw new Error(`Estoque insuficiente: ${insufficientItems.join('; ')}`);
      }
    }
  }

  // Se não foi passado orderNumber, gerar automaticamente no formato #P1, #P2, etc.
  // Reset diário automático: numeração reinicia à 00:00 no fuso horário do estabelecimento
  let orderNumber = data.orderNumber;
  if (!orderNumber || orderNumber.match(/^\d+$/)) {
    orderNumber = await getNextDailyOrderNumber(data.establishmentId);
  }

  // Definir status padrão como 'preparing' para pedidos do PDV
  const finalStatus = data.status || 'preparing';
  const finalData = {
    ...data,
    orderNumber,
    status: finalStatus,
    source: data.source || 'pdv',
    ...(finalStatus === 'new' ? { newAt: new Date() } : {}),
  };

  const result = await db.insert(orders).values(finalData);
  const orderId = result[0].insertId;

  if (items.length > 0) {
    const itemsWithOrderId = items.map(item => ({ ...item, orderId }));
    await db.insert(orderItems).values(itemsWithOrderId);
  }

  // Notificar via SSE sobre novo pedido
  const sseOrderData = {
    id: orderId,
    orderNumber,
    establishmentId: data.establishmentId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    deliveryType: data.deliveryType,
    paymentMethod: data.paymentMethod,
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    discount: data.discount || "0",
    couponCode: data.couponCode || null,
    total: data.total,
    notes: data.notes,
    status: finalData.status,
    source: finalData.source,
    createdAt: new Date(),
    items: items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      complements: item.complements,
      notes: item.notes,
    })),
  };
  if (!options?.skipSSE) {
    notifyNewOrder(data.establishmentId, sseOrderData);
  }

  return { id: orderId, orderNumber };
}

// Manter função antiga para compatibilidade
export async function createOrder(data: InsertOrder, items: InsertOrderItem[]): Promise<number> {
  const result = await createOrderWithNumber(data, items);

  // Descontar estoque automaticamente ao criar pedido (PDV, mesas, etc.)
  try {
    await deductStockForOrder(result.id);
    logger.info('[Estoque] Descontado para pedido (createOrder):', result.id);
  } catch (err) {
    logger.error('[Estoque] Erro ao descontar estoque (createOrder):', err);
  }

  return result.id;
}

export async function updateOrderStatus(id: number, status: "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled", cancellationReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<Order> = { status };
  if (status === "new") {
    updateData.newAt = new Date();
  }
  if (status === "preparing") {
    updateData.acceptedAt = new Date();
  }
  if (status === "ready") {
    updateData.readyAt = new Date();
  }
  if (status === "completed" || status === "cancelled") {
    updateData.completedAt = new Date();
  }
  if (status === "cancelled" && cancellationReason) {
    updateData.cancellationReason = cancellationReason;
  }

  await db.update(orders).set(updateData).where(eq(orders.id, id));

  // Buscar pedido atualizado para notificar via SSE
  const updatedOrder = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (updatedOrder.length > 0) {
    const order = updatedOrder[0];
    // Notificar o dashboard do restaurante
    notifyOrderUpdate(order.establishmentId, { id, status, updatedAt: new Date(), cancellationReason });

    // Notificar o cliente via SSE usando o orderNumber
    if (order.orderNumber) {
      notifyOrderStatusUpdate(order.orderNumber, {
        id,
        orderNumber: order.orderNumber,
        status,
        updatedAt: new Date(),
        cancellationReason
      });
    }

    // Quando pedido é aceito (status -> preparing), enviar SMS de confirmação ao cliente
    if (status === "preparing" && order.customerPhone && isValidPhoneNumber(order.customerPhone)) {
      try {
        const estSmsResult = await db.select({
          name: establishments.name,
          smsEnabled: establishments.smsEnabled
        })
          .from(establishments)
          .where(eq(establishments.id, order.establishmentId))
          .limit(1);

        if (estSmsResult.length > 0 && estSmsResult[0].smsEnabled) {
          const totalFormatted = `R$${parseFloat(order.total).toFixed(2).replace('.', ',')}`;
          const acceptedMessage = `${estSmsResult[0].name}: Ola! Seu pedido #${order.orderNumber} (${totalFormatted}) foi confirmado e ja esta sendo preparado. Obrigado pela preferencia!`;

          sendSMS({
            to: order.customerPhone,
            message: acceptedMessage,
            campaignName: "Pedido Aceito",
          })
            .then(result => {
              if (result.success) {
                logger.info(`[SMS] SMS de confirmação enviado com sucesso para pedido ${order.orderNumber}`);
              } else {
                logger.warn(`[SMS] Falha ao enviar SMS de confirmação para pedido ${order.orderNumber}: ${result.error}`);
              }
            })
            .catch(err => {
              logger.error(`[SMS] Erro ao enviar SMS de confirmação para pedido ${order.orderNumber}:`, err);
            });
        }
      } catch (smsErr) {
        logger.error('[SMS] Erro ao processar SMS de confirmação:', smsErr);
      }
    }

    // Quando pedido é aceito (status -> preparing), enviar evento print_order para app externo
    // Só imprime aqui se printOnNewOrder está DESATIVADO (senão já imprimiu na criação do pedido)
    if (status === "preparing") {
      try {
        const printerSettingsResult = await getPrinterSettings(order.establishmentId);
        if (printerSettingsResult && !printerSettingsResult.printOnNewOrder) {
          const orderItemsList = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
          
          // Buscar impressoras para montar mapa de roteamento por categoria
          const establishmentPrinters = await getPrintersByEstablishment(order.establishmentId);
          const printerCategoryMap: Record<string, number[]> = {};
          for (const printer of establishmentPrinters) {
            if (!printer.isActive) continue;
            let catIds: number[] = [];
            if (printer.categoryIds) {
              try { catIds = JSON.parse(printer.categoryIds); } catch { catIds = []; }
            }
            printerCategoryMap[String(printer.id)] = catIds;
          }

          // Buscar categoryId de cada produto
          const itemsWithCategory = await Promise.all(orderItemsList.map(async (item) => {
            let categoryId: number | null = null;
            if (item.productId) {
              try {
                const product = await getProductById(item.productId);
                if (product) categoryId = product.categoryId || null;
              } catch { /* ignore */ }
            }
            return {
              productName: item.productName,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              complements: item.complements as Array<{ name: string; price: number }> | null,
              notes: item.notes || null,
              categoryId,
              productId: item.productId || null,
            };
          }));

          notifyPrintOrder(order.establishmentId, {
            orderId: id,
            orderNumber: order.orderNumber,
            customerName: order.customerName || null,
            customerPhone: order.customerPhone || null,
            customerAddress: order.customerAddress || null,
            deliveryType: order.deliveryType || "delivery",
            paymentMethod: order.paymentMethod || "cash",
            subtotal: order.subtotal || "0",
            deliveryFee: order.deliveryFee || "0",
            discount: order.discount || "0",
            total: order.total,
            notes: order.notes || null,
            changeAmount: order.changeAmount || null,
            items: itemsWithCategory,
            createdAt: order.createdAt || new Date(),
            beepOnPrint: (printerSettingsResult as any)?.mindiBeepOnPrint ?? printerSettingsResult?.beepOnPrint ?? false,
            htmlPrintEnabled: (printerSettingsResult as any)?.mindiHtmlPrintEnabled ?? printerSettingsResult?.htmlPrintEnabled ?? true,
            printerCategoryMap,
          });
          logger.info(`[DB:updateOrderStatus] Evento print_order enviado para pedido aceito: ${order.orderNumber} com roteamento por categoria`);
          // Registrar log de impressão (fire-and-forget - nunca bloqueia)
          createPrintLog({
            establishmentId: order.establishmentId,
            orderId: id,
            orderNumber: order.orderNumber,
            trigger: 'accept',
            method: 'sse',
            status: 'sent',
            printerConnections: getPrinterConnectionCount(order.establishmentId),
            metadata: { previousStatus: order.status, beepOnPrint: (printerSettingsResult as any)?.mindiBeepOnPrint ?? printerSettingsResult?.beepOnPrint ?? false, htmlPrintEnabled: (printerSettingsResult as any)?.mindiHtmlPrintEnabled ?? printerSettingsResult?.htmlPrintEnabled ?? true },
          }).catch(() => {});
        }
      } catch (printErr) {
        logger.error('[DB:updateOrderStatus] Erro ao enviar evento de impressão:', printErr);
      }
    }

    // Nota: o desconto de estoque é feito na criação do pedido (createPublicOrder)
    // Não descontar novamente ao mudar de status para evitar dupla contagem

    // Restaurar estoque quando pedido é cancelado
    if (status === "cancelled") {
      try {
        await restoreStockForOrder(id);
        logger.info('[Estoque] Estoque restaurado para pedido cancelado:', id);
      } catch (err) {
        logger.error('[Estoque] Erro ao restaurar estoque (cancelamento):', err);
      }
    }

    // Enviar SMS quando o pedido é cancelado pelo estabelecimento
    if (status === "cancelled" && order.customerPhone && isValidPhoneNumber(order.customerPhone)) {
      try {
        const estCancelResult = await db.select({
          name: establishments.name,
          smsEnabled: establishments.smsEnabled
        })
          .from(establishments)
          .where(eq(establishments.id, order.establishmentId))
          .limit(1);

        if (estCancelResult.length > 0 && estCancelResult[0].smsEnabled) {
          const cancelMessage = `${estCancelResult[0].name}: Infelizmente seu pedido #${order.orderNumber} foi cancelado. Entre em contato conosco para mais informacoes.`;

          sendSMS({
            to: order.customerPhone,
            message: cancelMessage,
            campaignName: "Pedido Cancelado",
          })
            .then(result => {
              if (result.success) {
                logger.info(`[SMS] SMS de cancelamento enviado com sucesso para pedido ${order.orderNumber}`);
              } else {
                logger.warn(`[SMS] Falha ao enviar SMS de cancelamento para pedido ${order.orderNumber}: ${result.error}`);
              }
            })
            .catch(err => {
              logger.error(`[SMS] Erro ao enviar SMS de cancelamento para pedido ${order.orderNumber}:`, err);
            });
        }
      } catch (smsErr) {
        logger.error('[SMS] Erro ao processar SMS de cancelamento:', smsErr);
      }
    }

    // Enviar SMS quando o status mudar para "ready" (pedido pronto/saindo para entrega)
    if (status === "ready" && order.customerPhone && isValidPhoneNumber(order.customerPhone)) {
      // Buscar configurações do estabelecimento (nome e smsEnabled)
      const establishmentResult = await db.select({
        name: establishments.name,
        smsEnabled: establishments.smsEnabled
      })
        .from(establishments)
        .where(eq(establishments.id, order.establishmentId))
        .limit(1);

      if (establishmentResult.length > 0) {
        const { name: restaurantName, smsEnabled } = establishmentResult[0];

        // Só enviar SMS se a funcionalidade estiver ativada nas configurações
        if (smsEnabled) {
          // Enviar SMS de forma assíncrona (não bloqueia o fluxo)
          // Passa o deliveryType para diferenciar a mensagem entre entrega e retirada
          sendOrderReadySMS(order.customerPhone, restaurantName, order.deliveryType)
            .then(result => {
              if (result.success) {
                logger.info(`[SMS] SMS enviado com sucesso para pedido ${order.orderNumber} (${order.deliveryType})`);
              } else {
                logger.warn(`[SMS] Falha ao enviar SMS para pedido ${order.orderNumber}: ${result.error}`);
              }
            })
            .catch(err => {
              logger.error(`[SMS] Erro ao enviar SMS para pedido ${order.orderNumber}:`, err);
            });
        } else {
          logger.info(`[SMS] SMS desativado nas configurações do estabelecimento. Pedido ${order.orderNumber} não notificado.`);
        }
      }
    }

    // Adicionar carimbo de fidelidade quando o pedido é completado
    if (status === "completed" && order.customerPhone) {
      try {
        // Verificar se fidelidade está ativa para o estabelecimento
        const estResult = await db.select({
          loyaltyEnabled: establishments.loyaltyEnabled,
          loyaltyMinOrderValue: establishments.loyaltyMinOrderValue,
          loyaltyStampsRequired: establishments.loyaltyStampsRequired,
        }).from(establishments).where(eq(establishments.id, order.establishmentId)).limit(1);

        if (estResult.length > 0 && estResult[0].loyaltyEnabled) {
          const { loyaltyMinOrderValue, loyaltyStampsRequired } = estResult[0];
          const minValue = loyaltyMinOrderValue ? Number(loyaltyMinOrderValue) : 0;
          const orderTotal = Number(order.total);

          // Verificar se o pedido atinge o valor mínimo
          if (orderTotal >= minValue) {
            // Normalizar telefone do pedido para busca
            const customerPhoneNormalized = order.customerPhone.replace(/[^0-9]/g, '');

            // Buscar cartão de fidelidade do cliente (somente clientes cadastrados)
            // Busca tanto pelo telefone normalizado quanto pelo original para compatibilidade
            const existingCard = await db.select().from(loyaltyCards)
              .where(and(
                eq(loyaltyCards.establishmentId, order.establishmentId),
                or(
                  eq(loyaltyCards.customerPhone, customerPhoneNormalized),
                  eq(loyaltyCards.customerPhone, order.customerPhone)
                )
              ))
              .limit(1);

            // Somente conceder carimbo se o cliente já tiver cadastro no programa de fidelidade
            // Não criar cartão automaticamente — o cliente precisa se cadastrar primeiro
            if (existingCard.length === 0) {
              logger.info(`[Fidelidade] Cliente ${order.customerPhone} não possui cadastro no programa de fidelidade. Carimbo não concedido.`);
            } else if (!existingCard[0].registeredByCustomer) {
              logger.info(`[Fidelidade] Cliente ${order.customerPhone} tem cartão mas não se cadastrou voluntariamente. Carimbo não concedido.`);
            }

            let cardId: number | null = (existingCard.length > 0 && existingCard[0].registeredByCustomer) ? existingCard[0].id : null;
            if (cardId) {
              logger.info(`[Fidelidade] Cartão encontrado para ${order.customerPhone} (ID: ${cardId})`);
            }

            // Só processar carimbo se o cliente tiver cadastro (cardId não nulo)
            if (cardId) {
              // Verificar se já existe carimbo para este pedido (usar orderId pois orderNumber pode se repetir entre dias)
              const existingStamp = await db.select().from(loyaltyStamps)
                .where(and(
                  eq(loyaltyStamps.loyaltyCardId, cardId),
                  eq(loyaltyStamps.orderId, id)
                ))
                .limit(1);

              if (existingStamp.length === 0) {
                // Buscar cartão atual para verificar se precisa resetar
                const currentCard = await db.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1);
                if (currentCard.length > 0) {
                  const stampsRequired = loyaltyStampsRequired || 6;
                  let currentStamps = currentCard[0].stamps;

                  // Se o cartão já foi completado (stamps >= required), resetar antes de adicionar novo carimbo
                  if (currentStamps >= stampsRequired) {
                    logger.info(`[Fidelidade] Cartão ${cardId} já completado (${currentStamps}/${stampsRequired}). Resetando para novo ciclo.`);

                    // Resetar carimbos para 0
                    await db.update(loyaltyCards)
                      .set({ stamps: 0 })
                      .where(eq(loyaltyCards.id, cardId));

                    // Histórico de carimbos é preservado - não deletar

                    currentStamps = 0;
                  }

                  // Adicionar carimbo
                  await db.insert(loyaltyStamps).values({
                    loyaltyCardId: cardId,
                    orderId: id,
                    orderNumber: order.orderNumber || '',
                    orderTotal: order.total,
                  });

                  const newStamps = currentStamps + 1;
                  const newTotalStampsEarned = currentCard[0].totalStampsEarned + 1;

                  // Verificar se completou o cartão
                  if (newStamps >= stampsRequired) {
                    // Gerar código único para o cupom de fidelidade (verifica unicidade no banco)
                    const couponCode = await generateUniqueLoyaltyCouponCode(order.establishmentId);

                    // Buscar configurações de fidelidade do estabelecimento
                    const estSettings = await db.select({
                      couponType: establishments.loyaltyCouponType,
                      couponValue: establishments.loyaltyCouponValue,
                      minOrderValue: establishments.loyaltyMinOrderValue,
                    }).from(establishments).where(eq(establishments.id, order.establishmentId));

                    const couponType = estSettings[0]?.couponType || 'fixed';
                    const couponValue = estSettings[0]?.couponValue || '10';
                    const minOrderValue = estSettings[0]?.minOrderValue || '0';

                    // Criar cupom de fidelidade na tabela coupons
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 30); // Válido por 30 dias

                    const newCoupon = await db.insert(coupons).values({
                      establishmentId: order.establishmentId,
                      code: couponCode,
                      type: couponType === 'free_delivery' ? 'fixed' : couponType as 'percentage' | 'fixed',
                      value: couponType === 'free_delivery' ? '0' : couponValue,
                      minOrderValue: minOrderValue,
                      quantity: 1,
                      usedCount: 0,
                      endDate: expiresAt,
                      status: 'active',
                    });

                    const couponId = newCoupon[0].insertId;

                    // NÃO resetar carimbos automaticamente - apenas vincular cupom ativo
                    // Os carimbos serão resetados quando o usuário clicar em "Ver cupom ganho"

                    // Adicionar novo cupom ao array de cupons ativos
                    const currentActiveCouponIds = currentCard[0].activeCouponIds || [];
                    const newActiveCouponIds = [...currentActiveCouponIds, couponId];

                    await db.update(loyaltyCards).set({
                      stamps: newStamps, // Manter os carimbos até o usuário visualizar o cupom
                      totalStampsEarned: newTotalStampsEarned,
                      couponsEarned: currentCard[0].couponsEarned + 1,
                      activeCouponId: couponId, // Manter para compatibilidade
                      activeCouponIds: newActiveCouponIds, // Array com todos os cupons
                    }).where(eq(loyaltyCards.id, cardId));

                    logger.info(`[Fidelidade] Cliente ${order.customerPhone} completou cartão e ganhou cupom ${couponCode}! Carimbos serão resetados ao visualizar cupom.`);
                  } else {
                    await db.update(loyaltyCards).set({
                      stamps: newStamps,
                      totalStampsEarned: newTotalStampsEarned,
                    }).where(eq(loyaltyCards.id, cardId));

                    logger.info(`[Fidelidade] Carimbo adicionado para ${order.customerPhone}. Total: ${newStamps}/${stampsRequired}`);
                  }
                }
              }
            } // fim do if (cardId)
          }
        }
      } catch (loyaltyError) {
        logger.error('[Fidelidade] Erro ao processar carimbo:', loyaltyError);
        // Não interrompe o fluxo principal
      }
    }

    // Processar cashback quando o pedido é completado
    if (status === "completed" && order.customerPhone) {
      try {
        await processCashbackForCompletedOrder(id);
      } catch (cashbackError) {
        logger.error('[Cashback] Erro ao processar cashback:', cashbackError);
        // Não interrompe o fluxo principal
      }
    }
  }
}

export async function getNewOrdersExpiredForAutoCancellation(cutoff: Date) {
  const db = await getDb();
  if (!db) return [];

  return db.select({ id: orders.id, orderNumber: orders.orderNumber, establishmentId: orders.establishmentId })
    .from(orders)
    .where(and(
      eq(orders.status, 'new'),
      or(
        and(isNotNull(orders.newAt), lt(orders.newAt, cutoff)),
        and(isNull(orders.newAt), lt(orders.createdAt, cutoff))
      )
    ));
}

export async function getReadyOrdersExpiredForAutoCompletion(cutoff: Date) {
  const db = await getDb();
  if (!db) return [];

  return db.select({ id: orders.id, orderNumber: orders.orderNumber, establishmentId: orders.establishmentId })
    .from(orders)
    .where(and(
      eq(orders.status, 'ready'),
      isNotNull(orders.readyAt),
      lt(orders.readyAt, cutoff)
    ));
}

export async function autoCancelExpiredNewOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const cutoff = new Date(Date.now() - 20 * 60 * 1000);
  const now = new Date();
  const reason = 'Cancelado automaticamente: pedido novo sem aceite por mais de 20 minutos.';
  const result = await db.update(orders)
    .set({ status: 'cancelled', cancellationReason: reason, completedAt: now, updatedAt: now })
    .where(and(
      eq(orders.id, orderId),
      eq(orders.status, 'new'),
      or(
        and(isNotNull(orders.newAt), lt(orders.newAt, cutoff)),
        and(isNull(orders.newAt), lt(orders.createdAt, cutoff))
      )
    ));

  const affectedRows = (result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0;
  if (affectedRows > 0) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (order) {
      await createOrderLog({
        establishmentId: order.establishmentId,
        orderId: order.id,
        level: 'info',
        event: 'order_auto_cancelled',
        message: `Pedido ${order.orderNumber || order.id} cancelado automaticamente por permanecer em Novo por mais de 20 minutos.`,
        details: {
          previousStatus: 'new',
          newStatus: 'cancelled',
          cutoff: cutoff.toISOString(),
          reason,
        },
        source: 'automatic-order-status-job',
      });

      notifyOrderUpdate(order.establishmentId, {
        id: order.id,
        status: 'cancelled',
        updatedAt: now,
        cancellationReason: order.cancellationReason || reason,
      });
    }
    return true;
  }

  return false;
}

export async function autoCompleteExpiredReadyOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const now = new Date();
  const result = await db.update(orders)
    .set({ status: 'completed', completedAt: now, updatedAt: now })
    .where(and(
      eq(orders.id, orderId),
      eq(orders.status, 'ready'),
      isNotNull(orders.readyAt),
      lt(orders.readyAt, cutoff)
    ));

  const affectedRows = (result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0;
  if (affectedRows > 0) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (order) {
      await createOrderLog({
        establishmentId: order.establishmentId,
        orderId: order.id,
        level: 'info',
        event: 'order_auto_completed',
        message: `Pedido ${order.orderNumber || order.id} finalizado automaticamente por permanecer em Pronto por mais de 1 hora.`,
        details: {
          previousStatus: 'ready',
          newStatus: 'completed',
          cutoff: cutoff.toISOString(),
        },
        source: 'automatic-order-status-job',
      });

      notifyOrderUpdate(order.establishmentId, { id: order.id, status: 'completed', updatedAt: now });
    }
    return true;
  }

  return false;
}

// ============ DASHBOARD/STATS FUNCTIONS ============
export async function getDashboardStats(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { ordersCount: 0, revenue: 0, avgTicket: 0, lowStockCount: 0, ordersChange: 0, revenueChange: 0, avgTicketChange: 0, lowStockChange: 0 };

  // Usar timezone configurado do estabelecimento
  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  let prevPeriodStart: Date;
  let prevPeriodEnd: Date;

  if (period === 'custom' && startDate && endDate) {
    periodStart = new Date(startDate + 'T00:00:00');
    const periodEndDate = new Date(endDate + 'T23:59:59');
    const diffMs = periodEndDate.getTime() - periodStart.getTime();
    prevPeriodEnd = new Date(periodStart);
    prevPeriodStart = new Date(periodStart.getTime() - diffMs - 1000);
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
    prevPeriodEnd = new Date(periodStart);
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
    prevPeriodEnd = new Date(periodStart);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    prevPeriodStart = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
    prevPeriodEnd = new Date(periodStart);
  }

  // Usar CONVERT_TZ com o timezone IANA do estabelecimento nas queries SQL
  const periodStartStr = fmtLocalDateTime(periodStart);
  const prevPeriodStartStr = fmtLocalDateTime(prevPeriodStart);
  const prevPeriodEndStr = fmtLocalDateTime(prevPeriodEnd);

  // Executar todas as queries em paralelo para melhor performance
  const [ordersResult, prevOrdersResult, lowStockResult, recurringData] = await Promise.all([
    // Orders no período atual (usando CONVERT_TZ com timezone IANA)
    db.select({
      count: sql<number>`count(*)`,
      total: sql<number>`COALESCE(SUM(total), 0)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`,
        eq(orders.status, "completed")
      )),
    // Orders no período anterior
    db.select({
      count: sql<number>`count(*)`,
      total: sql<number>`COALESCE(SUM(total), 0)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${prevPeriodStartStr}`,
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) < ${prevPeriodEndStr}`,
        eq(orders.status, "completed")
      )),
    // Low stock count - conta apenas produtos com controle de estoque ativado (hasStock=true) e quantidade <= 0
    db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(
        eq(products.establishmentId, establishmentId),
        eq(products.hasStock, true),
        eq(products.status, 'active'),
        sql`${products.stockQuantity} IS NOT NULL AND ${products.stockQuantity} <= 0`
      )),
    // Clientes recorrentes (2+ pedidos nos últimos 30 dias por telefone)
    getRecurringCustomers(establishmentId),
  ]);

  const ordersCount = ordersResult[0]?.count ?? 0;
  const revenue = Number(ordersResult[0]?.total ?? 0);
  const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;

  const prevOrdersCount = prevOrdersResult[0]?.count ?? 0;
  const prevRevenue = Number(prevOrdersResult[0]?.total ?? 0);
  const prevAvgTicket = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

  // Calcular variação percentual
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const ordersChange = calcChange(ordersCount, prevOrdersCount);
  const revenueChange = calcChange(revenue, prevRevenue);
  const avgTicketChange = calcChange(avgTicket, prevAvgTicket);

  const lowStockCount = lowStockResult[0]?.count ?? 0;
  const lowStockChange = 0; // Sem comparação temporal para estoque

  return { ordersCount, revenue, avgTicket, lowStockCount, ordersChange, revenueChange, avgTicketChange, lowStockChange, recurringCustomers: recurringData.count, recurringPercentage: recurringData.percentage, recurringChange: recurringData.change };
}

/**
 * Calcula clientes recorrentes: clientes com 2+ pedidos nos últimos 30 dias.
 * Usa o número de telefone como identificador único do cliente.
 * Considera pedidos de todas as fontes (menu público, PDV, iFood, etc).
 * Retorna: count (total recorrentes), percentage (% sobre base ativa), change (variação vs mês anterior)
 */
export async function getRecurringCustomers(establishmentId: number) {
  const db = await getDb();
  if (!db) return { count: 0, percentage: 0, change: 0 };

  const now = new Date();

  // Últimos 30 dias
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

  // Período anterior: 60 a 30 dias atrás
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

  // Executar as 3 queries em paralelo para melhor performance
  const [currentRecurring, activeBase, prevRecurring] = await Promise.all([
    // Clientes recorrentes nos últimos 30 dias (2+ pedidos completados, agrupados por telefone)
    db.execute(sql`
      SELECT COUNT(*) as recurringCount FROM (
        SELECT ${orders.customerPhone}
        FROM ${orders}
        WHERE ${orders.establishmentId} = ${establishmentId}
          AND ${orders.status} = 'completed'
          AND ${orders.customerPhone} IS NOT NULL
          AND ${orders.customerPhone} != ''
          AND ${orders.createdAt} >= ${thirtyDaysAgoStr}
        GROUP BY ${orders.customerPhone}
        HAVING COUNT(*) >= 2
      ) as recurring
    `),
    // Total de clientes únicos (base ativa) nos últimos 30 dias
    db.execute(sql`
      SELECT COUNT(DISTINCT ${orders.customerPhone}) as activeCount
      FROM ${orders}
      WHERE ${orders.establishmentId} = ${establishmentId}
        AND ${orders.status} = 'completed'
        AND ${orders.customerPhone} IS NOT NULL
        AND ${orders.customerPhone} != ''
        AND ${orders.createdAt} >= ${thirtyDaysAgoStr}
    `),
    // Clientes recorrentes no período anterior (60 a 30 dias atrás)
    db.execute(sql`
      SELECT COUNT(*) as recurringCount FROM (
        SELECT ${orders.customerPhone}
        FROM ${orders}
        WHERE ${orders.establishmentId} = ${establishmentId}
          AND ${orders.status} = 'completed'
          AND ${orders.customerPhone} IS NOT NULL
          AND ${orders.customerPhone} != ''
          AND ${orders.createdAt} >= ${sixtyDaysAgoStr}
          AND ${orders.createdAt} < ${thirtyDaysAgoStr}
        GROUP BY ${orders.customerPhone}
        HAVING COUNT(*) >= 2
      ) as recurring
    `),
  ]);

  const count = Number((currentRecurring as any)[0]?.[0]?.recurringCount ?? 0);
  const activeCount = Number((activeBase as any)[0]?.[0]?.activeCount ?? 0);
  const prevCount = Number((prevRecurring as any)[0]?.[0]?.recurringCount ?? 0);

  const percentage = activeCount > 0 ? Math.round((count / activeCount) * 100) : 0;

  // Variação percentual vs período anterior
  let change = 0;
  if (prevCount === 0) {
    change = count > 0 ? 100 : 0;
  } else {
    change = Math.round(((count - prevCount) / prevCount) * 100);
  }

  return { count, percentage, change };
}

/**
 * Calcula a taxa de conversão: (pedidos realizados / visualizações do cardápio) × 100
 * Retorna dados do período atual e variação vs período anterior.
 */
export async function getConversionRate(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { rate: 0, orders: 0, views: 0, change: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  let prevPeriodStart: Date;
  let prevPeriodEnd: Date;

  if (period === 'custom' && startDate && endDate) {
    periodStart = new Date(startDate + 'T00:00:00');
    const periodEndDate = new Date(endDate + 'T23:59:59');
    const diffMs = periodEndDate.getTime() - periodStart.getTime();
    prevPeriodEnd = new Date(periodStart);
    prevPeriodStart = new Date(periodStart.getTime() - diffMs - 1000);
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
    prevPeriodEnd = new Date(periodStart);
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
    prevPeriodEnd = new Date(periodStart);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    prevPeriodStart = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
    prevPeriodEnd = new Date(periodStart);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);
  const prevPeriodStartStr = fmtLocalDateTime(prevPeriodStart);
  const prevPeriodEndStr = fmtLocalDateTime(prevPeriodEnd);

  // Visualizações - preparar datas
  const periodStartDate = fmtLocalDate(periodStart);
  const todayStr = fmtLocalDate(localNow);
  const todayStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  const todayStartStr = fmtLocalDateTime(todayStart);
  const prevPeriodStartDate = fmtLocalDate(prevPeriodStart);
  const prevPeriodEndDate = fmtLocalDate(prevPeriodEnd);

  // Executar todas as queries em paralelo para melhor performance
  const [ordersResult, prevOrdersResult, dailyViewsResult, todaySessionsResult, prevDailyViewsResult] = await Promise.all([
    // Pedidos completados no período atual
    db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`,
        eq(orders.status, "completed")
      )),
    // Pedidos completados no período anterior
    db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${prevPeriodStartStr}`,
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) < ${prevPeriodEndStr}`,
        eq(orders.status, "completed")
      )),
    // Views de dias anteriores (menuViewsDaily)
    db.select({ total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)` })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        sql`${menuViewsDaily.date} >= ${periodStartDate}`,
        sql`${menuViewsDaily.date} < ${todayStr}`
      )),
    // Views de hoje (menuSessions em tempo real)
    db.select({ count: sql<number>`count(*)` })
      .from(menuSessions)
      .where(and(
        eq(menuSessions.establishmentId, establishmentId),
        sql`CONVERT_TZ(${menuSessions.createdAt}, '+00:00', ${tz}) >= ${todayStartStr}`
      )),
    // Visualizações no período anterior
    db.select({ total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)` })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        sql`${menuViewsDaily.date} >= ${prevPeriodStartDate}`,
        sql`${menuViewsDaily.date} < ${prevPeriodEndDate}`
      )),
  ]);

  let currentViews = Number(dailyViewsResult[0]?.total ?? 0) + Number(todaySessionsResult[0]?.count ?? 0);

  // Se o período é apenas hoje, usar só as sessões de hoje
  if (period === 'today') {
    currentViews = Number(todaySessionsResult[0]?.count ?? 0);
  }

  const prevViews = Number(prevDailyViewsResult[0]?.total ?? 0);

  const currentOrders = ordersResult[0]?.count ?? 0;
  const prevOrders = prevOrdersResult[0]?.count ?? 0;

  // Calcular taxas
  const currentRate = currentViews > 0 ? (currentOrders / currentViews) * 100 : 0;
  const prevRate = prevViews > 0 ? (prevOrders / prevViews) * 100 : 0;

  // Calcular variação
  let change = 0;
  if (prevRate === 0) {
    change = currentRate > 0 ? 100 : 0;
  } else {
    change = Math.round(((currentRate - prevRate) / prevRate) * 100);
  }

  return {
    rate: Math.round(currentRate * 10) / 10, // 1 casa decimal
    orders: currentOrders,
    views: currentViews,
    change,
  };
}

// ============ DASHBOARD: TOP PRODUTOS ============
export async function getTopProducts(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', limit: number = 10, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { products: [] as { productName: string; totalQuantity: number; totalRevenue: number }[], totalPeriodRevenue: 0, topProductsRevenue: 0, topProductsPct: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  if (period === 'custom' && startDate && endDate) {
    periodStart = new Date(startDate + 'T00:00:00');
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);

  const result = await db.select({
    productName: orderItems.productName,
    totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
    totalRevenue: sql<number>`SUM(${orderItems.totalPrice})`,
  })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.status, 'completed'),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`
    ))
    .groupBy(orderItems.productName)
    .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
    .limit(limit);

  // Faturamento total do período (todos os produtos, não só top)
  const totalRevenueResult = await db.select({
    total: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
  })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.status, 'completed'),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`
    ));

  const totalPeriodRevenue = Number(totalRevenueResult[0]?.total ?? 0);
  const topProductsRevenue = result.reduce((sum, r) => sum + Number(r.totalRevenue), 0);
  const topProductsPct = totalPeriodRevenue > 0 ? Math.round((topProductsRevenue / totalPeriodRevenue) * 100) : 0;

  return {
    products: result.map((r) => ({
      productName: r.productName,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: Number(r.totalRevenue),
    })),
    totalPeriodRevenue,
    topProductsRevenue,
    topProductsPct,
  };
}

// ============ DASHBOARD: PEDIDOS POR MODALIDADE ============
export async function getOrdersByDeliveryType(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  if (period === 'custom' && startDate && endDate) {
    periodStart = new Date(startDate + 'T00:00:00');
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);

  const result = await db.select({
    deliveryType: orders.deliveryType,
    count: sql<number>`COUNT(*)`,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.status, 'completed'),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`
    ))
    .groupBy(orders.deliveryType);

  const labels: Record<string, string> = {
    delivery: 'Entrega',
    pickup: 'Retirada',
    dine_in: 'Consumo no local',
  };

  return result.map((r) => ({
    deliveryType: r.deliveryType,
    label: labels[r.deliveryType] || r.deliveryType,
    count: Number(r.count),
  }));
}

// ============ DASHBOARD: TEMPO MÉDIO DE PREPARO ============
export async function getAvgPrepTime(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { avgMinutes: 0, totalOrders: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  if (period === 'custom' && startDate && endDate) {
    periodStart = new Date(startDate + 'T00:00:00');
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);

  const result = await db.select({
    avgSeconds: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt}))`,
    totalOrders: sql<number>`COUNT(*)`,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.acceptedAt} IS NOT NULL`,
      sql`${orders.readyAt} IS NOT NULL`,
      sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${periodStartStr}`
    ));

  const avgSeconds = Number(result[0]?.avgSeconds ?? 0);
  const totalOrders = Number(result[0]?.totalOrders ?? 0);

  return {
    avgMinutes: totalOrders > 0 ? Math.round(avgSeconds / 60) : 0,
    totalOrders,
  };
}

// ============ DASHBOARD: TEMPO MÉDIO DE PREPARO - TENDÊNCIA ============
export async function getAvgPrepTimeTrend(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { trend: [], previousAvg: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  // Para sparkline: buscar dados dos últimos 7 dias sempre
  const daysBack = 7;
  const trendStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysBack);
  const trendStartStr = fmtLocalDateTime(trendStart);

  // Buscar média por dia nos últimos 7 dias (tempo de preparo: acceptedAt → readyAt)
  const trendResult: any[] = await db.execute(
    sql`SELECT
      DATE(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz})) as day,
      AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt})) as avgSeconds,
      COUNT(*) as totalOrders
    FROM ${orders}
    WHERE ${orders.establishmentId} = ${establishmentId}
      AND ${orders.acceptedAt} IS NOT NULL
      AND ${orders.readyAt} IS NOT NULL
      AND CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${trendStartStr}
    GROUP BY DATE(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}))
    ORDER BY day ASC`
  );

  const rows = Array.isArray(trendResult) ? (Array.isArray(trendResult[0]) ? trendResult[0] : trendResult) : [];
  const trend = rows.map((r: any) => ({
    day: String(r.day),
    avgMinutes: r.totalOrders > 0 ? Math.round(Number(r.avgSeconds) / 60) : 0,
    totalOrders: Number(r.totalOrders),
  }));

  // Calcular média do período anterior para insight de comparação
  let previousAvg = 0;
  if (period === 'today' && trend.length >= 2) {
    // Comparar com ontem
    const yesterday = trend[trend.length - 2];
    previousAvg = yesterday?.avgMinutes ?? 0;
  } else if (period === 'week') {
    // Comparar com semana anterior (média dos 7 dias antes)
    const prevWeekStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 14);
    const prevWeekEnd = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 7);
    const prevStartStr = fmtLocalDateTime(prevWeekStart);
    const prevEndStr = fmtLocalDateTime(prevWeekEnd);
    const prevResult = await db.select({
      avgSeconds: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt}))`,
    }).from(orders).where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.acceptedAt} IS NOT NULL`,
      sql`${orders.readyAt} IS NOT NULL`,
      sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${prevStartStr}`,
      sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) < ${prevEndStr}`
    ));
    previousAvg = Math.round(Number(prevResult[0]?.avgSeconds ?? 0) / 60);
  } else if (period === 'month') {
    // Comparar com mês anterior
    const prevMonthStart = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
    const prevMonthEnd = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    const prevStartStr = fmtLocalDateTime(prevMonthStart);
    const prevEndStr = fmtLocalDateTime(prevMonthEnd);
    const prevResult = await db.select({
      avgSeconds: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt}))`,
    }).from(orders).where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.acceptedAt} IS NOT NULL`,
      sql`${orders.readyAt} IS NOT NULL`,
      sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${prevStartStr}`,
      sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) < ${prevEndStr}`
    ));
    previousAvg = Math.round(Number(prevResult[0]?.avgSeconds ?? 0) / 60);
  }

  return { trend, previousAvg };
}

// ============ DASHBOARD: CLIENTES RECORRENTES vs NOVOS ============
export async function getCustomerInsights(establishmentId: number) {
  const db = await getDb();
  if (!db) return { recurringPct: 0, newPct: 0, totalCustomers: 0, recurringCount: 0, newCount: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  // Últimos 30 dias
  const thirtyDaysAgo = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 30);
  const thirtyDaysAgoStr = fmtLocalDateTime(thirtyDaysAgo);

  // Buscar todos os clientes únicos (por telefone) que fizeram pedidos nos últimos 30 dias
  // e contar quantos pedidos cada um fez
  const result = await db.select({
    customerPhone: orders.customerPhone,
    orderCount: sql<number>`COUNT(*)`,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.status, 'completed'),
      sql`${orders.customerPhone} IS NOT NULL`,
      sql`${orders.customerPhone} != ''`,
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
    ))
    .groupBy(orders.customerPhone);

  const totalCustomers = result.length;
  if (totalCustomers === 0) {
    return { recurringPct: 0, newPct: 0, totalCustomers: 0, recurringCount: 0, newCount: 0 };
  }

  // Recorrente = 2+ pedidos nos últimos 30 dias
  const recurringCount = result.filter(r => Number(r.orderCount) >= 2).length;
  const newCount = totalCustomers - recurringCount;

  return {
    recurringPct: Math.round((recurringCount / totalCustomers) * 100),
    newPct: Math.round((newCount / totalCustomers) * 100),
    totalCustomers,
    recurringCount,
    newCount,
  };
}

export async function getRevenueByHour(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const todayLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());

  const parseLocalDateOnly = (value: string): Date => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getHourFromTime = (time: string | null | undefined): number | null => {
    if (!time) return null;
    const hour = Number(time.slice(0, 2));
    return Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : null;
  };

  const previousDayOfWeek = (dayOfWeek: number) => dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const isHourInsideBusinessHours = (date: Date, hour: number, hours: BusinessHours[]): boolean => {
    const dayOfWeek = date.getDay();

    // Horários do próprio dia. Quando cruza meia-noite, o dia atual cobre a parte da abertura até 23:00.
    for (const schedule of hours.filter(h => h.dayOfWeek === dayOfWeek && h.isActive)) {
      const openHour = getHourFromTime(schedule.openTime);
      const closeHour = getHourFromTime(schedule.closeTime);
      if (openHour === null || closeHour === null) continue;

      if (closeHour < openHour) {
        if (hour >= openHour) return true;
      } else if (hour >= openHour && hour <= closeHour) {
        return true;
      }
    }

    // Parte da madrugada pertencente ao expediente do dia anterior, quando fecha após meia-noite.
    const yesterday = previousDayOfWeek(dayOfWeek);
    for (const schedule of hours.filter(h => h.dayOfWeek === yesterday && h.isActive)) {
      const openHour = getHourFromTime(schedule.openTime);
      const closeHour = getHourFromTime(schedule.closeTime);
      if (openHour === null || closeHour === null) continue;

      if (closeHour < openHour && hour <= closeHour) return true;
    }

    return false;
  };

  const buildHourOrder = (activeHours: Set<number>, hours: BusinessHours[]): number[] => {
    if (activeHours.size === 0) return [];

    const firstOpeningHour = hours
      .filter(h => h.isActive)
      .map(h => getHourFromTime(h.openTime))
      .filter((hour): hour is number => hour !== null)
      .sort((a, b) => a - b)[0];

    if (firstOpeningHour === undefined) {
      return Array.from(activeHours).sort((a, b) => a - b);
    }

    const ordered: number[] = [];
    for (let offset = 0; offset < 24; offset++) {
      const hour = (firstOpeningHour + offset) % 24;
      if (activeHours.has(hour)) ordered.push(hour);
    }
    return ordered;
  };

  let startStr: string;
  let endStr: string;
  let startLocalDate: Date;
  let endLocalDate: Date;

  if (period === 'custom' && startDate && endDate) {
    startLocalDate = parseLocalDateOnly(startDate);
    endLocalDate = parseLocalDateOnly(endDate);
    startStr = `${startDate} 00:00:00`;
    endStr = `${endDate} 23:59:59`;
  } else if (period === 'today') {
    startLocalDate = todayLocal;
    endLocalDate = todayLocal;
    startStr = fmtLocalDateTime(todayLocal);
    const todayEnd = new Date(todayLocal);
    todayEnd.setHours(23, 59, 59, 999);
    endStr = fmtLocalDateTime(todayEnd);
  } else if (period === 'week') {
    const weekStart = new Date(todayLocal);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    startLocalDate = weekStart;
    endLocalDate = todayLocal;
    startStr = fmtLocalDateTime(weekStart);
    const todayEnd = new Date(todayLocal);
    todayEnd.setHours(23, 59, 59, 999);
    endStr = fmtLocalDateTime(todayEnd);
  } else {
    const monthStart = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 1);
    startLocalDate = monthStart;
    endLocalDate = todayLocal;
    startStr = fmtLocalDateTime(monthStart);
    const todayEnd = new Date(todayLocal);
    todayEnd.setHours(23, 59, 59, 999);
    endStr = fmtLocalDateTime(todayEnd);
  }

  try {
    const businessHoursRows = await getBusinessHoursByEstablishment(establishmentId);
    const activeHours = new Set<number>();

    for (const current = new Date(startLocalDate); current <= endLocalDate; current.setDate(current.getDate() + 1)) {
      for (let hour = 0; hour < 24; hour++) {
        if (isHourInsideBusinessHours(current, hour, businessHoursRows)) {
          activeHours.add(hour);
        }
      }
    }

    const result = await db.select({
      localDate: sql<string>`DATE_FORMAT(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}), '%Y-%m-%d')`,
      hour: sql<number>`HOUR(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`,
      revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
      orderCount: sql<number>`COUNT(*)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${startStr}`,
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) <= ${endStr}`,
        eq(orders.status, 'completed')
      ))
      .groupBy(
        sql`DATE_FORMAT(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}), '%Y-%m-%d')`,
        sql`HOUR(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`
      );

    const revenueByHour = new Map<number, { revenue: number; orderCount: number }>();

    for (const row of result) {
      const localDate = parseLocalDateOnly(row.localDate);
      const hour = Number(row.hour);
      if (activeHours.size > 0 && !isHourInsideBusinessHours(localDate, hour, businessHoursRows)) {
        continue;
      }

      const current = revenueByHour.get(hour) || { revenue: 0, orderCount: 0 };
      current.revenue += Number(row.revenue);
      current.orderCount += Number(row.orderCount);
      revenueByHour.set(hour, current);
    }

    const hourOrder = activeHours.size > 0
      ? buildHourOrder(activeHours, businessHoursRows)
      : Array.from(revenueByHour.keys()).sort((a, b) => a - b);

    return hourOrder.map(hour => {
      const values = revenueByHour.get(hour) || { revenue: 0, orderCount: 0 };
      return {
        hour,
        revenue: values.revenue,
        orderCount: values.orderCount,
      };
    });
  } catch (e) {
    logger.error('[getRevenueByHour] Failed query:', e);
    return [];
  }
}

export async function getWeeklyStats(establishmentId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return { current: [], previous: [] };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const todayLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());

  // Período atual
  const periodStartLocal = new Date(todayLocal);
  periodStartLocal.setDate(periodStartLocal.getDate() - days);
  const periodStartStr = fmtLocalDateTime(periodStartLocal);

  // Período anterior (para comparação)
  const prevPeriodStartLocal = new Date(periodStartLocal);
  prevPeriodStartLocal.setDate(prevPeriodStartLocal.getDate() - days);
  const prevPeriodStartStr = fmtLocalDateTime(prevPeriodStartLocal);

  const [current, previous] = await Promise.all([
    db.select({
      date: sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(SUM(total), 0)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`,
        eq(orders.status, "completed")
      ))
      .groupBy(sql`DATE(CONVERT_TZ(createdAt, '+00:00', ${tz}))`)
      .orderBy(sql`DATE(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
    db.select({
      date: sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(SUM(total), 0)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${prevPeriodStartStr}`,
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) < ${periodStartStr}`,
        eq(orders.status, "completed")
      ))
      .groupBy(sql`DATE(CONVERT_TZ(createdAt, '+00:00', ${tz}))`)
      .orderBy(sql`DATE(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
  ]);

  return { current, previous };
}

export async function getRecentOrders(establishmentId: number, limit: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const recentOrders = await db.select().from(orders)
    .where(eq(orders.establishmentId, establishmentId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    recentOrders.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return ordersWithItems;
}

export async function getWeeklyRevenue(establishmentId: number) {
  const db = await getDb();
  if (!db) return { thisWeek: [], lastWeek: [], thisWeekTotal: 0, lastWeekTotal: 0, thisWeekOrders: [], lastWeekOrders: [], thisWeekTotalOrders: 0, lastWeekTotalOrders: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const currentDay = localNow.getDay();

  // "thisWeek" = semana ATUAL (segunda até agora)
  // Encontrar a segunda-feira da semana ATUAL
  const currentWeekMonday = new Date(localNow);
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  currentWeekMonday.setDate(localNow.getDate() - daysFromMonday);
  currentWeekMonday.setHours(0, 0, 0, 0);

  // thisWeek = semana atual: segunda atual até agora
  const thisWeekStart = new Date(currentWeekMonday);

  const thisWeekEnd = new Date(localNow); // agora
  thisWeekEnd.setHours(23, 59, 59, 999);

  // lastWeek = semana anterior (para comparação): segunda passada até domingo passado
  const lastWeekStart = new Date(currentWeekMonday);
  lastWeekStart.setDate(currentWeekMonday.getDate() - 7);

  const lastWeekEnd = new Date(currentWeekMonday);
  lastWeekEnd.setMilliseconds(-1); // domingo passado 23:59:59.999

  const thisWeekStartStr = fmtLocalDateTime(thisWeekStart);
  const thisWeekEndStr = fmtLocalDateTime(thisWeekEnd);
  const lastWeekStartStr = fmtLocalDateTime(lastWeekStart);
  const lastWeekEndStr = fmtLocalDateTime(lastWeekEnd);

  const [thisWeekResult, lastWeekResult] = await Promise.all([
    db.select({
      dayOfWeek: sql<number>`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
      revenue: sql<number>`COALESCE(SUM(total), 0)`,
      orderCount: sql<number>`COUNT(*)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${thisWeekStartStr}`,
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) <= ${thisWeekEndStr}`,
        eq(orders.status, "completed")
      ))
      .groupBy(sql`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
    db.select({
      dayOfWeek: sql<number>`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
      revenue: sql<number>`COALESCE(SUM(total), 0)`,
      orderCount: sql<number>`COUNT(*)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${lastWeekStartStr}`,
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) <= ${lastWeekEndStr}`,
        eq(orders.status, "completed")
      ))
      .groupBy(sql`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
  ]);

  const mapDayOfWeek = (mysqlDay: number) => {
    return mysqlDay === 1 ? 6 : mysqlDay - 2;
  };

  const thisWeek = [0, 0, 0, 0, 0, 0, 0];
  const lastWeek = [0, 0, 0, 0, 0, 0, 0];
  const thisWeekOrders = [0, 0, 0, 0, 0, 0, 0];
  const lastWeekOrders = [0, 0, 0, 0, 0, 0, 0];

  for (const row of thisWeekResult) {
    const dayIndex = mapDayOfWeek(row.dayOfWeek);
    if (dayIndex >= 0 && dayIndex < 7) {
      thisWeek[dayIndex] = Number(row.revenue);
      thisWeekOrders[dayIndex] = Number(row.orderCount);
    }
  }

  for (const row of lastWeekResult) {
    const dayIndex = mapDayOfWeek(row.dayOfWeek);
    if (dayIndex >= 0 && dayIndex < 7) {
      lastWeek[dayIndex] = Number(row.revenue);
      lastWeekOrders[dayIndex] = Number(row.orderCount);
    }
  }

  const thisWeekTotal = thisWeek.reduce((sum, val) => sum + val, 0);
  const lastWeekTotal = lastWeek.reduce((sum, val) => sum + val, 0);
  const thisWeekTotalOrders = thisWeekOrders.reduce((sum, val) => sum + val, 0);
  const lastWeekTotalOrders = lastWeekOrders.reduce((sum, val) => sum + val, 0);

  return { thisWeek, lastWeek, thisWeekTotal, lastWeekTotal, thisWeekOrders, lastWeekOrders, thisWeekTotalOrders, lastWeekTotalOrders };
}


/**
 * Busca dados de faturamento filtrados por período (today, week, month)
 * Retorna dados do período atual e anterior para comparação
 */
export async function getRevenueByPeriod(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'week', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { thisWeek: [], lastWeek: [], thisWeekTotal: 0, lastWeekTotal: 0, thisWeekOrders: [] as number[], lastWeekOrders: [] as number[], thisWeekTotalOrders: 0, lastWeekTotalOrders: 0, periodLabel: 'Esta semana', comparisonLabel: 'Semana passada' };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  if (period === 'custom' && startDate && endDate) {
    const customStartDate = new Date(startDate + 'T00:00:00');
    const customEndDate = new Date(endDate + 'T23:59:59');
    const diffDays = Math.round((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(customStartDate.getTime() - (diffDays + 1) * 24 * 60 * 60 * 1000);

    const startStr = fmtLocalDateTime(customStartDate);
    const endStr = fmtLocalDateTime(customEndDate);
    const prevStartStr = fmtLocalDateTime(prevStart);
    const prevEndStr = fmtLocalDateTime(new Date(customStartDate.getTime() - 1000));

    // Query grouped by day-of-week (DAYOFWEEK) for the bar chart + comparison period
    const [currentByDow, prevByDow, currentTotals, prevTotals] = await Promise.all([
      db.select({
        dayOfWeek: sql<number>`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`,
        orderCount: sql<number>`COUNT(*)`
      }).from(orders).where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${startStr}`,
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) <= ${endStr}`
      )).groupBy(sql`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
      db.select({
        dayOfWeek: sql<number>`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`,
        orderCount: sql<number>`COUNT(*)`
      }).from(orders).where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${prevStartStr}`,
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) <= ${prevEndStr}`
      )).groupBy(sql`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
      db.select({
        total: sql<number>`COALESCE(SUM(total), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(orders).where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${startStr}`,
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) <= ${endStr}`
      )),
      db.select({
        total: sql<number>`COALESCE(SUM(total), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(orders).where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${prevStartStr}`,
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) <= ${prevEndStr}`
      )),
    ]);

    // Map MySQL DAYOFWEEK (1=Sun..7=Sat) to Mon=0..Sun=6
    const mapDow = (mysqlDay: number) => mysqlDay === 1 ? 6 : mysqlDay - 2;

    const thisWeek = [0, 0, 0, 0, 0, 0, 0];
    const lastWeek = [0, 0, 0, 0, 0, 0, 0];
    const thisWeekOrders = [0, 0, 0, 0, 0, 0, 0];
    const lastWeekOrders = [0, 0, 0, 0, 0, 0, 0];

    for (const row of currentByDow) {
      const idx = mapDow(row.dayOfWeek);
      if (idx >= 0 && idx < 7) {
        thisWeek[idx] = Number(row.revenue);
        thisWeekOrders[idx] = Number(row.orderCount);
      }
    }
    for (const row of prevByDow) {
      const idx = mapDow(row.dayOfWeek);
      if (idx >= 0 && idx < 7) {
        lastWeek[idx] = Number(row.revenue);
        lastWeekOrders[idx] = Number(row.orderCount);
      }
    }

    const thisWeekTotal = Number(currentTotals[0]?.total ?? 0);
    const lastWeekTotal = Number(prevTotals[0]?.total ?? 0);
    const thisWeekTotalOrders = Number(currentTotals[0]?.count ?? 0);
    const lastWeekTotalOrders = Number(prevTotals[0]?.count ?? 0);

    // Determine current day index for highlighting
    const todayDow = localNow.getDay(); // 0=Sun..6=Sat
    const todayIdx = todayDow === 0 ? 6 : todayDow - 1; // Mon=0..Sun=6

    return {
      thisWeek,
      lastWeek,
      thisWeekTotal,
      lastWeekTotal,
      thisWeekOrders,
      lastWeekOrders,
      thisWeekTotalOrders,
      lastWeekTotalOrders,
      periodLabel: `${startDate.split('-').reverse().slice(0, 2).join('/')} a ${endDate.split('-').reverse().slice(0, 2).join('/')}`,
      comparisonLabel: 'Per\u00edodo anterior',
      mode: 'daily' as const,
      currentIndex: todayIdx,
    };
  } else if (period === 'today') {
    const todayStart = new Date(localNow);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const todayStartStr = fmtLocalDateTime(todayStart);
    const yesterdayStartStr = fmtLocalDateTime(yesterdayStart);

    const [todayResult, yesterdayResult] = await Promise.all([
      db.select({
        hour: sql<number>`HOUR(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`
      })
        .from(orders)
        .where(and(
          eq(orders.establishmentId, establishmentId),
          sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${todayStartStr}`,
          eq(orders.status, "completed")
        ))
        .groupBy(sql`HOUR(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
      db.select({
        hour: sql<number>`HOUR(CONVERT_TZ(createdAt, '+00:00', ${tz}))`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`
      })
        .from(orders)
        .where(and(
          eq(orders.establishmentId, establishmentId),
          sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${yesterdayStartStr}`,
          sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) < ${todayStartStr}`,
          eq(orders.status, "completed")
        ))
        .groupBy(sql`HOUR(CONVERT_TZ(createdAt, '+00:00', ${tz}))`),
    ]);

    const currentHour = localNow.getHours();
    const todayData = Array(24).fill(0);
    const yesterdayData = Array(24).fill(0);

    for (const row of todayResult) {
      if (row.hour >= 0 && row.hour < 24) todayData[row.hour] = Number(row.revenue);
    }
    for (const row of yesterdayResult) {
      if (row.hour >= 0 && row.hour < 24) yesterdayData[row.hour] = Number(row.revenue);
    }

    const todayTotal = todayData.reduce((sum, val) => sum + val, 0);
    const yesterdayTotal = yesterdayData.reduce((sum, val) => sum + val, 0);

    return {
      thisWeek: todayData,
      lastWeek: yesterdayData,
      thisWeekTotal: todayTotal,
      lastWeekTotal: yesterdayTotal,
      thisWeekOrders: [] as number[],
      lastWeekOrders: [] as number[],
      thisWeekTotalOrders: 0,
      lastWeekTotalOrders: 0,
      periodLabel: 'Hoje',
      comparisonLabel: 'Ontem',
      mode: 'hourly' as const,
      currentIndex: currentHour,
    };
  } else if (period === 'month') {
    const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const months: { start: Date; end: Date; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(localNow.getFullYear(), localNow.getMonth() - i, 1);
      const mEnd = new Date(localNow.getFullYear(), localNow.getMonth() - i + 1, 1);
      mEnd.setMilliseconds(-1);
      months.push({
        start: mStart,
        end: mEnd,
        label: MONTH_NAMES_SHORT[mStart.getMonth()],
      });
    }

    const sixMonthsAgoStr = fmtLocalDateTime(months[0].start);

    const monthlyResult = await db.select({
      yearMonth: sql<string>`DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', ${tz}), '%Y-%m')`,
      revenue: sql<number>`COALESCE(SUM(total), 0)`
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        sql`CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${sixMonthsAgoStr}`,
        eq(orders.status, "completed")
      ))
      .groupBy(sql`DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', ${tz}), '%Y-%m')`);

    const revenueByMonth: Record<string, number> = {};
    for (const row of monthlyResult) {
      revenueByMonth[row.yearMonth] = Number(row.revenue);
    }

    const monthData = months.map(m => {
      const key = `${m.start.getFullYear()}-${String(m.start.getMonth() + 1).padStart(2, '0')}`;
      return revenueByMonth[key] || 0;
    });

    const monthLabels = months.map(m => m.label);

    // Mês atual = último do array (index 5)
    const currentMonthTotal = monthData[5];
    // Mês anterior = penúltimo (index 4)
    const previousMonthTotal = monthData[4];
    // Total dos 6 meses
    const totalSixMonths = monthData.reduce((sum, val) => sum + val, 0);

    return {
      thisWeek: monthData,
      lastWeek: monthData.map(() => 0), // sem comparação por barra individual
      thisWeekTotal: currentMonthTotal,
      lastWeekTotal: previousMonthTotal,
      thisWeekOrders: [] as number[],
      lastWeekOrders: [] as number[],
      thisWeekTotalOrders: 0,
      lastWeekTotalOrders: 0,
      periodLabel: 'Este mês',
      comparisonLabel: 'Mês anterior',
      mode: 'monthly' as const,
      currentIndex: 5, // último mês (atual)
      monthLabels,
    };
  } else {
    // Semana: manter comportamento original
    return {
      ...(await getWeeklyRevenue(establishmentId)),
      periodLabel: 'Esta semana',
      comparisonLabel: 'Semana passada',
      mode: 'daily' as const,
      currentIndex: undefined,
    };
  }
}

// ============ STOCK CATEGORY FUNCTIONS ============
export async function getStockCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [cat] = await db.select().from(stockCategories).where(eq(stockCategories.id, id)).limit(1);
  return cat || null;
}

export async function getStockCategoriesByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(stockCategories)
    .where(eq(stockCategories.establishmentId, establishmentId))
    .orderBy(asc(stockCategories.sortOrder));
}

export async function createStockCategory(data: InsertStockCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(stockCategories).values(data);
  return result[0].insertId;
}

export async function updateStockCategory(id: number, data: Partial<InsertStockCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(stockCategories).set(data).where(eq(stockCategories.id, id));
}

export async function deleteStockCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(stockCategories).where(eq(stockCategories.id, id));
}

// ============ STOCK ITEM FUNCTIONS ============
export async function getStockItemsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    categoryId?: number;
    status?: "ok" | "low" | "critical" | "out_of_stock";
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(stockItems.establishmentId, establishmentId)];

  if (filters?.search) {
    conditions.push(like(stockItems.name, `%${escapeLike(filters.search)}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(stockItems.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(stockItems.status, filters.status));
  }

  return db.select().from(stockItems)
    .where(and(...conditions))
    .orderBy(asc(stockItems.name));
}

export async function getOutOfStockCount(establishmentId: number): Promise<{ count: number }> {
  const db = await getDb();
  if (!db) return { count: 0 };
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(stockItems)
    .where(and(
      eq(stockItems.establishmentId, establishmentId),
      eq(stockItems.isActive, true),
      sql`CAST(${stockItems.currentQuantity} AS DECIMAL(10,2)) <= 0`
    ));
  return { count: Number(result[0]?.count || 0) };
}

export async function getStockItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(stockItems).where(eq(stockItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStockItemByLinkedProductId(productId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(stockItems)
    .where(eq(stockItems.linkedProductId, productId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStockItemsByLinkedProductIds(productIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (productIds.length === 0) return [];

  return db.select().from(stockItems)
    .where(inArray(stockItems.linkedProductId, productIds));
}

export async function createStockItem(data: InsertStockItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate initial status based on quantity
  const status = calculateStockStatus(
    Number(data.currentQuantity || 0),
    Number(data.minQuantity || 0),
    data.maxQuantity ? Number(data.maxQuantity) : undefined
  );

  const result = await db.insert(stockItems).values({ ...data, status });
  return result[0].insertId;
}

export async function updateStockItem(id: number, data: Partial<InsertStockItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If quantity is being updated, recalculate status
  if (data.currentQuantity !== undefined || data.minQuantity !== undefined) {
    const existing = await getStockItemById(id);
    if (existing) {
      const currentQty = data.currentQuantity !== undefined ? Number(data.currentQuantity) : Number(existing.currentQuantity);
      const minQty = data.minQuantity !== undefined ? Number(data.minQuantity) : Number(existing.minQuantity);
      const maxQty = data.maxQuantity !== undefined ? Number(data.maxQuantity) : (existing.maxQuantity ? Number(existing.maxQuantity) : undefined);
      data.status = calculateStockStatus(currentQty, minQty, maxQty);
    }
  }

  await db.update(stockItems).set(data).where(eq(stockItems.id, id));

  // Sincronizar stockQuantity do produto vinculado se quantidade foi alterada
  if (data.currentQuantity !== undefined) {
    await syncProductStockQuantity(id);
  }
}

export async function deleteStockItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Also delete all movements for this item
  await db.delete(stockMovements).where(eq(stockMovements.stockItemId, id));
  await db.delete(stockItems).where(eq(stockItems.id, id));
}

function calculateStockStatus(
  currentQty: number,
  minQty: number,
  maxQty?: number
): "ok" | "low" | "critical" | "out_of_stock" {
  if (currentQty <= 0) return "out_of_stock";
  if (currentQty <= minQty * 0.5) return "critical";
  if (currentQty <= minQty) return "low";
  return "ok";
}

/**
 * Sincroniza o campo stockQuantity do produto vinculado com o currentQuantity do stockItem.
 * Também sincroniza o produto e o stockItem da versão oposta (draft/published)
 * para manter o estoque consistente entre catálogo administrativo e menu público.
 * Chamada automaticamente após qualquer alteração de quantidade no estoque.
 */
async function syncProductStockQuantity(stockItemId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const item = await getStockItemById(stockItemId);
    if (!item || !item.linkedProductId) return;

    const newQty = Number(item.currentQuantity);

    await db.update(products)
      .set({ stockQuantity: newQty })
      .where(eq(products.id, item.linkedProductId));

    logger.info(`[Estoque] Sincronizado stockQuantity do produto ${item.linkedProductId} para ${item.currentQuantity}`);

    const product = await getProductById(item.linkedProductId);
    if (!product) return;

    if (product.version === 'draft' && product.publishedSourceId) {
      await db.update(products)
        .set({ stockQuantity: newQty })
        .where(eq(products.id, product.publishedSourceId));

      const [publishedStockItem] = await db.select()
        .from(stockItems)
        .where(eq(stockItems.linkedProductId, product.publishedSourceId))
        .limit(1);

      if (publishedStockItem && publishedStockItem.id !== stockItemId) {
        await db.update(stockItems)
          .set({
            currentQuantity: String(newQty),
            status: calculateStockStatus(
              newQty,
              Number(publishedStockItem.minQuantity),
              publishedStockItem.maxQuantity ? Number(publishedStockItem.maxQuantity) : undefined,
            ),
          })
          .where(eq(stockItems.id, publishedStockItem.id));
        logger.info(`[Estoque] StockItem published (ID=${publishedStockItem.id}) sincronizado para qty=${newQty}`);
      }
    } else if (product.version === 'published') {
      const [draftProduct] = await db.select({ id: products.id })
        .from(products)
        .where(and(
          eq(products.publishedSourceId, item.linkedProductId),
          eq(products.version, 'draft'),
          eq(products.establishmentId, product.establishmentId),
        ))
        .limit(1);

      if (draftProduct) {
        await db.update(products)
          .set({ stockQuantity: newQty })
          .where(eq(products.id, draftProduct.id));

        const [draftStockItem] = await db.select()
          .from(stockItems)
          .where(eq(stockItems.linkedProductId, draftProduct.id))
          .limit(1);

        if (draftStockItem && draftStockItem.id !== stockItemId) {
          await db.update(stockItems)
            .set({
              currentQuantity: String(newQty),
              status: calculateStockStatus(
                newQty,
                Number(draftStockItem.minQuantity),
                draftStockItem.maxQuantity ? Number(draftStockItem.maxQuantity) : undefined,
              ),
            })
            .where(eq(stockItems.id, draftStockItem.id));
          logger.info(`[Estoque] StockItem draft (ID=${draftStockItem.id}) sincronizado para qty=${newQty}`);
        }
      }
    }

    invalidatePublicMenuCache(product.establishmentId);
  } catch (error) {
    logger.error('[Estoque] Erro ao sincronizar stockQuantity:', error);
  }
}

// ============ STOCK MOVEMENT FUNCTIONS ============
export async function addStockMovement(data: InsertStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current item
  const item = await getStockItemById(data.stockItemId);
  if (!item) throw new Error("Stock item not found");

  const previousQty = Number(item.currentQuantity);
  let newQty: number;
  const movementQty = Number(data.quantity);

  if (data.type === "entry") {
    newQty = previousQty + movementQty;
  } else if (data.type === "exit" || data.type === "loss") {
    newQty = Math.max(0, previousQty - movementQty);
  } else {
    // adjustment - quantity is the new absolute value
    newQty = movementQty;
  }

  // Insert movement record
  const result = await db.insert(stockMovements).values({
    ...data,
    previousQuantity: previousQty.toString(),
    newQuantity: newQty.toString(),
  });

  // Update item quantity and status
  const status = calculateStockStatus(newQty, Number(item.minQuantity), item.maxQuantity ? Number(item.maxQuantity) : undefined);
  await db.update(stockItems)
    .set({ currentQuantity: newQty.toString(), status })
    .where(eq(stockItems.id, data.stockItemId));

  // Sincronizar stockQuantity do produto vinculado
  await syncProductStockQuantity(data.stockItemId);

  return result[0].insertId;
}

export async function getStockMovementsByItem(stockItemId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(stockMovements)
    .where(eq(stockMovements.stockItemId, stockItemId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

/**
 * Desconta automaticamente o estoque dos itens vinculados quando um pedido é confirmado/completado.
 * Para cada item do pedido, verifica se existe um stockItem vinculado ao productId
 * e cria uma movimentação de saída.
 */
export async function deductStockForOrder(orderId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar itens do pedido
    const items = await getOrderItems(orderId);
    if (items.length === 0) return;

    // Buscar productIds dos itens
    const productIds = items.map(i => i.productId).filter(Boolean);
    if (productIds.length === 0) return;

    // ===== 1. ESTOQUE AVANÇADO (tabela stockItems com movimentações) =====
    // Nota: addStockMovement já chama syncProductStockQuantity que sincroniza
    // o campo stockQuantity do produto vinculado. Por isso, para produtos com
    // stockItem vinculado, NÃO descontamos o estoque simples separadamente.
    const linkedStockItems = await getStockItemsByLinkedProductIds(productIds);
    const productsWithLinkedStock = new Set<number>();

    if (linkedStockItems.length > 0) {
      const stockMap = new Map<number, typeof linkedStockItems[0]>();
      for (const si of linkedStockItems) {
        if (si.linkedProductId) {
          stockMap.set(si.linkedProductId, si);
          productsWithLinkedStock.add(si.linkedProductId);
        }
      }

      for (const orderItem of items) {
        const stockItem = stockMap.get(orderItem.productId);
        if (!stockItem) continue;

        await addStockMovement({
          stockItemId: stockItem.id,
          type: "exit",
          quantity: String(orderItem.quantity),
          previousQuantity: stockItem.currentQuantity,
          newQuantity: String(Math.max(0, Number(stockItem.currentQuantity) - orderItem.quantity)),
          reason: `Pedido #${orderId}`,
          orderId: orderId,
        });

        logger.info(`[Estoque] Descontado ${orderItem.quantity}x "${orderItem.productName}" do estoque avançado (item ${stockItem.id})`);
      }
    }

    // ===== 2. ESTOQUE SIMPLES DE PRODUTOS (campo stockQuantity em products) =====
    // Só para produtos SEM stockItem vinculado (evita dupla contagem com syncProductStockQuantity)
    for (const orderItem of items) {
      if (productsWithLinkedStock.has(orderItem.productId)) continue;

      const product = await getProductById(orderItem.productId);
      if (product && product.hasStock && product.stockQuantity !== null && product.stockQuantity > 0) {
        const newQty = Math.max(0, product.stockQuantity - orderItem.quantity);
        await updateProduct(orderItem.productId, { stockQuantity: newQty });
        logger.info(`[Estoque] Descontado ${orderItem.quantity}x "${orderItem.productName}" do estoque simples (${product.stockQuantity} -> ${newQty})`);

        // Sincronizar estoque com a versão draft correspondente
        try {
          const dbInstance = await getDb();
          if (dbInstance && product.version === 'published') {
            // Buscar o draft que aponta para este published (via publishedSourceId)
            const [draftProduct] = await dbInstance.select({ id: products.id, stockQuantity: products.stockQuantity })
              .from(products)
              .where(and(
                eq(products.publishedSourceId, orderItem.productId),
                eq(products.version, 'draft'),
                eq(products.establishmentId, product.establishmentId),
              ))
              .limit(1);
            if (draftProduct) {
              await updateProduct(draftProduct.id, { stockQuantity: newQty });
              logger.info(`[Estoque] Sincronizado draft ID=${draftProduct.id} para qty=${newQty}`);
            }
          } else if (dbInstance && product.version === 'draft' && product.publishedSourceId) {
            // Se descontou do draft, sincronizar com o published
            const pubProduct = await getProductById(product.publishedSourceId);
            if (pubProduct && pubProduct.hasStock) {
              await updateProduct(product.publishedSourceId, { stockQuantity: newQty });
              logger.info(`[Estoque] Sincronizado published ID=${product.publishedSourceId} para qty=${newQty}`);
            }
          }
        } catch (syncErr) {
          logger.error('[Estoque] Erro ao sincronizar estoque entre versões:', syncErr);
        }
      }
    }

    // ===== 3. ESTOQUE SIMPLES DE COMPLEMENTOS (campo stockQuantity em complementItems) =====
    for (const orderItem of items) {
      const itemComplements = orderItem.complements as Array<{ name: string; price: number; quantity: number }> | null;
      if (!itemComplements || itemComplements.length === 0) continue;

      // Buscar grupos de complementos do produto
      const groups = await getComplementGroupsByProduct(orderItem.productId);
      for (const group of groups) {
        const groupItems = await getComplementItemsByGroup(group.id);
        for (const complement of itemComplements) {
          const dbComplement = groupItems.find(c => c.name === complement.name);
          if (dbComplement && dbComplement.hasStock && dbComplement.stockQuantity !== null && dbComplement.stockQuantity > 0) {
            const complementQty = (complement.quantity || 1) * orderItem.quantity;
            const newComplementQty = Math.max(0, dbComplement.stockQuantity - complementQty);
            await updateComplementItem(dbComplement.id, { stockQuantity: newComplementQty });
            logger.info(`[Estoque] Descontado ${complementQty}x complemento "${complement.name}" do estoque simples (${dbComplement.stockQuantity} -> ${newComplementQty})`);
          }
        }
      }
    }
  } catch (error) {
    logger.error('[Estoque] Erro ao descontar estoque para pedido', orderId, error);
  }
}

/**
 * Restaura o estoque quando um pedido é cancelado.
 * Para cada item do pedido, verifica se existe um stockItem vinculado ao productId
 * e cria uma movimentação de entrada para devolver a quantidade.
 */
export async function restoreStockForOrder(orderId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar itens do pedido
    const items = await getOrderItems(orderId);
    if (items.length === 0) return;

    // Buscar productIds dos itens
    const productIds = items.map(i => i.productId).filter(Boolean);
    if (productIds.length === 0) return;

    // ===== 1. ESTOQUE AVANÇADO (tabela stockItems com movimentações) =====
    // Nota: addStockMovement já chama syncProductStockQuantity que sincroniza
    // o campo stockQuantity do produto vinculado. Por isso, para produtos com
    // stockItem vinculado, NÃO restauramos o estoque simples separadamente.
    const linkedStockItems = await getStockItemsByLinkedProductIds(productIds);
    const productsWithLinkedStock = new Set<number>();

    if (linkedStockItems.length > 0) {
      const stockMap = new Map<number, typeof linkedStockItems[0]>();
      for (const si of linkedStockItems) {
        if (si.linkedProductId) {
          stockMap.set(si.linkedProductId, si);
          productsWithLinkedStock.add(si.linkedProductId);
        }
      }

      for (const orderItem of items) {
        const stockItem = stockMap.get(orderItem.productId);
        if (!stockItem) continue;

        const currentStockItem = await getStockItemById(stockItem.id);
        if (!currentStockItem) continue;

        await addStockMovement({
          stockItemId: stockItem.id,
          type: "entry",
          quantity: String(orderItem.quantity),
          previousQuantity: currentStockItem.currentQuantity,
          newQuantity: String(Number(currentStockItem.currentQuantity) + orderItem.quantity),
          reason: `Pedido cancelado #${orderId}`,
          orderId: orderId,
        });

        logger.info(`[Estoque] Restaurado ${orderItem.quantity}x "${orderItem.productName}" ao estoque avançado (item ${stockItem.id})`);
      }
    }

    // ===== 2. ESTOQUE SIMPLES DE PRODUTOS (campo stockQuantity em products) =====
    // Só para produtos SEM stockItem vinculado (evita dupla contagem com syncProductStockQuantity)
    for (const orderItem of items) {
      if (productsWithLinkedStock.has(orderItem.productId)) continue;

      const product = await getProductById(orderItem.productId);
      if (product && product.hasStock && product.stockQuantity !== null) {
        const newQty = product.stockQuantity + orderItem.quantity;
        await updateProduct(orderItem.productId, { stockQuantity: newQty });
        logger.info(`[Estoque] Restaurado ${orderItem.quantity}x "${orderItem.productName}" ao estoque simples (${product.stockQuantity} -> ${newQty})`);

        // Sincronizar estoque com a versão draft/published correspondente
        try {
          const dbInstance = await getDb();
          if (dbInstance && product.version === 'published') {
            const [draftProduct] = await dbInstance.select({ id: products.id })
              .from(products)
              .where(and(
                eq(products.publishedSourceId, orderItem.productId),
                eq(products.version, 'draft'),
                eq(products.establishmentId, product.establishmentId),
              ))
              .limit(1);
            if (draftProduct) {
              await updateProduct(draftProduct.id, { stockQuantity: newQty });
              logger.info(`[Estoque] Sincronizado draft ID=${draftProduct.id} para qty=${newQty} (restauração)`);
            }
          } else if (dbInstance && product.version === 'draft' && product.publishedSourceId) {
            const pubProduct = await getProductById(product.publishedSourceId);
            if (pubProduct && pubProduct.hasStock) {
              await updateProduct(product.publishedSourceId, { stockQuantity: newQty });
              logger.info(`[Estoque] Sincronizado published ID=${product.publishedSourceId} para qty=${newQty} (restauração)`);
            }
          }
        } catch (syncErr) {
          logger.error('[Estoque] Erro ao sincronizar estoque entre versões (restauração):', syncErr);
        }
      }
    }

    // ===== 3. ESTOQUE SIMPLES DE COMPLEMENTOS (campo stockQuantity em complementItems) =====
    for (const orderItem of items) {
      const itemComplements = orderItem.complements as Array<{ name: string; price: number; quantity: number }> | null;
      if (!itemComplements || itemComplements.length === 0) continue;

      const groups = await getComplementGroupsByProduct(orderItem.productId);
      for (const group of groups) {
        const groupItems = await getComplementItemsByGroup(group.id);
        for (const complement of itemComplements) {
          const dbComplement = groupItems.find(c => c.name === complement.name);
          if (dbComplement && dbComplement.hasStock && dbComplement.stockQuantity !== null) {
            const complementQty = (complement.quantity || 1) * orderItem.quantity;
            const newComplementQty = dbComplement.stockQuantity + complementQty;
            await updateComplementItem(dbComplement.id, { stockQuantity: newComplementQty });
            logger.info(`[Estoque] Restaurado ${complementQty}x complemento "${complement.name}" ao estoque simples (${dbComplement.stockQuantity} -> ${newComplementQty})`);
          }
        }
      }
    }
  } catch (error) {
    logger.error('[Estoque] Erro ao restaurar estoque para pedido cancelado', orderId, error);
  }
}

export async function getRecentStockMovements(establishmentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  // Join with stockItems to filter by establishment
  const items = await db.select({ id: stockItems.id })
    .from(stockItems)
    .where(eq(stockItems.establishmentId, establishmentId));

  if (items.length === 0) return [];

  const itemIds = items.map(i => i.id);

  // Get movements for these items
  const movements = await db.select({
    movement: stockMovements,
    itemName: stockItems.name,
    itemUnit: stockItems.unit
  })
    .from(stockMovements)
    .innerJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id))
    .where(sql`${stockMovements.stockItemId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  return movements;
}

export async function getStockSummary(establishmentId: number) {
  const db = await getDb();
  if (!db) return { total: 0, ok: 0, low: 0, critical: 0, outOfStock: 0 };

  const items = await db.select().from(stockItems)
    .where(and(
      eq(stockItems.establishmentId, establishmentId),
      eq(stockItems.isActive, true)
    ));

  return {
    total: items.length,
    ok: items.filter(i => i.status === "ok").length,
    low: items.filter(i => i.status === "low").length,
    critical: items.filter(i => i.status === "critical").length,
    outOfStock: items.filter(i => i.status === "out_of_stock").length,
  };
}


// ============ PUBLIC ORDER FUNCTIONS ============
export async function createPublicOrder(data: InsertOrder, items: InsertOrderItem[], options?: { isWhatsappLite?: boolean }) {
  logger.info('[DB:createPublicOrder] Iniciando...');

  const db = await getDb();
  if (!db) {
    logger.error('[DB:createPublicOrder] Database não disponível');
    throw new Error("Database not available");
  }

  // Confirmação via botões está temporariamente BLOQUEADA
  const requiresConfirmation = false;

  // ===== VALIDAÇÃO DE ESTOQUE =====
  // Verificar se há estoque suficiente para todos os itens ANTES de criar o pedido
  const productIds = items.map(i => i.productId).filter(Boolean);
  if (productIds.length > 0) {
    // Buscar produtos com controle de estoque ativo
    const productsWithStock = await db.select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.hasStock, true)
      ));

    if (productsWithStock.length > 0) {
      // Buscar itens de estoque vinculados
      const linkedStockItemsList = await getStockItemsByLinkedProductIds(productsWithStock.map(p => p.id));
      const stockMap = new Map<number, number>();

      for (const si of linkedStockItemsList) {
        if (si.linkedProductId) {
          stockMap.set(si.linkedProductId, Number(si.currentQuantity));
        }
      }

      // Para produtos sem stockItem vinculado, usar stockQuantity do produto
      for (const p of productsWithStock) {
        if (!stockMap.has(p.id)) {
          stockMap.set(p.id, p.stockQuantity ?? 0);
        }
      }

      // Agrupar quantidades por produto (um mesmo produto pode aparecer várias vezes)
      const requestedQty = new Map<number, { qty: number; name: string }>();
      for (const item of items) {
        if (item.productId && stockMap.has(item.productId)) {
          const existing = requestedQty.get(item.productId);
          if (existing) {
            existing.qty += (item.quantity ?? 1);
          } else {
            requestedQty.set(item.productId, { qty: item.quantity ?? 1, name: item.productName || '' });
          }
        }
      }

      // Verificar cada produto
      const insufficientItems: string[] = [];
      Array.from(requestedQty.entries()).forEach(([productId, { qty, name }]) => {
        const available = stockMap.get(productId) ?? 0;
        if (qty > available) {
          insufficientItems.push(`${name}: solicitado ${qty}, disponível ${available}`);
        }
      });

      if (insufficientItems.length > 0) {
        logger.info('[DB:createPublicOrder] Estoque insuficiente:', insufficientItems);
        throw new Error(`Estoque insuficiente: ${insufficientItems.join('; ')}`);
      }
    }
  }

  // Generate order number with format #P1, #P2, etc. (sem zeros à esquerda)
  // Reset diário automático: numeração reinicia à 00:00 no fuso horário do estabelecimento
  const orderNumber = await getNextDailyOrderNumber(data.establishmentId);
  logger.info('[DB:createPublicOrder] Order number gerado:', orderNumber);

  // Verificar se aceitar pedidos automaticamente está ativado
  let autoAccept = false;
  try {
    const establishment = await getEstablishmentById(data.establishmentId);
    if (establishment?.autoAcceptOrders) {
      autoAccept = true;
      logger.info('[DB:createPublicOrder] Auto-aceitar pedidos está ATIVADO');
    }
  } catch (e) {
    logger.info('[DB:createPublicOrder] Erro ao verificar auto-aceitar:', e);
  }

  // Definir status inicial baseado na configuração de confirmação, agendamento, auto-aceitar e pagamento online
  let initialStatus: "scheduled" | "pending_confirmation" | "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  const isPixOnline = data.paymentMethod === 'pix_online';
  const isCardOnline = data.paymentMethod === 'card_online';
  const isOnlinePayment = isPixOnline || isCardOnline;
  if (options?.isWhatsappLite) {
    // Plano Lite (WhatsApp): pedido já entra como completed para contar nas métricas
    initialStatus = 'completed';
  } else if (data.isScheduled) {
    initialStatus = 'scheduled';
  } else if (isOnlinePayment) {
    // Pagamento Online (PIX QR Code ou Cartão): pedido fica pendente até pagamento ser confirmado
    initialStatus = 'pending_confirmation';
  } else if (requiresConfirmation) {
    initialStatus = 'pending_confirmation';
  } else if (autoAccept) {
    initialStatus = 'preparing';
  } else {
    initialStatus = 'new';
  }
  logger.info('[DB:createPublicOrder] Status inicial:', initialStatus);

  try {
    logger.info('[DB:createPublicOrder] Inserindo pedido no banco...');
    const result = await db.insert(orders).values({
      ...data,
      orderNumber,
      status: initialStatus,
      ...(initialStatus === 'new' ? { newAt: new Date() } : {}),
      ...(options?.isWhatsappLite ? { completedAt: new Date() } : {}),
    });
    const orderId = result[0].insertId;
    logger.info('[DB:createPublicOrder] Pedido inserido com ID:', orderId);

    if (items.length > 0) {
      logger.info('[DB:createPublicOrder] Inserindo', items.length, 'itens...');
      const itemsWithOrderId = items.map(item => ({ ...item, orderId }));
      await db.insert(orderItems).values(itemsWithOrderId);
      logger.info('[DB:createPublicOrder] Itens inseridos com sucesso');
    }

    // Notificar via SSE sobre novo pedido SOMENTE se não requer confirmação e não é pagamento online
    // Se requer confirmação ou é pagamento online, a notificação será enviada quando confirmado
    if (!requiresConfirmation && !isOnlinePayment) {
      const newOrder = {
        id: orderId,
        orderNumber,
        establishmentId: data.establishmentId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        deliveryType: data.deliveryType,
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        discount: data.discount || "0",
        couponCode: data.couponCode || null,
        total: data.total,
        notes: data.notes,
        changeAmount: data.changeAmount,
        status: autoAccept ? "preparing" as const : "new" as const,
        source: "internal" as const, // Origem do pedido para diferenciar do iFood
        createdAt: new Date(),
        items: items.map((item, index) => ({
          id: index + 1,
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          complements: item.complements,
          notes: item.notes,
        })),
      };
      notifyNewOrder(data.establishmentId, newOrder);
    } else {
      logger.info('[DB:createPublicOrder] Notificação SSE adiada - aguardando confirmação do cliente');
    }

    // Verificar se impressão está configurada e enviar evento de impressão via SSE
    // MOVIDO PARA BACKGROUND: processOrderPrintingInBackground()
    if (false) { // Desabilitado - agora feito em background
    try {
      const printerSettingsResult = await getPrinterSettings(data.establishmentId);
      if (printerSettingsResult?.printOnNewOrder) {
        // Enviar evento SSE para impressão (Mindi Printer app)
        notifyPrintOrder(data.establishmentId, {
          orderId,
          orderNumber,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          customerAddress: data.customerAddress || null,
          deliveryType: data.deliveryType || "delivery",
          paymentMethod: data.paymentMethod || "cash",
          subtotal: data.subtotal || "0",
          deliveryFee: data.deliveryFee || "0",
          discount: data.discount || "0",
          total: data.total,
          notes: data.notes || null,
          changeAmount: data.changeAmount || null,
          items: items.map(item => ({
            productName: item.productName,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: item.complements || null,
            notes: item.notes || null,
          })),
          createdAt: new Date(),
          beepOnPrint: (printerSettingsResult as any)?.mindiBeepOnPrint ?? printerSettingsResult?.beepOnPrint ?? false,
          htmlPrintEnabled: (printerSettingsResult as any)?.mindiHtmlPrintEnabled ?? printerSettingsResult?.htmlPrintEnabled ?? true,
        });
        logger.info('[DB:createPublicOrder] Evento de impressão SSE enviado para pedido:', orderNumber);
        // Registrar log de impressão (fire-and-forget - nunca bloqueia o fluxo de impressão)
        createPrintLog({
          establishmentId: data.establishmentId,
          orderId,
          orderNumber,
          trigger: 'new_order',
          method: 'sse',
          status: 'sent',
          printerConnections: getPrinterConnectionCount(data.establishmentId),
          metadata: { autoAccept: !!(data as any).autoAcceptOrders, beepOnPrint: (printerSettingsResult as any)?.mindiBeepOnPrint ?? printerSettingsResult?.beepOnPrint ?? false, htmlPrintEnabled: (printerSettingsResult as any)?.mindiHtmlPrintEnabled ?? printerSettingsResult?.htmlPrintEnabled ?? true },
        }).catch(() => {});
      }

      // Se printOnNewOrder está ativo, o Mindi Printer app cuida da impressão via SSE
      // Não usar métodos legados (POSPrinterDriver, Socket TCP) para evitar impressão duplicada
      if (!printerSettingsResult?.printOnNewOrder) {

      // Impressão automática via POSPrinterDriver (se configurado) - LEGADO
      if (printerSettingsResult?.posPrinterEnabled && printerSettingsResult?.posPrinterLinkcode) {
        const { printViaPOSPrinterDriver } = await import('./posPrinterDriver');
        const establishment = await getEstablishmentById(data.establishmentId);

        const printResult = await printViaPOSPrinterDriver(
          {
            orderNumber,
            customerName: data.customerName || 'Nao informado',
            customerPhone: data.customerPhone || undefined,
            customerAddress: data.customerAddress || undefined,
            deliveryType: (data.deliveryType || 'delivery') as 'delivery' | 'pickup',
            paymentMethod: data.paymentMethod || 'cash',
            changeFor: data.changeAmount || undefined,
            items: items.map(item => ({
              quantity: item.quantity ?? 1,
              productName: item.productName,
              totalPrice: item.totalPrice,
              notes: item.notes || undefined,
              complements: typeof item.complements === 'string' ? item.complements : (item.complements ? JSON.stringify(item.complements) : undefined),
            })),
            subtotal: data.subtotal || '0',
            deliveryFee: data.deliveryFee || undefined,
            discount: data.discount || undefined,
            couponCode: data.couponCode || undefined,
            total: data.total,
            notes: data.notes || undefined,
            createdAt: new Date(),
          },
          { name: establishment?.name || 'Estabelecimento' },
          {
            copies: printerSettingsResult!.copies || 1,
            headerMessage: printerSettingsResult!.headerMessage || undefined,
            footerMessage: printerSettingsResult!.footerMessage || undefined,
            paperWidth: printerSettingsResult!.paperWidth || '80mm',
            posPrinterLinkcode: printerSettingsResult!.posPrinterLinkcode ?? undefined,
            posPrinterNumber: printerSettingsResult!.posPrinterNumber || 1,
          }
        );

        if (printResult.success) {
          logger.info('[DB:createPublicOrder] POSPrinterDriver:', printResult.message);
          createPrintLog({
            establishmentId: data.establishmentId,
            orderId,
            orderNumber,
            trigger: 'new_order',
            method: 'pos_driver',
            status: 'sent',
            metadata: { linkcode: printerSettingsResult!.posPrinterLinkcode },
          }).catch(() => {});
        } else {
          logger.error('[DB:createPublicOrder] POSPrinterDriver erro:', printResult.message);
          createPrintLog({
            establishmentId: data.establishmentId,
            orderId,
            orderNumber,
            trigger: 'new_order',
            method: 'pos_driver',
            status: 'failed',
            errorMessage: printResult.message,
          }).catch(() => {});
        }
      }

      // Impressão direta via rede local (Socket TCP) - Múltiplas impressoras
      const activePrinters = await getActivePrinters(data.establishmentId);

      if (activePrinters.length > 0) {
        const { printOrderToMultiplePrinters } = await import('./escposPrinter');
        const establishment = await getEstablishmentById(data.establishmentId);

        // Extrair bairro do endereço se disponível
        const addressParts = data.customerAddress?.split(',') || [];
        const neighborhoodFromAddress = addressParts.length > 1 ? addressParts[addressParts.length - 1]?.trim() : undefined;

        // Preparar configuração das impressoras
        const printerConfigs = activePrinters.map(p => ({
          ip: p.ipAddress,
          port: p.port || 9100,
        }));

        // Preparar dados do pedido
        const orderData = {
          orderId: 0,
          orderNumber: parseInt(orderNumber) || 0,
          customerName: data.customerName || 'Nao informado',
          customerPhone: data.customerPhone || undefined,
          deliveryType: (data.deliveryType || 'delivery') as 'delivery' | 'pickup' | 'table',
          address: data.customerAddress || undefined,
          neighborhood: neighborhoodFromAddress,
          paymentMethod: data.paymentMethod || 'Dinheiro',
          items: items.map(item => ({
            name: item.productName,
            quantity: item.quantity ?? 1,
            price: parseFloat(item.totalPrice) / (item.quantity ?? 1),
            observation: item.notes || undefined,
            complements: typeof item.complements === 'string' ? item.complements : undefined,
          })),
          subtotal: parseFloat(data.subtotal || '0'),
          deliveryFee: parseFloat(data.deliveryFee || '0'),
          discount: parseFloat(data.discount || '0'),
          total: parseFloat(data.total),
          observation: data.notes || undefined,
          createdAt: new Date(),
          establishmentName: establishment?.name || 'Estabelecimento',
        };

        // Imprimir em todas as impressoras ativas simultaneamente
        const multiPrintResult = await printOrderToMultiplePrinters(printerConfigs, orderData);

        logger.info(`[DB:createPublicOrder] Impress\u00e3o em ${activePrinters.length} impressora(s):`,
          multiPrintResult.results.map(r => `${r.ip}: ${r.success ? 'OK' : r.message}`).join(', '));
        // Log para cada impressora
        for (const r of multiPrintResult.results) {
          createPrintLog({
            establishmentId: data.establishmentId,
            orderId,
            orderNumber,
            trigger: 'new_order',
            method: 'socket_tcp',
            status: r.success ? 'sent' : 'failed',
            errorMessage: r.success ? undefined : r.message,
            metadata: { ip: r.ip, printerCount: activePrinters.length },
          }).catch(() => {});
        }
      } else if ((printerSettingsResult as any)?.directPrintEnabled && (printerSettingsResult as any)?.directPrintIp) {
        // Fallback para impressão direta única (configuração antiga)
        const { printOrderDirect } = await import('./escposPrinter');
        const establishment = await getEstablishmentById(data.establishmentId);

        // Extrair bairro do endereço se disponível
        const addressParts = data.customerAddress?.split(',') || [];
        const neighborhoodFromAddress = addressParts.length > 1 ? addressParts[addressParts.length - 1]?.trim() : undefined;

        const directPrintResult = await printOrderDirect(
          {
            ip: (printerSettingsResult as any).directPrintIp,
            port: (printerSettingsResult as any).directPrintPort || 9100,
          },
          {
            orderId: 0,
            orderNumber: parseInt(orderNumber) || 0,
            customerName: data.customerName || 'Nao informado',
            customerPhone: data.customerPhone || undefined,
            deliveryType: (data.deliveryType || 'delivery') as 'delivery' | 'pickup' | 'table',
            address: data.customerAddress || undefined,
            neighborhood: neighborhoodFromAddress,
            paymentMethod: data.paymentMethod || 'Dinheiro',
            items: items.map(item => ({
              name: item.productName,
              quantity: item.quantity ?? 1,
              price: parseFloat(item.totalPrice) / (item.quantity ?? 1),
              observation: item.notes || undefined,
              complements: typeof item.complements === 'string' ? item.complements : undefined,
            })),
            subtotal: parseFloat(data.subtotal || '0'),
            deliveryFee: parseFloat(data.deliveryFee || '0'),
            discount: parseFloat(data.discount || '0'),
            total: parseFloat(data.total),
            observation: data.notes || undefined,
            createdAt: new Date(),
            establishmentName: establishment?.name || 'Estabelecimento',
          }
        );

        if (directPrintResult.success) {
          logger.info('[DB:createPublicOrder] Impressão direta:', directPrintResult.message);
          createPrintLog({
            establishmentId: data.establishmentId,
            orderId,
            orderNumber,
            trigger: 'new_order',
            method: 'direct',
            status: 'sent',
            metadata: { ip: (printerSettingsResult as any).directPrintIp, port: (printerSettingsResult as any).directPrintPort || 9100 },
          }).catch(() => {});
        } else {
          logger.error('[DB:createPublicOrder] Impressão direta erro:', directPrintResult.message);
          createPrintLog({
            establishmentId: data.establishmentId,
            orderId,
            orderNumber,
            trigger: 'new_order',
            method: 'direct',
            status: 'failed',
            errorMessage: directPrintResult.message,
            metadata: { ip: (printerSettingsResult as any).directPrintIp, port: (printerSettingsResult as any).directPrintPort || 9100 },
          }).catch(() => {});
        }
      }

      } // fim do if (!printOnNewOrder) - bloco de metodos legados
    } catch (printError) {
      // Erro de impressao agora tratado em background
      logger.info('[DB:createPublicOrder] Erro de impressao sera tratado em background');
    }
    } // fim do if(false) - bloco de impressao desabilitado

    // Enviar notificacao WhatsApp para o cliente sobre novo pedido
    // MOVIDO PARA BACKGROUND: processOrderNotificationInBackground()
    if (false) { // Desabilitado - agora feito em background
    try {
      const establishment = await getEstablishmentById(data.establishmentId);
      const legacyAutomaticNotificationsAllowed = hasAutomaticOrderNotifications(establishment?.planType);
      if (!legacyAutomaticNotificationsAllowed) {
        logger.info('[DB:createPublicOrder] WhatsApp legado bloqueado para o plano:', establishment?.planType || 'desconhecido');
      }
      const whatsappConfig = legacyAutomaticNotificationsAllowed ? await getWhatsappConfig(data.establishmentId) : null;
      if (whatsappConfig && (whatsappConfig as WhatsappConfig).status === 'connected' && (whatsappConfig as WhatsappConfig).instanceToken && data.customerPhone) {

        // Preparar info de agendamento para incluir na mensagem
        const schedulingInfo = data.isScheduled && data.scheduledAt ? {
          isScheduled: true,
          scheduledDate: new Date(data.scheduledAt as unknown as string | number).toLocaleDateString('pt-BR'),
          scheduledTime: new Date(data.scheduledAt as unknown as string | number).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        } : undefined;

        // Confirmação via botões está temporariamente BLOQUEADA
        if (false && (whatsappConfig as any).requireOrderConfirmation && !data.isScheduled) {
          // Enviar mensagem com botões de confirmação
          const { sendOrderConfirmationRequest } = await import('./_core/uazapi');

          await sendOrderConfirmationRequest(
            whatsappConfig!.instanceToken!,
            data.customerPhone!,
            {
              customerName: data.customerName || 'Cliente',
              orderNumber,
              establishmentName: establishment?.name || 'Restaurante',
              orderItems: items.map(item => ({
                productName: item.productName,
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                complements: item.complements,
                notes: item.notes,
              })),
              orderTotal: data.total,
              template: whatsappConfig!.templateNewOrder,
              paymentMethod: data.paymentMethod,
            }
          );
          logger.info('[DB:createPublicOrder] Mensagem de confirmação com botões enviada:', orderNumber);
          // Status já foi definido como pending_confirmation na criação do pedido

        } else if (whatsappConfig!.notifyOnNewOrder) {
          // Enviar notificação normal (sem botões) - Template NOVO PEDIDO
          const { sendOrderStatusNotification } = await import('./_core/uazapi');

          logger.info('[DB:createPublicOrder] Enviando template NOVO PEDIDO (sem botões)');
          logger.info('[DB:createPublicOrder] Template usado:', whatsappConfig!.templateNewOrder?.substring(0, 100));
          logger.info('[DB:createPublicOrder] Telefone do cliente:', data.customerPhone);
          logger.info('[DB:createPublicOrder] Itens do pedido:', items.length);

          const sendResult = await sendOrderStatusNotification(
            whatsappConfig!.instanceToken!,
            data.customerPhone!,
            'new',
            {
              customerName: data.customerName || 'Cliente',
              orderNumber,
              establishmentName: establishment?.name || 'Restaurante',
              template: whatsappConfig!.templateNewOrder,
              orderItems: items.map(item => ({
                productName: item.productName,
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                complements: item.complements,
                notes: item.notes,
              })),
              orderTotal: data.total,
              deliveryType: data.deliveryType,
              paymentMethod: data.paymentMethod,
              schedulingInfo,
              customerAddress: data.customerAddress,
              changeAmount: data.changeAmount || null,
              deliveryFee: data.deliveryFee || null,
              customerPhone: data.customerPhone || null,
            }
          );

          if (sendResult.success) {
            logger.info('[DB:createPublicOrder] ✅ Notificação WhatsApp NOVO PEDIDO enviada com sucesso:', orderNumber, 'messageId:', sendResult.messageId);

            // Enviar botão PIX nativo se pagamento for PIX e chave estiver cadastrada
            if (data.paymentMethod === 'pix' && establishment?.pixKey) {
              try {
                const { sendPixButton } = await import('./_core/uazapi');
                const pixResult = await sendPixButton(
                  whatsappConfig!.instanceToken!,
                  data.customerPhone!,
                  establishment!.pixKey!,
                  undefined, // auto-detect key type
                  establishment!.pixHolderName || establishment!.name || undefined // merchantName
                );
                if (pixResult.success) {
                  logger.info('[DB:createPublicOrder] ✅ Botão PIX nativo enviado com sucesso:', orderNumber);
                } else {
                  logger.error('[DB:createPublicOrder] ❌ FALHA ao enviar botão PIX:', pixResult.message);
                }
              } catch (pixError) {
                logger.error('[DB:createPublicOrder] Erro ao enviar botão PIX:', pixError);
              }
            }
          } else {
            logger.error('[DB:createPublicOrder] ❌ FALHA ao enviar notificação WhatsApp NOVO PEDIDO:', orderNumber, 'erro:', sendResult.message);
          }
        }
      }
    } catch (whatsappError) {
      // Erro de WhatsApp agora tratado em background
      logger.info('[DB:createPublicOrder] Erro de WhatsApp sera tratado em background');
    }
    } // fim do if(false) - bloco de WhatsApp desabilitado

    // Enviar push notification para dispositivos inscritos
    // Para pagamentos online (PIX QR Code / Cartão Online), adiar até pagamento confirmado
    if (!isOnlinePayment) {
      try {
        const { sendNewOrderNotification } = await import('./_core/webPush');
        const subscriptions = await getPushSubscriptionsByEstablishment(data.establishmentId);
        if (subscriptions.length > 0) {
          logger.info(`[DB:createPublicOrder] Enviando push para ${subscriptions.length} dispositivos...`);
          for (const sub of subscriptions) {
            try {
              const success = await sendNewOrderNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                  },
                },
                {
                  orderId,
                  orderNumber,
                  customerName: data.customerName || 'Cliente',
                  total: parseFloat(data.total),
                }
              );
              if (!success) {
                // Subscription inválida, remover
                logger.info(`[DB:createPublicOrder] Removendo subscription inválida: ${sub.id}`);
                await deletePushSubscriptionById(sub.id);
              }
            } catch (pushError) {
              logger.error('[DB:createPublicOrder] Erro ao enviar push para subscription:', sub.id, pushError);
            }
          }
        }
      } catch (pushError) {
        logger.error('[DB:createPublicOrder] Erro ao enviar push notifications:', pushError);
        // Não falhar o pedido por causa de erro de push
      }
    } else {
      logger.info('[DB:createPublicOrder] Push notification adiado - aguardando pagamento online');
    }
    // Descontar estoque automaticamente ao criar o pedido
    try {
      await deductStockForOrder(orderId);
      logger.info('[DB:createPublicOrder] Estoque descontado para pedido:', orderNumber);
    } catch (stockError) {
      logger.error('[DB:createPublicOrder] Erro ao descontar estoque:', stockError);
      // Não falhar o pedido por causa de erro de estoque
    }
    logger.info('[DB:createPublicOrder] Pedido criado com sucesso:', { orderId, orderNumber });
    // ─── Notificação automática do entregador quando autoAccept + timing on_accepted ───
    // Quando o pedido é aceito automaticamente, o updateStatus nunca é chamado com 'preparing',
    // então precisamos disparar a notificação do entregador aqui.
    if (autoAccept && data.deliveryType === 'delivery' && !isOnlinePayment) {
      (async () => {
        try {
          const timing = await getDriverNotifyTiming(data.establishmentId);
          if (timing === 'on_accepted') {
            const activeDrivers = await getActiveDriversByEstablishment(data.establishmentId);
            if (activeDrivers.length === 1) {
              // Auto-assign single driver and notify
              const driver = activeDrivers[0];
              const deliveryFee = parseFloat(data.deliveryFee || '0');
              let repasseValue = 0;
              if (driver.repasseStrategy === 'neighborhood') repasseValue = deliveryFee;
              else if (driver.repasseStrategy === 'fixed') repasseValue = parseFloat(driver.fixedValue || '0');
              else if (driver.repasseStrategy === 'percentage') repasseValue = deliveryFee * (parseFloat(driver.percentageValue || '0') / 100);

              const existingDelivery = await getDeliveryByOrderId(orderId);
              if (!existingDelivery) {
                const deliveryId = await createDelivery({
                  establishmentId: data.establishmentId,
                  orderId,
                  driverId: driver.id,
                  deliveryFee: String(deliveryFee),
                  repasseValue: String(repasseValue.toFixed(2)),
                  paymentStatus: 'pending',
                  whatsappSent: false,
                });

                const establishment = await getEstablishmentById(data.establishmentId);
                const driverWhatsappAllowed = hasAutomaticOrderNotifications(establishment?.planType);
                if (!driverWhatsappAllowed) {
                  logger.info('[DB:createPublicOrder] WhatsApp automático ao entregador bloqueado para o plano:', establishment?.planType || 'desconhecido');
                }
                const config = driverWhatsappAllowed ? await getWhatsappConfig(data.establishmentId) : null;
                if (config && config.status === 'connected') {
                  const { getWhatsAppProvider } = await import('./_core/whatsappProvider');
                  const wa = await getWhatsAppProvider(data.establishmentId);
                  if (wa.isAvailable()) {
                    const { buildDriverDeliveryMessage } = await import('./driverMessage');
                    const { buildDriverButtons } = await import('./driverButtons');
                    const orderData = await getOrderById(orderId);
                    if (orderData) {
                      const message = buildDriverDeliveryMessage(orderData, deliveryFee);
                      const buttons = buildDriverButtons(orderData.orderNumber, orderData.customerAddress, orderData.customerLat, orderData.customerLng);
                      const btnResult = await wa.sendButtons(driver.whatsapp, message, buttons, 'Clique para atualizar o status');
                      if (!btnResult.success) {
                        await wa.sendText(driver.whatsapp, message);
                      }
                      await markDeliveryWhatsappSent(deliveryId);
                    }
                  }
                }
                await markOrderDeliveryNotified(orderId);
                logger.info(`[DB:createPublicOrder] Entregador ${driver.name} notificado automaticamente (autoAccept + on_accepted) para pedido ${orderNumber}`);
              }
            } else if (activeDrivers.length > 1) {
              // Múltiplos entregadores: log para rastreamento. O admin precisará selecionar manualmente.
              logger.info(`[DB:createPublicOrder] ${activeDrivers.length} entregadores disponíveis (autoAccept + on_accepted) para pedido ${orderNumber} - aguardando seleção manual`);
            } else {
              logger.info(`[DB:createPublicOrder] Nenhum entregador ativo para pedido ${orderNumber} (autoAccept + on_accepted)`);
            }
          } else {
            logger.info(`[DB:createPublicOrder] Timing é on_ready, entregador será notificado quando pedido estiver pronto`);
          }
        } catch (driverError) {
          logger.error('[DB:createPublicOrder] Erro ao notificar entregador (autoAccept):', driverError);
          // Fire-and-forget: não falhar o pedido por causa de erro de notificação do entregador
        }
      })();
    }

    // Iniciar processamento de impressão e notificação em background (não bloqueia resposta)
    // Fire-and-forget: o cliente recebe a resposta imediatamente
    // Para pagamentos online (PIX QR Code / Cartão Online), adiar até pagamento confirmado
    if (!isOnlinePayment) {
      processOrderPrintingInBackground(data.establishmentId, orderId, orderNumber, data, items).catch(err => {
        logger.error('[CreateOrder] Erro ao processar impressão em background:', err);
      });

      processOrderNotificationInBackground(data.establishmentId, orderId, orderNumber, data, items).catch(err => {
        logger.error('[CreateOrder] Erro ao processar notificação em background:', err);
      });
    } else {
      logger.info('[DB:createPublicOrder] Impressão e notificação adiadas - aguardando pagamento online');
    }

    return { orderId, orderNumber };
  } catch (error) {
    logger.error('[DB:createPublicOrder] Erro ao criar pedido:', error);
    logger.error('[DB:createPublicOrder] Dados recebidos:', {
      establishmentId: data.establishmentId,
      customerName: data.customerName,
      deliveryType: data.deliveryType,
      paymentMethod: data.paymentMethod,
      itemsCount: items.length,
    });
    throw error;
  }
}

export async function getPublicOrderByNumber(orderNumber: string, establishmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // ORDER BY createdAt DESC to get the most recent order with this number
  // (important after daily number reset where multiple orders can have the same number)
  const result = await db.select().from(orders)
    .where(and(
      eq(orders.orderNumber, orderNumber),
      eq(orders.establishmentId, establishmentId)
    ))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (result.length === 0) return undefined;

  const order = result[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

export async function getPublicOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Seleciona apenas campos necessários para rastreamento — exclui PII sensível
  const result = await db.select({
    id: orders.id,
    establishmentId: orders.establishmentId,
    orderNumber: orders.orderNumber,
    status: orders.status,
    deliveryType: orders.deliveryType,
    paymentMethod: orders.paymentMethod,
    subtotal: orders.subtotal,
    deliveryFee: orders.deliveryFee,
    discount: orders.discount,
    total: orders.total,
    source: orders.source,
    isScheduled: orders.isScheduled,
    scheduledAt: orders.scheduledAt,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
    completedAt: orders.completedAt,
    acceptedAt: orders.acceptedAt,
    readyAt: orders.readyAt,
    // customerPhone, customerAddress, customerName, notes, changeAmount, externalData
    // são intencionalmente omitidos para proteger PII do cliente
  }).from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (result.length === 0) return undefined;

  const order = result[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

export async function getOrdersByPhone(phone: string, establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Normalize phone: extract only digits
  const clean = phone.replace(/\D/g, "");
  // Try with and without country code 55
  const withoutCountry = clean.startsWith("55") && clean.length >= 12 ? clean.slice(2) : clean;
  const withCountry = clean.startsWith("55") ? clean : `55${clean}`;

  // Brazilian mobile 9th digit normalization:
  // WhatsApp may store numbers without the 9th digit (e.g., 558899342392)
  // but orders may store with it (e.g., 88999342392) or vice versa.
  // DDD (2 digits) + 9 + number (8 digits) = 11 digits local
  // DDD (2 digits) + number (8 digits) = 10 digits local (old format / WhatsApp format)
  const phoneVariants = new Set<string>();
  phoneVariants.add(clean);
  phoneVariants.add(withoutCountry);
  phoneVariants.add(withCountry);
  phoneVariants.add(phone);

  // Generate variants with/without the 9th digit
  // Local number without country code
  const local = withoutCountry;
  if (local.length === 11) {
    // Has 9th digit (DDD + 9 + 8 digits): remove the 9 after DDD
    const without9th = local.slice(0, 2) + local.slice(3);
    phoneVariants.add(without9th); // 10 digits
    phoneVariants.add(`55${without9th}`); // 12 digits with country
  } else if (local.length === 10) {
    // Missing 9th digit (DDD + 8 digits): add 9 after DDD
    const with9th = local.slice(0, 2) + '9' + local.slice(2);
    phoneVariants.add(with9th); // 11 digits
    phoneVariants.add(`55${with9th}`); // 13 digits with country
  }

  // Build OR conditions for all variants
  const variantArray = Array.from(phoneVariants);
  const orConditions = variantArray.map(v => eq(orders.customerPhone, v));
  // Also add LIKE for each local variant (with and without 9th digit)
  const localVariants = variantArray.filter(v => !v.startsWith("55") || v.length <= 11);
  for (const v of localVariants) {
    if (v.length >= 8) {
      orConditions.push(like(orders.customerPhone, `%${v}%`));
    }
  }

  const result = await db.select().from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      or(...orConditions)
    ))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    result.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return ordersWithItems;
}

export async function getAllOrdersByEstablishment(
  establishmentId: number,
  filters?: {
    status?: "new" | "preparing" | "ready" | "completed" | "cancelled";
    limit?: number;
    offset?: number;
    source?: "internal" | "ifood" | "rappi" | "ubereats" | "pdv";
    startDate?: string;
    endDate?: string;
  }
) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };

  const conditions = [eq(orders.establishmentId, establishmentId)];
  const timezone = await getEstablishmentTimezone(establishmentId);

  if (filters?.startDate) {
    const startUtc = zonedDateTimeToUtc(filters.startDate, timezone, 0, 0, 0);
    conditions.push(sql`${orders.createdAt} >= ${fmtUtcDateTime(startUtc)}`);
  }
  if (filters?.endDate) {
    const [year, month, day] = filters.endDate.split('-').map(Number);
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDayStr = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')}`;
    const endExclusiveUtc = zonedDateTimeToUtc(nextDayStr, timezone, 0, 0, 0);
    conditions.push(sql`${orders.createdAt} < ${fmtUtcDateTime(endExclusiveUtc)}`);
  }
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status));
  }
  // Excluir pedidos do Mapa de Mesas (source=pdv + deliveryType=dine_in + customerName começa com "Mesa ")
  conditions.push(
    sql`NOT (${orders.source} = 'pdv' AND ${orders.deliveryType} = 'dine_in' AND ${orders.customerName} LIKE 'Mesa %')`
  );
  if (filters?.source) {
    conditions.push(eq(orders.source, filters.source));
  } else {
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Get orders
  let query = db.select().from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt));

  if (filters?.limit) {
    query = query.limit(filters.limit) as typeof query;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as typeof query;
  }

  const ordersList = await query;

  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    ordersList.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return { orders: ordersWithItems, total };
}

export async function getActiveOrdersByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.status} IN ('new', 'preparing', 'ready')`,
      sql`NOT (${orders.source} = 'pdv' AND ${orders.deliveryType} = 'dine_in' AND ${orders.customerName} LIKE 'Mesa %')`
    ))
    .orderBy(desc(orders.createdAt));

  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    result.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return ordersWithItems;
}


// ============ CONFIRM/CANCEL ORDER BY NUMBER (WhatsApp Buttons) ============
export async function confirmOrderByNumber(
  establishmentId: number,
  orderNumber: string
): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: 'Database not available' };

  try {
    // Buscar o pedido
    const result = await db.select().from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.orderNumber, orderNumber),
        eq(orders.status, 'pending_confirmation')
      ))
      .limit(1);

    if (result.length === 0) {
      return { success: false, message: 'Pedido não encontrado ou já confirmado' };
    }

    const order = result[0];

    // Atualizar status para "new" (confirmado, aguardando aceite do estabelecimento)
    await db.update(orders)
      .set({ status: 'new', newAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    // Notificar via SSE sobre o novo pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const { notifyNewOrder, getConnectionCount } = await import('./_core/sse');

    const connectionCount = getConnectionCount(establishmentId);
    logger.info(`[DB:confirmOrderByNumber] Conexões SSE ativas para estabelecimento ${establishmentId}: ${connectionCount}`);

    const orderData = {
      ...order,
      status: 'new',
      source: order.source || 'internal', // Garantir que o source seja enviado
      items: items.map((item, index) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        complements: item.complements,
        notes: item.notes,
      })),
    };

    logger.info('[DB:confirmOrderByNumber] Enviando notificação SSE para pedido:', orderNumber);
    notifyNewOrder(establishmentId, orderData);
    logger.info('[DB:confirmOrderByNumber] Notificação SSE enviada!');

    logger.info('[DB:confirmOrderByNumber] Pedido confirmado:', orderNumber);
    return { success: true };
  } catch (error) {
    logger.error('[DB:confirmOrderByNumber] Erro:', error);
    return { success: false, message: 'Erro ao confirmar pedido' };
  }
}

export async function cancelOrderByNumber(
  establishmentId: number,
  orderNumber: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: 'Database not available' };

  try {
    // Buscar o pedido
    const result = await db.select().from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.orderNumber, orderNumber),
        eq(orders.status, 'pending_confirmation')
      ))
      .limit(1);

    if (result.length === 0) {
      return { success: false, message: 'Pedido não encontrado ou já processado' };
    }

    const order = result[0];

    // Atualizar status para "cancelled"
    await db.update(orders)
      .set({
        status: 'cancelled',
        cancellationReason: reason || 'Cancelado pelo cliente',
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));

    logger.info('[DB:cancelOrderByNumber] Pedido cancelado:', orderNumber);
    return { success: true };
  } catch (error) {
    logger.error('[DB:cancelOrderByNumber] Erro:', error);
    return { success: false, message: 'Erro ao cancelar pedido' };
  }
}

// ============ GET ORDERS BY ORDER NUMBERS ============
export async function getOrdersByOrderNumbers(orderNumbers: string[]) {
  const db = await getDb();
  if (!db) return [];

  if (orderNumbers.length === 0) return [];

  const result = await db.select().from(orders)
    .where(sql`${orders.orderNumber} IN (${sql.join(orderNumbers.map(n => sql`${n}`), sql`, `)})`);

  return result;
}

// ============ GET ORDERS BY IDS ============
export async function getOrdersByIds(orderIds: number[]) {
  const db = await getDb();
  if (!db) return [];

  if (orderIds.length === 0) return [];

  const result = await db.select().from(orders)
    .where(sql`${orders.id} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);

  return result;
}

// ============ COUPON FUNCTIONS ============
export async function getCouponsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    status?: "active" | "inactive" | "expired" | "exhausted";
    limit?: number;
    offset?: number;
    includeLoyalty?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return { coupons: [], total: 0 };

  const conditions = [eq(coupons.establishmentId, establishmentId)];

  // Excluir cupons de fidelidade (código começa com FID) da listagem do admin
  if (!filters?.includeLoyalty) {
    conditions.push(notLike(coupons.code, 'FID%'));
  }

  if (filters?.search) {
    conditions.push(like(coupons.code, `%${escapeLike(filters.search)}%`));
  }
  if (filters?.status) {
    conditions.push(eq(coupons.status, filters.status));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(coupons)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Get coupons
  let query = db.select().from(coupons)
    .where(whereClause)
    .orderBy(desc(coupons.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  const couponsList = await query;

  return { coupons: couponsList, total };
}

export async function getCouponById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCouponByCode(establishmentId: number, code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(coupons)
    .where(and(
      eq(coupons.establishmentId, establishmentId),
      eq(coupons.code, code.toUpperCase())
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCoupon(data: InsertCoupon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure code is uppercase
  const couponData = {
    ...data,
    code: data.code.toUpperCase(),
  };

  const result = await db.insert(coupons).values(couponData);
  return result[0].insertId;
}

export async function updateCoupon(id: number, data: Partial<InsertCoupon>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure code is uppercase if provided
  const updateData = data.code
    ? { ...data, code: data.code.toUpperCase() }
    : data;

  await db.update(coupons).set(updateData).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function toggleCouponStatus(id: number, status: "active" | "inactive") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(coupons).set({ status }).where(eq(coupons.id, id));
}

export async function incrementCouponUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar cupom primeiro para verificar se é de fidelidade
  const coupon = await getCouponById(id);
  if (!coupon) return;

  // Verificar se é cupom de fidelidade (código começa com FID ou FIDELIDADE)
  const isLoyaltyCoupon = coupon.code.startsWith('FID') || coupon.code.startsWith('FIDELIDADE');

  if (isLoyaltyCoupon) {
    // Cupons de fidelidade só podem ser usados UMA Única vez
    // Marcar como esgotado imediatamente
    await db.update(coupons)
      .set({
        usedCount: 1,
        quantity: 1,
        status: "exhausted"
      })
      .where(eq(coupons.id, id));
  } else {
    // Cupons normais - incrementar contador
    await db.update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(coupons.id, id));

    // Verificar se cupom normal está esgotado
    const updatedCoupon = await getCouponById(id);
    if (updatedCoupon && updatedCoupon.quantity && updatedCoupon.usedCount >= updatedCoupon.quantity) {
      await db.update(coupons)
        .set({ status: "exhausted" })
        .where(eq(coupons.id, id));
    }
  }
}

export async function validateCoupon(
  establishmentId: number,
  code: string,
  orderValue: number,
  deliveryType: "delivery" | "pickup" | "self_service"
) {
  const coupon = await getCouponByCode(establishmentId, code);

  if (!coupon) {
    return { valid: false, error: "Cupom não encontrado" };
  }

  if (coupon.status !== "active") {
    // Verificar se é cupom de fidelidade para mensagem específica
    const isLoyaltyCoupon = coupon.code.startsWith('FID') || coupon.code.startsWith('FIDELIDADE');

    const statusMessages: Record<string, string> = {
      inactive: "Cupom desativado",
      expired: "Cupom expirado",
      exhausted: isLoyaltyCoupon ? "Este cupom de fidelidade já foi utilizado" : "Cupom esgotado",
    };
    return { valid: false, error: statusMessages[coupon.status] || "Cupom inválido" };
  }

  // Check quantity
  if (coupon.quantity && coupon.usedCount >= coupon.quantity) {
    return { valid: false, error: "Cupom esgotado" };
  }

  // Check minimum order value
  if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
    return {
      valid: false,
      error: `Valor mínimo do pedido: R$ ${Number(coupon.minOrderValue).toFixed(2).replace('.', ',')}`
    };
  }

  // Check date validity
  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return { valid: false, error: "Cupom ainda não está válido" };
  }
  if (coupon.endDate) {
    // Ajustar endDate para o final do dia (23:59:59)
    const endOfDay = new Date(coupon.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (now > endOfDay) {
      return { valid: false, error: "Cupom expirado" };
    }
  }

  // Check active days
  if (coupon.activeDays && coupon.activeDays.length > 0) {
    const dayNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const today = dayNames[now.getDay()];
    if (!coupon.activeDays.includes(today)) {
      return { valid: false, error: "Cupom não válido hoje" };
    }
  }

  // Check valid origins
  if (coupon.validOrigins && coupon.validOrigins.length > 0) {
    const originMap: Record<string, string> = {
      delivery: "delivery",
      pickup: "retirada",
      self_service: "autoatendimento",
    };
    const originName = originMap[deliveryType];
    if (!coupon.validOrigins.includes(originName) && !coupon.validOrigins.includes(deliveryType)) {
      return { valid: false, error: "Cupom não válido para este tipo de entrega" };
    }
  }

  // Check time validity
  if (coupon.startTime && coupon.endTime) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < coupon.startTime || currentTime > coupon.endTime) {
      return { valid: false, error: `Cupom válido apenas das ${coupon.startTime} às ${coupon.endTime}` };
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = orderValue * (Number(coupon.value) / 100);
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }
  } else {
    discount = Number(coupon.value);
  }

  return {
    valid: true,
    coupon,
    discount: Math.min(discount, orderValue),
  };
}


// ============ REVIEW FUNCTIONS ============
export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reviews).values(data);

  // Update establishment rating and review count
  await updateEstablishmentRating(data.establishmentId);

  return result[0].insertId;
}

export async function getReviewsByEstablishment(establishmentId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews)
    .where(eq(reviews.establishmentId, establishmentId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function getReviewByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(reviews)
    .where(eq(reviews.orderId, orderId))
    .limit(1);

  return result[0] || null;
}

// Get last review by customer phone for 30-day limit check
export async function getLastReviewByCustomer(establishmentId: number, customerPhone: string) {
  const db = await getDb();
  if (!db) return null;

  // Normalizar telefone removendo caracteres especiais
  const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');

  // Buscar tanto pelo telefone normalizado quanto pelo original (para compatibilidade com dados antigos)
  const result = await db.select().from(reviews)
    .where(
      and(
        eq(reviews.establishmentId, establishmentId),
        or(
          eq(reviews.customerPhone, normalizedPhone),
          eq(reviews.customerPhone, customerPhone)
        )
      )
    )
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  return result[0] || null;
}

export async function updateEstablishmentRating(establishmentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Calculate average rating and count
    const result = await db.select({
      avgRating: sql<number>`AVG(rating)`,
      count: sql<number>`COUNT(*)`
    }).from(reviews).where(eq(reviews.establishmentId, establishmentId));

    // MySQL returns AVG as string, need to parse it
    const rawAvgRating = result[0]?.avgRating;
    const rawCount = result[0]?.count;

    // Parse values - MySQL may return string or number
    const avgRating = typeof rawAvgRating === 'string' ? parseFloat(rawAvgRating) : (rawAvgRating ?? 0);
    const count = typeof rawCount === 'string' ? parseInt(rawCount) : (rawCount ?? 0);

    // Ensure avgRating is a valid number before calling toFixed
    const ratingValue = !isNaN(avgRating) ? avgRating : 0;

    logger.info('Updating establishment rating:', { establishmentId, avgRating: ratingValue.toFixed(1), count });

    // Update establishment
    await db.update(establishments).set({
      rating: ratingValue.toFixed(1),
      reviewCount: count
    }).where(eq(establishments.id, establishmentId));
  } catch (error) {
    logger.error('Error updating establishment rating:', error);
    // Don't throw - let the review creation succeed even if rating update fails
  }
}



// ============ BUSINESS HOURS FUNCTIONS ============
export async function getBusinessHoursByEstablishment(establishmentId: number): Promise<BusinessHours[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(businessHours)
    .where(eq(businessHours.establishmentId, establishmentId))
    .orderBy(asc(businessHours.dayOfWeek));
}

export async function saveBusinessHours(establishmentId: number, hours: { dayOfWeek: number; isActive: boolean; openTime: string | null; closeTime: string | null }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing hours for this establishment
  await db.delete(businessHours).where(eq(businessHours.establishmentId, establishmentId));

  // Insert new hours
  for (const hour of hours) {
    await db.insert(businessHours).values({
      establishmentId,
      dayOfWeek: hour.dayOfWeek,
      isActive: hour.isActive,
      openTime: hour.openTime,
      closeTime: hour.closeTime,
    });
  }
}

export async function getBusinessHoursForPublicMenu(establishmentId: number): Promise<BusinessHours[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(businessHours)
    .where(eq(businessHours.establishmentId, establishmentId))
    .orderBy(asc(businessHours.dayOfWeek));
}


// ============ NEIGHBORHOOD FEES FUNCTIONS ============
export async function getNeighborhoodFeeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [fee] = await db.select().from(neighborhoodFees).where(eq(neighborhoodFees.id, id)).limit(1);
  return fee || null;
}

export async function getNeighborhoodFeesByEstablishment(establishmentId: number): Promise<NeighborhoodFee[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(neighborhoodFees)
    .where(eq(neighborhoodFees.establishmentId, establishmentId))
    .orderBy(desc(neighborhoodFees.pinned), asc(neighborhoodFees.neighborhood));
}

export async function createNeighborhoodFee(data: InsertNeighborhoodFee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(neighborhoodFees).values(data);
  return result[0].insertId;
}

export async function updateNeighborhoodFee(id: number, data: Partial<InsertNeighborhoodFee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(neighborhoodFees).set(data).where(eq(neighborhoodFees.id, id));
}

export async function deleteNeighborhoodFee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(neighborhoodFees).where(eq(neighborhoodFees.id, id));
}

export async function deleteAllNeighborhoodFees(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(neighborhoodFees).where(eq(neighborhoodFees.establishmentId, establishmentId));
}

/**
 * Sync all neighborhood fees for an establishment in a single batch operation.
 * Deletes removed fees, updates existing ones, and creates new ones.
 */
export async function syncNeighborhoodFees(
  establishmentId: number,
  fees: { id?: number; neighborhood: string; fee: string; pinned?: boolean }[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current fees from DB
  const existing = await db.select().from(neighborhoodFees)
    .where(eq(neighborhoodFees.establishmentId, establishmentId));
  const existingIds = existing.map(f => f.id);

  // IDs that the client still has
  const clientIds = fees.filter(f => f.id).map(f => f.id!);

  // Delete removed fees
  for (const id of existingIds) {
    if (!clientIds.includes(id)) {
      await db.delete(neighborhoodFees).where(eq(neighborhoodFees.id, id));
    }
  }

  // Create or update
  for (const fee of fees) {
    if (!fee.neighborhood.trim()) continue;
    if (fee.id && existingIds.includes(fee.id)) {
      // Update existing
      await db.update(neighborhoodFees)
        .set({ neighborhood: fee.neighborhood, fee: fee.fee, pinned: Boolean(fee.pinned) })
        .where(eq(neighborhoodFees.id, fee.id));
    } else {
      // Create new
      await db.insert(neighborhoodFees).values({
        establishmentId,
        neighborhood: fee.neighborhood,
        fee: fee.fee,
        pinned: Boolean(fee.pinned),
      });
    }
  }

  // Return updated list
  return db.select().from(neighborhoodFees)
    .where(eq(neighborhoodFees.establishmentId, establishmentId))
    .orderBy(desc(neighborhoodFees.pinned), asc(neighborhoodFees.neighborhood));
}


// ============ RADIUS FEES FUNCTIONS ============

export async function getRadiusFeesByEstablishment(establishmentId: number): Promise<RadiusFee[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(radiusFees)
    .where(eq(radiusFees.establishmentId, establishmentId))
    .orderBy(asc(radiusFees.maxKm));
}

export async function getRadiusFeeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [fee] = await db.select().from(radiusFees).where(eq(radiusFees.id, id)).limit(1);
  return fee;
}

export async function syncRadiusFees(
  establishmentId: number,
  fees: { id?: number; maxKm: string; fee: string }[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current fees from DB
  const existing = await db.select().from(radiusFees)
    .where(eq(radiusFees.establishmentId, establishmentId));
  const existingIds = existing.map(f => f.id);

  // IDs that the client still has
  const clientIds = fees.filter(f => f.id).map(f => f.id!);

  // Delete removed fees
  for (const id of existingIds) {
    if (!clientIds.includes(id)) {
      await db.delete(radiusFees).where(eq(radiusFees.id, id));
    }
  }

  // Create or update
  for (const fee of fees) {
    if (!fee.maxKm || parseFloat(fee.maxKm) <= 0) continue;
    if (fee.id && existingIds.includes(fee.id)) {
      await db.update(radiusFees)
        .set({ maxKm: fee.maxKm, fee: fee.fee })
        .where(eq(radiusFees.id, fee.id));
    } else {
      await db.insert(radiusFees).values({
        establishmentId,
        maxKm: fee.maxKm,
        fee: fee.fee,
      });
    }
  }

  // Return updated list sorted by distance
  return db.select().from(radiusFees)
    .where(eq(radiusFees.establishmentId, establishmentId))
    .orderBy(asc(radiusFees.maxKm));
}

export async function deleteAllRadiusFees(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(radiusFees).where(eq(radiusFees.establishmentId, establishmentId));
}

// ============ ESTABLISHMENT STATUS FUNCTIONS ============

/**
 * Calcula o próximo horário de abertura baseado nos horários configurados
 * Retorna null se não houver horário configurado
 */
export function getNextOpeningTime(businessHoursData: BusinessHours[], currentDate: Date = new Date()): { dayOfWeek: number; openTime: string; isToday: boolean; isTomorrow: boolean } | null {
  if (!businessHoursData || businessHoursData.length === 0) return null;

  const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = currentDate.toTimeString().slice(0, 5); // HH:MM

  // Procurar nos próximos 7 dias
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDayOfWeek + i) % 7;
    const dayHours = businessHoursData.find(h => h.dayOfWeek === checkDay);

    if (dayHours && dayHours.isActive && dayHours.openTime) {
      // Se for hoje, verificar se o horário de abertura ainda não passou
      if (i === 0) {
        if (dayHours.openTime > currentTime) {
          return {
            dayOfWeek: checkDay,
            openTime: dayHours.openTime,
            isToday: true,
            isTomorrow: false
          };
        }
        // Se já passou o horário de abertura hoje, verificar se ainda está dentro do horário de funcionamento
        if (dayHours.closeTime && currentTime < dayHours.closeTime) {
          // Ainda está aberto, não precisa retornar próximo horário
          continue;
        }
      } else {
        return {
          dayOfWeek: checkDay,
          openTime: dayHours.openTime,
          isToday: false,
          isTomorrow: i === 1
        };
      }
    }
  }

  return null;
}

/**
 * Verifica se deve reabrir automaticamente baseado no fechamento manual e horários configurados
 */
export function shouldAutoReopen(manuallyClosedAt: Date | null, businessHoursData: BusinessHours[], currentDate: Date = new Date()): boolean {
  if (!manuallyClosedAt) return false;

  const currentDayOfWeek = currentDate.getDay();
  const currentTime = currentDate.toTimeString().slice(0, 5);

  // IMPORTANTE: manuallyClosedAt e currentDate devem estar no mesmo "espaço" de tempo.
  // getLocalDate() cria uma Date cujos getHours()/getDay() retornam valores locais,
  // então precisamos converter manuallyClosedAt da mesma forma para comparar corretamente.
  // Extrair hora/dia do fechamento manual para comparação baseada em string de tempo.
  const closedHour = manuallyClosedAt.getHours();
  const closedMin = manuallyClosedAt.getMinutes();
  const closedTimeStr = `${String(closedHour).padStart(2, '0')}:${String(closedMin).padStart(2, '0')}`;
  const closedDayOfWeek = manuallyClosedAt.getDay();

  // Encontrar o horário de hoje
  const todayHours = businessHoursData.find(h => h.dayOfWeek === currentDayOfWeek);

  if (!todayHours || !todayHours.isActive || !todayHours.openTime) return false;

  // Normalizar datas para comparação de dia (sem hora)
  const closedDate = new Date(manuallyClosedAt);
  closedDate.setHours(0, 0, 0, 0);
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  const isSameDay = closedDate.getTime() === today.getTime();
  const isDifferentDay = closedDate.getTime() < today.getTime();

  // Caso 1: Fechamento foi em um dia anterior
  // Reabrir se hoje tem horário ativo e já passou do horário de abertura
  if (isDifferentDay && currentTime >= todayHours.openTime) {
    return true;
  }

  // Caso 2: Fechamento foi no mesmo dia, ANTES do horário de abertura
  // Ex: Fechou às 08:00, abre às 11:00, agora são 12:00 → reabrir
  if (isSameDay && closedTimeStr < todayHours.openTime && currentTime >= todayHours.openTime) {
    return true;
  }

  // Caso 3: Fechamento foi no mesmo dia, DURANTE o expediente
  // Ex: Sábado abre 11:00-00:00, dono fechou às 15:00, agora são 18:00
  // Manter fechado até o PRÓXIMO período de abertura (dia seguinte)
  // Não reabrir no mesmo dia - o dono fechou intencionalmente

  return false;
}

/**
 * Calcula o status completo do estabelecimento considerando:
 * 1. Fechamento manual (prioridade)
 * 2. Reabertura automática no próximo horário configurado
 * 3. Horários de funcionamento
 */
export async function getEstablishmentOpenStatus(establishmentId: number): Promise<{
  isOpen: boolean;
  manuallyClosed: boolean;
  nextOpeningTime: { dayOfWeek: number; openTime: string; isToday: boolean; isTomorrow: boolean } | null;
  shouldAutoReopen: boolean;
  scheduledClosure?: boolean;
  scheduledClosureReason?: string | null;
}> {
  const db = await getDb();
  if (!db) {
    return { isOpen: false, manuallyClosed: false, nextOpeningTime: null, shouldAutoReopen: false };
  }

  // Buscar dados do estabelecimento
  const [establishment] = await db.select().from(establishments).where(eq(establishments.id, establishmentId));
  if (!establishment) {
    return { isOpen: false, manuallyClosed: false, nextOpeningTime: null, shouldAutoReopen: false };
  }

  // Buscar horários de funcionamento
  const hours = await getBusinessHoursByEstablishment(establishmentId);

  // Usar timezone configurado do estabelecimento
  const tz = establishment.timezone || 'America/Sao_Paulo';
  const localDate = getLocalDate(tz);
  const currentDayOfWeek = localDate.getDay();
  const currentTime = localDate.toTimeString().slice(0, 5);

  // Verificar se está dentro do horário de funcionamento
  // Considera horários que atravessam a meia-noite (ex: 08:00 - 02:00)
  const todayHours = hours.find(h => h.dayOfWeek === currentDayOfWeek);
  const yesterdayDayOfWeek = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const yesterdayHours = hours.find(h => h.dayOfWeek === yesterdayDayOfWeek);

  // Função auxiliar para verificar se o horário atravessa meia-noite
  const crossesMidnight = (openTime: string, closeTime: string) => closeTime < openTime;

  // Verificar se está dentro do horário de hoje
  let isWithinSchedule = false;

  if (todayHours?.isActive && todayHours.openTime && todayHours.closeTime) {
    if (crossesMidnight(todayHours.openTime, todayHours.closeTime)) {
      // Horário atravessa meia-noite (ex: 08:00 - 02:00)
      // Está aberto se: hora atual >= abertura (ex: 08:00 até 23:59)
      isWithinSchedule = currentTime >= todayHours.openTime;
    } else {
      // Horário normal no mesmo dia (ex: 08:00 - 22:00)
      isWithinSchedule = currentTime >= todayHours.openTime && currentTime < todayHours.closeTime;
    }
  }

  // Verificar se está dentro do horário de ontem que atravessa meia-noite
  // Ex: Se ontem abriu 08:00-02:00, e agora são 01:00, ainda está aberto
  if (!isWithinSchedule && yesterdayHours?.isActive && yesterdayHours.openTime && yesterdayHours.closeTime) {
    if (crossesMidnight(yesterdayHours.openTime, yesterdayHours.closeTime)) {
      // Horário de ontem atravessa meia-noite
      // Está aberto se: hora atual < fechamento (ex: 00:00 até 02:00)
      isWithinSchedule = currentTime < yesterdayHours.closeTime;
    }
  }

  // Calcular próximo horário de abertura (usando timezone do estabelecimento)
  const nextOpening = getNextOpeningTime(hours, localDate);

  // Verificar se deve reabrir automaticamente
  // IMPORTANTE: converter manuallyClosedAt para o mesmo "espaço" de tempo que localDate
  // localDate é criado via getLocalDate() que produz uma Date cujos getHours()/getDay() são locais
  // manuallyClosedAt vem do DB como UTC, então precisamos convertê-lo da mesma forma
  let localClosedAt: Date | null = null;
  if (establishment.manuallyClosedAt) {
    localClosedAt = new Date(
      new Date(establishment.manuallyClosedAt).toLocaleString('en-US', { timeZone: tz })
    );
  }
  const autoReopen = shouldAutoReopen(
    localClosedAt,
    hours,
    localDate
  );

  // Verificar fechamento programado (scheduled closures)
  const scheduledCheck = await checkScheduledClosure(establishmentId, tz);
  if (scheduledCheck.isClosed) {
    // Fechamento programado ativo — estabelecimento fechado independente de horário
    // Se o nextOpening é para hoje, precisamos pular para o próximo dia
    // porque hoje está fechado por agendamento
    let adjustedNextOpening = nextOpening;
    if (nextOpening && nextOpening.isToday) {
      // Recalcular próximo horário a partir de amanhã
      const tomorrow = new Date(localDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      adjustedNextOpening = getNextOpeningTime(hours, tomorrow);
      // Ajustar as flags isToday/isTomorrow pois calculamos a partir de amanhã
      if (adjustedNextOpening) {
        adjustedNextOpening = {
          ...adjustedNextOpening,
          isToday: false,
          isTomorrow: adjustedNextOpening.isToday // o "hoje" de amanhã é "amanhã" para nós
        };
      }
    }
    return {
      isOpen: false,
      manuallyClosed: false,
      nextOpeningTime: adjustedNextOpening,
      shouldAutoReopen: false,
      scheduledClosure: true,
      scheduledClosureReason: scheduledCheck.reason
    };
  }

  // Lógica de status:
  // 1. Se manuallyClosed E não deve reabrir automaticamente → Fechado
  // 2. Se manuallyClosed E deve reabrir automaticamente → Aberto (se dentro do horário)
  // 3. Se manuallyOpened E dentro do horário programado → Limpar flag manual, seguir horário automático (permite fechar no horário)
  // 4. Se manuallyOpened E fora do horário programado → Aberto (abertura manual)
  // 5. Caso contrário → Segue horário configurado

  let isOpen = false;
  let manuallyClosed = establishment.manuallyClosed;
  let shouldClearManuallyOpened = false;

  if (manuallyClosed && autoReopen) {
    // Deve reabrir automaticamente
    manuallyClosed = false;
    isOpen = isWithinSchedule || false;
  } else if (manuallyClosed) {
    // Permanece fechado manualmente
    isOpen = false;
  } else if (establishment.manuallyOpened && isWithinSchedule) {
    // Aberto manualmente MAS agora estamos dentro do horário programado
    // Limpar o flag manual para que o restaurante passe a seguir o horário automático
    // Isso permite que o restaurante feche automaticamente no horário programado
    isOpen = true;
    shouldClearManuallyOpened = true;
  } else if (establishment.manuallyOpened && !isWithinSchedule) {
    // Aberto manualmente fora do horário comercial
    isOpen = true;
  } else {
    // Segue horário configurado - se estiver dentro do horário, está aberto
    isOpen = isWithinSchedule || false;
  }

  // Limpar flag manuallyOpened no banco quando o horário programado absorve a abertura manual
  if (shouldClearManuallyOpened) {
    const dbConn = await getDb();
    if (dbConn) {
      dbConn.update(establishments)
        .set({ manuallyOpened: false, manuallyOpenedAt: null })
        .where(eq(establishments.id, establishmentId))
        .then(() => {
          console.log(`[OpenStatus] Cleared manuallyOpened for establishment ${establishmentId} - now following scheduled hours`);
        })
        .catch((err: unknown) => {
          console.error(`[OpenStatus] Failed to clear manuallyOpened for establishment ${establishmentId}:`, err);
        });
    }
  }

  return {
    isOpen,
    manuallyClosed,
    nextOpeningTime: nextOpening,
    shouldAutoReopen: autoReopen
  };
}

/**
 * Atualiza o status de fechamento manual do estabelecimento
 */
export async function setManualClose(establishmentId: number, close: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (close) {
    // Fechar manualmente - limpar abertura manual também
    await db.update(establishments)
      .set({
        manuallyClosed: true,
        manuallyClosedAt: new Date(),
        manuallyOpened: false,
        manuallyOpenedAt: null,
        isOpen: false
      })
      .where(eq(establishments.id, establishmentId));
  } else {
    // Abrir manualmente - marcar como manuallyOpened
    await db.update(establishments)
      .set({
        manuallyClosed: false,
        manuallyClosedAt: null,
        manuallyOpened: true,
        manuallyOpenedAt: new Date(),
        isOpen: true
      })
      .where(eq(establishments.id, establishmentId));
  }
}

/**
 * Limpa o status de fechamento manual (usado quando reabre automaticamente)
 */
export async function clearManualClose(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments)
    .set({
      manuallyClosed: false,
      manuallyClosedAt: null,
      manuallyOpened: false,
      manuallyOpenedAt: null
    })
    .where(eq(establishments.id, establishmentId));
}


// ============ LOYALTY CARD FUNCTIONS ============

/**
 * Normaliza número de telefone removendo caracteres especiais
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Busca cartão de fidelidade por telefone e estabelecimento
 * Busca tanto pelo telefone normalizado quanto pelo original para compatibilidade
 */
export async function getLoyaltyCardByPhone(establishmentId: number, phone: string): Promise<LoyaltyCard | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const normalizedPhone = normalizePhone(phone);

  // Buscar pelo telefone normalizado OU pelo telefone original (para compatibilidade)
  const result = await db.select().from(loyaltyCards)
    .where(and(
      eq(loyaltyCards.establishmentId, establishmentId),
      or(
        eq(loyaltyCards.customerPhone, normalizedPhone),
        eq(loyaltyCards.customerPhone, phone)
      )
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Cria um novo cartão de fidelidade
 * Sempre salva o telefone normalizado (apenas números)
 */
export async function createLoyaltyCard(data: {
  establishmentId: number;
  customerPhone: string;
  customerName?: string;
  password4Hash: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalizar telefone antes de salvar
  const normalizedPhone = normalizePhone(data.customerPhone);

  const result = await db.insert(loyaltyCards).values({
    establishmentId: data.establishmentId,
    customerPhone: normalizedPhone,
    customerName: data.customerName || null,
    password4Hash: data.password4Hash,
    stamps: 0,
    totalStampsEarned: 0,
    couponsEarned: 0,
    registeredByCustomer: true, // Cliente se cadastrou voluntariamente
  });

  return result[0].insertId;
}

/**
 * Atualiza o cartão de fidelidade
 */
export async function updateLoyaltyCard(id: number, data: Partial<InsertLoyaltyCard>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(loyaltyCards).set(data).where(eq(loyaltyCards.id, id));
}

/**
 * Adiciona um carimbo ao cartão de fidelidade
 */
export async function addLoyaltyStamp(data: {
  loyaltyCardId: number;
  orderId: number;
  orderNumber: string;
  orderTotal: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Inserir registro do carimbo
  await db.insert(loyaltyStamps).values({
    loyaltyCardId: data.loyaltyCardId,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    orderTotal: data.orderTotal,
  });

  // Incrementar contador de carimbos no cartão
  await db.update(loyaltyCards)
    .set({
      stamps: sql`${loyaltyCards.stamps} + 1`,
      totalStampsEarned: sql`${loyaltyCards.totalStampsEarned} + 1`,
    })
    .where(eq(loyaltyCards.id, data.loyaltyCardId));
}

/**
 * Busca histórico de carimbos do cartão
 */
export async function getLoyaltyStamps(loyaltyCardId: number): Promise<LoyaltyStamp[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(loyaltyStamps)
    .where(eq(loyaltyStamps.loyaltyCardId, loyaltyCardId))
    .orderBy(desc(loyaltyStamps.createdAt));
}

/**
 * Reseta os carimbos do cartão quando cupom é liberado
 */
export async function resetLoyaltyStamps(loyaltyCardId: number, couponId?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(loyaltyCards)
    .set({
      stamps: 0,
      couponsEarned: sql`${loyaltyCards.couponsEarned} + 1`,
      activeCouponId: couponId || null,
    })
    .where(eq(loyaltyCards.id, loyaltyCardId));
}

/**
 * Reseta os carimbos do cartão quando usuário visualiza o cupom ganho
 * Não incrementa couponsEarned pois já foi incrementado ao completar o cartão
 * Mantém o activeCouponId para o usuário poder usar o cupom
 */
export async function resetLoyaltyStampsOnCouponView(loyaltyCardId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Apenas resetar os carimbos, manter o cupom ativo
  await db.update(loyaltyCards)
    .set({
      stamps: 0,
    })
    .where(eq(loyaltyCards.id, loyaltyCardId));

  // Histórico de carimbos é preservado - não deletar

  logger.info(`[Fidelidade] Carimbos resetados para cartão ${loyaltyCardId} após visualização do cupom (histórico preservado)`);
}

/**
 * Limpa o cupom ativo do cartão (quando usado)
 */
export async function clearActiveCoupon(loyaltyCardId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(loyaltyCards)
    .set({ activeCouponId: null })
    .where(eq(loyaltyCards.id, loyaltyCardId));
}

/**
 * Busca cartão de fidelidade por ID
 */
export async function getLoyaltyCardById(id: number): Promise<LoyaltyCard | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(loyaltyCards)
    .where(eq(loyaltyCards.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Busca todos os cartões de fidelidade de um estabelecimento
 */
export async function getLoyaltyCardsByEstablishment(establishmentId: number): Promise<LoyaltyCard[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(loyaltyCards)
    .where(eq(loyaltyCards.establishmentId, establishmentId))
    .orderBy(desc(loyaltyCards.updatedAt));
}

/**
 * Verifica se o pedido já gerou carimbo
 */
export async function hasStampForOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(loyaltyStamps)
    .where(eq(loyaltyStamps.orderId, orderId));

  return (result[0]?.count ?? 0) > 0;
}

/**
 * Processa carimbo de fidelidade para um pedido entregue
 */
export async function processLoyaltyStampForOrder(
  establishmentId: number,
  orderId: number,
  orderNumber: string,
  orderTotal: string,
  customerPhone: string
): Promise<{ stampAdded: boolean; couponUnlocked: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se fidelidade está ativa no estabelecimento
  const establishment = await getEstablishmentById(establishmentId);
  if (!establishment || !establishment.loyaltyEnabled) {
    return { stampAdded: false, couponUnlocked: false, message: "Fidelidade não está ativa" };
  }

  // Verificar valor mínimo do pedido
  const minOrderValue = Number(establishment.loyaltyMinOrderValue) || 0;
  if (minOrderValue > 0 && Number(orderTotal) < minOrderValue) {
    return { stampAdded: false, couponUnlocked: false, message: `Pedido abaixo do valor mínimo de R$ ${minOrderValue.toFixed(2)}` };
  }

  // Verificar se já existe carimbo para este pedido
  const alreadyHasStamp = await hasStampForOrder(orderId);
  if (alreadyHasStamp) {
    return { stampAdded: false, couponUnlocked: false, message: "Pedido já gerou carimbo" };
  }

  // Buscar cartão de fidelidade (somente clientes cadastrados voluntariamente)
  const loyaltyCard = await getLoyaltyCardByPhone(establishmentId, customerPhone);
  if (!loyaltyCard) {
    // Não criar cartão automaticamente — o cliente precisa se cadastrar primeiro
    logger.info(`[Fidelidade] Cliente ${customerPhone} não possui cadastro no programa de fidelidade. Carimbo não concedido.`);
    return { stampAdded: false, couponUnlocked: false, message: "Cliente não cadastrado no programa de fidelidade" };
  }

  // Verificar se o cliente se cadastrou voluntariamente
  if (!loyaltyCard.registeredByCustomer) {
    logger.info(`[Fidelidade] Cliente ${customerPhone} tem cartão mas não se cadastrou voluntariamente. Carimbo não concedido.`);
    return { stampAdded: false, couponUnlocked: false, message: "Cliente não cadastrado no programa de fidelidade" };
  }

  // Verificar se o cartão já foi completado
  // Se sim, resetar os carimbos antes de adicionar o novo
  const requiredStamps = establishment.loyaltyStampsRequired || 6;
  let currentStamps = loyaltyCard.stamps;

  logger.info(`[Fidelidade] Verificando cartão ${loyaltyCard.id}: stamps=${currentStamps}, required=${requiredStamps}, activeCouponId=${loyaltyCard.activeCouponId}`);

  if (currentStamps >= requiredStamps) {
    // Cartão já foi completado - resetar carimbos para começar novo ciclo
    logger.info(`[Fidelidade] Cartão ${loyaltyCard.id} já completado (${currentStamps}/${requiredStamps}). Resetando para novo ciclo.`);

    // Resetar carimbos para 0
    await db.update(loyaltyCards)
      .set({ stamps: 0 })
      .where(eq(loyaltyCards.id, loyaltyCard.id));

    // Histórico de carimbos é preservado - não deletar

    currentStamps = 0;
  }

  // Adicionar carimbo
  await addLoyaltyStamp({
    loyaltyCardId: loyaltyCard.id,
    orderId,
    orderNumber,
    orderTotal,
  });

  const newStampCount = currentStamps + 1;

  if (newStampCount >= requiredStamps) {
    // Completou o cartão - criar cupom de fidelidade (verifica unicidade no banco)
    const couponCode = await generateUniqueLoyaltyCouponCode(establishmentId);
    const couponType = establishment.loyaltyCouponType === 'percentage' ? 'percentage' : 'fixed';
    const couponValue = establishment.loyaltyCouponValue || "10";

    const couponResult = await db.insert(coupons).values({
      establishmentId,
      code: couponCode,
      type: couponType,
      value: couponValue,
      quantity: 1,
      usedCount: 0,
      status: 'active',
    });

    // Vincular o cupom ao cartão (não resetar carimbos aqui - será resetado no próximo pedido)
    // Adicionar ao array de cupons ativos
    const currentActiveCouponIds = loyaltyCard.activeCouponIds || [];
    const newActiveCouponIds = [...currentActiveCouponIds, couponResult[0].insertId];

    await db.update(loyaltyCards)
      .set({
        activeCouponId: couponResult[0].insertId, // Manter para compatibilidade
        activeCouponIds: newActiveCouponIds, // Array com todos os cupons
        couponsEarned: sql`${loyaltyCards.couponsEarned} + 1`,
      })
      .where(eq(loyaltyCards.id, loyaltyCard.id));

    return {
      stampAdded: true,
      couponUnlocked: true,
      message: `Parabéns! Você ganhou um cupom de ${couponType === 'percentage' ? `${couponValue}%` : `R$ ${Number(couponValue).toFixed(2)}`} de desconto!`
    };
  }

  return {
    stampAdded: true,
    couponUnlocked: false,
    message: `Carimbo adicionado! Faltam ${requiredStamps - newStampCount} para ganhar seu cupom.`
  };
}

/**
 * Consome um cupom de fidelidade específico
 * Chamado quando o cliente usa o cupom de fidelidade em um pedido
 */
export async function consumeLoyaltyCardCoupon(loyaltyCardId: number, couponIdToConsume?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar o cartão para obter os cupons ativos
  const card = await db.select().from(loyaltyCards)
    .where(eq(loyaltyCards.id, loyaltyCardId))
    .limit(1);

  if (card.length === 0) {
    throw new Error("Cartão de fidelidade não encontrado");
  }

  // Usar o cupom especificado ou o primeiro do array/legado
  const activeCouponIds = card[0].activeCouponIds || [];
  const couponIdToUse = couponIdToConsume || card[0].activeCouponId || (activeCouponIds.length > 0 ? activeCouponIds[0] : null);

  // Marcar o cupom como usado e invalidado (se existir)
  // Cupons de fidelidade só podem ser usados UMA Única vez
  if (couponIdToUse) {
    await db.update(coupons)
      .set({
        usedCount: 1,
        quantity: 1, // Garantir que não pode ser usado novamente
        status: 'exhausted', // Marcar como esgotado imediatamente após uso
      })
      .where(eq(coupons.id, couponIdToUse));
  }

  // Remover o cupom usado do array
  const newActiveCouponIds = activeCouponIds.filter(id => id !== couponIdToUse);

  // Atualizar o cartão - definir o próximo cupom como ativo (se houver)
  const nextActiveCouponId = newActiveCouponIds.length > 0 ? newActiveCouponIds[0] : null;

  await db.update(loyaltyCards)
    .set({
      activeCouponId: nextActiveCouponId, // Próximo cupom ou null
      activeCouponIds: newActiveCouponIds.length > 0 ? newActiveCouponIds : null, // Array atualizado ou null
    })
    .where(eq(loyaltyCards.id, loyaltyCardId));

  // Histórico de carimbos é preservado - não deletar

  logger.info(`[Fidelidade] Cupom ${couponIdToUse} consumido. Cupons restantes: ${newActiveCouponIds.length}`);
}


// ============ PRINTER FUNCTIONS ============

/**
 * Busca todas as impressoras de um estabelecimento
 */
export async function getPrintersByEstablishment(establishmentId: number): Promise<Printer[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(printers)
    .where(eq(printers.establishmentId, establishmentId))
    .orderBy(desc(printers.isDefault), asc(printers.name));
}

/**
 * Busca uma impressora por ID
 */


/**
 * Registra ou atualiza uma impressora via app (auto-registro)
 * Se já existe um dispositivo com o mesmo deviceId para o estabelecimento, atualiza.
 * Se não existe, cria uma nova entrada.
 */
export async function registerPrinterDevice(data: {
  establishmentId: number;
  deviceName: string;
  deviceId: string;
  deviceModel?: string;
  platform?: string;
  ipAddress?: string;
}): Promise<{ id: number; isNew: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe uma impressora com esse deviceId para o estabelecimento
  const existing = await db.select().from(printers)
    .where(and(
      eq(printers.establishmentId, data.establishmentId),
      eq(printers.deviceId, data.deviceId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar lastSeenAt e marcar como ativa
    await db.update(printers)
      .set({ 
        isActive: true, 
        lastSeenAt: new Date(),
        name: data.deviceName,
        ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
        ...(data.deviceModel ? { deviceModel: data.deviceModel } : {}),
        ...(data.platform ? { platform: data.platform } : {}),
      })
      .where(eq(printers.id, existing[0].id));
    return { id: existing[0].id, isNew: false };
  }
  
  // Criar nova impressora
  const result = await db.insert(printers).values({
    establishmentId: data.establishmentId,
    name: data.deviceName,
    ipAddress: data.ipAddress || 'app-connected',
    port: 9100,
    printerType: 'all',
    isActive: true,
    isDefault: false,
    deviceId: data.deviceId,
    deviceModel: data.deviceModel || null,
    platform: data.platform || null,
    lastSeenAt: new Date(),
  });
  
  return { id: Number(result[0].insertId), isNew: true };
}

/**
 * Atualiza lastSeenAt de uma impressora por deviceId
 */
export async function updatePrinterLastSeen(establishmentId: number, deviceId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(printers)
    .set({ lastSeenAt: new Date(), isActive: true })
    .where(and(
      eq(printers.establishmentId, establishmentId),
      eq(printers.deviceId, deviceId)
    ));
}

export async function getPrinterById(id: number): Promise<Printer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(printers)
    .where(eq(printers.id, id))
    .limit(1);

  return result[0];
}

/**
 * Cria uma nova impressora
 */
export async function createPrinter(data: {
  establishmentId: number;
  name: string;
  ipAddress: string;
  port?: number;
  printerType?: string;
  categoryIds?: string;
  isActive?: boolean;
  isDefault?: boolean;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se for definida como padrão, remover padrão das outras
  if (data.isDefault) {
    await db.update(printers)
      .set({ isDefault: false })
      .where(eq(printers.establishmentId, data.establishmentId));
  }

  const result = await db.insert(printers).values({
    establishmentId: data.establishmentId,
    name: data.name,
    ipAddress: data.ipAddress,
    port: data.port || 9100,
    printerType: data.printerType || 'all',
    categoryIds: data.categoryIds || null,
    isActive: data.isActive ?? true,
    isDefault: data.isDefault ?? false,
  });

  return result[0].insertId;
}

/**
 * Atualiza uma impressora
 */
export async function updatePrinter(id: number, data: Partial<InsertPrinter>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se for definida como padrão, remover padrão das outras
  if (data.isDefault) {
    const printer = await getPrinterById(id);
    if (printer) {
      await db.update(printers)
        .set({ isDefault: false })
        .where(and(
          eq(printers.establishmentId, printer.establishmentId),
          sql`${printers.id} != ${id}`
        ));
    }
  }

  await db.update(printers).set(data).where(eq(printers.id, id));
}

/**
 * Deleta uma impressora
 */
export async function deletePrinter(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(printers).where(eq(printers.id, id));
}

/**
 * Busca todas as impressoras ativas de um estabelecimento
 */
export async function getActivePrinters(establishmentId: number): Promise<Printer[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(printers)
    .where(and(
      eq(printers.establishmentId, establishmentId),
      eq(printers.isActive, true)
    ))
    .orderBy(desc(printers.isDefault), asc(printers.name));
}

/**
 * Busca configurações de impressão de um estabelecimento
 */
export async function getPrinterSettings(establishmentId: number): Promise<PrinterSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(printerSettings)
    .where(eq(printerSettings.establishmentId, establishmentId))
    .limit(1);

  return result[0];
}

/**
 * Cria ou atualiza configurações de impressão
 */
export async function upsertPrinterSettings(data: {
  establishmentId: number;
  autoPrintEnabled?: boolean;
  printOnNewOrder?: boolean;
  printOnStatusChange?: boolean;
  copies?: number;
  showLogo?: boolean;
  logoUrl?: string | null;
  showQrCode?: boolean;
  qrCodeUrl?: string | null;
  headerMessage?: string | null;
  footerMessage?: string | null;
  paperWidth?: string;
  posPrinterEnabled?: boolean;
  posPrinterLinkcode?: string | null;
  posPrinterNumber?: number;
  directPrintEnabled?: boolean;
  directPrintIp?: string | null;
  directPrintPort?: number;
  fontSize?: number;
  fontWeight?: number;
  titleFontSize?: number;
  titleFontWeight?: number;
  itemFontSize?: number;
  itemFontWeight?: number;
  obsFontSize?: number;
  obsFontWeight?: number;
  showDividers?: boolean;
  boxPadding?: number;
  itemBorderStyle?: string;
  defaultPrintMethod?: 'normal' | 'android' | 'automatic';
  htmlPrintEnabled?: boolean;
  beepOnPrint?: boolean;
  mindiFontSize?: number;
  mindiFontWeight?: number;
  mindiTitleFontSize?: number;
  mindiTitleFontWeight?: number;
  mindiItemFontSize?: number;
  mindiItemFontWeight?: number;
  mindiObsFontSize?: number;
  mindiObsFontWeight?: number;
  mindiShowDividers?: boolean;
  mindiBoxPadding?: number;
  mindiItemBorderStyle?: string;
  mindiPaperWidth?: string;
  mindiShowLogo?: boolean;
  mindiHeaderMessage?: string | null;
  mindiFooterMessage?: string | null;
  mindiBeepOnPrint?: boolean;
  mindiHtmlPrintEnabled?: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getPrinterSettings(data.establishmentId);

  if (existing) {
    await db.update(printerSettings)
      .set({
        autoPrintEnabled: data.autoPrintEnabled ?? existing.autoPrintEnabled,
        printOnNewOrder: data.printOnNewOrder ?? existing.printOnNewOrder,
        printOnStatusChange: data.printOnStatusChange ?? existing.printOnStatusChange,
        copies: data.copies ?? existing.copies,
        showLogo: data.showLogo ?? existing.showLogo,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : (existing as any).logoUrl,
        showQrCode: data.showQrCode ?? existing.showQrCode,
        qrCodeUrl: data.qrCodeUrl !== undefined ? data.qrCodeUrl : (existing as any).qrCodeUrl,
        headerMessage: data.headerMessage !== undefined ? data.headerMessage : (existing as any).headerMessage,
        footerMessage: data.footerMessage !== undefined ? data.footerMessage : existing.footerMessage,
        paperWidth: data.paperWidth ?? (existing as any).paperWidth ?? '80mm',
        posPrinterEnabled: data.posPrinterEnabled ?? (existing as any).posPrinterEnabled ?? false,
        posPrinterLinkcode: data.posPrinterLinkcode !== undefined ? data.posPrinterLinkcode : (existing as any).posPrinterLinkcode,
        posPrinterNumber: data.posPrinterNumber ?? (existing as any).posPrinterNumber ?? 1,
        directPrintEnabled: data.directPrintEnabled ?? (existing as any).directPrintEnabled ?? false,
        directPrintIp: data.directPrintIp !== undefined ? data.directPrintIp : (existing as any).directPrintIp,
        directPrintPort: data.directPrintPort ?? (existing as any).directPrintPort ?? 9100,
        fontSize: data.fontSize ?? (existing as any).fontSize ?? 12,
        fontWeight: data.fontWeight ?? (existing as any).fontWeight ?? 500,
        titleFontSize: data.titleFontSize ?? (existing as any).titleFontSize ?? 16,
        titleFontWeight: data.titleFontWeight ?? (existing as any).titleFontWeight ?? 700,
        itemFontSize: data.itemFontSize ?? (existing as any).itemFontSize ?? 12,
        itemFontWeight: data.itemFontWeight ?? (existing as any).itemFontWeight ?? 700,
        obsFontSize: data.obsFontSize ?? (existing as any).obsFontSize ?? 11,
        obsFontWeight: data.obsFontWeight ?? (existing as any).obsFontWeight ?? 500,
        showDividers: data.showDividers ?? (existing as any).showDividers ?? false,
        boxPadding: data.boxPadding ?? (existing as any).boxPadding ?? 12,
        itemBorderStyle: data.itemBorderStyle ?? (existing as any).itemBorderStyle ?? 'rounded',
        defaultPrintMethod: data.defaultPrintMethod ?? (existing as any).defaultPrintMethod ?? 'normal',
        htmlPrintEnabled: data.htmlPrintEnabled ?? (existing as any).htmlPrintEnabled ?? true,
        beepOnPrint: data.beepOnPrint ?? (existing as any).beepOnPrint ?? false,
        mindiFontSize: data.mindiFontSize ?? (existing as any).mindiFontSize ?? 12,
        mindiFontWeight: data.mindiFontWeight ?? (existing as any).mindiFontWeight ?? 500,
        mindiTitleFontSize: data.mindiTitleFontSize ?? (existing as any).mindiTitleFontSize ?? 16,
        mindiTitleFontWeight: data.mindiTitleFontWeight ?? (existing as any).mindiTitleFontWeight ?? 700,
        mindiItemFontSize: data.mindiItemFontSize ?? (existing as any).mindiItemFontSize ?? 12,
        mindiItemFontWeight: data.mindiItemFontWeight ?? (existing as any).mindiItemFontWeight ?? 700,
        mindiObsFontSize: data.mindiObsFontSize ?? (existing as any).mindiObsFontSize ?? 11,
        mindiObsFontWeight: data.mindiObsFontWeight ?? (existing as any).mindiObsFontWeight ?? 500,
        mindiShowDividers: data.mindiShowDividers ?? (existing as any).mindiShowDividers ?? false,
        mindiBoxPadding: data.mindiBoxPadding ?? (existing as any).mindiBoxPadding ?? 12,
        mindiItemBorderStyle: data.mindiItemBorderStyle ?? (existing as any).mindiItemBorderStyle ?? 'rounded',
        mindiPaperWidth: data.mindiPaperWidth ?? (existing as any).mindiPaperWidth ?? '80mm',
        mindiShowLogo: data.mindiShowLogo ?? (existing as any).mindiShowLogo ?? true,
        mindiHeaderMessage: data.mindiHeaderMessage !== undefined ? data.mindiHeaderMessage : (existing as any).mindiHeaderMessage,
        mindiFooterMessage: data.mindiFooterMessage !== undefined ? data.mindiFooterMessage : (existing as any).mindiFooterMessage,
        mindiBeepOnPrint: data.mindiBeepOnPrint ?? (existing as any).mindiBeepOnPrint ?? false,
        mindiHtmlPrintEnabled: data.mindiHtmlPrintEnabled ?? (existing as any).mindiHtmlPrintEnabled ?? true,
      })
      .where(eq(printerSettings.establishmentId, data.establishmentId));
  } else {
    await db.insert(printerSettings).values({
      establishmentId: data.establishmentId,
      autoPrintEnabled: data.autoPrintEnabled ?? false,
      printOnNewOrder: data.printOnNewOrder ?? true,
      printOnStatusChange: data.printOnStatusChange ?? false,
      copies: data.copies ?? 1,
      showLogo: data.showLogo ?? true,
      logoUrl: data.logoUrl || null,
      showQrCode: data.showQrCode ?? false,
      qrCodeUrl: data.qrCodeUrl || null,
      headerMessage: data.headerMessage || null,
      footerMessage: data.footerMessage || null,
      paperWidth: data.paperWidth || '80mm',
      posPrinterEnabled: data.posPrinterEnabled ?? false,
      posPrinterLinkcode: data.posPrinterLinkcode || null,
      posPrinterNumber: data.posPrinterNumber ?? 1,
      directPrintEnabled: data.directPrintEnabled ?? false,
      directPrintIp: data.directPrintIp || null,
      directPrintPort: data.directPrintPort ?? 9100,
      fontSize: data.fontSize ?? 12,
      fontWeight: data.fontWeight ?? 500,
      titleFontSize: data.titleFontSize ?? 16,
      titleFontWeight: data.titleFontWeight ?? 700,
      itemFontSize: data.itemFontSize ?? 12,
      itemFontWeight: data.itemFontWeight ?? 700,
      obsFontSize: data.obsFontSize ?? 11,
      obsFontWeight: data.obsFontWeight ?? 500,
      showDividers: data.showDividers ?? false,
      boxPadding: data.boxPadding ?? 12,
      itemBorderStyle: data.itemBorderStyle ?? 'rounded',
      defaultPrintMethod: data.defaultPrintMethod ?? 'normal',
      htmlPrintEnabled: data.htmlPrintEnabled ?? true,
      beepOnPrint: data.beepOnPrint ?? false,
      mindiFontSize: data.mindiFontSize ?? 12,
      mindiFontWeight: data.mindiFontWeight ?? 500,
      mindiTitleFontSize: data.mindiTitleFontSize ?? 16,
      mindiTitleFontWeight: data.mindiTitleFontWeight ?? 700,
      mindiItemFontSize: data.mindiItemFontSize ?? 12,
      mindiItemFontWeight: data.mindiItemFontWeight ?? 700,
      mindiObsFontSize: data.mindiObsFontSize ?? 11,
      mindiObsFontWeight: data.mindiObsFontWeight ?? 500,
      mindiShowDividers: data.mindiShowDividers ?? false,
      mindiBoxPadding: data.mindiBoxPadding ?? 12,
      mindiItemBorderStyle: data.mindiItemBorderStyle ?? 'rounded',
      mindiPaperWidth: data.mindiPaperWidth ?? '80mm',
      mindiShowLogo: data.mindiShowLogo ?? true,
      mindiHeaderMessage: data.mindiHeaderMessage || null,
      mindiFooterMessage: data.mindiFooterMessage || null,
      mindiBeepOnPrint: data.mindiBeepOnPrint ?? false,
      mindiHtmlPrintEnabled: data.mindiHtmlPrintEnabled ?? true,
    });
  }
}

/**
 * Busca estabelecimento por API key da impressora
 */
export async function getEstablishmentByPrinterApiKey(apiKey: string): Promise<{ establishmentId: number } | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({ establishmentId: printerSettings.establishmentId })
    .from(printerSettings)
    .where(eq(printerSettings.printerApiKey, apiKey))
    .limit(1);

  return result[0];
}

/**
 * Gera e salva uma nova API key para a impressora de um estabelecimento
 */
export async function generatePrinterApiKey(establishmentId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gerar key aleatória de 32 bytes em hex (64 chars)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let apiKey = 'pk_';
  for (let i = 0; i < 32; i++) {
    apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const existing = await getPrinterSettings(establishmentId);

  if (existing) {
    await db.update(printerSettings)
      .set({ printerApiKey: apiKey })
      .where(eq(printerSettings.establishmentId, establishmentId));
  } else {
    await db.insert(printerSettings).values({
      establishmentId,
      printerApiKey: apiKey,
    });
  }

  return apiKey;
}

/**
 * Revoga a API key da impressora de um estabelecimento
 */
export async function revokePrinterApiKey(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(printerSettings)
    .set({ printerApiKey: null })
    .where(eq(printerSettings.establishmentId, establishmentId));
}

/**
 * Busca a impressora padrão de um estabelecimento
 */
export async function getDefaultPrinter(establishmentId: number): Promise<Printer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  // Primeiro tenta buscar a impressora marcada como padrão
  let result = await db.select().from(printers)
    .where(and(
      eq(printers.establishmentId, establishmentId),
      eq(printers.isDefault, true),
      eq(printers.isActive, true)
    ))
    .limit(1);

  // Se não houver padrão, pega a primeira ativa
  if (result.length === 0) {
    result = await db.select().from(printers)
      .where(and(
        eq(printers.establishmentId, establishmentId),
        eq(printers.isActive, true)
      ))
      .limit(1);
  }

  return result[0];
}


// ============ PUSH SUBSCRIPTION FUNCTIONS ============

/**
 * Busca todas as push subscriptions de um estabelecimento
 */
export async function getPushSubscriptionsByEstablishment(establishmentId: number): Promise<PushSubscription[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.establishmentId, establishmentId))
    .orderBy(desc(pushSubscriptions.createdAt));
}

/**
 * Busca push subscription por endpoint
 */
export async function getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);

  return result[0];
}

/**
 * Cria ou atualiza uma push subscription
 */
export async function upsertPushSubscription(data: {
  establishmentId: number;
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe uma subscription com este endpoint
  const existing = await getPushSubscriptionByEndpoint(data.endpoint);

  if (existing) {
    // Atualizar subscription existente
    await db.update(pushSubscriptions)
      .set({
        establishmentId: data.establishmentId,
        userId: data.userId,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
      })
      .where(eq(pushSubscriptions.id, existing.id));
    return existing.id;
  }

  // Criar nova subscription
  const result = await db.insert(pushSubscriptions).values({
    establishmentId: data.establishmentId,
    userId: data.userId,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
    userAgent: data.userAgent,
  });

  return result[0].insertId;
}

/**
 * Remove uma push subscription por endpoint
 */
export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

/**
 * Remove uma push subscription por ID
 */
export async function deletePushSubscriptionById(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
}



// ============ WHATSAPP CONFIG FUNCTIONS ============

/**
 * Busca configuração do WhatsApp de um estabelecimento
 */
export async function getWhatsappConfig(establishmentId: number): Promise<WhatsappConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(whatsappConfig)
    .where(eq(whatsappConfig.establishmentId, establishmentId))
    .limit(1);

  return result[0];
}

/**
 * Busca configuração do WhatsApp pelo WABA ID.
 * Usado pelo webhook da Meta para identificar qual estabelecimento
 * está associado a um evento recebido.
 */
export async function getWhatsappConfigByWabaId(wabaId: string): Promise<WhatsappConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(whatsappConfig)
    .where(eq((whatsappConfig as any).wabaId, wabaId))
    .limit(1);

  return result[0];
}

/**
 * Cria ou atualiza configuração do WhatsApp
 */
export async function upsertWhatsappConfig(data: {
  establishmentId: number;
  instanceId?: string | null;
  instanceToken?: string | null;
  status?: 'disconnected' | 'connecting' | 'connected';
  connectedPhone?: string | null;
  lastQrCode?: string | null;
  qrCodeExpiresAt?: Date | null;
  requireOrderConfirmation?: boolean;
  notifyOnNewOrder?: boolean;
  notifyOnPreparing?: boolean;
  notifyOnReady?: boolean;
  notifyOnCompleted?: boolean;
  notifyOnCancelled?: boolean;
  templateNewOrder?: string | null;
  templatePreparing?: string | null;
  templateReady?: string | null;
  templateReadyPickup?: string | null;
  templateCompleted?: string | null;
  templateCancelled?: string | null;
  notifyOnReservation?: boolean;
  templateReservation?: string | null;
  webhookSecret?: string | null;
  // Official WhatsApp Cloud API
  provider?: 'uazapi' | 'official';
  wabaId?: string | null;
  phoneNumberId?: string | null;
  accessToken?: string | null;
  businessId?: string | null;
  metaWebhookSecret?: string | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getWhatsappConfig(data.establishmentId);

  if (existing) {
    await db.update(whatsappConfig)
      .set({
        instanceId: data.instanceId !== undefined ? data.instanceId : existing.instanceId,
        instanceToken: data.instanceToken !== undefined ? data.instanceToken : existing.instanceToken,
        status: data.status ?? existing.status,
        connectedPhone: data.connectedPhone !== undefined ? data.connectedPhone : existing.connectedPhone,
        lastQrCode: data.lastQrCode !== undefined ? data.lastQrCode : existing.lastQrCode,
        qrCodeExpiresAt: data.qrCodeExpiresAt !== undefined ? data.qrCodeExpiresAt : existing.qrCodeExpiresAt,
        requireOrderConfirmation: false, // Feature temporariamente BLOQUEADA
        notifyOnNewOrder: data.notifyOnNewOrder ?? existing.notifyOnNewOrder,
        notifyOnPreparing: data.notifyOnPreparing ?? existing.notifyOnPreparing,
        notifyOnReady: data.notifyOnReady ?? existing.notifyOnReady,
        notifyOnCompleted: data.notifyOnCompleted ?? existing.notifyOnCompleted,
        notifyOnCancelled: data.notifyOnCancelled ?? existing.notifyOnCancelled,
        templateNewOrder: data.templateNewOrder !== undefined ? data.templateNewOrder : existing.templateNewOrder,
        templatePreparing: data.templatePreparing !== undefined ? data.templatePreparing : existing.templatePreparing,
        templateReady: data.templateReady !== undefined ? data.templateReady : existing.templateReady,
        templateReadyPickup: data.templateReadyPickup !== undefined ? data.templateReadyPickup : existing.templateReadyPickup,
        templateCompleted: data.templateCompleted !== undefined ? data.templateCompleted : existing.templateCompleted,
        templateCancelled: data.templateCancelled !== undefined ? data.templateCancelled : existing.templateCancelled,
        notifyOnReservation: data.notifyOnReservation ?? existing.notifyOnReservation,
        templateReservation: data.templateReservation !== undefined ? data.templateReservation : existing.templateReservation,
        webhookSecret: data.webhookSecret !== undefined ? data.webhookSecret : existing.webhookSecret,
        // Official API fields — only update when explicitly provided
        provider: data.provider ?? (existing as any).provider,
        wabaId: data.wabaId !== undefined ? data.wabaId : (existing as any).wabaId,
        phoneNumberId: data.phoneNumberId !== undefined ? data.phoneNumberId : (existing as any).phoneNumberId,
        accessToken: data.accessToken !== undefined ? data.accessToken : (existing as any).accessToken,
        businessId: data.businessId !== undefined ? data.businessId : (existing as any).businessId,
        metaWebhookSecret: data.metaWebhookSecret !== undefined ? data.metaWebhookSecret : (existing as any).metaWebhookSecret,
      })
      .where(eq(whatsappConfig.establishmentId, data.establishmentId));
    return existing.id;
  }

  // Templates padrão para novos estabelecimentos
  const defaultTemplateNewOrder = `Olá *{{customerName}}!* 👋🏻  {{greeting}}, Tudo bem?

Seu pedido *{{orderNumber}}* foi recebido com sucesso!

{{itensPedido}}`;

  const defaultTemplatePreparing = `👨‍🍳 *{{customerName}},* seu pedido *{{orderNumber}}* está sendo preparado!

🔔 Você será notificado por aqui em cada etapa.`;

  const defaultTemplateReady = `✅ Seu pedido *{{orderNumber}}* está pronto!

{{deliveryMessage}}`;

  const defaultTemplateReadyPickup = `✅ Seu pedido *{{orderNumber}}* está pronto!

{{pickupMessage}}`;

  const defaultTemplateCompleted = `Seu pedido {{orderNumber}} foi finalizado!

❤️ Obrigado pela preferência!

*{{establishmentName}}*`;

  const defaultTemplateCancelled = `Olá *{{customerName}}!*

❌ Infelizmente seu pedido {{orderNumber}} foi cancelado.

Motivo: *{{cancellationReason}}*`;

  const result = await db.insert(whatsappConfig).values({
    establishmentId: data.establishmentId,
    instanceId: data.instanceId || null,
    instanceToken: data.instanceToken || null,
    status: data.status || 'disconnected',
    connectedPhone: data.connectedPhone || null,
    lastQrCode: data.lastQrCode || null,
    qrCodeExpiresAt: data.qrCodeExpiresAt || null,
    requireOrderConfirmation: false, // Feature temporariamente BLOQUEADA
    notifyOnNewOrder: data.notifyOnNewOrder ?? true,
    notifyOnPreparing: data.notifyOnPreparing ?? true,
    notifyOnReady: data.notifyOnReady ?? true,
    notifyOnCompleted: data.notifyOnCompleted ?? true, // Ativado por padrão
    notifyOnCancelled: data.notifyOnCancelled ?? true,
    templateNewOrder: data.templateNewOrder || defaultTemplateNewOrder,
    templatePreparing: data.templatePreparing || defaultTemplatePreparing,
    templateReady: data.templateReady || defaultTemplateReady,
    templateReadyPickup: data.templateReadyPickup || defaultTemplateReadyPickup,
    templateCompleted: data.templateCompleted || defaultTemplateCompleted,
    templateCancelled: data.templateCancelled || defaultTemplateCancelled,
    notifyOnReservation: data.notifyOnReservation ?? true,
    templateReservation: data.templateReservation || null,
    webhookSecret: data.webhookSecret || null,
    // Official API fields — persistidos também na criação inicial da configuração
    provider: data.provider ?? 'uazapi',
    wabaId: data.wabaId !== undefined ? data.wabaId : null,
    phoneNumberId: data.phoneNumberId !== undefined ? data.phoneNumberId : null,
    accessToken: data.accessToken !== undefined ? data.accessToken : null,
    businessId: data.businessId !== undefined ? data.businessId : null,
    metaWebhookSecret: data.metaWebhookSecret !== undefined ? data.metaWebhookSecret : null,
  });

  return result[0].insertId;
}

/**
 * Atualiza status da conexão WhatsApp
 */
export async function updateWhatsappStatus(
  establishmentId: number,
  status: 'disconnected' | 'connecting' | 'connected',
  connectedPhone?: string | null,
  qrCode?: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<InsertWhatsappConfig> = { status };

  if (connectedPhone !== undefined) {
    updateData.connectedPhone = connectedPhone;
  }

  if (qrCode !== undefined) {
    updateData.lastQrCode = qrCode;
    updateData.qrCodeExpiresAt = qrCode ? new Date(Date.now() + 60000) : null; // QR code expires in 60 seconds
  }

  await db.update(whatsappConfig)
    .set(updateData)
    .where(eq(whatsappConfig.establishmentId, establishmentId));
}

/**
 * Deleta configuração do WhatsApp
 */
export async function deleteWhatsappConfig(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(whatsappConfig).where(eq(whatsappConfig.establishmentId, establishmentId));
}

/**
 * Limpa o connectedPhone de TODOS os outros estabelecimentos que possuem o mesmo número.
 * Deve ser chamado quando um estabelecimento conecta com sucesso a um número,
 * para evitar conflitos no lookup do N8N (que busca por connectedPhone).
 */
export async function clearPhoneFromOtherEstablishments(
  currentEstablishmentId: number,
  phone: string
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.update(whatsappConfig)
    .set({ connectedPhone: null })
    .where(
      and(
        eq(whatsappConfig.connectedPhone, phone),
        ne(whatsappConfig.establishmentId, currentEstablishmentId)
      )
    );

  const affected = (result as any)[0]?.affectedRows ?? 0;
  if (affected > 0) {
    logger.info(`[WhatsApp] Limpou connectedPhone de ${affected} outro(s) estabelecimento(s) com o número ${phone}`);
  }
  return affected;
}

/**
 * Garante que existe uma API key não-global (isGlobal=false) para o estabelecimento.
 * O N8N precisa dessa key para autenticar chamadas ao bot-status, cardápio, etc.
 * Retorna a key existente ou cria uma nova.
 */
export async function ensureNonGlobalBotApiKey(
  establishmentId: number,
  establishmentName: string
): Promise<{ apiKey: string; created: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe uma key não-global ativa
  const existing = await db.select().from(botApiKeys)
    .where(
      and(
        eq(botApiKeys.establishmentId, establishmentId),
        eq(botApiKeys.isGlobal, false),
        eq(botApiKeys.isActive, true)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { apiKey: existing[0].apiKey, created: false };
  }

  // Criar nova key não-global
  const apiKey = `bot_${crypto.randomBytes(32).toString('hex')}`;
  await db.insert(botApiKeys).values({
    establishmentId,
    name: `Bot ${establishmentName}`,
    apiKey,
    apiKeyHash: hashApiKey(apiKey), // P09: Armazenar hash SHA-256
    isActive: true,
    isGlobal: false,
    requestCount: 0,
  });

  logger.info(`[WhatsApp] API Key não-global criada automaticamente para estabelecimento ${establishmentId}`);
  return { apiKey, created: true };
}


// ============ PRINT QUEUE FUNCTIONS ============

/**
 * Adiciona um pedido à fila de impressão
 */
export async function addToPrintQueue(data: {
  establishmentId: number;
  orderId: number;
  printerId?: number | null;
  copies?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(printQueue).values({
    establishmentId: data.establishmentId,
    orderId: data.orderId,
    printerId: data.printerId,
    copies: data.copies || 1,
    status: 'pending'
  });

  return Number(result[0].insertId);
}

/**
 * Busca pedidos pendentes na fila de impressão
 */
export async function getPendingPrintJobs(establishmentId: number): Promise<PrintQueue[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(printQueue)
    .where(and(
      eq(printQueue.establishmentId, establishmentId),
      eq(printQueue.status, 'pending')
    ))
    .orderBy(asc(printQueue.createdAt));

  return result;
}

/**
 * Atualiza status de um job na fila de impressão
 */
export async function updatePrintJobStatus(
  jobId: number,
  status: 'pending' | 'printing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === 'completed') {
    updateData.printedAt = new Date();
  }
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await db.update(printQueue).set(updateData).where(eq(printQueue.id, jobId));
}

/**
 * Busca um job específico da fila de impressão com dados do pedido
 */
export async function getPrintJobWithOrder(jobId: number): Promise<{
  job: PrintQueue;
  order: Order;
  items: any[];
} | null> {
  const db = await getDb();
  if (!db) return null;

  const jobResult = await db.select().from(printQueue).where(eq(printQueue.id, jobId)).limit(1);
  if (!jobResult.length) return null;

  const job = jobResult[0];

  const orderResult = await db.select().from(orders).where(eq(orders.id, job.orderId)).limit(1);
  if (!orderResult.length) return null;

  const order = orderResult[0];

  // Buscar itens do pedido
  const itemsResult = await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    totalPrice: orderItems.totalPrice,
    notes: orderItems.notes,
    productName: products.name,
    productId: products.id
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .where(eq(orderItems.orderId, order.id));

  return { job, order, items: itemsResult };
}

/**
 * Remove jobs antigos da fila (mais de 24 horas)
 */
export async function cleanOldPrintJobs(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await db.delete(printQueue).where(
    and(
      sql`${printQueue.createdAt} < ${oneDayAgo}`,
      or(
        eq(printQueue.status, 'completed'),
        eq(printQueue.status, 'failed')
      )
    )
  );
}

/**
 * Busca histórico de impressões de um estabelecimento
 */
export async function getPrintHistory(establishmentId: number, limit: number = 50): Promise<PrintQueue[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(printQueue)
    .where(eq(printQueue.establishmentId, establishmentId))
    .orderBy(desc(printQueue.createdAt))
    .limit(limit);

  return result;
}


// ============ IFOOD INTEGRATION FUNCTIONS ============

/**
 * Busca pedidos por fonte (iFood, interno, etc)
 */
export async function getOrdersBySource(
  establishmentId: number,
  source: "internal" | "ifood" | "rappi" | "ubereats",
  status?: "pending_confirmation" | "new" | "preparing" | "ready" | "completed" | "cancelled"
): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(orders.establishmentId, establishmentId),
    eq(orders.source, source)
  ];

  if (status) {
    conditions.push(eq(orders.status, status));
  }

  const result = await db.select().from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));

  return result;
}

/**
 * Cria pedido a partir do iFood
 */
export async function createOrderFromIfood(data: {
  establishmentId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string;
  status: "new" | "scheduled";
  deliveryType: "delivery" | "pickup" | "dine_in";
  paymentMethod: "cash" | "card" | "pix" | "boleto" | "card_online" | "pix_online";
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  notes: string | null;
  changeAmount: string | null;
  source: "ifood";
  externalId: string;
  externalDisplayId: string;
  externalStatus: string;
  externalData: Record<string, unknown>;
  isScheduled?: boolean;
  scheduledAt?: Date | null;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: Array<{ name: string; price: number; quantity: number }>;
    notes: string | null;
  }>;
}): Promise<Order | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se pedido já existe
  const existing = await db.select({ id: orders.id })
    .from(orders)
    .where(eq(orders.externalId, data.externalId))
    .limit(1);

  if (existing.length > 0) {
    logger.info(`[iFood] Pedido ${data.externalId} já existe, ignorando`);
    return null;
  }

  // Inserir pedido
  const orderData: InsertOrder = {
    establishmentId: data.establishmentId,
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    status: data.status,
    deliveryType: data.deliveryType,
    paymentMethod: data.paymentMethod,
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    discount: data.discount,
    total: data.total,
    notes: data.notes,
    changeAmount: data.changeAmount,
    source: data.source,
    externalId: data.externalId,
    externalDisplayId: data.externalDisplayId,
    externalStatus: data.externalStatus,
    externalData: data.externalData,
    isScheduled: data.isScheduled || false,
    scheduledAt: data.scheduledAt || null
  };

  const result = await db.insert(orders).values(orderData);
  const orderId = result[0].insertId;

  // Inserir itens
  if (data.items.length > 0) {
    const itemsWithOrderId = data.items.map(item => ({
      orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      complements: item.complements,
      notes: item.notes
    }));
    await db.insert(orderItems).values(itemsWithOrderId);
  }

  // Buscar pedido criado
  const newOrder = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  if (newOrder.length > 0) {
    // Notificar via SSE
    notifyNewOrder(data.establishmentId, newOrder[0]);

    // Notificar via Telegram (fire-and-forget)
    getEstablishmentById(data.establishmentId).then(async (establishment) => {
      if (!hasAutomaticOrderNotifications(establishment?.planType)) {
        logger.info('[iFood] Notificação Telegram bloqueada para o plano:', establishment?.planType || 'desconhecido');
        return;
      }

      const telegramConfig = await getTelegramConfig(data.establishmentId);
      if (telegramConfig?.enabled && telegramConfig?.chatId) {
        try {
          const { sendOrderNotificationTelegram } = await import('./telegramNotifier');
          const result = await sendOrderNotificationTelegram(telegramConfig.chatId, {
            orderNumber: data.orderNumber,
            customerName: data.customerName || undefined,
            customerPhone: data.customerPhone || undefined,
            deliveryType: data.deliveryType || undefined,
            paymentMethod: data.paymentMethod || undefined,
            total: data.total,
            items: data.items.map(item => ({
              name: item.productName,
              quantity: item.quantity,
              price: item.unitPrice,
              notes: item.notes || undefined,
              complements: item.complements || undefined,
            })),
            address: data.customerAddress || undefined,
            notes: data.notes || undefined,
            source: 'iFood',
            deliveryFee: data.deliveryFee || undefined,
            changeAmount: data.changeAmount || undefined,
          });
          if (result.ok) {
            logger.info(`[iFood] \u2705 Notifica\u00e7\u00e3o Telegram enviada: ${data.orderNumber}`);
          } else {
            logger.error(`[iFood] \u274c Erro Telegram: ${result.error}`);
          }
        } catch (err) {
          logger.error('[iFood] Erro ao enviar notifica\u00e7\u00e3o Telegram:', err);
        }
      }
    }).catch(() => {});
  }

  return newOrder[0] || null;
}

/**
 * Atualiza status externo do pedido
 */
export async function updateOrderExternalStatus(orderId: number, externalStatus: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders)
    .set({ externalStatus })
    .where(eq(orders.id, orderId));
}

/**
 * Atualiza status do pedido pelo ID externo
 */
export async function updateOrderStatusByExternalId(
  externalId: string,
  status: "pending_confirmation" | "new" | "preparing" | "ready" | "completed" | "cancelled",
  cancellationReason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<Order> = { status };
  if (status === "new") {
    updateData.newAt = new Date();
  }
  if (status === "preparing") {
    updateData.acceptedAt = new Date();
  }
  if (status === "ready") {
    updateData.readyAt = new Date();
  }
  if (status === "completed" || status === "cancelled") {
    updateData.completedAt = new Date();
  }
  if (status === "cancelled" && cancellationReason) {
    updateData.cancellationReason = cancellationReason;
  }

  await db.update(orders)
    .set(updateData)
    .where(eq(orders.externalId, externalId));

  // Buscar pedido para notificar
  const updatedOrder = await db.select().from(orders).where(eq(orders.externalId, externalId)).limit(1);
  if (updatedOrder.length > 0) {
    const order = updatedOrder[0];
    notifyOrderUpdate(order.establishmentId, { id: order.id, status, updatedAt: new Date(), cancellationReason });
  }
}

/**
 * Atualiza status externo do pedido pelo ID externo
 */
export async function updateOrderExternalStatusByExternalId(externalId: string, externalStatus: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders)
    .set({ externalStatus })
    .where(eq(orders.externalId, externalId));
}

/**
 * Atualiza motivo de cancelamento do pedido
 */
export async function updateOrderCancellationReason(orderId: number, reason: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders)
    .set({ cancellationReason: reason })
    .where(eq(orders.id, orderId));
}

/**
 * Busca pedido pelo ID externo
 */
export async function getOrderByExternalId(externalId: string): Promise<Order | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders)
    .where(eq(orders.externalId, externalId))
    .limit(1);

  return result[0] || null;
}


/**
 * Atualiza itens e totais de um pedido pelo ID externo (para ORDER_PATCHED)
 */
export async function updateOrderItemsByExternalId(externalId: string, data: {
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: any[];
    notes: string | null;
  }>;
  subtotal: string;
  total: string;
  discount: string;
  deliveryFee: string;
  externalData: any;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar o pedido pelo externalId
  const order = await getOrderByExternalId(externalId);
  if (!order) {
    logger.warn(`[DB] Pedido com externalId ${externalId} não encontrado para atualização de itens`);
    return;
  }

  // Atualizar totais do pedido
  await db.update(orders)
    .set({
      subtotal: data.subtotal,
      total: data.total,
      discount: data.discount,
      deliveryFee: data.deliveryFee,
      externalData: data.externalData,
    })
    .where(eq(orders.externalId, externalId));

  // Deletar itens antigos e inserir novos
  await db.delete(orderItems).where(eq(orderItems.orderId, order.id));

  for (const item of data.items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      complements: item.complements,
      notes: item.notes,
    });
  }
}

/**
 * Atualiza informações do entregador no pedido pelo ID externo
 * Como não há coluna driver no schema, salva no externalData
 */
export async function updateOrderDriverInfoByExternalId(externalId: string, driverInfo: {
  driverName: string;
  driverPhone: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await getOrderByExternalId(externalId);
  if (!order) return;

  // Merge driver info into externalData
  const currentData = (typeof order.externalData === 'string'
    ? JSON.parse(order.externalData)
    : order.externalData) || {};

  currentData._driverInfo = driverInfo;

  await db.update(orders)
    .set({ externalData: currentData })
    .where(eq(orders.externalId, externalId));
}

/**
 * Mescla dados auxiliares no externalData do pedido iFood sem substituir o payload original.
 */
export async function mergeOrderExternalDataByExternalId(externalId: string, patch: Record<string, unknown>): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const order = await getOrderByExternalId(externalId);
  if (!order) return;

  const currentData = (typeof order.externalData === 'string'
    ? JSON.parse(order.externalData || '{}')
    : order.externalData) || {};

  await database.update(orders)
    .set({ externalData: { ...(currentData as Record<string, unknown>), ...patch } })
    .where(eq(orders.externalId, externalId));
}

/**
 * Atualiza endereço de entrega pelo ID externo (para DELIVERY_ADDRESS_CHANGE)
 */
export async function updateOrderAddressByExternalId(externalId: string, newAddress: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders)
    .set({ customerAddress: newAddress })
    .where(eq(orders.externalId, externalId));
}

// ============================================
// Funções de Configuração iFood
// ============================================

/**
 * Busca configuração do iFood por estabelecimento
 */
export async function getIfoodConfig(establishmentId: number): Promise<IfoodConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(ifoodConfig)
    .where(eq(ifoodConfig.establishmentId, establishmentId))
    .limit(1);

  return result[0] || null;
}



/**
 * Atualiza status de ativação do iFood
 */
export async function updateIfoodConfigStatus(establishmentId: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ifoodConfig)
    .set({ isActive })
    .where(eq(ifoodConfig.establishmentId, establishmentId));
}

/**
 * Atualiza a configuração de aceite automático de pedidos do iFood
 */
export async function updateIfoodAutoAccept(establishmentId: number, autoAcceptOrders: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ifoodConfig)
    .set({ autoAcceptOrders })
    .where(eq(ifoodConfig.establishmentId, establishmentId));
}

/**
 * Atualiza timestamp do último refresh de token
 */
export async function updateIfoodTokenRefresh(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ifoodConfig)
    .set({ lastTokenRefresh: new Date() })
    .where(eq(ifoodConfig.establishmentId, establishmentId));
}

/**
 * Busca configuração iFood pelo merchantId
 */
export async function getIfoodConfigByMerchantId(merchantId: string): Promise<IfoodConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(ifoodConfig)
    .where(eq(ifoodConfig.merchantId, merchantId))
    .limit(1);

  return result[0] || null;
}

/**
 * Lista todas as configurações iFood ativas
 */
export async function getActiveIfoodConfigs(): Promise<IfoodConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ifoodConfig)
    .where(eq(ifoodConfig.isActive, true));
}


// ============ IFOOD OAUTH DISTRIBUTED FUNCTIONS ============

/**
 * Busca configuração do iFood por estabelecimento (alias para compatibilidade)
 */
export async function getIfoodConfigByEstablishment(establishmentId: number): Promise<IfoodConfig | null> {
  return getIfoodConfig(establishmentId);
}

/**
 * Salva o código de usuário e verifier para autorização OAuth
 */
export async function saveIfoodUserCode(
  establishmentId: number,
  userCode: string,
  authorizationCodeVerifier: string,
  expiresIn: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Verificar se já existe configuração
  const existing = await getIfoodConfig(establishmentId);

  if (existing) {
    await db.update(ifoodConfig)
      .set({
        userCode,
        authorizationCodeVerifier,
        userCodeExpiresAt: expiresAt,
      })
      .where(eq(ifoodConfig.establishmentId, establishmentId));
  } else {
    await db.insert(ifoodConfig).values({
      establishmentId,
      userCode,
      authorizationCodeVerifier,
      userCodeExpiresAt: expiresAt,
      isActive: false,
      isConnected: false,
      autoAcceptOrders: false,
      notifyOnNewOrder: true,
    });
  }
}

/**
 * Salva os tokens OAuth após autorização bem-sucedida
 */
export async function saveIfoodOAuthTokens(
  establishmentId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.update(ifoodConfig)
    .set({
      accessToken,
      refreshToken,
      tokenExpiresAt,
      isConnected: true,
      lastTokenRefresh: new Date(),
      // Limpar códigos temporários
      userCode: null,
      authorizationCodeVerifier: null,
      userCodeExpiresAt: null,
    })
    .where(eq(ifoodConfig.establishmentId, establishmentId));
}

/**
 * Atualiza tokens após refresh
 */
export async function updateIfoodTokens(
  establishmentId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.update(ifoodConfig)
    .set({
      accessToken,
      refreshToken,
      tokenExpiresAt,
      lastTokenRefresh: new Date(),
    })
    .where(eq(ifoodConfig.establishmentId, establishmentId));
}

/**
 * Salva informações do merchant após conexão
 */
export async function saveIfoodMerchantInfo(
  establishmentId: number,
  merchantId: string,
  merchantName: string | null = null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe configuração, senão criar
  const existing = await getIfoodConfig(establishmentId);

  if (existing) {
    await db.update(ifoodConfig)
      .set({
        merchantId,
        merchantName,
        isConnected: true,
      })
      .where(eq(ifoodConfig.establishmentId, establishmentId));
  } else {
    await db.insert(ifoodConfig).values({
      establishmentId,
      merchantId,
      merchantName,
      isConnected: true,
      isActive: false,
      autoAcceptOrders: false,
      notifyOnNewOrder: true,
    });
  }
}

/**
 * Desconecta o iFood de um estabelecimento
 */
export async function disconnectIfood(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ifoodConfig)
    .set({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isConnected: false,
      isActive: false,
      merchantId: null,
      merchantName: null,
      userCode: null,
      authorizationCodeVerifier: null,
      userCodeExpiresAt: null,
    })
    .where(eq(ifoodConfig.establishmentId, establishmentId));
}

/**
 * Busca configuração iFood pelo establishmentId (com tokens válidos)
 */
export async function getIfoodConfigWithValidToken(establishmentId: number): Promise<IfoodConfig | null> {
  const config = await getIfoodConfig(establishmentId);

  if (!config || !config.isConnected || !config.refreshToken) {
    return null;
  }

  return config;
}


// ============ MENU SESSIONS / VIEWS FUNCTIONS ============



/**
 * Registra ou atualiza uma sessão de visualização do cardápio
 */
export async function registerMenuSession(sessionId: string, establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Upsert - insere ou atualiza se já existir
  await db.insert(menuSessions)
    .values({
      sessionId,
      establishmentId,
    })
    .onDuplicateKeyUpdate({
      set: { updatedAt: new Date() },
    });

  // Também atualiza a contagem diária
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Verificar se já existe registro para hoje
  const existingDaily = await db.select()
    .from(menuViewsDaily)
    .where(and(
      eq(menuViewsDaily.establishmentId, establishmentId),
      eq(menuViewsDaily.date, today)
    ))
    .limit(1);

  if (existingDaily.length === 0) {
    // Criar novo registro para hoje
    await db.insert(menuViewsDaily)
      .values({
        establishmentId,
        date: today,
        viewCount: 1,
        uniqueVisitors: 1,
      });
  } else {
    // Verificar se é uma sessão nova (não existia antes)
    const existingSession = await db.select()
      .from(menuSessions)
      .where(and(
        eq(menuSessions.sessionId, sessionId),
        eq(menuSessions.establishmentId, establishmentId)
      ))
      .limit(1);

    // Incrementar viewCount sempre, uniqueVisitors apenas se for sessão nova
    const isNewSession = existingSession.length === 0 ||
      (existingSession[0].createdAt.toISOString().split('T')[0] === today);

    await db.update(menuViewsDaily)
      .set({
        viewCount: sql`${menuViewsDaily.viewCount} + 1`,
        ...(isNewSession ? { uniqueVisitors: sql`${menuViewsDaily.uniqueVisitors} + 1` } : {}),
      })
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        eq(menuViewsDaily.date, today)
      ));
  }
}

/**
 * Conta visualizações ativas (últimos 3 minutos)
 */
export async function getActiveViewers(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

  const result = await db.select({ count: sql<number>`COUNT(DISTINCT ${menuSessions.sessionId})` })
    .from(menuSessions)
    .where(and(
      eq(menuSessions.establishmentId, establishmentId),
      gte(menuSessions.updatedAt, threeMinutesAgo)
    ));

  return result[0]?.count || 0;
}

/**
 * Busca histórico de visualizações dos últimos N dias
 */
export async function getMenuViewsHistory(establishmentId: number, days: number = 7): Promise<MenuViewsDaily[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const result = await db.select()
    .from(menuViewsDaily)
    .where(and(
      eq(menuViewsDaily.establishmentId, establishmentId),
      gte(menuViewsDaily.date, startDateStr)
    ))
    .orderBy(asc(menuViewsDaily.date));

  return result;
}

/**
 * Busca estatísticas de visualizações com comparação de períodos
 */
export async function getMenuViewsStats(establishmentId: number): Promise<{
  totalViews: number;
  uniqueVisitors: number;
  previousTotalViews: number;
  previousUniqueVisitors: number;
  dailyViews: { date: string; views: number; visitors: number }[];
  percentageChange: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const todayStr = today.toISOString().split('T')[0];
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

  // Buscar dados dos últimos 7 dias
  const currentPeriod = await db.select()
    .from(menuViewsDaily)
    .where(and(
      eq(menuViewsDaily.establishmentId, establishmentId),
      gte(menuViewsDaily.date, sevenDaysAgoStr),
      lte(menuViewsDaily.date, todayStr)
    ))
    .orderBy(asc(menuViewsDaily.date));

  // Buscar dados dos 7 dias anteriores (para comparação)
  const previousPeriod = await db.select()
    .from(menuViewsDaily)
    .where(and(
      eq(menuViewsDaily.establishmentId, establishmentId),
      gte(menuViewsDaily.date, fourteenDaysAgoStr),
      lt(menuViewsDaily.date, sevenDaysAgoStr)
    ));

  // Calcular totais
  const totalViews = currentPeriod.reduce((sum, day) => sum + day.viewCount, 0);
  const uniqueVisitors = currentPeriod.reduce((sum, day) => sum + day.uniqueVisitors, 0);
  const previousTotalViews = previousPeriod.reduce((sum, day) => sum + day.viewCount, 0);
  const previousUniqueVisitors = previousPeriod.reduce((sum, day) => sum + day.uniqueVisitors, 0);

  // Calcular variação percentual
  let percentageChange = 0;
  if (previousTotalViews > 0) {
    percentageChange = Math.round(((totalViews - previousTotalViews) / previousTotalViews) * 100);
  } else if (totalViews > 0) {
    percentageChange = 100; // Se não tinha visualizações antes, é 100% de aumento
  }

  // Preparar dados diários (preencher dias sem dados com 0)
  const dailyViews: { date: string; views: number; visitors: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayData = currentPeriod.find(d => d.date === dateStr);
    dailyViews.push({
      date: dateStr,
      views: dayData?.viewCount || 0,
      visitors: dayData?.uniqueVisitors || 0,
    });
  }

  return {
    totalViews,
    uniqueVisitors,
    previousTotalViews,
    previousUniqueVisitors,
    dailyViews,
    percentageChange,
  };
}

/**
 * Limpa sessões antigas (mais de 24 horas)
 */
export async function cleanupOldMenuSessions(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await db.delete(menuSessions)
    .where(lt(menuSessions.updatedAt, twentyFourHoursAgo));

  return result[0]?.affectedRows || 0;
}


// ============ MENU VIEWS HEATMAP FUNCTIONS ============

/**
 * Incrementa a contagem de visualizações para um dia/hora específico
 */
export async function incrementMenuViewHourly(
  establishmentId: number,
  dayOfWeek: number,
  hour: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tenta atualizar registro existente
  const existing = await db.select()
    .from(menuViewsHourly)
    .where(
      and(
        eq(menuViewsHourly.establishmentId, establishmentId),
        eq(menuViewsHourly.dayOfWeek, dayOfWeek),
        eq(menuViewsHourly.hour, hour)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.update(menuViewsHourly)
      .set({ viewCount: sql`${menuViewsHourly.viewCount} + 1` })
      .where(eq(menuViewsHourly.id, existing[0].id));
  } else {
    await db.insert(menuViewsHourly).values({
      establishmentId,
      dayOfWeek,
      hour,
      viewCount: 1,
    });
  }
}

/**
 * Busca dados do mapa de calor com visualizações filtradas por período
 */
export async function getMenuViewsHeatmapWithPeriod(establishmentId: number, period: 'today' | 'week' | 'month' = 'today'): Promise<{
  data: { dayOfWeek: number; hour: number; count: number }[];
  maxCount: number;
  totalViews: number;
  periodViews: number;
  previousPeriodViews: number;
  viewsChange: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar dados do heatmap (sempre mostra todos os dados acumulados)
  const results = await db.select({
    dayOfWeek: menuViewsHourly.dayOfWeek,
    hour: menuViewsHourly.hour,
    count: menuViewsHourly.viewCount,
  })
    .from(menuViewsHourly)
    .where(eq(menuViewsHourly.establishmentId, establishmentId));

  const data = results.map(r => ({
    dayOfWeek: r.dayOfWeek,
    hour: r.hour,
    count: r.count,
  }));

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
  const totalViews = data.reduce((sum, d) => sum + d.count, 0);

  // Calcular visualizações do período selecionado
  // Para 'today': usar menuSessions (tempo real) pois menuViewsDaily pode ter atraso na agregação
  // Para 'week'/'month': usar menuViewsDaily (dados agregados) + complementar com sessões de hoje
  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const todayStr = fmtLocalDate(localNow);

  const countSessionsInRange = async (startDateStr: string, endDateStr: string) => {
    const result = await db.select({
      total: sql<number>`COUNT(*)`
    })
      .from(menuSessions)
      .where(and(
        eq(menuSessions.establishmentId, establishmentId),
        sql`CONVERT_TZ(${menuSessions.createdAt}, '+00:00', ${tz}) >= ${startDateStr + ' 00:00:00'}`,
        sql`CONVERT_TZ(${menuSessions.createdAt}, '+00:00', ${tz}) <= ${endDateStr + ' 23:59:59'}`
      ));
    return Number(result[0]?.total ?? 0);
  };

  let periodViews = 0;
  let previousPeriodViews = 0;

  if (period === 'today') {
    // Hoje: contar sessões de hoje em tempo real
    periodViews = await countSessionsInRange(todayStr, todayStr);

    const yesterday = new Date(localNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = fmtLocalDate(yesterday);

    const prevResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        eq(menuViewsDaily.date, yesterdayStr)
      ));
    previousPeriodViews = Number(prevResult[0]?.total ?? 0);
    // Se não houver dados agregados de ontem, contar sessões
    if (previousPeriodViews === 0) {
      previousPeriodViews = await countSessionsInRange(yesterdayStr, yesterdayStr);
    }
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(localNow);
    weekStart.setDate(localNow.getDate() - daysFromMonday);
    const periodStartStr = fmtLocalDate(weekStart);

    // Período atual: menuViewsDaily + sessões de hoje
    const dailyResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        gte(menuViewsDaily.date, periodStartStr),
        lte(menuViewsDaily.date, todayStr)
      ));
    const dailyViews = Number(dailyResult[0]?.total ?? 0);

    // Verificar se hoje já tem dados em menuViewsDaily
    const todayDailyResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        eq(menuViewsDaily.date, todayStr)
      ));
    const todayDailyViews = Number(todayDailyResult[0]?.total ?? 0);

    // Se hoje não tem dados agregados, complementar com sessões em tempo real
    if (todayDailyViews === 0) {
      const todaySessions = await countSessionsInRange(todayStr, todayStr);
      periodViews = dailyViews + todaySessions;
    } else {
      periodViews = dailyViews;
    }

    // Período anterior
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevPeriodStartStr = fmtLocalDate(prevWeekStart);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevPeriodEndStr = fmtLocalDate(prevWeekEnd);

    const prevResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        gte(menuViewsDaily.date, prevPeriodStartStr),
        lte(menuViewsDaily.date, prevPeriodEndStr)
      ));
    previousPeriodViews = Number(prevResult[0]?.total ?? 0);
  } else {
    // month
    const monthStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    const periodStartStr = fmtLocalDate(monthStart);

    // Período atual: menuViewsDaily + sessões de hoje
    const dailyResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        gte(menuViewsDaily.date, periodStartStr),
        lte(menuViewsDaily.date, todayStr)
      ));
    const dailyViews = Number(dailyResult[0]?.total ?? 0);

    // Verificar se hoje já tem dados em menuViewsDaily
    const todayDailyResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        eq(menuViewsDaily.date, todayStr)
      ));
    const todayDailyViews = Number(todayDailyResult[0]?.total ?? 0);

    if (todayDailyViews === 0) {
      const todaySessions = await countSessionsInRange(todayStr, todayStr);
      periodViews = dailyViews + todaySessions;
    } else {
      periodViews = dailyViews;
    }

    const prevMonthStart = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
    const prevPeriodStartStr = fmtLocalDate(prevMonthStart);
    const prevMonthEnd = new Date(monthStart);
    prevMonthEnd.setDate(prevMonthEnd.getDate() - 1);
    const prevPeriodEndStr = fmtLocalDate(prevMonthEnd);

    const prevResult = await db.select({
      total: sql<number>`COALESCE(SUM(${menuViewsDaily.viewCount}), 0)`,
    })
      .from(menuViewsDaily)
      .where(and(
        eq(menuViewsDaily.establishmentId, establishmentId),
        gte(menuViewsDaily.date, prevPeriodStartStr),
        lte(menuViewsDaily.date, prevPeriodEndStr)
      ));
    previousPeriodViews = Number(prevResult[0]?.total ?? 0);
  }

  let viewsChange = 0;
  if (previousPeriodViews > 0) {
    viewsChange = Math.round(((periodViews - previousPeriodViews) / previousPeriodViews) * 100);
  } else if (periodViews > 0) {
    viewsChange = 100;
  }

  return { data, maxCount, totalViews, periodViews, previousPeriodViews, viewsChange };
}

export async function getMenuViewsHeatmap(establishmentId: number): Promise<{
  data: { dayOfWeek: number; hour: number; count: number }[];
  maxCount: number;
  totalViews: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.select({
    dayOfWeek: menuViewsHourly.dayOfWeek,
    hour: menuViewsHourly.hour,
    count: menuViewsHourly.viewCount,
  })
    .from(menuViewsHourly)
    .where(eq(menuViewsHourly.establishmentId, establishmentId));

  const data = results.map(r => ({
    dayOfWeek: r.dayOfWeek,
    hour: r.hour,
    count: r.count,
  }));

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
  const totalViews = data.reduce((sum, d) => sum + d.count, 0);

  return { data, maxCount, totalViews };
}


// ============ SMS CAMPAIGNS - CLIENTES ============

/**
 * Busca clientes únicos que fizeram pedidos no estabelecimento
 * Retorna nome e telefone de clientes com telefone válido
 */
export async function getUniqueCustomers(establishmentId: number): Promise<{
  id: number;
  name: string | null;
  phone: string;
  lastOrderAt: Date;
  orderCount: number;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar clientes únicos agrupados por telefone
  const results = await db.select({
    customerPhone: orders.customerPhone,
    customerName: sql<string>`MAX(${orders.customerName})`.as('customerName'),
    lastOrderAt: sql<Date>`MAX(${orders.createdAt})`.as('lastOrderAt'),
    orderCount: sql<number>`COUNT(*)`.as('orderCount'),
  })
    .from(orders)
    .where(
      and(
        eq(orders.establishmentId, establishmentId),
        isNotNull(orders.customerPhone),
        sql`${orders.customerPhone} != ''`
      )
    )
    .groupBy(orders.customerPhone)
    .orderBy(desc(sql`MAX(${orders.createdAt})`));

  // Filtrar e formatar resultados
  return results
    .filter(r => r.customerPhone && r.customerPhone.replace(/\D/g, '').length >= 10)
    .map((r, index) => ({
      id: index + 1,
      name: r.customerName || null,
      phone: r.customerPhone!,
      lastOrderAt: r.lastOrderAt,
      orderCount: r.orderCount,
    }));
}


/**
 * Busca clientes filtrados por critérios: inatividade, quantidade de pedidos e uso de cupom.
 * Todos os filtros são opcionais e combináveis.
 */
export async function getFilteredCustomers(establishmentId: number, filters?: {
  inactiveDays?: number;    // Clientes que não compram há X dias
  minOrders?: number;       // Clientes com mais de N pedidos
  usedCoupon?: boolean;     // Clientes que já usaram cupom
}): Promise<{
  id: number;
  name: string | null;
  phone: string;
  lastOrderAt: Date;
  orderCount: number;
  usedCoupon: boolean;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar clientes únicos agrupados por telefone com dados de cupom
  const results = await db.select({
    customerPhone: orders.customerPhone,
    customerName: sql<string>`MAX(${orders.customerName})`.as('customerName'),
    lastOrderAt: sql<Date>`MAX(${orders.createdAt})`.as('lastOrderAt'),
    orderCount: sql<number>`COUNT(*)`.as('orderCount'),
    usedCoupon: sql<number>`SUM(CASE WHEN ${orders.couponCode} IS NOT NULL AND ${orders.couponCode} != '' THEN 1 ELSE 0 END)`.as('usedCoupon'),
  })
    .from(orders)
    .where(
      and(
        eq(orders.establishmentId, establishmentId),
        isNotNull(orders.customerPhone),
        sql`${orders.customerPhone} != ''`,
        // Apenas pedidos concluídos para contagem precisa
        eq(orders.status, 'completed')
      )
    )
    .groupBy(orders.customerPhone)
    .orderBy(desc(sql`MAX(${orders.createdAt})`));

  // Aplicar filtros em memória (mais flexível para filtros combinados)
  let filtered = results
    .filter(r => r.customerPhone && r.customerPhone.replace(/\D/g, '').length >= 10);

  // Filtro: clientes inativos há X dias
  if (filters?.inactiveDays && filters.inactiveDays > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.inactiveDays);
    filtered = filtered.filter(r => new Date(r.lastOrderAt) <= cutoffDate);
  }

  // Filtro: clientes com mais de N pedidos
  if (filters?.minOrders && filters.minOrders > 0) {
    filtered = filtered.filter(r => r.orderCount >= filters.minOrders!);
  }

  // Filtro: clientes que já usaram cupom
  if (filters?.usedCoupon) {
    filtered = filtered.filter(r => Number(r.usedCoupon) > 0);
  }

  return filtered.map((r, index) => ({
    id: index + 1,
    name: r.customerName || null,
    phone: r.customerPhone!,
    lastOrderAt: r.lastOrderAt,
    orderCount: r.orderCount,
    usedCoupon: Number(r.usedCoupon) > 0,
  }));
}

// ============ SMS BALANCE FUNCTIONS ============

// Buscar saldo SMS do estabelecimento
export async function getSmsBalance(establishmentId: number): Promise<SmsBalance | null> {
  const db = await getDb();
  if (!db) return null;

  const [balance] = await db.select().from(smsBalance).where(eq(smsBalance.establishmentId, establishmentId));
  return balance || null;
}

// Criar ou atualizar saldo SMS do estabelecimento
export async function getOrCreateSmsBalance(establishmentId: number): Promise<SmsBalance> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tentar buscar saldo existente
  let balance = await getSmsBalance(establishmentId);

  if (!balance) {
    // Criar novo registro de saldo com valor inicial de R$ 0,097 (1 SMS de teste)
    await db.insert(smsBalance).values({
      establishmentId,
      balance: "0.097",
      costPerSms: "0.0970",
    });
    balance = await getSmsBalance(establishmentId);
  }

  return balance!;
}

// Adicionar crédito ao saldo SMS
export async function addSmsCredit(
  establishmentId: number,
  amount: number,
  description?: string
): Promise<SmsBalance> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentBalance = await getOrCreateSmsBalance(establishmentId);
  const balanceBefore = parseFloat(currentBalance.balance as string);
  const balanceAfter = balanceBefore + amount;

  // Atualizar saldo
  await db.update(smsBalance)
    .set({ balance: balanceAfter.toFixed(4) })
    .where(eq(smsBalance.establishmentId, establishmentId));

  // Registrar transação
  await db.insert(smsTransactions).values({
    establishmentId,
    type: "credit",
    amount: amount.toFixed(4),
    smsCount: 0,
    balanceBefore: balanceBefore.toFixed(4),
    balanceAfter: balanceAfter.toFixed(4),
    description: description || "Recarga de créditos SMS",
  });

  return (await getSmsBalance(establishmentId))!;
}

// Debitar saldo SMS (retorna true se sucesso, false se saldo insuficiente)
export async function debitSmsBalance(
  establishmentId: number,
  smsCount: number,
  campaignName?: string
): Promise<{ success: boolean; message: string; debitedCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentBalance = await getOrCreateSmsBalance(establishmentId);
  const balanceBefore = parseFloat(currentBalance.balance as string);
  const costPerSms = parseFloat(currentBalance.costPerSms as string);
  const totalCost = smsCount * costPerSms;

  // Verificar se tem saldo suficiente
  if (balanceBefore < totalCost) {
    // Calcular quantos SMS podem ser enviados com o saldo disponível
    const maxSmsWithBalance = Math.floor(balanceBefore / costPerSms);

    if (maxSmsWithBalance <= 0) {
      return {
        success: false,
        message: "Saldo insuficiente para enviar SMS. Recarregue seus créditos.",
        debitedCount: 0,
      };
    }

    // Retornar quantos podem ser enviados
    return {
      success: false,
      message: `Saldo insuficiente. Você pode enviar no máximo ${maxSmsWithBalance} SMS com seu saldo atual de R$ ${balanceBefore.toFixed(2)}.`,
      debitedCount: maxSmsWithBalance,
    };
  }

  const balanceAfter = balanceBefore - totalCost;

  // Atualizar saldo
  await db.update(smsBalance)
    .set({ balance: balanceAfter.toFixed(4) })
    .where(eq(smsBalance.establishmentId, establishmentId));

  // Registrar transação
  await db.insert(smsTransactions).values({
    establishmentId,
    type: "debit",
    amount: totalCost.toFixed(4),
    smsCount,
    balanceBefore: balanceBefore.toFixed(4),
    balanceAfter: balanceAfter.toFixed(4),
    description: `Envio de ${smsCount} SMS`,
    campaignName,
  });

  return {
    success: true,
    message: `Débito de R$ ${totalCost.toFixed(3)} realizado com sucesso.`,
    debitedCount: smsCount,
  };
}

// Buscar histórico de transações SMS
export async function getSmsTransactions(
  establishmentId: number,
  limit: number = 50
): Promise<SmsTransaction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(smsTransactions)
    .where(eq(smsTransactions.establishmentId, establishmentId))
    .orderBy(desc(smsTransactions.createdAt))
    .limit(limit);
}

// Buscar último disparo de SMS
export async function getLastSmsDispatch(establishmentId: number): Promise<SmsTransaction | null> {
  const db = await getDb();
  if (!db) return null;

  const [lastDispatch] = await db.select()
    .from(smsTransactions)
    .where(
      and(
        eq(smsTransactions.establishmentId, establishmentId),
        eq(smsTransactions.type, "debit")
      )
    )
    .orderBy(desc(smsTransactions.createdAt))
    .limit(1);

  return lastDispatch || null;
}


// ============ TABLE (MESA) FUNCTIONS ============



// ============ TABLE SPACES (ESPAÇOS) ============

export async function getTableSpaces(establishmentId: number): Promise<TableSpace[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tableSpaces)
    .where(eq(tableSpaces.establishmentId, establishmentId))
    .orderBy(asc(tableSpaces.sortOrder));
}

export async function getTableSpaceByName(establishmentId: number, name: string): Promise<TableSpace | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tableSpaces)
    .where(and(
      eq(tableSpaces.establishmentId, establishmentId),
      eq(tableSpaces.name, name)
    ))
    .limit(1);
  return result[0];
}

export async function createTableSpace(data: InsertTableSpace): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tableSpaces).values(data);
  return result[0].insertId;
}

export async function updateTableSpace(id: number, data: Partial<InsertTableSpace>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tableSpaces).set(data).where(eq(tableSpaces.id, id));
}

export async function deleteTableSpace(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Deletar todas as mesas do espaço
  await db.delete(tables).where(eq(tables.spaceId, id));
  // Deletar o espaço
  await db.delete(tableSpaces).where(eq(tableSpaces.id, id));
}

// ============ TABLES (MESAS) ============

/**
 * Lista mesas de um estabelecimento
 */
export async function getTablesByEstablishment(establishmentId: number): Promise<Table[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tables)
    .where(and(
      eq(tables.establishmentId, establishmentId),
      eq(tables.isActive, true),
      isNull(tables.deletedAt)
    ))
    .orderBy(asc(tables.sortOrder), asc(tables.number));
}

/**
 * Busca mesas desativadas de um estabelecimento
 */
export async function getDeactivatedTables(establishmentId: number): Promise<Table[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tables)
    .where(and(
      eq(tables.establishmentId, establishmentId),
      eq(tables.isActive, false),
      isNull(tables.deletedAt)
    ))
    .orderBy(asc(tables.number));
}

/**
 * Busca mesas excluídas (soft delete) de um estabelecimento
 */
export async function getDeletedTables(establishmentId: number): Promise<Table[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tables)
    .where(and(
      eq(tables.establishmentId, establishmentId),
      isNotNull(tables.deletedAt)
    ))
    .orderBy(asc(tables.number));
}

/**
 * Busca uma mesa por ID
 */
export async function getTableById(id: number): Promise<Table | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tables)
    .where(eq(tables.id, id))
    .limit(1);

  return result[0];
}

/**
 * Cria uma nova mesa
 */
export async function createTable(data: InsertTable): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tables).values(data);
  return result[0].insertId;
}

/**
 * Atualiza uma mesa
 */
export async function updateTable(id: number, data: Partial<InsertTable>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tables)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tables.id, id));
}

/**
 * Atualiza o status de uma mesa
 */
export async function updateTableStatus(
  id: number,
  status: "free" | "occupied" | "reserved" | "requesting_bill",
  guests?: number,
  reservationData?: { reservedName?: string; reservedPhone?: string; reservedFor?: Date | null; reservedGuests?: number }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { status, updatedAt: new Date() };

  if (status === "occupied") {
    updateData.occupiedAt = new Date();
    updateData.currentGuests = guests || 0;
  } else if (status === "free") {
    updateData.occupiedAt = null;
    updateData.currentGuests = 0;
    updateData.reservedFor = null;
    updateData.reservedName = null;
    updateData.reservedPhone = null;
    updateData.reservedGuests = null;
  } else if (status === "reserved") {
    updateData.reservedName = reservationData?.reservedName || null;
    updateData.reservedPhone = reservationData?.reservedPhone || null;
    updateData.reservedFor = reservationData?.reservedFor || null;
    updateData.reservedGuests = reservationData?.reservedGuests || null;
  }

  await db.update(tables)
    .set(updateData)
    .where(eq(tables.id, id));
}

/**
 * Marca uma mesa como excluída (soft delete com deletedAt)
 */
export async function softDeleteTable(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Fechar comanda ativa se houver
  const activeTab = await getActiveTabByTable(id);
  if (activeTab) {
    await db.delete(tabItems).where(eq(tabItems.tabId, activeTab.id));
    await db.delete(tabs).where(eq(tabs.id, activeTab.id));
  }

  // Soft delete: marcar deletedAt e desativar
  await db.update(tables).set({
    deletedAt: new Date(),
    isActive: false,
    status: "free",
  }).where(eq(tables.id, id));
}

/**
 * Restaura uma mesa excluída (limpa deletedAt e reativa)
 */
export async function restoreDeletedTable(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tables).set({
    deletedAt: null,
    isActive: true,
  }).where(eq(tables.id, id));
}

/**
 * Deleta uma mesa permanentemente (hard delete)
 */
export async function deleteTable(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Buscar comanda ativa da mesa
  const activeTab = await getActiveTabByTable(id);

  if (activeTab) {
    // Deletar itens da comanda
    await db.delete(tabItems).where(eq(tabItems.tabId, activeTab.id));

    // Deletar a comanda
    await db.delete(tabs).where(eq(tabs.id, activeTab.id));
  }

  // Deletar a mesa (hard delete)
  await db.delete(tables).where(eq(tables.id, id));
}

// ============ TAB (COMANDA) FUNCTIONS ============

/**
 * Busca todas as comandas abertas de um estabelecimento
 */
export async function getOpenTabsByEstablishment(establishmentId: number): Promise<Tab[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tabs)
    .where(and(
      eq(tabs.establishmentId, establishmentId),
      or(eq(tabs.status, "open"), eq(tabs.status, "requesting_bill"))
    ))
    .orderBy(desc(tabs.openedAt));
}

/**
 * Busca a comanda ativa de uma mesa
 */
export async function getActiveTabByTable(tableId: number): Promise<Tab | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tabs)
    .where(and(
      eq(tabs.tableId, tableId),
      or(eq(tabs.status, "open"), eq(tabs.status, "requesting_bill"))
    ))
    .limit(1);

  return result[0];
}

/**
 * Busca uma comanda por ID
 */
export async function getTabById(id: number): Promise<Tab | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tabs)
    .where(eq(tabs.id, id))
    .limit(1);

  return result[0];
}

/**
 * Cria uma nova comanda
 */
export async function createTab(data: InsertTab): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tabs).values(data);
  return result[0].insertId;
}

/**
 * Atualiza uma comanda
 */
export async function updateTab(id: number, data: Partial<InsertTab>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tabs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tabs.id, id));
}

/**
 * Fecha uma comanda
 */
export async function closeTab(id: number, paymentMethod: string, paidAmount: number, changeAmount: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tabs)
    .set({
      status: "closed",
      paymentMethod,
      paidAmount: paidAmount.toFixed(2),
      changeAmount: changeAmount.toFixed(2),
      closedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(tabs.id, id));
}

/**
 * Recalcula os totais de uma comanda
 */
export async function recalculateTabTotals(tabId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Buscar todos os itens da comanda (exceto cancelados)
  const items = await db.select().from(tabItems)
    .where(and(
      eq(tabItems.tabId, tabId),
      ne(tabItems.status, "cancelled")
    ));

  // Calcular subtotal
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  // Buscar a comanda para pegar o desconto
  const tab = await getTabById(tabId);
  if (!tab) return;

  const discount = parseFloat(tab.discount);

  // Buscar o percentual de taxa de servico do estabelecimento
  const establishment = await getEstablishmentById(tab.establishmentId);
  const serviceChargePercent = establishment ? parseFloat(establishment.serviceChargePercent || "0") : 0;

  // Calcular taxa de servico automaticamente baseado no subtotal
  const serviceCharge = serviceChargePercent > 0 ? subtotal * (serviceChargePercent / 100) : 0;
  const total = subtotal - discount + serviceCharge;

  // Atualizar a comanda (incluindo serviceCharge calculado)
  await db.update(tabs)
    .set({
      subtotal: subtotal.toFixed(2),
      serviceCharge: serviceCharge.toFixed(2),
      total: Math.max(0, total).toFixed(2),
      updatedAt: new Date()
    })
    .where(eq(tabs.id, tabId));
}

// ============ TAB ITEM FUNCTIONS ============

/**
 * Busca um item da comanda por ID
 */
export async function getTabItemById(id: number): Promise<TabItem | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(tabItems)
    .where(eq(tabItems.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Busca todos os itens de uma comanda
 */
export async function getTabItems(tabId: number): Promise<TabItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tabItems)
    .where(and(
      eq(tabItems.tabId, tabId),
      ne(tabItems.status, 'cancelled')
    ))
    .orderBy(desc(tabItems.orderedAt));
}

/**
 * Adiciona um item à comanda
 */
export async function addTabItem(data: InsertTabItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tabItems).values(data);

  // Recalcular totais da comanda
  await recalculateTabTotals(data.tabId);

  return result[0].insertId;
}

/**
 * Atualiza um item da comanda
 */
export async function updateTabItem(id: number, data: Partial<InsertTabItem>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Buscar o item para pegar o tabId
  const item = await db.select().from(tabItems)
    .where(eq(tabItems.id, id))
    .limit(1);

  if (item.length === 0) return;

  await db.update(tabItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tabItems.id, id));

  // Recalcular totais da comanda
  await recalculateTabTotals(item[0].tabId);
}

/**
 * Remove um item da comanda (marca como cancelado)
 */
export async function cancelTabItem(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Buscar o item para pegar o tabId
  const item = await db.select().from(tabItems)
    .where(eq(tabItems.id, id))
    .limit(1);

  if (item.length === 0) return;

  await db.update(tabItems)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(tabItems.id, id));

  // Recalcular totais da comanda
  await recalculateTabTotals(item[0].tabId);
}

/**
 * Abre uma mesa (cria comanda e atualiza status)
 */
export async function openTable(
  establishmentId: number,
  tableId: number,
  guests: number = 1
): Promise<{ tableId: number; tabId: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar a mesa
  const table = await getTableById(tableId);
  if (!table) throw new Error("Mesa não encontrada");

  // Verificar se já tem comanda aberta
  const existingTab = await getActiveTabByTable(tableId);
  if (existingTab) {
    return { tableId, tabId: existingTab.id };
  }

  // Usar displayNumber para mesas combinadas, senão usar o número normal
  const tableDisplayName = table.displayNumber || String(table.number);

  // Gerar número da comanda
  const tabNumber = `M${tableDisplayName}-${Date.now().toString().slice(-6)}`;

  // Criar comanda
  const tabId = await createTab({
    establishmentId,
    tableId,
    tabNumber,
    customerName: `Mesa ${tableDisplayName}`,
  });

  // Atualizar status da mesa
  await updateTableStatus(tableId, "occupied", guests);

  return { tableId, tabId };
}

/**
 * Fecha uma mesa (fecha comanda e libera mesa)
 * Cria automaticamente um pedido (order) com status "completed" para que
 * o faturamento da mesa apareça nos cards da Dashboard (Faturamento Hoje, Ticket Médio, etc.)
 */
export async function closeTable(
  tableId: number,
  paymentMethod: string,
  paidAmount: number,
  changeAmount: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Buscar a mesa para obter o nome de exibição
  const table = await getTableById(tableId);
  const tableDisplayName = table?.displayNumber || (table ? String(table.number) : '');
  const customerNamePattern = table ? `Mesa ${tableDisplayName}` : '';

  // Salvar o label da mesa na comanda antes de fechar (para o recibo)
  if (table?.label) {
    const activeTab = await getActiveTabByTable(tableId);
    if (activeTab) {
      await db.update(tabs)
        .set({ customerName: table.label })
        .where(eq(tabs.id, activeTab.id));
    }
  }

  // Buscar comanda ativa
  const tab = await getActiveTabByTable(tableId);
  if (tab) {
    // Buscar itens da comanda antes de fechar
    const items = await getTabItems(tab.id);

    // Fechar a comanda
    await closeTab(tab.id, paymentMethod, paidAmount, changeAmount);

    // Verificar se já existem pedidos da cozinha para esta mesa
    // Se existem, vamos apenas atualizá-los para "completed" (sem criar duplicata)
    let existingKitchenOrders: { id: number; status: string }[] = [];
    if (table) {
      existingKitchenOrders = await db.select({ id: orders.id, status: orders.status })
        .from(orders)
        .where(
          and(
            eq(orders.establishmentId, table.establishmentId),
            eq(orders.customerName, customerNamePattern),
            eq(orders.source, 'pdv'),
            eq(orders.deliveryType, 'dine_in'),
            ne(orders.status, 'completed'),
            ne(orders.status, 'cancelled')
          )
        );
    }

    if (existingKitchenOrders.length > 0) {
      // Já existem pedidos da cozinha — atualizar para "completed" e notificar via SSE
      // Usa notifyOrderUpdate (evento "order_update") que NÃO dispara som na cozinha
      // (som só toca no evento "new_order" via handleNewOrder)
      logger.info(`[closeTable] Auto-completando ${existingKitchenOrders.length} pedido(s) da ${customerNamePattern} (sem criar duplicata)`);
      for (const order of existingKitchenOrders) {
        await db.update(orders).set({
          status: 'completed',
          completedAt: new Date(),
          paymentMethod: (() => {
            const map: Record<string, string> = { 'dinheiro': 'cash', 'cartao_credito': 'card', 'cartao_debito': 'card', 'pix': 'pix', 'cash': 'cash', 'card': 'card' };
            return (map[paymentMethod] || 'cash') as any;
          })()
        }).where(eq(orders.id, order.id));
        // Notificar a cozinha via SSE (order_update não toca som, apenas atualiza a lista)
        notifyOrderUpdate(table!.establishmentId, { id: order.id, status: 'completed', updatedAt: new Date() });
      }
    } else {
      // Não existem pedidos da cozinha — criar pedido "completed" para o dashboard
      // Considerar pagamentos avulsos já feitos para evitar duplicação de faturamento
      const tabTotal = parseFloat(tab.total);
      const loosePaymentsTotal = await getTabPaymentsTotal(tab.id);
      const remainingTotal = Math.max(0, tabTotal - loosePaymentsTotal);

      if (remainingTotal > 0) {
        const paymentMethodMap: Record<string, "cash" | "card" | "pix" | "boleto" | "card_online"> = {
          'dinheiro': 'cash',
          'cartao_credito': 'card',
          'cartao_debito': 'card',
          'pix': 'pix',
          'cash': 'cash',
          'card': 'card',
        };
        const mappedPayment = paymentMethodMap[paymentMethod] || 'cash';

        const orderItemsData: InsertOrderItem[] = items
          .filter(item => item.status !== 'cancelled')
          .map(item => ({
            orderId: 0,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: item.complements as { name: string; price: number; quantity: number }[] | undefined,
            notes: item.notes || undefined,
          }));

        try {
          await createOrderWithNumber(
            {
              establishmentId: tab.establishmentId,
              orderNumber: '',
              customerName: tab.customerName || `Mesa`,
              status: 'completed',
              deliveryType: 'dine_in',
              paymentMethod: mappedPayment,
              subtotal: remainingTotal.toFixed(2),
              deliveryFee: '0',
              discount: tab.discount,
              total: remainingTotal.toFixed(2),
              changeAmount: changeAmount.toFixed(2),
              source: 'pdv',
              completedAt: new Date(),
            },
            orderItemsData,
            { skipSSE: true } // Não enviar SSE new_order ao fechar mesa - evita som na cozinha
          );
        } catch (err) {
          logger.error('[closeTable] Erro ao criar pedido a partir da comanda:', err);
        }
      }
      logger.info(`[closeTable] Mesa ${tableDisplayName}: Total bruto R$ ${tabTotal.toFixed(2)}, Pagamentos avulsos R$ ${loosePaymentsTotal.toFixed(2)}, Saldo restante R$ ${remainingTotal.toFixed(2)}`);
    }
  }

  // Liberar mesa e limpar label
  await updateTableStatus(tableId, "free");
  await updateTable(tableId, { label: null });
}

/**
 * Fechamento parcial de mesa: remove itens selecionados da comanda,
 * cria um pedido "completed" com esses itens, e mantém a mesa aberta com os restantes.
 */
export async function partialCloseTable(
  tableId: number,
  itemIds: number[],
  paymentMethod: string
): Promise<{ removedCount: number; remainingCount: number; partialTotal: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar a mesa
  const table = await getTableById(tableId);
  if (!table) throw new Error("Mesa não encontrada");

  const tableDisplayName = table.displayNumber || String(table.number);

  // Buscar comanda ativa
  const tab = await getActiveTabByTable(tableId);
  if (!tab) throw new Error("Nenhuma comanda ativa para esta mesa");

  // Buscar os itens selecionados
  const selectedItems = await db.select().from(tabItems)
    .where(and(
      eq(tabItems.tabId, tab.id),
      inArray(tabItems.id, itemIds),
      ne(tabItems.status, 'cancelled')
    ));

  if (selectedItems.length === 0) {
    throw new Error("Nenhum item válido selecionado");
  }

  // Calcular total dos itens selecionados
  const partialTotal = selectedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  // Mapear forma de pagamento
  const paymentMethodMap: Record<string, "cash" | "card" | "pix" | "boleto" | "card_online"> = {
    'dinheiro': 'cash', 'cartao_credito': 'card', 'cartao_debito': 'card',
    'pix': 'pix', 'cash': 'cash', 'card': 'card',
  };
  const mappedPayment = paymentMethodMap[paymentMethod] || 'cash';

  // Criar pedido "completed" com os itens selecionados (para dashboard/faturamento)
  const orderItemsData: InsertOrderItem[] = selectedItems.map(item => ({
    orderId: 0,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    complements: item.complements as { name: string; price: number; quantity: number }[] | undefined,
    notes: item.notes || undefined,
  }));

  try {
    await createOrderWithNumber(
      {
        establishmentId: tab.establishmentId,
        orderNumber: '',
        customerName: `Mesa ${tableDisplayName} (parcial)`,
        status: 'completed',
        deliveryType: 'dine_in',
        paymentMethod: mappedPayment,
        subtotal: partialTotal.toFixed(2),
        deliveryFee: '0',
        discount: '0',
        total: partialTotal.toFixed(2),
        changeAmount: '0',
        source: 'pdv',
        completedAt: new Date(),
      },
      orderItemsData,
      { skipSSE: true } // Não enviar SSE new_order ao fechar mesa parcial - evita som na cozinha
    );
  } catch (err) {
    logger.error('[partialCloseTable] Erro ao criar pedido parcial:', err);
  }

  // Remover os itens selecionados da comanda (marcar como cancelled para manter histórico)
  await db.update(tabItems)
    .set({ status: 'cancelled' })
    .where(inArray(tabItems.id, itemIds));

  // Recalcular totais da comanda
  await recalculateTabTotals(tab.id);

  // Verificar se ainda restam itens ativos na comanda
  const remainingItems = await db.select().from(tabItems)
    .where(and(
      eq(tabItems.tabId, tab.id),
      ne(tabItems.status, 'cancelled')
    ));

  // Se não restam itens, fechar a comanda e liberar a mesa
  if (remainingItems.length === 0) {
    // Salvar label da mesa na comanda antes de fechar (para o recibo)
    if (table?.label) {
      await db.update(tabs)
        .set({ customerName: table.label })
        .where(eq(tabs.id, tab.id));
    }
    await closeTab(tab.id, paymentMethod, partialTotal, 0);
    await updateTableStatus(tableId, "free");
    await updateTable(tableId, { label: null });
  }

  // Auto-completar pedidos da cozinha para os itens removidos
  // (se existirem pedidos na cozinha com esses itens)
  const customerNamePattern = `Mesa ${tableDisplayName}`;
  const existingKitchenOrders = await db.select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, table.establishmentId),
      eq(orders.customerName, customerNamePattern),
      eq(orders.source, 'pdv'),
      eq(orders.deliveryType, 'dine_in'),
      ne(orders.status, 'completed'),
      ne(orders.status, 'cancelled')
    ));

  // Se não restam itens na comanda, completar todos os pedidos da cozinha
  if (remainingItems.length === 0 && existingKitchenOrders.length > 0) {
    for (const order of existingKitchenOrders) {
      await db.update(orders).set({
        status: 'completed',
        completedAt: new Date(),
        paymentMethod: mappedPayment as any
      }).where(eq(orders.id, order.id));
      notifyOrderUpdate(table.establishmentId, { id: order.id, status: 'completed', updatedAt: new Date() });
    }
  }

  logger.info(`[partialCloseTable] Mesa ${tableDisplayName}: ${selectedItems.length} itens fechados (R$ ${partialTotal.toFixed(2)}), ${remainingItems.length} itens restantes`);

  return {
    removedCount: selectedItems.length,
    remainingCount: remainingItems.length,
    partialTotal: partialTotal.toFixed(2)
  };
}

/**
 * Adiciona itens do carrinho à comanda de uma mesa
 */
export async function addItemsToTab(
  tabId: number,
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements?: Array<{ name: string; price: number; quantity: number }> | string;
    notes?: string;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const item of items) {
    // Parse complements se for string (vindo do banco)
    let parsedComplements = item.complements;
    if (typeof parsedComplements === 'string') {
      try {
        parsedComplements = JSON.parse(parsedComplements);
      } catch {
        parsedComplements = [];
      }
    }

    await addTabItem({
      tabId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      complements: (parsedComplements as Array<{ name: string; price: number; quantity: number }>) || [],
      notes: item.notes,
    });
  }
}

/**
 * Busca mesas com suas comandas ativas
 */
export async function getTablesWithTabs(establishmentId: number): Promise<Array<Table & { tab?: Tab; items?: TabItem[] }>> {
  const db = await getDb();
  if (!db) return [];

  // Buscar mesas ativas
  const activeTablesList = await getTablesByEstablishment(establishmentId);

  // Buscar mesas desativadas
  const deactivatedTablesList = await getDeactivatedTables(establishmentId);

  // Para cada mesa ativa, buscar a comanda ativa e seus itens
  const activeResult = await Promise.all(activeTablesList.map(async (table) => {
    const tab = await getActiveTabByTable(table.id);
    let items: TabItem[] = [];

    if (tab) {
      items = await getTabItems(tab.id);
    }

    return { ...table, tab, items };
  }));

  // Mesas desativadas não têm comanda
  const deactivatedResult = deactivatedTablesList.map(table => ({
    ...table,
    tab: undefined,
    items: [],
  }));

  return [...activeResult, ...deactivatedResult];
}


/**
 * Atualiza campos de merge de uma mesa
 */
export async function updateTableMerge(id: number, data: {
  mergedIntoId?: number | null;
  mergedTableIds?: string | null;
  displayNumber?: string | null;
  status?: "free" | "occupied" | "reserved" | "requesting_bill";
  occupiedAt?: Date | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { updatedAt: new Date() };

  if (data.mergedIntoId !== undefined) {
    updateData.mergedIntoId = data.mergedIntoId;
  }
  if (data.mergedTableIds !== undefined) {
    updateData.mergedTableIds = data.mergedTableIds;
  }
  if (data.displayNumber !== undefined) {
    updateData.displayNumber = data.displayNumber;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.occupiedAt !== undefined) {
    updateData.occupiedAt = data.occupiedAt;
  }

  await db.update(tables)
    .set(updateData)
    .where(eq(tables.id, id));
}

/**
 * Transfere itens selecionados de uma comanda para outra.
 * Move os itens (update tabId), recalcula totais de ambas as comandas.
 * Se a comanda de origem ficar sem itens ativos, fecha-a e libera a mesa.
 */
export async function transferTabItems(
  sourceTabId: number,
  targetTabId: number,
  itemIds: number[],
  sourceTableId: number,
  targetTableId: number,
  transferLabel: boolean = false
): Promise<{ sourceEmpty: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Mover os itens selecionados para a comanda de destino
  await db.update(tabItems)
    .set({ tabId: targetTabId, updatedAt: new Date() })
    .where(and(
      inArray(tabItems.id, itemIds),
      eq(tabItems.tabId, sourceTabId)
    ));

  // Recalcular totais de ambas as comandas
  await recalculateTabTotals(sourceTabId);
  await recalculateTabTotals(targetTabId);

  // Verificar se a comanda de origem ficou sem itens ativos
  const remainingItems = await db.select().from(tabItems)
    .where(and(
      eq(tabItems.tabId, sourceTabId),
      ne(tabItems.status, "cancelled")
    ));

  const sourceEmpty = remainingItems.length === 0;

  if (sourceEmpty) {
    // Fechar a comanda de origem (cancelar)
    await cancelTab(sourceTabId);

    // Liberar a mesa de origem
    await updateTableStatus(sourceTableId, "free");

    // Se transferLabel, mover o label da mesa de origem para a de destino
    if (transferLabel) {
      const sourceTable = await getTableById(sourceTableId);
      if (sourceTable?.label) {
        await updateTable(targetTableId, { label: sourceTable.label });
        await updateTable(sourceTableId, { label: null });
      }
    }

    // Limpar label da mesa de origem
    await updateTable(sourceTableId, { label: null });
  }

  return { sourceEmpty };
}

export async function cancelTab(tabId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tabs)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(tabs.id, tabId));
}

// ============ SCHEDULED CAMPAIGNS ============

/**
 * Cria uma campanha agendada
 */
export async function createScheduledCampaign(data: {
  establishmentId: number;
  campaignName: string;
  message: string;
  recipients: { phone: string; name: string }[];
  recipientCount: number;
  scheduledAt: Date;
  costPerSms: number;
  totalCost: number;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(scheduledCampaigns).values({
    establishmentId: data.establishmentId,
    campaignName: data.campaignName,
    message: data.message,
    recipients: JSON.stringify(data.recipients),
    recipientCount: data.recipientCount,
    scheduledAt: data.scheduledAt,
    status: "pending",
    costPerSms: data.costPerSms.toFixed(4),
    totalCost: data.totalCost.toFixed(4),
  });

  return result[0].insertId;
}

/**
 * Lista campanhas agendadas de um estabelecimento
 */
export async function getScheduledCampaigns(establishmentId: number): Promise<ScheduledCampaign[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(scheduledCampaigns)
    .where(eq(scheduledCampaigns.establishmentId, establishmentId))
    .orderBy(desc(scheduledCampaigns.createdAt));
}

/**
 * Busca campanhas pendentes que já passaram do horário agendado
 */
export async function getPendingCampaignsDue(): Promise<ScheduledCampaign[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select()
    .from(scheduledCampaigns)
    .where(
      and(
        eq(scheduledCampaigns.status, "pending"),
        lte(scheduledCampaigns.scheduledAt, now)
      )
    );
}

/**
 * Atualiza o status de uma campanha agendada
 */
export async function updateScheduledCampaignStatus(
  campaignId: number,
  status: "pending" | "sent" | "cancelled" | "failed",
  extra?: { sentAt?: Date; successCount?: number; failCount?: number }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(scheduledCampaigns)
    .set({
      status,
      ...(extra?.sentAt && { sentAt: extra.sentAt }),
      ...(extra?.successCount !== undefined && { successCount: extra.successCount }),
      ...(extra?.failCount !== undefined && { failCount: extra.failCount }),
    })
    .where(eq(scheduledCampaigns.id, campaignId));
}

/**
 * Cancela uma campanha agendada (só se estiver pendente)
 */
export async function cancelScheduledCampaign(campaignId: number, establishmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.update(scheduledCampaigns)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(scheduledCampaigns.id, campaignId),
        eq(scheduledCampaigns.establishmentId, establishmentId),
        eq(scheduledCampaigns.status, "pending")
      )
    );

  return (result[0] as any).affectedRows > 0;
}


// ============ PENDING ONLINE ORDERS FUNCTIONS ============

/**
 * Salva dados do pedido antes de criar o checkout Stripe
 * Evita o limite de 500 chars do metadata do Stripe
 */
export async function savePendingOnlineOrder(sessionId: string, establishmentId: number, orderData: any): Promise<void> {
  const database = await getDb();
  const { pendingOnlineOrders } = await import("../drizzle/schema");
  await database!.insert(pendingOnlineOrders).values({
    sessionId,
    establishmentId,
    orderData,
    status: "pending",
  });
}

/**
 * Busca pedido pendente por session ID do Stripe
 */
export async function getPendingOnlineOrder(sessionId: string) {
  const database = await getDb();
  const { pendingOnlineOrders } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await database!.select().from(pendingOnlineOrders).where(eq(pendingOnlineOrders.sessionId, sessionId)).limit(1);
  return rows[0] || null;
}

/**
 * Marca pedido pendente como completo e salva o ID/número do pedido criado
 */
export async function completePendingOnlineOrder(sessionId: string, orderId: number, orderNumber: string): Promise<void> {
  const database = await getDb();
  const { pendingOnlineOrders } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  await database!.update(pendingOnlineOrders).set({
    status: "completed",
    resultOrderId: orderId,
    resultOrderNumber: orderNumber,
  }).where(eq(pendingOnlineOrders.sessionId, sessionId));
}


// ============ PDV CUSTOMERS ============

/**
 * Busca cliente PDV por telefone e estabelecimento
 */
export async function getPdvCustomerByPhone(establishmentId: number, phone: string) {
  const database = await getDb();
  if (!database) return null;
  const { eq, and } = await import("drizzle-orm");
  const rows = await database.select().from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.establishmentId, establishmentId),
      eq(pdvCustomers.phone, phone)
    ))
    .limit(1);
  return rows[0] || null;
}

/**
 * Salva ou atualiza cliente PDV (upsert por telefone + estabelecimento)
 */
export async function upsertPdvCustomer(data: {
  establishmentId: number;
  phone: string;
  name?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  reference?: string | null;
  originalPhone?: string | null;
  customerId?: number | null;
}) {
  const database = await getDb();
  if (!database) return null;
  const { eq, and } = await import("drizzle-orm");

  let existing: any[] = [];

  // Prioridade 1: buscar por customerId (mais confiável, evita duplicação ao alterar telefone)
  if (data.customerId) {
    existing = await database.select().from(pdvCustomers)
      .where(and(
        eq(pdvCustomers.id, data.customerId),
        eq(pdvCustomers.establishmentId, data.establishmentId)
      ))
      .limit(1);
  }

  // Prioridade 2: buscar pelo telefone original (fallback para edição sem customerId)
  if (existing.length === 0 && data.originalPhone) {
    existing = await database.select().from(pdvCustomers)
      .where(and(
        eq(pdvCustomers.establishmentId, data.establishmentId),
        eq(pdvCustomers.phone, data.originalPhone)
      ))
      .limit(1);
  }

  // Prioridade 3: buscar pelo telefone atual
  if (existing.length === 0) {
    existing = await database.select().from(pdvCustomers)
      .where(and(
        eq(pdvCustomers.establishmentId, data.establishmentId),
        eq(pdvCustomers.phone, data.phone)
      ))
      .limit(1);
  }

  if (existing.length > 0) {
    // Atualizar (incluindo o telefone se foi alterado)
    await database.update(pdvCustomers).set({
      phone: data.phone, // Atualiza o telefone (pode ser o mesmo ou novo)
      name: data.name ?? existing[0].name,
      street: data.street ?? existing[0].street,
      number: data.number ?? existing[0].number,
      complement: data.complement ?? existing[0].complement,
      neighborhood: data.neighborhood ?? existing[0].neighborhood,
      reference: data.reference ?? existing[0].reference,
    }).where(eq(pdvCustomers.id, existing[0].id));
    return { ...existing[0], ...data, phone: data.phone };
  } else {
    // Inserir
    const result = await database.insert(pdvCustomers).values({
      establishmentId: data.establishmentId,
      phone: data.phone,
      name: data.name,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      reference: data.reference,
    });
    return { id: result[0].insertId, ...data };
  }
}

/**
 * Busca clientes PDV por nome (parcial, case-insensitive) para autocomplete
 */
export async function searchPdvCustomersByName(establishmentId: number, nameQuery: string, limit: number = 20) {
  const database = await getDb();
  if (!database) return [];
  const { eq, and, like } = await import("drizzle-orm");
  const rows = await database.select().from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.establishmentId, establishmentId),
      like(pdvCustomers.name, `%${escapeLike(nameQuery)}%`)
    ))
    .orderBy(pdvCustomers.name)
    .limit(limit);
  return rows;
}

export async function searchPdvCustomersByPhone(establishmentId: number, phoneQuery: string, limit: number = 20) {
  const database = await getDb();
  if (!database) return [];
  const { eq, and, like } = await import("drizzle-orm");
  // Remove non-digits from query to match stored phone numbers
  const digitsOnly = phoneQuery.replace(/\D/g, '');
  const rows = await database.select().from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.establishmentId, establishmentId),
      like(pdvCustomers.phone, `%${escapeLike(digitsOnly)}%`)
    ))
    .orderBy(pdvCustomers.name)
    .limit(limit);
  return rows;
}

// ============ REVIEW ADMIN FUNCTIONS ============

/**
 * Busca métricas de avaliações para o painel admin do restaurante
 */
export async function getReviewMetrics(establishmentId: number) {
  const db = await getDb();
  if (!db) return { avgRating: 0, avgRating30d: 0, totalReviews: 0, uniqueCustomers: 0, pendingResponse: 0 };

  // Métricas gerais
  const general = await db.select({
    avgRating: sql<number>`COALESCE(AVG(rating), 0)`,
    totalReviews: sql<number>`COUNT(*)`,
    uniqueCustomers: sql<number>`COUNT(DISTINCT customerPhone)`,
    pendingResponse: sql<number>`SUM(CASE WHEN responseText IS NULL THEN 1 ELSE 0 END)`,
  }).from(reviews).where(eq(reviews.establishmentId, establishmentId));

  // Média últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = await db.select({
    avgRating30d: sql<number>`COALESCE(AVG(rating), 0)`,
  }).from(reviews).where(
    and(
      eq(reviews.establishmentId, establishmentId),
      gte(reviews.createdAt, thirtyDaysAgo)
    )
  );

  const parseNum = (v: unknown) => typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0);

  return {
    avgRating: parseNum(general[0]?.avgRating),
    avgRating30d: parseNum(recent[0]?.avgRating30d),
    totalReviews: parseNum(general[0]?.totalReviews),
    uniqueCustomers: parseNum(general[0]?.uniqueCustomers),
    pendingResponse: parseNum(general[0]?.pendingResponse),
  };
}

/**
 * Busca avaliações com paginação e filtros
 */
export async function getReviewsAdmin(establishmentId: number, options?: { limit?: number; offset?: number; filter?: 'all' | 'pending' | 'responded' }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(reviews.establishmentId, establishmentId)];
  if (options?.filter === 'pending') {
    conditions.push(sql`responseText IS NULL`);
  } else if (options?.filter === 'responded') {
    conditions.push(isNotNull(reviews.responseText));
  }

  return db.select({
    id: reviews.id,
    establishmentId: reviews.establishmentId,
    orderId: reviews.orderId,
    customerName: reviews.customerName,
    customerPhone: reviews.customerPhone,
    rating: reviews.rating,
    comment: reviews.comment,
    responseText: reviews.responseText,
    responseDate: reviews.responseDate,
    isRead: reviews.isRead,
    createdAt: reviews.createdAt,
    orderNumber: orders.orderNumber,
  }).from(reviews)
    .leftJoin(orders, eq(reviews.orderId, orders.id))
    .where(and(...conditions))
    .orderBy(desc(reviews.createdAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0);
}

/**
 * Conta total de avaliações com filtros
 */
export async function getReviewsAdminCount(establishmentId: number, filter?: 'all' | 'pending' | 'responded') {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [eq(reviews.establishmentId, establishmentId)];
  if (filter === 'pending') {
    conditions.push(sql`responseText IS NULL`);
  } else if (filter === 'responded') {
    conditions.push(isNotNull(reviews.responseText));
  }

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(and(...conditions));

  return Number(result[0]?.count ?? 0);
}

/**
 * Responder a uma avaliação
 */
export async function respondToReview(reviewId: number, establishmentId: number, responseText: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reviews).set({
    responseText,
    responseDate: new Date(),
  }).where(
    and(
      eq(reviews.id, reviewId),
      eq(reviews.establishmentId, establishmentId)
    )
  );
}

/**
 * Marcar avaliações como lidas
 */
export async function markReviewsAsRead(establishmentId: number, reviewIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (reviewIds.length === 0) return;

  await db.update(reviews).set({ isRead: true }).where(
    and(
      eq(reviews.establishmentId, establishmentId),
      inArray(reviews.id, reviewIds)
    )
  );
}

/**
 * Contar avaliações não lidas (para badge no menu)
 */
export async function getUnreadReviewCount(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(reviews).where(
    and(
      eq(reviews.establishmentId, establishmentId),
      eq(reviews.isRead, false)
    )
  );

  const count = result[0]?.count;
  return typeof count === 'string' ? parseInt(count) : (count ?? 0);
}


// ============================================================
// COMBO FUNCTIONS
// ============================================================

/**
 * Criar combo completo (produto + grupos + itens)
 */
export async function createCombo(data: {
  establishmentId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: string;
  images?: string[];
  groups: {
    name: string;
    isRequired: boolean;
    minQuantity?: number;
    maxQuantity: number;
    sortOrder: number;
    items: { productId: number; sortOrder: number }[];
  }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Criar o produto-combo
  const maxSortOrder = await db.select({ max: sql<number>`COALESCE(MAX(${products.sortOrder}), 0)` })
    .from(products)
    .where(eq(products.categoryId, data.categoryId));

  const [result] = await db.insert(products).values({
    establishmentId: data.establishmentId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || null,
    price: data.price,
    images: data.images || null,
    status: "active",
    isCombo: true,
    sortOrder: (maxSortOrder[0]?.max ?? 0) + 1,
    version: 'draft',
  });
  const comboProductId = result.insertId;

  // 2. Criar os grupos e itens
  let currentSortOrder = 0;
  for (const group of data.groups) {
    const [groupResult] = await db.insert(comboGroups).values({
      productId: comboProductId,
      name: group.name,
      isRequired: group.isRequired,
      minQuantity: group.isRequired ? (group.minQuantity ?? 1) : 0,
      maxQuantity: group.maxQuantity,
      sortOrder: currentSortOrder++,
    });
    const groupId = groupResult.insertId;

    // 3. Criar itens do grupo
    for (const item of group.items) {
      await db.insert(comboGroupItems).values({
        comboGroupId: groupId,
        productId: item.productId,
        sortOrder: item.sortOrder,
      });

      // 4. Importar complementos do item (se existirem) como complementGroups do combo
      const itemComplements = await getComplementGroupsByProduct(item.productId);
      for (const compGroup of itemComplements) {
        if (compGroup.items.length === 0) continue; // Pular grupos vazios

        // Copiar o complementGroup do item original para o produto-combo (as draft)
        const [copiedGroupResult] = await db.insert(complementGroups).values({
          productId: comboProductId,
          name: compGroup.name,
          minQuantity: compGroup.minQuantity,
          maxQuantity: compGroup.maxQuantity,
          isRequired: compGroup.isRequired,
          sortOrder: compGroup.sortOrder,
          version: 'draft',
        });
        const copiedGroupId = copiedGroupResult.insertId;

        // Copiar todos os complementItems do grupo original (as draft)
        for (const compItem of compGroup.items) {
          await db.insert(complementItems).values({
            groupId: copiedGroupId,
            name: compItem.name,
            price: compItem.price,
            imageUrl: compItem.imageUrl,
            isActive: compItem.isActive,
            priceMode: compItem.priceMode,
            sortOrder: compItem.sortOrder,
            availabilityType: compItem.availabilityType,
            availableDays: compItem.availableDays,
            availableHours: compItem.availableHours,
            badgeText: compItem.badgeText,
            version: 'draft',
          });
        }
      }
    }
  }

  return { id: comboProductId };
}

/**
 * Buscar grupos de um combo com seus itens
 */
export async function getComboGroupsByProductId(productId: number) {
  const db = await getDb();
  if (!db) return [];

  const groups = await db.select()
    .from(comboGroups)
    .where(eq(comboGroups.productId, productId))
    .orderBy(asc(comboGroups.sortOrder));

  const groupsWithItems = await Promise.all(
    groups.map(async (group) => {
      const items = await db.select({
        id: comboGroupItems.id,
        comboGroupId: comboGroupItems.comboGroupId,
        productId: comboGroupItems.productId,
        sortOrder: comboGroupItems.sortOrder,
        isActive: comboGroupItems.isActive,
        productName: products.name,
        productPrice: products.price,
        productImages: products.images,
        productStatus: products.status,
        categoryId: products.categoryId,
      })
        .from(comboGroupItems)
        .leftJoin(products, eq(comboGroupItems.productId, products.id))
        .where(eq(comboGroupItems.comboGroupId, group.id))
        .orderBy(asc(comboGroupItems.sortOrder));

      return { ...group, items };
    })
  );

  return groupsWithItems;
}

/**
 * Deletar um combo (produto + grupos + itens)
 */
export async function deleteCombo(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Buscar grupos do combo
  const groups = await db.select({ id: comboGroups.id })
    .from(comboGroups)
    .where(eq(comboGroups.productId, productId));

  // 2. Deletar itens de cada grupo
  for (const group of groups) {
    await db.delete(comboGroupItems).where(eq(comboGroupItems.comboGroupId, group.id));
  }

  // 3. Deletar grupos
  await db.delete(comboGroups).where(eq(comboGroups.productId, productId));

  // 4. Deletar o produto-combo
  await db.delete(products).where(eq(products.id, productId));
}

/**
 * Buscar produtos para seleção no combo (busca com filtro)
 */
export async function searchProductsForCombo(establishmentId: number, search?: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(products.establishmentId, establishmentId),
    eq(products.isCombo, false), // Não incluir outros combos
    eq(products.version, "draft"), // Apenas versão rascunho para evitar duplicatas
  ];

  if (search && search.trim()) {
    conditions.push(like(products.name, `%${escapeLike(search.trim())}%`));
  }

  const result = await db.select({
    id: products.id,
    name: products.name,
    price: products.price,
    images: products.images,
    status: products.status,
    categoryId: products.categoryId,
    categoryName: categories.name,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(products.name))
    .limit(limit);

  return result;
}

// ============ DRIVERS (ENTREGADORES) ============

export async function createDriver(data: Omit<InsertDriver, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(drivers).values(data);
  return result.insertId;
}

export async function updateDriver(id: number, data: Partial<Omit<InsertDriver, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(drivers).set(data).where(eq(drivers.id, id));
}

export async function deleteDriver(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(drivers).where(eq(drivers.id, id));
}

export async function getDriverById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
  return driver || null;
}

export async function getDriversByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drivers)
    .where(eq(drivers.establishmentId, establishmentId))
    .orderBy(asc(drivers.name));
}

export async function getDriverMetrics(establishmentId: number) {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, inactive: 0, repasses7d: 0, entregas7d: 0 };

  const allDrivers = await db.select().from(drivers)
    .where(eq(drivers.establishmentId, establishmentId));

  const total = allDrivers.length;
  const active = allDrivers.filter(d => d.isActive).length;
  const inactive = total - active;

  // Repasses últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentDeliveries = await db.select().from(deliveries)
    .where(
      and(
        eq(deliveries.establishmentId, establishmentId),
        gte(deliveries.createdAt, sevenDaysAgo)
      )
    );

  const repasses7d = recentDeliveries.reduce((sum, d) => sum + parseFloat(d.repasseValue || '0'), 0);
  const entregas7d = recentDeliveries.length;

  return { total, active, inactive, repasses7d, entregas7d };
}

// ============ DELIVERIES (ENTREGAS) ============

export async function createDelivery(data: Omit<InsertDelivery, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(deliveries).values(data);
  return result.insertId;
}

export async function getDeliveryByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId));
  return delivery || null;
}

export async function getDeliveriesByDriver(driverId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveries)
    .where(eq(deliveries.driverId, driverId))
    .orderBy(desc(deliveries.createdAt));
}

export async function getDeliveriesByDriverWithOrders(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  const driverDeliveries = await db.select().from(deliveries)
    .where(eq(deliveries.driverId, driverId))
    .orderBy(desc(deliveries.createdAt));

  // Enrich with order data
  const enriched = await Promise.all(
    driverDeliveries.map(async (del) => {
      const order = await db.select().from(orders).where(eq(orders.id, del.orderId));
      return {
        ...del,
        order: order[0] || null,
      };
    })
  );

  return enriched;
}

export async function getDriverDetailMetrics(driverId: number) {
  const db = await getDb();
  if (!db) return { totalDeliveries: 0, totalBruto: 0, totalPending: 0, totalPaid: 0, avgPerDelivery: 0 };

  const allDeliveries = await db.select().from(deliveries)
    .where(eq(deliveries.driverId, driverId));

  const totalDeliveries = allDeliveries.length;
  const totalBruto = allDeliveries.reduce((sum, d) => sum + parseFloat(d.deliveryFee || '0'), 0);
  const totalPending = allDeliveries.filter(d => d.paymentStatus === 'pending')
    .reduce((sum, d) => sum + parseFloat(d.repasseValue || '0'), 0);
  const totalPaid = allDeliveries.filter(d => d.paymentStatus === 'paid')
    .reduce((sum, d) => sum + parseFloat(d.repasseValue || '0'), 0);
  const avgPerDelivery = totalDeliveries > 0 ? totalBruto / totalDeliveries : 0;

  return { totalDeliveries, totalBruto, totalPending, totalPaid, avgPerDelivery };
}

export async function markDeliveryAsPaid(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveries).set({ paymentStatus: 'paid', paidAt: new Date() }).where(eq(deliveries.id, deliveryId));
}

export async function markDeliveryWhatsappSent(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveries).set({ whatsappSent: true, whatsappSentAt: new Date() }).where(eq(deliveries.id, deliveryId));
}

export async function getDriverDeliveriesLast7Days(driverId: number) {
  const db = await getDb();
  if (!db) return { count: 0, totalRepasse: 0 };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recent = await db.select().from(deliveries)
    .where(
      and(
        eq(deliveries.driverId, driverId),
        gte(deliveries.createdAt, sevenDaysAgo)
      )
    );

  return {
    count: recent.length,
    totalRepasse: recent.reduce((sum, d) => sum + parseFloat(d.repasseValue || '0'), 0),
  };
}

export async function getDriverPendingTotal(driverId: number) {
  const db = await getDb();
  if (!db) return 0;

  const pending = await db.select().from(deliveries)
    .where(
      and(
        eq(deliveries.driverId, driverId),
        eq(deliveries.paymentStatus, 'pending')
      )
    );

  return pending.reduce((sum, d) => sum + parseFloat(d.repasseValue || '0'), 0);
}

export async function getActiveDriversByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drivers)
    .where(
      and(
        eq(drivers.establishmentId, establishmentId),
        eq(drivers.isActive, true)
      )
    )
    .orderBy(asc(drivers.name));
}

export async function getDeliveryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
  return delivery || null;
}


// ============ DRIVER NOTIFY TIMING ============

export async function getDriverNotifyTiming(establishmentId: number): Promise<"on_accepted" | "on_ready"> {
  const db = await getDb();
  if (!db) return "on_ready";
  const [result] = await db.select({ driverNotifyTiming: establishments.driverNotifyTiming })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);
  return (result?.driverNotifyTiming as "on_accepted" | "on_ready") || "on_ready";
}

export async function updateDriverNotifyTiming(establishmentId: number, timing: "on_accepted" | "on_ready") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(establishments).set({ driverNotifyTiming: timing }).where(eq(establishments.id, establishmentId));
}

export async function getDepartureNotifyBy(establishmentId: number): Promise<"driver" | "attendant"> {
  const db = await getDb();
  if (!db) return "driver";
  const [result] = await db.select({ departureNotifyBy: establishments.departureNotifyBy })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);
  return (result?.departureNotifyBy as "driver" | "attendant") || "driver";
}

export async function updateDepartureNotifyBy(establishmentId: number, value: "driver" | "attendant") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(establishments).set({ departureNotifyBy: value }).where(eq(establishments.id, establishmentId));
}

export async function markOrderDeliveryNotified(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ deliveryNotified: true }).where(eq(orders.id, orderId));
}

export async function isOrderDeliveryNotified(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [result] = await db.select({ deliveryNotified: orders.deliveryNotified })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return result?.deliveryNotified === true;
}


// ============ SCHEDULING (AGENDAMENTO) FUNCTIONS ============

/**
 * Busca configurações de agendamento de um estabelecimento
 */
export async function getSchedulingConfig(establishmentId: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select({
    schedulingEnabled: establishments.schedulingEnabled,
    schedulingMinAdvance: establishments.schedulingMinAdvance,
    schedulingMaxDays: establishments.schedulingMaxDays,
    schedulingInterval: establishments.schedulingInterval,
    schedulingMoveMinutes: establishments.schedulingMoveMinutes,
  }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
  return result || null;
}

/**
 * Atualiza configurações de agendamento
 */
export async function updateSchedulingConfig(establishmentId: number, data: {
  schedulingEnabled?: boolean;
  schedulingMinAdvance?: number;
  schedulingMaxDays?: number;
  schedulingInterval?: number;
  schedulingMoveMinutes?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(establishments).set(data).where(eq(establishments.id, establishmentId));
}

/**
 * Busca pedidos agendados de um estabelecimento para uma data específica (YYYY-MM-DD)
 */
export async function getScheduledOrdersByDate(establishmentId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);
  return db.select()
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.isScheduled, true),
      gte(orders.scheduledAt, startOfDay),
      lte(orders.scheduledAt, endOfDay),
    ))
    .orderBy(asc(orders.scheduledAt));
}

/**
 * Busca pedidos agendados de um estabelecimento para um range de datas
 */
export async function getScheduledOrdersByRange(establishmentId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  return db.select()
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.isScheduled, true),
      gte(orders.scheduledAt, start),
      lte(orders.scheduledAt, end),
    ))
    .orderBy(asc(orders.scheduledAt));
}

/**
 * Busca pedidos agendados que precisam ser movidos para a fila principal.
 * Retorna pedidos cujo scheduledAt - moveMinutes <= agora E que ainda não foram movidos.
 */
export async function getScheduledOrdersToMove() {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os estabelecimentos com agendamento habilitado
  const estabs = await db.select({
    id: establishments.id,
    schedulingMoveMinutes: establishments.schedulingMoveMinutes,
    timezone: establishments.timezone,
  }).from(establishments).where(eq(establishments.schedulingEnabled, true));

  const ordersToMove: Array<{ order: Order; establishmentId: number }> = [];

  for (const estab of estabs) {
    const tz = estab.timezone || 'America/Sao_Paulo';
    const now = getLocalDate(tz);
    const moveMinutes = estab.schedulingMoveMinutes || 30;

    // Buscar pedidos agendados que ainda não foram movidos
    const scheduled = await db.select()
      .from(orders)
      .where(and(
        eq(orders.establishmentId, estab.id),
        eq(orders.isScheduled, true),
        eq(orders.movedToQueue, false),
        eq(orders.status, 'scheduled'),
        isNotNull(orders.scheduledAt),
      ));

    for (const order of scheduled) {
      if (!order.scheduledAt) continue;
      const scheduledTime = new Date(order.scheduledAt);
      const moveTime = new Date(scheduledTime.getTime() - moveMinutes * 60 * 1000);

      if (now >= moveTime) {
        ordersToMove.push({ order, establishmentId: estab.id });
      }
    }
  }

  return ordersToMove;
}

/**
 * Move um pedido agendado para a fila principal (status: pending)
 */
export async function moveScheduledOrderToQueue(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const movedAt = new Date();
  await db.update(orders).set({
    status: 'new',
    movedToQueue: true,
    movedToQueueAt: movedAt,
    newAt: movedAt,
  }).where(eq(orders.id, orderId));

  // Buscar o pedido atualizado para notificar via SSE
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order) {
    // Buscar itens do pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    notifyNewOrder(order.establishmentId, { ...order, items });
  }

  return order;
}

/**
 * Reagendar um pedido para nova data/hora
 */
export async function rescheduleOrder(orderId: number, newScheduledAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({
    scheduledAt: newScheduledAt,
    movedToQueue: false,
    movedToQueueAt: null,
  }).where(eq(orders.id, orderId));
}

/**
 * Aceitar pedido agendado antecipadamente (mover para fila)
 */
export async function acceptScheduledOrder(orderId: number) {
  return moveScheduledOrderToQueue(orderId);
}

/**
 * Cancelar pedido agendado
 */
export async function cancelScheduledOrder(orderId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({
    status: 'cancelled',
    cancellationReason: reason || 'Pedido agendado cancelado',
  }).where(eq(orders.id, orderId));
}

/**
 * Contar pedidos agendados pendentes (não movidos para fila) de um estabelecimento
 */
export async function getScheduledPendingCount(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ id: orders.id })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.isScheduled, true),
      eq(orders.status, 'scheduled'),
      eq(orders.movedToQueue, false),
    ));
  return result.length;
}

/**
 * Contar pedidos agendados por mês para um estabelecimento
 * Retorna um mapa { 'YYYY-MM-DD': count }
 */
export async function getScheduledOrderCountsByMonth(establishmentId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return {};

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const scheduled = await db.select({
    scheduledAt: orders.scheduledAt,
  }).from(orders).where(and(
    eq(orders.establishmentId, establishmentId),
    eq(orders.isScheduled, true),
    gte(orders.scheduledAt, startDate),
    lte(orders.scheduledAt, endDate),
    ne(orders.status, 'cancelled'),
  ));

  const counts: Record<string, number> = {};
  for (const o of scheduled) {
    if (!o.scheduledAt) continue;
    const d = new Date(o.scheduledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}


// ============ FINANÇAS ============

// --- Categorias de Despesa ---

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Fornecedor", color: "#3b82f6" },
  { name: "Funcionários", color: "#8b5cf6" },
  { name: "Aluguel", color: "#f59e0b" },
  { name: "Energia", color: "#eab308" },
  { name: "Água", color: "#06b6d4" },
  { name: "Marketing", color: "#ec4899" },
  { name: "Impostos", color: "#ef4444" },
  { name: "Entregadores", color: "#10b981" },
  { name: "Outros", color: "#6b7280" },
];

export async function ensureDefaultExpenseCategories(establishmentId: number) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(expenseCategories)
    .where(eq(expenseCategories.establishmentId, establishmentId));

  if (existing.length === 0) {
    for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
      const cat = DEFAULT_EXPENSE_CATEGORIES[i];
      await db.insert(expenseCategories).values({
        establishmentId,
        name: cat.name,
        color: cat.color,
        isDefault: true,
        sortOrder: i,
      });
    }
  } else {
    // Ensure new default categories are added if missing
    const existingNames = existing.map(e => e.name);
    for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
      const cat = DEFAULT_EXPENSE_CATEGORIES[i];
      if (!existingNames.includes(cat.name)) {
        await db.insert(expenseCategories).values({
          establishmentId,
          name: cat.name,
          color: cat.color,
          isDefault: true,
          sortOrder: existing.length + i,
        });
      }
    }
  }
}

export async function getOrCreateEntregadoresCategory(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await ensureDefaultExpenseCategories(establishmentId);

  const [cat] = await db.select().from(expenseCategories)
    .where(and(
      eq(expenseCategories.establishmentId, establishmentId),
      eq(expenseCategories.name, "Entregadores")
    ));

  if (cat) return cat.id;

  // Fallback: create it
  const [result] = await db.insert(expenseCategories).values({
    establishmentId,
    name: "Entregadores",
    color: "#10b981",
    isDefault: true,
    sortOrder: 99,
  });
  return result.insertId;
}

export async function getExpenseCategories(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  await ensureDefaultExpenseCategories(establishmentId);

  return db.select().from(expenseCategories)
    .where(eq(expenseCategories.establishmentId, establishmentId))
    .orderBy(asc(expenseCategories.sortOrder));
}

export async function getExpenseCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getExpenseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createExpenseCategory(data: { establishmentId: number; name: string; color?: string }) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(expenseCategories).values({
    establishmentId: data.establishmentId,
    name: data.name,
    color: data.color || "#6b7280",
    isDefault: false,
    sortOrder: 99,
  });
  return result[0].insertId;
}

export async function updateExpenseCategory(id: number, data: { name?: string; color?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(expenseCategories).set(data).where(eq(expenseCategories.id, id));
}

export async function deleteExpenseCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  // Check if there are expenses using this category
  const usedCount = await db.select({ count: sql<number>`count(*)` })
    .from(expenses)
    .where(eq(expenses.categoryId, id));
  if ((usedCount[0]?.count ?? 0) > 0) {
    throw new Error("Não é possível excluir uma categoria que possui despesas vinculadas.");
  }
  await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
}

// --- Despesas ---

export async function getExpenses(establishmentId: number, filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  paymentMethod?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions: any[] = [eq(expenses.establishmentId, establishmentId)];

  const tz = await getEstablishmentTimezone(establishmentId);

  if (filters?.startDate) {
    conditions.push(sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) <= ${filters.endDate} `);
  }
  if (filters?.categoryId) {
    conditions.push(eq(expenses.categoryId, filters.categoryId));
  }
  if (filters?.paymentMethod) {
    conditions.push(eq(expenses.paymentMethod, filters.paymentMethod as any));
  }
  if (filters?.search) {
    conditions.push(sql`${expenses.description} LIKE ${`%${escapeLike(filters.search)}%`}`);
  }

  const whereClause = and(...conditions);

  const [items, countResult] = await Promise.all([
    db.select({
      id: expenses.id,
      categoryId: expenses.categoryId,
      description: expenses.description,
      amount: expenses.amount,
      paymentMethod: expenses.paymentMethod,
      date: expenses.date,
      notes: expenses.notes,
      createdAt: expenses.createdAt,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
    })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(whereClause)
      .orderBy(desc(expenses.date))
      .limit(filters?.limit ?? 50)
      .offset(filters?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(whereClause),
  ]);

  return { items, total: countResult[0]?.count ?? 0 };
}

export async function createExpense(data: {
  establishmentId: number;
  categoryId: number;
  description: string;
  amount: string;
  paymentMethod: "cash" | "pix" | "card" | "transfer";
  date: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(expenses).values({
    establishmentId: data.establishmentId,
    categoryId: data.categoryId,
    description: data.description,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    date: data.date,
    notes: data.notes || null,
  });
  return result[0].insertId;
}

export async function updateExpense(id: number, data: {
  categoryId?: number;
  description?: string;
  amount?: string;
  paymentMethod?: "cash" | "pix" | "card" | "transfer";
  date?: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(expenses).set(data).where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(expenses).where(eq(expenses.id, id));
}

// --- Resumo Financeiro ---

export async function getFinanceSummary(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'today', customStart?: string, customEnd?: string) {
  const db = await getDb();
  if (!db) return { revenue: 0, expensesTotal: 0, profit: 0, avgTicket: 0, ordersCount: 0, revenueChange: 0, expensesChange: 0, profitChange: 0, avgTicketChange: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  let prevPeriodStart: Date;
  let prevPeriodEnd: Date;

  if (period === 'custom' && customStart && customEnd) {
    periodStart = new Date(customStart);
    const daysDiff = Math.ceil((new Date(customEnd).getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    prevPeriodEnd = new Date(periodStart);
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - daysDiff);
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
    prevPeriodEnd = new Date(periodStart);
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
    prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
    prevPeriodEnd = new Date(periodStart);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    prevPeriodStart = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
    prevPeriodEnd = new Date(periodStart);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);
  const prevPeriodStartStr = fmtLocalDateTime(prevPeriodStart);
  const prevPeriodEndStr = fmtLocalDateTime(prevPeriodEnd);
  const nowStr = period === 'custom' && customEnd ? `${customEnd} 23:59:59` : undefined;

  // Receita atual (pedidos completed)
  const revenueResult = await db.select({
    total: sql<number>`COALESCE(SUM(total), 0)`,
    count: sql<number>`count(*)`
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`,
      ...(nowStr ? [sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) <= ${nowStr}`] : []),
      eq(orders.status, "completed")
    ));

  // Receita anterior
  const prevRevenueResult = await db.select({
    total: sql<number>`COALESCE(SUM(total), 0)`,
    count: sql<number>`count(*)`
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${prevPeriodStartStr}`,
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) < ${prevPeriodEndStr}`,
      eq(orders.status, "completed")
    ));

  // Despesas atuais
  const expensesResult = await db.select({
    total: sql<number>`COALESCE(SUM(amount), 0)`
  })
    .from(expenses)
    .where(and(
      eq(expenses.establishmentId, establishmentId),
      sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) >= ${periodStartStr}`,
      ...(nowStr ? [sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) <= ${nowStr}`] : [])
    ));

  // Despesas anteriores
  const prevExpensesResult = await db.select({
    total: sql<number>`COALESCE(SUM(amount), 0)`
  })
    .from(expenses)
    .where(and(
      eq(expenses.establishmentId, establishmentId),
      sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) >= ${prevPeriodStartStr}`,
      sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) < ${prevPeriodEndStr}`
    ));

  const revenue = Number(revenueResult[0]?.total ?? 0);
  const ordersCount = revenueResult[0]?.count ?? 0;
  const expensesTotal = Number(expensesResult[0]?.total ?? 0);
  const profit = revenue - expensesTotal;
  const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;

  const prevRevenue = Number(prevRevenueResult[0]?.total ?? 0);
  const prevExpensesTotal = Number(prevExpensesResult[0]?.total ?? 0);
  const prevProfit = prevRevenue - prevExpensesTotal;
  const prevOrdersCount = prevRevenueResult[0]?.count ?? 0;
  const prevAvgTicket = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    revenue,
    expensesTotal,
    profit,
    avgTicket,
    ordersCount,
    revenueChange: calcChange(revenue, prevRevenue),
    expensesChange: calcChange(expensesTotal, prevExpensesTotal),
    profitChange: calcChange(profit, prevProfit),
    avgTicketChange: calcChange(avgTicket, prevAvgTicket),
  };
}

// --- Gráfico de Evolução Financeira ---

export async function getFinanceChart(establishmentId: number, period: 'week' | 'month' = 'week') {
  const db = await getDb();
  if (!db) return [];

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let days: number;
  let periodStart: Date;

  if (period === 'week') {
    days = 7;
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    days = localNow.getDate();
  }

  const periodStartStr = fmtLocalDateTime(periodStart);

  // Revenue by day (raw SQL to avoid only_full_group_by)
  const revenueByDay: { date: string; total: number }[] = await db.execute(
    sql`SELECT DATE(CONVERT_TZ(createdAt, '+00:00', ${tz})) as \`date\`, COALESCE(SUM(total), 0) as total FROM orders WHERE establishmentId = ${establishmentId} AND CONVERT_TZ(createdAt, '+00:00', ${tz}) >= ${periodStartStr} AND status = 'completed' GROUP BY \`date\``
  ).then((rows: any) => (Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows).map((r: any) => ({ date: String(r.date), total: Number(r.total) })));

  // Expenses by day (raw SQL to avoid only_full_group_by)
  const expensesByDay: { date: string; total: number }[] = await db.execute(
    sql`SELECT DATE(CONVERT_TZ(date, '+00:00', ${tz})) as \`date\`, COALESCE(SUM(amount), 0) as total FROM expenses WHERE establishmentId = ${establishmentId} AND CONVERT_TZ(date, '+00:00', ${tz}) >= ${periodStartStr} GROUP BY \`date\``
  ).then((rows: any) => (Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows).map((r: any) => ({ date: String(r.date), total: Number(r.total) })));

  // Build chart data
  const revenueMap = new Map(revenueByDay.map(r => [r.date, Number(r.total)]));
  const expensesMap = new Map(expensesByDay.map(e => [e.date, Number(e.total)]));

  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const rev = revenueMap.get(key) ?? 0;
    const exp = expensesMap.get(key) ?? 0;
    result.push({
      date: key,
      label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
      revenue: rev,
      expenses: exp,
      profit: rev - exp,
    });
  }

  return result;
}

// --- Despesas por Categoria (para gráfico de pizza) ---

export async function getExpensesByCategory(establishmentId: number, period: 'today' | 'week' | 'month' = 'month') {
  const db = await getDb();
  if (!db) return [];

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;

  if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);

  const rawResult: any[] = await db.execute(
    sql`SELECT e.categoryId, ec.name as categoryName, ec.color as categoryColor, COALESCE(SUM(e.amount), 0) as total, count(*) as \`count\` FROM expenses e LEFT JOIN expenseCategories ec ON e.categoryId = ec.id WHERE e.establishmentId = ${establishmentId} AND CONVERT_TZ(e.date, '+00:00', ${tz}) >= ${periodStartStr} GROUP BY e.categoryId, ec.name, ec.color`
  ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);

  return rawResult.map((r: any) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categoryColor: r.categoryColor,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

// --- Meta Mensal ---

export async function getMonthlyGoal(establishmentId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(monthlyGoals)
    .where(and(
      eq(monthlyGoals.establishmentId, establishmentId),
      eq(monthlyGoals.month, month),
      eq(monthlyGoals.year, year)
    ));

  return result[0] || null;
}

export async function upsertMonthlyGoal(data: { establishmentId: number; month: number; year: number; targetProfit: string }) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getMonthlyGoal(data.establishmentId, data.month, data.year);

  if (existing) {
    await db.update(monthlyGoals)
      .set({ targetProfit: data.targetProfit })
      .where(eq(monthlyGoals.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(monthlyGoals).values({
      establishmentId: data.establishmentId,
      month: data.month,
      year: data.year,
      targetProfit: data.targetProfit,
    });
    return result[0].insertId;
  }
}

// --- Despesas Recorrentes ---

export async function createRecurringExpense(data: {
  establishmentId: number;
  type: "expense" | "revenue";
  description: string;
  categoryId: number;
  amount: string;
  paymentMethod: "cash" | "pix" | "card" | "transfer";
  frequency: "weekly" | "monthly" | "yearly";
  executionDay: number;
  executionMonth?: number;
  generateAsPending: boolean;
  startDate: Date;
  endDate?: Date | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(recurringExpenses).values({
    establishmentId: data.establishmentId,
    type: data.type,
    description: data.description,
    categoryId: data.categoryId,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    frequency: data.frequency,
    executionDay: data.executionDay,
    executionMonth: data.executionMonth ?? null,
    generateAsPending: data.generateAsPending,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    notes: data.notes ?? null,
    active: true,
  });
  return result[0].insertId;
}

export async function listRecurringExpenses(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: recurringExpenses.id,
    type: recurringExpenses.type,
    description: recurringExpenses.description,
    categoryId: recurringExpenses.categoryId,
    categoryName: expenseCategories.name,
    categoryColor: expenseCategories.color,
    amount: recurringExpenses.amount,
    paymentMethod: recurringExpenses.paymentMethod,
    frequency: recurringExpenses.frequency,
    executionDay: recurringExpenses.executionDay,
    executionMonth: recurringExpenses.executionMonth,
    generateAsPending: recurringExpenses.generateAsPending,
    startDate: recurringExpenses.startDate,
    endDate: recurringExpenses.endDate,
    active: recurringExpenses.active,
    lastGeneratedAt: recurringExpenses.lastGeneratedAt,
    notes: recurringExpenses.notes,
    createdAt: recurringExpenses.createdAt,
  })
    .from(recurringExpenses)
    .leftJoin(expenseCategories, eq(recurringExpenses.categoryId, expenseCategories.id))
    .where(eq(recurringExpenses.establishmentId, establishmentId))
    .orderBy(desc(recurringExpenses.createdAt));

  return result.map(r => ({
    ...r,
    amount: Number(r.amount),
  }));
}

export async function updateRecurringExpense(id: number, establishmentId: number, data: Partial<{
  description: string;
  categoryId: number;
  amount: string;
  paymentMethod: "cash" | "pix" | "card" | "transfer";
  frequency: "weekly" | "monthly" | "yearly";
  executionDay: number;
  executionMonth: number | null;
  generateAsPending: boolean;
  endDate: Date | null;
  active: boolean;
  notes: string | null;
}>) {
  const db = await getDb();
  if (!db) return false;

  // Fetch current values before update to record history
  const [current] = await db.select()
    .from(recurringExpenses)
    .where(and(
      eq(recurringExpenses.id, id),
      eq(recurringExpenses.establishmentId, establishmentId)
    ));

  if (current) {
    const fieldLabels: Record<string, string> = {
      description: 'Descrição',
      amount: 'Valor',
      frequency: 'Frequência',
      executionDay: 'Dia de execução',
      executionMonth: 'Mês de execução',
      paymentMethod: 'Forma de pagamento',
      categoryId: 'Categoria',
      active: 'Status',
      notes: 'Observações',
    };

    const trackedFields = ['description', 'amount', 'frequency', 'executionDay', 'executionMonth', 'paymentMethod', 'categoryId', 'active', 'notes'] as const;

    for (const field of trackedFields) {
      if (data[field] !== undefined) {
        const oldVal = String(current[field] ?? '');
        const newVal = String(data[field] ?? '');
        if (oldVal !== newVal) {
          await db.insert(recurringExpenseHistory).values({
            recurringExpenseId: id,
            establishmentId,
            field: fieldLabels[field] || field,
            oldValue: oldVal,
            newValue: newVal,
          });
        }
      }
    }
  }

  await db.update(recurringExpenses)
    .set(data)
    .where(and(
      eq(recurringExpenses.id, id),
      eq(recurringExpenses.establishmentId, establishmentId)
    ));
  return true;
}

export async function getRecurringExpenseHistory(recurringExpenseId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(recurringExpenseHistory)
    .where(and(
      eq(recurringExpenseHistory.recurringExpenseId, recurringExpenseId),
      eq(recurringExpenseHistory.establishmentId, establishmentId)
    ))
    .orderBy(desc(recurringExpenseHistory.changedAt));
}

export async function deleteRecurringExpense(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(recurringExpenses)
    .where(and(
      eq(recurringExpenses.id, id),
      eq(recurringExpenses.establishmentId, establishmentId)
    ));
  return true;
}

export async function deactivateRecurringExpense(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.update(recurringExpenses)
    .set({ active: false })
    .where(and(
      eq(recurringExpenses.id, id),
      eq(recurringExpenses.establishmentId, establishmentId)
    ));
  return true;
}

export async function processRecurringExpenses(establishmentId: number) {
  const db = await getDb();
  if (!db) return { generated: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const today = localNow.getDate();
  const currentMonth = localNow.getMonth() + 1; // 1-12
  const currentDayOfWeek = localNow.getDay(); // 0=Sunday
  const todayStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());

  // Get all active recurring expenses for this establishment
  const activeRecurrences = await db.select()
    .from(recurringExpenses)
    .where(and(
      eq(recurringExpenses.establishmentId, establishmentId),
      eq(recurringExpenses.active, true)
    ));

  let generated = 0;

  for (const rec of activeRecurrences) {
    // Check if end date has passed
    if (rec.endDate && rec.endDate < todayStart) continue;
    // Check if start date hasn't arrived yet
    if (rec.startDate > todayStart) continue;

    let shouldGenerate = false;

    if (rec.frequency === "monthly" && rec.executionDay === today) {
      shouldGenerate = true;
    } else if (rec.frequency === "weekly" && rec.executionDay === currentDayOfWeek) {
      shouldGenerate = true;
    } else if (rec.frequency === "yearly" && rec.executionDay === today && rec.executionMonth === currentMonth) {
      shouldGenerate = true;
    }

    if (!shouldGenerate) continue;

    // Check if already generated today (prevent duplicates)
    if (rec.lastGeneratedAt) {
      const lastGenDate = new Date(rec.lastGeneratedAt);
      const lastGenLocal = new Date(lastGenDate.toLocaleString("en-US", { timeZone: tz }));
      if (
        lastGenLocal.getFullYear() === localNow.getFullYear() &&
        lastGenLocal.getMonth() === localNow.getMonth() &&
        lastGenLocal.getDate() === localNow.getDate()
      ) {
        continue; // Already generated today
      }
    }

    // Generate the expense
    const expenseDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 12, 0, 0);

    await db.insert(expenses).values({
      establishmentId: rec.establishmentId,
      categoryId: rec.categoryId,
      description: `${rec.description} (recorrente)`,
      amount: rec.amount,
      paymentMethod: rec.paymentMethod,
      date: expenseDate,
      notes: rec.notes,
    });

    // Update lastGeneratedAt
    await db.update(recurringExpenses)
      .set({ lastGeneratedAt: new Date() })
      .where(eq(recurringExpenses.id, rec.id));

    generated++;
  }

  return { generated };
}

// --- Comparação Mensal ---

export async function getMonthlyComparison(establishmentId: number) {
  const db = await getDb();
  if (!db) return { months: [] };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const months: { label: string; receitas: number; despesas: number }[] = [];

  // Get last 6 months data (current month + 5 previous)
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(localNow.getFullYear(), localNow.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = i === 0
      ? new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 23, 59, 59)
      : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const startStr = fmtLocalDateTime(monthStart);
    const endStr = fmtLocalDateTime(monthEnd);

    const revenueResult = await db.select({
      total: sql<number>`COALESCE(SUM(total), 0)`
    }).from(orders).where(and(
      eq(orders.establishmentId, establishmentId),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${startStr}`,
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) <= ${endStr}`,
      eq(orders.status, "completed")
    ));

    const expensesResult = await db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(expenses).where(and(
      eq(expenses.establishmentId, establishmentId),
      sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) >= ${startStr}`,
      sql`CONVERT_TZ(${expenses.date}, '+00:00', ${tz}) <= ${endStr}`
    ));

    months.push({
      label: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
      receitas: Number(revenueResult[0]?.total ?? 0),
      despesas: Number(expensesResult[0]?.total ?? 0),
    });
  }

  return { months };
}

// --- Faturamento por Canal ---

export async function getRevenueByChannel(
  establishmentId: number,
  period: 'today' | 'week' | 'month' | 'custom' = 'today',
  customStart?: string,
  customEnd?: string
) {
  const db = await getDb();
  if (!db) return { channels: [], total: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;

  if (period === 'custom' && customStart && customEnd) {
    periodStart = new Date(customStart);
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);
  const nowStr = period === 'custom' && customEnd ? `${customEnd} 23:59:59` : undefined;

  // Query revenue grouped by source and deliveryType
  const result = await db.select({
    source: orders.source,
    deliveryType: orders.deliveryType,
    total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`,
      ...(nowStr ? [sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) <= ${nowStr}`] : []),
      eq(orders.status, "completed")
    ))
    .groupBy(orders.source, orders.deliveryType);

  // Map to channels: PDV, Menu público, Mesas
  // source=pdv → PDV
  // deliveryType=dine_in → Mesas (when source is not pdv)
  // everything else (internal delivery/pickup) → Menu público
  const channelMap: Record<string, { total: number; count: number }> = {
    pdv: { total: 0, count: 0 },
    menu: { total: 0, count: 0 },
    mesas: { total: 0, count: 0 },
  };

  for (const row of result) {
    const total = Number(row.total);
    const count = Number(row.count);

    if (row.source === 'pdv') {
      channelMap.pdv.total += total;
      channelMap.pdv.count += count;
    } else if (row.deliveryType === 'dine_in') {
      channelMap.mesas.total += total;
      channelMap.mesas.count += count;
    } else {
      channelMap.menu.total += total;
      channelMap.menu.count += count;
    }
  }

  // --- Previous period comparison ---
  let prevStart: Date;
  let prevEnd: Date;
  const periodDuration = localNow.getTime() - periodStart.getTime();

  if (period === 'custom' && customStart && customEnd) {
    const csDate = new Date(customStart);
    const ceDate = new Date(customEnd);
    const dur = ceDate.getTime() - csDate.getTime();
    prevEnd = new Date(csDate.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - dur);
  } else {
    prevEnd = new Date(periodStart.getTime() - 1);
    prevStart = new Date(periodStart.getTime() - periodDuration);
  }

  const prevStartStr = fmtLocalDateTime(prevStart);
  const prevEndStr = fmtLocalDateTime(prevEnd);

  const prevResult = await db.select({
    source: orders.source,
    deliveryType: orders.deliveryType,
    total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${prevStartStr}`,
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) <= ${prevEndStr}`,
      eq(orders.status, "completed")
    ))
    .groupBy(orders.source, orders.deliveryType);

  const prevMap: Record<string, { total: number; count: number }> = {
    pdv: { total: 0, count: 0 },
    menu: { total: 0, count: 0 },
    mesas: { total: 0, count: 0 },
  };

  for (const row of prevResult) {
    const total = Number(row.total);
    const count = Number(row.count);
    if (row.source === 'pdv') {
      prevMap.pdv.total += total;
      prevMap.pdv.count += count;
    } else if (row.deliveryType === 'dine_in') {
      prevMap.mesas.total += total;
      prevMap.mesas.count += count;
    } else {
      prevMap.menu.total += total;
      prevMap.menu.count += count;
    }
  }

  function calcVariation(current: number, previous: number): number | null {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  }

  const grandTotal = channelMap.pdv.total + channelMap.menu.total + channelMap.mesas.total;

  const channels = [
    {
      id: 'pdv',
      name: 'PDV',
      color: '#3b82f6',
      total: channelMap.pdv.total,
      count: channelMap.pdv.count,
      percent: grandTotal > 0 ? Math.round((channelMap.pdv.total / grandTotal) * 100) : 0,
      prevTotal: prevMap.pdv.total,
      prevCount: prevMap.pdv.count,
      variation: calcVariation(channelMap.pdv.total, prevMap.pdv.total),
    },
    {
      id: 'menu',
      name: 'Menu público',
      color: '#22c55e',
      total: channelMap.menu.total,
      count: channelMap.menu.count,
      percent: grandTotal > 0 ? Math.round((channelMap.menu.total / grandTotal) * 100) : 0,
      prevTotal: prevMap.menu.total,
      prevCount: prevMap.menu.count,
      variation: calcVariation(channelMap.menu.total, prevMap.menu.total),
    },
    {
      id: 'mesas',
      name: 'Mesas',
      color: '#f97316',
      total: channelMap.mesas.total,
      count: channelMap.mesas.count,
      percent: grandTotal > 0 ? Math.round((channelMap.mesas.total / grandTotal) * 100) : 0,
      prevTotal: prevMap.mesas.total,
      prevCount: prevMap.mesas.count,
      variation: calcVariation(channelMap.mesas.total, prevMap.mesas.total),
    },
  ];

  return { channels, total: grandTotal };
}


// --- Faturamento por Forma de Pagamento ---

export async function getRevenueByPaymentMethod(
  establishmentId: number,
  period: 'today' | 'week' | 'month' | 'custom' = 'today',
  customStart?: string,
  customEnd?: string
) {
  const db = await getDb();
  if (!db) return { methods: [], total: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;

  if (period === 'custom' && customStart && customEnd) {
    periodStart = new Date(customStart);
  } else if (period === 'today') {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);
  const nowStr = period === 'custom' && customEnd ? `${customEnd} 23:59:59` : undefined;

  const result = await db.select({
    paymentMethod: orders.paymentMethod,
    total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${periodStartStr}`,
      ...(nowStr ? [sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) <= ${nowStr}`] : []),
      eq(orders.status, "completed")
    ))
    .groupBy(orders.paymentMethod);

  // Map payment methods: pix, card (card + card_online), cash, boleto
  const methodMap: Record<string, { total: number; count: number }> = {
    pix: { total: 0, count: 0 },
    card: { total: 0, count: 0 },
    cash: { total: 0, count: 0 },
  };

  for (const row of result) {
    const total = Number(row.total);
    const count = Number(row.count);

    if (row.paymentMethod === 'pix') {
      methodMap.pix.total += total;
      methodMap.pix.count += count;
    } else if (row.paymentMethod === 'card' || row.paymentMethod === 'card_online') {
      methodMap.card.total += total;
      methodMap.card.count += count;
    } else if (row.paymentMethod === 'cash') {
      methodMap.cash.total += total;
      methodMap.cash.count += count;
    } else {
      // boleto or unknown → group into cash
      methodMap.cash.total += total;
      methodMap.cash.count += count;
    }
  }

  const grandTotal = methodMap.pix.total + methodMap.card.total + methodMap.cash.total;

  const methods = [
    {
      id: 'pix',
      name: 'Pix',
      color: '#8b5cf6',
      total: methodMap.pix.total,
      count: methodMap.pix.count,
      percent: grandTotal > 0 ? Math.round((methodMap.pix.total / grandTotal) * 100) : 0,
    },
    {
      id: 'card',
      name: 'Cartão',
      color: '#3b82f6',
      total: methodMap.card.total,
      count: methodMap.card.count,
      percent: grandTotal > 0 ? Math.round((methodMap.card.total / grandTotal) * 100) : 0,
    },
    {
      id: 'cash',
      name: 'Dinheiro',
      color: '#22c55e',
      total: methodMap.cash.total,
      count: methodMap.cash.count,
      percent: grandTotal > 0 ? Math.round((methodMap.cash.total / grandTotal) * 100) : 0,
    },
  ];

  return { methods, total: grandTotal };
}

// --- Daily breakdown by payment method for sparklines ---

export async function getPaymentMethodDailyBreakdown(
  establishmentId: number,
  period: 'today' | 'week' | 'month' | 'custom' = 'today',
  customStart?: string,
  customEnd?: string
) {
  const db = await getDb();
  if (!db) return { pix: [], card: [], cash: [], labels: [] };

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  let periodStart: Date;
  let periodEnd: Date = localNow;

  if (period === 'custom' && customStart && customEnd) {
    periodStart = new Date(customStart);
    periodEnd = new Date(customEnd);
  } else if (period === 'today') {
    // For today, show hourly breakdown (last 12 hours)
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  } else if (period === 'week') {
    const currentDay = localNow.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysFromMonday);
  } else {
    periodStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
  }

  const periodStartStr = fmtLocalDateTime(periodStart);
  const nowStr = period === 'custom' && customEnd ? `${customEnd} 23:59:59` : undefined;
  // Validar timezone para evitar injection
  const validTz = /^[A-Za-z_\/+-][A-Za-z0-9_\/+:-]*$/.test(tz) ? tz : '+00:00';

  // Construir condições parametrizadas
  const conditions: ReturnType<typeof sql>[] = [
    sql`establishmentId = ${establishmentId}`,
    sql`CONVERT_TZ(createdAt, '+00:00', ${validTz}) >= ${periodStartStr}`,
    sql`status = 'completed'`,
  ];
  if (nowStr) {
    conditions.push(sql`CONVERT_TZ(createdAt, '+00:00', ${validTz}) <= ${nowStr}`);
  }
  const whereClause = sql.join(conditions, sql` AND `);

  const result: any[] = await db.execute(
    sql`SELECT DATE(CONVERT_TZ(createdAt, '+00:00', ${validTz})) as day, paymentMethod, COALESCE(SUM(total), 0) as total FROM orders WHERE ${whereClause} GROUP BY day, paymentMethod ORDER BY day`
  );

  // Build date range
  const dates: string[] = [];
  const cursor = new Date(periodStart);
  while (cursor <= periodEnd) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  // Initialize daily data
  const pixDaily: number[] = new Array(dates.length).fill(0);
  const cardDaily: number[] = new Array(dates.length).fill(0);
  const cashDaily: number[] = new Array(dates.length).fill(0);

  for (const row of result) {
    const dayStr = String(row.day);
    const idx = dates.indexOf(dayStr);
    if (idx === -1) continue;
    const total = Number(row.total);

    if (row.paymentMethod === 'pix') {
      pixDaily[idx] += total;
    } else if (row.paymentMethod === 'card' || row.paymentMethod === 'card_online') {
      cardDaily[idx] += total;
    } else {
      cashDaily[idx] += total;
    }
  }

  // Short labels (day number or day name)
  const labels = dates.map(d => {
    const dt = new Date(d + 'T12:00:00');
    return String(dt.getDate());
  });

  return { pix: pixDaily, card: cardDaily, cash: cashDaily, labels };
}


// --- Receitas Diárias (faturamento consolidado por dia) ---
export async function getDailyRevenue(establishmentId: number, filters?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  source?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const tz = await getEstablishmentTimezone(establishmentId);
  // Validar timezone para evitar injection (apenas formatos como +03:00, -05:00, America/Sao_Paulo)
  const validTz = /^[A-Za-z_\/+-][A-Za-z0-9_\/+:-]*$/.test(tz) ? tz : '+00:00';

  // Construir condições parametrizadas
  const conditions: ReturnType<typeof sql>[] = [
    sql`o.establishmentId = ${establishmentId}`,
    sql`o.status = 'completed'`,
  ];

  if (filters?.startDate) {
    conditions.push(sql`DATE(CONVERT_TZ(o.createdAt, '+00:00', ${validTz})) >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`DATE(CONVERT_TZ(o.createdAt, '+00:00', ${validTz})) <= ${filters.endDate}`);
  }
  if (filters?.source && filters.source !== 'all') {
    conditions.push(sql`o.source = ${filters.source}`);
  }

  const whereClause = sql.join(conditions, sql` AND `);
  const limitVal = filters?.limit ?? 50;
  const offsetVal = filters?.offset ?? 0;

  const [rows, countRows] = await Promise.all([
    db.execute(
      sql`SELECT
        DATE(CONVERT_TZ(o.createdAt, '+00:00', ${validTz})) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(o.total), 0) as total,
        GROUP_CONCAT(DISTINCT o.source) as sources,
        GROUP_CONCAT(DISTINCT o.paymentMethod) as paymentMethods
      FROM orders o
      WHERE ${whereClause}
      GROUP BY DATE(CONVERT_TZ(o.createdAt, '+00:00', ${validTz}))
      ORDER BY date DESC
      LIMIT ${limitVal}
      OFFSET ${offsetVal}`
    ),
    db.execute(
      sql`SELECT COUNT(DISTINCT DATE(CONVERT_TZ(o.createdAt, '+00:00', ${validTz}))) as total
      FROM orders o
      WHERE ${whereClause}`
    ),
  ]);

  const items = (Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows).map((r: any) => ({
    date: String(r.date),
    orderCount: Number(r.orderCount),
    total: Number(r.total),
    sources: String(r.sources || ''),
    paymentMethods: String(r.paymentMethods || ''),
  }));

  const total = Number((Array.isArray(countRows) && Array.isArray(countRows[0]) ? countRows[0] : countRows)[0]?.total ?? 0);

  return { items, total };
}

export async function getUpcomingRecurringExpenses(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all active recurring expenses
  const result = await db.select({
    id: recurringExpenses.id,
    type: recurringExpenses.type,
    description: recurringExpenses.description,
    categoryId: recurringExpenses.categoryId,
    categoryName: expenseCategories.name,
    categoryColor: expenseCategories.color,
    amount: recurringExpenses.amount,
    paymentMethod: recurringExpenses.paymentMethod,
    frequency: recurringExpenses.frequency,
    executionDay: recurringExpenses.executionDay,
    executionMonth: recurringExpenses.executionMonth,
    startDate: recurringExpenses.startDate,
    endDate: recurringExpenses.endDate,
    active: recurringExpenses.active,
  })
    .from(recurringExpenses)
    .leftJoin(expenseCategories, eq(recurringExpenses.categoryId, expenseCategories.id))
    .where(
      and(
        eq(recurringExpenses.establishmentId, establishmentId),
        eq(recurringExpenses.active, true),
      )
    );

  // Get all existing expenses for cross-referencing paid status
  const allExpenses = await db.select({
    id: expenses.id,
    description: expenses.description,
    amount: expenses.amount,
    date: expenses.date,
    notes: expenses.notes,
  })
    .from(expenses)
    .where(eq(expenses.establishmentId, establishmentId));

  // Generate next occurrences for each recurring expense
  const now = new Date();
  const occurrences: Array<{
    recurringId: number;
    description: string;
    categoryId: number | null;
    categoryName: string | null;
    categoryColor: string | null;
    amount: number;
    frequency: string;
    paymentMethod: string;
    dueDate: string; // ISO date string YYYY-MM-DD
    type: string;
    isPaid: boolean;
    paidExpenseId: number | null;
  }> = [];

  for (const item of result) {
    const amount = Number(item.amount);
    const nextDates = generateNextOccurrences(item, now, 6);

    for (const date of nextDates) {
      // Check if this occurrence was already paid
      const paidExpense = allExpenses.find(exp => {
        const expNotes = exp.notes || '';
        // Match by notes reference to recurring ID and dueDate stored in notes
        if (!expNotes.includes(`recorrência #${item.id}`)) return false;
        // Check if the dueDate is stored in the notes
        if (expNotes.includes(`venc:${date}`)) return true;
        // Fallback: compare dates with 1-day tolerance for timezone issues
        const expDate = new Date(exp.date);
        const occDate = new Date(date);
        const diffMs = Math.abs(expDate.getTime() - occDate.getTime());
        return diffMs < 2 * 24 * 60 * 60 * 1000; // within 2 days
      });
      occurrences.push({
        recurringId: item.id,
        description: item.description,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryColor: item.categoryColor,
        amount,
        frequency: item.frequency,
        paymentMethod: item.paymentMethod,
        dueDate: date,
        type: item.type,
        isPaid: !!paidExpense,
        paidExpenseId: paidExpense?.id ?? null,
      });
    }
  }

  // Also include one-time expenses with future dates OR today's paid one-time expenses
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureExpensesResult = await db.select({
    id: expenses.id,
    description: expenses.description,
    categoryId: expenses.categoryId,
    categoryName: expenseCategories.name,
    categoryColor: expenseCategories.color,
    amount: expenses.amount,
    paymentMethod: expenses.paymentMethod,
    date: expenses.date,
    notes: expenses.notes,
  })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(
      and(
        eq(expenses.establishmentId, establishmentId),
        or(
          gt(expenses.date, today),
          // Include today's expenses that were marked as paid (have the paid marker in notes)
          and(
            gte(expenses.date, today),
            lt(expenses.date, tomorrow),
            like(expenses.notes, '%Pago via lan%amento futuro (avulso%'),
          ),
        ),
      )
    );

  for (const exp of futureExpensesResult) {
    const expDate = new Date(exp.date);
    const isPaidOneTime = !!(exp.notes && exp.notes.includes('Pago via lan') && exp.notes.includes('amento futuro (avulso'));
    // Extract original due date from notes if paid
    let dueDate = formatDateISO(expDate);
    if (isPaidOneTime && exp.notes) {
      const vencMatch = exp.notes.match(/venc:(\d{4}-\d{2}-\d{2})/);
      if (vencMatch) dueDate = vencMatch[1];
    }
    occurrences.push({
      recurringId: exp.id,
      description: exp.description,
      categoryId: exp.categoryId,
      categoryName: exp.categoryName,
      categoryColor: exp.categoryColor,
      amount: Number(exp.amount),
      frequency: 'once',
      paymentMethod: exp.paymentMethod || 'cash',
      dueDate,
      type: 'expense',
      isPaid: isPaidOneTime,
      paidExpenseId: isPaidOneTime ? exp.id : null,
    });
  }

  // Sort by date ascending (closest first)
  occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return occurrences;
}

function generateNextOccurrences(
  item: {
    frequency: string;
    executionDay: number;
    executionMonth: number | null;
    startDate: Date;
    endDate: Date | null;
  },
  fromDate: Date,
  count: number
): string[] {
  const dates: string[] = [];
  const startDate = new Date(item.startDate);
  const endDate = item.endDate ? new Date(item.endDate) : null;

  if (item.frequency === "monthly") {
    // Generate monthly occurrences
    let year = fromDate.getFullYear();
    let month = fromDate.getMonth(); // 0-indexed

    // Start from current month - check if this month's date has passed
    for (let i = 0; i < count + 12 && dates.length < count; i++) {
      const day = Math.min(item.executionDay, daysInMonth(year, month));
      const candidate = new Date(year, month, day);
      const candidateStr = formatDateISO(candidate);

      // Only include if >= start date and not past end date
      if (candidate >= startDate && (!endDate || candidate <= endDate)) {
        // Include dates from today - 30 days (to show recent "atrasado" ones too)
        const thirtyDaysAgo = new Date(fromDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (candidate >= thirtyDaysAgo) {
          dates.push(candidateStr);
        }
      }

      // Next month
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  } else if (item.frequency === "weekly") {
    // Generate weekly occurrences
    const targetDay = item.executionDay; // 0=Sunday, 6=Saturday
    let current = new Date(fromDate);
    // Go back to find the most recent target day
    current.setDate(current.getDate() - 7);

    for (let i = 0; i < count + 10 && dates.length < count; i++) {
      const diff = (targetDay - current.getDay() + 7) % 7;
      const candidate = new Date(current);
      candidate.setDate(candidate.getDate() + (diff === 0 ? 0 : diff));

      if (candidate >= startDate && (!endDate || candidate <= endDate)) {
        const thirtyDaysAgo = new Date(fromDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
        if (candidate >= thirtyDaysAgo) {
          dates.push(formatDateISO(candidate));
        }
      }

      current.setDate(current.getDate() + 7);
    }
  } else if (item.frequency === "yearly") {
    // Generate yearly occurrences
    const targetMonth = (item.executionMonth ?? 1) - 1; // Convert to 0-indexed
    let year = fromDate.getFullYear() - 1;

    for (let i = 0; i < count + 5 && dates.length < count; i++) {
      const day = Math.min(item.executionDay, daysInMonth(year, targetMonth));
      const candidate = new Date(year, targetMonth, day);

      if (candidate >= startDate && (!endDate || candidate <= endDate)) {
        const oneYearAgo = new Date(fromDate);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (candidate >= oneYearAgo) {
          dates.push(formatDateISO(candidate));
        }
      }

      year++;
    }
  }

  return dates;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


// --- Metas Financeiras Personalizadas ---

export async function listFinancialGoals(establishmentId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(financialGoals)
    .where(and(
      eq(financialGoals.establishmentId, establishmentId),
      eq(financialGoals.month, month),
      eq(financialGoals.year, year)
    ))
    .orderBy(asc(financialGoals.sortOrder), asc(financialGoals.id));
}

export async function createFinancialGoal(data: {
  establishmentId: number;
  month: number;
  year: number;
  name: string;
  targetValue: string;
  type?: "profit" | "revenue" | "savings" | "custom";
}) {
  const db = await getDb();
  if (!db) return null;

  // Get the max sortOrder for this establishment/month/year
  const existing = await db.select({ maxSort: sql<number>`COALESCE(MAX(${financialGoals.sortOrder}), -1)` })
    .from(financialGoals)
    .where(and(
      eq(financialGoals.establishmentId, data.establishmentId),
      eq(financialGoals.month, data.month),
      eq(financialGoals.year, data.year)
    ));

  const nextSort = (existing[0]?.maxSort ?? -1) + 1;

  const result = await db.insert(financialGoals).values({
    establishmentId: data.establishmentId,
    month: data.month,
    year: data.year,
    name: data.name,
    targetValue: data.targetValue,
    type: data.type || "custom",
    sortOrder: nextSort,
  });

  return result[0].insertId;
}

export async function updateFinancialGoal(id: number, establishmentId: number, data: {
  name?: string;
  targetValue?: string;
  type?: "profit" | "revenue" | "savings" | "custom";
}) {
  const db = await getDb();
  if (!db) return false;

  await db.update(financialGoals)
    .set(data)
    .where(and(
      eq(financialGoals.id, id),
      eq(financialGoals.establishmentId, establishmentId)
    ));
  return true;
}

export async function deleteFinancialGoal(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(financialGoals)
    .where(and(
      eq(financialGoals.id, id),
      eq(financialGoals.establishmentId, establishmentId)
    ));
  return true;
}


// ============ CASHBACK ============

/**
 * Buscar ou criar saldo de cashback para um cliente em um estabelecimento
 */
export async function getCashbackBalance(establishmentId: number, customerPhone: string): Promise<CashbackBalance | null> {
  const db = await getDb();
  if (!db) return null;
  const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
  const result = await db.select().from(cashbackBalances)
    .where(and(
      eq(cashbackBalances.establishmentId, establishmentId),
      or(
        eq(cashbackBalances.customerPhone, normalizedPhone),
        eq(cashbackBalances.customerPhone, customerPhone)
      )
    ))
    .limit(1);
  return result[0] || null;
}

/**
 * Criar registro de saldo de cashback
 */
export async function createCashbackBalance(data: {
  establishmentId: number;
  customerPhone: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalizedPhone = data.customerPhone.replace(/[^0-9]/g, '');
  const result = await db.insert(cashbackBalances).values({
    establishmentId: data.establishmentId,
    customerPhone: normalizedPhone,
    balance: "0",
    totalEarned: "0",
    totalUsed: "0",
  });
  return result[0].insertId;
}

/**
 * Registrar crédito de cashback (geração após pedido concluído)
 */
export async function creditCashback(data: {
  establishmentId: number;
  customerPhone: string;
  amount: string;
  orderId: number;
  orderNumber: string;
}): Promise<CashbackTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalizedPhone = data.customerPhone.replace(/[^0-9]/g, '');

  // Buscar ou criar saldo
  let balanceRecord = await getCashbackBalance(data.establishmentId, normalizedPhone);
  if (!balanceRecord) {
    await createCashbackBalance({ establishmentId: data.establishmentId, customerPhone: normalizedPhone });
    balanceRecord = await getCashbackBalance(data.establishmentId, normalizedPhone);
  }
  if (!balanceRecord) throw new Error("Failed to create cashback balance");

  const currentBalance = Number(balanceRecord.balance);
  const creditAmount = Number(data.amount);
  const newBalance = currentBalance + creditAmount;

  // Registrar transação
  const txResult = await db.insert(cashbackTransactions).values({
    establishmentId: data.establishmentId,
    customerPhone: normalizedPhone,
    type: "credit",
    amount: data.amount,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    description: `Cashback do pedido ${data.orderNumber}`,
    balanceBefore: currentBalance.toFixed(2),
    balanceAfter: newBalance.toFixed(2),
  });

  // Atualizar saldo
  await db.update(cashbackBalances)
    .set({
      balance: newBalance.toFixed(2),
      totalEarned: sql`${cashbackBalances.totalEarned} + ${creditAmount.toFixed(2)}`,
    })
    .where(eq(cashbackBalances.id, balanceRecord.id));

  // Buscar transação criada
  const tx = await db.select().from(cashbackTransactions)
    .where(eq(cashbackTransactions.id, txResult[0].insertId))
    .limit(1);
  return tx[0];
}

/**
 * Registrar débito de cashback (uso em pedido)
 */
export async function debitCashback(data: {
  establishmentId: number;
  customerPhone: string;
  amount: string;
  orderId?: number;
  orderNumber?: string;
}): Promise<CashbackTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalizedPhone = data.customerPhone.replace(/[^0-9]/g, '');

  // Buscar saldo
  const balanceRecord = await getCashbackBalance(data.establishmentId, normalizedPhone);
  if (!balanceRecord) throw new Error("Cashback balance not found");

  const currentBalance = Number(balanceRecord.balance);
  const debitAmount = Number(data.amount);

  if (debitAmount > currentBalance) {
    throw new Error("Saldo de cashback insuficiente");
  }

  const newBalance = currentBalance - debitAmount;

  // Registrar transação
  const txResult = await db.insert(cashbackTransactions).values({
    establishmentId: data.establishmentId,
    customerPhone: normalizedPhone,
    type: "debit",
    amount: data.amount,
    orderId: data.orderId || null,
    orderNumber: data.orderNumber || null,
    description: data.orderNumber ? `Cashback utilizado no pedido ${data.orderNumber}` : "Cashback utilizado",
    balanceBefore: currentBalance.toFixed(2),
    balanceAfter: newBalance.toFixed(2),
  });

  // Atualizar saldo
  await db.update(cashbackBalances)
    .set({
      balance: newBalance.toFixed(2),
      totalUsed: sql`${cashbackBalances.totalUsed} + ${debitAmount.toFixed(2)}`,
    })
    .where(eq(cashbackBalances.id, balanceRecord.id));

  // Buscar transação criada
  const tx = await db.select().from(cashbackTransactions)
    .where(eq(cashbackTransactions.id, txResult[0].insertId))
    .limit(1);
  return tx[0];
}

/**
 * Buscar histórico de transações de cashback de um cliente
 */
export async function getCashbackTransactions(establishmentId: number, customerPhone: string, limit: number = 50): Promise<CashbackTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
  return db.select().from(cashbackTransactions)
    .where(and(
      eq(cashbackTransactions.establishmentId, establishmentId),
      or(
        eq(cashbackTransactions.customerPhone, normalizedPhone),
        eq(cashbackTransactions.customerPhone, customerPhone)
      )
    ))
    .orderBy(desc(cashbackTransactions.createdAt))
    .limit(limit);
}

/**
 * Calcular cashback para um pedido baseado nas configurações do estabelecimento
 */
export async function calculateCashbackForOrder(
  establishmentId: number,
  items: Array<{ productId: number; totalPrice: string }>,
): Promise<{ cashbackAmount: number; eligibleTotal: number }> {
  const db = await getDb();
  if (!db) return { cashbackAmount: 0, eligibleTotal: 0 };

  // Buscar configurações do estabelecimento
  const est = await db.select({
    cashbackEnabled: establishments.cashbackEnabled,
    cashbackPercent: establishments.cashbackPercent,
    cashbackApplyMode: establishments.cashbackApplyMode,
    cashbackCategoryIds: establishments.cashbackCategoryIds,
    rewardProgramType: establishments.rewardProgramType,
  }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);

  if (!est[0] || !est[0].cashbackEnabled || est[0].rewardProgramType !== 'cashback') {
    return { cashbackAmount: 0, eligibleTotal: 0 };
  }

  const percent = Number(est[0].cashbackPercent) || 0;
  if (percent <= 0) return { cashbackAmount: 0, eligibleTotal: 0 };

  let eligibleTotal = 0;

  if (est[0].cashbackApplyMode === 'all') {
    // Todos os produtos
    eligibleTotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  } else {
    // Apenas categorias específicas
    const allowedCategoryIds = est[0].cashbackCategoryIds || [];
    if (allowedCategoryIds.length === 0) {
      return { cashbackAmount: 0, eligibleTotal: 0 };
    }

    // Buscar categorias dos produtos
    for (const item of items) {
      const product = await db.select({ categoryId: products.categoryId })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product[0] && product[0].categoryId && allowedCategoryIds.includes(product[0].categoryId)) {
        eligibleTotal += Number(item.totalPrice);
      }
    }
  }

  const cashbackAmount = Math.round(eligibleTotal * percent) / 100;
  return { cashbackAmount, eligibleTotal };
}

/**
 * Processar cashback após pedido concluído (chamado quando status muda para completed)
 */
export async function processCashbackForCompletedOrder(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar pedido
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order[0]) return;

    const orderData = order[0];

    // Verificar se cashback está ativo
    const est = await db.select({
      cashbackEnabled: establishments.cashbackEnabled,
      cashbackPercent: establishments.cashbackPercent,
      cashbackApplyMode: establishments.cashbackApplyMode,
      cashbackCategoryIds: establishments.cashbackCategoryIds,
      rewardProgramType: establishments.rewardProgramType,
    }).from(establishments).where(eq(establishments.id, orderData.establishmentId)).limit(1);

    if (!est[0] || !est[0].cashbackEnabled || est[0].rewardProgramType !== 'cashback') return;

    // Verificar se já gerou cashback para este pedido
    const existingTx = await db.select().from(cashbackTransactions)
      .where(and(
        eq(cashbackTransactions.orderId, orderId),
        eq(cashbackTransactions.type, "credit")
      ))
      .limit(1);

    if (existingTx[0]) {
      logger.info(`[Cashback] Cashback já gerado para pedido ${orderId}`);
      return;
    }

    // Buscar itens do pedido
    const items = await db.select().from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const { cashbackAmount } = await calculateCashbackForOrder(
      orderData.establishmentId,
      items.map(i => ({ productId: i.productId, totalPrice: i.totalPrice }))
    );

    if (cashbackAmount <= 0) return;

    // Creditar cashback
    const customerPhone = orderData.customerPhone;
    if (!customerPhone) return;

    await creditCashback({
      establishmentId: orderData.establishmentId,
      customerPhone,
      amount: cashbackAmount.toFixed(2),
      orderId: orderId,
      orderNumber: orderData.orderNumber,
    });

    logger.info(`[Cashback] Creditado R$ ${cashbackAmount.toFixed(2)} para ${customerPhone} (pedido ${orderData.orderNumber})`);
  } catch (error) {
    logger.error('[Cashback] Erro ao processar cashback:', error);
  }
}

/**
 * Busca a transação de crédito de cashback gerada para um pedido específico
 */
export async function getCashbackTransactionByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(cashbackTransactions)
    .where(and(
      eq(cashbackTransactions.orderId, orderId),
      eq(cashbackTransactions.type, "credit")
    ))
    .limit(1);

  return result[0] || null;
}


// ============ PRINT LOGS ============

export async function createPrintLog(data: {
  establishmentId: number;
  orderId: number;
  orderNumber: string;
  trigger: "new_order" | "accept" | "manual" | "reprint";
  method: "sse" | "pos_driver" | "socket_tcp" | "direct";
  status: "sent" | "delivered" | "failed";
  printerConnections?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<number | null> {
  // IMPORTANTE: Esta função NUNCA deve lançar exceção.
  // Falhas de logging não devem interferir no fluxo de impressão.
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.insert(printLogs).values({
      establishmentId: data.establishmentId,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      trigger: data.trigger,
      method: data.method,
      status: data.status,
      printerConnections: data.printerConnections || 0,
      errorMessage: data.errorMessage || null,
      metadata: data.metadata || null,
    });

    logger.info(`[PrintLog] Registrado: pedido=${data.orderNumber} trigger=${data.trigger} method=${data.method} status=${data.status} conns=${data.printerConnections || 0}`);
    return result[0].insertId;
  } catch (error) {
    // Silenciar completamente - logging nunca deve quebrar o fluxo principal
    logger.error("[PrintLog] Erro ao registrar log (ignorado):", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function getPrintLogs(establishmentId: number, options?: {
  limit?: number;
  offset?: number;
  orderId?: number;
  orderNumber?: string;
  trigger?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ logs: PrintLog[]; total: number }> {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const conditions = [eq(printLogs.establishmentId, establishmentId)];

  if (options?.orderId) {
    conditions.push(eq(printLogs.orderId, options.orderId));
  }
  if (options?.orderNumber) {
    conditions.push(like(printLogs.orderNumber, `%${escapeLike(options.orderNumber)}%`));
  }
  if (options?.trigger) {
    conditions.push(eq(printLogs.trigger, options.trigger as any));
  }
  if (options?.status) {
    conditions.push(eq(printLogs.status, options.status as any));
  }
  if (options?.startDate) {
    conditions.push(gte(printLogs.createdAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(printLogs.createdAt, options.endDate));
  }

  const whereClause = and(...conditions);

  const [logs, countResult] = await Promise.all([
    db.select()
      .from(printLogs)
      .where(whereClause)
      .orderBy(desc(printLogs.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(printLogs)
      .where(whereClause),
  ]);

  return {
    logs,
    total: countResult[0]?.count || 0,
  };
}

export async function getPrintLogStats(establishmentId: number, days: number = 7): Promise<{
  totalPrints: number;
  successCount: number;
  failedCount: number;
  byTrigger: Record<string, number>;
  byMethod: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) return { totalPrints: 0, successCount: 0, failedCount: 0, byTrigger: {}, byMethod: {} };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await db.select()
    .from(printLogs)
    .where(and(
      eq(printLogs.establishmentId, establishmentId),
      gte(printLogs.createdAt, startDate)
    ));

  const byTrigger: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  let successCount = 0;
  let failedCount = 0;

  for (const log of logs) {
    byTrigger[log.trigger] = (byTrigger[log.trigger] || 0) + 1;
    byMethod[log.method] = (byMethod[log.method] || 0) + 1;
    if (log.status === "sent" || log.status === "delivered") successCount++;
    if (log.status === "failed") failedCount++;
  }

  return {
    totalPrints: logs.length,
    successCount,
    failedCount,
    byTrigger,
    byMethod,
  };
}

export async function clearPrintLogs(establishmentId: number, olderThanDays?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [eq(printLogs.establishmentId, establishmentId)];

  if (olderThanDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    conditions.push(lte(printLogs.createdAt, cutoffDate));
  }

  const result = await db.delete(printLogs).where(and(...conditions));
  return result[0].affectedRows || 0;
}


// ============================================================
// FEEDBACK
// ============================================================

export async function createFeedback(data: InsertFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(feedbacks).values(data);
  return result[0].insertId;
}

export async function getFeedbacksByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedbacks)
    .where(eq(feedbacks.establishmentId, establishmentId))
    .orderBy(desc(feedbacks.createdAt));
}

export async function getFeedbacksByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedbacks)
    .where(eq(feedbacks.userId, userId))
    .orderBy(desc(feedbacks.createdAt));
}

export async function getAllFeedbacks() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    feedback: feedbacks,
    userName: users.name,
    userEmail: users.email,
    establishmentName: establishments.name,
  })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.userId, users.id))
    .leftJoin(establishments, eq(feedbacks.establishmentId, establishments.id))
    .orderBy(desc(feedbacks.createdAt));
}

export async function updateFeedbackStatus(id: number, status: "new" | "read" | "in_progress" | "resolved" | "closed", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  await db.update(feedbacks).set(updateData).where(eq(feedbacks.id, id));
}

export async function getFeedbackStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, inProgress: 0, resolved: 0 };
  const all = await db.select().from(feedbacks);
  return {
    total: all.length,
    new: all.filter(f => f.status === "new").length,
    inProgress: all.filter(f => f.status === "in_progress").length,
    resolved: all.filter(f => f.status === "resolved" || f.status === "closed").length,
  };
}


// ===== FUNÇÕES DE PROCESSAMENTO EM BACKGROUND (Fire-and-Forget) =====
// Estas funções são executadas em background sem bloquear a resposta ao cliente

/**
 * Processa impressão de pedido em background
 * Não bloqueia a resposta ao cliente
 */
export async function processOrderPrintingInBackground(
  establishmentId: number,
  orderId: number,
  orderNumber: string,
  data: InsertOrder,
  items: InsertOrderItem[]
) {
  try {
    logger.info('[BG:Printing] Iniciando processamento de impressão para pedido:', orderNumber);

    const printerSettingsResult = await getPrinterSettings(establishmentId);
    if (!printerSettingsResult) {
      logger.info('[BG:Printing] Nenhuma configuração de impressora encontrada');
      return;
    }

    // SSE (Mindi Printer app)
    if (printerSettingsResult?.printOnNewOrder) {
      // Buscar impressoras do estabelecimento para montar mapa de roteamento por categoria
      const establishmentPrinters = await getPrintersByEstablishment(establishmentId);
      const printerCategoryMap: Record<string, number[]> = {};
      for (const printer of establishmentPrinters) {
        if (!printer.isActive) continue;
        let catIds: number[] = [];
        if (printer.categoryIds) {
          try {
            catIds = JSON.parse(printer.categoryIds);
          } catch { catIds = []; }
        }
        // catIds vazio = imprime tudo (sem filtro)
        printerCategoryMap[String(printer.id)] = catIds;
      }

      // Buscar categoryId de cada produto para incluir no payload
      const itemsWithCategory = await Promise.all(items.map(async (item) => {
        let categoryId: number | null = null;
        if (item.productId) {
          try {
            const product = await getProductById(item.productId);
            if (product) categoryId = product.categoryId || null;
          } catch { /* ignore */ }
        }
        return {
          productName: item.productName,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          complements: item.complements || null,
          notes: item.notes || null,
          categoryId,
          productId: item.productId || null,
        };
      }));

      notifyPrintOrder(establishmentId, {
        orderId,
        orderNumber,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        customerAddress: data.customerAddress || null,
        deliveryType: data.deliveryType || "delivery",
        paymentMethod: data.paymentMethod || "cash",
        subtotal: data.subtotal || "0",
        deliveryFee: data.deliveryFee || "0",
        discount: data.discount || "0",
        total: data.total,
        notes: data.notes || null,
        changeAmount: data.changeAmount || null,
        items: itemsWithCategory,
        createdAt: new Date(),
        beepOnPrint: (printerSettingsResult as any)?.mindiBeepOnPrint ?? printerSettingsResult?.beepOnPrint ?? false,
        htmlPrintEnabled: (printerSettingsResult as any)?.mindiHtmlPrintEnabled ?? printerSettingsResult?.htmlPrintEnabled ?? true,
        printerCategoryMap,
      });
      logger.info('[BG:Printing] ✅ Evento de impressão SSE enviado para pedido:', orderNumber, 'com roteamento por categoria');
    }

    logger.info('[BG:Printing] ✅ Processamento de impressão concluído para pedido:', orderNumber);
  } catch (error) {
    logger.error('[BG:Printing] ❌ Erro ao processar impressão em background:', error);
  }
}

/**
 * Processa notificação de pedido em background
 * Não bloqueia a resposta ao cliente
 */
export async function processOrderNotificationInBackground(
  establishmentId: number,
  orderId: number,
  orderNumber: string,
  data: InsertOrder,
  items: InsertOrderItem[]
) {
  try {
    logger.info('[BG:Notification] Iniciando processamento de notifica\u00e7\u00e3o para pedido:', orderNumber);

    const establishment = await getEstablishmentById(establishmentId);
    const automaticNotificationsAllowed = hasAutomaticOrderNotifications(establishment?.planType);
    if (!automaticNotificationsAllowed) {
      logger.info('[BG:Notification] Notificações automáticas WhatsApp/Telegram bloqueadas para o plano:', establishment?.planType || 'desconhecido');
    }

    // \u2500\u2500 WhatsApp Notification \u2500\u2500
    const whatsappConfig = await getWhatsappConfig(establishmentId);
    const whatsappReady = automaticNotificationsAllowed && whatsappConfig && whatsappConfig.status === 'connected' && whatsappConfig.instanceToken && data.customerPhone;

    if (!whatsappReady) {
      logger.info('[BG:Notification] WhatsApp n\u00e3o configurado ou desconectado');
    }

    // Preparar info de agendamento
    const schedulingInfo = data.isScheduled && data.scheduledAt ? {
      isScheduled: true,
      scheduledDate: new Date(data.scheduledAt).toLocaleDateString('pt-BR'),
      scheduledTime: new Date(data.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    } : undefined;

    // Enviar notifica\u00e7\u00e3o WhatsApp
    if (whatsappReady && whatsappConfig!.notifyOnNewOrder) {
      try {
        const { sendOrderStatusNotification } = await import('./_core/uazapi');

        logger.info('[BG:Notification] Enviando notificação WhatsApp para:', data.customerPhone);

        const sendResult = await sendOrderStatusNotification(
          whatsappConfig!.instanceToken!,
          data.customerPhone!,
          'new',
          {
            customerName: data.customerName || 'Cliente',
            orderNumber,
            establishmentName: establishment?.name || 'Restaurante',
            template: whatsappConfig.templateNewOrder,
            orderItems: items.map(item => ({
              productName: item.productName,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              complements: item.complements,
              notes: item.notes,
            })),
            orderTotal: data.total,
            deliveryType: data.deliveryType,
            paymentMethod: data.paymentMethod,
            schedulingInfo,
            customerAddress: data.customerAddress,
            changeAmount: data.changeAmount || null,
            deliveryFee: data.deliveryFee || null,
            customerPhone: data.customerPhone || null,
          }
        );

        if (sendResult.success) {
          logger.info('[BG:Notification] ✅ Notificação WhatsApp enviada com sucesso:', orderNumber);

          // Enviar botão PIX nativo se pagamento for PIX e chave estiver cadastrada
          if (data.paymentMethod === 'pix' && establishment?.pixKey) {
            try {
              const { sendPixButton } = await import('./_core/uazapi');
              const pixResult = await sendPixButton(
                whatsappConfig!.instanceToken!,
                data.customerPhone!,
                establishment.pixKey,
                undefined, // auto-detect key type
                establishment.pixHolderName || establishment.name || undefined // merchantName
              );
              if (pixResult.success) {
                logger.info('[BG:Notification] ✅ Botão PIX nativo enviado com sucesso:', orderNumber);
              } else {
                logger.error('[BG:Notification] ❌ FALHA ao enviar botão PIX:', pixResult.message);
              }
            } catch (pixError) {
              logger.error('[BG:Notification] Erro ao enviar botão PIX:', pixError);
            }
          }
        } else {
          logger.error('[BG:Notification] ❌ Erro ao enviar notificação WhatsApp:', (sendResult as any).error ?? sendResult.message);
        }
      } catch (err) {
        logger.error('[BG:Notification] Erro ao processar notificação WhatsApp:', err);
      }
    }

    // ── Telegram Notification (fire-and-forget) ──
    if (automaticNotificationsAllowed) {
      try {
        const telegramConfig = await getTelegramConfig(establishmentId);
        if (telegramConfig?.enabled && telegramConfig?.chatId) {
          const { sendOrderNotificationTelegram } = await import('./telegramNotifier');

          const telegramResult = await sendOrderNotificationTelegram(telegramConfig.chatId, {
            orderNumber,
            customerName: data.customerName || undefined,
            customerPhone: data.customerPhone || undefined,
            deliveryType: data.deliveryType || undefined,
            paymentMethod: data.paymentMethod || undefined,
            total: data.total,
            items: items.map(item => ({
              name: item.productName,
              quantity: item.quantity ?? 1,
              price: item.unitPrice,
              notes: item.notes || undefined,
              complements: (item.complements as Array<{ name: string; price: number; quantity?: number }>) || undefined,
            })),
            address: data.customerAddress || undefined,
            scheduledFor: data.isScheduled && data.scheduledAt
              ? `${new Date(data.scheduledAt).toLocaleDateString('pt-BR')} ${new Date(data.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : undefined,
            notes: data.notes || undefined,
            deliveryFee: data.deliveryFee || undefined,
            changeAmount: data.changeAmount || undefined,
          });

          if (telegramResult.ok) {
            logger.info('[BG:Notification] \u2705 Notifica\u00e7\u00e3o Telegram enviada com sucesso:', orderNumber);
          } else {
            logger.error('[BG:Notification] \u274c Erro ao enviar notifica\u00e7\u00e3o Telegram:', telegramResult.error);
          }
        }
      } catch (telegramErr) {
        logger.error('[BG:Notification] Erro ao processar notifica\u00e7\u00e3o Telegram:', telegramErr);
      }
    }

    logger.info('[BG:Notification] \u2705 Processamento de notifica\u00e7\u00e3o conclu\u00eddo para pedido:', orderNumber);
  } catch (error) {
    logger.error('[BG:Notification] \u274c Erro ao processar notifica\u00e7\u00e3o em background:', error);
  }
}


// ============ PREP TIME ANALYSIS (MODAL) ============

export async function getPrepTimeAnalysis(establishmentId: number, period: 'today' | 'week' | 'month' | 'custom' = 'week', startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return null;

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);

  // Calcular período baseado no filtro
  let daysBack = 7;
  if (period === 'custom' && startDate && endDate) {
    daysBack = Math.round((new Date(endDate + 'T23:59:59').getTime() - new Date(startDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24));
  } else if (period === 'today') daysBack = 1;
  else if (period === 'month') daysBack = 30;

  const periodStart = (period === 'custom' && startDate) ? new Date(startDate + 'T00:00:00') : new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - daysBack);
  const sevenDaysAgoStr = fmtLocalDateTime(periodStart);
  const yesterday = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 1);
  const yesterdayStr = fmtLocalDateTime(yesterday);
  const todayStr = fmtLocalDateTime(new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()));

  // 1. Tempo médio de preparo (acceptedAt → readyAt)
  const avgResult = await db.select({
    avgSeconds: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt}))`,
    totalOrders: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    eq(orders.establishmentId, establishmentId),
    sql`${orders.acceptedAt} IS NOT NULL`,
    sql`${orders.readyAt} IS NOT NULL`,
    sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${sevenDaysAgoStr}`
  ));

  const avgMinutes = Number(avgResult[0]?.totalOrders ?? 0) > 0
    ? Math.round(Number(avgResult[0]?.avgSeconds ?? 0) / 60) : 0;
  const totalOrders = Number(avgResult[0]?.totalOrders ?? 0);

  // 2. Tempo médio de ontem (acceptedAt → readyAt)
  const yesterdayResult = await db.select({
    avgSeconds: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt}))`,
  }).from(orders).where(and(
    eq(orders.establishmentId, establishmentId),
    sql`${orders.acceptedAt} IS NOT NULL`,
    sql`${orders.readyAt} IS NOT NULL`,
    sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${yesterdayStr}`,
    sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) < ${todayStr}`
  ));
  const yesterdayAvgMinutes = Math.round(Number(yesterdayResult[0]?.avgSeconds ?? 0) / 60);

  // 3. Dados por dia (tempo de preparo: acceptedAt → readyAt)
  const dailyResult: any[] = await db.execute(
    sql`SELECT
      DATE(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz})) as day,
      DAYNAME(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz})) as dayName,
      AVG(TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt})) as avgSeconds,
      COUNT(*) as totalOrders
    FROM ${orders}
    WHERE ${orders.establishmentId} = ${establishmentId}
      AND ${orders.acceptedAt} IS NOT NULL
      AND ${orders.readyAt} IS NOT NULL
      AND CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${sevenDaysAgoStr}
    GROUP BY DATE(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz})), DAYNAME(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}))
    ORDER BY day ASC`
  );

  const rows = Array.isArray(dailyResult) ? (Array.isArray(dailyResult[0]) ? dailyResult[0] : dailyResult) : [];
  const dailyData = rows.map((r: any) => ({
    day: String(r.day),
    dayName: String(r.dayName),
    avgMinutes: Number(r.totalOrders) > 0 ? Math.round(Number(r.avgSeconds) / 60) : 0,
    totalOrders: Number(r.totalOrders),
  }));

  // 4. Melhor dia
  const bestDay = dailyData.length > 0
    ? dailyData.reduce((best, d) => d.avgMinutes < best.avgMinutes && d.avgMinutes > 0 ? d : best, dailyData[0])
    : null;

  // 5. Média diária
  const avgDailyOrders = dailyData.length > 0 ? Math.round(totalOrders / dailyData.length) : 0;

  // 6. Pior tempo de preparo (acceptedAt → readyAt)
  const worstResult: any[] = await db.execute(
    sql`SELECT
      ${orders.id}, ${orders.orderNumber},
      TIMESTAMPDIFF(SECOND, ${orders.acceptedAt}, ${orders.readyAt}) as totalSeconds,
      DAYNAME(CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz})) as dayName
    FROM ${orders}
    WHERE ${orders.establishmentId} = ${establishmentId}
      AND ${orders.acceptedAt} IS NOT NULL
      AND ${orders.readyAt} IS NOT NULL
      AND CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${sevenDaysAgoStr}
    ORDER BY totalSeconds DESC LIMIT 1`
  );

  const worstRows = Array.isArray(worstResult) ? (Array.isArray(worstResult[0]) ? worstResult[0] : worstResult) : [];
  const worstOrder = worstRows.length > 0 ? {
    orderNumber: String(worstRows[0].orderNumber),
    minutes: Math.round(Number(worstRows[0].totalSeconds) / 60),
    dayName: String(worstRows[0].dayName),
  } : null;

  // 7. Tempo por etapa: preparo real (acceptedAt→readyAt) e entrega (readyAt→completedAt)
  const prepMinutes = avgMinutes; // Tempo de preparo já é acceptedAt→readyAt
  // Calcular entrega separadamente (readyAt→completedAt)
  const deliveryResult = await db.select({
    avgSeconds: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${orders.readyAt}, ${orders.completedAt}))`,
  }).from(orders).where(and(
    eq(orders.establishmentId, establishmentId),
    sql`${orders.readyAt} IS NOT NULL`,
    sql`${orders.completedAt} IS NOT NULL`,
    sql`CONVERT_TZ(${orders.acceptedAt}, '+00:00', ${tz}) >= ${sevenDaysAgoStr}`
  ));
  const deliveryMinutes = Number(deliveryResult[0]?.avgSeconds ?? 0) > 0
    ? Math.round(Number(deliveryResult[0]?.avgSeconds ?? 0) / 60) : 0;

  // 8. Meta
  const est = await db.select({ prepGoalMinutes: establishments.prepGoalMinutes })
    .from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
  const prepGoal = est[0]?.prepGoalMinutes ?? 30;

  return {
    avgMinutes, totalOrders, yesterdayAvgMinutes,
    diffFromYesterday: yesterdayAvgMinutes > 0 ? avgMinutes - yesterdayAvgMinutes : 0,
    dailyData, bestDay: bestDay ? { dayName: bestDay.dayName, avgMinutes: bestDay.avgMinutes } : null,
    avgDailyOrders, worstOrder, prepMinutes, deliveryMinutes, prepGoal,
  };
}

export async function updatePrepGoal(establishmentId: number, goalMinutes: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(establishments).set({ prepGoalMinutes: goalMinutes }).where(eq(establishments.id, establishmentId));
}


// ============ STORIES ============

export async function createStory(data: {
  establishmentId: number;
  imageUrl: string;
  fileKey: string;
  expiresAt: Date;
  type?: "simple" | "product" | "promo";
  productId?: number | null;
  promoTitle?: string | null;
  promoText?: string | null;
  promoPrice?: string | null;
  promoExpiresAt?: Date | null;
  actionLabel?: string | null;
  priceBadgeStyle?: "circle" | "ribbon" | "top-center" | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stories).values({
    establishmentId: data.establishmentId,
    imageUrl: data.imageUrl,
    fileKey: data.fileKey,
    expiresAt: data.expiresAt,
    type: data.type || "simple",
    productId: data.productId ?? null,
    promoTitle: data.promoTitle ?? null,
    promoText: data.promoText ?? null,
    promoPrice: data.promoPrice ?? null,
    promoExpiresAt: data.promoExpiresAt ?? null,
    actionLabel: data.actionLabel ?? null,
    priceBadgeStyle: data.priceBadgeStyle ?? null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getStoriesByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(stories)
    .where(eq(stories.establishmentId, establishmentId))
    .orderBy(asc(stories.createdAt));
}

export async function getActiveStoriesByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const result = await db.select().from(stories)
    .where(and(
      eq(stories.establishmentId, establishmentId),
      gt(stories.expiresAt, now)
    ))
    .orderBy(asc(stories.createdAt));

  // Filtrar promos cuja validade de promoção já expirou
  return result.filter(s => {
    if (s.type === "promo" && s.promoExpiresAt) {
      return new Date(s.promoExpiresAt).getTime() > now.getTime();
    }
    return true;
  });
}

export async function deleteStory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const story = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
  if (story.length === 0) return null;
  await db.delete(stories).where(eq(stories.id, id));
  return story[0];
}

export async function getStoryById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
  return result[0] || null;
}

export async function countActiveStories(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const result = await db.select({ count: sql<number>`count(*)` }).from(stories)
    .where(and(
      eq(stories.establishmentId, establishmentId),
      gt(stories.expiresAt, now)
    ));
  return Number(result[0]?.count ?? 0);
}

export async function cleanupExpiredStories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const expired = await db.select().from(stories).where(lte(stories.expiresAt, now));
  if (expired.length > 0) {
    await db.delete(stories).where(lte(stories.expiresAt, now));
  }
  return expired;
}

// ============ STORY VIEWS ANALYTICS ============

/**
 * Registar uma view de story (1 por sessão por story)
 */
export async function recordStoryView(storyId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe view desta sessão para este story
  const existing = await db.select({ id: storyViews.id }).from(storyViews)
    .where(and(
      eq(storyViews.storyId, storyId),
      eq(storyViews.sessionId, sessionId)
    ))
    .limit(1);

  if (existing.length > 0) return { alreadyViewed: true };

  await db.insert(storyViews).values({ storyId, sessionId });
  return { alreadyViewed: false };
}

/**
 * Contar views de um story específico
 */
export async function countStoryViews(storyId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select({ count: sql<number>`count(*)` }).from(storyViews)
    .where(eq(storyViews.storyId, storyId));
  return Number(result[0]?.count ?? 0);
}

/**
 * Contar views de todos os stories de um estabelecimento (retorna map storyId -> count)
 */
export async function countViewsByEstablishment(establishmentId: number): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todos os stories do estabelecimento
  const estStories = await db.select({ id: stories.id }).from(stories)
    .where(eq(stories.establishmentId, establishmentId));

  if (estStories.length === 0) return {};

  const storyIds = estStories.map(s => s.id);

  // Contar views agrupadas por storyId
  const result = await db.select({
    storyId: storyViews.storyId,
    count: sql<number>`count(*)`
  }).from(storyViews)
    .where(inArray(storyViews.storyId, storyIds))
    .groupBy(storyViews.storyId);

  const viewsMap: Record<number, number> = {};
  for (const row of result) {
    viewsMap[row.storyId] = Number(row.count);
  }
  return viewsMap;
}

// Retorna apenas os IDs dos stories ativos (leve, para comparação de cache)
export async function getActiveStoryIds(establishmentId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const result = await db.select({ id: stories.id, type: stories.type, promoExpiresAt: stories.promoExpiresAt }).from(stories)
    .where(and(
      eq(stories.establishmentId, establishmentId),
      gt(stories.expiresAt, now)
    ))
    .orderBy(asc(stories.createdAt));
  // Filtrar promos expiradas
  return result
    .filter(s => {
      if (s.type === "promo" && s.promoExpiresAt) {
        return new Date(s.promoExpiresAt).getTime() > now.getTime();
      }
      return true;
    })
    .map(r => r.id);
}

// ============ STORY EVENTS (ANALYTICS DE CONVERSÃO) ============

// Registrar evento de story (click, add_to_cart, order_completed)
export async function recordStoryEvent(data: {
  storyId: number;
  establishmentId: number;
  eventType: "click" | "add_to_cart" | "order_completed";
  productId?: number | null;
  orderId?: number | null;
  orderValue?: string | null;
  sessionId?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(storyEvents).values({
    storyId: data.storyId,
    establishmentId: data.establishmentId,
    eventType: data.eventType,
    productId: data.productId ?? null,
    orderId: data.orderId ?? null,
    orderValue: data.orderValue ?? null,
    sessionId: data.sessionId ?? null,
  });
  return { success: true };
}

// Buscar métricas agregadas por story de um estabelecimento
export async function getStoryAnalytics(establishmentId: number): Promise<{
  storyId: number;
  clicks: number;
  addToCarts: number;
  ordersCompleted: number;
  totalRevenue: number;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todos os stories do estabelecimento (ativos e expirados recentes)
  const storyIds = await db.select({ id: stories.id }).from(stories)
    .where(eq(stories.establishmentId, establishmentId));

  if (storyIds.length === 0) return [];

  const ids = storyIds.map(s => s.id);

  try {
    // Usar placeholders parametrizados para a cláusula IN
    const idPlaceholders = sql.join(ids.map(id => sql`${id}`), sql`, `);
    const rawResult: any[] = await db.execute(
      sql`SELECT storyId, eventType, COUNT(*) as cnt, COALESCE(SUM(orderValue), 0) as totalValue FROM storyEvents WHERE storyId IN (${idPlaceholders}) GROUP BY storyId, eventType`
    ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);

    // Agregar por story
    const metricsMap = new Map<number, { clicks: number; addToCarts: number; ordersCompleted: number; totalRevenue: number }>();

    for (const id of ids) {
      metricsMap.set(id, { clicks: 0, addToCarts: 0, ordersCompleted: 0, totalRevenue: 0 });
    }

    for (const row of rawResult) {
      const m = metricsMap.get(Number(row.storyId));
      if (!m) continue;
      if (row.eventType === "click") m.clicks = Number(row.cnt);
      else if (row.eventType === "add_to_cart") m.addToCarts = Number(row.cnt);
      else if (row.eventType === "order_completed") {
        m.ordersCompleted = Number(row.cnt);
        m.totalRevenue = Number(row.totalValue);
      }
    }

    return Array.from(metricsMap.entries()).map(([storyId, m]) => ({
      storyId,
      ...m,
    }));
  } catch (err) {
    logger.error("[StoryAnalytics] getStoryAnalytics error:", err);
    return ids.map(id => ({ storyId: id, clicks: 0, addToCarts: 0, ordersCompleted: 0, totalRevenue: 0 }));
  }
}

// Buscar vendas geradas por stories nos últimos N dias (para gráfico)
export async function getStorySalesChart(establishmentId: number, days: number = 7): Promise<{
  date: string;
  orders: number;
  revenue: number;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');

  // Preencher dias sem dados (sempre retorna array completo)
  // Usar UTC para evitar duplicatas por timezone
  const chartData: { date: string; orders: number; revenue: number }[] = [];
  const seenDates = new Set<string>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (seenDates.has(dateStr)) continue;
    seenDates.add(dateStr);
    chartData.push({
      date: dateStr,
      orders: 0,
      revenue: 0,
    });
  }

  try {
    // Usar db.execute com SQL raw para evitar problemas com GROUP BY DATE() no TiDB
    const rawResult: any[] = await db.execute(
      sql`SELECT DATE(createdAt) as \`date\`, COUNT(*) as orders, COALESCE(SUM(orderValue), 0) as revenue FROM storyEvents WHERE establishmentId = ${establishmentId} AND eventType = 'order_completed' AND createdAt >= ${startDateStr} GROUP BY \`date\` ORDER BY \`date\``
    ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);

    const resultMap = new Map(rawResult.map((r: any) => [String(r.date), r]));

    for (const day of chartData) {
      const existing = resultMap.get(day.date);
      if (existing) {
        day.orders = Number(existing.orders);
        day.revenue = Number(existing.revenue);
      }
    }
  } catch (err) {
    logger.error("[StoryAnalytics] getStorySalesChart error:", err);
    // Retorna array com zeros em caso de erro
  }

  return chartData;
}

// Buscar o story mais performático (mais pedidos) de um estabelecimento
export async function getTopPerformingStory(establishmentId: number): Promise<{
  storyId: number;
  orders: number;
  revenue: number;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Últimos 7 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');

  try {
    const rawResult: any[] = await db.execute(
      sql`SELECT storyId, COUNT(*) as orders, COALESCE(SUM(orderValue), 0) as revenue FROM storyEvents WHERE establishmentId = ${establishmentId} AND eventType = 'order_completed' AND createdAt >= ${startDateStr} GROUP BY storyId ORDER BY orders DESC LIMIT 1`
    ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);

    if (!rawResult || rawResult.length === 0) return null;

    return {
      storyId: Number(rawResult[0].storyId),
      orders: Number(rawResult[0].orders),
      revenue: Number(rawResult[0].revenue),
    };
  } catch (err) {
    logger.error("[StoryAnalytics] getTopPerformingStory error:", err);
    return null;
  }
}

// Calcular percentual de vendas geradas por stories hoje
export async function getStoryRevenuePercentToday(establishmentId: number): Promise<{
  storyRevenue: number;
  totalRevenue: number;
  percent: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 19).replace('T', ' ');

  try {
    // Revenue de stories hoje
    const storyRaw: any[] = await db.execute(
      sql`SELECT COALESCE(SUM(orderValue), 0) as revenue FROM storyEvents WHERE establishmentId = ${establishmentId} AND eventType = 'order_completed' AND createdAt >= ${todayStr}`
    ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);

    const storyRevenue = Number(storyRaw[0]?.revenue || 0);

    // Revenue total de pedidos hoje (excluindo cancelados)
    const totalRaw: any[] = await db.execute(
      sql`SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE establishmentId = ${establishmentId} AND createdAt >= ${todayStr} AND status != 'cancelled'`
    ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);

    const totalRevenue = Number(totalRaw[0]?.revenue || 0);
    const percent = totalRevenue > 0 ? Math.round((storyRevenue / totalRevenue) * 100) : 0;

    return { storyRevenue, totalRevenue, percent };
  } catch (err) {
    logger.error("[StoryAnalytics] getStoryRevenuePercentToday error:", err);
    return { storyRevenue: 0, totalRevenue: 0, percent: 0 };
  }
}


// ============ LOYALTY & CASHBACK METRICS ============

/**
 * Métricas do Cartão Fidelidade para o painel de fidelização
 */
export async function getLoyaltyMetrics(establishmentId: number) {
  const db = await getDb();
  if (!db) return { activeCards: 0, totalStamps: 0, rewardsRedeemed: 0, loyalCustomers: 0 };

  try {
    // Filtro base: somente cartões de clientes que realmente se cadastraram
    const registeredFilter = and(
      eq(loyaltyCards.establishmentId, establishmentId),
      eq(loyaltyCards.registeredByCustomer, true)
    );

    // Clientes com cartão ativo (stamps > 0) — somente cadastrados
    const activeCardsResult = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(loyaltyCards).where(and(
      registeredFilter,
      gt(loyaltyCards.stamps, 0)
    ));

    // Total de carimbos distribuídos — somente cadastrados
    const totalStampsResult = await db.select({
      total: sql<number>`COALESCE(SUM(${loyaltyCards.totalStampsEarned}), 0)`,
    }).from(loyaltyCards).where(registeredFilter);

    // Recompensas resgatadas (total de cupons ganhos) — somente cadastrados
    const rewardsResult = await db.select({
      total: sql<number>`COALESCE(SUM(${loyaltyCards.couponsEarned}), 0)`,
    }).from(loyaltyCards).where(registeredFilter);

    // Clientes fidelizados (que já completaram pelo menos um cartão) — somente cadastrados
    const loyalResult = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(loyaltyCards).where(and(
      registeredFilter,
      gt(loyaltyCards.couponsEarned, 0)
    ));

    return {
      activeCards: Number(activeCardsResult[0]?.count ?? 0),
      totalStamps: Number(totalStampsResult[0]?.total ?? 0),
      rewardsRedeemed: Number(rewardsResult[0]?.total ?? 0),
      loyalCustomers: Number(loyalResult[0]?.count ?? 0),
    };
  } catch (err) {
    logger.error("[LoyaltyMetrics] Error:", err);
    return { activeCards: 0, totalStamps: 0, rewardsRedeemed: 0, loyalCustomers: 0 };
  }
}

/**
 * Métricas do Cashback para o painel de fidelização
 */
export async function getCashbackMetrics(establishmentId: number) {
  const db = await getDb();
  if (!db) return { customersWithBalance: 0, totalDistributed: '0.00', totalUsed: '0.00', totalBalance: '0.00' };

  try {
    // Clientes com saldo de cashback > 0
    const customersResult = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(cashbackBalances).where(and(
      eq(cashbackBalances.establishmentId, establishmentId),
      gt(cashbackBalances.balance, '0')
    ));

    // Total distribuído (totalEarned de todos os clientes)
    const distributedResult = await db.select({
      total: sql<string>`COALESCE(SUM(${cashbackBalances.totalEarned}), 0)`,
    }).from(cashbackBalances).where(eq(cashbackBalances.establishmentId, establishmentId));

    // Saldo total em aberto
    const balanceResult = await db.select({
      total: sql<string>`COALESCE(SUM(${cashbackBalances.balance}), 0)`,
    }).from(cashbackBalances).where(eq(cashbackBalances.establishmentId, establishmentId));

    const totalDistributed = Number(distributedResult[0]?.total ?? 0);
    const totalBalance = Number(balanceResult[0]?.total ?? 0);
    const totalUsed = totalDistributed - totalBalance;

    return {
      customersWithBalance: Number(customersResult[0]?.count ?? 0),
      totalDistributed: totalDistributed.toFixed(2),
      totalUsed: totalUsed.toFixed(2),
      totalBalance: totalBalance.toFixed(2),
    };
  } catch (err) {
    logger.error("[CashbackMetrics] Error:", err);
    return { customersWithBalance: 0, totalDistributed: '0.00', totalUsed: '0.00', totalBalance: '0.00' };
  }
}

/**
 * Evolução da fidelização nos últimos 30 dias
 * Para loyalty: novos cartões criados por dia
 * Para cashback: novas transações de crédito por dia
 */
export async function getLoyaltyEvolution(establishmentId: number, programType: 'loyalty' | 'cashback') {
  const db = await getDb();
  if (!db) return [];

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const thirtyDaysAgo = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 30);
  const startDateStr = fmtLocalDateTime(thirtyDaysAgo);

  // Preencher todos os 30 dias
  const chartData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - i);
    chartData.push({ date: fmtLocalDate(d), count: 0 });
  }

  try {
    let rawResult: any[];

    if (programType === 'loyalty') {
      // Novos cartões de fidelidade criados por dia — somente clientes cadastrados
      rawResult = await db.execute(
        sql`SELECT DATE(CONVERT_TZ(${loyaltyCards.createdAt}, '+00:00', ${tz})) as \`date\`, COUNT(*) as cnt
            FROM ${loyaltyCards}
            WHERE ${loyaltyCards.establishmentId} = ${establishmentId}
              AND CONVERT_TZ(${loyaltyCards.createdAt}, '+00:00', ${tz}) >= ${startDateStr}
              AND ${loyaltyCards.registeredByCustomer} = true
            GROUP BY \`date\` ORDER BY \`date\``
      ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);
    } else {
      // Transações de crédito de cashback por dia
      rawResult = await db.execute(
        sql`SELECT DATE(CONVERT_TZ(${cashbackTransactions.createdAt}, '+00:00', ${tz})) as \`date\`, COUNT(*) as cnt
            FROM ${cashbackTransactions}
            WHERE ${cashbackTransactions.establishmentId} = ${establishmentId}
              AND ${cashbackTransactions.type} = 'credit'
              AND CONVERT_TZ(${cashbackTransactions.createdAt}, '+00:00', ${tz}) >= ${startDateStr}
            GROUP BY \`date\` ORDER BY \`date\``
      ).then((rows: any) => Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows);
    }

    const resultMap = new Map(rawResult.map((r: any) => [String(r.date), Number(r.cnt)]));
    for (const day of chartData) {
      const val = resultMap.get(day.date);
      if (val) day.count = val;
    }
  } catch (err) {
    logger.error("[LoyaltyEvolution] Error:", err);
  }

  return chartData;
}


// ============ HISTÓRICO DE FIDELIZAÇÃO ============

/**
 * Lista clientes com cartão fidelidade de um estabelecimento
 * Retorna nome, carimbos atuais, total de carimbos, cupons ganhos, data do último carimbo
 */
export async function getLoyaltyCardClients(establishmentId: number, limit = 10, offset = 0, search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build where conditions — somente clientes que realmente se cadastraram
  const conditions = [
    eq(loyaltyCards.establishmentId, establishmentId),
    eq(loyaltyCards.registeredByCustomer, true),
  ];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(
      sql`${loyaltyCards.customerName} LIKE ${term}`,
      sql`${loyaltyCards.customerPhone} LIKE ${term}`
    )!);
  }
  const whereClause = and(...conditions);

  // Count total
  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(loyaltyCards)
    .where(whereClause);
  const total = Number(countResult[0]?.count ?? 0);

  // Buscar cartões com último carimbo via subquery
  const cards = await db.select({
    id: loyaltyCards.id,
    customerName: loyaltyCards.customerName,
    customerPhone: loyaltyCards.customerPhone,
    stamps: loyaltyCards.stamps,
    totalStampsEarned: loyaltyCards.totalStampsEarned,
    couponsEarned: loyaltyCards.couponsEarned,
    updatedAt: loyaltyCards.updatedAt,
    createdAt: loyaltyCards.createdAt,
  }).from(loyaltyCards)
    .where(whereClause)
    .orderBy(desc(loyaltyCards.updatedAt))
    .limit(limit)
    .offset(offset);

  // Para cada cartão, buscar todas as datas dos carimbos
  const result = await Promise.all(cards.map(async (card) => {
    const allStamps = await db.select({
      createdAt: loyaltyStamps.createdAt,
    }).from(loyaltyStamps)
      .where(eq(loyaltyStamps.loyaltyCardId, card.id))
      .orderBy(loyaltyStamps.createdAt);

    const stampDates = allStamps.map(s => s.createdAt);
    const lastStampDate = stampDates.length > 0 ? stampDates[stampDates.length - 1] : card.updatedAt;

    return {
      ...card,
      lastStampDate,
      stampDates,
    };
  }));

  return { items: result, total, hasMore: offset + limit < total };
}

/**
 * Histórico de eventos de fidelidade (carimbos ganhos e cartões completados)
 */
export async function getLoyaltyEventHistory(establishmentId: number, limit = 10, offset = 0, period?: 'today' | 'week' | 'month', search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build period filter
  let periodFilter = sql`1=1`;
  if (period === 'today') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    periodFilter = sql`ls.createdAt >= ${today}`;
  } else if (period === 'week') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
    periodFilter = sql`ls.createdAt >= ${weekAgo}`;
  } else if (period === 'month') {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30); monthAgo.setHours(0, 0, 0, 0);
    periodFilter = sql`ls.createdAt >= ${monthAgo}`;
  }

  // Build search filter
  let searchFilter = sql`1=1`;
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    searchFilter = sql`(lc.customerName LIKE ${term} OR lc.customerPhone LIKE ${term})`;
  }

  // Filtro adicional: somente cartões de clientes cadastrados
  const registeredFilter = sql`lc.registeredByCustomer = 1`;

  // Count total
  const countRes: any[] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM ${loyaltyStamps} ls
    INNER JOIN ${loyaltyCards} lc ON ls.loyaltyCardId = lc.id
    WHERE lc.establishmentId = ${establishmentId} AND ${periodFilter} AND ${searchFilter} AND ${registeredFilter}`
  );
  const countRows = Array.isArray(countRes) ? (Array.isArray(countRes[0]) ? countRes[0] : countRes) : [];
  const total = Number(countRows[0]?.cnt ?? 0);

  // Buscar últimos carimbos com nome do cliente — somente cadastrados
  const stamps: any[] = await db.execute(
    sql`SELECT
      ls.id, ls.createdAt, ls.orderNumber,
      lc.customerName, lc.customerPhone, lc.stamps, lc.totalStampsEarned, lc.couponsEarned
    FROM ${loyaltyStamps} ls
    INNER JOIN ${loyaltyCards} lc ON ls.loyaltyCardId = lc.id
    WHERE lc.establishmentId = ${establishmentId} AND ${periodFilter} AND ${searchFilter} AND ${registeredFilter}
    ORDER BY ls.createdAt DESC
    LIMIT ${limit} OFFSET ${offset}`
  );

  const rows = Array.isArray(stamps) ? (Array.isArray(stamps[0]) ? stamps[0] : stamps) : [];
  const items = rows.map((row: any) => ({
    id: Number(row.id),
    customerName: row.customerName || row.customerPhone || 'Cliente',
    customerPhone: row.customerPhone || '',
    orderNumber: row.orderNumber || '',
    currentStamps: Number(row.stamps),
    totalStampsEarned: Number(row.totalStampsEarned),
    couponsEarned: Number(row.couponsEarned),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }));
  return { items, total, hasMore: offset + limit < total };
}

/**
 * Lista clientes com cashback de um estabelecimento
 */
export async function getCashbackClients(establishmentId: number, limit = 10, offset = 0, search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build where conditions
  const conditions = [eq(cashbackBalances.establishmentId, establishmentId)];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(sql`${cashbackBalances.customerPhone} LIKE ${term}`);
  }
  const whereClause = and(...conditions);

  // Count total
  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(cashbackBalances)
    .where(whereClause);
  const total = Number(countResult[0]?.count ?? 0);

  const balances = await db.select({
    id: cashbackBalances.id,
    customerPhone: cashbackBalances.customerPhone,
    balance: cashbackBalances.balance,
    totalEarned: cashbackBalances.totalEarned,
    totalUsed: cashbackBalances.totalUsed,
    updatedAt: cashbackBalances.updatedAt,
  }).from(cashbackBalances)
    .where(whereClause)
    .orderBy(desc(cashbackBalances.updatedAt))
    .limit(limit)
    .offset(offset);

  // Buscar nomes dos clientes via pedidos mais recentes
  const result = await Promise.all(balances.map(async (bal) => {
    const normalizedPhone = bal.customerPhone.replace(/\D/g, '');
    const order = await db.select({ customerName: orders.customerName })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        or(
          eq(orders.customerPhone, bal.customerPhone),
          eq(orders.customerPhone, normalizedPhone)
        )
      ))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    // Cashback ganho hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCredits = await db.select({
      total: sql<string>`COALESCE(SUM(${cashbackTransactions.amount}), 0)`,
    }).from(cashbackTransactions)
      .where(and(
        eq(cashbackTransactions.establishmentId, establishmentId),
        or(
          eq(cashbackTransactions.customerPhone, bal.customerPhone),
          eq(cashbackTransactions.customerPhone, normalizedPhone)
        ),
        eq(cashbackTransactions.type, 'credit'),
        sql`${cashbackTransactions.createdAt} >= ${today}`
      ));

    return {
      ...bal,
      customerName: order[0]?.customerName || bal.customerPhone,
      cashbackToday: todayCredits[0]?.total || '0.00',
    };
  }));

  return { items: result, total, hasMore: offset + limit < total };
}

/**
 * Histórico de eventos de cashback (créditos e débitos)
 */
export async function getCashbackEventHistory(establishmentId: number, limit = 10, offset = 0, period?: 'today' | 'week' | 'month', search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build period filter conditions
  const conditions: any[] = [eq(cashbackTransactions.establishmentId, establishmentId)];
  if (period === 'today') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    conditions.push(sql`${cashbackTransactions.createdAt} >= ${today}`);
  } else if (period === 'week') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
    conditions.push(sql`${cashbackTransactions.createdAt} >= ${weekAgo}`);
  } else if (period === 'month') {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30); monthAgo.setHours(0, 0, 0, 0);
    conditions.push(sql`${cashbackTransactions.createdAt} >= ${monthAgo}`);
  }
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(sql`${cashbackTransactions.customerPhone} LIKE ${term}`);
  }

  // Count total
  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(cashbackTransactions)
    .where(and(...conditions));
  const total = Number(countResult[0]?.count ?? 0);

  const transactions = await db.select({
    id: cashbackTransactions.id,
    customerPhone: cashbackTransactions.customerPhone,
    type: cashbackTransactions.type,
    amount: cashbackTransactions.amount,
    orderNumber: cashbackTransactions.orderNumber,
    description: cashbackTransactions.description,
    balanceAfter: cashbackTransactions.balanceAfter,
    createdAt: cashbackTransactions.createdAt,
  }).from(cashbackTransactions)
    .where(and(...conditions))
    .orderBy(desc(cashbackTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  // Buscar nomes dos clientes
  const items = await Promise.all(transactions.map(async (tx) => {
    const normalizedPhone = tx.customerPhone.replace(/\D/g, '');
    const order = await db.select({ customerName: orders.customerName })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        or(
          eq(orders.customerPhone, tx.customerPhone),
          eq(orders.customerPhone, normalizedPhone)
        )
      ))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    return {
      ...tx,
      customerName: order[0]?.customerName || tx.customerPhone,
    };
  }));

  return { items, total, hasMore: offset + limit < total };
}


// ============ AI IMAGE CREDITS FUNCTIONS ============

/**
 * Busca créditos de imagem IA disponíveis para um estabelecimento
 */
export async function getAiImageCredits(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ aiImageCredits: establishments.aiImageCredits })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);

  return result.length > 0 ? (result[0].aiImageCredits ?? 0) : 0;
}

/**
 * Consome 1 crédito de imagem IA e registra no log
 * Retorna o saldo restante ou null se não houver créditos
 */
export async function consumeAiImageCredit(establishmentId: number, userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar saldo atual
  const current = await getAiImageCredits(establishmentId);
  if (current <= 0) return null;

  const newBalance = current - 1;

  // Decrementar crédito
  await db.update(establishments)
    .set({ aiImageCredits: newBalance })
    .where(eq(establishments.id, establishmentId));

  // Registrar no log
  await db.insert(aiImageCreditLogs).values({
    establishmentId,
    userId,
    action: "use",
    quantity: -1,
    balanceAfter: newBalance,
    description: "Melhoria de foto com IA",
  });

  return newBalance;
}

/**
 * Adiciona créditos de imagem IA (compra ou bônus) e registra no log
 */
export async function addAiImageCredits(
  establishmentId: number,
  userId: number,
  quantity: number,
  action: "purchase" | "bonus" | "refund",
  description: string,
  stripeSessionId?: string,
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await getAiImageCredits(establishmentId);
  const newBalance = current + quantity;

  // Atualizar saldo
  await db.update(establishments)
    .set({ aiImageCredits: newBalance })
    .where(eq(establishments.id, establishmentId));

  // Registrar no log
  await db.insert(aiImageCreditLogs).values({
    establishmentId,
    userId,
    action,
    quantity,
    balanceAfter: newBalance,
    description,
    stripeSessionId: stripeSessionId || null,
  });

  return newBalance;
}

/**
 * Busca histórico de créditos de imagem IA
 */
export async function getAiImageCreditHistory(establishmentId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(aiImageCreditLogs)
    .where(eq(aiImageCreditLogs.establishmentId, establishmentId))
    .orderBy(desc(aiImageCreditLogs.createdAt))
    .limit(limit);

  return result;
}


/**
 * Verifica se o estabelecimento é elegível para créditos grátis de IA
 * Condições: 15+ produtos, foto de perfil, capa, 5+ produtos com foto
 */
export async function checkAiCreditsEligibility(establishmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Buscar dados do estabelecimento
  const est = await db.select({
    logo: establishments.logo,
    coverImage: establishments.coverImage,
  })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);

  if (!est.length) return false;
  const { logo, coverImage } = est[0];

  // Precisa ter foto de perfil e capa
  if (!logo || !coverImage) return false;

  // Contar total de produtos
  const totalProducts = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.establishmentId, establishmentId));

  if (!totalProducts.length || totalProducts[0].count < 15) return false;

  // Contar produtos com foto (images é um campo JSON array)
  const productsWithPhoto = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      isNotNull(products.images),
      sql`JSON_LENGTH(${products.images}) > 0`
    ));

  if (!productsWithPhoto.length || productsWithPhoto[0].count < 5) return false;

  return true;
}

/**
 * Concede 4 créditos grátis de IA ao estabelecimento (apenas uma vez)
 * Usa UPDATE atômico com WHERE aiCreditsGranted = false para evitar race condition
 * (múltiplas chamadas simultâneas a getBalance não concedem créditos duplicados)
 */
export async function grantFreeAiCredits(establishmentId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const FREE_CREDITS = 4;

  // UPDATE atômico: só atualiza se aiCreditsGranted ainda for false
  // Isso evita race condition quando múltiplas chamadas simultâneas tentam conceder créditos
  const result = await db.execute(
    sql`UPDATE \`establishments\` SET \`aiImageCredits\` = \`aiImageCredits\` + ${FREE_CREDITS}, \`aiCreditsGranted\` = true WHERE \`id\` = ${establishmentId} AND \`aiCreditsGranted\` = false`
  );

  // Se nenhuma linha foi afetada, significa que já foi concedido (outra chamada ganhou a corrida)
  const affectedRows = (result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0;
  if (affectedRows === 0) {
    logger.info(`[grantFreeAiCredits] Créditos já concedidos para estabelecimento ${establishmentId} (race condition evitada)`);
    return;
  }

  // Registrar no log apenas se realmente concedeu
  const newBalance = await getAiImageCredits(establishmentId);
  await db.insert(aiImageCreditLogs).values({
    establishmentId,
    userId,
    action: "bonus",
    quantity: FREE_CREDITS,
    balanceAfter: newBalance,
    description: "Créditos grátis de boas-vindas",
  });
}


// ============ COLLABORATORS ============

export async function getCollaboratorsByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(collaborators).where(eq(collaborators.establishmentId, establishmentId)).orderBy(collaborators.name);
}

export async function getCollaboratorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(collaborators).where(eq(collaborators.id, id)).limit(1);
  return rows[0];
}

export async function getCollaboratorByEmail(establishmentId: number, email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(collaborators).where(and(eq(collaborators.establishmentId, establishmentId), eq(collaborators.email, email))).limit(1);
  return rows[0];
}

export async function getCollaboratorByEmailGlobal(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(collaborators).where(eq(collaborators.email, email)).limit(1);
  return rows[0];
}

export async function createCollaborator(data: { establishmentId: number; name: string; email: string; passwordHash: string; permissions: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(collaborators).values(data);
  return result[0].insertId;
}

export async function updateCollaborator(id: number, data: Partial<{ name: string; email: string; passwordHash: string; permissions: string[]; isActive: boolean }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(collaborators).set(data).where(eq(collaborators.id, id));
}

export async function deleteCollaborator(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(collaborators).where(eq(collaborators.id, id));
}

export async function updateCollaboratorLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(collaborators).set({ lastLoginAt: new Date() }).where(eq(collaborators.id, id));
}

// ============ COLLABORATOR PASSWORD RESET FUNCTIONS ============
export async function setCollaboratorResetToken(collaboratorId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(collaborators).set({
    resetToken: token,
    resetTokenExpiresAt: expiresAt,
  }).where(eq(collaborators.id, collaboratorId));
}

export async function getCollaboratorByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(collaborators).where(eq(collaborators.resetToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCollaboratorPassword(collaboratorId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(collaborators).set({
    passwordHash,
    resetToken: null,
    resetTokenExpiresAt: null,
  }).where(eq(collaborators.id, collaboratorId));
}


/**
 * Busca o histórico de atividades de uma mesa (timeline)
 * Retorna todos os eventos: itens adicionados, pagamentos parciais, pedidos enviados à cozinha, etc.
 */
export async function getTableHistory(tableId: number): Promise<Array<{
  type: 'item_added' | 'item_cancelled' | 'partial_payment' | 'loose_payment' | 'order_sent' | 'table_opened' | 'table_closed';
  timestamp: Date;
  description: string;
  details?: string;
  amount?: string;
  paymentMethod?: string;
  tabId?: number;
  items?: Array<{ name: string; quantity: number; price: string }>;
}>> {
  const db = await getDb();
  if (!db) { logger.info('[History] No DB'); return []; }

  const table = await getTableById(tableId);
  if (!table) { logger.info('[History] No table for id:', tableId); return []; }

  logger.info('[History] Found table:', tableId, 'number:', table.number, 'displayNumber:', table.displayNumber);
  const tableDisplayName = table.displayNumber || String(table.number);
  const events: Array<{
    type: 'item_added' | 'item_cancelled' | 'partial_payment' | 'loose_payment' | 'order_sent' | 'table_opened' | 'table_closed';
    timestamp: Date;
    description: string;
    details?: string;
    amount?: string;
    paymentMethod?: string;
    tabId?: number;
    items?: Array<{ name: string; quantity: number; price: string }>;
  }> = [];

  // Calcular cutoff do "dia operacional" às 5h da manhã (horário de Brasília)
  // 5h BRT (UTC-3) = 08:00 UTC
  // Se agora (em BRT) é antes das 5h, o dia operacional começou ontem às 5h
  const now = new Date();
  const BRAZIL_OFFSET_HOURS = -3; // UTC-3 (Brasília)
  const CUTOFF_HOUR_LOCAL = 5; // 5h da manhã local
  const cutoffHourUTC = CUTOFF_HOUR_LOCAL - BRAZIL_OFFSET_HOURS; // 5 - (-3) = 8 UTC

  // Hora atual no Brasil
  const brazilHour = (now.getUTCHours() + BRAZIL_OFFSET_HOURS + 24) % 24;

  // Cutoff de hoje às 08:00 UTC (= 5h BRT)
  const todayCutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), cutoffHourUTC, 0, 0, 0));
  const dayCutoff = brazilHour < CUTOFF_HOUR_LOCAL
    ? new Date(todayCutoff.getTime() - 24 * 60 * 60 * 1000) // ontem às 5h BRT
    : todayCutoff; // hoje às 5h BRT
  logger.info('[History] Day cutoff:', dayCutoff.toISOString(), 'Brazil hour now:', brazilHour);

  // 1. Buscar comandas desta mesa criadas a partir do cutoff do dia operacional
  try {
  const allTabs = await db.select().from(tabs)
    .where(and(
      eq(tabs.tableId, tableId),
      or(
        eq(tabs.status, 'open'),           // Comandas abertas sempre aparecem
        gte(tabs.createdAt, dayCutoff)      // Comandas fechadas só do dia operacional
      )
    ))
    .orderBy(desc(tabs.createdAt));

  logger.info('[History] Found', allTabs.length, 'tabs for table', tableId);

  for (const tab of allTabs) {
    // Evento: Mesa aberta (comanda criada)
    events.push({
      type: 'table_opened',
      timestamp: tab.openedAt || tab.createdAt,
      description: `Mesa ${tableDisplayName} aberta`,
      details: tab.customerName ? `Cliente: ${tab.customerName}` : undefined,
    });

    // Buscar TODOS os itens da comanda (incluindo cancelled para histórico)
    const allItems = await db.select().from(tabItems)
      .where(eq(tabItems.tabId, tab.id))
      .orderBy(tabItems.orderedAt);

    // Agrupar itens por timestamp de criação (pedidos enviados juntos)
    const itemGroups = new Map<string, typeof allItems>();
    for (const item of allItems) {
      // Agrupar por minuto de criação
      const key = new Date(item.orderedAt).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item);
    }

    // Criar eventos de itens adicionados (agrupados)
    const groupEntries = Array.from(itemGroups.entries());
    for (const [, groupItems] of groupEntries) {
      const activeItems = groupItems.filter((i: any) => i.status !== 'cancelled');
      const cancelledItems = groupItems.filter((i: any) => i.status === 'cancelled');

      if (activeItems.length > 0) {
        const groupTotal = activeItems.reduce((sum: number, i: any) => sum + parseFloat(i.totalPrice), 0);
        events.push({
          type: 'item_added',
          timestamp: activeItems[0].orderedAt || activeItems[0].createdAt,
          description: `${activeItems.length} ${activeItems.length === 1 ? 'item adicionado' : 'itens adicionados'}`,
          amount: groupTotal.toFixed(2),
          items: activeItems.map((i: any) => ({
            name: i.productName,
            quantity: i.quantity,
            price: i.totalPrice,
          })),
        });
      }

      // Itens cancelados (pagamento parcial)
      if (cancelledItems.length > 0) {
        const cancelTotal = cancelledItems.reduce((sum: number, i: any) => sum + parseFloat(i.totalPrice), 0);
        // Verificar se existe um pedido parcial correspondente
        events.push({
          type: 'item_cancelled',
          timestamp: cancelledItems[0].updatedAt || cancelledItems[0].createdAt,
          description: `${cancelledItems.length} ${cancelledItems.length === 1 ? 'item pago (parcial)' : 'itens pagos (parcial)'}`,
          amount: cancelTotal.toFixed(2),
          items: cancelledItems.map((i: any) => ({
            name: i.productName,
            quantity: i.quantity,
            price: i.totalPrice,
          })),
        });
      }
    }

    // Buscar pedidos parciais (completed com "parcial" no nome)
    const partialOrders = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      completedAt: orders.completedAt,
      createdAt: orders.createdAt,
      customerName: orders.customerName,
    }).from(orders)
      .where(and(
        eq(orders.establishmentId, table.establishmentId),
        eq(orders.source, 'pdv'),
        eq(orders.deliveryType, 'dine_in'),
        eq(orders.status, 'completed'),
        sql`${orders.customerName} LIKE ${`Mesa ${tableDisplayName} (parcial)`}`,
        gte(orders.createdAt, dayCutoff)
      ))
      .orderBy(desc(orders.createdAt));

    for (const order of partialOrders) {
      // Buscar itens do pedido parcial
      const pOrderItems = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      events.push({
        type: 'partial_payment',
        timestamp: order.completedAt || order.createdAt,
        description: `Pagamento parcial #${order.orderNumber}`,
        amount: order.total,
        paymentMethod: order.paymentMethod,
        items: pOrderItems.map(i => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.totalPrice,
        })),
      });
    }

    // Buscar pedidos enviados à cozinha (não parciais)
    const kitchenOrders = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      completedAt: orders.completedAt,
      customerName: orders.customerName,
    }).from(orders)
      .where(and(
        eq(orders.establishmentId, table.establishmentId),
        eq(orders.source, 'pdv'),
        eq(orders.deliveryType, 'dine_in'),
        sql`${orders.customerName} = ${`Mesa ${tableDisplayName}`}`,
        gte(orders.createdAt, dayCutoff)
      ))
      .orderBy(desc(orders.createdAt));

    for (const order of kitchenOrders) {
      events.push({
        type: 'order_sent',
        timestamp: order.createdAt,
        description: `Pedido ${order.orderNumber} enviado`,
        details: `Status: ${order.status === 'completed' ? 'Concluído' : order.status === 'preparing' ? 'Em preparo' : order.status === 'ready' ? 'Pronto' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}`,
        amount: order.total,
      });
    }

    // Buscar pagamentos avulsos desta comanda
    const loosePayments = await getTabPayments(tab.id);
    for (const payment of loosePayments) {
      events.push({
        type: 'loose_payment',
        timestamp: payment.createdAt,
        description: `Pagamento avulso de R$ ${parseFloat(payment.amount).toFixed(2)}`,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        details: payment.notes || undefined,
      });
    }

    // Evento: Mesa fechada (se comanda fechada)
    if (tab.status === 'closed' && tab.closedAt) {
      events.push({
        type: 'table_closed',
        timestamp: tab.closedAt,
        description: `Mesa ${tableDisplayName} fechada`,
        amount: tab.total,
        paymentMethod: tab.paymentMethod || undefined,
        tabId: tab.id,
      });
    }
  }

  // Ordenar por timestamp decrescente (mais recente primeiro)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  logger.info('[History] Total events:', events.length);
  return events;
  } catch (err: any) {
    logger.error('[History] Error in getTableHistory:', err.message, err.stack);
    return [];
  }
}


// ============ TAB PAYMENTS (PAGAMENTO AVULSO) ============

/**
 * Busca todos os pagamentos avulsos de uma comanda
 */
export async function getTabPayments(tabId: number): Promise<TabPayment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tabPayments)
    .where(eq(tabPayments.tabId, tabId))
    .orderBy(desc(tabPayments.createdAt));
}

/**
 * Busca todos os pagamentos avulsos de uma mesa (todas as comandas)
 */
export async function getTablePayments(tableId: number): Promise<TabPayment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tabPayments)
    .where(eq(tabPayments.tableId, tableId))
    .orderBy(desc(tabPayments.createdAt));
}

/**
 * Calcula o total de pagamentos avulsos de uma comanda
 */
export async function getTabPaymentsTotal(tabId: number): Promise<number> {
  const payments = await getTabPayments(tabId);
  return payments.reduce((sum: number, p: TabPayment) => sum + parseFloat(p.amount), 0);
}

/**
 * Registra um pagamento avulso (abatimento por valor) na comanda
 */
export async function loosePayment(
  tableId: number,
  amount: number,
  paymentMethod: string,
  notes?: string
): Promise<{ paymentId: number; newBalance: string; totalPaid: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const table = await getTableById(tableId);
  if (!table) throw new Error("Mesa não encontrada");

  const tableDisplayName = table.displayNumber || String(table.number);

  const tab = await getActiveTabByTable(tableId);
  if (!tab) throw new Error("Nenhuma comanda ativa para esta mesa");

  if (amount <= 0) throw new Error("Valor deve ser maior que zero");

  // Calcular saldo atual (total da comanda - pagamentos avulsos já feitos)
  const existingPayments = await getTabPaymentsTotal(tab.id);
  const currentBalance = parseFloat(tab.total) - existingPayments;

  if (amount > currentBalance + 0.01) {
    throw new Error(`Valor excede o saldo restante (R$ ${currentBalance.toFixed(2)})`);
  }

  // Registrar o pagamento avulso
  const result = await db.insert(tabPayments).values({
    tabId: tab.id,
    tableId: tableId,
    establishmentId: tab.establishmentId,
    amount: amount.toFixed(2),
    paymentMethod: paymentMethod,
    notes: notes || null,
  });

  const paymentId = result[0].insertId;

  // Mapear forma de pagamento
  const paymentMethodMap: Record<string, "cash" | "card" | "pix" | "boleto" | "card_online"> = {
    'dinheiro': 'cash', 'cartao_credito': 'card', 'cartao_debito': 'card',
    'pix': 'pix', 'cash': 'cash', 'card': 'card',
  };
  const mappedPayment = paymentMethodMap[paymentMethod] || 'cash';

  // Criar pedido "completed" para registrar no faturamento
  try {
    await createOrderWithNumber(
      {
        establishmentId: tab.establishmentId,
        orderNumber: '',
        customerName: `Mesa ${tableDisplayName} (avulso)`,
        status: 'completed',
        deliveryType: 'dine_in',
        paymentMethod: mappedPayment,
        subtotal: amount.toFixed(2),
        deliveryFee: '0',
        discount: '0',
        total: amount.toFixed(2),
        changeAmount: '0',
        source: 'pdv',
        completedAt: new Date(),
      },
      [], // Sem itens específicos
      { skipSSE: true } // Não enviar SSE new_order em pagamento avulso - evita som na cozinha
    );
  } catch (err) {
    logger.error('[loosePayment] Erro ao criar pedido avulso:', err);
  }

  // Calcular novo saldo
  const totalPaid = existingPayments + amount;
  const newBalance = parseFloat(tab.total) - totalPaid;

  // Atualizar paidAmount na comanda
  await db.update(tabs)
    .set({
      paidAmount: totalPaid.toFixed(2),
      updatedAt: new Date()
    })
    .where(eq(tabs.id, tab.id));

  // Se o saldo ficou zerado ou negativo, fechar a comanda e liberar a mesa
  if (newBalance <= 0.01) {
    // Salvar label da mesa na comanda antes de fechar (para o recibo)
    if (table?.label) {
      await db.update(tabs)
        .set({ customerName: table.label })
        .where(eq(tabs.id, tab.id));
    }
    await closeTab(tab.id, paymentMethod, parseFloat(tab.total), 0);
    await updateTableStatus(tableId, "free");
    await updateTable(tableId, { label: null });
  }

  // Emitir SSE para atualizar em tempo real
  notifyOrderUpdate(tab.establishmentId, { tableId, type: 'loose_payment', amount });

  logger.info(`[loosePayment] Mesa ${tableDisplayName}: Pagamento avulso R$ ${amount.toFixed(2)} via ${paymentMethod}. Saldo restante: R$ ${Math.max(0, newBalance).toFixed(2)}`);

  return {
    paymentId,
    newBalance: Math.max(0, newBalance).toFixed(2),
    totalPaid: totalPaid.toFixed(2),
  };
}


// ============ EMAIL VERIFICATION ============

/**
 * Cria um código de verificação de email (5 dígitos).
 * Invalida códigos anteriores do mesmo email.
 */
export async function createEmailVerificationCode(email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gerar código de 5 dígitos
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  // Inserir novo código (não deleta os antigos, verifica pelo mais recente)
  await db.insert(emailVerificationCodes).values({
    email: email.toLowerCase().trim(),
    code,
    expiresAt,
  });

  return code;
}

/**
 * Verifica um código de verificação de email.
 * Retorna true se o código é válido e não expirou.
 * Incrementa tentativas a cada verificação.
 */
export async function verifyEmailCode(email: string, code: string): Promise<{ valid: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedEmail = email.toLowerCase().trim();

  // Buscar o código mais recente para este email
  const [record] = await db.select()
    .from(emailVerificationCodes)
    .where(eq(emailVerificationCodes.email, normalizedEmail))
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (!record) {
    return { valid: false, reason: "Código não encontrado. Solicite um novo código." };
  }

  // Verificar expiração
  if (new Date() > record.expiresAt) {
    return { valid: false, reason: "Código expirado. Solicite um novo código." };
  }

  // Verificar máximo de tentativas (5)
  if (record.attempts >= 5) {
    return { valid: false, reason: "Muitas tentativas. Solicite um novo código." };
  }

  // Incrementar tentativas
  await db.update(emailVerificationCodes)
    .set({ attempts: record.attempts + 1 })
    .where(eq(emailVerificationCodes.id, record.id));

  // Verificar código
  if (record.code !== code) {
    return { valid: false, reason: "Código incorreto. Tente novamente." };
  }

  // Marcar como verificado
  await db.update(emailVerificationCodes)
    .set({ verified: true })
    .where(eq(emailVerificationCodes.id, record.id));

  return { valid: true };
}

/**
 * Verifica se um email já foi verificado (código válido e não expirado).
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const normalizedEmail = email.toLowerCase().trim();

  const [record] = await db.select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, normalizedEmail),
        eq(emailVerificationCodes.verified, true),
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (!record) return false;

  // Verificar se não expirou (dar margem de 30 min após verificação)
  const thirtyMinAfterExpiry = new Date(record.expiresAt.getTime() + 30 * 60 * 1000);
  return new Date() <= thirtyMinAfterExpiry;
}


// ==================== WHATSAPP CHAT HELPERS ====================

/**
 * Busca ou cria uma conversa pelo remoteJid
 */
export async function getOrCreateConversation(
  establishmentId: number,
  remoteJid: string,
  phone: string,
  contactName?: string | null
): Promise<WhatsappConversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tentar buscar existente
  const [existing] = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.establishmentId, establishmentId),
        eq(whatsappConversations.remoteJid, remoteJid)
      )
    )
    .limit(1);

  if (existing) {
    // Atualizar contactName se veio novo
    if (contactName && contactName !== existing.contactName) {
      await db
        .update(whatsappConversations)
        .set({ contactName })
        .where(eq(whatsappConversations.id, existing.id));
      return { ...existing, contactName };
    }
    return existing;
  }

  // Criar nova conversa
  const [result] = await db.insert(whatsappConversations).values({
    establishmentId,
    remoteJid,
    phone,
    contactName: contactName || null,
    status: "bot",
    unreadCount: 0,
  });

  const [created] = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.id, result.insertId))
    .limit(1);

  return created;
}

/**
 * Salva uma mensagem no banco
 */
export async function saveWhatsappMessage(data: {
  conversationId: number;
  establishmentId: number;
  remoteJid: string;
  messageId?: string | null;
  direction: "incoming" | "outgoing";
  senderName?: string | null;
  messageType?: "text" | "image" | "audio" | "video" | "document" | "sticker" | "location" | "contact" | "other";
  content?: string | null;
  mediaUrl?: string | null;
  timestamp?: Date;
}): Promise<WhatsappMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(whatsappMessages).values({
    conversationId: data.conversationId,
    establishmentId: data.establishmentId,
    remoteJid: data.remoteJid,
    messageId: data.messageId || null,
    direction: data.direction,
    senderName: data.senderName || null,
    messageType: data.messageType || "text",
    content: data.content || null,
    mediaUrl: data.mediaUrl || null,
    timestamp: data.timestamp || new Date(),
    isRead: data.direction === "outgoing",
  });

  const [msg] = await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.id, result.insertId))
    .limit(1);

  return msg;
}

/**
 * Atualiza a conversa com a última mensagem e incrementa unread
 */
export async function updateConversationLastMessage(
  conversationId: number,
  messageText: string | null,
  incrementUnread: boolean = true
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (incrementUnread) {
    await db
      .update(whatsappConversations)
      .set({
        lastMessageText: messageText || "(mídia)",
        lastMessageAt: new Date(),
        unreadCount: sql`${whatsappConversations.unreadCount} + 1`,
      })
      .where(eq(whatsappConversations.id, conversationId));
  } else {
    await db
      .update(whatsappConversations)
      .set({
        lastMessageText: messageText || "(mídia)",
        lastMessageAt: new Date(),
      })
      .where(eq(whatsappConversations.id, conversationId));
  }
}

/**
 * Lista conversas de um estabelecimento
 */
export async function listConversations(
  establishmentId: number,
  filter?: "all" | "human" | "bot"
): Promise<WhatsappConversation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(whatsappConversations.establishmentId, establishmentId)];

  if (filter === "human") {
    conditions.push(eq(whatsappConversations.status, "human"));
  } else if (filter === "bot") {
    conditions.push(eq(whatsappConversations.status, "bot"));
  }

  return db
    .select()
    .from(whatsappConversations)
    .where(and(...conditions))
    .orderBy(desc(whatsappConversations.lastMessageAt));
}

/**
 * Busca mensagens de uma conversa com paginação
 */
export async function getConversationMessages(
  conversationId: number,
  limit: number = 50,
  beforeId?: number
): Promise<WhatsappMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(whatsappMessages.conversationId, conversationId)];

  if (beforeId) {
    conditions.push(sql`${whatsappMessages.id} < ${beforeId}`);
  }

  return db
    .select()
    .from(whatsappMessages)
    .where(and(...conditions))
    .orderBy(desc(whatsappMessages.id))
    .limit(limit);
}

/**
 * Marca todas as mensagens de uma conversa como lidas e zera unreadCount
 */
export async function markConversationAsRead(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(whatsappMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(whatsappMessages.conversationId, conversationId),
        eq(whatsappMessages.isRead, false)
      )
    );

  await db
    .update(whatsappConversations)
    .set({ unreadCount: 0 })
    .where(eq(whatsappConversations.id, conversationId));
}

/**
 * Atualiza o status de uma conversa (bot, human, closed)
 */
export async function updateConversationStatus(
  conversationId: number,
  status: "bot" | "human" | "closed"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(whatsappConversations)
    .set({ status })
    .where(eq(whatsappConversations.id, conversationId));
}

/**
 * Busca uma conversa por ID
 */
export async function getConversationById(conversationId: number): Promise<WhatsappConversation | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [conv] = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.id, conversationId))
    .limit(1);

  return conv || null;
}

/**
 * Conta total de mensagens não lidas de um estabelecimento
 */
export async function getTotalUnreadCount(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${whatsappConversations.unreadCount}), 0)` })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.establishmentId, establishmentId));

  return result?.total || 0;
}

/**
 * Busca conversas por texto (nome do contato ou telefone)
 */
export async function searchConversations(
  establishmentId: number,
  query: string
): Promise<WhatsappConversation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.establishmentId, establishmentId),
        or(
          like(whatsappConversations.contactName, `%${escapeLike(query)}%`),
          like(whatsappConversations.phone, `%${escapeLike(query)}%`)
        )
      )
    )
    .orderBy(desc(whatsappConversations.lastMessageAt));
}


/**
 * Busca conversa por remoteJid e establishmentId
 */
export async function getConversationByRemoteJid(
  establishmentId: number,
  remoteJid: string
): Promise<WhatsappConversation | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [conv] = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.establishmentId, establishmentId),
        eq(whatsappConversations.remoteJid, remoteJid)
      )
    )
    .limit(1);

  return conv || null;
}


// --- Meta Semanal ---

export async function getWeeklyGoal(establishmentId: number): Promise<WeeklyGoal | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(weeklyGoals)
    .where(and(
      eq(weeklyGoals.establishmentId, establishmentId),
      eq(weeklyGoals.isActive, true)
    ))
    .limit(1);

  return result[0] || null;
}

export async function upsertWeeklyGoal(data: { establishmentId: number; targetRevenue: string }): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await getWeeklyGoal(data.establishmentId);

  if (existing) {
    await db.update(weeklyGoals)
      .set({ targetRevenue: data.targetRevenue })
      .where(eq(weeklyGoals.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(weeklyGoals).values({
      establishmentId: data.establishmentId,
      targetRevenue: data.targetRevenue,
    });
    return result[0].insertId;
  }
}

export async function deleteWeeklyGoal(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(weeklyGoals)
    .where(eq(weeklyGoals.establishmentId, establishmentId));
}

export async function deleteMonthlyGoal(establishmentId: number, month: number, year: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(monthlyGoals)
    .where(and(
      eq(monthlyGoals.establishmentId, establishmentId),
      eq(monthlyGoals.month, month),
      eq(monthlyGoals.year, year)
    ));
}



// ============ SCHEDULED CLOSURES (Fechamentos Programados) ============

export async function getScheduledClosures(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Limpar fechamentos de datas específicas que já passaram (antes de hoje)
  await db.delete(scheduledClosures)
    .where(and(
      eq(scheduledClosures.establishmentId, establishmentId),
      eq(scheduledClosures.type, "specific_date"),
      lt(scheduledClosures.specificDate, sql`CURDATE()`)
    ));

  return db.select().from(scheduledClosures)
    .where(eq(scheduledClosures.establishmentId, establishmentId))
    .orderBy(desc(scheduledClosures.createdAt));
}

export async function createScheduledClosure(data: InsertScheduledClosure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(scheduledClosures).values(data);
  return result.insertId;
}

export async function updateScheduledClosure(id: number, establishmentId: number, data: Partial<InsertScheduledClosure>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scheduledClosures)
    .set(data)
    .where(and(eq(scheduledClosures.id, id), eq(scheduledClosures.establishmentId, establishmentId)));
}

export async function deleteScheduledClosure(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scheduledClosures)
    .where(and(eq(scheduledClosures.id, id), eq(scheduledClosures.establishmentId, establishmentId)));
}

/**
 * Verifica se hoje é um dia de fechamento programado para o estabelecimento.
 * Retorna o motivo do fechamento ou null se não houver.
 */
export async function checkScheduledClosure(establishmentId: number, timezone: string = "America/Sao_Paulo"): Promise<{ isClosed: boolean; reason: string | null }> {
  const db = await getDb();
  if (!db) return { isClosed: false, reason: null };

  const closures = await db.select().from(scheduledClosures)
    .where(and(
      eq(scheduledClosures.establishmentId, establishmentId),
      eq(scheduledClosures.isActive, true)
    ));

  if (closures.length === 0) return { isClosed: false, reason: null };

  // Obter data atual no timezone do estabelecimento
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  const todayStr = formatter.format(now); // "YYYY-MM-DD"

  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" });
  const todayWeekday = dayFormatter.format(now).toLowerCase(); // "sunday", "monday", etc.

  const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, day: "numeric", month: "numeric", year: "numeric" });
  const parts = dateFormatter.formatToParts(now);
  const todayDay = parseInt(parts.find(p => p.type === "day")?.value || "0");
  const todayMonth = parseInt(parts.find(p => p.type === "month")?.value || "0");
  const todayYear = parseInt(parts.find(p => p.type === "year")?.value || "0");

  for (const closure of closures) {
    if (closure.type === "specific_date" && closure.specificDate) {
      // Comparar data específica
      const closureDateStr = typeof closure.specificDate === "string"
        ? closure.specificDate
        : closure.specificDate.toISOString().split("T")[0];
      if (closureDateStr === todayStr) {
        return { isClosed: true, reason: closure.reason };
      }
    } else if (closure.type === "recurring" && closure.recurringRule) {
      const rule = closure.recurringRule;

      // Regras "every_*" — todo dia da semana
      if (rule.startsWith("every_")) {
        const ruleDay = rule.replace("every_", "");
        if (todayWeekday === ruleDay) {
          return { isClosed: true, reason: closure.reason };
        }
      }

      // Regras "last_*" — último dia da semana do mês
      if (rule.startsWith("last_")) {
        const ruleDay = rule.replace("last_", "");
        if (todayWeekday === ruleDay) {
          // Verificar se é o último desse dia no mês
          const daysInMonth = new Date(todayYear, todayMonth, 0).getDate();
          if (todayDay + 7 > daysInMonth) {
            return { isClosed: true, reason: closure.reason };
          }
        }
      }

      // Regras "first_*" — primeiro dia da semana do mês
      if (rule.startsWith("first_")) {
        const ruleDay = rule.replace("first_", "");
        if (todayWeekday === ruleDay && todayDay <= 7) {
          return { isClosed: true, reason: closure.reason };
        }
      }
    }
  }

  return { isClosed: false, reason: null };
}


// ==================== CHANGELOG ====================

export async function getChangelogVersions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(changelogVersions).orderBy(desc(changelogVersions.createdAt));
}

export async function getChangelogVersionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(changelogVersions).where(eq(changelogVersions.id, id)).limit(1);
  return rows[0] || null;
}

export async function getPublishedChangelogVersions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(changelogVersions)
    .where(eq(changelogVersions.isPublished, true))
    .orderBy(desc(changelogVersions.publishedAt));
}

export async function createChangelogVersion(data: InsertChangelogVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(changelogVersions).values(data);
  return result[0].insertId;
}

export async function updateChangelogVersion(id: number, data: Partial<InsertChangelogVersion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(changelogVersions).set(data).where(eq(changelogVersions.id, id));
}

export async function deleteChangelogVersion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete likes and entries first, then version
  await db.delete(changelogLikes).where(eq(changelogLikes.versionId, id));
  await db.delete(changelogEntries).where(eq(changelogEntries.versionId, id));
  await db.delete(changelogVersions).where(eq(changelogVersions.id, id));
}

export async function getChangelogLikeStats(versionIds: number[], establishmentId?: number | null) {
  const db = await getDb();
  const stats = new Map<number, { likeCount: number; likedByCurrentEstablishment: boolean }>();
  versionIds.forEach((versionId) => {
    stats.set(versionId, { likeCount: 0, likedByCurrentEstablishment: false });
  });

  if (!db || versionIds.length === 0) return stats;

  const countRows = await db
    .select({
      versionId: changelogLikes.versionId,
      likeCount: sql<number>`count(*)`,
    })
    .from(changelogLikes)
    .where(inArray(changelogLikes.versionId, versionIds))
    .groupBy(changelogLikes.versionId);

  for (const row of countRows) {
    stats.set(row.versionId, {
      ...(stats.get(row.versionId) ?? { likeCount: 0, likedByCurrentEstablishment: false }),
      likeCount: Number(row.likeCount ?? 0),
    });
  }

  if (establishmentId) {
    const likedRows = await db
      .select({ versionId: changelogLikes.versionId })
      .from(changelogLikes)
      .where(and(
        eq(changelogLikes.establishmentId, establishmentId),
        inArray(changelogLikes.versionId, versionIds),
      ));

    for (const row of likedRows) {
      stats.set(row.versionId, {
        ...(stats.get(row.versionId) ?? { likeCount: 0, likedByCurrentEstablishment: false }),
        likedByCurrentEstablishment: true,
      });
    }
  }

  return stats;
}

export async function toggleChangelogLike(versionId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const versionRows = await db
    .select({ id: changelogVersions.id })
    .from(changelogVersions)
    .where(and(
      eq(changelogVersions.id, versionId),
      eq(changelogVersions.isPublished, true),
    ))
    .limit(1);

  if (!versionRows[0]) return null;

  const existing = await db
    .select({ id: changelogLikes.id })
    .from(changelogLikes)
    .where(and(
      eq(changelogLikes.versionId, versionId),
      eq(changelogLikes.establishmentId, establishmentId),
    ))
    .limit(1);

  const liked = !existing[0];
  if (existing[0]) {
    await db.delete(changelogLikes).where(eq(changelogLikes.id, existing[0].id));
  } else {
    await db.insert(changelogLikes).values({ versionId, establishmentId });
  }

  const stats = await getChangelogLikeStats([versionId], establishmentId);
  const stat = stats.get(versionId) ?? { likeCount: 0, likedByCurrentEstablishment: liked };

  return {
    liked: stat.likedByCurrentEstablishment,
    likeCount: stat.likeCount,
  };
}

export async function getChangelogEntries(versionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(changelogEntries)
    .where(eq(changelogEntries.versionId, versionId))
    .orderBy(asc(changelogEntries.sortOrder), asc(changelogEntries.id));
}

export async function createChangelogEntry(data: InsertChangelogEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(changelogEntries).values(data);
  return result[0].insertId;
}

export async function updateChangelogEntry(id: number, data: Partial<InsertChangelogEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(changelogEntries).set(data).where(eq(changelogEntries.id, id));
}

export async function deleteChangelogEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(changelogEntries).where(eq(changelogEntries.id, id));
}

export async function getPublishedChangelogWithEntries(establishmentId?: number | null) {
  const db = await getDb();
  if (!db) return [];

  const versions = await db.select().from(changelogVersions)
    .where(eq(changelogVersions.isPublished, true))
    .orderBy(desc(changelogVersions.publishedAt));

  if (versions.length === 0) return [];

  const versionIds = versions.map(v => v.id);
  const allEntries = await db.select().from(changelogEntries)
    .where(inArray(changelogEntries.versionId, versionIds))
    .orderBy(asc(changelogEntries.sortOrder), asc(changelogEntries.id));
  const likeStats = await getChangelogLikeStats(versionIds, establishmentId);

  return versions.map(v => {
    const stats = likeStats.get(v.id) ?? { likeCount: 0, likedByCurrentEstablishment: false };

    return {
      ...v,
      likeCount: stats.likeCount,
      likedByCurrentEstablishment: stats.likedByCurrentEstablishment,
      entries: allEntries.filter(e => e.versionId === v.id),
    };
  });
}


// ==================== CHAT SHORTCUTS ====================

export async function getChatShortcuts(establishmentId: number) {
  const db = await getDb();
  return db!.select().from(chatShortcuts)
    .where(eq(chatShortcuts.establishmentId, establishmentId))
    .orderBy(asc(chatShortcuts.sortOrder), asc(chatShortcuts.id));
}

export async function reorderChatShortcuts(establishmentId: number, orderedIds: number[]) {
  const db = await getDb();
  const promises = orderedIds.map((id, index) =>
    db!.update(chatShortcuts)
      .set({ sortOrder: index })
      .where(and(eq(chatShortcuts.id, id), eq(chatShortcuts.establishmentId, establishmentId)))
  );
  await Promise.all(promises);
}

export async function createChatShortcut(data: { establishmentId: number; title: string; message: string }) {
  const db = await getDb();
  const [result] = await db!.insert(chatShortcuts).values({
    establishmentId: data.establishmentId,
    title: data.title,
    message: data.message,
  });
  return { id: result.insertId };
}

export async function updateChatShortcut(id: number, establishmentId: number, data: { title?: string; message?: string }) {
  const db = await getDb();
  await db!.update(chatShortcuts)
    .set(data)
    .where(and(eq(chatShortcuts.id, id), eq(chatShortcuts.establishmentId, establishmentId)));
}

export async function deleteChatShortcut(id: number, establishmentId: number) {
  const db = await getDb();
  await db!.delete(chatShortcuts)
    .where(and(eq(chatShortcuts.id, id), eq(chatShortcuts.establishmentId, establishmentId)));
}


// ============ ORDER LOGS ============

export interface OrderLogEntry {
  establishmentId?: number | null;
  orderId?: number | null;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  level: 'info' | 'warn' | 'error';
  event: string;
  message: string;
  details?: Record<string, unknown> | null;
  source?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createOrderLog(entry: OrderLogEntry) {
  const db = await getDb();
  try {
    await db!.insert(orderLogs).values({
      establishmentId: entry.establishmentId ?? null,
      orderId: entry.orderId ?? null,
      customerId: entry.customerId ?? null,
      customerName: entry.customerName ?? null,
      customerPhone: entry.customerPhone ?? null,
      level: entry.level,
      event: entry.event,
      message: entry.message,
      details: entry.details ?? null,
      source: entry.source ?? 'server',
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (err) {
    // Nunca deixar o log falhar e impedir o pedido
    logger.error('[OrderLog] Falha ao salvar log:', err);
  }
}

export async function getOrderLogs(filters: {
  establishmentId?: number;
  orderId?: number;
  level?: 'info' | 'warn' | 'error';
  event?: string;
  source?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  const conditions: any[] = [];

  if (filters.establishmentId) {
    conditions.push(eq(orderLogs.establishmentId, filters.establishmentId));
  }
  if (filters.orderId) {
    conditions.push(eq(orderLogs.orderId, filters.orderId));
  }
  if (filters.level) {
    conditions.push(eq(orderLogs.level, filters.level));
  }
  if (filters.event) {
    conditions.push(eq(orderLogs.event, filters.event));
  }
  if (filters.source) {
    conditions.push(eq(orderLogs.source, filters.source));
  }

  const query = db!.select().from(orderLogs);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await query
    .where(whereClause)
    .orderBy(desc(orderLogs.createdAt))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);

  return results;
}

export async function getOrderLogsCount(filters: {
  establishmentId?: number;
  level?: 'info' | 'warn' | 'error';
  event?: string;
}) {
  const db = await getDb();
  const conditions: any[] = [];

  if (filters.establishmentId) {
    conditions.push(eq(orderLogs.establishmentId, filters.establishmentId));
  }
  if (filters.level) {
    conditions.push(eq(orderLogs.level, filters.level));
  }
  if (filters.event) {
    conditions.push(eq(orderLogs.event, filters.event));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db!.select({ count: sql<number>`count(*)` })
    .from(orderLogs)
    .where(whereClause);

  return result[0]?.count ?? 0;
}


// ─── Paytime Transactions ──────────────────────────────────────

export async function createPaytimeTransaction(data: {
  establishmentId: number;
  orderId: number | null;
  paytimeTransactionId: string;
  paytimeGatewayKey: string | null;
  referenceId: string;
  paymentType: "PIX" | "CREDIT_CARD" | "BOLETO";
  status: "PENDING" | "APPROVED" | "CANCELLED" | "REFUNDED" | "EXPIRED" | "PAID" | "FAILED" | "WAITING_ANTIFRAUD";
  amountCents: number;
  emv: string | null;
  antifraudId?: string | null;
  antifraudSession?: string | null;
  antifraudRequired?: string | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  installments?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(paytimeTransactions).values({
    establishmentId: data.establishmentId,
    orderId: data.orderId,
    paytimeTransactionId: data.paytimeTransactionId,
    paytimeGatewayKey: data.paytimeGatewayKey,
    referenceId: data.referenceId,
    paymentType: data.paymentType,
    status: data.status,
    amountCents: data.amountCents,
    emv: data.emv,
    antifraudId: data.antifraudId ?? null,
    antifraudSession: data.antifraudSession ?? null,
    antifraudRequired: data.antifraudRequired ?? null,
    cardBrand: data.cardBrand ?? null,
    cardLast4: data.cardLast4 ?? null,
    installments: data.installments ?? 1,
  });

  return { id: result[0].insertId };
}

export async function getPaytimeTransactionByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const rows = await db
    .select()
    .from(paytimeTransactions)
    .where(eq(paytimeTransactions.orderId, orderId))
    .orderBy(desc(paytimeTransactions.createdAt))
    .limit(1);

  return rows[0] || undefined;
}

export async function getPaytimeTransactionById(paytimeTransactionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const rows = await db
    .select()
    .from(paytimeTransactions)
    .where(eq(paytimeTransactions.paytimeTransactionId, paytimeTransactionId))
    .limit(1);

  return rows[0] || undefined;
}

export async function updatePaytimeTransactionStatus(
  paytimeTransactionId: string,
  status: "PENDING" | "APPROVED" | "CANCELLED" | "REFUNDED" | "EXPIRED" | "PAID" | "FAILED" | "WAITING_ANTIFRAUD",
  paidAt?: Date,
  statusOrigin?: "webhook" | "fallback" | "manual"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { status };
  if (paidAt) {
    updateData.paidAt = paidAt;
  }
  if (statusOrigin) {
    updateData.statusOrigin = statusOrigin;
  }

  await db
    .update(paytimeTransactions)
    .set(updateData)
    .where(eq(paytimeTransactions.paytimeTransactionId, paytimeTransactionId));
}

export async function getPaytimeTransactionByReferenceId(referenceId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const rows = await db
    .select()
    .from(paytimeTransactions)
    .where(eq(paytimeTransactions.referenceId, referenceId))
    .orderBy(desc(paytimeTransactions.createdAt))
    .limit(1);

  return rows[0] || undefined;
}

export async function updatePaytimeTransactionId(
  oldPaytimeTransactionId: string,
  newPaytimeTransactionId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(paytimeTransactions)
    .set({ paytimeTransactionId: newPaytimeTransactionId })
    .where(eq(paytimeTransactions.paytimeTransactionId, oldPaytimeTransactionId));
}

export async function listPaytimeTransactions(
  establishmentId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(paytimeTransactions)
    .where(eq(paytimeTransactions.establishmentId, establishmentId))
    .orderBy(desc(paytimeTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Busca transações PENDING que estão há mais de X minutos sem atualização de webhook.
 * Usada pelo mecanismo de fallback para verificar status na API Paytime.
 * Implementa backoff exponencial: só retorna transações cujo tempo desde a última
 * verificação é maior que 2^fallbackAttempts minutos (mín 2min, máx ~32min).
 */
export async function getPendingPaytimeTransactionsForFallback(
  minAgeMinutes: number = 3,
  maxAttempts: number = 10
) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - minAgeMinutes * 60 * 1000);

  const rows = await db
    .select()
    .from(paytimeTransactions)
    .where(
      and(
        eq(paytimeTransactions.status, "PENDING"),
        lt(paytimeTransactions.createdAt, cutoff),
        lt(paytimeTransactions.fallbackAttempts, maxAttempts)
      )
    )
    .orderBy(asc(paytimeTransactions.createdAt))
    .limit(20);

  // Filtrar com backoff exponencial: só verificar se passou tempo suficiente
  const now = Date.now();
  return rows.filter(tx => {
    const attempts = tx.fallbackAttempts ?? 0;
    // Backoff: 2min, 4min, 8min, 16min, 32min...
    const backoffMs = Math.min(Math.pow(2, attempts) * 2 * 60 * 1000, 32 * 60 * 1000);
    const lastCheck = tx.fallbackCheckedAt ? tx.fallbackCheckedAt.getTime() : tx.createdAt.getTime();
    return (now - lastCheck) >= backoffMs;
  });
}

/**
 * Atualiza os campos de controle do fallback após uma verificação.
 */
export async function updatePaytimeFallbackAttempt(
  paytimeTransactionId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(paytimeTransactions)
    .set({
      fallbackCheckedAt: new Date(),
      fallbackAttempts: sql`${paytimeTransactions.fallbackAttempts} + 1`,
    })
    .where(eq(paytimeTransactions.paytimeTransactionId, paytimeTransactionId));
}


// ============================================================
// GESTÃO DE CLIENTES - Queries para a página de clientes
// ============================================================

export async function getCustomerStats(establishmentId: number, periodStart: Date, periodEnd: Date) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Total de clientes do estabelecimento
  const [totalResult] = await database.select({ count: sql<number>`count(*)` })
    .from(pdvCustomers)
    .where(eq(pdvCustomers.establishmentId, establishmentId));
  const totalClients = totalResult?.count ?? 0;

  // Novos clientes no período
  const [newResult] = await database.select({ count: sql<number>`count(*)` })
    .from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.establishmentId, establishmentId),
      gte(pdvCustomers.createdAt, periodStart),
      lte(pdvCustomers.createdAt, periodEnd)
    ));
  const newClients = newResult?.count ?? 0;

  // Recorrentes: clientes com mais de 1 pedido no período
  const recurrentRows = await database.execute(sql`
    SELECT COUNT(*) as count FROM (
      SELECT o.customerPhone
      FROM orders o
      WHERE o.establishmentId = ${establishmentId}
        AND o.customerPhone IS NOT NULL AND o.customerPhone != ''
        AND o.status NOT IN ('cancelled')
        AND o.createdAt >= ${periodStart}
        AND o.createdAt <= ${periodEnd}
      GROUP BY o.customerPhone
      HAVING COUNT(*) > 1
    ) as recurrent
  `);
  const recurrentClients = Number((recurrentRows as any)[0]?.[0]?.count ?? 0);

  // Em risco: clientes que não fizeram pedido nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const atRiskRows = await database.execute(sql`
    SELECT COUNT(*) as count FROM pdv_customers pc
    WHERE pc.establishmentId = ${establishmentId}
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.customerPhone = pc.phone
          AND o.establishmentId = ${establishmentId}
          AND o.status NOT IN ('cancelled')
          AND o.createdAt >= ${thirtyDaysAgo}
      )
      AND EXISTS (
        SELECT 1 FROM orders o2
        WHERE o2.customerPhone = pc.phone
          AND o2.establishmentId = ${establishmentId}
          AND o2.status NOT IN ('cancelled')
      )
  `);
  const atRiskClients = Number((atRiskRows as any)[0]?.[0]?.count ?? 0);

  // Inativos: clientes que não fizeram pedido nos últimos 60 dias
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const inactiveRows = await database.execute(sql`
    SELECT COUNT(*) as count FROM pdv_customers pc
    WHERE pc.establishmentId = ${establishmentId}
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.customerPhone = pc.phone
          AND o.establishmentId = ${establishmentId}
          AND o.status NOT IN ('cancelled')
          AND o.createdAt >= ${sixtyDaysAgo}
      )
      AND EXISTS (
        SELECT 1 FROM orders o2
        WHERE o2.customerPhone = pc.phone
          AND o2.establishmentId = ${establishmentId}
          AND o2.status NOT IN ('cancelled')
      )
  `);
  const inactiveClients = Number((inactiveRows as any)[0]?.[0]?.count ?? 0);

  return {
    total: totalClients,
    new: newClients,
    recurrent: recurrentClients,
    atRisk: atRiskClients,
    inactive: inactiveClients,
  };
}

export async function listCustomersPaginated(
  establishmentId: number,
  page: number = 1,
  perPage: number = 25,
  search?: string,
  customerType?: 'new' | 'recurrent' | 'atRisk' | 'inactive',
  periodStart?: Date,
  periodEnd?: Date,
  sortBy?: 'name' | 'totalOrders' | 'lastOrderDate' | 'totalSpent',
  sortDir?: 'asc' | 'desc'
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const offset = (page - 1) * perPage;

  // Build WHERE conditions
  let whereConditions = sql`pc.establishmentId = ${establishmentId}`;
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    whereConditions = sql`${whereConditions} AND (pc.name LIKE ${searchTerm} OR pc.phone LIKE ${searchTerm})`;
  }

  // Add customerType filter
  if (customerType === 'new' && periodStart && periodEnd) {
    whereConditions = sql`${whereConditions} AND pc.createdAt >= ${periodStart} AND pc.createdAt <= ${periodEnd}`;
  } else if (customerType === 'recurrent' && periodStart && periodEnd) {
    whereConditions = sql`${whereConditions} AND pc.phone IN (
      SELECT o.customerPhone FROM orders o
      WHERE o.establishmentId = ${establishmentId}
        AND o.customerPhone IS NOT NULL AND o.customerPhone != ''
        AND o.status NOT IN ('cancelled')
        AND o.createdAt >= ${periodStart}
        AND o.createdAt <= ${periodEnd}
      GROUP BY o.customerPhone
      HAVING COUNT(*) > 1
    )`;
  } else if (customerType === 'atRisk') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    whereConditions = sql`${whereConditions}
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.customerPhone = pc.phone
          AND o.establishmentId = ${establishmentId}
          AND o.status NOT IN ('cancelled')
          AND o.createdAt >= ${thirtyDaysAgo}
      )
      AND EXISTS (
        SELECT 1 FROM orders o2
        WHERE o2.customerPhone = pc.phone
          AND o2.establishmentId = ${establishmentId}
          AND o2.status NOT IN ('cancelled')
      )`;
  } else if (customerType === 'inactive') {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    whereConditions = sql`${whereConditions}
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.customerPhone = pc.phone
          AND o.establishmentId = ${establishmentId}
          AND o.status NOT IN ('cancelled')
          AND o.createdAt >= ${sixtyDaysAgo}
      )
      AND EXISTS (
        SELECT 1 FROM orders o2
        WHERE o2.customerPhone = pc.phone
          AND o2.establishmentId = ${establishmentId}
          AND o2.status NOT IN ('cancelled')
      )`;
  }

  // Get customers with last order date and total orders
  const rows = await database.execute(sql`
    SELECT
      pc.id,
      pc.name,
      pc.phone,
      pc.street,
      pc.number,
      pc.complement,
      pc.neighborhood,
      pc.reference,
      pc.notes,
      pc.createdAt,
      pc.updatedAt,
      (SELECT MAX(o.createdAt) FROM orders o WHERE o.customerPhone = pc.phone AND o.establishmentId = ${establishmentId} AND o.status NOT IN ('cancelled')) as lastOrderDate,
      (SELECT COUNT(*) FROM orders o WHERE o.customerPhone = pc.phone AND o.establishmentId = ${establishmentId} AND o.status NOT IN ('cancelled')) as totalOrders,
      (SELECT COALESCE(SUM(CAST(o.total AS DECIMAL(10,2))), 0) FROM orders o WHERE o.customerPhone = pc.phone AND o.establishmentId = ${establishmentId} AND o.status NOT IN ('cancelled')) as totalSpent
    FROM pdv_customers pc
    WHERE ${whereConditions}
    ORDER BY ${sortBy === 'totalOrders' ? sql`totalOrders` : sortBy === 'lastOrderDate' ? sql`lastOrderDate` : sortBy === 'totalSpent' ? sql`totalSpent` : sql`pc.name`} ${sortDir === 'desc' ? sql`DESC` : sql`ASC`}
    LIMIT ${perPage} OFFSET ${offset}
  `);

  // Get total count
  const countRows = await database.execute(sql`
    SELECT COUNT(*) as total FROM pdv_customers pc WHERE ${whereConditions}
  `);
  const total = Number((countRows as any)[0]?.[0]?.total ?? 0);

  return {
    customers: (rows as any)[0] || [],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getCustomerProfile(establishmentId: number, customerId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get customer data
  const [customer] = await database.select().from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.id, customerId),
      eq(pdvCustomers.establishmentId, establishmentId)
    ));

  if (!customer) return null;

  // Get stats: total orders, avg ticket, first and last order
  const statsRows = await database.execute(sql`
    SELECT
      COUNT(*) as totalOrders,
      COALESCE(AVG(CAST(o.total AS DECIMAL(10,2))), 0) as avgTicket,
      MIN(o.createdAt) as firstOrder,
      MAX(o.createdAt) as lastOrder,
      COALESCE(SUM(CAST(o.total AS DECIMAL(10,2))), 0) as totalRevenue
    FROM orders o
    WHERE o.customerPhone = ${customer.phone}
      AND o.establishmentId = ${establishmentId}
      AND o.status NOT IN ('cancelled')
  `);

  const stats = (statsRows as any)[0]?.[0] || {};

  return {
    ...customer,
    stats: {
      totalOrders: Number(stats.totalOrders ?? 0),
      avgTicket: Number(stats.avgTicket ?? 0),
      firstOrder: stats.firstOrder,
      lastOrder: stats.lastOrder,
      totalRevenue: Number(stats.totalRevenue ?? 0),
    }
  };
}

export async function getCustomerOrderHistory(
  establishmentId: number,
  customerPhone: string,
  page: number = 1,
  perPage: number = 10
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const offset = (page - 1) * perPage;

  const rows = await database.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    status: orders.status,
    total: orders.total,
    deliveryType: orders.deliveryType,
    paymentMethod: orders.paymentMethod,
    createdAt: orders.createdAt,
    source: orders.source,
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.customerPhone, customerPhone),
    ))
    .orderBy(desc(orders.createdAt))
    .limit(perPage)
    .offset(offset);

  const [countResult] = await database.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.customerPhone, customerPhone),
    ));

  return {
    orders: rows,
    total: countResult?.count ?? 0,
    page,
    perPage,
  };
}

export async function updateCustomerProfile(
  establishmentId: number,
  customerId: number,
  data: {
    name?: string;
    phone?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    reference?: string;
    notes?: string;
  }
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  await database.update(pdvCustomers).set({
    ...data,
  }).where(and(
    eq(pdvCustomers.id, customerId),
    eq(pdvCustomers.establishmentId, establishmentId)
  ));

  return { success: true };
}

export async function createNewCustomer(
  establishmentId: number,
  data: {
    name: string;
    phone: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    reference?: string;
    notes?: string;
  }
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Check if customer already exists
  const existing = await database.select().from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.establishmentId, establishmentId),
      eq(pdvCustomers.phone, data.phone)
    ));

  if (existing.length > 0) {
    return { success: false, error: 'Cliente com este telefone já existe', existingId: existing[0].id };
  }

  const result = await database.insert(pdvCustomers).values({
    establishmentId,
    ...data,
  });

  return { success: true, id: result[0].insertId };
}


// ==================== DELETE CUSTOMER ====================

export async function deleteCustomer(
  establishmentId: number,
  customerId: number
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Verify customer belongs to this establishment
  const [customer] = await database.select().from(pdvCustomers)
    .where(and(
      eq(pdvCustomers.id, customerId),
      eq(pdvCustomers.establishmentId, establishmentId)
    ));

  if (!customer) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  await database.delete(pdvCustomers).where(and(
    eq(pdvCustomers.id, customerId),
    eq(pdvCustomers.establishmentId, establishmentId)
  ));

  return { success: true };
}


// ==================== UPSELL SUGGESTIONS (NEW - uses fixed_suggestions & linked_suggestions) ====================

function isScheduleActiveFromRow(row: any): boolean {
  // Works with both fixed_suggestions and linked_suggestions rows
  // which have scheduleEnabled, scheduleDays, scheduleStartTime, scheduleEndTime fields
  if (!row.scheduleEnabled) return true;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Check if current day is in the schedule days
  if (row.scheduleDays && Array.isArray(row.scheduleDays) && row.scheduleDays.length > 0) {
    if (!row.scheduleDays.includes(dayOfWeek)) return false;
  }

  // Check time range
  if (row.scheduleStartTime && row.scheduleEndTime) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startH, startM] = row.scheduleStartTime.split(':').map(Number);
    const [endH, endM] = row.scheduleEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Normal range (e.g., 11:00 - 14:00)
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false;
    } else {
      // Overnight range (e.g., 22:00 - 02:00)
      if (currentMinutes < startMinutes && currentMinutes > endMinutes) return false;
    }
  }

  return true;
}

export async function getUpsellSuggestions(
  establishmentId: number,
  cartProductIds: number[],
  cartCategoryIds: number[],
  limit: number = 9
) {
  const db = await getDb();
  if (!db) return [];

  const result: any[] = [];
  const addedProductIds = new Set<number>(cartProductIds);

  // 1. LINKED SUGGESTIONS (priority) — check if any cart product is a trigger
  if (cartProductIds.length > 0) {
    const linkedRows = await db.select()
      .from(linkedSuggestions)
      .where(and(
        eq(linkedSuggestions.establishmentId, establishmentId),
        eq(linkedSuggestions.isActive, true),
        sql`${linkedSuggestions.triggerProductId} IN (${sql.join(cartProductIds.map(id => sql`${id}`), sql`, `)})`
      ));

    for (const linked of linkedRows) {
      // Check schedule
      if (!isScheduleActiveFromRow(linked)) continue;

      // Get suggested items for this trigger
      const items = await db.select()
        .from(linkedSuggestionItems)
        .where(eq(linkedSuggestionItems.linkedSuggestionId, linked.id));

      for (const item of items) {
        if (addedProductIds.has(item.suggestedProductId)) continue;
        if (result.length >= limit) break;

        const [product] = await db.select().from(products).where(and(
          eq(products.id, item.suggestedProductId),
          eq(products.status, 'active')
        ));
        if (product) {
          result.push(product);
          addedProductIds.add(product.id);
        }
      }
      if (result.length >= limit) break;
    }
  }

  if (result.length >= limit) return result.slice(0, limit);

  // 2. FIXED SUGGESTIONS — products and categories from fixed_suggestions table
  const fixedRows = await db.select()
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.establishmentId, establishmentId),
      eq(fixedSuggestions.isActive, true)
    ))
    .orderBy(asc(fixedSuggestions.sortOrder));

  const fixedIds = fixedRows.map((fixed) => fixed.id);
  const cartCategoryIdSet = new Set<number>(
    cartCategoryIds.filter((id): id is number => Number.isInteger(id))
  );
  const scopeRows = fixedIds.length > 0
    ? await db.select({
        fixedSuggestionId: fixedSuggestionCategoryScopes.fixedSuggestionId,
        categoryId: fixedSuggestionCategoryScopes.categoryId,
      })
      .from(fixedSuggestionCategoryScopes)
      .where(inArray(fixedSuggestionCategoryScopes.fixedSuggestionId, fixedIds))
    : [];
  const scopesByFixedSuggestionId = new Map<number, Set<number>>();
  for (const scope of scopeRows) {
    if (!scopesByFixedSuggestionId.has(scope.fixedSuggestionId)) {
      scopesByFixedSuggestionId.set(scope.fixedSuggestionId, new Set<number>());
    }
    scopesByFixedSuggestionId.get(scope.fixedSuggestionId)!.add(scope.categoryId);
  }
  const isFixedSuggestionAllowedForCart = (fixedSuggestionId: number) => {
    const scopedCategoryIds = scopesByFixedSuggestionId.get(fixedSuggestionId);
    if (!scopedCategoryIds || scopedCategoryIds.size === 0) return true;
    if (cartCategoryIdSet.size === 0) return false;
    for (const categoryId of Array.from(scopedCategoryIds)) {
      if (cartCategoryIdSet.has(categoryId)) return true;
    }
    return false;
  };

  for (const fixed of fixedRows) {
    if (result.length >= limit) break;
    if (!isFixedSuggestionAllowedForCart(fixed.id)) continue;

    // Check schedule
    if (!isScheduleActiveFromRow(fixed)) continue;

    if (fixed.type === 'product' && fixed.productId) {
      if (addedProductIds.has(fixed.productId)) continue;

      const [product] = await db.select().from(products).where(and(
        eq(products.id, fixed.productId),
        eq(products.status, 'active')
      ));
      if (product) {
        result.push(product);
        addedProductIds.add(product.id);
      }
    } else if (fixed.type === 'category' && fixed.categoryId) {
      // Get up to 9 active products from this category
      const catProducts = await db.select()
        .from(products)
        .where(and(
          eq(products.categoryId, fixed.categoryId),
          eq(products.status, 'active')
        ))
        .orderBy(asc(products.sortOrder))
        .limit(9);

      for (const product of catProducts) {
        if (addedProductIds.has(product.id)) continue;
        if (result.length >= limit) break;
        result.push(product);
        addedProductIds.add(product.id);
      }
    }
  }

  // Enriquecer cada produto com flag hasComplements (combo ou complementGroups)
  const enriched = await Promise.all(
    result.slice(0, limit).map(async (product) => {
      if (product.isCombo) {
        return { ...product, hasComplements: true };
      }
      // Verificar se tem complementGroups ativos
      const groups = await db.select({ id: complementGroups.id })
        .from(complementGroups)
        .where(and(
          eq(complementGroups.productId, product.id),
          eq(complementGroups.isActive, true)
        ))
        .limit(1);
      return { ...product, hasComplements: groups.length > 0 };
    })
  );

  return enriched;
}


// ============================================================
// Fixed Suggestions (Sempre sugerir)
// ============================================================

export async function getFixedSuggestions(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select()
    .from(fixedSuggestions)
    .where(eq(fixedSuggestions.establishmentId, establishmentId))
    .orderBy(asc(fixedSuggestions.sortOrder));

  const fixedIds = rows.map((row) => row.id);
  const scopeRows = fixedIds.length > 0
    ? await db.select({
        fixedSuggestionId: fixedSuggestionCategoryScopes.fixedSuggestionId,
        categoryId: fixedSuggestionCategoryScopes.categoryId,
        categoryName: categories.name,
      })
      .from(fixedSuggestionCategoryScopes)
      .innerJoin(categories, eq(categories.id, fixedSuggestionCategoryScopes.categoryId))
      .where(and(
        inArray(fixedSuggestionCategoryScopes.fixedSuggestionId, fixedIds),
        eq(categories.establishmentId, establishmentId)
      ))
      .orderBy(asc(categories.name))
    : [];
  const categoryScopesByFixedSuggestionId = new Map<number, { categoryId: number; categoryName: string }[]>();
  for (const scope of scopeRows) {
    const current = categoryScopesByFixedSuggestionId.get(scope.fixedSuggestionId) || [];
    current.push({ categoryId: scope.categoryId, categoryName: scope.categoryName });
    categoryScopesByFixedSuggestionId.set(scope.fixedSuggestionId, current);
  }

  // Enrich with product/category data
  const enriched = [];
  for (const row of rows) {
    if (row.type === 'product' && row.productId) {
      const [product] = await db.select().from(products).where(eq(products.id, row.productId));
      if (product) {
        const [cat] = product.categoryId
          ? await db.select().from(categories).where(eq(categories.id, product.categoryId))
          : [null];
        enriched.push({
          ...row,
          name: product.name,
          image: product.images?.[0] || null,
          price: product.price,
          categoryName: cat?.name || null,
          activeProductCount: null,
          productStatus: product.status,
          categoryScopes: categoryScopesByFixedSuggestionId.get(row.id) || [],
        });
      }
    } else if (row.type === 'category' && row.categoryId) {
      const [cat] = await db.select().from(categories).where(eq(categories.id, row.categoryId));
      if (cat) {
        const activeProducts = await db.select({ count: sql<number>`count(*)` })
          .from(products)
          .where(and(
            eq(products.categoryId, cat.id),
            eq(products.status, 'active')
          ));
        enriched.push({
          ...row,
          name: cat.name,
          image: null,
          price: null,
          categoryName: null,
          activeProductCount: Number(activeProducts[0]?.count || 0),
          productStatus: null,
          categoryScopes: categoryScopesByFixedSuggestionId.get(row.id) || [],
        });
      }
    }
  }

  return enriched;
}

export async function addFixedSuggestion(data: {
  establishmentId: number;
  type: 'product' | 'category';
  productId?: number;
  categoryId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check for duplicates
  const conditions = [
    eq(fixedSuggestions.establishmentId, data.establishmentId),
    eq(fixedSuggestions.type, data.type),
  ];
  if (data.type === 'product' && data.productId) {
    conditions.push(eq(fixedSuggestions.productId, data.productId));
  } else if (data.type === 'category' && data.categoryId) {
    conditions.push(eq(fixedSuggestions.categoryId, data.categoryId));
  }
  const existing = await db.select().from(fixedSuggestions).where(and(...conditions));
  if (existing.length > 0) {
    throw new Error('Esta sugestão já existe');
  }

  // Get max sortOrder
  const [maxSort] = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${fixedSuggestions.sortOrder}), -1)` })
    .from(fixedSuggestions)
    .where(eq(fixedSuggestions.establishmentId, data.establishmentId));

  const result = await db.insert(fixedSuggestions).values({
    establishmentId: data.establishmentId,
    type: data.type,
    productId: data.type === 'product' ? data.productId : null,
    categoryId: data.type === 'category' ? data.categoryId : null,
    sortOrder: (maxSort?.maxOrder ?? -1) + 1,
  });

  return result[0].insertId;
}

export async function getFixedSuggestionCategoryScopes(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const [fixed] = await db.select({ id: fixedSuggestions.id })
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.id, id),
      eq(fixedSuggestions.establishmentId, establishmentId)
    ))
    .limit(1);
  if (!fixed) return [];

  return db.select({
    categoryId: fixedSuggestionCategoryScopes.categoryId,
    categoryName: categories.name,
  })
    .from(fixedSuggestionCategoryScopes)
    .innerJoin(categories, eq(categories.id, fixedSuggestionCategoryScopes.categoryId))
    .where(and(
      eq(fixedSuggestionCategoryScopes.fixedSuggestionId, id),
      eq(categories.establishmentId, establishmentId)
    ))
    .orderBy(asc(categories.name));
}

export async function setFixedSuggestionCategoryScopes(id: number, establishmentId: number, categoryIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [fixed] = await db.select({ id: fixedSuggestions.id })
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.id, id),
      eq(fixedSuggestions.establishmentId, establishmentId)
    ))
    .limit(1);
  if (!fixed) {
    throw new Error('Sugestão fixa não encontrada');
  }

  const uniqueCategoryIds = Array.from(new Set(
    categoryIds.filter((categoryId) => Number.isInteger(categoryId) && categoryId > 0)
  ));

  if (uniqueCategoryIds.length > 0) {
    const validCategories = await db.select({ id: categories.id })
      .from(categories)
      .where(and(
        eq(categories.establishmentId, establishmentId),
        eq(categories.isActive, true),
        eq(categories.version, 'published'),
        inArray(categories.id, uniqueCategoryIds)
      ));
    if (validCategories.length !== uniqueCategoryIds.length) {
      throw new Error('Uma ou mais categorias selecionadas são inválidas para este estabelecimento');
    }
  }

  await db.delete(fixedSuggestionCategoryScopes)
    .where(eq(fixedSuggestionCategoryScopes.fixedSuggestionId, id));

  if (uniqueCategoryIds.length > 0) {
    const values: InsertFixedSuggestionCategoryScope[] = uniqueCategoryIds.map((categoryId) => ({
      fixedSuggestionId: id,
      categoryId,
    }));
    await db.insert(fixedSuggestionCategoryScopes).values(values);
  }
}

export async function removeFixedSuggestion(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(fixedSuggestionCategoryScopes)
    .where(eq(fixedSuggestionCategoryScopes.fixedSuggestionId, id));

  await db.delete(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.id, id),
      eq(fixedSuggestions.establishmentId, establishmentId)
    ));
}

export async function toggleFixedSuggestion(id: number, establishmentId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(fixedSuggestions)
    .set({ isActive })
    .where(and(
      eq(fixedSuggestions.id, id),
      eq(fixedSuggestions.establishmentId, establishmentId)
    ));
}

export async function reorderFixedSuggestions(establishmentId: number, orderedIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(fixedSuggestions)
      .set({ sortOrder: i })
      .where(and(
        eq(fixedSuggestions.id, orderedIds[i]),
        eq(fixedSuggestions.establishmentId, establishmentId)
      ));
  }
}

export async function updateFixedSuggestionSchedule(
  id: number,
  establishmentId: number,
  schedule: {
    scheduleEnabled: boolean;
    scheduleDays?: number[];
    scheduleStartTime?: string;
    scheduleEndTime?: string;
    scheduleLabel?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(fixedSuggestions)
    .set({
      scheduleEnabled: schedule.scheduleEnabled,
      scheduleDays: schedule.scheduleEnabled ? schedule.scheduleDays : null,
      scheduleStartTime: schedule.scheduleEnabled ? schedule.scheduleStartTime : null,
      scheduleEndTime: schedule.scheduleEnabled ? schedule.scheduleEndTime : null,
      scheduleLabel: schedule.scheduleEnabled ? schedule.scheduleLabel : null,
    })
    .where(and(
      eq(fixedSuggestions.id, id),
      eq(fixedSuggestions.establishmentId, establishmentId)
    ));
}

export async function getAvailableProductsForSuggestion(establishmentId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];

  // Get already added product IDs
  const existingProducts = await db.select({ productId: fixedSuggestions.productId })
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.establishmentId, establishmentId),
      eq(fixedSuggestions.type, 'product')
    ));
  const existingProductIds = existingProducts.map(e => e.productId).filter(Boolean) as number[];

  const conditions = [
    eq(products.establishmentId, establishmentId),
    eq(products.status, 'active'),
    eq(products.version, 'published'),
  ];
  if (existingProductIds.length > 0) {
    conditions.push(sql`${products.id} NOT IN (${sql.join(existingProductIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (search) {
    conditions.push(sql`${products.name} LIKE ${`%${escapeLike(search)}%`}`);
  }

  const rows = await db.select({
    id: products.id,
    name: products.name,
    price: products.price,
    categoryId: products.categoryId,
    images: products.images,
  })
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.name))
    .limit(50);

  // Enrich with category names
  const catIds = Array.from(new Set(rows.map(r => r.categoryId).filter(Boolean))) as number[];
  let catMap: Record<number, string> = {};
  if (catIds.length > 0) {
    const cats = await db.select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(sql`${categories.id} IN (${sql.join(catIds.map(id => sql`${id}`), sql`, `)})`);
    catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
  }

  return rows.map(r => ({
    ...r,
    categoryName: r.categoryId ? catMap[r.categoryId] || null : null,
  }));
}

export async function getAvailableCategoriesForSuggestionScope(establishmentId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(categories.establishmentId, establishmentId),
    eq(categories.isActive, true),
    eq(categories.version, 'published'),
  ];
  if (search) {
    conditions.push(sql`${categories.name} LIKE ${`%${escapeLike(search)}%`}`);
  }

  const cats = await db.select({
    id: categories.id,
    name: categories.name,
  })
    .from(categories)
    .where(and(...conditions))
    .orderBy(asc(categories.name));

  return cats;
}

export async function getAvailableCategoriesForSuggestion(establishmentId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];

  // Get already added category IDs
  const existingCategories = await db.select({ categoryId: fixedSuggestions.categoryId })
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.establishmentId, establishmentId),
      eq(fixedSuggestions.type, 'category')
    ));
  const existingCategoryIds = existingCategories.map(e => e.categoryId).filter(Boolean) as number[];

  const conditions = [
    eq(categories.establishmentId, establishmentId),
    eq(categories.isActive, true),
    eq(categories.version, 'published'),
  ];
  if (existingCategoryIds.length > 0) {
    conditions.push(sql`${categories.id} NOT IN (${sql.join(existingCategoryIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (search) {
    conditions.push(sql`${categories.name} LIKE ${`%${escapeLike(search)}%`}`);
  }

  const cats = await db.select({
    id: categories.id,
    name: categories.name,
  })
    .from(categories)
    .where(and(...conditions))
    .orderBy(asc(categories.name));

  // Count active products per category
  const enriched = [];
  for (const cat of cats) {
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(
        eq(products.categoryId, cat.id),
        eq(products.status, 'active'),
        eq(products.version, 'published')
      ));
    enriched.push({
      ...cat,
      activeProductCount: Number(countResult?.count || 0),
    });
  }

  return enriched;
}

// ============ LINKED SUGGESTIONS (SUGESTÕES VINCULADAS) ============

export async function getLinkedSuggestions(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select()
    .from(linkedSuggestions)
    .where(eq(linkedSuggestions.establishmentId, establishmentId))
    .orderBy(desc(linkedSuggestions.createdAt));

  const enriched = [];
  for (const row of rows) {
    // Get trigger product info
    const [triggerProduct] = await db.select({
      id: products.id,
      name: products.name,
      price: products.price,
      images: products.images,
      categoryId: products.categoryId,
      status: products.status,
    }).from(products).where(eq(products.id, row.triggerProductId));

    if (!triggerProduct) continue;

    // Get trigger product category name
    let triggerCategoryName: string | null = null;
    if (triggerProduct.categoryId) {
      const [cat] = await db.select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, triggerProduct.categoryId));
      triggerCategoryName = cat?.name || null;
    }

    // Get suggested items
    const items = await db.select()
      .from(linkedSuggestionItems)
      .where(eq(linkedSuggestionItems.linkedSuggestionId, row.id))
      .orderBy(asc(linkedSuggestionItems.sortOrder));

    const suggestedProducts = [];
    for (const item of items) {
      const [product] = await db.select({
        id: products.id,
        name: products.name,
        price: products.price,
        images: products.images,
        categoryId: products.categoryId,
        status: products.status,
      }).from(products).where(eq(products.id, item.suggestedProductId));

      if (product) {
        let categoryName: string | null = null;
        if (product.categoryId) {
          const [cat] = await db.select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, product.categoryId));
          categoryName = cat?.name || null;
        }
        suggestedProducts.push({
          itemId: item.id,
          ...product,
          categoryName,
          sortOrder: item.sortOrder,
        });
      }
    }

    enriched.push({
      ...row,
      triggerProduct: {
        ...triggerProduct,
        categoryName: triggerCategoryName,
      },
      suggestedProducts,
    });
  }

  return enriched;
}

export async function addLinkedSuggestion(data: {
  establishmentId: number;
  triggerProductId: number;
  suggestedProductIds: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Validate: trigger cannot be in suggested list
  if (data.suggestedProductIds.includes(data.triggerProductId)) {
    throw new Error('O produto gatilho não pode ser sugerido a si mesmo');
  }

  // Check for duplicate trigger
  const existing = await db.select()
    .from(linkedSuggestions)
    .where(and(
      eq(linkedSuggestions.establishmentId, data.establishmentId),
      eq(linkedSuggestions.triggerProductId, data.triggerProductId)
    ));
  if (existing.length > 0) {
    throw new Error('Já existe uma sugestão vinculada para este produto gatilho');
  }

  // Create the linked suggestion
  const result = await db.insert(linkedSuggestions).values({
    establishmentId: data.establishmentId,
    triggerProductId: data.triggerProductId,
  });

  const linkedSuggestionId = result[0].insertId;

  // Add suggested items
  for (let i = 0; i < data.suggestedProductIds.length; i++) {
    await db.insert(linkedSuggestionItems).values({
      linkedSuggestionId,
      suggestedProductId: data.suggestedProductIds[i],
      sortOrder: i,
    });
  }

  return linkedSuggestionId;
}

export async function removeLinkedSuggestion(id: number, establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Delete items first
  await db.delete(linkedSuggestionItems)
    .where(eq(linkedSuggestionItems.linkedSuggestionId, id));

  // Delete the linked suggestion
  await db.delete(linkedSuggestions)
    .where(and(
      eq(linkedSuggestions.id, id),
      eq(linkedSuggestions.establishmentId, establishmentId)
    ));
}

export async function toggleLinkedSuggestion(id: number, establishmentId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(linkedSuggestions)
    .set({ isActive })
    .where(and(
      eq(linkedSuggestions.id, id),
      eq(linkedSuggestions.establishmentId, establishmentId)
    ));
}

export async function updateLinkedSuggestionSchedule(
  id: number,
  establishmentId: number,
  schedule: {
    scheduleEnabled: boolean;
    scheduleDays?: number[];
    scheduleStartTime?: string;
    scheduleEndTime?: string;
    scheduleLabel?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(linkedSuggestions)
    .set({
      scheduleEnabled: schedule.scheduleEnabled,
      scheduleDays: schedule.scheduleEnabled ? schedule.scheduleDays : null,
      scheduleStartTime: schedule.scheduleEnabled ? schedule.scheduleStartTime : null,
      scheduleEndTime: schedule.scheduleEnabled ? schedule.scheduleEndTime : null,
      scheduleLabel: schedule.scheduleEnabled ? schedule.scheduleLabel : null,
    })
    .where(and(
      eq(linkedSuggestions.id, id),
      eq(linkedSuggestions.establishmentId, establishmentId)
    ));
}

export async function updateLinkedSuggestionItems(
  id: number,
  establishmentId: number,
  suggestedProductIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Verify ownership
  const [linked] = await db.select()
    .from(linkedSuggestions)
    .where(and(
      eq(linkedSuggestions.id, id),
      eq(linkedSuggestions.establishmentId, establishmentId)
    ));
  if (!linked) throw new Error('Sugestão vinculada não encontrada');

  // Validate: trigger cannot be in suggested list
  if (suggestedProductIds.includes(linked.triggerProductId)) {
    throw new Error('O produto gatilho não pode ser sugerido a si mesmo');
  }

  // Delete existing items and re-insert
  await db.delete(linkedSuggestionItems)
    .where(eq(linkedSuggestionItems.linkedSuggestionId, id));

  for (let i = 0; i < suggestedProductIds.length; i++) {
    await db.insert(linkedSuggestionItems).values({
      linkedSuggestionId: id,
      suggestedProductId: suggestedProductIds[i],
      sortOrder: i,
    });
  }
}

export async function getAvailableProductsForLinkedSuggestion(
  establishmentId: number,
  excludeProductIds: number[],
  search?: string
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(products.establishmentId, establishmentId),
    eq(products.status, 'active'),
    eq(products.version, 'published'),
  ];
  if (excludeProductIds.length > 0) {
    conditions.push(sql`${products.id} NOT IN (${sql.join(excludeProductIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (search) {
    conditions.push(sql`${products.name} LIKE ${`%${escapeLike(search)}%`}`);
  }

  const rows = await db.select({
    id: products.id,
    name: products.name,
    price: products.price,
    categoryId: products.categoryId,
    images: products.images,
  })
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.name))
    .limit(50);

  // Enrich with category names
  const catIds = Array.from(new Set(rows.map(r => r.categoryId).filter(Boolean))) as number[];
  let catMap: Record<number, string> = {};
  if (catIds.length > 0) {
    const cats = await db.select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(sql`${categories.id} IN (${sql.join(catIds.map(id => sql`${id}`), sql`, `)})`);
    catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
  }

  return rows.map(r => ({
    ...r,
    categoryName: r.categoryId ? catMap[r.categoryId] || null : null,
  }));
}


// ============ SUGGESTION REVENUE ============

/**
 * Calcula a receita gerada por sugestões nos últimos 30 dias.
 * Lógica: busca todos os productIds que fazem parte de sugestões (fixas ou vinculadas),
 * depois soma o totalPrice dos orderItems desses produtos em pedidos completados nos últimos 30 dias.
 * Também calcula a receita do período anterior (30-60 dias) para calcular a variação percentual.
 */
export async function getSuggestionRevenue(establishmentId: number) {
  const db = await getDb();
  if (!db) return { revenue: 0, previousRevenue: 0, trend: 0 };

  // 1. Buscar todos os productIds que fazem parte de sugestões fixas (tipo product)
  const fixedProductRows = await db.select({ productId: fixedSuggestions.productId })
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.establishmentId, establishmentId),
      eq(fixedSuggestions.type, 'product'),
      isNotNull(fixedSuggestions.productId)
    ));

  // 2. Buscar todos os productIds que fazem parte de sugestões fixas (tipo category) — pegar produtos dessas categorias
  const fixedCategoryRows = await db.select({ categoryId: fixedSuggestions.categoryId })
    .from(fixedSuggestions)
    .where(and(
      eq(fixedSuggestions.establishmentId, establishmentId),
      eq(fixedSuggestions.type, 'category'),
      isNotNull(fixedSuggestions.categoryId)
    ));

  let categoryProductIds: number[] = [];
  const catIds = fixedCategoryRows.map(r => r.categoryId).filter(Boolean) as number[];
  if (catIds.length > 0) {
    const catProducts = await db.select({ id: products.id })
      .from(products)
      .where(and(
        eq(products.establishmentId, establishmentId),
        sql`${products.categoryId} IN (${sql.join(catIds.map(id => sql`${id}`), sql`, `)})`
      ));
    categoryProductIds = catProducts.map(p => p.id);
  }

  // 3. Buscar todos os productIds que fazem parte de sugestões vinculadas (linked suggestion items)
  const linkedRows = await db.select({ suggestedProductId: linkedSuggestionItems.suggestedProductId })
    .from(linkedSuggestionItems)
    .innerJoin(linkedSuggestions, eq(linkedSuggestionItems.linkedSuggestionId, linkedSuggestions.id))
    .where(eq(linkedSuggestions.establishmentId, establishmentId));

  // 4. Unir todos os productIds de sugestões
  const allSuggestionProductIds = Array.from(new Set([
    ...fixedProductRows.map(r => r.productId).filter(Boolean) as number[],
    ...categoryProductIds,
    ...linkedRows.map(r => r.suggestedProductId),
  ]));

  if (allSuggestionProductIds.length === 0) {
    return { revenue: 0, previousRevenue: 0, trend: 0 };
  }

  // 5. Calcular receita dos últimos 30 dias
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const productIdsSql = sql.join(allSuggestionProductIds.map(id => sql`${id}`), sql`, `);

  // Receita últimos 30 dias: soma de orderItems.totalPrice onde productId está nas sugestões
  // e o pedido foi completado (não cancelado) e pertence ao estabelecimento
  const [currentResult] = await db.select({
    total: sql<string>`COALESCE(SUM(${orderItems.totalPrice}), 0)`
  })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.status} NOT IN ('cancelled')`,
      gte(orders.createdAt, thirtyDaysAgo),
      sql`${orderItems.productId} IN (${productIdsSql})`
    ));

  // 6. Receita do período anterior (30-60 dias) para calcular trend
  const [previousResult] = await db.select({
    total: sql<string>`COALESCE(SUM(${orderItems.totalPrice}), 0)`
  })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.status} NOT IN ('cancelled')`,
      gte(orders.createdAt, sixtyDaysAgo),
      lt(orders.createdAt, thirtyDaysAgo),
      sql`${orderItems.productId} IN (${productIdsSql})`
    ));

  const revenue = parseFloat(currentResult.total) || 0;
  const previousRevenue = parseFloat(previousResult.total) || 0;

  // Calcular variação percentual
  let trend = 0;
  if (previousRevenue > 0) {
    trend = Math.round(((revenue - previousRevenue) / previousRevenue) * 100);
  } else if (revenue > 0) {
    trend = 100; // Se não havia receita antes e agora há, é 100% de aumento
  }

  return { revenue, previousRevenue, trend };
}

// ==================== USER PREFERENCES ====================

/**
 * Busca uma preferência do usuário por chave
 */
export async function getUserPreference(userId: number, key: string, establishmentId?: number | null): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const conditions = [
    eq(userPreferences.userId, userId),
    eq(userPreferences.key, key),
  ];

  if (establishmentId) {
    conditions.push(eq(userPreferences.establishmentId, establishmentId));
  } else {
    conditions.push(sql`${userPreferences.establishmentId} IS NULL`);
  }

  const [result] = await db
    .select({ value: userPreferences.value })
    .from(userPreferences)
    .where(and(...conditions))
    .limit(1);

  return result?.value ?? null;
}

/**
 * Busca múltiplas preferências do usuário de uma vez
 */
export async function getUserPreferences(userId: number, keys: string[], establishmentId?: number | null): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};

  const conditions = [
    eq(userPreferences.userId, userId),
    sql`${userPreferences.key} IN (${sql.join(keys.map(k => sql`${k}`), sql`, `)})`,
  ];

  if (establishmentId) {
    conditions.push(eq(userPreferences.establishmentId, establishmentId));
  } else {
    conditions.push(sql`${userPreferences.establishmentId} IS NULL`);
  }

  const results = await db
    .select({ key: userPreferences.key, value: userPreferences.value })
    .from(userPreferences)
    .where(and(...conditions));

  const map: Record<string, string> = {};
  for (const r of results) {
    map[r.key] = r.value;
  }
  return map;
}

/**
 * Define uma preferência do usuário (upsert)
 */
export async function setUserPreference(userId: number, key: string, value: string, establishmentId?: number | null): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(userPreferences)
    .values({
      userId,
      establishmentId: establishmentId ?? null,
      key,
      value,
    })
    .onDuplicateKeyUpdate({
      set: {
        value,
      },
    });
}

/**
 * Define múltiplas preferências de uma vez
 */
export async function setUserPreferences(userId: number, prefs: { key: string; value: string }[], establishmentId?: number | null): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const pref of prefs) {
    await setUserPreference(userId, pref.key, pref.value, establishmentId);
  }
}


// ============ TELEGRAM CONFIG FUNCTIONS ============

/**
 * Busca a configuração do Telegram de um estabelecimento
 */
export async function getTelegramConfig(establishmentId: number): Promise<{ enabled: boolean; chatId: string | null } | null> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db
    .select({
      telegramEnabled: establishments.telegramEnabled,
      telegramChatId: establishments.telegramChatId,
    })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);

  if (!result) return null;
  return { enabled: result.telegramEnabled, chatId: result.telegramChatId };
}

/**
 * Salva a configuração do Telegram (chat_id + ativa a integração)
 */
export async function saveTelegramConfig(establishmentId: number, chatId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(establishments)
    .set({
      telegramEnabled: true,
      telegramChatId: chatId,
    })
    .where(eq(establishments.id, establishmentId));
}

/**
 * Desconecta o Telegram (limpa chat_id e desativa)
 */
export async function disconnectTelegram(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(establishments)
    .set({
      telegramEnabled: false,
      telegramChatId: null,
    })
    .where(eq(establishments.id, establishmentId));
}

/**
 * Toggle ativar/desativar notificações Telegram (sem alterar chat_id)
 */
export async function toggleTelegramEnabled(establishmentId: number, enabled: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(establishments)
    .set({ telegramEnabled: enabled })
    .where(eq(establishments.id, establishmentId));
}


// ============ ONBOARDING DRAFT ============

export async function getOnboardingDraft(establishmentId: number): Promise<OnboardingDraft | null> {
  const db = await getDb();
  if (!db) return null;
  const [draft] = await db.select().from(onboardingDrafts).where(eq(onboardingDrafts.establishmentId, establishmentId)).limit(1);
  return draft || null;
}

export async function upsertOnboardingDraft(establishmentId: number, step: number, data: InsertOnboardingDraft["data"]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getOnboardingDraft(establishmentId);
  if (existing) {
    await db.update(onboardingDrafts)
      .set({ step, data, updatedAt: new Date() })
      .where(eq(onboardingDrafts.establishmentId, establishmentId));
  } else {
    await db.insert(onboardingDrafts).values({ establishmentId, step, data });
  }
}

export async function deleteOnboardingDraft(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(onboardingDrafts).where(eq(onboardingDrafts.establishmentId, establishmentId));
}


// ─── iFood Disputes (Handshake) ─────────────────────────────────────

export async function createIfoodDispute(data: InsertIfoodDispute): Promise<IfoodDispute | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(ifoodDisputes).values(data);
  const result = await db.select().from(ifoodDisputes)
    .where(eq(ifoodDisputes.disputeId, data.disputeId))
    .limit(1);
  return result[0] || null;
}

export async function getIfoodDisputeByDisputeId(disputeId: string): Promise<IfoodDispute | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ifoodDisputes)
    .where(eq(ifoodDisputes.disputeId, disputeId))
    .limit(1);
  return result[0] || null;
}

export async function listIfoodDisputes(establishmentId: number, status?: string): Promise<IfoodDispute[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(ifoodDisputes.establishmentId, establishmentId)];
  if (status) {
    conditions.push(eq(ifoodDisputes.status, status as any));
  }
  return db.select().from(ifoodDisputes)
    .where(and(...conditions))
    .orderBy(desc(ifoodDisputes.createdAt));
}

export async function updateIfoodDisputeStatus(
  disputeId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "ALTERNATIVE" | "EXPIRED",
  respondedAt?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { status };
  if (respondedAt) updateData.respondedAt = respondedAt;
  await db.update(ifoodDisputes)
    .set(updateData)
    .where(eq(ifoodDisputes.disputeId, disputeId));
}

export async function getIfoodDisputesByOrderId(orderId: string): Promise<IfoodDispute[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ifoodDisputes)
    .where(eq(ifoodDisputes.orderId, orderId))
    .orderBy(desc(ifoodDisputes.createdAt));
}

export async function getPendingIfoodDisputes(establishmentId: number): Promise<IfoodDispute[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ifoodDisputes)
    .where(and(
      eq(ifoodDisputes.establishmentId, establishmentId),
      eq(ifoodDisputes.status, "PENDING")
    ))
    .orderBy(ifoodDisputes.expiresAt); // Most urgent first
}


/**
 * Buscar um combo group pelo ID
 */
export async function getComboGroupById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [group] = await db.select().from(comboGroups)
    .where(eq(comboGroups.id, id))
    .limit(1);
  return group || null;
}

/**
 * Atualizar um combo group (ex: sortOrder)
 */
export async function updateComboGroup(id: number, data: Partial<InsertComboGroup>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(comboGroups).set(data).where(eq(comboGroups.id, id));
}

export async function deleteComboGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete items in the group first
  await db.delete(comboGroupItems).where(eq(comboGroupItems.comboGroupId, id));
  // Delete the group
  await db.delete(comboGroups).where(eq(comboGroups.id, id));
}

// ---- Combo Group Item operations ----

export async function getComboGroupItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [item] = await db.select().from(comboGroupItems)
    .where(eq(comboGroupItems.id, id))
    .limit(1);
  return item || null;
}

export async function updateComboGroupItem(id: number, data: Partial<InsertComboGroupItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(comboGroupItems).set(data).where(eq(comboGroupItems.id, id));
}

export async function deleteComboGroupItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comboGroupItems).where(eq(comboGroupItems.id, id));
}


// ==================== PUBLIC CHAT (Cardápio Público) ====================
export async function createPublicChatMessage(data: InsertPublicChatMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(publicChatMessages).values(data);
  return result.insertId;
}
export async function getPublicChatMessages(orderId: number, limit: number = 100): Promise<PublicChatMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicChatMessages)
    .where(eq(publicChatMessages.orderId, orderId))
    .orderBy(asc(publicChatMessages.createdAt))
    .limit(limit);
}
export async function getPublicChatConversations(establishmentId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const conversations = await db.execute(sql`
    SELECT
      pcm.orderId,
      o.orderNumber,
      pcm.customerPhone,
      pcm.customerName,
      (SELECT content FROM public_chat_messages WHERE orderId = pcm.orderId ORDER BY createdAt DESC LIMIT 1) as lastMessage,
      (SELECT createdAt FROM public_chat_messages WHERE orderId = pcm.orderId ORDER BY createdAt DESC LIMIT 1) as lastMessageAt,
      (SELECT COUNT(*) FROM public_chat_messages WHERE orderId = pcm.orderId AND direction = 'incoming' AND isRead = false) as unreadCount,
      o.status as orderStatus
    FROM public_chat_messages pcm
    INNER JOIN orders o ON o.id = pcm.orderId
    WHERE pcm.establishmentId = ${establishmentId}
    GROUP BY pcm.orderId, o.orderNumber, pcm.customerPhone, pcm.customerName, o.status
    ORDER BY lastMessageAt DESC
  `);
  return (conversations as any)[0] || [];
}
export async function markPublicChatAsRead(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(publicChatMessages)
    .set({ isRead: true })
    .where(and(
      eq(publicChatMessages.orderId, orderId),
      eq(publicChatMessages.direction, "incoming"),
      eq(publicChatMessages.isRead, false)
    ));
}
export async function getPublicChatUnreadCount(establishmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(publicChatMessages)
    .where(and(
      eq(publicChatMessages.establishmentId, establishmentId),
      eq(publicChatMessages.direction, "incoming"),
      eq(publicChatMessages.isRead, false)
    ));
  return Number(result?.count || 0);
}
export async function canCustomerChat(orderId: number, phone: string): Promise<{ canChat: boolean; reason?: string }> {
  const order = await getOrderById(orderId);
  if (!order) return { canChat: false, reason: "Order not found" };
  const orderPhone = (order.customerPhone || '').replace(/\D/g, '');
  const inputPhone = phone.replace(/\D/g, '');
  if (orderPhone !== inputPhone) return { canChat: false, reason: "Phone does not match order" };
  const inactiveStatuses = ['completed', 'delivered', 'cancelled'];
  if (inactiveStatuses.includes(order.status)) {
    const completedAt = order.updatedAt ? new Date(order.updatedAt).getTime() : 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (completedAt < oneHourAgo) return { canChat: false, reason: "Chat no longer available for this order" };
  }
  return { canChat: true };
}


// ============ CASH REGISTER (CONTROLE DE CAIXA) ============

export async function getCashCurrentSession(establishmentId: number) {
  const db = await getDb();
  if (!db) return null;
  const [session] = await db.select().from(cashSessions)
    .where(and(
      eq(cashSessions.establishmentId, establishmentId),
      eq(cashSessions.status, "open")
    ))
    .orderBy(desc(cashSessions.openedAt))
    .limit(1);
  return session || null;
}

export async function cashOpenSession(
  establishmentId: number,
  operatorName: string,
  operatorId: number,
  openingAmount: number,
  observation?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verificar se já existe sessão aberta
  const existing = await getCashCurrentSession(establishmentId);
  if (existing) throw new Error("Já existe um caixa aberto. Feche o caixa atual antes de abrir um novo.");
  const [result] = await db.insert(cashSessions).values({
    establishmentId,
    operatorName,
    operatorId,
    openingAmount: openingAmount.toFixed(2),
    observation: observation || null,
    status: "open",
  });
  return { id: result.insertId, success: true };
}

export async function cashCloseSession(
  establishmentId: number,
  sessionId: number,
  closingAmount?: number,
  closingObservation?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Calcular valor esperado
  const [session] = await db.select().from(cashSessions).where(eq(cashSessions.id, sessionId)).limit(1);
  if (!session || session.establishmentId !== establishmentId) throw new Error("Sessão não encontrada");
  if (session.status === "closed") throw new Error("Sessão já está fechada");
  
  // Calcular: abertura + vendas em dinheiro - sangrias + suprimentos
  const openingAmt = parseFloat(session.openingAmount as any) || 0;
  
  // Vendas em dinheiro durante a sessão
  const salesResult: any[] = await db.execute(
    sql`SELECT COALESCE(SUM(total), 0) as totalCash FROM orders 
        WHERE establishmentId = ${establishmentId} 
        AND paymentMethod = 'cash'
        AND status = 'completed'
        AND createdAt >= ${session.openedAt}`
  );
  const totalCashSales = parseFloat(salesResult?.[0]?.totalCash) || 0;
  
  // Movimentações
  const movements = await db.select().from(cashMovements).where(eq(cashMovements.sessionId, sessionId));
  const totalSangrias = movements.filter(m => m.type === "sangria").reduce((acc, m) => acc + (parseFloat(m.amount as any) || 0), 0);
  const totalSuprimentos = movements.filter(m => m.type === "suprimento").reduce((acc, m) => acc + (parseFloat(m.amount as any) || 0), 0);
  
  const expectedAmount = openingAmt + totalCashSales - totalSangrias + totalSuprimentos;
  const difference = closingAmount !== undefined ? closingAmount - expectedAmount : null;
  
  await db.update(cashSessions)
    .set({
      status: "closed",
      closedAt: new Date(),
      closingAmount: closingAmount !== undefined ? closingAmount.toFixed(2) : null,
      expectedAmount: expectedAmount.toFixed(2),
      difference: difference !== null ? difference.toFixed(2) : null,
      closingObservation: closingObservation || null,
    })
    .where(eq(cashSessions.id, sessionId));
  
  return { success: true, expectedAmount, difference };
}

export async function cashAddMovement(
  establishmentId: number,
  sessionId: number,
  type: "sangria" | "suprimento",
  amount: number,
  reason?: string,
  operatorName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verificar se sessão existe e está aberta
  const [session] = await db.select().from(cashSessions).where(and(
    eq(cashSessions.id, sessionId),
    eq(cashSessions.establishmentId, establishmentId),
    eq(cashSessions.status, "open")
  )).limit(1);
  if (!session) throw new Error("Sessão de caixa não encontrada ou já fechada");
  
  const [result] = await db.insert(cashMovements).values({
    establishmentId,
    sessionId,
    type,
    amount: amount.toFixed(2),
    reason: reason || null,
    operatorName: operatorName || null,
  });
  return { id: result.insertId, success: true };
}

export async function cashGetMovements(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cashMovements)
    .where(eq(cashMovements.sessionId, sessionId))
    .orderBy(desc(cashMovements.createdAt));
}

export async function cashGetSessionSales(establishmentId: number, sessionId: number) {
  const db = await getDb();
  if (!db) return { sales: [], total: 0, count: 0 };
  // Buscar sessão para pegar openedAt
  const [session] = await db.select().from(cashSessions).where(eq(cashSessions.id, sessionId)).limit(1);
  if (!session) return { sales: [], total: 0, count: 0 };
  
  const endDate = session.closedAt || new Date();
  
  const sales = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    customerName: orders.customerName,
    paymentMethod: orders.paymentMethod,
    total: orders.total,
    source: orders.source,
    deliveryType: orders.deliveryType,
    createdAt: orders.createdAt,
    completedAt: orders.completedAt,
  }).from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      eq(orders.status, "completed"),
      gte(orders.createdAt, session.openedAt),
      lte(orders.createdAt, endDate)
    ))
    .orderBy(desc(orders.createdAt));
  
  const total = sales.reduce((acc, s) => acc + (parseFloat(s.total as any) || 0), 0);
  
  return { sales, total, count: sales.length };
}

export async function cashGetPaymentBreakdown(establishmentId: number, sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  // Buscar sessão para pegar openedAt
  const [session] = await db.select().from(cashSessions).where(eq(cashSessions.id, sessionId)).limit(1);
  if (!session) return [];
  const endDate = session.closedAt || new Date();
  const rawResult = await db.execute(
    sql`SELECT paymentMethod, COUNT(*) as count, COALESCE(SUM(total), 0) as total 
        FROM orders 
        WHERE establishmentId = ${establishmentId} 
        AND status = 'completed'
        AND createdAt >= ${session.openedAt}
        AND createdAt <= ${endDate}
        GROUP BY paymentMethod
        ORDER BY total DESC`
  );
  // db.execute retorna [rows, metadata] - acessar rows com [0]
  const result: any[] = Array.isArray(rawResult[0]) ? rawResult[0] : rawResult;
  // Separar: pix_online (cobrança) vs pix (estático), card_online → card
  const methodMap: Record<string, { total: number; count: number }> = {
    cash: { total: 0, count: 0 },
    pix_online: { total: 0, count: 0 },
    pix: { total: 0, count: 0 },
    card: { total: 0, count: 0 },
  };
  for (const r of result) {
    const method = r.paymentMethod as string;
    const total = parseFloat(r.total) || 0;
    const count = parseInt(r.count) || 0;
    if (method === 'cash') {
      methodMap.cash.total += total;
      methodMap.cash.count += count;
    } else if (method === 'pix_online') {
      methodMap.pix_online.total += total;
      methodMap.pix_online.count += count;
    } else if (method === 'pix') {
      methodMap.pix.total += total;
      methodMap.pix.count += count;
    } else if (method === 'card' || method === 'card_online') {
      methodMap.card.total += total;
      methodMap.card.count += count;
    }
  }
  return [
    { paymentMethod: 'cash', count: methodMap.cash.count, total: methodMap.cash.total },
    { paymentMethod: 'pix_online', count: methodMap.pix_online.count, total: methodMap.pix_online.total },
    { paymentMethod: 'pix', count: methodMap.pix.count, total: methodMap.pix.total },
    { paymentMethod: 'card', count: methodMap.card.count, total: methodMap.card.total },
  ];
}

export async function cashGetHistory(establishmentId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cashSessions)
    .where(eq(cashSessions.establishmentId, establishmentId))
    .orderBy(desc(cashSessions.openedAt))
    .limit(limit);
}

// ============ OPERADORES DE CAIXA ============
export async function getCashOperators(establishmentId: number) {
  const db = await getDb();
  return db.select().from(cashOperators)
    .where(and(
      eq(cashOperators.establishmentId, establishmentId),
      eq(cashOperators.isActive, true)
    ))
    .orderBy(asc(cashOperators.name));
}

export async function createCashOperator(establishmentId: number, name: string) {
  const db = await getDb();
  // Verificar se já existe operador com mesmo nome
  const [existing] = await db.select().from(cashOperators)
    .where(and(
      eq(cashOperators.establishmentId, establishmentId),
      eq(cashOperators.name, name),
      eq(cashOperators.isActive, true)
    ))
    .limit(1);
  if (existing) return existing;
  const [result] = await db.insert(cashOperators).values({
    establishmentId,
    name,
  });
  return { id: result.insertId, establishmentId, name, isActive: true, createdAt: new Date() };
}

export async function updateCashOperator(operatorId: number, establishmentId: number, newName: string) {
  const db = await getDb();
  // Verificar se já existe outro operador com mesmo nome
  const [existing] = await db.select().from(cashOperators)
    .where(and(
      eq(cashOperators.establishmentId, establishmentId),
      eq(cashOperators.name, newName),
      eq(cashOperators.isActive, true)
    ))
    .limit(1);
  if (existing && existing.id !== operatorId) {
    throw new Error("Já existe um operador com esse nome");
  }
  await db.update(cashOperators)
    .set({ name: newName })
    .where(eq(cashOperators.id, operatorId));
  return { id: operatorId, name: newName };
}

export async function deleteCashOperator(operatorId: number) {
  const db = await getDb();
  await db.update(cashOperators)
    .set({ isActive: false })
    .where(eq(cashOperators.id, operatorId));
  return { success: true };
}

/**
 * Optimized version of getOrdersByPhone specifically for the public chat.
 * Returns only id and orderNumber (no items), reducing N+1 queries.
 * Also filters by active statuses directly in the query.
 */
export async function getActiveOrderByPhone(phone: string, establishmentId: number) {
  const db = await getDb();
  if (!db) return null;
  // Normalize phone: extract only digits
  const clean = phone.replace(/\D/g, "");
  // Try with and without country code 55
  const withoutCountry = clean.startsWith("55") && clean.length >= 12 ? clean.slice(2) : clean;
  const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
  const phoneVariants = new Set<string>();
  phoneVariants.add(clean);
  phoneVariants.add(withoutCountry);
  phoneVariants.add(withCountry);
  phoneVariants.add(phone);
  // Generate variants with/without the 9th digit
  const local = withoutCountry;
  if (local.length === 11) {
    const without9th = local.slice(0, 2) + local.slice(3);
    phoneVariants.add(without9th);
    phoneVariants.add(`55${without9th}`);
  } else if (local.length === 10) {
    const with9th = local.slice(0, 2) + "9" + local.slice(2);
    phoneVariants.add(with9th);
    phoneVariants.add(`55${with9th}`);
  }
  // Build OR conditions using only eq() (no LIKE wildcards for index usage)
  const variantArray = Array.from(phoneVariants);
  const orConditions = variantArray.map(v => eq(orders.customerPhone, v));
  // Active statuses for chat
  const activeStatuses = ["new", "pending", "pending_confirmation", "preparing", "ready", "accepted", "sent", "delivering", "out_for_delivery"];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  // Query 1: Try to find an order with active status
  const activeResult = await db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, updatedAt: orders.updatedAt })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      or(...orConditions),
      inArray(orders.status, activeStatuses)
    ))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  if (activeResult.length > 0) {
    return { orderId: activeResult[0].id, orderNumber: activeResult[0].orderNumber };
  }
  // Query 2: Check for recently completed/delivered orders (within 1 hour)
  const recentResult = await db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, updatedAt: orders.updatedAt })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      or(...orConditions),
      or(eq(orders.status, "completed"), eq(orders.status, "delivered")),
      gte(orders.updatedAt, oneHourAgo)
    ))
    .orderBy(desc(orders.updatedAt))
    .limit(1);
  if (recentResult.length > 0) {
    return { orderId: recentResult[0].id, orderNumber: recentResult[0].orderNumber };
  }
  return null;
}


// ============ CASH REMINDER FUNCTIONS ============

export async function getCashReminderSettings(establishmentId: number): Promise<CashReminderSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db.select().from(cashReminderSettings)
    .where(eq(cashReminderSettings.establishmentId, establishmentId))
    .limit(1);
  return settings || null;
}

export async function upsertCashReminderSettings(establishmentId: number, data: {
  openReminderEnabled?: boolean;
  closeReminderEnabled?: boolean;
  openReminderDelayMinutes?: number;
  closeReminderBeforeMinutes?: number;
  maxCloseReminders?: number;
  respectClosedDays?: boolean;
}): Promise<CashReminderSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCashReminderSettings(establishmentId);
  if (existing) {
    await db.update(cashReminderSettings)
      .set(data)
      .where(eq(cashReminderSettings.establishmentId, establishmentId));
    return { ...existing, ...data } as CashReminderSettings;
  } else {
    const [result] = await db.insert(cashReminderSettings).values({
      establishmentId,
      ...data,
    });
    return (await getCashReminderSettings(establishmentId))!;
  }
}

export async function getCashReminderLogForToday(
  establishmentId: number, 
  reminderType: "open" | "close", 
  dateStr: string
): Promise<CashReminderLog | null> {
  const db = await getDb();
  if (!db) return null;
  const [log] = await db.select().from(cashReminderLogs)
    .where(and(
      eq(cashReminderLogs.establishmentId, establishmentId),
      eq(cashReminderLogs.reminderType, reminderType),
      eq(cashReminderLogs.reminderDate, dateStr),
    ))
    .limit(1);
  return log || null;
}

export async function createOrUpdateCashReminderLog(
  establishmentId: number,
  reminderType: "open" | "close",
  dateStr: string
): Promise<CashReminderLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCashReminderLogForToday(establishmentId, reminderType, dateStr);
  if (existing) {
    await db.update(cashReminderLogs)
      .set({ sentCount: existing.sentCount + 1, lastSentAt: new Date() })
      .where(eq(cashReminderLogs.id, existing.id));
    return { ...existing, sentCount: existing.sentCount + 1, lastSentAt: new Date() };
  } else {
    await db.insert(cashReminderLogs).values({
      establishmentId,
      reminderType,
      reminderDate: dateStr,
      sentCount: 1,
    });
    return (await getCashReminderLogForToday(establishmentId, reminderType, dateStr))!;
  }
}

export async function dismissCashReminder(establishmentId: number, reminderType: "open" | "close", dateStr: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(cashReminderLogs)
    .set({ dismissed: true })
    .where(and(
      eq(cashReminderLogs.establishmentId, establishmentId),
      eq(cashReminderLogs.reminderType, reminderType),
      eq(cashReminderLogs.reminderDate, dateStr),
    ));
}

export async function getPendingCashReminders(establishmentId: number, dateStr: string): Promise<CashReminderLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cashReminderLogs)
    .where(and(
      eq(cashReminderLogs.establishmentId, establishmentId),
      eq(cashReminderLogs.reminderDate, dateStr),
      eq(cashReminderLogs.dismissed, false),
    ));
}

export async function getAllEstablishmentsWithCashReminders(): Promise<Array<{ id: number; timezone: string }>> {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    id: establishments.id,
    timezone: establishments.timezone,
  }).from(establishments);
  return results;
}


// Resolve draft category IDs to their published counterparts
// The admin panel saves draft IDs in cashbackCategoryIds, but the public menu uses published IDs
export async function resolveDraftToPublishedCategoryIds(establishmentId: number, draftCategoryIds: number[]): Promise<number[]> {
  const db = await getDb();
  
  // For each draft category ID, find the corresponding published category
  // Draft categories have publishedSourceId pointing to their published version
  const resolvedIds: number[] = [];
  
  for (const draftId of draftCategoryIds) {
    // First check if this ID is already a published category
    const publishedCheck = await db.select({ id: categories.id })
      .from(categories)
      .where(and(
        eq(categories.id, draftId),
        eq(categories.establishmentId, establishmentId),
        eq(categories.version, 'published')
      ))
      .limit(1);
    
    if (publishedCheck.length > 0) {
      // Already a published ID
      resolvedIds.push(draftId);
    } else {
      // It's a draft ID - find its publishedSourceId
      const draftCat = await db.select({ publishedSourceId: categories.publishedSourceId })
        .from(categories)
        .where(and(
          eq(categories.id, draftId),
          eq(categories.establishmentId, establishmentId),
          eq(categories.version, 'draft')
        ))
        .limit(1);
      
      if (draftCat.length > 0 && draftCat[0].publishedSourceId) {
        resolvedIds.push(draftCat[0].publishedSourceId);
      } else {
        // Fallback: try to find a published category with the same name
        const draftInfo = await db.select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, draftId))
          .limit(1);
        
        if (draftInfo.length > 0) {
          const publishedByName = await db.select({ id: categories.id })
            .from(categories)
            .where(and(
              eq(categories.establishmentId, establishmentId),
              eq(categories.name, draftInfo[0].name),
              eq(categories.version, 'published')
            ))
            .limit(1);
          
          if (publishedByName.length > 0) {
            resolvedIds.push(publishedByName[0].id);
          } else {
            // Keep the original ID as fallback
            resolvedIds.push(draftId);
          }
        } else {
          resolvedIds.push(draftId);
        }
      }
    }
  }
  
  return resolvedIds;
}

export async function getCustomerDetailsTab(establishmentId: number) {
  const db = await getDb();
  if (!db) return {
    ticketMedio: 0,
    peakDay: null as string | null,
    topProduct: null as string | null,
    frequentCustomers: [] as { name: string; phone: string; orderCount: number }[],
    preferences: {
      preferredDay: null as string | null,
      preferredHour: null as string | null,
      weeklyDistribution: [0, 0, 0, 0, 0, 0, 0] as number[],
    },
  };
  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const thirtyDaysAgo = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 30);
  const thirtyDaysAgoStr = fmtLocalDateTime(thirtyDaysAgo);

  // Run all queries in parallel for maximum performance
  const [ticketResult, dayResult, topProductResult, frequentResult, weeklyResult, hourResult] = await Promise.all([
    // 1. Ticket médio
    db.select({
      avgTotal: sql<number>`COALESCE(AVG(${orders.total}), 0)`,
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
      )),
    // 2. Dia que mais pedem
    db.select({
      dayOfWeek: sql<number>`DAYOFWEEK(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`,
      cnt: sql<number>`COUNT(*)`,
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
      ))
      .groupBy(sql`DAYOFWEEK(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(1),
    // 3. Item mais pedido
    db.select({
      productName: orderItems.productName,
      totalQty: sql<number>`SUM(${orderItems.quantity})`,
    })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
      ))
      .groupBy(orderItems.productName)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(1),
    // 4. Clientes frequentes (4+ pedidos em 30 dias)
    db.select({
      customerPhone: orders.customerPhone,
      customerName: orders.customerName,
      orderCount: sql<number>`COUNT(*)`,
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`${orders.customerPhone} IS NOT NULL`,
        sql`${orders.customerPhone} != ''`,
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
      ))
      .groupBy(orders.customerPhone, orders.customerName)
      .having(sql`COUNT(*) >= 4`)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(20),
    // 5. Distribuição semanal
    db.select({
      dayOfWeek: sql<number>`DAYOFWEEK(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`,
      cnt: sql<number>`COUNT(*)`,
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
      ))
      .groupBy(sql`DAYOFWEEK(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`),
    // 6. Horário preferido
    db.select({
      hour: sql<number>`HOUR(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`,
      cnt: sql<number>`COUNT(*)`,
    })
      .from(orders)
      .where(and(
        eq(orders.establishmentId, establishmentId),
        eq(orders.status, 'completed'),
        sql`CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}) >= ${thirtyDaysAgoStr}`
      ))
      .groupBy(sql`HOUR(CONVERT_TZ(${orders.createdAt}, '+00:00', ${tz}))`)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(1),
  ]);

  // Process results
  const ticketMedio = Math.round(Number(ticketResult[0]?.avgTotal || 0) * 100) / 100;

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const peakDay = dayResult.length > 0 ? dayNames[Number(dayResult[0].dayOfWeek) - 1] : null;

  const topProduct = topProductResult.length > 0 ? topProductResult[0].productName : null;

  const frequentCustomers = frequentResult.map(r => ({
    name: r.customerName || 'Cliente',
    phone: r.customerPhone || '',
    orderCount: Number(r.orderCount),
  }));

  // Weekly distribution: [Seg, Ter, Qua, Qui, Sex, Sab, Dom]
  const weeklyDistribution = [0, 0, 0, 0, 0, 0, 0];
  let totalOrders = 0;
  for (const row of weeklyResult) {
    const mysqlDay = Number(row.dayOfWeek);
    const idx = mysqlDay === 1 ? 6 : mysqlDay - 2;
    weeklyDistribution[idx] = Number(row.cnt);
    totalOrders += Number(row.cnt);
  }
  const weeklyPct = weeklyDistribution.map(v => totalOrders > 0 ? Math.round((v / totalOrders) * 100) : 0);
  const maxDayIdx = weeklyPct.indexOf(Math.max(...weeklyPct));
  const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const preferredDay = totalOrders > 0 ? dayLabels[maxDayIdx] : null;

  const preferredHour = hourResult.length > 0 ? `${String(Number(hourResult[0].hour)).padStart(2, '0')}:00` : null;

  return {
    ticketMedio,
    peakDay,
    topProduct,
    frequentCustomers,
    preferences: {
      preferredDay,
      preferredHour,
      weeklyDistribution: weeklyPct,
    },
  };
}
