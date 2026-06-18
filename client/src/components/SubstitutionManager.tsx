import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  X,
  Plus,
  Trash2,
  Loader2,
  Search,
  Package,
  ImageIcon,
} from "lucide-react";

function formatPriceBR(cents: number): string {
  const str = String(Math.abs(cents)).padStart(3, "0");
  return `${str.slice(0, -2)},${str.slice(-2)}`;
}

function parsePriceToCents(value: string): number {
  const raw = value.replace(/[^\d]/g, "");
  return parseInt(raw) || 0;
}

interface SubstitutionManagerProps {
  complementItemId: number;
  complementItemName: string;
  establishmentId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubstitutionManager({
  complementItemId,
  complementItemName,
  establishmentId,
  isOpen,
  onClose,
}: SubstitutionManagerProps) {
  const utils = trpc.useUtils();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPriceCents, setManualPriceCents] = useState(0);
  const [showManualForm, setShowManualForm] = useState(false);

  // Queries
  const { data: substitutions = [], isLoading } = trpc.substitution.listByItem.useQuery(
    { complementItemId },
    { enabled: isOpen }
  );

  const { data: searchResults = [] } = trpc.combo.searchProducts.useQuery(
    { establishmentId, search: searchQuery, limit: 8 },
    { enabled: isOpen && searchQuery.trim().length >= 2 }
  );

  // Mutations
  const createMutation = trpc.substitution.create.useMutation({
    onSuccess: () => {
      utils.substitution.listByItem.invalidate({ complementItemId });
      utils.substitution.listByProduct.invalidate();
      utils.catalogVersion.stats.invalidate();
      setSearchQuery("");
      setManualName("");
      setManualPriceCents(0);
      setShowManualForm(false);
      toast.success("Opção de troca adicionada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = trpc.substitution.delete.useMutation({
    onSuccess: () => {
      utils.substitution.listByItem.invalidate({ complementItemId });
      utils.substitution.listByProduct.invalidate();
      utils.catalogVersion.stats.invalidate();
      toast.success("Opção removida");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.substitution.update.useMutation({
    onSuccess: () => {
      utils.substitution.listByItem.invalidate({ complementItemId });
      utils.substitution.listByProduct.invalidate();
      utils.catalogVersion.stats.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Filter search results to exclude already added substitutions
  const filteredResults = useMemo(() => {
    const existingNames = substitutions.map((s: any) => s.name.toLowerCase());
    return searchResults.filter(
      (p: any) => !existingNames.includes(p.name.toLowerCase())
    );
  }, [searchResults, substitutions]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setManualName("");
      setManualPriceCents(0);
      setShowManualForm(false);
    }
  }, [isOpen]);

  function handleAddFromCatalog(product: any) {
    // product.price is a decimal string from MySQL (e.g. "16.90"), convert to cents
    const productPrice = Math.round(parseFloat(product.price || "0") * 100);
    const img = getProductImage(product);
    createMutation.mutate({
      complementItemId,
      name: product.name,
      additionalPrice: productPrice,
      imageUrl: img,
    });
  }

  function handleAddManual() {
    if (!manualName.trim()) return;
    createMutation.mutate({
      complementItemId,
      name: manualName.trim(),
      additionalPrice: manualPriceCents,
      imageUrl: null,
    });
  }

  function getProductImage(product: any): string | null {
    if (product.images) {
      try {
        const imgs = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
      } catch {
        return null;
      }
    }
    return null;
  }

  const handleManualPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setManualPriceCents(parseInt(raw) || 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">Opções de troca</SheetTitle>
        <SheetDescription className="sr-only">Gerenciar opções de troca para {complementItemName}</SheetDescription>

        {/* Header - Red gradient matching Editar Produto */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Opções de Troca</h2>
                <p className="text-sm text-white/80 truncate max-w-[220px]">
                  Trocar "{complementItemName}"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
          {/* Explanation */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              O cliente poderá trocar <strong>"{complementItemName}"</strong> por uma das opções abaixo, 
              pagando o valor adicional. Se o item de troca já existe no catálogo, o preço será preenchido automaticamente.
            </p>
          </div>

          {/* Existing substitutions */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : substitutions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Opções cadastradas ({substitutions.length})
              </p>
              {substitutions.map((sub: any) => (
                <div
                  key={sub.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border bg-card transition-all",
                    !sub.isActive && "opacity-50"
                  )}
                >
                  {/* Image */}
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">
                      {sub.additionalPrice > 0 ? `+R$ ${formatPriceBR(sub.additionalPrice)}` : "Sem custo adicional"}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateMutation.mutate({ id: sub.id, isActive: !sub.isActive })}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-md border transition-colors",
                        sub.isActive
                          ? "text-orange-600 border-orange-200 hover:bg-orange-50"
                          : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      )}
                    >
                      {sub.isActive ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate({ id: sub.id })}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma opção de troca cadastrada.</p>
              <p className="text-xs text-muted-foreground mt-1">Busque um produto do catálogo ou adicione manualmente.</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Search products from catalog */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Buscar produto do catálogo
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o nome do produto..."
                className="pl-9 h-10"
              />
            </div>

            {/* Search results */}
            {searchQuery.trim().length >= 2 && (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {filteredResults.length > 0 ? (
                  filteredResults.map((product: any) => {
                    const img = getProductImage(product);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddFromCatalog(product)}
                        disabled={createMutation.isPending}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-red-300 hover:bg-red-50/30 transition-colors text-left group"
                      >
                        {/* Product image */}
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {img ? (
                            <img src={img} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {parseFloat(product.price || "0").toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        {/* Add icon */}
                        <div className="p-1.5 rounded-md bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                      Nenhum produto encontrado para "{searchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManualName(searchQuery);
                        setShowManualForm(true);
                        setSearchQuery("");
                      }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium mt-1 underline"
                    >
                      Adicionar manualmente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Manual add section */}
          <div className="space-y-3">
            {!showManualForm ? (
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border/70 hover:border-red-300 hover:bg-red-50/30 transition-colors text-sm text-muted-foreground hover:text-red-600"
              >
                <Plus className="h-4 w-4" />
                Adicionar item manualmente
              </button>
            ) : (
              <div className="space-y-3 p-3 rounded-xl border border-border/50 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Adicionar manualmente
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Use para itens que não estão no catálogo. O preço pode ficar zerado.
                </p>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nome do item de troca"
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddManual();
                  }}
                />
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      +R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatPriceBR(manualPriceCents)}
                      onChange={handleManualPriceChange}
                      className="h-9 pl-10 text-right"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddManual();
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddManual}
                    disabled={createMutation.isPending || !manualName.trim()}
                    className="h-9 px-4 bg-red-500 hover:bg-red-600"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualForm(false);
                    setManualName("");
                    setManualPriceCents(0);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Small button to open substitution manager from item row
export function SubstitutionButton({
  complementItemId,
  complementItemName,
  establishmentId,
  hasSubstitutions,
}: {
  complementItemId: number;
  complementItemName: string;
  establishmentId: number;
  hasSubstitutions?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors flex-shrink-0",
          hasSubstitutions
            ? "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
            : "bg-muted text-muted-foreground border-border hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
        )}
        style={{ height: "28px" }}
      >
        <ArrowRightLeft className="h-3 w-3" />
        Trocar
      </button>
      <SubstitutionManager
        complementItemId={complementItemId}
        complementItemName={complementItemName}
        establishmentId={establishmentId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
