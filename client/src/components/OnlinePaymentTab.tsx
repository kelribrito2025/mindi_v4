import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Wallet,
  Zap,
  BadgeCheck,
  Banknote,
  QrCode,
  Shield,
  Building2,
  User,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Send,
  RefreshCw,
  Settings,
  CircleDot,
  Clock,
  XCircle,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ======================================================================
// Tipos e constantes
// ======================================================================

type OnboardingStep = 1 | 2 | 3 | 4; // 1=Empresa, 2=Endereço, 3=Representante, 4=Revisão

const STEP_LABELS: Record<OnboardingStep, string> = {
  1: "Dados da Empresa",
  2: "Endereço",
  3: "Representante Legal",
  4: "Revisão e Envio",
};

const STEP_ICONS: Record<OnboardingStep, React.ReactNode> = {
  1: <Building2 className="h-4 w-4" />,
  2: <MapPin className="h-4 w-4" />,
  3: <User className="h-4 w-4" />,
  4: <Send className="h-4 w-4" />,
};

// ======================================================================
// Formatadores
// ======================================================================

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function formatDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}

function dateToISO(ddmmyyyy: string): string {
  const parts = ddmmyyyy.replace(/\D/g, "");
  if (parts.length !== 8) return "";
  return `${parts.slice(4, 8)}-${parts.slice(2, 4)}-${parts.slice(0, 2)}`;
}

// ======================================================================
// Componente principal
// ======================================================================

