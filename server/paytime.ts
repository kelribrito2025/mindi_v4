/**
 * Módulo de integração com a API Paytime
 * Handles: Autenticação, Criação de transações PIX e Cartão, Antifraude IDPAY, Consulta de transações
 * Docs: https://docs-parceiro.paytime.com.br/docs/seja-bem-vindo
 */

import { ENV } from "./_core/env";

// ─── Helper: Extrair mensagem amigável de erros Paytime ───────
function extractPaytimeErrorMessage(errorBody: string, fallback: string): string {
  try {
    const parsed = JSON.parse(errorBody);
    if (parsed.message) {
      // Se message é array (validação), juntar
      if (Array.isArray(parsed.message)) return parsed.message.join("; ");
      return String(parsed.message);
    }
  } catch {}
  return fallback;
}

// ─── Token Cache ───────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // timestamp ms

/**
 * Obtém um Bearer Token da API Paytime.
 * Usa cache local com margem de 2 minutos antes da expiração (token dura 30min).
 */
export async function getPaytimeToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const url = `${ENV.paytimeBaseUrl}/v1/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "integration-key": ENV.paytimeIntegrationKey,
      "authentication-key": ENV.paytimeAuthenticationKey,
      "x-token": ENV.paytimeXToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Paytime] Auth failed:", res.status, body);
    throw new Error(`Falha na autenticação do gateway de pagamento: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  // Token dura 30 min, renovamos com 2 min de margem
  tokenExpiresAt = now + 28 * 60 * 1000;

  console.log("[Paytime] Token obtido com sucesso");
  return cachedToken!;
}

/**
 * Headers padrão para todas as requisições autenticadas à Paytime.
 *
 * Normalmente o `establishment_id` do header é o sub-estabelecimento. Para
 * estabelecimentos com KYC pendente, algumas leituras de Banking precisam ser
 * feitas com o header do marketplace e filtradas localmente pelo sub.
 */
export interface PaytimeRequestScopeOptions {
  useMarketplaceHeaders?: boolean;
  filterSubEstablishmentId?: string;
}

async function getPaytimeHeaders(
  establishmentIdOverride?: string,
  options?: Pick<PaytimeRequestScopeOptions, "useMarketplaceHeaders">
): Promise<Record<string, string>> {
  const token = await getPaytimeToken();
  return {
    "Content-Type": "application/json",
    "integration-key": ENV.paytimeIntegrationKey,
    "x-token": ENV.paytimeXToken,
    "establishment_id": options?.useMarketplaceHeaders
      ? ENV.paytimeEstablishmentId
      : establishmentIdOverride || ENV.paytimeEstablishmentId,
    Authorization: `Bearer ${token}`,
  };
}

function normalizePaytimeId(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function getPaytimeEstablishmentIdCandidates(record: any): string[] {
  const candidates = [
    record?.sub_establishment_id,
    record?.subEstablishmentId,
    record?.sub_establishment?.id,
    record?.subEstablishment?.id,
    record?.establishment_id,
    record?.establishmentId,
    record?.establishment?.id,
  ];

  if (Array.isArray(record?.transactions)) {
    for (const transaction of record.transactions) {
      candidates.push(
        transaction?.sub_establishment_id,
        transaction?.subEstablishmentId,
        transaction?.sub_establishment?.id,
        transaction?.subEstablishment?.id,
        transaction?.establishment_id,
        transaction?.establishmentId,
        transaction?.establishment?.id,
      );
    }
  }

  return candidates
    .map(normalizePaytimeId)
    .filter((candidate): candidate is string => Boolean(candidate));
}

function matchesPaytimeSubEstablishment(record: any, subEstablishmentId?: string): boolean {
  const expected = normalizePaytimeId(subEstablishmentId);
  if (!expected) return true;
  return getPaytimeEstablishmentIdCandidates(record).includes(expected);
}

function filterByPaytimeSubEstablishment<T>(items: T[], subEstablishmentId?: string): T[] {
  if (!subEstablishmentId) return items;
  return items.filter((item) => matchesPaytimeSubEstablishment(item, subEstablishmentId));
}

function paginatePaytimeItems<T>(items: T[], page = 1, perPage = 15): T[] {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const start = (safePage - 1) * safePerPage;
  return items.slice(start, start + safePerPage);
}

// ─── Tipos ─────────────────────────────────────────────────────

export interface PaytimePixClient {
  first_name?: string;
  last_name?: string;
  document?: string;
  phone?: string;
  email?: string;
}

export interface PaytimePixRequest {
  /** Valor em centavos */
  amount: number;
  /** Quem paga as taxas: "CLIENT" ou "STORE" */
  interest?: "CLIENT" | "STORE";
  /** Dados do cliente (opcional) */
  client?: PaytimePixClient;
  /** ID de referência interno (max 100 chars) */
  reference_id?: string;
  /** Informações adicionais para o PIX */
  info_additional?: Array<{ key: string; value: string }>;
  /** ID do sub-estabelecimento na Paytime (usado no header establishment_id). */
  sub_establishment_id?: string;
  /** Gateway Paytime explícito para venda online; PIX do menu deve usar SubPaytime aprovado (4), não Banking pendente (6). */
  gateway_id?: number;
}

export interface PaytimeAntifraud {
  analyse_status: string;
  analyse_required?: "IDPAY" | "THREEDS";
  session?: string;
  antifraud_id?: string;
  _id?: string;
}

export interface PaytimeTransaction {
  _id: string;
  status: "CREATED" | "PENDING" | "PAID" | "APPROVED" | "FAILED" | "CANCELLED" | "REFUNDED" | "DISPUTED" | "CHARGEBACK" | string;
  amount: number;
  original_amount: number;
  fees: number;
  type: string;
  emv?: string;
  gateway_key: string;
  created_at: string;
  establishment?: {
    id: number;
    type: string;
    first_name: string;
    last_name: string | null;
  };
  customer?: {
    _id: string;
  };
  card?: {
    brand_name?: string;
    first4_digits?: string;
    last4_digits?: string;
    holder_name?: string;
    _id?: string;
  };
  antifraud?: PaytimeAntifraud[];
  expected_on?: Array<{
    date: string;
    amount: number;
    status: string;
    installment: number;
  }>;
}

// ─── Tipos para Cartão de Crédito ─────────────────────────────

export interface PaytimeCardClient {
  first_name: string;
  last_name: string;
  document: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    country?: string;
    zip_code: string;
  };
}

export interface PaytimeCardData {
  holder_name: string;
  holder_document: string;
  card_number: string;
  expiration_month: number;
  expiration_year: number;
  security_code: string;
  create_token?: boolean;
}

export interface PaytimeCardRequest {
  /** Valor em centavos */
  amount: number;
  /** Número de parcelas (1 = à vista) */
  installments?: number;
  /** Quem paga as taxas: "CLIENT" ou "STORE" */
  interest?: "CLIENT" | "STORE";
  /** Dados do cliente (obrigatório para cartão) */
  client: PaytimeCardClient;
  /** Dados do cartão */
  card: PaytimeCardData;
  /** Tipo de antifraude: "IDPAY" ou "THREEDS" */
  antifraud_type?: "IDPAY" | "THREEDS";
  /** ID de referência interno */
  reference_id?: string;
  /** Informações adicionais */
  info_additional?: Array<{ key: string; value: string }>;
  /** ID do sub-estabelecimento na Paytime (para usar no header) */
  sub_establishment_id?: string;
}

export interface PaytimeAntifraudAuthRequest {
  /** antifraud_id retornado na criação da transação (IDPAY) ou id gerado pelo SDK 3DS */
  id: string;
  /** Retorno do SDK IDPAY - se o fluxo foi concluído */
  concluded?: boolean;
  /** Retorno do SDK IDPAY - se a captura biométrica foi concluída */
  capture_concluded?: boolean;
  /** Retorno do SDK 3DS - status do fluxo de autenticação */
  status?: string;
  /** Retorno do SDK 3DS - resultado da autenticação (AUTHENTICATED, NOT_AUTHENTICATED) */
  authentication_status?: string;
}

