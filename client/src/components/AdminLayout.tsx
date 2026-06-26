import { CashReminderModal } from "@/components/CashReminderModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePreference } from "@/hooks/usePreference";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Package,
  Settings,
  Search,
  Bell,
  Menu,

  LogOut,
  ChevronDown,
  ChevronRight,
  Store,
  PanelLeft,
  PanelLeftClose,
  ExternalLink,
  Crown,
  Ticket,
  Volume2,
  VolumeX,
  Printer,
  Layers,
  Megaphone,
  Monitor,
  HelpCircle,
  MessageSquarePlus,
  Utensils,
  Clock,
  Sparkles,
  Moon,
  Sun,
  Star,
  BookOpen,
  Bike,
  Calendar,
  CalendarClock,
  BadgeDollarSign,
  BarChart3,
  Bot,
  ChefHat,
  AlertTriangle,
  Trophy,
  Target,
  TrendingDown,
  TrendingUp,
  Save,
  X,
  Clapperboard,
  Heart,
  Users,
  Rocket,
  Settings2,
  Info,
  Check,
  Bug,
  Landmark,
  ContactRound,
  Lock,
  Eye,
  EyeOff,
  Calculator,
  Plus,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { toast } from "sonner";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { WhatsAppDisconnectedBanner } from "@/components/WhatsAppDisconnectedBanner";
import { WhatsAppChatWidget } from "@/components/WhatsAppChatWidget";
import { usePushAutoRegister } from "@/hooks/usePushAutoRegister";
import { ScheduledClosureBanner } from "@/components/ScheduledClosureBanner";
// ChangelogButton removido da sidebar - agora está no Dashboard
import { useTheme } from "@/contexts/ThemeContext";
import { useSearch } from "@/contexts/SearchContext";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
// Helper para destacar nomes de planos em azul no tooltip
const PLAN_NAMES = ['Pro', 'Essencial', 'Básico', 'Premium', 'Business', 'Starter'];
function formatLockedLabel(label: string) {
  const parts: React.ReactNode[] = [];
  let remaining = label;
  let keyIdx = 0;
  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchedPlan = '';
    for (const plan of PLAN_NAMES) {
      const idx = remaining.indexOf(plan);
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        matchedPlan = plan;
      }
    }
    if (matchedPlan && earliestIdx < remaining.length) {
      if (earliestIdx > 0) {
        parts.push(remaining.slice(0, earliestIdx));
      }
      parts.push(<span key={keyIdx++} className="text-blue-500 font-semibold">{matchedPlan}</span>);
      remaining = remaining.slice(earliestIdx + matchedPlan.length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return <>{parts}</>;
}

// Seções do menu lateral
const menuSections: any[] = [
  {
    title: "OPERAÇÕES",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/", disabled: false },
      { icon: Monitor, label: "Frente de Caixa", href: "/pdv", disabled: false },
      { icon: Calculator, label: "Controle de Caixa", href: "/controle-caixa", disabled: false },
      { icon: Utensils, label: "Mapa de mesas", href: "/mesas", disabled: false, isParent: true, children: [
        { icon: ChefHat, label: "Cozinha (KDS)", href: "/cozinha", disabled: false, openNewTab: true },
      ] },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { icon: ContactRound, label: "Clientes", href: "/clientes", disabled: false },
      { icon: ClipboardList, label: "Pedidos", href: "/pedidos", disabled: false, isParent: true, children: [
        { icon: ClipboardList, label: "Gestor de pedidos", href: "/pedidos", disabled: false },
        { icon: Clock, label: "Histórico de pedidos", href: "/pedidos/historico", disabled: false },
        { icon: CalendarClock, label: "Agendados", href: "/agendados", disabled: false },
      ] },
      { icon: Bike, label: "Entregadores", href: "/entregadores", disabled: false },
      { icon: BookOpen, label: "Menu", href: "/menu-parent", disabled: false, isParent: true, children: [
        { icon: UtensilsCrossed, label: "Cardápio", href: "/catalogo", disabled: false },
        { icon: Layers, label: "Grupos", href: "/complementos", disabled: false },
        { icon: Sparkles, label: "Sugestões", href: "/sugestoes", disabled: false, isNew: true },
        { icon: Star, label: "Avaliações", href: "/avaliacoes", disabled: false, badgeKey: "reviews" },
      ]},
      { icon: Package, label: "Estoque", href: "/estoque", disabled: false },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { icon: BadgeDollarSign, label: "Minhas finanças", href: "/financas", disabled: false },
      { icon: Landmark, label: "Vendas e Repasses", href: "/banking", disabled: false },
      { icon: BarChart3, label: "Relatórios", href: "/relatorios", disabled: false },
    ]
  },
  {
    title: "MARKETING",
    items: [
      { icon: Clapperboard, label: "Stories no Menu", href: "/stories", disabled: false },
      { icon: Ticket, label: "Cupons", href: "/cupons", disabled: false },
      { icon: Megaphone, label: "Campanhas", href: "/campanhas", disabled: false },
      { icon: Heart, label: "Fidelização", href: "/fidelizacao", disabled: false },
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { icon: Bot, label: "Mindi Bot", href: "/bot-whatsapp", disabled: false },
      { icon: Users, label: "Acessos", href: "/acessos", disabled: false },
      { icon: Settings, label: "Configurações", href: "/configuracoes", disabled: false },
    ]
  },
];

// Lista plana para compatibilidade
const navItems = menuSections.flatMap(section => section.items) as any[];

// Componente de Tempo Médio de Preparo para a top bar
// Mapa de dias em inglês para português
const dayNameMap: Record<string, string> = {
  'Monday': 'Seg', 'Tuesday': 'Ter', 'Wednesday': 'Qua',
  'Thursday': 'Qui', 'Friday': 'Sex', 'Saturday': 'Sáb', 'Sunday': 'Dom',
};

const prepPeriodOptions = [
  { value: 'today' as const, label: 'Hoje' },
  { value: 'week' as const, label: 'Esta semana' },
  { value: 'month' as const, label: 'Este mês' },
];

