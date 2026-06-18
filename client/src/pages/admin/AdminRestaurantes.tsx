import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search,
  Store,
  Eye,
  Pencil,
  Lock,
  Unlock,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  GlobeLock,
  MoreHorizontal,
  Filter,
  Zap,
  Timer,
  Crown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";

type PlanFilter = "all" | "trial" | "active_trial" | "lite" | "basic" | "pro" | "expired" | "paid";

const planFilterLabels: Record<PlanFilter, string> = {
  all: "Todos",
  trial: "Trial (todos)",
  active_trial: "Trial ativo",
  expired: "Trial expirado",
  lite: "Lite",
  basic: "Essencial",
  pro: "Pro",
  paid: "Pagos",
};

const planBadgeConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  free: { label: "Free", color: "text-gray-700", bgColor: "bg-gray-50", borderColor: "border-gray-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  trial: { label: "Trial", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: <Timer className="h-3.5 w-3.5" /> },
  expired: { label: "Expirado", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  expiring_soon: { label: "Expirando", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  lite: { label: "Lite", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", icon: <Zap className="h-3.5 w-3.5" /> },
  basic: { label: "Essencial", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  pro: { label: "Pro", color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200", icon: <Zap className="h-3.5 w-3.5" /> },
};

function getPlanBadge(planType: string, trialStatus: string, displayName?: string) {
  if (planType === "trial") {
    if (trialStatus === "expired") {
      const cfg = planBadgeConfig.expired;
      return (
        <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
          {cfg.icon} {cfg.label}
        </Badge>
      );
    }
    if (trialStatus === "expiring_soon") {
      const cfg = planBadgeConfig.expiring_soon;
      return (
        <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
          {cfg.icon} {cfg.label}
        </Badge>
      );
    }
    const cfg = planBadgeConfig.trial;
    return (
      <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
        {cfg.icon} {cfg.label}
      </Badge>
    );
  }
  const cfg = planBadgeConfig[planType] || planBadgeConfig.free;
  const label = displayName || cfg.label;
  return (
    <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
      {cfg.icon} {label}
    </Badge>
  );
}

export default function AdminRestaurantes() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlFilter = new URLSearchParams(searchParams).get("filter") || "all";

  const [search, setSearch] = useState(new URLSearchParams(searchParams).get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(new URLSearchParams(searchParams).get("search") || "");
  const [planFilter, setPlanFilter] = useState<PlanFilter>(urlFilter as PlanFilter);
  const [page, setPage] = useState(Number(new URLSearchParams(searchParams).get("page")) || 1);
  const [changePlanDialog, setChangePlanDialog] = useState<{ id: number; name: string; currentPlan?: string } | null>(null);
  const [newPlan, setNewPlan] = useState<string>("basic");

  // Buscar displayNames dinâmicos dos planos
  const { data: planData } = trpc.admin.plans.getAll.useQuery();
  const planDisplayNames: Record<string, string> = {
    free: "Free",
    trial: "Free (gratuito)",
    lite: "Starter",
    basic: "Essencial",
    pro: "Pro",
  };
  // Sobrescrever com displayNames do banco se disponíveis
  if (planData?.prices) {
    for (const p of planData.prices) {
      if (p.displayName) {
        planDisplayNames[p.planId] = p.displayName;
        // Mapear trial -> free (trial é o ID no banco, free é o ID visual)
        if (p.planId === 'trial') {
          planDisplayNames['free'] = p.displayName;
        }
      }
    }
  }
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; name: string; action: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: number; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [toggleMenuDialog, setToggleMenuDialog] = useState<{ id: number; name: string; isOpen: boolean } | null>(null);

  // F25: Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (planFilter !== "all") params.set("filter", planFilter);
    if (search.trim()) params.set("search", search.trim());
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const newUrl = qs ? `/admin/restaurantes?${qs}` : "/admin/restaurantes";
    window.history.replaceState(null, "", newUrl);
  }, [planFilter, search, page]);

  // F20: Debounce de 400ms na busca de restaurantes
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const queryFilter = planFilter === "paid" ? undefined : planFilter;

  const { data, isLoading, refetch } = trpc.admin.restaurants.list.useQuery({
    search: debouncedSearch.trim() || undefined,
    planFilter: planFilter === "paid" ? "basic" : queryFilter,
    page,
    limit: 20,
  });

  const changePlanMutation = trpc.admin.restaurants.changePlan.useMutation({
    onSuccess: () => {
      toast.success("Plano alterado com sucesso!");
      refetch();
      setChangePlanDialog(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMenuMutation = trpc.admin.restaurants.toggleMenu.useMutation({
    onSuccess: () => {
      toast.success("Menu público atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetTrialMutation = trpc.admin.restaurants.resetTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial resetado com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const forceExpireMutation = trpc.admin.restaurants.forceExpire.useMutation({
    onSuccess: () => {
      toast.success("Trial expirado forçadamente!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.restaurants.delete.useMutation({
    onSuccess: (data: any) => {
      const nome = data?.name || "selecionado";
      toast.success(`Restaurante "${nome}" excluído permanentemente!`);
      refetch();
      setDeleteDialog(null);
      setDeleteConfirmText("");
    },
    onError: (err) => toast.error(err.message),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Restaurantes</h1>
            <p className="text-sm text-muted-foreground">Gerenciar todos os restaurantes da plataforma</p>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v as PlanFilter); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(planFilterLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : !data?.restaurants.length ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Store className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">Nenhum restaurante encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Restaurante</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plano</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Trial</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Menu</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.restaurants.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/restaurantes/${r.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {r.logo ? (
                            <img loading="lazy" src={r.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Store className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{r.email || "—"}</span>
                      </td>
                      <td className="p-4">
                        {getPlanBadge(r.planType, r.trialStatus, planDisplayNames[r.planType])}
                      </td>
                      <td className="p-4">
                        {r.planType === "trial" ? (
                          r.trialStatus === "expired" ? (
                            <span className="text-sm text-red-500 font-medium">Expirado</span>
                          ) : r.trialStatus === "expiring_soon" ? (
                            <span className="text-sm text-amber-500 font-medium">{r.daysRemaining}d restantes</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">{r.daysRemaining}d restantes</span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {r.isOpen ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <Globe className="h-3.5 w-3.5" /> Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1">
                            <GlobeLock className="h-3.5 w-3.5" /> Inativo
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${r.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setNewPlan(r.planType); setChangePlanDialog({ id: r.id, name: r.name, currentPlan: r.planType }); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Alterar plano
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={toggleMenuMutation.isPending || resetTrialMutation.isPending || forceExpireMutation.isPending}
                              onClick={() => setToggleMenuDialog({ id: r.id, name: r.name, isOpen: r.isOpen })}
                            >
                              {r.isOpen ? (
                                <><Lock className="h-4 w-4 mr-2 text-orange-600" /> Bloquear menu</>
                              ) : (
                                <><Unlock className="h-4 w-4 mr-2 text-green-600" /> Desbloquear menu</>
                              )}
                            </DropdownMenuItem>
                            {r.planType === "trial" && (
                              <>
                                <DropdownMenuItem
                                  disabled={toggleMenuMutation.isPending || resetTrialMutation.isPending || forceExpireMutation.isPending}
                                  onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "resetTrial" })}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                                  Resetar trial
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={toggleMenuMutation.isPending || resetTrialMutation.isPending || forceExpireMutation.isPending}
                                  onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "forceExpire" })}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Expirar trial
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ id: r.id, name: r.name })}
                              className="text-red-500 focus:text-red-500 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir restaurante
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {data.restaurants.map((r) => (
                <div
                  key={r.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/admin/restaurantes/${r.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {r.logo ? (
                        <img loading="lazy" src={r.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""}</p>
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
                          <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${r.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setNewPlan(r.planType); setChangePlanDialog({ id: r.id, name: r.name, currentPlan: r.planType }); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Alterar plano
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={toggleMenuMutation.isPending || resetTrialMutation.isPending || forceExpireMutation.isPending}
                            onClick={() => setToggleMenuDialog({ id: r.id, name: r.name, isOpen: r.isOpen })}
                          >
                            {r.isOpen ? (
                              <><Lock className="h-4 w-4 mr-2 text-orange-600" /> Bloquear menu</>
                            ) : (
                              <><Unlock className="h-4 w-4 mr-2 text-green-600" /> Desbloquear menu</>
                            )}
                          </DropdownMenuItem>
                          {r.planType === "trial" && (
                            <DropdownMenuItem
                              disabled={toggleMenuMutation.isPending || resetTrialMutation.isPending || forceExpireMutation.isPending}
                              onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "resetTrial" })}
                            >
                              <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                              Resetar trial
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog({ id: r.id, name: r.name })}
                            className="text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir restaurante
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPlanBadge(r.planType, r.trialStatus, planDisplayNames[r.planType])}
                    {r.isOpen ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-xs">
                        <Globe className="h-3 w-3" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1 text-xs">
                        <GlobeLock className="h-3 w-3" /> Inativo
                      </Badge>
                    )}
                    {r.planType === "trial" && r.daysRemaining !== undefined && (
                      <span className={cn(
                        "text-xs font-medium",
                        r.trialStatus === "expired" ? "text-red-500" :
                        r.trialStatus === "expiring_soon" ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {r.trialStatus === "expired" ? "Expirado" : `${r.daysRemaining}d restantes`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {data?.total ?? 0} restaurantes encontrados
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={!!changePlanDialog} onOpenChange={() => setChangePlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterar o plano de <strong>{changePlanDialog?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">{planDisplayNames.free || "Free"}</SelectItem>
              <SelectItem value="lite">{planDisplayNames.lite}</SelectItem>
              <SelectItem value="basic">{planDisplayNames.basic}</SelectItem>
              <SelectItem value="pro">{planDisplayNames.pro}</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-500"
              disabled={changePlanMutation.isPending}
              onClick={() => {
                if (!changePlanDialog) return;
                if (newPlan === changePlanDialog.currentPlan) {
                  toast.error("Selecione um plano diferente do atual.");
                  return;
                }
                changePlanMutation.mutate({
                  id: changePlanDialog.id,
                  planType: newPlan as any,
                });
              }}
            >
              {changePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* F08: Toggle Menu Confirmation Dialog */}
      <Dialog open={!!toggleMenuDialog} onOpenChange={() => setToggleMenuDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleMenuDialog?.isOpen ? "Bloquear Menu" : "Desbloquear Menu"}</DialogTitle>
            <DialogDescription>
              {toggleMenuDialog?.isOpen ? (
                <>Tem certeza que deseja <strong>bloquear</strong> o menu público de <strong>{toggleMenuDialog?.name}</strong>? Os clientes não poderão acessar o cardápio.</>
              ) : (
                <>Tem certeza que deseja <strong>desbloquear</strong> o menu público de <strong>{toggleMenuDialog?.name}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleMenuDialog(null)}>Cancelar</Button>
            <Button
              className={toggleMenuDialog?.isOpen ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"}
              disabled={toggleMenuMutation.isPending}
              onClick={() => {
                if (!toggleMenuDialog) return;
                toggleMenuMutation.mutate({ id: toggleMenuDialog.id, isOpen: !toggleMenuDialog.isOpen });
                setToggleMenuDialog(null);
              }}
            >
              {toggleMenuMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "resetTrial" && (
                <>Tem certeza que deseja resetar o trial de <strong>{confirmDialog?.name}</strong>? Isso dará mais 15 dias de trial.</>
              )}
              {confirmDialog?.action === "forceExpire" && (
                <>Tem certeza que deseja forçar a expiração do trial de <strong>{confirmDialog?.name}</strong>? O menu público será bloqueado.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-500"
              disabled={resetTrialMutation.isPending || forceExpireMutation.isPending}
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.action === "resetTrial") {
                  resetTrialMutation.mutate({ id: confirmDialog.id });
                } else if (confirmDialog.action === "forceExpire") {
                  forceExpireMutation.mutate({ id: confirmDialog.id });
                }
                setConfirmDialog(null);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => { setDeleteDialog(null); setDeleteConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Excluir Restaurante
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <span className="block">
                Tem certeza que deseja excluir permanentemente o restaurante <strong>{deleteDialog?.name}</strong>?
              </span>
              <span className="block text-red-500 font-medium">
                Esta ação é irreversível! Todos os dados serão removidos: pedidos, produtos, categorias, clientes, configurações, mesas, comandas, financeiro, etc.
              </span>
              <span className="block">
                Digite <strong>EXCLUIR</strong> para confirmar:
              </span>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR"
            className="border-red-200 focus-visible:ring-red-500"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialog(null); setDeleteConfirmText(""); }}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "EXCLUIR" || deleteMutation.isPending}
              onClick={() => {
                if (!deleteDialog || deleteConfirmText !== "EXCLUIR") return;
                deleteMutation.mutate({ id: deleteDialog.id });
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPanelLayout>
  );
}