// ─── Criar Transação PIX ───────────────────────────────────────

/**
 * Cria uma transação PIX na Paytime.
 * Retorna a transação com o campo `emv` para gerar o QR Code.
 */
export async function createPixTransaction(
  req: PaytimePixRequest
): Promise<PaytimeTransaction> {
  const subEstablishmentId = req.sub_establishment_id;
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions`;

  const buildBody = (includeSubEstablishmentInBody: boolean): Record<string, unknown> => {
    const body: Record<string, unknown> = {
      payment_type: "PIX",
      amount: req.amount,
      interest: req.interest ?? "STORE",
      gateway_id: req.gateway_id ?? 4,
    };

    if (includeSubEstablishmentInBody && subEstablishmentId) {
      body.sub_establishment_id = Number(subEstablishmentId);
    }
    if (req.client) {
      body.client = req.client;
    }
    if (req.reference_id) {
      body.reference_id = req.reference_id;
    }
    if (req.info_additional) {
      body.info_additional = req.info_additional;
    }

    return body;
  };

  const sendPixRequest = async (
    headers: Record<string, string>,
    body: Record<string, unknown>,
    strategy: "subestablishment-header" | "marketplace-header-with-body-sub"
  ) => {
    console.log("[DEBUG PIX] Headers:", {
      establishment_id: headers["establishment_id"],
      strategy,
    });
    console.log("[DEBUG PIX] Body:", {
      has_sub_establishment_id: Object.prototype.hasOwnProperty.call(body, "sub_establishment_id"),
      amount: req.amount,
      gateway_id: body.gateway_id,
      reference_id: req.reference_id,
    });

    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  };

  let headers = await getPaytimeHeaders(subEstablishmentId);
  let body = buildBody(false);
  let res = await sendPixRequest(headers, body, "subestablishment-header");

  if (!res.ok) {
    const errorBody = await res.text();
    const errorMessage = extractPaytimeErrorMessage(errorBody, `Erro na transação PIX (${res.status})`);
    const shouldRetryWithMarketplaceHeader =
      res.status === 403 &&
      Boolean(subEstablishmentId) &&
      subEstablishmentId !== ENV.paytimeEstablishmentId &&
      /TON000124|T0N000124|Estabelecimento não habilitado para executar venda Online/i.test(errorBody);

    if (shouldRetryWithMarketplaceHeader) {
      console.warn(
        "[Paytime] PIX com header do subestabelecimento recusado; tentando fallback com header do marketplace e sub_establishment_id no body:",
        { status: res.status, sub_establishment_id: subEstablishmentId }
      );

      headers = await getPaytimeHeaders();
      body = buildBody(true);
      res = await sendPixRequest(headers, body, "marketplace-header-with-body-sub");

      if (!res.ok) {
        const fallbackErrorBody = await res.text();
        console.error("[Paytime] Criar transação PIX falhou no fallback:", res.status, fallbackErrorBody);
        throw new Error(extractPaytimeErrorMessage(fallbackErrorBody, `Erro na transação PIX (${res.status})`));
      }
    } else {
      console.error("[Paytime] Criar transação PIX falhou:", res.status, errorBody);
      throw new Error(errorMessage);
    }
  }

  const transaction: PaytimeTransaction = await res.json();
  console.log("[Paytime] Transação PIX criada:", {
    id: transaction._id,
    status: transaction.status,
    amount: transaction.amount,
  });

  return transaction;
}

// ─── Criar Transação com Cartão de Crédito ────────────────────

/**
 * Cria uma transação com cartão de crédito na Paytime.
 * Os dados do cartão são enviados diretamente à API Paytime.
 * Pode retornar status PENDING com necessidade de antifraude (IDPAY ou 3DS).
 */
export async function createCardTransaction(
  req: PaytimeCardRequest
): Promise<PaytimeTransaction> {
  const headers = await getPaytimeHeaders(req.sub_establishment_id);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions`;

  const body: Record<string, unknown> = {
    payment_type: "CREDIT",
    amount: req.amount,
    installments: req.installments ?? 1,
    interest: req.interest ?? "STORE",
    client: req.client,
    card: req.card,
  };

  if (req.antifraud_type) {
    body.antifraud_type = req.antifraud_type;
  }
  if (req.reference_id) {
    body.reference_id = req.reference_id;
  }
  if (req.info_additional) {
    body.info_additional = req.info_additional;
  }

  console.log("[Paytime] Criando transação CARTÃO:", {
    amount: req.amount,
    installments: req.installments ?? 1,
    reference_id: req.reference_id,
    antifraud_type: req.antifraud_type,
    sub_establishment_id: req.sub_establishment_id,
    header_establishment_id: headers["establishment_id"],
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Criar transação CARTÃO falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro na transação com cartão (${res.status})`));
  }

  const transaction: PaytimeTransaction = await res.json();
  console.log("[Paytime] Transação CARTÃO criada:", {
    id: transaction._id,
    status: transaction.status,
    amount: transaction.amount,
    hasAntifraud: !!transaction.antifraud?.length,
    antifraudRequired: transaction.antifraud?.[0]?.analyse_required,
  });

  return transaction;
}

// ─── Autenticação Antifraude (IDPAY / 3DS) ────────────────────

/**
 * Envia o resultado da autenticação antifraude (IDPAY ou 3DS) para a Paytime.
 * Chamado após o SDK IDPAY/3DS concluir no frontend.
 * 
 * Endpoint: POST /v1/marketplace/transactions/:id/antifraud-auth
 */
export async function sendAntifraudAuth(
  transactionId: string,
  authData: PaytimeAntifraudAuthRequest,
  establishmentId?: string
): Promise<PaytimeTransaction> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions/${transactionId}/antifraud-auth`;

  console.log("[Paytime] Enviando autenticação antifraude:", {
    transactionId,
    antifraudId: authData.id,
    type: authData.status !== undefined ? '3DS' : 'IDPAY',
    status: authData.status,
    authentication_status: authData.authentication_status,
    concluded: authData.concluded,
    capture_concluded: authData.capture_concluded,
  });

  // Montar body baseado no tipo de antifraude (3DS ou IDPAY)
  // IMPORTANTE: O body já vem montado pelo router com o id correto
  // Para 3DS: id = SDK PagSeguro id | Para IDPAY: id = antifraudId da Paytime
  const body: Record<string, unknown> = { id: authData.id };
  if (authData.status !== undefined) {
    // 3DS: enviar status e authentication_status
    body.status = authData.status;
    body.authentication_status = authData.authentication_status || "AUTHENTICATED";
  } else {
    // IDPAY: enviar concluded e capture_concluded
    body.concluded = authData.concluded;
    body.capture_concluded = authData.capture_concluded;
  }

  console.log("[Paytime] antifraud-auth URL:", url);
  console.log("[Paytime] antifraud-auth Body:", JSON.stringify(body));

  // Log temporário para arquivo para debug
  const fs2 = await import('fs');
  fs2.appendFileSync('/tmp/paytime-debug.log', `[${new Date().toISOString()}] SENDING antifraud-auth\nURL: ${url}\nBody: ${JSON.stringify(body)}\n`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  console.log("[Paytime] antifraud-auth Response status:", res.status);
  console.log("[Paytime] antifraud-auth Response body:", responseText);

  // Log temporário para arquivo para debug
  const fs = await import('fs');
  const logEntry = `[${new Date().toISOString()}] antifraud-auth\nURL: ${url}\nBody: ${JSON.stringify(body)}\nResponse status: ${res.status}\nResponse body: ${responseText}\n---\n`;
  fs.appendFileSync('/tmp/paytime-debug.log', logEntry);

  if (!res.ok) {
    console.error("[Paytime] Autenticação antifraude falhou:", res.status, responseText);
    throw new Error(`Falha na autenticação antifraude: ${res.status} - ${responseText}`);
  }

  let transaction: PaytimeTransaction;
  try {
    transaction = JSON.parse(responseText);
  } catch (e) {
    console.error("[Paytime] Erro ao parsear resposta antifraud-auth:", responseText);
    throw new Error(`Resposta inválida da autenticação antifraude: ${responseText}`);
  }
  
  console.log("[Paytime] Autenticação antifraude concluída:", {
    transactionId,
    newStatus: transaction.status,
    newId: transaction._id,
  });

  return transaction;
}

// ─── Consultar Transação ───────────────────────────────────────

/**
 * Consulta uma transação específica pelo ID.
 */
export async function getTransaction(
  transactionId: string,
  establishmentId?: string
): Promise<PaytimeTransaction> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions/${transactionId}`;

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar transação falhou:", res.status, errorBody);
    throw new Error(`Erro ao consultar transação: ${res.status}`);
  }

  return await res.json();
}

// ─── Gerar QR Code (via API) ───────────────────────────────────

/**
 * Gera a imagem do QR Code PIX via API Paytime.
 * Retorna a URL ou base64 da imagem.
 * Alternativa: usar o campo `emv` da transação com biblioteca qrcode no frontend.
 */
export async function getPixQrCode(
  transactionId: string
): Promise<{ qrcode_url?: string; base64?: string }> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions/${transactionId}/qrcode`;

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Gerar QR Code falhou:", res.status, errorBody);
    throw new Error(`Erro ao gerar QR Code: ${res.status}`);
  }

  return await res.json();
}

// ─// ─── Cadastro de Estabelecimento (Fase 4) ─────────────────

export interface PaytimeEstablishmentRequest {
  type: "INDIVIDUAL" | "BUSINESS"; // Tipo do estabelecimento
  first_name: string; // Razão Social (PJ) ou Nome (PF)
  last_name: string;  // Nome Fantasia
  document: string;   // CNPJ (14 dígitos) ou CPF (11 dígitos)
  cnae: string;       // Código CNAE
  email: string;
  phone_number: string; // Telefone principal do estabelecimento
  format: string;     // Formato da empresa: SS, SC, SPE, LTDA, SA, ME, MEI, EI, EIRELI, SLU, ESI
  birthdate: string;  // Data de abertura (YYYY-MM-DD) - obrigatório para BUSINESS
  revenue?: number;   // Faturamento estimado (>= 1)
  gmv?: number;       // Meta de faturamento anual
  activity_id?: number; // Tipo de atividade
  notes?: string;     // Anotações
  visited?: boolean;  // Se foi visitado
  address: {
    street: string;
    number: string;
    complement: string; // Obrigatório (pode ser string vazia)
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  responsible: {
    first_name: string; // Nome completo do responsável
    document: string;   // CPF do responsável
    email: string;
    phone: string;
    birthdate: string;  // Data de nascimento (YYYY-MM-DD)
  };
}

export interface PaytimeEstablishmentResponse {
  id: number;
  first_name: string;
  last_name: string;
  document: string;
  status: string;
  type: string;
  created_at: string;
  [key: string]: unknown;
}

/**
 * Cria um sub-estabelecimento na Paytime vinculado ao parceiro (Mindi).
 * Endpoint: POST /v1/marketplace/establishments
 */
export async function createPaytimeEstablishment(
  req: PaytimeEstablishmentRequest
): Promise<PaytimeEstablishmentResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments`;

  console.log("[Paytime] Criando sub-estabelecimento - PAYLOAD COMPLETO:", JSON.stringify(req, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Criar estabelecimento falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao cadastrar (${res.status})`));
  }

  const data: PaytimeEstablishmentResponse = await res.json();
  console.log("[Paytime] Sub-estabelecimento criado:", {
    id: data.id,
    status: data.status,
  });

  return data;
}

