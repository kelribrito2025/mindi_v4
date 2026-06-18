import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  CreditCard,
  Banknote,
  Printer,
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Inbox,
  Star,
  LayoutGrid,
  List,
  Eye,
  Utensils,
  Wifi,
  Timer,
  Volume2,
  VolumeX,
  Trash2,
  Pencil,
  Check,
  X,
  RefreshCw,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { normalizeSSEOrder, insertOrderIntoList } from "@/lib/normalizeSSEOrder";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type OrderStatus = "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled" | "pending_confirmation";

// Configuração das colunas Kanban (sem "out_for_delivery" pois mesa não tem entrega)
const kanbanColumns = [
  {
    id: "new" as OrderStatus,
    title: "Novos",
    color: "blue",
    borderColor: "border-t-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
    barColor: "bg-blue-500",
    qtyColor: "text-blue-600",
    placeholderBorder: "border-blue-300 dark:border-blue-800",
    placeholderBg: "bg-blue-50 dark:bg-blue-950/30",
    placeholderText: "text-blue-500",
    tabBg: "bg-blue-100 dark:bg-blue-950/50",
    tabText: "text-blue-700 dark:text-blue-300",
    tabBorder: "border-blue-200 dark:border-blue-800",
    badgeBg: "bg-blue-500",
    icon: Clock,
  },
  {
    id: "preparing" as OrderStatus,
    title: "Preparo",
    color: "red",
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconColor: "text-red-500",
    dotColor: "bg-red-500",
    barColor: "bg-red-500",
    qtyColor: "text-red-500",
    placeholderBorder: "border-red-300 dark:border-red-500",
    placeholderBg: "bg-red-50/50 dark:bg-red-950/30",
    placeholderText: "text-red-500",
    tabBg: "bg-red-100 dark:bg-red-950/50",
    tabText: "text-red-500 dark:text-red-300",
    tabBorder: "border-red-200 dark:border-red-500",
    badgeBg: "bg-red-500",
    icon: ChefHat,
  },
  {
    id: "ready" as OrderStatus,
    title: "Prontos",
    color: "emerald",
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    barColor: "bg-emerald-500",
    qtyColor: "text-emerald-600",
    placeholderBorder: "border-emerald-300 dark:border-emerald-800",
    placeholderBg: "bg-emerald-50/50 dark:bg-emerald-950/30",
    placeholderText: "text-emerald-500",
    tabBg: "bg-emerald-100 dark:bg-emerald-950/50",
    tabText: "text-emerald-700 dark:text-emerald-300",
    tabBorder: "border-emerald-200 dark:border-emerald-800",
    badgeBg: "bg-emerald-500",
    icon: Package,
  },
  {
    id: "completed" as OrderStatus,
    title: "Completos",
    color: "gray",
    borderColor: "border-t-muted-foreground/50",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground/50",
    barColor: "bg-gray-400",
    qtyColor: "text-gray-500",
    placeholderBorder: "border-border",
    placeholderBg: "bg-muted/50",
    placeholderText: "text-muted-foreground",
    tabBg: "bg-gray-200 dark:bg-gray-800",
    tabText: "text-gray-700 dark:text-gray-300",
    tabBorder: "border-gray-300 dark:border-gray-700",
    badgeBg: "bg-gray-400",
    icon: CheckCircle2,
  },
];

const statusConfig: Record<OrderStatus, { 
  label: string; 
  variant: "success" | "warning" | "error" | "info" | "default";
  icon: typeof Clock;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", badgeBg: "#3b82f6", badgeText: "#ffffff" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#ef4444", badgeText: "#ffffff" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", badgeBg: "#059669", badgeText: "#ffffff" },
  out_for_delivery: { label: "Em entrega", variant: "info", icon: Package, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", badgeBg: "#ea580c", badgeText: "#ffffff" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-muted-foreground", bgColor: "bg-muted", badgeBg: "#6b7280", badgeText: "#ffffff" },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#ef4444", badgeText: "#ffffff" },
  pending_confirmation: { label: "Aguardando", variant: "default", icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30", badgeBg: "#d97706", badgeText: "#ffffff" },
};

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  pix_online: { label: "Pix Online", icon: QrCode },
  boleto: { label: "Boleto", icon: CreditCard },
  card_online: { label: "Cartão Online", icon: CreditCard },
};

// Hook para contador em tempo real
function useElapsedTime(createdAt: string | number | Date) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const created = new Date(createdAt).getTime();
      const diffMs = now - created;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      
      if (diffMin < 1) {
        setElapsed("agora");
      } else if (diffMin < 60) {
        setElapsed(`${diffMin}min`);
      } else {
        const mins = diffMin % 60;
        setElapsed(`${diffHours}h${mins > 0 ? `${mins}m` : ""}`);
      }
    };

    update();
    const interval = setInterval(update, 15000); // Atualiza a cada 15s
    return () => clearInterval(interval);
  }, [createdAt]);

  return elapsed;
}

