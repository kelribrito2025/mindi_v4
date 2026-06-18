import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BellRing, Clock, Save, Loader2 } from "lucide-react";

interface CashReminderSettingsProps {
  establishmentId: number | null;
}

export function CashReminderSettings({ establishmentId }: CashReminderSettingsProps) {
  const [openEnabled, setOpenEnabled] = useState(true);
  const [closeEnabled, setCloseEnabled] = useState(true);
  const [openDelay, setOpenDelay] = useState("5");
  const [closeBefore, setCloseBefore] = useState("5");
  const [maxClose, setMaxClose] = useState("3");
  const [respectClosed, setRespectClosed] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = trpc.cashReminder.getSettings.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const saveMutation = trpc.cashReminder.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações de lembretes salvas!");
      setHasChanges(false);
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  // Load settings when data arrives
  useEffect(() => {
    if (settings) {
      setOpenEnabled(settings.openReminderEnabled);
      setCloseEnabled(settings.closeReminderEnabled);
      setOpenDelay(String(settings.openReminderDelayMinutes));
      setCloseBefore(String(settings.closeReminderBeforeMinutes));
      setMaxClose(String(settings.maxCloseReminders));
      setRespectClosed(settings.respectClosedDays);
    }
  }, [settings]);

  function handleSave() {
    if (!establishmentId) return;
    saveMutation.mutate({
      establishmentId,
      openReminderEnabled: openEnabled,
      closeReminderEnabled: closeEnabled,
      openReminderDelayMinutes: parseInt(openDelay),
      closeReminderBeforeMinutes: parseInt(closeBefore),
      maxCloseReminders: parseInt(maxClose),
      respectClosedDays: respectClosed,
    });
  }

  function markChanged() {
    setHasChanges(true);
  }

  if (!establishmentId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="space-y-6">

      {/* Lembrete de Abertura */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <Label className="text-sm font-medium">Lembrete de Abertura</Label>
          </div>
          <Switch
            checked={openEnabled}
            onCheckedChange={(v) => { setOpenEnabled(v); markChanged(); }}
          />
        </div>
        {openEnabled && (
          <div className="pl-6 space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Lembrar após
              </Label>
              <Select
                value={openDelay}
                onValueChange={(v) => { setOpenDelay(v); markChanged(); }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 min</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                do horário de abertura
              </span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Se o caixa não for aberto dentro desse tempo após o horário de funcionamento, você receberá uma notificação.
            </p>
          </div>
        )}
      </div>

      {/* Lembrete de Fechamento */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-600" />
            <Label className="text-sm font-medium">Lembrete de Fechamento</Label>
          </div>
          <Switch
            checked={closeEnabled}
            onCheckedChange={(v) => { setCloseEnabled(v); markChanged(); }}
          />
        </div>
        {closeEnabled && (
          <div className="pl-6 space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Lembrar
              </Label>
              <Select
                value={closeBefore}
                onValueChange={(v) => { setCloseBefore(v); markChanged(); }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                antes do fechamento
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Máximo de lembretes/dia
              </Label>
              <Select
                value={maxClose}
                onValueChange={(v) => { setMaxClose(v); markChanged(); }}
              >
                <SelectTrigger className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Você receberá até {maxClose} lembretes para fechar o caixa antes do horário de encerramento.
            </p>
          </div>
        )}
      </div>

      {/* Respeitar dias fechados */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Respeitar dias fechados</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Não enviar lembretes nos dias em que o restaurante está fechado
            </p>
          </div>
          <Switch
            checked={respectClosed}
            onCheckedChange={(v) => { setRespectClosed(v); markChanged(); }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Os lembretes são baseados no horário de funcionamento configurado nas suas configurações.
          Certifique-se de que os horários estão corretos para receber os lembretes nos momentos certos.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
