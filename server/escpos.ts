/**
 * ESC/POS Command Generator
 * 
 * Gera comandos ESC/POS para impressoras térmicas antigas
 * Compatível com impressoras 58mm e 80mm
 * 
 * Referência: https://reference.epson-biz.com/modules/ref_escpos/index.php
 */

// Comandos ESC/POS básicos
export const ESC = '\x1B';  // Escape
export const GS = '\x1D';   // Group Separator
export const LF = '\x0A';   // Line Feed
export const CR = '\x0D';   // Carriage Return
export const HT = '\x09';   // Horizontal Tab
export const FF = '\x0C';   // Form Feed

// Comandos de inicialização e reset
export const INIT = `${ESC}@`;                    // Inicializa impressora
export const RESET = `${ESC}@`;                   // Reset para configurações padrão

// Comandos de alinhamento
export const ALIGN_LEFT = `${ESC}a\x00`;          // Alinhamento à esquerda
export const ALIGN_CENTER = `${ESC}a\x01`;        // Alinhamento centralizado
export const ALIGN_RIGHT = `${ESC}a\x02`;         // Alinhamento à direita

// Comandos de fonte
export const FONT_A = `${ESC}M\x00`;              // Fonte A (padrão)
export const FONT_B = `${ESC}M\x01`;              // Fonte B (menor)
export const FONT_C = `${ESC}M\x02`;              // Fonte C (se disponível)

// Comandos de tamanho de caractere
export const TEXT_NORMAL = `${GS}!\x00`;          // Tamanho normal
export const TEXT_2H = `${GS}!\x01`;              // Altura dupla
export const TEXT_2W = `${GS}!\x10`;              // Largura dupla
export const TEXT_2X = `${GS}!\x11`;              // Altura e largura dupla
export const TEXT_3H = `${GS}!\x02`;              // Altura tripla
export const TEXT_3W = `${GS}!\x20`;              // Largura tripla
export const TEXT_4X = `${GS}!\x33`;              // 4x altura e largura

// Comandos de estilo
export const BOLD_ON = `${ESC}E\x01`;             // Negrito ligado
export const BOLD_OFF = `${ESC}E\x00`;            // Negrito desligado
export const UNDERLINE_ON = `${ESC}-\x01`;        // Sublinhado ligado
export const UNDERLINE_OFF = `${ESC}-\x00`;       // Sublinhado desligado
export const UNDERLINE_2 = `${ESC}-\x02`;         // Sublinhado duplo
export const INVERSE_ON = `${GS}B\x01`;           // Texto invertido ligado
export const INVERSE_OFF = `${GS}B\x00`;          // Texto invertido desligado

// Comandos de corte de papel
export const CUT_FULL = `${GS}V\x00`;             // Corte total
export const CUT_PARTIAL = `${GS}V\x01`;          // Corte parcial
export const CUT_FEED_FULL = `${GS}V\x41\x03`;    // Alimenta e corta total
export const CUT_FEED_PARTIAL = `${GS}V\x42\x03`; // Alimenta e corta parcial

// Comandos de alimentação de papel
export const FEED_1 = `${ESC}d\x01`;              // Alimenta 1 linha
export const FEED_2 = `${ESC}d\x02`;              // Alimenta 2 linhas
export const FEED_3 = `${ESC}d\x03`;              // Alimenta 3 linhas
export const FEED_4 = `${ESC}d\x04`;              // Alimenta 4 linhas
export const FEED_5 = `${ESC}d\x05`;              // Alimenta 5 linhas

// Comandos de gaveta de dinheiro
export const DRAWER_KICK = `${ESC}p\x00\x19\xFA`; // Abre gaveta de dinheiro

// Comandos de beep
export const BEEP = `${ESC}B\x02\x02`;            // Beep 2 vezes

// Caracteres especiais para linhas
export const LINE_SINGLE = '-';
export const LINE_DOUBLE = '=';
export const LINE_STAR = '*';

/**
 * Interface para configurações de impressão ESC/POS
 */
