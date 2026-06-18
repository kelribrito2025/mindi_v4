/**
 * Plan Subscription Database Functions
 * Gerencia gateway settings e assinaturas de planos via Paytime/Stripe.
 */
import { eq, and, lte, desc, asc, sql, isNull, or } from "drizzle-orm";
import { getDb } from "./db";
import { gatewaySettings, planSubscriptions } from "../drizzle/schema";
import type { GatewaySetting, InsertGatewaySetting, PlanSubscription, InsertPlanSubscription } from "../drizzle/schema";

const PLAN_RENEWAL_TIME_ZONE = "America/Sao_Paulo";

function getDatePartsInTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtcMs = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtcMs - date.getTime();
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstPassUtcMs = targetUtcMs - getTimeZoneOffsetMs(new Date(targetUtcMs), timeZone);
  const secondPassUtcMs = targetUtcMs - getTimeZoneOffsetMs(new Date(firstPassUtcMs), timeZone);
  return new Date(secondPassUtcMs);
}

function getEndOfCurrentDateInTimeZone(referenceDate: Date, timeZone = PLAN_RENEWAL_TIME_ZONE): Date {
  const { year, month, day } = getDatePartsInTimeZone(referenceDate, timeZone);
  const startOfNextDateUtc = zonedDateTimeToUtc(year, month, day + 1, 0, 0, 0, timeZone);
  return new Date(startOfNextDateUtc.getTime() - 1);
}

// ============ GATEWAY SETTINGS ============

export async function getGatewaySettings(): Promise<GatewaySetting[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gatewaySettings).orderBy(asc(gatewaySettings.sortOrder));
}

export async function getEnabledGateways(): Promise<GatewaySetting[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gatewaySettings)
    .where(eq(gatewaySettings.enabled, true))
    .orderBy(asc(gatewaySettings.sortOrder));
}

export async function upsertGatewaySetting(gateway: string, enabled: boolean, displayName?: string, sortOrder?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(gatewaySettings).where(eq(gatewaySettings.gateway, gateway)).limit(1);
  
  if (existing.length > 0) {
    const updateData: Partial<InsertGatewaySetting> = { enabled };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    await db.update(gatewaySettings).set(updateData).where(eq(gatewaySettings.gateway, gateway));
  } else {
    await db.insert(gatewaySettings).values({
      gateway,
      enabled,
      displayName: displayName || gateway,
      sortOrder: sortOrder ?? 0,
    });
  }
}

export async function seedDefaultGateways(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(gatewaySettings);
  if (existing.length > 0) return; // Already seeded
  
  await db.insert(gatewaySettings).values([
    { gateway: "paytime_pix", enabled: false, displayName: "PIX (Paytime)", sortOrder: 1 },
    { gateway: "paytime_card", enabled: false, displayName: "Cartão (Paytime)", sortOrder: 2 },
    { gateway: "stripe_card", enabled: true, displayName: "Cartão (Stripe)", sortOrder: 3 },
  ]);
}

// ============ PLAN SUBSCRIPTIONS ============

export async function createPlanSubscription(data: InsertPlanSubscription): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(planSubscriptions).values(data);
  return result[0].insertId;
}

export async function getActiveSubscription(establishmentId: number): Promise<PlanSubscription | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(planSubscriptions)
    .where(and(
      eq(planSubscriptions.establishmentId, establishmentId),
      or(
        eq(planSubscriptions.status, "active"),
        eq(planSubscriptions.status, "pending"),
        eq(planSubscriptions.status, "past_due"),
        eq(planSubscriptions.status, "canceling"),
      )
    ))
    .orderBy(desc(planSubscriptions.createdAt), desc(planSubscriptions.id))
    .limit(1);
  
  return result[0] || null;
}

export async function getSubscriptionById(id: number): Promise<PlanSubscription | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(planSubscriptions).where(eq(planSubscriptions.id, id)).limit(1);
  return result[0] || null;
}

export async function getSubscriptionByPaytimeTransactionId(transactionId: string): Promise<PlanSubscription | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(planSubscriptions)
    .where(or(
      eq(planSubscriptions.paytimeTransactionId, transactionId),
      eq(planSubscriptions.renewalPixTransactionId, transactionId),
    ))
    .limit(1);
  
  return result[0] || null;
}

export async function getSubscriptionByStripeSubscriptionId(subscriptionId: string): Promise<PlanSubscription | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(planSubscriptions)
    .where(eq(planSubscriptions.stripeSubscriptionId, subscriptionId))
    .orderBy(desc(planSubscriptions.createdAt))
    .limit(1);

  return result[0] || null;
}

export async function updateSubscriptionById(id: number, data: Partial<PlanSubscription>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(planSubscriptions).set(data).where(eq(planSubscriptions.id, id));
}

