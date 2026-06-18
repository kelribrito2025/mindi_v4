import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Wrench,
  Bug,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ImagePlus,
  X,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

const entryTypeConfig = {
  feature: {
    label: "Novidade",
    icon: Sparkles,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  improvement: {
    label: "Melhoria",
    icon: Wrench,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  fix: {
    label: "Correção",
    icon: Bug,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
} as const;

type EntryType = keyof typeof entryTypeConfig;

export default function AdminChangelog() {
  const utils = trpc.useUtils();
  const [expandedVersionId, setExpandedVersionId] = useState<number | null>(null);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingVersion, setEditingVersion] = useState<{ id: number; version: string; title: string } | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ id: number; type: EntryType; title: string; description: string; imageUrl: string; sortOrder: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "version" | "entry"; id: number; label: string } | null>(null);
  const [targetVersionId, setTargetVersionId] = useState<number | null>(null);

  // Form state
  const [versionForm, setVersionForm] = useState({ version: "", title: "", imageUrl: "" });
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [entryForm, setEntryForm] = useState<{ type: EntryType; title: string; description: string; imageUrl: string; sortOrder: number }>({
    type: "feature",
    title: "",
    description: "",
    imageUrl: "",
    sortOrder: 0,
  });
  const [entryImageUploading, setEntryImageUploading] = useState(false);
  const entryFileInputRef = useRef<HTMLInputElement>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Queries
  const { data: versions, isLoading } = trpc.changelog.listVersions.useQuery();

  // Mutations
  const createVersion = trpc.changelog.createVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão criada com sucesso!");
      utils.changelog.listVersions.invalidate();
      setShowVersionDialog(false);
      resetVersionForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateVersion = trpc.changelog.updateVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão atualizada!");
      utils.changelog.listVersions.invalidate();
      if (expandedVersionId) utils.changelog.getVersion.invalidate({ id: expandedVersionId });
      setShowVersionDialog(false);
      resetVersionForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const togglePublish = trpc.changelog.togglePublish.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPublished ? "Versão publicada!" : "Versão despublicada!");
      utils.changelog.listVersions.invalidate();
      utils.changelog.published.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteVersion = trpc.changelog.deleteVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão excluída!");
      utils.changelog.listVersions.invalidate();
      if (expandedVersionId === deleteTarget?.id) setExpandedVersionId(null);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const createEntry = trpc.changelog.createEntry.useMutation({
    onSuccess: () => {
      toast.success("Entrada adicionada!");
      if (targetVersionId) utils.changelog.getVersion.invalidate({ id: targetVersionId });
      utils.changelog.listVersions.invalidate();
      setShowEntryDialog(false);
      resetEntryForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateEntry = trpc.changelog.updateEntry.useMutation({
    onSuccess: () => {
      toast.success("Entrada atualizada!");
      if (targetVersionId) utils.changelog.getVersion.invalidate({ id: targetVersionId });
      setShowEntryDialog(false);
      resetEntryForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEntry = trpc.changelog.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success("Entrada excluída!");
      if (targetVersionId) utils.changelog.getVersion.invalidate({ id: targetVersionId });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadImage = trpc.upload.image.useMutation();

  const generateEntryImage = trpc.changelog.generateEntryImage.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        setEntryForm((f) => ({ ...f, imageUrl: data.url! }));
        toast.success("Imagem gerada com sucesso!");
      } else {
        toast.error("Não foi possível gerar a imagem");
      }
      setAiGenerating(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao gerar imagem");
      setAiGenerating(false);
    },
  });

  function handleGenerateAiImage() {
    if (!entryForm.title.trim()) {
      toast.error("Preencha o título antes de gerar a imagem");
      return;
    }
    setAiGenerating(true);
    generateEntryImage.mutate({
      title: entryForm.title,
      description: entryForm.description || undefined,
      type: entryForm.type,
    });
  }

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setImageUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({
        base64,
        mimeType: file.type,
        folder: "changelog",
        singleVersion: true,
      });
      setVersionForm((f) => ({ ...f, imageUrl: result.url }));
      toast.success("Imagem carregada!");
    } catch (err) {
      toast.error("Erro ao carregar imagem");
    } finally {
      setImageUploading(false);
    }
  }

  function resetVersionForm() {
    setVersionForm({ version: "", title: "", imageUrl: "" });
    setEditingVersion(null);
  }

  function resetEntryForm() {
    setEntryForm({ type: "feature", title: "", description: "", imageUrl: "", sortOrder: 0 });
    setEditingEntry(null);
    setTargetVersionId(null);
  }

  function openCreateVersion() {
    resetVersionForm();
    setShowVersionDialog(true);
  }

  function openEditVersion(v: { id: number; version: string; title: string; imageUrl?: string | null }) {
    setEditingVersion(v);
    setVersionForm({ version: v.version, title: v.title, imageUrl: v.imageUrl || "" });
    setShowVersionDialog(true);
  }

  function openCreateEntry(versionId: number) {
    resetEntryForm();
    setTargetVersionId(versionId);
    setShowEntryDialog(true);
  }

  function openEditEntry(versionId: number, entry: { id: number; type: string; title: string; description: string | null; imageUrl?: string | null; sortOrder: number }) {
    setTargetVersionId(versionId);
    setEditingEntry({
      id: entry.id,
      type: entry.type as EntryType,
      title: entry.title,
      description: entry.description || "",
      imageUrl: entry.imageUrl || "",
      sortOrder: entry.sortOrder,
    });
    setEntryForm({
      type: entry.type as EntryType,
      title: entry.title,
      description: entry.description || "",
      imageUrl: entry.imageUrl || "",
      sortOrder: entry.sortOrder,
    });
    setShowEntryDialog(true);
  }

  async function handleEntryImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setEntryImageUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({
        base64,
        mimeType: file.type,
        folder: "changelog",
        singleVersion: true,
      });
      setEntryForm((f) => ({ ...f, imageUrl: result.url }));
      toast.success("Imagem carregada!");
    } catch (err) {
      toast.error("Erro ao carregar imagem");
    } finally {
      setEntryImageUploading(false);
    }
  }

  function handleSaveVersion() {
    if (!versionForm.version.trim() || !versionForm.title.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    const payload = {
      version: versionForm.version,
      title: versionForm.title,
      imageUrl: versionForm.imageUrl || null,
    };
    if (editingVersion) {
      updateVersion.mutate({ id: editingVersion.id, ...payload });
    } else {
      createVersion.mutate(payload);
    }
  }

  function handleSaveEntry() {
    if (!entryForm.title.trim()) {
      toast.error("Preencha o título da entrada");
      return;
    }
    const payload = {
      ...entryForm,
      imageUrl: entryForm.imageUrl || null,
    };
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, ...payload });
    } else if (targetVersionId) {
      createEntry.mutate({ versionId: targetVersionId, ...payload });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "version") {
      deleteVersion.mutate({ id: deleteTarget.id });
    } else {
      deleteEntry.mutate({ id: deleteTarget.id });
    }
  }

  return (
    <AdminPanelLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Changelog</h1>
              <p className="text-sm text-gray-500">Gerencie as novidades da plataforma</p>
            </div>
          </div>
          <Button onClick={openCreateVersion} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Versão
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!versions || versions.length === 0) && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Nenhuma versão criada</h3>
            <p className="text-sm text-gray-500 mb-6">Crie a primeira versão para publicar novidades da plataforma.</p>
            <Button onClick={openCreateVersion} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar primeira versão
            </Button>
          </div>
        )}

        {/* Versions list */}
        <div className="space-y-3">
          {versions?.map((v) => (
            <VersionCard
              key={v.id}
              version={v}
              isExpanded={expandedVersionId === v.id}
              onToggleExpand={() => setExpandedVersionId(expandedVersionId === v.id ? null : v.id)}
              onEdit={() => openEditVersion(v)}
              onDelete={() => setDeleteTarget({ type: "version", id: v.id, label: `v${v.version}` })}
              onTogglePublish={() => togglePublish.mutate({ id: v.id })}
              isPublishing={togglePublish.isPending}
              onAddEntry={() => openCreateEntry(v.id)}
              onEditEntry={(entry) => openEditEntry(v.id, entry)}
              onDeleteEntry={(entry) => {
                setTargetVersionId(v.id);
                setDeleteTarget({ type: "entry", id: entry.id, label: entry.title });
              }}
            />
          ))}
        </div>
      </div>

      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVersion ? "Editar Versão" : "Nova Versão"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Número da versão</label>
              <Input
                placeholder="Ex: 2.6.0"
                value={versionForm.version}
                onChange={(e) => setVersionForm((f) => ({ ...f, version: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Título</label>
              <Input
                placeholder="Ex: Melhorias no cardápio e correções"
                value={versionForm.title}
                onChange={(e) => setVersionForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Imagem (opcional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              {versionForm.imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={versionForm.imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setVersionForm((f) => ({ ...f, imageUrl: "" }))}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-full h-32 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {imageUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Clique para adicionar uma imagem</span>
                      <span className="text-[10px] text-gray-400">PNG, JPG ou WebP (máx. 5MB)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveVersion}
              disabled={createVersion.isPending || updateVersion.isPending}
            >
              {(createVersion.isPending || updateVersion.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingVersion ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
              <Select
                value={entryForm.type}
                onValueChange={(val) => setEntryForm((f) => ({ ...f, type: val as EntryType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(entryTypeConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Título</label>
              <Input
                placeholder="Ex: Novo sistema de fechamentos programados"
                value={entryForm.title}
                onChange={(e) => setEntryForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Descrição (opcional)</label>
              <div className="flex items-center gap-1 mb-1.5 p-1 bg-gray-50 rounded-md border border-gray-200">
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-700 font-bold text-sm"
                  title="Negrito (selecione o texto primeiro)"
                  onClick={() => {
                    const textarea = descriptionRef.current;
                    if (!textarea) return;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = entryForm.description;
                    if (start !== end) {
                      const selected = text.slice(start, end);
                      const isBold = selected.startsWith('**') && selected.endsWith('**');
                      const newText = isBold
                        ? text.slice(0, start) + selected.slice(2, -2) + text.slice(end)
                        : text.slice(0, start) + '**' + selected + '**' + text.slice(end);
                      setEntryForm((f) => ({ ...f, description: newText }));
                    } else {
                      const newText = text.slice(0, start) + '**texto**' + text.slice(end);
                      setEntryForm((f) => ({ ...f, description: newText }));
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + 2, start + 7);
                      }, 0);
                    }
                  }}
                >
                  B
                </button>
                <span className="text-[10px] text-gray-400 ml-1">Selecione o texto e clique em B para negrito</span>
              </div>
              <Textarea
                ref={descriptionRef}
                placeholder="Descreva brevemente a mudança..."
                value={entryForm.description}
                onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Imagem ilustrativa (opcional)</label>
              <input
                ref={entryFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleEntryImageUpload(file);
                  e.target.value = "";
                }}
              />
              {entryForm.imageUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={entryForm.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEntryForm((f) => ({ ...f, imageUrl: "" }))}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAiImage}
                      disabled={aiGenerating || !entryForm.title.trim()}
                      className="gap-1.5 text-xs"
                    >
                      {aiGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {aiGenerating ? "Gerando..." : "Gerar outra"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => entryFileInputRef.current?.click()}
                      disabled={entryImageUploading}
                      className="gap-1.5 text-xs"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Enviar do computador
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {aiGenerating ? (
                    <div className="w-full h-32 rounded-lg border-2 border-dashed border-red-200 bg-red-50/50 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                      <span className="text-xs text-red-500 font-medium">Gerando imagem com IA...</span>
                      <span className="text-[10px] text-red-400">Isso pode levar alguns segundos</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateAiImage}
                        disabled={!entryForm.title.trim()}
                        className="flex-1 h-24 rounded-lg border-2 border-dashed border-red-200 hover:border-red-400 hover:bg-red-50/50 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Wand2 className="h-5 w-5 text-red-500" />
                        <span className="text-xs font-medium text-red-500">Gerar com IA</span>
                        <span className="text-[10px] text-red-400">Estilo padrão Mindi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => entryFileInputRef.current?.click()}
                        disabled={entryImageUploading}
                        className="flex-1 h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {entryImageUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <ImagePlus className="h-5 w-5 text-gray-400" />
                            <span className="text-xs text-gray-500">Enviar imagem</span>
                            <span className="text-[10px] text-gray-400">PNG, JPG, WebP</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ordem</label>
              <Input
                type="number"
                min={0}
                value={entryForm.sortOrder}
                onChange={(e) => setEntryForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-24"
              />
              <p className="text-xs text-gray-400 mt-1">Menor número aparece primeiro</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveEntry}
              disabled={createEntry.isPending || updateEntry.isPending}
            >
              {(createEntry.isPending || updateEntry.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingEntry ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "version"
                ? `Tem certeza que deseja excluir a versão ${deleteTarget.label}? Todas as entradas associadas também serão excluídas.`
                : `Tem certeza que deseja excluir a entrada "${deleteTarget?.label}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-500"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPanelLayout>
  );
}

// ===== VersionCard Component =====

interface VersionCardProps {
  version: {
    id: number;
    version: string;
    title: string;
    imageUrl?: string | null;
    isPublished: boolean;
    publishedAt: Date | null;
    createdAt: Date;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  isPublishing: boolean;
  onAddEntry: () => void;
  onEditEntry: (entry: any) => void;
  onDeleteEntry: (entry: any) => void;
}

function VersionCard({
  version: v,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onTogglePublish,
  isPublishing,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: VersionCardProps) {
  const { data: versionDetail, isLoading } = trpc.changelog.getVersion.useQuery(
    { id: v.id },
    { enabled: isExpanded }
  );

  const entries = versionDetail?.entries || [];

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm overflow-hidden transition-all",
      v.isPublished ? "border-emerald-200" : "border-gray-200"
    )}>
      {/* Version Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-gray-900">v{v.version}</span>
            {v.isPublished ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0">
                Publicada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200 px-1.5 py-0">
                Rascunho
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{v.title}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2.5 text-xs gap-1.5",
              v.isPublished
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            )}
            onClick={onTogglePublish}
            disabled={isPublishing}
          >
            {v.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {v.isPublished ? "Despublicar" : "Publicar"}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {/* Info row */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">
                  Criada em {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                  {v.publishedAt && ` · Publicada em ${new Date(v.publishedAt).toLocaleDateString("pt-BR")}`}
                </p>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onAddEntry}>
                  <Plus className="h-3 w-3" />
                  Adicionar entrada
                </Button>
              </div>

              {/* Imagem da versão */}
              {v.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={v.imageUrl}
                    alt={`Imagem da versão ${v.version}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Entries */}
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Nenhuma entrada adicionada</p>
                  <p className="text-xs mt-1">Adicione novidades, melhorias ou correções</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {entries.map((entry: any) => {
                    const cfg = entryTypeConfig[entry.type as EntryType] || entryTypeConfig.feature;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border bg-white group",
                          cfg.border
                        )}
                      >
                        <div className={cn("shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center", cfg.bg)}>
                          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", cfg.badgeClass)}>
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{entry.title}</p>
                          {entry.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-gray-600"
                            onClick={() => onEditEntry(entry)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => onDeleteEntry(entry)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
