import { useState, useEffect, useRef } from "react";
import { Link, useSearch } from "wouter";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Users, Sun, Moon, ArrowLeft, Store, Plus, UtensilsCrossed, Star } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OtpInput } from "@/components/OtpInput";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const REMEMBER_KEY = "mindi_remember_email";
const REMEMBER_PASS_KEY = "mindi_remember_pass";
const REMEMBER_CHECKED_KEY = "mindi_remember_checked";

/** Ícone SVG do Google (cores oficiais) */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "icloud.com"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{ challengeId: string; verificationEmail: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showEstablishmentSelector, setShowEstablishmentSelector] = useState(false);
  const [selectingEstId, setSelectingEstId] = useState<number | null>(null);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const [twoFactorCodeError, setTwoFactorCodeError] = useState(false);
  const [pendingRememberMe, setPendingRememberMe] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const searchString = useSearch();
  
  // Establishment selector queries (only active after login)
  const { data: establishments, isLoading: estLoading } = trpc.establishment.listUserEstablishments.useQuery(undefined, {
    enabled: showEstablishmentSelector,
    staleTime: 30_000,
  });
  const { data: countData } = trpc.establishment.countEstablishments.useQuery(undefined, {
    enabled: showEstablishmentSelector,
    staleTime: 30_000,
  });
  const { data: defaultEstData } = trpc.establishment.getDefaultEstablishment.useQuery(undefined, {
    enabled: showEstablishmentSelector,
    staleTime: 30_000,
  });
  const selectEstMutation = trpc.establishment.selectEstablishment.useMutation({
    onSuccess: async () => {
      await queryClient.clear();
      window.location.replace("/");
    },
    onError: (error) => {
      setSelectingEstId(null);
      toast.error(error.message || "Erro ao selecionar estabelecimento.");
    },
  });
  const setDefaultMutation = trpc.establishment.setDefaultEstablishment.useMutation({
    onSuccess: () => {
      utils.establishment.getDefaultEstablishment.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao definir favorito.");
    },
  });
  const handleSelectEstablishment = (establishmentId: number) => {
    setSelectingEstId(establishmentId);
    selectEstMutation.mutate({ establishmentId });
  };
  const handleToggleFavorite = (e: React.MouseEvent, establishmentId: number, estName: string) => {
    e.stopPropagation();
    const currentDefault = defaultEstData?.defaultEstablishmentId;
    if (currentDefault === establishmentId) {
      // Unset favorite
      setDefaultMutation.mutate({ establishmentId: null });
      setFavoriteMessage(null);
    } else {
      // Set as favorite
      setDefaultMutation.mutate({ establishmentId });
      setFavoriteMessage(`Próximos logins entrarão direto em "${estName}"`);
      setTimeout(() => setFavoriteMessage(null), 5000);
    }
  };
  const handleCreateNewEstablishment = () => {
    window.location.href = "/onboarding";
  };
  const { theme, forceTheme } = useTheme();

  // Gerar sugestões de email baseadas no texto digitado
  const emailSuggestions = (() => {
    if (!email || email.includes("@")) return [];
    return EMAIL_DOMAINS.map((domain) => `${email}@${domain}`);
  })();

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(e.target as Node)
      ) {
        setShowEmailSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carregar dados salvos do localStorage ao montar o componente
  useEffect(() => {
    const wasChecked = localStorage.getItem(REMEMBER_CHECKED_KEY);
    if (wasChecked === "true") {
      const savedEmail = localStorage.getItem(REMEMBER_KEY);
      const savedPass = localStorage.getItem(REMEMBER_PASS_KEY);
      if (savedEmail) setEmail(savedEmail);
      if (savedPass) setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  // Check if we should show selector directly (from "Alternar conta" button)
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("select") === "1") {
      setShowEstablishmentSelector(true);
    }
  }, [searchString]);

  // Auto-select establishment after login:
  // 1) If only 1 establishment, select it directly (no selector shown)
  // 2) If has a favorite/default, select it directly
  // 3) Otherwise show the selector (2+ establishments)
  useEffect(() => {
    if (!showEstablishmentSelector || !establishments || !defaultEstData) return;
    if (selectingEstId) return; // Already selecting

    // If only 1 establishment, always auto-select it (no need to show selector)
    if (establishments.length === 1) {
      handleSelectEstablishment(establishments[0].establishmentId);
      return;
    }

    // Don't auto-select if coming from "Alternar conta" (?select=1)
    const params = new URLSearchParams(searchString);
    if (params.get("select") === "1") return;

    // If user has a default/favorite and it exists in their list, auto-select it
    const defaultId = defaultEstData.defaultEstablishmentId;
    if (defaultId && establishments.some(e => e.establishmentId === defaultId)) {
      handleSelectEstablishment(defaultId);
    }
  }, [showEstablishmentSelector, establishments, defaultEstData]);

  // Mostrar mensagens de erro do Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        google_not_configured: "Login com Google não está configurado. Tente novamente mais tarde.",
        google_denied: "Acesso negado. Você cancelou o login com Google.",
        google_invalid: "Parâmetros inválidos no retorno do Google.",
        google_expired: "Sessão expirada. Tente novamente.",
        google_token_failed: "Erro ao autenticar com Google. Tente novamente.",
        google_profile_failed: "Erro ao obter perfil do Google. Tente novamente.",
        google_no_email: "Não foi possível obter seu email do Google.",
        google_no_account: "Nenhuma conta encontrada com este email. Crie uma conta primeiro.",
        google_user_failed: "Erro ao processar login. Tente novamente.",
        google_error: "Erro inesperado no login com Google. Tente novamente.",
      };
      toast.error(errorMessages[error] || "Erro no login com Google.");
      // Limpar o parâmetro de erro da URL
      window.history.replaceState({}, "", "/login");
    }
  }, [searchString]);

  const [isCollaboratorMode, setIsCollaboratorMode] = useState(false);

  const collaboratorLoginMutation = trpc.collaborator.login.useMutation({
    onSuccess: async (data) => {
      // P15: Sessão do colaborador agora é gerida via cookie 'collaborator_info'
      // setado pelo servidor no login. Não usar mais localStorage.
      toast.success(`Bem-vindo, ${data.collaborator.name}!`);
      await utils.invalidate();
      queryClient.clear();
      window.localStorage.removeItem("manus-runtime-user-info");
      window.location.replace("/");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao fazer login.");
    },
  });

  const loginMutation = trpc.auth.loginWithEmail.useMutation({
    onSuccess: async (data) => {
      const response = data as any;
      // Check if the server detected this is a collaborator account
      if (response.isCollaborator) {
        toast.info("Este email pertence a um colaborador. Redirecionando para o acesso de colaborador...", { duration: 4000 });
        setIsCollaboratorMode(true);
        return;
      }
      if (response.requiresTwoFactor && response.challengeId) {
        setPendingRememberMe(rememberMe);
        setTwoFactorChallenge({
          challengeId: response.challengeId,
          verificationEmail: response.verificationEmail || email,
        });
        setTwoFactorCode("");
        setTwoFactorCodeError(false);
        toast.success("Enviamos o código de verificação para o e-mail configurado.");
        return;
      }
      // Salvar ou remover credenciais do localStorage baseado no checkbox
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
        localStorage.setItem(REMEMBER_PASS_KEY, password);
        localStorage.setItem(REMEMBER_CHECKED_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_PASS_KEY);
        localStorage.removeItem(REMEMBER_CHECKED_KEY);
      }
      toast.success("Login realizado com sucesso!");
      // Invalidar o cache de autenticação para forçar nova verificação
      await utils.invalidate();
      queryClient.clear();
      window.localStorage.removeItem("manus-runtime-user-info");
      // Show establishment selector in the same page
      setShowEstablishmentSelector(true);
    },
    onError: (error: { message?: string }) => {
      // Ignorar erros de pattern do Safari que são intermitentes
      const errorMessage = error.message || "";
      if (errorMessage.includes("string did not match the expected pattern") ||
          errorMessage.includes("pattern")) {
        // Este é um erro intermitente do Safari, tentar novamente silenciosamente
        console.warn('[Login] Safari pattern error detected, retrying...');
        return;
      }
      toast.error(error.message || "Erro ao fazer login. Verifique suas credenciais.");
    },
  });


  const verifyTwoFactorMutation = trpc.auth.verifyTwoFactorLogin.useMutation({
    onSuccess: async () => {
      if (pendingRememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
        localStorage.setItem(REMEMBER_PASS_KEY, password);
        localStorage.setItem(REMEMBER_CHECKED_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_PASS_KEY);
        localStorage.removeItem(REMEMBER_CHECKED_KEY);
      }
      toast.success("Verificação concluída com sucesso!");
      await utils.invalidate();
      queryClient.clear();
      window.localStorage.removeItem("manus-runtime-user-info");
      // Show establishment selector in the same page
      setShowEstablishmentSelector(true);
    },
    onError: (error: { message?: string }) => {
      setTwoFactorCodeError(true);
      toast.error(error.message || "Código inválido. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorChallenge) {
      if (twoFactorCode.trim().length !== 5) {
        setTwoFactorCodeError(true);
        toast.error("Informe o código de 5 dígitos enviado por e-mail.");
        return;
      }
      verifyTwoFactorMutation.mutate({
        challengeId: twoFactorChallenge.challengeId,
        code: twoFactorCode.trim(),
      });
      return;
    }
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (isCollaboratorMode) {
      collaboratorLoginMutation.mutate({ email, password });
    } else {
      loginMutation.mutate({ email, password, rememberMe });
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirecionar para a rota de autenticação Google
    window.location.href = "/api/auth/google?mode=login";
  };

  const isLoading = loginMutation.isPending || collaboratorLoginMutation.isPending || verifyTwoFactorMutation.isPending;
  const loginLogoSrc = theme === "dark" ? "/assets/mindi-login-logo-dark.png" : "/assets/mindi-login-logo-light.png";

  const COLLAB_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/collab-bg-optimized_94b9e709.jpg";
  const COLLAB_BG_PLACEHOLDER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/collab-bg-placeholder_2461c466.jpg";

  // Toggle tema na página de login
  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    forceTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <AuthLayout
      {...(isCollaboratorMode ? { backgroundImage: COLLAB_BG, backgroundPlaceholder: COLLAB_BG_PLACEHOLDER } : {})}
    >
      {/* Logo + Theme toggle row */}
      <div className="relative flex items-center justify-center mb-8 lg:mb-6">
        <img
          src={loginLogoSrc}
          alt="Mindi"
          className="h-[28.9189px] max-w-[calc(100%-3rem)] w-auto object-contain"
        />

        {/* Theme toggle button */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:opacity-70 transition-opacity duration-200"
          title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Sun className="h-5 w-5 text-amber-400" />
          )}
        </button>
      </div>

      {/* Establishment Selector - shown after successful login */}
      {showEstablishmentSelector ? (
        <>
          {/* Show only a generic spinner while loading or if single establishment (will auto-redirect) */}
          {(estLoading || !establishments || establishments.length <= 1) ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-red-500" />
              <p className="text-sm text-muted-foreground">Entrando...</p>
            </div>
          ) : (
          <>
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-foreground mb-1">Selecionar Estabelecimento</h2>
            <p className="text-sm text-muted-foreground">Escolha qual estabelecimento deseja gerenciar</p>

          </div>
          {false ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-red-500" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {establishments?.map((est) => (
                  <div
                    key={est.establishmentId}
                    className={`group relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-150 hover:bg-red-50/60 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800 ${
                      selectingEstId === est.establishmentId
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-sm"
                        : "border-border"
                    }`}
                    onClick={() => !selectingEstId && handleSelectEstablishment(est.establishmentId)}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {est.logo ? (
                        <img src={est.logo} alt={est.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-semibold text-foreground truncate">{est.name}</span>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          est.isOpen
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${est.isOpen ? "bg-green-500" : "bg-red-500"}`} />
                          {est.isOpen ? "Aberto" : "Fechado"}
                        </span>
                      </div>
                      {est.menuSlug && (
                        <p className="text-xs text-muted-foreground truncate">/{est.menuSlug}</p>
                      )}
                    </div>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(e, est.establishmentId, est.name)}
                            className="p-1 rounded hover:bg-white/80 dark:hover:bg-zinc-800 transition-colors shrink-0"
                          >
                            <Star
                            
                              className={`h-4 w-4 transition-colors ${
                                defaultEstData?.defaultEstablishmentId === est.establishmentId
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/40 group-hover:text-muted-foreground"
                              }`}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {defaultEstData?.defaultEstablishmentId === est.establishmentId
                            ? "Remover acesso direto"
                            : "Entrar direto neste estabelecimento"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {selectingEstId === est.establishmentId && (
                      <Loader2 className="h-4 w-4 animate-spin text-red-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              {/* Feedback message when favorite is set */}
              {favoriteMessage && (
                <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 mt-2 animate-in fade-in duration-300">
                  ⭐ {favoriteMessage}
                </p>
              )}
              {/* Create New Button */}
              {(countData?.count ?? 0) < (countData?.limit ?? 3) && (
                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-base text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-950/50 hover:border-red-300 dark:hover:border-red-700 transition-all"
                    onClick={handleCreateNewEstablishment}
                    disabled={!!selectingEstId}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar novo estabelecimento
                  </button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {countData?.count ?? 0} de {countData?.limit ?? 3} estabelecimentos
                  </p>
                </div>
              )}
            </>
          )}
          </>
          )}
        </>
      ) : (
      <>
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {twoFactorChallenge ? "Verificação em duas etapas" : isCollaboratorMode ? "Acesso Colaborador" : "Acessar sua conta"}
        </h2>
        <p className="text-muted-foreground">
          {twoFactorChallenge
            ? "Digite o código enviado para o e-mail de verificação"
            : isCollaboratorMode
            ? "Entre com as credenciais fornecidas pelo administrador"
            : "Entre com suas credenciais para acessar sua conta"}
        </p>
      </div>

      {/* Google Login Button - only show for non-collaborator mode */}
      {!isCollaboratorMode && !twoFactorChallenge && (
        <>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-14 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground font-medium shadow-sm transition-colors duration-200 text-base flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <GoogleIcon />
            )}
            Entrar com Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">ou entre com email</span>
            </div>
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={twoFactorChallenge ? "space-y-5 lg:space-y-6" : "space-y-5"}>
        {twoFactorChallenge ? (
          <div className="space-y-5 lg:space-y-6">
            {/* Icon + Title */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-1">Código enviado por e-mail</h3>
              <p className="text-sm text-muted-foreground">
                Enviamos um código de 5 dígitos para
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{twoFactorChallenge.verificationEmail}</p>
            </div>

            {/* OTP Input */}
            <div className="py-2">
              <OtpInput
                length={5}
                value={twoFactorCode}
                onChange={(value) => {
                  setTwoFactorCode(value);
                  if (twoFactorCodeError) setTwoFactorCodeError(false);
                }}
                onComplete={(code) => {
                  if (!verifyTwoFactorMutation.isPending) {
                    verifyTwoFactorMutation.mutate({
                      challengeId: twoFactorChallenge.challengeId,
                      code,
                    });
                  }
                }}
                disabled={verifyTwoFactorMutation.isPending}
                error={twoFactorCodeError}
              />
            </div>

            {/* Verify button */}
            {twoFactorCode.length === 5 && !verifyTwoFactorMutation.isPending && (
              <Button
                type="submit"
                className="w-full h-10 lg:h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors duration-200 text-sm lg:text-base"
              >
                Verificar código
              </Button>
            )}

            {verifyTwoFactorMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorChallenge(null);
                  setTwoFactorCode("");
                  setTwoFactorCodeError(false);
                }}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao login
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Email with autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setShowEmailSuggestions(true);
                  }}
                  onFocus={() => setShowEmailSuggestions(true)}
                  autoComplete="off"
                  className="h-14 pl-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
                />
                {/* Email domain suggestions dropdown */}
                {showEmailSuggestions && emailSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    {emailSuggestions.map((suggestion) => {
                      const atIndex = suggestion.indexOf("@");
                      const localPart = suggestion.substring(0, atIndex);
                      const domainPart = suggestion.substring(atIndex);
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setEmail(suggestion);
                            setShowEmailSuggestions(false);
                            // Focar no campo de senha após selecionar
                            setTimeout(() => {
                              document.getElementById("password")?.focus();
                            }, 50);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted/80 transition-colors duration-150 border-b border-border/50 last:border-b-0"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{localPart}<span className="text-red-500">{domainPart}</span></span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Senha
                </Label>
                <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => {
                    const isChecked = checked as boolean;
                    setRememberMe(isChecked);
                    // Se desmarcar, remover dados salvos imediatamente
                    if (!isChecked) {
                      localStorage.removeItem(REMEMBER_KEY);
                      localStorage.removeItem(REMEMBER_PASS_KEY);
                      localStorage.removeItem(REMEMBER_CHECKED_KEY);
                    }
                  }}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Lembrar-me
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setIsCollaboratorMode(!isCollaboratorMode)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Users className="h-3.5 w-3.5" />
                {isCollaboratorMode ? "Voltar ao login normal" : "Entrar como colaborador"}
              </button>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl bg-red-500 hover:bg-red-500 text-white font-semibold transition-colors duration-200 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </>
        )}
      </form>

      {/* Sign up link */}
      {!twoFactorChallenge && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/criar-conta" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Registre-se aqui
            </Link>
          </p>
        </div>
      )}
      </>
      )}
    </AuthLayout>
  );
}
