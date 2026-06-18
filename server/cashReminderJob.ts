import { logger } from "./_core/logger";
import {
  getAllEstablishmentsWithCashReminders,
  getCashReminderSettings,
  getCashCurrentSession,
  getBusinessHoursByEstablishment,
  getCashReminderLogForToday,
  createOrUpdateCashReminderLog,
  getPushSubscriptionsByEstablishment,
  deletePushSubscriptionById,
} from "./db";
import { sendPushNotification } from "./_core/webPush";

const CASH_REMINDER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
let jobInterval: ReturnType<typeof setInterval> | null = null;
let isProcessing = false;

/**
 * Converte hora no formato "HH:MM" para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Obtém a data e hora atual no timezone do estabelecimento
 */
function getNowInTimezone(timezone: string): { dateStr: string; currentMinutes: number; dayOfWeek: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dateStr = formatter.format(now); // YYYY-MM-DD
  
  const timeFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
  const timeParts = timeFormatter.formatToParts(now);
  const hour = parseInt(timeParts.find(p => p.type === "hour")?.value || "0");
  const minute = parseInt(timeParts.find(p => p.type === "minute")?.value || "0");
  const currentMinutes = hour * 60 + minute;
  
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" });
  const dayStr = dayFormatter.format(now);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[dayStr] ?? 0;
  
  return { dateStr, currentMinutes, dayOfWeek };
}

/**
 * Envia push notification para todos os dispositivos do estabelecimento
 */
async function sendReminderPush(establishmentId: number, title: string, body: string, type: "open" | "close") {
  try {
    const subscriptions = await getPushSubscriptionsByEstablishment(establishmentId);
    for (const sub of subscriptions) {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        {
          title,
          body,
          icon: "/icons/icon-192x192.png",
          tag: `cash-reminder-${type}`,
          requireInteraction: true,
          data: { url: "/controle-caixa", type: `cash-reminder-${type}` },
        }
      );
      if (!success) {
        await deletePushSubscriptionById(sub.id);
      }
    }
  } catch (err) {
    logger.error(`[CashReminderJob] Erro ao enviar push para establishment ${establishmentId}:`, err);
  }
}

/**
 * Processa lembretes para um estabelecimento específico
 */
async function processEstablishmentReminders(estab: { id: number; timezone: string }) {
  let settings = await getCashReminderSettings(estab.id);
  // Se nao tem settings, usa valores padrao (lembretes ativados por padrao)
  if (!settings) {
    settings = {
      id: 0,
      establishmentId: estab.id,
      openReminderEnabled: true,
      closeReminderEnabled: true,
      openReminderDelayMinutes: 5,
      closeReminderBeforeMinutes: 5,
      maxCloseReminders: 3,
      respectClosedDays: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  // Nenhum lembrete ativo
  if (!settings.openReminderEnabled && !settings.closeReminderEnabled) return;
  
  const { dateStr, currentMinutes, dayOfWeek } = getNowInTimezone(estab.timezone);
  
  // Buscar horários de funcionamento
  const businessHours = await getBusinessHoursByEstablishment(estab.id);
  const todayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek);
  
  // Dia sem expediente
  if (!todayHours || !todayHours.isActive || !todayHours.openTime || !todayHours.closeTime) {
    if (settings.respectClosedDays) return;
  }
  
  if (!todayHours || !todayHours.openTime || !todayHours.closeTime) return;
  
  const openMinutes = timeToMinutes(todayHours.openTime);
  const closeMinutes = timeToMinutes(todayHours.closeTime);
  
  // Verificar sessão de caixa atual
  const currentSession = await getCashCurrentSession(estab.id);
  const hasCashOpen = !!currentSession;
  
  // ─── LEMBRETE DE ABERTURA ───
  if (settings.openReminderEnabled && !hasCashOpen) {
    const reminderTriggerMinutes = openMinutes + settings.openReminderDelayMinutes;
    
    // Se já passou o horário de abertura + delay e caixa não abriu
    if (currentMinutes >= reminderTriggerMinutes && currentMinutes < closeMinutes) {
      const existingLog = await getCashReminderLogForToday(estab.id, "open", dateStr);
      
      // Só envia 1 lembrete de abertura por dia
      if (!existingLog) {
        logger.info(`[CashReminderJob] Enviando lembrete de ABERTURA para establishment ${estab.id}`);
        await createOrUpdateCashReminderLog(estab.id, "open", dateStr);
        await sendReminderPush(
          estab.id,
          "⏰ Lembrete: Abrir Caixa",
          `O horário de funcionamento começou às ${todayHours.openTime} e o caixa ainda não foi aberto.`
        , "open");
      }
    }
  }
  
  // ─── LEMBRETE DE FECHAMENTO ───
  if (settings.closeReminderEnabled && hasCashOpen) {
    const reminderTriggerMinutes = closeMinutes - settings.closeReminderBeforeMinutes;
    
    // Se está próximo do fechamento ou já passou
    if (currentMinutes >= reminderTriggerMinutes) {
      const existingLog = await getCashReminderLogForToday(estab.id, "close", dateStr);
      
      // Máximo de lembretes de fechamento
      if (!existingLog || (existingLog.sentCount < settings.maxCloseReminders && !existingLog.dismissed)) {
        // Verificar intervalo mínimo entre lembretes (5 min)
        if (existingLog) {
          const lastSentTime = new Date(existingLog.lastSentAt).getTime();
          const now = Date.now();
          if (now - lastSentTime < 5 * 60 * 1000) return; // Esperar pelo menos 5 min
        }
        
        logger.info(`[CashReminderJob] Enviando lembrete de FECHAMENTO para establishment ${estab.id} (${existingLog ? existingLog.sentCount + 1 : 1}/${settings.maxCloseReminders})`);
        await createOrUpdateCashReminderLog(estab.id, "close", dateStr);
        
        const isOvertime = currentMinutes >= closeMinutes;
        const body = isOvertime
          ? `O horário de funcionamento encerrou às ${todayHours.closeTime} e o caixa ainda está aberto!`
          : `O horário de funcionamento encerra às ${todayHours.closeTime}. Lembre-se de fechar o caixa.`;
        
        await sendReminderPush(
          estab.id,
          "⏰ Lembrete: Fechar Caixa",
          body,
          "close"
        );
      }
    }
  }
}

/**
 * Processa todos os estabelecimentos com lembretes configurados
 */
async function processCashReminders() {
  if (isProcessing) {
    logger.info("[CashReminderJob] Execução anterior ainda em andamento; pulando ciclo");
    return;
  }
  isProcessing = true;
  try {
    const establishments = await getAllEstablishmentsWithCashReminders();
    if (establishments.length === 0) return;
    
    for (const estab of establishments) {
      try {
        await processEstablishmentReminders(estab);
      } catch (err) {
        logger.error(`[CashReminderJob] Erro ao processar establishment ${estab.id}:`, err);
      }
    }
  } catch (err) {
    logger.error("[CashReminderJob] Erro geral:", err);
  } finally {
    isProcessing = false;
  }
}

export function startCashReminderJob() {
  if (jobInterval) {
    logger.info("[CashReminderJob] Job já está rodando");
    return;
  }
  logger.info("[CashReminderJob] Iniciando job de lembretes de caixa (intervalo: 5min)");
  processCashReminders();
  jobInterval = setInterval(processCashReminders, CASH_REMINDER_INTERVAL_MS);
}

export function stopCashReminderJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    logger.info("[CashReminderJob] Job parado");
  }
}
