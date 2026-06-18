import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  Circle,
  Rocket,
  PartyPopper,
  ArrowRight,
  FolderPlus,
  ShoppingBag,
  Clock,
  MessageCircle,
  ClipboardCheck,
  Camera,
  Volume2,
  Sparkles,
  X,
  Check,
  ChevronRight,
  Lock,
  Trophy,
  Star,
  ExternalLink,
  Share2,
  Copy,
  Link2,
  QrCode,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePreference } from "@/hooks/usePreference";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNewOrders } from "@/contexts/NewOrdersContext";

const stepConfig: Record<string, {
  icon: React.ElementType;
  subtitle: string;
  description: string;
  whyImportant: string[];
  buttonLabel: string;
}> = {
  category: {
    icon: FolderPlus,
    subtitle: "Organize seus produtos",
    description: "Crie categorias para organizar seu cardápio. Exemplo: Entradas, Pratos Principais, Bebidas, Sobremesas.",
    whyImportant: [
      "Facilita a navegação dos clientes pelo cardápio",
      "Organiza seus produtos de forma profissional",
    ],
    buttonLabel: "Criar Categoria",
  },
  products: {
    icon: ShoppingBag,
    subtitle: "Monte seu cardápio",
    description: "Adicione os produtos que seu restaurante oferece, com fotos, preços e descrições.",
    whyImportant: [
      "Seus clientes poderão ver e pedir seus produtos",
      "Fotos atraentes aumentam as vendas",
      "Descrições claras reduzem dúvidas",
    ],
    buttonLabel: "Adicionar Produto",
  },
  business_hours: {
    icon: Clock,
    subtitle: "Defina horários",
    description: "Configure os dias e horários de funcionamento do seu restaurante para receber pedidos.",
    whyImportant: [
      "Clientes sabem quando podem fazer pedidos",
      "Evita pedidos fora do horário de atendimento",
      "Automatiza a abertura e fechamento do cardápio",
    ],
    buttonLabel: "Configurar Horários",
  },
  whatsapp: {
    icon: MessageCircle,
    subtitle: "Receba pedidos",
    description: "Conecte seu WhatsApp para receber notificações de novos pedidos e se comunicar com clientes.",
    whyImportant: [
      "Permite que seus clientes façam pedidos diretamente",
      "Automatiza o processo de atendimento",
      "Reduz erros em pedidos",
    ],
    buttonLabel: "Conectar WhatsApp",
  },
  sound_notification: {
    icon: Volume2,
    subtitle: "Receba alertas de pedidos",
    description: "Ative o som de notificação para ser alertado sempre que um novo pedido chegar. Assim você nunca perde um pedido!",
    whyImportant: [
      "Você é avisado imediatamente quando chega um pedido",
      "Evita que pedidos passem despercebidos",
    ],
    buttonLabel: "Ativar Som",
  },
  test_order: {
    icon: ClipboardCheck,
    subtitle: "Teste pelo menu público",
    description: "Acesse seu menu público e faça um pedido de teste como se fosse um cliente. Assim você verá exatamente a experiência do seu cliente.",
    whyImportant: [
      "Veja seu cardápio como o cliente vê",
      "Identifica problemas antes dos clientes reais",
    ],
    buttonLabel: "Abrir Meu Menu",
  },
  photos: {
    icon: Camera,
    subtitle: "Personalize visual",
    description: "Adicione o logo e a foto de capa do seu restaurante para criar uma identidade visual profissional.",
    whyImportant: [
      "Transmite profissionalismo e confiança",
      "Destaca seu restaurante da concorrência",
    ],
    buttonLabel: "Adicionar Fotos",
  },
  pix_key: {
    icon: QrCode,
    subtitle: "Receba pagamentos via Pix",
    description: "Cadastre sua chave Pix para que os clientes possam pagar diretamente pelo cardápio digital.",
    whyImportant: [
      "Clientes copiam a chave direto do pedido",
      "Receba pagamentos de forma rápida e segura",
    ],
    buttonLabel: "Cadastrar Chave Pix",
  },
};

interface WelcomeChecklistProps {
  establishmentId: number;
  establishmentName?: string;
  externalOpen?: boolean;
  onExternalClose?: () => void;
  onRequestOpen?: () => void;
  hideMinimizedBar?: boolean;
  onCelebrationChange?: (celebrating: boolean) => void;
  onStateChange?: (state: { completedCount: number; totalSteps: number; allCompleted: boolean; isDismissed: boolean }) => void;
}

