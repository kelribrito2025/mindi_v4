import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  Bike,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

const ITEMS_PER_PAGE = 20;

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntregadorDetalhes() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const driverId = parseInt(params.id || "0");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: driver, isLoading: driverLoading } = trpc.driver.getById.useQuery(
    { id: driverId },
    { enabled: driverId > 0 }
  );
  const { data: metrics, isLoading: metricsLoading } = trpc.driver.getDetailMetrics.useQuery(
    { driverId },
    { enabled: driverId > 0 }
  );
  const { data: deliveriesList, isLoading: deliveriesLoading, refetch: refetchDeliveries } = trpc.driver.getDeliveries.useQuery(
    { driverId },
    { enabled: driverId > 0 }
  );

  const markPaidMutation = trpc.driver.markAsPaid.useMutation();

  // Pagination logic
  const totalItems = deliveriesList?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedDeliveries = useMemo(() => {
    if (!deliveriesList) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return deliveriesList.slice(start, end);
  }, [deliveriesList, currentPage]);

  // Reset to page 1 if current page exceeds total
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handleMarkPaid = async (deliveryId: number) => {
    try {
      await markPaidMutation.mutateAsync({ deliveryId });
      toast.success("Repasse marcado como pago");
      refetchDeliveries();
    } catch (error: any) {
      toast.error("Erro ao marcar como pago", { description: error.message });
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of deliveries section
      document.getElementById("deliveries-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (driverLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <TableSkeleton rows={5} columns={6} />
        </div>
      </AdminLayout>
    );
  }

  if (!driver) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Entregador não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/entregadores")}>
            Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/entregadores")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"}`}>
              {driver.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{driver.name}</h1>
              <p className="text-sm text-muted-foreground">{driver.whatsapp} · {driver.isActive ? "Ativo" : "Inativo"}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total de entregas"
            value={metricsLoading ? "..." : metrics?.totalDeliveries ?? 0}
            icon={Package}
            variant="blue"
            loading={metricsLoading}
          />
          <StatCard
            title="Total bruto"
            value={metricsLoading ? "..." : formatCurrency(metrics?.totalBruto ?? 0)}
            icon={DollarSign}
            variant="emerald"
            loading={metricsLoading}
          />
          <StatCard
            title="Pendente"
            value={metricsLoading ? "..." : formatCurrency(metrics?.totalPending ?? 0)}
            icon={Clock}
            variant="amber"
            loading={metricsLoading}
          />
          <StatCard
            title="Já pago"
            value={metricsLoading ? "..." : formatCurrency(metrics?.totalPaid ?? 0)}
            icon={CheckCircle2}
            variant="emerald"
            loading={metricsLoading}
          />

        </div>

        {/* Deliveries Table */}
        <div id="deliveries-section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bike className="h-5 w-5 text-muted-foreground" />
              Entregas realizadas
            </h2>
            {totalItems > 0 && (
              <span className="text-sm text-muted-foreground">
                {totalItems} {totalItems === 1 ? "entrega" : "entregas"} no total
              </span>
            )}
          </div>

          {deliveriesLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : !deliveriesList || deliveriesList.length === 0 ? (
            <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma entrega registrada</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pedido</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bairro</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Taxa</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Repasse</th>
                      <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDeliveries.map((delivery) => {
                      const order = delivery.order;
                      // Extract neighborhood from address
                      const addressParts = (order?.customerAddress || "").split(",");
                      const neighborhood = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : addressParts[0]?.trim() || "—";

                      return (
                        <tr key={delivery.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium">{order?.orderNumber || "—"}</td>
                          <td className="p-4">{order?.customerName || "—"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{neighborhood}</td>
                          <td className="p-4 text-right">{formatCurrency(parseFloat(delivery.deliveryFee || "0"))}</td>
                          <td className="p-4 text-right font-medium">{formatCurrency(parseFloat(delivery.repasseValue || "0"))}</td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={delivery.paymentStatus === "paid" ? "default" : "secondary"}
                              className={delivery.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}
                            >
                              {delivery.paymentStatus === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right text-sm text-muted-foreground">{formatDate(delivery.createdAt)}</td>
                          <td className="p-4 text-right">
                            {delivery.paymentStatus === "pending" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => handleMarkPaid(delivery.id)}
                                disabled={markPaidMutation.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Pagar
                              </Button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Pago
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border/30">
                {paginatedDeliveries.map((delivery) => {
                  const order = delivery.order;
                  return (
                    <div key={delivery.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{order?.orderNumber || "—"}</span>
                        <Badge
                          variant={delivery.paymentStatus === "paid" ? "default" : "secondary"}
                          className={delivery.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}
                        >
                          {delivery.paymentStatus === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                      <p className="text-sm">{order?.customerName || "—"}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa: {formatCurrency(parseFloat(delivery.deliveryFee || "0"))}</span>
                        <span className="font-medium">Repasse: {formatCurrency(parseFloat(delivery.repasseValue || "0"))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(delivery.createdAt)}</span>
                        {delivery.paymentStatus === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => handleMarkPaid(delivery.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Pagar
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Pago
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span key={`dots-${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="icon"
                          className={`h-8 w-8 text-sm ${currentPage === page ? "bg-red-500 text-white hover:bg-red-500" : ""}`}
                          onClick={() => goToPage(page as number)}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
