import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard } from "@/components/shared";
import { MobileExpandableText } from "@/components/MobileExpandableText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  Plus,
  Search,
  GripVertical,
  Trash2,
  MoreVertical,
  ArrowRight,
  Link2,
  Layers,
  UtensilsCrossed,
  Eye,
  X,
  Star,
  ShoppingCart,
  Package,
  Info,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  Loader2,
  Check,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// ==================== TYPES ====================

interface TimeSchedule {
  enabled: boolean;
  days: number[]; // 0=Dom, 1=Seg, ..., 6=Sab
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  label?: string; // ex: "Almoço", "Happy Hour"
}

// ==================== HELPERS ====================

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatScheduleLabel(schedule?: TimeSchedule): string | null {
  if (!schedule?.enabled) return null;
  const days = schedule.days.sort();
  let dayStr = "";
  if (days.length === 7) {
    dayStr = "Todos os dias";
  } else if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
    dayStr = "Seg–Sex";
  } else if (days.length === 2 && days.includes(5) && days.includes(6)) {
    dayStr = "Sex–Sáb";
  } else if (days.length === 2 && days.includes(0) && days.includes(6)) {
    dayStr = "Sáb–Dom";
  } else {
    dayStr = days.map((d) => DAY_LABELS[d]).join(", ");
  }
  return `${dayStr} · ${schedule.startTime}–${schedule.endTime}`;
}

function dbToSchedule(row: any): TimeSchedule | undefined {
  if (!row.scheduleEnabled) return undefined;
  return {
    enabled: true,
    days: row.scheduleDays || [],
    startTime: row.scheduleStartTime || "00:00",
    endTime: row.scheduleEndTime || "23:59",
    label: row.scheduleLabel || undefined,
  };
}

