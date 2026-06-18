import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  X, ChevronRight, Gift, Heart, Star, Eye, Phone, Loader2, Check,
  Ticket, Copy, CheckCircle, Clock, AlertTriangle, QrCode
} from "lucide-react";
import { toast } from "sonner";

export function LoyaltyIntroSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center px-0 md:px-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-md bg-white rounded-t-[30px] md:rounded-[30px] shadow-2xl overflow-hidden min-h-[87dvh] max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
        <div className="relative h-[47dvh] min-h-[310px] max-h-[450px] overflow-hidden rounded-t-[30px]">
          <img
            src="/assets/loyalty-intro-red-phone.webp"
            alt="Cliente feliz usando o programa de fidelidade pelo celular"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar introdução do programa de fidelidade"
            className="absolute right-5 top-5 h-11 w-11 rounded-full bg-slate-900/70 text-white shadow-lg backdrop-blur-sm flex items-center justify-center hover:bg-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative -mt-12 flex flex-1 flex-col px-6 pb-5 text-center bg-gradient-to-b from-white/0 via-white to-white">
          <div className="self-center inline-flex items-center gap-1.5 rounded-full bg-red-50/95 px-3.5 py-1.5 text-[12px] font-bold text-red-500 shadow-sm border border-red-100/80">
            <Gift className="h-3.5 w-3.5" />
            Programa de Fidelidade
          </div>
          <h2 className="mt-4 text-[22px] font-black tracking-tight text-gray-950 leading-tight">
            Ganhe recompensas a cada pedido!
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
            Acumule carimbos a cada pedido concluído e ganhe <strong className="text-red-500 font-black">cupons exclusivos</strong> quando completar seu cartão.
          </p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-pink-50/95 flex items-center justify-center text-pink-500 shadow-[0_8px_24px_rgba(236,72,153,0.16)]">
                <Heart className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500">Peça</span>
            </div>
            <div className="mt-[22px] h-px w-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-amber-50/95 flex items-center justify-center text-amber-500 shadow-[0_8px_24px_rgba(245,158,11,0.16)]">
                <Star className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500">Acumule</span>
            </div>
            <div className="mt-[22px] h-px w-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-emerald-50/95 flex items-center justify-center text-emerald-500 shadow-[0_8px_24px_rgba(16,185,129,0.16)]">
                <Gift className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500">Ganhe</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-auto w-full rounded-xl bg-red-500 py-3 text-base font-semibold text-white shadow-md shadow-red-500/20 hover:bg-red-500 active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoyaltyLoginForm({
  phone,
  setPhone,
  password,
  setPassword,
  error,
  isLoading,
  onLogin,
  onRegister,
}: {
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  isLoading: boolean;
  onLogin: () => void;
  onRegister: () => void;
}) {
  // Formatar telefone (aceita 10 ou 11 dígitos)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={e =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            maxLength={15}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha (4 dígitos)
          </label>
          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
            maxLength={4}
            autoComplete="new-password"
            name="loyalty-password-login"
          />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={onLogin}
          disabled={isLoading || phone.length < 10 || password.length !== 4}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Ainda não tem cartão?</p>
        <button
          onClick={onRegister}
          className="text-red-500 font-semibold hover:underline"
        >
          Cadastre-se agora
        </button>
      </div>
    </div>
  );
}

export function LoyaltyRegisterForm({
  phone,
  setPhone,
  password,
  setPassword,
  name,
  setName,
  error,
  isLoading,
  onRegister,
  onBack,
}: {
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  error: string;
  isLoading: boolean;
  onRegister: () => void;
  onBack: () => void;
}) {
  // Formatar telefone (aceita 10 ou 11 dígitos)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome (opcional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={e =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            maxLength={15}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crie uma senha (4 dígitos)
          </label>
          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
            maxLength={4}
            autoComplete="new-password"
            name="loyalty-password-register"
          />
          <p className="text-xs text-gray-500 mt-1">Use apenas números</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={onRegister}
          disabled={isLoading || phone.length < 10 || password.length !== 4}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Cadastrando...
            </>
          ) : (
            "Criar Cartão"
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium"
        >
          ← Voltar para login
        </button>
      </div>
    </div>
  );
}

