import { useEffect, useRef, useCallback, useState } from "react";

// ============================================
// SSE HOOK - SINGLETON CONNECTION (shared across all hook instances)
// Only ONE EventSource is created per establishment.
// Multiple hook instances share the same connection via a global ref.
// ============================================

type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

interface SSEOrder {
  id: number;
  orderNumber: string;
  establishmentId: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  deliveryType: string;
  paymentMethod: string;
  subtotal: string;
  deliveryFee?: string;
  total: string;
  notes?: string | null;
  changeAmount?: string | null;
  status: string;
  source?: "internal" | "ifood" | "rappi" | "ubereats";
  createdAt: Date | string;
  items?: Array<{
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements?: unknown[];
    notes?: string | null;
  }>;
}

interface SSEOrderUpdate {
  id: number;
  status: string;
  updatedAt: Date | string;
}

interface UseOrdersSSEOptions {
  establishmentId?: number;
  onNewOrder?: (order: SSEOrder) => void;
  onOrderUpdate?: (update: SSEOrderUpdate) => void;
  onBalanceUpdated?: (data: { balance: number; smsCount: number }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

const MAX_RECONNECT_ATTEMPTS = Infinity;
const BACKOFF_DELAYS = [1000, 2000, 5000, 10000, 20000, 30000, 60000];

const getDelayWithJitter = (baseDelay: number): number => {
  const jitter = Math.random() * baseDelay * 0.3; // Reduced jitter to 30%
  return baseDelay + jitter;
};

// ============================================
// SINGLETON SSE MANAGER
// Manages a single EventSource shared by all hook instances
// ============================================
type SSECallback = {
  onNewOrder?: (order: SSEOrder) => void;
  onOrderUpdate?: (update: SSEOrderUpdate) => void;
  onBalanceUpdated?: (data: { balance: number; smsCount: number }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
};

class SSESingleton {
  private static instance: SSESingleton | null = null;
  private eventSource: EventSource | null = null;
  private establishmentId: number | null = null;
  private status: SSEStatus = "disconnected";
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private attempts = 0;
  private subscribers = new Set<{ id: number; callbacks: SSECallback }>();
  private nextId = 0;
  private statusListeners = new Set<(status: SSEStatus) => void>();

  static getInstance(): SSESingleton {
    if (!SSESingleton.instance) {
      SSESingleton.instance = new SSESingleton();
    }
    return SSESingleton.instance;
  }

  getStatus(): SSEStatus {
    return this.status;
  }

  private setStatus(newStatus: SSEStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(listener => listener(newStatus));
  }

  onStatusChange(listener: (status: SSEStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  subscribe(callbacks: SSECallback): number {
    const id = this.nextId++;
    this.subscribers.add({ id, callbacks });
    return id;
  }

  unsubscribe(id: number) {
    for (const sub of this.subscribers) {
      if (sub.id === id) {
        this.subscribers.delete(sub);
        break;
      }
    }
    // If no more subscribers, disconnect
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
  }

  connect(estId: number) {
    // If already connected to the same establishment, skip
    if (this.eventSource && this.establishmentId === estId && this.status === "connected") {
      return;
    }
    // If connecting to a different establishment, disconnect first
    if (this.establishmentId !== estId) {
      this.disconnect();
    }

    this.establishmentId = estId;

    // If already connecting, skip
    if (this.status === "connecting") {
      return;
    }

    // Close existing connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    console.log(`[SSE] Conectando ao estabelecimento ${estId}... (${this.subscribers.size} subscribers)`);
    this.setStatus("connecting");

    const es = new EventSource("/api/orders/stream", { withCredentials: true });
    this.eventSource = es;

    es.onopen = () => {
      console.log("[SSE] Conexão estabelecida.");
      this.setStatus("connected");
      this.attempts = 0;
      this.subscribers.forEach(sub => sub.callbacks.onConnected?.());
    };

    es.onerror = (event) => {
      const readyState = es.readyState;
      if (readyState === EventSource.CLOSED) {
        es.close();
        this.eventSource = null;
        this.setStatus("error");
        this.subscribers.forEach(sub => sub.callbacks.onError?.(event));
        this.scheduleReconnect();
      }
      // readyState CONNECTING = browser auto-reconnecting, don't interfere
    };

    es.addEventListener("connected", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Servidor confirmou conexão – estabelecimento:", data.establishmentId);
      } catch (e) {
        console.error("[SSE] Erro ao parsear evento connected:", e);
      }
    });

    es.addEventListener("new_order", (event) => {
      try {
        const order = JSON.parse(event.data) as SSEOrder;
        console.log("[SSE] Novo pedido recebido:", order.orderNumber);
        this.subscribers.forEach(sub => sub.callbacks.onNewOrder?.(order));
      } catch (e) {
        console.error("[SSE] Erro ao parsear novo pedido:", e);
      }
    });

    es.addEventListener("order_update", (event) => {
      try {
        const update = JSON.parse(event.data) as SSEOrderUpdate;
        this.subscribers.forEach(sub => sub.callbacks.onOrderUpdate?.(update));
      } catch (e) {
        console.error("[SSE] Erro ao parsear atualização:", e);
      }
    });

    // iFood custom events
    ["ifood_cancellation_requested", "ifood_order_patched", "ifood_driver_assigned", "ifood_dispute"].forEach((eventName) => {
      es.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          console.log("[SSE] Evento iFood:", eventName, data);
          const update: SSEOrderUpdate = {
            id: Number(data.orderId || data.localOrderId || 0),
            status: String(data.status || data.externalStatus || "ifood_update"),
            updatedAt: new Date().toISOString(),
          };
          this.subscribers.forEach(sub => sub.callbacks.onOrderUpdate?.(update));
        } catch (e) {
          console.error("[SSE] Erro ao parsear evento iFood:", eventName, e);
          const update: SSEOrderUpdate = { id: 0, status: "ifood_update", updatedAt: new Date().toISOString() };
          this.subscribers.forEach(sub => sub.callbacks.onOrderUpdate?.(update));
        }
      });
    });

    // Heartbeat - silencioso, sem re-render
    es.addEventListener("heartbeat", () => {
      // No-op: keeps connection alive
    });

    es.addEventListener("balanceUpdated", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.subscribers.forEach(sub => sub.callbacks.onBalanceUpdated?.(data));
      } catch (e) {
        console.error("[SSE] Erro ao parsear evento balanceUpdated:", e);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.subscribers.size === 0) return;
    if (this.attempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("[SSE] Máximo de tentativas atingido.");
      this.setStatus("disconnected");
      this.subscribers.forEach(sub => sub.callbacks.onDisconnected?.());
      return;
    }

    const baseDelay = BACKOFF_DELAYS[Math.min(this.attempts, BACKOFF_DELAYS.length - 1)];
    const delay = getDelayWithJitter(baseDelay);
    console.log(`[SSE] Reconectando em ${Math.round(delay / 1000)}s (tentativa ${this.attempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.attempts++;
      if (this.establishmentId) {
        this.connect(this.establishmentId);
      }
    }, delay);
  }

  reconnect() {
    if (this.establishmentId) {
      this.attempts = 0;
      this.connect(this.establishmentId);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus("disconnected");
    this.attempts = 0;
    this.establishmentId = null;
  }
}

// Global singleton
const sseSingleton = SSESingleton.getInstance();

// ============================================
// HOOK: useOrdersSSE
// ============================================
export function useOrdersSSE(options: UseOrdersSSEOptions = {}) {
  const {
    establishmentId,
    onNewOrder,
    onOrderUpdate,
    onBalanceUpdated,
    onConnected,
    onDisconnected,
    onError,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<SSEStatus>(sseSingleton.getStatus());
  const subIdRef = useRef<number | null>(null);

  // Keep callbacks in ref to avoid re-subscribing on every render
  const cbRef = useRef({
    onNewOrder,
    onOrderUpdate,
    onBalanceUpdated,
    onConnected,
    onDisconnected,
    onError,
  });
  useEffect(() => {
    cbRef.current = { onNewOrder, onOrderUpdate, onBalanceUpdated, onConnected, onDisconnected, onError };
  }, [onNewOrder, onOrderUpdate, onBalanceUpdated, onConnected, onDisconnected, onError]);

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = sseSingleton.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    // Sync initial status
    setStatus(sseSingleton.getStatus());
    return unsubscribe;
  }, []);

  // Main effect: subscribe/connect
  useEffect(() => {
    if (!enabled || !establishmentId || establishmentId <= 0) {
      // Unsubscribe if previously subscribed
      if (subIdRef.current !== null) {
        sseSingleton.unsubscribe(subIdRef.current);
        subIdRef.current = null;
      }
      return;
    }

    // Subscribe with proxy callbacks that delegate to cbRef
    const id = sseSingleton.subscribe({
      onNewOrder: (order) => cbRef.current.onNewOrder?.(order),
      onOrderUpdate: (update) => cbRef.current.onOrderUpdate?.(update),
      onBalanceUpdated: (data) => cbRef.current.onBalanceUpdated?.(data),
      onConnected: () => cbRef.current.onConnected?.(),
      onDisconnected: () => cbRef.current.onDisconnected?.(),
      onError: (error) => cbRef.current.onError?.(error),
    });
    subIdRef.current = id;

    // Connect (singleton will skip if already connected)
    sseSingleton.connect(establishmentId);

    return () => {
      if (subIdRef.current !== null) {
        sseSingleton.unsubscribe(subIdRef.current);
        subIdRef.current = null;
      }
    };
  }, [enabled, establishmentId]);

  const reconnect = useCallback(() => {
    sseSingleton.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    sseSingleton.disconnect();
  }, []);

  return {
    status,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    hasError: status === "error",
    isLeader: true,
    reconnect,
    disconnect,
  };
}

// ============================================
// VISIBILITY CHANGE - Debounced reconnect on tab focus
// ============================================
export function useSSEVisibilityReconnect(
  sseStatus: SSEStatus,
  reconnectFn: () => void,
  refetchFn: () => void
) {
  const lastRefetchRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce: don't refetch if we did it less than 3s ago
        const now = Date.now();
        if (now - lastRefetchRef.current < 3000) {
          return;
        }
        lastRefetchRef.current = now;

        console.log("[SSE] Aba voltou ao foco");
        if (sseStatus === 'disconnected' || sseStatus === 'error') {
          console.log("[SSE] Reconectando após retorno ao foco...");
          reconnectFn();
        }
        // Refetch with debounce
        refetchFn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sseStatus, reconnectFn, refetchFn]);
}
