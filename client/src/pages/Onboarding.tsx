import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Store, 
  Phone, 
  Instagram, 
  Target, 
  Users,
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  CheckCircle2,
  X,
  Bike,
  ShoppingBag,
  Check,
  Smartphone,
  BarChart3,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  Timer,
  DollarSign,
  Info,
  Building2,
  Crown,
  Zap,
  Gift,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
  Pencil,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { detectBestTimezone } from "../../../shared/const";
import { OtpInput } from "@/components/OtpInput";

// Opções de objetivos
const OBJECTIVES = [
  { id: "sell_online", label: "Vender online" },
  { id: "digital_menu", label: "Ter um cardápio digital" },
  { id: "table_orders", label: "Receber pedidos na mesa" },
  { id: "organize_orders", label: "Organizar pedidos" },
  { id: "reduce_marketplaces", label: "Reduzir uso de marketplaces" },
  { id: "others", label: "Outros" },
];

// Opções de como conheceu
const HOW_FOUND = [
  { id: "referral", label: "Por indicação" },
  { id: "google", label: "Pelo Google" },
  { id: "other_menu", label: "Vi em outro estabelecimento" },
  { id: "social_media", label: "Pelas redes sociais" },
];

// Opções de tipo de entrega
const DELIVERY_TYPES = [
  { id: "delivery", label: "Delivery", icon: Bike, description: "Entrega no endereço do cliente" },
  { id: "pickup", label: "Retirada", icon: ShoppingBag, description: "Cliente retira no local" },
  { id: "both", label: "Ambos", icon: Check, description: "Delivery e retirada" },
];

// Opções de forma de pagamento
const PAYMENT_METHODS = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "cash", label: "Dinheiro", icon: Banknote },
  { id: "card", label: "Cartão", icon: CreditCard },
];

// Opções de taxa de entrega
const DELIVERY_FEE_TYPES = [
  { id: "free", label: "Grátis", icon: Gift },
  { id: "fixed", label: "Taxa fixa", icon: DollarSign },
  { id: "neighborhood", label: "Por bairros", icon: MapPin },
];

// Opções de planos
// Mapeamento de IDs do frontend para IDs do banco de dados
const PLAN_ID_TO_DB: Record<string, string> = {
  "free": "trial",
  "lite": "lite",
  "basic": "basic",
  "pro": "pro",
};

