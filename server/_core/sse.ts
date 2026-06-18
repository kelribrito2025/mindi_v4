import { Response } from "express";
import { logger } from "./logger";

// Armazena conexões SSE por estabelecimento (para dashboard do restaurante)
// Map<establishmentId, Set<Response>>
const connections = new Map<number, Set<Response>>();

// Armazena conexões SSE por estabelecimento (EXCLUSIVO para impressoras/Mindi Printer app)
// Separado do pool do dashboard para evitar impressão duplicada
const printerConnections = new Map<number, Set<Response>>();

// Armazena conexões SSE por orderNumber (para clientes acompanharem pedidos)
// Map<orderNumber, Set<Response>>
const orderConnections = new Map<string, Set<Response>>();

// Cache temporário para recibos de caixa (para o app Mindi Printer buscar via /api/printer/receipt/:id)
// Map<receiptId (number), { data: CashReceiptData, expiresAt: number }>
const cashReceiptCache = new Map<number, { data: any; establishmentId: number; expiresAt: number }>();
let cashReceiptIdCounter = 900000000; // IDs altos para não conflitar com orderId reais

/**
 * Armazena dados de recibo de caixa no cache temporário e retorna o ID
 * O cache expira em 5 minutos
 */
export function storeCashReceiptInCache(establishmentId: number, receiptData: any): number {
  cashReceiptIdCounter++;
  const receiptId = cashReceiptIdCounter;
  cashReceiptCache.set(receiptId, {
    data: receiptData,
    establishmentId,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
  });
  // Limpar entradas expiradas periodicamente
  if (cashReceiptCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of cashReceiptCache) {
      if (value.expiresAt < now) cashReceiptCache.delete(key);
    }
  }
  return receiptId;
}

/**
 * Busca dados de recibo de caixa do cache temporário
 */
export function getCashReceiptFromCache(receiptId: number): { data: any; establishmentId: number } | null {
  const entry = cashReceiptCache.get(receiptId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cashReceiptCache.delete(receiptId);
    return null;
  }
  return { data: entry.data, establishmentId: entry.establishmentId };
}

/**
 * Adiciona uma conexão SSE para um estabelecimento
 */
export function addConnection(establishmentId: number, res: Response): void {
  if (!connections.has(establishmentId)) {
    connections.set(establishmentId, new Set());
  }
  connections.get(establishmentId)!.add(res);
  
  logger.info(`[SSE] Nova conexão para estabelecimento ${establishmentId}. Total: ${connections.get(establishmentId)!.size}`);
}

/**
 * Remove uma conexão SSE
 */
export function removeConnection(establishmentId: number, res: Response): void {
  const establishmentConnections = connections.get(establishmentId);
  if (establishmentConnections) {
    establishmentConnections.delete(res);
    logger.info(`[SSE] Conexão removida do estabelecimento ${establishmentId}. Restantes: ${establishmentConnections.size}`);
    
    if (establishmentConnections.size === 0) {
      connections.delete(establishmentId);
    }
  }
}

/**
 * Envia um evento SSE para todas as conexões de um estabelecimento
 */
