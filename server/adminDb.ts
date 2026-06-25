/**
 * Admin Database Functions
 * Funções de banco de dados exclusivas para a área administrativa global.
 */
import { eq, sql, and, gte, lte, desc, asc, count, like, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  users, establishments, adminAuditLog,
  categories, products, complementGroups, complementItems,
  orders, orderItems, orderCounters,
  stockCategories, stockItems, stockMovements,
  coupons, reviews, businessHours, neighborhoodFees,
  loyaltyCards, loyaltyStamps,
  printers, printerSettings, pushSubscriptions,
  whatsappConfig, printQueue, ifoodConfig,
  menuSessions, menuViewsDaily, menuViewsHourly,
  smsBalance, smsTransactions,
  tableSpaces, tables, tabs, tabItems, tabPayments,
  scheduledCampaigns, pendingOnlineOrders, pdvCustomers,
  comboGroups, comboGroupItems,
  drivers, deliveries,
  expenseCategories, expenses, monthlyGoals, recurringExpenses, recurringExpenseHistory,
  financialGoals, weeklyGoals,
  cashbackTransactions, cashbackBalances,
  botApiKeys, printLogs, feedbacks,
  stories, storyViews, storyEvents,
  aiImageCreditLogs, collaborators,
  whatsappConversations, whatsappMessages,
  scheduledClosures,
  chatShortcuts, orderLogs, paytimeTransactions, sseConnectivityLogs,
  planPrices, planFeatures, planSubscriptions,
} from "../drizzle/schema";
import { logger } from "./_core/logger";

// ============ ADMIN AUTH ============

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, "admin")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "admin")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ADMIN DASHBOARD STATS ============

export async function getAdminDashboardStats(period: "today" | "7days" | "30days" | "all" = "all") {
  const db = await getDb();
  if (!db) return null;

  // Calculate date filter
  let dateFilter: Date | null = null;
  const now = new Date();
  if (period === "today") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "7days") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30days") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Total new registrations
  const newRegistrationsQuery = dateFilter
    ? db.select({ count: count() }).from(establishments).where(gte(establishments.createdAt, dateFilter))
    : db.select({ count: count() }).from(establishments);
  const [newRegistrations] = await newRegistrationsQuery;

  // Restaurants in trial (active, not expired)
  const [inTrial] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
      )
    );

  // Restaurants with paid plans
  const [paidPlans] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      or(
        eq(establishments.planType, "lite"),
        eq(establishments.planType, "basic"),
        eq(establishments.planType, "pro")
      )
    );

  // Expired trials
  const [expiredTrials] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
      )
    );

  return {
    newRegistrations: newRegistrations?.count ?? 0,
    inTrial: inTrial?.count ?? 0,
    paidPlans: paidPlans?.count ?? 0,
    expiredTrials: expiredTrials?.count ?? 0,
  };
}

// ============ ADMIN RESTAURANTS ============

