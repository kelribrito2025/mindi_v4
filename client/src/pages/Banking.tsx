import { useState, useMemo, useRef, useCallback, useEffect, Fragment } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, SectionCard, StatCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Landmark,
  ArrowLeft,
  History,
  FileText,
  Receipt,
  QrCode,
  Store,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  TrendingUp,
  RefreshCw,
  Send,
  ScanLine,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Wallet,
  ArrowRight,
  ArrowRightLeft,
  Loader2,
  Shield,
  Zap,
  CircleDollarSign,
  ChevronDown,
  Activity,
  PlusCircle,
  Copy,
  Check,
  DollarSign,
  Calendar,
  Clock,
  Download,
  Filter,
  XCircle,
  Percent,
  BarChart3,
  Info,
  BadgeCheck,
  CircleDot,
  Pencil,
  ExternalLink,
  Calculator,
  FileBarChart,
  Lock,
  ShieldCheck,
  Timer,
  Sparkles,
  X,
  Save,
  Globe,
  Layers,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AdminLayout } from "@/components/AdminLayout";
import { DateRangePickerSales } from "@/components/DateRangePickerSales";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

// ============ TIPOS ============
type BankingView = "home" | "historico" | "extrato" | "pagar-conta" | "estabelecimento" | "area-pix" | "liquidacoes" | "taxas" | "extrato-bancario";

// ============ HELPERS ============
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getApiTransactionIcon(type: string) {
  const t = type?.toLowerCase() || "";
  if (t.includes("pix")) return <QrCode className="h-4 w-4" />;
  if (t.includes("credit") || t.includes("card") || t.includes("cartao")) return <CreditCard className="h-4 w-4" />;
  if (t.includes("debit") || t.includes("debito")) return <CreditCard className="h-4 w-4" />;
  if (t.includes("ted") || t.includes("transfer")) return <ArrowRightLeft className="h-4 w-4" />;
  if (t.includes("refund") || t.includes("estorno")) return <RefreshCw className="h-4 w-4" />;
  if (t.includes("fee") || t.includes("taxa")) return <Receipt className="h-4 w-4" />;
  return <Banknote className="h-4 w-4" />;
}

function getApiTransactionLabel(type: string): string {
  const t = type?.toLowerCase() || "";
  if (t.includes("pix")) return "PIX";
  if (t.includes("credit")) return "Crédito";
  if (t.includes("debit") || t.includes("debito")) return "Débito";
  if (t.includes("ted")) return "TED";
  if (t.includes("refund") || t.includes("estorno")) return "Estorno";
  if (t.includes("fee") || t.includes("taxa")) return "Taxa";
  return type || "Outro";
}

function getTransactionIconColor(type: string): string {
  const t = type?.toLowerCase() || "";
  if (t.includes("pix")) return "text-emerald-500 bg-emerald-500/10";
  if (t.includes("credit")) return "text-blue-500 bg-blue-500/10";
  if (t.includes("debit")) return "text-violet-500 bg-violet-500/10";
  if (t.includes("ted")) return "text-indigo-500 bg-indigo-500/10";
  if (t.includes("refund") || t.includes("estorno")) return "text-orange-500 bg-orange-500/10";
  return "text-gray-500 bg-gray-500/10";
}

function getApiStatusBadge(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "PAID" || s === "APPROVED" || s === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Concluído
      </span>
    );
  }
  if (s === "PENDING" || s === "WAITING" || s === "WAITING_ANTIFRAUD" || s === "PROCESSING") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pendente
      </span>
    );
  }
  if (s === "FAILED" || s === "DECLINED" || s === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Falhou
      </span>
    );
  }
  if (s === "CANCELLED" || s === "REFUNDED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10 px-2 py-0.5 rounded-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {s === "REFUNDED" ? "Estornado" : "Cancelado"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10 px-2 py-0.5 rounded-lg">
      {status}
    </span>
  );
}