export function sendEvent(establishmentId: number, eventType: string, data: unknown): void {
  const establishmentConnections = connections.get(establishmentId);
  if (!establishmentConnections || establishmentConnections.size === 0) {
    return;
  }
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  logger.info(`[SSE] Enviando evento '${eventType}' para ${establishmentConnections.size} conexão(ões) do estabelecimento ${establishmentId}`);
  
  establishmentConnections.forEach((res) => {
    try {
      res.write(message);
      // Flush imediato para evitar buffering - garante entrega em tempo real
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE] Erro ao enviar evento:`, error);
      removeConnection(establishmentId, res);
    }
  });
}

/**
 * Envia evento de novo pedido
 */
export function notifyNewOrder(establishmentId: number, order: unknown): void {
  logger.info(`[SSE] notifyNewOrder chamado para establishmentId: ${establishmentId}`);
  logger.info(`[SSE] Conexões ativas para este estabelecimento: ${connections.get(establishmentId)?.size || 0}`);
  // Log para debug do source do pedido
  const orderData = order as { source?: string };
  logger.info(`[SSE] Source do pedido: ${orderData?.source || 'não definido'}`);
  sendEvent(establishmentId, "new_order", order);
}

/**
 * Adiciona uma conexão SSE de impressora para um estabelecimento
 */
export function addPrinterConnection(establishmentId: number, res: Response): void {
  if (!printerConnections.has(establishmentId)) {
    printerConnections.set(establishmentId, new Set());
  }
  printerConnections.get(establishmentId)!.add(res);
  
  logger.info(`[SSE-Printer] Nova conexão de impressora para estabelecimento ${establishmentId}. Total impressoras: ${printerConnections.get(establishmentId)!.size}`);
}

/**
 * Remove uma conexão SSE de impressora
 */
export function removePrinterConnection(establishmentId: number, res: Response): void {
  const printerConns = printerConnections.get(establishmentId);
  if (printerConns) {
    printerConns.delete(res);
    logger.info(`[SSE-Printer] Conexão de impressora removida do estabelecimento ${establishmentId}. Restantes: ${printerConns.size}`);
    
    if (printerConns.size === 0) {
      printerConnections.delete(establishmentId);
    }
  }
}

/**
 * Envia um evento SSE APENAS para conexões de impressora de um estabelecimento
 */
function sendPrinterEvent(establishmentId: number, eventType: string, data: unknown): void {
  const printerConns = printerConnections.get(establishmentId);
  if (!printerConns || printerConns.size === 0) {
    logger.info(`[SSE-Printer] Nenhuma conexão de impressora ativa para estabelecimento ${establishmentId}`);
    return;
  }
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  logger.info(`[SSE-Printer] Enviando evento '${eventType}' para ${printerConns.size} impressora(s) do estabelecimento ${establishmentId}`);
  
  printerConns.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE-Printer] Erro ao enviar evento:`, error);
      removePrinterConnection(establishmentId, res);
    }
  });
}

/**
 * Retorna o número de conexões de impressora ativas para um estabelecimento
 */
export function getPrinterConnectionCount(establishmentId: number): number {
  return printerConnections.get(establishmentId)?.size || 0;
}

/**
 * Envia evento para imprimir pedido (APENAS para impressoras, não para dashboard)
 */
export function notifyPrintOrder(establishmentId: number, orderData: {
  orderId: number;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryType: string;
  paymentMethod: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  notes: string | null;
  changeAmount: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: Array<{ name: string; price: number }> | null;
    notes: string | null;
    categoryId?: number | null;
    productId?: number | null;
  }>;
  createdAt: Date;
  beepOnPrint?: boolean;
  htmlPrintEnabled?: boolean;
  // Mapa de roteamento: printerId -> array de categoryIds que essa impressora deve imprimir
  // Se vazio ou não definido, a impressora imprime tudo (comportamento legado)
  printerCategoryMap?: Record<string, number[]>;
}): void {
  logger.info(`[SSE-Printer] notifyPrintOrder chamado para establishmentId: ${establishmentId}, pedido: ${orderData.orderNumber}`);
  // Envia APENAS para conexões de impressora, não para o dashboard
  sendPrinterEvent(establishmentId, "print_order", orderData);
}

/**
 * Envia evento para imprimir recibo de caixa (APENAS para impressoras)
 * Formata como print_order para compatibilidade com o app Mindi Printer
 */
