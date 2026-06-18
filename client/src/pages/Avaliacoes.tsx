import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Star, MessageSquare, Users, Clock, TrendingUp, Send, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Hash, Calendar, Phone, X, Pencil, CheckCircle2, MoreHorizontal, Eye } from "lucide-react";
import { StatCard, PageHeader, TableSkeleton, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function StarRatingCompact({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Number(rating).toFixed(1)}
      <Star size={14} className="fill-amber-400 text-amber-400" />
    </span>
  );
}

function getStatusBadge(review: any) {
  if (review.responseText) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        Respondida
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200 text-xs gap-1">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
      Não respondida
    </Badge>
  );
}

// Sidebar de detalhes da avaliação - estilo iFood profissional
function ReviewDetailSheet({ review, open, onOpenChange, establishmentId, onResponded }: {
  review: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onResponded: () => void;
}) {
  const [responseText, setResponseText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (review) {
      setResponseText(review.responseText || "");
      setIsEditing(false);
    }
  }, [review?.id]);

  const respondMutation = trpc.reviewsAdmin.respond.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada com sucesso!");
      setIsEditing(false);
      onResponded();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar resposta");
    },
  });

  if (!review) return null;

  const createdDate = new Date(review.createdAt);
  const hasResponse = !!review.responseText;
  const showTextarea = !hasResponse || isEditing;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideCloseButton className="w-full sm:max-w-[380px] !p-0 !gap-0 !h-dvh">
        <SheetTitle className="sr-only">Detalhes da Avaliação</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header vermelho */}
          <div className="shrink-0 bg-gradient-to-r from-red-500 to-red-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Detalhes da Avaliação</h2>
                  <p className="text-sm text-white/80">Veja e responda a avaliação do cliente</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            {/* Card do pedido */}
            <div className="bg-muted/40 px-5 py-3 border-b border-border/50">
              <span className="text-red-500 font-semibold">Pedido {review.orderNumber || review.orderId || "—"}</span>
              <span className="text-sm text-muted-foreground ml-3">Feito em {createdDate.toLocaleDateString("pt-BR")}</span>
            </div>

            <div className="p-5 space-y-6">
              {/* Nota geral em destaque */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">O que você achou do pedido?</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tracking-tight">{Number(review.rating).toFixed(1)}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={22}
                        className={cn(
                          "transition-colors",
                          i <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>

                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Comentário do cliente */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-500 font-bold text-sm">
                      {(review.customerName || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-[15px]">
                      {review.customerName || "Cliente"} disse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      em {createdDate.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 ml-10">
                  {review.comment ? (
                    <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum comentário</p>
                  )}
                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Seção Sua resposta */}
              <div>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    hasResponse ? "bg-red-100" : "bg-gray-100"
                  )}>
                    <span className={cn("font-bold text-sm", hasResponse ? "text-red-500" : "text-gray-400")}>
                      R
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-[15px]">Sua resposta</p>
                    {review.responseDate ? (
                      <p className="text-xs text-muted-foreground">
                        até {new Date(review.responseDate).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 ml-10">
                  {/* Estado: com resposta publicada (modo leitura) */}
                  {hasResponse && !isEditing ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-700">Resposta publicada</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{review.responseText}</p>
                        {review.responseDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Respondido em {new Date(review.responseDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil size={12} />
                        Editar resposta
                      </Button>
                    </div>
                  ) : (
                    /* Estado: sem resposta ou editando */
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Escreva aqui uma resposta ao cliente"
                        value={responseText}
                        onChange={(e) => {
                          if (e.target.value.length <= 300) {
                            setResponseText(e.target.value);
                          }
                        }}
                        rows={5}
                        className="text-sm resize-none bg-muted/30 border-border/60 focus:bg-background transition-colors"
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {responseText.length}/300 caracteres
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer fixo - só aparece quando em modo de escrita/edição */}
          {showTextarea && (
            <div className="shrink-0 p-4 border-t border-border bg-background">
              <Button
                className="w-full bg-red-500 hover:bg-red-500 text-white rounded-lg py-3 gap-2"
                onClick={() => respondMutation.mutate({
                  reviewId: review.id,
                  establishmentId,
                  responseText: responseText.trim(),
                })}
                disabled={!responseText.trim() || respondMutation.isPending}
              >
                <Send size={16} />
                {respondMutation.isPending ? "Enviando..." : (isEditing ? "Atualizar resposta" : "Enviar resposta")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Avaliacoes() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");
  const [page, setPage] = useState(0);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [reviewsBannerDismissed, setReviewsBannerDismissed] = useState(() => {
    try { return localStorage.getItem('reviewsBannerDismissed') === 'true'; } catch { return false; }
  });
  const LIMIT = 15;

  // Buscar estabelecimento
  const { data: establishment } = trpc.establishment.get.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      utils.establishment.get.invalidate();
    },
  });

  const establishmentId = establishment?.id;

  // Métricas
  const { data: metrics, refetch: refetchMetrics, isLoading: metricsLoading } = trpc.reviewsAdmin.metrics.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Contagem total de avaliações
  const { data: totalCount, refetch: refetchCount } = trpc.reviewsAdmin.count.useQuery(
    { establishmentId: establishmentId!, filter },
    { enabled: !!establishmentId }
  );

  // Lista de avaliações
  const { data: reviewsList, refetch: refetchReviews, isLoading } = trpc.reviewsAdmin.list.useQuery(
    { establishmentId: establishmentId!, filter, limit: LIMIT, offset: page * LIMIT },
    { enabled: !!establishmentId }
  );

  const totalPages = totalCount ? Math.ceil(totalCount / LIMIT) : 0;

  // Marcar como lidas
  const markAsReadMutation = trpc.reviewsAdmin.markAsRead.useMutation();

  useEffect(() => {
    if (reviewsList && establishmentId) {
      const unreadIds = reviewsList
        .filter((r: any) => !r.isRead)
        .map((r: any) => r.id);
      if (unreadIds.length > 0) {
        markAsReadMutation.mutate({ establishmentId, reviewIds: unreadIds });
      }
    }
  }, [reviewsList, establishmentId]);

  // Atualizar selectedReview quando a lista é refetched
  useEffect(() => {
    if (selectedReview && reviewsList) {
      const updated = reviewsList.find((r: any) => r.id === selectedReview.id);
      if (updated) {
        setSelectedReview(updated);
      }
    }
  }, [reviewsList]);

  const handleSelectReview = (review: any) => {
    setSelectedReview(review);
    setShowSidebar(true);
  };

  const handleResponded = () => {
    refetchReviews();
    refetchMetrics();
    refetchCount();
  };

  // Reset page quando muda o filtro
  useEffect(() => {
    setPage(0);
    setPageInput("");
  }, [filter]);

  if (!establishment) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
        </div>
      </AdminLayout>
    );
  }

  const reviewsEnabled = establishment.reviewsEnabled !== false;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
    <div className="space-y-6">
      <PageHeader
        title="Avaliações"
        description="Gerencie e responda as avaliações dos seus clientes"
        icon={<Star className="h-6 w-6 text-amber-500" />}
        actions={
          <div className="flex items-center gap-3">
            <Label htmlFor="reviews-toggle" className="text-sm text-muted-foreground cursor-pointer">
              {reviewsEnabled ? "Ativado" : "Desativado"}
            </Label>
            <Switch
              id="reviews-toggle"
              checked={reviewsEnabled}
              onCheckedChange={(checked) => {
                if (establishment?.id) {
                  updateMutation.mutate({
                    id: establishment.id,
                    reviewsEnabled: checked,
                  }, {
                    onSuccess: () => {
                      toast.success(checked ? "Avaliações ativadas" : "Avaliações desativadas");
                    },
                  });
                }
              }}
            />
          </div>
        }
      />

      {/* Conteúdo quando avaliações desativadas */}
      {!reviewsEnabled && (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-red-50 via-white to-amber-50/70 px-6 py-7 dark:from-red-950/20 dark:via-card dark:to-amber-950/15">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-amber-400/30 blur-lg" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-amber-200/80 dark:bg-background dark:ring-amber-500/20">
                    <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
                  </div>
                </div>
                <div className="max-w-2xl">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Avaliações desativadas</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Os clientes não receberão novas avaliações após a entrega. Enquanto isso, o menu público mantém uma apresentação confiável com nota visual fixa <span className="font-semibold text-foreground">5.0</span>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-amber-500/20 dark:bg-background/70 lg:min-w-[220px]">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prévia no menu</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight">5.0</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.min(establishment.fakeReviewCount ?? 149, 149)} avaliações exibidas
                </p>
              </div>
            </div>
          </div>

          {/* Configurações do modo desativado */}
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5 dark:bg-muted/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100 dark:bg-red-500/10 dark:ring-red-500/20">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Configurações do modo desativado</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Ajuste apenas a quantidade visual que aparece ao lado da nota fixa no menu público.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  Nota fixa 5.0
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Quantidade de avaliações exibidas</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">Limite de 149 para manter a credibilidade do perfil. Valores muito altos podem parecer artificiais para os clientes.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      type="number"
                      min={0}
                      max={149}
                      value={establishment.fakeReviewCount ?? 149}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const clamped = val > 149 ? 149 : val < 0 ? 0 : val;
                        utils.establishment.get.setData(undefined, (old: any) => old ? { ...old, fakeReviewCount: clamped } : old);
                      }}
                      className="h-11 w-full rounded-xl border-border/70 bg-card text-base font-semibold sm:w-32"
                    />
                    <Button
                      size="sm"
                      className="h-11 rounded-xl bg-red-500 px-5 font-semibold text-white shadow-sm hover:bg-red-600"
                      onClick={() => {
                        if (establishment?.id) {
                          const clampedCount = Math.min(Math.max(establishment.fakeReviewCount ?? 149, 0), 149);
                          utils.establishment.get.setData(undefined, (old: any) => old ? { ...old, fakeReviewCount: clampedCount } : old);
                          updateMutation.mutate({
                            id: establishment.id,
                            fakeReviewCount: clampedCount,
                          }, {
                            onSuccess: () => {
                              toast.success("Quantidade atualizada");
                            },
                          });
                        }
                      }}
                    >
                      Salvar alteração
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm lg:min-w-[260px]">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Como aparecerá</p>
                  <p className="mt-1 font-semibold text-foreground">
                    ⭐ 5.0 ({Math.min(establishment.fakeReviewCount ?? 149, 149)} avaliações)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewsEnabled && <>
      {/* Banner informativo de avaliações */}
      {!reviewsBannerDismissed && (
        <div className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/30">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23d97706' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)',
                animation: 'banner-shimmer 3s ease-in-out infinite',
                animationDelay: '1s'
              }}
            />
          </div>
          
          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Ícone pulsante */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/30 dark:bg-amber-500/20" />
              <div className="relative p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">
                Avaliações são <span className="text-amber-600 dark:text-amber-400">importantes</span>!
              </p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                Incentive seus clientes a avaliarem o restaurante para aumentar sua <strong className="text-amber-600 dark:text-amber-400">credibilidade</strong> e atrair mais pedidos.
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => {
                setReviewsBannerDismissed(true);
                try { localStorage.setItem('reviewsBannerDismissed', 'true'); } catch {}
              }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <StatCard
          title="Nota Média"
          value={metrics ? Number(metrics.avgRating).toFixed(1) : "—"}
          icon={Star}
          loading={metricsLoading}
          variant="amber"
          tooltip="Média geral de todas as avaliações"
        />
        <StatCard
          title="Média 30 dias"
          value={metrics ? Number(metrics.avgRating30d).toFixed(1) : "—"}
          icon={TrendingUp}
          loading={metricsLoading}
          variant="blue"
          tooltip="Média dos últimos 30 dias"
        />
        <StatCard
          title="Total"
          value={metrics?.totalReviews ?? 0}
          icon={MessageSquare}
          loading={metricsLoading}
          variant="emerald"
          tooltip="Total de avaliações recebidas"
        />
        <StatCard
          title="Clientes"
          value={metrics?.uniqueCustomers ?? 0}
          icon={Users}
          loading={metricsLoading}
          variant="primary"
          tooltip="Clientes únicos que avaliaram"
        />
        <StatCard
          title="Pendentes"
          value={metrics?.pendingResponse ?? 0}
          icon={Clock}
          loading={metricsLoading}
          variant="amber"
          tooltip="Avaliações aguardando resposta"
        />
      </div>

      {/* Filtros + contagem */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => { setFilter(v as any); setPage(0); }}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="responded">Respondidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalCount ?? reviewsList?.length ?? 0} {(totalCount ?? reviewsList?.length ?? 0) === 1 ? 'avaliação encontrada' : 'avaliações encontradas'}
        </p>
      </div>

      {/* Lista de avaliações */}
      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : !reviewsList || reviewsList.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Nenhuma avaliação encontrada"
            description={
              filter === "pending" ? "Todas as avaliações foram respondidas!" :
              filter === "responded" ? "Nenhuma avaliação respondida ainda." :
              "As avaliações dos clientes aparecerão aqui."
            }
          />
        ) : (
          <>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pedido</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nota</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comentário</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsList.map((review: any) => {
                    const createdDate = new Date(review.createdAt);
                    const customerInitial = (review.customerName || "C").charAt(0).toUpperCase();
                    const hasResponse = !!review.responseText;
                    return (
                      <tr
                        key={review.id}
                        className={cn(
                          "border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer",
                          selectedReview?.id === review.id && "bg-muted/50",
                          !review.isRead && "font-medium"
                        )}
                        onClick={() => handleSelectReview(review)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                              review.rating >= 4 ? "bg-emerald-500" : review.rating >= 3 ? "bg-amber-500" : "bg-red-500"
                            )}>
                              {customerInitial}
                            </div>
                            <div>
                              <p className="font-medium">{review.customerName || "Cliente"}</p>
                              {review.customerPhone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {review.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-red-500 font-medium">
                            {review.orderNumber || review.orderId || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {createdDate.toLocaleDateString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-4">
                          <StarRatingCompact rating={review.rating} />
                        </td>
                        <td className="p-4 max-w-[200px]">
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {review.comment || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(review)}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSelectReview(review)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
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
              {reviewsList.map((review: any) => {
                const createdDate = new Date(review.createdAt);
                const customerInitial = (review.customerName || "C").charAt(0).toUpperCase();
                return (
                  <div
                    key={review.id}
                    className="p-4 hover:bg-muted/20 transition-colors"
                    onClick={() => handleSelectReview(review)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                          review.rating >= 4 ? "bg-emerald-500" : review.rating >= 3 ? "bg-amber-500" : "bg-red-500"
                        )}>
                          {customerInitial}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.customerName || "Cliente"}</p>
                          <p className="text-xs text-muted-foreground">
                            Pedido {review.orderNumber || review.orderId || "—"} · {createdDate.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSelectReview(review)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRatingCompact rating={review.rating} />
                      {getStatusBadge(review)}
                      {review.comment && (
                        <span className="text-xs text-muted-foreground ml-auto line-clamp-1 max-w-[150px]">
                          {review.comment}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 mt-4">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages} · Total: {totalCount} avaliações
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1.5 mx-1">
                  <span className="text-xs text-muted-foreground">Página</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput || (page + 1)}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput);
                        if (val >= 1 && val <= totalPages) {
                          setPage(val - 1);
                        }
                        setPageInput("");
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(pageInput);
                      if (val >= 1 && val <= totalPages) {
                        setPage(val - 1);
                      }
                      setPageInput("");
                    }}
                    className="h-8 w-14 text-center text-xs"
                  />
                  <span className="text-xs text-muted-foreground">de {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </>}
    </div>

    {/* Sidebar de detalhes da avaliação */}
    <ReviewDetailSheet
      review={selectedReview}
      open={showSidebar}
      onOpenChange={setShowSidebar}
      establishmentId={establishmentId!}
      onResponded={handleResponded}
    />
      </div>
    </AdminLayout>
  );
}