export interface EscPosConfig {
  paperWidth: '58mm' | '80mm';
  showDividers: boolean;
  encoding?: 'cp850' | 'cp437' | 'iso-8859-1';
}

/**
 * Interface para dados do pedido
 */
export interface OrderData {
  orderNumber: string;
  createdAt: Date | string;
  deliveryType: 'delivery' | 'pickup' | 'dine_in';
  customerName?: string;
  customerPhone?: string;
  address?: string;
  addressComplement?: string;
  neighborhood?: string;
  paymentMethod?: string;
  changeFor?: number;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
}

export interface OrderItem {
  productName: string;
  quantity: number;
  totalPrice: number;
  notes?: string;
  complements?: string | Complement[];
}

export interface Complement {
  name: string;
  price: number;
  quantity?: number;
  items?: { name: string; price: number; quantity?: number }[];
}

/**
 * Classe para geração de comandos ESC/POS
 */
export class EscPosGenerator {
  private config: EscPosConfig;
  private charsPerLine: number;
  private buffer: string[] = [];

  constructor(config: Partial<EscPosConfig> = {}) {
    this.config = {
      paperWidth: config.paperWidth || '80mm',
      showDividers: config.showDividers ?? false,
      encoding: config.encoding || 'cp850'
    };
    
    // Define caracteres por linha baseado na largura do papel
    this.charsPerLine = this.config.paperWidth === '58mm' ? 32 : 48;
  }

  /**
   * Inicializa a impressora
   */
  init(): this {
    this.buffer.push(INIT);
    return this;
  }

  /**
   * Define alinhamento do texto
   */
  align(alignment: 'left' | 'center' | 'right'): this {
    switch (alignment) {
      case 'left':
        this.buffer.push(ALIGN_LEFT);
        break;
      case 'center':
        this.buffer.push(ALIGN_CENTER);
        break;
      case 'right':
        this.buffer.push(ALIGN_RIGHT);
        break;
    }
    return this;
  }

  /**
   * Define tamanho do texto
   */
  size(size: 'normal' | '2h' | '2w' | '2x' | '3h' | '3w' | '4x'): this {
    switch (size) {
      case 'normal':
        this.buffer.push(TEXT_NORMAL);
        break;
      case '2h':
        this.buffer.push(TEXT_2H);
        break;
      case '2w':
        this.buffer.push(TEXT_2W);
        break;
      case '2x':
        this.buffer.push(TEXT_2X);
        break;
      case '3h':
        this.buffer.push(TEXT_3H);
        break;
      case '3w':
        this.buffer.push(TEXT_3W);
        break;
      case '4x':
        this.buffer.push(TEXT_4X);
        break;
    }
    return this;
  }

  /**
   * Ativa/desativa negrito
   */
  bold(on: boolean = true): this {
    this.buffer.push(on ? BOLD_ON : BOLD_OFF);
    return this;
  }

  /**
   * Ativa/desativa sublinhado
   */
  underline(mode: 'off' | 'single' | 'double' = 'single'): this {
    switch (mode) {
      case 'off':
        this.buffer.push(UNDERLINE_OFF);
        break;
      case 'single':
        this.buffer.push(UNDERLINE_ON);
        break;
      case 'double':
        this.buffer.push(UNDERLINE_2);
        break;
    }
    return this;
  }

  /**
   * Ativa/desativa texto invertido (fundo preto, texto branco)
   */
  inverse(on: boolean = true): this {
    this.buffer.push(on ? INVERSE_ON : INVERSE_OFF);
    return this;
  }

  /**
   * Adiciona texto
   */
  text(content: string): this {
    // Remove acentos para compatibilidade com impressoras antigas
    const normalized = this.normalizeText(content);
    this.buffer.push(normalized);
    return this;
  }

  /**
   * Adiciona texto com quebra de linha
   */
  line(content: string = ''): this {
    const normalized = this.normalizeText(content);
    this.buffer.push(normalized + LF);
    return this;
  }

