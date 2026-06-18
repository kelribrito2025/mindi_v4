import { useState } from "react";
import { Check, Crown, X, Zap, Star, Rocket, Shield, ArrowRight, ChevronRight, Sparkles } from "lucide-react";

// ====== SHARED DATA ======
interface Plan {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  priceLabel?: string;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
  badge?: string;
  description: string;
}

const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Teste Grátis",
    price: { monthly: 0, annual: 0 },
    features: [
      "Teste grátis por 15 dias",
      "1 estabelecimento",
      "Link personalizado para o seu restaurante",
      "Gerenciador de pedidos",
    ],
    buttonText: "Começar teste grátis",
    description: "Para quem está começando",
  },
  {
    id: "basic",
    name: "Essencial",
    price: { monthly: 89, annual: 890 },
    features: [
      "Tudo do plano gratuito",
      "1 estabelecimento",
      "Suporte pelo WhatsApp",
      "Dashboard completa",
      "Relatórios financeiros",
      "Campanhas SMS",
      "Cupons de desconto",
    ],
    buttonText: "Começar agora",
    highlighted: true,
    badge: "Mais Popular",
    description: "Para negócios em crescimento",
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: -1, annual: -1 },
    priceLabel: "R$ --,--",
    features: [
      "Tudo do plano Essencial",
      "Estabelecimentos ilimitados",
      "Análises avançadas",
      "Assistente de IA",
      "Relatórios personalizados",
      "Programa de fidelidade",
    ],
    buttonText: "Em breve",
    description: "Para operações avançadas",
  },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ====== PROPOSAL 1: Cards Clássicos com Destaque Central ======
function Proposal1() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-red-500 font-semibold text-sm tracking-wider uppercase">Planos e Preços</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">Escolha o plano ideal <span className="text-red-500">para você</span></h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Comece grátis e escale conforme seu negócio cresce.</p>
        </div>
        <div className="flex justify-center mb-10">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold">-17%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-3xl p-8 transition-[colors,box-shadow] duration-300 ${plan.highlighted ? "bg-red-500 text-white scale-105 shadow-2xl shadow-red-200" : "bg-gray-50 border border-gray-200 hover:shadow-lg"}`}>
                {plan.badge && <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${plan.highlighted ? "bg-white/20 text-white" : "bg-red-100 text-red-500"}`}>{plan.badge}</span>}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/70" : "text-gray-500"}`}>{plan.description}</p>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className={`text-sm ml-1 ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-white" : "text-red-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-white text-red-500 hover:bg-gray-100" : plan.id === "pro" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 2: Cards Escuros Premium ======
function Proposal2() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-red-400 font-semibold text-sm mb-4"><Crown className="w-4 h-4" /> PLANOS E PREÇOS</span>
          <h2 className="text-4xl font-bold text-white mb-4">Escolha o plano ideal <span className="text-red-400">para você</span></h2>
          <p className="text-gray-400 text-lg">Comece grátis e escale conforme seu negócio cresce.</p>
        </div>
        <div className="flex justify-center mb-10">
          <div className="flex bg-gray-800 rounded-xl p-1">
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-lg text-sm font-medium transition ${!isAnnual ? "bg-gray-700 text-white" : "text-gray-400"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-lg text-sm font-medium transition ${isAnnual ? "bg-gray-700 text-white" : "text-gray-400"}`}>Anual <span className="text-green-400 text-xs">-17%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-2xl p-7 border transition-colors duration-300 ${plan.highlighted ? "border-red-500 bg-gray-900 shadow-lg shadow-red-500/10 relative" : "border-gray-800 bg-gray-900/50 hover:border-gray-700"}`}>
                {plan.highlighted && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl" />}
                {plan.badge && <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-red-500/20 text-red-400">{plan.badge}</span>}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className="text-sm ml-1 text-gray-500">{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-400" : "text-gray-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-gray-900"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 3: Layout Horizontal com Comparação ======
function Proposal3() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos simples, <span className="text-red-500">resultados reais</span></h2>
          <p className="text-gray-500 text-lg">Sem surpresas, sem taxas escondidas.</p>
        </div>
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-red-500 text-white shadow" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${isAnnual ? "bg-red-500 text-white shadow" : "text-gray-500"}`}>Anual <span className={`text-xs font-bold ${isAnnual ? "text-white/80" : "text-green-600"}`}>-17%</span></button>
          </div>
        </div>
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`flex flex-col md:flex-row items-center gap-6 rounded-2xl p-6 md:p-8 transition-[colors,box-shadow] ${plan.highlighted ? "bg-white shadow-xl border-2 border-red-400" : "bg-white/60 border border-gray-200 hover:shadow-md"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.badge && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-500">{plan.badge}</span>}
                  </div>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                      <Check className="w-3 h-3 text-red-500" />{f}
                    </span>
                  ))}
                  {plan.features.length > 4 && <span className="text-xs text-gray-400 px-3 py-1.5">+{plan.features.length - 4} mais</span>}
                </div>
                <div className="text-center md:text-right shrink-0">
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</div>
                  {price > 0 && !plan.priceLabel && <div className="text-xs text-gray-400">{isAnnual ? "/ano" : "/mês"}</div>}
                </div>
                <button className={`shrink-0 px-8 py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 4: Cards com Ícones e Gradiente ======