/**
 * Consulta um sub-estabelecimento na Paytime pelo ID.
 * Endpoint: GET /v1/marketplace/establishments/:id
 */
export async function getPaytimeEstablishment(
  establishmentId: number
): Promise<PaytimeEstablishmentResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/${establishmentId}`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar estabelecimento falhou:", res.status, errorBody);
    throw new Error(`Erro ao consultar estabelecimento: ${res.status}`);
  }

  return await res.json();
}

// ─── Ativação de Gateway (Fase 4) ───────────────────────

export interface PaytimeGateway {
  id: number;
  name: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Lista os gateways disponíveis na Paytime.
 * Endpoint: GET /v1/marketplace/gateways
 */
export async function listPaytimeGateways(): Promise<PaytimeGateway[]> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/gateways`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar gateways falhou:", res.status, errorBody);
    throw new Error(`Erro ao listar gateways: ${res.status}`);
  }

  return await res.json();
}

/**
 * Ativa um gateway para um sub-estabelecimento na Paytime.
 * Endpoint: POST /v1/marketplace/establishments/:id/gateways
 * 
 * Gateway 6 (Banking Paytime): requer fees_banking_id, form_receipt
 * Gateway 4 (SubPaytime): requer plans (array de planos comerciais), statement_descriptor
 */
export async function activatePaytimeGateway(
  establishmentId: number,
  gatewayId: number,
  options?: {
    planId?: number;
    feesBankingId?: number;
    formReceipt?: string;
    statementDescriptor?: string;
    referenceId?: string;
    plans?: Array<{ id: number; active: boolean }>;
  }
): Promise<any> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/${establishmentId}/gateways`;

  const body: Record<string, unknown> = {
    gateway_id: gatewayId,
    active: true,
  };

  // reference_id é obrigatório segundo a documentação
  if (options?.referenceId) {
    body.reference_id = options.referenceId;
  }
  // Gateway 6 (Banking): precisa de fees_banking_id e form_receipt
  if (options?.feesBankingId) {
    body.fees_banking_id = options.feesBankingId;
  }
  if (options?.formReceipt) {
    body.form_receipt = options.formReceipt;
  }
  // statement_descriptor: APENAS para Gateway 4 (SubPaytime)
  // NÃO enviar para Gateway 6 (Banking) - causa erro BNK006000
  if (options?.statementDescriptor && gatewayId !== 6) {
    body.statement_descriptor = options.statementDescriptor;
  }
  if (options?.plans) {
    body.plans = options.plans;
  }
  // Legado: plan_id
  if (options?.planId) {
    body.plan_id = options.planId;
  }

  console.log("[Paytime] Ativando gateway:", {
    establishmentId,
    gatewayId,
    body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Ativar gateway falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao ativar gateway (${res.status})`));
  }

  const data = await res.json();
  console.log("[Paytime] Gateway ativado com sucesso:", {
    establishmentId,
    gatewayId,
    response: JSON.stringify(data).substring(0, 500),
  });
  return data;
}

// ─── Listar Planos Comerciais ─────────────────────────────

/**
 * Lista os planos comerciais disponíveis no marketplace.
 * Endpoint: GET /v1/marketplace/plans
 */
export async function listPaytimePlans(): Promise<any[]> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/plans`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar planos falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar gateways (${res.status})`));}

  const data = await res.json();
  console.log("[Paytime] Planos comerciais:", JSON.stringify(data).substring(0, 500));
  return Array.isArray(data) ? data : data.data || data.plans || [data];
}

// ─── Listar Pacotes de Tarifas Bancárias ──────────────────

/**
 * Lista os pacotes de tarifas bancárias disponíveis.
 * Endpoint: GET /v1/marketplace/fees-bankings
 */
export async function listPaytimeFeesBankings(): Promise<any[]> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/fees-bankings`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar tarifas bancárias falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar tarifas bancárias (${res.status})`));
  }

  const data = await res.json();
  console.log("[Paytime] Tarifas bancárias (raw):", JSON.stringify(data).substring(0, 500));
  // API retorna objeto paginado { total, page, perPage, lastPage, data: [...] }
  const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  console.log("[Paytime] Tarifas bancárias extraidas:", items.length, "itens");
  return items;
}

// ─── Consultar Gateways de um Sub-Estabelecimento ─────────

/**
 * Lista os gateways ativados para um sub-estabelecimento específico.
 * Endpoint: GET /v1/marketplace/establishments/:id/gateways
 */
