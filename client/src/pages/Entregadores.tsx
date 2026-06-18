import { useState, useEffect, useRef, useCallback } from "react";
import { usePreference } from "@/hooks/usePreference";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, EmptyState, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bike,
  UserCheck,
  UserX,
  DollarSign,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Package,
  ArrowLeft,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  Clock,
  Info,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ---- Format helpers ----
function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function getStrategyLabel(strategy: string) {
  switch (strategy) {
    case "none": return "Nenhuma";
    case "neighborhood": return "Valor por bairro";
    case "fixed": return "Valor fixo";
    case "percentage": return "Percentual";
    default: return strategy;
  }
}

function getStrategyBadgeVariant(strategy: string): "default" | "secondary" | "outline" {
  switch (strategy) {
    case "neighborhood": return "default";
    case "fixed": return "secondary";
    case "percentage": return "outline";
    default: return "default";
  }
}

// ---- Driver Form Sheet ----
interface DriverFormData {
  name: string;
  email: string;
  whatsapp: string;
  isActive: boolean;
  departureNotifyBy: "driver" | "attendant";
  repasseStrategy: "none" | "neighborhood" | "fixed" | "percentage";
  fixedValue: string;
  percentageValue: string;
}

const defaultFormData: DriverFormData = {
  name: "",
  email: "",
  whatsapp: "",
  isActive: true,
  departureNotifyBy: "driver",
  repasseStrategy: "neighborhood",
  fixedValue: "",
  percentageValue: "",
};

