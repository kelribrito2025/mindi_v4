/**
 * Singleton SSE para gerenciar conexão única de acompanhamento de pedidos no menu público
 * 
 * Regras:
 * 1. Apenas UMA conexão SSE por cliente (singleton)
 * 2. Conexão só é aberta APÓS o pedido ser criado
 * 3. Reutiliza conexão existente se já estiver aberta
 * 4. Tratamento silencioso de erro 429 com reconexão após delay
 * 5. Reconecta automaticamente quando novos pedidos são adicionados
 */

type OrderStatus = "sent" | "accepted" | "delivering" | "delivered" | "cancelled";

interface OrderStatusUpdate {
  id?: number;
  orderNumber: string;
  status: string;
  cancellationReason?: string;
}

type StatusUpdateCallback = (update: OrderStatusUpdate) => void;

// Delays de backoff exponencial em ms
const BACKOFF_DELAYS = [3000, 6000, 12000, 24000, 60000];

// Adiciona jitter aleatório ao delay para evitar thundering herd após deploy
const getDelayWithJitter = (baseDelay: number): number => {
  const jitter = Math.random() * baseDelay * 0.5; // Jitter de até 50%
  return baseDelay + jitter;
};

class OrderSSEManager {
  private static instance: OrderSSEManager | null = null;
  private eventSource: EventSource | null = null;
  private connectedOrders: Set<string> = new Set();
  private callbacks: Map<string, StatusUpdateCallback[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isConnecting: boolean = false;
  private lastConnectedOrdersHash: string = "";
  private reconnectDebounceTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): OrderSSEManager {
    if (!OrderSSEManager.instance) {
      OrderSSEManager.instance = new OrderSSEManager();
    }
    return OrderSSEManager.instance;
  }

  /**
   * Verifica se a conexão está ativa
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Verifica se está tentando conectar
   */
  isConnectionPending(): boolean {
    return this.isConnecting;
  }

  /**
   * Gera hash dos pedidos para comparação
   */
  private getOrdersHash(): string {
    return Array.from(this.connectedOrders).sort().join(',');
  }

  /**
   * Adiciona um pedido para ser monitorado
   * Se já existe conexão ABERTA, reconecta para incluir o novo pedido
   * Se não existe conexão, cria nova
   */
  trackOrder(orderNumber: string, callback: StatusUpdateCallback): void {
    console.log(`[SSE-Public] trackOrder chamado para: ${orderNumber}`);
    
    // Registrar callback para este pedido
    if (!this.callbacks.has(orderNumber)) {
      this.callbacks.set(orderNumber, []);
    }
    this.callbacks.get(orderNumber)!.push(callback);
    
    // Se o pedido já está sendo monitorado na conexão atual, não precisa reconectar
    if (this.connectedOrders.has(orderNumber) && this.lastConnectedOrdersHash.includes(orderNumber)) {
      console.log(`[SSE-Public] Pedido ${orderNumber} já está sendo monitorado na conexão atual`);
      return;
    }
    
    // Adicionar à lista de pedidos
    this.connectedOrders.add(orderNumber);
    console.log(`[SSE-Public] Adicionando pedido: ${orderNumber}. Total: ${this.connectedOrders.size}`);
    
    // Agendar reconexão com debounce para evitar múltiplas reconexões
    this.scheduleReconnect();
  }

  /**
   * Agenda uma reconexão com debounce
   * Isso evita múltiplas reconexões quando vários pedidos são adicionados em sequência
   */
  private scheduleReconnect(): void {
    // Limpar timeout anterior se existir
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
    }
    
