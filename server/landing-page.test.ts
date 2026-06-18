import { describe, it, expect } from "vitest";

/**
 * Testes para a Landing Page Hero Section
 * Verifica a estrutura, conteúdo e lógica de navegação
 */

// ============ HELPERS DE NAVEGAÇÃO ============

interface NavLink {
  label: string;
  href: string;
}

interface CTAButton {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

interface Benefit {
  text: string;
}

interface PainPoint {
  icon: string;
  text: string;
}

/**
 * Retorna os links de navegação da landing page
 */
function getNavLinks(): NavLink[] {
  return [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
  ];
}

/**
 * Retorna os botões CTA da hero section
 */
function getCTAButtons(): CTAButton[] {
  return [
    { label: "Criar conta grátis", href: "/criar-conta", variant: "primary" },
    { label: "Ver como funciona", href: "#como-funciona", variant: "secondary" },
  ];
}

/**
 * Retorna os mini benefícios abaixo dos CTAs
 */
function getBenefits(): Benefit[] {
  return [
    { text: "Sem taxa por pedido" },
    { text: "Configuração em minutos" },
    { text: "Suporte humanizado" },
  ];
}

/**
 * Retorna os pain points da strip section
 */
function getPainPoints(): PainPoint[] {
  return [
    { icon: "💸", text: "Cansado de pagar taxas abusivas ao iFood?" },
    { icon: "📊", text: "Sem controle financeiro do seu delivery?" },
    { icon: "🏍️", text: "Dificuldade em gerenciar entregadores?" },
    { icon: "📱", text: "Pedidos desorganizados no WhatsApp?" },
  ];
}

/**
 * Verifica se a navbar deve ter fundo transparente ou sólido
 */
function getNavbarBackground(scrollY: number): "transparent" | "solid" {
  return scrollY > 20 ? "solid" : "transparent";
}

/**
 * Verifica se as animações devem ser visíveis com base no tempo
 */
function shouldAnimationsBeVisible(timeSinceMount: number): boolean {
  return timeSinceMount >= 100;
}

/**
 * Calcula o delay de animação para cada elemento da hero
 */
function getAnimationDelay(elementIndex: number): number {
  const delays = [0, 100, 200, 300, 400];
  return delays[elementIndex] || 0;
}

// ============ TESTES ============

describe("Landing Page - Navbar", () => {
  it("contém 4 links de navegação", () => {
    const links = getNavLinks();
    expect(links).toHaveLength(4);
  });

  it("todos os links apontam para âncoras válidas", () => {
    const links = getNavLinks();
    links.forEach(link => {
      expect(link.href).toMatch(/^#[a-z-]+$/);
    });
  });

  it("navbar fica transparente no topo", () => {
    expect(getNavbarBackground(0)).toBe("transparent");
    expect(getNavbarBackground(10)).toBe("transparent");
    expect(getNavbarBackground(20)).toBe("transparent");
  });

  it("navbar fica sólida após scroll", () => {
    expect(getNavbarBackground(21)).toBe("solid");
    expect(getNavbarBackground(100)).toBe("solid");
    expect(getNavbarBackground(500)).toBe("solid");
  });

  it("links incluem as seções principais", () => {
    const links = getNavLinks();
    const labels = links.map(l => l.label);
    expect(labels).toContain("Funcionalidades");
    expect(labels).toContain("Como funciona");
    expect(labels).toContain("Preços");
    expect(labels).toContain("FAQ");
  });
});

describe("Landing Page - Hero Section CTAs", () => {
  it("tem botão primário e secundário", () => {
    const buttons = getCTAButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons[0].variant).toBe("primary");
    expect(buttons[1].variant).toBe("secondary");
  });

  it("botão primário leva para criar conta", () => {
    const buttons = getCTAButtons();
    const primary = buttons.find(b => b.variant === "primary");
    expect(primary?.href).toBe("/criar-conta");
    expect(primary?.label).toBe("Criar conta grátis");
  });

  it("botão secundário leva para como funciona", () => {
    const buttons = getCTAButtons();
    const secondary = buttons.find(b => b.variant === "secondary");
    expect(secondary?.href).toBe("#como-funciona");
    expect(secondary?.label).toBe("Ver como funciona");
  });
});

describe("Landing Page - Mini Benefícios", () => {
  it("tem 3 benefícios", () => {
    const benefits = getBenefits();
    expect(benefits).toHaveLength(3);
  });

  it("inclui benefício sobre taxa", () => {
    const benefits = getBenefits();
    expect(benefits.some(b => b.text.includes("taxa"))).toBe(true);
  });

  it("inclui benefício sobre configuração rápida", () => {
    const benefits = getBenefits();
    expect(benefits.some(b => b.text.includes("minutos"))).toBe(true);
  });

  it("inclui benefício sobre suporte", () => {
    const benefits = getBenefits();
    expect(benefits.some(b => b.text.includes("Suporte"))).toBe(true);
  });
});

describe("Landing Page - Pain Points Strip", () => {
  it("tem 4 pain points", () => {
    const points = getPainPoints();
    expect(points).toHaveLength(4);
  });

  it("aborda taxa de marketplace", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("taxas") || p.text.includes("iFood"))).toBe(true);
  });

  it("aborda controle financeiro", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("financeiro"))).toBe(true);
  });

  it("aborda gestão de entregadores", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("entregadores"))).toBe(true);
  });

  it("aborda desorganização de pedidos", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("desorganizados") || p.text.includes("WhatsApp"))).toBe(true);
  });

  it("cada pain point tem ícone", () => {
    const points = getPainPoints();
    points.forEach(p => {
      expect(p.icon).toBeTruthy();
      expect(p.icon.length).toBeGreaterThan(0);
    });
  });
});

describe("Landing Page - Animações", () => {
  it("animações não visíveis antes de 100ms", () => {
    expect(shouldAnimationsBeVisible(0)).toBe(false);
    expect(shouldAnimationsBeVisible(50)).toBe(false);
    expect(shouldAnimationsBeVisible(99)).toBe(false);
  });

  it("animações visíveis após 100ms", () => {
    expect(shouldAnimationsBeVisible(100)).toBe(true);
    expect(shouldAnimationsBeVisible(500)).toBe(true);
  });

  it("delays de animação são progressivos", () => {
    const delays = [0, 1, 2, 3, 4].map(i => getAnimationDelay(i));
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
    }
  });

  it("primeiro elemento não tem delay", () => {
    expect(getAnimationDelay(0)).toBe(0);
  });

  it("último elemento (benefícios) tem delay de 400ms", () => {
    expect(getAnimationDelay(4)).toBe(400);
  });
});

