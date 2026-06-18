import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Save, Coins, CreditCard, AlertTriangle, Check, Eye, Wallet } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LoyaltySettingsCardProps {
  establishmentId: number;
}

export function LoyaltySettingsCard({ establishmentId }: LoyaltySettingsCardProps) {
  // Loyalty settings
  const { data: loyaltySettings, refetch: refetchLoyalty } = trpc.loyalty.getSettings.useQuery();
  // Cashback settings
  const { data: cashbackConfig, refetch: refetchCashback } = trpc.cashback.getConfig.useQuery();
  // Categories for cashback
  const { data: categoriesData } = trpc.category.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );
  
  // Reward program type state
  const [rewardType, setRewardType] = useState<"none" | "loyalty" | "cashback">("none");
  
  // Loyalty form state
  const [stampsRequired, setStampsRequired] = useState(6);
  const [couponType, setCouponType] = useState<"fixed" | "percentage" | "free_delivery">("fixed");
  const [couponValue, setCouponValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("0");
  
  // Cashback form state
  const [cashbackPercent, setCashbackPercent] = useState("5");
  const [cashbackApplyMode, setCashbackApplyMode] = useState<"all" | "categories">("all");
  const [cashbackCategoryIds, setCashbackCategoryIds] = useState<number[]>([]);
  const cashbackAllowPartialUse = false; // Sempre exigir uso total
  
  // Load loyalty settings
  useEffect(() => {
    if (loyaltySettings) {
      setStampsRequired(loyaltySettings.loyaltyStampsRequired || 6);
      setCouponType(loyaltySettings.loyaltyCouponType || "fixed");
      setCouponValue(loyaltySettings.loyaltyCouponValue || "10");
      setMinOrderValue(loyaltySettings.loyaltyMinOrderValue || "0");
    }
  }, [loyaltySettings]);
  
  // Load cashback settings
  useEffect(() => {
    if (cashbackConfig) {
      setRewardType(cashbackConfig.rewardProgramType as "none" | "loyalty" | "cashback" || "none");
      setCashbackPercent(cashbackConfig.cashbackPercent || "5");
      setCashbackApplyMode(cashbackConfig.cashbackApplyMode as "all" | "categories" || "all");
      setCashbackCategoryIds(cashbackConfig.cashbackCategoryIds as number[] || []);
      // cashbackAllowPartialUse sempre false (uso total)
    }
  }, [cashbackConfig]);
  
  // Save loyalty mutation
  const saveLoyaltyMutation = trpc.loyalty.saveSettings.useMutation({
    onSuccess: () => {
      refetchLoyalty();
      refetchCashback();
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de fidelidade");
    },
  });
  
  // Save cashback mutation
  const saveCashbackMutation = trpc.cashback.saveConfig.useMutation({
    onSuccess: () => {
      refetchCashback();
      refetchLoyalty();
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de cashback");
    },
  });
  
  const handleSave = () => {
    // Save reward program type + cashback config
    saveCashbackMutation.mutate({
      establishmentId,
      rewardProgramType: rewardType,
      cashbackPercent,
      cashbackApplyMode,
      cashbackCategoryIds,
      cashbackAllowPartialUse,
    });
    
    // Also save loyalty settings
    saveLoyaltyMutation.mutate({
      establishmentId,
      loyaltyEnabled: rewardType === "loyalty",
      loyaltyStampsRequired: stampsRequired,
      loyaltyCouponType: couponType,
      loyaltyCouponValue: couponValue,
      loyaltyMinOrderValue: minOrderValue,
    });
    
    toast.success("Configurações do programa de recompensas salvas!");
  };
  
  const isSaving = saveLoyaltyMutation.isPending || saveCashbackMutation.isPending;
  
  const toggleCategory = (catId: number) => {
    setCashbackCategoryIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
          <Gift className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Programa de Recompensas</h3>
          <p className="text-sm text-muted-foreground">
            Escolha e configure o programa de recompensas do seu restaurante
          </p>
        </div>
      </div>
      
      {/* Aviso de exclusividade */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Você pode utilizar apenas um programa de recompensa por vez.
        </p>
      </div>
      
      {/* Seleção do programa ativo */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-muted-foreground">Programa ativo</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Nenhum */}
          <button
            type="button"
            onClick={() => setRewardType("none")}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors duration-200",
              rewardType === "none"
                ? "border-gray-500 bg-gray-50 dark:bg-gray-800/50 shadow-sm"
                : "border-border/50 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            {rewardType === "none" && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            )}
            <div className={cn(
              "p-2 rounded-lg",
              rewardType === "none" ? "bg-gray-200 dark:bg-gray-700" : "bg-muted/50"
            )}>
              <AlertTriangle className="h-5 w-5 text-gray-500" />
            </div>
            <span className="font-medium text-sm">Nenhum</span>
            <span className="text-xs text-muted-foreground text-center">Desativado</span>
          </button>
          
          {/* Cartão Fidelidade */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setRewardType("loyalty")}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors duration-200",
                  rewardType === "loyalty"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm"
                    : "border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700"
                )}
              >
                {rewardType === "loyalty" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div className={cn(
                  "p-2 rounded-lg",
                  rewardType === "loyalty" ? "bg-emerald-200 dark:bg-emerald-800" : "bg-muted/50"
                )}>
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-sm">Cartão Fidelidade</span>
                <span className="text-xs text-muted-foreground text-center">Carimbos por pedido</span>
                {rewardType === "loyalty" && (
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 text-center mt-1 leading-relaxed">
                    O cliente acumula carimbos a cada pedido e, ao completar todos, ganha um cupom no valor definido por você.
                  </p>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={12} className="p-0 bg-transparent border-0 shadow-2xl rounded-2xl overflow-hidden w-[346px]">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-[13px] font-medium text-gray-500">Visão do cliente</span>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 text-white relative overflow-hidden">
                  <div className="absolute -left-10 -bottom-10 opacity-[0.12] pointer-events-none">
                    <svg width="160" height="160" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                  <div className="flex items-start gap-2.5 mb-3 relative z-10">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Gift className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Seu Restaurante</h3>
                      <p className="text-white/70 text-xs">Maria Silva • Fidelidade ativa</p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 relative z-10">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white/90">Progresso</span>
                      <span className="font-bold">3 / {stampsRequired} carimbos</span>
                    </div>
                    <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-2.5">
                      <div className="h-full bg-white rounded-full" style={{ width: `${(3 / stampsRequired) * 100}%` }} />
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: Math.min(stampsRequired, 10) }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center",
                            i < 3 ? "bg-emerald-500 border-emerald-400 shadow-sm" : "border-white/40 bg-white/10"
                          )}
                        >
                          {i < 3 && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2.5 text-center">
                  <p className="text-gray-600 text-[13px]">Faltam <span className="text-emerald-600 font-bold">{stampsRequired - 3}</span> pedidos para ganhar seu cupom!</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          {/* Cashback */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setRewardType("cashback")}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors duration-200",
                  rewardType === "cashback"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-border/50 hover:border-blue-300 dark:hover:border-blue-700"
                )}
              >
                {rewardType === "cashback" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className={cn(
                  "p-2 rounded-lg",
                  rewardType === "cashback" ? "bg-blue-200 dark:bg-blue-800" : "bg-muted/50"
                )}>
                  <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-sm">Cashback</span>
                <span className="text-xs text-muted-foreground text-center">% de volta por pedido</span>
                {rewardType === "cashback" && (
                  <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 text-center mt-1 leading-relaxed">
                    O cliente recebe uma porcentagem do valor do pedido de volta como crédito para usar em compras futuras.
                  </p>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={12} className="p-0 bg-transparent border-0 shadow-2xl rounded-2xl overflow-hidden w-[346px]">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-[13px] font-medium text-gray-500">Visão do cliente</span>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white">
                  <p className="text-blue-100 text-xs font-medium">Saldo disponível</p>
                  <p className="text-2xl font-bold mt-0.5">R$ 12,50</p>
                  <div className="flex gap-4 mt-2.5 text-xs">
                    <div>
                      <p className="text-blue-200">Total ganho</p>
                      <p className="font-semibold">R$ 47,80</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Total usado</p>
                      <p className="font-semibold">R$ 35,30</p>
                    </div>
                  </div>
                  {Number(cashbackPercent) > 0 && (
                    <div className="mt-2.5 bg-white/20 rounded-md px-2.5 py-1.5 inline-block">
                      <p className="text-xs font-medium">Você ganha {cashbackPercent}% de cashback a cada pedido</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                      <span className="text-blue-500">ℹ</span> Como funciona
                    </h4>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-gray-600">
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-500">✓</span>
                        Ganhe {cashbackPercent || 5}% a cada pedido concluído
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-500">✓</span>
                        Use como desconto em pedidos futuros
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Configurações do Cartão Fidelidade */}
      {rewardType === "loyalty" && (
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Configurações do Cartão Fidelidade
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Carimbos necessários */}
            <div>
              <Label htmlFor="stampsRequired" className="text-xs font-semibold text-muted-foreground">
                Carimbos necessários
              </Label>
              <Input
                id="stampsRequired"
                type="number"
                min={1}
                max={20}
                value={stampsRequired}
                onChange={(e) => setStampsRequired(parseInt(e.target.value) || 6)}
                className="mt-1 h-9 rounded-lg border-border/50 text-sm"
              />
            </div>
            
            {/* Tipo de cupom */}
            <div>
              <Label htmlFor="couponType" className="text-xs font-semibold text-muted-foreground">
                Tipo de cupom
              </Label>
              <Select value={couponType} onValueChange={(v) => setCouponType(v as typeof couponType)}>
                <SelectTrigger className="mt-1 h-9 rounded-lg border-border/50 text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="free_delivery">Entrega grátis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Valor do desconto */}
            {couponType !== "free_delivery" && (
              <div>
                <Label htmlFor="couponValue" className="text-xs font-semibold text-muted-foreground">
                  {couponType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
                </Label>
                <Input
                  id="couponValue"
                  type="number"
                  min={1}
                  max={couponType === "percentage" ? 100 : 1000}
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                />
              </div>
            )}
            
            {/* Valor mínimo */}
            <div>
              <Label htmlFor="minOrderValue" className="text-xs font-semibold text-muted-foreground">
                Valor mínimo (R$)
              </Label>
              <Input
                id="minOrderValue"
                type="number"
                min={0}
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Configurações do Cashback */}
      {rewardType === "cashback" && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Configurações do Cashback
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Percentual de cashback */}
            <div>
              <Label htmlFor="cashbackPercent" className="text-xs font-semibold text-muted-foreground">
                Percentual de cashback (%)
              </Label>
              <Input
                id="cashbackPercent"
                type="number"
                min={1}
                max={50}
                step={1}
                value={cashbackPercent}
                onChange={(e) => setCashbackPercent(e.target.value)}
                className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 5% = R$ 5,00 de cashback em um pedido de R$ 100,00
              </p>
            </div>
            
            {/* Uso do saldo: sempre exigir uso total */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Uso do saldo:</strong> O cliente deve usar todo o saldo disponível ou nenhum.
              </p>
            </div>
          </div>
          
          {/* Aplicar cashback em */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              Aplicar cashback em
            </Label>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setCashbackApplyMode("all")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  cashbackApplyMode === "all"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-border/50 text-muted-foreground hover:border-blue-300"
                )}
              >
                Todos os produtos
              </button>
              <button
                type="button"
                onClick={() => setCashbackApplyMode("categories")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  cashbackApplyMode === "categories"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-border/50 text-muted-foreground hover:border-blue-300"
                )}
              >
                Categorias específicas
              </button>
            </div>
          </div>
          
          {/* Lista de categorias */}
          {cashbackApplyMode === "categories" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label className="text-xs font-semibold text-muted-foreground">
                Selecione as categorias elegíveis
              </Label>
              {categoriesData && categoriesData.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {categoriesData.map((cat: any) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                        cashbackCategoryIds.includes(cat.id)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "border-border/50 text-muted-foreground hover:border-blue-300"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        cashbackCategoryIds.includes(cat.id)
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300 dark:border-gray-600"
                      )}>
                        {cashbackCategoryIds.includes(cat.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma categoria encontrada. Adicione categorias ao seu cardápio primeiro.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Save button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
