import crypto from 'crypto';
import { ENV } from './env';
import { logger } from './logger';

const GRAPH = 'https://graph.facebook.com/v22.0';

// ─── types ────────────────────────────────────────────────────────────────────

export interface OfficialConfig {
  phoneNumberId: string;
  accessToken: string;
}

interface GraphMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string; message_status?: string }>;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function phoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

async function graphPost<T>(path: string, token: string, body: object): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as T & { error?: { message: string; code: number } };

  if (!res.ok || (data as any).error) {
    const err = (data as any).error;
    throw new Error(`[Meta API] ${err?.message ?? res.statusText} (code ${err?.code ?? res.status})`);
  }

  return data;
}

// ─── embedded signup ──────────────────────────────────────────────────────────

/**
 * Troca o código curto do Embedded Signup por um token de acesso de longa duração,
 * e retorna o WABA ID, Phone Number ID e Business ID do estabelecimento conectado.
 */
export async function exchangeCodeForToken(
  code: string,
  knownIds?: { wabaId?: string; phoneNumberId?: string; businessId?: string },
): Promise<{
  accessToken: string;
  wabaId: string;
  phoneNumberId: string;
  phoneNumber: string;
  businessId: string;
}> {
  // 1. code → user access token
  const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', ENV.metaAppId);
  tokenUrl.searchParams.set('client_secret', ENV.metaAppSecret);
  tokenUrl.searchParams.set('code', code);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

  if (!tokenData.access_token) {
    throw new Error(`[Meta] Falha na troca de código: ${tokenData.error?.message ?? 'resposta inválida'}`);
  }

  const shortLivedToken = tokenData.access_token;

  // 1b. exchange short-lived token (~1h) for long-lived token (~60 days)
  const longLivedUrl = new URL(`${GRAPH}/oauth/access_token`);
  longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
  longLivedUrl.searchParams.set('client_id', ENV.metaAppId);
  longLivedUrl.searchParams.set('client_secret', ENV.metaAppSecret);
  longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

  const longLivedRes = await fetch(longLivedUrl.toString());
  const longLivedData = await longLivedRes.json() as { access_token?: string; error?: { message: string } };
  const accessToken = longLivedData.access_token ?? shortLivedToken;

  // Fast path: the Embedded Signup postMessage already provided wabaId and phoneNumberId.
  // The token from this flow lacks whatsapp_business_management permission, so
  // /me/whatsapp_business_accounts returns error 100. Use the IDs directly instead.
  if (knownIds?.wabaId && knownIds?.phoneNumberId) {
    let phoneNumber = '';
    try {
      const phoneRes = await fetch(
        `${GRAPH}/${knownIds.phoneNumberId}?fields=display_phone_number&access_token=${accessToken}`,
      );
      const phoneData = await phoneRes.json() as { display_phone_number?: string };
      phoneNumber = phoneData.display_phone_number ?? '';
    } catch {
      // non-critical — display number is cosmetic
    }
    return {
      accessToken,
      wabaId: knownIds.wabaId,
      phoneNumberId: knownIds.phoneNumberId,
      phoneNumber,
      businessId: knownIds.businessId ?? '',
    };
  }

  // Fallback path: discover WABA via Graph API (requires whatsapp_business_management scope)
  // 2. buscar WABAs vinculadas ao usuário
  const wabaRes = await fetch(`${GRAPH}/me/whatsapp_business_accounts?fields=id,name,business&access_token=${accessToken}`);
  const wabaData = await wabaRes.json() as {
    data?: Array<{ id: string; name: string; business?: { id: string } }>;
    error?: { message: string };
  };

  const waba = wabaData.data?.[0];
  if (!waba) {
    throw new Error(`[Meta] Nenhuma WABA encontrada para o token fornecido`);
  }

  const wabaId = waba.id;
  const businessId = waba.business?.id ?? '';

  // 3. buscar número de telefone associado à WABA
  const phoneRes = await fetch(`${GRAPH}/${wabaId}/phone_numbers?fields=id,display_phone_number&access_token=${accessToken}`);
  const phoneData = await phoneRes.json() as {
    data?: Array<{ id: string; display_phone_number: string }>;
  };

  const phone = phoneData.data?.[0];
  if (!phone) {
    throw new Error(`[Meta] Nenhum número encontrado para a WABA ${wabaId}`);
  }

  return {
    accessToken,
    wabaId,
    phoneNumberId: phone.id,
    phoneNumber: phone.display_phone_number,
    businessId,
  };
}

/**
 * Inscreve a WABA nos eventos de webhook do app (mensagens + status).
 * Precisa ser chamado uma vez após o Embedded Signup.
 */