export function notifyPrintCashReceipt(establishmentId: number, receiptData: {
  storeName: string;
  operatorName: string;
  openedAt: string | null;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number;
  salesTotal: number;
  salesCount: number;
  paymentBreakdown: Array<{ method: string; total: number; count: number }>;
  movements: Array<{ type: string; amount: string; reason: string | null; createdAt: any }>;
  beepOnPrint?: boolean;
  htmlPrintEnabled?: boolean;
}): void {
  logger.info(`[SSE-Printer] notifyPrintCashReceipt chamado para establishmentId: ${establishmentId}`);
  
  // Armazena os dados do recibo no cache para que o app Mindi Printer possa buscar via /api/printer/receipt/:id
  const receiptId = storeCashReceiptInCache(establishmentId, receiptData);
  logger.info(`[SSE-Printer] Recibo de caixa armazenado no cache com ID: ${receiptId}`);
  
  // Formata o recibo de caixa como um "pedido" para o app Mindi Printer reconhecer
  const formatCurrencyRaw = (val: number) => `R$ ${val.toFixed(2).replace(".", ",")}`;
  
  // Monta os itens do recibo como itens de pedido
  // Usa nomes limpos e preços reais para que o app gere o recibo localmente de forma legível
  const items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: null;
    notes: string | null;
  }> = [];

  // Fundo de Caixa
  items.push({
    productName: "Fundo de Caixa",
    quantity: 1,
    unitPrice: formatCurrencyRaw(receiptData.openingAmount),
    totalPrice: formatCurrencyRaw(receiptData.openingAmount),
    complements: null,
    notes: null,
  });

  // Breakdown de pagamentos
  for (const p of receiptData.paymentBreakdown) {
    items.push({
      productName: p.method,
      quantity: p.count,
      unitPrice: formatCurrencyRaw(p.total / (p.count || 1)),
      totalPrice: formatCurrencyRaw(p.total),
      complements: null,
      notes: null,
    });
  }

  // Movimentações
  if (receiptData.movements && receiptData.movements.length > 0) {
    for (const m of receiptData.movements) {
      const prefix = m.type === "entrada" || m.type === "suprimento" ? "+" : "-";
      items.push({
        productName: `${prefix} ${m.reason || m.type}`,
        quantity: 1,
        unitPrice: `R$ ${m.amount}`,
        totalPrice: `R$ ${m.amount}`,
        complements: null,
        notes: null,
      });
    }
  }

  // Determina o htmlPrintEnabled baseado nas configurações do estabelecimento
  // Quando false: o app gera o recibo localmente (mesmo estilo dos pedidos normais)
  // Quando true: o app busca do endpoint /api/printer/receipt/{id}
  // SEMPRE forçar htmlPrintEnabled=true para recibo de caixa
  // Quando true, o app Mindi Printer busca do endpoint /api/printer/receipt/{id}
  // que retorna o recibo formatado profissionalmente via generateCashReceiptText
  const useHtmlPrint = true;

  const orderData = {
    orderId: receiptId, // ID do cache para o app Mindi Printer buscar o recibo
    orderNumber: "CAIXA",
    customerName: `Operador: ${receiptData.operatorName}`,
    customerPhone: null,
    customerAddress: null,
    deliveryType: "FECHAMENTO DE CAIXA",
    paymentMethod: `Total Vendas: ${receiptData.salesCount}x`,
    subtotal: formatCurrencyRaw(receiptData.salesTotal),
    deliveryFee: "0",
    discount: "0",
    total: formatCurrencyRaw(receiptData.closingAmount),
    notes: `Abertura: ${receiptData.openedAt || "--"} | Fechamento: ${receiptData.closedAt || "--"}`,
    changeAmount: null,
    items,
    createdAt: new Date(),
    beepOnPrint: receiptData.beepOnPrint ?? false,
    htmlPrintEnabled: useHtmlPrint,
    printerCategoryMap: {},
  };

  logger.info(`[SSE-Printer] CASH RECEIPT EVENT DATA: orderId=${orderData.orderId}, htmlPrintEnabled=${orderData.htmlPrintEnabled}, orderNumber=${orderData.orderNumber}`);
  // Envia um evento config_update ANTES do print_order para forçar o app a atualizar
  // suas configurações (especialmente htmlPrintEnabled=true) sem precisar "Revalidar" manualmente
  sendPrinterEvent(establishmentId, "config_update", {
    htmlPrintEnabled: true,
    paperWidth: "80mm",
    beepOnPrint: receiptData.beepOnPrint ?? false,
  });
  // Pequeno delay para garantir que o app processe o config_update antes do print_order
  setTimeout(() => {
    // Usa o mesmo evento print_order para compatibilidade com o app Mindi Printer
    sendPrinterEvent(establishmentId, "print_order", orderData);
  }, 500);
}
/**
 * Envia evento de atualização de status do pedido
 */
export function notifyOrderUpdate(establishmentId: number, order: unknown): void {
  sendEvent(establishmentId, "order_update", order);
}

/**
 * Envia heartbeat para manter a conexão ativa
 */
export function sendHeartbeat(establishmentId: number): void {
  sendEvent(establishmentId, "heartbeat", { timestamp: Date.now() });
}

/**
 * Retorna o número de conexões ativas para um estabelecimento
 */
export function getConnectionCount(establishmentId: number): number {
  return connections.get(establishmentId)?.size || 0;
}