export async function getAdminRestaurantsList(filters?: {
  search?: string;
  planFilter?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { restaurants: [], total: 0 };

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions: any[] = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(establishments.name, `%${filters.search}%`),
        like(establishments.email, `%${filters.search}%`),
        like(users.email, `%${filters.search}%`)
      )
    );
  }
  if (filters?.planFilter && filters.planFilter !== "all") {
    if (filters.planFilter === "expired") {
      conditions.push(
        and(
          eq(establishments.planType, "trial"),
          sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
        )
      );
    } else if (filters.planFilter === "active_trial") {
      conditions.push(
        and(
          eq(establishments.planType, "trial"),
          sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
        )
      );
    } else {
      conditions.push(eq(establishments.planType, filters.planFilter as any));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count (join with users for email search fallback)
  const [totalResult] = await db
    .select({ count: count() })
    .from(establishments)
    .leftJoin(users, eq(establishments.userId, users.id))
    .where(whereClause);

  // Get restaurants with user info (join with users to get email fallback)
  const restaurants = await db
    .select({
      id: establishments.id,
      name: establishments.name,
      email: sql<string | null>`COALESCE(${establishments.email}, ${users.email})`.as('email'),
      logo: establishments.logo,
      menuSlug: establishments.menuSlug,
      isOpen: establishments.isOpen,
      manuallyClosed: establishments.manuallyClosed,
      planType: establishments.planType,
      trialStartDate: establishments.trialStartDate,
      trialDays: establishments.trialDays,
      createdAt: establishments.createdAt,
      userId: establishments.userId,
      whatsapp: establishments.whatsapp,
      city: establishments.city,
      state: establishments.state,
    })
    .from(establishments)
    .leftJoin(users, eq(establishments.userId, users.id))
    .where(whereClause)
    .orderBy(desc(establishments.createdAt))
    .limit(limit)
    .offset(offset);

  // Enrich with trial status
  const enriched = restaurants.map((r) => {
    let trialStatus: "active" | "expiring_soon" | "expired" | "not_trial" = "not_trial";
    let daysRemaining: number | null = null;

    if (r.planType === "trial" && r.trialStartDate) {
      const expirationDate = new Date(r.trialStartDate.getTime() + r.trialDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const msRemaining = expirationDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

      if (msRemaining <= 0) {
        trialStatus = "expired";
        daysRemaining = 0;
      } else if (daysRemaining <= 3) {
        trialStatus = "expiring_soon";
      } else {
        trialStatus = "active";
      }
    }

    return {
      ...r,
      trialStatus,
      daysRemaining,
    };
  });

  return {
    restaurants: enriched,
    total: totalResult?.count ?? 0,
  };
}

export async function getAdminRestaurantDetail(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [restaurant] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, id))
    .limit(1);

  if (!restaurant) return null;

  // Get owner user info
  const [owner] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, restaurant.userId))
    .limit(1);

  // Calculate trial info
  let trialStatus: "active" | "expiring_soon" | "expired" | "not_trial" = "not_trial";
  let daysRemaining: number | null = null;
  let expirationDate: Date | null = null;

  if (restaurant.planType === "trial" && restaurant.trialStartDate) {
    expirationDate = new Date(restaurant.trialStartDate.getTime() + restaurant.trialDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msRemaining = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    if (msRemaining <= 0) {
      trialStatus = "expired";
      daysRemaining = 0;
    } else if (daysRemaining <= 3) {
      trialStatus = "expiring_soon";
    } else {
      trialStatus = "active";
    }
  }

  // Count admins (users that have an establishment with same userId)
  const adminCount = owner ? 1 : 0;

  // Plan price mapping
  const planPriceMap: Record<string, number> = {
    trial: 0,
    lite: 48.90,
    free: 0,
    basic: 98.90,
    pro: 179.90,
  };
  const planPrice = planPriceMap[restaurant.planType] ?? 0;

  // Plan labels
  const planLabelMap: Record<string, string> = {
    trial: "Teste",
    free: "Gratuito",
    lite: "Starter",
    basic: "Essencial",
    pro: "Pro",
  };
  const planLabel = planLabelMap[restaurant.planType] ?? restaurant.planType;

  return {
    ...restaurant,
    owner: owner || null,
    trialStatus,
    daysRemaining,
    expirationDate,
    adminCount,
    planPrice,
    planLabel,
  };
}

// ============ ADMIN ACTIONS ============

export async function adminChangePlan(establishmentId: number, planType: "free" | "trial" | "lite" | "basic" | "pro") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (planType === "free") {
    // Free é permanente e gratuito - sem trial
    await db.update(establishments).set({
      planType,
      trialStartDate: null,
      trialDays: 0,
    }).where(eq(establishments.id, establishmentId));
  } else if (planType === "trial" || planType === "lite") {
    // Reset trial (trial e lite ambos têm período de teste de 15 dias)
    await db.update(establishments).set({
      planType,
      trialStartDate: new Date(),
      trialDays: 15,
    }).where(eq(establishments.id, establishmentId));
  } else {
    await db.update(establishments).set({
      planType,
      trialStartDate: null,
    }).where(eq(establishments.id, establishmentId));
  }
}

export async function adminToggleMenu(establishmentId: number, isOpen: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    isOpen,
    manuallyClosed: !isOpen,
    manuallyClosedAt: !isOpen ? new Date() : null,
  }).where(eq(establishments.id, establishmentId));
}

