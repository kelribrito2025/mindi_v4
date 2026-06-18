import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Clock,
  AlertTriangle,
  Timer,
  RotateCcw,
  Zap,
  CreditCard,
  Loader2,
  Store,
  Eye,
  MoreHorizontal,
  XCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TrialFilter = "all" | "active" | "expiring_3days" | "expiring_1day" | "expired";

const filterLabels: Record<TrialFilter, string> = {
  all: "Todos",
  active: "Ativos",
  expiring_3days: "Vencendo em 3 dias",
  expiring_1day: "Vencendo em 1 dia",
  expired: "Expirados",
};

function getStatusBadge(status: string) {
  if (status === "expired") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200 gap-1">
        <XCircle className="h-3.5 w-3.5" /> Expirado
      </Badge>
    );
  }
  if (status === "expiring_soon") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
        <AlertTriangle className="h-3.5 w-3.5" /> Expirando
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
      <CheckCircle className="h-3.5 w-3.5" /> Ativo
    </Badge>
  );
}

export default function AdminTrials() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlFilter = new URLSearchParams(searchParams).get("filter") || "all";

  const [filter, setFilter] = useState<TrialFilter>(urlFilter as TrialFilter);
  const [actionDialog, setActionDialog] = useState<{
    id: number;
    name: string;
    action: "extend" | "reset" | "forceExpire" | "convert";
  } | null>(null);
  const [extraDays, setExtraDays] = useState("7");
  const [convertPlan, setConvertPlan] = useState("basic");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // F25: Sync filter to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    const qs = params.toString();
    const newUrl = qs ? `/admin/trials?${qs}` : "/admin/trials";
    window.history.replaceState(null, "", newUrl);
  }, [filter]);

  const { data: trials, isLoading, refetch } = trpc.admin.trials.list.useQuery({ filter });

  const extendMutation = trpc.admin.trials.extend.useMutation({
    onSuccess: () => { toast.success("Trial estendido!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.admin.trials.resetTrial.useMutation({
    onSuccess: () => { toast.success("Trial resetado!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const forceExpireMutation = trpc.admin.trials.forceExpire.useMutation({
    onSuccess: () => { toast.success("Trial expirado!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const convertMutation = trpc.admin.trials.convertToPaid.useMutation({
    onSuccess: () => { toast.success("Convertido para plano pago!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const expiredCount = trials?.filter((t: any) => t.status === "expired").length || 0;
  const totalPages = trials ? Math.ceil(trials.length / pageSize) : 0;
  const paginatedTrials = trials?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <Timer className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Trials</h1>
            <p className="text-sm text-muted-foreground">Gerenciar períodos de avaliação</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(filterLabels) as [TrialFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === key
                  ? "bg-red-500 text-white"
                  : "bg-card text-muted-foreground border border-border/50 hover:bg-muted/50"
              }`}
            >
              {label}
              {key === "expired" && expiredCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">
                  {expiredCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Trials Table */}
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : !trials || trials.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">Nenhum trial encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros</p>
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
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tempo Restante</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrials.map((t: any) => (
                    <tr
                      key={t.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/restaurantes/${t.id}`)}
                    >
                      <td className="p-4">
                        <p className="font-medium">{t.name}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{t.email || "—"}</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="p-4">
                        {t.status === "expired" ? (
                          <span className="text-sm text-red-500 font-medium">Expirado</span>
                        ) : t.daysRemaining > 1 ? (
                          <span className={`text-sm font-medium ${t.daysRemaining <= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                            {t.daysRemaining} dias
                          </span>
                        ) : (
                          <span className="text-sm text-amber-500 font-medium">{t.hoursRemaining}h</span>
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
                            <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${t.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setActionDialog({ id: t.id, name: t.name, action: "extend" })}>
                              <Timer className="h-4 w-4 mr-2 text-blue-600" />
                              Estender trial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActionDialog({ id: t.id, name: t.name, action: "convert" })}>
                              <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                              Converter para pago
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActionDialog({ id: t.id, name: t.name, action: "reset" })}>
                              <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                              Resetar trial
                            </DropdownMenuItem>
                            {t.status !== "expired" && (
                              <DropdownMenuItem
                                onClick={() => setActionDialog({ id: t.id, name: t.name, action: "forceExpire" })}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Forçar expiração
                              </DropdownMenuItem>
                            )}
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
              {paginatedTrials.map((t: any) => (
                <div
                  key={t.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/admin/restaurantes/${t.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email || "—"}</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${t.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setActionDialog({ id: t.id, name: t.name, action: "extend" })}>
                            <Timer className="h-4 w-4 mr-2 text-blue-600" />
                            Estender trial
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActionDialog({ id: t.id, name: t.name, action: "convert" })}>
                            <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                            Converter para pago
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActionDialog({ id: t.id, name: t.name, action: "reset" })}>
                            <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                            Resetar trial
                          </DropdownMenuItem>
                          {t.status !== "expired" && (
                            <DropdownMenuItem
                              onClick={() => setActionDialog({ id: t.id, name: t.name, action: "forceExpire" })}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Forçar expiração
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(t.status)}
                    {t.status === "expired" ? (
                      <span className="text-xs text-red-500 font-medium">Expirado</span>
                    ) : t.daysRemaining > 1 ? (
                      <span className={`text-xs font-medium ${t.daysRemaining <= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {t.daysRemaining} dias restantes
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500 font-medium">{t.hoursRemaining}h restantes</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer count + pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {trials.length} trial{trials.length !== 1 ? "s" : ""} encontrado{trials.length !== 1 ? "s" : ""}
              </span>
              {totalPages > 1 && (
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "extend" && "Estender Trial"}
              {actionDialog?.action === "reset" && "Resetar Trial"}
              {actionDialog?.action === "forceExpire" && "Forçar Expiração"}
              {actionDialog?.action === "convert" && "Converter para Plano Pago"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "extend" && `Adicionar dias extras ao trial de ${actionDialog?.name}`}
              {actionDialog?.action === "reset" && `Resetar o trial de ${actionDialog?.name} para 15 dias`}
              {actionDialog?.action === "forceExpire" && `Forçar a expiração do trial de ${actionDialog?.name}. O menu público será bloqueado.`}
              {actionDialog?.action === "convert" && `Converter ${actionDialog?.name} para um plano pago`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.action === "extend" && (
            <div className="space-y-2">
              <Label>Dias extras</Label>
              <Input
                type="number"
                min="1"
                max="90"
                value={extraDays}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (Number(val) >= 0 && Number(val) <= 90)) {
                    setExtraDays(val);
                  }
                }}
              />
            </div>
          )}

          {actionDialog?.action === "convert" && (
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={convertPlan} onValueChange={setConvertPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lite">Starter</SelectItem>
                  <SelectItem value="basic">Essencial</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-500"
              disabled={extendMutation.isPending || resetMutation.isPending || forceExpireMutation.isPending || convertMutation.isPending}
              onClick={() => {
                if (!actionDialog) return;
                switch (actionDialog.action) {
                  case "extend": {
                    const days = parseInt(extraDays, 10);
                    if (isNaN(days) || days < 1 || days > 90) {
                      toast.error("Dias inválidos. Use um valor entre 1 e 90.");
                      return;
                    }
                    extendMutation.mutate({ id: actionDialog.id, extraDays: days });
                    break;
                  }
                  case "reset":
                    resetMutation.mutate({ id: actionDialog.id });
                    break;
                  case "forceExpire":
                    forceExpireMutation.mutate({ id: actionDialog.id });
                    break;
                  case "convert":
                    convertMutation.mutate({ id: actionDialog.id, planType: convertPlan as any });
                    break;
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPanelLayout>
  );
}