/**
 * Retorna o número total de conexões ativas
 */
export function getTotalConnections(): number {
  let total = 0;
  connections.forEach((set) => {
    total += set.size;
  });
  return total;
}

// ==================== FUNÇÕES PARA PEDIDOS (por orderNumber ou orderId) ====================

// Map<orderId (string), Set<Response>> - conexões por orderId único
const orderIdConnections = new Map<string, Set<Response>>();

/**
 * Adiciona uma conexão SSE para um pedido (identificado pelo orderNumber)
 */
export function addOrderConnection(orderNumber: string, res: Response): void {
  if (!orderConnections.has(orderNumber)) {
    orderConnections.set(orderNumber, new Set());
  }
  orderConnections.get(orderNumber)!.add(res);
  
  logger.info(`[SSE-Order] Nova conexão para pedido ${orderNumber}. Total: ${orderConnections.get(orderNumber)!.size}`);
}

/**
 * Adiciona uma conexão SSE para um pedido por orderId (único, sem colisão)
 */
export function addOrderIdConnection(orderId: string, res: Response): void {
  if (!orderIdConnections.has(orderId)) {
    orderIdConnections.set(orderId, new Set());
  }
  orderIdConnections.get(orderId)!.add(res);
  
  logger.info(`[SSE-Order] Nova conexão por orderId ${orderId}. Total: ${orderIdConnections.get(orderId)!.size}`);
}

/**
 * Adiciona uma conexão SSE para múltiplos pedidos por orderId
 */
export function addOrderIdConnectionForMultiple(orderIds: string[], res: Response): void {
  orderIds.forEach(orderId => {
    if (!orderIdConnections.has(orderId)) {
      orderIdConnections.set(orderId, new Set());
    }
    orderIdConnections.get(orderId)!.add(res);
  });
  
  logger.info(`[SSE-Order] Nova conexão para ${orderIds.length} pedidos por orderId: ${orderIds.join(', ')}`);
}

/**
 * Remove uma conexão SSE de um pedido por orderId
 */
export function removeOrderIdConnection(orderId: string, res: Response): void {
  const conns = orderIdConnections.get(orderId);
  if (conns) {
    conns.delete(res);
    if (conns.size === 0) {
      orderIdConnections.delete(orderId);
    }
  }
}

/**
 * Remove uma conexão SSE de múltiplos pedidos por orderId
 */
export function removeOrderIdConnectionFromMultiple(orderIds: string[], res: Response): void {
  orderIds.forEach(orderId => {
    removeOrderIdConnection(orderId, res);
  });
}

/**
 * Envia um evento SSE para todas as conexões de um pedido por orderId
 */
export function sendOrderIdEvent(orderId: string, eventType: string, data: unknown): void {
  const conns = orderIdConnections.get(orderId);
  if (!conns || conns.size === 0) return;
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  conns.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE-Order] Erro ao enviar evento por orderId:`, error);
      removeOrderIdConnection(orderId, res);
    }
  });
}

/**
 * Adiciona uma conexão SSE para múltiplos pedidos
 */
export function addOrderConnectionForMultiple(orderNumbers: string[], res: Response): void {
  orderNumbers.forEach(orderNumber => {
    if (!orderConnections.has(orderNumber)) {
      orderConnections.set(orderNumber, new Set());
    }
    orderConnections.get(orderNumber)!.add(res);
  });
  
  logger.info(`[SSE-Order] Nova conexão para ${orderNumbers.length} pedidos: ${orderNumbers.join(', ')}`);
}

/**
 * Remove uma conexão SSE de um pedido
 */
export function removeOrderConnection(orderNumber: string, res: Response): void {
  const pedidoConnections = orderConnections.get(orderNumber);
  if (pedidoConnections) {
    pedidoConnections.delete(res);
    logger.info(`[SSE-Order] Conexão removida do pedido ${orderNumber}. Restantes: ${pedidoConnections.size}`);
    
    if (pedidoConnections.size === 0) {
      orderConnections.delete(orderNumber);
    }
  }
}

/**
 * Remove uma conexão SSE de múltiplos pedidos
 */
export function removeOrderConnectionFromMultiple(orderNumbers: string[], res: Response): void {
  orderNumbers.forEach(orderNumber => {
    removeOrderConnection(orderNumber, res);
  });
  logger.info(`[SSE-Order] Conexão removida de ${orderNumbers.length} pedidos`);
}

/**
 * Envia um evento SSE para todas as conexões de um pedido
 */
export function sendOrderEvent(orderNumber: string, eventType: string, data: unknown): void {
  const pedidoConnections = orderConnections.get(orderNumber);
  if (!pedidoConnections || pedidoConnections.size === 0) {
    logger.info(`[SSE-Order] Nenhuma conexão ativa para pedido ${orderNumber}`);
    return;
  }
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  logger.info(`[SSE-Order] Enviando evento '${eventType}' para ${pedidoConnections.size} conexão(ões) do pedido ${orderNumber}`);
  
  pedidoConnections.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE-Order] Erro ao enviar evento:`, error);
      removeOrderConnection(orderNumber, res);
    }
  });
}

