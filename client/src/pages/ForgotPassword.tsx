import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { theme } = useTheme();
  const forgotPasswordLogoSrc = theme === "dark" ? "/assets/mindi-login-logo-dark.png" : "/assets/mindi-login-logo-light.png";

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setEmailSent(true);
      toast.success("Email de recuperação enviado!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao enviar email. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor, informe seu email.");
      return;
    }

    forgotPasswordMutation.mutate({ email });
  };

  if (emailSent) {
    return (
      <AuthLayout>
        {/* Success state */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Email enviado!</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>. 
            Verifique sua caixa de entrada e siga as instruções.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="w-full h-12 rounded-xl border-border"
            >
              Tentar outro email
            </Button>
            <Link href="/login">
              <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Logo */}
      <div className="flex items-center mb-8 lg:mb-6">
        <img
          src={forgotPasswordLogoSrc}
          alt="Mindi"
          className="h-[28.9189px] max-w-[calc(100%-3rem)] w-auto object-contain"
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Esqueceu a senha?</h2>
        <p className="text-muted-foreground">Informe seu email para recuperar o acesso à sua conta</p>
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

        {/* Submit button */}
        <Button
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-colors duration-200 text-base"
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar link de recuperação
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
