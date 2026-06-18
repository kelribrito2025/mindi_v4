import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, SectionCard } from "@/components/shared";
import { Plus, Trash2, Clock, ImageIcon, AlertCircle, Eye, Clapperboard, ShoppingBag, Tag, MousePointerClick, ShoppingCart, DollarSign, TrendingUp, BarChart3, Trophy, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StoryViewer from "@/components/StoryViewer";
import CreateStoryDialog from "@/components/CreateStoryDialog";

const MAX_STORIES = 5;

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

function timeRemaining(expiresAt: Date | string): string {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  if (diffMs <= 0) return "Expirado";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}min restantes`;
  const diffH = Math.floor(diffMin / 60);
  return `${diffH}h restantes`;
}

function storyTypeLabel(type: string): { label: string; icon: typeof ImageIcon; color: string } {
  switch (type) {
    case "product":
      return { label: "Produto", icon: ShoppingBag, color: "text-emerald-600" };
    case "promo":
      return { label: "Promoção", icon: Tag, color: "text-orange-600" };
    default:
      return { label: "Imagem", icon: ImageIcon, color: "text-blue-600" };
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

export default function Stories() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const { data: storiesList, isLoading, refetch } = trpc.stories.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Analytics de views
  const { data: viewsData } = trpc.stories.viewsAnalytics.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 30000 }
  );

  // Analytics de conversão
  const { data: conversionData } = trpc.stories.conversionAnalytics.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 30000 }
  );

  // Gráfico de vendas (últimos 7 dias)
  const [chartDays] = useState(7);
  const { data: salesChartData } = trpc.stories.salesChart.useQuery(
    { establishmentId: establishmentId!, days: chartDays },
    { enabled: !!establishmentId, refetchInterval: 60000 }
  );

  // Story mais performático
  const { data: topStory } = trpc.stories.topPerforming.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 60000 }
  );

  // Percentual de vendas hoje
  const { data: revenuePercent } = trpc.stories.revenuePercent.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 60000 }
  );

  const deleteMutation = trpc.stories.delete.useMutation({
    onSuccess: () => {
      toast.success("Story excluído");
      refetch();
      setDeleteConfirm(null);
      setShowStoryViewer(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao excluir story");
    },
  });

  // Filtrar apenas stories ativos (não expirados)
  const activeStories = (storiesList || []).filter(
    (s) => new Date(s.expiresAt).getTime() > Date.now()
  );

  // Mapa de métricas por story
  const metricsMap = useMemo(() => {
    const map = new Map<number, { clicks: number; addToCarts: number; ordersCompleted: number; totalRevenue: number }>();
    if (conversionData) {
      for (const item of conversionData) {
        map.set(item.storyId, item);
      }
    }
    return map;
  }, [conversionData]);

  // Calcular max revenue para o gráfico de barras
  const chartMaxRevenue = useMemo(() => {
    if (!salesChartData) return 0;
    return Math.max(...salesChartData.map(d => d.revenue), 1);
  }, [salesChartData]);

  // Totais gerais
  const totals = useMemo(() => {
    if (!conversionData) return { clicks: 0, addToCarts: 0, orders: 0, revenue: 0 };
    return conversionData.reduce((acc, item) => ({
      clicks: acc.clicks + item.clicks,
      addToCarts: acc.addToCarts + item.addToCarts,
      orders: acc.orders + item.ordersCompleted,
      revenue: acc.revenue + item.totalRevenue,
    }), { clicks: 0, addToCarts: 0, orders: 0, revenue: 0 });
  }, [conversionData]);

  // Nome do story mais performático
  const topStoryName = useMemo(() => {
    if (!topStory || !storiesList) return null;
    const story = storiesList.find(s => s.id === topStory.storyId);
    if (!story) return null;
    return story.type === "promo" && story.promoTitle ? story.promoTitle : `Story #${story.id}`;
  }, [topStory, storiesList]);

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <PageHeader 
            title="Stories" 
            description="Divulgue promoções e novidades no cardápio público"
            icon={<Clapperboard className="h-6 w-6 text-blue-600" />}
          />
        </div>

        {/* Stories Grid - Estilo Instagram */}
        <div className="flex items-start gap-5 overflow-x-auto pb-4">
          {/* Botão Adicionar Story */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCreateDialog(true)}
              disabled={activeStories.length >= MAX_STORIES}
              className={cn(
                "relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-colors",
                activeStories.length >= MAX_STORIES
                  ? "bg-muted/50 cursor-not-allowed"
                  : "bg-muted/30 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
              )}
            >
              <Plus className={cn(
                "h-7 w-7",
                activeStories.length >= MAX_STORIES ? "text-muted-foreground/30" : "text-muted-foreground/60"
              )} />
              {activeStories.length < MAX_STORIES && (
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background">
                  <Plus className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
            <span className="text-xs text-muted-foreground font-medium">Novo story</span>
          </div>

          {/* Stories existentes */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted" />
                <div className="w-12 h-3 bg-muted rounded" />
              </div>
            ))
          ) : (
            activeStories.map((story) => {
              const typeInfo = storyTypeLabel(story.type);
              return (
                <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const idx = activeStories.findIndex(s => s.id === story.id);
                      setStoryViewerIndex(idx >= 0 ? idx : 0);
                      setShowStoryViewer(true);
                    }}
                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-visible group"
                  >
                    <div className="absolute inset-0 rounded-full p-[3px]" style={{
                      background: story.type === "promo" 
                        ? "linear-gradient(45deg, #f97316, #ef4444, #f97316)"
                        : story.type === "product"
                        ? "linear-gradient(45deg, #10b981, #059669, #10b981)"
                        : "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
                    }}>
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                        <img
                          src={story.imageUrl}
                          alt="Story"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {story.type !== "simple" && (
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background",
                        story.type === "product" ? "bg-emerald-500" : "bg-orange-500"
                      )}>
                        <typeInfo.icon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] text-muted-foreground">{timeAgo(story.createdAt)}</span>
                    {viewsData && viewsData[story.id] !== undefined && (
                      <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                        <Eye className="h-2.5 w-2.5" />
                        {viewsData[story.id]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info do limite */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{activeStories.length}/{MAX_STORIES} stories ativos</span>
          {activeStories.length >= MAX_STORIES && (
            <span className="text-amber-500 font-medium">— Limite atingido</span>
          )}
        </div>

        {/* ===== PAINEL DE ANALYTICS ===== */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Performance dos Stories</h2>
                  <p className="text-xs text-muted-foreground">Métricas de conversão e vendas</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
              >
                {showAnalytics ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {showAnalytics && (
              <div className="space-y-6">
                {/* Insight de destaque */}
                {revenuePercent && revenuePercent.percent > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">
                          Stories geraram <span className="text-blue-600 dark:text-blue-400">{revenuePercent.percent}%</span> das vendas hoje
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(revenuePercent.storyRevenue)} de {formatCurrency(revenuePercent.totalRevenue)} total
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* KPI Cards - Mesmo padrão StatCard da Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard
                    title="Cliques"
                    value={totals.clicks}
                    icon={MousePointerClick}
                    variant="blue"
                  />
                  <StatCard
                    title="Carrinho"
                    value={totals.addToCarts}
                    icon={ShoppingCart}
                    variant="amber"
                  />
                  <StatCard
                    title="Pedidos"
                    value={totals.orders}
                    icon={ShoppingBag}
                    variant="emerald"
                  />
                  <StatCard
                    title="Faturamento"
                    value={formatCurrency(totals.revenue)}
                    icon={DollarSign}
                    variant="emerald"
                  />
                </div>

                {/* Gráfico de vendas + Top Story */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Gráfico de barras */}
                  <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 p-5 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground">Vendas por Stories</h3>
                        <p className="text-xs text-muted-foreground">Últimos {chartDays} dias</p>
                      </div>
                    </div>
                    {salesChartData && salesChartData.length > 0 ? (
                      <div className="flex items-end gap-1.5 h-36 mt-auto">
                        {salesChartData.map((day, idx) => {
                          const heightPct = chartMaxRevenue > 0 ? (day.revenue / chartMaxRevenue) * 100 : 0;
                          const isToday = idx === salesChartData.length - 1;
                          return (
                            <div key={`${day.date}-${idx}`} className="flex-1 flex flex-col items-center gap-1.5">
                              <div className="w-full flex flex-col items-center justify-end h-28 relative group">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                  {day.orders} pedido{day.orders !== 1 ? "s" : ""} · {formatCurrency(day.revenue)}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                </div>
                                <div
                                  className={cn(
                                    "w-full rounded-md transition-colors duration-500",
                                    isToday ? "bg-emerald-500" : "bg-emerald-400/60",
                                    day.revenue === 0 && "bg-muted"
                                  )}
                                  style={{ height: `${Math.max(heightPct, day.revenue > 0 ? 8 : 3)}%` }}
                                />
                              </div>
                              <span className={cn(
                                "text-[11px]",
                                isToday ? "text-foreground font-semibold" : "text-muted-foreground"
                              )}>
                                {formatWeekday(day.date)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">
                        Sem dados de vendas ainda
                      </div>
                    )}
                  </div>

                  {/* Top Story da semana */}
                  <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-5 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                        <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground">Top Story da Semana</h3>
                        <p className="text-xs text-muted-foreground">Melhor performance nos últimos 7 dias</p>
                      </div>
                    </div>
                    {topStory && topStoryName ? (
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            {(() => {
                              const story = storiesList?.find(s => s.id === topStory.storyId);
                              return story ? (
                                <img loading="lazy" src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Trophy className="h-6 w-6 text-amber-500" />
                                </div>
                              );
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-foreground truncate">{topStoryName}</p>
                            <p className="text-xs text-muted-foreground">Melhor performance</p>
                          </div>
                        </div>
                        <div className="space-y-3 pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-sm text-muted-foreground">Pedidos</span>
                            </div>
                            <span className="text-lg font-bold text-foreground">{topStory.orders}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-sm text-muted-foreground">Faturamento</span>
                            </div>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(topStory.revenue)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                        Nenhum pedido via stories esta semana
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Lista detalhada dos stories com métricas */}
        {activeStories.length > 0 && (
          <div className="bg-card rounded-xl border border-border/50 flex flex-col">
            {/* Header padronizado - mesmo estilo dos cards da Dashboard */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Clapperboard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Stories ativos</h3>
                  <p className="text-xs text-muted-foreground">{activeStories.length} stories publicados</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[48px_1fr_60px_60px_60px_70px_36px] sm:grid-cols-[48px_1fr_70px_70px_70px_80px_36px] gap-2 px-2 pb-2 border-b border-border/50">
                <span></span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Story</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Views</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Cliques</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Pedidos</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Vendas</span>
                <span></span>
              </div>

              {/* Linhas da tabela */}
              {activeStories.map((story) => {
                const typeInfo = storyTypeLabel(story.type);
                const TypeIcon = typeInfo.icon;
                const metrics = metricsMap.get(story.id);
                const views = viewsData?.[story.id] ?? 0;
                return (
                  <div
                    key={story.id}
                    className="grid grid-cols-[48px_1fr_60px_60px_60px_70px_36px] sm:grid-cols-[48px_1fr_70px_70px_70px_80px_36px] gap-2 items-center px-2 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={story.imageUrl}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className={cn("h-3 w-3 flex-shrink-0", typeInfo.color)} />
                        <span className={cn("text-xs font-medium", typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                        {story.type === "promo" && story.promoTitle && (
                          <span className="text-xs font-semibold text-foreground truncate">
                            — {story.promoTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{timeAgo(story.createdAt)}</span>
                        <span className="text-[11px] text-muted-foreground/60">·</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {timeRemaining(story.expiresAt)}
                        </span>
                      </div>
                    </div>

                    {/* Views */}
                    <span className="text-sm font-semibold text-foreground text-right">{views}</span>

                    {/* Cliques */}
                    <span className="text-sm font-semibold text-foreground text-right">{metrics?.clicks ?? 0}</span>

                    {/* Pedidos */}
                    <span className="text-sm font-semibold text-foreground text-right">{metrics?.ordersCompleted ?? 0}</span>

                    {/* Vendas */}
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      {formatCurrency(metrics?.totalRevenue ?? 0)}
                    </span>

                    {/* Ações */}
                    <button
                      onClick={() => setDeleteConfirm(story.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && activeStories.length === 0 && (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Nenhum story ativo</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Publique stories para divulgar promoções, combos e novidades diretamente no seu cardápio público.
            </p>
          </div>
        )}

        {/* Dialog de criação de story */}
        {establishmentId && (
          <CreateStoryDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            establishmentId={establishmentId}
            onSuccess={() => refetch()}
            activeStoriesCount={activeStories.length}
            maxStories={MAX_STORIES}
          />
        )}

        {/* StoryViewer fullscreen (mesmo do menu público) */}
        {showStoryViewer && activeStories.length > 0 && (
          <StoryViewer
            stories={activeStories.map(s => ({
              id: s.id,
              imageUrl: s.imageUrl,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
            }))}
            restaurantName={establishment?.name || "Meu Restaurante"}
            restaurantLogo={establishment?.logo}
            initialIndex={storyViewerIndex}
            onClose={() => setShowStoryViewer(false)}
          />
        )}

        {/* Modal de confirmação de exclusão */}
        <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[340px] rounded-2xl">
            <DialogTitle className="text-base font-bold text-foreground">Excluir story?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O story será removido do seu cardápio público.
            </DialogDescription>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </AdminLayout>
  );
}
