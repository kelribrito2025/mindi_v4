import { logger } from "./logger";
/**
 * UAZAPI Integration Module
 * Handles WhatsApp connection and messaging via UAZAPI
 * Uses centralized credentials - each establishment gets its own instance
 */

// Get centralized credentials from environment
const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || '';
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN || '';
const DEFAULT_UAZAPI_TIMEOUT_MS = 5000;
const UAZAPI_MEDIA_TIMEOUT_MS = Number.parseInt(process.env.UAZAPI_MEDIA_TIMEOUT_MS || '30000', 10);

interface ConnectResponse {
  success: boolean;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string; // Base64 QR code image
  pairingCode?: string;
  message?: string;
}

interface StatusResponse {
  success: boolean;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string;
  pairingCode?: string;
  phone?: string;
  name?: string;
  message?: string;
}

interface SendTextResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

interface SendImageResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

interface InstanceInfo {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected';
  token?: string;
  phone?: string;
  profileName?: string;
}

/**
 * Check if UAZAPI is configured
 */
export function isUazapiConfigured(): boolean {
  return Boolean(UAZAPI_BASE_URL && UAZAPI_ADMIN_TOKEN);
}

/**
 * Make an admin request to UAZAPI (for creating/managing instances)
 */
async function makeAdminRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!isUazapiConfigured()) {
    throw new Error('UAZAPI not configured');
  }

  const url = `${UAZAPI_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'admintoken': UAZAPI_ADMIN_TOKEN,
  };

  // Timeout de 5s para evitar bloqueio indefinido
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `UAZAPI error: ${response.status}`);
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('[UAZAPI] Admin request timeout (5s):', endpoint);
      throw new Error('UAZAPI request timeout');
    }
    logger.error('[UAZAPI] Admin request failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make an instance request to UAZAPI (for operations on a specific instance)
 */
async function makeInstanceRequest<T>(
  instanceToken: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  requestOptions?: { timeoutMs?: number }
): Promise<T> {
  if (!isUazapiConfigured()) {
    throw new Error('UAZAPI not configured');
  }

  const url = `${UAZAPI_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'token': instanceToken,
  };

  // Timeout curto para texto/status; mídia pode demorar mais sem significar falha real.
  const timeoutMs = requestOptions?.timeoutMs || DEFAULT_UAZAPI_TIMEOUT_MS;
  const timeoutSeconds = Math.round(timeoutMs / 1000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `UAZAPI error: ${response.status}`);
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(`[UAZAPI] Instance request timeout (${timeoutSeconds}s):`, endpoint);
      throw new Error('UAZAPI request timeout');
    }
    logger.error('[UAZAPI] Instance request failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Create a new instance for an establishment
 * Instance name will be based on establishment ID for uniqueness
 */
export async function createInstance(establishmentId: number, establishmentName: string): Promise<{
  success: boolean;
  instanceId?: string;
  instanceToken?: string;
  message?: string;
}> {
  try {
    const instanceName = `cardapio_${establishmentId}`;
    
    const response = await makeAdminRequest<{
      instance?: { id?: string; token?: string };
      token?: string;
      response?: string;
    }>('/instance/create', 'POST', {
      name: instanceName,
      // Optional: set webhook URL for receiving messages
      // webhook: `${process.env.VITE_APP_URL}/api/webhook/whatsapp/${establishmentId}`,
    });
    
    // A API retorna o token tanto no root quanto em instance.token
    const instanceToken = response.token || response.instance?.token;
    const instanceId = response.instance?.id || instanceName;
    
    logger.info('[UAZAPI] Instance created:', { instanceId, hasToken: !!instanceToken });
    
    return {
      success: true,
      instanceId,
      instanceToken,
      message: response.response,
    };
  } catch (error) {
    // If instance already exists, try to get its token
    if (error instanceof Error && error.message.includes('already exists')) {
      const instances = await listInstances();
      const existing = instances.find(i => i.name === `cardapio_${establishmentId}`);
      if (existing) {
        return {
          success: true,
          instanceId: existing.id,
          message: 'Instance already exists',
        };
      }
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create instance',
    };
  }
}

/**
 * List all instances
 */
export async function listInstances(): Promise<InstanceInfo[]> {
  try {
    const response = await makeAdminRequest<Array<{
      id: string;
      name: string;
      status: string;
      phone?: string;
      profileName?: string;
    }>>('/instance/all', 'GET');
    
    return response.map(inst => ({
      id: inst.id,
      name: inst.name,
      status: (inst.status as 'disconnected' | 'connecting' | 'connected') || 'disconnected',
      phone: inst.phone,
      profileName: inst.profileName,
    }));
  } catch (error) {
    logger.error('[UAZAPI] Failed to list instances:', error);
    return [];
  }
}

/**
 * Get or create instance for an establishment
 */
export async function getOrCreateInstance(establishmentId: number, establishmentName: string): Promise<{
  success: boolean;
  instanceId?: string;
  instanceToken?: string;
  message?: string;
}> {
  const instanceName = `cardapio_${establishmentId}`;
  
  // First, check if instance already exists
  const instances = await listInstances();
  const existing = instances.find(i => i.name === instanceName);
  
  if (existing) {
    // Instance exists, return its token
    logger.info('[UAZAPI] Instance already exists:', { instanceId: existing.id, hasToken: !!existing.token });
    return {
      success: true,
      instanceId: existing.id,
      instanceToken: existing.token, // Token vem da lista de instâncias
      message: 'Instance already exists',
    };
  }
  
  // Create new instance
  return createInstance(establishmentId, establishmentName);
}

/**
 * Connect instance to WhatsApp (generates QR code)
 */
export async function connectInstance(instanceToken: string): Promise<ConnectResponse> {
  try {
    const response = await makeInstanceRequest<{
      status?: { connected?: boolean };
      instance?: { status?: string; qrcode?: string; paircode?: string };
      qrcode?: string;
      pairingCode?: string;
      response?: string;
      message?: string;
    }>(instanceToken, '/instance/connect', 'POST', {});
    
    // A API pode retornar qrcode em diferentes lugares
    const qrcode = response.qrcode || response.instance?.qrcode;
    const pairingCode = response.pairingCode || response.instance?.paircode;
    const status = response.instance?.status || (response.status?.connected ? 'connected' : 'connecting');
    
    logger.info('[UAZAPI] Connect response:', { hasQrcode: !!qrcode, status });
    
    return {
      success: true,
      status: (status as 'disconnected' | 'connecting' | 'connected') || 'connecting',
      qrcode,
      pairingCode,
      message: response.response || response.message,
    };
  } catch (error) {
    return {
      success: false,
      status: 'disconnected',
      message: error instanceof Error ? error.message : 'Failed to connect',
    };
  }
}

/**
 * Get instance status
 */
export async function getInstanceStatus(instanceToken: string): Promise<StatusResponse> {
  try {
    const response = await makeInstanceRequest<{
      instance?: {
        status?: string;
        qrcode?: string;
        paircode?: string;
        profileName?: string;
        owner?: string;
      };
      status?: { connected?: boolean; jid?: string; loggedIn?: boolean };
      qrcode?: string;
      pairingCode?: string;
      phone?: string;
      name?: string;
      message?: string;
    }>(instanceToken, '/instance/status', 'GET');
    
    // A API retorna status em diferentes lugares
    const isConnected = response.status?.connected || response.instance?.status === 'connected';
    const status = isConnected ? 'connected' : (response.instance?.status as 'disconnected' | 'connecting' | 'connected') || 'disconnected';
    const phone = response.instance?.owner || response.phone;
    const name = response.instance?.profileName || response.name;
    const qrcode = response.instance?.qrcode || response.qrcode;
    
    logger.info('[UAZAPI] Status response:', { status, isConnected, phone, name });
    
    return {
      success: true,
      status,
      qrcode,
      pairingCode: response.instance?.paircode || response.pairingCode,
      phone,
      name,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      status: 'disconnected',
      message: error instanceof Error ? error.message : 'Failed to get status',
    };
  }
}

/**
 * Disconnect instance from WhatsApp
 */
export async function disconnectInstance(instanceToken: string): Promise<{ success: boolean; message?: string }> {
  try {
    await makeInstanceRequest(instanceToken, '/instance/disconnect', 'POST');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to disconnect',
    };
  }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(
  instanceToken: string,
  phone: string,
  text: string
): Promise<SendTextResponse> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    logger.info('[UAZAPI] Enviando mensagem de texto para:', formattedPhone, '| tamanho:', text.length, 'chars');
    
    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/text', 'POST', {
      number: formattedPhone,
      text: text,
      delay: 1000, // 1 second delay to show "typing..."
    });
    
    logger.info('[UAZAPI] ✅ Mensagem enviada com sucesso:', { phone: formattedPhone, messageId: response.id });
    
    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    logger.error('[UAZAPI] ❌ Falha ao enviar mensagem:', { phone, error: error instanceof Error ? error.message : error });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Send an image/media message via WhatsApp.
 * Used for PIX QR Code delivery; do not log the base64 payload.
 */
