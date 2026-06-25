import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { addConnection, removeConnection, sendHeartbeat, addOrderConnectionForMultiple, removeOrderConnectionFromMultiple, addOrderIdConnectionForMultiple, removeOrderIdConnectionFromMultiple, sendAllOrdersHeartbeat, sendEvent, getConnectionCount, addPrinterConnection, removePrinterConnection, getPrinterConnectionCount, addMenuPublicConnection, removeMenuPublicConnection, sendMenuPublicHeartbeat, sendAllMenuPublicHeartbeats, addChatConnection, removeChatConnection, sendChatHeartbeat, addPublicChatConnection, removePublicChatConnection, sendPublicChatHeartbeat, getCashReceiptFromCache } from "./sse";
import { getUserByOpenId, getEstablishmentByUserId, getOrdersByOrderNumbers, getOrdersByIds, getOrderById, getOrderItems, getOrderItemsWithPrinter, getEstablishmentById, getPrinterSettings, getActivePrinters, getTabById, getTabItems, getTableById, getEstablishmentBySlug, getTabPayments } from "../db";
import { sdk } from "./sdk";
import { startScheduledCampaignJob } from "../scheduledCampaignJob";
import { startScheduledOrdersJob } from "../scheduledOrdersJob";
import { startRecurringExpensesJob } from "../recurringExpensesJob";
import { startAutomaticOrderStatusJob } from "../automaticOrderStatusJob";
import { startCashReminderJob } from "../cashReminderJob";
import { createBotApiRouter } from "../botApiRouter";
import { createReportExportRouter } from "../routers/reportExport";
import QRCode from "qrcode";
// Email templates inline (evita erro de resolução de módulo)
function buildPaytimeApprovalEmail(establishmentName: string, recipientName: string): string {
  const LOGO_URL = "https://app.mindi.com.br/assets/mindi-email-logo-red.png";
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Cadastro Aprovado - Mindi</title></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td align="center" style="padding:20px 0 40px;"><img src="${LOGO_URL}" alt="Mindi" width="64" height="64" style="display:block;border-radius:16px;"/></td></tr><tr><td align="center" style="padding:0 0 12px;"><h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Parab&eacute;ns${recipientName ? `, ${recipientName}` : ""}!</h1></td></tr><tr><td align="center" style="padding:0 0 16px;"><p style="margin:0;color:#333333;font-size:18px;line-height:1.5;font-weight:600;">Seu cadastro foi aprovado!</p></td></tr><tr><td align="center" style="padding:0 0 32px;"><p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">O estabelecimento <strong>${establishmentName}</strong> foi aprovado na Mindi. Agora voc&ecirc; pode aceitar pagamentos online via <strong>PIX</strong> e <strong>Cart&atilde;o de Cr&eacute;dito</strong> diretamente pelo seu card&aacute;pio digital!</p></td></tr><tr><td align="center" style="padding:0 0 24px;"><div style="width:80px;height:80px;border-radius:50%;background-color:#22c55e;display:inline-block;line-height:80px;text-align:center;"><span style="color:#ffffff;font-size:40px;">&#10003;</span></div></td></tr><tr><td style="padding:0 0 32px;"><p style="margin:0 0 12px;color:#333333;font-size:16px;font-weight:600;">Pr&oacute;ximos passos:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">1. Acesse seu painel de administra&ccedil;&atilde;o</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">2. V&aacute; at&eacute; a se&ccedil;&atilde;o <strong>Financeiro</strong> para ativar os m&eacute;todos de pagamento</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">3. Comece a receber pagamentos online!</td></tr></table></td></tr><tr><td style="padding:0 0 24px;"><hr style="border:none;border-top:1px solid #eeeeee;margin:0;"/></td></tr><tr><td align="center" style="padding:0 0 40px;"><p style="margin:0 0 4px;color:#bbbbbb;font-size:12px;">&copy; ${new Date().getFullYear()} Mindi - Todos os direitos reservados.</p><p style="margin:0;color:#bbbbbb;font-size:12px;">Este &eacute; um e-mail autom&aacute;tico.</p></td></tr></table></td></tr></table></body></html>`;
}

function buildPaytimeRejectionEmail(establishmentName: string, recipientName: string, status: string): string {
  const LOGO_URL = "https://app.mindi.com.br/assets/mindi-email-logo-red.png";
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Cadastro - A&ccedil;&atilde;o Necess&aacute;ria - Mindi</title></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td align="center" style="padding:20px 0 40px;"><img src="${LOGO_URL}" alt="Mindi" width="64" height="64" style="display:block;border-radius:16px;"/></td></tr><tr><td align="center" style="padding:0 0 12px;"><h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Ol&aacute;${recipientName ? `, ${recipientName}` : ""}</h1></td></tr><tr><td align="center" style="padding:0 0 16px;"><p style="margin:0;color:#333333;font-size:18px;line-height:1.5;font-weight:600;">Seu cadastro precisa de aten&ccedil;&atilde;o</p></td></tr><tr><td align="center" style="padding:0 0 32px;"><p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">O cadastro do estabelecimento <strong>${establishmentName}</strong> na Mindi n&atilde;o foi aprovado.<br><br><strong>Status:</strong> ${status}</p></td></tr><tr><td align="center" style="padding:0 0 24px;"><div style="width:80px;height:80px;border-radius:50%;background-color:#f59e0b;display:inline-block;line-height:80px;text-align:center;"><span style="color:#ffffff;font-size:40px;">!</span></div></td></tr><tr><td style="padding:0 0 32px;"><p style="margin:0 0 12px;color:#333333;font-size:16px;font-weight:600;">O que fazer:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">1. Verifique se todos os dados informados est&atilde;o corretos (CNPJ/CPF, endere&ccedil;o, dados banc&aacute;rios)</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">2. Acesse o painel e tente enviar o cadastro novamente com os dados corrigidos</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">3. Se o problema persistir, entre em contato com o suporte</td></tr></table></td></tr><tr><td style="padding:0 0 24px;"><hr style="border:none;border-top:1px solid #eeeeee;margin:0;"/></td></tr><tr><td align="center" style="padding:0 0 40px;"><p style="margin:0 0 4px;color:#bbbbbb;font-size:12px;">&copy; ${new Date().getFullYear()} Mindi - Todos os direitos reservados.</p><p style="margin:0;color:#bbbbbb;font-size:12px;">Este &eacute; um e-mail autom&aacute;tico.</p></td></tr></table></td></tr></table></body></html>`;
}
import { createGoogleAuthRouter } from "../routers/googleAuth";
import { logger } from "./logger";

// ===== Circuit Breaker para n8n webhooks =====
const n8nCircuitBreaker = {
  failCount: 0,
  openUntil: 0,
  maxFailures: 3,
  resetTimeout: 5 * 60 * 1000, // 5 minutos
  isOpen(): boolean {
    if (Date.now() < this.openUntil) return true;
    if (this.openUntil > 0 && Date.now() >= this.openUntil) {
      // Half-open: reset e permitir uma tentativa
      this.failCount = 0;
      this.openUntil = 0;
    }
    return false;
  },
  recordFailure(): void {
    this.failCount++;
    if (this.failCount >= this.maxFailures) {
      this.openUntil = Date.now() + this.resetTimeout;
      logger.warn(`[n8n Circuit Breaker] ABERTO - n8n inacessível após ${this.maxFailures} falhas. Próxima tentativa em 5 min.`);
    }
  },
  recordSuccess(): void {
    if (this.failCount > 0) {
      logger.info('[n8n Circuit Breaker] FECHADO - n8n respondeu com sucesso.');
    }
    this.failCount = 0;
    this.openUntil = 0;
  }
};
// ===== Fim Circuit Breaker =====

import rateLimit from "express-rate-limit";
import { validateCriticalEnvVars, ENV } from "./env";
import { validateWebhookSignature, isEventDuplicate, markEventProcessed, startEventPolling, startCleanupJob } from "../ifoodInfra";

const VALID_PAYTIME_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "PAID", "FAILED", "CANCELLED", "PROCESSING"],
  PROCESSING: ["APPROVED", "PAID", "FAILED", "CANCELLED"],
  APPROVED: ["REFUNDED", "CHARGEBACK"],
  PAID: ["REFUNDED", "CHARGEBACK"],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: [],
};

function isValidPaytimeTransition(
  currentStatus: string | null | undefined,
  newStatus: string | null | undefined,
): { valid: boolean; reason?: string } {
  if (!newStatus) return { valid: false, reason: "Novo status ausente" };
  if (!currentStatus) return { valid: true };

  const current = String(currentStatus).toUpperCase();
  const next = String(newStatus).toUpperCase();

  if (current === next) return { valid: true };

  const allowed = VALID_PAYTIME_TRANSITIONS[current];
  if (!allowed) {
    return { valid: true, reason: `Status atual desconhecido: ${currentStatus}` };
  }

  if (allowed.length === 0) {
    return {
      valid: false,
      reason: `Transição inválida: ${currentStatus} → ${newStatus} (estado terminal)`,
    };
  }

  if (!allowed.includes(next)) {
    return {
      valid: false,
      reason: `Transição inválida: ${currentStatus} → ${newStatus} (permitidos: ${allowed.join(", ")})`,
    };
  }

  return { valid: true };
}