export async function listEstablishmentGateways(
  establishmentId: number
): Promise<any[]> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/${establishmentId}/gateways`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar gateways do estabelecimento falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar gateways do estabelecimento (${res.status})`));
  }

  const data = await res.json();
  console.log("[Paytime] Gateways do estabelecimento (raw):", JSON.stringify(data).substring(0, 500));
  // API retorna objeto paginado { total, page, perPage, lastPage, data: [...] }
  const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  console.log("[Paytime] Gateways extraidos:", items.length, "itens");
  return items;
}

// ─── Split Pré (Fase 4) ─────────────────────────────────

export interface PaytimeSplitPreRequest {
  title: string;
  modality: "ALL" | "CREDIT" | "DEBIT" | "PIX";
  channel: "ALL" | "CHIP" | "TAP" | "SMART" | "ONLINE";
  division: "PERCENTAGE" | "CURRENCY";
  active: boolean;
  establishments: Array<{
    id: number;
    active: boolean;
    value: number; // % ou centavos
  }>;
}

export interface PaytimeSplitPreResponse {
  _id: string;
  title: string;
  modality: string;
  channel: string;
  division: string;
  active: boolean;
  establishments: Array<{
    id: number;
    active: boolean;
    value: number;
  }>;
  [key: string]: unknown;
}

/**
 * Cria uma regra de split pré para um sub-estabelecimento.
 * O split pré é automático: toda transação do estabelecimento segue a regra.
 * 
 * Endpoint: POST /v1/marketplace/establishments/:id/split-pre
 * 
 * Nota: O valor no array `establishments` define quanto o sub-estabelecimento recebe.
 * O parceiro (Mindi) recebe o restante automaticamente.
 * Ex: Se value=99 e division=PERCENTAGE, o restaurante recebe 99% e a Mindi 1%.
 */
export async function createPaytimeSplitPre(
  establishmentId: number,
  req: PaytimeSplitPreRequest
): Promise<PaytimeSplitPreResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/${establishmentId}/split-pre`;

  console.log("[Paytime] Criando regra de split pré:", {
    establishmentId,
    title: req.title,
    modality: req.modality,
    channel: req.channel,
    division: req.division,
    establishments: req.establishments,
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Criar split pré falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao configurar split (${res.status})`));
  }

  const data: PaytimeSplitPreResponse = await res.json();
  console.log("[Paytime] Regra de split pré criada:", {
    id: data._id,
    title: data.title,
  });

  return data;
}

/**
 * Lista as regras de split pré de um sub-estabelecimento.
 * Endpoint: GET /v1/marketplace/establishments/:id/split-pre
 */
export async function listPaytimeSplitPre(
  establishmentId: number
): Promise<PaytimeSplitPreResponse[]> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/${establishmentId}/split-pre`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar split pré falhou:", res.status, errorBody);
    throw new Error(`Erro ao listar split: ${res.status}`);
  }

  return await res.json();
}

// ─── Estorno de Transação ──────────────────────────────────

export interface PaytimeRefundResponse {
  _id: string;
  status: string;
  amount: number;
  [key: string]: unknown;
}

/**
 * Estorna (reverte) uma transação na Paytime.
 * Endpoint: POST /v1/marketplace/transactions/{id}/reversal
 * 
 * @param transactionId - O _id da transação na Paytime
 * @param useAccount - Se true, usa o saldo do estabelecimento como fonte para o estorno
 *                     caso a transação já tenha sido liquidada.
 */
export async function refundPaytimeTransaction(
  transactionId: string,
  useAccount: boolean = false
): Promise<PaytimeRefundResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions/${transactionId}/reversal`;

  console.log("[Paytime] Estornando transação:", {
    transactionId,
    useAccount,
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ use_account: useAccount }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Estorno falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao estornar (${res.status})`));
  }

  const data: PaytimeRefundResponse = await res.json();
  console.log("[Paytime] Transação estornada com sucesso:", {
    id: data._id,
    status: data.status,
  });

  return data;
}

// ─── Saldo do Estabelecimento (Banking) ─────────────────

export interface PaytimeBalance {
  total_balance: number;  // centavos
  blocked_balance: number; // centavos
  balance: number;        // centavos (disponível)
}

/**
 * Consulta o saldo do sub-estabelecimento na Paytime.
 * Endpoint: GET /v1/marketplace/establishments/balance
 * O establishment_id vai no header.
 */
export async function getEstablishmentBalance(
  establishmentId: string,
  scopeOptions?: PaytimeRequestScopeOptions
): Promise<PaytimeBalance> {
  const headers = await getPaytimeHeaders(establishmentId, scopeOptions);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/balance`;

  console.log("[Paytime] Consultando saldo do estabelecimento:", establishmentId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Timeout ao consultar saldo (10s)');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar saldo falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao consultar saldo (${res.status})`));
  }

  const data: PaytimeBalance = await res.json();
  console.log("[Paytime] Saldo obtido:", {
    balance: data.balance,
    blocked: data.blocked_balance,
    total: data.total_balance,
  });

  return data;
}

// ─── Lançamentos Futuros (Banking) ─────────────────────────

export interface PaytimeFutureReleases {
  calendar: Array<{ amount: number; date: string }>;
  thirtyDays: { amount: number };
  months: Array<{ amount: number; year: number; month: number }>;
  total: { amount: number };
}

/**
 * Consulta os lançamentos futuros do sub-estabelecimento na Paytime.
 * Endpoint: GET /v1/marketplace/transactions/future_releases
 * O establishment_id vai no header.
 */
export async function getFutureReleases(
  establishmentId: string,
  scopeOptions?: PaytimeRequestScopeOptions
): Promise<PaytimeFutureReleases> {
  const headers = await getPaytimeHeaders(establishmentId, scopeOptions);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions/future_releases`;

  console.log("[Paytime] Consultando lançamentos futuros do estabelecimento:", establishmentId);

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar lançamentos futuros falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao consultar lançamentos futuros (${res.status})`));
  }

  const data: PaytimeFutureReleases = await res.json();
  console.log("[Paytime] Lançamentos futuros obtidos:", {
    total: data.total?.amount,
    thirtyDays: data.thirtyDays?.amount,
    calendarEntries: data.calendar?.length,
  });

  return data;
}

// ─── Detalhes do Estabelecimento (conta bancária, endereços, gateways) ───

export interface EstablishmentDetailsResponse {
  id: number;
  first_name: string;
  last_name: string;
  document: string;
  status: string;
  type: string;
  email?: string;
  phone?: string;
  bank_account?: {
    bank?: string;
    bank_code?: string;
    type?: string;
    agency?: string;
    account?: string;
    account_digit?: string;
  };
  addresses?: Array<{
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }>;
  gateways?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  [key: string]: unknown;
}

/**
 * Busca detalhes completos do estabelecimento na Paytime.
 * Retorna dados bancários, endereço, gateways, etc.
 * Endpoint: GET /v1/marketplace/establishments/{id}
 */
