import { AdminLayout } from "@/components/AdminLayout";
import { useSearch } from "@/contexts/SearchContext";
import { PageHeader, SectionCard, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MessageSquare,
  Wallet,
  DollarSign,
  Hash,
  Clock,
  Users,
  Upload,
  Plus,
  Send,
  Info,

  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  UserPlus,
  Trash2,
  X,
  ChevronLeft,
  Filter,
  CalendarDays,
  ShoppingBag,
  TicketCheck,
  BookOpen,
  Copy,
  CalendarClock,
  XCircle,
  CheckCircle,
  CreditCard,
  Sparkles,
  BadgeCheck,
  Pencil,
  Megaphone,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";

// Limite de caracteres do SMS
const SMS_CHAR_LIMIT = 152;

// Custo padrão por SMS (usado quando não há dados do servidor)
const DEFAULT_COST_PER_SMS = 0.097;

// Templates de SMS sugeridos
const SMS_TEMPLATES = [
  {
    emoji: "VIP",
    title: "Cliente VIP",
    text: "Voce e cliente VIP! Preparamos um desconto especial so pra voce. Use o cupom VIP15 no seu proximo pedido.",
  },
  {
    emoji: "OFF",
    title: "Oferta Ativa",
    text: "So passando pra avisar! Tem uma oferta ativa por tempo limitado no nosso cardapio. Corre aproveitar!",
  },
  {
    emoji: "#10",
    title: "Sentimos sua falta",
    text: "Sentimos sua falta! Volte a pedir hoje e ganhe R$10 OFF no seu proximo pedido. Cupom: VOLTA10. Valido por 48h. Aproveite!",
  },
  {
    emoji: "OLA",
    title: "Reativação",
    text: "Oi! Ja faz um tempo que voce nao pede com a gente. Que tal matar a saudade hoje? Tem novidade no cardapio esperando por voce!",
  },
  {
    emoji: "GO",
    title: "Delivery",
    text: "Dia perfeito pra pedir em casa! Delivery rapido e quentinho esperando por voce. Faca seu pedido agora!",
  },
  {
    emoji: "NEW",
    title: "Novidade no Cardápio",
    text: "Novidade no cardapio! Acabamos de lancar um item novo. Vem experimentar hoje e conta pra gente o que achou!",
  },
  {
    emoji: "HH",
    title: "Happy Hour",
    text: "Happy Hour liberado! Pedidos com desconto ate as 19h. Aproveite enquanto e tempo!",
  },
];

// Função para formatar número de telefone no padrão brasileiro
const formatPhoneNumber = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Se começar com 55, remove (será adicionado automaticamente)
  const cleaned = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = cleaned.slice(0, 11);
  
  // Formata conforme vai digitando
  if (limited.length === 0) return '';
  if (limited.length <= 2) return `+55 ${limited}`;
  if (limited.length <= 3) return `+55 ${limited.slice(0, 2)} ${limited.slice(2)}`;
  if (limited.length <= 7) return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3)}`;
  if (limited.length <= 11) return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
  
  return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7, 11)}`;
};

// Função para extrair apenas números do telefone formatado
const extractPhoneNumbers = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

// Função para formatar telefone para exibição (a partir de número limpo)
const formatPhoneForDisplay = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  // Se já tem 55 no início
  if (numbers.startsWith('55') && numbers.length >= 12) {
    const ddd = numbers.slice(2, 4);
    const firstDigit = numbers.slice(4, 5);
    const middle = numbers.slice(5, 9);
    const end = numbers.slice(9, 13);
    return `+55 ${ddd} ${firstDigit} ${middle}-${end}`;
  }
  
  // Se tem 11 dígitos (DDD + 9 dígitos)
  if (numbers.length === 11) {
    return `+55 ${numbers.slice(0, 2)} ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // Se tem 10 dígitos (DDD + 8 dígitos - telefone fixo)
  if (numbers.length === 10) {
    return `+55 ${numbers.slice(0, 2)} ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return phone;
};

// Função para mascarar telefone para privacidade (ex: +55 11 9 9929-00**)
const maskPhoneForPrivacy = (phone: string): string => {
  const formatted = formatPhoneForDisplay(phone);
  // Substitui os últimos 2 dígitos por **
  return formatted.replace(/(\d{2})$/, '**');
};