function AvgPrepTimeButton({ establishmentId }: { establishmentId?: number }) {
  const [prepSidebarOpen, setPrepSidebarOpen] = useState(false);
  const [goalValue, setGoalValue] = useState<number>(30);
  const [goalChanged, setGoalChanged] = useState(false);
  const [prepTooltipDismissed, setPrepTooltipDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('tooltip_prepTime_clicked') === 'true'
  );
  const [prepPeriod, setPrepPeriod] = useState<'today' | 'week' | 'month'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardPeriod');
      if (saved === 'today' || saved === 'week' || saved === 'month') return saved;
    }
    return 'week';
  });

  // Sincronizar com localStorage quando a sidebar abre
  useEffect(() => {
    if (prepSidebarOpen) {
      const saved = localStorage.getItem('dashboardPeriod');
      if (saved === 'today' || saved === 'week' || saved === 'month') {
        setPrepPeriod(saved);
      }
    }
  }, [prepSidebarOpen]);

  const { data } = trpc.dashboard.avgPrepTime.useQuery(
    { establishmentId: establishmentId || 0, period: prepPeriod },
    { enabled: !!establishmentId, refetchInterval: 300000, staleTime: 120000 }
  );

  const { data: analysis, refetch: refetchAnalysis } = trpc.dashboard.prepTimeAnalysis.useQuery(
    { establishmentId: establishmentId || 0, period: prepPeriod },
    { enabled: !!establishmentId && prepSidebarOpen, staleTime: 60000 }
  );

  const updateGoalMutation = trpc.dashboard.updatePrepGoal.useMutation({
    onSuccess: () => {
      toast.success('Meta de preparo atualizada!');
      setGoalChanged(false);
      refetchAnalysis();
    },
    onError: () => toast.error('Erro ao atualizar meta'),
  });

  useEffect(() => {
    if (analysis?.prepGoal && !goalChanged) {
      setGoalValue(analysis.prepGoal);
    }
  }, [analysis?.prepGoal, goalChanged]);

  const avgMin = data?.avgMinutes ?? null;
  if (avgMin === null) return null;

  const goal = analysis?.prepGoal ?? 30;
  const isWithinGoal = avgMin <= goal;
  const color = isWithinGoal ? '#22c55e' : '#ef4444';
  const isPulsing = !isWithinGoal && avgMin > 0;

  const chartData = analysis?.dailyData?.map((d: any) => ({
    day: dayNameMap[d.dayName] || d.dayName.substring(0, 3),
    avgMinutes: d.avgMinutes,
    totalOrders: d.totalOrders,
  })) ?? [];
  const avgLine = analysis?.avgMinutes ?? 0;

  const handleSaveGoal = () => {
    if (establishmentId) {
      updateGoalMutation.mutate({ establishmentId, goalMinutes: goalValue });
    }
  };

  const diff = analysis?.diffFromYesterday ?? 0;
  const diffText = diff === 0 ? 'Sem variação' : diff < 0
    ? `${Math.abs(diff)} min mais rápido que ontem`
    : `${diff} min mais lento que ontem`;

  return (
    <>
      <Tooltip open={prepTooltipDismissed ? false : undefined}>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              setPrepSidebarOpen(true);
              if (!prepTooltipDismissed) {
                setPrepTooltipDismissed(true);
                localStorage.setItem('tooltip_prepTime_clicked', 'true');
              }
            }}
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-transform hover:scale-105 ${isPulsing ? '' : ''}`}
            style={{
              borderRadius: '10px',
              backgroundColor: color ? `${color}15` : undefined,
              color: color || undefined,
            }}
          >
            <Clock className="h-3.5 w-3.5" style={{ color: color || undefined }} />
            <span>{avgMin}min</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Tempo médio de preparo - clique para ver análise detalhada
        </TooltipContent>
      </Tooltip>

      <Sheet open={prepSidebarOpen} onOpenChange={setPrepSidebarOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[460px] p-0 overflow-hidden flex flex-col bg-white dark:bg-background" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div>
              <SheetTitle className="text-lg font-bold">Tempo de preparo dos pedidos</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {prepPeriod === 'today' ? 'Análise de hoje' : prepPeriod === 'week' ? 'Análise desta semana' : 'Análise deste mês'}
              </SheetDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 transition-colors">
                  <Calendar className="h-3.5 w-3.5" />
                  {prepPeriodOptions.find(o => o.value === prepPeriod)?.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-elevated border-border/50">
                {prepPeriodOptions.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setPrepPeriod(opt.value)}
                    className={`text-sm cursor-pointer ${prepPeriod === opt.value ? 'font-bold text-primary' : ''}`}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0">

          {/* KPI Principal */}
          <div className="text-center py-4">
            <div className="text-5xl font-bold" style={{ color }}>
              {analysis?.avgMinutes ?? avgMin} min
            </div>
            <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${diff <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {diff <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              <span>{diffText}</span>
            </div>
          </div>

          {/* 3 Indicadores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">{analysis?.avgMinutes ?? 0} min</div>
              <div className="text-[10px] text-muted-foreground">Tempo médio</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Target className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">{analysis?.prepGoal ?? 30} min</div>
              <div className="text-[10px] text-muted-foreground">Meta</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <ClipboardList className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <div className="text-lg font-bold">{analysis?.totalOrders ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Pedidos</div>
            </div>
          </div>

          {/* Gráfico Semanal */}
          {chartData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Tempo médio por dia</h4>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="m" />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value} min`, 'Tempo médio']}
                    />
                    <ReferenceLine y={analysis?.prepGoal ?? 30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Meta', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                    {avgLine > 0 && <ReferenceLine y={avgLine} stroke="#94a3b8" strokeDasharray="3 3" />}
                    <Area type="monotone" dataKey="avgMinutes" stroke={color} fill="url(#prepGrad)" strokeWidth={2} dot={{ r: 3, fill: color }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tempo médio por etapa */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Tempo médio por etapa</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3">
                <div className="bg-orange-100 dark:bg-orange-900/40 rounded-lg p-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{analysis?.prepMinutes ?? 0} min</div>
                  <div className="text-[10px] text-muted-foreground">Preparo</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2">
                  <Bike className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{analysis?.deliveryMinutes ?? 0} min</div>
                  <div className="text-[10px] text-muted-foreground">Entrega</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pior tempo da semana */}
          {analysis?.worstOrder && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Pior tempo da semana</h4>
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 rounded-xl p-3">
                <div className="bg-red-100 dark:bg-red-500/40 rounded-lg p-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-red-500">{analysis.worstOrder.minutes} min</div>
                  <div className="text-[10px] text-muted-foreground">
                    Pedido {analysis.worstOrder.orderNumber} &middot; {dayNameMap[analysis.worstOrder.dayName] || analysis.worstOrder.dayName}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            {analysis?.bestDay && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">Melhor dia:</span>
                <span className="font-semibold">{dayNameMap[analysis.bestDay.dayName] || analysis.bestDay.dayName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Média diária:</span>
              <span className="font-semibold">{analysis?.avgDailyOrders ?? 0} pedidos</span>
            </div>
          </div>

          {/* Meta de preparo configurável */}
          <div className="mt-5 border-t pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Meta de preparo</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[goalValue]}
                  onValueChange={(v) => { setGoalValue(v[0]); setGoalChanged(true); }}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="text-lg font-bold w-16 text-center">{goalValue} min</div>
              {goalChanged && (
                <Button
                  size="sm"
                  onClick={handleSaveGoal}
                  disabled={updateGoalMutation.isPending}
                  className="gap-1"
                >
                  <Save className="h-3 w-3" />
                  Salvar
                </Button>
              )}
            </div>
          </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

type PendingPixInfo = {
  id?: number;
  orderId?: number;
  transactionId?: string | null;
  total: number;
  orderNumber: string;
  status?: string | null;
};

function PendingPixIndicator() {
  const [pending, setPending] = useState<PendingPixInfo | null>(null);
  const [, setIsChecking] = useState(false);
  const [location, navigate] = useLocation();
  const trpcUtils = trpc.useUtils();

  const clearPendingPix = (showToast?: { type: 'success' | 'error'; title: string; description?: string }) => {
    setPending(null);
    try {
      sessionStorage.removeItem('pixPendingOrder');
    } catch {
      // Ignora indisponibilidade pontual do sessionStorage.
    }
    window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
    if (showToast?.type === 'success') {
      toast.success(showToast.title, { description: showToast.description });
    } else if (showToast?.type === 'error') {
      toast.error(showToast.title, { description: showToast.description });
    }
  };

  useEffect(() => {
    const normalizePending = (raw: Partial<PendingPixInfo> | null | undefined): PendingPixInfo | null => {
      const orderId = raw?.orderId ?? raw?.id;
      if (!raw || typeof raw.total !== 'number' || !raw.orderNumber) return null;
      return {
        ...raw,
        orderId,
        id: raw.id ?? orderId,
        transactionId: raw.transactionId ?? null,
        total: raw.total,
        orderNumber: raw.orderNumber,
      };
    };

    const stored = sessionStorage.getItem('pixPendingOrder');
    if (stored) {
      try {
        const normalized = normalizePending(JSON.parse(stored));
        if (normalized) {
          setPending(normalized);
          sessionStorage.setItem('pixPendingOrder', JSON.stringify(normalized));
        } else {
          sessionStorage.removeItem('pixPendingOrder');
        }
      } catch {
        sessionStorage.removeItem('pixPendingOrder');
      }
    }

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Partial<PendingPixInfo> | null>).detail;
      const normalized = normalizePending(detail);
      if (normalized) {
        setPending(normalized);
        sessionStorage.setItem('pixPendingOrder', JSON.stringify(normalized));
      } else {
        setPending(null);
        sessionStorage.removeItem('pixPendingOrder');
      }
    };

    window.addEventListener('pixPendingUpdate', handleUpdate);
    return () => window.removeEventListener('pixPendingUpdate', handleUpdate);
  }, []);

  useEffect(() => {
    if (!pending?.orderId) return;
    if (pending.status && pending.status !== 'PENDING') return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const pollPendingPix = async () => {
      if (cancelled || !pending?.orderId) return;
      let shouldContinuePolling = true;
      setIsChecking(true);

      try {
        const result = pending.transactionId
          ? await trpcUtils.paytime.checkPixStatus.fetch({
              orderId: pending.orderId,
              transactionId: pending.transactionId,
            })
          : await trpcUtils.paytime.checkPaymentStatus.fetch({ orderId: pending.orderId });

        if (cancelled) return;

        const status = String(result.status || '').toUpperCase();
        const isPaid = 'isPaid' in result ? Boolean(result.isPaid) : status === 'APPROVED';

        if (isPaid || status === 'APPROVED' || status === 'PAID') {
          shouldContinuePolling = false;
          clearPendingPix({
            type: 'success',
            title: 'Pagamento PIX confirmado!',
            description: `Pedido #${pending.orderNumber} foi liberado para preparo.`,
          });
          trpcUtils.order.list.invalidate();
          return;
        }

        if (['CANCELLED', 'FAILED', 'EXPIRED'].includes(status)) {
          shouldContinuePolling = false;
          clearPendingPix({
            type: 'error',
            title: 'Cobrança PIX não foi concluída',
            description: `Pedido #${pending.orderNumber} retornou status ${status}.`,
          });
          trpcUtils.order.list.invalidate();
          return;
        }
      } catch (error) {
        console.warn('[PendingPixIndicator] Erro ao verificar PIX pendente:', error);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          if (shouldContinuePolling) {
            timeoutId = setTimeout(pollPendingPix, 4000);
          }
        }
      }
    };

    pollPendingPix();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      setIsChecking(false);
    };
  }, [pending?.orderId, pending?.transactionId, pending?.status, pending?.orderNumber, trpcUtils]);

  if (!pending) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (location === '/pdv') {
          window.dispatchEvent(new CustomEvent('pixOpenConfirmation'));
          return;
        }

        try {
          sessionStorage.setItem('pixOpenConfirmationAfterNavigation', '1');
        } catch {
          // Ignora indisponibilidade pontual do sessionStorage.
        }
        navigate('/pdv');
      }}
      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-transform hover:scale-105"
      style={{
        backgroundColor: '#f59e0b15',
        color: '#d97706',
        border: '1px solid #f59e0b30',
      }}
      title={`Pedido #${pending.orderNumber} aguardando PIX`}
    >
      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="font-bold">R$ {pending.total.toFixed(2).replace('.', ',')}</span>
    </button>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Map href to permission key
export const HREF_TO_PERMISSION: Record<string, string> = {
  '/': 'dashboard',
  '/pdv': 'pdv',
  '/mesas': 'mesas',
  '/cozinha': 'cozinha',
  '/pedidos': 'pedidos',
  '/agendados': 'pedidos',
  '/clientes': 'clientes',
  '/entregadores': 'entregadores',
  '/catalogo': 'catalogo',
  '/complementos': 'complementos',
  '/avaliacoes': 'avaliacoes',
  '/sugestoes': 'sugestoes',
  '/estoque': 'estoque',
  '/financas': 'financas',
  '/controle-caixa': 'controle-caixa',
  '/banking': 'banking',
  '/relatorios': 'relatorios',
  '/stories': 'stories',
  '/cupons': 'cupons',
  '/campanhas': 'campanhas',
  '/fidelizacao': 'fidelizacao',
  '/bot-whatsapp': 'bot-whatsapp',
  '/acessos': 'acessos',
  '/configuracoes': 'configuracoes',
  '/menu-parent': '__parent__',
};

