import { describe, it, expect } from 'vitest';

/**
 * Tests for the improved message text extraction logic in the webhook handler.
 * 
 * The webhook receives messages in various formats depending on the message type:
 * - Regular text: message.text, message.body, or message.conversation
 * - Button/interactive messages: message.contentText, message.description, message.title, etc.
 * - Template messages: message.hydratedTemplate.hydratedContentText
 * 
 * The extraction logic must try all possible fields to capture the full message content.
 */

// Simulate the message text extraction logic from server/_core/index.ts
function extractMessageText(message: Record<string, any> | null | undefined, body?: Record<string, any>): string | undefined {
  return message?.text 
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
}

// Simulate the buttonDisplayText fallback from server/_core/index.ts
function generateButtonDisplayText(buttonId: string | null | undefined, messageText: string | undefined): string {
  if (!buttonId || messageText) return '';
  const deliveryStartBtn = buttonId.match(/delivery_start_(#P\d+)/);
  const deliveryDoneBtn = buttonId.match(/delivery_done_(#P\d+)/);
  const confirmBtn = buttonId.match(/confirm_order_(#P\d+)/);
  const cancelBtn = buttonId.match(/cancel_order_(#P\d+)/);
  if (deliveryStartBtn) return `🛵 Sair para entrega (${deliveryStartBtn[1]})`;
  if (deliveryDoneBtn) return `✅ O pedido foi entregue (${deliveryDoneBtn[1]})`;
  if (confirmBtn) return `✅ Pedido confirmado (${confirmBtn[1]})`;
  if (cancelBtn) return `❌ Pedido cancelado (${cancelBtn[1]})`;
  return `🔘 ${buttonId}`;
}

describe('Message Text Extraction', () => {
  it('should extract text from regular text message', () => {
    const message = { text: 'Olá, tudo bem?', type: 'text', fromMe: false };
    expect(extractMessageText(message)).toBe('Olá, tudo bem?');
  });

  it('should extract text from body field', () => {
    const message = { body: 'Mensagem via body', type: 'text' };
    expect(extractMessageText(message)).toBe('Mensagem via body');
  });

  it('should extract text from conversation field', () => {
    const message = { conversation: 'Conversa simples', type: 'text' };
    expect(extractMessageText(message)).toBe('Conversa simples');
  });

  it('should extract text from caption field (media with caption)', () => {
    const message = { caption: 'Foto do produto', type: 'image' };
    expect(extractMessageText(message)).toBe('Foto do produto');
  });

  it('should extract text from contentText field (button message)', () => {
    const message = { contentText: '🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P3', type: 'buttonsMessage', fromMe: true };
    expect(extractMessageText(message)).toBe('🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P3');
  });

  it('should extract text from description field (interactive message)', () => {
    const message = { description: '🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P5', type: 'interactive', fromMe: true };
    expect(extractMessageText(message)).toBe('🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P5');
  });

  it('should extract text from title field', () => {
    const message = { title: '🛵 NOVA ENTREGA!', type: 'interactive', fromMe: true };
    expect(extractMessageText(message)).toBe('🛵 NOVA ENTREGA!');
  });

  it('should extract text from buttonsMessage.contentText', () => {
    const message = { 
      buttonsMessage: { contentText: '🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P7' },
      type: 'buttonsMessage',
      fromMe: true 
    };
    expect(extractMessageText(message)).toBe('🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P7');
  });

  it('should extract text from interactiveMessage.body.text', () => {
    const message = { 
      interactiveMessage: { body: { text: '🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P8' } },
      type: 'interactive',
      fromMe: true 
    };
    expect(extractMessageText(message)).toBe('🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P8');
  });

  it('should extract text from listMessage.description', () => {
    const message = { 
      listMessage: { description: 'Escolha uma opção:' },
      type: 'list',
      fromMe: true 
    };
    expect(extractMessageText(message)).toBe('Escolha uma opção:');
  });

  it('should extract text from hydratedTemplate.hydratedContentText', () => {
    const message = { 
      hydratedTemplate: { hydratedContentText: 'Seu pedido foi confirmado!' },
      type: 'templateMessage',
      fromMe: true 
    };
    expect(extractMessageText(message)).toBe('Seu pedido foi confirmado!');
  });

  it('should extract text from templateMessage.hydratedFourRowTemplate.hydratedContentText', () => {
    const message = { 
      templateMessage: { hydratedFourRowTemplate: { hydratedContentText: 'Template de 4 linhas' } },
      type: 'templateMessage',
      fromMe: true 
    };
    expect(extractMessageText(message)).toBe('Template de 4 linhas');
  });

  it('should fallback to body.text when message fields are empty', () => {
    const message = { type: 'interactive', fromMe: true };
    const body = { text: 'Texto no body raiz' };
    expect(extractMessageText(message, body)).toBe('Texto no body raiz');
  });

  it('should return undefined when no text is found', () => {
    const message = { type: 'image', fromMe: false };
    expect(extractMessageText(message)).toBeUndefined();
  });

  it('should prioritize message.text over other fields', () => {
    const message = { 
      text: 'Prioridade 1', 
      body: 'Prioridade 2', 
      contentText: 'Prioridade 3',
      type: 'text' 
    };
    expect(extractMessageText(message)).toBe('Prioridade 1');
  });

  it('should handle NOVA ENTREGA delivery message format', () => {
    const deliveryMessage = '🛵 *NOVA ENTREGA!*\n\n📦 Pedido: #P3\n👤 Cliente: Kelri\n📞 Telefone: 88 99929-0000\n\n📍 *Endereço:*\nfdsf, 234\nBairro do Cruzeiro\nRef: fdsf\n\n💳 Pagamento: Dinheiro\n💰 Total: R$ 92,00\n🛵 Taxa de entrega: R$ 2,00\n💵 *Troco:* Não precisa';
    
    const msg1 = { contentText: deliveryMessage, type: 'buttonsMessage', fromMe: true };
    expect(extractMessageText(msg1)).toContain('*NOVA ENTREGA!*');
    expect(extractMessageText(msg1)).toContain('Pedido: #P3');
    
    const msg2 = { buttonsMessage: { contentText: deliveryMessage }, type: 'buttonsMessage', fromMe: true };
    expect(extractMessageText(msg2)).toContain('*NOVA ENTREGA!*');
    
    const msg3 = { interactiveMessage: { body: { text: deliveryMessage } }, type: 'interactive', fromMe: true };
    expect(extractMessageText(msg3)).toContain('*NOVA ENTREGA!*');
  });

  // ===== BUTTON RESPONSE EXTRACTION =====
  it('should extract text from selectedDisplayText (button response)', () => {
    const message = { selectedDisplayText: '🛵 Sair para entrega', type: 'buttonsResponseMessage' };
    expect(extractMessageText(message)).toBe('🛵 Sair para entrega');
  });

  it('should extract text from buttonText field', () => {
    const message = { buttonText: '✅ O pedido foi entregue', type: 'buttonsResponseMessage' };
    expect(extractMessageText(message)).toBe('✅ O pedido foi entregue');
  });

  it('should extract text from buttonsResponseMessage.selectedDisplayText', () => {
    const message = { buttonsResponseMessage: { selectedDisplayText: '🛵 Sair para entrega' }, type: 'buttonsResponseMessage' };
    expect(extractMessageText(message)).toBe('🛵 Sair para entrega');
  });

  it('should extract text from listResponseMessage.title', () => {
    const message = { listResponseMessage: { title: 'Opção selecionada' }, type: 'listResponseMessage' };
    expect(extractMessageText(message)).toBe('Opção selecionada');
  });

  it('should extract text from body.selectedDisplayText fallback', () => {
    const message = { type: 'buttonsResponseMessage' };
    const body = { selectedDisplayText: '✅ O pedido foi entregue' };
    expect(extractMessageText(message, body)).toBe('✅ O pedido foi entregue');
  });

  it('should extract text from body.buttonText fallback', () => {
    const message = { type: 'buttonsResponseMessage' };
    const body = { buttonText: '🛵 Sair para entrega' };
    expect(extractMessageText(message, body)).toBe('🛵 Sair para entrega');
  });
});

/**
 * Tests for button display text fallback generation.
 * When the webhook doesn't provide any text for a button response,
 * we generate a human-readable text from the buttonId.
 */
describe('Button Display Text Fallback', () => {
  it('should generate text for delivery_start button', () => {
    expect(generateButtonDisplayText('delivery_start_#P5', undefined)).toBe('🛵 Sair para entrega (#P5)');
  });

  it('should generate text for delivery_done button', () => {
    expect(generateButtonDisplayText('delivery_done_#P5', undefined)).toBe('✅ O pedido foi entregue (#P5)');
  });

  it('should generate text for confirm_order button', () => {
    expect(generateButtonDisplayText('confirm_order_#P3', undefined)).toBe('✅ Pedido confirmado (#P3)');
  });

  it('should generate text for cancel_order button', () => {
    expect(generateButtonDisplayText('cancel_order_#P3', undefined)).toBe('❌ Pedido cancelado (#P3)');
  });

  it('should generate generic text for unknown button', () => {
    expect(generateButtonDisplayText('some_custom_button', undefined)).toBe('🔘 some_custom_button');
  });

  it('should return empty string when messageText already exists', () => {
    expect(generateButtonDisplayText('delivery_start_#P5', '🛵 Sair para entrega')).toBe('');
  });

  it('should return empty string when buttonId is null', () => {
    expect(generateButtonDisplayText(null, undefined)).toBe('');
  });

  it('should return empty string when buttonId is undefined', () => {
    expect(generateButtonDisplayText(undefined, undefined)).toBe('');
  });

  it('should handle delivery_start with different order numbers', () => {
    expect(generateButtonDisplayText('delivery_start_#P123', undefined)).toBe('🛵 Sair para entrega (#P123)');
    expect(generateButtonDisplayText('delivery_done_#P999', undefined)).toBe('✅ O pedido foi entregue (#P999)');
  });
});

/**
 * Tests for driver phone resolution logic.
 * The frontend resolves contact names by cross-referencing phone numbers
 * with the drivers table.
 */
describe('Driver Phone Resolution', () => {
  // Simulate the resolveDisplayName function from WhatsAppChatWidget.tsx
  function resolveDisplayName(
    contactName: string | null,
    phone: string,
    driverPhoneMap?: Record<string, string> | null
  ): string | null {
    if (driverPhoneMap) {
      const clean = phone.replace(/\D/g, "");
      const driverName = driverPhoneMap[clean];
      if (driverName) return `🛵 ${driverName} (Entregador)`;
      const withoutCountry = clean.startsWith("55") ? clean.slice(2) : clean;
      const driverName2 = driverPhoneMap[withoutCountry];
      if (driverName2) return `🛵 ${driverName2} (Entregador)`;
      const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
      const driverName3 = driverPhoneMap[withCountry];
      if (driverName3) return `🛵 ${driverName3} (Entregador)`;
    }
    return contactName;
  }

  function isDriverPhone(
    phone: string,
    driverPhoneMap?: Record<string, string> | null
  ): boolean {
    if (!driverPhoneMap) return false;
    const clean = phone.replace(/\D/g, "");
    return !!(driverPhoneMap[clean] 
      || driverPhoneMap[clean.startsWith("55") ? clean.slice(2) : clean]
      || driverPhoneMap[clean.startsWith("55") ? clean : `55${clean}`]);
  }

  const driverMap: Record<string, string> = {
    '558899290001': 'João',
    '8899290001': 'João',
    '558899290002': 'Maria',
    '8899290002': 'Maria',
  };

  it('should resolve driver name when phone matches with country code', () => {
    expect(resolveDisplayName(null, '558899290001', driverMap)).toBe('🛵 João (Entregador)');
  });

  it('should resolve driver name when phone matches without country code', () => {
    expect(resolveDisplayName(null, '8899290001', driverMap)).toBe('🛵 João (Entregador)');
  });

  it('should resolve driver name from remoteJid format', () => {
    expect(resolveDisplayName(null, '558899290002@s.whatsapp.net', driverMap)).toBe('🛵 Maria (Entregador)');
  });

  it('should return original contactName when phone is not a driver', () => {
    expect(resolveDisplayName('Cliente Fulano', '558899999999', driverMap)).toBe('Cliente Fulano');
  });

  it('should return null when no match and no contactName', () => {
    expect(resolveDisplayName(null, '558899999999', driverMap)).toBeNull();
  });

  it('should return contactName when driverPhoneMap is null', () => {
    expect(resolveDisplayName('Fulano', '558899290001', null)).toBe('Fulano');
  });

  it('should return contactName when driverPhoneMap is undefined', () => {
    expect(resolveDisplayName('Fulano', '558899290001', undefined)).toBe('Fulano');
  });

  it('should identify driver phone correctly', () => {
    expect(isDriverPhone('558899290001', driverMap)).toBe(true);
    expect(isDriverPhone('8899290001', driverMap)).toBe(true);
    expect(isDriverPhone('558899999999', driverMap)).toBe(false);
  });

  it('should handle phone with formatting characters', () => {
    // (88) 9929-0001 → 8899290001 (10 digits without country code)
    expect(resolveDisplayName(null, '(88) 9929-0001', driverMap)).toBe('🛵 João (Entregador)');
    expect(resolveDisplayName(null, '+55 88 9929-0001', driverMap)).toBe('🛵 João (Entregador)');
    expect(resolveDisplayName(null, '55 (88) 9929-0001', driverMap)).toBe('🛵 João (Entregador)');
  });

  it('should prioritize driver name over contactName from webhook', () => {
    // Even if the webhook sends a contactName like "Yt", the driver name should take precedence
    expect(resolveDisplayName('Yt', '558899290001', driverMap)).toBe('🛵 João (Entregador)');
  });
});
