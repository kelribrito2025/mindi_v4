import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Bug,
  TrendingUp,
  X,
  Rocket,
  Settings2,
  Info,
  Loader2,
  Heart,
} from "lucide-react";

type EntryType = "feature" | "improvement" | "fix";

interface ChangelogEntry {
  id: number;
  versionId: number;
  type: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: Date;
}

interface ChangelogVersionWithEntries {
  id: number;
  version: string;
  title: string;
  imageUrl?: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  likedByCurrentEstablishment: boolean;
  entries: ChangelogEntry[];
}

const TYPE_CONFIG = {
  feature: { label: "Novo", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-500/10", icon: Sparkles, borderColor: "border-green-200 dark:border-green-500/20" },
  improvement: { label: "Melhoria", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50 dark:bg-blue-500/10", icon: TrendingUp, borderColor: "border-blue-200 dark:border-blue-500/20" },
  fix: { label: "Correção", color: "bg-amber-500", textColor: "text-amber-600", bgLight: "bg-amber-50 dark:bg-amber-500/10", icon: Bug, borderColor: "border-amber-200 dark:border-amber-500/20" },
};

const CHANGELOG_READ_KEY = "changelog-last-read-version";
const CHANGELOG_TOOLTIP_DISMISSED_KEY = "changelog-tooltip-dismissed";

// Renderiza texto com suporte a **negrito** e quebras de linha
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Processar **negrito** dentro de cada linha
    const parts = line.split(/(\*\*[^*]+\*\*)/);
    const elements = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${lineIdx}-${partIdx}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return <span key={`${lineIdx}-${partIdx}`}>{part}</span>;
    });
    return (
      <span key={lineIdx}>
        {lineIdx > 0 && <br />}
        {elements}
      </span>
    );
  });
}