export async function sendImageMessage(
  instanceToken: string,
  phone: string,
  base64: string,
  caption?: string
): Promise<SendImageResponse> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');

    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    const normalizedBase64 = base64.includes(',') ? base64.split(',').pop() || base64 : base64;

    logger.info('[UAZAPI] Enviando imagem para:', formattedPhone, '| caption:', caption ? 'sim' : 'não');

    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/media', 'POST', {
      number: formattedPhone,
      type: 'image',
      file: normalizedBase64,
      mimetype: 'image/png',
      text: caption,
      delay: 1000,
    }, { timeoutMs: Number.isFinite(UAZAPI_MEDIA_TIMEOUT_MS) && UAZAPI_MEDIA_TIMEOUT_MS > 0 ? UAZAPI_MEDIA_TIMEOUT_MS : 30000 });

    logger.info('[UAZAPI] ✅ Imagem enviada com sucesso:', { phone: formattedPhone, messageId: response.id });

    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    logger.error('[UAZAPI] ❌ Falha ao enviar imagem:', { phone, error: error instanceof Error ? error.message : error });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send image',
    };
  }
}

/**
 * Get greeting based on current time (Brazil timezone)
 */
function getGreeting(timezone: string = 'America/Sao_Paulo'): string {
  const now = new Date();
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const hour = localDate.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
}

