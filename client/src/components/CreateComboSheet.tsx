import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { compressImage } from "@/lib/imageCompression";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Search,
  Plus,
  Minus,
  GripVertical,
  Trash2,
  ArrowLeft,
  Check,
  UtensilsCrossed,
  Layers,
  ChevronRight,
  Camera,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn, parsePriceInput } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Types
interface SelectedProduct {
  id: number;
  name: string;
  price: string;
  images: string[] | null;
  categoryName: string | null;
}

interface ComboGroup {
  name: string;
  isRequired: boolean;
  maxQuantity: number;
  items: SelectedProduct[];
}

type Step = "select-products" | "configure-group" | "overview";

export default function CreateComboSheet({
  open,
  onOpenChange,
  establishmentId,
  categoryId,
  categoryName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  categoryId: number;
  categoryName: string;
  onSuccess: () => void;
}) {
  // State
  const [step, setStep] = useState<Step>("select-products");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<SelectedProduct[]>([]);
  
  // Group config state
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"required" | "optional">("required");
  const [maxQuantity, setMaxQuantity] = useState(1);
  
  // All groups
  const [groups, setGroups] = useState<ComboGroup[]>([]);
  
  // Editing group index (null = creating new)
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  
  // Combo name, description, price and image
  const [comboName, setComboName] = useState("");
  const [comboDescription, setComboDescription] = useState("");
  const [comboPrice, setComboPrice] = useState("");

  // Price formatting - Brazilian currency mask
  const formatPriceInputLocal = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    const cents = parseInt(numbers || "0", 10);
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const [comboImage, setComboImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search products query
  const { data: searchResults, isLoading: searchLoading } = trpc.combo.searchProducts.useQuery(
    { establishmentId, search: debouncedSearch || undefined, limit: 20 },
    { enabled: open && !!establishmentId && debouncedSearch.trim().length > 0 }
  );

  // Upload image mutation
  const uploadMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      setComboImage(data.url);
      toast.success("Imagem enviada com sucesso");
    },
    onError: () => toast.error("Erro ao enviar imagem"),
    onSettled: () => setUploading(false),
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB");
      return;
    }
    setUploading(true);
    compressImage(file).then(({ base64, mimeType }) => {
      uploadMutation.mutate({ base64, mimeType, folder: "combos" });
    }).catch(() => {
      toast.error("Erro ao processar imagem");
      setUploading(false);
    });
    e.target.value = "";
  }, [uploadMutation]);

  // Create combo mutation
  const createComboMutation = trpc.combo.create.useMutation({
    onSuccess: () => {
      toast.success("Combo criado com sucesso!");
      resetState();
      onOpenChange(false);
      onSuccess();
    },
    onError: () => toast.error("Erro ao criar combo"),
  });

  const resetState = useCallback(() => {
    setStep("select-products");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedProducts([]);
    setGroupedProducts([]);
    setGroupName("");
    setGroupType("required");
    setMaxQuantity(1);
    setGroups([]);
    setEditingGroupIndex(null);
    setComboName("");
    setComboDescription("");
    setComboPrice("");
    setComboImage(null);
  }, []);

  // Reset when closing
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  // Filter out already grouped products from search results
  const allGroupedProductIds = useMemo(() => {
    const ids = new Set<number>();
    groups.forEach(g => g.items.forEach(item => ids.add(item.id)));
    groupedProducts.forEach(item => ids.add(item.id));
    return ids;
  }, [groups, groupedProducts]);

  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter(p => !allGroupedProductIds.has(p.id));
  }, [searchResults, allGroupedProductIds]);

  // Toggle product selection
  const toggleProductSelection = useCallback((product: any) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        categoryName: product.categoryName,
      }];
    });
  }, []);

  // Group selected products
  const handleGroupProducts = useCallback(() => {
    if (selectedProducts.length === 0) return;
    setGroupedProducts(prev => [...prev, ...selectedProducts]);
    setSelectedProducts([]);
    setSearchQuery("");
  }, [selectedProducts]);

  // Remove grouped product
  const removeGroupedProduct = useCallback((productId: number) => {
    setGroupedProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Continue to configure group
  const handleContinueToConfig = useCallback(() => {
    if (groupedProducts.length === 0) return;
    setStep("configure-group");
  }, [groupedProducts]);

  // Go back from config to select
  const handleBackToSelect = useCallback(() => {
    setStep("select-products");
  }, []);

  // Complete group configuration
  const handleCompleteGroup = useCallback(() => {
    if (!groupName.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    if (groupedProducts.length === 0) {
      toast.error("Adicione pelo menos um produto ao grupo");
      return;
    }

    const newGroup: ComboGroup = {
      name: groupName.trim(),
      isRequired: groupType === "required",
      maxQuantity,
      items: [...groupedProducts],
    };

    if (editingGroupIndex !== null) {
      setGroups(prev => {
        const updated = [...prev];
        updated[editingGroupIndex] = newGroup;
        return updated;
      });
    } else {
      setGroups(prev => [...prev, newGroup]);
    }

    // Reset for next group
    setGroupedProducts([]);
    setGroupName("");
    setGroupType("required");
    setMaxQuantity(1);
    setEditingGroupIndex(null);
    setStep("overview");
  }, [groupName, groupType, maxQuantity, groupedProducts, editingGroupIndex]);

  // Start adding new group (upsell)
  const handleAddNewGroup = useCallback(() => {
    setEditingGroupIndex(null);
    setGroupedProducts([]);
    setGroupName("");
    setGroupType("optional");
    setMaxQuantity(1);
    setStep("select-products");
  }, []);

  // Remove a group
  const handleRemoveGroup = useCallback((index: number) => {
    setGroups(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Create the combo
  const handleCreateCombo = useCallback(() => {
    if (!comboName.trim()) {
      toast.error("Nome do combo é obrigatório");
      return;
    }
    if (groups.length === 0) {
      toast.error("Adicione pelo menos um grupo ao combo");
      return;
    }

    createComboMutation.mutate({
      establishmentId,
      categoryId,
      name: comboName.trim(),
      description: comboDescription.trim() || undefined,
      price: parsePriceInput(comboPrice) || "0",
      images: comboImage ? [comboImage] : undefined,
      groups: groups.map((g, idx) => ({
        name: g.name,
        isRequired: g.isRequired,
        maxQuantity: g.maxQuantity,
        sortOrder: idx,
        items: g.items.map((item, itemIdx) => ({
          productId: item.id,
          sortOrder: itemIdx,
        })),
      })),
    });
  }, [comboName, comboDescription, comboPrice, comboImage, groups, establishmentId, categoryId, createComboMutation]);

  // Render step 1: Select products
  const renderSelectProducts = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {groups.length > 0 && (
              <button
                onClick={() => setStep("overview")}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
            )}
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {groups.length > 0 ? "Adicionar grupo" : "Criar combo"}
              </h2>
              <p className="text-sm text-white/80">{categoryName}</p>
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

      {/* Instruction + Search (fixed) */}
      <div className="p-4 pb-2 bg-card space-y-3 flex-shrink-0">
        <div>
          <h3 className="font-semibold text-base text-foreground">Adicionar produtos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Quais produtos você quer adicionar?
          </p>
          <p className="text-xs text-muted-foreground">Selecione quantos quiser</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-background border-border/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content area: search results + grouped products */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 bg-card">
        {/* Search Results */}
        <div className="space-y-1">
          {searchLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : filteredResults.length === 0 && debouncedSearch ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado
            </div>
          ) : (
            filteredResults.map((product) => {
              const isSelected = selectedProducts.some(p => p.id === product.id);
              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border",
                    isSelected
                      ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500"
                      : "bg-background border-transparent hover:bg-muted/50"
                  )}
                  onClick={() => toggleProductSelection(product)}
                >
                  {/* Product image */}
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.images && (product.images as string[]).length > 0 ? (
                      <img
                        src={(product.images as string[])[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="h-4 w-4 text-white" />
                    )}
                  </div>
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {product.categoryName && (
                      <p className="text-xs text-muted-foreground">
                        Disponível em: {product.categoryName}
                      </p>
                    )}
                  </div>
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    className="flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => toggleProductSelection(product)}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Grouped products */}
        {groupedProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground">
                Adicionados: {groupedProducts.length}
              </h4>
            </div>
            <div className="space-y-1">
              {groupedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <p className="font-medium text-sm flex-1 truncate">{product.name}</p>
                  <button
                    onClick={() => removeGroupedProduct(product.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Fixed buttons at bottom */}
      {(selectedProducts.length > 0 || (groupedProducts.length > 0 && selectedProducts.length === 0)) && (
        <div className="p-4 border-t border-border/50 bg-card flex-shrink-0 space-y-2">
          {selectedProducts.length > 0 && (
            <Button
              onClick={handleGroupProducts}
              className="w-full rounded-xl h-11"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agrupar {selectedProducts.length} {selectedProducts.length === 1 ? "produto" : "produtos"}
            </Button>
          )}
          {groupedProducts.length > 0 && selectedProducts.length === 0 && (
            <Button
              onClick={handleContinueToConfig}
              className="w-full rounded-xl h-11"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              Continuar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // Render step 2: Configure group
  const renderConfigureGroup = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSelect}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Configurar grupo</h2>
              <p className="text-sm text-white/80">{groupedProducts.length} produtos selecionados</p>
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
        <h3 className="font-semibold text-base text-foreground">
          Quantos produtos o cliente poderá escolher?
        </h3>

        {/* Group name + type in same row */}
        <div className="flex gap-3 items-end">
          <div className="space-y-2 flex-1">
            <Label className="text-sm font-medium">Nome do grupo *</Label>
            <Input
              placeholder="Ex: Escolha seu lanche"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2 w-[140px] flex-shrink-0">
            <Label className="text-sm font-medium">Tipo</Label>
            <Select value={groupType} onValueChange={(v) => setGroupType(v as "required" | "optional")}>
              <SelectTrigger className="h-11 rounded-xl" style={{height: '44px'}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required">Obrigatório</SelectItem>
                <SelectItem value="optional">Opcional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Max quantity */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quantidade máxima</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setMaxQuantity(prev => Math.max(1, prev - 1))}
              disabled={maxQuantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold w-12 text-center">{maxQuantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setMaxQuantity(prev => prev + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products in this group */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Produtos neste grupo:</Label>
          <div className="space-y-1">
            {groupedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30"
              >
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UtensilsCrossed className="h-3 w-3 text-white" />
                  )}
                </div>
                <p className="text-sm font-medium truncate flex-1">{product.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card flex gap-3">
        <Button
          variant="outline"
          onClick={handleBackToSelect}
          className="flex-1 rounded-xl h-11"
        >
          Voltar
        </Button>
        <Button
          onClick={handleCompleteGroup}
          disabled={!groupName.trim() || groupedProducts.length === 0}
          className="flex-1 rounded-xl h-11"
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          <Check className="h-4 w-4 mr-2" />
          Concluir
        </Button>
      </div>
    </div>
  );

  // Render step 3: Overview (groups created, upsell, finalize)
  const renderOverview = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Criar combo</h2>
              <p className="text-sm text-white/80">{categoryName}</p>
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Combo image */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Foto do combo</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center overflow-hidden",
              comboImage
                ? "border-transparent"
                : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-xs">Enviando...</span>
              </div>
            ) : comboImage ? (
              <>
                <img loading="lazy" src={comboImage} alt="Combo" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setComboImage(null); }}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs">Clique para adicionar foto</span>
              </div>
            )}
          </div>
        </div>

        {/* Combo name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Nome do combo *</Label>
          <Input
            placeholder="Ex: Combo Família"
            value={comboName}
            onChange={(e) => setComboName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Combo description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Descrição do combo</Label>
          <Textarea
            placeholder="Ex: 2 lanches + batata + refrigerante"
            value={comboDescription}
            onChange={(e) => setComboDescription(e.target.value)}
            className="rounded-xl resize-none min-h-[80px]"
          />
        </div>

        {/* Combo price */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preço do combo *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={comboPrice}
              onChange={(e) => setComboPrice(formatPriceInputLocal(e.target.value))}
              className="h-11 rounded-xl pl-10 font-semibold"
            />
          </div>
          <p className="text-xs text-muted-foreground">Deixe em branco ou 0,00 para calcular automaticamente</p>
        </div>

        {/* Groups list */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">
            Grupos ({groups.length})
          </h4>
          {groups.map((group, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{group.name}</p>
                      <Badge variant={group.isRequired ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                        {group.isRequired ? "Obrigatório" : "Opcional"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {group.items.length} {group.items.length === 1 ? "item" : "itens"} · Máx: {group.maxQuantity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveGroup(index)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-border/30">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 p-2.5 px-3">
                    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UtensilsCrossed className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <p className="text-xs font-medium truncate">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Upsell section */}
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              Que tal oferecer outros produtos junto com o combo?
            </h4>
            <p className="text-xs text-muted-foreground mt-1">Opcional - Adicione mais grupos para upsell</p>
          </div>
          <Button
            variant="outline"
            onClick={handleAddNewGroup}
            className="w-full rounded-xl h-10 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar grupo
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          onClick={handleCreateCombo}
          disabled={!comboName.trim() || groups.length === 0 || createComboMutation.isPending}
          className="w-full rounded-xl h-11"
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          {createComboMutation.isPending ? "Criando..." : "Criar combo"}
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">Criar combo</SheetTitle>
        <SheetDescription className="sr-only">Crie um combo com grupos de produtos</SheetDescription>
        {step === "select-products" && renderSelectProducts()}
        {step === "configure-group" && renderConfigureGroup()}
        {step === "overview" && renderOverview()}
      </SheetContent>
    </Sheet>
  );
}