export function LoyaltyCardView({
  establishmentName,
  cardData,
  stampsRequired,
  isLoading,
  isModalOpen,
  onLogout,
  onApplyCoupon,
  establishmentId,
  customerPhone,
  customerPassword,
  onCouponViewed,
}: {
  establishmentName: string;
  establishmentId: number;
  customerPhone: string;
  customerPassword: string;
  onCouponViewed?: () => void;
  cardData:
    | {
        card: {
          id: number;
          stamps: number;
          customerName: string | null;
          totalStampsEarned: number;
          couponsEarned: number;
        };
        stamps: Array<{
          id: number;
          orderNumber: string;
          orderTotal: string;
          createdAt: Date;
        }>;
        settings: {
          stampsRequired: number;
          couponType: "percentage" | "fixed" | "free_delivery" | null;
          couponValue: string | null;
        };
        activeCoupon: {
          id?: number;
          code: string;
          type: string;
          value: string;
          expiresAt?: string | null;
        } | null;
        activeCoupons?: Array<{
          id: number;
          code: string;
          type: string;
          value: string;
          expiresAt?: string | null;
        }>;
      }
    | null
    | undefined;
  stampsRequired: number;
  isLoading: boolean;
  isModalOpen?: boolean;
  onLogout: () => void;
  onApplyCoupon?: (
    couponCode: string,
    couponType: string,
    couponValue: string,
    loyaltyCardId: number
  ) => void;
}) {
  const [animatingStamp, setAnimatingStamp] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCouponIndex, setCurrentCouponIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "next" | "prev" | null
  >(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isResettingStamps, setIsResettingStamps] = useState(false);

  // Mutation para resetar carimbos quando usuário visualiza o cupom
  // Função para virar o card e mostrar o cupom (sem resetar carimbos - reset é automático no próximo pedido)
  const handleViewCoupon = () => {
    setIsFlipped(true);
  };

  const stamps = cardData?.card?.stamps || 0;
  const required = cardData?.settings?.stampsRequired || stampsRequired;
  const remaining = Math.max(0, required - stamps);

  // Usar o array de cupons se disponível, senão fallback para o cupom único
  const activeCoupons =
    cardData?.activeCoupons && cardData.activeCoupons.length > 0
      ? cardData.activeCoupons
      : cardData?.activeCoupon
        ? [cardData.activeCoupon]
        : [];
  const hasCouponAvailable = activeCoupons.length > 0;
  const currentCoupon = activeCoupons[currentCouponIndex] || null;
  const hasMultipleCoupons = activeCoupons.length > 1;

  // Cores para variação dos cupons - primeiro é amarelo/dourado (padrão), demais são cores distintas
  const couponColors = [
    {
      bg: "from-amber-400 via-amber-500 to-amber-600",
      icon: "text-amber-800",
      label: "text-amber-700/60",
      value: "text-amber-800/70",
      accent: "text-amber-400",
      btnBg: "bg-amber-500 hover:bg-amber-600",
      btnNextBg: "bg-amber-500 hover:bg-amber-600",
    },
    {
      bg: "from-emerald-400 via-emerald-500 to-emerald-600",
      icon: "text-emerald-800",
      label: "text-emerald-700/60",
      value: "text-emerald-800/70",
      accent: "text-emerald-400",
      btnBg: "bg-emerald-500 hover:bg-emerald-600",
      btnNextBg: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      bg: "from-sky-400 via-sky-500 to-sky-600",
      icon: "text-sky-800",
      label: "text-sky-700/60",
      value: "text-sky-800/70",
      accent: "text-sky-400",
      btnBg: "bg-sky-500 hover:bg-sky-600",
      btnNextBg: "bg-sky-500 hover:bg-sky-600",
    },
    {
      bg: "from-violet-400 via-violet-500 to-violet-600",
      icon: "text-violet-800",
      label: "text-violet-700/60",
      value: "text-violet-800/70",
      accent: "text-violet-400",
      btnBg: "bg-violet-500 hover:bg-violet-600",
      btnNextBg: "bg-violet-500 hover:bg-violet-600",
    },
    {
      bg: "from-rose-400 via-rose-500 to-rose-600",
      icon: "text-rose-800",
      label: "text-rose-700/60",
      value: "text-rose-800/70",
      accent: "text-rose-400",
      btnBg: "bg-rose-500 hover:bg-rose-600",
      btnNextBg: "bg-rose-500 hover:bg-rose-600",
    },
    {
      bg: "from-orange-400 via-orange-500 to-orange-600",
      icon: "text-orange-800",
      label: "text-orange-700/60",
      value: "text-orange-800/70",
      accent: "text-orange-400",
      btnBg: "bg-orange-500 hover:bg-orange-600",
      btnNextBg: "bg-orange-500 hover:bg-orange-600",
    },
    {
      bg: "from-teal-400 via-teal-500 to-teal-600",
      icon: "text-teal-800",
      label: "text-teal-700/60",
      value: "text-teal-800/70",
      accent: "text-teal-400",
      btnBg: "bg-teal-500 hover:bg-teal-600",
      btnNextBg: "bg-teal-500 hover:bg-teal-600",
    },
    {
      bg: "from-pink-400 via-pink-500 to-pink-600",
      icon: "text-pink-800",
      label: "text-pink-700/60",
      value: "text-pink-800/70",
      accent: "text-pink-400",
      btnBg: "bg-pink-500 hover:bg-pink-600",
      btnNextBg: "bg-pink-500 hover:bg-pink-600",
    },
  ];
  const currentCouponColor =
    couponColors[currentCouponIndex % couponColors.length];

  const progress = Math.min(100, (stamps / required) * 100);
  const isCardComplete = stamps >= required || hasCouponAvailable;

  // Navegar para o próximo cupom com animação de stack
  const nextCoupon = () => {
    if (isAnimating || activeCoupons.length <= 1) return;
    setIsAnimating(true);
    setAnimationDirection("next");
    setTimeout(() => {
      setCurrentCouponIndex(prev => (prev + 1) % activeCoupons.length);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 220);
  };

  // Navegar para o cupom anterior com animação de stack
  const prevCoupon = () => {
    if (isAnimating || activeCoupons.length <= 1) return;
    setIsAnimating(true);
    setAnimationDirection("prev");
    setTimeout(() => {
      setCurrentCouponIndex(
        prev => (prev - 1 + activeCoupons.length) % activeCoupons.length
      );
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 220);
  };

  // Handlers para swipe/touch navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasMultipleCoupons) {
      nextCoupon();
    }
    if (isRightSwipe && hasMultipleCoupons) {
      prevCoupon();
    }
  };

  // Disparar animação sempre que o modal for aberto e houver carimbos
  useEffect(() => {
    if (isModalOpen && stamps > 0 && !hasAnimated && !isLoading) {
      // Animar o último carimbo ganho
      const lastStampIndex = stamps - 1;

      // Pequeno delay para a animação ser perceptível
      setTimeout(() => {
        setAnimatingStamp(lastStampIndex);
        setShowConfetti(true);

        // Vibração no mobile (se suportado)
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]); // Padrão de vibração: vibra, pausa, vibra
        }

        // Remover animação após 1.5 segundos
        setTimeout(() => {
          setAnimatingStamp(null);
          setShowConfetti(false);
        }, 1500);
      }, 300);

      setHasAnimated(true);
    }

    // Resetar quando o modal for fechado
    if (!isModalOpen) {
      setHasAnimated(false);
      setAnimatingStamp(null);
      setShowConfetti(false);
      setIsFlipped(false);
      setCurrentCouponIndex(0);
    }
  }, [isModalOpen, stamps, hasAnimated, isLoading]);

  // Resetar flip quando o cupom expira ou é usado
  useEffect(() => {
    if (!hasCouponAvailable && isFlipped) {
      setIsFlipped(false);
    }
  }, [hasCouponAvailable, isFlipped]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Card Principal com Flip */}
      <div
        className={cn(
          "relative transition-colors duration-[400ms] ease-in-out",
          isFlipped ? "h-[204px] md:h-[235px]" : "h-[237px] md:h-[273px]"
        )}
        style={{ perspective: "1000px" }}
      >
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-[400ms] ease-in-out",
            "[transform-style:preserve-3d]"
          )}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Face Frontal - Carimbos */}
          <div
            className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-lg [backface-visibility:hidden] flex flex-col"
            style={{ zIndex: 1 }}
          >
            {/* Parte verde do card */}
            <div
              className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-3 md:p-5 text-white flex-1 relative overflow-hidden"
              style={{ height: "215px" }}
            >
              {/* Coração grande no canto inferior esquerdo */}
              <div className="absolute -left-16 -bottom-16 opacity-[0.12] pointer-events-none">
                <svg
                  width="320"
                  height="320"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              {/* Coração pequeno no lado direito */}
              <div className="absolute right-8 top-1/4 opacity-[0.12] pointer-events-none">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              {/* Header com ícone e informações */}
              <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4 relative z-10">
                <div className="p-1.5 md:p-2 bg-white/20 rounded-xl">
                  <Heart className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    {establishmentName}
                  </h3>
                  {cardData?.card?.customerName && (
                    <p className="text-white/80 text-sm">
                      {cardData.card.customerName}{" "}
                      <span className="text-white/60">• Fidelidade ativa</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Container com barra de progresso e carimbos */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 relative z-10">
                <div className="flex items-center justify-between text-sm mb-2 md:mb-3">
                  <span className="text-white/90">Progresso</span>
                  <span className="font-bold">
                    {stamps} / {required} carimbos
                  </span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-3 md:mb-4">
                  <div
                    className="h-full bg-white rounded-full transition-colors duration-700 ease-out"
                    style={{
                      width: `${progress}%`,
                      boxShadow: showConfetti
                        ? "0 0 10px rgba(255,255,255,0.8)"
                        : "none",
                    }}
                  />
                </div>

                {/* Carimbos visuais com animação */}
                <div className="flex justify-center gap-1.5 relative">
                  {/* Confetti/Sparkles quando ganha carimbo */}
                  {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full animate-ping"
                          style={{
                            backgroundColor: [
                              "#fbbf24",
                              "#34d399",
                              "#60a5fa",
                              "#f472b6",
                              "#a78bfa",
                            ][i % 5],
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: "1s",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {Array.from({ length: required }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-500",
                        i < stamps
                          ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/50"
                          : "border-white/40 bg-white/10",
                        animatingStamp === i && "animate-bounce scale-125"
                      )}
                      style={{
                        transitionDelay: `${i * 50}ms`,
                        ...(i < stamps
                          ? { boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)" }
                          : {}),
                      }}
                    >
                      {i < stamps ? (
                        <svg
                          className={cn(
                            "h-3.5 w-3.5 md:h-4 md:w-4 text-white transition-colors duration-300",
                            animatingStamp === i && "scale-110"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mensagem de progresso ou Botão Ver Cupom - Parte inferior do card (cinza) */}
            <div
              className={cn(
                "bg-gray-100 px-3 py-3 md:px-5 md:py-4 text-center transition-colors duration-300",
                showConfetti && "bg-emerald-50"
              )}
            >
              {isCardComplete && hasCouponAvailable && !isFlipped ? (
                <button
                  onClick={handleViewCoupon}
                  disabled={isResettingStamps}
                  className="w-full py-1.5 md:py-2 px-3 md:px-4 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm md:text-base rounded-lg transition-[colors,box-shadow] shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResettingStamps ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                  Ver cupom ganho
                </button>
              ) : (
                <p
                  className={cn(
                    "text-gray-700 text-sm md:text-base transition-colors duration-300",
                    showConfetti && "text-emerald-700 font-semibold scale-105"
                  )}
                >
                  {showConfetti ? (
                    <>
                      <span className="inline-block animate-bounce">🎉</span>{" "}
                      Faltam{" "}
                      <span className="text-emerald-600 font-bold">
                        {remaining}
                      </span>{" "}
                      pedidos para ganhar seu cupom!
                    </>
                  ) : (
                    <>
                      Faltam{" "}
                      <span className="text-emerald-600 font-bold">
                        {remaining}
                      </span>{" "}
                      pedidos para ganhar seu cupom!
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Face Traseira - Cupom (Estilo Voucher) com Stack Visual */}
          <div
            className="absolute inset-0 rounded-2xl overflow-visible [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)", zIndex: 2 }}
          >
            {/* Container do Stack de Cupons */}
            <div className="relative h-full w-full">
              {/* Cupom Principal */}
              <div
                className="absolute inset-0 transition-colors duration-[220ms] ease-in-out cursor-grab active:cursor-grabbing"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  transform: isAnimating ? "scale(0.98)" : "scale(1)",
                  opacity: isAnimating ? 0.8 : 1,
                  zIndex: 2,
                  filter:
                    "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))",
                }}
              >
                {currentCoupon && (
                  <div
                    className="h-full flex relative"
                    style={{
                      maskImage: `
                    radial-gradient(circle 8px at 0% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 92%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 92%, transparent 0, transparent 8px, black 8.5px)
                  `,
                      maskComposite: "intersect",
                      WebkitMaskImage: `
                    radial-gradient(circle 8px at 0% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 92%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 92%, transparent 0, transparent 8px, black 8.5px)
                  `,
                      WebkitMaskComposite: "source-in",
                    }}
                  >
                    {/* Lado Esquerdo - Cor dinâmica baseada no índice do cupom */}
                    <div
                      className={`w-[55%] bg-gradient-to-br ${currentCouponColor.bg} p-3 md:p-4 flex flex-col justify-between relative overflow-hidden transition-colors duration-300`}
                    >
                      {/* Ícone decorativo de talheres */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.15]">
                        <UtensilsCrossed
                          className={`h-32 w-32 md:h-40 md:w-40 ${currentCouponColor.icon} transition-colors duration-300`}
                          strokeWidth={1}
                        />
                      </div>

                      {/* Informações do Voucher */}
                      <div className="relative z-10">
                        {(() => {
                          const words = establishmentName.split(" ");
                          const isLongName = establishmentName.length > 15;
                          const isVeryLongName = establishmentName.length > 25;

                          if (words.length >= 2 && isLongName) {
                            const midPoint = Math.ceil(words.length / 2);
                            const firstLine = words
                              .slice(0, midPoint)
                              .join(" ");
                            const secondLine = words.slice(midPoint).join(" ");
                            const fontSize = isVeryLongName
                              ? "text-sm md:text-base"
                              : "text-base md:text-lg";

                            return (
                              <>
                                <h3
                                  className={`font-black ${fontSize} text-gray-900 uppercase tracking-wide leading-tight`}
                                >
                                  {firstLine}
                                </h3>
                                <h3
                                  className={`font-black ${fontSize} text-gray-900 uppercase tracking-wide leading-tight -mt-0.5`}
                                >
                                  {secondLine}
                                </h3>
                              </>
                            );
                          } else {
                            const fontSize = isLongName
                              ? "text-sm md:text-base"
                              : "text-lg md:text-xl";
                            return (
                              <h3
                                className={`font-black ${fontSize} text-gray-900 uppercase tracking-wide`}
                              >
                                {establishmentName}
                              </h3>
                            );
                          }
                        })()}
                        <p className="text-gray-700 font-semibold text-xs md:text-sm mt-1">
                          VOUCHER{" "}
                          {hasMultipleCoupons ? currentCouponIndex + 1 : ""}
                        </p>
                      </div>

                      {/* Validade */}
                      <div className="relative z-10">
                        <p
                          className={`${currentCouponColor.label} text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-300`}
                          style={{
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                            letterSpacing: "0.15em",
                          }}
                        >
                          VALIDADE
                        </p>
                        <p
                          className={`${currentCouponColor.value} font-black text-xs md:text-sm transition-colors duration-300`}
                          style={{
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {currentCoupon.expiresAt
                            ? new Date(
                                currentCoupon.expiresAt
                              ).toLocaleDateString("pt-BR")
                            : "Sem validade"}
                        </p>
                      </div>

                      {/* Botão voltar */}
                      <button
                        onClick={() => setIsFlipped(false)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-900/20 hover:bg-gray-900/40 rounded-full transition-colors z-20"
                        title="Voltar para carimbos"
                        style={{ marginLeft: "7px" }}
                      >
                        <RotateCcw className="h-4 w-4 text-gray-900" />
                      </button>
                    </div>

                    {/* Lado Direito - Azul Escuro */}
                    <div className="w-[45%] bg-slate-900 p-3 md:p-4 flex flex-col justify-between relative">
                      {/* Botão Próximo Cupom */}
                      {hasMultipleCoupons && (
                        <button
                          onClick={nextCoupon}
                          className={`absolute top-1/2 -translate-y-1/2 -right-3 p-2 rounded-full ${currentCouponColor.btnNextBg} transition-colors shadow-lg z-20`}
                          title="Próximo cupom"
                          style={{
                            marginRight: "26px",
                            width: "22px",
                            height: "22px",
                          }}
                        >
                          <ChevronRight
                            className="text-white"
                            style={{
                              marginTop: "-3px",
                              marginLeft: "-3px",
                              width: "12px",
                              height: "12px",
                            }}
                          />
                        </button>
                      )}

                      {/* Valor do Desconto */}
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <p
                          className={`${currentCouponColor.accent} font-black text-3xl md:text-4xl leading-none`}
                        >
                          {currentCoupon.type === "percentage"
                            ? `${currentCoupon.value}%`
                            : currentCoupon.type === "free_delivery"
                              ? "FRETE"
                              : `R$${Number(currentCoupon.value).toFixed(0)}`}
                        </p>
                        <p
                          className={`${currentCouponColor.accent} font-black text-2xl md:text-3xl`}
                        >
                          {currentCoupon.type === "free_delivery"
                            ? "GRÁTIS"
                            : "OFF"}
                        </p>
                      </div>

                      {/* Botões de Ação */}
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              currentCoupon?.code || ""
                            );
                            const btn =
                              document.getElementById("voucher-copy-btn");
                            if (btn) {
                              btn.textContent = "✓ Copiado!";
                              setTimeout(() => {
                                btn.textContent = "Copiar";
                              }, 2000);
                            }
                          }}
                          id="voucher-copy-btn"
                          className={`w-full py-2 md:py-2.5 px-3 bg-slate-800 hover:bg-slate-700 ${currentCouponColor.accent} rounded-lg font-semibold text-[10px] md:text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700`}
                          style={{ width: "149px", height: "32px" }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </button>
                        <button
                          onClick={() => {
                            if (
                              currentCoupon &&
                              onApplyCoupon &&
                              cardData?.card?.id
                            ) {
                              onApplyCoupon(
                                currentCoupon.code,
                                currentCoupon.type,
                                currentCoupon.value,
                                cardData.card.id
                              );
                            }
                          }}
                          className={`w-full py-2 md:py-2.5 px-3 ${currentCouponColor.btnBg} text-slate-900 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1.5 transition-colors`}
                          style={{ width: "149px", height: "31px" }}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Usar agora
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Indicador de múltiplos cupons */}
            {hasMultipleCoupons && currentCoupon && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {activeCoupons.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCouponIndex(index)}
                    className={`h-2 rounded-full transition-colors ${
                      index === currentCouponIndex
                        ? "bg-emerald-500 w-6"
                        : "bg-gray-300 hover:bg-gray-400 w-2"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Ver regulamento */}
      <button
        onClick={() => setShowRules(true)}
        className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
      >
        Ver regulamento
      </button>

      {/* Histórico */}
      <div className="bg-white rounded-xl p-3 md:p-4">
        <h4 className="font-bold text-gray-900 text-sm md:text-base mb-2 md:mb-3">
          Histórico
        </h4>
        {cardData?.stamps && cardData.stamps.length > 0 ? (
          <div className="space-y-2 md:space-y-3 max-h-32 md:max-h-48 overflow-y-auto">
            {cardData.stamps.slice(0, 10).map(stamp => (
              <div
                key={stamp.id}
                className="flex items-center gap-3 bg-gray-100 rounded-xl p-3"
              >
                {/* Ícone de check verde */}
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                {/* Informações do pedido */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Pedido{" "}
                    {stamp.orderNumber?.startsWith("#")
                      ? stamp.orderNumber
                      : `#${stamp.orderNumber}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(stamp.createdAt)
                      .toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .replace(".", "")}
                  </p>
                </div>
                {/* Carimbo +1 */}
                <span className="text-lg font-bold text-emerald-600">+1</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum carimbo ainda
          </p>
        )}
      </div>

      {/* Botão Sair - Oculto conforme solicitação */}
      {/* <button
        onClick={onLogout}
        className="w-full py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm md:text-base rounded-xl transition-colors"
      >
        Sair do cartão
      </button> */}

      {/* Modal Regulamento */}
      {showRules && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setShowRules(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-300" />

          {/* Bottom Sheet */}
          <div
            className="relative w-full max-w-lg bg-white rounded-t-[30px] md:rounded-[30px] shadow-2xl animate-in slide-in-from-bottom duration-400 ease-out max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Regulamento
                  </h3>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-600" />
                  Como funciona
                </h4>
                <p className="text-sm text-gray-600">
                  A cada pedido concluído, você ganha um carimbo no seu cartão
                  fidelidade. Ao completar{" "}
                  <span className="font-semibold text-emerald-600">
                    {required} carimbos
                  </span>
                  , você recebe um cupom de desconto exclusivo!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />O que gera
                  carimbo
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Pedidos com status "Concluído" ou "Entregue"
                  </li>
                  {cardData?.settings?.couponValue &&
                    Number(cardData.settings.couponValue) > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        Pedidos acima do valor mínimo (se configurado)
                      </li>
                    )}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />O que não conta
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Pedidos cancelados
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Pedidos recusados pelo estabelecimento
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-600" />
                  Sobre o cupom
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>O cupom é
                    gerado automaticamente ao completar o cartão
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Válido por 30 dias após a geração
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Uso único - após utilizar, um novo cartão é iniciado
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CASHBACK COMPONENTS ============