  /**
   * Adiciona linhas em branco
   */
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  /**
   * Adiciona linha divisória
   */
  divider(char: '-' | '=' | '*' = '-'): this {
    if (this.config.showDividers) {
      this.buffer.push(char.repeat(this.charsPerLine) + LF);
    }
    return this;
  }

  /**
   * Adiciona linha com texto à esquerda e à direita
   */
  leftRight(left: string, right: string): this {
    const leftNorm = this.normalizeText(left);
    const rightNorm = this.normalizeText(right);
    const spaces = this.charsPerLine - leftNorm.length - rightNorm.length;
    const spacer = spaces > 0 ? ' '.repeat(spaces) : ' ';
    this.buffer.push(leftNorm + spacer + rightNorm + LF);
    return this;
  }

  /**
   * Adiciona texto centralizado com padding
   */
  centered(content: string, padChar: string = ' '): this {
    const normalized = this.normalizeText(content);
    const totalPad = this.charsPerLine - normalized.length;
    const leftPad = Math.floor(totalPad / 2);
    const rightPad = totalPad - leftPad;
    this.buffer.push(
      padChar.repeat(Math.max(0, leftPad)) + 
      normalized + 
      padChar.repeat(Math.max(0, rightPad)) + 
      LF
    );
    return this;
  }

  /**
   * Corta o papel
   */
  cut(partial: boolean = true): this {
    this.buffer.push(partial ? CUT_FEED_PARTIAL : CUT_FEED_FULL);
    return this;
  }

  /**
   * Abre gaveta de dinheiro
   */
  openDrawer(): this {
    this.buffer.push(DRAWER_KICK);
    return this;
  }

  /**
   * Emite beep
   */
  beep(): this {
    this.buffer.push(BEEP);
    return this;
  }

  /**
   * Normaliza texto removendo acentos para compatibilidade
   */
  private normalizeText(text: string): string {
    // Mapa de substituição de caracteres acentuados
    const map: Record<string, string> = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c',
      'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
      'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C',
      'ñ': 'n', 'Ñ': 'N'
    };
    