export async function getEstablishmentDetails(
  establishmentId: string
): Promise<EstablishmentDetailsResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/${establishmentId}`;

  console.log(`[Paytime] Consultando detalhes do estabelecimento ${establishmentId}`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar detalhes falhou:", res.status, errorBody);
    throw new Error(`Erro ao consultar detalhes do estabelecimento: ${res.status}`);
  }

  const data = await res.json();
  return data;
}

// ─── Listar Transações do Estabelecimento ─────────────────

export interface PaytimeTransactionListItem {
  id: number;
  type: string;
  status: string;
  amount: number;
  original_amount: number;
  installments: number;
  created_at: string;
  updated_at: string;
  gateway_authorization?: string;
  customer?: {
    name?: string;
    email?: string;
    document?: string;
  };
  card?: {
    brand?: string;
    last_digits?: string;
  };
  establishment?: {
    id: number;
    name?: string;
  };
  point_of_sale?: {
    type?: string;
  };
}

// Resposta real da API Paytime (formato camelCase no root)
export interface PaytimeTransactionListRawResponse {
  data: PaytimeTransactionListItem[];
  total: number;
  perPage: number;
  page: number;
  lastPage: number;
}

// Formato normalizado usado internamente
export interface PaytimeTransactionListResponse {
  data: PaytimeTransactionListItem[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

/**
 * Lista transações do estabelecimento.
 * Endpoint: GET /v1/marketplace/transactions
 * O establishment_id vai no header para filtrar por estabelecimento.
 */
export async function getTransactions(
  establishmentId: string,
  options?: {
    page?: number;
    perPage?: number;
    filters?: Record<string, unknown>;
    sorters?: Array<{ column: string; direction: string }>;
    search?: string;
  },
  scopeOptions?: PaytimeRequestScopeOptions
): Promise<PaytimeTransactionListResponse> {
  const headers = await getPaytimeHeaders(establishmentId, scopeOptions);
  const params = new URLSearchParams();

  if (scopeOptions?.useMarketplaceHeaders) {
    params.set("page", "1");
    params.set("perPage", "1000");
  } else {
    if (options?.page) params.set("page", String(options.page));
    if (options?.perPage) params.set("perPage", String(options.perPage));
  }
  if (options?.search) params.set("search", options.search);

  // Mesclar filtro de establishment.id com filtros adicionais do chamador
  const mergedFilters: Record<string, unknown> = {
    ...(scopeOptions?.useMarketplaceHeaders ? {} : { "establishment.id": Number(establishmentId) }),
    ...(options?.filters || {}),
  };
  params.set("filters", JSON.stringify(mergedFilters));

  if (options?.sorters) params.set("sorters", JSON.stringify(options.sorters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions${queryString ? `?${queryString}` : ""}`;

  console.log(`[Paytime] Listando transações do estabelecimento ${establishmentId}`, { page: options?.page, perPage: options?.perPage });

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar transações falhou:", res.status, errorBody);
    throw new Error(`Erro ao listar transações: ${res.status}`);
  }

  const raw = await res.json() as PaytimeTransactionListRawResponse;
  const rawData = raw.data || [];
  const filteredData = filterByPaytimeSubEstablishment(rawData, scopeOptions?.filterSubEstablishmentId);
  const shouldPaginateLocally = Boolean(scopeOptions?.useMarketplaceHeaders);
  const perPage = options?.perPage ?? raw.perPage ?? 15;
  const currentPage = options?.page ?? raw.page ?? 1;
  const data = shouldPaginateLocally
    ? paginatePaytimeItems(filteredData, currentPage, perPage)
    : filteredData;

  // Normalizar resposta da API para formato interno com meta
  return {
    data,
    meta: {
      total: shouldPaginateLocally ? filteredData.length : (raw.total ?? filteredData.length ?? 0),
      per_page: perPage,
      current_page: currentPage,
      last_page: shouldPaginateLocally ? Math.max(1, Math.ceil(filteredData.length / perPage)) : (raw.lastPage ?? 1),
    },
  };
}

/**
 * Busca o resumo (totais) de TODAS as transações do estabelecimento.
 * Itera por todas as páginas para calcular totais corretos.
 * Aplica os mesmos filtros opcionais.
 */
export interface TransactionBreakdown {
  label: string;
  amount: number;
  count: number;
}

export interface TransactionsSummaryResult {
  totalIn: number;
  totalOut: number;
  totalCount: number;
  byModality: TransactionBreakdown[];   // agrupado por type (PIX, CREDIT, DEBIT)
  byChannel: TransactionBreakdown[];    // agrupado por point_of_sale.type (ONLINE, PHYSICAL, etc.)
  byConversion: TransactionBreakdown[]; // agrupado por status (PAID, PENDING, FAILED, etc.)
}