/**
 * Notifica sobre atualização de status do pedido
 * Envia para conexões por orderNumber (legado) E por orderId (único)
 */
export function notifyOrderStatusUpdate(orderNumber: string, data: {
  id: number;
  orderNumber: string;
  status: string;
  updatedAt: Date;
  cancellationReason?: string | null;
}): void {
  logger.info(`[SSE-Order] notifyOrderStatusUpdate chamado para orderNumber: ${orderNumber}, orderId: ${data.id}, novo status: ${data.status}`);
  
  // Enviar para conexões por orderNumber (legado)
  logger.info(`[SSE-Order] Conexões ativas por orderNumber: ${orderConnections.get(orderNumber)?.size || 0}`);
  sendOrderEvent(orderNumber, "order_status_update", data);
  
  // Enviar para conexões por orderId (único, sem colisão)
  const orderIdStr = data.id.toString();
  logger.info(`[SSE-Order] Conexões ativas por orderId: ${orderIdConnections.get(orderIdStr)?.size || 0}`);
  sendOrderIdEvent(orderIdStr, "order_status_update", data);
}

/**
 * Envia heartbeat para manter a conexão do pedido ativa
 */
export function sendOrderHeartbeat(orderNumber: string): void {
  sendOrderEvent(orderNumber, "heartbeat", { timestamp: Date.now() });
}

/**
 * Envia heartbeat para todas as conexões de pedidos
 */
export function sendAllOrdersHeartbeat(): void {
  orderConnections.forEach((_, orderNumber) => {
    sendOrderHeartbeat(orderNumber);
  });
}

/**
 * Retorna o número de conexões ativas para um pedido
 */
export function getOrderConnectionCount(orderNumber: string): number {
  return orderConnections.get(orderNumber)?.size || 0;
}

/**
 * Retorna o número total de conexões de pedidos ativas
 */
export function getTotalOrderConnections(): number {
  let total = 0;
  orderConnections.forEach((set) => {
    total += set.size;
  });
  return total;
}

// ==================== MENU PÚBLICO SSE ====================
// Conexões SSE para clientes do menu público (por establishmentId)
// Usado para stories, atualizações de produtos, status do estabelecimento, etc.
const menuPublicConnections = new Map<number, Set<Response>>();

/**
 * Tipos de eventos suportados pelo SSE do menu público.
 * Extensível para futuros eventos (product_updated, establishment_closed, etc.)
 */
export type MenuSSEEventType =
  | 'story_created'
  | 'story_updated'
  | 'story_deleted'
  | 'product_updated'
  | 'product_deleted'
  | 'category_updated'
  | 'establishment_updated'
  | 'establishment_closed'
  | 'establishment_opened'
  | 'menu_refresh'
  | 'menu_updated';

/**
 * Adiciona uma conexão SSE do menu público para um estabelecimento
 */
export function addMenuPublicConnection(establishmentId: number, res: Response): void {
  if (!menuPublicConnections.has(establishmentId)) {
    menuPublicConnections.set(establishmentId, new Set());
  }
  menuPublicConnections.get(establishmentId)!.add(res);
  
  logger.info(`[SSE-Menu] Nova conexão para estabelecimento ${establishmentId}. Total: ${menuPublicConnections.get(establishmentId)!.size}`);
}

/**
 * Remove uma conexão SSE do menu público
 */