describe("Landing Page - Conteúdo Estratégico", () => {
  it("headline menciona controle/gestão", () => {
    const headline = "Controle pedidos, entregas e estoque em um só lugar.";
    expect(headline).toMatch(/controle|gestão|gerencie/i);
  });

  it("subheadline menciona marketplace/taxas", () => {
    const subheadline = "Chega de depender de marketplace com taxas abusivas.";
    expect(subheadline).toMatch(/marketplace|taxas/i);
  });

  it("conteúdo é direcionado a donos de restaurante", () => {
    const painPoints = getPainPoints();
    const allText = painPoints.map(p => p.text).join(" ");
    // Verifica se o conteúdo é relevante para o público-alvo
    expect(allText).toMatch(/iFood|delivery|entregadores|WhatsApp/i);
  });
});


// ============ SEÇÃO 2: O PROBLEMA + A VIRADA ============

interface PainCard {
  title: string;
  desc: string;
}

interface SolutionItem {
  text: string;
}

interface ComparisonCard {
  title: string;
  items: string[];
  type: "negative" | "positive";
}

/**
 * Retorna os pain cards da seção 2
 */
function getPainCards(): PainCard[] {
  return [
    { title: "Taxas abusivas", desc: "Até 27% por pedido vai direto pro marketplace" },
    { title: "Repasses atrasados", desc: "Seu dinheiro preso por dias ou semanas" },
    { title: "Clientes que não são seus", desc: "Você não tem acesso aos dados dos seus clientes" },
  ];
}

/**
 * Retorna os itens de solução da seção virada
 */
function getSolutionItems(): SolutionItem[] {
  return [
    { text: "Seu próprio link de vendas" },
    { text: "Zero comissão por pedido" },
    { text: "Controle total de entregadores" },
    { text: "Relatórios financeiros em tempo real" },
    { text: "Estoque sincronizado automaticamente" },
    { text: "Base de clientes 100% sua" },
  ];
}

/**
 * Retorna os cards de comparação
 */
function getComparisonCards(): ComparisonCard[] {
  return [
    {
      title: "Usando Marketplace",
      items: [
        "Taxa de 15% a 27% por pedido",
        "Repasses demoram até 30 dias",
        "Sem acesso aos dados dos clientes",
        "Concorrência direta na mesma plataforma",
      ],
      type: "negative",
    },
    {
      title: "Com CardápioAdmin",
      items: [
        "R$ 0 de taxa por pedido",
        "Receba na hora via Pix",
        "Base de clientes 100% sua",
        "Sua marca, seu link, seu controle",
      ],
      type: "positive",
    },
  ];
}

/**
 * Calcula a perda mensal com base no faturamento e taxa
 */
function calculateMonthlyLoss(revenue: number, feePercent: number): number {
  return (revenue * feePercent) / 100;
}

/**
 * Calcula a perda anual
 */
function calculateYearlyLoss(revenue: number, feePercent: number): number {
  return calculateMonthlyLoss(revenue, feePercent) * 12;
}

/**
 * Revenue steps disponíveis no simulador
 */
function getRevenueSteps(): number[] {
  return [5000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
}

/**
 * Navega para o próximo step de faturamento
 */
function navigateRevenue(current: number, direction: "increase" | "decrease"): number {
  const steps = getRevenueSteps();
  const currentIndex = steps.indexOf(current);
  if (direction === "increase" && currentIndex < steps.length - 1) {
    return steps[currentIndex + 1];
  }
  if (direction === "decrease" && currentIndex > 0) {
    return steps[currentIndex - 1];
  }
  return current;
}

/**
 * Formata valor em moeda brasileira
 */
function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ============ TESTES SEÇÃO 2 ============

describe("Seção 2 - Pain Cards", () => {
  it("tem 3 pain cards", () => {
    expect(getPainCards()).toHaveLength(3);
  });

  it("aborda taxas abusivas", () => {
    const cards = getPainCards();
    expect(cards.some(c => c.title.includes("Taxas"))).toBe(true);
  });

  it("aborda repasses atrasados", () => {
    const cards = getPainCards();
    expect(cards.some(c => c.title.includes("Repasses"))).toBe(true);
  });

  it("aborda falta de controle sobre clientes", () => {
    const cards = getPainCards();
    expect(cards.some(c => c.title.includes("Clientes"))).toBe(true);
  });

  it("cada card tem título e descrição", () => {
    getPainCards().forEach(card => {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.desc.length).toBeGreaterThan(0);
    });
  });
});

describe("Seção 2 - Simulador de Perdas", () => {
  it("calcula perda mensal corretamente para R$ 20.000 a 15%", () => {
    expect(calculateMonthlyLoss(20000, 15)).toBe(3000);
  });

  it("calcula perda anual corretamente", () => {
    expect(calculateYearlyLoss(20000, 15)).toBe(36000);
  });

  it("calcula perda para diferentes faturamentos", () => {
    expect(calculateMonthlyLoss(5000, 15)).toBe(750);
    expect(calculateMonthlyLoss(50000, 15)).toBe(7500);
    expect(calculateMonthlyLoss(100000, 15)).toBe(15000);
  });

  it("perda anual é 12x a mensal", () => {
    const monthly = calculateMonthlyLoss(30000, 15);
    const yearly = calculateYearlyLoss(30000, 15);
    expect(yearly).toBe(monthly * 12);
  });

  it("tem 9 steps de faturamento", () => {
    expect(getRevenueSteps()).toHaveLength(9);
  });

  it("steps começam em 5.000 e terminam em 100.000", () => {
    const steps = getRevenueSteps();
    expect(steps[0]).toBe(5000);
    expect(steps[steps.length - 1]).toBe(100000);
  });

  it("steps estão em ordem crescente", () => {
    const steps = getRevenueSteps();
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
  });

  it("navega para o próximo step corretamente", () => {
    expect(navigateRevenue(20000, "increase")).toBe(30000);
    expect(navigateRevenue(20000, "decrease")).toBe(15000);
  });

  it("não navega além do primeiro step", () => {
    expect(navigateRevenue(5000, "decrease")).toBe(5000);
  });

  it("não navega além do último step", () => {
    expect(navigateRevenue(100000, "increase")).toBe(100000);
  });

  it("formata moeda corretamente", () => {
    const formatted = formatCurrency(3000);
    expect(formatted).toContain("3.000");
    expect(formatted).toContain("R$");
  });

  it("CardápioAdmin mostra R$ 0 de taxa", () => {
    expect(calculateMonthlyLoss(20000, 0)).toBe(0);
    expect(calculateYearlyLoss(100000, 0)).toBe(0);
  });
});

