import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UtensilsCrossed } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const searchString = useSearch();

  // Mostrar mensagens de erro do Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const error = params.get("error");
    const emailParam = params.get("email");
    
    if (error === "google_no_account" && emailParam) {
      toast.info("Crie uma conta para continuar com o Google.", { duration: 5000 });
      setEmail(emailParam);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_not_configured: "Login com Google não está configurado. Tente novamente mais tarde.",
        google_denied: "Acesso negado. Você cancelou o registro com Google.",
        google_error: "Erro inesperado. Tente novamente.",
      };
      toast.error(errorMessages[error] || "Erro no registro com Google.");
    }
    
    // Limpar parâmetros da URL
    if (error || emailParam) {
      window.history.replaceState({}, "", "/criar-conta");
    }
  }, [searchString]);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      // Redirecionar para onboarding em vez de login
      setLocation("/onboarding");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!acceptedPrivacy) {
      toast.error("Você precisa aceitar a Política de Privacidade para continuar.");
      return;
    }

    // Usar o email como nome (parte antes do @)
    const name = email.split("@")[0];
    registerMutation.mutate({ name, email, password });
  };

  const handleGoogleRegister = () => {
    if (!acceptedPrivacy) {
      toast.error("Você precisa aceitar a Política de Privacidade para continuar com Google.");
      return;
    }
    // Redirecionar para a rota de autenticação Google em modo registro
    window.location.href = "/api/auth/google?mode=register";
  };

  return (
    <AuthLayout backgroundImage="https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/eysJjMqcdzBIgDRm.jpg">
      {/* Logo - visible on mobile */}
      <div className="flex items-center gap-3 mb-8 lg:mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-500 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">Mindi</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Criar sua conta</h2>
        <p className="text-muted-foreground">Preencha os dados abaixo para começar</p>
      </div>

      {/* Google Register Button */}
      <button
        type="button"
        onClick={handleGoogleRegister}
        className="w-full h-14 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground font-medium shadow-sm transition-colors duration-200 text-base flex items-center justify-center gap-3"
      >
        <GoogleIcon />
        Registrar com Google
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou registre com email</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 pl-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Senha
          </Label>
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
            Confirmar senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 pl-12 pr-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Consentimento LGPD */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptPrivacy"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
          />
          <label htmlFor="acceptPrivacy" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
            Li e aceito a{" "}
            <Link href="/privacidade" className="text-primary hover:underline font-medium">
              Política de Privacidade
            </Link>{" "}
            e consinto com o tratamento dos meus dados pessoais conforme descrito.
          </label>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={registerMutation.isPending || !acceptedPrivacy}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-colors duration-200 text-base mt-2"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            <>
              Criar conta
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Login link */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Fazer login
          </Link>
        </p>
      </div>


    </AuthLayout>
  );
}
