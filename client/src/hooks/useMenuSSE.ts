/**
 * Hook SSE para o menu público.
 * 
 * Mantém uma conexão SSE com /api/menu/:slug/stream e invalida
 * automaticamente as queries tRPC relevantes quando eventos são recebidos.
 * 
 * Eventos suportados:
 * - story_created / story_deleted → invalida queries de stories
 * - product_updated / product_deleted → invalida queries de produtos (futuro)
 * - category_updated → invalida queries de categorias (futuro)
 * - establishment_updated / establishment_closed / establishment_opened → invalida establishment (futuro)
 * - menu_refresh → invalida tudo (futuro)
 * 
 * Usa backoff exponencial para reconexão em caso de falha.
 */

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

// Delays de backoff exponencial em ms
const BACKOFF_DELAYS = [2000, 4000, 8000, 16000, 30000];
const MAX_RECONNECT_ATTEMPTS = 5;

// Adiciona jitter aleatório ao delay para evitar thundering herd após deploy
const getDelayWithJitter = (baseDelay: number): number => {
  const jitter = Math.random() * baseDelay * 0.5; // Jitter de até 50%
  return baseDelay + jitter;
};

type MenuSSEEventType =
  | "story_created"
  | "story_updated"
  | "story_deleted"
  | "product_updated"
  | "product_deleted"
  | "category_updated"
  | "establishment_updated"
  | "establishment_closed"
  | "establishment_opened"
  | "menu_refresh";

interface UseMenuSSEOptions {
  /** Slug do menu público (obrigatório para abrir conexão) */
  slug: string | undefined;
  /** ID do estabelecimento (usado para invalidar queries corretas) */
  establishmentId: number | undefined;
  /** Se true, a conexão SSE será habilitada. Default: true */
  enabled?: boolean;
}

export function useMenuSSE({ slug, establishmentId, enabled = true }: UseMenuSSEOptions) {
  const utils = trpc.useUtils();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const enabledRef = useRef(enabled);
  const slugRef = useRef(slug);

  // Manter refs atualizadas
  enabledRef.current = enabled;
  slugRef.current = slug;

  const handleEvent = useCallback(
    (eventType: MenuSSEEventType, _data: unknown) => {
      console.log(`[SSE-Menu-Client] Evento recebido: ${eventType}`);

      switch (eventType) {
        case "story_created":
        case "story_updated":
        case "story_deleted":
          // Invalidar queries de stories para forçar refetch
          if (establishmentId) {
            utils.publicStories.getActive.invalidate({ establishmentId });
            utils.publicStories.hasActive.invalidate({ establishmentId });
          }
          break;

        case "product_updated":
        case "product_deleted":
        case "category_updated":
          // Futuro: invalidar queries de produtos/categorias
          if (slug) {
            utils.publicMenu.getBySlug.invalidate({ slug });
          }
          break;

        case "establishment_updated":
        case "establishment_closed":
        case "establishment_opened":
          // Invalidar query do menu para refletir status aberto/fechado em tempo real
          if (slug) {
            utils.publicMenu.getBySlug.invalidate({ slug });
          }
          break;

        case "menu_refresh":
          // Futuro: invalidar tudo
          if (slug) {
            utils.publicMenu.getBySlug.invalidate({ slug });
          }
          if (establishmentId) {
            utils.publicStories.getActive.invalidate({ establishmentId });
            utils.publicStories.hasActive.invalidate({ establishmentId });
          }
          break;
      }
    },
    [establishmentId, slug, utils]
  );

  const connect = useCallback(() => {
    const currentSlug = slugRef.current;
    if (!currentSlug || !enabledRef.current) return;

    // Fechar conexão anterior se existir
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Limpar timeout de reconexão
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log(`[SSE-Menu-Client] Conectando a /api/menu/${currentSlug}/stream`);

    const es = new EventSource(`/api/menu/${currentSlug}/stream`);
    esRef.current = es;

    es.addEventListener("connected", () => {
      console.log("[SSE-Menu-Client] Conexão estabelecida");
      attemptsRef.current = 0;
    });

    // Registrar listeners para todos os tipos de eventos suportados
    const eventTypes: MenuSSEEventType[] = [
      "story_created",
      "story_updated",
      "story_deleted",
      "product_updated",
      "product_deleted",
      "category_updated",
      "establishment_updated",
      "establishment_closed",
      "establishment_opened",
      "menu_refresh",
    ];

    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          handleEvent(eventType, data);
        } catch (e) {
          console.error(`[SSE-Menu-Client] Erro ao processar evento ${eventType}:`, e);
        }
      });
    });

    es.addEventListener("heartbeat", () => {
      // Heartbeat silencioso - mantém a conexão viva
    });

    es.onerror = () => {
      console.warn("[SSE-Menu-Client] Erro na conexão");
      es.close();
      esRef.current = null;

      // Reconectar com backoff exponencial
      if (!enabledRef.current || !slugRef.current) return;

      attemptsRef.current++;
      if (attemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        console.log("[SSE-Menu-Client] Máximo de tentativas atingido. Parando reconexão.");
        return;
      }

      const delayIndex = Math.min(attemptsRef.current - 1, BACKOFF_DELAYS.length - 1);
      const baseDelay = BACKOFF_DELAYS[delayIndex];
      const delay = getDelayWithJitter(baseDelay);

      console.log(
        `[SSE-Menu-Client] Reconectando em ${Math.round(delay / 1000)}s (tentativa ${attemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [handleEvent]);

  useEffect(() => {
    if (!slug || !enabled) {
      // Desconectar se desabilitado ou sem slug
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    connect();

    // Cleanup ao desmontar
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [slug, enabled, connect]);
}
