import { Rocket } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { usePreference } from "@/hooks/usePreference";
import { trpc } from "@/lib/trpc";
import { WelcomeChecklist } from "./WelcomeChecklist";
import { cn } from "@/lib/utils";

/**
 * OnboardingFAB - Botão flutuante global com ícone de foguete.
 * Aparece em TODAS as páginas enquanto o onboarding não estiver completo.
 * É o único ponto de abertura da sidebar de Primeiros Passos.
 * 
 * NÃO tem query própria — recebe o estado do WelcomeChecklist via callbacks.
 * Isto garante que o FAB nunca desmonta o WelcomeChecklist antes da celebração.
 */
export function OnboardingFAB() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const hasAutoOpened = useRef(false);

  // Estado recebido do WelcomeChecklist via onStateChange
  const [checklistState, setChecklistState] = useState<{
    completedCount: number;
    totalSteps: number;
    allCompleted: boolean;
    isDismissed: boolean;
  } | null>(null);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;

  // Preferência de auto-abertura persistida no banco.
  // Também consultamos o cache local explicitamente porque o establishmentId chega de forma assíncrona;
  // sem esta proteção, um F5 podia abrir o modal antes da preferência do servidor/localStorage sincronizar.
  const [autoOpenedPref, setAutoOpenedPref, autoOpenedLoading] = usePreference('onboarding_auto_opened', establishmentId);

  // Auto-abrir apenas na primeira visita real do utilizador, nunca a cada atualização da página.
  useEffect(() => {
    if (!establishmentId || !checklistState || checklistState.isDismissed || checklistState.allCompleted) return;
    if (hasAutoOpened.current) return;

    const localAutoOpened = (() => {
      if (typeof window === 'undefined') return false;
      try {
        return localStorage.getItem(`pref_onboarding_auto_opened_${establishmentId}`) === 'true';
      } catch {
        return false;
      }
    })();

    const alreadyAutoOpened = autoOpenedPref === 'true' || localAutoOpened;

    // Se ainda não há confirmação local e a preferência do banco está a carregar,
    // aguardar para evitar falso negativo que reabre o modal em refresh/F5.
    if (!alreadyAutoOpened && autoOpenedLoading) return;

    if (!alreadyAutoOpened) {
      hasAutoOpened.current = true;
      setAutoOpenedPref('true');
      setSidebarOpen(true);
    }
  }, [establishmentId, checklistState, autoOpenedPref, autoOpenedLoading, setAutoOpenedPref]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleRequestOpen = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCelebrationChange = useCallback((celebrating: boolean) => {
    setIsCelebrating(celebrating);
    if (celebrating) {
      // Garantir que a sidebar está aberta durante a celebração
      setSidebarOpen(true);
    }
    if (!celebrating) {
      setSidebarOpen(false);
    }
  }, []);

  const handleStateChange = useCallback((state: {
    completedCount: number;
    totalSteps: number;
    allCompleted: boolean;
    isDismissed: boolean;
  }) => {
    setChecklistState(state);
  }, []);

  // Não mostrar se sem establishment
  if (!establishmentId) {
    return null;
  }

  // Esconder no plano Lite
  const isLitePlan = establishment?.planType === 'lite' || establishment?.planType === 'trial' || establishment?.planType === 'free';
  if (isLitePlan) {
    return null;
  }

  // Verificar se deve esconder (dismissed ou allCompleted sem celebração)
  const shouldHideFAB = checklistState?.isDismissed || (checklistState?.allCompleted && !isCelebrating);

  return (
    <>
      {/* FAB Button - só aparece quando a sidebar está fechada, não está a celebrar, e o checklist não está completo/dismissed */}
      {!sidebarOpen && !isCelebrating && !shouldHideFAB && checklistState && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={cn(
            "fixed bottom-[5.5rem] right-6 z-50 group",
            "w-[54px] h-[54px] rounded-full",
            "bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-500 hover:to-rose-600",
            "shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40",
            "flex items-center justify-center",
            "transition-transform duration-300 hover:scale-110",
            "print:hidden"
          )}
          title="Primeiros Passos"
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full animate-ping bg-red-400/30" style={{ animationDuration: '2s' }} />
          
          {/* Badge de progresso */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-500">
              {checklistState.completedCount}/{checklistState.totalSteps}
            </span>
          </div>

          <Rocket className="h-6 w-6 text-white relative z-10" />
        </button>
      )}

      {/* WelcomeChecklist sidebar - SEMPRE montado enquanto houver establishmentId */}
      <WelcomeChecklist
        establishmentId={establishmentId}
        establishmentName={establishment?.name}
        externalOpen={sidebarOpen}
        onExternalClose={closeSidebar}
        onRequestOpen={handleRequestOpen}
        onCelebrationChange={handleCelebrationChange}
        onStateChange={handleStateChange}
        hideMinimizedBar
      />
    </>
  );
}