    return text.split('').map(char => map[char] || char).join('');
  }

  /**
   * Trunca texto para caber na largura da linha
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Quebra texto em múltiplas linhas
   */
  private wrapText(text: string, maxWidth: number = this.charsPerLine): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxWidth ? word.substring(0, maxWidth) : word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  /**
   * Retorna o buffer como string
   */
  build(): string {
    return this.buffer.join('');
  }

  /**
   * Retorna o buffer como Buffer de bytes
   */
  toBuffer(): Buffer {
    return Buffer.from(this.build(), 'binary');
  }

  /**
   * Limpa o buffer
   */
  clear(): this {
    this.buffer = [];
    return this;
  }

  /**
   * Gera recibo completo de pedido
   */
  generateReceipt(order: OrderData, establishment: any): this {
    const formatCurrency = (value: number | null | undefined) => {
      const num = value || 0;
      return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    const timezone = establishment?.timezone || 'America/Sao_Paulo';
    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });
    };

    const formatPhone = (phone: string | null | undefined): string => {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
      } else if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      }
      return phone;
    };

    const deliveryTypeText: Record<string, string> = {
      'delivery': 'ENTREGA',
      'pickup': 'RETIRADA',
      'dine_in': 'CONSUMO'
    };

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

    // Inicializa impressora
    this.init();

    // Cabeçalho com nome do estabelecimento
    this.align('center')
      .size('2x')
      .bold()
      .line(this.normalizeText(establishment?.name || 'RESTAURANTE'))
      .size('normal')
      .bold(false)
      .feed(1);

    // Número do pedido em destaque
    this.align('center')
      .size('2x')
      .bold()
      .inverse()
      .line(` PEDIDO ${order.orderNumber} `)
      .inverse(false)
      .size('normal')
      .bold(false)
      .feed(1);

    // Data e hora
    this.align('center')
      .line(formatDate(order.createdAt))
      .feed(1);

    // Tipo de entrega em destaque
    this.align('center')
      .size('2w')
      .bold()
      .inverse()
      .line(` ${deliveryTypeText[order.deliveryType] || 'PEDIDO'} `)
      .inverse(false)
      .size('normal')
      .bold(false);

    this.divider('=');

    // Dados do cliente
    if (order.customerName || order.customerPhone) {
      this.align('left')
        .bold()
        .line('CLIENTE')
        .bold(false);
      
      if (order.customerName) {
        this.line(this.normalizeText(order.customerName));
      }
      if (order.customerPhone) {
        this.line(`Tel: ${formatPhone(order.customerPhone)}`);
      }
      this.divider('-');
    }

    // Endereço de entrega
    if (order.deliveryType === 'delivery' && order.address) {
      this.align('left')
        .bold()
        .line('ENDERECO DE ENTREGA')
        .bold(false);
      
      // Quebra endereço em múltiplas linhas se necessário
      const addressLines = this.wrapText(this.normalizeText(order.address));
      addressLines.forEach(line => this.line(line));
      
      if (order.addressComplement) {
        this.line(this.normalizeText(order.addressComplement));
      }
      if (order.neighborhood) {
        this.line(this.normalizeText(order.neighborhood));
      }
      this.divider('-');
    }

    // Itens do pedido
    this.align('left')
      .bold()
      .line('ITENS DO PEDIDO')
      .bold(false)
      .divider('-');

    for (const item of order.items) {
      // Nome e quantidade do item
      const itemHeader = `${item.quantity}x ${this.normalizeText(item.productName)}`;
      const itemPrice = formatCurrency(item.totalPrice);
      
      // Se o nome for muito longo, quebra em linhas
      if (itemHeader.length + itemPrice.length + 1 > this.charsPerLine) {
        this.bold()
          .line(this.truncate(itemHeader, this.charsPerLine - itemPrice.length - 1))
          .bold(false)
          .align('right')
          .line(itemPrice)
          .align('left');
      } else {
        this.bold();
        this.leftRight(itemHeader, itemPrice);
        this.bold(false);
      }

      // Observações do item
      if (item.notes) {
        this.line(`  Obs: ${this.normalizeText(item.notes)}`);
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
                // Estrutura antiga com grupos
                for (const ci of comp.items) {
                  const qty = ci.quantity || 1;
                  const qtyPrefix = qty > 1 ? `${qty}x ` : '';
                  const compText = `  ↳ ${qtyPrefix}${this.normalizeText(ci.name)}`;
                  const compPrice = ci.price > 0 ? formatCurrency(ci.price * qty) : '';
                  if (compPrice) {
                    this.leftRight(compText, compPrice);
                  } else {
                    this.line(compText);
                  }
                }
              } else if (comp.name) {
                // Estrutura nova direta
                const qty = comp.quantity || 1;
                const qtyPrefix = qty > 1 ? `${qty}x ` : '';
                const compText = `  ↳ ${qtyPrefix}${this.normalizeText(comp.name)}`;
                const compPrice = comp.price > 0 ? formatCurrency(comp.price * qty) : '';
                if (compPrice) {
                  this.leftRight(compText, compPrice);
                } else {
                  this.line(compText);
                }
              }
            }
          }
        } catch (e) {
          // Ignora erros de parse
        }
      }

      this.feed(1);
    }

    this.divider('=');

    // Totais
    this.align('left');
    this.leftRight('Subtotal:', formatCurrency(order.subtotal));
    
    if (order.deliveryFee && order.deliveryFee > 0) {
      this.leftRight('Taxa de entrega:', formatCurrency(order.deliveryFee));
    }
    
    if (order.discount && order.discount > 0) {
      this.leftRight('Desconto:', `-${formatCurrency(order.discount)}`);
    }

    this.divider('-');

    // Total em destaque
    this.size('2x')
      .bold()
      .inverse()
      .leftRight(' TOTAL:', `${formatCurrency(order.total)} `)
      .inverse(false)
      .size('normal')
      .bold(false);

    this.divider('=');

    // Forma de pagamento
    if (order.paymentMethod === 'card_online') {
      this.align('left')
        .bold()
        .line('Pgto confirmado - Cartao online')
        .bold(false);
    } else if (order.paymentMethod === 'pix_online') {
      this.align('left')
        .bold()
        .line('Pgto confirmado - Pix online')
        .bold(false);
    } else {
      this.align('left')
        .bold()
        .line('FORMA DE PAGAMENTO')
        .bold(false)
        .line(paymentMethodText[order.paymentMethod || ''] || order.paymentMethod || 'Nao informado');
    }

    // Troco (se pagamento em dinheiro)
    if (order.paymentMethod === 'cash') {
      if (order.changeFor && order.changeFor > order.total) {
        const change = order.changeFor - order.total;
        this.line(`Troco para: ${formatCurrency(order.changeFor)}`);
        this.bold()
          .line(`Troco a devolver: ${formatCurrency(change)}`)
          .bold(false);
      } else {
        this.line('Nao precisa de troco');
      }
    }

    // Rodapé
    this.feed(2)
      .align('center')
      .line('Obrigado pela preferencia!')
      .line('Volte sempre!')
      .feed(3)
      .cut();

    return this;
  }
}

