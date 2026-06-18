import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Trash2, CheckCircle, XCircle, AlertCircle, Wifi, Cable, MonitorSmartphone, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PrintLogsTabProps {
  establishmentId: number;
}

const triggerLabels: Record<string, string> = {
  new_order: "Novo Pedido",
  accept: "Pedido Aceito",
  manual: "Manual",
  reprint: "Reimpressão",
};

const methodLabels: Record<string, string> = {
  sse: "SSE (Mindi Printer)",
  pos_driver: "POSPrinterDriver",
  socket_tcp: "Socket TCP",
  direct: "Impressão Direta",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  sent: { label: "Enviado", variant: "default", icon: CheckCircle },
  failed: { label: "Falhou", variant: "destructive", icon: XCircle },
  pending: { label: "Pendente", variant: "secondary", icon: AlertCircle },
};

function MethodIcon({ method }: { method: string }) {
  switch (method) {
    case "sse":
      return <Wifi className="h-3.5 w-3.5" />;
    case "socket_tcp":
    case "direct":
      return <Cable className="h-3.5 w-3.5" />;
    case "pos_driver":
      return <MonitorSmartphone className="h-3.5 w-3.5" />;
    default:
      return <Wifi className="h-3.5 w-3.5" />;
  }
}

export function PrintLogsTab({ establishmentId }: PrintLogsTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchOrder, setSearchOrder] = useState("");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearDays, setClearDays] = useState(30);

  const { data: logsData, isLoading, refetch } = (trpc.printer as any).logs.list.useQuery(
    {
      establishmentId,
      limit: 100,
      status: filterStatus !== "all" ? filterStatus : undefined,
      trigger: filterTrigger !== "all" ? filterTrigger : undefined,
      orderNumber: searchOrder.trim() || undefined,
    },
    { enabled: !!establishmentId }
  ) as { data: { logs: any[]; total: number } | undefined; isLoading: boolean; refetch: () => void };

  const { data: stats } = (trpc.printer as any).logs.stats.useQuery(
    { establishmentId, days: 7 },
    { enabled: !!establishmentId }
  ) as { data: { totalPrints: number; successCount: number; failedCount: number; byTrigger: Record<string, number>; byMethod: Record<string, number> } | undefined };

  const clearMutation = (trpc.printer as any).logs.clear.useMutation({
    onSuccess: (result: { deleted: number }) => {
      toast.success(`${result.deleted} log(s) removido(s)`);
      refetch();
      setClearDialogOpen(false);
    },
    onError: () => toast.error("Erro ao limpar logs"),
  });

  const filteredLogs = useMemo(() => {
    if (!logsData?.logs) return [];
    let result = logsData.logs;
    if (filterMethod !== "all") {
      result = result.filter((log: any) => log.method === filterMethod);
    }
    return result;
  }, [logsData, filterMethod]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatFullDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalPrints}</p>
              <p className="text-xs text-muted-foreground">Total (7 dias)</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.successCount}</p>
              <p className="text-xs text-muted-foreground">Enviados</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.failedCount}</p>
              <p className="text-xs text-muted-foreground">Falharam</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {stats.totalPrints > 0 ? Math.round((stats.successCount / stats.totalPrints) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Log de Impressões</CardTitle>
              <CardDescription>Histórico de todas as tentativas de impressão</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                className="rounded-xl text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="failed">Falharam</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTrigger} onValueChange={setFilterTrigger}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Gatilho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new_order">Novo Pedido</SelectItem>
                <SelectItem value="accept">Aceito</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sse">SSE (Mindi)</SelectItem>
                <SelectItem value="socket_tcp">Socket TCP</SelectItem>
                <SelectItem value="pos_driver">POSPrinter</SelectItem>
                <SelectItem value="direct">Direta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Logs */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum log de impressão encontrado</p>
              <p className="text-xs mt-1">Os logs aparecerão aqui quando pedidos forem impressos</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log: any) => {
                const statusCfg = statusConfig[log.status] || statusConfig.pending;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expandedLog === log.id;

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "border rounded-lg transition-colors duration-200 cursor-pointer",
                      isExpanded ? "bg-muted/30" : "hover:bg-muted/20",
                      log.status === "failed" && "border-destructive/30"
                    )}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    {/* Linha principal */}
                    <div className="flex items-center gap-2 p-2.5">
                      <StatusIcon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          log.status === "sent" && "text-green-600",
                          log.status === "failed" && "text-red-500",
                          log.status === "pending" && "text-yellow-600"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            #{log.orderNumber}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                            <MethodIcon method={log.method} />
                            {methodLabels[log.method] || log.method}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                            {triggerLabels[log.trigger] || log.trigger}
                          </Badge>
                        </div>
                        {log.errorMessage && (
                          <p className="text-xs text-destructive mt-0.5 truncate">
                            {log.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2.5 pt-0 border-t border-border/50">
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Data completa:</span>
                            <p className="font-medium">{formatFullDate(log.createdAt)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ID do Pedido:</span>
                            <p className="font-medium">{log.orderId || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Conexões SSE:</span>
                            <p className="font-medium">{log.printerConnections ?? "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={statusCfg.variant} className="text-[10px] mt-0.5">
                              {statusCfg.label}
                            </Badge>
                          </div>
                          {log.errorMessage && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Erro:</span>
                              <p className="font-medium text-destructive break-all">{log.errorMessage}</p>
                            </div>
                          )}
                          {log.metadata && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Metadados:</span>
                              <pre className="font-mono text-[10px] bg-muted p-1.5 rounded mt-0.5 overflow-x-auto">
                                {typeof log.metadata === "string"
                                  ? log.metadata
                                  : JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Limpar Logs */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Limpar Logs de Impressão</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar limpeza de logs</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Limpar Logs de Impressão</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Remover logs com mais de quantos dias?
                </p>
              </div>
            </div>
            <div className="mb-4">
              <Select value={clearDays.toString()} onValueChange={(v) => setClearDays(parseInt(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Mais de 7 dias</SelectItem>
                  <SelectItem value="15">Mais de 15 dias</SelectItem>
                  <SelectItem value="30">Mais de 30 dias</SelectItem>
                  <SelectItem value="0">Todos os logs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearMutation.mutate({ establishmentId, olderThanDays: clearDays || undefined })}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? "Limpando..." : "Limpar Logs"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
