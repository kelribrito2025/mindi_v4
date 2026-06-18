import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/shared';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationsTabProps {
  establishmentId: number;
}

export function NotificationsTab({ establishmentId }: NotificationsTabProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Buscar chave pública VAPID
  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    enabled: isSupported,
  });

  // Buscar subscriptions existentes
  const { data: subscriptions, refetch: refetchSubscriptions } = trpc.push.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Mutations
  const subscribeMutation = trpc.push.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      refetchSubscriptions();
      toast.success('Notificações ativadas com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao ativar notificações: ${error.message}`);
    },
  });

  const unsubscribeMutation = trpc.push.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      refetchSubscriptions();
      toast.success('Notificações desativadas');
    },
    onError: (error) => {
      toast.error(`Erro ao desativar notificações: ${error.message}`);
    },
  });

  const sendTestMutation = trpc.push.sendTest.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Notificação de teste enviada! ${result.message}`);
      } else {
        toast.error(result.message || 'Nenhum dispositivo encontrado');
      }
      refetchSubscriptions();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar teste: ${error.message}`);
    },
  });

  // Verificar suporte e estado inicial
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window;

      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Verificar permissão
      setPermission(Notification.permission);

      // Verificar se já existe subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (e) {
        console.error('[Push] Erro ao verificar subscription:', e);
      }

      // Verificar se PWA está instalada
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsPwaInstalled(isStandalone);

      setIsLoading(false);
    };

    checkSupport();

    // Capturar evento de instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Converter chave VAPID de base64 para Uint8Array (Safari compatible)
  const urlBase64ToUint8Array = (base64String: string) => {
    try {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (e) {
      console.error('[Push] Error decoding base64:', e);
      // Return empty array on error to prevent crash
      return new Uint8Array(0);
    }
  };

  // Ativar notificações
  const handleSubscribe = async () => {
    if (!vapidData?.publicKey || !establishmentId) {
      toast.error('Configuração incompleta');
      return;
    }

    setIsLoading(true);

    try {
      // Solicitar permissão
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Permissão para notificações negada');
        setIsLoading(false);
        return;
      }

      // Registrar Service Worker se necessário
      const registration = await navigator.serviceWorker.ready;

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      // Enviar subscription para o servidor
      const subscriptionJSON = subscription.toJSON();

      await subscribeMutation.mutateAsync({
        establishmentId,
        subscription: {
          endpoint: subscriptionJSON.endpoint!,
          keys: {
            p256dh: subscriptionJSON.keys!.p256dh!,
            auth: subscriptionJSON.keys!.auth!,
          },
        },
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('[Push] Erro ao ativar:', error);
      toast.error('Erro ao ativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  // Desativar notificações
  const handleUnsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }
    } catch (error) {
      console.error('[Push] Erro ao desativar:', error);
      toast.error('Erro ao desativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  // Instalar PWA
  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      toast.info('Para instalar, use o menu do navegador > "Adicionar à tela inicial"');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App instalado com sucesso!');
      setIsPwaInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  // Enviar notificação de teste
  const handleSendTest = () => {
    sendTestMutation.mutate({ establishmentId });
  };

  if (isLoading) {
    return (
      <SectionCard title="Notificações Push" description="Carregando...">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SectionCard>
    );
  }

  if (!isSupported) {
    return (
      <SectionCard 
        title="Notificações Push" 
        description="Receba alertas de novos pedidos mesmo com a tela desligada"
      >
        <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Navegador não suportado</p>
            <p className="text-sm text-yellow-700 mt-1">
              Seu navegador não suporta notificações push. Para receber alertas de novos pedidos,
              use um navegador moderno como Chrome, Firefox ou Edge.
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <>
      {/* Status das Notificações */}
      <SectionCard 
        title="Notificações Push" 
        description="Receba alertas de novos pedidos mesmo com a tela desligada"
      >
        <div className="space-y-6">
          {/* Status atual */}
          <div className={cn(
            "flex items-center justify-between p-4 rounded-xl border",
            isSubscribed 
              ? "bg-green-50 border-green-200" 
              : "bg-muted/30 border-border/50"
          )}>
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <div className="p-2 bg-green-100 rounded-lg">
                  <BellRing className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-muted rounded-lg">
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className={cn(
                  "font-medium",
                  isSubscribed ? "text-green-800" : "text-foreground"
                )}>
                  {isSubscribed ? 'Notificações ativadas' : 'Notificações desativadas'}
                </p>
                <p className={cn(
                  "text-sm",
                  isSubscribed ? "text-green-600" : "text-muted-foreground"
                )}>
                  {isSubscribed 
                    ? 'Você receberá alertas de novos pedidos neste dispositivo' 
                    : 'Ative para receber alertas de novos pedidos'}
                </p>
              </div>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleSubscribe();
                } else {
                  handleUnsubscribe();
                }
              }}
              disabled={isLoading || subscribeMutation.isPending || unsubscribeMutation.isPending}
            />
          </div>

          {/* Permissão negada */}
          {permission === 'denied' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-500">Permissão bloqueada</p>
                <p className="text-sm text-red-500 mt-1">
                  As notificações foram bloqueadas no seu navegador. Para ativar, 
                  clique no ícone de cadeado na barra de endereço e permita notificações.
                </p>
              </div>
            </div>
          )}

          {/* Botão de teste */}
          {isSubscribed && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={sendTestMutation.isPending}
                className="flex-1"
              >
                {sendTestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar notificação de teste
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Instalar como App */}
      <SectionCard 
        title="Instalar como App" 
        description="Adicione o painel à tela inicial do seu celular"
      >
        <div className="space-y-4">
          <div className={cn(
            "flex items-center justify-between p-4 rounded-xl border",
            isPwaInstalled 
              ? "bg-green-50 border-green-200" 
              : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center gap-3">
              {isPwaInstalled ? (
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
              )}
              <div>
                <p className={cn(
                  "font-medium",
                  isPwaInstalled ? "text-green-800" : "text-blue-800"
                )}>
                  {isPwaInstalled ? 'App instalado' : 'Instale o app'}
                </p>
                <p className={cn(
                  "text-sm",
                  isPwaInstalled ? "text-green-600" : "text-blue-600"
                )}>
                  {isPwaInstalled 
                    ? 'O painel está instalado como app neste dispositivo' 
                    : 'Acesse mais rápido e receba notificações em segundo plano'}
                </p>
              </div>
            </div>
            {!isPwaInstalled && (
              <Button
                variant="outline"
                onClick={handleInstallPwa}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar
              </Button>
            )}
          </div>

          {!isPwaInstalled && (
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Como instalar:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Chrome/Edge:</strong> Clique nos 3 pontos → "Instalar app"</li>
                  <li><strong>Safari (iOS):</strong> Toque em compartilhar → "Adicionar à Tela de Início"</li>
                  <li><strong>Firefox:</strong> Clique no ícone de casa na barra de endereço</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Dispositivos cadastrados */}
      <SectionCard 
        title="Dispositivos cadastrados" 
        description="Dispositivos que receberão notificações de novos pedidos"
      >
        <div className="space-y-3">
          {!subscriptions || subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum dispositivo cadastrado</p>
              <p className="text-sm">Ative as notificações para receber alertas de novos pedidos</p>
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {sub.userAgent?.includes('Mobile') ? 'Celular' : 'Computador'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cadastrado em {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
                    } catch (e) {
                      // Erro já tratado no mutation
                    }
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {/* Informações sobre notificações */}
      <SectionCard 
        title="Como funcionam as notificações" 
        description="Entenda como receber alertas de novos pedidos"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-700 mb-1">Notificações Push</p>
              <p className="text-blue-600">
                As notificações push funcionam mesmo quando o navegador está fechado ou a tela 
                do celular está desligada. Você receberá um alerta sonoro e visual sempre que 
                um novo pedido chegar.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p><strong>Requisitos:</strong> Navegador moderno (Chrome, Firefox, Edge) com suporte a Service Workers.</p>
            <p><strong>Dica:</strong> Para melhor experiência, instale o app na tela inicial do celular.</p>
            <p><strong>Importante:</strong> Cada dispositivo precisa ativar as notificações separadamente.</p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

export default NotificationsTab;
