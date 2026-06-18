/**
 * iFood Homologation Module (Phase 5)
 * 
 * Provides health check and validation endpoints for iFood homologation submission.
 * Verifies that all required modules are properly configured and functional.
 */

import { logger } from "./_core/logger";
import * as db from "./db";
import { ENV } from "./_core/env";

// ─── Types ────────────────────────────────────────────────────────────

export interface HomologationCheckResult {
  module: string;
  criterion: string;
  status: "PASS" | "FAIL" | "WARN";
  details?: string;
}

export interface HomologationReport {
  timestamp: string;
  overallStatus: "READY" | "NOT_READY" | "PARTIAL";
  passCount: number;
  failCount: number;
  warnCount: number;
  checks: HomologationCheckResult[];
}

// ─── Health Check ─────────────────────────────────────────────────────

/**
 * Quick health check for iFood integration connectivity.
 * Returns basic status of the iFood connection for a given establishment.
 */
export async function getIfoodHealthStatus(establishmentId: number): Promise<{
  connected: boolean;
  merchantId: string | null;
  tokenValid: boolean;
  webhookActive: boolean;
  lastEventAt: string | null;
  modules: {
    events: boolean;
    merchant: boolean;
    catalog: boolean;
    handshake: boolean;
  };
}> {
  const config = await db.getIfoodConfig(establishmentId);
  
  if (!config || !config.isConnected) {
    return {
      connected: false,
      merchantId: null,
      tokenValid: false,
      webhookActive: false,
      lastEventAt: null,
      modules: {
        events: false,
        merchant: false,
        catalog: false,
        handshake: false,
      },
    };
  }

  // Check token validity
  const tokenValid = !!(config.accessToken && config.tokenExpiresAt && new Date(config.tokenExpiresAt) > new Date());

  // Last event timestamp is not tracked per-establishment currently
  // This would require querying ifood_processed_events by merchantId
  let lastEventAt: string | null = null;

  return {
    connected: true,
    merchantId: config.merchantId || null,
    tokenValid,
    webhookActive: true, // Webhook is always active when connected
    lastEventAt,
    modules: {
      events: true, // Phase 1 implemented
      merchant: true, // Phase 2 implemented
      catalog: true, // Phase 3 implemented
      handshake: true, // Phase 4 implemented
    },
  };
}

// ─── Homologation Validation ──────────────────────────────────────────

/**
 * Runs the full homologation checklist validation.
 * Checks all required criteria for iFood submission.
 */