/**
 * Generate order status message based on template
 */
export function generateStatusMessage(
  status: 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled',
  orderNumber: string,
  customerName: string,
  establishmentName: string,
  template?: string | null,
  deliveryType?: 'delivery' | 'pickup' | 'dine_in' | null,
  cancellationReason?: string | null,
  orderItems?: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements?: Array<{ name: string; price: number }> | string | null;
    notes?: string | null;
  }> | null,
  orderTotal?: string | null,
  timezone?: string,
  paymentMethod?: string | null,
  schedulingInfo?: {
    isScheduled: boolean;
    scheduledDate: string;
    scheduledTime: string;
  },
  cashbackInfo?: {
    cashbackEarned: string;
    cashbackTotal: string;
  } | null,
  customerAddress?: string | null,
  changeAmount?: string | null,
  deliveryFee?: string | null,
  customerPhone?: string | null
): string {
  // Default templates
  const defaultTemplates: Record<string, string> = {
    new: `Olá {{customerName}}! 🎉 {{greeting}}!\n\nSeu pedido *{{orderNumber}}* foi recebido com sucesso! ✅\n\n{{itensPedido}}\n\n{{deliveryFee}}\n{{totalPagamento}}\n\n{{customerAddress}}\n{{customerPhone}}\n\nAguarde, em breve começaremos a preparar. 😋\n\n*{{establishmentName}}*`,
    preparing: `Olá {{customerName}}! 👨‍🍳\n\nSeu pedido {{orderNumber}} está sendo preparado!\n\nEm breve estará pronto.\n\n{{establishmentName}}`,
    ready: `Olá {{customerName}}! ✅\n\nSeu pedido {{orderNumber}} está pronto!\n\nVocê já pode retirar ou aguardar a entrega.\n\n{{establishmentName}}`,
    out_for_delivery: `Olá {{customerName}}! 🛵\n\nSeu pedido {{orderNumber}} saiu para entrega!\n\nEm breve chegará até você. Aguarde! 😊\n\n{{establishmentName}}`,
    completed: `Seu pedido {{orderNumber}} foi finalizado!\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*`,
    cancelled: `Olá {{customerName}}! ❌\n\nInfelizmente seu pedido {{orderNumber}} foi cancelado.\n\nMotivo: {{cancellationReason}}\n\n{{establishmentName}}`,
  };
  
  let messageTemplate = template || defaultTemplates[status] || defaultTemplates.new;
  
  // Substituir variáveis de tipo de entrega para status "ready"
  if (status === 'ready') {
    // {{deliveryMessage}} → exclusivamente para pedidos delivery
    const deliveryMessage = '🛵 Nosso entregador já está a caminho.';
    messageTemplate = messageTemplate.replace(/{{deliveryMessage}}/g, deliveryMessage);
    
    // {{pickupMessage}} → para pedidos de retirada ou consumo no local
    const pickupMsg = deliveryType === 'dine_in' 
      ? 'Seu pedido está pronto! 🍽️' 
      : 'Você já pode vir retirar. 😄';
    messageTemplate = messageTemplate.replace(/{{pickupMessage}}/g, pickupMsg);
  }
  
  // Substituir variável de motivo de cancelamento
  if (status === 'cancelled') {
    const reason = cancellationReason || 'Não informado';
    messageTemplate = messageTemplate.replace(/{{cancellationReason}}/g, reason);
  }
  
  // Substituir variável de saudação baseada no horário
  const greeting = getGreeting(timezone);
  messageTemplate = messageTemplate.replace(/{{greeting}}/g, greeting);
  
  // Gerar texto dos itens do pedido (sem preço individual, apenas total no final)
  let itensPedidoText = '';
  if (orderItems && orderItems.length > 0) {
    itensPedidoText = '📦 *Itens do pedido:*\n\n' + orderItems.map(item => {
      let itemText = `*${item.quantity}x ${item.productName}*`;
      
      // Adicionar complementos se existirem
      if (item.complements) {
        let complementsArray: Array<{ name: string; price: number; quantity?: number }> = [];
        if (typeof item.complements === 'string') {
          try {
            complementsArray = JSON.parse(item.complements);
          } catch (e) {
            // Se não for JSON válido, ignorar
          }
        } else if (Array.isArray(item.complements)) {
          complementsArray = item.complements;
        }
        
        if (complementsArray.length > 0) {
          const complementsText = complementsArray.map(c => {
            const qty = c.quantity || 1;
            if (qty > 1) {
              return `  ↳ ${qty}x ${c.name}`;
            }
            return `  ↳ ${c.name}`;
          }).join('\n');
          itemText += '\n' + complementsText;
        }
      }
      
      // Adicionar observações se existirem
      if (item.notes) {
        itemText += `\n  📝 ${item.notes}`;
      }
      
      return itemText;
    }).join('\n\n');
  }
  
  // Adicionar info de agendamento se for pedido agendado
  let schedulingText = '';
  if (schedulingInfo?.isScheduled) {
    schedulingText = `\n\n📅 *Pedido Agendado*\n📆 Data: ${schedulingInfo.scheduledDate}\n⏰ Horário: ${schedulingInfo.scheduledTime}`;
  }
  
  // Gerar bloco de cashback se disponível e status for completed
  let cashbackText = '';
  if (status === 'completed' && cashbackInfo && parseFloat(cashbackInfo.cashbackEarned) > 0) {
    const earned = parseFloat(cashbackInfo.cashbackEarned).toFixed(2).replace('.', ',');
    const total = parseFloat(cashbackInfo.cashbackTotal).toFixed(2).replace('.', ',');
    cashbackText = `\n\n💰 *Cashback*\nCashback ganho: R$${earned}\nCashback acumulado: R$${total}`;
  }
  
  // Substituir variáveis de cashback no template (se o template usar as variáveis)
  if (cashbackInfo) {
    const earned = parseFloat(cashbackInfo.cashbackEarned).toFixed(2).replace('.', ',');
    const total = parseFloat(cashbackInfo.cashbackTotal).toFixed(2).replace('.', ',');
    messageTemplate = messageTemplate
      .replace(/{{cashbackEarned}}/g, `Cashback ganho: R$${earned}`)
      .replace(/{{cashbackTotal}}/g, `Cashback acumulado: R$${total}`);
  } else {
    // Remover variáveis de cashback se não houver dados
    messageTemplate = messageTemplate
      .replace(/{{cashbackEarned}}/g, '')
      .replace(/{{cashbackTotal}}/g, '');
  }
  
  const templateUsesDeliveryFee = messageTemplate.includes('{{deliveryFee}}');
  const templateUsesTotalPagamento = messageTemplate.includes('{{totalPagamento}}');

  // Gerar bloco de taxa de entrega para a variável {{deliveryFee}}
  let deliveryFeeText = '';
  const feeValue = parseFloat(deliveryFee || '0');
  if (feeValue > 0) {
    deliveryFeeText = `🛵 Taxa de entrega: *R$ ${feeValue.toFixed(2).replace('.', ',')}*`;
  } else if (deliveryType === 'delivery') {
    deliveryFeeText = `🛵 Taxa de entrega: *Grátis*`;
  }
  messageTemplate = messageTemplate.replace(/{{deliveryFee}}/g, deliveryFeeText);
  
  // Gerar bloco de total + pagamento para a variável {{totalPagamento}}
  let totalPagamentoText = '';
  if (orderTotal) {
    totalPagamentoText += `\ud83e\uddfe *Total: R$ ${parseFloat(orderTotal).toFixed(2).replace('.', ',')}*`;
  }
  if (paymentMethod) {
    const paymentLabels2: Record<string, string> = {
      'pix': 'PIX',
      'credit': 'Cart\u00e3o',
      'debit': 'Cart\u00e3o',
      'card': 'Cart\u00e3o',
      'credit_card': 'Cart\u00e3o',
      'debit_card': 'Cart\u00e3o',
      'cash': 'Dinheiro',
      'online': 'Cart\u00e3o Online',
      'credit_online': 'Cart\u00e3o Online',
      'meal_voucher': 'Vale Refei\u00e7\u00e3o',
    };
    const paymentLabel2 = paymentLabels2[paymentMethod] || paymentMethod;
    if (totalPagamentoText) totalPagamentoText += '\n';
    totalPagamentoText += `\ud83d\udcb0 Pagamento via: *${paymentLabel2}*`;

    if (paymentMethod === 'cash') {
      const changeValue = parseFloat(changeAmount || '0');
      if (changeValue > 0 && orderTotal) {
        const totalValue = parseFloat(orderTotal);
        const trocoDevolver = changeValue - totalValue;
        totalPagamentoText += `\n💵 Troco para R$ ${changeValue.toFixed(2).replace('.', ',')}`;
        if (trocoDevolver > 0) {
          totalPagamentoText += `\n🔰 Troco a devolver R$ ${trocoDevolver.toFixed(2).replace('.', ',')}`;
        }
      } else {
        totalPagamentoText += `\n💵 Não precisa de troco`;
      }
    }
  }
  
  // Compatibilidade com templates antigos que usavam apenas {{itensPedido}}.
  // Evita duplicação quando o template já possui {{deliveryFee}} ou {{totalPagamento}} separados.
  if (itensPedidoText) {
    if (deliveryFeeText && !templateUsesDeliveryFee) {
      itensPedidoText += `\n\n${deliveryFeeText}`;
    }
    if (totalPagamentoText && !templateUsesTotalPagamento) {
      itensPedidoText += `\n${totalPagamentoText}`;
    }
  }

  // Substituir variável {{totalPagamento}} ou remover se vazia
  messageTemplate = messageTemplate.replace(/{{totalPagamento}}/g, totalPagamentoText);
  
  // Gerar bloco de endereço formatado para WhatsApp (com asteriscos para negrito)
  let customerAddressText = '';
  if (customerAddress && customerAddress.trim()) {
    // Parse address: "Rua X, 123 - Complemento, Bairro Y (Ref: ponto ref)"
    const addr = customerAddress.trim();
    
    // Extrair referência (Ref: ...)
    let reference = '';
    let addrWithoutRef = addr;
    const refMatch = addr.match(/\(Ref:\s*(.+?)\)/);
    if (refMatch) {
      reference = refMatch[1].trim();
      addrWithoutRef = addr.replace(/\s*\(Ref:\s*.+?\)/, '').trim();
    }
    
    // Separar por vírgulas
    const parts = addrWithoutRef.split(',').map(p => p.trim()).filter(Boolean);
    
    let street = '';
    let number = '';
    let complement = '';
    let neighborhood = '';
    
    if (parts.length >= 1) {
      // Primeira parte: rua (pode conter " - complemento")
      const firstPart = parts[0];
      street = firstPart;
    }
    if (parts.length >= 2) {
      // Segunda parte: número (pode conter " - complemento")
      const secondPart = parts[1];
      if (secondPart.includes(' - ')) {
        const [num, comp] = secondPart.split(' - ').map(s => s.trim());
        number = num;
        complement = comp;
      } else {
        number = secondPart;
      }
    }
    if (parts.length >= 3) {
      // Terceira parte: bairro (ou complemento se não detectado)
      const thirdPart = parts[2];
      if (thirdPart.includes(' - ') && !complement) {
        const [comp, bairro] = thirdPart.split(' - ').map(s => s.trim());
        complement = comp;
        neighborhood = bairro;
      } else {
        neighborhood = thirdPart;
      }
    }
    if (parts.length >= 4 && !neighborhood) {
      neighborhood = parts[3];
    }
    
    // Montar bloco formatado
    const lines: string[] = [];
    lines.push('\ud83d\udccc *Endere\u00e7o:*');
    if (street) {
      lines.push(`*Rua:* ${street}${number ? ' | N.\u00ba ' + number : ''}`);
    }
    if (neighborhood) {
      lines.push(`*Bairro:* ${neighborhood}`);
    }
    if (complement) {
      lines.push(`*Complemento:* ${complement}`);
    }
    if (reference) {
      lines.push(`*Ponto de refer\u00eancia:* ${reference}`);
    }
    
    customerAddressText = lines.join('\n');
  }
  
  // Substituir variável {{customerAddress}} ou remover se vazia
  messageTemplate = messageTemplate.replace(/{{customerAddress}}/g, customerAddressText);

  // Gerar bloco de telefone do cliente para a variável {{customerPhone}}
  const customerPhoneText = customerPhone && customerPhone.trim()
    ? `📞 Telefone: ${customerPhone.trim()}`
    : '';
  messageTemplate = messageTemplate.replace(/{{customerPhone}}/g, customerPhoneText);
  
  // Limpar linhas em branco consecutivas (mais de 2 quebras de linha seguidas)
  messageTemplate = messageTemplate.replace(/\n{3,}/g, '\n\n');
  
  let result = messageTemplate
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{establishmentName}}/g, establishmentName)
    .replace(/{{itensPedido}}/g, itensPedidoText)
    .replace(/{{agendamento}}/g, schedulingText)
    + (schedulingInfo?.isScheduled && !messageTemplate.includes('{{agendamento}}') ? schedulingText : '');
  
  // Append cashback block if template doesn't use {{cashbackEarned}} variable
  if (status === 'completed' && cashbackInfo && parseFloat(cashbackInfo.cashbackEarned) > 0 && !template?.includes('{{cashbackEarned}}')) {
    result += cashbackText;
  }
  
  // Limpar linhas em branco consecutivas no resultado final e trim
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  
  return result;
}