/**
 * P15: Lê sessão do colaborador do cookie 'collaborator_info' (setado pelo servidor).
 * Migrado de localStorage para cookie para reduzir vulnerabilidade a XSS persistente.
 */
export function getCollaboratorSession(): { id: number; name: string; permissions: string[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === 'collaborator_info') {
        const raw = decodeURIComponent(rest.join('='));
        if (!raw) return null;
        return JSON.parse(raw);
      }
    }
    return null;
  } catch { return null; }
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, logout, refresh: refreshAuth } = useAuth();
  const [location, navigate] = useLocation();
  const { newOrdersCount, unlockAudio, isAudioUnlocked } = useNewOrders();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Preferência "ocultar bloqueados" salva no banco e sincronizada entre componentes.
  const [hideLockedPrefValue, setHideLockedPreference] = usePreference('sidebar_hide_locked');
  const hideLockedItems = hideLockedPrefValue === 'true';
  const { searchQuery, setSearchQuery } = useSearch();

  const isRouteActive = (href: string) => {
    if (href === '/') return location === '/';
    return location === href || location.startsWith(`${href}/`);
  };

  const isChildRouteActive = (child: any, siblings: any[]) => {
    if (!isRouteActive(child.href)) return false;

    const moreSpecificSiblingActive = siblings.some((sibling: any) =>
      sibling.href !== child.href &&
      sibling.href?.startsWith(`${child.href}/`) &&
      isRouteActive(sibling.href)
    );

    return !moreSpecificSiblingActive;
  };

  // Badge "Novo" do Sugestões - desaparece ao clicar
  const [sugestoesSeenPref, setSugestoesSeenPref] = usePreference('sugestoes_badge_seen');
  const sugestoesBadgeSeen = sugestoesSeenPref === 'true';

  // Bloquear scroll do body quando sidebar mobile está aberta
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [sidebarOpen]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Collaborator permissions
  const collaboratorSession = getCollaboratorSession();
  const isCollaborator = !!collaboratorSession;
  const collaboratorPermissions = collaboratorSession?.permissions || [];

  // Filter menu sections based on collaborator permissions
  const filteredMenuSections = useMemo(() => {
    if (!isCollaborator) return menuSections;
    return menuSections.map(section => {
      const filteredItems = section.items.filter((item: any) => {
        const permKey = HREF_TO_PERMISSION[item.href];
        // Parent items: check if any child has permission
        if (item.isParent && item.children) {
          return item.children.some((child: any) => {
            const childPerm = HREF_TO_PERMISSION[child.href];
            return childPerm && collaboratorPermissions.includes(childPerm);
          });
        }
        // Regular items
        if (!permKey || permKey === '__parent__') return true;
        return collaboratorPermissions.includes(permKey);
      }).map((item: any) => {
        // Also filter children of parent items
        if (item.isParent && item.children) {
          return {
            ...item,
            children: item.children.filter((child: any) => {
              const childPerm = HREF_TO_PERMISSION[child.href];
              return childPerm && collaboratorPermissions.includes(childPerm);
            }),
          };
        }
        return item;
      });
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  }, [isCollaborator, collaboratorPermissions]);

  // Lite plan filter is applied after establishment is loaded (see finalMenuSections below)

  // Estado para submenus expandidos (Menu pai) - persistido no localStorage
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      // Tentar restaurar do localStorage
      const saved = localStorage.getItem('expandedMenus');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* ignore */ }
      }
      // Fallback: auto-expandir se estamos numa rota filha
      const path = window.location.pathname;
      const initial: Record<string, boolean> = {};
      if (path === '/catalogo' || path.startsWith('/catalogo/') || path === '/avaliacoes' || path === '/complementos') {
        initial['/menu-parent'] = true;
      }
      if (path === '/pedidos' || path.startsWith('/pedidos/') || path === '/agendados') {
        initial['/pedidos'] = true;
      }
      if (path === '/mesas' || path.startsWith('/mesas/') || path === '/cozinha') {
        initial['/mesas'] = true;
      }
      if (Object.keys(initial).length > 0) return initial;
    }
    return {};
  });

  // Persistir estado dos submenus expandidos no localStorage
  useEffect(() => {
    localStorage.setItem('expandedMenus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  // Estado local para controlar se o som está habilitado
  // IMPORTANTE: SEMPRE inicia FALSE ao carregar/atualizar a página (F5 ou primeiro acesso)
  // O navegador bloqueia reprodução de áudio sem interação do usuário (autoplay policy)
  // Estratégia: usamos uma flag em memória (window.__soundMounted) para distinguir:
  //   - Reload real (F5/refresh): window.__soundMounted não existe → forçar desativado
  //   - Navegação SPA (troca de rota): window.__soundMounted existe → preservar estado
  // Estados para tooltips que desaparecem após primeiro clique
  const [menuTooltipDismissed, setMenuTooltipDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('tooltip_viewMenu_clicked') === 'true'
  );
  const [trialTooltipDismissed, setTrialTooltipDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('tooltip_trial_clicked') === 'true'
  );
  const [pendingDraftTooltipDismissed, setPendingDraftTooltipDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('tooltip_pendingDraft_seen') === 'true'
  );
  const [pendingDraftTooltipOpen, setPendingDraftTooltipOpen] = useState(false);

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Se o componente já foi montado nesta "vida" da página (navegação SPA),
    // preservar o estado atual do localStorage
    if ((window as any).__soundMounted === true) {
      return localStorage.getItem("notificationSoundEnabled") === "true";
    }
    // Reload real (F5) ou primeiro acesso: forçar desativado
    return false;
  });

  // Ao montar, detectar se é reload real ou navegação SPA
  // window.__soundMounted é limpo automaticamente em reload (F5) pois vive apenas em memória JS
  useEffect(() => {
    if ((window as any).__soundMounted !== true) {
      // Reload real (F5, novo acesso, nova aba) — forçar desativado
      localStorage.setItem("notificationSoundEnabled", "false");
      (window as any).__soundMounted = true;
    }

    // Ouvir mudanças no localStorage (para sincronizar entre abas)
    const syncSoundState = () => {
      const storedValue = localStorage.getItem("notificationSoundEnabled");
      const shouldBeEnabled = storedValue === "true";
      setIsSoundEnabled(shouldBeEnabled);
    };

    window.addEventListener("storage", syncSoundState);
    return () => window.removeEventListener("storage", syncSoundState);
  }, []);

  // Listener global para notificação de novo pedido - funciona em todas as páginas
  useEffect(() => {
    const handleNewOrderNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const orderData = customEvent.detail;
      console.log("[AdminLayout] Evento de novo pedido recebido:", orderData);

      const isScheduled = orderData?.isScheduled === true;

      // Mostrar toast de notificação global - diferenciado para pedidos agendados
      if (isScheduled) {
        toast.success("Novo pedido agendado!", {
          description: `Um pedido agendado acabou de chegar.${orderData?.scheduledAt ? ` Agendado para ${new Date(orderData.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`,
          duration: 8000,
          action: {
            label: "Ver pedido agendado",
            onClick: () => {
              navigate("/agendados");
            },
          },
        });
      } else {
        toast.success("Novo pedido recebido!", {
          description: "Um novo pedido acabou de chegar.",
          duration: 5000,
          action: {
            label: "Ver pedidos",
            onClick: () => {
              navigate("/pedidos");
            },
          },
        });
      }
    };

    // Registrar listener
    window.addEventListener("new-order-notification", handleNewOrderNotification);
    console.log("[AdminLayout] Listener de notificação global registrado");

    return () => {
      window.removeEventListener("new-order-notification", handleNewOrderNotification);
      console.log("[AdminLayout] Listener de notificação global removido");
    };
  }, []);

  // Sidebar collapsed state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === "true";
    }
    return false;
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Minimizar menu automaticamente ao acessar páginas que precisam de mais área útil
  useEffect(() => {
    if (location === "/configuracoes" || location === "/pdv" || location === "/banking" || location === "/pedidos" || location.startsWith("/pedidos/")) {
      setSidebarCollapsed(true);
    }
  }, [location]);

  // Auto-minimizar sidebar em telas menores que 1280px
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setSidebarCollapsed(true);
      }
    };
    // Verificar no mount
    handler(mq);
    // Listener para resize
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Limpar busca global ao mudar de página
  useEffect(() => {
    setSearchQuery("");
  }, [location]);



  // Get establishment data
  const { data: establishment, isLoading: establishmentLoading, refetch: refetchEstablishment } = trpc.establishment.get.useQuery(
    user?.id ? { sessionUserId: user.id } : undefined,
    { enabled: !!user?.id, staleTime: 0, gcTime: 0, refetchOnMount: "always" }
  );

  const sessionRenderKey = `${user?.id ?? "anonymous"}:${establishment?.id ?? "no-establishment"}`;
  const lastSessionSyncUserIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      lastSessionSyncUserIdRef.current = null;
      return;
    }

    if (lastSessionSyncUserIdRef.current === user.id) return;
    lastSessionSyncUserIdRef.current = user.id;

    void refreshAuth().finally(() => {
      void refetchEstablishment();
    });
  }, [user?.id, refreshAuth, refetchEstablishment]);

  // Auto-registrar Push Subscription para notificações de pedidos
  usePushAutoRegister(establishment?.id);

  // Get trial info
  const { data: trialInfo } = trpc.establishment.getTrialInfo.useQuery();

  // Lite plan (Free/Trial/Starter): allow Dashboard, Histórico de pedidos, Menu, Estoque and Configurações.
  // Keep /pedidos blocked; only the historical read-only route is released for Starter.
  const LITE_ALLOWED_HREFS = ['/', '/pedidos/historico', '/menu-parent', '/catalogo', '/complementos', '/sugestoes', '/estoque', '/configuracoes'];
  const isLitePlan = establishment?.planType === 'lite' || establishment?.planType === 'trial' || establishment?.planType === 'free';

  // Pro-only features: Finanças (financas, banking, relatorios) e Mindi Bot
  const PRO_ONLY_HREFS = ['/financas', '/bot-whatsapp'];
  const isProPlan = establishment?.planType === 'pro';
  const isNotProPlan = !isProPlan && !!establishment?.planType;

  // Get unread reviews count for badge (only when reviews are enabled)
  const reviewsEnabled = establishment?.reviewsEnabled !== false;
  const { data: unreadReviewCount } = trpc.reviewsAdmin.unreadCount.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id && reviewsEnabled, refetchOnWindowFocus: true }
  );

  // Get out of stock count for badge
  const { data: outOfStockData } = trpc.stock.outOfStockCount.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id, refetchOnWindowFocus: true }
  );
  const outOfStockCount = outOfStockData?.count || 0;

  // Get onboarding checklist to check if user has categories and products
  const { data: onboardingChecklist } = trpc.dashboard.onboardingChecklist.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id, staleTime: 30000 }
  );
  const hasMenuReady = onboardingChecklist?.steps?.some(s => s.id === 'category' && s.completed) &&
                        onboardingChecklist?.steps?.some(s => s.id === 'products' && s.completed);

  // Indicador de alterações pendentes no rascunho do cardápio
  const { data: catalogVersionStats } = trpc.catalogVersion.stats.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id, refetchInterval: 30000, refetchOnWindowFocus: true }
  );
  const hasPendingDraftChanges = catalogVersionStats?.hasPendingChanges ?? false;
  const canShowPendingDraftTooltip = hasPendingDraftChanges && !pendingDraftTooltipDismissed;

  const markPendingDraftTooltipSeen = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tooltip_pendingDraft_seen', 'true');
    }
    setPendingDraftTooltipDismissed(true);
    setPendingDraftTooltipOpen(false);
  };

  const renderPendingDraftIndicator = (side: "right" | "top" | "bottom" | "left" = "right", className = "") => {
    if (!hasPendingDraftChanges) return null;

    return (
      <Tooltip open={canShowPendingDraftTooltip ? pendingDraftTooltipOpen : false}>
        <TooltipTrigger asChild>
          <span
            role="status"
            aria-label="Alterações pendentes no rascunho"
            tabIndex={0}
            onMouseEnter={() => {
              if (canShowPendingDraftTooltip) {
                setPendingDraftTooltipOpen(true);
              }
            }}
            onMouseLeave={() => {
              if (pendingDraftTooltipOpen) {
                markPendingDraftTooltipSeen();
              }
            }}
            onClick={() => {
              markPendingDraftTooltipSeen();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                markPendingDraftTooltipSeen();
              }
            }}
            className={cn(
              "inline-flex h-2.5 w-2.5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.22)]",
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[240px] font-medium">
          Alterações pendentes no rascunho
        </TooltipContent>
      </Tooltip>
    );
  };

  // Check if scheduling is enabled for this establishment
  const schedulingEnabled = establishment?.schedulingEnabled === true;

  // Mark items as locked based on plan restrictions
  const finalMenuSections = useMemo(() => {
    // Apply lite plan restrictions first (most restrictive)
    let sections = filteredMenuSections;
    if (isLitePlan) {
      sections = sections.map((section: any) => {
        const items = section.items.map((item: any) => {
          const isAllowed = LITE_ALLOWED_HREFS.includes(item.href) ||
            (item.isParent && item.children && item.children.some((child: any) => LITE_ALLOWED_HREFS.includes(child.href)));
          if (isAllowed) {
            // For parent items, mark non-allowed children as locked
            if (item.isParent && item.children) {
              return {
                ...item,
                children: item.children.map((child: any) => {
                  if (LITE_ALLOWED_HREFS.includes(child.href)) return child;
                  const label = PRO_ONLY_HREFS.includes(child.href)
                    ? 'Disponível no plano Pro'
                    : 'Disponível nos planos Essencial e Pro';
                  return { ...child, lockedByPlan: true, lockedLabel: label };
                }),
              };
            }
            return item;
          }
          // Mark the entire item as locked
          const label = PRO_ONLY_HREFS.includes(item.href)
            ? 'Disponível no plano Pro'
            : 'Disponível nos planos Essencial e Pro';
          return { ...item, lockedByPlan: true, lockedLabel: label };
        });
        return { ...section, items };
      });
    } else if (isNotProPlan) {
      // For non-Pro plans (e.g., Essencial/basic): block Pro-only features
      sections = sections.map((section: any) => {
        const items = section.items.map((item: any) => {
          if (PRO_ONLY_HREFS.includes(item.href)) {
            return { ...item, lockedByPlan: true, lockedLabel: 'Disponível no plano Pro' };
          }
          if (item.isParent && item.children) {
            const hasLockedChildren = item.children.some((child: any) => PRO_ONLY_HREFS.includes(child.href));
            if (hasLockedChildren) {
              return {
                ...item,
                children: item.children.map((child: any) => ({
                  ...child,
                  lockedByPlan: PRO_ONLY_HREFS.includes(child.href),
                  lockedLabel: PRO_ONLY_HREFS.includes(child.href) ? 'Disponível no plano Pro' : undefined,
                })),
              };
            }
          }
          return item;
        });
        return { ...section, items };
      });
    }
    // Dynamic label: "Pagamento Online" when not activated, "Vendas e Repasses" when active
    sections = sections.map((section: any) => ({
      ...section,
      items: section.items.map((item: any) => {
        if (item.href === '/banking') {
          const isPaymentActive = establishment?.paytimeBankingActive;
          return {
            ...item,
            label: isPaymentActive ? 'Vendas e Repasses' : 'Pagamento Online',
            icon: isPaymentActive ? item.icon : item.icon,
          };
        }
        return item;
      }),
    }));
    return sections;
  }, [isLitePlan, isNotProPlan, filteredMenuSections, establishment?.paytimeBankingActive]);

  // Filter out locked items and locked submenu children when user toggles hide.
  const displayMenuSections = useMemo(() => {
    const hasLockedItems = isLitePlan || isNotProPlan;
    if (!hideLockedItems || !hasLockedItems) return finalMenuSections;

    return finalMenuSections.map((section: any) => {
      const items = section.items
        .filter((item: any) => !item.lockedByPlan)
        .map((item: any) => {
          if (!item.isParent || !item.children) return item;
          const children = item.children.filter((child: any) => !child.lockedByPlan);
          return { ...item, children };
        })
        .filter((item: any) => !item.isParent || !item.children || item.children.length > 0 || (item.href && !item.href.endsWith('-parent')));
      return { ...section, items };
    }).filter((section: any) => section.items.length > 0);
  }, [finalMenuSections, hideLockedItems, isLitePlan, isNotProPlan]);

  // Get scheduled orders pending count for badge (only when scheduling is enabled)
  const { data: scheduledPendingData } = trpc.scheduling.pendingCount.useQuery(
    undefined,
    { enabled: !!establishment?.id && schedulingEnabled, refetchInterval: 120000, refetchOnWindowFocus: true }
  );
  const scheduledPendingCount = scheduledPendingData?.count || 0;

  // Auto-expandir submenu Menu quando navegar para rotas filhas (apenas se não estiver já expandido)
  useEffect(() => {
    if (location === '/catalogo' || location.startsWith('/catalogo/') || location === '/avaliacoes' || location === '/complementos') {
      setExpandedMenus(prev => {
        if (prev['/menu-parent']) return prev;
        return { ...prev, '/menu-parent': true };
      });
    }
    if (location === '/pedidos' || location.startsWith('/pedidos/') || location === '/agendados') {
      setExpandedMenus(prev => {
        if (prev['/pedidos']) return prev;
        return { ...prev, '/pedidos': true };
      });
    }
  }, [location]);

  // Get server-computed open status (single source of truth)
  const { data: openStatusData, isLoading: openStatusLoading, refetch: refetchOpenStatus } = trpc.establishment.getOpenStatus.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id, refetchInterval: 300000 } // Refresh every 5 minutes (reduzido para evitar rate limit)
  );

  // Enquanto o estabelecimento/status ainda carregam, não exibir "Fechado" como fallback visual.
  const isOperationalStatusLoading = !!user?.id && (
    establishmentLoading ||
    (!!establishment?.id && (openStatusLoading || !openStatusData))
  );

  // Use server-computed values as the single source of truth
  const calculatedIsOpen = openStatusData?.isOpen ?? false;
  const isForcedClosed = openStatusData?.manuallyClosed ?? false;
  const isForcedOpen = !isForcedClosed && calculatedIsOpen && establishment?.manuallyOpened === true;

  // Query to check how many establishments the user has (for dropdown buttons)
  const { data: estCountData } = trpc.establishment.countEstablishments.useQuery(undefined, {
    staleTime: 60_000,
    enabled: !isCollaborator,
  });

  // Build status message from server data
  let statusMessage = '';
  if (!calculatedIsOpen && openStatusData?.nextOpeningTime) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const next = openStatusData.nextOpeningTime;
    // Prefixo com razão do fechamento programado, se houver
    const closureReason = (openStatusData as any).scheduledClosureReason;
    const prefix = closureReason ? `(${closureReason}) ` : '';
    if (next.isToday) {
      statusMessage = `${prefix}Abre hoje ${next.openTime}`;
    } else if (next.isTomorrow) {
      statusMessage = `${prefix}Abre amanhã ${next.openTime}`;
    } else {
      statusMessage = `${prefix}Abre ${dayNames[next.dayOfWeek]} ${next.openTime}`;
    }
  }

  // Toggle store open/closed - usa nova lógica de fechamento manual
  const toggleOpenMutation = trpc.establishment.setManualClose.useMutation({
    onSuccess: () => {
      refetchEstablishment();
      refetchOpenStatus();
      // Usar calculatedIsOpen para determinar a mensagem correta
      toast.success(calculatedIsOpen ? "Loja fechada manualmente" : "Loja aberta");
    },
    onError: () => {
      toast.error("Erro ao alterar status da loja");
    },
  });

  const handleToggleOpen = () => {
    if (establishment) {
      // Se está aberto (calculatedIsOpen = true), fechar manualmente
      // Se está fechado (calculatedIsOpen = false), abrir manualmente
      toggleOpenMutation.mutate({
        id: establishment.id,
        close: calculatedIsOpen, // true = fechar, false = abrir
      });
    }
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Ref para preservar scroll da sidebar (usa sessionStorage para persistir entre re-montagens)
  const sidebarNavRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = 'sidebar-scroll-pos';

  // Salvar posição do scroll continuamente no sessionStorage
  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav) return;
    const handleScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
    };
    nav.addEventListener('scroll', handleScroll);
    return () => nav.removeEventListener('scroll', handleScroll);
  }, []);

  // Restaurar posição do scroll na montagem do componente (persiste entre navegações)
  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav) return;
    const savedPos = parseInt(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || '0', 10);
    if (savedPos <= 0) return;

    // Restaurar imediatamente
    nav.scrollTop = savedPos;

    // Restaurar após o DOM estabilizar
    requestAnimationFrame(() => {
      nav.scrollTop = savedPos;
      requestAnimationFrame(() => {
        nav.scrollTop = savedPos;
      });
    });

    // Fallback final
    const timeout = setTimeout(() => {
      if (nav) nav.scrollTop = savedPos;
    }, 150);

    return () => clearTimeout(timeout);
  }, []);

  // Route protection for collaborators: redirect if no permission for current route
  useEffect(() => {
    if (!isCollaborator) return;
    const permKey = HREF_TO_PERMISSION[location];
    if (!permKey) return; // Unknown route, allow
    if (permKey === '__parent__') return;
    if (!collaboratorPermissions.includes(permKey)) {
      const firstAllowed = collaboratorPermissions[0];
      const firstRoute = Object.entries(HREF_TO_PERMISSION).find(([, v]) => v === firstAllowed)?.[0] || '/';
      navigate(firstRoute);
    }
  }, [location, isCollaborator, collaboratorPermissions]);

  // Route protection for Lite plan: redirect to Dashboard if accessing non-allowed routes
  useEffect(() => {
    if (!isLitePlan || !establishment) return;
    // Rotas permitidas no plano Lite (inclui sub-rotas do catálogo e configurações)
    const isAllowed = LITE_ALLOWED_HREFS.some(href => {
      if (href === '/') return location === '/';
      return location === href || location.startsWith(href + '/');
    });
    // Permitir também /conta-seguranca e /ajuda (acessíveis via configurações)
    const extraAllowed = ['/conta-seguranca', '/ajuda', '/planos'];
    const isExtraAllowed = extraAllowed.some(href => location === href || location.startsWith(href + '/'));
    if (!isAllowed && !isExtraAllowed) {
      navigate('/');
    }
  }, [location, isLitePlan, establishment]);

  // Route protection for non-Pro plans: redirect if accessing Pro-only routes
  useEffect(() => {
    if (isLitePlan || isProPlan || !establishment) return;
    const isProOnlyRoute = PRO_ONLY_HREFS.some(href => location === href || location.startsWith(href + '/'));
    if (isProOnlyRoute) {
      navigate('/');
    }
  }, [location, isLitePlan, isProPlan, establishment]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [authLoading, user]);

  if (authLoading) {
    const loadingLogoSrc = theme === "dark" ? "/assets/mindi-login-logo-dark.png" : "/assets/mindi-login-logo-light.png";

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground transition-colors duration-200">
        <div className="flex flex-col items-center gap-6">
          <img
            src={loadingLogoSrc}
            alt="Mindi"
            className="h-[43.3784px] max-w-[calc(100%-3rem)] w-auto object-contain"
          />
          <div className="flex items-center gap-[1px] text-sm font-medium text-muted-foreground">
            <span>Carregando</span>
            <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite' }}>.</span>
            <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite 0.2s' }}>.</span>
            <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite 0.4s' }}>.</span>
          </div>
        </div>
        <style>{`
          @keyframes mindiOverlayDot {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleNavClick = (href: string) => {
    // Salvar posição do scroll antes de navegar (sessionStorage persiste entre re-montagens)
    if (sidebarNavRef.current) {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebarNavRef.current.scrollTop));
    }
    // Marcar badge "Novo" como visto ao clicar em Sugestões
    if (href === '/sugestoes' && !sugestoesBadgeSeen) {
      setSugestoesSeenPref('true');
    }
    // Pedidos precisa de mais área útil para kanban/lista e modal de detalhes
    if (href === '/pedidos') {
      setSidebarCollapsed(true);
    }
    // Fechar sidebar mobile
    setSidebarOpen(false);
  };

  // Sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? "w-[63px]" : "w-[263px]";
  const mainPadding = sidebarCollapsed ? "md:pl-[63px]" : "md:pl-[263px]";
  const mobileTopbarTitle = location === '/mesas' || location.startsWith('/mesas/') ? "Mapa de mesas" : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "group/sidebar fixed top-0 left-0 z-50 h-full border-r border-sidebar-border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 flex flex-col overscroll-contain",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
        style={{
          background: 'var(--card)'
        }}
      >
        {/* Logo + Toggle button na mesma linha */}
        <div className={cn(
          "flex items-center h-[58px] border-b border-sidebar-border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {/* Quando colapsado, mostrar o logo por padrão e o ícone de expandir apenas no hover */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebarCollapsed}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Abrir barra lateral"
                  title="Abrir barra lateral"
                >
                  <img
                    src="/assets/mindi-sidebar-collapsed-logo.png"
                    alt="Mindi"
                    className="h-[24.72px] w-[28.84px] object-contain transition-opacity duration-200 group-hover/sidebar:opacity-0"
                  />
                  <PanelLeft className="absolute h-5 w-5 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Abrir barra lateral</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-3">
                {establishment?.logo ? (
                  <img
                    src={establishment.logo}
                    alt={establishment.name || "Logo"}
                    className="h-8 w-8 rounded-lg object-cover flex-shrink-0 ring-1 ring-border/50" style={{width: '37px', height: '37px'}}
                  />
                ) : (
                  <div className="p-1.5 bg-primary rounded-lg flex-shrink-0">
                    <Store className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-foreground whitespace-nowrap truncate max-w-[140px]">
                    {establishment?.name || "Cardápio"}
                  </span>
                  {/* Badge de status Aberto/Fechado */}
                  <span className={cn(
                    "text-[10px] font-medium flex items-center gap-1",
                    isOperationalStatusLoading
                      ? "text-muted-foreground"
                      : calculatedIsOpen
                        ? "text-green-600"
                        : "text-red-500"
                  )} style={{fontSize: '12px'}}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isOperationalStatusLoading
                        ? "bg-muted-foreground/50"
                        : calculatedIsOpen
                          ? "bg-green-500"
                          : "bg-red-500"
                    )} style={{width: '7px', height: '7px'}} />
                    {isOperationalStatusLoading ? "Carregando..." : calculatedIsOpen ? "Aberto" : "Fechado"}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                {/* Toggle button - Desktop only */}
                <button
                  onClick={toggleSidebarCollapsed}
                  className="hidden md:flex p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                  title="Minimizar menu"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
                {/* Close button - Mobile only */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>



        {/* Navigation */}
        <nav ref={sidebarNavRef} className={cn(
          "flex-1 py-4 overflow-y-auto overscroll-contain transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "px-1.5" : "px-3"
        )}>
          {displayMenuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""} style={{marginBottom: '-5px'}}>
              {/* Título da seção */}
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-bold text-primary/70 uppercase tracking-wider px-3 mb-3">
                  {section.title}
                </h3>
              )}
              {sidebarCollapsed && sectionIndex > 0 && (
                <div className="border-t border-border my-3 mx-2" />
              )}

              {/* Itens da seção */}
              <div className="space-y-1.5">
                {section.items.map((item: any) => {
                  // ===== PARENT MENU WITH CHILDREN =====
                  if (item.isParent && item.children) {
                    // If entire parent is locked by plan, render as locked
                    if (item.lockedByPlan) {
                      const lockedParentContent = (
                        <div
                          className={cn(
                            "flex items-center gap-2.5 py-2.5 text-sm font-medium relative cursor-not-allowed opacity-40 text-muted-foreground/50",
                            sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3"
                          )}
                          style={!sidebarCollapsed ? {borderRadius: '12px', marginRight: '8px', marginLeft: '-2px'} : undefined}
                        >
                          <item.icon className={cn("h-4 w-4 flex-shrink-0", sidebarCollapsed && "mx-auto")} />
                          {!sidebarCollapsed && (
                            <span className="text-sm flex items-center gap-2 flex-1">
                              {item.label}
                              <Lock className="h-3 w-3 text-muted-foreground/70" />
                            </span>
                          )}
                        </div>
                      );

                      if (sidebarCollapsed) {
                        return (
                          <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                              {lockedParentContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              <p>{item.label}</p>
                              <p className="text-xs text-muted-foreground">{formatLockedLabel(item.lockedLabel || 'Disponível em planos superiores')}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return (
                        <Tooltip key={item.href} delayDuration={0}>
                          <TooltipTrigger asChild>
                            {lockedParentContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            <p>{formatLockedLabel(item.lockedLabel || 'Disponível em planos superiores')}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    // Filtrar filhos visíveis antes de renderizar
                     const visibleChildren = item.children.filter((child: any) => {
                       if (child.href === '/agendados' && !schedulingEnabled) return false;
                       return true;
                     });

                    // Se não há filhos visíveis e o item tem href navegável, renderizar como link direto
                    if (visibleChildren.length === 0 && item.href && !item.href.endsWith('-parent')) {
                      // Renderizar como item regular (sem submenu)
                      const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                      const showOrderBadge = item.href === '/pedidos' && newOrdersCount > 0;

                      const linkContent = (
                        <Link
                          href={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "flex items-center gap-2.5 py-2.5 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                            sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3",
                            isActive
                              ? "bg-primary/15 text-primary rounded-xl"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                          style={!sidebarCollapsed ? {borderRadius: '12px', marginRight: '8px', marginLeft: '-2px'} : undefined}
                        >
                          <div className="relative">
                            <item.icon className={cn("h-4 w-4 flex-shrink-0", sidebarCollapsed && "mx-auto")} />
                            {showOrderBadge && sidebarCollapsed && (
                              <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center bg-red-500 text-white">
                                {newOrdersCount > 9 ? "9+" : newOrdersCount}
                              </span>
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <span className="text-sm flex items-center gap-2 flex-1">
                              {item.label}
                              {showOrderBadge && (
                                <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                  {newOrdersCount > 99 ? "99+" : newOrdersCount}
                                </span>
                              )}
                            </span>
                          )}
                        </Link>
                      );

                      if (sidebarCollapsed) {
                        return (
                          <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return <div key={item.href}>{linkContent}</div>;
                    }

                    const isExpanded = expandedMenus[item.href] || false;
                    const isChildActive = item.children.some((child: any) =>
                      isChildRouteActive(child, item.children)
                    );
                    // Verificar se o próprio item pai está ativo (ex: /pedidos)
                    const isDirectActive = item.href && !item.href.endsWith('-parent') && (
                      location === item.href || (item.href !== '/' && location.startsWith(item.href) && !isChildActive)
                    );
                    // Total badge count from children and parent-level alerts.
                    // Pedidos became a parent menu; keep the new-order badge visible on the parent
                    // and on the "Gestor de pedidos" child instead of relying only on regular items.
                    const parentOrderBadge = item.href === '/pedidos' && newOrdersCount > 0 ? newOrdersCount : 0;
                    const childReviewBadge = item.href === '/menu-parent' && reviewsEnabled && typeof unreadReviewCount === 'number' ? unreadReviewCount : 0;
                    const childScheduledBadge = item.href === '/pedidos' ? scheduledPendingCount : 0;
                    const totalBadge = parentOrderBadge + childReviewBadge + childScheduledBadge;

                    const parentClassName = cn(
                      "flex items-center gap-2.5 py-2.5 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative cursor-pointer",
                      sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3",
                      isDirectActive
                        ? "bg-primary/15 text-primary rounded-xl"
                        : isChildActive
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    );

                    if (sidebarCollapsed) {
                      // Quando colapsado, abrir popover flutuante com os filhos
                      return (
                        <div key={item.href}>
                          <HoverCard openDelay={100} closeDelay={300}>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <HoverCardTrigger asChild>
                                  <div
                                    className={cn(parentClassName, "cursor-pointer")}
                                  >
                                    <div className="relative">
                                      <item.icon className="h-4 w-4 flex-shrink-0 mx-auto" />
                                      {totalBadge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center bg-red-500 text-white">
                                          {totalBadge > 9 ? "9+" : totalBadge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </HoverCardTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="font-medium">
                                {item.label}
                              </TooltipContent>
                            </Tooltip>
                            <HoverCardContent side="right" align="start" className="w-max min-w-[11rem] p-1.5 rounded-xl shadow-lg border border-border/50" sideOffset={8}>
                              <div className="space-y-0.5">
                                {/* Parent item as first entry (only if it has a navigable href and is not duplicated by a child) */}
                                {item.href && !item.href.endsWith('-parent') && !visibleChildren.some((child: any) => child.href === item.href) && (() => {
                                  const parentActive = isRouteActive(item.href) && !item.children.some((c: any) => isChildRouteActive(c, item.children));
                                  return (
                                    <Link
                                      href={item.href}
                                      onClick={() => handleNavClick(item.href)}
                                      className={cn(
                                        "flex items-center gap-2.5 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
                                        parentActive
                                          ? "bg-primary/15 text-primary"
                                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                      )}
                                    >
                                      <item.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="flex items-center gap-2 flex-1 whitespace-nowrap">
                                        {item.label}
                                      </span>
                                    </Link>
                                  );
                                })()}
                                {visibleChildren.map((child: any) => {
                                  // Locked child in popover
                                  if (child.lockedByPlan) {
                                    return (
                                      <Tooltip key={child.href} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                          <div
                                            role="menuitem"
                                            aria-disabled="true"
                                            aria-label={`${child.label}: ${child.lockedLabel || 'Disponível em planos superiores'}`}
                                            className="flex items-center gap-2.5 py-2 px-3 text-sm font-medium rounded-lg cursor-not-allowed opacity-40 text-muted-foreground/50"
                                          >
                                            <child.icon className="h-4 w-4 flex-shrink-0" />
                                            <span className="flex items-center gap-2 flex-1 whitespace-nowrap">
                                              {child.label}
                                              <Lock className="h-3 w-3 text-muted-foreground/70" />
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium">
                                          {child.lockedLabel || 'Disponível em planos superiores'}
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  }
                                  const childActive = isChildRouteActive(child, visibleChildren);
                                  const childBadge = child.href === '/pedidos' && newOrdersCount > 0 ? newOrdersCount
                                    : child.badgeKey === 'reviews' && reviewsEnabled && typeof unreadReviewCount === 'number' && unreadReviewCount > 0 ? unreadReviewCount
                                    : child.href === '/agendados' && scheduledPendingCount > 0 ? scheduledPendingCount
                                    : 0;
                                  if (child.openNewTab) {
                                    return (
                                      <a
                                        key={child.href}
                                        href={child.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          "flex items-center gap-2.5 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
                                          "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                      >
                                        <child.icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="flex items-center gap-2 flex-1 whitespace-nowrap">
                                          {child.label}
                                          {child.href === '/catalogo' && renderPendingDraftIndicator("right")}
                                          {childBadge > 0 && (
                                            <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                              {childBadge > 99 ? "99+" : childBadge}
                                            </span>
                                          )}
                                        </span>
                                      </a>
                                    );
                                  }
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={() => handleNavClick(child.href)}
                                      className={cn(
                                        "flex items-center gap-2.5 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
                                        childActive
                                          ? "bg-primary/15 text-primary"
                                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                      )}
                                    >
                                      <child.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="flex items-center gap-2 flex-1 whitespace-nowrap">
                                        {child.label}
                                        {child.href === '/catalogo' && renderPendingDraftIndicator("right")}
                                        {childBadge > 0 && (
                                          <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                            {childBadge > 99 ? "99+" : childBadge}
                                          </span>
                                        )}
                                        {child.isNew && childBadge === 0 && !(child.href === '/sugestoes' && sugestoesBadgeSeen) && (
                                          <span className="text-[9px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-200 badge-shimmer">
                                            Novo
                                          </span>
                                        )}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      );
                    }

                    return (
                      <div key={item.href}>
                        {/* Parent item */}
                        <div
                          className={cn(parentClassName, "select-none")}
                          style={{borderRadius: '12px', marginRight: '8px', marginLeft: '-2px'}}
                          onClick={() => {
                            // For items that have a navigable href (not just a parent placeholder), navigate to it
                            if (item.href && !item.href.endsWith('-parent')) {
                              handleNavClick(item.href);
                              // Always expand the submenu BEFORE navigating
                              const newState = { ...expandedMenus, [item.href]: true };
                              localStorage.setItem('expandedMenus', JSON.stringify(newState));
                              setExpandedMenus(newState);
                              navigate(item.href);
                            } else {
                              // For parent-only items (no direct page), just toggle
                              setExpandedMenus(prev => ({ ...prev, [item.href]: !prev[item.href] }));
                            }
                          }}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm flex items-center gap-2 flex-1">
                            {item.label}
                            {totalBadge > 0 && (
                               <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                {totalBadge > 99 ? "99+" : totalBadge}
                              </span>
                            )}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-200",
                              isExpanded ? "rotate-0" : "-rotate-90"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedMenus(prev => ({ ...prev, [item.href]: !prev[item.href] }));
                            }}
                          />
                        </div>
                        {/* Children */}
                        <div className={cn(
                          "overflow-hidden transition-all duration-200",
                          isExpanded ? "max-h-52 opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-red-500 pl-1">
                             {item.children.filter((child: any) => {
                               // Ocultar submenu Agendados quando agendamento não está ativado
                               if (child.href === '/agendados' && !schedulingEnabled) return false;
                               return true;
                             }).map((child: any) => {
                              // Locked child item
                              if (child.lockedByPlan) {
                                return (
                                  <Tooltip key={child.href} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <div
                                        role="menuitem"
                                        aria-disabled="true"
                                        aria-label={`${child.label}: ${child.lockedLabel || 'Disponível em planos superiores'}`}
                                        className="flex items-center gap-2.5 py-2 text-sm font-medium relative cursor-not-allowed opacity-40 text-muted-foreground/50 pl-3 pr-3"
                                        style={{borderRadius: '8px', paddingLeft: '12px', marginRight: '8px'}}
                                      >
                                        <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="text-sm flex items-center gap-2">
                                          {child.label}
                                          <Lock className="h-3 w-3 text-muted-foreground/70" />
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-medium">
                                      {child.lockedLabel || 'Disponível em planos superiores'}
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                              const childActive = isChildRouteActive(child, item.children);
                              const childBadge = child.href === '/pedidos' && newOrdersCount > 0 ? newOrdersCount
                                : child.badgeKey === 'reviews' && reviewsEnabled && typeof unreadReviewCount === 'number' && unreadReviewCount > 0 ? unreadReviewCount
                                : child.href === '/agendados' && scheduledPendingCount > 0 ? scheduledPendingCount
                                : 0;
                              if (child.openNewTab) {
                                return (
                                  <a
                                    key={child.href}
                                    href={child.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "flex items-center justify-between py-2 text-sm font-medium transition-colors duration-200 relative",
                                      "pl-3 pr-3",
                                      "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                    style={{borderRadius: '8px', paddingLeft: '12px', marginRight: '8px'}}
                                  >
                                    <span className="flex items-center gap-2.5">
                                      <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="text-sm">{child.label}</span>
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 opacity-50 flex-shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  </a>
                                );
                              }
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => handleNavClick(child.href)}
                                  className={cn(
                                    "flex items-center gap-2.5 py-2 text-sm font-medium transition-colors duration-200 relative",
                                    "pl-3 pr-3",
                                    childActive
                                      ? "bg-primary/15 text-primary rounded-xl"
                                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                  )}
                                  style={{borderRadius: '8px', paddingLeft: '12px', marginRight: '8px'}}
                                >
                                  <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-sm flex items-center gap-2">
                                    {child.label}
                                    {child.href === '/catalogo' && renderPendingDraftIndicator("right")}
                                    {childBadge > 0 && (
                                      <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                        {childBadge > 99 ? "99+" : childBadge}
                                      </span>
                                    )}
                                    {child.isNew && childBadge === 0 && !(child.href === '/sugestoes' && sugestoesBadgeSeen) && (
                                      <span className="text-[9px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-200 badge-shimmer">
                                        Novo
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ===== LOCKED MENU ITEM (plan restriction) =====
                  if (item.lockedByPlan) {
                    const lockedContent = (
                      <div
                        className={cn(
                          "flex items-center gap-2.5 py-2.5 text-sm font-medium relative cursor-not-allowed opacity-40 text-muted-foreground/50",
                          sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3"
                        )}
                        style={!sidebarCollapsed ? {borderRadius: '12px', marginRight: '8px', marginLeft: '-2px'} : undefined}
                      >
                        <item.icon className={cn("h-4 w-4 flex-shrink-0", sidebarCollapsed && "mx-auto")} />
                        {!sidebarCollapsed && (
                          <span className="text-sm flex items-center gap-2 flex-1">
                            {item.label}
                            <Lock className="h-3 w-3 text-muted-foreground/70" />
                          </span>
                        )}
                      </div>
                    );

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.href} delayDuration={0}>
                          <TooltipTrigger asChild>
                            {lockedContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            <p>{item.label}</p>
                            <p className="text-xs text-muted-foreground">{formatLockedLabel(item.lockedLabel || 'Disponível em planos superiores')}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          {lockedContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          <p>{formatLockedLabel(item.lockedLabel || 'Disponível em planos superiores')}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  // ===== REGULAR MENU ITEM =====
                  const isActive = !item.disabled && (location === item.href ||
                    (item.href !== "/" && location.startsWith(item.href)));

                  const showOrderBadge = item.href === "/pedidos" && newOrdersCount > 0;
                  const showStockBadge = item.href === "/estoque" && outOfStockCount > 0;
                  const isComingSoon = item.comingSoon === true;

                  const navContent = (
                    <>
                      <div className="relative">
                        <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          sidebarCollapsed && "mx-auto",
                          isComingSoon && "opacity-50"
                        )} />
                        {showOrderBadge && sidebarCollapsed && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center",
                            isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                          )}>
                            {newOrdersCount > 9 ? "9+" : newOrdersCount}
                          </span>
                        )}
                        {showStockBadge && sidebarCollapsed && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center",
                            isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                          )}>
                            {outOfStockCount > 9 ? "9+" : outOfStockCount}
                          </span>
                        )}
                         {item.isNew && sidebarCollapsed && !showOrderBadge && !showStockBadge && !(item.href === '/sugestoes' && sugestoesBadgeSeen) && (
                           <span className="absolute -top-1 -right-2 text-[7px] font-semibold bg-red-50 text-red-500 px-1 py-0.5 rounded leading-none border border-red-200 badge-shimmer">
                             N
                           </span>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <span className={cn(
                          "text-sm flex items-center gap-2",
                          isComingSoon && "opacity-50"
                        )}>
                          {item.label}
                          {showOrderBadge && (
                            <span className={cn(
                              "text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center",
                              isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                            )}>
                              {newOrdersCount > 99 ? "99+" : newOrdersCount}
                            </span>
                          )}
                          {showStockBadge && (
                            <span className={cn(
                              "text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center",
                              isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                            )}>
                              {outOfStockCount > 99 ? "99+" : outOfStockCount}
                            </span>
                          )}
                          {isComingSoon && (
                            <span className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-lg">
                              Breve
                            </span>
                          )}
                           {item.isNew && !showOrderBadge && !showStockBadge && !isComingSoon && !(item.href === '/sugestoes' && sugestoesBadgeSeen) && (
                             <span className="text-[9px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-200 badge-shimmer">
                               Novo
                             </span>
                          )}
                        </span>
                      )}
                    </>
                  );

                  const navClassName = cn(
                    "flex items-center gap-2.5 py-2.5 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                    sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3",
                    isComingSoon
                      ? "text-muted-foreground cursor-default"
                      : isActive
                        ? "bg-primary/15 text-primary rounded-xl"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  );

                  if (item.disabled) {
                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.href} delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div className={navClassName}>
                              {navContent}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            <p>{item.label}</p>
                            <p className="text-xs text-blue-400">Funcionalidade em desenvolvimento</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div
                            className={navClassName}
                            style={{borderRadius: '12px'}}
                          >
                            {navContent}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          <p>Funcionalidade em desenvolvimento</p>
                          <p className="text-xs text-blue-400">Disponível em breve!</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={() => handleNavClick(item.href)}
                            className={navClassName}
                          >
                            {navContent}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleNavClick(item.href)}
                      className={navClassName} style={{borderRadius: '12px', marginRight: '8px', marginLeft: '-2px'}}
                    >
                      {navContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Toggle para ocultar/mostrar menus bloqueados */}
          {(isLitePlan || isNotProPlan) && !sidebarCollapsed && (
            <div className="mt-4 px-3 pb-2">
              <button
                onClick={() => {
                  const newVal = !hideLockedItems;
                  setHideLockedPreference(String(newVal));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
              >
                {hideLockedItems ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{hideLockedItems ? 'Mostrar todos os menus' : 'Ocultar bloqueados'}</span>
              </button>
            </div>
          )}
          {(isLitePlan || isNotProPlan) && sidebarCollapsed && (
            <div className="mt-4 flex justify-center pb-2">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      const newVal = !hideLockedItems;
                      setHideLockedPreference(String(newVal));
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                  >
                    {hideLockedItems ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {hideLockedItems ? 'Mostrar todos os menus' : 'Ocultar bloqueados'}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

        </nav>

      </aside>

      {/* Main content */}
      <div
        className={cn("transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-screen overflow-hidden flex flex-col bg-background", mainPadding)}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[58px] bg-card/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between h-full px-3 md:px-6">
            {/* Left side */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => { setSidebarCollapsed(false); setSidebarOpen(true); }}
                className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
              >
                <Menu className="h-4 w-4" />
              </button>


              {/* Search - escondido no Banking e Sugestões */}
              <div className={`${location.startsWith('/banking') || location.startsWith('/sugestoes') ? 'hidden' : location.startsWith('/mesas') ? 'flex flex-1' : 'hidden sm:flex'} relative items-center`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar produtos, pedidos, clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 h-9 text-sm bg-background border-border/50 rounded-lg focus:ring-2 focus:ring-primary/20 w-full sm:w-[310px] ${searchQuery ? 'pr-14' : 'pr-3'}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-red-500 hover:text-red-500 transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Tempo Médio de Preparo - Desktop only (escondido no Lite e no Banking) */}
              {!isLitePlan && !location.startsWith('/banking') && <AvgPrepTimeButton establishmentId={establishment?.id} />}

              <PendingPixIndicator />

              {/* Ver Menu Button */}
              {establishment?.menuSlug && (
                <Tooltip open={menuTooltipDismissed ? false : undefined}>
                  <TooltipTrigger asChild>
                    <a
                      href={`/menu/${establishment.menuSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (!menuTooltipDismissed) {
                          setMenuTooltipDismissed(true);
                          localStorage.setItem('tooltip_viewMenu_clicked', 'true');
                        }
                      }}
                      className="hidden md:flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors" style={{borderRadius: '10px'}}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Ver menu</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Abrir cardápio público em nova aba
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Badge Trial - apenas admin */}
              {trialInfo?.isTrial && !isCollaborator && (
                <Popover>
                  <Tooltip open={trialTooltipDismissed ? false : undefined}>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          onClick={() => {
                            if (!trialTooltipDismissed) {
                              setTrialTooltipDismissed(true);
                              localStorage.setItem('tooltip_trial_clicked', 'true');
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-medium transition-colors border",
                            trialInfo.daysRemaining <= 3
                              ? "bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-500/50 text-red-500 dark:text-red-300 border-red-300 dark:border-red-500/50"
                              : "bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
                          )}
                          style={{ borderRadius: '10px' }}
                        >
                          <Clock className={cn("h-3.5 w-3.5 shrink-0", trialInfo.daysRemaining <= 3 && "text-red-500 dark:text-red-400")} />
                          {/* Mobile: apenas ícone | Desktop: texto completo */}
                          <span className="hidden md:inline">Teste gratuito: {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? 'dia' : 'dias'}</span>
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Clique para ver detalhes do seu período de avaliação
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-72 p-4" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Período de Avaliação</p>
                          <p className="text-xs text-muted-foreground">{trialInfo.trialDays} dias gratuitos</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-100 dark:border-amber-800/30">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          {trialInfo.trialExpired
                            ? 'Seu período de avaliação expirou. Faça upgrade para continuar usando todas as funcionalidades.'
                            : `Você ainda tem ${trialInfo.daysRemaining} ${trialInfo.daysRemaining === 1 ? 'dia' : 'dias'} restantes na sua avaliação gratuita.`
                          }
                        </p>
                      </div>
                      {/* Barra de progresso */}
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-colors"
                          style={{ width: `${Math.max(0, ((trialInfo.trialDays! - trialInfo.daysRemaining) / trialInfo.trialDays!) * 100)}%` }}
                        />
                      </div>
                      <Link href="/planos">
                        <Button className="w-full bg-red-500 hover:bg-red-500 text-white animate-upgrade-cta-pulse shadow-md shadow-red-500/25 transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/40" size="sm">
                          <Crown className="h-4 w-4 mr-2" />
                          Fazer upgrade agora
                        </Button>
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Botão de Som de Notificação - admin e colaboradores (escondido no Lite) */}
              {!isLitePlan && <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-accent bg-card"
                  >
                    {/* Ícone de Som com 2 ondas de volume - cor dinâmica */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={isSoundEnabled ? "#10b981" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-colors">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={isSoundEnabled ? "#10b981" : "#f87171"} />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>

                    {/* Toggle Switch - mesmo estilo do toggle de abrir/fechar restaurante */}
                    <Switch
                      checked={isSoundEnabled}
                      onCheckedChange={async (checked) => {
                        // Função auxiliar para tocar som de teste
                        const playTestSound = () => {
                          // Pequeno delay para garantir que o áudio está pronto
                          setTimeout(() => {
                            const testAudio = new Audio("/notification.mp3");
                            testAudio.volume = 0.5;
                            testAudio.play().catch(err => {
                              console.log("[Som] Erro ao tocar som de teste:", err);
                            });
                          }, 100);
                        };

                        if (checked) {
                          // Ativando o som
                          // Sempre tentar desbloquear o áudio ao ativar (necessário para mobile)
                          if (!isAudioUnlocked) {
                            await unlockAudio();
                          }
                          setIsSoundEnabled(true);
                          localStorage.setItem("notificationSoundEnabled", "true");
                          // Tocar som de teste breve ao ativar
                          playTestSound();
                          toast.success("Som ativado!", {
                            description: "Você receberá notificações sonoras para novos pedidos.",
                          });
                        } else {
                          // Desativando o som
                          setIsSoundEnabled(false);
                          localStorage.setItem("notificationSoundEnabled", "false");
                          toast.info("Som desativado");
                        }
                      }}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 dark:data-[state=unchecked]:bg-red-500 scale-90"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isSoundEnabled
                    ? "Som ativado - clique para desativar"
                    : "Som desativado - clique para ativar"
                  }
                </TooltipContent>
              </Tooltip>}

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-accent">
                    <Avatar className="h-7 w-7 ring-2 ring-border/50">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {(establishment?.ownerDisplayName || user.name)?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-semibold max-w-[100px] truncate">
                        {isCollaborator ? collaboratorSession?.name : (establishment?.ownerDisplayName || user.name || "Usu\u00e1rio")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{isCollaborator ? 'Colaborador' : 'Admin'}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-elevated border-border/50">
                  {/* Container Aberto/Fechado - Combina horários automáticos com fechamento manual */}
                  {establishment && (
                    <div className="px-3 py-2 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            isOperationalStatusLoading
                              ? "bg-muted-foreground/50"
                              : calculatedIsOpen
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/50"
                          )} />
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-sm font-medium",
                              isOperationalStatusLoading
                                ? "text-muted-foreground"
                                : calculatedIsOpen
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                            )}>
                              {isOperationalStatusLoading ? "Carregando..." : calculatedIsOpen ? "Aberto agora" : "Fechado agora"}
                            </span>
                            {!isOperationalStatusLoading && isForcedClosed && (
                              <span className="text-[10px] text-amber-600">
                                Fechado manualmente
                              </span>
                            )}
                            {!isOperationalStatusLoading && isForcedOpen && (
                              <span className="text-[10px] text-blue-600">
                                Aberto manualmente
                              </span>
                            )}
                            {!isOperationalStatusLoading && !calculatedIsOpen && statusMessage && (
                              <span className="text-[10px] text-muted-foreground">
                                {statusMessage}
                              </span>
                            )}
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={!isOperationalStatusLoading && calculatedIsOpen}
                                onCheckedChange={handleToggleOpen}
                                disabled={isOperationalStatusLoading || toggleOpenMutation.isPending}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-400 scale-90"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px]">
                            <p className="text-xs">
                              {isOperationalStatusLoading
                                ? "Carregando status da loja..."
                                : calculatedIsOpen
                                  ? "Desative para fechar a loja manualmente (imprevistos, força maior). A loja reabrirá automaticamente no próximo horário configurado."
                                  : "Ative para abrir a loja manualmente agora."}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                  <div className="p-1">
                    <DropdownMenuItem
                      className="rounded-lg cursor-pointer"
                      onSelect={() => { window.location.href = "/ajuda"; }}
                    >
                      <HelpCircle className="h-4 w-4 mr-2.5" />
                      Ajuda e suporte
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-lg cursor-pointer"
                      onSelect={() => setFeedbackOpen(true)}
                    >
                      <MessageSquarePlus className="h-4 w-4 mr-2.5" />
                      Enviar Feedback
                    </DropdownMenuItem>
                    {!isCollaborator && (
                      <DropdownMenuItem
                        className="rounded-lg cursor-pointer"
                        onSelect={() => window.location.href = '/planos'}
                      >
                        <Crown className="h-4 w-4 mr-2.5" />
                        Planos
                      </DropdownMenuItem>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {/* Tema */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-xs font-medium text-muted-foreground">Tema</p>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={toggleTheme}
                      className="rounded-lg cursor-pointer"
                    >
                      {theme === 'dark' ? (
                        <Moon className="h-4 w-4 mr-2.5 text-blue-500" />
                      ) : (
                        <Sun className="h-4 w-4 mr-2.5 text-amber-500" />
                      )}
                      {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                      <span className="ml-auto text-[10px] text-muted-foreground">Ativado</span>
                    </DropdownMenuItem>
                  </div>
                  {!isCollaborator && (
                    <>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <div className="p-1">
                      {(estCountData?.count ?? 0) > 1 ? (
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer"
                          onSelect={() => { window.location.href = "/login?select=1"; }}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2.5" />
                          Trocar restaurante
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer"
                          onSelect={() => { window.location.href = "/onboarding"; }}
                        >
                          <Plus className="h-4 w-4 mr-2.5" />
                          Novo restaurante
                        </DropdownMenuItem>
                      )}
                    </div>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={() => {
                        // P15: Limpar cookie collaborator_info em vez de localStorage
                        document.cookie = 'collaborator_info=; path=/; max-age=0';
                        logout();
                      }}
                      className="text-destructive cursor-pointer rounded-lg focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2.5" />
                      Sair
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Banner de WhatsApp desconectado - acima do conteúdo (escondido no Lite) */}
        {!isLitePlan && <WhatsAppDisconnectedBanner />}

        {/* Banner de fechamento programado próximo - abaixo do topbar (escondido na página de settings, onde é renderizado dentro do conteúdo) */}
        {!location.startsWith("/configuracoes") && <ScheduledClosureBanner className="mx-3 md:mx-6 mt-2" />}

        {/* Page content */}
        <main key={sessionRenderKey} className="flex-1 overflow-auto p-3 md:p-6 [&:has(>[data-settings-page])]:overflow-hidden [&:has(>[data-settings-page])]:p-0">
          {children}
        </main>
      </div>

      {/* Chat WhatsApp Widget (escondido no Lite, Banking, PDV, Mesas e Configurações) */}
      {!isLitePlan && !location.startsWith("/banking") && !location.startsWith("/pdv") && !location.startsWith("/mesas") && !location.startsWith("/configuracoes") && !location.startsWith("/impressora") && !location.startsWith("/teste") && <WhatsAppChatWidget />}

      {/* Cash Reminder Modal */}
      {!isLitePlan && <CashReminderModal establishmentId={establishment?.id} />}
      {/* Modal de Feedback */}
      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        establishmentId={establishment?.id}
        establishmentName={establishment?.name}
      />

      {/* Modal obrigatório de upgrade quando trial expira - apenas admin */}
      {/* Não mostra na página de planos (exceção) */}
      {trialInfo?.trialExpired && location !== "/planos" && !isCollaborator && (
        <TrialExpiredModal reason={trialInfo.blockReason} planType={trialInfo.planType} />
      )}
    </div>
  );
}