function getWebhookClientIp(req: express.Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

// Função para gerar HTML do recibo otimizado para impressora térmica
// OTIMIZADO para melhor legibilidade em impressoras ESC POS 58mm/80mm
function generateReceiptHTML(
  order: any,
  items: any[],
  establishment: any,
  settings: any,
  isMindi: boolean = false
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const timezone = establishment?.timezone || 'America/Sao_Paulo';
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  };
  
  // Formatar telefone no formato (88) 9 9929-0000
  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    // Verifica se tem 11 dígitos (com 9 na frente) ou 10 dígitos
    if (digits.length === 11) {
      // Formato: (XX) 9 XXXX-XXXX
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      // Formato: (XX) XXXX-XXXX
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Retorna o número original se não se encaixar nos formatos
    return phone;
  };
  
  const isScheduled = order.isScheduled === true;
  const deliveryTypeText = isScheduled ? 'AGENDADO' : (order.deliveryType === 'delivery' ? 'ENTREGA' : order.deliveryType === 'dine_in' ? (order.customerName?.startsWith('Mesa') ? order.customerName.toUpperCase() : 'CONSUMO') : 'RETIRADA');
  const paymentMethodText: Record<string, string> = {
    'cash': 'Dinheiro',
    'credit': 'Cartao Credito',
    'debit': 'Cartao Debito',
    'card': 'Cartao',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'card_online': 'Pagamento confirmado \u2013 Cart\u00e3o online',
    'pix_online': 'Pagamento confirmado \u2013 Pix online'
  };
  
  // Configurar largura do papel - usa configurações Mindi quando aplicável
  const effectivePaperWidth = isMindi ? (settings?.mindiPaperWidth || settings?.paperWidth) : settings?.paperWidth;
  const is58mm = effectivePaperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm'; // Largura real do papel térmico
  
  // Usar configurações de fonte: Mindi-specific quando isMindi=true, normais caso contrário
  const baseFontSize = `${(isMindi ? settings?.mindiFontSize : settings?.fontSize) || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = (isMindi ? settings?.mindiFontWeight : settings?.fontWeight) || 500;
  const headerFontSize = `${(isMindi ? settings?.mindiTitleFontSize : settings?.titleFontSize) || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = (isMindi ? settings?.mindiTitleFontWeight : settings?.titleFontWeight) || 700;
  const effectiveTitleSize = (isMindi ? settings?.mindiTitleFontSize : settings?.titleFontSize) || (is58mm ? 14 : 16);
  const orderNumberSize = `${effectiveTitleSize + 4}px`;
  const itemFontSize = `${(isMindi ? settings?.mindiItemFontSize : settings?.itemFontSize) || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = (isMindi ? settings?.mindiItemFontWeight : settings?.itemFontWeight) || 700;
  const totalFontSize = `${effectiveTitleSize - 2}px`;
  const smallFontSize = `${(isMindi ? settings?.mindiObsFontSize : settings?.obsFontSize) || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = (isMindi ? settings?.mindiObsFontWeight : settings?.obsFontWeight) || 500;
  const showDividers = (isMindi ? settings?.mindiShowDividers : settings?.showDividers) ?? false;
  const boxPadding = `${(isMindi ? settings?.mindiBoxPadding : (settings as any)?.boxPadding) || 12}px`;
  const itemBorderStyle = (isMindi ? settings?.mindiItemBorderStyle : (settings as any)?.itemBorderStyle) || 'rounded';
  
  // Logo URL (usa o personalizado ou o do estabelecimento)
  const effectiveShowLogo = isMindi ? (settings?.mindiShowLogo ?? true) : (settings?.showLogo ?? true);
  const logoUrl = effectiveShowLogo ? (settings?.logoUrl || establishment?.logo) : null;
  
  // Mensagem de cabeçalho personalizada
  const headerMessage = isMindi ? (settings?.mindiHeaderMessage ?? settings?.headerMessage) : settings?.headerMessage;
  
  let itemsHTML = '';
  for (const item of items) {
    // Calcular preço base do item (sem complementos)
    let complementsTotal = 0;
    let parsedComplements: any[] = [];
    if (item.complements) {
      try {
        parsedComplements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(parsedComplements)) {
          for (const comp of parsedComplements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                const qty = ci.quantity || 1;
                complementsTotal += (ci.price || 0) * qty;
              }
            } else if (comp.name) {
              const qty = comp.quantity || 1;
              complementsTotal += (comp.price || 0) * qty;
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Preço total do item (base + complementos)
    const totalPrice = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : (item.totalPrice || 0);
    
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
          <span>${formatCurrency(totalPrice)}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    // Render complements
    if (Array.isArray(parsedComplements)) {
      for (const comp of parsedComplements) {
        if (comp.items && Array.isArray(comp.items)) {
          for (const ci of comp.items) {
            const qty = ci.quantity || 1;
            const qtyPrefix = qty > 1 ? `${qty}x ` : '';
            itemHTML += `<div class="item-complement">↳ ${qtyPrefix}${ci.name}${ci.price > 0 ? ` (${formatCurrency(ci.price * qty)})` : ''}</div>`;
          }
        } else if (comp.name) {
          const qty = comp.quantity || 1;
          const qtyPrefix = qty > 1 ? `${qty}x ` : '';
          itemHTML += `<div class="item-complement">↳ ${qtyPrefix}${comp.name}${comp.price > 0 ? ` (${formatCurrency(comp.price * qty)})` : ''}</div>`;
        }
      }
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido ${order.orderNumber}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    html {
      width: 100%;
      height: auto;
      min-height: 0;
      margin: 0;
      padding: 0;
      background: #fff;
      overflow: visible;
    }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%;
      max-width: 100%;
      height: auto;
      min-height: 0;
      padding: 8px;
      margin: 0;
      background: #fff;
      color: #000;
      -webkit-font-smoothing: antialiased;
      overflow: visible;
    }
    /* Estilo para visualizacao no browser - nao afeta app de impressora (Mindi usa viewport 567px) */
    @media screen and (min-width: 768px) {
      html {
        background: #e5e5e0;
        display: flex;
        justify-content: center;
      }
      body {
        background: #f5f5f0;
        max-width: 320px;
        padding: 20px;
        margin: 20px auto;
      }
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html {
        background: #fff;
        display: flex;
        justify-content: center;
        width: 100%;
      }
      body {
        background: #fff;
        width: ${paperWidth};
        max-width: ${paperWidth};
        padding: 8px;
        margin: 0 auto;
      }
      .delivery-badge {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .total-final {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    /* CABEÇALHO */
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .order-text {
      display: flex;
      flex-direction: column;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      display: inline-flex;
      align-items: center;
    }
    .date-icon {
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    .section-icon {
      width: 14px;
      height: 14px;
      margin-right: 4px;
      display: inline;
      vertical-align: middle;
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    
    /* DIVISOR */
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    .divider-double {
      ${showDividers ? 'border-top: 3px double #000;' : ''}
      margin: 12px 0;
    }
    
    /* CLIENTE */
    .customer { 
      margin: 10px 0; 
      font-size: ${itemFontSize};
    }
    .customer-label {
      font-weight: ${baseFontWeight};
    }
    .customer-value {
      display: block;
      margin-left: 0;
      word-wrap: break-word;
      font-weight: ${baseFontWeight};
    }
    .customer-row {
      margin: 6px 0;
    }
    
    /* ITENS */
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    
    /* TOTAIS */
    .totals { 
      margin: 12px 0; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin: 6px 0; 
      font-size: ${itemFontSize};
    }
    .total-final { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${headerFontWeight}; 
      font-size: ${itemFontSize}; 
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    
    /* SEÇÕES (Entrega, Pagamento, Cliente) */
    .section-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding};
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-bottom: 8px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    .section-inline {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .payment-badge {
      background: #000;
      color: #fff;
      padding: 4px 10px;
      font-weight: ${headerFontWeight};
      font-size: ${smallFontSize};
    }
    
    /* PAGAMENTO */
    .payment {
      margin: 10px 0;
      font-size: ${itemFontSize};
    }
    .payment-method {
      font-weight: ${baseFontWeight};
      font-size: ${itemFontSize};
    }
    
    /* OBSERVAÇÕES */
    .notes { 
      background: #f0f0f0; 
      padding: 8px; 
      margin: 10px 0; 
      font-size: ${smallFontSize};
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
    }
    
    /* QR CODE */
    .qrcode-box {
      padding: 12px 0;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 144px;
      height: 144px;
      display: block;
      margin: 0 auto;
    }
    
    /* RODAPÉ */
    .footer { 
      text-align: center; 
      margin-top: 16px; 
      font-size: ${smallFontSize}; 
    }
    .footer-thanks {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-top: 8px;
    }
    
    /* PRINT STYLES */
    @media print {
      body {
        width: ${paperWidth};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    <p>Sistema de Pedidos</p>
  </div>
  
  <div class="order-info">
    <div class="order-text">
      <div class="order-number">Pedido ${order.orderNumber}</div>
      <div class="order-date"><img src="/calendar-icon.png" class="date-icon" /> ${formatDate(order.createdAt)}</div>
    </div>
    <div class="delivery-badge">${deliveryTypeText}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${order.deliveryType === 'delivery' ? `
    <div class="total-row">
      <span>Taxa entrega:</span>
      <span>${formatCurrency(order.deliveryFee)}</span>
    </div>
    ` : ''}
    ${order.discount && parseFloat(order.discount) > 0 ? `
    <div class="total-row">
      <span>Desconto${order.couponCode ? ` (${order.couponCode})` : ''}:</span>
      <span>-${formatCurrency(order.discount)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
  </div>
  
  <hr class="divider">
  
  ${(() => {
    // Pedidos de mesa: não exibir seções de comanda, pagamento, troco e cliente
    const isTableOrder = order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa');
    if (isTableOrder) return '';
    
    let sections = '';
    
    // Seção de tipo de entrega
    if (order.deliveryType === 'delivery') {
      sections += `
      <div class="section-box">
        <div class="section-title">Endereço:</div>
        <div class="section-content">
          ${order.customerAddress || ''} - ${order.neighborhood || ''}
          ${order.addressComplement ? '<br>' + order.addressComplement : ''}
        </div>
      </div>`;
    } else if (order.deliveryType === 'dine_in') {
      sections += `
      <div class="section-box">
        <div class="section-content"><strong>Consumo:</strong> Cliente irá consumir no local</div>
      </div>`;
    } else {
      sections += `
      <div class="section-box">
        <div class="section-content"><strong>Retirada:</strong> Cliente irá retirar no estabelecimento</div>
      </div>`;
    }
    
    // Seção de agendamento (se pedido agendado)
    if (isScheduled && order.scheduledAt) {
      const scheduledDate = new Date(order.scheduledAt);
      const schedDateStr = scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const schedTimeStr = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      sections += `
      <div class="section-box" style="border: 2px solid #000; background: #f9f9f4;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;">📅 Agendado</span>
          <span style="font-weight: ${headerFontWeight};">${schedDateStr} às ${schedTimeStr}</span>
        </div>
      </div>`;
    }
     // Se\u00e7\u00e3o de pagamento
    const isCardOnline = order.paymentMethod === 'card_online';
    if (isCardOnline) {
      sections += `
      <div class="section-box">
        <div style="text-align: center;">
          <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center; gap: 4px;"><img src="/payment-icon.png" class="section-icon" /> ${paymentMethodText['card_online']}</span>
        </div>
      </div>`;
    } else {
      sections += `
      <div class="section-box">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;"><img src="/payment-icon.png" class="section-icon" /> Pagamento</span>
          <span style="font-weight: ${headerFontWeight};">${paymentMethodText[order.paymentMethod] || order.paymentMethod}</span>
        </div>
      </div>`;
    }    // Seção de troco
    if (order.paymentMethod === 'cash') {
      const changeAmountNum = order.changeAmount ? parseFloat(order.changeAmount) : 0;
      const totalNum = parseFloat(order.total) || 0;
      const trocoDevolver = changeAmountNum > totalNum ? changeAmountNum - totalNum : 0;
      sections += `
      <div style="margin: 8px 0; text-align: center;">
        <div style="border-top: 1px dashed #000; margin-bottom: 8px;"></div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: ${baseFontSize}; font-weight: ${baseFontWeight};">
          <img src="/info-icon.svg" style="width: 16px; height: 16px;" alt="info" />
          <span>Obs: ${order.changeAmount && changeAmountNum > 0 ? `Troco para ${formatCurrency(order.changeAmount)}` : 'Não precisa de troco'}</span>
        </div>
        ${trocoDevolver > 0 ? `<div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: ${baseFontSize}; font-weight: ${headerFontWeight}; margin-top: 4px;">
          <span>Troco a devolver: ${formatCurrency(trocoDevolver)}</span>
        </div>` : ''}
        <div style="border-top: 1px dashed #000; margin-top: 8px;"></div>
      </div>`;
    }
    
    // Seção de cliente
    sections += `
    <div class="section-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;"><img src="/client-icon.png" style="width: 13px; height: 13px; margin-right: 4px;" /></span>
        <span style="font-weight: ${headerFontWeight};">${order.customerName || 'Nao informado'}${order.customerPhone ? ' - ' + formatPhone(order.customerPhone) : ''}</span>
      </div>
    </div>`;
    
    // ===== SEÇÃO ESPECÍFICA PARA PEDIDOS IFOOD (Gap 5) =====
    if (order.source === 'ifood') {
      const externalData = typeof order.externalData === 'string' ? JSON.parse(order.externalData) : order.externalData;
      
      // Badge "via iFood"
      sections += `
      <div class="section-box" style="background: #EA1D2C; color: #fff; text-align: center; padding: 6px;">
        <span style="font-weight: ${headerFontWeight}; font-size: ${headerFontSize};">\uD83D\uDCE6 Pedido via iFood</span>
        ${order.externalDisplayId ? `<br><span style="font-size: ${smallFontSize};">ID iFood: #${order.externalDisplayId}</span>` : ''}
      </div>`;
      
      // CPF do cliente (documentNumber)
      const customerCPF = externalData?.customer?.documentNumber;
      if (customerCPF) {
        sections += `
        <div class="section-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: ${headerFontWeight};">CPF na Nota:</span>
            <span style="font-weight: ${headerFontWeight};">${customerCPF}</span>
          </div>
        </div>`;
      }
      
      // Código de coleta (pickup code / displayId)
      const pickupCode = externalData?.displayId || order.externalDisplayId;
      if (pickupCode) {
        sections += `
        <div class="section-box" style="border: 2px solid #000; text-align: center;">
          <div style="font-weight: ${headerFontWeight}; font-size: ${smallFontSize};">CÓDIGO DE COLETA</div>
          <div style="font-weight: ${headerFontWeight}; font-size: ${orderNumberSize}; letter-spacing: 2px;">${pickupCode}</div>
        </div>`;
      }
      
      // Observações de entrega
      const deliveryObs = externalData?.delivery?.observations;
      if (deliveryObs) {
        sections += `
        <div class="notes">
          <div class="notes-title">OBS. ENTREGA (iFood):</div>
          ${deliveryObs}
        </div>`;
      }
      
      // Bandeira do cartão
      const cardBrand = externalData?.payments?.methods?.[0]?.card?.brand;
      if (cardBrand) {
        sections += `
        <div class="section-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: ${headerFontWeight};">Bandeira:</span>
            <span style="font-weight: ${headerFontWeight};">${cardBrand}</span>
          </div>
        </div>`;
      }
      
      // Troco para (se pagamento em dinheiro no iFood)
      const ifoodChangeFor = externalData?.payments?.methods?.[0]?.changeFor;
      if (ifoodChangeFor && ifoodChangeFor > 0) {
        sections += `
        <div class="section-box" style="border: 2px solid #000;">
          <div style="text-align: center; font-weight: ${headerFontWeight};">
            Troco para: ${formatCurrency(ifoodChangeFor / 100)}
          </div>
        </div>`;
      }
      
      // Entregador (se disponível)
      const driverName = externalData?.delivery?.driver?.name || (order as any).driverName;
      if (driverName) {
        sections += `
        <div class="section-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: ${headerFontWeight};">Entregador:</span>
            <span style="font-weight: ${headerFontWeight};">${driverName}</span>
          </div>
        </div>`;
      }
    }
    
    return sections;
  })()}
  
  ${settings?.showQrCode && settings?.qrCodeUrl ? `
  <div class="qrcode-box">
    <div class="section-title">PIX - Escaneie para pagar</div>
    <img src="${settings.qrCodeUrl}" alt="QR Code PIX" />
  </div>
  ` : ''}
  
  ${order.notes && !order.notes.startsWith('Comanda da Mesa') ? `
  <div class="notes">
    <div class="notes-title">OBSERVACOES:</div>
    ${order.notes}
  </div>
  ` : ''}
  
  <div class="footer">
    ${settings?.footerMessage ? `<p>${settings.footerMessage}</p>` : ''}
    <p>Pedido realizado via www.mindi.com.br</p>
  </div>
</body>
<script>
  // Auto-print quando a página carregar (apenas se não estiver em iframe)
  // Quando carregado via iframe, o código do cliente controla a impressão
  window.onload = function() {
    // Verifica se está em um iframe
    var isInIframe = window !== window.parent;
    if (!isInIframe) {
      // Pequeno delay para garantir que o conteúdo foi renderizado
      setTimeout(function() {
        window.print();
      }, 300);
    }
  };
</script>
</html>
  `.trim();
}

// Função para gerar HTML do recibo filtrado por setor
// Mostra apenas os itens do setor específico
function generateSectorReceiptHTML(
  order: any,
  items: any[],
  establishment: any,
  settings: any,
  sectorName: string
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const timezone = establishment?.timezone || 'America/Sao_Paulo';
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  };
  
  const isScheduled = order.isScheduled === true;
  const deliveryTypeText = isScheduled ? 'AGENDADO' : (order.deliveryType === 'delivery' ? 'ENTREGA' : order.deliveryType === 'dine_in' ? (order.customerName?.startsWith('Mesa') ? order.customerName.toUpperCase() : 'CONSUMO') : 'RETIRADA');
  
  // Formatar telefone no formato (88) 9 9929-0000
  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };
  
  // Configurar largura do papel
  const is58mm = settings?.paperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm';
  
  const baseFontSize = `${settings?.fontSize || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = settings?.fontWeight || 500;
  const headerFontSize = `${settings?.titleFontSize || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = settings?.titleFontWeight || 700;
  const orderNumberSize = `${(settings?.titleFontSize || (is58mm ? 14 : 16)) + 4}px`;
  const itemFontSize = `${settings?.itemFontSize || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = settings?.itemFontWeight || 700;
  const smallFontSize = `${settings?.obsFontSize || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = settings?.obsFontWeight || 500;
  const showDividers = settings?.showDividers ?? false;
  const boxPadding = `${(settings as any)?.boxPadding || 12}px`;
  const itemBorderStyle = (settings as any)?.itemBorderStyle || 'rounded';
  
  let itemsHTML = '';
  for (const item of items) {
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                itemHTML += `<div class="item-complement">↳ ${ci.name}</div>`;
              }
            }
          }
        }
      } catch (e) {}
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido #${order.orderNumber} - ${sectorName}</title>
  <style>
    @page { size: ${paperWidth} auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%; 
      max-width: 100%;
      padding: 8px;
      background: #fff;
      color: #000;
    }
    .header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 2px solid #000;' : ''}
    }
    .sector-name {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      background: #000;
      color: #fff;
      padding: 8px 16px;
      margin-bottom: 8px;
      display: inline-block;
    }
    .order-number {
      font-size: ${headerFontSize};
      font-weight: ${headerFontWeight};
      margin-top: 8px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 4px 12px;
      margin-top: 8px;
    }
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    .customer-info {
      margin-top: 12px;
      padding: 8px;
      border: 2px solid #000;
      border-radius: 8px;
    }
    .customer-name {
      font-size: ${itemFontSize};
      font-weight: ${headerFontWeight};
    }
    @media print {
      body { width: ${paperWidth}; padding: 2mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="sector-name">${sectorName.toUpperCase()}</div>
    <div class="order-number">Pedido ${order.orderNumber}</div>
    <div class="order-date">${formatDate(order.createdAt)}</div>
    <div class="delivery-badge">${deliveryTypeText}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  ${(() => {
    const isTableOrder = order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa');
    if (isTableOrder) return '';
    return `<div class="customer-info">
    <div class="customer-name">${order.customerName || 'Cliente'}${order.customerPhone ? ' - ' + formatPhone(order.customerPhone) : ''}</div>
    ${order.deliveryType === 'delivery' && order.customerAddress ? `<div style="font-size: ${smallFontSize}; margin-top: 4px;">${order.customerAddress}</div>` : ''}
  </div>`;
  })()}
  
  ${(() => {
    if (isScheduled && order.scheduledAt) {
      const scheduledDate = new Date(order.scheduledAt);
      const schedDateStr = scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const schedTimeStr = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `<div style="margin-top: 12px; padding: 8px; border: 2px solid #000; border-radius: 8px; background: #f9f9f4;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: ${headerFontWeight};">\uD83D\uDCC5 Agendado</span>
          <span style="font-weight: ${headerFontWeight};">${schedDateStr} \u00e0s ${schedTimeStr}</span>
        </div>
      </div>`;
    }
    return '';
  })()}
  
  ${order.notes && !(order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa')) ? `
  <div style="margin-top: 12px; padding: 8px; background: #f0f0f0; border: 2px solid #000;">
    <strong>OBS:</strong> ${order.notes}
  </div>
  ` : ''}
</body>
</html>
  `.trim();
}

// Função para gerar HTML do recibo de comanda (tab)
function generateTabReceiptHTML(
  tab: any,
  items: any[],
  table: any,
  establishment: any,
  settings: any,
  loosePaymentsTotal: number = 0
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const timezone = establishment?.timezone || 'America/Sao_Paulo';
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  };
  
  // Configurar largura do papel
  const is58mm = settings?.paperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm';
  
  const baseFontSize = `${settings?.fontSize || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = settings?.fontWeight || 500;
  const headerFontSize = `${settings?.titleFontSize || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = settings?.titleFontWeight || 700;
  const orderNumberSize = `${(settings?.titleFontSize || (is58mm ? 14 : 16)) + 4}px`;
  const itemFontSize = `${settings?.itemFontSize || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = settings?.itemFontWeight || 700;
  const smallFontSize = `${settings?.obsFontSize || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = settings?.obsFontWeight || 500;
  const showDividers = settings?.showDividers ?? false;
  const boxPadding = `${(settings as any)?.boxPadding || 12}px`;
  const itemBorderStyle = (settings as any)?.itemBorderStyle || 'rounded';
  
  let itemsHTML = '';
  let subtotal = 0;
  
  for (const item of items) {
    const itemTotal = parseFloat(item.totalPrice) || 0;
    subtotal += itemTotal;
    
    // Calcular preço base do item (sem complementos)
    let complementsTotal = 0;
    let parsedComplements: any[] = [];
    if (item.complements) {
      try {
        parsedComplements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(parsedComplements)) {
          for (const comp of parsedComplements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                const qty = ci.quantity || 1;
                complementsTotal += (ci.price || 0) * qty;
              }
            } else if (comp.name) {
              const qty = comp.quantity || 1;
              complementsTotal += (comp.price || 0) * qty;
            }
          }
        }
      } catch (e) {}
    }
    
    const hasComplements = parsedComplements.length > 0 && complementsTotal > 0;
    const basePrice = hasComplements ? itemTotal - (complementsTotal * item.quantity) : itemTotal;
    const displayPrice = basePrice > 0 ? basePrice : itemTotal;
    
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
          <span>${formatCurrency(displayPrice)}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    // Render complements
    if (Array.isArray(parsedComplements)) {
      for (const comp of parsedComplements) {
        if (comp.items && Array.isArray(comp.items)) {
          for (const ci of comp.items) {
            const qty = ci.quantity || 1;
            const qtyPrefix = qty > 1 ? `${qty}x ` : '';
            itemHTML += `<div class="item-complement">↳ ${qtyPrefix}${ci.name}${ci.price > 0 ? ` (${formatCurrency(ci.price * qty)})` : ''}</div>`;
          }
        } else if (comp.name) {
          const qty = comp.quantity || 1;
          const qtyPrefix = qty > 1 ? `${qty}x ` : '';
          itemHTML += `<div class="item-complement">↳ ${qtyPrefix}${comp.name}${comp.price > 0 ? ` (${formatCurrency(comp.price * qty)})` : ''}</div>`;
        }
      }
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  const discount = parseFloat(tab.discount) || 0;
  const serviceCharge = parseFloat(tab.serviceCharge) || 0;
  const total = subtotal - discount + serviceCharge;
  const remainingToPay = Math.max(0, total - loosePaymentsTotal);
  
  // Mostrar label da mesa ou nome salvo na comanda (ex: "lucas"), senão "Comanda"
  // O label é salvo no customerName da tab antes de fechar a mesa
  const savedLabel = table?.label || (tab.customerName && !tab.customerName.startsWith('Mesa ') ? tab.customerName : null);
  const comandaTitle = savedLabel || 'Comanda';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${comandaTitle} - Mesa ${table?.number || tab.tableId}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    html {
      width: 100%;
      height: auto;
      min-height: 0;
      margin: 0;
      padding: 0;
      background: #fff;
      overflow: visible;
    }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%;
      max-width: 100%;
      height: auto;
      min-height: 0;
      padding: 8px;
      margin: 0;
      background: #fff;
      color: #000;
      -webkit-font-smoothing: antialiased;
      overflow: visible;
    }
    /* Estilo para visualizacao no browser - nao afeta app de impressora (Mindi usa viewport 567px) */
    @media screen and (min-width: 768px) {
      html {
        background: #e5e5e0;
        display: flex;
        justify-content: center;
      }
      body {
        background: #f5f5f0;
        max-width: 320px;
        padding: 20px;
        margin: 20px auto;
      }
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html {
        background: #fff;
        display: flex;
        justify-content: center;
        width: 100%;
      }
      body {
        background: #fff;
        width: ${paperWidth};
        max-width: ${paperWidth};
        padding: 8px;
        margin: 0 auto;
      }
      .delivery-badge {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .total-final {
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    /* CABEÇALHO */
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .order-text {
      display: flex;
      flex-direction: column;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      display: inline-flex;
      align-items: center;
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    
    /* DIVISOR */
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    
    /* ITENS */
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    
    /* TOTAIS */
    .totals { 
      margin: 12px 0; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin: 6px 0; 
      font-size: ${itemFontSize};
    }
    .total-final { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${headerFontWeight}; 
      font-size: ${itemFontSize}; 
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    
    /* SEÇÕES */
    .section-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding};
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-bottom: 8px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    
    /* OBSERVAÇÕES */
    .notes { 
      background: #f0f0f0; 
      padding: 8px; 
      margin: 10px 0; 
      font-size: ${smallFontSize};
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
    }
    
    /* QR CODE */
    .qrcode-box {
      padding: 12px 0;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 144px;
      height: 144px;
      display: block;
      margin: 0 auto;
    }
    
    /* RODAPÉ */
    .footer { 
      text-align: center; 
      margin-top: 16px; 
      font-size: ${smallFontSize}; 
    }
    .footer-thanks {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-top: 8px;
    }
    
    /* PRINT STYLES */
    @media print {
      body {
        width: ${paperWidth};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    <p>Sistema de Pedidos</p>
  </div>
  
  <div class="order-info">
    <div class="order-text">
      <div class="order-number">${comandaTitle}</div>
      <div class="order-date">📅 ${formatDate(tab.openedAt)}</div>
    </div>
    <div class="delivery-badge">Mesa ${table?.number || tab.tableId}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${discount > 0 ? `
    <div class="total-row">
      <span>Desconto:</span>
      <span>-${formatCurrency(discount)}</span>
    </div>
    ` : ''}
    ${serviceCharge > 0 ? `
    <div class="total-row">
      <span>Taxa de Serviço (${establishment?.serviceChargePercent ? parseFloat(establishment.serviceChargePercent).toFixed(0) : "10"}%):</span>
      <span>${formatCurrency(serviceCharge)}</span>
    </div>
    ` : ''}
    ${loosePaymentsTotal > 0 ? `
    <div class="total-row">
      <span>Já pago (avulso):</span>
      <span style="color: green;">-${formatCurrency(loosePaymentsTotal)}</span>
    </div>
    <div class="total-row total-final">
      <span>A PAGAR:</span>
      <span>${formatCurrency(remainingToPay)}</span>
    </div>
    ` : `
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(total)}</span>
    </div>
    `}
  </div>
  
  
  ${settings?.showQrCode && settings?.qrCodeUrl ? `
  <div class="qrcode-box">
    <div class="section-title">PIX - Escaneie para pagar</div>
    <img src="${settings.qrCodeUrl}" alt="QR Code PIX" />
  </div>
  ` : ''}
  
  ${tab.notes ? `
  <div class="notes">
    <div class="notes-title">OBSERVACOES:</div>
    ${tab.notes}
  </div>
  ` : ''}
  
  <div class="footer">
    ${settings?.footerMessage ? `<p>${settings.footerMessage}</p>` : ''}
    <p>Pedido realizado via www.mindi.com.br</p>
  </div>
</body>
<script>
  window.onload = function() {
    var isInIframe = window !== window.parent;
    if (!isInIframe) {
      setTimeout(function() {
        window.print();
      }, 300);
    }
  };
</script>
</html>
  `.trim();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Validar variáveis de ambiente críticas no startup
  validateCriticalEnvVars();

  const app = express();
  const server = createServer(app);

  // Trust proxy — necessário para que req.protocol seja correto atrás de reverse proxy
  // Ajuste o valor conforme a sua infraestrutura (1 = um nível de proxy, "loopback", etc.)
  app.set("trust proxy", 1);

  // ─── Rate Limiting ─────────────────────────────────────────────────────
  // Global API rate limiter: 200 requests per minute per IP
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => {
      // Skip rate limiting for static assets and health checks
      const path = req.path;
      return path.startsWith("/assets/") || path.startsWith("/public/") || path === "/api/trpc/system.health";
    },
  });

  // Stricter limiter for SSE endpoints: 30 connections per minute per IP
  const sseLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many SSE connections, please try again later." },
  });

  // Stricter limiter for webhook endpoints: 60 per minute per IP
  const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many webhook requests." },
  });

  // Paytime não oferece HMAC/assinatura; usar limite mais restrito + validação de transições.
  const paytimeWebhookLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_PAYTIME_WINDOW_MS || 60 * 1000),
    max: Number(process.env.RATE_LIMIT_PAYTIME_MAX || 20),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests to Paytime webhook." },
  });

  // Apply global rate limiter to all /api/ routes
  app.use("/api/", apiLimiter);

  // Apply stricter SSE limiter to SSE stream endpoints
  app.use("/api/orders/stream", sseLimiter);
  app.use("/api/orders/track/stream", sseLimiter);
  app.use("/api/chat/stream", sseLimiter);
  app.use("/api/public-chat/stream", sseLimiter);
  app.use("/api/menu/*/stream", sseLimiter);
  app.use(["/api/printer/stream", "/api/printer/sse"], sseLimiter);

  // Apply webhook limiter
  app.use("/api/webhook/", webhookLimiter);
  app.use("/api/ifood/webhook", webhookLimiter);

  // Headers de segurança via helmet
  app.use(helmet({
    // CSP: política básica que previne carregamento de scripts/frames de origens externas desconhecidas
    // 'unsafe-inline' é necessário para o Vite SPA e Tailwind; remova gradualmente com nonces futuramente
    contentSecurityPolicy: {
      // Necessário enquanto o app é acessado por IP em HTTP.
      // Sem isto, o Helmet adiciona 'upgrade-insecure-requests' por padrão,
      // fazendo o navegador tentar carregar assets em HTTPS e gerando tela branca.
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]), "https://forge.manus.ai", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://assets.pagseguro.com.br", "https://*.pagseguro.com.br", "https://*.uol.com.br", "https://connect.facebook.net", "https://static.cloudflareinsights.com"], // unsafe-eval apenas em dev (Vite HMR); forge/googleapis para Google Maps; pagseguro para SDK 3DS; connect.facebook.net para Embedded Signup Meta/Facebook
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"], // https: permite imagens de S3 e CDNs
        connectSrc: ["'self'", "https:", "wss:", "ws:"], // wss/ws para SSE e WebSockets
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"], // bloqueia Flash, Silverlight, etc.
        mediaSrc: ["'self'", "blob:", "https:"], // https: permite áudio/vídeo/documentos do S3 e CDNs do chat WhatsApp
        frameSrc: ["'self'", "https://forge.manus.ai", "https://*.pagseguro.com.br", "https://*.uol.com.br", "https://facebook.com", "https://*.facebook.com"], // permite iframes same-origin, Google Maps, PagSeguro 3DS challenge e diálogos do Embedded Signup Meta/Facebook
        frameAncestors: ["'self'"], // permite iframes same-origin (necessário para impressão via iframe)
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Necessário para recursos de terceiros (imagens, fontes de CDN)
    crossOriginResourcePolicy: { policy: "cross-origin" }, // cross-origin necessário para Google Maps e recursos de CDN
    crossOriginOpenerPolicy: false, // Desabilitado para compatibilidade com Google Maps e popups de OAuth
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Bypass helmet para endpoints do Mindi Printer (app Android externo)
  // Deve ficar DEPOIS do helmet para poder sobrescrever os headers restritivos
  // Apps nativos precisam de CORS aberto e sem políticas cross-origin restritivas
  app.use("/api/printer", (req, res, next) => {
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("X-Frame-Options");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // Stripe webhook MUST be registered BEFORE express.json() for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const { constructWebhookEvent, extractCheckoutMetadata } = await import("../stripe");
      const { addSmsCredit, getOrCreateSmsBalance } = await import("../db");
      
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        logger.error("[Stripe Webhook] Sem header stripe-signature");
        return res.status(401).json({ error: "Missing stripe-signature header" });
      }
      
      const event = constructWebhookEvent(req.body, signature);
      if (!event) {
        logger.error("[Stripe Webhook] Assinatura inv\u00e1lida");
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
      
      // Detectar eventos de teste
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }
      
      logger.info(`[Stripe Webhook] Evento recebido: ${event.type} (${event.id})`);
      
      // Processar assincronamente para responder r\u00e1pido
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const metadata = extractCheckoutMetadata(session);
        
        if (metadata.type === "sms_recharge" && metadata.establishmentId > 0) {
          const amountInReais = metadata.amountTotal / 100;
          
          logger.info(`[Stripe Webhook] Recarga SMS: estabelecimento ${metadata.establishmentId}, valor R$ ${amountInReais.toFixed(2)}, ${metadata.smsCount} SMS`);
          
          // Creditar saldo SMS
          try {
            await addSmsCredit(
              metadata.establishmentId,
              amountInReais,
              `Recarga via cart\u00e3o - ${metadata.smsCount} SMS (Stripe: ${metadata.paymentIntentId})`
            );
            
            // Enviar SSE para atualizar saldo em tempo real
            const updatedBalance = await getOrCreateSmsBalance(metadata.establishmentId);
            sendEvent(metadata.establishmentId, "balanceUpdated", {
              balance: parseFloat(updatedBalance.balance as string),
              smsCount: metadata.smsCount,
            });
            
            logger.info(`[Stripe Webhook] Saldo creditado com sucesso para estabelecimento ${metadata.establishmentId}`);
          } catch (creditError) {
            logger.error("[Stripe Webhook] Erro ao creditar saldo:", creditError);
          }
        }
        
        // Processar checkout de subscription (plano)
        if (session.metadata?.type === "plan_upgrade" && metadata.establishmentId > 0) {
          const planType = session.metadata.plan_type as 'lite' | 'basic' | 'pro';
          const billingPeriod = session.metadata.billing_period as 'monthly' | 'annual' || 'monthly';
          const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || '';
          const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || '';
          
          logger.info(`[Stripe Webhook] Subscription de plano: estabelecimento ${metadata.establishmentId}, plano: ${planType}, período: ${billingPeriod}, subscription: ${stripeSubscriptionId}`);
          
          try {
            const { activatePlan } = await import("../db");
            const planSubDb = await import("../planSubscriptionDb");
            const adminDb = await import("../adminDb");
            
            // Calcular data de expiração baseada no período
            const now = new Date();
            const expiresAt = new Date(now);
            if (billingPeriod === 'annual') {
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            } else {
              expiresAt.setMonth(expiresAt.getMonth() + 1);
            }

            const planPrice = await adminDb.getPlanPrice(planType);
            const fallbackAmountCents = billingPeriod === 'annual'
              ? (planPrice?.annualPriceCents ?? 0)
              : (planPrice?.monthlyPriceCents ?? 0);
            const amountCents = typeof session.amount_total === 'number' && session.amount_total > 0
              ? session.amount_total
              : fallbackAmountCents;

            if (stripeSubscriptionId) {
              const existingStripeSub = await planSubDb.getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);
              if (existingStripeSub) {
                await planSubDb.updateSubscriptionById(existingStripeSub.id, {
                  status: 'active',
                  stripeCustomerId,
                  amountCents,
                  currentPeriodStart: now,
                  currentPeriodEnd: expiresAt,
                  lastPaymentAt: now,
                  nextRenewalAt: expiresAt,
                });
              } else {
                await planSubDb.createPlanSubscription({
                  establishmentId: metadata.establishmentId,
                  planId: planType,
                  billingPeriod,
                  gateway: 'stripe_card',
                  status: 'active',
                  stripeSubscriptionId,
                  stripeCustomerId,
                  amountCents,
                  currentPeriodStart: now,
                  currentPeriodEnd: expiresAt,
                  lastPaymentAt: now,
                  nextRenewalAt: expiresAt,
                });
              }
            }
            
            await activatePlan(metadata.establishmentId, planType, {
              stripeCustomerId,
              stripeSubscriptionId,
              billingPeriod,
              planExpiresAt: expiresAt,
            });
            
            // Enviar SSE para notificar o frontend sobre a ativação do plano
            sendEvent(metadata.establishmentId, "planActivated", {
              planType,
              billingPeriod,
              message: `Plano ${planType} ativado com sucesso!`,
            });
            
            logger.info(`[Stripe Webhook] Plano ${planType} (${billingPeriod}) ativado com sucesso para estabelecimento ${metadata.establishmentId}`);
          } catch (planError) {
            logger.error("[Stripe Webhook] Erro ao ativar plano:", planError);
          }
        }
        
        // Processar compra de créditos de melhoria de imagem com IA
        if (metadata.type === "ai_image_credits" && metadata.establishmentId > 0) {
          const creditsCount = parseInt(session.metadata?.credits_count || "0");
          
          logger.info(`[Stripe Webhook] Compra de créditos IA: estabelecimento ${metadata.establishmentId}, ${creditsCount} créditos`);
          
          try {
            const { addAiImageCredits } = await import("../db");
            
            const newBalance = await addAiImageCredits(
              metadata.establishmentId,
              metadata.userId,
              creditsCount,
              "purchase",
              `Compra de ${creditsCount} créditos de melhoria de imagem (Stripe: ${metadata.paymentIntentId})`,
              session.id,
            );
            
            // Enviar SSE para atualizar créditos em tempo real
            sendEvent(metadata.establishmentId, "aiCreditsUpdated", {
              credits: newBalance,
              purchased: creditsCount,
            });
            
            logger.info(`[Stripe Webhook] ${creditsCount} créditos IA creditados com sucesso para estabelecimento ${metadata.establishmentId}. Novo saldo: ${newBalance}`);
          } catch (creditError) {
            logger.error("[Stripe Webhook] Erro ao creditar créditos IA:", creditError);
          }
        }
        
        // [REMOVIDO] Processamento de pedidos online via Stripe Connect
        // Pagamentos de pedidos online agora são processados via Paytime (PIX e Cartão)
      }
      
      // Processar renovação de subscription (invoice paga)
      if (event.type === "invoice.paid") {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        // Só processar invoices de subscription (não one-time)
        if (subscriptionId && customerId) {
          logger.info(`[Stripe Webhook] Invoice paga para subscription ${subscriptionId}`);
          
          try {
            const { getEstablishmentByStripeCustomerId, activatePlan } = await import("../db");
            const est = await getEstablishmentByStripeCustomerId(customerId);
            
            if (est) {
              // Renovar a data de expiração
              const expiresAt = new Date();
              if (est.billingPeriod === 'annual') {
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              } else {
                expiresAt.setMonth(expiresAt.getMonth() + 1);
              }
              
              await activatePlan(est.id, est.planType as 'lite' | 'basic' | 'pro', {
                planExpiresAt: expiresAt,
              });
              
              logger.info(`[Stripe Webhook] Subscription renovada para estabelecimento ${est.id}, expira em ${expiresAt.toISOString()}`);
              
              sendEvent(est.id, "planRenewed", {
                planType: est.planType,
                expiresAt: expiresAt.toISOString(),
                message: "Assinatura renovada com sucesso!",
              });
            }
          } catch (renewError) {
            logger.error("[Stripe Webhook] Erro ao renovar subscription:", renewError);
          }
        }
      }
      
      // Processar cancelamento de subscription
      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as any;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        
        if (customerId) {
          logger.info(`[Stripe Webhook] Subscription cancelada para customer ${customerId}`);
          
          try {
            const { getEstablishmentByStripeCustomerId } = await import("../db");
            const est = await getEstablishmentByStripeCustomerId(customerId);
            
            if (est) {
              // Cancelamentos vindos do gateway não devem rebaixar o estabelecimento
              // automaticamente para o plano gratuito. O plano atual é preservado e
              // o bloqueio por cobrança vencida é tratado a partir do estado da assinatura.
              sendEvent(est.id, "planCancelled", {
                message: "Sua assinatura foi cancelada. Acesso bloqueado até a regularização do pagamento.",
              });
              
              logger.info(`[Stripe Webhook] Assinatura cancelada para estabelecimento ${est.id}; plano atual preservado`);
            }
          } catch (cancelError) {
            logger.error("[Stripe Webhook] Erro ao desativar plano:", cancelError);
          }
        }
      }
      
      // Processar atualização de subscription (upgrade/downgrade)
      if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as any;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        
        if (customerId && subscription.metadata?.plan_type) {
          logger.info(`[Stripe Webhook] Subscription atualizada para customer ${customerId}`);
          
          try {
            const { getEstablishmentByStripeCustomerId, activatePlan } = await import("../db");
            const est = await getEstablishmentByStripeCustomerId(customerId);
            
            if (est) {
              const planType = subscription.metadata.plan_type as 'lite' | 'basic' | 'pro';
              const billingPeriod = subscription.metadata.billing_period as 'monthly' | 'annual' || est.billingPeriod || 'monthly';
              
              const expiresAt = new Date(subscription.current_period_end * 1000);
              
              await activatePlan(est.id, planType, {
                stripeSubscriptionId: subscription.id,
                billingPeriod,
                planExpiresAt: expiresAt,
              });
              
              logger.info(`[Stripe Webhook] Plano atualizado para ${planType} (${billingPeriod}) no estabelecimento ${est.id}`);
            }
          } catch (updateError) {
            logger.error("[Stripe Webhook] Erro ao atualizar plano:", updateError);
          }
        }
      }
      
      res.status(200).json({ verified: true, received: true });
    } catch (error) {
      logger.error("[Stripe Webhook] Erro:", error);
      // Sempre retornar 200 para evitar retry do Stripe
      res.status(200).json({ verified: true, error: "Internal error" });
    }
  });
  
  // ==================== PAYTIME WEBHOOK ====================
  // Webhook para receber notificações de pagamento da Paytime
  // Registrado ANTES do express.json() para receber o body raw se necessário
  // Paytime não oferece HMAC/assinatura — proteção via rate limit restrito + validação de transição de status.
  app.post("/api/paytime/webhook", paytimeWebhookLimiter, express.json(), async (req, res) => {
    try {
      const payload = req.body;
      const webhookIp = getWebhookClientIp(req);
      
      logger.info(`[Paytime Webhook] Evento recebido | ip=${webhookIp}:`, JSON.stringify(payload).substring(0, 500));
      
      // A Paytime envia: { event: "nome-do-evento", event_date: "...", data: {...} }
      // Suporte para ambos os formatos: event (oficial) e type (legado/fallback)
      const eventName = payload?.event || payload?.type;
      
      if (!eventName) {
        logger.warn("[Paytime Webhook] Evento sem campo 'event' ou 'type'");
        return res.status(200).json({ received: true });
      }
      
      // Evento de teste
      if (payload.id && String(payload.id).startsWith('test_')) {
        logger.info("[Paytime Webhook] Evento de teste detectado");
        return res.status(200).json({ verified: true });
      }
      
      // ─── updated-sub-transaction (pagamento PIX ou Cartão confirmado) ───
      if (eventName === 'updated-sub-transaction' || eventName === 'transaction.updated') {
        const transactionId = payload.data?._id || payload.data?.transaction_id || payload.transaction_id;
        const status = payload.data?.status || payload.status;
        
        if (transactionId && status) {
          const { getPaytimeTransactionById, updatePaytimeTransactionStatus, updateOrderStatus } = await import("../db");
          
          let localTx = await getPaytimeTransactionById(transactionId);
          
          // Se não encontrou pelo ID, pode ser um novo ID gerado após 3DS.
          // Nesse caso, salvar o novo ID e buscar pelo reference_id ou orderId.
          if (!localTx && payload.data?.reference_id) {
            const { getPaytimeTransactionByReferenceId } = await import("../db");
            localTx = await getPaytimeTransactionByReferenceId(payload.data.reference_id);
            if (localTx) {
              // Atualizar o ID da transação no banco para o novo ID
              const { updatePaytimeTransactionId } = await import("../db");
              await updatePaytimeTransactionId(localTx.paytimeTransactionId, transactionId);
              logger.info(`[Paytime Webhook] Transação encontrada por reference_id, ID atualizado: ${localTx.paytimeTransactionId} -> ${transactionId}`);
            }
          }
          
          if (localTx) {
            const paymentType = localTx.paymentType === 'CREDIT_CARD' ? 'CARTÃO' : localTx.paymentType;
            
            const transition = isValidPaytimeTransition(localTx.status, status);
            if (!transition.valid) {
              logger.warn(`[Paytime Webhook] TRANSIÇÃO BLOQUEADA | tx=${transactionId} | ${transition.reason} | ip=${webhookIp}`);
              return res.status(200).json({ received: true, warning: "Invalid status transition" });
            }
            if (transition.reason) {
              logger.info(`[Paytime Webhook] Transição com aviso: ${transition.reason}`);
            }
            
            if ((status === 'APPROVED' || status === 'PAID') && localTx.status !== 'APPROVED' && localTx.status !== 'PAID') {
              await updatePaytimeTransactionStatus(transactionId, 'APPROVED', new Date(), 'webhook');
              
              if (localTx.orderId) {
                await updateOrderStatus(localTx.orderId, 'new');
                
                sendEvent(localTx.establishmentId, 'orderPaymentConfirmed', {
                  orderId: localTx.orderId,
                  transactionId,
                  paymentType,
                });
                
                logger.info(`[Paytime Webhook] Pagamento ${paymentType} confirmado: pedido ${localTx.orderId}, transação ${transactionId}`);
              }
            } else if (status === 'FAILED' && localTx.status !== 'FAILED') {
              await updatePaytimeTransactionStatus(transactionId, 'FAILED', undefined, 'webhook');
              logger.info(`[Paytime Webhook] Transação ${paymentType} falhou: ${transactionId}`);
            } else if (status === 'CANCELLED' && localTx.status !== 'CANCELLED') {
              await updatePaytimeTransactionStatus(transactionId, 'CANCELLED', undefined, 'webhook');
              logger.info(`[Paytime Webhook] Transação ${paymentType} cancelada: ${transactionId}`);
            } else if (status === 'REFUNDED' && localTx.status !== 'REFUNDED') {
              await updatePaytimeTransactionStatus(transactionId, 'REFUNDED', undefined, 'webhook');
              logger.info(`[Paytime Webhook] Transação ${paymentType} reembolsada: ${transactionId}`);
            } else if (status === 'CHARGEBACK') {
              await updatePaytimeTransactionStatus(transactionId, 'CANCELLED', undefined, 'webhook');
              logger.warn(`[Paytime Webhook] CHARGEBACK na transação ${paymentType}: ${transactionId}`);
            }
          } else {
            // ─── Verificar se é uma transação de assinatura de plano ───
            try {
              const { getSubscriptionByPaytimeTransactionId, activateSubscription } = await import("../planSubscriptionDb");
              const { activatePlan } = await import("../db");
              
              const planSub = await getSubscriptionByPaytimeTransactionId(transactionId);
              
              if (planSub) {
                const planStatusMap: Record<string, string> = {
                  pending_payment: 'PENDING',
                  active: 'APPROVED',
                  canceled: 'CANCELLED',
                  expired: 'CANCELLED',
                };
                const mappedCurrentStatus = planStatusMap[planSub.status] || null;
                const planTransition = isValidPaytimeTransition(mappedCurrentStatus, status);
                if (!planTransition.valid) {
                  logger.warn(`[Paytime Webhook] TRANSIÇÃO BLOQUEADA (plano) | sub=${planSub.id} | ${planTransition.reason} | ip=${webhookIp}`);
                  return res.status(200).json({ received: true, warning: "Invalid status transition for subscription" });
                }
                
                if ((status === 'APPROVED' || status === 'PAID') && planSub.status !== 'active') {
                  const now = new Date();
                  const periodEnd = new Date(now);
                  if (planSub.billingPeriod === 'annual') {
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                  } else {
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                  }
                  
                  await activateSubscription(planSub.id, {
                    paytimeTransactionId: transactionId,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    nextRenewalAt: periodEnd,
                  });
                  
                  // Ativar plano no estabelecimento
                  await activatePlan(planSub.establishmentId, planSub.planId as 'lite' | 'basic' | 'pro', {
                    billingPeriod: planSub.billingPeriod,
                    planExpiresAt: periodEnd,
                  });
                  
                  // Enviar SSE para notificar frontend
                  sendEvent(planSub.establishmentId, 'planActivated', {
                    planType: planSub.planId,
                    billingPeriod: planSub.billingPeriod,
                    gateway: planSub.gateway,
                    message: `Plano ${planSub.planId} ativado com sucesso via ${planSub.gateway === 'paytime_pix' ? 'PIX' : 'Cartão'}!`,
                  });
                  
                  // Enviar notificação WhatsApp
                  try {
                    const { sendPlatformWhatsappMessage } = await import("../platformWhatsappDb");
                    const { getEstablishmentById } = await import("../db");
                    const { getPlanPrice } = await import("../adminDb");
                    const est = await getEstablishmentById(planSub.establishmentId);
                    if (est) {
                      const phone = est.responsiblePhone || est.whatsapp;
                      if (phone) {
                        // Buscar nome do plano do banco de dados (plan_prices.displayName)
                        const planPriceRow = await getPlanPrice(planSub.planId);
                        const planName = planPriceRow?.displayName || planSub.planId;
                        const periodLabel = planSub.billingPeriod === "annual" ? "Anual" : "Mensal";
                        const gatewayLabel = planSub.gateway?.includes("pix") ? "PIX" : "Cartão de Crédito";
                        const estName = est.name || "Seu estabelecimento";
                        const msg = `\u2705 *Pagamento Confirmado!*\n\nOlá! O pagamento do plano *${planName} (${periodLabel})* do estabelecimento *${estName}* foi confirmado com sucesso via *${gatewayLabel}*.\n\n\ud83c\udf89 Seu plano já está ativo! Aproveite todos os recursos.\n\nQualquer dúvida, estamos à disposição!\n\n*Mindi - Cardápio Digital*`;
                        await sendPlatformWhatsappMessage(phone, msg);
                        logger.info(`[Paytime Webhook] Notificação WhatsApp enviada: est=${planSub.establishmentId}, phone=${phone}`);
                      }
                    }
                  } catch (whatsErr: any) {
                    logger.warn(`[Paytime Webhook] Erro ao enviar WhatsApp: ${whatsErr.message}`);
                  }
                  
                  logger.info(`[Paytime Webhook] Plano ${planSub.planId} ativado para estabelecimento ${planSub.establishmentId} via ${planSub.gateway}`);
                } else if (status === 'FAILED' || status === 'CANCELLED') {
                  const { updateSubscriptionStatus } = await import("../planSubscriptionDb");
                  await updateSubscriptionStatus(planSub.id, 'canceled');
                  logger.info(`[Paytime Webhook] Assinatura de plano cancelada/falhou: sub=${planSub.id}, tx=${transactionId}`);
                }
              } else {
                // ─── Verificar se é uma transação de créditos AI ───
                logger.info(`[Paytime Webhook] Não é plano. Verificando créditos AI: tx=${transactionId}, status=${status}`);
                try {
                  if ((status === 'APPROVED' || status === 'PAID') && transactionId) {
                    const { getTransaction } = await import("../paytime");
                    const tx = await getTransaction(transactionId, "366140");
                    const pkgId = tx.info_additional?.find((i: any) => i.key === "package_id")?.value;
                    const creditsStr = tx.info_additional?.find((i: any) => i.key === "credits")?.value;
                    const estIdStr = tx.info_additional?.find((i: any) => i.key === "establishment_id")?.value;
                    const txType = tx.info_additional?.find((i: any) => i.key === "type")?.value;
                    if (txType === "ai_credits" && pkgId && creditsStr && estIdStr) {
                      const { addAiImageCredits, getAiImageCreditHistory } = await import("../db");
                      const credits = parseInt(creditsStr, 10);
                      const estId = parseInt(estIdStr, 10);
                      // Check if already credited
                      const history = await getAiImageCreditHistory(estId, 20);
                      const alreadyCredited = history.some((h: any) => h.description?.includes(transactionId));
                      if (!alreadyCredited) {
                        await addAiImageCredits(estId, 0, credits, "purchase", `Compra ${pkgId} via Paytime webhook (tx: ${transactionId})`);
                        logger.info(`[Paytime Webhook] Créditos AI adicionados via webhook: est=${estId}, credits=${credits}, tx=${transactionId}`);
                      } else {
                        logger.info(`[Paytime Webhook] Créditos AI já creditados: est=${estId}, tx=${transactionId}`);
                      }
                    } else {
                      logger.warn(`[Paytime Webhook] Transação não encontrada localmente: ${transactionId}`);
                    }
                  } else {
                    logger.warn(`[Paytime Webhook] Transação não encontrada localmente: ${transactionId}`);
                  }
                } catch (aiCreditError: any) {
                  logger.warn(`[Paytime Webhook] Erro ao verificar créditos AI: ${aiCreditError.message}`);
                  logger.warn(`[Paytime Webhook] Transação não encontrada localmente: ${transactionId}`);
                }
              }
            } catch (planSubError) {
              logger.warn(`[Paytime Webhook] Erro ao verificar assinatura de plano: ${planSubError}`);
              logger.warn(`[Paytime Webhook] Transação não encontrada localmente: ${transactionId}`);
            }
          }
        }
      }
      
      // ─── updated-establishment-status (onboarding aprovado/rejeitado) ───
      if (eventName === 'updated-establishment-status') {
        const estData = payload.data;
        const paytimeEstId = estData?.id;
        const newStatus = estData?.status;
        
        logger.info(`[Paytime Webhook] updated-establishment-status: paytimeId=${paytimeEstId}, status=${newStatus}`);
        
        if (paytimeEstId && newStatus) {
          const { getEstablishmentByPaytimeId, updateEstablishment, getUserById } = await import("../db");
          
          const localEst = await getEstablishmentByPaytimeId(String(paytimeEstId));
          
          if (localEst) {
            const statusMap: Record<string, "pending" | "submitted" | "approved" | "rejected"> = {
              'ACTIVE': 'approved',
              'APPROVED': 'approved',
              'PENDING': 'pending',
              'PENDING_APPROVAL': 'submitted',
              'IN_ANALYSIS': 'submitted',
              'REJECTED': 'rejected',
              'BLOCKED': 'rejected',
              'INACTIVE': 'rejected',
              'SUSPENDED': 'rejected',
            };
            
            const mappedStatus = statusMap[newStatus.toUpperCase()];
            
            if (mappedStatus) {
              const updateData: Record<string, unknown> = {
                paytimeOnboardingStatus: mappedStatus,
              };
              
              if (mappedStatus === 'approved') {
                updateData.paytimeGatewayActive = true;
                logger.info(`[Paytime Webhook] Estabelecimento ${localEst.id} aprovado na Paytime! Gateway ativado.`);
              }
              
              if (mappedStatus === 'rejected') {
                updateData.paytimeGatewayActive = false;
                logger.warn(`[Paytime Webhook] Estabelecimento ${localEst.id} rejeitado/bloqueado na Paytime. Status: ${newStatus}`);
              }
              
              await updateEstablishment(localEst.id, updateData as any);
              
              sendEvent(localEst.id, 'paytimeOnboardingUpdate', {
                paytimeEstablishmentId: paytimeEstId,
                paytimeStatus: newStatus,
                onboardingStatus: mappedStatus,
                gatewayActive: mappedStatus === 'approved',
              });
              
              // ─── Notificar owner do projeto (Manus) ───
              try {
                const { notifyOwner } = await import("./notification");
                await notifyOwner({
                  title: `Paytime Onboarding: ${localEst.name}`,
                  content: `O estabelecimento "${localEst.name}" (ID: ${localEst.id}) teve o status atualizado para ${newStatus} (${mappedStatus}) na Paytime.`,
                });
              } catch (notifErr) {
                logger.warn("[Paytime Webhook] Falha ao notificar owner:", notifErr);
              }
              
              // ─── Notificar dono do restaurante por email ───
              try {
                const user = await getUserById(localEst.userId);
                const recipientEmail = localEst.representativeEmail || user?.email;
                
                if (recipientEmail) {
                  const { sendEmail } = await import("../email");
                  const recipientName = localEst.representativeName || user?.name || localEst.name;
                  
                  if (mappedStatus === 'approved') {
                    await sendEmail({
                      to: [{ email: recipientEmail, name: recipientName || undefined }],
                      subject: `Cadastro Aprovado - ${localEst.name}`,
                      html: buildPaytimeApprovalEmail(localEst.name, recipientName || ''),
                      tags: ['paytime-onboarding', 'approved'],
                    });
                    logger.info(`[Paytime Webhook] Email de aprovação enviado para ${recipientEmail}`);
                  } else if (mappedStatus === 'rejected') {
                    await sendEmail({
                      to: [{ email: recipientEmail, name: recipientName || undefined }],
                      subject: `Cadastro - Ação Necessária - ${localEst.name}`,
                      html: buildPaytimeRejectionEmail(localEst.name, recipientName || '', newStatus),
                      tags: ['paytime-onboarding', 'rejected'],
                    });
                    logger.info(`[Paytime Webhook] Email de rejeição enviado para ${recipientEmail}`);
                  }
                } else {
                  logger.warn(`[Paytime Webhook] Sem email para notificar o dono do estabelecimento ${localEst.id}`);
                }
              } catch (emailErr) {
                logger.warn("[Paytime Webhook] Falha ao enviar email de notificação:", emailErr);
              }
              
              // ─── Notificar por push notification ───
              try {
                const { getPushSubscriptionsByEstablishment } = await import("../db");
                const { sendPushNotification } = await import("./webPush");
                const subscriptions = await getPushSubscriptionsByEstablishment(localEst.id);
                
                if (subscriptions.length > 0) {
                  const pushTitle = mappedStatus === 'approved'
                    ? 'Cadastro Aprovado!'
                    : mappedStatus === 'rejected'
                      ? 'Cadastro - Ação Necessária'
                      : `Cadastro: ${mappedStatus}`;
                  const pushBody = mappedStatus === 'approved'
                    ? `Seu estabelecimento "${localEst.name}" foi aprovado! Pagamentos online já estão disponíveis.`
                    : mappedStatus === 'rejected'
                      ? `O cadastro de "${localEst.name}" precisa de atenção. Verifique os dados enviados.`
                      : `Status do cadastro de "${localEst.name}" atualizado para: ${mappedStatus}`;
                  
                  for (const sub of subscriptions) {
                    await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, {
                      title: pushTitle,
                      body: pushBody,
                      tag: 'paytime-onboarding',
                      requireInteraction: true,
                      data: { url: '/banking' },
                    }).catch(e => logger.warn('[Paytime Webhook] Push falhou:', e));
                  }
                }
              } catch (pushErr) {
                logger.warn("[Paytime Webhook] Falha ao enviar push notification:", pushErr);
              }
              
              // ─── Notificar por Telegram (se configurado) ───
              try {
                if (localEst.telegramEnabled && localEst.telegramChatId) {
                  const { sendTelegramMessage } = await import("../telegramNotifier");
                  const emoji = mappedStatus === 'approved' ? '✅' : mappedStatus === 'rejected' ? '❌' : 'ℹ️';
                  const telegramMsg = mappedStatus === 'approved'
                    ? `${emoji} <b>Cadastro Aprovado!</b>\n\nSeu estabelecimento <b>${localEst.name}</b> foi aprovado!\nPagamentos online (PIX e Cartão) já estão disponíveis.`
                    : mappedStatus === 'rejected'
                      ? `${emoji} <b>Cadastro - Ação Necessária</b>\n\nO cadastro de <b>${localEst.name}</b> precisa de atenção.\nStatus: ${newStatus}\nVerifique os dados enviados no painel.`
                      : `${emoji} <b>Atualização de Cadastro</b>\n\nStatus do cadastro de <b>${localEst.name}</b> atualizado para: ${mappedStatus}`;
                  await sendTelegramMessage(localEst.telegramChatId, telegramMsg);
                  logger.info(`[Paytime Webhook] Notificação Telegram enviada para chat ${localEst.telegramChatId}`);
                }
              } catch (telegramErr) {
                logger.warn("[Paytime Webhook] Falha ao enviar Telegram:", telegramErr);
              }
              
              logger.info(`[Paytime Webhook] Estabelecimento ${localEst.id} atualizado: onboardingStatus=${mappedStatus}`);
            } else {
              logger.warn(`[Paytime Webhook] Status desconhecido da Paytime: ${newStatus}`);
            }
          } else {
            logger.warn(`[Paytime Webhook] Estabelecimento não encontrado com paytimeId: ${paytimeEstId}`);
          }
        } else {
          logger.warn(`[Paytime Webhook] updated-establishment-status sem id ou status no payload`);
        }
      }
      
      // ─── updated-establishment-gateway (gateway ativado/desativado) ───
      if (eventName === 'updated-establishment-gateway') {
        const estData = payload.data;
        const paytimeEstId = estData?.id || estData?.establishment_id;
        const gatewayData = estData?.gateway || estData;
        
        logger.info(`[Paytime Webhook] updated-establishment-gateway: paytimeId=${paytimeEstId}`, JSON.stringify(gatewayData).substring(0, 500));
        
        if (paytimeEstId) {
          const { getEstablishmentByPaytimeId, updateEstablishment } = await import("../db");
          const localEst = await getEstablishmentByPaytimeId(String(paytimeEstId));
          
          if (localEst) {
            const gatewayId = gatewayData?.gateway_id || gatewayData?.id;
            const gatewayStatus = gatewayData?.status;
            const isActive = gatewayStatus === 'ACTIVE' || gatewayStatus === 'APPROVED';
            
            const updateData: Record<string, unknown> = {};
            
            // Gateway 4 = SubPaytime (pagamentos), Gateway 6 = Banking
            if (gatewayId === 4 || gatewayId === '4') {
              updateData.paytimeSubPaytimeActive = isActive;
              if (isActive) {
                updateData.paytimeEnabled = true;
                updateData.paytimeCardEnabled = true;
                updateData.onlinePaymentEnabled = true;
              }
              logger.info(`[Paytime Webhook] Gateway SubPaytime (4) do EC ${localEst.id}: ${isActive ? 'ATIVO' : 'INATIVO'}`);
            } else if (gatewayId === 6 || gatewayId === '6') {
              updateData.paytimeBankingActive = isActive;
              if (isActive) {
                updateData.paytimeGatewayActive = true;
              }
              // Extrair KYC URL se disponível
              const kycUrl = gatewayData?.metadata?.url_documents_copy;
              if (kycUrl) {
                updateData.paytimeKycUrl = kycUrl;
              }
              const kycStatus = gatewayData?.metadata?.kyc_status || gatewayStatus;
              const upperKycStatus = (kycStatus || '').toUpperCase();
              if (upperKycStatus === 'APPROVED' || upperKycStatus === 'ACTIVE') {
                updateData.paytimeKycStatus = 'approved';
              } else if (upperKycStatus === 'REJECTED' || upperKycStatus === 'DENIED' || upperKycStatus === 'DENIED_KYC' || upperKycStatus === 'REPROVED' || upperKycStatus === 'BLOCKED') {
                updateData.paytimeKycStatus = 'rejected';
              }
              logger.info(`[Paytime Webhook] Gateway Banking (6) do EC ${localEst.id}: ${isActive ? 'ATIVO' : 'INATIVO'}, KYC: ${upperKycStatus}`);
            }
            
            if (Object.keys(updateData).length > 0) {
              await updateEstablishment(localEst.id, updateData as any);
              
              sendEvent(localEst.id, 'paytimeGatewayUpdate', {
                paytimeEstablishmentId: paytimeEstId,
                gatewayId,
                gatewayStatus,
                isActive,
              });
              
              // Enviar push notification quando KYC muda para aprovado ou rejeitado via webhook
              const newKycStatus = updateData.paytimeKycStatus as string | undefined;
              if (newKycStatus && (newKycStatus === 'approved' || newKycStatus === 'rejected') && localEst.paytimeKycStatus !== newKycStatus) {
                try {
                  const { sendPushNotification } = await import('./webPush');
                  const { getPushSubscriptionsByEstablishment, deletePushSubscriptionById } = await import('../db');
                  const subscriptions = await getPushSubscriptionsByEstablishment(localEst.id);
                  const payload = newKycStatus === 'approved'
                    ? { title: '\u2705 KYC Aprovado!', body: 'Sua verifica\u00e7\u00e3o de identidade foi aprovada. Agora voc\u00ea pode ativar o pagamento online!', icon: '/icon-192.png', url: '/banking' }
                    : { title: '\u274c KYC Rejeitado', body: 'Sua verifica\u00e7\u00e3o de identidade foi negada. Acesse a p\u00e1gina Conta Digital para reenviar os documentos.', icon: '/icon-192.png', url: '/banking' };
                  for (const sub of subscriptions) {
                    try {
                      const success = await sendPushNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        payload
                      );
                      if (!success) await deletePushSubscriptionById(sub.id);
                    } catch (pushErr) {
                      logger.error('[Paytime Webhook] Erro push KYC:', sub.id, pushErr);
                    }
                  }
                  logger.info(`[Paytime Webhook] Push KYC ${newKycStatus} enviado para ${subscriptions.length} dispositivos do EC ${localEst.id}`);
                } catch (pushError) {
                  logger.error('[Paytime Webhook] Erro ao enviar push KYC:', pushError);
                }
              }
            }
          } else {
            logger.warn(`[Paytime Webhook] Estabelecimento não encontrado com paytimeId: ${paytimeEstId}`);
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("[Paytime Webhook] Erro:", error);
      res.status(200).json({ received: true, error: "Internal error" });
    }
  });
  
  // Compression middleware - exclui SSE endpoints para evitar buffering
  app.use(compression({
    filter: (req, res) => {
      // Não comprimir SSE streams - compressão causa buffering
      if (req.headers.accept === 'text/event-stream') return false;
      if (req.url?.includes('/stream') || req.url?.includes('/sse')) return false;
      return compression.filter(req, res);
    }
  }));
  
  // ==================== DEBUG IFOOD CATALOG (TEMPORARY) ====================
  app.get("/api/debug/ifood-catalog/:establishmentId", async (req, res) => {
    try {
      const estId = parseInt(req.params.establishmentId);
      const { getAccessTokenForEstablishment } = await import("../ifood");
      const { ifoodApiCall } = await import("../ifoodInfra");
      const { getIfoodConfig } = await import("../db");
      
      const config = await getIfoodConfig(estId);
      if (!config?.merchantId) {
        return res.json({ error: 'No iFood config found for establishment ' + estId });
      }
      
      const token = await getAccessTokenForEstablishment(estId);
      const BASE = "https://merchant-api.ifood.com.br/catalog/v2.0";
      
      // 1. Catalogs
      const catalogsRes = await ifoodApiCall(
        `${BASE}/merchants/${config.merchantId}/catalogs`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const catalogsRaw = await catalogsRes.text();
      
      let catalogs: any[] = [];
      try { catalogs = JSON.parse(catalogsRaw); } catch(e) {}
      
      const catalogId = catalogs[0]?.catalogId || catalogs[0]?.groupId || 'DEFAULT';
      
      // 2. Categories
      const categoriesRes = await ifoodApiCall(
        `${BASE}/merchants/${config.merchantId}/catalogs/${catalogId}/categories`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const categoriesRaw = await categoriesRes.text();
      
      // 3. sellableItems
      const sellableRes = await ifoodApiCall(
        `${BASE}/merchants/${config.merchantId}/catalogs/${catalogId}/sellableItems`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const sellableRaw = await sellableRes.text();
      
      // 4. unsellableItems
      const unsellableRes = await ifoodApiCall(
        `${BASE}/merchants/${config.merchantId}/catalogs/${catalogId}/unsellableItems`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const unsellableRaw = await unsellableRes.text();
      
      // 5. products with pagination
      const productsRes = await ifoodApiCall(
        `${BASE}/merchants/${config.merchantId}/products?page=0&limit=100`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const productsRaw = await productsRes.text();
      
      // 6. Try category items endpoint for first category
      let categoryItemsRaw = '';
      let categoryItemsStatus = 0;
      let categoryItemsOk = false;
      let firstCategoryId = '';
      try {
        const cats = JSON.parse(categoriesRaw);
        if (Array.isArray(cats) && cats.length > 0) {
          firstCategoryId = cats[0].id;
          const catItemsRes = await ifoodApiCall(
            `${BASE}/merchants/${config.merchantId}/catalogs/${catalogId}/categories/${firstCategoryId}/sellableItems`,
            { method: "GET", token },
            { maxRetries: 2 }
          );
          categoryItemsRaw = await catItemsRes.text();
          categoryItemsStatus = catItemsRes.status;
          categoryItemsOk = catItemsRes.ok;
        }
      } catch(e) {}
      
      // 7. Try v1.0 endpoint
      const v1Res = await ifoodApiCall(
        `https://merchant-api.ifood.com.br/catalog/v1.0/merchants/${config.merchantId}/menu`,
        { method: "GET", token },
        { maxRetries: 2 }
      );
      const v1Raw = await v1Res.text();
      
      res.json({
        establishmentId: estId,
        merchantId: config.merchantId,
        catalogId,
        catalogs: { status: catalogsRes.status, ok: catalogsRes.ok, body: catalogsRaw.substring(0, 5000) },
        categories: { status: categoriesRes.status, ok: categoriesRes.ok, body: categoriesRaw.substring(0, 5000) },
        sellableItems: { status: sellableRes.status, ok: sellableRes.ok, body: sellableRaw.substring(0, 10000) },
        unsellableItems: { status: unsellableRes.status, ok: unsellableRes.ok, body: unsellableRaw.substring(0, 10000) },
        products: { status: productsRes.status, ok: productsRes.ok, body: productsRaw.substring(0, 10000) },
        categoryItems: { status: categoryItemsStatus, ok: categoryItemsOk, categoryId: firstCategoryId, body: categoryItemsRaw.substring(0, 5000) },
        v1Menu: { status: v1Res.status, ok: v1Res.ok, body: v1Raw.substring(0, 10000) },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  // ==================== IFOOD WEBHOOK ====================
  // iFood Webhook MUST be registered BEFORE express.json() for HMAC signature verification
  // GET for health check / test connection
  app.get("/api/ifood/webhook", (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'ifood-webhook' });
  });

  app.post("/api/ifood/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-ifood-signature"] as string | undefined;
      const rawBody = req.body;
      
      // Handle empty body (test connection from iFood portal)
      if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0) || (typeof rawBody === 'string' && rawBody.trim() === '')) {
        logger.info('[iFood Webhook] Empty body received — test connection or health check');
        return res.status(200).json({ success: true, message: 'Webhook is active' });
      }

      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      if (!bodyStr.trim()) {
        logger.info('[iFood Webhook] Empty string body — test connection');
        return res.status(200).json({ success: true, message: 'Webhook is active' });
      }
      
      // 1. Validate HMAC signature on the raw body BEFORE parsing JSON.
      if (signature) {
        const isValid = validateWebhookSignature(rawBody, signature);
        if (!isValid) {
          logger.warn('[iFood Webhook] Invalid HMAC signature — rejecting request before JSON.parse');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        logger.info('[iFood Webhook] HMAC signature validated successfully');
      } else if (process.env.NODE_ENV === 'production') {
        logger.warn('[iFood Webhook] No signature header in production — rejecting request before JSON.parse');
        return res.status(401).json({ error: 'Missing x-ifood-signature header' });
      } else {
        logger.warn('[iFood Webhook] No signature header — processing anyway (dev/sandbox mode)');
      }
      
      // 2. Parse the body only after signature validation.
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(bodyStr);
      } catch (parseErr) {
        logger.error('[iFood Webhook] Failed to parse body after HMAC validation:', parseErr);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
      
      logger.info('[iFood Webhook] Evento recebido:', JSON.stringify(parsedBody).substring(0, 500));
      
      const events = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
      
      // Responder 202 Accepted ANTES do processamento pesado, conforme SLA do iFood.
      res.status(202).json({ success: true });

      // Processamento assíncrono fire-and-forget após resposta ao iFood.
      void (async () => {
        for (const event of events) {
          if (!event.id || !event.code || !event.orderId) {
            logger.info('[iFood Webhook] Evento inválido, ignorando');
            continue;
          }
          
          // 3. Event Deduplication
          const isDuplicate = await isEventDuplicate(event.id);
          if (isDuplicate) {
            logger.info(`[iFood Webhook] Evento duplicado ${event.id} — ignorando`);
            continue;
          }
          
          // 4. Process event
          try {
            const { processIfoodWebhookEvent } = await import('../ifood');
            await processIfoodWebhookEvent(event);
            
            // 5. Mark as processed after successful processing
            await markEventProcessed(event.id, event.code, event.orderId, event.merchantId);
          } catch (processError) {
            logger.error('[iFood Webhook] Erro ao processar evento:', processError);
          }
        }
      })().catch((asyncError) => {
        logger.error('[iFood Webhook] Erro inesperado no processamento assíncrono:', asyncError);
      });
    } catch (error) {
      logger.error('[iFood Webhook] Erro:', error);
      // Retornar 500 para erros reais antes do aceite — iFood tentará reenviar o evento
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ─── Meta WhatsApp Cloud API webhooks ─────────────────────────────────────
  // Separado do UAZAPI propositalmente — caminhos diferentes, formatos diferentes.
  // Precisa ser registrado antes de express.json() para preservar o payload bruto
  // usado na validação HMAC x-hub-signature-256 enviada pela Meta.

  // GET — verificação do hub (Meta chama isso ao salvar a configuração de webhook)
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('[Meta Webhook] Hub verificado com sucesso');
      return res.status(200).send(challenge);
    }

    logger.warn('[Meta Webhook] Verificação de hub rejeitada — token inválido');
    return res.sendStatus(403);
  });

  // POST — eventos recebidos (mensagens de clientes, status de entrega, etc.)
  app.post("/api/whatsapp/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {});

    // Verificar assinatura HMAC antes de processar qualquer dado.
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const { verifyMetaSignature } = await import('./whatsappOfficial');

    if (process.env.META_APP_SECRET) {
      if (!signature) {
        logger.warn('[Meta Webhook] Assinatura ausente — evento rejeitado');
        return res.status(401).json({ error: 'Missing x-hub-signature-256 header' });
      }

      const valid = verifyMetaSignature(rawBody, signature, process.env.META_APP_SECRET);
      if (!valid) {
        logger.warn('[Meta Webhook] Assinatura inválida — evento rejeitado');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      logger.warn('[Meta Webhook] META_APP_SECRET não configurado — processando sem validação HMAC');
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      logger.error('[Meta Webhook] Payload não é JSON válido');
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Responder 200 logo após validação/parsing — Meta retenta se não receber resposta em tempo útil.
    res.sendStatus(200);

    void (async () => {
      // [DESATIVADO TEMPORARIAMENTE] Encaminhar para n8n (com circuit breaker)
      // Para reativar: descomente o bloco abaixo
      /*
      if (!n8nCircuitBreaker.isOpen()) {
        const n8nUrl = process.env.N8N_WEBHOOK_URL_OFFICIAL || process.env.N8N_WEBHOOK_URL || 'https://webn8n.granaupvps.shop/webhook/mindi-official';
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        }).then(() => n8nCircuitBreaker.recordSuccess())
          .catch(err => { n8nCircuitBreaker.recordFailure(); logger.error('[Meta Webhook] Falha ao encaminhar para n8n:', err.message); });
      }
      */

      // Processar eventos internamente
      try {
        const entry   = body?.entry?.[0];
        const change  = entry?.changes?.[0]?.value;
        const wabaId  = entry?.id as string | undefined;

        if (!change) return;

        // Buscar o estabelecimento pela WABA ID
        const { getWhatsappConfigByWabaId } = await import('../db');
        const config = wabaId ? await getWhatsappConfigByWabaId(wabaId).catch(() => null) : null;
        const establishmentId = config?.establishmentId;

        // Mensagens recebidas de clientes
        if (change.messages?.length && establishmentId) {
          const msg = change.messages[0];
          const from = msg.from as string; // E.164 sem o +

          logger.info('[Meta Webhook] Mensagem recebida:', { establishmentId, from, type: msg.type });

          // Marcar como lida (melhor experiência para o cliente)
          if (config?.phoneNumberId && config?.accessToken) {
            const { markAsRead } = await import('./whatsappOfficial');
            markAsRead({ phoneNumberId: config.phoneNumberId, accessToken: config.accessToken }, msg.id)
              .catch(() => {});
          }

          // TODO: gravar em whatsapp_messages + SSE para o painel
          // (mesma lógica do UAZAPI, adaptada para o formato Meta)
        }

        // Status de entrega de mensagens (delivered, read, failed)
        if (change.statuses?.length) {
          const status = change.statuses[0];
          logger.debug('[Meta Webhook] Status de mensagem:', { id: status.id, status: status.status });
        }
      } catch (err) {
        logger.error('[Meta Webhook] Erro ao processar evento:', err);
      }
    })().catch(err => logger.error('[Meta Webhook] Erro inesperado no processamento assíncrono:', err));
  });

  // ─── Fim dos webhooks Meta ─────────────────────────────────────────────────

  // Limite de 5MB para JSON padrão; uploads de imagem usam endpoint dedicado com limite próprio
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));
  app.use(cookieParser());

  // Google Maps JavaScript SDK via proxy interno server-side.
  // Mantém a chave Forge/Manus fora do bundle público do frontend.
  app.get("/api/maps/js", async (req, res) => {
    try {
      if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
        res.status(503).type("text/plain").send("Google Maps proxy credentials are not configured");
        return;
      }

      const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
      const url = new URL(`${baseUrl}/v1/maps/proxy/maps/api/js`);
      url.searchParams.set("key", ENV.forgeApiKey);
      url.searchParams.set("v", typeof req.query.v === "string" ? req.query.v : "weekly");
      url.searchParams.set("libraries", typeof req.query.libraries === "string" ? req.query.libraries : "marker,places,geocoding,geometry");

      const response = await fetch(url.toString(), {
        headers: { Accept: "application/javascript,text/javascript,*/*" },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        logger.warn("[Maps JS] Proxy request failed", {
          status: response.status,
          statusText: response.statusText,
          detail: errorText.slice(0, 180),
        });
        res.status(502).type("text/plain").send("Google Maps JavaScript proxy unavailable");
        return;
      }

      const script = await response.text();
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(script);
    } catch (error) {
      logger.warn("[Maps JS] Failed to serve internal Maps JavaScript SDK", error instanceof Error ? error.message : String(error));
      res.status(503).type("text/plain").send("Google Maps JavaScript proxy unavailable");
    }
  });
  
  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Google OAuth routes (GET /api/auth/google, GET /api/auth/google/callback)
  app.use(createGoogleAuthRouter());
  
  // SSE endpoint para pedidos em tempo real
  app.get("/api/orders/stream", async (req, res) => {
    try {
      // Autenticar pela mesma lógica central usada nas demais rotas protegidas.
      // Isso evita falhas quando o navegador envia cookies app_session_id duplicados/legados.
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (authError) {
        logger.info("[SSE] Falha na autenticação:", authError);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      // Obter estabelecimento do usuário
      const establishment = await getEstablishmentByUserId(user.id);
      if (!establishment) {
        logger.info("[SSE] Estabelecimento não encontrado para usuário:", user.id);
        res.status(404).json({ error: "Establishment not found" });
        return;
      }
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId: establishment.id })}\n\n`);
      
      // Adicionar conexão ao pool
      addConnection(establishment.id, res);
      
      // Configurar heartbeat a cada 15 segundos (reduzido para evitar buffering)
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat(establishment.id);
      }, 15000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeConnection(establishment.id, res);
        logger.info(`[SSE] Conexão fechada para estabelecimento ${establishment.id}`);
      });
      
    } catch (error) {
      logger.error("[SSE] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ==================== CHAT SSE ENDPOINT ====================
  // SSE endpoint para chat WhatsApp em tempo real no dashboard
  app.get("/api/chat/stream", async (req, res) => {
    try {
      // Autenticar pela mesma lógica central usada nas demais rotas protegidas.
      // Isso evita falhas quando o navegador envia cookies app_session_id duplicados/legados.
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (authError) {
        logger.info("[SSE-Chat] Falha na autenticação:", authError);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const establishment = await getEstablishmentByUserId(user.id);
      if (!establishment) {
        res.status(404).json({ error: "Establishment not found" });
        return;
      }

      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId: establishment.id })}\n\n`);

      addChatConnection(establishment.id, res);

      const heartbeatInterval = setInterval(() => {
        sendChatHeartbeat(establishment.id);
      }, 15000);

      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeChatConnection(establishment.id, res);
        logger.info(`[SSE-Chat] Conex\u00e3o fechada para estabelecimento ${establishment.id}`);
      });

      logger.info(`[SSE-Chat] Conex\u00e3o aberta para estabelecimento ${establishment.id}`);
    } catch (error) {
      logger.error("[SSE-Chat] Erro ao estabelecer conex\u00e3o:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SSE endpoint para clientes acompanharem pedidos em tempo real (por orderIds - PREFERRED)
  app.get("/api/orders/track/stream/byid", async (req, res) => {
    try {
      const orderIdsParam = req.query.ids as string;
      
      if (!orderIdsParam) {
        res.status(400).json({ error: "Order IDs required" });
        return;
      }
      
      const orderIds = orderIdsParam.split(',').map(o => o.trim()).filter(o => o.length > 0);
      
      if (orderIds.length === 0) {
        res.status(400).json({ error: "At least one order ID required" });
        return;
      }
      
      logger.info(`[SSE-Order] Iniciando conexão por orderId para pedidos: ${orderIds.join(', ')}`);
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      
      res.write(`event: connected\ndata: ${JSON.stringify({ orderIds })}\n\n`);
      
      // Buscar e enviar o status atual de cada pedido por ID
      try {
        const currentOrders = await getOrdersByIds(orderIds.map(id => parseInt(id, 10)));
        logger.info(`[SSE-Order] Enviando status atual de ${currentOrders.length} pedidos (por orderId)`);
        
        for (const order of currentOrders) {
          const statusUpdate = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            cancellationReason: order.cancellationReason || undefined
          };
          res.write(`event: order_status_update\ndata: ${JSON.stringify(statusUpdate)}\n\n`);
          logger.info(`[SSE-Order] Enviado status inicial: orderId=${order.id} (${order.orderNumber}) -> ${order.status}`);
        }
      } catch (error) {
        logger.error('[SSE-Order] Erro ao buscar status inicial dos pedidos por orderId:', error);
      }
      
      addOrderIdConnectionForMultiple(orderIds, res);
      
      const heartbeatInterval = setInterval(() => {
        try {
          res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
        } catch (error) {
          logger.error("[SSE-Order] Erro ao enviar heartbeat:", error);
        }
      }, 15000);
      
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeOrderIdConnectionFromMultiple(orderIds, res);
        logger.info(`[SSE-Order] Conexão fechada para pedidos (por orderId): ${orderIds.join(', ')}`);
      });
      
    } catch (error) {
      logger.error("[SSE-Order] Erro ao estabelecer conexão por orderId:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // SSE endpoint para clientes acompanharem pedidos em tempo real (por orderNumbers) - LEGACY
  app.get("/api/orders/track/stream", async (req, res) => {
    try {
      const orderNumbersParam = req.query.orders as string;
      
      if (!orderNumbersParam) {
        logger.info("[SSE-Order] Sem orderNumbers fornecidos");
        res.status(400).json({ error: "Order numbers required" });
        return;
      }
      
      // Parse dos orderNumbers (separados por vírgula)
      const orderNumbers = orderNumbersParam.split(',').map(o => o.trim()).filter(o => o.length > 0);
      
      if (orderNumbers.length === 0) {
        logger.info("[SSE-Order] Lista de orderNumbers vazia");
        res.status(400).json({ error: "At least one order number required" });
        return;
      }
      
      logger.info(`[SSE-Order] Iniciando conexão para pedidos: ${orderNumbers.join(', ')}`);
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ orders: orderNumbers })}\n\n`);
      
      // Buscar e enviar o status atual de cada pedido
      // Isso garante que o cliente receba o status correto mesmo que tenha se conectado depois de mudanças
      try {
        const currentOrders = await getOrdersByOrderNumbers(orderNumbers);
        logger.info(`[SSE-Order] Enviando status atual de ${currentOrders.length} pedidos`);
        
        for (const order of currentOrders) {
          const statusUpdate = {
            orderNumber: order.orderNumber,
            status: order.status,
            cancellationReason: order.cancellationReason || undefined
          };
          res.write(`event: order_status_update\ndata: ${JSON.stringify(statusUpdate)}\n\n`);
          logger.info(`[SSE-Order] Enviado status inicial: ${order.orderNumber} -> ${order.status}`);
        }
      } catch (error) {
        logger.error('[SSE-Order] Erro ao buscar status inicial dos pedidos:', error);
      }
      
      // Adicionar conexão ao pool para cada pedido
      addOrderConnectionForMultiple(orderNumbers, res);
      
      // Configurar heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        // Enviar heartbeat genérico para esta conexão
        try {
          res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
        } catch (error) {
          logger.error("[SSE-Order] Erro ao enviar heartbeat:", error);
        }
      }, 15000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeOrderConnectionFromMultiple(orderNumbers, res);
        logger.info(`[SSE-Order] Conexão fechada para pedidos: ${orderNumbers.join(', ')}`);
      });
      
    } catch (error) {
      logger.error("[SSE-Order] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // SSE endpoint para menu público (stories, produtos, status do estabelecimento)
  app.get("/api/menu/:slug/stream", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        res.status(400).json({ error: "Slug is required" });
        return;
      }

      // Buscar estabelecimento pelo slug
      const establishment = await getEstablishmentBySlug(slug);
      if (!establishment) {
        res.status(404).json({ error: "Establishment not found" });
        return;
      }

      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId: establishment.id })}\n\n`);

      // Adicionar conexão ao pool do menu público
      addMenuPublicConnection(establishment.id, res);

      // Heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        sendMenuPublicHeartbeat(establishment.id);
      }, 30000);

      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeMenuPublicConnection(establishment.id, res);
        logger.info(`[SSE-Menu] Conexão fechada para estabelecimento ${establishment.id} (slug: ${slug})`);
      });

    } catch (error) {
      logger.error("[SSE-Menu] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rota pública para gerar HTML do recibo de impressão (para app ESC POS)
  app.get("/api/print/receipt/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).send("ID do pedido inválido");
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).send("Pedido não encontrado");
        return;
      }
      
      const orderItemsList = await getOrderItems(orderId);
      const establishment = await getEstablishmentById(order.establishmentId);
      const settings = await getPrinterSettings(order.establishmentId);
      
      // Verificar se deve usar ESC/POS ou HTML
      const useEscPos = settings?.htmlPrintEnabled === false;
      
      if (useEscPos) {
        // Gerar recibo em formato texto puro ESC/POS
        const { generatePlainTextReceipt } = await import('../escpos');
        
        const orderData = {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          deliveryType: order.deliveryType as 'delivery' | 'pickup' | 'dine_in',
          customerName: order.customerName || undefined,
          customerPhone: order.customerPhone || undefined,
          address: order.customerAddress || undefined,
          paymentMethod: order.paymentMethod || undefined,
          changeFor: order.changeAmount ? parseFloat(order.changeAmount) : undefined,
          items: orderItemsList.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: parseFloat(item.totalPrice as any) || 0,
            notes: item.notes || undefined,
            complements: item.complements || undefined,
          })),
          subtotal: parseFloat(order.subtotal as any) || 0,
          deliveryFee: order.deliveryFee ? parseFloat(order.deliveryFee as any) : undefined,
          discount: order.discount ? parseFloat(order.discount as any) : undefined,
          total: parseFloat(order.total as any) || 0,
        };
        
        const textReceipt = generatePlainTextReceipt(
          orderData,
          establishment,
          (settings?.paperWidth as '58mm' | '80mm') || '80mm'
        );
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(textReceipt);
      } else {
        // Gerar HTML otimizado para impressora térmica 58mm/80mm
        const html = generateReceiptHTML(order, orderItemsList, establishment, settings);
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      }
    } catch (error) {
      logger.error("[Print] Erro ao gerar recibo:", error);
      res.status(500).send("Erro ao gerar recibo");
    }
  });
  
  // Rota para teste de impressão com dados de exemplo
  // USA A MESMA FUNÇÃO generateReceiptHTML para garantir que o recibo de teste
  // seja EXATAMENTE igual ao recibo real de pedidos aceitos
  app.get("/api/print/test/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Criar pedido de exemplo com a mesma estrutura de um pedido real
      const sampleOrder = {
        orderNumber: "P999",
        createdAt: new Date(),
        deliveryType: "delivery",
        customerName: "João Silva",
        customerPhone: "11999998888",
        customerAddress: "Rua das Flores, 123 - Centro",
        subtotal: "90.80",
        deliveryFee: "5.00",
        discount: "0",
        total: "95.80",
        paymentMethod: "pix",
        changeAmount: null,
        couponCode: null,
        notes: null,
      };
      
      // Criar itens de exemplo com a mesma estrutura dos itens reais
      const sampleItems = [
        { 
          productName: "X-Burger Especial", 
          quantity: 2, 
          totalPrice: "67.80",
          notes: "Sem cebola",
          complements: JSON.stringify([{
            items: [
              { name: "Bacon extra", price: 5.00 },
              { name: "Queijo cheddar", price: 3.00 }
            ]
          }])
        },
        { 
          productName: "Batata Frita Grande", 
          quantity: 1, 
          totalPrice: "15.00",
          notes: null,
          complements: null
        },
        { 
          productName: "Refrigerante 600ml", 
          quantity: 2, 
          totalPrice: "16.00",
          notes: "Bem gelado",
          complements: null
        }
      ];
      
      // Verificar se deve usar ESC/POS ou HTML
      const useEscPos = settings?.htmlPrintEnabled === false;
      
      if (useEscPos) {
        // Gerar recibo em formato texto puro ESC/POS
        const { generatePlainTextReceipt } = await import('../escpos');
        
        const orderData = {
          orderNumber: sampleOrder.orderNumber,
          createdAt: sampleOrder.createdAt,
          deliveryType: sampleOrder.deliveryType as 'delivery' | 'pickup' | 'dine_in',
          customerName: sampleOrder.customerName,
          customerPhone: sampleOrder.customerPhone,
          address: sampleOrder.customerAddress,
          paymentMethod: sampleOrder.paymentMethod,
          items: sampleItems.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: parseFloat(item.totalPrice),
            notes: item.notes || undefined,
            complements: item.complements || undefined,
          })),
          subtotal: parseFloat(sampleOrder.subtotal),
          deliveryFee: parseFloat(sampleOrder.deliveryFee),
          discount: parseFloat(sampleOrder.discount),
          total: parseFloat(sampleOrder.total),
        };
        
        const textReceipt = generatePlainTextReceipt(
          orderData,
          establishment,
          (settings?.paperWidth as '58mm' | '80mm') || '80mm'
        );
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(textReceipt);
      } else {
        // Usar EXATAMENTE a mesma função que gera o recibo real
        const html = generateReceiptHTML(sampleOrder, sampleItems, establishment, settings);
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      }
    } catch (error) {
      logger.error("[Print Test] Erro ao gerar recibo de teste:", error);
      res.status(500).send("Erro ao gerar recibo de teste");
    }
  });
  
  // Rota para impressão de texto personalizado
  app.get("/api/print/custom/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      const customText = req.query.text as string || '';
      
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Configurações de fonte
      const fontSize = settings?.fontSize || 12;
      const fontWeight = settings?.fontWeight || 500;
      const titleFontSize = settings?.titleFontSize || 16;
      const titleFontWeight = settings?.titleFontWeight || 700;
      const paperWidth = settings?.paperWidth || '80mm';
      const showDividers = settings?.showDividers ?? false;
      
      const maxWidth = paperWidth === "58mm" ? "220px" : "300px";
      const establishmentName = establishment?.name || "Restaurante";
      
      // Converter quebras de linha para <br>
      const formattedText = customText.replace(/\n/g, '<br>');
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Impressão Personalizada</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: ${fontSize}px; 
      font-weight: ${fontWeight};
      padding: 15px; 
      max-width: ${maxWidth}; 
      margin: 0 auto; 
      background: #fff;
      color: #333;
    }
    .receipt {
      background: #fff;
      padding: 8px;
    }
    .header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #ccc;' : ''}
    }
    .header h1 {
      font-size: ${titleFontSize + 4}px;
      font-weight: ${titleFontWeight};
      margin: 0;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 1px solid #ccc;' : ''}
      font-size: ${fontSize - 2}px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${establishmentName}</h1>
    </div>
    <div class="content">
      ${formattedText}
    </div>
    <div class="footer">
      <p>Cardapio Admin</p>
    </div>
  </div>
</body>
</html>
      `;
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      logger.error("[Print Custom] Erro ao gerar impressão personalizada:", error);
      res.status(500).send("Erro ao gerar impressão personalizada");
    }
  });
  
  // Endpoint para gerar deep link do Multi Printer Print Service
  // Permite imprimir em múltiplas impressoras simultaneamente via app Android
  app.get("/api/print/multiprinter/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "ID do pedido inválido" });
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: "Pedido não encontrado" });
        return;
      }
      
      // Buscar impressoras ativas do estabelecimento
      const printers = await getActivePrinters(order.establishmentId);
      
      if (printers.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // URL pública do recibo
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const receiptUrl = `${baseUrl}/api/print/receipt/${orderId}`;
      
      // Gerar deep link para o app Multi Printer
      // Formato: print://escpos.org/escpos/mnps/print?mpjo=[{jobs}]
      // Usando printerIpAddr e printerPort para enviar diretamente para o IP da impressora
      const printJobs = printers.map((printer: any) => ({
        srcTp: "uri",
        srcObj: "html",
        src: encodeURIComponent(receiptUrl),
        printerIpAddr: printer.ipAddress,
        printerPort: String(printer.port || 9100),
        numCopies: 1,
        openCashDrawer: 0
      }));
      
      // O deep link usa o JSON array diretamente, encodado uma vez
      const deepLink = `print://escpos.org/escpos/mnps/print?mpjo=${encodeURIComponent(JSON.stringify(printJobs))}`;
      
      res.json({
        success: true,
        deepLink,
        receiptUrl,
        printers: printers.map((p: any) => ({ name: p.name, ip: p.ipAddress, port: p.port })),
        orderId,
        orderNumber: order.orderNumber
      });
    } catch (error) {
      logger.error("[MultiPrinter] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });
  
  // Endpoint para gerar deep link de teste (sem pedido real)
  app.get("/api/print/multiprinter-test/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      if (isNaN(establishmentId)) {
        res.status(400).json({ error: "ID do estabelecimento inválido" });
        return;
      }
      
      // Buscar impressoras ativas do estabelecimento
      const printers = await getActivePrinters(establishmentId);
      
      if (printers.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // URL pública do recibo de teste
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const receiptUrl = `${baseUrl}/api/print/test/${establishmentId}`;
      
      // Gerar deep link para o app Multi Printer
      // Usando printerIpAddr e printerPort para enviar diretamente para o IP da impressora
      const printJobs = printers.map((printer: any) => ({
        srcTp: "uri",
        srcObj: "html",
        src: encodeURIComponent(receiptUrl),
        printerIpAddr: printer.ipAddress,
        printerPort: String(printer.port || 9100),
        numCopies: 1,
        openCashDrawer: 0
      }));
      
      const deepLink = `print://escpos.org/escpos/mnps/print?mpjo=${encodeURIComponent(JSON.stringify(printJobs))}`;
      
      res.json({
        success: true,
        deepLink,
        receiptUrl,
        printers: printers.map((p: any) => ({ name: p.name, ip: p.ipAddress, port: p.port }))
      });
    } catch (error) {
      logger.error("[MultiPrinter Test] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });

  // Endpoint para gerar deep link com separação de itens por setor/impressora
  // Cada impressora recebe apenas os itens do seu setor
  app.get("/api/print/multiprinter-sectors/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "ID do pedido inválido" });
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: "Pedido não encontrado" });
        return;
      }
      
      // Buscar itens do pedido com informações da impressora
      const itemsWithPrinter = await getOrderItemsWithPrinter(orderId);
      
      // Buscar todas as impressoras ativas
      const allPrinters = await getActivePrinters(order.establishmentId);
      
      if (allPrinters.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // Agrupar itens por impressora
      const itemsByPrinter = new Map<number, typeof itemsWithPrinter>();
      const itemsWithoutPrinter: typeof itemsWithPrinter = [];
      
      for (const item of itemsWithPrinter) {
        if (item.printerId && item.printerActive) {
          if (!itemsByPrinter.has(item.printerId)) {
            itemsByPrinter.set(item.printerId, []);
          }
          itemsByPrinter.get(item.printerId)!.push(item);
        } else {
          // Itens sem impressora definida vão para todas as impressoras
          itemsWithoutPrinter.push(item);
        }
      }
      
      // URL base
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Gerar jobs de impressão
      const printJobs: any[] = [];
      const printersSummary: any[] = [];
      
      // Se há itens sem setor definido, precisamos enviar para todas as impressoras
      // Então geramos um job para cada impressora ativa
      if (itemsWithoutPrinter.length > 0) {
        // Itens sem setor vão para TODAS as impressoras
        for (const printer of allPrinters) {
          const receiptUrl = `${baseUrl}/api/print/receipt-sector/${orderId}/${printer.id}`;
          
          // Combinar itens do setor específico + itens sem setor
          const printerSpecificItems = itemsByPrinter.get(printer.id) || [];
          const allItemsForPrinter = [...printerSpecificItems, ...itemsWithoutPrinter];
          
          if (allItemsForPrinter.length > 0) {
            printJobs.push({
              srcTp: "uri",
              srcObj: "html",
              src: encodeURIComponent(receiptUrl),
              printerIpAddr: printer.ipAddress,
              printerPort: String(printer.port || 9100),
              numCopies: 1,
              openCashDrawer: 0
            });
            
            printersSummary.push({
              name: printer.name,
              ip: printer.ipAddress,
              port: printer.port,
              items: allItemsForPrinter.map((i: any) => i.productName)
            });
          }
        }
      } else {
        // Não há itens sem setor, enviar apenas para impressoras com itens associados
        for (const [printerId, items] of Array.from(itemsByPrinter.entries())) {
          const printer = allPrinters.find((p: any) => p.id === printerId);
          if (!printer) continue;
          
          // URL do recibo filtrado por setor
          const receiptUrl = `${baseUrl}/api/print/receipt-sector/${orderId}/${printerId}`;
          
          printJobs.push({
            srcTp: "uri",
            srcObj: "html",
            src: encodeURIComponent(receiptUrl),
            printerIpAddr: printer.ipAddress,
            printerPort: String(printer.port || 9100),
            numCopies: 1,
            openCashDrawer: 0
          });
          
          printersSummary.push({
            name: printer.name,
            ip: printer.ipAddress,
            port: printer.port,
            items: items.map((i: any) => i.productName)
          });
        }
      }
      
      if (printJobs.length === 0) {
        res.status(400).json({ error: "Nenhum item para imprimir" });
        return;
      }
      
      const deepLink = `print://escpos.org/escpos/mnps/print?mpjo=${encodeURIComponent(JSON.stringify(printJobs))}`;
      
      res.json({
        success: true,
        deepLink,
        printers: printersSummary,
        orderId,
        orderNumber: order.orderNumber,
        mode: "sectors"
      });
    } catch (error) {
      logger.error("[MultiPrinter Sectors] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });
  
  // Endpoint para gerar recibo filtrado por setor/impressora
  // Usa o mesmo layout completo do recibo normal, apenas filtrando os itens por setor
  app.get("/api/print/receipt-sector/:orderId/:printerId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const printerId = parseInt(req.params.printerId);
      
      if (isNaN(orderId) || isNaN(printerId)) {
        res.status(400).send("Parâmetros inválidos");
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).send("Pedido não encontrado");
        return;
      }
      
      // Buscar todos os itens do pedido
      const allOrderItems = await getOrderItems(orderId);
      
      // Buscar itens com informação de impressora para filtrar
      const itemsWithPrinter = await getOrderItemsWithPrinter(orderId);
      
      // Filtrar IDs dos itens desta impressora específica
      const sectorSpecificItemIds = itemsWithPrinter
        .filter((item: any) => item.printerId === printerId)
        .map((item: any) => item.id);
      
      // Filtrar IDs dos itens sem setor definido (printerId = null) - vão para todas as impressoras
      const noSectorItemIds = itemsWithPrinter
        .filter((item: any) => item.printerId === null || item.printerId === undefined)
        .map((item: any) => item.id);
      
      // Combinar: itens deste setor + itens sem setor (que vão para todas)
      const allSectorItemIds = [...sectorSpecificItemIds, ...noSectorItemIds];
      
      // Filtrar os itens completos do pedido
      const sectorItems = allOrderItems.filter((item: any) => allSectorItemIds.includes(item.id));
      
      if (sectorItems.length === 0) {
        res.status(404).send("Nenhum item para esta impressora");
        return;
      }
      
      const establishment = await getEstablishmentById(order.establishmentId);
      const settings = await getPrinterSettings(order.establishmentId);
      
      // Usar o mesmo layout completo do recibo normal, apenas com itens filtrados (Mindi Printer)
      const html = generateReceiptHTML(order, sectorItems, establishment, settings, true);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      logger.error("[Receipt Sector] Erro:", error);
      res.status(500).send("Erro ao gerar recibo");
    }
  });

  // Rota para gerar HTML do recibo de comanda (tab) para impressão
  app.get("/api/print/tab-receipt/:tabId", async (req, res) => {
    try {
      const tabId = parseInt(req.params.tabId);
      if (isNaN(tabId)) {
        res.status(400).send("ID da comanda inválido");
        return;
      }
      
      const tab = await getTabById(tabId);
      if (!tab) {
        res.status(404).send("Comanda não encontrada");
        return;
      }
      
      const tabItemsList = await getTabItems(tabId);
      const table = tab.tableId ? await getTableById(tab.tableId) : null;
      const establishment = await getEstablishmentById(tab.establishmentId);
      const settings = await getPrinterSettings(tab.establishmentId);
      
      // Buscar pagamentos avulsos da comanda
      const loosePayments = await getTabPayments(tabId);
      const loosePaymentsTotal = loosePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
      
      // Gerar HTML do recibo da comanda (com pagamentos avulsos)
      const html = generateTabReceiptHTML(tab, tabItemsList, table, establishment, settings, loosePaymentsTotal);
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      logger.error("[Print Tab] Erro ao gerar recibo:", error);
      res.status(500).send("Erro ao gerar recibo da comanda");
    }
  });

  // Endpoint para gerar deep link de impressão de comanda em múltiplas impressoras Android
  app.get("/api/print/multiprinter-tab/:tabId", async (req, res) => {
    try {
      const tabId = parseInt(req.params.tabId);
      if (isNaN(tabId)) {
        res.status(400).json({ error: "ID da comanda inválido" });
        return;
      }
      
      const tab = await getTabById(tabId);
      if (!tab) {
        res.status(404).json({ error: "Comanda não encontrada" });
        return;
      }
      
      // Buscar impressoras ativas do estabelecimento
      const printers = await getActivePrinters(tab.establishmentId);
      
      if (printers.length === 0) {
        res.status(400).json({ error: "Nenhuma impressora configurada" });
        return;
      }
      
      // URL pública do recibo da comanda
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const receiptUrl = `${baseUrl}/api/print/tab-receipt/${tabId}`;
      
      // Gerar deep link para o app Multi Printer
      const printJobs = printers.map((printer: any) => ({
        srcTp: "uri",
        srcData: receiptUrl,
        printerIpAddr: printer.ipAddress || "",
        printerPort: printer.port || 9100,
        printerName: printer.name || "Impressora",
        copies: 1
      }));
      
      const deepLinkData = encodeURIComponent(JSON.stringify(printJobs));
      const deepLink = `multiprinter://print?data=${deepLinkData}`;
      
      res.json({
        success: true,
        deepLink,
        printers: printers.map((p: any) => ({ name: p.name, ip: p.ipAddress })),
        tabId
      });
    } catch (error) {
      logger.error("[MultiPrinter Tab] Erro ao gerar deep link:", error);
      res.status(500).json({ error: "Erro ao gerar link de impressão" });
    }
  });

  // ─── Meta WhatsApp Cloud API webhooks ─────────────────────────────────────
  // Registrado antes do parser JSON global para preservar payload bruto e validar HMAC.


  // Webhook para receber respostas dos botões do WhatsApp (UAZAPI)
  // Este endpoint recebe TODOS os webhooks e encaminha para o n8n automaticamente
  app.post("/api/webhook/whatsapp/:establishmentId", express.json(), async (req, res) => {

    try {
      const establishmentId = parseInt(req.params.establishmentId);
      const body = req.body;

      // P10: Validar token secreto do webhook (timing-safe comparison)
      const token = req.query.token as string | undefined;
      if (token) {
        const { getWhatsappConfig } = await import("../db");
        const config = await getWhatsappConfig(establishmentId);
        if (config?.webhookSecret) {
          const crypto = await import("crypto");
          const tokenBuf = Buffer.from(token);
          const secretBuf = Buffer.from(config.webhookSecret);
          if (tokenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(tokenBuf, secretBuf)) {
            logger.info('[WhatsApp Webhook] Token inválido para establishment:', establishmentId);
            return res.status(401).json({ error: "Token inválido" });
          }
        }
      }
      
      // Log sem dados sensíveis do cliente (telefone, mensagens, endereços)
      logger.info('[WhatsApp Webhook] Recebido para establishment:', establishmentId, '| type:', body.message?.type || body.type || 'unknown', '| hasButton:', !!(body.buttonOrListid || body.message?.buttonOrListid || body.data?.buttonOrListid));
      
      // [DESATIVADO TEMPORARIAMENTE] PROXY: Encaminhar para o n8n em background (com circuit breaker)
      // Para reativar: descomente o bloco abaixo
      /*
      if (!n8nCircuitBreaker.isOpen()) {
        const N8N_WEBHOOK_URL = 'https://webn8n.granaupvps.shop/webhook/mindi';
        fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        }).then(() => n8nCircuitBreaker.recordSuccess())
          .catch(err => { n8nCircuitBreaker.recordFailure(); logger.error('[WhatsApp Webhook] Erro ao encaminhar para n8n:', err.message); });
      }
      */
      
      // Verificar se é uma resposta de botão
      const message = body.message || body.data || body;
      
      const buttonId = message?.buttonOrListid || message?.buttonId || message?.selectedButtonId || message?.selectedId || body?.buttonOrListid;
      
      // Proteção contra loops: mensagens enviadas pela API (exceto respostas de botão)
      // NÃO retornar imediatamente — permitir que o SSE envie a mensagem para o chat widget
      const isFromApi = message?.fromMe === true || body?.fromMe === true;
      const skipBotLogic = isFromApi && !buttonId;
      if (skipBotLogic) {
        logger.info('[WhatsApp Webhook] Mensagem enviada pela API (sem botão), pulando lógica do bot mas enviando para chat via SSE');
      }
      // Extrair texto de TODOS os tipos de mensagem, incluindo interativas/botões
      // Mensagens de botão (sendButtonMessage/send/menu) podem retornar o texto em campos diferentes
      // Respostas de botão (quando o usuário clica) podem ter o texto em selectedDisplayText/buttonText
      const messageText = message?.text 
        || message?.body 
        || message?.conversation
        || message?.caption
        || message?.contentText
        || message?.description
        || message?.title
        || message?.selectedDisplayText
        || message?.buttonText
        || message?.buttonsResponseMessage?.selectedDisplayText
        || message?.listResponseMessage?.title
        || message?.buttonsMessage?.contentText
        || message?.interactiveMessage?.body?.text
        || message?.listMessage?.description
        || message?.hydratedTemplate?.hydratedContentText
        || message?.templateMessage?.hydratedFourRowTemplate?.hydratedContentText
        || body?.text
        || body?.selectedDisplayText
        || body?.buttonText;
      // Extrair telefone de TODAS as fontes possíveis do UAZAPI
      // IMPORTANTE: Priorizar chatid e chat.wa_chatid sobre sender/from
      // porque sender pode vir como LID (ex: 68943268040946@lid) que NÃO é um número válido
      // chatid vem como "558899290004@s.whatsapp.net" que é o número real
      const rawSender = message?.sender || message?.from || body?.sender || body?.from;
      const chatId = message?.chatid || body?.chatid || body?.chat?.wa_chatid;
      const chatPhone = body?.chat?.phone; // ex: "+55 88 9929-0004"
      
      // Se rawSender contém @lid, é um Linked ID inválido - usar chatid ou chat.phone
      let senderPhone: string | undefined;
      if (rawSender && !rawSender.includes('@lid')) {
        senderPhone = rawSender;
      } else {
        // Fallback: usar chatid (número real) ou chat.phone
        senderPhone = chatId || chatPhone || rawSender;
      }
      
      // Log sem telefone real para proteger PII
      logger.info('[WhatsApp Webhook] senderPhone resolvido:', senderPhone ? '[REDACTED]' : 'undefined', '| isLid:', rawSender?.includes('@lid'));

      if (!skipBotLogic && buttonId) {
        logger.info('[WhatsApp Webhook] Botão clicado:', buttonId);
        
        // ========== BOTÕES DE CONFIRMAÇÃO/CANCELAMENTO DE PEDIDO ==========
        const confirmMatch = buttonId.match(/confirm_order_(#P\d+)/);
        const cancelMatch = buttonId.match(/cancel_order_(#P\d+)/);
        
        // ========== BOTÕES DO ENTREGADOR ==========
        const deliveryStartMatch = buttonId.match(/delivery_start_(#P\d+)/);
        const deliveryDoneMatch = buttonId.match(/delivery_done_(#P\d+)/);
        
        if (confirmMatch) {
          const orderNumber = confirmMatch[1];
          const { confirmOrderByNumber } = await import('../db');
          const result = await confirmOrderByNumber(establishmentId, orderNumber);
          if (result.success) {
            logger.info('[WhatsApp Webhook] Pedido confirmado com sucesso:', orderNumber);
          }
        } else if (cancelMatch) {
          const orderNumber = cancelMatch[1];
          const { cancelOrderByNumber } = await import('../db');
          const result = await cancelOrderByNumber(establishmentId, orderNumber, 'Cancelado pelo cliente via WhatsApp');
          if (result.success) {
            const { getWhatsappConfig } = await import('../db');
            const { sendTextMessage } = await import('./uazapi');
            const config = await getWhatsappConfig(establishmentId);
            if (config?.instanceToken && senderPhone) {
              const phone = senderPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
              await sendTextMessage(
                config.instanceToken,
                phone,
                `❌ Seu pedido ${orderNumber} foi cancelado conforme solicitado.\n\nSe mudar de ideia, faça um novo pedido pelo nosso cardápio!`
              );
            }
          }
        } else if (deliveryStartMatch) {
          // ========== ENTREGADOR: SAIR PARA ENTREGA ==========
          const orderNumber = deliveryStartMatch[1];
          logger.info('[WhatsApp Webhook] Entregador saiu para entrega:', orderNumber);
          logger.info('[Delivery Start] senderPhone extraído:', senderPhone);
          logger.info('[Delivery Start] Body completo para debug:', JSON.stringify({
            sender: body?.sender, from: body?.from,
            msgSender: message?.sender, msgFrom: message?.from,
            participant: message?.participant || body?.participant,
            remoteJid: message?.key?.remoteJid || body?.key?.remoteJid,
          }));
          
          try {
            const { getPublicOrderByNumber, getWhatsappConfig, getEstablishmentById, getOrderItems, updateOrderStatus, getDeliveryByOrderId, getDriverById, getCashbackTransactionByOrderId, getCashbackBalance } = await import('../db');
            const orderData = await getPublicOrderByNumber(orderNumber, establishmentId);
            
            if (!orderData) {
              logger.error('[Delivery Start] Pedido não encontrado:', orderNumber);
            } else if (orderData.status === 'completed' || orderData.status === 'cancelled') {
              logger.info('[Delivery Start] Pedido já finalizado/cancelado, ignorando:', orderNumber);
            } else {
              // Atualizar status para out_for_delivery
              await updateOrderStatus(orderData.id, 'out_for_delivery');
              logger.info('[Delivery Start] Status atualizado para out_for_delivery:', orderNumber);
              
              // Enviar template "Pronto (Delivery)" ao cliente (em try-catch para não bloquear confirmação ao entregador)
              try {
                if (orderData.customerPhone) {
                  const configClient = await getWhatsappConfig(establishmentId);
                  if (configClient && configClient.status === 'connected' && configClient.notifyOnReady && configClient.instanceToken) {
                    const { sendOrderStatusNotification } = await import('./uazapi');
                    const est = await getEstablishmentById(establishmentId);
                    const orderItems = await getOrderItems(orderData.id);
                    
                    await sendOrderStatusNotification(
                      configClient.instanceToken,
                      orderData.customerPhone,
                      'ready',
                      {
                        customerName: orderData.customerName || 'Cliente',
                        orderNumber: orderData.orderNumber,
                        establishmentName: est?.name || 'Restaurante',
                        template: configClient.templateReady,
                        deliveryType: orderData.deliveryType as 'delivery' | 'pickup' | null,
                        cancellationReason: null,
                        orderItems: orderItems.map((item: any) => ({
                          productName: item.productName,
                          quantity: item.quantity ?? 1,
                          unitPrice: item.unitPrice,
                          totalPrice: item.totalPrice,
                          complements: item.complements,
                          notes: item.notes,
                        })),
                        orderTotal: orderData.total,
                        paymentMethod: orderData.paymentMethod,
                        customerAddress: orderData.customerAddress,
                        changeAmount: orderData.changeAmount || null,
                        deliveryFee: orderData.deliveryFee || null,
                        customerPhone: orderData.customerPhone || null,
                      }
                    );
                    logger.info('[Delivery Start] Template Pronto (Delivery) enviado ao cliente');
                  } else {
                    logger.info('[Delivery Start] Notificação ao cliente não enviada (config desativada ou não conectado)');
                  }
                }
              } catch (clientErr) {
                logger.error('[Delivery Start] Erro ao notificar cliente (não impede confirmação ao entregador):', clientErr);
              }
              
              // Confirmar ao entregador - SEMPRE tenta enviar, independente da notificação ao cliente
              try {
                const configDriver = await getWhatsappConfig(establishmentId);
                logger.info('[Delivery Start] Config WhatsApp para entregador:', {
                  hasConfig: !!configDriver,
                  hasToken: !!configDriver?.instanceToken,
                  status: configDriver?.status,
                });
                
                if (configDriver?.instanceToken) {
                  const { sendTextMessage } = await import('./uazapi');
                  
                  // Extrair telefone do remetente - PRIORIZAR chatid sobre sender (sender pode ser LID inválido)
                  const rawDriverPhone = senderPhone 
                    || message?.participant 
                    || body?.participant 
                    || message?.key?.remoteJid 
                    || body?.key?.remoteJid;
                  
                  // Se o telefone é um LID (@lid), usar chatid ou chat.phone como fallback
                  let driverPhone: string | undefined;
                  if (rawDriverPhone && !rawDriverPhone.includes('@lid')) {
                    driverPhone = rawDriverPhone;
                  } else {
                    // chatid tem o número real (ex: 558899290004@s.whatsapp.net)
                    driverPhone = message?.chatid || body?.chatid || body?.chat?.wa_chatid || body?.chat?.phone;
                    logger.info('[Delivery Start] Sender era LID, usando chatid como fallback:', driverPhone);
                  }
                  
                  logger.info('[Delivery Start] Fontes de telefone:', {
                    senderPhone,
                    rawDriverPhone,
                    isLid: rawDriverPhone?.includes('@lid'),
                    chatid: message?.chatid || body?.chatid,
                    chatWaChatid: body?.chat?.wa_chatid,
                    chatPhone: body?.chat?.phone,
                    driverPhoneResolved: driverPhone,
                  });
                  
                  // Fallback: buscar telefone do entregador pelo pedido no banco de dados
                  if (!driverPhone || driverPhone.includes('@lid')) {
                    logger.info('[Delivery Start] senderPhone não encontrado em nenhuma fonte, buscando entregador no DB...');
                    const delivery = await getDeliveryByOrderId(orderData.id);
                    logger.info('[Delivery Start] Delivery encontrada:', delivery ? { id: delivery.id, driverId: delivery.driverId } : null);
                    if (delivery?.driverId) {
                      const driver = await getDriverById(delivery.driverId);
                      logger.info('[Delivery Start] Driver encontrado:', driver ? { id: driver.id, whatsapp: driver.whatsapp } : null);
                      if (driver?.whatsapp) {
                        driverPhone = driver.whatsapp;
                        logger.info('[Delivery Start] Telefone do entregador encontrado no DB:', driverPhone);
                      }
                    }
                  }
                  
                  if (driverPhone) {
                    const phone = driverPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
                    logger.info('[Delivery Start] Enviando confirmação ao entregador com botão de entregue:', phone);
                    
                    // Enviar mensagem com botão "O pedido foi entregue" usando sendButtonMessage
                    const { sendButtonMessage } = await import('./uazapi');
                    const { buildDeliveryStartedButtons } = await import('../driverButtons');
                    const { getIfoodDeliveryConfirmationInfo } = await import('../ifoodDeliveryConfirmation');
                    const ifoodConfirmation = getIfoodDeliveryConfirmationInfo(orderData);
                    const deliveryDoneButtons = buildDeliveryStartedButtons(orderNumber, {
                      ifoodConfirmationUrl: ifoodConfirmation?.url,
                    });
                    
                    // Montar mensagem com dados do cliente
                    const clientName = orderData.customerName || 'Cliente';
                    const clientPhone = orderData.customerPhone || '';
                    const clientAddress = orderData.customerAddress || '';
                    
                    let deliveryStartMsg = `🛵 Entrega *${orderNumber}* iniciada.\n👤 Cliente *${clientName}* foi informado`;
                    if (clientPhone) {
                      deliveryStartMsg += `\n📞 Telefone: ${clientPhone}`;
                    }
                    deliveryStartMsg += `\n📦 Status atualizado para: "Em Rota".`;
                    if (ifoodConfirmation) {
                      deliveryStartMsg += `\n\n🍽️ *Entrega iFood*`;
                      deliveryStartMsg += `\nLocalizador do pedido: ${ifoodConfirmation.localizer || 'não informado pelo iFood'}`;
                      if (ifoodConfirmation.displayId) {
                        deliveryStartMsg += `\nCódigo/Pedido iFood: ${ifoodConfirmation.displayId}`;
                      }
                      deliveryStartMsg += `\nAo entregar, clique em "O pedido foi entregue" para abrir a confirmação do iFood e informar o código do cliente.`;
                    }
                    if (clientAddress) {
                      deliveryStartMsg += `\n\n📍 *Endereço:*\n${clientAddress}`;
                    }
                    
                    const sendResult = await sendButtonMessage(
                      configDriver.instanceToken,
                      phone,
                      deliveryStartMsg,
                      deliveryDoneButtons,
                      'Clique para atualizar o status'
                    );
                    logger.info('[Delivery Start] Resultado do envio ao entregador:', JSON.stringify(sendResult));
                    if (sendResult.success) {
                      logger.info('[Delivery Start] ✅ Confirmação com botão enviada ao entregador com sucesso');
                    } else {
                      logger.error('[Delivery Start] ❌ Falha ao enviar confirmação ao entregador:', sendResult.message);
                    }
                  } else {
                    logger.error('[Delivery Start] ❌ Não foi possível determinar o telefone do entregador de nenhuma fonte');
                  }
                } else {
                  logger.error('[Delivery Start] ❌ Config WhatsApp não encontrada ou sem instanceToken');
                }
              } catch (driverErr) {
                logger.error('[Delivery Start] ❌ Erro ao enviar confirmação ao entregador:', driverErr);
              }
            }
          } catch (err) {
            logger.error('[Delivery Start] Erro ao processar:', err);
          }
        } else if (deliveryDoneMatch) {
          // ========== ENTREGADOR: PEDIDO ENTREGUE ==========
          const orderNumber = deliveryDoneMatch[1];
          logger.info('[WhatsApp Webhook] Entregador marcou como entregue:', orderNumber);
          
          try {
            const { getPublicOrderByNumber, getWhatsappConfig, getEstablishmentById, getOrderItems, updateOrderStatus, getCashbackTransactionByOrderId, getCashbackBalance } = await import('../db');
            const orderData = await getPublicOrderByNumber(orderNumber, establishmentId);
            
            if (!orderData) {
              logger.error('[Delivery Done] Pedido não encontrado:', orderNumber);
            } else if (orderData.status === 'completed' || orderData.status === 'cancelled') {
              logger.info('[Delivery Done] Pedido já finalizado/cancelado, ignorando:', orderNumber);
            } else {
              // Atualizar status para completed (finalizado)
              await updateOrderStatus(orderData.id, 'completed');
              logger.info('[Delivery Done] Status atualizado para completed:', orderNumber);
              
              // Enviar template "Finalizado" ao cliente (em try-catch para não bloquear confirmação ao entregador)
              try {
                if (orderData.customerPhone) {
                  const configClient = await getWhatsappConfig(establishmentId);
                  if (configClient && configClient.status === 'connected' && configClient.notifyOnCompleted && configClient.instanceToken) {
                    const { sendOrderStatusNotification } = await import('./uazapi');
                    const est = await getEstablishmentById(establishmentId);
                    const orderItems = await getOrderItems(orderData.id);
                    
                    // Buscar info de cashback
                    let cashbackInfo: { cashbackEarned: string; cashbackTotal: string } | null = null;
                    try {
                      if (est?.cashbackEnabled && est?.rewardProgramType === 'cashback') {
                        const cashbackTx = await getCashbackTransactionByOrderId(orderData.id);
                        if (cashbackTx && parseFloat(cashbackTx.amount) > 0) {
                          const balance = await getCashbackBalance(establishmentId, orderData.customerPhone);
                          cashbackInfo = {
                            cashbackEarned: cashbackTx.amount,
                            cashbackTotal: balance?.balance || '0.00',
                          };
                        }
                      }
                    } catch (cbErr) {
                      logger.error('[Delivery Done] Erro ao buscar cashback:', cbErr);
                    }
                    
                    await sendOrderStatusNotification(
                      configClient.instanceToken,
                      orderData.customerPhone,
                      'completed',
                      {
                        customerName: orderData.customerName || 'Cliente',
                        orderNumber: orderData.orderNumber,
                        establishmentName: est?.name || 'Restaurante',
                        template: configClient.templateCompleted,
                        deliveryType: orderData.deliveryType as 'delivery' | 'pickup' | null,
                        cancellationReason: null,
                        orderItems: orderItems.map((item: any) => ({
                          productName: item.productName,
                          quantity: item.quantity ?? 1,
                          unitPrice: item.unitPrice,
                          totalPrice: item.totalPrice,
                          complements: item.complements,
                          notes: item.notes,
                        })),
                        orderTotal: orderData.total,
                        paymentMethod: orderData.paymentMethod,
                        cashbackInfo,
                        customerAddress: orderData.customerAddress,
                        changeAmount: orderData.changeAmount || null,
                        deliveryFee: orderData.deliveryFee || null,
                        customerPhone: orderData.customerPhone || null,
                      }
                    );
                    logger.info('[Delivery Done] Template Finalizado enviado ao cliente');
                  } else {
                    logger.info('[Delivery Done] Notificação ao cliente não enviada (config desativada ou não conectado)');
                  }
                }
              } catch (clientErr) {
                logger.error('[Delivery Done] Erro ao notificar cliente (não impede confirmação ao entregador):', clientErr);
              }
              
              // Confirmar ao entregador - SEMPRE tenta enviar, independente da notificação ao cliente
              try {
                const configDriver = await getWhatsappConfig(establishmentId);
                logger.info('[Delivery Done] Config WhatsApp para entregador:', {
                  hasConfig: !!configDriver,
                  hasToken: !!configDriver?.instanceToken,
                  status: configDriver?.status,
                });
                
                if (configDriver?.instanceToken) {
                  const { sendTextMessage } = await import('./uazapi');
                  
                  // Extrair telefone do remetente - PRIORIZAR chatid sobre sender (sender pode ser LID inválido)
                  const rawDriverPhone = senderPhone 
                    || message?.participant 
                    || body?.participant 
                    || message?.key?.remoteJid 
                    || body?.key?.remoteJid;
                  
                  // Se o telefone é um LID (@lid), usar chatid ou chat.phone como fallback
                  let driverPhone: string | undefined;
                  if (rawDriverPhone && !rawDriverPhone.includes('@lid')) {
                    driverPhone = rawDriverPhone;
                  } else {
                    // chatid tem o número real (ex: 558899290004@s.whatsapp.net)
                    driverPhone = message?.chatid || body?.chatid || body?.chat?.wa_chatid || body?.chat?.phone;
                    logger.info('[Delivery Done] Sender era LID, usando chatid como fallback:', driverPhone);
                  }
                  
                  logger.info('[Delivery Done] Fontes de telefone:', {
                    senderPhone,
                    rawDriverPhone,
                    isLid: rawDriverPhone?.includes('@lid'),
                    chatid: message?.chatid || body?.chatid,
                    chatWaChatid: body?.chat?.wa_chatid,
                    chatPhone: body?.chat?.phone,
                    driverPhoneResolved: driverPhone,
                  });
                  
                  // Fallback: buscar telefone do entregador pelo pedido no banco de dados
                  if (!driverPhone || driverPhone.includes('@lid')) {
                    logger.info('[Delivery Done] senderPhone não encontrado em nenhuma fonte, buscando entregador no DB...');
                    const { getDeliveryByOrderId, getDriverById } = await import('../db');
                    const delivery = await getDeliveryByOrderId(orderData.id);
                    logger.info('[Delivery Done] Delivery encontrada:', delivery ? { id: delivery.id, driverId: delivery.driverId } : null);
                    if (delivery?.driverId) {
                      const driver = await getDriverById(delivery.driverId);
                      logger.info('[Delivery Done] Driver encontrado:', driver ? { id: driver.id, whatsapp: driver.whatsapp } : null);
                      if (driver?.whatsapp) {
                        driverPhone = driver.whatsapp;
                        logger.info('[Delivery Done] Telefone do entregador encontrado no DB:', driverPhone);
                      }
                    }
                  }
                  
                  if (driverPhone) {
                    const phone = driverPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
                    logger.info('[Delivery Done] Enviando confirmação ao entregador:', phone);
                    const doneClientName = orderData.customerName || 'Cliente';
                    const sendResult = await sendTextMessage(
                      configDriver.instanceToken,
                      phone,
                      `\u2705 Entrega *${orderNumber}* conclu\u00edda!\n\ud83d\udc64 Cliente *${doneClientName}* informado\n\ud83d\udce6 Pedido encerrado no sistema.`
                    );
                    logger.info('[Delivery Done] Resultado do envio ao entregador:', JSON.stringify(sendResult));
                    if (sendResult.success) {
                      logger.info('[Delivery Done] ✅ Confirmação enviada ao entregador com sucesso');
                    } else {
                      logger.error('[Delivery Done] ❌ Falha ao enviar confirmação ao entregador:', sendResult.message);
                    }
                  } else {
                    logger.error('[Delivery Done] ❌ Não foi possível determinar o telefone do entregador de nenhuma fonte');
                  }
                } else {
                  logger.error('[Delivery Done] ❌ Config WhatsApp não encontrada ou sem instanceToken');
                }
              } catch (driverErr) {
                logger.error('[Delivery Done] ❌ Erro ao enviar confirmação ao entregador:', driverErr);
              }
            }
          } catch (err) {
            logger.error('[Delivery Done] Erro ao processar:', err);
          }
        }
      } else {
        logger.info('[WhatsApp Webhook] Nenhum buttonId encontrado. Campos:', {
          hasMessage: !!body.message,
          hasData: !!body.data,
          messageKeys: body.message ? Object.keys(body.message) : [],
          dataKeys: body.data ? Object.keys(body.data) : [],
          bodyKeys: Object.keys(body),
        });
      }
      
      // ========== GERAR TEXTO AMIGÁVEL PARA RESPOSTAS DE BOTÃO ==========
      // Quando o entregador/cliente clica em um botão, o webhook pode não trazer o texto
      // do botão nos campos padrão. Usamos o buttonId para gerar texto legível.
      let buttonDisplayText = '';
      if (buttonId && !messageText) {
        const deliveryStartBtn = buttonId.match(/delivery_start_(#P\d+)/);
        const deliveryDoneBtn = buttonId.match(/delivery_done_(#P\d+)/);
        const confirmBtn = buttonId.match(/confirm_order_(#P\d+)/);
        const cancelBtn = buttonId.match(/cancel_order_(#P\d+)/);
        
        if (deliveryStartBtn) {
          buttonDisplayText = `🛵 Sair para entrega (${deliveryStartBtn[1]})`;
        } else if (deliveryDoneBtn) {
          buttonDisplayText = `✅ O pedido foi entregue (${deliveryDoneBtn[1]})`;
        } else if (confirmBtn) {
          buttonDisplayText = `✅ Pedido confirmado (${confirmBtn[1]})`;
        } else if (cancelBtn) {
          buttonDisplayText = `❌ Pedido cancelado (${cancelBtn[1]})`;
        } else {
          // Botão genérico: mostrar o ID do botão formatado
          buttonDisplayText = `🔘 ${buttonId}`;
        }
      }
      
      // ========== DOWNLOAD DE MÍDIA E UPLOAD PARA S3 ==========
      let mediaS3Url: string | null = null;
      // UAZAPI usa 'messageType' — pode vir como 'ImageMessage', 'image', 'imageMessage' etc.
      const rawMsgType = message?.messageType || body?.messageType || message?.type || body?.type || 'text';
      // Normalizar: 'ImageMessage' → 'image', 'AudioMessage' → 'audio', 'PttMessage' → 'ptt', etc.
      const normalizeMessageType = (t: string): string => {
        const lower = t.toLowerCase().replace(/message$/, '');
        // Mapeamentos especiais
        const map: Record<string, string> = {
          'extendedtext': 'text',
          'conversation': 'text',
          'chat': 'text',
        };
        return map[lower] || lower;
      };
      const msgType = normalizeMessageType(rawMsgType);
      const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker', 'ptt'];
      
      logger.info('[WhatsApp Chat] Tipo de mensagem detectado:', { 
        rawMsgType,
        msgType, 
        hasFileURL: !!message?.fileURL,
        fileURL: message?.fileURL ? '[URL presente]' : undefined,
      });
      if (mediaTypes.includes(msgType)) {
        // Extrair ID da mensagem para chamar /message/download
        const mediaMsgId = message?.id || message?.key?.id || body?.key?.id || body?.id;
        
        // Primeiro: tentar usar fileURL se já veio no payload (raro, mas possível)
        let rawMediaUrl = message?.fileURL || message?.fileUrl || message?.file_url
          || message?.mediaUrl || message?.media_url
          || body?.fileURL || body?.fileUrl || body?.file_url
          || body?.mediaUrl || body?.media_url;
        let downloadedMediaMimeType: string | undefined;
        
        // Se não veio fileURL no payload, chamar /message/download da UAZAPI
        if (!rawMediaUrl && mediaMsgId) {
          try {
            const { getWhatsappConfig } = await import('../db');
            const waConfig = await getWhatsappConfig(establishmentId);
            if (waConfig?.instanceToken) {
              const { downloadMedia } = await import('./uazapi');
              const downloadResult = await downloadMedia(
                waConfig.instanceToken,
                mediaMsgId,
                { generateMp3: msgType === 'audio' || msgType === 'ptt' }
              );
              if (downloadResult.fileURL) {
                rawMediaUrl = downloadResult.fileURL;
                downloadedMediaMimeType = downloadResult.mimetype;
                logger.info('[WhatsApp Chat] Obtida fileURL via /message/download:', { msgId: mediaMsgId, mimetype: downloadResult.mimetype });
              } else {
                logger.warn('[WhatsApp Chat] /message/download não retornou fileURL:', { msgId: mediaMsgId, error: downloadResult.error });
              }
            } else {
              logger.warn('[WhatsApp Chat] Sem instanceToken para chamar /message/download');
            }
          } catch (downloadErr) {
            logger.error('[WhatsApp Chat] Erro ao chamar /message/download:', downloadErr);
          }
        }
        
        // Agora fazer download da URL e upload para S3
        if (rawMediaUrl && typeof rawMediaUrl === 'string' && rawMediaUrl.startsWith('http')) {
          try {
            const mediaResponse = await fetch(rawMediaUrl, { signal: AbortSignal.timeout(15000) });
            if (mediaResponse.ok) {
              const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
              const responseContentType = mediaResponse.headers.get('content-type') || '';
              const contentType = responseContentType && !responseContentType.toLowerCase().startsWith('application/octet-stream')
                ? responseContentType
                : (downloadedMediaMimeType || 'application/octet-stream');
              
              // Determinar extensão do arquivo
              const extMap: Record<string, string> = {
                'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
                'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/opus': 'ogg',
                'audio/ogg; codecs=opus': 'ogg',
                'video/mp4': 'mp4', 'video/3gpp': '3gp',
                'application/pdf': 'pdf',
                'image/sticker': 'webp',
              };
              const ext = extMap[contentType.split(';')[0].trim()] || 'bin';
              const timestamp = Date.now();
              const randomSuffix = Math.random().toString(36).slice(2, 8);
              const fileKey = `chat-media/${establishmentId}/${timestamp}-${randomSuffix}.${ext}`;
              
              const { mindiStoragePut } = await import('../mindiStorage');
              const { url } = await mindiStoragePut(fileKey, mediaBuffer, contentType);
              mediaS3Url = url;
              logger.info('[WhatsApp Chat] Mídia salva no storage durável:', { type: msgType, key: fileKey });
            } else {
              logger.warn('[WhatsApp Chat] Falha ao baixar mídia da URL:', { status: mediaResponse.status });
            }
          } catch (mediaErr) {
            logger.error('[WhatsApp Chat] Erro ao processar mídia:', mediaErr);
          }
        } else if (!rawMediaUrl) {
          logger.info('[WhatsApp Chat] Mensagem de mídia sem fileURL e sem msgId para download:', { type: msgType });
        }
      }
      
      // ========== ENVIAR MENSAGEM VIA SSE (armazenamento local no navegador) ==========
      try {
        const isFromMe = message?.fromMe === true || body?.fromMe === true;
        const msgContent = messageText || buttonDisplayText || '';
        
        // Para mensagens fromMe (bot/atendente), o senderPhone é o número do restaurante.
        // Precisamos usar o chatId (número do cliente) para agrupar na mesma conversa.
        // chatId/wa_chatid sempre contém o número do cliente, independente da direção.
        let chatTargetPhone = senderPhone;
        if (isFromMe) {
          // Para mensagens enviadas pelo bot, usar chatId que é o número do destinatário (cliente)
          const recipientId = chatId || message?.chatid || body?.chatid || body?.chat?.wa_chatid;
          if (recipientId) {
            chatTargetPhone = recipientId;
          }
        }
        
        // Só notificar se tiver conteúdo e remetente
        if (chatTargetPhone && (msgContent || msgType !== 'text')) {
          const remoteJid = chatTargetPhone.includes('@') ? chatTargetPhone : `${chatTargetPhone}@s.whatsapp.net`;
          const contactName = body?.chat?.name || body?.pushName || message?.pushName || '';
          const msgId = message?.id || message?.key?.id || body?.key?.id || null;
          const phone = chatTargetPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
          
          const { notifyChatNewMessage } = await import('./sse');
          
          // Enviar via SSE para o frontend salvar no localStorage
          notifyChatNewMessage(establishmentId, {
            remoteJid,
            phone,
            contactName,
            messageId: msgId,
            content: msgContent || `[${msgType}]`,
            messageType: msgType,
            mediaUrl: mediaS3Url,
            direction: isFromMe ? 'outgoing' : 'incoming',
            fromMe: isFromMe,
            createdAt: new Date().toISOString(),
          });
          
          logger.info('[WhatsApp Chat] Mensagem enviada via SSE (localStorage):', { remoteJid: '[REDACTED]', fromMe: isFromMe, type: msgType });
        }
      } catch (chatErr) {
        logger.error('[WhatsApp Chat] Erro ao enviar mensagem via SSE:', chatErr);
      }
      
      // Responder 200 para o webhook do WhatsApp
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('[WhatsApp Webhook] Erro:', error);
      res.status(200).json({ success: false, error: 'Internal error' });
    }
  });

  // ==================== PRINTER APP SSE ENDPOINT (API Key Auth) ====================
  // Endpoint dedicado para app de impressora se conectar via SSE
  // Autenticação por API key (sem OAuth), ideal para dispositivos/apps externos
  // URLs: /api/printer/stream?key={printerApiKey} ou /api/printer/sse?key={printerApiKey}
  app.get(["/api/printer/stream", "/api/printer/sse"], async (req, res) => {
    try {
      const apiKey = req.query.key as string;
      
      if (!apiKey) {
        logger.info("[SSE-Printer] Sem API key");
        res.status(401).json({ error: "API key required. Use ?key=YOUR_API_KEY" });
        return;
      }
      
      // Buscar estabelecimento pela API key
      const { getEstablishmentByPrinterApiKey } = await import("../db");
      const result = await getEstablishmentByPrinterApiKey(apiKey);
      
      if (!result) {
        logger.info("[SSE-Printer] API key inv\u00e1lida:", apiKey.substring(0, 8) + "...");
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      
      const { establishmentId } = result;
      logger.info(`[SSE-Printer] Conex\u00e3o autorizada para estabelecimento ${establishmentId} via API key`);
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no");
      // CORS aberto para permitir conexão de apps externos (Mindi Printer Android)
      // Apps nativos não enviam header Origin, então lógica baseada em origin não funciona
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.flushHeaders();
      
      // Buscar configurações da impressora para enviar junto com o evento de conexão
      const { getPrinterSettings: getPSettingsForConnect } = await import("../db");
      const printerSettingsForConnect = await getPSettingsForConnect(establishmentId);
      const htmlPrintEnabledForConnect = (printerSettingsForConnect as any)?.mindiHtmlPrintEnabled ?? printerSettingsForConnect?.htmlPrintEnabled ?? true;
      const paperWidthForConnect = (printerSettingsForConnect as any)?.mindiPaperWidth || printerSettingsForConnect?.paperWidth || "80mm";
      const beepOnPrintForConnect = (printerSettingsForConnect as any)?.mindiBeepOnPrint ?? printerSettingsForConnect?.beepOnPrint ?? false;
      // Enviar evento de conex\u00e3o estabelecida COM configurações da impressora
      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId, source: "printer_app", htmlPrintEnabled: htmlPrintEnabledForConnect, paperWidth: paperWidthForConnect, beepOnPrint: beepOnPrintForConnect })}\n\n`);
      
      // Adicionar ao pool EXCLUSIVO de impressoras (separado do dashboard)
      addPrinterConnection(establishmentId, res);
      
      // Heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        try {
          res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removePrinterConnection(establishmentId, res);
        logger.info(`[SSE-Printer] Conexão de impressora fechada para estabelecimento ${establishmentId}`);
      });
      
    } catch (error) {
      logger.error("[SSE-Printer] Erro ao estabelecer conex\u00e3o:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ==================== PUBLIC CHAT SSE ENDPOINT ====================
  app.get("/api/public-chat/stream", async (req, res) => {
    try {
      const orderId = parseInt(req.query.orderId as string);
      const phone = (req.query.phone as string || '').replace(/\D/g, '');
      if (!orderId || isNaN(orderId) || !phone) {
        res.status(400).json({ error: "orderId and phone are required" });
        return;
      }
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      const orderPhone = (order.customerPhone || '').replace(/\D/g, '');
      if (orderPhone !== phone) {
        res.status(403).json({ error: "Phone does not match order" });
        return;
      }
      const inactiveStatuses = ['completed', 'delivered', 'cancelled'];
      if (inactiveStatuses.includes(order.status)) {
        const completedAt = order.updatedAt ? new Date(order.updatedAt).getTime() : 0;
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (completedAt < oneHourAgo) {
          res.status(403).json({ error: "Chat no longer available for this order" });
          return;
        }
      }
      const establishmentId = order.establishmentId;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      res.write(`event: connected\ndata: ${JSON.stringify({ orderId, establishmentId })}\n\n`);
      addPublicChatConnection(establishmentId, orderId, res);
      const heartbeatInterval = setInterval(() => sendPublicChatHeartbeat(establishmentId, orderId), 15000);
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removePublicChatConnection(establishmentId, orderId, res);
        logger.info(`[SSE-PublicChat] Conexão fechada para estab=${establishmentId} order=${orderId}`);
      });
    } catch (error) {
      logger.error("[SSE-PublicChat] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // ==================== PRINTER DEVICE REGISTRATION ====================
  // Endpoint para o app Mindi Printer registrar o dispositivo automaticamente
  // POST /api/printer/register
  // Body: { deviceName, deviceId, deviceModel?, platform?, ipAddress? }
  // Auth: API key via header Authorization: Bearer {key} ou query ?key={key}
  app.post("/api/printer/register", express.json(), async (req, res) => {
    try {
      // Extrair API key do header ou query
      let apiKey = req.query.key as string;
      if (!apiKey) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          apiKey = authHeader.substring(7);
        }
      }
      if (!apiKey) {
        res.status(401).json({ error: "API key required. Use Authorization: Bearer {key} or ?key={key}" });
        return;
      }

      // Validar API key
      const { getEstablishmentByPrinterApiKey, registerPrinterDevice } = await import("../db");
      const result = await getEstablishmentByPrinterApiKey(apiKey);
      if (!result) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }

      const { establishmentId } = result;
      const { deviceName, deviceId, deviceModel, platform, ipAddress } = req.body;

      if (!deviceName || !deviceId) {
        res.status(400).json({ error: "deviceName and deviceId are required" });
        return;
      }

      // Registrar ou atualizar o dispositivo
      const registration = await registerPrinterDevice({
        establishmentId,
        deviceName: String(deviceName).substring(0, 255),
        deviceId: String(deviceId).substring(0, 128),
        deviceModel: deviceModel ? String(deviceModel).substring(0, 128) : undefined,
        platform: platform ? String(platform).substring(0, 20) : undefined,
        ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : undefined,
      });

      logger.info(`[Printer Register] Device ${registration.isNew ? 'registered' : 'updated'}: ${deviceName} (${deviceId}) for establishment ${establishmentId}`);

      res.json({
        success: true,
        printerId: registration.id,
        isNew: registration.isNew,
        establishmentId,
        message: registration.isNew 
          ? "Impressora registrada com sucesso" 
          : "Impressora atualizada com sucesso",
      });
    } catch (error) {
      logger.error("[Printer Register] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint para verificar status da conex\u00e3o da impressora (healthcheck)
  app.get("/api/printer/status", async (req, res) => {
    try {
      const apiKey = req.query.key as string;
      
      if (!apiKey) {
        res.status(401).json({ error: "API key required" });
        return;
      }
      
      const { getEstablishmentByPrinterApiKey, getPrinterSettings: getPSettings, getEstablishmentById: getEstById } = await import("../db");
      const result = await getEstablishmentByPrinterApiKey(apiKey);
      
      if (!result) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      
      const establishment = await getEstById(result.establishmentId);
      const settings = await getPSettings(result.establishmentId);
      
      res.json({
        ok: true,
        establishmentId: result.establishmentId,
        establishmentName: establishment?.name || "Desconhecido",
        autoPrintEnabled: settings?.autoPrintEnabled || false,
        printOnNewOrder: settings?.printOnNewOrder || false,
        paperWidth: (settings as any)?.mindiPaperWidth || settings?.paperWidth || "80mm",
        htmlPrintEnabled: (settings as any)?.mindiHtmlPrintEnabled ?? settings?.htmlPrintEnabled ?? true,
        beepOnPrint: (settings as any)?.mindiBeepOnPrint ?? settings?.beepOnPrint ?? false,
        activeConnections: getPrinterConnectionCount(result.establishmentId),
      });
    } catch (error) {
      logger.error("[SSE-Printer] Erro no status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint para buscar recibo de pedido via API key (para app de impressora)
  // URL: /api/printer/receipt/:orderId?key={printerApiKey}
  // Também suporta: /api/printer/receipt/:orderId?key={apiKey}&format=text (para ESC/POS)
  app.get("/api/printer/receipt/:orderId", async (req, res) => {
    try {
    console.log("[RECEIPT-ENDPOINT] HIT! orderId=", req.params.orderId, "key=", req.query.key);
    logger.info("[Printer-Receipt] *** ENDPOINT HIT *** orderId=" + req.params.orderId + " format=" + req.query.format);
      const apiKey = req.query.key as string;
      const format = req.query.format as string; // 'text' para ESC/POS, default HTML
      
      if (!apiKey) {
        res.status(401).json({ error: "API key required. Use ?key=YOUR_API_KEY" });
        return;
      }
      
      const { getEstablishmentByPrinterApiKey } = await import("../db");
      const result = await getEstablishmentByPrinterApiKey(apiKey);
      
      if (!result) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "ID do pedido inv\u00e1lido" });
        return;
      }
      
      // Verificar se é um recibo de caixa do cache temporário (IDs >= 900000000)
      if (orderId >= 900000000) {
        const cached = getCashReceiptFromCache(orderId);
        if (!cached) {
          res.status(404).json({ error: "Recibo de caixa expirado ou não encontrado" });
          return;
        }
        // Verificar se pertence ao estabelecimento correto
        if (cached.establishmentId !== result.establishmentId) {
          res.status(403).json({ error: "Recibo não pertence a este estabelecimento" });
          return;
        }
        // Gerar HTML do recibo de caixa usando o MESMO template do recibo de pedido
        const rd = cached.data;
        const formatCurrencyRaw = (val: number) => `R$ ${val.toFixed(2).replace(".", ",")}`;
        const formatDateBR = (dateStr: string | null) => {
          if (!dateStr) return "—";
          const d = new Date(dateStr);
          return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        };
        
        // Montar itens fake para usar o generateReceiptHTML
        const fakeItems: any[] = [];
        
        // Info do turno
        fakeItems.push({
          productName: `Operador: ${rd.operatorName}`,
          quantity: 1,
          totalPrice: 0,
          notes: `Abertura: ${formatDateBR(rd.openedAt)} | Fechamento: ${formatDateBR(rd.closedAt)}`,
          complements: null,
        });
        
        // Fundo de caixa
        fakeItems.push({
          productName: `Fundo de Caixa`,
          quantity: 1,
          totalPrice: rd.openingAmount,
          notes: null,
          complements: null,
        });
        
        // Breakdown de pagamentos
        if (rd.paymentBreakdown && rd.paymentBreakdown.length > 0) {
          for (const p of rd.paymentBreakdown) {
            fakeItems.push({
              productName: `${p.method}`,
              quantity: p.count,
              totalPrice: p.total,
              notes: null,
              complements: null,
            });
          }
        }
        
        // Movimentações
        if (rd.movements && rd.movements.length > 0) {
          for (const m of rd.movements) {
            fakeItems.push({
              productName: `${m.type}`,
              quantity: 1,
              totalPrice: parseFloat(m.amount) || 0,
              notes: m.reason || null,
              complements: null,
            });
          }
        }
        
        // Criar um "pedido" fake com os dados do caixa
        const fakeOrder = {
          orderNumber: 'CAIXA',
          createdAt: rd.closedAt || new Date().toISOString(),
          deliveryType: 'pickup',
          customerName: rd.operatorName,
          customerPhone: null,
          customerAddress: null,
          paymentMethod: 'cash',
          subtotal: rd.salesTotal.toFixed(2),
          deliveryFee: '0',
          discount: '0',
          total: rd.closingAmount.toFixed(2),
          notes: null,
          changeAmount: null,
          source: 'mindi',
          isScheduled: false,
          neighborhood: null,
          addressComplement: null,
          couponCode: null,
          externalData: null,
          externalDisplayId: null,
        };
        
        const establishment = await getEstablishmentById(cached.establishmentId);
        const settings = await getPrinterSettings(cached.establishmentId);
        
        // Para recibos de caixa, SEMPRE usar ESC/POS (texto puro) independente do mindiHtmlPrintEnabled
        // O generateCashReceiptText produz um recibo formatado profissionalmente
        const useEscPos = true;
        
        if (useEscPos) {
          // Gerar recibo de caixa em texto puro ESC/POS com função dedicada
          const { generateCashReceiptText } = await import('../escpos');
          const textReceipt = generateCashReceiptText(
            rd,
            establishment,
            ((settings as any)?.mindiPaperWidth || settings?.paperWidth || '80mm') as '58mm' | '80mm'
          );
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.send(textReceipt);
        } else {
          // Usar o mesmo generateReceiptHTML com isMindi=true
          const html = generateReceiptHTML(fakeOrder, fakeItems, establishment, settings, true);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.send(html);
        }
        logger.info(`[Printer-Receipt] Recibo de caixa (cache ID ${orderId}) enviado para estabelecimento ${result.establishmentId} (modo: ${useEscPos ? 'texto' : 'html'})`);
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: "Pedido n\u00e3o encontrado" });
        return;
      }
      
      // Verificar se o pedido pertence ao estabelecimento da API key
      if (order.establishmentId !== result.establishmentId) {
        res.status(403).json({ error: "Pedido n\u00e3o pertence a este estabelecimento" });
        return;
      }
      
      const orderItemsList = await getOrderItems(orderId);
      const establishment = await getEstablishmentById(order.establishmentId);
      const settings = await getPrinterSettings(order.establishmentId);
      
      // Verificar se deve usar ESC/POS ou HTML (usa configurações Mindi para este endpoint)
      const mindiHtmlEnabled = (settings as any)?.mindiHtmlPrintEnabled ?? settings?.htmlPrintEnabled ?? true;
      const useEscPos = format === 'text' || mindiHtmlEnabled === false;
      
      if (useEscPos) {
        const { generatePlainTextReceipt } = await import('../escpos');
        
        const orderData = {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          deliveryType: order.deliveryType as 'delivery' | 'pickup' | 'dine_in',
          customerName: order.customerName || undefined,
          customerPhone: order.customerPhone || undefined,
          address: order.customerAddress || undefined,
          paymentMethod: order.paymentMethod || undefined,
          changeFor: order.changeAmount ? parseFloat(order.changeAmount) : undefined,
          items: orderItemsList.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: parseFloat(item.totalPrice as any) || 0,
            notes: item.notes || undefined,
            complements: item.complements || undefined,
          })),
          subtotal: parseFloat(order.subtotal as any) || 0,
          deliveryFee: order.deliveryFee ? parseFloat(order.deliveryFee as any) : undefined,
          discount: order.discount ? parseFloat(order.discount as any) : undefined,
          total: parseFloat(order.total as any) || 0,
        };
        
        const textReceipt = generatePlainTextReceipt(
          orderData,
          establishment,
          ((settings as any)?.mindiPaperWidth || settings?.paperWidth || '80mm') as '58mm' | '80mm'
        );
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(textReceipt);
      } else {
        const html = generateReceiptHTML(order, orderItemsList, establishment, settings, true);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      }
      
      logger.info(`[Printer-Receipt] Recibo do pedido ${orderId} enviado para estabelecimento ${result.establishmentId}`);
    } catch (error) {
      logger.error("[Printer-Receipt] Erro ao gerar recibo:", error);
      res.status(500).json({ error: "Erro ao gerar recibo" });
    }
  });

  // iFood Webhook endpoint — MOVED to before express.json() (see above)

  // ─── Telegram Bot Webhook ───────────────────────────────────
  // Recebe updates do Telegram Bot API e responde ao /start com o chat_id
  app.post("/api/telegram/webhook", express.json(), async (req, res) => {
    try {
      const update = req.body;
      
      // Processar apenas mensagens de texto
      const message = update?.message;
      if (!message?.text || !message?.chat?.id) {
        return res.status(200).json({ ok: true });
      }

      const chatId = message.chat.id.toString();
      const text = message.text.trim();
      const firstName = message.from?.first_name || "";

      // Responder ao comando /start
      if (text === "/start" || text === "/start@Mindi_pedidos_bot") {
        const token = ENV.telegramBotToken;
        if (token) {
          const replyText =
            `\u{1F44B} <b>Ol\u00e1${firstName ? `, ${firstName}` : ""}! Bem-vindo ao Mindi Bot.</b>\n\n` +
            `Seu <b>Chat ID</b> \u00e9:\n\n` +
            `<code>${chatId}</code>\n\n` +
            `\u{1F4CB} <b>Como configurar:</b>\n` +
            `1\u20E3 Copie o n\u00famero acima\n` +
            `2\u20E3 Acesse o painel do Mindi\n` +
            `3\u20E3 V\u00e1 em <b>Configura\u00e7\u00f5es > Integra\u00e7\u00f5es > Telegram</b>\n` +
            `4\u20E3 Cole o Chat ID e clique em <b>Conectar</b>\n\n` +
            `\u2705 Pronto! Voc\u00ea receber\u00e1 notifica\u00e7\u00f5es de novos pedidos aqui.`;

          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
              parse_mode: "HTML",
            }),
          });
          logger.info(`[Telegram Bot] Respondeu /start para chat ${chatId} (${firstName})`);
        }
      }

      // Responder ao comando /chatid
      if (text === "/chatid" || text === "/chatid@Mindi_pedidos_bot") {
        const token = ENV.telegramBotToken;
        if (token) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `\u{1F194} Seu <b>Chat ID</b> \u00e9: <code>${chatId}</code>`,
              parse_mode: "HTML",
            }),
          });
        }
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("[Telegram Bot] Erro no webhook:", error);
      res.status(200).json({ ok: true }); // Sempre 200 para o Telegram
    }
  });

  // Bot API (REST endpoints para integração n8n / WhatsApp bots)
  app.use("/api/bot", createBotApiRouter());

  // Report export endpoints (PDF / Excel)
  app.use("/api/export", createReportExportRouter());
  app.use("/api/reports", createReportExportRouter());

  // ─── CSRF Protection para tRPC ───────────────────────────────────
  // Valida Origin/Referer para prevenir ataques CSRF em mutations
  const ALLOWED_ORIGINS = [
    "https://mindi.com.br",
    "https://app.mindi.com.br",
    "https://v2.mindi.com.br",
    "https://mindi.manus.space",
    "https://cardapio-dash-enmwmxpa.manus.space",
  ];
  app.use("/api/trpc", (req, res, next) => {
    // GET requests (queries) são seguros contra CSRF
    if (req.method === "GET") return next();
    // Para mutations (POST), validar Origin ou Referer
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    // Em desenvolvimento local, permitir localhost
    const isLocal = origin?.includes("localhost") || origin?.includes("127.0.0.1") || referer?.includes("localhost") || referer?.includes("127.0.0.1");
    if (isLocal) return next();
    // Permitir requisições do mesmo domínio (Cloud Run, preview URLs)
    const host = req.headers.host;
    if (origin && host && new URL(origin).host === host) return next();
    // Verificar contra lista de domínios permitidos
    if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) return next();
    if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))) return next();
    // Se não tem Origin nem Referer (ex: curl, Postman), permitir para não quebrar ferramentas de debug
    if (!origin && !referer) return next();
    // Origin desconhecido — bloquear
    logger.warn(`[CSRF] Blocked request from origin: ${origin || referer}`);
    res.status(403).json({ error: "Forbidden: invalid origin" });
  });

  // Desabilitar cache HTTP para respostas da API tRPC
  app.use("/api/trpc", (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // ─── Scheduled Task: Plan Renewals ───────────────────────────────────
  app.post("/api/scheduled/plan-renewals", express.json(), async (req, res) => {
    try {
      // Autenticação preferencial por token interno para cron/rotinas agendadas.
      // Mantém compatibilidade com sessão apenas para chamadas manuais já existentes.
      const authHeader = String(req.headers.authorization || "");
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const headerToken = String(req.headers["x-scheduled-task-token"] || "").trim();
      const suppliedScheduledToken = bearerToken || headerToken;
      const hasValidScheduledToken = Boolean(
        ENV.scheduledTaskToken &&
        suppliedScheduledToken &&
        suppliedScheduledToken === ENV.scheduledTaskToken
      );

      if (!hasValidScheduledToken) {
        const token = req.cookies?.app_session_id;
        if (!token) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const { sdk } = await import("./sdk");
        const payload = await sdk.verifySession(token);
        if (!payload) {
          return res.status(401).json({ error: "Invalid token" });
        }
      }

      const planSubDb = await import("../planSubscriptionDb");
      const dbModule = await import("../db");
      const adminDb = await import("../adminDb");
      const { createPixTransaction, createCardTransactionWithToken } = await import("../paytime");
      const whatsappDb = await import("../platformWhatsappDb");
      const emailModule = await import("../email");

      const results = {
        renewed: 0,
        pixGenerated: 0,
        expired: 0,
        whatsappSent: 0,
        emailsSent: 0,
        errors: [] as string[],
      };

      const formatCurrency = (amountCents: number) => (amountCents / 100).toFixed(2).replace(".", ",");
      const formatDate = (date: Date) => date.toLocaleDateString("pt-BR");
      const getBillingPeriodLabel = (billingPeriod: string | null | undefined) => billingPeriod === "annual" ? "Anual" : "Mensal";

      // Helper: send WhatsApp notification via platform WhatsApp / Uazapi.
      // Prioridade segue o fluxo de pagamento confirmado: responsiblePhone > whatsapp.
      const sendWhatsappNotification = async (
        phone: string | null | undefined,
        message: string,
        context: string,
      ) => {
        if (!phone) return false;
        try {
          const result = await whatsappDb.sendPlatformWhatsappMessage(phone, message);
          if (result.success) {
            results.whatsappSent++;
            return true;
          }
          logger.warn(`[PlanRenewals] WhatsApp não enviado (${context}): ${result.message || "erro desconhecido"}`);
          return false;
        } catch (err: any) {
          logger.warn(`[PlanRenewals] WhatsApp send failed (${context}): ${err.message}`);
          return false;
        }
      };

      const sendWhatsappImageNotification = async (
        phone: string | null | undefined,
        base64: string,
        context: string,
      ) => {
        if (!phone) return false;
        try {
          const result = await whatsappDb.sendPlatformWhatsappImage(phone, base64);
          if (result.success) {
            results.whatsappSent++;
            return true;
          }
          logger.warn(`[PlanRenewals] WhatsApp imagem não enviada (${context}): ${result.message || "erro desconhecido"}`);
          return false;
        } catch (err: any) {
          logger.warn(`[PlanRenewals] WhatsApp image send failed (${context}): ${err.message}`);
          return false;
        }
      };

      const sendRenewalEmail = async (params: {
        establishment: any;
        planName: string;
        billingPeriod: string;
        amount: string;
        dueDate: string;
        paymentMethod: "PIX" | "Cartão de Crédito";
        status: "pix_generated" | "card_declined";
        pixEmv?: string | null;
        context: string;
      }) => {
        try {
          const user = params.establishment?.userId
            ? await dbModule.getUserById(params.establishment.userId)
            : null;
          const recipientEmail = params.establishment?.representativeEmail || params.establishment?.email || user?.email;
          if (!recipientEmail) {
            logger.info(`[PlanRenewals] Sem e-mail cadastrado para cobrança: est=${params.establishment?.id || "unknown"}, context=${params.context}`);
            return false;
          }

          const recipientName = params.establishment?.representativeName || params.establishment?.responsibleName || user?.name || params.establishment?.name || "";
          await emailModule.sendEmail({
            to: [{ email: recipientEmail, name: recipientName || undefined }],
            subject: params.status === "pix_generated"
              ? `Renovação da assinatura - ${params.establishment.name}`
              : `Ação necessária: renovação da assinatura - ${params.establishment.name}`,
            html: emailModule.buildPlanRenewalEmail({
              recipientName,
              establishmentName: params.establishment.name,
              planName: params.planName,
              billingPeriod: params.billingPeriod,
              amount: params.amount,
              dueDate: params.dueDate,
              paymentMethod: params.paymentMethod,
              status: params.status,
              pixEmv: params.pixEmv,
            }),
            tags: ["plan-renewal", params.status],
          });
          results.emailsSent++;
          logger.info(`[PlanRenewals] E-mail de cobrança enviado: est=${params.establishment.id}, to=${recipientEmail}, context=${params.context}`);
          return true;
        } catch (err: any) {
          logger.warn(`[PlanRenewals] Falha ao enviar e-mail de cobrança (${params.context}): ${err.message}`);
          return false;
        }
      };

      // Helper: get plan display name
      const getPlanDisplayName = async (planId: string): Promise<string> => {
        try {
          const db = await dbModule.getDb();
          if (!db) return planId;
          const { planPrices } = await import("../../drizzle/schema");
          const { eq: eqOp } = await import("drizzle-orm");
          const rows = await db.select().from(planPrices).where(eqOp(planPrices.planId, planId)).limit(1);
          return rows[0]?.displayName || planId;
        } catch { return planId; }
      };

      // Helper: renewal charges must use the current configured plan price, not
      // the historical amount stored on the subscription when it was created.
      const getCurrentRenewalAmountCents = async (sub: {
        discountPercent?: number | null;
        discountUntil?: Date | null;
        discountMonthsRemaining?: number | null;
        id: number;
        establishmentId: number;
        planId: string;
        billingPeriod?: string | null;
        amountCents: number;
      }): Promise<number> => {
        try {
          const planPrice = await adminDb.getPlanPrice(sub.planId);
          const currentAmountCents = sub.billingPeriod === "annual"
            ? planPrice?.annualPriceCents
            : planPrice?.monthlyPriceCents;
          const numericAmountCents = Number(currentAmountCents);

          if (Number.isFinite(numericAmountCents) && numericAmountCents > 0) {
            if (numericAmountCents !== sub.amountCents) {
              logger.info(`[PlanRenewals] Valor vigente do plano aplicado: sub=${sub.id}, est=${sub.establishmentId}, plan=${sub.planId}, period=${sub.billingPeriod || "monthly"}, old=${sub.amountCents}, current=${numericAmountCents}`);
            }
            return numericAmountCents;
          }

          logger.warn(`[PlanRenewals] Preço vigente inválido/indisponível; usando valor gravado: sub=${sub.id}, est=${sub.establishmentId}, plan=${sub.planId}`);
        } catch (err: any) {
          logger.warn(`[PlanRenewals] Falha ao consultar preço vigente; usando valor gravado: sub=${sub.id}, est=${sub.establishmentId}, plan=${sub.planId}, error=${err.message}`);
        }

        return sub.amountCents;
      };

      // 1. Process subscriptions due for renewal
      const dueSubscriptions = await planSubDb.getSubscriptionsDueForRenewal();
      
      for (const sub of dueSubscriptions) {
        try {
          const renewalAmountCents = await getCurrentRenewalAmountCents(sub);

          // Apply retention discount if active
          let finalRenewalAmountCents = renewalAmountCents;
          if (sub.discountPercent && sub.discountPercent > 0 && sub.discountUntil && new Date(sub.discountUntil) > new Date()) {
            finalRenewalAmountCents = Math.round(renewalAmountCents * (1 - sub.discountPercent / 100));
            const newMonthsRemaining = Math.max(0, (sub.discountMonthsRemaining || 0) - 1);
            await planSubDb.updateSubscriptionById(sub.id, {
              discountMonthsRemaining: newMonthsRemaining,
              ...(newMonthsRemaining === 0 ? { discountPercent: 0, discountUntil: null } : {}),
            });
            logger.info(`[PlanRenewals] Desconto de retenção aplicado: sub=${sub.id}, original=${renewalAmountCents}, final=${finalRenewalAmountCents}, discount=${sub.discountPercent}%, mesesRestantes=${newMonthsRemaining}`);
          }

          if (sub.gateway === "paytime_card" && sub.paytimeCardToken) {
            // Auto-charge tokenized card
            const referenceId = `renewal_${sub.id}_${Date.now()}`;
            const tx = await createCardTransactionWithToken({
              amount: finalRenewalAmountCents,
              cardToken: sub.paytimeCardToken,
              interest: "STORE",
              reference_id: referenceId,
              sub_establishment_id: "366140",
              info_additional: [
                { key: "plan_id", value: sub.planId },
                { key: "establishment_id", value: String(sub.establishmentId) },
                { key: "type", value: "plan_renewal" },
                { key: "subscription_id", value: String(sub.id) },
              ],
            });

            if (tx.status === "APPROVED" || tx.status === "PAID") {
              const now = new Date();
              const periodEnd = new Date(now);
              if (sub.billingPeriod === "annual") {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
              } else {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
              }

              await planSubDb.activateSubscription(sub.id, {
                paytimeTransactionId: tx._id,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                nextRenewalAt: periodEnd,
                amountCents: finalRenewalAmountCents,
              });

              await dbModule.activatePlan(sub.establishmentId, sub.planId as any, {
                billingPeriod: sub.billingPeriod as any,
                planExpiresAt: periodEnd,
              });

              // Send WhatsApp: plan renewed successfully
              const est = await dbModule.getEstablishmentById(sub.establishmentId);
              const notificationPhone = est?.responsiblePhone || est?.whatsapp;
              if (est && notificationPhone) {
                const planName = await getPlanDisplayName(sub.planId);
                const config = await whatsappDb.getPlatformWhatsappConfig();
                const msg = whatsappDb.generatePlanActivatedMessage(
                  config?.templatePlanActivated || null,
                  {
                    establishmentName: est.name,
                    planName,
                    expiresAt: formatDate(periodEnd),
                  }
                );
                await sendWhatsappNotification(notificationPhone, msg, `renewed:${sub.id}`);
              }

              results.renewed++;
            } else {
              // Card declined - mark as past_due with 2 day grace
              const gracePeriodEnd = new Date();
              gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2);
              await planSubDb.markSubscriptionPastDue(sub.id, gracePeriodEnd, undefined, undefined, finalRenewalAmountCents);
              await planSubDb.incrementRenewalAttempts(sub.id, `Card declined: ${tx.status}`);

              // Send WhatsApp and e-mail: card declined, plan expiring
              const est = await dbModule.getEstablishmentById(sub.establishmentId);
              if (est) {
                const planName = await getPlanDisplayName(sub.planId);
                const amount = formatCurrency(finalRenewalAmountCents);
                const dueDate = formatDate(gracePeriodEnd);
                const config = await whatsappDb.getPlatformWhatsappConfig();
                const msg = whatsappDb.generateRenewalMessage(
                  config?.templateRenewalCard || config?.templatePlanExpiring || null,
                  {
                    establishmentName: est.name,
                    planName,
                    amount,
                    dueDate,
                  }
                );
                await sendWhatsappNotification(est.responsiblePhone || est.whatsapp, msg, `card_declined:${sub.id}`);
                await sendRenewalEmail({
                  establishment: est,
                  planName,
                  billingPeriod: getBillingPeriodLabel(sub.billingPeriod),
                  amount,
                  dueDate,
                  paymentMethod: "Cartão de Crédito",
                  status: "card_declined",
                  context: `card_declined:${sub.id}`,
                });
              }

              results.errors.push(`Sub ${sub.id}: card declined (${tx.status})`);
            }
          } else if (sub.gateway === "paytime_pix") {
            // Generate new PIX for renewal
            const referenceId = `renewal_pix_${sub.id}_${Date.now()}`;
            const pixTx = await createPixTransaction({
              amount: finalRenewalAmountCents,
              interest: "STORE",
              reference_id: referenceId,
              sub_establishment_id: "366140",
              info_additional: [
                { key: "plan_id", value: sub.planId },
                { key: "establishment_id", value: String(sub.establishmentId) },
                { key: "type", value: "plan_renewal" },
                { key: "subscription_id", value: String(sub.id) },
              ],
            });

            if (!pixTx.emv) {
              throw new Error("Código PIX indisponível na resposta da Paytime");
            }

            const qrCodeBase64 = await QRCode.toDataURL(pixTx.emv, {
              errorCorrectionLevel: "M",
              type: "image/png",
              margin: 2,
              // Mantém legibilidade do PIX e reduz o payload de mídia no WhatsApp.
              width: 384,
            });

            // Mark as past_due with 2 day grace, save PIX EMV
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2);
            await planSubDb.markSubscriptionPastDue(
              sub.id,
              gracePeriodEnd,
              pixTx.emv,
              pixTx._id,
              finalRenewalAmountCents,
            );

            // Send WhatsApp and e-mail: PIX renewal notification split into 4 WhatsApp messages.
            const est = await dbModule.getEstablishmentById(sub.establishmentId);
            if (est) {
              const planName = await getPlanDisplayName(sub.planId);
              const amount = formatCurrency(finalRenewalAmountCents);
              const dueDate = formatDate(gracePeriodEnd);
              const notificationPhone = est.responsiblePhone || est.whatsapp;
              const pixMessages = whatsappDb.generateRenewalPixMessageParts({
                establishmentName: est.name,
                planName,
                amount,
                dueDate,
                pixEmv: pixTx.emv,
              });

              await sendWhatsappNotification(notificationPhone, pixMessages.introMessage, `pix_intro:${sub.id}`);
              await sendWhatsappImageNotification(notificationPhone, qrCodeBase64, `pix_qrcode:${sub.id}`);
              await sendWhatsappNotification(notificationPhone, pixMessages.pixCodeMessage, `pix_code:${sub.id}`);
              await sendWhatsappNotification(notificationPhone, pixMessages.closingMessage, `pix_closing:${sub.id}`);
              await sendRenewalEmail({
                establishment: est,
                planName,
                billingPeriod: getBillingPeriodLabel(sub.billingPeriod),
                amount,
                dueDate,
                paymentMethod: "PIX",
                status: "pix_generated",
                pixEmv: pixTx.emv || "",
                context: `pix:${sub.id}`,
              });
            }

            results.pixGenerated++;
          }
        } catch (err: any) {
          results.errors.push(`Sub ${sub.id}: ${err.message}`);
          await planSubDb.incrementRenewalAttempts(sub.id, err.message);
        }
      }

      // 2. Expire subscriptions past grace period
      const expiredSubs = await planSubDb.getSubscriptionsInGracePeriod();
      for (const sub of expiredSubs) {
        try {
          await planSubDb.cancelSubscription(sub.id);
          // Inadimplência automática não deve migrar o estabelecimento para o plano gratuito.
          // O planType/billingPeriod/planExpiresAt atuais são preservados para manter o
          // Check if establishment has another active subscription before sending notification
          const otherActiveSub = await planSubDb.getActiveSubscription(sub.establishmentId);
          if (otherActiveSub && otherActiveSub.id !== sub.id) {
            // Establishment already has another active subscription - skip notification
            logger.info(`[PlanRenewals] Sub ${sub.id} expired but establishment ${sub.establishmentId} has active sub ${otherActiveSub.id} - skipping deactivation notification`);
            results.expired++;
            continue;
          }
          // histórico do plano contratado; o bloqueio é exibido pelo estado da assinatura.

          // Send WhatsApp: plan deactivated
          const est = await dbModule.getEstablishmentById(sub.establishmentId);
          const notificationPhone = est?.responsiblePhone || est?.whatsapp;
          if (est && notificationPhone) {
            const planName = await getPlanDisplayName(sub.planId);
            const config = await whatsappDb.getPlatformWhatsappConfig();
            const msg = whatsappDb.generatePlanDeactivatedMessage(
              config?.templatePlanDeactivated || null,
              {
                establishmentName: est.name,
                planName,
              }
            );
            await sendWhatsappNotification(notificationPhone, msg, `expired:${sub.id}`);
          }

          results.expired++;
        } catch (err: any) {
          results.errors.push(`Expire sub ${sub.id}: ${err.message}`);
        }
      }


      // 3. Expire canceling subscriptions past cancelAt date
      const dbInstance = await (await import("../db")).getDb();
      if (dbInstance) {
        const { planSubscriptions } = await import("../../drizzle/schema");
        const { eq, and, lte } = await import("drizzle-orm");
        const cancelingSubs = await dbInstance.select().from(planSubscriptions)
          .where(and(
            eq(planSubscriptions.status, "canceling"),
            lte(planSubscriptions.cancelAt, new Date())
          ));
        for (const cancelSub of cancelingSubs) {
          try {
            await planSubDb.updateSubscriptionStatus(cancelSub.id, "canceled");
            await dbModule.deactivatePlan(cancelSub.establishmentId);
            logger.info(`[PlanRenewals] Canceling sub ${cancelSub.id} expired (cancelAt reached), now canceled`);
            results.expired++;
          } catch (err: any) {
            results.errors.push(`Cancel-expire sub ${cancelSub.id}: ${err.message}`);
          }
        }
      }

      // 4. Send reactivation emails to canceled subscribers (15d and 30d after cancel)
      try {
        const { processReactivationEmails } = await import("../reactivationEmails");
        const reactivationResult = await processReactivationEmails();
        if (reactivationResult.sent15Days > 0 || reactivationResult.sent30Days > 0) {
          results.emailsSent += reactivationResult.sent15Days + reactivationResult.sent30Days;
        }
      } catch (reactivationErr: any) {
        logger.warn(`[PlanRenewals] Reactivation emails error: ${reactivationErr.message}`);
      }
      logger.info(`[PlanRenewals] Processed: renewed=${results.renewed}, pixGenerated=${results.pixGenerated}, expired=${results.expired}, whatsappSent=${results.whatsappSent}, emailsSent=${results.emailsSent}, errors=${results.errors.length}`);
      return res.json({ success: true, results });
    } catch (err: any) {
      logger.error(`[PlanRenewals] Error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── SEO: Dynamic meta tags, sitemap.xml, robots.txt ───────────────
  const { createSEOMiddleware, generateSitemap, generateRobotsTxt } = await import("../seo");

  // Canonical domain for SEO (sitemap, robots.txt, OG tags)
  // Always use the primary domain to prevent crawlers from indexing Cloud Run or other internal URLs
  const CANONICAL_DOMAIN = "https://app.mindi.com.br";

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = CANONICAL_DOMAIN;
    res.type("text/plain").send(generateRobotsTxt(baseUrl));
  });

  // Sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = CANONICAL_DOMAIN;
    const sitemap = await generateSitemap(baseUrl);
    res.type("application/xml").send(sitemap);
  });

  // Dynamic OG image generation for /menu/:slug
  const { registerOGImageRoute } = await import("../og-image");
  registerOGImageRoute(app);

  // SEO-friendly menu page endpoint (bypasses Manus proxy OG injection)
  // This endpoint serves a minimal HTML page with proper OG tags for crawlers.
  // Real users get redirected to the SPA menu page via meta refresh + JS redirect.
  const { generateMenuPageHTML } = await import("../seo");
  app.get("/api/menu/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        return res.status(400).send("Slug is required");
      }

      const baseUrl = CANONICAL_DOMAIN;
      const menuUrl = `${baseUrl}/menu/${slug}`;

      const produtoParam = req.query.produto || req.query.product;
      const productId = produtoParam ? parseInt(String(produtoParam), 10) : undefined;
      const validProductId = productId && !isNaN(productId) ? productId : undefined;

      const userAgent = (req.headers["user-agent"] || "").toLowerCase();
      const crawlerPatterns = [
        "whatsapp", "facebookexternalhit", "facebot", "twitterbot",
        "telegrambot", "linkedinbot", "slackbot", "discordbot",
        "googlebot", "bingbot", "yandexbot", "baiduspider",
        "duckduckbot", "applebot", "pinterestbot", "redditbot",
        "embedly", "quora link preview", "outbrain", "rogerbot",
        "showyoubot", "vkshare", "w3c_validator", "tumblr",
        "bitlybot", "flipboard", "seznambot", "skypeuripreview",
      ];
      const isCrawler = crawlerPatterns.some((pattern) => userAgent.includes(pattern));

      if (!isCrawler) {
        const redirectUrl = validProductId ? `${menuUrl}?produto=${validProductId}` : menuUrl;
        return res.redirect(302, redirectUrl);
      }

      const html = await generateMenuPageHTML(slug, baseUrl, menuUrl, validProductId, isCrawler);
      if (!html) {
        return res.redirect(302, menuUrl);
      }

      const cacheTime = validProductId ? 1800 : 3600;
      res.status(200).set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
      }).send(html);
    } catch (error) {
      logger.error("[SEO] Error generating menu page:", error);
      const menuUrl = `/menu/${req.params.slug}`;
      res.redirect(302, menuUrl);
    }
  });

  // SEO middleware for /menu/:slug (injects meta tags into HTML)
  app.use(createSEOMiddleware());

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Iniciar job de processamento de campanhas agendadas
    startScheduledCampaignJob();
    
    // Iniciar job de processamento de pedidos agendados (move para fila automaticamente)
    startScheduledOrdersJob();
    
    // Iniciar job de processamento de despesas recorrentes (gera lançamentos automáticos)
    startRecurringExpensesJob();

    // Iniciar job de status automáticos de pedidos (cancelamento/finalização por tempo)
    startAutomaticOrderStatusJob();
    // Iniciar job de lembretes de abertura/fechamento de caixa
    startCashReminderJob();

    // Iniciar infraestrutura iFood exigida para homologação: fallback de eventos e limpeza de deduplicação.
    startCleanupJob();

    if (ENV.ifoodClientId && ENV.ifoodClientSecret) {
      startEventPolling(async (event) => {
        const { processIfoodWebhookEvent } = await import('../ifood');
        await processIfoodWebhookEvent(event, { acknowledge: false });
      });
    } else {
      logger.warn('[iFood Polling] Not started because IFOOD_CLIENT_ID/IFOOD_CLIENT_SECRET are not configured');
    }

    // Iniciar job de fallback de webhooks Paytime (verifica transações PENDING)
    import("../paytimeFallback").then(mod => {
      mod.startPaytimeFallbackJob();
    }).catch(err => {
      console.error("[Paytime Fallback] Erro ao importar módulo de fallback:", err);
    });
  });
}

startServer().catch(console.error);
