/**
 * iFood Merchant Module - Fase 2
 * 
 * Gerencia operações do merchant:
 * - Status da loja (disponível/indisponível)
 * - Horários de funcionamento
 * - Interrupções (pausas/retomadas)
 */

import { ifoodApiCall } from "./ifoodInfra";
import { getAccessTokenForEstablishment } from "./ifood";
import { logger } from "./_core/logger";

const IFOOD_API_BASE_URL = "https://merchant-api.ifood.com.br";

// ==========================================
// TIPOS
// ==========================================

export interface MerchantStatusValidation {
  id: string;
  code: string;
  state: "OK" | "ERROR" | "WARNING";
  message: {
    title: string;
    subtitle: string;
  };
}

export interface MerchantStatusOperation {
  operation: string;
  salesChannel: string;
  available: boolean;
  state: string;
  validations: MerchantStatusValidation[];
}

export interface MerchantInterruption {
  id: string;
  merchantId: string;
  description: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface MerchantOpeningHourShift {
  id?: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  start: string; // HH:mm:ss
  duration: number; // minutes
}

export interface MerchantOpeningHours {
  shifts: MerchantOpeningHourShift[];
}

// ==========================================
// FUNÇÕES DE STATUS
// ==========================================

/**
 * Busca o status operacional do merchant no iFood
 * Retorna informações sobre disponibilidade e validações
 */
export async function getMerchantStatus(
  establishmentId: number,
  merchantId: string
): Promise<MerchantStatusOperation[]> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}/status`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao buscar status: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao buscar status do merchant: ${response.status}`);
  }

  return response.json();
}

/**
 * Busca detalhes completos do merchant
 */
export async function getMerchantDetails(
  establishmentId: number,
  merchantId: string
): Promise<any> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao buscar detalhes: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao buscar detalhes do merchant: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// FUNÇÕES DE HORÁRIOS DE FUNCIONAMENTO
// ==========================================

/**
 * Busca os horários de funcionamento configurados no iFood
 */
export async function getOpeningHours(
  establishmentId: number,
  merchantId: string
): Promise<MerchantOpeningHours> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}/opening-hours`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao buscar horários: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao buscar horários de funcionamento: ${response.status}`);
  }

  return response.json();
}

/**
 * Atualiza os horários de funcionamento no iFood
 * Faz substituição completa dos horários
 */
export async function updateOpeningHours(
  establishmentId: number,
  merchantId: string,
  shifts: Array<{ dayOfWeek: string; start: string; duration: number }>
): Promise<any> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}/opening-hours`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(shifts)
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao atualizar horários: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar horários: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ==========================================
// FUNÇÕES DE INTERRUPÇÕES (PAUSAS)
// ==========================================

/**
 * Lista todas as interrupções ativas e futuras do merchant
 */
export async function listInterruptions(
  establishmentId: number,
  merchantId: string
): Promise<MerchantInterruption[]> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}/interruptions`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao listar interrupções: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao listar interrupções: ${response.status}`);
  }

  return response.json();
}

/**
 * Cria uma interrupção (pausa) na loja do iFood
 * @param description - Motivo da pausa (max 255 chars)
 * @param start - Data/hora de início (ISO 8601)
 * @param end - Data/hora de fim (ISO 8601)
 */
export async function createInterruption(
  establishmentId: number,
  merchantId: string,
  data: { description: string; start: string; end: string }
): Promise<MerchantInterruption> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}/interruptions`,
    {
      method: "POST",
      token,
      body: JSON.stringify(data)
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao criar interrupção: ${response.status} - ${errorText}`);
    
    if (response.status === 409) {
      throw new Error("Já existe uma pausa ativa que se sobrepõe ao período solicitado.");
    }
    
    throw new Error(`Falha ao criar interrupção: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Remove uma interrupção (retoma a loja)
 */
export async function deleteInterruption(
  establishmentId: number,
  merchantId: string,
  interruptionId: string
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_API_BASE_URL}/merchant/v1.0/merchants/${merchantId}/interruptions/${interruptionId}`,
    { method: "DELETE", token },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Merchant] Erro ao deletar interrupção: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao remover interrupção: ${response.status}`);
  }
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Verifica se o merchant está disponível (aberto) no iFood
 * Retorna um resumo simplificado do status
 */
export async function getMerchantAvailability(
  establishmentId: number,
  merchantId: string
): Promise<{
  available: boolean;
  operations: Array<{
    operation: string;
    available: boolean;
    state: string;
  }>;
  interruptions: MerchantInterruption[];
}> {
  try {
    const [statusOps, interruptions] = await Promise.all([
      getMerchantStatus(establishmentId, merchantId),
      listInterruptions(establishmentId, merchantId)
    ]);

    const available = statusOps.some(op => op.available);
    const operations = statusOps.map(op => ({
      operation: op.operation,
      available: op.available,
      state: op.state
    }));

    return { available, operations, interruptions };
  } catch (error) {
    logger.error("[iFood Merchant] Erro ao buscar disponibilidade:", error);
    throw error;
  }
}

/**
 * Pausa rápida da loja com duração pré-definida
 * @param durationMinutes - Duração da pausa em minutos
 */
export async function quickPause(
  establishmentId: number,
  merchantId: string,
  durationMinutes: number,
  description: string = "Pausa temporária"
): Promise<MerchantInterruption> {
  const now = new Date();
  const end = new Date(now.getTime() + durationMinutes * 60 * 1000);

  return createInterruption(establishmentId, merchantId, {
    description,
    start: now.toISOString(),
    end: end.toISOString()
  });
}