// ==================== SCHEDULE EDITOR ====================

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: TimeSchedule;
  onChange: (s: TimeSchedule) => void;
}) {
  const presets = [
    { label: "Almoço", days: [1, 2, 3, 4, 5], start: "11:00", end: "14:00" },
    { label: "Jantar", days: [0, 1, 2, 3, 4, 5, 6], start: "18:00", end: "23:00" },
    { label: "Happy Hour", days: [5, 6], start: "17:00", end: "23:59" },
    { label: "Fim de semana", days: [0, 6], start: "11:00", end: "23:00" },
    { label: "Noite Sex/Sáb", days: [5, 6], start: "18:00", end: "23:59" },
  ];

  return (
    <div className="space-y-3">
      {/* Quick presets */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Presets rápidos</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const isSelected =
              schedule.label === preset.label ||
              (JSON.stringify(schedule.days.sort()) === JSON.stringify(preset.days.sort()) &&
                schedule.startTime === preset.start &&
                schedule.endTime === preset.end);
            return (
              <button
                key={preset.label}
                onClick={() =>
                  onChange({
                    ...schedule,
                    days: preset.days,
                    startTime: preset.start,
                    endTime: preset.end,
                    label: preset.label,
                  })
                }
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                  isSelected
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day selector */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Dias da semana</p>
        <div className="flex gap-1">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              onClick={() => {
                const newDays = schedule.days.includes(idx)
                  ? schedule.days.filter((d) => d !== idx)
                  : [...schedule.days, idx];
                onChange({ ...schedule, days: newDays, label: undefined });
              }}
              className={cn(
                "h-8 w-8 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center",
                schedule.days.includes(idx)
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              )}
            >
              {DAY_LABELS_SHORT[idx]}
            </button>
          ))}
        </div>
      </div>

      {/* Time range */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Início</p>
          <Input
            type="time"
            value={schedule.startTime}
            onChange={(e) => onChange({ ...schedule, startTime: e.target.value, label: undefined })}
            className="h-9 text-sm"
          />
        </div>
        <span className="text-muted-foreground mt-5">–</span>
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Fim</p>
          <Input
            type="time"
            value={schedule.endTime}
            onChange={(e) => onChange({ ...schedule, endTime: e.target.value, label: undefined })}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ==================== SCHEDULE MODAL ====================

function ScheduleModal({
  open,
  onClose,
  schedule,
  onSave,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  schedule?: TimeSchedule;
  onSave: (schedule: TimeSchedule) => void;
  itemName: string;
}) {
  const [localSchedule, setLocalSchedule] = useState<TimeSchedule>(
    schedule || {
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      startTime: "00:00",
      endTime: "23:59",
    }
  );

  // Reset when modal opens with new data
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    const s = schedule || { enabled: true, days: [0, 1, 2, 3, 4, 5, 6], startTime: "00:00", endTime: "23:59" };
    if (JSON.stringify(s) !== JSON.stringify(localSchedule)) {
      setLocalSchedule(s);
    }
  }
  if (open !== prevOpen) setPrevOpen(open);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[371px] p-0 overflow-hidden flex flex-col" hideCloseButton>
        <VisuallyHidden><SheetTitle>Regra de horário</SheetTitle></VisuallyHidden>
        <VisuallyHidden><SheetDescription>Defina quando a sugestão será exibida</SheetDescription></VisuallyHidden>

        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Regra de horário</h2>
                <p className="text-sm text-white/80 truncate max-w-[200px]">{itemName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors sm:hidden"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
          {/* Enable/disable */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
            <div>
              <p className="text-sm font-medium">Restringir horário</p>
              <p className="text-xs text-muted-foreground">Quando desativado, a sugestão aparece sempre</p>
            </div>
            <Switch
              checked={localSchedule.enabled}
              onCheckedChange={(checked) => setLocalSchedule((s) => ({ ...s, enabled: checked }))}
            />
          </div>

          {localSchedule.enabled && (
            <ScheduleEditor schedule={localSchedule} onChange={setLocalSchedule} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(localSchedule);
              onClose();
            }}
            className="flex-1 bg-red-500 hover:bg-red-500 text-white"
          >
            <Clock className="h-4 w-4 mr-1.5" />
            Salvar horário
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== FIXED SUGGESTION SCOPE MODAL ====================

function FixedSuggestionScopeModal({
  open,
  onClose,
  establishmentId,
  suggestion,
}: {
  open: boolean;
  onClose: () => void;
  establishmentId: number;
  suggestion: any | null;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open && suggestion) {
      setSelectedIds((suggestion.categoryScopes || []).map((scope: any) => scope.categoryId));
      setSearch("");
    }
  }, [open, suggestion?.id]);

  const { data: scopeCategories = [], isLoading } = trpc.suggestions.availableScopeCategories.useQuery(
    { establishmentId, search: search || undefined },
    { enabled: open && !!establishmentId }
  );

  const setScopesMutation = trpc.suggestions.setCategoryScopes.useMutation({
    onSuccess: () => utils.suggestions.listFixed.invalidate(),
  });

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    (suggestion?.categoryScopes || []).forEach((scope: any) => map.set(scope.categoryId, scope.categoryName));
    (scopeCategories || []).forEach((category: any) => map.set(category.id, category.name));
    return map;
  }, [suggestion, scopeCategories]);

  const toggleCategory = (categoryId: number) => {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const handleSave = async () => {
    if (!suggestion) return;
    try {
      await setScopesMutation.mutateAsync({
        id: suggestion.id,
        establishmentId,
        categoryIds: selectedIds,
      });
      toast.success(
        selectedIds.length === 0
          ? "Sugestão fixa mantida como global"
          : `Sugestão fixa limitada a ${selectedIds.length} categoria(s)`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar categorias de exibição");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 overflow-hidden flex flex-col" hideCloseButton>
        <VisuallyHidden><SheetTitle>Categorias de exibição</SheetTitle></VisuallyHidden>
        <VisuallyHidden><SheetDescription>Defina em quais categorias do carrinho a sugestão fixa pode aparecer</SheetDescription></VisuallyHidden>

        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Categorias de exibição</h2>
                <p className="text-sm text-white/80 truncate max-w-[260px]">{suggestion?.name || "Sugestão fixa"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors sm:hidden"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold">Escopo opcional por categoria</p>
            <p className="mt-1 text-xs leading-relaxed">
              Se nenhuma categoria for marcada, a sugestão permanece global e continua aparecendo como antes. Ao marcar categorias, ela só aparecerá quando o carrinho tiver item de pelo menos uma delas.
            </p>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left",
              selectedIds.length === 0
                ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                : "border-border hover:border-muted-foreground/30 bg-card"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              selectedIds.length === 0 ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Global</p>
              <p className="text-xs text-muted-foreground">Exibir para qualquer carrinho</p>
            </div>
            {selectedIds.length === 0 && <Check className="h-5 w-5 text-red-500" />}
          </button>

          {selectedIds.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Selecionadas</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedIds.map((categoryId) => (
                  <span
                    key={categoryId}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-red-50 text-xs font-medium text-red-700 border border-red-200"
                  >
                    {categoryNameById.get(categoryId) || `Categoria #${categoryId}`}
                    <button
                      onClick={() => toggleCategory(categoryId)}
                      className="p-0.5 rounded hover:bg-red-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          <div className="border border-border/50 rounded-xl divide-y divide-border/40 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : scopeCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="p-3 bg-muted/50 rounded-full mb-3">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">Nenhuma categoria encontrada</p>
              </div>
            ) : (
              scopeCategories.map((category: any) => {
                const selected = selectedIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      selected ? "bg-red-500 text-white" : "bg-purple-100 text-purple-600"
                    )}>
                      {selected ? <Check className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground">Usar como condição do carrinho</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-card flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-red-500 hover:bg-red-500 text-white"
            disabled={setScopesMutation.isPending || !suggestion}
          >
            {setScopesMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-1.5" />
            )}
            Salvar escopo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== SCHEDULE BADGE ====================

function ScheduleBadge({ schedule, onClick }: { schedule?: TimeSchedule; onClick?: () => void }) {
  if (!schedule?.enabled) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/30 hover:bg-muted/60 transition-colors cursor-pointer"
      >
        <Clock className="h-3 w-3" />
        Sempre
      </button>
    );
  }

  const label = schedule.label || formatScheduleLabel(schedule);
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 hover:bg-amber-100 transition-colors cursor-pointer"
    >
      <Clock className="h-3 w-3" />
      {label}
    </button>
  );
}

// ==================== FIXED SUGGESTION ROW ====================

function FixedSuggestionRow({
  suggestion,
  onToggle,
  onRemove,
  onSchedule,
  onScope,
  isToggling,
}: {
  suggestion: any;
  onToggle: (id: number, isActive: boolean) => void;
  onRemove: (id: number) => void;
  onSchedule: (id: number) => void;
  onScope: (id: number) => void;
  isToggling: boolean;
}) {
  const schedule = dbToSchedule(suggestion);
  const isProduct = suggestion.type === "product";
  const categoryScopes = suggestion.categoryScopes || [];
  const scopeLabel = categoryScopes.length === 0
    ? "Global"
    : categoryScopes.length === 1
      ? categoryScopes[0].categoryName
      : `${categoryScopes.length} categorias`;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/20 group",
        !suggestion.isActive && "opacity-60"
      )}
    >
      {/* Drag handle */}
      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />

      {/* Icon */}
      <div
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
          isProduct ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
        )}
      >
        {isProduct && suggestion.image ? (
          <img loading="lazy" src={suggestion.image} alt="" className="h-10 w-10 object-cover" />
        ) : isProduct ? (
          <UtensilsCrossed className="h-4.5 w-4.5" />
        ) : (
          <Layers className="h-4.5 w-4.5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{suggestion.name}</p>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] shrink-0",
              isProduct
                ? "border-blue-200 text-blue-600 bg-blue-50"
                : "border-purple-200 text-purple-600 bg-purple-50"
            )}
          >
            {isProduct ? "Item" : "Categoria"}
          </Badge>
          <ScheduleBadge schedule={schedule} onClick={() => onSchedule(suggestion.id)} />
          <button
            onClick={() => onScope(suggestion.id)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
              categoryScopes.length === 0
                ? "text-muted-foreground bg-muted/40 border-border/30 hover:bg-muted/60"
                : "text-red-600 bg-red-50 border-red-200/70 hover:bg-red-100"
            )}
            title={categoryScopes.length === 0 ? "Exibida para qualquer carrinho" : `Exibida para: ${categoryScopes.map((scope: any) => scope.categoryName).join(', ')}`}
          >
            <Eye className="h-3 w-3" />
            {scopeLabel}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isProduct
            ? `${suggestion.categoryName || "Sem categoria"} · ${suggestion.price ? formatCurrency(Number(suggestion.price)) : ""}`
            : `${suggestion.activeProductCount || 0} produtos ativos`}
        </p>
      </div>

      {/* Toggle */}
      <Switch
        checked={suggestion.isActive}
        onCheckedChange={(checked) => onToggle(suggestion.id, checked)}
        disabled={isToggling}
      />

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onSchedule(suggestion.id)}>
            <Clock className="h-4 w-4 mr-2" />
            Regra de horário
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onScope(suggestion.id)}>
            <Eye className="h-4 w-4 mr-2" />
            Categorias de exibição
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onRemove(suggestion.id)}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover sugestão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ==================== LINKED SUGGESTION ROW ====================