/**
 * Send order status notification via WhatsApp
 */
export async function sendOrderStatusNotification(
  instanceToken: string,
  phone: string,
  status: 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled',
  data: {
    customerName: string;
    orderNumber: string;
    establishmentName: string;
    template?: string | null;
    deliveryType?: 'delivery' | 'pickup' | 'dine_in' | null;
    cancellationReason?: string | null;
    orderItems?: Array<{
      productName: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      complements?: Array<{ name: string; price: number }> | string | null;
      notes?: string | null;
    }> | null;
    orderTotal?: string | null;
    timezone?: string;
    paymentMethod?: string | null;
    schedulingInfo?: {
      isScheduled: boolean;
      scheduledDate: string;
      scheduledTime: string;
    };
    cashbackInfo?: {
      cashbackEarned: string;
      cashbackTotal: string;
    } | null;
    customerAddress?: string | null;
    changeAmount?: string | null;
    deliveryFee?: string | null;
    customerPhone?: string | null;
  }
): Promise<SendTextResponse> {
  const message = generateStatusMessage(
    status,
    data.orderNumber,
    data.customerName,
    data.establishmentName,
    data.template,
    data.deliveryType,
    data.cancellationReason,
    data.orderItems,
    data.orderTotal,
    data.timezone,
    data.paymentMethod,
    data.schedulingInfo,
    data.cashbackInfo,
    data.customerAddress,
    data.changeAmount,
    data.deliveryFee,
    data.customerPhone
  );
  
  return sendTextMessage(instanceToken, phone, message);
}