function DriverFormSheet({
  open,
  onOpenChange,
  editingDriver,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDriver: any | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<DriverFormData>(defaultFormData);
  
  // Configurações globais de notificação do entregador
  const { data: notifyTimingData } = trpc.driver.getNotifyTiming.useQuery();
  const { data: departureNotifyByData } = trpc.driver.getDepartureNotifyBy.useQuery();
  const updateNotifyTimingMutation = trpc.driver.updateNotifyTiming.useMutation();
  const utils = trpc.useUtils();
  const [notifyTiming, setNotifyTiming] = useState<"on_accepted" | "on_ready">("on_ready");
  const [departureNotifyBy, setDepartureNotifyBy] = useState<"driver" | "attendant">("driver");
  
  // Sync local state with server data
  useEffect(() => {
    if (notifyTimingData?.timing) {
      setNotifyTiming(notifyTimingData.timing);
    }
  }, [notifyTimingData?.timing]);

  useEffect(() => {
    if (departureNotifyByData?.departureNotifyBy) {
      setDepartureNotifyBy(departureNotifyByData.departureNotifyBy);
    }
  }, [departureNotifyByData?.departureNotifyBy]);
  const [saving, setSaving] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'error'>('idle');
  const [whatsappName, setWhatsappName] = useState<string | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createMutation = trpc.driver.create.useMutation();
  const updateMutation = trpc.driver.update.useMutation();
  const checkWhatsAppMutation = trpc.driver.checkWhatsApp.useMutation();

  // Debounced WhatsApp validation
  const checkWhatsApp = useCallback(async (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setWhatsappStatus('idle');
      setWhatsappName(null);
      return;
    }
    setWhatsappStatus('checking');
    try {
      const result = await checkWhatsAppMutation.mutateAsync({ phone: digits });
      if (result.exists) {
        setWhatsappStatus('valid');
        setWhatsappName(result.verifiedName || null);
      } else {
        setWhatsappStatus('invalid');
        setWhatsappName(null);
      }
    } catch {
      setWhatsappStatus('error');
      setWhatsappName(null);
    }
  }, []);

  // Sync form when editingDriver or open changes
  useEffect(() => {
    if (open && editingDriver) {
      setForm({
        name: editingDriver.name || "",
        email: editingDriver.email || "",
        whatsapp: editingDriver.whatsapp || "",
        isActive: editingDriver.isActive ?? true,
        departureNotifyBy: editingDriver.departureNotifyBy || "driver",
        repasseStrategy: editingDriver.repasseStrategy || "neighborhood",
        fixedValue: editingDriver.fixedValue || "",
        percentageValue: editingDriver.percentageValue || "",
      });
      if (editingDriver.whatsapp) {
        checkWhatsApp(editingDriver.whatsapp);
      }
    } else if (open) {
      setForm(defaultFormData);
      setWhatsappStatus('idle');
      setWhatsappName(null);
    }
  }, [open, editingDriver]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.whatsapp.trim()) {
      toast.error("WhatsApp é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editingDriver) {
        await updateMutation.mutateAsync({
          id: editingDriver.id,
          name: form.name,
          email: form.email || "",
          whatsapp: form.whatsapp,
          isActive: form.isActive,
          departureNotifyBy: form.departureNotifyBy,
          repasseStrategy: form.repasseStrategy,
          fixedValue: form.repasseStrategy === "fixed" ? form.fixedValue : null,
          percentageValue: form.repasseStrategy === "percentage" ? form.percentageValue : null,
        });
        toast.success("Entregador atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          email: form.email || "",
          whatsapp: form.whatsapp,
          isActive: form.isActive,
          departureNotifyBy: form.departureNotifyBy,
          repasseStrategy: form.repasseStrategy,
          fixedValue: form.repasseStrategy === "fixed" ? form.fixedValue : undefined,
          percentageValue: form.repasseStrategy === "percentage" ? form.percentageValue : undefined,
        });
        toast.success("Entregador cadastrado com sucesso");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp mask + debounced validation
  const handleWhatsappChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let masked = digits;
    if (digits.length > 6) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 2) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    setForm((f) => ({ ...f, whatsapp: masked }));
    setWhatsappStatus('idle');
    setWhatsappName(null);
    
    // Debounce: wait 800ms after typing stops
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    if (digits.length >= 10) {
      checkTimeoutRef.current = setTimeout(() => checkWhatsApp(masked), 800);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">{editingDriver ? "Editar Entregador" : "Novo Entregador"}</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header - gradient style like CreateComboSheet */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingDriver ? "Editar Entregador" : "Novo Entregador"}
                  </h2>
                  <p className="text-sm text-white/80">
                    {editingDriver ? "Atualize os dados do entregador" : "Cadastre um novo entregador"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="driver-name" className="text-sm font-medium">Nome completo *</Label>
              <Input
                id="driver-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do entregador"
                className="h-10 rounded-xl bg-background border-border/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="driver-email" className="text-sm font-medium">E-mail (opcional)</Label>
              <Input
                id="driver-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="h-10 rounded-xl bg-background border-border/50"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="driver-whatsapp" className="text-sm font-medium">WhatsApp *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="driver-whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={`h-10 pl-9 pr-10 rounded-xl bg-background ${
                    whatsappStatus === 'valid' ? 'border-green-500 focus-visible:ring-green-500' :
                    whatsappStatus === 'invalid' ? 'border-red-500 focus-visible:ring-red-500' :
                    'border-border/50'
                  }`}
                />
                {/* Validation indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {whatsappStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                  {whatsappStatus === 'valid' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {whatsappStatus === 'invalid' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {/* Validation feedback */}
              {whatsappStatus === 'valid' && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Número válido no WhatsApp{whatsappName ? ` \u2014 ${whatsappName}` : ''}
                </p>
              )}
              {whatsappStatus === 'invalid' && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Número não encontrado no WhatsApp
                </p>
              )}
              {whatsappStatus === 'error' && (
                <p className="text-xs text-amber-500">
                  Não foi possível verificar. WhatsApp pode não estar conectado.
                </p>
              )}
              {whatsappStatus === 'checking' && (
                <p className="text-xs text-muted-foreground">
                  Verificando número no WhatsApp...
                </p>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
              <div>
                <span className="text-sm font-medium">Entregador ativo</span>
                <p className="text-xs text-muted-foreground">Disponível para receber pedidos</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>

            {/* Regra geral da loja (configuração global apenas como contexto) */}
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-50 p-1.5 text-red-500">
                  <Info className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Regra geral da loja</Label>
                  <p className="text-xs text-muted-foreground">
                    Esta regra vale para todos os entregadores e define quem normalmente avisa o cliente quando o pedido sai para entrega.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-red-600">Valor atual</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {departureNotifyBy === "driver" ? "Entregador avisa o cliente" : "Atendente avisa o cliente"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {departureNotifyBy === "driver"
                    ? 'A loja permite que entregadores recebam o botão "Sair para entrega". A permissão abaixo personaliza este entregador específico.'
                    : 'Como a regra geral está em Atendente, nenhum entregador recebe o botão "Sair para entrega", mesmo que a permissão individual esteja marcada como permitida.'}
                </p>
              </div>
            </div>

            {/* Permissão individual do entregador */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Bike className="mt-0.5 h-4 w-4 text-red-500" />
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Permissão deste entregador</Label>
                  <p className="text-xs text-muted-foreground">
                    Define se este entregador específico poderá usar o botão "Sair para entrega" quando a regra geral da loja permitir.
                  </p>
                </div>
              </div>

              {departureNotifyBy === "attendant" && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-xs">
                    A regra geral está em <strong>Atendente</strong>. Por isso, esta permissão fica guardada para este entregador, mas o botão só aparecerá se a regra geral da loja voltar a permitir entregadores.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.departureNotifyBy === "driver" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="driverDepartureNotifyBy"
                    value="driver"
                    checked={form.departureNotifyBy === "driver"}
                    onChange={() => setForm((f) => ({ ...f, departureNotifyBy: "driver" }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium">Pode usar o botão "Sair para entrega"</span>
                    <p className="text-xs text-muted-foreground">Quando a regra geral permitir, este entregador recebe o botão e fica responsável por avisar o cliente.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.departureNotifyBy === "attendant" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="driverDepartureNotifyBy"
                    value="attendant"
                    checked={form.departureNotifyBy === "attendant"}
                    onChange={() => setForm((f) => ({ ...f, departureNotifyBy: "attendant" }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium">Não mostrar o botão para este entregador</span>
                    <p className="text-xs text-muted-foreground">O entregador recebe apenas a mensagem da nova entrega; o atendente informa o cliente que o pedido saiu para entrega.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Momento de acionamento do entregador (configuração global) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" />
                <Label className="text-sm font-medium">Quando acionar o entregador?</Label>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Define em que momento o entregador recebe a mensagem de nova entrega.</p>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${notifyTiming === "on_ready" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="notifyTiming"
                    value="on_ready"
                    checked={notifyTiming === "on_ready"}
                    onChange={async () => {
                      setNotifyTiming("on_ready");
                      try {
                        await updateNotifyTimingMutation.mutateAsync({ timing: "on_ready" });
                        utils.driver.getNotifyTiming.invalidate();
                        toast.success("Configuração atualizada");
                      } catch { toast.error("Erro ao salvar configuração"); }
                    }}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium">Quando o pedido for despachado</span>
                    <p className="text-xs text-muted-foreground">O entregador é acionado somente quando o pedido for despachado.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${notifyTiming === "on_accepted" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="notifyTiming"
                    value="on_accepted"
                    checked={notifyTiming === "on_accepted"}
                    onChange={async () => {
                      setNotifyTiming("on_accepted");
                      try {
                        await updateNotifyTimingMutation.mutateAsync({ timing: "on_accepted" });
                        utils.driver.getNotifyTiming.invalidate();
                        toast.success("Configuração atualizada");
                      } catch { toast.error("Erro ao salvar configuração"); }
                    }}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium">Quando o pedido for aceito</span>
                    <p className="text-xs text-muted-foreground">Agiliza a entrega. O entregador é acionado assim que o restaurante aceita o pedido.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Estratégia de repasse */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Como o entregador será pago pelas entregas?</Label>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.repasseStrategy === "none" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="none"
                    checked={form.repasseStrategy === "none"}
                    onChange={() => setForm((f) => ({ ...f, repasseStrategy: "none" }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium">Nenhuma</span>
                    <p className="text-xs text-muted-foreground">Sem repasse automático ao entregador.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.repasseStrategy === "neighborhood" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="neighborhood"
                    checked={form.repasseStrategy === "neighborhood"}
                    onChange={() => setForm((f) => ({ ...f, repasseStrategy: "neighborhood" }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium">Valor por bairro</span>
                    <p className="text-xs text-muted-foreground">Repasse igual ao valor cobrado na zona de entrega.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.repasseStrategy === "fixed" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="fixed"
                    checked={form.repasseStrategy === "fixed"}
                    onChange={() => setForm((f) => ({ ...f, repasseStrategy: "fixed" }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Valor fixo por entrega</span>
                    <p className="text-xs text-muted-foreground">Valor fixo independente da distância.</p>
                    {form.repasseStrategy === "fixed" && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.fixedValue}
                          onChange={(e) => setForm((f) => ({ ...f, fixedValue: e.target.value }))}
                          placeholder="R$ 0,00"
                          className="w-40 h-9 rounded-xl bg-background border-border/50"
                        />
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.repasseStrategy === "percentage" ? "border-red-400 bg-red-50 shadow-sm" : "border-border/50 hover:border-red-300 bg-muted/30 hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="percentage"
                    checked={form.repasseStrategy === "percentage"}
                    onChange={() => setForm((f) => ({ ...f, repasseStrategy: "percentage" }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Percentual por entrega</span>
                    <p className="text-xs text-muted-foreground">Ex: 70% da taxa de entrega.</p>
                    {form.repasseStrategy === "percentage" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={form.percentageValue}
                          onChange={(e) => setForm((f) => ({ ...f, percentageValue: e.target.value }))}
                          placeholder="70"
                          className="w-24 h-9 rounded-xl bg-background border-border/50"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer - styled like CreateComboSheet */}
          <div className="p-4 border-t border-border/50 bg-card">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl h-11"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              {saving ? "Salvando..." : editingDriver ? "Salvar Alterações" : "Cadastrar Entregador"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---- Main Page ----
export default function Entregadores() {
  const [, navigate] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<any | null>(null);
  const [multiDriverModalOpen, setMultiDriverModalOpen] = useState(false);

  const { data: driversList, isLoading: driversLoading, refetch: refetchDrivers } = trpc.driver.list.useQuery();
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.driver.metrics.useQuery();
  const { data: establishment } = trpc.establishment.get.useQuery();

  // Preferência de multi-driver onboarding (persistida no banco)
  const [multiDriverDismissedPref, setMultiDriverDismissedPref] = usePreference('multidriver_onboarding_dismissed', establishment?.id);
  const isMultiDriverDismissed = () => multiDriverDismissedPref === 'true';
  const dismissMultiDriverModal = () => setMultiDriverDismissedPref('true');

  const deleteMutation = trpc.driver.delete.useMutation();
  const toggleMutation = trpc.driver.update.useMutation();

  const handleRefresh = () => {
    refetchDrivers();
    refetchMetrics();
  };

  const handleEdit = (driver: any) => {
    setEditingDriver(driver);
    setSheetOpen(true);
  };

  const handleNew = () => {
    // Interceptar: se há exatamente 1 entregador e o modal não foi dismissado, mostrar modal informativo
    if (driversList && driversList.length === 1 && !isMultiDriverDismissed()) {
      setMultiDriverModalOpen(true);
      return;
    }
    setEditingDriver(null);
    setSheetOpen(true);
  };

  const handleMultiDriverConfirm = () => {
    setMultiDriverModalOpen(false);
    setEditingDriver(null);
    setSheetOpen(true);
  };

  const handleMultiDriverDismiss = () => {
    dismissMultiDriverModal();
    setMultiDriverModalOpen(false);
    setEditingDriver(null);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!driverToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: driverToDelete.id });
      toast.success("Entregador excluído");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro ao excluir", { description: error.message });
    }
    setDeleteDialogOpen(false);
    setDriverToDelete(null);
  };

  const handleToggleActive = async (driver: any) => {
    try {
      await toggleMutation.mutateAsync({ id: driver.id, isActive: !driver.isActive });
      toast.success(driver.isActive ? "Entregador desativado" : "Entregador ativado");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro", { description: error.message });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <PageHeader
        title="Entregadores"
        description="Gerencie seus entregadores e entregas."
        icon={<Bike className="h-6 w-6 text-blue-600" />}
        actions={
          <button onClick={handleNew} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500">
            Novo entregador
          </button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        <StatCard
          title="Cadastrados"
          value={metricsLoading ? "..." : metrics?.total ?? 0}
          icon={Bike}
          variant="blue"
          loading={metricsLoading}
        />
        <StatCard
          title="Ativos"
          value={metricsLoading ? "..." : metrics?.active ?? 0}
          icon={UserCheck}
          variant="emerald"
          loading={metricsLoading}
        />
        <StatCard
          title="Desativados"
          value={metricsLoading ? "..." : metrics?.inactive ?? 0}
          icon={UserX}
          variant="gray"
          loading={metricsLoading}
        />
        <StatCard
          title="Repasses (7 dias)"
          value={metricsLoading ? "..." : formatCurrency(metrics?.repasses7d ?? 0)}
          icon={DollarSign}
          variant="amber"
          loading={metricsLoading}
        />
        <StatCard
          title="Entregas (7 dias)"
          value={metricsLoading ? "..." : metrics?.entregas7d ?? 0}
          icon={Package}
          variant="primary"
          loading={metricsLoading}
        />
      </div>

      {/* Drivers Table */}
      <div className="mt-6">
        {driversLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : !driversList || driversList.length === 0 ? (
          <EmptyState
            icon={Bike}
            title="Nenhum entregador cadastrado"
            description="Cadastre seu primeiro entregador para começar a gerenciar entregas."

          />
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">WhatsApp</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estratégia</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Entregas (7d)</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">A receber</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {driversList.map((driver) => (
                    <tr
                      key={driver.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/entregadores/${driver.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"}`}>
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            {driver.email && <p className="text-xs text-muted-foreground">{driver.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatPhone(driver.whatsapp)}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={driver.isActive ? "default" : "secondary"} className={driver.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                          {driver.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStrategyBadgeVariant(driver.repasseStrategy)}>
                          {getStrategyLabel(driver.repasseStrategy)}
                          {driver.repasseStrategy === "fixed" && driver.fixedValue ? ` (R$ ${parseFloat(driver.fixedValue).toFixed(2).replace(".", ",")})` : ""}
                          {driver.repasseStrategy === "percentage" && driver.percentageValue ? ` (${driver.percentageValue}%)` : ""}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-medium">{driver.deliveriesLast7Days}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-medium ${driver.pendingTotal > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {formatCurrency(driver.pendingTotal)}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/entregadores/${driver.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(driver)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(driver)}>
                              {driver.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                              {driver.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDriverToDelete(driver);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {driversList.map((driver) => (
                <div
                  key={driver.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/entregadores/${driver.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"}`}>
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhone(driver.whatsapp)}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/entregadores/${driver.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(driver)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(driver)}>
                            {driver.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {driver.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDriverToDelete(driver);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={driver.isActive ? "default" : "secondary"} className={driver.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                      {driver.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant={getStrategyBadgeVariant(driver.repasseStrategy)}>
                      {getStrategyLabel(driver.repasseStrategy)}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {driver.deliveriesLast7Days} entregas · <span className={driver.pendingTotal > 0 ? "text-amber-600 font-medium" : ""}>{formatCurrency(driver.pendingTotal)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Driver Form Sheet */}
      <DriverFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingDriver={editingDriver}
        onSuccess={handleRefresh}
      />

      {/* Multi-Driver Onboarding Modal */}
      <Dialog
        open={multiDriverModalOpen}
        onOpenChange={(open) => {
          if (!open) setMultiDriverModalOpen(false);
        }}
      >
        <DialogContent
          className="sm:max-w-[440px] p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Múltiplos entregadores</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            {/* Header com ícone */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Múltiplos entregadores</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Indique o entregador ao avançar com o pedido.
                </p>
              </div>
            </div>

            {/* Ilustração visual */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                  {driversList?.[0]?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-medium text-sm">{driversList?.[0]?.name || 'Entregador 1'}</p>
                  <p className="text-xs text-muted-foreground">Já cadastrado</p>
                </div>
                <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-blue-600">Novo entregador</p>
                  <p className="text-xs text-muted-foreground">Sendo cadastrado agora</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>Na página de pedidos, você escolherá qual entregador receberá cada pedido.</span>
                </div>
              </div>
            </div>

            {/* Botão "Não mostrar novamente" - estilo vazado/outline */}
            <Button
              variant="outline"
              className="w-full rounded-xl h-10 font-medium mb-2.5 border-border text-muted-foreground hover:bg-muted/50"
              onClick={handleMultiDriverDismiss}
            >
              Não mostrar este aviso novamente
            </Button>

            {/* Botão de confirmação principal */}
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleMultiDriverConfirm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Entendi, cadastrar entregador
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Excluir entregador</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do entregador</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir entregador</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja excluir <strong>{driverToDelete?.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              >
                Excluir
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
