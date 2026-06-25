import { useState } from "react";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { trpc } from "@/lib/trpc";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Radio,
  Store,
} from "lucide-react";

const eventConfig = {
  disconnected: { label: "Desconectado", icon: WifiOff, bgColor: "bg-amber-50", textColor: "text-amber-700", dotColor: "bg-amber-500" },
  order_missed: { label: "Pedido Perdido", icon: AlertTriangle, bgColor: "bg-red-50", textColor: "text-red-700", dotColor: "bg-red-500" },
  reconnected: { label: "Reconectado", icon: Wifi, bgColor: "bg-green-50", textColor: "text-green-700", dotColor: "bg-green-500" },
};

export default function AdminSSELogs() {
  const [filters, setFilters] = useState<{
    establishmentId?: number;
    event?: "disconnected" | "order_missed" | "reconnected";
    limit: number;
    offset: number;
  }>({ limit: 50, offset: 0 });

  const { data: logsData, isLoading, refetch } = trpc.admin.sseConnectivity.list.useQuery(filters, {
    refetchInterval: 30000,
  });

  const { data: statusData, isLoading: statusLoading } = trpc.admin.sseConnectivity.status.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const logs = logsData?.logs ?? [];
  const total = logsData?.total ?? 0;
  const totalPages = Math.ceil(total / filters.limit);
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  return (
    <AdminPanelLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wifi className="h-6 w-6" />
              Conectividade SSE
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitoramento de conexões em tempo real dos estabelecimentos
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Radio className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Conexões Ativas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statusLoading ? "..." : statusData?.totalConnections ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estabelecimentos Online</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statusLoading ? "..." : statusData?.establishments?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <WifiOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sem Conexão</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statusLoading ? "..." : statusData?.disconnected ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Online Establishments */}
        {statusData?.establishments && statusData.establishments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Estabelecimentos Online Agora
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusData.establishments.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {e.name} ({e.connections})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-700"
              value={filters.event ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, event: e.target.value as any || undefined, offset: 0 }))}
            >
              <option value="">Todos os eventos</option>
              <option value="disconnected">Desconectado</option>
              <option value="order_missed">Pedido Perdido</option>
              <option value="reconnected">Reconectado</option>
            </select>
            <input
              type="number"
              placeholder="ID Estabelecimento"
              className="px-3 py-1.5 border rounded-lg text-sm w-40 bg-white dark:bg-gray-700"
              value={filters.establishmentId ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, establishmentId: e.target.value ? Number(e.target.value) : undefined, offset: 0 }))}
            />
            {(filters.event || filters.establishmentId) && (
              <button
                onClick={() => setFilters({ limit: 50, offset: 0 })}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Histórico de Eventos ({total})
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Wifi className="h-10 w-10 mb-2" />
              <p>Nenhum evento de conectividade registrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const config = eventConfig[log.event as keyof typeof eventConfig] ?? eventConfig.disconnected;
                const Icon = config.icon;
                return (
                  <div key={log.id} className={`p-4 flex items-start gap-3 ${config.bgColor} bg-opacity-30`}>
                    <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          Estab. #{log.establishmentId}
                        </span>
                        {log.orderId && (
                          <span className="text-xs text-gray-500">
                            Pedido #{log.orderId}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {log.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setFilters(f => ({ ...f, offset: f.offset - f.limit }))}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setFilters(f => ({ ...f, offset: f.offset + f.limit }))}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