/**
 * Send a message with interactive buttons via WhatsApp
 * Used for order confirmation flow
 */
export async function sendButtonMessage(
  instanceToken: string,
  phone: string,
  text: string,
  buttons: Array<{ text: string; id: string }>,
  footerText?: string
): Promise<SendTextResponse> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    // Format buttons for UAZAPI: "texto|id"
    const choices = buttons.map(btn => `${btn.text}|${btn.id}`);
    
    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/menu', 'POST', {
      number: formattedPhone,
      type: 'button',
      text: text,
      choices: choices,
      footerText: footerText || '',
      delay: 1000,
    });
    
    logger.info('[UAZAPI] Button message sent:', { phone: formattedPhone, buttonsCount: buttons.length });
    
    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    logger.error('[UAZAPI] Failed to send button message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send button message',
    };
  }
}

/**
 * Send order confirmation request with buttons
 */
export async function sendOrderConfirmationRequest(
  instanceToken: string,
  phone: string,
  data: {
    customerName: string;
    orderNumber: string;
    establishmentName: string;
    orderItems: Array<{
      productName: string;
      quantity: number;
      unitPrice?: string;
      totalPrice?: string;
      complements?: Array<{ name: string; price: number }> | string | null;
      notes?: string | null;
    }>;
    orderTotal: string;
    template?: string | null;
    timezone?: string;
    paymentMethod?: string | null;
  }
): Promise<SendTextResponse> {
  const message = generateStatusMessage(
    'new',
    data.orderNumber,
    data.customerName,
    data.establishmentName,
    data.template,
    undefined, // deliveryType
    undefined, // cancellationReason
    data.orderItems.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice || '0',
      totalPrice: item.totalPrice || '0',
      complements: item.complements,
      notes: item.notes,
    })),
    data.orderTotal,
    data.timezone,
    data.paymentMethod
  );

  // Button for confirmation (only confirm button)
  const buttons = [
    { text: '✅ Sim, Confirmo o Pedido.', id: `confirm_order_${data.orderNumber}` },
  ];

  return sendButtonMessage(
    instanceToken,
    phone,
    message,
    buttons,
    'Clique para confirmar seu pedido'
  );
}

