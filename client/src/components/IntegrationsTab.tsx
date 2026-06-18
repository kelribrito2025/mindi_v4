import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info,
  Link2,
  Unlink,
  Store,
  Save,
  AlertCircle,
  Settings2,
  Bell,
  Zap,
  ArrowUpRight,
  HelpCircle,
  ShieldCheck,
  Send,
  ClipboardPaste,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IfoodMerchantPanel } from "@/components/IfoodMerchantPanel";
import { IfoodCatalogPanel } from "@/components/IfoodCatalogPanel";
import { IfoodDisputesPanel } from "@/components/IfoodDisputesPanel";

// ─── Telegram Card (connected to backend) ──────────────────────────
function TelegramCard({ establishmentId }: { establishmentId: number }) {
  const [telegramStep, setTelegramStep] = useState<"idle" | "connecting">("idle");
  const [chatId, setChatId] = useState("");

  // Buscar configuração do Telegram no backend
  const { data: telegramConfig, isLoading: telegramLoading, refetch: refetchTelegram } =
    trpc.telegram.getConfig.useQuery(
      { establishmentId },
      { enabled: !!establishmentId }
    );

  // Mutations
  const connectMutation = trpc.telegram.connect.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Telegram conectado com sucesso!");
      setTelegramStep("idle");
      setChatId("");
      refetchTelegram();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar Telegram");
    },
  });

  const disconnectMutation = trpc.telegram.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Telegram desconectado");
      setTelegramStep("idle");
      setChatId("");
      refetchTelegram();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar");
    },
  });

  const sendTestMutation = trpc.telegram.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Mensagem de teste enviada! Verifique seu Telegram.");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar teste");
    },
  });

  const toggleMutation = trpc.telegram.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.enabled ? "Notificações ativadas" : "Notificações desativadas");
      refetchTelegram();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar status");
    },
  });

  const handleConnect = () => {
    if (!chatId.trim()) {
      toast.error("Cole o chat_id do Telegram para conectar");
      return;
    }
    connectMutation.mutate({ establishmentId, chatId: chatId.trim() });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate({ establishmentId });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setChatId(text);
      toast.success("Chat ID colado!");
    } catch {
      toast.error("Não foi possível acessar a área de transferência");
    }
  };

  if (telegramLoading) {
    return (
      <SectionCard
        title="Telegram"
        description="Notificações de pedidos"
        icon={<Send className="h-5 w-5 text-[#2AABEE]" />}
        iconBg="bg-sky-100 dark:bg-sky-500/15"
      >
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SectionCard>
    );
  }

  const isConnected = telegramConfig?.enabled && telegramConfig?.chatId;

  // ── Estado: Conectado ──
  if (isConnected) {
    return (
      <SectionCard
        title="Telegram"
        description="Notificações de pedidos"
        icon={<Send className="h-5 w-5 text-[#2AABEE]" />}
        iconBg="bg-sky-100 dark:bg-sky-500/15"
      >
        <div className="space-y-4">
          {/* Badge de status */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-100 dark:bg-green-500/15">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm">Integração Ativa</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Notificações de pedidos ativadas
              </p>
            </div>
            <Switch
              checked={telegramConfig.enabled}
              onCheckedChange={(checked) =>
                toggleMutation.mutate({ establishmentId, enabled: checked })
              }
              disabled={toggleMutation.isPending}
            />
          </div>

          {/* Info do chat conectado */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800">
            <Send className="h-4 w-4 text-[#2AABEE] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs text-sky-700 dark:text-sky-300">
                Chat Conectado
              </p>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                Chat ID: {telegramConfig.chatId}
              </p>
            </div>
            <CheckCircle className="h-4 w-4 text-sky-500 flex-shrink-0" />
          </div>

          {/* Botão enviar teste */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestMutation.mutate({ establishmentId })}
            disabled={sendTestMutation.isPending}
            className="w-full rounded-xl h-9 text-sky-600 hover:text-sky-700 border-sky-200 hover:bg-sky-50"
          >
            {sendTestMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-2" />
            )}
            Enviar Mensagem de Teste
          </Button>

          {/* Botão desconectar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
            className="w-full rounded-xl h-9 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            {disconnectMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Unlink className="h-3.5 w-3.5 mr-2" />
            )}
            Desconectar Telegram
          </Button>
        </div>
      </SectionCard>
    );
  }

  // ── Estado: Conectando (formulário) ──
  if (telegramStep === "connecting") {
    return (
      <SectionCard
        title="Telegram"
        description="Notificações de pedidos"
        icon={<Send className="h-5 w-5 text-[#2AABEE]" />}
        iconBg="bg-sky-100 dark:bg-sky-500/15"
      >
        <div className="space-y-4">
          {/* Botão acessar o bot */}
          <a
            href="https://t.me/Mindi_pedidos_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold text-sm transition-colors"
          >
            <Send className="h-4 w-4" />
            Acessar Bot no Telegram
          </a>

          {/* Instruções */}
          <div className="space-y-2.5">
            {[
              { step: "1", text: "Abra o robô no Telegram" },
              { step: "2", text: 'Clique em "Iniciar" (Start)' },
              { step: "3", text: "Copie o chat_id que o bot enviar" },
              { step: "4", text: "Cole abaixo 👇" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-[#2AABEE]">{item.step}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Campo Chat ID */}
          <div className="space-y-2">
            <Label htmlFor="telegramChatId" className="text-sm font-semibold">
              O seu chat_id do Telegram:
            </Label>
            <div className="relative">
              <Input
                id="telegramChatId"
                placeholder="chat_id"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="rounded-xl h-10 pr-24"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Colar
              </button>
            </div>
          </div>

          {/* Botões Voltar / Conectar */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setTelegramStep("idle"); setChatId(""); }}
              className="rounded-xl h-9 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={!chatId.trim() || connectMutation.isPending}
              className="flex-1 rounded-xl h-9"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </div>
        </div>
      </SectionCard>
    );
  }

  // ── Estado: Idle (não conectado) ──
  return (
    <SectionCard
      title="Telegram"
      description="Notificações de pedidos"
      icon={<Send className="h-5 w-5 text-[#2AABEE]" />}
      iconBg="bg-sky-100 dark:bg-sky-500/15"
    >
      <div className="space-y-4">
        {/* Badge de status */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-500/15">
            <Link2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm">Não Conectado</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receba alertas de pedidos pelo robô do Telegram
            </p>
          </div>
        </div>

        {/* Botão conectar */}
        <Button
          onClick={() => setTelegramStep("connecting")}
          className="w-full rounded-xl h-10 bg-[#2AABEE] hover:bg-[#229ED9] text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Conectar Telegram
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Main IntegrationsTab ───────────────────────────────────────────
export function IntegrationsTab() {
  const [merchantId, setMerchantId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Buscar establishment para obter o ID
  const { data: establishment } = trpc.establishment.get.useQuery();

  // Buscar configuração existente do iFood
  const { data: config, isLoading, refetch } = trpc.ifood.getConfig.useQuery();

  // Atualizar merchantId quando config carregar
  useEffect(() => {
    if (config?.merchantId) {
      setMerchantId(config.merchantId);
    }
  }, [config?.merchantId]);

  // Mutations
  const saveMerchantMutation = trpc.ifood.saveMerchantId.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Conexão estabelecida com sucesso!");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar com iFood");
    }
  });

  const disconnectMutation = trpc.ifood.disconnect.useMutation({
    onSuccess: () => {
      toast.success("iFood desconectado com sucesso");
      setMerchantId("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar");
    }
  });

  const toggleActiveMutation = trpc.ifood.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status alterado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar status");
    }
  });

  const updateAutoAcceptMutation = trpc.ifood.updateAutoAccept.useMutation({
    onSuccess: (data) => {
      toast.success(data.autoAcceptOrders
        ? "Aceite automático ativado com sucesso"
        : "Aceite automático desativado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar aceite automático");
    }
  });

  const handleSaveMerchant = () => {
    if (!merchantId.trim()) {
      toast.error("Informe o Merchant ID da sua loja no iFood");
      return;
    }
    saveMerchantMutation.mutate({ merchantId: merchantId.trim() });
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate({ isActive: !config?.isActive });
  };

  const handleToggleAutoAccept = (autoAcceptOrders: boolean) => {
    updateAutoAcceptMutation.mutate({ autoAcceptOrders });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = config?.isConnected && config?.merchantId;

  return (
    <div className="space-y-8">
      {/* ═══ SEÇÃO IFOOD ═══ */}
      <div>
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Coluna esquerda (40%) - Status e Conexão */}
          <div className="w-full lg:w-[40%] space-y-5">

            {/* Card iFood unificado */}
            <SectionCard
              title="iFood"
              description="Integração com marketplace"
              icon={
                <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              }
              iconBg="bg-red-100 dark:bg-red-500/15"
            >
              <div className="space-y-4">
                {/* Badge de status */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isConnected && config?.isActive
                      ? "bg-green-100 dark:bg-green-500/15"
                      : isConnected
                        ? "bg-yellow-100 dark:bg-yellow-500/15"
                        : "bg-slate-100 dark:bg-slate-500/15"
                  )}>
                    {isConnected && config?.isActive ? (
                      <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : isConnected ? (
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <Link2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {isConnected && config?.isActive
                          ? "Integração Ativa"
                          : isConnected
                            ? "Conectado (Inativo)"
                            : "Não Conectado"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isConnected
                        ? config?.merchantName || `ID: ${config?.merchantId}`
                        : "Configure o Merchant ID da sua loja"}
                    </p>
                  </div>
                  {isConnected && (
                    <Switch
                      checked={config?.isActive || false}
                      onCheckedChange={handleToggleActive}
                      disabled={toggleActiveMutation.isPending}
                    />
                  )}
                </div>

                {/* Info da loja conectada */}
                {isConnected && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <Store className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-green-700 dark:text-green-300">
                        {config.merchantName || "Loja Conectada"}
                      </p>
                      <p className="text-[10px] text-green-600 dark:text-green-400 truncate">
                        {config.merchantId}
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  </div>
                )}

                {/* Botão desconectar */}
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    className="w-full rounded-xl h-9 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="h-3.5 w-3.5 mr-2" />
                    )}
                    Desconectar iFood
                  </Button>
                )}

                {/* Como conectar + Formulário (quando não conectado) */}
                {!isConnected && (
                  <>
                    {/* Separador */}
                    <div className="border-t border-border/50" />

                    {/* Passo a passo */}
                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Como conectar
                      </p>
                      <div className="space-y-2.5">
                        {[
                          { step: "1", text: "Acesse o Portal do Parceiro iFood" },
                          { step: "2", text: "Vá em Configurações da Loja" },
                          { step: "3", text: "Copie o ID da loja (Merchant ID)" },
                          { step: "4", text: "Cole no campo abaixo e conecte" },
                        ].map((item) => (
                          <div key={item.step} className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.step}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{item.text}</span>
                          </div>
                        ))}
                        <a
                          href="https://portal.ifood.com.br"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir Portal do Parceiro iFood
                        </a>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-border/50" />

                    {/* Formulário Merchant ID */}
                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Conectar loja
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="merchantId" className="text-sm font-semibold">Merchant ID *</Label>
                          <Input
                            id="merchantId"
                            placeholder="Ex: 21e5dcf5-2e41-4d15-9564-32b6b5c78a40"
                            value={merchantId}
                            onChange={(e) => setMerchantId(e.target.value)}
                            disabled={saveMerchantMutation.isPending}
                            className="rounded-xl h-10"
                          />
                          <p className="text-xs text-muted-foreground">
                            O Merchant ID é o identificador único da sua loja no iFood
                          </p>
                        </div>

                        {/* Aviso de validação */}
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            O Merchant ID será validado com a API do iFood antes de conectar.
                            Certifique-se de que o ID está correto.
                          </p>
                        </div>

                        <Button
                          onClick={handleSaveMerchant}
                          disabled={saveMerchantMutation.isPending || !merchantId.trim()}
                          className="w-full rounded-xl h-10"
                        >
                          {saveMerchantMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Validando Merchant ID...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Conectar iFood
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Coluna direita (60%) - Opções quando conectado */}
          <div className="flex-1 space-y-5">

            {/* Card Opções (quando conectado) */}
            {isConnected && (
              <SectionCard
                title="Opções"
                description="Configurações da integração"
                icon={<Settings2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
                iconBg="bg-slate-100 dark:bg-slate-500/15"
              >
                <div className="space-y-3">
                  {/* Aceitar pedidos automaticamente */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                        <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Aceitar pedidos automaticamente</p>
                        <p className="text-xs text-muted-foreground">
                          Pedidos serão aceitos automaticamente ao chegar
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="autoAccept"
                      checked={config?.autoAcceptOrders || false}
                      onCheckedChange={handleToggleAutoAccept}
                      disabled={updateAutoAcceptMutation.isPending}
                    />
                  </div>

                  {/* Notificar novos pedidos */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Notificar novos pedidos</p>
                        <p className="text-xs text-muted-foreground">
                          Receber notificação sonora quando chegar pedido do iFood
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="notifyNewOrder"
                      checked={true}
                      disabled
                    />
                  </div>
                </div>
              </SectionCard>
            )}

          </div>
        </div>
      </div>

      {/* ═══ SEÇÃO MERCHANT (quando conectado) ═══ */}
      {isConnected && config?.isActive && (
        <>
          <div className="border-t border-border/50" />
          <IfoodMerchantPanel />
          <div className="border-t border-border/50" />
          <IfoodCatalogPanel />
          <div className="border-t border-border/50" />
          <IfoodDisputesPanel />
        </>
      )}

      {/* Separador visual */}
      <div className="border-t border-border/50" />

      {/* ═══ SEÇÃO TELEGRAM ═══ */}
      <div>
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[40%]">
            <TelegramCard establishmentId={establishment?.id || 0} />
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
