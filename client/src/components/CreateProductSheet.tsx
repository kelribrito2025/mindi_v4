import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { compressImage } from "@/lib/imageCompression";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Copy,
  ChevronRight,
  Package,
  Layers,
  Clock,
  GripVertical,
  UtensilsCrossed,
  ClipboardList,
  PackageOpen,
  Info,
  Sparkles,
  Lock,
  Tag,
} from "lucide-react";
import ImageEnhanceModal from "@/components/ImageEnhanceModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn, capitalizeFirst, parsePriceInput } from "@/lib/utils";

// Types
interface ComplementItem {
  uniqueId: string;
  existingItemId?: number; // ID do item no banco (para preservar metadados ao salvar)
  name: string;
  description?: string;
  price: string;
  imageUrl?: string | null;
}

type GroupCategory = "ingredientes" | "especificacoes" | "descartaveis";
type GroupType = "complement" | "included";

interface ComplementGroup {
  existingGroupId?: number; // ID do grupo no banco (para preservar ao salvar)
  name: string;
  isRequired: boolean;
  minQuantity: number;
  maxQuantity: number;
  groupType: GroupType;
  items: ComplementItem[];
  category: GroupCategory;
}

type Step = 1 | 2 | 3;

// Sub-steps for step 2
type Step2Sub = "groups-list" | "group-config" | "group-items" | "copy-group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess: () => void;
  defaultCategoryId?: number;
  productId?: number; // Para edição de produto existente
  onDelete?: (id: number) => void; // Para exclusão com confirmação
  planType?: string;
}