// ==================== CONTEÚDO DO SIDEBAR ====================
function SidebarMindiSplit({ versions }: { versions: ChangelogVersionWithEntries[] }) {
  const [activeVersionId, setActiveVersionId] = useState<number | null>(versions[0]?.id ?? null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<EntryType | null>(null);
  const utils = trpc.useUtils();
  const toggleLikeMutation = trpc.changelog.toggleLike.useMutation({
    onMutate: async ({ versionId }) => {
      await utils.changelog.published.cancel();
      const previousVersions = utils.changelog.published.getData();

      utils.changelog.published.setData(undefined, (currentVersions) => currentVersions?.map((version) => {
        if (version.id !== versionId) return version;

        const likedByCurrentEstablishment = !version.likedByCurrentEstablishment;
        const likeCount = Math.max(0, (version.likeCount ?? 0) + (likedByCurrentEstablishment ? 1 : -1));

        return {
          ...version,
          likeCount,
          likedByCurrentEstablishment,
        };
      }));

      return { previousVersions };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousVersions) {
        utils.changelog.published.setData(undefined, context.previousVersions);
      }
    },
    onSuccess: (result, { versionId }) => {
      utils.changelog.published.setData(undefined, (currentVersions) => currentVersions?.map((version) => (
        version.id === versionId
          ? { ...version, likeCount: result.likeCount, likedByCurrentEstablishment: result.liked }
          : version
      )));
    },
    onSettled: () => {
      utils.changelog.published.invalidate();
    },
  });

  const toggleExpand = (itemId: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };
  const activeRelease = versions.find(r => r.id === activeVersionId) || versions[0];

  if (!activeRelease) return null;

  const isNewest = versions[0]?.id === activeRelease.id;
  const isLikePending = toggleLikeMutation.isPending && toggleLikeMutation.variables?.versionId === activeRelease.id;
  const handleToggleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isLikePending) return;
    toggleLikeMutation.mutate({ versionId: activeRelease.id });
  };

  return (
    <div className="space-y-4">
      {/* Seletor de versões horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {versions.map((release, idx) => {
          const isActive = activeRelease.id === release.id;
          const isFirst = idx === 0;
          return (
            <button
              key={release.id}
              onClick={() => setActiveVersionId(release.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-colors duration-200 shrink-0 border",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {isFirst
                ? <Rocket className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                : <Settings2 className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              }
              <span className="font-mono">{release.version}</span>
              {isFirst && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Imagem da versão ativa */}
      {activeRelease.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border/50">
          <img
            src={activeRelease.imageUrl}
            alt={`Imagem da versão ${activeRelease.version}`}
            className="w-full h-44 object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}

      {/* Header da versão ativa */}
      <div className="bg-card rounded-xl border border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
            isNewest ? "bg-primary/10" : "bg-muted"
          )}>
            {isNewest
              ? <Rocket className="h-4 w-4 text-primary" />
              : <Settings2 className="h-4 w-4 text-muted-foreground" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{activeRelease.title}</h3>

            </div>
            <p className="text-xs text-muted-foreground">
              {activeRelease.publishedAt
                ? new Date(activeRelease.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
                : new Date(activeRelease.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
              }
              {" · "}{activeRelease.entries.length} alterações
            </p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border border-border/30">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              <button
                onClick={() => setActiveFilter(activeFilter === 'feature' ? null : 'feature')}
                className={cn(
                  "font-bold transition-colors duration-200 hover:underline cursor-pointer",
                  activeFilter === 'feature' ? "text-green-700 underline" : "text-green-600"
                )}
              >
                {activeRelease.entries.filter(i => i.type === 'feature').length} novidades
              </button>,{" "}
              <button
                onClick={() => setActiveFilter(activeFilter === 'improvement' ? null : 'improvement')}
                className={cn(
                  "font-bold transition-colors duration-200 hover:underline cursor-pointer",
                  activeFilter === 'improvement' ? "text-blue-700 underline" : "text-blue-600"
                )}
              >
                {activeRelease.entries.filter(i => i.type === 'improvement').length} melhorias
              </button> e{" "}
              <button
                onClick={() => setActiveFilter(activeFilter === 'fix' ? null : 'fix')}
                className={cn(
                  "font-bold transition-colors duration-200 hover:underline cursor-pointer",
                  activeFilter === 'fix' ? "text-amber-700 underline" : "text-amber-600"
                )}
              >
                {activeRelease.entries.filter(i => i.type === 'fix').length} correções
              </button>
            </p>
          </div>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar filtro
            </button>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
          <span className="text-[11px] text-muted-foreground">
            {activeRelease.likedByCurrentEstablishment
              ? "O seu restaurante curtiu esta novidade"
              : "Curta para indicar que esta novidade foi útil"}
          </span>
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLikePending}
            aria-pressed={activeRelease.likedByCurrentEstablishment}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70",
              activeRelease.likedByCurrentEstablishment
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                : "border-border/60 bg-background text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            )}
          >
            {isLikePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Heart className={cn(
                "h-3.5 w-3.5 transition-colors duration-200",
                activeRelease.likedByCurrentEstablishment && "fill-current"
              )} />
            )}
            <span>{activeRelease.likeCount ?? 0}</span>
          </button>
        </div>
      </div>

      {/* Items agrupados por tipo */}
      {(['feature', 'improvement', 'fix'] as const).map((type) => {
        if (activeFilter && activeFilter !== type) return null;
        const items = activeRelease.entries.filter(i => i.type === type);
        if (items.length === 0) return null;
        const typeConfig = TYPE_CONFIG[type];
        const TypeIcon = typeConfig.icon;
        const sectionConfig = {
          feature: { title: "Novidades", description: "Novas funcionalidades", iconBg: "bg-green-100 dark:bg-green-500/15" },
          improvement: { title: "Melhorias", description: "Funcionalidades aprimoradas", iconBg: "bg-blue-100 dark:bg-blue-500/15" },
          fix: { title: "Correções", description: "Problemas resolvidos", iconBg: "bg-amber-100 dark:bg-amber-500/15" },
        };
        const section = sectionConfig[type];

        return (
          <div key={type} className="bg-card rounded-xl border border-border/50">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0", section.iconBg)}>
                  <TypeIcon className={cn("h-4 w-4", typeConfig.textColor)} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{items.length}</Badge>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="min-w-0">
                    {item.imageUrl && (
                      <div className="mb-1.5 -mx-2.5 -mt-2.5 rounded-t-lg overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-32 object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    {item.description && (
                      <div className="mt-0.5">
                        <p className={cn(
                          "text-xs text-muted-foreground leading-relaxed",
                          !expandedItems.has(item.id) && "line-clamp-2"
                        )}>
                          {renderFormattedText(item.description)}
                        </p>
                        {item.description.length > 80 && !expandedItems.has(item.id) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                            className="text-xs font-medium text-red-500 hover:text-red-500 mt-0.5 transition-colors"
                          >
                            Ver mais
                          </button>
                        )}
                        {expandedItems.has(item.id) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                            className="text-xs font-medium text-red-500 hover:text-red-500 mt-0.5 transition-colors"
                          >
                            Ver menos
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== BOTÃO NA SIDEBAR ====================
interface ChangelogButtonProps {
  sidebarCollapsed: boolean;
}

// ==================== BOTÃO COMPACTO PARA O DASHBOARD ====================
export function ChangelogDashboardButton() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  const { data: versions, isLoading } = trpc.changelog.published.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const currentVersion = versions?.[0]?.version ?? "0.0.0";

  const computedHasUpdates = useMemo(() => {
    if (!versions || versions.length === 0) return false;
    if (typeof window === 'undefined') return true;
    const lastRead = localStorage.getItem(CHANGELOG_READ_KEY);
    return lastRead !== versions[0].version;
  }, [versions]);

  // Mostrar popup com delay quando há novidades
  useEffect(() => {
    if (computedHasUpdates && !popupDismissed) {
      const timer = setTimeout(() => setShowPopup(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowPopup(false);
    }
  }, [computedHasUpdates, popupDismissed]);

  // Verificar se o popup já foi dispensado para esta versão
  useEffect(() => {
    if (versions && versions.length > 0) {
      const dismissed = localStorage.getItem(CHANGELOG_TOOLTIP_DISMISSED_KEY);
      if (dismissed === versions[0].version) {
        setPopupDismissed(true);
      }
    }
  }, [versions]);

  const handleOpenChangelog = () => {
    setSheetOpen(true);
    setPopupDismissed(true);
    setShowPopup(false);
    if (versions && versions.length > 0) {
      localStorage.setItem(CHANGELOG_READ_KEY, versions[0].version);
      localStorage.setItem(CHANGELOG_TOOLTIP_DISMISSED_KEY, versions[0].version);
    }
  };

  const handleDismissPopup = () => {
    setPopupDismissed(true);
    setShowPopup(false);
    if (versions && versions.length > 0) {
      localStorage.setItem(CHANGELOG_TOOLTIP_DISMISSED_KEY, versions[0].version);
    }
  };

  if (!isLoading && (!versions || versions.length === 0)) {
    return null;
  }

  return (
    <>
      <div className="relative">
      <button
        onClick={handleOpenChangelog}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group flex items-center justify-center rounded-lg border cursor-pointer transition-all duration-300 ease-in-out overflow-hidden",
          "px-2.5 py-2",
          computedHasUpdates
            ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
            : "bg-muted/50 border-border/50 hover:bg-muted"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center gap-0 transition-colors duration-300 ease-in-out">
            <Sparkles className={cn(
              "h-4 w-4 shrink-0",
              computedHasUpdates ? "text-primary" : "text-muted-foreground"
            )} />
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                isHovered ? "max-w-[80px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"
              )}
            >
              <span className={cn(
                "text-sm font-medium font-mono",
                computedHasUpdates ? "text-primary" : "text-muted-foreground"
              )}>
                v{currentVersion}
              </span>
            </div>
            {computedHasUpdates && (
              <span className={cn(
                "relative flex h-2 w-2 shrink-0 transition-colors duration-300",
                isHovered ? "ml-2" : "ml-1.5"
              )}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </div>
        )}
      </button>

      {/* Popup "Temos novidades!" */}
      {showPopup && computedHasUpdates && (
        <div
          className={cn(
            "absolute z-30 animate-in fade-in duration-300",
            "md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 md:slide-in-from-top-2",
            "top-1/2 left-full -translate-y-1/2 ml-2 slide-in-from-left-2 md:translate-y-0"
          )}
        >
          {/* Seta - para cima no desktop, para esquerda no mobile */}
          <div className="hidden md:block absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
          <div className="md:hidden absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismissPopup();
              handleOpenChangelog();
            }}
            className="relative flex items-center gap-2 px-3.5 py-2 bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/25 whitespace-nowrap cursor-pointer hover:bg-red-500 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Temos novidades!</span>
            <X
              className="h-3 w-3 ml-1 opacity-70 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDismissPopup();
              }}
            />
          </button>
        </div>
      )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[30vw] sm:max-w-[30vw] p-0 overflow-hidden [&>button]:hidden"
        >
          <div className="h-full flex flex-col overflow-hidden">
            <SheetTitle className="sr-only">Novidades da Plataforma</SheetTitle>
            <SheetDescription className="sr-only">Acompanhe as atualizações da plataforma Mindi</SheetDescription>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary/10">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Novidades da Plataforma</h2>
                  <p className="text-xs text-muted-foreground">Acompanhe as atualizações</p>
                </div>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : versions && versions.length > 0 ? (
                <SidebarMindiSplit versions={versions} />
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma novidade publicada ainda</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ChangelogButton({ sidebarCollapsed }: ChangelogButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Buscar dados reais do banco
  const { data: versions, isLoading } = trpc.changelog.published.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const currentVersion = versions?.[0]?.version ?? "0.0.0";
  const totalNewItems = versions?.[0]?.entries?.length ?? 0;

  const [hasUpdates, setHasUpdates] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastRead = localStorage.getItem(CHANGELOG_READ_KEY);
      return true; // será recalculado no useMemo
    }
    return true;
  });

  const [tooltipDismissed, setTooltipDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CHANGELOG_TOOLTIP_DISMISSED_KEY) === "true-temp";
    }
    return false;
  });

  // Recalcular hasUpdates quando os dados carregam
  const computedHasUpdates = useMemo(() => {
    if (!versions || versions.length === 0) return false;
    if (typeof window === 'undefined') return true;
    const lastRead = localStorage.getItem(CHANGELOG_READ_KEY);
    return lastRead !== versions[0].version;
  }, [versions]);

  // Recalcular tooltipDismissed quando os dados carregam
  const computedTooltipDismissed = useMemo(() => {
    if (!versions || versions.length === 0) return true;
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(CHANGELOG_TOOLTIP_DISMISSED_KEY) === versions[0].version;
  }, [versions]);

  const handleOpenChangelog = () => {
    setSheetOpen(true);
    if (versions && versions.length > 0) {
      localStorage.setItem(CHANGELOG_READ_KEY, versions[0].version);
      localStorage.setItem(CHANGELOG_TOOLTIP_DISMISSED_KEY, versions[0].version);
    }
  };

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (versions && versions.length > 0) {
      localStorage.setItem(CHANGELOG_TOOLTIP_DISMISSED_KEY, versions[0].version);
    }
  };

  const showTooltip = computedHasUpdates && !computedTooltipDismissed;

  // Não renderizar se não há versões publicadas e não está carregando
  if (!isLoading && (!versions || versions.length === 0)) {
    return null;
  }

  return (
    <>
      <div className="relative">
        {/* Tooltip vermelho de novidades - posicionado acima do botão, escondido no mobile */}
        {showTooltip && (
          <div className={cn(
            "absolute z-30 animate-in fade-in slide-in-from-bottom-2 duration-300 hidden lg:block",
            sidebarCollapsed
              ? "-top-11 left-1/2 -translate-x-1/2"
              : "-top-11 left-3"
          )}>
            <div className="relative bg-red-500 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Temos novidades!
              <button
                onClick={handleDismissTooltip}
                className="h-4 w-4 rounded-full hover:bg-red-400 flex items-center justify-center transition-colors ml-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              {/* Seta para baixo */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45" />
            </div>
          </div>
        )}

        {sidebarCollapsed ? (
          /* Modo colapsado: apenas ícone Sparkles compacto */
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleOpenChangelog}
                className="flex items-center justify-center w-full py-1.5 cursor-pointer"
              >
                <div className="relative flex items-center justify-center h-7 w-7 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                  <Sparkles className={cn(
                    "h-3 w-3",
                    computedHasUpdates ? "text-primary" : "text-muted-foreground"
                  )} />
                  {computedHasUpdates && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  )}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className={cn(
              "font-medium",
              computedHasUpdates && "bg-red-500 text-white border-red-500"
            )}>
              <div className="flex items-center gap-2">
                <span>v{currentVersion}</span>
                {computedHasUpdates && <span className="text-red-100">— Novidades!</span>}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          /* Modo expandido: dois pills lado a lado */
          <div className="flex items-center gap-2 px-3 py-1">
            {/* Pill 1: versão com ponto pulsante */}
            <button
              onClick={handleOpenChangelog}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <span className="text-xs font-mono font-medium text-muted-foreground">v{currentVersion}</span>
                  {computedHasUpdates ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  ) : (
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/40" />
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Pill 2: Novidades com ícone e badge (só aparece quando há novidades) */}
            {computedHasUpdates && totalNewItems > 0 && (
              <button
                onClick={handleOpenChangelog}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Novidades</span>
                <Badge className="bg-primary text-white text-[9px] px-1.5 py-0 h-4">{totalNewItems}</Badge>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sheet lateral com changelog */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[30vw] sm:max-w-[30vw] p-0 overflow-hidden [&>button]:hidden"
        >
          <div className="h-full flex flex-col overflow-hidden">
            <SheetTitle className="sr-only">Novidades da Plataforma</SheetTitle>
            <SheetDescription className="sr-only">Acompanhe as atualizações da plataforma Mindi</SheetDescription>
            {/* Header do Sheet */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary/10">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Novidades da Plataforma</h2>
                  <p className="text-xs text-muted-foreground">Acompanhe as atualizações</p>
                </div>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : versions && versions.length > 0 ? (
                <SidebarMindiSplit versions={versions} />
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma novidade publicada ainda</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
