import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CalendarOff, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "closure-banner-dismissed";

export function ScheduledClosureBanner({ className }: { className?: string } = {}) {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });
  const [showBanner, setShowBanner] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  const { data } = trpc.scheduledClosures.upcoming.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const nextClosure = data?.nextClosure;
  const hasUpcoming = !!nextClosure;

  // Controlar visibilidade do banner
  useEffect(() => {
    if (hasUpcoming && !dismissed) {
      setShowBanner(true);
      setIsHiding(false);
    } else if (!hasUpcoming) {
      setIsHiding(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setIsHiding(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasUpcoming, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsHiding(true);
    sessionStorage.setItem(DISMISS_KEY, "true");
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleViewDetails = () => {
    // Navegar via SPA para evitar reload da página
    const targetPath = "/configuracoes";
    const params = new URLSearchParams({ section: "atendimento", scrollTo: "fechamentos-programados" });
    const fullPath = `${targetPath}?${params.toString()}`;
    
    if (window.location.pathname === targetPath) {
      // Já estamos na página de configurações - atualizar search params sem reload
      window.history.pushState({}, "", fullPath);
      // Disparar evento para que a página reaja à mudança de params
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      navigate(fullPath);
    }
  };

  if (!showBanner || !nextClosure) return null;

  // Texto dinâmico baseado no momento: se é hoje, já está em vigor; se é futuro, é aviso
  const getTitle = () => {
    if (nextClosure.daysUntil === 0) return "Estabelecimento fechado hoje";
    if (nextClosure.daysUntil === 1) return "Fechamento programado para amanhã";
    return `Fechamento programado em ${nextClosure.daysUntil} dias`;
  };

  const getSubtitle = () => {
    const parts: string[] = [];
    // Capitalizar primeira letra do label
    const capitalizedLabel = nextClosure.label.charAt(0).toUpperCase() + nextClosure.label.slice(1);
    parts.push(capitalizedLabel);
    if (nextClosure.reason) {
      parts.push(`— ${nextClosure.reason}`);
    }
    return parts.join(" ");
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shrink-0",
        className,
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
            <CalendarOff className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            {getTitle()}
          </p>
          <p className="text-xs text-white/80 leading-tight mt-0.5 truncate">
            {getSubtitle()}
          </p>
        </div>

        {/* Botão ver detalhes */}
        <Button
          onClick={handleViewDetails}
          size="sm"
          className="flex-shrink-0 bg-white text-red-500 hover:bg-white/90 font-semibold text-xs h-8 px-3 rounded-lg gap-1.5 shadow-sm"
        >
          Ver detalhes
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
