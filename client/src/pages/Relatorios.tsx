import { AdminLayout } from "@/components/AdminLayout";
import { ABCInfoModal } from "@/components/ABCInfoModal";
import { DREInfoModal } from "@/components/DREInfoModal";
import CardIndicadoresMargem from "@/components/CardIndicadoresMargem";
import { StatCard } from "@/components/shared";
import { SlidingTabs } from "@/components/SlidingTabs";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { DateRangePickerSales } from "@/components/DateRangePickerSales";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Activity,
  TrendingDown,
  CalendarDays,
  Monitor,
  Smartphone,
  UtensilsCrossed,
  Package,
  FileText,
  Shield,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Clock,
  Zap,
  AlertCircle,
  Timer,
  Megaphone,
  Target,
  Lightbulb,
  Star,
  Receipt,
  Trophy,
  Info,
  Loader2,
  Download,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { usePreference } from "@/hooks/usePreference";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from "recharts";

// ============ TIPOS ============
type PeriodType = "today" | "week" | "month" | "custom";
type ReportTab = "overview" | "products" | "dre" | "clients" | "operational" | "marketing";

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "today", label: "Hoje" },
];

const reportTabs: { value: ReportTab; label: string }[] = [
  { value: "overview", label: "Visão Geral" },
  { value: "products", label: "Produtos (ABC/CMV)" },
  { value: "dre", label: "DRE / Financeiro" },
  { value: "clients", label: "Clientes & LTV" },
  { value: "operational", label: "Operacional" },
  { value: "marketing", label: "Marketing & ROI" },
];

// ============ DADOS MOCKADOS ============

// Dados mockados removidos — Sazonalidade e Canal agora usam dados reais do backend

const channelIcons = {
  monitor: Monitor,
  smartphone: Smartphone,
  utensils: UtensilsCrossed,
};

