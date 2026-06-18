import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Heart,
  XCircle,
  Tag,
  Gift,
} from "lucide-react";

type CancelReason = "too_expensive" | "not_using" | "missing_features" | "found_alternative" | "technical_issues" | "other";

interface CancelRetentionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanName: string;
  currentAmountFormatted: string;
  onCanceled: () => void;
}

const REASON_OPTIONS: { value: CancelReason; label: string; emoji: string }[] = [
  { value: "too_expensive", label: "Está muito caro para mim", emoji: "💰" },
  { value: "not_using", label: "Não estou usando o suficiente", emoji: "📉" },
  { value: "missing_features", label: "Faltam funcionalidades que preciso", emoji: "🔧" },
  { value: "found_alternative", label: "Encontrei outra solução", emoji: "🔄" },
  { value: "technical_issues", label: "Problemas técnicos", emoji: "⚠️" },
  { value: "other", label: "Outro motivo", emoji: "💬" },
];

export function CancelRetentionModal({
  open,
  onOpenChange,
  currentPlanName,
  currentAmountFormatted,
  onCanceled,
}: CancelRetentionModalProps) {
  const [step, setStep] = useState<"reason" | "offer" | "confirm" | "done" | "offer_accepted">("reason");
  const [selectedReason, setSelectedReason] = useState<CancelReason | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [offerData, setOfferData] = useState<{
    eligible: boolean;
    subscriptionId: number;
    discountPercent: number;
    discountMonths: number;
    discountedAmountCents: number;
    currentAmountCents: number;
    offerType: string;
    currentPeriodEnd: string | null;
  } | null>(null);
  const [cancelResult, setCancelResult] = useState<{ cancelAt: string; message: string } | null>(null);
  const [offerResult, setOfferResult] = useState<{ discountPercent: number; discountMonths: number } | null>(null);

  const initCancelMutation = trpc.cancelRetention.initCancel.useMutation({
    onSuccess: (data) => {
      setOfferData({
        eligible: data.eligible,
        subscriptionId: data.subscriptionId,
        discountPercent: data.discountPercent,
        discountMonths: data.discountMonths,
        discountedAmountCents: data.discountedAmountCents,
        currentAmountCents: data.currentAmountCents,
        offerType: data.offerType,
        currentPeriodEnd: data.currentPeriodEnd ? String(data.currentPeriodEnd) : null,
      });
      if (data.eligible) {
        setStep("offer");
      } else {
        setStep("confirm");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao processar cancelamento");
    },
  });

  const acceptOfferMutation = trpc.cancelRetention.acceptRetentionOffer.useMutation({
    onSuccess: (data) => {
      setOfferResult({ discountPercent: data.discountPercent, discountMonths: data.discountMonths });
      setStep("offer_accepted");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao aceitar oferta");
    },
  });

  const confirmCancelMutation = trpc.cancelRetention.confirmCancel.useMutation({
    onSuccess: (data) => {
      setCancelResult({ cancelAt: String(data.cancelAt), message: data.message });
      setStep("done");
      onCanceled();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao confirmar cancelamento");
    },
  });

  const handleReasonSubmit = () => {
    if (!selectedReason) {
      toast.error("Selecione um motivo");
      return;
    }
    initCancelMutation.mutate({
      reason: selectedReason,
      reasonText: reasonText || undefined,
    });
  };

  const handleAcceptOffer = () => {
    if (!offerData || !selectedReason) return;
    acceptOfferMutation.mutate({
      subscriptionId: offerData.subscriptionId,
      reason: selectedReason,
      reasonText: reasonText || undefined,
      offerType: offerData.offerType,
      discountPercent: offerData.discountPercent,
      discountMonths: offerData.discountMonths,
    });
  };

  const handleConfirmCancel = () => {
    if (!offerData || !selectedReason) return;
    confirmCancelMutation.mutate({
      subscriptionId: offerData.subscriptionId,
      reason: selectedReason,
      reasonText: reasonText || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("reason");
      setSelectedReason(null);
      setReasonText("");
      setOfferData(null);
      setCancelResult(null);
      setOfferResult(null);
    }, 300);
  };

  const formatCurrency = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Step 1: Reason */}
        {step === "reason" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Sentimos muito que você queira sair
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Nos conte o motivo para podermos melhorar nosso serviço:
              </p>
              <div className="space-y-2">
                {REASON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedReason === option.value
                        ? "border-red-400 bg-red-50 dark:bg-red-500/10 dark:border-red-500/40"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedReason(option.value)}
                  >
                    <span className="text-sm font-medium">
                      {option.emoji} {option.label}
                    </span>
                  </button>
                ))}
              </div>
              {selectedReason === "other" && (
                <Textarea
                  placeholder="Conte-nos mais sobre o motivo..."
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  className="min-h-[80px]"
                />
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleReasonSubmit}
                  disabled={!selectedReason || initCancelMutation.isPending}
                >
                  {initCancelMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                  ) : (
                    "Continuar"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Retention Offer */}
        {step === "offer" && offerData && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-500" />
                Temos uma oferta especial para você!
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5 text-center">
                <Tag className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                  {offerData.discountPercent}% de desconto
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                  nos próximos {offerData.discountMonths} meses
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-muted-foreground line-through text-sm">
                    {formatCurrency(offerData.currentAmountCents)}/mês
                  </span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(offerData.discountedAmountCents)}/mês
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Entendemos que o momento pode ser difícil. Preparamos essa oferta exclusiva para que você continue aproveitando todos os recursos do plano <strong>{currentPlanName}</strong>.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11"
                  onClick={handleAcceptOffer}
                  disabled={acceptOfferMutation.isPending}
                >
                  {acceptOfferMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Aplicando desconto...</>
                  ) : (
                    <>Aceitar oferta de {offerData.discountPercent}% off</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-red-500"
                  onClick={() => setStep("confirm")}
                  disabled={acceptOfferMutation.isPending}
                >
                  Não, quero continuar o cancelamento
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Final Confirmation */}
        {step === "confirm" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirmar cancelamento
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                  Ao cancelar, você perderá acesso a:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1.5 list-disc list-inside">
                  <li>Cardápio digital online</li>
                  <li>Pedidos via WhatsApp/delivery</li>
                  <li>Relatórios e análises</li>
                  <li>Suporte prioritário</li>
                  <li>Todas as funcionalidades do plano {currentPlanName}</li>
                </ul>
              </div>

              {offerData?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground text-center">
                  Seu plano ficará ativo até{" "}
                  <strong className="text-foreground">
                    {new Date(offerData.currentPeriodEnd).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  . Após essa data, o acesso será limitado.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Manter meu plano
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleConfirmCancel}
                  disabled={confirmCancelMutation.isPending}
                >
                  {confirmCancelMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelando...</>
                  ) : (
                    "Confirmar cancelamento"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Cancellation Done */}
        {step === "done" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                Cancelamento confirmado
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {cancelResult?.message || "Seu plano será cancelado ao fim do período atual."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Você pode reativar sua assinatura a qualquer momento acessando a página de Planos.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleClose}
              >
                Entendi
              </Button>
            </div>
          </>
        )}

        {/* Step: Offer Accepted */}
        {step === "offer_accepted" && offerResult && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Desconto aplicado com sucesso!
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground mb-1">
                  {offerResult.discountPercent}% de desconto ativado!
                </p>
                <p className="text-sm text-muted-foreground">
                  Seu desconto de {offerResult.discountPercent}% será aplicado automaticamente nas próximas {offerResult.discountMonths} cobranças. Obrigado por continuar conosco!
                </p>
              </div>
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleClose}
              >
                Ótimo, continuar usando!
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