function Proposal4() {
  const [isAnnual, setIsAnnual] = useState(false);
  const icons = [Zap, Star, Rocket];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-14 gap-6">
          <div>
            <span className="text-red-500 font-semibold text-sm tracking-wider uppercase mb-3 block">Investimento</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Planos que cabem<br />no seu <span className="text-red-500">bolso.</span></h2>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${!isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold ml-1">-17%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const Icon = icons[i];
            return (
              <div key={plan.id} className={`rounded-3xl p-8 transition-all duration-300 relative overflow-hidden group ${plan.highlighted ? "bg-gradient-to-br from-red-500 to-red-500 text-white" : "bg-gray-50 border border-gray-200 hover:border-red-200 hover:shadow-lg"}`}>
                {plan.highlighted && (
                  <>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  </>
                )}
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${plan.highlighted ? "bg-white/20" : "bg-red-50"}`}>
                    <Icon className={`w-7 h-7 ${plan.highlighted ? "text-white" : "text-red-500"}`} />
                  </div>
                  {plan.badge && <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${plan.highlighted ? "bg-white/20 text-white" : "bg-red-100 text-red-500"}`}>{plan.badge}</span>}
                  <h3 className={`text-2xl font-bold mb-1 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                  <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/70" : "text-gray-500"}`}>{plan.description}</p>
                  <div className="mb-6">
                    <span className={`text-5xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                    {price > 0 && !plan.priceLabel && <span className={`text-sm ml-1 ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>{isAnnual ? "/ano" : "/mês"}</span>}
                  </div>
                  <div className={`h-px mb-6 ${plan.highlighted ? "bg-white/20" : "bg-gray-200"}`} />
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`flex items-center gap-3 text-sm ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}>
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-white" : "text-red-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${plan.highlighted ? "bg-white text-red-500 hover:bg-gray-100" : plan.id === "pro" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                    {plan.buttonText} {plan.id !== "pro" && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-400 mt-10">Todos os planos incluem suporte técnico. Cancele a qualquer momento.</p>
      </div>
    </section>
  );
}

// ====== PROPOSAL 5: Minimalista com Bordas ======
function Proposal5() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Preços transparentes</h2>
          <p className="text-gray-500">Sem taxas escondidas. Sem surpresas. Cancele quando quiser.</p>
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-4 text-sm">
              <button onClick={() => setIsAnnual(false)} className={`font-medium transition ${!isAnnual ? "text-gray-900 underline underline-offset-4 decoration-red-500 decoration-2" : "text-gray-400"}`}>Mensal</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setIsAnnual(true)} className={`font-medium transition ${isAnnual ? "text-gray-900 underline underline-offset-4 decoration-red-500 decoration-2" : "text-gray-400"}`}>Anual <span className="text-green-600 text-xs font-bold">(-17%)</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-0 border border-gray-200 rounded-2xl overflow-hidden bg-white">
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`p-8 ${i < 2 ? "md:border-r border-b md:border-b-0 border-gray-200" : ""} ${plan.highlighted ? "bg-red-50/50" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.badge && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">{plan.badge}</span>}
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{price === 0 ? "R$ 0" : plan.priceLabel || fmt(price)}</span>
                  <span className="text-sm text-gray-400 ml-1">{price === 0 ? "/sempre" : !plan.priceLabel ? (isAnnual ? "/ano" : "/mês") : ""}</span>
                </div>
                <button className={`w-full py-3 rounded-lg font-semibold text-sm transition mb-8 ${plan.highlighted ? "bg-red-500 text-white hover:bg-red-500" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"}`}>{plan.buttonText}</button>
                <ul className="space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 6: Cards com Fundo Gradiente por Plano ======
function Proposal6() {
  const [isAnnual, setIsAnnual] = useState(false);
  const gradients = [
    "from-gray-100 to-gray-50",
    "from-red-500 to-red-500",
    "from-gray-900 to-gray-800",
  ];
  const textColors = ["text-gray-900", "text-white", "text-white"];
  const subColors = ["text-gray-500", "text-white/70", "text-gray-400"];
  const featureColors = ["text-gray-600", "text-white/90", "text-gray-300"];
  const checkColors = ["text-red-500", "text-white", "text-red-400"];
  const btnStyles = [
    "bg-gray-900 text-white hover:bg-gray-800",
    "bg-white text-red-500 hover:bg-gray-100",
    "bg-gray-700 text-gray-400 cursor-not-allowed",
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" /> Comece agora
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Invista no crescimento<br />do seu <span className="text-red-500">restaurante</span></h2>
          <div className="flex justify-center mt-6">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold">-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`bg-gradient-to-br ${gradients[i]} rounded-3xl p-8 relative overflow-hidden`}>
                {plan.badge && <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${i === 1 ? "bg-white/20 text-white" : "bg-red-100 text-red-500"}`}>{plan.badge}</span>}
                <h3 className={`text-2xl font-bold mb-1 ${textColors[i]}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${subColors[i]}`}>{plan.description}</p>
                <div className="mb-8">
                  <span className={`text-5xl font-extrabold ${textColors[i]}`}>{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className={`text-sm ml-1 ${subColors[i]}`}>{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className={`flex items-center gap-3 text-sm ${featureColors[i]}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${checkColors[i]}`} />{f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3.5 rounded-xl font-semibold text-sm transition ${btnStyles[i]}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 7: Tabela Comparativa ======
function Proposal7() {
  const [isAnnual, setIsAnnual] = useState(false);
  const allFeatures = [
    "Teste grátis por 15 dias",
    "1 estabelecimento",
    "Link personalizado",
    "Gerenciador de pedidos",
    "Suporte pelo WhatsApp",
    "Dashboard completa",
    "Relatórios financeiros",
    "Campanhas SMS",
    "Cupons de desconto",
    "Estabelecimentos ilimitados",
    "Análises avançadas",
    "Assistente de IA",
    "Programa de fidelidade",
  ];
  const planFeatures: Record<string, string[]> = {
    free: PLANS[0].features,
    basic: PLANS[1].features.concat(PLANS[0].features),
    pro: PLANS[2].features.concat(PLANS[1].features).concat(PLANS[0].features),
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Compare os planos</h2>
          <p className="text-gray-500">Veja tudo que cada plano oferece lado a lado.</p>
          <div className="flex justify-center mt-6">
            <div className="flex bg-white rounded-xl p-1 border border-gray-200">
              <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${!isAnnual ? "bg-red-500 text-white" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${isAnnual ? "bg-red-500 text-white" : "text-gray-500"}`}>Anual</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-4 border-b border-gray-200">
            <div className="p-6 font-semibold text-gray-500 text-sm">Funcionalidades</div>
            {PLANS.map((plan) => {
              const price = isAnnual ? plan.price.annual : plan.price.monthly;
              return (
                <div key={plan.id} className={`p-6 text-center ${plan.highlighted ? "bg-red-50" : ""}`}>
                  <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="text-2xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</div>
                  {price > 0 && !plan.priceLabel && <div className="text-xs text-gray-400">{isAnnual ? "/ano" : "/mês"}</div>}
                </div>
              );
            })}
          </div>
          {allFeatures.map((feature, i) => (
            <div key={i} className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-gray-50/50" : ""} border-b border-gray-100 last:border-0`}>
              <div className="p-4 text-sm text-gray-600">{feature}</div>
              {["trial", "basic", "pro"].map((planId) => (
                <div key={planId} className={`p-4 text-center ${planId === "basic" ? "bg-red-50/30" : ""}`}>
                  {planFeatures[planId].some(f => f.toLowerCase().includes(feature.toLowerCase().slice(0, 10))) ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-4 p-4 border-t border-gray-200">
            <div />
            {PLANS.map((plan) => (
              <div key={plan.id} className="text-center px-2">
                <button className={`w-full py-2.5 rounded-lg font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 text-white hover:bg-red-500" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>{plan.buttonText}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 8: Cards com Borda Lateral Colorida ======
function Proposal8() {
  const [isAnnual, setIsAnnual] = useState(false);
  const borderColors = ["border-l-gray-400", "border-l-red-500", "border-l-gray-800"];
  return (
    <section className="py-20 bg-gradient-to-b from-gray-100 to-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Escolha seu plano</h2>
          <p className="text-gray-500 mb-6">Comece grátis. Cresça sem limites.</p>
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-gray-900 text-white" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-gray-900 text-white" : "text-gray-500"}`}>Anual <span className={`text-xs font-bold ${isAnnual ? "text-green-300" : "text-green-600"}`}>-17%</span></button>
          </div>
        </div>
        <div className="space-y-5">
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`bg-white rounded-xl border-l-4 ${borderColors[i]} p-6 md:p-8 shadow-sm hover:shadow-md transition-[colors,box-shadow] flex flex-col md:flex-row md:items-center gap-6`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.badge && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-500">{plan.badge}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.map((f, fi) => (
                      <span key={fi} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
                        <Check className="w-3 h-3 text-green-500" />{f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-center md:text-right">
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</div>
                  {price > 0 && !plan.priceLabel && <div className="text-xs text-gray-400 mb-3">{isAnnual ? "/ano" : "/mês"}</div>}
                  <button className={`px-8 py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 text-white hover:bg-red-500" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>{plan.buttonText}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 9: Cards com Número Grande e Fundo Bege ======
function Proposal9() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-amber-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Georgia', serif" }}>Preços justos para<br />cada etapa do seu negócio</h2>
          <p className="text-gray-500 text-lg">Escolha o plano que faz sentido para você hoje.</p>
          <div className="flex justify-center mt-8">
            <div className="flex bg-white rounded-lg p-1 border border-amber-200">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2.5 rounded-md text-sm font-medium transition ${!isAnnual ? "bg-amber-100 text-amber-900" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2.5 rounded-md text-sm font-medium transition ${isAnnual ? "bg-amber-100 text-amber-900" : "text-gray-500"}`}>Anual <span className="text-green-700 text-xs font-bold">-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`bg-white rounded-2xl p-8 relative overflow-hidden transition-all hover:shadow-xl ${plan.highlighted ? "ring-2 ring-red-400 shadow-lg" : "border border-amber-200"}`}>
                <div className="absolute -top-4 -right-4 text-[120px] font-extrabold text-gray-100/60 leading-none select-none pointer-events-none">
                  {price === 0 ? "0" : plan.priceLabel ? "?" : Math.round(price)}
                </div>
                <div className="relative z-10">
                  {plan.badge && <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-red-500 text-white mb-4">{plan.badge}</span>}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <span className="text-4xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                    {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400 ml-1">{isAnnual ? "/ano" : "/mês"}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlighted ? "bg-red-100" : "bg-gray-100"}`}>
                          <Check className={`w-3 h-3 ${plan.highlighted ? "text-red-500" : "text-gray-500"}`} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 text-white hover:bg-red-500" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>{plan.buttonText}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 10: Split Hero + Cards ======
function Proposal10() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero split */}
        <div className="bg-gradient-to-r from-red-500 to-red-500 rounded-3xl p-10 lg:p-14 mb-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">Escolha o plano ideal<br />para o seu restaurante</h2>
              <p className="text-white/70 text-lg max-w-lg">Comece grátis e escale conforme seu negócio cresce. Sem surpresas, sem taxas escondidas.</p>
            </div>
            <div className="flex bg-white/10 rounded-xl p-1 shrink-0">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${!isAnnual ? "bg-white text-red-500" : "text-white/70"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${isAnnual ? "bg-white text-red-500" : "text-white/70"}`}>Anual <span className="text-xs font-bold ml-1">-17%</span></button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-2xl p-7 transition-[colors,box-shadow] duration-300 ${plan.highlighted ? "bg-white border-2 border-red-400 shadow-xl" : "bg-gray-50 border border-gray-200 hover:shadow-lg hover:bg-white"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.badge && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-500">{plan.badge}</span>}
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400">{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition mb-6 flex items-center justify-center gap-2 ${plan.highlighted ? "bg-red-500 text-white hover:bg-red-500" : plan.id === "pro" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                  {plan.buttonText} {plan.id !== "pro" && <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="h-px bg-gray-100 mb-6" />
                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-500" : "text-gray-400"}`} />{f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-400 mt-10">Todos os planos incluem suporte técnico. Cancele a qualquer momento.</p>
      </div>
    </section>
  );
}

// ====== PROPOSAL 11: Cards com Ribbon Vermelho ======
function Proposal11() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gradient-to-b from-red-50 via-white to-red-50/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-500 rounded-full text-sm font-semibold mb-4"><Crown className="w-4 h-4" /> PLANOS E PREÇOS</span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Escolha o plano ideal <span className="text-red-500">para você</span></h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Comece grátis e escale conforme seu negócio cresce.</p>
        </div>
        <div className="flex justify-center mb-10">
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-red-100">
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-red-500 text-white shadow" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-red-500 text-white shadow" : "text-gray-500"}`}>Anual <span className={`text-xs font-bold ${isAnnual ? "text-white/80" : "text-green-600"}`}>-17%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.highlighted ? "shadow-xl ring-2 ring-red-400" : "shadow-md border border-gray-100"}`}>
                {/* Ribbon */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-red-500 text-white text-xs font-bold px-6 py-1.5 transform rotate-0 rounded-bl-xl">{plan.badge}</div>
                  </div>
                )}
                {/* Red top bar for highlighted */}
                <div className={`h-1.5 ${plan.highlighted ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gray-100"}`} />
                <div className="p-7">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                    {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400">{isAnnual ? "/ano" : "/mês"}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlighted ? "bg-red-100" : "bg-gray-100"}`}>
                          <Check className={`w-3 h-3 ${plan.highlighted ? "text-red-500" : "text-gray-500"}`} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-400 mt-10">Todos os planos incluem suporte técnico. Cancele a qualquer momento.</p>
      </div>
    </section>
  );
}

// ====== PROPOSAL 12: Cards Flutuantes com Sombra Vermelha ======
function Proposal12() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Planos para cada <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">momento</span></h2>
          <p className="text-gray-500 text-lg">Sem fidelidade. Sem taxa de adesão. Cancele quando quiser.</p>
        </div>
        <div className="flex justify-center mb-12">
          <div className="relative bg-gray-100 rounded-full p-1 flex">
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${!isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold">-17%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-3xl p-8 transition-[colors,box-shadow] duration-300 ${plan.highlighted ? "bg-white shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] border-2 border-red-100 scale-[1.03]" : "bg-white shadow-lg hover:shadow-xl border border-gray-100"}`}>
                {plan.badge && <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-red-500 text-white mb-4">{plan.badge}</span>}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                </div>
                {price > 0 && !plan.priceLabel && <p className="text-sm text-gray-400 mb-6">{isAnnual ? "cobrado anualmente" : "cobrado mensalmente"}</p>}
                {price === 0 && <p className="text-sm text-gray-400 mb-6">para sempre</p>}
                {plan.priceLabel && <p className="text-sm text-gray-400 mb-6">em breve</p>}
                <button className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition mb-8 ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-500" : "text-gray-400"}`} />{f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 13: Destaque Lateral com Fundo Gradiente ======
function Proposal13() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left side - info */}
          <div className="lg:w-1/3 lg:sticky lg:top-20 lg:self-start">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-500 rounded-full text-sm font-semibold mb-6"><Sparkles className="w-4 h-4" /> PLANOS</span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">O plano certo para o <span className="text-red-500">seu negócio</span></h2>
            <p className="text-gray-500 mb-8">Comece grátis e escale conforme seu restaurante cresce. Sem surpresas.</p>
            <div className="flex bg-white rounded-xl p-1 border border-gray-200 w-fit">
              <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${!isAnnual ? "bg-red-500 text-white" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${isAnnual ? "bg-red-500 text-white" : "text-gray-500"}`}>Anual <span className={`text-xs font-bold ${isAnnual ? "text-white/80" : "text-green-600"}`}>-17%</span></button>
            </div>
          </div>
          {/* Right side - cards */}
          <div className="lg:w-2/3 space-y-5">
            {PLANS.map((plan) => {
              const price = isAnnual ? plan.price.annual : plan.price.monthly;
              return (
                <div key={plan.id} className={`bg-white rounded-2xl p-7 transition-[colors,box-shadow] ${plan.highlighted ? "shadow-xl border-2 border-red-300" : "shadow-md border border-gray-100 hover:shadow-lg"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        {plan.badge && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-500">{plan.badge}</span>}
                      </div>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-3xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                      {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400 ml-1">{isAnnual ? "/ano" : "/mês"}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {plan.features.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-full">
                        <Check className="w-3 h-3" />{f}
                      </span>
                    ))}
                  </div>
                  <button className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 14: Cards com Preço em Destaque Circular ======
function Proposal14() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-red-500 font-semibold text-sm tracking-wider uppercase">Planos e Preços</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">Simples, transparente, <span className="text-red-500">justo</span></h2>
          <div className="flex justify-center mt-6">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold">-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`text-center rounded-3xl p-8 transition-colors ${plan.highlighted ? "bg-red-500 text-white" : "bg-gray-50 border border-gray-200"}`}>
                {plan.badge && <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-6 ${plan.highlighted ? "bg-white/20 text-white" : "bg-red-100 text-red-500"}`}>{plan.badge}</span>}
                <h3 className={`text-xl font-bold mb-4 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                {/* Price circle */}
                <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center mx-auto mb-6 ${plan.highlighted ? "bg-white/15 border-2 border-white/30" : "bg-white border-2 border-red-100 shadow-sm"}`}>
                  <span className={`text-3xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price === 0 ? "R$ 0" : plan.priceLabel || fmt(price)}</span>
                  {!plan.priceLabel && <span className={`text-xs ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>{price === 0 ? "/sempre" : isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-white" : "text-red-500"}`} />{f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-white text-red-500 hover:bg-gray-100" : plan.id === "pro" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 15: Cards com Fundo Vermelho Suave e Ícones ======
function Proposal15() {
  const [isAnnual, setIsAnnual] = useState(false);
  const icons = [Shield, Crown, Rocket];
  return (
    <section className="py-20 bg-red-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Encontre o plano <span className="text-red-500">perfeito</span></h2>
          <p className="text-gray-500 text-lg">Todos os planos incluem suporte e atualizações gratuitas.</p>
          <div className="flex justify-center mt-8">
            <div className="bg-white rounded-full p-1 shadow-sm border border-red-100 flex">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-red-500 text-white" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-red-500 text-white" : "text-gray-500"}`}>Anual <span className={`text-xs font-bold ${isAnnual ? "text-white/80" : "text-green-600"}`}>-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, idx) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const Icon = icons[idx];
            return (
              <div key={plan.id} className={`bg-white rounded-2xl p-8 transition-[colors,box-shadow] duration-300 ${plan.highlighted ? "shadow-xl border-2 border-red-300 relative" : "shadow-md border border-red-100/50 hover:shadow-lg hover:border-red-200"}`}>
                {plan.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full">{plan.badge}</div>}
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                <div className="bg-red-50/50 rounded-xl p-4 mb-6">
                  <span className="text-3xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400 ml-1">{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-red-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 16: Estilo App Store / Rounded ======
function Proposal16() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gradient-to-b from-white to-red-50/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Escolha seu plano</h2>
          <p className="text-gray-500">Comece grátis, faça upgrade quando quiser.</p>
          <div className="flex justify-center mt-8">
            <div className="bg-gray-100 rounded-2xl p-1.5 flex">
              <button onClick={() => setIsAnnual(false)} className={`px-8 py-3 rounded-xl text-sm font-semibold transition ${!isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-8 py-3 rounded-xl text-sm font-semibold transition ${isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs">-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-[2rem] p-1 transition-colors ${plan.highlighted ? "bg-gradient-to-b from-red-400 to-red-500" : "bg-gray-200"}`}>
                <div className="bg-white rounded-[1.75rem] p-7 h-full flex flex-col">
                  {plan.badge && <span className="self-start text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-500 mb-4">{plan.badge}</span>}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                    {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400 ml-1">{isAnnual ? "/ano" : "/mês"}</span>}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-500" : "text-gray-400"}`} />{f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 17: Cards com Faixa de Preço Vermelha ======
function Proposal17() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Preços que fazem <span className="text-red-500">sentido</span></h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Comece grátis e pague apenas quando precisar de mais.</p>
          <div className="flex justify-center mt-8">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-lg text-sm font-medium transition ${!isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-lg text-sm font-medium transition ${isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold">-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-2xl overflow-hidden transition-all duration-300 ${plan.highlighted ? "shadow-xl scale-[1.02]" : "shadow-md hover:shadow-lg"} border border-gray-100`}>
                {/* Price banner */}
                <div className={`py-6 px-7 ${plan.highlighted ? "bg-red-500" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                    {plan.badge && <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.highlighted ? "bg-white/20 text-white" : "bg-red-100 text-red-500"}`}>{plan.badge}</span>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                    {price > 0 && !plan.priceLabel && <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>{isAnnual ? "/ano" : "/mês"}</span>}
                  </div>
                </div>
                {/* Features */}
                <div className="bg-white p-7">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-500" : "text-gray-400"}`} />{f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 18: Glassmorphism Vermelho ======
function Proposal18() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gradient-to-br from-red-500 via-red-500 to-red-500 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/5 rounded-full blur-xl" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-4">Escolha o plano ideal <span className="text-red-200">para você</span></h2>
          <p className="text-white/70 text-lg">Comece grátis e escale conforme seu negócio cresce.</p>
          <div className="flex justify-center mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex border border-white/20">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-white text-red-500" : "text-white/70"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${isAnnual ? "bg-white text-red-500" : "text-white/70"}`}>Anual <span className="text-xs font-bold">-17%</span></button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`rounded-2xl p-7 transition-colors duration-300 backdrop-blur-md ${plan.highlighted ? "bg-white text-gray-900 shadow-2xl scale-[1.03]" : "bg-white/10 border border-white/20 hover:bg-white/15"}`}>
                {plan.badge && <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${plan.highlighted ? "bg-red-100 text-red-500" : "bg-white/20 text-white"}`}>{plan.badge}</span>}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-gray-900" : "text-white"}`}>{plan.name}</h3>
                <p className={`text-sm mb-5 ${plan.highlighted ? "text-gray-500" : "text-white/60"}`}>{plan.description}</p>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-gray-900" : "text-white"}`}>{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className={`text-sm ml-1 ${plan.highlighted ? "text-gray-400" : "text-white/50"}`}>{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm ${plan.highlighted ? "text-gray-600" : "text-white/80"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-500" : "text-white/60"}`} />{f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-red-500"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 19: Cards Empilhados com Destaque Vermelho ======
function Proposal19() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-500 rounded-full text-sm font-semibold mb-4"><Zap className="w-4 h-4" /> INVESTIMENTO</span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Quanto custa usar <span className="text-red-500">o Mindi?</span></h2>
          <p className="text-gray-500">Menos do que você imagina. Mais do que você espera.</p>
          <div className="flex justify-center mt-8">
            <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200 flex">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${!isAnnual ? "bg-red-500 text-white shadow" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${isAnnual ? "bg-red-500 text-white shadow" : "text-gray-500"}`}>Anual <span className={`text-xs font-bold ${isAnnual ? "text-white/80" : "text-green-600"}`}>-17%</span></button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`bg-white rounded-2xl overflow-hidden transition-all ${plan.highlighted ? "shadow-xl ring-2 ring-red-400" : "shadow-sm border border-gray-200 hover:shadow-md"}`}>
                <div className="flex flex-col md:flex-row">
                  {/* Left: Plan info */}
                  <div className={`p-7 md:w-1/3 flex flex-col justify-center ${plan.highlighted ? "bg-red-500 text-white" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-2xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                      {plan.badge && !plan.highlighted && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-500">{plan.badge}</span>}
                    </div>
                    <p className={`text-sm mb-4 ${plan.highlighted ? "text-white/70" : "text-gray-500"}`}>{plan.description}</p>
                    <div>
                      <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                      {price > 0 && !plan.priceLabel && <span className={`text-sm ml-1 ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>{isAnnual ? "/ano" : "/mês"}</span>}
                    </div>
                  </div>
                  {/* Right: Features + CTA */}
                  <div className="p-7 md:w-2/3 flex flex-col sm:flex-row sm:items-center gap-6">
                    <ul className="flex-1 grid grid-cols-2 gap-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-red-500" : "text-gray-400"}`} />{f}
                        </li>
                      ))}
                    </ul>
                    <button className={`shrink-0 px-8 py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>{plan.buttonText}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== PROPOSAL 20: Cards Minimalistas com Linha Vermelha ======
function Proposal20() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-14 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Nossos <span className="text-red-500">planos</span></h2>
            <p className="text-gray-500 mt-2">Transparência total. Sem letras miúdas.</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-md text-sm font-medium transition ${!isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Mensal</button>
            <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-md text-sm font-medium transition ${isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Anual <span className="text-green-600 text-xs font-bold">-17%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-0 divide-x divide-gray-100">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            return (
              <div key={plan.id} className={`p-8 transition-colors ${plan.highlighted ? "bg-red-50/30" : "hover:bg-gray-50/50"}`}>
                {/* Red line accent */}
                <div className={`w-12 h-1 rounded-full mb-6 ${plan.highlighted ? "bg-red-500" : "bg-gray-200"}`} />
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.badge && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500 text-white">{plan.badge}</span>}
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-gray-900">{price === 0 ? "Grátis" : plan.priceLabel || fmt(price)}</span>
                  {price > 0 && !plan.priceLabel && <span className="text-sm text-gray-400 ml-1">{isAnnual ? "/ano" : "/mês"}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full ${plan.highlighted ? "bg-red-500" : "bg-gray-300"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlighted ? "bg-red-500 hover:bg-red-500 text-white" : plan.id === "pro" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"}`}>{plan.buttonText}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ====== MAIN PAGE ======
const proposals = [
  { id: 1, name: "Cards Clássicos com Destaque Central", desc: "Plano destacado em vermelho com escala maior, fundo branco", component: Proposal1 },
  { id: 2, name: "Cards Escuros Premium", desc: "Fundo escuro, cards com borda, linha gradiente no destaque", component: Proposal2 },
  { id: 3, name: "Layout Horizontal", desc: "Cards horizontais empilhados, fundo gradiente rosa, features em pills", component: Proposal3 },
  { id: 4, name: "Cards com Ícones e Gradiente", desc: "Título à esquerda, ícones por plano, card destaque vermelho com esferas", component: Proposal4 },
  { id: 5, name: "Minimalista com Bordas", desc: "Cards unidos numa tabela, fundo cinza, toggle underline", component: Proposal5 },
  { id: 6, name: "Cards com Gradiente por Plano", desc: "Cada card com cor diferente (cinza, vermelho, escuro), preço grande", component: Proposal6 },
  { id: 7, name: "Tabela Comparativa", desc: "Tabela com funcionalidades vs planos, checks e X, fundo cinza", component: Proposal7 },
  { id: 8, name: "Cards Horizontais com Borda Lateral", desc: "Layout horizontal, borda lateral colorida, features em tags", component: Proposal8 },
  { id: 9, name: "Cards com Número Grande e Fundo Bege", desc: "Fundo bege editorial, número gigante decorativo, tipografia serifada", component: Proposal9 },
  { id: 10, name: "Split Hero + Cards", desc: "Banner vermelho no topo com toggle, cards abaixo, CTA antes das features", component: Proposal10 },
  { id: 11, name: "Cards com Ribbon Vermelho", desc: "Ribbon no canto, barra vermelha no topo, checks em círculos, fundo gradiente rosa", component: Proposal11 },
  { id: 12, name: "Cards Flutuantes com Sombra Vermelha", desc: "Sombra vermelha no destaque, preço grande, CTA antes das features", component: Proposal12 },
  { id: 13, name: "Destaque Lateral com Fundo Gradiente", desc: "Título fixo à esquerda, cards empilhados à direita, features em pills vermelhas", component: Proposal13 },
  { id: 14, name: "Cards com Preço em Círculo", desc: "Preço dentro de círculo central, fundo branco, card destaque vermelho", component: Proposal14 },
  { id: 15, name: "Cards com Fundo Vermelho Suave", desc: "Fundo rosa claro, ícones por plano, preço em caixa destacada", component: Proposal15 },
  { id: 16, name: "Estilo App Store / Rounded", desc: "Borda gradiente vermelha, cantos super arredondados, ícone central", component: Proposal16 },
  { id: 17, name: "Cards com Faixa de Preço", desc: "Preço em faixa colorida no topo do card, features abaixo", component: Proposal17 },
  { id: 18, name: "Glassmorphism Vermelho", desc: "Fundo vermelho vibrante, cards glassmorphism, destaque branco sólido", component: Proposal18 },
  { id: 19, name: "Cards Empilhados Split", desc: "Layout horizontal split: info à esquerda, features em grid à direita", component: Proposal19 },
  { id: 20, name: "Minimalista com Linha Vermelha", desc: "Linha vermelha accent, divisão por colunas, bullets em pontos, botão outline", component: Proposal20 },
];

export default function PricingTest() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">Propostas de Seção de Planos/Preços</h1>
          <p className="text-gray-400">20 modelos visuais diferentes para a seção "Escolha o plano ideal para você"</p>
        </div>
      </div>

      {/* Proposals */}
      {proposals.map((p) => {
        const Component = p.component;
        return (
          <div key={p.id}>
            <div className="bg-gray-100 border-y border-gray-200 py-6 px-4">
              <div className="max-w-6xl mx-auto flex items-center gap-4">
                <span className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">{p.id}</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Proposta {p.id}: {p.name}</h2>
                  <p className="text-sm text-gray-500">{p.desc}</p>
                </div>
              </div>
            </div>
            <Component />
          </div>
        );
      })}
    </div>
  );
}
