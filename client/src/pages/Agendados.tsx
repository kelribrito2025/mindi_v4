import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Package,
  Bike,
  Store,
  UtensilsCrossed,
  Check,
  RefreshCw,
  CalendarDays,
  ListChecks,
  ArrowRightCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Eye,
  CheckCircle,
  ChefHat,
  XCircle,
  CreditCard,
  Banknote,
  MessageCircle,
  Loader2,
  Printer,
  Star,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const DAYS_HEADER = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const periodOptions = [
  { value: "today" as const, label: "Hoje" },
  { value: "7days" as const, label: "7 dias" },
  { value: "month" as const, label: "Este mês" },
];

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  pix_online: { label: "Pix Online", icon: QrCode },
  boleto: { label: "Boleto", icon: CreditCard },
  card_online: { label: "Cartão Online", icon: CreditCard },
};

const formatCurrency = (value: string | number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
};

type OrderStatus = "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled" | "scheduled";

const scheduledStatusConfig: Record<string, {
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  scheduled: { label: "Agendado", icon: CalendarClock, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", badgeBg: "#d97706", badgeText: "#ffffff" },
  accepted: { label: "Aceito", icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", badgeBg: "#059669", badgeText: "#ffffff" },
  in_queue: { label: "Na fila", icon: ArrowRightCircle, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", badgeBg: "#3b82f6", badgeText: "#ffffff" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#ef4444", badgeText: "#ffffff" },
};

const getScheduledOrderConfig = (order: any) => {
  if (order.status === "cancelled") return scheduledStatusConfig.cancelled;
  if (order.status === "scheduled" && order.movedToQueue) return scheduledStatusConfig.accepted;
  if (order.status !== "scheduled") return scheduledStatusConfig.in_queue;
  return scheduledStatusConfig.scheduled;
};

export default function Agendados() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [filterRange, setFilterRange] = useState<"today" | "7days" | "month">("month");
  const [rescheduleOrderId, setRescheduleOrderId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: establishment } = trpc.establishment.get.useQuery();

  const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const endDate = new Date(currentYear, currentMonth + 1, 0);
  const endOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const { data: scheduledOrders, isLoading, refetch } = trpc.scheduling.getByRange.useQuery(
    { startDate: startOfMonth, endDate: endOfMonth },
    { enabled: !!establishment?.id }
  );

  // Fetch order details when an order is selected for the sidebar
  const { data: orderDetails } = trpc.orders.get.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const acceptOrder = trpc.scheduling.accept.useMutation({
    onSuccess: () => { toast.success("Pedido aceito antecipadamente!"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelOrder = trpc.scheduling.cancel.useMutation({
    onSuccess: () => { toast.success("Pedido agendado cancelado."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const rescheduleOrder = trpc.scheduling.reschedule.useMutation({
    onSuccess: () => { toast.success("Pedido reagendado com sucesso!"); setRescheduleOrderId(null); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  // Printer settings query
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id && establishment.id > 0 }
  );

  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });

  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    if (!establishment?.id) return;
    updatePrintMethodMutation.mutate({
      establishmentId: establishment.id,
      defaultPrintMethod: method,
    });
  };

  // Verificar se o usuário tem API Key gerada (Mindi Printer conectado)
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;

  const handlePrintOrderDirect = async (orderId: number) => {
    try {
      const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = receiptUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch {
          window.open(receiptUrl, '_blank');
        }
        setTimeout(() => document.body.removeChild(iframe), 60000);
      };
    } catch {
      toast.error("Erro ao imprimir pedido");
    }
  };

  const handlePrintMultiPrinter = async (orderId: number) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) {
      toast.info("Para impressão em múltiplas impressoras, use um dispositivo Android com o app Multi Printer Network Print Service.");
      return;
    }
    try {
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-sectors/${orderId}`);
      const data = await response.json();
      if (data.success && data.deepLink) {
        window.location.href = data.deepLink;
      } else {
        toast.error("Erro ao gerar link de impressão");
      }
    } catch {
      toast.error("Erro ao conectar com o serviço de impressão");
    }
  };

  // Calendar computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonth.getDate() - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d, isCurrentMonth: false, isToday: false,
      });
    }

    const today = new Date().toISOString().split("T")[0];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === today });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d, isCurrentMonth: false, isToday: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const numWeeks = useMemo(() => {
    const totalDays = calendarDays.length;
    if (totalDays <= 35) return 5;
    const sixthRow = calendarDays.slice(35, 42);
    const allNextMonth = sixthRow.every(d => !d.isCurrentMonth);
    return allNextMonth ? 5 : 6;
  }, [calendarDays]);

  const visibleDays = calendarDays.slice(0, numWeeks * 7);

  // Orders grouped by day
  const ordersByDay = useMemo(() => {
    const map: Record<string, { customerName: string; time: string }[]> = {};
    if (!scheduledOrders) return map;
    for (const order of scheduledOrders) {
      if (order.scheduledAt) {
        const dateStr = new Date(order.scheduledAt).toISOString().split("T")[0];
        if (!map[dateStr]) map[dateStr] = [];
        const t = new Date(order.scheduledAt);
        map[dateStr].push({
          customerName: (order as any).customerName || "Pedido",
          time: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
      }
    }
    return map;
  }, [scheduledOrders]);

  const filteredOrders = useMemo(() => {
    if (!scheduledOrders) return [];
    return scheduledOrders
      .filter((order: any) => {
        if (!order.scheduledAt) return false;
        return new Date(order.scheduledAt).toISOString().split("T")[0] === selectedDate;
      })
      .sort((a: any, b: any) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return aTime - bTime;
      });
  }, [scheduledOrders, selectedDate]);

  const stats = useMemo(() => {
    if (!scheduledOrders) return { total: 0, pending: 0, accepted: 0, moved: 0 };
    return {
      total: scheduledOrders.length,
      pending: scheduledOrders.filter((o: any) => o.status === "scheduled" && !o.movedToQueue).length,
      accepted: scheduledOrders.filter((o: any) => o.status === "scheduled" && o.movedToQueue).length,
      moved: scheduledOrders.filter((o: any) => o.status !== "scheduled" && o.status !== "cancelled").length,
    };
  }, [scheduledOrders]);

  const navigateMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const selectedDateObj = useMemo(() => new Date(selectedDate + "T12:00:00"), [selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    const d = selectedDateObj;
    const dayName = DAYS_FULL[d.getDay()];
    const month = MONTHS_PT[d.getMonth()];
    return `${month} ${String(d.getDate()).padStart(2, "0")} ${dayName}`;
  }, [selectedDateObj]);

  const getStatusBadge = (order: any) => {
    if (order.status === "cancelled") {
      return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">Cancelado</span>;
    }
    if (order.status === "scheduled" && order.movedToQueue) {
      return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Aceito</span>;
    }
    if (order.status === "scheduled") {
      return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">Agendado</span>;
    }
    return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">Na fila</span>;
  };

  return (
    <AdminLayout>
      {/* Header — same pattern as Dashboard */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Agendados"
          description="Gerencie os pedidos agendados pelos seus clientes"
          icon={<CalendarClock className="h-6 w-6 text-blue-600" />}
        />
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilterRange(opt.value);
                if (opt.value === "today") goToToday();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                filterRange === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard title="Total Agendados" value={stats.total} icon={CalendarDays} loading={isLoading} variant="blue" />
        <StatCard title="Aguardando" value={stats.pending} icon={Clock} loading={isLoading} variant="amber" />
        <StatCard title="Aceitos" value={stats.accepted} icon={ListChecks} loading={isLoading} variant="emerald" />
        <StatCard title="Na Fila" value={stats.moved} icon={ArrowRightCircle} loading={isLoading} variant="primary" />
      </div>

      {/* Main Content: Calendar + Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* LEFT: Calendar SectionCard */}
        <SectionCard noPadding className="overflow-hidden">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold">
              {MONTHS_PT[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day of Week Header Row */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {DAYS_HEADER.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center text-[11px] font-medium text-muted-foreground/70 py-2.5 tracking-wider",
                  i < 6 && "border-r border-border/30"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div>
            {Array.from({ length: numWeeks }).map((_, weekIdx) => (
              <div
                key={weekIdx}
                className={cn(
                  "grid grid-cols-7",
                  weekIdx < numWeeks - 1 && "border-b border-border/30"
                )}
              >
                {visibleDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                  const dayOrders = ordersByDay[day.date] || [];
                  const isSelected = day.date === selectedDate;

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "relative text-left p-2.5 min-h-[100px] transition-colors duration-150 group",
                        dayIdx < 6 && "border-r border-border/30",
                        !day.isCurrentMonth && "bg-muted/20",
                        day.isCurrentMonth && !isSelected && "hover:bg-muted/40",
                        isSelected && "bg-primary/[0.04]"
                      )}
                    >
                      {/* Day number */}
                      <div className="mb-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px]",
                            !day.isCurrentMonth && "text-muted-foreground/30 font-normal",
                            day.isCurrentMonth && !day.isToday && !isSelected && "text-foreground/80 font-medium",
                            day.isToday && "bg-primary text-primary-foreground font-semibold",
                            isSelected && !day.isToday && "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                          )}
                        >
                          {day.day}
                        </span>
                      </div>

                      {/* Order labels — pill/chip style */}
                      <div className="space-y-1 mt-0.5">
                        {dayOrders.slice(0, 3).map((o, i) => (
                          <div
                            key={i}
                            className="text-[10px] leading-normal font-medium truncate px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          >
                            {o.customerName.length > 12 ? o.customerName.slice(0, 12) + "..." : o.customerName}
                          </div>
                        ))}
                        {dayOrders.length > 3 && (
                          <div className="text-[10px] text-muted-foreground/60 font-medium px-2">
                            +{dayOrders.length - 3} mais
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* RIGHT: Orders Panel SectionCard */}
        <SectionCard
          title={selectedDateFormatted}
          noPadding
          className="h-fit lg:sticky lg:top-4"
        >
          {/* Orders List */}
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {isLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-5 w-40 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="p-4 bg-muted/50 rounded-2xl mb-5">
                  <Calendar className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">Nenhum pedido agendado</p>
                <p className="text-xs text-muted-foreground/50 mt-1 text-center">
                  Selecione um dia com pedidos no calendário
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredOrders.map((order: any) => {
                  const config = getScheduledOrderConfig(order);
                  const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;
                  const scheduledTime = order.scheduledAt ? formatTime(order.scheduledAt) : "--:--";
                  const scheduledDate = order.scheduledAt
                    ? new Date(order.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                    : "--/--";

                  return (
                    <div
                      key={order.id}
                      className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200"
                      style={{ height: '136px' }}
                    >
                      {/* Header colorido — mesmo estilo dos cards de Pedidos */}
                      <div className={cn("px-3 py-2 flex items-center justify-between rounded-t-xl", config.bgColor)} style={{ height: '48px' }}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-full bg-card/90", config.color)}>
                            <config.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-bold text-sm", config.color)}>
                                {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber || order.id}`}
                              </span>
                            </div>
                            <span
                              className={cn("py-0.5 font-bold uppercase tracking-wide", order.deliveryType === "delivery" && "")}
                              style={{ borderRadius: '5px', fontSize: '8px', height: '16px', paddingRight: '5px', paddingLeft: '5px', color: config.badgeText, backgroundColor: config.badgeBg }}
                            >
                              {order.deliveryType === "delivery" ? "Entrega" : order.deliveryType === "dine_in" ? "Consumo" : "Retirada"}
                            </span>
                          </div>
                        </div>
                        <div className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          {scheduledDate} {scheduledTime}
                        </div>
                      </div>

                      {/* Content — mesmo layout dos cards de Pedidos */}
                      <div className="px-3" style={{ height: '83px', paddingTop: '9px', paddingBottom: '9px' }}>
                        {/* Linha compacta: nome + pagamento + valor */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {order.customerName && (
                              <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-[150px]">
                                {order.customerName}
                              </span>
                            )}
                            {order.customerName && (
                              <span className="text-muted-foreground/50">&bull;</span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <PaymentIcon className="h-3.5 w-3.5" />
                              {paymentMethodLabels[order.paymentMethod]?.label}
                            </span>
                          </div>
                          <span className="text-base font-bold text-primary whitespace-nowrap">
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        {/* Actions — mesmo layout dos cards de Pedidos */}
                        <div className="flex gap-1.5 mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                                title="Imprimir"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                              <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handlePrintOrderDirect(order.id)}>
                                <div className="flex items-center">
                                  <Printer className="h-4 w-4 mr-2" />
                                  <span className="text-sm">Impressão Normal</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleFavoritePrintMethod('normal'); }}
                                  className="p-1 hover:bg-accent-foreground/10 rounded"
                                  title="Definir como impressão padrão"
                                >
                                  <Star className={cn("h-4 w-4 transition-colors", printerSettings?.defaultPrintMethod === 'normal' ? "fill-amber-500 text-amber-500" : "text-amber-500")} />
                                </button>
                              </div>
                              {hasMindiPrinterApiKey && (
                              <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => toast.info("Impressão automática ativa", { description: "Os pedidos serão impressos automaticamente via Mindi Printer" })}>
                                <div className="flex items-center">
                                  <Printer className="h-4 w-4 mr-2" />
                                  <span className="text-sm">Impressão Automática</span>
                                  <span className="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.5 rounded">Mindi</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleFavoritePrintMethod('automatic'); }}
                                  className="p-1 hover:bg-accent-foreground/10 rounded"
                                  title="Definir como impressão padrão"
                                >
                                  <Star className={cn("h-4 w-4 transition-colors", printerSettings?.defaultPrintMethod === 'automatic' ? "fill-amber-500 text-amber-500" : "text-amber-500")} />
                                </button>
                              </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 rounded-lg border-border/50 hover:bg-accent text-xs"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            Ver detalhes
                          </Button>
                          {order.status === "scheduled" && !order.movedToQueue && (
                            <Button
                              size="sm"
                              className="flex-1 h-8 rounded-lg text-xs hover:opacity-90"
                              style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                              onClick={() => acceptOrder.mutate({ orderId: order.id })}
                              disabled={acceptOrder.isPending}
                            >
                              {acceptOrder.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Aceitar"
                              )}
                            </Button>
                          )}
                          {order.status === "scheduled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => {
                                setRescheduleOrderId(order.id);
                                if (order.scheduledAt) {
                                  const d = new Date(order.scheduledAt);
                                  setRescheduleDate(d.toISOString().split("T")[0]);
                                  setRescheduleTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                                }
                              }}
                              title="Reagendar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {order.status !== "completed" && order.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja cancelar este pedido agendado?")) {
                                  cancelOrder.mutate({ orderId: order.id, reason: "Cancelado pelo restaurante" });
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ========== ORDER DETAILS SIDEBAR (same style as Pedidos page) ========== */}
      <Sheet open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
          </div>

          {orderDetails ? (
            <div className="overflow-y-auto flex-1">
              {/* Order ID and Status */}
              <div className="px-6 py-4 bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pedido {orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(orderDetails.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={orderDetails.status === "cancelled" ? "error" : orderDetails.status === "scheduled" ? "warning" : orderDetails.status === "new" ? "info" : "default"}>
                    {getScheduledOrderConfig(orderDetails).label}                  </StatusBadge>
                </div>
              </div>

              {/* Scheduling Info — highlighted section */}
              {(orderDetails as any).isScheduled && (orderDetails as any).scheduledAt && (
                <div className="px-6 py-4">
                  <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-blue-600" />
                      Agendamento
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Data Agendada:</span>
                        <span className="font-medium">
                          {new Date((orderDetails as any).scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Horário:</span>
                        <span className="font-medium">
                          {new Date((orderDetails as any).scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {(orderDetails as any).movedToQueue !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Movido para fila:</span>
                          <span className="font-medium">
                            {(orderDetails as any).movedToQueue ? "Sim" : "Não"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="px-6 py-4">
                <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-3">Cliente</h4>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {orderDetails.customerName?.charAt(0) || "C"}
                      </span>
                      <span className="font-medium truncate">{orderDetails.customerName || "Cliente"}</span>
                    </div>
                    {orderDetails.customerPhone && (
                      <span className="text-muted-foreground shrink-0">{orderDetails.customerPhone}</span>
                    )}
                  </div>
                  {orderDetails.customerPhone && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                        <Phone className="h-3.5 w-3.5" />
                        Ligar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        onClick={() => {
                          let phone = orderDetails.customerPhone?.replace(/\D/g, '');
                          if (phone && !phone.startsWith('55')) {
                            phone = '55' + phone;
                          }
                          const orderNumber = orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`;
                          const itemsText = orderDetails.items?.map((item: any) => {
                            let itemLine = `${item.quantity}x ${item.productName}`;
                            if (item.complements && item.complements.length > 0) {
                              const compText = item.complements.map((c: any) => `  ↳ ${c.name}`).join('\n');
                              itemLine += '\n' + compText;
                            }
                            return itemLine;
                          }).join('\n') || '';
                          const totalFormatted = `R$ ${Number(orderDetails.total).toFixed(2).replace('.', ',')}`;
                          const message = `Olá ${orderDetails.customerName || ''}! Sobre seu pedido ${orderNumber}:\n\n*Itens:*\n${itemsText}\n\n*Total:* ${totalFormatted}`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-4">
                <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Itens do Pedido</h4>
                  <div className="space-y-3">
                    {orderDetails.items?.map((item: any, index: number) => (
                      <div key={index} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{item.productName}</span>
                          <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        {/* Complements */}
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {item.complements.map((complement: any, compIndex: number) => {
                              const qty = complement.quantity || 1;
                              const totalPrice = Number(complement.price || 0) * qty;
                              return (
                                <div key={compIndex} className="flex justify-between text-xs text-muted-foreground">
                                  <span className="text-foreground/70">+ {qty > 1 ? `${qty}x ` : ''}{complement.name}</span>
                                  {totalPrice > 0 && (
                                    <span className="text-foreground/70">+ {formatCurrency(totalPrice)}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {(item.notes || Number(item.unitPrice) > 0) && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{item.notes || ""}</span>
                            {Number(item.unitPrice) > 0 && (
                              <span>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Price Details */}
                  <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
                    <h5 className="font-medium text-sm mb-2">Detalhes do Preço</h5>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                    </div>
                    {Number(orderDetails.deliveryFee) > 0 && orderDetails.deliveryType !== 'dine_in' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Entrega:</span>
                        <span className="font-medium">{formatCurrency(orderDetails.deliveryFee)}</span>
                      </div>
                    )}
                    {orderDetails.couponCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cupom Aplicado:</span>
                        <span className="font-medium text-emerald-600">{orderDetails.couponCode}</span>
                      </div>
                    )}
                    {Number(orderDetails.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="font-medium text-red-500">-{formatCurrency(orderDetails.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="font-bold text-primary">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(orderDetails.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery & Payment Info */}
              <div className="px-6 py-4">
                <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-3">{orderDetails.deliveryType === 'dine_in' ? 'Consumo e Pagamento' : 'Entrega e Pagamento'}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{orderDetails.deliveryType === "delivery" ? "Entrega" : orderDetails.deliveryType === "dine_in" ? "Consumo no local" : "Retirada"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">{paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</span>
                    </div>
                    {orderDetails.paymentMethod === 'cash' && (orderDetails as any).changeAmount && Number((orderDetails as any).changeAmount) > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Troco para:</span>
                          <span className="font-medium">{formatCurrency((orderDetails as any).changeAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Troco a devolver:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(Number((orderDetails as any).changeAmount) - Number(orderDetails.total))}</span>
                        </div>
                      </>
                    )}
                    {orderDetails.customerAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium text-right max-w-[180px]">{orderDetails.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Progress Timeline */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between px-4">
                  {/* Confirmed */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      orderDetails.status !== "cancelled" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-muted-foreground">Confirmado</span>
                  </div>
                  <div className="flex-1 h-px bg-border/50 mx-2" />
                  {/* Preparing */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      ["preparing", "ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}>
                      <ChefHat className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-muted-foreground">Preparo</span>
                  </div>
                  <div className="flex-1 h-px bg-border/50 mx-2" />
                  {/* Ready */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      ["ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}>
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-muted-foreground">Pronto</span>
                  </div>
                  <div className="flex-1 h-px bg-border/50 mx-2" />
                  {/* Completed */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      orderDetails.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-muted-foreground">Concluído</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div className="px-6 py-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-2">Observações</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{orderDetails.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOrderId !== null} onOpenChange={(open) => !open && setRescheduleOrderId(null)}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Reagendar Pedido</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Reagendar Pedido</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Defina a nova data e horário para este pedido agendado.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nova Data</label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Novo Horário</label>
                <Input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => {
                if (!rescheduleDate || !rescheduleTime || !rescheduleOrderId) return;
                const newScheduledAt = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
                rescheduleOrder.mutate({
                  orderId: rescheduleOrderId,
                  scheduledAt: newScheduledAt.toISOString(),
                });
              }}
              disabled={rescheduleOrder.isPending}
            >
              {rescheduleOrder.isPending ? "Reagendando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
