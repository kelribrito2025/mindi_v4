import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Store, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function EstablishmentSelector() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const { data: establishments, isLoading } = trpc.establishment.listUserEstablishments.useQuery(undefined, {
    staleTime: 30_000,
  });

  const { data: countData } = trpc.establishment.countEstablishments.useQuery(undefined, {
    staleTime: 30_000,
  });

  const selectMutation = trpc.establishment.selectEstablishment.useMutation({
    onSuccess: async () => {
      // Invalidate all caches and do a full page reload to ensure fresh data
      await queryClient.clear();
      window.location.replace("/");
    },
    onError: (error) => {
      setSelectingId(null);
      toast.error(error.message || "Erro ao selecionar estabelecimento.");
    },
  });

  const handleSelect = (establishmentId: number) => {
    setSelectingId(establishmentId);
    selectMutation.mutate({ establishmentId });
  };

  const handleCreateNew = () => {
    navigate("/onboarding");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white dark:from-neutral-950 dark:to-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-[16px] flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-red-900/30">
            <UtensilsCrossed className="h-7 w-7 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      </div>
    );
  }

  // If no establishments, redirect to onboarding
  if (establishments && establishments.length === 0) {
    window.location.replace("/onboarding");
    return null;
  }

  // If only 1 establishment, auto-select it
  if (establishments && establishments.length === 1) {
    if (!selectingId) {
      handleSelect(establishments[0].establishmentId);
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white dark:from-neutral-950 dark:to-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-[16px] flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-red-900/30">
            <UtensilsCrossed className="h-7 w-7 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
          <p className="text-sm text-muted-foreground">Entrando...</p>
        </div>
      </div>
    );
  }

  const canCreateMore = (countData?.count ?? 0) < (countData?.limit ?? 3);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white dark:from-neutral-950 dark:to-neutral-900 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-[16px] flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-red-900/30">
            <UtensilsCrossed className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Selecionar Estabelecimento</h1>
          <p className="text-muted-foreground text-sm">Escolha qual estabelecimento deseja gerenciar</p>
        </div>

        {/* Establishment Cards */}
        <div className="space-y-3">
          {establishments?.map((est) => (
            <Card
              key={est.establishmentId}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-red-300 dark:hover:border-red-700 ${
                selectingId === est.establishmentId ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" : ""
              }`}
              onClick={() => !selectingId && handleSelect(est.establishmentId)}
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {est.logo ? (
                    <img
                      src={est.logo}
                      alt={est.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{est.name}</h3>
                  {est.menuSlug && (
                    <p className="text-xs text-muted-foreground truncate">
                      /{est.menuSlug}
                    </p>
                  )}
                </div>

                {/* Loading indicator */}
                {selectingId === est.establishmentId && (
                  <Loader2 className="h-5 w-5 animate-spin text-red-500 shrink-0" />
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Create New Button */}
        {canCreateMore && (
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-2 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20"
              onClick={handleCreateNew}
              disabled={!!selectingId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar novo estabelecimento
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {countData?.count ?? 0} de {countData?.limit ?? 3} estabelecimentos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
