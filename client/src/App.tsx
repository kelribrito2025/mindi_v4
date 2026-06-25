import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { NewOrdersProvider } from "./contexts/NewOrdersContext";
import { SearchProvider } from "./contexts/SearchContext";
import { lazy, Suspense, useEffect } from "react";

import { GlobalPDVHandle } from "./components/GlobalPDVHandle";
import { OnboardingFAB } from "./components/OnboardingFAB";
import CookieConsent from "./components/CookieConsent";
const LOADING_LOGO_HEIGHT_CLASS = "h-[43.3784px]";
const LOADING_LOGO_LIGHT = "/assets/mindi-login-logo-light.png";
const LOADING_LOGO_DARK = "/assets/mindi-login-logo-dark.png";

// NotFound stays eager (tiny component)
import NotFound from "@/pages/NotFound";

// ─── Eager imports (main pages — no loading flash) ────────────────────
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import MesasComandas from "./pages/MesasComandas";
import Pedidos from "./pages/Pedidos";
import Catalogo from "./pages/Catalogo";
import Relatorios from "./pages/Relatorios";
import Banking from "./pages/Banking";

// ─── Lazy-loaded pages (code-splitting for less-used pages) ────────
const PublicMenu = lazy(() => import("./pages/PublicMenu"));
const OrderReceipt = lazy(() => import("./pages/OrderReceipt"));
const Financas = lazy(() => import("./pages/Financas"));
const ControleCaixa = lazy(() => import("./pages/ControleCaixa"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Complementos = lazy(() => import("./pages/Complementos"));
const Campanhas = lazy(() => import("./pages/Campanhas"));
const Cozinha = lazy(() => import("./pages/Cozinha"));
const Fidelizacao = lazy(() => import("./pages/Fidelizacao"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Entregadores = lazy(() => import("./pages/Entregadores"));
const Estoque = lazy(() => import("./pages/Estoque"));
const Agendados = lazy(() => import("./pages/Agendados"));
const PedidosHistorico = lazy(() => import("./pages/PedidosHistorico"));
const Avaliacoes = lazy(() => import("./pages/Avaliacoes"));
const Acessos = lazy(() => import("./pages/Acessos"));
const TesteImpressao = lazy(() => import("./pages/TesteImpressao"));
const Sugestoes = lazy(() => import("./pages/Sugestoes"));

const ProductForm = lazy(() => import("./pages/ProductForm"));
const Planos = lazy(() => import("./pages/Planos"));
const Cupons = lazy(() => import("./pages/Cupons"));
const CouponForm = lazy(() => import("./pages/CouponForm"));
const PrinterApp = lazy(() => import("./pages/PrinterApp"));
const Impressoras = lazy(() => import("./pages/Impressoras"));
const Stories = lazy(() => import("./pages/Stories"));
const AccountSecurity = lazy(() => import("./pages/AccountSecurity"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const EntregadorDetalhes = lazy(() => import("./pages/EntregadorDetalhes"));
const BotWhatsApp = lazy(() => import("./pages/BotWhatsApp"));
const Clientes = lazy(() => import("./pages/Clientes"));

const DemoDashboard1 = lazy(() => import("./pages/DemoDashboard1"));
const DemoDashboard2 = lazy(() => import("./pages/DemoDashboard2"));
const HowItWorksTest = lazy(() => import("./pages/HowItWorksTest"));
const TestimonialsTest = lazy(() => import("./pages/TestimonialsTest"));
const PricingTest = lazy(() => import("./pages/PricingTest"));

// Auth Pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const EstablishmentSelector = lazy(() => import("./pages/EstablishmentSelector"));

// Admin Pages (Super Admin)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRestaurantes = lazy(() => import("./pages/admin/AdminRestaurantes"));
const AdminRestauranteDetalhe = lazy(() => import("./pages/admin/AdminRestauranteDetalhe"));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos"));
const AdminTrials = lazy(() => import("./pages/admin/AdminTrials"));
const AdminRelatorios = lazy(() => import("./pages/admin/AdminRelatorios"));
const AdminFeedbacks = lazy(() => import("./pages/admin/AdminFeedbacks"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminChangelog = lazy(() => import("./pages/admin/AdminChangelog"));
const AdminOrderLogs = lazy(() => import("./pages/admin/AdminOrderLogs"));
const AdminSSELogs = lazy(() => import("./pages/admin/AdminSSELogs"));

// ─── Suspense fallback (same loading screen as login) ───────────────────────
function PageLoader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground transition-colors duration-200"
      style={{
        backgroundColor: isDark ? "oklch(0.14 0.005 250)" : "oklch(0.985 0.002 250)",
        color: isDark ? "oklch(0.93 0.005 250)" : "oklch(0.15 0.01 250)",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <img
          src={isDark ? LOADING_LOGO_DARK : LOADING_LOGO_LIGHT}
          alt="Mindi"
          className={`${LOADING_LOGO_HEIGHT_CLASS} max-w-[calc(100%-3rem)] w-auto object-contain`}
        />
        <div className="flex items-center gap-[1px] text-sm text-muted-foreground font-medium">
          <span>Carregando</span>
          <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite' }}>.</span>
          <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite 0.2s' }}>.</span>
          <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite 0.4s' }}>.</span>
        </div>
      </div>
      <style>{`
        @keyframes mindiOverlayDot {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function PageLoaderLight() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-colors duration-200"
      style={{
        backgroundColor: "oklch(0.985 0.002 250)",
        color: "oklch(0.15 0.01 250)",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <img
          src={LOADING_LOGO_LIGHT}
          alt="Mindi"
          className={`${LOADING_LOGO_HEIGHT_CLASS} max-w-[calc(100%-3rem)] w-auto object-contain`}
        />
        <div className="flex items-center gap-[1px] text-sm font-medium" style={{ color: "oklch(0.45 0.02 250)" }}>
          <span>Carregando</span>
          <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite' }}>.</span>
          <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite 0.2s' }}>.</span>
          <span className="font-bold" style={{ animation: 'mindiOverlayDot 1.4s ease-in-out infinite 0.4s' }}>.</span>
        </div>
      </div>
      <style>{`
        @keyframes mindiOverlayDot {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Prefetch lazy page chunks in background after initial load ─────────
const lazyPageImports = [
  () => import("./pages/PublicMenu"),
  () => import("./pages/Financas"),
  () => import("./pages/ControleCaixa"),
  () => import("./pages/Configuracoes"),
  () => import("./pages/Complementos"),
  () => import("./pages/Campanhas"),
  () => import("./pages/Cozinha"),
  () => import("./pages/Fidelizacao"),
  () => import("./pages/Onboarding"),
  () => import("./pages/LandingPage"),
  () => import("./pages/Entregadores"),
  () => import("./pages/Estoque"),
  () => import("./pages/Agendados"),
  () => import("./pages/PedidosHistorico"),
  () => import("./pages/Avaliacoes"),
  () => import("./pages/Acessos"),
  () => import("./pages/TesteImpressao"),
  () => import("./pages/Sugestoes"),
  () => import("./pages/ProductForm"),
  () => import("./pages/Planos"),
  () => import("./pages/Cupons"),
  () => import("./pages/CouponForm"),
  () => import("./pages/PrinterApp"),
  () => import("./pages/Impressoras"),
  () => import("./pages/Stories"),
  () => import("./pages/AccountSecurity"),
  () => import("./pages/Ajuda"),
  () => import("./pages/EntregadorDetalhes"),
  () => import("./pages/BotWhatsApp"),
  () => import("./pages/Clientes"),
  () => import("./pages/Login"),
  () => import("./pages/Register"),
  () => import("./pages/ForgotPassword"),
  () => import("./pages/ResetPassword"),
  () => import("./pages/Privacidade"),
  () => import("./pages/Termos"),
  () => import("./pages/admin/AdminLogin"),
  () => import("./pages/admin/AdminDashboard"),
  () => import("./pages/admin/AdminRestaurantes"),
  () => import("./pages/admin/AdminRestauranteDetalhe"),
  () => import("./pages/admin/AdminPlanos"),
  () => import("./pages/admin/AdminTrials"),
  () => import("./pages/admin/AdminRelatorios"),
  () => import("./pages/admin/AdminFeedbacks"),
  () => import("./pages/admin/AdminAuditLog"),
  () => import("./pages/admin/AdminChangelog"),
  () => import("./pages/admin/AdminOrderLogs"),
  () => import("./pages/admin/AdminSSELogs"),
];

function usePrefetchPages() {
  useEffect(() => {
    // Wait for the main page to finish loading, then prefetch all other pages in background
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          lazyPageImports.forEach(fn => fn());
        });
      } else {
        // Fallback: prefetch after 3s
        lazyPageImports.forEach(fn => fn());
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
}

// Componente wrapper para rotas do admin que precisam do NewOrdersProvider
function AdminRoutes() {
  return (
    <SearchProvider>
    <NewOrdersProvider>
      <GlobalPDVHandle />
      <OnboardingFAB />
      <Switch>
        {/* App routes - Admin Panel */}
        <Route path="/">{() => <Dashboard />}</Route>
        <Route path="/catalogo">{() => <Catalogo />}</Route>
        <Route path="/catalogo/novo">{() => <ProductForm />}</Route>
        {/* Rota de edição removida - agora usa modal no catálogo */}
        <Route path="/complementos">{() => <Complementos />}</Route>
        <Route path="/pedidos">{() => <Pedidos />}</Route>
        <Route path="/pedidos/historico">{() => <PedidosHistorico />}</Route>
        <Route path="/agendados">{() => <Agendados />}</Route>
        <Route path="/estoque">{() => <Estoque />}</Route>
        <Route path="/configuracoes">{() => <Configuracoes />}</Route>
        <Route path="/planos">{() => <Planos />}</Route>
        <Route path="/cupons">{() => <Cupons />}</Route>
        <Route path="/cupons/novo">{() => <CouponForm />}</Route>
        <Route path="/cupons/:id">{() => <CouponForm />}</Route>
        <Route path="/teste-impressao">{() => <TesteImpressao />}</Route>

        <Route path="/impressoras">{() => <Impressoras />}</Route>
        <Route path="/campanhas">{() => <Campanhas />}</Route>
        <Route path="/stories">{() => <Stories />}</Route>
        <Route path="/pdv">{() => <PDV />}</Route>
        <Route path="/mesas">{() => <MesasComandas />}</Route>
        <Route path="/cozinha">{() => <Cozinha />}</Route>
        <Route path="/avaliacoes">{() => <Avaliacoes />}</Route>
        <Route path="/financas">{() => <Financas />}</Route>
        <Route path="/controle-caixa">{() => <ControleCaixa />}</Route>
        <Route path="/relatorios">{() => <Relatorios />}</Route>
        <Route path="/entregadores">{() => <Entregadores />}</Route>
        <Route path="/entregadores/:id">{() => <EntregadorDetalhes />}</Route>
        <Route path="/conta-seguranca">{() => <AccountSecurity />}</Route>
        <Route path="/ajuda">{() => <Ajuda />}</Route>
        <Route path="/bot-whatsapp">{() => <BotWhatsApp />}</Route>
        <Route path="/fidelizacao">{() => <Fidelizacao />}</Route>
        <Route path="/clientes">{() => <Clientes />}</Route>
        <Route path="/acessos">{() => <Acessos />}</Route>
        <Route path="/banking">{() => <Banking />}</Route>
        <Route path="/sugestoes">{() => <Sugestoes />}</Route>

        
        
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </NewOrdersProvider>
    </SearchProvider>
  );
}

// Helper para detectar se estamos no domínio da landing page
const isLandingDomain = () => {
  const hostname = window.location.hostname;
  return hostname === 'mindi.com.br' || hostname === 'www.mindi.com.br';
};

// Componente que redireciona para app.mindi.com.br mantendo o path
function RedirectToApp() {
  const path = window.location.pathname + window.location.search + window.location.hash;
  window.location.href = `https://app.mindi.com.br${path}`;
  return null;
}

// Rotas públicas da landing page (mindi.com.br)
// Rotas de app (/login, /criar-conta, etc.) redirecionam para app.mindi.com.br
function LandingRoutes() {
  return (
    <Switch>
      {/* Rotas que ficam no mindi.com.br (landing e conteúdo público) */}
      <Route path="/landing">{() => <LandingPage />}</Route>
      <Route path="/privacidade">{() => <Privacidade />}</Route>
      <Route path="/termos">{() => <Termos />}</Route>
      <Route path="/menu/:slug">
        <Suspense fallback={<PageLoaderLight />}>
          <PublicMenu />
        </Suspense>
      </Route>
      <Route path="/recibo/:orderId">
        <Suspense fallback={<PageLoaderLight />}>
          <OrderReceipt />
        </Suspense>
      </Route>
      <Route path="/demo/dashboard1">{() => <DemoDashboard1 />}</Route>
      <Route path="/demo/dashboard2">{() => <DemoDashboard2 />}</Route>
      <Route path="/test/how-it-works">{() => <HowItWorksTest />}</Route>
      <Route path="/test/testimonials">{() => <TestimonialsTest />}</Route>
      <Route path="/test/pricing">{() => <PricingTest />}</Route>
      
      {/* Rotas de app → redirecionar para app.mindi.com.br */}
      <Route path="/login">{() => <RedirectToApp />}</Route>
      <Route path="/criar-conta">{() => <RedirectToApp />}</Route>
      <Route path="/esqueci-senha">{() => <RedirectToApp />}</Route>
      <Route path="/redefinir-senha">{() => <RedirectToApp />}</Route>
      <Route path="/onboarding">{() => <RedirectToApp />}</Route>
      <Route path="/catalogo">{() => <RedirectToApp />}</Route>
      <Route path="/pedidos">{() => <RedirectToApp />}</Route>
      <Route path="/configuracoes">{() => <RedirectToApp />}</Route>
      <Route path="/financas">{() => <RedirectToApp />}</Route>
      <Route path="/pdv">{() => <RedirectToApp />}</Route>
      <Route path="/cozinha">{() => <RedirectToApp />}</Route>
      <Route path="/banking">{() => <RedirectToApp />}</Route>
      <Route path="/planos">{() => <RedirectToApp />}</Route>
      <Route path="/relatorios">{() => <RedirectToApp />}</Route>
      <Route path="/printer-app">{() => <RedirectToApp />}</Route>
      <Route path="/admin">{() => <RedirectToApp />}</Route>
      
      {/* mindi.com.br raiz → LandingPage */}
      <Route path="/">{() => <LandingPage />}</Route>
      
      {/* Qualquer outra rota desconhecida → LandingPage */}
      <Route>{() => <LandingPage />}</Route>
    </Switch>
  );
}

function Router() {
  // Se estamos no domínio mindi.com.br, usar rotas da landing (sem AdminRoutes/AdminLayout)
  if (isLandingDomain()) {
    return <LandingRoutes />;
  }

  return (
    <Switch>
      {/* Landing Page - rota pública */}
      <Route path="/landing">{() => <LandingPage />}</Route>
      <Route path="/recibo/:orderId">
        <Suspense fallback={<PageLoaderLight />}>
          <OrderReceipt />
        </Suspense>
      </Route>
      

      {/* Demo Dashboard - rotas públicas para iframe na landing */}
      <Route path="/demo/dashboard1">{() => <DemoDashboard1 />}</Route>
      <Route path="/demo/dashboard2">{() => <DemoDashboard2 />}</Route>
      
      {/* Página de teste - propostas visuais */}
      <Route path="/test/how-it-works">{() => <HowItWorksTest />}</Route>
      <Route path="/test/testimonials">{() => <TestimonialsTest />}</Route>
      <Route path="/test/pricing">{() => <PricingTest />}</Route>
      
      {/* Política de Privacidade e Termos - rotas públicas (Play Store) */}
      <Route path="/privacidade">{() => <Privacidade />}</Route>
      <Route path="/termos">{() => <Termos />}</Route>
      
      {/* Auth routes - sem NewOrdersProvider */}
      <Route path="/login">{() => <Login />}</Route>
      <Route path="/criar-conta">{() => <Onboarding />}</Route>
      <Route path="/esqueci-senha">{() => <ForgotPassword />}</Route>
      <Route path="/redefinir-senha">{() => <ResetPassword />}</Route>
      <Route path="/onboarding">{() => <Onboarding />}</Route>
      <Route path="/selecionar-estabelecimento">{() => <EstablishmentSelector />}</Route>
      
      {/* Public menu route */}
      <Route path="/menu/:slug">
        <Suspense fallback={<PageLoaderLight />}>
          <PublicMenu />
        </Suspense>
      </Route>
      <Route path="/recibo/:orderId">
        <Suspense fallback={<PageLoaderLight />}>
          <OrderReceipt />
        </Suspense>
      </Route>
      
      {/* PWA de Impressão Automática */}
      <Route path="/printer-app">{() => <PrinterApp />}</Route>
      
      {/* Super Admin routes */}
      <Route path="/admin/login">{() => <AdminLogin />}</Route>
      <Route path="/admin">{() => <AdminDashboard />}</Route>
      <Route path="/admin/restaurantes/:id">{() => <AdminRestauranteDetalhe />}</Route>
      <Route path="/admin/restaurantes">{() => <AdminRestaurantes />}</Route>
      <Route path="/admin/planos">{() => <AdminPlanos />}</Route>
      <Route path="/admin/trials">{() => <AdminTrials />}</Route>
      <Route path="/admin/relatorios">{() => <AdminRelatorios />}</Route>
      <Route path="/admin/feedbacks">{() => <AdminFeedbacks />}</Route>
      <Route path="/admin/audit-log">{() => <AdminAuditLog />}</Route>
      <Route path="/admin/changelog">{() => <AdminChangelog />}</Route>
      <Route path="/admin/order-logs">{() => <AdminOrderLogs />}</Route>
      <Route path="/admin/sse-logs">{() => <AdminSSELogs />}</Route>
      
      {/* Admin routes - com NewOrdersProvider */}
      <Route path="/">
        {() => <AdminRoutes />}
      </Route>
      
      {/* Restaurant admin routes - com NewOrdersProvider */}
      <Route>
        <AdminRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  // Prefetch all page chunks in background after initial load
  usePrefetchPages();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster position="top-right" closeButton toastOptions={{ style: { background: 'linear-gradient(135deg, #ef4444 0%, #ef4444 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)', minWidth: '420px' }, className: 'toast-custom' }} />
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
