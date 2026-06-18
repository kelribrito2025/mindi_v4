import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SectionCard } from "@/components/shared";
import { CalendarClock, Clock, Timer, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SchedulingSettings() {
  const { data: config, isLoading } = trpc.scheduling.getConfig.useQuery();
  const utils = trpc.useUtils();
  const updateConfig = trpc.scheduling.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações de agendamento salvas!");
      utils.scheduling.getConfig.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [enabled, setEnabled] = useState(false);
  const [minAdvance, setMinAdvance] = useState(60);
  const [maxDays, setMaxDays] = useState(7);
  const [interval, setIntervalVal] = useState(30);
  const [moveMinutes, setMoveMinutes] = useState(30);

  // Track if initial load has happened to prevent auto-save on mount
  const initialLoadDone = useRef(false);

  // Debounce refs for sliders
  const debounceMinAdvance = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceMaxDays = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceMoveMinutes = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (config) {
      setEnabled(config.schedulingEnabled);
      setMinAdvance(config.schedulingMinAdvance);
      setMaxDays(config.schedulingMaxDays);
      setIntervalVal(config.schedulingInterval);
      setMoveMinutes(config.schedulingMoveMinutes);
      // Mark initial load as done after a short delay to avoid triggering auto-save
      setTimeout(() => { initialLoadDone.current = true; }, 300);
    }
  }, [config]);

  // Auto-save helper - saves all current values with an override for the changed field
  const autoSave = useCallback((overrides: Record<string, any>) => {
    if (!initialLoadDone.current) return;
    updateConfig.mutate({
      schedulingEnabled: overrides.schedulingEnabled ?? enabled,
      schedulingMinAdvance: overrides.schedulingMinAdvance ?? minAdvance,
      schedulingMaxDays: overrides.schedulingMaxDays ?? maxDays,
      schedulingInterval: overrides.schedulingInterval ?? interval,
      schedulingMoveMinutes: overrides.schedulingMoveMinutes ?? moveMinutes,
    });
  }, [enabled, minAdvance, maxDays, interval, moveMinutes, updateConfig]);

  // Toggle enabled - immediate save
  const handleToggleEnabled = (val: boolean) => {
    setEnabled(val);
    if (!initialLoadDone.current) return;
    updateConfig.mutate({
      schedulingEnabled: val,
      schedulingMinAdvance: minAdvance,
      schedulingMaxDays: maxDays,
      schedulingInterval: interval,
      schedulingMoveMinutes: moveMinutes,
    });
  };

  // Interval buttons - immediate save
  const handleIntervalChange = (val: number) => {
    setIntervalVal(val);
    if (!initialLoadDone.current) return;
    updateConfig.mutate({
      schedulingEnabled: enabled,
      schedulingMinAdvance: minAdvance,
      schedulingMaxDays: maxDays,
      schedulingInterval: val,
      schedulingMoveMinutes: moveMinutes,
    });
  };

  // Slider: minAdvance - debounce 800ms
  const handleMinAdvanceChange = ([v]: number[]) => {
    setMinAdvance(v);
    if (debounceMinAdvance.current) clearTimeout(debounceMinAdvance.current);
    debounceMinAdvance.current = setTimeout(() => {
      if (!initialLoadDone.current) return;
      updateConfig.mutate({
        schedulingEnabled: enabled,
        schedulingMinAdvance: v,
        schedulingMaxDays: maxDays,
        schedulingInterval: interval,
        schedulingMoveMinutes: moveMinutes,
      });
    }, 800);
  };

  // Slider: maxDays - debounce 800ms
  const handleMaxDaysChange = ([v]: number[]) => {
    setMaxDays(v);
    if (debounceMaxDays.current) clearTimeout(debounceMaxDays.current);
    debounceMaxDays.current = setTimeout(() => {
      if (!initialLoadDone.current) return;
      updateConfig.mutate({
        schedulingEnabled: enabled,
        schedulingMinAdvance: minAdvance,
        schedulingMaxDays: v,
        schedulingInterval: interval,
        schedulingMoveMinutes: moveMinutes,
      });
    }, 800);
  };

  // Slider: moveMinutes - debounce 800ms
  const handleMoveMinutesChange = ([v]: number[]) => {
    setMoveMinutes(v);
    if (debounceMoveMinutes.current) clearTimeout(debounceMoveMinutes.current);
    debounceMoveMinutes.current = setTimeout(() => {
      if (!initialLoadDone.current) return;
      updateConfig.mutate({
        schedulingEnabled: enabled,
        schedulingMinAdvance: minAdvance,
        schedulingMaxDays: maxDays,
        schedulingInterval: interval,
        schedulingMoveMinutes: v,
      });
    }, 800);
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} minutos`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-muted rounded-lg w-48" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <SectionCard
      title="Agendamento de Pedidos"
      description="Permita que seus clientes agendem pedidos para datas e horários futuros"
      icon={<CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
      iconBg="bg-indigo-100 dark:bg-indigo-500/15"
    >
      <div className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              enabled ? "bg-indigo-100 dark:bg-indigo-500/15" : "bg-muted/50"
            )}>
              <CalendarClock className={cn("h-4 w-4", enabled ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")} />
            </div>
            <div>
              <Label className="text-sm font-medium">Habilitar agendamento</Label>
              <p className="text-xs text-muted-foreground">
                Exibe o botão "Agendar" no menu público para seus clientes
              </p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggleEnabled} />
        </div>

        {/* Seções expandidas quando ativo */}
        {enabled && (
          <div className="space-y-6 pt-2">
            {/* Divisor visual */}
            <div className="border-t border-border/50" />

            {/* Regras de Tempo */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/15">
                  <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Regras de Tempo</h4>
                  <p className="text-xs text-muted-foreground">Defina os limites de antecedência para agendamentos</p>
                </div>
              </div>

              <div className="space-y-5 pl-1">
                {/* Antecedência mínima */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-500/10">
                        <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <Label className="text-sm">Antecedência mínima</Label>
                    </div>
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded-lg">{formatMinutes(minAdvance)}</span>
                  </div>
                  <Slider
                    value={[minAdvance]}
                    onValueChange={handleMinAdvanceChange}
                    min={15}
                    max={480}
                    step={15}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo mínimo antes do horário agendado que o cliente pode fazer o pedido
                  </p>
                </div>

                {/* Antecedência máxima (dias) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-500/10">
                        <Calendar className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <Label className="text-sm">Antecedência máxima</Label>
                    </div>
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded-lg">{maxDays} {maxDays === 1 ? "dia" : "dias"}</span>
                  </div>
                  <Slider
                    value={[maxDays]}
                    onValueChange={handleMaxDaysChange}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantos dias no futuro o cliente pode agendar
                  </p>
                </div>
              </div>
            </div>

            {/* Divisor visual */}
            <div className="border-t border-border/50" />

            {/* Intervalo de Horários */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/15">
                  <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Intervalo de Horários</h4>
                  <p className="text-xs text-muted-foreground">Defina o intervalo entre os horários disponíveis</p>
                </div>
              </div>

              <div className="pl-1 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[15, 30, 60].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleIntervalChange(val)}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                        interval === val
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-sm"
                          : "border-border/50 bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      <Timer className={cn("h-4 w-4", interval === val ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
                      <span className={cn("font-semibold text-sm", interval === val ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>{val} min</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Exemplo: com intervalo de {interval} min, os horários serão 11:00, {interval === 15 ? "11:15, 11:30, 11:45" : interval === 30 ? "11:30, 12:00, 12:30" : "12:00, 13:00, 14:00"}...
                </p>
              </div>
            </div>

            {/* Divisor visual */}
            <div className="border-t border-border/50" />

            {/* Automação da Fila */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Automação da Fila</h4>
                  <p className="text-xs text-muted-foreground">Configure quando o pedido entra na fila de preparo</p>
                </div>
              </div>

              <div className="pl-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10">
                      <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <Label className="text-sm">Mover para fila de preparo</Label>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">{formatMinutes(moveMinutes)} antes</span>
                </div>
                <Slider
                  value={[moveMinutes]}
                  onValueChange={handleMoveMinutesChange}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    O pedido agendado será movido automaticamente para a fila de pedidos novos {formatMinutes(moveMinutes)} antes do horário agendado, para que você tenha tempo de preparar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
