import { CashReminderSettings } from "@/components/CashReminderSettings";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  Hash,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Clock,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Lock,
  Unlock,
  Minus,
  History,
  Calculator,
  User,
  Eye,
  EyeOff,
  ShoppingBag,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  Check,
  X,
  BellRing,
  Settings,
  Wifi,
  Star,
  MoreHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ==================== HELPERS ====================
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: any; color: string; barColor: string }> = {
  cash: { label: "Dinheiro", icon: Banknote, color: "text-emerald-600", barColor: "#22c55e" },
  pix_online: { label: "Pix online", icon: QrCode, color: "text-teal-600", barColor: "#14b8a6" },
  pix: { label: "Pix estático", icon: QrCode, color: "text-cyan-600", barColor: "#06b6d4" },
  card: { label: "Cartão", icon: CreditCard, color: "text-blue-600", barColor: "#3b82f6" },
};

const HISTORY_PAGE_SIZE = 30;
const SALES_PAGE_SIZE = 15;
const COMM_PAGE_SIZE = 15;
const MOV_PAGE_SIZE = 15;

// ==================== PAINEL DE CONFIGURAÇÃO DE TAXAS ====================

// Formata centavos para string com vírgula (ex: 99 -> "0,99", 100 -> "1,00", 199 -> "1,99")
function formatFeeValue(cents: number): string {
  if (cents === 0) return "0,00";
  const str = cents.toString().padStart(3, '0');
  const intPart = str.slice(0, -2);
  const decPart = str.slice(-2);
  return `${intPart},${decPart}`;
}

// Converte string formatada ("1,99") para número decimal (1.99)
function parseFeeValue(formatted: string): number | null {
  if (!formatted || formatted === "0,00") return null;
  const clean = formatted.replace(/[^0-9]/g, '');
  if (!clean || parseInt(clean) === 0) return null;
  return parseInt(clean) / 100;
}

// Handler de input: aceita apenas dígitos, formata como centavos
function handleFeeInput(rawValue: string, setter: (v: string) => void) {
  const digits = rawValue.replace(/[^0-9]/g, '');
  const numericValue = parseInt(digits || '0');
  if (numericValue > 10000) return; // max 100,00%
  setter(formatFeeValue(numericValue));
}

// Converte número decimal (1.99) para string formatada ("1,99")
function numberToFormatted(value: number | null | undefined): string {
  if (value == null || value === 0) return "";
  const cents = Math.round(value * 100);
  return formatFeeValue(cents);
}