export async function adminExtendTrial(establishmentId: number, extraDays: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // A08: Verificar limite total de 365 dias para extensão de trial
  const [est] = await db.select({ trialDays: establishments.trialDays })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);
  
  const currentDays = est?.trialDays ?? 0;
  if (currentDays + extraDays > 365) {
    throw new Error(`Limite de 365 dias excedido. Dias atuais: ${currentDays}, solicitado: ${extraDays}.`);
  }

  await db.update(establishments).set({
    trialDays: sql`${establishments.trialDays} + ${extraDays}`,
  }).where(eq(establishments.id, establishmentId));
}

export async function adminResetTrial(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    planType: "trial",
    trialStartDate: new Date(),
    trialDays: 15,
  }).where(eq(establishments.id, establishmentId));
}

export async function adminForceExpireTrial(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Set trial start to 16 days ago so it's already expired
  const pastDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
  await db.update(establishments).set({
    planType: "trial",
    trialStartDate: pastDate,
    trialDays: 15,
    isOpen: false,
    manuallyClosed: true,
  }).where(eq(establishments.id, establishmentId));
}

// ============ ADMIN TRIALS ============

export async function getAdminTrialsList(filter: "all" | "active" | "expiring_3days" | "expiring_1day" | "expired" = "all") {
  const db = await getDb();
  if (!db) return [];

  let whereClause;
  if (filter === "active") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
    );
  } else if (filter === "expiring_3days") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`,
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= DATE_ADD(NOW(), INTERVAL 3 DAY)`
    );
  } else if (filter === "expiring_1day") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`,
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= DATE_ADD(NOW(), INTERVAL 1 DAY)`
    );
  } else if (filter === "expired") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
    );
  } else {
    whereClause = eq(establishments.planType, "trial");
  }

  const trials = await db
    .select({
      id: establishments.id,
      name: establishments.name,
      email: establishments.email,
      isOpen: establishments.isOpen,
      planType: establishments.planType,
      trialStartDate: establishments.trialStartDate,
      trialDays: establishments.trialDays,
      createdAt: establishments.createdAt,
    })
    .from(establishments)
    .where(whereClause)
    .orderBy(asc(sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY)`));

  return trials.map((r) => {
    let daysRemaining = 0;
    let hoursRemaining = 0;
    let status: "active" | "expiring_soon" | "expired" = "active";

    if (r.trialStartDate) {
      const expirationDate = new Date(r.trialStartDate.getTime() + r.trialDays * 24 * 60 * 60 * 1000);
      const msRemaining = expirationDate.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
      hoursRemaining = Math.max(0, Math.ceil(msRemaining / (60 * 60 * 1000)));

      if (msRemaining <= 0) {
        status = "expired";
      } else if (daysRemaining <= 3) {
        status = "expiring_soon";
      }
    }

    return {
      ...r,
      daysRemaining,
      hoursRemaining,
      status,
    };
  });
}

// ============ SEED ADMIN ============

export async function seedAdminUser(email: string, passwordHash: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if admin already exists
  const existing = await getAdminByEmail(email);
  if (existing) {
    logger.info("[Seed] Admin user already exists:", email);
    return existing;
  }

  const openId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await db.insert(users).values({
    openId,
    name,
    email,
    passwordHash,
    loginMethod: "email",
    role: "admin",
  });

  const created = await getAdminByEmail(email);
  logger.info("[Seed] Admin user created:", email);
  return created;
}

// ============ ADMIN IMPERSONATION ============

export async function getRestaurantOwnerOpenId(establishmentId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const [restaurant] = await db
    .select({ userId: establishments.userId })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);

  if (!restaurant) return null;

  const [owner] = await db
    .select({ openId: users.openId })
    .from(users)
    .where(eq(users.id, restaurant.userId))
    .limit(1);

  return owner?.openId || null;
}

// ============ ADMIN UPDATE SUBSCRIPTION STATUS ============

export async function adminUpdateSubscriptionStatus(
  establishmentId: number,
  status: "trial" | "active" | "suspended" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const planMap: Record<string, string> = {
    trial: "trial",
    active: "basic",
    suspended: "trial",
    cancelled: "trial",
  };

  const updates: Record<string, any> = {};

  if (status === "trial") {
    updates.planType = "trial";
    updates.trialStartDate = new Date();
    updates.trialDays = 15;
  } else if (status === "active") {
    // Keep current planType if already paid, otherwise set to basic
    const [est] = await db.select({ planType: establishments.planType }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
    if (est && ["lite", "basic", "pro"].includes(est.planType)) {
      // Already on a paid plan, just ensure it's active
      updates.isOpen = true;
      updates.manuallyClosed = false;
    } else {
      updates.planType = "basic";
      updates.trialStartDate = null;
      updates.isOpen = true;
      updates.manuallyClosed = false;
    }
  } else if (status === "suspended") {
    updates.isOpen = false;
    updates.manuallyClosed = true;
    updates.manuallyClosedAt = new Date();
  } else if (status === "cancelled") {
    updates.planType = "trial";
    updates.isOpen = false;
    updates.manuallyClosed = true;
    updates.manuallyClosedAt = new Date();
    // Set trial to already expired
    updates.trialStartDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
    updates.trialDays = 15;
  }

  await db.update(establishments).set(updates).where(eq(establishments.id, establishmentId));
}

// ============ ADMIN UPDATE CONTACT ============

export async function adminUpdateContact(
  establishmentId: number,
  data: { responsibleName?: string; responsiblePhone?: string; email?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Record<string, any> = {};
  if (data.responsibleName !== undefined) updates.responsibleName = data.responsibleName;
  if (data.responsiblePhone !== undefined) updates.responsiblePhone = data.responsiblePhone;
  if (data.email !== undefined) updates.email = data.email;

  if (Object.keys(updates).length > 0) {
    await db.update(establishments).set(updates).where(eq(establishments.id, establishmentId));
  }
}

// ============ ADMIN REPORTS ============

// ============ AUDIT LOG ============

export async function logAdminAction(params: {
  adminId: number;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: number;
  targetName?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(adminAuditLog).values({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      targetName: params.targetName ?? null,
      details: params.details ?? null,
    });
  } catch (err) {
    logger.error("[AuditLog] Failed to log action:", err);
  }
}

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  adminEmail?: string;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (params?.action) {
    conditions.push(eq(adminAuditLog.action, params.action));
  }
  if (params?.adminEmail) {
    conditions.push(like(adminAuditLog.adminEmail, `%${params.adminEmail}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(adminAuditLog)
    .where(whereClause);

  const logs = await db
    .select()
    .from(adminAuditLog)
    .where(whereClause)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    logs,
    total: totalResult?.count ?? 0,
  };
}

