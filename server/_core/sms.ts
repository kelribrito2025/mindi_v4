import { logger } from "./logger";
/**
 * SMS Service - DisparoPro Integration
 * 
 * Envia SMS através da API da DisparoPro
 * Documentação: https://sistema.disparopro.com.br/application/docs/docs-https
 */

const DISPAROPRO_API_URL = "https://apihttp.disparopro.com.br:8433/mt";

interface SMSConfig {
  token: string;
  parceiroId: string;
}

interface SMSPayload {
  to: string;
  message: string;
  campaignName?: string;
}

interface SMSResponse {
  success: boolean;
  error?: string;
  response?: any;
}

/**
 * Normaliza o número de telefone para o formato esperado pela API
 * Remove caracteres especiais e adiciona código do país se necessário
 * 
 * @param phone - Número de telefone em qualquer formato
 * @returns Número normalizado no formato 55DDDNNNNNNNNN ou null se inválido
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Remove todos os caracteres não numéricos
  let normalized = phone.replace(/\D/g, "");
  
  // Se o número está vazio após normalização, retorna null
  if (!normalized) return null;
  
  // Se começa com 0, remove (ex: 011999887766 -> 11999887766)
  if (normalized.startsWith("0")) {
    normalized = normalized.substring(1);
  }
  
  // Se não tem código do país (55), adiciona
  if (!normalized.startsWith("55")) {
    normalized = "55" + normalized;
  }
  
  // Valida o tamanho do número
  // Formato esperado: 55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
  // Total: 12 ou 13 dígitos
  if (normalized.length < 12 || normalized.length > 13) {
    logger.warn(`[SMS] Número de telefone inválido: ${phone} -> ${normalized} (tamanho: ${normalized.length})`);
    return null;
  }
  
  return normalized;
}

/**
 * Valida se o número de telefone é válido para envio de SMS
 */
export function isValidPhoneNumber(phone: string): boolean {
  return normalizePhoneNumber(phone) !== null;
}

/**
 * Obtém a configuração do SMS a partir das variáveis de ambiente
 */
function getSMSConfig(): SMSConfig | null {
  const token = process.env.DISPAROPRO_TOKEN;
  const parceiroId = process.env.DISPAROPRO_PARCEIRO_ID;
  
  if (!token || !parceiroId) {
    logger.warn("[SMS] Configuração da DisparoPro não encontrada. Defina DISPAROPRO_TOKEN e DISPAROPRO_PARCEIRO_ID.");
    return null;
  }
  
  return { token, parceiroId };
}

/**
 * Envia um SMS através da API da DisparoPro
 * 
 * @param payload - Dados do SMS (destinatário, mensagem, nome da campanha)
 * @returns Resultado do envio
 */
export async function sendSMS(payload: SMSPayload): Promise<SMSResponse> {
  const config = getSMSConfig();
  
  if (!config) {
    return {
      success: false,
      error: "Configuração da DisparoPro não encontrada",
    };
  }
  
  const normalizedPhone = normalizePhoneNumber(payload.to);
  
  if (!normalizedPhone) {
    logger.warn(`[SMS] Número de telefone inválido: ${payload.to}`);
    return {
      success: false,
      error: "Número de telefone inválido",
    };
  }
  
  try {
    logger.info(`[SMS] Enviando SMS para ${normalizedPhone}...`);
    
    const requestBody = [
      {
        numero: normalizedPhone,
        servico: "short",
        mensagem: payload.message,
        parceiro_id: config.parceiroId,
        codificacao: "0",
        nome_campanha: payload.campaignName || "Pedido Pronto",
      },
    ];
    
    const response = await fetch(DISPAROPRO_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseData = await response.json().catch(() => null);
    
    if (!response.ok) {
      logger.error(`[SMS] Erro na API DisparoPro: ${response.status} ${response.statusText}`, responseData);
      return {
        success: false,
        error: `Erro na API: ${response.status} ${response.statusText}`,
        response: responseData,
      };
    }
    
    logger.info(`[SMS] SMS enviado com sucesso para ${normalizedPhone}`, responseData);
    
    return {
      success: true,
      response: responseData,
    };
  } catch (error) {
    logger.error("[SMS] Erro ao enviar SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia SMS de notificação de pedido pronto
 * 
 * @param customerPhone - Telefone do cliente
 * @param restaurantName - Nome do restaurante
 * @param deliveryType - Tipo de entrega: "delivery" para entrega ou "pickup" para retirada
 * @returns Resultado do envio
 */
export async function sendOrderReadySMS(
  customerPhone: string,
  restaurantName: string,
  deliveryType: string = "delivery"
): Promise<SMSResponse> {
  // Mensagem diferenciada por tipo de entrega
  const message = deliveryType === "pickup"
    ? `${restaurantName}: Seu pedido já está disponível para retirada.`
    : `${restaurantName}: Seu pedido está saindo para entrega.`;
  
  return sendSMS({
    to: customerPhone,
    message,
    campaignName: deliveryType === "pickup" ? "Pedido Pronto Retirada" : "Pedido Pronto Entrega",
  });
}