// ============ COMPONENTE: DADOS DA CONTA BANCÁRIA (reutilizável) ============
function BankAccountSection({ bankAccount, loading }: {
  bankAccount?: { bank: string; bankCode: string; type: string; agency: string; account: string; accountDigit: string } | null;
  loading?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = () => {
    if (!bankAccount) return;
    const accountStr = `${bankAccount.account}${bankAccount.accountDigit ? '-' + bankAccount.accountDigit : ''}`;
    navigator.clipboard.writeText(accountStr).then(() => {
      setCopied(true);
      toast.success('Número da conta copiado!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Erro ao copiar');
    });
  };

  if (loading) {
    return (
      <div className="py-4 border-b border-border/30">
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Carregando dados bancários...</span>
        </div>
      </div>
    );
  }

  if (!bankAccount) {
    return (
      <div className="py-4 border-b border-border/30">
        <p className="text-xs text-muted-foreground text-center">Dados bancários indisponíveis</p>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-border/30 space-y-2.5">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '11px'}}>
          <Building2 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-none">Banco</p>
          <p className="text-xs font-semibold text-foreground truncate mt-0.5">
            {bankAccount.bank}{bankAccount.bankCode ? ` (${bankAccount.bankCode})` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '11px'}}>
          <Landmark className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground leading-none">Agência / Conta</p>
          <p className="text-xs font-semibold text-foreground mt-0.5">
            {bankAccount.agency} / C/C {bankAccount.account}{bankAccount.accountDigit ? `-${bankAccount.accountDigit}` : ''}
          </p>
        </div>
        <button
          onClick={handleCopyAccount}
          className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-transform hover:scale-105 flex-shrink-0"
          title="Copiar número da conta"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============ COMPONENTE: SIDEBAR DIREITA ============
function BankingSidebar({ showBalance, setShowBalance, dashboardData, dashboardLoading, establishment }: {
  showBalance: boolean;
  setShowBalance: (v: boolean) => void;
  dashboardData: any;
  dashboardLoading: boolean;
  establishment: any;
}) {
  const { user } = useAuth();
  const balanceData = dashboardData?.balance;
  const futureData = dashboardData?.futureReleases;
  const realBalance = balanceData ? {
    available: balanceData.balance / 100,
    blocked: balanceData.blockedBalance / 100,
    total: balanceData.totalBalance / 100,
  } : null;
  const futureThirtyDays = futureData ? futureData.thirtyDays / 100 : 0;

  // Gateway status
  const gateways = dashboardData?.gateways || [];
  const hasBankingGw = gateways.some((g: any) => g.type === 'BANKING');
  const bankingGw = gateways.find((g: any) => g.type === 'BANKING');
  const acquirerGw = gateways.find((g: any) => g.type === 'ACQUIRER' && g.status === 'APPROVED') || gateways.find((g: any) => g.type === 'ACQUIRER');
  const bankingEnabled = hasBankingGw && bankingGw?.status === 'APPROVED' && bankingGw?.active;

  // Usar os planos do estabelecimento para determinar modalidades realmente ativas
  // A modalidade do gateway (ex: 'ALL') indica o que o gateway SUPORTA, não o que está habilitado
  // Os planos indicam o que está realmente ativo para o estabelecimento
  const plans: any[] = dashboardData?.plans || [];
  const activePlanModalities = plans
    .filter((p: any) => p.active)
    .map((p: any) => (p.modality || '').toUpperCase());
  
  const hasPhysicalPlan = activePlanModalities.some((m: string) => m === 'PHYSICAL' || m === 'ALL' || m === 'PRESENTIAL' || m === 'CHIP');
  const hasOnlinePlan = activePlanModalities.some((m: string) => m === 'ONLINE' || m === 'ALL');
  const hasTapPlan = activePlanModalities.some((m: string) => m === 'TAP' || m === 'TAP_ON_PHONE');

  const services = [
    {
      label: 'VENDA PRESENCIAL',
      icon: <Store className="h-4 w-4" />,
      enabled: !!acquirerGw && acquirerGw.status === 'APPROVED' && acquirerGw.active && hasPhysicalPlan,
    },
    {
      label: 'VENDA ONLINE',
      icon: <Zap className="h-4 w-4" />,
      enabled: !!acquirerGw && acquirerGw.status === 'APPROVED' && acquirerGw.active && hasOnlinePlan,
    },
    {
      label: 'TAP ON PHONE',
      icon: <ScanLine className="h-4 w-4" />,
      enabled: !!acquirerGw && acquirerGw.status === 'APPROVED' && acquirerGw.active && hasTapPlan,
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden sticky top-4">
      {/* Header com gradiente Mindi (vermelho) */}
      <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent px-5 pt-5 pb-4">
        {/* Detalhe decorativo lateral */}
        <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              {establishment?.name || 'Carregando...'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {establishment?.email || user?.email || ''}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-0">
        {/* Saldo disponível */}
        <div className="py-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Saldo disponível</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-transform hover:scale-105"
            >
              {showBalance ? <Eye className="h-3.5 w-3.5 text-muted-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {dashboardLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : showBalance ? formatCurrency(realBalance?.available ?? 0) : "R$ ••••••"}
          </p>
        </div>

        {/* Lançamentos futuros */}
        <div className="py-4 border-b border-border/30">
          <span className="text-xs text-muted-foreground font-medium">Lançamentos futuros</span>
          <p className="text-xl font-bold text-foreground mt-1">
            {dashboardLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : showBalance ? formatCurrency(futureThirtyDays) : "R$ ••••••"}
          </p>
        </div>

        {/* Dados da conta bancária */}
        <BankAccountSection bankAccount={dashboardData?.bankAccount} loading={dashboardLoading} />




        {/* Status dos gateways - com ícones */}
        <div className="pt-4 space-y-3">
          {services.map((svc) => (
            <div key={svc.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                  svc.enabled
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground/50"
                )}>
                  {svc.icon}
                </div>
                <span className="text-xs font-bold text-foreground leading-tight">{svc.label}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  svc.enabled
                    ? "bg-emerald-500"
                    : "bg-red-500"
                )} />
                <span className={svc.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-red-500/70 dark:text-red-400/70"}>
                  {svc.enabled ? 'Ativo' : 'Inativo'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTE: HOME ============
function BankingHome({ onNavigate }: { onNavigate: (view: BankingView) => void }) {
  const [showBalance, setShowBalance] = useState(true);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;

  const { data: dashboardData, isLoading: dashboardLoading } = trpc.paytime.getBankingDashboard.useQuery(
    { establishmentId: estId!, transactionsPerPage: 5 },
    { enabled: !!estId && hasBanking, refetchInterval: 60000, staleTime: 30000 }
  );

  const { data: billingStats, isLoading: billingLoading } = trpc.paytime.getBillingStats.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && hasBanking, refetchInterval: 60000, staleTime: 30000 }
  );

  // Date range for sales progression chart
  const [chartStartDate, setChartStartDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [chartEndDate, setChartEndDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const { data: salesData, isLoading: salesLoading } = trpc.paytime.getSalesProgression.useQuery(
    { establishmentId: estId!, startDate: chartStartDate, endDate: chartEndDate },
    { enabled: !!estId && hasBanking, refetchInterval: 60000, staleTime: 30000 }
  );

  // Buscar resumo com agrupamentos para os cards de donut
  const { data: homeSummary, isLoading: homeSummaryLoading } = trpc.paytime.getTransactionsSummary.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && hasBanking, refetchInterval: 60000, staleTime: 30000 }
  );

  const balanceData = dashboardData?.balance;
  const futureData = dashboardData?.futureReleases;
  const recentTransactions = dashboardData?.transactions?.data || [];

  const realBalance = balanceData ? {
    available: balanceData.balance / 100,
    blocked: balanceData.blockedBalance / 100,
    total: balanceData.totalBalance / 100,
  } : null;
  const futureThirtyDays = futureData ? futureData.thirtyDays / 100 : 0;

  return (
    <div className="flex gap-5">
      {/* Conteúdo principal (esquerda) */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* 1. Cards de métricas no topo (gradiente + barra lateral) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Saldo disponível */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Saldo disponível</p>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      {showBalance ? <Eye className="h-3 w-3 text-muted-foreground" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {dashboardLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : showBalance ? formatCurrency(realBalance?.available ?? 0) : "R$ ••••••"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lançamentos futuros */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-violet-500/8 via-violet-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-violet-500/60 via-violet-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <Activity className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Lançamentos futuros</p>
                  <p className="text-lg font-bold text-foreground">
                    {dashboardLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : showBalance ? formatCurrency(futureThirtyDays) : "R$ ••••••"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Faturamento Hoje */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden group relative">
            <div className="relative bg-gradient-to-br from-rose-500/8 via-rose-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-rose-500/60 via-rose-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <Wallet className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Faturamento</p>
                    <span className="text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">Hoje</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-foreground">
                      {billingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : showBalance ? formatCurrency((billingStats?.today ?? 0) / 100) : "R$ ••••••"}
                    </p>
                    {(() => {
                      const todayVal = billingStats?.today ?? 0;
                      const yesterdayVal = billingStats?.yesterday ?? 0;
                      const pct = yesterdayVal > 0
                        ? Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100)
                        : todayVal > 0 ? 100 : 0;
                      const isPositive = pct >= 0;
                      const isNeutral = pct === 0;
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-semibold",
                          isNeutral ? "text-muted-foreground" : isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        )}>
                          <span className="text-[11px]">{isNeutral ? "—" : isPositive ? "↑" : "↓"}</span>
                          <span>{isNeutral ? "0%" : `${Math.abs(pct)}%`}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            {/* Tooltip no hover */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
                Desde ontem
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
              </div>
            </div>
          </div>

          {/* Faturamento Mensal */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden group relative">
            <div className="relative bg-gradient-to-br from-rose-500/8 via-rose-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-rose-500/60 via-rose-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <Wallet className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Faturamento</p>
                    <span className="text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">Mensal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-foreground">
                      {billingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : showBalance ? formatCurrency((billingStats?.month ?? 0) / 100) : "R$ ••••••"}
                    </p>
                    {(() => {
                      const monthVal = billingStats?.month ?? 0;
                      const lastMonthVal = billingStats?.lastMonth ?? 0;
                      const pct = lastMonthVal > 0
                        ? Math.round(((monthVal - lastMonthVal) / lastMonthVal) * 100)
                        : monthVal > 0 ? 100 : 0;
                      const isPositive = pct >= 0;
                      const isNeutral = pct === 0;
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-semibold",
                          isNeutral ? "text-muted-foreground" : isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        )}>
                          <span className="text-[11px]">{isNeutral ? "—" : isPositive ? "↑" : "↓"}</span>
                          <span>{isNeutral ? "0%" : `${Math.abs(pct)}%`}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            {/* Tooltip no hover */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
                Desde mês passado
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Cards de ações rápidas + 3. Gráfico de Progressão de vendas */}
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {[
              { id: "extrato" as BankingView, icon: FileText, label: "Vendas", desc: "Cobranças e pagamentos", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15", hoverBorder: "hover:border-violet-200 dark:hover:border-violet-500/30" },
              { id: "pagar-conta" as BankingView, icon: Receipt, label: "Pagar conta", desc: "Boletos", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15", hoverBorder: "hover:border-orange-200 dark:hover:border-orange-500/30" },
              { id: "area-pix" as BankingView, icon: QrCode, label: "Área PIX", desc: "Temporariamente indisponível", color: "text-muted-foreground", bg: "bg-muted/50", hoverBorder: "", disabled: true },
              { id: "liquidacoes" as BankingView, icon: DollarSign, label: "Repasses", desc: "Liquidações", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15", hoverBorder: "hover:border-amber-200 dark:hover:border-amber-500/30" },
              { id: "estabelecimento" as BankingView, icon: Building2, label: "Conta", desc: "Dados", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-500/15", hoverBorder: "hover:border-slate-200 dark:hover:border-slate-500/30" },
              { id: "extrato-bancario" as BankingView, icon: FileBarChart, label: "Extrato", desc: "Conta bancária", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/15", hoverBorder: "hover:border-indigo-200 dark:hover:border-indigo-500/30" },
            ].map((item) => {
              const disabled = item.disabled === true;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { if (!disabled) onNavigate(item.id); }}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={disabled ? "Área PIX temporariamente indisponível" : undefined}
                  className={cn(
                    "group bg-card rounded-xl border border-border/50 p-4 text-left transition-colors duration-200",
                    disabled
                      ? "opacity-60 cursor-not-allowed bg-muted/20 border-dashed hover:shadow-none hover:translate-y-0"
                      : "hover:shadow-md hover:-translate-y-0.5",
                    !disabled && item.hoverBorder
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", item.bg)} style={{borderRadius: '12px'}}>
                      <item.icon className={cn("h-5 w-5", item.color)} />
                    </div>
                    {disabled ? (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">Indisponível</span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-transform mt-1" />
                    )}
                  </div>
                  <p className={cn("text-sm font-bold transition-colors", disabled ? "text-muted-foreground" : "text-foreground group-hover:text-primary")}>{item.label}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{item.desc}</p>
                </button>
              );
            })}
          </div>

          {/* 3. Gráfico de Progressão de vendas */}
          <div className="bg-card rounded-xl border border-border/50">
            <div className="relative bg-gradient-to-br from-cyan-500/8 via-cyan-500/4 to-transparent px-5 pt-4 pb-2 rounded-t-xl">
              <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-500/60 via-cyan-500/30 to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Progressão de vendas</h3>
                  <p className="text-xs text-muted-foreground">Acompanhe o faturamento bruto e líquido no período</p>
                </div>
                <DateRangePickerSales
                  startDate={chartStartDate}
                  endDate={chartEndDate}
                  onApply={(start, end) => { setChartStartDate(start); setChartEndDate(end); }}
                />
              </div>
            </div>
            <div className="px-2 pb-4" style={{ height: 280 }}>
              {salesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando gráfico...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`} />
                    <RechartsTooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name === 'gross' ? 'Valor bruto' : 'Valor líquido']}
                      labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={30}
                      formatter={(value: string) => <span className="text-xs text-muted-foreground">{value === 'gross' ? 'Valor bruto' : 'Valor líquido'}</span>}
                    />
                    <Area type="monotone" dataKey="gross" stroke="#06b6d4" fill="url(#colorGross)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="net" stroke="#8b5cf6" fill="url(#colorNet)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>

        {/* 4. Cards de resumo com visual Extrato de Vendas (gradiente + barra lateral) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-cyan-500/8 via-cyan-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-cyan-500/60 via-cyan-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <BarChart3 className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total de Vendas</p>
                  <p className="text-lg font-bold text-foreground">
                    {salesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (salesData?.totalSales ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <DollarSign className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor Bruto</p>
                  <p className="text-lg font-bold text-foreground">
                    {salesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency((salesData?.grossAmount ?? 0) / 100)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-violet-500/8 via-violet-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-violet-500/60 via-violet-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <CircleDollarSign className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor Líquido</p>
                  <p className="text-lg font-bold text-foreground">
                    {salesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency((salesData?.netAmount ?? 0) / 100)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-amber-500/8 via-amber-500/4 to-transparent px-4 pt-3 pb-3">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-amber-500/60 via-amber-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <Calculator className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
                  <p className="text-lg font-bold text-foreground">
                    {salesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency((salesData?.averageTicket ?? 0) / 100)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4.5. Cards de Vendas por Modalidade, Canal de Vendas, Conversão de Vendas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Vendas por modalidade */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-cyan-500/8 via-cyan-500/4 to-transparent px-5 pt-4 pb-3">
              <div className="absolute left-0 top-4 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-cyan-500/60 via-cyan-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/30">
                  <CreditCard className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Vendas por modalidade</h3>
                  <p className="text-xs text-muted-foreground">Distribuição por forma de pagamento</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-[120px] h-[120px] flex-shrink-0">
                {homeSummaryLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (homeSummary?.byModality?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={homeSummary!.byModality}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {homeSummary!.byModality.map((_: any, i: number) => (
                          <Cell key={i} fill={['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'][i % 5]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Sem dados</div>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {homeSummary?.byModality?.map((item: any, i: number) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'][i % 5] }} />
                      <span className="text-muted-foreground">
                        {item.label === 'CREDIT' ? 'Crédito à vista' : item.label === 'DEBIT' ? 'Débito' : item.label === 'PIX' ? 'PIX' : item.label}
                      </span>
                    </div>
                    <span className="font-bold text-foreground ml-2 tabular-nums">{formatCurrency(item.amount / 100)}</span>
                  </div>
                ))}
                {(!homeSummary?.byModality || homeSummary.byModality.length === 0) && !homeSummaryLoading && (
                  <p className="text-xs text-muted-foreground">Nenhuma transação</p>
                )}
              </div>
            </div>
          </div>

          {/* Canal de vendas */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-5 pt-4 pb-3">
              <div className="absolute left-0 top-4 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <Activity className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Canal de vendas</h3>
                  <p className="text-xs text-muted-foreground">Origem das transações</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-[120px] h-[120px] flex-shrink-0">
                {homeSummaryLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (homeSummary?.byChannel?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={homeSummary!.byChannel}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {homeSummary!.byChannel.map((_: any, i: number) => (
                          <Cell key={i} fill={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'][i % 5]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Sem dados</div>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {homeSummary?.byChannel?.map((item: any, i: number) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'][i % 5] }} />
                      <span className="text-muted-foreground">
                        {item.label === 'ONLINE' ? 'Online' : item.label === 'PHYSICAL' ? 'Presencial' : item.label === 'TAP_PHONE' ? 'Tap Phone' : item.label}
                      </span>
                    </div>
                    <span className="font-bold text-foreground ml-2 tabular-nums">{formatCurrency(item.amount / 100)}</span>
                  </div>
                ))}
                {(!homeSummary?.byChannel || homeSummary.byChannel.length === 0) && !homeSummaryLoading && (
                  <p className="text-xs text-muted-foreground">Nenhuma transação</p>
                )}
              </div>
            </div>
          </div>

          {/* Conversão de vendas */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-violet-500/8 via-violet-500/4 to-transparent px-5 pt-4 pb-3">
              <div className="absolute left-0 top-4 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-violet-500/60 via-violet-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/30">
                  <BarChart3 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Conversão de vendas</h3>
                  <p className="text-xs text-muted-foreground">Status das transações</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-[120px] h-[120px] flex-shrink-0">
                {homeSummaryLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (homeSummary?.byConversion?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={homeSummary!.byConversion}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {homeSummary!.byConversion.map((entry: any, i: number) => {
                          const statusColors: Record<string, string> = {
                            'PAID': '#10b981',
                            'PENDING': '#f59e0b',
                            'FAILED': '#ef4444',
                            'CANCELLED': '#6b7280',
                            'CANCELED': '#6b7280',
                            'REFUNDED': '#8b5cf6',
                          };
                          return <Cell key={i} fill={statusColors[entry.label] || '#94a3b8'} />;
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Sem dados</div>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {homeSummary?.byConversion?.map((item: any) => {
                  const statusColors: Record<string, string> = {
                    'PAID': '#10b981',
                    'PENDING': '#f59e0b',
                    'FAILED': '#ef4444',
                    'CANCELLED': '#6b7280',
                    'CANCELED': '#6b7280',
                    'REFUNDED': '#8b5cf6',
                  };
                  return (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[item.label] || '#94a3b8' }} />
                        <span className="text-muted-foreground">
                          {item.label === 'PAID' ? 'Pago' : item.label === 'PENDING' ? 'Pendente' : item.label === 'FAILED' ? 'Falha' : item.label === 'CANCELLED' || item.label === 'CANCELED' ? 'Cancelado' : item.label === 'REFUNDED' ? 'Estornado' : item.label}
                        </span>
                      </div>
                      <span className="font-bold text-foreground ml-2 tabular-nums">{formatCurrency(item.amount / 100)}</span>
                    </div>
                  );
                })}
                {(!homeSummary?.byConversion || homeSummary.byConversion.length === 0) && !homeSummaryLoading && (
                  <p className="text-xs text-muted-foreground">Nenhuma transação</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Últimas Transações */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-5 pt-4 pb-3">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Últimas transações</h3>
                  <p className="text-xs text-muted-foreground font-medium">Movimentações recentes da sua conta</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => onNavigate("historico")}>
                <History className="h-3.5 w-3.5" />
                Histórico
              </Button>
            </div>
          </div>

          {dashboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando transações...</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">As transações aparecerão aqui quando houver movimentações</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Transação</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Bruto</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {recentTransactions.map((txn: any) => {
                    const amountReais = (txn.amount || 0) / 100;
                    const grossReais = (txn.original_amount || txn.amount || 0) / 100;
                    const isCredit = amountReais >= 0;
                    return (
                      <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                              {getApiTransactionIcon(txn.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {txn.customer?.name || getApiTransactionLabel(txn.type)}
                              </p>
                              {txn.card?.brand && txn.card?.last_digits && (
                                <p className="text-xs text-muted-foreground">{txn.card.brand} •••• {txn.card.last_digits}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{getApiTransactionLabel(txn.type)}</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{formatDateTime(txn.created_at)}</span>
                        </td>
                        <td className="px-5 py-3">{getApiStatusBadge(txn.status)}</td>
                        <td className="px-5 py-3 text-right hidden lg:table-cell">
                          <span className="font-medium text-sm text-muted-foreground">
                            {formatCurrency(grossReais)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={cn("font-semibold text-sm", isCredit ? "text-emerald-600" : "text-red-500")}>
                            {isCredit ? "+" : ""}{formatCurrency(amountReais)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar direita - visível apenas em desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <BankingSidebar
          showBalance={showBalance}
          setShowBalance={setShowBalance}
          dashboardData={dashboardData}
          dashboardLoading={dashboardLoading}
          establishment={establishment}
        />
      </div>
    </div>
  );
}

// ============ COMPONENTE: HISTÓRICO DE TRANSAÇÕES ============
function BankingHistorico() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Buscar establishment
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;

  // Buscar transações paginadas (para a tabela)
  const { data: txData, isLoading: txLoading, isError: txError } = trpc.paytime.getTransactions.useQuery(
    {
      establishmentId: estId!,
      page,
      perPage,
      search: searchTerm || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
    },
    { enabled: !!estId && hasBanking, placeholderData: (prev: any) => prev, staleTime: 30000 }
  );

  // Buscar resumo (totais corretos de TODAS as transações, com filtros aplicados)
  const { data: summaryData, isLoading: summaryLoading } = trpc.paytime.getTransactionsSummary.useQuery(
    {
      establishmentId: estId!,
      search: searchTerm || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
    },
    { enabled: !!estId && hasBanking, staleTime: 30000 }
  );

  const transactions = txData?.data || [];
  const meta = txData?.meta || { total: 0, per_page: perPage, current_page: 1, last_page: 1 };

  // Totais vindos do endpoint de resumo (calculados com TODAS as transações)
  const totalIn = (summaryData?.totalIn || 0) / 100;
  const totalOut = (summaryData?.totalOut || 0) / 100;
  const totalCount = summaryData?.totalCount ?? meta.total;

  return (
    <div className="space-y-5">
      {/* Resumo - Estilo Banking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total recebido */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowDownLeft className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total recebido</p>
                <p className="text-lg font-bold text-foreground">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency(totalIn)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total enviado */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-red-500/8 via-red-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-red-500/60 via-red-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowUpRight className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total enviado</p>
                <p className="text-lg font-bold text-foreground">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency(totalOut)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total transações */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowRightLeft className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total transações</p>
                <p className="text-lg font-bold text-foreground">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : totalCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transação..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="CREDIT">Crédito</SelectItem>
            <SelectItem value="DEBIT">Débito</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PAID">Concluído</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
            <SelectItem value="REFUNDED">Estornado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela - estilo BankingSidebar */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-5 pt-4 pb-3">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">Transações</h3>
              <p className="text-xs text-muted-foreground font-medium">{meta.total} transações encontradas</p>
            </div>
          </div>
        </div>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando transações...</span>
          </div>
        ) : txError ? (
          <div className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Erro ao carregar transações</p>
            <p className="text-xs text-muted-foreground/70 mt-1">O serviço pode estar temporariamente indisponível. Tente novamente em instantes.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma transação encontrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Tente ajustar os filtros ou aguarde novas movimentações</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Transação</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Bruto</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map((txn: any) => {
                    const amountReais = (txn.amount || 0) / 100;
                    const grossReais = (txn.original_amount || txn.amount || 0) / 100;
                    return (
                      <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                              {getApiTransactionIcon(txn.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {txn.customer?.name || getApiTransactionLabel(txn.type)}
                              </p>
                              {txn.card?.brand && txn.card?.last_digits && (
                                <p className="text-xs text-muted-foreground">{txn.card.brand} •••• {txn.card.last_digits}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{getApiTransactionLabel(txn.type)}</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{formatDateTime(txn.created_at)}</span>
                        </td>
                        <td className="px-5 py-3">{getApiStatusBadge(txn.status)}</td>
                        <td className="px-5 py-3 text-right hidden lg:table-cell">
                          <span className="font-medium text-sm text-muted-foreground">
                            {formatCurrency(grossReais)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={cn("font-semibold text-sm", amountReais >= 0 ? "text-emerald-600" : "text-foreground")}>
                            {amountReais >= 0 ? "+" : ""}{formatCurrency(amountReais)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{meta.total} transações encontradas</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">{page} de {meta.last_page}</span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============ COMPONENTE: EXTRATO ============
function BankingExtrato() {
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;
  const utils = trpc.useUtils();

  // Buscar detalhes completos da transação selecionada
  const { data: txnDetail, isLoading: txnDetailLoading } = trpc.paytime.getTransactionDetail.useQuery(
    { transactionId: selectedTxn?._id || selectedTxn?.id || "", establishmentId: estId! },
    { enabled: !!selectedTxn && !!estId }
  );

  const refundMutation = trpc.paytime.refundByTransactionId.useMutation({
    onSuccess: () => {
      toast.success("Estorno realizado com sucesso!");
      setSelectedTxn(null);
      setConfirmRefund(false);
      setRefunding(false);
      utils.paytime.getTransactions.invalidate();
      utils.paytime.getTransactionsSummary.invalidate();
      utils.paytime.getBalance.invalidate();
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao estornar transação");
      setRefunding(false);
    },
  });

  const { data: balanceData } = trpc.paytime.getBalance.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && hasBanking, staleTime: 30000 }
  );

  const saldoDisponivel = balanceData ? balanceData.balance / 100 : 0;

  const { data: txData, isLoading: txLoading, isError: txError } = trpc.paytime.getTransactions.useQuery(
    {
      establishmentId: estId!,
      page,
      perPage,
      search: searchTerm || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
    },
    { enabled: !!estId && hasBanking, placeholderData: (prev: any) => prev, staleTime: 30000 }
  );

  // Resumo com filtros aplicados
  const { data: summaryData, isLoading: summaryLoading } = trpc.paytime.getTransactionsSummary.useQuery(
    {
      establishmentId: estId!,
      search: searchTerm || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
    },
    { enabled: !!estId && hasBanking, staleTime: 30000 }
  );

  const allTransactions = txData?.data || [];
  const meta = txData?.meta || { total: 0, per_page: perPage, current_page: 1, last_page: 1 };

  // Filtro local por data (a API pode não suportar filtro de data diretamente)
  const transactions = useMemo(() => {
    if (!dateFrom && !dateTo) return allTransactions;
    return allTransactions.filter((txn: any) => {
      const txnDate = new Date(txn.created_at);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (txnDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (txnDate > to) return false;
      }
      return true;
    });
  }, [allTransactions, dateFrom, dateTo]);

  const totalIn = (summaryData?.totalIn || 0) / 100;
  const totalOut = (summaryData?.totalOut || 0) / 100;
  const totalCount = summaryData?.totalCount ?? meta.total;

  const hasActiveFilters = searchTerm || typeFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("Nenhuma movimentação para exportar");
      return;
    }
    setExporting(true);
    try {
      const headers = ["Data", "Tipo", "Descrição", "Status", "Valor (R$)"];
      const rows = transactions.map((txn: any) => [
        formatDateTime(txn.created_at),
        getApiTransactionLabel(txn.type),
        txn.customer?.name || getApiTransactionLabel(txn.type),
        txn.status,
        ((txn.amount || 0) / 100).toFixed(2).replace(".", ","),
      ]);
      const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `extrato_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Extrato exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar extrato");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Resumo - Estilo Banking */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Saldo disponível */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <Wallet className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Saldo disponível</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(saldoDisponivel)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total recebido */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowDownLeft className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total recebido</p>
                <p className="text-lg font-bold text-foreground">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency(totalIn)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total enviado */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-red-500/8 via-red-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-red-500/60 via-red-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowUpRight className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total enviado</p>
                <p className="text-lg font-bold text-foreground">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency(totalOut)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total transações */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowRightLeft className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total transações</p>
                <p className="text-lg font-bold text-foreground">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : totalCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex flex-col gap-3">
          {/* Linha 1: Busca + Tipo + Status */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, tipo..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="CREDIT">Crédito</SelectItem>
                <SelectItem value="DEBIT">Débito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PAID">Concluído</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="FAILED">Falhou</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="REFUNDED">Estornado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Linha 2: Período + Ações */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">De</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="h-9 text-sm"
                />
              </div>
              <span className="text-xs text-muted-foreground mt-5">até</span>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Até</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={handleExportCSV}
                disabled={exporting || transactions.length === 0}
              >
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de movimentações */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden" data-section="extrato-vendas">
        <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-5 pt-4 pb-3">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">Movimentações</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {transactions.length}{dateFrom || dateTo ? ` de ${meta.total}` : ``} movimentações
                  {hasActiveFilters && " (filtradas)"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando extrato...</span>
          </div>
        ) : txError ? (
          <div className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Erro ao carregar extrato</p>
            <p className="text-xs text-muted-foreground/70 mt-1">O serviço pode estar temporariamente indisponível.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters ? "Nenhuma movimentação encontrada com os filtros aplicados" : "Nenhuma movimentação encontrada"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {hasActiveFilters ? "Tente ajustar os filtros" : "As movimentações aparecerão aqui quando houver transações"}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Transação</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Bruto</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map((txn: any) => {
                    const amountReais = (txn.amount || 0) / 100;
                    const grossReais = (txn.original_amount || txn.amount || 0) / 100;
                    const isCredit = amountReais >= 0;
                    return (
                      <tr
                        key={txn.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedTxn(txn)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                              {getApiTransactionIcon(txn.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {txn.customer?.name || getApiTransactionLabel(txn.type)}
                              </p>
                              {txn.card?.brand && txn.card?.last_digits && (
                                <p className="text-xs text-muted-foreground">{txn.card.brand} •••• {txn.card.last_digits}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{getApiTransactionLabel(txn.type)}</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{formatDateTime(txn.created_at)}</span>
                        </td>
                        <td className="px-5 py-3">{getApiStatusBadge(txn.status)}</td>
                        <td className="px-5 py-3 text-right hidden lg:table-cell">
                          <span className="font-medium text-sm text-muted-foreground">
                            {formatCurrency(grossReais)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={cn("font-semibold text-sm", isCredit ? "text-emerald-600" : "text-red-500")}>
                            {isCredit ? "+" : ""}{formatCurrency(amountReais)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{meta.total} movimentações</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">{page} de {meta.last_page}</span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes da transação */}
      <Dialog open={!!selectedTxn} onOpenChange={(open) => { if (!open) setSelectedTxn(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTxn && getApiTransactionIcon(selectedTxn.type)}
              Detalhes da transação
            </DialogTitle>
            <DialogDescription>
              {selectedTxn && `ID: ${selectedTxn.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedTxn && (() => {
            const detail = txnDetail || selectedTxn;
            const amountReais = (detail.amount || selectedTxn.amount || 0) / 100;
            const isCredit = amountReais >= 0;
            const netAmount = detail.net_amount || detail.liquid_amount;
            const feeAmount = detail.fee_amount || detail.tax_amount;
            return (
              <div className="space-y-4">
                {txnDetailLoading && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                    <span className="text-xs text-muted-foreground">Carregando detalhes...</span>
                  </div>
                )}
                {/* Valor principal */}
                <div className="text-center py-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Valor Bruto</p>
                  <p className={cn("text-3xl font-bold", isCredit ? "text-emerald-600" : "text-red-500")}>
                    {isCredit ? "+" : ""}{formatCurrency(amountReais)}
                  </p>
                </div>

                {/* Valor líquido e taxa */}
                {(netAmount || feeAmount) && (
                  <div className="grid grid-cols-2 gap-2">
                    {netAmount && (
                      <div className="text-center py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Líquido</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(netAmount / 100)}</p>
                      </div>
                    )}
                    {feeAmount && (
                      <div className="text-center py-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                        <p className="text-xs text-red-500 dark:text-red-400 font-semibold">Taxa</p>
                        <p className="text-sm font-bold text-red-500 dark:text-red-400">{formatCurrency(feeAmount / 100)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Informações */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">Status</span>
                    {getApiStatusBadge(selectedTxn.status)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">Tipo</span>
                    <span className="text-sm font-medium">{getApiTransactionLabel(selectedTxn.type)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">Data</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedTxn.created_at)}</span>
                  </div>
                  {selectedTxn.customer?.name && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">Cliente</span>
                      <span className="text-sm font-medium">{selectedTxn.customer.name}</span>
                    </div>
                  )}
                  {selectedTxn.customer?.email && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">E-mail</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{selectedTxn.customer.email}</span>
                    </div>
                  )}
                  {selectedTxn.customer?.document && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">Documento</span>
                      <span className="text-sm font-medium">{selectedTxn.customer.document}</span>
                    </div>
                  )}
                  {selectedTxn.card?.brand && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">Cartão</span>
                      <span className="text-sm font-medium">{selectedTxn.card.brand} •••• {selectedTxn.card.last_digits}</span>
                    </div>
                  )}
                  {selectedTxn.installments && selectedTxn.installments > 1 && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">Parcelas</span>
                      <span className="text-sm font-medium">{selectedTxn.installments}x</span>
                    </div>
                  )}
                  {selectedTxn.nsu && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">NSU</span>
                      <span className="text-sm font-medium font-mono">{selectedTxn.nsu}</span>
                    </div>
                  )}
                  {selectedTxn.authorization_code && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">Cód. Autorização</span>
                      <span className="text-sm font-medium font-mono">{selectedTxn.authorization_code}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            {selectedTxn && ['PAID', 'APPROVED', 'CAPTURED'].some(s => selectedTxn.status?.toUpperCase()?.includes(s)) && (
              (selectedTxn.type?.toLowerCase()?.includes('pix') || selectedTxn.payment_type?.toLowerCase()?.includes('pix')) ? (
                <div className="w-full p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-center text-amber-700 dark:text-amber-300 font-medium">Estorno PIX não disponível</p>
                </div>
              ) : !confirmRefund ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmRefund(true)}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Estornar pagamento
                </Button>
              ) : (
                <div className="w-full space-y-2">
                  <p className="text-xs text-center text-destructive font-medium">
                    Tem certeza que deseja estornar esta transação? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmRefund(false)}
                      className="flex-1"
                      disabled={refunding}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setRefunding(true);
                        refundMutation.mutate({
                          transactionId: selectedTxn._id || selectedTxn.id,
                          establishmentId: estId!,
                        });
                      }}
                      className="flex-1"
                      disabled={refunding}
                    >
                      {refunding ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Estornando...</>
                      ) : (
                        "Confirmar estorno"
                      )}
                    </Button>
                  </div>
                </div>
              )
            )}
            <Button variant="outline" onClick={() => { setSelectedTxn(null); setConfirmRefund(false); }} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ COMPONENTE: PAGAR CONTA ============
function BankingPagarConta() {
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [barcode, setBarcode] = useState("");
  const [billetData, setBilletData] = useState<any>(null);
  const [payResult, setPayResult] = useState<any>(null);

  const checkBilletMutation = trpc.paytime.checkBillet.useMutation({
    onSuccess: (data) => {
      setBilletData(data);
      setStep("confirm");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao consultar boleto");
    },
  });

  const payBilletMutation = trpc.paytime.payBillet.useMutation({
    onSuccess: (data) => {
      setPayResult(data);
      setStep("success");
      toast.success("Pagamento realizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar pagamento");
    },
  });

  const loading = checkBilletMutation.isPending || payBilletMutation.isPending;

  const handleConsult = () => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      toast.error("Digite o código de barras ou linha digitável");
      return;
    }
    // Linha digitável geralmente tem pontos/espaços e é mais longa; código de barras é numérico puro
    const isDigitable = trimmed.includes(".") || trimmed.includes(" ") || trimmed.length > 47;
    checkBilletMutation.mutate(
      isDigitable ? { digitable: trimmed } : { barcode: trimmed }
    );
  };

  const handlePay = () => {
    if (!billetData) return;
    // Usar barcode do billetData (retornado pela API) ou o que o usuário digitou
    const barcodeToUse = billetData.barcode || barcode.trim().replace(/[.\s]/g, "");
    payBilletMutation.mutate({
      barcode: barcodeToUse,
      amount: billetData.amount,
      description: `Pagamento boleto - ${billetData.assignor || "Boleto"}`
    });
  };

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-1">Pagamento realizado!</h3>
        <p className="text-sm text-muted-foreground mb-6">O pagamento foi processado com sucesso</p>
        <div className="bg-card rounded-xl border border-border/50 p-5 w-full max-w-md">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beneficiário</span>
              <span className="font-medium">{payResult?.assignor || billetData?.assignor || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor pago</span>
              <span className="font-bold text-emerald-600">{formatCurrency(payResult?.amount || billetData?.amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">{formatDateTime(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
        <Button className="mt-6" onClick={() => { setStep("input"); setBarcode(""); setBilletData(null); setPayResult(null); }}>
          Pagar outra conta
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-5">
      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0 space-y-5">
        {step === "input" && (
          <>
            {/* Card formulário - estilo BankingSidebar */}
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="relative bg-gradient-to-br from-orange-500/8 via-orange-500/4 to-transparent px-5 pt-4 pb-3">
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-orange-500/60 via-orange-500/30 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                    <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">Pagar conta</h3>
                    <p className="text-xs text-muted-foreground font-medium">Digite o código de barras ou a linha digitável</p>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Código de barras ou linha digitável</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite ou cole o código..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="h-10 text-sm font-mono"
                    />
                    <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => toast.info("Funcionalidade de scanner em breve")}>
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={handleConsult} disabled={loading} className="w-full">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Consultando...
                    </span>
                  ) : "Consultar boleto"}
                </Button>
              </div>
            </div>

            {/* Aviso de atenção */}
            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Atenção</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Confira sempre os dados do beneficiário antes de confirmar. Pagamentos não podem ser estornados.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {step === "confirm" && (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-5 pt-4 pb-3">
              <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Confirmar pagamento</h3>
                  <p className="text-xs text-muted-foreground font-medium">Verifique os dados antes de pagar</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 pt-4 space-y-4">
              <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Beneficiário</span>
                  <span className="font-medium text-foreground">{billetData?.assignor || billetData?.recipient_name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CNPJ/CPF</span>
                  <span className="font-medium text-foreground">{billetData?.recipient_document || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span className="font-medium text-foreground">{billetData?.due_date ? formatDate(billetData.due_date) : "—"}</span>
                </div>
                {(billetData?.discount || billetData?.fine || billetData?.interest) && (
                  <>
                    {billetData.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto</span>
                        <span className="font-medium text-emerald-600">- {formatCurrency(billetData.discount)}</span>
                      </div>
                    )}
                    {billetData.fine > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Multa</span>
                        <span className="font-medium text-red-500">+ {formatCurrency(billetData.fine)}</span>
                      </div>
                    )}
                    {billetData.interest > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Juros</span>
                        <span className="font-medium text-red-500">+ {formatCurrency(billetData.interest)}</span>
                      </div>
                    )}
                  </>
                )}
                {billetData?.original_amount && billetData.original_amount !== billetData.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor original</span>
                    <span className="font-medium text-foreground">{formatCurrency(billetData.original_amount)}</span>
                  </div>
                )}
                <div className="border-t border-border/40 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-foreground">Total a pagar</span>
                    <span className="text-lg font-bold text-foreground">{formatCurrency(billetData?.amount || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>Cancelar</Button>
                <Button className="flex-1" onClick={handlePay} disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processando...
                    </span>
                  ) : "Confirmar pagamento"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar direita - estilo BankingSidebar */}
      <div className="hidden lg:block w-[420px] flex-shrink-0">
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden sticky top-4">
          {/* Header com gradiente */}
          <div className="relative bg-gradient-to-br from-orange-500/8 via-orange-500/4 to-transparent px-5 pt-5 pb-4">
            <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-orange-500/60 via-orange-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">Pagamento</h3>
                <p className="text-xs text-muted-foreground">Boletos e contas</p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-0">
            {/* Instruções */}
            <div className="py-4 border-b border-border/30">
              <span className="text-xs font-bold text-foreground">Como pagar</span>
            </div>

            <div className="py-3 border-b border-border/30">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Insira o código</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Digite ou cole o código de barras / linha digitável</p>
                </div>
              </div>
            </div>

            <div className="py-3 border-b border-border/30">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Consulte o boleto</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verifique os dados do beneficiário e valor</p>
                </div>
              </div>
            </div>

            <div className="py-3 border-b border-border/30">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Confirme o pagamento</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Revise os dados e confirme para efetuar o pagamento</p>
                </div>
              </div>
            </div>

            {/* Tipos aceitos */}
            <div className="pt-1">
              <div className="pb-2.5 border-b border-border/30">
                <span className="text-xs font-bold text-foreground">Tipos aceitos</span>
              </div>
              <div className="divide-y divide-border/30">
                <div className="flex items-center gap-2.5 py-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                    <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Boletos bancários</span>
                </div>
                <div className="flex items-center gap-2.5 py-3">
                  <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                    <Receipt className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Contas de consumo</span>
                </div>
                <div className="flex items-center gap-2.5 py-3">
                  <div className="h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                    <Landmark className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Tributos e taxas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTE: ÁREA PIX (com API real) ============
function BankingAreaPix({ onNavigate }: { onNavigate: (view: BankingView) => void }) {
  // Unified layout - no tabs needed
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "IN" | "OUT">("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // PIX Transfer state
  const [pixStep, setPixStep] = useState<"input" | "confirm" | "success">("input");
  const [pixMode, setPixMode] = useState<"key" | "copiacola">("key");
  const [pixKeyType, setPixKeyType] = useState<"CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM">("CPF");
  const [pixKey, setPixKey] = useState("");
  const [pixHashCode, setPixHashCode] = useState("");
  const [pixAmount, setPixAmount] = useState("");
  const [pixInitData, setPixInitData] = useState<any>(null);
  const [pixInitId, setPixInitId] = useState("");
  const [pixConfirmResult, setPixConfirmResult] = useState<any>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // ---- Funções de formatação de chave PIX ----
  const EMAIL_DOMAINS = ["gmail.com", "icloud.com", "outlook.com", "hotmail.com", "yahoo.com.br", "live.com"];

  const formatCPF = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  }, []);

  const formatCNPJ = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0,2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8)}`;
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  }, []);

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 3) return `${digits.slice(0,2)} ${digits.slice(2)}`;
    if (digits.length <= 7) return `${digits.slice(0,2)} ${digits.slice(2,3)} ${digits.slice(3)}`;
    return `${digits.slice(0,2)} ${digits.slice(2,3)} ${digits.slice(3,7)} ${digits.slice(7)}`;
  }, []);

  const handlePixKeyChange = useCallback((value: string) => {
    if (pixKeyType === "CPF") {
      setPixKey(formatCPF(value));
    } else if (pixKeyType === "CNPJ") {
      setPixKey(formatCNPJ(value));
    } else if (pixKeyType === "PHONE") {
      setPixKey(formatPhone(value));
    } else if (pixKeyType === "EMAIL") {
      setPixKey(value);
      setShowEmailSuggestions(value.includes("@") && !value.includes(".", value.indexOf("@")));
    } else {
      setPixKey(value);
    }
  }, [pixKeyType, formatCPF, formatCNPJ, formatPhone]);

  const emailSuggestions = useMemo(() => {
    if (pixKeyType !== "EMAIL" || !pixKey.includes("@")) return [];
    const [localPart, domainPart] = pixKey.split("@");
    if (!localPart) return [];
    return EMAIL_DOMAINS
      .filter(d => !domainPart || d.startsWith(domainPart.toLowerCase()))
      .map(d => `${localPart}@${d}`);
  }, [pixKey, pixKeyType]);

  // Formatação de valor em moeda brasileira (centavos)
  const formatInputCurrency = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const cents = parseInt(digits, 10);
    const reais = (cents / 100).toFixed(2);
    return reais.replace(".", ",");
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    const formatted = formatInputCurrency(value);
    setPixAmount(formatted);
  }, [formatInputCurrency]);

  // Converter valor formatado para float (para enviar à API)
  const getAmountFloat = useCallback((formatted: string) => {
    if (!formatted) return 0;
    return parseFloat(formatted.replace(",", "."));
  }, []);

  const [showBalance, setShowBalance] = useState(true);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;

  // Reutilizar getBankingDashboard que já traz o saldo (mesmos params do Banking Home para cache sharing)
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.paytime.getBankingDashboard.useQuery(
    { establishmentId: estId!, transactionsPerPage: 5 },
    { enabled: !!estId && hasBanking, staleTime: 30000, refetchInterval: 60000 }
  );
  const saldoDisponivel = dashboardData?.balance ? dashboardData.balance.balance / 100 : 0;
  const balanceLoading = dashboardLoading;
  const balanceError = false;

  // Listar transferências PIX (recebidas + enviadas)
  const { data: txData, isLoading: txLoading, isError: txError } = trpc.paytime.listPixTransfers.useQuery(
    {
      establishmentId: estId!,
      page,
      perPage,
      search: searchTerm || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      methodFilter,
    },
    { enabled: !!estId && hasBanking, placeholderData: (prev: any) => prev, staleTime: 30000 }
  );

  // Detalhar transferência selecionada
  const { data: transferDetail, isLoading: detailLoading } = trpc.paytime.getPixTransferDetail.useQuery(
    { establishmentId: estId!, transferId: selectedTransfer?.id || selectedTransfer?._id || "" },
    { enabled: !!estId && hasBanking && !!selectedTransfer }
  );

  const transfers = txData?.data || [];
  const meta = txData?.meta || { total: 0, per_page: perPage, current_page: 1, last_page: 1 };

  // Mutations
  const utils = trpc.useUtils();
  const initPixMutation = trpc.paytime.initPixTransfer.useMutation({
    onSuccess: (data) => {
      setPixInitData(data);
      setPixInitId(data.init_id || data.id || "");
      setPixStep("confirm");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao buscar destinatário PIX");
    },
  });

  const confirmPixMutation = trpc.paytime.confirmPixTransfer.useMutation({
    onSuccess: (data) => {
      setPixConfirmResult(data);
      setPixStep("success");
      toast.success("PIX enviado com sucesso!");
      utils.paytime.listPixTransfers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao confirmar PIX");
    },
  });

  const handleInitPix = () => {
    if (!estId) return;
    if (pixMode === "key" && !pixKey.trim()) { toast.error("Digite a chave PIX"); return; }
    if (pixMode === "copiacola" && !pixHashCode.trim()) { toast.error("Cole o código copia e cola"); return; }
    if (!pixAmount || getAmountFloat(pixAmount) <= 0) { toast.error("Digite um valor válido"); return; }

    initPixMutation.mutate({
      establishmentId: estId,
      type: pixMode === "copiacola" ? "HASH" : pixKeyType,
      key: pixMode === "key" ? pixKey : undefined,
      hashCode: pixMode === "copiacola" ? pixHashCode : undefined,
    });
  };

  const handleConfirmPix = () => {
    if (!estId || !pixInitId) return;
    const amountCents = Math.round(getAmountFloat(pixAmount) * 100);

    confirmPixMutation.mutate({
      establishmentId: estId,
      type: pixMode === "copiacola" ? "HASH" : pixKeyType,
      key: pixMode === "key" ? pixKey : undefined,
      hashCode: pixMode === "copiacola" ? pixHashCode : undefined,
      amount: amountCents,
      initId: pixInitId,
    });
  };

  const resetPixForm = () => {
    setPixStep("input");
    setPixKey("");
    setPixHashCode("");
    setPixAmount("");
    setPixInitData(null);
    setPixInitId("");
    setPixConfirmResult(null);
  };

  const getTransferStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED" || s === "PAID" || s === "APPROVED" || s === "CONFIRMED") {
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Concluído</span>;
    }
    if (s === "PENDING" || s === "PROCESSING" || s === "WAITING") {
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Pendente</span>;
    }
    if (s === "FAILED" || s === "ERROR" || s === "DECLINED") {
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Falhou</span>;
    }
    if (s === "CANCELLED" || s === "REFUNDED") {
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10 px-2 py-0.5 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />{s === "REFUNDED" ? "Estornado" : "Cancelado"}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">{status}</span>;
  };

  return (
    <div className="space-y-5">
      {/* ===== LAYOUT LADO A LADO: Transferências + Fazer PIX ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-5">
        {/* COLUNA ESQUERDA: Lista de Transferências PIX */}
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transferência..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={methodFilter} onValueChange={(v: any) => { setMethodFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="IN">Recebidas</SelectItem>
                <SelectItem value="OUT">Enviadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="FAILED">Falhou</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Transferências */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-5 pt-4 pb-3">
              <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <QrCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Transferências PIX</h3>
                  <p className="text-xs text-muted-foreground font-medium">{meta.total} transferências encontradas</p>
                </div>
              </div>
            </div>

            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando transferências PIX...</span>
              </div>
            ) : txError ? (
              <div className="py-12 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Erro ao carregar transferências</p>
                <p className="text-xs text-muted-foreground/70 mt-1">A API pode estar temporariamente indisponível.</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="py-12 text-center">
                <QrCode className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-bold text-muted-foreground">SEM DADOS</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Nenhuma transferência PIX encontrada</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Descrição</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tipo</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {transfers.map((t: any) => {
                        const amountReais = Math.abs((t.amount || 0) / 100);
                        const isIncoming = t.method === 'IN';
                        const recipientName = isIncoming
                          ? (t.sender?.name || t.sender?.establishment?.name || t.description || "PIX Recebido")
                          : (t.recipient?.name || t.recipient?.establishment?.name || t.description || "PIX Enviado");
                        return (
                          <tr
                            key={t.id || t._id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedTransfer(t)}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0", isIncoming ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-red-100 dark:bg-red-500/15")} style={{borderRadius: '10px'}}>
                                  {isIncoming
                                    ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    : <ArrowUpRight className="h-4 w-4 text-red-500 dark:text-red-400" />
                                  }
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate text-sm">{recipientName}</p>
                                  {!isIncoming && t.recipient?.document && <p className="text-xs text-muted-foreground">{t.recipient.document}</p>}
                                  {isIncoming && t.sender?.document && <p className="text-xs text-muted-foreground">{t.sender.document}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-lg", isIncoming ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400")}>
                                {isIncoming ? "Recebido" : "Enviado"}
                              </span>
                            </td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              <span className="text-xs text-muted-foreground">{t.created_at ? formatDateTime(t.created_at) : "—"}</span>
                            </td>
                            <td className="px-5 py-3">{getTransferStatusBadge(t.status)}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={cn("font-semibold text-sm", isIncoming ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                                {isIncoming ? "+" : "-"}{typeof amountReais === "number" ? amountReais.toFixed(2).replace(".", ",") : amountReais}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {meta.last_page > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Página {meta.current_page} de {meta.last_page} ({meta.total} transferências)
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">{page} de {meta.last_page}</span>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dialog de detalhes da transferência */}
          <Dialog open={!!selectedTransfer} onOpenChange={(open) => { if (!open) setSelectedTransfer(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-emerald-600" />
                  Detalhes da Transferência PIX
                </DialogTitle>
                <DialogDescription>Informações completas da transferência</DialogDescription>
              </DialogHeader>
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando detalhes...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Destinatário</span>
                      <span className="font-medium text-foreground">
                        {transferDetail?.recipient?.name || selectedTransfer?.recipient?.name || selectedTransfer?.description || "—"}
                      </span>
                    </div>
                    {(transferDetail?.recipient?.document || selectedTransfer?.recipient?.document) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Documento</span>
                        <span className="font-medium text-foreground">{transferDetail?.recipient?.document || selectedTransfer?.recipient?.document}</span>
                      </div>
                    )}
                    {(transferDetail?.recipient?.bank || selectedTransfer?.recipient?.bank) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Banco</span>
                        <span className="font-medium text-foreground">{transferDetail?.recipient?.bank || selectedTransfer?.recipient?.bank}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {getTransferStatusBadge(transferDetail?.status || selectedTransfer?.status)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Data</span>
                      <span className="font-medium text-foreground">
                        {(transferDetail?.created_at || selectedTransfer?.created_at) ? formatDateTime(transferDetail?.created_at || selectedTransfer?.created_at) : "—"}
                      </span>
                    </div>
                    {(transferDetail?.end_to_end_id || selectedTransfer?.end_to_end_id) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">End-to-End ID</span>
                        <span className="font-medium text-foreground text-xs">{transferDetail?.end_to_end_id || selectedTransfer?.end_to_end_id}</span>
                      </div>
                    )}
                    <div className="border-t border-border/40 pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-foreground">Valor</span>
                        <span className="text-lg font-bold text-red-500">
                          -{(Math.abs((transferDetail?.amount || selectedTransfer?.amount || 0) / 100)).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* COLUNA DIREITA: Saldo + Fazer PIX */}
        <div className="space-y-4">
          {/* Card de Saldo Disponível */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-5 pt-4 pb-3">
              <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Saldo disponível</p>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      {showBalance ? <Eye className="h-3.5 w-3.5 text-muted-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {(balanceLoading && !dashboardData && !balanceError) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : balanceError && !dashboardData ? (
                      <span className="text-sm text-muted-foreground">Indispon\u00edvel</span>
                    ) : showBalance ? formatCurrency(saldoDisponivel) : "R$ \u2022\u2022\u2022\u2022\u2022\u2022"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {pixStep === "input" && (
            <div className="bg-card rounded-xl border border-border/50 overflow-visible">
              <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-5 pt-4 pb-3 rounded-t-xl">
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                    <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">Enviar PIX</h3>
                    <p className="text-xs text-muted-foreground font-medium">Transferência instantânea via chave PIX ou copia e cola</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* Modo: Chave ou Copia e Cola */}
                <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
                  <button
                    onClick={() => setPixMode("key")}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                      pixMode === "key" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Chave PIX
                  </button>
                  <button
                    onClick={() => setPixMode("copiacola")}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                      pixMode === "copiacola" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Copia e Cola
                  </button>
                </div>

                {pixMode === "key" && (
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Chave PIX</Label>
                    <div className="flex gap-2 items-stretch">
                      <div className="relative flex-1">
                        <Input
                          ref={pixKeyType === "EMAIL" ? emailInputRef : undefined}
                          placeholder={
                            pixKeyType === "CPF" ? "000.000.000-00" :
                            pixKeyType === "CNPJ" ? "00.000.000/0000-00" :
                            pixKeyType === "EMAIL" ? "email@exemplo.com" :
                            pixKeyType === "PHONE" ? "88 9 1234 5678" :
                            "Chave aleatória"
                          }
                          value={pixKey}
                          onChange={(e) => handlePixKeyChange(e.target.value)}
                          onFocus={() => { if (pixKeyType === "EMAIL" && pixKey.includes("@")) setShowEmailSuggestions(true); }}
                          onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                          className="h-[42px] text-sm w-full"
                          inputMode={pixKeyType === "CPF" || pixKeyType === "CNPJ" || pixKeyType === "PHONE" ? "numeric" : "email"}
                        />
                        {showEmailSuggestions && emailSuggestions.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg overflow-hidden">
                            {emailSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                onMouseDown={(e) => { e.preventDefault(); setPixKey(suggestion); setShowEmailSuggestions(false); }}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Select value={pixKeyType} onValueChange={(v: any) => { setPixKeyType(v); setPixKey(""); setShowEmailSuggestions(false); }}>
                        <SelectTrigger className="h-[42px] text-sm w-[120px] flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                          <SelectItem value="EMAIL">E-mail</SelectItem>
                          <SelectItem value="PHONE">Telefone</SelectItem>
                          <SelectItem value="RANDOM">Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {pixMode === "copiacola" && (
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Código Copia e Cola</Label>
                    <Input
                      placeholder="Cole aqui o código PIX copia e cola"
                      value={pixHashCode}
                      onChange={(e) => setPixHashCode(e.target.value)}
                      className="h-10 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Cole o código gerado pelo QR Code PIX</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Valor (R$)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={pixAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="h-[42px] text-sm"
                  />
                </div>

                <Button onClick={handleInitPix} disabled={initPixMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  {initPixMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Buscando destinatário...</span>
                  ) : (
                    <span className="flex items-center gap-2"><ArrowRight className="h-4 w-4" />Continuar</span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {pixStep === "confirm" && (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-5 pt-4 pb-3">
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">Confirmar PIX</h3>
                    <p className="text-xs text-muted-foreground font-medium">Verifique os dados antes de enviar</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                  {pixInitData?.recipient?.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Destinatário</span>
                      <span className="font-medium text-foreground">{pixInitData.recipient.name}</span>
                    </div>
                  )}
                  {pixInitData?.recipient?.document && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Documento</span>
                      <span className="font-medium text-foreground">{pixInitData.recipient.document}</span>
                    </div>
                  )}
                  {pixInitData?.recipient?.bank && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Instituição</span>
                      <span className="font-medium text-foreground">{pixInitData.recipient.bank}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chave</span>
                    <span className="font-medium text-foreground">
                      {pixMode === "copiacola" ? "Copia e Cola" : `${pixKeyType}: ${pixKey}`}
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-foreground">Valor a enviar</span>
                      <span className="text-lg font-bold text-foreground">{pixAmount || "0,00"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setPixStep("input")}>Voltar</Button>
                  <Button className="flex-1" onClick={handleConfirmPix} disabled={confirmPixMutation.isPending}>
                    {confirmPixMutation.isPending ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Enviando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="h-4 w-4" />Enviar PIX</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {pixStep === "success" && (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="flex flex-col items-center justify-center py-10 px-5">
                <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">PIX enviado!</h3>
                <p className="text-xs text-muted-foreground mb-4">A transferência foi realizada com sucesso</p>
                <div className="bg-muted/20 rounded-xl p-4 w-full space-y-3 text-sm">
                  {pixInitData?.recipient?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destinatário</span>
                      <span className="font-medium">{pixInitData.recipient.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-bold text-foreground">{pixAmount || "0,00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                </div>
                <Button onClick={resetPixForm} className="w-full mt-4">
                  Enviar outro PIX
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTE: DADOS DO ESTABELECIMENTO ============
function BankingEstabelecimento({ onNavigate }: { onNavigate?: (view: BankingView) => void }) {
  const { data: establishment, refetch: refetchEstablishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;
  const toggleCardMutation = trpc.establishment.update.useMutation({
    onSuccess: () => { refetchEstablishment(); toast.success("Configuração atualizada!"); },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar"),
  });

  const { data: detailsData, isLoading: detailsLoading } = trpc.paytime.getEstablishmentDetails.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && hasBanking, staleTime: 60000 }
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status - estilo BankingSidebar */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-5 pt-4 pb-3">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground">
                    {detailsLoading ? "Carregando..." : detailsData?.name || establishment?.name || "Estabelecimento"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    ID: {establishment?.paytimeEstablishmentId || "—"}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium">
                {detailsData?.status === "ACTIVE" || detailsData?.status === "APPROVED" ? "Ativo" : detailsData?.status || "—"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botão Planos e Tarifas */}
        <button
          onClick={() => onNavigate?.("taxas")}
          className="bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group hover:border-rose-200 dark:hover:border-rose-500/30"
        >
          <div className="relative bg-gradient-to-br from-rose-500/8 via-rose-500/4 to-transparent px-5 pt-4 pb-3 h-full">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-rose-500/60 via-rose-500/30 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Percent className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Planos e Tarifas</h3>
                  <p className="text-xs text-muted-foreground font-medium">Taxas comerciais e tarifas bancárias</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dados cadastrais - estilo BankingSidebar */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-5 pt-4 pb-3">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">Dados cadastrais</h3>
                <p className="text-xs text-muted-foreground font-medium">Informações do estabelecimento</p>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-3">
            {detailsLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Carregando dados...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ/CPF</p>
                    <p className="font-medium text-foreground">{detailsData?.document || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium text-foreground">{detailsData?.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium text-foreground">{String(detailsData?.phone || "—")}</p>
                  </div>
                </div>
                {detailsData?.addresses && detailsData.addresses.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="font-medium text-foreground">
                        {detailsData.addresses[0].street}, {detailsData.addresses[0].number}
                        {detailsData.addresses[0].complement ? ` - ${detailsData.addresses[0].complement}` : ""}
                        {" — "}{detailsData.addresses[0].neighborhood}, {detailsData.addresses[0].city}/{detailsData.addresses[0].state}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gateways de pagamento - estilo BankingSidebar */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-teal-500/8 via-teal-500/4 to-transparent px-5 pt-4 pb-3">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-teal-500/60 via-teal-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <CreditCard className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">Gateways de pagamento</h3>
                <p className="text-xs text-muted-foreground font-medium">Métodos de pagamento habilitados</p>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium">PIX</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  establishment?.paytimeEnabled
                    ? "bg-emerald-500"
                    : "bg-red-500"
                )} />
                <span className={establishment?.paytimeEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-red-500/70 dark:text-red-400/70"}>
                  {establishment?.paytimeEnabled ? "Ativo" : "Inativo"}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    establishment?.paytimeCardEnabled
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  )} />
                  <span className={establishment?.paytimeCardEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-red-500/70 dark:text-red-400/70"}>
                    {establishment?.paytimeCardEnabled ? "Ativo" : "Inativo"}
                  </span>
                </span>
                <Switch
                  checked={establishment?.paytimeCardEnabled ?? false}
                  onCheckedChange={(checked) => {
                    if (estId) {
                      toggleCardMutation.mutate({ id: estId, paytimeCardEnabled: checked });
                    }
                  }}
                  disabled={!estId || toggleCardMutation.isPending}
                  className="scale-75"
                />
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Débito</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400">Em breve</span>
              </span>
            </div>
            {/* Toggle repassar taxa cartão online */}
            {establishment?.paytimeCardEnabled && (
              <div className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-500/5 rounded-lg p-3 border border-amber-200/50 dark:border-amber-500/20">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <div>
                    <span className="text-sm font-medium">Repassar taxa (R$ 0,99)</span>
                    <p className="text-[10px] text-muted-foreground leading-tight">Cliente paga a taxa do cartão online</p>
                  </div>
                </div>
                <Switch
                  checked={(establishment as any)?.paytimeCardFeePassthrough ?? true}
                  onCheckedChange={(checked) => {
                    if (estId) {
                      toggleCardMutation.mutate({ id: estId, paytimeCardFeePassthrough: checked });
                    }
                  }}
                  disabled={!estId || toggleCardMutation.isPending}
                  className="scale-75"
                />
              </div>
            )}
          </div>
          </div>
        </div>
      </div>


    </div>
  );
}

// ============ COMPONENTE: LIQUIDAÇÕES / REPASSES ============
function BankingLiquidacoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedLiquidation, setSelectedLiquidation] = useState<any>(null);
  const perPage = 15;

  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;

  const { data: liqData, isLoading, isError } = trpc.paytime.getLiquidations.useQuery(
    {
      establishmentId: estId!,
      page,
      perPage,
      search: searchTerm || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
    },
    { enabled: !!estId && hasBanking, placeholderData: (prev: any) => prev, staleTime: 30000 }
  );

  const liquidations = liqData?.data || [];
  const meta = liqData?.meta || { total_amount: 0, total_transactions: 0, total_payments: 0 };
  const totalPages = liqData?.lastPage || 1;
  const totalItems = liqData?.total || 0;

  const totalAmountReais = (meta.total_amount || 0) / 100;
  const hasFilters = searchTerm || statusFilter !== "all";

  function getLiquidationStatusBadge(status: string) {
    const map: Record<string, { label: string; className: string }> = {
      PAID: { label: "Pago", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
      PENDING: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
      PROCESSING: { label: "Processando", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
      CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400" },
      FAILED: { label: "Falhou", className: "bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400" },
    };
    const s = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return <Badge variant="outline" className={cn("text-xs font-semibold border-0 px-2 py-0.5", s.className)}>{s.label}</Badge>;
  }

  function exportCSV() {
    if (!liquidations.length) return;
    const headers = ["ID", "Valor (R$)", "Transações", "Status", "Data", "Estabelecimento"];
    const rows = liquidations.map((liq: any) => [
      liq._id,
      ((liq.amount || 0) / 100).toFixed(2),
      liq.transactions || 0,
      liq.status || "-",
      liq.created_at ? new Date(liq.created_at).toLocaleDateString("pt-BR") : "-",
      liq.establishment?.name1 || "-",
    ]);
    const csv = [headers.join(";"), ...rows.map((r: any[]) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liquidacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação CSV realizada com sucesso!");
  }

  return (
    <div className="space-y-5">
      {/* Resumo - Estilo Banking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total liquidado */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <DollarSign className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total liquidado</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : formatCurrency(totalAmountReais)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total transações */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <ArrowRightLeft className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total transações</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : meta.total_transactions}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Total pagamentos */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-amber-500/8 via-amber-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-amber-500/60 via-amber-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <Banknote className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total pagamentos</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : meta.total_payments}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar liquidação..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setPage(1); }}>
            <XCircle className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={exportCSV} disabled={!liquidations.length}>
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="relative bg-gradient-to-br from-amber-500/8 via-amber-500/4 to-transparent px-5 pt-4 pb-3">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-amber-500/60 via-amber-500/30 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">Liquidações</h3>
              <p className="text-xs text-muted-foreground font-medium">{totalItems} liquidações encontradas</p>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando liquidações...</span>
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Erro ao carregar liquidações</p>
            <p className="text-xs text-muted-foreground/70 mt-1">O serviço pode estar temporariamente indisponível. Tente novamente em instantes.</p>
          </div>
        ) : liquidations.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma liquidação encontrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">As liquidações aparecerão aqui quando houver repasses realizados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Liquidação</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Transações</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {liquidations.map((liq: any) => {
                    const amountReais = (liq.amount || 0) / 100;
                    return (
                      <tr key={liq._id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedLiquidation(liq)}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                              <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {liq.establishment?.name1 || "Liquidação"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                ID: {liq._id?.slice(-8) || "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{liq.transactions || 0} transações</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{liq.created_at ? formatDateTime(liq.created_at) : "-"}</span>
                        </td>
                        <td className="px-5 py-3">{getLiquidationStatusBadge(liq.status)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-semibold text-sm text-emerald-600">
                            {formatCurrency(amountReais)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{totalItems} liquidações encontradas</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">{page} de {totalPages}</span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar de Detalhes - estilo Banking */}
      <Sheet open={!!selectedLiquidation} onOpenChange={(open) => !open && setSelectedLiquidation(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0" hideCloseButton>
          <SheetTitle className="sr-only">Detalhes da Liquidação</SheetTitle>
          <SheetDescription className="sr-only">Informações completas do repasse</SheetDescription>
          {/* Header com degradê - estilo Banking */}
          <div className="relative bg-gradient-to-br from-amber-500/8 via-amber-500/4 to-transparent px-5 pt-5 pb-4 border-b border-border/50">
            <div className="absolute left-0 top-5 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-amber-500/60 via-amber-500/30 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                  <DollarSign className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Detalhes da Liquidação</h3>
                  <p className="text-xs text-muted-foreground font-medium">Informações completas do repasse</p>
                </div>
              </div>
              <button onClick={() => setSelectedLiquidation(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {selectedLiquidation && (
            <div className="p-5 space-y-4">
              {/* Valor principal */}
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Valor liquidado</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency((selectedLiquidation.amount || 0) / 100)}
                </p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-0.5">Status</p>
                  {getLiquidationStatusBadge(selectedLiquidation.status)}
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-0.5">Transações</p>
                  <p className="text-sm font-bold text-foreground">{selectedLiquidation.transactions || 0}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-0.5">Data criação</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedLiquidation.created_at ? new Date(selectedLiquidation.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-0.5">Última atualização</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedLiquidation.updated_at ? new Date(selectedLiquidation.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
              </div>

              {/* Estabelecimento */}
              {selectedLiquidation.establishment && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Estabelecimento</p>
                  <p className="text-sm font-medium text-foreground">{selectedLiquidation.establishment.name1}</p>
                  {selectedLiquidation.establishment.name2 && (
                    <p className="text-xs text-muted-foreground">{selectedLiquidation.establishment.name2}</p>
                  )}
                  {selectedLiquidation.establishment.document && (
                    <p className="text-xs text-muted-foreground mt-0.5">Doc: {selectedLiquidation.establishment.document}</p>
                  )}
                </div>
              )}

              {/* Planos */}
              {selectedLiquidation.plans && selectedLiquidation.plans.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Planos</p>
                  <div className="space-y-1">
                    {selectedLiquidation.plans.map((plan: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.modality}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagamentos */}
              {selectedLiquidation.payments && selectedLiquidation.payments.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">Pagamentos</p>
                  <div className="space-y-2">
                    {selectedLiquidation.payments.map((pay: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-background/50 rounded-lg p-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {formatCurrency((pay.amount || 0) / 100)}
                            </span>
                            {getLiquidationStatusBadge(pay.status)}
                          </div>
                          {pay.receipt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {pay.receipt.bank?.name || "Banco"} • {pay.receipt.form_receipt || ""}
                              {pay.receipt.account_number ? ` • Conta: ${pay.receipt.account_number}` : ""}
                            </p>
                          )}
                          {pay.original_amount && pay.original_amount !== pay.amount && (
                            <p className="text-xs text-muted-foreground">
                              Valor original: {formatCurrency((pay.original_amount || 0) / 100)}
                            </p>
                          )}
                        </div>
                        {pay.send_to_establishment && (
                          <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400 px-1.5 py-0">Enviado</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico */}
              {selectedLiquidation.history && selectedLiquidation.history.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">Histórico</p>
                  <div className="space-y-1.5">
                    {selectedLiquidation.history.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getLiquidationStatusBadge(h.status)}
                          {h.user && (
                            <span className="text-xs text-muted-foreground">
                              por {h.user.first_name} {h.user.last_name}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {h.created_at ? formatDateTime(h.created_at) : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reprocessamento */}
              {selectedLiquidation.reprocessing && (
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Esta liquidação está em reprocessamento</p>
                </div>
              )}

              {/* ID */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-semibold mb-0.5">ID da Liquidação</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{selectedLiquidation._id}</p>
              </div>

              {/* Botão fechar */}
              <Button variant="outline" className="w-full" onClick={() => setSelectedLiquidation(null)}>Fechar</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============ COMPONENTE: TAXAS E TARIFAS ============
function BankingTaxas() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const hasBanking = !!establishment?.paytimeBankingActive;
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  const { data: taxData, isLoading, isError } = trpc.paytime.getTaxesAndFees.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && hasBanking, staleTime: 60000 }
  );

  const allPlanDetails = taxData?.planDetails || [];
  // Filtrar apenas os planos relevantes: PHYSICAL (presencial) e ONLINE
  const planDetails = useMemo(() => {
    const physical = allPlanDetails.find((p: any) => p.modality?.toUpperCase() === 'PHYSICAL');
    const online = allPlanDetails.find((p: any) => p.modality?.toUpperCase() === 'ONLINE');
    return [physical, online].filter(Boolean) as any[];
  }, [allPlanDetails]);
  const feesBanking = taxData?.feesBanking || [];
  const activeFees = feesBanking.length > 0 ? feesBanking[0] : null;

  // Plano selecionado (para os cards de resumo e tabela de bandeiras)
  const selectedPlan = planDetails.length > 0 ? planDetails[Math.min(selectedPlanIdx, planDetails.length - 1)] : null;
  // A taxa PIX real fica na bandeira BACEN, não nas bandeiras de cartão
  const bacenFlag = selectedPlan?.flags?.find((f: any) => f.name === 'BACEN');
  // Para débito e crédito, usar a primeira bandeira de cartão (não BACEN/ANTIFRAUD)
  const mainCardFlag = selectedPlan?.flags?.find((f: any) => !['BACEN', 'ANTIFRAUD', 'OTHERS'].includes(f.name) && f.active);

  // Helper: traduzir modalidade
  function translateModality(modality: string | undefined): string {
    if (!modality) return 'Padrão';
    const map: Record<string, string> = {
      PHYSICAL: 'Presencial',
      ONLINE: 'Online',
      ALL: 'Todos',
    };
    return map[modality.toUpperCase()] || modality;
  }

  // Helper: ícone da modalidade
  function getModalityIcon(modality: string | undefined) {
    if (!modality) return Store;
    switch (modality.toUpperCase()) {
      case 'ONLINE': return Globe;
      case 'PHYSICAL': return Store;
      default: return Layers;
    }
  }

  // Helper: cor da modalidade
  function getModalityColors(modality: string | undefined) {
    if (!modality) return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/15', gradient: 'from-rose-500/8 via-rose-500/4', border: 'from-rose-500/60 via-rose-500/30' };
    switch (modality.toUpperCase()) {
      case 'ONLINE': return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15', gradient: 'from-blue-500/8 via-blue-500/4', border: 'from-blue-500/60 via-blue-500/30' };
      case 'PHYSICAL': return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/15', gradient: 'from-amber-500/8 via-amber-500/4', border: 'from-amber-500/60 via-amber-500/30' };
      default: return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/15', gradient: 'from-rose-500/8 via-rose-500/4', border: 'from-rose-500/60 via-rose-500/30' };
    }
  }

  // Helper: formatar taxa como percentual
  function formatFeePercent(value: number | undefined | null): string {
    if (value === undefined || value === null) return "-";
    return `${value.toFixed(2)}%`;
  }

  // Helper: formatar tarifa em centavos para reais
  function formatFeeCents(value: number | undefined | null): string {
    if (value === undefined || value === null) return "-";
    return formatCurrency(value / 100);
  }

  // Bandeiras com ícones e cores
  const flagColors: Record<string, { color: string; bg: string }> = {
    MASTERCARD: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15" },
    VISA: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/15" },
    ELO: { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/15" },
    "AMERICAN EXPRESS": { color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/15" },
    HIPERCARD: { color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/15" },
  };

  // Exportar CSV das taxas (todos os planos)
  function exportCSV() {
    if (!planDetails.length && !activeFees) return;
    const lines: string[] = [];
    
    // Exportar cada plano
    planDetails.forEach((plan: any, idx: number) => {
      if (idx > 0) lines.push("");
      lines.push(`=== PLANO COMERCIAL: ${plan.name || 'Sem nome'} ===`);
      lines.push(`Plano;${plan.name || '-'}`);
      lines.push(`Modalidade;${translateModality(plan.modality)}`);
      lines.push(`Antecipação;${plan.allow_anticipation ? 'Sim' : 'Não'}`);
      lines.push("");
      
      // Taxas por bandeira
      if (plan.flags?.length) {
        lines.push("Bandeira;Crédito à vista;Débito;PIX");
        plan.flags.filter((f: any) => !['BACEN', 'ANTIFRAUD', 'OTHERS'].includes(f.name)).forEach((flag: any) => {
          const f = flag.fees || {};
          lines.push([
            flag.name,
            formatFeePercent(f.credit?.["1x"]),
            formatFeePercent(f.debit),
            formatFeePercent(f.pix),
          ].join(";"));
        });
        // BACEN (PIX)
        const bacen = plan.flags.find((f: any) => f.name === 'BACEN');
        if (bacen) {
          lines.push(`PIX (BACEN);;; ${formatFeePercent(bacen.fees?.pix)}`);
        }
      }
    });
    
    lines.push("");
    
    // Tarifas bancárias
    if (activeFees) {
      lines.push("=== TARIFAS BANCÁRIAS ===");
      lines.push("Operação;Tarifa");
      lines.push(`PIX;${formatFeeCents(activeFees.fees?.pix)}`);
      lines.push(`TED;${formatFeeCents(activeFees.fees?.ted)}`);
      lines.push(`Boleto;${formatFeeCents(activeFees.fees?.billet)}`);
      lines.push(`PIX Dinâmico;${formatFeeCents(activeFees.fees?.dynamic_pix)}`);
    }
    
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taxas_tarifas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação CSV realizada com sucesso!");
  }

  if (!hasBanking) {
    return (
      <div className="py-16 text-center">
        <Percent className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Vendas e Repasses não está ativo</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Ative Vendas e Repasses para visualizar suas taxas e tarifas</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Planos ativos */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-rose-500/8 via-rose-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-rose-500/60 via-rose-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <BarChart3 className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Planos ativos</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                    planDetails.length > 0 ? `${planDetails.length} plano${planDetails.length > 1 ? 's' : ''}` : "Nenhum"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Taxa PIX */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-emerald-500/60 via-emerald-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <QrCode className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Taxa PIX</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                    bacenFlag?.fees?.pix != null ? formatFeePercent(bacenFlag.fees.pix) : "-"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Taxa Débito */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-violet-500/8 via-violet-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-violet-500/60 via-violet-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <CreditCard className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Taxa Débito</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                    mainCardFlag?.fees?.debit != null ? formatFeePercent(mainCardFlag.fees.debit) : "-"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Taxa Crédito 1x */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent px-4 pt-3 pb-2">
            <div className="absolute left-0 top-3 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
                <CreditCard className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Taxa Crédito 1x</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                    mainCardFlag?.fees?.credit?.["1x"] != null ? formatFeePercent(mainCardFlag.fees.credit["1x"]) : "-"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões Exportar + Simular */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={exportCSV} disabled={isLoading || (!planDetails.length && !activeFees)}>
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
        <Button size="sm" className="h-9 text-xs gap-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white" onClick={() => setShowSimulator(true)}>
          <Calculator className="h-3.5 w-3.5" /> Simular Tarifas
        </Button>
      </div>

      {/* Sidebar Simulador de Taxas */}
      <SimuladorSidebar open={showSimulator} onOpenChange={setShowSimulator} estId={estId} />

      {/* Tabs de planos (se houver mais de 1) */}
      {planDetails.length > 1 && (
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-1.5 border border-border/50 w-fit">
          {planDetails.map((plan: any, idx: number) => {
            const ModalityIcon = getModalityIcon(plan.modality);
            const colors = getModalityColors(plan.modality);
            const isSelected = selectedPlanIdx === idx;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanIdx(idx)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200",
                  isSelected
                    ? "bg-card shadow-sm border border-border/50 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0", isSelected ? colors.bg : "bg-muted/50")} style={{borderRadius: '7px'}}>
                  <ModalityIcon className={cn("h-3.5 w-3.5", isSelected ? colors.color : "text-muted-foreground")} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold truncate">{translateModality(plan.modality)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{plan.name}</p>
                </div>
                {plan.active && (
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isSelected ? "bg-emerald-500" : "bg-emerald-500/50")} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Planos Comerciais - Itera sobre todos */}
      {planDetails.length > 0 ? (
        planDetails.map((plan: any, idx: number) => {
          // Se houver mais de 1 plano, só mostrar o selecionado
          if (planDetails.length > 1 && idx !== selectedPlanIdx) return null;
          const ModalityIcon = getModalityIcon(plan.modality);
          const colors = getModalityColors(plan.modality);
          const planBacenFlag = plan.flags?.find((f: any) => f.name === 'BACEN');
          return (
            <div key={plan.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className={cn("relative bg-gradient-to-br to-transparent px-5 pt-4 pb-3", colors.gradient)}>
                <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b to-transparent", colors.border)} />
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", colors.bg)} style={{borderRadius: '12px'}}>
                    <ModalityIcon className={cn("h-5 w-5", colors.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {translateModality(plan.modality)}
                      {planBacenFlag?.fees?.pix != null && ` • PIX: ${formatFeePercent(planBacenFlag.fees.pix)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {plan.allow_anticipation && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                        <Zap className="h-3 w-3" /> Antecipação
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativo
                    </span>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando taxas...</span>
                </div>
              ) : !plan.flags?.length ? (
                <div className="py-12 text-center">
                  <Percent className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma taxa encontrada para este plano</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground">Bandeira</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">Crédito à vista</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">Débito</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {plan.flags.filter((f: any) => !['BACEN', 'ANTIFRAUD', 'OTHERS'].includes(f.name)).map((flag: any) => {
                        const fc = flagColors[flag.name] || { color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/15" };
                        const fees = flag.fees || {};
                        const credit = fees.credit || {};
                        return (
                          <tr key={flag.id || flag.name} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0", fc.bg)} style={{borderRadius: '7px'}}>
                                  <CreditCard className={cn("h-3.5 w-3.5", fc.color)} />
                                </div>
                                <span className="text-sm font-bold text-foreground">{flag.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className="text-sm font-bold text-foreground">{formatFeePercent(credit["1x"])}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className="text-sm font-bold text-foreground">{formatFeePercent(fees.debit)}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {flag.active ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 dark:text-red-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Inativa
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      ) : isLoading ? (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando planos...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Erro ao carregar taxas</p>
          <p className="text-xs text-muted-foreground/70 mt-1">O serviço pode estar temporariamente indisponível</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden py-12 text-center">
          <Percent className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum plano comercial encontrado</p>
          <p className="text-xs text-muted-foreground/70 mt-1">As taxas aparecerão quando um plano comercial estiver vinculado</p>
        </div>
      )}

      {/* Tarifas Bancárias */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="relative bg-gradient-to-br from-indigo-500/8 via-indigo-500/4 to-transparent px-5 pt-4 pb-3">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-indigo-500/60 via-indigo-500/30 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <Banknote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">Tarifas Bancárias</h3>
              <p className="text-xs text-muted-foreground font-medium">
                {activeFees ? `Pacote: ${activeFees.name || 'Padrão'}` : 'Tarifas por operação bancária'}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando tarifas...</span>
          </div>
        ) : !activeFees ? (
          <div className="py-12 text-center">
            <Banknote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma tarifa bancária encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Operação</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Taxa padrão</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Acréscimo</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Taxa final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  { label: "PIX", icon: QrCode, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10", key: "pix" },
                  { label: "TED", icon: ArrowRightLeft, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10", key: "ted" },
                  { label: "Boleto", icon: Receipt, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/10", key: "billet" },
                  { label: "PIX Dinâmico", icon: QrCode, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-500/10", key: "dynamic_pix" },
                ].map((op) => (
                  <tr key={op.key} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0", op.bg)} style={{borderRadius: '10px'}}>
                          <op.icon className={cn("h-4 w-4", op.color)} />
                        </div>
                        <span className="font-medium text-foreground text-sm">{op.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-muted-foreground">
                        {formatFeeCents((activeFees.standard as any)?.[op.key])}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatFeeCents((activeFees.markup as any)?.[op.key])}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-foreground">
                        {formatFeeCents((activeFees.fees as any)?.[op.key])}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-muted/30 rounded-xl border border-border/50 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">
            As taxas exibidas são as taxas finais cobradas por transação (taxa padrão + acréscimo do parceiro).
            Taxas de crédito parcelado variam conforme o número de parcelas. Tarifas bancárias são cobradas por operação realizada.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTE PRINCIPAL ============
// ============ FORMATADORES (Onboarding) ============
function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = 0; i < len; i++) { sum += parseInt(digits[i]) * pos--; if (pos < 2) pos = 9; }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result;
  };
  if (calc(12) !== parseInt(digits[12])) return false;
  if (calc(13) !== parseInt(digits[13])) return false;
  return true;
}
function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11; if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11; if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[10])) return false;
  return true;
}
function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}
function formatCPFOnb(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatPhoneOnb(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}
function formatCEPOnb(value: string) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}
function formatDateOnb(value: string) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2");
}
function dateToISOOnb(ddmmyyyy: string): string {
  const parts = ddmmyyyy.replace(/\D/g, "");
  if (parts.length !== 8) return "";
  return `${parts.slice(4, 8)}-${parts.slice(2, 4)}-${parts.slice(0, 2)}`;
}

type OnboardingStep = 1 | 2 | 3 | 4;
const STEP_LABELS: Record<OnboardingStep, string> = { 1: "Dados da Empresa", 2: "Endereço", 3: "Representante Legal", 4: "Revisão e Envio" };
const STEP_ICONS_ONB: Record<OnboardingStep, React.ReactNode> = {
  1: <Building2 className="h-4 w-4" />, 2: <MapPin className="h-4 w-4" />, 3: <User className="h-4 w-4" />, 4: <Send className="h-4 w-4" />,
};

// ============ COMPONENTE: BANKING ONBOARDING ============
function BankingOnboarding() {
  const { user } = useAuth();
  const { data: establishment, isLoading, refetch } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const { data: onboardingData, isLoading: onboardingLoading, refetch: refetchOnboarding } = trpc.paytime.getOnboardingStatus.useQuery({ establishmentId: estId! }, { enabled: !!estId });
  const updateMutation = trpc.establishment.update.useMutation({ onSuccess: () => { refetch(); toast.success("Configuração atualizada!"); }, onError: (e) => toast.error(e.message || "Erro ao atualizar") });
  const submitOnboardingMutation = trpc.paytime.submitOnboarding.useMutation({ onSuccess: () => { refetchOnboarding(); refetch(); toast.success("Cadastro enviado com sucesso!"); setShowForm(false); if (estId) deleteDraftMutation.mutate({ establishmentId: estId }); }, onError: (e) => toast.error(e.message || "Erro ao enviar cadastro") });
  const { data: draftData } = trpc.paytime.getDraft.useQuery({ establishmentId: estId! }, { enabled: !!estId });
  const saveDraftMutation = trpc.paytime.saveDraft.useMutation({ onSuccess: () => { toast.success("Rascunho salvo! Você pode continuar depois."); setShowForm(false); }, onError: (e) => toast.error(e.message || "Erro ao salvar rascunho") });
  const deleteDraftMutation = trpc.paytime.deleteDraft.useMutation();
  const refreshStatusMutation = trpc.paytime.refreshOnboardingStatus.useMutation({ onSuccess: (data) => { refetchOnboarding(); refetch(); if (data.status === "approved") toast.success("Cadastro aprovado!"); else if (data.status === "rejected") toast.error("Cadastro rejeitado."); else toast.info("Ainda aguardando aprovação."); }, onError: (e) => toast.error(e.message || "Erro ao verificar status") });
  const completeSetupMutation = trpc.paytime.completeSetup.useMutation({ onSuccess: (data) => { refetchOnboarding(); refetch(); toast.success("Setup completo! " + data.results.join(", ")); }, onError: (e) => toast.error(e.message || "Erro ao completar setup") });
  const activateBankingMutation = trpc.paytime.activateBanking.useMutation({ onSuccess: (data) => { refetchOnboarding(); refetch(); if (data.kycUrl) { toast.success("Vendas e Repasses ativado! Abra o link KYC."); window.open(data.kycUrl, "_blank"); } else toast.success("Vendas e Repasses ativado!"); }, onError: (e) => toast.error(e.message || "Erro ao ativar Vendas e Repasses") });
  const { data: kycStatusData, refetch: refetchKyc } = trpc.paytime.checkKycStatus.useQuery({ establishmentId: estId! }, { enabled: !!estId && onboardingData?.onboardingStatus === "approved", refetchInterval: 30000 });
  const [checkingKyc, setCheckingKyc] = useState(false);
  const handleCheckKyc = async () => {
    setCheckingKyc(true);
    try {
      const result = await refetchKyc();
      const s = result.data?.status;
      if (s === "approved") toast.success("KYC aprovado! Verificação de identidade concluída.");
      else if (s === "rejected") toast.error("KYC negado. Reenvie os documentos para nova análise.");
      else if (s === "pending") toast.info("KYC ainda em análise. Aguarde a verificação da Celcoin.");
      else toast.info("Status do KYC: " + (s || "desconhecido"));
    } catch { toast.error("Erro ao consultar status do KYC."); }
    finally { setCheckingKyc(false); }
  };
  const activateSubPaytimeMutation = trpc.paytime.activateSubPaytime.useMutation({ onSuccess: (data) => { refetchOnboarding(); refetch(); toast.success(data.alreadyActive ? "Pagamento online já estava ativo!" : "Pagamento online ativado com sucesso!"); }, onError: (e) => toast.error(e.message || "Erro ao ativar pagamento online") });

  const [showForm, setShowForm] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [nomeFantasiaEditable, setNomeFantasiaEditable] = useState(false);
  const [emailEditable, setEmailEditable] = useState(false);
  const [phoneEditable, setPhoneEditable] = useState(false);
  const [document, setDocument] = useState("");
  const [cnae, setCnae] = useState("5611201");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Query para obter o número do WhatsApp conectado
  const { data: whatsappStatusData } = trpc.whatsapp.getStatus.useQuery(undefined, { staleTime: 60000 });
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [repFirstName, setRepFirstName] = useState("");
  const [repLastName, setRepLastName] = useState("");
  const [repCpf, setRepCpf] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repBirthDate, setRepBirthDate] = useState("");

  // Carregar rascunho salvo (prioridade máxima)
  useEffect(() => {
    if (draftData?.data) {
      const d = draftData.data;
      if (d.razaoSocial) setRazaoSocial(d.razaoSocial);
      if (d.nomeFantasia) setNomeFantasia(d.nomeFantasia);
      if (d.document) setDocument(d.document);
      if (d.cnae) setCnae(d.cnae);
      if (d.email) setEmail(d.email);
      if (d.phone) setPhone(d.phone);
      if (d.cep) setCep(d.cep);
      if (d.street) setStreet(d.street);
      if (d.number) setNumber(d.number);
      if (d.complement) setComplement(d.complement);
      if (d.neighborhood) setNeighborhood(d.neighborhood);
      if (d.city) setCity(d.city);
      if (d.state) setState(d.state);
      if (d.repFirstName) setRepFirstName(d.repFirstName);
      if (d.repLastName) setRepLastName(d.repLastName);
      if (d.repCpf) setRepCpf(d.repCpf);
      if (d.repEmail) setRepEmail(d.repEmail);
      if (d.repPhone) setRepPhone(d.repPhone);
      if (d.repBirthDate) setRepBirthDate(d.repBirthDate);
      setStep(draftData.step as OnboardingStep);
    }
  }, [draftData]);

  useEffect(() => {
    if (onboardingData && establishment && !draftData) {
      if (onboardingData.razaoSocial) setRazaoSocial(onboardingData.razaoSocial);
      if (onboardingData.nomeFantasia) setNomeFantasia(onboardingData.nomeFantasia);
      else if (establishment.name) setNomeFantasia(establishment.name);
      if (establishment.cnpj) setDocument(establishment.cnpj);
      setCnae("5611201");
      // Email: prioridade onboarding > establishment.email > user.email
      if (!email) {
        if (establishment.email) setEmail(establishment.email);
        else if (user?.email) setEmail(user.email);
      }
      // Telefone: prioridade onboarding > whatsapp conectado > establishment.whatsapp
      if (!phone) {
        if (whatsappStatusData?.status === 'connected' && whatsappStatusData?.phone) {
          setPhone(whatsappStatusData.phone.replace(/\D/g, ''));
        } else if (establishment.whatsapp) {
          setPhone(establishment.whatsapp.replace(/\D/g, ''));
        } else if ((establishment as any).phone) {
          setPhone(((establishment as any).phone || '').replace(/\D/g, ''));
        }
      }
      if (establishment.zipCode) setCep(establishment.zipCode || "");
      if (establishment.street) setStreet(establishment.street || "");
      if (establishment.number) setNumber(establishment.number || "");
      if (establishment.complement) setComplement(establishment.complement || "");
      if (establishment.neighborhood) setNeighborhood(establishment.neighborhood || "");
      if (establishment.city) setCity(establishment.city || "");
      if (establishment.state) setState(establishment.state || "");
      if (onboardingData.representativeName) setRepFirstName(onboardingData.representativeName);
      if (onboardingData.representativeLastName) setRepLastName(onboardingData.representativeLastName);
      if (onboardingData.representativeCpf) setRepCpf(onboardingData.representativeCpf);
      if (onboardingData.representativeEmail) setRepEmail(onboardingData.representativeEmail);
      if (onboardingData.representativePhone) setRepPhone(onboardingData.representativePhone);
      if (onboardingData.representativeBirthDate) {
        const bd = onboardingData.representativeBirthDate;
        if (bd.includes("-")) { const [y, m, d] = bd.split("-"); setRepBirthDate(`${d}/${m}/${y}`); }
      }
    }
  }, [onboardingData, establishment, whatsappStatusData, user, draftData]);

  const fetchCepOnb = useCallback(async (cepValue: string) => {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try { const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`); const data = await res.json(); if (!data.erro) { setStreet(data.logradouro || ""); setNeighborhood(data.bairro || ""); setCity(data.localidade || ""); setState(data.uf || ""); } } catch {} finally { setLoadingCep(false); }
  }, []);


  const validateStep = (s: OnboardingStep): string | null => {
    switch (s) {
      case 1: if (!razaoSocial.trim()) return "Razão Social é obrigatória"; if (!nomeFantasia.trim()) return "Nome Fantasia é obrigatório"; if (document.replace(/\D/g,"").length<14) return "CNPJ é obrigatório (14 dígitos)"; if (!validateCNPJ(document)) { setCnpjError("CNPJ inválido"); return "CNPJ inválido. Verifique os dígitos."; } if (!email.trim()) return "Email é obrigatório"; if (phone.replace(/\D/g,"").length<10) return "Telefone é obrigatório"; return null;
      case 2: if (cep.replace(/\D/g,"").length<8) return "CEP é obrigatório"; if (!street.trim()) return "Rua é obrigatória"; if (!number.trim()) return "Número é obrigatório"; if (!neighborhood.trim()) return "Bairro é obrigatório"; if (!city.trim()) return "Cidade é obrigatória"; if (!state.trim()||state.length<2) return "Estado é obrigatório"; return null;
      case 3: if (!repFirstName.trim()) return "Nome é obrigatório"; if (!repLastName.trim()) return "Sobrenome é obrigatório"; if (repCpf.replace(/\D/g,"").length<11) return "CPF é obrigatório"; if (!validateCPF(repCpf)) { setCpfError("CPF inválido"); return "CPF inválido. Verifique os dígitos."; } if (!repEmail.trim()) return "Email é obrigatório"; if (repPhone.replace(/\D/g,"").length<10) return "Telefone é obrigatório"; if (repBirthDate.replace(/\D/g,"").length<8) return "Data de nascimento é obrigatória"; return null;
      default: return null;
    }
  };
  const handleNextStep = () => { const error = validateStep(step); if (error) { toast.error(error); return; } if (step < 4) setStep((step + 1) as OnboardingStep); };
  const handleSubmit = () => {
    if (!estId) return;
    const cleanDoc = document.replace(/\D/g, "");
    const estType = cleanDoc.length >= 14 ? "BUSINESS" : "INDIVIDUAL";
    submitOnboardingMutation.mutate({
      establishmentId: estId, type: estType, razaoSocial, nomeFantasia, document: cleanDoc, cnae: cnae.replace(/\D/g, ""), email, phone: phone.replace(/\D/g, ""), format: "LTDA", birthdate: estType === "BUSINESS" ? "2022-01-01" : "", revenue: 10000,
      address: { street, number, complement: complement || "N/A", neighborhood, city, state: state.toUpperCase(), zipCode: cep.replace(/\D/g, "") },
      representative: { firstName: repFirstName, lastName: repLastName, document: repCpf.replace(/\D/g, ""), email: repEmail, phone: repPhone.replace(/\D/g, ""), birthDate: dateToISOOnb(repBirthDate) },
    });
  };

  if (isLoading || onboardingLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const status = onboardingData?.onboardingStatus || "not_started";
  const bankingActive = onboardingData?.bankingActive ?? false;
  const subPaytimeActive = onboardingData?.subPaytimeActive ?? false;
  const kycUrl = onboardingData?.kycUrl || kycStatusData?.kycUrl || null;
  const kycStatus = kycStatusData?.status || onboardingData?.kycStatus || "not_started";
  const paytimeEnabled = establishment?.paytimeEnabled ?? false;
  const paytimeCardEnabled = establishment?.paytimeCardEnabled ?? false;
  const paytimeCardFeePassthrough = (establishment as any)?.paytimeCardFeePassthrough ?? true;
  const isFullySetup = status === "approved" && bankingActive && subPaytimeActive;
  const hasAnyOnlinePayment = paytimeEnabled || paytimeCardEnabled;

  const productCards = [
    { icon: CircleDollarSign, title: "PIX Online", desc: "Receba pagamentos via PIX com QR Code gerado no checkout do cardápio.", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { icon: CreditCard, title: "Cartão de Crédito", desc: "Aceite crédito e débito direto no checkout, com antifraude integrado.", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    { icon: Wallet, title: "Vendas e Repasses", desc: "Acompanhe vendas, recebimentos e repasses para a conta bancária cadastrada.", iconBg: "bg-rose-50", iconColor: "text-rose-500" },
    { icon: Receipt, title: "Pagar Contas", desc: "Pague boletos e contas pelo painel financeiro, sem sair da plataforma.", iconBg: "bg-red-50", iconColor: "text-red-500" },
    { icon: Send, title: "Área PIX", desc: "Transferências PIX para qualquer chave, com comprovantes e histórico.", iconBg: "bg-green-50", iconColor: "text-green-600" },
    { icon: ShieldCheck, title: "Antifraude 3DS", desc: "Módulo de segurança para pagamentos com cartão, com autenticação 3D Secure.", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  ];

  // Se o setup está completo, não renderiza nada (o Banking normal será exibido)
  if (isFullySetup) return null;

  // ======== FORMULÁRIO DE CADASTRO ========
  if (showForm) {
    return (
      <div className="flex gap-6 items-start">
      {/* Coluna principal - Formulário */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Progress bar estilo Banking - redesenhado */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary/6 via-transparent to-transparent px-4 sm:px-5 py-3">
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
            <div className="flex items-center">
              {([1,2,3,4] as OnboardingStep[]).map((s) => {
                const stepColors: Record<OnboardingStep, { bg: string; text: string; icon: string; border: string; activeBg: string; activeText: string }> = {
                  1: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-600", border: "border-emerald-200", activeBg: "bg-gradient-to-r from-emerald-500 to-emerald-600", activeText: "text-white" },
                  2: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-600", border: "border-orange-200", activeBg: "bg-gradient-to-r from-orange-500 to-orange-600", activeText: "text-white" },
                  3: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-600", border: "border-violet-200", activeBg: "bg-gradient-to-r from-violet-500 to-violet-600", activeText: "text-white" },
                  4: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600", border: "border-blue-200", activeBg: "bg-gradient-to-r from-blue-500 to-blue-600", activeText: "text-white" },
                };
                const colors = stepColors[s];
                const isActive = s === step;
                const isDone = s < step;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <button
                      onClick={() => { if (s < step) setStep(s); }}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-300 w-full border",
                        isActive && `${colors.activeBg} ${colors.activeText} border-transparent shadow-md shadow-black/10`,
                        isDone && `${colors.bg} ${colors.text} ${colors.border} cursor-pointer hover:shadow-sm hover:-translate-y-0.5`,
                        !isActive && !isDone && "bg-muted/30 text-muted-foreground/60 border-transparent"
                      )}
                    >
                      <span className={cn(
                        "flex items-center justify-center h-6 w-6 rounded-lg flex-shrink-0 transition-colors",
                        isActive && "bg-white/20",
                        isDone && `${colors.bg} ${colors.icon}`,
                        !isActive && !isDone && "bg-muted/40"
                      )}>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : STEP_ICONS_ONB[s]}
                      </span>
                      <span className="hidden sm:inline truncate">{STEP_LABELS[s]}</span>
                      <span className="sm:hidden">{s}</span>
                    </button>
                    {s < 4 && (
                      <div className="flex items-center mx-1.5 flex-shrink-0">
                        <div className={cn(
                          "h-[2px] w-4 rounded-full transition-colors duration-300",
                          isDone ? "bg-emerald-400" : "bg-muted-foreground/15"
                        )} />
                        <ArrowRight className={cn(
                          "h-3 w-3 mx-0.5 transition-colors",
                          isDone ? "text-emerald-400" : "text-muted-foreground/25"
                        )} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-600" /></div><div><h3 className="font-semibold text-sm">Dados da Empresa</h3><p className="text-xs text-muted-foreground">Informações do estabelecimento</p></div></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs font-medium mb-1.5 block">Razão Social *</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Razão Social da empresa" /></div>
              <div><Label className="text-xs font-medium mb-1.5 block">Nome Fantasia *</Label><div className="relative flex items-center"><Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome do restaurante" disabled={!nomeFantasiaEditable} className={!nomeFantasiaEditable ? "pr-10 bg-muted/50" : "pr-10"} /><button type="button" onClick={() => setNomeFantasiaEditable(!nomeFantasiaEditable)} className="absolute right-2 p-1 rounded-md hover:bg-muted transition-colors" title={nomeFantasiaEditable ? "Bloquear edição" : "Editar nome fantasia"}>{nomeFantasiaEditable ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}</button></div></div>
              <div><Label className="text-xs font-medium mb-1.5 block">CNPJ *</Label><Input value={formatCNPJ(document)} onChange={(e)=>{ setDocument(e.target.value.replace(/\D/g,"")); if (cnpjError) setCnpjError(""); }} placeholder="00.000.000/0000-00" maxLength={18} inputMode="numeric" className={cnpjError ? "border-red-500 focus-visible:ring-red-500" : ""} onBlur={() => { const d = document.replace(/\D/g,""); if (d.length === 14 && !validateCNPJ(document)) setCnpjError("CNPJ inválido"); else setCnpjError(""); }} />{cnpjError && <p className="text-xs text-red-500 mt-1">{cnpjError}</p>}</div>
              <div><Label className="text-xs font-medium mb-1.5 block">Telefone *</Label><div className="relative flex items-center"><Input value={formatPhoneOnb(phone)} onChange={(e)=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="(11) 99999-9999" maxLength={15} disabled={!phoneEditable && !!phone} className={!phoneEditable && !!phone ? "pr-10 bg-muted/50" : "pr-10"} />{phone && <button type="button" onClick={() => setPhoneEditable(!phoneEditable)} className="absolute right-2 p-1 rounded-md hover:bg-muted transition-colors" title={phoneEditable ? "Confirmar telefone" : "Editar telefone"}>{phoneEditable ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}</button>}</div></div>
              <div><Label className="text-xs font-medium mb-1.5 block">CNAE</Label><Input value={cnae} disabled className="bg-muted/50 cursor-not-allowed" /><p className="text-xs text-muted-foreground mt-1">Restaurantes e similares (pré-definido)</p></div>
              <div><Label className="text-xs font-medium mb-1.5 block">Email *</Label><div className="relative flex items-center"><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="contato@empresa.com" disabled={!emailEditable && !!email} className={!emailEditable && !!email ? "pr-10 bg-muted/50" : "pr-10"} />{email && <button type="button" onClick={() => setEmailEditable(!emailEditable)} className="absolute right-2 p-1 rounded-md hover:bg-muted transition-colors" title={emailEditable ? "Confirmar email" : "Editar email"}>{emailEditable ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}</button>}</div></div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><MapPin className="h-5 w-5 text-orange-600" /></div><div><h3 className="font-semibold text-sm">Endereço</h3><p className="text-xs text-muted-foreground">Endereço comercial do estabelecimento</p></div></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <div className="sm:col-span-3"><Label className="text-xs font-medium mb-1.5 block">Rua *</Label><Input value={street} onChange={(e)=>setStreet(e.target.value)} placeholder="Rua, Avenida, etc." /></div>
              <div className="sm:col-span-2"><Label className="text-xs font-medium mb-1.5 block">CEP *</Label><div className="relative"><Input value={formatCEPOnb(cep)} onChange={(e)=>{const v=e.target.value.replace(/\D/g,"");setCep(v);if(v.length===8)fetchCepOnb(v);}} placeholder="00000-000" maxLength={9} />{loadingCep&&<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}</div></div>
              <div className="sm:col-span-1"><Label className="text-xs font-medium mb-1.5 block">Estado (UF) *</Label><Input value={state} onChange={(e)=>setState(e.target.value.toUpperCase().slice(0,2))} placeholder="SP" maxLength={2} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-2"><Label className="text-xs font-medium mb-1.5 block">Número *</Label><Input value={number} onChange={(e)=>setNumber(e.target.value)} placeholder="123" maxLength={6} /></div>
              <div className="sm:col-span-3"><Label className="text-xs font-medium mb-1.5 block">Complemento</Label><Input value={complement} onChange={(e)=>setComplement(e.target.value)} placeholder="Sala, Andar, etc." /></div>
              <div className="sm:col-span-4"><Label className="text-xs font-medium mb-1.5 block">Bairro *</Label><Input value={neighborhood} onChange={(e)=>setNeighborhood(e.target.value)} placeholder="Bairro" /></div>
              <div className="sm:col-span-3"><Label className="text-xs font-medium mb-1.5 block">Cidade *</Label><Input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Cidade" /></div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center"><User className="h-5 w-5 text-violet-600" /></div><div><h3 className="font-semibold text-sm">Representante Legal</h3><p className="text-xs text-muted-foreground">Dados do responsável legal</p></div></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs font-medium mb-1.5 block">Nome *</Label><Input value={repFirstName} onChange={(e)=>setRepFirstName(e.target.value)} placeholder="Nome" /></div>
              <div><Label className="text-xs font-medium mb-1.5 block">Sobrenome *</Label><Input value={repLastName} onChange={(e)=>setRepLastName(e.target.value)} placeholder="Sobrenome" /></div>
              <div><Label className="text-xs font-medium mb-1.5 block">CPF *</Label><Input value={formatCPFOnb(repCpf)} onChange={(e)=>{ setRepCpf(e.target.value.replace(/\D/g,"")); if (cpfError) setCpfError(""); }} placeholder="000.000.000-00" maxLength={14} className={cpfError ? "border-red-500 focus-visible:ring-red-500" : ""} onBlur={() => { const d = repCpf.replace(/\D/g,""); if (d.length === 11 && !validateCPF(repCpf)) setCpfError("CPF inválido"); else setCpfError(""); }} />{cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}</div>
              <div><Label className="text-xs font-medium mb-1.5 block">Data de Nascimento *</Label><Input value={formatDateOnb(repBirthDate)} onChange={(e)=>setRepBirthDate(e.target.value.replace(/\D/g,""))} placeholder="DD/MM/AAAA" maxLength={10} /></div>
              <div><Label className="text-xs font-medium mb-1.5 block">Email *</Label><Input type="email" value={repEmail} onChange={(e)=>setRepEmail(e.target.value)} placeholder="representante@email.com" /></div>
              <div><Label className="text-xs font-medium mb-1.5 block">Telefone *</Label><Input value={formatPhoneOnb(repPhone)} onChange={(e)=>setRepPhone(e.target.value.replace(/\D/g,""))} placeholder="(11) 99999-9999" maxLength={15} /></div>
            </div>
          </div>
        )}

        {/* Step 4 - Revisão */}
        {step === 4 && (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2"><div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Send className="h-5 w-5 text-emerald-600" /></div><div><h3 className="font-semibold text-sm">Revisão e Envio</h3><p className="text-xs text-muted-foreground">Confira os dados antes de enviar</p></div></div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 mb-1"><Building2 className="h-4 w-4 text-emerald-600" /><span className="text-xs font-semibold text-emerald-700">Empresa</span></div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs"><div><span className="text-muted-foreground">Razão Social:</span> <span className="font-medium">{razaoSocial}</span></div><div><span className="text-muted-foreground">Nome Fantasia:</span> <span className="font-medium">{nomeFantasia}</span></div><div><span className="text-muted-foreground">CNPJ:</span> <span className="font-medium">{formatCNPJ(document)}</span></div><div><span className="text-muted-foreground">CNAE:</span> <span className="font-medium">{cnae}</span></div><div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{email}</span></div><div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{formatPhoneOnb(phone)}</span></div></div>
              </div>
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 space-y-2">
                <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-orange-500" /><span className="text-xs font-semibold text-orange-600">Endereço</span></div>
                <p className="text-xs font-medium">{street}, {number}{complement?` - ${complement}`:""} — {neighborhood}, {city}/{state} — CEP {formatCEPOnb(cep)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 space-y-2">
                <div className="flex items-center gap-2 mb-1"><User className="h-4 w-4 text-violet-500" /><span className="text-xs font-semibold text-violet-600">Representante Legal</span></div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs"><div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{repFirstName} {repLastName}</span></div><div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{formatCPFOnb(repCpf)}</span></div><div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{repEmail}</span></div><div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{formatPhoneOnb(repPhone)}</span></div><div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{formatDateOnb(repBirthDate)}</span></div></div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200"><AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-amber-700">Ao enviar, os dados serão cadastrados para análise. O processo de aprovação pode levar até 48 horas úteis.</p></div>
            </div>
          </div>
        )}

        {/* Footer - barra diferenciada com botões */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 px-5 pb-4 -mx-5 -mb-4 bg-stone-50/80 border-t border-stone-200/60 rounded-b-2xl">
          <Button variant="outline" className="h-10 text-sm" style={{borderRadius: '8px'}} onClick={() => {
            if (!estId) return;
            saveDraftMutation.mutate({
              establishmentId: estId,
              step,
              data: { razaoSocial, nomeFantasia, document, cnae, email, phone, cep, street, number, complement, neighborhood, city, state, repFirstName, repLastName, repCpf, repEmail, repPhone, repBirthDate },
            });
          }} disabled={saveDraftMutation.isPending}>
            {saveDraftMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Salvando...</> : <><Save className="h-4 w-4 mr-1.5" />Salvar e continuar depois</>}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 text-sm" style={{borderRadius: '8px'}} onClick={() => { if (step === 1) setShowForm(false); else setStep((step-1) as OnboardingStep); }}>
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>
            {step < 4 ? (
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-4 h-10 text-sm font-semibold gap-1" style={{borderRadius: '8px'}} onClick={handleNextStep}>
                {step === 1 ? "Avançar para Endereço" : step === 2 ? "Avançar para Representante" : "Avançar para Revisão"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-4 h-10 text-sm font-semibold gap-1" style={{borderRadius: '8px'}} onClick={handleSubmit} disabled={submitOnboardingMutation.isPending}>
                {submitOnboardingMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Enviando...</> : <>Avançar para Aprovação <ArrowRight className="h-4 w-4" /></>}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Coluna lateral direita - Produtos que serão liberados */}
      <div className="hidden xl:flex flex-col w-[380px] flex-shrink-0 sticky top-4">
        <div className="space-y-4">
          <div className="px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">O que você ativa</p>
            <h3 className="text-base font-bold text-foreground">Ferramentas incluídas no banking</h3>
          </div>
          <div className="space-y-3">
            {productCards.map((card, i) => {
              const gradientMap: Record<string, string> = {
                "bg-emerald-50": "from-emerald-50/40 to-white border-emerald-100",
                "bg-amber-50": "from-amber-50/40 to-white border-amber-100",
                "bg-rose-50": "from-rose-50/40 to-white border-rose-100",
                "bg-red-50": "from-red-50/40 to-white border-red-100",
                "bg-green-50": "from-green-50/40 to-white border-green-100",
              };
              const gradient = gradientMap[card.iconBg] || "from-muted/20 to-white border-border/50";
              return (
                <div key={i} className={cn(
                  "rounded-xl border bg-gradient-to-br p-4 transition-colors duration-300",
                  gradient,
                  "hover:shadow-md hover:-translate-y-0.5"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", card.iconBg)}>
                      <card.icon className={cn("h-5 w-5", card.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{card.title}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Incluído</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    );
  }

  // ======== TELA DE STATUS / PROGRESSO (Mockup V2) ========
  const activationSteps = [
    { label: "Cadastro", done: status !== "not_started", active: status === "not_started" },
    { label: "Aprovação", done: status === "approved", active: status === "submitted" },
    { label: "Banking Paytime", done: bankingActive, active: status === "approved" && !bankingActive },
    { label: "KYC", done: kycStatus === "approved", active: bankingActive && kycStatus !== "approved", rejected: bankingActive && kycStatus === "rejected", pending: bankingActive && kycStatus === "pending" },
    { label: "SubPaytime", done: subPaytimeActive, active: kycStatus === "approved" && !subPaytimeActive },
  ];

  // Determinar label do step atual
  const currentStepLabel = (() => {
    if (status === "not_started") return "CADASTRO";
    if (status === "submitted") return "APROVAÇÃO";
    if (status === "approved" && !bankingActive) return "BANKING PAYTIME";
    if (bankingActive && kycStatus === "rejected") return "KYC NEGADO";
    if (bankingActive && kycStatus === "pending") return "KYC EM ANÁLISE";
    if (bankingActive && kycStatus !== "approved") return "KYC";
    if (kycStatus === "approved" && !subPaytimeActive) return "SUBPAYTIME";
    return "CADASTRO";
  })();

  // Título dinâmico baseado no status
  const heroTitle = (() => {
    if (status === "not_started") return "Receba PIX online e cartão direto no seu cardápio.";
    if (status === "submitted") return "Seu cadastro está em análise.";
    if (status === "rejected") return "Cadastro rejeitado. Tente novamente.";
    if (status === "approved" && !bankingActive) return "Cadastro aprovado! Ative o Banking Paytime.";
    if (bankingActive && kycStatus === "rejected") return "Verificação de identidade negada.";
    if (bankingActive && kycStatus === "pending") return "Verificação enviada!";
    if (bankingActive && kycStatus !== "approved") return "Falta a verificação de identidade.";
    if (kycStatus === "approved" && !subPaytimeActive) return "Quase lá! Ative o SubPaytime.";
    return "Receba PIX online e cartão direto no seu cardápio.";
  })();

  const heroSubtitle = (() => {
    if (status === "not_started") return "Ative o pagamento online em minutos. Dinheiro cai na conta bancária cadastrada, sem intermediários.";
    if (status === "submitted") return "Você será notificado por email e push quando houver atualização. Em média, a análise leva até 48h úteis.";
    if (status === "rejected") return "Verifique os dados informados e reenvie o cadastro. Se precisar de ajuda, entre em contato com o suporte.";
    if (status === "approved" && !bankingActive) return "Seu cadastro foi aprovado. Agora ative o Banking Paytime (ID 6) para liberar a etapa de KYC.";
    if (bankingActive && kycStatus === "rejected") return "A verificação de identidade (KYC) foi negada. Acesse o link abaixo para reenviar os documentos ou entre em contato com o suporte.";
    if (bankingActive && kycStatus === "pending") return "Sua verificação de identidade foi enviada e está em análise. Você será notificado quando for aprovada.";
    if (bankingActive && kycStatus !== "approved") return "Complete a verificação de identidade (KYC) antes de ativar o SubPaytime (ID 4).";
    if (kycStatus === "approved" && !subPaytimeActive) return "A verificação foi aprovada. Agora ative o SubPaytime (ID 4) para liberar pagamentos online.";
    return "Ative o pagamento online em minutos. Dinheiro cai na conta bancária cadastrada, sem intermediários.";
  })();

  const statusBadge = (() => {
    if (status === "submitted") return { label: "Pendente", color: "bg-amber-500" };
    if (status === "rejected") return { label: "Rejeitado", color: "bg-red-500" };
    if (status === "approved" && bankingActive && kycStatus === "pending") return { label: "Em An\u00e1lise", color: "bg-amber-500" };
    if (status === "approved" && bankingActive && kycStatus === "rejected") return { label: "KYC Negado", color: "bg-red-500" };
    if (status === "approved") return { label: "Aprovado", color: "bg-emerald-500" };
    return { label: "Inativo", color: "bg-red-500" };
  })();

  const isBlocked = !isFullySetup;

  return (
    <div className="space-y-4">
      {/* ====== HERO CARD (estilo Mindi - mesmo visual do Banking ativo) ====== */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {/* Header com gradiente - estilo Mindi */}
        <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent px-5 sm:px-6 pt-5 pb-4">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
          
          {/* Top row: icon + badge + breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-white", statusBadge.color)} style={{borderRadius: '8px'}}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  {statusBadge.label}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Vendas e Repasses &middot; {currentStepLabel}</span>
              </div>
            </div>
          </div>

          {/* Title + subtitle */}
          <h1 className="text-xl font-bold text-foreground leading-tight mb-1.5 max-w-xl">
            {heroTitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            {heroSubtitle}
          </p>
        </div>

        {/* Content area: stepper + buttons */}
        <div className="px-5 sm:px-6 pb-5 pt-3">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            {/* Stepper */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between relative">
                {activationSteps.map((item, i) => (
                  <Fragment key={i}>
                    <div className="flex flex-col items-center relative z-[2]">
                      <div className="relative">
                        <div className={cn(
                          "w-3 h-3 rounded-full transition-colors duration-300",
                          item.done
                            ? "bg-emerald-500"
                            : (item as any).rejected
                              ? "bg-red-500 ring-4 ring-red-500/20"
                              : (item as any).pending
                                ? "bg-amber-500 ring-4 ring-amber-500/20"
                                : item.active
                                  ? "bg-red-500 ring-4 ring-red-500/20"
                                  : "bg-muted-foreground/20"
                        )} />
                        {item.active && !item.done && !(item as any).rejected && !(item as any).pending && (
                          <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
                        )}
                        {(item as any).pending && (
                          <div className="absolute inset-0 w-3 h-3 rounded-full bg-amber-500 opacity-50" />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium mt-2 text-center whitespace-nowrap",
                        item.done ? "text-emerald-600" : (item as any).rejected ? "text-red-500" : (item as any).pending ? "text-amber-600" : item.active ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    {i < activationSteps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-[2px] mx-1 -mt-4",
                        activationSteps[i].done && activationSteps[i + 1].done
                          ? "bg-emerald-500"
                          : activationSteps[i].done
                            ? "bg-gradient-to-r from-emerald-500 to-muted-foreground/20"
                            : "bg-muted-foreground/15"
                      )} />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
              {status === "not_started" && (
                <>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-4 h-10 text-sm font-semibold gap-1 animate-scale-pulse" style={{borderRadius: '8px'}} onClick={() => { if (draftData) { setStep(draftData.step as OnboardingStep); } else { setStep(1); } setShowForm(true); }}>
                    {draftData ? <>Continuar cadastro <ArrowRight className="h-4 w-4" /></> : <>Iniciar cadastro <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                  <Button variant="outline" className="h-10 text-sm" style={{borderRadius: '8px'}} onClick={() => setShowTimeline(true)}>
                    Ver requisitos
                  </Button>
                </>
              )}
              {status === "rejected" && (
                <Button className="bg-primary hover:bg-primary/90 text-white border-0 px-6 h-10 text-sm font-semibold rounded-xl" onClick={() => { setStep(1); setShowForm(true); }}>
                  Reenviar cadastro <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {status === "submitted" && (
                <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={() => refreshStatusMutation.mutate({ establishmentId: estId! })} disabled={refreshStatusMutation.isPending}>
                  {refreshStatusMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Verificar status
                </Button>
              )}
              {status === "approved" && !bankingActive && (
                <Button className="bg-primary hover:bg-primary/90 text-white border-0 px-6 h-10 text-sm font-semibold rounded-xl" onClick={() => activateBankingMutation.mutate({ establishmentId: estId! })} disabled={activateBankingMutation.isPending}>
                  {activateBankingMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}Ativar Banking Paytime
                </Button>
              )}
              {bankingActive && kycStatus === "rejected" && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {kycUrl && <Button className="bg-red-500 hover:bg-red-500 text-white border-0 px-6 h-10 text-sm font-semibold rounded-xl" onClick={() => window.open(kycUrl, "_blank")}><Shield className="h-4 w-4 mr-2" />Reenviar documentos</Button>}
                  <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={handleCheckKyc} disabled={checkingKyc}>{checkingKyc ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Verificar KYC</Button>
                </div>
              )}
              {bankingActive && kycStatus !== "approved" && kycStatus !== "rejected" && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {kycStatus === "pending" ? (
                    <>
                      <Button variant="outline" className="h-10 text-sm rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" disabled><CheckCircle2 className="h-4 w-4 mr-2" />Verificação enviada</Button>
                      <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={handleCheckKyc} disabled={checkingKyc}>{checkingKyc ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Atualizar status</Button>
                    </>
                  ) : (
                    <>
                      {kycUrl && <Button className="bg-primary hover:bg-primary/90 text-white border-0 px-6 h-10 text-sm font-semibold rounded-xl" onClick={() => window.open(kycUrl, "_blank")}><Shield className="h-4 w-4 mr-2" />Verificação KYC</Button>}
                      <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={handleCheckKyc} disabled={checkingKyc}>{checkingKyc ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Verificar KYC</Button>
                    </>
                  )}
                </div>
              )}
              {kycStatus === "approved" && !subPaytimeActive && (
                <Button className="bg-primary hover:bg-primary/90 text-white border-0 px-6 h-10 text-sm font-semibold rounded-xl" onClick={() => activateSubPaytimeMutation.mutate({ establishmentId: estId! })} disabled={activateSubPaytimeMutation.isPending}>
                  {activateSubPaytimeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}Ativar SubPaytime
                </Button>
              )}
              {subPaytimeActive && !hasAnyOnlinePayment && (
                <Button className="bg-primary hover:bg-primary/90 text-white border-0 px-6 h-10 text-sm font-semibold rounded-xl" onClick={() => completeSetupMutation.mutate({ establishmentId: estId! })} disabled={completeSetupMutation.isPending}>
                  {completeSetupMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}Finalizar
                </Button>
              )}
            </div>
          </div>

          {/* KYC status messages */}
          {bankingActive && kycStatus === "pending" && (
            <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Verificação enviada! Aguardando análise do KYC.</p>
          )}
          {bankingActive && kycStatus === "rejected" && (
            <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" />KYC rejeitado. Verifique os dados e tente novamente.</p>
          )}

          {/* Info line */}
          {status === "not_started" && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-md bg-muted/60 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">~10 min para concluir</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====== CARDS DE TAXAS (estilo Mindi com header gradiente) ====== */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "Taxa PIX", value: "1,49%", desc: "por transação aprovada", color: "emerald", icon: QrCode },
          { label: "Taxa Crédito", value: "2,88%", desc: "crédito à vista", color: "blue", icon: CreditCard },
          { label: "Liquidação PIX", value: "D+1", desc: "dia útil seguinte", color: "violet", icon: Calendar },
          { label: "Liquidação Cartão", value: "D+30", desc: "30 dias", color: "purple", icon: Calendar },
          { label: "Antifraude", value: "Incluído", desc: "em todas as transações", color: "amber", icon: ShieldCheck },
        ].map((card, i) => (
          <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className={cn("relative bg-gradient-to-br px-4 pt-3 pb-2",
              card.color === "emerald" && "from-emerald-500/8 via-emerald-500/4 to-transparent",
              card.color === "blue" && "from-blue-500/8 via-blue-500/4 to-transparent",
              card.color === "violet" && "from-violet-500/8 via-violet-500/4 to-transparent",
              card.color === "purple" && "from-purple-500/8 via-purple-500/4 to-transparent",
              card.color === "amber" && "from-amber-500/8 via-amber-500/4 to-transparent",
            )}>
              <div className={cn("absolute left-0 top-3 bottom-2 w-0.5 rounded-r-full bg-gradient-to-b to-transparent",
                card.color === "emerald" && "from-emerald-500/60 via-emerald-500/30",
                card.color === "blue" && "from-blue-500/60 via-blue-500/30",
                card.color === "violet" && "from-violet-500/60 via-violet-500/30",
                card.color === "purple" && "from-purple-500/60 via-purple-500/30",
                card.color === "amber" && "from-amber-500/60 via-amber-500/30",
              )} />
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  card.color === "emerald" && "bg-emerald-100 dark:bg-emerald-500/15",
                  card.color === "blue" && "bg-blue-100 dark:bg-blue-500/15",
                  card.color === "violet" && "bg-violet-100 dark:bg-violet-500/15",
                  card.color === "purple" && "bg-purple-100 dark:bg-purple-500/15",
                  card.color === "amber" && "bg-amber-100 dark:bg-amber-500/15",
                )} style={{borderRadius: '10px'}}>
                  <card.icon className={cn("h-4 w-4",
                    card.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                    card.color === "blue" && "text-blue-600 dark:text-blue-400",
                    card.color === "violet" && "text-violet-600 dark:text-violet-400",
                    card.color === "purple" && "text-purple-600 dark:text-purple-400",
                    card.color === "amber" && "text-amber-600 dark:text-amber-400",
                  )} />
                </div>
                <span className="text-xs font-semibold text-foreground">{card.label}</span>
              </div>
            </div>
            <div className="px-4 pb-3 pt-1">
              <p className="text-lg font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ====== PRODUTOS QUE SERÃO LIBERADOS (estilo Mindi) ====== */}
      <div id="banking-produtos">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-semibold text-foreground">Produtos que serão liberados</span>
          <span className="text-xs text-muted-foreground">6 itens &middot; liberação automática pós-aprovação</span>
        </div>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Marquee track */}
          <div className="animate-marquee-products flex gap-4 w-max py-1">
            {[...productCards, ...productCards].map((card, i) => {
              const gradientMap: Record<string, string> = {
                "bg-emerald-50": "from-emerald-50/40 to-white border-emerald-100",
                "bg-amber-50": "from-amber-50/40 to-white border-amber-100",
                "bg-rose-50": "from-rose-50/40 to-white border-rose-100",
                "bg-red-50": "from-red-50/40 to-white border-red-100",
                "bg-green-50": "from-green-50/40 to-white border-green-100",
              };
              const gradient = gradientMap[card.iconBg] || "from-muted/20 to-white border-border/50";
              return (
                <div key={`prod-${i}`} className={cn(
                  "group rounded-2xl border bg-gradient-to-br p-4 transition-colors duration-300 cursor-pointer shrink-0 w-[260px]",
                  gradient,
                  !isBlocked && "hover:shadow-lg hover:shadow-black/8 hover:-translate-y-1 hover:scale-[1.02]",
                  isBlocked && "hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5"
                )}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", card.iconBg)} style={{borderRadius: '12px'}}>
                        <card.icon className={cn("h-5 w-5", card.iconColor)} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    </div>
                    {isBlocked ? (
                      <span className="text-xs font-medium text-muted-foreground bg-white/60 px-2 py-0.5 flex-shrink-0" style={{borderRadius: '8px'}}>Pós-aprovação</span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-transform mt-1 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toggles PIX/Cartão - só quando setup completo */}
      {isFullySetup && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className={cn("p-2.5 rounded-xl", paytimeEnabled ? "bg-emerald-50" : "bg-muted/50")}><QrCode className={cn("h-5 w-5", paytimeEnabled ? "text-emerald-600" : "text-muted-foreground")} /></div><div><p className="font-semibold text-sm">PIX Online</p><p className="text-xs text-muted-foreground">Aceitar PIX no cardápio</p></div></div>
              <Switch checked={paytimeEnabled} onCheckedChange={(checked) => { if (estId) updateMutation.mutate({ id: estId, paytimeEnabled: checked }); }} disabled={!estId || updateMutation.isPending} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className={cn("p-2.5 rounded-xl", paytimeCardEnabled ? "bg-blue-50" : "bg-muted/50")}><CreditCard className={cn("h-5 w-5", paytimeCardEnabled ? "text-blue-600" : "text-muted-foreground")} /></div><div><p className="font-semibold text-sm">Cartão Online</p><p className="text-xs text-muted-foreground">Aceitar cartão no cardápio</p></div></div>
              <Switch checked={paytimeCardEnabled} onCheckedChange={(checked) => { if (estId) updateMutation.mutate({ id: estId, paytimeCardEnabled: checked }); }} disabled={!estId || updateMutation.isPending} />
            </div>
          </div>
          {paytimeCardEnabled && (
            <div className="rounded-xl border bg-card p-5 ml-4 border-l-4 border-l-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-amber-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div><p className="font-semibold text-sm">Repassar taxa ao cliente</p><p className="text-xs text-muted-foreground">Taxa de R$ 0,99 cobrada no cartão online será adicionada ao pedido do cliente</p></div></div>
                <Switch checked={paytimeCardFeePassthrough} onCheckedChange={(checked) => { if (estId) updateMutation.mutate({ id: estId, paytimeCardFeePassthrough: checked }); }} disabled={!estId || updateMutation.isPending} />
              </div>
            </div>
          )}
        </div>
      )}
      {/* ====== SHEET TIMELINE DE PROGRESSO ====== */}
      <Sheet open={showTimeline} onOpenChange={setShowTimeline}>
        <SheetContent side="right" className="w-[371px] sm:max-w-[371px] p-0 flex flex-col h-auto max-h-screen" hideCloseButton>
          <SheetTitle className="sr-only">Progresso da ativação</SheetTitle>
          <SheetDescription className="sr-only">Acompanhe o progresso da ativação de Vendas e Repasses</SheetDescription>
          {/* Header com degradê vermelho - estilo card hero */}
          <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent px-5 pt-5 pb-4 border-b border-border/50">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Progresso da ativação</h2>
                  <p className="text-xs text-muted-foreground">Vendas e Repasses &middot; {activationSteps.filter(s => s.done).length} de {activationSteps.length} etapas</p>
                </div>
              </div>
              <button
                onClick={() => setShowTimeline(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {/* Barra de progresso animada */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-colors duration-1000 ease-out"
                style={{ width: `${Math.round((activationSteps.filter(s => s.done).length / activationSteps.length) * 100)}%`, minWidth: activationSteps.filter(s => s.done).length > 0 ? '8%' : '0%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{Math.round((activationSteps.filter(s => s.done).length / activationSteps.length) * 100)}% concluído</p>
          </div>
          {/* Conteúdo */}
          <div className="overflow-y-auto flex-1 p-6 bg-card">
            <div className="relative">
              {/* Linha vertical conectora */}
              <div className="absolute left-[18px] top-[36px] bottom-4 w-[2px] bg-muted-foreground/10" />
                <div className="space-y-2">
                {[
                  {
                    num: 1, label: "Cadastro", subtitle: "Dados do estabelecimento",
                    items: ["Razão social e CNPJ", "Endereço do estabelecimento", "Dados do responsável legal", "Revisão e Envio"],
                    done: activationSteps[0].done, active: activationSteps[0].active,
                  },
                  {
                    num: 2, label: "Aprovação", subtitle: "Análise de documentos",
                    items: ["Análise automática (até 2h)", "Validação manual quando aplicável"],
                    done: activationSteps[1].done, active: activationSteps[1].active,
                  },
                  {
                    num: 3, label: "Banking Paytime", subtitle: "Gateway 6",
                    items: ["Ativar Banking Paytime (ID 6)", "Gerar link de KYC"],
                    done: activationSteps[2].done, active: activationSteps[2].active,
                  },
                  {
                    num: 4, label: "KYC", subtitle: "Verificação de identidade",
                    items: ["Documento do responsável", "Selfie como prova de vida", "Aprovação do Banking"],
                    done: activationSteps[3].done, active: activationSteps[3].active,
                  },
                  {
                    num: 5, label: "SubPaytime", subtitle: "Gateway 4",
                    items: ["Ativar SubPaytime (ID 4)", "Liberar PIX e cartão online"],
                    done: activationSteps[4].done, active: activationSteps[4].active,
                  },
                ].map((step, idx) => (
                  <div key={idx} className="relative flex gap-4 pb-8">
                    {/* Número/Ícone do step */}
                    <div className="relative z-[2] flex-shrink-0">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300",
                        step.done
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                          : step.active
                            ? "bg-red-500 text-white shadow-sm shadow-red-500/30 ring-4 ring-red-500/15"
                            : "bg-muted text-muted-foreground"
                      )}>
                        {step.done ? <Check className="h-4 w-4" /> : step.num}
                      </div>
                      {step.active && !step.done && (
                        <div className="absolute inset-0 w-9 h-9 rounded-full bg-red-500/30" />
                      )}
                    </div>
                    {/* Conteúdo do step */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          "text-sm font-bold",
                          step.done ? "text-emerald-700" : step.active ? "text-foreground" : "text-muted-foreground"
                        )}>{step.label}</span>
                        {step.active && !step.done && (
                          <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded" style={{borderRadius: '6px'}}>Próximo</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mb-2",
                        step.done ? "text-emerald-600/70" : step.active ? "text-muted-foreground" : "text-muted-foreground/50"
                      )}>{step.subtitle}</p>
                      <ul className="space-y-1">
                        {step.items.map((item, j) => (
                          <li key={j} className={cn(
                            "text-xs flex items-start gap-1.5",
                            step.done ? "text-emerald-600/60" : step.active ? "text-muted-foreground" : "text-muted-foreground/40"
                          )}>
                            <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{backgroundColor: step.done ? 'rgb(16 185 129 / 0.5)' : step.active ? 'rgb(107 114 128 / 0.5)' : 'rgb(107 114 128 / 0.2)'}} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Botão Fechar vazado no rodapé */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-border/50 bg-card">
            <button
              onClick={() => setShowTimeline(false)}
              className="w-full py-2.5 rounded-xl border-2 border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 hover:border-primary/50 transition-colors duration-200"
            >
              Fechar
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============ COMPONENTE: SIDEBAR SIMULADOR DE TAXAS ============
function SimuladorSidebar({ open, onOpenChange, estId }: { open: boolean; onOpenChange: (v: boolean) => void; estId?: number }) {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"pix" | "credit">("pix");
  const [simResult, setSimResult] = useState<any>(null);

  const simulateMutation = trpc.paytime.simulateTransaction.useMutation({
    onSuccess: (data) => {
      setSimResult(data);
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao simular transação");
    },
  });

  const handleSimulate = () => {
    const amountCents = Math.round(parseFloat(amount.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
    if (!amountCents || amountCents < 1 || !estId) {
      toast.error("Informe um valor válido");
      return;
    }
    setSimResult(null);
    simulateMutation.mutate({
      establishmentId: estId,
      amount: amountCents,
      flagId: paymentType === "pix" ? 8 : 1,
      modality: "ONLINE",
      interest: "STORE",
    });
  };

  // Parse da resposta da API
  const grossAmount = simResult?.amount || 0;
  const simulation = simResult?.simulation?.credit || {};
  const firstInstallment = simulation["1x"];
  const netAmount = firstInstallment?.total || 0;
  const feeAmount = grossAmount - netAmount;
  const feePercentage = grossAmount > 0 ? ((feeAmount / grossAmount) * 100).toFixed(2) : "0";
  const installmentsList = Object.entries(simulation)
    .map(([key, val]: [string, any]) => ({
      installment: key,
      total: val.total,
      installmentValue: val.installment,
    }))
    .sort((a, b) => parseInt(a.installment) - parseInt(b.installment));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '10px'}}>
              <Calculator className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-sm font-bold">Simulador de Taxas</SheetTitle>
              <p className="text-xs text-muted-foreground font-medium">Simule quanto você receberá líquido</p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* Tipo de pagamento */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Tipo de Pagamento</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setPaymentType("pix"); setSimResult(null); }}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-colors",
                  paymentType === "pix"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                    : "border-border/50 hover:border-border"
                )}
              >
                <QrCode className={cn("h-5 w-5", paymentType === "pix" ? "text-emerald-600" : "text-muted-foreground")} />
                <div className="text-left">
                  <p className={cn("text-sm font-bold", paymentType === "pix" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>PIX</p>
                  <p className="text-xs text-muted-foreground">Instantâneo</p>
                </div>
              </button>
              <button
                onClick={() => { setPaymentType("credit"); setSimResult(null); }}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-colors",
                  paymentType === "credit"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-border/50 hover:border-border"
                )}
              >
                <CreditCard className={cn("h-5 w-5", paymentType === "credit" ? "text-blue-600" : "text-muted-foreground")} />
                <div className="text-left">
                  <p className={cn("text-sm font-bold", paymentType === "credit" ? "text-blue-700 dark:text-blue-400" : "text-foreground")}>Crédito</p>
                  <p className="text-xs text-muted-foreground">Visa / Master</p>
                </div>
              </button>
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Valor da Transação (R$)</Label>
            <Input
              type="text"
              placeholder="Ex: 100,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-bold h-11"
            />
          </div>

          {/* Botão simular */}
          <Button
            onClick={handleSimulate}
            disabled={simulateMutation.isPending || !amount}
            className="w-full h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold"
          >
            {simulateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Simulando...</>
            ) : (
              <><Calculator className="h-4 w-4 mr-2" /> Simular Taxas</>
            )}
          </Button>

          {/* Resultado da simulação */}
          {simResult && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-foreground">Resultado</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">Valor Bruto</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(grossAmount / 100)}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">Líquido (1x)</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(netAmount / 100)}</p>
                </div>
              </div>

              {feeAmount > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-500 dark:text-red-400">Taxa</span>
                    </div>
                    <span className="text-base font-bold text-red-500 dark:text-red-400">
                      {formatCurrency(feeAmount / 100)}
                    </span>
                  </div>
                  <p className="text-xs text-red-500/70 mt-0.5">{feePercentage}%</p>
                </div>
              )}

              {/* Parcelamento - só para cartão */}
              {paymentType === "credit" && installmentsList.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-semibold text-muted-foreground">Parcelamento</p>
                  <div className="space-y-1 max-h-[280px] overflow-y-auto">
                    {installmentsList.map((inst, i) => {
                      const instFee = grossAmount - inst.total;
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/20 text-xs">
                          <span className="text-muted-foreground font-semibold w-8">{inst.installment}</span>
                          <span className="text-muted-foreground">Parc: {formatCurrency(inst.installmentValue / 100)}</span>
                          <span className="text-red-500">-{formatCurrency(instFee / 100)}</span>
                          <span className="font-semibold text-emerald-600">{formatCurrency(inst.total / 100)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============ COMPONENTE: EXTRATO BANCÁRIO ============
function BankingExtratoBancario() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const perPage = 20;

  const { data: extractData, isLoading } = trpc.paytime.getExtract.useQuery(
    {
      establishmentId: estId!,
      page,
      perPage,
      search: searchTerm || undefined,
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
    },
    { enabled: !!estId, staleTime: 30000 }
  );

  const entries = extractData?.data || [];
  const meta = extractData?.meta || { total: 0, per_page: perPage, current_page: 1, last_page: 1 };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no extrato..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="credit">Créditos</SelectItem>
            <SelectItem value="debit">Débitos</SelectItem>
            <SelectItem value="transfer">Transferências</SelectItem>
            <SelectItem value="fee">Taxas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de extrato */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="relative bg-gradient-to-br from-indigo-500/8 via-indigo-500/4 to-transparent px-5 pt-4 pb-3">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-indigo-500/60 via-indigo-500/30 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <FileBarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">Extrato da Conta</h3>
              <p className="text-xs text-muted-foreground font-medium">Movimentações da conta bancária</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando extrato...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <FileBarChart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação encontrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">As movimentações aparecerão aqui quando houver atividade na conta</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Descrição</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {entries.map((entry: any, idx: number) => {
                  const amountReais = (entry.amount || 0) / 100;
                  const balanceReais = entry.balance != null ? entry.balance / 100 : null;
                  const isCredit = amountReais >= 0;
                  return (
                    <tr key={entry.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                            isCredit ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-red-100 dark:bg-red-500/15"
                          )} style={{borderRadius: '10px'}}>
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">
                              {entry.description || entry.type || "Movimentação"}
                            </p>
                            {entry.reference && (
                              <p className="text-xs text-muted-foreground truncate">{entry.reference}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs font-medium">
                          {entry.type || "--"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("font-semibold text-sm", isCredit ? "text-emerald-600" : "text-red-500")}>
                          {isCredit ? "+" : ""}{formatCurrency(amountReais)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right hidden lg:table-cell">
                        {balanceReais != null ? (
                          <span className="text-sm font-medium text-foreground">{formatCurrency(balanceReais)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {(meta.last_page || 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Página {meta.current_page} de {meta.last_page}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (meta.last_page || 1)}
                onClick={() => setPage(page + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const viewTitles: Record<BankingView, { title: string; description: string }> = {
  home: { title: "Vendas e Repasses", description: "Acompanhe vendas, recebimentos e repasses" },
  historico: { title: "Histórico de transações", description: "Todas as transações da sua conta" },
  extrato: { title: "Extrato de Vendas", description: "Cobranças recebidas via PIX, crédito e débito" },
  "pagar-conta": { title: "Pagar conta", description: "Pague boletos e contas" },
  estabelecimento: { title: "Dados da conta", description: "Dados e configurações da sua conta" },
  "area-pix": { title: "Área PIX", description: "Recurso temporariamente indisponível" },
  liquidacoes: { title: "Liquidações / Repasses", description: "Quando e quanto foi transferido para sua conta" },
  taxas: { title: "Taxas e Tarifas", description: "Planos comerciais e tarifas da sua conta" },
  "extrato-bancario": { title: "Extrato da Conta", description: "Entradas, saídas e transferências da conta bancária" },
};

export default function Banking() {
  const [currentView, setCurrentView] = useState<BankingView>("home");
  const { data: establishment, isLoading: estLoading } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const { data: onboardingData, isLoading: onbLoading } = trpc.paytime.getOnboardingStatus.useQuery({ establishmentId: estId! }, { enabled: !!estId });

  const status = onboardingData?.onboardingStatus || "not_started";
  const bankingActive = onboardingData?.bankingActive ?? false;
  const subPaytimeActive = onboardingData?.subPaytimeActive ?? false;
  const isFullySetup = status === "approved" && bankingActive && subPaytimeActive;
  const showOnboarding = !estLoading && !onbLoading && !isFullySetup;

  const { title, description } = viewTitles[currentView];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          {currentView !== "home" && (
            <button
              onClick={() => setCurrentView("home")}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <PageHeader
            title={showOnboarding ? "Pagamento Online" : title}
            description={showOnboarding ? "Ative o pagamento online em minutos. Dinheiro cai na conta bancária cadastrada, sem intermediários." : description}
            icon={<Landmark className="h-6 w-6 text-blue-600" />}
          />
          {isFullySetup && (
            <div className="ml-auto flex-shrink-0">
              <button
                onClick={() => window.open("https://gestao.mindi.com.br", "_blank")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-500 text-white hover:from-red-500 hover:to-red-500 transition-colors text-sm font-medium shadow-sm"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sm:hidden">Portal</span>
                <span className="hidden sm:inline">Portal de Gestão</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {(estLoading || onbLoading) && (
        <div className="space-y-6">
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border p-4 flex flex-col items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          {/* Recent transactions skeleton */}
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <Skeleton className="h-5 w-48" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showOnboarding && <BankingOnboarding />}

      {!estLoading && !onbLoading && isFullySetup && (
        <>
          {currentView === "home" && <BankingHome onNavigate={setCurrentView} />}
          {currentView === "historico" && <BankingHistorico />}
          {currentView === "extrato" && <BankingExtrato />}
          {currentView === "pagar-conta" && <BankingPagarConta />}
          {currentView === "estabelecimento" && <BankingEstabelecimento onNavigate={setCurrentView} />}
          {currentView === "area-pix" && (
            <div className="bg-card rounded-xl border border-dashed border-border/70 p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <QrCode className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Área PIX temporariamente indisponível</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">Estamos mantendo este recurso bloqueado no momento. Use os demais atalhos de Vendas e Repasses enquanto a Área PIX não estiver funcional.</p>
              <Button variant="outline" className="mt-5" onClick={() => setCurrentView("home")}>Voltar para Vendas e Repasses</Button>
            </div>
          )}
          {currentView === "liquidacoes" && <BankingLiquidacoes />}
          {currentView === "taxas" && <BankingTaxas />}
          {currentView === "extrato-bancario" && <BankingExtratoBancario />}
        </>
      )}
      </div>
    </AdminLayout>
  );
}