const PLANS = [
  { 
    id: "free", 
    name: "Free", 
    price: "R$ 0",
    period: "Gratuito",
    icon: Gift,
    features: [
      "Cardápio digital ilimitado",
      "Gestão de pedidos",
      "Relatórios básicos",
    ],
    highlight: false,
    badge: null
  },
  { 
    id: "lite", 
    name: "Lite", 
    price: "R$ 49,90",
    period: "/mês",
    icon: Zap,
    features: [
      "Tudo do Gratuito +",
      "WhatsApp integrado",
      "Cupons de desconto",
      "Suporte prioritário",
    ],
    highlight: false,
    badge: null
  },
  { 
    id: "basic", 
    name: "Essencial", 
    price: "R$ 79,90",
    period: "/mês",
    icon: CreditCard,
    features: [
      "Tudo do Lite +",
      "Suporte pelo WhatsApp",
      "Dashboard completa",
      "Relatórios financeiros",
    ],
    highlight: false,
    badge: null
  },
  { 
    id: "pro", 
    name: "Pro", 
    price: "R$ 99,90",
    period: "/mês",
    icon: Crown,
    features: [
      "Tudo do Lite +",
      "Múltiplas impressoras",
      "Programa de fidelidade",
      "Relatórios avançados",
      "API personalizada",
    ],
    highlight: true,
    badge: "Mais popular"
  },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { forceTheme } = useTheme();

  // Buscar dados dinâmicos de planos (nomes, preços e features editáveis pelo admin)
  const { data: planData } = trpc.plans.getData.useQuery();

  // Montar features dinâmicas a partir do banco de dados (com fallback para as hardcoded)
  const dynamicFeatures = useMemo(() => {
    const map: Record<string, string[]> = {};
    // Preencher com fallback das features hardcoded
    for (const plan of PLANS) {
      map[plan.id] = plan.features;
    }
    if (planData?.features) {
      const grouped: Record<string, Array<{ text: string; sortOrder: number }>> = {};
      for (const f of planData.features) {
        const planId = f.planId;
        if (!grouped[planId]) grouped[planId] = [];
        grouped[planId].push({ text: f.text, sortOrder: f.sortOrder });
      }
      // Mapear planIds do banco para IDs do frontend
      for (const [dbPlanId, feats] of Object.entries(grouped)) {
        const frontendId = Object.entries(PLAN_ID_TO_DB).find(([, dbId]) => dbId === dbPlanId)?.[0] || dbPlanId;
        map[frontendId] = feats.sort((a, b) => a.sortOrder - b.sortOrder).map(f => f.text);
      }
    }
    return map;
  }, [planData]);

  // Forçar tema light no onboarding
  useEffect(() => {
    forceTheme('light');
    return () => {
      forceTheme(null);
    };
  }, [forceTheme]);
  const [currentStep, setCurrentStep] = useState(0);
  const utils = trpc.useUtils();

  // Detectar se o usuário veio do Google OAuth (já autenticado)
  const isGoogleUser = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('google') === '1';
  }, []);
  // Detect if user is already logged in (adding a second establishment)
  const { user: loggedInUser } = useAuth({ redirectOnUnauthenticated: false });
  const isLoggedIn = !!loggedInUser;
  
  // Form state - Step 0 (Plano - pré-tela, sem step indicator)
  // Ler query param ?plan= da URL para pré-selecionar o plano (ex: /criar-conta?plan=essencial)
  const initialPlan = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (!planParam) return 'basic';
    // Mapeamento de nomes amigáveis na URL para IDs internos
    const urlToId: Record<string, string> = {
      essencial: 'basic',
      starter: 'lite',
      pro: 'pro',
      free: 'free',
      // Suporte direto aos IDs internos também
      basic: 'basic',
      lite: 'lite',
      trial: 'free',
    };
    const mappedId = urlToId[planParam.toLowerCase()];
    if (mappedId && PLANS.some(p => p.id === mappedId)) {
      return mappedId;
    }
    return 'free';
  }, []);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  // Form state - Step 1 (Dados do estabelecimento)
  const [name, setName] = useState("");
  const [ownerDisplayName, setOwnerDisplayName] = useState("");
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  
  // Form state - Step 3 (Configurações de Atendimento)
  const [address, setAddress] = useState("");
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(["pix"]);
  const [minDeliveryTime, setMinDeliveryTime] = useState("20");
  const [maxDeliveryTime, setMaxDeliveryTime] = useState("50");
  const [hasMinOrder, setHasMinOrder] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState("");
  const [deliveryFeeType, setDeliveryFeeType] = useState("free");
  const [fixedDeliveryFee, setFixedDeliveryFee] = useState("");
  
  // Form state - Step 4 (Objetivos)
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [otherObjective, setOtherObjective] = useState("");
  const [howFound, setHowFound] = useState("");
  const [otherHowFound, setOtherHowFound] = useState("");
  
  // Form state - Step 5 (Email/Senha)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification state
  const [emailVerificationStep, setEmailVerificationStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  const [slugToCheck, setSlugToCheck] = useState("");

  // Debounce slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (menuSlug.trim().length >= 3) {
        setSlugToCheck(menuSlug.trim());
      } else {
        setSlugToCheck("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [menuSlug]);

  // Check slug availability
  const slugAvailabilityQuery = trpc.establishment.checkSlugAvailability.useQuery(
    { slug: slugToCheck },
    { enabled: slugToCheck.length >= 3 }
  );

  // Email verification mutations
  const sendCodeMutation = trpc.emailVerification.sendCode.useMutation({
    onSuccess: () => {
      setEmailVerificationStep('otp');
      setOtpCode("");
      setOtpError(false);
      setResendCountdown(60);
      toast.success("Código enviado para " + email);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao enviar código.");
    },
  });

  const verifyCodeMutation = trpc.emailVerification.verifyCode.useMutation({
    onSuccess: () => {
      setEmailVerified(true);
      setOtpError(false);
      toast.success("Email verificado com sucesso! Criando sua conta...");
      // Auto-submit registration after email verification
      const mappedDeliveryFeeType = deliveryFeeType === "neighborhood" ? "byNeighborhood" : deliveryFeeType as "free" | "fixed" | "byNeighborhood";
      registerAndCreateMutation.mutate({
        email: email.trim(),
        password,
        name: name.trim(),
        ownerDisplayName: ownerDisplayName.trim() || undefined,
        menuSlug: menuSlug.trim() || undefined,
        whatsapp: whatsapp.replace(/\D/g, "") || undefined,
        instagram: instagram.trim() || undefined,
        allowsDelivery: deliveryType === "delivery" || deliveryType === "both",
        allowsPickup: deliveryType === "pickup" || deliveryType === "both",
        address: address.trim() || undefined,
        acceptsPix: selectedPaymentMethods.includes("pix"),
        acceptsCash: selectedPaymentMethods.includes("cash"),
        acceptsCard: selectedPaymentMethods.includes("card"),
        deliveryTimeEnabled: true,
        deliveryTimeMin: parseInt(minDeliveryTime) || 20,
        deliveryTimeMax: parseInt(maxDeliveryTime) || 50,
        minimumOrderEnabled: hasMinOrder,
        minimumOrderValue: hasMinOrder && minOrderValue ? minOrderValue.replace(/[^\d,]/g, "").replace(",", ".") : "0",
        deliveryFeeType: mappedDeliveryFeeType,
        deliveryFeeFixed: deliveryFeeType === "fixed" && fixedDeliveryFee ? fixedDeliveryFee.replace(/[^\d,]/g, "").replace(",", ".") : "0",
        selectedPlan,
        timezone: detectBestTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
      });
    },
    onError: (error: { message?: string }) => {
      setOtpError(true);
      setOtpCode("");
      toast.error(error.message || "Código inválido.");
      // Reset error animation after a moment
      setTimeout(() => setOtpError(false), 600);
    },
  });

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const registerAndCreateMutation = trpc.auth.registerAndCreateEstablishment.useMutation({
    onSuccess: async () => {
      toast.success("Conta criada e restaurante cadastrado com sucesso!");
      // Invalidar TODO o cache do tRPC para evitar dados residuais de contas anteriores
      await utils.invalidate();
      // Limpar localStorage de onboarding/checklist para evitar estados residuais
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'onboarding_dismissed', 'onboarding_minimized',
          'tooltip_prepTime_clicked', 'tooltip_viewMenu_clicked', 'tooltip_trial_clicked',
          'expandedMenus', 'dashboardPeriod',
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      window.location.href = "/";
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
    },
  });

  // Mutation para criar estabelecimento quando usuário já está autenticado via Google
  const createEstablishmentMutation = trpc.establishment.create.useMutation({
    onSuccess: async () => {
      toast.success("Restaurante cadastrado com sucesso!");
      await utils.invalidate();
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'onboarding_dismissed', 'onboarding_minimized',
          'tooltip_prepTime_clicked', 'tooltip_viewMenu_clicked', 'tooltip_trial_clicked',
          'expandedMenus', 'dashboardPeriod',
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      window.location.href = "/";
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao criar restaurante. Tente novamente.");
    },
  });

  // Format WhatsApp number
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      // 10 digits: (XX) XXXX-XXXX (sem nono dígito)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    if (numbers.length === 11) {
      // 11 digits: (XX) XXXXX-XXXX (com nono dígito)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Format currency
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Generate slug from name
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!menuSlug || menuSlug === generateSlug(name)) {
      setMenuSlug(generateSlug(value));
    }
  };

  // Format Instagram with @ prefix
  const formatInstagram = (value: string) => {
    // Remove any existing @ and spaces
    let cleaned = value.replace(/^@+/, "").replace(/\s/g, "");
    // If empty, return empty
    if (!cleaned) return "";
    // Always add @ prefix
    return "@" + cleaned;
  };

  // Validation for Step 0 (Plano - pré-tela)
  const isStep0Valid = selectedPlan !== "";

  // Validation for Step 1 - includes slug availability check and WhatsApp. Instagram is optional.
  const isSlugAvailable = menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === true;
  const isInstagramValid = instagram.trim() === "" || instagram.trim() === "@" || instagram.trim().replace("@", "").length >= 2;
  const whatsappDigits = whatsapp.replace(/\D/g, "").length;
  const isWhatsAppValid = whatsappDigits >= 10 && whatsappDigits <= 11; // 10 digits (DDD + 8-digit landline) or 11 digits (DDD + 9-digit mobile)
  const isStep1Valid = name.trim() !== "" && menuSlug.trim() !== "" && deliveryType !== "" && isSlugAvailable && isInstagramValid && isWhatsAppValid;

  // Validation for Step 2
  const isStep2Valid = address.trim() !== "" && selectedPaymentMethods.length > 0;

  // Validation for Step 3
  const isStep3Valid = selectedObjectives.length > 0 && howFound !== "";

  // Validation for Step 4 (Email/Senha)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = password === confirmPassword && confirmPassword.length > 0;
  const isStep4Valid = isEmailValid && isPasswordValid && isConfirmPasswordValid;

  const handleObjectiveToggle = (objectiveId: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objectiveId) 
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPaymentMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Por favor, informe o nome do estabelecimento.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (isGoogleUser || isLoggedIn) {
        // Usuário Google ou já logado — pular step 4 e criar estabelecimento diretamente
        handleGoogleSubmit();
      } else {
        setCurrentStep(4);
      }
    }
  };

  // Submit para usuários Google (pula step 4 de email/senha)
  const handleGoogleSubmit = () => {
    const mappedDeliveryFeeType = deliveryFeeType === "neighborhood" ? "byNeighborhood" : deliveryFeeType as "free" | "fixed" | "byNeighborhood";
    createEstablishmentMutation.mutate({
      name: name.trim(),
      ownerDisplayName: ownerDisplayName.trim() || undefined,
      menuSlug: menuSlug.trim() || undefined,
      whatsapp: whatsapp.replace(/\D/g, "") || undefined,
      instagram: instagram.trim() || undefined,
      allowsDelivery: deliveryType === "delivery" || deliveryType === "both",
      allowsPickup: deliveryType === "pickup" || deliveryType === "both",
      address: address.trim() || undefined,
      acceptsPix: selectedPaymentMethods.includes("pix"),
      acceptsCash: selectedPaymentMethods.includes("cash"),
      acceptsCard: selectedPaymentMethods.includes("card"),
      deliveryTimeEnabled: true,
      deliveryTimeMin: parseInt(minDeliveryTime) || 20,
      deliveryTimeMax: parseInt(maxDeliveryTime) || 50,
      minimumOrderEnabled: hasMinOrder,
      minimumOrderValue: hasMinOrder && minOrderValue ? minOrderValue.replace(/[^\d,]/g, "").replace(",", ".") : "0",
      deliveryFeeType: mappedDeliveryFeeType,
      deliveryFeeFixed: deliveryFeeType === "fixed" && fixedDeliveryFee ? fixedDeliveryFee.replace(/[^\d,]/g, "").replace(",", ".") : "0",
      selectedPlan,
      timezone: detectBestTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    });
  };

  const handlePrevStep = () => {
    if (currentStep === 0) {
      // Se já está logado, voltar para o seletor de estabelecimento
      window.location.href = isLoggedIn ? '/login?select=1' : '/login';
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar email/senha
    if (!email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    // Mapear deliveryFeeType para o formato do banco
    const mappedDeliveryFeeType = deliveryFeeType === "neighborhood" ? "byNeighborhood" : deliveryFeeType as "free" | "fixed" | "byNeighborhood";

    registerAndCreateMutation.mutate({
      // Step 5 - Auth
      email: email.trim(),
      password,
      
      // Step 2 - Dados do estabelecimento
      name: name.trim(),
      ownerDisplayName: ownerDisplayName.trim() || undefined,
      menuSlug: menuSlug.trim() || undefined,
      whatsapp: whatsapp.replace(/\D/g, "") || undefined,
      instagram: instagram.trim() || undefined,
      allowsDelivery: deliveryType === "delivery" || deliveryType === "both",
      allowsPickup: deliveryType === "pickup" || deliveryType === "both",
      
      // Step 3 - Configurações de Atendimento
      address: address.trim() || undefined,
      acceptsPix: selectedPaymentMethods.includes("pix"),
      acceptsCash: selectedPaymentMethods.includes("cash"),
      acceptsCard: selectedPaymentMethods.includes("card"),
      deliveryTimeEnabled: true,
      deliveryTimeMin: parseInt(minDeliveryTime) || 20,
      deliveryTimeMax: parseInt(maxDeliveryTime) || 50,
      minimumOrderEnabled: hasMinOrder,
      minimumOrderValue: hasMinOrder && minOrderValue ? minOrderValue.replace(/[^\d,]/g, "").replace(",", ".") : "0",
      deliveryFeeType: mappedDeliveryFeeType,
      deliveryFeeFixed: deliveryFeeType === "fixed" && fixedDeliveryFee ? fixedDeliveryFee.replace(/[^\d,]/g, "").replace(",", ".") : "0",
      
      // Step 1 - Plano selecionado
      selectedPlan,
      
      // Timezone detectado automaticamente do navegador
      timezone: detectBestTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    });
  };

  // Step indicator data - Google users don't see step 4 (Conta)
  const steps = (isGoogleUser || isLoggedIn)
    ? [
        { number: 1, label: "Dados" },
        { number: 2, label: "Atendimento" },
        { number: 3, label: "Objetivos" },
      ]
    : [
        { number: 1, label: "Dados" },
        { number: 2, label: "Atendimento" },
        { number: 3, label: "Objetivos" },
        { number: 4, label: "Conta" },
      ];

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 xl:gap-2 mb-4 lg:mb-4 xl:mb-5 2xl:mb-6 flex-nowrap">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isReached = currentStep >= step.number;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={["relative", isActive ? "mr-0.5" : ""].join(" ")}>
                {/* Subtle glow ring for active step — CSS-only, no re-trigger on re-render */}
                <span
                  className={[
                    "absolute -inset-1 rounded-full transition-opacity duration-500",
                    isActive ? "opacity-100 step-glow-ring" : "opacity-0",
                  ].join(" ")}
                />
                <div
                  className={[
                    "relative w-7 h-7 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 rounded-full flex items-center justify-center text-xs lg:text-xs xl:text-sm 2xl:text-base font-semibold",
                    "transition-colors duration-500 ease-out",
                    isActive ? "scale-110" : "scale-100",
                    isReached
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-muted-foreground/20 text-muted-foreground",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
              </div>
              <span
                className={[
                  "text-xs lg:text-xs xl:text-sm 2xl:text-base font-medium hidden sm:block",
                  "transition-colors duration-400 ease-out",
                  isReached ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {/* Connector bar (not after last step) */}
            {idx < steps.length - 1 && (
              <div className="w-3 sm:w-4 lg:w-6 xl:w-8 2xl:w-10 h-0.5 mx-0.5 sm:mx-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-colors ease-out"
                  style={{
                    width: currentStep > step.number ? '100%' : '0%',
                    transitionDuration: '600ms',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* CSS-only animations — no JS re-trigger on state changes */}
      <style>{`
        .step-glow-ring {
          background: oklch(0.637 0.237 25.331 / 0.15);
          animation: stepGlow 2.5s ease-in-out infinite;
        }
        @keyframes stepGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      {/* Left side - Background with promotional content */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/gerente-restaurante_266df4d4.png)' }}
        />
        {/* Red overlay with 60% opacity (40% transparency) */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/60 via-red-500/60 to-red-500/60" />
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        {/* Logo - Fixed at top */}
        <div className="absolute top-12 left-12 z-20">
          <img
            src="/assets/mindi-login-logo-white.png"
            alt="Mindi"
            className="h-[28.9189px] w-auto object-contain"
          />
        </div>
        
        {/* Content - Bottom aligned */}
        <div className="relative z-10 flex flex-col justify-end p-12 w-full h-full">
          {/* Main text */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6" style={{marginRight: '-130px'}}>
              Gerencie seu restaurante de um jeito simples e inteligente.
            </h1>
            <p className="text-white/80 text-lg mb-8" style={{marginRight: '-130px'}}>
              Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3" style={{marginRight: '-123px'}}>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Cardápio Digital</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Relatórios Completos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Clock className="w-4 h-4" />
                <span>Gestão de Pedidos</span>
              </div>
            </div>
          </div>
          
          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">JM</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">AS</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">PL</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">RC</div>
            </div>
            <span className="text-white/80 text-sm">
              Junte-se a mais de <strong className="text-white">500+</strong> restaurantes satisfeitos
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] bg-white h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 lg:p-6 xl:p-8 2xl:p-10 flex items-start xl:items-center justify-center">
          <div className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl py-4 xl:py-6 2xl:py-8">

          {/* Logo - Mobile only */}
          <div className="flex items-center mb-6 lg:mb-4 lg:hidden">
            <img
              src="/assets/mindi-login-logo-light.png"
              alt="Mindi"
              className="h-[28.9189px] max-w-[calc(100%-3rem)] w-auto object-contain"
            />
          </div>

          {/* Header - hide on OTP screen */}
          {!(currentStep === 4 && emailVerificationStep === 'otp') && (
            <div className="mb-4 lg:mb-4 xl:mb-5 2xl:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-foreground mb-1 lg:mb-1 xl:mb-2">
                {currentStep === 0 && "Escolha seu Plano"}
                {currentStep === 1 && "Cadastre seu Restaurante"}
                {currentStep === 2 && "Configurações de Atendimento"}
                {currentStep === 3 && "Seus Objetivos"}
                {currentStep === 4 && "Crie sua Conta"}
              </h2>
              <p className="text-sm lg:text-sm xl:text-base 2xl:text-lg text-muted-foreground">
                {currentStep === 0 && "Comece gratuitamente e faça upgrade quando quiser"}
                {currentStep === 1 && "Preencha os dados básicos do seu estabelecimento"}
                {currentStep === 2 && "Configure como seu restaurante vai atender"}
                {currentStep === 3 && "Conte-nos mais sobre seus objetivos"}
                {currentStep === 4 && "Insira seu email e senha para confirmar a criação da conta"}
              </p>
            </div>
          )}

          {/* Step Indicator - hide on plan selection (step 0) and OTP screen */}
          {currentStep > 0 && !(currentStep === 4 && emailVerificationStep === 'otp') && <StepIndicator />}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 0: Planos (pré-tela, sem step indicator) */}
            {currentStep === 0 && (
              <div className="space-y-2 lg:space-y-3">
                {/* Plans */}
                <div className="space-y-2" style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}>
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const isExpanded = expandedPlan === plan.id;
                    const Icon = plan.icon;
                    return (
                      <div key={plan.id} className="relative">
                        {/* Badge */}
                        {plan.badge && (
                          <span className={`absolute -top-2 right-3 z-10 px-2 py-0.5 text-xs lg:text-xs font-semibold rounded-full ${
                            plan.id === "pro" 
                              ? "bg-amber-500 text-white" 
                              : "bg-emerald-500 text-white"
                          }`}>
                            {plan.badge}
                          </span>
                        )}

                        {/* Main card row */}
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`w-full px-3 lg:px-4 py-3 lg:py-3.5 rounded-xl border-2 transition-colors text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-muted-foreground/30"
                          } ${isExpanded ? "rounded-b-none border-b-0" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              plan.id === "pro" 
                                ? "bg-amber-100 text-amber-600" 
                                : plan.id === "basic"
                                  ? "bg-indigo-100 text-indigo-600"
                                  : plan.id === "lite"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-emerald-100 text-emerald-600"
                            }`}>
                              <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                            </div>

                            {/* Name + Price */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-base lg:text-base">{(() => {
                                  const dbPlanId = PLAN_ID_TO_DB[plan.id] || plan.id;
                                  const dbPrice = planData?.prices?.find((p: any) => p.planId === dbPlanId);
                                  return dbPrice?.displayName || plan.name;
                                })()}</span>
                                <span className="text-lg lg:text-lg font-bold text-foreground">{(() => {
                                  const dbPlanId = PLAN_ID_TO_DB[plan.id] || plan.id;
                                  const dbPrice = planData?.prices?.find((p: any) => p.planId === dbPlanId);
                                  if (dbPrice && plan.id !== 'free') {
                                    return `R$ ${(dbPrice.monthlyPriceCents / 100).toFixed(2).replace('.', ',')}`;
                                  }
                                  return plan.price;
                                })()}</span>
                                <span className="text-sm lg:text-sm text-muted-foreground">{plan.period}</span>
                              </div>
                              {plan.id === 'free' ? (
                                <p className="text-xs lg:text-xs text-emerald-600 font-medium mt-0.5">Comece grátis e cresça no seu ritmo</p>
                              ) : (
                                <p className="text-xs lg:text-xs text-emerald-600 font-medium mt-0.5">Teste grátis por 15 dias</p>
                              )}
                            </div>

                            {/* Radio button */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected 
                                ? "border-red-500 bg-red-500" 
                                : "border-muted-foreground/30"
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                          </div>
                        </button>

                        {/* Expand/collapse features toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPlan(isExpanded ? null : plan.id);
                          }}
                          className={`w-full flex items-center justify-center gap-1 py-1.5 text-sm lg:text-sm text-muted-foreground hover:text-foreground transition-colors border-2 border-t-0 ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          } ${isExpanded ? "border-b-0" : "rounded-b-xl"}`}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${isSelected ? "text-red-500" : ""}`} />
                        </button>

                        {/* Expandable features */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}>
                          <div className={`px-4 pb-3 pt-2 border-2 border-t-0 rounded-b-xl ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                              {(dynamicFeatures[plan.id] || plan.features).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <span className="text-sm lg:text-sm text-muted-foreground">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center justify-center gap-1.5 h-12 lg:h-12 xl:h-13 2xl:h-14 px-5 lg:px-6 rounded-xl border border-border text-sm lg:text-base xl:text-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                    Voltar
                  </button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep0Valid}
                    className="flex-1 h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                  </Button>
                </div>

                <p className="text-xs lg:text-xs xl:text-sm 2xl:text-base text-center text-muted-foreground">
                  Você poderá alterar seu plano a qualquer momento
                </p>
              </div>
            )}

            {/* Step 1: Dados do estabelecimento */}
            {currentStep === 1 && (
              <div className="space-y-2 lg:space-y-4 xl:space-y-5 2xl:space-y-6">
                {/* Nome do estabelecimento + Nome do responsável */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                      Nome do estabelecimento <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ex: Pizzaria do João"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerDisplayName" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                      Nome do responsável
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ownerDisplayName"
                        type="text"
                        placeholder="Ex: João"
                        value={ownerDisplayName}
                        onChange={(e) => {
                          if (e.target.value.length <= 11) setOwnerDisplayName(e.target.value);
                        }}
                        maxLength={11}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                    <p className="text-sm lg:text-sm text-muted-foreground">{ownerDisplayName.length}/11 caracteres</p>
                  </div>
                </div>

                {/* Link público */}
                <div className="space-y-1">
                  <Label htmlFor="menuSlug" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Link público do cardápio
                  </Label>
                  <div className="flex items-center">
                    <span className="text-sm lg:text-sm text-muted-foreground bg-muted px-3 h-12 lg:h-12 xl:h-13 2xl:h-14 flex items-center rounded-l-xl border border-r-0 border-border">
                      mindi.com.br/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="menuSlug"
                        type="text"
                        placeholder="seu-restaurante"
                        value={menuSlug}
                        onChange={(e) => setMenuSlug(generateSlug(e.target.value))}
                        className={`h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-l-none rounded-r-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg pr-10 ${
                          menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === false ? 'border-red-300 focus:border-red-500' : ''
                        } ${
                          menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === true ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                      />
                      {/* Slug availability indicator */}
                      {menuSlug.length >= 3 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {slugAvailabilityQuery.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : slugAvailabilityQuery.data?.available ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === false && (
                    <p className="text-xs text-red-500 mt-1">Este link já está em uso. Escolha outro.</p>
                  )}
                  {menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === true && (
                    <p className="text-xs text-green-500 mt-1">Link disponível!</p>
                  )}
                </div>

                {/* WhatsApp e Instagram lado a lado */}
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <Label htmlFor="whatsapp" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                      WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                        maxLength={15}
                        className={`h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg ${
                          whatsapp && !isWhatsAppValid ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-border'
                        }`}
                      />
                    </div>
                    {whatsapp && !isWhatsAppValid && (
                      <p className="text-xs lg:text-xs text-red-500">Número incompleto. Ex: (11) 99999-9999 ou (34) 9871-0593</p>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1">
                    <Label htmlFor="instagram" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                      Instagram
                    </Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        type="text"
                        placeholder="@seu_restaurante"
                        value={instagram}
                        onChange={(e) => setInstagram(formatInstagram(e.target.value))}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de entrega */}
                <div className="space-y-1">
                  <Label className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Tipo de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {DELIVERY_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = deliveryType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryType(type.id)}
                          className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span className={`text-sm lg:text-sm font-semibold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="pt-2 lg:pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center justify-center gap-1.5 h-12 lg:h-12 xl:h-13 2xl:h-14 px-5 lg:px-6 rounded-xl border border-border text-sm lg:text-base xl:text-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                    Voltar
                  </button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="flex-1 h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Configurações de Atendimento */}
            {currentStep === 2 && (
              <div className="space-y-2 lg:space-y-3">
                {/* Endereço */}
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Endereço do estabelecimento
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Rua, número, bairro - Cidade/UF"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                    />
                  </div>
                </div>


                {/* Formas de pagamento */}
                <div className="space-y-1">
                  <Label className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Formas de pagamento aceitas
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethods.includes(method.id);
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handlePaymentMethodToggle(method.id)}
                          className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span className={`text-sm lg:text-sm font-semibold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tempo de entrega */}
                <div className="space-y-1">
                  <Label className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Tempo de entrega
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="20"
                        value={minDeliveryTime}
                        onChange={(e) => setMinDeliveryTime(e.target.value)}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium text-sm lg:text-sm">até</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        placeholder="50"
                        value={maxDeliveryTime}
                        onChange={(e) => setMaxDeliveryTime(e.target.value)}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium text-sm">min</span>
                  </div>
                </div>

                {/* Pedido mínimo */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                      Pedido mínimo
                    </Label>
                    <Switch
                      checked={hasMinOrder}
                      onCheckedChange={setHasMinOrder}
                    />
                  </div>
                  {hasMinOrder && (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(formatCurrency(e.target.value))}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Taxa de entrega */}
                <div className="space-y-1">
                  <Label className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Taxa de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {DELIVERY_FEE_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = deliveryFeeType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryFeeType(type.id)}
                          className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span className={`text-sm lg:text-sm font-semibold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo de taxa fixa */}
                  {deliveryFeeType === "fixed" && (
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={fixedDeliveryFee}
                        onChange={(e) => setFixedDeliveryFee(formatCurrency(e.target.value))}
                        className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                      />
                    </div>
                  )}

                  {/* Aviso para taxa por bairros */}
                  {deliveryFeeType === "neighborhood" && (
                    <div className="flex items-start gap-2 p-2 lg:p-3 bg-blue-50 border border-blue-200 rounded-lg mt-1">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs lg:text-sm text-blue-800">
                        Você poderá configurar as taxas por bairro nas <strong>Configurações</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center justify-center gap-1.5 h-12 lg:h-12 xl:h-13 2xl:h-14 px-5 lg:px-6 rounded-xl border border-border text-sm lg:text-base xl:text-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                    Voltar
                  </button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep2Valid}
                    className="flex-1 h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Objetivos */}
            {currentStep === 3 && (
              <div className="space-y-2 lg:space-y-3">
                {/* Objetivos */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm lg:text-sm font-semibold text-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    Quais são seus objetivos? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                    {OBJECTIVES.map((objective) => {
                      const isSelected = selectedObjectives.includes(objective.id);
                      return (
                        <button
                          key={objective.id}
                          type="button"
                          onClick={() => handleObjectiveToggle(objective.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-colors text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                              isSelected 
                                ? "border-primary bg-primary" 
                                : "border-border"
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span className={`text-sm lg:text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground"}`}>
                              {objective.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo condicional para "Outros" */}
                  {selectedObjectives.includes("others") && (
                    <Textarea
                      placeholder="Descreva brevemente seu objetivo"
                      value={otherObjective}
                      onChange={(e) => setOtherObjective(e.target.value)}
                      className="rounded-lg border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-sm"
                      rows={2}
                    />
                  )}
                </div>

                {/* Como conheceu */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm lg:text-sm font-semibold text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    Como conheceu a plataforma? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                    {HOW_FOUND.map((option) => {
                      const isSelected = howFound === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setHowFound(option.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-colors text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                              isSelected 
                                ? "border-primary" 
                                : "border-border"
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className={`text-sm lg:text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground"}`}>
                              {option.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={createEstablishmentMutation.isPending}
                    className="flex items-center justify-center gap-1.5 h-12 lg:h-12 xl:h-13 2xl:h-14 px-5 lg:px-6 rounded-xl border border-border text-sm lg:text-base xl:text-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                    Voltar
                  </button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep3Valid || createEstablishmentMutation.isPending}
                    className="flex-1 h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createEstablishmentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando restaurante...
                      </>
                    ) : isGoogleUser ? (
                      <>
                        Finalizar cadastro
                        <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Email + Senha + Confirmar Senha */}
            {currentStep === 4 && emailVerificationStep === 'form' && (
              <div className="space-y-3 lg:space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Senha <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 pr-10 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && password.length < 8 && (
                    <p className="text-xs lg:text-xs text-red-500">A senha deve ter pelo menos 8 caracteres</p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-foreground">
                    Confirmar senha <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`h-12 lg:h-12 xl:h-13 2xl:h-14 pl-10 pr-10 rounded-xl bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base lg:text-base xl:text-lg ${
                        confirmPassword && !isConfirmPasswordValid ? 'border-red-300 focus:border-red-400' : 'border-border'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !isConfirmPasswordValid && (
                    <p className="text-xs lg:text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={sendCodeMutation.isPending}
                    className="flex items-center justify-center gap-1.5 h-12 lg:h-12 xl:h-13 2xl:h-14 px-5 lg:px-6 rounded-xl border border-border text-sm lg:text-base xl:text-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                    Voltar
                  </button>
                  <Button
                    type="button"
                    disabled={!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || sendCodeMutation.isPending}
                    onClick={() => sendCodeMutation.mutate({ email: email.trim() })}
                    className="flex-1 h-12 lg:h-12 xl:h-13 2xl:h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-base lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendCodeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando código...
                      </>
                    ) : (
                      <>
                        Criar conta e finalizar
                        <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Privacy policy */}
                <p className="text-xs lg:text-xs text-center text-muted-foreground">
                  Ao continuar, você concorda com nossa{" "}
                  <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
                </p>
              </div>
            )}

            {/* Step 4: OTP Verification Screen */}
            {currentStep === 4 && emailVerificationStep === 'otp' && (
              <div className="space-y-5 lg:space-y-6">
                {/* Icon + Title */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-foreground mb-1">Verifique seu email</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um código de 5 dígitos para
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{email}</p>
                </div>

                {/* OTP Input */}
                <div className="py-2">
                  <OtpInput
                    length={5}
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={(code) => {
                      verifyCodeMutation.mutate({ email: email.trim(), code });
                    }}
                    disabled={verifyCodeMutation.isPending}
                    error={otpError}
                  />
                </div>

                {/* Verify button */}
                {otpCode.length === 5 && !verifyCodeMutation.isPending && !registerAndCreateMutation.isPending && (
                  <Button
                    type="button"
                    onClick={() => verifyCodeMutation.mutate({ email: email.trim(), code: otpCode })}
                    className="w-full h-10 lg:h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-sm lg:text-base"
                  >
                    Verificar código
                  </Button>
                )}

                {(verifyCodeMutation.isPending || registerAndCreateMutation.isPending) && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {registerAndCreateMutation.isPending ? "Criando sua conta..." : "Verificando..."}
                  </div>
                )}

                {/* Actions: Resend + Edit email */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Não recebeu o código?</span>
                    {resendCountdown > 0 ? (
                      <span className="text-muted-foreground/70">
                        Reenviar em {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendCodeMutation.mutate({ email: email.trim() })}
                        disabled={sendCodeMutation.isPending}
                        className="text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${sendCodeMutation.isPending ? 'animate-spin' : ''}`} />
                        Reenviar
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailVerificationStep('form');
                      setOtpCode("");
                      setOtpError(false);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Alterar email
                  </button>
                </div>
              </div>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
