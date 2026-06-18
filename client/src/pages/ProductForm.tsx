import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard, StatusBadge } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { compressImage } from "@/lib/imageCompression";
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
  ArrowLeft,
  Save,
  ImagePlus,
  X,
  Info,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";

import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { cn, capitalizeFirst, formatPriceInput, parsePriceInput } from "@/lib/utils";
import ImageEnhanceModal from "@/components/ImageEnhanceModal";







export default function ProductForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const utils = trpc.useUtils();

  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [hasStock, setHasStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [printerId, setPrinterId] = useState<string>("none"); // Setor/Impressora para este produto




  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image enhance modal
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [enhanceImageIndex, setEnhanceImageIndex] = useState(0);
  const [enhanceImageUrl, setEnhanceImageUrl] = useState("");
  

  
  // Flag para controlar se os dados já foram carregados inicialmente
  // Evita que o useEffect sobrescreva as alterações do usuário ao trocar de aba
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);






  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Buscar impressoras/setores para seleção
  const { data: printers } = trpc.printer.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: product, isLoading: productLoading } = trpc.product.get.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing && !!params.id, refetchOnMount: 'always', staleTime: 0 }
  );



  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success("Produto criado com sucesso");
      navigate("/catalogo");
    },
    onError: (error) => {
      toast.error("Erro ao criar produto");
      console.error(error);
    },
  });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: async () => {
      toast.success("Produto atualizado com sucesso");
      // Permanecer na página de edição
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto");
      console.error(error);
    },
  });





  // Load product data when editing - apenas na primeira vez para campos editáveis
  useEffect(() => {
    if (product && !initialDataLoaded) {
      setName(product.name);
      setDescription(product.description || "");
      // Garantir que categoryId seja convertido corretamente
      // product.categoryId pode ser number, null ou undefined
      if (product.categoryId !== null && product.categoryId !== undefined && product.categoryId !== 0) {
        setCategoryId(String(product.categoryId));
      } else {
        setCategoryId("none");
      }
      // Formatar preço para exibição (ex: "10,50")
      const priceValue = parseFloat(String(product.price));
      setPrice(priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setImages(product.images || []);
      setStatus(product.status === "archived" ? "paused" : product.status);
      setHasStock(product.hasStock);
      setStockQuantity(product.stockQuantity ? String(product.stockQuantity) : "");
      // Carregar setor/impressora do produto
      if ((product as any).printerId) {
        setPrinterId(String((product as any).printerId));
      } else {
        setPrinterId("none");
      }
      setInitialDataLoaded(true);
    }
  }, [product, initialDataLoaded]);

  // Manter stockQuantity sempre sincronizado com o valor do servidor
  // (atualiza mesmo após o carregamento inicial, ex: quando estoque muda por pedido)
  useEffect(() => {
    if (product && initialDataLoaded) {
      setStockQuantity(product.stockQuantity ? String(product.stockQuantity) : "");
      setHasStock(product.hasStock);
    }
  }, [product?.stockQuantity, product?.hasStock]);



  // Nota: Removido bloqueio para usuários sem estabelecimento - agora a página de ProductForm mostra normalmente

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!price || Number(price) < 0) {
      newErrors.price = "Preço inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !establishmentId) return;

    const productData = {
      establishmentId,
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId && categoryId !== "none" ? Number(categoryId) : null,
      price: parsePriceInput(price),
      images: images.length > 0 ? images : [],
      status,
      hasStock,
      stockQuantity: stockQuantity ? Number(stockQuantity) : null,
      printerId: printerId && printerId !== "none" ? Number(printerId) : null, // Setor/Impressora
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  // Upload mutation
  const uploadMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      setImages([...images, data.url]);
      toast.success("Imagem enviada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao enviar imagem");
      console.error(error);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleImageAdd = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 15MB - will be compressed before upload)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB");
      return;
    }

    setUploading(true);

    compressImage(file).then(({ base64, mimeType }) => {
      uploadMutation.mutate({
        base64,
        mimeType,
        folder: "products",
      });
    }).catch(() => {
      toast.error("Erro ao processar imagem");
      setUploading(false);
    });

    // Reset input
    e.target.value = "";
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };





  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  };



  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && productLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-9">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/catalogo")}
              className="rounded-lg hover:bg-accent h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditing ? "Editar Produto" : "Novo Produto"}
              </h1>
              <p className="text-base text-muted-foreground">
                {isEditing ? "Atualize as informações do produto" : "Preencha as informações do produto"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <SectionCard title="Informações Básicas">
              <div className="space-y-5">
                {/* Nome, Preço e Categoria na mesma linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  <div className="md:col-span-2 lg:col-span-6">
                    <Label htmlFor="name" className="text-sm font-semibold">Nome do produto *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(capitalizeFirst(e.target.value))}
                      placeholder="Ex: X-Burger Especial"
                      className={cn(
                        "mt-1.5 h-9 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20",
                        errors.name && "border-destructive focus:ring-destructive/20"
                      )}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1.5">{errors.name}</p>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="price" className="text-sm font-semibold">Preço *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <p>Se este item não for vendido individualmente e servir apenas como uma opção dentro de outro item, deixe o preço como R$ 0,00. Assim, o valor deste item não será somado ao preço final junto com os complementos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        id="price"
                        type="text"
                        inputMode="numeric"
                        value={price}
                        onChange={(e) => {
                          const formatted = formatPriceInput(e.target.value);
                          setPrice(formatted);
                        }}
                        placeholder="0,00"
                        className={cn(
                          "h-9 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20 pl-10",
                          errors.price && "border-destructive focus:ring-destructive/20"
                        )}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-destructive mt-1.5">{errors.price}</p>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    <Label htmlFor="category" className="text-sm font-semibold">Categoria</Label>
                    <Select key={`category-${categoryId}`} value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm rounded-lg border-border/50">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="none" className="rounded text-sm text-muted-foreground">
                          Sem categoria
                        </SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)} className="rounded text-sm">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Setor de Impressão */}
                {printers && printers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="printer" className="text-sm font-semibold">Setor de Preparo (Impressora)</Label>
                      <Select key={`printer-${printerId}`} value={printerId} onValueChange={setPrinterId}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm rounded-lg border-border/50">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="none" className="rounded text-sm text-muted-foreground">
                            Todas as impressoras
                          </SelectItem>
                          {printers.map((printer: any) => (
                            <SelectItem key={printer.id} value={String(printer.id)} className="rounded text-sm">
                              {printer.name} ({printer.ipAddress})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Selecione qual impressora/setor deve receber este item ao imprimir o pedido</p>
                    </div>
                  </div>
                )}



                <div>
                  <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(capitalizeFirst(e.target.value))}
                    placeholder="Descreva os ingredientes e características do produto"
                    rows={2}
                    className="mt-2 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Images */}
            <SectionCard title="Imagens">
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted group shadow-soft"
                    >
                      <img
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEnhanceImageUrl(img);
                              setEnhanceImageIndex(index);
                              setEnhanceModalOpen(true);
                            }}
                            className="p-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md shadow-sm hover:from-amber-600 hover:to-orange-600 transition-colors"
                            title="Melhorar foto com IA"
                          >
                            <Sparkles className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="p-1 bg-destructive text-destructive-foreground rounded-md shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleImageAdd}
                    disabled={uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Adicionar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Stock & Availability */}
            <SectionCard title="Disponibilidade">
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs font-semibold">Status do produto</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Produtos pausados não aparecem no cardápio
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-md",
                      status === "active" 
                        ? "text-emerald-700 bg-emerald-50" 
                        : "text-amber-700 bg-amber-50"
                    )}>
                      {status === "active" ? "Ativo" : "Pausado"}
                    </span>
                    <Switch
                      checked={status === "active"}
                      onCheckedChange={(checked) => setStatus(checked ? "active" : "paused")}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs font-semibold">Controle de estoque</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ative para controlar a quantidade disponível
                    </p>
                  </div>
                  <Switch
                    checked={hasStock}
                    onCheckedChange={(checked) => setHasStock(checked)}
                  />
                </div>

                {hasStock && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label htmlFor="stockQuantity" className="text-xs font-semibold">Quantidade em estoque</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="0"
                        className="mt-2 h-10 text-base rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}

                </div>
            </SectionCard>

          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <SectionCard title="Preview">
                {/* Product Image */}
                <div className="aspect-video bg-muted/50 flex items-center justify-center rounded-xl overflow-hidden -mx-4 -mt-2">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={name || "Produto"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-xl">
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="mt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-base">
                        {name || "Nome do produto"}
                      </h4>
                      <StatusBadge variant={status === "active" ? "success" : "warning"}>
                        {status === "active" ? "Ativo" : "Pausado"}
                      </StatusBadge>
                    </div>
                    {description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {description}
                      </p>
                    )}
                    {(parseFloat(price.replace(',', '.')) || 0) > 0 && (
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(parseFloat(price.replace(',', '.')) || 0)}
                      </p>
                    )}



                </div>
              </SectionCard>

              {/* Save Button */}
              <div className="mt-4">
                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg shadow-sm text-sm font-semibold"
                  size="default"
                  disabled={isPending}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Produto"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
      {/* Modal de melhoramento de imagem com IA */}
      {isEditing && params.id && (
        <ImageEnhanceModal
          open={enhanceModalOpen}
          onOpenChange={setEnhanceModalOpen}
          productId={Number(params.id)}
          imageUrl={enhanceImageUrl}
          imageIndex={enhanceImageIndex}
          onEnhanced={(enhancedUrl) => {
            // Substituir a imagem no array local
            const newImages = [...images];
            newImages[enhanceImageIndex] = enhancedUrl;
            setImages(newImages);
          }}
        />
      )}
    </AdminLayout>
  );
}