/**
 * Validate a CPF number using the official check digit algorithm.
 * Returns true only if the 11-digit string passes both check digit validations.
 * This is used to distinguish CPF keys from phone numbers (both have 11 digits).
 */
function isValidCPF(cpf: string): boolean {
  // Must be exactly 11 digits
  if (cpf.length !== 11) return false;
  
  // Reject known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Send a PIX copy button via WhatsApp
 * Uses UAZAPI native /send/pix-button endpoint that creates a WhatsApp native PIX button
 * When the client taps the button, the PIX key is copied to clipboard
 */
export async function sendPixButton(
  instanceToken: string,
  phone: string,
  pixKey: string,
  pixKeyType?: string,
  pixName?: string
): Promise<SendTextResponse> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    // Detect PIX key type if not provided
    let pixType = pixKeyType || 'EVP';
    if (!pixKeyType) {
      const cleanKey = pixKey.replace(/\D/g, '');
      if (pixKey.includes('@')) {
        pixType = 'EMAIL';
      } else if (cleanKey.length === 11 && !pixKey.includes('+')) {
        // Both CPF and phone have 11 digits - use CPF validation to distinguish
        pixType = isValidCPF(cleanKey) ? 'CPF' : 'PHONE';
      } else if (cleanKey.length === 14) {
        pixType = 'CNPJ';
      } else if (cleanKey.length === 10 && !pixKey.includes('+')) {
        // 10 digits = landline phone (DDD + 8 digits)
        pixType = 'PHONE';
      } else if (cleanKey.length === 13 && cleanKey.startsWith('55')) {
        // 13 digits starting with 55 = phone with country code (55 + DDD + 9xxxx-xxxx)
        pixType = 'PHONE';
      } else if (cleanKey.length === 12 && cleanKey.startsWith('55')) {
        // 12 digits starting with 55 = landline with country code (55 + DDD + xxxx-xxxx)
        pixType = 'PHONE';
      } else if (pixKey.startsWith('+')) {
        pixType = 'PHONE';
      } else {
        pixType = 'EVP'; // Random key (UUID format)
      }
    }
    
    logger.info('[UAZAPI] Enviando botão PIX para:', formattedPhone, '| pixType:', pixType, '| pixKey:', pixKey);
    
    const body: Record<string, unknown> = {
      number: formattedPhone,
      pixKey: pixKey,
      pixType: pixType,
    };
    
    if (pixName) {
      body.pixName = pixName;
    }
    
    const response = await makeInstanceRequest<{
      id?: string;
      message?: string;
    }>(instanceToken, '/send/pix-button', 'POST', body);
    
    logger.info('[UAZAPI] ✅ Botão PIX enviado com sucesso:', { phone: formattedPhone, messageId: response.id });
    
    return {
      success: true,
      messageId: response.id,
      message: response.message,
    };
  } catch (error) {
    logger.error('[UAZAPI] ❌ Falha ao enviar botão PIX:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send PIX button',
    };
  }
}

