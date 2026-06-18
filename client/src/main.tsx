import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

// Função de retry com backoff exponencial + jitter para evitar thundering herd após deploy
const retryWithBackoff = (failureCount: number, error: unknown): boolean => {
  // Não fazer retry em erros de autenticação
  if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') return false;
  // Máximo 3 tentativas
  if (failureCount >= 3) return false;
  return true;
};

// Delay de retry com backoff exponencial + jitter aleatório
const retryDelay = (attemptIndex: number): number => {
  const baseDelay = Math.min(1000 * Math.pow(2, attemptIndex), 15000); // 1s, 2s, 4s... max 15s
  const jitter = Math.random() * baseDelay * 0.5; // Jitter de até 50% do delay base
  return baseDelay + jitter;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: retryWithBackoff,
      retryDelay: retryDelay,
    },
    mutations: {
      retry: 0, // Mutações não devem fazer retry automático
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login";
};

// Verificar se é um erro de pattern do Safari (intermitente)
const isSafariPatternError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('string did not match the expected pattern') ||
           error.message.includes('The string did not match');
  }
  return false;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // Ignorar erros de pattern do Safari
    if (isSafariPatternError(error)) {
      console.warn('[API] Safari pattern error ignored:', error);
      return;
    }
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    // Ignorar erros de pattern do Safari
    if (isSafariPatternError(error)) {
      console.warn('[API] Safari pattern error ignored:', error);
      return;
    }
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Fetch customizado com verificação de Content-Type (Safari fix)
// Cloudflare ainda pode manter cache de GETs tRPC quando há regra de cache agressiva.
// Para endpoints autenticados, acrescentamos um cache-buster local antes do fetch.
const withTRPCNoCacheParam = (input: RequestInfo | URL, init?: RequestInit): RequestInfo | URL => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (method !== "GET") return input;

  const rawUrl = input instanceof Request ? input.url : String(input);
  if (!rawUrl.includes("/api/trpc")) return input;

  const url = new URL(rawUrl, window.location.origin);
  url.searchParams.set("__mindi_nocache", Date.now() + "-" + Math.random().toString(36).slice(2));
  const nextUrl = url.pathname + url.search + url.hash;

  if (input instanceof Request) {
    return new Request(nextUrl, input);
  }
  return nextUrl;
};

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await globalThis.fetch(withTRPCNoCacheParam(input, init), {
    ...(init ?? {}),
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  // P20: Verificar Content-Type antes de permitir parse JSON
  // Previne erro "string did not match the expected pattern" no Safari
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok && !contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Resposta inesperada do servidor (${response.status}): ${text.substring(0, 100)}`
    );
  }
  return response;
};
// Queries lentas que fazem chamadas externas e não devem bloquear o batch
const SLOW_QUERIES = ['whatsapp.getStatus', 'pdvCustomer.detailsTab', 'pdvCustomer.stats'];

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => SLOW_QUERIES.includes(op.path),
      // Queries lentas vão por httpLink individual (sem batch)
      true: httpLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch: customFetch,
      }),
      // Todas as outras queries vão pelo batch normal
      false: httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch: customFetch,
      }),
    }),
  ],
});

// Registrar Service Worker para PWA
if ("serviceWorker" in navigator) {
  let serviceWorkerRefreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (serviceWorkerRefreshing) return;
    serviceWorkerRefreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=20260518-push-v4", { updateViaCache: "none" })
      .then((registration) => {
        console.log("[PWA] Service Worker registrado:", registration.scope);

        const activateWaitingWorker = () => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        };

        activateWaitingWorker();
        registration.update();

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error("[PWA] Erro ao registrar Service Worker:", error);
      });
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "NAVIGATE") {
      const url = event.data.url || "/pedidos";
      console.log("[PWA] Navegação SPA via push notification:", url);
      window.history.pushState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  });
}
createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
