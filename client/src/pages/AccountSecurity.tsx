import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, User, Lock, Shield, Eye, EyeOff, Loader2, Save } from "lucide-react";

export default function AccountSecurity() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  // Estados para dados da conta
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    cnpj: "",
    responsibleName: "",
    responsiblePhone: "",
  });
  
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
  
  // Query para obter establishment
  const { data: establishment } = trpc.establishment.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Query para obter dados da conta
  const { data: accountInfo, isLoading: isLoadingAccount } = trpc.establishment.getAccountData.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  
  // Mutations
  const updateAccountMutation = trpc.establishment.updateAccountData.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      await utils.establishment.getAccountData.invalidate();
      await utils.establishment.get.invalidate();
      toast.success("Dados da conta atualizados com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar dados da conta");
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
      toast.success(twoFactorEnabled ? "Verificação em duas etapas desativada" : "Verificação em duas etapas ativada");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar configuração de 2FA");
      // Reverter estado em caso de erro
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
        responsibleName: accountInfo.responsibleName || "",
        responsiblePhone: accountInfo.responsiblePhone || "",
      });
      setTwoFactorEnabled(accountInfo.twoFactorEnabled || false);
      setTwoFactorEmail(accountInfo.twoFactorEmail || accountInfo.userEmail || accountInfo.email || "");
    }
  }, [accountInfo]);
  
  // Handlers
  const handleSaveAccountData = () => {
    if (!establishment?.id) return;
    
    updateAccountMutation.mutate({
      establishmentId: establishment.id,
      name: accountData.name,
      email: accountData.email || null,
      cnpj: accountData.cnpj || null,
      responsibleName: accountData.responsibleName || null,
      responsiblePhone: accountData.responsiblePhone || null,
    });
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
    if (!establishment?.id) return;
    
    setTwoFactorEnabled(enabled);
    toggleTwoFactorMutation.mutate({
      establishmentId: establishment.id,
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Conta e Segurança</h1>
          <p className="text-muted-foreground">
            Gerencie os dados da sua conta e configurações de segurança
          </p>
        </div>
        
        {/* Seção 1 - Dados da Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Conta
            </CardTitle>
            <CardDescription>
              Informações do estabelecimento e do responsável
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grid com duas colunas no desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1 - Dados do Estabelecimento */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados do Estabelecimento
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do estabelecimento</Label>
                    <Input
                      id="name"
                      value={accountData.name}
                      onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                      placeholder="Nome do seu estabelecimento"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={accountData.cnpj}
                      onChange={(e) => setAccountData({ ...accountData, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                </div>
              </div>
              
              {/* Coluna 2 - Dados do Responsável */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Responsável
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleName">Nome do responsável</Label>
                    <Input
                      id="responsibleName"
                      value={accountData.responsibleName}
                      onChange={(e) => setAccountData({ ...accountData, responsibleName: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="responsiblePhone">Celular do responsável</Label>
                    <Input
                      id="responsiblePhone"
                      value={accountData.responsiblePhone}
                      onChange={(e) => setAccountData({ ...accountData, responsiblePhone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botão Salvar */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveAccountData}
                disabled={updateAccountMutation.isPending}
              >
                {updateAccountMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar alterações
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Seção 2 - Segurança */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </h2>
          
          {/* Card - Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                Alterar senha
              </CardTitle>
              <CardDescription>
                Mantenha sua conta segura alterando sua senha periodicamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Digite sua senha atual"
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
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Digite a nova senha (mínimo 8 caracteres)"
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
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 8 caracteres
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirme a nova senha"
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
              
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Salvar nova senha
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Card - Verificação em duas etapas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Verificação em duas etapas
              </CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta usando verificação por e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {twoFactorEnabled ? "Ativado" : "Desativado"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled 
                      ? "Um código será enviado por e-mail ao fazer login"
                      : "Ative para receber um código de verificação por e-mail ao fazer login"
                    }
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggleTwoFactor}
                  disabled={toggleTwoFactorMutation.isPending}
                />
              </div>
              
              {twoFactorEnabled && (
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="twoFactorEmail">E-mail para verificação</Label>
                  <Input
                    id="twoFactorEmail"
                    type="email"
                    value={twoFactorEmail}
                    onChange={(e) => setTwoFactorEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    O código de verificação será enviado para este e-mail
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
