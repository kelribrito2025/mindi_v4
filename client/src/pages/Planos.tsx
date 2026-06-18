import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Download,
  MoreVertical,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Crown,
  Sparkles,
  CreditCard,
  Receipt,
  Zap,
  Shield,
  ArrowRight,
  CalendarDays,
  Mail,
  Star,
  QrCode,
  Wallet,
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CancelRetentionModal } from "@/components/CancelRetentionModal";

// Configuração visual estática dos planos (não editável pelo admin)
const PLAN_VISUAL_CONFIG: Record<string, {
  name: string;
  highlighted?: boolean;
  subtitle?: string;
}> = {
  free: { name: "Free", subtitle: "Ideal para começar e validar" },
  trial: { name: "Teste Grátis" },
  lite: { name: "Starter", subtitle: "Para dar o primeiro passo profissional" },
  basic: { name: "Essencial", highlighted: true, subtitle: "Tudo que seu restaurante precisa" },
  pro: { name: "Pro", subtitle: "Máximo controle e automação" },
};

const PLAN_ORDER = ["free", "lite", "basic", "pro"];

// Fallback hardcoded caso o DB não retorne dados
const FALLBACK_PRICES: Record<string, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  trial: { monthly: 0, annual: 0 },
  lite: { monthly: 49, annual: 490 },
  basic: { monthly: 89, annual: 890 },
  pro: { monthly: 0, annual: 0 },
};

const PIX_PENDING_EXPIRATION_MINUTES = 120;
const PIX_PENDING_EXPIRATION_MS = PIX_PENDING_EXPIRATION_MINUTES * 60 * 1000;

type PixPaymentData = {
  emv: string;
  subscriptionId: number;
  generatedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  isExpired?: boolean;
  expirationMinutes?: number | null;
};

