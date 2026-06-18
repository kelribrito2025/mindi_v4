import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, EmptyState, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  Search,
  UserCheck,
  UserX,
  MoreHorizontal,
  X,
  ShieldCheck,
  Clock,
  MessageSquare,
  Phone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Permission definitions matching the sidebar pages
const PERMISSION_GROUPS = [
  {
    title: "PRINCIPAL",
    permissions: [
      { key: "dashboard", label: "Dashboard" },
      { key: "pdv", label: "Frente de Caixa" },
      { key: "controle-caixa", label: "Controle de Caixa" },
      { key: "mesas", label: "Mapa de Mesas" },
      { key: "cozinha", label: "Cozinha (KDS)" },
    ],
  },
  {
    title: "OPERACIONAL",
    permissions: [
      { key: "pedidos", label: "Pedidos" },
      { key: "clientes", label: "Clientes" },
      { key: "entregadores", label: "Entregadores" },
    ],
  },
  {
    title: "CATÁLOGO",
    permissions: [
      { key: "catalogo", label: "Cardápio" },
      { key: "complementos", label: "Grupos" },
      { key: "sugestoes", label: "Sugestões" },
      { key: "avaliacoes", label: "Avaliações" },
      { key: "estoque", label: "Estoque" },
    ],
  },
  {
    title: "FINANCEIRO",
    permissions: [
      { key: "financas", label: "Finanças" },
      { key: "banking", label: "Vendas e Repasses" },
      { key: "relatorios", label: "Relatórios" },
    ],
  },
  {
    title: "MARKETING",
    permissions: [
      { key: "stories", label: "Stories" },
      { key: "cupons", label: "Cupons" },
      { key: "campanhas", label: "Campanhas" },
      { key: "fidelizacao", label: "Fidelização" },
    ],
  },
  {
    title: "SISTEMA",
    permissions: [
      { key: "bot-whatsapp", label: "Bot WhatsApp" },
      { key: "acessos", label: "Acessos" },
      { key: "configuracoes", label: "Configurações" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

const PERMISSION_LABEL_MAP: Record<string, string> = {};
PERMISSION_GROUPS.forEach((g) => g.permissions.forEach((p) => { PERMISSION_LABEL_MAP[p.key] = p.label; }));

function pluralPermissions(count: number) {
  return count === 1 ? "1 permissão" : `${count} permissões`;
}

// ---- Collaborator Form Sheet ----
function CollaboratorFormSheet({
  open,
  onOpenChange,
  editingCollab,
  establishmentId,
  onSuccess,
  scrollToPermissions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCollab: any | null;
  establishmentId: number | undefined;
  onSuccess: () => void;
  scrollToPermissions?: boolean;
}) {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'error'>('idle');
  const [whatsappName, setWhatsappName] = useState<string | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionsRef = useRef<HTMLDivElement>(null);

  const createMutation = trpc.collaborator.create.useMutation();
  const updateMutation = trpc.collaborator.update.useMutation();
  const checkWhatsAppMutation = trpc.driver.checkWhatsApp.useMutation();

  // Debounced WhatsApp validation
  const checkWhatsApp = useCallback(async (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setWhatsappStatus('idle');
      setWhatsappName(null);
      return;
    }
    setWhatsappStatus('checking');
    try {
      const result = await checkWhatsAppMutation.mutateAsync({ phone: digits });
      if (result.exists) {
        setWhatsappStatus('valid');
        setWhatsappName(result.verifiedName || null);
      } else {
        setWhatsappStatus('invalid');
        setWhatsappName(null);
      }
    } catch {
      setWhatsappStatus('error');
      setWhatsappName(null);
    }
  }, []);

  // Reset form when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editingCollab) {
      setFormName(editingCollab.name || "");
      setFormEmail(editingCollab.email || "");
      setFormPassword("");
      setFormPermissions(editingCollab.permissions || []);
      setFormIsActive(editingCollab.isActive ?? true);
      setFormWhatsapp("");
      setShowPassword(false);
      setWhatsappStatus('idle');
      setWhatsappName(null);
    } else if (isOpen) {
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormPermissions([]);
      setFormIsActive(true);
      setFormWhatsapp("");
      setShowPassword(false);
      setWhatsappStatus('idle');
      setWhatsappName(null);
    }
    onOpenChange(isOpen);
  };

  // Initialize form when sheet opens (use effect to avoid render-phase setState)
  useEffect(() => {
    if (open && editingCollab) {
      setFormName(editingCollab.name || "");
      setFormEmail(editingCollab.email || "");
      setFormPassword("");
      setFormPermissions(editingCollab.permissions || []);
      setFormIsActive(editingCollab.isActive ?? true);
      setFormWhatsapp("");
      setShowPassword(false);
      setWhatsappStatus('idle');
      setWhatsappName(null);
    } else if (open && !editingCollab) {
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormPermissions([]);
      setFormIsActive(true);
      setFormWhatsapp("");
      setShowPassword(false);
      setWhatsappStatus('idle');
      setWhatsappName(null);
    }
  }, [open, editingCollab]);

  // Scroll to permissions when requested
  useEffect(() => {
    if (open && scrollToPermissions && permissionsRef.current) {
      const timer = setTimeout(() => {
        permissionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, scrollToPermissions]);

  function togglePermission(key: string) {
    setFormPermissions((prev) => {
      const isRemoving = prev.includes(key);
      // Mapa de Mesas e Cozinha (KDS) são vinculados: marcar um marca o outro
      const linked: Record<string, string> = { mesas: 'cozinha', cozinha: 'mesas' };
      const partner = linked[key];
      if (isRemoving) {
        // Desmarcando: remove ambos
        let next = prev.filter((p) => p !== key);
        if (partner) next = next.filter((p) => p !== partner);
        return next;
      } else {
        // Marcando: adiciona ambos
        let next = [...prev, key];
        if (partner && !next.includes(partner)) next.push(partner);
        return next;
      }
    });
  }

  function selectAllPermissions() {
    setFormPermissions([...ALL_PERMISSIONS]);
  }

  function clearAllPermissions() {
    setFormPermissions([]);
  }

  const handleWhatsappChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 6) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 2) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 0) {
      masked = `(${digits}`;
    }
    setFormWhatsapp(masked);

    // Reset status when clearing
    if (digits.length < 10) {
      setWhatsappStatus('idle');
      setWhatsappName(null);
    }

    // Debounce: wait 800ms after typing stops
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    if (digits.length >= 10) {
      checkTimeoutRef.current = setTimeout(() => checkWhatsApp(masked), 800);
    }
  };

  async function handleSave() {
    if (!establishmentId) return;

    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }
    if (!editingCollab && formPassword.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (editingCollab && formPassword && formPassword.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (formPermissions.length === 0) {
      toast.error("Selecione pelo menos uma permissão");
      return;
    }

    setSaving(true);
    try {
      if (editingCollab) {
        const updateData: any = {
          id: editingCollab.id,
          name: formName.trim(),
          email: formEmail.trim(),
          permissions: formPermissions,
          isActive: formIsActive,
        };
        if (formPassword) {
          updateData.password = formPassword;
        }
        await updateMutation.mutateAsync(updateData);
        toast.success("Colaborador atualizado com sucesso");
      } else {
        const cleanWhatsapp = formWhatsapp.replace(/\D/g, '');
        const result = await createMutation.mutateAsync({
          establishmentId,
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          permissions: formPermissions,
          whatsapp: cleanWhatsapp.length >= 10 ? cleanWhatsapp : undefined,
        });
        if (result.whatsappSent) {
          toast.success("Acesso criado e enviado via WhatsApp ao colaborador", {
            description: `Dados de acesso enviados para ${formWhatsapp}`,
            duration: 5000,
          });
        } else if (cleanWhatsapp.length >= 10) {
          toast.success("Colaborador cadastrado com sucesso", {
            description: "Não foi possível enviar via WhatsApp. Verifique se o WhatsApp está conectado.",
          });
        } else {
          toast.success("Colaborador cadastrado com sucesso");
        }
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">{editingCollab ? "Editar Colaborador" : "Novo Colaborador"}</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header - gradient style */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingCollab ? "Editar Colaborador" : "Novo Colaborador"}
                </h2>
                <p className="text-sm text-white/80">
                  {editingCollab ? "Atualize os dados e permissões" : "Cadastre um novo colaborador"}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Nome + Email side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="collab-name" className="text-sm font-medium">Nome *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="collab-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.slice(0, 10))}
                    maxLength={10}
                    placeholder="Nome"
                    className="h-10 rounded-xl bg-background border-border/50 pl-9"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="collab-email" className="text-sm font-medium">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="collab-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="h-10 rounded-xl bg-background border-border/50 pl-9"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp (only for new collaborator) */}
            {!editingCollab && (
              <div className="space-y-2">
                <Label htmlFor="collab-whatsapp" className="text-sm font-medium">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="collab-whatsapp"
                    type="tel"
                    value={formWhatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={`h-10 rounded-xl bg-background pl-9 pr-10 ${
                      whatsappStatus === 'valid' ? 'border-green-500 focus-visible:ring-green-500' :
                      whatsappStatus === 'invalid' ? 'border-red-500 focus-visible:ring-red-500' :
                      'border-border/50'
                    }`}
                  />
                  {/* Validation indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {whatsappStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                    {whatsappStatus === 'valid' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {whatsappStatus === 'invalid' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {/* Validation feedback */}
                {whatsappStatus === 'valid' && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Número válido no WhatsApp{whatsappName ? ` — ${whatsappName}` : ''}
                  </p>
                )}
                {whatsappStatus === 'invalid' && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Número não encontrado no WhatsApp
                  </p>
                )}
                {whatsappStatus === 'error' && (
                  <p className="text-xs text-amber-500">
                    Não foi possível verificar. WhatsApp pode não estar conectado.
                  </p>
                )}
                {whatsappStatus === 'checking' && (
                  <p className="text-xs text-muted-foreground">
                    Verificando número no WhatsApp...
                  </p>
                )}
                {whatsappStatus === 'idle' && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                    <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      O colaborador receberá automaticamente os dados de acesso via WhatsApp
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="collab-password" className="text-sm font-medium">
                {editingCollab ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-password"
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingCollab ? "Deixe vazio para manter" : "Mínimo 8 caracteres"}
                  className="h-10 rounded-xl bg-background border-border/50 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Active toggle (only for editing) */}
            {editingCollab && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formIsActive ? "Colaborador pode fazer login" : "Colaborador bloqueado"}
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            )}

            {/* Permissions */}
            <div ref={permissionsRef} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Permissões de Acesso
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-xs text-primary hover:underline"
                  >
                    Selecionar todas
                  </button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={clearAllPermissions}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-3 rounded-xl border bg-muted/20">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                            formPermissions.includes(perm.key)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-card hover:bg-muted border border-transparent"
                          )}
                        >
                          <Checkbox
                            checked={formPermissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {formPermissions.length} de {ALL_PERMISSIONS.length} permissões selecionadas
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl h-11"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              {saving ? "Salvando..." : editingCollab ? "Salvar Alterações" : "Cadastrar Colaborador"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---- Main Page ----
export default function Acessos() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;

  const { data: collaborators, isLoading, refetch } = trpc.collaborator.list.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<any | null>(null);
  const [scrollToPerms, setScrollToPerms] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collabToDelete, setCollabToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const deleteMutation = trpc.collaborator.delete.useMutation();
  const toggleMutation = trpc.collaborator.update.useMutation();

  const filteredCollaborators = useMemo(() => {
    if (!collaborators) return [];
    if (!searchQuery.trim()) return collaborators;
    const q = searchQuery.toLowerCase();
    return collaborators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [collaborators, searchQuery]);

  // Metrics
  const totalCollabs = collaborators?.length ?? 0;
  const activeCollabs = collaborators?.filter((c) => c.isActive).length ?? 0;
  const inactiveCollabs = collaborators?.filter((c) => !c.isActive).length ?? 0;

  const handleNew = () => {
    setEditingCollab(null);
    setScrollToPerms(false);
    setSheetOpen(true);
  };

  const handleEdit = (collab: any, scrollToPermissions = false) => {
    setEditingCollab(collab);
    setScrollToPerms(scrollToPermissions);
    setSheetOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDelete = async () => {
    if (!collabToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: collabToDelete.id });
      toast.success("Colaborador removido");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro ao remover", { description: error.message });
    }
    setDeleteDialogOpen(false);
    setCollabToDelete(null);
  };

  const handleToggleActive = async (collab: any) => {
    try {
      await toggleMutation.mutateAsync({ id: collab.id, isActive: !collab.isActive });
      toast.success(collab.isActive ? "Colaborador desativado" : "Colaborador ativado");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro", { description: error.message });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <PageHeader
        title="Acessos"
        description="Gerencie os acessos dos colaboradores."
        icon={<Users className="h-6 w-6 text-blue-600" />}
        actions={
          <button onClick={handleNew} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500 flex items-center gap-1.5">
            Novo acesso
          </button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <StatCard
          title="Cadastrados"
          value={isLoading ? "..." : totalCollabs}
          icon={Users}
          variant="blue"
          loading={isLoading}
        />
        <StatCard
          title="Ativos"
          value={isLoading ? "..." : activeCollabs}
          icon={UserCheck}
          variant="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Desativados"
          value={isLoading ? "..." : inactiveCollabs}
          icon={UserX}
          variant="gray"
          loading={isLoading}
        />
      </div>

      {/* Search */}
      {collaborators && collaborators.length > 0 && (
        <div className="relative max-w-sm mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Collaborators Table */}
      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : !collaborators || collaborators.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador cadastrado"
            description="Adicione colaboradores e defina quais páginas cada um pode acessar."
          />
        ) : filteredCollaborators.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhum resultado"
            description={`Nenhum colaborador encontrado para "${searchQuery}"`}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Colaborador</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Permissões</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Último acesso</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborators.map((collab) => {
                    const perms = collab.permissions as string[];
                    return (
                      <tr
                        key={collab.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${collab.isActive ? "bg-blue-500" : "bg-gray-400"}`}>
                              {collab.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{collab.name}</p>
                              <p className="text-xs text-muted-foreground">{collab.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleEdit(collab, true)}
                            className="text-sm text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                          >
                            <Shield className="h-3.5 w-3.5" />
                            Ver permissões ({perms.length})
                          </button>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={collab.isActive ? "default" : "secondary"}
                            className={collab.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                          >
                            {collab.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {collab.lastLoginAt ? (
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(collab.lastLoginAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nunca acessou</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(collab)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(collab)}>
                                {collab.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                {collab.isActive ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setCollabToDelete(collab);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {filteredCollaborators.map((collab) => {
                const perms = collab.permissions as string[];
                return (
                  <div key={collab.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${collab.isActive ? "bg-blue-500" : "bg-gray-400"}`}>
                          {collab.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{collab.name}</p>
                          <p className="text-xs text-muted-foreground">{collab.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(collab)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(collab)}>
                            {collab.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {collab.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setCollabToDelete(collab);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={collab.isActive ? "default" : "secondary"}
                        className={collab.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                      >
                        {collab.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <button
                        onClick={() => handleEdit(collab, true)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Shield className="h-3 w-3" />
                        Ver permissões ({perms.length})
                      </button>
                      {collab.lastLoginAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(collab.lastLoginAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Collaborator Form Sheet */}
      <CollaboratorFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingCollab(null);
            setScrollToPerms(false);
          }
        }}
        editingCollab={editingCollab}
        establishmentId={estId}
        onSuccess={handleRefresh}
        scrollToPermissions={scrollToPerms}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setDeleteDialogOpen(false); setCollabToDelete(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Você realmente deseja excluir este colaborador? <strong>{collabToDelete?.name}</strong> perderá o acesso ao painel imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