// Sanitiza campo CSV para prevenir CSV injection (fórmulas no Excel)
function sanitizeCsvField(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

export async function getAuditLogsCsv() {
  const db = await getDb();
  if (!db) return { csv: "", filename: "" };

  const logs = await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(10000);

  const header = "ID,Admin,Email,Ação,Tipo Alvo,ID Alvo,Nome Alvo,Detalhes,Data";
  const rows = logs.map((l) => {
    const date = l.createdAt ? new Date(l.createdAt).toISOString() : "";
    const details = l.details ? sanitizeCsvField(JSON.stringify(l.details).replace(/"/g, '""')) : "";
    return `${l.id},${l.adminId},"${sanitizeCsvField(l.adminEmail)}","${sanitizeCsvField(l.action)}","${sanitizeCsvField(l.targetType)}",${l.targetId ?? ""},"${sanitizeCsvField(l.targetName)}","${details}","${date}"`;
  });

  const csv = [header, ...rows].join("\n");
  const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

// ============ RESTAURANTS CSV EXPORT ============

export async function getRestaurantsForExport() {
  const db = await getDb();
  if (!db) return { csv: "", filename: "" };

  const restaurants = await db
    .select({
      id: establishments.id,
      name: establishments.name,
      email: sql<string | null>`COALESCE(${establishments.email}, ${users.email})`.as('email'),
      whatsapp: establishments.whatsapp,
      city: establishments.city,
      state: establishments.state,
      planType: establishments.planType,
      trialDays: establishments.trialDays,
      trialStartDate: establishments.trialStartDate,
      isOpen: establishments.isOpen,
      createdAt: establishments.createdAt,
    })
    .from(establishments)
    .leftJoin(users, eq(establishments.userId, users.id))
    .orderBy(desc(establishments.createdAt));

  const header = "ID,Nome,Email,WhatsApp,Cidade,Estado,Plano,Dias Trial,Aberto,Criado em";
  const rows = restaurants.map((r) => {
    const created = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "";
    return `${r.id},"${sanitizeCsvField(r.name)}","${sanitizeCsvField(r.email)}","${sanitizeCsvField(r.whatsapp)}","${sanitizeCsvField(r.city)}","${sanitizeCsvField(r.state)}","${sanitizeCsvField(r.planType)}",${r.trialDays},${r.isOpen ? "Sim" : "Não"},"${created}"`;
  });

  const csv = [header, ...rows].join("\n");
  const filename = `restaurantes-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

// ============ ADMIN REPORTS ============

export async function getAdminReportsData() {
  const db = await getDb();
  if (!db) return null;

  // Total de restaurantes
  const [totalResult] = await db
    .select({ count: count() })
    .from(establishments);
  const totalRestaurants = totalResult?.count ?? 0;

  // Restaurantes com plano pago (lite, basic, pro)
  const [paidResult] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      or(
        eq(establishments.planType, "lite"),
        eq(establishments.planType, "basic"),
        eq(establishments.planType, "pro")
      )
    );
  const paidRestaurants = paidResult?.count ?? 0;

  // Restaurantes em trial ativo
  const [activeTrialResult] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
      )
    );
  const activeTrials = activeTrialResult?.count ?? 0;

  // Trials expirados
  const [expiredTrialResult] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
      )
    );
  const expiredTrials = expiredTrialResult?.count ?? 0;

  // Receita mensal estimada (baseada nos planos ativos)
  // lite = R$49, basic = R$89, pro = R$149
  const planPrices: Record<string, number> = {
    lite: 49,
    basic: 89,
    pro: 149,
  };

  const paidBreakdown = await db
    .select({
      planType: establishments.planType,
      count: count(),
    })
    .from(establishments)
    .where(
      or(
        eq(establishments.planType, "lite"),
        eq(establishments.planType, "basic"),
        eq(establishments.planType, "pro")
      )
    )
    .groupBy(establishments.planType);

  let monthlyRevenue = 0;
  const planDistribution: Record<string, number> = {};
  for (const row of paidBreakdown) {
    const price = planPrices[row.planType] ?? 0;
    monthlyRevenue += price * row.count;
    planDistribution[row.planType] = row.count;
  }

  // Taxa de conversão: (pagos / (pagos + trials expirados)) * 100
  const totalTrialCompleted = paidRestaurants + expiredTrials;
  const conversionRate = totalTrialCompleted > 0
    ? (paidRestaurants / totalTrialCompleted) * 100
    : 0;

  // Receita anual projetada
  const annualRevenue = monthlyRevenue * 12;

  // Ticket médio por restaurante ativo
  const ticketMedio = paidRestaurants > 0
    ? monthlyRevenue / paidRestaurants
    : 0;

  // Churn rate: expirados / total * 100
  const churnRate = totalRestaurants > 0
    ? (expiredTrials / totalRestaurants) * 100
    : 0;

  // Distribuição por status para gráfico donut
  const statusDistribution = {
    ativos: paidRestaurants,
    emTeste: activeTrials,
    expirados: expiredTrials,
  };

  return {
    totalRestaurants,
    monthlyRevenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    activeRestaurants: paidRestaurants,
    annualRevenue,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    churnRate: Math.round(churnRate * 10) / 10,
    statusDistribution,
    planDistribution,
    activeTrials,
    expiredTrials,
  };
}


// ============ ORDER LOGS ============

export async function getOrderLogs(filters: {
  establishmentId?: number;
  level?: 'info' | 'warn' | 'error';
  event?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
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
  if (filters.source) {
    conditions.push(eq(orderLogs.source, filters.source));
  }
  if (filters.search) {
    conditions.push(
      or(
        like(orderLogs.message, `%${filters.search}%`),
        like(orderLogs.customerName, `%${filters.search}%`),
        like(orderLogs.customerPhone, `%${filters.search}%`),
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Join com establishments para pegar o nome
  const results = await db
    .select({
      id: orderLogs.id,
      establishmentId: orderLogs.establishmentId,
      orderId: orderLogs.orderId,
      customerId: orderLogs.customerId,
      customerName: orderLogs.customerName,
      customerPhone: orderLogs.customerPhone,
      level: orderLogs.level,
      event: orderLogs.event,
      message: orderLogs.message,
      details: orderLogs.details,
      source: orderLogs.source,
      ipAddress: orderLogs.ipAddress,
      userAgent: orderLogs.userAgent,
      createdAt: orderLogs.createdAt,
      establishmentName: establishments.name,
    })
    .from(orderLogs)
    .leftJoin(establishments, eq(orderLogs.establishmentId, establishments.id))
    .where(whereClause)
    .orderBy(desc(orderLogs.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);
  
  return results;
}

export async function getOrderLogsCount(filters: {
  establishmentId?: number;
  level?: 'info' | 'warn' | 'error';
  event?: string;
  source?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return 0;
  
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
  if (filters.source) {
    conditions.push(eq(orderLogs.source, filters.source));
  }
  if (filters.search) {
    conditions.push(
      or(
        like(orderLogs.message, `%${filters.search}%`),
        like(orderLogs.customerName, `%${filters.search}%`),
        like(orderLogs.customerPhone, `%${filters.search}%`),
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orderLogs)
    .where(whereClause);
  
  return result[0]?.count ?? 0;
}

export async function getOrderLogsStats() {
  const db = await getDb();
  if (!db) return { total: 0, info: 0, warn: 0, error: 0 };
  
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(orderLogs);
  const [info] = await db.select({ count: sql<number>`count(*)` }).from(orderLogs).where(eq(orderLogs.level, 'info'));
  const [warn] = await db.select({ count: sql<number>`count(*)` }).from(orderLogs).where(eq(orderLogs.level, 'warn'));
  const [error] = await db.select({ count: sql<number>`count(*)` }).from(orderLogs).where(eq(orderLogs.level, 'error'));
  
  return {
    total: total?.count ?? 0,
    info: info?.count ?? 0,
    warn: warn?.count ?? 0,
    error: error?.count ?? 0,
  };
}

export async function getOrderLogsEstablishments() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: establishments.id,
      name: establishments.name,
    })
    .from(establishments)
    .where(
      sql`${establishments.id} IN (SELECT DISTINCT establishment_id FROM order_logs WHERE establishment_id IS NOT NULL)`
    )
    .orderBy(asc(establishments.name));
  
  return results;
}


// ============ PLAN MANAGEMENT ============


/**
 * Busca todos os preços de planos
 */
export async function getAllPlanPrices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planPrices);
}

/**
 * Busca preço de um plano específico
 */
export async function getPlanPrice(planId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(planPrices).where(eq(planPrices.planId, planId)).limit(1);
  return result[0] || null;
}

/**
 * Atualiza ou cria preço de um plano (upsert)
 */
export async function upsertPlanPrice(planId: string, monthlyPriceCents: number, annualPriceCents: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getPlanPrice(planId);
  if (existing) {
    await db.update(planPrices)
      .set({ monthlyPriceCents, annualPriceCents })
      .where(eq(planPrices.planId, planId));
  } else {
    await db.insert(planPrices).values({ planId, monthlyPriceCents, annualPriceCents });
  }
  return { planId, monthlyPriceCents, annualPriceCents };
}

/**
 * Atualiza o displayName de um plano
 */
export async function updatePlanDisplayName(planId: string, displayName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getPlanPrice(planId);
  if (existing) {
    await db.update(planPrices)
      .set({ displayName })
      .where(eq(planPrices.planId, planId));
  } else {
    await db.insert(planPrices).values({ planId, displayName, monthlyPriceCents: 0, annualPriceCents: 0 });
  }
  return { planId, displayName };
}

/**
 * Busca todas as features de todos os planos
 */
export async function getAllPlanFeatures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planFeatures).orderBy(asc(planFeatures.sortOrder));
}

/**
 * Busca features de um plano específico
 */
export async function getPlanFeaturesByPlanId(planId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planFeatures)
    .where(eq(planFeatures.planId, planId))
    .orderBy(asc(planFeatures.sortOrder));
}

/**
 * Adiciona uma feature a um plano
 */
export async function addPlanFeature(planId: string, text: string, sortOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(planFeatures).values({ planId, text, sortOrder });
  return { id: result[0].insertId, planId, text, sortOrder };
}

/**
 * Atualiza o texto de uma feature
 */
export async function updatePlanFeature(id: number, text: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(planFeatures).set({ text }).where(eq(planFeatures.id, id));
}

/**
 * Remove uma feature
 */
export async function deletePlanFeature(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(planFeatures).where(eq(planFeatures.id, id));
}

/**
 * Reordena features de um plano
 */
export async function reorderPlanFeatures(planId: string, featureIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < featureIds.length; i++) {
    await db.update(planFeatures)
      .set({ sortOrder: i })
      .where(and(eq(planFeatures.id, featureIds[i]), eq(planFeatures.planId, planId)));
  }
}

/**
 * Busca todos os dados de planos (preços + features) para exibição pública
 */
export async function getAllPlanData() {
  const [prices, features] = await Promise.all([
    getAllPlanPrices(),
    getAllPlanFeatures(),
  ]);
  return { prices, features };
}


// ============ ADMIN DELETE ESTABLISHMENT (CASCATA COMPLETA) ============

/**
 * Exclui completamente um estabelecimento e todos os dados relacionados.
 * ATENÇÃO: Esta operação é irreversível!
 */
export async function adminDeleteEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const estId = establishmentId;

  // 1. Buscar IDs necessários para sub-queries
  const estProducts = await db.select({ id: products.id }).from(products).where(eq(products.establishmentId, estId));
  const productIds = estProducts.map(p => p.id);

  const estStories = await db.select({ id: stories.id }).from(stories).where(eq(stories.establishmentId, estId));
  const storyIds = estStories.map(s => s.id);

  const estTabs = await db.select({ id: tabs.id }).from(tabs).where(eq(tabs.establishmentId, estId));
  const tabIds = estTabs.map(t => t.id);

  const estComboGroups = productIds.length > 0
    ? await db.select({ id: comboGroups.id }).from(comboGroups).where(sql`${comboGroups.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`)
    : [];
  const comboGroupIds = estComboGroups.map(g => g.id);

  // 2. Excluir tabelas dependentes de sub-queries primeiro
  if (comboGroupIds.length > 0) {
    await db.delete(comboGroupItems).where(sql`${comboGroupItems.comboGroupId} IN (${sql.join(comboGroupIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (productIds.length > 0) {
    await db.delete(comboGroups).where(sql`${comboGroups.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (storyIds.length > 0) {
    await db.delete(storyViews).where(sql`${storyViews.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (tabIds.length > 0) {
    await db.delete(tabItems).where(sql`${tabItems.tabId} IN (${sql.join(tabIds.map(id => sql`${id}`), sql`, `)})`);
  }

  // 3. Excluir todas as tabelas com establishmentId direto
  const tablesToDelete = [
    // Pedidos e itens
    orderItems, orders, orderCounters, pendingOnlineOrders,
    // Categorias e produtos
    complementItems, complementGroups, products, categories,
    // Estoque
    stockMovements, stockItems, stockCategories,
    // Cupons e avaliações
    coupons, reviews,
    // Horários e taxas
    businessHours, neighborhoodFees,
    // Fidelidade e cashback
    loyaltyStamps, loyaltyCards,
    cashbackTransactions, cashbackBalances,
    // Impressão
    printQueue, printLogs, printerSettings, printers,
    // Push e WhatsApp
    pushSubscriptions,
    whatsappMessages, whatsappConversations, whatsappConfig,
    // iFood
    ifoodConfig,
    // Menu analytics
    menuSessions, menuViewsDaily, menuViewsHourly,
    // SMS
    smsTransactions, smsBalance, scheduledCampaigns,
    // Mesas e comandas
    tabPayments, tabs,
    tableSpaces, tables,
    // Clientes PDV
    pdvCustomers,
    // Entregadores
    deliveries, drivers,
    // Finanças
    recurringExpenseHistory, recurringExpenses,
    expenses, expenseCategories,
    monthlyGoals, financialGoals, weeklyGoals,
    // Bot API
    botApiKeys,
    // Feedbacks
    feedbacks,
    // Stories
    storyEvents, stories,
    // IA
    aiImageCreditLogs,
    // Colaboradores
    collaborators,
    // Fechamentos programados
    scheduledClosures,
    // Chat shortcuts
    chatShortcuts,
    // Order logs
    orderLogs,
    // Paytime
    paytimeTransactions,
  ];

  for (const table of tablesToDelete) {
    const tableName = (table as any)?.[Symbol.for("drizzle:Name")] || (table as any)?._?.name || "unknown";
    try {
      const estCol = (table as any).establishmentId;
      if (!estCol) {
        logger.warn(`[AdminDelete] Tabela ${tableName} não tem coluna establishmentId, pulando.`);
        continue;
      }
      await db.delete(table).where(eq(estCol, estId));
    } catch (err: any) {
      logger.warn(`[AdminDelete] Falha ao excluir tabela ${tableName}: ${err?.message || err}`);
    }
  }

  // 4. Buscar o userId do dono antes de excluir o establishment
  const [est] = await db.select({ userId: establishments.userId }).from(establishments).where(eq(establishments.id, estId));
  const userId = est?.userId;

  // 5. Excluir o establishment
  await db.delete(establishments).where(eq(establishments.id, estId));

  // 6. Excluir o user dono (se não tiver outros establishments)
  if (userId) {
    const otherEstablishments = await db.select({ id: establishments.id }).from(establishments).where(eq(establishments.userId, userId));
    if (otherEstablishments.length === 0) {
      await db.delete(users).where(eq(users.id, userId));
    }
  }

  logger.info(`[AdminDelete] Estabelecimento #${estId} excluído completamente.`);
  return { success: true, deletedEstablishmentId: estId, deletedUserId: userId };
}

// ============ PAYMENT HISTORY ============
export async function getPaymentHistory(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  const subs = await db
    .select({
      id: planSubscriptions.id,
      planId: planSubscriptions.planId,
      billingPeriod: planSubscriptions.billingPeriod,
      gateway: planSubscriptions.gateway,
      status: planSubscriptions.status,
      amountCents: planSubscriptions.amountCents,
      currentPeriodStart: planSubscriptions.currentPeriodStart,
      currentPeriodEnd: planSubscriptions.currentPeriodEnd,
      lastPaymentAt: planSubscriptions.lastPaymentAt,
      createdAt: planSubscriptions.createdAt,
      paytimeCardBrand: planSubscriptions.paytimeCardBrand,
      paytimeCardLast4: planSubscriptions.paytimeCardLast4,
    })
    .from(planSubscriptions)
    .where(eq(planSubscriptions.establishmentId, establishmentId))
    .orderBy(desc(planSubscriptions.createdAt));
  return subs;
}

// ============ SSE CONNECTIVITY LOGS ============
export async function insertSseConnectivityLog(data: {
  establishmentId: number;
  event: "disconnected" | "order_missed" | "reconnected";
  message: string;
  orderId?: number;
  details?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(sseConnectivityLogs).values({
    establishmentId: data.establishmentId,
    event: data.event,
    message: data.message,
    orderId: data.orderId || null,
    details: data.details || null,
  });
}

export async function getSseConnectivityLogs(filters: {
  establishmentId?: number;
  event?: "disconnected" | "order_missed" | "reconnected";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters.establishmentId) {
    conditions.push(eq(sseConnectivityLogs.establishmentId, filters.establishmentId));
  }
  if (filters.event) {
    conditions.push(eq(sseConnectivityLogs.event, filters.event));
  }
  const rows = await db
    .select({
      id: sseConnectivityLogs.id,
      establishmentId: sseConnectivityLogs.establishmentId,
      event: sseConnectivityLogs.event,
      message: sseConnectivityLogs.message,
      orderId: sseConnectivityLogs.orderId,
      details: sseConnectivityLogs.details,
      createdAt: sseConnectivityLogs.createdAt,
    })
    .from(sseConnectivityLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sseConnectivityLogs.createdAt))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);
  return rows;
}

export async function getSseConnectivityLogsCount(filters: {
  establishmentId?: number;
  event?: "disconnected" | "order_missed" | "reconnected";
}) {
  const db = await getDb();
  if (!db) return 0;
  const conditions: any[] = [];
  if (filters.establishmentId) {
    conditions.push(eq(sseConnectivityLogs.establishmentId, filters.establishmentId));
  }
  if (filters.event) {
    conditions.push(eq(sseConnectivityLogs.event, filters.event));
  }
  const result = await db
    .select({ count: count() })
    .from(sseConnectivityLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return result[0]?.count ?? 0;
}
