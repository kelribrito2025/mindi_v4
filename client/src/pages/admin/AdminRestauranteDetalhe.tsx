import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Store,
  User,
  Calendar,
  CreditCard,
  ExternalLink,
  Pencil,
  RotateCcw,
  Zap,
  Lock,
  Unlock,
  Timer,
  Loader2,
  Users,
  Settings,
  Phone,
  Mail,
  History,
  MessageSquare,
  AlertCircle,
  UserPlus,
  Trash2,
} from "lucide-react";

export default function AdminRestauranteDetalhe() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const parsedId = parseInt(params.id || "", 10);
  const restaurantId = isNaN(parsedId) ? 0 : parsedId;

  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("basic");

  // Buscar displayNames dinâmicos dos planos
  const { data: planData } = trpc.admin.plans.getAll.useQuery();
  const planDisplayNames: Record<string, string> = {
    trial: "Free (gratuito)",
    lite: "Starter",
    basic: "Essencial",
    pro: "Pro",
  };
  if (planData?.prices) {
    for (const p of planData.prices) {
      if (p.displayName && p.planId in planDisplayNames) {
        planDisplayNames[p.planId] = p.displayName;
      }
    }
  }
  const [extendTrialOpen, setExtendTrialOpen] = useState(false);
  const [extraDays, setExtraDays] = useState("7");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [activeTab, setActiveTab] = useState("cobranca");

  // Contact editing state
  const [editingContact, setEditingContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const { data: restaurant, isLoading, refetch } = trpc.admin.restaurants.detail.useQuery(
    { id: restaurantId },
    { enabled: restaurantId > 0 }
  );

  const changePlanMutation = trpc.admin.restaurants.changePlan.useMutation({
    onSuccess: () => {
      toast.success("Plano alterado!");
      refetch();
      setChangePlanOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMenuMutation = trpc.admin.restaurants.toggleMenu.useMutation({
    onSuccess: () => {
      toast.success("Menu atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const extendTrialMutation = trpc.admin.restaurants.extendTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial estendido!");
      refetch();
      setExtendTrialOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetTrialMutation = trpc.admin.restaurants.resetTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial resetado!");
      refetch();
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const forceExpireMutation = trpc.admin.restaurants.forceExpire.useMutation({
    onSuccess: () => {
      toast.success("Trial expirado!");
      refetch();
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const impersonateMutation = trpc.admin.restaurants.impersonate.useMutation({
    onSuccess: (data: any) => {
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      const expiresLabel = expiresAt
        ? expiresAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "";
      const newWindow = window.open("/", "_blank");
      if (!newWindow) {
        toast.error("Popup bloqueado pelo navegador. Permita popups e tente novamente.");
      } else {
        toast.success(`Sessão criada! Expira às ${expiresLabel}`, { duration: 6000 });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.admin.restaurants.updateSubscriptionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateContactMutation = trpc.admin.restaurants.updateContact.useMutation({
    onSuccess: () => {
      toast.success("Contato atualizado!");
      refetch();
      setEditingContact(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.restaurants.delete.useMutation({
    onSuccess: (data: any) => {
      const nome = data?.name || "selecionado";
      toast.success(`Restaurante "${nome}" excluído permanentemente!`);
      setDeleteDialog(false);
      setDeleteConfirmText("");
      navigate("/admin/restaurantes");
    },
    onError: (err) => toast.error(err.message),
  });

  // F04: Feedback para ID inválido na URL
  if (restaurantId <= 0) {
    return (
      <AdminPanelLayout>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
          <p className="text-muted-foreground">ID de restaurante inválido</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/restaurantes")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AdminPanelLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminPanelLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPanelLayout>
    );
  }

  if (!restaurant) {
    return (
      <AdminPanelLayout>
        <div className="text-center py-20">
          <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-muted-foreground">Restaurante não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/restaurantes")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AdminPanelLayout>
    );
  }

  const planColors: Record<string, string> = {
    trial: "bg-blue-50 text-blue-700 border border-blue-200/50",
    free: "bg-gray-50 text-gray-700 border border-gray-200/50",
    lite: "bg-orange-50 text-orange-700 border border-orange-200/50",
    basic: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
    pro: "bg-purple-50 text-purple-700 border border-purple-200/50",
  };

  const currentSubscriptionStatus = (() => {
    if (restaurant.planType === "trial") {
      if (restaurant.trialStatus === "expired") return "cancelled";
      return "trial";
    }
    if (restaurant.manuallyClosed) return "suspended";
    return "active";
  })();

  const startDate = restaurant.planActivatedAt
    ? new Date(restaurant.planActivatedAt).toLocaleDateString("pt-BR")
    : restaurant.trialStartDate
    ? new Date(restaurant.trialStartDate).toLocaleDateString("pt-BR")
    : restaurant.createdAt
    ? new Date(restaurant.createdAt).toLocaleDateString("pt-BR")
    : "—";

  const handleStartEditContact = () => {
    setContactName(restaurant.responsibleName || restaurant.owner?.name || "");
    setContactPhone(restaurant.responsiblePhone || restaurant.whatsapp || "");
    setContactEmail(restaurant.email || restaurant.owner?.email || "");
    setEditingContact(true);
  };

  const tabs = [
    { id: "cobranca", label: "Cobrança", icon: CreditCard },
    { id: "contato", label: "Contato", icon: null },
    { id: "historico", label: "Histórico", icon: History },
    { id: "administradores", label: "Administradores", icon: null },
    { id: "comunicacoes", label: "Comunicações", icon: MessageSquare },
  ];

  return (
    <AdminPanelLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => navigate("/admin/restaurantes")}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-card transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-foreground truncate">{restaurant.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${planColors[restaurant.planType] || "bg-muted text-foreground"}`}>
                  {restaurant.planLabel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">/{restaurant.menuSlug || restaurant.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {restaurant.menuSlug && (
              <Button
                variant="outline"
                className="rounded-xl border-border/50"
                onClick={() => window.open(`/menu/${restaurant.menuSlug}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Cardápio
              </Button>
            )}
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              disabled={impersonateMutation.isPending}
              onClick={() => impersonateMutation.mutate({ id: restaurant.id })}
            >
              {impersonateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Acessar Painel
            </Button>
          </div>
        </div>

        {/* 4 Info Cards - Same style as dashboard StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mensalidade */}
          <div className="bg-card rounded-xl border border-border/50 border-t-4 border-t-blue-500">
            <div className="px-5 py-5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                  Mensalidade
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-2xl font-bold tracking-tight">
                    {restaurant.planPrice > 0
                      ? `R$ ${restaurant.planPrice.toFixed(2).replace(".", ",")}`
                      : "Grátis"}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 bg-blue-100">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Início */}
          <div className="bg-card rounded-xl border border-border/50 border-t-4 border-t-blue-500">
            <div className="px-5 py-5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                  Início
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-2xl font-bold tracking-tight">{startDate}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="bg-card rounded-xl border border-border/50 border-t-4 border-t-blue-500">
            <div className="px-5 py-5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                  Admins
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-2xl font-bold tracking-tight">{restaurant.adminCount}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Loja */}
          <div className="bg-card rounded-xl border border-border/50 border-t-4 border-t-blue-500">
            <div className="px-5 py-5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                  Loja
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border tracking-wide ${
                    !restaurant.manuallyClosed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      : "bg-red-50 text-red-500 border-red-200/50"
                  }`}>
                    {!restaurant.manuallyClosed ? "Ativa" : "Inativa"}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border tracking-wide ${
                    restaurant.isOpen
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      : "bg-gray-50 text-gray-600 border-gray-200/50"
                  }`}>
                    {restaurant.isOpen ? "Aberta" : "Fechada"}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 bg-blue-100">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - underline style matching dashboard */}
        <div>
          <div className="border-b border-border/50">
            <div className="flex gap-0 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab.icon && <tab.icon className="h-4 w-4" />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {/* Tab: Cobrança */}
            {activeTab === "cobranca" && (
              <div className="bg-card rounded-xl border border-border/50">
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cobrança
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Alert: no payment configured */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200/50 bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-500">
                      O Mercado Pago não está configurado. Configure em <strong>Configurações → Mercado Pago</strong> para gerar cobranças automáticas.
                    </p>
                  </div>

                  {/* Subscription Status */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Gerenciar Status Manualmente</Label>
                    <Select
                      value={currentSubscriptionStatus}
                      onValueChange={(val) => {
                        updateStatusMutation.mutate({
                          id: restaurant.id,
                          status: val as any,
                        });
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Período de Teste</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações Administrativas</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/50"
                        onClick={() => {
                          setNewPlan(restaurant.planType || "basic");
                          setChangePlanOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Alterar plano
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/50"
                        onClick={() => toggleMenuMutation.mutate({ id: restaurant.id, isOpen: !restaurant.isOpen })}
                      >
                        {restaurant.isOpen ? (
                          <><Lock className="h-3.5 w-3.5 mr-1.5" /> Bloquear menu</>
                        ) : (
                          <><Unlock className="h-3.5 w-3.5 mr-1.5" /> Reabrir menu</>
                        )}
                      </Button>
                      {restaurant.planType === "trial" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-border/50"
                            onClick={() => setExtendTrialOpen(true)}
                          >
                            <Timer className="h-3.5 w-3.5 mr-1.5" /> Estender trial
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-border/50"
                            onClick={() => setConfirmAction("resetTrial")}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Resetar trial
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-border/50 text-red-500 hover:text-red-500 hover:bg-red-50"
                            onClick={() => setConfirmAction("forceExpire")}
                          >
                            <Zap className="h-3.5 w-3.5 mr-1.5" /> Forçar expiração
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-red-200 text-red-500 hover:text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteDialog(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir restaurante
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Contato */}
            {activeTab === "contato" && (
              <div className="bg-card rounded-xl border border-border/50">
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados de Contato
                    </h3>
                  </div>
                  {!editingContact && (
                    <Button variant="outline" size="sm" className="rounded-xl border-border/50" onClick={handleStartEditContact}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-5">Informações do responsável pelo restaurante</p>

                  {editingContact ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5 text-sm">
                            <User className="h-3.5 w-3.5" /> Nome do Proprietário
                          </Label>
                          <Input
                            className="rounded-xl"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="João da Silva"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp
                          </Label>
                          <Input
                            className="rounded-xl"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="(35) 99999-9999"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3.5 w-3.5" /> E-mail de Contato
                        </Label>
                        <Input
                          className="rounded-xl"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="contato@restaurante.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          E-mail para comunicações (pode ser diferente do e-mail de cobrança)
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setEditingContact(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="rounded-xl"
                          disabled={updateContactMutation.isPending}
                          onClick={() => {
                            if (!contactName.trim()) {
                              toast.error("Nome do responsável é obrigatório.");
                              return;
                            }
                            if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
                              toast.error("Email inválido.");
                              return;
                            }
                            updateContactMutation.mutate({
                              id: restaurant.id,
                              responsibleName: contactName.trim(),
                              responsiblePhone: contactPhone.trim(),
                              email: contactEmail.trim(),
                            });
                          }}
                        >
                          {updateContactMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" /> Nome do Proprietário
                        </Label>
                        <p className="text-sm font-medium text-foreground border border-border/50 rounded-xl px-3 py-2.5 bg-muted/30">
                          {restaurant.responsibleName || restaurant.owner?.name || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp
                        </Label>
                        <p className="text-sm font-medium text-foreground border border-border/50 rounded-xl px-3 py-2.5 bg-muted/30">
                          {restaurant.responsiblePhone || restaurant.whatsapp || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> E-mail de Contato
                        </Label>
                        <p className="text-sm font-medium text-foreground border border-border/50 rounded-xl px-3 py-2.5 bg-muted/30">
                          {restaurant.email || restaurant.owner?.email || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          E-mail para comunicações (pode ser diferente do e-mail de cobrança)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "historico" && (
              <div className="bg-card rounded-xl border border-border/50">
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
                  <h3 className="font-semibold text-base">Histórico de Pagamentos</h3>
                </div>
                <div className="p-6">
                  <PaymentHistoryTab restaurantId={restaurant.id} />
                </div>
              </div>
            )}

            {/* Tab: Administradores */}
            {activeTab === "administradores" && (
              <div className="bg-card rounded-xl border border-border/50">
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Administradores
                    </h3>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    size="sm"
                    onClick={() => toast.info("Funcionalidade em breve")}
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" /> Novo Admin
                  </Button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">Gerencie quem pode acessar o painel do restaurante</p>

                  {restaurant.owner ? (
                    <div className="border border-border/50 rounded-xl divide-y divide-border/50">
                      <div className="flex items-center gap-4 p-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{restaurant.owner.name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground truncate">{restaurant.owner.email || "—"}</p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200/50 shrink-0">
                          Proprietário
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-5 bg-muted/50 rounded-2xl mb-6">
                        <Users className="h-12 w-12 text-muted-foreground/70" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum administrador cadastrado</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Crie um administrador para permitir o acesso ao painel.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Comunicações */}
            {activeTab === "comunicacoes" && (
              <div className="bg-card rounded-xl border border-border/50">
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comunicações
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-5 bg-muted/50 rounded-2xl mb-6">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma comunicação enviada</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      As comunicações com este restaurante aparecerão aqui.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>Alterar o plano de {restaurant.name}</DialogDescription>
          </DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">{planDisplayNames.free || "Free"}</SelectItem>
              <SelectItem value="lite">{planDisplayNames.lite}</SelectItem>
              <SelectItem value="basic">{planDisplayNames.basic}</SelectItem>
              <SelectItem value="pro">{planDisplayNames.pro}</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setChangePlanOpen(false)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-500 rounded-xl"
              disabled={changePlanMutation.isPending}
              onClick={() => changePlanMutation.mutate({ id: restaurant.id, planType: newPlan as any })}
            >
              {changePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={extendTrialOpen} onOpenChange={setExtendTrialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Trial</DialogTitle>
            <DialogDescription>Adicionar dias extras ao trial de {restaurant.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Dias extras</Label>
            <Input
              className="rounded-xl"
              type="number"
              min="1"
              max="90"
              value={extraDays}
              onChange={(e) => setExtraDays(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setExtendTrialOpen(false)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-500 rounded-xl"
              disabled={extendTrialMutation.isPending}
              onClick={() => {
                const days = parseInt(extraDays, 10);
                if (isNaN(days) || days < 1 || days > 90) {
                  toast.error("Dias inválidos. Use um valor entre 1 e 90.");
                  return;
                }
                extendTrialMutation.mutate({ id: restaurant.id, extraDays: days });
              }}
            >
              {extendTrialMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Estender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              {confirmAction === "resetTrial" && "Resetar o trial dará 15 dias novos a este restaurante."}
              {confirmAction === "forceExpire" && "Forçar a expiração bloqueará o menu público imediatamente."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-500 rounded-xl"
              disabled={resetTrialMutation.isPending || forceExpireMutation.isPending}
              onClick={() => {
                if (confirmAction === "resetTrial") {
                  resetTrialMutation.mutate({ id: restaurant.id });
                } else if (confirmAction === "forceExpire") {
                  forceExpireMutation.mutate({ id: restaurant.id });
                }
              }}
            >
              {(resetTrialMutation.isPending || forceExpireMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={() => { setDeleteDialog(false); setDeleteConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Excluir Restaurante
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <span className="block">
                Tem certeza que deseja excluir permanentemente o restaurante <strong>{restaurant?.name}</strong>?
              </span>
              <span className="block text-red-500 font-medium">
                Esta ação é irreversível! Todos os dados serão removidos: pedidos, produtos, categorias, clientes, configurações, mesas, comandas, financeiro, etc.
              </span>
              <span className="block">
                Digite <strong>EXCLUIR</strong> para confirmar:
              </span>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR"
            className="border-red-200 focus-visible:ring-red-500"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setDeleteDialog(false); setDeleteConfirmText(""); }}>Cancelar</Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleteConfirmText !== "EXCLUIR" || deleteMutation.isPending}
              onClick={() => {
                if (deleteConfirmText !== "EXCLUIR" || !restaurant) return;
                deleteMutation.mutate({ id: restaurant.id });
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPanelLayout>
  );
}
function PaymentHistoryTab({ restaurantId }: { restaurantId: number }) {
  const { data: payments, isLoading } = trpc.admin.restaurants.getPaymentHistory.useQuery({ id: restaurantId });

  const planLabelMap: Record<string, string> = {
    trial: "Teste",
    free: "Gratuito",
    lite: "Starter",
    basic: "Essencial",
    pro: "Pro",
  };

  const statusLabelMap: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-emerald-50 text-emerald-700 border-emerald-200/50" },
    pending: { label: "Pendente", className: "bg-yellow-50 text-yellow-700 border-yellow-200/50" },
    past_due: { label: "Vencido", className: "bg-red-50 text-red-600 border-red-200/50" },
    canceled: { label: "Cancelado", className: "bg-gray-50 text-gray-600 border-gray-200/50" },
    expired: { label: "Expirado", className: "bg-gray-50 text-gray-600 border-gray-200/50" },
    canceling: { label: "Cancelando", className: "bg-orange-50 text-orange-700 border-orange-200/50" },
  };

  const gatewayLabelMap: Record<string, string> = {
    paytime_pix: "PIX",
    paytime_card: "Cartão",
    stripe_card: "Stripe",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 bg-muted/50 rounded-2xl mb-6">
          <History className="h-12 w-12 text-muted-foreground/70" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum pagamento registrado</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Os pagamentos realizados por este restaurante aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Data</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Plano</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Forma</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Valor</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Período</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => {
            const statusInfo = statusLabelMap[p.status] || { label: p.status, className: "bg-gray-50 text-gray-600 border-gray-200/50" };
            return (
              <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30">
                <td className="py-3 px-3 whitespace-nowrap">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="py-3 px-3">
                  {planLabelMap[p.planId] || p.planId}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({p.billingPeriod === "annual" ? "anual" : "mensal"})
                  </span>
                </td>
                <td className="py-3 px-3">
                  {gatewayLabelMap[p.gateway] || p.gateway}
                  {p.paytimeCardLast4 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      •••• {p.paytimeCardLast4}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-medium">
                  R$ {(p.amountCents / 100).toFixed(2).replace(".", ",")}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                  {p.currentPeriodStart && p.currentPeriodEnd
                    ? `${new Date(p.currentPeriodStart).toLocaleDateString("pt-BR")} - ${new Date(p.currentPeriodEnd).toLocaleDateString("pt-BR")}`
                    : p.lastPaymentAt
                    ? `Pago em ${new Date(p.lastPaymentAt).toLocaleDateString("pt-BR")}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
