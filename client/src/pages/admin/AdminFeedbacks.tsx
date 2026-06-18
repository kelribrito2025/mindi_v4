import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Clock,
  CheckCircle2,
  Loader2,
  Eye,
  ChevronDown,
  Filter,
  Search,
  X,
  ThumbsUp,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeConfig = {
  bug: { label: "Problema", icon: Bug, color: "text-red-500", bg: "bg-red-100", border: "border-red-200" },
  suggestion: { label: "Sugestão", icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" },
  praise: { label: "Elogio", icon: ThumbsUp, color: "text-green-600", bg: "bg-green-100", border: "border-green-200" },
} as const;

const statusConfig = {
  new: { label: "Novo", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
  read: { label: "Lido", color: "bg-gray-400", textColor: "text-gray-700", bgLight: "bg-gray-50" },
  in_progress: { label: "Em andamento", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50" },
  resolved: { label: "Resolvido", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50" },
  closed: { label: "Fechado", color: "bg-gray-600", textColor: "text-gray-700", bgLight: "bg-gray-50" },
} as const;

type StatusType = keyof typeof statusConfig;
type FeedbackType = keyof typeof typeConfig;

export default function AdminFeedbacks() {
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: feedbacksList, isLoading, refetch } = trpc.feedback.listAll.useQuery();
  const { data: stats } = trpc.feedback.stats.useQuery();

  const updateStatusMutation = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status", { description: error.message });
    },
  });

  const handleStatusChange = (id: number, status: StatusType, notes?: string) => {
    updateStatusMutation.mutate({ id, status, adminNotes: notes });
  };

  const filteredFeedbacks = (feedbacksList || []).filter((item: any) => {
    const fb = item.feedback;
    if (filterType !== "all" && fb.type !== filterType) return false;
    if (filterStatus !== "all" && fb.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSubject = fb.subject?.toLowerCase().includes(q);
      const matchMessage = fb.message?.toLowerCase().includes(q);
      const matchUser = item.userName?.toLowerCase().includes(q) || item.userEmail?.toLowerCase().includes(q);
      const matchEstab = item.establishmentName?.toLowerCase().includes(q);
      if (!matchSubject && !matchMessage && !matchUser && !matchEstab) return false;
    }
    return true;
  });

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Feedbacks
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os feedbacks enviados pelos utilizadores da plataforma.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold mt-1">{stats?.total ?? 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
            <div className="text-sm text-blue-600">Novos</div>
            <div className="text-2xl font-bold mt-1 text-blue-700">{stats?.new ?? 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
            <div className="text-sm text-amber-600">Em andamento</div>
            <div className="text-2xl font-bold mt-1 text-amber-700">{stats?.inProgress ?? 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
            <div className="text-sm text-emerald-600">Resolvidos</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{stats?.resolved ?? 0}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por assunto, mensagem, utilizador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="suggestion">Sugestão</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="read">Lido</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feedbacks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum feedback encontrado</p>
            <p className="text-sm mt-1">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca."
                : "Os feedbacks dos utilizadores aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeedbacks.map((item: any) => {
              const fb = item.feedback;
              const tc = typeConfig[fb.type as FeedbackType] || typeConfig.bug;
              const sc = statusConfig[fb.status as StatusType] || statusConfig.new;
              const TypeIcon = tc.icon;

              return (
                <div
                  key={fb.id}
                  className={cn(
                    "bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                    fb.status === "new" && "border-l-4 border-l-blue-500"
                  )}
                  onClick={() => {
                    setSelectedFeedback(item);
                    setAdminNotes(fb.adminNotes || "");
                    // Marcar como lido se for novo
                    if (fb.status === "new") {
                      handleStatusChange(fb.id, "read");
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn("p-2 rounded-lg flex-shrink-0", tc.bg)}>
                        <TypeIcon className={cn("h-4 w-4", tc.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm truncate">{fb.subject}</h3>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tc.border, tc.color)}>
                            {tc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{fb.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{item.userName || item.userEmail || "Anónimo"}</span>
                          {item.establishmentName && (
                            <>
                              <span>·</span>
                              <span>{item.establishmentName}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{new Date(fb.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn("text-[10px]", sc.bgLight, sc.textColor)} variant="outline">
                        {sc.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleStatusChange(fb.id, "read")}>
                            <Eye className="h-4 w-4 mr-2" /> Marcar como Lido
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(fb.id, "in_progress")}>
                            <Clock className="h-4 w-4 mr-2" /> Em andamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(fb.id, "resolved")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Resolvido
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(fb.id, "closed")}>
                            <X className="h-4 w-4 mr-2" /> Fechar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedFeedback && (() => {
              const fb = selectedFeedback.feedback;
              const tc = typeConfig[fb.type as FeedbackType] || typeConfig.bug;
              const sc = statusConfig[fb.status as StatusType] || statusConfig.new;
              const TypeIcon = tc.icon;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <TypeIcon className={cn("h-5 w-5", tc.color)} />
                      {fb.subject}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-2">
                    {/* Meta info */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={cn(tc.border, tc.color)}>{tc.label}</Badge>
                      <Badge className={cn(sc.bgLight, sc.textColor)} variant="outline">{sc.label}</Badge>
                      {fb.page && (
                        <Badge variant="outline" className="text-xs">
                          Página: {fb.page}
                        </Badge>
                      )}
                    </div>

                    {/* User info */}
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Enviado por:</span>
                        <span className="font-medium">{selectedFeedback.userName || "Anónimo"}</span>
                      </div>
                      {selectedFeedback.userEmail && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{selectedFeedback.userEmail}</span>
                        </div>
                      )}
                      {selectedFeedback.establishmentName && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-muted-foreground">Estabelecimento:</span>
                          <span>{selectedFeedback.establishmentName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground">Data:</span>
                        <span>{new Date(fb.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Mensagem</h4>
                      <div className="bg-white border rounded-lg p-4 text-sm whitespace-pre-wrap">
                        {fb.message}
                      </div>
                    </div>

                    {/* Fotos */}
                    {fb.screenshotUrl && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Fotos anexadas</h4>
                        <div className="flex flex-wrap gap-2">
                          {fb.screenshotUrl.split(",").filter(Boolean).map((url: string, idx: number) => {
                            const trimmedUrl = url.trim();
                            // F13: Bloquear protocolos perigosos (javascript:, data:) para prevenir XSS
                            const isSafeUrl = /^https?:\/\//i.test(trimmedUrl);
                            if (!isSafeUrl) return null;
                            return (
                              <a key={idx} href={trimmedUrl} target="_blank" rel="noopener noreferrer">
                                <img loading="lazy" src={trimmedUrl} alt={`Foto ${idx + 1}`} className="rounded-lg border max-h-32 object-contain hover:opacity-80 transition-opacity cursor-pointer" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notas do Admin</h4>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value.slice(0, 1000))}
                        placeholder="Adicione notas internas sobre este feedback..."
                        rows={3}
                        maxLength={1000}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">{adminNotes.length}/1000</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={fb.status}
                        onValueChange={(v) => {
                          handleStatusChange(fb.id, v as StatusType, adminNotes);
                          setSelectedFeedback({
                            ...selectedFeedback,
                            feedback: { ...fb, status: v, adminNotes },
                          });
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="read">Lido</SelectItem>
                          <SelectItem value="in_progress">Em andamento</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleStatusChange(fb.id, fb.status as StatusType, adminNotes);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? "Salvando..." : "Salvar Notas"}
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AdminPanelLayout>
  );
}
