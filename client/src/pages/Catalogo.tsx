import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { getThumbUrl } from "../../../shared/imageUtils";
import { BlurImage } from "@/components/BlurImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  UtensilsCrossed,
  Copy,
  Trash2,
  GripVertical,
  Check,
  X,
  Pencil,
  MoreVertical,
  Pause,
  Play,
  ChevronUp,
  ChevronDown,
  Layers,
  FolderPlus,
  Clock,
  CalendarClock,
  Camera,
  ImageOff,
  ArrowRight,
  Sparkles,
  Lock,
  Gift,
  Tag,
  Percent,
  Eye,
  Upload,
  RotateCcw,
  Loader2,
  Link2,
  ExternalLink,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useRef, useCallback, startTransition, type FocusEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { cn, capitalizeFirst } from "@/lib/utils";
import { useSearch } from "@/contexts/SearchContext";
import CreateComboSheet from "@/components/CreateComboSheet";
import CreateProductSheet from "@/components/CreateProductSheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import InlineComplementsDropdown from "@/components/InlineComplementsDropdown";
import CatalogVersionBar from "@/components/CatalogVersionBar";
import CategorySidebarCard from "@/components/CategorySidebarCard";
import ProductTypeSelector from "@/components/ProductTypeSelector";
import CreatePizzaCategorySheet from "@/components/CreatePizzaCategorySheet";
import PizzaCategoryContent from "@/components/PizzaCategoryContent";

