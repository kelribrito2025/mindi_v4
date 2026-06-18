import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { toast } from "sonner";
import { Building2, User, Lock, Shield, Eye, EyeOff, Loader2, Mail, Phone, FileText, KeyRound, Check, Link2, Unlink, Pencil } from "lucide-react";

interface AccountSecuritySectionProps {
  establishmentId: number;
}

export function AccountSecuritySection({ establishmentId }: AccountSecuritySectionProps) {
  // Utils do tRPC para invalidar cache
  const utils = trpc.useUtils();
  
  // Estados para dados da conta
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    cnpj: "",
    responsibleName: "",
    responsiblePhone: "",
  });
  
  // Estado para edição do email
  const [emailEditing, setEmailEditing] = useState(false);
  
  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  
  // Estado para indicador visual de campos salvos e em salvamento
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const savedTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Refs para debounce
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const twoFactorEmailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Query para obter dados da conta
  const { data: accountInfo, isLoading: isLoadingAccount } = trpc.establishment.getAccountData.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );
  
  // Função para marcar campos como salvos com indicador visual temporário
  const markFieldsSaved = useCallback((fields: string[]) => {
    setSavedFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.add(f));
      return next;
    });
    fields.forEach(field => {
      if (savedTimersRef.current[field]) clearTimeout(savedTimersRef.current[field]);
      savedTimersRef.current[field] = setTimeout(() => {
        setSavedFields(prev => {
          const next = new Set(prev);
          next.delete(field);
          return next;
        });
      }, 2000);
    });
  }, []);
  
  // Funções para marcar campos como "salvando" (spinner)
  const markFieldsSaving = useCallback((fields: string[]) => {
    setSavingFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.add(f));
      return next;
    });
  }, []);

  const clearFieldsSaving = useCallback((fields: string[]) => {
    setSavingFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.delete(f));
      return next;
    });
  }, []);

  // Componente inline de indicador "Salvando..." / "Salvo"
  const SavedCheck = ({ field }: { field: string }) => {
    if (savingFields.has(field)) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium ml-2 animate-in fade-in duration-200">
          <Loader2 className="h-3 w-3 animate-spin" />
          Salvando
        </span>
      );
    }
    if (!savedFields.has(field)) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-2 animate-in fade-in duration-300">
        <Check className="h-3 w-3" />
        Salvo
      </span>
    );
  };
  
  // Mutations
  const updateAccountMutation = trpc.establishment.updateAccountData.useMutation({
    onSuccess: async (_data, variables) => {
      // Determinar quais campos foram salvos com base nas variáveis
      const fields: string[] = [];
      if (variables.name !== undefined) fields.push("name");
      if ((variables as any).email !== undefined) fields.push("email");
      if (variables.cnpj !== undefined) fields.push("cnpj");
      if (variables.responsibleName !== undefined) fields.push("responsibleName");
      if (variables.responsiblePhone !== undefined) fields.push("responsiblePhone");
      if (fields.length === 0) fields.push("account");
      clearFieldsSaving(fields);
      markFieldsSaved(fields);
      
      // Removido toast.success para auto-save — o indicador visual inline (SavedCheck) já fornece feedback suficiente
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      await utils.establishment.getAccountData.invalidate();
      await utils.establishment.get.invalidate();
    },
    onError: (error) => {
      // Limpar spinner em caso de erro
      setSavingFields(new Set());
      // Simplificar mensagens de validação de email para evitar exibir regex técnico
      const msg = error.message || "Erro ao atualizar dados da conta";
      if (msg.includes("email") || msg.includes("Email") || msg.includes("invalid_format") || msg.includes("invalid_string")) {
        toast.error("Digite um email válido");
      } else {
        toast.error(msg);
      }
    },
  });
  
  const changePasswordMutation = trpc.establishment.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });
  
  const toggleTwoFactorMutation = trpc.establishment.toggleTwoFactor.useMutation({
    onSuccess: () => {
      clearFieldsSaving(["twoFactor", "twoFactorEmail"]);
      toast.success(twoFactorEnabled ? "Verificação em duas etapas ativada" : "Verificação em duas etapas desativada");
      markFieldsSaved(["twoFactor"]);
    },
    onError: (error) => {
      clearFieldsSaving(["twoFactor", "twoFactorEmail"]);
      toast.error(error.message || "Erro ao alterar configuração de 2FA");
      setTwoFactorEnabled(!twoFactorEnabled);
    },
  });
  
  // Carregar dados quando accountInfo estiver disponível
  useEffect(() => {
    if (accountInfo) {
      setAccountData({
        name: accountInfo.name || "",
        email: accountInfo.userEmail || accountInfo.email || "",
        cnpj: accountInfo.cnpj || "",
        responsibleName: accountInfo.responsibleName || accountInfo.userName || "",
        responsiblePhone: accountInfo.responsiblePhone || "",
      });
      setTwoFactorEnabled(accountInfo.twoFactorEnabled || false);
      setTwoFactorEmail(accountInfo.twoFactorEmail || accountInfo.userEmail || accountInfo.email || "");
    }
  }, [accountInfo]);
  
  // Cleanup dos timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach(t => clearTimeout(t));
      Object.values(savedTimersRef.current).forEach(t => clearTimeout(t));
      if (twoFactorEmailDebounceRef.current) clearTimeout(twoFactorEmailDebounceRef.current);
    };
  }, []);
  
  // Auto-save com debounce para campos da conta
  const autoSaveAccountField = useCallback((field: string, value: string) => {
    if (!establishmentId) return;
    
    // Não salvar name vazio (validação min 1 no servidor)
    if (field === "name" && !value.trim()) return;
    
    if (debounceTimersRef.current[field]) {
      clearTimeout(debounceTimersRef.current[field]);
    }
    
    // Mostrar spinner imediatamente ao começar a digitar
    markFieldsSaving([field]);
    
    debounceTimersRef.current[field] = setTimeout(() => {
      // Enviar apenas o campo alterado para evitar sobrescrever outros campos
      const payload: Record<string, unknown> = { establishmentId };
      if (field === "name") {
        payload.name = value;
      } else if (field === "email") {
        payload.email = value || null;
      } else if (field === "cnpj") {
        payload.cnpj = value || null;
      } else if (field === "responsibleName") {
        payload.responsibleName = value || null;
      } else if (field === "responsiblePhone") {
        payload.responsiblePhone = value || null;
      }
      updateAccountMutation.mutate(payload as any);
    }, 800);
  }, [establishmentId, updateAccountMutation]);
  
  // Auto-save para email de 2FA
  const autoSaveTwoFactorEmail = useCallback((email: string) => {
    if (!establishmentId) return;
    
    if (twoFactorEmailDebounceRef.current) {
      clearTimeout(twoFactorEmailDebounceRef.current);
    }
    
    // Mostrar spinner imediatamente
    markFieldsSaving(["twoFactorEmail"]);
    
    twoFactorEmailDebounceRef.current = setTimeout(() => {
      toggleTwoFactorMutation.mutate({
        establishmentId,
        enabled: twoFactorEnabled,
        email: email || undefined,
      });
    }, 800);
  }, [establishmentId, twoFactorEnabled, toggleTwoFactorMutation]);
  
  // Handlers com auto-save
  const handleAccountFieldChange = (field: keyof typeof accountData, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
    autoSaveAccountField(field, value);
  };
  
  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Nova senha e confirmação não coincidem");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error("Nova senha deve ter pelo menos 8 caracteres");
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    });
  };
  
  const handleToggleTwoFactor = (enabled: boolean) => {
    if (!establishmentId) return;
    
    setTwoFactorEnabled(enabled);
    markFieldsSaving(["twoFactor"]);
    toggleTwoFactorMutation.mutate({
      establishmentId,
      enabled,
      email: twoFactorEmail || undefined,
    });
  };
  
  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };
  
  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      }
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };
  
  if (isLoadingAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Coluna esquerda - 40% - Dados da Conta */}
      <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5 self-start">
        {/* Dados do Estabelecimento */}
        <SectionCard
          title="Dados do Estabelecimento"
          description="Informações do seu negócio"
          icon={<Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-500/15"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do estabelecimento
                <SavedCheck field="name" />
              </Label>
              <Input
                id="name"
                value={accountData.name}
                onChange={(e) => handleAccountFieldChange("name", e.target.value)}
                placeholder="Nome do seu estabelecimento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-sm font-medium">
                CNPJ
                <SavedCheck field="cnpj" />
              </Label>
              <Input
                id="cnpj"
                value={accountData.cnpj}
                onChange={(e) => handleAccountFieldChange("cnpj", formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail da conta
                <SavedCheck field="email" />
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="email"
                  type="email"
                  value={accountData.email}
                  onChange={(e) => {
                    if (emailEditing) {
                      handleAccountFieldChange("email", e.target.value);
                    }
                  }}
                  readOnly={!emailEditing}
                  disabled={!emailEditing}
                  className={!emailEditing ? "pr-16 bg-muted cursor-not-allowed" : "pr-16"}
                  placeholder="email@exemplo.com"
                />
                <button
                  type="button"
                  onClick={() => setEmailEditing(!emailEditing)}
                  className="absolute right-2 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {emailEditing ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-600" /> <span className="text-emerald-600">OK</span></>
                  ) : (
                    <><Pencil className="h-3.5 w-3.5" /> Editar</>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {emailEditing ? "Digite o novo e-mail da conta" : "E-mail cadastrado na plataforma"}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Dados do Responsável */}
        <SectionCard
          title="Dados do Responsável"
          description="Informações de contato do responsável"
          icon={<User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleName" className="text-sm font-medium">
                Nome do responsável
                <SavedCheck field="responsibleName" />
              </Label>
              <Input
                id="responsibleName"
                value={accountData.responsibleName}
                onChange={(e) => handleAccountFieldChange("responsibleName", e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsiblePhone" className="text-sm font-medium">
                Celular do responsável
                <SavedCheck field="responsiblePhone" />
              </Label>
              <Input
                id="responsiblePhone"
                value={accountData.responsiblePhone}
                onChange={(e) => handleAccountFieldChange("responsiblePhone", formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Coluna direita - 60% - Segurança */}
      <div className="w-full lg:flex-1 space-y-5">
        {/* Alterar Senha */}
        <SectionCard
          title="Alterar Senha"
          description="Mantenha sua conta segura alterando periodicamente"
          icon={<Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-500/15"
        >
          <div className="space-y-4">
            {/* Senha atual */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Senha atual"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Nova senha e confirmação lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirme a nova senha"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              A senha deve ter pelo menos 8 caracteres
            </p>
            
            <Button 
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="rounded-xl"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Salvar nova senha
            </Button>
          </div>
        </SectionCard>
        
        {/* Verificação em duas etapas */}
        <SectionCard
          title="Verificação em Duas Etapas"
          description="Adicione uma camada extra de segurança"
          icon={<Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-100 dark:bg-purple-500/15"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${twoFactorEnabled ? 'bg-green-100 dark:bg-green-500/15' : 'bg-muted'}`}>
                  <Shield className={`h-4 w-4 ${twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {twoFactorEnabled ? "Ativado" : "Desativado"}
                    <SavedCheck field="twoFactor" />
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled 
                      ? "Código enviado por e-mail ao fazer login"
                      : "Ative para receber código de verificação"
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleToggleTwoFactor}
                disabled={toggleTwoFactorMutation.isPending}
              />
            </div>
            
            {twoFactorEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="twoFactorEmail" className="text-sm font-medium">
                  E-mail para verificação
                  <SavedCheck field="twoFactorEmail" />
                </Label>
                <Input
                  id="twoFactorEmail"
                  type="email"
                  value={twoFactorEmail}
                  onChange={(e) => {
                    setTwoFactorEmail(e.target.value);
                    autoSaveTwoFactorEmail(e.target.value);
                  }}
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">
                  O código de verificação será enviado para este e-mail
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Contas Conectadas */}
        <GoogleConnectedSection />
      </div>
    </div>
  );
}

// ============ GOOGLE CONNECTED SECTION ============
function GoogleConnectedSection() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { data: googleStatus, isLoading } = trpc.auth.googleStatus.useQuery(undefined, {
    enabled: !!user,
  });

  const unlinkMutation = trpc.auth.unlinkGoogle.useMutation({
    onSuccess: () => {
      toast.success("Conta Google desvinculada com sucesso!");
      utils.auth.googleStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desvincular conta Google");
    },
  });

  const handleLinkGoogle = () => {
    // Redirecionar para o fluxo OAuth com mode=link
    window.location.href = "/api/auth/google?mode=link";
  };

  const handleUnlinkGoogle = () => {
    if (!googleStatus?.hasPassword) {
      toast.error("Você precisa criar uma senha antes de desvincular o Google, pois ficaria sem forma de login.");
      return;
    }
    unlinkMutation.mutate();
  };

  // Mostrar toast de sucesso se veio do redirect de link
  const [shownLinkToast, setShownLinkToast] = useState(false);
  useEffect(() => {
    if (shownLinkToast) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_linked") === "1") {
      toast.success("Conta Google vinculada com sucesso!");
      setShownLinkToast(true);
      // Limpar query param
      const url = new URL(window.location.href);
      url.searchParams.delete("google_linked");
      window.history.replaceState({}, "", url.toString());
      utils.auth.googleStatus.invalidate();
    }
    const error = params.get("error");
    if (error === "google_already_linked") {
      toast.error("Esta conta Google já está vinculada a outra conta.");
      setShownLinkToast(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    } else if (error === "google_link_no_session") {
      toast.error("Sessão expirada. Faça login novamente e tente vincular.");
      setShownLinkToast(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [shownLinkToast, utils]);

  if (isLoading) {
    return (
      <SectionCard
        title="Contas Conectadas"
        description="Vincule serviços externos para login rápido"
        icon={<Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        iconBg="bg-blue-100 dark:bg-blue-500/15"
      >
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Contas Conectadas"
      description="Vincule serviços externos para login rápido"
      icon={<Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-500/15"
    >
      <div className="space-y-3">
        {/* Google */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-3">
            {/* Google icon */}
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-white dark:bg-white/10 border border-border/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Google</p>
              {googleStatus?.linked ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Conectado
                  </span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Não conectado</p>
              )}
            </div>
          </div>
          <div>
            {googleStatus?.linked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={unlinkMutation.isPending}
                className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                {unlinkMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5 mr-1.5" />
                )}
                Desconectar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGoogle}
                className="rounded-lg"
              >
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Conectar
              </Button>
            )}
          </div>
        </div>

        {/* Aviso se não tem senha */}
        {googleStatus?.linked && !googleStatus?.hasPassword && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
            Você entrou com o Google e ainda não tem senha cadastrada. Crie uma senha na seção acima antes de desconectar o Google.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
