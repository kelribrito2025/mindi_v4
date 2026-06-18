import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/shared";
import { WeeklyRevenueCard } from "@/components/WeeklyRevenueCard";
import { DateRangePickerSales } from "@/components/DateRangePickerSales";
import { HeatmapCard } from "@/components/HeatmapCard";
import CardPerformanceSemanalV2 from "@/components/CardPerformanceSemanalV2";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  TrendingDown, 
  Users,
  Clock,
  Package,
  Trophy,
  Truck,
  Timer,
  UsersRound,
  Info,
  BarChart3,
  ArrowRight,
  CalendarDays
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState, useCallback, useMemo, useRef, type ComponentType } from "react";
import { useLocation } from "wouter";
import { Calendar, LayoutDashboard } from "lucide-react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { ChangelogDashboardButton } from "@/components/ChangelogSidebar";
import { Lock, Eye } from "lucide-react";

const MONTHS_SHORT_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatLocalYmd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMondayBasedDayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function getRollingSevenDayRange(referenceDate = new Date()) {
  const yesterday = new Date(referenceDate);
  yesterday.setHours(12, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  // Semana fechada: sempre de segunda a domingo, usando o domingo mais recente
  // que já terminou. Na abertura automática de segunda-feira, esse domingo é ontem.
  const end = new Date(yesterday);
  end.setDate(yesterday.getDate() - yesterday.getDay());

  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });

  return {
    startDate: formatLocalYmd(start),
    endDate: formatLocalYmd(end),
    dates,
  };
}

