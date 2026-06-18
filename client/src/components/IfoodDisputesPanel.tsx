import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  ArrowRightLeft,
  Shield,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Countdown Timer ─────────────────────────────────────────────────

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes < 2) {
        setIsUrgent(true);
      }

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        setTimeLeft(`${hours}h ${mins}min`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isExpired) {
    return <Badge variant="destructive" className="text-xs">Expirado</Badge>;
  }

  return (
    <Badge
      variant={isUrgent ? "destructive" : "secondary"}
      className={cn("text-xs font-mono", isUrgent && "")}
    >
      <Clock className="h-3 w-3 mr-1" />
      {timeLeft}
    </Badge>
  );
}

// ─── Action Labels ───────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CANCELLATION: { label: "Cancelamento", color: "text-red-500" },
  PARTIAL_CANCELLATION: { label: "Cancelamento Parcial", color: "text-orange-500" },
  PROPOSED_AMOUNT_REFUND: { label: "Reembolso Proposto", color: "text-amber-500" },
  PROPOSED_ADDITIONAL_TIME: { label: "Tempo Adicional", color: "text-blue-500" },
};

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendente", variant: "default" },
  ACCEPTED: { label: "Aceita", variant: "secondary" },
  REJECTED: { label: "Rejeitada", variant: "destructive" },
  ALTERNATIVE: { label: "Contra-proposta", variant: "outline" },
  EXPIRED: { label: "Expirada", variant: "secondary" },
};

// ─── Dispute Card ────────────────────────────────────────────────────

