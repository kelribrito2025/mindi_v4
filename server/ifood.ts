/**
 * iFood Integration Module
 * 
 * Este módulo gerencia a integração com a API do iFood:
 * - Autenticação OAuth2 (obter e renovar tokens)
 * - Recebimento de eventos via Webhook
 * - Processamento de pedidos
 * - Sincronização de status
 */

import { ENV } from "./_core/env";
import * as db from "./db";
import { logger } from "./_core/logger";
import { ifoodApiCall, fetchWithRetry } from "./ifoodInfra";

// Constantes da API do iFood
const IFOOD_API_BASE_URL = "https://merchant-api.ifood.com.br";
const IFOOD_AUTH_URL = "https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token";

// Cache de tokens por estabelecimento (chave: establishmentId ou "global")
const tokenCache: Map<string, {
  accessToken: string;
  expiresAt: number;
}> = new Map();

/**
 * Obtém um token de acesso do iFood
 * Suporta credenciais globais (ENV) ou por estabelecimento
 */
export async function getIfoodAccessToken(credentials?: {
  clientId: string;
  clientSecret: string;
  establishmentId?: number;
}): Promise<string> {
  // Determina a chave do cache
  const cacheKey = credentials?.establishmentId?.toString() || "global";
  
  // Verifica se há token em cache e se ainda é válido (com margem de 5 minutos)
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.accessToken;
  }

  // Usa credenciais fornecidas ou globais
  const clientId = credentials?.clientId || ENV.ifoodClientId;
  const clientSecret = credentials?.clientSecret || ENV.ifoodClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do iFood não configuradas");
  }

  // Solicita novo token com retry/backoff para falhas transitórias da API/autenticação.
  const response = await fetchWithRetry(IFOOD_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grantType: "client_credentials",
      clientId,
      clientSecret,
    }),
  }, { maxRetries: 2, baseDelayMs: 1000 });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao obter token do iFood: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Armazena em cache
  tokenCache.set(cacheKey, {
    accessToken: data.accessToken,
    expiresAt: Date.now() + (data.expiresIn * 1000),
  });

  return data.accessToken;
}

/**
 * Valida as credenciais do iFood tentando obter um token
 */
