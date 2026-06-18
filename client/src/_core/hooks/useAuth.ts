import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 0,
    // Sempre revalidar auth.me ao montar para evitar usuário/avatar antigo após troca de conta
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("manus-runtime-user-info");
      }
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.invalidate();
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("manus-runtime-user-info");
        window.location.replace(redirectPath);
      }
    }
  }, [logoutMutation, queryClient, redirectPath, utils]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (meQuery.data) {
      window.localStorage.removeItem("manus-runtime-user-info");
    }
  }, [meQuery.data?.id]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: (meQuery.isLoading && !meQuery.data) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if ((meQuery.isLoading && !meQuery.data) || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    meQuery.data,
    state.user,
  ]);

  const refresh = useCallback(() => meQuery.refetch(), [meQuery]);

  return {
    ...state,
    refresh,
    logout,
  };
}
