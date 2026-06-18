/**
 * Platform WhatsApp DB helpers
 * Manages the Mindi platform WhatsApp instance for sending billing notifications
 */
import { eq } from "drizzle-orm";
import { platformWhatsappConfig } from "../drizzle/schema";

async function getDb() {
  const { getDb: getDbInstance } = await import("./db");
  return getDbInstance();
}

/**
 * Get the platform WhatsApp config (singleton - only 1 row)
 */
export async function getPlatformWhatsappConfig() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(platformWhatsappConfig).limit(1);
  return rows[0] || null;
}

/**
 * Create or update the platform WhatsApp config
 */
export async function upsertPlatformWhatsappConfig(data: {
  instanceId?: string | null;
  instanceToken?: string | null;
  instanceName?: string;
  status?: "disconnected" | "connecting" | "connected";
  connectedPhone?: string | null;
  connectedName?: string | null;
  lastQrCode?: string | null;
  templateRenewalPix?: string | null;
  templateRenewalCard?: string | null;
  templatePlanActivated?: string | null;
  templatePlanExpiring?: string | null;
  templatePlanDeactivated?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getPlatformWhatsappConfig();

  if (existing) {
    await db
      .update(platformWhatsappConfig)
      .set(data)
      .where(eq(platformWhatsappConfig.id, existing.id));
    return { ...existing, ...data };
  } else {
    const [result] = await db.insert(platformWhatsappConfig).values({
      instanceName: data.instanceName || "mindi_platform",
      instanceId: data.instanceId,
      instanceToken: data.instanceToken,
      status: data.status || "disconnected",
      connectedPhone: data.connectedPhone,
      connectedName: data.connectedName,
      lastQrCode: data.lastQrCode,
      templateRenewalPix: data.templateRenewalPix,
      templateRenewalCard: data.templateRenewalCard,
      templatePlanActivated: data.templatePlanActivated,
      templatePlanExpiring: data.templatePlanExpiring,
      templatePlanDeactivated: data.templatePlanDeactivated,
    });
    return { id: result.insertId, ...data };
  }
}

/**
 * Update just the status and connection info
 */
export async function updatePlatformWhatsappStatus(
  status: "disconnected" | "connecting" | "connected",
  phone?: string | null,
  name?: string | null,
  qrCode?: string | null
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getPlatformWhatsappConfig();
  if (!existing) return;

  await db
    .update(platformWhatsappConfig)
    .set({
      status,
      connectedPhone: phone !== undefined ? phone : existing.connectedPhone,
      connectedName: name !== undefined ? name : existing.connectedName,
      lastQrCode: qrCode !== undefined ? qrCode : existing.lastQrCode,
    })
    .where(eq(platformWhatsappConfig.id, existing.id));
}

/**
 * Send a billing notification via the platform WhatsApp
 * Returns true if sent successfully, false otherwise
 */
export async function sendPlatformWhatsappMessage(
  phone: string,
  text: string
): Promise<{ success: boolean; message?: string }> {
  const config = await getPlatformWhatsappConfig();
  if (!config || !config.instanceToken || config.status !== "connected") {
    return {
      success: false,
      message: "WhatsApp da plataforma não está conectado",
    };
  }

  const { sendTextMessage } = await import("./_core/uazapi");
  return sendTextMessage(config.instanceToken, phone, text);
}

/**
 * Send an image notification via the platform WhatsApp.
 * Used for PIX QR Code delivery; never log the base64 payload.
 */
export async function sendPlatformWhatsappImage(
  phone: string,
  base64: string,
  caption?: string
): Promise<{ success: boolean; message?: string }> {
  const config = await getPlatformWhatsappConfig();
  if (!config || !config.instanceToken || config.status !== "connected") {
    return {
      success: false,
      message: "WhatsApp da plataforma não está conectado",
    };
  }

  const { sendImageMessage } = await import("./_core/uazapi");
  return sendImageMessage(config.instanceToken, phone, base64, caption);
}

/**
 * Generate the separated messages for a PIX billing renewal notification.
 */
export function generateRenewalPixMessageParts(data: {
  establishmentName: string;
  planName: string;
  amount: string;
  dueDate: string;
  pixEmv: string;
}): { introMessage: string; pixCodeMessage: string; closingMessage: string } {
  return {
    introMessage: `Olá! 👋\n\n${data.establishmentName}, sua assinatura do plano ${data.planName} vence em ${data.dueDate}.\n\n💰 Valor: R$ ${data.amount}`,
    pixCodeMessage: data.pixEmv,
    closingMessage: `Qualquer dúvida, estamos à disposição! 😊\n\nMindi - Cardápio Digital`,
  };
}

/**
 * Generate a billing renewal message using templates
 */
export function generateRenewalMessage(
  template: string | null,
  data: {
    establishmentName: string;
    planName: string;
    amount: string;
    dueDate: string;
    pixEmv?: string;
    pixKey?: string;
  }
): string {
  const defaultTemplate = `Olá! 👋\n\n*{{establishmentName}}*, sua assinatura do plano *{{planName}}* vence em *{{dueDate}}*.\n\n💰 Valor: *R$ {{amount}}*\n\n📱 Pague via PIX usando o código abaixo:\n\n\`\`\`{{pixEmv}}\`\`\`\n\nCopie o código acima e cole no app do seu banco.\n\nQualquer dúvida, estamos à disposição! 😊\n\n*Mindi - Cardápio Digital*`;

  let msg = template || defaultTemplate;
  msg = msg.replace(/{{establishmentName}}/g, data.establishmentName);
  msg = msg.replace(/{{planName}}/g, data.planName);
  msg = msg.replace(/{{amount}}/g, data.amount);
  msg = msg.replace(/{{dueDate}}/g, data.dueDate);
  msg = msg.replace(/{{pixEmv}}/g, data.pixEmv || "");
  msg = msg.replace(/{{pixKey}}/g, data.pixKey || "");
  return msg;
}

/**
 * Generate plan activated message
 */
export function generatePlanActivatedMessage(
  template: string | null,
  data: {
    establishmentName: string;
    planName: string;
    expiresAt: string;
  }
): string {
  const defaultTemplate = `Olá! 🎉\n\n*{{establishmentName}}*, seu plano *{{planName}}* foi ativado com sucesso!\n\n📅 Válido até: *{{expiresAt}}*\n\nAproveite todos os recursos! 🚀\n\n*Mindi - Cardápio Digital*`;

  let msg = template || defaultTemplate;
  msg = msg.replace(/{{establishmentName}}/g, data.establishmentName);
  msg = msg.replace(/{{planName}}/g, data.planName);
  msg = msg.replace(/{{expiresAt}}/g, data.expiresAt);
  return msg;
}

/**
 * Generate plan deactivated message
 */
export function generatePlanDeactivatedMessage(
  template: string | null,
  data: {
    establishmentName: string;
    planName: string;
  }
): string {
  const defaultTemplate = `Olá! ⚠️\n\n*{{establishmentName}}*, infelizmente seu plano *{{planName}}* foi desativado por falta de pagamento.\n\nPara reativar, acesse o painel e escolha um plano.\n\nQualquer dúvida, estamos à disposição! 😊\n\n*Mindi - Cardápio Digital*`;

  let msg = template || defaultTemplate;
  msg = msg.replace(/{{establishmentName}}/g, data.establishmentName);
  msg = msg.replace(/{{planName}}/g, data.planName);
  return msg;
}
