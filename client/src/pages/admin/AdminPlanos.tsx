import { useState, useMemo } from "react";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  CreditCard,
  Check,
  Crown,
  Sparkles,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Zap,
  ChevronRight,
  DollarSign,
  ListChecks,
  Info,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Wallet,
  QrCode,
  MessageSquare,
  Smartphone,
  Phone,
  RefreshCw,
  Send,
  Unplug,
  FileEdit,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

const PLAN_CONFIG: Record<string, {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  headerGradient: string;
  popular?: boolean;
}> = {
  trial: {
    name: "Trial",
    icon: Sparkles,
    color: "amber",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    headerGradient: "from-amber-500 to-orange-500",
  },
  lite: {
    name: "Lite",
    icon: Zap,
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    headerGradient: "from-green-500 to-emerald-500",
  },
  basic: {
    name: "Essencial",
    icon: CreditCard,
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    headerGradient: "from-blue-500 to-indigo-500",
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "purple",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    headerGradient: "from-purple-500 to-violet-500",
    popular: true,
  },

};

const PLAN_ORDER = ["trial", "lite", "basic", "pro"];

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseBRL(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

/* ── Sortable Feature Item Component ── */
function SortableFeatureItem({
  feature,
  bgColor,
  textColor,
  isEditing,
  featureText,
  onFeatureTextChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  feature: { id: number; text: string; sortOrder: number };
  bgColor: string;
  textColor: string;
  isEditing: boolean;
  featureText: string;
  onFeatureTextChange: (val: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `feature-${feature.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    willChange: isDragging ? "transform" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors ${
        isDragging ? "shadow-lg ring-2 ring-primary/30 bg-card" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Check className={`h-3 w-3 ${textColor}`} />
      </div>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-1.5">
          <Input
            value={featureText}
            onChange={(e) => onFeatureTextChange(e.target.value)}
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 hover:bg-green-50" onClick={onSaveEdit}>
            <Save className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={onCancelEdit}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-foreground leading-snug">{feature.text}</span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:bg-muted/60"
              onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
              title="Editar"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Remover"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Gateway Settings Panel Component ── */
const GATEWAY_ICONS: Record<string, any> = {
  paytime_pix: QrCode,
  paytime_card: CreditCard,
  stripe_card: Wallet,
};

const GATEWAY_DESCRIPTIONS: Record<string, string> = {
  paytime_pix: "Pagamento instantâneo via QR Code PIX. Renovação manual (envia QR por WhatsApp/email).",
  paytime_card: "Cartão de crédito com tokenização para cobrança automática na renovação.",
  stripe_card: "Cartão via Stripe Checkout. Gerenciamento automático de assinaturas.",
};

function GatewaySettingsPanel() {
  const utils = trpc.useUtils();
  const { data: gateways, isLoading } = trpc.admin.gateways.getAll.useQuery();
  const toggleMutation = trpc.admin.gateways.toggle.useMutation({
    onSuccess: () => {
      utils.admin.gateways.getAll.invalidate();
      toast.success("Gateway atualizado!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando gateways...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Gateways de Pagamento</h3>
          <p className="text-xs text-muted-foreground">Ative os métodos de pagamento disponíveis para assinatura de planos</p>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {gateways?.map((gw) => {
          const Icon = GATEWAY_ICONS[gw.gateway] || CreditCard;
          const description = GATEWAY_DESCRIPTIONS[gw.gateway] || "";
          const isToggling = toggleMutation.isPending;

          return (
            <div key={gw.gateway} className="px-5 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                gw.enabled ? "bg-green-50" : "bg-muted/50"
              }`}>
                <Icon className={`h-5 w-5 ${gw.enabled ? "text-green-600" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{gw.displayName}</span>
                  {gw.enabled ? (
                    <Badge variant="outline" className="border-green-300 text-green-600 text-[10px] px-1.5 py-0">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] px-1.5 py-0">
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              </div>
              <Switch
                checked={gw.enabled}
                disabled={isToggling}
                onCheckedChange={(checked) => {
                  toggleMutation.mutate({ gateway: gw.gateway, enabled: checked });
                }}
              />
            </div>
          );
        })}

        {(!gateways || gateways.length === 0) && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum gateway configurado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Platform WhatsApp Panel Component ── */
function PlatformWhatsappPanel() {
  const utils = trpc.useUtils();
  const { data: config, isLoading: loadingConfig } = trpc.admin.platformWhatsapp.getConfig.useQuery();
  const { data: statusData, isLoading: loadingStatus, refetch: refetchStatus } = trpc.admin.platformWhatsapp.getStatus.useQuery(undefined, {
    refetchInterval: (query) => {
      const d = query.state.data as any;
      // Poll every 3s while connecting (waiting for QR scan), stop when connected
      if (d?.status === 'connecting') return 3000;
      return false;
    },
  });

  const connectMutation = trpc.admin.platformWhatsapp.connect.useMutation({
    onSuccess: () => {
      utils.admin.platformWhatsapp.getConfig.invalidate();
      utils.admin.platformWhatsapp.getStatus.invalidate();
      toast.success("Conexão iniciada! Escaneie o QR Code.");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const disconnectMutation = trpc.admin.platformWhatsapp.disconnect.useMutation({
    onSuccess: () => {
      utils.admin.platformWhatsapp.getConfig.invalidate();
      utils.admin.platformWhatsapp.getStatus.invalidate();
      toast.success("WhatsApp desconectado.");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [showTest, setShowTest] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const sendTestMutation = trpc.admin.platformWhatsapp.sendTest.useMutation({
    onSuccess: () => toast.success("Mensagem de teste enviada!"),
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const updateTemplatesMutation = trpc.admin.platformWhatsapp.updateTemplates.useMutation({
    onSuccess: () => {
      utils.admin.platformWhatsapp.getConfig.invalidate();
      toast.success("Templates atualizados com sucesso!");
    },
    onError: (err: any) => toast.error("Erro ao salvar templates: " + err.message),
  });

  // Template form state
  const [templateForms, setTemplateForms] = useState<Record<string, string>>({});
  const [templateDirty, setTemplateDirty] = useState(false);

  // Initialize template forms when config loads
  const initTemplates = () => {
    if (!config) return;
    setTemplateForms({
      templateRenewalPix: config.templateRenewalPix || "",
      templateRenewalCard: config.templateRenewalCard || "",
      templatePlanActivated: config.templatePlanActivated || "",
      templatePlanExpiring: config.templatePlanExpiring || "",
      templatePlanDeactivated: config.templatePlanDeactivated || "",
    });
    setTemplateDirty(false);
  };

  const TEMPLATE_CONFIGS = [
    {
      key: "templateRenewalPix",
      label: "Cobrança PIX (Renovação)",
      description: "Enviada quando o plano vence e precisa de novo pagamento PIX",
      variables: ["{{establishmentName}}", "{{planName}}", "{{amount}}", "{{dueDate}}", "{{pixEmv}}", "{{pixKey}}"],
      defaultText: `Olá! 👋\n\n*{{establishmentName}}*, sua assinatura do plano *{{planName}}* vence em *{{dueDate}}*.\n\n💰 Valor: *R$ {{amount}}*\n\n📱 Pague via PIX usando o código abaixo:\n\n\`\`\`{{pixEmv}}\`\`\`\n\nCopie o código acima e cole no app do seu banco.\n\nQualquer dúvida, estamos à disposição! 😊\n\n*Mindi - Cardápio Digital*`,
    },
    {
      key: "templateRenewalCard",
      label: "Cartão Declinado",
      description: "Enviada quando a cobrança automática do cartão falha",
      variables: ["{{establishmentName}}", "{{planName}}", "{{amount}}", "{{dueDate}}"],
      defaultText: `Olá! ⚠️\n\n*{{establishmentName}}*, não conseguimos processar a cobrança do seu plano *{{planName}}*.\n\n💳 Valor: *R$ {{amount}}*\n📅 Vencimento: *{{dueDate}}*\n\nPor favor, atualize seus dados de pagamento no painel para evitar a desativação do plano.\n\n*Mindi - Cardápio Digital*`,
    },
    {
      key: "templatePlanActivated",
      label: "Plano Ativado",
      description: "Enviada quando o pagamento é confirmado e o plano é ativado",
      variables: ["{{establishmentName}}", "{{planName}}", "{{expiresAt}}"],
      defaultText: `Olá! 🎉\n\n*{{establishmentName}}*, seu plano *{{planName}}* foi ativado com sucesso!\n\n📅 Válido até: *{{expiresAt}}*\n\nAproveite todos os recursos! 🚀\n\n*Mindi - Cardápio Digital*`,
    },
    {
      key: "templatePlanExpiring",
      label: "Plano Expirando",
      description: "Enviada como lembrete antes do plano vencer",
      variables: ["{{establishmentName}}", "{{planName}}", "{{dueDate}}"],
      defaultText: `Olá! ⏰\n\n*{{establishmentName}}*, seu plano *{{planName}}* vence em *{{dueDate}}*.\n\nRenove para continuar aproveitando todos os recursos!\n\n*Mindi - Cardápio Digital*`,
    },
    {
      key: "templatePlanDeactivated",
      label: "Plano Desativado",
      description: "Enviada quando o plano é desativado por falta de pagamento",
      variables: ["{{establishmentName}}", "{{planName}}"],
      defaultText: `Olá! ⚠️\n\n*{{establishmentName}}*, infelizmente seu plano *{{planName}}* foi desativado por falta de pagamento.\n\nPara reativar, acesse o painel e escolha um plano.\n\nQualquer dúvida, estamos à disposição! 😊\n\n*Mindi - Cardápio Digital*`,
    },
  ] as const;

  function handleTemplateChange(key: string, value: string) {
    setTemplateForms(prev => ({ ...prev, [key]: value }));
    setTemplateDirty(true);
  }

  function handleResetTemplate(key: string) {
    const tpl = TEMPLATE_CONFIGS.find(t => t.key === key);
    if (tpl) {
      setTemplateForms(prev => ({ ...prev, [key]: "" }));
      setTemplateDirty(true);
    }
  }

  function handleSaveTemplates() {
    updateTemplatesMutation.mutate({
      templateRenewalPix: templateForms.templateRenewalPix || null,
      templateRenewalCard: templateForms.templateRenewalCard || null,
      templatePlanActivated: templateForms.templatePlanActivated || null,
      templatePlanExpiring: templateForms.templatePlanExpiring || null,
      templatePlanDeactivated: templateForms.templatePlanDeactivated || null,
    });
    setTemplateDirty(false);
  }

  function getPreviewText(key: string) {
    const tpl = TEMPLATE_CONFIGS.find(t => t.key === key);
    if (!tpl) return "";
    let text = templateForms[key] || tpl.defaultText;
    text = text.replace(/{{establishmentName}}/g, "Pizzaria do João");
    text = text.replace(/{{planName}}/g, "Pro");
    text = text.replace(/{{amount}}/g, "159,00");
    text = text.replace(/{{dueDate}}/g, "15/06/2026");
    text = text.replace(/{{expiresAt}}/g, "15/07/2026");
    text = text.replace(/{{pixEmv}}/g, "00020126580014br.gov.bcb.pix...");
    text = text.replace(/{{pixKey}}/g, "pix@mindi.com.br");
    return text;
  }

  const status = statusData?.status || config?.status || "disconnected";
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const qrCode = statusData?.qrcode || config?.lastQrCode;

  if (loadingConfig) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando WhatsApp...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isConnected ? "bg-green-50" : "bg-emerald-50"
        }`}>
          <MessageSquare className={`h-4 w-4 ${
            isConnected ? "text-green-600" : "text-emerald-600"
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">WhatsApp da Plataforma</h3>
          <p className="text-xs text-muted-foreground">Conecte o WhatsApp da Mindi para enviar cobranças e notificações</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Badge variant="outline" className="border-green-300 text-green-600 text-[10px] px-1.5 py-0">
              Conectado
            </Badge>
          )}
          {isConnecting && (
            <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px] px-1.5 py-0">
              Aguardando
            </Badge>
          )}
          {!isConnected && !isConnecting && (
            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] px-1.5 py-0">
              Desconectado
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isConnected ? (
          /* Connected state */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {statusData?.name || config?.connectedName || "WhatsApp Mindi"}
                </p>
                <p className="text-xs text-green-600">
                  {statusData?.phone || config?.connectedPhone || "Conectado"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unplug className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">Desconectar</span>
              </Button>
            </div>

            {/* Test message & Templates toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTest(!showTest)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Send className="h-3 w-3" />
                Mensagem de teste
              </button>
              <button
                onClick={() => { setShowTemplates(!showTemplates); if (!showTemplates) initTemplates(); }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <FileEdit className="h-3 w-3" />
                Templates de cobrança
                {showTemplates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
            {showTest && (
                <div className="mt-3 space-y-2 p-3 bg-muted/30 rounded-lg">
                  <Input
                    placeholder="Número (ex: 5541999999999)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Mensagem de teste"
                    value={testMsg}
                    onChange={(e) => setTestMsg(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!testPhone || !testMsg) return toast.error("Preencha todos os campos");
                      sendTestMutation.mutate({ phone: testPhone, message: testMsg });
                    }}
                    disabled={sendTestMutation.isPending}
                    className="h-7 text-xs"
                  >
                    {sendTestMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Enviar
                  </Button>
                </div>
              )}

            {/* Templates editing section */}
            {showTemplates && (
              <div className="mt-4 space-y-3 p-4 bg-muted/20 rounded-xl border border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">Templates de Mensagem</h4>
                  </div>
                  {templateDirty && (
                    <Button
                      size="sm"
                      onClick={handleSaveTemplates}
                      disabled={updateTemplatesMutation.isPending}
                      className="h-7 text-xs gap-1"
                    >
                      {updateTemplatesMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Salvar Templates
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Personalize as mensagens enviadas por WhatsApp. Use as variáveis entre {"{{}}"} para inserir dados dinâmicos. Deixe vazio para usar o template padrão.
                </p>

                {TEMPLATE_CONFIGS.map((tpl) => (
                  <Collapsible key={tpl.key}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-background rounded-lg border border-border/40 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{tpl.label}</span>
                        {templateForms[tpl.key] ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-300 text-blue-600">Personalizado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted-foreground/30 text-muted-foreground">Padrão</Badge>
                        )}
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      <p className="text-[11px] text-muted-foreground px-1">{tpl.description}</p>
                      <div className="flex flex-wrap gap-1 px-1">
                        {tpl.variables.map(v => (
                          <button
                            key={v}
                            onClick={() => {
                              const current = templateForms[tpl.key] || "";
                              handleTemplateChange(tpl.key, current + v);
                            }}
                            className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors font-mono"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={templateForms[tpl.key] || ""}
                        onChange={(e) => handleTemplateChange(tpl.key, e.target.value)}
                        placeholder={tpl.defaultText.replace(/\\n/g, "\n").substring(0, 100) + "..."}
                        className="min-h-[120px] text-xs font-mono resize-y"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] gap-1"
                          onClick={() => handleResetTemplate(tpl.key)}
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Restaurar padrão
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] gap-1"
                          onClick={() => setPreviewTemplate(previewTemplate === tpl.key ? null : tpl.key)}
                        >
                          <Eye className="h-2.5 w-2.5" />
                          {previewTemplate === tpl.key ? "Ocultar preview" : "Preview"}
                        </Button>
                      </div>
                      {previewTemplate === tpl.key && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-[10px] font-medium text-green-700 mb-1.5">Preview (dados de exemplo):</p>
                          <p className="text-xs text-green-800 whitespace-pre-wrap leading-relaxed">
                            {getPreviewText(tpl.key)}
                          </p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        ) : isConnecting && qrCode ? (
          /* QR Code state */
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Escaneie o QR Code abaixo com o WhatsApp da Mindi
            </p>
            <div className="bg-white p-3 rounded-xl shadow-sm border">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-56 h-56 object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
              <span className="text-xs text-muted-foreground">Aguardando leitura do QR Code...</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStatus()}
              disabled={loadingStatus}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingStatus ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        ) : (
          /* Disconnected state */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">WhatsApp não conectado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Conecte o WhatsApp da Mindi para enviar cobranças de planos automaticamente
              </p>
            </div>
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Conectar WhatsApp
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPlanos() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.plans.getAll.useQuery();

  const updateDisplayNameMutation = trpc.admin.plans.updateDisplayName.useMutation({
    onSuccess: () => {
      utils.admin.plans.getAll.invalidate();
      toast.success("Nome do plano atualizado!");
    },
    onError: (err: any) => toast.error("Erro ao atualizar nome: " + err.message),
  });

  const updatePriceMutation = trpc.admin.plans.updatePrice.useMutation({
    onSuccess: () => {
      utils.admin.plans.getAll.invalidate();
      toast.success("Preço atualizado com sucesso!");
    },
    onError: (err: any) => toast.error("Erro ao atualizar preço: " + err.message),
  });

  const addFeatureMutation = trpc.admin.plans.addFeature.useMutation({
    onSuccess: () => {
      utils.admin.plans.getAll.invalidate();
      toast.success("Recurso adicionado!");
    },
    onError: (err: any) => toast.error("Erro ao adicionar recurso: " + err.message),
  });

  const updateFeatureMutation = trpc.admin.plans.updateFeature.useMutation({
    onSuccess: () => {
      utils.admin.plans.getAll.invalidate();
      toast.success("Recurso atualizado!");
    },
    onError: (err: any) => toast.error("Erro ao atualizar recurso: " + err.message),
  });

  const deleteFeatureMutation = trpc.admin.plans.deleteFeature.useMutation({
    onSuccess: () => {
      utils.admin.plans.getAll.invalidate();
      toast.success("Recurso removido!");
    },
    onError: (err: any) => toast.error("Erro ao remover recurso: " + err.message),
  });

  const reorderFeaturesMutation = trpc.admin.plans.reorderFeatures.useMutation({
    onSuccess: () => {
      utils.admin.plans.getAll.invalidate();
    },
    onError: (err: any) => toast.error("Erro ao reordenar recursos: " + err.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceForm, setPriceForm] = useState({ monthly: "", annual: "" });
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const [featureText, setFeatureText] = useState("");
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState("");

  const pricesMap = new Map<string, { monthlyPriceCents: number; annualPriceCents: number; displayName?: string | null }>();
  const featuresMap = new Map<string, Array<{ id: number; text: string; sortOrder: number }>>();

  if (data) {
    for (const p of data.prices) {
      pricesMap.set(p.planId, { monthlyPriceCents: p.monthlyPriceCents, annualPriceCents: p.annualPriceCents, displayName: (p as any).displayName });
    }
    for (const f of data.features) {
      if (!featuresMap.has(f.planId)) featuresMap.set(f.planId, []);
      featuresMap.get(f.planId)!.push({ id: f.id, text: f.text, sortOrder: f.sortOrder });
    }
    featuresMap.forEach((feats) => {
      feats.sort((a: { id: number; text: string; sortOrder: number }, b: { id: number; text: string; sortOrder: number }) => a.sortOrder - b.sortOrder);
    });
  }

  function openPlan(planId: string) {
    setSelectedPlan(planId);
    setSheetOpen(true);
    setEditingPrice(false);
    setEditingFeature(null);
    setAddingFeature(false);
    setEditingName(false);
  }

  function closePlan() {
    setSheetOpen(false);
    setSelectedPlan(null);
    setEditingPrice(false);
    setEditingFeature(null);
    setAddingFeature(false);
    setEditingName(false);
  }

  function startEditName() {
    if (!selectedPlan) return;
    const price = pricesMap.get(selectedPlan);
    const config = PLAN_CONFIG[selectedPlan];
    setNameForm(price?.displayName || config?.name || selectedPlan);
    setEditingName(true);
  }

  function saveName() {
    if (!selectedPlan || !nameForm.trim()) return;
    updateDisplayNameMutation.mutate({
      planId: selectedPlan,
      displayName: nameForm.trim(),
    });
    setEditingName(false);
  }

  function startEditPrice() {
    if (!selectedPlan) return;
    const price = pricesMap.get(selectedPlan);
    setPriceForm({
      monthly: price ? formatCents(price.monthlyPriceCents) : "0,00",
      annual: price ? formatCents(price.annualPriceCents) : "0,00",
    });
    setEditingPrice(true);
  }

  function savePrice() {
    if (!selectedPlan) return;
    updatePriceMutation.mutate({
      planId: selectedPlan,
      monthlyPriceCents: parseBRL(priceForm.monthly),
      annualPriceCents: parseBRL(priceForm.annual),
    });
    setEditingPrice(false);
  }

  function startEditFeature(featureId: number, currentText: string) {
    setEditingFeature(featureId);
    setFeatureText(currentText);
  }

  function saveFeature(featureId: number) {
    if (!featureText.trim()) return;
    updateFeatureMutation.mutate({ id: featureId, text: featureText.trim() });
    setEditingFeature(null);
  }

  function confirmAddFeature() {
    if (!selectedPlan || !newFeatureText.trim()) return;
    const features = featuresMap.get(selectedPlan) || [];
    const maxSort = features.length > 0 ? Math.max(...features.map(f => f.sortOrder)) : -1;
    addFeatureMutation.mutate({
      planId: selectedPlan,
      text: newFeatureText.trim(),
      sortOrder: maxSort + 1,
    });
    setAddingFeature(false);
    setNewFeatureText("");
  }

  const selConfig = selectedPlan ? PLAN_CONFIG[selectedPlan] : null;
  const selPrice = selectedPlan ? pricesMap.get(selectedPlan) : null;
  const selFeatures = selectedPlan ? (featuresMap.get(selectedPlan) || []) : [];
  const sortableIds = useMemo(() => selFeatures.map(f => `feature-${f.id}`), [selFeatures]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedPlan) return;

    const oldIndex = selFeatures.findIndex(f => `feature-${f.id}` === active.id);
    const newIndex = selFeatures.findIndex(f => `feature-${f.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(selFeatures, oldIndex, newIndex);
    reorderFeaturesMutation.mutate({
      planId: selectedPlan,
      featureIds: reordered.map(f => f.id),
    });
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

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Planos & Assinaturas</h1>
            <p className="text-sm text-muted-foreground">Clique em um plano para editar preços e recursos.</p>
          </div>
        </div>

        {/* Plans List */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/30 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div className="col-span-4">Plano</div>
            <div className="col-span-2 text-right">Mensal</div>
            <div className="col-span-2 text-right">Anual</div>
            <div className="col-span-2 text-center">Recursos</div>
            <div className="col-span-2 text-center">Status</div>
          </div>

          {PLAN_ORDER.map((planId) => {
            const config = PLAN_CONFIG[planId];
            if (!config) return null;
            const price = pricesMap.get(planId);
            const features = featuresMap.get(planId) || [];
            const Icon = config.icon;

            return (
              <div
                key={planId}
                onClick={() => openPlan(planId)}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center border-b border-border/30 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors group"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4.5 w-4.5 ${config.textColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{pricesMap.get(planId)?.displayName || config.name}</span>
                      {config.popular && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-300 text-purple-600">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">ID: {planId}</span>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <span className="font-semibold text-foreground text-sm">
                    R$ {price ? formatCents(price.monthlyPriceCents) : "0,00"}
                  </span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>

                <div className="col-span-2 text-right">
                  <span className="font-semibold text-foreground text-sm">
                    R$ {price ? formatCents(price.annualPriceCents) : "0,00"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ano</span>
                </div>

                <div className="col-span-2 text-center">
                  <Badge variant="secondary" className={`${config.badgeBg} ${config.badgeText} text-xs`}>
                    {features.length} recurso{features.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="col-span-2 flex items-center justify-center gap-2">
                  <Badge variant="outline" className="border-green-300 text-green-600 text-xs">
                    Ativo
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Gateway Settings */}
        <GatewaySettingsPanel />

        {/* Platform WhatsApp */}
        <PlatformWhatsappPanel />

        {/* Info Card */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Como funciona</h3>
              <p className="text-sm text-muted-foreground">
                Ao alterar o preço de um plano, o novo valor será utilizado automaticamente nos próximos checkouts.
                Assinantes existentes mantêm o preço atual até a renovação.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Os textos dos recursos são exibidos na página de planos que o restaurante vê.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ative os métodos de pagamento desejados na seção "Gateways de Pagamento" acima.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REDESIGNED SHEET SIDEBAR ===== */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closePlan(); }}>
        <SheetContent
          side="right"
          hideCloseButton
          className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col gap-0"
        >
          {selConfig && selectedPlan && (
            <>
              {/* ── Colored Header ── */}
              <div className={`bg-gradient-to-r ${selConfig.headerGradient} px-6 py-5 relative`}>
                <button
                  onClick={closePlan}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <selConfig.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={nameForm}
                          onChange={(e) => setNameForm(e.target.value)}
                          className="h-9 bg-white/20 border-white/30 text-white placeholder:text-white/50 font-bold text-lg w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveName();
                            if (e.key === "Escape") setEditingName(false);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20" onClick={saveName} disabled={updateDisplayNameMutation.isPending}>
                          {updateDisplayNameMutation.isPending ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 text-white" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20" onClick={() => setEditingName(false)}>
                          <X className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{selPrice?.displayName || selConfig.name}</h2>
                        <button
                          onClick={startEditName}
                          className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                          title="Editar nome"
                        >
                          <Pencil className="h-3 w-3 text-white" />
                        </button>
                        {selConfig.popular && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/25 text-white px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-white/70 mt-0.5">ID: {selectedPlan}</p>
                  </div>
                </div>
              </div>

              {/* ── Scrollable Content ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">

                  {/* ── Prices Section ── */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Preços</h3>
                      </div>
                      {!editingPrice && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 rounded-lg"
                          onClick={startEditPrice}
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                      )}
                    </div>

                    {editingPrice ? (
                      <div className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border/50">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensal (R$)</label>
                          <Input
                            value={priceForm.monthly}
                            onChange={(e) => setPriceForm(prev => ({ ...prev, monthly: e.target.value }))}
                            placeholder="89,00"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Anual total (R$)</label>
                          <Input
                            value={priceForm.annual}
                            onChange={(e) => setPriceForm(prev => ({ ...prev, annual: e.target.value }))}
                            placeholder="890,00"
                            className="h-9"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="h-8 text-xs gap-1" onClick={savePrice} disabled={updatePriceMutation.isPending}>
                            {updatePriceMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Salvar
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingPrice(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Mensal</p>
                          <p className="text-xl font-bold text-foreground">
                            R$ {selPrice ? formatCents(selPrice.monthlyPriceCents) : "0,00"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">por mês</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Anual</p>
                          <p className="text-xl font-bold text-foreground">
                            R$ {selPrice ? formatCents(selPrice.annualPriceCents) : "0,00"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">por ano</p>
                        </div>
                        {selPrice && selPrice.annualPriceCents > 0 && (
                          <div className="col-span-2 bg-emerald-50 rounded-xl px-4 py-2.5 flex items-center justify-between border border-emerald-100">
                            <span className="text-xs text-emerald-700">Equivalente mensal no anual</span>
                            <span className="text-sm font-bold text-emerald-700">
                              R$ {formatCents(Math.round(selPrice.annualPriceCents / 12))}/mês
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Divider ── */}
                  <div className="border-t border-border/50" />

                  {/* ── Features Section ── */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${selConfig.bgColor} flex items-center justify-center`}>
                          <ListChecks className={`h-3.5 w-3.5 ${selConfig.textColor}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Recursos <span className="text-muted-foreground font-normal">({selFeatures.length})</span>
                        </h3>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 rounded-lg"
                        onClick={() => { setAddingFeature(true); setNewFeatureText(""); }}
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar
                      </Button>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                          {selFeatures.map((feature) => (
                            <SortableFeatureItem
                              key={feature.id}
                              feature={feature}
                              bgColor={selConfig.bgColor}
                              textColor={selConfig.textColor}
                              isEditing={editingFeature === feature.id}
                              featureText={featureText}
                              onFeatureTextChange={setFeatureText}
                              onStartEdit={() => startEditFeature(feature.id, feature.text)}
                              onSaveEdit={() => saveFeature(feature.id)}
                              onCancelEdit={() => setEditingFeature(null)}
                              onDelete={() => {
                                if (confirm("Remover este recurso?")) {
                                  deleteFeatureMutation.mutate({ id: feature.id });
                                }
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {selFeatures.length === 0 && !addingFeature && (
                      <div className="text-center py-8">
                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                          <ListChecks className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Nenhum recurso cadastrado</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Clique em "Adicionar" para incluir</p>
                      </div>
                    )}

                    {/* Add Feature Input */}
                    {addingFeature && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2.5 bg-muted/30 rounded-lg border border-border/50">
                        <div className={`w-5 h-5 rounded-full ${selConfig.bgColor} flex items-center justify-center flex-shrink-0 opacity-50`}>
                          <Check className={`h-3 w-3 ${selConfig.textColor}`} />
                        </div>
                        <Input
                          value={newFeatureText}
                          onChange={(e) => setNewFeatureText(e.target.value)}
                          placeholder="Descreva o recurso..."
                          className="h-8 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmAddFeature();
                            if (e.key === "Escape") setAddingFeature(false);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 hover:bg-green-50" onClick={confirmAddFeature}>
                          <Save className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => setAddingFeature(false)}>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer Info ── */}
              <div className="border-t border-border/50 bg-muted/20 px-6 py-4">
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Preços atualizados serão aplicados nos próximos checkouts. Assinantes existentes mantêm o valor atual até a renovação.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPanelLayout>
  );
}
