import { useState, useEffect } from "react";
import { Cookie, X, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

const COOKIE_CONSENT_KEY = "mindi_cookie_consent";

// Rotas onde o banner de cookies deve aparecer (apenas landing page)
const LANDING_ROUTES = ["/landing", "/privacidade", "/termos"];

function isLandingPage(path: string): boolean {
  // Aparece APENAS nestas rotas específicas da landing page
  // NÃO aparece na raiz / (que é o dashboard quando logado),
  // nem no menu público, login, onboarding, etc.
  return LANDING_ROUTES.includes(path);
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent && isLandingPage(location)) {
      // Pequeno delay para não aparecer instantaneamente
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    // Se mudou para uma rota não permitida, esconder
    if (!isLandingPage(location)) {
      setVisible(false);
    }
  }, [location]);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      essential: true,
      performance: true,
      timestamp: Date.now(),
    }));
    setVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      essential: true,
      performance: false,
      timestamp: Date.now(),
    }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 px-3.5 py-3">
          {/* Botão fechar */}
          <button
            onClick={handleAcceptEssential}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex items-start gap-2.5">
            {/* Ícone */}
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 flex-shrink-0">
              <Cookie className="h-4 w-4 text-red-500" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Título */}
              <div className="flex items-center gap-1.5 mb-1">
                <Cookie className="h-3.5 w-3.5 text-red-500 sm:hidden" />
                <h3 className="text-xs font-semibold text-gray-900">
                  Utilizamos cookies
                </h3>
              </div>

              {/* Descrição */}
              <p className="text-[10px] text-gray-600 leading-relaxed mb-2.5">
                O <strong>Mindi</strong> utiliza cookies essenciais para o funcionamento da plataforma. Cookies de desempenho são opcionais e só serão ativados com seu consentimento explícito. Saiba mais na nossa{" "}
                <Link href="/privacidade" className="text-red-500 hover:text-red-500 underline underline-offset-2 font-medium">
                  Política de Privacidade
                </Link>.
              </p>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                <button
                  onClick={handleAcceptAll}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-500 text-white text-[10px] font-medium rounded-md transition-colors"
                >
                  <Shield className="h-3 w-3" />
                  Aceitar todos
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium rounded-md transition-colors"
                >
                  Apenas essenciais
                </button>
                <Link
                  href="/privacidade"
                  className="flex items-center justify-center px-3 py-1.5 text-gray-500 hover:text-gray-700 text-[10px] font-medium transition-colors sm:ml-auto"
                >
                  Saiba mais
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