const classeColors = {
  A: { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", bar: "#22c55e" },
  B: { bg: "bg-amber-100 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-400", bar: "#f59e0b" },
  C: { bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-500 dark:text-red-400", bar: "#ef4444" },
};

// gaugeColorMap é usado pelo CardIndicadoresMargem
const gaugeColorMap: Record<string, { bar: string; bg: string }> = {
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/30" },
  amber: { bar: "bg-amber-500", bg: "bg-amber-100 dark:bg-amber-950/30" },
  red: { bar: "bg-red-500", bg: "bg-red-100 dark:bg-red-950/30" },
};

// ============ DADOS MOCKADOS: OPERACIONAL ============
const tempoPreparoData = [
  { categoria: "Lanches", tempoReal: 12, meta: 15, pedidos: 342 },
  { categoria: "Pizzas", tempoReal: 22, meta: 20, pedidos: 186 },
  { categoria: "Massas", tempoReal: 18, meta: 20, pedidos: 148 },
  { categoria: "Saladas", tempoReal: 8, meta: 10, pedidos: 95 },
  { categoria: "Sobremesas", tempoReal: 10, meta: 12, pedidos: 78 },
  { categoria: "Bebidas", tempoReal: 3, meta: 5, pedidos: 420 },
  { categoria: "Porções", tempoReal: 14, meta: 15, pedidos: 112 },
  { categoria: "Combos", tempoReal: 16, meta: 18, pedidos: 205 },
];

const tempoMedioGeral = Math.round(tempoPreparoData.reduce((s, c) => s + c.tempoReal * c.pedidos, 0) / tempoPreparoData.reduce((s, c) => s + c.pedidos, 0));

// ============ DADOS MOCKADOS: MARKETING & ROI ============
const campanhasData = [
  { nome: "Cupom 10% Primeira Compra", tipo: "Cupom", investimento: 0, retorno: 4850, roi: Infinity, pedidos: 97, novosClientes: 82, status: "ativa" as const },
  { nome: "Combo Família Domingo", tipo: "Promoção", investimento: 350, retorno: 3200, roi: 814, pedidos: 64, novosClientes: 12, status: "ativa" as const },
  { nome: "Story Instagram - Pizza", tipo: "Ads", investimento: 800, retorno: 5600, roi: 600, pedidos: 112, novosClientes: 45, status: "ativa" as const },
  { nome: "Google Ads Local", tipo: "Ads", investimento: 1200, retorno: 4800, roi: 300, pedidos: 96, novosClientes: 68, status: "ativa" as const },
  { nome: "Fidelidade 10 = 1 Grátis", tipo: "Fidelidade", investimento: 480, retorno: 8900, roi: 1754, pedidos: 178, novosClientes: 0, status: "ativa" as const },
  { nome: "Panfleto Bairro Centro", tipo: "Offline", investimento: 600, retorno: 1200, roi: 100, pedidos: 24, novosClientes: 18, status: "encerrada" as const },
  { nome: "Desconto Aniversariante", tipo: "Cupom", investimento: 220, retorno: 1800, roi: 718, pedidos: 36, novosClientes: 8, status: "ativa" as const },
  { nome: "Parceria iFood Destaque", tipo: "Marketplace", investimento: 1500, retorno: 6200, roi: 313, pedidos: 155, novosClientes: 95, status: "ativa" as const },
];

const totalInvestimento = campanhasData.reduce((s, c) => s + c.investimento, 0);
const totalRetorno = campanhasData.reduce((s, c) => s + c.retorno, 0);
const totalPedidosMkt = campanhasData.reduce((s, c) => s + c.pedidos, 0);
const totalNovosClientes = campanhasData.reduce((s, c) => s + c.novosClientes, 0);
const roiGeral = totalInvestimento > 0 ? Math.round(((totalRetorno - totalInvestimento) / totalInvestimento) * 100) : 0;

const campanhaChartData = campanhasData
  .filter(c => c.investimento > 0)
  .sort((a, b) => b.roi - a.roi)
  .map(c => ({
    nome: c.nome.length > 20 ? c.nome.slice(0, 18) + "..." : c.nome,
    nomeCompleto: c.nome,
    investimento: c.investimento,
    retorno: c.retorno,
    roi: c.roi,
  }));

const melhorCampanha = campanhasData.reduce((a, b) => a.roi > b.roi ? a : b);
const melhorCusto = campanhasData.filter(c => c.investimento > 0).reduce((a, b) => (a.retorno / a.investimento) > (b.retorno / b.investimento) ? a : b);
const maisNovosClientes = campanhasData.reduce((a, b) => a.novosClientes > b.novosClientes ? a : b);
const categoriaMaisRapida = tempoPreparoData.reduce((a, b) => a.tempoReal < b.tempoReal ? a : b);
const categoriaGargalo = tempoPreparoData.reduce((a, b) => (a.tempoReal - a.meta) > (b.tempoReal - b.meta) ? a : b);
const maxTempo = Math.max(...tempoPreparoData.map(c => Math.max(c.tempoReal, c.meta))) + 5;

const SEASONALITY_MIN_SAMPLE_ORDERS = 30;

function getHeatColor(value: number, maxValue: number): string {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  if (intensity < 0.2) return "bg-red-50 dark:bg-red-950/20 text-red-400 dark:text-red-300";
  if (intensity < 0.4) return "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-300";
  if (intensity < 0.55) return "bg-red-200 dark:bg-red-500/50 text-red-500 dark:text-red-200";
  if (intensity < 0.7) return "bg-red-300 dark:bg-red-500/60 text-red-500 dark:text-red-100";
  if (intensity < 0.85) return "bg-red-400 dark:bg-red-500/70 text-white";
  return "bg-red-500 dark:bg-red-500 text-white font-semibold";
}

// ============ HELPERS ============
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

// ============ TOOLTIPS CUSTOMIZADOS ============
function WeeklyTooltip({ active, payload, label, meta }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400">
        Faturamento: {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      {meta != null && (
        <p className="text-red-500 mt-0.5">
          Meta: {formatCurrency(meta)}
        </p>
      )}
    </div>
  );
}

function MonthlyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex justify-between gap-4">
          <span>{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ============ EXPORT HELPER ============
function buildExportUrl(type: "dre" | "abc", format: "pdf" | "excel", period: string, customStart?: string, customEnd?: string) {
  const params = new URLSearchParams({ period });
  if (period === "custom" && customStart && customEnd) {
    params.set("startDate", customStart);
    params.set("endDate", customEnd);
  }
  return `/api/export/${type}/${format}?${params.toString()}`;
}

function ExportDropdown({ type, period, customStart, customEnd, disabled }: {
  type: "dre" | "abc";
  period: string;
  customStart?: string;
  customEnd?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "pdf" | "excel") => {
    setLoading(true);
    try {
      const url = buildExportUrl(type, format, period, customStart, customEnd);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      let filename = `${type === "dre" ? "DRE" : "Curva_ABC"}.${format === "pdf" ? "pdf" : "xlsx"}`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success(`${format === "pdf" ? "PDF" : "Excel"} exportado com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao exportar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          className="gap-1.5 text-xs"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 cursor-pointer">
          <FileDown className="h-4 w-4 text-red-500" />
          <span>Exportar PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Exportar Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============ COMPONENTE PRINCIPAL ============
export default function Relatorios() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id ?? null;
  const [, navigate] = useLocation();

  // Estado do período
  const [period, setPeriod] = useState<PeriodType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reportsPeriod");
      if (saved && ["today", "week", "month", "custom"].includes(saved)) {
        return saved as PeriodType;
      }
    }
    return "month";
  });

  // Aba ativa
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [abcInfoOpen, setAbcInfoOpen] = useState(false);
  const [dreInfoOpen, setDreInfoOpen] = useState(false);

  // Preferências persistidas no banco
  const [abcSeen, setAbcSeen] = usePreference('abc_info_seen');
  const [dreSeen, setDreSeen] = usePreference('dre_info_seen');

  // Auto-abrir modal ABC na primeira vez que o usuário acessa a aba Produtos
  useEffect(() => {
    if (activeTab === "products" && abcSeen !== 'true') {
      setAbcInfoOpen(true);
      setAbcSeen('true');
    }
  }, [activeTab, abcSeen]);

  // Auto-abrir modal DRE na primeira vez que o usuário acessa a aba DRE
  useEffect(() => {
    if (activeTab === "dre" && dreSeen !== 'true') {
      setDreInfoOpen(true);
      setDreSeen('true');
    }
  }, [activeTab, dreSeen]);

  // Datas customizadas
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [showCustom, setShowCustom] = useState(false);


  const handlePeriodChange = useCallback((val: PeriodType) => {
    setPeriod(val);
    localStorage.setItem("reportsPeriod", val);
    if (val === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  }, []);

  // Input estável para a query
  const queryInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      period,
      ...(period === "custom" ? { startDate: customStart, endDate: customEnd } : {}),
    }),
    [establishmentId, period, customStart, customEnd]
  );

  // Query de KPIs
  const { data: kpis, isLoading: kpisLoading } = trpc.reports.kpis.useQuery(queryInput, {
    enabled: !!establishmentId,
  });

  // Query Curva ABC de Produtos
  const { data: abcData, isLoading: abcLoading } = trpc.reports.productsABC.useQuery(queryInput, {
    enabled: !!establishmentId,
  });

  // Query Performance Semanal
  const { data: weeklyData, isLoading: weeklyLoading } = trpc.reports.weeklyPerformance.useQuery(queryInput, {
    enabled: !!establishmentId,
  });

  // Query Mapa de Sazonalidade
  const { data: seasonalityData, isLoading: seasonalityLoading } = trpc.reports.seasonalityMap.useQuery(queryInput, {
    enabled: !!establishmentId,
  });

  const seasonalityTotalOrders = useMemo(() => {
    if (!seasonalityData?.heatmap) return 0;
    return seasonalityData.heatmap.reduce(
      (total, row) => total + row.reduce((rowTotal, value) => rowTotal + value, 0),
      0
    );
  }, [seasonalityData]);
  const hasLowSeasonalitySample =
    !!seasonalityData &&
    seasonalityData.maxValue > 0 &&
    seasonalityTotalOrders < SEASONALITY_MIN_SAMPLE_ORDERS;

  const seasonalityVisibleRows = useMemo(() => {
    if (!seasonalityData?.hours || !seasonalityData?.heatmap) return [];

    const activeRowIndexes = seasonalityData.heatmap
      .map((row, index) => ({
        index,
        total: row.reduce((rowTotal, value) => rowTotal + value, 0),
      }))
      .filter(({ total }) => total > 0)
      .map(({ index }) => index);

    if (activeRowIndexes.length === 0) {
      return seasonalityData.hours.map((hour, rowIdx) => ({ hour, rowIdx }));
    }

    const firstActiveRow = Math.min(...activeRowIndexes);
    const lastActiveRow = Math.max(...activeRowIndexes);

    return seasonalityData.hours
      .slice(firstActiveRow, lastActiveRow + 1)
      .map((hour, offset) => ({ hour, rowIdx: firstActiveRow + offset }));
  }, [seasonalityData]);

  // Query Performance por Canal (reutiliza finance.revenueByChannel)
  const channelQueryInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      period: (period === 'today' ? 'today' : period === 'week' ? 'week' : 'month') as 'today' | 'week' | 'month',
      ...(period === 'custom' ? { customStart, customEnd } : {}),
    }),
    [establishmentId, period, customStart, customEnd]
  );
  const { data: channelDataReal, isLoading: channelLoading } = trpc.finance.revenueByChannel.useQuery(channelQueryInput, {
    enabled: !!establishmentId,
  });

  // Query Evolução Mensal (reutiliza finance.getMonthlyComparison)
  const monthlyCompInput = useMemo(
    () => ({ establishmentId: establishmentId! }),
    [establishmentId]
  );
  const { data: monthlyComp, isLoading: monthlyCompLoading } = trpc.finance.getMonthlyComparison.useQuery(monthlyCompInput, {
    enabled: !!establishmentId,
  });

  // Dados transformados para o card Evolução Mensal (adiciona lucro)
  const monthlyEvolutionReal = useMemo(() => {
    if (!monthlyComp?.months) return [];
    return monthlyComp.months.map((m) => ({
      name: m.label.split(' ')[0], // "Jan 2026" -> "Jan"
      receita: m.receitas,
      despesas: m.despesas,
      lucro: m.receitas - m.despesas,
    }));
  }, [monthlyComp]);

  // DRE
  const { data: dreDataReal, isLoading: dreLoading } = trpc.reports.dre.useQuery(queryInput, {
    enabled: !!establishmentId,
  });

  // Dados derivados do DRE para indicadores e saúde financeira
  const dreComputed = useMemo(() => {
    if (!dreDataReal) return null;
    const d = dreDataReal;
    const margemBruta = d.grossMargin;
    const margemLiquida = d.operatingMargin;
    const cmvPercent = d.cmvPercentage;

    const indicadores = [
      {
        label: "Margem Bruta",
        valor: margemBruta,
        meta: 65,
        descricao: "Receita após CMV",
        color: margemBruta >= 60 ? "emerald" : margemBruta >= 50 ? "amber" : "red",
      },
      {
        label: "Margem Líquida",
        valor: margemLiquida,
        meta: 15,
        descricao: "Lucro final sobre receita",
        color: margemLiquida >= 12 ? "emerald" : margemLiquida >= 8 ? "amber" : "red",
      },
      {
        label: "CMV / Receita",
        valor: cmvPercent,
        meta: 35,
        descricao: "Custo de mercadoria vendida",
        color: cmvPercent <= 35 ? "emerald" : cmvPercent <= 40 ? "amber" : "red",
        inverted: true,
      },
    ];

    // Saúde financeira
    const score =
      (margemBruta >= 60 ? 2 : margemBruta >= 50 ? 1 : 0) +
      (margemLiquida >= 12 ? 2 : margemLiquida >= 8 ? 1 : 0) +
      (cmvPercent <= 35 ? 2 : cmvPercent <= 40 ? 1 : 0);

    let saude;
    if (score >= 5) saude = { status: "Saudável", icon: CheckCircle2, color: "emerald", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", diagnostico: "Seu restaurante apresenta margens saudáveis e custos controlados. Continue monitorando para manter a performance.", dicas: ["Reinvista parte do lucro em marketing para crescer", "Negocie com fornecedores para melhorar ainda mais o CMV", "Considere expandir o cardápio com itens de alta margem"] };
    else if (score >= 3) saude = { status: "Atenção", icon: AlertTriangle, color: "amber", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", diagnostico: "Alguns indicadores estão abaixo do ideal. Revise custos e margens para evitar prejuízos.", dicas: ["Revise os preços dos itens com menor margem", "Renegocie contratos de aluguel e fornecedores", "Reduza desperdício com controle de estoque mais rigoroso"] };
    else saude = { status: "Crítico", icon: XCircle, color: "red", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-500 dark:text-red-400", diagnostico: "As margens estão comprimidas e o resultado operacional está em risco. Ações urgentes são necessárias.", dicas: ["Aumente preços dos itens mais vendidos em pelo menos 10%", "Corte despesas não essenciais imediatamente", "Revise o cardápio e elimine itens com margem negativa"] };

    return { indicadores, saude };
  }, [dreDataReal]);

  // ============ RENDER ============
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Título + Filtros de período */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Relatórios
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Análise completa do seu restaurante
            </p>
          </div>

          {/* Filtro de período (lado direito) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-muted rounded-xl p-1">
              <DateRangePickerSales
                startDate={customStart}
                endDate={customEnd}
                onApply={(start, end) => {
                  setCustomStart(start);
                  setCustomEnd(end);
                  handlePeriodChange("custom");
                }}
                triggerClassName="flex items-center gap-2 rounded-lg cursor-pointer transition-colors px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                triggerLabel="Filtro"
                triggerIcon="sliders"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Faturamento"
          value={formatCurrency(kpis?.revenue ?? 0)}
          icon={DollarSign}
          loading={kpisLoading}
          variant="emerald"
          trend={
            kpis
              ? {
                  value: kpis.revenueChange,
                  isPositive: kpis.revenueChange >= 0,
                  label: "vs período anterior",
                }
              : undefined
          }
        />
        <button
          type="button"
          onClick={() => navigate("/pedidos/historico")}
          className="block text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Abrir histórico de pedidos"
        >
          <StatCard
            title="Pedidos"
            value={kpis?.ordersCount ?? 0}
            icon={ShoppingBag}
            loading={kpisLoading}
            variant="blue"
            trend={
              kpis
                ? {
                    value: kpis.ordersChange,
                    isPositive: kpis.ordersChange >= 0,
                    label: "vs período anterior",
                  }
                : undefined
            }
            className="cursor-pointer"
          />
        </button>
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(kpis?.avgTicket ?? 0)}
          icon={TrendingUp}
          loading={kpisLoading}
          variant="amber"
          trend={
            kpis
              ? {
                  value: kpis.avgTicketChange,
                  isPositive: kpis.avgTicketChange >= 0,
                  label: "vs período anterior",
                }
              : undefined
          }
        />
        <button
          type="button"
          onClick={() => navigate("/clientes")}
          className="block text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Abrir página de clientes"
        >
          <StatCard
            title="Clientes Ativos"
            value={kpis?.customers ?? 0}
            icon={Users}
            loading={kpisLoading}
            variant="primary"
            trend={
              kpis
                ? {
                    value: kpis.customersChange,
                    isPositive: kpis.customersChange >= 0,
                    label: "vs período anterior",
                  }
                : undefined
            }
            className="cursor-pointer"
          />
        </button>
      </div>

      {/* ============ ABAS DE NAVEGAÇÃO ============ */}
      <div className="border-b border-border/60 mb-6">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
          {reportTabs.map((tab) => {
            const isDisabled = tab.value === "clients" || tab.value === "marketing" || tab.value === "operational";
            return (
              <button
                key={tab.value}
                onClick={() => !isDisabled && setActiveTab(tab.value)}
                disabled={isDisabled}
                className={`
                  relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors
                  ${isDisabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : activeTab === tab.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/80"
                  }
                `}
              >
                {tab.label}
                {isDisabled && <span className="ml-1 text-[10px] text-muted-foreground/40">(em breve)</span>}
                {/* Indicador ativo */}
                {activeTab === tab.value && !isDisabled && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ============ CONTEÚDO DA ABA ATIVA ============ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Row: Performance Semanal (60%) + Evolução Mensal (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Card Performance Semanal - 3/5 = 60% */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 p-5">
            {weeklyLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-3">Carregando performance...</p>
              </div>
            ) : !weeklyData || weeklyData.weeks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sem dados de performance</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Selecione outro período ou aguarde novas vendas</p>
              </div>
            ) : (() => {
              const wpData = weeklyData.weeks;
              const totalFaturamento = weeklyData.totalFaturamento;
              const totalPedidos = weeklyData.totalPedidos;
              const ticketMedio = weeklyData.ticketMedio;
              const melhorSemana = weeklyData.melhorSemana;
              const crescimento = weeklyData.crescimento;
              const metaSemanal = weeklyData.targetRevenue;
              return (
                <>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">Performance Semanal</h3>
                      <p className="text-xs text-muted-foreground">Últimas {wpData.length} semanas</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    crescimento >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400"
                  }`}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {crescimento >= 0 ? "+" : ""}{crescimento.toFixed(1)}%
                  </div>
                </div>

                {/* Faturamento total */}
                <div className="mb-1">
                  <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalFaturamento)}</p>
                  <p className="text-xs text-muted-foreground">Faturamento total das {wpData.length} semanas</p>
                </div>

                {/* Gráfico */}
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={wpData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--color-border)"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        tickFormatter={formatCurrencyShort}
                        width={55}
                      />
                      <Tooltip content={<WeeklyTooltip meta={metaSemanal} />} cursor={{ fill: "transparent" }} />
                      {metaSemanal != null && (
                        <ReferenceLine
                          y={metaSemanal}
                          stroke="#ef4444"
                          strokeDasharray="8 4"
                          strokeWidth={2}
                          label={{
                            value: "Meta",
                            position: "right",
                            fill: "#ef4444",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      <Bar dataKey="faturamento" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {wpData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill="#22c55e"
                            fillOpacity={metaSemanal != null && entry.faturamento >= metaSemanal ? 1 : 0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda */}
                <div className="flex items-center justify-center gap-6 mt-2 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                    <span className="text-muted-foreground">Faturamento</span>
                  </div>
                  {metaSemanal != null && (
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-4 border-t-2 border-dashed border-red-500" />
                      <span className="text-muted-foreground">Meta</span>
                    </div>
                  )}
                </div>

                {/* Métricas rodapé */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pedidos</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">{totalPedidos.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(ticketMedio)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Melhor Semana</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">{melhorSemana.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(melhorSemana.faturamento)}</p>
                    </div>
                  </div>
                </div>
                </>
              );
            })()}
          </div>

          {/* Card Evolução Mensal - 2/5 = 40% */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-5">
            {/* Header do card */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Evolução Mensal</h3>
                <p className="text-xs text-muted-foreground">Receita vs Despesas vs Lucro — últimos 6 meses</p>
              </div>
            </div>

            {monthlyCompLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-3">Carregando evolução...</p>
              </div>
            ) : monthlyEvolutionReal.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingDown className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sem dados de evolução mensal</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Aguarde o acúmulo de dados nos próximos meses</p>
              </div>
            ) : (
            <>
            {/* Gráfico */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyEvolutionReal}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={formatCurrencyShort}
                    width={55}
                  />
                  <Tooltip content={<MonthlyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    name="Receita"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#gradReceita)"
                    dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#gradDespesas)"
                    dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lucro"
                    name="Lucro"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradLucro)"
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Receita</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Despesas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Lucro</span>
              </div>
            </div>
            </>
            )}
          </div>
          </div>{/* Fecha grid row */}

          {/* Row: Mapa de Sazonalidade (60%) + Performance por Canal (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Card Mapa de Sazonalidade - 3/5 = 60% */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 p-5">
            {/* Header do card */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <CalendarDays className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Mapa de Sazonalidade</h3>
                <p className="text-xs text-muted-foreground">Pedidos por dia da semana e horário — média do período</p>
              </div>
            </div>

            {/* Heatmap Grid */}
            {seasonalityLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : seasonalityData && seasonalityData.maxValue > 0 ? (
            <>
            {hasLowSeasonalitySample && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Dados ainda insuficientes para análise confiável</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                    Este período tem apenas {seasonalityTotalOrders} pedido{seasonalityTotalOrders === 1 ? "" : "s"}. A escala de cor é relativa ao maior valor encontrado e pode destacar picos que ainda não representam um padrão real.
                  </p>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-separate" style={{ borderSpacing: "3px" }}>
                <thead>
                  <tr>
                    <th className="w-12 text-xs text-muted-foreground font-medium text-left pb-2" />
                    {seasonalityData.days.map((day) => (
                      <th key={day} className="text-xs text-muted-foreground font-medium text-center pb-2 min-w-[60px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasonalityVisibleRows.map(({ hour, rowIdx }) => (
                    <tr key={hour}>
                      <td className="text-xs text-muted-foreground font-medium pr-2 text-right whitespace-nowrap">
                        {hour}
                      </td>
                      {seasonalityData.days.map((day, colIdx) => {
                        const val = seasonalityData.heatmap[rowIdx]?.[colIdx] ?? 0;
                        return (
                          <td
                            key={`${hour}-${day}`}
                            className="relative p-0"
                          >
                            <div className="group relative">
                              <div
                                className={`text-center text-[10px] font-medium rounded-md py-1.5 px-0.5 transition-colors duration-150 cursor-pointer
                                  group-hover:scale-110 group-hover:ring-2 group-hover:ring-red-500/60 group-hover:shadow-md group-hover:z-10 group-hover:relative
                                  ${getHeatColor(val, seasonalityData.maxValue)}`}
                              >
                                {val}
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-800 text-white rounded-lg text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                                <div className="font-semibold">{day} às {hour}</div>
                                <div className="text-red-300">{val} pedidos</div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Menos pedidos</span>
              <div className="flex gap-0.5">
                <span className="h-3 w-5 rounded-sm bg-red-50 dark:bg-red-950/20" />
                <span className="h-3 w-5 rounded-sm bg-red-100 dark:bg-red-950/40" />
                <span className="h-3 w-5 rounded-sm bg-red-200 dark:bg-red-500/50" />
                <span className="h-3 w-5 rounded-sm bg-red-300 dark:bg-red-500/60" />
                <span className="h-3 w-5 rounded-sm bg-red-400 dark:bg-red-500/70" />
                <span className="h-3 w-5 rounded-sm bg-red-500 dark:bg-red-500" />
              </div>
              <span>Mais pedidos</span>
            </div>
            </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum dado de sazonalidade</p>
                <p className="text-xs mt-1">Selecione outro período ou aguarde novas vendas</p>
              </div>
            )}
          </div>

          {/* Card Performance por Canal - 2/5 = 40% */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-5">
            {/* Header do card */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Monitor className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Performance por Canal</h3>
                <p className="text-xs text-muted-foreground">Comparativo PDV, Menu Público e Mesas</p>
              </div>
            </div>

            {/* Conteúdo do card */}
            {channelLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : channelDataReal && channelDataReal.total > 0 ? (
            <>
            {/* Barra empilhada com percentuais */}
            <div className="flex h-8 rounded-lg overflow-hidden mb-5">
              {channelDataReal.channels.map((ch) => {
                const channelColors: Record<string, string> = { pdv: '#3b82f6', menu: '#22c55e', mesas: '#f59e0b' };
                return (
                <div
                  key={ch.id}
                  className="relative transition-colors duration-500 flex items-center justify-center"
                  style={{ width: `${ch.percent}%`, backgroundColor: channelColors[ch.id] || '#6b7280' }}
                >
                  {ch.percent >= 10 && <span className="text-[11px] font-semibold text-white">{Math.round(ch.percent)}%</span>}
                </div>
              );})}
            </div>

            {/* Linhas compactas com barra lateral colorida */}
            <div className="flex flex-col gap-2.5">
              {channelDataReal.channels.map((ch) => {
                const channelColors: Record<string, string> = { pdv: '#3b82f6', menu: '#22c55e', mesas: '#f59e0b' };
                const channelNames: Record<string, string> = { pdv: 'PDV (Frente de Caixa)', menu: 'Menu Público (Delivery)', mesas: 'Mesas' };
                const ticketMedio = ch.count > 0 ? ch.total / ch.count : 0;
                return (
                  <div
                    key={ch.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/40 p-3"
                  >
                    <div
                      className="w-1.5 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: channelColors[ch.id] || '#6b7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{channelNames[ch.id] || ch.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{ch.count} pedidos</span>
                        <span className="text-[11px] text-muted-foreground">Ticket Médio {formatCurrency(ticketMedio)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatCurrency(ch.total)}</span>
                  </div>
                );
              })}
            </div>
            </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Monitor className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum dado por canal</p>
                <p className="text-xs mt-1">Selecione outro período ou aguarde novas vendas</p>
              </div>
            )}
          </div>
          </div>{/* Fecha grid row Sazonalidade + Canal */}

          {/* Nota informativa */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
            <svg className="h-4 w-4 shrink-0 text-muted-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Relatório não contabiliza pedidos cancelados. Mais seções serão adicionadas nas próximas etapas.
          </div>
        </div>
      )}

      {/* Aba Produtos (ABC/CMV) */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Banner informativo */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-200/60 dark:border-emerald-500/15 bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-white dark:from-emerald-500/5 dark:via-emerald-500/3 dark:to-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Entenda a Curva ABC</p>
                  <p className="text-xs text-muted-foreground">Descubra quais produtos são os campeões do seu faturamento</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAbcInfoOpen(true)}
                className="flex-shrink-0 gap-1.5 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10"
              >
                <Info className="h-3.5 w-3.5" />
                Saiba mais
              </Button>
            </div>
          </div>

          {/* Modal informativo ABC */}
          <ABCInfoModal open={abcInfoOpen} onOpenChange={setAbcInfoOpen} />

          {/* Card Curva ABC */}
          <div className="bg-card rounded-xl border border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Curva ABC de Produtos</h3>
                  <p className="text-xs text-muted-foreground">Classificação por rentabilidade — Pareto 80/20</p>
                </div>
              </div>
              <ExportDropdown type="abc" period={period} customStart={customStart} customEnd={customEnd} disabled={abcLoading || !abcData || abcData.items.length === 0} />
            </div>

            {/* Loading state */}
            {abcLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando dados...</p>
              </div>
            )}

            {/* Empty state */}
            {!abcLoading && (!abcData || abcData.items.length === 0) && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Package className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhum produto vendido no período selecionado</p>
                <p className="text-xs text-muted-foreground/60">Selecione outro período ou aguarde novas vendas</p>
              </div>
            )}

            {/* Content - only show when we have data */}
            {!abcLoading && abcData && abcData.items.length > 0 && (<>
            {/* Resumo ABC */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(["A", "B", "C"] as const).map((classe) => (
                <div key={classe} className={`rounded-xl p-3 ${classeColors[classe].bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-8 w-8 rounded-full bg-white/60 dark:bg-white/10 flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${classeColors[classe].text}`}>{classe}</span>
                    </div>
                    <div>
                      <span className={`text-sm font-bold ${classeColors[classe].text}`}>Classe {classe}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {classe === "A" && "Essenciais"}
                        {classe === "B" && "Intermedi\u00e1rios"}
                        {classe === "C" && "Baixo impacto"}
                      </p>
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${classeColors[classe].text}`}>{abcData?.summary ? (classe === "A" ? abcData.summary.classA.percentage : classe === "B" ? abcData.summary.classB.percentage : abcData.summary.classC.percentage) : 0}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {abcData?.summary ? (classe === "A" ? abcData.summary.classA.count : classe === "B" ? abcData.summary.classB.count : abcData.summary.classC.count) : 0} {((abcData?.summary ? (classe === "A" ? abcData.summary.classA.count : classe === "B" ? abcData.summary.classB.count : abcData.summary.classC.count) : 0) === 1) ? "produto" : "produtos"}
                  </p>
                </div>
              ))}
            </div>

            {/* Gráfico Pareto */}
            <div className="h-72 sm:h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={(abcData?.items ?? []).map(p => ({ name: p.productName, receita: p.revenue, acumulado: p.accumulatedPercentage }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "receita") return [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"];
                      return [`${value.toFixed(1)}%`, "Acumulado"];
                    }}
                  />
                  <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: "80%", position: "right", fontSize: 11, fill: "#ef4444" }} />
                  <Bar yAxisId="left" dataKey="receita" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {(abcData?.items ?? []).map((item, index) => (
                      <Cell key={`cell-${index}`} fill={classeColors[item.classification].bar} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela detalhada */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qtd</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">% Receita</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">% Acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {(abcData?.items ?? []).map((p, i) => (
                    <tr key={p.productId} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{p.productName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold ${classeColors[p.classification].bg} ${classeColors[p.classification].text}`}>
                          {p.classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-foreground">{p.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatCurrency(p.revenue)}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{p.percentage.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={p.accumulatedPercentage <= 80 ? "text-emerald-600 dark:text-emerald-400 font-medium" : p.accumulatedPercentage <= 95 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                          {p.accumulatedPercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span><strong>A</strong> — 80% da receita (foco máximo)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-500" />
                <span><strong>B</strong> — 15% da receita (atenção moderada)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-red-500" />
                <span><strong>C</strong> — 5% da receita (avaliar manutenção)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <span>Linha acumulada (Pareto)</span>
              </div>
            </div>
            </>)}
          </div>
        </div>
      )}

      {/* Aba DRE / Financeiro */}
      {activeTab === "dre" && (
        <div className="space-y-5">
          {/* Banner informativo DRE */}
          <div className="relative overflow-hidden rounded-xl border border-blue-200/60 dark:border-blue-500/15 bg-gradient-to-r from-blue-50 via-blue-50/50 to-white dark:from-blue-500/5 dark:via-blue-500/3 dark:to-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Entenda o DRE</p>
                  <p className="text-xs text-muted-foreground">Saiba como funciona o Demonstrativo de Resultado e como aproveitá-lo</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDreInfoOpen(true)}
                className="flex-shrink-0 gap-1.5 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/10"
              >
                <Info className="h-3.5 w-3.5" />
                Saiba mais
              </Button>
            </div>
          </div>

          {/* Modal informativo DRE */}
          <DREInfoModal open={dreInfoOpen} onOpenChange={setDreInfoOpen} />

          {dreLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Calculando DRE...</p>
            </div>
          ) : !dreDataReal || dreDataReal.grossRevenue === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum dado financeiro no período</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Selecione outro período ou registre vendas e despesas</p>
            </div>
          ) : (
          <>
          {/* Layout side-by-side: DRE (65%) + Indicadores (35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-[65%_1fr] gap-5 items-start">
            {/* Card DRE Simplificado */}
            <div className="bg-card rounded-xl border border-border/50 p-5 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">DRE Simplificado</h3>
                    <p className="text-xs text-muted-foreground">Demonstrativo de Resultado — período selecionado</p>
                  </div>
                </div>
                <ExportDropdown type="dre" period={period} customStart={customStart} customEnd={customEnd} />
              </div>

              {/* Tabela DRE */}
              <div className="space-y-0 flex-1">
                {/* Receita Bruta */}
                <div className="flex justify-between items-center py-2.5 px-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg border border-border/40">
                  <span className="font-semibold text-foreground text-sm">(+) Receita Bruta</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatCurrency(dreDataReal.grossRevenue)}</span>
                </div>

                {/* Cancelamentos */}
                {dreDataReal.cancellations > 0 && (
                <div className="border-x border-border/40">
                  <div className="flex justify-between items-center py-2 px-3 bg-muted/30">
                    <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">(-) Cancelamentos</span>
                    <span className="font-semibold text-red-500 dark:text-red-400 text-xs">{formatCurrency(dreDataReal.cancellations)}</span>
                  </div>
                </div>
                )}

                {/* Receita Líquida */}
                <div className="flex justify-between items-center py-2.5 px-3 bg-blue-50/50 dark:bg-blue-950/20 border border-border/40">
                  <span className="font-semibold text-foreground text-sm">(=) Receita Líquida</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{formatCurrency(dreDataReal.netRevenue)}</span>
                </div>

                {/* CMV */}
                <div className="flex justify-between items-center py-2.5 px-3 border-x border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">(-) CMV</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{dreDataReal.cmvPercentage.toFixed(1)}%</span>
                  </div>
                  <span className="font-semibold text-red-500 dark:text-red-400 text-xs">{formatCurrency(dreDataReal.totalCMV)}</span>
                </div>

                {/* Lucro Bruto */}
                <div className="flex justify-between items-center py-2.5 px-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">(=) Lucro Bruto</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">{dreDataReal.grossMargin.toFixed(1)}%</span>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatCurrency(dreDataReal.grossProfit)}</span>
                </div>

                {/* Despesas Operacionais */}
                <div className="border-x border-border/40">
                  <div className="flex justify-between items-center py-2 px-3 bg-muted/30">
                    <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">(-) Despesas Operacionais</span>
                    <span className="font-semibold text-red-500 dark:text-red-400 text-xs">{formatCurrency(dreDataReal.totalExpenses)}</span>
                  </div>
                  {dreDataReal.expensesByCategory.map((d) => (
                    <div key={d.category} className="flex justify-between items-center py-1.5 px-5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-muted-foreground">{d.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/70">{dreDataReal.netRevenue > 0 ? ((d.amount / dreDataReal.netRevenue) * 100).toFixed(1) : '0.0'}%</span>
                        <span className="text-xs text-red-500 dark:text-red-400">{formatCurrency(d.amount)}</span>
                      </div>
                    </div>
                  ))}
                  {dreDataReal.expensesByCategory.length === 0 && (
                    <div className="py-2 px-5 text-xs text-muted-foreground/60 italic">Nenhuma despesa registrada no período</div>
                  )}
                </div>

                {/* Resultado Operacional */}
                <div className={`flex justify-between items-center py-3 px-3 rounded-b-lg border border-border/40 ${
                  dreDataReal.operatingResult >= 0
                    ? "bg-emerald-100/80 dark:bg-emerald-950/40"
                    : "bg-red-100/80 dark:bg-red-950/40"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">(=) Resultado Operacional</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      dreDataReal.operatingResult >= 0
                        ? "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-red-200 dark:bg-red-500/60 text-red-500 dark:text-red-300"
                    }`}>{dreDataReal.operatingMargin.toFixed(1)}%</span>
                  </div>
                  <span className={`font-bold text-base ${
                    dreDataReal.operatingResult >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }`}>{formatCurrency(dreDataReal.operatingResult)}</span>
                </div>
              </div>
            </div>

            {/* Indicadores de Margem - coluna direita */}
            {dreComputed && (
            <CardIndicadoresMargem
              titulo="Indicadores de Margem"
              subtitulo="Metas do setor de alimentação"
              indicadores={dreComputed.indicadores.map((ind) => ({
                label: ind.label,
                desc: ind.descricao,
                valor: ind.valor,
                meta: ind.meta,
                maxScale: ind.inverted ? 50 : 100,
                atingiu: ind.inverted ? ind.valor <= ind.meta : ind.valor >= ind.meta,
              }))}
            />
            )}
          </div>
          </>
          )}
        </div>
      )}

      {/* Aba Operacional */}
      {activeTab === "operational" && (
        <div className="space-y-6">
          {/* Mini Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio Geral</p>
                  <p className="text-xl font-bold text-foreground">{tempoMedioGeral} min</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categoria Mais Rápida</p>
                  <p className="text-xl font-bold text-foreground">{categoriaMaisRapida.categoria}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{categoriaMaisRapida.tempoReal} min (meta: {categoriaMaisRapida.meta} min)</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gargalo</p>
                  <p className="text-xl font-bold text-foreground">{categoriaGargalo.categoria}</p>
                  <p className="text-xs text-red-500 dark:text-red-400">+{categoriaGargalo.tempoReal - categoriaGargalo.meta} min acima da meta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Tempo de Preparo por Categoria */}
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Tempo de Preparo por Categoria</h3>
                <p className="text-xs text-muted-foreground">Comparação com meta — aceito até pronto</p>
              </div>
            </div>

            <div className="space-y-4">
              {tempoPreparoData
                .sort((a, b) => b.tempoReal - a.tempoReal)
                .map((cat) => {
                  const acimaDaMeta = cat.tempoReal > cat.meta;
                  const realPercent = (cat.tempoReal / maxTempo) * 100;
                  const metaPercent = (cat.meta / maxTempo) * 100;
                  return (
                    <div key={cat.categoria} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground w-24">{cat.categoria}</span>
                          <span className="text-xs text-muted-foreground">({cat.pedidos} pedidos)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${acimaDaMeta ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {cat.tempoReal} min
                          </span>
                          <span className="text-xs text-muted-foreground">/ {cat.meta} min</span>
                          {acimaDaMeta ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400">
                              +{cat.tempoReal - cat.meta} min
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                              \u2713 OK
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Barras */}
                      <div className="relative h-6 rounded-lg bg-muted/40 overflow-hidden">
                        {/* Barra de tempo real */}
                        <div
                          className={`absolute top-0 left-0 h-full rounded-lg transition-colors duration-700 ${
                            acimaDaMeta
                              ? "bg-gradient-to-r from-red-400 to-red-500 dark:from-red-500 dark:to-red-500"
                              : "bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-500"
                          }`}
                          style={{ width: `${realPercent}%` }}
                        />
                        {/* Marcador de meta */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-foreground/50"
                          style={{ left: `${metaPercent}%` }}
                        />
                        <div
                          className="absolute -top-0.5 w-2 h-7 rounded-sm bg-foreground/30"
                          style={{ left: `calc(${metaPercent}% - 4px)` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-5 mt-5 pt-4 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-8 rounded bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <span>Dentro da meta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-8 rounded bg-gradient-to-r from-red-400 to-red-500" />
                <span>Acima da meta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-1 rounded bg-foreground/40" />
                <span>Meta de tempo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aba Marketing & ROI */}
      {activeTab === "marketing" && (
        <div className="space-y-6">
          {/* Mini Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Investimento Total</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalInvestimento)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Retorno Total</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRetorno)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">ROI Geral</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{roiGeral}%</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Novos Clientes</p>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{totalNovosClientes}</p>
              <p className="text-[10px] text-muted-foreground">{totalPedidosMkt} pedidos via campanhas</p>
            </div>
          </div>

          {/* Gráfico Investimento vs Retorno */}
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Investimento vs Retorno</h3>
                <p className="text-xs text-muted-foreground">Comparativo por campanha — ordenado por ROI</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campanhaChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name === "investimento" ? "Investimento" : "Retorno"]}
                    labelFormatter={(label: string) => {
                      const item = campanhaChartData.find(c => c.nome === label);
                      return item?.nomeCompleto || label;
                    }}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Legend formatter={(value) => value === "investimento" ? "Investimento" : "Retorno"} />
                  <Bar dataKey="investimento" fill="#f87171" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="retorno" fill="#34d399" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela ROI de Campanhas */}
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Megaphone className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">ROI de Campanhas</h3>
                <p className="text-xs text-muted-foreground">Detalhamento de performance por campanha</p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3 px-5 sm:px-6 font-medium text-muted-foreground text-xs">Campanha</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Tipo</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Investimento</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Retorno</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">ROI</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Pedidos</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Novos Clientes</th>
                    <th className="text-center py-3 px-5 sm:px-6 font-medium text-muted-foreground text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhasData
                    .sort((a, b) => b.roi - a.roi)
                    .map((c, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-5 sm:px-6">
                        <div className="flex items-center gap-2">
                          {c.roi >= 700 && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                          <span className="font-medium text-foreground">{c.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                          c.tipo === "Ads" ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" :
                          c.tipo === "Cupom" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" :
                          c.tipo === "Promoção" ? "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400" :
                          c.tipo === "Fidelidade" ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400" :
                          c.tipo === "Marketplace" ? "bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.tipo}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{c.investimento === 0 ? "Grátis" : formatCurrency(c.investimento)}</td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(c.retorno)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${
                          c.roi >= 700 ? "text-emerald-600 dark:text-emerald-400" :
                          c.roi >= 300 ? "text-blue-600 dark:text-blue-400" :
                          c.roi >= 100 ? "text-amber-600 dark:text-amber-400" :
                          "text-red-500 dark:text-red-400"
                        }`}>{c.roi === Infinity ? "\u221E" : `${c.roi}%`}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-foreground">{c.pedidos}</td>
                      <td className="py-3 px-3 text-right text-foreground">{c.novosClientes}</td>
                      <td className="py-3 px-5 sm:px-6 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                          c.status === "ativa" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        }`}>{c.status === "ativa" ? "Ativa" : "Encerrada"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border/60 bg-muted/20">
                    <td className="py-3 px-5 sm:px-6 font-bold text-foreground" colSpan={2}>Total</td>
                    <td className="py-3 px-3 text-right font-bold text-foreground">{formatCurrency(totalInvestimento)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRetorno)}</td>
                    <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400">{roiGeral}%</td>
                    <td className="py-3 px-3 text-right font-bold text-foreground">{totalPedidosMkt}</td>
                    <td className="py-3 px-3 text-right font-bold text-foreground">{totalNovosClientes}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Placeholder para outras abas */}
      {activeTab !== "overview" && activeTab !== "products" && activeTab !== "dre" && activeTab !== "operational" && activeTab !== "marketing" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
            <BarChart3 className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {reportTabs.find((t) => t.value === activeTab)?.label}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Esta seção será implementada nas próximas etapas. Os dados e gráficos específicos aparecerão aqui.
          </p>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