// Componente para exibir o tempo decorrido (para evitar re-render do card inteiro)
function ElapsedTimer({ createdAt, className }: { createdAt: string | number | Date; className?: string }) {
  const elapsed = useElapsedTime(createdAt);
  return (
    <span className={className}>
      <Timer className="h-3.5 w-3.5 inline mr-1" />
      {elapsed}
    </span>
  );
}

export default function Cozinha() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearColumnTarget, setClearColumnTarget] = useState<OrderStatus | null>(null);
  // --- Edição de títulos de status ---
  const [editingStatusLabel, setEditingStatusLabel] = useState<OrderStatus | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState("");
  const defaultStatusLabels: Record<string, string> = {
    new: "Novos",
    preparing: "Preparo",
    ready: "Prontos",
    completed: "Completos",
    cancelled: "Cancelados",
  };
  const customStatusLabels = establishment?.customStatusLabels as Record<string, string> | null | undefined;
  const getStatusLabel = useCallback((statusId: string) => {
    return customStatusLabels?.[statusId] || defaultStatusLabels[statusId] || statusId;
  }, [customStatusLabels]);
  const updateStatusLabelMutation = trpc.establishment.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
      toast.success("Título atualizado!");
    },
    onError: (err) => { console.error('[StatusLabel] Erro:', err); toast.error("Erro ao atualizar título: " + (err?.message || 'desconhecido')); },
  });
  const handleSaveStatusLabel = (statusId: OrderStatus) => {
    if (!establishment) return;
    const trimmed = editingStatusValue.trim();
    if (!trimmed) {
      toast.error("O título não pode ficar vazio");
      return;
    }
    const newLabels = { ...(customStatusLabels || {}), [statusId]: trimmed };
    updateStatusLabelMutation.mutate({ id: establishment.id, customStatusLabels: newLabels });
    setEditingStatusLabel(null);
  };
  const handleRestoreStatusLabel = (statusId: OrderStatus) => {
    if (!establishment) return;
    const newLabels = { ...(customStatusLabels || {}) };
    delete newLabels[statusId];
    const hasLabels = Object.keys(newLabels).length > 0;
    updateStatusLabelMutation.mutate({ id: establishment.id, customStatusLabels: hasLabels ? newLabels : null });
    toast.success("Título restaurado!");
  };
  // --- Fim edição de títulos ---

  const [expandedColumns, setExpandedColumns] = useState<Set<OrderStatus>>(() => new Set<OrderStatus>(["new"]));
  const [manuallyClearedColumns, setManuallyClearedColumns] = useState<Set<OrderStatus>>(() => {
    try {
      const stored = localStorage.getItem('cozinha_clearedColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        const clearedDate = new Date(parsed.timestamp);
        const now = new Date();
        if (clearedDate.toDateString() !== now.toDateString()) {
          localStorage.removeItem('cozinha_clearedColumns');
          return new Set();
        }
        return new Set(parsed.columns as OrderStatus[]);
      }
    } catch {}
    return new Set();
  });
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('cozinha_viewMode') as 'kanban' | 'list' | null;
      if (saved) return saved;
      return window.innerWidth < 768 ? 'kanban' : 'list';
    } catch { return window.innerWidth < 768 ? 'kanban' : 'list'; }
  });
  const [listStatusFilter, setListStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [listPage, setListPage] = useState(0);
  const LIST_PAGE_SIZE = 40;
  useEffect(() => { setListPage(0); }, [listStatusFilter]);

  // Sound state - INDEPENDENT from Admin (uses separate localStorage key)
  // Comportamento igual ao Admin: som desativado por padrão ao carregar/recarregar a página
  const { unlockAudio, isAudioUnlocked } = useNewOrders();
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Se já foi montado nesta "vida" da página (navegação SPA), preservar estado
    if ((window as any).__cozinhaSoundMounted === true) {
      return localStorage.getItem("cozinhaSoundEnabled") === "true";
    }
    // Reload real (F5) ou primeiro acesso / nova aba: forçar desativado
    return false;
  });
  const soundEnabledRef = useRef(isSoundEnabled);

  // Keep ref in sync
  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Na montagem: forçar desativado se for reload/novo acesso
  useEffect(() => {
    if ((window as any).__cozinhaSoundMounted !== true) {
      // Reload real (F5, novo acesso, nova aba) — forçar desativado
      localStorage.setItem("cozinhaSoundEnabled", "false");
      (window as any).__cozinhaSoundMounted = true;
    }

    // Ouvir mudanças no localStorage (para sincronizar entre abas)
    const syncSoundState = (e: StorageEvent) => {
      if (e.key === "cozinhaSoundEnabled") {
        setIsSoundEnabled(e.newValue === "true");
      }
    };
    window.addEventListener("storage", syncSoundState);
    return () => window.removeEventListener("storage", syncSoundState);
  }, []);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  const utils = trpc.useUtils();

  // Query para buscar pedidos do PDV (source: 'pdv')
  const { data: allOrdersData, refetch: refetchAll, isLoading } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId ?? 0,
      source: 'pdv',
    },
    { 
      enabled: !!establishmentId && establishmentId > 0,
      refetchInterval: false,
    }
  );

  // Play sound directly for Cozinha (independent from Admin singleton)
  // Usa som personalizado da cozinha (CDN)
  const COZINHA_SOUND_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/kitchen-notification_db9a5b26.wav";
  const cozinhaAudioRef = useRef<HTMLAudioElement | null>(null);

  // Pré-carregar o áudio da cozinha
  useEffect(() => {
    const audio = new Audio(COZINHA_SOUND_URL);
    audio.preload = "auto";
    audio.volume = 0.7;
    cozinhaAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      cozinhaAudioRef.current = null;
    };
  }, []);

  const playCozinhaSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      // Tentar reutilizar o áudio pré-carregado
      if (cozinhaAudioRef.current) {
        cozinhaAudioRef.current.currentTime = 0;
        cozinhaAudioRef.current.volume = 0.7;
        cozinhaAudioRef.current.play().catch(err => {
          console.log("[Cozinha] Erro ao tocar som pré-carregado, tentando novo:", err);
          // Fallback: criar novo elemento de áudio
          const fallback = new Audio(COZINHA_SOUND_URL);
          fallback.volume = 0.7;
          fallback.play().catch(e => console.log("[Cozinha] Erro no fallback:", e));
        });
      } else {
        const audio = new Audio(COZINHA_SOUND_URL);
        audio.volume = 0.7;
        audio.play().catch(err => {
          console.log("[Cozinha] Erro ao tocar som:", err);
        });
      }
    } catch (err) {
      console.log("[Cozinha] Erro ao criar áudio:", err);
    }
  }, []);

  // SSE handlers
  const handleNewOrder = useCallback((order: unknown) => {
    if (order && typeof order === 'object' && 'id' in order) {
      try {
        const normalized = normalizeSSEOrder(order as any);
        if ((normalized as any).source === 'pdv') {
          utils.orders.list.setData(
            { establishmentId: establishmentId ?? 0, source: 'pdv' },
            (old: any) => {
              if (!old) return old;
              const updatedOrders = insertOrderIntoList(old.orders as any[], normalized);
              return { ...old, orders: updatedOrders };
            }
          );
          // Play sound independently for Cozinha
          playCozinhaSound();
        }
      } catch (e) {
        console.error("[Cozinha] Erro no optimistic update:", e);
      }
    }
    refetchAll();
  }, [refetchAll, utils, establishmentId, playCozinhaSound]);

  const handleOrderUpdate = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const handleSSEConnected = useCallback(() => {
    console.log("[Cozinha] SSE conectado");
  }, []);

  const handleSSEDisconnected = useCallback(() => {
    console.log("[Cozinha] SSE desconectado - polling fallback");
    refetchAll();
  }, [refetchAll]);

  const { status: sseStatus, isConnected: sseConnected } = useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    onConnected: handleSSEConnected,
    onDisconnected: handleSSEDisconnected,
    enabled: !!establishmentId && establishmentId > 0,
  });

  // Fallback polling
  useEffect(() => {
    if (!establishmentId || sseConnected) return;
    const interval = setInterval(() => {
      refetchAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [establishmentId, sseConnected, refetchAll]);

  const allOrders = allOrdersData?.orders || [];

  const { data: orderDetails, isLoading: orderDetailsLoading, isFetching: orderDetailsFetching } = trpc.orders.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  // Printer settings
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 }
  );
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;

  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      utils.printer.getSettings.invalidate();
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });

  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    if (!establishmentId) return;
    updatePrintMethodMutation.mutate({
      establishmentId,
      defaultPrintMethod: method,
    });
  };

  const { decrementCount } = useNewOrders();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onMutate: async (variables) => {
      await utils.orders.list.cancel();
      const previousAllOrders = utils.orders.list.getData({ establishmentId: establishmentId ?? 0, source: 'pdv' });
      utils.orders.list.setData(
        { establishmentId: establishmentId ?? 0, source: 'pdv' },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map(order => 
              order.id === variables.id 
                ? { ...order, status: variables.status, cancellationReason: variables.cancellationReason || order.cancellationReason }
                : order
            ),
          };
        }
      );
      const order = previousAllOrders?.orders?.find(o => o.id === variables.id);
      if (order?.status === "new" && variables.status !== "new") {
        decrementCount();
      }
      return { previousAllOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousAllOrders) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0, source: 'pdv' },
          context.previousAllOrders
        );
      }
      toast.error("Erro ao atualizar status do pedido");
    },
    onSettled: () => {
      utils.orders.list.invalidate();
    },
    onSuccess: (_result, variables) => {
      const statusLabels: Record<string, string> = {
        preparing: "Pedido aceito e em preparo!",
        ready: "Pedido pronto!",
        completed: "Pedido finalizado!",
        cancelled: "Pedido cancelado.",
      };
      toast.success(statusLabels[variables.status] || "Status atualizado!");
    },
  });

  // Print functions
  const handlePrintOrder = () => {
    if (!orderDetails) return;
    const receiptUrl = `${window.location.origin}/api/print/receipt/${orderDetails.id}`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = receiptUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  };

  const handlePrintOrderDirect = async (orderId: number) => {
    try {
      const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = receiptUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    } catch (error) {
      toast.error("Erro ao imprimir pedido");
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const executeStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus },
      {
        onSettled: () => {
          setLoadingOrderId(null);
        },
      }
    );
    
    if (newStatus === "preparing") {
      const printMethod = printerSettings?.defaultPrintMethod || 'normal';
      if (printMethod === 'automatic') {
        toast.success("Pedido aceito!", {
          description: "Impressão automática enviada para o Mindi Printer.",
          duration: 4000,
        });
      } else {
        toast.success("Pedido aceito!", {
          description: "Abrindo tela de impressão...",
          duration: 4000,
        });
        setTimeout(() => {
          handlePrintOrderDirect(orderId);
        }, 300);
      }
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    executeStatusUpdate(orderId, newStatus);
  };

  const handleCancelOrder = () => {
    if (orderToCancel) {
      updateStatusMutation.mutate(
        { id: orderToCancel, status: "cancelled", cancellationReason: cancellationReason || undefined },
        {
          onSuccess: () => {
            setCancelDialogOpen(false);
            setOrderToCancel(null);
            setCancellationReason("");
          },
        }
      );
    }
  };

  const getNextAction = (status: OrderStatus): { label: string; newStatus: OrderStatus } | null => {
    switch (status) {
      case "new":
        return { label: "Aceitar", newStatus: "preparing" };
      case "preparing":
        return { label: "Pronto", newStatus: "ready" };
      case "ready":
        return { label: "Finalizar", newStatus: "completed" };
      default:
        return null;
    }
  };

  const toggleColumnExpansion = (columnId: OrderStatus) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  // Filtrar pedidos do dia
  const getTodayStartInTimezone = (tz: string): Date => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(now);
    const [year, month, day] = todayStr.split('-').map(Number);
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    });
    const parts = utcFormatter.formatToParts(now);
    const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || '';
    const offsetMatch = tzOffset.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
    let offsetMinutes = 0;
    if (offsetMatch) {
      const sign = offsetMatch[1] === '-' ? -1 : 1;
      const hours = parseInt(offsetMatch[2] || '0');
      const mins = parseInt(offsetMatch[3] || '0');
      offsetMinutes = sign * (hours * 60 + mins);
    }
    const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000);
    return todayStart;
  };

  const restaurantTimezone = establishment?.timezone || 'America/Sao_Paulo';
  const todayStart = getTodayStartInTimezone(restaurantTimezone);

  const filteredOrders = allOrders;

  const [clearTimestamps, setClearTimestamps] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('cozinha_clearedColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        const clearedAt = new Date(parsed.timestamp || parsed.clearedAt?.completed || parsed.clearedAt?.cancelled || Date.now());
        const now = new Date();
        if (clearedAt.toDateString() !== now.toDateString()) {
          localStorage.removeItem('cozinha_clearedColumns');
          return {};
        }
        return parsed.clearedAt || {};
      }
    } catch {}
    return {};
  });

  type OrderItem = typeof allOrders[number];
  const ordersByStatus: Record<string, OrderItem[]> = {
    new: filteredOrders?.filter((o: OrderItem) => o.status === "new") ?? [],
    preparing: filteredOrders?.filter((o: OrderItem) => o.status === "preparing") ?? [],
    ready: filteredOrders?.filter((o: OrderItem) => o.status === "ready" || o.status === "out_for_delivery") ?? [],
    completed: filteredOrders?.filter((o: OrderItem) => {
      if (o.status !== "completed") return false;
      const orderTime = new Date(o.updatedAt || o.createdAt);
      if (orderTime < todayStart) return false;
      if (clearTimestamps.completed) {
        const clearedAt = new Date(clearTimestamps.completed);
        if (orderTime <= clearedAt) return false;
      }
      return true;
    }) ?? [],
    cancelled: filteredOrders?.filter((o: OrderItem) => {
      if (o.status !== "cancelled") return false;
      const orderTime = new Date(o.updatedAt || o.createdAt);
      if (orderTime < todayStart) return false;
      if (clearTimestamps.cancelled) {
        const clearedAt = new Date(clearTimestamps.cancelled);
        if (orderTime <= clearedAt) return false;
      }
      return true;
    }) ?? [],
  };

  // Reset diário
  useEffect(() => {
    if (manuallyClearedColumns.size === 0) return;
    const checkReset = () => {
      try {
        const stored = localStorage.getItem('cozinha_clearedColumns');
        if (stored) {
          const parsed = JSON.parse(stored);
          const clearedAt = new Date(parsed.timestamp);
          if (clearedAt < todayStart) {
            localStorage.removeItem('cozinha_clearedColumns');
            setManuallyClearedColumns(new Set());
          }
        }
      } catch {}
    };
    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [todayStart, manuallyClearedColumns.size]);

  const handleManualClear = (columnId: OrderStatus) => {
    const now = new Date().toISOString();
    setClearTimestamps(prev => {
      const next = { ...prev, [columnId]: now };
      try {
        localStorage.setItem('cozinha_clearedColumns', JSON.stringify({
          clearedAt: next,
          timestamp: now,
        }));
      } catch {}
      return next;
    });
    setManuallyClearedColumns(prev => {
      const next = new Set(prev);
      next.add(columnId);
      return next;
    });
    toast.success(columnId === "completed" ? "Pedidos completos limpos" : "Pedidos cancelados limpos");
  };

  // Helper: extrair número da mesa do pedido
  const getTableLabel = (order: OrderItem) => {
    const tableNum = (order as any).tableNumber || (order as any).tableName;
    if (tableNum) return `Mesa ${tableNum}`;
    if (order.customerName?.toLowerCase().startsWith('mesa')) return order.customerName;
    return order.customerName || 'Mesa';
  };

  // Handle sound toggle
  const handleSoundToggle = async (checked: boolean) => {
    const playTestSound = () => {
      setTimeout(() => {
        const testAudio = new Audio(COZINHA_SOUND_URL);
        testAudio.volume = 0.5;
        testAudio.play().catch(err => {
          console.log("[Som] Erro ao tocar som de teste:", err);
        });
      }, 100);
    };
    
    if (checked) {
      if (!isAudioUnlocked) {
        await unlockAudio();
      }
      setIsSoundEnabled(true);
      localStorage.setItem("cozinhaSoundEnabled", "true");
      playTestSound();
      toast.success("Som da Cozinha ativado!", {
        description: "Notificações sonoras para pedidos PDV.",
      });
    } else {
      setIsSoundEnabled(false);
      localStorage.setItem("cozinhaSoundEnabled", "false");
      toast.info("Som da Cozinha desativado");
    }
  };

  // Handle back to admin
  const handleBackToAdmin = () => {
    // If opened in new tab, try to close or navigate
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Topbar simplificada */}
      <header className="h-14 border-b border-border/50 bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-red-500" />
            <div className="flex flex-col">
              <h1 className="font-bold text-lg leading-tight">Cozinha</h1>
              {establishment?.name && (
                <span className="text-xs text-muted-foreground leading-tight">{establishment.name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Kanban/Lista */}
          <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => { setViewMode('kanban'); localStorage.setItem('cozinha_viewMode', 'kanban'); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                viewMode === 'kanban'
                  ? "bg-white dark:bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-[15px] w-[15px]" />
              Kanban
            </button>
            <button
              onClick={() => { setViewMode('list'); localStorage.setItem('cozinha_viewMode', 'list'); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                viewMode === 'list'
                  ? "bg-white dark:bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-[15px] w-[15px]" />
              Lista
            </button>
          </div>

          {/* Botão de Som */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-accent bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={isSoundEnabled ? "#10b981" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-colors">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={isSoundEnabled ? "#10b981" : "#f87171"} />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <Switch
                  checked={isSoundEnabled}
                  onCheckedChange={handleSoundToggle}
                  className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 dark:data-[state=unchecked]:bg-red-500 scale-90"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isSoundEnabled
                ? "Som ativado - clique para desativar"
                : "Som desativado - clique para ativar"
              }
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-hidden p-4">
        {/* Kanban Board */}
        {viewMode === 'kanban' && (
        <div className="flex flex-col md:flex-row gap-4 md:gap-3 h-full">
          {kanbanColumns.map((column) => {
            const columnOrders = ordersByStatus[column.id] || [];
            const Icon = column.icon;
            const isExpanded = expandedColumns.has(column.id);

            return (
              <div
                key={column.id}
                className={cn(
                  "flex flex-col rounded-xl border border-border/50 bg-muted/30 overflow-hidden",
                  "md:flex-1 md:min-w-[200px]",
                  column.borderColor,
                  "border-t-4"
                )}
              >
                {/* Column Header */}
                <div
                  className="flex items-center justify-between px-3 py-3 cursor-pointer md:cursor-default"
                  onClick={() => toggleColumnExpansion(column.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2.5 rounded-lg shrink-0", column.iconBg)}>
                      <Icon className={cn("h-5 w-5", column.iconColor)} />
                    </div>
                    <div>
                      {editingStatusLabel === column.id ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingStatusValue}
                            onChange={(e) => setEditingStatusValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveStatusLabel(column.id);
                              if (e.key === 'Escape') setEditingStatusLabel(null);
                            }}
                            className="h-7 text-sm font-semibold px-2 py-0"
                            maxLength={20}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveStatusLabel(column.id)}
                            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </button>
                          <button
                            onClick={() => setEditingStatusLabel(null)}
                            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-base">{column.id === "new" ? column.title : getStatusLabel(column.id)}</h3>
                      )}
                      <span className="text-xs text-muted-foreground">{columnOrders.length} pedido{columnOrders.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 3 pontinhos para editar título (PREPARO, PRONTOS, COMPLETOS - sem NOVOS) */}
                    {column.id !== "new" && column.id !== "cancelled" && editingStatusLabel !== column.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:bg-muted"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStatusValue(getStatusLabel(column.id));
                              setEditingStatusLabel(column.id);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar título
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreStatusLabel(column.id);
                            }}
                            className="cursor-pointer"
                            disabled={!customStatusLabels?.[column.id]}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Restaurar título
                          </DropdownMenuItem>
                          {column.id === "completed" && columnOrders.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClearColumnTarget(column.id);
                                  setClearConfirmOpen(true);
                                }}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpar lista
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <ChevronDown className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200 md:hidden",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </div>

                {/* Column Content */}
                <div className={cn(
                  "flex-1 overflow-y-auto px-3 pb-3 space-y-3 transition-colors duration-200",
                  !isExpanded && "max-h-0 pb-0 overflow-hidden md:max-h-none md:pb-3 md:overflow-y-auto"
                )}>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-card rounded-xl p-4 shadow-sm">
                          <div className="skeleton h-4 w-20 rounded mb-2" />
                          <div className="skeleton h-3 w-full rounded mb-1" />
                          <div className="skeleton h-3 w-2/3 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : columnOrders.length > 0 ? (
                    <AnimatePresence mode="popLayout" initial={false}>
                    {columnOrders.map((order: OrderItem) => {
                      const displayStatus = column.id === 'ready' ? 'ready' : order.status;
                      const config = statusConfig[displayStatus as OrderStatus] || statusConfig.new;
                      const nextAction = getNextAction(order.status as OrderStatus);
                      const tableLabel = getTableLabel(order);

                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{
                            layout: { type: "spring", stiffness: 500, damping: 35 },
                            opacity: { duration: 0.2, ease: "easeInOut" },
                            y: { duration: 0.2, ease: "easeOut" },
                            scale: { duration: 0.15, ease: "easeOut" },
                          }}
                          className="bg-card rounded-xl border border-border/50 shadow-soft hover:shadow-elevated transition-shadow duration-200"
                        >
                          {/* Header colorido */}
                          <div className={cn("px-3 py-2 flex items-center justify-between rounded-t-xl", config.bgColor)} style={{height: '48px'}}>
                            <div className="flex items-center gap-3">
                              <div className={cn("p-1.5 rounded-full bg-card/90 shadow-sm", config.color)}>
                                <Utensils className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className={cn("font-bold text-sm", config.color)}>
                                    {tableLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ElapsedTimer
                              createdAt={order.createdAt}
                              className={cn("flex items-center gap-1 text-xs font-semibold", config.color)}
                            />
                          </div>

                          {/* Items list */}
                          {order.items && order.items.length > 0 && (
                            <div className="px-3 py-1.5">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx}>
                                  {/* Separador entre itens quando há 2+ produtos */}
                                  {idx > 0 && order.items.length >= 2 && (
                                    <div className="border-t border-border/40 my-1" />
                                  )}
                                  <div className="flex items-center gap-2 py-0.5">
                                    <div className="flex items-center gap-1 shrink-0">
                                      <div className={cn("w-[3px] h-4 rounded-full", column.barColor)} />
                                      <span className={cn("text-xs font-bold", column.qtyColor)}>{item.quantity}x</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-normal text-foreground uppercase leading-tight">{item.productName}</span>
                                      {item.complements?.map((c: any, ci: number) => (
                                        <p key={ci} className="text-[11px] text-muted-foreground mt-0.5 pl-0.5">+ {c.quantity > 1 ? `${c.quantity}x ` : ''}{c.name}</p>
                                      ))}
                                      {item.notes && (
                                        <div className="flex items-start gap-1 mt-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5">
                                          <span className="text-amber-600 text-[10px] font-semibold shrink-0">OBS:</span>
                                          <span className="text-[10px] text-amber-700 dark:text-amber-400">{item.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Content */}
                          <div className="px-3 py-2">
                            {/* Actions */}
                            <div className="flex gap-1.5 mt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-72">
                                  <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handlePrintOrderDirect(order.id)}>
                                    <div className="flex items-center">
                                      <Printer className="h-4 w-4 mr-2" />
                                      <span className="text-sm">Impressão Normal</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavoritePrintMethod('normal');
                                      }}
                                      className="p-1 hover:bg-accent-foreground/10 rounded"
                                    >
                                      <Star 
                                        className={cn(
                                          "h-4 w-4 transition-colors",
                                          printerSettings?.defaultPrintMethod === 'normal' 
                                            ? "fill-amber-500 text-amber-500" 
                                            : "text-amber-500"
                                        )} 
                                      />
                                    </button>
                                  </div>
                                  {hasMindiPrinterApiKey && (
                                    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                                      toast.info("Impressão automática", {
                                        description: "A impressão automática é enviada via Mindi Printer ao receber o pedido.",
                                        duration: 5000,
                                      });
                                    }}>
                                      <div className="flex items-center">
                                        <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                                        <span className="text-sm">Impressão Automática</span>
                                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">Mindi</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFavoritePrintMethod('automatic');
                                        }}
                                        className="p-1 hover:bg-accent-foreground/10 rounded"
                                      >
                                        <Star 
                                          className={cn(
                                            "h-4 w-4 transition-colors",
                                            printerSettings?.defaultPrintMethod === 'automatic' 
                                              ? "fill-amber-500 text-amber-500" 
                                              : "text-amber-500"
                                          )} 
                                        />
                                      </button>
                                    </div>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                                onClick={() => setSelectedOrder(order.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {nextAction && (
                                <Button
                                  size="sm"
                                  className="h-8 px-4 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 flex-1"
                                  style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                                  onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                                  disabled={loadingOrderId !== null}
                                >
                                  {loadingOrderId === order.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    nextAction.label
                                  )}
                                </Button>
                              )}

                              {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                                  onClick={() => {
                                    setOrderToCancel(order.id);
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  ) : (
                    <div className={cn("flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl", column.placeholderBorder, column.placeholderBg)}>
                      <Icon className={cn("h-8 w-8 mb-2 opacity-50", column.placeholderText)} />
                      <p className={cn("text-sm font-medium", column.placeholderText)}>Nenhum pedido</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
        <div className="h-full flex flex-col">
          {/* Status filter tabs - mesmo estilo da página de Pedidos */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setListStatusFilter('all')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border whitespace-nowrap",
                listStatusFilter === 'all' ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700" : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Todos
              <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold bg-gray-500 text-white">
                {filteredOrders?.length || 0}
              </span>
            </button>
            {kanbanColumns.map(col => {
              const count = (ordersByStatus[col.id] || []).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setListStatusFilter(col.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border whitespace-nowrap",
                    listStatusFilter === col.id ? `${col.tabBg} ${col.tabText} ${col.tabBorder}` : "bg-card border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("w-2.5 h-2.5 rounded-full", col.dotColor)} />
                  {col.title}
                  <span className={cn("min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold text-white", col.badgeBg)}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden flex-1 flex flex-col">
            {/* Table header */}
            <div className="grid grid-cols-[100px_80px_120px_1fr_150px] gap-3 px-5 py-3 bg-muted/50 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Status</span>
              <span>Tempo</span>
              <span>Mesa</span>
              <span>Itens</span>
              <span className="text-right">Ações</span>
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/30">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Carregando pedidos...</p>
                </div>
              ) : (() => {
                const listOrders = listStatusFilter === 'all'
                  ? filteredOrders || []
                  : ordersByStatus[listStatusFilter] || [];

                if (listOrders.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Inbox className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
                    </div>
                  );
                }

                const paginatedOrders = listOrders.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE);
                return paginatedOrders.map((order: OrderItem) => {
                  const config = statusConfig[order.status as OrderStatus] || statusConfig.new;
                  const nextAction = getNextAction(order.status as OrderStatus);
                  const tableLabel = getTableLabel(order);

                  return (
                    <div
                      key={order.id}
                      className="grid grid-cols-[100px_80px_120px_1fr_150px] gap-3 px-5 py-3.5 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      {/* Status badge */}
                      <span
                        className="inline-flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                      >
                        {config.label}
                      </span>

                      {/* Tempo decorrido */}
                      <ElapsedTimer
                        createdAt={order.createdAt}
                        className="text-sm font-semibold text-foreground/80 flex items-center"
                      />

                      {/* Mesa */}
                      <span className="text-sm font-medium truncate flex items-center gap-1.5">
                        <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
                        {tableLabel}
                      </span>

                      {/* Itens */}
                      <div className="text-sm text-foreground/80 truncate">
                        {order.items && order.items.length > 0 ? (
                          <span>
                            {order.items.map((item: any, idx: number) => (
                              <span key={idx}>
                                {idx > 0 && <span className="text-muted-foreground mx-1">&middot;</span>}
                                <span className="font-semibold text-primary">{item.quantity}x</span>{' '}
                                <span className="font-medium">{item.productName}</span>
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Sem itens</span>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        {nextAction && (
                          <Button
                            size="sm"
                            className="h-8 px-4 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90"
                            style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                            onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                            disabled={loadingOrderId !== null}
                          >
                            {loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              nextAction.label
                            )}
                          </Button>
                        )}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                            onClick={() => {
                              setOrderToCancel(order.id);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              {(() => {
                const listOrders = listStatusFilter === 'all'
                  ? filteredOrders || []
                  : ordersByStatus[listStatusFilter] || [];
                const totalPages = Math.ceil(listOrders.length / LIST_PAGE_SIZE);
                if (totalPages <= 1) return null;
                return (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/30">
                    <span className="text-sm text-muted-foreground">
                      {listPage * LIST_PAGE_SIZE + 1}-{Math.min((listPage + 1) * LIST_PAGE_SIZE, listOrders.length)} de {listOrders.length} pedidos
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={listPage === 0}
                        onClick={() => setListPage(p => p - 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </button>
                      <span className="text-sm font-medium text-muted-foreground">
                        {listPage + 1} / {totalPages}
                      </span>
                      <button
                        disabled={listPage >= totalPages - 1}
                        onClick={() => setListPage(p => p + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Próxima <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Order Details Sidebar */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col" hideCloseButton>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={handlePrintOrder}>
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    <span className="text-sm">Impressão Normal</span>
                  </div>
                </div>
                {hasMindiPrinterApiKey && (
                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                    toast.info("Impressão automática via Mindi Printer");
                  }}>
                    <div className="flex items-center">
                      <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                      <span className="text-sm">Impressão Automática</span>
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">Mindi</span>
                    </div>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(orderDetailsLoading || orderDetailsFetching) && !orderDetails && (
            <div className="overflow-y-auto flex-1 p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-6 w-40 rounded" />
                  <div className="skeleton h-4 w-56 rounded" />
                </div>
                <div className="skeleton h-7 w-24 rounded-lg" />
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="skeleton h-4 w-32 rounded" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-8 w-8 rounded-full" />
                    <div className="skeleton h-4 w-48 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderDetails && (
            <div className="overflow-y-auto flex-1 p-6 space-y-6 animate-in fade-in duration-200">
              {/* Order header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-muted-foreground" />
                    {getTableLabel(orderDetails as any)}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pedido {orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`} - {format(new Date(orderDetails.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <span
                  className="inline-flex items-center py-1.5 px-3 rounded-lg text-xs font-bold uppercase"
                  style={{ backgroundColor: statusConfig[orderDetails.status as OrderStatus]?.badgeBg, color: statusConfig[orderDetails.status as OrderStatus]?.badgeText }}
                >
                  {statusConfig[orderDetails.status as OrderStatus]?.label}
                </span>
              </div>

              {/* Items */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Itens do Pedido
                </h3>
                <div className="space-y-3">
                  {orderDetails.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{item.quantity}x {item.productName}</span>
                        {item.complements?.map((c: any, ci: number) => (
                          <p key={ci} className="text-xs text-muted-foreground ml-4">+ {c.quantity > 1 ? `${c.quantity}x ` : ''}{c.name}{c.price > 0 ? ` R$ ${Number(c.price * (c.quantity || 1)).toFixed(2).replace('.', ',')}` : ''}</p>
                        ))}
                        {item.notes && <p className="text-xs text-amber-600 ml-4">Obs: {item.notes}</p>}
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                {Number(orderDetails.discount) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(orderDetails.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border/50">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>

              {/* Payment info */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamento
                  </span>
                  <span className="text-sm font-medium">
                    {paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-1 text-amber-700 dark:text-amber-400">Observações</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-300">{orderDetails.notes}</p>
                </div>
              )}

              {/* Actions */}
              {orderDetails.status !== 'completed' && orderDetails.status !== 'cancelled' && (
                <div className="flex gap-2">
                  {(() => {
                    const nextAction = getNextAction(orderDetails.status as OrderStatus);
                    if (!nextAction) return null;
                    const config = statusConfig[orderDetails.status as OrderStatus] || statusConfig.new;
                    return (
                      <Button
                        className="flex-1 h-10 rounded-xl font-semibold shadow-sm text-white"
                        style={{ backgroundColor: config.badgeBg }}
                        onClick={() => handleStatusUpdate(orderDetails.id, nextAction.newStatus)}
                        disabled={loadingOrderId !== null}
                      >
                        {loadingOrderId === orderDetails.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          nextAction.label
                        )}
                      </Button>
                    );
                  })()}
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl font-semibold border-red-200 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      setOrderToCancel(orderDetails.id);
                      setCancelDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Motivo do cancelamento (opcional)</label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Cliente desistiu, item indisponível..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialogOpen(false); setOrderToCancel(null); setCancellationReason(""); }}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Column Confirm Dialog */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Limpar coluna</DialogTitle>
            <DialogDescription>
              Os pedidos serão removidos da visualização, mas continuarão salvos no sistema. A coluna será restaurada automaticamente à meia-noite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (clearColumnTarget) {
                  handleManualClear(clearColumnTarget);
                }
                setClearConfirmOpen(false);
                setClearColumnTarget(null);
              }}
            >
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
