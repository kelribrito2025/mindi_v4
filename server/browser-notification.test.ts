import { describe, expect, it } from "vitest";

/**
 * Testes para a lógica de notificação push do navegador.
 * Como a Notification API é uma API do browser, testamos a lógica de decisão
 * que determina quando e como as notificações são disparadas.
 */

// Simular a lógica de decisão de notificação (extraída do NewOrdersContext)
function shouldShowBrowserNotification(params: {
  documentHidden: boolean;
  notificationSupported: boolean;
  notificationPermission: string;
  isPublicMenu: boolean;
}): boolean {
  const { documentHidden, notificationSupported, notificationPermission, isPublicMenu } = params;
  return documentHidden && notificationSupported && notificationPermission === 'granted' && !isPublicMenu;
}

function buildNotificationContent(order: {
  orderNumber?: string | number;
  id?: string | number;
  customerName?: string;
  total?: number;
  source?: string;
}): { title: string; body: string } {
  const isIfoodOrder = order.source === 'ifood';
  const orderNumber = order.orderNumber || order.id || '';
  const customerName = order.customerName || '';
  const total = order.total ? `R$ ${(order.total / 100).toFixed(2).replace('.', ',')}` : '';

  const title = isIfoodOrder ? '🟥 Novo Pedido iFood!' : '🔔 Novo Pedido!';
  let body = '';
  if (orderNumber) body += `Pedido #${orderNumber}`;
  if (customerName) body += ` - ${customerName}`;
  if (total) body += ` - ${total}`;
  if (!body) body = 'Você recebeu um novo pedido. Confira agora!';

  return { title, body };
}

describe("Browser Push Notification - Decisão de exibição", () => {
  it("deve mostrar notificação quando aba está inativa e permissão concedida", () => {
    expect(shouldShowBrowserNotification({
      documentHidden: true,
      notificationSupported: true,
      notificationPermission: 'granted',
      isPublicMenu: false,
    })).toBe(true);
  });

  it("NÃO deve mostrar notificação quando aba está ativa (visível)", () => {
    expect(shouldShowBrowserNotification({
      documentHidden: false,
      notificationSupported: true,
      notificationPermission: 'granted',
      isPublicMenu: false,
    })).toBe(false);
  });

  it("NÃO deve mostrar notificação quando permissão não foi concedida", () => {
    expect(shouldShowBrowserNotification({
      documentHidden: true,
      notificationSupported: true,
      notificationPermission: 'denied',
      isPublicMenu: false,
    })).toBe(false);
  });

  it("NÃO deve mostrar notificação quando permissão está em 'default'", () => {
    expect(shouldShowBrowserNotification({
      documentHidden: true,
      notificationSupported: true,
      notificationPermission: 'default',
      isPublicMenu: false,
    })).toBe(false);
  });

  it("NÃO deve mostrar notificação quando Notification API não é suportada", () => {
    expect(shouldShowBrowserNotification({
      documentHidden: true,
      notificationSupported: false,
      notificationPermission: 'granted',
      isPublicMenu: false,
    })).toBe(false);
  });

  it("NÃO deve mostrar notificação quando está no menu público", () => {
    expect(shouldShowBrowserNotification({
      documentHidden: true,
      notificationSupported: true,
      notificationPermission: 'granted',
      isPublicMenu: true,
    })).toBe(false);
  });
});

describe("Browser Push Notification - Conteúdo da notificação", () => {
  it("deve gerar título correto para pedido interno", () => {
    const { title } = buildNotificationContent({ orderNumber: 123 });
    expect(title).toBe('🔔 Novo Pedido!');
  });

  it("deve gerar título correto para pedido iFood", () => {
    const { title } = buildNotificationContent({ orderNumber: 123, source: 'ifood' });
    expect(title).toBe('🟥 Novo Pedido iFood!');
  });

  it("deve incluir número do pedido no body", () => {
    const { body } = buildNotificationContent({ orderNumber: 456 });
    expect(body).toContain('Pedido #456');
  });

  it("deve incluir nome do cliente no body", () => {
    const { body } = buildNotificationContent({ orderNumber: 789, customerName: 'João Silva' });
    expect(body).toContain('João Silva');
  });

  it("deve incluir total formatado no body", () => {
    const { body } = buildNotificationContent({ orderNumber: 100, total: 5990 });
    expect(body).toContain('R$ 59,90');
  });

  it("deve usar fallback de id quando orderNumber não existe", () => {
    const { body } = buildNotificationContent({ id: 999 });
    expect(body).toContain('Pedido #999');
  });

  it("deve usar mensagem padrão quando não há dados do pedido", () => {
    const { body } = buildNotificationContent({});
    expect(body).toBe('Você recebeu um novo pedido. Confira agora!');
  });

  it("deve formatar total com centavos corretamente", () => {
    const { body } = buildNotificationContent({ orderNumber: 1, total: 1050 });
    expect(body).toContain('R$ 10,50');
  });
});
