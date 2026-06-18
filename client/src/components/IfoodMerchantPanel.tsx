import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  Plus,
  Trash2,
  Calendar,
  Timer,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Segunda" },
  { value: "TUESDAY", label: "Terça" },
  { value: "WEDNESDAY", label: "Quarta" },
  { value: "THURSDAY", label: "Quinta" },
  { value: "FRIDAY", label: "Sexta" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
] as const;

const QUICK_PAUSE_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hora" },
  { minutes: 120, label: "2 horas" },
  { minutes: 240, label: "4 horas" },
];

// ─── Status Card ─────────────────────────────────────────────────────
function MerchantStatusCard() {
  const { data: status, isLoading, refetch } = trpc.ifood.merchantStatus.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every 60s
  });

  if (isLoading) {
    return (
      <SectionCard
        title="Status da Loja"
        description="Status operacional no iFood"
        icon={<Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        iconBg="bg-blue-100 dark:bg-blue-500/15"
      >
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SectionCard>
    );
  }

  if (!status?.connected) {
    return null;
  }

  return (
    <SectionCard
      title="Status da Loja"
      description="Status operacional no iFood"
      icon={<Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-500/15"
      headerRight={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-3">
        {/* Status geral */}
        <div className={cn(
          "flex items-center gap-3 p-3.5 rounded-xl border",
          status.available
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-500"
        )}>
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
            status.available
              ? "bg-green-100 dark:bg-green-500/15"
              : "bg-red-100 dark:bg-red-500/15"
          )}>
            {status.available ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {status.available ? "Loja Aberta" : "Loja Fechada"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status.available
                ? "Recebendo pedidos normalmente"
                : "Não está recebendo pedidos"}
            </p>
          </div>
          <Badge variant={status.available ? "default" : "destructive"} className="text-xs">
            {status.available ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Operações */}
        {status.operations && status.operations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Operações
            </p>
            <div className="grid gap-2">
              {status.operations.map((op: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30"
                >
                  <span className="text-sm font-medium capitalize">
                    {op.operation?.toLowerCase() === "delivery" ? "Delivery" :
                     op.operation?.toLowerCase() === "takeout" ? "Retirada" :
                     op.operation}
                  </span>
                  <Badge
                    variant={op.available ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {op.available ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interrupções ativas */}
        {status.interruptions && status.interruptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Pausas Ativas
            </p>
            <div className="space-y-2">
              {status.interruptions.map((interruption: any) => (
                <div
                  key={interruption.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-2">
                    <Pause className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-medium">{interruption.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Até {new Date(interruption.end).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Erro */}
        {status.error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-500 dark:text-red-400">{status.error}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Pause/Resume Controls ───────────────────────────────────────────
function PauseResumeCard() {
  const [customMinutes, setCustomMinutes] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const utils = trpc.useUtils();

  const { data: interruptions, isLoading } = trpc.ifood.listInterruptions.useQuery();

  const pauseMutation = trpc.ifood.pauseStore.useMutation({
    onSuccess: () => {
      toast.success("Loja pausada com sucesso!");
      utils.ifood.merchantStatus.invalidate();
      utils.ifood.listInterruptions.invalidate();
      setCustomMinutes("");
      setCustomDescription("");
      setShowCustom(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao pausar loja");
    },
  });

  const resumeMutation = trpc.ifood.resumeStore.useMutation({
    onSuccess: () => {
      toast.success("Loja retomada com sucesso!");
      utils.ifood.merchantStatus.invalidate();
      utils.ifood.listInterruptions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao retomar loja");
    },
  });

  const handleQuickPause = (minutes: number) => {
    pauseMutation.mutate({ durationMinutes: minutes });
  };

  const handleCustomPause = () => {
    const minutes = parseInt(customMinutes);
    if (!minutes || minutes < 1) {
      toast.error("Informe uma duração válida");
      return;
    }
    pauseMutation.mutate({
      durationMinutes: minutes,
      description: customDescription || undefined,
    });
  };

  const handleResume = (interruptionId: string) => {
    resumeMutation.mutate({ interruptionId });
  };

  const hasActiveInterruptions = interruptions && interruptions.length > 0;

  return (
    <SectionCard
      title="Pausar / Retomar"
      description="Controle de pausas da loja no iFood"
      icon={<Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
      iconBg="bg-amber-100 dark:bg-amber-500/15"
    >
      <div className="space-y-4">
        {/* Pausas ativas com botão de retomar */}
        {hasActiveInterruptions && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pausas Ativas
            </p>
            {interruptions.map((interruption: any) => (
              <div
                key={interruption.id}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{interruption.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(interruption.start).toLocaleString("pt-BR")} →{" "}
                    {new Date(interruption.end).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResume(interruption.id)}
                  disabled={resumeMutation.isPending}
                  className="ml-3 rounded-lg h-8 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
                >
                  {resumeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 mr-1" />
                  )}
                  Retomar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Pausa rápida */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Pausa Rápida
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {QUICK_PAUSE_OPTIONS.map((option) => (
              <Button
                key={option.minutes}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPause(option.minutes)}
                disabled={pauseMutation.isPending}
                className="rounded-lg h-9 text-xs"
              >
                {pauseMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  option.label
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Pausa customizada */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Pausa personalizada
          </button>

          {showCustom && (
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Duração (minutos)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 90"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="rounded-lg h-9 text-sm"
                    min="1"
                    max="10080"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Motivo (opcional)</Label>
                  <Input
                    placeholder="Ex: Manutenção"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="rounded-lg h-9 text-sm"
                    maxLength={255}
                  />
                </div>
              </div>
              <Button
                onClick={handleCustomPause}
                disabled={pauseMutation.isPending || !customMinutes}
                size="sm"
                className="w-full rounded-lg h-9"
              >
                {pauseMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Pause className="h-3.5 w-3.5 mr-2" />
                )}
                Pausar Loja
              </Button>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Opening Hours Card ──────────────────────────────────────────────
function OpeningHoursCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [editShifts, setEditShifts] = useState<
    Array<{ dayOfWeek: string; start: string; duration: number }>
  >([]);

  const utils = trpc.useUtils();

  const { data: hours, isLoading, refetch } = trpc.ifood.getOpeningHours.useQuery();

  const updateMutation = trpc.ifood.updateOpeningHours.useMutation({
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
      setIsEditing(false);
      utils.ifood.getOpeningHours.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar horários");
    },
  });

  const startEditing = () => {
    // Initialize edit state from current hours
    if (hours?.shifts) {
      setEditShifts(
        hours.shifts.map((s: any) => ({
          dayOfWeek: s.dayOfWeek,
          start: s.start?.substring(0, 5) || "08:00",
          duration: s.duration || 480,
        }))
      );
    } else {
      // Default: Mon-Fri 08:00-18:00 (600 min)
      setEditShifts(
        DAYS_OF_WEEK.slice(0, 5).map((d) => ({
          dayOfWeek: d.value,
          start: "08:00",
          duration: 600,
        }))
      );
    }
    setIsEditing(true);
  };

  const addShift = () => {
    setEditShifts([...editShifts, { dayOfWeek: "MONDAY", start: "08:00", duration: 480 }]);
  };

  const removeShift = (index: number) => {
    setEditShifts(editShifts.filter((_, i) => i !== index));
  };

  const updateShift = (index: number, field: string, value: string | number) => {
    const updated = [...editShifts];
    updated[index] = { ...updated[index], [field]: value };
    setEditShifts(updated);
  };

  const handleSave = () => {
    if (editShifts.length === 0) {
      toast.error("Adicione pelo menos um horário");
      return;
    }
    updateMutation.mutate({ shifts: editShifts as any });
  };

  // Group shifts by day for display
  const shiftsByDay = useMemo(() => {
    if (!hours?.shifts) return {};
    const grouped: Record<string, any[]> = {};
    for (const shift of hours.shifts as any[]) {
      const day = shift.dayOfWeek;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(shift);
    }
    return grouped;
  }, [hours]);

  const getDayLabel = (day: string) => {
    return DAYS_OF_WEEK.find((d) => d.value === day)?.label || day;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h${m.toString().padStart(2, "0")}`;
  };

  const calculateEnd = (start: string, duration: number) => {
    const [hh, mm] = start.split(":").map(Number);
    const totalMin = hh * 60 + mm + duration;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <SectionCard
        title="Horários de Funcionamento"
        description="Horários configurados no iFood"
        icon={<Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
        iconBg="bg-indigo-100 dark:bg-indigo-500/15"
      >
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Horários de Funcionamento"
      description="Horários configurados no iFood"
      icon={<Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
      iconBg="bg-indigo-100 dark:bg-indigo-500/15"
      headerRight={
        !isEditing ? (
          <Button variant="outline" size="sm" onClick={startEditing} className="h-8 rounded-lg text-xs">
            Editar
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        {!isEditing ? (
          /* ── View Mode ── */
          <>
            {Object.keys(shiftsByDay).length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum horário configurado
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="mt-3 rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Configurar Horários
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const dayShifts = shiftsByDay[day.value];
                  return (
                    <div
                      key={day.value}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/20"
                    >
                      <span className="text-sm font-medium w-20">{day.label}</span>
                      <div className="flex-1 text-right">
                        {dayShifts && dayShifts.length > 0 ? (
                          dayShifts.map((shift: any, idx: number) => (
                            <span key={idx} className="text-sm text-muted-foreground">
                              {shift.start?.substring(0, 5)} → {calculateEnd(shift.start?.substring(0, 5) || "08:00", shift.duration)}{" "}
                              <span className="text-xs text-muted-foreground/60">
                                ({formatDuration(shift.duration)})
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground/50">Fechado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── Edit Mode ── */
          <div className="space-y-3">
            {editShifts.map((shift, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30"
              >
                <Select
                  value={shift.dayOfWeek}
                  onValueChange={(val) => updateShift(index, "dayOfWeek", val)}
                >
                  <SelectTrigger className="w-28 h-8 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="time"
                  value={shift.start}
                  onChange={(e) => updateShift(index, "start", e.target.value)}
                  className="w-24 h-8 rounded-lg text-xs"
                />

                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={shift.duration}
                    onChange={(e) => updateShift(index, "duration", parseInt(e.target.value) || 0)}
                    className="w-16 h-8 rounded-lg text-xs"
                    min="1"
                    max="1440"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  → {calculateEnd(shift.start, shift.duration)}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeShift(index)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addShift}
              className="w-full rounded-lg h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar Turno
            </Button>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-lg h-9"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 rounded-lg h-9"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                )}
                Salvar Horários
              </Button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────
export function IfoodMerchantPanel() {
  return (
    <div className="space-y-5">
      <MerchantStatusCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PauseResumeCard />
        <OpeningHoursCard />
      </div>
    </div>
  );
}