export async function getTransactionsSummary(
  establishmentId: string,
  options?: {
    filters?: Record<string, unknown>;
    search?: string;
  },
  scopeOptions?: PaytimeRequestScopeOptions
): Promise<TransactionsSummaryResult> {
  // Buscar todas as transações (perPage alto para minimizar chamadas)
  const headers = await getPaytimeHeaders(establishmentId, scopeOptions);
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("perPage", "1000");
  if (options?.search) params.set("search", options.search);

  // Mesclar filtro de establishment.id com filtros adicionais do chamador.
  // No fallback KYC pending, a consulta usa headers do marketplace e o filtro por
  // sub-establishment é aplicado localmente após a resposta.
  const mergedFilters: Record<string, unknown> = {
    ...(scopeOptions?.useMarketplaceHeaders ? {} : { "establishment.id": Number(establishmentId) }),
    ...(options?.filters || {}),
  };
  if (Object.keys(mergedFilters).length > 0) {
    params.set("filters", JSON.stringify(mergedFilters));
  }

  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions?${params.toString()}`;
  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Resumo de transações falhou:", res.status, errorBody);
    throw new Error(`Erro ao buscar resumo de transações: ${res.status}`);
  }

  const raw = await res.json() as PaytimeTransactionListRawResponse;
  const allTx = filterByPaytimeSubEstablishment(raw.data || [], scopeOptions?.filterSubEstablishmentId);

  // Filtrar canceladas/estornadas para os totais de valor
  const completedTx = allTx.filter(t => {
    const status = (t.status || '').toUpperCase();
    return status !== 'CANCELED' && status !== 'CANCELLED' && status !== 'REFUNDED';
  });

  let totalIn = 0;
  let totalOut = 0;

  // Agrupamentos
  const modalityMap: Record<string, { amount: number; count: number }> = {};
  const channelMap: Record<string, { amount: number; count: number }> = {};
  const conversionMap: Record<string, { amount: number; count: number }> = {};

  for (const t of allTx) {
    const amount = Math.abs(t.amount || 0);
    const status = (t.status || 'UNKNOWN').toUpperCase();

    // Totais (apenas completadas)
    if (status !== 'CANCELED' && status !== 'CANCELLED' && status !== 'REFUNDED') {
      if ((t.amount || 0) > 0) totalIn += (t.amount || 0);
      else totalOut += Math.abs(t.amount || 0);
    }

    // Agrupar por modalidade (type)
    const modality = (t.type || 'OUTRO').toUpperCase();
    if (!modalityMap[modality]) modalityMap[modality] = { amount: 0, count: 0 };
    modalityMap[modality].amount += amount;
    modalityMap[modality].count += 1;

    // Agrupar por canal (point_of_sale.type)
    const channel = (t.point_of_sale?.type || 'ONLINE').toUpperCase();
    if (!channelMap[channel]) channelMap[channel] = { amount: 0, count: 0 };
    channelMap[channel].amount += amount;
    channelMap[channel].count += 1;

    // Agrupar por conversão (status)
    if (!conversionMap[status]) conversionMap[status] = { amount: 0, count: 0 };
    conversionMap[status].amount += amount;
    conversionMap[status].count += 1;
  }

  const toBreakdown = (map: Record<string, { amount: number; count: number }>): TransactionBreakdown[] =>
    Object.entries(map).map(([label, data]) => ({ label, ...data })).sort((a, b) => b.amount - a.amount);

  return {
    totalIn,
    totalOut,
    totalCount: allTx.length,
    byModality: toBreakdown(modalityMap),
    byChannel: toBreakdown(channelMap),
    byConversion: toBreakdown(conversionMap),
  };
}

// ─── Banking: Transferências PIX ─────────────────────────

/**
 * Lista transferências do estabelecimento (Banking).
 * Suporta filtros por type (TED, P2P, PIX, WITHDRAW), status, etc.
 * Endpoint: GET /v1/marketplace/establishments/transfers
 */
export async function listBankingTransfers(
  establishmentId: string,
  options?: {
    page?: number;
    perPage?: number;
    filters?: Record<string, unknown>;
    sorters?: Array<{ column: string; direction: string }>;
    search?: string;
  },
  scopeOptions?: PaytimeRequestScopeOptions
): Promise<{ data: any[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }> {
  const headers = await getPaytimeHeaders(establishmentId, scopeOptions);
  const params = new URLSearchParams();

  const shouldPaginateLocally = Boolean(scopeOptions?.useMarketplaceHeaders);
  if (shouldPaginateLocally) {
    params.set("page", "1");
    params.set("perPage", "1000");
  } else {
    if (options?.page) params.set("page", String(options.page));
    if (options?.perPage) params.set("perPage", String(options.perPage));
  }
  if (options?.search) params.set("search", options.search);
  if (options?.filters) params.set("filters", JSON.stringify(options.filters));
  if (options?.sorters) params.set("sorters", JSON.stringify(options.sorters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/transfers${queryString ? `?${queryString}` : ""}`;

  console.log(`[Paytime] Listando transferências banking do estabelecimento ${establishmentId}`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar transferências banking falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar transferências (${res.status})`));
  }

  const raw = await res.json() as any;
  const rawData = raw.data || [];
  const filteredData = filterByPaytimeSubEstablishment(rawData, scopeOptions?.filterSubEstablishmentId);
  const perPage = options?.perPage ?? raw.perPage ?? 15;
  const currentPage = options?.page ?? raw.page ?? 1;
  const data = shouldPaginateLocally
    ? paginatePaytimeItems(filteredData, currentPage, perPage)
    : filteredData;

  return {
    data,
    meta: {
      total: shouldPaginateLocally ? filteredData.length : (raw.total ?? filteredData.length ?? 0),
      per_page: perPage,
      current_page: currentPage,
      last_page: shouldPaginateLocally ? Math.max(1, Math.ceil(filteredData.length / perPage)) : (raw.lastPage ?? 1),
    },
  };
}

/**
 * Detalha uma transferência específica do estabelecimento (Banking).
 * Endpoint: GET /v1/marketplace/establishments/transfers/{id}
 */
export async function getBankingTransferDetail(
  establishmentId: string,
  transferId: string
): Promise<any> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/transfers/${transferId}`;

  console.log(`[Paytime] Detalhando transferência ${transferId} do estabelecimento ${establishmentId}`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Detalhar transferência falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao detalhar transferência (${res.status})`));
  }

  return await res.json();
}

/**
 * Inicia um pagamento PIX (Banking).
 * Retorna dados do destinatário + init_id para confirmação.
 * Endpoint: POST /v1/marketplace/banking/transfers/pix-init
 */
export async function initPixPayment(
  establishmentId: string,
  data: {
    type: 'HASH' | 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
    key?: string;
    hash_code?: string;
  }
): Promise<any> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/banking/transfers/pix-init`;

  const body: Record<string, unknown> = { type: data.type };
  if (data.type === 'HASH') {
    body.hash_code = data.hash_code;
  } else {
    body.key = data.key;
  }

  console.log(`[Paytime] Iniciando pagamento PIX para estabelecimento ${establishmentId}`, { type: data.type });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Iniciar pagamento PIX falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao iniciar pagamento PIX (${res.status})`));
  }

  return await res.json();
}

/**
 * Confirma um pagamento PIX (Banking).
 * Executa a transferência PIX com o valor informado.
 * Endpoint: POST /v1/marketplace/banking/transfers/pix-confirm
 */
export async function confirmPixPayment(
  establishmentId: string,
  data: {
    type: 'HASH' | 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
    key?: string;
    hash_code?: string;
    amount: number; // centavos
    init_id: string;
  }
): Promise<any> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/banking/transfers/pix-confirm`;

  const body: Record<string, unknown> = {
    type: data.type,
    amount: data.amount,
    init_id: data.init_id,
  };
  if (data.type === 'HASH') {
    body.hash_code = data.hash_code;
  } else {
    body.key = data.key;
  }

  console.log(`[Paytime] Confirmando pagamento PIX para estabelecimento ${establishmentId}`, { type: data.type, amount: data.amount });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Confirmar pagamento PIX falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao confirmar pagamento PIX (${res.status})`));
  }

  return await res.json();
}

// ─── Liquidações / Repasses ─────────────────────────────────────────

export interface LiquidationItem {
  _id: string;
  amount: number;
  transactions: number;
  status: string;
  liquidation: string;
  establishment: {
    id: number;
    name1: string;
    name2: string;
    document: string;
    status: string;
    active: boolean;
    block: number;
    type: string;
  };
  marketplace: {
    id: number;
    name1: string;
    name2: string;
    document: string;
    nickname: string;
  };
  plans: Array<{
    id: number;
    name: string;
    allow_anticipation: boolean;
    modality: string;
    pivot: {
      plan_id: number;
      establishment_id: number;
      active: boolean;
    };
  }>;
  payments: any[];
  reprocessing: boolean;
  history: any[];
  created_at: string;
  updated_at: string;
}

export interface LiquidationResponse {
  meta: {
    total_amount: number;
    total_transactions: number;
    total_payments: number;
  };
  total: number;
  perPage: number;
  page: number;
  lastPage: number;
  data: LiquidationItem[];
}

/**
 * Lista liquidações completas do estabelecimento.
 * Endpoint: GET /v1/marketplace/liquidations
 * Retorna detalhes completos: valores, participantes, pagamentos, planos, histórico de status.
 * (Migrado de /extract para /liquidations para obter status, transactions, history, plans, payments)
 */
export async function listLiquidations(
  establishmentId?: string,
  options?: {
    page?: number;
    perPage?: number;
    filters?: Record<string, unknown>;
    search?: string;
    sorters?: Array<{ column: string; direction: string }>;
  },
  scopeOptions?: PaytimeRequestScopeOptions
): Promise<LiquidationResponse> {
  const headers = await getPaytimeHeaders(establishmentId, scopeOptions);
  const params = new URLSearchParams();

  const shouldPaginateLocally = Boolean(scopeOptions?.useMarketplaceHeaders);
  if (shouldPaginateLocally) {
    params.set("page", "1");
    params.set("perPage", "1000");
  } else {
    if (options?.page) params.set("page", String(options.page));
    if (options?.perPage) params.set("perPage", String(options.perPage));
  }
  if (options?.search) params.set("search", options.search);

  // Mesclar filtro de establishment.id com filtros adicionais do chamador
  const mergedFilters: Record<string, unknown> = {
    ...(establishmentId && !scopeOptions?.useMarketplaceHeaders ? { "establishment.id": Number(establishmentId) } : {}),
    ...(options?.filters || {}),
  };
  if (Object.keys(mergedFilters).length > 0) {
    params.set("filters", JSON.stringify(mergedFilters));
  }

  if (options?.sorters) params.set("sorters", JSON.stringify(options.sorters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/liquidations${queryString ? `?${queryString}` : ""}`;

  console.log(`[Paytime] Listando liquidações do estabelecimento ${establishmentId || "default"}`, {
    page: options?.page,
    perPage: options?.perPage,
    filters: options?.filters,
  });

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar liquidações falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar liquidações (${res.status})`));
  }

  const raw = await res.json();
  if (!scopeOptions?.filterSubEstablishmentId || !Array.isArray(raw?.data)) {
    return raw;
  }
  const filteredData = filterByPaytimeSubEstablishment(raw.data, scopeOptions.filterSubEstablishmentId);
  const perPage = options?.perPage ?? raw.perPage ?? 20;
  const currentPage = options?.page ?? raw.page ?? 1;
  const data = shouldPaginateLocally
    ? paginatePaytimeItems(filteredData, currentPage, perPage)
    : filteredData;
  return {
    ...raw,
    data,
    total: shouldPaginateLocally ? filteredData.length : (raw.total ?? filteredData.length),
    perPage,
    page: currentPage,
    lastPage: shouldPaginateLocally ? Math.max(1, Math.ceil(filteredData.length / perPage)) : (raw.lastPage ?? 1),
  };
}

// ─── Planos Comerciais ─────────────────────────────────────────

export interface PlanFlagCreditRates {
  "1x": number;
  "2x": number;
  "3x": number;
  "4x": number;
  "5x": number;
  "6x": number;
  "7x": number;
  "8x": number;
  "9x": number;
  "10x": number;
  "11x": number;
  "12x": number;
  "13x": number;
  "14x": number;
  "15x": number;
  "16x": number;
  "17x": number;
  "18x": number;
}

export interface PlanFlagRates {
  pix: number;
  debit: number;
  credit: PlanFlagCreditRates;
}

export interface PlanFlag {
  id: number;
  name: string;
  active: boolean;
  standard: PlanFlagRates;
  markup: PlanFlagRates;
  fees: PlanFlagRates;
}

export interface PlanDetail {
  id: number;
  name: string;
  active: boolean;
  modality: string;
  allow_anticipation: boolean;
  days_anticipation: string | null;
  created_at: string;
  updated_at: string;
  categories: Array<{ id: number; name: string; gateway_key: string }>;
  flags: PlanFlag[];
}

export interface PlanListItem {
  id: number;
  name: string;
  active: boolean;
  modality: string;
  allow_anticipation: boolean;
  days_anticipation: string | null;
  created_at: string;
  updated_at: string;
  categories: Array<{ id: number; name: string; gateway_key: string }>;
}

export interface PlansListResponse {
  total: number;
  perPage: number;
  page: number;
  lastPage: number;
  data: PlanListItem[];
}

/**
 * Lista todos os planos comerciais.
 * Endpoint: GET /v1/marketplace/plans
 */
export async function listPlans(
  establishmentId?: string,
  options?: {
    page?: number;
    perPage?: number;
    search?: string;
    filters?: Record<string, unknown>;
  }
): Promise<PlansListResponse> {
  const headers = await getPaytimeHeaders(establishmentId);
  const params = new URLSearchParams();

  if (options?.page) params.set("page", String(options.page));
  if (options?.perPage) params.set("perPage", String(options.perPage));
  if (options?.search) params.set("search", options.search);
  if (options?.filters) params.set("filters", JSON.stringify(options.filters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/plans${queryString ? `?${queryString}` : ""}`;

  console.log(`[Paytime] Listando planos comerciais`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar planos falhou:", res.status, errorBody);    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar planos (${res.status})`));
  }

  return await res.json();
}

/**
 * Exibe detalhes de um plano comercial específico, incluindo taxas por bandeira.
 * Endpoint: GET /v1/marketplace/plans/{id}
 */
export async function getPlanDetail(
  planId: number,
  establishmentId?: string
): Promise<PlanDetail> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/plans/${planId}`;

  console.log(`[Paytime] Buscando detalhes do plano ${planId}`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Detalhe do plano falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao consultar detalhes do plano (${res.status})`));
  }

  return await res.json();
}

