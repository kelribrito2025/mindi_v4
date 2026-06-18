import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bot,
  Power,
  PowerOff,
  MessageCircleQuestion,
  ShoppingCart,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/AdminLayout";
import { SectionCard } from "@/components/shared";

export default function BotWhatsApp() {
  const { data: establishment, refetch: refetchEstablishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const botEnabled = establishment?.whatsappBotEnabled ?? false;
  const botOrdersEnabled = establishment?.botOrdersEnabled ?? false;
  const botQuestionsEnabled = establishment?.botQuestionsEnabled ?? true;

  const toggleBotMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      refetchEstablishment();
      toast.success(botEnabled ? "Mindi Bot desativado!" : "Mindi Bot ativado!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao alterar status do bot");
    },
  });

  const toggleFeatureMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      refetchEstablishment();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao alterar configuração");
    },
  });

  const handleToggleOrders = (val: boolean) => {
    if (!estId) return;
    toggleFeatureMutation.mutate({ id: estId, botOrdersEnabled: val });
    toast.success(val ? "Retirar pedidos ativado!" : "Retirar pedidos desativado!");
  };

  const handleToggleQuestions = (val: boolean) => {
    if (!estId) return;
    toggleFeatureMutation.mutate({ id: estId, botQuestionsEnabled: val });
    toast.success(val ? "Responder perguntas ativado!" : "Responder perguntas desativado!");
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header + Banner na mesma linha no desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-7 w-7 text-blue-500" />
              Mindi Bot
            </h1>
            <p className="text-muted-foreground mt-1">
              Atendimento automático via WhatsApp para seus clientes
            </p>
          </div>

          {/* Banner Toggle Card - inline no desktop */}
          <div
            className={cn(
              "relative rounded-xl overflow-hidden border flex-shrink-0",
              botEnabled
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30"
                : "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200/50 dark:border-red-500/30"
            )}
          >
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23${botEnabled ? '16a34a' : 'dc2626'}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)',
                  animation: 'banner-shimmer 3s ease-in-out infinite',
                  animationDelay: '1s'
                }}
              />
            </div>
            
            <div className="relative flex items-center gap-3 px-4 py-3">
              {/* Ícone pulsante */}
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "absolute inset-0 animate-ping rounded-full",
                  botEnabled ? "bg-green-400/30 dark:bg-green-500/20" : "bg-red-400/30 dark:bg-red-500/20"
                )} />
                <div className={cn(
                  "relative p-2 rounded-full",
                  botEnabled ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-500/40"
                )}>
                  {botEnabled ? (
                    <Power className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <PowerOff className="h-5 w-5 text-red-500 dark:text-red-400" />
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight">
                  {botEnabled ? (
                    <>Mindi Bot está <span className="text-green-600 dark:text-green-400">ativo</span></>
                  ) : (
                    <>Mindi Bot está <span className="text-red-500 dark:text-red-400">inativo</span></>
                  )}
                </p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {botEnabled
                    ? "Seus clientes estão sendo atendidos automaticamente via WhatsApp"
                    : "Ative para que seus clientes sejam atendidos automaticamente via WhatsApp"
                  }
                </p>
              </div>

              {/* Action button */}
              <Button
                onClick={() => {
                  if (!estId) return;
                  toggleBotMutation.mutate({ id: estId, whatsappBotEnabled: !botEnabled });
                }}
                disabled={toggleBotMutation.isPending}
                size="sm"
                className={cn(
                  "flex-shrink-0 text-xs h-8 px-4 rounded-lg gap-1.5 font-semibold shadow-sm",
                  botEnabled
                    ? "bg-red-500 hover:bg-red-500 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                {botEnabled ? (
                  <>
                    <PowerOff className="h-3.5 w-3.5" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="h-3.5 w-3.5" />
                    Ativar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Card de Funcionalidades do Bot - estilo Notificações de Status */}
        <SectionCard
          title="Funcionalidades do Bot"
          description="Configure o que o Mindi Bot pode fazer"
          icon={<Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-500/15"
        >
          <div className="space-y-3">
            {/* Responder perguntas */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                  <MessageCircleQuestion className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Responder perguntas</Label>
                  <p className="text-xs text-muted-foreground">Responde dúvidas sobre cardápio, horários, localização e mais</p>
                </div>
              </div>
              <Switch
                checked={botQuestionsEnabled}
                onCheckedChange={handleToggleQuestions}
                disabled={!botEnabled || toggleFeatureMutation.isPending}
              />
            </div>

            {/* Retirar pedidos - desativado (em breve) */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-500/15 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Retirar pedidos</Label>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Em breve</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Permite que o bot colete e crie pedidos pelo WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={false}
                disabled={true}
              />
            </div>
          </div>

          {/* Nota informativa quando bot está desativado */}
          {!botEnabled && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Ative o Mindi Bot acima para poder configurar as funcionalidades.
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
