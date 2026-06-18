import { useState, useMemo } from "react";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  X,
  RefreshCw,
  Clock,
  Store,
  User,
  Phone,
  Hash,
  Loader2,
} from "lucide-react";

type Level = "info" | "warn" | "error";

const levelConfig: Record<Level, { label: string; icon: typeof Info; bgColor: string; textColor: string; dotColor: string }> = {
  info: { label: "Info", icon: Info, bgColor: "bg-blue-50", textColor: "text-blue-700", dotColor: "bg-blue-500" },
  warn: { label: "Warning", icon: AlertTriangle, bgColor: "bg-amber-50", textColor: "text-amber-700", dotColor: "bg-amber-500" },
  error: { label: "Erro", icon: AlertCircle, bgColor: "bg-red-50", textColor: "text-red-500", dotColor: "bg-red-500" },
};

const eventLabels: Record<string, string> = {
  order_created: "Pedido Criado",
  order_failed: "Pedido Falhou",
  price_mismatch: "Preço Inconsistente",
  payment_failed: "Pagamento Falhou",
  validation_error: "Erro de Validação",
};

const sourceLabels: Record<string, string> = {
  publicMenu: "Menu Público",
  botApi: "Bot API",
  whatsapp: "WhatsApp",
  server: "Servidor",
  stripeConnect: "Stripe",
};

export default function AdminOrderLogs() {
  const [filters, setFilters] = useState<{
    establishmentId?: number;
    level?: Level;
    event?: string;
    source?: string;
    search?: string;
  }>({});
  const [page, setPage] = useState(0);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const pageSize = 50;

  const stableFilters = useMemo(() => ({
    ...filters,
    limit: pageSize,
    offset: page * pageSize,
  }), [filters, page]);

  const { data, isLoading, refetch, isFetching } = trpc.admin.orderLogs.list.useQuery(stableFilters, {
    refetchInterval: 15000,
  });

  const { data: stats } = trpc.admin.orderLogs.stats.useQuery();
  const { data: establishments } = trpc.admin.orderLogs.establishments.useQuery();

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "");

  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <AdminPanelLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <FileText className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Logs de Pedidos</h1>
              <p className="text-sm text-muted-foreground">Monitoramento de criação e erros de pedidos</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className="bg-card rounded-xl border border-border/50 px-4 py-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => { setFilters({}); setPage(0); }}
            >
              <p className="text-xs text-muted-foreground font-medium uppercase">Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div
              className="bg-card rounded-xl border border-border/50 border-t-4 border-t-blue-500 px-4 py-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => { setFilters({ level: "info" }); setPage(0); }}
            >
              <p className="text-xs text-blue-600 font-medium uppercase">Info</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.info}</p>
            </div>
            <div
              className="bg-card rounded-xl border border-border/50 border-t-4 border-t-amber-500 px-4 py-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => { setFilters({ level: "warn" }); setPage(0); }}
            >
              <p className="text-xs text-amber-600 font-medium uppercase">Warnings</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{stats.warn}</p>
            </div>
            <div
              className="bg-card rounded-xl border border-border/50 border-t-4 border-t-red-500 px-4 py-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => { setFilters({ level: "error" }); setPage(0); }}
            >
              <p className="text-xs text-red-500 font-medium uppercase">Erros</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{stats.error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por mensagem, nome ou telefone..."
                value={filters.search ?? ""}
                onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value || undefined })); setPage(0); }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Establishment */}
            <select
              value={filters.establishmentId ?? ""}
              onChange={(e) => { setFilters(f => ({ ...f, establishmentId: e.target.value ? Number(e.target.value) : undefined })); setPage(0); }}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="">Todos estabelecimentos</option>
              {establishments?.map(est => (
                <option key={est.id} value={est.id}>{est.name}</option>
              ))}
            </select>

            {/* Level */}
            <select
              value={filters.level ?? ""}
              onChange={(e) => { setFilters(f => ({ ...f, level: (e.target.value || undefined) as Level | undefined })); setPage(0); }}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="">Todos níveis</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Erro</option>
            </select>

            {/* Source */}
            <select
              value={filters.source ?? ""}
              onChange={(e) => { setFilters(f => ({ ...f, source: e.target.value || undefined })); setPage(0); }}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="">Todas origens</option>
              <option value="publicMenu">Menu Público</option>
              <option value="botApi">Bot API</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="server">Servidor</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum log encontrado</p>
              <p className="text-xs mt-1">
                {hasActiveFilters ? "Tente ajustar os filtros" : "Os logs aparecerão quando pedidos forem criados"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {logs.map((log) => {
                const config = levelConfig[log.level as Level] ?? levelConfig.info;
                const LevelIcon = config.icon;
                const isExpanded = expandedLog === log.id;

                return (
                  <div
                    key={log.id}
                    className={`transition-colors ${isExpanded ? 'bg-muted/30' : 'hover:bg-muted/20'}`}
                  >
                    {/* Main row */}
                    <div
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      {/* Level badge */}
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium shrink-0 mt-0.5 ${config.bgColor} ${config.textColor}`}>
                        <LevelIcon className="h-3 w-3" />
                        {config.label}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{log.message}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </span>
                          {log.establishmentName && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Store className="h-3 w-3" />
                              {log.establishmentName}
                            </span>
                          )}
                          {log.customerName && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {log.customerName}
                            </span>
                          )}
                          {log.customerPhone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {log.customerPhone}
                            </span>
                          )}
                          {log.orderId && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              Pedido #{log.orderId}
                            </span>
                          )}
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            log.source === 'publicMenu' ? 'bg-emerald-50 text-emerald-700' :
                            log.source === 'botApi' ? 'bg-purple-50 text-purple-700' :
                            log.source === 'whatsapp' ? 'bg-green-50 text-green-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {sourceLabels[log.source] ?? log.source}
                          </span>
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
                            {eventLabels[log.event] ?? log.event}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && log.details && (
                      <div className="px-4 pb-3 ml-[72px]">
                        <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                            {JSON.stringify(log.details as Record<string, unknown>, null, 2)}
                          </pre>
                        </div>
                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground mt-2">
                            IP: {log.ipAddress}
                          </p>
                        )}
                        {log.userAgent && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            User-Agent: {log.userAgent}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Mostrando {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPanelLayout>
  );
}