export async function updateSubscriptionStatus(
  id: number,
  status: "active" | "pending" | "past_due" | "canceled" | "expired" | "canceling",
  extraData?: Partial<PlanSubscription>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planSubscriptions).set({
    status,
    ...extraData,
  }).where(eq(planSubscriptions.id, id));
}

export async function activateSubscription(
  id: number,
  options: {
    paytimeTransactionId?: string;
    paytimeCardToken?: string;
    paytimeCardBrand?: string;
    paytimeCardLast4?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextRenewalAt?: Date;
    amountCents?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planSubscriptions).set({
    status: "active",
    lastPaymentAt: new Date(),
    renewalAttempts: 0,
    lastRenewalError: null,
    gracePeriodEnd: null,
    renewalPixEmv: null,
    renewalPixTransactionId: null,
    renewalNotifiedAt: null,
    ...options,
  }).where(eq(planSubscriptions.id, id));
}

export async function getSubscriptionsDueForRenewal(): Promise<PlanSubscription[]> {
  const db = await getDb();
  if (!db) return [];
  
  // A rotina diária roda às 08:00 BRT. Para cobrar todos os planos que vencem
  // na data atual de Brasília, ignoramos hora/minuto/segundo salvos em nextRenewalAt
  // e buscamos tudo até 23:59:59.999 da data local.
  const renewalCutoff = getEndOfCurrentDateInTimeZone(new Date());
  const dueSubscriptions = await db.select().from(planSubscriptions)
    .where(and(
      eq(planSubscriptions.status, "active"),
      lte(planSubscriptions.nextRenewalAt, renewalCutoff),
    ))
    .orderBy(asc(planSubscriptions.nextRenewalAt));

  // Segurança contra cobranças duplicadas: se houver mais de uma assinatura aberta
  // para o mesmo estabelecimento, somente a assinatura aberta mais recente deve ser
  // considerada canônica. Isso evita que registros antigos ainda ativos disparem
  // cobranças automáticas adicionais no WhatsApp/PIX.
  const subscriptionsToRenew: PlanSubscription[] = [];
  for (const subscription of dueSubscriptions) {
    const latestOpen = await db.select().from(planSubscriptions)
      .where(and(
        eq(planSubscriptions.establishmentId, subscription.establishmentId),
        or(
          eq(planSubscriptions.status, "active"),
          eq(planSubscriptions.status, "pending"),
          eq(planSubscriptions.status, "past_due"),
        eq(planSubscriptions.status, "canceling"),
        ),
      ))
      .orderBy(desc(planSubscriptions.createdAt), desc(planSubscriptions.id))
      .limit(1);

    if (latestOpen[0]?.id === subscription.id) {
      subscriptionsToRenew.push(subscription);
    }
  }

  return subscriptionsToRenew;
}

export async function getSubscriptionsInGracePeriod(): Promise<PlanSubscription[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return db.select().from(planSubscriptions)
    .where(and(
      eq(planSubscriptions.status, "past_due"),
        eq(planSubscriptions.status, "canceling"),
      lte(planSubscriptions.gracePeriodEnd, now),
    ));
}

export async function markSubscriptionPastDue(
  id: number,
  gracePeriodEnd: Date,
  renewalPixEmv?: string,
  renewalPixTransactionId?: string,
  amountCents?: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planSubscriptions).set({
    status: "past_due",
    gracePeriodEnd,
    renewalNotifiedAt: new Date(),
    ...(renewalPixEmv && { renewalPixEmv }),
    ...(renewalPixTransactionId && { renewalPixTransactionId }),
    ...(typeof amountCents === "number" && Number.isFinite(amountCents) && amountCents > 0 ? { amountCents } : {}),
  }).where(eq(planSubscriptions.id, id));
}

export async function incrementRenewalAttempts(id: number, error?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planSubscriptions).set({
    renewalAttempts: sql`${planSubscriptions.renewalAttempts} + 1`,
    lastRenewalError: error || null,
  }).where(eq(planSubscriptions.id, id));
}

export async function cancelSubscription(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planSubscriptions).set({
    status: "canceled",
    canceledAt: new Date(),
  }).where(eq(planSubscriptions.id, id));
}

export async function getAllSubscriptionsForEstablishment(establishmentId: number): Promise<PlanSubscription[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(planSubscriptions)
    .where(eq(planSubscriptions.establishmentId, establishmentId))
    .orderBy(desc(planSubscriptions.createdAt));
}

export async function updateSubscriptionTransactionId(id: number, newTransactionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planSubscriptions).set({
    paytimeTransactionId: newTransactionId,
  }).where(eq(planSubscriptions.id, id));
}
