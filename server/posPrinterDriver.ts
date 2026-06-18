import { logger } from "./_core/logger";
/**
 * POSPrinterDriver Integration
 * 
 * Permite impressão automática via servidor usando a API do POSPrinterDriver.
 * Documentação: https://www.posprinterdriver.com/printfromserver
 */

const POS_PRINTER_API_URL = 'https://gestion.posprinterdriver.com/api/v1/api/sendatatoprinter';

interface PrintResult {
  success: boolean;
  message: string;
  error?: string;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: string;
  changeFor?: string;
  items: Array<{
    quantity: number;
    productName: string;
    totalPrice: number | string;
    notes?: string;
    complements?: string;
  }>;
  subtotal: number | string;
  deliveryFee?: number | string;
  discount?: number | string;
  couponCode?: string;
  total: number | string;
  notes?: string;
  createdAt: Date | string;
}

interface EstablishmentData {
  name: string;
}

interface PrinterSettingsData {
  copies?: number;
  headerMessage?: string;
  footerMessage?: string;
  paperWidth?: string;
  posPrinterLinkcode?: string;
  posPrinterNumber?: number;
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number | string | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

/**
 * Formata data para exibição
 */
function formatDate(date: Date | string, timezone?: string): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || 'America/Sao_Paulo'
  });
}

/**
 * Gera o texto formatado para impressão ESC/POS
 * Usa comandos especiais:
 * - $intro$ = Nova linha
 * - $cut$ = Cortar papel (se suportado)
 */
function generateReceiptText(
  order: OrderData,
  establishment: EstablishmentData,
  settings: PrinterSettingsData
): string {
  const lines: string[] = [];
  const is58mm = settings.paperWidth === '58mm';
  const lineWidth = is58mm ? 32 : 48;
  
  // Função para centralizar texto
  const center = (text: string): string => {
    const padding = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  // Função para criar linha com valor à direita
  const lineWithValue = (label: string, value: string): string => {
    const spaces = Math.max(1, lineWidth - label.length - value.length);
    return label + ' '.repeat(spaces) + value;
  };
  
  // Função para criar divisor
  const divider = (): string => '-'.repeat(lineWidth);
  const doubleDivider = (): string => '='.repeat(lineWidth);
  
  // Cabeçalho
  lines.push(center(establishment.name.toUpperCase()));
  if (settings.headerMessage) {
    lines.push(center(settings.headerMessage));
  }
  lines.push('');
  lines.push(doubleDivider());
  lines.push(center(`PEDIDO #${order.orderNumber}`));
  lines.push(center(formatDate(order.createdAt, (establishment as any)?.timezone)));
  lines.push(center(order.deliveryType === 'delivery' ? '*** ENTREGA ***' : '*** RETIRADA ***'));
  lines.push(doubleDivider());
  
  // Cliente
  lines.push('');
  lines.push(`CLIENTE: ${order.customerName || 'Nao informado'}`);
  if (order.customerPhone) {
    lines.push(`TEL: ${order.customerPhone}`);
  }
  if (order.deliveryType === 'delivery' && order.customerAddress) {
    lines.push(`ENDERECO:`);
    // Quebrar endereço em linhas se muito longo
    const address = order.customerAddress;
    if (address.length > lineWidth) {
      const words = address.split(' ');
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).length > lineWidth) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          currentLine += ' ' + word;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
    } else {
      lines.push(address);
    }
  }
  
  // Itens
  lines.push('');
  lines.push(divider());
  lines.push(center('ITENS DO PEDIDO'));
  lines.push(divider());
  
  for (const item of order.items) {
    lines.push('');
    lines.push(`${item.quantity}x ${item.productName}`);
    lines.push(lineWithValue('', formatCurrency(item.totalPrice)));
    
    if (item.notes) {
      lines.push(`   OBS: ${item.notes}`);
    }
    
    // Complementos
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' 
          ? JSON.parse(item.complements) 
          : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                const priceStr = ci.price > 0 ? ` ${formatCurrency(ci.price)}` : '';
                lines.push(`   ↳ ${ci.name}${priceStr}`);
              }
            }
          }
        }
      } catch (e) {
        // Ignorar erros de parse
      }
    }
  }
  
  // Totais
  lines.push('');
  lines.push(divider());
  lines.push(lineWithValue('Subtotal:', formatCurrency(order.subtotal)));
  
  if (order.deliveryType === 'delivery' && order.deliveryFee) {
    lines.push(lineWithValue('Taxa entrega:', formatCurrency(order.deliveryFee)));
  }
  
  if (order.discount && parseFloat(String(order.discount)) > 0) {
    const discountLabel = order.couponCode 
      ? `Desconto (${order.couponCode}):` 
      : 'Desconto:';
    lines.push(lineWithValue(discountLabel, `-${formatCurrency(order.discount)}`));
  }
  
  lines.push(doubleDivider());
  lines.push(lineWithValue('TOTAL:', formatCurrency(order.total)));
  lines.push(doubleDivider());
  
  // Pagamento
  const paymentMethodText: Record<string, string> = {
    'cash': 'Dinheiro',
    'credit': 'Cartao Credito',
    'debit': 'Cartao Debito',
    'card': 'Cartao',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'card_online': 'Pgto confirmado - Cartao online',
    'pix_online': 'Pgto confirmado - Pix online'
  };
  
  lines.push('');
  if (order.paymentMethod === 'card_online') {
    lines.push('Pgto confirmado - Cartao online');
  } else if (order.paymentMethod === 'pix_online') {
    lines.push('Pgto confirmado - Pix online');
  } else {
    lines.push(`PAGAMENTO: ${paymentMethodText[order.paymentMethod] || order.paymentMethod}`);
  }
  
  if (order.paymentMethod === 'cash' && order.changeFor) {
    lines.push(`Troco para: ${formatCurrency(order.changeFor)}`);
    const changeForNum = typeof order.changeFor === 'string' ? parseFloat(order.changeFor) : order.changeFor;
    const totalNum = typeof order.total === 'string' ? parseFloat(order.total as string) : Number(order.total);
    if (changeForNum > totalNum) {
      lines.push(`Troco a devolver: ${formatCurrency(changeForNum - totalNum)}`);
    }
  }
  
  // Observações
  if (order.notes) {
    lines.push('');
    lines.push(divider());
    lines.push('OBSERVACOES:');
    lines.push(order.notes);
  }
  
  // Rodapé
  lines.push('');
  lines.push(divider());
  if (settings.footerMessage) {
    lines.push(center(settings.footerMessage));
  }
  lines.push(center('Obrigado pela preferencia!'));
  lines.push('');
  lines.push('');
  lines.push('');
  
  // Converter para formato POSPrinterDriver (usar $intro$ para nova linha)
  return lines.join('$intro$');
}

