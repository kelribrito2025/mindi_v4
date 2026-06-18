import { useEffect, useRef, useCallback, useState } from "react";

// ============================================
// SSE HOOK - CONEXÃO INDEPENDENTE POR ABA
// Cada aba mantém sua própria conexão SSE.
// Simples, robusto, sem BroadcastChannel.
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

const MAX_RECONNECT_ATTEMPTS = 10;
const BACKOFF_DELAYS = [1000, 2000, 5000, 10000, 20000, 30000];

// Adiciona jitter aleatório ao delay para evitar thundering herd após deploy
const getDelayWithJitter = (baseDelay: number): number => {
  const jitter = Math.random() * baseDelay * 0.5; // Jitter de até 50%
  return baseDelay + jitter;
};

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

  const [status, setStatus] = useState<SSEStatus>("disconnected");

  // Refs para manter callbacks atualizadas sem re-render
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

  // Refs para controle de reconexão
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  // Conectar ao SSE
  const connect = useCallback((estId: number) => {
    // Fechar conexão anterior se existir
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    console.log(`[SSE] Conectando ao estabelecimento ${estId}...`);
    setStatus("connecting");

    const es = new EventSource("/api/orders/stream", { withCredentials: true });
    esRef.current = es;

    // --- Conexão aberta ---
    es.onopen = () => {
      console.log("[SSE] Conexão estabelecida.");
      setStatus("connected");
      attemptsRef.current = 0;
      cbRef.current.onConnected?.();
    };

    // --- Erro / desconexão ---
    es.onerror = (event) => {
      const readyState = es.readyState;
      console.warn("[SSE] Erro na conexão – readyState:", readyState);

      if (readyState === EventSource.CLOSED) {
        es.close();
        esRef.current = null;
        setStatus("error");
        cbRef.current.onError?.(event);

        // Backoff exponencial com reset automático
        if (attemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const baseDelay = BACKOFF_DELAYS[Math.min(attemptsRef.current, BACKOFF_DELAYS.length - 1)];
          const delay = getDelayWithJitter(baseDelay);
          console.log(`[SSE] Reconectando em ${Math.round(delay)}ms (tentativa ${attemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectRef.current = setTimeout(() => {
            attemptsRef.current++;
            connect(estId);
          }, delay);
        } else {
          console.log("[SSE] Máximo de tentativas atingido. Conexão encerrada.");
          setStatus("disconnected");
          cbRef.current.onDisconnected?.();
        }
      }
      // readyState CONNECTING = browser está reconectando automaticamente, não interferir
    };

    // --- Evento: connected (confirmação do servidor) ---
    es.addEventListener("connected", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Servidor confirmou conexão – estabelecimento:", data.establishmentId);
      } catch (e) {
        console.error("[SSE] Erro ao parsear evento connected:", e);
      }
    });

    // --- Evento: novo pedido ---
    es.addEventListener("new_order", (event) => {
      console.log("[SSE] Novo pedido recebido!");
      try {
        const order = JSON.parse(event.data) as SSEOrder;
        console.log("[SSE] Pedido:", order.orderNumber, "status:", order.status);
        cbRef.current.onNewOrder?.(order);
      } catch (e) {
        console.error("[SSE] Erro ao parsear novo pedido:", e);
      }
    });

    // --- Evento: atualização de pedido ---
    es.addEventListener("order_update", (event) => {
      try {
        const update = JSON.parse(event.data) as SSEOrderUpdate;
        console.log("[SSE] Atualização de pedido:", update.id, "status:", update.status);
        cbRef.current.onOrderUpdate?.(update);
      } catch (e) {
        console.error("[SSE] Erro ao parsear atualização:", e);
      }
    });

    // --- Eventos iFood customizados: invalidam/refazem a lista de pedidos ---
    ["ifood_cancellation_requested", "ifood_order_patched", "ifood_driver_assigned", "ifood_dispute"].forEach((eventName) => {
      es.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          console.log("[SSE] Evento iFood:", eventName, data);
          cbRef.current.onOrderUpdate?.({
            id: Number(data.orderId || data.localOrderId || 0),
            status: String(data.status || data.externalStatus || "ifood_update"),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.error("[SSE] Erro ao parsear evento iFood:", eventName, e);
          cbRef.current.onOrderUpdate?.({ id: 0, status: "ifood_update", updatedAt: new Date().toISOString() });
        }
      });
    });

    // --- Evento: heartbeat (silencioso) ---
    es.addEventListener("heartbeat", () => {
      // Mantém conexão viva, sem ação necessária
    });

    // --- Evento: saldo SMS atualizado ---
    es.addEventListener("balanceUpdated", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Saldo atualizado:", data);
        cbRef.current.onBalanceUpdated?.(data);
      } catch (e) {
        console.error("[SSE] Erro ao parsear evento balanceUpdated:", e);
      }
    });
  }, []);

  // Efeito principal: conectar/desconectar
  useEffect(() => {
    if (!enabled || !establishmentId) {
      return;
    }

    connect(establishmentId);

    // Cleanup ao desmontar ou quando deps mudam
    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (esRef.current) {
        console.log("[SSE] Fechando conexão (cleanup).");
        esRef.current.close();
        esRef.current = null;
      }
      setStatus("disconnected");
      attemptsRef.current = 0;
    };
  }, [enabled, establishmentId, connect]);

  // Reconectar manualmente
  const reconnect = useCallback(() => {
    if (establishmentId) {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      attemptsRef.current = 0;
      connect(establishmentId);
    }
  }, [establishmentId, connect]);

  // Desconectar manualmente
  const disconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStatus("disconnected");
    attemptsRef.current = 0;
  }, []);

  return {
    status,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    hasError: status === "error",
    isLeader: true, // Sempre true — cada aba é independente (mantém compatibilidade)
    reconnect,
    disconnect,
  };
}
