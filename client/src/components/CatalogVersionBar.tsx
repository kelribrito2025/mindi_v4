import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Globe,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  Pencil,
  Copy,
  ExternalLink,
  MonitorSmartphone,
  X,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef, type ReactNode } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CatalogVersion = "draft" | "published";

interface CatalogVersionBarProps {
  establishmentId: number;
  activeVersion: CatalogVersion;
  onVersionChange: (version: CatalogVersion) => void;
  onPublished?: () => void;
  onDiscarded?: () => void;
  children?: ReactNode;
}

export default function CatalogVersionBar({
  establishmentId,
  activeVersion,
  onVersionChange,
  onPublished,
  onDiscarded,
  children,
}: CatalogVersionBarProps) {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Fetch establishment data for menu slug
  const { data: establishment } = trpc.establishment.get.useQuery();
  const menuUrl = establishment?.menuSlug ? `${window.location.origin}/menu/${establishment.menuSlug}` : null;

  // Make the sidebar sticky inside overflow-auto parent
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const scrollParent = sidebar.closest("main");
    if (!scrollParent) return;

    const handleScroll = () => {
      const placeholder = placeholderRef.current;
      if (!placeholder) return;
      
      const placeholderRect = placeholder.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      
      const shouldStick = placeholderRect.top < parentRect.top;
      setIsStuck(shouldStick);
      
      if (shouldStick && sidebar) {
        sidebar.style.position = "fixed";
        sidebar.style.top = `${parentRect.top + 16}px`;
        sidebar.style.left = `${placeholderRect.left}px`;
        sidebar.style.width = `${placeholder.offsetWidth}px`;
      } else if (sidebar) {
        sidebar.style.position = "relative";
        sidebar.style.top = "";
        sidebar.style.left = "";
        sidebar.style.width = "";
      }
    };

    scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    
    return () => {
      scrollParent.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const { data: stats, isLoading: statsLoading } = trpc.catalogVersion.stats.useQuery(
    { establishmentId },
    { enabled: !!establishmentId, refetchInterval: 30000 }
  );

  const markCatalogStatsAsSynced = (counts: { categories: number; products: number }) => {
    utils.catalogVersion.stats.setData({ establishmentId }, (current) => {
      const draft = current?.draft ?? counts;
      const published = { categories: draft.categories, products: draft.products };
      return { draft, published, hasPendingChanges: false };
    });
  };

  const publishMutation = trpc.catalogVersion.publish.useMutation({
    onSuccess: (data) => {
      markCatalogStatsAsSynced(data.published);
      utils.catalogVersion.stats.invalidate({ establishmentId });
      utils.category.list.invalidate();
      utils.product.list.invalidate();
      setPublishDialogOpen(false);
      setPublishSuccessOpen(true);

      onPublished?.();
    },
    onError: (err) => {
      toast.error(`Erro ao publicar: ${err.message}`);
    },
  });

  const discardMutation = trpc.catalogVersion.discardDraft.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Rascunho descartado! ${data.restored.categories} categorias e ${data.restored.products} produtos restaurados.`,
        { duration: 5000 }
      );
      markCatalogStatsAsSynced(data.restored);
      utils.catalogVersion.stats.invalidate({ establishmentId });
      utils.category.list.invalidate();
      utils.product.list.invalidate();
      setDiscardDialogOpen(false);
      onDiscarded?.();
    },
    onError: (err) => {
      toast.error(`Erro ao descartar rascunho: ${err.message}`);
    },
  });

  const hasPendingChanges = stats?.hasPendingChanges ?? false;
  const isPublishing = publishMutation.isPending;
  const isDiscarding = discardMutation.isPending;

  const sidebarContent = (
    <>
      {/* Card - no shadow, rounded corners */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Tabs area with gray background */}
        <div className="bg-zinc-100/80 dark:bg-zinc-800/50 p-2.5 space-y-1">
          {/* Tab: Rascunho */}
          <button
            onClick={() => onVersionChange("draft")}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors rounded-2xl text-sm",
              activeVersion === "draft"
                ? "bg-amber-50 text-amber-600 shadow-sm border border-amber-300"
                : "hover:bg-white/60 dark:hover:bg-zinc-700/50 text-muted-foreground"
            )}
          >
            <Pencil className={cn(
              "h-4 w-4 flex-shrink-0",
              activeVersion === "draft" ? "text-amber-600" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-medium flex-1",
              activeVersion === "draft" ? "text-amber-600" : "text-muted-foreground"
            )}>
              Rascunho
            </span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "p-0.5 rounded-full transition-colors",
                      activeVersion === "draft" ? "text-amber-400 hover:text-amber-600" : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">Versão de trabalho. Edite livremente — as alterações só ficam visíveis para os clientes após publicar.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>

          {/* Tab: Publicado */}
          <button
            onClick={() => onVersionChange("published")}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors rounded-2xl text-sm",
              activeVersion === "published"
                ? "bg-red-500 text-white shadow-sm"
                : "hover:bg-white/60 dark:hover:bg-zinc-700/50 text-muted-foreground"
            )}
          >
            <Globe className={cn(
              "h-4 w-4 flex-shrink-0",
              activeVersion === "published" ? "text-white" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-medium flex-1",
              activeVersion === "published" ? "text-white" : "text-muted-foreground"
            )}>
              Publicado
            </span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "p-0.5 rounded-full transition-colors",
                      activeVersion === "published" ? "text-white/60 hover:text-white" : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">Versão ativa no cardápio público. É o que seus clientes veem agora.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </div>

        {/* Status */}
        <div className="px-4 py-3 border-t border-border/30">
          {statsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Carregando...</span>
            </div>
          ) : hasPendingChanges ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Alterações pendentes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Sincronizado</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Action buttons - Descartar icon (left) + Publicar (right) */}
        <div className="px-2.5 pb-2.5 pt-2 flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled={!hasPendingChanges || isPublishing || isDiscarding}
                  onClick={() => setDiscardDialogOpen(true)}
                  className={cn(
                    "flex-shrink-0 px-2.5 py-2 rounded-xl transition-colors border self-stretch flex items-center justify-center",
                    hasPendingChanges && !isPublishing && !isDiscarding
                      ? "border-border/60 bg-card hover:bg-muted/40 text-foreground cursor-pointer"
                      : "border-border/30 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  {isDiscarding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Descartar alterações</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button
            disabled={!hasPendingChanges || isPublishing || isDiscarding}
            onClick={() => setPublishDialogOpen(true)}
            className={cn(
              "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors justify-center border",
              "text-[15px]",
              hasPendingChanges && !isPublishing && !isDiscarding
                ? "border-red-300 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 dark:border-red-500/50 cursor-pointer"
                : "border-border/30 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {isPublishing ? (
              <><Loader2 className="h-4 w-4 animate-spin" />
              <span className="inline-flex">Publicando<span className="">...</span></span></>
            ) : (
              <><Upload className="h-4 w-4" />
              Publicar</>
            )}
          </button>
        </div>
      </div>


    </>
  );

  return (
    <>
      <div
        ref={placeholderRef}
        className="w-[200px] lg:w-[220px] flex-shrink-0 hidden md:block"
        style={{ minHeight: isStuck ? sidebarRef.current?.offsetHeight : undefined }}
      >
        <div
          ref={sidebarRef}
          className="w-[200px] lg:w-[220px] z-30"
          style={{ transition: "none" }}
        >
          {sidebarContent}
          {children}
        </div>
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-[414px] p-0 overflow-hidden border-0 bg-white [&>button]:hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:w-full max-sm:max-w-full sm:rounded-[28px]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)' }} overlayClassName="bg-black/20 backdrop-blur-sm">
          <DialogTitle className="sr-only">Publicar cardápio</DialogTitle>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-border mb-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-red-100 opacity-40 scale-125" />
                <div className="relative w-[42px] h-[42px] border-2 border-red-400 rounded-full flex items-center justify-center bg-white shadow-sm">
                  <Upload className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-foreground">Publicar cardápio?</h3>
                <p className="text-[11px] text-muted-foreground">O cardápio público será atualizado com as alterações do rascunho.</p>
              </div>
            </div>
            {/* Info */}
            <p className="text-[13px] text-gray-600 dark:text-muted-foreground mb-2">Clientes verão as mudanças imediatamente.</p>
            {stats && (
              <div className="flex items-center gap-2.5 rounded-[14px] p-3.5 mb-4" style={{ background: 'linear-gradient(135deg, #fef2f2, #fef9f0)' }}>
                <div className="w-7 h-7 bg-white dark:bg-background rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <Upload className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-foreground">Serão publicados: {stats.draft.categories} categorias e {stats.draft.products} produtos</span>
              </div>
            )}
            {/* Actions */}
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold border-gray-200 dark:border-border"
                onClick={() => setPublishDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white gap-1.5"
                onClick={() => { publishMutation.mutate({ establishmentId }); setPublishDialogOpen(false); }}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publicando...</>
                ) : (
                  <>Publicar agora <Upload className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Success Modal */}
      <Dialog open={publishSuccessOpen} onOpenChange={(open) => { setPublishSuccessOpen(open); if (!open) setLinkCopied(false); }}>
        <DialogContent className="sm:max-w-[414px] p-0 overflow-hidden border-0 bg-white [&>button]:hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:w-full max-sm:max-w-full sm:rounded-[28px]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)' }} overlayClassName="bg-black/20 backdrop-blur-sm">
          <DialogTitle className="sr-only">Cardápio publicado</DialogTitle>
          <div className="p-6">
            {/* Toast Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-border mb-4">
              {/* Animated check icon with sparkles */}
              <div className="relative shrink-0">
                {/* Sparkle particles */}
                <div className="absolute inset-0 -m-3">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 text-red-400 animate-ping text-[8px]" style={{ animationDuration: '1.5s', animationDelay: '0.1s' }}>✦</span>
                  <span className="absolute top-1 right-0 text-red-300 animate-ping text-[7px]" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>◇</span>
                  <span className="absolute bottom-0 left-0 text-red-300 animate-ping text-[7px]" style={{ animationDuration: '1.8s', animationDelay: '0.5s' }}>○</span>
                  <span className="absolute bottom-1 right-1 text-red-300 animate-ping text-[6px]" style={{ animationDuration: '1.7s', animationDelay: '0.4s' }}>—</span>
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-red-100 opacity-40 scale-125" />
                {/* Main circle */}
                <div className="relative w-[42px] h-[42px] border-2 border-red-400 rounded-full flex items-center justify-center bg-white shadow-sm">
                  <Check className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-foreground">Cardápio atualizado!</h3>
                <p className="text-[11px] text-muted-foreground">As alterações foram publicadas com sucesso.</p>
              </div>
            </div>
            {/* Link area */}
            {menuUrl && (
              <div className="flex items-center gap-2.5 rounded-[14px] p-3.5 mb-4" style={{ background: 'linear-gradient(135deg, #fef2f2, #fef9f0)' }}>
                {establishment?.logo ? (
                  <img loading="lazy" src={establishment.logo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-border/50" />
                ) : (
                  <div className="w-7 h-7 bg-white dark:bg-background rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                  </div>
                )}
                <span className="flex-1 text-xs font-medium text-gray-700 dark:text-foreground truncate">{menuUrl.replace('https://', '')}</span>
                <button
                  onClick={() => { if (menuUrl) { navigator.clipboard.writeText(menuUrl); setLinkCopied(true); toast.success('Link copiado!'); setTimeout(() => setLinkCopied(false), 2000); } }}
                  className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap"
                >
                  {linkCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            )}
            {/* Actions */}
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold border-gray-200 dark:border-border"
                onClick={() => setPublishSuccessOpen(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1 rounded-[20px] h-11 text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white gap-1.5"
                onClick={() => { if (menuUrl) { window.open(menuUrl, '_blank'); } setPublishSuccessOpen(false); }}
              >
                Visitar
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Dialog */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent className="sm:max-w-md" style={{ borderRadius: '16px' }}>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <RotateCcw className="h-5 w-5 text-red-500" />
              </div>
              <AlertDialogTitle className="text-lg">Descartar rascunho?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Todas as alterações feitas no rascunho serão perdidas. O rascunho será restaurado para a versão publicada atual.
              {stats && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Rascunho atual: {stats.draft.categories} categorias, {stats.draft.products} produtos
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => discardMutation.mutate({ establishmentId })}
              className="rounded-xl bg-red-500 hover:bg-red-500 text-white"
              disabled={isDiscarding}
            >
              {isDiscarding ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Descartando...</>
              ) : (
                "Descartar rascunho"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