export function removeMenuPublicConnection(establishmentId: number, res: Response): void {
  const conns = menuPublicConnections.get(establishmentId);
  if (conns) {
    conns.delete(res);
    logger.info(`[SSE-Menu] Conexão removida do estabelecimento ${establishmentId}. Restantes: ${conns.size}`);
    
    if (conns.size === 0) {
      menuPublicConnections.delete(establishmentId);
    }
  }
}

/**
 * Envia um evento SSE para todas as conexões do menu público de um estabelecimento
 */
export function sendMenuPublicEvent(establishmentId: number, eventType: MenuSSEEventType, data: unknown): void {
  const conns = menuPublicConnections.get(establishmentId);
  if (!conns || conns.size === 0) {
    return;
  }
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  logger.info(`[SSE-Menu] Enviando evento '${eventType}' para ${conns.size} conexão(ões) do estabelecimento ${establishmentId}`);
  
  conns.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE-Menu] Erro ao enviar evento:`, error);
      removeMenuPublicConnection(establishmentId, res);
    }
  });
}

/**
 * Envia heartbeat para manter as conexões do menu público ativas
 */
export function sendMenuPublicHeartbeat(establishmentId: number): void {
  const conns = menuPublicConnections.get(establishmentId);
  if (!conns || conns.size === 0) return;
  
  const message = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
  
  conns.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      removeMenuPublicConnection(establishmentId, res);
    }
  });
}

/**
 * Retorna o número de conexões do menu público ativas para um estabelecimento
 */
export function getMenuPublicConnectionCount(establishmentId: number): number {
  return menuPublicConnections.get(establishmentId)?.size || 0;
}

/**
 * Envia heartbeat para TODAS as conexões do menu público
 */
export function sendAllMenuPublicHeartbeats(): void {
  menuPublicConnections.forEach((_, establishmentId) => {
    sendMenuPublicHeartbeat(establishmentId);
  });
}

// ==================== FUNÇÕES LEGADAS (mantidas para compatibilidade) ====================
// Estas funções são mantidas para não quebrar código existente, mas devem ser migradas

// Armazena conexões SSE por cliente (por telefone) - LEGADO
const customerConnections = new Map<string, Set<Response>>();

export function addCustomerConnection(customerPhone: string, res: Response): void {
  if (!customerConnections.has(customerPhone)) {
    customerConnections.set(customerPhone, new Set());
  }
  customerConnections.get(customerPhone)!.add(res);
  logger.info(`[SSE-Customer] Nova conexão para cliente ${customerPhone}. Total: ${customerConnections.get(customerPhone)!.size}`);
}

export function removeCustomerConnection(customerPhone: string, res: Response): void {
  const clientConnections = customerConnections.get(customerPhone);
  if (clientConnections) {
    clientConnections.delete(res);
    logger.info(`[SSE-Customer] Conexão removida do cliente ${customerPhone}. Restantes: ${clientConnections.size}`);
    if (clientConnections.size === 0) {
      customerConnections.delete(customerPhone);
    }
  }
}

export function sendCustomerEvent(customerPhone: string, eventType: string, data: unknown): void {
  const clientConnections = customerConnections.get(customerPhone);
  if (!clientConnections || clientConnections.size === 0) {
    return;
  }
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  logger.info(`[SSE-Customer] Enviando evento '${eventType}' para ${clientConnections.size} conexão(ões) do cliente ${customerPhone}`);
  clientConnections.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE-Customer] Erro ao enviar evento:`, error);
      removeCustomerConnection(customerPhone, res);
    }
  });
}

export function notifyCustomerOrderUpdate(customerPhone: string, order: unknown): void {
  sendCustomerEvent(customerPhone, "order_status_update", order);
}

export function sendCustomerHeartbeat(customerPhone: string): void {
  sendCustomerEvent(customerPhone, "heartbeat", { timestamp: Date.now() });
}

export function getCustomerConnectionCount(customerPhone: string): number {
  return customerConnections.get(customerPhone)?.size || 0;
}

// ==================== WHATSAPP CHAT SSE ====================
// Conexões SSE para o chat do WhatsApp no dashboard (por establishmentId)
const chatConnections = new Map<number, Set<Response>>();

