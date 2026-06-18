import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DateRangePickerSales } from "@/components/DateRangePickerSales";
import { useSearch } from "@/contexts/SearchContext";
import { EmptyState, PageHeader, SectionCard, StatusBadge, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Clock,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  NotebookText,
  Package,
  Phone,
  QrCode,
  ReceiptText,
  Store,
  Truck,
  User,
  UtensilsCrossed,
  XCircle,
  Wifi,
  Star,
  Printer,
} from "lucide-react";

type PedidoHistorico = {
  id: number;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status?: string | null;
  deliveryType?: string | null;
  paymentMethod?: string | null;
  source?: string | null;
  subtotal?: string | number | null;
  deliveryFee?: string | number | null;
  discount?: string | number | null;
  total?: string | number | null;
  createdAt?: string | Date | null;
  completedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  customerAddress?: string | null;
  notes?: string | null;
  changeAmount?: string | number | null;
  couponCode?: string | null;
  cancellationReason?: string | null;
  externalDisplayId?: string | null;
  items?: Array<{
    id?: number | null;
    productName?: string | null;
    quantity?: number | null;
    unitPrice?: string | number | null;
    totalPrice?: string | number | null;
    notes?: string | null;
    complements?: Array<{
      name?: string | null;
      price?: string | number | null;
      quantity?: number | null;
      isIncluded?: boolean | null;
      groupType?: "complement" | "included" | string | null;
    }> | null;
  }>;
};

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "default"; icon: typeof Clock }> = {
  pending_confirmation: { label: "Aguardando confirmação", variant: "warning", icon: Clock },
  new: { label: "Novo", variant: "info", icon: Package },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat },
  ready: { label: "Pronto", variant: "success", icon: CheckCircle2 },
  out_for_delivery: { label: "Saiu para entrega", variant: "info", icon: Truck },
  completed: { label: "Concluído", variant: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle },
  scheduled: { label: "Agendado", variant: "warning", icon: CalendarDays },
};

const deliveryTypeConfig: Record<string, { label: string; icon: typeof Bike }> = {
  delivery: { label: "Entrega", icon: Bike },
  pickup: { label: "Retirada", icon: Store },
  dine_in: { label: "Mesa", icon: UtensilsCrossed },
};

const paymentMethodConfig: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  boleto: { label: "Boleto", icon: CreditCard },
  card_online: { label: "Cartão online", icon: CreditCard },
  pix_online: { label: "Pix online", icon: QrCode },
};

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5;
  const pagesToShow = Math.min(maxVisiblePages, totalPages);
  const halfWindow = Math.floor(pagesToShow / 2);
  const startPage = Math.max(1, Math.min(currentPage - halfWindow, totalPages - pagesToShow + 1));
  return Array.from({ length: pagesToShow }, (_, index) => startPage + index);
}

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDefaultRange() {
  const today = toYMD(new Date());
  return { startDate: today, endDate: today };
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

function formatPhone(phone: string | null | undefined) {
  if (!phone) return "";
  const original = String(phone).trim();
  let digits = original.replace(/\D/g, "");

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return original;
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateRange(startDate: string, endDate: string) {
  const format = (value: string) => {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };
  return `${format(startDate)} até ${format(endDate)}`;
}

function formatOrderIdentifier(order: PedidoHistorico) {
  const rawOrderNumber = String(order.orderNumber ?? order.id ?? "").trim();
  if (!rawOrderNumber) return "—";
  return rawOrderNumber.startsWith("#") ? rawOrderNumber : `#${rawOrderNumber}`;
}

function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatCsvDecimal(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(2).replace(".", ",");
}

function buildOrdersCsv(orders: PedidoHistorico[]) {
  const header = ["pedido", "cliente", "data", "modalidade", "pagamento", "status", "total"];
  const rows = orders.map((order) => {
    const delivery = deliveryTypeConfig[order.deliveryType ?? ""]?.label ?? order.deliveryType ?? "";
    const payment = paymentMethodConfig[order.paymentMethod ?? ""]?.label ?? order.paymentMethod ?? "";
    const status = statusConfig[order.status ?? ""]?.label ?? order.status ?? "";

    return [
      formatOrderIdentifier(order),
      order.customerName || "Cliente não informado",
      formatDateTime(order.createdAt),
      delivery,
      payment,
      status,
      formatCsvDecimal(order.total),
    ];
  });

  return [header, ...rows]
    .map((row) => row.map(escapeCsvValue).join(";"))
    .join("\n");
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^0-9a-zA-Z_-]/g, "-");
}