export default function Campanhas() {
  const [mensagem, setMensagem] = useState("");
  const [destinatariosTab, setDestinatariosTab] = useState("base");
  const [clientesSelecionados, setClientesSelecionados] = useState<number[]>([]);
  const [numerosImportados, setNumerosImportados] = useState<string[]>([]);
  const [numeroManual, setNumeroManual] = useState("");
  const [numerosManual, setNumerosManual] = useState<string[]>([]);
  const [isEnviando, setIsEnviando] = useState(false);
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [agendamentoData, setAgendamentoData] = useState("");
  const [agendamentoHora, setAgendamentoHora] = useState("");
  const [isAgendando, setIsAgendando] = useState(false);
  const [showAgendadas, setShowAgendadas] = useState(false);
  const [showRecargaModal, setShowRecargaModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Estados dos filtros rápidos
  const [showFilters, setShowFilters] = useState(false);
  const [filterInactiveDays, setFilterInactiveDays] = useState<string>("");
  const [filterMinOrders, setFilterMinOrders] = useState<string>("");
  const [filterUsedCoupon, setFilterUsedCoupon] = useState(false);
  
  // Verificar se algum filtro está ativo
  const hasActiveFilters = useMemo(() => {
    return (filterInactiveDays !== "" && Number(filterInactiveDays) > 0) ||
           (filterMinOrders !== "" && Number(filterMinOrders) > 0) ||
           filterUsedCoupon;
  }, [filterInactiveDays, filterMinOrders, filterUsedCoupon]);
  
  // Construir input de filtros para a query (estabilizado com useMemo)
  const filterInput = useMemo(() => {
    if (!hasActiveFilters) return undefined;
    return {
      inactiveDays: filterInactiveDays !== "" ? Number(filterInactiveDays) : undefined,
      minOrders: filterMinOrders !== "" ? Number(filterMinOrders) : undefined,
      usedCoupon: filterUsedCoupon || undefined,
    };
  }, [hasActiveFilters, filterInactiveDays, filterMinOrders, filterUsedCoupon]);

  // Buscar clientes sem filtro (padrão)
  const { data: clientesSemFiltro, isLoading: isLoadingClientesSemFiltro } = trpc.campanhas.getClientes.useQuery();
  
  // Buscar clientes filtrados (só quando há filtros ativos)
  const { data: clientesFiltrados, isLoading: isLoadingClientesFiltrados } = trpc.campanhas.getClientesFiltrados.useQuery(
    filterInput,
    { enabled: hasActiveFilters }
  );
  
  // Usar clientes filtrados quando há filtros, senão usar a lista completa
  const { searchQuery: globalSearch } = useSearch();
  const clientesBaseRaw = hasActiveFilters ? clientesFiltrados : clientesSemFiltro;
  const clientesBase = useMemo(() => {
    if (!clientesBaseRaw || !globalSearch.trim()) return clientesBaseRaw;
    const term = globalSearch.toLowerCase().trim();
    return clientesBaseRaw.filter((c: any) =>
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  }, [clientesBaseRaw, globalSearch]);
  const isLoadingClientes = hasActiveFilters ? isLoadingClientesFiltrados : isLoadingClientesSemFiltro;
  
  // Limpar seleções quando os filtros mudam
  useEffect(() => {
    setClientesSelecionados([]);
    setSelecionarTodos(false);
  }, [filterInactiveDays, filterMinOrders, filterUsedCoupon]);
  
  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilterInactiveDays("");
    setFilterMinOrders("");
    setFilterUsedCoupon(false);
  };
  
  // Buscar establishment para SSE
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  
  useEffect(() => {
    if (establishment) setEstablishmentId(establishment.id);
  }, [establishment]);

  // Buscar saldo SMS real do banco de dados
  const { data: saldoData, isLoading: isLoadingSaldo, refetch: refetchSaldo } = trpc.campanhas.getSaldo.useQuery();

  // SSE para atualizar saldo em tempo real após recarga via Stripe
  useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onBalanceUpdated: useCallback((data: { balance: number; smsCount: number }) => {
      toast.success(`Recarga confirmada! +${data.smsCount} SMS creditados.`);
      refetchSaldo();
    }, [refetchSaldo]),
    enabled: !!establishmentId && establishmentId > 0,
  });
  
  // Dados de saldo (real ou padrão)
  const saldo = saldoData?.saldo ?? 0;
  const custoPorSms = saldoData?.custoPorSms ?? DEFAULT_COST_PER_SMS;
  const smsPossiveis = saldoData?.smsDisponiveis ?? 0;
  const ultimoDisparo = saldoData?.ultimoDisparo ? new Date(saldoData.ultimoDisparo) : null;

  // Pacotes de recarga SMS
  const { data: packages } = trpc.campanhas.getPackages.useQuery();

  // Mutation para criar checkout Stripe (pacote)
  const checkoutMutation = trpc.campanhas.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecionando para o pagamento...");
      setShowRecargaModal(false);
      setSelectedPackage(null);
      setCustomAmount("");
      setIsCustomMode(false);
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar pagamento: ${error.message}`);
    },
  });

  // Mutation para criar checkout Stripe (valor personalizado)
  const customCheckoutMutation = trpc.campanhas.createCustomCheckout.useMutation({
    onSuccess: (data) => {
      toast.success(`Redirecionando para o pagamento de ${data.smsCount} SMS...`);
      setShowRecargaModal(false);
      setSelectedPackage(null);
      setCustomAmount("");
      setIsCustomMode(false);
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar pagamento: ${error.message}`);
    },
  });

  // Cálculos do valor personalizado (customAmount armazena centavos como string numérica)
  const customAmountCents = parseInt(customAmount || "0", 10);
  const customAmountValue = customAmountCents / 100;
  const customSmsCount = Math.floor(customAmountValue / custoPorSms);
  const isCustomValid = customAmountCents >= 100 && customAmountCents <= 100000 && customSmsCount >= 1;
  const customAmountFormatted = (customAmountCents / 100).toFixed(2).replace(".", ",");

  // Detectar retorno do Stripe (sucesso/cancelamento)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      toast.success("Pagamento realizado com sucesso! Seu saldo será atualizado em instantes.");
      setTimeout(() => refetchSaldo(), 2000);
      // Limpar query params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancelled") {
      toast.info("Pagamento cancelado.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Calcular total de destinatários
  const totalDestinatarios = useMemo(() => {
    return clientesSelecionados.length + numerosImportados.length + numerosManual.length;
  }, [clientesSelecionados, numerosImportados, numerosManual]);

  // Calcular custo total
  const custoTotal = useMemo(() => {
    return totalDestinatarios * custoPorSms;
  }, [totalDestinatarios, custoPorSms]);

  // Formatar data do último disparo
  const formatarUltimoDisparo = () => {
    if (!ultimoDisparo) return "Nunca";
    
    const agora = new Date();
    const diff = agora.getTime() - ultimoDisparo.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return "Hoje";
    if (dias === 1) return "Ontem";
    return `Há ${dias} dias`;
  };
  
  // Verificar se tem saldo suficiente
  const temSaldoSuficiente = saldo >= custoTotal && totalDestinatarios > 0;
  const maxDestinatariosComSaldo = Math.floor(saldo / custoPorSms);

  // Selecionar/deselecionar cliente
  const toggleCliente = (id: number) => {
    setClientesSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  // Selecionar todos os clientes
  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      setClientesSelecionados([]);
    } else {
      setClientesSelecionados(clientesBase?.map(c => c.id) || []);
    }
    setSelecionarTodos(!selecionarTodos);
  };

  // Handler para input de número manual com formatação automática
  const handleNumeroManualChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setNumeroManual(formatted);
  }, []);

  // Adicionar número manual
  const adicionarNumeroManual = () => {
    const numeroLimpo = extractPhoneNumbers(numeroManual);
    
    // Validar: deve ter pelo menos 12 dígitos (55 + DDD + número)
    // ou 10-11 dígitos sem o 55
    const numeroParaSalvar = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    
    if (numeroParaSalvar.length >= 12 && numeroParaSalvar.length <= 13) {
      if (!numerosManual.includes(numeroParaSalvar)) {
        setNumerosManual(prev => [...prev, numeroParaSalvar]);
        setNumeroManual("");
      } else {
        toast.error("Número já adicionado");
      }
    } else {
      toast.error("Número inválido. Digite DDD + número (ex: 11 9 1234-5678)");
    }
  };

  // Remover número manual
  const removerNumeroManual = (numero: string) => {
    setNumerosManual(prev => prev.filter(n => n !== numero));
  };

  // Simular importação de CSV
  const handleImportarCSV = () => {
    // Simular importação
    const numerosSimulados = [
      "5511999991111",
      "5511999992222",
      "5511999993333",
    ];
    setNumerosImportados(numerosSimulados);
    toast.success(`${numerosSimulados.length} números importados com sucesso!`);
  };

  // Mutation para enviar SMS
  const enviarSMSMutation = trpc.campanhas.enviarSMS.useMutation({
    onSuccess: (data) => {
      const custoDebitado = data.enviados * custoPorSms;
      if (data.enviados > 0) {
        toast.success(`Campanha enviada! ${data.enviados} SMS enviado(s). Saldo debitado: R$ ${custoDebitado.toFixed(3).replace('.', ',')}`);
      }
      if (data.falhas > 0) {
        toast.error(`Falha ao enviar para ${data.falhas} destinatário(s). Créditos estornados.`);
      }
      // Limpar seleções
      setMensagem("");
      setClientesSelecionados([]);
      setNumerosImportados([]);
      setNumerosManual([]);
      // Atualizar saldo após envio (com pequeno delay para garantir que o banco já atualizou)
      setTimeout(() => refetchSaldo(), 500);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar SMS: ${error.message}`);
    },
  });

  // Query para campanhas agendadas
  const { data: campanhasAgendadas, refetch: refetchAgendadas } = trpc.campanhas.listarAgendadas.useQuery();

  // Mutation para agendar campanha
  const agendarMutation = trpc.campanhas.agendarCampanha.useMutation({
    onSuccess: (data) => {
      const dataFormatada = new Date(data.scheduledAt).toLocaleString('pt-BR');
      toast.success(`Campanha agendada para ${dataFormatada}. O saldo será debitado no momento do envio.`);
      setShowAgendarModal(false);
      setAgendamentoData("");
      setAgendamentoHora("");
      setMensagem("");
      setClientesSelecionados([]);
      setNumerosImportados([]);
      setNumerosManual([]);
      refetchAgendadas();
    },
    onError: (error) => {
      toast.error(`Erro ao agendar: ${error.message}`);
    },
  });

  // Mutation para cancelar campanha agendada
  const cancelarAgendadaMutation = trpc.campanhas.cancelarAgendada.useMutation({
    onSuccess: () => {
      toast.success("Campanha cancelada com sucesso");
      refetchAgendadas();
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    },
  });

  // Handler para agendar campanha
  const handleAgendarCampanha = async () => {
    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem para agendar");
      return;
    }
    if (totalDestinatarios === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }
    if (!agendamentoData || !agendamentoHora) {
      toast.error("Selecione data e hora para o agendamento");
      return;
    }
    if (custoTotal > saldo) {
      toast.error(`Saldo insuficiente. Necessário R$ ${custoTotal.toFixed(2)}`);
      return;
    }

    const scheduledAt = new Date(`${agendamentoData}T${agendamentoHora}:00`);
    if (scheduledAt <= new Date()) {
      toast.error("A data de agendamento deve ser no futuro");
      return;
    }

    setIsAgendando(true);

    // Coletar destinatários com nome e telefone
    const destinatarios: { phone: string; name: string }[] = [];

    if (clientesBase) {
      clientesSelecionados.forEach(id => {
        const cliente = clientesBase.find(c => c.id === id);
        if (cliente?.phone) {
          destinatarios.push({ phone: cliente.phone, name: cliente.name || "Cliente" });
        }
      });
    }

    numerosImportados.forEach(num => {
      destinatarios.push({ phone: num, name: "Importado" });
    });

    numerosManual.forEach(num => {
      destinatarios.push({ phone: num, name: "Manual" });
    });

    try {
      await agendarMutation.mutateAsync({
        mensagem: mensagem.trim(),
        destinatarios,
        nomeCampanha: "Campanha Agendada",
        scheduledAt: scheduledAt.toISOString(),
      });
    } finally {
      setIsAgendando(false);
    }
  };

  // Contar campanhas pendentes
  const campanhasPendentes = useMemo(() => {
    return campanhasAgendadas?.filter(c => c.status === 'pending').length || 0;
  }, [campanhasAgendadas]);

  // Enviar SMS usando a API real
  const handleEnviarSMS = async () => {
    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem para enviar");
      return;
    }
    if (totalDestinatarios === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }
    if (custoTotal > saldo) {
      toast.error(`Saldo insuficiente. Você pode enviar no máximo ${maxDestinatariosComSaldo} SMS.`);
      return;
    }

    setIsEnviando(true);
    
    // Coletar todos os números de telefone
    const todosNumeros: string[] = [];
    
    // Adicionar números dos clientes selecionados
    if (clientesBase) {
      clientesSelecionados.forEach(id => {
        const cliente = clientesBase.find(c => c.id === id);
        if (cliente?.phone) {
          todosNumeros.push(cliente.phone);
        }
      });
    }
    
    // Adicionar números importados
    todosNumeros.push(...numerosImportados);
    
    // Adicionar números manuais
    todosNumeros.push(...numerosManual);
    
    try {
      await enviarSMSMutation.mutateAsync({
        mensagem: mensagem.trim(),
        destinatarios: todosNumeros,
        nomeCampanha: "Campanha Promocional",
      });
    } finally {
      setIsEnviando(false);
    }
  };

  // Preview da mensagem com substituições
  const previewMensagem = mensagem || "Você ganhou R$15 de desconto! Use o cupom #15OFF em pedidos acima de R$ 100. Aproveite!";

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <PageHeader
          title="Campanhas SMS"
          description="Envie mensagens promocionais para seus clientes"
          icon={<Megaphone className="h-6 w-6 text-blue-600" />}
        />

        {/* Cards Informativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Meu Saldo"
            value={isLoadingSaldo ? "..." : `R$ ${saldo.toFixed(2)}`}
            icon={Wallet}
            variant="emerald"
            iconAction={{
              label: "Recarregar",
              onClick: () => setShowRecargaModal(true),
            }}
          />
          <StatCard
            title="Custo por SMS"
            value={`R$ ${custoPorSms.toFixed(3)}`}
            icon={DollarSign}
            variant="blue"
          />
          <StatCard
            title="SMS Possíveis"
            value={smsPossiveis.toLocaleString()}
            icon={Hash}
            variant="blue"
          />
          <StatCard
            title="Último Disparo"
            value={formatarUltimoDisparo()}
            icon={Clock}
            variant="amber"
          />
        </div>

        {/* Layout em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna Esquerda - Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Editor de Mensagem */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-[12px] bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">Mensagem SMS</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>SMS com mais de 160 caracteres são divididos em múltiplas mensagens e cobrados separadamente.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground">Máximo de {SMS_CHAR_LIMIT} caracteres</p>
                </div>
                <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      Modelos Sugeridos
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="sm:max-w-lg max-h-[80vh] overflow-y-auto p-0 overflow-hidden border-t-4 border-t-primary"
                    style={{ borderRadius: '16px' }}
                  >
                    <DialogTitle className="sr-only">Modelos Sugeridos</DialogTitle>
                    <div className="px-6 pt-5 pb-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                          <BookOpen className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Modelos Sugeridos</h3>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Escolha um modelo para usar como base da sua mensagem
                          </p>
                        </div>
                      </div>
                    <div className="space-y-3">
                      {SMS_TEMPLATES.map((template, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-[10px] font-bold bg-primary/10 text-primary rounded px-1.5 py-1 shrink-0">{template.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold text-foreground">{template.title}</h4>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                                  onClick={() => {
                                    setMensagem(template.text.replace(/\n/g, ' ').replace(/[^a-zA-Z0-9 !@"#$%&'()*+,\-./:;<=>?_]/g, ''));
                                    setShowTemplates(false);
                                    toast.success("Modelo aplicado!", { description: template.title });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                  Usar
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{template.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative flex items-start gap-2">
                <Textarea
                  value={mensagem}
                  onChange={(e) => {
                    // Permitir apenas caracteres GSM 7-bit: letras sem acento, números, espaço e especiais permitidos
                    const cleaned = e.target.value.replace(/[^a-zA-Z0-9 !@"#$%&'()*+,\-./:;<=>?_\n]/g, '');
                    if (cleaned.length <= SMS_CHAR_LIMIT) {
                      setMensagem(cleaned);
                    }
                  }}
                  placeholder="Voce ganhou R$15 de desconto! Use o cupom #15OFF em pedidos acima de R$ 100. Aproveite!"
                  className="min-h-[44px] resize-none flex-1"
                  rows={1}
                  style={{ height: 'auto', minHeight: '44px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '44px';
                    target.style.height = `${Math.max(44, target.scrollHeight)}px`;
                  }}
                />
                {/* Contador de caracteres ao lado do campo */}
                <div className={cn(
                  "text-sm font-medium whitespace-nowrap pt-2.5",
                  mensagem.length > SMS_CHAR_LIMIT * 0.9 ? "text-orange-500" : "text-muted-foreground",
                  mensagem.length >= SMS_CHAR_LIMIT && "text-red-500"
                )}>
                  {mensagem.length} / {SMS_CHAR_LIMIT}
                </div>
              </div>
            </div>

            {/* Seleção de Destinatários */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-[12px] bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Destinatários</h3>
                  <p className="text-xs text-muted-foreground">Selecione quem receberá a mensagem</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <X className="h-3 w-3" />
                      Limpar
                    </Button>
                  )}
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-1.5"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="bg-card text-primary rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold ml-0.5">
                        {[filterInactiveDays !== "" && Number(filterInactiveDays) > 0, filterMinOrders !== "" && Number(filterMinOrders) > 0, filterUsedCoupon].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                </div>
                {totalDestinatarios > 0 && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-medium">
                    {totalDestinatarios} selecionado{totalDestinatarios !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <Tabs value={destinatariosTab} onValueChange={setDestinatariosTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="base" className="text-xs sm:text-sm">
                    <Users className="h-4 w-4 mr-1.5 hidden sm:inline" />
                    Base de Clientes
                  </TabsTrigger>
                  <TabsTrigger value="importar" className="text-xs sm:text-sm">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5 hidden sm:inline" />
                    Importar CSV
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs sm:text-sm">
                    <UserPlus className="h-4 w-4 mr-1.5 hidden sm:inline" />
                    Adicionar Manual
                  </TabsTrigger>
                </TabsList>

                {/* Aba: Base de Clientes */}
                <TabsContent value="base" className="mt-0 space-y-3">
                  {/* Painel de Filtros */}
                  {showFilters && (
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Filtro: Inativos há X dias */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Inativos há (dias)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 30"
                            value={filterInactiveDays}
                            onChange={(e) => setFilterInactiveDays(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Clientes sem pedidos há X dias
                          </p>
                        </div>

                        {/* Filtro: Mínimo de pedidos */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Mín. pedidos concluídos
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 5"
                            value={filterMinOrders}
                            onChange={(e) => setFilterMinOrders(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Clientes com N ou mais pedidos
                          </p>
                        </div>

                        {/* Filtro: Usou cupom */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <TicketCheck className="h-3.5 w-3.5" />
                            Já usou cupom
                          </label>
                          <label className="flex items-center gap-2 h-8 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filterUsedCoupon}
                              onChange={(e) => setFilterUsedCoupon(e.target.checked)}
                              className="rounded border-border"
                            />
                            <span className="text-sm">
                              {filterUsedCoupon ? "Sim" : "Todos"}
                            </span>
                          </label>
                          <p className="text-[10px] text-muted-foreground">
                            Clientes que usaram cupom em pedidos
                          </p>
                        </div>
                      </div>

                      {/* Resumo dos filtros ativos */}
                      {hasActiveFilters && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {filterInactiveDays !== "" && Number(filterInactiveDays) > 0 && (
                              <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                                Inativos há {filterInactiveDays}+ dias
                              </span>
                            )}
                            {filterMinOrders !== "" && Number(filterMinOrders) > 0 && (
                              <span className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                                {filterMinOrders}+ pedidos
                              </span>
                            )}
                            {filterUsedCoupon && (
                              <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                                Usou cupom
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    {/* Header da lista */}
                    <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selecionarTodos}
                          onChange={toggleSelecionarTodos}
                          className="rounded border-border"
                          disabled={isLoadingClientes || !clientesBase?.length}
                        />
                        <span className="text-sm font-medium">Selecionar todos</span>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {isLoadingClientes ? "Carregando..." : hasActiveFilters 
                          ? `${clientesBase?.length || 0} clientes filtrados`
                          : `${clientesBase?.length || 0} clientes`}
                      </span>
                    </div>
                    
                    {/* Lista de clientes */}
                    <div className="max-h-[240px] overflow-y-auto">
                      {isLoadingClientes ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : clientesBase && clientesBase.length > 0 ? (
                        clientesBase.map((cliente) => (
                          <label
                            key={cliente.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors",
                              clientesSelecionados.includes(cliente.id) 
                                ? "bg-primary/5" 
                                : "hover:bg-muted/30"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={clientesSelecionados.includes(cliente.id)}
                              onChange={() => toggleCliente(cliente.id)}
                              className="rounded border-border"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{cliente.name || "Cliente"}</p>
                              <p className="text-xs text-muted-foreground">{maskPhoneForPrivacy(cliente.phone)}</p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cliente.orderCount} pedido{cliente.orderCount !== 1 ? "s" : ""}
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Os clientes aparecerão aqui após realizarem pedidos
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba: Importar CSV */}
                <TabsContent value="importar" className="mt-0">
                  <div className="border rounded-lg p-6 text-center">
                    {numerosImportados.length === 0 ? (
                      <>
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium mb-2">Importar números de um arquivo</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Faça upload de um arquivo CSV com uma coluna de números de telefone
                        </p>
                        <Button onClick={handleImportarCSV} variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar arquivo CSV
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-medium">{numerosImportados.length} números importados</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                          {numerosImportados.map((numero, index) => (
                            <span key={index} className="bg-muted px-3 py-1 rounded-lg text-sm">
                              {maskPhoneForPrivacy(numero)}
                            </span>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setNumerosImportados([])}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar importação
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Aba: Adicionar Manual */}
                <TabsContent value="manual" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={numeroManual}
                        onChange={handleNumeroManualChange}
                        placeholder="+55 11 9 1234-5678"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            adicionarNumeroManual();
                          }
                        }}
                      />
                      <Button onClick={adicionarNumeroManual} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {numerosManual.length > 0 ? (
                      <div className="border rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                          {numerosManual.map((numero, index) => (
                            <span 
                              key={index} 
                              className="bg-muted px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                            >
                              {maskPhoneForPrivacy(numero)}
                              <button
                                onClick={() => removerNumeroManual(numero)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-6 text-center text-muted-foreground">
                        <p className="text-sm">Nenhum número adicionado ainda</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Resumo e Botão de Envio */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Custo estimado: <span className="font-semibold text-foreground">R$ {custoTotal.toFixed(2)}</span>
                  </p>
                  {custoTotal > saldo && totalDestinatarios > 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Saldo insuficiente
                    </p>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleEnviarSMS}
                    disabled={isEnviando || totalDestinatarios === 0 || !mensagem.trim() || custoTotal > saldo}
                    className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90"
                  >
                    {isEnviando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar campanha
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAgendarModal(true)}
                    disabled={totalDestinatarios === 0 || !mensagem.trim() || custoTotal > saldo}
                    className="flex-1 sm:flex-initial border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border/50 p-5 sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Preview</h3>
                  <p className="text-xs text-muted-foreground">Como o cliente verá o SMS</p>
                </div>
              </div>

              {/* Preview estilo iOS Messages */}
              <div className="bg-muted rounded-xl overflow-hidden">
                {/* Header estilo iOS */}
                <div className="bg-muted/50 px-3 py-2.5 flex items-center gap-2 border-b border-border">
                  <ChevronLeft className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-base text-foreground">Mensagens</span>
                </div>

                {/* Área de mensagem */}
                <div className="p-4 bg-muted">
                  {/* Balão de mensagem */}
                  <div className="bg-muted-foreground/20 rounded-2xl rounded-tl-sm p-3 max-w-[90%]">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {previewMensagem}
                    </p>
                    <p className="text-[11px] text-muted-foreground text-right mt-1">Agora</p>
                  </div>
                </div>
              </div>

              {/* Informação adicional */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    O cliente verá a mensagem exatamente como mostrado acima.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Campanhas Agendadas */}
        {campanhasAgendadas && campanhasAgendadas.length > 0 && (
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[12px] bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
                  <CalendarClock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Campanhas Agendadas</h3>
                  <p className="text-sm text-muted-foreground">
                    {campanhasPendentes} pendente{campanhasPendentes !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAgendadas(!showAgendadas)}
                className="text-muted-foreground"
              >
                {showAgendadas ? 'Ocultar' : 'Ver todas'}
              </Button>
            </div>

            {showAgendadas && (
              <div className="space-y-3">
                {campanhasAgendadas.map((campanha) => {
                  const isPending = campanha.status === 'pending';
                  const isSent = campanha.status === 'sent';
                  const isCancelled = campanha.status === 'cancelled';
                  const isFailed = campanha.status === 'failed';
                  
                  return (
                    <div
                      key={campanha.id}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        isPending && "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20",
                        isSent && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
                        isCancelled && "border-border bg-muted/50",
                        isFailed && "border-red-200 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{campanha.campaignName}</span>
                            <span className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-lg",
                              isPending && "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400",
                              isSent && "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400",
                              isCancelled && "bg-muted text-muted-foreground",
                              isFailed && "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400"
                            )}>
                              {isPending ? 'Pendente' : isSent ? 'Enviada' : isCancelled ? 'Cancelada' : 'Falhou'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">{campanha.message}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              {new Date(campanha.scheduledAt).toLocaleString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {campanha.recipientCount} destinatário{campanha.recipientCount !== 1 ? 's' : ''}
                            </span>
                            {isSent && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {campanha.successCount} enviados
                                {(campanha.failCount ?? 0) > 0 && (
                                  <span className="text-red-500">/ {campanha.failCount} falhas</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {isPending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja cancelar esta campanha?')) {
                                cancelarAgendadaMutation.mutate({ id: campanha.id });
                              }
                            }}
                            className="text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Agendamento */}
      <Dialog open={showAgendarModal} onOpenChange={setShowAgendarModal}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Agendar Campanha</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <CalendarClock className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Agendar Campanha</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Defina a data e horário para o envio automático da campanha.
                </p>
              </div>
            </div>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">Resumo</p>
              <p className="text-xs text-muted-foreground">
                Mensagem: <span className="text-foreground">{mensagem.trim().slice(0, 60)}{mensagem.trim().length > 60 ? '...' : ''}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Destinatários: <span className="text-foreground font-medium">{totalDestinatarios}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Custo estimado: <span className="text-foreground font-medium">R$ {custoTotal.toFixed(2)}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={agendamentoData}
                  onChange={(e) => setAgendamentoData(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={agendamentoHora}
                  onChange={(e) => setAgendamentoHora(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  O saldo será debitado no momento do envio, não no agendamento. O envio será processado automaticamente no horário definido. Você pode cancelar a campanha antes do envio.
                </p>
              </div>
            </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              onClick={handleAgendarCampanha}
              disabled={isAgendando || !agendamentoData || !agendamentoHora}
            >
              {isAgendando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                "Confirmar Agendamento"
              )}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Recarga de Saldo */}
      <Dialog open={showRecargaModal} onOpenChange={(open) => {
        setShowRecargaModal(open);
        if (!open) {
          setSelectedPackage(null);
          setCustomAmount("");
          setIsCustomMode(false);
        }
      }}>
        <DialogContent
          className="sm:max-w-lg p-0 overflow-hidden border-t-4 border-t-emerald-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Recarregar Saldo SMS</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-emerald-100 dark:bg-emerald-950/50">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recarregar Saldo SMS</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Adicione créditos para enviar campanhas por SMS.
                </p>
              </div>
            </div>
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-400">Saldo atual</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">R$ {saldo.toFixed(2)}</span>
              </div>
            </div>

            {/* Tabs: Pacotes / Personalizado */}
            <div className="flex gap-2">
              <button
                onClick={() => { setIsCustomMode(false); setCustomAmount(""); }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border",
                  !isCustomMode
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background text-muted-foreground border-border hover:border-emerald-300"
                )}
              >
                Pacotes
              </button>
              <button
                onClick={() => { setIsCustomMode(true); setSelectedPackage(null); }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border flex items-center justify-center gap-1.5",
                  isCustomMode
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background text-muted-foreground border-border hover:border-emerald-300"
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                Valor personalizado
              </button>
            </div>

            {!isCustomMode ? (
              <>
                <p className="text-sm text-muted-foreground">Escolha um pacote de créditos SMS:</p>

                <div className="grid grid-cols-1 gap-2">
                  {packages?.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border-2 transition-colors text-left",
                        selectedPackage === pkg.id
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                          : "border-border hover:border-emerald-300 hover:bg-muted/30",
                        (pkg as any).popular && "ring-1 ring-emerald-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold",
                          selectedPackage === pkg.id
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{pkg.name}</span>
                            {(pkg as any).popular && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-lg font-medium flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5" />
                                Popular
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{pkg.description}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-base">{pkg.priceFormatted}</span>
                        <p className="text-[10px] text-muted-foreground">R$ {(pkg.priceInCents / 100 / pkg.smsCount).toFixed(3)}/sms</p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedPackage && (() => {
                  const pkg = packages?.find(p => p.id === selectedPackage);
                  if (!pkg) return null;
                  const novoSaldo = saldo + (pkg.priceInCents / 100);
                  const novosSms = Math.floor(novoSaldo / custoPorSms);
                  return (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Saldo atual</span>
                        <span>R$ {saldo.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">+ Recarga</span>
                        <span className="text-emerald-600 font-medium">+ R$ {(pkg.priceInCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-1 flex justify-between text-sm font-semibold">
                        <span>Novo saldo</span>
                        <span className="text-emerald-600">R$ {novoSaldo.toFixed(2)} ({novosSms} SMS)</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Insira o valor que deseja recarregar:</p>

                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={customAmountFormatted}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const cents = parseInt(digits || "0", 10);
                        if (cents <= 9999999) {
                          setCustomAmount(String(cents));
                        }
                      }}
                      className="pl-10 text-lg font-semibold h-12"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Mínimo: R$ 1,00</span>
                    <span>Máximo: R$ 1.000,00</span>
                  </div>

                  {customAmountValue > 0 && (
                    <div className={cn(
                      "rounded-lg p-3 space-y-1",
                      isCustomValid ? "bg-muted/50" : "bg-red-50 dark:bg-red-950/30"
                    )}>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor da recarga</span>
                        <span className="font-medium">R$ {customAmountValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SMS que receberá</span>
                        <span className={cn(
                          "font-semibold",
                          isCustomValid ? "text-emerald-600" : "text-red-500"
                        )}>
                          {customSmsCount} SMS
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custo por SMS</span>
                        <span>R$ {custoPorSms.toFixed(3)}</span>
                      </div>
                      <div className="border-t border-border pt-1 flex justify-between text-sm font-semibold">
                        <span>Novo saldo</span>
                        <span className="text-emerald-600">
                          R$ {(saldo + customAmountValue).toFixed(2)} ({Math.floor((saldo + customAmountValue) / custoPorSms)} SMS)
                        </span>
                      </div>
                      {!isCustomValid && customAmountCents > 0 && customAmountCents < 100 && (
                        <p className="text-xs text-red-500 mt-1">Valor mínimo de recarga: R$ 1,00</p>
                      )}
                      {customAmountCents > 100000 && (
                        <p className="text-xs text-red-500 mt-1">Valor máximo de recarga: R$ 1.000,00</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <div className="flex items-start gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Pagamento seguro via Stripe. Após a confirmação, o saldo é creditado automaticamente.
                </p>
              </div>
            </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (isCustomMode && isCustomValid) {
                  customCheckoutMutation.mutate({ amountInCents: customAmountCents });
                } else if (!isCustomMode && selectedPackage) {
                  checkoutMutation.mutate({ packageId: selectedPackage });
                }
              }}
              disabled={
                (isCustomMode ? !isCustomValid || customCheckoutMutation.isPending : !selectedPackage || checkoutMutation.isPending)
              }
            >
              {(checkoutMutation.isPending || customCheckoutMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Pagar com Cartão"
              )}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
