import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications(establishmentId: number | undefined) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
    error: null,
  });

  // Buscar chave pública VAPID
  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    enabled: state.isSupported,
  });

  // Mutations
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();

  // Verificar suporte e estado inicial
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window;

      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Push notifications não são suportadas neste navegador',
        }));
        return;
      }

      const permission = Notification.permission;
      
      // Verificar se já existe subscription
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (e) {
        console.error('[Push] Erro ao verificar subscription:', e);
      }

      setState(prev => ({
        ...prev,
        isSupported: true,
        isSubscribed,
        permission,
        isLoading: false,
      }));
    };

    checkSupport();
  }, []);

  // Converter chave VAPID de base64 para Uint8Array (Safari compatible)
  const urlBase64ToUint8Array = useCallback((base64String: string) => {
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
  }, []);

  // Solicitar permissão e inscrever
  const subscribe = useCallback(async () => {
    if (!state.isSupported || !vapidData?.publicKey || !establishmentId) {
      console.error('[Push] Não é possível inscrever:', { 
        isSupported: state.isSupported, 
        hasVapidKey: !!vapidData?.publicKey,
        establishmentId 
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission,
          isLoading: false,
          error: 'Permissão para notificações negada',
        }));
        return false;
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

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        isLoading: false,
      }));

      console.log('[Push] Inscrito com sucesso');
      return true;
    } catch (error) {
      console.error('[Push] Erro ao inscrever:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao ativar notificações',
      }));
      return false;
    }
  }, [state.isSupported, vapidData?.publicKey, establishmentId, urlBase64ToUint8Array, subscribeMutation]);

  // Cancelar inscrição
  const unsubscribe = useCallback(async () => {
    if (!state.isSupported) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Cancelar no navegador
        await subscription.unsubscribe();

        // Remover do servidor
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      console.log('[Push] Inscrição cancelada');
      return true;
    } catch (error) {
      console.error('[Push] Erro ao cancelar inscrição:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao desativar notificações',
      }));
      return false;
    }
  }, [state.isSupported, unsubscribeMutation]);

  // Verificar se pode solicitar permissão
  const canRequestPermission = state.isSupported && state.permission === 'default';

  return {
    ...state,
    canRequestPermission,
    subscribe,
    unsubscribe,
  };
}

export default usePushNotifications;