/**
 * Configure webhook for an instance to receive message responses
 */
export async function configureWebhook(
  instanceToken: string,
  webhookUrl: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await makeInstanceRequest(instanceToken, '/webhook', 'POST', {
      enabled: true,
      url: webhookUrl,
      events: ['messages'],
      // NÃO excluir wasSentByApi pois respostas de botão podem ser filtradas
    });
    
    logger.info('[UAZAPI] Webhook configured:', { url: webhookUrl });
    
    return { success: true };
  } catch (error) {
    logger.error('[UAZAPI] Failed to configure webhook:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to configure webhook',
    };
  }
}


/**
 * Check if a phone number is registered on WhatsApp
 * Uses UAZAPI /chat/check endpoint
 */
export async function checkWhatsAppNumber(
  instanceToken: string,
  phone: string
): Promise<{ exists: boolean; verifiedName?: string; error?: string }> {
  try {
    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    logger.info('[UAZAPI] Verificando número no WhatsApp:', formattedPhone);
    
    const response = await makeInstanceRequest<Array<{
      query: string;
      jid?: string;
      lid?: string;
      isInWhatsapp: boolean;
      verifiedName?: string;
      error?: string;
    }>>(instanceToken, '/chat/check', 'POST', {
      numbers: [formattedPhone],
    });
    
    const result = Array.isArray(response) ? response[0] : null;
    
    if (!result) {
      return { exists: false, error: 'Resposta inválida da API' };
    }
    
    logger.info('[UAZAPI] Resultado da verificação:', {
      phone: formattedPhone,
      isInWhatsapp: result.isInWhatsapp,
      verifiedName: result.verifiedName,
    });
    
    return {
      exists: result.isInWhatsapp,
      verifiedName: result.verifiedName || undefined,
      error: result.error || undefined,
    };
  } catch (error) {
    logger.error('[UAZAPI] Falha ao verificar número:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Falha ao verificar número',
    };
  }
}