    // Agendar reconexão após 100ms
    this.reconnectDebounceTimeout = setTimeout(() => {
      this.reconnectDebounceTimeout = null;
      
      // Verificar se precisa reconectar
      const currentHash = this.getOrdersHash();
      if (currentHash !== this.lastConnectedOrdersHash) {
        console.log(`[SSE-Public] Hash mudou, reconectando... (${this.lastConnectedOrdersHash} -> ${currentHash})`);
        this.forceReconnect();
      } else if (!this.isConnected() && !this.isConnecting) {
        console.log(`[SSE-Public] Não conectado, iniciando conexão...`);
        this.connect();
      }
    }, 100);
  }

  /**
   * Atualiza o callback de um pedido (substitui todos os callbacks existentes)
   * Usado para garantir que o callback sempre use os valores mais recentes das refs
   */
  updateCallback(orderNumber: string, callback: StatusUpdateCallback): void {
    // Sempre registrar o callback, mesmo que o pedido não esteja em connectedOrders ainda
    this.callbacks.set(orderNumber, [callback]);
    console.log(`[SSE-Public] Callback atualizado para pedido: ${orderNumber}`);
    
    // Se o pedido não está sendo monitorado, adicionar
    if (!this.connectedOrders.has(orderNumber)) {
      this.connectedOrders.add(orderNumber);
      console.log(`[SSE-Public] Pedido ${orderNumber} adicionado via updateCallback. Total: ${this.connectedOrders.size}`);
      this.scheduleReconnect();
    }
  }

  /**
   * Adiciona um callback adicional para um pedido (sem substituir os existentes)
   * Retorna uma função para remover o callback
   * Usado pelo modal de tracking para receber atualizações em tempo real
   */
  addCallback(orderNumber: string, callback: StatusUpdateCallback): () => void {
    console.log(`[SSE-Public] addCallback chamado para: ${orderNumber}`);
    console.log(`[SSE-Public] Estado atual - isConnected: ${this.isConnected()}, isConnecting: ${this.isConnecting}, connectedOrders: ${this.connectedOrders.size}`);
    console.log(`[SSE-Public] Pedidos conectados: ${Array.from(this.connectedOrders).join(', ')}`);
    console.log(`[SSE-Public] Hash atual: ${this.lastConnectedOrdersHash}`);
    
    if (!this.callbacks.has(orderNumber)) {
      this.callbacks.set(orderNumber, []);
    }
    
    // Adicionar o callback à lista
    this.callbacks.get(orderNumber)!.push(callback);
    console.log(`[SSE-Public] Callback adicional registrado para pedido: ${orderNumber}. Total callbacks: ${this.callbacks.get(orderNumber)!.length}`);
    
    // Se o pedido não está sendo monitorado, adicionar
    if (!this.connectedOrders.has(orderNumber)) {
      this.connectedOrders.add(orderNumber);
      console.log(`[SSE-Public] Pedido ${orderNumber} adicionado via addCallback. Total: ${this.connectedOrders.size}`);
    }
    
    // Verificar se precisa conectar/reconectar
    const currentHash = this.getOrdersHash();
    if (!this.isConnected() && !this.isConnecting) {
      console.log(`[SSE-Public] Conexão não ativa - iniciando conexão SSE via addCallback`);
      this.connect();
    } else if (currentHash !== this.lastConnectedOrdersHash) {
      console.log(`[SSE-Public] Hash diferente - reconectando para incluir pedido ${orderNumber}`);
      this.scheduleReconnect();
    } else {
      console.log(`[SSE-Public] Conexão já ativa com pedido ${orderNumber} incluído`);
    }
    
    // Retornar função de cleanup que remove apenas este callback específico
    return () => {
      const callbacks = this.callbacks.get(orderNumber);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
          console.log(`[SSE-Public] Callback removido para pedido: ${orderNumber}. Callbacks restantes: ${callbacks.length}`);
        }
      }
    };
  }

  /**
   * Remove um pedido do monitoramento
   */
  untrackOrder(orderNumber: string): void {
    this.connectedOrders.delete(orderNumber);
    this.callbacks.delete(orderNumber);
    console.log(`[SSE-Public] Removendo pedido: ${orderNumber}. Restantes: ${this.connectedOrders.size}`);
    
    // Se não há mais pedidos, fechar conexão
    if (this.connectedOrders.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Força reconexão
   */
  private forceReconnect(): void {
    console.log('[SSE-Public] Forçando reconexão...');
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
    this.lastConnectedOrdersHash = "";
    this.connect();
  }

  /**
   * Conecta ao SSE com os pedidos atuais
   */
  private connect(): void {
    // Se já está conectando, aguardar
    if (this.isConnecting) {
      console.log('[SSE-Public] Já está conectando, aguardando...');
      return;
    }

    // Se não há pedidos para monitorar, não conectar
    if (this.connectedOrders.size === 0) {
      console.log('[SSE-Public] Nenhum pedido para monitorar');
      return;
    }

    // Verificar se a lista de pedidos mudou
    const currentHash = this.getOrdersHash();
    if (this.isConnected() && currentHash === this.lastConnectedOrdersHash) {
      console.log('[SSE-Public] Conexão já ativa com mesmos pedidos');
      return;
    }

    // Fechar conexão anterior se existir
    if (this.eventSource) {
      console.log('[SSE-Public] Fechando conexão anterior');
      this.eventSource.close();
      this.eventSource = null;
    }

    // Limpar timeout de reconexão
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isConnecting = true;

    // Criar lista de orderIds para o endpoint por ID (sem colisão com reset diário)
    const orderIds = Array.from(this.connectedOrders).join(',');
    const url = `/api/orders/track/stream/byid?ids=${encodeURIComponent(orderIds)}`;
    
    console.log(`[SSE-Public] Conectando com ${this.connectedOrders.size} pedidos (por orderId): ${orderIds}`);
    
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.addEventListener('connected', (event) => {
        console.log('[SSE-Public] Conexão estabelecida');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastConnectedOrdersHash = this.getOrdersHash();
        console.log(`[SSE-Public] Hash atualizado para: ${this.lastConnectedOrdersHash}`);
      });

      this.eventSource.addEventListener('order_status_update', (event) => {
        try {
          const data: OrderStatusUpdate = JSON.parse(event.data);
          // O orderId é a chave usada em connectedOrders e callbacks
          const orderId = data.id ? data.id.toString() : data.orderNumber;
          console.log('[SSE-Public] Atualização recebida: orderId=', orderId, 'orderNumber=', data.orderNumber, '->', data.status);
          console.log('[SSE-Public] Callbacks registrados para este pedido:', this.callbacks.get(orderId)?.length || 0);
          console.log('[SSE-Public] Todos os pedidos com callbacks:', Array.from(this.callbacks.keys()));
          
          // Notificar todos os callbacks registrados para este pedido (por orderId)
          const callbacks = this.callbacks.get(orderId);
          if (callbacks && callbacks.length > 0) {
            console.log('[SSE-Public] Chamando', callbacks.length, 'callbacks para orderId', orderId);
            // Fazer uma cópia do array para evitar problemas se um callback se remover durante a iteração
            [...callbacks].forEach(cb => {
              try {
                cb(data);
              } catch (e) {
                console.error('[SSE-Public] Erro ao executar callback:', e);
              }
            });
          } else {
            console.log('[SSE-Public] NENHUM callback encontrado para orderId', orderId);
          }
        } catch (e) {
          console.error('[SSE-Public] Erro ao processar evento:', e);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // Heartbeat silencioso
      });

      this.eventSource.onerror = (error) => {
        console.warn('[SSE-Public] Erro na conexão');
        this.isConnecting = false;
        this.lastConnectedOrdersHash = "";
        this.handleConnectionError();
      };

      this.eventSource.onopen = () => {
        console.log('[SSE-Public] Conexão aberta');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastConnectedOrdersHash = this.getOrdersHash();
        console.log(`[SSE-Public] Hash atualizado para: ${this.lastConnectedOrdersHash}`);
      };

    } catch (error) {
      console.error('[SSE-Public] Erro ao criar EventSource:', error);
      this.isConnecting = false;
      this.handleConnectionError();
    }
  }

  /**
   * Trata erros de conexão com reconexão silenciosa
   * Implementa backoff exponencial para evitar rate limiting
   */
  private handleConnectionError(): void {
    // Se não há mais pedidos, não tentar reconectar
    if (this.connectedOrders.size === 0) {
      return;
    }

    // Incrementar tentativas
    this.reconnectAttempts++;

    // Se excedeu o limite, parar de tentar
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log('[SSE-Public] Máximo de tentativas atingido. Parando reconexão.');
      return;
    }

    // Calcular delay com backoff exponencial + jitter
    const delayIndex = Math.min(this.reconnectAttempts - 1, BACKOFF_DELAYS.length - 1);
    const baseDelay = BACKOFF_DELAYS[delayIndex];
    const delay = getDelayWithJitter(baseDelay);
    
    console.log(`[SSE-Public] Reconectando em ${Math.round(delay/1000)}s (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Desconecta do SSE
   */
  disconnect(): void {
    console.log('[SSE-Public] Desconectando...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
      this.reconnectDebounceTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.lastConnectedOrdersHash = "";
  }

  /**
   * Limpa todos os dados e desconecta
   */
  reset(): void {
    this.disconnect();
    this.connectedOrders.clear();
    this.callbacks.clear();
  }

  /**
   * Retorna os pedidos sendo monitorados
   */
  getTrackedOrders(): string[] {
    return Array.from(this.connectedOrders);
  }

  /**
   * Retorna status da conexão
   */
  getStatus(): { connected: boolean; connecting: boolean; orders: number; attempts: number; hash: string } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      orders: this.connectedOrders.size,
      attempts: this.reconnectAttempts,
      hash: this.lastConnectedOrdersHash,
    };
  }
}

// Exportar instância singleton
export const orderSSE = OrderSSEManager.getInstance();

// Mapeamento de status do backend para frontend
export const statusMap: Record<string, OrderStatus> = {
  'new': 'sent',
  'preparing': 'accepted',
  'ready': 'delivering',
  'completed': 'delivered',
  'cancelled': 'cancelled',
};
