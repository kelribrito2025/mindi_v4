import { useEffect, useState, useRef } from "react";
import { ClipboardList, Ticket, Star, ArrowRight, Wallet } from "lucide-react";

interface MenuSpotlightProps {
  targetRef: React.RefObject<HTMLElement | null>;
  onDismiss: () => void;
  onOpenMenu: () => void;
  /** Whether reviews feature is enabled for this establishment */
  reviewsEnabled?: boolean;
  /** Whether loyalty/coupon feature is enabled */
  loyaltyEnabled?: boolean;
  /** Whether cashback feature is enabled */
  cashbackEnabled?: boolean;
}

export function MenuSpotlight({ targetRef, onDismiss, onOpenMenu, reviewsEnabled, loyaltyEnabled, cashbackEnabled }: MenuSpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calcular posição do botão alvo
  useEffect(() => {
    const updateRect = () => {
      if (targetRef.current) {
        setTargetRect(targetRef.current.getBoundingClientRect());
      }
    };
    
    updateRect();
    // Pequeno delay para a animação de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [targetRef]);

  if (!targetRect) return null;

  // Dimensões do spotlight (círculo ao redor do botão)
  const padding = 8;
  const spotlightCx = targetRect.left + targetRect.width / 2;
  const spotlightCy = targetRect.top + targetRect.height / 2;
  const spotlightR = Math.max(targetRect.width, targetRect.height) / 2 + padding;

  // Posição do tooltip - calcular de forma que fique centrado abaixo do target
  const tooltipTop = targetRect.bottom + 16;
  const tooltipMaxWidth = 320;
  
  // Calcular posição horizontal: centralizar abaixo do target, mas manter dentro da tela
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const viewportWidth = window.innerWidth;
  
  // Tentar centralizar o tooltip abaixo do target
  let tooltipLeft = targetCenterX - tooltipMaxWidth / 2;
  
  // Garantir que não saia da tela pela direita
  if (tooltipLeft + tooltipMaxWidth > viewportWidth - 16) {
    tooltipLeft = viewportWidth - tooltipMaxWidth - 16;
  }
  // Garantir que não saia da tela pela esquerda
  if (tooltipLeft < 16) {
    tooltipLeft = 16;
  }
  
  // Posição da seta: apontar para o centro do target
  const arrowLeft = targetCenterX - tooltipLeft - 8; // 8 = metade da largura da seta (w-4 = 16px)

  // Handler unificado: fechar spotlight + abrir menu
  const handleOpenMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenMenu();
  };

  // Itens condicionais
  const featureItems: Array<{ icon: React.ReactNode; label: string; desc: string }> = [];
  
  // Meus Pedidos — sempre visível
  featureItems.push({
    icon: <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><ClipboardList className="h-4 w-4 text-blue-500" /></div>,
    label: "Meus Pedidos",
    desc: "acompanhe em tempo real",
  });

  // Cupons — só se fidelidade ativa
  if (loyaltyEnabled) {
    featureItems.push({
      icon: <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0"><Ticket className="h-4 w-4 text-green-500" /></div>,
      label: "Cupons",
      desc: "descontos exclusivos",
    });
  }

  // Cashback — só se cashback ativo
  if (cashbackEnabled) {
    featureItems.push({
      icon: <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0"><Wallet className="h-4 w-4 text-purple-500" /></div>,
      label: "Cashback",
      desc: "ganhe de volta a cada pedido",
    });
  }

  // Avaliações — só se reviews ativas
  if (reviewsEnabled) {
    featureItems.push({
      icon: <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0"><Star className="h-4 w-4 text-amber-500" /></div>,
      label: "Avaliações",
      desc: "deixe sua opinião",
    });
  }

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
      // NÃO fecha ao clicar fora — só fecha via "Abrir Menu" ou ícone hamburger
    >
      {/* SVG Overlay com recorte circular */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx={spotlightCx} cy={spotlightCy} r={spotlightR} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: "auto" }}
        />
      </svg>

      {/* Anel pulsante ao redor do botão */}
      <div
        className="absolute rounded-full border-2 border-white/80 animate-ping"
        style={{
          left: spotlightCx - spotlightR - 4,
          top: spotlightCy - spotlightR - 4,
          width: (spotlightR + 4) * 2,
          height: (spotlightR + 4) * 2,
          animationDuration: "2s",
          pointerEvents: "none",
        }}
      />
      
      {/* Anel estático branco */}
      <div
        className="absolute rounded-full border-2 border-white/60"
        style={{
          left: spotlightCx - spotlightR - 2,
          top: spotlightCy - spotlightR - 2,
          width: (spotlightR + 2) * 2,
          height: (spotlightR + 2) * 2,
          pointerEvents: "none",
        }}
      />

      {/* Área clicável sobre o botão - abre o menu */}
      <div
        className="absolute cursor-pointer"
        style={{
          left: spotlightCx - spotlightR,
          top: spotlightCy - spotlightR,
          width: spotlightR * 2,
          height: spotlightR * 2,
          borderRadius: "50%",
          zIndex: 201,
        }}
        onClick={handleOpenMenu}
      />

      {/* Tooltip / Card informativo */}
      <div
        className={`absolute transition-colors duration-500 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipMaxWidth,
          maxWidth: "calc(100vw - 32px)",
          zIndex: 202,
          pointerEvents: "auto",
        }}
      >
        {/* Seta apontando para cima - posicionada dinamicamente para apontar ao target */}
        <div
          className="absolute -top-2 w-4 h-4 bg-white rotate-45 rounded-sm"
          style={{
            left: Math.max(12, Math.min(arrowLeft, tooltipMaxWidth - 28)),
          }}
        />
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3 flex items-center">
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-lg">🎉</span> Pedido enviado!
            </span>
          </div>
          
          {/* Body */}
          <div className="px-5 py-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Toque no <strong>menu</strong> para acessar:
            </p>
            
            <div className="space-y-2.5">
              {featureItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  {item.icon}
                  <span><strong className="text-gray-800">{item.label}</strong> — {item.desc}</span>
                </div>
              ))}
            </div>
            
            {/* CTA */}
            <button
              onClick={handleOpenMenu}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:from-red-500 hover:to-rose-600 transition-transform shadow-md shadow-red-500/20 active:scale-[0.98]"
            >
              Abrir Menu
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