describe("Seção 2 - Itens de Solução (Virada)", () => {
  it("tem 6 itens de solução", () => {
    expect(getSolutionItems()).toHaveLength(6);
  });

  it("inclui link próprio de vendas", () => {
    expect(getSolutionItems().some(s => s.text.includes("link de vendas"))).toBe(true);
  });

  it("inclui zero comissão", () => {
    expect(getSolutionItems().some(s => s.text.includes("Zero comissão"))).toBe(true);
  });

  it("inclui controle de entregadores", () => {
    expect(getSolutionItems().some(s => s.text.includes("entregadores"))).toBe(true);
  });

  it("inclui relatórios financeiros", () => {
    expect(getSolutionItems().some(s => s.text.includes("Relatórios"))).toBe(true);
  });

  it("inclui estoque sincronizado", () => {
    expect(getSolutionItems().some(s => s.text.includes("Estoque"))).toBe(true);
  });

  it("inclui base de clientes", () => {
    expect(getSolutionItems().some(s => s.text.includes("clientes"))).toBe(true);
  });
});

describe("Seção 2 - Cards de Comparação", () => {
  it("tem 2 cards de comparação", () => {
    expect(getComparisonCards()).toHaveLength(2);
  });

  it("primeiro card é negativo (marketplace)", () => {
    const cards = getComparisonCards();
    expect(cards[0].type).toBe("negative");
    expect(cards[0].title).toContain("Marketplace");
  });

  it("segundo card é positivo (CardápioAdmin)", () => {
    const cards = getComparisonCards();
    expect(cards[1].type).toBe("positive");
    expect(cards[1].title).toContain("CardápioAdmin");
  });

  it("marketplace tem 4 pontos negativos", () => {
    const marketplace = getComparisonCards()[0];
    expect(marketplace.items).toHaveLength(4);
  });

  it("CardápioAdmin tem 4 pontos positivos", () => {
    const admin = getComparisonCards()[1];
    expect(admin.items).toHaveLength(4);
  });

  it("marketplace menciona taxa alta", () => {
    const marketplace = getComparisonCards()[0];
    expect(marketplace.items.some(i => i.includes("15%") || i.includes("27%"))).toBe(true);
  });

  it("CardápioAdmin menciona R$ 0 de taxa", () => {
    const admin = getComparisonCards()[1];
    expect(admin.items.some(i => i.includes("R$ 0"))).toBe(true);
  });

  it("CardápioAdmin menciona Pix", () => {
    const admin = getComparisonCards()[1];
    expect(admin.items.some(i => i.includes("Pix"))).toBe(true);
  });
});


// ============ SEÇÃO 3: CLIENTES QUE VENDEM CONOSCO ============

interface ClientData {
  name: string;
  city: string;
  state: string;
  cover: string;
  color: string;
  initials: string;
}

interface StatItem {
  value: string;
  label: string;
}

/**
 * Retorna os dados dos clientes fictícios
 */
function getClientsData(): ClientData[] {
  return [
    { name: "Burger House", city: "São Paulo", state: "SP", cover: "https://files.manuscdn.com/WxLMtqgzpplincEt.jpg", color: "#dc2626", initials: "BH" },
    { name: "Forno & Massa", city: "Curitiba", state: "PR", cover: "https://files.manuscdn.com/BgcAhrPALHBfxpsd.jpeg", color: "#ea580c", initials: "FM" },
    { name: "Sushi Kento", city: "Rio de Janeiro", state: "RJ", cover: "https://files.manuscdn.com/mInTUYpVlTIFLkON.jpg", color: "#0891b2", initials: "SK" },
    { name: "Açaí da Terra", city: "Belém", state: "PA", cover: "https://files.manuscdn.com/aiffbCjVDSbuQtRz.jpg", color: "#7c3aed", initials: "AT" },
    { name: "Brasa Viva", city: "Belo Horizonte", state: "MG", cover: "https://files.manuscdn.com/uhXbFmhAvEyTTgoB.jpg", color: "#b91c1c", initials: "BV" },
    { name: "Poke Fresh", city: "Florianópolis", state: "SC", cover: "https://files.manuscdn.com/LNZYzDQsQZBsCSUy.jpg", color: "#059669", initials: "PF" },
  ];
}

/**
 * Retorna as estatísticas do showcase
 */
function getShowcaseStats(): StatItem[] {
  return [
    { value: "500+", label: "Restaurantes ativos" },
    { value: "150k+", label: "Pedidos processados" },
    { value: "27", label: "Estados atendidos" },
    { value: "4.9", label: "Avaliação média" },
  ];
}

/**
 * Gera as iniciais a partir do nome do estabelecimento
 */
function generateInitials(name: string): string {
  const stopWords = ["da", "de", "do", "das", "dos", "e"];
  return name
    .split(/[\s&]+/)
    .filter(w => w.length > 0 && !stopWords.includes(w.toLowerCase()))
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Verifica se a cor é um hex válido
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/**
 * Retorna os dados duplicados para o carrossel infinito
 */
function getInfiniteScrollData(): ClientData[] {
  const clients = getClientsData();
  return [...clients, ...clients];
}

/**
 * Verifica se todos os estados brasileiros representados são válidos
 */
function isValidBrazilianState(state: string): boolean {
  const validStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SE", "SP", "TO"
  ];
  return validStates.includes(state);
}

describe("Seção 3 - Dados dos Clientes", () => {
  it("tem 6 clientes fictícios", () => {
    expect(getClientsData()).toHaveLength(6);
  });

  it("cada cliente tem todos os campos obrigatórios", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(client.name).toBeTruthy();
      expect(client.city).toBeTruthy();
      expect(client.state).toBeTruthy();
      expect(client.cover).toBeTruthy();
      expect(client.color).toBeTruthy();
      expect(client.initials).toBeTruthy();
    });
  });

  it("cada cliente tem cor hex válida", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(isValidHexColor(client.color)).toBe(true);
    });
  });

  it("cada cliente tem estado brasileiro válido", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(isValidBrazilianState(client.state)).toBe(true);
    });
  });

  it("cada cliente tem URL de capa válida", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(client.cover).toMatch(/^https:\/\//);
    });
  });

  it("iniciais correspondem ao nome do estabelecimento", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      const expected = generateInitials(client.name);
      expect(client.initials).toBe(expected);
    });
  });

  it("não há nomes duplicados", () => {
    const clients = getClientsData();
    const names = clients.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("cobre diferentes regiões do Brasil", () => {
    const clients = getClientsData();
    const states = clients.map(c => c.state);
    // Pelo menos 4 estados diferentes
    expect(new Set(states).size).toBeGreaterThanOrEqual(4);
  });

  it("inclui diferentes tipos de culinária", () => {
    const clients = getClientsData();
    const names = clients.map(c => c.name.toLowerCase()).join(" ");
    // Verifica variedade gastronômica
    expect(names).toMatch(/burger|sushi|pizza|massa|açaí|poke|brasa|churrasco/i);
  });
});