export async function subscribeWabaWebhook(wabaId: string, token: string): Promise<boolean> {
  try {
    await graphPost(`/${wabaId}/subscribed_apps`, token, {});
    logger.info('[Meta] Webhook inscrito para WABA:', wabaId);
    return true;
  } catch (err) {
    logger.error('[Meta] Falha ao inscrever webhook:', err);
    return false;
  }
}

// ─── messaging ────────────────────────────────────────────────────────────────

/**
 * Envia mensagem de texto simples (funciona dentro da janela de 24h do cliente).
 * Fora dessa janela use sendTemplateMessage.
 */
export async function sendTextMessage(
  config: OfficialConfig,
  to: string,
  text: string,
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const data = await graphPost<GraphMessageResponse>(
      `/${config.phoneNumberId}/messages`,
      config.accessToken,
      {
        messaging_product: 'whatsapp',
        to: phoneE164(to),
        type: 'text',
        text: { body: text, preview_url: false },
      },
    );
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    logger.error('[Meta] sendTextMessage falhou:', err);
    return { success: false };
  }
}

/**
 * Envia uma mensagem usando um template pré-aprovado pela Meta.
 * components segue o formato da Graph API:
 * [{ type: 'body', parameters: [{ type: 'text', text: 'valor' }] }]
 */
export async function sendTemplateMessage(
  config: OfficialConfig,
  to: string,
  templateName: string,
  components: object[],
  languageCode = 'pt_BR',
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const data = await graphPost<GraphMessageResponse>(
      `/${config.phoneNumberId}/messages`,
      config.accessToken,
      {
        messaging_product: 'whatsapp',
        to: phoneE164(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
    );
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    logger.error('[Meta] sendTemplateMessage falhou:', { templateName, err });
    return { success: false };
  }
}

/**
 * Envia mensagem interativa com botões de resposta rápida (máximo 3).
 * Equivalente ao sendButtonMessage do UAZAPI.
 */
export async function sendButtonMessage(
  config: OfficialConfig,
  to: string,
  body: string,
  buttons: Array<{ text: string; id: string }>,
): Promise<{ success: boolean; messageId?: string }> {
  if (buttons.length > 3) {
    logger.warn('[Meta] sendButtonMessage: máximo de 3 botões, truncando lista');
    buttons = buttons.slice(0, 3);
  }

  try {
    const data = await graphPost<GraphMessageResponse>(
      `/${config.phoneNumberId}/messages`,
      config.accessToken,
      {
        messaging_product: 'whatsapp',
        to: phoneE164(to),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: body },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: { id: btn.id, title: btn.text.slice(0, 20) }, // título limitado a 20 chars
            })),
          },
        },
      },
    );
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    logger.error('[Meta] sendButtonMessage falhou:', err);
    return { success: false };
  }
}

/**
 * Faz download de mídia usando o media ID retornado pelo webhook.
 * Retorna a URL pública temporária da mídia.
 */
export async function downloadMedia(
  config: OfficialConfig,
  mediaId: string,
): Promise<{ fileURL?: string; mimetype?: string; error?: string }> {
  try {
    // 1. buscar metadados (URL + mimetype)
    const metaRes = await fetch(`${GRAPH}/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    });
    const meta = await metaRes.json() as { url?: string; mime_type?: string; error?: { message: string } };

    if (!meta.url) {
      return { error: meta.error?.message ?? 'URL de mídia não encontrada' };
    }

    // 2. a URL em meta.url já é a URL de download — retornar direto
    return { fileURL: meta.url, mimetype: meta.mime_type };
  } catch (err) {
    logger.error('[Meta] downloadMedia falhou:', err);
    return { error: err instanceof Error ? err.message : 'Falha ao baixar mídia' };
  }
}

/**
 * Marca uma mensagem recebida como lida.
 * Bom para manter o indicador de leitura correto no WhatsApp do cliente.
 */
export async function markAsRead(
  config: OfficialConfig,
  messageId: string,
): Promise<void> {
  try {
    await graphPost(`/${config.phoneNumberId}/messages`, config.accessToken, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  } catch (err) {
    // não crítico — só logar
    logger.warn('[Meta] markAsRead falhou:', err);
  }
}

// ─── webhook ──────────────────────────────────────────────────────────────────

/**
 * Verifica a assinatura HMAC-SHA256 do cabeçalho X-Hub-Signature-256.
 * Usa comparação resistente a timing attacks.
 */
export function verifyMetaSignature(payload: string, signature: string, appSecret: string): boolean {
  if (!signature?.startsWith('sha256=')) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');

  const received = signature.slice(7); // remove 'sha256='

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}
