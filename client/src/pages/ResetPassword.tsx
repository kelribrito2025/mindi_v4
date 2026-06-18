import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Lock, ArrowRight, Loader2, ArrowLeft, CheckCircle, UtensilsCrossed, Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ResetPassword() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Validate token on mount
  const { data: tokenValidation, isLoading: isValidating } = trpc.auth.validateResetToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setResetComplete(true);
      toast.success("Senha redefinida com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao redefinir senha. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Por favor, informe a nova senha.");
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    resetPasswordMutation.mutate({ token, password });
  };

  // Success state
  // Determine if this was a collaborator reset
  const isCollaboratorReset = tokenValidation?.accountType === "collaborator";

  if (resetComplete) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Senha redefinida!</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
            {isCollaboratorReset && (
              <><br /><strong className="text-foreground">Lembre-se:</strong> na tela de login, clique em <strong className="text-primary">&quot;Sou colaborador&quot;</strong> para acessar o sistema.</>)}
          </p>
          <Link href="/login">
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir para o login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // No token provided
  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Link inválido</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Este link de redefinição de senha é inválido. Solicite um novo link.
          </p>
          <Link href="/esqueci-senha">
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
              Solicitar novo link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Validating token
  if (isValidating) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link...</p>
        </div>
      </AuthLayout>
    );
  }

  // Invalid/expired token
  if (tokenValidation && !tokenValidation.valid) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Link expirado</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Este link de redefinição já expirou. Solicite um novo link para redefinir sua senha.
          </p>
          <Link href="/esqueci-senha">
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
              Solicitar novo link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 lg:mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-500 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">Mindi</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Redefinir senha</h2>
        <p className="text-muted-foreground">
          {tokenValidation?.email
            ? <>Crie uma nova senha para <strong className="text-foreground">{tokenValidation.email}</strong></>
            : "Crie uma nova senha para sua conta"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Nova senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 pr-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
            Confirmar nova senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 pl-12 pr-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-sm text-red-500">As senhas não coincidem</p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={resetPasswordMutation.isPending || !password || password !== confirmPassword}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-colors duration-200 text-base"
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Redefinindo...
            </>
          ) : (
            <>
              Redefinir senha
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </AuthLayout>
  );
}
