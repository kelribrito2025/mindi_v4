import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { MobileExpandableText } from "@/components/MobileExpandableText";
import { StatCard, PageHeader } from "@/components/shared";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
import {
  ContactRound,
  Users,
  UserPlus,
  UserCheck,
  AlertTriangle,
  UserX,
  Search,
  MoreHorizontal,
  Eye,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Package,
  Plus,
  X,
  MessageCircle,
  Pencil,
  User,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Coins,
  ArrowRight,
  Stamp,
  Heart,
  BarChart3,
} from "lucide-react";
import { DateRangePickerSales } from "@/components/DateRangePickerSales";

// Helpers
function formatPhone(phone: string) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatDateTime(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getOrderStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "bg-amber-50 text-amber-700 border-amber-200" },
    pending_confirmation: { label: "Pendente", color: "bg-amber-50 text-amber-700 border-amber-200" },
    new: { label: "Novo", color: "bg-blue-50 text-blue-700 border-blue-200" },
    confirmed: { label: "Confirmado", color: "bg-blue-50 text-blue-700 border-blue-200" },
    preparing: { label: "Preparando", color: "bg-orange-50 text-orange-700 border-orange-200" },
    ready: { label: "Pronto", color: "bg-green-50 text-green-700 border-green-200" },
    delivering: { label: "Entregando", color: "bg-purple-50 text-purple-700 border-purple-200" },
    delivered: { label: "Entregue", color: "bg-green-50 text-green-700 border-green-200" },
    completed: { label: "Concluído", color: "bg-green-50 text-green-700 border-green-200" },
    cancelled: { label: "Cancelado", color: "bg-red-50 text-red-500 border-red-200" },
  };
  return map[status] || { label: status, color: "bg-gray-50 text-gray-700 border-gray-200" };
}

// Period filter options (pill buttons)
const periodFilters = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "90d", label: "3 meses" },
];

