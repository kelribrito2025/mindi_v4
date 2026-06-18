import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";

const PREFERENCE_CHANGED_EVENT = "mindi-preference-changed";

type PreferenceChangedDetail = {
  cacheKey: string;
  value: string | null;
};

function notifyPreferenceChanged(cacheKey: string, value: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PreferenceChangedDetail>(PREFERENCE_CHANGED_EVENT, {
    detail: { cacheKey, value },
  }));
}

/**
 * Hook para gerenciar preferências do usuário persistidas no banco de dados.
 * Substitui o uso de localStorage para banners, modais e tooltips dismissíveis.
 * 
 * Usa localStorage como cache local para evitar "flash" no carregamento,
 * e sincroniza com o banco de dados em background.
 * 
 * @param key - Chave da preferência (ex: "modal_abc_seen")
 * @param establishmentId - ID do estabelecimento (opcional, para preferências por estabelecimento)
 * @returns [value, setValue, isLoading] - Valor atual, setter, e estado de carregamento
 * 
 * @example
 * const [dismissed, setDismissed] = usePreference('modal_abc_seen');
 * // ou com establishmentId:
 * const [dismissed, setDismissed] = usePreference('onboarding_modal_dismissed_new', establishmentId);
 */
export function usePreference(
  key: string,
  establishmentId?: number | null
): [string | null, (value: string) => void, boolean] {
  // Cache key para localStorage (prefixo para evitar conflitos)
  const cacheKey = `pref_${key}${establishmentId ? `_${establishmentId}` : ""}`;

  // Estado local inicializado do cache localStorage
  const [localValue, setLocalValue] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(cacheKey);
    } catch {
      return null;
    }
  });

  // Track se já sincronizou com o servidor
  const hasSynced = useRef(false);

  // Query para buscar do banco (só roda se o usuário estiver logado)
  const { data, isLoading } = trpc.preferences.get.useQuery(
    { key, establishmentId: establishmentId ?? undefined },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Sincronizar valor do servidor com o estado local
  useEffect(() => {
    if (data !== undefined && !hasSynced.current) {
      hasSynced.current = true;
      const serverValue = data.value;
      if (serverValue !== localValue) {
        setLocalValue(serverValue);
        // Atualizar cache local
        try {
          if (serverValue !== null) {
            localStorage.setItem(cacheKey, serverValue);
          } else {
            localStorage.removeItem(cacheKey);
          }
          notifyPreferenceChanged(cacheKey, serverValue);
        } catch {}
      }
    }
  }, [data, cacheKey, localValue]);

  // Sincronizar alterações otimistas feitas por outros componentes na mesma aba.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePreferenceChanged = (event: Event) => {
      const detail = (event as CustomEvent<PreferenceChangedDetail>).detail;
      if (detail?.cacheKey === cacheKey) {
        setLocalValue(detail.value);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === cacheKey) {
        setLocalValue(event.newValue);
      }
    };

    window.addEventListener(PREFERENCE_CHANGED_EVENT, handlePreferenceChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PREFERENCE_CHANGED_EVENT, handlePreferenceChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [cacheKey]);

  // Mutation para salvar no banco
  const setMutation = trpc.preferences.set.useMutation();

  // Setter que atualiza local + banco
  const setValue = useCallback(
    (value: string) => {
      // 1. Atualizar estado local imediatamente (otimista)
      setLocalValue(value);

      // 2. Atualizar cache localStorage
      try {
        localStorage.setItem(cacheKey, value);
      } catch {}
      notifyPreferenceChanged(cacheKey, value);

      // 3. Salvar no banco em background
      setMutation.mutate({
        key,
        value,
        establishmentId: establishmentId ?? undefined,
      });
    },
    [key, establishmentId, cacheKey, setMutation]
  );

  return [localValue, setValue, isLoading];
}

/**
 * Hook para buscar múltiplas preferências de uma vez (batch).
 * Útil quando uma página precisa de várias preferências.
 * 
 * @param keys - Array de chaves de preferências
 * @param establishmentId - ID do estabelecimento (opcional)
 * @returns { prefs, isLoading, setPreference }
 * 
 * @example
 * const { prefs, setPreference } = usePreferences(
 *   ['modal_abc_seen', 'modal_dre_seen'],
 *   establishmentId
 * );
 * if (prefs['modal_abc_seen'] !== 'true') { showModal(); }
 * setPreference('modal_abc_seen', 'true');
 */
export function usePreferences(
  keys: string[],
  establishmentId?: number | null
): {
  prefs: Record<string, string>;
  isLoading: boolean;
  setPreference: (key: string, value: string) => void;
} {
  // Cache keys para localStorage
  const getCacheKey = (key: string) =>
    `pref_${key}${establishmentId ? `_${establishmentId}` : ""}`;

  // Estado local inicializado do cache
  const [localPrefs, setLocalPrefs] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const result: Record<string, string> = {};
    for (const key of keys) {
      try {
        const cached = localStorage.getItem(getCacheKey(key));
        if (cached !== null) result[key] = cached;
      } catch {}
    }
    return result;
  });

  const hasSynced = useRef(false);

  // Query batch
  const { data, isLoading } = trpc.preferences.getBatch.useQuery(
    { keys, establishmentId: establishmentId ?? undefined },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Sincronizar com servidor
  useEffect(() => {
    if (data && !hasSynced.current) {
      hasSynced.current = true;
      setLocalPrefs((prev) => {
        const merged = { ...prev, ...data };
        // Atualizar cache local
        for (const [key, value] of Object.entries(data)) {
          try {
            const cacheKey = getCacheKey(key);
            localStorage.setItem(cacheKey, value);
            notifyPreferenceChanged(cacheKey, value);
          } catch {}
        }
        return merged;
      });
    }
  }, [data]);

  const setMutation = trpc.preferences.set.useMutation();

  const setPreference = useCallback(
    (key: string, value: string) => {
      // Atualizar local
      setLocalPrefs((prev) => ({ ...prev, [key]: value }));
      try {
        const cacheKey = getCacheKey(key);
        localStorage.setItem(cacheKey, value);
        notifyPreferenceChanged(cacheKey, value);
      } catch {}

      // Salvar no banco
      setMutation.mutate({
        key,
        value,
        establishmentId: establishmentId ?? undefined,
      });
    },
    [establishmentId, setMutation]
  );

  return { prefs: localPrefs, isLoading, setPreference };
}
