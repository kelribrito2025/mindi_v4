import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook que automaticamente registra a Push Subscription no servidor
 * quando o usuário já concedeu permissão de notificação.
 * 
 * Se a permissão ainda não foi concedida, solicita automaticamente.
 * Roda uma vez ao montar e sempre que o establishmentId mudar.
 */
export function usePushAutoRegister(establishmentId: number | undefined) {
  const hasRegistered = useRef(false);
  
  // Buscar chave pública VAPID
  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    enabled: !!establishmentId,
    staleTime: Infinity,
  });

  // Mutation para registrar subscription
  const subscribeMutation = trpc.push.subscribe.useMutation({
    onSuccess: () => {
      console.log('[PushAutoRegister] Subscription registrada com sucesso no servidor');
    },
    onError: (error) => {
      console.error('[PushAutoRegister] Erro ao registrar subscription:', error.message);
    },
  });

  useEffect(() => {
    if (!establishmentId || !vapidData?.publicKey || hasRegistered.current) return;
    
    const isSupported = 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;

    if (!isSupported) {
      console.log('[PushAutoRegister] Push não suportado neste navegador');
      return;
    }

    const registerPush = async () => {
      try {
        // Verificar permissão atual
        let permission = Notification.permission;
        
        // Se ainda é 'default', solicitar permissão
        if (permission === 'default') {
          console.log('[PushAutoRegister] Solicitando permissão de notificação...');
          permission = await Notification.requestPermission();
        }
        
        if (permission !== 'granted') {
          console.log('[PushAutoRegister] Permissão de notificação negada');
          return;
        }

        // Aguardar service worker ficar pronto
        const registration = await navigator.serviceWorker.ready;
        
        // Verificar se já existe uma subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Criar nova subscription
          console.log('[PushAutoRegister] Criando nova subscription...');
          const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          });
        }

        // Enviar subscription para o servidor
        const subscriptionJSON = subscription.toJSON();
        
        if (subscriptionJSON.endpoint && subscriptionJSON.keys?.p256dh && subscriptionJSON.keys?.auth) {
          await subscribeMutation.mutateAsync({
            establishmentId,
            subscription: {
              endpoint: subscriptionJSON.endpoint,
              keys: {
                p256dh: subscriptionJSON.keys.p256dh,
                auth: subscriptionJSON.keys.auth,
              },
            },
            userAgent: navigator.userAgent,
          });
          
          hasRegistered.current = true;
          console.log('[PushAutoRegister] Push subscription registrada automaticamente');
        }
      } catch (error) {
        console.error('[PushAutoRegister] Erro ao registrar push:', error);
      }
    };

    // Pequeno delay para não competir com o carregamento inicial
    const timer = setTimeout(registerPush, 3000);
    
    return () => clearTimeout(timer);
  }, [establishmentId, vapidData?.publicKey]);
}

// Converter chave VAPID de base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
    console.error('[PushAutoRegister] Error decoding base64:', e);
    return new Uint8Array(0);
  }
}
