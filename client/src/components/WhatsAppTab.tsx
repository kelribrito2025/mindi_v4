import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  MessageCircle, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Send,
  FileText,
  Smartphone,
  Unplug,
  BellRing,
  ShoppingBag,
  ChefHat,
  PackageCheck,
  Truck,
  CheckCheck,
  XOctagon,
  CalendarCheck,
  Zap,
  ExternalLink
} from "lucide-react";
import { SectionCard } from "@/components/shared";
import { TemplatesEditor } from "@/components/TemplatesEditor";

interface WhatsAppTabProps {
  hideConnectionCard?: boolean;
  activeSubTab?: "notifications" | "templates";
  showOnlyContent?: boolean;
  showConnectionOnly?: boolean;
}

export function WhatsAppTab({ hideConnectionCard = false, activeSubTab, showOnlyContent = false, showConnectionOnly = false }: WhatsAppTabProps) {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do Cardápio Admin.");
  const [isPolling, setIsPolling] = useState(false);

  // Stores wabaId / phoneNumberId / businessId received from Facebook's postMessage during Embedded Signup
  const embeddedSignupIds = useRef<{ wabaId?: string; phoneNumberId?: string; businessId?: string }>({});
  
  // Get establishment data for restaurant name
  const { data: establishment } = trpc.establishment.get.useQuery();
  
  // Notification settings
  const [requireOrderConfirmation, setRequireOrderConfirmation] = useState(false);
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [notifyOnPreparing, setNotifyOnPreparing] = useState(true);
  const [notifyOnReady, setNotifyOnReady] = useState(true);
  const [notifyOnOutForDelivery, setNotifyOnOutForDelivery] = useState(true);
  const [notifyOnCompleted, setNotifyOnCompleted] = useState(true);
  const [notifyOnCancelled, setNotifyOnCancelled] = useState(true);
  const [notifyOnReservation, setNotifyOnReservation] = useState(false);
  
  // Templates padrão
  const DEFAULT_TEMPLATES = {
    newOrder: `Olá {{customerName}}! 🎉 {{greeting}}!\n\nSeu pedido *{{orderNumber}}* foi recebido com sucesso! ✅\n\n{{itensPedido}}\n\n{{deliveryFee}}\n{{totalPagamento}}\n\n{{customerAddress}}\n{{customerPhone}}\n\nAguarde, em breve começaremos a preparar. 😋\n\n*{{establishmentName}}*`,
    preparing: `👨‍🍳 *{{customerName}},* seu pedido *{{orderNumber}}* está sendo preparado!`,
    ready: `✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{deliveryMessage}}`,
    readyPickup: `✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{pickupMessage}}`,
    completed: `Seu pedido {{orderNumber}} foi finalizado!\n\n📌 Atualização de fidelidade\n\n*+1 carimbo* adicionado ao seu cartão.\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*`,
    cancelled: `Olá *{{customerName}}!*\n\n❌ Infelizmente seu pedido {{orderNumber}} foi cancelado.\n\nMotivo: *{{cancellationReason}}*`,
    reservation: `Olá *{{cliente}}*! \ud83d\udc4b\ud83c\udffb\n\nSua reserva na *Mesa {{mesa}}* foi confirmada!\n\n\ud83d\udcc5 Horário: *{{horario}}*\n\ud83d\udc65 Pessoas: *{{pessoas}}*\n\n⚠️ *Obs:* Em caso de atraso, a mesa poderá ser ocupada.\n\nAguardamos você! \ud83d\ude0a`,
  };
  
  // Templates
  const [templateNewOrder, setTemplateNewOrder] = useState(DEFAULT_TEMPLATES.newOrder);
  const [templatePreparing, setTemplatePreparing] = useState(DEFAULT_TEMPLATES.preparing);
  const [templateReady, setTemplateReady] = useState(DEFAULT_TEMPLATES.ready);
  const [templateReadyPickup, setTemplateReadyPickup] = useState(DEFAULT_TEMPLATES.readyPickup);
  const [templateCompleted, setTemplateCompleted] = useState(DEFAULT_TEMPLATES.completed);
  const [templateCancelled, setTemplateCancelled] = useState(DEFAULT_TEMPLATES.cancelled);
  const [templateReservation, setTemplateReservation] = useState(DEFAULT_TEMPLATES.reservation);
  
  const configQuery = trpc.whatsapp.getConfig.useQuery();
  const metaConfigQuery = trpc.whatsapp.getMetaConfig.useQuery();
  const statusQuery = trpc.whatsapp.getStatus.useQuery(undefined, {
    refetchInterval: isPolling ? 3000 : false,
  });
  
  const saveNotificationsMutation = trpc.whatsapp.saveNotificationSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      configQuery.refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao salvar configurações");
    },
  });
  
  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: (data: { qrcode?: string; status?: string }) => {
      if (data.qrcode) {
        toast.success("QR Code gerado! Escaneie com seu WhatsApp.");
        setIsPolling(true);
      } else if (data.status === 'connected') {
        toast.success("WhatsApp já está conectado!");
      }
      statusQuery.refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao conectar");
    },
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado!");
      setIsPolling(false);
      statusQuery.refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao desconectar");
    },
  });

  // Embedded Signup — API Oficial Meta
  const connectOfficialMutation = trpc.whatsapp.connectOfficial.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp Business conectado via API Oficial!");
      configQuery.refetch();
      statusQuery.refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao conectar via API Oficial");
    },
  });

  const disconnectOfficialMutation = trpc.whatsapp.disconnectOfficial.useMutation({
    onSuccess: () => {
      toast.success("Conta oficial desconectada.");
      configQuery.refetch();
      statusQuery.refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao desconectar");
    },
  });

  // Carrega o Facebook SDK sob demanda (apenas quando o usuário clica em Conectar via Meta)
  const launchEmbeddedSignup = useCallback(() => {
    const appId = metaConfigQuery.data?.appId;
    if (!appId) {
      toast.error("META_APP_ID não configurado. Verifique as variáveis de ambiente.");
      return;
    }

    const configId = metaConfigQuery.data?.configId || '';

    const doLaunch = () => {
      (window as any).FB.login(
        (response: any) => {
          if (response.authResponse?.code) {
            connectOfficialMutation.mutate({
              code: response.authResponse.code,
              wabaId: embeddedSignupIds.current.wabaId,
              phoneNumberId: embeddedSignupIds.current.phoneNumberId,
              businessId: embeddedSignupIds.current.businessId,
            });
            embeddedSignupIds.current = {};
          } else {
            toast.error("Conexão cancelada ou sem permissão.");
          }
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
        }
      );
    };

    if ((window as any).FB) {
      doLaunch();
      return;
    }

    // Injetar SDK pela primeira vez
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      (window as any).FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v22.0',
      });
      doLaunch();
    };
    document.head.appendChild(script);
  }, [connectOfficialMutation, metaConfigQuery.data]);

  // Capture wabaId / phoneNumberId from Facebook's postMessage event (fired before FB.login callback)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'WA_EMBEDDED_SIGNUP' && data?.event === 'FINISH') {
          embeddedSignupIds.current = {
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
            businessId: data.data?.business_id,
          };
        }
      } catch {
        // malformed message — ignore
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendTestMutation = trpc.whatsapp.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Mensagem de teste enviada!");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao enviar mensagem");
    },
  });

  const saveTemplatesMutation = trpc.whatsapp.saveTemplates.useMutation({
    onSuccess: () => {
      toast.success("Templates salvos com sucesso!");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao salvar templates");
    },
  });
  
  // Load config data
  useEffect(() => {
    if (configQuery.data) {
      setRequireOrderConfirmation((configQuery.data as any).requireOrderConfirmation ?? false);
      setNotifyOnNewOrder(configQuery.data.notifyOnNewOrder ?? true);
      setNotifyOnPreparing(configQuery.data.notifyOnPreparing ?? true);
      setNotifyOnReady(configQuery.data.notifyOnReady ?? true);
      setNotifyOnOutForDelivery((configQuery.data as any).notifyOnOutForDelivery ?? true);
      setNotifyOnCompleted(configQuery.data.notifyOnCompleted ?? true);
      setNotifyOnCancelled(configQuery.data.notifyOnCancelled ?? true);
      setNotifyOnReservation((configQuery.data as any).notifyOnReservation ?? false);
      // Usar templates salvos ou manter os padrões
      setTemplateNewOrder(configQuery.data.templateNewOrder || DEFAULT_TEMPLATES.newOrder);
      setTemplatePreparing(configQuery.data.templatePreparing || DEFAULT_TEMPLATES.preparing);
      setTemplateReady(configQuery.data.templateReady || DEFAULT_TEMPLATES.ready);
      setTemplateReadyPickup((configQuery.data as any).templateReadyPickup || DEFAULT_TEMPLATES.readyPickup);
      setTemplateCompleted(configQuery.data.templateCompleted || DEFAULT_TEMPLATES.completed);
      setTemplateCancelled(configQuery.data.templateCancelled || DEFAULT_TEMPLATES.cancelled);
      setTemplateReservation((configQuery.data as any).templateReservation || DEFAULT_TEMPLATES.reservation);
    }
  }, [configQuery.data]);
  
  const utils = trpc.useUtils();

  // Stop polling when connected & force refetch onboarding checklist
  useEffect(() => {
    if (statusQuery.data?.status === 'connected') {
      setIsPolling(false);
      // O getStatus do backend já atualizou o DB com status='connected'.
      // Forçar refetch imediato do checklist (invalidate + refetch para ignorar staleTime).
      // Múltiplas tentativas para garantir que o backend já processou a mudança.
      const timers: ReturnType<typeof setTimeout>[] = [];
      const forceRefresh = () => {
        utils.dashboard.onboardingChecklist.invalidate();
        utils.dashboard.onboardingChecklist.refetch();
        utils.establishment.get.invalidate();
        utils.establishment.get.refetch();
      };
      // Refetch imediato
      forceRefresh();
      // Refetch após 1s (backup)
      timers.push(setTimeout(forceRefresh, 1000));
      // Refetch após 3s (garantia)
      timers.push(setTimeout(forceRefresh, 3000));
      return () => timers.forEach(clearTimeout);
    }
  }, [statusQuery.data?.status]);
  
  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate({
      requireOrderConfirmation: false, // Feature bloqueada temporariamente
      notifyOnNewOrder,
      notifyOnPreparing,
      notifyOnReady,
      notifyOnOutForDelivery,
      notifyOnCompleted,
      notifyOnCancelled,
      notifyOnReservation,
    });
  };

  // Auto-save individual notification toggle
  const autoSaveNotification = (field: string, value: boolean) => {
    const currentSettings = {
      requireOrderConfirmation: false,
      notifyOnNewOrder,
      notifyOnPreparing,
      notifyOnReady,
      notifyOnOutForDelivery,
      notifyOnCompleted,
      notifyOnCancelled,
      notifyOnReservation,
      [field]: value,
    };
    saveNotificationsMutation.mutate(currentSettings);
  };

  const handleToggleNewOrder = (val: boolean) => {
    setNotifyOnNewOrder(val);
    autoSaveNotification('notifyOnNewOrder', val);
  };
  const handleTogglePreparing = (val: boolean) => {
    setNotifyOnPreparing(val);
    autoSaveNotification('notifyOnPreparing', val);
  };
  const handleToggleReady = (val: boolean) => {
    setNotifyOnReady(val);
    autoSaveNotification('notifyOnReady', val);
  };
  const handleToggleOutForDelivery = (val: boolean) => {
    setNotifyOnOutForDelivery(val);
    autoSaveNotification('notifyOnOutForDelivery', val);
  };
  const handleToggleCompleted = (val: boolean) => {
    setNotifyOnCompleted(val);
    autoSaveNotification('notifyOnCompleted', val);
  };
  const handleToggleCancelled = (val: boolean) => {
    setNotifyOnCancelled(val);
    autoSaveNotification('notifyOnCancelled', val);
  };
  const handleToggleReservation = (val: boolean) => {
    setNotifyOnReservation(val);
    autoSaveNotification('notifyOnReservation', val);
  };
  
  const handleConnect = () => {
    connectMutation.mutate();
  };
  
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };
  
  const handleSendTest = () => {
    if (!testPhone) {
      toast.error("Digite um número de telefone");
      return;
    }
    sendTestMutation.mutate({ phone: testPhone, message: testMessage });
  };
  
  const handleSaveTemplates = () => {
    saveTemplatesMutation.mutate({
      templateNewOrder: templateNewOrder || null,
      templatePreparing: templatePreparing || null,
      templateReady: templateReady || null,
      templateReadyPickup: templateReadyPickup || null,
      templateCompleted: templateCompleted || null,
      templateCancelled: templateCancelled || null,
      templateReservation: templateReservation || null,
    });
  };
  
  const status = statusQuery.data?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isOfficialProvider = (configQuery.data as any)?.provider === 'official';
  const officialPhone = (configQuery.data as any)?.connectedPhone;

  return (
    <div className="space-y-6">
      {/* Status Card - oculto quando hideConnectionCard=true */}
      {!hideConnectionCard && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Status da Conexão
            </CardTitle>
            <CardDescription>
              Escolha como conectar seu WhatsApp para enviar notificações automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* ── API Oficial Meta ──────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#1877F2]" />
                <span className="text-sm font-semibold">API Oficial Meta</span>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20">
                  Recomendado
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Conecte diretamente pelo Meta Business — sem dependência de QR Code, contas pessoais ou apps terceiros.
              </p>

              {isOfficialProvider && isConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Conectado via API Oficial</p>
                      {officialPhone && (
                        <p className="text-xs text-muted-foreground">{officialPhone}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectOfficialMutation.mutate()}
                    disabled={disconnectOfficialMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    {disconnectOfficialMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Unplug className="h-4 w-4 mr-1.5" />Desconectar</>}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={launchEmbeddedSignup}
                  disabled={connectOfficialMutation.isPending}
                  className="bg-[#1877F2] hover:bg-[#1665d8] text-white"
                >
                  {connectOfficialMutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Conectando...</>
                    : <><ExternalLink className="h-4 w-4 mr-2" />Entrar com o Facebook</>}
                </Button>
              )}
            </div>

            {/* ── UAZAPI (legado) ───────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Via QR Code (UAZAPI)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Conecta um número pessoal ou comercial via QR Code. Use caso não possua uma conta no Meta Business.
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!isOfficialProvider && isConnected ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Conectado</p>
                        {statusQuery.data?.phone && (
                          <p className="text-xs text-muted-foreground">{statusQuery.data.phone}</p>
                        )}
                      </div>
                    </>
                  ) : !isOfficialProvider && isConnecting ? (
                    <>
                      <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                      <p className="text-sm font-medium text-yellow-600">Aguardando QR Code...</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Desconectado</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => statusQuery.refetch()}
                    disabled={statusQuery.isRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 ${statusQuery.isRefetching ? 'animate-spin' : ''}`} />
                  </Button>

                  {!isOfficialProvider && isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      {disconnectMutation.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Unplug className="h-4 w-4 mr-1.5" />Desconectar</>}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnect}
                      disabled={connectMutation.isPending || isOfficialProvider}
                    >
                      {connectMutation.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><QrCode className="h-4 w-4 mr-1.5" />Gerar QR Code</>}
                    </Button>
                  )}
                </div>
              </div>

              {/* QR Code display */}
              {!isOfficialProvider && (isConnecting || connectMutation.data?.qrcode || statusQuery.data?.qrcode) && !isConnected && (
                <div className="mt-2 flex flex-col items-center">
                  <div className="bg-card p-4 rounded-lg shadow-inner">
                    {(connectMutation.data?.qrcode || statusQuery.data?.qrcode) ? (
                      <img
                        src={connectMutation.data?.qrcode || statusQuery.data?.qrcode}
                        alt="QR Code WhatsApp"
                        className="w-56 h-56"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    Abra o WhatsApp → <strong>Dispositivos conectados</strong> → escaneie o QR Code
                  </p>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Enviar Mensagem de Teste — visível apenas quando conectado */}
      {!hideConnectionCard && isConnected && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Mensagem de Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="test-phone">Número de destino</Label>
              <Input
                id="test-phone"
                placeholder="5511987654321"
                value={testPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="test-message">Mensagem</Label>
              <textarea
                id="test-message"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={testMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestMessage(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSendTest}
              disabled={sendTestMutation.isPending}
            >
              {sendTestMutation.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Send className="h-4 w-4 mr-2" />}
              Enviar Teste
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Se showConnectionOnly, não renderiza mais nada */}
      {showConnectionOnly && null}

      {/* Modo showOnlyContent - renderiza apenas o conteúdo da aba selecionada */}
      {!showConnectionOnly && showOnlyContent && activeSubTab === "notifications" && (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Coluna esquerda - 40% - Confirmação via Botões */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5 self-start">
            <SectionCard title="Confirmação via Botões" description="Confirmação interativa antes de preparar" icon={<Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />} iconBg="bg-amber-100 dark:bg-amber-500/15">
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Enviar botões interativos para o cliente confirmar ou cancelar o pedido antes de começar a preparar
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Ativar confirmação</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={false} disabled />
                    <span className="text-xs text-muted-foreground italic">Indisponível</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Mapa de Mesas — Reservas */}
            <SectionCard title="Mapa de Mesas — Reservas" description="Notificações relacionadas às reservas feitas no mapa de mesas" icon={<CalendarCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />} iconBg="bg-indigo-100 dark:bg-indigo-500/15">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Confirmação de Reserva</Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar confirmação por WhatsApp quando o cliente reservar uma mesa pelo mapa de mesas
                  </p>
                </div>
                <Switch
                  checked={notifyOnReservation}
                  onCheckedChange={handleToggleReservation}
                />
              </div>
            </SectionCard>
          </div>

          {/* Coluna direita - 60% - Notificações de Status */}
          <div className="w-full lg:flex-1 space-y-5">
            <SectionCard title="Notificações de Status" description="Configure quando enviar mensagens automáticas" icon={<BellRing className="h-5 w-5 text-primary dark:text-primary" />} iconBg="bg-primary/10 dark:bg-primary/15">
              <div className="space-y-3">
                {/* Novo Pedido */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-green-100 dark:bg-green-500/15 rounded-lg">
                      <ShoppingBag className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Novo Pedido</Label>
                      <p className="text-xs text-muted-foreground">Enviar quando um novo pedido for recebido</p>
                    </div>
                  </div>
                  <Switch checked={notifyOnNewOrder} onCheckedChange={handleToggleNewOrder} />
                </div>

                {/* Preparando */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-500/15 rounded-lg">
                      <ChefHat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Preparando</Label>
                      <p className="text-xs text-muted-foreground">Enviar quando o pedido começar a ser preparado</p>
                    </div>
                  </div>
                  <Switch checked={notifyOnPreparing} onCheckedChange={handleTogglePreparing} />
                </div>

                {/* Pronto */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                      <PackageCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Pronto</Label>
                      <p className="text-xs text-muted-foreground">Enviar quando o pedido estiver pronto</p>
                    </div>
                  </div>
                  <Switch checked={notifyOnReady} onCheckedChange={handleToggleReady} />
                </div>

                {/* Saiu para Entrega */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-500/15 rounded-lg">
                      <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Saiu para Entrega</Label>
                      <p className="text-xs text-muted-foreground">Enviar quando o pedido sair para entrega</p>
                    </div>
                  </div>
                  <Switch checked={notifyOnOutForDelivery} onCheckedChange={handleToggleOutForDelivery} />
                </div>

                {/* Finalizado */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/15 rounded-lg">
                      <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Finalizado</Label>
                      <p className="text-xs text-muted-foreground">Enviar quando o pedido for entregue/retirado</p>
                    </div>
                  </div>
                  <Switch checked={notifyOnCompleted} onCheckedChange={handleToggleCompleted} />
                </div>

                {/* Cancelado */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-red-100 dark:bg-red-500/15 rounded-lg">
                      <XOctagon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Cancelado</Label>
                      <p className="text-xs text-muted-foreground">Enviar quando o pedido for cancelado</p>
                    </div>
                  </div>
                  <Switch checked={notifyOnCancelled} onCheckedChange={handleToggleCancelled} />
                </div>
              </div>
            </SectionCard>


          </div>
        </div>
      )}
      
      {!showConnectionOnly && showOnlyContent && activeSubTab === "templates" && (
        <TemplatesEditor
          templateNewOrder={templateNewOrder}
          setTemplateNewOrder={setTemplateNewOrder}
          templatePreparing={templatePreparing}
          setTemplatePreparing={setTemplatePreparing}
          templateReady={templateReady}
          setTemplateReady={setTemplateReady}
          templateReadyPickup={templateReadyPickup}
          setTemplateReadyPickup={setTemplateReadyPickup}
          templateCompleted={templateCompleted}
          setTemplateCompleted={setTemplateCompleted}
          templateCancelled={templateCancelled}
          setTemplateCancelled={setTemplateCancelled}
          templateReservation={templateReservation}
          setTemplateReservation={setTemplateReservation}
          onSave={handleSaveTemplates}
          isSaving={saveTemplatesMutation.isPending}
          defaultTemplates={DEFAULT_TEMPLATES}
          restaurantName={establishment?.name}
          restaurantLogo={establishment?.logo}
          enabledNotifications={{
            notifyOnNewOrder,
            notifyOnPreparing,
            notifyOnReady,
            notifyOnOutForDelivery,
            notifyOnCompleted,
            notifyOnCancelled,
            notifyOnReservation,
          }}
        />
      )}
      
      {/* Modo normal com abas internas */}
      {!showConnectionOnly && !showOnlyContent && (
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Notificações Automáticas</CardTitle>
              <CardDescription>
                Configure quando enviar mensagens automáticas para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Confirmação de Pedido com Botões */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                        📱 Confirmação via Botões
                      </Label>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Enviar botões interativos para o cliente confirmar ou cancelar o pedido antes de começar a preparar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={false}
                        disabled
                      />
                      <span className="text-xs text-muted-foreground italic">Indisponível</span>
                    </div>
                  </div>
                  {false && (
                    <div className="mt-3 p-3 bg-card rounded-md border border-amber-100 dark:border-amber-800/30">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                        <strong>Como funciona:</strong>
                      </p>
                      <ol className="text-xs text-amber-600 dark:text-amber-400 list-decimal list-inside space-y-1">
                        <li>Cliente faz o pedido no cardápio</li>
                        <li>Recebe mensagem com botões: "✅ Ok, pode fazer" ou "❌ Não quero mais"</li>
                        <li>Se confirmar, o pedido aparece na página de Pedidos</li>
                        <li>Se cancelar, o pedido é automaticamente cancelado</li>
                      </ol>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Notificações de Status</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novo Pedido</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando um novo pedido for recebido
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnNewOrder}
                    onCheckedChange={setNotifyOnNewOrder}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Preparando</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido começar a ser preparado
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnPreparing}
                    onCheckedChange={setNotifyOnPreparing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pronto</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido estiver pronto
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnReady}
                    onCheckedChange={setNotifyOnReady}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Saiu para Entrega</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido sair para entrega
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnOutForDelivery}
                    onCheckedChange={setNotifyOnOutForDelivery}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Finalizado</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido for entregue/retirado
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnCompleted}
                    onCheckedChange={setNotifyOnCompleted}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cancelado</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido for cancelado
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnCancelled}
                    onCheckedChange={setNotifyOnCancelled}
                  />
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Mapa de Mesas — Reservas</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação de Reserva</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar confirmação por WhatsApp quando o cliente reservar uma mesa pelo mapa de mesas
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnReservation}
                    onCheckedChange={setNotifyOnReservation}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveNotifications}
                disabled={saveNotificationsMutation.isPending}
              >
                {saveNotificationsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <TemplatesEditor
            templateNewOrder={templateNewOrder}
            setTemplateNewOrder={setTemplateNewOrder}
            templatePreparing={templatePreparing}
            setTemplatePreparing={setTemplatePreparing}
            templateReady={templateReady}
            setTemplateReady={setTemplateReady}
            templateReadyPickup={templateReadyPickup}
            setTemplateReadyPickup={setTemplateReadyPickup}
            templateCompleted={templateCompleted}
            setTemplateCompleted={setTemplateCompleted}
            templateCancelled={templateCancelled}
            setTemplateCancelled={setTemplateCancelled}
            templateReservation={templateReservation}
            setTemplateReservation={setTemplateReservation}
            onSave={handleSaveTemplates}
            isSaving={saveTemplatesMutation.isPending}
            defaultTemplates={DEFAULT_TEMPLATES}
            restaurantName={establishment?.name}
            restaurantLogo={establishment?.logo}
            enabledNotifications={{
              notifyOnNewOrder,
              notifyOnPreparing,
              notifyOnReady,
              notifyOnCompleted,
              notifyOnCancelled,
              notifyOnReservation,
            }}
          />
        </TabsContent>

      </Tabs>
      )}
    </div>
  );
}