/**
 * Função helper para gerar recibo ESC/POS
 */
export function generateEscPosReceipt(
  order: OrderData,
  establishment: any,
  config?: Partial<EscPosConfig>
): string {
  const generator = new EscPosGenerator(config);
  return generator.generateReceipt(order, establishment).build();
}

/**
 * Função helper para gerar recibo ESC/POS como Buffer
 */
export function generateEscPosReceiptBuffer(
  order: OrderData,
  establishment: any,
  config?: Partial<EscPosConfig>
): Buffer {
  const generator = new EscPosGenerator(config);
  return generator.generateReceipt(order, establishment).toBuffer();
}

/**
 * Gera texto simples formatado para impressão (fallback)
 * Layout limpo com header centralizado, separadores = e -, complementos com pontos
 */
export function generatePlainTextReceipt(
  order: OrderData,
  establishment: any,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const charsPerLine = paperWidth === '58mm' ? 32 : 48;
  const dividerSingle = '-'.repeat(charsPerLine);
  const dividerDouble = '='.repeat(charsPerLine);
  
  const formatCurrency = (value: number | null | undefined) => {
    const num = value || 0;
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  const timezone = establishment?.timezone || 'America/Sao_Paulo';
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: timezone
    });
    const timeStr = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
    return `${dateStr} - ${timeStr}`;
  };

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((charsPerLine - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const leftRight = (left: string, right: string) => {
    const spaces = Math.max(1, charsPerLine - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
  };

  /**
   * Formata complemento com preenchimento de pontos entre nome e preço
   * Ex: "  ↳ Bacon extra ........ R$ 5,00"
   */
  const complementLine = (name: string, price: string) => {
    const prefix = '  ↳ ';
    const nameText = prefix + name + ' ';
    const priceText = ' ' + price;
    const dotsNeeded = charsPerLine - nameText.length - priceText.length;
    if (dotsNeeded > 0) {
      return nameText + '.'.repeat(dotsNeeded) + priceText;
    }
    return leftRight(prefix + name, price);
  };

  const normalize = (text: string) => {
    const map: Record<string, string> = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u',
      'ç': 'c',
      'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I',
      'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U',
      'Ç': 'C'
    };
    return text.split('').map(c => map[c] || c).join('');
  };

  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const deliveryTypeText: Record<string, string> = {
    'delivery': 'ENTREGA',
    'pickup': 'RETIRADA',
    'dine_in': 'CONSUMO'
  };

  const paymentMethodText: Record<string, string> = {
    'cash': 'DINHEIRO',
    'credit': 'CARTAO CREDITO',
    'debit': 'CARTAO DEBITO',
    'card': 'CARTAO',
    'pix': 'PIX',
    'boleto': 'BOLETO',
    'card_online': 'PGTO CONFIRMADO - CARTAO ONLINE',
    'pix_online': 'PGTO CONFIRMADO - PIX ONLINE'
  };

  let receipt = '';
  const estName = normalize(establishment?.name || 'RESTAURANTE').toUpperCase();
  
  // ===== CABEÇALHO =====
  receipt += center(estName) + '\n';
  receipt += '\n';

  // Linha condensada: #P99 23/02/2026 - 23:16 | ENTREGA |
  const isScheduled = (order as any).isScheduled || (order as any).scheduledAt;
  const badgeText = isScheduled ? 'AGENDADO' : (deliveryTypeText[order.deliveryType] || 'PEDIDO');
  const headerLine = `#${order.orderNumber} ${formatDate(order.createdAt)} | ${badgeText} |`;
  receipt += center(headerLine) + '\n';
  receipt += dividerDouble + '\n';

  // Seção de agendamento
  if (isScheduled && (order as any).scheduledAt) {
    const scheduledDate = new Date((order as any).scheduledAt);
    const schedDateStr = scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: timezone });
    const schedTimeStr = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
    receipt += `AGENDADO PARA: ${schedDateStr} - ${schedTimeStr}\n`;
    receipt += dividerSingle + '\n';
  }

  // Pedidos de mesa: não exibir dados do cliente, endereço e pagamento
  const isTableOrder = order.deliveryType === 'dine_in' && order.customerName?.startsWith('Mesa');
  
  // ===== CLIENTE =====
  if (!isTableOrder && (order.customerName || order.customerPhone)) {
    receipt += `CLIENTE: ${normalize(order.customerName || 'Nao informado')}\n`;
    if (order.customerPhone) {
      receipt += `Tel: ${formatPhone(order.customerPhone)}\n`;
    }
    receipt += '\n';
  }

  // ===== ENDEREÇO =====
  if (!isTableOrder && order.deliveryType === 'delivery' && order.address) {
    receipt += 'ENDERECO\n';
    receipt += normalize(order.address) + '\n';
    if (order.addressComplement) receipt += normalize(order.addressComplement) + '\n';
    if (order.neighborhood) receipt += normalize(order.neighborhood) + '\n';
  }
  receipt += dividerSingle + '\n';

  // ===== ITENS =====
  receipt += 'ITENS\n';

  for (const item of order.items) {
    // Linha do item: quantidade x nome + preço na mesma linha
    const itemName = `${item.quantity}x ${normalize(item.productName).toUpperCase()}`;

    // Verifica se tem complementos
    let hasComplements = false;
    let parsedComplements: any[] = [];
    if (item.complements) {
      try {
        parsedComplements = typeof item.complements === 'string'
          ? JSON.parse(item.complements)
          : item.complements;
        if (Array.isArray(parsedComplements) && parsedComplements.length > 0) {
          hasComplements = parsedComplements.some(comp => 
            (comp.items && Array.isArray(comp.items) && comp.items.length > 0) || comp.name
          );
        }
      } catch (e) {}
    }

    if (hasComplements) {
      // Calcula preço base do item (totalPrice - soma dos complementos)
      let complementsTotal = 0;
      for (const comp of parsedComplements) {
        if (comp.items && Array.isArray(comp.items)) {
          for (const ci of comp.items) {
            const qty = ci.quantity || 1;
            if (ci.price > 0) complementsTotal += ci.price * qty;
          }
        } else if (comp.name && comp.price > 0) {
          const qty = comp.quantity || 1;
          complementsTotal += comp.price * qty;
        }
      }
      // Preço total do item (base + complementos)
      const itemTotalPrice = formatCurrency(item.totalPrice);

      // Nome do item + preço total na mesma linha
      receipt += leftRight(itemName, itemTotalPrice) + '\n';

      // Complementos com pontos
      for (const comp of parsedComplements) {
        if (comp.items && Array.isArray(comp.items)) {
          for (const ci of comp.items) {
            const qty = ci.quantity || 1;
            const qtyPrefix = qty > 1 ? `${qty}x ` : '';
            const compName = `${qtyPrefix}${normalize(ci.name)}`;
            if (ci.price > 0) {
              receipt += complementLine(compName, formatCurrency(ci.price * qty)) + '\n';
            } else {
              receipt += `  ↳ ${compName}\n`;
            }
          }
        } else if (comp.name) {
          const qty = comp.quantity || 1;
          const qtyPrefix = qty > 1 ? `${qty}x ` : '';
          const compName = `${qtyPrefix}${normalize(comp.name)}`;
          if (comp.price > 0) {
            receipt += complementLine(compName, formatCurrency(comp.price * qty)) + '\n';
          } else {
            receipt += `  ↳ ${compName}\n`;
          }
        }
      }
      // NÃO mostra total do item abaixo dos complementos (evita confusão)
    } else {
      // Sem complementos: nome e preço na mesma linha
      receipt += leftRight(itemName, formatCurrency(item.totalPrice)) + '\n';
    }

    // Observações do item
    if (item.notes) {
      receipt += `  Obs: ${normalize(item.notes)}\n`;
    }
  }

  // ===== OBSERVAÇÕES DO PEDIDO =====
  if (order.notes) {
    receipt += dividerSingle + '\n';
    receipt += 'OBS DO PEDIDO:\n';
    receipt += normalize(order.notes) + '\n';
  }

  receipt += dividerSingle + '\n';

  // ===== TOTAIS =====
  receipt += leftRight('Subtotal:', formatCurrency(order.subtotal)) + '\n';
  if (order.deliveryFee && order.deliveryFee > 0) {
    receipt += leftRight('Taxa entrega:', formatCurrency(order.deliveryFee)) + '\n';
  }
  if (order.discount && order.discount > 0) {
    receipt += leftRight('Desconto:', `-${formatCurrency(order.discount)}`) + '\n';
  }
  receipt += dividerDouble + '\n';
  receipt += leftRight('TOTAL:', formatCurrency(order.total)) + '\n';
  receipt += dividerDouble + '\n';

  // ===== PAGAMENTO =====
  if (!isTableOrder) {
    if (order.paymentMethod === 'card_online') {
      receipt += 'PAGAMENTO: PGTO CONFIRMADO - CARTAO ONLINE\n';
    } else if (order.paymentMethod === 'pix_online') {
      receipt += 'PAGAMENTO: PGTO CONFIRMADO - PIX ONLINE\n';
    } else {
      const pmText = paymentMethodText[order.paymentMethod || ''] || (order.paymentMethod || 'NAO INFORMADO').toUpperCase();
      receipt += `PAGAMENTO: ${pmText}\n`;
    }

    if (order.paymentMethod === 'cash') {
      if (order.changeFor && order.changeFor > order.total) {
        const change = order.changeFor - order.total;
        receipt += `Troco para: ${formatCurrency(order.changeFor)}\n`;
        receipt += `Troco a devolver: ${formatCurrency(change)}\n`;
      } else {
        receipt += 'Nao precisa de troco\n';
      }
    }
  }

  // ===== RODAPÉ =====
  receipt += '\n';
  receipt += center('Obrigado pela preferencia!') + '\n';
  receipt += center('Volte sempre!') + '\n';
  receipt += '\n\n\n';

  return receipt;
}