export default function PedidosHistorico() {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const { searchQuery: globalSearch, setSearchQuery } = useSearch();

  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id ?? null;
  const utils = trpc.useUtils();
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;
  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      utils.printer.getSettings.invalidate();
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });
  const reprintMutation = trpc.printer.reprintOrder.useMutation({
    onSuccess: (data) => {
      toast.success("Pedido enviado para impressão", {
        description: `Enviado para ${data.connections} impressora(s) conectada(s).`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao reimprimir", {
        description: error.message,
      });
    },
  });
  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    if (!establishmentId) return;
    updatePrintMethodMutation.mutate({
      establishmentId,
      defaultPrintMethod: method,
    });
  };

  const ordersQuery = trpc.orders.list.useQuery(
    {
      establishmentId: establishment?.id ?? 0,
      startDate,
      endDate,
      limit: 2000,
    },
    {
      enabled: !!establishment?.id,
      refetchInterval: false,
    }
  );

  const orders = (ordersQuery.data?.orders ?? []) as PedidoHistorico[];

  const orderDetailsQuery = trpc.orders.get.useQuery(
    { id: selectedOrder ?? 0 },
    { enabled: selectedOrder !== null }
  );
  const orderDetails = orderDetailsQuery.data as PedidoHistorico | undefined;

  const filteredOrders = useMemo(() => {
    const normalizedSearch = normalizeText(globalSearch.trim());
    if (!normalizedSearch) return orders;

    return orders.filter((order) => {
      const itemsText = order.items?.map((item) => item.productName).join(" ") ?? "";
      return [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.status,
        order.deliveryType,
        order.paymentMethod,
        itemsText,
      ].some((value) => normalizeText(value).includes(normalizedSearch));
    });
  }, [orders, globalSearch]);

  const filteredOrdersRevenue = useMemo(() => {
    return filteredOrders.filter(order => order.status === "completed").reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  }, [filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const visiblePageNumbers = useMemo(() => getVisiblePageNumbers(currentPage, totalPages), [currentPage, totalPages]);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);
  const firstItemIndex = filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastItemIndex = Math.min(currentPage * itemsPerPage, filteredOrders.length);

  const handleExportCsv = () => {
    if (filteredOrders.length === 0) return;

    const csv = buildOrdersCsv(filteredOrders);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-pedidos-${sanitizeFilenamePart(startDate)}-a-${sanitizeFilenamePart(endDate)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, startDate, endDate, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleApplyRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handlePrintOrder = () => {
    if (!selectedOrder) return;
    window.open(`/api/print/receipt/${selectedOrder}`, "_blank", "width=400,height=600");
  };

  const periodSummary = `${formatDateRange(startDate, endDate)} • ${filteredOrders.length} pedido(s) • ${formatCurrency(filteredOrdersRevenue)}${globalSearch.trim() ? ` • ${filteredOrders.length} exibido(s) pela busca global` : ""}`;
  const hasOrdersAboveQueryLimit = (ordersQuery.data?.total ?? 0) > orders.length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="space-y-5">
        <PageHeader
          title="Histórico de pedidos"
          description="Consulte pedidos por período usando o mesmo filtro do Dashboard."
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="bg-muted rounded-xl p-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-colors px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                  onClick={handleExportCsv}
                  disabled={ordersQuery.isLoading || filteredOrders.length === 0}
                  title={filteredOrders.length === 0 ? "Não há pedidos para exportar neste filtro" : "Exportar lista filtrada em CSV"}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
              <div className="bg-muted rounded-xl p-1">
                <DateRangePickerSales
                  startDate={startDate}
                  endDate={endDate}
                  onApply={handleApplyRange}
                  triggerClassName="flex items-center gap-2 rounded-lg cursor-pointer transition-colors px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                  triggerLabel="Filtro"
                  triggerIcon="sliders"
                />
              </div>
            </div>
          }
        />


        {ordersQuery.isLoading ? (
          <SectionCard noPadding>
            <div className="border-b border-border/50 px-5 py-3 text-sm text-muted-foreground">
              {periodSummary}
            </div>
            <div className="p-5">
              <TableSkeleton rows={8} columns={6} />
            </div>
          </SectionCard>
        ) : filteredOrders.length === 0 ? (
          <>
            <p className="px-1 text-sm text-muted-foreground">{periodSummary}</p>
            <EmptyState
              icon={Package}
              title="Nenhum pedido encontrado"
              description="Ajuste o período ou a busca global da top bar para visualizar pedidos no histórico."
              action={globalSearch.trim() ? { label: "Limpar busca global", onClick: () => setSearchQuery("") } : undefined}
              className="min-h-[420px]"
            />
          </>
        ) : (
          <SectionCard noPadding>
            <div className="border-b border-border/50 px-5 py-3 text-sm text-muted-foreground">
              {periodSummary}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Pedido</th>
                    <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                    <th className="px-5 py-3 text-left font-semibold">Data</th>
                    <th className="px-5 py-3 text-left font-semibold">Modalidade</th>
                    <th className="px-5 py-3 text-left font-semibold">Pagamento</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedOrders.map((order) => {
                    const status = statusConfig[order.status ?? ""] ?? { label: order.status ?? "Indefinido", variant: "default" as const, icon: Clock };
                    const StatusIcon = status.icon;
                    const delivery = deliveryTypeConfig[order.deliveryType ?? ""] ?? { label: order.deliveryType ?? "—", icon: Store };
                    const DeliveryIcon = delivery.icon;
                    const payment = paymentMethodConfig[order.paymentMethod ?? ""] ?? { label: order.paymentMethod ?? "—", icon: CreditCard };
                    const PaymentIcon = payment.icon;
                    const itemsPreview = order.items?.slice(0, 2).map((item) => `${item.quantity ?? 1}x ${item.productName}`).join(", ");

                    return (
                      <tr
                        key={order.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Abrir detalhes do pedido ${formatOrderIdentifier(order)}`}
                        className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        onClick={() => setSelectedOrder(order.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedOrder(order.id);
                          }
                        }}
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-foreground">{formatOrderIdentifier(order)}</div>
                          {itemsPreview && (
                            <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
                              {itemsPreview}{order.items && order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{order.customerName || "Cliente não informado"}</span>
                          </div>
                          {order.customerPhone && (
                            <div className="mt-1 text-xs text-muted-foreground">{formatPhone(order.customerPhone)}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="inline-flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground">
                            <DeliveryIcon className="h-3.5 w-3.5" />
                            {delivery.label}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="inline-flex items-center gap-2 text-muted-foreground">
                            <PaymentIcon className="h-4 w-4" />
                            <span>{payment.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <StatusBadge variant={status.variant} className="gap-1.5 text-xs">
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-4 align-top text-right font-bold text-foreground">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-4 border-t border-border/50 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-3">
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="h-12 w-[98px] rounded-2xl border-border bg-background px-4 text-base font-medium shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" className="min-w-[98px] rounded-2xl">
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)} className="rounded-xl text-base">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm font-medium text-muted-foreground">Itens por página</span>
                </div>
                <span className="text-xs text-muted-foreground sm:ml-2">
                  Mostrando {firstItemIndex}–{lastItemIndex} de {filteredOrders.length}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {visiblePageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-xl text-sm font-semibold"
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                  >
                    {pageNumber}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {hasOrdersAboveQueryLimit && (
          <p className="text-xs text-muted-foreground">
            Exibindo os {orders.length} pedidos mais recentes do período. Refine o filtro para carregar uma faixa menor, se necessário.
          </p>
        )}
      </div>

      <Sheet open={selectedOrder !== null} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <SheetContent side="right" className="w-full p-0 overflow-hidden flex flex-col sm:max-w-md" hideCloseButton>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={!selectedOrder}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={handlePrintOrder}>
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    <span className="text-sm">Impressão Normal</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavoritePrintMethod('normal');
                    }}
                    className="p-1 hover:bg-accent-foreground/10 rounded"
                    title="Definir como impressão padrão"
                  >
                    <Star 
                      className={cn(
                        "h-4 w-4 transition-colors",
                        printerSettings?.defaultPrintMethod === 'normal' 
                          ? "fill-amber-500 text-amber-500" 
                          : "text-amber-500"
                      )} 
                    />
                  </button>
                </div>
                {hasMindiPrinterApiKey && (
                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                    if (!selectedOrder || !establishmentId) return;
                    reprintMutation.mutate({ orderId: selectedOrder, establishmentId });
                  }}>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                        <span className="text-sm">Impressão Automática</span>
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">Mindi</span>
                      </div>
                      <span className="text-[11px] text-gray-400 ml-6">Reenviar para impressora</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoritePrintMethod('automatic');
                      }}
                      className="p-1 hover:bg-accent-foreground/10 rounded"
                      title="Definir como impressão padrão"
                    >
                      <Star 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          printerSettings?.defaultPrintMethod === 'automatic' 
                            ? "fill-amber-500 text-amber-500" 
                            : "text-amber-500"
                        )} 
                      />
                    </button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(orderDetailsQuery.isLoading || orderDetailsQuery.isFetching) && !orderDetails && (
            <div className="overflow-y-auto flex-1 p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-6 w-40 rounded" />
                  <div className="skeleton h-4 w-56 rounded" />
                </div>
                <div className="skeleton h-7 w-24 rounded-lg" />
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="skeleton h-4 w-48 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="skeleton h-4 w-40 rounded" />
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="flex items-center gap-3">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="skeleton h-4 w-24 rounded" />
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3 py-2">
                    <div className="skeleton h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-24 rounded" />
                    </div>
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderDetails && (() => {
            const status = statusConfig[orderDetails.status ?? ""] ?? { label: orderDetails.status ?? "Indefinido", variant: "default" as const, icon: Clock };
            const delivery = deliveryTypeConfig[orderDetails.deliveryType ?? ""] ?? { label: orderDetails.deliveryType ?? "—", icon: Store };
            const DeliveryIcon = delivery.icon;
            const payment = paymentMethodConfig[orderDetails.paymentMethod ?? ""] ?? { label: orderDetails.paymentMethod ?? "—", icon: CreditCard };
            const PaymentIcon = payment.icon;
            const isExternalOrder = orderDetails.source && orderDetails.source !== "internal";

            return (
              <div className="overflow-y-auto flex-1">
                <div className="px-6 py-4 bg-muted/20 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Pedido {formatOrderIdentifier(orderDetails)}</h2>
                    <p className="text-sm text-muted-foreground">{formatDateTime(orderDetails.createdAt)}</p>
                    {isExternalOrder && orderDetails.externalDisplayId && (
                      <p className="text-sm font-bold text-red-500 mt-1">Código de Coleta: {orderDetails.externalDisplayId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExternalOrder && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm">
                        {String(orderDetails.source).toUpperCase()}
                      </span>
                    )}
                    <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <h4 className="font-semibold text-base mb-3">Informações do Cliente</h4>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {orderDetails.customerName?.charAt(0) || "C"}
                          </span>
                          <span className="font-medium truncate">{orderDetails.customerName || "Cliente"}</span>
                        </div>
                        {orderDetails.customerPhone && (
                          <span className="text-muted-foreground shrink-0">{formatPhone(orderDetails.customerPhone)}</span>
                        )}
                      </div>
                      {orderDetails.customerPhone && !isExternalOrder && (
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                            <Phone className="h-3.5 w-3.5" />
                            Ligar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            onClick={() => {
                              let phone = orderDetails.customerPhone?.replace(/\D/g, "");
                              if (phone && !phone.startsWith("55")) phone = `55${phone}`;
                              const itemsText = orderDetails.items?.map((item) => {
                                let itemLine = `${item.quantity ?? 1}x ${item.productName ?? "Item"}`;
                                if (item.complements && item.complements.length > 0) {
                                  itemLine += "\n" + item.complements.map((complement) => {
                                    const quantity = complement.quantity || 1;
                                    return quantity > 1 ? `  ↳ ${quantity}x ${complement.name}` : `  ↳ ${complement.name}`;
                                  }).join("\n");
                                }
                                return itemLine;
                              }).join("\n") || "";
                              const message = `Olá ${orderDetails.customerName || ""}! Sobre seu pedido ${formatOrderIdentifier(orderDetails)}:\n\n*Itens:*\n${itemsText}\n\n*Total:* ${formatCurrency(orderDetails.total)}`;
                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
                            }}
                          >
                            <img src="/icons8-whatsapp.svg" alt="WhatsApp" className="h-4 w-4" />
                            Mensagem
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-base">Itens do Pedido</h4>
                      </div>
                      <div className="space-y-3">
                        {orderDetails.items?.map((item, index) => (
                          <div key={item.id ?? index} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-medium text-sm flex-1">{item.productName}</span>
                              <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                            </div>
                            {item.complements && item.complements.length > 0 && (
                              <div className="mt-1.5 pl-2 border-l-2 border-primary/30">
                                {item.complements.map((complement, compIndex) => {
                                  const quantity = complement.quantity || 1;
                                  const complementTotal = Number(complement.price ?? 0) * quantity;
                                  const isIncluded = complement.isIncluded || complement.groupType === "included";
                                  return (
                                    <div key={compIndex} className="flex justify-between text-xs text-muted-foreground">
                                      <span className="text-foreground/70">↳ {isIncluded ? "Incluso: " : ""}{quantity > 1 ? `${quantity}x ` : ""}{complement.name}</span>
                                      {isIncluded ? (
                                        <span className="text-foreground/70">Incluso</span>
                                      ) : complementTotal > 0 ? (
                                        <span className="text-foreground/70">{formatCurrency(complementTotal)}</span>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {(Number(item.unitPrice ?? 0) > 0 || item.notes) && (
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{item.notes || ""}</span>
                                {Number(item.unitPrice ?? 0) > 0 && <span>{formatCurrency(item.unitPrice)} x {item.quantity ?? 1}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl overflow-hidden">
                    <div className="p-4 space-y-3">
                      <h4 className="font-semibold text-base">Entrega e Pagamento</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 text-muted-foreground"><DeliveryIcon className="h-4 w-4" />Modalidade</span>
                          <span className="font-medium">{delivery.label}</span>
                        </div>
                        {orderDetails.customerAddress && (
                          <div className="flex items-start justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />Endereço</span>
                            <span className="font-medium text-right max-w-[240px]">{orderDetails.customerAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 text-muted-foreground"><PaymentIcon className="h-4 w-4" />Pagamento</span>
                          <span className="font-medium">{payment.label}</span>
                        </div>
                        {Number(orderDetails.changeAmount ?? 0) > 0 && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Troco para</span>
                            <span className="font-medium">{formatCurrency(orderDetails.changeAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(orderDetails.notes || orderDetails.cancellationReason) && (
                    <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/20">
                      <div className="p-4 space-y-3">
                        <h4 className="font-semibold text-base inline-flex items-center gap-2"><NotebookText className="h-4 w-4" />Observações</h4>
                        {orderDetails.notes && <p className="text-sm text-muted-foreground whitespace-pre-line">{orderDetails.notes}</p>}
                        {orderDetails.cancellationReason && (
                          <p className="text-sm text-destructive whitespace-pre-line">Motivo do cancelamento: {orderDetails.cancellationReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30 rounded-xl overflow-hidden">
                    <div className="p-4 space-y-2 text-sm">
                      <h4 className="font-semibold text-base mb-3">Resumo do Pagamento</h4>
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(orderDetails.subtotal)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxa de entrega</span><span>{formatCurrency(orderDetails.deliveryFee)}</span></div>
                      {Number(orderDetails.discount ?? 0) > 0 && (
                        <div className="flex justify-between text-emerald-600"><span>Desconto{orderDetails.couponCode ? ` (${orderDetails.couponCode})` : ""}</span><span>-{formatCurrency(orderDetails.discount)}</span></div>
                      )}
                      <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(orderDetails.total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {!orderDetails && !orderDetailsQuery.isLoading && !orderDetailsQuery.isFetching && selectedOrder !== null && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6" />
              <p className="text-sm">Não foi possível carregar os detalhes deste pedido.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
      </div>
    </AdminLayout>
  );
}
