import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { WifiOff, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "whatsapp-banner-dismissed";

export function WhatsAppDisconnectedBanner() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISS_KEY) === "true";
  });
  const [showBanner, setShowBanner] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  // Usar o getConfig que já existe — sem chamada extra
  const { data: config, refetch } = trpc.whatsapp.getConfig.useQuery(undefined, {
    // Refetch ao focar a janela (quando o usuário volta à aba)
    refetchOnWindowFocus: true,
  });

  // Determinar se o WhatsApp está desconectado
  // Só mostrar o banner se:
  // 1. O usuário já conectou pelo menos uma vez (tem instanceToken)
  // 2. E agora está desconectado (status !== 'connected')
  const hasEverConnected = config && config.instanceToken;
  const isDisconnected = hasEverConnected && config.status !== "connected";

  // Quando chega um novo pedido, re-verificar o status sem desfazer o fechamento manual.
  // Se o usuário fechou o banner enquanto o WhatsApp continua desconectado,
  // ele só deve aparecer novamente depois de reconectar e desconectar outra vez.
  const handleNewOrder = useCallback(() => {
    refetch();
  }, [refetch]);

  // Ouvir evento global de novo pedido
  useEffect(() => {
    window.addEventListener("new-order-notification", handleNewOrder);
    return () => {
      window.removeEventListener("new-order-notification", handleNewOrder);
    };
  }, [handleNewOrder]);

  // Controlar visibilidade do banner
  useEffect(() => {
    if (isDisconnected && !dismissed) {
      setShowBanner(true);
      setIsHiding(false);
    } else if (hasEverConnected && !isDisconnected) {
      localStorage.removeItem(DISMISS_KEY);
      if (dismissed) {
        setDismissed(false);
      }

      // Iniciar animação de fade-out
      setIsHiding(true);
      // Aguardar a animação terminar antes de remover do DOM
      const timer = setTimeout(() => {
        setShowBanner(false);
        setForceShow(false);
        setIsHiding(false);
      }, 300); // Duração da animação em ms
      return () => clearTimeout(timer);
    }
  }, [isDisconnected, dismissed]);

  // Forçar exibição quando novo pedido chega e está desconectado
  useEffect(() => {
    if (forceShow && isDisconnected) {
      setShowBanner(true);
    }
  }, [forceShow, isDisconnected]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    setForceShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  const handleReconnect = () => {
    // Disparar evento para a página de Pedidos abrir o modal de conexão
    window.dispatchEvent(new CustomEvent('open-whatsapp-modal'));
    // Navegar para Pedidos
    navigate("/pedidos");
  };

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "relative mx-3 lg:mx-6 mt-3 lg:mt-4 mb-0 rounded-xl overflow-hidden",
        "bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg",
        isHiding
          ? "animate-out fade-out slide-out-to-top-2 duration-300"
          : "animate-in slide-in-from-top-2 fade-in duration-300"
      )}
    >
      {/* Efeito de pulso sutil no fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      
      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Ícone pulsante */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
          <div className="relative p-2 bg-white/20 rounded-full backdrop-blur-sm">
            <WifiOff className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            WhatsApp desconectado
          </p>
          <p className="text-xs text-white/80 leading-tight mt-0.5">
            Seus clientes não estão recebendo notificações dos pedidos
          </p>
        </div>

        {/* Botão reconectar */}
        <Button
          onClick={handleReconnect}
          size="sm"
          className="flex-shrink-0 bg-white text-red-500 hover:bg-white/90 font-semibold text-xs h-8 px-3 rounded-lg gap-1.5 shadow-sm"
        >
          Reconectar
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4 text-white/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