export default function CreateProductSheet({ open, onOpenChange, establishmentId, onSuccess, defaultCategoryId, productId, onDelete, planType = 'trial' }: Props) {
  const isFreePlan = planType === 'trial' || planType === 'free';
  const isEditing = !!productId;
  // Step state
  const [step, setStep] = useState<Step>(1);
  const [step2Sub, setStep2Sub] = useState<Step2Sub>("groups-list");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Image enhance modal state
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [enhanceImageIndex, setEnhanceImageIndex] = useState(0);
  const [enhanceImageUrl, setEnhanceImageUrl] = useState("");

  // Delete image confirmation state
  const [deleteImageConfirmOpen, setDeleteImageConfirmOpen] = useState(false);
  const [deleteImageIndex, setDeleteImageIndex] = useState<number | null>(null);

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [hasStock, setHasStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Complement groups
  const [complementGroups, setComplementGroups] = useState<ComplementGroup[]>([]);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [activeGroupCategory, setActiveGroupCategory] = useState<GroupCategory | null>(null);
  // Group config form
  const [groupName, setGroupName] = useState("");
  const [groupIsRequired, setGroupIsRequired] = useState(false);
  const [groupMinQty, setGroupMinQty] = useState(0);
  const [groupMaxQty, setGroupMaxQty] = useState(1);
  const [groupType, setGroupType] = useState<GroupType>("complement");
  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const itemPriceInputRef = useRef<HTMLInputElement>(null);
  // Copy group
  const [selectedCopyGroupNames, setSelectedCopyGroupNames] = useState<string[]>([]);

  // Step 3: Price & availability
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [promoPercent, setPromoPercent] = useState("");
  const [showPromoFields, setShowPromoFields] = useState(false);
  const [availabilityType, setAvailabilityType] = useState<"always" | "scheduled">("always");
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [scheduleStartTime, setScheduleStartTime] = useState("08:00");
  const [scheduleEndTime, setScheduleEndTime] = useState("23:00");
  const [printerId, setPrinterId] = useState<string>("none");

  // Queries
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId },
    { enabled: open && !!establishmentId }
  );

  const { data: printers } = trpc.printer.list.useQuery(
    { establishmentId },
    { enabled: open && !!establishmentId }
  );

  // All complement groups for copy feature
  const { data: allGroupsForCopy } = trpc.complement.listAllGroups.useQuery(
    { establishmentId },
    { enabled: open && !!establishmentId && step2Sub === "copy-group" }
  );

  // Query para buscar produto existente (modo edição)
  const { data: existingProduct, isLoading: isLoadingProduct } = trpc.product.get.useQuery(
    { id: productId! },
    { enabled: open && isEditing }
  );

  // Query para buscar complementos do produto (modo edição)
  const { data: existingGroups, isLoading: isLoadingGroups } = trpc.complement.listGroups.useQuery(
    { productId: productId! },
    { enabled: open && isEditing && step >= 2 }
  );

  const isLoadingEditData = isEditing && isLoadingProduct;

  // Mutations
  const uploadMutation = trpc.upload.image.useMutation();

  const productSheetUtils = trpc.useUtils();
  const createMutation = trpc.product.create.useMutation({
    onSuccess: async (data) => {
      // Save complement groups
      if (complementGroups.length > 0) {
        await saveComplementGroups(data.id);
      }
      productSheetUtils.dashboard.onboardingChecklist.invalidate();
      productSheetUtils.catalogVersion.stats.invalidate();
      toast.success("Produto criado com sucesso!");
      resetState();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao criar produto");
      console.error(error);
    },
  });

  const createGroupMutation = trpc.complement.createGroup.useMutation();
  const createItemMutation = trpc.complement.createItem.useMutation();
  const deleteGroupMutation = trpc.complement.deleteGroup.useMutation();

  const syncGroupsMutation = trpc.complement.syncGroups.useMutation();

  // Mutation de update
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: async () => {
      // Sincronizar complementos de forma inteligente (preserva isActive e outros metadados)
      if (productId) {
        try {
          await syncGroupsMutation.mutateAsync({
            productId,
            groups: complementGroups.map(group => ({
              existingGroupId: group.existingGroupId,
              name: group.name,
              minQuantity: group.groupType === "included" ? 0 : group.minQuantity,
              maxQuantity: group.groupType === "included" ? 0 : group.maxQuantity,
              isRequired: group.groupType === "included" ? false : group.isRequired,
              groupType: group.groupType,
              items: group.items.map((item, idx) => ({
                existingItemId: item.existingItemId,
                name: item.name,
                price: group.groupType === "included" ? "0" : parsePriceInput(item.price),
                imageUrl: item.imageUrl || null,
                sortOrder: idx,
              })),
            })),
          });
        } catch (e) {
          console.error("Erro ao sincronizar complementos:", e);
          toast.error("Produto salvo, mas houve erro ao atualizar complementos");
        }
      }
      toast.success("Produto atualizado com sucesso!");
      productSheetUtils.catalogVersion.stats.invalidate();
      resetState();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto");
      console.error(error);
    },
  });

  // Save complement groups after product creation
  const saveComplementGroups = async (productId: number) => {
    try {
      for (const group of complementGroups) {
        const result = await createGroupMutation.mutateAsync({
          productId,
          name: group.name,
          minQuantity: group.groupType === "included" ? 0 : group.minQuantity,
          maxQuantity: group.groupType === "included" ? 0 : group.maxQuantity,
          isRequired: group.groupType === "included" ? false : group.isRequired,
          groupType: group.groupType,
        });

        for (let i = 0; i < group.items.length; i++) {
          const item = group.items[i];
          await createItemMutation.mutateAsync({
            groupId: result.id,
            name: item.name,
            price: group.groupType === "included" ? "0" : parsePriceInput(item.price),
            imageUrl: item.imageUrl || null,
            sortOrder: i,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar complementos:", error);
      toast.error("Produto criado, mas houve erro ao salvar complementos");
    }
  };

  // Reset all state
  const resetState = useCallback(() => {
    setStep(1);
    setStep2Sub("groups-list");
    setName("");
    setDescription("");
    setCategoryId("");
    setStatus("active");
    setHasStock(false);
    setStockQuantity("");
    setImages([]);
    setComplementGroups([]);
    setEditingGroupIndex(null);
    setGroupName("");
    setGroupIsRequired(false);
    setGroupMinQty(0);
    setGroupMaxQty(1);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemImage(null);
    setPrice("");
    setCost("");
    setAvailabilityType("always");
    setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    setScheduleStartTime("08:00");
    setScheduleEndTime("23:00");
    setPrinterId("none");
    setSelectedCopyGroupNames([]);
    setActiveGroupCategory(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      setDataLoaded(false);
    } else if (defaultCategoryId && !isEditing) {
      setCategoryId(String(defaultCategoryId));
    }
  }, [open, resetState, defaultCategoryId, isEditing]);

  // Preencher campos com dados do produto existente (modo edição)
  useEffect(() => {
    if (open && isEditing && existingProduct && !dataLoaded) {
      setName(existingProduct.name || "");
      setDescription(existingProduct.description || "");
      setCategoryId(existingProduct.categoryId ? String(existingProduct.categoryId) : "");
      setStatus((existingProduct.status as "active" | "paused") || "active");
      setHasStock(existingProduct.hasStock || false);
      setStockQuantity(existingProduct.stockQuantity !== null && existingProduct.stockQuantity !== undefined ? String(existingProduct.stockQuantity) : "");
      setImages(existingProduct.images || []);
      setPrinterId(existingProduct.printerId ? String(existingProduct.printerId) : "none");
      // Formatar preço
      if (existingProduct.price) {
        const cents = Math.round(Number(existingProduct.price) * 100);
        const reais = cents / 100;
        setPrice(reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
      // Formatar custo (CMV)
      if (existingProduct.cost) {
        const costCents = Math.round(Number(existingProduct.cost) * 100);
        const costReais = costCents / 100;
        setCost(costReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
      // Formatar preço promocional
      if (existingProduct.promotionalPrice) {
        const promoCents = Math.round(Number(existingProduct.promotionalPrice) * 100);
        const promoReais = promoCents / 100;
        setPromotionalPrice(promoReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        const originalPrice = Number(existingProduct.price);
        if (originalPrice > 0) {
          const disc = Math.round((1 - Number(existingProduct.promotionalPrice) / originalPrice) * 100);
          setPromoPercent(String(disc));
        }
        setShowPromoFields(true);
      }
      setDataLoaded(true);
    }
  }, [open, isEditing, existingProduct, dataLoaded]);

  // Carregar complementos existentes (modo edição)
  useEffect(() => {
    if (open && isEditing && existingGroups && dataLoaded && complementGroups.length === 0 && existingGroups.length > 0) {
      const loadedGroups: ComplementGroup[] = existingGroups.map((group: any) => ({
        existingGroupId: group.id, // Preservar ID do grupo para sincronização inteligente
        name: group.name,
        isRequired: group.groupType === "included" ? false : (group.isRequired || group.minQuantity >= 1),
        minQuantity: group.groupType === "included" ? 0 : group.minQuantity,
        maxQuantity: group.groupType === "included" ? 0 : group.maxQuantity,
        groupType: (group.groupType || "complement") as GroupType,
        items: (group.items || []).map((item: any) => ({
          uniqueId: `existing-${item.id}-${Math.random().toString(36).substr(2, 9)}`,
          existingItemId: item.id, // Preservar ID do item para não perder isActive e outros metadados
          name: item.name,
          description: item.description || undefined,
          price: parseFloat(String(item.price || "0")).toFixed(2).replace('.', ','),
          imageUrl: item.imageUrl || null,
        })),
        category: "ingredientes" as GroupCategory,
      }));
      setComplementGroups(loadedGroups);
    }
  }, [open, isEditing, existingGroups, dataLoaded]);

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 15MB");
      return;
    }
    setUploading(true);
    compressImage(file).then(({ base64, mimeType }) => {
      uploadMutation.mutate(
        { base64, mimeType, folder: "products" },
        {
          onSuccess: (data) => {
            const newIndex = images.length;
            setImages(prev => {
              if (prev.length >= 3) {
                toast.error("Máximo de 3 fotos por produto");
                return prev;
              }
              return [...prev, data.url];
            });
            // Auto-abrir modal de melhorar foto com IA após upload
            if (newIndex < 3) {
              setEnhanceImageUrl(data.url);
              setEnhanceImageIndex(newIndex);
              setEnhanceModalOpen(true);
            }
          },
          onError: () => toast.error("Erro ao enviar imagem"),
          onSettled: () => setUploading(false),
        }
      );
    }).catch(() => {
      toast.error("Erro ao processar imagem");
      setUploading(false);
    });
    e.target.value = "";
  }, [uploadMutation]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Complement item image upload
  const handleItemImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 15MB");
      return;
    }
    setUploadingItemImage(true);
    compressImage(file).then(({ base64, mimeType }) => {
      uploadMutation.mutate(
        { base64, mimeType, folder: "complements" },
        {
          onSuccess: (data) => {
            setNewItemImage(data.url);
            toast.success("Imagem enviada");
          },
          onError: () => toast.error("Erro ao enviar imagem"),
          onSettled: () => setUploadingItemImage(false),
        }
      );
    }).catch(() => {
      toast.error("Erro ao processar imagem");
      setUploadingItemImage(false);
    });
    e.target.value = "";
  }, [uploadMutation]);

  // Price formatting
  const formatPriceInputLocal = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    const cents = parseInt(numbers || "0", 10);
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Add complement item to current group
  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error("Nome do complemento é obrigatório");
      return;
    }
    const groupIdx = editingGroupIndex ?? complementGroups.length - 1;
    if (groupIdx < 0) return;

    const newItem: ComplementItem = {
      uniqueId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
      price: complementGroups[groupIdx]?.groupType === "included" ? "0,00" : (newItemPrice || "0,00"),
      imageUrl: newItemImage,
    };

    setComplementGroups(prev => {
      const updated = [...prev];
      updated[groupIdx] = {
        ...updated[groupIdx],
        items: [...updated[groupIdx].items, newItem],
      };
      return updated;
    });

    // Reset item form
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemImage(null);
    toast.success(complementGroups[groupIdx]?.groupType === "included" ? "Item incluso adicionado" : "Complemento adicionado");
    // Focar no campo de nome para facilitar adição contínua
    setTimeout(() => itemNameInputRef.current?.focus(), 50);
  };

  // Remove complement item
  const handleRemoveItem = (groupIdx: number, itemIdx: number) => {
    setComplementGroups(prev => {
      const updated = [...prev];
      updated[groupIdx] = {
        ...updated[groupIdx],
        items: updated[groupIdx].items.filter((_, i) => i !== itemIdx),
      };
      return updated;
    });
  };

  // Save group config and go to items
  const handleSaveGroupConfig = () => {
    if (!groupName.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }

    if (editingGroupIndex !== null) {
      // Update existing group
      setComplementGroups(prev => {
        const updated = [...prev];
        updated[editingGroupIndex] = {
          ...updated[editingGroupIndex],
          name: groupName.trim(),
          isRequired: groupType === "included" ? false : groupIsRequired,
          minQuantity: groupType === "included" ? 0 : groupMinQty,
          maxQuantity: groupType === "included" ? 0 : groupMaxQty,
          groupType,
        };
        return updated;
      });
    } else {
      // Create new group
      setComplementGroups(prev => [
        ...prev,
        {
          name: groupName.trim(),
          isRequired: groupType === "included" ? false : groupIsRequired,
          minQuantity: groupType === "included" ? 0 : groupMinQty,
          maxQuantity: groupType === "included" ? 0 : groupMaxQty,
          groupType,
          items: [],
          category: activeGroupCategory || "ingredientes",
        },
      ]);
      setEditingGroupIndex(complementGroups.length);
    }

    setStep2Sub("group-items");
  };

  // Finish group and go back to list
  const handleFinishGroup = () => {
    setEditingGroupIndex(null);
    setGroupName("");
    setGroupIsRequired(false);
    setGroupMinQty(0);
    setGroupMaxQty(1);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemImage(null);
    setStep2Sub("groups-list");
  };

  // Start editing a group
  const handleEditGroup = (index: number) => {
    const group = complementGroups[index];
    setEditingGroupIndex(index);
    setGroupName(group.name);
    setGroupType((group.groupType || "complement") as GroupType);
    setGroupIsRequired(group.groupType === "included" ? false : group.isRequired);
    setGroupMinQty(group.groupType === "included" ? 0 : group.minQuantity);
    setGroupMaxQty(group.groupType === "included" ? 0 : group.maxQuantity);
    setStep2Sub("group-items");
  };

  // Remove a group
  const handleRemoveGroup = (index: number) => {
    setComplementGroups(prev => prev.filter((_, i) => i !== index));
  };

  // Copy groups from existing complement groups
  const handleCopyGroups = () => {
    if (!allGroupsForCopy || selectedCopyGroupNames.length === 0) {
      toast.error("Selecione pelo menos um grupo para copiar");
      return;
    }
    const groupsToCopy = allGroupsForCopy.filter((g: any) => selectedCopyGroupNames.includes(g.name));
    if (groupsToCopy.length === 0) {
      toast.error("Nenhum grupo selecionado");
      return;
    }

    const copied: ComplementGroup[] = groupsToCopy.map((g: any) => ({
      name: g.name,
      groupType: ((g.groupType || "complement") as GroupType),
      isRequired: (g.groupType || "complement") === "included" ? false : g.isRequired,
      minQuantity: (g.groupType || "complement") === "included" ? 0 : g.minQuantity,
      maxQuantity: (g.groupType || "complement") === "included" ? 0 : g.maxQuantity,
      items: (g.items || []).map((item: any) => ({
        uniqueId: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        price: parseFloat(String(item.price || "0")).toFixed(2).replace('.', ','),
        imageUrl: item.imageUrl || null,
      })),
      category: activeGroupCategory || "ingredientes",
    }));

    setComplementGroups(prev => [...prev, ...copied]);
    setSelectedCopyGroupNames([]);
    setStep2Sub("groups-list");
    toast.success(`${copied.length} grupo(s) copiado(s)`);
  };

  // Submit product
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Nome do produto é obrigatório");
      setStep(1);
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria para o produto");
      setStep(1);
      return;
    }
    if (price === undefined || price === null || price === "") {
      toast.error("Defina o preço do produto");
      return;
    }

    if (isEditing && productId) {
      const promoVal = showPromoFields && promotionalPrice ? parsePriceInput(promotionalPrice) : null;
      updateMutation.mutate({
        id: productId,
        name: name.trim(),
        description: description.trim() || null,
        categoryId: categoryId ? Number(categoryId) : null,
        price: parsePriceInput(price),
        cost: cost ? parsePriceInput(cost) : null,
        promotionalPrice: promoVal,
        images: images.length > 0 ? images : [],
        status,
        hasStock,
        stockQuantity: stockQuantity ? Number(stockQuantity) : null,
        printerId: printerId && printerId !== "none" ? Number(printerId) : null,
      });
    } else {
      const promoValCreate = showPromoFields && promotionalPrice ? parsePriceInput(promotionalPrice) : null;
      createMutation.mutate({
        establishmentId,
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId ? Number(categoryId) : null,
        price: parsePriceInput(price),
        cost: cost ? parsePriceInput(cost) : null,
        promotionalPrice: promoValCreate,
        images: images.length > 0 ? images : [],
        status,
        hasStock,
        stockQuantity: stockQuantity ? Number(stockQuantity) : null,
        printerId: printerId && printerId !== "none" ? Number(printerId) : null,
      });
    }
  };

  const stepTitles = ["Informações", "Complementos", "Preço e Disponibilidade"];

  // ============ RENDER STEP 1: Basic Info ============
  const renderStep1 = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{isEditing ? "Editar Produto" : "Novo Produto"}</h2>
              <p className="text-sm text-white/80">Passo 1 de 3 — Informações básicas</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1.5 mt-3">
          <div className="flex-1 h-1 rounded-full bg-white" />
          <div className="flex-1 h-1 rounded-full bg-white/30" />
          <div className="flex-1 h-1 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
        {/* Product images - up to 3 */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Imagens do produto <span className="text-xs text-muted-foreground font-normal">({images.length}/3)</span></Label>
          <div className="flex items-center gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border/50 group flex-shrink-0">
                <img loading="lazy" src={img} alt={`Produto ${index + 1}`} className="h-full w-full object-cover" />
                {isEditing && existingProduct?.enhancedImages && (existingProduct.enhancedImages as string[])[index] && (existingProduct.enhancedImages as string[])[index].length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-0 right-0 bg-red-500 rounded-bl-md rounded-tr-xl p-0.5 cursor-default z-10">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Foto aprimorada com Mindi Vision</TooltipContent>
                  </Tooltip>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                      type="button"
                      onClick={() => {
                        setEnhanceImageUrl(img);
                        setEnhanceImageIndex(index);
                        setEnhanceModalOpen(true);
                      }}
                      className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm"
                      title="Melhorar foto com IA"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteImageIndex(index);
                      setDeleteImageConfirmOpen(true);
                    }}
                    className="p-1.5 bg-destructive text-white rounded-lg shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors flex-shrink-0"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">Adicionar</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <Label className="text-sm font-semibold">Nome do produto *</Label>
          <Input
            value={name}
            onChange={(e) => setName(capitalizeFirst(e.target.value))}
            placeholder="Ex: X-Burger Especial"
            className="mt-1.5 h-10 rounded-xl border-border/50"
          />
        </div>

        {/* Price & Cost - side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Preço de venda *</Label>
              <button
                type="button"
                onClick={() => setShowPromoFields(!showPromoFields)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors",
                  showPromoFields || promotionalPrice
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Tag className="h-3 w-3" />
                {showPromoFields || promotionalPrice ? "Promo ativa" : "Promo"}
              </button>
            </div>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => {
                  const newPrice = formatPriceInputLocal(e.target.value);
                  setPrice(newPrice);
                  // Recalculate promo percent if promo is active
                  if (showPromoFields && promotionalPrice) {
                    const origNum = parseFloat(newPrice.replace(/\./g, '').replace(',', '.')) || 0;
                    const promoNum = parseFloat(promotionalPrice.replace(/\./g, '').replace(',', '.')) || 0;
                    if (origNum > 0 && promoNum > 0 && promoNum < origNum) {
                      setPromoPercent(String(Math.round((1 - promoNum / origNum) * 100)));
                    }
                  }
                }}
                placeholder="0,00"
                className="h-12 text-lg rounded-xl border-border/50 pl-10 font-semibold"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">Custo (CMV)</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                type="text"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(formatPriceInputLocal(e.target.value))}
                placeholder="0,00"
                className="h-12 text-lg rounded-xl border-border/50 pl-10 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Promo fields - inline expand */}
        {showPromoFields && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 -mt-1">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Preço promocional</Label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={promotionalPrice}
                    onChange={(e) => {
                      const formatted = formatPriceInputLocal(e.target.value);
                      setPromotionalPrice(formatted);
                      // Auto-calc percent
                      const origNum = parseFloat(price.replace(/\./g, '').replace(',', '.')) || 0;
                      const promoNum = parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
                      if (origNum > 0 && promoNum > 0 && promoNum < origNum) {
                        setPromoPercent(String(Math.round((1 - promoNum / origNum) * 100)));
                      } else {
                        setPromoPercent('');
                      }
                    }}
                    placeholder="0,00"
                    className="h-9 text-sm rounded-lg pl-8 font-medium"
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-muted-foreground mt-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
              </div>
              <div className="w-20">
                <Label className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Desconto</Label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={promoPercent}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      const pct = Math.min(parseInt(digits, 10) || 0, 99);
                      setPromoPercent(digits ? String(pct) : '');
                      // Auto-calc price
                      const origNum = parseFloat(price.replace(/\./g, '').replace(',', '.')) || 0;
                      if (origNum > 0 && pct > 0) {
                        const newPrice = origNum * (1 - pct / 100);
                        const cents = Math.round(newPrice * 100);
                        const reais = cents / 100;
                        setPromotionalPrice(reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      } else if (!digits) {
                        setPromotionalPrice('');
                      }
                    }}
                    placeholder="0"
                    className="h-9 text-sm rounded-lg pl-7 font-medium"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPromoFields(false);
                setPromotionalPrice('');
                setPromoPercent('');
              }}
              className="text-xs text-red-500 hover:text-red-500 mt-2 font-medium"
            >
              Remover promoção
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground -mt-1">
          O custo é usado no cálculo do CMV no DRE. Se não souber, deixe em branco.
        </p>

        {/* Description */}
        <div>
          <Label className="text-sm font-semibold">Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(capitalizeFirst(e.target.value))}
            placeholder="Descreva os ingredientes e características"
            rows={2}
            className="mt-1.5 rounded-xl border-border/50 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <Label className="text-sm font-semibold">Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="mt-1.5 h-10 rounded-xl border-border/50">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)} className="rounded-lg">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div>
            <Label className="text-sm font-semibold">Status</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Produtos pausados não aparecem no cardápio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-md",
              status === "active"
                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30"
            )}>
              {status === "active" ? "Ativo" : "Pausado"}
            </span>
            <Switch
              checked={status === "active"}
              onCheckedChange={(checked) => setStatus(checked ? "active" : "paused")}
            />
          </div>
        </div>

        {/* Stock */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl relative">
            <div>
              <Label className="text-sm font-semibold">Controle de estoque</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isFreePlan ? 'Assine um plano para liberar este recurso' : 'Ative para controlar quantidade disponível'}
              </p>
            </div>
            {isFreePlan ? (
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Switch checked={false} disabled />
              </div>
            ) : (
              <Switch checked={hasStock} onCheckedChange={setHasStock} />
            )}
          </div>
          {hasStock && (
            <div className="pl-3">
              <Label className="text-sm font-semibold">Quantidade em estoque</Label>
              <Input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                className="mt-1.5 h-10 rounded-xl border-border/50 w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          onClick={() => {
            if (!name.trim()) {
              toast.error("Nome do produto é obrigatório");
              return;
            }
            if (!categoryId) {
              toast.error("Selecione uma categoria para o produto");
              return;
            }
            setStep(2);
          }}
          className="w-full rounded-xl h-11"
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          Avançar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // ============ RENDER STEP 2: Complement Groups ============
  const renderStep2 = () => {
    // Sub-step: Groups list
    if (step2Sub === "groups-list") {
      return (
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
                  <p className="text-sm text-white/80">Passo 2 de 3 — Grupos de complementos</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex gap-1.5 mt-3">
              <div className="flex-1 h-1 rounded-full bg-white" />
              <div className="flex-1 h-1 rounded-full bg-white" />
              <div className="flex-1 h-1 rounded-full bg-white/30" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
            {/* Category tabs when no category is selected */}
            {!activeGroupCategory ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Escolha o tipo de complemento que deseja adicionar
                </p>

                {/* Ingredientes */}
                <button
                  onClick={() => setActiveGroupCategory("ingredientes")}
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
                  {complementGroups.filter(g => g.category === "ingredientes").length > 0 && (
                    <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 px-2 py-0.5 rounded-lg">
                      {complementGroups.filter(g => g.category === "ingredientes").length}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Especificações */}
                <button
                  onClick={() => setActiveGroupCategory("especificacoes")}
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
                  {complementGroups.filter(g => g.category === "especificacoes").length > 0 && (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded-lg">
                      {complementGroups.filter(g => g.category === "especificacoes").length}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Descartáveis */}
                <button
                  onClick={() => setActiveGroupCategory("descartaveis")}
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
                  {complementGroups.filter(g => g.category === "descartaveis").length > 0 && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                      {complementGroups.filter(g => g.category === "descartaveis").length}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Summary of all groups */}
                {complementGroups.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {complementGroups.length} grupo(s) adicionado(s) no total
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Category selected - show groups for this category */
              <>
                {/* Groups for this category */}
                {complementGroups.filter(g => g.category === activeGroupCategory).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-muted/30 rounded-2xl inline-block mb-3">
                      <Layers className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Nenhum grupo adicionado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeGroupCategory === "ingredientes" && 'Adicione grupos como "Adicionais", "Molhos", etc.'}
                      {activeGroupCategory === "especificacoes" && 'Adicione perguntas como "Ponto da carne", "Tamanho", etc.'}
                      {activeGroupCategory === "descartaveis" && 'Adicione grupos como "Embalagens", "Talheres", etc.'}
                    </p>
                  </div>
                ) : (
                  complementGroups.map((group, idx) => {
                    if (group.category !== activeGroupCategory) return null;
                    return (
                      <div
                        key={idx}
                        className="border border-border/50 rounded-xl p-3 bg-muted/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{group.name}</span>
                            {group.groupType === "included" ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                                Incluso
                              </span>
                            ) : (group.isRequired || group.minQuantity >= 1) ? (
                              <span className="text-[10px] bg-red-100 text-red-500 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                                Obrigatório
                              </span>
                            ) : (
                              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                                Opcional
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditGroup(idx)}
                              className="h-7 w-7 rounded-lg"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveGroup(idx)}
                              className="h-7 w-7 rounded-lg hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.items.length} {group.items.length === 1 ? "item" : "itens"}{group.groupType === "included" ? " • Já incluso no combo" : ` • Mín: ${group.minQuantity} / Máx: ${group.maxQuantity}`}
                        </p>
                        {group.items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {group.items.slice(0, 5).map((item, i) => (
                              <span key={i} className="text-[10px] bg-card px-2 py-0.5 rounded-md border border-border/50">
                                {item.name}
                              </span>
                            ))}
                            {group.items.length > 5 && (
                              <span className="text-[10px] text-muted-foreground px-1">
                                +{group.items.length - 5} mais
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingGroupIndex(null);
                      setGroupName("");
                      setGroupIsRequired(false);
                      setGroupMinQty(0);
                      setGroupMaxQty(1);
                      setGroupType("complement");
                      setStep2Sub("group-config");
                    }}
                    className="w-full rounded-xl h-10 border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar novo grupo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCopyGroupNames([]);
                      setStep2Sub("copy-group");
                    }}
                    className="w-full rounded-xl h-10 border-dashed"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar grupo existente
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (activeGroupCategory) {
                    setActiveGroupCategory(null);
                  } else {
                    setStep(1);
                  }
                }}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sub-step: Group config
    if (step2Sub === "group-config") {
      return (
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
                    {activeGroupCategory === "ingredientes" && "Ingredientes — "}
                    {activeGroupCategory === "especificacoes" && "Especificações — "}
                    {activeGroupCategory === "descartaveis" && "Descartáveis — "}
                    Defina as regras do grupo
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
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
                  activeGroupCategory === "ingredientes"
                    ? "Ex: Adicionais, Molhos, Extras..."
                    : activeGroupCategory === "especificacoes"
                    ? "Ex: Ponto da carne, Tamanho, Tipo de pão..."
                    : activeGroupCategory === "descartaveis"
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
                onClick={() => setStep2Sub("groups-list")}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleSaveGroupConfig}
                disabled={!groupName.trim()}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sub-step: Group items
    if (step2Sub === "group-items") {
      const groupIdx = editingGroupIndex ?? complementGroups.length - 1;
      const currentGroup = complementGroups[groupIdx];

      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{currentGroup?.name || "Grupo"}</h2>
                  <p className="text-sm text-white/80">{currentGroup?.groupType === "included" ? "Adicione os itens que já vêm no combo" : "Adicione os complementos"}</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
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
                <h4 className="text-sm font-semibold">{currentGroup?.groupType === "included" ? "Novo item incluso" : "Novo complemento"}</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-center">
                    {currentGroup?.groupType === "included" ? "Informe os itens que já vêm no combo. Eles não terão preço adicional." : "Pressione Enter no nome para pular ao preço, e Enter no preço para adicionar"}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-3">
                {/* Item image */}
                <button
                  type="button"
                  onClick={() => itemFileInputRef.current?.click()}
                  disabled={uploadingItemImage}
                  className={cn(
                    "h-14 w-14 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-colors",
                    newItemImage
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : "border-muted-foreground/20 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {uploadingItemImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : newItemImage ? (
                    <img loading="lazy" src={newItemImage} alt="" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <input
                  ref={itemFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleItemImageUpload}
                  className="hidden"
                />

                <div className="flex-1 space-y-2">
                  <Input
                    ref={itemNameInputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newItemName.trim()) { e.preventDefault(); currentGroup?.groupType === "included" ? handleAddItem() : itemPriceInputRef.current?.focus(); } }}
                    placeholder={currentGroup?.groupType === "included" ? "Nome do item incluso *" : "Nome do complemento *"}
                    className="h-9 rounded-lg border-border/50 text-sm"
                  />
                  {currentGroup?.groupType === "included" ? (
                    <div className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 flex items-center justify-between px-3 text-sm">
                      <span>Incluso no combo</span>
                      <span className="font-semibold">R$ 0,00</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">R$</span>
                      <Input
                        ref={itemPriceInputRef}
                        type="text"
                        inputMode="numeric"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(formatPriceInputLocal(e.target.value))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newItemName.trim()) { e.preventDefault(); handleAddItem(); } }}
                        placeholder="0,00"
                        className="h-9 rounded-lg border-border/50 text-sm pl-8 text-right"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                variant="outline"
                className="w-full rounded-xl h-9 text-sm border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {currentGroup?.groupType === "included" ? "Adicionar item incluso" : "Adicionar ao grupo"}
              </Button>
            </div>

            {/* Items list */}
            {currentGroup && currentGroup.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Itens adicionados ({currentGroup.items.length})
                </h4>
                {currentGroup.items.map((item, itemIdx) => (
                  <div
                    key={item.uniqueId}
                    className="flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border/50"
                  >
                    {item.imageUrl ? (
                      <img loading="lazy" src={item.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentGroup.groupType === "included" ? "Incluso no combo" : `R$ ${parseFloat(item.price.replace(',', '.') || "0").toFixed(2).replace('.', ',')}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(groupIdx, itemIdx)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep2Sub("group-config")}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleFinishGroup}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <Check className="h-4 w-4 mr-2" />
                Concluir grupo
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sub-step: Copy group
    if (step2Sub === "copy-group") {
      const availableGroups = (allGroupsForCopy || []) as any[];

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
                onClick={() => onOpenChange(false)}
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
                const isSelected = selectedCopyGroupNames.includes(group.name);
                return (
                  <div
                    key={group.name}
                    onClick={() => {
                      setSelectedCopyGroupNames((prev) =>
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
                      <p className="text-sm font-medium truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.complementCount || group.items?.length || 0} complemento(s) &middot; {group.productCount || 1} produto(s)
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
                onClick={() => { setSelectedCopyGroupNames([]); setStep2Sub("groups-list"); }}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleCopyGroups}
                disabled={selectedCopyGroupNames.length === 0}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar {selectedCopyGroupNames.length > 0 ? `(${selectedCopyGroupNames.length})` : ""}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ============ RENDER STEP 3: Price & Availability ============
  const renderStep3 = () => {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Finalizar</h2>
                <p className="text-sm text-white/80">Passo 3 de 3 — Disponibilidade</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="flex gap-1.5 mt-3">
            <div className="flex-1 h-1 rounded-full bg-white" />
            <div className="flex-1 h-1 rounded-full bg-white" />
            <div className="flex-1 h-1 rounded-full bg-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
          {/* Printer/Sector */}
          {printers && printers.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">Setor de Preparo (Impressora)</Label>
              <Select value={printerId} onValueChange={setPrinterId}>
                <SelectTrigger className="mt-1.5 h-10 rounded-xl border-border/50">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="rounded-lg text-muted-foreground">
                    Todas as impressoras
                  </SelectItem>
                  {printers.map((printer: any) => (
                    <SelectItem key={printer.id} value={String(printer.id)} className="rounded-lg">
                      {printer.name} ({printer.ipAddress})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Availability */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Disponibilidade</Label>

            <div className="space-y-2">
              <div
                onClick={() => setAvailabilityType("always")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors",
                  availabilityType === "always"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500"
                    : "bg-card border-border/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  availabilityType === "always" ? "border-red-500" : "border-muted-foreground/30"
                )}>
                  {availabilityType === "always" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Sempre disponível</p>
                  <p className="text-xs text-muted-foreground">Disponível em todos os horários</p>
                </div>
              </div>

              <div
                onClick={() => {
                  if (isFreePlan) {
                    toast.error('Assine um plano para liberar este recurso');
                    return;
                  }
                  setAvailabilityType("scheduled");
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  isFreePlan ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                  availabilityType === "scheduled"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500"
                    : "bg-card border-border/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  availabilityType === "scheduled" ? "border-red-500" : "border-muted-foreground/30"
                )}>
                  {availabilityType === "scheduled" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dias e horários específicos</p>
                  <p className="text-xs text-muted-foreground">{isFreePlan ? 'Assine um plano para liberar este recurso' : 'Defina quando o produto fica disponível'}</p>
                </div>
                {isFreePlan && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {availabilityType === "scheduled" && (
              <div className="space-y-4 pt-2 pl-2">
                {/* Days */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Dias da semana</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {dayNames.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setScheduleDays(prev =>
                            prev.includes(idx)
                              ? prev.filter(d => d !== idx)
                              : [...prev, idx]
                          );
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                          scheduleDays.includes(idx)
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-card text-muted-foreground border-border/50 hover:bg-muted/50"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Início</Label>
                    <Input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      className="mt-1 h-10 rounded-xl border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Fim</Label>
                    <Input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      className="mt-1 h-10 rounded-xl border-border/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border border-border/50 rounded-xl p-4 bg-muted/10 space-y-2">
            <h4 className="text-sm font-semibold">Resumo do produto</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{name || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Categoria</span>
                <span className="font-medium">
                  {categoryId ? categories?.find(c => String(c.id) === categoryId)?.name || "—" : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Preço</span>
                <span className="font-medium">R$ {price || "0,00"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Complementos</span>
                <span className="font-medium">{complementGroups.length} grupo(s)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className={cn(
                  "font-medium",
                  status === "active" ? "text-emerald-600" : "text-amber-600"
                )}>
                  {status === "active" ? "Ativo" : "Pausado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card space-y-2">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 rounded-xl h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={(isEditing ? updateMutation.isPending : createMutation.isPending) || !price}
              className="flex-1 rounded-xl h-11"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              {(isEditing ? updateMutation.isPending : createMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? "Salvar alterações" : "Criar produto"}
                </>
              )}
            </Button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">{isEditing ? "Editar produto" : "Criar produto"}</SheetTitle>
        <SheetDescription className="sr-only">{isEditing ? "Edite as informações do produto" : "Crie um novo produto para o cardápio"}</SheetDescription>
        {isLoadingEditData ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-red-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">Carregando produto...</p>
              <p className="text-sm text-gray-400 mt-1">Buscando informações do produto</p>
            </div>
          </div>
        ) : (
          <>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </>
        )}
      </SheetContent>
    </Sheet>

    {/* Modal de melhoramento de imagem com IA */}
    <ImageEnhanceModal
      open={enhanceModalOpen}
      onOpenChange={setEnhanceModalOpen}
      productId={productId}
      establishmentId={establishmentId}
      imageUrl={enhanceImageUrl}
      imageIndex={enhanceImageIndex}
      onEnhanced={(enhancedUrl) => {
        const newImages = [...images];
        newImages[enhanceImageIndex] = enhancedUrl;
        setImages(newImages);
      }}
    />

    {/* Modal de confirmação de exclusão de foto */}
    <Dialog open={deleteImageConfirmOpen} onOpenChange={setDeleteImageConfirmOpen}>
      <DialogContent
        className="sm:max-w-sm p-0 overflow-hidden border-t-4 border-t-red-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Excluir foto</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Excluir foto</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Tem certeza que deseja excluir esta foto do produto?
              </p>
            </div>
          </div>
          {deleteImageIndex !== null && images[deleteImageIndex] && (
            <div className="mb-4 flex justify-center">
              <img
                src={images[deleteImageIndex]}
                alt="Foto a excluir"
                className="h-24 w-24 object-cover rounded-xl border border-border/50"
              />
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteImageConfirmOpen(false);
                setDeleteImageIndex(null);
              }}
              className="flex-1 rounded-xl h-10"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              onClick={() => {
                if (deleteImageIndex !== null) {
                  removeImage(deleteImageIndex);
                  setDeleteImageConfirmOpen(false);
                  setDeleteImageIndex(null);
                }
              }}
            >
              Excluir foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