function DisputeCard({
  dispute,
  onSelect,
}: {
  dispute: any;
  onSelect: (d: any) => void;
}) {
  const actionInfo = ACTION_LABELS[dispute.action] || { label: dispute.action, color: "text-muted-foreground" };
  const statusInfo = STATUS_BADGES[dispute.status] || { label: dispute.status, variant: "secondary" as const };

  return (
    <button
      onClick={() => onSelect(dispute)}
      className="w-full text-left border border-border/50 rounded-lg p-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-medium", actionInfo.color)}>
              {actionInfo.label}
            </span>
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Pedido: {dispute.orderId.slice(0, 12)}...
          </p>
          {dispute.message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              <MessageSquare className="h-3 w-3 inline mr-1" />
              {dispute.message}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {dispute.status === "PENDING" && (
            <CountdownTimer expiresAt={dispute.expiresAt} />
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(dispute.createdAt).toLocaleString("pt-BR", { 
              day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" 
            })}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Dispute Detail Dialog ───────────────────────────────────────────

function DisputeDetailDialog({
  dispute,
  open,
  onOpenChange,
  onActionComplete,
}: {
  dispute: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null);

  const { data: reasons } = trpc.ifood.disputeCancellationReasons.useQuery();

  const acceptMutation = trpc.ifood.acceptDispute.useMutation({
    onSuccess: () => {
      toast.success("Disputa aceita com sucesso");
      onActionComplete();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || "Erro ao aceitar disputa"),
  });

  const rejectMutation = trpc.ifood.rejectDispute.useMutation({
    onSuccess: () => {
      toast.success("Disputa rejeitada");
      onActionComplete();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || "Erro ao rejeitar disputa"),
  });

  const alternativeMutation = trpc.ifood.sendAlternative.useMutation({
    onSuccess: () => {
      toast.success("Contra-proposta enviada");
      onActionComplete();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || "Erro ao enviar contra-proposta"),
  });

  if (!dispute) return null;

  const actionInfo = ACTION_LABELS[dispute.action] || { label: dispute.action, color: "" };
  const isPending = dispute.status === "PENDING";
  const isExpired = new Date(dispute.expiresAt) < new Date();
  const canAct = isPending && !isExpired;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Disputa — {actionInfo.label}
          </DialogTitle>
          <DialogDescription>
            Pedido: {dispute.orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status & Timer */}
          <div className="flex items-center justify-between">
            <Badge variant={STATUS_BADGES[dispute.status]?.variant || "secondary"}>
              {STATUS_BADGES[dispute.status]?.label || dispute.status}
            </Badge>
            {isPending && <CountdownTimer expiresAt={dispute.expiresAt} />}
          </div>

          {/* Timeout action warning */}
          {isPending && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Se não responder a tempo, a ação padrão será: <strong>{dispute.timeoutAction === "ACCEPT" ? "Aceitar automaticamente" : "Rejeitar automaticamente"}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Customer message */}
          {dispute.message && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Mensagem do cliente:</p>
              <p className="text-sm">{dispute.message}</p>
            </div>
          )}

          {/* Evidence photos */}
          {dispute.metadata?.evidences?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Evidências:</p>
              <div className="grid grid-cols-2 gap-2">
                {dispute.metadata.evidences.map((ev: any, i: number) => (
                  <div key={i} className="border border-border/50 rounded-md overflow-hidden">
                    {ev.type === "PHOTO" && ev.url ? (
                      <img loading="lazy" src={ev.url} alt={`Evidência ${i + 1}`} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="p-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-4 w-4 mb-1" />
                        {ev.description || "Sem descrição"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items affected */}
          {dispute.metadata?.items?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Itens afetados:</p>
              <div className="space-y-1">
                {dispute.metadata.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-muted/20 rounded px-2 py-1">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-muted-foreground">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {dispute.metadata.refundAmount && (
                <p className="text-sm font-medium mt-2">
                  Valor do reembolso: R$ {dispute.metadata.refundAmount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Alternatives */}
          {canAct && dispute.alternatives?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Contra-propostas disponíveis:</p>
              <div className="space-y-2">
                {dispute.alternatives.map((alt: any) => (
                  <button
                    key={alt.id}
                    onClick={() => {
                      alternativeMutation.mutate({
                        disputeId: dispute.disputeId,
                        orderId: dispute.orderId,
                        alternativeId: alt.id,
                      });
                    }}
                    disabled={alternativeMutation.isPending}
                    className="w-full text-left border border-border/50 rounded-md p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{alt.description}</span>
                    </div>
                    {alt.amount && (
                      <p className="text-xs text-muted-foreground mt-1">Valor: R$ {alt.amount.toFixed(2)}</p>
                    )}
                    {alt.additionalTime && (
                      <p className="text-xs text-muted-foreground mt-1">Tempo adicional: {alt.additionalTime} min</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {canAct && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {confirmAction === "accept" ? (
              <div className="flex items-center gap-2 w-full">
                {reasons && reasons.length > 0 && (
                  <Select value={selectedReason} onValueChange={setSelectedReason}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Motivo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((r) => (
                        <SelectItem key={r.code} value={r.code}>{r.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  onClick={() => {
                    acceptMutation.mutate({
                      disputeId: dispute.disputeId,
                      orderId: dispute.orderId,
                      reasonCode: selectedReason || undefined,
                    });
                  }}
                  disabled={acceptMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                  Voltar
                </Button>
              </div>
            ) : confirmAction === "reject" ? (
              <div className="flex items-center gap-2 w-full">
                <p className="text-sm text-muted-foreground flex-1">Tem certeza que deseja rejeitar?</p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    rejectMutation.mutate({
                      disputeId: dispute.disputeId,
                      orderId: dispute.orderId,
                    });
                  }}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, Rejeitar"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                  Voltar
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => setConfirmAction("accept")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aceitar
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                  onClick={() => setConfirmAction("reject")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────

export function IfoodDisputesPanel() {
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: disputes, isLoading, refetch, isRefetching } = trpc.ifood.listDisputes.useQuery(
    filterStatus !== "all" ? { status: filterStatus } : undefined,
    { refetchInterval: 30000 } // Refresh every 30s for pending disputes
  );

  const pendingCount = useMemo(() => {
    return disputes?.filter((d: any) => d.status === "PENDING").length || 0;
  }, [disputes]);

  return (
    <>
      <SectionCard
        title="Disputas & Negociações"
        icon={<Shield className="h-5 w-5" />}
        headerRight={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            </Button>
          </div>
        }
      >
        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="ACCEPTED">Aceitas</SelectItem>
              <SelectItem value="REJECTED">Rejeitadas</SelectItem>
              <SelectItem value="ALTERNATIVE">Contra-proposta</SelectItem>
              <SelectItem value="EXPIRED">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando disputas...</span>
          </div>
        ) : !disputes?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
            <p className="text-sm">Nenhuma disputa encontrada</p>
            <p className="text-xs">As disputas do iFood aparecerão aqui quando recebidas</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {disputes.map((dispute: any) => (
              <DisputeCard
                key={dispute.disputeId}
                dispute={dispute}
                onSelect={setSelectedDispute}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Detail Dialog */}
      <DisputeDetailDialog
        dispute={selectedDispute}
        open={!!selectedDispute}
        onOpenChange={(open) => { if (!open) setSelectedDispute(null); }}
        onActionComplete={() => refetch()}
      />
    </>
  );
}