/**
 * Envia dados para impressão via POSPrinterDriver API
 */
export async function printViaPOSPrinterDriver(
  order: OrderData,
  establishment: EstablishmentData,
  settings: PrinterSettingsData
): Promise<PrintResult> {
  if (!settings.posPrinterLinkcode) {
    return {
      success: false,
      message: 'Linkcode do POSPrinterDriver não configurado',
      error: 'MISSING_LINKCODE'
    };
  }
  
  try {
    // Gerar texto do recibo
    const receiptText = generateReceiptText(order, establishment, settings);
    
    // Número de cópias
    const copies = settings.copies || 1;
    
    // Enviar para cada cópia
    for (let i = 0; i < copies; i++) {
      const response = await fetch(POS_PRINTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkcode: settings.posPrinterLinkcode,
          data: receiptText,
          pn: settings.posPrinterNumber || 1
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        logger.error('[POSPrinterDriver] Erro na API:', result);
        return {
          success: false,
          message: result.message || 'Erro ao enviar para impressora',
          error: result.error || 'API_ERROR'
        };
      }
      
      logger.info(`[POSPrinterDriver] Cópia ${i + 1}/${copies} enviada com sucesso`);
    }
    
    return {
      success: true,
      message: `Pedido #${order.orderNumber} enviado para impressão (${copies} cópia${copies > 1 ? 's' : ''})`
    };
    
  } catch (error) {
    logger.error('[POSPrinterDriver] Erro ao enviar impressão:', error);
    return {
      success: false,
      message: 'Erro de conexão com POSPrinterDriver',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Testa a conexão com o POSPrinterDriver enviando uma mensagem de teste
 */
export async function testPOSPrinterConnection(
  linkcode: string,
  printerNumber: number = 1
): Promise<PrintResult> {
  if (!linkcode) {
    return {
      success: false,
      message: 'Linkcode não informado',
      error: 'MISSING_LINKCODE'
    };
  }
  
  try {
    const testMessage = [
      '================================',
      '    TESTE DE IMPRESSAO',
      '================================',
      '',
      'POSPrinterDriver conectado!',
      '',
      'Sua impressora esta funcionando',
      'corretamente.',
      '',
      `Data: ${formatDate(new Date(), 'America/Sao_Paulo')}`,
      '',
      '================================',
      '',
      '',
      ''
    ].join('$intro$');
    
    const response = await fetch(POS_PRINTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkcode: linkcode,
        data: testMessage,
        pn: printerNumber
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok || result.error) {
      return {
        success: false,
        message: result.message || 'Erro ao conectar com impressora',
        error: result.error || 'API_ERROR'
      };
    }
    
    return {
      success: true,
      message: 'Teste enviado com sucesso! Verifique sua impressora.'
    };
    
  } catch (error) {
    logger.error('[POSPrinterDriver] Erro no teste:', error);
    return {
      success: false,
      message: 'Erro de conexão com POSPrinterDriver',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}