// ─── Tarifas Bancárias ─────────────────────────────────────────

export interface FeesBankingItem {
  id: number;
  name: string;
  active: boolean;
  standard: {
    pix: number;
    ted: number;
    billet: number;
    dynamic_pix: number;
  };
  markup: {
    pix: number;
    ted: number;
    billet: number;
    dynamic_pix: number;
  };
  fees: {
    pix: number;
    ted: number;
    billet: number;
    dynamic_pix: number;
  };
  created_at: string;
  updated_at: string;
}

export interface FeesBankingResponse {
  total: number;
  perPage: number;
  page: number;
  lastPage: number;
  data: FeesBankingItem[];
}

/**
 * Lista pacotes de tarifas bancárias.
 * Endpoint: GET /v1/marketplace/fees-bankings
 * Retorna tarifas para PIX, TED, Boleto e PIX Dinâmico.
 */
export async function listFeesBanking(
  establishmentId?: string,
  options?: {
    page?: number;
    perPage?: number;
    search?: string;
    filters?: Record<string, unknown>;
  }
): Promise<FeesBankingResponse> {
  const headers = await getPaytimeHeaders(establishmentId);
  const params = new URLSearchParams();

  if (options?.page) params.set("page", String(options.page));
  if (options?.perPage) params.set("perPage", String(options.perPage));
  if (options?.search) params.set("search", options.search);
  if (options?.filters) params.set("filters", JSON.stringify(options.filters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/fees-bankings${queryString ? `?${queryString}` : ""}`;

  console.log(`[Paytime] Listando tarifas bancárias`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar tarifas bancárias falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar tarifas bancárias (${res.status})`));
  }

  return await res.json();
}

// ─── Simulação de Valores de Transação ─────────────────────

export interface SimulateTransactionRequest {
  /** Valor em centavos */
  amount: number;
  /** Bandeira: 1-MASTERCARD, 2-VISA, 3-ELO, 4-AMERICAN_EXPRESS, 5-HIPER_HIPERCARD, 6-OTHERS, 8-BACEN */
  flag_id: number;
  /** Gateway: 1-ZOOP, 2-PAGSEGURO, 4-SUBPAYTIME */
  gateway_id?: number;
  /** Modalidade: ONLINE, PHYSICAL, TAP_PHONE */
  modality: string;
  /** Quem paga as taxas: CLIENT ou STORE */
  interest: "CLIENT" | "STORE";
  /** Tipo de antifraude: THREEDS, IDPAY */
  antifraud_type?: string;
}

/**
 * Simula os valores/taxas de uma transação antes de cobrar.
 * Endpoint: POST /v1/marketplace/transactions/simulate
 */
export async function simulateTransaction(
  establishmentId: string,
  req: SimulateTransactionRequest
): Promise<any> {
  const headers = await getPaytimeHeaders(establishmentId);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions/simulate`;

  const body: Record<string, unknown> = {
    amount: req.amount,
    flag_id: req.flag_id,
    modality: req.modality,
    interest: req.interest,
  };

  if (req.gateway_id) body.gateway_id = req.gateway_id;
  if (req.antifraud_type) body.antifraud_type = req.antifraud_type;

  console.log("[Paytime] Simulando transação:", {
    amount: req.amount,
    flag_id: req.flag_id,
    modality: req.modality,
    interest: req.interest,
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Simulação falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao simular transação (${res.status})`));
  }

  const data = await res.json();
  console.log("[Paytime] Simulação concluída:", JSON.stringify(data).substring(0, 500));
  return data;
}

// ─── Extrato do Estabelecimento (Banking) ─────────────────────

export interface ExtractItem {
  _id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ExtractResponse {
  data: ExtractItem[];
  total: number;
  perPage: number;
  page: number;
  lastPage: number;
}

/**
 * Lista o extrato bancário do estabelecimento.
 * Endpoint: GET /v1/marketplace/establishments/extract
 * O establishment_id vai no header.
 */
export async function getEstablishmentExtract(
  establishmentId: string,
  options?: {
    page?: number;
    perPage?: number;
    filters?: Record<string, unknown>;
    search?: string;
    sorters?: Array<{ column: string; direction: string }>;
  }
): Promise<{ data: ExtractItem[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }> {
  const headers = await getPaytimeHeaders(establishmentId);
  const params = new URLSearchParams();

  if (options?.page) params.set("page", String(options.page));
  if (options?.perPage) params.set("perPage", String(options.perPage));
  if (options?.search) params.set("search", options.search);
  if (options?.filters) params.set("filters", JSON.stringify(options.filters));
  if (options?.sorters) params.set("sorters", JSON.stringify(options.sorters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/establishments/extract${queryString ? `?${queryString}` : ""}`;

  console.log(`[Paytime] Consultando extrato do estabelecimento ${establishmentId}`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Extrato falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao consultar extrato (${res.status})`));
  }

  const raw = await res.json() as ExtractResponse;

  return {
    data: raw.data || [],
    meta: {
      total: raw.total ?? raw.data?.length ?? 0,
      per_page: raw.perPage ?? options?.perPage ?? 15,
      current_page: raw.page ?? options?.page ?? 1,
      last_page: raw.lastPage ?? 1,
    },
  };
}

// ─── Pagamento de Boletos ─────────────────────────────────

export interface CheckBilletRequest {
  /** Linha digitável do boleto */
  digitable?: string;
  /** Código de barras do boleto */
  barcode?: string;
}

export interface CheckBilletResponse {
  assignor?: string;
  digitable?: string;
  barcode?: string;
  amount?: number;
  original_amount?: number;
  due_date?: string;
  type?: string;
  recipient_document?: string;
  recipient_name?: string;
  bank_code?: string;
  bank_name?: string;
  discount?: number;
  interest?: number;
  fine?: number;
  max_amount?: number;
  min_amount?: number;
  allow_change_amount?: boolean;
  [key: string]: unknown;
}

export interface PayBilletRequest {
  /** Código de barras do boleto (obrigatório) */
  barcode: string;
  /** Descrição opcional do pagamento */
  description?: string;
  /** Valor do pagamento, caso diferente do nominal */
  amount?: number;
}

export interface PayBilletResponse {
  _id?: string;
  status?: string;
  amount?: number;
  barcode?: string;
  description?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface BilletPayment {
  _id: string;
  status: string;
  amount: number;
  barcode?: string;
  description?: string;
  created_at: string;
  payment_details?: {
    card?: number;
    balance?: number;
    fees?: number;
    total?: number;
  };
  establishment?: {
    id: number;
    first_name: string;
    last_name?: string;
  };
  [key: string]: unknown;
}

/**
 * Consulta dados de um boleto antes do pagamento.
 * Endpoint: POST /v1/marketplace/payments/check-billet
 */
export async function checkBillet(
  req: CheckBilletRequest
): Promise<CheckBilletResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/payments/check-billet`;

  const body: Record<string, string> = {};
  if (req.digitable) body.digitable = req.digitable;
  if (req.barcode) body.barcode = req.barcode;

  console.log("[Paytime] Consultando boleto:", body);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar boleto falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao consultar boleto (${res.status})`));
  }

  const data: CheckBilletResponse = await res.json();
  console.log("[Paytime] Boleto consultado:", {
    assignor: data.assignor,
    amount: data.amount,
    due_date: data.due_date,
  });

  return data;
}

