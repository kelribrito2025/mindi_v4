/**
 * Módulo de Impressão ESC/POS via Socket TCP
 * Envia comandos diretamente para impressora térmica via rede local
 */

import * as net from 'net';
import { logger } from "./_core/logger";

// Comandos ESC/POS
const ESC = '\x1B';
const GS = '\x1D';

const COMMANDS = {
  // Inicialização
  INIT: ESC + '@',
  
  // Alinhamento
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  
  // Tamanho da fonte
  FONT_NORMAL: GS + '!' + '\x00',
  FONT_DOUBLE_HEIGHT: GS + '!' + '\x01',
  FONT_DOUBLE_WIDTH: GS + '!' + '\x10',
  FONT_DOUBLE: GS + '!' + '\x11', // Largura e altura dobradas
  FONT_TRIPLE: GS + '!' + '\x22', // 3x largura e altura
  
  // Estilo
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  
  // Corte de papel
  CUT_PARTIAL: GS + 'V' + '\x01',
  CUT_FULL: GS + 'V' + '\x00',
  
  // Alimentação de papel
  FEED_LINE: '\n',
  FEED_3_LINES: '\n\n\n',
  
  // Beep (som)
  BEEP: ESC + 'B' + '\x05' + '\x09', // 5 beeps, duração 9
};

interface PrinterConfig {
  ip: string;
  port: number;
  timeout?: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  observation?: string;
  complements?: string;
}

interface OrderData {
  orderId: number;
  orderNumber: number;
  customerName: string;
  customerPhone?: string;
  deliveryType: 'delivery' | 'pickup' | 'table';
  address?: string;
  neighborhood?: string;
  paymentMethod: string;
  changeFor?: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  observation?: string;
  tableNumber?: string;
  createdAt: Date;
  establishmentName: string;
}

/**
 * Remove acentos e caracteres especiais para compatibilidade com impressoras
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * Formata preço em reais
 */
function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Cria linha divisória
 */
function divider(char: string = '-', width: number = 48): string {
  return char.repeat(width);
}

/**
 * Centraliza texto
 */
function centerText(text: string, width: number = 48): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Formata linha com texto à esquerda e valor à direita
 */
function formatLine(left: string, right: string, width: number = 48): string {
  const spaces = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(spaces) + right;
}

/**
 * Gera os comandos ESC/POS para o recibo do pedido
 */