export async function validateIfoodCredentials(): Promise<{ valid: boolean; error?: string }> {
  try {
    await getIfoodAccessToken();
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

/**
 * Valida se um Merchant ID existe e está acessível via API do iFood
 * Usa as credenciais globais do sistema para verificar
 */
export async function validateMerchantId(merchantId: string): Promise<{ 
  valid: boolean; 
  merchantName?: string;
  error?: string 
}> {
  try {
    // Primeiro, obter token de acesso com credenciais globais
    let token: string;
    try {
      token = await getIfoodAccessToken();
    } catch (authError) {
      logger.error("[iFood] Erro de autenticação:", authError);
      return {
        valid: false,
        error: "Erro de configuração do sistema. Entre em contato com o suporte."
      };
    }
    
    // Tentar buscar informações do merchant específico
    const response = await ifoodApiCall(
      `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}`,
      { method: "GET", token },
      { maxRetries: 2 }
    );

    if (response.status === 404) {
      return {
        valid: false,
        error: "Merchant ID não encontrado. Verifique se o ID está correto."
      };
    }

    if (response.status === 403) {
      return {
        valid: false,
        error: "Sem permissão para acessar este merchant. Verifique se a loja está vinculada à integração MINDI."
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[iFood] Erro ao validar merchant ${merchantId}:`, response.status, errorText);
      return {
        valid: false,
        error: `Erro ao validar Merchant ID: ${response.status}`
      };
    }

    const merchantData = await response.json();
    
    return {
      valid: true,
      merchantName: merchantData.name || merchantData.corporateName || "Loja iFood"
    };
  } catch (error) {
    logger.error("[iFood] Erro ao validar Merchant ID:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Erro ao conectar com o iFood"
    };
  }
}

/**
 * Busca detalhes de um pedido do iFood
 */
export async function getIfoodOrderDetails(orderId: string): Promise<any> {
  const token = await getIfoodAccessToken();
  
  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}`,
    { method: "GET", token }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao buscar pedido do iFood: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Envia acknowledgment em lote para eventos do iFood.
 * A API de Events aceita até 2000 eventos por chamada no endpoint actual do módulo Events.
 */
export async function acknowledgeIfoodEvents(eventIds: string[]): Promise<void> {
  const uniqueEventIds = Array.from(
    new Set(
      eventIds
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .map((id) => id.trim())
    )
  );

  if (uniqueEventIds.length === 0) return;

  const token = await getIfoodAccessToken();

  for (let start = 0; start < uniqueEventIds.length; start += 2000) {
    const batch = uniqueEventIds.slice(start, start + 2000);
    const response = await ifoodApiCall(
      `${IFOOD_API_BASE_URL}/events/v1.0/events/acknowledgment`,
      { method: "POST", token, body: JSON.stringify(batch.map((id) => ({ id }))) }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao enviar acknowledgment em lote (${batch.length} evento(s)): ${response.status} - ${errorText}`);
    }
  }
}

/**
 * Envia acknowledgment para um evento do iFood.
 * Mantido como wrapper para chamadas legadas internas.
 */
export async function acknowledgeIfoodEvent(eventId: string): Promise<void> {
  await acknowledgeIfoodEvents([eventId]);
}

/**
 * Confirma um pedido do iFood
 */
export async function confirmIfoodOrder(orderId: string, establishmentId: number): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  
  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/confirm`,
    { method: "POST", token }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao confirmar pedido no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Inicia o preparo de um pedido do iFood
 */
export async function startIfoodOrderPreparation(orderId: string, establishmentId: number): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  
  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/startPreparation`,
    { method: "POST", token }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao iniciar preparo no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Marca pedido como pronto para retirada no iFood
 */
export async function readyToPickupIfoodOrder(orderId: string, establishmentId: number): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  
  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/readyToPickup`,
    { method: "POST", token }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao marcar pronto no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Despacha um pedido do iFood (entrega própria/merchant delivery)
 * Requer body { "deliveredBy": "MERCHANT" } conforme documentação iFood
 */
export async function dispatchIfoodOrder(orderId: string, establishmentId: number): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  
  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/dispatch`,
    { method: "POST", token, body: JSON.stringify({ deliveredBy: "MERCHANT" }) }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao despachar pedido no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Valida o código de confirmação de entrega própria do iFood.
 * A API pode responder com { valid: boolean } no módulo Order ou { success: boolean }
 * em documentação logística; por isso os dois formatos são aceitos.
 */
export async function verifyIfoodDeliveryCode(
  orderId: string,
  establishmentId: number,
  code: string,
): Promise<{ valid: boolean; raw: unknown }> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/verifyDeliveryCode`,
    { method: "POST", token, body: JSON.stringify({ code }) }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao validar código de entrega no iFood: ${response.status} - ${errorText}`);
  }

  const raw = await response.json().catch(() => ({}));
  const result = raw as { valid?: boolean; success?: boolean };

  return {
    valid: result.valid === true || result.success === true,
    raw,
  };
}

/**
 * Busca motivos de cancelamento disponíveis para um pedido
 */
export async function getIfoodCancellationReasons(orderId: string, establishmentId: number): Promise<any[]> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  
  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/cancellationReasons`,
    { method: "GET", token }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao buscar motivos de cancelamento: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  logger.info(`[iFood Cancel] Motivos de cancelamento recebidos: ${JSON.stringify(data).substring(0, 500)}`);
  
  // A API retorna { reasons: [...] } conforme documentação
  // Mas tratamos ambos os formatos por segurança
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.reasons)) {
    return data.reasons;
  }
  // Se for outro formato, retornar como array
  return Array.isArray(data) ? data : [];
}

/**
 * Solicita cancelamento de um pedido do iFood
 */
export async function requestIfoodOrderCancellation(
  orderId: string,
  cancellationCode: string,
  establishmentId: number,
  cancellationReason?: string
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  
  const url = `${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/requestCancellation`;
  // A API de Order requestCancellation exige `cancellationCode` e alguns códigos exigem também `reason`.
  const trimmedReason = cancellationReason?.trim();
  const requestBody: { cancellationCode: string; reason?: string } = { cancellationCode };
  if (trimmedReason) {
    requestBody.reason = trimmedReason;
  }
  const body = JSON.stringify(requestBody);
  
  logger.info(`[iFood Cancel] Enviando cancelamento: URL=${url}, body=${body}`);
  
  const response = await ifoodApiCall(url, { 
    method: "POST", 
    token, 
    body
  });

  const responseText = await response.text();
  logger.info(`[iFood Cancel] Resposta: status=${response.status}, body=${responseText}`);

  if (!response.ok) {
    throw new Error(`Falha ao cancelar pedido no iFood: ${response.status} - ${responseText}`);
  }
}

// ==========================================
// FLUXO OAUTH DISTRIBUÍDO (Para clientes)
// ==========================================

/**
 * Gera um código de link para o cliente autorizar o MINDI no Partner Portal
 * Passo 1 do fluxo distribuído
 */
export async function generateUserCode(): Promise<{
  userCode: string;
  authorizationCodeVerifier: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresIn: number;
}> {
  const clientId = ENV.ifoodClientId;
  const clientSecret = ENV.ifoodClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do iFood não configuradas no sistema");
  }

  const response = await fetchWithRetry(`${IFOOD_API_BASE_URL}/authentication/v1.0/oauth/userCode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      clientId,
    }),
  }, { maxRetries: 2, baseDelayMs: 1000 });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao gerar código de usuário: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Troca o código de autorização por tokens de acesso
 * Passo 5 do fluxo distribuído
 */
export async function exchangeAuthorizationCode(
  authorizationCode: string,
  authorizationCodeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}> {
  const clientId = ENV.ifoodClientId;
  const clientSecret = ENV.ifoodClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do iFood não configuradas no sistema");
  }

  const response = await fetchWithRetry(IFOOD_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grantType: "authorization_code",
      clientId,
      clientSecret,
      authorizationCode,
      authorizationCodeVerifier,
    }),
  }, { maxRetries: 2, baseDelayMs: 1000 });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao trocar código de autorização: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Renova o token de acesso usando o refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}> {
  const clientId = ENV.ifoodClientId;
  const clientSecret = ENV.ifoodClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do iFood não configuradas no sistema");
  }

  const response = await fetchWithRetry(IFOOD_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grantType: "refresh_token",
      clientId,
      clientSecret,
      refreshToken,
    }),
  }, { maxRetries: 2, baseDelayMs: 1000 });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao renovar token: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Obtém token de acesso para um estabelecimento específico
 * Usa o refresh token armazenado para obter um novo access token
 */
export async function getAccessTokenForEstablishment(establishmentId: number): Promise<string> {
  // Verifica cache primeiro
  const cacheKey = `establishment_${establishmentId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.accessToken;
  }

  // Buscar configuração do estabelecimento
  const config = await db.getIfoodConfigByEstablishment(establishmentId);
  if (!config) {
    throw new Error("Estabelecimento não conectado ao iFood");
  }

  // Se tem refresh token, usa ele para renovar
  if (config.refreshToken) {
    try {
      const tokens = await refreshAccessToken(config.refreshToken);
      await db.updateIfoodTokens(establishmentId, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      tokenCache.set(cacheKey, {
        accessToken: tokens.accessToken,
        expiresAt: Date.now() + (tokens.expiresIn * 1000),
      });
      return tokens.accessToken;
    } catch (error) {
      logger.warn(`[iFood] Refresh token falhou para establishment ${establishmentId}, usando credenciais globais: ${error}`);
    }
  }

  // Fallback: usar credenciais globais (client_credentials)
  // Modelo centralizado - o sistema usa suas próprias credenciais
  logger.info(`[iFood] Usando credenciais globais (client_credentials) para establishment ${establishmentId}`);
  const token = await getIfoodAccessToken();
  
  // Cache com a chave do estabelecimento
  tokenCache.set(cacheKey, {
    accessToken: token,
    expiresAt: Date.now() + (3600 * 1000), // 1 hora default
  });

  return token;
}

/**
 * Busca os merchants (lojas) vinculados ao token do estabelecimento
 */
export async function getMerchants(establishmentId: number): Promise<Array<{
  id: string;
  name: string;
  corporateName: string;
  status: string;
}>> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao buscar merchants: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Tipos para eventos do iFood
export interface IfoodEvent {
  id: string;
  code: string;
  fullCode: string;
  orderId: string;
  merchantId: string;
  createdAt: string;
  salesChannel?: string;
  metadata?: Record<string, any>;
}

// Tipos para pedido do iFood
export interface IfoodOrder {
  id: string;
  displayId: string;
  orderType: "DELIVERY" | "TAKEOUT" | "DINE_IN" | "INDOOR";
  orderTiming: "IMMEDIATE" | "SCHEDULED";
  salesChannel: string;
  createdAt: string;
  preparationStartDateTime?: string;
  merchant: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
    documentNumber?: string;
    phone?: {
      number: string;
      localizer?: string;
    };
  };
  items: IfoodOrderItem[];
  total: {
    subTotal: number;
    deliveryFee: number;
    benefits: number | IfoodBenefit[];
    orderAmount: number;
    additionalFees: number;
  };
  payments: {
    methods: Array<{
      value: number;
      currency: string;
      method: string;
      type: string;
      prepaid: boolean;
      changeFor?: number;
      card?: {
        brand: string;
      };
    }>;
  };
  delivery?: {
    mode: string;
    deliveredBy: string;
    deliveryAddress?: {
      streetName: string;
      streetNumber: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
      reference?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    observations?: string;
  };
  takeout?: {
    mode: string;
    takeoutDateTime?: string;
  };
  schedule?: {
    deliveryDateTimeStart: string;
    deliveryDateTimeEnd: string;
  };
  benefits?: IfoodBenefit[];
  extraInfo?: string;
}

export interface IfoodBenefit {
  value?: number;
  target?: string;
  targetId?: string;
  description?: string;
  sponsorshipValues?: Record<string, number>;
}

export interface IfoodOrderItem {
  id: string;
  uniqueId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  price: number;
  optionsPrice: number;
  totalPrice: number;
  observations?: string;
  externalCode?: string;
  options?: Array<{
    id: string;
    name: string;
    groupName: string;
    quantity: number;
    unitPrice: number;
    price: number;
  }>;
}

function getIfoodBenefitValueInCents(benefit: unknown): number {
  if (!benefit || typeof benefit !== "object") return 0;

  const item = benefit as Record<string, any>;
  if (typeof item.value === "number" && Number.isFinite(item.value)) {
    return item.value;
  }

  const sponsorshipValues = item.sponsorshipValues;
  if (sponsorshipValues && typeof sponsorshipValues === "object") {
    return Object.values(sponsorshipValues).reduce<number>((sum, value) => {
      return sum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
    }, 0);
  }

  return 0;
}

function getIfoodBenefitsAmountInCents(ifoodOrder: Pick<IfoodOrder, "total" | "benefits">): number {
  const totalBenefits = ifoodOrder.total?.benefits;

  if (typeof totalBenefits === "number" && Number.isFinite(totalBenefits)) {
    return totalBenefits;
  }

  if (Array.isArray(totalBenefits)) {
    return totalBenefits.reduce((sum, benefit) => sum + getIfoodBenefitValueInCents(benefit), 0);
  }

  if (Array.isArray(ifoodOrder.benefits)) {
    return ifoodOrder.benefits.reduce((sum, benefit) => sum + getIfoodBenefitValueInCents(benefit), 0);
  }

  return 0;
}

type InternalIfoodPaymentMethod = "cash" | "card" | "pix" | "boleto" | "card_online" | "pix_online";

// Mapeamento de tipo de pedido iFood para interno
function mapIfoodOrderType(orderType: string): "delivery" | "pickup" | "dine_in" {
  switch (orderType) {
    case "DELIVERY":
      return "delivery";
    case "TAKEOUT":
      return "pickup";
    case "DINE_IN":
    case "INDOOR":
      return "dine_in";
    default:
      return "delivery";
  }
}

function centsToDecimal(value: unknown): string {
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return (numericValue / 100).toFixed(2);
}

function getIfoodPaymentMethods(ifoodOrder: Pick<IfoodOrder, "payments">): any[] {
  return Array.isArray(ifoodOrder.payments?.methods) ? ifoodOrder.payments.methods : [];
}

function isIfoodPrepaidPayment(method: any): boolean {
  const type = String(method?.type || "").toUpperCase();
  return method?.prepaid === true || type.includes("ONLINE") || type.includes("PREPAID") || type.includes("DIGITAL");
}

// Mapeamento de método de pagamento iFood para interno, preservando pagamentos online quando a tabela interna suporta.
function mapIfoodPaymentMethod(methods: any[]): InternalIfoodPaymentMethod {
  if (!methods || methods.length === 0) return "card";

  const primary = methods[0] || {};
  const method = String(primary.method || primary.type || "").toUpperCase();
  const isPrepaid = methods.some(isIfoodPrepaidPayment);

  if (method.includes("CASH") || method.includes("DINHEIRO")) return "cash";
  if (method.includes("PIX")) return isPrepaid ? "pix_online" : "pix";
  if (method.includes("BOLETO")) return "boleto";
  return isPrepaid ? "card_online" : "card";
}

function getIfoodChangeForInCents(methods: any[]): number | null {
  const methodWithChange = methods.find((method) => typeof method?.changeFor === "number" && Number.isFinite(method.changeFor));
  return methodWithChange ? methodWithChange.changeFor : null;
}

function buildIfoodPaymentSummary(methods: any[]): Array<Record<string, unknown>> {
  return methods.map((method, index) => ({
    index,
    method: method?.method || null,
    type: method?.type || null,
    prepaid: Boolean(method?.prepaid),
    valueInCents: typeof method?.value === "number" ? method.value : null,
    value: typeof method?.value === "number" ? centsToDecimal(method.value) : null,
    currency: method?.currency || null,
    cardBrand: method?.card?.brand || null,
    changeForInCents: typeof method?.changeFor === "number" ? method.changeFor : null,
    changeFor: typeof method?.changeFor === "number" ? centsToDecimal(method.changeFor) : null,
  }));
}

function buildIfoodCustomerSummary(ifoodOrder: IfoodOrder): Record<string, unknown> {
  return {
    id: ifoodOrder.customer?.id || null,
    name: ifoodOrder.customer?.name || null,
    documentNumber: ifoodOrder.customer?.documentNumber || null,
    phoneNumber: ifoodOrder.customer?.phone?.number || null,
    phoneLocalizer: ifoodOrder.customer?.phone?.localizer || null,
  };
}

function buildIfoodOrderNotes(ifoodOrder: IfoodOrder): string | null {
  const notes = [
    ifoodOrder.extraInfo,
    ifoodOrder.delivery?.observations,
    ifoodOrder.takeout?.takeoutDateTime ? `Retirada iFood prevista: ${ifoodOrder.takeout.takeoutDateTime}` : null,
    ifoodOrder.orderTiming === "SCHEDULED" && ifoodOrder.schedule?.deliveryDateTimeStart
      ? `Pedido iFood agendado: ${ifoodOrder.schedule.deliveryDateTimeStart}${ifoodOrder.schedule.deliveryDateTimeEnd ? ` até ${ifoodOrder.schedule.deliveryDateTimeEnd}` : ""}`
      : null,
  ];

  const uniqueNotes = Array.from(new Set(notes.filter((note): note is string => typeof note === "string" && note.trim().length > 0)));
  return uniqueNotes.length > 0 ? uniqueNotes.join("\n") : null;
}

function buildIfoodExternalData(ifoodOrder: IfoodOrder): Record<string, unknown> {
  const paymentMethods = getIfoodPaymentMethods(ifoodOrder);
  const changeForInCents = getIfoodChangeForInCents(paymentMethods);

  return {
    ...(ifoodOrder as unknown as Record<string, unknown>),
    _mindi: {
      customer: buildIfoodCustomerSummary(ifoodOrder),
      payments: buildIfoodPaymentSummary(paymentMethods),
      paymentMethod: mapIfoodPaymentMethod(paymentMethods),
      prepaid: paymentMethods.some(isIfoodPrepaidPayment),
      changeForInCents,
      changeFor: changeForInCents !== null ? centsToDecimal(changeForInCents) : null,
      benefitsAmountInCents: getIfoodBenefitsAmountInCents(ifoodOrder),
      orderType: ifoodOrder.orderType,
      orderTiming: ifoodOrder.orderTiming,
      takeoutDateTime: ifoodOrder.takeout?.takeoutDateTime || null,
      scheduledStart: ifoodOrder.schedule?.deliveryDateTimeStart || null,
      scheduledEnd: ifoodOrder.schedule?.deliveryDateTimeEnd || null,
      preparedAt: new Date().toISOString(),
    },
  };
}

function buildInternalIfoodOrderItems(ifoodOrder: Pick<IfoodOrder, "items">) {
  return (ifoodOrder.items || []).map(item => ({
    productId: 0, // Produto externo, não mapeado
    productName: item.name,
    quantity: item.quantity,
    unitPrice: centsToDecimal(item.unitPrice), // iFood envia em centavos
    totalPrice: centsToDecimal(item.totalPrice),
    complements: item.options?.map(opt => ({
      name: `${opt.groupName}: ${opt.name}`,
      price: (typeof opt.price === "number" ? opt.price : 0) / 100,
      quantity: opt.quantity
    })) || [],
    notes: item.observations || null
  }));
}

function buildIfoodCustomerAddress(ifoodOrder: IfoodOrder): string {
  if (!ifoodOrder.delivery?.deliveryAddress) return "";

  const addr = ifoodOrder.delivery.deliveryAddress;
  let customerAddress = `${addr.streetName}, ${addr.streetNumber}`;
  if (addr.complement) customerAddress += ` - ${addr.complement}`;
  customerAddress += ` - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
  if (addr.postalCode) customerAddress += ` - CEP: ${addr.postalCode}`;
  if (addr.reference) customerAddress += ` (Ref: ${addr.reference})`;
  return customerAddress;
}

// Converter pedido iFood para formato interno
async function convertIfoodOrderToInternal(ifoodOrder: IfoodOrder, establishmentId: number) {
  const paymentMethods = getIfoodPaymentMethods(ifoodOrder);
  const changeForInCents = getIfoodChangeForInCents(paymentMethods);

  return {
    establishmentId,
    orderNumber: `IF${ifoodOrder.displayId || ifoodOrder.id.substring(0, 8).toUpperCase()}`,
    customerName: ifoodOrder.customer?.name || "Cliente iFood",
    customerPhone: ifoodOrder.customer?.phone?.number || null,
    customerAddress: buildIfoodCustomerAddress(ifoodOrder),
    status: ifoodOrder.orderTiming === "SCHEDULED" ? "scheduled" as const : "new" as const,
    deliveryType: mapIfoodOrderType(ifoodOrder.orderType),
    paymentMethod: mapIfoodPaymentMethod(paymentMethods),
    subtotal: centsToDecimal(ifoodOrder.total.subTotal),
    deliveryFee: centsToDecimal(ifoodOrder.total.deliveryFee),
    discount: centsToDecimal(getIfoodBenefitsAmountInCents(ifoodOrder)),
    total: centsToDecimal(ifoodOrder.total.orderAmount),
    notes: buildIfoodOrderNotes(ifoodOrder),
    changeAmount: changeForInCents !== null ? centsToDecimal(changeForInCents) : null,
    source: "ifood" as const,
    externalId: ifoodOrder.id,
    externalDisplayId: ifoodOrder.displayId,
    externalStatus: "PLACED",
    externalData: buildIfoodExternalData(ifoodOrder),
    // Scheduled order fields
    isScheduled: ifoodOrder.orderTiming === "SCHEDULED",
    scheduledAt: ifoodOrder.schedule?.deliveryDateTimeStart
      ? new Date(ifoodOrder.schedule.deliveryDateTimeStart)
      : (ifoodOrder.takeout?.takeoutDateTime
        ? new Date(ifoodOrder.takeout.takeoutDateTime)
        : (ifoodOrder.preparationStartDateTime ? new Date(ifoodOrder.preparationStartDateTime) : null)),
    items: buildInternalIfoodOrderItems(ifoodOrder)
  };
}

/**
 * Processa um evento de webhook do iFood
 * Esta função é chamada pelo endpoint de webhook
 */
export async function processIfoodWebhookEvent(
  event: IfoodEvent,
  options: { acknowledge?: boolean } = {}
): Promise<void> {
  const shouldAcknowledge = options.acknowledge ?? true;
  logger.info(`[iFood Webhook] Processando evento: ${event.code} - Pedido: ${event.orderId} - Merchant: ${event.merchantId}`);
  
  try {
    // Verificar se o merchant está conectado no sistema
    const ifoodConfig = await db.getIfoodConfigByMerchantId(event.merchantId);
    
    if (!ifoodConfig || !ifoodConfig.isConnected) {
      logger.info(`[iFood Webhook] Merchant ${event.merchantId} não está conectado. Ignorando evento.`);
      if (shouldAcknowledge) {
        // Ainda assim enviar acknowledgment para o iFood não reenviar
        try {
          await acknowledgeIfoodEvent(event.id);
          logger.info(`[iFood Webhook] Acknowledgment enviado para evento ignorado ${event.id}`);
        } catch (ackError) {
          logger.error(`[iFood Webhook] Erro ao enviar acknowledgment:`, ackError);
        }
      }
      return;
    }
    
    const establishmentId = ifoodConfig.establishmentId;
    logger.info(`[iFood Webhook] Merchant ${event.merchantId} conectado ao estabelecimento ${establishmentId}`);
    
    // Normalizar código do evento: usar fullCode se disponível, senão code
    // A API iFood pode enviar códigos abreviados (PLC, CFM) ou completos (PLACED, CONFIRMED)
    const eventCode = event.fullCode || event.code;
    
    // Processar diferentes tipos de eventos (aceita ambos os formatos)
    switch (eventCode) {
      // ===== PEDIDO NOVO =====
      case "PLC":
      case "PLACED": {
        // Buscar detalhes do pedido
        const orderDetails = await getIfoodOrderDetails(event.orderId);
        
        // Converter e salvar pedido
        const orderData = await convertIfoodOrderToInternal(orderDetails, establishmentId);
        const newOrder = await db.createOrderFromIfood(orderData);
        
        if (newOrder) {
          logger.info(`[iFood Webhook] Novo pedido criado: ${newOrder.id} - ${newOrder.orderNumber}`);

          if (ifoodConfig.autoAcceptOrders) {
            try {
              logger.info(`[iFood Webhook] Autoaceite habilitado para pedido ${event.orderId}`);

              await confirmIfoodOrder(event.orderId, establishmentId);
              await db.updateOrderStatusByExternalId(event.orderId, "new");
              await db.updateOrderExternalStatusByExternalId(event.orderId, "CONFIRMED");

              await startIfoodOrderPreparation(event.orderId, establishmentId);
              await db.updateOrderStatusByExternalId(event.orderId, "preparing");
              await db.updateOrderExternalStatusByExternalId(event.orderId, "IN_PREPARATION");

              logger.info(`[iFood Webhook] Pedido ${event.orderId} autoaceito e enviado para preparo`);
            } catch (autoAcceptError) {
              logger.error(`[iFood Webhook] Erro ao autoaceitar pedido ${event.orderId}:`, autoAcceptError);
            }
          }
        }
        break;
      }

      // ===== PEDIDO CONFIRMADO =====
      case "CFM":
      case "CONFIRMED":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CONFIRMED");
        logger.info(`[iFood Webhook] Pedido ${event.orderId} confirmado`);
        break;

      // ===== PEDIDO CANCELADO =====
      case "CAN":
      case "CANCELLED": {
        const cancellationReason = event.metadata?.cancellationReason || event.metadata?.reason || "Cancelado pelo iFood";
        await db.updateOrderStatusByExternalId(event.orderId, "cancelled", cancellationReason);
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CANCELLED");
        await db.mergeOrderExternalDataByExternalId(event.orderId, {
          _cancellation: {
            reason: cancellationReason,
            code: event.metadata?.cancellationCode || event.metadata?.code || null,
            metadata: event.metadata || null,
            receivedAt: new Date().toISOString(),
          },
        });
        logger.info(`[iFood Webhook] Pedido ${event.orderId} cancelado`);
        break;
      }

      // ===== SOLICITAÇÃO DE CANCELAMENTO PELO CLIENTE (Gap 2) =====
      case "CRQ":
      case "CANCELLATION_REQUESTED":
      case "CANCELLATION_REQUEST_BY_CONSUMER": {
        // Atualizar status externo e persistir a solicitação para sobreviver a refresh/reabertura da tela
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CANCELLATION_REQUESTED");
        await db.mergeOrderExternalDataByExternalId(event.orderId, {
          _cancellationRequest: {
            reason: event.metadata?.cancellationReason || event.metadata?.reason || "Solicitação do cliente",
            code: event.metadata?.cancellationCode || event.metadata?.code || null,
            metadata: event.metadata || null,
            receivedAt: new Date().toISOString(),
          },
        });
        
        // Notificar o estabelecimento via SSE para que possa aceitar ou recusar
        logger.info(`[iFood Webhook] Solicitação de cancelamento recebida para pedido ${event.orderId}`);
        logger.info(`[iFood Webhook] Motivo: ${event.metadata?.cancellationReason || event.metadata?.reason || 'Não informado'}`);
        
        // Emitir evento SSE para notificar o frontend em tempo real
        try {
          const { sendEvent } = await import("./_core/sse");
          sendEvent(establishmentId, "ifood_cancellation_requested", {
            orderId: event.orderId,
            reason: event.metadata?.cancellationReason || "Solicitação do cliente",
            code: event.metadata?.cancellationCode,
            metadata: event.metadata,
          });
        } catch (sseError) {
          logger.error(`[iFood Webhook] Erro ao emitir SSE de cancelamento:`, sseError);
        }
        break;
      }

      // ===== PEDIDO DESPACHADO =====
      case "DSP":
      case "DISPATCHED":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "DISPATCHED");
        logger.info(`[iFood Webhook] Pedido ${event.orderId} despachado`);
        break;

      // ===== PEDIDO CONCLUÍDO =====
      case "CON":
      case "CONCLUDED":
        await db.updateOrderStatusByExternalId(event.orderId, "completed");
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CONCLUDED");
        logger.info(`[iFood Webhook] Pedido ${event.orderId} concluído`);
        break;

      // ===== PREPARO SOLICITADO =====
      case "RPS":
      case "PREPARATION_STARTED":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "PREPARATION_STARTED");
        logger.info(`[iFood Webhook] Pedido ${event.orderId} - preparo solicitado`);
        break;

      // ===== PRONTO PARA RETIRADA =====
      case "RTP":
      case "READY_TO_PICKUP":
        await db.updateOrderStatusByExternalId(event.orderId, "ready");
        await db.updateOrderExternalStatusByExternalId(event.orderId, "READY_TO_PICKUP");
        logger.info(`[iFood Webhook] Pedido ${event.orderId} pronto para retirada`);
        break;

      // ===== ORDER_PATCHED - Modificação de itens pós-criação (Gap 3) =====
      case "OPT":
      case "ORDER_PATCHED": {
        logger.info(`[iFood Webhook] Pedido ${event.orderId} foi modificado (ORDER_PATCHED)`);
        
        try {
          // Re-buscar os detalhes atualizados do pedido
          const patchedOrderDetails = await getIfoodOrderDetails(event.orderId);
          
          // Atualizar itens, valores e metadados normalizados no banco
          const patchedItems = buildInternalIfoodOrderItems(patchedOrderDetails);
          
          await db.updateOrderItemsByExternalId(event.orderId, {
            items: patchedItems,
            subtotal: centsToDecimal(patchedOrderDetails.total.subTotal),
            total: centsToDecimal(patchedOrderDetails.total.orderAmount),
            discount: centsToDecimal(getIfoodBenefitsAmountInCents(patchedOrderDetails)),
            deliveryFee: centsToDecimal(patchedOrderDetails.total.deliveryFee),
            externalData: buildIfoodExternalData(patchedOrderDetails),
          });
          
          logger.info(`[iFood Webhook] Pedido ${event.orderId} atualizado com dados modificados`);
          
          // Notificar via SSE
          try {
            const { sendEvent } = await import("./_core/sse");
            sendEvent(establishmentId, "ifood_order_patched", {
              orderId: event.orderId,
              metadata: event.metadata,
            });
          } catch (sseError) {
            logger.error(`[iFood Webhook] Erro ao emitir SSE de patch:`, sseError);
          }
        } catch (patchError) {
          logger.error(`[iFood Webhook] Erro ao processar ORDER_PATCHED para ${event.orderId}:`, patchError);
        }
        break;
      }

      // ===== EVENTOS DE LOGÍSTICA (Gap 4) =====
      case "ADR":
      case "ASSIGN_DRIVER": {
        const driverName = event.metadata?.DRIVER_NAME || event.metadata?.driverName || "Não informado";
        const driverPhone = event.metadata?.DRIVER_PHONE || event.metadata?.driverPhone || null;
        await db.updateOrderExternalStatusByExternalId(event.orderId, "ASSIGN_DRIVER");
        await db.updateOrderDriverInfoByExternalId(event.orderId, { driverName, driverPhone });
        logger.info(`[iFood Webhook] Entregador atribuído ao pedido ${event.orderId}: ${driverName}`);
        
        try {
          const { sendEvent } = await import("./_core/sse");
          sendEvent(establishmentId, "ifood_driver_assigned", {
            orderId: event.orderId,
            driverName,
            driverPhone,
          });
        } catch (sseError) {
          logger.error(`[iFood Webhook] Erro ao emitir SSE de driver:`, sseError);
        }
        break;
      }

      case "GTO":
      case "GOING_TO_ORIGIN":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "GOING_TO_ORIGIN");
        logger.info(`[iFood Webhook] Entregador a caminho do restaurante - Pedido ${event.orderId}`);
        break;

      case "ARO":
      case "ARRIVED_AT_ORIGIN":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "ARRIVED_AT_ORIGIN");
        logger.info(`[iFood Webhook] Entregador chegou ao restaurante - Pedido ${event.orderId}`);
        break;

      case "COL":
      case "COLLECTED":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "COLLECTED");
        logger.info(`[iFood Webhook] Pedido ${event.orderId} coletado pelo entregador`);
        break;

      case "GTD":
      case "GOING_TO_DESTINATION":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "GOING_TO_DESTINATION");
        logger.info(`[iFood Webhook] Entregador a caminho do cliente - Pedido ${event.orderId}`);
        break;

      case "ARD":
      case "ARRIVED_AT_DESTINATION":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "ARRIVED_AT_DESTINATION");
        logger.info(`[iFood Webhook] Entregador chegou ao destino - Pedido ${event.orderId}`);
        break;

      case "DDC":
      case "DDCR":
      case "DELIVERY_DROP_CODE_REQUESTED":
        await db.updateOrderExternalStatusByExternalId(event.orderId, "DELIVERY_DROP_CODE_REQUESTED");
        await db.mergeOrderExternalDataByExternalId(event.orderId, {
          _deliveryCodeRequested: true,
          _deliveryCodeRequestedAt: new Date().toISOString(),
        });
        logger.info(`[iFood Webhook] Código de confirmação de entrega solicitado - Pedido ${event.orderId}`);
        break;

      case "DAC":
      case "DELIVERY_ADDRESS_CHANGE": {
        logger.info(`[iFood Webhook] Endereço de entrega alterado - Pedido ${event.orderId}`);
        try {
          const updatedOrder = await getIfoodOrderDetails(event.orderId);
          if (updatedOrder.delivery?.deliveryAddress) {
            const addr = updatedOrder.delivery.deliveryAddress;
            let newAddress = `${addr.streetName}, ${addr.streetNumber}`;
            if (addr.complement) newAddress += ` - ${addr.complement}`;
            newAddress += ` - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
            if (addr.postalCode) newAddress += ` - CEP: ${addr.postalCode}`;
            if (addr.reference) newAddress += ` (Ref: ${addr.reference})`;
            await db.updateOrderAddressByExternalId(event.orderId, newAddress);
          }
        } catch (addrError) {
          logger.error(`[iFood Webhook] Erro ao atualizar endereço:`, addrError);
        }
        break;
      }

      // ===== HANDSHAKE DISPUTE =====
      case "HSK":
      case "HANDSHAKE_DISPUTE": {
        const { processHandshakeDispute } = await import("./ifoodHandshake");
        const disputeData = {
          id: event.id,
          disputeId: event.metadata?.disputeId || event.id,
          orderId: event.orderId,
          action: event.metadata?.action || "CANCELLATION",
          handshakeType: event.metadata?.handshakeType || "FULL",
          message: event.metadata?.message,
          expiresAt: event.metadata?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          timeoutAction: event.metadata?.timeoutAction || "ACCEPT",
          alternatives: event.metadata?.alternatives,
          metadata: event.metadata,
        };
        await processHandshakeDispute(disputeData, establishmentId);
        logger.info(`[iFood Webhook] Disputa processada: ${disputeData.disputeId}`);
        break;
      }

      // ===== HANDSHAKE SETTLEMENT =====
      case "HSS":
      case "HANDSHAKE_SETTLEMENT": {
        const { processHandshakeSettlement } = await import("./ifoodHandshake");
        const settlementData = {
          id: event.id,
          disputeId: event.metadata?.disputeId || event.id,
          orderId: event.orderId,
          status: event.metadata?.status || "ACCEPTED",
          alternativeId: event.metadata?.alternativeId,
          metadata: event.metadata,
        };
        await processHandshakeSettlement(settlementData, establishmentId);
        logger.info(`[iFood Webhook] Settlement processado: ${settlementData.disputeId}`);
        break;
      }
        
      default:
        logger.info(`[iFood Webhook] Evento não tratado: ${eventCode} (code: ${event.code}, fullCode: ${event.fullCode})`);
    }
    
    if (shouldAcknowledge) {
      // Enviar acknowledgment para o iFood
      try {
        await acknowledgeIfoodEvent(event.id);
        logger.info(`[iFood Webhook] Acknowledgment enviado para evento ${event.id}`);
      } catch (ackError) {
        logger.error(`[iFood Webhook] Erro ao enviar acknowledgment:`, ackError);
      }
    }
    
  } catch (error) {
    logger.error(`[iFood Webhook] Erro ao processar evento ${event.code}:`, error);
    throw error;
  }
}