const parseDateOrNull = (dateValue?: string | Date | null) => {
  if (!dateValue) return null;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPixExpirationDate = (pix: Pick<PixPaymentData, "generatedAt" | "expiresAt"> | null) => {
  if (!pix) return null;
  const explicitExpiresAt = parseDateOrNull(pix.expiresAt);
  if (explicitExpiresAt) return explicitExpiresAt;

  const generatedAt = parseDateOrNull(pix.generatedAt);
  return generatedAt ? new Date(generatedAt.getTime() + PIX_PENDING_EXPIRATION_MS) : null;
};

const FALLBACK_FEATURES: Record<string, string[]> = {
  free: ["Plano gratuito permanente", "1 estabelecimento", "Até 30 produtos", "Até 10 categorias", "Link personalizado"],
  trial: ["Teste grátis por 15 dias", "1 estabelecimento", "Link personalizado para o seu restaurante", "Gerenciador de pedidos"],
  lite: ["Cardápio digital com link", "Categorias ilimitadas", "Pedidos via WhatsApp", "Dashboard simplificada", "Suporte por email"],
  basic: ["Tudo do plano Lite", "1 estabelecimento", "Suporte pelo Whatsapp", "Dashboard completa", "Relatórios financeiros", "Campanhas SMS", "Cupons de desconto"],
  pro: ["Tudo do plano Essencial", "Estabelecimentos ilimitados", "Análises avançadas", "Assistente de IA", "Relatórios personalizados", "Programa de fidelidade"],
};

type BillingStatus = "all" | "success" | "processing" | "failed" | "canceling";

type BillingHistoryItem = {
  id: string;
  subscriptionId: number;
  plan: string;
  planType: string;
  purchaseDate: string;
  amount: number;
  endDate: string | null;
  status: Exclude<BillingStatus, "all">;
  gatewayLabel: string;
  canDownloadReceipt: boolean;
  receiptUrl: string;
};

export default function Planos() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillingStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const itemsPerPage = 4;

  const { data: establishment } = trpc.establishment.get.useQuery();
  const { data: planData } = trpc.plans.getData.useQuery();
  const { data: billingOverview } = trpc.planPaytime.getBillingOverview.useQuery();
  const { data: paymentHistory = [], isLoading: isPaymentHistoryLoading } = trpc.planPaytime.getPaymentHistory.useQuery();
  const trpcUtils = trpc.useUtils();

  // Montar preços e features dinâmicos a partir do DB (com fallback)
  const dynamicPrices = useMemo(() => {
    const map: Record<string, { monthly: number; annual: number }> = { ...FALLBACK_PRICES };
    if (planData?.prices) {
      for (const p of planData.prices) {
        map[p.planId] = { monthly: p.monthlyPriceCents / 100, annual: p.annualPriceCents / 100 };
        // Mapear trial -> free (trial é o ID no banco, free é o ID visual)
        if (p.planId === 'trial') {
          map['free'] = { monthly: p.monthlyPriceCents / 100, annual: p.annualPriceCents / 100 };
        }
      }
    }
    return map;
  }, [planData]);

  const dynamicFeatures = useMemo(() => {
    const map: Record<string, string[]> = { ...FALLBACK_FEATURES };
    if (planData?.features) {
      const grouped: Record<string, Array<{ text: string; sortOrder: number }>> = {};
      for (const f of planData.features) {
        if (!grouped[f.planId]) grouped[f.planId] = [];
        grouped[f.planId].push({ text: f.text, sortOrder: f.sortOrder });
        // Mapear trial -> free (trial é o ID no banco, free é o ID visual)
        if (f.planId === 'trial') {
          if (!grouped['free']) grouped['free'] = [];
          grouped['free'].push({ text: f.text, sortOrder: f.sortOrder });
        }
      }
      for (const [planId, feats] of Object.entries(grouped)) {
        map[planId] = feats.sort((a, b) => a.sortOrder - b.sortOrder).map(f => f.text);
      }
    }
    return map;
  }, [planData]);

  // Nomes dinâmicos dos planos (editados pelo admin)
  const dynamicNames = useMemo(() => {
    const map: Record<string, string> = {};
    if (planData?.prices) {
      for (const p of planData.prices) {
        if ((p as any).displayName) {
          map[p.planId] = (p as any).displayName;
          // Mapear trial -> free (trial é o ID no banco, free é o ID visual)
          if (p.planId === 'trial') {
            map['free'] = (p as any).displayName;
          }
        }
      }
    }
    return map;
  }, [planData]);

  // Gateways habilitados
  const { data: enabledGateways } = trpc.planPaytime.getEnabledGateways.useQuery();

  // Downgrade modal
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [cancelRetentionOpen, setCancelRetentionOpen] = useState(false);
  const downgradeMutation = trpc.plans.downgradeToFree.useMutation({
    onSuccess: () => {
      toast.success("Plano migrado para o gratuito com sucesso!");
      setDowngradeModalOpen(false);
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao migrar para o plano gratuito");
    },
  });

  // Payment method selection sidebar
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"select" | "pix" | "card_form">("select");
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixNow, setPixNow] = useState(() => Date.now());

  // Card form state
  const [cardForm, setCardForm] = useState({
    holderName: "",
    holderDocument: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const checkoutMutation = trpc.plans.createCheckout.useMutation({
    onSuccess: (result) => {
      toast.info("Redirecionando para o checkout...");
      window.open(result.url, '_blank');
      setPaymentModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar checkout");
    },
  });

  // Polling para verificar status do pagamento PIX
  const [pixPaymentConfirmed, setPixPaymentConfirmed] = useState(false);

  const checkStatusQuery = trpc.planPaytime.checkTransactionStatus.useQuery(
    { subscriptionId: pixData?.subscriptionId ?? 0 },
    {
      enabled: !!pixData && paymentStep === "pix" && !pixPaymentConfirmed,
      refetchInterval: 5000, // Poll every 5 seconds
      refetchIntervalInBackground: false,
    }
  );

  useEffect(() => {
    if (checkStatusQuery.data?.pendingPixExpiresAt || checkStatusQuery.data?.pendingPixGeneratedAt) {
      setPixData((current) => current ? {
        ...current,
        generatedAt: current.generatedAt ?? checkStatusQuery.data?.pendingPixGeneratedAt ?? null,
        expiresAt: current.expiresAt ?? checkStatusQuery.data?.pendingPixExpiresAt ?? null,
        isExpired: Boolean(current.isExpired || checkStatusQuery.data?.pendingPixExpired),
        expirationMinutes: current.expirationMinutes ?? checkStatusQuery.data?.pendingPixExpirationMinutes ?? PIX_PENDING_EXPIRATION_MINUTES,
      } : current);
    }

    if (checkStatusQuery.data?.status === "active" || checkStatusQuery.data?.justActivated) {
      setPixPaymentConfirmed(true);
      toast.success("Pagamento PIX confirmado! Seu plano foi ativado.");
      // Close modal after a short delay to show success
      setTimeout(() => {
        setPaymentModalOpen(false);
        setPixData(null);
        setPixPaymentConfirmed(false);
        window.location.reload();
      }, 2000);
    } else if (checkStatusQuery.data?.status === "canceled") {
      toast.error("Pagamento falhou ou foi cancelado.");
      setPaymentStep("select");
      setPixData(null);
    }
  }, [checkStatusQuery.data]);

  // Cleanup polling on unmount or modal close
  useEffect(() => {
    if (!paymentModalOpen) {
      setPixPaymentConfirmed(false);
    }
  }, [paymentModalOpen]);

  useEffect(() => {
    if (!paymentModalOpen || paymentStep !== "pix") return;

    setPixNow(Date.now());
    const interval = window.setInterval(() => setPixNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [paymentModalOpen, paymentStep]);

  const pixCheckoutMutation = trpc.planPaytime.createPixCheckout.useMutation({
    onSuccess: (result) => {
      setPixData({
        emv: (result.emv ?? "") as string,
        subscriptionId: result.subscriptionId,
        generatedAt: result.generatedAt ?? null,
        expiresAt: result.expiresAt ?? null,
        expirationMinutes: result.expirationMinutes ?? PIX_PENDING_EXPIRATION_MINUTES,
      });
      setPaymentStep("pix");
      setPixPaymentConfirmed(false);
      void trpcUtils.planPaytime.getBillingOverview.invalidate();
      void trpcUtils.planPaytime.getPaymentHistory.invalidate();
      toast.success("QR Code PIX gerado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar PIX");
    },
  });

  const replacePendingPixMutation = trpc.planPaytime.replacePendingPix.useMutation({
    onSuccess: (result) => {
      if (result.status === "paid") {
        setPixPaymentConfirmed(true);
        toast.success("Pagamento PIX confirmado! Seu plano foi ativado.");
        setTimeout(() => {
          setPaymentModalOpen(false);
          window.location.reload();
        }, 1200);
        return;
      }

      setPixData({
        emv: (result.emv ?? "") as string,
        subscriptionId: result.subscriptionId,
        generatedAt: result.generatedAt ?? null,
        expiresAt: result.expiresAt ?? null,
        expirationMinutes: result.expirationMinutes ?? PIX_PENDING_EXPIRATION_MINUTES,
        isExpired: false,
      });
      setPixCopied(false);
      setPixPaymentConfirmed(false);
      setPaymentStep("pix");
      void trpcUtils.planPaytime.getBillingOverview.invalidate();
      void trpcUtils.planPaytime.getPaymentHistory.invalidate();
      toast.success("Novo QR Code PIX gerado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar novo PIX");
    },
  });

  // State para 3DS
  const [antifraudProcessing, setAntifraudProcessing] = useState(false);

  // Sync body data-threeds-active attribute with antifraudProcessing state
  // This disables pointer-events on #root so Cardinal Commerce 3DS iframe is clickable
  useEffect(() => {
    if (antifraudProcessing) {
      document.body.setAttribute('data-threeds-active', 'true');
    } else {
      document.body.removeAttribute('data-threeds-active');
    }
    return () => {
      document.body.removeAttribute('data-threeds-active');
    };
  }, [antifraudProcessing]);

  // Mutation para confirmar 3DS
  const confirmPlanAntifraudMutation = trpc.planPaytime.confirmPlanAntifraud.useMutation({
    onSuccess: (result) => {
      setAntifraudProcessing(false);
      if (result.status === "PAID") {
        toast.success("Pagamento aprovado! Seu plano foi ativado.");
        setPaymentModalOpen(false);
        window.location.reload();
      } else if (result.status === "FAILED") {
        toast.error("Pagamento não aprovado após verificação de segurança.");
        // Reopen modal so user can try again
        // paymentModalOpen is still true, antifraudProcessing is now false, so Dialog will reopen
      } else {
        toast.info("Pagamento processando...");
        setPaymentModalOpen(false);
      }
    },
    onError: (error) => {
      setAntifraudProcessing(false);
      toast.error(error.message || "Erro na verificação de segurança.");
      // Reopen modal so user can try again
      // paymentModalOpen is still true, antifraudProcessing is now false, so Dialog will reopen
    },
  });

  const cardCheckoutMutation = trpc.planPaytime.createCardCheckout.useMutation({
    onSuccess: (result) => {
      if (result.status === "APPROVED" || result.status === "PAID") {
        toast.success("Pagamento aprovado! Seu plano foi ativado.");
        setPaymentModalOpen(false);
        window.location.reload();
      } else if (result.needsAntifraud && result.antifraudId && result.antifraudSession) {
        // 3DS requerido - executar SDK PagSeguro
        setAntifraudProcessing(true);
        toast.info("Verificação de segurança em andamento...");

        // Timeout de segurança: se o 3DS travar (ex: iframe com erro), reseta após 90s
        const antifraudTimeout = setTimeout(() => {
          setAntifraudProcessing(false);
          // paymentModalOpen is still true, Dialog will reopen so user can try again
          toast.error('Verificação de segurança expirou. Tente novamente.');
        }, 90000);

        try {
          const PagSeguro = (window as any).PagSeguro;
          if (!PagSeguro) {
            clearTimeout(antifraudTimeout);
            setAntifraudProcessing(false);
            toast.error("Erro ao carregar verificação de segurança. Recarregue a página.");
            return;
          }

          const sdkEnv = result.sdkEnv || 'PROD';
          console.log('[3DS Plan] Ambiente SDK:', sdkEnv);
          console.log('[3DS Plan] Session:', result.antifraudSession);

          PagSeguro.setUp({
            session: result.antifraudSession,
            env: sdkEnv,
          });

          // Montar payload 3DS com dados do formulário
          const cf = cardForm;
          let phoneClean = cf.phone.replace(/\D/g, '');
          // Remover código do país (55) se presente (13 dígitos = +55 + DDD + 9 dígitos)
          if (phoneClean.length >= 12 && phoneClean.startsWith('55')) {
            phoneClean = phoneClean.substring(2);
          }
          const phoneArea = phoneClean.substring(0, 2) || '11';
          let phoneNumber = phoneClean.substring(2) || '999999999';
          // Garantir que o número tenha no máximo 9 dígitos (entre 10000000 e 999999999)
          if (phoneNumber.length > 9) {
            phoneNumber = phoneNumber.substring(0, 9);
          }
          // Se número muito curto, pad com zeros
          if (phoneNumber.length < 8) {
            phoneNumber = phoneNumber.padEnd(8, '0');
          }

          // Buscar preço do plano selecionado
          const selectedPlan = planData?.prices?.find((p: any) => p.planId === selectedPlanForPayment);
          const amountCents = isAnnual
            ? (selectedPlan?.annualPriceCents || 0)
            : (selectedPlan?.monthlyPriceCents || 0);

          const threeDsRequest = {
            data: {
              customer: {
                name: cf.holderName,
                email: cf.email || 'cliente@email.com',
                phones: [
                  { country: '55', area: phoneArea, number: phoneNumber, type: 'MOBILE' },
                  { country: '55', area: phoneArea, number: phoneNumber, type: 'HOME' },
                  { country: '55', area: phoneArea, number: phoneNumber, type: 'BUSINESS' },
                ],
              },
              paymentMethod: {
                type: 'CREDIT_CARD',
                installments: 1,
                card: {
                  number: cf.cardNumber.replace(/\s/g, ''),
                  expMonth: cf.expirationMonth.padStart(2, '0'),
                  expYear: cf.expirationYear.length === 2 ? '20' + cf.expirationYear : cf.expirationYear,
                  holder: { name: cf.holderName },
                },
              },
              amount: {
                value: amountCents,
                currency: 'BRL',
              },
              billingAddress: {
                street: cf.street || 'Rua Teste',
                number: cf.number || '100',
                complement: cf.complement || '',
                regionCode: cf.state || 'SP',
                country: 'BRA',
                city: cf.city || 'Sao Paulo',
                postalCode: (cf.zipCode || '01001000').replace(/\D/g, ''),
              },
              shippingAddress: {
                street: cf.street || 'Rua Teste',
                number: cf.number || '100',
                complement: cf.complement || '',
                regionCode: cf.state || 'SP',
                country: 'BRA',
                city: cf.city || 'Sao Paulo',
                postalCode: (cf.zipCode || '01001000').replace(/\D/g, ''),
              },
              dataOnly: false,
            },
          };

          console.log('[3DS Plan] Iniciando autenticação...', JSON.stringify(threeDsRequest, null, 2));

          PagSeguro.authenticate3DS(threeDsRequest)
            .then((threeDsResult: any) => {
              clearTimeout(antifraudTimeout);
              console.log('[3DS Plan] Resultado:', JSON.stringify(threeDsResult));
              const threeDsStatus = threeDsResult?.status || 'AUTH_FLOW_COMPLETED';
              const authStatus = threeDsResult?.authenticationStatus || 'AUTHENTICATED';
              const threeDsSdkId = threeDsResult?.id || null;

              if (threeDsStatus === 'CHANGE_PAYMENT_METHOD') {
                setAntifraudProcessing(false);
                // paymentModalOpen is still true, Dialog will reopen so user can try another card
                toast.error('Cartão não aceito. Por favor, use outro cartão.');
                return;
              }

              // Enviar resultado ao backend
              confirmPlanAntifraudMutation.mutate({
                subscriptionId: result.subscriptionId,
                transactionId: result.transactionId,
                antifraudId: result.antifraudId!,
                threeDsStatus,
                authenticationStatus: authStatus,
                threeDsSdkId: threeDsSdkId || undefined,
              });
            })
            .catch((err: any) => {
              clearTimeout(antifraudTimeout);
              console.error('[3DS Plan] Erro:', err);
              setAntifraudProcessing(false);
              // paymentModalOpen is still true, Dialog will reopen so user can try again
              const errDetail = err?.detail?.message || err?.message || '';
              if (errDetail.includes('Invalid request parameters')) {
                toast.error('Erro na verificação de segurança. Verifique os dados do cartão.');
              } else {
                toast.error('Erro na verificação de segurança. Tente novamente.');
              }
            });
        } catch (err) {
          clearTimeout(antifraudTimeout);
          console.error('[3DS Plan] Erro ao iniciar:', err);
          setAntifraudProcessing(false);
          // paymentModalOpen is still true, Dialog will reopen so user can try again
          toast.error('Erro ao iniciar verificação de segurança.');
        }
      } else {
        toast.info("Pagamento processando...");
        setPaymentModalOpen(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao processar cartão");
    },
  });

  const handleCheckout = (planId: string) => {
    // Se o plano selecionado é free, abrir modal de confirmação de downgrade
    if (planId === "free") {
      setDowngradeModalOpen(true);
      return;
    }

    setSelectedPlanForPayment(planId);
    setPaymentStep("select");
    setPixData(null);
    setPixCopied(false);

    // Se só Stripe está ativo, vai direto
    const hasPaytimePix = enabledGateways?.some(g => g.gateway === "paytime_pix");
    const hasPaytimeCard = enabledGateways?.some(g => g.gateway === "paytime_card");
    const hasStripe = enabledGateways?.some(g => g.gateway === "stripe_card");

    if (!hasPaytimePix && !hasPaytimeCard && hasStripe) {
      // Só Stripe - vai direto como antes
      checkoutMutation.mutate({ planId, isAnnual });
      return;
    }

    if (!hasPaytimePix && !hasPaytimeCard && !hasStripe) {
      toast.error("Nenhum método de pagamento está habilitado. Contate o suporte.");
      return;
    }

    // Múltiplos gateways - abre sidebar de seleção
    setPaymentModalOpen(true);
  };

  const handleSelectPaymentMethod = (method: string) => {
    if (!selectedPlanForPayment) return;

    if (method === "stripe_card") {
      checkoutMutation.mutate({ planId: selectedPlanForPayment, isAnnual });
    } else if (method === "paytime_pix") {
      pixCheckoutMutation.mutate({ planId: selectedPlanForPayment, isAnnual });
    } else if (method === "paytime_card") {
      setPaymentStep("card_form");
      // Pre-fill email
      setCardForm(prev => ({ ...prev, email: user?.email || "" }));
    }
  };

  const handleCardSubmit = () => {
    if (!selectedPlanForPayment) return;
    const cf = cardForm;
    if (!cf.holderName || !cf.holderDocument || !cf.cardNumber || !cf.expirationMonth || !cf.expirationYear || !cf.securityCode) {
      toast.error("Preencha todos os dados do cartão.");
      return;
    }
    if (!cf.firstName || !cf.phone || !cf.email || !cf.street || !cf.number || !cf.neighborhood || !cf.city || !cf.state || !cf.zipCode) {
      toast.error("Preencha todos os dados de endereço.");
      return;
    }

    cardCheckoutMutation.mutate({
      planId: selectedPlanForPayment,
      isAnnual,
      card: {
        holderName: cf.holderName,
        holderDocument: cf.holderDocument,
        cardNumber: cf.cardNumber,
        expirationMonth: parseInt(cf.expirationMonth),
        expirationYear: parseInt(cf.expirationYear),
        securityCode: cf.securityCode,
      },
      client: {
        firstName: cf.firstName,
        lastName: cf.lastName || cf.firstName,
        document: cf.holderDocument,
        phone: cf.phone,
        email: cf.email,
        address: {
          street: cf.street,
          number: cf.number,
          complement: cf.complement,
          neighborhood: cf.neighborhood,
          city: cf.city,
          state: cf.state,
          zipCode: cf.zipCode,
        },
      },
    });
  };

  const copyPixCode = () => {
    const expiresAt = getPixExpirationDate(pixData);
    const isExpired = Boolean(pixData?.isExpired || (expiresAt && expiresAt.getTime() <= Date.now()));

    if (isExpired) {
      toast.error("Este QR Code PIX expirou. Gere um novo PIX antes de pagar.");
      return;
    }

    if (pixData?.emv) {
      navigator.clipboard.writeText(pixData.emv);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const copyPendingPixCode = () => {
    if (billingCard.pendingPixExpired) {
      toast.error("Este QR Code PIX expirou. Gere um novo PIX antes de pagar.");
      return;
    }

    if (billingCard.pixEmv) {
      navigator.clipboard.writeText(billingCard.pixEmv);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const openPendingPixPayment = () => {
    if (!billingCard.hasPendingPix || !billingCard.pixEmv || !billingCard.subscriptionId) {
      toast.error("Não foi possível recuperar o PIX pendente. Atualize a página e tente novamente.");
      return;
    }

    setSelectedPlanForPayment(billingCard.planId || null);
    setIsAnnual(billingCard.billingPeriod === "annual");
    setPixData({
      emv: billingCard.pixEmv,
      subscriptionId: billingCard.subscriptionId,
      generatedAt: billingCard.pendingPixGeneratedAt,
      expiresAt: billingCard.pendingPixExpiresAt,
      isExpired: billingCard.pendingPixExpired,
      expirationMinutes: billingCard.pendingPixExpirationMinutes,
    });
    setPixCopied(false);
    setPixPaymentConfirmed(false);
    setPaymentStep("pix");
    setPaymentModalOpen(true);

    if (billingCard.pendingPixExpired) {
      toast.warning("Este PIX já venceu. Gere um novo QR Code antes de tentar pagar.");
    }
  };

  const refreshPixCode = () => {
    if (!pixData?.subscriptionId) {
      toast.error("Não foi possível localizar a cobrança PIX para reemissão.");
      return;
    }

    replacePendingPixMutation.mutate({ subscriptionId: pixData.subscriptionId });
  };

  const planNameMap: Record<string, string> = {
    free: "Free",
    trial: "Teste Grátis (15 dias)",
    lite: "Starter",
    basic: "Essencial",
    pro: "Pro",
  };

  const planPriceMap = dynamicPrices;

  const userPlanType = establishment?.planType || "free";
  const userBillingPeriod = establishment?.billingPeriod || "monthly";
  const billingPlanType = billingOverview?.planId || userPlanType;
  const billingPeriod = billingOverview?.billingPeriod || userBillingPeriod;
  const isUserAnnual = billingPeriod === "annual";
  const userPlanPrice = planPriceMap[userPlanType]?.[userBillingPeriod === "annual" ? "annual" : "monthly"] || 0;
  const billingPlanPrice = typeof billingOverview?.displayAmountCents === "number"
    ? billingOverview.displayAmountCents / 100
    : userPlanPrice;
  const userPlanExpiresAt = establishment?.planExpiresAt ? new Date(establishment.planExpiresAt) : null;
  const hasLegacyActivePaidPlan = ["lite", "basic", "pro"].includes(userPlanType) && Boolean(
    userPlanExpiresAt && userPlanExpiresAt.getTime() > Date.now(),
  );
  const hasActivePlan = billingOverview
    ? !["no_subscription", "canceled", "expired"].includes(billingOverview.state)
    : hasLegacyActivePaidPlan;

  const currentPlan = {
    id: billingPlanType,
    name: billingOverview?.planName || dynamicNames[billingPlanType] || PLAN_VISUAL_CONFIG[billingPlanType]?.name || planNameMap[billingPlanType] || planNameMap[userPlanType] || "Free",
    price: billingPlanPrice,
    period: isUserAnnual ? "ano" : "mês",
    renewalDate: billingOverview?.displayDueDate || establishment?.planExpiresAt || null,
    billingEmail: user?.email || "",
    isActive: hasActivePlan,
  };

  const billingCard = {
    title: billingOverview?.displayTitle || (currentPlan.isActive ? "Próximo pagamento" : "Sem cobranças"),
    subtitle: billingOverview?.displaySubtitle || (currentPlan.isActive ? "Cobrança programada para a próxima renovação." : "Escolha um plano para começar"),
    amount: currentPlan.price,
    dueDate: billingOverview?.displayDueDate || currentPlan.renewalDate,
    gracePeriodEnd: billingOverview?.gracePeriodEnd || null,
    subscriptionId: billingOverview?.subscriptionId || null,
    planId: billingOverview?.planId || null,
    billingPeriod: billingOverview?.billingPeriod || null,
    hasPendingPix: Boolean(billingOverview?.hasPendingPix && billingOverview.pixEmv && billingOverview.subscriptionId),
    pixEmv: billingOverview?.pixEmv || null,
    pendingPixGeneratedAt: billingOverview?.pendingPixGeneratedAt || null,
    pendingPixExpiresAt: billingOverview?.pendingPixExpiresAt || null,
    pendingPixExpired: Boolean(billingOverview?.pendingPixExpired),
    pendingPixExpirationMinutes: billingOverview?.pendingPixExpirationMinutes || PIX_PENDING_EXPIRATION_MINUTES,
    state: billingOverview?.state || null,
  };

  const billingHistory = useMemo<BillingHistoryItem[]>(() => {
    return paymentHistory.map((item) => {
      const status: BillingHistoryItem["status"] = item.status === "canceling"
        ? "canceling"
        : item.status === "active"
        ? "success"
        : item.status === "pending" || item.status === "past_due"
          ? "processing"
          : "failed";

      return {
        id: item.invoiceNumber,
        subscriptionId: item.id,
        plan: item.planName,
        planType: item.billingPeriod === "annual" ? "Anual" : "Mensal",
        purchaseDate: new Date(item.paidAt).toISOString(),
        amount: item.amountCents / 100,
        endDate: item.validUntil ? new Date(item.validUntil).toISOString() : null,
        status,
        gatewayLabel: item.gatewayLabel,
        canDownloadReceipt: item.canDownloadReceipt,
        receiptUrl: item.receiptUrl,
      };
    });
  }, [paymentHistory]);

  const filteredHistory = billingHistory.filter(
    (item) => statusFilter === "all" || item.status === statusFilter
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pixExpiresAt = getPixExpirationDate(pixData);
  const isCurrentPixExpired = Boolean(
    pixData?.isExpired || (pixExpiresAt && pixExpiresAt.getTime() <= pixNow),
  );
  const pixRemainingMinutes = pixExpiresAt
    ? Math.max(0, Math.ceil((pixExpiresAt.getTime() - pixNow) / 60000))
    : null;
  const pixExpirationMinutes = pixData?.expirationMinutes || PIX_PENDING_EXPIRATION_MINUTES;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">Sucesso</span>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">Processando</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-500 dark:text-red-400 font-medium text-sm">Falhou</span>
          </div>
        );
      case "canceling":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-orange-600 dark:text-orange-400 font-medium text-sm">Cancelando</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateValue: string | Date) => {
    return new Date(dateValue).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isCurrentPlan = (planId: string) => {
    // trial é estado temporário - quem está em trial vê o Free como plano atual
    if (planId === "free" && (userPlanType === "trial" || userPlanType === "free")) return true;
    return planId === userPlanType;
  };

  const isLitePlan = userPlanType === "lite" || userPlanType === "trial" || userPlanType === "free";

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title="Planos e Assinatura"
          description="Gerencie seu plano e histórico de pagamentos"
          icon={<CreditCard className="h-6 w-6 text-red-500" />}
        />
      </div>

      {/* Seu Plano Atual */}
      <SectionCard
        title="Seu Plano"
        description="Detalhes da sua assinatura atual"
        icon={<Crown className="h-5 w-5 text-red-500" />}
        iconBg="bg-red-100 dark:bg-red-500/15"
        className="mb-6"
        actions={currentPlan.isActive && billingOverview?.state !== "canceling" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={() => setCancelRetentionOpen(true)}
          >
            Cancelar Plano
          </Button>
        ) : undefined}
      >

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plano info */}
          <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Plano</p>
            <p className="text-lg font-bold text-foreground">{currentPlan.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentPlan.isActive
                ? `${formatCurrency(currentPlan.price)}/${currentPlan.period}`
                : userPlanType === "free"
                ? "Plano gratuito permanente"
                : userPlanType === "trial"
                ? "Período de teste ativo"
                : "Sem plano ativo"
              }
            </p>
          </div>

          {/* Estado real de cobrança */}
          <div className={cn(
            "rounded-lg border p-4",
            billingCard.state === "past_due_pix"
              ? "border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10"
              : "border-border/40 bg-muted/20"
          )}>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{billingCard.title}</p>
            {billingCard.dueDate || billingCard.amount > 0 ? (
              <>
                <p className="text-lg font-bold text-foreground">{formatCurrency(billingCard.amount)}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {billingCard.state === "past_due_pix"
                    ? `Cobrança PIX enviada em ${billingCard.dueDate ? formatDate(billingCard.dueDate) : "data indisponível"}`
                    : billingCard.dueDate
                    ? `Cobrança em ${formatDate(billingCard.dueDate)}`
                    : billingCard.subtitle}
                </p>
                {billingCard.gracePeriodEnd && (billingCard.state === "past_due" || billingCard.state === "past_due_pix") && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Pague até {formatDate(billingCard.gracePeriodEnd)} para evitar suspensão.
                  </p>
                )}
                {billingCard.hasPendingPix && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
                      onClick={openPendingPixPayment}
                    >
                      Abrir PIX pendente
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 rounded-lg text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/10"
                      onClick={copyPendingPixCode}
                    >
                      {pixCopied ? "PIX copiado" : "Copiar PIX"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-foreground">Sem cobranças</p>
                <p className="text-sm text-muted-foreground mt-0.5">{billingCard.subtitle}</p>
              </>
            )}
          </div>

          {/* Email de cobrança */}
          <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">E-mail de Cobrança</p>
            <p className="text-lg font-bold text-foreground truncate">{currentPlan.billingEmail || "Não configurado"}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Recebe faturas e avisos</p>
          </div>
        </div>
      </SectionCard>

      {/* Selecione um Plano */}
      <SectionCard
        title="Selecione um Plano"
        description="Escolha o plano ideal para o seu negócio"
        icon={<Sparkles className="h-5 w-5 text-red-500" />}
        iconBg="bg-red-100 dark:bg-red-500/15"
        className="mb-6"
        actions={
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/30">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                !isAnnual
                  ? "bg-card text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isAnnual
                  ? "bg-card text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Anual
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_ORDER.map((planId) => {
            const plan = PLAN_VISUAL_CONFIG[planId];
            if (!plan) return null;
            const prices = dynamicPrices[planId] || { monthly: 0, annual: 0 };
            const features = dynamicFeatures[planId] || [];
            const price = isAnnual ? prices.annual : prices.monthly;
            const period = isAnnual ? "/ano" : "/mês";
            const isCurrent = isCurrentPlan(planId);
            const displayName = dynamicNames[planId] || plan.name;

            return (
              <div
                key={planId}
                className={cn(
                  "relative rounded-xl border p-5 transition-colors duration-200",
                  isCurrent
                    ? "border-red-400 dark:border-red-500/50 bg-red-50/40 dark:bg-red-500/5 shadow-sm"
                    : plan.highlighted
                    ? "border-red-200 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-md"
                    : "border-border/50 hover:border-border hover:shadow-md"
                )}
              >
                {/* Badge */}
                {isCurrent && (
                  <div className="absolute -top-2.5 left-4">
                    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-lg shadow-sm">
                      <Check className="h-3 w-3" /> Plano Atual
                    </span>
                  </div>
                )}

                {plan.highlighted && !isCurrent && (
                  <div className="absolute -top-2.5 left-4">
                    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-lg shadow-sm">
                      <Star className="h-3 w-3" /> Recomendado
                    </span>
                  </div>
                )}



                {/* Plan name */}
                <h3 className="text-base font-bold text-foreground mt-1 mb-3">{dynamicNames[planId] || plan.name}</h3>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {price === 0 ? "Grátis" : formatCurrency(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">{period}</span>
                    )}
                  </div>
                  {isAnnual && price > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                      Equivale a {formatCurrency(price / 12)}/mês — economize 2 meses
                    </p>
                  )}
                  {!isAnnual && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Apenas {formatCurrency(price / 30)}/dia
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border/40 mb-4" />

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {(() => {
                    // Para o plano Essencial (basic), limitar features visíveis até "(KDS) Sistema de Exibição de Cozinha"
                    const KDS_FEATURE = "(KDS) Sistema de Exibição de Cozinha";
                    const isBasicPlan = planId === "basic";
                    const kdsIndex = isBasicPlan ? features.findIndex(f => f.includes("KDS")) : -1;
                    const hasHiddenFeatures = isBasicPlan && kdsIndex >= 0 && kdsIndex < features.length - 1;
                    const isExpanded = expandedPlans[planId] || false;
                    const visibleFeatures = hasHiddenFeatures && !isExpanded
                      ? features.slice(0, kdsIndex + 1)
                      : features;

                    return (
                      <>
                        {visibleFeatures.map((featureText, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className={cn(
                              "h-4 w-4 mt-0.5 flex-shrink-0",
                              isCurrent ? "text-red-500" :
                              plan.highlighted ? "text-red-500" :
                              "text-emerald-500"
                            )} />
                            <span className="text-muted-foreground">{featureText}</span>
                          </li>
                        ))}
                        {hasHiddenFeatures && (
                          <li className="pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPlans(prev => ({ ...prev, [planId]: !prev[planId] }));
                              }}
                              className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <ChevronDownIcon className={cn(
                                "h-3.5 w-3.5 transition-transform duration-200",
                                isExpanded && "rotate-180"
                              )} />
                              {isExpanded ? "Ver menos" : `Ver mais ${features.length - kdsIndex - 1} recursos`}
                            </button>
                          </li>
                        )}
                      </>
                    );
                  })()}
                </ul>

                {/* Button */}
                <Button
                  className={cn(
                    "w-full font-medium rounded-lg h-9 text-sm transition-colors",
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-default hover:bg-muted"
                      : plan.highlighted
                      ? "bg-red-500 hover:bg-red-500 text-white shadow-sm"
                      : "bg-foreground hover:bg-foreground/90 text-background"
                  )}
                  disabled={isCurrent || checkoutMutation.isPending}
                  onClick={() => {
                    if (!isCurrent) {
                      handleCheckout(planId);
                    }
                  }}
                >
                  {isCurrent ? (
                    "Plano Atual"
                  ) : checkoutMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                  ) : planId === "free" ? (
                    <span className="flex items-center justify-center gap-1.5">
                      Plano Gratuito <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Assinar {displayName} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
                {PLAN_VISUAL_CONFIG[planId]?.subtitle && (
                  <p className="text-xs text-muted-foreground text-center mt-2">{PLAN_VISUAL_CONFIG[planId].subtitle}</p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Histórico de Pagamentos */}
      <SectionCard
        title="Histórico de Pagamentos"
        description="Acompanhe todas as suas transações"
        icon={<Receipt className="h-5 w-5 text-red-500" />}
        iconBg="bg-red-100 dark:bg-red-500/15"
        className="mb-6"
        noPadding
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as BillingStatus);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] bg-card border-border/50 rounded-lg h-8 text-xs">
                <span className="text-muted-foreground mr-1">Status:</span>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="canceling">Cancelando</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="gap-1.5 h-8 rounded-lg text-xs border-border/50">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-foreground text-xs">FATURA</TableHead>
              <TableHead className="font-semibold text-foreground text-xs">PLANO</TableHead>
              <TableHead className="font-semibold text-foreground text-xs">DATA</TableHead>
              <TableHead className="font-semibold text-foreground text-xs">VALOR</TableHead>
              <TableHead className="font-semibold text-foreground text-xs">VALIDADE</TableHead>
              <TableHead className="font-semibold text-foreground text-xs">STATUS</TableHead>
              <TableHead className="font-semibold text-foreground text-xs text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPaymentHistoryLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin opacity-60" />
                    <div>
                      <p className="text-sm font-medium">Carregando histórico de pagamentos</p>
                      <p className="text-xs mt-0.5 opacity-70">Aguarde enquanto buscamos as suas transações.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-30" />
                    <div>
                      <p className="text-sm font-medium">Nenhum pagamento registrado</p>
                      <p className="text-xs mt-0.5 opacity-70">Seu histórico de pagamentos aparecerá aqui.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedHistory.map((item, index) => (
                <TableRow key={`${item.id}-${index}`} className="hover:bg-muted/20">
                  <TableCell>
                    <span className="font-medium text-foreground text-sm">{item.id}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground text-sm">{item.plan}</span>
                    <span className="text-muted-foreground text-xs ml-1">({item.planType} · {item.gatewayLabel})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(item.purchaseDate)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground text-sm">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.endDate ? formatDate(item.endDate) : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => window.open(item.receiptUrl, "_blank", "noopener,noreferrer")}
                          disabled={!item.canDownloadReceipt}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Recibo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(item.receiptUrl, "_blank", "noopener,noreferrer")}
                          disabled={!item.canDownloadReceipt}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Recibo
                        </DropdownMenuItem>
                        {item.status === "processing" && item.gatewayLabel === "PIX" && billingCard.hasPendingPix && billingCard.subscriptionId === item.subscriptionId && (
                          <DropdownMenuItem onClick={openPendingPixPayment}>
                            <QrCode className="h-4 w-4 mr-2" />
                            {billingCard.pendingPixExpired ? "Gerar novo PIX" : "Abrir PIX pendente"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredHistory.length > 0 && (
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredHistory.length)} de{" "}
              {filteredHistory.length}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    currentPage === page && "bg-foreground text-background"
                  )}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ===== FLOATING CANCEL BUTTON FOR 3DS (rendered via Portal to body, outside #root) ===== */}
      {antifraudProcessing && createPortal(
        <div data-threeds-cancel className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483647] flex flex-col items-center gap-2">
          <p className="text-sm text-white bg-black/70 px-4 py-2 rounded-lg shadow-lg">
            Verificação de segurança em andamento...
          </p>
          <button
            onClick={() => {
              setAntifraudProcessing(false);
              // paymentModalOpen is still true, so the Dialog will reopen automatically
              toast.info('Verificação cancelada. Você pode tentar novamente.');
            }}
            className="px-6 py-2 bg-red-500 hover:bg-red-500 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
          >
            Cancelar verificação
          </button>
        </div>,
        document.body
      )}

      {/* ===== PAYMENT METHOD SELECTION SIDEBAR ===== */}
      <Sheet open={paymentModalOpen && !antifraudProcessing} onOpenChange={(open) => {
          // Não permitir fechar enquanto a verificação antifraude está em andamento.
          if (!antifraudProcessing) {
            setPaymentModalOpen(open);
          }
        }}>
        <SheetContent side="right" className="w-full p-0 overflow-hidden flex flex-col gap-0 sm:max-w-[371px]" hideCloseButton>
          <SheetTitle className="sr-only">
            {paymentStep === "select" && "Escolha o método de pagamento"}
            {paymentStep === "pix" && "Pagamento via PIX"}
            {paymentStep === "card_form" && "Dados do Cartão"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Escolha entre PIX e cartão para assinar o plano selecionado.
          </SheetDescription>

          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {paymentStep === "pix" ? (
                    <QrCode className="h-5 w-5 text-white" />
                  ) : paymentStep === "card_form" ? (
                    <CreditCard className="h-5 w-5 text-white" />
                  ) : (
                    <Wallet className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {paymentStep === "select" && "Método de Pagamento"}
                    {paymentStep === "pix" && "Pagamento via PIX"}
                    {paymentStep === "card_form" && "Dados do Cartão"}
                  </h2>
                  <p className="text-sm text-white/80">
                    {paymentStep === "select" && "Escolha como deseja assinar"}
                    {paymentStep === "pix" && "Escaneie ou copie o código"}
                    {paymentStep === "card_form" && "Preencha os dados do cartão"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
            {/* Step: Select payment method */}
            {paymentStep === "select" && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-500" />
                  Escolha o método de pagamento
                </h3>
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  {enabledGateways?.map((gw) => {
                    const icons: Record<string, any> = {
                      paytime_pix: QrCode,
                      paytime_card: CreditCard,
                      stripe_card: Wallet,
                    };
                    const descriptions: Record<string, string> = {
                      paytime_pix: "Pagamento via QR Code",
                      paytime_card: "Cartão de crédito",
                      stripe_card: "Cartão via Stripe (internacional)",
                    };
                    const Icon = icons[gw.gateway] || CreditCard;
                    return (
                      <button
                        key={gw.gateway}
                        type="button"
                        onClick={() => handleSelectPaymentMethod(gw.gateway)}
                        disabled={pixCheckoutMutation.isPending || checkoutMutation.isPending}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors group text-left disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted/70 group-hover:bg-red-100 dark:group-hover:bg-red-950/40 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{gw.displayName}</p>
                          <p className="text-xs text-muted-foreground">{descriptions[gw.gateway] || ""}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                      </button>
                    );
                  })}

                  {(pixCheckoutMutation.isPending || checkoutMutation.isPending) && (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Processando...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: PIX QR Code */}
            {paymentStep === "pix" && pixData && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-red-500" />
                    QR Code PIX
                  </h3>
                  <div className={cn(
                    "space-y-4 p-4 rounded-xl",
                    isCurrentPixExpired ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/50",
                  )}>
                    {isCurrentPixExpired ? (
                      <div className="rounded-xl border border-red-200 dark:border-red-500 bg-background p-5 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-500 dark:text-red-300">QR Code PIX expirado</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Por segurança, não copie nem pague este código. Gere um novo PIX para evitar recusa no aplicativo do banco.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={refreshPixCode}
                          disabled={replacePendingPixMutation.isPending}
                          className="w-full gap-2 bg-red-500 hover:bg-red-500 text-white"
                        >
                          {replacePendingPixMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Gerar novo PIX
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-background rounded-xl p-4 border border-border flex items-center justify-center">
                          <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData.emv)}`}
                              alt="QR Code PIX"
                              className="w-44 h-44"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-xs font-medium text-muted-foreground">Ou copie o código PIX:</p>
                            <span className="text-[11px] text-muted-foreground">
                              {pixRemainingMinutes !== null
                                ? `Expira em ${pixRemainingMinutes} min`
                                : `Validade: ${pixExpirationMinutes} min`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              value={pixData.emv}
                              readOnly
                              className="h-10 text-xs font-mono bg-background"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={copyPixCode}
                              className="h-10 flex-shrink-0 gap-1"
                            >
                              {pixCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                              {pixCopied ? "Copiado" : "Copiar"}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {pixPaymentConfirmed ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Pagamento confirmado! Ativando seu plano...
                      </p>
                    </div>
                  </div>
                ) : isCurrentPixExpired ? (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5" />
                      <p className="text-xs text-red-500 dark:text-red-300">
                        Este PIX ficou aberto por mais de {pixExpirationMinutes} minutos e pode ser recusado pelo banco. Gere uma nova cobrança para continuar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Aguardando pagamento... Seu plano será ativado automaticamente após a confirmação.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Card form */}
            {paymentStep === "card_form" && (
              <div className="space-y-6">
                {/* Card data */}
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-500" /> Dados do Cartão
                  </h3>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">Nome no cartão</Label>
                      <Input
                        value={cardForm.holderName}
                        onChange={(e) => setCardForm(p => ({ ...p, holderName: e.target.value }))}
                        placeholder="NOME COMPLETO"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">CPF do titular</Label>
                      <Input
                        value={cardForm.holderDocument}
                        onChange={(e) => setCardForm(p => ({ ...p, holderDocument: e.target.value }))}
                        placeholder="000.000.000-00"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">Número do cartão</Label>
                      <Input
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm(p => ({ ...p, cardNumber: e.target.value }))}
                        placeholder="0000 0000 0000 0000"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Mês</Label>
                        <Input
                          value={cardForm.expirationMonth}
                          onChange={(e) => setCardForm(p => ({ ...p, expirationMonth: e.target.value }))}
                          placeholder="MM"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Ano</Label>
                        <Input
                          value={cardForm.expirationYear}
                          onChange={(e) => setCardForm(p => ({ ...p, expirationYear: e.target.value }))}
                          placeholder="AAAA"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">CVV</Label>
                        <Input
                          value={cardForm.securityCode}
                          onChange={(e) => setCardForm(p => ({ ...p, securityCode: e.target.value }))}
                          placeholder="123"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal data */}
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" /> Dados Pessoais
                  </h3>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Nome</Label>
                        <Input
                          value={cardForm.firstName}
                          onChange={(e) => setCardForm(p => ({ ...p, firstName: e.target.value }))}
                          placeholder="João"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Sobrenome</Label>
                        <Input
                          value={cardForm.lastName}
                          onChange={(e) => setCardForm(p => ({ ...p, lastName: e.target.value }))}
                          placeholder="Silva"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">Telefone</Label>
                      <Input
                        value={cardForm.phone}
                        onChange={(e) => setCardForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">Email</Label>
                      <Input
                        value={cardForm.email}
                        onChange={(e) => setCardForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-red-500" /> Endereço
                  </h3>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Rua</Label>
                        <Input
                          value={cardForm.street}
                          onChange={(e) => setCardForm(p => ({ ...p, street: e.target.value }))}
                          placeholder="Rua Exemplo"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Número</Label>
                        <Input
                          value={cardForm.number}
                          onChange={(e) => setCardForm(p => ({ ...p, number: e.target.value }))}
                          placeholder="123"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">Bairro</Label>
                      <Input
                        value={cardForm.neighborhood}
                        onChange={(e) => setCardForm(p => ({ ...p, neighborhood: e.target.value }))}
                        placeholder="Centro"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</Label>
                      <Input
                        value={cardForm.complement}
                        onChange={(e) => setCardForm(p => ({ ...p, complement: e.target.value }))}
                        placeholder="Apto 101"
                        className="h-10 text-sm bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Cidade</Label>
                        <Input
                          value={cardForm.city}
                          onChange={(e) => setCardForm(p => ({ ...p, city: e.target.value }))}
                          placeholder="São Paulo"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">Estado</Label>
                        <Input
                          value={cardForm.state}
                          onChange={(e) => setCardForm(p => ({ ...p, state: e.target.value }))}
                          placeholder="SP"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">CEP</Label>
                        <Input
                          value={cardForm.zipCode}
                          onChange={(e) => setCardForm(p => ({ ...p, zipCode: e.target.value }))}
                          placeholder="00000-000"
                          className="h-10 text-sm bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(paymentStep === "pix" || paymentStep === "card_form") && (
            <div className="p-4 border-t border-border/50 bg-card">
              {paymentStep === "pix" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPaymentStep("select"); setPixData(null); }}
                  className="w-full"
                  disabled={pixPaymentConfirmed}
                >
                  Voltar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentStep("select")}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCardSubmit}
                    disabled={cardCheckoutMutation.isPending || antifraudProcessing}
                    className="flex-1 bg-red-500 hover:bg-red-500 text-white"
                  >
                    {cardCheckoutMutation.isPending || antifraudProcessing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {antifraudProcessing ? 'Verificando segurança...' : 'Processando...'}</>
                    ) : (
                      <><CreditCard className="h-4 w-4 mr-2" /> Pagar</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ===== DOWNGRADE CONFIRMATION MODAL ===== */}
      <Dialog open={downgradeModalOpen} onOpenChange={setDowngradeModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-lg font-bold">Migrar para o Plano Gratuito</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">Atenção</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Ao migrar para o plano gratuito, você perderá acesso aos recursos do seu plano atual. Essa ação cancelará sua assinatura ativa quando houver.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Seu plano atual <strong className="text-foreground">{planNameMap[userPlanType] || userPlanType}</strong> será migrado para o <strong className="text-foreground">Plano Gratuito (Free)</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Você poderá voltar a assinar um plano pago a qualquer momento.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDowngradeModalOpen(false)}
                disabled={downgradeMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-500 text-white"
                onClick={() => downgradeMutation.mutate()}
                disabled={downgradeMutation.isPending}
              >
                {downgradeMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Migrando...</>
                ) : (
                  "Confirmar Migração"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Retention Modal */}
      <CancelRetentionModal
        open={cancelRetentionOpen}
        onOpenChange={setCancelRetentionOpen}
        currentPlanName={currentPlan?.name || "Atual"}
        currentAmountFormatted={currentPlan?.price ? formatCurrency(currentPlan.price) : "R$ 0,00"}
        onCanceled={() => {
          void trpcUtils.planPaytime.getBillingOverview.invalidate();
        }}
      />
    </AdminLayout>
  );
}
