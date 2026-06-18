/**
 * AdminRelatorios - Página de Relatórios do Admin
 * KPIs, gráfico donut de distribuição por status, receita anual, ticket médio, churn rate
 */
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import {
  BarChart3,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
  Info,
  PieChart as PieChartIcon,
  Layers,
  Receipt,
  UserX,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function AdminRelatorios() {
  const { data, isLoading } = trpc.admin.reports.data.useQuery();

  if (isLoading) {
    return (
      <AdminPanelLayout>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-muted rounded-lg" />
            <div>
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-5">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-7 w-16 bg-muted rounded mt-2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border/50 h-64" />
            <div className="bg-card rounded-xl border border-border/50 h-64" />
          </div>
        </div>
      </AdminPanelLayout>
    );
  }

  if (!data) {
    return (
      <AdminPanelLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Erro ao carregar relatórios</p>
          <p className="text-sm mt-1">Tente recarregar a página ou volte mais tarde.</p>
        </div>
      </AdminPanelLayout>
    );
  }

  // Donut chart data
  const donutData = [
    { name: "Ativos", value: data.activeRestaurants, color: "#22c55e" },
    { name: "Em Teste", value: data.activeTrials, color: "#3b82f6" },
    { name: "Expirados", value: data.expiredTrials, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Se todos são zero, mostrar placeholder
  if (donutData.length === 0) {
    donutData.push({ name: "Sem dados", value: 1, color: "#e5e7eb" });
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <AdminPanelLayout>
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-100 rounded-lg">
          <BarChart3 className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da plataforma e métricas de negócio
          </p>
        </div>
      </div>

      {/* KPI Cards - Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Restaurantes"
          value={data.totalRestaurants.toString()}
          icon={Building2}
          color="blue"
          tooltip="Cadastrados na plataforma"
        />
        <KPICard
          title="Receita Mensal"
          value={formatCurrency(data.monthlyRevenue)}
          icon={DollarSign}
          color="green"
          tooltip="Soma dos valores dos planos ativos"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${data.conversionRate}%`}
          icon={TrendingUp}
          color="orange"
          tooltip="Trial → Plano pago"
        />
        <KPICard
          title="Restaurantes Ativos"
          value={data.activeRestaurants.toString()}
          icon={Users}
          color="purple"
          tooltip="Com plano pago"
        />
      </div>

      {/* Middle Row: Donut Chart + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          {/* Header estilo Acessos ao Cardápio */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <PieChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Distribuição por Status</h3>
              <p className="text-xs text-muted-foreground">Proporção de restaurantes por situação atual</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => {
                    const item = donutData.find((d) => d.name === value);
                    return (
                      <span className="text-sm text-muted-foreground">
                        {value}: <span className="font-semibold">{item?.value ?? 0}</span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Details */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          {/* Header estilo Acessos ao Cardápio */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Detalhes por Plano</h3>
              <p className="text-xs text-muted-foreground">Distribuição de restaurantes por tipo de plano</p>
            </div>
          </div>
          <div className="space-y-4">
            <PlanRow
              label="Essencial"
              count={data.planDistribution?.basic ?? 0}
              price="R$ 29/mês"
              color="#3b82f6"
              total={data.totalRestaurants}
            />
            <PlanRow
              label="Pro"
              count={data.planDistribution?.pro ?? 0}
              price="R$ 59/mês"
              color="#8b5cf6"
              total={data.totalRestaurants}
            />

            <PlanRow
              label="Trial Ativo"
              count={data.activeTrials}
              price="Gratuito"
              color="#22c55e"
              total={data.totalRestaurants}
            />
            <PlanRow
              label="Trial Expirado"
              count={data.expiredTrials}
              price="Bloqueado"
              color="#ef4444"
              total={data.totalRestaurants}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">{data.totalRestaurants} restaurantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Revenue, Ticket, Churn */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Receita Anual Projetada"
          value={formatCurrency(data.annualRevenue)}
          subtitle="Baseado nos restaurantes ativos atuais"
          icon={DollarSign}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(data.ticketMedio)}
          subtitle="Por restaurante ativo"
          icon={Receipt}
          iconBg="bg-amber-100 dark:bg-amber-500/15"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Churn Rate"
          value={`${data.churnRate}%`}
          subtitle="Restaurantes suspensos/cancelados"
          icon={UserX}
          iconBg="bg-red-100 dark:bg-red-500/15"
          iconColor="text-red-500 dark:text-red-400"
        />
      </div>
    </div>
    </AdminPanelLayout>
  );
}

// ============ Sub-components ============

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((prev) => !prev)}
        aria-label="Informação"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50">
          <div className="bg-foreground text-background text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
            {text}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  tooltip,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: "blue" | "green" | "orange" | "purple";
  tooltip?: string;
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      border: "border-t-blue-500",
      dot: "bg-blue-500",
    },
    green: {
      bg: "bg-emerald-100",
      icon: "text-emerald-600",
      border: "border-t-emerald-500",
      dot: "bg-emerald-500",
    },
    orange: {
      bg: "bg-orange-100",
      icon: "text-orange-600",
      border: "border-t-orange-500",
      dot: "bg-orange-500",
    },
    purple: {
      bg: "bg-purple-100",
      icon: "text-purple-600",
      border: "border-t-purple-500",
      dot: "bg-purple-500",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className={`bg-card rounded-xl border border-border/50 border-t-4 ${c.border}`}
    >
      <div className="px-5 py-5 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              {title}
            </p>
            {tooltip && <InfoTooltip text={tooltip} />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            <span className="text-2xl font-bold tracking-tight">{value}</span>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      {/* Header estilo Acessos ao Cardápio */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`} style={{borderRadius: '12px'}}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function PlanRow({
  label,
  count,
  price,
  color,
  total,
}: {
  label: string;
  count: number;
  price: string;
  color: string;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  // Map color hex to Tailwind bar classes
  const colorBarMap: Record<string, string> = {
    '#3b82f6': 'bg-blue-500',
    '#8b5cf6': 'bg-violet-500',
    '#f59e0b': 'bg-amber-500',
    '#22c55e': 'bg-emerald-500',
    '#ef4444': 'bg-red-500',
  };
  const barClass = colorBarMap[color] || 'bg-gray-500';

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{price}</span>
          <span className="text-sm font-semibold text-foreground w-6 text-right">{count}</span>
        </div>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-colors duration-500 ${barClass}`}
          style={{ width: `${Math.max(percentage > 0 ? 3 : 0, percentage)}%` }}
        />
      </div>
    </div>
  );
}
