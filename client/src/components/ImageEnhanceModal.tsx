import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Check, ImageIcon, Search, Palette, Camera, TrendingUp, ShoppingCart, Zap, QrCode, CreditCard, ArrowLeft, Copy, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const ENHANCE_STEPS = [
  { icon: Search, label: "Identificando tipo de comida...", duration: 2000 },
  { icon: Palette, label: "Ajustando iluminação e cores...", duration: 2500 },
  { icon: Camera, label: "Criando cenário profissional...", duration: 3000 },
];

interface ImageEnhanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: number;
  establishmentId?: number;
  imageUrl: string;
  imageIndex: number;
  onEnhanced: (enhancedUrl: string) => void;
}

export default function ImageEnhanceModal({
  open,
  onOpenChange,
  productId,
  establishmentId,
  imageUrl,
  imageIndex,
  onEnhanced,
}: ImageEnhanceModalProps) {
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"packages" | "select_method" | "pix" | "card_form">("packages");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [avulsoQuantity, setAvulsoQuantity] = useState(2);
  const [pixData, setPixData] = useState<{ transactionId: string; emv: string; expiresAt: Date } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaymentConfirmed, setPixPaymentConfirmed] = useState(false);
  const [pendingCardTxId, setPendingCardTxId] = useState<string | null>(null);
  const [cardPaymentConfirmed, setCardPaymentConfirmed] = useState(false);
  const [cardForm, setCardForm] = useState({
    holderName: "", holderDocument: "", cardNumber: "",
    expirationMonth: "", expirationYear: "", securityCode: "",
    firstName: "", lastName: "", phone: "", email: "",
    street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "", complement: "",
  });
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const creditsQuery = trpc.aiCredits.getBalance.useQuery(undefined, { enabled: open });
  const credits = creditsQuery.data?.credits ?? 0;
  const eligible = creditsQuery.data?.eligible ?? false;

  const packagesQuery = trpc.aiCredits.getPackages.useQuery(undefined, { enabled: showBuyCredits });
  const { data: enabledGateways } = trpc.aiCredits.getEnabledGateways.useQuery();

  // PIX checkout mutation
  const pixCheckoutMutation = trpc.aiCredits.createPixCheckout.useMutation({
    onSuccess: (data) => {
      setPixData({
        transactionId: data.transactionId,
        emv: data.emv,
        expiresAt: new Date(data.expiresAt),
      });
      setPaymentStep("pix");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar PIX.");
    },
  });

  // Card checkout mutation
  const cardCheckoutMutation = trpc.aiCredits.createCardCheckout.useMutation({
    onSuccess: (data) => {
      if (data.status === "approved") {
        toast.success(`${data.credits} créditos adicionados com sucesso!`);
        creditsQuery.refetch();
        setShowBuyCredits(false);
        setPaymentStep("packages");
        setSelectedPackageId(null);
      } else if (data.status === "pending_auth") {
        // Store transaction ID and start polling
        setPendingCardTxId(data.transactionId);
        setPaymentStep("card_form"); // stay on card_form to show processing state
        if (data.authUrl) {
          window.open(data.authUrl, "_blank");
          toast.info("Complete a autenticação 3DS na nova aba.");
        } else {
          toast.info("Pagamento em processamento...");
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao processar cartão.");
    },
  });

  // Poll PIX payment using manual setTimeout approach (same as PDV)
  const trpcUtils = trpc.useUtils();
  useEffect(() => {
    if (!pixData || paymentStep !== "pix" || pixPaymentConfirmed) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const pollPixStatus = async () => {
      if (cancelled) return;
      try {
        const result = await trpcUtils.aiCredits.pollPaymentStatus.fetch({
          transactionId: pixData.transactionId,
        });
        if (cancelled) return;
        if (result.status === "paid" && result.credited) {
          setPixPaymentConfirmed(true);
          toast.success("Cr\u00e9ditos adicionados com sucesso!");
          creditsQuery.refetch();
          setTimeout(() => {
            setShowBuyCredits(false);
            setPaymentStep("packages");
            setPixData(null);
            setPixPaymentConfirmed(false);
            setSelectedPackageId(null);
          }, 2000);
          return;
        } else if (result.status === "failed") {
          toast.error("Pagamento PIX falhou ou expirou.");
          setPaymentStep("packages");
          setPixData(null);
          return;
        }
      } catch (error) {
        console.warn("[ImageEnhance] Erro ao verificar status PIX:", error);
      }
      if (!cancelled) {
        timeoutId = setTimeout(pollPixStatus, 5000);
      }
    };
    pollPixStatus();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pixData?.transactionId, paymentStep, pixPaymentConfirmed]);

  // Poll CARD payment status
  useEffect(() => {
    if (!pendingCardTxId || cardPaymentConfirmed) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const pollCardStatus = async () => {
      if (cancelled) return;
      try {
        const result = await trpcUtils.aiCredits.pollPaymentStatus.fetch({
          transactionId: pendingCardTxId,
        });
        if (cancelled) return;
        if (result.status === "paid" && result.credited) {
          setCardPaymentConfirmed(true);
          toast.success("Créditos adicionados com sucesso!");
          creditsQuery.refetch();
          setTimeout(() => {
            setShowBuyCredits(false);
            setPaymentStep("packages");
            setPendingCardTxId(null);
            setCardPaymentConfirmed(false);
            setSelectedPackageId(null);
          }, 2000);
          return;
        } else if (result.status === "failed") {
          toast.error("Pagamento com cartão foi recusado.");
          setPendingCardTxId(null);
          return;
        }
      } catch (error) {
        console.warn("[ImageEnhance] Erro ao verificar status cartão:", error);
      }
      if (!cancelled) {
        timeoutId = setTimeout(pollCardStatus, 4000);
      }
    };
    pollCardStatus();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pendingCardTxId, cardPaymentConfirmed]);

  // Enhance steps animation
  useEffect(() => {
    if (isEnhancing) {
      setCurrentStep(0);
      let step = 0;
      const advanceStep = () => {
        step++;
        if (step < ENHANCE_STEPS.length) {
          setCurrentStep(step);
          stepTimerRef.current = setTimeout(advanceStep, ENHANCE_STEPS[step].duration);
        }
      };
      stepTimerRef.current = setTimeout(advanceStep, ENHANCE_STEPS[0].duration);
    } else {
      if (stepTimerRef.current) { clearTimeout(stepTimerRef.current); stepTimerRef.current = null; }
    }
    return () => { if (stepTimerRef.current) clearTimeout(stepTimerRef.current); };
  }, [isEnhancing]);

  const enhanceWithProductMutation = trpc.product.enhanceImage.useMutation({
    onSuccess: (data) => {
      setEnhancedUrl(data.enhancedUrl);
      setShowComparison(true);
      setIsEnhancing(false);
      creditsQuery.refetch();
    },
    onError: (error) => {
      if (error.message?.includes("créditos")) setShowBuyCredits(true);
      toast.error(error.message || "Erro ao melhorar imagem. Tente novamente.");
      setIsEnhancing(false);
    },
  });

  const enhanceStandaloneMutation = trpc.upload.enhanceImage.useMutation({
    onSuccess: (data) => {
      setEnhancedUrl(data.enhancedUrl);
      setShowComparison(true);
      setIsEnhancing(false);
      creditsQuery.refetch();
    },
    onError: (error) => {
      if (error.message?.includes("créditos")) setShowBuyCredits(true);
      toast.error(error.message || "Erro ao melhorar imagem. Tente novamente.");
      setIsEnhancing(false);
    },
  });

  const handleEnhance = () => {
    if (credits <= 0) { setShowBuyCredits(true); return; }
    setIsEnhancing(true);
    setShowComparison(false);
    setEnhancedUrl(null);
    if (productId) {
      enhanceWithProductMutation.mutate({ productId, imageUrl, imageIndex });
    } else if (establishmentId) {
      enhanceStandaloneMutation.mutate({ imageUrl, establishmentId });
    }
  };

  const handleAccept = () => {
    if (enhancedUrl) { onEnhanced(enhancedUrl); toast.success("Foto profissional aplicada com sucesso!"); }
    handleClose();
  };

  const handleClose = () => {
    setEnhancedUrl(null);
    setShowComparison(false);
    setIsEnhancing(false);
    setCurrentStep(0);
    setShowBuyCredits(false);
    setPaymentStep("packages");
    setSelectedPackageId(null);
    setPixData(null);
    setPixCopied(false);
    setPixPaymentConfirmed(false);
    onOpenChange(false);
  };

  const handleBuyPackage = (packageId: string, quantity?: number) => {
    setSelectedPackageId(packageId);
    const qty = quantity || 1;
    // Check available gateways
    const hasPixGw = enabledGateways?.some(g => g.gateway === "paytime_pix");
    const hasCardGw = enabledGateways?.some(g => g.gateway === "paytime_card");
    if (hasPixGw && hasCardGw) {
      setPaymentStep("select_method");
    } else if (hasPixGw) {
      pixCheckoutMutation.mutate({ packageId, quantity: qty });
    } else if (hasCardGw) {
      setPaymentStep("card_form");
    } else {
      toast.error("Nenhum método de pagamento habilitado.");
    }
  };

  const handleSelectMethod = (method: string) => {
    if (!selectedPackageId) return;
    if (method === "paytime_pix") {
      pixCheckoutMutation.mutate({ packageId: selectedPackageId, quantity: selectedPackageId === "ai_avulso" ? avulsoQuantity : 1 });
    } else if (method === "paytime_card") {
      setPaymentStep("card_form");
    }
  };

  const handleCardSubmit = () => {
    if (!selectedPackageId) return;
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
      packageId: selectedPackageId,
      quantity: selectedPackageId === "ai_avulso" ? avulsoQuantity : 1,
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
          street: cf.street, number: cf.number, complement: cf.complement,
          neighborhood: cf.neighborhood, city: cf.city, state: cf.state, zipCode: cf.zipCode,
        },
      },
    });
  };

  const handleCopyPix = () => {
    if (pixData?.emv) {
      navigator.clipboard.writeText(pixData.emv);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const StepIcon = ENHANCE_STEPS[currentStep]?.icon || Search;

  // Render buy credits content based on paymentStep
  const renderBuyCreditsContent = () => {
    if (paymentStep === "select_method") {
      return (
        <div className="p-5 space-y-4">
          <button onClick={() => { setPaymentStep("packages"); setSelectedPackageId(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </button>
          <h4 className="text-sm font-bold text-foreground text-center">Forma de pagamento</h4>
          <p className="text-xs text-muted-foreground text-center">Escolha como deseja pagar</p>
          <div className="space-y-2.5">
            {enabledGateways?.filter(g => g.gateway !== "stripe_card").map((gw) => {
              const icons: Record<string, any> = { paytime_pix: QrCode, paytime_card: CreditCard };
              const descriptions: Record<string, string> = { paytime_pix: "Pagamento instantâneo via QR Code", paytime_card: "Cartão de crédito" };
              const Icon = icons[gw.gateway] || CreditCard;
              return (
                <button
                  key={gw.gateway}
                  type="button"
                  onClick={() => handleSelectMethod(gw.gateway)}
                  disabled={pixCheckoutMutation.isPending}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors group text-left disabled:opacity-60"
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
            {pixCheckoutMutation.isPending && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Gerando PIX...</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (paymentStep === "pix" && pixData) {
      return (
        <div className="p-5 space-y-4">
          <button onClick={() => { setPaymentStep("packages"); setPixData(null); setSelectedPackageId(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </button>
          {pixPaymentConfirmed ? (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Pagamento confirmado!</h4>
              <p className="text-xs text-muted-foreground mt-1">Seus créditos foram adicionados.</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h4 className="text-sm font-bold text-foreground">Pagamento via PIX</h4>
                <p className="text-xs text-muted-foreground mt-1">Copie o código e pague no app do seu banco</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-center">
                  <div className="bg-white p-3 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData.emv)}`}
                      alt="QR Code PIX"
                      className="w-[180px] h-[180px]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCopyPix}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
                >
                  {pixCopied ? <><CheckCircle2 className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar código PIX</>}
                </button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguardando pagamento...
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (paymentStep === "card_form") {
      // Show processing/confirmed state when card payment is pending
      if (pendingCardTxId) {
        return (
          <div className="p-5 space-y-4">
            {cardPaymentConfirmed ? (
              <div className="text-center py-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Pagamento confirmado!</h4>
                <p className="text-xs text-muted-foreground mt-1">Seus créditos foram adicionados.</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mb-3">
                  <Loader2 className="h-7 w-7 text-orange-500 animate-spin" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Processando pagamento...</h4>
                <p className="text-xs text-muted-foreground mt-1">Aguarde enquanto confirmamos seu pagamento com cartão.</p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verificando status...
                </div>
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <button onClick={() => { setPaymentStep("packages"); setSelectedPackageId(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </button>
          <h4 className="text-sm font-bold text-foreground text-center">Dados do Cartão</h4>
          <div className="space-y-2.5">
            <input placeholder="Nome no cartão" value={cardForm.holderName} onChange={e => setCardForm(p => ({...p, holderName: e.target.value}))} className="w-full p-2.5 rounded-lg border border-border text-sm bg-background" />
            <input placeholder="CPF do titular" value={cardForm.holderDocument} onChange={e => setCardForm(p => ({...p, holderDocument: e.target.value}))} className="w-full p-2.5 rounded-lg border border-border text-sm bg-background" />
            <input placeholder="Número do cartão" value={cardForm.cardNumber} onChange={e => setCardForm(p => ({...p, cardNumber: e.target.value}))} className="w-full p-2.5 rounded-lg border border-border text-sm bg-background" />
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Mês" value={cardForm.expirationMonth} onChange={e => setCardForm(p => ({...p, expirationMonth: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
              <input placeholder="Ano" value={cardForm.expirationYear} onChange={e => setCardForm(p => ({...p, expirationYear: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
              <input placeholder="CVV" value={cardForm.securityCode} onChange={e => setCardForm(p => ({...p, securityCode: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-foreground pt-2">Dados pessoais</h4>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nome" value={cardForm.firstName} onChange={e => setCardForm(p => ({...p, firstName: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
              <input placeholder="Sobrenome" value={cardForm.lastName} onChange={e => setCardForm(p => ({...p, lastName: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
            </div>
            <input placeholder="Telefone" value={cardForm.phone} onChange={e => setCardForm(p => ({...p, phone: e.target.value}))} className="w-full p-2.5 rounded-lg border border-border text-sm bg-background" />
            <input placeholder="E-mail" value={cardForm.email} onChange={e => setCardForm(p => ({...p, email: e.target.value}))} className="w-full p-2.5 rounded-lg border border-border text-sm bg-background" />
          </div>
          <h4 className="text-sm font-bold text-foreground pt-2">Endereço</h4>
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Rua" value={cardForm.street} onChange={e => setCardForm(p => ({...p, street: e.target.value}))} className="col-span-2 p-2.5 rounded-lg border border-border text-sm bg-background" />
              <input placeholder="Nº" value={cardForm.number} onChange={e => setCardForm(p => ({...p, number: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Bairro" value={cardForm.neighborhood} onChange={e => setCardForm(p => ({...p, neighborhood: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
              <input placeholder="Cidade" value={cardForm.city} onChange={e => setCardForm(p => ({...p, city: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Estado (UF)" value={cardForm.state} onChange={e => setCardForm(p => ({...p, state: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
              <input placeholder="CEP" value={cardForm.zipCode} onChange={e => setCardForm(p => ({...p, zipCode: e.target.value}))} className="p-2.5 rounded-lg border border-border text-sm bg-background" />
            </div>
          </div>
          <Button
            onClick={handleCardSubmit}
            disabled={cardCheckoutMutation.isPending}
            className="w-full rounded-xl h-11 font-semibold mt-3"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            {cardCheckoutMutation.isPending ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processando...</span>
            ) : (
              <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagar com cartão</span>
            )}
          </Button>
        </div>
      );
    }

    // Default: packages list
    return (
      <div className="p-5 space-y-4">
        <div className="text-center py-2">
          {credits <= 0 ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-red-400" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Seus créditos de melhoria de imagem acabaram</h4>
              <p className="text-xs text-muted-foreground mt-1">Compre um pacote para continuar transformando suas fotos em imagens profissionais.</p>
            </>
          ) : (
            <>
              <h4 className="text-sm font-bold text-foreground">Comprar mais créditos</h4>
              <p className="text-xs text-muted-foreground mt-1">Cada crédito = 1 melhoria de foto com IA</p>
            </>
          )}
        </div>
        <div className="space-y-2.5">
          {packagesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : (
            packagesQuery.data?.map((pkg) => (
              (pkg as any).avulso ? (
                <div
                  key={pkg.id}
                  className={`w-full relative p-4 rounded-xl border-2 border-border hover:border-red-200 dark:hover:border-red-500 transition-[colors,box-shadow] hover:shadow-md ${pixCheckoutMutation.isPending ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Crédito avulso</p>
                      <p className="text-[11px] text-muted-foreground">R$ 0,90 por melhoria</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAvulsoQuantity(Math.max(2, avulsoQuantity - 1))}
                        className="px-3 py-1.5 text-sm font-bold hover:bg-muted transition-colors"
                        disabled={pixCheckoutMutation.isPending}
                      >-</button>
                      <input
                        type="number"
                        min="2"
                        max="999"
                        value={avulsoQuantity}
                        onChange={(e) => setAvulsoQuantity(Math.max(2, Math.min(999, parseInt(e.target.value) || 2)))}
                        className="w-14 text-center text-sm font-bold border-x py-1.5 bg-transparent"
                        disabled={pixCheckoutMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setAvulsoQuantity(Math.min(999, avulsoQuantity + 1))}
                        className="px-3 py-1.5 text-sm font-bold hover:bg-muted transition-colors"
                        disabled={pixCheckoutMutation.isPending}
                      >+</button>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-base font-bold text-foreground">R$ {(avulsoQuantity * 0.90).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <button
                      onClick={() => handleBuyPackage(pkg.id, avulsoQuantity)}
                      disabled={pixCheckoutMutation.isPending}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >Comprar</button>
                  </div>
                </div>
              ) : (
              <button
                key={pkg.id}
                onClick={() => handleBuyPackage(pkg.id)}
                disabled={pixCheckoutMutation.isPending}
                className={`w-full relative flex items-center justify-between p-4 rounded-xl border-2 transition-[colors,box-shadow] hover:shadow-md ${
                  (pkg as any).popular
                    ? "border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 hover:border-red-400"
                    : "border-border hover:border-red-200 dark:hover:border-red-500"
                } ${pixCheckoutMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {(pkg as any).popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-lg">
                    MAIS POPULAR
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${(pkg as any).popular ? "bg-red-100 dark:bg-red-500/50" : "bg-muted"}`}>
                    <Sparkles className={`h-4 w-4 ${(pkg as any).popular ? "text-red-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                    <p className="text-[11px] text-muted-foreground">{pkg.pricePerImage} por melhoria</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">{pkg.priceFormatted}</p>
                </div>
              </button>
              )
            ))
          )}
        </div>
        <div className="flex gap-3 pt-1">
          {credits > 0 ? (
            <Button variant="outline" onClick={() => setShowBuyCredits(false)} className="flex-1 rounded-xl h-11">Voltar</Button>
          ) : (
            <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl h-11">Fechar</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto !p-0 !gap-0 border-t-4 border-t-red-500"
        style={{ borderRadius: '16px' }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Mindi Vision</DialogTitle>
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30">
              <Sparkles className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Mindi Vision</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Transforme suas fotos em imagens profissionais</p>
            </div>
          </div>
          {!creditsQuery.isLoading && (
            credits <= 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" onClick={() => setShowBuyCredits(true)}>
                <Zap className="h-3 w-3" />
                0 créditos
              </div>
            ) : (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                credits > 5
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : credits > 0
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  : "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500"
              }`}>
                <Zap className="h-3 w-3" />
                {credits} {credits === 1 ? "crédito" : "créditos"}
              </div>
            )
          )}
          </div>
        </div>
        {showBuyCredits ? (
          renderBuyCreditsContent()
        ) : isEnhancing ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[280px]">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-900/20 flex items-center justify-center">
                <StepIcon className="h-8 w-8 text-red-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
            </div>
            <p className="text-sm font-medium text-foreground animate-pulse">{ENHANCE_STEPS[currentStep]?.label}</p>
            <div className="flex gap-1.5 mt-4">
              {ENHANCE_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? "w-8 bg-red-500" : "w-4 bg-muted"}`} />
              ))}
            </div>
          </div>
        ) : showComparison && enhancedUrl ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted">
                  <img src={imageUrl} alt="Imagem original" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide">Mindi Vision</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-red-300 dark:border-red-500 bg-muted shadow-lg shadow-red-500/10">
                  <img src={enhancedUrl} alt="Imagem profissional" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 flex items-center justify-center">
                    <Sparkles className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 flex-shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-800 dark:text-green-300">Produtos com foto profissional vendem até 3x mais.</p>
                <p className="text-[11px] text-green-600 dark:text-green-400 mt-0.5">Sua foto foi otimizada automaticamente para o cardápio.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { toast.info("Imagem original mantida"); handleClose(); }} className="flex-1 rounded-xl h-11 text-sm">
                <ImageIcon className="h-4 w-4 mr-1.5" />Usar original
              </Button>
              <Button variant="outline" onClick={handleEnhance} disabled={isEnhancing || credits <= 0} className="flex-1 rounded-xl h-11 text-sm">
                <RotateCcw className="h-4 w-4 mr-1.5" />{isEnhancing ? "Gerando..." : "Tentar outra versão"}
              </Button>
              <Button onClick={handleAccept} className="flex-1 rounded-xl h-11 text-sm font-semibold" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                <Check className="h-4 w-4 mr-1.5" />Usar foto profissional
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted">
              <img src={imageUrl} alt="Imagem para melhorar" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl h-11">Cancelar</Button>
              {credits > 0 ? (
                <Button
                  onClick={credits > 0 ? handleEnhance : () => setShowBuyCredits(true)}
                  disabled={isEnhancing}
                  className="flex-1 rounded-xl h-11 font-semibold"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  {isEnhancing ? (
                    <span className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processando...</span>
                  ) : credits > 0 ? (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Melhorar Foto</span>
                  ) : (
                    <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Comprar créditos</span>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setShowBuyCredits(true)}
                  className="flex-1 rounded-xl h-11 font-semibold"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Comprar créditos</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