// Sortable Product Item Component
const SortableProductItem = React.memo(function SortableProductItem({
  product,
  isDragDisabled,
  onToggleStatus,
  onDuplicate,
  onDelete,
  onEdit,
  onToggleUpsellPinned,
  formatCurrency,
  expandedComplementProductId,
  onToggleComplements,
  onUpdateInline,
  establishmentId,
  menuSlug,
  categoryIsActive = true,
  onOpenPromo,
  isReadOnly = false,
}: {
  product: any;
  isDragDisabled: boolean;
  onToggleStatus: (id: number, status: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onToggleUpsellPinned?: (id: number) => void;
  formatCurrency: (value: string | number) => string;
  expandedComplementProductId: number | null;
  onToggleComplements: (id: number) => void;
  onUpdateInline?: (id: number, data: { price?: string; stockQuantity?: number | null; hasStock?: boolean }) => void;
  establishmentId?: number;
  menuSlug?: string;
  categoryIsActive?: boolean;
  onOpenPromo?: (product: any) => void;
  isReadOnly?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled: isDragDisabled || isReadOnly });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const isComplementsOpen = expandedComplementProductId === product.id;

  const copyPublishedProductLink = async () => {
    if (!menuSlug) {
      toast.error("Não foi possível gerar o link do produto");
      return;
    }

    const productLink = `${window.location.origin}/menu/${menuSlug}?produto=${product.id}`;

    try {
      await navigator.clipboard.writeText(productLink);
      toast.success("Link do produto copiado!");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = productLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Link do produto copiado!");
    }
  };

  // Status efetivo: respeitar status real do produto, exceto se bloqueado pelo plano
  const isPlanBlocked = !!product.planBlocked;
  const effectiveStatus = isPlanBlocked ? 'paused' : product.status;

  // Inline editable fields state
  const formatPriceBR = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    const reais = str.slice(0, -2);
    const centavos = str.slice(-2);
    return `${reais},${centavos}`;
  };

  const priceToCents = (price: string | number) => Math.round(Number(price) * 100);

  const [priceCents, setPriceCents] = useState(product.price ? priceToCents(product.price) : 0);
  const [localStock, setLocalStock] = useState(product.hasStock && product.stockQuantity !== null ? String(product.stockQuantity) : '');
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

  // Sync local state when product changes from server
  useEffect(() => {
    setPriceCents(product.price ? priceToCents(product.price) : 0);
    setLocalStock(product.hasStock && product.stockQuantity !== null ? String(product.stockQuantity) : '');
  }, [product.price, product.stockQuantity, product.hasStock]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const cents = parseInt(raw, 10) || 0;
    setPriceCents(cents);
  };

  const handlePriceBlur = () => {
    const newPrice = priceCents / 100;
    if (newPrice !== Number(product.price)) {
      onUpdateInline?.(product.id, { price: newPrice.toFixed(2) });
    }
  };

  const handleStockBlur = () => {
    const parsed = parseInt(localStock, 10);
    if (localStock === '' && product.hasStock) {
      // User cleared stock - disable stock control
      onUpdateInline?.(product.id, { hasStock: false, stockQuantity: null });
    } else if (!isNaN(parsed) && (parsed !== product.stockQuantity || !product.hasStock)) {
      onUpdateInline?.(product.id, { hasStock: true, stockQuantity: parsed });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "shadow-lg rounded-lg border border-border/50"
      )}
    >
      <div
        style={{ height: '60px' }}
        className={cn(
          "flex items-center gap-3.5 p-3.5 transition-colors",
          effectiveStatus === "active"
            ? "hover:bg-muted/30 bg-card"
            : "bg-muted/40"
        )}
      >
        {!isDragDisabled && !isReadOnly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  "cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none",
                  effectiveStatus !== "active" && "opacity-50"
                )}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Arraste para reordenar</TooltipContent>
          </Tooltip>
        )}
        {/* Área clicável para edição */}
        <div 
          className={cn(
            "flex items-center gap-3 flex-1 min-w-0 transition-opacity",
            !isReadOnly && "cursor-pointer hover:opacity-80",
            effectiveStatus !== "active" && "opacity-50"
          )}
          onClick={() => !isReadOnly && onEdit(product.id)}
        >
          <div
            className={cn(
              "hidden md:flex h-12 w-12 rounded-lg items-center justify-center overflow-hidden flex-shrink-0 relative",
              effectiveStatus === "active"
                ? "bg-gradient-to-br from-red-500 to-red-500"
                : "bg-gradient-to-br from-gray-400 to-gray-500 grayscale"
            )}>
            {product.images && product.images.length > 0 ? (
              <>
                <BlurImage
                  src={product.images[0]}
                  blurDataUrl={product.blurPlaceholder}
                  alt={product.name}
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover"
                  responsive
                  sizes="48px"
                />
                {product.enhancedImages && (product.enhancedImages as string[]).some(img => img && img.length > 0) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-0 right-0 bg-red-500 rounded-bl-md rounded-tr-lg p-0.5 cursor-default">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Foto aprimorada com Mindi Vision</TooltipContent>
                  </Tooltip>
                )}
              </>
            ) : (
              <Camera className="h-5 w-5 text-white animate-placeholder-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={cn(
                "font-semibold text-base truncate",
                effectiveStatus !== "active" && "text-muted-foreground"
              )}>{product.name}</h4>

              {isPlanBlocked && (
                <StatusBadge variant="warning">Bloqueado pelo plano</StatusBadge>
              )}
              {!isPlanBlocked && product.hasStock && product.stockQuantity !== null && product.stockQuantity <= 0 && (
                <StatusBadge variant="error">Sem estoque</StatusBadge>
              )}

            </div>
            {/* Mobile: preço abaixo do nome */}
            {Number(product.price) > 0 && (
              <div className="md:hidden flex items-center gap-1.5 mt-0.5">
                {product.promotionalPrice ? (
                  <>
                    <span className="text-sm font-medium text-primary">{formatCurrency(product.promotionalPrice)}</span>
                    <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                    <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1 py-0.5">
                      -{Math.round((1 - Number(product.promotionalPrice) / Number(product.price)) * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-primary">{formatCurrency(product.price)}</span>
                )}
              </div>
            )}
            {product.description && (
              <p className="hidden md:block text-sm text-muted-foreground truncate mt-1">
                {product.description}
              </p>
            )}
          </div>
        </div>
        {/* Botão Complementos (desktop) + seta (mobile) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Desktop: botão texto "Complementos" */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-lg text-xs font-medium px-2.5 hidden md:inline-flex",
              isComplementsOpen
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20",
              effectiveStatus !== "active" && "opacity-50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplements(product.id);
            }}
          >
            {product.complementCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                {product.complementCount}
              </span>
            )}
            Complementos
            {isComplementsOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </Button>
          {/* Mobile: ícone seta */}
          <div className={cn("relative md:hidden", effectiveStatus !== "active" && "opacity-50")}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg",
                isComplementsOpen
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplements(product.id);
              }}
            >
              {isComplementsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {product.complementCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded-full bg-primary text-white text-[9px] font-bold">
                {product.complementCount}
              </span>
            )}
          </div>
          {/* Desktop: Estoque + Preço editáveis inline */}
          <div className={cn("hidden md:flex items-center gap-2 flex-shrink-0", effectiveStatus !== "active" && "opacity-50")}>
            <input
              ref={stockRef}
              type="text"
              inputMode="numeric"
              value={localStock}
              placeholder="Estoque"
              readOnly={isReadOnly}
              onChange={(e) => !isReadOnly && setLocalStock(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={!isReadOnly ? handleStockBlur : undefined}
              onKeyDown={(e) => { if (e.key === 'Enter') stockRef.current?.blur(); }}
              onClick={(e) => e.stopPropagation()}
              className={cn("w-[77px] h-8 text-sm text-center font-medium rounded-lg border border-border/60 bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-colors", !isReadOnly && "focus:ring-2 focus:ring-primary/30 focus:border-primary/50", isReadOnly && "cursor-default")} style={{paddingRight: '7px', paddingLeft: '7px'}}
            />
            {product.promotionalPrice ? (
              /* Quando tem promoção: tudo em um único container — preço original cinza | preço promo | tag */
              <div className="flex items-center h-8 rounded-lg border transition-colors border-red-300 bg-red-50">
                <span className="pl-2 pr-1 text-xs text-muted-foreground line-through whitespace-nowrap">R$ {formatPriceBR(priceToCents(product.price))}</span>
                <span className="border-l border-red-200 pl-2 pr-0.5 text-sm text-red-500 font-medium pointer-events-none">R$</span>
                <span className="w-[52px] text-sm text-right font-semibold text-red-500 pr-1">{formatPriceBR(priceToCents(product.promotionalPrice))}</span>
                {!isReadOnly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="h-full px-1.5 flex items-center justify-center border-l transition-colors rounded-r-lg border-red-300 text-red-500 hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPromo?.(product);
                        }}
                      >
                        <Tag className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Editar preço promocional</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ) : (
              /* Quando não tem promoção: campo editável normal + tag */
              <div className="flex items-center h-8 rounded-lg border transition-colors border-border/60 bg-muted/30">
                <span className="pl-2.5 text-sm text-primary font-medium pointer-events-none">R$</span>
                <input
                  ref={priceRef}
                  type="text"
                  inputMode="numeric"
                  value={formatPriceBR(priceCents)}
                  readOnly={isReadOnly}
                  onChange={!isReadOnly ? handlePriceChange : undefined}
                  onBlur={!isReadOnly ? handlePriceBlur : undefined}
                  onKeyDown={(e) => { if (e.key === 'Enter') priceRef.current?.blur(); }}
                  onClick={(e) => e.stopPropagation()}
                  className={cn("w-[60px] h-full bg-transparent pr-1 text-sm text-right font-semibold text-primary focus:outline-none", isReadOnly && "cursor-default")}
                />
                {!isReadOnly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="h-full px-1.5 flex items-center justify-center border-l transition-colors rounded-r-lg border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPromo?.(product);
                        }}
                      >
                        <Tag className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Aplicar preço promocional</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
          {/* Botão Pausar/Play igual ao da categoria */}
          {!isReadOnly && (
            <>
              {isPlanBlocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-lg border border-amber-300 bg-amber-50 flex items-center justify-center cursor-not-allowed">
                      <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Bloqueado pelo plano — faça upgrade para ativar</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-lg",
                        effectiveStatus === "active"
                          ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                          : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-100"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(product.id, product.status);
                      }}
                    >
                      {effectiveStatus === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{effectiveStatus === "active" ? "Pausar item" : "Ativar item"}</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
          {/* Menu 3 pontinhos sem estilo de botão */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn("p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground", effectiveStatus !== "active" && "opacity-50")}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4.5 w-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isReadOnly ? (
                <DropdownMenuItem onClick={copyPublishedProductLink}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copiar link
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(product.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Inline Complements Dropdown */}
      <InlineComplementsDropdown
        productId={product.id}
        establishmentId={establishmentId}
        isOpen={isComplementsOpen}
        onClose={() => onToggleComplements(product.id)}
        isReadOnly={isReadOnly}
      />
    </div>
  );
});


// Droppable Category Drop Zone Component
function CategoryDropZone({ categoryId, categoryName, isActive }: { categoryId: number | null; categoryName: string; isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-drop-${categoryId ?? 0}`,
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 border-b text-center text-sm font-medium transition-colors duration-200",
        isOver 
          ? "bg-green-100 border-green-400 text-green-700" 
          : "bg-primary/10 border-primary/20 text-primary"
      )}
    >
      {isOver ? `Soltar em "${categoryName}"` : `Solte aqui para mover para "${categoryName}"`}
    </div>
  );
}

// Sortable Category Item Component - wraps the entire category card to make it draggable
const SortableCategoryItem = React.memo(function SortableCategoryItem({
  category,
  categoryProducts,
  isDropTarget,
  isDraggingCategory,
  isCollapsed,
  isEditing,
  editingName,
  hasActiveFilters,
  onToggleCategoryCollapse,
  onStartEditing,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onToggleCategoryStatus,
  onDuplicateCategory,
  onDeleteCategory,
  onCreateCombo,
  onCreateProduct,
  onSchedule,
  onToggleUpsell,
  onBatchPromo,
  toggleCategoryStatusPending,
  updateCategoryPending,
  duplicateCategoryPending,
  children,
  isReadOnly = false,
}: {
  category: any;
  categoryProducts: any[];
  isDropTarget: boolean;
  isDraggingCategory: boolean;
  isCollapsed: boolean;
  isEditing: boolean;
  editingName: string;
  hasActiveFilters: boolean;
  onToggleCategoryCollapse: (id: number) => void;
  onStartEditing: (id: number, name: string) => void;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: (id: number, name: string) => void;
  onCancelEdit: () => void;
  onToggleCategoryStatus: (id: number, isActive: boolean) => void;
  onDuplicateCategory: (id: number) => void;
  onDeleteCategory: (id: number, name: string, productCount: number) => void;
  onCreateCombo: (categoryId: number, categoryName: string) => void;
  onCreateProduct: (categoryId: number) => void;
  onSchedule: (category: any) => void;
  onToggleUpsell?: (id: number) => void;
  onBatchPromo?: (categoryId: number, categoryName: string) => void;
  toggleCategoryStatusPending: boolean;
  updateCategoryPending: boolean;
  duplicateCategoryPending: boolean;
  children: React.ReactNode;
  isReadOnly?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `cat-${category.id}`,
    disabled: hasActiveFilters || isReadOnly,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: isDragging ? 'relative' as const : undefined,
  };

  // Se todos os itens da categoria estão pausados, considerar a categoria como efetivamente pausada
  const allItemsPaused = categoryProducts.length > 0 && categoryProducts.every((p: any) => p.status !== 'active');
  const isCategoryPlanBlocked = !!category.planBlocked;
  const effectiveIsActive = isCategoryPlanBlocked ? false : (category.isActive && !allItemsPaused);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-category-id={category.id}
      className={cn(
        "bg-card rounded-xl border border-border/50 overflow-hidden",
        isDropTarget && "ring-2 ring-primary/50 ring-offset-2",
        "border-t-4 border-t-red-500",
        isDragging && "shadow-2xl ring-2 ring-primary/30"
      )}
    >
      {/* Drop zone for this category - hidden during category drag */}
      {!isDraggingCategory && (
        <CategoryDropZone 
          categoryId={category.id} 
          categoryName={category.name} 
          isActive={isDropTarget} 
        />
      )}
      <div
        className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20 cursor-pointer select-none"
        style={{height: '52px'}}
        onClick={() => onToggleCategoryCollapse(category.id)}
      >
        {/* Drag handle + title area */}
        <div className="flex items-center gap-1.5">
          {/* GripVertical drag handle for category */}
          {!hasActiveFilters && !isReadOnly && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editingName}
                onChange={(e) => onEditingNameChange(capitalizeFirst(e.target.value))}
                className="h-8 w-48 font-bold text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editingName.trim()) {
                    onSaveEdit(category.id, editingName.trim());
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                onClick={() => {
                  if (editingName.trim()) {
                    onSaveEdit(category.id, editingName.trim());
                  }
                }}
                disabled={!editingName.trim() || updateCategoryPending}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-500 hover:bg-red-100"
                onClick={onCancelEdit}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "group flex items-center gap-1.5 px-2 py-1 -my-1 rounded-md transition-colors duration-200",
                  !isReadOnly && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReadOnly) onStartEditing(category.id, category.name);
                }}
              >
                <h3 className={cn(
                  "font-bold text-base transition-colors",
                  !isReadOnly && "group-hover:text-primary",
                  !effectiveIsActive && "text-muted-foreground line-through"
                )}>
                  {category.name}
                </h3>
                {!isReadOnly && (
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors duration-200" />
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium hidden md:inline">
                {categoryProducts.length} {categoryProducts.length === 1 ? "ítem" : "ítens"}
              </span>
              {category.availabilityType === "scheduled" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-[4px] rounded-lg font-medium cursor-default">
                      <CalendarClock className="h-3 w-3" />
                      Agendado
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Categoria agendada para horários específicos</TooltipContent>
                </Tooltip>
              )}
              {!effectiveIsActive && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg font-medium">{allItemsPaused && category.isActive ? 'Todos pausados' : 'Pausada'}</span>
              )}

            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isReadOnly && (
            <>
          {/* Botão Criar Combo - hidden on mobile */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 hover:border-red-200 px-3 hidden sm:inline-flex"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCombo(category.id, category.name);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            Criar Combo
          </Button>
          {/* Botão Promo em Lote - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg hidden sm:inline-flex",
                  categoryProducts.some((p: any) => p.promotionalPrice && Number(p.promotionalPrice) > 0)
                    ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100"
                    : "text-muted-foreground hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onBatchPromo?.(category.id, category.name);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {categoryProducts.some((p: any) => p.promotionalPrice && Number(p.promotionalPrice) > 0)
                ? "Editar promoção da categoria"
                : "Aplicar promoção na categoria"}
            </TooltipContent>
          </Tooltip>
          {/* Botão Pausar/Play - hidden on mobile */}
          {isCategoryPlanBlocked ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-lg border border-amber-300 bg-amber-50 hidden sm:flex items-center justify-center cursor-not-allowed">
                  <Lock className="h-4 w-4 text-amber-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Categoria bloqueada pelo plano — faça upgrade</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg hidden sm:inline-flex",
                    effectiveIsActive
                      ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                      : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCategoryStatus(category.id, !category.isActive);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={toggleCategoryStatusPending}
                >
                  {effectiveIsActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{effectiveIsActive ? "Pausar categoria" : "Ativar categoria"}</TooltipContent>
            </Tooltip>
          )}
          {/* Botão 3 pontinhos - Duplicar/Remover */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Mobile-only: Pausar/Ativar e Criar Combo */}
              {isCategoryPlanBlocked ? (
                <DropdownMenuItem
                  className="sm:hidden"
                  disabled
                >
                  <Lock className="h-4 w-4 mr-2 text-amber-600" />Bloqueada pelo plano
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => onToggleCategoryStatus(category.id, !category.isActive)}
                  disabled={toggleCategoryStatusPending}
                >
                  {effectiveIsActive ? (
                    <><Pause className="h-4 w-4 mr-2" />Pausar categoria</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" />Ativar categoria</>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="sm:hidden"
                onClick={() => onCreateCombo(category.id, category.name)}
              >
                <Layers className="h-4 w-4 mr-2" />
                Criar Combo
              </DropdownMenuItem>
              <DropdownMenuItem
                className="sm:hidden"
                onClick={() => onBatchPromo?.(category.id, category.name)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Promoção em lote
              </DropdownMenuItem>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                onClick={() => onSchedule(category)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Agendar disponibilidade
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDuplicateCategory(category.id)}
                disabled={duplicateCategoryPending}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar categoria
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteCategory(category.id, category.name, categoryProducts.length)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover categoria
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </>
          )}
          {/* Botão Minimizar/Expandir */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCategoryCollapse(category.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCollapsed ? "Expandir itens" : "Minimizar itens"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Products list - hidden when collapsed or when dragging categories */}
      {!isCollapsed && !isDraggingCategory && (
        <>
          {children}
          {categoryProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">Nenhum produto nesta categoria</p>
              {!isReadOnly && (
                <Button
                  size="sm"
                  className="rounded-lg text-xs font-medium bg-red-500 hover:bg-red-500 text-white"
                  onClick={() => onCreateProduct(category.id)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Produto
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default function Catalogo() {
  const [, navigate] = useLocation();
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [catalogVersion, setCatalogVersion] = useState<"draft" | "published">("draft");

  // Filters - use global search from topbar + local mobile search
  const { searchQuery: globalSearch, setSearchQuery: setGlobalSearch } = useSearch();
  const [mobileSearch, setMobileSearch] = useState("");
  // Combine global search (topbar) with local mobile search
  const search = globalSearch || mobileSearch;
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("sortOrder");
  const [filterNoPhoto, setFilterNoPhoto] = useState(false);

  // Banner dismissed preference from database
  const { data: bannerPref } = trpc.preferences.get.useQuery(
    { key: "dismiss_no_photo_banner", establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );
  const bannerDismissed = bannerPref?.value === "true";
  const dismissBannerMutation = trpc.preferences.set.useMutation();

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string; productCount: number } | null>(null);
  
  // Mobile publish/discard dialog state
  const [mobilePublishDialogOpen, setMobilePublishDialogOpen] = useState(false);
  const [mobilePublishSuccessOpen, setMobilePublishSuccessOpen] = useState(false);
  const [mobileLinkCopied, setMobileLinkCopied] = useState(false);
  const mobileMenuUrl = establishment?.menuSlug ? `${window.location.origin}/menu/${establishment.menuSlug}` : null;
  const [mobileDiscardDialogOpen, setMobileDiscardDialogOpen] = useState(false);

  // Category scheduling dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingCategory, setSchedulingCategory] = useState<any>(null);
  const [schedAvailabilityType, setSchedAvailabilityType] = useState<"always" | "scheduled">("always");
  const [schedSelectedDays, setSchedSelectedDays] = useState<number[]>([]);
  const [schedHoursConfig, setSchedHoursConfig] = useState<{ day: number; startTime: string; endTime: string }[]>([]);

  // Combo Sheet state
  const [comboSheetOpen, setComboSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [productSheetDefaultCategoryId, setProductSheetDefaultCategoryId] = useState<number | undefined>(undefined);
  // Product type selector state
  const [productTypeSelectorOpen, setProductTypeSelectorOpen] = useState(false);
  const [pizzaCategorySheetOpen, setPizzaCategorySheetOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | undefined>(undefined);
  const [comboSheetCategoryId, setComboSheetCategoryId] = useState<number>(0);
  const [comboSheetCategoryName, setComboSheetCategoryName] = useState("");

  // Promo price sheet state
  const [promoSheetOpen, setPromoSheetOpen] = useState(false);
  const [promoProduct, setPromoProduct] = useState<any>(null);
  const [promoPrice, setPromoPrice] = useState("");
  const [promoPercent, setPromoPercent] = useState("");
  const [promoLastEdited, setPromoLastEdited] = useState<"price" | "percent">("price");

  // Batch promo state
  const [batchPromoOpen, setBatchPromoOpen] = useState(false);
  const [batchPromoCategoryId, setBatchPromoCategoryId] = useState<number | null>(null);
  const [batchPromoCategoryName, setBatchPromoCategoryName] = useState("");
  const [batchPromoPercent, setBatchPromoPercent] = useState("");
  
  // Local state for drag and drop
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [localProductsByCategory, setLocalProductsByCategory] = useState<Record<number, any[]>>({});
  
  // Sidebar category selection state
  const [selectedSidebarCategoryId, setSelectedSidebarCategoryId] = useState<number | null>(null);

  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  
  // Drag between categories state
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [activeProductCategoryId, setActiveProductCategoryId] = useState<number | null>(null);
  
  // Inline complements dropdown state
  const [expandedComplementProductId, setExpandedComplementProductId] = useState<number | null>(null);
  const handleToggleComplements = useCallback((productId: number) => {
    setExpandedComplementProductId(prev => prev === productId ? null : productId);
  }, []);

  // Category drag state
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const preCollapseStateRef = useRef<Set<number> | null>(null);
  
  // Collapsed categories state (persisted in localStorage)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('collapsedCategories');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  
  const toggleCategoryCollapse = useCallback((categoryId: number) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      localStorage.setItem('collapsedCategories', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // Check if filters are active (disable drag when filters are active)
  const hasActiveFilters: boolean = !!(search || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all" || orderBy !== "sortOrder" || filterNoPhoto);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Auto-open new category dialog or product sheet when coming from onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'new-category') {
      setCategoryDialogOpen(true);
      // Clean up the URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.pathname);
    } else if (action === 'new-product') {
      setProductSheetOpen(true);
      // Clean up the URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries - MUST be called before any early return
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId!, version: catalogVersion },
    { enabled: !!establishmentId }
  );

  const { data: productsData, isLoading } = trpc.product.list.useQuery(
    {
      establishmentId: establishmentId!,
      version: catalogVersion,
      search: search || undefined,
      categoryId: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
      status: statusFilter !== "all" ? statusFilter as "active" | "paused" | "archived" : undefined,
      hasStock: stockFilter === "inStock" ? true : stockFilter === "outOfStock" ? false : undefined,
      orderBy: orderBy === "name" ? "name" : orderBy === "price" ? "price" : orderBy === "salesCount" ? "salesCount" : undefined,
    },
    { enabled: !!establishmentId }
  );

  // Sync local state with server data
  useEffect(() => {
    if (categories) {
      setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [categories]);

  useEffect(() => {
    if (productsData?.products) {
      let filteredProducts = productsData.products;
      
      // Apply no-photo filter if active
      if (filterNoPhoto) {
        filteredProducts = filteredProducts.filter(p => !p.images || p.images.length === 0);
      }
      
      const grouped = filteredProducts.reduce((acc, product) => {
        const categoryId = product.categoryId || 0;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(product);
        return acc;
      }, {} as Record<number, typeof productsData.products>);
      
      // Sort products within each category by sortOrder
      Object.keys(grouped).forEach(catId => {
        grouped[Number(catId)].sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder);
      });
      
      setLocalProductsByCategory(grouped);
    }
  }, [productsData, filterNoPhoto]);

  // Scroll restoration: when returning from product edit, scroll to the category
  useEffect(() => {
    const scrollCategoryId = sessionStorage.getItem('catalogo_scroll_category');
    if (scrollCategoryId && productsData?.products && localCategories.length > 0) {
      sessionStorage.removeItem('catalogo_scroll_category');
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.querySelector(`[data-category-id="${scrollCategoryId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Adjust for fixed header offset
            setTimeout(() => {
              window.scrollBy({ top: -80, behavior: 'smooth' });
            }, 300);
          }
        }, 100);
      });
    }
  }, [productsData, localCategories]);

  // Mutations - MUST be called before any early return
  const catalogoUtils = trpc.useUtils();

  // Stats query for mobile publish/discard buttons
  const { data: versionStats } = trpc.catalogVersion.stats.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 120000 }
  );
  const hasPendingChanges = versionStats?.hasPendingChanges ?? false;

  const markCatalogStatsAsSynced = useCallback((counts: { categories: number; products: number }) => {
    if (!establishmentId) return;

    catalogoUtils.catalogVersion.stats.setData({ establishmentId }, (current) => {
      const draft = current?.draft ?? counts;
      const published = { categories: draft.categories, products: draft.products };
      return { draft, published, hasPendingChanges: false };
    });
  }, [catalogoUtils, establishmentId]);

  // Mobile publish/discard mutations
  const mobilePublishMutation = trpc.catalogVersion.publish.useMutation({
    onSuccess: (data) => {
      markCatalogStatsAsSynced(data.published);
      catalogoUtils.catalogVersion.stats.invalidate({ establishmentId: establishmentId! });
      catalogoUtils.category.list.invalidate();
      catalogoUtils.product.list.invalidate();
      setMobilePublishDialogOpen(false);
      setMobilePublishSuccessOpen(true);
    },
    onError: (err) => toast.error(`Erro ao publicar: ${err.message}`),
  });

  const mobileDiscardMutation = trpc.catalogVersion.discardDraft.useMutation({
    onSuccess: (data) => {
      markCatalogStatsAsSynced(data.restored);
      catalogoUtils.catalogVersion.stats.invalidate({ establishmentId: establishmentId! });
      catalogoUtils.category.list.invalidate();
      catalogoUtils.product.list.invalidate();
      setMobileDiscardDialogOpen(false);
      toast.success(
        `Rascunho descartado! ${data.restored.categories} categorias e ${data.restored.products} produtos restaurados.`,
        { duration: 5000 }
      );
    },
    onError: (err) => toast.error(`Erro ao descartar: ${err.message}`),
  });

  const toggleStatusMutation = trpc.product.toggleStatus.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await catalogoUtils.product.list.cancel();
      // Optimistically update local state
      setLocalProductsByCategory(prev => {
        const updated = { ...prev };
        for (const catId of Object.keys(updated)) {
          updated[Number(catId)] = updated[Number(catId)].map((p: any) =>
            p.id === variables.id ? { ...p, status: variables.status } : p
          );
        }
        return updated;
      });
    },
    onSuccess: () => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success("Status atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
      catalogoUtils.product.list.invalidate();
    },
  });

  const duplicateMutation = trpc.product.duplicate.useMutation({
    onSuccess: () => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success("Produto duplicado");
    },
    onError: () => toast.error("Erro ao duplicar produto"),
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.success("Produto excluído");
    },
    onError: () => toast.error("Erro ao excluir produto"),
  });

  const createCategoryMutation = trpc.category.create.useMutation({
    onSuccess: (data) => {
      catalogoUtils.category.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      catalogoUtils.dashboard.onboardingChecklist.invalidate();
      setCategoryDialogOpen(false);
      setNewCategoryName("");
      toast.success("Categoria criada");
      // Auto-scroll to the new category after it renders
      const newCatId = data?.id;
      if (newCatId) {
        setTimeout(() => {
          const el = document.querySelector(`[data-category-id="${newCatId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // Fallback: scroll to bottom
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }
        }, 600);
      } else {
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 500);
      }
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const reorderCategoriesMutation = trpc.category.reorder.useMutation({
    onSuccess: () => {
      catalogoUtils.catalogVersion.stats.invalidate();
    },
    onError: () => {
      toast.error("Erro ao reordenar categorias");
      // Revert on error
      if (categories) {
        setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    },
  });

  const reorderProductsMutation = trpc.product.reorder.useMutation({
    onSuccess: () => {
      catalogoUtils.catalogVersion.stats.invalidate();
    },
    onError: () => {
      toast.error("Erro ao reordenar produtos");
      catalogoUtils.product.list.invalidate();
    },
  });

  const updateCategoryMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      catalogoUtils.category.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      setEditingCategoryId(null);
      setEditingCategoryName("");
      toast.success("Categoria atualizada");
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });

  const deleteCategoryMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      catalogoUtils.category.list.invalidate();
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      setCategoryToDelete(null);
      setDeleteCategoryDialogOpen(false);
      toast.success("Categoria excluída com sucesso");
    },
    onError: () => toast.error("Erro ao excluir categoria"),
  });

  const duplicateCategoryMutation = trpc.category.duplicate.useMutation({
    onSuccess: () => {
      catalogoUtils.category.list.invalidate();
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success("Categoria duplicada com sucesso");
    },
    onError: () => toast.error("Erro ao duplicar categoria"),
  });

  const toggleCategoryStatusMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      catalogoUtils.category.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success("Status da categoria atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status da categoria"),
  });

  const scheduleCategoryMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      catalogoUtils.category.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      setScheduleDialogOpen(false);
      setSchedulingCategory(null);
      toast.success("Disponibilidade da categoria atualizada");
    },
    onError: () => toast.error("Erro ao atualizar disponibilidade"),
  });



  const DAYS_OF_WEEK = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sab" },
  ];

  const isFreePlan = establishment?.planType === 'trial' || establishment?.planType === 'free';

  const openScheduleDialog = useCallback((cat: any) => {
    if (isFreePlan) {
      toast.error('Assine um plano para liberar este recurso');
      return;
    }
    setSchedulingCategory(cat);
    setSchedAvailabilityType(cat.availabilityType || "always");
    setSchedSelectedDays(cat.availableDays || []);
    setSchedHoursConfig(cat.availableHours || []);
    setScheduleDialogOpen(true);
  }, [isFreePlan]);

  const handleSaveSchedule = useCallback(() => {
    if (!schedulingCategory) return;
    scheduleCategoryMutation.mutate({
      id: schedulingCategory.id,
      availabilityType: schedAvailabilityType,
      availableDays: schedAvailabilityType === "scheduled" ? schedSelectedDays : null,
      availableHours: schedAvailabilityType === "scheduled" ? schedHoursConfig : null,
    });
  }, [schedulingCategory, schedAvailabilityType, schedSelectedDays, schedHoursConfig]);

  const toggleSchedDay = useCallback((day: number) => {
    setSchedSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }, []);

  const updateSchedHoursForDay = useCallback((day: number, startTime: string, endTime: string) => {
    setSchedHoursConfig((prev) => {
      const filtered = prev.filter((h) => h.day !== day);
      return [...filtered, { day, startTime, endTime }].sort((a, b) => a.day - b.day);
    });
  }, []);

  // Handle sidebar category selection - scroll to category in main content
  const handleSidebarCategorySelect = useCallback((categoryId: number | null) => {
    setSelectedSidebarCategoryId(categoryId);
    if (categoryId === null) {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    const el = document.querySelector(`[data-category-id="${categoryId}"]`) as HTMLElement | null;
    const mainEl = document.querySelector('main');
    if (el && mainEl) {
      // Calculate the element's position relative to the main scrollable container
      const mainRect = mainEl.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - mainRect.top + mainEl.scrollTop - 16;
      mainEl.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
    }
  }, []);

  // Mutation para mover produto entre categorias
  const moveProductCategoryMutation = trpc.product.update.useMutation({
    onMutate: async (variables) => {
      await catalogoUtils.product.list.cancel();
      // Optimistically move product between categories in local state
      if (variables.categoryId !== undefined) {
        setLocalProductsByCategory(prev => {
          const updated = { ...prev };
          let movedProduct: any = null;
          // Remove from old category
          for (const catId of Object.keys(updated)) {
            const idx = updated[Number(catId)].findIndex((p: any) => p.id === variables.id);
            if (idx !== -1) {
              movedProduct = { ...updated[Number(catId)][idx], categoryId: variables.categoryId };
              updated[Number(catId)] = updated[Number(catId)].filter((_: any, i: number) => i !== idx);
              break;
            }
          }
          // Add to new category
          if (movedProduct && variables.categoryId != null) {
            const targetCatId = variables.categoryId;
            if (!updated[targetCatId]) updated[targetCatId] = [];
            updated[targetCatId] = [...updated[targetCatId], movedProduct];
          }
          return updated;
        });
      }
    },
    onSuccess: () => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success("Produto movido para nova categoria");
    },
    onError: () => {
      toast.error("Erro ao mover produto");
      catalogoUtils.product.list.invalidate();
    },
  });

  // Mutation para atualização inline (preço/estoque)
  const inlineUpdateMutation = trpc.product.update.useMutation({
    onMutate: async (variables) => {
      await catalogoUtils.product.list.cancel();
      // Optimistically update local state
      setLocalProductsByCategory(prev => {
        const updated = { ...prev };
        for (const catId of Object.keys(updated)) {
          updated[Number(catId)] = updated[Number(catId)].map((p: any) =>
            p.id === variables.id ? { ...p, ...variables } : p
          );
        }
        return updated;
      });
    },
    onSuccess: () => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
      catalogoUtils.product.list.invalidate();
    },
  });

  const handleInlineUpdate = useCallback((id: number, data: { price?: string; stockQuantity?: number | null; hasStock?: boolean }) => {
    inlineUpdateMutation.mutate({ id, ...data });
  }, [inlineUpdateMutation]);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  // Promo price helpers
  const formatPriceInputLocal2 = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parsePriceToNumber = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const handleOpenPromo = useCallback((product: any) => {
    setPromoProduct(product);
    if (product.promotionalPrice) {
      const promoCents = Math.round(Number(product.promotionalPrice) * 100);
      const promoReais = promoCents / 100;
      setPromoPrice(promoReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      const originalPrice = Number(product.price);
      if (originalPrice > 0) {
        const disc = Math.round((1 - Number(product.promotionalPrice) / originalPrice) * 100);
        setPromoPercent(String(disc));
      } else {
        setPromoPercent('');
      }
    } else {
      setPromoPrice('');
      setPromoPercent('');
    }
    setPromoLastEdited('price');
    setPromoSheetOpen(true);
  }, []);

  const handlePromoPriceChange = (raw: string) => {
    const formatted = formatPriceInputLocal2(raw);
    setPromoPrice(formatted);
    setPromoLastEdited('price');
    // Auto-calculate percent
    if (promoProduct && Number(promoProduct.price) > 0) {
      const newPrice = parsePriceToNumber(formatted);
      const originalPrice = Number(promoProduct.price);
      if (newPrice > 0 && newPrice < originalPrice) {
        const disc = Math.round((1 - newPrice / originalPrice) * 100);
        setPromoPercent(String(disc));
      } else {
        setPromoPercent('');
      }
    }
  };

  const handlePromoPercentChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const pct = Math.min(parseInt(digits, 10) || 0, 99);
    setPromoPercent(digits ? String(pct) : '');
    setPromoLastEdited('percent');
    // Auto-calculate price
    if (promoProduct && Number(promoProduct.price) > 0 && pct > 0) {
      const originalPrice = Number(promoProduct.price);
      const newPrice = originalPrice * (1 - pct / 100);
      const cents = Math.round(newPrice * 100);
      const reais = cents / 100;
      setPromoPrice(reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else if (!digits) {
      setPromoPrice('');
    }
  };

  const handleSavePromo = () => {
    if (!promoProduct) return;
    const newPrice = parsePriceToNumber(promoPrice);
    if (newPrice <= 0) {
      toast.error('Informe um pre\u00e7o promocional v\u00e1lido');
      return;
    }
    if (newPrice >= Number(promoProduct.price)) {
      toast.error('O pre\u00e7o promocional deve ser menor que o pre\u00e7o original');
      return;
    }
    inlineUpdateMutation.mutate(
      { id: promoProduct.id, promotionalPrice: newPrice.toFixed(2) },
      {
        onSuccess: () => {
          toast.success('Pre\u00e7o promocional aplicado!');
          setPromoSheetOpen(false);
        },
      }
    );
  };

  const handleRemovePromo = () => {
    if (!promoProduct) return;
    inlineUpdateMutation.mutate(
      { id: promoProduct.id, promotionalPrice: null },
      {
        onSuccess: () => {
          toast.success('Preço promocional removido');
          setPromoSheetOpen(false);
        },
      }
    );
  };

  // Batch promo mutations
  const batchPromoMutation = trpc.product.batchPromo.useMutation({
    onSuccess: (data) => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success(`Promoção aplicada em ${data.updated} produto${data.updated !== 1 ? 's' : ''}!`);
      setBatchPromoOpen(false);
      setBatchPromoPercent('');
    },
    onError: () => {
      toast.error('Erro ao aplicar promoção em lote');
    },
  });

  const batchRemovePromoMutation = trpc.product.batchRemovePromo.useMutation({
    onSuccess: (data) => {
      catalogoUtils.product.list.invalidate();
      catalogoUtils.catalogVersion.stats.invalidate();
      toast.success(`Promoção removida de ${data.updated} produto${data.updated !== 1 ? 's' : ''}`);
      setBatchPromoOpen(false);
      setBatchPromoPercent('');
    },
    onError: () => {
      toast.error('Erro ao remover promoção em lote');
    },
  });

  const handleOpenBatchPromo = useCallback((categoryId: number, categoryName: string) => {
    setBatchPromoCategoryId(categoryId);
    setBatchPromoCategoryName(categoryName);
    setBatchPromoPercent('');
    setBatchPromoOpen(true);
  }, []);

  const handleSaveBatchPromo = () => {
    if (!batchPromoCategoryId || !establishmentId) return;
    const pct = parseInt(batchPromoPercent, 10);
    if (!pct || pct < 1 || pct > 99) {
      toast.error('Informe um desconto entre 1% e 99%');
      return;
    }
    batchPromoMutation.mutate({
      establishmentId,
      categoryId: batchPromoCategoryId,
      discountPercent: pct,
    });
  };

  const handleRemoveBatchPromo = () => {
    if (!batchPromoCategoryId || !establishmentId) return;
    batchRemovePromoMutation.mutate({
      establishmentId,
      categoryId: batchPromoCategoryId,
    });
  };

  const handleToggleStatus = (productId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toggleStatusMutation.mutate({ id: productId, status: newStatus });
  };

  const handleDuplicate = (productId: number) => {
    duplicateMutation.mutate({ id: productId });
  };

  const handleDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate({ id: productToDelete });
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && establishmentId) {
      createCategoryMutation.mutate({
        establishmentId,
        name: newCategoryName.trim(),
      });
    }
  };

  // Category sortable IDs (prefixed with "cat-" to distinguish from product IDs)
  const categorySortableIds = useMemo(() => 
    localCategories.map(c => `cat-${c.id}`),
    [localCategories]
  );

  // Handle drag start - detect if dragging a category or product
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    
    if (activeId.startsWith('cat-')) {
      // Dragging a category - auto-collapse all categories
      setIsDraggingCategory(true);
      // Save current collapse state before collapsing all
      preCollapseStateRef.current = new Set(collapsedCategories);
      // Use startTransition to batch the collapse update as low-priority
      startTransition(() => {
        const allCategoryIds = new Set(localCategories.map(c => c.id));
        setCollapsedCategories(allCategoryIds);
      });
    } else {
      // Dragging a product
      const productId = active.id as number;
      for (const [catId, products] of Object.entries(localProductsByCategory)) {
        const product = products.find((p: any) => p.id === productId);
        if (product) {
          setActiveProduct(product);
          setActiveProductCategoryId(Number(catId));
          break;
        }
      }
    }
  };

  // Handle drag end - check if dropped on different category or reorder categories
  const handleGlobalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    
    // Handle category drag end
    if (activeId.startsWith('cat-')) {
      setIsDraggingCategory(false);
      
      // Restore previous collapse state
      if (preCollapseStateRef.current !== null) {
        setCollapsedCategories(preCollapseStateRef.current);
        // Also persist the restored state to localStorage
        localStorage.setItem('collapsedCategories', JSON.stringify(Array.from(preCollapseStateRef.current)));
        preCollapseStateRef.current = null;
      }
      
      if (!over) return;
      
      const overId = String(over.id);
      if (!overId.startsWith('cat-')) return;
      
      const activeCatId = Number(activeId.replace('cat-', ''));
      const overCatId = Number(overId.replace('cat-', ''));
      
      if (activeCatId === overCatId) return;
      
      const oldIndex = localCategories.findIndex(c => c.id === activeCatId);
      const newIndex = localCategories.findIndex(c => c.id === overCatId);
      
      if (oldIndex === -1 || newIndex === -1) return;
      
      // Optimistic update
      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newCategories);
      
      // Persist to server
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        sortOrder: index,
      }));
      
      reorderCategoriesMutation.mutate(updates, {
        onSuccess: () => {
          catalogoUtils.catalogVersion.stats.invalidate();
          toast.success("Ordem das categorias atualizada");
        },
      });
      return;
    }
    
    // Handle product drag end
    setActiveProduct(null);
    setActiveProductCategoryId(null);
    
    if (!over) return;
    
    const productId = active.id as number;
    const overId = String(over.id);
    
    // Check if dropped on a category drop zone
    if (overId.startsWith('category-drop-')) {
      const targetCategoryId = overId === 'category-drop-0' ? null : Number(overId.replace('category-drop-', ''));
      const sourceCategoryId = activeProductCategoryId;
      
      // Only move if dropping on a different category
      if (sourceCategoryId !== (targetCategoryId ?? 0)) {
        // Optimistic update
        const sourceProducts = [...(localProductsByCategory[sourceCategoryId ?? 0] || [])];
        const productIndex = sourceProducts.findIndex((p) => p.id === productId);
        
        if (productIndex !== -1) {
          const [movedProduct] = sourceProducts.splice(productIndex, 1);
          const targetProducts = [...(localProductsByCategory[targetCategoryId ?? 0] || []), movedProduct];
          
          setLocalProductsByCategory({
            ...localProductsByCategory,
            [sourceCategoryId ?? 0]: sourceProducts,
            [targetCategoryId ?? 0]: targetProducts,
          });
          
          // Persist to server
          moveProductCategoryMutation.mutate({
            id: productId,
            categoryId: targetCategoryId,
          });
        }
      }
      return;
    }
    
    // Handle reordering within same category
    if (activeProductCategoryId !== null) {
      const categoryProducts = localProductsByCategory[activeProductCategoryId] || [];
      const oldIndex = categoryProducts.findIndex((p) => p.id === active.id);
      const newIndex = categoryProducts.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newProducts = arrayMove(categoryProducts, oldIndex, newIndex);
        setLocalProductsByCategory({
          ...localProductsByCategory,
          [activeProductCategoryId]: newProducts,
        });

        const updates = newProducts.map((product, index) => ({
          id: product.id,
          sortOrder: index,
        }));
        
        reorderProductsMutation.mutate(updates, {
          onSuccess: () => {
            catalogoUtils.catalogVersion.stats.invalidate();
            toast.success("Ordem atualizada");
          },
        });
      }
    }
  };

  const products = productsData?.products || [];
  const hasCategories = localCategories.length > 0;

  // Count products without photos
  const productsWithoutPhoto = useMemo(() => {
    return products.filter(p => !p.images || p.images.length === 0);
  }, [products]);
  const noPhotoCount = productsWithoutPhoto.length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="mb-6">
        <PageHeader
          title="Cardápio"
          description="Gerencie seus produtos e categorias"
          icon={<UtensilsCrossed className="h-6 w-6 text-blue-600" />}
          actions={
            catalogVersion !== 'published' ? (
            <div className="flex items-center gap-2">
              {hasCategories ? (
                <button onClick={() => setProductTypeSelectorOpen(true)} className="hidden md:flex px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500 items-center gap-1.5">
                  <span className="text-xs sm:text-sm">Novo produto</span>
                </button>
              ) : (
                <button onClick={() => setCategoryDialogOpen(true)} className="hidden md:flex px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500 items-center gap-1.5">
                  <FolderPlus className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">categoria</span>
                </button>
              )}
            </div>
            ) : undefined
          }
        />
      </div>

      {/* Flex layout: Sidebar + Content */}
      <div className="flex gap-4 items-start">
        {/* Left sidebar - Version panel */}
        {establishmentId && (
          <CatalogVersionBar
            establishmentId={establishmentId}
            activeVersion={catalogVersion}
            onVersionChange={setCatalogVersion}
            onPublished={() => {
              catalogoUtils.category.list.invalidate();
              catalogoUtils.product.list.invalidate();
            }}
            onDiscarded={() => {
              catalogoUtils.category.list.invalidate();
              catalogoUtils.product.list.invalidate();
            }}
          >
            <CategorySidebarCard
              categories={localCategories}
              productCountByCategory={Object.fromEntries(
                Object.entries(localProductsByCategory).map(([k, v]) => [Number(k), v.length])
              )}
              totalProducts={Object.values(localProductsByCategory).flat().length}
              selectedCategoryId={selectedSidebarCategoryId}
              onSelectCategory={handleSidebarCategorySelect}
              onAddCategory={() => setCategoryDialogOpen(true)}
              onRenameCategory={(id, name) => updateCategoryMutation.mutate({ id, name })}
              onReorderCategories={(updates) => {
                // Optimistic update: reorder localCategories to match sidebar
                const newOrder = [...localCategories].sort((a, b) => {
                  const aSort = updates.find(u => u.id === a.id)?.sortOrder ?? a.sortOrder;
                  const bSort = updates.find(u => u.id === b.id)?.sortOrder ?? b.sortOrder;
                  return aSort - bSort;
                });
                setLocalCategories(newOrder);
                reorderCategoriesMutation.mutate(updates);
              }}
              isRenamePending={updateCategoryMutation.isPending}
              isReadOnly={catalogVersion === 'published'}
            />
          </CatalogVersionBar>
        )}

        {/* Main content area */}
        <div className="flex-1 min-w-0">

      {/* Published mode banner */}
      {catalogVersion === "published" && (
        <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Modo visualização — Você está vendo a versão publicada. Para editar, volte ao <button onClick={() => setCatalogVersion('draft')} className="underline font-medium hover:text-amber-800">Rascunho</button>.
            </p>
          </div>
        </div>
      )}

      {/* Banner: Limite de produtos do plano */}
      {productsData?.planLimit !== null && productsData?.planLimit !== undefined && productsData?.activeCount !== null && productsData?.activeCount !== undefined && productsData.activeCount > productsData.planLimit && (
        <div className="relative rounded-xl overflow-hidden mb-4 border border-amber-200/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/30">
          <div className="relative flex items-center gap-3 px-4 py-3">
            <div className="relative flex-shrink-0">
              <div className="relative p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">
                Limite de <span className="text-amber-600 dark:text-amber-400">{productsData.planLimit}</span> produtos ativos no plano atual
              </p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                Você tem <strong className="text-amber-600 dark:text-amber-400">{productsData.activeCount}</strong> ativos. {productsData.activeCount - productsData.planLimit} {productsData.activeCount - productsData.planLimit === 1 ? 'produto está bloqueado' : 'produtos estão bloqueados'} e não aparecem no cardápio público.
              </p>
            </div>
            <Button
              onClick={() => { window.location.href = '/planos'; }}
              size="sm"
              className="flex-shrink-0 text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              Fazer upgrade
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Banner: Produtos sem foto */}
      {!isLoading && noPhotoCount > 0 && !bannerDismissed && (
        <div
          className={cn(
            "relative rounded-xl overflow-hidden mb-4 border",
            filterNoPhoto
              ? "bg-primary/5 border-primary/20"
              : "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200/50 dark:border-red-500/30"
          )}
        >
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23dc2626' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)',
                animation: 'banner-shimmer 3s ease-in-out infinite',
                animationDelay: '1s'
              }}
            />
          </div>
          
          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Ícone pulsante */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30 dark:bg-red-500/20" />
              <div className="relative p-2 rounded-full bg-red-100 dark:bg-red-500/40">
                <Camera className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">
                {filterNoPhoto ? (
                  <>{noPhotoCount} {noPhotoCount === 1 ? 'produto sem foto' : 'produtos sem foto'}</>  
                ) : (
                  <>Você tem <span className="text-red-500 dark:text-red-400">{noPhotoCount}</span> {noPhotoCount === 1 ? 'produto' : 'produtos'} sem foto</>
                )}
              </p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                Produtos com imagens vendem até <strong className="text-red-500 dark:text-red-400">3x mais</strong>!
              </p>
            </div>

            {/* Action button */}
            {filterNoPhoto ? (
              <Button
                onClick={() => setFilterNoPhoto(false)}
                size="sm"
                variant="outline"
                className="flex-shrink-0 text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/10"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtro
              </Button>
            ) : (
              <Button
                onClick={() => setFilterNoPhoto(true)}
                size="sm"
                variant="outline" className="flex-shrink-0 text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/10"
              >
                Ver produtos
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Dismiss button */}
            {!filterNoPhoto && (
              <button
                onClick={() => {
                  dismissBannerMutation.mutate(
                    { key: "dismiss_no_photo_banner", value: "true", establishmentId: establishmentId! },
                    { onSuccess: () => catalogoUtils.preferences.get.invalidate({ key: "dismiss_no_photo_banner" }) }
                  );
                }}
                className="flex-shrink-0 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/40 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search + Novo Produto - visible only on mobile */}
      <div className="mb-4 md:hidden flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border/50"
          />
          {mobileSearch && (
            <button
              onClick={() => setMobileSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {catalogVersion !== 'published' && (
          <>
            {/* Mobile Discard button */}
              <Button
                size="icon"
                variant="outline"
                onClick={() => setMobileDiscardDialogOpen(true)}
                className={`h-10 w-10 rounded-xl flex-shrink-0 ${hasPendingChanges ? "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-600" : "border-border/30 bg-muted/20 text-muted-foreground/50 opacity-50"}`}
                disabled={!hasPendingChanges || mobileDiscardMutation.isPending}
              >
                {mobileDiscardMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
            {/* Mobile Publish button */}
              <Button
                size="icon"
                variant="outline"
                onClick={() => setMobilePublishDialogOpen(true)}
                className={`h-10 w-10 rounded-xl flex-shrink-0 ${hasPendingChanges ? "border-red-300 bg-red-50 hover:bg-red-100 text-red-500" : "border-border/30 bg-muted/20 text-muted-foreground/50 opacity-50"}`}
                disabled={!hasPendingChanges || mobilePublishMutation.isPending}
              >
                {mobilePublishMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            {/* Create category / product buttons */}
            {hasCategories ? (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(true)}
                  className="h-10 w-10 rounded-xl flex-shrink-0"
                >
                  <FolderPlus className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => setProductTypeSelectorOpen(true)}
                  className="h-10 w-10 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                onClick={() => setCategoryDialogOpen(true)}
                className="h-10 w-10 rounded-xl flex-shrink-0"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <FolderPlus className="h-5 w-5" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="skeleton h-5 w-28 rounded-md mb-4" />
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="skeleton h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-40 rounded-md" />
                      <div className="skeleton h-3 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 && localCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FolderPlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma categoria criada</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Comece criando sua primeira categoria para organizar o cardápio
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragStart={handleDragStart}
          onDragEnd={handleGlobalDragEnd}
        >
        <SortableContext
          items={categorySortableIds}
          strategy={verticalListSortingStrategy}
        >
        <div className="space-y-5">
          {localCategories.map((category) => {
            const categoryProducts = localProductsByCategory[category.id] || [];
            const isDropTarget = activeProduct && activeProductCategoryId !== category.id;
            
            // Quando há busca/filtro ativo, esconder categorias sem produtos correspondentes
            if (hasActiveFilters && categoryProducts.length === 0) {
              return null;
            }
            
            return (
              <SortableCategoryItem
                key={category.id}
                category={category}
                categoryProducts={categoryProducts}
                isDropTarget={isDropTarget}
                isDraggingCategory={isDraggingCategory}
                isCollapsed={collapsedCategories.has(category.id)}
                isEditing={editingCategoryId === category.id}
                editingName={editingCategoryName}
                hasActiveFilters={hasActiveFilters}
                onToggleCategoryCollapse={toggleCategoryCollapse}
                onStartEditing={(id, name) => {
                  setEditingCategoryId(id);
                  setEditingCategoryName(name);
                }}
                onEditingNameChange={setEditingCategoryName}
                onSaveEdit={(id, name) => {
                  updateCategoryMutation.mutate({ id, name });
                }}
                onCancelEdit={() => {
                  setEditingCategoryId(null);
                  setEditingCategoryName("");
                }}
                onToggleCategoryStatus={(id, isActive) => {
                  toggleCategoryStatusMutation.mutate({ id, isActive });
                }}
                onDuplicateCategory={(id) => {
                  duplicateCategoryMutation.mutate({ id });
                }}
                onDeleteCategory={(id, name, productCount) => {
                  setCategoryToDelete({ id, name, productCount });
                  setDeleteCategoryDialogOpen(true);
                }}
                onCreateCombo={(id, name) => {
                  setComboSheetCategoryId(id);
                  setComboSheetCategoryName(name);
                  setComboSheetOpen(true);
                }}
                onCreateProduct={(categoryId) => {
                  setProductSheetDefaultCategoryId(categoryId);
                  setProductSheetOpen(true);
                }}
                onSchedule={openScheduleDialog}
                onBatchPromo={handleOpenBatchPromo}
                toggleCategoryStatusPending={toggleCategoryStatusMutation.isPending}
                updateCategoryPending={updateCategoryMutation.isPending}
                duplicateCategoryPending={duplicateCategoryMutation.isPending}
                isReadOnly={catalogVersion === 'published'}
              >
                {category.categoryType === "pizza" ? (
                  <div className="p-4">
                    <PizzaCategoryContent categoryId={category.id} isReadOnly={catalogVersion === 'published'} />
                  </div>
                ) : (
                  <SortableContext
                    items={categoryProducts.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-border/50">
                      {categoryProducts.map((product) => (
                        <SortableProductItem
                          key={product.id}
                          product={product}
                          isDragDisabled={hasActiveFilters}
                          onToggleStatus={handleToggleStatus}
                          onDuplicate={handleDuplicate}
                          onDelete={(id) => {
                            setProductToDelete(id);
                            setDeleteDialogOpen(true);
                          }}
                          onEdit={(id) => {
                            setEditingProductId(id);
                            setProductSheetOpen(true);
                          }}
                          formatCurrency={formatCurrency}
                          expandedComplementProductId={expandedComplementProductId}
                          onToggleComplements={handleToggleComplements}
                          onUpdateInline={handleInlineUpdate}
                          establishmentId={establishmentId || undefined}
                          menuSlug={establishment?.menuSlug ?? undefined}
                          categoryIsActive={category.isActive}
                          onOpenPromo={handleOpenPromo}
                          isReadOnly={catalogVersion === 'published'}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </SortableCategoryItem>
            );
          })}
          
          {/* No results message when search returns empty */}
          {search && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum resultado encontrado</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {`Não encontramos produtos para "${search}". Tente buscar com outro termo.`}
              </p>
            </div>
          )}
          
          {/* Products without category */}
          {(localProductsByCategory[0] && localProductsByCategory[0].length > 0) || activeProduct ? (
            <div 
              data-category-id="0"
              className={cn(
                "bg-card rounded-xl border border-border/50 overflow-hidden",
                activeProduct && activeProductCategoryId !== 0 && "ring-2 ring-primary/50 ring-offset-2"
              )}
            >
              {/* Drop zone for uncategorized */}
              <CategoryDropZone 
                categoryId={null} 
                categoryName="Sem categoria" 
                isActive={activeProduct && activeProductCategoryId !== 0} 
              />
              <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
                <h3 className="font-bold text-lg">Sem categoria</h3>
                <span className="text-sm text-muted-foreground font-medium">
                  {(localProductsByCategory[0]?.length || 0)} {(localProductsByCategory[0]?.length || 0) === 1 ? "produto" : "produtos"}
                </span>
              </div>
              {!isDraggingCategory && (
              <SortableContext
                items={(localProductsByCategory[0] || []).map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-border/50">
                  {(localProductsByCategory[0] || []).map((product) => (
                    <SortableProductItem
                      key={product.id}
                      product={product}
                      isDragDisabled={hasActiveFilters}
                      onToggleStatus={handleToggleStatus}
                      onDuplicate={handleDuplicate}
                      onDelete={(id) => {
                        setProductToDelete(id);
                        setDeleteDialogOpen(true);
                      }}
                      onEdit={(id) => {
                        setEditingProductId(id);
                        setProductSheetOpen(true);
                      }}
                      formatCurrency={formatCurrency}
                      expandedComplementProductId={expandedComplementProductId}
                      onToggleComplements={handleToggleComplements}
                      onUpdateInline={handleInlineUpdate}
                      establishmentId={establishmentId || undefined}
                      menuSlug={establishment?.menuSlug ?? undefined}
                      onOpenPromo={handleOpenPromo}
                      isReadOnly={catalogVersion === 'published'}
                    />
                  ))}
                </div>
              </SortableContext>
              )}
            </div>
          ) : null}
        </div>
        </SortableContext>
        </DndContext>
      )}

      </div>{/* end main content area */}
      </div>{/* end flex layout */}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Excluir produto</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir produto</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Nova categoria</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            {/* Header com ícone */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <FolderPlus className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Nova categoria</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Crie uma nova categoria para organizar seus produtos no cardápio.
                </p>
              </div>
            </div>

            {/* Campo nome */}
            <div className="mb-5">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nome da categoria <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Ex: Hambúrgueres, Bebidas, Sobremesas..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(capitalizeFirst(e.target.value))}
                className="h-11 rounded-lg"
                onKeyDown={(e) => { if (e.key === 'Enter' && newCategoryName.trim()) handleCreateCategory(); }}
              />
            </div>

            {/* Botão Criar */}
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? (
                <><span className="h-4 w-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" /> Criando...</>
              ) : (
                <><FolderPlus className="h-4 w-4 mr-2" /> Criar Categoria</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Excluir categoria</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir categoria</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {categoryToDelete?.productCount && categoryToDelete.productCount > 0 ? (
                    <>
                      A categoria <strong>"{categoryToDelete?.name}"</strong> possui <strong>{categoryToDelete?.productCount} {categoryToDelete?.productCount === 1 ? 'produto' : 'produtos'}</strong>. 
                      Ao excluir, os produtos serão movidos para "Sem categoria".
                    </>
                  ) : (
                    <>Tem certeza que deseja excluir a categoria <strong>"{categoryToDelete?.name}"</strong>?</>
                  )}
                </p>
              </div>
            </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate({ id: categoryToDelete.id });
                }
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Excluindo..." : "Excluir Categoria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Sheet */}
      {establishmentId && (
        <CreateProductSheet
          open={productSheetOpen}
          onOpenChange={(open) => {
            setProductSheetOpen(open);
            if (!open) {
              setProductSheetDefaultCategoryId(undefined);
              setEditingProductId(undefined);
            }
          }}
          establishmentId={establishmentId}
          planType={establishment?.planType}
          defaultCategoryId={productSheetDefaultCategoryId}
          productId={editingProductId}
          onSuccess={() => {
            catalogoUtils.product.list.invalidate();
            catalogoUtils.category.list.invalidate();
            catalogoUtils.catalogVersion.stats.invalidate();
          }}
          onDelete={(id) => {
            deleteMutation.mutate({ id });
            setProductSheetOpen(false);
            setEditingProductId(undefined);
          }}
        />
      )}
      {/* Product Type Selector */}
      <ProductTypeSelector
        open={productTypeSelectorOpen}
        onOpenChange={setProductTypeSelectorOpen}
        onSelect={(type) => {
          setProductTypeSelectorOpen(false);
          if (type === "preparado") {
            setProductSheetOpen(true);
          } else if (type === "pizza") {
            setPizzaCategorySheetOpen(true);
          }
        }}
      />
      {/* Create Pizza Category Sheet */}
      {establishmentId && (
        <CreatePizzaCategorySheet
          open={pizzaCategorySheetOpen}
          onOpenChange={setPizzaCategorySheetOpen}
          establishmentId={establishmentId}
          onSuccess={() => {
            catalogoUtils.category.list.invalidate();
            catalogoUtils.catalogVersion.stats.invalidate();
          }}
        />
      )}

      {/* Create Combo Sheet */}
      {establishmentId && (
        <CreateComboSheet
          open={comboSheetOpen}
          onOpenChange={setComboSheetOpen}
          establishmentId={establishmentId}
          categoryId={comboSheetCategoryId}
          categoryName={comboSheetCategoryName}
          onSuccess={() => {
            catalogoUtils.product.list.invalidate();
            catalogoUtils.category.list.invalidate();
            catalogoUtils.catalogVersion.stats.invalidate();
          }}
        />
      )}

      {/* Category Scheduling Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Agendar disponibilidade</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <CalendarClock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Agendar disponibilidade</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Configure quando a categoria <strong>"{schedulingCategory?.name}"</strong> aparece no menu público.
                </p>
              </div>
            </div>
          <div className="space-y-4 mb-5">
            {/* Radio buttons */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent has-[:checked]:border-blue-200 has-[:checked]:bg-blue-50/50">
                <input
                  type="radio"
                  name="cat-avail"
                  checked={schedAvailabilityType === "always"}
                  onChange={() => setSchedAvailabilityType("always")}
                  className="mt-0.5 accent-red-700"
                />
                <div>
                  <span className="text-sm font-medium">Sempre disponível</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A categoria ficará visível sempre que o estabelecimento estiver aberto
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent has-[:checked]:border-blue-200 has-[:checked]:bg-blue-50/50">
                <input
                  type="radio"
                  name="cat-avail"
                  checked={schedAvailabilityType === "scheduled"}
                  onChange={() => setSchedAvailabilityType("scheduled")}
                  className="mt-0.5 accent-red-700"
                />
                <div>
                  <span className="text-sm font-medium">Dias e horários específicos</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Escolha quando a categoria aparece no cardápio
                  </p>
                </div>
              </label>
            </div>

            {/* Day/Hour selector */}
            {schedAvailabilityType === "scheduled" && (
              <div className="space-y-3 pl-1">
                <p className="text-xs font-medium text-muted-foreground">Selecione os dias:</p>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleSchedDay(day.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        schedSelectedDays.includes(day.value)
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-background text-muted-foreground border-border hover:border-red-300"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                {schedSelectedDays.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Horários por dia:</p>
                    {schedSelectedDays.map((day) => {
                      const dayLabel = DAYS_OF_WEEK.find((d) => d.value === day)?.label;
                      const existing = schedHoursConfig.find((h) => h.day === day);
                      return (
                        <div key={day} className="flex items-center gap-2 text-sm">
                          <span className="w-10 font-medium text-muted-foreground">{dayLabel}</span>
                          <Input
                            type="time"
                            value={existing?.startTime || "00:00"}
                            onChange={(e) =>
                              updateSchedHoursForDay(day, e.target.value, existing?.endTime || "23:59")
                            }
                            className="w-28 h-9 text-sm"
                          />
                          <span className="text-muted-foreground text-xs">até</span>
                          <Input
                            type="time"
                            value={existing?.endTime || "23:59"}
                            onChange={(e) =>
                              updateSchedHoursForDay(day, existing?.startTime || "00:00", e.target.value)
                            }
                            className="w-28 h-9 text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSaveSchedule}
              disabled={scheduleCategoryMutation.isPending || (schedAvailabilityType === "scheduled" && schedSelectedDays.length === 0)}
            >
              {scheduleCategoryMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Promo Price Sheet */}
      <Sheet open={promoSheetOpen} onOpenChange={setPromoSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
          <SheetTitle className="sr-only">Preço promocional</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header - same style as edit product modal */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{promoProduct?.promotionalPrice ? "Editar promoção" : "Aplicar promoção"}</h2>
                    <p className="text-sm text-white/80">Preço promocional</p>
                  </div>
                </div>
                <button
                  onClick={() => setPromoSheetOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
              {promoProduct && (
                <>
                  {/* Product info */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Produto</Label>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <p className="font-semibold text-foreground">{promoProduct.name}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-sm text-muted-foreground">Preço atual:</span>
                        <span className="text-sm font-medium text-foreground">R$ {Number(promoProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Promo price field */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Preço promocional</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={promoPrice}
                        onChange={(e) => handlePromoPriceChange(e.target.value)}
                        placeholder="0,00"
                        className="pl-9 h-11 text-base font-medium rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Discount field */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Desconto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">%</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={promoPercent}
                        onChange={(e) => handlePromoPercentChange(e.target.value)}
                        placeholder="0"
                        className="pl-8 h-11 text-base font-medium rounded-xl"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Os campos de preço e desconto são sincronizados automaticamente.</p>
                  </div>

                  {/* Preview */}
                  {promoPrice && parsePriceToNumber(promoPrice) > 0 && parsePriceToNumber(promoPrice) < Number(promoProduct.price) && (
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Prévia no cardápio</Label>
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-500">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-red-500">R$ {promoPrice}</span>
                          <span className="text-sm text-muted-foreground line-through">R$ {Number(promoProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-xs font-bold text-white bg-red-500 rounded px-1.5 py-0.5">
                            -{promoPercent || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer - same style as edit product modal */}
            {promoProduct && (
              <div className="p-4 border-t border-border/50 bg-card">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 text-muted-foreground hover:text-red-500 hover:border-red-300"
                    onClick={handleRemovePromo}
                    disabled={!promoProduct.promotionalPrice || inlineUpdateMutation.isPending}
                  >
                    Remover promoção
                  </Button>
                  <Button
                    onClick={handleSavePromo}
                    disabled={inlineUpdateMutation.isPending || !promoPrice}
                    className="flex-1 rounded-xl h-11"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}
                  >
                    {inlineUpdateMutation.isPending ? "Salvando..." : "Aplicar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Batch Promo Sheet */}
      <Sheet open={batchPromoOpen} onOpenChange={setBatchPromoOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
          <SheetTitle className="sr-only">Promoção em lote</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Promoção em lote</h2>
                    <p className="text-sm text-white/80">{batchPromoCategoryName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBatchPromoOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
              {/* Category info */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Categoria</Label>
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <p className="font-semibold text-foreground">{batchPromoCategoryName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm text-muted-foreground">
                      {(() => {
                        const prods = batchPromoCategoryId ? (localProductsByCategory[batchPromoCategoryId] || []) : [];
                        const activeCount = prods.filter((p: any) => p.status === 'active').length;
                        const promoCount = prods.filter((p: any) => p.promotionalPrice && Number(p.promotionalPrice) > 0).length;
                        return `${activeCount} produto${activeCount !== 1 ? 's' : ''} ativo${activeCount !== 1 ? 's' : ''}${promoCount > 0 ? ` • ${promoCount} com promoção` : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Discount percent field */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Desconto a aplicar</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">%</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={batchPromoPercent}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      const pct = Math.min(parseInt(digits, 10) || 0, 99);
                      setBatchPromoPercent(digits ? String(pct) : '');
                    }}
                    placeholder="Ex: 20"
                    className="pl-8 h-11 text-base font-medium rounded-xl"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">O desconto será aplicado sobre o preço original de cada produto ativo da categoria.</p>
              </div>

              {/* Preview of affected products */}
              {batchPromoPercent && parseInt(batchPromoPercent, 10) > 0 && batchPromoCategoryId && (() => {
                const prods = (localProductsByCategory[batchPromoCategoryId] || []).filter((p: any) => p.status === 'active' && Number(p.price) > 0);
                const pct = parseInt(batchPromoPercent, 10);
                if (prods.length === 0) return null;
                return (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Prévia ({prods.length} produto{prods.length !== 1 ? 's' : ''})</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {prods.slice(0, 10).map((p: any) => {
                        const original = Number(p.price);
                        const promo = Math.round(original * (1 - pct / 100) * 100) / 100;
                        return (
                          <div key={p.id} className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-500">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-red-500">R$ {promo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span className="text-xs text-muted-foreground line-through">R$ {original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span className="text-xs font-bold text-white bg-red-500 rounded px-1.5 py-0.5">-{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                      {prods.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-1">e mais {prods.length - 10} produto{prods.length - 10 !== 1 ? 's' : ''}...</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-card">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-11 text-muted-foreground hover:text-red-500 hover:border-red-300"
                  onClick={handleRemoveBatchPromo}
                  disabled={batchPromoMutation.isPending || batchRemovePromoMutation.isPending}
                >
                  {batchRemovePromoMutation.isPending ? 'Removendo...' : 'Remover promoções'}
                </Button>
                <Button
                  onClick={handleSaveBatchPromo}
                  disabled={batchPromoMutation.isPending || batchRemovePromoMutation.isPending || !batchPromoPercent}
                  className="flex-1 rounded-xl h-11"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  {batchPromoMutation.isPending ? 'Aplicando...' : 'Aplicar em lote'}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Publish Confirmation Dialog */}
      <Dialog open={mobilePublishDialogOpen} onOpenChange={setMobilePublishDialogOpen}>
        <DialogContent className="sm:max-w-[414px] p-0 overflow-hidden border-0 bg-white [&>button]:hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:w-full max-sm:max-w-full sm:rounded-[28px]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)' }} overlayClassName="bg-black/20 backdrop-blur-sm">
          <DialogTitle className="sr-only">Publicar cardápio</DialogTitle>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-border mb-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-red-100 opacity-40 scale-125" />
                <div className="relative w-[42px] h-[42px] border-2 border-red-400 rounded-full flex items-center justify-center bg-white shadow-sm">
                  <Upload className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-foreground">Publicar cardápio?</h3>
                <p className="text-[11px] text-muted-foreground">O cardápio público será atualizado com as alterações do rascunho.</p>
              </div>
            </div>
            {/* Info */}
            <p className="text-[13px] text-gray-600 dark:text-muted-foreground mb-4">Clientes verão as mudanças imediatamente.</p>
            {/* Actions */}
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold border-gray-200 dark:border-border"
                onClick={() => setMobilePublishDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white gap-1.5"
                onClick={() => { establishmentId && mobilePublishMutation.mutate({ establishmentId }); setMobilePublishDialogOpen(false); }}
                disabled={mobilePublishMutation.isPending}
              >
                {mobilePublishMutation.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publicando...</>
                ) : (
                  <>Publicar agora <Upload className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Mobile Publish Success Modal - Bottom Sheet */}
      <Dialog open={mobilePublishSuccessOpen} onOpenChange={setMobilePublishSuccessOpen}>
        <DialogContent className="sm:max-w-[414px] max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:w-full max-sm:max-w-full max-sm:border-0 p-0 overflow-hidden gap-0" style={{ borderRadius: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)' }}>
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-red-400 flex items-center justify-center bg-white">
                  <Check className="h-6 w-6 text-red-500" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 text-red-400">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-gray-900">Cardápio atualizado!</h3>
                <p className="text-[13px] text-gray-500">As alterações foram publicadas com sucesso.</p>
              </div>
            </div>
          </div>
          <div className="h-px bg-gray-100 mx-6" />
          <div className="px-6 py-4">
            {mobileMenuUrl && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'linear-gradient(135deg, #fef2f2, #fef9f0)' }}>
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-[13px] text-gray-700 flex-1 truncate">
                  {mobileMenuUrl.replace('https://', '').replace('http://', '')}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mobileMenuUrl);
                    setMobileLinkCopied(true);
                    setTimeout(() => setMobileLinkCopied(false), 2000);
                  }}
                  className="text-[13px] font-semibold text-red-500 hover:text-red-600 flex-shrink-0"
                >
                  {mobileLinkCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            )}
          </div>
          <div className="px-6 pb-6 pt-2 flex gap-3">
            <button
              onClick={() => setMobilePublishSuccessOpen(false)}
              className="flex-1 h-12 rounded-[20px] border border-gray-200 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            {mobileMenuUrl && (
              <button
                onClick={() => window.open(mobileMenuUrl, '_blank')}
                className="flex-1 h-12 rounded-[20px] bg-red-500 text-[14px] font-semibold text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                Visitar <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Discard Confirmation Dialog */}
      <AlertDialog open={mobileDiscardDialogOpen} onOpenChange={setMobileDiscardDialogOpen}>
        <AlertDialogContent className="sm:max-w-md" style={{ borderRadius: '16px' }}>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <RotateCcw className="h-5 w-5 text-red-500" />
              </div>
              <AlertDialogTitle className="text-lg">Descartar rascunho?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Todas as alterações feitas no rascunho serão perdidas. O rascunho será restaurado para a versão publicada atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => establishmentId && mobileDiscardMutation.mutate({ establishmentId })}
              className="rounded-xl bg-red-500 hover:bg-red-500 text-white"
              disabled={mobileDiscardMutation.isPending}
            >
              {mobileDiscardMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Descartando...</>
              ) : (
                "Descartar rascunho"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