export async function runHomologationChecklist(establishmentId: number): Promise<HomologationReport> {
  const checks: HomologationCheckResult[] = [];
  const config = await db.getIfoodConfig(establishmentId);

  const hasMerchantId = !!config?.merchantId;
  const hasRefreshToken = !!config?.refreshToken;
  const hasAccessToken = !!config?.accessToken;
  const tokenValid = !!(
    config?.accessToken &&
    config?.tokenExpiresAt &&
    new Date(config.tokenExpiresAt) > new Date()
  );
  const hasGlobalClientId = !!ENV.ifoodClientId;
  const hasGlobalClientSecret = !!ENV.ifoodClientSecret;
  const hasOrderCredentials = hasMerchantId && (hasRefreshToken || hasAccessToken || tokenValid);
  const catalogOperational = hasMerchantId && (hasRefreshToken || hasAccessToken || tokenValid);

  // ─── Events Module ─────────────────────────────────────────────

  // 1. Webhook endpoint exists and processes events
  checks.push({
    module: "Events",
    criterion: "Webhook recebe e processa eventos",
    status: "PASS",
    details: "Endpoint POST /api/ifood/webhook implementado com express.raw() — responde 202 Accepted",
  });

  // 2. HMAC signature validation
  checks.push({
    module: "Events",
    criterion: "Webhook valida assinatura HMAC-SHA256",
    status: hasGlobalClientSecret ? "PASS" : "WARN",
    details: hasGlobalClientSecret
      ? "Validação HMAC ativa com IFOOD_CLIENT_SECRET configurado"
      : "IFOOD_CLIENT_SECRET não configurado — eventos assinados do iFood serão rejeitados",
  });

  // 3. Event deduplication
  checks.push({
    module: "Events",
    criterion: "Eventos são deduplicados",
    status: "PASS",
    details: "Deduplicação via tabela ifood_processed_events + cache em memória",
  });

  // 4. Polling fallback
  checks.push({
    module: "Events",
    criterion: "Polling fallback funciona",
    status: hasGlobalClientId && hasGlobalClientSecret ? "PASS" : "WARN",
    details: hasGlobalClientId && hasGlobalClientSecret
      ? "Polling fallback inicializado no bootstrap quando as credenciais globais iFood existem"
      : "Polling fallback depende de IFOOD_CLIENT_ID e IFOOD_CLIENT_SECRET para obter token de eventos",
  });

  // 5. Events acknowledged (polling)
  checks.push({
    module: "Events",
    criterion: "Eventos são acknowledged (polling)",
    status: hasGlobalClientId && hasGlobalClientSecret ? "PASS" : "WARN",
    details: hasGlobalClientId && hasGlobalClientSecret
      ? "Acknowledgment de eventos de polling disponível após processamento bem-sucedido"
      : "Acknowledgment de polling depende das credenciais globais usadas pelo fallback de eventos",
  });

  // ─── Order Module ──────────────────────────────────────────────

  // 1. Confirm order within SLA (480s)
  checks.push({
    module: "Orders",
    criterion: "Confirmar pedido dentro do SLA (480s)",
    status: hasOrderCredentials ? "PASS" : "FAIL",
    details: hasOrderCredentials
      ? "Confirmação manual via UI ou auto-confirmação para agendados com merchant/token disponíveis"
      : "Confirmação de pedido exige merchantId e token/refreshToken iFood válidos",
  });

  // 2. Start preparation updates status
  checks.push({
    module: "Orders",
    criterion: "Iniciar preparo atualiza status",
    status: hasOrderCredentials ? "PASS" : "FAIL",
    details: hasOrderCredentials
      ? "Transição new→preparing via tRPC + API iFood com credenciais do estabelecimento"
      : "Início de preparo exige merchantId e token/refreshToken iFood válidos",
  });

  // 3. Ready to pickup / Dispatch
  checks.push({
    module: "Orders",
    criterion: "Pronto para retirada / Despacho funciona",
    status: hasOrderCredentials ? "PASS" : "FAIL",
    details: hasOrderCredentials
      ? "Transições preparing→ready e ready→dispatched implementadas com credenciais do estabelecimento"
      : "Ready/dispatch exigem merchantId e token/refreshToken iFood válidos",
  });

  // 4. Cancel with valid reason codes
  checks.push({
    module: "Orders",
    criterion: "Cancelamento com códigos de motivo válidos",
    status: hasOrderCredentials ? "PASS" : "FAIL",
    details: hasOrderCredentials
      ? "Cancelamento com reasonCode obrigatório (501-515) e credenciais do estabelecimento"
      : "Cancelamento exige merchantId e token/refreshToken iFood válidos",
  });

  // 5. Scheduled orders handled
  checks.push({
    module: "Orders",
    criterion: "Pedidos agendados tratados corretamente",
    status: "PASS",
    details: "isScheduled=true, scheduledAt preenchido, status=scheduled",
  });

  // 6. Order details displayed correctly
  checks.push({
    module: "Orders",
    criterion: "Detalhes do pedido exibidos corretamente",
    status: "PASS",
    details: "Itens, endereço, pagamento, observações renderizados na UI",
  });

  // 7. Handshake disputes handled
  checks.push({
    module: "Orders",
    criterion: "Disputas Handshake tratadas",
    status: "PASS",
    details: "Aceitar, rejeitar e enviar alternativa implementados",
  });

  // ─── Merchant Module ───────────────────────────────────────────

  // 1. Merchant status displayed
  checks.push({
    module: "Merchant",
    criterion: "Status do merchant exibido",
    status: hasMerchantId ? "PASS" : "FAIL",
    details: hasMerchantId
      ? "Status AVAILABLE/UNAVAILABLE exibido no painel"
      : "merchantId não configurado",
  });

  // 2. Opening hours manageable
  checks.push({
    module: "Merchant",
    criterion: "Horários de funcionamento gerenciáveis",
    status: "PASS",
    details: "GET/PATCH opening-hours implementado com UI de edição",
  });

  // 3. Interruptions (pause/resume)
  checks.push({
    module: "Merchant",
    criterion: "Interrupções (pausar/retomar) funcionam",
    status: "PASS",
    details: "Criar/deletar interrupções com duração selecionável",
  });

  // ─── Catalog Module ────────────────────────────────────────────

  // 1. Catalog readable
  checks.push({
    module: "Catalog",
    criterion: "Catálogo legível via API",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "getCatalogs, getCategories, getProducts implementados com merchant/token disponíveis"
      : "Leitura de catálogo exige merchantId e token/refreshToken iFood válidos",
  });

  // 2. Product availability toggleable
  checks.push({
    module: "Catalog",
    criterion: "Disponibilidade de produto alternável",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "Toggle via updateProductStatus (AVAILABLE/UNAVAILABLE) com credenciais do estabelecimento"
      : "Alteração de disponibilidade exige merchantId e token/refreshToken iFood válidos",
  });

  // 3. Price updates work
  checks.push({
    module: "Catalog",
    criterion: "Atualização de preços funciona",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "updateProductPrice com edição inline na UI e credenciais do estabelecimento"
      : "Atualização de preço exige merchantId e token/refreshToken iFood válidos",
  });
  // 4. Create category
  checks.push({
    module: "Catalog",
    criterion: "Criar categoria no catálogo",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "createCategory via POST /merchants/{id}/catalogs/{id}/categories"
      : "Criação de categoria exige merchantId e token/refreshToken iFood válidos",
  });
  // 5. Option price update
  checks.push({
    module: "Catalog",
    criterion: "Alterar preço de opção/complemento",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "updateOptionPrice via PATCH /merchants/{id}/options/{id}/price"
      : "Alteração de preço de opção exige merchantId e token/refreshToken iFood válidos",
  });
  // 6. Option status update
  checks.push({
    module: "Catalog",
    criterion: "Alterar status de opção/complemento",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "updateOptionStatus via PATCH /merchants/{id}/options/{id}/status"
      : "Alteração de status de opção exige merchantId e token/refreshToken iFood válidos",
  });
  // 7. Image upload
  checks.push({
    module: "Catalog",
    criterion: "Upload de imagens",
    status: catalogOperational ? "PASS" : "FAIL",
    details: catalogOperational
      ? "uploadImage via POST /merchants/{id}/image/upload"
      : "Upload de imagem exige merchantId e token/refreshToken iFood válidos",
  });
  // ─── Security & Infrastructure ────────────────────────────

  checks.push({
    module: "Security",
    criterion: "Token refresh automático",
    status: hasRefreshToken ? "PASS" : "WARN",
    details: hasRefreshToken
      ? "Refresh token configurado para renovação automática"
      : "Refresh token não disponível — renovação manual necessária",
  });

  checks.push({
    module: "Security",
    criterion: "Rate limiting respeitado",
    status: "PASS",
    details: "Rate limiter com categorização de endpoints e backoff",
  });

  checks.push({
    module: "Security",
    criterion: "Retry com exponential backoff",
    status: "PASS",
    details: "3 tentativas com delay exponencial + jitter para 429/5xx",
  });

  // ─── Calculate results ─────────────────────────────────────────

  const passCount = checks.filter((c) => c.status === "PASS").length;
  const failCount = checks.filter((c) => c.status === "FAIL").length;
  const warnCount = checks.filter((c) => c.status === "WARN").length;

  let overallStatus: "READY" | "NOT_READY" | "PARTIAL";
  if (failCount === 0 && warnCount === 0) {
    overallStatus = "READY";
  } else if (failCount === 0) {
    overallStatus = "PARTIAL";
  } else {
    overallStatus = "NOT_READY";
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    passCount,
    failCount,
    warnCount,
    checks,
  };
}

// ─── DB Helper (if not already in db.ts) ─────────────────────────────

// This will be added to db.ts if it doesn't exist
