import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Package,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Eye,
  EyeOff,
  ArrowRightLeft,
  Search,
  AlertTriangle,
  Globe,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Unified iFood Panel ────────────────────────────────────────────

export function IfoodCatalogPanel() {
  const [activeTab, setActiveTab] = useState<"sync" | "catalog">("sync");

  return (
    <SectionCard
      title="iFood"
      icon={<Globe className="h-5 w-5" />}
      headerRight={
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("sync")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "sync"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="h-3.5 w-3.5 inline mr-1.5" />
            Sincronizar
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "catalog"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="h-3.5 w-3.5 inline mr-1.5" />
            Catálogo iFood
          </button>
        </div>
      }
    >
      {activeTab === "sync" ? <SyncTab /> : <CatalogTab />}
    </SectionCard>
  );
}

// ─── Sync Tab ───────────────────────────────────────────────────────

function SyncTab() {
  const utils = trpc.useUtils();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [publishingProductId, setPublishingProductId] = useState<number | null>(null);
  const [publishingCategoryId, setPublishingCategoryId] = useState<number | null>(null);
  const [expandedSyncCats, setExpandedSyncCats] = useState<Set<number>>(new Set());

  // Fetch local categories and products
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;
  const { data: localCategories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId!, version: 'draft' },
    { enabled: !!establishmentId }
  );
  const { data: localProductsData } = trpc.product.list.useQuery(
    { establishmentId: establishmentId!, version: 'draft' },
    { enabled: !!establishmentId }
  );
  const localProducts = localProductsData?.products || [];

  // Fetch iFood sync mappings
  const { data: syncMappings, refetch: refetchMappings } = trpc.ifood.getSyncMappings.useQuery(
    undefined,
    { enabled: !!establishmentId }
  );

  // Fetch iFood categories for mapping
  const { data: fullCatalog } = trpc.ifood.getFullCatalog.useQuery();
  const ifoodCategories = useMemo(() => {
    if (!fullCatalog?.catalogs) return [];
    const cats: Array<{ id: string; name: string; catalogId: string }> = [];
    for (const catalog of fullCatalog.catalogs) {
      for (const cat of catalog.categories) {
        cats.push({ id: cat.id, name: cat.name, catalogId: catalog.catalogId });
      }
    }
    return cats;
  }, [fullCatalog]);

  // Mutations
  const publishProductMutation = trpc.ifood.publishProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto publicado no iFood com sucesso!");
      refetchMappings();
      setPublishingProductId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao publicar produto no iFood");
      setPublishingProductId(null);
    },
  });

  const publishCategoryMutation = trpc.ifood.publishCategory.useMutation({
    onSuccess: (result) => {
      toast.success(`Categoria publicada: ${result.published} produtos enviados, ${result.failed} falhas`);
      refetchMappings();
      setPublishingCategoryId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao publicar categoria no iFood");
      setPublishingCategoryId(null);
    },
  });

  const syncAllMutation = trpc.ifood.syncAll.useMutation({
    onSuccess: (result) => {
      toast.success(`Sincronização completa: ${result.published} publicados, ${result.updated} atualizados, ${result.failed} falhas`);
      refetchMappings();
      setSyncDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro na sincronização");
      setSyncDialogOpen(false);
    },
  });

  const mapCategoryMutation = trpc.ifood.mapCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria mapeada com sucesso!");
      refetchMappings();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao mapear categoria");
    },
  });

  // Group products by category
  const productsByCategory = useMemo(() => {
    const map = new Map<number, typeof localProducts>();
    for (const product of localProducts) {
      if (!product.categoryId) continue;
      const existing = map.get(product.categoryId) || [];
      existing.push(product);
      map.set(product.categoryId, existing);
    }
    return map;
  }, [localProducts]);

  // Check if a product is already published
  const isProductPublished = (productId: number) => {
    return syncMappings?.productMappings?.some((m: any) => m.localProductId === productId);
  };

  // Check if a category is mapped
  const getCategoryMappingInfo = (categoryId: number) => {
    return syncMappings?.categoryMappings?.find((m: any) => m.localCategoryId === categoryId);
  };

  // Stats
  const syncStats = useMemo(() => {
    const totalProducts = localProducts.filter(p => p.status === 'active').length;
    const publishedProducts = syncMappings?.productMappings?.length || 0;
    const mappedCategories = syncMappings?.categoryMappings?.length || 0;
    const totalCategories = localCategories?.length || 0;
    return { totalProducts, publishedProducts, mappedCategories, totalCategories };
  }, [localProducts, syncMappings, localCategories]);

  const toggleSyncCat = (id: number) => {
    setExpandedSyncCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* Header with Sync All button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Publique e atualize seus produtos no iFood.
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={() => setSyncDialogOpen(true)}
          disabled={syncAllMutation.isPending}
          className="bg-red-500 hover:bg-red-500 text-white"
        >
          {syncAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowRightLeft className="h-4 w-4 mr-2" />
          )}
          Sincronizar Tudo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{syncStats.totalProducts}</p>
          <p className="text-xs text-muted-foreground">Produtos Ativos</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className={cn("text-2xl font-bold", syncStats.publishedProducts === syncStats.totalProducts ? "text-green-500" : "text-amber-500")}>
            {syncStats.publishedProducts}
          </p>
          <p className="text-xs text-muted-foreground">No iFood</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{syncStats.totalCategories}</p>
          <p className="text-xs text-muted-foreground">Categorias</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className={cn("text-2xl font-bold", syncStats.mappedCategories === syncStats.totalCategories ? "text-green-500" : "text-amber-500")}>
            {syncStats.mappedCategories}
          </p>
          <p className="text-xs text-muted-foreground">Mapeadas</p>
        </div>
      </div>

      {/* Categories & Products List */}
      <div className="space-y-2">
        {localCategories?.map((category) => {
          const catProducts = productsByCategory.get(category.id) || [];
          const activeProducts = catProducts.filter(p => p.status === 'active');
          const categoryMapping = getCategoryMappingInfo(category.id);
          const isExpanded = expandedSyncCats.has(category.id);
          const publishedCount = activeProducts.filter(p => isProductPublished(p.id)).length;

          return (
            <div key={category.id} className="border border-border/30 rounded-md overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center gap-2 p-2 bg-muted/20">
                <button onClick={() => toggleSyncCat(category.id)} className="flex items-center gap-2 flex-1 text-left">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {publishedCount}/{activeProducts.length} publicados
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  {/* Category mapping selector */}
                  {ifoodCategories.length > 0 && (
                    <Select
                      value={categoryMapping?.ifoodCategoryId || "_new"}
                      onValueChange={(value) => {
                        if (value !== "_new") {
                          mapCategoryMutation.mutate({
                            localCategoryId: category.id,
                            ifoodCategoryId: value,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue placeholder="Mapear cat." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_new">Nova categoria</SelectItem>
                        {ifoodCategories.map((ic) => (
                          <SelectItem key={ic.id} value={ic.id}>
                            {ic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Publish entire category */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setPublishingCategoryId(category.id);
                      publishCategoryMutation.mutate({ localCategoryId: category.id });
                    }}
                    disabled={publishCategoryMutation.isPending && publishingCategoryId === category.id}
                  >
                    {publishCategoryMutation.isPending && publishingCategoryId === category.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>Publicar Categoria</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Products */}
              {isExpanded && (
                <div className="border-t border-border/20 divide-y divide-border/20">
                  {activeProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Nenhum produto ativo nesta categoria</p>
                  ) : (
                    activeProducts.map((product) => {
                      const isPublished = isProductPublished(product.id);
                      const isPublishing = publishProductMutation.isPending && publishingProductId === product.id;

                      return (
                        <div key={product.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/10 transition-colors">
                          {/* Image */}
                          <div className="h-8 w-8 rounded-md overflow-hidden bg-muted/50 flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img loading="lazy" src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Name & price */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {parseFloat(String(product.price)).toFixed(2)}
                              {product.promotionalPrice && (
                                <span className="text-green-500 ml-1">
                                  → R$ {parseFloat(String(product.promotionalPrice)).toFixed(2)}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Status badge */}
                          {isPublished ? (
                            <Badge variant="default" className="text-xs bg-green-500/20 text-green-600 border-green-500/30">
                              No iFood
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Não publicado
                            </Badge>
                          )}

                          {/* Publish button */}
                          <Button
                            variant={isPublished ? "ghost" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setPublishingProductId(product.id);
                              publishProductMutation.mutate({
                                localProductId: product.id,
                                localCategoryId: product.categoryId || undefined,
                              });
                            }}
                            disabled={isPublishing}
                          >
                            {isPublishing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isPublished ? (
                              "Atualizar"
                            ) : (
                              "Publicar"
                            )}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync All Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar Tudo com o iFood</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação irá publicar <strong>todos os produtos ativos</strong> do seu cardápio local no catálogo do iFood.
              Produtos já publicados serão atualizados com os dados mais recentes.
            </p>
            <div className="mt-3 bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs"><strong>{syncStats.totalProducts}</strong> produtos ativos serão sincronizados</p>
              <p className="text-xs"><strong>{syncStats.publishedProducts}</strong> já estão no iFood (serão atualizados)</p>
              <p className="text-xs"><strong>{syncStats.totalProducts - syncStats.publishedProducts}</strong> serão publicados pela primeira vez</p>
            </div>
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Certifique-se de que os produtos locais estão com preços e nomes corretos.
                  As alterações serão aplicadas imediatamente no iFood.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="bg-red-500 hover:bg-red-500 text-white"
            >
              {syncAllMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sincronizando...</>
              ) : (
                "Confirmar Sincronização"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Catalog Tab ────────────────────────────────────────────────────

function CatalogTab() {
  const [forceRefresh, setForceRefresh] = useState(false);
  const { data: fullCatalog, isLoading, refetch, isRefetching } = trpc.ifood.getFullCatalog.useQuery(
    forceRefresh ? { forceRefresh: true } : undefined,
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleRefresh = () => {
    setForceRefresh(true);
    refetch().finally(() => setForceRefresh(false));
  };

  const [expandedCatalogs, setExpandedCatalogs] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCatalog = (id: string) => {
    setExpandedCatalogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const stats = useMemo(() => {
    if (!fullCatalog?.catalogs) return { catalogs: 0, categories: 0, products: 0, available: 0, unavailable: 0 };
    let categories = 0;
    let products = 0;
    let available = 0;
    let unavailable = 0;
    for (const cat of fullCatalog.catalogs) {
      categories += cat.categories.length;
      for (const c of cat.categories) {
        products += c.products.length;
        for (const p of c.products) {
          if (p.status === "AVAILABLE") available++;
          else unavailable++;
        }
      }
    }
    return { catalogs: fullCatalog.catalogs.length, categories, products, available, unavailable };
  }, [fullCatalog]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando catálogo do iFood...</span>
      </div>
    );
  }

  if (!fullCatalog?.catalogs?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Nenhum catálogo encontrado no iFood.</p>
        <p className="text-sm">Verifique se a loja está configurada corretamente no portal iFood.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Estado atual do seu catálogo no iFood.
        </p>
        <div className="flex items-center gap-2">
          {fullCatalog?.fromCache && (
            <Badge variant="secondary" className="text-xs">Cache</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.categories}</p>
          <p className="text-xs text-muted-foreground">Categorias</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.products}</p>
          <p className="text-xs text-muted-foreground">Produtos</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.available}</p>
          <p className="text-xs text-muted-foreground">Disponíveis</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.unavailable}</p>
          <p className="text-xs text-muted-foreground">Indisponíveis</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto no iFood..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Catalog tree */}
      <div className="space-y-3">
        {fullCatalog.catalogs.map((catalog) => (
          <CatalogNode
            key={catalog.catalogId}
            catalog={catalog}
            expanded={expandedCatalogs.has(catalog.catalogId)}
            onToggle={() => toggleCatalog(catalog.catalogId)}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Catalog Node ────────────────────────────────────────────────────

function CatalogNode({
  catalog,
  expanded,
  onToggle,
  expandedCategories,
  onToggleCategory,
  searchTerm,
}: {
  catalog: any;
  expanded: boolean;
  onToggle: () => void;
  expandedCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  searchTerm: string;
}) {
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return catalog.categories;
    return catalog.categories
      .map((cat: any) => ({
        ...cat,
        products: cat.products.filter((p: any) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((cat: any) => cat.products.length > 0 || cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [catalog.categories, searchTerm]);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <FolderOpen className="h-4 w-4 text-orange-500" />
        <span className="font-medium text-sm">{catalog.context || catalog.catalogId}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {catalog.categories.length} categorias
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-3 pb-3 space-y-2 pt-2">
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhuma categoria encontrada</p>
          ) : (
            filteredCategories.map((category: any) => (
              <IfoodCategoryNode
                key={category.id}
                category={category}
                catalogId={catalog.catalogId}
                expanded={expandedCategories.has(category.id)}
                onToggle={() => onToggleCategory(category.id)}
                searchTerm={searchTerm}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── iFood Category Node ────────────────────────────────────────────

function IfoodCategoryNode({
  category,
  catalogId,
  expanded,
  onToggle,
  searchTerm,
}: {
  category: any;
  catalogId: string;
  expanded: boolean;
  onToggle: () => void;
  searchTerm: string;
}) {
  const toggleCategoryMutation = trpc.ifood.toggleCategoryAvailability.useMutation({
    onSuccess: () => {
      toast.success("Disponibilidade da categoria atualizada");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar categoria");
    },
  });

  const bulkToggleMutation = trpc.ifood.bulkToggleCategoryProducts.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} de ${result.total} produtos atualizados`);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar produtos");
    },
  });

  const isAvailable = category.status === "AVAILABLE";

  return (
    <div className="border border-border/30 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 p-2 bg-muted/20">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-sm font-medium">{category.name}</span>
          <Badge variant={isAvailable ? "default" : "secondary"} className="text-xs ml-1">
            {isAvailable ? "Ativo" : "Inativo"}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto mr-2">
            {category.products.length} itens
          </span>
        </button>

        <div className="flex items-center gap-1">
          <Switch
            checked={isAvailable}
            onCheckedChange={(checked) => {
              toggleCategoryMutation.mutate({
                catalogId,
                categoryId: category.id,
                available: checked,
              });
            }}
            disabled={toggleCategoryMutation.isPending}
            className="scale-75"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              bulkToggleMutation.mutate({
                catalogId,
                categoryId: category.id,
                available: !isAvailable,
              });
            }}
            disabled={bulkToggleMutation.isPending}
          >
            {bulkToggleMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isAvailable ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/20">
          {category.products.length > 0 ? (
            <div className="divide-y divide-border/20">
              {category.products.map((product: any) => (
                <IfoodProductRow key={product.id} product={product} catalogId={catalogId} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
              <Package className="h-5 w-5 mb-1 opacity-50" />
              <p className="text-xs">Nenhum produto nesta categoria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── iFood Product Row ──────────────────────────────────────────────

function IfoodProductRow({ product, catalogId }: { product: any; catalogId: string }) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(product.price?.value?.toString() || "0");

  const toggleMutation = trpc.ifood.toggleProductAvailability.useMutation({
    onSuccess: () => {
      toast.success(`${product.name}: disponibilidade atualizada`);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar produto");
    },
  });

  const priceMutation = trpc.ifood.updateIfoodProductPrice.useMutation({
    onSuccess: () => {
      toast.success(`Preço de "${product.name}" atualizado`);
      setEditingPrice(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar preço");
    },
  });

  const isAvailable = product.status === "AVAILABLE";

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/10 transition-colors">
      {/* Image */}
      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted/50 flex-shrink-0">
        {product.image ? (
          <img loading="lazy" src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Name & description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground truncate">{product.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-1">
        {editingPrice ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="h-7 w-20 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const price = parseFloat(newPrice);
                if (price > 0) {
                  priceMutation.mutate({ catalogId, productId: product.id, price });
                }
              }}
              disabled={priceMutation.isPending}
            >
              {priceMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingPrice(false)}>
              ✕
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditingPrice(true)}
            className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
          >
            <DollarSign className="h-3 w-3" />
            {product.price?.value?.toFixed(2) || "0.00"}
          </button>
        )}
      </div>

      {/* Availability toggle */}
      <Switch
        checked={isAvailable}
        onCheckedChange={(checked) => {
          toggleMutation.mutate({ catalogId, productId: product.id, available: checked });
        }}
        disabled={toggleMutation.isPending}
        className="scale-75"
      />
    </div>
  );
}
