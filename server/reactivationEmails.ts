/**
 * Reactivation Email Module
 * 
 * Sends follow-up emails to users who canceled their subscription:
 * - 15 days after cancelation: "Sentimos sua falta!"
 * - 30 days after cancelation: "Última chance! Seus dados serão arquivados em 60 dias."
 * 
 * The first email (confirmation) is sent immediately in the confirmCancel procedure.
 * 
 * IMPORTANT: Before sending, checks if the establishment already has an active
 * subscription (they may have re-subscribed). If so, skips the email.
 */
import { getDb } from "./db";
import { planSubscriptions } from "../drizzle/schema";
import { eq, and, lte, gte, isNotNull } from "drizzle-orm";
import { sendEmail } from "./email";
import { logger } from "./_core/logger";
import * as db from "./db";

interface ReactivationResult {
  sent15Days: number;
  sent30Days: number;
  skipped: number;
  errors: string[];
}

/**
 * Check if an establishment currently has an active subscription.
 * If they re-subscribed after canceling, we should NOT send reactivation emails.
 */
async function hasActiveSubscription(dbInstance: any, establishmentId: number): Promise<boolean> {
  const activeSubs = await dbInstance.select().from(planSubscriptions)
    .where(and(
      eq(planSubscriptions.establishmentId, establishmentId),
      eq(planSubscriptions.status, "active"),
    ));
  return activeSubs.length > 0;
}

export async function processReactivationEmails(): Promise<ReactivationResult> {
  const result: ReactivationResult = { sent15Days: 0, sent30Days: 0, skipped: 0, errors: [] };
  const dbInstance = await getDb();
  if (!dbInstance) return result;

  const now = new Date();

  // Find subscriptions canceled exactly 15 days ago (within a 24h window)
  const fifteenDaysAgo = new Date(now);
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const fifteenDaysAgoStart = new Date(fifteenDaysAgo);
  fifteenDaysAgoStart.setHours(0, 0, 0, 0);
  const fifteenDaysAgoEnd = new Date(fifteenDaysAgo);
  fifteenDaysAgoEnd.setHours(23, 59, 59, 999);

  // Find subscriptions canceled exactly 30 days ago (within a 24h window)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStart = new Date(thirtyDaysAgo);
  thirtyDaysAgoStart.setHours(0, 0, 0, 0);
  const thirtyDaysAgoEnd = new Date(thirtyDaysAgo);
  thirtyDaysAgoEnd.setHours(23, 59, 59, 999);

  // Get canceled subscriptions from 15 days ago
  const subs15Days = await dbInstance.select().from(planSubscriptions)
    .where(and(
      eq(planSubscriptions.status, "canceled"),
      isNotNull(planSubscriptions.canceledAt),
      gte(planSubscriptions.canceledAt, fifteenDaysAgoStart),
      lte(planSubscriptions.canceledAt, fifteenDaysAgoEnd),
    ));

  // Get canceled subscriptions from 30 days ago
  const subs30Days = await dbInstance.select().from(planSubscriptions)
    .where(and(
      eq(planSubscriptions.status, "canceled"),
      isNotNull(planSubscriptions.canceledAt),
      gte(planSubscriptions.canceledAt, thirtyDaysAgoStart),
      lte(planSubscriptions.canceledAt, thirtyDaysAgoEnd),
    ));

  // Send 15-day reactivation emails
  for (const sub of subs15Days) {
    try {
      // Skip if establishment already has an active subscription
      if (await hasActiveSubscription(dbInstance, sub.establishmentId)) {
        result.skipped++;
        logger.info(`[ReactivationEmails] Skipped 15-day email for est=${sub.establishmentId} (already has active subscription)`);
        continue;
      }

      const establishment = await db.getEstablishmentById(sub.establishmentId);
      if (!establishment) continue;

      // Get user email from establishment
      const user = establishment.userId ? await db.getUserById(establishment.userId) : null;
      const email = user?.email || establishment.email;
      if (!email) continue;

      const estName = establishment.name || "Seu restaurante";

      await sendEmail({
        to: [{ email }],
        subject: "Sentimos sua falta! - Mindi",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Sentimos sua falta! 💚</h2>
            <p>Olá!</p>
            <p>Faz 15 dias que o <strong>${estName}</strong> não está mais com a gente e sentimos sua falta.</p>
            <p>Sabemos que cada negócio tem seus desafios, e queremos te ajudar a superá-los. Que tal voltar com <strong>20% de desconto</strong> no próximo mês?</p>
            <p>Seu cardápio digital, seus pedidos e todos os dados ainda estão salvos e prontos para serem reativados.</p>
            <br/>
            <div style="text-align: center;">
              <a href="https://app.mindi.com.br/planos" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reativar meu plano</a>
            </div>
            <br/>
            <p style="color: #666; font-size: 12px;">Se precisar de ajuda, estamos aqui para você.</p>
            <p>Equipe Mindi</p>
          </div>
        `,
        tags: ["reactivation-15days"],
      });
      result.sent15Days++;
      logger.info(`[ReactivationEmails] 15-day email sent: est=${sub.establishmentId}, email=${email}`);
    } catch (err: any) {
      result.errors.push(`15d est=${sub.establishmentId}: ${err.message}`);
    }
  }

  // Send 30-day reactivation emails
  for (const sub of subs30Days) {
    try {
      // Skip if establishment already has an active subscription
      if (await hasActiveSubscription(dbInstance, sub.establishmentId)) {
        result.skipped++;
        logger.info(`[ReactivationEmails] Skipped 30-day email for est=${sub.establishmentId} (already has active subscription)`);
        continue;
      }

      const establishment = await db.getEstablishmentById(sub.establishmentId);
      if (!establishment) continue;

      const user = establishment.userId ? await db.getUserById(establishment.userId) : null;
      const email = user?.email || establishment.email;
      if (!email) continue;

      const estName = establishment.name || "Seu restaurante";

      await sendEmail({
        to: [{ email }],
        subject: "Última chance! Seus dados serão arquivados em breve - Mindi",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Última chance! ⏰</h2>
            <p>Olá!</p>
            <p>Faz 30 dias que o <strong>${estName}</strong> cancelou a assinatura.</p>
            <p><strong>Em 60 dias, seus dados serão arquivados</strong> e não poderão mais ser recuperados facilmente.</p>
            <p>Isso inclui:</p>
            <ul>
              <li>Seu cardápio digital completo</li>
              <li>Histórico de pedidos</li>
              <li>Dados de clientes</li>
              <li>Configurações personalizadas</li>
            </ul>
            <p>Reative agora e mantenha tudo funcionando:</p>
            <br/>
            <div style="text-align: center;">
              <a href="https://app.mindi.com.br/planos" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reativar antes que expire</a>
            </div>
            <br/>
            <p style="color: #666; font-size: 12px;">Caso não deseje mais receber esses e-mails, ignore esta mensagem.</p>
            <p>Equipe Mindi</p>
          </div>
        `,
        tags: ["reactivation-30days"],
      });
      result.sent30Days++;
      logger.info(`[ReactivationEmails] 30-day email sent: est=${sub.establishmentId}, email=${email}`);
    } catch (err: any) {
      result.errors.push(`30d est=${sub.establishmentId}: ${err.message}`);
    }
  }

  if (result.sent15Days > 0 || result.sent30Days > 0 || result.skipped > 0) {
    logger.info(`[ReactivationEmails] Processed: 15d=${result.sent15Days}, 30d=${result.sent30Days}, skipped=${result.skipped}, errors=${result.errors.length}`);
  }

  return result;
}