export function addChatConnection(establishmentId: number, res: Response): void {
  if (!chatConnections.has(establishmentId)) {
    chatConnections.set(establishmentId, new Set());
  }
  chatConnections.get(establishmentId)!.add(res);
  logger.info(`[SSE-Chat] Nova conexão para estabelecimento ${establishmentId}. Total: ${chatConnections.get(establishmentId)!.size}`);
}

export function removeChatConnection(establishmentId: number, res: Response): void {
  const conns = chatConnections.get(establishmentId);
  if (conns) {
    conns.delete(res);
    logger.info(`[SSE-Chat] Conexão removida do estabelecimento ${establishmentId}. Restantes: ${conns.size}`);
    if (conns.size === 0) {
      chatConnections.delete(establishmentId);
    }
  }
}

export function sendChatEvent(establishmentId: number, eventType: string, data: unknown): void {
  const conns = chatConnections.get(establishmentId);
  if (!conns || conns.size === 0) return;
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  logger.info(`[SSE-Chat] Enviando evento '${eventType}' para ${conns.size} conexão(ões) do estabelecimento ${establishmentId}`);
  
  conns.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (error) {
      logger.error(`[SSE-Chat] Erro ao enviar evento:`, error);
      removeChatConnection(establishmentId, res);
    }
  });
}

export function notifyChatNewMessage(establishmentId: number, message: unknown): void {
  sendChatEvent(establishmentId, "chat_new_message", message);
}

export function notifyChatConversationUpdate(establishmentId: number, conversation: unknown): void {
  sendChatEvent(establishmentId, "chat_conversation_update", conversation);
}

export function sendChatHeartbeat(establishmentId: number): void {
  sendChatEvent(establishmentId, "heartbeat", { timestamp: Date.now() });
}

export function getChatConnectionCount(establishmentId: number): number {
  return chatConnections.get(establishmentId)?.size || 0;
}

export function sendAllChatHeartbeats(): void {
  chatConnections.forEach((_, establishmentId) => {
    sendChatHeartbeat(establishmentId);
  });
}


// ==================== PUBLIC CHAT SSE ====================
const publicChatConnections = new Map<string, Set<Response>>();
function getPublicChatKey(establishmentId: number, orderId: number): string {
  return `${establishmentId}_${orderId}`;
}
export function addPublicChatConnection(establishmentId: number, orderId: number, res: Response): void {
  const key = getPublicChatKey(establishmentId, orderId);
  if (!publicChatConnections.has(key)) publicChatConnections.set(key, new Set());
  publicChatConnections.get(key)!.add(res);
  logger.info(`[SSE-PublicChat] Nova conexão para estab=${establishmentId} order=${orderId}. Total: ${publicChatConnections.get(key)!.size}`);
}
export function removePublicChatConnection(establishmentId: number, orderId: number, res: Response): void {
  const key = getPublicChatKey(establishmentId, orderId);
  const conns = publicChatConnections.get(key);
  if (!conns) return;
  conns.delete(res);
  if (conns.size === 0) publicChatConnections.delete(key);
}
export function sendPublicChatEvent(establishmentId: number, orderId: number, eventType: string, data: unknown): void {
  const key = getPublicChatKey(establishmentId, orderId);
  const conns = publicChatConnections.get(key);
  if (!conns || conns.size === 0) return;
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  conns.forEach((res) => {
    try {
      res.write(message);
      if (typeof (res as any).flush === 'function') (res as any).flush();
    } catch (error) {
      logger.error(`[SSE-PublicChat] Erro ao enviar evento:`, error);
      removePublicChatConnection(establishmentId, orderId, res);
    }
  });
}
export function notifyPublicChatNewMessage(establishmentId: number, orderId: number, message: unknown): void {
  sendPublicChatEvent(establishmentId, orderId, "public_chat_new_message", message);
}
export function sendPublicChatHeartbeat(establishmentId: number, orderId: number): void {
  sendPublicChatEvent(establishmentId, orderId, "heartbeat", { timestamp: Date.now() });
}
export function getPublicChatConnectionCount(establishmentId: number, orderId: number): number {
  return publicChatConnections.get(getPublicChatKey(establishmentId, orderId))?.size || 0;
}
export function sendAllPublicChatHeartbeats(): void {
  publicChatConnections.forEach((_, key) => {
    const [estabId, orderId] = key.split('_').map(Number);
    sendPublicChatHeartbeat(estabId, orderId);
  });
}
