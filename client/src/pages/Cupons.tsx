import { useState } from "react";
import type { Coupon } from "../../../drizzle/schema";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Ticket,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  ChevronDown,
  Copy,
  Scissors,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CouponStatus = "active" | "inactive" | "expired" | "exhausted";

const statusConfig: Record<CouponStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  active: { label: "Ativo", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-950/40", borderColor: "border-green-200 dark:border-green-800", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  inactive: { label: "Inativo", color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border", icon: <XCircle className="h-3.5 w-3.5" /> },
  expired: { label: "Expirado", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/40", borderColor: "border-orange-200 dark:border-orange-800", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  exhausted: { label: "Esgotado", color: "text-red-500 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/40", borderColor: "border-red-200 dark:border-red-500", icon: <Ban className="h-3.5 w-3.5" /> },
};

// Cores de destaque por status para a aba do cupom
const statusAccent: Record<CouponStatus, { bg: string; text: string; border: string }> = {
  active: { bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  inactive: { bg: "bg-gray-400 dark:bg-gray-600", text: "text-white", border: "border-gray-500" },
  expired: { bg: "bg-orange-500", text: "text-white", border: "border-orange-600" },
  exhausted: { bg: "bg-gray-500 dark:bg-gray-700", text: "text-white", border: "border-gray-600" },
};

const dayLabels: Record<string, string> = {
  dom: "Dom", seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb",
};

const originLabels: Record<string, string> = {
  retirada: "Retirada", delivery: "Delivery", autoatendimento: "Autoatendimento",
};

export default function Cupons() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { searchQuery: search } = useSearch();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<number | null>(null);

  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const { data: couponsData, isLoading: couponsLoading } = trpc.coupon.list.useQuery(
    { establishmentId: establishment?.id ?? 0, search: search || undefined },
    { enabled: !!establishment?.id }
  );

  const toggleStatusMutation = trpc.coupon.toggleStatus.useMutation({
    onSuccess: () => { utils.coupon.list.invalidate(); toast.success("Status do cupom atualizado!"); },
    onError: (error) => { toast.error(error.message || "Erro ao atualizar status"); },
  });

  const deleteMutation = trpc.coupon.delete.useMutation({
    onSuccess: () => { utils.coupon.list.invalidate(); toast.success("Cupom excluído com sucesso!"); setDeleteDialogOpen(false); setCouponToDelete(null); },
    onError: (error) => { toast.error(error.message || "Erro ao excluir cupom"); },
  });

  const handleToggleStatus = (id: number, currentStatus: CouponStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: number) => { setCouponToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = () => { if (couponToDelete) deleteMutation.mutate({ id: couponToDelete }); };

  const toggleExpand = (id: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!", { description: code });
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const formatDateRange = (start: Date | null | undefined, end: Date | null | undefined) => {
    if (!start && !end) return "Sem limite";
    if (start && end) return `${format(new Date(start), "dd/MM/yy", { locale: ptBR })} - ${format(new Date(end), "dd/MM/yy", { locale: ptBR })}`;
    if (start) return `A partir de ${format(new Date(start), "dd/MM/yy", { locale: ptBR })}`;
    if (end) return `Até ${format(new Date(end), "dd/MM/yy", { locale: ptBR })}`;
    return "-";
  };

  const formatActiveDays = (days: string[] | null | undefined) => {
    if (!days || days.length === 0 || days.length === 7) return "Todos";
    return days.map(d => dayLabels[d] || d).join(", ");
  };

  const formatValidOrigins = (origins: string[] | null | undefined) => {
    if (!origins || origins.length === 0) return "Todas";
    return origins.map(o => originLabels[o] || o).join(", ");
  };

  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === "percentage") return `${parseFloat(String(coupon.value))}%`;
    return formatCurrency(coupon.value);
  };

  const formatCouponLabel = (coupon: Coupon) => {
    if (coupon.type === "percentage") return "OFF";
    return "de desconto";
  };

  const isLoading = establishmentLoading || couponsLoading;
  const coupons = couponsData?.coupons ?? [];
  const activeCoupons = coupons.filter((c: Coupon) => c.status === "active").length;
  const inactiveCoupons = coupons.filter((c: Coupon) => c.status === "inactive").length;
  const expiredCoupons = coupons.filter((c: Coupon) => c.status === "expired").length;
  const exhaustedCoupons = coupons.filter((c: Coupon) => c.status === "exhausted").length;

  const renderActions = (coupon: Coupon) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/cupons/${coupon.id}`)}>
          <Edit className="h-4 w-4 mr-2" /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleToggleStatus(coupon.id, coupon.status as CouponStatus)}
          disabled={coupon.status === "expired" || coupon.status === "exhausted"}
        >
          {coupon.status === "active" ? <><ToggleLeft className="h-4 w-4 mr-2" /> Desativar</> : <><ToggleRight className="h-4 w-4 mr-2" /> Ativar</>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDelete(coupon.id)} className="text-red-500 focus:text-red-500">
          <Trash2 className="h-4 w-4 mr-2" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderDetails = (coupon: Coupon) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
      <div>
        <span className="text-muted-foreground text-xs">Máx. Desconto</span>
        <p className="text-foreground font-medium">{formatCurrency(coupon.maxDiscount)}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Mín. Pedido</span>
        <p className="text-foreground font-medium">{formatCurrency(coupon.minOrderValue)}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Validade
        </span>
        <p className="text-foreground font-medium">{formatDateRange(coupon.startDate, coupon.endDate)}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Uso</span>
        <p className="text-foreground font-medium">{coupon.usedCount}{coupon.quantity && `/${coupon.quantity}`}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Dias</span>
        <p className="text-foreground font-medium">{formatActiveDays(coupon.activeDays)}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Origem</span>
        <p className="text-foreground font-medium">{formatValidOrigins(coupon.validOrigins)}</p>
      </div>
    </div>
  );

  // ==========================================
  // COUPON CARD — Modelo 16: Mindi Card com Aba
  // ==========================================
  const renderCouponCard = (coupon: Coupon, isDesktop: boolean) => {
    const status = statusConfig[coupon.status as CouponStatus];
    const accent = statusAccent[coupon.status as CouponStatus];
    const isExpanded = expandedCards.has(coupon.id);

    return (
      <div key={coupon.id} className="group">
        <div className="relative bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/40 overflow-hidden">
          {/* ===== ABA SUPERIOR: Faixa colorida com status ===== */}
          <div className={`flex items-center justify-between ${accent.bg} ${accent.text} px-2.5 md:px-3 py-1`}>
            <div className="flex items-center gap-1.5">
              <Ticket className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cupom de Desconto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="bg-white/15 border-white/30 text-white gap-0.5 text-[9px] px-1.5 py-0"
              >
                {status.icon}
                {status.label}
              </Badge>
              <div onClick={(e) => e.stopPropagation()}>
                {renderActions(coupon)}
              </div>
            </div>
          </div>

          {/* ===== RECORTES CIRCULARES entre aba e corpo ===== */}
          <div className="relative h-0">
            <div className="absolute -top-2 left-3 w-4 h-4 rounded-full bg-background z-10" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)' }} />
            <div className="absolute -top-2 right-3 w-4 h-4 rounded-full bg-background z-10" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)' }} />
          </div>

          {/* ===== CORPO DO CUPOM ===== */}
          <div
            className="cursor-pointer px-2.5 md:px-3 pt-2 pb-1.5"
            onClick={() => toggleExpand(coupon.id)}
          >
            {/* Valor + Código lado a lado */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg md:text-xl font-black text-red-500 dark:text-red-400 leading-none">
                  {formatCouponValue(coupon)}
                </span>
                <span className="text-[10px] font-bold text-red-500/50 dark:text-red-400/50 uppercase">
                  {formatCouponLabel(coupon)}
                </span>
              </div>
              <button
                onClick={(e) => handleCopyCode(coupon.code, e)}
                className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 border-2 border-dashed border-red-300 dark:border-red-500 rounded-md px-2 py-0.5 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors group/code"
                title="Copiar código"
              >
                <span className="font-mono font-bold text-[10px] md:text-xs text-red-500 dark:text-red-300">
                  {coupon.code}
                </span>
                <Copy className="h-3 w-3 text-red-400 opacity-0 group-hover/code:opacity-100 transition-opacity shrink-0" />
              </button>
            </div>

            {/* Info rápida */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateRange(coupon.startDate, coupon.endDate)}
              </span>
              <span className="text-border">|</span>
              <span>
                Usado: {coupon.usedCount}{coupon.quantity ? `/${coupon.quantity}` : "x"}
              </span>
              <span className="text-border">|</span>
              <span className="capitalize">
                {coupon.type === "percentage" ? "Percentual" : "Valor fixo"}
              </span>
            </div>

            {/* Seta de expandir */}
            <div className="flex justify-end -mt-0.5">
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {/* Detalhes colapsáveis */}
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="px-2.5 md:px-3 pb-2">
              <div className="border-t border-dashed border-border/60 pt-2">
                {renderDetails(coupon)}
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/cupons/${coupon.id}`); }}
                    className="text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Editar cupom
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6 text-blue-600" />
              Cupons
            </h1>
            <p className="text-base text-muted-foreground">Gerencie os cupons de desconto do seu estabelecimento</p>
          </div>
          <button onClick={() => navigate("/cupons/novo")} className="w-fit self-start sm:self-auto px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500 inline-flex items-center gap-1.5">
            Novo cupom
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-green-500 transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Ativos</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">{activeCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-green-100 dark:bg-green-950/40 rounded-lg shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-gray-400 transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Inativos</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  <span className="text-2xl font-bold tracking-tight text-muted-foreground">{inactiveCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-muted rounded-lg shrink-0">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-orange-500 transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Expirados</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">{expiredCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-orange-100 dark:bg-orange-950/40 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-red-500 transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Esgotados</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-2xl font-bold tracking-tight text-red-500 dark:text-red-400">{exhaustedCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-red-100 dark:bg-red-950/40 rounded-lg shrink-0">
                <Ban className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo: Loading / Empty / Cupons */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
                <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum cupom encontrado</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {search ? "Tente buscar por outro código" : "Crie seu primeiro cupom de desconto para atrair mais clientes."}
                </p>
              </div>
        ) : (
          <>
            {/* Desktop: Grid de cards */}
            <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-4 gap-3">
              {coupons.map((coupon: Coupon) => renderCouponCard(coupon, true))}
            </div>

            {/* Mobile: Lista de cards */}
            <div className="md:hidden space-y-3">
              {coupons.map((coupon: Coupon) => renderCouponCard(coupon, false))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Excluir cupom?</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do cupom</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir cupom?</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Esta ação não pode ser desfeita. O cupom será excluído permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              >
                Excluir
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