function LinkedSuggestionRow({
  linked,
  onToggle,
  onRemove,
  onEdit,
  onSchedule,
  isToggling,
}: {
  linked: any;
  onToggle: (id: number, isActive: boolean) => void;
  onRemove: (id: number) => void;
  onEdit: (id: number) => void;
  onSchedule: (id: number) => void;
  isToggling: boolean;
}) {
  const schedule = dbToSchedule(linked);

  return (
    <div
      className={cn(
        "border border-border/50 rounded-xl p-4 transition-[colors,box-shadow] hover:shadow-sm group",
        !linked.isActive && "opacity-60"
      )}
    >
      {/* Header: Trigger → Suggestions */}
      <div className="flex items-start gap-3">
        {/* Trigger product */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 text-amber-600 shrink-0 overflow-hidden">
            {linked.triggerProduct?.images?.[0] ? (
              <img loading="lazy" src={linked.triggerProduct.images[0]} alt="" className="h-10 w-10 object-cover" />
            ) : (
              <ShoppingCart className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Quando pedir</p>
            <p className="font-semibold text-sm truncate">{linked.triggerProduct?.name}</p>
            <p className="text-xs text-muted-foreground">{linked.triggerProduct?.categoryName || "Sem categoria"}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center h-10 w-10 shrink-0 self-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
        </div>

        {/* Suggested products */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Sugerir</p>
          <div className="flex flex-wrap gap-1.5">
            {linked.suggestedProducts?.map((product: any) => (
              <Tooltip key={product.itemId || product.id}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 text-xs font-medium text-foreground/80 border border-border/30 hover:bg-muted transition-colors cursor-default">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    {product.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{product.categoryName || "Sem categoria"} · {product.price ? formatCurrency(Number(product.price)) : ""}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          <Switch
            checked={linked.isActive}
            onCheckedChange={(checked) => onToggle(linked.id, checked)}
            disabled={isToggling}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onSchedule(linked.id)}>
                <Clock className="h-4 w-4 mr-2" />
                Regra de horário
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(linked.id)}>
                <Link2 className="h-4 w-4 mr-2" />
                Editar vínculo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(linked.id)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover vínculo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Schedule badge row */}
      {schedule?.enabled && (
        <div className="mt-2.5 pt-2.5 border-t border-border/30">
          <ScheduleBadge schedule={schedule} onClick={() => onSchedule(linked.id)} />
        </div>
      )}
    </div>
  );
}

// ==================== ADD FIXED SUGGESTION MODAL ====================

function AddFixedSuggestionModal({
  open,
  onClose,
  establishmentId,
}: {
  open: boolean;
  onClose: () => void;
  establishmentId: number;
}) {
  const [mode, setMode] = useState<"item" | "category">("item");
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: availableProducts = [], isLoading: productsLoading } = trpc.suggestions.availableProducts.useQuery(
    { establishmentId, search: search || undefined },
    { enabled: open && mode === "item" }
  );

  const { data: availableCategories = [], isLoading: categoriesLoading } = trpc.suggestions.availableCategories.useQuery(
    { establishmentId, search: search || undefined },
    { enabled: open && mode === "category" }
  );

  const addMutation = trpc.suggestions.addFixed.useMutation({
    onSuccess: () => {
      utils.suggestions.listFixed.invalidate();
      utils.suggestions.availableProducts.invalidate();
      utils.suggestions.availableCategories.invalidate();
    },
  });

  const handleAdd = async (type: "product" | "category", id: number, name: string) => {
    try {
      await addMutation.mutateAsync({
        establishmentId,
        type,
        ...(type === "product" ? { productId: id } : { categoryId: id }),
      });
      toast.success(`"${name}" adicionado como sugestão fixa`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar sugestão");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[371px] p-0 overflow-hidden flex flex-col" hideCloseButton>
        <VisuallyHidden><SheetTitle>Adicionar sugestão fixa</SheetTitle></VisuallyHidden>
        <VisuallyHidden><SheetDescription>Escolha um item ou categoria para sugerir sempre</SheetDescription></VisuallyHidden>

        {/* Header - estilo PDV Dados da Entrega */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Adicionar sugestão fixa</h2>
                <p className="text-sm text-white/80">Escolha um item ou categoria</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors sm:hidden"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
          {/* Mode selector */}
          <div className="space-y-2">
            <button
              onClick={() => { setMode("item"); setSearch(""); }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                mode === "item"
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                  : "border-border hover:border-muted-foreground/30 bg-card"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                mode === "item" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "font-medium",
                  mode === "item" ? "text-red-500 dark:text-red-400" : "text-foreground"
                )}>Item específico</p>
                <p className="text-xs text-muted-foreground">Sugerir um produto individual</p>
              </div>
              {mode === "item" && (
                <Check className="h-5 w-5 text-red-500" />
              )}
            </button>
            <button
              onClick={() => { setMode("category"); setSearch(""); }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                mode === "category"
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                  : "border-border hover:border-muted-foreground/30 bg-card"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                mode === "category" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "font-medium",
                  mode === "category" ? "text-red-500 dark:text-red-400" : "text-foreground"
                )}>Categoria inteira</p>
                <p className="text-xs text-muted-foreground">Sugerir todos os itens da categoria</p>
              </div>
              {mode === "category" && (
                <Check className="h-5 w-5 text-red-500" />
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={mode === "item" ? "Buscar produto..." : "Buscar categoria..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          {/* List */}
          <div className="border border-border/50 rounded-xl divide-y divide-border/40 overflow-hidden">
            {mode === "item" ? (
              productsLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <div className="p-3 bg-muted/50 rounded-full mb-3">
                    <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Nenhum produto encontrado</p>
                </div>
              ) : (
                availableProducts.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => handleAdd("product", product.id, product.name)}
                    disabled={addMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                      {product.images?.[0] ? (
                        <img loading="lazy" src={product.images[0]} alt="" className="h-10 w-10 object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.categoryName || "Sem categoria"}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {product.price ? formatCurrency(Number(product.price)) : ""}
                    </span>
                  </button>
                ))
              )
            ) : (
              categoriesLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <div className="p-3 bg-muted/50 rounded-full mb-3">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Nenhuma categoria encontrada</p>
                </div>
              ) : (
                availableCategories.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => handleAdd("category", category.id, category.name)}
                    disabled={addMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.activeProductCount} produtos</p>
                    </div>
                    {category.activeProductCount > 9 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 bg-amber-50">
                            Limite 9
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Apenas os 9 primeiros produtos serão exibidos como sugestão</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </button>
                ))
              )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== ADD LINKED SUGGESTION MODAL ====================

function AddLinkedSuggestionModal({
  open,
  onClose,
  establishmentId,
}: {
  open: boolean;
  onClose: () => void;
  establishmentId: number;
}) {
  const [triggerSearch, setTriggerSearch] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [selectedSuggested, setSelectedSuggested] = useState<any[]>([]);
  const utils = trpc.useUtils();

  // Search trigger products
  const { data: triggerProducts = [], isLoading: triggerLoading } = trpc.suggestions.availableLinkedProducts.useQuery(
    { establishmentId, search: triggerSearch || undefined, excludeProductIds: [] },
    { enabled: open && !selectedTrigger && triggerSearch.length > 0 }
  );

  // Search suggested products (exclude trigger and already selected)
  const excludeIds = useMemo(() => {
    const ids = selectedSuggested.map((p) => p.id);
    if (selectedTrigger) ids.push(selectedTrigger.id);
    return ids;
  }, [selectedTrigger, selectedSuggested]);

  const { data: suggestedProducts = [], isLoading: suggestedLoading } = trpc.suggestions.availableLinkedProducts.useQuery(
    { establishmentId, search: suggestedSearch || undefined, excludeProductIds: excludeIds },
    { enabled: open && !!selectedTrigger && suggestedSearch.length > 0 }
  );

  const addLinkedMutation = trpc.suggestions.addLinked.useMutation({
    onSuccess: () => {
      utils.suggestions.listLinked.invalidate();
    },
  });

  const handleSave = async () => {
    if (!selectedTrigger) {
      toast.error("Selecione o produto gatilho");
      return;
    }
    if (selectedSuggested.length === 0) {
      toast.error("Selecione pelo menos um produto para sugerir");
      return;
    }
    try {
      await addLinkedMutation.mutateAsync({
        establishmentId,
        triggerProductId: selectedTrigger.id,
        suggestedProductIds: selectedSuggested.map((p) => p.id),
      });
      toast.success(`Sugestão vinculada criada: "${selectedTrigger.name}" → ${selectedSuggested.length} produto(s)`);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar sugestão vinculada");
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedTrigger(null);
    setSelectedSuggested([]);
    setTriggerSearch("");
    setSuggestedSearch("");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 overflow-hidden flex flex-col" hideCloseButton>
        <VisuallyHidden><SheetTitle>Nova sugestão vinculada</SheetTitle></VisuallyHidden>
        <VisuallyHidden><SheetDescription>Vincule produtos para sugestão automática</SheetDescription></VisuallyHidden>

        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nova sugestão vinculada</h2>
                <p className="text-sm text-white/80">Vincule produtos para sugestão</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors sm:hidden"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
          {/* Step 1: Trigger product */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Produto gatilho
              <span className="text-muted-foreground font-normal ml-1">(quando o cliente pedir...)</span>
            </label>
            {selectedTrigger ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/30">
                <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedTrigger.images?.[0] ? (
                    <img loading="lazy" src={selectedTrigger.images[0]} alt="" className="h-10 w-10 object-cover" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedTrigger.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTrigger.categoryName || "Sem categoria"}</p>
                </div>
                <button
                  onClick={() => setSelectedTrigger(null)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto gatilho..."
                    value={triggerSearch}
                    onChange={(e) => setTriggerSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
                {triggerSearch && (
                  <div className="max-h-48 overflow-y-auto border border-border/50 rounded-xl divide-y divide-border/40">
                    {triggerLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : triggerProducts.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">Nenhum produto encontrado</p>
                    ) : (
                      triggerProducts.map((product: any) => (
                        <button
                          key={product.id}
                          onClick={() => { setSelectedTrigger(product); setTriggerSearch(""); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 overflow-hidden">
                            {product.images?.[0] ? (
                              <img loading="lazy" src={product.images[0]} alt="" className="h-8 w-8 object-cover" />
                            ) : (
                              <ShoppingCart className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.categoryName || "Sem categoria"}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {product.price ? formatCurrency(Number(product.price)) : ""}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>
          </div>

          {/* Step 2: Suggested products */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Produtos sugeridos
              <span className="text-muted-foreground font-normal ml-1">(sugerir...)</span>
            </label>

            {/* Selected chips */}
            {selectedSuggested.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedSuggested.map((product) => (
                  <span
                    key={product.id}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-green-50 text-xs font-medium text-green-700 border border-green-200"
                  >
                    {product.name}
                    <button
                      onClick={() => setSelectedSuggested((prev) => prev.filter((p) => p.id !== product.id))}
                      className="p-0.5 rounded hover:bg-green-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos para sugerir..."
                value={suggestedSearch}
                onChange={(e) => setSuggestedSearch(e.target.value)}
                className="pl-9 rounded-xl"
                disabled={!selectedTrigger}
              />
            </div>
            {suggestedSearch && selectedTrigger && (
              <div className="max-h-48 overflow-y-auto border border-border/50 rounded-xl divide-y divide-border/40 mt-2">
                {suggestedLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : suggestedProducts.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground text-center">Nenhum produto encontrado</p>
                ) : (
                  suggestedProducts.map((product: any) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedSuggested((prev) => [...prev, product]);
                        setSuggestedSearch("");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img loading="lazy" src={product.images[0]} alt="" className="h-8 w-8 object-cover" />
                        ) : (
                          <Package className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.categoryName || "Sem categoria"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {product.price ? formatCurrency(Number(product.price)) : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-red-500 hover:bg-red-500 text-white"
            disabled={!selectedTrigger || selectedSuggested.length === 0 || addLinkedMutation.isPending}
          >
            {addLinkedMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-1.5" />
            )}
            Criar vínculo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== EDIT LINKED SUGGESTION MODAL ====================

function EditLinkedSuggestionModal({
  open,
  onClose,
  establishmentId,
  linkedSuggestion,
}: {
  open: boolean;
  onClose: () => void;
  establishmentId: number;
  linkedSuggestion: any;
}) {
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [selectedSuggested, setSelectedSuggested] = useState<any[]>([]);
  const utils = trpc.useUtils();

  // Initialize with existing suggested products
  useEffect(() => {
    if (open && linkedSuggestion?.suggestedProducts) {
      setSelectedSuggested(linkedSuggestion.suggestedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        categoryName: p.categoryName,
        images: p.images,
      })));
    }
  }, [open, linkedSuggestion]);

  const excludeIds = useMemo(() => {
    const ids = selectedSuggested.map((p) => p.id);
    if (linkedSuggestion?.triggerProduct?.id) ids.push(linkedSuggestion.triggerProduct.id);
    return ids;
  }, [selectedSuggested, linkedSuggestion]);

  const { data: suggestedProducts = [], isLoading: suggestedLoading } = trpc.suggestions.availableLinkedProducts.useQuery(
    { establishmentId, search: suggestedSearch || undefined, excludeProductIds: excludeIds },
    { enabled: open && suggestedSearch.length > 0 }
  );

  const updateItemsMutation = trpc.suggestions.updateLinkedItems.useMutation({
    onSuccess: () => {
      utils.suggestions.listLinked.invalidate();
    },
  });

  const handleSave = async () => {
    if (selectedSuggested.length === 0) {
      toast.error("Selecione pelo menos um produto para sugerir");
      return;
    }
    try {
      await updateItemsMutation.mutateAsync({
        id: linkedSuggestion.id,
        establishmentId,
        suggestedProductIds: selectedSuggested.map((p) => p.id),
      });
      toast.success("Vínculo atualizado com sucesso");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar vínculo");
    }
  };

  if (!linkedSuggestion) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 overflow-hidden flex flex-col" hideCloseButton>
        <VisuallyHidden><SheetTitle>Editar vínculo</SheetTitle></VisuallyHidden>
        <VisuallyHidden><SheetDescription>Edite os produtos sugeridos</SheetDescription></VisuallyHidden>

        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Editar vínculo</h2>
                <p className="text-sm text-white/80">Altere os produtos sugeridos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors sm:hidden"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
          {/* Trigger (read-only) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Produto gatilho</label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/30">
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 overflow-hidden">
                {linkedSuggestion.triggerProduct?.images?.[0] ? (
                  <img loading="lazy" src={linkedSuggestion.triggerProduct.images[0]} alt="" className="h-10 w-10 object-cover" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{linkedSuggestion.triggerProduct?.name}</p>
                <p className="text-xs text-muted-foreground">{linkedSuggestion.triggerProduct?.categoryName || "Sem categoria"}</p>
              </div>
            </div>
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>
          </div>

          {/* Suggested products */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Produtos sugeridos</label>

            {selectedSuggested.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedSuggested.map((product) => (
                  <span
                    key={product.id}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-green-50 text-xs font-medium text-green-700 border border-green-200"
                  >
                    {product.name}
                    <button
                      onClick={() => setSelectedSuggested((prev) => prev.filter((p) => p.id !== product.id))}
                      className="p-0.5 rounded hover:bg-green-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos para adicionar..."
                value={suggestedSearch}
                onChange={(e) => setSuggestedSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            {suggestedSearch && (
              <div className="max-h-48 overflow-y-auto border border-border/50 rounded-xl divide-y divide-border/40 mt-2">
                {suggestedLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : suggestedProducts.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground text-center">Nenhum produto encontrado</p>
                ) : (
                  suggestedProducts.map((product: any) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedSuggested((prev) => [...prev, product]);
                        setSuggestedSearch("");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img loading="lazy" src={product.images[0]} alt="" className="h-8 w-8 object-cover" />
                        ) : (
                          <Package className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.categoryName || "Sem categoria"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {product.price ? formatCurrency(Number(product.price)) : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-red-500 hover:bg-red-500 text-white"
            disabled={selectedSuggested.length === 0 || updateItemsMutation.isPending}
          >
            {updateItemsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-1.5" />
            )}
            Salvar alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== MAIN PAGE ====================

export default function Sugestoes() {
  const [activeTab, setActiveTab] = useState("fixed");
  const [addFixedOpen, setAddFixedOpen] = useState(false);
  const [addLinkedOpen, setAddLinkedOpen] = useState(false);
  const [editLinkedOpen, setEditLinkedOpen] = useState(false);
  const [editLinkedTarget, setEditLinkedTarget] = useState<any>(null);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [scopeTarget, setScopeTarget] = useState<any>(null);
  const [searchFixed, setSearchFixed] = useState("");
  const [searchLinked, setSearchLinked] = useState("");

  // Get establishment
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;

  // Fetch fixed suggestions from backend
  const { data: fixedSuggestions = [], isLoading: fixedLoading } = trpc.suggestions.listFixed.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Fetch linked suggestions from backend
  const { data: linkedSuggestions = [], isLoading: linkedLoading } = trpc.suggestions.listLinked.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Fetch suggestion revenue from backend
  const { data: revenueData, isLoading: revenueLoading } = trpc.suggestions.getRevenue.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Fetch dashboard stats for ticket médio (reaproveitando mesmos dados da Dashboard)
  const { data: dashStats, isLoading: dashStatsLoading } = trpc.dashboard.stats.useQuery(
    { establishmentId: establishmentId!, period: 'week' },
    { enabled: !!establishmentId }
  );

  const utils = trpc.useUtils();

  // Fixed mutations
  const toggleFixedMutation = trpc.suggestions.toggleFixed.useMutation({
    onSuccess: () => utils.suggestions.listFixed.invalidate(),
  });

  const removeFixedMutation = trpc.suggestions.removeFixed.useMutation({
    onSuccess: () => {
      utils.suggestions.listFixed.invalidate();
      utils.suggestions.availableProducts.invalidate();
      utils.suggestions.availableCategories.invalidate();
    },
  });

  const updateScheduleMutation = trpc.suggestions.updateSchedule.useMutation({
    onSuccess: () => utils.suggestions.listFixed.invalidate(),
  });

  // Linked mutations
  const toggleLinkedMutation = trpc.suggestions.toggleLinked.useMutation({
    onSuccess: () => utils.suggestions.listLinked.invalidate(),
  });

  const removeLinkedMutation = trpc.suggestions.removeLinked.useMutation({
    onSuccess: () => utils.suggestions.listLinked.invalidate(),
  });

  const updateLinkedScheduleMutation = trpc.suggestions.updateLinkedSchedule.useMutation({
    onSuccess: () => utils.suggestions.listLinked.invalidate(),
  });

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<{ type: "fixed" | "linked"; id: number; name: string; schedule?: TimeSchedule } | null>(null);

  // Filter fixed suggestions
  const filteredFixed = useMemo(() => {
    if (!searchFixed) return fixedSuggestions;
    return fixedSuggestions.filter((s: any) =>
      s.name?.toLowerCase().includes(searchFixed.toLowerCase())
    );
  }, [fixedSuggestions, searchFixed]);

  // Filter linked suggestions
  const filteredLinked = useMemo(() => {
    if (!searchLinked) return linkedSuggestions;
    return linkedSuggestions.filter((l: any) =>
      l.triggerProduct?.name?.toLowerCase().includes(searchLinked.toLowerCase()) ||
      l.suggestedProducts?.some((p: any) => p.name?.toLowerCase().includes(searchLinked.toLowerCase()))
    );
  }, [linkedSuggestions, searchLinked]);

  const fixedActiveCount = fixedSuggestions.filter((s: any) => s.isActive).length;
  const linkedActiveCount = linkedSuggestions.filter((l: any) => l.isActive).length;

  const openScheduleModal = (type: "fixed" | "linked", id: number) => {
    if (type === "fixed") {
      const item = fixedSuggestions.find((s: any) => s.id === id);
      if (item) {
        setScheduleTarget({ type, id, name: (item as any).name, schedule: dbToSchedule(item) });
        setScheduleModalOpen(true);
      }
    } else {
      const item = linkedSuggestions.find((l: any) => l.id === id);
      if (item) {
        setScheduleTarget({ type, id, name: (item as any).triggerProduct?.name, schedule: dbToSchedule(item) });
        setScheduleModalOpen(true);
      }
    }
  };

  const handleSaveSchedule = async (schedule: TimeSchedule) => {
    if (!scheduleTarget || !establishmentId) return;
    try {
      if (scheduleTarget.type === "fixed") {
        await updateScheduleMutation.mutateAsync({
          id: scheduleTarget.id,
          establishmentId,
          scheduleEnabled: schedule.enabled,
          scheduleDays: schedule.days,
          scheduleStartTime: schedule.startTime,
          scheduleEndTime: schedule.endTime,
          scheduleLabel: schedule.label,
        });
      } else {
        await updateLinkedScheduleMutation.mutateAsync({
          id: scheduleTarget.id,
          establishmentId,
          scheduleEnabled: schedule.enabled,
          scheduleDays: schedule.days,
          scheduleStartTime: schedule.startTime,
          scheduleEndTime: schedule.endTime,
          scheduleLabel: schedule.label,
        });
      }
      toast.success("Regra de horário salva");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar horário");
    }
  };

  const handleToggleFixed = async (id: number, isActive: boolean) => {
    if (!establishmentId) return;
    try {
      await toggleFixedMutation.mutateAsync({ id, establishmentId, isActive });
      toast.success("Sugestão atualizada");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar sugestão");
    }
  };

  const handleRemoveFixed = async (id: number) => {
    if (!establishmentId) return;
    try {
      await removeFixedMutation.mutateAsync({ id, establishmentId });
      toast.success("Sugestão removida");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover sugestão");
    }
  };

  const openScopeModal = (id: number) => {
    const item = fixedSuggestions.find((s: any) => s.id === id);
    if (item) {
      setScopeTarget(item);
      setScopeModalOpen(true);
    }
  };

  const handleToggleLinked = async (id: number, isActive: boolean) => {
    if (!establishmentId) return;
    try {
      await toggleLinkedMutation.mutateAsync({ id, establishmentId, isActive });
      toast.success("Vínculo atualizado");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar vínculo");
    }
  };

  const handleRemoveLinked = async (id: number) => {
    if (!establishmentId) return;
    try {
      await removeLinkedMutation.mutateAsync({ id, establishmentId });
      toast.success("Vínculo removido");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover vínculo");
    }
  };

  const handleEditLinked = (id: number) => {
    const linked = linkedSuggestions.find((l: any) => l.id === id);
    if (linked) {
      setEditLinkedTarget(linked);
      setEditLinkedOpen(true);
    }
  };

  // Banner carousel state
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [bannersDismissed, setBannersDismissed] = useState(() => {
    try { return localStorage.getItem('sugestoes-banners-dismissed') === 'true'; } catch { return false; }
  });
  const totalInfoBanners = 2;
  useEffect(() => {
    if (isBannerHovered || bannersDismissed) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % totalInfoBanners);
    }, 8000);
    return () => clearInterval(interval);
  }, [isBannerHovered, bannersDismissed]);

  const handleDismissBanners = () => {
    setBannersDismissed(true);
    try { localStorage.setItem('sugestoes-banners-dismissed', 'true'); } catch {}
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 overflow-x-hidden">
      <div className="space-y-6">
        <PageHeader
          title="Sugestões"
          description="Gerencie as sugestões de produtos exibidas no checkout e aumente seu ticket médio"
          icon={<Sparkles className="h-6 w-6 text-blue-500" />}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Receita gerada"
            value={revenueData ? formatCurrency(revenueData.revenue) : "R$ 0,00"}
            icon={DollarSign}
            variant="emerald"
            loading={revenueLoading}
            trend={revenueData ? { value: Math.abs(revenueData.trend), isPositive: revenueData.trend >= 0, label: "vs mês anterior" } : undefined}
            tooltip="Via sugestões nos últimos 30 dias"
          />
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(dashStats?.avgTicket ?? 0)}
            icon={TrendingUp}
            variant="blue"
            loading={dashStatsLoading}
            trend={dashStats && dashStats.avgTicketChange !== undefined ? { value: Math.abs(dashStats.avgTicketChange), isPositive: dashStats.avgTicketChange >= 0, label: "vs semana anterior" } : undefined}
            tooltip="Valor médio por pedido na semana atual"
          />
          <StatCard
            title="Sugestões fixas"
            value={`${fixedActiveCount} / ${fixedSuggestions.length}`}
            icon={Star}
            variant="amber"
          />
          <StatCard
            title="Vínculos ativos"
            value={`${linkedActiveCount} / ${linkedSuggestions.length}`}
            icon={Link2}
            variant="emerald"
          />
        </div>

        {/* Banners informativos — carrossel com dots */}
        {!bannersDismissed && (
          <div className="space-y-2" onMouseEnter={() => setIsBannerHovered(true)} onMouseLeave={() => setIsBannerHovered(false)}>
            <div className="relative overflow-hidden rounded-xl">
              {/* Banner 1: Sugestões Fixas */}
              {activeBannerIdx === 0 && (
                <div className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-200/50 dark:border-amber-800/30">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23f59e0b' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)', animation: 'banner-shimmer 3s ease-in-out infinite', animationDelay: '1s' }} />
                  </div>
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/30 dark:bg-amber-500/20" />
                      <div className="relative p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                        <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        Sugestões Fixas
                      </p>
                      <MobileExpandableText
                        className="text-xs text-muted-foreground leading-tight mt-0.5"
                        collapsedClassName="pr-[4.75rem]"
                        expandButtonClassName="text-amber-600 dark:text-amber-400 bg-yellow-50 dark:bg-amber-950/90"
                      >
                        Produtos ou categorias que serão sempre sugeridos no checkout, independente do que o cliente tem no carrinho. Ideal para destacar itens populares, promoções ou combos do dia.
                      </MobileExpandableText>
                    </div>
                    <button
                      onClick={handleDismissBanners}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-800/30 transition-colors"
                      aria-label="Fechar banners"
                    >
                      <X className="h-4 w-4 text-amber-600/70 dark:text-amber-400/70" />
                    </button>
                  </div>
                </div>
              )}

              {/* Banner 2: Sugestões Vinculadas */}
              {activeBannerIdx === 1 && (
                <div className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/20 border-blue-200/50 dark:border-blue-800/30">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%233b82f6' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)', animation: 'banner-shimmer 3s ease-in-out infinite', animationDelay: '1s' }} />
                  </div>
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/30 dark:bg-blue-500/20" />
                      <div className="relative p-2 rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        <Link2 className="h-4 w-4 hidden sm:inline mr-1 text-blue-600 dark:text-blue-400" />
                        Sugestões Vinculadas
                      </p>
                      <MobileExpandableText
                        className="text-xs text-muted-foreground leading-tight mt-0.5"
                        collapsedClassName="pr-[4.75rem]"
                        expandButtonClassName="text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/90"
                      >
                        Sugestões inteligentes que aparecem quando um produto específico está no carrinho. Exemplo: cliente pediu Sashimi → sistema sugere Molho Shoyu. Perfeito para combinar itens que se complementam.
                      </MobileExpandableText>
                    </div>
                    <button
                      onClick={handleDismissBanners}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-blue-200/50 dark:hover:bg-blue-800/30 transition-colors"
                      aria-label="Fechar banners"
                    >
                      <X className="h-4 w-4 text-blue-600/70 dark:text-blue-400/70" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dots de navegação */}
            <div className="flex justify-center gap-1.5">
              {[0, 1].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`h-2 rounded-full transition-colors duration-300 ${
                    idx === activeBannerIdx
                      ? (idx === 0 ? 'w-5 bg-amber-600' : 'w-5 bg-blue-600')
                      : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                  aria-label={`Banner ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-muted/50 p-1 h-auto w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger
                value="fixed"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 sm:px-4 py-2 text-xs sm:text-sm"
              >
                <Star className="h-4 w-4 mr-1.5" />
                Sempre sugerir
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {fixedSuggestions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="linked"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 sm:px-4 py-2 text-xs sm:text-sm"
              >
                <Link2 className="h-4 w-4 mr-1.5" />
                Sugestões vinculadas
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {linkedSuggestions.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Sempre sugerir (connected to backend) */}
          <TabsContent value="fixed" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sugestões..."
                  value={searchFixed}
                  onChange={(e) => setSearchFixed(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => setAddFixedOpen(true)}
                className="bg-red-500 hover:bg-red-500 text-white shrink-0"
                disabled={!establishmentId}
              >
                Nova sugestão fixa
              </Button>
            </div>

            {fixedLoading ? (
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFixed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma sugestão fixa</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Adicione itens ou categorias que serão sempre sugeridos no checkout quando não houver sugestões vinculadas.
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                {filteredFixed.map((suggestion: any) => (
                  <FixedSuggestionRow
                    key={suggestion.id}
                    suggestion={suggestion}
                    onToggle={handleToggleFixed}
                    onRemove={handleRemoveFixed}
                    onSchedule={(id) => openScheduleModal("fixed", id)}
                    onScope={openScopeModal}
                    isToggling={toggleFixedMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Sugestões vinculadas (connected to backend) */}
          <TabsContent value="linked" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto gatilho ou sugerido..."
                  value={searchLinked}
                  onChange={(e) => setSearchLinked(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => setAddLinkedOpen(true)}
                className="bg-red-500 hover:bg-red-500 text-white shrink-0"
                disabled={!establishmentId}
              >
                Nova sugestão vinculada
              </Button>
            </div>

            <div className="space-y-3">
              {linkedLoading ? (
                <div className="bg-card rounded-xl border border-border/50 flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLinked.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma sugestão vinculada</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Crie vínculos entre produtos para sugestões contextuais. Ex: quem pede hambúrguer, recebe sugestão de batata frita.
                  </p>
                </div>
              ) : (
                filteredLinked.map((linked: any) => (
                  <LinkedSuggestionRow
                    key={linked.id}
                    linked={linked}
                    onToggle={(id) => {
                      const item = linkedSuggestions.find((l: any) => l.id === id);
                      if (item) handleToggleLinked(id, !(item as any).isActive);
                    }}
                    onRemove={handleRemoveLinked}
                    onEdit={handleEditLinked}
                    onSchedule={(id) => openScheduleModal("linked", id)}
                    isToggling={toggleLinkedMutation.isPending}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {establishmentId && (
        <>
          <AddFixedSuggestionModal
            open={addFixedOpen}
            onClose={() => setAddFixedOpen(false)}
            establishmentId={establishmentId}
          />
          <AddLinkedSuggestionModal
            open={addLinkedOpen}
            onClose={() => setAddLinkedOpen(false)}
            establishmentId={establishmentId}
          />
          <EditLinkedSuggestionModal
            open={editLinkedOpen}
            onClose={() => { setEditLinkedOpen(false); setEditLinkedTarget(null); }}
            establishmentId={establishmentId}
            linkedSuggestion={editLinkedTarget}
          />
          <FixedSuggestionScopeModal
            open={scopeModalOpen}
            onClose={() => { setScopeModalOpen(false); setScopeTarget(null); }}
            establishmentId={establishmentId}
            suggestion={scopeTarget}
          />
        </>
      )}
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => { setScheduleModalOpen(false); setScheduleTarget(null); }}
        schedule={scheduleTarget?.schedule}
        onSave={handleSaveSchedule}
        itemName={scheduleTarget?.name || ""}
      />
      </div>
    </AdminLayout>
  );
}
