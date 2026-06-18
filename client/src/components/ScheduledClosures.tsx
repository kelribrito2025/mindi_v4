import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CalendarOff,
  Plus,
  Trash2,
  Calendar,
  Repeat,
  Info,
  CalendarX,
  Loader2,
} from "lucide-react";
import { DatePicker } from "@/components/DatePicker";

// Mapa de regras recorrentes para exibição
const RECURRING_RULES = [
  { value: "last_sunday", label: "Último domingo do mês", shortLabel: "Últ. Domingo" },
  { value: "last_saturday", label: "Último sábado do mês", shortLabel: "Últ. Sábado" },
  { value: "last_friday", label: "Última sexta-feira do mês", shortLabel: "Últ. Sexta" },
  { value: "last_monday", label: "Última segunda-feira do mês", shortLabel: "Últ. Segunda" },
  { value: "first_sunday", label: "Primeiro domingo do mês", shortLabel: "1o Domingo" },
  { value: "first_saturday", label: "Primeiro sábado do mês", shortLabel: "1o Sábado" },
  { value: "first_monday", label: "Primeira segunda-feira do mês", shortLabel: "1a Segunda" },
  { value: "every_sunday", label: "Todo domingo", shortLabel: "Todo Domingo" },
  { value: "every_monday", label: "Toda segunda-feira", shortLabel: "Toda Segunda" },
  { value: "every_tuesday", label: "Toda terça-feira", shortLabel: "Toda Terça" },
  { value: "every_wednesday", label: "Toda quarta-feira", shortLabel: "Toda Quarta" },
  { value: "every_thursday", label: "Toda quinta-feira", shortLabel: "Toda Quinta" },
  { value: "every_friday", label: "Toda sexta-feira", shortLabel: "Toda Sexta" },
  { value: "every_saturday", label: "Todo sábado", shortLabel: "Todo Sábado" },
];

function getRuleLabel(rule: string): string {
  return RECURRING_RULES.find(r => r.value === rule)?.label || rule;
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "";
  const d = typeof dateStr === "string" ? new Date(dateStr + "T12:00:00") : dateStr;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ScheduledClosures() {
  const utils = trpc.useUtils();
  const { data: closures, isLoading } = trpc.scheduledClosures.list.useQuery();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<"specific_date" | "recurring">("specific_date");
  const [addDate, setAddDate] = useState("");
  const [addRule, setAddRule] = useState("last_sunday");
  const [addReason, setAddReason] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.scheduledClosures.create.useMutation({
    onSuccess: () => {
      toast.success("Fechamento programado adicionado!");
      utils.scheduledClosures.list.invalidate();
      setShowAddDialog(false);
      setAddDate("");
      setAddReason("");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.scheduledClosures.update.useMutation({
    onSuccess: () => {
      utils.scheduledClosures.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.scheduledClosures.delete.useMutation({
    onSuccess: () => {
      toast.success("Fechamento removido!");
      utils.scheduledClosures.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = () => {
    if (addType === "specific_date" && !addDate) {
      toast.error("Selecione uma data");
      return;
    }
    createMutation.mutate({
      type: addType,
      specificDate: addType === "specific_date" ? addDate : undefined,
      recurringRule: addType === "recurring" ? addRule : undefined,
      reason: addReason || undefined,
    });
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    updateMutation.mutate({ id, isActive: !currentActive });
  };

  const specificDateClosures = closures?.filter(c => c.type === "specific_date") || [];
  const recurringClosures = closures?.filter(c => c.type === "recurring") || [];

  return (
    <SectionCard 
      title="Fechamentos programados" 
      description="Programe datas e regras de fechamento automático" 
      icon={<CalendarOff className="h-5 w-5 text-red-500 dark:text-red-400" />} 
      iconBg="bg-red-100 dark:bg-red-500/15"
    >
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Configure datas específicas ou regras recorrentes para fechar automaticamente o estabelecimento.
          </p>
        </div>

        {/* Botão adicionar */}
        <Button 
          onClick={() => setShowAddDialog(true)} 
          variant="outline" 
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar fechamento
        </Button>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && closures?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarX className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum fechamento programado</p>
            <p className="text-xs mt-1">Clique em "Adicionar fechamento" para começar</p>
          </div>
        )}

        {/* Regras recorrentes */}
        {recurringClosures.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-foreground">Regras recorrentes</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">{recurringClosures.length}</span>
            </div>
            {recurringClosures.map((closure) => (
              <div
                key={closure.id}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
                  closure.isActive
                    ? "border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5"
                    : "border-border/40 bg-muted/20 opacity-60"
                )}
              >
                <Switch
                  checked={closure.isActive}
                  onCheckedChange={() => toggleActive(closure.id, closure.isActive)}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", closure.isActive ? "text-foreground" : "text-muted-foreground")}>
                    {getRuleLabel(closure.recurringRule || "")}
                  </p>
                  {closure.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{closure.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => setDeleteId(closure.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Datas específicas */}
        {specificDateClosures.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-foreground">Datas específicas</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">{specificDateClosures.length}</span>
            </div>
            {specificDateClosures.map((closure) => (
              <div
                key={closure.id}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
                  closure.isActive
                    ? "border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5"
                    : "border-border/40 bg-muted/20 opacity-60"
                )}
              >
                <Switch
                  checked={closure.isActive}
                  onCheckedChange={() => toggleActive(closure.id, closure.isActive)}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", closure.isActive ? "text-foreground" : "text-muted-foreground")}>
                    {formatDate(closure.specificDate)}
                  </p>
                  {closure.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{closure.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => setDeleteId(closure.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de adicionar */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar fechamento</DialogTitle>
            <DialogDescription>
              Escolha entre uma data específica ou uma regra recorrente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAddType("specific_date")}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-colors",
                  addType === "specific_date"
                    ? "border-primary bg-primary/5"
                    : "border-border/40 hover:border-border"
                )}
              >
                <Calendar className={cn("h-4 w-4", addType === "specific_date" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", addType === "specific_date" ? "text-primary" : "text-muted-foreground")}>
                  Data específica
                </span>
              </button>
              <button
                onClick={() => setAddType("recurring")}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-colors",
                  addType === "recurring"
                    ? "border-primary bg-primary/5"
                    : "border-border/40 hover:border-border"
                )}
              >
                <Repeat className={cn("h-4 w-4", addType === "recurring" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", addType === "recurring" ? "text-primary" : "text-muted-foreground")}>
                  Regra recorrente
                </span>
              </button>
            </div>

            {/* Campos específicos */}
            {addType === "specific_date" && (
              <div className="space-y-2">
                <Label>Data do fechamento</Label>
                <DatePicker
                  value={addDate}
                  onChange={(date) => setAddDate(date)}
                  minDate={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}

            {addType === "recurring" && (
              <div className="space-y-2">
                <Label>Regra de fechamento</Label>
                <select
                  value={addRule}
                  onChange={(e) => setAddRule(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <optgroup label="Último do mês">
                    {RECURRING_RULES.filter(r => r.value.startsWith("last_")).map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Primeiro do mês">
                    {RECURRING_RULES.filter(r => r.value.startsWith("first_")).map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Toda semana">
                    {RECURRING_RULES.filter(r => r.value.startsWith("every_")).map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Feriado municipal, Reforma, Inventário..."
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert de confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover fechamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fechamento programado será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-500"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
