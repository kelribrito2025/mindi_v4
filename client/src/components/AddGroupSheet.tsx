import { useState, useRef, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { capitalizeFirst, parsePriceInput, cn } from "@/lib/utils";
import { compressImage } from "@/lib/imageCompression";
import { toast } from "sonner";
import {
  X,
  Layers,
  UtensilsCrossed,
  ClipboardList,
  PackageOpen,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
  Copy,
  Check,
  Info,
  GripVertical,
  ArrowUpDown,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type CategoryType = "ingredientes" | "especificacoes" | "descartaveis";
type GroupType = "complement" | "included";
type SubStep = "categories" | "choose" | "group-config" | "group-items" | "copy-group" | "reorder-groups";

interface ComplementItem {
  uniqueId: string;
  name: string;
  price: string;
  imageUrl?: string | null;
}


function SortableReorderGroupItem({ group }: { group: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `sheet-group-${group.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const itemsCount = group.items?.length || group.complementCount || 0;
  const isIncluded = (group.groupType || "complement") === "included";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border bg-card transition-shadow",
        isDragging ? "border-red-300 shadow-lg ring-2 ring-red-100" : "border-border/50"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted touch-none flex-shrink-0"
        aria-label={`Reordenar grupo ${group.name}`}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold truncate">{group.name}</p>
          {isIncluded ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Incluso
            </span>
          ) : (group.isRequired || group.minQuantity >= 1) ? (
            <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Obrigatório
            </span>
          ) : (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Opcional
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {itemsCount} {isIncluded ? "item(ns) incluso(s)" : "complemento(s)"}
        </p>
      </div>
    </div>
  );
}

interface AddGroupSheetProps {
  productId: number;
  establishmentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: () => void;
}

export default function AddGroupSheet({
  productId,
  establishmentId,
  open,
  onOpenChange,
  onGroupCreated,
}: AddGroupSheetProps) {
  const utils = trpc.useUtils();

  // State
  const [subStep, setSubStep] = useState<SubStep>("categories");
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("complement");
  const [groupIsRequired, setGroupIsRequired] = useState(false);
  const [groupMinQty, setGroupMinQty] = useState(0);
  const [groupMaxQty, setGroupMaxQty] = useState(4);
  const [items, setItems] = useState<ComplementItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [draggingReorderGroupId, setDraggingReorderGroupId] = useState<string | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const itemPriceInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: allGroupsData } = trpc.complement.listAllGroups.useQuery(
    { establishmentId },
    { enabled: open && subStep === "copy-group" }
  );

  const { data: productGroups } = trpc.complement.listGroups.useQuery(
    { productId },
    { enabled: open }
  );

  // Mutations
  const createGroupMutation = trpc.complement.createGroup.useMutation();
  const createItemMutation = trpc.complement.createItem.useMutation();
  const uploadItemImageMutation = trpc.upload.image.useMutation();
  const reorderGroupsMutation = trpc.complement.reorderGroups.useMutation({
    onSuccess: () => {
      utils.complement.listGroups.invalidate({ productId });
      onGroupCreated();
      toast.success("Ordem dos grupos atualizada");
    },
    onError: () => {
      utils.complement.listGroups.invalidate({ productId });
      toast.error("Erro ao reordenar grupos");
    },
  });

  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Price formatting
  const formatPriceInputLocal = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    const cents = parseInt(numbers || "0", 10);
    const reais = cents / 100;
    return reais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Reset state
  const resetState = useCallback(() => {
    setSubStep("categories");
    setCategory(null);
    setGroupName("");
    setGroupType("complement");
    setGroupIsRequired(false);
    setGroupMinQty(0);
    setGroupMaxQty(4);
    setItems([]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemImage(null);
    setSelectedGroupNames([]);
  }, []);



  const handleReorderGroupDragEnd = useCallback((event: DragEndEvent) => {
    setDraggingReorderGroupId(null);
    const groups = (productGroups || []) as any[];
    const { active, over } = event;
    if (!over || active.id === over.id || groups.length < 2) return;

    const activeId = Number(String(active.id).replace("sheet-group-", ""));
    const overId = Number(String(over.id).replace("sheet-group-", ""));
    const oldIndex = groups.findIndex((g) => g.id === activeId);
    const newIndex = groups.findIndex((g) => g.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...groups], oldIndex, newIndex).map((group, index) => ({
      ...group,
      sortOrder: index,
    }));

    utils.complement.listGroups.setData({ productId }, reordered);
    reorderGroupsMutation.mutate({
      productId,
      items: reordered.map((group, index) => ({ id: group.id, sortOrder: index })),
    });
  }, [productGroups, productId, reorderGroupsMutation, utils.complement.listGroups]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleSelectCategory = (cat: CategoryType) => {
    setCategory(cat);
    setSubStep("choose");
  };

  const handleSaveGroupConfig = () => {
    if (!groupName.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    setSubStep("group-items");
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error(groupType === "included" ? "Nome do item incluso é obrigatório" : "Nome do complemento é obrigatório");
      return;
    }
    const item: ComplementItem = {
      uniqueId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      price: groupType === "included" ? "0,00" : (newItemPrice || "0,00"),
      imageUrl: newItemImage,
    };
    setItems((prev) => [...prev, item]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemImage(null);
    setTimeout(() => itemNameInputRef.current?.focus(), 50);
  };

  const handleRemoveItem = (uniqueId: string) => {
    setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));
  };

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      input.value = "";
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB");
      input.value = "";
      return;
    }
    setUploadingItemImage(true);
    try {
      const { base64, mimeType } = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
      });
      const data = await uploadItemImageMutation.mutateAsync({
        base64,
        mimeType,
        folder: "est/" + establishmentId + "/complements",
        singleVersion: true,
      });
      setNewItemImage(data.url);
      toast.success("Imagem enviada com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploadingItemImage(false);
      input.value = "";
    }
  };

  const handleFinish = async () => {
    if (items.length === 0) {
      toast.error(groupType === "included" ? "Adicione pelo menos um item incluso ao grupo" : "Adicione pelo menos um complemento ao grupo");
      return;
    }
    setIsSaving(true);
    try {
      const result = await createGroupMutation.mutateAsync({
        productId,
        name: groupName.trim(),
        minQuantity: groupType === "included" ? 0 : groupMinQty,
        maxQuantity: groupType === "included" ? 0 : groupMaxQty,
        isRequired: groupType === "included" ? false : groupIsRequired,
        groupType,
      });

      for (let i = 0; i < items.length; i++) {
        await createItemMutation.mutateAsync({
          groupId: result.id,
          name: items[i].name,
          price: String(parsePriceInput(items[i].price)),
          imageUrl: items[i].imageUrl || null,
          sortOrder: i,
        });
      }

      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();

      toast.success(`Grupo "${groupName}" criado com ${items.length} complemento(s)`);
      onGroupCreated();
      handleClose();
    } catch {
      toast.error("Erro ao criar grupo de complementos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyGroups = async () => {
    if (!allGroupsData || selectedGroupNames.length === 0) {
      toast.error("Selecione pelo menos um grupo para copiar");
      return;
    }
    const groupsToCopy = (allGroupsData as any[]).filter((g) => selectedGroupNames.includes(g.name));
    if (groupsToCopy.length === 0) {
      toast.error("Nenhum grupo selecionado");
      return;
    }
    setIsSaving(true);
    try {
      for (const g of groupsToCopy) {
        const result = await createGroupMutation.mutateAsync({
          productId,
          name: g.name,
          minQuantity: (g.groupType || "complement") === "included" ? 0 : g.minQuantity,
          maxQuantity: (g.groupType || "complement") === "included" ? 0 : g.maxQuantity,
          isRequired: (g.groupType || "complement") === "included" ? false : g.isRequired,
          groupType: (g.groupType || "complement") as GroupType,
        });

        const groupItems = (g as any).items || [];
        for (let i = 0; i < groupItems.length; i++) {
          await createItemMutation.mutateAsync({
            groupId: result.id,
            name: groupItems[i].name,
            price: String(groupItems[i].price || "0"),
            imageUrl: groupItems[i].imageUrl || null,
            sortOrder: i,
          });
        }
      }

      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();

      toast.success(`${groupsToCopy.length} grupo(s) copiado(s) com sucesso`);
      onGroupCreated();
      handleClose();
    } catch (err: any) {
      console.error("[CopyGroups] Erro:", err);
      toast.error(err?.message || "Erro ao copiar grupos de complementos");
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Render: Categories ----
  const renderCategories = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Grupo de complementos</h2>
              <p className="text-sm text-white/80">Escolha o tipo de complemento</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
        <p className="text-sm text-muted-foreground text-center mb-2">
          Escolha o tipo de complemento que deseja adicionar
        </p>

        {/* Ingredientes */}
        <button
          onClick={() => handleSelectCategory("ingredientes")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-950/30 group-hover:bg-orange-200 dark:group-hover:bg-orange-950/50 transition-colors">
            <UtensilsCrossed className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-semibold text-sm">Ingredientes</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicionais, molhos, acompanhamentos e extras
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Especificações */}
        <button
          onClick={() => handleSelectCategory("especificacoes")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-950/50 transition-colors">
            <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-semibold text-sm">Especificações</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Perguntas sobre preparo, tamanho, ponto, etc.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Descartáveis */}
        <button
          onClick={() => handleSelectCategory("descartaveis")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-950/50 transition-colors">
            <PackageOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-semibold text-sm">Descartáveis</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Embalagens, talheres, guardanapos, etc.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          variant="outline"
          onClick={handleClose}
          className="w-full rounded-xl h-11"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

  // ---- Render: Choose (Criar novo / Copiar existente) ----
  const renderChoose = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Complementos</h2>
              <p className="text-sm text-white/80">
                {category === "ingredientes" && "Ingredientes — "}
                {category === "especificacoes" && "Especificações — "}
                {category === "descartaveis" && "Descartáveis — "}
                Grupos de complementos
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-card">
        <div className="flex flex-col items-center justify-center py-10">
          <div className="p-4 bg-muted/30 rounded-2xl mb-4">
            <Layers className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Nenhum grupo adicionado
          </h3>
          <p className="text-sm text-muted-foreground mb-8">
            Adicione grupos como "Adicionais", "Molhos", etc.
          </p>

          <div className="w-full space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                setGroupName("");
                setGroupType("complement");
                setGroupIsRequired(false);
                setGroupMinQty(0);
                setGroupMaxQty(4);
                setItems([]);
                setSubStep("group-config");
              }}
              className="w-full rounded-xl h-12 border-dashed text-base"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar novo grupo
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedGroupNames([]);
                setSubStep("copy-group");
              }}
              className="w-full rounded-xl h-12 border-dashed text-base"
            >
              <Copy className="h-5 w-5 mr-2" />
              Copiar grupo existente
            </Button>
            <Button
              variant="outline"
              onClick={() => setSubStep("reorder-groups")}
              disabled={((productGroups || []) as any[]).length < 2}
              className="w-full rounded-xl h-12 border-dashed text-base"
            >
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Reorganizar grupos
            </Button>
            {((productGroups || []) as any[]).length < 2 && (
              <p className="text-xs text-muted-foreground text-center">
                Crie pelo menos dois grupos para alterar a ordem.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          variant="outline"
          onClick={() => {
            setCategory(null);
            setSubStep("categories");
          }}
          className="w-full rounded-xl h-11"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );

  // ---- Render: Copy Group ----
  const renderCopyGroup = () => {
    const availableGroups = (allGroupsData || []) as any[];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Copy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Copiar grupo</h2>
                <p className="text-sm text-white/80">Selecione os grupos para copiar</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-card">
          {availableGroups.length === 0 ? (
            <div className="text-center py-10">
              <div className="p-4 bg-muted/30 rounded-2xl mb-4 inline-block">
                <Layers className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum grupo de complementos cadastrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie grupos em outros produtos primeiro
              </p>
            </div>
          ) : (
            availableGroups.map((group: any) => {
              const isSelected = selectedGroupNames.includes(group.name);
              return (
                <div
                  key={group.name}
                  onClick={() => {
                    setSelectedGroupNames((prev) =>
                      isSelected
                        ? prev.filter((n) => n !== group.name)
                        : [...prev, group.name]
                    );
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border",
                    isSelected
                      ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500"
                      : "bg-card border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium truncate">{group.name}</p>
                      {(group.groupType || "complement") === "included" && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                          Incluso
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {group.complementCount || group.items?.length || 0} {(group.groupType || "complement") === "included" ? "item(ns) incluso(s)" : "complemento(s)"} &middot; {group.productCount || 1} produto(s)
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedGroupNames([]);
                setSubStep("choose");
              }}
              className="flex-1 rounded-xl h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleCopyGroups}
              disabled={selectedGroupNames.length === 0 || isSaving}
              className="flex-1 rounded-xl h-11"
              style={{ backgroundColor: "#ef4444", color: "white" }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Copiando...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar {selectedGroupNames.length > 0 ? `(${selectedGroupNames.length})` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };


  // ---- Render: Reorder Groups ----
  const renderReorderGroups = () => {
    const groups = (productGroups || []) as any[];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ArrowUpDown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Reorganizar grupos</h2>
                <p className="text-sm text-white/80">Arraste para definir a ordem no catálogo</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-sm font-medium">Ordem de exibição dos grupos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A ordem salva aqui é a mesma usada no catálogo e no menu público.
            </p>
          </div>

          {groups.length < 2 ? (
            <div className="text-center py-10">
              <div className="p-4 bg-muted/30 rounded-2xl mb-4 inline-block">
                <Layers className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                É necessário ter pelo menos dois grupos para reorganizar.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={reorderSensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => setDraggingReorderGroupId(String(event.active.id))}
              onDragEnd={handleReorderGroupDragEnd}
              onDragCancel={() => setDraggingReorderGroupId(null)}
            >
              <SortableContext
                items={groups.map((group) => `sheet-group-${group.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className={cn("space-y-2", draggingReorderGroupId && "select-none")}>
                  {groups.map((group) => (
                    <SortableReorderGroupItem key={group.id} group={group} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card">
          <Button
            variant="outline"
            onClick={() => setSubStep("choose")}
            className="w-full rounded-xl h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  };

  // ---- Render: Group Config ----
  const renderGroupConfig = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configurar grupo</h2>
              <p className="text-sm text-white/80">
                {category === "ingredientes" && "Ingredientes — "}
                {category === "especificacoes" && "Especificações — "}
                {category === "descartaveis" && "Descartáveis — "}
                Defina as regras do grupo
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
        <div>
          <Label className="text-sm font-semibold">Nome do grupo *</Label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(capitalizeFirst(e.target.value))}
            placeholder={
              category === "ingredientes"
                ? "Ex: Adicionais, Molhos, Extras..."
                : category === "especificacoes"
                ? "Ex: Ponto da carne, Tamanho, Tipo de pão..."
                : category === "descartaveis"
                ? "Ex: Deseja descartáveis?, Talheres, Guardanapos..."
                : "Ex: Adicionais, Molhos, Tamanho..."
            }
            className="mt-1.5 h-10 rounded-xl border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Tipo de grupo</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setGroupType("complement");
                setGroupMaxQty((current) => current > 0 ? current : 1);
              }}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                groupType === "complement"
                  ? "border-red-300 bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-300"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
              )}
            >
              <p className="text-sm font-semibold">Complementos</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cliente escolhe opções</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupType("included");
                setGroupIsRequired(false);
                setGroupMinQty(0);
                setGroupMaxQty(0);
              }}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                groupType === "included"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
              )}
            >
              <p className="text-sm font-semibold">Itens inclusos</p>
              <p className="text-xs text-muted-foreground mt-0.5">Já vem no combo, sem seleção</p>
            </button>
          </div>
        </div>

        {groupType === "included" ? (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50">
            <p className="text-sm font-semibold">Este grupo será exibido como Incluso</p>
            <p className="text-xs mt-0.5">Os itens ficam informativos, preço zero e sem possibilidade de o cliente selecionar ou desmarcar.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <Label className="text-sm font-semibold">Obrigatório</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O cliente precisa escolher ao menos uma opção
                </p>
              </div>
              <Switch checked={groupIsRequired} onCheckedChange={setGroupIsRequired} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Quantidade mínima</Label>
                <Input
                  type="number"
                  min="0"
                  value={groupMinQty || ""}
                  onChange={(e) => setGroupMinQty(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="mt-1.5 h-10 rounded-xl border-border/50"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Quantidade máxima</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupMaxQty || ""}
                  onChange={(e) => setGroupMaxQty(parseInt(e.target.value) || 1)}
                  placeholder="1"
                  className="mt-1.5 h-10 rounded-xl border-border/50"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSubStep("choose")}
            className="flex-1 rounded-xl h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleSaveGroupConfig}
            disabled={!groupName.trim()}
            className="flex-1 rounded-xl h-11"
            style={{ backgroundColor: "#ef4444", color: "white" }}
          >
            Avançar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ---- Render: Group Items ----
  const renderGroupItems = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{groupName || "Grupo"}</h2>
              <p className="text-sm text-white/80">{groupType === "included" ? "Adicione os itens que já vêm no combo" : "Adicione os complementos"}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
        {/* New item form */}
        <div className="border border-border/50 rounded-xl p-4 bg-muted/10 space-y-3">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold">{groupType === "included" ? "Novo item incluso" : "Novo complemento"}</h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                {groupType === "included" ? "Informe os itens que já vêm no combo. Eles não terão preço adicional." : "Pressione Enter no nome para pular ao preço, e Enter no preço para adicionar"}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3">
            {/* Item image */}
            <button
              type="button"
              onClick={() => itemFileInputRef.current?.click()}
              disabled={uploadingItemImage}
              className="h-14 w-14 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-colors border-muted-foreground/20 hover:border-primary hover:bg-primary/5"
            >
              {uploadingItemImage ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : newItemImage ? (
                <img
                  src={newItemImage}
                  alt=""
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <input
              ref={itemFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleItemImageUpload}
            />

            <div className="flex-1 space-y-2">
              <Input
                ref={itemNameInputRef}
                value={newItemName}
                onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItemName.trim()) {
                    e.preventDefault();
                    groupType === "included" ? handleAddItem() : itemPriceInputRef.current?.focus();
                  }
                }}
                placeholder={groupType === "included" ? "Nome do item incluso" : "Nome do complemento"}
                className="h-9 rounded-lg border-border/50 text-sm"
              />
              {groupType === "included" ? (
                <div className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 flex items-center justify-between px-3 text-sm">
                  <span>Incluso no combo</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    ref={itemPriceInputRef}
                    type="text"
                    inputMode="numeric"
                    value={newItemPrice}
                    onChange={(e) =>
                      setNewItemPrice(formatPriceInputLocal(e.target.value))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newItemName.trim()) {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="0,00"
                    className="h-9 rounded-lg border-border/50 text-sm pl-8 text-right"
                  />
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="h-9 rounded-lg"
              style={{ backgroundColor: "#ef4444", color: "white" }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              {items.length} {groupType === "included" ? "item(ns) incluso(s)" : "complemento(s)"} adicionado(s)
            </h4>
            {items.map((item) => (
              <div
                key={item.uniqueId}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/10"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <ImagePlus className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {groupType === "included"
                      ? "Incluso no combo"
                      : `R$ ${parseFloat(item.price.replace(",", ".") || "0")
                          .toFixed(2)
                          .replace(".", ",")}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveItem(item.uniqueId)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{groupType === "included" ? "Nenhum item incluso adicionado ainda" : "Nenhum complemento adicionado ainda"}</p>
            <p className="text-xs mt-1">
              {groupType === "included" ? "Use o formulário acima para adicionar os itens que já vêm no combo" : "Use o formulário acima para adicionar complementos"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSubStep("group-config")}
            className="flex-1 rounded-xl h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleFinish}
            disabled={items.length === 0 || isSaving}
            className="flex-1 rounded-xl h-11"
            style={{ backgroundColor: "#ef4444", color: "white" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Concluir
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col [&>button]:hidden"
      >
        <VisuallyHidden><SheetTitle>Grupo de complementos</SheetTitle></VisuallyHidden>
        {subStep === "categories" && renderCategories()}
        {subStep === "choose" && renderChoose()}
        {subStep === "copy-group" && renderCopyGroup()}
        {subStep === "reorder-groups" && renderReorderGroups()}
        {subStep === "group-config" && renderGroupConfig()}
        {subStep === "group-items" && renderGroupItems()}
      </SheetContent>
    </Sheet>
  );
}
