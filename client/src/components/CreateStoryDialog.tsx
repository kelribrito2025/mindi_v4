import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { compressImage } from "@/lib/imageCompression";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Image as ImageIcon,
  ShoppingBag,
  Tag,
  Upload,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type StoryType = "simple" | "product" | "promo";
type PriceBadgeStyle = "circle" | "ribbon" | "top-center";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess: () => void;
  activeStoriesCount: number;
  maxStories: number;
}

export default function CreateStoryDialog({
  open,
  onOpenChange,
  establishmentId,
  onSuccess,
  activeStoriesCount,
  maxStories,
}: CreateStoryDialogProps) {
  const [step, setStep] = useState<"type" | "image" | "details" | "preview">("type");
  const [storyType, setStoryType] = useState<StoryType>("simple");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product selection
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  } | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  // Promo fields
  const [promoTitle, setPromoTitle] = useState("");
  const [promoText, setPromoText] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoHasExpiry, setPromoHasExpiry] = useState(false);
  const [promoExpiryDate, setPromoExpiryDate] = useState("");
  const [promoExpiryTime, setPromoExpiryTime] = useState("");

  // Action label
  const [actionLabel, setActionLabel] = useState("");

  // Price badge style
  const [priceBadgeStyle, setPriceBadgeStyle] = useState<PriceBadgeStyle>("circle");

  // Fetch products for selection
  const { data: productsData } = trpc.product.list.useQuery(
    { establishmentId, status: "active" },
    { enabled: open && (storyType === "product" || storyType === "promo") }
  );

  const products = productsData?.products || [];
  const filteredProducts = products.filter(
    (p: any) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const createMutation = trpc.stories.create.useMutation({
    onSuccess: () => {
      toast.success("Story publicado com sucesso!");
      onSuccess();
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao publicar story");
      setUploading(false);
    },
  });

  const handleClose = () => {
    setStep("type");
    setStoryType("simple");
    setImagePreview(null);
    setImageBase64("");
    setImageMimeType("");
    setSelectedProduct(null);
    setProductSearch("");
    setPromoTitle("");
    setPromoText("");
    setPromoPrice("");
    setPromoHasExpiry(false);
    setPromoExpiryDate("");
    setPromoExpiryTime("");
    setActionLabel("");
    setPriceBadgeStyle("circle");
    setUploading(false);
    setShowProductList(false);
    onOpenChange(false);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        toast.error("Apenas imagens JPG e PNG são permitidas");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Imagem muito grande. Máximo 10MB.");
        return;
      }

      compressImage(file).then(({ base64, mimeType }) => {
        setImagePreview(`data:${mimeType};base64,${base64}`);
        setImageBase64(base64);
        setImageMimeType(mimeType);
        setStep("details");
      }).catch(() => {
        toast.error("Erro ao processar imagem");
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [storyType]
  );

  const handlePublish = async () => {
    if (!imageBase64) {
      toast.error("Selecione uma imagem");
      return;
    }

    if (activeStoriesCount >= maxStories) {
      toast.error(
        "Limite de stories atingido. Exclua um antes de adicionar outro."
      );
      return;
    }

    if (storyType === "product" && !selectedProduct) {
      toast.error("Selecione um produto do cardápio");
      return;
    }

    if (storyType === "promo" && !promoTitle.trim()) {
      toast.error("Informe o título da promoção");
      return;
    }

    setUploading(true);

    const data: any = {
      establishmentId,
      base64: imageBase64,
      mimeType: imageMimeType,
      type: storyType,
    };

    if (storyType === "product") {
      data.productId = selectedProduct!.id;
      data.actionLabel = actionLabel.trim() || "Ver produto";
    }

    if (storyType === "promo") {
      data.promoTitle = promoTitle.trim();
      data.promoText = promoText.trim() || undefined;
      data.promoPrice = promoPrice.trim() || undefined;
      data.actionLabel = actionLabel.trim() || "Pedir agora";
      data.priceBadgeStyle = priceBadgeStyle;
      if (selectedProduct) {
        data.productId = selectedProduct.id;
      }
      if (promoHasExpiry && promoExpiryDate) {
        const dateStr = promoExpiryTime
          ? `${promoExpiryDate}T${promoExpiryTime}`
          : `${promoExpiryDate}T23:59`;
        data.promoExpiresAt = new Date(dateStr);
      }
    }

    createMutation.mutate(data);
  };

  const canPublish =
    imageBase64 &&
    (storyType === "simple" ||
      (storyType === "product" && selectedProduct) ||
      (storyType === "promo" && promoTitle.trim()));

  // Default action labels
  useEffect(() => {
    if (storyType === "product" && !actionLabel) {
      setActionLabel("Ver produto");
    } else if (storyType === "promo" && !actionLabel) {
      setActionLabel("Pedir agora");
    }
  }, [storyType]);

  // Determine the effective action label for preview
  const effectiveActionLabel = actionLabel.trim() || (storyType === "product" ? "Ver produto" : "Pedir agora");
  const hasAction = storyType !== "simple" && (storyType === "product" ? !!selectedProduct : !!selectedProduct);

  // Compute promo countdown for preview
  const getPromoCountdownPreview = (): string | null => {
    if (storyType !== "promo") return null;
    if (!promoHasExpiry || !promoExpiryDate) return null;
    const dateStr = promoExpiryTime
      ? `${promoExpiryDate}T${promoExpiryTime}`
      : `${promoExpiryDate}T23:59`;
    const exp = new Date(dateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    if (diffMs <= 0) return "Expirada";
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `Termina em ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Termina em ${diffH}h`;
    return `Válida até ${exp.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto rounded-2xl p-0",
        step === "preview" ? "sm:max-w-[400px]" : "sm:max-w-[480px]"
      )}>
        <div className={step === "preview" ? "p-0" : "p-6"}>
          {step !== "preview" && (
            <>
              <DialogTitle className="text-lg font-bold text-foreground mb-1">
                Novo Story
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mb-5">
                {step === "type" && "Escolha o tipo de story que deseja publicar"}
                {step === "image" && "Selecione a imagem do story"}
                {step === "details" && "Configure os detalhes do story"}
              </DialogDescription>
            </>
          )}
          {step === "preview" && (
            <>
              <DialogTitle className="sr-only">Preview do Story</DialogTitle>
              <DialogDescription className="sr-only">Pré-visualização de como o story ficará no menu público</DialogDescription>
            </>
          )}

          {/* Step 1: Escolher tipo */}
          {step === "type" && (
            <div className="space-y-3">
              {[
                {
                  type: "simple" as StoryType,
                  icon: ImageIcon,
                  title: "Imagem simples",
                  desc: "Apenas exibe a imagem, sem botão de ação",
                  color: "text-blue-500",
                  bg: "bg-blue-50 dark:bg-blue-950/30",
                  border: "border-blue-200 dark:border-blue-800",
                },
                {
                  type: "product" as StoryType,
                  icon: ShoppingBag,
                  title: "Destacar produto",
                  desc: 'Vincula um produto do cardápio com botão "Ver produto"',
                  color: "text-emerald-500",
                  bg: "bg-emerald-50 dark:bg-emerald-950/30",
                  border: "border-emerald-200 dark:border-emerald-800",
                },
                {
                  type: "promo" as StoryType,
                  icon: Tag,
                  title: "Promoção",
                  desc: "Exibe promoção com título, preço e validade",
                  color: "text-orange-500",
                  bg: "bg-orange-50 dark:bg-orange-950/30",
                  border: "border-orange-200 dark:border-orange-800",
                },
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setStoryType(opt.type);
                    setStep("image");
                  }}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-[colors,box-shadow] hover:shadow-sm",
                    opt.border,
                    opt.bg
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      opt.color,
                      "bg-white dark:bg-background shadow-sm"
                    )}
                  >
                    <opt.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {opt.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Selecionar imagem */}
          {step === "image" && (
            <div className="space-y-4">
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <Upload className="h-10 w-10 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG ou PNG, máximo 10MB
                    </p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-[400px] object-contain rounded-xl bg-black"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64("");
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("type");
                    setImagePreview(null);
                    setImageBase64("");
                  }}
                  className="flex-1"
                >
                  Voltar
                </Button>
                {imagePreview && (
                  <Button
                    onClick={() => setStep("details")}
                    className="flex-1"
                  >
                    Continuar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Detalhes (tipo product ou promo) */}
          {step === "details" && (
            <div className="space-y-5">
              {/* Preview da imagem pequena */}
              {imagePreview && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {storyType === "simple" && "Imagem simples"}
                      {storyType === "product" && "Destacar produto"}
                      {storyType === "promo" && "Promoção"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Imagem selecionada
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("image")}
                    className="text-xs text-primary hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* Seletor de produto (para tipo product e promo) */}
              {(storyType === "product" || storyType === "promo") && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {storyType === "product"
                      ? "Produto do cardápio *"
                      : "Produto vinculado (opcional)"}
                  </Label>

                  {selectedProduct ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
                      {selectedProduct.imageUrl && (
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {selectedProduct.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          R${" "}
                          {Number(selectedProduct.price).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar produto..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductList(true);
                          }}
                          onFocus={() => setShowProductList(true)}
                          className="pl-9 pr-8"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>

                      {showProductList && (
                        <div className="absolute z-50 w-full mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                          {filteredProducts.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              Nenhum produto encontrado
                            </div>
                          ) : (
                            filteredProducts.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedProduct({
                                    id: p.id,
                                    name: p.name,
                                    price: p.price,
                                    imageUrl: p.imageUrl,
                                  });
                                  setShowProductList(false);
                                  setProductSearch("");
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                {p.imageUrl && (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    R${" "}
                                    {Number(p.price).toFixed(2).replace(".", ",")}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Campos de promoção */}
              {storyType === "promo" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Título da promoção *
                    </Label>
                    <Input
                      placeholder="Ex: Promoção do dia"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Texto curto (opcional)
                    </Label>
                    <Input
                      placeholder="Ex: Pizza grande + refri"
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      maxLength={255}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Preço promocional (opcional)
                    </Label>
                    <Input
                      placeholder="Ex: R$ 59,90"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      maxLength={20}
                    />
                  </div>

                  {/* Estilo do badge de preço */}
                  {promoPrice.trim() && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Estilo do badge de preço
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            value: "circle" as PriceBadgeStyle,
                            label: "Circular",
                            desc: "Badge flutuante",
                            preview: (
                              <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-black/70 rounded-t-xl" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-[38%] w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg border-2 border-white">
                                  <span className="text-[6px] font-bold text-white">R$</span>
                                </div>
                              </div>
                            ),
                          },
                          {
                            value: "ribbon" as PriceBadgeStyle,
                            label: "Faixa",
                            desc: "Diagonal no canto",
                            preview: (
                              <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-black/70 rounded-t-xl" />
                                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                                  <div className="absolute -left-3 top-2 w-16 bg-red-500 text-center rotate-[-35deg] shadow-md">
                                    <span className="text-[5px] font-bold text-white">R$</span>
                                  </div>
                                </div>
                              </div>
                            ),
                          },
                          {
                            value: "top-center" as PriceBadgeStyle,
                            label: "Topo",
                            desc: "Fixo no centro",
                            preview: (
                              <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-black/70 rounded-t-xl" />
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 px-2 py-0.5 rounded-lg shadow-md">
                                  <span className="text-[5px] font-bold text-white">R$</span>
                                </div>
                              </div>
                            ),
                          },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPriceBadgeStyle(opt.value)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-colors",
                              priceBadgeStyle === opt.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border/50 hover:border-border hover:bg-muted/30"
                            )}
                          >
                            <div className="w-full max-w-[60px]">
                              {opt.preview}
                            </div>
                            <div className="text-center">
                              <p className={cn(
                                "text-xs font-semibold",
                                priceBadgeStyle === opt.value ? "text-primary" : "text-foreground"
                              )}>
                                {opt.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validade da promoção */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Validade da promoção
                    </Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPromoHasExpiry(false)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors",
                          !promoHasExpiry
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        Sem limite
                      </button>
                      <button
                        onClick={() => setPromoHasExpiry(true)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5",
                          promoHasExpiry
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Definir horário
                      </button>
                    </div>

                    {promoHasExpiry && (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={promoExpiryDate}
                          onChange={(e) => setPromoExpiryDate(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={promoExpiryTime}
                          onChange={(e) => setPromoExpiryTime(e.target.value)}
                          className="w-28"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Texto do botão de ação */}
              {storyType !== "simple" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Texto do botão
                  </Label>
                  <Input
                    placeholder={
                      storyType === "product" ? "Ver produto" : "Pedir agora"
                    }
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    maxLength={40}
                  />
                  <p className="text-xs text-muted-foreground">
                    Botão que aparece no story para o cliente
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("image")}
                  className="flex-1"
                >
                  Voltar
                </Button>
                {storyType === "simple" ? (
                  /* Para simple, vai direto ao preview */
                  <Button
                    onClick={() => setStep("preview")}
                    disabled={!canPublish}
                    className="flex-1 gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Pré-visualizar
                  </Button>
                ) : (
                  <Button
                    onClick={() => setStep("preview")}
                    disabled={!canPublish}
                    className="flex-1 gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Pré-visualizar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Preview — Visualização realista do story */}
          {step === "preview" && imagePreview && (
            <div className="flex flex-col">
              {/* Header do preview */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Pré-visualização</span>
                </div>
                <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg">
                  Como o cliente verá
                </span>
              </div>

              {/* Story Preview Container — simula o viewer real */}
              <div className="relative mx-4 mb-3 rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: "520px" }}>
                {/* Imagem de fundo */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />

                {/* Overlay superior — barras de progresso + header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-transparent pt-2 px-3 pb-8">
                  {/* Barra de progresso simulada */}
                  <div className="flex gap-1 mb-3">
                    <div className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full bg-white rounded-full w-[60%]" />
                    </div>
                  </div>

                  {/* Header: logo placeholder + nome + tempo */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">R</span>
                    </div>
                    <span className="text-white text-xs font-semibold">Seu restaurante</span>
                    <span className="text-white/50 text-[10px]">agora</span>
                  </div>
                </div>

                {/* Badge de preço — circle */}
                {storyType === "promo" && promoPrice.trim() && (priceBadgeStyle === "circle" || !priceBadgeStyle) && (
                  <div className="absolute z-20" style={{ bottom: "calc(35% + 8px)", left: "50%", transform: "translateX(-50%)" }}>
                    <div className="w-16 h-16 rounded-full bg-red-500 flex flex-col items-center justify-center shadow-2xl border-[2.5px] border-white/90 animate-bounce" style={{ animationDuration: "2s" }}>
                      <span className="text-white text-[8px] font-medium -mb-0.5">por apenas</span>
                      <span className="text-white text-xs font-extrabold leading-tight">{promoPrice}</span>
                    </div>
                  </div>
                )}

                {/* Badge de preço — ribbon */}
                {storyType === "promo" && promoPrice.trim() && priceBadgeStyle === "ribbon" && (
                  <div className="absolute top-0 left-0 z-20 w-28 h-28 overflow-hidden">
                    <div className="absolute top-[20px] -left-[24px] w-[160px] bg-red-500 text-center py-1 shadow-lg" style={{ transform: "rotate(-40deg)" }}>
                      <span className="text-white text-xs font-extrabold tracking-wide drop-shadow-md">{promoPrice}</span>
                    </div>
                  </div>
                )}

                {/* Badge de preço — top-center */}
                {storyType === "promo" && promoPrice.trim() && priceBadgeStyle === "top-center" && (
                  <div className="absolute z-20" style={{ top: "56px", left: "50%", transform: "translateX(-50%)" }}>
                    <div className="bg-red-500 px-4 py-1.5 rounded-lg shadow-xl border-2 border-white/80">
                      <span className="text-white text-sm font-extrabold drop-shadow-md">{promoPrice}</span>
                    </div>
                  </div>
                )}

                {/* Overlay inferior — Promoção e/ou Botão de ação */}
                {(storyType === "promo" || storyType === "product") && (
                  <div className="absolute bottom-0 left-0 right-0 z-10">
                    <div className="bg-black/85 backdrop-blur-md px-3 pt-4 pb-5 rounded-t-2xl">
                      {/* Dados da promoção */}
                      {storyType === "promo" && (
                        <div className="mb-3 text-center">
                          {promoTitle.trim() && (
                            <h3 className="text-white text-base font-bold mb-0.5 line-clamp-2">
                              {promoTitle.slice(0, 60)}
                            </h3>
                          )}
                          {promoText.trim() && (
                            <p className="text-white/80 text-xs mb-1.5 line-clamp-2">
                              {promoText.slice(0, 100)}
                            </p>
                          )}
                          {getPromoCountdownPreview() && (
                            <div className="flex items-center justify-center gap-1 text-white/60 text-[10px]">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{getPromoCountdownPreview()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão de ação (product precisa de produto selecionado, promo precisa de produto vinculado) */}
                      {((storyType === "product" && selectedProduct) || (storyType === "promo" && selectedProduct)) && (
                        <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-500/40">
                          <ChevronUp className="h-3.5 w-3.5" />
                          {effectiveActionLabel}
                        </div>
                      )}

                      {/* Indicação de que não tem botão quando não há produto */}
                      {storyType === "promo" && !selectedProduct && (
                        <p className="text-white/40 text-[10px] text-center">
                          Sem produto vinculado — sem botão de ação
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do preview */}
              <div className="px-4 pb-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1"
                >
                  Editar
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!canPublish || uploading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publicando...
                    </div>
                  ) : (
                    <>
                      Publicar story
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