export function WelcomeChecklist({ establishmentId, establishmentName, externalOpen, onExternalClose, onRequestOpen, hideMinimizedBar, onCelebrationChange, onStateChange }: WelcomeChecklistProps) {
  const [, navigate] = useLocation();
  const { unlockAudio, isAudioUnlocked } = useNewOrders();
  const minimizedKey = `welcome_checklist_minimized_${establishmentId}`;
  const soundActivatedKey = `welcome_checklist_sound_activated_${establishmentId}`;

  // Preferência de dismiss persistida no banco
  const [dismissedPref, setDismissedPref] = usePreference('welcome_checklist_dismissed', establishmentId);
  const [dismissed, setDismissed] = useState(() => dismissedPref === 'true');

  // Sincronizar quando o valor do banco chegar
  useEffect(() => {
    if (dismissedPref === 'true' && !dismissed) {
      setDismissed(true);
    }
  }, [dismissedPref]);

  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const showCelebrationRef = useRef(false);
  const prevCompletedRef = useRef<number | null>(null);
  const hasHandledRef = useRef<number | null>(null);
  const [justUnlockedStepId, setJustUnlockedStepId] = useState<string | null>(null);

  const { data: checklist, isLoading } = trpc.dashboard.onboardingChecklist.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && !dismissed, staleTime: 0, refetchOnWindowFocus: true, placeholderData: (prev) => prev }
  );

  // Override local: sound_notification é controlado pelo localStorage (client-side)
  const soundActivated = typeof window !== 'undefined' && localStorage.getItem(soundActivatedKey) === 'true';

  // Aplicar override nos dados do checklist (ANTES dos useEffects que dependem dele)
  const adjustedChecklist = useMemo(() => {
    if (!checklist) return null;
    const adjustedSteps = checklist.steps.map(step => {
      if (step.id === 'sound_notification') {
        return { ...step, completed: soundActivated || isAudioUnlocked };
      }
      return step;
    });
    const completedCount = adjustedSteps.filter(s => s.completed).length;
    return {
      ...checklist,
      steps: adjustedSteps,
      completedCount,
      allCompleted: completedCount === adjustedSteps.length,
    };
  }, [checklist, soundActivated, isAudioUnlocked]);

  // Dismiss permanente quando todas as etapas "core" (permanentes) estão completas
  // Isso garante que o checklist não reapareça só porque som está desativado ou WhatsApp desconectou
  useEffect(() => {
    if (checklist?.coreAllCompleted && !dismissed) {
      setDismissedPref('true');
      setDismissed(true);
    }
  }, [checklist?.coreAllCompleted]);

  // Auto-expandir o primeiro passo incompleto
  useEffect(() => {
    if (adjustedChecklist && !expandedStepId) {
      const firstIncomplete = adjustedChecklist.steps.find(s => !s.completed);
      if (firstIncomplete) {
        setExpandedStepId(firstIncomplete.id);
      }
    }
  }, [adjustedChecklist, expandedStepId]);

  // Inicializar prevCompletedRef assim que o adjustedChecklist carrega pela primeira vez
  useEffect(() => {
    if (adjustedChecklist && prevCompletedRef.current === null) {
      prevCompletedRef.current = adjustedChecklist.completedCount;
    }
  }, [adjustedChecklist]);

  // Detectar quando um passo é concluído (usando adjustedChecklist que inclui overrides client-side)
  // Usa hasHandledRef para garantir que cada mudança só é processada UMA vez
  useEffect(() => {
    if (!adjustedChecklist) return;
    if (prevCompletedRef.current === null) return;
    if (hasHandledRef.current === adjustedChecklist.completedCount) return;
    
    if (adjustedChecklist.completedCount > prevCompletedRef.current) {
      hasHandledRef.current = adjustedChecklist.completedCount;
      prevCompletedRef.current = adjustedChecklist.completedCount;
      
      if (!adjustedChecklist.allCompleted) {
        const firstIncomplete = adjustedChecklist.steps.find(s => !s.completed);
        if (firstIncomplete) {
          setJustUnlockedStepId(firstIncomplete.id);
          setExpandedStepId(firstIncomplete.id);
          setTimeout(() => setJustUnlockedStepId(null), 2500);
        }
        onRequestOpen?.();
      } else {
        setShowConfetti(true);
        setShowCelebration(true);
        showCelebrationRef.current = true;
        onCelebrationChange?.(true);
        onRequestOpen?.();
      }
    }
  }, [adjustedChecklist?.completedCount, adjustedChecklist?.allCompleted]);

  // Se já estava tudo completo no carregamento inicial, dismiss direto
  useEffect(() => {
    if (adjustedChecklist && adjustedChecklist.allCompleted && prevCompletedRef.current !== null && prevCompletedRef.current === adjustedChecklist.completedCount && !showCelebrationRef.current) {
      setDismissedPref('true');
      setDismissed(true);
    }
  }, [adjustedChecklist?.allCompleted]);

  // Reportar estado ao componente pai (FAB) para que ele saiba o progresso sem query própria
  useEffect(() => {
    if (adjustedChecklist) {
      onStateChange?.({
        completedCount: adjustedChecklist.completedCount,
        totalSteps: adjustedChecklist.totalSteps,
        allCompleted: adjustedChecklist.allCompleted,
        isDismissed: dismissed,
      });
    } else if (dismissed) {
      onStateChange?.({
        completedCount: 0,
        totalSteps: 0,
        allCompleted: true,
        isDismissed: true,
      });
    }
  }, [adjustedChecklist?.completedCount, adjustedChecklist?.allCompleted, dismissed]);

  // sheetOpen derivado de externalOpen (controlado pelo FAB)
  const sheetOpen = !!externalOpen;

  if (dismissed || isLoading || !adjustedChecklist) {
    return null;
  }

  if (adjustedChecklist.allCompleted && !showCelebration) {
    return null;
  }

  const progress = (adjustedChecklist.completedCount / adjustedChecklist.totalSteps) * 100;

  const handleMinimize = () => {
    onExternalClose?.();
  };

  const handleReopen = () => {
    onRequestOpen?.();
  };

  const handleActivateSound = async () => {
    const result = await unlockAudio();
    if (result) {
      localStorage.setItem(soundActivatedKey, 'true');
      localStorage.setItem('notificationSoundEnabled', 'true');
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => {
        const testAudio = new Audio('/notification.mp3');
        testAudio.volume = 0.5;
        testAudio.play().catch(err => {
          console.log('[Som] Erro ao tocar som de teste:', err);
        });
      }, 100);
      toast.success('Notificação sonora ativada!', { icon: <Volume2 className="h-4 w-4" /> });
    } else {
      toast.error('Não foi possível ativar o som. Tente novamente.');
    }
  };

  const handleStartStep = (href: string) => {
    // Se o href contém query params (como ?action=new-product), usar window.location
    // para garantir que o useEffect do componente de destino dispare corretamente
    if (href.includes('?')) {
      handleMinimize();
      // Pequeno delay para a sidebar fechar antes de navegar
      setTimeout(() => {
        window.location.href = href;
      }, 100);
    } else {
      navigate(href);
      handleMinimize();
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedStepId(prev => prev === stepId ? null : stepId);
  };

  // ==================== STEP CARD RENDERER (shared between mobile and desktop) ====================
  const renderStepCardDesktop = (step: typeof adjustedChecklist.steps[0], index: number) => {
    const cfg = stepConfig[step.id];
    const StepIcon = cfg?.icon || Circle;
    const isCompleted = step.completed;
    const firstIncompleteIndex = adjustedChecklist.steps.findIndex(s => !s.completed);
    const isCurrentStep = index === firstIncompleteIndex;
    const isLocked = !isCompleted && !isCurrentStep;
    const isExpanded = expandedStepId === step.id && isCurrentStep;
    const isJustUnlocked = justUnlockedStepId === step.id;

    const stepCard = (
      <div key={step.id} className={cn(
        "relative transition-colors duration-500",
        isLocked && "opacity-50",
        isJustUnlocked && "animate-[step-unlock_0.8s_cubic-bezier(0.34,1.56,0.64,1)]"
      )}>
        {isJustUnlocked && (
          <>
            <div className="absolute -inset-1.5 bg-gradient-to-r from-red-500/30 via-rose-400/40 to-red-500/30 rounded-2xl blur-lg" />
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-rose-500/25 to-red-500/20 rounded-2xl blur-md" style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
          </>
        )}
        <div
          className={cn(
            "relative w-full rounded-xl transition-colors duration-300 text-left",
            isExpanded && !isCompleted
              ? "bg-card shadow-lg shadow-red-500/5 ring-1 ring-red-100 dark:ring-red-500/30"
              : isCompleted
                ? "bg-red-50/60 dark:bg-red-950/20 border border-red-100/60 dark:border-red-500/20"
                : isLocked
                  ? "bg-muted/20 dark:bg-muted/10 border border-border/20"
                  : isJustUnlocked
                    ? "bg-card shadow-lg ring-2 ring-red-300/60 dark:ring-red-500/40"
                    : "bg-muted/40 dark:bg-muted/20 border border-border/40 hover:border-red-200/60 dark:hover:border-red-500/30"
          )}
        >
          <button
            onClick={() => isCurrentStep && toggleStep(step.id)}
            disabled={isLocked}
            className={cn(
              "w-full flex items-center gap-3 p-4 text-left rounded-xl transition-colors",
              isCurrentStep && !isExpanded && "cursor-pointer",
              isExpanded && !isCompleted && "pb-0",
              (isCompleted || isLocked) && "cursor-default"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
              isCompleted
                ? "bg-gradient-to-br from-red-500 to-rose-500 shadow-sm shadow-red-500/20"
                : isExpanded
                  ? "bg-red-100 dark:bg-red-500/30"
                  : "bg-muted/60 dark:bg-muted/40"
            )}>
              {isCompleted ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <StepIcon className={cn(
                  "h-5 w-5",
                  isExpanded ? "text-red-500 dark:text-red-400" : "text-muted-foreground"
                )} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className={cn(
                "block text-sm font-semibold truncate",
                isCompleted
                  ? "text-red-500/70 dark:text-red-400/70 line-through decoration-red-300/50 dark:decoration-red-500/50"
                  : isExpanded
                    ? "text-foreground"
                    : isLocked
                      ? "text-muted-foreground/60"
                      : "text-foreground/80"
              )}>
                {step.label}
              </span>
              <span className={cn(
                "block text-xs truncate mt-0.5",
                isCompleted
                  ? "text-red-400/50 dark:text-red-500/40"
                  : isLocked
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground"
              )}>
                {cfg?.subtitle}
              </span>
            </div>

            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-red-500/60 dark:text-red-400/60 flex-shrink-0" />
            ) : isLocked ? (
              <Lock className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
            ) : (
              <ChevronRight className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                isExpanded
                  ? "text-red-500 rotate-90"
                  : "text-muted-foreground/50"
              )} />
            )}
          </button>

          {isExpanded && !isCompleted && (
            <div className="px-4 pb-4 pt-3">
              <div className="border-t border-border/30 dark:border-border/20 mb-4" />
              <div className="space-y-2.5 mb-5">
                {cfg?.whyImportant.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground leading-snug">{item}</span>
                  </div>
                ))}
              </div>

              {step.id === 'sound_notification' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleActivateSound(); }}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-red-500/20"
                >
                  <Volume2 className="h-4 w-4" />
                  {cfg?.buttonLabel || "Ativar Som"}
                </button>
              ) : step.id === 'test_order' && step.href.startsWith('/menu/') ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-red-500/20"
                >
                  {cfg?.buttonLabel || "Começar este passo"}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartStep(step.href); }}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-red-500/20"
                >
                  {cfg?.buttonLabel || "Começar este passo"}
                </button>
              )}

              {/* Botão Explorar primeiro - só aparece no primeiro step (category) */}
              {step.id === 'category' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                  className="w-full h-11 mt-2 border-2 border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Explorar primeiro
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );

    if (isLocked) {
      return (
        <div
          key={step.id}
          className="cursor-not-allowed [&_button]:pointer-events-none"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast.info("Complete o passo anterior primeiro", {
              icon: <Lock className="h-4 w-4" />,
              duration: 2000,
            });
          }}
        >
          {stepCard}
        </div>
      );
    }

    return stepCard;
  };

  // ==================== CELEBRATION CONTENT ====================
  const menuSlug = adjustedChecklist?.menuSlug || checklist?.menuSlug;
  // Use the canonical public V3 menu route for customer-facing sharing links.
  const menuUrl = menuSlug ? `https://app.mindi.com.br/menu/${menuSlug}` : null;

  const handleDismissCelebration = () => {
    setShowCelebration(false);
    setShowConfetti(false);
    setDismissedPref('true');
    setDismissed(true);
    onCelebrationChange?.(false);
    navigate("/");
  };

  const handleCopyLink = async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      setLinkCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const handleShareWhatsApp = () => {
    if (!menuUrl) return;
    const text = `Confira nosso cardápio online: ${menuUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (showCelebration) {
    return (
      <>
        <Confetti
          active={showConfetti}
          duration={5000}
          particleCount={200}
          onComplete={() => setShowConfetti(false)}
        />
        {/* Dialog centralizado — mobile e desktop */}
        <Dialog open={true} onOpenChange={(open) => { if (!open) handleDismissCelebration(); }}>
          <DialogContent
            showCloseButton={false}
            onInteractOutside={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            className="sm:max-w-[420px] p-0 gap-0 rounded-2xl border-border/60 overflow-hidden bg-background"
          >
            <DialogTitle className="sr-only">Configuração Concluída</DialogTitle>
            <DialogDescription className="sr-only">Todas as etapas foram concluídas</DialogDescription>

            {/* Conteúdo centralizado */}
            <div className="flex flex-col items-center text-center px-8 pt-10 pb-6">
              {/* Ícone grande */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Parabéns!</h2>
              <p className="text-sm text-muted-foreground mb-1">Configuração concluída com sucesso</p>

              {/* Setup completo */}
              <div className="flex items-center gap-2 mt-4 mb-5">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-foreground">Setup completo</span>
                <span className="text-xs text-muted-foreground">— {adjustedChecklist.totalSteps} de {adjustedChecklist.totalSteps} etapas concluídas</span>
              </div>

              {/* Lista de benefícios */}
              <div className="w-full text-left mb-6 space-y-2.5 px-2">
                <p className="text-sm text-muted-foreground">Agora você já pode:</p>
                <div className="flex items-start gap-2.5">
                  <Share2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Compartilhar seu cardápio</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShoppingBag className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Receber pedidos online</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Gerenciar pedidos no painel</span>
                </div>
              </div>

              {/* Botão Ir para o Dashboard */}
              <button
                onClick={handleDismissCelebration}
                className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-md shadow-red-500/20"
              >
                <Rocket className="h-4 w-4" />
                Ir para o Dashboard
              </button>

              {/* Botão Compartilhar Cardápio */}
              {menuUrl && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full h-11 mt-3 border border-border/60 bg-background hover:bg-muted/50 text-foreground font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar Cardápio
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de compartilhamento (overlay sobre o celebration) */}
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent
            className="sm:max-w-[400px] rounded-2xl border-border/60 bg-background"
          >
            <DialogTitle className="text-lg font-bold text-foreground">Compartilhar Cardápio</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Envie o link do seu cardápio para seus clientes
            </DialogDescription>

            {/* Link do cardápio */}
            <div className="mt-2 flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/40">
              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{menuUrl}</span>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col gap-2.5 mt-4">
              <button
                onClick={handleCopyLink}
                className="w-full h-11 border border-border/60 bg-background hover:bg-muted/50 text-foreground font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {linkCopied ? (
                  <><Check className="h-4 w-4 text-green-600" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copiar link</>
                )}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="w-full h-11 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Compartilhar no WhatsApp
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {/* ==================== MOBILE: Card compacto ==================== */}
      {/* Esconder no mobile quando renderizado pelo OnboardingFAB (hideMinimizedBar=true) */}
      {!hideMinimizedBar && (
      <div className="md:hidden mb-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 relative">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Bem-vindo ao Mindi!</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seu restaurante <span className="font-medium text-foreground">{establishmentName}</span> foi criado com sucesso.
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                Primeiros passos
              </span>
              <span className="text-xs font-semibold text-foreground">
                {adjustedChecklist.completedCount}/{adjustedChecklist.totalSteps}
              </span>
            </div>
            <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-colors duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="grid grid-cols-1 gap-1.5">
            {adjustedChecklist.steps.map((step) => {
              const cfg = stepConfig[step.id];
              const StepIcon = cfg?.icon || Circle;
              const isMenuLink = step.id === 'test_order' && step.href.startsWith('/menu/');
              const stepContent = (
                <>
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors" />
                    )}
                  </div>
                  <div className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                    step.completed ? "bg-primary/10 dark:bg-primary/20" : "bg-muted/60 group-hover:bg-primary/10"
                  )}>
                    <StepIcon className={cn("h-3.5 w-3.5", step.completed ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                  </div>
                  <span className={cn("flex-1 text-sm font-medium", step.completed ? "text-primary line-through decoration-primary/50" : "text-foreground")}>
                    {step.label}
                  </span>
                  {!step.completed && (
                    isMenuLink ? <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-transform" /> : <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                  )}
                </>
              );
              if (step.id === 'sound_notification' && !step.completed) {
                return (
                  <button
                    key={step.id}
                    onClick={() => handleActivateSound()}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors duration-200",
                      "bg-muted/30 hover:bg-muted/60 hover:shadow-sm cursor-pointer"
                    )}
                  >
                    {stepContent}
                  </button>
                );
              }
              if (isMenuLink && !step.completed) {
                return (
                  <a
                    key={step.id}
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors duration-200",
                      "bg-muted/30 hover:bg-muted/60 hover:shadow-sm cursor-pointer"
                    )}
                  >
                    {stepContent}
                  </a>
                );
              }
              return (
                <button
                  key={step.id}
                  onClick={() => navigate(step.href)}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors duration-200",
                    step.completed
                      ? "bg-primary/5 dark:bg-primary/10"
                      : "bg-muted/30 hover:bg-muted/60 hover:shadow-sm cursor-pointer"
                  )}
                >
                  {stepContent}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* ==================== DESKTOP: Sheet sidebar ou barra minimizada ==================== */}
      <div className="hidden md:block">
        {sheetOpen ? (
          <Sheet open={true} onOpenChange={(open) => {
            if (!open) handleMinimize();
          }}>
            <SheetContent
              side="right"
              hideCloseButton
              onInteractOutside={(e) => e.preventDefault()}
              onPointerDownOutside={(e) => e.preventDefault()}
              className="!w-[440px] !max-w-[440px] p-0 gap-0 border-l border-border/40 bg-background overflow-hidden"
            >
              <SheetTitle className="sr-only">Configuração Inicial</SheetTitle>
              <SheetDescription className="sr-only">Passos para configurar seu restaurante</SheetDescription>

              {/* Header estilo Bem-vindo ao Mindi */}
              <div className="px-6 pt-6 pb-4 border-b border-border/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <PartyPopper className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">Bem-vindo ao Mindi!</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Seu restaurante <span className="font-medium text-foreground">{establishmentName}</span> foi criado com sucesso.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Fechar boas-vindas"
                    onClick={handleMinimize}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center -mt-1 -mr-1 rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 hover:text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800/60 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Rocket className="h-3.5 w-3.5 text-primary" />
                      Primeiros passos
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {adjustedChecklist.completedCount}/{adjustedChecklist.totalSteps}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-colors duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Steps list - scrollable area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {adjustedChecklist.steps.map((step, index) => renderStepCardDesktop(step, index))}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          !hideMinimizedBar && (
            <div className="hidden md:block mb-4">
              <div className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200/50 dark:border-red-500/30">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23dc2626' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
                
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)',
                      animation: 'banner-shimmer 3s ease-in-out infinite',
                      animationDelay: '1s'
                    }}
                  />
                </div>

                <div className="relative flex items-center gap-3 px-4 py-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30 dark:bg-red-500/20" />
                    <div className="relative p-2 rounded-full bg-red-100 dark:bg-red-500/40">
                      <Rocket className="h-5 w-5 text-red-500 dark:text-red-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      Configuração Inicial — <span className="text-red-500 dark:text-red-400">{adjustedChecklist.completedCount}/{adjustedChecklist.totalSteps}</span> concluídos
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                      Complete os passos para começar a receber pedidos!
                    </p>
                  </div>

                  <button
                    onClick={handleReopen}
                    className="flex-shrink-0 text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold bg-red-500 hover:bg-red-500 text-white shadow-sm inline-flex items-center transition-colors"
                  >
                    Completar tarefas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
