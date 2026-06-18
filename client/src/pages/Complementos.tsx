import { AdminLayout } from "@/components/AdminLayout";
import { useSearch } from "@/contexts/SearchContext";
import { PageHeader } from "@/components/shared";
import { MobileExpandableText } from "@/components/MobileExpandableText";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  Gift,
  DollarSign,
  Search,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  Trash2,
  GripVertical,
  Pause,
  Play,
  MoreVertical,
  Loader2,
  Package,
  AlertTriangle,
  HelpCircle,
  FileText,
  Settings,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, capitalizeFirst } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda" },
  { value: 2, label: "Ter", fullLabel: "Terça" },
  { value: 3, label: "Qua", fullLabel: "Quarta" },
  { value: 4, label: "Qui", fullLabel: "Quinta" },
  { value: 5, label: "Sex", fullLabel: "Sexta" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

// ---- Expanded Item Details (Badge + Availability) ----
function ItemExpandedDetails({
  item,
  onUpdateItem,
  isUpdating,
}: {
  item: any;
  onUpdateItem: (id: number, data: any) => void;
  isUpdating: boolean;
}) {
  const [description, setDescription] = useState(item.description || "");
  const [badgeText, setBadgeText] = useState(item.badgeText || "");
  const [availabilityType, setAvailabilityType] = useState<"always" | "scheduled">(
    item.availabilityType || "always"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(item.availableDays || []);
  const [hoursConfig, setHoursConfig] = useState<{ day: number; startTime: string; endTime: string }[]>(
    item.availableHours || []
  );

  useEffect(() => {
    setDescription(item.description || "");
    setBadgeText(item.badgeText || "");
    setAvailabilityType(item.availabilityType || "always");
    setSelectedDays(item.availableDays || []);
    setHoursConfig(item.availableHours || []);
  }, [item.description, item.badgeText, item.availabilityType, item.availableDays, item.availableHours]);

  const handleSaveDescription = () => {
    onUpdateItem(item.id, { description: description.trim() || null });
    toast.success(description.trim() ? "Descri\u00e7\u00e3o salva" : "Descri\u00e7\u00e3o removida");
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const updateHoursForDay = (day: number, startTime: string, endTime: string) => {
    setHoursConfig((prev) => {
      const filtered = prev.filter((h) => h.day !== day);
      return [...filtered, { day, startTime, endTime }].sort((a, b) => a.day - b.day);
    });
  };

  const handleSaveBadge = () => {
    onUpdateItem(item.id, { badgeText: badgeText.trim() || null });
    toast.success(badgeText.trim() ? `Badge "${badgeText.trim()}" salvo` : "Badge removido");
  };

  const handleSaveAvailability = () => {
    onUpdateItem(item.id, {
      availabilityType,
      availableDays: availabilityType === "scheduled" ? selectedDays : null,
      availableHours: availabilityType === "scheduled" ? hoursConfig : null,
    });
    toast.success("Disponibilidade atualizada");
  };

  return (
    <div className="mt-2 border-t border-border/30 pt-3 space-y-4 animate-in slide-in-from-top-1 duration-150">
      {/* Description Section */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h6 className="font-medium text-xs flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Descrição do complemento
        </h6>
        <p className="text-xs text-muted-foreground">
          Texto descritivo exibido abaixo do nome do complemento no menu público (opcional).
        </p>
        <Textarea
          placeholder="Ex: Molho artesanal feito com tomates frescos e manjericão..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          rows={2}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs bg-red-500 hover:bg-red-500 text-white"
            onClick={handleSaveDescription}
            disabled={isUpdating}
          >
            {isUpdating ? "Salvando..." : "Salvar descrição"}
          </Button>
          {item.description && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-500 hover:text-red-500"
              onClick={() => {
                setDescription("");
                onUpdateItem(item.id, { description: null });
                toast.success("Descrição removida");
              }}
              disabled={isUpdating}
            >
              Remover
            </Button>
          )}
        </div>
      </div>

      {/* Badge Section */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h6 className="font-medium text-xs flex items-center gap-1.5">
          <span className="text-red-500 text-sm">&#9679;</span>
          Badge / Destaque
        </h6>
        <p className="text-xs text-muted-foreground">
          Texto de destaque ao lado do complemento no menu público (ex: "Novo", "Promoção").
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Ex: Novo, Novidade, Promoção..."
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            className="max-w-[200px] h-8 text-xs"
            maxLength={50}
          />
          <Button
            size="sm"
            className="h-8 text-xs bg-red-500 hover:bg-red-500 text-white"
            onClick={handleSaveBadge}
            disabled={isUpdating}
          >
            {isUpdating ? "Salvando..." : "Salvar badge"}
          </Button>
          {item.badgeText && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-500 hover:text-red-500"
              onClick={() => {
                setBadgeText("");
                onUpdateItem(item.id, { badgeText: null });
                toast.success("Badge removido");
              }}
              disabled={isUpdating}
            >
              Remover
            </Button>
          )}
        </div>
        {badgeText.trim() && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Preview:</span>
            <Badge variant="secondary" className="bg-red-100 text-red-500 border-red-200 text-[10px]">
              {badgeText.trim()}
            </Badge>
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-3">
        <h6 className="font-medium text-xs flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Disponibilidade do complemento
        </h6>

        <div className="space-y-2">
          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name={`avail-${item.id}`}
              checked={availabilityType === "always"}
              onChange={() => setAvailabilityType("always")}
              className="mt-0.5 accent-red-700"
            />
            <div>
              <span className="text-xs font-medium">Sempre disponível</span>
              <p className="text-[10px] text-muted-foreground">
                O item ficará disponível sempre que o estabelecimento estiver aberto
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name={`avail-${item.id}`}
              checked={availabilityType === "scheduled"}
              onChange={() => setAvailabilityType("scheduled")}
              className="mt-0.5 accent-red-700"
            />
            <div>
              <span className="text-xs font-medium">Disponível em dias e horários específicos</span>
              <p className="text-[10px] text-muted-foreground">
                Escolha quando o item aparece nos seus canais de venda
              </p>
            </div>
          </label>
        </div>

        {availabilityType === "scheduled" && (
          <div className="space-y-2 pl-2">
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                    selectedDays.includes(day.value)
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-background text-muted-foreground border-border hover:border-red-300"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {selectedDays.length > 0 && (
              <div className="space-y-1.5">
                {selectedDays.map((day) => {
                  const dayLabel = DAYS_OF_WEEK.find((d) => d.value === day)?.label;
                  const existing = hoursConfig.find((h) => h.day === day);
                  return (
                    <div key={day} className="flex items-center gap-2 text-xs">
                      <span className="w-8 font-medium text-muted-foreground">{dayLabel}</span>
                      <Input
                        type="time"
                        value={existing?.startTime || "00:00"}
                        onChange={(e) =>
                          updateHoursForDay(day, e.target.value, existing?.endTime || "23:59")
                        }
                        className="w-24 h-7 text-xs"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={existing?.endTime || "23:59"}
                        onChange={(e) =>
                          updateHoursForDay(day, existing?.startTime || "00:00", e.target.value)
                        }
                        className="w-24 h-7 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-8 text-xs bg-red-500 hover:bg-red-500 text-white"
            onClick={handleSaveAvailability}
            disabled={isUpdating}
          >
            {isUpdating ? "Salvando..." : "Salvar disponibilidade"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Sortable Complement Item inside a group ----
function SortableComplementItem({
  item,
  establishmentId,
  onToggleActive,
  onDeleteByName,
  onDeleteExclusive,
  onUpdateItem,
  isExpanded,
  onToggleExpand,
  isUpdating,
  productCount,
}: {
  item: any;
  establishmentId: number;
  onToggleActive: (name: string, isActive: boolean) => void;
  onDeleteByName: (name: string) => void;
  onDeleteExclusive?: (itemId: number) => void;
  onUpdateItem: (id: number, data: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isUpdating: boolean;
  productCount: number;
}) {
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [toggleItemDialogOpen, setToggleItemDialogOpen] = useState(false);
  // Pending confirmation states for global changes
  const [pendingPriceDialog, setPendingPriceDialog] = useState<string | null>(null);
  const [pendingNameDialog, setPendingNameDialog] = useState<string | null>(null);
  const [pendingFreeDialog, setPendingFreeDialog] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Currency mask
  const priceToCents = (price: string | number) => Math.round(Number(typeof price === 'string' ? parseFloat(price) : price) * 100) || 0;
  const formatPriceBR = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    return `${str.slice(0, -2)},${str.slice(-2)}`;
  };

  const [priceCents, setPriceCents] = useState(item.price ? priceToCents(item.price) : 0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [localStock, setLocalStock] = useState(item.hasStock && item.stockQuantity !== null ? String(item.stockQuantity) : '');
  const stockRef = useRef<HTMLInputElement>(null);
  const isFree = item.priceMode === "free";
  const isExclusive = !!item.isExclusive;
  const hasFreeContexts = item.freeOnDelivery || item.freeOnPickup || item.freeOnDineIn;
  const freeContextCount = [item.freeOnDelivery, item.freeOnPickup, item.freeOnDineIn].filter(Boolean).length;

  function handleToggleFreeContext(field: 'freeOnDelivery' | 'freeOnPickup' | 'freeOnDineIn', currentValue: boolean) {
    if (currentValue) {
      onUpdateItem(item.id, { [field]: false });
      return;
    }
    if (freeContextCount >= 2) {
      toast.error("Máximo de 2 contextos de gratuidade");
      return;
    }
    onUpdateItem(item.id, { [field]: true });
  }

  useEffect(() => {
    setPriceCents(item.price ? priceToCents(item.price) : 0);
  }, [item.price]);

  useEffect(() => {
    setLocalStock(item.hasStock && item.stockQuantity !== null ? String(item.stockQuantity) : '');
  }, [item.stockQuantity, item.hasStock]);

  function handleStockBlur() {
    const parsed = parseInt(localStock, 10);
    if (localStock === '' && item.hasStock) {
      // User cleared stock - disable stock control
      onUpdateItem(item.id, { hasStock: false, stockQuantity: null });
    } else if (!isNaN(parsed) && (parsed !== item.stockQuantity || !item.hasStock)) {
      onUpdateItem(item.id, { hasStock: true, stockQuantity: parsed });
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const cents = parseInt(raw, 10) || 0;
    setPriceCents(cents);
  }

  function handlePriceBlur() {
    const newPrice = priceCents / 100;
    const finalPrice = newPrice.toFixed(2);
    const oldPrice = item.price ? Number(item.price).toFixed(2) : '0.00';
    if (finalPrice === oldPrice) return;
    if (isExclusive) {
      onUpdateItem(item.id, { price: finalPrice });
    } else {
      setPendingPriceDialog(finalPrice);
    }
  }

  function handleSaveName() {
    if (editedName.trim() && editedName.trim() !== item.name) {
      if (isExclusive) {
        onUpdateItem(item.id, { name: editedName.trim() });
        toast.success("Nome atualizado");
        setIsEditingName(false);
      } else {
        setPendingNameDialog(editedName.trim());
      }
    } else {
      setIsEditingName(false);
    }
  }

  function handleToggleFree() {
    if (isExclusive) {
      const newMode = isFree ? "normal" : "free";
      if (newMode === "normal") {
        onUpdateItem(item.id, { priceMode: newMode, freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: false });
        toast.success("Preço normal restaurado");
      } else {
        onUpdateItem(item.id, { priceMode: newMode });
        toast.success("Marcado como GRÁTIS — selecione os contextos abaixo");
      }
    } else {
      setPendingFreeDialog(true);
    }
  }

  return (
    <>
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card rounded-lg border border-border/50",
        isDragging && "shadow-lg ring-2 ring-primary/30",
        !item.isActive && "bg-muted/40"
      )}
    >
      <div
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button, input, a, [role="menuitem"], [data-radix-collection-item], label, .cursor-grab')) return;
          onToggleExpand();
        }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none flex-shrink-0",
            !item.isActive && "opacity-50"
          )}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        </button>

        {/* Image indicator */}
        {item.imageUrl && (
          <div className={cn("h-7 w-7 rounded-md overflow-hidden flex-shrink-0", !item.isActive && "opacity-50 grayscale")}>
            <img loading="lazy" src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Name - editable */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-1 min-w-0">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-7 text-sm min-w-0"
                style={{ width: `${Math.max(editedName.length * 14 + 32, 120)}px`, maxWidth: '400px' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                    setEditedName(item.name);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0 gap-1"
                onClick={handleSaveName}
              >
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs">Salvar</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 flex-shrink-0 gap-1"
                onClick={() => {
                  setIsEditingName(false);
                  setEditedName(item.name);
                }}
              >
                <X className="h-3.5 w-3.5" />
                <span className="text-xs">Cancelar</span>
              </Button>
            </div>
          ) : (
            <div className={cn("flex items-center gap-1 min-w-0", !item.isActive && "opacity-50")}>
              <span
                className={cn(
                  "text-sm truncate",
                  !item.isActive && "line-through text-muted-foreground"
                )}
              >
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="hidden md:hidden md:group-hover:inline text-red-500 hover:text-red-500 text-[10px] font-medium flex-shrink-0 hover:underline"
              >
                Editar
              </button>
              {item.description && (
                <>
                  <span className="text-gray-300 text-sm flex-shrink-0">|</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p className="text-xs">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
              {/* Badges */}
              {isExclusive && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 bg-purple-100 text-purple-700 border border-purple-300 rounded-md px-1.5 py-0 h-4 text-[9px] font-medium flex-shrink-0 cursor-help">
                      <Package className="h-2.5 w-2.5" />
                      Exclusivo
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Este item só aparece em: <strong>{item.exclusiveProductName}</strong></p>
                    <p className="text-xs text-muted-foreground">Não será exibido nos outros produtos que usam este grupo</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {item.badgeText && (
                <Badge variant="secondary" className="bg-red-100 text-red-500 border-red-200 text-[9px] px-1 py-0 h-4 flex-shrink-0">
                  {item.badgeText}
                </Badge>
              )}
              {item.availabilityType === "scheduled" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-[9px] px-1 py-0 h-4 flex-shrink-0">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  Horário
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Price toggle: Grátis - desktop only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleToggleFree}
              className={cn(
                "hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors flex-shrink-0",
                isFree
                  ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                  : "bg-muted text-muted-foreground border-border hover:bg-green-50 hover:text-green-600 hover:border-green-200",
                !item.isActive && "opacity-50"
              )} style={{height: '28px'}}
            >
              <Gift className="h-3 w-3" />
              Grátis
            </button>
          </TooltipTrigger>
          <TooltipContent>{isFree ? "Clique para preço normal" : "Clique para marcar como GRÁTIS"}</TooltipContent>
        </Tooltip>

        {/* Mobile: show free badge inline */}
        {isFree && (
          <span className={cn("flex md:hidden items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-green-100 text-green-700 border-green-300 flex-shrink-0", !item.isActive && "opacity-50")}>
            <Gift className="h-3 w-3" />
            Grátis
          </span>
        )}

        {/* Stock - editable inline */}
        <div className={cn("hidden md:flex flex-shrink-0", !item.isActive && "opacity-50")}>
          <input
            ref={stockRef}
            type="text"
            inputMode="numeric"
            value={localStock}
            placeholder="Estoque"
            onChange={(e) => setLocalStock(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={handleStockBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') stockRef.current?.blur(); }}
            onClick={(e) => e.stopPropagation()}
            className="w-[70px] h-7 text-sm text-center font-medium rounded-lg border border-border/60 bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Stock badge for out of stock */}
        {item.hasStock && item.stockQuantity !== null && item.stockQuantity <= 0 && (
          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 flex-shrink-0">
            Sem estoque
          </Badge>
        )}

        {/* Price - editable inline with currency mask */}
        {!isFree && (
          <div className={cn("relative flex-shrink-0", !item.isActive && "opacity-50")}>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
              R$
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatPriceBR(priceCents)}
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              onClick={(e) => e.stopPropagation()}
              className="w-[90px] h-7 pl-7 pr-2 text-sm text-right font-semibold rounded-lg border border-border/60 bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-border/50 focus:border-border transition-colors"
            />
          </div>
        )}

        {/* Desktop: individual action buttons */}
        <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
          {/* Toggle active */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setToggleItemDialogOpen(true)}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  item.isActive
                    ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                )}
              >
                {item.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{item.isActive ? "Pausar em todos os produtos" : "Ativar em todos os produtos"}</TooltipContent>
          </Tooltip>

          {/* Delete */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setDeleteItemDialogOpen(true)}
                className={cn(
                  "p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                  !item.isActive && "opacity-50"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Excluir de todos os produtos</TooltipContent>
          </Tooltip>

          {/* Expand/Collapse for badge + availability */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleExpand}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  isExpanded
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                  !item.isActive && "opacity-50"
                )}
              >
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Badge e disponibilidade</TooltipContent>
          </Tooltip>
        </div>

        {/* Mobile: 3-dot dropdown menu */}
        <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn(
              "p-1 rounded-md transition-colors",
              isExpanded
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5",
              !item.isActive && "opacity-50"
            )}
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                  !item.isActive && "opacity-50"
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Editar nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFree}>
                {isFree ? (
                  <>
                    <span className="text-xs mr-2 font-bold">$</span>
                    Preço normal
                  </>
                ) : (
                  <>
                    <Gift className="h-3.5 w-3.5 mr-2" />
                    Marcar grátis
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setToggleItemDialogOpen(true)}>
                {item.isActive ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteItemDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Checkboxes de gratuidade por contexto */}
      {isFree && (
        <div className="px-3 pb-2 animate-in slide-in-from-top-1 duration-150">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Aplicar gratuidade para:</span>
              {freeContextCount > 0 && (
                <span className="text-[10px] text-green-600 dark:text-green-500 ml-auto">{freeContextCount}/2</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item.freeOnDelivery}
                  onChange={() => handleToggleFreeContext('freeOnDelivery', !!item.freeOnDelivery)}
                  className="h-3.5 w-3.5 rounded border-green-300 accent-green-600 cursor-pointer"
                />
                <span className="text-xs text-green-700 dark:text-green-400">Delivery</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item.freeOnPickup}
                  onChange={() => handleToggleFreeContext('freeOnPickup', !!item.freeOnPickup)}
                  className="h-3.5 w-3.5 rounded border-green-300 accent-green-600 cursor-pointer"
                />
                <span className="text-xs text-green-700 dark:text-green-400">Retirada</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item.freeOnDineIn}
                  onChange={() => handleToggleFreeContext('freeOnDineIn', !!item.freeOnDineIn)}
                  className="h-3.5 w-3.5 rounded border-green-300 accent-green-600 cursor-pointer"
                />
                <span className="text-xs text-green-700 dark:text-green-400">Consumo no local</span>
              </label>
            </div>
            {freeContextCount === 0 && (
              <p className="text-[10px] text-green-600/70 dark:text-green-500/70">Nenhum contexto selecionado — o complemento será cobrado normalmente em todos os contextos.</p>
            )}
          </div>
        </div>
      )}

      {/* Mobile stock control */}
      <div className="flex md:hidden px-3 pb-2">
        <div className="flex items-center gap-2 w-full">
          <label className="text-xs text-muted-foreground font-medium">Estoque:</label>
          <input
            type="text"
            inputMode="numeric"
            value={localStock}
            placeholder="Sem controle"
            onChange={(e) => setLocalStock(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={handleStockBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            onClick={(e) => e.stopPropagation()}
            className="w-[90px] h-7 text-sm text-center font-medium rounded-lg border border-border/60 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 placeholder:text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          />
          {item.hasStock && item.stockQuantity !== null && (
            <span className={cn("text-[10px] font-medium", item.stockQuantity <= 0 ? "text-red-500" : "text-green-600")}>
              {item.stockQuantity <= 0 ? "Esgotado" : `${item.stockQuantity} un.`}
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-2 pb-2">
          <ItemExpandedDetails
            item={item}
            onUpdateItem={onUpdateItem}
            isUpdating={isUpdating}
          />
        </div>
      )}
    </div>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={deleteItemDialogOpen} onOpenChange={setDeleteItemDialogOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Excluir "{item.name}"?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do complemento</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir "{item.name}"?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isExclusive
                    ? <>Esta ação irá excluir o complemento exclusivo <strong>"{item.name}"</strong> do produto <strong>"{item.exclusiveProductName}"</strong>. Esta ação não pode ser desfeita.</>
                    : <>Esta ação irá excluir o complemento <strong>"{item.name}"</strong> de <strong>{productCount} produto(s)</strong>. Esta ação não pode ser desfeita.</>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (isExclusive && onDeleteExclusive) {
                    onDeleteExclusive(item.id);
                  } else {
                    onDeleteByName(item.name);
                  }
                  setDeleteItemDialogOpen(false);
                }}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              >
                {isExclusive ? "Excluir item exclusivo" : "Excluir de todos"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Item Active Confirmation Dialog */}
      <AlertDialog open={toggleItemDialogOpen} onOpenChange={setToggleItemDialogOpen}>
        <AlertDialogContent
          className={cn("p-0 overflow-hidden border-t-4", item.isActive ? "border-t-orange-500" : "border-t-emerald-500")}
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">{item.isActive ? `Pausar "${item.name}"?` : `Ativar "${item.name}"?`}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de status</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", item.isActive ? "bg-orange-100 dark:bg-orange-950/50" : "bg-emerald-100 dark:bg-emerald-950/50")}>
                {item.isActive ? <Pause className="h-6 w-6 text-orange-600" /> : <Play className="h-6 w-6 text-emerald-600" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{item.isActive ? `Pausar "${item.name}"?` : `Ativar "${item.name}"?`}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {item.isActive
                    ? <>Esta ação irá <strong>pausar</strong> o complemento <strong>"{item.name}"</strong> em <strong>{productCount} produto(s)</strong>. Ele ficará indisponível para os clientes.</>
                    : <>Esta ação irá <strong>ativar</strong> o complemento <strong>"{item.name}"</strong> em <strong>{productCount} produto(s)</strong>. Ele ficará disponível para os clientes.</>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onToggleActive(item.name, !item.isActive);
                  setToggleItemDialogOpen(false);
                }}
                className={cn("flex-1 rounded-xl h-10 font-semibold text-white", item.isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600")}
              >
                {item.isActive ? "Pausar em todos" : "Ativar em todos"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Change Confirmation Dialog */}
      <AlertDialog open={!!pendingPriceDialog} onOpenChange={(open) => { if (!open) { setPendingPriceDialog(null); setPriceCents(item.price ? priceToCents(item.price) : 0); } }}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Alterar preço de "{item.name}"?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de preço</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Alterar preço de "{item.name}"?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  O preço será alterado de <strong>R$ {item.price ? formatPriceBR(priceToCents(item.price)) : '0,00'}</strong> para <strong>R$ {pendingPriceDialog ? formatPriceBR(Math.round(Number(pendingPriceDialog) * 100)) : '0,00'}</strong> em <strong>{productCount} produto(s)</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingPriceDialog) onUpdateItem(item.id, { price: pendingPriceDialog });
                  setPendingPriceDialog(null);
                }}
                className="flex-1 rounded-xl h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Alterar em todos
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Name Change Confirmation Dialog */}
      <AlertDialog open={!!pendingNameDialog} onOpenChange={(open) => { if (!open) { setPendingNameDialog(null); setEditedName(item.name); setIsEditingName(false); } }}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Renomear "{item.name}"?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de nome</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <Pencil className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Renomear "{item.name}"?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  O nome será alterado de <strong>"{item.name}"</strong> para <strong>"{pendingNameDialog}"</strong> em <strong>{productCount} produto(s)</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingNameDialog) {
                    onUpdateItem(item.id, { name: pendingNameDialog });
                    toast.success("Nome atualizado em todos os produtos");
                  }
                  setPendingNameDialog(null);
                  setIsEditingName(false);
                }}
                className="flex-1 rounded-xl h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Renomear em todos
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Free Confirmation Dialog */}
      <AlertDialog open={pendingFreeDialog} onOpenChange={(open) => { if (!open) setPendingFreeDialog(false); }}>
        <AlertDialogContent
          className={cn("p-0 overflow-hidden border-t-4", isFree ? "border-t-gray-500" : "border-t-emerald-500")}
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">{isFree ? `Restaurar preço de "${item.name}"?` : `Marcar "${item.name}" como grátis?`}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de gratuidade</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", isFree ? "bg-gray-100 dark:bg-gray-950/50" : "bg-emerald-100 dark:bg-emerald-950/50")}>
                <Gift className={cn("h-6 w-6", isFree ? "text-gray-600" : "text-emerald-600")} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{isFree ? `Restaurar preço de "${item.name}"?` : `Marcar "${item.name}" como grátis?`}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isFree
                    ? <>O complemento <strong>"{item.name}"</strong> voltará a ser cobrado normalmente em <strong>{productCount} produto(s)</strong>.</>
                    : <>O complemento <strong>"{item.name}"</strong> será marcado como <strong>GRÁTIS</strong> em <strong>{productCount} produto(s)</strong>.</>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const newMode = isFree ? "normal" : "free";
                  if (newMode === "normal") {
                    onUpdateItem(item.id, { priceMode: newMode, freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: false });
                    toast.success("Preço normal restaurado em todos os produtos");
                  } else {
                    onUpdateItem(item.id, { priceMode: newMode });
                    toast.success("Marcado como GRÁTIS em todos os produtos");
                  }
                  setPendingFreeDialog(false);
                }}
                className={cn("flex-1 rounded-xl h-10 font-semibold text-white", isFree ? "bg-gray-600 hover:bg-gray-700" : "bg-emerald-600 hover:bg-emerald-700")}
              >
                {isFree ? "Restaurar preço" : "Marcar como grátis"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---- Group Card Component ----
function GroupCard({
  group,
  establishmentId,
  isExpanded,
  onToggleExpand,
}: {
  group: any;
  establishmentId: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const utils = trpc.useUtils();
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const [addingItem, setAddingItem] = useState(false);
  const [addingExclusiveItem, setAddingExclusiveItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0,00");
  const [exclusiveProductId, setExclusiveProductId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleGroupDialogOpen, setToggleGroupDialogOpen] = useState(false);
  // Pending confirmation states for group-level changes
  const [pendingGroupNameDialog, setPendingGroupNameDialog] = useState<string | null>(null);
  const [pendingMinMaxDialog, setPendingMinMaxDialog] = useState<{ field: 'minQuantity' | 'maxQuantity'; value: number } | null>(null);
  const [pendingRequiredDialog, setPendingRequiredDialog] = useState<boolean | null>(null);
  const [localMin, setLocalMin] = useState(group.minQuantity ?? 0);
  const [localMax, setLocalMax] = useState(group.maxQuantity ?? 0);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const exclusiveItemNameInputRef = useRef<HTMLInputElement>(null);

  // Fetch products for this group to show in exclusive item selector
  const { data: productsList } = trpc.product.list.useQuery(
    { establishmentId },
    { enabled: addingExclusiveItem }
  );

  // Filter products that use this group
  const productsWithGroup = useMemo(() => {
    if (!productsList?.products) return [];
    return productsList.products.filter((p: any) => group.productIds?.includes(p.id));
  }, [productsList, group.productIds]);

  // Mutations
  const toggleGroupActiveMutation = trpc.complement.toggleGroupActive.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
    },
    onError: () => toast.error("Erro ao alterar status do grupo"),
  });

  const deleteGroupMutation = trpc.complement.deleteGroupByName.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();
      toast.success("Grupo excluído de todos os produtos");
    },
    onError: () => toast.error("Erro ao excluir grupo"),
  });

  const updateGroupRulesMutation = trpc.complement.updateGroupRules.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar regras do grupo"),
  });

  const updateGlobalMutation = trpc.complement.updateGlobal.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar complemento: " + error.message);
    },
  });

  const updateItemMutation = trpc.complement.updateItem.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar item"),
  });

  // Separate mutation for reorder that does NOT invalidate on each call
  const reorderItemMutation = trpc.complement.updateItem.useMutation({
    // No onSuccess invalidate - we handle it manually after all mutations complete
    onError: () => toast.error("Erro ao reordenar item"),
  });

  const deleteItemByNameMutation = trpc.complement.deleteItemByName.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();
      toast.success("Complemento excluído de todos os produtos");
    },
    onError: () => toast.error("Erro ao excluir complemento"),
  });

  const addItemToGroupMutation = trpc.complement.addItemToGroupByName.useMutation({
    onSuccess: (data) => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();
      setNewItemName("");
      setNewItemPrice("0,00");
      toast.success(`Item adicionado em ${data.groupsAffected} produto(s)`);
      setTimeout(() => itemNameInputRef.current?.focus(), 50);
    },
    onError: (err) => {
      if (err.message?.includes("Limite de") || err.message?.includes("plano")) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao adicionar item");
      }
    },
  });

  const addExclusiveItemMutation = trpc.complement.addExclusiveItem.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();
      setNewItemName("");
      setNewItemPrice("0,00");
      toast.success("Item exclusivo adicionado");
      setTimeout(() => exclusiveItemNameInputRef.current?.focus(), 50);
    },
    onError: (error: { message: string }) => toast.error("Erro ao adicionar item exclusivo: " + error.message),
  });

  const removeExclusiveItemMutation = trpc.complement.removeExclusiveItem.useMutation({
    onSuccess: () => {
      utils.complement.listAllGroups.invalidate();
      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();
      toast.success("Item exclusivo removido");
    },
    onError: () => toast.error("Erro ao remover item exclusivo"),
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleItemDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = Number(String(active.id).replace("item-", ""));
      const overId = Number(String(over.id).replace("item-", ""));

      const items = group.items || [];
      const oldIndex = items.findIndex((i: any) => i.id === activeId);
      const newIndex = items.findIndex((i: any) => i.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(items, oldIndex, newIndex);

      // Optimistic update: immediately update the cache so UI reflects the new order
      utils.complement.listAllGroups.setData(
        { establishmentId },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((g: any) => {
            if (g.name === group.name) {
              return {
                ...g,
                items: reordered.map((item: any, idx: number) => ({
                  ...item,
                  sortOrder: idx,
                })),
              };
            }
            return g;
          });
        }
      );

      // Send all reorder mutations without invalidating, then invalidate once at the end
      const promises = reordered.map((item: any, idx: number) =>
        reorderItemMutation.mutateAsync({ id: item.id, sortOrder: idx })
      );

      Promise.all(promises)
        .then(() => {
          // Only invalidate after ALL reorders are done
          utils.complement.listAllGroups.invalidate();
        })
        .catch(() => {
          // On error, rollback by invalidating to get server state
          utils.complement.listAllGroups.invalidate();
          toast.error("Erro ao reordenar complementos");
        });
    },
    [group.items, reorderItemMutation, utils, establishmentId, group.name]
  );

  const handleToggleGroupActive = () => {
    const newActive = !group.isActive;
    toggleGroupActiveMutation.mutate({
      establishmentId,
      groupName: group.name,
      isActive: newActive,
    });
    toast.success(newActive ? "Grupo ativado em todos os produtos" : "Grupo pausado em todos os produtos");
  };

  const handleDeleteGroup = () => {
    deleteGroupMutation.mutate({
      establishmentId,
      groupName: group.name,
    });
    setDeleteDialogOpen(false);
  };

  const handleSaveGroupName = () => {
    if (editedName.trim() && editedName.trim() !== group.name) {
      setPendingGroupNameDialog(editedName.trim());
    } else {
      setIsEditingName(false);
    }
  };

  const handleUpdateMinMax = (field: "minQuantity" | "maxQuantity", value: number) => {
    if (field === 'minQuantity') setLocalMin(value);
    else setLocalMax(value);
  };

  const handleMinMaxBlur = (field: "minQuantity" | "maxQuantity") => {
    const value = field === 'minQuantity' ? localMin : localMax;
    const oldValue = field === 'minQuantity' ? (group.minQuantity ?? 0) : (group.maxQuantity ?? 0);
    if (value !== oldValue) {
      setPendingMinMaxDialog({ field, value });
    }
  };

  const handleToggleRequired = (isRequired: boolean) => {
    setPendingRequiredDialog(isRequired);
  };

  const handleToggleItemActive = (itemName: string, isActive: boolean) => {
    updateGlobalMutation.mutate({
      establishmentId,
      complementName: itemName,
      groupIds: group.groupIds,
      isActive,
    });
    toast.success(isActive ? "Complemento ativado nos produtos deste grupo" : "Complemento pausado nos produtos deste grupo");
  };

  const handleDeleteItemByName = (itemName: string) => {
    deleteItemByNameMutation.mutate({
      establishmentId,
      itemName,
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const cleaned = newItemPrice.replace(/[^\d,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    const finalPrice = isNaN(num) ? "0" : num.toFixed(2);
    addItemToGroupMutation.mutate({
      establishmentId,
      groupName: group.name,
      name: newItemName.trim(),
      price: finalPrice,
    });
  };

  const handleAddExclusiveItem = () => {
    if (!newItemName.trim() || !exclusiveProductId) return;
    const cleaned = newItemPrice.replace(/[^\d,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    const finalPrice = isNaN(num) ? "0" : num.toFixed(2);
    addExclusiveItemMutation.mutate({
      establishmentId,
      groupName: group.name,
      productId: exclusiveProductId,
      name: newItemName.trim(),
      price: finalPrice,
    });
  };

  const handleDeleteExclusiveItem = (itemId: number) => {
    removeExclusiveItemMutation.mutate({ itemId });
  };

  const items = group.items || [];

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <div
          className={cn(
            "bg-card rounded-xl border border-border/50 overflow-hidden transition-all",
            "border-t-4 border-t-red-500",
            !group.isActive && "opacity-60"
          )}
        >
          {/* Group Header */}
          <div
            className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('[role="switch"]');
              if (isInteractive) return;
              onToggleExpand();
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Group name - editable */}
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(capitalizeFirst(e.target.value))}
                    className="h-8 w-48 font-bold text-base"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editedName.trim()) {
                        handleSaveGroupName();
                      } else if (e.key === "Escape") {
                        setEditedName(group.name);
                        setIsEditingName(false);
                      }
                    }}
                    onBlur={handleSaveGroupName}
                  />
                </div>
              ) : (
                <div
                  className="group flex items-center gap-1.5 px-2 py-1 -my-1 rounded-md cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                    setEditedName(group.name);
                  }}
                >
                  <h3 className={cn(
                    "font-bold text-base group-hover:text-primary transition-colors",
                    !group.isActive && "text-muted-foreground"
                  )}>
                    {group.name}
                  </h3>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors duration-200" />
                </div>
              )}

              {/* Info badges */}
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                {group.complementCount} {group.complementCount === 1 ? "complemento" : "complementos"}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                {group.productCount} {group.productCount === 1 ? "produto" : "produtos"}
              </span>

              {group.isRequired ? (
                <span className="text-[10px] md:text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-lg font-medium">
                  Obrigatório
                </span>
              ) : (
                <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-lg font-medium">
                  Opcional
                </span>
              )}

              {!group.isActive && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg font-medium">
                  Pausado
                </span>
              )}
            </div>

            {/* Group actions */}
            <div className="flex items-center gap-1">
              {/* Pause/Play */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg hidden sm:inline-flex",
                      group.isActive
                        ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                        : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setToggleGroupDialogOpen(true);
                    }}
                    disabled={toggleGroupActiveMutation.isPending}
                  >
                    {group.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{group.isActive ? "Pausar grupo" : "Ativar grupo"}</TooltipContent>
              </Tooltip>

              {/* 3-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="sm:hidden" onClick={() => setToggleGroupDialogOpen(true)}>
                    {group.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar grupo
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ativar grupo
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir grupo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expand/Collapse */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="bg-muted/30 border-t border-border/30 px-3 md:px-5 py-3 md:py-4">
              {/* Group settings: Mín, Máx, Obrigatório */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Mín:</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={localMin === 0 ? '' : String(localMin)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      if (raw === '') {
                        handleUpdateMinMax("minQuantity", 0);
                        return;
                      }
                      const val = Math.min(parseInt(raw, 10), 999);
                      handleUpdateMinMax("minQuantity", val);
                    }}
                    onBlur={() => handleMinMaxBlur("minQuantity")}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.value = '';
                    }}
                    placeholder="0"
                    className="w-16 h-7 text-sm text-center rounded-md"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Máx:</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={localMax === 0 ? '' : String(localMax)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      if (raw === '') {
                        handleUpdateMinMax("maxQuantity", 0);
                        return;
                      }
                      const val = Math.min(parseInt(raw, 10), 999);
                      handleUpdateMinMax("maxQuantity", val);
                    }}
                    onBlur={() => handleMinMaxBlur("maxQuantity")}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.value = '';
                    }}
                    placeholder="0"
                    className="w-16 h-7 text-sm text-center rounded-md"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id={`required-global-${group.name}`}
                    checked={!!group.isRequired}
                    onChange={(e) => handleToggleRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <label htmlFor={`required-global-${group.name}`} className="text-xs font-medium cursor-pointer">
                    Obrigatório
                  </label>
                </div>
                <span className="text-[10px] text-muted-foreground italic hidden sm:inline">
                  (altera em todos os {group.productCount} produtos)
                </span>
              </div>

              {/* Items list with DnD */}
              {items.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Nenhum complemento neste grupo
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleItemDragEnd}
                >
                  <SortableContext
                    items={items.map((i: any) => `item-${i.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {items.map((item: any) => (
                        <SortableComplementItem
                          key={item.id}
                          item={item}
                          establishmentId={establishmentId}
                          onToggleActive={handleToggleItemActive}
                          onDeleteByName={handleDeleteItemByName}
                          onDeleteExclusive={handleDeleteExclusiveItem}
                          onUpdateItem={(id, data) => {
                            // If it's an exclusive item, update individually (not globally)
                            if (item.isExclusive) {
                              updateItemMutation.mutate({ id, ...data });
                              return;
                            }
                            // For non-exclusive items, ALL updates should propagate globally
                            // (name, price, priceMode, badge, availability, etc.)
                            const itemObj = items.find((i: any) => i.id === id);
                            if (itemObj) {
                              updateGlobalMutation.mutate({
                                establishmentId,
                                complementName: itemObj.name,
                                groupIds: group.groupIds,
                                ...(data.name ? { newName: data.name } : {}),
                                ...(data.price !== undefined ? { price: data.price } : {}),
                                ...(data.priceMode !== undefined ? { priceMode: data.priceMode } : {}),
                                ...(data.badgeText !== undefined ? { badgeText: data.badgeText } : {}),
                                ...(data.description !== undefined ? { description: data.description } : {}),
                                ...(data.availabilityType !== undefined ? { availabilityType: data.availabilityType } : {}),
                                ...(data.availableDays !== undefined ? { availableDays: data.availableDays } : {}),
                                ...(data.availableHours !== undefined ? { availableHours: data.availableHours } : {}),
                                ...(data.freeOnDelivery !== undefined ? { freeOnDelivery: data.freeOnDelivery } : {}),
                                ...(data.freeOnPickup !== undefined ? { freeOnPickup: data.freeOnPickup } : {}),
                                ...(data.freeOnDineIn !== undefined ? { freeOnDineIn: data.freeOnDineIn } : {}),
                                ...(data.hasStock !== undefined ? { hasStock: data.hasStock } : {}),
                                ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity } : {}),
                              });
                            } else {
                              // Fallback: update individual item
                              updateItemMutation.mutate({ id, ...data });
                            }
                          }}
                          isExpanded={expandedItemId === item.id}
                          onToggleExpand={() =>
                            setExpandedItemId((prev) => (prev === item.id ? null : item.id))
                          }
                          isUpdating={updateItemMutation.isPending || updateGlobalMutation.isPending}
                          productCount={group.productCount || 0}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Add item inline */}
              {addingItem ? (
                <div className="flex items-center gap-2 mt-3 flex-wrap md:flex-nowrap">
                  <Input
                    ref={itemNameInputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                    placeholder="Nome do complemento"
                    className="flex-1 min-w-[120px] h-7 text-sm rounded-md"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddItem();
                      if (e.key === "Escape") {
                        setAddingItem(false);
                        setNewItemName("");
                        setNewItemPrice("0,00");
                      }
                    }}
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-20 h-7 text-sm rounded-md text-right pl-7"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddItem();
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs rounded-md px-2"
                    onClick={handleAddItem}
                    disabled={!newItemName.trim() || addItemToGroupMutation.isPending}
                  >
                    {addItemToGroupMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs rounded-md px-2"
                    onClick={() => {
                      setAddingItem(false);
                      setNewItemName("");
                      setNewItemPrice("0,00");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingItem(true);
                    setNewItemName("");
                    setNewItemPrice("0,00");
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 mt-3 py-2 px-4 rounded-lg border-2 border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5 w-full transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar item
                </button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Excluir grupo "{group.name}"?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do grupo</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir grupo "{group.name}"?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Esta ação irá excluir o grupo <strong>"{group.name}"</strong> e todos os seus complementos de <strong>{group.productCount} produto(s)</strong>. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              >
                Excluir grupo
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Group Active Confirmation Dialog */}
      <AlertDialog open={toggleGroupDialogOpen} onOpenChange={setToggleGroupDialogOpen}>
        <AlertDialogContent
          className={cn("p-0 overflow-hidden border-t-4", group.isActive ? "border-t-orange-500" : "border-t-emerald-500")}
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">{group.isActive ? `Pausar grupo "${group.name}"?` : `Ativar grupo "${group.name}"?`}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de status do grupo</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", group.isActive ? "bg-orange-100 dark:bg-orange-950/50" : "bg-emerald-100 dark:bg-emerald-950/50")}>
                {group.isActive ? <Pause className="h-6 w-6 text-orange-600" /> : <Play className="h-6 w-6 text-emerald-600" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{group.isActive ? `Pausar grupo "${group.name}"?` : `Ativar grupo "${group.name}"?`}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {group.isActive
                    ? <>Esta ação irá <strong>pausar</strong> o grupo <strong>"{group.name}"</strong> e todos os seus complementos em <strong>{group.productCount} produto(s)</strong>. O grupo ficará indisponível para os clientes.</>
                    : <>Esta ação irá <strong>ativar</strong> o grupo <strong>"{group.name}"</strong> em <strong>{group.productCount} produto(s)</strong>. O grupo ficará disponível para os clientes.</>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleToggleGroupActive();
                  setToggleGroupDialogOpen(false);
                }}
                className={cn("flex-1 rounded-xl h-10 font-semibold text-white", group.isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600")}
              >
                {group.isActive ? "Pausar em todos" : "Ativar em todos"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Name Change Confirmation Dialog */}
      <AlertDialog open={!!pendingGroupNameDialog} onOpenChange={(open) => { if (!open) { setPendingGroupNameDialog(null); setEditedName(group.name); setIsEditingName(false); } }}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Renomear grupo "{group.name}"?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar renomeação do grupo</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <Pencil className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Renomear grupo "{group.name}"?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  O nome do grupo será alterado de <strong>"{group.name}"</strong> para <strong>"{pendingGroupNameDialog}"</strong> em <strong>{group.productCount} produto(s)</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingGroupNameDialog) {
                    updateGroupRulesMutation.mutate({
                      establishmentId,
                      groupName: group.name,
                      newName: pendingGroupNameDialog,
                    });
                    toast.success("Nome do grupo atualizado em todos os produtos");
                  }
                  setPendingGroupNameDialog(null);
                  setIsEditingName(false);
                }}
                className="flex-1 rounded-xl h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Renomear em todos
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Min/Max Change Confirmation Dialog */}
      <AlertDialog open={!!pendingMinMaxDialog} onOpenChange={(open) => { if (!open) { setPendingMinMaxDialog(null); setLocalMin(group.minQuantity ?? 0); setLocalMax(group.maxQuantity ?? 0); } }}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Alterar {pendingMinMaxDialog?.field === 'minQuantity' ? 'Mínimo' : 'Máximo'} do grupo?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de regra do grupo</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Alterar {pendingMinMaxDialog?.field === 'minQuantity' ? 'Mínimo' : 'Máximo'} do grupo "{group.name}"?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  O valor {pendingMinMaxDialog?.field === 'minQuantity' ? 'mínimo' : 'máximo'} será alterado de <strong>{pendingMinMaxDialog?.field === 'minQuantity' ? (group.minQuantity ?? 0) : (group.maxQuantity ?? 0)}</strong> para <strong>{pendingMinMaxDialog?.value ?? 0}</strong> em <strong>{group.productCount} produto(s)</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingMinMaxDialog) {
                    updateGroupRulesMutation.mutate({
                      establishmentId,
                      groupName: group.name,
                      [pendingMinMaxDialog.field]: pendingMinMaxDialog.value,
                    });
                    toast.success(`${pendingMinMaxDialog.field === 'minQuantity' ? 'Mínimo' : 'Máximo'} atualizado em todos os produtos`);
                  }
                  setPendingMinMaxDialog(null);
                }}
                className="flex-1 rounded-xl h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Alterar em todos
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Required Confirmation Dialog */}
      <AlertDialog open={pendingRequiredDialog !== null} onOpenChange={(open) => { if (!open) setPendingRequiredDialog(null); }}>
        <AlertDialogContent
          className={cn("p-0 overflow-hidden border-t-4", pendingRequiredDialog ? "border-t-red-500" : "border-t-blue-500")}
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">{pendingRequiredDialog ? `Tornar "${group.name}" obrigatório?` : `Tornar "${group.name}" opcional?`}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar alteração de obrigatoriedade</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", pendingRequiredDialog ? "bg-red-100 dark:bg-red-950/50" : "bg-blue-100 dark:bg-blue-950/50")}>
                <Settings className={cn("h-6 w-6", pendingRequiredDialog ? "text-red-500" : "text-blue-600")} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{pendingRequiredDialog ? `Tornar "${group.name}" obrigatório?` : `Tornar "${group.name}" opcional?`}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {pendingRequiredDialog
                    ? <>O grupo <strong>"{group.name}"</strong> será marcado como <strong>obrigatório</strong> em <strong>{group.productCount} produto(s)</strong>. Os clientes precisarão selecionar pelo menos 1 opção.</>
                    : <>O grupo <strong>"{group.name}"</strong> será marcado como <strong>opcional</strong> em <strong>{group.productCount} produto(s)</strong>. Os clientes poderão pular este grupo.</>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingRequiredDialog !== null) {
                    updateGroupRulesMutation.mutate({
                      establishmentId,
                      groupName: group.name,
                      isRequired: pendingRequiredDialog,
                    });
                    toast.success(pendingRequiredDialog ? "Grupo marcado como obrigatório em todos os produtos" : "Grupo marcado como opcional em todos os produtos");
                  }
                  setPendingRequiredDialog(null);
                }}
                className={cn("flex-1 rounded-xl h-10 font-semibold text-white", pendingRequiredDialog ? "bg-red-500 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-700")}
              >
                {pendingRequiredDialog ? "Tornar obrigatório" : "Tornar opcional"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---- Main Page Component ----
export default function Complementos() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const { searchQuery: searchTerm } = useSearch();
  const [expandedGroupName, setExpandedGroupName] = useState<string | null>(null);
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  const [howItWorksDismissed, setHowItWorksDismissed] = useState(() => {
    try { return localStorage.getItem('complementos_banner_dismissed') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    if (establishment?.id) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Query for all complement groups
  const { data: groups, isLoading } = trpc.complement.listAllGroups.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (!searchTerm.trim()) return groups;

    const term = searchTerm.toLowerCase().trim();
    return groups.filter((g: any) => {
      // Search in group name
      if (g.name.toLowerCase().includes(term)) return true;
      // Search in complement item names
      if (g.items?.some((item: any) => item.name.toLowerCase().includes(term))) return true;
      return false;
    });
  }, [groups, searchTerm]);

  // Loading state
  if (establishmentLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <TooltipProvider>
        <PageHeader
          title="Grupos de Complementos"
          description="Gerencie seus grupos de complementos. Alterações refletem em todos os produtos."
          icon={<Layers className="h-6 w-6 text-blue-600" />}
        />

        {/* Banner Como funciona */}
        {!howItWorksDismissed && (
          <div className="relative rounded-xl overflow-hidden mt-4 border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200/50 dark:border-red-500/30">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20\' fill=\'%23dc2626\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
            <div className="relative flex items-start gap-3 px-4 py-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30 dark:bg-red-500/20" />
                  <div className="relative p-2 rounded-full bg-red-100 dark:bg-red-500/40">
                    <HelpCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight">
                  Como funciona
                </p>
                <MobileExpandableText
                  className="text-xs text-muted-foreground leading-relaxed mt-1"
                  collapsedClassName="pr-[4.75rem]"
                  expandedClassName="space-y-0.5"
                  expandButtonClassName="text-red-500 dark:text-red-400 bg-orange-50 dark:bg-red-950/90"
                  desktopContent={(
                    <>
                      <p><strong className="text-foreground">Grupos:</strong> Crie um grupo de complementos (ex: "Molhos", "Adicionais") e vincule a vários produtos de uma vez. Alterações no grupo refletem automaticamente em todos os produtos vinculados.</p>
                      <p className="mt-0.5"><strong className="text-foreground">Pausar grupo:</strong> Desativa todos os complementos do grupo de uma vez. Útil quando um ingrediente acaba — com um clique, nenhum cliente consegue selecionar esses complementos.
                        {!howItWorksExpanded && (
                          <button
                            onClick={() => setHowItWorksExpanded(true)}
                            className="inline ml-1.5 text-red-500 dark:text-red-400 font-semibold hover:underline"
                          >
                            Ver mais
                          </button>
                        )}
                      </p>
                      {howItWorksExpanded && (
                        <>
                          <p className="mt-0.5"><strong className="text-foreground">Reativar grupo:</strong> Reativa o grupo e cada complemento volta ao status que tinha antes (ativo ou pausado individualmente).</p>
                          <p className="mt-0.5"><strong className="text-foreground">Mín/Máx/Obrigatório:</strong> Se você alterar a regra de seleção (ex: mínimo 1, máximo 3), a mudança vale para todos os produtos que usam esse grupo.</p>
                          <p className="mt-0.5"><strong className="text-foreground">Adicionar/Excluir complemento:</strong> Ao adicionar ou remover um item do grupo, a alteração aparece automaticamente em todos os produtos vinculados.</p>
                          <button
                            onClick={() => setHowItWorksExpanded(false)}
                            className="inline mt-1 text-red-500 dark:text-red-400 font-semibold text-xs hover:underline"
                          >
                            Ver menos
                          </button>
                        </>
                      )}
                    </>
                  )}
                >
                  <p><strong className="text-foreground">Grupos:</strong> Crie um grupo de complementos (ex: "Molhos", "Adicionais") e vincule a vários produtos de uma vez. Alterações no grupo refletem automaticamente em todos os produtos vinculados.</p>
                  <p><strong className="text-foreground">Pausar grupo:</strong> Desativa todos os complementos do grupo de uma vez. Útil quando um ingrediente acaba — com um clique, nenhum cliente consegue selecionar esses complementos.</p>
                  <p><strong className="text-foreground">Reativar grupo:</strong> Reativa o grupo e cada complemento volta ao status que tinha antes (ativo ou pausado individualmente).</p>
                  <p><strong className="text-foreground">Mín/Máx/Obrigatório:</strong> Se você alterar a regra de seleção (ex: mínimo 1, máximo 3), a mudança vale para todos os produtos que usam esse grupo.</p>
                  <p><strong className="text-foreground">Adicionar/Excluir complemento:</strong> Ao adicionar ou remover um item do grupo, a alteração aparece automaticamente em todos os produtos vinculados.</p>
                </MobileExpandableText>
              </div>
              <button
                onClick={() => {
                  setHowItWorksDismissed(true);
                  try { localStorage.setItem('complementos_banner_dismissed', 'true'); } catch {}
                }}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-200/50 dark:hover:bg-red-500/30 transition-colors"
                aria-label="Fechar banner"
              >
                <X className="h-4 w-4 text-red-500/70 dark:text-red-400/70" />
              </button>
            </div>
          </div>
        )}

        {/* Groups list */}
        {!filteredGroups || filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 mt-6">
            <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum grupo de complementos encontrado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchTerm ? "Tente buscar por outro termo" : "Os grupos de complementos cadastrados nos produtos aparecerão aqui. Adicione complementos a um produto no Catálogo para começar."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-6">
            {filteredGroups.map((group: any) => (
              <GroupCard
                key={group.name}
                group={group}
                establishmentId={establishmentId!}
                isExpanded={expandedGroupName === group.name}
                onToggleExpand={() =>
                  setExpandedGroupName((prev) => (prev === group.name ? null : group.name))
                }
              />
            ))}
          </div>
        )}


      </TooltipProvider>
    </AdminLayout>
  );
}