function FeeConfigPanel({ feeData, onSave, isSaving, onClose, establishmentId }: {
  feeData: { feePixOnline: number | null; feePixStatic: number | null; feeCard: number | null } | undefined;
  onSave: (data: { feePixOnline?: number | null; feePixStatic?: number | null; feeCard?: number | null }) => void;
  isSaving: boolean;
  onClose: () => void;
  establishmentId: number | null;
}) {
  const [feePixOnline, setFeePixOnline] = useState("");
  const [feePixStatic, setFeePixStatic] = useState("");
  const [feeCard, setFeeCard] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Buscar taxa padrão do Paytime (BACEN flag -> fees.pix)
  const { data: taxData } = trpc.paytime.getTaxesAndFees.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Extrair taxa PIX padrão do Paytime
  const defaultPixRate = useMemo(() => {
    if (!taxData?.planDetails?.length) return null;
    for (const plan of taxData.planDetails) {
      const bacenFlag = (plan as any)?.flags?.find((f: any) => f.name === 'BACEN');
      if (bacenFlag?.fees?.pix != null) {
        return bacenFlag.fees.pix;
      }
    }
    return null;
  }, [taxData]);

  // Inicializar valores dos campos
  useEffect(() => {
    if (initialized) return;
    if (feeData) {
      setFeePixOnline(numberToFormatted(feeData.feePixOnline ?? defaultPixRate));
      setFeePixStatic(numberToFormatted(feeData.feePixStatic));
      setFeeCard(numberToFormatted(feeData.feeCard));
      setInitialized(true);
    } else if (defaultPixRate != null) {
      setFeePixOnline(numberToFormatted(defaultPixRate));
      setInitialized(true);
    }
  }, [feeData, defaultPixRate, initialized]);

  const handleSave = () => {
    onSave({
      feePixOnline: parseFeeValue(feePixOnline),
      feePixStatic: parseFeeValue(feePixStatic),
      feeCard: parseFeeValue(feeCard),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — gradiente vermelho PDV style (mesmo do Novo Cliente) */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configurar Taxas</h2>
              <p className="text-sm text-white/80">Taxas por forma de pagamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
        <div>
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-red-500" />
            Taxas PIX
          </h3>
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Taxa Pix online (%)</label>
              <input
                type="text"
                inputMode="numeric"
                value={feePixOnline}
                onChange={(e) => handleFeeInput(e.target.value, setFeePixOnline)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Cobrada pelo gateway nas transações Pix online</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Taxa Pix estático (%)</label>
              <input
                type="text"
                inputMode="numeric"
                value={feePixStatic}
                onChange={(e) => handleFeeInput(e.target.value, setFeePixStatic)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Cobrada nas transações Pix via QR code estático</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-red-500" />
            Taxa Cartão
          </h3>
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Taxa Cartão (%)</label>
              <input
                type="text"
                inputMode="numeric"
                value={feeCard}
                onChange={(e) => handleFeeInput(e.target.value, setFeeCard)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Cobrada pela maquininha/gateway nas transações de cartão</p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          className="w-full bg-red-500 hover:bg-red-500 text-white"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar Taxas"}
        </Button>
      </div>
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function ControleCaixa() {
  // Obter establishment
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id ?? null;

  // Estados de UI
  const [activeHistoryTab, setActiveHistoryTab] = useState<"vendas" | "movimentacoes" | "historico" | "turno" | "comissoes">("vendas");
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showFeeSheet, setShowFeeSheet] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showSangriaDialog, setShowSangriaDialog] = useState(false);
  const [showSuprimentoDialog, setShowSuprimentoDialog] = useState(false);
  const [, setLocation] = useLocation();
  const [openingAmount, setOpeningAmount] = useState("0,00");
  const [openingObservation, setOpeningObservation] = useState("");
  const [closingAmount, setClosingAmount] = useState("0,00");
  const [closingObservation, setClosingObservation] = useState("");
  const [sangriaAmount, setSangriaAmount] = useState("0,00");
  const [sangriaReason, setSangriaReason] = useState("");
  const [suprimentoAmount, setSuprimentoAmount] = useState("0,00");
  const [suprimentoReason, setSuprimentoReason] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [commPage, setCommPage] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);

  // Operador states
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [isCreatingOperator, setIsCreatingOperator] = useState(false);
  const [newOperatorName, setNewOperatorName] = useState("");
  const [editingOperatorId, setEditingOperatorId] = useState<number | null>(null);
  const [editingOperatorName, setEditingOperatorName] = useState("");
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);

  // tRPC Queries
  const utils = trpc.useUtils();
  // Taxas por forma de pagamento
  const { data: feeData } = trpc.cashRegister.getPaymentFees.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );
  const setFeesMutation = trpc.cashRegister.setPaymentFees.useMutation({
    onSuccess: () => {
      utils.cashRegister.getPaymentFees.invalidate();
      toast.success("Taxas salvas com sucesso");
      setShowFeeSheet(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar taxas"),
  });

  // Operadores
  const { data: operators } = trpc.cashRegister.getOperators.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const createOperatorMutation = trpc.cashRegister.createOperator.useMutation({
    onSuccess: (data) => {
      toast.success("Operador criado com sucesso!");
      setIsCreatingOperator(false);
      setNewOperatorName("");
      setSelectedOperator(data.name || "");
      utils.cashRegister.getOperators.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateOperatorMutation = trpc.cashRegister.updateOperator.useMutation({
    onSuccess: (data: any) => {
      toast.success("Operador atualizado!");
      setEditingOperatorId(null);
      setEditingOperatorName("");
      utils.cashRegister.getOperators.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteOperatorMutation = trpc.cashRegister.deleteOperator.useMutation({
    onSuccess: () => {
      toast.success("Operador removido!");
      utils.cashRegister.getOperators.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Pre-selecionar o responsável como operador padrão
  useEffect(() => {
    if (!establishment || !operators || selectedOperator) return;
    const responsibleName = establishment.responsibleName || establishment.ownerDisplayName;
    if (!responsibleName) return;
    // Verificar se já existe na lista de operadores
    const exists = operators.find((op: any) => op.name === responsibleName);
    if (exists) {
      setSelectedOperator(responsibleName);
    } else if (establishmentId) {
      // Auto-criar o operador com nome do responsável
      createOperatorMutation.mutate({ establishmentId, name: responsibleName });
    }
  }, [operators, establishment, establishmentId]);

  const { data: currentSession, isLoading: sessionLoading } = trpc.cashRegister.getCurrentSession.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 30000 }
  );

  const sessionId = currentSession?.id ?? null;
  const cashierStatus = currentSession ? "open" : "closed";

  const { data: salesData } = trpc.cashRegister.getSessionSales.useQuery(
    { establishmentId: establishmentId!, sessionId: sessionId! },
    { enabled: !!establishmentId && !!sessionId, refetchInterval: 30000 }
  );

  const { data: paymentBreakdown } = trpc.cashRegister.getPaymentBreakdown.useQuery(
    { establishmentId: establishmentId!, sessionId: sessionId! },
    { enabled: !!establishmentId && !!sessionId, refetchInterval: 30000 }
  );

  // Comissões da sessão
  const { data: commissionsData } = trpc.cashRegister.getSessionCommissions.useQuery(
    { establishmentId: establishmentId!, sessionId: sessionId! },
    { enabled: !!establishmentId && !!sessionId, refetchInterval: 30000 }
  );
  // Destino da taxa de serviço
  const { data: serviceChargeDestConfig } = trpc.tableSpaces.getServiceChargeDestination.useQuery();

  const { data: movements } = trpc.cashRegister.getMovements.useQuery(
    { establishmentId: establishmentId!, sessionId: sessionId! },
    { enabled: !!establishmentId && !!sessionId, refetchInterval: 30000 }
  );

  const { data: history } = trpc.cashRegister.getHistory.useQuery(
    { establishmentId: establishmentId!, limit: 500 },
    { enabled: !!establishmentId }
  );
  // Buscar configurações de impressora para largura do papel
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;
  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      utils.printer.getSettings.invalidate();
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });
  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    if (!establishmentId) return;
    updatePrintMethodMutation.mutate({
      establishmentId,
      defaultPrintMethod: method,
    });
  };

    // Largura do recibo baseada na configuração de impressora
  const receiptWidth = useMemo(() => {
    const pw = printerSettings?.paperWidth || "80mm";
    return pw === "58mm" ? "192px" : "302px"; // 48mm ≈ 192px, 72mm ≈ 302px (at 96dpi: 1mm ≈ 3.78px)
  }, [printerSettings]);

  // Mutations
  const openMutation = trpc.cashRegister.openSession.useMutation({
    onSuccess: () => {
      toast.success("Caixa aberto com sucesso!");
      setOpeningAmount("");
      setOpeningObservation("");
      setSelectedOperator("");
      utils.cashRegister.getCurrentSession.invalidate();
      utils.cashRegister.getHistory.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const closeMutation = trpc.cashRegister.closeSession.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const sangriaMutation = trpc.cashRegister.registerSangria.useMutation({
    onSuccess: () => {
      toast.success("Sangria registrada com sucesso!");
      setShowSangriaDialog(false);
      setSangriaAmount("0,00");
      setSangriaReason("");
      utils.cashRegister.getMovements.invalidate();
      utils.cashRegister.getCurrentSession.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const printCashReceiptMutation = trpc.printer.printCashReceipt.useMutation({
    onSuccess: (data) => {
      toast.success("Recibo enviado para impressão", {
        description: `Enviado para ${data.connections} impressora(s) conectada(s).`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao imprimir recibo", {
        description: error.message,
      });
    },
  });

  const suprimentoMutation = trpc.cashRegister.registerReforco.useMutation({
    onSuccess: () => {
      toast.success("Suprimento registrado com sucesso!");
      setShowSuprimentoDialog(false);
      setSuprimentoAmount("0,00");
      setSuprimentoReason("");
      utils.cashRegister.getMovements.invalidate();
      utils.cashRegister.getCurrentSession.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Cálculos derivados
  const totalVendas = salesData?.total ?? 0;
  const salesCount = salesData?.count ?? 0;
  const totalSangrias = useMemo(() => {
    if (!movements) return 0;
    return movements.filter((m: any) => m.type === "sangria").reduce((acc: number, m: any) => acc + (parseFloat(m.amount) || 0), 0);
  }, [movements]);
  const totalSuprimentos = useMemo(() => {
    if (!movements) return 0;
    return movements.filter((m: any) => m.type === "suprimento").reduce((acc: number, m: any) => acc + (parseFloat(m.amount) || 0), 0);
  }, [movements]);
  const fundoInicial = parseFloat(currentSession?.openingAmount as any) || 0;
  const totalComissoes = commissionsData?.total ?? 0;
  const isCommissionForStaff = serviceChargeDestConfig?.destination !== "establishment";
  const saldoAtual = fundoInicial + totalVendas - totalSangrias + totalSuprimentos - (isCommissionForStaff ? totalComissoes : 0);

  // Vendas em dinheiro (para saldo esperado na gaveta)
  const vendasDinheiro = useMemo(() => {
    if (!paymentBreakdown) return 0;
    const cashEntry = paymentBreakdown.find((p: any) => p.paymentMethod === "cash");
    return cashEntry?.total ?? 0;
  }, [paymentBreakdown]);

  // Total por método para o card de Performance
  const totalPayments = useMemo(() => {
    if (!paymentBreakdown) return 0;
    return paymentBreakdown.reduce((acc: number, p: any) => acc + p.total, 0);
  }, [paymentBreakdown]);

  // Dados completos de pagamento (3 categorias agrupadas: Dinheiro, PIX, Cartão)
  const paymentDataComplete = useMemo(() => {
    const allMethods = ["cash", "pix_online", "pix", "card"];
    const dataMap: Record<string, { paymentMethod: string; count: number; total: number }> = {};
    for (const m of allMethods) {
      dataMap[m] = { paymentMethod: m, count: 0, total: 0 };
    }
    if (paymentBreakdown) {
      for (const item of paymentBreakdown) {
        if (dataMap[item.paymentMethod]) {
          dataMap[item.paymentMethod] = item;
        }
      }
    }
    return allMethods.map(m => dataMap[m]);
  }, [paymentBreakdown]);

  // Handlers
  const handleOpenCaixa = () => {
    if (!establishmentId) return;
    if (!selectedOperator) {
      toast.error("Selecione um operador");
      return;
    }
    const amount = parseFloat(openingAmount.replace(",", ".")) || 0;
    openMutation.mutate({
      establishmentId,
      openingAmount: amount,
      observation: openingObservation || undefined,
      operatorName: selectedOperator,
    });
  };

  const handleCreateOperator = () => {
    if (!establishmentId || !newOperatorName.trim()) {
      toast.error("Informe o nome do operador");
      return;
    }
    createOperatorMutation.mutate({
      establishmentId,
      name: newOperatorName.trim(),
    });
  };

  const handleCloseCaixa = () => {
    if (!establishmentId || !sessionId) return;
    const amount = closingAmount ? parseFloat(closingAmount.replace(",", ".")) : undefined;
    // Salvar dados para impressão antes de fechar
    const receiptData = {
      storeName: establishment?.name || "Estabelecimento",
      operatorName: currentSession?.operatorName || "—",
      openedAt: currentSession?.openedAt,
      closedAt: new Date(),
      openingAmount: parseFloat(currentSession?.openingAmount || "0"),
      closingAmount: amount || 0,
      salesTotal: salesData?.total || 0,
      salesCount: salesData?.count || 0,
      paymentBreakdown: paymentBreakdown || [],
      movements: movements || [],
      closingObservation: closingObservation || undefined,
    };
    closeMutation.mutate({
      establishmentId,
      sessionId,
      closingAmount: amount,
      closingObservation: closingObservation || undefined,
    }, {
      onSuccess: () => {
        toast.success("Caixa fechado com sucesso!");
        setShowCloseDialog(false);
        setClosingAmount("0,00");
        setClosingObservation("");
        utils.cashRegister.getCurrentSession.invalidate();
        utils.cashRegister.getHistory.invalidate();
        // Abrir recibo para impressão (o overlay tem botão de imprimir)
        setPrintReceiptData(receiptData);
      },
    });
  };
  const handlePrintHistoryReceipt = (session: any) => {
    const receiptData = {
      storeName: establishment?.name || "Estabelecimento",
      operatorName: session.operatorName || "—",
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingAmount: parseFloat(session.openingAmount || "0"),
      closingAmount: parseFloat(session.closingAmount || "0"),
      expectedAmount: parseFloat(session.expectedAmount || "0"),
      difference: parseFloat(session.difference || "0"),
      closingObservation: session.closingObservation || undefined,
      // For history, we don't have breakdown details, show basic info
      isHistoryPrint: true,
    };
    setPrintReceiptData(receiptData);
  };
  // Imprimir recibo do caixa atual (mesmo modelo do histórico)
  const handlePrintCurrentSession = () => {
    if (!currentSession) return;
    const receiptData = {
      storeName: establishment?.name || "Estabelecimento",
      operatorName: currentSession.operatorName || "—",
      openedAt: currentSession.openedAt,
      closedAt: null, // Caixa ainda aberto - relatório parcial
      openingAmount: parseFloat(currentSession.openingAmount || "0"),
      closingAmount: 0,
      salesTotal: salesData?.total || 0,
      salesCount: salesData?.count || 0,
      paymentBreakdown: paymentBreakdown || [],
      movements: movements || [],
      isHistoryPrint: false,
    };
    setPrintReceiptData(receiptData);
  };

  const handleSangria = () => {
    if (!establishmentId || !sessionId) return;
    const amount = parseFloat(sangriaAmount.replace(",", "."));
    if (!amount || amount <= 0) {
      toast.error("Informe o valor da sangria");
      return;
    }
    sangriaMutation.mutate({
      establishmentId,
      sessionId,
      amount,
      reason: sangriaReason || undefined,
    });
  };

  const handleSuprimento = () => {
    if (!establishmentId || !sessionId) return;
    const amount = parseFloat(suprimentoAmount.replace(",", "."));
    if (!amount || amount <= 0) {
      toast.error("Informe o valor do suprimento");
      return;
    }
    suprimentoMutation.mutate({
      establishmentId,
      sessionId,
      amount,
      reason: suprimentoReason || undefined,
    });
  };


  // Loading state - skeleton matching the page layout
  if (sessionLoading || !establishmentId) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 sm:p-6 animate-in fade-in duration-300">
          {/* Header skeleton */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
          {/* Action buttons skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          {/* Content cards skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  // ==================== RECIBO DE IMPRESSÃO (OVERLAY) ====================
  // Rendered before conditional returns so it persists even when cashierStatus changes

  // ==================== CAIXA FECHADO ====================
  if (cashierStatus === "closed" && !printReceiptData) {
    return (
      <AdminLayout>
        {/* Fundo: mesma tela do caixa aberto com dados zerados */}
        <div className="space-y-6 p-4 sm:p-6 pointer-events-none select-none">
          {/* ==================== HEADER ==================== */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <PageHeader
              title="Controle de Caixa"
              description="Gerencie abertura, fechamento, sangrias e suprimentos"
              icon={<Calculator className="h-6 w-6 text-blue-600" />}
            />
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-700"
                variant="outline"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Caixa Aberto
              </Badge>
            </div>
          </div>
          {/* ==================== CARDS DE RESUMO ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="SALDO EM CAIXA" value="R$ 0,00" icon={Eye} variant="emerald" />
            <StatCard title="TOTAL VENDAS" value="R$ 0,00" icon={TrendingUp} variant="blue" />
            <StatCard title="SANGRIAS" value="R$ 0,00" icon={ArrowUpCircle} variant="red" />
            <StatCard title="SUPRIMENTOS" value="R$ 0,00" icon={ArrowDownCircle} variant="amber" />
          </div>
          {/* ==================== AÇÕES RÁPIDAS ==================== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-12 border-red-200 text-red-600 font-medium">
              <Minus className="h-4 w-4 mr-2" />Sangria
            </Button>
            <Button variant="outline" className="h-12 border-amber-200 text-red-500 font-medium">
              <ArrowDownCircle className="h-4 w-4 mr-2" />Suprimento
            </Button>
            <Button variant="outline" className="h-12 border-blue-200 text-blue-600 font-medium">
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
            <Button variant="outline" className="h-12 border-green-200 text-green-600 font-medium">
              <Lock className="h-4 w-4 mr-2" />Fechar Caixa
            </Button>
          </div>
          {/* ==================== VENDAS + CONFERÊNCIA ==================== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <CreditCard className="h-5 w-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Vendas por forma de pagamento</h3>
                  <p className="text-xs text-muted-foreground">Distribuição das vendas do caixa atual</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {Object.entries(PAYMENT_METHOD_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                    <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: config.barColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{config.label}</p>
                      <span className="text-[11px] text-muted-foreground">0 vendas</span>
                    </div>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">R$ 0,00</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Conferência de Caixa</h3>
                  <p className="text-xs text-muted-foreground">Resumo financeiro do turno atual</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-foreground">Fundo de troco</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">R$ 0,00</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-foreground">Vendas em dinheiro</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+ R$ 0,00</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-foreground">Sangrias</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">- R$ 0,00</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-foreground">Suprimentos</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+ R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Overlay cobrindo tudo */}
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" />
        {/* Sidebar panel igual ao chat: fixed right-0 z-[70] */}
        <div className="fixed top-0 right-0 z-[70] h-full w-full sm:w-[371px] max-w-full flex flex-col bg-white dark:bg-card shadow-2xl animate-in slide-in-from-right duration-300 pointer-events-auto">
          {/* Header — gradiente vermelho PDV style */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Unlock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Abrir Caixa</h2>
                <p className="text-sm text-white/80">Informe o valor inicial</p>
              </div>
            </div>
          </div>
          {/* Conte\u00fado */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-500" />
                Dados de Abertura
              </h3>
              <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Operador <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingOperator(true)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Novo operador
                    </button>
                  </div>
                  {isCreatingOperator && (
                    <div className="mb-2 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nome do novo operador"
                          value={newOperatorName}
                          onChange={(e) => setNewOperatorName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleCreateOperator(); }}
                          autoFocus
                          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateOperator}
                          disabled={createOperatorMutation.isPending}
                          className="bg-red-500 hover:bg-red-600 text-white px-3"
                        >
                          {createOperatorMutation.isPending ? "..." : "Salvar"}
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsCreatingOperator(false); setNewOperatorName(""); }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOperatorDropdownOpen(!isOperatorDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span className={selectedOperator ? 'text-foreground' : 'text-muted-foreground'}>
                        {selectedOperator || 'Selecione o operador'}
                      </span>
                      <ChevronDown className={"h-4 w-4 text-muted-foreground transition-transform " + (isOperatorDropdownOpen ? 'rotate-180' : '')} />
                    </button>
                    {isOperatorDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-[80] bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        {operators && operators.map((op: any) => {
                          const isPrincipal = op.name === (establishment?.responsibleName || establishment?.ownerDisplayName);
                          return (
                            <div key={op.id} className={"flex items-center gap-2 px-3 py-2 hover:bg-muted/70 cursor-pointer group " + (selectedOperator === op.name ? 'bg-muted/50' : '')}>
                              <span
                                className="flex-1 text-sm text-foreground"
                                onClick={() => { setSelectedOperator(op.name); setIsOperatorDropdownOpen(false); }}
                              >
                                {op.name}
                              </span>
                              {isPrincipal ? (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Principal</span>
                              ) : (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setEditingOperatorId(op.id); setEditingOperatorName(op.name); setIsOperatorDropdownOpen(false); }}
                                    className="p-1 text-muted-foreground hover:text-blue-600 rounded"
                                    title="Editar"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); deleteOperatorMutation.mutate({ establishmentId: establishmentId!, operatorId: op.id }); if (selectedOperator === op.name) setSelectedOperator(''); setIsOperatorDropdownOpen(false); }}
                                    className="p-1 text-muted-foreground hover:text-red-600 rounded"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {(!operators || operators.length === 0) && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum operador cadastrado</div>
                        )}
                      </div>
                    )}
                  </div>
                  {editingOperatorId && (
                    <div className="mt-2 flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={editingOperatorName}
                        onChange={(e) => setEditingOperatorName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingOperatorName.trim()) {
                            updateOperatorMutation.mutate({ establishmentId: establishmentId!, operatorId: editingOperatorId, name: editingOperatorName.trim() });
                          }
                          if (e.key === 'Escape') { setEditingOperatorId(null); setEditingOperatorName(''); }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/30"
                        placeholder="Nome do operador"
                      />
                      <button type="button" onClick={() => { if (editingOperatorName.trim()) updateOperatorMutation.mutate({ establishmentId: establishmentId!, operatorId: editingOperatorId, name: editingOperatorName.trim() }); }} className="p-1.5 text-green-600 hover:text-green-700 rounded hover:bg-green-50"><Check className="h-4 w-4" /></button>
                      <button type="button" onClick={() => { setEditingOperatorId(null); setEditingOperatorName(''); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Quem está operando o caixa</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Valor Inicial (R$) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={openingAmount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const cents = parseInt(raw || '0', 10);
                      const formatted = (cents / 100).toFixed(2).replace('.', ',');
                      setOpeningAmount(formatted);
                    }}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Valor em dinheiro (troco) disponível no caixa</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Observação (opcional)</label>
                  <textarea
                    placeholder="Ex: troco fornecido pelo gerente"
                    value={openingObservation}
                    onChange={(e) => setOpeningObservation(e.target.value)}
                    onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                    rows={1}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none overflow-hidden"
                  />
                </div>
              </div>
            </div>
            {/* Último fechamento info */}
            {history && history.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-red-500" />
                  Último Fechamento
                </h3>
                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Operador:</span>
                    <span className="font-medium">{history[0].operatorName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fechado em:</span>
                    <span className="font-medium">{history[0].closedAt ? formatDateTime(history[0].closedAt) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo final:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(history[0].closingAmount || "0"))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Footer — botões de abrir e voltar */}
          <div className="p-4 border-t border-border space-y-3">
            <Button
              onClick={handleOpenCaixa}
              disabled={openMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold h-12 text-base"
            >
              <Unlock className="h-5 w-5 mr-2" />
              {openMutation.isPending ? "Abrindo..." : "Abrir Caixa"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full h-10 text-sm font-medium"
            >
              Voltar
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  // ==================== CAIXA ABERTO ====================
  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <PageHeader
            title="Controle de Caixa"
            description="Gerencie abertura, fechamento, sangrias e suprimentos"
            icon={<Calculator className="h-6 w-6 text-blue-600" />}
          />
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-700"
              variant="outline"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Caixa Aberto
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowReminderSettings(true)} title="Lembretes de Caixa"><BellRing className="h-4 w-4 text-red-500" /></Button>
          </div>
        </div>

        {/* ==================== CARDS DE RESUMO ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="SALDO EM CAIXA"
            value={showBalance ? formatCurrency(saldoAtual) : "••••••"}
            valueClassName={saldoAtual < 0 ? "text-red-500" : ""}
            icon={showBalance ? Eye : EyeOff}
            onIconClick={() => setShowBalance(!showBalance)}
            variant="emerald"
          />
          <StatCard
            title="TOTAL VENDAS"
            value={formatCurrency(totalVendas)}
            icon={TrendingUp}
            variant="blue"
            trend={salesCount > 0 ? { value: salesCount, isPositive: true, label: "vendas" } : undefined}
          />
          <StatCard
            title="SANGRIAS"
            value={formatCurrency(totalSangrias)}
            icon={ArrowUpCircle}
            variant="red"
          />
          <StatCard
            title="SUPRIMENTOS"
            value={formatCurrency(totalSuprimentos)}
            icon={ArrowDownCircle}
            variant="amber"
          />
        </div>

        {/* ==================== AÇÕES RÁPIDAS ==================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            onClick={() => setShowSangriaDialog(true)}
            variant="outline"
            className="h-12 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 font-medium"
          >
            <Minus className="h-4 w-4 mr-2" />
            Sangria
          </Button>
          <Button
            onClick={() => setShowSuprimentoDialog(true)}
            variant="outline"
            className="h-12 border-amber-200 text-red-500 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30 font-medium"
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Suprimento
          </Button>
          <Button
            onClick={handlePrintCurrentSession}
            variant="outline"
            className="h-12 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30 font-medium"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={() => setShowCloseDialog(true)}
            variant="outline"
            className="h-12 border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30 font-medium"
          >
            <Lock className="h-4 w-4 mr-2" />
            Fechar Caixa
          </Button>
        </div>

        {/* ==================== VENDAS POR FORMA DE PAGAMENTO + CONFERÊNCIA ==================== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Vendas por forma de pagamento */}
          <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-foreground">Vendas por forma de pagamento</h3>
                <p className="text-xs text-muted-foreground">Distribuição das vendas do caixa atual</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowFeeSheet(true)}>
                <Settings className="h-3.5 w-3.5" />
                Taxas
              </Button>
            </div>

            {/* Sempre mostra todas as formas de pagamento */}
            <>
              {/* Barra empilhada - só mostra se tem vendas */}
              {totalPayments > 0 && (
                <div className="flex h-8 rounded-lg overflow-hidden mb-5">
                  {paymentDataComplete.map((item: any) => {
                    const percentage = totalPayments > 0 ? Math.round((item.total / totalPayments) * 100) : 0;
                    const config = PAYMENT_METHOD_CONFIG[item.paymentMethod] || { barColor: '#6b7280' };
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={item.paymentMethod}
                        className="relative transition-colors duration-500 flex items-center justify-center"
                        style={{ width: `${percentage}%`, backgroundColor: config.barColor }}
                      >
                        {percentage >= 10 && <span className="text-[11px] font-semibold text-white">{percentage}%</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Linhas - sempre mostra todas */}
              <div className="flex flex-col gap-2.5">
                {paymentDataComplete.map((item: any) => {
                  const percentage = totalPayments > 0 ? Math.round((item.total / totalPayments) * 100) : 0;
                  const config = PAYMENT_METHOD_CONFIG[item.paymentMethod] || { label: item.paymentMethod, barColor: '#6b7280' };
                  return (
                    <div key={item.paymentMethod} className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: config.barColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">{config.label}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{item.count} vendas</span>
                          <span className="text-[11px] text-muted-foreground">{percentage}% do total</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatCurrency(item.total)}</span>
                        {(() => {
                          const feePercent = item.paymentMethod === 'pix_online' ? feeData?.feePixOnline
                            : item.paymentMethod === 'pix' ? feeData?.feePixStatic
                            : item.paymentMethod === 'card' ? feeData?.feeCard
                            : null;
                          if (feePercent && item.total > 0) {
                            const netValue = item.total * (1 - feePercent / 100);
                            return (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                -{feePercent.toFixed(1).replace('.', ',')}% = <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(netValue)}</span> líquido
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          </div>

          {/* Conferência de Caixa */}
          <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Conferência de Caixa</h3>
                <p className="text-xs text-muted-foreground">Resumo financeiro do turno atual</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Fundo de troco</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{formatCurrency(fundoInicial)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Vendas em dinheiro</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">+ {formatCurrency(vendasDinheiro)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Sangrias</span>
                </div>
                <span className="text-sm font-semibold text-red-600">- {formatCurrency(totalSangrias)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Suprimentos</span>
                </div>
                <span className="text-sm font-semibold text-red-500">+ {formatCurrency(totalSuprimentos)}</span>
              </div>
              <div className="border-t border-border/50 my-2" />
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Saldo esperado na gaveta</span>
                </div>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(fundoInicial + vendasDinheiro - totalSangrias + totalSuprimentos)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== ABAS: VENDAS / MOVIMENTAÇÕES / TURNO ==================== */}
        <div>
          <div className="border-b border-border/60 mb-6">
            <nav className="flex gap-0 -mb-px items-center">
              {/* Abas sempre visíveis */}
              <button
                onClick={() => setActiveHistoryTab("vendas")}
                className={`relative whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-medium transition-colors ${activeHistoryTab === "vendas" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
              >
                Vendas
                {activeHistoryTab === "vendas" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />}
              </button>
              <button
                onClick={() => setActiveHistoryTab("movimentacoes")}
                className={`relative whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-medium transition-colors ${activeHistoryTab === "movimentacoes" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
              >
                Movimentações
                {activeHistoryTab === "movimentacoes" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />}
              </button>
              {isCommissionForStaff && (
                <button
                  onClick={() => setActiveHistoryTab("comissoes")}
                  className={`relative whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-medium transition-colors hidden sm:block ${activeHistoryTab === "comissoes" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  Comissões
                  {activeHistoryTab === "comissoes" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />}
                </button>
              )}
              {/* Abas visíveis apenas no desktop */}
              <button
                onClick={() => setActiveHistoryTab("historico")}
                className={`relative whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-medium transition-colors hidden sm:block ${activeHistoryTab === "historico" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
              >
                Histórico
                {activeHistoryTab === "historico" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />}
              </button>
              <button
                onClick={() => setActiveHistoryTab("turno")}
                className={`relative whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-medium transition-colors hidden sm:block ${activeHistoryTab === "turno" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
              >
                Turno
                {activeHistoryTab === "turno" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />}
              </button>
              {/* Dropdown "Mais" visível apenas no mobile */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors flex items-center gap-1 ${["comissoes", "historico", "turno"].includes(activeHistoryTab) ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}>
                      {activeHistoryTab === "comissoes" ? "Comissões" : activeHistoryTab === "historico" ? "Histórico" : activeHistoryTab === "turno" ? "Turno" : "Mais"}
                      <ChevronDown className="h-3.5 w-3.5" />
                      {["comissoes", "historico", "turno"].includes(activeHistoryTab) && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    {isCommissionForStaff && (
                      <DropdownMenuItem onClick={() => setActiveHistoryTab("comissoes")} className={activeHistoryTab === "comissoes" ? "bg-accent" : ""}>
                        Comissões
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setActiveHistoryTab("historico")} className={activeHistoryTab === "historico" ? "bg-accent" : ""}>
                      Histórico
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveHistoryTab("turno")} className={activeHistoryTab === "turno" ? "bg-accent" : ""}>
                      Turno
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>
          </div>

          {/* Tab: Vendas */}
          {activeHistoryTab === "vendas" && (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {salesData?.sales && salesData.sales.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pedido</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Horário</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Origem</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const salesList = salesData.sales;
                          const salesTotalPages = Math.max(1, Math.ceil(salesList.length / SALES_PAGE_SIZE));
                          const salesStart = (salesPage - 1) * SALES_PAGE_SIZE;
                          const salesEnd = salesStart + SALES_PAGE_SIZE;
                          const paginatedSales = salesList.slice(salesStart, salesEnd);
                          return paginatedSales;
                        })().map((sale: any) => {
                          const config = PAYMENT_METHOD_CONFIG[sale.paymentMethod] || { label: sale.paymentMethod, icon: Receipt, color: "text-gray-600" };
                          const IconComp = config.icon;
                          return (
                            <tr key={sale.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {sale.orderNumber}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">Pedido {sale.orderNumber}</p>
                                    {sale.customerName && <p className="text-xs text-muted-foreground">{sale.customerName}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">{formatTime(sale.createdAt)}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 shrink-0">
                                  <IconComp className={cn("h-4 w-4", config.color)} />
                                  <span className="text-sm">{config.label}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground capitalize">{sale.source === 'pdv' ? 'PDV' : sale.source === 'internal' ? 'Menu' : sale.source}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="text-sm font-semibold text-green-600">{formatCurrency(parseFloat(sale.total))}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer com paginação */}
                  <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {Math.min((salesPage - 1) * SALES_PAGE_SIZE + 1, salesData.sales.length)}-{Math.min(salesPage * SALES_PAGE_SIZE, salesData.sales.length)} de {salesData.sales.length} vendas
                    </p>
                    {salesData.sales.length > SALES_PAGE_SIZE && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={salesPage <= 1} onClick={() => setSalesPage(p => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-xs ml-1">Anterior</span>
                        </Button>
                        <span className="text-xs text-muted-foreground">{salesPage} / {Math.ceil(salesData.sales.length / SALES_PAGE_SIZE)}</span>
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={salesPage >= Math.ceil(salesData.sales.length / SALES_PAGE_SIZE)} onClick={() => setSalesPage(p => p + 1)}>
                          <span className="text-xs mr-1">Próxima</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">Nenhuma venda registrada</p>
                  <p className="text-sm mt-1">As vendas deste turno aparecerão aqui</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Movimentações */}
          {activeHistoryTab === "movimentacoes" && (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {movements && movements.filter((m: any) => m.type !== "comissao").length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Motivo</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Horário</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Operador</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const movList = movements.filter((m: any) => m.type !== "comissao");
                          const movTotalPages = Math.max(1, Math.ceil(movList.length / MOV_PAGE_SIZE));
                          const movStart = (movPage - 1) * MOV_PAGE_SIZE;
                          const movEnd = movStart + MOV_PAGE_SIZE;
                          const paginatedMov = movList.slice(movStart, movEnd);
                          return paginatedMov;
                        })().map((mov: any) => {
                          const isSangria = mov.type === "sangria";
                          return (
                            <tr key={mov.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", isSangria ? "bg-red-50 dark:bg-red-500/10" : "bg-amber-50 dark:bg-amber-500/10")}>
                                    {isSangria ? <ArrowUpCircle className="h-4 w-4 text-red-600" /> : <ArrowDownCircle className="h-4 w-4 text-red-500" />}
                                  </div>
                                  <span className="font-medium text-sm">{isSangria ? "Sangria" : "Suprimento"}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">{mov.reason || "—"}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">{formatTime(mov.createdAt)}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">{mov.operatorName || "—"}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className={cn("text-sm font-semibold", isSangria ? "text-red-600" : "text-red-500")}>
                                  {isSangria ? "- " : "+ "}{formatCurrency(parseFloat(mov.amount))}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer com paginação */}
                  <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {Math.min((movPage - 1) * MOV_PAGE_SIZE + 1, movements.filter((m: any) => m.type !== "comissao").length)}-{Math.min(movPage * MOV_PAGE_SIZE, movements.filter((m: any) => m.type !== "comissao").length)} de {movements.filter((m: any) => m.type !== "comissao").length} movimentações
                    </p>
                    {movements.filter((m: any) => m.type !== "comissao").length > MOV_PAGE_SIZE && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={movPage <= 1} onClick={() => setMovPage(p => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-xs ml-1">Anterior</span>
                        </Button>
                        <span className="text-xs text-muted-foreground">{movPage} / {Math.ceil(movements.filter((m: any) => m.type !== "comissao").length / MOV_PAGE_SIZE)}</span>
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={movPage >= Math.ceil(movements.filter((m: any) => m.type !== "comissao").length / MOV_PAGE_SIZE)} onClick={() => setMovPage(p => p + 1)}>
                          <span className="text-xs mr-1">Próxima</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <History className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">Nenhuma movimentação registrada</p>
                  <p className="text-sm mt-1">Sangrias e suprimentos deste turno aparecerão aqui</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Historico */}
          {activeHistoryTab === "historico" && (() => {
            const historyList = history || [];
            const historyTotalPages = Math.max(1, Math.ceil(historyList.length / HISTORY_PAGE_SIZE));
            const historyStart = (historyPage - 1) * HISTORY_PAGE_SIZE;
            const historyEnd = historyStart + HISTORY_PAGE_SIZE;
            const paginatedHistory = historyList.slice(historyStart, historyEnd);
            return (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {historyList.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Operador</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Abertura</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fechamento</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Fundo</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHistory.map((session: any) => (
                          <tr key={session.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${session.status === "open" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${session.status === "open" ? "bg-emerald-500" : "bg-gray-400"}`} />
                                {session.status === "open" ? "Aberto" : "Fechado"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground font-medium">{session.operatorName}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{session.openedAt ? formatDateTime(session.openedAt) : "—"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{session.closedAt ? formatDateTime(session.closedAt) : "—"}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-foreground">{formatCurrency(parseFloat(session.openingAmount || "0"))}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="outline" size="sm" className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handlePrintHistoryReceipt(session)}>
                                <Printer className="h-3.5 w-3.5 mr-1" />
                                Imprimir
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{historyStart + 1}-{Math.min(historyEnd, historyList.length)} de {historyList.length} sessões</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 px-2" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-xs ml-1">Anterior</span>
                      </Button>
                      <span className="text-xs text-muted-foreground">{historyPage} / {historyTotalPages}</span>
                      <Button variant="outline" size="sm" className="h-7 px-2" disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(p => p + 1)}>
                        <span className="text-xs mr-1">Próxima</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Nenhum histórico encontrado</p>
                </div>
              )}
            </div>
            );
          })()}
          {/* Tab: Turno */}
          {activeHistoryTab === "turno" && (
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Informações do Turno</h3>
                  <p className="text-xs text-muted-foreground">Dados da sessão atual do caixa</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Operador</p>
                    <p className="text-sm font-semibold text-foreground">{currentSession?.operatorName || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Abertura</p>
                    <p className="text-sm font-semibold text-foreground">{currentSession?.openedAt ? formatDateTime(currentSession.openedAt) : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total de vendas</p>
                    <p className="text-sm font-semibold text-foreground">{salesCount} vendas</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeHistoryTab === "comissoes" && isCommissionForStaff && (
            <div className="space-y-4">
              {/* Card resumo */}
              {commissionsData?.commissions && commissionsData.commissions.length > 0 && (
                <div className="bg-card rounded-xl border border-border/50 p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                      <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">Comissões (Garçons)</h3>
                      <p className="text-xs text-muted-foreground">Deduzido do saldo do caixa</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-9 w-9 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total</p>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(totalComissoes)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Hash className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Registros</p>
                        <p className="text-sm font-semibold text-foreground">{commissionsData?.count ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Tabela de comissões */}
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {commissionsData?.commissions && commissionsData.commissions.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comissão</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Horário</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const commList = commissionsData.commissions;
                          const commStart = (commPage - 1) * COMM_PAGE_SIZE;
                          const commEnd = commStart + COMM_PAGE_SIZE;
                          const paginatedComm = commList.slice(commStart, commEnd);
                          return paginatedComm;
                        })().map((c: any) => (
                          <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{c.reason || "Taxa de serviço"}</p>
                                  <p className="text-xs text-muted-foreground">Garçons</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </td>
                            <td className="p-4">
                              {(() => {
                                const pm = c.paymentMethod || "cash";
                                const pmMap: Record<string, string> = { dinheiro: "cash", cartao_credito: "card", cartao_debito: "card", pix_estatico: "pix" };
                                const mapped = pmMap[pm] || pm;
                                const config = PAYMENT_METHOD_CONFIG[mapped] || { label: pm, icon: Banknote, color: "text-gray-600" };
                                const Icon = config.icon;
                                return (
                                  <div className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                    <span className="text-sm">{config.label}</span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-sm font-semibold text-red-600">{formatCurrency(parseFloat(c.amount))}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer com paginação */}
                  <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {Math.min((commPage - 1) * COMM_PAGE_SIZE + 1, commissionsData.commissions.length)}-{Math.min(commPage * COMM_PAGE_SIZE, commissionsData.commissions.length)} de {commissionsData.commissions.length} comissões
                    </p>
                    {commissionsData.commissions.length > COMM_PAGE_SIZE && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={commPage <= 1} onClick={() => setCommPage(p => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-xs ml-1">Anterior</span>
                        </Button>
                        <span className="text-xs text-muted-foreground">{commPage} / {Math.ceil(commissionsData.commissions.length / COMM_PAGE_SIZE)}</span>
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={commPage >= Math.ceil(commissionsData.commissions.length / COMM_PAGE_SIZE)} onClick={() => setCommPage(p => p + 1)}>
                          <span className="text-xs mr-1">Próxima</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Receipt className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">Nenhuma comissão registrada neste turno</p>
                  <p className="text-sm mt-1">Comissões são registradas automaticamente ao fechar mesas</p>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== DIALOG: FECHAR CAIXA ==================== */}
      {/* ==================== SIDEBAR: FECHAR CAIXA ==================== */}
      {showCloseDialog && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={() => setShowCloseDialog(false)} />
          <div className="fixed top-0 right-0 z-[70] h-full w-full sm:w-[371px] max-w-full flex flex-col bg-white dark:bg-card shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">Fechar Caixa</h2>
                  <p className="text-sm text-white/80">Informe o valor contado na gaveta</p>
                </div>
                <button onClick={() => setShowCloseDialog(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  Conferência
                </h3>
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor contado na gaveta (R$)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={closingAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const cents = parseInt(raw || '0', 10);
                        const formatted = (cents / 100).toFixed(2).replace('.', ',');
                        setClosingAmount(formatted);
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-lg font-semibold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação (opcional)</label>
                    <textarea
                      placeholder="Ex: conferido por João"
                      value={closingObservation}
                      onChange={(e) => setClosingObservation(e.target.value)}
                      onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none overflow-hidden"
                    />
                  </div>
                </div>
              </div>
              {/* Resumo do caixa */}
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-red-500" />
                  Resumo do Turno
                </h3>
                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Operador:</span>
                    <span className="font-medium">{currentSession?.operatorName || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fundo de troco:</span>
                    <span className="font-medium">{formatCurrency(fundoInicial)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total vendas:</span>
                    <span className="font-medium text-emerald-600">+ {formatCurrency(totalVendas)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sangrias:</span>
                    <span className="font-medium text-red-500">- {formatCurrency(totalSangrias)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suprimentos:</span>
                    <span className="font-medium text-red-500">+ {formatCurrency(totalSuprimentos)}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-foreground">Saldo esperado:</span>
                      <span className="text-foreground">{formatCurrency(saldoAtual)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <Button
                onClick={handleCloseCaixa}
                disabled={closeMutation.isPending}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold h-12 text-base"
              >
                <Lock className="h-5 w-5 mr-2" />
                {closeMutation.isPending ? "Fechando..." : "Fechar Caixa"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                className="w-full h-10 text-sm font-medium"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}
      {/* ==================== SIDEBAR: SANGRIA ==================== */}
      {showSangriaDialog && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={() => setShowSangriaDialog(false)} />
          <div className="fixed top-0 right-0 z-[70] h-full w-full sm:w-[371px] max-w-full flex flex-col bg-white dark:bg-card shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ArrowUpCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">Registrar Sangria</h2>
                  <p className="text-sm text-white/80">Retire um valor do caixa</p>
                </div>
                <button onClick={() => setShowSangriaDialog(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-500" />
                  Dados da Sangria
                </h3>
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor (R$) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={sangriaAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const cents = parseInt(raw || '0', 10);
                        const formatted = (cents / 100).toFixed(2).replace('.', ',');
                        setSangriaAmount(formatted);
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-lg font-semibold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo (opcional)</label>
                    <textarea
                      placeholder="Ex: pagamento de fornecedor"
                      value={sangriaReason}
                      onChange={(e) => setSangriaReason(e.target.value)}
                      onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none overflow-hidden"
                    />
                  </div>
                </div>
              </div>
              {/* Info do saldo */}
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-500" />
                  Saldo Atual
                </h3>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo em caixa:</span>
                    <span className="font-bold text-foreground">{formatCurrency(saldoAtual)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <Button
                onClick={handleSangria}
                disabled={sangriaMutation.isPending}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold h-12 text-base"
              >
                <ArrowUpCircle className="h-5 w-5 mr-2" />
                {sangriaMutation.isPending ? "Registrando..." : "Confirmar Sangria"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSangriaDialog(false)}
                className="w-full h-10 text-sm font-medium"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}
      {/* ==================== SIDEBAR: SUPRIMENTO ==================== */}
      {showSuprimentoDialog && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={() => setShowSuprimentoDialog(false)} />
          <div className="fixed top-0 right-0 z-[70] h-full w-full sm:w-[371px] max-w-full flex flex-col bg-white dark:bg-card shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ArrowDownCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">Registrar Suprimento</h2>
                  <p className="text-sm text-white/80">Adicione um valor ao caixa</p>
                </div>
                <button onClick={() => setShowSuprimentoDialog(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-red-500" />
                  Dados do Suprimento
                </h3>
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor (R$) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={suprimentoAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const cents = parseInt(raw || '0', 10);
                        const formatted = (cents / 100).toFixed(2).replace('.', ',');
                        setSuprimentoAmount(formatted);
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-lg font-semibold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo (opcional)</label>
                    <textarea
                      placeholder="Ex: reforço de troco"
                      value={suprimentoReason}
                      onChange={(e) => setSuprimentoReason(e.target.value)}
                      onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none overflow-hidden"
                    />
                  </div>
                </div>
              </div>
              {/* Info do saldo */}
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-500" />
                  Saldo Atual
                </h3>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo em caixa:</span>
                    <span className="font-bold text-foreground">{formatCurrency(saldoAtual)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <Button
                onClick={handleSuprimento}
                disabled={suprimentoMutation.isPending}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold h-12 text-base"
              >
                <ArrowDownCircle className="h-5 w-5 mr-2" />
                {suprimentoMutation.isPending ? "Registrando..." : "Confirmar Suprimento"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSuprimentoDialog(false)}
                className="w-full h-10 text-sm font-medium"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}
            {/* Sheet de Lembretes de Caixa */}
      <Sheet open={showReminderSettings} onOpenChange={setShowReminderSettings}>
        <SheetContent
          className="sm:max-w-[400px] w-full p-0 overflow-hidden flex flex-col"
          hideCloseButton
        >
          <SheetTitle className="sr-only">Lembretes de Caixa</SheetTitle>
          <SheetDescription className="sr-only">Configure lembretes de abertura e fechamento</SheetDescription>
          {/* Header — gradiente vermelho PDV style */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BellRing className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Lembretes de Caixa</h2>
                  <p className="text-sm text-white/80">Configure alertas de abertura e fechamento</p>
                </div>
              </div>
              <button onClick={() => setShowReminderSettings(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6 bg-card">
            <CashReminderSettings establishmentId={establishmentId} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de configuração de taxas */}

      {/* ==================== SIDEBAR: IMPRIMIR RECIBO ==================== */}
      {printReceiptData && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={() => setPrintReceiptData(null)} />
          <div className="fixed top-0 right-0 z-[70] h-full w-full sm:w-[420px] max-w-full flex flex-col bg-white dark:bg-card shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Printer className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">{printReceiptData.closedAt ? "Recibo do Caixa" : "Relatório Parcial"}</h2>
                  <p className="text-sm text-white/80">{printReceiptData.closedAt ? "Visualize e imprima o fechamento" : "Conferência do turno atual"}</p>
                </div>
                <button onClick={() => setPrintReceiptData(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            {/* Conteúdo - Recibo */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white dark:bg-background border border-border rounded-xl p-5 font-mono text-sm" style={{ width: "100%" }}>
                <div className="text-center font-bold text-base mb-1">{printReceiptData.storeName}</div>
                <div className="text-center text-xs text-muted-foreground mb-2">CONTROLE DE CAIXA</div>
                <div className="border-t border-dashed border-border my-2"></div>
                <div className="text-center font-bold text-sm mb-2">{printReceiptData.closedAt ? "FECHAMENTO DE CAIXA" : "RELATÓRIO PARCIAL"}</div>
                <div className="border-t border-dashed border-border my-2"></div>
                <div className="font-bold text-xs mb-1">INFORMAÇÕES DO TURNO</div>
                <div className="flex justify-between text-xs py-0.5"><span>Operador:</span><span className="font-semibold">{printReceiptData.operatorName}</span></div>
                <div className="flex justify-between text-xs py-0.5"><span>Abertura:</span><span>{printReceiptData.openedAt ? new Date(printReceiptData.openedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014"}</span></div>
                <div className="flex justify-between text-xs py-0.5"><span>Fechamento:</span><span>{printReceiptData.closedAt ? new Date(printReceiptData.closedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014"}</span></div>
                {printReceiptData.openedAt && printReceiptData.closedAt && (
                  <div className="flex justify-between text-xs py-0.5"><span>Duração:</span><span>{(() => { const diff = Math.floor((new Date(printReceiptData.closedAt).getTime() - new Date(printReceiptData.openedAt).getTime()) / 60000); const h = Math.floor(diff / 60); const m = diff % 60; return `${h}h ${m}min`; })()}</span></div>
                )}
                <div className="border-t border-dashed border-border my-2"></div>
                {!printReceiptData.isHistoryPrint && printReceiptData.paymentBreakdown && (
                  <>
                    <div className="font-bold text-xs mb-1">RESUMO FINANCEIRO</div>
                    <div className="flex justify-between text-xs py-0.5"><span>Fundo de Caixa:</span><span>{formatCurrency(printReceiptData.openingAmount)}</span></div>
                    {printReceiptData.paymentBreakdown.map((item: any, idx: number) => (
                      <div className="flex justify-between text-xs py-0.5" key={idx}>
                        <span>Vendas {item.paymentMethod === "cash" ? "Dinheiro" : item.paymentMethod === "pix_online" ? "Pix online" : item.paymentMethod === "pix" ? "Pix estático" : "Cartão"}{item.count > 0 ? ` (${item.count}x)` : ""}:</span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-border my-2"></div>
                    <div className="flex justify-between text-xs py-0.5 font-bold"><span>Total Vendas ({printReceiptData.salesCount}x):</span><span>{formatCurrency(printReceiptData.salesTotal)}</span></div>
                    {printReceiptData.movements && printReceiptData.movements.length > 0 && (() => {
                      const sangrias = printReceiptData.movements.filter((m: any) => m.type === "sangria");
                      const suprimentos = printReceiptData.movements.filter((m: any) => m.type === "suprimento");
                      const totalSangrias = sangrias.reduce((acc: number, m: any) => acc + parseFloat(m.amount || "0"), 0);
                      const totalSuprimentos = suprimentos.reduce((acc: number, m: any) => acc + parseFloat(m.amount || "0"), 0);
                      return (
                        <>
                          {totalSangrias > 0 && <div className="flex justify-between text-xs py-0.5"><span>Sangrias ({sangrias.length}x):</span><span>- {formatCurrency(totalSangrias)}</span></div>}
                          {totalSuprimentos > 0 && <div className="flex justify-between text-xs py-0.5"><span>Suprimentos ({suprimentos.length}x):</span><span>+ {formatCurrency(totalSuprimentos)}</span></div>}
                        </>
                      );
                    })()}
                    <div className="border-t border-dashed border-border my-2"></div>
                    {isCommissionForStaff && totalComissoes > 0 && (
                      <>
                        <div className="font-bold text-xs mb-1 text-amber-600">COMISSÕES (GARÇONS)</div>
                        <div className="flex justify-between text-xs py-0.5"><span>Taxa de serviço ({commissionsData?.count ?? 0}x):</span><span className="text-amber-600">- {formatCurrency(totalComissoes)}</span></div>
                        <div className="border-t border-dashed border-border my-2"></div>
                      </>
                    )}
                    <div className="flex justify-between text-xs py-1 px-2 bg-foreground text-background font-bold rounded"><span>SALDO FINAL:</span><span>{formatCurrency(printReceiptData.closingAmount || 0)}</span></div>
                    {printReceiptData.salesCount > 0 && (
                      <>
                        <div className="border-t border-dashed border-border my-2"></div>
                        <div className="flex justify-between text-xs py-0.5"><span>Pedidos atendidos:</span><span className="font-semibold">{printReceiptData.salesCount}</span></div>
                        <div className="flex justify-between text-xs py-0.5"><span>Ticket médio:</span><span>{formatCurrency(printReceiptData.salesTotal / printReceiptData.salesCount)}</span></div>
                      </>
                    )}
                  </>
                )}
                {printReceiptData.isHistoryPrint && (
                  <>
                    <div className="font-bold text-xs mb-1">RESUMO</div>
                    <div className="flex justify-between text-xs py-0.5"><span>Fundo de Caixa:</span><span>{formatCurrency(printReceiptData.openingAmount)}</span></div>
                    {printReceiptData.expectedAmount > 0 && (
                      <div className="flex justify-between text-xs py-0.5"><span>Valor Esperado:</span><span>{formatCurrency(printReceiptData.expectedAmount)}</span></div>
                    )}
                    <div className="flex justify-between text-xs py-0.5"><span>Valor Conferido:</span><span>{formatCurrency(printReceiptData.closingAmount)}</span></div>
                    <div className="border-t border-dashed border-border my-2"></div>
                    <div className="flex justify-between text-xs py-1 px-2 bg-foreground text-background font-bold rounded"><span>DIFERENÇA:</span><span>{formatCurrency(printReceiptData.difference)}</span></div>
                  </>
                )}
                {printReceiptData.closingObservation && (
                  <>
                    <div className="border-t border-dashed border-border my-2"></div>
                    <div className="font-bold text-xs mb-1">OBSERVAÇÃO</div>
                    <div className="text-xs text-muted-foreground">{printReceiptData.closingObservation}</div>
                  </>
                )}
                <div className="border-t border-dashed border-border my-2"></div>
                <div className="text-center text-[10px] text-muted-foreground">Documento gerado automaticamente<br/>www.mindi.com.br</div>
              </div>
              {/* Informativo de relatório parcial */}
              {!printReceiptData.closedAt && !printReceiptData.isHistoryPrint && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Relatório Parcial</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Este é um relatório parcial do turno. O caixa ainda está aberto e os valores podem mudar até o fechamento definitivo.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-12 text-base">
                    <Printer className="h-5 w-5 mr-2" />
                    Imprimir
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-72 z-[100]">
                  <div className="flex items-center justify-between px-2 py-2 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                    const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = 'none';
                  document.body.appendChild(iframe);
                  const doc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (doc) {
                    doc.open();
                    doc.write(`<html><head><title>Recibo</title><style>body{font-family:monospace;font-size:12px;padding:20px;max-width:300px;margin:0 auto}.row{display:flex;justify-content:space-between;padding:2px 0}.bold{font-weight:bold}.divider{border-top:1px dashed #ccc;margin:8px 0}.center{text-align:center}.total-box{background:#000;color:#fff;padding:4px 8px;border-radius:4px;display:flex;justify-content:space-between;font-weight:bold}.small{font-size:10px;color:#999}</style></head><body>`);
                    doc.write(`<div class="center bold" style="font-size:14px">${printReceiptData.storeName}</div>`);
                    doc.write(`<div class="center small">CONTROLE DE CAIXA</div>`);
                    doc.write(`<div class="divider"></div>`);
                    doc.write(`<div class="center bold">${printReceiptData.closedAt ? "FECHAMENTO DE CAIXA" : "RELATÓRIO PARCIAL"}</div>`);
                    doc.write(`<div class="divider"></div>`);
                    doc.write(`<div class="bold">INFORMA\u00c7\u00d5ES DO TURNO</div>`);
                    doc.write(`<div class="row"><span>Operador:</span><span class="bold">${printReceiptData.operatorName}</span></div>`);
                    doc.write(`<div class="row"><span>Abertura:</span><span>${printReceiptData.openedAt ? new Date(printReceiptData.openedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014"}</span></div>`);
                    doc.write(`<div class="row"><span>Fechamento:</span><span>${printReceiptData.closedAt ? new Date(printReceiptData.closedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014"}</span></div>`);
                    doc.write(`<div class="divider"></div>`);
                    if (!printReceiptData.isHistoryPrint && printReceiptData.paymentBreakdown) {
                      doc.write(`<div class="bold">RESUMO FINANCEIRO</div>`);
                      doc.write(`<div class="row"><span>Fundo de Caixa:</span><span>${formatCurrency(printReceiptData.openingAmount)}</span></div>`);
                      printReceiptData.paymentBreakdown.forEach((item: any) => {
                        const label = item.paymentMethod === "cash" ? "Dinheiro" : item.paymentMethod === "pix_online" ? "Pix online" : item.paymentMethod === "pix" ? "Pix est\u00e1tico" : "Cart\u00e3o";
                        doc.write(`<div class="row"><span>Vendas ${label}${item.count > 0 ? ` (${item.count}x)` : ""}:</span><span>${formatCurrency(item.total)}</span></div>`);
                      });
                      doc.write(`<div class="divider"></div>`);
                      doc.write(`<div class="row bold"><span>Total Vendas (${printReceiptData.salesCount}x):</span><span>${formatCurrency(printReceiptData.salesTotal)}</span></div>`);
                      doc.write(`<div class="divider"></div>`);
                      if (isCommissionForStaff && totalComissoes > 0) {
                        doc.write(`<div class="row" style="color:#d97706"><span>Comissões garçons (${commissionsData?.count ?? 0}x):</span><span>- ${formatCurrency(totalComissoes)}</span></div>`);
                        doc.write(`<div class="divider"></div>`);
                      }
                      doc.write(`<div class="total-box"><span>SALDO FINAL:</span><span>${formatCurrency(printReceiptData.closingAmount || 0)}</span></div>`);
                    }
                    if (printReceiptData.isHistoryPrint) {
                      doc.write(`<div class="bold">RESUMO</div>`);
                      doc.write(`<div class="row"><span>Fundo de Caixa:</span><span>${formatCurrency(printReceiptData.openingAmount)}</span></div>`);
                      doc.write(`<div class="row"><span>Valor Conferido:</span><span>${formatCurrency(printReceiptData.closingAmount)}</span></div>`);
                      doc.write(`<div class="divider"></div>`);
                      doc.write(`<div class="total-box"><span>DIFEREN\u00c7A:</span><span>${formatCurrency(printReceiptData.difference)}</span></div>`);
                    }
                    doc.write(`<div class="divider"></div>`);
                    doc.write(`<div class="center small">Documento gerado automaticamente<br/>www.mindi.com.br</div>`);
                    doc.write(`</body></html>`);
                    doc.close();
                    setTimeout(() => {
                      iframe.contentWindow?.print();
                      setTimeout(() => document.body.removeChild(iframe), 1000);
                    }, 250);
                  }
                  }}>
                    <div className="flex items-center">
                      <Printer className="h-4 w-4 mr-2" />
                      <span className="text-sm">Impressão Normal</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoritePrintMethod('normal');
                      }}
                      className="p-1 hover:bg-accent-foreground/10 rounded"
                      title="Definir como impressão padrão"
                    >
                      <Star 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          printerSettings?.defaultPrintMethod === 'normal' 
                            ? "fill-amber-500 text-amber-500" 
                            : "text-amber-500"
                        )} 
                      />
                    </button>
                  </div>
                  {hasMindiPrinterApiKey && (
                    <div className="flex items-center justify-between px-2 py-2 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                      if (!establishmentId || !printReceiptData) return;
                      printCashReceiptMutation.mutate({
                        establishmentId,
                        storeName: printReceiptData.storeName || "Estabelecimento",
                        operatorName: printReceiptData.operatorName || "—",
                        openedAt: printReceiptData.openedAt ? new Date(printReceiptData.openedAt).toISOString() : null,
                        closedAt: printReceiptData.closedAt ? new Date(printReceiptData.closedAt).toISOString() : null,
                        openingAmount: printReceiptData.openingAmount || 0,
                        closingAmount: printReceiptData.closingAmount || 0,
                        salesTotal: printReceiptData.salesTotal || 0,
                        salesCount: printReceiptData.salesCount || 0,
                        paymentBreakdown: (printReceiptData.paymentBreakdown || []).map((p: any) => ({
                          method: p.method || p.paymentMethod || "",
                          total: typeof p.total === "number" ? p.total : parseFloat(p.total || "0"),
                          count: p.count || 0,
                        })),
                        movements: (printReceiptData.movements || []).map((m: any) => ({
                          type: m.type || "",
                          amount: String(m.amount || "0"),
                          reason: m.reason || null,
                          createdAt: m.createdAt || null,
                        })),
                        commissionsTotal: totalComissoes,
                        commissionsCount: commissionsData?.count ?? 0,
                        commissionDestination: serviceChargeDestConfig?.destination || "staff",
                      });
                    }}>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                          <span className="text-sm">Impressão Automática</span>
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">Mindi</span>
                        </div>
                        <span className="text-[11px] text-gray-400 ml-6">Enviar para impressora</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavoritePrintMethod('automatic');
                        }}
                        className="p-1 hover:bg-accent-foreground/10 rounded"
                        title="Definir como impressão padrão"
                      >
                        <Star 
                          className={cn(
                            "h-4 w-4 transition-colors",
                            printerSettings?.defaultPrintMethod === 'automatic' 
                              ? "fill-amber-500 text-amber-500" 
                              : "text-amber-500"
                          )} 
                        />
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => setPrintReceiptData(null)}
                className="w-full h-10 text-sm font-medium"
              >
                Fechar
              </Button>
            </div>
          </div>
        </>
      )}

      <Sheet open={showFeeSheet} onOpenChange={(open) => { if (!open) setShowFeeSheet(false); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[371px] p-0 overflow-hidden flex flex-col"
          hideCloseButton
        >
          <SheetTitle className="sr-only">Configurar Taxas</SheetTitle>
          <SheetDescription className="sr-only">Configure as taxas por forma de pagamento</SheetDescription>
          <FeeConfigPanel
            feeData={feeData}
            establishmentId={establishmentId}
            onSave={(data) => {
              if (!establishmentId) return;
              setFeesMutation.mutate({ establishmentId, ...data });
            }}
            isSaving={setFeesMutation.isPending}
            onClose={() => setShowFeeSheet(false)}
          />
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