function formatRollingDayLabel(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}/${MONTHS_SHORT_PT[date.getMonth()]}`;
}

function formatRollingPeriodLabel(start: Date, end: Date) {
  return `${formatRollingDayLabel(start)} – ${formatRollingDayLabel(end)} ${end.getFullYear()}`;
}

type LockedPremiumCardProps = {
  title: string;
  description: string;
  unlockDescription?: string;
  icon: ComponentType<{ className?: string }>;
  minHeightClass?: string;
  className?: string;
  onPlanClick: () => void;
  hideCenterLockIcon?: boolean;
};

function LockedPremiumCard({
  title,
  description,
  unlockDescription = "Acesse este recurso ao desbloquear",
  icon: Icon,
  minHeightClass = "min-h-[180px]",
  className = "",
  onPlanClick,
  hideCenterLockIcon = false,
}: LockedPremiumCardProps) {
  return (
    <div className={`rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-6 relative overflow-hidden flex flex-col ${minHeightClass} ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-600 dark:text-gray-300">{title}</h4>
          <p className="text-sm text-gray-400 dark:text-gray-500">{description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-1 min-h-0 flex-col items-center justify-center text-center">
        {!hideCenterLockIcon && (
          <Lock className="w-6 h-6 text-gray-300 dark:text-gray-600 mb-1" />
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Desbloqueie este recurso</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{unlockDescription}</p>
        <button
          type="button"
          onClick={onPlanClick}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
        >
          Ver planos →
        </button>
      </div>
    </div>
  );
}



export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const isLitePlan = establishment?.planType === 'lite' || establishment?.planType === 'trial' || establishment?.planType === 'free';
  const isFreePlan = establishment?.planType === 'trial' || establishment?.planType === 'free';
  const isStarterPlan = establishment?.planType === 'lite';
  const shouldBlockWeeklyPerformanceModal = isFreePlan || isStarterPlan;
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  // Date range state for the filter button
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

  // Always use 'custom' period with explicit dates
  const period = 'custom' as const;
  const [weeklyPeriod, setWeeklyPeriod] = useState<7 | 14 | 30>(7);

  // ── Performance Semanal V2 — exibir no primeiro login de segunda-feira ──
  const [showWeeklyPerformance, setShowWeeklyPerformance] = useState(false);

  // Flag para saber se deve mostrar o card (sem setar localStorage ainda)
  const [shouldShowWeekly, setShouldShowWeekly] = useState(false);

  useEffect(() => {
    if (establishmentLoading) return;

    if (!establishment || shouldBlockWeeklyPerformanceModal) {
      setShouldShowWeekly(false);
      setShowWeeklyPerformance(false);
      return;
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dom, 1=Seg
    if (dayOfWeek === 1) { // Segunda-feira
      const key = `weeklyPerformanceSeen_${formatLocalYmd(now)}`;
      if (!localStorage.getItem(key)) {
        setShouldShowWeekly(true);
      }
    }
  }, [establishment, establishmentLoading, shouldBlockWeeklyPerformanceModal]);



  const [, setTick] = useState(0);

  // Contador em tempo real - atualiza a cada 60s para refresh do tempo de espera
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Memoize the period input to avoid infinite re-renders
  const statsInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
    startDate: customStart,
    endDate: customEnd,
  }), [establishmentId, period, customStart, customEnd]);

  // All hooks MUST be called before any early return
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    statsInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const weeklyInput = useMemo(() => ({
    establishmentId: establishmentId!,
    days: weeklyPeriod,
  }), [establishmentId, weeklyPeriod]);

  const { data: weeklyStats, isLoading: weeklyLoading } = trpc.dashboard.weeklyStats.useQuery(
    weeklyInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchRecentOrders } = trpc.dashboard.recentOrders.useQuery(
    { establishmentId: establishmentId!, limit: 7 },
    { enabled: !!establishmentId, staleTime: 30000 }
  );


  // Novas queries: Top Produtos, Modalidade, Tempo Médio
  const topProductsInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
    startDate: customStart,
    endDate: customEnd,
  }), [establishmentId, period, customStart, customEnd]);

  const { data: topProducts, isLoading: topProductsLoading } = trpc.dashboard.topProducts.useQuery(
    topProductsInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const modalityInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
    startDate: customStart,
    endDate: customEnd,
  }), [establishmentId, period, customStart, customEnd]);

  const { data: ordersByModality, isLoading: modalityLoading } = trpc.dashboard.ordersByDeliveryType.useQuery(
    modalityInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const prepTimeInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
    startDate: customStart,
    endDate: customEnd,
  }), [establishmentId, period, customStart, customEnd]);

  const { data: avgPrepTime, isLoading: prepTimeLoading } = trpc.dashboard.avgPrepTime.useQuery(
    prepTimeInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const { data: prepTimeTrend } = trpc.dashboard.avgPrepTimeTrend.useQuery(
    prepTimeInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const { data: customerInsights, isLoading: customerInsightsLoading } = trpc.dashboard.customerInsights.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const revenueByHourInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
    startDate: customStart,
    endDate: customEnd,
  }), [establishmentId, period, customStart, customEnd]);

  const { data: revenueByHour, isLoading: revenueByHourLoading } = trpc.dashboard.revenueByHour.useQuery(
    revenueByHourInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  // Card Acumulado: usar custom period com as datas selecionadas
  const revenueInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
    startDate: customStart,
    endDate: customEnd,
  }), [establishmentId, period, customStart, customEnd]);

  const { data: weeklyRevenue, isLoading: weeklyRevenueLoading } = trpc.dashboard.weeklyRevenue.useQuery(
    revenueInput,
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  // Query de meta semanal para o card Performance Semanal V2
  const { data: weeklyGoalData } = trpc.finance.getWeeklyGoal.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  const { data: businessHoursData } = trpc.establishment.getBusinessHours.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  // Query separada para o modal Performance Semanal V2: última semana fechada (segunda a domingo), sem incluir o dia atual.
  const weeklyPerformanceRange = useMemo(() => getRollingSevenDayRange(), []);

  const weeklyCardInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period: 'custom' as const,
    startDate: weeklyPerformanceRange.startDate,
    endDate: weeklyPerformanceRange.endDate,
  }), [establishmentId, weeklyPerformanceRange.startDate, weeklyPerformanceRange.endDate]);

  const { data: weeklyCardRevenue } = trpc.dashboard.weeklyRevenue.useQuery(
    weeklyCardInput,
    { enabled: !!establishmentId && !shouldBlockWeeklyPerformanceModal, staleTime: 30000 }
  );

  // Dados da semana anterior para o card Performance Semanal V2
  const lastWeekInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period: 'week' as const,
  }), [establishmentId]);

  const { data: lastWeekStats } = trpc.dashboard.stats.useQuery(
    lastWeekInput,
    { enabled: !!establishmentId && showWeeklyPerformance && !shouldBlockWeeklyPerformanceModal }
  );

  // Handlers para SSE - atualizar dados quando novo pedido chegar
  const handleNewOrder = useCallback(() => {
    refetchRecentOrders();
  }, [refetchRecentOrders]);

  const handleOrderUpdate = useCallback(() => {
    refetchRecentOrders();
  }, [refetchRecentOrders]);

  // Hook SSE para receber pedidos em tempo real
  useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    enabled: !!establishmentId && establishmentId > 0,
  });

  // Nota: Removido bloqueio para usuários sem estabelecimento - agora o Dashboard mostra normalmente

  // Format currency
  // Detectar tela compacta para remover centavos dos KPI cards
  const [isCompactScreen, setIsCompactScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsCompactScreen(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const formatCurrency = (value: number) => {
    if (isCompactScreen) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(value));
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format chart data - período atual com dados do período anterior alinhados por índice
  const currentData = weeklyStats?.current ?? [];
  const previousData = weeklyStats?.previous ?? [];
  const chartData = useMemo(() => currentData.map((item, idx) => ({
    date: new Date(item.date).toLocaleDateString("pt-BR", { weekday: weeklyPeriod <= 7 ? "long" : "short", day: weeklyPeriod > 7 ? "numeric" : undefined, month: weeklyPeriod > 7 ? "short" : undefined }),
    pedidos: Number(item.orders),
    faturamento: Number(item.revenue),
    prevPedidos: idx < previousData.length ? Number(previousData[idx].orders) : undefined,
  })), [currentData, previousData, weeklyPeriod]);

  // Dados do período anterior para comparação de KPIs
  const prevTotalPedidos = useMemo(() => previousData.reduce((sum, d) => sum + Number(d.orders), 0), [previousData]);

  // ── Dados computados para o Card Performance Semanal V2 ──
  // Usa weeklyCardRevenue com janela móvel de 7 dias, independente do filtro do Dashboard.
    const weeklyPerformanceData = useMemo(() => {
      if (!weeklyCardRevenue) return null;
    const thisWeekData = weeklyCardRevenue.thisWeek || [];
    // O backend retorna arrays por dia da semana (Seg=0..Dom=6). O modal, porém,
    // deve exibir a janela móvel dos últimos 7 dias em ordem cronológica.
    const thisWeekOrdersData = weeklyCardRevenue.thisWeekOrders || [];
    const hasBusinessHoursConfig = Array.isArray(businessHoursData) && businessHoursData.length > 0;
    const diasSemana = weeklyPerformanceRange.dates.map((date) => {
      const weekdayIndex = getMondayBasedDayIndex(date);
      const calendarDayIndex = date.getDay();
      const businessHour = hasBusinessHoursConfig
        ? businessHoursData.find((hour) => hour.dayOfWeek === calendarDayIndex)
        : null;
      const isScheduledClosed = hasBusinessHoursConfig
        ? !businessHour || !businessHour.isActive || !businessHour.openTime || !businessHour.closeTime
        : false;
      const valor = Number(thisWeekData[weekdayIndex] || 0);
      const pedidos = Number(thisWeekOrdersData[weekdayIndex] || 0);

      return {
        dia: formatRollingDayLabel(date),
        valor,
        pedidos,
        fechado: isScheduledClosed && valor === 0 && pedidos === 0,
      };
    });
    const totalFaturamento = diasSemana.reduce((s, d) => s + d.valor, 0);
    const totalPedidos = diasSemana.reduce((s, d) => s + d.pedidos, 0);
    const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
    const melhorDiaObj = diasSemana.reduce((best, d) => d.valor > best.valor ? d : best, diasSemana[0] || { dia: '-', valor: 0 });
    
    // Variações vs semana anterior
    const lastWeekTotal = weeklyCardRevenue.lastWeekTotal || 0;
    const lastWeekTotalPedidos = weeklyCardRevenue.lastWeekTotalOrders || 0;
    const lastWeekTicket = lastWeekTotalPedidos > 0 ? lastWeekTotal / lastWeekTotalPedidos : 0;
    
    const varFaturamento = lastWeekTotal > 0 ? ((totalFaturamento - lastWeekTotal) / lastWeekTotal * 100) : 0;
    const varPedidos = lastWeekTotalPedidos > 0 ? ((totalPedidos - lastWeekTotalPedidos) / lastWeekTotalPedidos * 100) : 0;
    const varTicket = lastWeekTicket > 0 ? ((ticketMedio - lastWeekTicket) / lastWeekTicket * 100) : 0;
    
    // Meta semanal
    const metaValueRaw = weeklyGoalData?.targetRevenue ? Number(weeklyGoalData.targetRevenue) : null;
    const metaValue = metaValueRaw && metaValueRaw > 0 ? metaValueRaw : null;
    const metaAtingida = metaValue ? (totalFaturamento / metaValue * 100) : 0;
    
    // Período label: semana fechada, de segunda a domingo.
    const periodo = formatRollingPeriodLabel(weeklyPerformanceRange.dates[0], weeklyPerformanceRange.dates[6]);
    
    return {
      periodo,
      faturamento: totalFaturamento,
      pedidos: totalPedidos,
      ticketMedio,
      meta: metaValue,
      metaAtingida,
      varFaturamento: Math.abs(Number(varFaturamento.toFixed(1))),
      varPedidos: Math.abs(Number(varPedidos.toFixed(1))),
      varTicket: Math.abs(Number(varTicket.toFixed(1))),
      melhorDia: melhorDiaObj.dia,
      melhorDiaValor: melhorDiaObj.valor,
      diasSemana,
    };
  }, [weeklyCardRevenue, weeklyGoalData, weeklyPerformanceRange, businessHoursData]);

  // Abrir o Dialog quando shouldShowWeekly, establishmentId e dados estiverem prontos
  // Proteção: não exibir para planos Grátis/Starter e para contas novas sem dados
  useEffect(() => {
    if (shouldBlockWeeklyPerformanceModal) {
      setShouldShowWeekly(false);
      setShowWeeklyPerformance(false);
      return;
    }

    if (shouldShowWeekly && establishmentId && weeklyPerformanceData) {
      // Só exibir se houver pelo menos 1 pedido na semana atual ou na semana anterior
      const hasCurrentWeekData = weeklyPerformanceData.pedidos > 0 || weeklyPerformanceData.faturamento > 0;
      const hasLastWeekData = (weeklyCardRevenue?.lastWeekTotalOrders || 0) > 0 || (weeklyCardRevenue?.lastWeekTotal || 0) > 0;
      
      if (!hasCurrentWeekData && !hasLastWeekData) {
        // Conta nova sem dados — não exibir o card
        setShouldShowWeekly(false);
        return;
      }
      
      // Pequeno delay para garantir que a UI está pronta
      const timer = setTimeout(() => {
        setShowWeeklyPerformance(true);
        const now = new Date();
        const key = `weeklyPerformanceSeen_${formatLocalYmd(now)}`;
        localStorage.setItem(key, 'true');
        setShouldShowWeekly(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowWeekly, establishmentId, weeklyPerformanceData, weeklyCardRevenue, shouldBlockWeeklyPerformanceModal]);

  // Order status mapping
  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "default" }> = {
    new: { label: "Novo", variant: "info" },
    preparing: { label: "Preparando", variant: "warning" },
    ready: { label: "Pronto", variant: "success" },
    completed: { label: "Finalizado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "error" },
  };

  return (
    <AdminLayout>
      
      {/* Dialog Performance Semanal V2 - exibido no primeiro login de segunda-feira */}
      <Dialog open={showWeeklyPerformance && !shouldBlockWeeklyPerformanceModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[554px] p-0 overflow-hidden border-0 [&>button]:hidden" style={{ borderRadius: '16px' }} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">Performance Semanal</DialogTitle>
          {weeklyPerformanceData ? (
            <CardPerformanceSemanalV2
              {...weeklyPerformanceData}
              isProPlan={establishment?.planType === 'pro'}
              onDefineGoal={() => {
                if (establishment?.planType === 'pro') {
                  setShowWeeklyPerformance(false);
                  navigate('/financas?openGoalModal=monthly');
                }
              }}
              onUpgradePlan={() => navigate('/planos')}
              onClose={() => setShowWeeklyPerformance(false)}
            />
          ) : (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">A carregar performance semanal...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="p-4 sm:p-6">

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Dashboard" 
          description={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          icon={<LayoutDashboard className="h-6 w-6 text-blue-600" />}
        />
        <div className="flex items-center gap-3">
          <ChangelogDashboardButton />
          <div className="bg-muted rounded-xl p-1">
            <DateRangePickerSales
              startDate={customStart}
              endDate={customEnd}
              onApply={(start, end) => {
                setCustomStart(start);
                setCustomEnd(end);
              }}
              triggerClassName="flex items-center gap-2 rounded-lg cursor-pointer transition-colors px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
              triggerLabel="Filtro"
              triggerIcon="sliders"
            />
          </div>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={'Pedidos do Período'}
          value={stats?.ordersCount ?? 0}
          icon={ShoppingBag}
          loading={statsLoading}
          variant="blue"
          trend={stats && stats.ordersChange !== undefined ? {
            value: stats.ordersChange,
            isPositive: stats.ordersChange >= 0,
            label: 'vs período anterior'
          } : undefined}
        />
        <StatCard
          title={'Faturamento do Período'}
          value={formatCurrency(stats?.revenue ?? 0)}
          icon={DollarSign}
          loading={statsLoading}
          variant="emerald"
          trend={stats && stats.revenueChange !== undefined ? {
            value: stats.revenueChange,
            isPositive: stats.revenueChange >= 0,
            label: 'vs período anterior'
          } : undefined}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.avgTicket ?? 0)}
          icon={TrendingUp}
          loading={statsLoading}
          variant="blue"
          trend={stats && stats.avgTicketChange !== undefined ? {
            value: stats.avgTicketChange,
            isPositive: stats.avgTicketChange >= 0,
            label: 'vs período anterior'
          } : undefined}
        />
        <StatCard
          title="C. Fidelizados"
          value={stats?.recurringCustomers ?? 0}
          tooltip={`${stats?.recurringPercentage ?? 0}% da base ativa (2+ pedidos nos últimos 30 dias)`}
          icon={Users}
          loading={statsLoading}
          variant="primary"
          trend={stats && stats.recurringChange !== undefined ? {
            value: stats.recurringChange,
            isPositive: stats.recurringChange >= 0,
            label: 'vs mês anterior'
          } : undefined}
        />
      </div>

      {/* Weekly Revenue Card + Mapa de Calor */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
        <div className="xl:col-span-3">
          <WeeklyRevenueCard
            thisWeek={weeklyRevenue?.thisWeek ?? []}
            lastWeek={weeklyRevenue?.lastWeek ?? []}
            thisWeekTotal={weeklyRevenue?.thisWeekTotal ?? 0}
            lastWeekTotal={weeklyRevenue?.lastWeekTotal ?? 0}
            loading={weeklyRevenueLoading}
            periodLabel={weeklyRevenue?.periodLabel}
            comparisonLabel={weeklyRevenue?.comparisonLabel}
            mode={weeklyRevenue?.mode as 'daily' | 'monthly' | undefined}
            currentIndex={weeklyRevenue?.currentIndex}
            monthLabels={weeklyRevenue?.monthLabels}
          />
        </div>
        <div className="xl:col-span-2">
          {isFreePlan ? (
            <LockedPremiumCard
              title="Acessos ao Cardápio"
              description="Dias e horários com mais acessos ao seu cardápio"
              unlockDescription="Veja quando seus clientes mais acessam"
              icon={Eye}
              minHeightClass="min-h-[280px] h-full"
              onPlanClick={() => navigate('/planos')}
            />
          ) : (
            <HeatmapCard period={'week'} />
          )}
        </div>
      </div>

      {/* Top Produtos + Modalidade + Tempo Médio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Produtos */}
        <HoverCard openDelay={300} closeDelay={200}>
        <div className="bg-card rounded-xl border border-border/50 pt-5 px-5 pb-5 flex flex-col cursor-default transition-colors hover:border-amber-200 dark:hover:border-amber-800/50">
          {/* Header com ícone - mesmo estilo Formas de Pagamento */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Top 10 | Mais vendidos</h3>
                <p className="text-xs text-muted-foreground">Produtos mais vendidos no período</p>
              </div>
            </div>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label="Ver informações de Top 10 | Mais vendidos"
                className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverCardTrigger>
          </div>

          {topProductsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                  <div className="skeleton h-3 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : topProducts && topProducts.products && topProducts.products.length > 0 ? (
            <>
            <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '365px', scrollbarGutter: 'stable', paddingBottom: '4px' }}>
              {(() => {
                const products = topProducts.products;
                const maxQty = products[0]?.totalQuantity || 1;
                const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
                // Degradê de ranking: verde (mais vendido) → amarelo → laranja → vermelho (menos vendido)
                const getRankColor = (idx: number, total: number) => {
                  if (total <= 1) return '#22c55e'; // verde
                  const t = idx / (total - 1); // 0 = primeiro, 1 = último
                  // Interpolação: verde → amarelo-verde → amarelo → laranja → vermelho
                  const colors = [
                    { r: 34, g: 197, b: 94 },   // verde (#22c55e)
                    { r: 234, g: 179, b: 8 },    // amarelo (#eab308)
                    { r: 249, g: 115, b: 22 },   // laranja (#f97316)
                    { r: 239, g: 68, b: 68 },    // vermelho (#ef4444)
                  ];
                  const segment = t * (colors.length - 1);
                  const i = Math.min(Math.floor(segment), colors.length - 2);
                  const f = segment - i;
                  const c1 = colors[i], c2 = colors[i + 1];
                  const r = Math.round(c1.r + (c2.r - c1.r) * f);
                  const g = Math.round(c1.g + (c2.g - c1.g) * f);
                  const b = Math.round(c1.b + (c2.b - c1.b) * f);
                  return `rgb(${r},${g},${b})`;
                };
                return products.slice(0, 10).map((product, index) => {
                  const pct = (product.totalQuantity / maxQty) * 100;
                  const revPct = totalRevenue > 0 ? Math.round((product.totalRevenue / totalRevenue) * 100) : 0;
                  const barColorStyle = getRankColor(index, Math.min(products.length, 10));
                  return (
                    <div key={product.productName} className="group relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{product.productName}</span>
                          <span className="text-xs text-muted-foreground">({product.totalQuantity}x)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(product.totalRevenue)}</span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{revPct}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="h-full rounded-full transition-colors duration-500"
                          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: barColorStyle }}
                        />
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-colors duration-200 pointer-events-none">
                        <div className="bg-foreground text-background rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                          <div className="font-semibold mb-1">{product.productName}</div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span>Receita:</span>
                            <span className="font-semibold">{formatCurrency(product.totalRevenue)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span>Quantidade:</span>
                            <span className="font-semibold">{product.totalQuantity}x</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Percentual:</span>
                            <span className="font-semibold">{revPct}%</span>
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            {/* Insight: % do faturamento dos top 10 */}
            <div className="mt-auto">
            {topProducts.totalPeriodRevenue > 0 ? (
              <p className="text-[11px] px-0 py-3 flex items-center gap-1"><Info className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" /><span className="text-shimmer">Seus {topProducts.products.length} produtos líderes representam {topProducts.topProductsPct}% do faturamento do período</span></p>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 px-0 py-3">Não há métricas suficientes para o cálculo</p>
            )}
            </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center py-8">
              <Trophy className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
              <p className="text-xs text-muted-foreground/70">Nenhum produto vendido no período</p>
            </div>
          )}
        </div>
        <HoverCardContent side="bottom" align="start" className="w-80 p-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-semibold text-sm">Resumo dos Mais Vendidos</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1.5">
              <p>No período selecionado:</p>
              {topProducts?.products && topProducts.products.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Líder: <strong className="text-foreground">{topProducts.products[0]?.productName}</strong> ({topProducts.products[0]?.totalQuantity}x)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Total de produtos listados: <strong className="text-foreground">{topProducts.products.length}</strong></span>
                  </div>
                </>
              ) : (
                <p>Nenhum produto vendido no período.</p>
              )}
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-100 dark:border-amber-800/30">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {topProducts?.topProductsPct && topProducts.topProductsPct >= 80
                  ? '\uD83D\uDCA1 Alta concentração! Poucos produtos dominam o faturamento.'
                  : topProducts?.topProductsPct && topProducts.topProductsPct >= 50
                  ? '\uD83D\uDCA1 Distribuição saudável entre os produtos mais vendidos.'
                  : '\uD83D\uDCA1 Faturamento bem distribuído entre diversos produtos.'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/70">Top produtos representam: <strong className="text-foreground">{topProducts?.topProductsPct ?? 0}%</strong> do faturamento</p>
          </div>
        </HoverCardContent>
        </HoverCard>

        {/* Coluna do meio: Pedidos por Modalidade + Clientes */}
        <div className="flex flex-col gap-6">
          {/* Pedidos por Modalidade */}
          <HoverCard openDelay={300} closeDelay={200}>
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[196px] overflow-hidden cursor-default transition-colors hover:border-violet-200 dark:hover:border-violet-800/50">
            {/* Header igual ao WeeklyRevenueCard */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Pedidos por Modalidade</h3>
                  <p className="text-xs text-muted-foreground">Distribuição por tipo de entrega</p>
                </div>
              </div>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label="Ver informações de Pedidos por Modalidade"
                  className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
            </div>

            {modalityLoading ? (
              <div className="flex flex-col gap-6 py-2 flex-1">
                {[1,2,3].map(i => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="skeleton h-4 w-20 rounded" />
                    <div className="skeleton h-8 w-16 rounded" />
                    <div className="skeleton h-3 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : ordersByModality && ordersByModality.length > 0 ? (() => {
              const total = ordersByModality.reduce((sum, m) => sum + m.count, 0);
              const barColors = ['#8b5cf6', '#3b82f6', '#10b981'];
              const labelMap: Record<string, string> = { 'Entrega': 'Delivery', 'Consumo no local': 'Consumo' };
              const getLabel = (label: string) => labelMap[label] || label;
              return (
                <div className="flex flex-col">
                  {/* Labels + percentuais em grid - linhas pontilhadas alinhadas com barras */}
                  <div className="flex w-full gap-1.5 mt-2">
                    {ordersByModality.map((item, i) => {
                      const pct = total > 0 ? (item.count / total) * 100 : 0;
                      const roundedPct = Math.round(pct);
                      return (
                        <div
                          key={item.deliveryType}
                          className="flex flex-col gap-1"
                          style={{ width: `${pct}%`, minWidth: pct > 0 ? '60px' : '0', borderLeft: '2px dotted #d1d5db', paddingLeft: '10px' }}
                        >
                          <span className="text-xs text-muted-foreground font-medium">{getLabel(item.label)}</span>
                          <span className="text-3xl font-bold tracking-tight text-foreground">{roundedPct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Barras individuais lado a lado */}
                  <div className="flex gap-1.5 w-full mt-4">
                    {ordersByModality.map((item, i) => {
                      const pct = total > 0 ? (item.count / total) * 100 : 0;
                      return (
                        <div
                          key={item.deliveryType}
                          className="h-3.5 rounded-full transition-colors duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: barColors[i % barColors.length],
                            minWidth: pct > 0 ? '12px' : '0',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
                <Truck className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
                <p className="text-xs text-muted-foreground/70">Nenhum pedido no período</p>
              </div>
            )}
          </div>
          <HoverCardContent side="bottom" align="center" className="w-80 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                  <Truck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="font-semibold text-sm">Resumo por Modalidade</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>No período selecionado:</p>
                {ordersByModality && ordersByModality.length > 0 ? (
                  <>
                    {ordersByModality.map((item, i) => {
                      const total = ordersByModality.reduce((sum, m) => sum + m.count, 0);
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500'];
                      return (
                        <div key={item.deliveryType} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                          <span><strong className="text-foreground">{pct}%</strong> {item.label} ({item.count} pedidos)</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p>Nenhum pedido no período.</p>
                )}
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-2.5 border border-violet-100 dark:border-violet-800/30">
                <p className="text-xs text-violet-800 dark:text-violet-300">
                  {(() => {
                    if (!ordersByModality || ordersByModality.length === 0) return '\uD83D\uDCA1 Sem dados para análise.';
                    const total = ordersByModality.reduce((sum, m) => sum + m.count, 0);
                    const dominant = ordersByModality.reduce((a, b) => a.count > b.count ? a : b);
                    const pct = total > 0 ? Math.round((dominant.count / total) * 100) : 0;
                    return pct >= 70
                      ? `\uD83D\uDCA1 ${dominant.label} domina com ${pct}% dos pedidos.`
                      : '\uD83D\uDCA1 Distribuição equilibrada entre as modalidades.';
                  })()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">Total: <strong className="text-foreground">{ordersByModality?.reduce((sum, m) => sum + m.count, 0) ?? 0}</strong> pedidos no período</p>
            </div>
          </HoverCardContent>
          </HoverCard>

          {/* Clientes Recorrentes vs Novos */}
          {isLitePlan ? (
          <LockedPremiumCard
            title="Perfil de Clientes"
            description="Últimos 30 dias"
            unlockDescription="Entenda clientes novos e recorrentes"
            icon={UsersRound}
            minHeightClass="min-h-[306px] h-[306px]"
            onPlanClick={() => navigate('/planos')}
          />
          ) : (
          <>
          {/* Clientes Recorrentes vs Novos */}
          <HoverCard openDelay={300} closeDelay={200}>
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[306px] overflow-hidden cursor-default transition-colors hover:border-emerald-200 dark:hover:border-emerald-800/50">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <UsersRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Perfil de Clientes</h3>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </div>
              </div>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label="Ver informações de Perfil de Clientes"
                  className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
            </div>

            {customerInsightsLoading ? (
              <div className="flex gap-8 py-2">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="skeleton h-10 w-20 rounded" />
                  <div className="skeleton h-4 w-28 rounded" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="skeleton h-10 w-20 rounded" />
                  <div className="skeleton h-4 w-28 rounded" />
                </div>
              </div>
            ) : (() => {
              const recurringPct = customerInsights?.recurringPct ?? 0;
              const newPct = customerInsights?.newPct ?? 0;
              const totalBars = 40;
              const recurringBars = Math.round((recurringPct / 100) * totalBars);
              const newBars = totalBars - recurringBars;
              return (
                <div className="flex flex-col flex-1">
                  {/* Percentuais lado a lado */}
                  <div className="flex items-start gap-6 mt-1">
                    <div className="flex-1">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{recurringPct}%</span>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Clientes Recorrentes</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">2+ pedidos nos últimos 30 dias</p>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{newPct}%</span>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Clientes Novos</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">Primeiro pedido no período</p>
                    </div>
                  </div>
                  {/* Gráfico de barras verticais finas */}
                  <div className="flex items-end gap-[2px] mt-4 h-10">
                    {Array.from({ length: recurringBars }).map((_, i) => (
                      <div
                        key={`r-${i}`}
                        className="flex-1 rounded-sm transition-colors duration-500"
                        style={{ backgroundColor: '#22c55e', height: '100%' }}
                      />
                    ))}
                    {/* Linha separadora laranja */}
                    {recurringBars > 0 && newBars > 0 && (
                      <div className="w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: '#f97316', height: '110%' }} />
                    )}
                    {Array.from({ length: newBars }).map((_, i) => (
                      <div
                        key={`n-${i}`}
                        className="flex-1 rounded-sm transition-colors duration-500"
                        style={{ backgroundColor: '#e5e7eb', height: '100%' }}
                      />
                    ))}
                  </div>
                  {/* Total de clientes */}
                  <p className="text-[11px] text-muted-foreground/70 mt-auto pt-2">{customerInsights?.totalCustomers ?? 0} clientes únicos no período</p>
                </div>
              );
            })()}
          </div>
          <HoverCardContent side="top" align="center" className="w-80 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                  <UsersRound className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-sm">Resumo do Perfil de Clientes</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>Nos últimos 30 dias:</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span><strong className="text-foreground">{customerInsights?.recurringPct ?? 0}%</strong> são clientes recorrentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span><strong className="text-foreground">{customerInsights?.newPct ?? 0}%</strong> são novos clientes</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-100 dark:border-amber-800/30">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {(customerInsights?.newPct ?? 0) > 50
                    ? '\uD83D\uDCA1 Isso indica crescimento da base de clientes.'
                    : (customerInsights?.recurringPct ?? 0) > 50
                    ? '\uD83D\uDCA1 Boa fidelização! A maioria dos clientes retorna.'
                    : '\uD83D\uDCA1 Base equilibrada entre novos e recorrentes.'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">Total analisado: <strong className="text-foreground">{customerInsights?.totalCustomers ?? 0}</strong> clientes únicos</p>
            </div>
          </HoverCardContent>
          </HoverCard>
          </>
          )}
        </div>

        {/* Coluna direita: Tempo Médio + Faturamento por Hora */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Tempo Médio */}
          {isLitePlan ? (
            <LockedPremiumCard
              title="Tempo Médio"
              description="Tempo médio de preparo"
              unlockDescription="Acompanhe o tempo de preparo dos pedidos"
              icon={Timer}
              minHeightClass="min-h-[196px] h-[196px]"
              hideCenterLockIcon
              onPlanClick={() => navigate('/planos')}
            />
          ) : (
          <HoverCard openDelay={300} closeDelay={200}>
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[196px] overflow-hidden cursor-default transition-colors hover:border-blue-200 dark:hover:border-blue-800/50">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-auto">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Tempo Médio</h3>
                  <p className="text-xs text-muted-foreground">Tempo médio de preparo (aceito → pronto)</p>
                </div>
              </div>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label="Ver informações de Tempo Médio"
                  className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
            </div>

            {prepTimeLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="skeleton h-8 w-24 rounded-lg" />
              </div>
            ) : (
              <div className="flex items-end gap-4 flex-1 min-h-0">
                {/* Lado esquerdo: KPI numérico + contexto */}
                <div className="flex flex-col justify-end flex-shrink-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-foreground">{avgPrepTime?.avgMinutes ?? 0}</span>
                    <span className="text-sm font-medium text-muted-foreground">min</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{avgPrepTime?.totalOrders ?? 0} pedidos no período</p>
                  {/* Insight de comparação */}
                  {(() => {
                    const current = avgPrepTime?.avgMinutes ?? 0;
                    const previous = prepTimeTrend?.previousAvg ?? 0;
                    if (current === 0 || previous === 0) return null;
                    const diff = previous - current;
                    const isFaster = diff > 0;
                    const periodLabel = 'que período anterior';
                    return (
                      <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-medium ${
                        isFaster 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-500 dark:text-red-400'
                      }`}>
                        {isFaster ? (
                          <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span>{Math.abs(diff)} min {isFaster ? 'mais rápido' : 'mais lento'} {periodLabel}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Lado direito: Sparkline de tendência */}
                {prepTimeTrend?.trend && prepTimeTrend.trend.length >= 2 && (
                  <div className="flex-1 min-w-0 flex flex-col justify-end pb-1">
                    <ResponsiveContainer width="100%" height={64}>
                      <AreaChart data={prepTimeTrend.trend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="prepTimeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="avgMinutes"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#prepTimeGrad)"
                          dot={false}
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-[9px] text-muted-foreground/50 text-right mt-0.5">últimos 7 dias</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <HoverCardContent side="bottom" align="center" className="w-80 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                  <Timer className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-sm">Resumo do Tempo de Preparo</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>No período selecionado:</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Tempo médio: <strong className="text-foreground">{avgPrepTime?.avgMinutes ?? 0} min</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Pedidos analisados: <strong className="text-foreground">{avgPrepTime?.totalOrders ?? 0}</strong></span>
                </div>
                {prepTimeTrend?.previousAvg != null && prepTimeTrend.previousAvg > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <span>Período anterior: <strong className="text-foreground">{prepTimeTrend.previousAvg} min</strong></span>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  {(() => {
                    const current = avgPrepTime?.avgMinutes ?? 0;
                    const previous = prepTimeTrend?.previousAvg ?? 0;
                    if (current === 0) return '\uD83D\uDCA1 Sem dados suficientes para análise.';
                    if (previous === 0) return '\uD83D\uDCA1 Tempo médio de ' + current + ' min no período.';
                    const diff = previous - current;
                    return diff > 0
                      ? `\uD83D\uDCA1 Melhoria de ${diff} min em relação ao período anterior!`
                      : diff < 0
                      ? `\uD83D\uDCA1 Atenção: ${Math.abs(diff)} min mais lento que o período anterior.`
                      : '\uD83D\uDCA1 Tempo estável em relação ao período anterior.';
                  })()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">Cálculo: tempo entre <strong>aceito</strong> e <strong>pronto</strong></p>
            </div>
          </HoverCardContent>
          </HoverCard>
          )}

          {/* Card 2: Faturamento por Hora */}
          {isFreePlan ? (
            <LockedPremiumCard
              title="Faturamento por Hora"
              description="Distribuição de vendas ao longo do dia"
              unlockDescription="Descubra seus horários de pico"
              icon={BarChart3}
              minHeightClass="min-h-[306px] h-[306px]"
              onPlanClick={() => navigate('/planos')}
            />
          ) : (
          <HoverCard openDelay={300} closeDelay={200}>
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[306px] overflow-hidden">
            {/* Header padronizado */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Faturamento por Hora</h3>
                  <p className="text-xs text-muted-foreground">Distribuição de vendas ao longo do dia</p>
                </div>
              </div>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label="Ver informações de Faturamento por Hora"
                  className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
            </div>

            {revenueByHourLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="skeleton h-full w-full rounded-lg" />
              </div>
            ) : revenueByHour && revenueByHour.length > 0 ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByHour.map(d => ({ ...d, label: `${String(d.hour).padStart(2, '0')}:00` }))}>
                    <defs>
                      <linearGradient id="revenueLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                      width={40}
                    />
                    {(() => {
                      const peakHour = revenueByHour.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueByHour[0]);
                      const peakLabel = `${String(peakHour.hour).padStart(2, '0')}:00`;
                      return <ReferenceLine x={peakLabel} stroke="rgba(239,68,68,0.15)" strokeWidth={40} />;
                    })()}
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="url(#revenueLineGrad)" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 4, fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
                <p className="text-xs text-muted-foreground/70">Nenhum faturamento no período</p>
              </div>
            )}
          </div>
          <HoverCardContent side="bottom" align="center" className="w-80 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <p className="font-semibold text-sm">Resumo do Faturamento por Hora</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>No período selecionado:</p>
                {revenueByHour && revenueByHour.length > 0 ? (() => {
                  const peakHour = revenueByHour.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueByHour[0]);
                  const totalRevenue = revenueByHour.reduce((sum, d) => sum + d.revenue, 0);
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Pico: <strong className="text-foreground">{String(peakHour.hour).padStart(2, '0')}:00</strong> ({formatCurrency(peakHour.revenue)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span>Total no período: <strong className="text-foreground">{formatCurrency(totalRevenue)}</strong></span>
                      </div>
                    </>
                  );
                })() : (
                  <p>Nenhum faturamento no período.</p>
                )}
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2.5 border border-rose-100 dark:border-rose-800/30">
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  {revenueByHour && revenueByHour.length > 0
                    ? '💡 Identifique seus horários de pico para ajustar equipe, preparo e campanhas.'
                    : '💡 Sem dados suficientes para análise.'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">Distribuição de vendas por hora do dia</p>
            </div>
          </HoverCardContent>
          </HoverCard>
          )}
        </div>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Pedidos por período (analítico) */}
        {isFreePlan ? (
          <LockedPremiumCard
            title="Pedidos | Últimos 7 dias"
            description="Análise de pedidos finalizados"
            unlockDescription="Acompanhe a evolução dos seus pedidos"
            icon={CalendarDays}
            minHeightClass="min-h-[380px] h-full"
            className="lg:col-span-2"
            onPlanClick={() => navigate('/planos')}
          />
        ) : (
        <div className="bg-card rounded-xl border border-border/50 flex flex-col lg:col-span-2">
          {/* Header padronizado */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Pedidos | Últimos {weeklyPeriod} dias</h3>
                <p className="text-xs text-muted-foreground">Análise de pedidos finalizados</p>
              </div>
            </div>
            {/* Filtro de período */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setWeeklyPeriod(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${weeklyPeriod === d ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            {weeklyLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="skeleton h-full w-full rounded-lg" />
              </div>
            ) : (() => {
              const totalPedidos = chartData.reduce((sum, d) => sum + d.pedidos, 0);
              const mediaDiaria = chartData.length > 0 ? Math.round(totalPedidos / chartData.length) : 0;
              const melhorDia = chartData.length > 0 ? chartData.reduce((best, d) => d.pedidos > best.pedidos ? d : best, chartData[0]) : null;
              // Variação real vs período anterior
              const tendencia = prevTotalPedidos > 0 ? Math.round(((totalPedidos - prevTotalPedidos) / prevTotalPedidos) * 100) : (totalPedidos > 0 ? 100 : 0);

              return (
                <>
                  {/* KPIs Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    {/* Total de Pedidos - spans full width on mobile */}
                    <div className="bg-muted/30 rounded-xl p-3 col-span-2 sm:col-span-1 order-last sm:order-first">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total do Período</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{totalPedidos}</span>
                        {tendencia !== 0 && (
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${tendencia > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {tendencia > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {tendencia > 0 ? '+' : ''}{tendencia}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">pedidos finalizados</p>
                      {prevTotalPedidos > 0 && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">anterior: {prevTotalPedidos}</p>
                      )}
                    </div>

                    {/* Média Diária */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Média Diária</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{mediaDiaria}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">pedidos/dia</p>
                    </div>

                    {/* Melhor Dia */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Melhor Dia</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{melhorDia ? melhorDia.pedidos : 0}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{melhorDia ? melhorDia.date : '-'}</p>
                    </div>
                  </div>

                  {/* Gráfico */}
                  {chartData.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                          />
                          {/* Linha de média semanal */}
                          <ReferenceLine 
                            y={mediaDiaria} 
                            stroke="rgba(239,68,68,0.5)" 
                            strokeDasharray="6 4" 
                            strokeWidth={1.5}
                            label={{ 
                              value: `Média: ${mediaDiaria}`, 
                              position: 'right', 
                              fill: 'rgba(239,68,68,0.7)', 
                              fontSize: 10,
                              fontWeight: 600
                            }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              padding: '10px 14px'
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === 'Período anterior') return [`${value} pedidos`, 'Período anterior'];
                              const diff = value - mediaDiaria;
                              const diffText = diff > 0 ? `+${diff} acima da média` : diff < 0 ? `${diff} abaixo da média` : 'na média';
                              return [`${value} pedidos (${diffText})`, 'Período atual'];
                            }}
                            labelFormatter={(label: string) => `${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="pedidos"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorPedidos)"
                            name="Período atual"
                            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
                            activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
                          />
                          {chartData.some(d => (d as any).prevPedidos !== undefined) && (
                            <Area
                              type="monotone"
                              dataKey="prevPedidos"
                              stroke="rgba(156,163,175,0.6)"
                              strokeWidth={1.5}
                              strokeDasharray="5 3"
                              fillOpacity={0}
                              fill="none"
                              name="Período anterior"
                              dot={false}
                              activeDot={{ r: 4, fill: 'rgba(156,163,175,0.6)', strokeWidth: 1, stroke: 'var(--card)' }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-56 flex flex-col items-center justify-center gap-1 text-center">
                      <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
                      <p className="text-xs text-muted-foreground/70">Nenhum pedido finalizado no período</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        )}

        {/* Recent Orders */}
        {isLitePlan ? (
        <LockedPremiumCard
          title="Pedidos Recentes"
          description="Últimos pedidos do estabelecimento"
          unlockDescription="Acompanhe os pedidos mais recentes no painel"
          icon={Package}
          minHeightClass="min-h-[380px] h-full"
          onPlanClick={() => navigate('/planos')}
        />
        ) : (
        <>
        {/* Recent Orders */}
        <div className="bg-card rounded-xl border border-border/50 flex flex-col">
          {/* Header padronizado com ícone + botão Ver todos */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Pedidos Recentes</h3>
                <p className="text-xs text-muted-foreground">Últimos pedidos do estabelecimento</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/pedidos')}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-5 pb-5 flex-1 flex flex-col overflow-x-auto">
            {ordersLoading ? (
              <div className="space-y-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                    <div className="skeleton h-4 w-10 rounded" />
                    <div className="skeleton h-5 w-16 rounded-full" />
                    <div className="skeleton h-4 w-32 rounded flex-1" />
                    <div className="skeleton h-4 w-14 rounded" />
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="min-w-0">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[20px_60px_1fr_70px_70px] gap-2 px-2 pb-2 border-b border-border/50">
                  <span></span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pedido</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Item</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Tempo</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Valor</span>
                </div>

                {/* Linhas da tabela com timeline */}
                {(() => {
                  const sortedOrders = [...recentOrders].sort((a, b) => {
                    const statusOrder: Record<string, number> = { new: 0, preparing: 1, ready: 2, out_for_delivery: 3, completed: 4, cancelled: 5 };
                    const aOrder = statusOrder[a.status] ?? 99;
                    const bOrder = statusOrder[b.status] ?? 99;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  });
                  const displayOrders = sortedOrders.slice(0, 7);
                  return (
                    <div className="relative">
                      {/* Linha vertical contínua da timeline - do primeiro ao último dot */}
                      {displayOrders.length > 1 && (
                        <div 
                          className="absolute left-[17px] top-[20px] bottom-[20px] w-[2px] bg-border"
                          style={{ zIndex: 0 }}
                        />
                      )}
                      {displayOrders.map((order, idx) => {
                        const items = order.items || [];
                        const firstName = (items[0] as any)?.name || (items[0] as any)?.productName || 'Item';
                        const extraCount = items.length - 1;
                        const itemSummary = extraCount > 0 ? `${firstName} +${extraCount}` : firstName;

                        const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                        const isInactive = order.status === 'completed' || order.status === 'cancelled';
                        const timeColor = isInactive
                          ? 'text-muted-foreground'
                          : minutesAgo <= 10 ? 'text-emerald-600 dark:text-emerald-400'
                          : minutesAgo <= 25 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-500 dark:text-red-400';

                        const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
                          new: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                          preparing: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
                          ready: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                          out_for_delivery: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                          completed: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
                          cancelled: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-500 dark:text-red-300', dot: 'bg-red-500' },
                        };
                        const sc = statusColors[order.status] || statusColors.completed;
                        const timeText = minutesAgo < 1 ? 'agora' : minutesAgo < 60 ? `${minutesAgo} min` : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}min`;

                        return (
                          <div
                            key={order.id}
                            className="grid grid-cols-[20px_60px_1fr_70px_70px] gap-2 items-center px-2 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer relative"
                            onClick={() => navigate(`/pedidos?order=${order.id}`)}
                          >
                            {/* Timeline dot */}
                            <div className="flex items-center justify-center" style={{ zIndex: 1 }}>
                              <div className={`w-3 h-3 rounded-full shrink-0 ${sc.dot} ring-[3px] ring-card`} />
                            </div>
                            <span className="text-sm font-semibold text-foreground truncate">
                              {(order as any).orderNumber?.startsWith('#') ? (order as any).orderNumber : `#${(order as any).orderNumber || order.id}`}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {itemSummary}
                            </span>
                            <span className={`text-xs font-medium text-right ${timeColor}`}>
                              {timeText}
                            </span>
                            <span className="text-sm font-bold text-foreground text-right">
                              {formatCurrency(Number(order.total))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center min-h-[300px]">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground text-center w-full">Sem dados</p>
                <p className="text-xs text-muted-foreground/70 text-center w-full">Nenhum pedido recente</p>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