function getPeriodDates(period: string) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;
  switch (period) {
    case "today":
      start = new Date(end); start.setHours(0, 0, 0, 0); break;
    case "7d":
      start = new Date(end); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0); break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); break;
    case "90d":
      start = new Date(end); start.setDate(start.getDate() - 90); start.setHours(0, 0, 0, 0); break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  return { start, end };
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Clientes() {
  const [, navigate] = useLocation();
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;

  // Reward program banners
  const { data: cashbackConfig } = trpc.cashback.getConfig.useQuery();
  const isCashbackActive = cashbackConfig?.rewardProgramType === 'cashback' && cashbackConfig?.cashbackEnabled;
  const isLoyaltyActive = cashbackConfig?.rewardProgramType === 'loyalty' && cashbackConfig?.loyaltyEnabled;
  const cashbackPercent = cashbackConfig?.cashbackPercent || '0';

  // Carrossel de banners
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const showCashbackBanner = cashbackConfig && !isCashbackActive;
  const showLoyaltyBanner = cashbackConfig && !isLoyaltyActive;
  const banners: ('cashback' | 'loyalty')[] = [];
  if (showCashbackBanner) banners.push('cashback');
  if (showLoyaltyBanner) banners.push('loyalty');
  const totalBanners = banners.length;
  const safeBannerIndex = activeBannerIndex >= totalBanners ? 0 : activeBannerIndex;

  // Auto-rotação dos banners a cada 7 segundos (pausa ao hover)
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  useEffect(() => {
    if (totalBanners <= 1 || isBannerHovered) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % totalBanners);
    }, 7000);
    return () => clearInterval(interval);
  }, [totalBanners, isBannerHovered]);

  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const { searchQuery: globalSearch } = useSearch();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activePageTab, setActivePageTab] = useState<"clientes" | "detalhes">("clientes");
  const perPage = 20;
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'new' | 'recurrent' | 'atRisk' | 'inactive' | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'totalOrders' | 'lastOrderDate' | 'totalSpent' | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | undefined>(undefined);

  // Profile sheet
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [profileTab, setProfileTab] = useState<string>("info");
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);

  // Edit sheet (inline PDV style)
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [createData, setCreateData] = useState({
    name: "", phone: "", street: "", number: "", complement: "",
    neighborhood: "", reference: "", notes: "",
  });

  // Neighborhood selection (edit)
  const [editShowNeighborhoodList, setEditShowNeighborhoodList] = useState(false);
  const [editNeighborhoodSearch, setEditNeighborhoodSearch] = useState("");
  // Neighborhood selection (create)
  const [createShowNeighborhoodList, setCreateShowNeighborhoodList] = useState(false);
  const [createNeighborhoodSearch, setCreateNeighborhoodSearch] = useState("");

  // Notes inline edit
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [expandedNoteIdx, setExpandedNoteIdx] = useState<number | null>(null);
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  // Debounce global search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(globalSearch), 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const periodStart = useMemo(() => {
    const d = new Date(customStart + "T00:00:00");
    return d;
  }, [customStart]);
  const periodEnd = useMemo(() => {
    const d = new Date(customEnd + "T23:59:59");
    return d;
  }, [customEnd]);

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.pdvCustomer.stats.useQuery(
    { establishmentId: estId!, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() },
    { enabled: !!estId }
  );
  const { data: detailsData, isLoading: detailsLoading } = trpc.pdvCustomer.detailsTab.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId, staleTime: 5 * 60 * 1000, refetchOnMount: false, retry: 1 }
  );

  const { data: customerList, isLoading: listLoading } = trpc.pdvCustomer.list.useQuery(
    {
      establishmentId: estId!,
      page,
      perPage,
      search: debouncedSearch || undefined,
      customerType: customerTypeFilter || undefined,
      periodStart: customerTypeFilter ? periodStart.toISOString() : undefined,
      periodEnd: customerTypeFilter ? periodEnd.toISOString() : undefined,
      sortBy,
      sortDir,
    },
    { enabled: !!estId }
  );

  const { data: customerProfile, isLoading: profileLoading } = trpc.pdvCustomer.profile.useQuery(
    { establishmentId: estId!, customerId: selectedCustomerId! },
    { enabled: !!estId && !!selectedCustomerId }
  );

  const { data: orderHistory, isLoading: ordersLoading } = trpc.pdvCustomer.orderHistory.useQuery(
    { establishmentId: estId!, customerPhone: customerProfile?.phone || "", page: orderHistoryPage, perPage: 10 },
    { enabled: !!estId && !!customerProfile?.phone && profileTab === "orders" }
  );

  // Neighborhood fees (for byNeighborhood establishments)
  const { data: neighborhoodFees } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && establishment?.deliveryFeeType === "byNeighborhood" }
  );

  // Mutations
  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.pdvCustomer.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      setShowEditSheet(false);
      utils.pdvCustomer.profile.invalidate();
      utils.pdvCustomer.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createMutation = trpc.pdvCustomer.create.useMutation({
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success("Cliente criado com sucesso!");
        setCreateDialog(false);
        setCreateData({ name: "", phone: "", street: "", number: "", complement: "", neighborhood: "", reference: "", notes: "" });
        setCreateShowNeighborhoodList(false);
        setCreateNeighborhoodSearch("");
        utils.pdvCustomer.list.invalidate();
        utils.pdvCustomer.stats.invalidate();
      } else {
        toast.error(result.error || "Erro ao criar cliente");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateNotesMutation = trpc.pdvCustomer.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Anotação salva!");
      setEditingNotes(false);
      utils.pdvCustomer.profile.invalidate();
      utils.pdvCustomer.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Estado para confirmação de exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const deleteMutation = trpc.pdvCustomer.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso!");
      setDeleteConfirm(null);
      utils.pdvCustomer.list.invalidate();
      utils.pdvCustomer.stats.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir cliente"),
  });

  // Handlers
  function openProfile(customerId: number) {
    setSelectedCustomerId(customerId);
    setProfileTab("info");
    setOrderHistoryPage(1);
    setShowEditSheet(false);
    setEditingNotes(false);
  }

  function openEdit() {
    if (!customerProfile) return;
    setEditData({
      customerId: customerProfile.id,
      name: customerProfile.name || "",
      phone: customerProfile.phone || "",
      street: customerProfile.street || "",
      number: customerProfile.number || "",
      complement: customerProfile.complement || "",
      neighborhood: customerProfile.neighborhood || "",
      reference: customerProfile.reference || "",
      notes: customerProfile.notes || "",
    });
    setEditShowNeighborhoodList(false);
    setEditNeighborhoodSearch("");
    setShowEditSheet(true);
  }

  // Helper: parse notes from stored format "[date] text" per line
  function parseNotes(raw: string): { text: string; date: string }[] {
    if (!raw) return [];
    return raw.split('\n').filter((n: string) => n.trim()).map((line: string) => {
      const match = line.match(/^\[(\d{2}\/\d{2}\/\d{4})\]\s*(.*)$/);
      if (match) return { date: match[1], text: match[2] };
      return { date: '', text: line };
    });
  }

  function formatNoteDate(): string {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  function openNotes() {
    if (!customerProfile) return;
    setNotesValue("");
    setEditingNotes(true);
    setExpandedNoteIdx(null);
    setEditingNoteIdx(null);
  }

  function saveNewNote() {
    if (!customerProfile || !estId || !notesValue.trim()) return;
    const existing = customerProfile.notes || "";
    const newLine = `[${formatNoteDate()}] ${notesValue.trim()}`;
    const newNotes = existing ? `${existing}\n${newLine}` : newLine;
    updateNotesMutation.mutate({ establishmentId: estId, customerId: customerProfile.id, notes: newNotes });
  }

  function startEditNote(noteIdx: number) {
    if (!customerProfile) return;
    const notes = parseNotes(customerProfile.notes || "");
    if (notes[noteIdx]) {
      setEditingNoteIdx(noteIdx);
      setEditNoteText(notes[noteIdx].text);
    }
  }

  function saveEditNote() {
    if (!customerProfile || !estId || editingNoteIdx === null) return;
    const notes = parseNotes(customerProfile.notes || "");
    if (notes[editingNoteIdx]) {
      const date = notes[editingNoteIdx].date || formatNoteDate();
      notes[editingNoteIdx] = { date, text: editNoteText.trim() };
    }
    const newNotes = notes.map(n => n.date ? `[${n.date}] ${n.text}` : n.text).join('\n');
    updateNotesMutation.mutate({ establishmentId: estId, customerId: customerProfile.id, notes: newNotes });
    setEditingNoteIdx(null);
    setEditNoteText("");
  }

  function deleteNote(noteIdx: number) {
    if (!customerProfile || !estId) return;
    const notes = parseNotes(customerProfile.notes || "");
    notes.splice(noteIdx, 1);
    const newNotes = notes.map(n => n.date ? `[${n.date}] ${n.text}` : n.text).join('\n');
    updateNotesMutation.mutate({ establishmentId: estId, customerId: customerProfile.id, notes: newNotes });
  }

  function closeProfileSheet() {
    setSelectedCustomerId(null);
    setShowEditSheet(false);
    setEditingNotes(false);
    setExpandedNoteIdx(null);
    setEditingNoteIdx(null);
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header com filtro e botão inline */}
        <PageHeader
          title="Clientes"
          description="Gerencie seus clientes e acompanhe suas compras"
          icon={<ContactRound className="h-6 w-6 text-blue-600" />}
          actions={
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-xl p-1">
                <DateRangePickerSales
                  startDate={customStart}
                  endDate={customEnd}
                  onApply={(start, end) => {
                    setCustomStart(start);
                    setCustomEnd(end);
                    setPage(1);
                    setCustomerTypeFilter(null);
                  }}
                  triggerClassName="flex items-center gap-2 rounded-lg cursor-pointer transition-colors px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                  triggerLabel="Filtro"
                  triggerIcon="sliders"
                />
              </div>
              <button
                onClick={() => setCreateDialog(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500 flex items-center gap-1.5"
              >
                Novo Cliente
              </button>
            </div>
          }
        />

        {/* Stats Cards — Dashboard StatCard style — clicáveis para filtrar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div onClick={() => { setCustomerTypeFilter(null); setPage(1); }} className={`cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${customerTypeFilter === null ? 'ring-2 ring-blue-500/30 shadow-md' : ''}`}>
            <StatCard title="T. de Clientes" value={stats?.total ?? 0} icon={Users} loading={statsLoading} variant="blue" />
          </div>
          <div onClick={() => { setCustomerTypeFilter(customerTypeFilter === 'new' ? null : 'new'); setPage(1); }} className={`cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${customerTypeFilter === 'new' ? 'ring-2 ring-emerald-500/30 shadow-md' : ''}`}>
            <StatCard title="Novos no Período" value={stats?.new ?? 0} icon={UserPlus} loading={statsLoading} variant="emerald" />
          </div>
          <div onClick={() => { setCustomerTypeFilter(customerTypeFilter === 'recurrent' ? null : 'recurrent'); setPage(1); }} className={`cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${customerTypeFilter === 'recurrent' ? 'ring-2 ring-blue-500/30 shadow-md' : ''}`}>
            <StatCard title="Recorrentes" value={stats?.recurrent ?? 0} icon={UserCheck} loading={statsLoading} variant="blue" />
          </div>
          <div onClick={() => { setCustomerTypeFilter(customerTypeFilter === 'atRisk' ? null : 'atRisk'); setPage(1); }} className={`cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${customerTypeFilter === 'atRisk' ? 'ring-2 ring-amber-500/30 shadow-md' : ''}`}>
            <StatCard title="Em Risco" value={stats?.atRisk ?? 0} icon={AlertTriangle} loading={statsLoading} variant="amber" />
          </div>
          <div onClick={() => { setCustomerTypeFilter(customerTypeFilter === 'inactive' ? null : 'inactive'); setPage(1); }} className={`cursor-pointer rounded-xl transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${customerTypeFilter === 'inactive' ? 'ring-2 ring-red-500/30 shadow-md' : ''}`}>
            <StatCard title="Inativos" value={stats?.inactive ?? 0} icon={UserX} loading={statsLoading} variant="red" />
          </div>
        </div>

        {/* Banners de Fidelização — carrossel com dots */}
        {totalBanners > 0 && (
          <div className="space-y-2" onMouseEnter={() => setIsBannerHovered(true)} onMouseLeave={() => setIsBannerHovered(false)}>
            <div className="relative overflow-hidden rounded-xl">
              {/* Cashback Banner */}
              {banners[safeBannerIndex] === 'cashback' && (
                <div
                  className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/20 border-blue-200/50 dark:border-blue-800/30"
                >
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%233b82f6' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)', animation: 'banner-shimmer 3s ease-in-out infinite', animationDelay: '1s' }} />
                  </div>
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/30 dark:bg-blue-500/20" />
                      <div className="relative p-2 rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        Ative o Cashback e fidelize seus clientes!
                      </p>
                      <MobileExpandableText
                        className="text-xs text-muted-foreground leading-tight mt-0.5"
                        collapsedClassName="pr-[4.75rem]"
                        expandButtonClassName="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/90"
                      >
                        Ofereça uma porcentagem de cada pedido como saldo para a próxima compra e incentive seus clientes a voltarem com mais frequência.
                      </MobileExpandableText>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => navigate('/fidelizacao')} className="text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent flex items-center transition-colors">
                        Ativar Cashback
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cartão Fidelidade Banner */}
              {banners[safeBannerIndex] === 'loyalty' && (
                <div
                  className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200/50 dark:border-red-500/30"
                >
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23ef4444' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)', animation: 'banner-shimmer 3s ease-in-out infinite', animationDelay: '1s' }} />
                  </div>
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30 dark:bg-red-500/20" />
                      <div className="relative p-2 rounded-full bg-red-100 dark:bg-red-500/40">
                        <Stamp className="h-5 w-5 text-red-500 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        <Stamp className="h-4 w-4 inline mr-1 text-red-500 dark:text-red-400" />
                        Ative o Cartão Fidelidade e recompense seus clientes!
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        O cliente acumula carimbos a cada pedido e, ao completar todos, ganha um cupom no valor definido por você.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => navigate('/fidelizacao')} className="text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold border border-red-300 text-red-500 hover:bg-red-50 bg-transparent flex items-center transition-colors">
                        Ativar Cartão Fidelidade
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dots de navegação */}
            {totalBanners > 1 && (
              <div className="flex justify-center gap-1.5">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveBannerIndex(idx)}
                    className={`h-2 rounded-full transition-colors duration-300 ${
                      idx === safeBannerIndex
                        ? (banners[idx] === 'cashback' ? 'w-5 bg-blue-600' : 'w-5 bg-red-500')
                        : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                    }`}
                    aria-label={`Banner ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active filter indicator */}
        {customerTypeFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtro ativo:</span>
            <Badge variant="outline" className="gap-1.5">
              {customerTypeFilter === 'new' ? 'Novos no Período' : customerTypeFilter === 'recurrent' ? 'Recorrentes' : customerTypeFilter === 'atRisk' ? 'Em Risco' : 'Inativos'}
              <button onClick={() => { setCustomerTypeFilter(null); setPage(1); }} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* ============ ABAS DE NAVEGAÇÃO ============ */}
        <div className="border-b border-border/60 mb-6">
          <nav className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {[
              { value: "clientes", label: "Clientes" },
              { value: "detalhes", label: "Detalhes" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActivePageTab(tab.value as "clientes" | "detalhes")}
                className={`
                  relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors
                  ${activePageTab === tab.value
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                  }
                `}
              >
                {tab.label}
                {activePageTab === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
        {activePageTab === "clientes" && (<>
        {/* Customers Table */}
        {listLoading ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : !customerList || customerList.customers.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ContactRound className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm mt-1">
                {globalSearch ? "Tente ajustar a busca" : "Seus clientes aparecerão aqui quando fizerem pedidos"}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bairro</th>
                    <th
                      className="text-center p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => {
                        if (sortBy === 'totalOrders') {
                          setSortDir(sortDir === 'desc' ? 'asc' : sortDir === 'asc' ? undefined : 'desc');
                          if (sortDir === 'asc') setSortBy(undefined);
                        } else {
                          setSortBy('totalOrders');
                          setSortDir('desc');
                        }
                        setPage(1);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Pedidos
                        {sortBy === 'totalOrders' ? (
                          sortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <ArrowUp className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </span>
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => {
                        if (sortBy === 'totalSpent') {
                          setSortDir(sortDir === 'desc' ? 'asc' : sortDir === 'asc' ? undefined : 'desc');
                          if (sortDir === 'asc') setSortBy(undefined);
                        } else {
                          setSortBy('totalSpent');
                          setSortDir('desc');
                        }
                        setPage(1);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Total Gasto
                        {sortBy === 'totalSpent' ? (
                          sortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <ArrowUp className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => {
                        if (sortBy === 'lastOrderDate') {
                          setSortDir(sortDir === 'desc' ? 'asc' : sortDir === 'asc' ? undefined : 'desc');
                          if (sortDir === 'asc') setSortBy(undefined);
                        } else {
                          setSortBy('lastOrderDate');
                          setSortDir('desc');
                        }
                        setPage(1);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Último Pedido
                        {sortBy === 'lastOrderDate' ? (
                          sortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5 text-red-500" /> : <ArrowUp className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </span>
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customerList.customers.map((c: any) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => openProfile(c.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {getInitials(c.name || "")}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.name || "Sem nome"}</p>
                            {c.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                <StickyNote className="h-3 w-3 inline mr-1" />
                                {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{formatPhone(c.phone)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{c.neighborhood || "—"}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-medium">{Number(c.totalOrders) || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(c.totalSpent) || 0)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {c.lastOrderDate ? formatDate(c.lastOrderDate) : "Nunca"}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openProfile(c.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirm({ id: c.id, name: c.name || c.phone || 'Cliente' })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir cliente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {customerList.customers.map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                  onClick={() => openProfile(c.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(c.name || "")}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                      </div>
                    </div>
                    <div className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openProfile(c.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirm({ id: c.id, name: c.name || c.phone || 'Cliente' })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{c.neighborhood || "—"}</span>
                    <span>·</span>
                    <span>{Number(c.totalOrders) || 0} pedidos</span>
                    <span>·</span>
                    <span>{c.lastOrderDate ? formatDate(c.lastOrderDate) : "Nunca"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer count + pagination */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border/50">
              {customerList.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{page} de {customerList.totalPages}</span>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page >= customerList.totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {customerList.total} cliente{customerList.total !== 1 ? "s" : ""} encontrado{customerList.total !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        </>)}
        {activePageTab === "detalhes" && (
          <div className="space-y-6">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Card: Hábitos de compra e preferências */}
                <div className="bg-card rounded-xl border border-border/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <ShoppingBag className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Hábitos de compra e preferências</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket médio na loja</p>
                      <p className="text-xl font-bold mt-1">{formatCurrency(detailsData?.ticketMedio ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dia que mais pedem</p>
                      <p className="text-xl font-bold mt-1">{detailsData?.diaMaisPedem || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Item mais pedido na loja</p>
                      <p className="text-xl font-bold mt-1">{detailsData?.itemMaisPedido || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Card: Quem adora comprar na loja */}
                <div className="bg-card rounded-xl border border-border/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <Heart className="h-5 w-5 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Quem adora comprar na loja</h3>
                    <span className="text-sm text-muted-foreground">(pede pelo menos 1x por semana)</span>
                  </div>
                  {detailsData?.clientesFrequentes && detailsData.clientesFrequentes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {detailsData.clientesFrequentes.map((c: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-600">
                            {c.name?.slice(0, 2).toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.ordersPerWeek.toFixed(1)}x/semana &middot; {c.totalOrders} pedidos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                        <Heart className="h-6 w-6 text-red-300" />
                      </div>
                      <p className="font-medium text-muted-foreground">0 pessoas</p>
                      <p className="text-sm text-muted-foreground mt-1">Nenhum cliente frequente em sua loja por enquanto</p>
                    </div>
                  )}
                </div>

                {/* Card: Preferências de clientes nos últimos 30 dias */}
                <div className="bg-card rounded-xl border border-border/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Preferências de clientes</h3>
                    <span className="text-sm text-muted-foreground">nos últimos 30 dias</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Dia preferido */}
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="mx-auto w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mb-3">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-bold text-lg">{detailsData?.preferencias?.diaPreferido || "Sem informações"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Seus clientes preferem comprar neste dia</p>
                    </div>
                    {/* Horário preferido */}
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="mx-auto w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mb-3">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-bold text-lg">{detailsData?.preferencias?.horarioPreferido || "Sem informações"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Seus clientes preferem comprar neste horário</p>
                    </div>
                    {/* Distribuição semanal */}
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-end justify-between h-24 mb-2">
                        {(detailsData?.preferencias?.distribuicaoSemanal || [
                          { dia: "Seg", percent: 0 }, { dia: "Ter", percent: 0 }, { dia: "Qua", percent: 0 },
                          { dia: "Qui", percent: 0 }, { dia: "Sex", percent: 0 }, { dia: "Sáb", percent: 0 }, { dia: "Dom", percent: 0 },
                        ]).map((d: any, idx: number) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{d.percent}%</span>
                            <div
                              className="w-4 rounded-t bg-red-400 dark:bg-red-500 transition-all"
                              style={{ height: `${Math.max(d.percent * 0.8, 2)}px` }}
                            />
                            <span className="text-[10px] text-muted-foreground">{d.dia}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Distribuição dos clientes que fizeram pedidos nos últimos 30 dias</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {/* ============================================================ */}
        {/* PROFILE SHEET — PDV Dados da Entrega style */}
        {/* ============================================================ */}
        <Sheet open={!!selectedCustomerId} onOpenChange={(open) => { if (!open) closeProfileSheet(); }}>
          <SheetContent
            side="right"
            className={`w-full p-0 overflow-hidden flex flex-row transition-all duration-300 ${showEditSheet ? 'sm:max-w-[742px]' : 'sm:max-w-[371px]'}`}
            hideCloseButton
          >
            <SheetTitle className="sr-only">Perfil do Cliente</SheetTitle>
            <SheetDescription className="sr-only">Detalhes do cliente</SheetDescription>

            {/* Painel de Edição inline — aparece à esquerda (PDV style) */}
            {showEditSheet && editData && (
              <div className="w-full sm:w-[371px] shrink-0 border-r border-border/50 flex flex-col bg-background overflow-hidden">
                {/* Header Edição */}
                <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Pencil className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Editar Cliente</h2>
                        <p className="text-sm text-white/80">Atualize os dados do cliente</p>
                      </div>
                    </div>
                    <button onClick={() => setShowEditSheet(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo Edição */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-red-500" />
                      Dados do Cliente
                    </h3>
                    <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nome <span className="text-red-500">*</span></label>
                        <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone <span className="text-red-500">*</span></label>
                        <input type="text" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                      </div>
                    </div>
                  </div>

                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        Endereço de Entrega
                      </h3>
                      <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Rua <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="Nome da rua" value={editData.street} onChange={(e) => setEditData({...editData, street: e.target.value})}
                              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Número <span className="text-red-500">*</span></label>
                            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="Nº" value={editData.number}
                              onChange={(e) => { const value = e.target.value.replace(/\D/g, '').slice(0, 6); setEditData({...editData, number: value}); }}
                              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Bairro <span className="text-red-500">*</span></label>
                          {establishment?.deliveryFeeType === "byNeighborhood" ? (
                            editShowNeighborhoodList ? (
                              /* Lista de bairros para seleção */
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 flex-shrink-0">
                                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-foreground">Selecione o Bairro</p>
                                    <p className="text-[10px] text-muted-foreground">Escolha o bairro para calcular a taxa</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setEditShowNeighborhoodList(false); setEditNeighborhoodSearch(""); }}
                                    className="text-xs text-red-500 font-medium hover:underline"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                                {neighborhoodFees && neighborhoodFees.length > 3 && (
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                      placeholder="Buscar bairro..."
                                      value={editNeighborhoodSearch}
                                      onChange={(e) => setEditNeighborhoodSearch(e.target.value)}
                                      className="h-8 pl-8 rounded-lg text-xs"
                                    />
                                  </div>
                                )}
                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                  {neighborhoodFees && neighborhoodFees.length > 0 ? (
                                    (() => {
                                      const filtered = neighborhoodFees.filter((fee: any) =>
                                        !editNeighborhoodSearch || fee.neighborhood.toLowerCase().includes(editNeighborhoodSearch.toLowerCase())
                                      );
                                      return filtered.length > 0 ? (
                                        filtered.map((fee: any) => (
                                          <button
                                            key={fee.id}
                                            type="button"
                                            onClick={() => {
                                              setEditData({...editData, neighborhood: fee.neighborhood});
                                              setEditShowNeighborhoodList(false);
                                              setEditNeighborhoodSearch("");
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-xs ${
                                              editData.neighborhood === fee.neighborhood
                                                ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
                                                : 'border-border bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                                editData.neighborhood === fee.neighborhood ? 'border-red-500' : 'border-muted-foreground/40'
                                              }`}>
                                                {editData.neighborhood === fee.neighborhood && (
                                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                )}
                                              </div>
                                              <span className="font-medium text-foreground">{fee.neighborhood}</span>
                                            </div>
                                            <span className="font-semibold text-red-500">
                                              R$ {parseFloat(fee.fee).toFixed(2).replace(".", ",")}
                                            </span>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="text-center py-3">
                                          <p className="text-xs text-muted-foreground">Nenhum bairro encontrado</p>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <div className="text-center py-3">
                                      <p className="text-xs text-muted-foreground">Nenhum bairro cadastrado</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Campo não-editável com botão Alterar */
                              <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-muted/50 text-foreground">
                                  {editData.neighborhood || <span className="text-muted-foreground">Nenhum bairro</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditShowNeighborhoodList(true)}
                                  className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Alterar
                                </button>
                              </div>
                            )
                          ) : (
                            /* Campo editável normal para estabelecimentos sem taxa por bairro */
                            <input type="text" placeholder="Nome do bairro" value={editData.neighborhood} onChange={(e) => setEditData({...editData, neighborhood: e.target.value})}
                              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</label>
                          <input type="text" placeholder="Apto, bloco, etc." value={editData.complement} onChange={(e) => setEditData({...editData, complement: e.target.value})}
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Ponto de referência</label>
                          <input type="text" placeholder="Próximo a..." value={editData.reference} onChange={(e) => setEditData({...editData, reference: e.target.value})}
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                        </div>
                      </div>
                    </div>

                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-red-500" />
                      Anotações
                    </h3>
                    <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                      <textarea value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} rows={3}
                        placeholder="Edite as notas do cliente..."
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none" />
                      {(() => {
                        const noteColors = [
                          { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-200', trash: 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300', date: 'text-emerald-500 dark:text-emerald-400' },
                          { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-500', text: 'text-red-500 dark:text-red-200', trash: 'text-red-400 hover:text-red-500 dark:hover:text-red-300', date: 'text-red-500 dark:text-red-400' },
                          { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-200', trash: 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-300', date: 'text-amber-500 dark:text-amber-400' },
                          { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-200', trash: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300', date: 'text-blue-500 dark:text-blue-400' },
                          { bg: 'bg-gray-50 dark:bg-gray-800/50', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-200', trash: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300', date: 'text-gray-500 dark:text-gray-400' },
                        ];
                        const parsed = parseNotes(editData.notes);
                        if (parsed.length === 0) return null;
                        return (
                          <div className="space-y-2 mt-2">
                            <p className="text-xs text-muted-foreground">Pré-visualização:</p>
                            {parsed.map((noteObj, idx) => {
                              const color = noteColors[idx % noteColors.length];
                              return (
                                <div key={idx} className={`px-3.5 py-2.5 rounded-lg border-2 border-dashed ${color.bg} ${color.border} transition-colors relative group`}>
                                  {noteObj.date && <p className={`text-[10px] font-medium mb-1 ${color.date}`}>{noteObj.date}</p>}
                                  <div className="flex items-start gap-2">
                                    <p className={`text-sm whitespace-pre-wrap ${color.text} flex-1 min-w-0 line-clamp-3`}>{noteObj.text}</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const notes = parseNotes(editData.notes);
                                        notes.splice(idx, 1);
                                        const newNotes = notes.map(n => n.date ? `[${n.date}] ${n.text}` : n.text).join('\n');
                                        setEditData({...editData, notes: newNotes});
                                      }}
                                      className={`shrink-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${color.trash}`}
                                      title="Apagar nota"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer Edição */}
                <div className="p-4 border-t border-border/50 bg-card">
                  <Button
                    className="w-full bg-red-500 hover:bg-red-500 text-white"
                    onClick={() => {
                      if (!estId || !editData) return;
                      updateProfileMutation.mutate({
                        establishmentId: estId,
                        customerId: editData.customerId,
                        name: editData.name, phone: editData.phone,
                        street: editData.street, number: editData.number,
                        complement: editData.complement, neighborhood: editData.neighborhood,
                        reference: editData.reference, notes: editData.notes,
                      });
                    }}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Salvando...</>) : "Salvar Alterações"}
                  </Button>
                </div>
              </div>
            )}

            {/* Conteúdo principal da sidebar de perfil */}
            <div className="w-[371px] shrink-0 flex flex-col h-full">
              {/* Header — gradiente vermelho PDV style */}
              <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Perfil do Cliente</h2>
                      <p className="text-sm text-white/80">Detalhes e histórico</p>
                    </div>
                  </div>
                  <button onClick={closeProfileSheet} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : customerProfile ? (
                  <>
                    {/* Informações do Cliente */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-sm">Informações do Cliente</h3>
                        <button onClick={openEdit} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors">
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {getInitials(customerProfile.name || "")}
                          </div>
                          <span className="font-medium text-sm">{customerProfile.name || "Sem nome"}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatPhone(customerProfile.phone)}</span>
                      </div>
                      {customerProfile.phone && (
                        <div className="flex gap-2">
                          <a
                            href={`tel:+55${customerProfile.phone.replace(/\D/g, "")}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            Ligar
                          </a>
                          <a
                            href={`https://wa.me/55${customerProfile.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Mensagem
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-red-500" />
                        Estatísticas de cliente
                      </h3>
                      <div className="space-y-0 p-4 bg-muted/50 rounded-xl">
                        <div className="flex items-center justify-between py-2.5 border-b border-border/30">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" /> Cliente desde
                          </span>
                          <span className="text-sm font-medium">{formatDate(customerProfile.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-border/30">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Último pedido
                          </span>
                          <span className="text-sm font-medium">{formatDate(customerProfile.stats.lastOrder)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-border/30">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <ShoppingBag className="h-3.5 w-3.5" /> Pedidos
                          </span>
                          <span className="text-sm font-medium">{customerProfile.stats.totalOrders}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-border/30">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-3.5 w-3.5" /> Receita
                          </span>
                          <span className="text-sm font-medium">{formatCurrency(customerProfile.stats.totalRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5" /> Ticket médio
                          </span>
                          <span className="text-sm font-medium">{formatCurrency(customerProfile.stats.avgTicket)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    {(customerProfile.street || customerProfile.neighborhood) && (
                      <div>
                        <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          Endereço
                        </h3>
                        <div className="p-4 bg-muted/50 rounded-xl">
                          <p className="text-sm text-foreground">
                            {[customerProfile.street, customerProfile.number ? `nº ${customerProfile.number}` : null, customerProfile.complement, customerProfile.neighborhood].filter(Boolean).join(", ")}
                          </p>
                          {customerProfile.reference && (
                            <p className="text-xs text-muted-foreground italic mt-1">Ref: {customerProfile.reference}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Anotações */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-red-500" />
                          Anotações
                        </h3>
                        {!editingNotes && (
                          <button onClick={openNotes} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors">
                            <Plus className="h-3 w-3" />
                            Deixar nota
                          </button>
                        )}
                      </div>

                      {/* Form para adicionar nova nota */}
                      {editingNotes && (
                        <div className="p-4 bg-muted/50 rounded-xl space-y-3 mb-3">
                          <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={3}
                            placeholder="Escreva uma nova nota..."
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none" />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)} className="flex-1">Cancelar</Button>
                            <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-500 text-white"
                              onClick={saveNewNote}
                              disabled={updateNotesMutation.isPending || !notesValue.trim()}
                            >
                              {updateNotesMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                              Adicionar nota
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Lista de notas existentes */}
                      {(() => {
                        const noteColors = [
                          { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-200', trash: 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300', readMore: 'text-emerald-600 dark:text-emerald-400', date: 'text-emerald-500 dark:text-emerald-400' },
                          { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-500', text: 'text-red-500 dark:text-red-200', trash: 'text-red-400 hover:text-red-500 dark:hover:text-red-300', readMore: 'text-red-500 dark:text-red-400', date: 'text-red-500 dark:text-red-400' },
                          { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-200', trash: 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-300', readMore: 'text-amber-600 dark:text-amber-400', date: 'text-amber-500 dark:text-amber-400' },
                          { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-200', trash: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300', readMore: 'text-blue-600 dark:text-blue-400', date: 'text-blue-500 dark:text-blue-400' },
                          { bg: 'bg-gray-50 dark:bg-gray-800/50', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-200', trash: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300', readMore: 'text-gray-600 dark:text-gray-400', date: 'text-gray-500 dark:text-gray-400' },
                        ];
                        const parsedNotes = parseNotes(customerProfile.notes || "");
                        if (parsedNotes.length === 0 && !editingNotes) {
                          return (
                            <div className="p-4 bg-muted/50 rounded-xl">
                              <p className="text-sm text-muted-foreground">Nenhuma anotação</p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-2">
                            {parsedNotes.map((noteObj, idx) => {
                              const color = noteColors[idx % noteColors.length];
                              const isExpanded = expandedNoteIdx === idx;
                              const isLong = noteObj.text.length > 150;
                              const isEditingThis = editingNoteIdx === idx;

                              if (isEditingThis) {
                                return (
                                  <div key={idx} className={`px-3.5 py-2.5 rounded-lg border-2 border-dashed ${color.bg} ${color.border}`}>
                                    <textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} rows={3}
                                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none mb-2" />
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" onClick={() => { setEditingNoteIdx(null); setEditNoteText(""); }} className="flex-1 h-7 text-xs">Cancelar</Button>
                                      <Button size="sm" className="flex-1 h-7 text-xs bg-red-500 hover:bg-red-500 text-white" onClick={saveEditNote} disabled={updateNotesMutation.isPending || !editNoteText.trim()}>
                                        {updateNotesMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Salvar
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={idx}
                                  className={`px-3.5 py-2.5 rounded-lg border-2 border-dashed ${color.bg} ${color.border} transition-colors relative group`}
                                >
                                  {noteObj.date && (
                                    <p className={`text-[10px] font-medium mb-1 ${color.date}`}>{noteObj.date}</p>
                                  )}
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      {isLong && !isExpanded ? (
                                        <>
                                          <p className={`text-sm whitespace-pre-wrap ${color.text} line-clamp-3`}>{noteObj.text}</p>
                                          <button
                                            onClick={() => setExpandedNoteIdx(idx)}
                                            className={`text-xs font-medium mt-1 ${color.readMore} hover:underline`}
                                          >
                                            Ler mais...
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <p className={`text-sm whitespace-pre-wrap ${color.text}`}>{noteObj.text}</p>
                                          {isLong && isExpanded && (
                                            <button
                                              onClick={() => setExpandedNoteIdx(null)}
                                              className={`text-xs font-medium mt-1 ${color.readMore} hover:underline`}
                                            >
                                              Ler menos
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-colors">
                                      <button
                                        onClick={() => startEditNote(idx)}
                                        className={`p-1 rounded transition-colors ${color.trash}`}
                                        title="Editar nota"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteNote(idx)}
                                        className={`p-1 rounded transition-colors ${color.trash}`}
                                        title="Apagar nota"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Tabs: Info / Orders */}
                    <Tabs value={profileTab} onValueChange={(v) => { setProfileTab(v); if (v === "orders") setOrderHistoryPage(1); }}>
                      <TabsList className="w-full">
                        <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                        <TabsTrigger value="orders" className="flex-1">Histórico de Pedidos</TabsTrigger>
                      </TabsList>

                      <TabsContent value="info" className="mt-4">
                        <div className="p-4 bg-muted/50 rounded-xl space-y-0">
                          <div className="flex justify-between py-2.5 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Nome</span>
                            <span className="text-sm font-medium">{customerProfile.name || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2.5 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Telefone</span>
                            <span className="text-sm font-medium">{formatPhone(customerProfile.phone)}</span>
                          </div>
                          <div className="flex justify-between py-2.5 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Bairro</span>
                            <span className="text-sm font-medium">{customerProfile.neighborhood || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2.5 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Cadastro</span>
                            <span className="text-sm font-medium">{formatDate(customerProfile.createdAt)}</span>
                          </div>
                          <div className="flex justify-between py-2.5">
                            <span className="text-sm text-muted-foreground">Atualizado</span>
                            <span className="text-sm font-medium">{formatDate(customerProfile.updatedAt)}</span>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="orders" className="mt-4 space-y-3">
                        {ordersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : !orderHistory || orderHistory.orders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Package className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">Nenhum pedido encontrado</p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              {orderHistory.orders.map((order: any) => {
                                const statusInfo = getOrderStatusLabel(order.status);
                                return (
                                  <div key={order.id} className="bg-muted/30 rounded-xl p-3.5 space-y-1.5 border border-border/30">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">{order.orderNumber?.startsWith("#") ? order.orderNumber : `#${order.orderNumber || `P${order.id}`}`}</span>
                                      <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{formatDateTime(order.createdAt)}</span>
                                      <span className="font-semibold text-foreground">{formatCurrency(Number(order.total) || 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {order.deliveryType && <span>{order.deliveryType === "delivery" ? "Entrega" : order.deliveryType === "pickup" ? "Retirada" : order.deliveryType}</span>}
                                      {order.paymentMethod && <><span>·</span><span>{{"card": "Cartão", "credit": "Crédito", "debit": "Débito", "cash": "Dinheiro", "pix": "Pix", "voucher": "Vale", "online": "Online"}[order.paymentMethod as string] || order.paymentMethod}</span></>}
                                      {order.source && <><span>·</span><span>{{"internal": "PDV", "whatsapp": "WhatsApp", "ifood": "iFood", "website": "Site", "app": "App", "phone": "Telefone"}[order.source as string] || order.source}</span></>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {orderHistory.total > 10 && (
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <Button variant="outline" size="sm" className="h-7" disabled={orderHistoryPage <= 1} onClick={() => setOrderHistoryPage(orderHistoryPage - 1)}>
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs text-muted-foreground">{orderHistoryPage} de {Math.ceil(orderHistory.total / 10)}</span>
                                <Button variant="outline" size="sm" className="h-7" disabled={orderHistoryPage >= Math.ceil(orderHistory.total / 10)} onClick={() => setOrderHistoryPage(orderHistoryPage + 1)}>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <p>Cliente não encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ============================================================ */}
        {/* CREATE SHEET (sidebar style) */}
        {/* ============================================================ */}
        <Sheet open={createDialog} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setCreateShowNeighborhoodList(false); setCreateNeighborhoodSearch(""); } }}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-[371px] p-0 overflow-hidden flex flex-col"
            hideCloseButton
          >
            <SheetTitle className="sr-only">Novo Cliente</SheetTitle>
            <SheetDescription className="sr-only">Cadastre um novo cliente</SheetDescription>

            {/* Header — gradiente vermelho PDV style */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Novo Cliente</h2>
                    <p className="text-sm text-white/80">Cadastre um novo cliente</p>
                  </div>
                </div>
                <button onClick={() => setCreateDialog(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-red-500" />
                  Dados do Cliente
                </h3>
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nome <span className="text-red-500">*</span></label>
                    <input type="text" value={createData.name} onChange={(e) => setCreateData({ ...createData, name: e.target.value })} placeholder="Nome do cliente"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone <span className="text-red-500">*</span></label>
                    <input type="text" value={createData.phone} onChange={(e) => setCreateData({ ...createData, phone: e.target.value })} placeholder="(00) 0 0000-0000"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  Endereço de Entrega
                </h3>
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Rua <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Nome da rua" value={createData.street} onChange={(e) => setCreateData({ ...createData, street: e.target.value })}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Número <span className="text-red-500">*</span></label>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="Nº" value={createData.number}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCreateData({ ...createData, number: v }); }}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Bairro <span className="text-red-500">*</span></label>
                    {establishment?.deliveryFeeType === "byNeighborhood" ? (
                      createShowNeighborhoodList ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 flex-shrink-0">
                              <MapPin className="h-3.5 w-3.5 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-foreground">Selecione o Bairro</p>
                              <p className="text-[10px] text-muted-foreground">Escolha o bairro para calcular a taxa</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setCreateShowNeighborhoodList(false); setCreateNeighborhoodSearch(""); }}
                              className="text-xs text-red-500 font-medium hover:underline"
                            >
                              Cancelar
                            </button>
                          </div>
                          {neighborhoodFees && neighborhoodFees.length > 3 && (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                placeholder="Buscar bairro..."
                                value={createNeighborhoodSearch}
                                onChange={(e) => setCreateNeighborhoodSearch(e.target.value)}
                                className="h-8 pl-8 rounded-lg text-xs"
                              />
                            </div>
                          )}
                          <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {neighborhoodFees && neighborhoodFees.length > 0 ? (
                              (() => {
                                const filtered = neighborhoodFees.filter((fee: any) =>
                                  !createNeighborhoodSearch || fee.neighborhood.toLowerCase().includes(createNeighborhoodSearch.toLowerCase())
                                );
                                return filtered.length > 0 ? (
                                  filtered.map((fee: any) => (
                                    <button
                                      key={fee.id}
                                      type="button"
                                      onClick={() => {
                                        setCreateData({...createData, neighborhood: fee.neighborhood});
                                        setCreateShowNeighborhoodList(false);
                                        setCreateNeighborhoodSearch("");
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-xs ${
                                        createData.neighborhood === fee.neighborhood
                                          ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
                                          : 'border-border bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                          createData.neighborhood === fee.neighborhood ? 'border-red-500' : 'border-muted-foreground/40'
                                        }`}>
                                          {createData.neighborhood === fee.neighborhood && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                          )}
                                        </div>
                                        <span className="font-medium text-foreground">{fee.neighborhood}</span>
                                      </div>
                                      <span className="font-semibold text-red-500">
                                        R$ {parseFloat(fee.fee).toFixed(2).replace(".", ",")}
                                      </span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="text-center py-3">
                                    <p className="text-xs text-muted-foreground">Nenhum bairro encontrado</p>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-center py-3">
                                <p className="text-xs text-muted-foreground">Nenhum bairro cadastrado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-muted/50 text-foreground">
                            {createData.neighborhood || <span className="text-muted-foreground">Selecionar bairro</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCreateShowNeighborhoodList(true)}
                            className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {createData.neighborhood ? 'Alterar' : 'Selecionar'}
                          </button>
                        </div>
                      )
                    ) : (
                      <input type="text" placeholder="Nome do bairro" value={createData.neighborhood} onChange={(e) => setCreateData({ ...createData, neighborhood: e.target.value })}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</label>
                    <input type="text" placeholder="Apto, bloco, etc." value={createData.complement} onChange={(e) => setCreateData({ ...createData, complement: e.target.value })}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Ponto de referência</label>
                    <input type="text" placeholder="Próximo a..." value={createData.reference} onChange={(e) => setCreateData({ ...createData, reference: e.target.value })}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-red-500" />
                    Anotações
                  </h3>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <textarea value={createData.notes} onChange={(e) => setCreateData({ ...createData, notes: e.target.value })} rows={3}
                    placeholder="Escreva uma nota para o cliente..."
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none" />
                  {(() => {
                    const noteColors = [
                      { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-200', trash: 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300', date: 'text-emerald-500 dark:text-emerald-400' },
                      { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-500', text: 'text-red-500 dark:text-red-200', trash: 'text-red-400 hover:text-red-500 dark:hover:text-red-300', date: 'text-red-500 dark:text-red-400' },
                      { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-200', trash: 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-300', date: 'text-amber-500 dark:text-amber-400' },
                      { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-200', trash: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300', date: 'text-blue-500 dark:text-blue-400' },
                      { bg: 'bg-gray-50 dark:bg-gray-800/50', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-200', trash: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300', date: 'text-gray-500 dark:text-gray-400' },
                    ];
                    const currentNotes = createData.notes.split('\n').filter((n: string) => n.trim());
                    if (currentNotes.length === 0) return null;
                    const today = (() => { const now = new Date(); return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`; })();
                    return (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs text-muted-foreground">Pré-visualização:</p>
                        {currentNotes.map((note: string, idx: number) => {
                          const color = noteColors[idx % noteColors.length];
                          return (
                            <div
                              key={idx}
                              className={`px-3.5 py-2.5 rounded-lg border-2 border-dashed ${color.bg} ${color.border} transition-colors relative group`}
                            >
                              <p className={`text-[10px] font-medium mb-1 ${color.date}`}>{today}</p>
                              <div className="flex items-start gap-2">
                                <p className={`text-sm whitespace-pre-wrap ${color.text} flex-1 min-w-0 line-clamp-3`}>{note}</p>
                                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-colors">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const notes = createData.notes.split('\n').filter((n: string) => n.trim());
                                      notes.splice(idx, 1);
                                      setCreateData({ ...createData, notes: notes.join('\n') });
                                    }}
                                    className={`p-1 rounded transition-colors ${color.trash}`}
                                    title="Apagar nota"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-card">
              <Button
                className="w-full bg-red-500 hover:bg-red-500 text-white"
                onClick={() => {
                  if (!estId || !createData.name || !createData.phone) {
                    toast.error("Nome e telefone são obrigatórios");
                    return;
                  }
                  // Formatar notas com data antes de enviar
                  const formattedNotes = createData.notes
                    ? createData.notes.split('\n').filter((n: string) => n.trim()).map((n: string) => {
                        const d = new Date();
                        const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                        return `[${dateStr}] ${n.trim()}`;
                      }).join('\n')
                    : '';
                  createMutation.mutate({ establishmentId: estId, ...createData, notes: formattedNotes });
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Criando...</>) : "Criar Cliente"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteConfirm || !estId) return;
                deleteMutation.mutate({ establishmentId: estId, customerId: deleteConfirm.id });
              }}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...</>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
