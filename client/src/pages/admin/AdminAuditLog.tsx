/**
 * AdminAuditLog - Página de Log de Atividades do Admin
 * Exibe todas as ações realizadas pelos administradores com filtros e exportação CSV.
 */
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ScrollText,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileDown,
  Filter,
  User,
  Clock,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const ACTION_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  login: { label: "Login", color: "text-blue-700", bgColor: "bg-blue-50" },
  change_plan: { label: "Alterar Plano", color: "text-purple-700", bgColor: "bg-purple-50" },
  open_menu: { label: "Abrir Menu", color: "text-green-700", bgColor: "bg-green-50" },
  close_menu: { label: "Fechar Menu", color: "text-red-500", bgColor: "bg-red-50" },
  extend_trial: { label: "Estender Trial", color: "text-amber-700", bgColor: "bg-amber-50" },
  reset_trial: { label: "Resetar Trial", color: "text-orange-700", bgColor: "bg-orange-50" },
  force_expire: { label: "Expirar Trial", color: "text-red-500", bgColor: "bg-red-50" },
  impersonate: { label: "Impersonar", color: "text-indigo-700", bgColor: "bg-indigo-50" },
  update_subscription: { label: "Atualizar Assinatura", color: "text-teal-700", bgColor: "bg-teal-50" },
  update_contact: { label: "Atualizar Contato", color: "text-cyan-700", bgColor: "bg-cyan-50" },
  convert_to_paid: { label: "Converter p/ Pago", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  convert_legacy: { label: "Converter Imagens", color: "text-violet-700", bgColor: "bg-violet-50" },
  orphan_cleanup: { label: "Limpeza Órfãos", color: "text-rose-700", bgColor: "bg-rose-50" },
};

function getActionBadge(action: string) {
  const cfg = ACTION_LABELS[action] || { label: action, color: "text-gray-700", bgColor: "bg-gray-50" };
  return (
    <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} border-transparent gap-1 text-xs`}>
      {cfg.label}
    </Badge>
  );
}

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const limit = 30;

  // Debounce email search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmail(emailSearch), 400);
    return () => clearTimeout(timer);
  }, [emailSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter, debouncedEmail]);

  const queryInput = useMemo(() => ({
    page,
    limit,
    action: actionFilter !== "all" ? actionFilter : undefined,
    adminEmail: debouncedEmail.trim() || undefined,
  }), [page, limit, actionFilter, debouncedEmail]);

  const { data, isLoading } = trpc.admin.auditLog.list.useQuery(queryInput);

  const exportCsvMutation = trpc.admin.export.auditLogCsv.useQuery(undefined, {
    enabled: false,
  });

  const handleExportCsv = async () => {
    try {
      const result = await exportCsvMutation.refetch();
      if (result.data?.csv) {
        const blob = new Blob(["\uFEFF" + result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename || "audit-log.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exportado com sucesso!");
      }
    } catch {
      toast.error("Erro ao exportar CSV");
    }
  };

  const exportRestaurantsCsvQuery = trpc.admin.export.restaurantsCsv.useQuery(undefined, {
    enabled: false,
  });

  const handleExportRestaurantsCsv = async () => {
    try {
      const result = await exportRestaurantsCsvQuery.refetch();
      if (result.data?.csv) {
        const blob = new Blob(["\uFEFF" + result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename || "restaurantes.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV de restaurantes exportado com sucesso!");
      }
    } catch {
      toast.error("Erro ao exportar CSV de restaurantes");
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  // Skeleton loading
  if (isLoading) {
    return (
      <AdminPanelLayout>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-muted rounded-lg" />
            <div>
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-3 w-56 bg-muted rounded mt-1" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-9 w-48 bg-muted rounded" />
            <div className="h-9 w-40 bg-muted rounded" />
            <div className="h-9 w-32 bg-muted rounded" />
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/30">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded-full" />
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-36 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-11 w-11 bg-indigo-100 text-indigo-600 rounded-lg">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Log de Atividades</h1>
              <p className="text-sm text-muted-foreground">
                Histórico de ações administrativas
                {data && <span className="ml-1">({data.total} registros)</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5"
            >
              <FileDown className="h-4 w-4" />
              Exportar Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportRestaurantsCsv}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Exportar Restaurantes
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email do admin..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Filtrar ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="change_plan">Alterar Plano</SelectItem>
              <SelectItem value="open_menu">Abrir Menu</SelectItem>
              <SelectItem value="close_menu">Fechar Menu</SelectItem>
              <SelectItem value="extend_trial">Estender Trial</SelectItem>
              <SelectItem value="reset_trial">Resetar Trial</SelectItem>
              <SelectItem value="force_expire">Expirar Trial</SelectItem>
              <SelectItem value="impersonate">Impersonar</SelectItem>
              <SelectItem value="update_subscription">Atualizar Assinatura</SelectItem>
              <SelectItem value="update_contact">Atualizar Contato</SelectItem>
              <SelectItem value="convert_to_paid">Converter p/ Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {!data?.logs?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ScrollText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum registro encontrado</p>
            <p className="text-sm mt-1">
              {actionFilter !== "all" || debouncedEmail
                ? "Tente ajustar os filtros de busca."
                : "As ações administrativas aparecerão aqui."}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Data</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Admin</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ação</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ID Alvo</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nome Alvo</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{log.adminEmail}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">{getActionBadge(log.action)}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.targetType}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{log.targetId ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{log.targetName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/30">
                {data.logs.map((log: any) => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      {getActionBadge(log.action)}
                      <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{log.adminEmail}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Tipo: {log.targetType}</span>
                      {log.targetId && <span>ID: {log.targetId}</span>}
                      {log.targetName && <span>{log.targetName}</span>}
                    </div>
                    {log.details && (
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 break-all">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="gap-1"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminPanelLayout>
  );
}