export function generateEscPosReceipt(order: OrderData): string {
  let receipt = '';
  
  // Inicialização
  receipt += COMMANDS.INIT;
  
  // Beep para alertar
  receipt += COMMANDS.BEEP;
  
  // Cabeçalho - Nome do estabelecimento
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += COMMANDS.FONT_DOUBLE;
  receipt += COMMANDS.BOLD_ON;
  receipt += removeAccents(order.establishmentName.toUpperCase()) + '\n';
  receipt += COMMANDS.BOLD_OFF;
  receipt += COMMANDS.FONT_NORMAL;
  receipt += '\n';
  
  // Número do pedido em destaque
  receipt += COMMANDS.FONT_TRIPLE;
  receipt += COMMANDS.BOLD_ON;
  receipt += `PEDIDO #${order.orderNumber}\n`;
  receipt += COMMANDS.BOLD_OFF;
  receipt += COMMANDS.FONT_NORMAL;
  receipt += '\n';
  
  // Tipo de entrega
  receipt += COMMANDS.FONT_DOUBLE;
  const isScheduled = (order as any).isScheduled === true;
  const deliveryTypeText = isScheduled ? 'AGENDADO' : (
    order.deliveryType === 'delivery' ? 'DELIVERY' :
    order.deliveryType === 'pickup' ? 'RETIRADA' :
    `MESA ${order.tableNumber || ''}`);
  receipt += `*** ${deliveryTypeText} ***\n`;
  receipt += COMMANDS.FONT_NORMAL;
  receipt += '\n';
  
  // Data e hora
  const now = order.createdAt;
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  receipt += `${dateStr} - ${timeStr}\n`;
  receipt += '\n';
  
  // Seção de agendamento
  if (isScheduled && (order as any).scheduledAt) {
    const scheduledDate = new Date((order as any).scheduledAt);
    const sDateStr = `${scheduledDate.getDate().toString().padStart(2, '0')}/${(scheduledDate.getMonth() + 1).toString().padStart(2, '0')}/${scheduledDate.getFullYear()}`;
    const sTimeStr = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`;
    receipt += COMMANDS.FONT_DOUBLE_HEIGHT;
    receipt += COMMANDS.BOLD_ON;
    receipt += 'AGENDADO PARA\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += COMMANDS.FONT_NORMAL;
    receipt += `Data: ${sDateStr}  Horario: ${sTimeStr}\n`;
    receipt += '\n';
  }
  
  // Divisor
  receipt += COMMANDS.ALIGN_LEFT;
  receipt += divider('=') + '\n';
  
  // Pedidos de mesa: não exibir dados do cliente e endereço
  const isTableOrder = order.deliveryType === 'table' || order.customerName?.startsWith('Mesa');
  
  if (!isTableOrder) {
    // Dados do cliente
    receipt += COMMANDS.FONT_DOUBLE_HEIGHT;
    receipt += COMMANDS.BOLD_ON;
    receipt += 'CLIENTE\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += COMMANDS.FONT_NORMAL;
    receipt += removeAccents(order.customerName) + '\n';
    if (order.customerPhone) {
      receipt += `Tel: ${order.customerPhone}\n`;
    }
    receipt += '\n';
    
    // Endereço (se delivery)
    if (order.deliveryType === 'delivery' && order.address) {
      receipt += COMMANDS.FONT_DOUBLE_HEIGHT;
      receipt += COMMANDS.BOLD_ON;
      receipt += 'ENDERECO\n';
      receipt += COMMANDS.BOLD_OFF;
      receipt += COMMANDS.FONT_NORMAL;
      receipt += removeAccents(order.address) + '\n';
      if (order.neighborhood) {
        receipt += removeAccents(order.neighborhood) + '\n';
      }
      receipt += '\n';
    }
  }
  
  // Divisor
  receipt += divider('=') + '\n';
  
  // Itens do pedido
  receipt += COMMANDS.FONT_DOUBLE_HEIGHT;
  receipt += COMMANDS.BOLD_ON;
  receipt += 'ITENS DO PEDIDO\n';
  receipt += COMMANDS.BOLD_OFF;
  receipt += COMMANDS.FONT_NORMAL;
  receipt += divider('-') + '\n';
  
  for (const item of order.items) {
    // Quantidade e nome
    receipt += COMMANDS.BOLD_ON;
    receipt += `${item.quantity}x ${removeAccents(item.name)}\n`;
    receipt += COMMANDS.BOLD_OFF;
    
    // Complementos
    if (item.complements) {
      const complements = item.complements.split(',').map(c => c.trim());
      for (const comp of complements) {
        receipt += `   ↳ ${removeAccents(comp)}\n`;
      }
    }
    
    // Observação do item
    if (item.observation) {
      receipt += `   OBS: ${removeAccents(item.observation)}\n`;
    }
    
    // Preço
    receipt += formatLine('', formatPrice(item.price * item.quantity)) + '\n';
    receipt += '\n';
  }
  
  // Observação geral do pedido
  if (order.observation) {
    receipt += divider('-') + '\n';
    receipt += COMMANDS.BOLD_ON;
    receipt += 'OBSERVACAO:\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += removeAccents(order.observation) + '\n';
    receipt += '\n';
  }
  
  // Divisor
  receipt += divider('=') + '\n';
  
  // Totais
  receipt += COMMANDS.FONT_DOUBLE_HEIGHT;
  receipt += formatLine('Subtotal:', formatPrice(order.subtotal)) + '\n';
  
  if (order.deliveryFee > 0) {
    receipt += formatLine('Taxa de entrega:', formatPrice(order.deliveryFee)) + '\n';
  }
  
  if (order.discount > 0) {
    receipt += formatLine('Desconto:', `-${formatPrice(order.discount)}`) + '\n';
  }
  
  receipt += COMMANDS.FONT_NORMAL;
  receipt += divider('-') + '\n';
  
  // Total em destaque
  receipt += COMMANDS.FONT_DOUBLE;
  receipt += COMMANDS.BOLD_ON;
  receipt += formatLine('TOTAL:', formatPrice(order.total), 24) + '\n';
  receipt += COMMANDS.BOLD_OFF;
  receipt += COMMANDS.FONT_NORMAL;
  receipt += '\n';
  
  // Forma de pagamento (não exibir para pedidos de mesa)
  if (!isTableOrder) {
    receipt += COMMANDS.FONT_DOUBLE_HEIGHT;
    receipt += COMMANDS.BOLD_ON;
    if (order.paymentMethod === 'card_online') {
      receipt += 'Pgto confirmado - Cartao online\n';
    } else {
      receipt += `PAGAMENTO: ${removeAccents(order.paymentMethod.toUpperCase())}\n`;
    }
    receipt += COMMANDS.BOLD_OFF;
    receipt += COMMANDS.FONT_NORMAL;
    
    // Troco (se pagamento em dinheiro)
    if (order.paymentMethod === 'cash' && order.changeFor && order.changeFor > order.total) {
      const change = order.changeFor - order.total;
      receipt += `Troco para: ${formatPrice(order.changeFor)}\n`;
      receipt += COMMANDS.BOLD_ON;
      receipt += `Troco a devolver: ${formatPrice(change)}\n`;
      receipt += COMMANDS.BOLD_OFF;
    }
    receipt += '\n';
  }
  
  // Rodapé
  receipt += divider('=') + '\n';
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += 'Obrigado pela preferencia!\n';
  receipt += '\n\n\n';
  
  // Corte do papel
  receipt += COMMANDS.CUT_PARTIAL;
  
  return receipt;
}

/**
 * Envia dados para a impressora via socket TCP
 */
export async function sendToPrinter(config: PrinterConfig, data: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const timeout = config.timeout || 5000;
    
    const socket = new net.Socket();
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };
    
    // Timeout
    const timer = setTimeout(() => {
      cleanup();
      resolve({ success: false, message: 'Timeout: impressora não respondeu' });
    }, timeout);
    
    socket.on('connect', () => {
      logger.info(`[ESC/POS] Conectado à impressora ${config.ip}:${config.port}`);
      
      // Envia os dados
      socket.write(data, 'binary', (err) => {
        clearTimeout(timer);
        
        if (err) {
          cleanup();
          resolve({ success: false, message: `Erro ao enviar dados: ${err.message}` });
        } else {
          // Aguarda um pouco para garantir que os dados foram enviados
          setTimeout(() => {
            cleanup();
            resolve({ success: true, message: 'Impressão enviada com sucesso!' });
          }, 500);
        }
      });
    });
    
    socket.on('error', (err) => {
      clearTimeout(timer);
      cleanup();
      logger.error(`[ESC/POS] Erro de conexão: ${err.message}`);
      resolve({ success: false, message: `Erro de conexão: ${err.message}` });
    });
    
    socket.on('close', () => {
      logger.info('[ESC/POS] Conexão fechada');
    });
    
    // Conecta à impressora
    logger.info(`[ESC/POS] Conectando à impressora ${config.ip}:${config.port}...`);
    socket.connect(config.port, config.ip);
  });
}

/**
 * Imprime um pedido diretamente na impressora via rede
 */
export async function printOrderDirect(
  printerConfig: PrinterConfig,
  order: OrderData
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info(`[ESC/POS] Gerando recibo para pedido #${order.orderNumber}...`);
    
    // Gera o recibo em formato ESC/POS
    const receipt = generateEscPosReceipt(order);
    
    // Envia para a impressora
    const result = await sendToPrinter(printerConfig, receipt);
    
    if (result.success) {
      logger.info(`[ESC/POS] Pedido #${order.orderNumber} impresso com sucesso!`);
    } else {
      logger.error(`[ESC/POS] Falha ao imprimir pedido #${order.orderNumber}: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`[ESC/POS] Erro ao imprimir: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }
}

/**
 * Imprime um pedido em múltiplas impressoras simultaneamente
 */
export async function printOrderToMultiplePrinters(
  printers: PrinterConfig[],
  order: OrderData
): Promise<{ success: boolean; results: Array<{ ip: string; success: boolean; message: string }> }> {
  try {
    logger.info(`[ESC/POS] Gerando recibo para pedido #${order.orderNumber} para ${printers.length} impressora(s)...`);
    
    // Gera o recibo em formato ESC/POS
    const receipt = generateEscPosReceipt(order);
    
    // Envia para todas as impressoras em paralelo
    const printPromises = printers.map(async (printer) => {
      const result = await sendToPrinter(printer, receipt);
      return {
        ip: printer.ip,
        success: result.success,
        message: result.message,
      };
    });
    
    const results = await Promise.all(printPromises);
    
    // Verifica se pelo menos uma impressora teve sucesso
    const anySuccess = results.some(r => r.success);
    
    // Log dos resultados
    for (const result of results) {
      if (result.success) {
        logger.info(`[ESC/POS] Pedido #${order.orderNumber} impresso com sucesso em ${result.ip}`);
      } else {
        logger.error(`[ESC/POS] Falha ao imprimir pedido #${order.orderNumber} em ${result.ip}: ${result.message}`);
      }
    }
    
    return {
      success: anySuccess,
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`[ESC/POS] Erro ao imprimir em múltiplas impressoras: ${errorMessage}`);
    return {
      success: false,
      results: printers.map(p => ({ ip: p.ip, success: false, message: errorMessage })),
    };
  }
}

/**
 * Testa a conexão com a impressora
 */
export async function testPrinterConnection(config: PrinterConfig): Promise<{ success: boolean; message: string }> {
  // Envia um teste simples
  const testData = COMMANDS.INIT + 
                   COMMANDS.ALIGN_CENTER + 
                   COMMANDS.FONT_DOUBLE +
                   'TESTE DE IMPRESSAO\n' +
                   COMMANDS.FONT_NORMAL +
                   '\n' +
                   'Impressora configurada!\n' +
                   '\n\n\n' +
                   COMMANDS.CUT_PARTIAL;
  
  return sendToPrinter(config, testData);
}
