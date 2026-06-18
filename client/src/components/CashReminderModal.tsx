import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Clock } from "lucide-react";
import { useLocation } from "wouter";

interface CashReminderModalProps {
  establishmentId: number | null;
}

const DISMISSED_KEY = "cash_reminder_dismissed";

function getDismissedFromStorage(): Set<string> {
  try {
    const stored = sessionStorage.getItem(DISMISSED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if it's from today
      const today = new Date().toISOString().split("T")[0];
      if (parsed.date === today) {
        return new Set(parsed.types as string[]);
      }
    }
  } catch {}
  return new Set();
}

function saveDismissedToStorage(types: Set<string>) {
  const today = new Date().toISOString().split("T")[0];
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify({ date: today, types: Array.from(types) }));
}

export function CashReminderModal({ establishmentId }: CashReminderModalProps) {
  const [dismissedToday, setDismissedToday] = useState<Set<string>>(getDismissedFromStorage);
  const [showModal, setShowModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<{ type: "open" | "close"; message: string } | null>(null);
  const [location, navigate] = useLocation();

  // Don't show modal on controle-caixa page (where the Abrir Caixa drawer opens)
  const isOnCaixaPage = location === "/controle-caixa";

  // Poll for pending reminders every 30 seconds
  const { data: pendingReminders } = trpc.cashReminder.getPendingReminders.useQuery(
    { establishmentId: establishmentId! },
    {
      enabled: !!establishmentId && !isOnCaixaPage,
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    }
  );

  const dismissMutation = trpc.cashReminder.dismissReminder.useMutation();

  useEffect(() => {
    // Never show on caixa page
    if (isOnCaixaPage) {
      setShowModal(false);
      setCurrentReminder(null);
      return;
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      setShowModal(false);
      setCurrentReminder(null);
      return;
    }
    const activeReminder = pendingReminders.find(
      (r: any) => !dismissedToday.has(r.reminderType)
    );
    if (activeReminder) {
      const type = activeReminder.reminderType as "open" | "close";
      const message = type === "open"
        ? "O horário de funcionamento já começou. Abra o caixa para registrar suas vendas."
        : "O horário de encerramento está próximo. Feche o caixa para finalizar o dia.";
      setCurrentReminder({ type, message });
      setShowModal(true);
    } else {
      setShowModal(false);
      setCurrentReminder(null);
    }
  }, [pendingReminders, dismissedToday, isOnCaixaPage]);

  function handleDismiss() {
    if (!currentReminder || !establishmentId) return;
    const newDismissed = new Set(dismissedToday).add(currentReminder.type);
    setDismissedToday(newDismissed);
    saveDismissedToStorage(newDismissed);
    setShowModal(false);
    setCurrentReminder(null);
    dismissMutation.mutate({
      establishmentId,
      reminderType: currentReminder.type,
    });
  }

  function handleGoToCaixa() {
    if (!currentReminder || !establishmentId) return;
    const newDismissed = new Set(dismissedToday).add(currentReminder.type);
    setDismissedToday(newDismissed);
    saveDismissedToStorage(newDismissed);
    setShowModal(false);
    setCurrentReminder(null);
    dismissMutation.mutate({
      establishmentId,
      reminderType: currentReminder.type,
    });
    navigate("/controle-caixa");
  }

  if (!showModal || !currentReminder || isOnCaixaPage) return null;

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[414px] p-0 overflow-hidden border-0 bg-white [&>button]:hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:w-full max-sm:max-w-full sm:rounded-[28px]"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)' }}
        overlayClassName="bg-black/20 backdrop-blur-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Lembrete de caixa</DialogTitle>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
            {/* Animated icon with sparkles */}
            <div className="relative shrink-0">
              {/* Sparkle particles */}
              <div className="absolute inset-0 -m-3">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-red-400 animate-ping text-[8px]" style={{ animationDuration: '1.5s', animationDelay: '0.1s' }}>&#10022;</span>
                <span className="absolute top-1 right-0 text-red-300 animate-ping text-[7px]" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>&#9671;</span>
                <span className="absolute bottom-0 left-0 text-red-300 animate-ping text-[7px]" style={{ animationDuration: '1.8s', animationDelay: '0.5s' }}>&#9675;</span>
                <span className="absolute bottom-1 right-1 text-red-300 animate-ping text-[6px]" style={{ animationDuration: '1.7s', animationDelay: '0.4s' }}>&mdash;</span>
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-red-100 opacity-40 scale-125" />
              {/* Main circle */}
              <div className="relative w-[42px] h-[42px] border-2 border-red-400 rounded-full flex items-center justify-center bg-white shadow-sm">
                {currentReminder.type === "open" ? (
                  <Clock className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                ) : (
                  <Bell className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-foreground">
                {currentReminder.type === "open" ? "Abertura de caixa" : "Fechamento de caixa"}
              </h3>
              <p className="text-[11px] text-muted-foreground">Lembrete</p>
            </div>
          </div>

          {/* Message area */}
          <div className="flex items-center gap-2.5 rounded-[14px] p-3.5 mb-4" style={{ background: 'linear-gradient(135deg, #fef2f2, #fef9f0)' }}>
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
              {currentReminder.type === "open" ? (
                <Clock className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
            <span className="flex-1 text-xs font-medium text-gray-700">{currentReminder.message}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold border-gray-200"
              onClick={handleDismiss}
            >
              Dispensar
            </Button>
            <Button
              className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white"
              onClick={handleGoToCaixa}
            >
              Ir para Caixa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
