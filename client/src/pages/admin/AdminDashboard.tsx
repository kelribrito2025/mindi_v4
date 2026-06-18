import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import {
  LayoutDashboard,
  UserPlus,
  Clock,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

type Period = "today" | "7days" | "30days" | "all";

const periodLabels: Record<Period, string> = {
  today: "Hoje",
  "7days": "7 dias",
  "30days": "30 dias",
  all: "Total",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>("all");

  const { data: stats, isLoading } = trpc.admin.dashboard.stats.useQuery({ period });

  const cards = [
    {
      title: "Novos Cadastros",
      value: stats?.newRegistrations ?? 0,
      icon: UserPlus,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      borderColor: "border-t-blue-500",
      dotColor: "bg-blue-500",
      onClick: () => navigate("/admin/restaurantes"),
    },
    {
      title: "Em Trial",
      value: stats?.inTrial ?? 0,
      icon: Clock,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      borderColor: "border-t-amber-500",
      dotColor: "bg-amber-500",
      onClick: () => navigate("/admin/trials"),
    },
    {
      title: "Planos Pagos",
      value: stats?.paidPlans ?? 0,
      icon: CreditCard,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      borderColor: "border-t-emerald-500",
      dotColor: "bg-emerald-500",
      onClick: () => navigate("/admin/restaurantes?filter=paid"),
    },
    {
      title: "Trials Expirados",
      value: stats?.expiredTrials ?? 0,
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      iconColor: "text-red-500",
      borderColor: "border-t-red-500",
      dotColor: "bg-red-500",
      onClick: () => navigate("/admin/trials?filter=expired"),
    },
  ];

  return (
    <AdminPanelLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  period === p
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 border-t-4 border-t-muted">
                <div className="px-5 py-5 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-7 w-12 bg-muted rounded mt-2" />
                  </div>
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className={`bg-card rounded-xl border border-border/50 border-t-4 ${card.borderColor} cursor-pointer transition-transform duration-200 hover:-translate-y-0.5`}
                onClick={card.onClick}
              >
                <div className="px-5 py-5 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                      {card.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${card.dotColor}`} />
                      <span className="text-2xl font-bold tracking-tight">{card.value}</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-lg shrink-0 ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Resumo Rápido */}
          <div className="bg-card rounded-xl border border-border/50">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Resumo Rápido
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Total de restaurantes</span>
                  <span className="font-semibold text-foreground">
                    {(stats?.newRegistrations ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Taxa de conversão (trial → pago)</span>
                  <span className="font-semibold text-foreground">
                    {stats && (stats.paidPlans + stats.inTrial + stats.expiredTrials) > 0
                      ? `${Math.round((stats.paidPlans / (stats.paidPlans + stats.inTrial + stats.expiredTrials)) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Trials aguardando upgrade</span>
                  <span className="font-semibold text-red-500">
                    {stats?.expiredTrials ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-card rounded-xl border border-border/50">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Ações Rápidas
              </h3>
            </div>
            <div className="p-6 space-y-2">
              <button
                onClick={() => navigate("/admin/restaurantes")}
                className="w-full text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                <span className="font-medium text-foreground">Ver todos os restaurantes</span>
                <p className="text-xs text-muted-foreground mt-0.5">Gerenciar planos, trials e status</p>
              </button>
              <button
                onClick={() => navigate("/admin/trials?filter=expiring_3days")}
                className="w-full text-left px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-sm"
              >
                <span className="font-medium text-amber-700">Trials vencendo em 3 dias</span>
                <p className="text-xs text-amber-600 mt-0.5">Ação urgente necessária</p>
              </button>
              <button
                onClick={() => navigate("/admin/trials?filter=expired")}
                className="w-full text-left px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-sm"
              >
                <span className="font-medium text-red-500">Trials expirados</span>
                <p className="text-xs text-red-500 mt-0.5">Converter ou bloquear</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminPanelLayout>
  );
}
