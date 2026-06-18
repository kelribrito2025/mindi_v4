import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, ChevronUp, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { createSafeRandomId } from "@/lib/safeRandomId";

interface Story {
  id: number;
  imageUrl: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  type?: "simple" | "product" | "promo";
  productId?: number | null;
  promoTitle?: string | null;
  promoText?: string | null;
  promoPrice?: string | null;
  promoExpiresAt?: string | Date | null;
  actionLabel?: string | null;
  priceBadgeStyle?: "circle" | "ribbon" | "top-center" | null;
  establishmentId?: number;
}

interface StoryViewerProps {
  stories: Story[];
  restaurantName: string;
  restaurantLogo?: string | null;
  initialIndex?: number;
  onClose: () => void;
  onAllViewed?: () => void;
  onStoryViewed?: (storyId: number) => void;
  onProductAction?: (productId: number) => void;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

function promoTimeRemaining(expiresAt: Date | string): string | null {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  if (diffMs <= 0) return "Expirada";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Termina em ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Termina em ${diffH}h`;
  return `Válida até ${exp.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

const STORY_DURATION = 5000;
const LONG_PRESS_THRESHOLD = 400; // ms

function getOrCreateSessionId(): string {
  const key = "mindi_story_session";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = createSafeRandomId("story");
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export default function StoryViewer({
  stories,
  restaurantName,
  restaurantLogo,
  initialIndex = 0,
  onClose,
  onAllViewed,
  onStoryViewed,
  onProductAction,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const viewedStoriesRef = useRef<Set<number>>(new Set());
  const allViewedCalledRef = useRef(false);

  // Pointer tracking — usa apenas Pointer Events para evitar dupla chamada
  const pointerStartTimeRef = useRef<number>(0);
  const pointerStartXRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null);

  // Flag para indicar que houve navegação manual (tap) e o cleanup do timer não deve acumular elapsed
  const manualNavRef = useRef(false);

  // Debounce para prevenir dupla navegação
  const lastNavTimeRef = useRef<number>(0);
  const NAV_DEBOUNCE = 300; // ms mínimo entre navegações

  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const recordViewMutation = trpc.publicStories.recordView.useMutation();
  const recordEventMutation = trpc.publicStories.recordEvent.useMutation();

  // Registar view quando o story muda
  useEffect(() => {
    const story = stories[currentIndex];
    if (story && !viewedStoriesRef.current.has(story.id)) {
      viewedStoriesRef.current.add(story.id);
      recordViewMutation.mutate({ storyId: story.id, sessionId });
      if (onStoryViewed) {
        onStoryViewed(story.id);
      }
      if (viewedStoriesRef.current.size === stories.length && onAllViewed && !allViewedCalledRef.current) {
        allViewedCalledRef.current = true;
        onAllViewed();
      }
    }
  }, [currentIndex, stories, sessionId, onAllViewed, onStoryViewed]);

  const currentStory = stories[currentIndex];

  // goNext com updater function para evitar stale closure
  const goNext = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_DEBOUNCE) return;
    lastNavTimeRef.current = now;

    // Sinalizar navegação manual ANTES de mudar o state
    // para que o cleanup do timer anterior não acumule elapsed
    manualNavRef.current = true;
    elapsedRef.current = 0;

    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) {
        setProgress(0);
        setImageLoaded(false);
        return prev + 1;
      } else {
        // Último story — marcar como visto e fechar
        const story = stories[prev];
        if (story && !viewedStoriesRef.current.has(story.id)) {
          viewedStoriesRef.current.add(story.id);
          recordViewMutation.mutate({ storyId: story.id, sessionId });
          if (onStoryViewed) {
            onStoryViewed(story.id);
          }
        }
        if (viewedStoriesRef.current.size === stories.length && onAllViewed && !allViewedCalledRef.current) {
          allViewedCalledRef.current = true;
          onAllViewed();
        }
        // Agendar close para o próximo tick para evitar conflitos de state
        setTimeout(() => onClose(), 0);
        return prev;
      }
    });
  }, [stories, onClose, onAllViewed, onStoryViewed, sessionId]);

  const goPrev = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_DEBOUNCE) return;
    lastNavTimeRef.current = now;

    manualNavRef.current = true;
    elapsedRef.current = 0;

    setCurrentIndex((prev) => {
      if (prev > 0) {
        setProgress(0);
        setImageLoaded(false);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Timer de progresso
  useEffect(() => {
    if (!imageLoaded || paused) return;

    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        goNext();
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Só acumular elapsed se NÃO houve navegação manual
      // (navegação manual já resetou elapsedRef para 0)
      if (!manualNavRef.current) {
        elapsedRef.current += Date.now() - startTimeRef.current;
      }
      manualNavRef.current = false;
    };
  }, [imageLoaded, paused, currentIndex, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Bloquear scroll do body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // POINTER EVENTS — Abordagem unificada
  // Usa apenas onPointerDown/onPointerUp para evitar
  // dupla chamada (touch + mouse sintetizado)
  // ==========================================

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignorar se já temos um pointer ativo (multi-touch)
    if (activePointerIdRef.current !== null) return;
    
    activePointerIdRef.current = e.pointerId;
    pointerStartTimeRef.current = Date.now();
    pointerStartXRef.current = e.clientX;
    setPaused(true);
    
    // Capturar o pointer para receber pointerup mesmo fora do elemento
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Ignorar se não é o pointer que iniciou
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    
    const pressDuration = Date.now() - pointerStartTimeRef.current;
    setPaused(false);

    // Long press — apenas retoma, não navega
    if (pressDuration >= LONG_PRESS_THRESHOLD) {
      return;
    }

    // Tap rápido — navegar baseado na posição
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (tapX < halfWidth) {
      goPrev();
    } else {
      goNext();
    }
  }, [goNext, goPrev]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId) {
      activePointerIdRef.current = null;
      setPaused(false);
    }
  }, []);

  // Determinar se o story tem ação
  const hasAction = currentStory && (currentStory.type === "product" || currentStory.type === "promo") && currentStory.productId;
  const actionButtonLabel = currentStory?.actionLabel || (currentStory?.type === "product" ? "Ver produto" : "Pedir agora");

  // Promo countdown
  const promoCountdown = currentStory?.type === "promo" && currentStory.promoExpiresAt
    ? promoTimeRemaining(currentStory.promoExpiresAt)
    : null;

  const handleActionClick = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    activePointerIdRef.current = null;
    setPaused(false);
    if (currentStory?.productId && onProductAction) {
      // Registar evento de clique no story
      recordEventMutation.mutate({
        storyId: currentStory.id,
        establishmentId: currentStory.establishmentId || 0,
        eventType: "click",
        productId: currentStory.productId,
        sessionId,
      });
      onProductAction(currentStory.productId);
    }
  }, [currentStory, onProductAction, sessionId]);

  const handleCloseClick = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    activePointerIdRef.current = null;
    setPaused(false);
    onClose();
  }, [onClose]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Container principal — usa APENAS Pointer Events */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[480px] mx-auto flex flex-col select-none"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Imagem de fundo */}
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
          {!imageLoaded && (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <img
            src={currentStory.imageUrl}
            alt="Story"
            className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
        </div>

        {/* Overlay superior — pointer-events-none */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-transparent pt-2 px-3 pb-12 pointer-events-none">
          {/* Barras de progresso */}
          <div className="flex gap-1 mb-3">
            {stories.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header: logo + nome + tempo + fechar */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {restaurantLogo ? (
                <img
                  src={restaurantLogo}
                  alt={restaurantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {restaurantName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white text-sm font-semibold truncate">
                {restaurantName}
              </span>
              <span className="text-white/60 text-xs flex-shrink-0">
                {timeAgo(currentStory.createdAt)}
              </span>
            </div>

            {/* Botão fechar — pointer-events-auto */}
            <button
              onClick={handleCloseClick}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 pointer-events-auto"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Badge de preço flutuante — estilo "circle" (entre imagem e overlay) */}
        {currentStory.type === "promo" && currentStory.promoPrice && (currentStory.priceBadgeStyle === "circle" || !currentStory.priceBadgeStyle) && (
          <div className="absolute z-20 pointer-events-none" style={{ bottom: "calc(35% + 8px)", left: "50%", transform: "translateX(-50%)" }}>
            <div className="w-20 h-20 rounded-full bg-red-500 flex flex-col items-center justify-center shadow-2xl border-[3px] border-white/90 animate-bounce" style={{ animationDuration: "2s" }}>
              <span className="text-white text-[10px] font-medium -mb-0.5">por apenas</span>
              <span className="text-white text-base font-extrabold leading-tight">{currentStory.promoPrice}</span>
            </div>
          </div>
        )}

        {/* Badge de preço — estilo "ribbon" (faixa diagonal no canto superior esquerdo) */}
        {currentStory.type === "promo" && currentStory.promoPrice && currentStory.priceBadgeStyle === "ribbon" && (
          <div className="absolute top-0 left-0 z-20 w-36 h-36 overflow-hidden pointer-events-none">
            <div className="absolute top-[26px] -left-[30px] w-[200px] bg-red-500 text-center py-1.5 shadow-lg" style={{ transform: "rotate(-40deg)" }}>
              <span className="text-white text-sm font-extrabold tracking-wide drop-shadow-md">{currentStory.promoPrice}</span>
            </div>
          </div>
        )}

        {/* Badge de preço — estilo "top-center" (fixo no topo central abaixo das barras de progresso) */}
        {currentStory.type === "promo" && currentStory.promoPrice && currentStory.priceBadgeStyle === "top-center" && (
          <div className="absolute z-20 pointer-events-none" style={{ top: "70px", left: "50%", transform: "translateX(-50%)" }}>
            <div className="bg-red-500 px-5 py-2 rounded-full shadow-xl border-2 border-white/80">
              <span className="text-white text-base font-extrabold drop-shadow-md">{currentStory.promoPrice}</span>
            </div>
          </div>
        )}

        {/* Overlay inferior — Promoção e/ou Botão de ação */}
        {(currentStory.type === "promo" || hasAction) && (
          <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
            {/* Fundo sólido escuro para garantir legibilidade */}
            <div className="bg-black/85 backdrop-blur-md px-4 pt-5 pb-6 rounded-t-2xl">
              {/* Dados da promoção */}
              {currentStory.type === "promo" && (
                <div className="mb-4 text-center">
                  {currentStory.promoTitle && (
                    <h3 className="text-white text-lg font-bold mb-1 line-clamp-2">
                      {currentStory.promoTitle.slice(0, 60)}
                    </h3>
                  )}
                  {currentStory.promoText && (
                    <p className="text-white/80 text-sm mb-2 line-clamp-2">
                      {currentStory.promoText.slice(0, 100)}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    {/* Preço inline apenas se badge style é circle (já mostrado no badge flutuante) — para ribbon e top-center também já está visível */}
                    {promoCountdown && (
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{promoCountdown}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de ação — pointer-events-auto */}
              {hasAction && (
                <button
                  onClick={handleActionClick}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-500/40 active:scale-[0.98] transition-transform pointer-events-auto"
                >
                  <ChevronUp className="h-4 w-4" />
                  {actionButtonLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