/**
 * Realiza o pagamento de um boleto.
 * Endpoint: POST /v1/marketplace/banking/payments
 */
export async function payBillet(
  req: PayBilletRequest
): Promise<PayBilletResponse> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/banking/payments`;

  const body: Record<string, unknown> = {
    barcode: req.barcode,
  };
  if (req.description) body.description = req.description;
  if (req.amount !== undefined) body.amount = req.amount;

  console.log("[Paytime] Realizando pagamento de boleto:", {
    barcode: req.barcode.substring(0, 10) + "...",
    amount: req.amount,
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Pagamento de boleto falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao pagar boleto (${res.status})`));
  }

  const data: PayBilletResponse = await res.json();
  console.log("[Paytime] Pagamento de boleto realizado:", {
    id: data._id,
    status: data.status,
    amount: data.amount,
  });

  return data;
}

/**
 * Lista pagamentos de boletos.
 * Endpoint: GET /v1/marketplace/payments
 */
export async function listBilletPayments(options?: {
  page?: number;
  perPage?: number;
  filters?: Record<string, unknown>;
  search?: string;
  sorters?: Array<{ column: string; order: string }>;
}): Promise<{ data: BilletPayment[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }> {
  const headers = await getPaytimeHeaders();
  const params = new URLSearchParams();

  if (options?.page) params.set("page", String(options.page));
  if (options?.perPage) params.set("perPage", String(options.perPage));
  if (options?.filters) params.set("filters", JSON.stringify(options.filters));
  if (options?.search) params.set("search", options.search);
  if (options?.sorters) params.set("sorters", JSON.stringify(options.sorters));

  const queryString = params.toString();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/payments${queryString ? `?${queryString}` : ""}`;

  console.log("[Paytime] Listando pagamentos de boletos");

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar pagamentos falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar pagamentos (${res.status})`));
  }

  const raw = await res.json() as any;

  return {
    data: raw.data || [],
    meta: {
      total: raw.total ?? raw.data?.length ?? 0,
      per_page: raw.perPage ?? options?.perPage ?? 15,
      current_page: raw.page ?? options?.page ?? 1,
      last_page: raw.lastPage ?? 1,
    },
  };
}

/**
 * Consulta um pagamento de boleto específico.
 * Endpoint: GET /v1/marketplace/payments/:id
 */
export async function getBilletPayment(paymentId: string): Promise<BilletPayment> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/payments/${paymentId}`;

  console.log(`[Paytime] Consultando pagamento ${paymentId}`);

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Consultar pagamento falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao consultar pagamento (${res.status})`));
  }

  return await res.json() as BilletPayment;
}

// ─── Invalidar Token (para testes) ─────────────────────────

export function invalidatePaytimeToken(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

// ─── Webhook Management ─────────────────────────────────────

export interface PaytimeWebhookEvent {
  id: number;
  name: string;
  description: string;
  active: boolean;
  url: string | null;
  basic_user: string | null;
  basic_pass: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lista todos os eventos de webhook registrados na Paytime.
 * Endpoint: GET /v1/marketplace/hooks/hook-events
 */
export async function listPaytimeWebhookEvents(): Promise<{
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  data: PaytimeWebhookEvent[];
}> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/hooks/hook-events?perPage=100`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Listar webhook events falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao listar webhook events (${res.status})`));
  }

  return await res.json();
}

/**
 * Registra ou atualiza eventos de webhook na Paytime.
 * Endpoint: POST /v1/marketplace/hooks/hook-events
 * 
 * @param events Array de eventos a registrar
 */
export async function registerPaytimeWebhookEvents(events: Array<{
  event_id: number;
  active: boolean;
  url: string;
  basic_user?: string | null;
  basic_pass?: string | null;
}>): Promise<{ events: PaytimeWebhookEvent[] }> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/hooks/hook-events`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ events }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Registrar webhook events falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao registrar webhook events (${res.status})`));
  }

  return await res.json();
}

/**
 * Redispara um evento de webhook na Paytime.
 * Endpoint: POST /v1/marketplace/hooks/hook-events/{eventId}/redispatch
 */
export async function redispatchPaytimeWebhookEvent(eventId: number): Promise<any> {
  const headers = await getPaytimeHeaders();
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/hooks/hook-events/${eventId}/redispatch`;

  const res = await fetch(url, { method: "POST", headers });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Redisparar webhook event falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro ao redisparar webhook event (${res.status})`));
  }

  return await res.json();
}


// ─── Criar Transação com Cartão Tokenizado (para renovações automáticas) ───
export interface PaytimeTokenChargeRequest {
  /** Valor em centavos */
  amount: number;
  /** Token do cartão salvo (retornado na primeira transação com create_token: true) */
  cardToken: string;
  /** Quem paga as taxas: "CLIENT" ou "STORE" */
  interest?: "CLIENT" | "STORE";
  /** ID de referência interno */
  reference_id?: string;
  /** Informações adicionais */
  info_additional?: Array<{ key: string; value: string }>;
  /** Sub-estabelecimento para rotear o pagamento */
  sub_establishment_id?: string;
}

/**
 * Cria uma transação usando um token de cartão previamente salvo.
 * Usado para cobranças recorrentes (renovação de planos).
 */
export async function createCardTransactionWithToken(
  req: PaytimeTokenChargeRequest
): Promise<PaytimeTransaction> {
  const headers = await getPaytimeHeaders(req.sub_establishment_id);
  const url = `${ENV.paytimeBaseUrl}/v1/marketplace/transactions`;

  const body: Record<string, unknown> = {
    payment_type: "CREDIT",
    amount: req.amount,
    installments: 1,
    interest: req.interest ?? "STORE",
    card: {
      card_token: req.cardToken,
    },
  };

  if (req.reference_id) {
    body.reference_id = req.reference_id;
  }
  if (req.info_additional) {
    body.info_additional = req.info_additional;
  }

  console.log("[Paytime] Criando transação com TOKEN:", {
    amount: req.amount,
    reference_id: req.reference_id,
    card_token_present: Boolean(req.cardToken),
    sub_establishment_id: req.sub_establishment_id,
    header_establishment_id: headers["establishment_id"],
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Paytime] Transação com TOKEN falhou:", res.status, errorBody);
    throw new Error(extractPaytimeErrorMessage(errorBody, `Erro na cobrança recorrente (${res.status})`));
  }

  const transaction: PaytimeTransaction = await res.json();
  console.log("[Paytime] Transação com TOKEN criada:", {
    id: transaction._id,
    status: transaction.status,
    amount: transaction.amount,
  });

  return transaction;
}