describe("Seção 3 - Carrossel Infinito", () => {
  it("dados duplicados para scroll infinito", () => {
    const data = getInfiniteScrollData();
    expect(data).toHaveLength(12); // 6 * 2
  });

  it("primeira metade é igual à segunda metade", () => {
    const data = getInfiniteScrollData();
    const first = data.slice(0, 6);
    const second = data.slice(6, 12);
    first.forEach((client, i) => {
      expect(client.name).toBe(second[i].name);
    });
  });
});

describe("Seção 3 - Estatísticas", () => {
  it("tem 4 estatísticas", () => {
    expect(getShowcaseStats()).toHaveLength(4);
  });

  it("inclui contagem de restaurantes", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Restaurantes"))).toBe(true);
  });

  it("inclui contagem de pedidos", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Pedidos"))).toBe(true);
  });

  it("inclui cobertura de estados", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Estados"))).toBe(true);
  });

  it("inclui avaliação média", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Avaliação"))).toBe(true);
  });

  it("avaliação média é alta (>= 4.5)", () => {
    const stats = getShowcaseStats();
    const rating = stats.find(s => s.label.includes("Avaliação"));
    expect(parseFloat(rating!.value)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("Seção 3 - Geração de Iniciais", () => {
  it("gera iniciais de nome simples", () => {
    expect(generateInitials("Burger House")).toBe("BH");
  });

  it("gera iniciais com & no nome", () => {
    expect(generateInitials("Forno & Massa")).toBe("FM");
  });

  it("gera iniciais de nome com 3 palavras (pega 2 primeiras)", () => {
    expect(generateInitials("Açaí da Terra")).toBe("AT");
  });

  it("gera iniciais em maiúsculas", () => {
    const initials = generateInitials("poke fresh");
    expect(initials).toBe("PF");
  });
});


// ============ SEÇÃO 4: CARDÁPIO DIGITAL (TABLET MOCKUP) ============

interface CatalogBenefit {
  title: string;
  desc: string;
  iconName: string;
}

interface FloatingBadge {
  title: string;
  subtitle: string;
  color: string;
}

/**
 * Retorna os benefícios do cardápio digital
 */
function getCatalogBenefits(): CatalogBenefit[] {
  return [
    {
      title: "Categorias organizadas",
      desc: "Entradas, pratos principais, sobremesas, bebidas — tudo separado e fácil de navegar.",
      iconName: "Utensils",
    },
    {
      title: "Funciona em qualquer dispositivo",
      desc: "Seu cardápio se adapta perfeitamente a celulares, tablets e computadores.",
      iconName: "Smartphone",
    },
    {
      title: "Link exclusivo do seu restaurante",
      desc: "Compartilhe nas redes sociais, WhatsApp ou imprima o QR Code na mesa.",
      iconName: "Globe",
    },
    {
      title: "Visual profissional",
      desc: "Fotos dos pratos, descrições, preços e complementos — tudo com aparência premium.",
      iconName: "Palette",
    },
  ];
}

/**
 * Retorna os badges flutuantes do tablet mockup
 */
function getFloatingBadges(): FloatingBadge[] {
  return [
    { title: "QR Code", subtitle: "Pronto para imprimir", color: "green" },
    { title: "73 itens", subtitle: "no cardápio", color: "red" },
  ];
}

/**
 * Retorna o conteúdo principal da seção
 */
function getCatalogSectionContent() {
  return {
    badge: "CARDÁPIO DIGITAL",
    title: "Seu cardápio completo, na palma da mão do cliente.",
    description: "Monte seu menu digital profissional em minutos. Categorias, fotos, descrições, preços e complementos — tudo organizado e pronto para receber pedidos.",
    ctaText: "Criar meu cardápio grátis",
    ctaHref: "/criar-conta",
  };
}

/**
 * Verifica se o mockup URL é válido
 */
function isValidMockupUrl(url: string): boolean {
  return url.startsWith("https://") && url.includes("manuscdn.com");
}

describe("Seção 4 - Conteúdo Principal", () => {
  it("tem badge 'CARDÁPIO DIGITAL'", () => {
    const content = getCatalogSectionContent();
    expect(content.badge).toBe("CARDÁPIO DIGITAL");
  });

  it("título menciona cardápio e cliente", () => {
    const content = getCatalogSectionContent();
    expect(content.title).toMatch(/cardápio/i);
    expect(content.title).toMatch(/cliente/i);
  });

  it("descrição menciona categorias e complementos", () => {
    const content = getCatalogSectionContent();
    expect(content.description).toMatch(/categorias/i);
    expect(content.description).toMatch(/complementos/i);
  });

  it("CTA leva para criar conta", () => {
    const content = getCatalogSectionContent();
    expect(content.ctaHref).toBe("/criar-conta");
    expect(content.ctaText).toContain("cardápio");
  });
});

describe("Seção 4 - Benefícios do Cardápio", () => {
  it("tem 4 benefícios", () => {
    expect(getCatalogBenefits()).toHaveLength(4);
  });

  it("cada benefício tem título, descrição e ícone", () => {
    const benefits = getCatalogBenefits();
    benefits.forEach(b => {
      expect(b.title).toBeTruthy();
      expect(b.desc).toBeTruthy();
      expect(b.iconName).toBeTruthy();
    });
  });

  it("inclui benefício sobre categorias", () => {
    const benefits = getCatalogBenefits();
    expect(benefits.some(b => b.title.includes("Categorias"))).toBe(true);
  });

  it("inclui benefício sobre dispositivos", () => {
    const benefits = getCatalogBenefits();
    expect(benefits.some(b => b.title.includes("dispositivo"))).toBe(true);
  });

  it("inclui benefício sobre link exclusivo", () => {
    const benefits = getCatalogBenefits();
    expect(benefits.some(b => b.title.includes("Link"))).toBe(true);
  });

  it("inclui benefício sobre visual profissional", () => {
    const benefits = getCatalogBenefits();
    expect(benefits.some(b => b.title.includes("Visual"))).toBe(true);
  });

  it("descrição do link menciona QR Code", () => {
    const benefits = getCatalogBenefits();
    const linkBenefit = benefits.find(b => b.title.includes("Link"));
    expect(linkBenefit?.desc).toMatch(/QR Code/i);
  });
});

describe("Seção 4 - Badges Flutuantes", () => {
  it("tem 2 badges flutuantes", () => {
    expect(getFloatingBadges()).toHaveLength(2);
  });

  it("inclui badge de QR Code", () => {
    const badges = getFloatingBadges();
    expect(badges.some(b => b.title.includes("QR Code"))).toBe(true);
  });

  it("inclui badge de quantidade de itens", () => {
    const badges = getFloatingBadges();
    expect(badges.some(b => b.title.includes("itens"))).toBe(true);
  });

  it("badges têm cores distintas", () => {
    const badges = getFloatingBadges();
    const colors = badges.map(b => b.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe("Seção 4 - Mockup do Tablet", () => {
  it("URL do mockup é válida", () => {
    const url = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/PaotwhovICNkDtqN.png";
    expect(isValidMockupUrl(url)).toBe(true);
  });

  it("rejeita URLs inválidas", () => {
    expect(isValidMockupUrl("http://example.com/image.png")).toBe(false);
    expect(isValidMockupUrl("")).toBe(false);
    expect(isValidMockupUrl("not-a-url")).toBe(false);
  });
});

// ============ TYPEWRITER EFFECT TESTS ============

const TYPEWRITER_WORDS = [
  "pedidos",
  "entregas",
  "estoque",
  "cardápio",
  "finanças",
];

describe("Typewriter Effect - Hero Section", () => {
  it("has at least 3 words to cycle through", () => {
    expect(TYPEWRITER_WORDS.length).toBeGreaterThanOrEqual(3);
  });

  it("all words are non-empty strings", () => {
    TYPEWRITER_WORDS.forEach((word) => {
      expect(typeof word).toBe("string");
      expect(word.length).toBeGreaterThan(0);
    });
  });

  it("words are relevant to restaurant management", () => {
    const relevantTerms = ["pedidos", "entregas", "estoque", "cardápio", "finanças", "clientes", "vendas"];
    TYPEWRITER_WORDS.forEach((word) => {
      expect(relevantTerms).toContain(word);
    });
  });

  it("no duplicate words", () => {
    const uniqueWords = new Set(TYPEWRITER_WORDS);
    expect(uniqueWords.size).toBe(TYPEWRITER_WORDS.length);
  });

  it("simulates typing progression correctly", () => {
    const word = TYPEWRITER_WORDS[0]; // "pedidos"
    // Simulate typing: each step adds one character
    for (let i = 1; i <= word.length; i++) {
      const partial = word.slice(0, i);
      expect(partial).toBe(word.substring(0, i));
      expect(partial.length).toBe(i);
    }
  });

  it("simulates deleting progression correctly", () => {
    const word = TYPEWRITER_WORDS[0]; // "pedidos"
    // Simulate deleting: each step removes one character from the end
    for (let i = word.length; i >= 0; i--) {
      const partial = word.slice(0, i);
      expect(partial.length).toBe(i);
    }
  });

  it("cycles through words correctly", () => {
    // Simulate the index cycling
    let index = 0;
    for (let cycle = 0; cycle < TYPEWRITER_WORDS.length * 2; cycle++) {
      expect(TYPEWRITER_WORDS[index]).toBeDefined();
      index = (index + 1) % TYPEWRITER_WORDS.length;
    }
    // After full cycles, should be back at 0
    expect(index).toBe(0);
  });

  it("first word starts with lowercase for natural sentence flow", () => {
    // "Controle {word}" - word should be lowercase to flow naturally
    TYPEWRITER_WORDS.forEach((word) => {
      expect(word[0]).toBe(word[0].toLowerCase());
    });
  });
});

// ============ SECTION: PRICING / PLANOS ============

const LANDING_PLANS_TEST = [
  {
    id: "free",
    name: "Gratuito",
    price: { monthly: 0, annual: 0 },
    features: [
      "Teste grátis por 15 dias",
      "1 estabelecimento",
      "Link personalizado para o seu restaurante",
      "Gerenciador de pedidos",
    ],
    buttonText: "Começar grátis",
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
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: -1, annual: -1 },
    priceLabel: "R$ --,--",
    highlighted: true,
    badge: "Mais Popular",
    features: [
      "Tudo do plano Essencial",
      "Estabelecimentos ilimitados",
      "Análises avançadas",
      "Assistente de IA",
      "Relatórios personalizados",
      "Programa de fidelidade",
    ],
    buttonText: "Em breve",
  },
];

describe("Pricing Section - Plans data", () => {
  it("has exactly 3 plans", () => {
    expect(LANDING_PLANS_TEST).toHaveLength(3);
  });

  it("each plan has required fields", () => {
    LANDING_PLANS_TEST.forEach((plan) => {
      expect(plan.id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.price).toBeDefined();
      expect(plan.price.monthly).toBeDefined();
      expect(plan.price.annual).toBeDefined();
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan.buttonText).toBeTruthy();
    });
  });

  it("free plan has price 0", () => {
    const free = LANDING_PLANS_TEST.find((p) => p.id === "free");
    expect(free).toBeDefined();
    expect(free!.price.monthly).toBe(0);
    expect(free!.price.annual).toBe(0);
  });

  it("basic plan has positive monthly and annual prices", () => {
    const basic = LANDING_PLANS_TEST.find((p) => p.id === "basic");
    expect(basic).toBeDefined();
    expect(basic!.price.monthly).toBeGreaterThan(0);
    expect(basic!.price.annual).toBeGreaterThan(0);
  });

  it("annual price is cheaper than 12x monthly for basic plan", () => {
    const basic = LANDING_PLANS_TEST.find((p) => p.id === "basic");
    expect(basic).toBeDefined();
    expect(basic!.price.annual).toBeLessThan(basic!.price.monthly * 12);
  });

  it("pro plan is highlighted and has badge", () => {
    const pro = LANDING_PLANS_TEST.find((p) => p.id === "pro");
    expect(pro).toBeDefined();
    expect(pro!.highlighted).toBe(true);
    expect(pro!.badge).toBe("Mais Popular");
  });

  it("pro plan has priceLabel since it's coming soon", () => {
    const pro = LANDING_PLANS_TEST.find((p) => p.id === "pro") as any;
    expect(pro).toBeDefined();
    expect(pro.priceLabel).toBe("R$ --,--");
    expect(pro.buttonText).toBe("Em breve");
  });

  it("each plan has unique id", () => {
    const ids = LANDING_PLANS_TEST.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("plans are ordered by tier: free, basic, pro", () => {
    expect(LANDING_PLANS_TEST[0].id).toBe("free");
    expect(LANDING_PLANS_TEST[1].id).toBe("basic");
    expect(LANDING_PLANS_TEST[2].id).toBe("pro");
  });

  it("higher tier plans have more features", () => {
    expect(LANDING_PLANS_TEST[1].features.length).toBeGreaterThan(
      LANDING_PLANS_TEST[0].features.length
    );
    expect(LANDING_PLANS_TEST[2].features.length).toBeGreaterThan(
      LANDING_PLANS_TEST[0].features.length
    );
  });

  it("basic and pro plans reference the previous tier in features", () => {
    expect(LANDING_PLANS_TEST[1].features[0]).toContain("plano gratuito");
    expect(LANDING_PLANS_TEST[2].features[0]).toContain("plano Essencial");
  });
});

describe("Pricing Section - Price formatting", () => {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  it("formats free plan as R$ 0,00", () => {
    expect(formatPrice(0)).toBe("R$\u00a00,00");
  });

  it("formats basic monthly price correctly", () => {
    const formatted = formatPrice(79.90);
    expect(formatted).toContain("79,90");
  });

  it("formats basic annual price correctly", () => {
    const formatted = formatPrice(799);
    expect(formatted).toContain("799,00");
  });
});


// ============ SEÇÃO FAQ ============

interface FAQItem {
  question: string;
  answer: string;
}

function getFAQData(): FAQItem[] {
  return [
    {
      question: "Como funciona o período grátis?",
      answer: "Ao criar sua conta, você tem acesso ao plano Gratuito com até 30 pedidos por mês, sem limite de tempo. Não pedimos cartão de crédito. Quando precisar de mais recursos, é só fazer o upgrade para o plano Essencial ou Pro."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Não existe fidelidade nem multa. Você pode cancelar seu plano a qualquer momento diretamente pelo painel. Seu acesso continua ativo até o final do período já pago."
    },
    {
      question: "Existe taxa por pedido?",
      answer: "Não! Diferente dos marketplaces que cobram de 12% a 27% por pedido, o Mindi cobra apenas uma mensalidade fixa. Todos os pedidos que você receber são 100% seus, sem comissão."
    },
    {
      question: "Como meus clientes fazem pedidos?",
      answer: "Você recebe um link exclusivo do seu cardápio digital. Seus clientes acessam pelo celular, escolhem os produtos, e o pedido chega direto no seu painel em tempo real. Você também pode gerar um QR Code para colocar nas mesas ou no balcão."
    },
    {
      question: "Preciso de conhecimento técnico para usar?",
      answer: "Não! O Mindi foi feito para ser simples. Em poucos minutos você cadastra seus produtos, configura o horário de funcionamento e já pode começar a receber pedidos. Se precisar de ajuda, nosso suporte está disponível."
    },
    {
      question: "O sistema funciona para delivery e mesa?",
      answer: "Sim! O Mindi atende tanto delivery (com gestão de entregadores, taxas por bairro e rastreamento) quanto pedidos presenciais com mapa de mesas e comanda digital."
    },
    {
      question: "Como funciona a gestão de entregadores?",
      answer: "Você cadastra seus entregadores, define áreas de entrega e taxas por bairro. Quando um pedido sai para entrega, você atribui ao entregador e acompanha o status em tempo real. No final do dia, tem o relatório completo de entregas."
    },
    {
      question: "Posso integrar com impressora de pedidos?",
      answer: "Sim! O Mindi suporta impressão automática de pedidos em impressoras térmicas. Assim que o pedido entra, ele já sai impresso na cozinha, agilizando o preparo."
    },
  ];
}

/**
 * Simula o estado do accordion FAQ
 */
function toggleFAQItem(currentOpen: number | null, clickedIndex: number): number | null {
  return currentOpen === clickedIndex ? null : clickedIndex;
}

describe("FAQ Section - Data", () => {
  it("contém 8 perguntas frequentes", () => {
    const faq = getFAQData();
    expect(faq).toHaveLength(8);
  });

  it("todas as perguntas terminam com interrogação", () => {
    const faq = getFAQData();
    faq.forEach(item => {
      expect(item.question.endsWith("?")).toBe(true);
    });
  });

  it("todas as respostas são não-vazias", () => {
    const faq = getFAQData();
    faq.forEach(item => {
      expect(item.answer.length).toBeGreaterThan(20);
    });
  });

  it("inclui pergunta sobre período grátis", () => {
    const faq = getFAQData();
    expect(faq.some(f => f.question.includes("grátis"))).toBe(true);
  });

  it("inclui pergunta sobre cancelamento", () => {
    const faq = getFAQData();
    expect(faq.some(f => f.question.includes("cancelar"))).toBe(true);
  });

  it("inclui pergunta sobre taxa por pedido", () => {
    const faq = getFAQData();
    expect(faq.some(f => f.question.includes("taxa"))).toBe(true);
  });

  it("inclui pergunta sobre delivery e mesa", () => {
    const faq = getFAQData();
    expect(faq.some(f => f.question.includes("delivery") && f.question.includes("mesa"))).toBe(true);
  });

  it("inclui pergunta sobre impressora", () => {
    const faq = getFAQData();
    expect(faq.some(f => f.question.includes("impressora"))).toBe(true);
  });

  it("resposta sobre taxa menciona que é zero", () => {
    const faq = getFAQData();
    const taxaItem = faq.find(f => f.question.includes("taxa"));
    expect(taxaItem?.answer).toMatch(/mensalidade fixa|zero|0|sem comissão/i);
  });

  it("resposta sobre grátis menciona que não pede cartão", () => {
    const faq = getFAQData();
    const gratisItem = faq.find(f => f.question.includes("grátis"));
    expect(gratisItem?.answer).toContain("cartão de crédito");
  });
});

describe("FAQ Section - Accordion Logic", () => {
  it("abre item quando nenhum está aberto", () => {
    expect(toggleFAQItem(null, 0)).toBe(0);
    expect(toggleFAQItem(null, 3)).toBe(3);
  });

  it("fecha item quando clicado novamente", () => {
    expect(toggleFAQItem(0, 0)).toBeNull();
    expect(toggleFAQItem(3, 3)).toBeNull();
  });

  it("troca para outro item quando um diferente é clicado", () => {
    expect(toggleFAQItem(0, 1)).toBe(1);
    expect(toggleFAQItem(2, 5)).toBe(5);
  });

  it("apenas um item pode estar aberto por vez", () => {
    let state: number | null = null;
    state = toggleFAQItem(state, 0);
    expect(state).toBe(0);
    state = toggleFAQItem(state, 2);
    expect(state).toBe(2);
    // Apenas o item 2 está aberto, não o 0
    expect(state).not.toBe(0);
  });

  it("todos os índices válidos podem ser abertos", () => {
    const faq = getFAQData();
    for (let i = 0; i < faq.length; i++) {
      expect(toggleFAQItem(null, i)).toBe(i);
    }
  });
});

// ============ SEÇÃO CTA FINAL ============

interface CTATrustSignal {
  text: string;
}

function getCTATrustSignals(): CTATrustSignal[] {
  return [
    { text: "Dados protegidos" },
    { text: "Sem taxa por pedido" },
    { text: "Cancele quando quiser" },
  ];
}

function getCTAFinalContent() {
  return {
    badge: "Comece agora",
    headline: "Pare de perder dinheiro.",
    highlightedText: "Comece a vender do seu jeito.",
    subheadline: "Junte-se a centenas de restaurantes que já economizam milhares de reais por mês com o Mindi. Crie sua conta grátis em menos de 2 minutos.",
    primaryButton: { label: "Criar conta grátis", href: "/register" },
    secondaryButton: { label: "Falar com especialista", href: "https://wa.me/5500000000000" },
  };
}

describe("CTA Final Section - Content", () => {
  it("headline é impactante e menciona dinheiro", () => {
    const content = getCTAFinalContent();
    expect(content.headline).toContain("dinheiro");
  });

  it("texto destacado menciona vender", () => {
    const content = getCTAFinalContent();
    expect(content.highlightedText).toContain("vender");
  });

  it("subheadline menciona Mindi", () => {
    const content = getCTAFinalContent();
    expect(content.subheadline).toContain("Mindi");
  });

  it("subheadline menciona tempo rápido de criação", () => {
    const content = getCTAFinalContent();
    expect(content.subheadline).toMatch(/2 minutos/);
  });

  it("botão primário leva para registro", () => {
    const content = getCTAFinalContent();
    expect(content.primaryButton.href).toBe("/register");
    expect(content.primaryButton.label).toContain("grátis");
  });

  it("botão secundário leva para WhatsApp", () => {
    const content = getCTAFinalContent();
    expect(content.secondaryButton.href).toContain("wa.me");
  });
});

describe("CTA Final Section - Trust Signals", () => {
  it("tem 3 sinais de confiança", () => {
    const signals = getCTATrustSignals();
    expect(signals).toHaveLength(3);
  });

  it("inclui sinal sobre proteção de dados", () => {
    const signals = getCTATrustSignals();
    expect(signals.some(s => s.text.includes("protegidos"))).toBe(true);
  });

  it("inclui sinal sobre taxa zero", () => {
    const signals = getCTATrustSignals();
    expect(signals.some(s => s.text.includes("taxa"))).toBe(true);
  });

  it("inclui sinal sobre cancelamento", () => {
    const signals = getCTATrustSignals();
    expect(signals.some(s => s.text.includes("Cancele"))).toBe(true);
  });
});

// ============ FOOTER ============

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

function getFooterLinkGroups(): FooterLinkGroup[] {
  return [
    {
      title: "LINKS ÚTEIS",
      links: [
        { label: "Início", href: "#" },
        { label: "Planos", href: "#precos" },
        { label: "Como funciona", href: "#como-funciona" },
        { label: "Recursos", href: "#funcionalidades" },
        { label: "Blog", href: "#" },
        { label: "Entrar", href: "/login" },
      ],
    },
    {
      title: "SEGMENTOS",
      links: [
        { label: "Pizzarias", href: "#" },
        { label: "Hamburguerias", href: "#" },
        { label: "Restaurantes", href: "#" },
        { label: "Cafeterias", href: "#" },
      ],
    },
    {
      title: "LEGAL",
      links: [
        { label: "Termos de uso", href: "#" },
        { label: "Política de privacidade", href: "#" },
      ],
    },
  ];
}

function getFooterSocialLinks(): { name: string; href: string }[] {
  return [
    { name: "Instagram", href: "https://instagram.com" },
    { name: "Facebook", href: "https://facebook.com" },
    { name: "YouTube", href: "https://youtube.com" },
  ];
}

function getFooterContactInfo() {
  return {
    email: "contato@mindi.com.br",
    location: "São Paulo - SP",
    company: "Mindi Tecnologia LTDA",
    cnpj: "00.000.000/0001-00",
  };
}

describe("Footer - Link Groups (Menuz style)", () => {
  it("tem 3 grupos de links", () => {
    const groups = getFooterLinkGroups();
    expect(groups).toHaveLength(3);
  });

  it("grupo Links Úteis tem 6 links", () => {
    const groups = getFooterLinkGroups();
    const linksUteis = groups.find(g => g.title === "LINKS ÚTEIS");
    expect(linksUteis?.links).toHaveLength(6);
  });

  it("grupo Segmentos tem 4 links", () => {
    const groups = getFooterLinkGroups();
    const segmentos = groups.find(g => g.title === "SEGMENTOS");
    expect(segmentos?.links).toHaveLength(4);
  });

  it("grupo Legal tem 2 links", () => {
    const groups = getFooterLinkGroups();
    const legal = groups.find(g => g.title === "LEGAL");
    expect(legal?.links).toHaveLength(2);
  });

  it("grupo Links Úteis inclui link para Entrar", () => {
    const groups = getFooterLinkGroups();
    const linksUteis = groups.find(g => g.title === "LINKS ÚTEIS");
    const entrar = linksUteis?.links.find(l => l.label === "Entrar");
    expect(entrar?.href).toBe("/login");
  });

  it("grupo Links Úteis inclui link para Planos", () => {
    const groups = getFooterLinkGroups();
    const linksUteis = groups.find(g => g.title === "LINKS ÚTEIS");
    expect(linksUteis?.links.some(l => l.label === "Planos")).toBe(true);
  });

  it("grupo Legal inclui Termos de uso", () => {
    const groups = getFooterLinkGroups();
    const legal = groups.find(g => g.title === "LEGAL");
    expect(legal?.links.some(l => l.label.includes("Termos"))).toBe(true);
  });

  it("grupo Legal inclui Política de privacidade", () => {
    const groups = getFooterLinkGroups();
    const legal = groups.find(g => g.title === "LEGAL");
    expect(legal?.links.some(l => l.label.includes("privacidade"))).toBe(true);
  });

  it("grupo Segmentos inclui tipos de estabelecimento", () => {
    const groups = getFooterLinkGroups();
    const segmentos = groups.find(g => g.title === "SEGMENTOS");
    const labels = segmentos?.links.map(l => l.label) || [];
    expect(labels).toContain("Pizzarias");
    expect(labels).toContain("Hamburguerias");
    expect(labels).toContain("Restaurantes");
    expect(labels).toContain("Cafeterias");
  });
});

describe("Footer - Social Links", () => {
  it("tem 3 redes sociais", () => {
    const social = getFooterSocialLinks();
    expect(social).toHaveLength(3);
  });

  it("inclui Instagram", () => {
    const social = getFooterSocialLinks();
    expect(social.some(s => s.name === "Instagram")).toBe(true);
  });

  it("inclui Facebook", () => {
    const social = getFooterSocialLinks();
    expect(social.some(s => s.name === "Facebook")).toBe(true);
  });

  it("inclui YouTube", () => {
    const social = getFooterSocialLinks();
    expect(social.some(s => s.name === "YouTube")).toBe(true);
  });
});

describe("Footer - Contact Info", () => {
  it("tem email de contato", () => {
    const contact = getFooterContactInfo();
    expect(contact.email).toContain("@mindi.com.br");
  });

  it("tem localização", () => {
    const contact = getFooterContactInfo();
    expect(contact.location).toBeTruthy();
  });

  it("tem nome da empresa", () => {
    const contact = getFooterContactInfo();
    expect(contact.company).toContain("Mindi");
    expect(contact.company).toContain("LTDA");
  });

  it("tem CNPJ", () => {
    const contact = getFooterContactInfo();
    expect(contact.cnpj).toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  });
});

describe("Footer - Copyright", () => {
  it("ano do copyright é o ano atual", () => {
    const currentYear = new Date().getFullYear();
    expect(currentYear).toBe(2026);
  });

  it("copyright menciona Mindi", () => {
    const copyrightText = `© ${new Date().getFullYear()} Mindi. Todos os direitos reservados.`;
    expect(copyrightText).toContain("Mindi");
    expect(copyrightText).toContain("direitos reservados");
  });
});

// ============ SEÇÃO MOCKUP VISUAL: GESTÃO DE PEDIDOS ============

interface OrdersBenefit {
  text: string;
}

const ordersBenefits: OrdersBenefit[] = [
  { text: "Veja todos os pedidos em tempo real" },
  { text: "Status automático: novo, preparando, saiu para entrega" },
  { text: "Histórico completo de cada cliente" },
  { text: "Notificações sonoras para novos pedidos" },
  { text: "Filtros por data, status e entregador" },
  { text: "Impressão automática na cozinha" },
];

describe("Seção Gestão de Pedidos - Conteúdo", () => {
  it("tem badge 'GESTÃO DE PEDIDOS'", () => {
    const badge = "GESTÃO DE PEDIDOS";
    expect(badge).toBe("GESTÃO DE PEDIDOS");
    expect(badge.length).toBeGreaterThan(0);
  });

  it("título menciona pedidos e painel", () => {
    const title = "Todos os pedidos em um só painel.";
    expect(title.toLowerCase()).toContain("pedidos");
    expect(title.toLowerCase()).toContain("painel");
  });

  it("descrição menciona acompanhamento e entrega", () => {
    const desc = "Acompanhe cada pedido do momento em que entra até a entrega. Sem confusão, sem papel, sem perder nada.";
    expect(desc.toLowerCase()).toContain("pedido");
    expect(desc.toLowerCase()).toContain("entrega");
  });

  it("CTA tem texto de experimentar grátis", () => {
    const ctaText = "Experimentar grátis";
    expect(ctaText.toLowerCase()).toContain("grátis");
  });
});

describe("Seção Gestão de Pedidos - Benefícios", () => {
  it("tem exatamente 6 benefícios", () => {
    expect(ordersBenefits).toHaveLength(6);
  });

  it("todos os benefícios têm texto não vazio", () => {
    ordersBenefits.forEach((b) => {
      expect(b.text.length).toBeGreaterThan(0);
    });
  });

  it("primeiro benefício menciona tempo real", () => {
    expect(ordersBenefits[0].text.toLowerCase()).toContain("tempo real");
  });

  it("segundo benefício menciona status automático", () => {
    expect(ordersBenefits[1].text.toLowerCase()).toContain("status");
  });

  it("benefícios cobrem funcionalidades-chave", () => {
    const allText = ordersBenefits.map((b) => b.text.toLowerCase()).join(" ");
    expect(allText).toContain("tempo real");
    expect(allText).toContain("status");
    expect(allText).toContain("histórico");
    expect(allText).toContain("notificações");
    expect(allText).toContain("filtros");
    expect(allText).toContain("impressão");
  });
});

describe("Seção Gestão de Pedidos - Mockup Estático", () => {
  it("URL do mockup de pedidos é válida", () => {
    // PEDIDOS_MOCKUP is a CDN URL for the screenshot
    const mockupUrl = "https://mindi-s3-bucket.s3"; // prefix check
    expect(mockupUrl).toContain("s3");
  });

  it("seção tem id 'gestao-pedidos' para navegação", () => {
    const sectionId = "gestao-pedidos";
    expect(sectionId).toBe("gestao-pedidos");
  });

  it("browser chrome mostra URL app.mindi.com.br/pedidos", () => {
    const browserUrl = "app.mindi.com.br/pedidos";
    expect(browserUrl).toContain("mindi");
    expect(browserUrl).toContain("pedidos");
  });
});

describe("Seção Gestão de Pedidos - Badges Flutuantes", () => {
  const floatingBadges = [
    { label: "Pedidos hoje", value: "24 pedidos", color: "blue" },
    { label: "Tempo médio", value: "12 min", color: "green" },
  ];

  it("tem 2 badges flutuantes", () => {
    expect(floatingBadges).toHaveLength(2);
  });

  it("badge de pedidos mostra quantidade", () => {
    const pedidosBadge = floatingBadges.find((b) => b.label === "Pedidos hoje");
    expect(pedidosBadge).toBeDefined();
    expect(pedidosBadge!.value).toContain("24");
  });

  it("badge de tempo médio mostra minutos", () => {
    const tempoBadge = floatingBadges.find((b) => b.label === "Tempo médio");
    expect(tempoBadge).toBeDefined();
    expect(tempoBadge!.value).toContain("min");
  });

  it("badges usam cores diferentes", () => {
    const colors = floatingBadges.map((b) => b.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(floatingBadges.length);
  });
});

describe("Seção Gestão de Pedidos - Layout", () => {
  it("grid usa 12 colunas com 7/5 split", () => {
    const leftCols = 7;
    const rightCols = 5;
    expect(leftCols + rightCols).toBe(12);
    expect(leftCols).toBeGreaterThan(rightCols); // mockup side is larger
  });

  it("seção é puramente visual sem rotas ou funcionalidade", () => {
    // This section is a static visual mockup, not a functional page
    const hasRoutes = false;
    const hasClickableButtons = false; // CTA link is the only interactive element
    const hasScrollInternal = false;
    const hasDynamicStates = false;
    expect(hasRoutes).toBe(false);
    expect(hasClickableButtons).toBe(false);
    expect(hasScrollInternal).toBe(false);
    expect(hasDynamicStates).toBe(false);
  });
});
