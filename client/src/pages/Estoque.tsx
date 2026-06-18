import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableSkeleton, StatCard } from "@/components/shared";
import { MobileExpandableText } from "@/components/MobileExpandableText";
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
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Package,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Filter,
  PackagePlus,
  PackageMinus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";

type StockStatus = "ok" | "low" | "critical" | "out_of_stock";

const statusConfig: Record<StockStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  ok: { label: "OK", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircle className="h-4 w-4" /> },
  low: { label: "Baixo", color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", icon: <AlertTriangle className="h-4 w-4" /> },
  critical: { label: "Crítico", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", icon: <AlertCircle className="h-4 w-4" /> },
  out_of_stock: { label: "Sem estoque", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", icon: <XCircle className="h-4 w-4" /> },
};

export default function Estoque() {
  const utils = trpc.useUtils();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 25;

  // Dialogs
  const [isEditQuantityDialogOpen, setIsEditQuantityDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [isThresholdsDialogOpen, setIsThresholdsDialogOpen] = useState(false);
  const [thresholdLow, setThresholdLow] = useState("10");
  const [thresholdCritical, setThresholdCritical] = useState("3");
  const [thresholdOut, setThresholdOut] = useState("0");

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  // Queries
  const { data: establishment } = trpc.establishment.get.useQuery();

  const { data: stockData, isLoading: isLoadingItems } = trpc.stock.listItems.useQuery(
    {
      establishmentId: establishment?.id ?? 0,
      search: search || undefined,
      status: statusFilter !== "all" ? (statusFilter as StockStatus) : undefined,
      categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
      page,
      perPage,
    },
    { enabled: !!establishment?.id }
  );

  const stockItems = stockData?.items ?? [];
  const totalItems = stockData?.total ?? 0;
  const totalPages = stockData?.totalPages ?? 0;

  const { data: catalogCategories } = trpc.stock.listCategories.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id }
  );

  const { data: stockSummary } = trpc.stock.summary.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id }
  );

  const { data: thresholdsData } = trpc.stock.getThresholds.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id }
  );

  // Abrir dialog de thresholds com valores atuais
  const openThresholdsDialog = () => {
    setThresholdLow(String(thresholdsData?.stockLowThreshold ?? 10));
    setThresholdCritical(String(thresholdsData?.stockCriticalThreshold ?? 3));
    setThresholdOut(String(thresholdsData?.stockOutThreshold ?? 0));
    setIsThresholdsDialogOpen(true);
  };

  // Mutations
  const updateThresholdsMutation = trpc.stock.updateThresholds.useMutation({
    onSuccess: () => {
      toast.success("Regras de estoque atualizadas!");
      utils.stock.getThresholds.invalidate();
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
      setIsThresholdsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveThresholds = () => {
    const low = parseInt(thresholdLow);
    const critical = parseInt(thresholdCritical);
    const out = parseInt(thresholdOut);
    if (isNaN(low) || isNaN(critical) || isNaN(out)) {
      toast.error("Preencha todos os campos com valores válidos");
      return;
    }
    if (low <= critical) {
      toast.error('O limite "Baixo" deve ser maior que o limite "Crítico"');
      return;
    }
    if (critical <= out) {
      toast.error('O limite "Crítico" deve ser maior que o limite "Em falta"');
      return;
    }
    updateThresholdsMutation.mutate({
      establishmentId: establishment?.id ?? 0,
      stockLowThreshold: low,
      stockCriticalThreshold: critical,
      stockOutThreshold: out,
    });
  };

  const updateQuantityMutation = trpc.stock.updateQuantity.useMutation({
    onSuccess: () => {
      toast.success("Estoque atualizado!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
      setIsEditQuantityDialogOpen(false);
      setSelectedProduct(null);
      setNewQuantity("");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar estoque: " + error.message);
    },
  });

  const markOutOfStockMutation = trpc.stock.markOutOfStock.useMutation({
    onSuccess: () => {
      toast.success("Produto marcado como sem estoque!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao marcar produto: " + error.message);
    },
  });

  const openEditQuantityDialog = (product: any) => {
    setSelectedProduct(product);
    setNewQuantity(String(product.stockQuantity ?? 0));
    setIsEditQuantityDialogOpen(true);
  };

  const handleUpdateQuantity = () => {
    if (!selectedProduct) return;
    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    updateQuantityMutation.mutate({
      productId: selectedProduct.id,
      stockQuantity: qty,
    });
  };

  // Extrair categorias únicas dos itens de estoque
  const uniqueCategories = useMemo(() => {
    if (!stockItems) return [];
    const catMap = new Map<number, string>();
    stockItems.forEach((item: any) => {
      if (item.categoryId && item.categoryName) {
        catMap.set(item.categoryId, item.categoryName);
      }
    });
    return Array.from(catMap.entries()).map(([id, name]) => ({ id, name }));
  }, [stockItems]);

  // Usar categorias dos itens de estoque ou do catálogo
  const displayCategories = uniqueCategories.length > 0 ? uniqueCategories : (catalogCategories || []);

  const getProductImage = (product: any) => {
    if (product.images) {
      try {
        const imgs = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
      } catch {}
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <PageHeader
          title="Estoque"
          description="Gerencie o estoque dos produtos do seu cardápio"
          icon={<Package className="h-6 w-6 text-blue-500" />}
        />

        {/* Summary Cards — mesmo padrão compacto da página de Clientes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            onClick={() => setStatusFilter("all")}
            className={cn(
              "cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none",
              statusFilter === "all" && "ring-2 ring-blue-500/30 shadow-md"
            )}
          >
            <StatCard title="Total" value={stockSummary?.total ?? 0} icon={Package} variant="blue" />
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === "ok" ? "all" : "ok")}
            className={cn(
              "cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none",
              statusFilter === "ok" && "ring-2 ring-emerald-500/30 shadow-md"
            )}
          >
            <StatCard title="OK" value={stockSummary?.ok ?? 0} icon={CheckCircle} variant="emerald" />
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === "low" ? "all" : "low")}
            className={cn(
              "cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none",
              statusFilter === "low" && "ring-2 ring-amber-500/30 shadow-md"
            )}
          >
            <StatCard title="Baixo" value={stockSummary?.low ?? 0} icon={AlertTriangle} variant="amber" />
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === "critical" ? "all" : "critical")}
            className={cn(
              "cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none",
              statusFilter === "critical" && "ring-2 ring-orange-500/30 shadow-md"
            )}
          >
            <StatCard title="Crítico" value={stockSummary?.critical ?? 0} icon={AlertCircle} variant="orange" />
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === "out_of_stock" ? "all" : "out_of_stock")}
            className={cn(
              "cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none",
              statusFilter === "out_of_stock" && "ring-2 ring-red-500/30 shadow-md"
            )}
          >
            <StatCard title="Em falta" value={stockSummary?.outOfStock ?? 0} icon={XCircle} variant="red" />
          </div>
        </div>

        {/* Info banner - estilo Cashback da página de Clientes */}
        <div
          className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/20 border-blue-200/50 dark:border-blue-800/30"
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%233b82f6' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)', animation: 'banner-shimmer 3s ease-in-out infinite', animationDelay: '1s' }} />
          </div>
          <div className="relative flex items-center gap-3 px-4 py-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/30 dark:bg-blue-500/20" />
              <div className="relative p-2 bg-blue-100 dark:bg-blue-500/15 rounded-full">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">
                
                <span className="sm:hidden">Como funciona?</span>
                <span className="hidden sm:inline">Como funciona o controle de estoque?</span>
              </p>
              <MobileExpandableText
                className="text-xs text-muted-foreground leading-tight mt-0.5"
                collapsedClassName="pr-[4.75rem]"
                expandButtonClassName="text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/90"
              >
                Ative o botão <strong>"Estoque"</strong> nos produtos do Catálogo e defina a quantidade. Quando chegar a zero, o produto será exibido como "Sem estoque" no cardápio.
              </MobileExpandableText>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/catalogo">
                <button className="text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent flex items-center transition-colors">
                  Ir para o Catálogo
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="out_of_stock">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
            {displayCategories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {displayCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={openThresholdsDialog}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 bg-card border border-border text-muted-foreground hover:border-border/80 hover:text-foreground flex-shrink-0"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Regras de estoque</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stock Items List */}
        {isLoadingItems ? (
          <TableSkeleton rows={5} columns={5} />
        ) : !stockItems || stockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto com controle de estoque</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Para controlar o estoque, ative o botão 'Estoque' nos produtos do seu catálogo e defina a quantidade.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produto</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Estoque atual</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item: any) => {
                    const status = item.status as StockStatus;
                    const config = statusConfig[status];
                    const currentQty = item.stockQuantity ?? 0;
                    const imgUrl = getProductImage(item);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => openEditQuantityDialog(item)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {imgUrl ? (
                              <img loading="lazy" src={imgUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                status === "ok" ? "bg-green-100" :
                                status === "low" ? "bg-yellow-100" :
                                status === "critical" ? "bg-orange-100" : "bg-red-100"
                              )}>
                                <Package className={cn(
                                  "h-5 w-5",
                                  status === "ok" ? "text-green-600" :
                                  status === "low" ? "text-yellow-600" :
                                  status === "critical" ? "text-orange-600" : "text-red-500"
                                )} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.price && (
                                <p className="text-xs text-muted-foreground">R$ {Number(item.price).toFixed(2).replace(".", ",")}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{item.categoryName || "Sem categoria"}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-semibold text-lg">{currentQty}</span>
                          <span className="text-sm text-muted-foreground ml-1">un</span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant="outline"
                            className={`${config.bgColor} ${config.color} ${config.borderColor} gap-1`}
                          >
                            {config.icon}
                            {config.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditQuantityDialog(item)}>
                                <Edit className="h-4 w-4 mr-2 text-blue-600" />
                                Editar quantidade
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const newQty = (item.stockQuantity ?? 0) + 1;
                                updateQuantityMutation.mutate({ productId: item.id, stockQuantity: newQty });
                              }}>
                                <PackagePlus className="h-4 w-4 mr-2 text-green-600" />
                                +1 unidade
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const newQty = Math.max(0, (item.stockQuantity ?? 0) - 1);
                                updateQuantityMutation.mutate({ productId: item.id, stockQuantity: newQty });
                              }}>
                                <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
                                -1 unidade
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => markOutOfStockMutation.mutate({ productId: item.id })}
                                className="text-red-500 focus:text-red-500"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Marcar sem estoque
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {stockItems.map((item: any) => {
                const status = item.status as StockStatus;
                const config = statusConfig[status];
                const currentQty = item.stockQuantity ?? 0;
                const imgUrl = getProductImage(item);

                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-muted/20 transition-colors"
                    onClick={() => openEditQuantityDialog(item)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {imgUrl ? (
                          <img loading="lazy" src={imgUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            status === "ok" ? "bg-green-100" :
                            status === "low" ? "bg-yellow-100" :
                            status === "critical" ? "bg-orange-100" : "bg-red-100"
                          )}>
                            <Package className={cn(
                              "h-5 w-5",
                              status === "ok" ? "text-green-600" :
                              status === "low" ? "text-yellow-600" :
                              status === "critical" ? "text-orange-600" : "text-red-500"
                            )} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.categoryName || "Sem categoria"}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditQuantityDialog(item)}>
                              <Edit className="h-4 w-4 mr-2 text-blue-600" />
                              Editar quantidade
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const newQty = (item.stockQuantity ?? 0) + 1;
                              updateQuantityMutation.mutate({ productId: item.id, stockQuantity: newQty });
                            }}>
                              <PackagePlus className="h-4 w-4 mr-2 text-green-600" />
                              +1 unidade
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const newQty = Math.max(0, (item.stockQuantity ?? 0) - 1);
                              updateQuantityMutation.mutate({ productId: item.id, stockQuantity: newQty });
                            }}>
                              <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
                              -1 unidade
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => markOutOfStockMutation.mutate({ productId: item.id })}
                              className="text-red-500 focus:text-red-500"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Marcar sem estoque
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`${config.bgColor} ${config.color} ${config.borderColor} gap-1`}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                      <span className="text-sm font-semibold ml-auto">
                        {currentQty} <span className="text-xs text-muted-foreground font-normal">un</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer count + pagination */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border/50">
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{page} de {totalPages}</span>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {totalItems} produto{totalItems !== 1 ? "s" : ""} encontrado{totalItems !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}


      </div>

      {/* Edit Quantity Dialog */}
      <Dialog open={isEditQuantityDialogOpen} onOpenChange={setIsEditQuantityDialogOpen}>
        <DialogContent
          className="sm:max-w-[380px] p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Editar Estoque</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-5">
              {selectedProduct && getProductImage(selectedProduct) ? (
                <img loading="lazy" src={getProductImage(selectedProduct)} alt={selectedProduct?.name} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                  <Edit className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Editar Estoque</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {selectedProduct?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Quick adjust buttons */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    const current = parseInt(newQuantity) || 0;
                    setNewQuantity(String(Math.max(0, current - 10)));
                  }}
                >
                  -10
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    const current = parseInt(newQuantity) || 0;
                    setNewQuantity(String(Math.max(0, current - 1)));
                  }}
                >
                  -1
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-24 text-center text-2xl font-bold h-14 rounded-xl"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-green-200 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    const current = parseInt(newQuantity) || 0;
                    setNewQuantity(String(current + 1));
                  }}
                >
                  +1
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-green-200 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    const current = parseInt(newQuantity) || 0;
                    setNewQuantity(String(current + 10));
                  }}
                >
                  +10
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Estoque atual: <strong>{selectedProduct?.stockQuantity ?? 0}</strong> unidades
              </p>

              <Button
                className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleUpdateQuantity}
                disabled={updateQuantityMutation.isPending}
              >
                {updateQuantityMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thresholds Config Dialog */}
      <Dialog open={isThresholdsDialogOpen} onOpenChange={setIsThresholdsDialogOpen}>
        <DialogContent
          className="sm:max-w-[420px] p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Regras de Estoque</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Regras de Estoque</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  Defina os limites de quantidade para cada status de estoque.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-yellow-100">
                    <AlertTriangle className="h-3 w-3 text-yellow-700" />
                  </span>
                  Baixo (até quantas unidades)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={thresholdLow}
                  onChange={(e) => setThresholdLow(e.target.value)}
                  className="h-10 rounded-lg"
                  placeholder="Ex: 10"
                />
                <p className="text-xs text-muted-foreground">Produtos com quantidade igual ou menor serão marcados como "Baixo"</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-100">
                    <AlertCircle className="h-3 w-3 text-orange-700" />
                  </span>
                  Crítico (até quantas unidades)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={thresholdCritical}
                  onChange={(e) => setThresholdCritical(e.target.value)}
                  className="h-10 rounded-lg"
                  placeholder="Ex: 3"
                />
                <p className="text-xs text-muted-foreground">Produtos com quantidade igual ou menor serão marcados como "Crítico"</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100">
                    <XCircle className="h-3 w-3 text-red-500" />
                  </span>
                  Em falta (até quantas unidades)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={thresholdOut}
                  onChange={(e) => setThresholdOut(e.target.value)}
                  className="h-10 rounded-lg"
                  placeholder="Ex: 0"
                />
                <p className="text-xs text-muted-foreground">Produtos com quantidade igual ou menor serão marcados como "Em falta"</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg"
                onClick={() => setIsThresholdsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSaveThresholds}
                disabled={updateThresholdsMutation.isPending}
              >
                {updateThresholdsMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