export function generateCashReceiptText(
  data: {
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
  },
  establishment: any,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const charsPerLine = paperWidth === '58mm' ? 32 : 48;
  const dividerSingle = '-'.repeat(charsPerLine);
  const dividerDouble = '='.repeat(charsPerLine);

  const formatCurrency = (value: number | null | undefined) => {
    const num = value || 0;
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  const timezone = establishment?.timezone || 'America/Sao_Paulo';

  const formatDate = (date: Date | string | null) => {
    if (!date) return '--';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: timezone
    });
    const timeStr = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: timezone
    });
    return `${dateStr} - ${timeStr}`;
  };

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((charsPerLine - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const leftRight = (left: string, right: string) => {
    const spaces = Math.max(1, charsPerLine - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
  };

  const normalize = (text: string) => {
    const map: Record<string, string> = {
      '\u00e1': 'a', '\u00e0': 'a', '\u00e3': 'a', '\u00e2': 'a',
      '\u00e9': 'e', '\u00e8': 'e', '\u00ea': 'e',
      '\u00ed': 'i', '\u00ec': 'i', '\u00ee': 'i',
      '\u00f3': 'o', '\u00f2': 'o', '\u00f5': 'o', '\u00f4': 'o',
      '\u00fa': 'u', '\u00f9': 'u', '\u00fb': 'u',
      '\u00e7': 'c',
      '\u00c1': 'A', '\u00c0': 'A', '\u00c3': 'A', '\u00c2': 'A',
      '\u00c9': 'E', '\u00c8': 'E', '\u00ca': 'E',
      '\u00cd': 'I', '\u00cc': 'I', '\u00ce': 'I',
      '\u00d3': 'O', '\u00d2': 'O', '\u00d5': 'O', '\u00d4': 'O',
      '\u00da': 'U', '\u00d9': 'U', '\u00db': 'U',
      '\u00c7': 'C'
    };
    return text.split('').map(c => map[c] || c).join('');
  };

  // Traduz os nomes dos metodos de pagamento para portugues
  const translateMethod = (method: string): string => {
    const map: Record<string, string> = {
      cash: 'Vendas Dinheiro',
      pix_online: 'Vendas Pix online',
      pix: 'Vendas Pix estatico',
      card: 'Vendas Cartao',
    };
    return map[method] || normalize(method);
  };

  let receipt = '';

  // ===== CABECALHO =====
  const estName = normalize(data.storeName || establishment?.name || 'RESTAURANTE').toUpperCase();
  receipt += center(estName) + '\n';
  receipt += center('CONTROLE DE CAIXA') + '\n';
  receipt += '\n';
  receipt += center(data.closedAt ? 'FECHAMENTO DE CAIXA' : 'RELATORIO PARCIAL') + '\n';
  receipt += dividerDouble + '\n';

  // ===== INFORMACOES DO TURNO =====
  receipt += 'INFORMACOES DO TURNO\n';
  receipt += dividerSingle + '\n';
  receipt += leftRight('Operador:', normalize(data.operatorName)) + '\n';
  receipt += leftRight('Abertura:', formatDate(data.openedAt)) + '\n';
  receipt += leftRight(data.closedAt ? 'Fechamento:' : 'Parcial em:', data.closedAt ? formatDate(data.closedAt) : formatDate(new Date().toISOString())) + '\n';
  receipt += dividerSingle + '\n';

  // ===== RESUMO FINANCEIRO =====
  receipt += '\n';
  receipt += 'RESUMO FINANCEIRO\n';
  receipt += dividerSingle + '\n';
  receipt += leftRight('Fundo de Caixa:', formatCurrency(data.openingAmount)) + '\n';

  // Breakdown de pagamentos com nomes traduzidos
  for (const p of data.paymentBreakdown) {
    const label = p.count > 0
      ? `${translateMethod(p.method)} (${p.count}x):`
      : `${translateMethod(p.method)}:`;
    receipt += leftRight(label, formatCurrency(p.total)) + '\n';
  }

  receipt += dividerSingle + '\n';
  receipt += leftRight(`Total Vendas (${data.salesCount}x):`, formatCurrency(data.salesTotal)) + '\n';
  receipt += dividerDouble + '\n';
  receipt += leftRight('SALDO FINAL:', formatCurrency(data.closingAmount)) + '\n';
  receipt += dividerDouble + '\n';

  // ===== MOVIMENTACOES =====
  if (data.movements && data.movements.length > 0) {
    receipt += '\n';
    receipt += 'MOVIMENTACOES\n';
    receipt += dividerSingle + '\n';
    for (const m of data.movements) {
      const typeLabel = m.type === 'entrada' ? '+' : '-';
      receipt += leftRight(`${typeLabel} ${normalize(m.reason || m.type)}`, `R$ ${m.amount}`) + '\n';
    }
    receipt += dividerSingle + '\n';
  }

  // ===== RODAPE =====
  receipt += '\n';
  receipt += center('Documento gerado automaticamente') + '\n';
  receipt += center('www.mindi.com.br') + '\n';
  receipt += '\n\n\n';

  return receipt;
}
