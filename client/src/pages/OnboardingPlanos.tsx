import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Star, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  buttonText: string;
  highlighted?: boolean;
  icon: React.ReactNode;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: "trial",
    name: "Teste Grátis",
    description: "Teste todas as funcionalidades por 15 dias",
    price: "R$ 0",
    period: "/15 dias",
    icon: <Star className="h-6 w-6" />,
    features: [
      { text: "Todas as funcionalidades", included: true },
      { text: "Categorias ilimitadas", included: true },
      { text: "Link do cardápio público", included: true },
      { text: "Gestão de pedidos", included: true },
      { text: "Relatórios básicos", included: true },
      { text: "Suporte por email", included: true },
    ],
    buttonText: "Começar teste grátis",
  },
  {
    id: "lite",
    name: "Lite",
    description: "Para restaurantes em crescimento",
    price: "R$ 49",
    period: "/mês",
    icon: <Zap className="h-6 w-6" />,
    features: [
      { text: "Até 100 produtos no cardápio", included: true },
      { text: "Categorias ilimitadas", included: true },
      { text: "Link do cardápio público", included: true },
      { text: "Suporte por email", included: true },
      { text: "Gestão de pedidos", included: true },
      { text: "Relatórios básicos", included: true },
    ],
    buttonText: "Assinar Lite",
  },
  {
    id: "basic",
    name: "Essencial",
    description: "O equilíbrio perfeito para seu restaurante",
    price: "R$ 79",
    period: "/mês",
    icon: <CreditCard className="h-6 w-6" />,
    features: [
      { text: "Tudo do plano Lite", included: true },
      { text: "Produtos ilimitados", included: true },
      { text: "Suporte pelo WhatsApp", included: true },
      { text: "Dashboard completa", included: true },
      { text: "Relatórios financeiros", included: true },
      { text: "Campanhas SMS", included: true },
    ],
    buttonText: "Assinar Essencial",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Recursos completos para seu negócio",
    price: "R$ 99",
    period: "/mês",
    icon: <Crown className="h-6 w-6" />,
    highlighted: true,
    badge: "Mais popular",
    features: [
      { text: "Produtos ilimitados", included: true },
      { text: "Categorias ilimitadas", included: true },
      { text: "Gestão de pedidos avançada", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Múltiplas formas de pagamento", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    buttonText: "Assinar Pro",
  },
];

export default function OnboardingPlanos() {
  const [, setLocation] = useLocation();
  const { forceTheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forçar tema light no onboarding
  useEffect(() => {
    forceTheme('light');
    return () => {
      forceTheme(null);
    };
  }, [forceTheme]);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (planId === "trial") {
      toast.success("Teste grátis ativado! Bem-vindo ao Mindi!");
      window.location.href = "/";
    } else {
      // Para planos pagos, redirecionar para página de pagamento
      toast.info("Redirecionando para pagamento...");
      // Por enquanto, apenas redireciona para o dashboard
      // Futuramente integrar com Stripe ou outro gateway
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-muted-foreground/20 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-2xl shadow-lg mb-4">
            <img loading="lazy" src="/logo.svg" alt="Mindi" className="w-10 h-10" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Comece com o plano gratuito ou escolha um plano que atenda às suas necessidades
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative bg-card rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                plan.highlighted
                  ? "ring-2 ring-red-500"
                  : "border border-border"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <div className="bg-red-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className={cn(
                "p-6 pb-4",
                plan.highlighted && "bg-red-50"
              )}>
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                  plan.highlighted
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {plan.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 pt-4 border-t border-border/50">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={cn(
                        "flex items-start gap-3 text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        feature.included
                          ? plan.highlighted
                            ? "bg-red-100 text-red-500"
                            : "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Check className="h-3 w-3" />
                      </div>
                      <span className={cn(
                        !feature.included && "line-through"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                  className={cn(
                    "w-full h-12 text-base font-semibold rounded-xl transition-colors duration-200",
                    plan.highlighted
                      ? "bg-red-500 hover:bg-red-500 text-white"
                      : plan.id === "trial"
                      ? "bg-muted-foreground/90 hover:bg-foreground text-white"
                      : "bg-muted-foreground/90 hover:bg-foreground text-white"
                  )}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Todos os planos incluem 15 dias de teste grátis com acesso a todos os recursos.
            <br />
            Cancele a qualquer momento sem compromisso.
          </p>
        </div>
      </div>
    </div>
  );
}