/**
 * Download media from a message using UAZAPI /message/download endpoint.
 * Returns the fileURL (public temporary URL from UAZAPI storage, valid for ~2 days).
 */
export async function downloadMedia(
  instanceToken: string,
  messageId: string,
  options?: { generateMp3?: boolean }
): Promise<{ fileURL?: string; mimetype?: string; error?: string }> {
  try {
    logger.info('[UAZAPI] Downloading media for message:', messageId);
    
    const response = await makeInstanceRequest<{
      fileURL?: string;
      mimetype?: string;
      base64Data?: string;
      error?: string;
    }>(instanceToken, '/message/download', 'POST', {
      id: messageId,
      return_link: true,
      return_base64: false,
      generate_mp3: options?.generateMp3 ?? true,
    });
    
    if (response.fileURL) {
      logger.info('[UAZAPI] Media downloaded successfully:', {
        messageId,
        mimetype: response.mimetype,
        hasFileURL: true,
      });
      return {
        fileURL: response.fileURL,
        mimetype: response.mimetype,
      };
    }
    
    logger.warn('[UAZAPI] No fileURL in download response:', { messageId, response });
    return { error: 'No fileURL in response' };
  } catch (error) {
    logger.error('[UAZAPI] Failed to download media:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to download media',
    };
  }
}