export function OnlinePaymentTab() {
  // ⚠️ FUNCIONALIDADE TEMPORARIAMENTE DESATIVADA
  // TODO: Reativar chamadas tRPC paytime quando for hora de testar
  // As chamadas abaixo estavam causando loading infinito pois o backend
  // não estava respondendo corretamente. Reativar quando for testar:
  // - trpc.paytime.getOnboardingStatus.useQuery
  // - trpc.paytime.submitOnboarding.useMutation
  // - trpc.paytime.refreshOnboardingStatus.useMutation
  // - trpc.paytime.completeSetup.useMutation
  // - trpc.establishment.update.useMutation (para toggle pagamento)

  const DISABLED = false; // Reativado para testes

  if (DISABLED) {
    return (
      <div className="space-y-6">
        {/* Alerta principal */}
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">Pagamento Online — Temporariamente Desativado</h3>
              <p className="mt-1 text-sm text-amber-700">
                A integração com o gateway de pagamento está desativada neste momento.
                Quando estiver pronto para testar, peça ao assistente para reativar esta funcionalidade.
              </p>
              <div className="mt-4 rounded-lg bg-amber-100/60 p-4">
                <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">Lembrete para reativar:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Reativar chamadas tRPC no <code className="bg-amber-200/60 px-1 rounded text-xs">OnlinePaymentTab.tsx</code></li>
                  <li className="flex items-center gap-2"><Settings className="h-3.5 w-3.5" /> Verificar se o backend de pagamentos está respondendo corretamente</li>
                  <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Testar onboarding e ativação de gateway</li>
                  <li className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Testar pagamento PIX e cartão no menu público</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Cards informativos do que será configurado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-emerald-50 p-2"><QrCode className="h-5 w-5 text-emerald-600" /></div>
              <h4 className="font-semibold text-sm">PIX Online</h4>
            </div>
            <p className="text-xs text-muted-foreground">Receba pagamentos via PIX com QR Code gerado automaticamente no checkout do cardápio.</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-blue-50 p-2"><CreditCard className="h-5 w-5 text-blue-600" /></div>
              <h4 className="font-semibold text-sm">Cartão de Crédito</h4>
            </div>
            <p className="text-xs text-muted-foreground">Aceite cartões de crédito diretamente no checkout com antifraude integrado.</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-purple-50 p-2"><Wallet className="h-5 w-5 text-purple-600" /></div>
              <h4 className="font-semibold text-sm">Markup Automático</h4>
            </div>
            <p className="text-xs text-muted-foreground">Receita da plataforma já incluída nas taxas do plano comercial.</p>
          </div>
        </div>
      </div>
    );
  }

  // === CÓDIGO ORIGINAL ABAIXO (reativar quando DISABLED = false) ===
  const { data: establishment, isLoading, refetch } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;

  const {
    data: onboardingData,
    isLoading: onboardingLoading,
    refetch: refetchOnboarding,
  } = trpc.paytime.getOnboardingStatus.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Configuração atualizada!");
    },
    onError: (error) => toast.error(error.message || "Erro ao atualizar"),
  });

  const submitOnboardingMutation = trpc.paytime.submitOnboarding.useMutation({
    onSuccess: () => {
      refetchOnboarding();
      refetch();
      toast.success("Cadastro enviado com sucesso! Aguarde a aprovação.");
      setShowForm(false);
    },
    onError: (error) => toast.error(error.message || "Erro ao enviar cadastro"),
  });

  const refreshStatusMutation = trpc.paytime.refreshOnboardingStatus.useMutation({
    onSuccess: (data) => {
      refetchOnboarding();
      refetch();
      if (data.status === "approved") {
        toast.success("Cadastro aprovado! Agora você pode ativar o gateway.");
      } else if (data.status === "rejected") {
        toast.error("Cadastro rejeitado. Verifique os dados e tente novamente.");
      } else {
        toast.info("Status atualizado. Ainda aguardando aprovação.");
      }
    },
    onError: (error) => toast.error(error.message || "Erro ao verificar status"),
  });

  const completeSetupMutation = trpc.paytime.completeSetup.useMutation({
    onSuccess: (data) => {
      refetchOnboarding();
      refetch();
      toast.success("Setup completo! " + data.results.join(", "));
    },
    onError: (error) => toast.error(error.message || "Erro ao completar setup"),
  });

  // KYC mutations
  const activateBankingMutation = trpc.paytime.activateBanking.useMutation({
    onSuccess: (data) => {
      refetchOnboarding();
      refetch();
      if (data.kycUrl) {
        toast.success("Conta bancária ativada! Complete a verificação de identidade no link que foi aberto.");
        window.open(data.kycUrl, "_blank");
      } else {
        toast.success("Conta bancária ativada com sucesso!");
      }
    },
    onError: (error) => toast.error(error.message || "Erro ao ativar conta bancária"),
  });

  const { data: kycStatusData, refetch: refetchKyc } = trpc.paytime.checkKycStatus.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId && onboardingData?.onboardingStatus === "approved", refetchInterval: 30000 }
  );

  const activateSubPaytimeMutation = trpc.paytime.activateSubPaytime.useMutation({
    onSuccess: (data) => {
      refetchOnboarding();
      refetch();
      toast.success(data.alreadyActive ? "Pagamento online já estava ativo!" : "Pagamento online ativado com sucesso!");
    },
    onError: (error) => toast.error(error.message || "Erro ao ativar pagamento online"),
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(1);

  // Step 1 - Empresa
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [document, setDocument] = useState("");
  const [cnae, setCnae] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 - Endereço
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  // Step 3 - Representante
  const [repFirstName, setRepFirstName] = useState("");
  const [repLastName, setRepLastName] = useState("");
  const [repCpf, setRepCpf] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repBirthDate, setRepBirthDate] = useState("");

  // Pré-preencher com dados existentes
  useEffect(() => {
    if (onboardingData && establishment) {
      if (onboardingData.razaoSocial) setRazaoSocial(onboardingData.razaoSocial);
      if (onboardingData.nomeFantasia) setNomeFantasia(onboardingData.nomeFantasia);
      if (establishment.cnpj) setDocument(establishment.cnpj);
      if (onboardingData.cnae) setCnae(onboardingData.cnae);
      if (establishment.email) setEmail(establishment.email || "");
      if ((establishment as any).phone) setPhone((establishment as any).phone || "");
      if (establishment.zipCode) setCep(establishment.zipCode || "");
      if (establishment.street) setStreet(establishment.street || "");
      if (establishment.number) setNumber(establishment.number || "");
      if (establishment.complement) setComplement(establishment.complement || "");
      if (establishment.neighborhood) setNeighborhood(establishment.neighborhood || "");
      if (establishment.city) setCity(establishment.city || "");
      if (establishment.state) setState(establishment.state || "");
      if (onboardingData.representativeName) setRepFirstName(onboardingData.representativeName);
      if (onboardingData.representativeLastName) setRepLastName(onboardingData.representativeLastName);
      if (onboardingData.representativeCpf) setRepCpf(onboardingData.representativeCpf);
      if (onboardingData.representativeEmail) setRepEmail(onboardingData.representativeEmail);
      if (onboardingData.representativePhone) setRepPhone(onboardingData.representativePhone);
      if (onboardingData.representativeBirthDate) {
        const bd = onboardingData.representativeBirthDate;
        if (bd.includes("-")) {
          // YYYY-MM-DD → DD/MM/YYYY
          const [y, m, d] = bd.split("-");
          setRepBirthDate(`${d}/${m}/${y}`);
        }
      }
    }
  }, [onboardingData, establishment]);

  // Auto-preenchimento de endereço via ViaCEP
  const fetchCep = useCallback(async (cepValue: string) => {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch {
      // silencioso
    } finally {
      setLoadingCep(false);
    }
  }, []);

  // ======================================================================
  // Preenchimento automático (dev only)
  // ======================================================================
  const isDev = import.meta.env.DEV;

  // Gera CNPJ válido aleatório para evitar "CPF/CNPJ já cadastrado"
  const generateRandomCNPJ = (): string => {
    const r = () => Math.floor(Math.random() * 10);
    const n = [r(), r(), r(), r(), r(), r(), r(), r(), 0, 0, 0, 1];
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s1 = n.reduce((acc, v, i) => acc + v * w1[i], 0);
    const d1 = s1 % 11 < 2 ? 0 : 11 - (s1 % 11);
    n.push(d1);
    let s2 = n.reduce((acc, v, i) => acc + v * w2[i], 0);
    const d2 = s2 % 11 < 2 ? 0 : 11 - (s2 % 11);
    n.push(d2);
    return n.join("");
  };

  // Gera CPF válido aleatório
  const generateRandomCPF = (): string => {
    const r = () => Math.floor(Math.random() * 10);
    const n = [r(), r(), r(), r(), r(), r(), r(), r(), r()];
    let s1 = n.reduce((acc, v, i) => acc + v * (10 - i), 0);
    const d1 = s1 % 11 < 2 ? 0 : 11 - (s1 % 11);
    n.push(d1);
    let s2 = n.reduce((acc, v, i) => acc + v * (11 - i), 0);
    const d2 = s2 % 11 < 2 ? 0 : 11 - (s2 % 11);
    n.push(d2);
    return n.join("");
  };

  const autoFillStep1 = () => {
    const cnpj = generateRandomCNPJ();
    setRazaoSocial("Restaurante Teste Sandbox LTDA");
    setNomeFantasia("Restaurante Teste");
    setDocument(cnpj);
    setCnae("5611201"); // Restaurantes e similares
    setEmail("teste@restauranteteste.com.br");
    setPhone("27998765431"); // Termina em 1 = aprovação automática no sandbox
    toast.success(`Etapa 1 preenchida! CNPJ gerado: ${cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}`);
  };

  const autoFillStep2 = () => {
    setCep("29060440");
    setStreet("Rua Sete de Setembro");
    setNumber("100");
    setComplement("Sala 201");
    setNeighborhood("Centro");
    setCity("Vitória");
    setState("ES");
    toast.success("Etapa 2 preenchida automaticamente!");
  };

  const autoFillStep3 = () => {
    const cpf = generateRandomCPF();
    setRepFirstName("João");
    setRepLastName("Silva");
    setRepCpf(cpf);
    setRepEmail("joao.silva@teste.com.br");
    setRepPhone("27998765431"); // Termina em 1
    setRepBirthDate("01011990"); // 01/01/1990
    toast.success(`Etapa 3 preenchida! CPF gerado: ${cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`);
  };

  const autoFillAll = () => {
    autoFillStep1();
    autoFillStep2();
    autoFillStep3();
    toast.success("Todas as etapas preenchidas!");
  };

  // Botão de preenchimento automático (renderizado apenas em dev)
  const AutoFillButton = ({ onClick, label }: { onClick: () => void; label?: string }) => {
    if (!isDev) return null;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        className="border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
      >
        <Wand2 className="h-3.5 w-3.5 mr-1.5" />
        {label || "Preencher automaticamente"}
      </Button>
    );
  };

  // Validação por step
  const validateStep = (s: OnboardingStep): string | null => {
    switch (s) {
      case 1:
        if (!razaoSocial.trim()) return "Razão Social é obrigatória";
        if (!nomeFantasia.trim()) return "Nome Fantasia é obrigatório";
        if (document.replace(/\D/g, "").length < 11) return "CNPJ/CPF é obrigatório";
        if (cnae.replace(/\D/g, "").length < 4) return "CNAE é obrigatório";
        if (!email.trim()) return "Email é obrigatório";
        if (phone.replace(/\D/g, "").length < 10) return "Telefone é obrigatório";
        return null;
      case 2:
        if (cep.replace(/\D/g, "").length < 8) return "CEP é obrigatório";
        if (!street.trim()) return "Rua é obrigatória";
        if (!number.trim()) return "Número é obrigatório";
        if (!neighborhood.trim()) return "Bairro é obrigatório";
        if (!city.trim()) return "Cidade é obrigatória";
        if (!state.trim() || state.length < 2) return "Estado é obrigatório (UF)";
        return null;
      case 3:
        if (!repFirstName.trim()) return "Nome do representante é obrigatório";
        if (!repLastName.trim()) return "Sobrenome do representante é obrigatório";
        if (repCpf.replace(/\D/g, "").length < 11) return "CPF do representante é obrigatório";
        if (!repEmail.trim()) return "Email do representante é obrigatório";
        if (repPhone.replace(/\D/g, "").length < 10) return "Telefone do representante é obrigatório";
        if (repBirthDate.replace(/\D/g, "").length < 8) return "Data de nascimento é obrigatória";
        return null;
      default:
        return null;
    }
  };

  const handleNextStep = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    if (step < 4) setStep((step + 1) as OnboardingStep);
  };

  const handleSubmit = () => {
    if (!estId) return;
    // Detectar tipo: CNPJ (14 dígitos) = BUSINESS, CPF (11 dígitos) = INDIVIDUAL
    const cleanDoc = document.replace(/\D/g, "");
    const estType = cleanDoc.length >= 14 ? "BUSINESS" : "INDIVIDUAL";
    submitOnboardingMutation.mutate({
      establishmentId: estId,
      type: estType,
      razaoSocial,
      nomeFantasia,
      document: cleanDoc,
      cnae: cnae.replace(/\D/g, ""),
      email,
      phone: phone.replace(/\D/g, ""),
      format: "LTDA", // Formato padrão, pode ser customizado no futuro
      birthdate: estType === "BUSINESS" ? "2022-01-01" : "", // Data de abertura
      revenue: 10000,
      address: {
        street,
        number,
        complement: complement || "N/A",
        neighborhood,
        city,
        state: state.toUpperCase(),
        zipCode: cep.replace(/\D/g, ""),
      },
      representative: {
        firstName: repFirstName,
        lastName: repLastName,
        document: repCpf.replace(/\D/g, ""),
        email: repEmail,
        phone: repPhone.replace(/\D/g, ""),
        birthDate: dateToISO(repBirthDate),
      },
    });
  };

  // ======================================================================
  // Loading
  // ======================================================================

  if (isLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = onboardingData?.onboardingStatus || "not_started";
  const gatewayActive = onboardingData?.gatewayActive ?? false;
  const bankingActive = onboardingData?.bankingActive ?? false;
  const subPaytimeActive = onboardingData?.subPaytimeActive ?? false;
  const kycUrl = onboardingData?.kycUrl || kycStatusData?.kycUrl || null;
  const kycStatus = kycStatusData?.status || onboardingData?.kycStatus || "not_started";
  const paytimeEnabled = establishment?.paytimeEnabled ?? false;
  const paytimeCardEnabled = establishment?.paytimeCardEnabled ?? false;
  const isFullySetup = status === "approved" && bankingActive && subPaytimeActive;
  const hasAnyOnlinePayment = paytimeEnabled || paytimeCardEnabled;

  // ======================================================================
  // Render: Formulário de Onboarding
  // ======================================================================

  if (showForm) {
    return (
      <div className="space-y-5">
        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {([1, 2, 3, 4] as OnboardingStep[]).map((s) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (s < step) setStep(s);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full",
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-200 dark:hover:bg-green-950/50"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                {s < step ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <span className="flex-shrink-0">{STEP_ICONS[s]}</span>
                )}
                <span className="hidden sm:inline truncate">{STEP_LABELS[s]}</span>
                <span className="sm:hidden">{s}</span>
              </button>
              {s < 4 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 1: Dados da Empresa */}
        {step === 1 && (
          <SectionCard
            title="Dados da Empresa"
            description="Informações do estabelecimento para cadastro no gateway de pagamentos"
            icon={<Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-500/15"
            headerRight={<AutoFillButton onClick={autoFillStep1} />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium mb-1.5 block">Razão Social *</Label>
                <Input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão Social da empresa"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Nome Fantasia *</Label>
                <Input
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome Fantasia"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">CNPJ/CPF *</Label>
                <Input
                  value={document.replace(/\D/g, "").length > 11 ? formatCNPJ(document) : formatCPF(document)}
                  onChange={(e) => setDocument(e.target.value.replace(/\D/g, ""))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">CNAE *</Label>
                <Input
                  value={cnae}
                  onChange={(e) => setCnae(e.target.value.replace(/\D/g, ""))}
                  placeholder="5611-2/01"
                  maxLength={10}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Código de atividade econômica (ex: 5611201 para restaurantes)
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium mb-1.5 block">Telefone *</Label>
                <Input
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Step 2: Endereço */}
        {step === 2 && (
          <SectionCard
            title="Endereço"
            description="Endereço comercial do estabelecimento"
            icon={<MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-100 dark:bg-orange-500/15"
            headerRight={<AutoFillButton onClick={autoFillStep2} />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">CEP *</Label>
                <div className="relative">
                  <Input
                    value={formatCEP(cep)}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setCep(v);
                      if (v.length === 8) fetchCep(v);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Estado (UF) *</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium mb-1.5 block">Rua *</Label>
                <Input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Número *</Label>
                <Input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Complemento</Label>
                <Input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Sala, Andar, etc."
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Bairro *</Label>
                <Input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Cidade *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Step 3: Representante Legal */}
        {step === 3 && (
          <SectionCard
            title="Representante Legal"
            description="Dados do responsável legal pelo estabelecimento"
            icon={<User className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            iconBg="bg-violet-100 dark:bg-violet-500/15"
            headerRight={<AutoFillButton onClick={autoFillStep3} />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Nome *</Label>
                <Input
                  value={repFirstName}
                  onChange={(e) => setRepFirstName(e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Sobrenome *</Label>
                <Input
                  value={repLastName}
                  onChange={(e) => setRepLastName(e.target.value)}
                  placeholder="Sobrenome"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">CPF *</Label>
                <Input
                  value={formatCPF(repCpf)}
                  onChange={(e) => setRepCpf(e.target.value.replace(/\D/g, ""))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Data de Nascimento *</Label>
                <Input
                  value={formatDate(repBirthDate)}
                  onChange={(e) => setRepBirthDate(e.target.value.replace(/\D/g, ""))}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Email *</Label>
                <Input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  placeholder="representante@email.com"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Telefone *</Label>
                <Input
                  value={formatPhone(repPhone)}
                  onChange={(e) => setRepPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Step 4: Revisão */}
        {step === 4 && (
          <SectionCard
            title="Revisão e Envio"
            description="Confira os dados antes de enviar para aprovação"
            icon={<Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          >
            <div className="space-y-4">
              {/* Empresa */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/30 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Empresa</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Razão Social:</span> <span className="font-medium">{razaoSocial}</span></div>
                  <div><span className="text-muted-foreground">Nome Fantasia:</span> <span className="font-medium">{nomeFantasia}</span></div>
                  <div><span className="text-muted-foreground">CNPJ/CPF:</span> <span className="font-medium">{document.replace(/\D/g, "").length > 11 ? formatCNPJ(document) : formatCPF(document)}</span></div>
                  <div><span className="text-muted-foreground">CNAE:</span> <span className="font-medium">{cnae}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{email}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{formatPhone(phone)}</span></div>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/30 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Endereço</span>
                </div>
                <p className="text-xs font-medium">
                  {street}, {number}{complement ? ` - ${complement}` : ""} — {neighborhood}, {city}/{state} — CEP {formatCEP(cep)}
                </p>
              </div>

              {/* Representante */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/30 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Representante Legal</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{repFirstName} {repLastName}</span></div>
                  <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{formatCPF(repCpf)}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{repEmail}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{formatPhone(repPhone)}</span></div>
                  <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{formatDate(repBirthDate)}</span></div>
                </div>
              </div>

              {/* Aviso */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Ao enviar, os dados serão cadastrados para análise. O processo de aprovação pode levar até 48 horas úteis.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Footer com botões */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (step === 1) {
                setShowForm(false);
              } else {
                setStep((step - 1) as OnboardingStep);
              }
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step < 4 ? (
            <Button size="sm" onClick={handleNextStep}>
              Próximo
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitOnboardingMutation.isPending}
            >
              {submitOnboardingMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Enviar para Aprovação
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ======================================================================
  // Render: Página principal (Status + Toggles)
  // ======================================================================

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Coluna esquerda (40%) - Status e Onboarding */}
        <div className="w-full lg:w-[40%] space-y-5">

          {/* Card Status Pagamento Online */}
          <SectionCard
            title="Pagamento Online"
            description="Gateway de pagamentos"
            icon={<Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-500/15"
          >
            <div className="space-y-4">
              {/* Status geral */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isFullySetup && hasAnyOnlinePayment
                    ? "bg-green-100 dark:bg-green-500/15"
                    : status === "submitted"
                      ? "bg-amber-100 dark:bg-amber-500/15"
                      : status === "rejected"
                        ? "bg-red-100 dark:bg-red-500/15"
                        : "bg-slate-100 dark:bg-slate-500/15"
                )}>
                  {isFullySetup && hasAnyOnlinePayment ? (
                    <BadgeCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : status === "submitted" ? (
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  ) : status === "rejected" ? (
                    <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  ) : (
                    <Shield className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {isFullySetup && hasAnyOnlinePayment
                        ? "Pagamento Online Ativo"
                        : status === "submitted"
                          ? "Aguardando Aprovação"
                          : status === "approved" && !isFullySetup
                            ? "Aprovado — Finalize o Setup"
                            : status === "rejected"
                              ? "Cadastro Rejeitado"
                              : "Pagamento Online Inativo"}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0",
                      isFullySetup && hasAnyOnlinePayment
                        ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : status === "submitted"
                          ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : status === "rejected"
                            ? "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 border-red-200 dark:border-red-500"
                            : "bg-slate-100 dark:bg-muted text-muted-foreground border-border"
                    )}>
                      {isFullySetup && hasAnyOnlinePayment
                        ? "Ativo"
                        : status === "submitted"
                          ? "Pendente"
                          : status === "approved"
                            ? "Aprovado"
                            : status === "rejected"
                              ? "Rejeitado"
                              : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFullySetup && hasAnyOnlinePayment
                      ? "Recebendo pagamentos online"
                      : status === "submitted"
                        ? "Seu cadastro está em análise"
                        : status === "approved" && !isFullySetup
                          ? "Ative o gateway e configure o split para começar"
                          : status === "rejected"
                            ? "Verifique os dados e tente novamente"
                            : "Configure o gateway para receber pagamentos online"}
                  </p>
                </div>
              </div>

              {/* Progress steps */}
              <div className="space-y-2">
                {[
                  { label: "Cadastro enviado", done: status !== "not_started", active: status === "not_started" },
                  { label: "Aprovação do cadastro", done: status === "approved", active: status === "submitted" },
                  { label: "Conta bancária ativada", done: bankingActive, active: status === "approved" && !bankingActive },
                  { label: "Verificação de identidade", done: kycStatus === "approved", active: bankingActive && kycStatus !== "approved" },
                  { label: "Pagamento online ativado", done: subPaytimeActive, active: kycStatus === "approved" && !subPaytimeActive },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors",
                    item.done
                      ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                      : item.active
                        ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                        : "bg-muted/20 text-muted-foreground"
                  )}>
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : item.active ? (
                      <CircleDot className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-border/50 flex-shrink-0" />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Ações */}
              <div className="space-y-2">
                {status === "not_started" && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      setStep(1);
                      setShowForm(true);
                    }}
                  >
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    Iniciar Cadastro
                  </Button>
                )}

                {status === "rejected" && (
                  <Button
                    className="w-full"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setStep(1);
                      setShowForm(true);
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Reenviar Cadastro
                  </Button>
                )}

                {status === "submitted" && (
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    onClick={() => refreshStatusMutation.mutate({ establishmentId: estId! })}
                    disabled={refreshStatusMutation.isPending}
                  >
                    {refreshStatusMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Verificar Status
                  </Button>
                )}

                {/* Etapa 1: Ativar Conta Digital */}
                {status === "approved" && !bankingActive && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => activateBankingMutation.mutate({ establishmentId: estId! })}
                    disabled={activateBankingMutation.isPending}
                  >
                    {activateBankingMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Ativar Conta Digital
                  </Button>
                )}

                {/* Etapa 2: KYC */}
                {bankingActive && kycStatus !== "approved" && (
                  <div className="space-y-2">
                    {kycUrl && (
                      <Button
                        className="w-full"
                        size="sm"
                        variant="default"
                        onClick={() => window.open(kycUrl, "_blank")}
                      >
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Abrir Verificação de Identidade
                      </Button>
                    )}
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => refetchKyc()}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Verificar Status da Verificação
                    </Button>
                    {kycStatus === "pending" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        Aguardando o titular completar a verificação de identidade.
                      </p>
                    )}
                    {kycStatus === "rejected" && (
                      <p className="text-xs text-red-500 dark:text-red-400 text-center">
                        Verificação rejeitada. Verifique os dados e tente novamente.
                      </p>
                    )}
                  </div>
                )}

                {/* Etapa 3: Ativar Gateway de Transações */}
                {kycStatus === "approved" && !subPaytimeActive && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => activateSubPaytimeMutation.mutate({ establishmentId: estId! })}
                    disabled={activateSubPaytimeMutation.isPending}
                  >
                    {activateSubPaytimeMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Ativar Pagamento Online
                  </Button>
                )}

                {/* Etapa 4: Finalizar */}
                {subPaytimeActive && !hasAnyOnlinePayment && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => completeSetupMutation.mutate({ establishmentId: estId! })}
                    disabled={completeSetupMutation.isPending}
                  >
                    {completeSetupMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Card de Taxas — só exibe quando setup completo */}
          {isFullySetup && (
          <SectionCard
            title="Taxas"
            description="Custos por transação"
            icon={<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <QrCode className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">PIX Online</span>
                </div>
                <span className="text-sm font-bold text-foreground">Sem taxa</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">Cartão de Crédito</span>
                </div>
                <span className="text-sm font-bold text-foreground">Conforme plano</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Taxas cobradas apenas em transações confirmadas. Valores conforme plano comercial contratado.
              </p>
            </div>
          </SectionCard>
          )}
        </div>

        {/* Coluna direita (60%) - Toggles e Métodos — só exibe quando setup completo */}
        {isFullySetup && (
        <div className="flex-1 space-y-5">

          {/* Card PIX Online */}
          <SectionCard
            title="PIX Online"
            description="Receba pagamentos instantâneos via PIX"
            icon={<QrCode className={cn(
              "h-5 w-5",
              paytimeEnabled ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-muted-foreground"
            )} />}
            iconBg={cn(
              paytimeEnabled ? "bg-green-100 dark:bg-green-500/15" : "bg-slate-100 dark:bg-slate-500/15"
            )}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    paytimeEnabled ? "bg-green-100 dark:bg-green-500/10" : "bg-muted/50"
                  )}>
                    <QrCode className={cn(
                      "h-4 w-4",
                      paytimeEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Aceitar PIX online</p>
                    <p className="text-xs text-muted-foreground">
                      Clientes poderão pagar via PIX com QR Code no menu
                    </p>
                  </div>
                </div>
                <Switch
                  checked={paytimeEnabled}
                  onCheckedChange={(checked) => {
                    if (!isFullySetup) {
                      toast.error("Complete a configuração do gateway primeiro");
                      return;
                    }
                    if (estId) {
                      updateMutation.mutate({ id: estId, paytimeEnabled: checked });
                    }
                  }}
                  disabled={!estId || updateMutation.isPending || !isFullySetup}
                />
              </div>

              {!isFullySetup && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Complete o cadastro e configuração para ativar pagamentos online.
                  </p>
                </div>
              )}

              {paytimeEnabled && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    PIX Online ativo. Clientes verão a opção "Pagar com PIX" no menu.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Card Cartão Online (Smart Checkout) */}
          <SectionCard
            title="Smart Checkout — Cartão"
            description="Pagamento com cartão de crédito/débito"
            icon={<CreditCard className={cn(
              "h-5 w-5",
              paytimeCardEnabled ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-muted-foreground"
            )} />}
            iconBg={cn(
              paytimeCardEnabled ? "bg-blue-100 dark:bg-blue-500/15" : "bg-slate-100 dark:bg-slate-500/15"
            )}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    paytimeCardEnabled ? "bg-blue-100 dark:bg-blue-500/10" : "bg-muted/50"
                  )}>
                    <CreditCard className={cn(
                      "h-4 w-4",
                      paytimeCardEnabled ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Aceitar cartão online</p>
                    <p className="text-xs text-muted-foreground">
                      Clientes poderão pagar com cartão de crédito/débito no menu
                    </p>
                  </div>
                </div>
                <Switch
                  checked={paytimeCardEnabled}
                  onCheckedChange={(checked) => {
                    if (!isFullySetup) {
                      toast.error("Complete a configuração do gateway primeiro");
                      return;
                    }
                    if (estId) {
                      updateMutation.mutate({ id: estId, paytimeCardEnabled: checked });
                    }
                  }}
                  disabled={!estId || updateMutation.isPending || !isFullySetup}
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <p>O Smart Checkout processa pagamentos com cartão diretamente no menu público, sem redirecionamento externo.</p>
                  <p>Os dados do cartão são enviados de forma segura e <strong>não são armazenados</strong> nos servidores da Mindi.</p>
                </div>
              </div>

              {paytimeCardEnabled && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Smart Checkout ativo. Clientes verão a opção "Pagar online" com cartão no menu.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Card Métodos Aceitos */}
          <SectionCard
            title="Métodos aceitos"
            description="Formas de pagamento disponíveis online"
            icon={<Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            iconBg="bg-violet-100 dark:bg-violet-500/15"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors",
                paytimeEnabled
                  ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20"
                  : "border-border/30 bg-muted/20 opacity-60"
              )}>
                <div className={cn(
                  "p-2 rounded-lg",
                  paytimeEnabled ? "bg-green-100 dark:bg-green-500/10" : "bg-muted/50"
                )}>
                  <QrCode className={cn(
                    "h-4 w-4",
                    paytimeEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    paytimeEnabled ? "text-foreground" : "text-muted-foreground"
                  )}>PIX</p>
                  <p className="text-[10px] text-muted-foreground">Pagamento instantâneo</p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors",
                paytimeCardEnabled
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                  : "border-border/30 bg-muted/20 opacity-60"
              )}>
                <div className={cn(
                  "p-2 rounded-lg",
                  paytimeCardEnabled ? "bg-blue-100 dark:bg-blue-500/10" : "bg-muted/50"
                )}>
                  <CreditCard className={cn(
                    "h-4 w-4",
                    paytimeCardEnabled ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    paytimeCardEnabled ? "text-foreground" : "text-muted-foreground"
                  )}>Cartão</p>
                  <p className="text-[10px] text-muted-foreground">Crédito e débito</p>
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
        )}
      </div>
    </div>
  );
}
