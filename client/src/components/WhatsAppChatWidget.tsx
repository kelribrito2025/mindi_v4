import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePreference } from "@/hooks/usePreference";
import React from "react";
import { trpc } from "@/lib/trpc";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { cn } from "@/lib/utils";
import { ChatOrderBar } from "@/components/ChatOrderBar";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ArrowLeft,
  CheckCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Truck,
  Zap,
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  WifiOff,
  QrCode,
  Loader2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getConversations,
  getMessages,
  markConversationAsRead,
  getTotalUnreadCount,
  processIncomingMessage,
  addOutgoingMessage,
  updateConversationStatus,
  type LocalConversation,
  type LocalMessage,
} from "@/lib/chatStorage";


type PublicConversationRow = {
  orderId: number;
  orderNumber?: string | number | null;
  customerPhone: string;
  customerName?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: Date | string | number | null;
  unreadCount?: number | string | null;
  orderStatus?: string | null;
};

type PublicChatMessageRow = {
  id: number | string;
  orderId: number;
  customerPhone?: string | null;
  customerName?: string | null;
  content: string;
  direction: "incoming" | "outgoing";
  mediaUrl?: string | null;
  mediaType?: string | null;
  isRead?: boolean;
  createdAt: Date | string | number;
};

const PUBLIC_CHAT_PREFIX = "public_chat_";

function isPublicConversationId(id: string | null | undefined): boolean {
  return !!id?.startsWith(PUBLIC_CHAT_PREFIX);
}

function getPublicOrderIdFromConversationId(id: string | null | undefined): number | null {
  if (!isPublicConversationId(id)) return null;
  const orderId = Number(id!.slice(PUBLIC_CHAT_PREFIX.length));
  return Number.isFinite(orderId) && orderId > 0 ? orderId : null;
}

function toMillis(ts: Date | string | number | null | undefined): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  const value = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
  return Number.isFinite(value) ? value : 0;
}

function mapPublicConversationToLocal(conv: PublicConversationRow): LocalConversation {
  const orderLabel = conv.orderNumber ? `Pedido #${conv.orderNumber}` : `Pedido #${conv.orderId}`;
  return {
    id: `${PUBLIC_CHAT_PREFIX}${conv.orderId}`,
    phone: conv.customerPhone || "",
    contactName: conv.customerName || orderLabel,
    profilePicUrl: null,
    status: "human",
    unreadCount: Number(conv.unreadCount || 0),
    lastMessageAt: toMillis(conv.lastMessageAt),
    lastMessageText: conv.lastMessage || orderLabel,
  };
}

function mapPublicMessageToLocal(msg: PublicChatMessageRow): LocalMessage {
  return {
    id: `public_${msg.id}`,
    conversationId: `${PUBLIC_CHAT_PREFIX}${msg.orderId}`,
    direction: msg.direction,
    content: msg.content,
    messageType: msg.mediaType || "text",
    mediaUrl: msg.mediaUrl || null,
    createdAt: toMillis(msg.createdAt),
  };
}

// ==================== HELPERS ====================
function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  // Remove country code 55 if present
  const local = clean.startsWith("55") && clean.length >= 12 ? clean.slice(2) : clean;
  if (local.length === 11) {
    // Celular: (88) 9 9929-0000
    const ddd = local.slice(0, 2);
    const first = local.slice(2, 3);
    const mid = local.slice(3, 7);
    const last = local.slice(7);
    return `(${ddd}) ${first} ${mid}-${last}`;
  }
  if (local.length === 10) {
    // Fixo: (88) 9929-0000
    const ddd = local.slice(0, 2);
    const mid = local.slice(2, 6);
    const last = local.slice(6);
    return `(${ddd}) ${mid}-${last}`;
  }
  return phone;
}

function formatTime(ts: Date | string | number): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(ts: Date | string | number): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return phone.slice(-2);
}

/**
 * Resolve display name for a conversation.
 * Cross-references the phone number with the driver phone map.
 * Returns driver name (e.g. "🛵 João (Entregador)") if matched, otherwise original contactName.
 */
function resolveDisplayName(
  contactName: string | null,
  phone: string,
  driverPhoneMap?: Record<string, string> | null
): string | null {
  if (driverPhoneMap) {
    const clean = phone.replace(/\D/g, "");
    const driverName = driverPhoneMap[clean];
    if (driverName) return `🛵 ${driverName} (Entregador)`;
    // Try without country code
    const withoutCountry = clean.startsWith("55") ? clean.slice(2) : clean;
    const driverName2 = driverPhoneMap[withoutCountry];
    if (driverName2) return `🛵 ${driverName2} (Entregador)`;
    // Try with country code
    const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
    const driverName3 = driverPhoneMap[withCountry];
    if (driverName3) return `🛵 ${driverName3} (Entregador)`;
  }
  return contactName;
}

/**
 * Check if a phone number belongs to a registered driver.
 */
function isDriverPhone(
  phone: string,
  driverPhoneMap?: Record<string, string> | null
): boolean {
  if (!driverPhoneMap) return false;
  const clean = phone.replace(/\D/g, "");
  return !!(driverPhoneMap[clean] 
    || driverPhoneMap[clean.startsWith("55") ? clean.slice(2) : clean]
    || driverPhoneMap[clean.startsWith("55") ? clean : `55${clean}`]);
}

function formatPublicOrderLabel(orderNumber: string | number | null | undefined): string {
  const normalized = orderNumber !== null && orderNumber !== undefined ? String(orderNumber).trim() : "";
  if (!normalized) return "Pedido";
  return `Pedido ${normalized.startsWith("#") ? normalized : `#${normalized}`}`;
}

function getPublicOrderLabelFromConversationId(id: string | null | undefined): string {
  const orderId = getPublicOrderIdFromConversationId(id);
  return formatPublicOrderLabel(orderId);
}

function getPublicConversationSubtitle(id: string | null | undefined): string {
  return `Chat do Cardápio • ${getPublicOrderLabelFromConversationId(id)}`;
}

function timeAgo(ts: Date | string | number | null): string {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ==================== SORTABLE SHORTCUT ITEM ====================

const SortableShortcutItem = React.memo(function SortableShortcutItem({
  shortcut,
  isEditing,
  showSend,
  onSend,
  onEdit,
  onDelete,
}: {
  shortcut: any;
  isEditing: boolean;
  showSend: boolean;
  onSend: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `shortcut-${shortcut.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    willChange: isDragging ? "transform" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-xl border",
        isEditing
          ? "border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20"
          : "border-gray-100 dark:border-gray-700/50 hover:border-red-200 dark:hover:border-red-500/40",
        isDragging && "shadow-lg ring-2 ring-red-300 dark:ring-red-500"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/30 flex items-center justify-center">
        <Zap className="h-4 w-4 text-red-500 dark:text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">/{shortcut.title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{shortcut.message}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {showSend && (
          <button
            onClick={onSend}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            title="Enviar agora"
          >
            <Send className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
export function WhatsAppChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null); // remoteJid as ID
  const [filter, setFilter] = useState<"all" | "bot">("all");
  const [messageText, setMessageText] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);

  // ==================== SHORTCUTS STATE ====================
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showShortcutsDropdown, setShowShortcutsDropdown] = useState(false);
  const [shortcutTitle, setShortcutTitle] = useState("");
  const [shortcutMessage, setShortcutMessage] = useState("");
  const [editingShortcutId, setEditingShortcutId] = useState<number | null>(null);
  const [localShortcutsOrder, setLocalShortcutsOrder] = useState<any[] | null>(null);
  const shortcutsDropdownRef = useRef<HTMLDivElement>(null);

  // Highlight/spotlight for new chat feature (shown once, only after onboarding is dismissed)
  const [showHighlight, setShowHighlight] = useState(false);

  // Preferência de highlight persistida no banco
  const [highlightSeenPref, setHighlightSeenPref, highlightPrefLoading] = usePreference('mindi_chat_highlight_seen');

  // Check if onboarding is still active — if so, wait for it to be dismissed before showing highlight
  // The highlight must NOT appear while the welcome sidebar (Sheet) is open
  // Once the user interacts with the highlight (dismiss or "Experimentar agora"), stop polling entirely
  useEffect(() => {
    if (highlightSeenPref === 'true') return; // already seen, don't start polling
    if (highlightPrefLoading) return; // wait for DB preference to load before deciding
    
    let stopped = false;
    
    const checkOnboarding = () => {
      // CRITICAL: Re-check if already dismissed
      if (highlightSeenPref === 'true') {
        stopped = true;
        setShowHighlight(false);
        return;
      }
      
      // 1. Check if the welcome Sheet sidebar is currently visible in the DOM
      const sheetOverlay = document.querySelector('[role="dialog"][data-state="open"]');
      if (sheetOverlay) {
        setShowHighlight(false);
        return;
      }
      
      // 2. Check if the OnboardingFAB rocket button is visible (onboarding still active)
      const fabButton = document.querySelector('button[title="Primeiros Passos"]');
      if (fabButton) {
        setShowHighlight(false);
        return;
      }
      
      // 3. Check localStorage cache as final confirmation (for welcome checklist)
      const keys = Object.keys(localStorage);
      const dismissedKey = keys.find(k => k.startsWith("pref_welcome_checklist_dismissed"));
      const isDismissed = dismissedKey ? localStorage.getItem(dismissedKey) === "true" : false;
      const hasOnboarding = keys.some(k => k.startsWith("pref_welcome_checklist_dismissed"));
      
      if (!hasOnboarding || isDismissed) {
        setShowHighlight(true);
      }
    };
    
    // Delay initial check to let the OnboardingFAB mount and auto-open first
    const initialTimeout = setTimeout(checkOnboarding, 1500);
    // Poll, but stop immediately once the highlight has been dismissed
    const interval = setInterval(() => {
      if (!stopped) checkOnboarding();
    }, 1000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [highlightSeenPref, highlightPrefLoading]);

  const dismissHighlight = useCallback(() => {
    setShowHighlight(false);
    setHighlightSeenPref('true');
  }, [setHighlightSeenPref]);

  // Sound toggle — always starts OFF on page load, atendente ativa manualmente
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // Tooltip "Som desativado" — exibe fixo quando som está desligado.
  // Ao fazer hover no botão, dismiss permanente (até toggle ou reload).
  const [soundTooltipDismissed, setSoundTooltipDismissed] = useState(false);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("mindi_chat_sound", String(next));
      // Reset tooltip dismiss state on toggle so it shows again if user turns off
      setSoundTooltipDismissed(false);
      // Play preview sound when enabling to confirm it works (also unlocks browser autoplay)
      if (next && notificationAudioRef.current) {
        notificationAudioRef.current.currentTime = 0;
        notificationAudioRef.current.play().catch(() => {});
      }
      return next;
    });
  }, []);

  // Global bot enabled status from establishment settings (refetches on window focus)
  const { data: establishment } = trpc.establishment.get.useQuery();
  const globalBotEnabled = establishment?.whatsappBotEnabled ?? true;

  // ==================== WHATSAPP CONNECTION STATUS ====================
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [isPollingQrCode, setIsPollingQrCode] = useState(false);

  const { data: whatsappStatus, refetch: refetchWhatsappStatus } = trpc.whatsapp.getStatus.useQuery(undefined, {
    refetchInterval: isPollingQrCode ? 3000 : 60000,
  });

  const connectWhatsapp = trpc.whatsapp.connect.useMutation({
    onSuccess: (data) => {
      if (data.qrcode) {
        toast.success("QR Code gerado! Escaneie com seu WhatsApp.");
        setIsPollingQrCode(true);
      } else if (data.status === 'connected') {
        toast.success("WhatsApp já está conectado!");
        setShowQrCodeModal(false);
      }
      refetchWhatsappStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar WhatsApp");
    },
  });

  const isWhatsappConnected = whatsappStatus?.status === 'connected';

  // Auto-close QR modal when connected
  useEffect(() => {
    if (isWhatsappConnected && isPollingQrCode) {
      setIsPollingQrCode(false);
      setShowQrCodeModal(false);
      toast.success("WhatsApp conectado com sucesso!");
    }
  }, [isWhatsappConnected, isPollingQrCode]);

  const handleOpenConnectModal = useCallback(() => {
    setShowQrCodeModal(true);
    connectWhatsapp.mutate();
    setIsPollingQrCode(true);
  }, []);

  // Driver phone map for cross-referencing contacts with registered drivers
  const utils = trpc.useUtils();
  const { data: driverPhoneMap } = trpc.whatsappChat.getDriverPhones.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Image/video modal & hover zoom state
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [hoverMediaUrl, setHoverMediaUrl] = useState<string | null>(null);
  const [hoverMediaType, setHoverMediaType] = useState<'image' | 'video'>('image');
  const [hoverImagePos, setHoverImagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverVideoRef = useRef<HTMLVideoElement | null>(null);

  // Local state driven by localStorage
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Trigger to re-read localStorage
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);
  const selectedPublicOrderId = useMemo(
    () => getPublicOrderIdFromConversationId(selectedConvId),
    [selectedConvId]
  );
  const isSelectedPublicConversation = selectedPublicOrderId !== null;
  const { data: publicConversations = [] } = trpc.whatsappChat.getPublicConversations.useQuery(
    undefined,
    {
      enabled: isOpen,
      refetchInterval: isOpen ? 30000 : false,
      refetchOnWindowFocus: true,
    }
  );
  const { data: publicMessages = [] } = trpc.whatsappChat.getPublicMessages.useQuery(
    { orderId: selectedPublicOrderId ?? 0 },
    {
      enabled: isSelectedPublicConversation,
      refetchOnWindowFocus: true,
    }
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isInitialScrollRef = useRef(true);
  const shouldAutoScrollRef = useRef(true);
  const lastMessagesScrollSignatureRef = useRef("");

  const getIsNearMessagesBottom = useCallback(() => {
    const scrollArea = messagesScrollAreaRef.current;
    if (!scrollArea) return true;

    const distanceFromBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
    return distanceFromBottom < 96;
  }, []);

  const handleMessagesScroll = useCallback(() => {
    shouldAutoScrollRef.current = getIsNearMessagesBottom();
  }, [getIsNearMessagesBottom]);

  // Notification sound
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const isOpenRef = useRef(isOpen);
  const selectedConvIdRef = useRef(selectedConvId);

  // Keep refs in sync with state
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);

  useEffect(() => {
    isInitialScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    lastMessagesScrollSignatureRef.current = "";
  }, [selectedConvId]);

  // Preload notification sound
  useEffect(() => {
    const audio = new Audio("https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-notification_2fe6d0fc.wav");
    audio.preload = "auto";
    audio.volume = 0.6;
    notificationAudioRef.current = audio;
  }, []);

  // ==================== CLICK OUTSIDE TO CLOSE ====================
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      // Don't close chat if shortcuts modal is open (modal is outside panelRef)
      const shortcutsModal = document.getElementById('shortcuts-modal-root');
      if (shortcutsModal && shortcutsModal.contains(target)) return;
      // Don't close chat if image modal is open (click on overlay/X closes modal, not chat)
      const imageModal = (target as HTMLElement).closest?.('[data-image-modal]');
      if (imageModal) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsOpen(false);
        setSelectedConvId(null);
        setImageModalUrl(null);
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ==================== READ FROM LOCALSTORAGE ====================
  const localConversations = useMemo(() => {
    const allConvs = getConversations();
    return filter === "all"
      ? allConvs
      : allConvs.filter((c) => c.status === filter);
  }, [filter, refreshTick]);

  const publicConversationItems = useMemo(
    () => (publicConversations as PublicConversationRow[]).map(mapPublicConversationToLocal),
    [publicConversations]
  );

  const getPublicConversationSubtitleWithOrderNumber = useCallback((id: string | null | undefined): string => {
    const orderId = getPublicOrderIdFromConversationId(id);
    const publicConversation = orderId
      ? (publicConversations as PublicConversationRow[]).find((conv) => Number(conv.orderId) === orderId)
      : null;
    const orderNumber = publicConversation?.orderNumber;
    const orderLabel = orderNumber !== null && orderNumber !== undefined && String(orderNumber).trim() !== ""
      ? formatPublicOrderLabel(orderNumber)
      : getPublicOrderLabelFromConversationId(id);

    return `Chat do Cardápio • ${orderLabel}`;
  }, [publicConversations]);

  const combinedConversations = useMemo(() => {
    const base = filter === "bot"
      ? localConversations
      : [...localConversations, ...publicConversationItems];
    return [...base].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [filter, localConversations, publicConversationItems]);

  useEffect(() => {
    setConversations(combinedConversations);
    setUnreadCount(
      getTotalUnreadCount() + publicConversationItems.reduce((sum, c) => sum + c.unreadCount, 0)
    );
  }, [combinedConversations, publicConversationItems]);

  // Read messages when conversation is selected
  useEffect(() => {
    if (selectedPublicOrderId) {
      const serverMessages = (publicMessages as PublicChatMessageRow[]).map(mapPublicMessageToLocal);
      const currentConversationId = `${PUBLIC_CHAT_PREFIX}${selectedPublicOrderId}`;

      setMessages((current) => {
        const pendingOptimisticMessages = current.filter((msg) => {
          if (!String(msg.id).startsWith("public_optimistic_")) return false;
          if (msg.conversationId !== currentConversationId) return false;

          return !serverMessages.some((serverMsg) =>
            serverMsg.direction === "outgoing" &&
            serverMsg.content === msg.content &&
            Math.abs(serverMsg.createdAt - msg.createdAt) < 120000
          );
        });

        return [...serverMessages, ...pendingOptimisticMessages].sort((a, b) => a.createdAt - b.createdAt);
      });
      return;
    }
    if (selectedConvId) {
      setMessages(getMessages(selectedConvId));
    } else {
      setMessages([]);
    }
  }, [selectedConvId, selectedPublicOrderId, publicMessages, refreshTick]);

  // ==================== SEND MESSAGE (still via tRPC/UAZAPI) ====================
  const sendMessageMutation = trpc.whatsappChat.sendMessage.useMutation({
    onSuccess: (_data, variables) => {
      shouldAutoScrollRef.current = true;
      // Save outgoing message locally
      addOutgoingMessage(
        selectedConvId!,
        variables.text,
        _data?.messageId || undefined
      );
      setMessageText("");
      setTimeout(() => inputRef.current?.focus(), 50);
      refresh();
    },
    onError: (err) => {
      toast.error("Erro ao enviar: " + err.message);
    },
  });

  const markPublicAsReadMutation = trpc.whatsappChat.markPublicAsRead.useMutation({
    onSuccess: async () => {
      await utils.whatsappChat.getPublicConversations.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao marcar conversa pública como lida: " + err.message);
    },
  });

  const sendPublicReplyMutation = trpc.whatsappChat.sendPublicReply.useMutation({
    onMutate: (variables) => {
      shouldAutoScrollRef.current = true;
      const optimisticMessage: LocalMessage = {
        id: `public_optimistic_${Date.now()}`,
        conversationId: `${PUBLIC_CHAT_PREFIX}${variables.orderId}`,
        direction: "outgoing",
        content: variables.content,
        messageType: "text",
        mediaUrl: null,
        createdAt: Date.now(),
      };
      setMessages((current) => [...current, optimisticMessage]);
      setMessageText("");
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.whatsappChat.getPublicConversations.invalidate(),
        utils.whatsappChat.getPublicMessages.invalidate({ orderId: variables.orderId }),
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    onError: (err, variables) => {
      toast.error("Erro ao responder no chat público: " + err.message);
      utils.whatsappChat.getPublicMessages.invalidate({ orderId: variables.orderId });
    },
  });

  // ==================== STATUS MUTATIONS (still via tRPC) ====================
  const takeOverMutation = trpc.whatsappChat.takeOver.useMutation({
    onSuccess: () => {
      if (selectedConvId) {
        updateConversationStatus(selectedConvId, "human");
        refresh();
      }
      toast.success("Conversa assumida. Agora você está respondendo diretamente.");
    },
  });

  const returnToBotMutation = trpc.whatsappChat.returnToBot.useMutation({
    onSuccess: () => {
      if (selectedConvId) {
        updateConversationStatus(selectedConvId, "bot");
        refresh();
      }
      toast.success("Devolvido ao bot. O bot está respondendo novamente.");
    },
  });

  // ==================== SHORTCUTS QUERIES & MUTATIONS ====================
  const { data: shortcuts = [], refetch: refetchShortcuts } = trpc.chatShortcuts.list.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id }
  );

  const createShortcutMutation = trpc.chatShortcuts.create.useMutation({
    onSuccess: () => {
      refetchShortcuts();
      setShortcutTitle("");
      setShortcutMessage("");
      toast.success("Atalho criado com sucesso!");
    },
    onError: (err) => toast.error("Erro ao criar atalho: " + err.message),
  });

  const updateShortcutMutation = trpc.chatShortcuts.update.useMutation({
    onSuccess: () => {
      refetchShortcuts();
      setShortcutTitle("");
      setShortcutMessage("");
      setEditingShortcutId(null);
      toast.success("Atalho atualizado!");
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message),
  });

  const reorderShortcutsMutation = trpc.chatShortcuts.reorder.useMutation({
    onSuccess: () => {
      setLocalShortcutsOrder(null);
      refetchShortcuts();
    },
    onError: (err: any) => {
      toast.error("Erro ao reordenar: " + err.message);
      setLocalShortcutsOrder(null);
      refetchShortcuts();
    },
  });

  // dnd-kit sensors
  const shortcutSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // The displayed list: use local optimistic order if mid-drag, otherwise server data
  const displayedShortcuts = localShortcutsOrder ?? shortcuts;

  const handleShortcutDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !establishment?.id) {
      setLocalShortcutsOrder(null);
      return;
    }
    const currentList = localShortcutsOrder ?? shortcuts;
    const activeId = Number(String(active.id).replace("shortcut-", ""));
    const overId = Number(String(over.id).replace("shortcut-", ""));
    const oldIndex = currentList.findIndex((s: any) => s.id === activeId);
    const newIndex = currentList.findIndex((s: any) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(currentList, oldIndex, newIndex);
    setLocalShortcutsOrder(reordered);
    reorderShortcutsMutation.mutate({
      establishmentId: establishment.id,
      orderedIds: reordered.map((s: any) => s.id),
    });
  }, [shortcuts, localShortcutsOrder, establishment?.id]);

  const deleteShortcutMutation = trpc.chatShortcuts.delete.useMutation({
    onSuccess: () => {
      refetchShortcuts();
      toast.success("Atalho excluído!");
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  const handleSaveShortcut = useCallback(() => {
    if (!shortcutTitle.trim() || !shortcutMessage.trim() || !establishment?.id) return;
    if (editingShortcutId) {
      updateShortcutMutation.mutate({
        id: editingShortcutId,
        establishmentId: establishment.id,
        title: shortcutTitle.trim(),
        message: shortcutMessage.trim(),
      });
    } else {
      createShortcutMutation.mutate({
        establishmentId: establishment.id,
        title: shortcutTitle.trim(),
        message: shortcutMessage.trim(),
      });
    }
  }, [shortcutTitle, shortcutMessage, editingShortcutId, establishment?.id]);

  const handleEditShortcut = useCallback((s: { id: number; title: string; message: string }) => {
    setEditingShortcutId(s.id);
    setShortcutTitle(s.title);
    setShortcutMessage(s.message);
  }, []);

  const handleDeleteShortcut = useCallback((id: number) => {
    if (!establishment?.id) return;
    deleteShortcutMutation.mutate({ id, establishmentId: establishment.id });
  }, [establishment?.id]);

  const handleSelectShortcut = useCallback((message: string) => {
    setMessageText(message);
    setShowShortcutsDropdown(false);
    inputRef.current?.focus();
  }, []);

  const handleSendShortcut = useCallback((message: string) => {
    if (!selectedConvId) return;
    setMessageText(message);
    const trimmedMessage = message.trim();
    if (selectedPublicOrderId) {
      sendPublicReplyMutation.mutate({
        orderId: selectedPublicOrderId,
        content: trimmedMessage,
      });
      setShowShortcutsModal(false);
      return;
    }
    // Send directly
    sendMessageMutation.mutate({
      conversationId: 0,
      text: trimmedMessage,
      remoteJid: selectedConvId,
    });
    setShowShortcutsModal(false);
  }, [selectedConvId, selectedPublicOrderId, sendPublicReplyMutation, sendMessageMutation]);

  // Filter shortcuts based on what user typed after /
  const filteredShortcuts = useMemo(() => {
    if (!messageText.startsWith("/")) return shortcuts;
    const query = messageText.slice(1).toLowerCase();
    if (!query) return shortcuts;
    return shortcuts.filter(
      (s) => s.title.toLowerCase().includes(query) || s.message.toLowerCase().includes(query)
    );
  }, [messageText, shortcuts]);

  // Show/hide dropdown based on / prefix
  useEffect(() => {
    if (messageText.startsWith("/") && selectedConvId) {
      setShowShortcutsDropdown(true);
    } else {
      setShowShortcutsDropdown(false);
    }
  }, [messageText, selectedConvId]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showShortcutsDropdown) return;
    function handleClick(e: MouseEvent) {
      if (shortcutsDropdownRef.current && !shortcutsDropdownRef.current.contains(e.target as Node)) {
        setShowShortcutsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showShortcutsDropdown]);

  // ==================== DERIVED DATA ====================
  const selectedConversation = useMemo(() => {
    if (!selectedConvId) return null;
    return combinedConversations.find((c) => c.id === selectedConvId) || null;
  }, [selectedConvId, combinedConversations]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: LocalMessage[] }[] = [];
    let currentDate = "";

    for (const msg of messages) {
      const dateStr = formatDateSeparator(msg.createdAt);
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ date: dateStr, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  // ==================== SSE CONNECTION ====================
  useEffect(() => {
    // SSE runs always (even when closed) to capture messages in background
    let retryDelay = 1000;
    let retryAttempts = 0;
    const MAX_CHAT_RECONNECT = 10;
    let eventSource: EventSource | null = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      eventSource = new EventSource("/api/chat/stream", { withCredentials: true });

      eventSource.addEventListener("connected", () => {
        retryDelay = 1000;
        retryAttempts = 0; // Reset on successful connection
      });

      eventSource.addEventListener("chat_new_message", (e) => {
        try {
          const data = JSON.parse(e.data);
          const direction = data.direction || (data.fromMe ? "outgoing" : "incoming");

          if (data?.source === "public_menu") {
            const publicOrderId = Number(data.orderId);
            if (!Number.isFinite(publicOrderId) || publicOrderId <= 0) {
              console.warn("[WhatsAppChatWidget] Evento public_menu ignorado sem orderId válido", data);
              return;
            }

            const publicConversationId = `${PUBLIC_CHAT_PREFIX}${publicOrderId}`;
            const chatOpen = isOpenRef.current;
            const currentConv = selectedConvIdRef.current;
            const isViewingThisConv = chatOpen && currentConv === publicConversationId;
            const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();
            const normalizedCreatedAt = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
            const messageId = data.messageId || data.id || normalizedCreatedAt;

            if (direction === "incoming" && !data.fromMe) {
              const incomingMessage: LocalMessage = {
                id: `public_${messageId}`,
                conversationId: publicConversationId,
                direction: "incoming",
                content: data.content || "",
                messageType: data.mediaType || data.messageType || "text",
                mediaUrl: data.mediaUrl || null,
                createdAt: normalizedCreatedAt,
              };

              if (isViewingThisConv) {
                setMessages((current) => {
                  if (current.some((msg) => msg.id === incomingMessage.id)) return current;
                  return [...current, incomingMessage].sort((a, b) => a.createdAt - b.createdAt);
                });
              }

              setConversations((current) => {
                const existing = current.find((conv) => conv.id === publicConversationId);
                const updated: LocalConversation = {
                  id: publicConversationId,
                  phone: data.phone || existing?.phone || "",
                  contactName: data.customerName || existing?.contactName || `Pedido #${data.orderNumber || publicOrderId}`,
                  profilePicUrl: existing?.profilePicUrl || null,
                  status: existing?.status || "human",
                  unreadCount: isViewingThisConv ? 0 : (existing?.unreadCount || 0) + 1,
                  lastMessageAt: normalizedCreatedAt,
                  lastMessageText: data.content || existing?.lastMessageText || "",
                };
                const withoutCurrent = current.filter((conv) => conv.id !== publicConversationId);
                return [updated, ...withoutCurrent].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
              });
            }

            void utils.whatsappChat.getPublicConversations.invalidate();
            if (isViewingThisConv) {
              void utils.whatsappChat.getPublicMessages.invalidate({ orderId: publicOrderId });
              markPublicAsReadMutation.mutate({ orderId: publicOrderId });
            }

            if (direction === "incoming" && !data.fromMe) {
              if (!isViewingThisConv && notificationAudioRef.current && soundEnabledRef.current) {
                notificationAudioRef.current.currentTime = 0;
                notificationAudioRef.current.play().catch(() => { /* browser may block autoplay */ });
              }
            }

            refresh();
            return;
          }

          const remoteJid = typeof data?.remoteJid === "string" ? data.remoteJid.trim() : "";
          if (remoteJid.length === 0) {
            console.warn("[WhatsAppChatWidget] Evento chat_new_message ignorado sem remoteJid", data);
            return;
          }
          const messageId = data.messageId || data.id || undefined;
          // Save incoming message to localStorage
          processIncomingMessage({
            remoteJid,
            phone: data.phone,
            contactName: data.senderName || data.contactName,
            content: data.content || "",
            messageType: data.messageType || data.type || "text",
            mediaUrl: data.mediaUrl,
            direction,
            fromMe: data.fromMe,
            messageId,
            timestamp: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
          });

          // Check if user is currently viewing this conversation
          const chatOpen = isOpenRef.current;
          const currentConv = selectedConvIdRef.current;
          const isViewingThisConv = chatOpen && currentConv === remoteJid;

          // If user is viewing this conversation, immediately mark as read
          if (isViewingThisConv) {
            markConversationAsRead(remoteJid);
          }

          // Play notification sound if incoming message and chat is closed or different conversation
          if (direction === "incoming" && !data.fromMe) {
            if (!isViewingThisConv && notificationAudioRef.current && soundEnabledRef.current) {
              notificationAudioRef.current.currentTime = 0;
              notificationAudioRef.current.play().catch(() => { /* browser may block autoplay */ });
            }
          }

          refresh();
        } catch {
          /* ignore parse errors */
        }
      });

      eventSource.addEventListener("chat_conversation_update", (e) => {
        try {
          const data = JSON.parse(e.data);
          // If status changed, update locally
          if (data.status && data.id) {
            // We need the remoteJid but SSE sends numeric id — find by matching
            // For now just refresh to pick up any changes
          }
        } catch {
          /* ignore */
        }
        refresh();
      });

      eventSource.onerror = () => {
        eventSource?.close();
        if (mounted && retryAttempts < MAX_CHAT_RECONNECT) {
          retryAttempts++;
          // Jitter aleatório de até 50% do delay base para evitar thundering herd
          const jitter = Math.random() * retryDelay * 0.5;
          const delayWithJitter = retryDelay + jitter;
          console.log(`[Chat SSE] Reconectando em ${Math.round(delayWithJitter)}ms (tentativa ${retryAttempts}/${MAX_CHAT_RECONNECT})`);
          setTimeout(connect, delayWithJitter);
          retryDelay = Math.min(retryDelay * 2, 30000);
        } else if (mounted) {
          console.log("[Chat SSE] Máximo de tentativas atingido. Conexão encerrada.");
        }
      };
    }

    connect();

    return () => {
      mounted = false;
      eventSource?.close();
    };
  }, []);

  // ==================== SCROLL TO BOTTOM ====================
  useEffect(() => {
    const scrollArea = messagesScrollAreaRef.current;
    if (messages.length === 0 || !scrollArea) return;

    const lastMessage = messages[messages.length - 1];
    const scrollSignature = `${selectedConvId ?? ""}:${messages.length}:${lastMessage?.id ?? ""}:${lastMessage?.createdAt ?? ""}`;
    const isSameMessageList = lastMessagesScrollSignatureRef.current === scrollSignature;
    lastMessagesScrollSignatureRef.current = scrollSignature;

    const isInitialScroll = isInitialScrollRef.current;
    if (isSameMessageList && !isInitialScroll) return;
    if (!isInitialScroll && !shouldAutoScrollRef.current) return;

    requestAnimationFrame(() => {
      const target = scrollArea.scrollHeight;
      if (isInitialScroll) {
        scrollArea.scrollTop = target;
      } else {
        scrollArea.scrollTo({ top: target, behavior: "smooth" });
      }
      isInitialScrollRef.current = false;
      shouldAutoScrollRef.current = true;
    });
  }, [messages, selectedConvId]);

  // ==================== MARK AS READ ====================
  useEffect(() => {
    if (selectedPublicOrderId && selectedConversation && selectedConversation.unreadCount > 0) {
      markPublicAsReadMutation.mutate({ orderId: selectedPublicOrderId });
      return;
    }
    if (selectedConvId && selectedConversation && selectedConversation.unreadCount > 0) {
      markConversationAsRead(selectedConvId);
      refresh();
    }
  }, [selectedConvId, selectedPublicOrderId, selectedConversation?.unreadCount]);

  // ==================== RESPONSIVE ====================
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ==================== HANDLERS ====================
  const handleSelectConversation = useCallback(
    (convId: string, unread: number) => {
      setSelectedConvId(convId);
      const publicOrderId = getPublicOrderIdFromConversationId(convId);
      if (publicOrderId) {
        if (unread > 0) {
          markPublicAsReadMutation.mutate({ orderId: publicOrderId });
        }
        return;
      }
      if (unread > 0) {
        markConversationAsRead(convId);
        refresh();
      }
    },
    [markPublicAsReadMutation]
  );

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !selectedConvId) return;
    const trimmedMessage = messageText.trim();
    if (selectedPublicOrderId) {
      sendPublicReplyMutation.mutate({
        orderId: selectedPublicOrderId,
        content: trimmedMessage,
      });
      return;
    }
    // Find the conversation to get the numeric DB id for the tRPC call
    // The tRPC sendMessage still needs conversationId (numeric) — we pass remoteJid as phone
    sendMessageMutation.mutate({
      conversationId: 0, // Will be resolved server-side by remoteJid
      text: trimmedMessage,
      remoteJid: selectedConvId, // Pass remoteJid so server can find/create conversation
    });
  }, [messageText, selectedConvId, selectedPublicOrderId, sendPublicReplyMutation, sendMessageMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && showShortcutsDropdown) {
        e.preventDefault();
        setShowShortcutsDropdown(false);
        setMessageText("");
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (showShortcutsDropdown && filteredShortcuts.length > 0) {
          handleSelectShortcut(filteredShortcuts[0].message);
          return;
        }
        handleSendMessage();
      }
    },
    [handleSendMessage, showShortcutsDropdown, filteredShortcuts, handleSelectShortcut]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedConvId(null);
  }, []);

  // ==================== PERIODIC REFRESH (for timeAgo updates) ====================
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // ==================== RENDER: FAB BUTTON ====================
  if (!isOpen) {
    return (
      <>
        {/* Highlight/Spotlight overlay for new chat feature */}
        {showHighlight && (
          <div className="fixed inset-0 z-[9998]">
            {/* Dark overlay with hole cut-out — positioned exactly on the FAB button (bottom-6 right-6 = 24px, button 54px) */}
            <div className="absolute inset-0" style={{
              background: "rgba(0,0,0,0.7)",
              maskImage: "radial-gradient(circle 42px at calc(100% - 51px) calc(100% - 51px), transparent 40px, black 41px)",
              WebkitMaskImage: "radial-gradient(circle 42px at calc(100% - 51px) calc(100% - 51px), transparent 40px, black 41px)",
            }} />

            {/* Pulsing ring around the button — centered on the FAB */}
            <div
              className="fixed h-[54px] w-[54px] rounded-full animate-ping"
              style={{ bottom: "24px", right: "24px", boxShadow: "0 0 0 8px rgba(220,38,38,0.3)" }}
            />

            {/* Tooltip card — positioned above the button */}
            <div className="fixed z-[9999] max-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ bottom: "90px", right: "8px" }}>
              <div className="bg-white dark:bg-[#1e1e38] rounded-2xl shadow-2xl p-5 relative">
                {/* Arrow pointing down-right to the button */}
                <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white dark:bg-[#1e1e38] rotate-45 shadow-lg" />
                
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 p-2 bg-red-100 rounded-xl">
                    <Sparkles className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">Novidade! Chat WhatsApp</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Integrado na sua dashboard</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Atenda seus clientes por aqui mesmo! Acompanhe conversas e responda em tempo real sem sair da plataforma.
                </p>

                <button
                  onClick={() => {
                    dismissHighlight();
                    setIsOpen(true);
                  }}
                  className="w-full bg-red-500 hover:bg-red-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Experimentar agora
                </button>

                <button
                  onClick={() => {
                    dismissHighlight();
                  }}
                  className="w-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs mt-2 py-1 transition-colors"
                >
                  Entendi, não mostrar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (showHighlight) dismissHighlight();
            setIsOpen(true);
          }}
          className={cn(
            "fixed bottom-6 right-6 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-500 transition-transform hover:scale-105 active:scale-95",
            showHighlight ? "z-[9999]" : "z-40"
          )}
          style={{ boxShadow: "0 4px 16px rgba(220,38,38,0.35)" }}
          aria-label="Abrir chat WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </>
    );
  }

  // ==================== RENDER: RIGHT SIDEBAR ====================
  return (
    <>
      {/* Blur backdrop overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Sidebar panel — slides in from right */}
      <div
        ref={panelRef}
        className={cn("fixed right-0 z-[70] flex min-h-0 bg-white dark:bg-[#1a1a2e] shadow-2xl animate-in slide-in-from-right duration-300 rounded-l-2xl overflow-hidden", isMobileView ? "bottom-0 rounded-t-2xl" : "top-0 h-full")}
        style={{
          width: isMobileView ? "100vw" : "942px",
          maxWidth: "100vw",
          height: isMobileView ? "85vh" : undefined,
          maxHeight: isMobileView ? "85vh" : undefined,
        }}
      >
        {/* ==================== LEFT: CONTACT LIST ==================== */}
        {(!isMobileView || !selectedConvId) && (
          <div className={cn(
            "flex flex-col border-r border-gray-200 dark:border-gray-700/50 shrink-0 bg-white dark:bg-[#1a1a2e]",
            isMobileView ? "w-full" : "w-[320px]"
          )}>
            {/* Sidebar Header — Compact gradient */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500 shrink-0">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white leading-tight">Conversas</h2>
                <p className="text-xs text-white/80">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Nenhuma nova"}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={toggleSound}
                  onMouseEnter={() => { if (!soundEnabled) setSoundTooltipDismissed(true); }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title={soundEnabled ? "Silenciar notificações" : undefined}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-white" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-white/60" />
                  )}
                </button>
                {!soundEnabled && !soundTooltipDismissed && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none z-[100] shadow-lg animate-in fade-in duration-300">
                    Som desativado
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                )}
              </div>
              {isMobileView && (
                <button
                  onClick={handleClose}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>

            {/* Filter pills — below header */}
            <div className="flex gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#151525] shrink-0">
              {(["all", "bot"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                    filter === f
                      ? "bg-red-500 text-white"
                      : "bg-white dark:bg-[#1e1e35] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-[#252545]"
                  )}
                >
                  {f === "all" ? "Tudo" : "Bot"}
                </button>
              ))}
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto">
              {combinedConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <MessageCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma conversa ainda</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">As mensagens aparecerão aqui quando clientes enviarem no WhatsApp</p>
                </div>
              ) : (
                combinedConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id, conv.unreadCount)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 dark:border-gray-700/30",
                      selectedConvId === conv.id
                        ? "bg-red-50 dark:bg-red-950/30 border-l-3 border-l-red-500"
                        : "hover:bg-gray-50 dark:hover:bg-[#1e1e35]"
                    )}
                  >
                    <div
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{
                        background: isPublicConversationId(conv.id)
                          ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                          : isDriverPhone(conv.phone, driverPhoneMap)
                            ? "linear-gradient(135deg, #f97316, #ea580c)"
                            : "linear-gradient(135deg, #ef4444, #ef4444)"
                      }}
                    >
                      {isPublicConversationId(conv.id) ? (
                        <MessageCircle className="h-5 w-5" />
                      ) : isDriverPhone(conv.phone, driverPhoneMap) ? (
                        <Truck className="h-5 w-5" />
                      ) : conv.profilePicUrl ? (
                        <img loading="lazy" src={conv.profilePicUrl} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        getInitials(conv.contactName, conv.phone)
                      )}
                      {/* Source indicator badge - canto inferior direito do avatar */}
                      {isPublicConversationId(conv.id) ? (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 border-2 border-white dark:border-[#1a1a2e]">
                          <MessageCircle className="h-2.5 w-2.5 text-white" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 border-2 border-white dark:border-[#1a1a2e]">
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.66 0-3.203-.51-4.484-1.375l-.316-.188-2.86.75.75-2.86-.188-.316A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {resolveDisplayName(conv.contactName, conv.phone, driverPhoneMap) || formatPhone(conv.phone)}
                        </p>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </div>
                      {isPublicConversationId(conv.id) ? (
                        <div className="mt-0.5 space-y-0.5">
                          <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                            {getPublicConversationSubtitleWithOrderNumber(conv.id)}
                          </p>
                          <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                            {conv.lastMessageText || "Sem mensagens"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {conv.lastMessageText || "Sem mensagens"}
                        </p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== RIGHT: CHAT AREA ==================== */}
        {(!isMobileView || selectedConvId) && (
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-white dark:bg-[#12122a]">
          {/* Chat Header — White background, same height as left */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#1a1a2e] shrink-0">
              {/* Mobile: back arrow */}
              {isMobileView && selectedConvId && (
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}

              {selectedConversation ? (
                <>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                    isPublicConversationId(selectedConversation.id)
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                      : isDriverPhone(selectedConversation.phone, driverPhoneMap)
                        ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                        : "bg-red-100 dark:bg-red-500/40 text-red-500 dark:text-red-400"
                  )}>
                    {isPublicConversationId(selectedConversation.id) ? (
                      <MessageCircle className="h-4 w-4" />
                    ) : isDriverPhone(selectedConversation.phone, driverPhoneMap) ? (
                      <Truck className="h-4 w-4" />
                    ) : selectedConversation.profilePicUrl ? (
                      <img
                        src={selectedConversation.profilePicUrl}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(selectedConversation.contactName, selectedConversation.phone)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate leading-tight">
                      {resolveDisplayName(selectedConversation.contactName, selectedConversation.phone, driverPhoneMap) || formatPhone(selectedConversation.phone)}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {isPublicConversationId(selectedConversation.id) ? getPublicConversationSubtitleWithOrderNumber(selectedConversation.id) : formatPhone(selectedConversation.phone)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-red-50 dark:bg-red-500/30 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">Chat WhatsApp</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Selecione uma conversa</p>
                  </div>
                </>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Public chat badge */}
                {selectedConversation && isPublicConversationId(selectedConversation.id) && (
                  <span className="shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> Chat do Cardápio
                  </span>
                )}
                {/* Status badge — respects global bot toggle from Mindi Bot page */}
                {selectedConversation && !isPublicConversationId(selectedConversation.id) && !globalBotEnabled && selectedConversation.status === "bot" && (
                  <span className="shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" /> Bot desativado
                  </span>
                )}
                {selectedConversation && !isPublicConversationId(selectedConversation.id) && globalBotEnabled && selectedConversation.status === "bot" && (
                  <button
                    onClick={() => {
                      takeOverMutation.mutate({ conversationId: selectedConvId! });
                    }}
                    disabled={takeOverMutation.isPending}
                    className="shrink-0 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-700 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 transition-colors flex items-center gap-1.5"
                  >
                    <Bot className="h-3.5 w-3.5" /> Bot ativo
                  </button>
                )}
                {selectedConversation && !isPublicConversationId(selectedConversation.id) && selectedConversation.status === "human" && (
                  <button
                    onClick={() => {
                      returnToBotMutation.mutate({ conversationId: selectedConvId! });
                    }}
                    disabled={returnToBotMutation.isPending}
                    className="shrink-0 rounded-lg bg-red-50 dark:bg-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/50 border border-red-200 dark:border-red-500 px-3 py-1.5 text-xs font-semibold text-red-500 dark:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <User className="h-3.5 w-3.5" /> Humano
                  </button>
                )}
                {selectedConversation && !isPublicConversationId(selectedConversation.id) && selectedConversation.status === "closed" && (
                  <span className="shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    Encerrado
                  </span>
                )}

                {/* Close button — mobile only (desktop closes by clicking outside) */}
                {isMobileView && (
                  <button
                    onClick={handleClose}
                    className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
          </div>

          {/* ==================== ORDER STATUS BAR ==================== */}
          {selectedConversation && !isDriverPhone(selectedConversation.phone, driverPhoneMap) && establishment?.id && (
            <ChatOrderBarWrapper
              phone={selectedConversation.phone}
              establishmentId={establishment.id}
              publicOrderId={selectedPublicOrderId}
            />
          )}

          {/* ==================== WHATSAPP DISCONNECTED BANNER ==================== */}
          {!isSelectedPublicConversation && !isWhatsappConnected && whatsappStatus && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-500/40 shrink-0">
              <div className="relative p-1.5 bg-red-100 dark:bg-red-500/50 rounded-lg">
                <span className="absolute inset-0 rounded-lg bg-red-400/40 dark:bg-red-500/30" />
                <WifiOff className="relative h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <p className="flex-1 text-sm text-red-500 dark:text-red-300">
                WhatsApp <strong>desconectado</strong>. Reconecte para enviar mensagens.
              </p>
              <button
                onClick={handleOpenConnectModal}
                disabled={connectWhatsapp.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {connectWhatsapp.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <QrCode className="h-3.5 w-3.5" />
                )}
                Conectar
              </button>
            </div>
          )}

          {/* ==================== BODY ==================== */}
          {!selectedConvId ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50/50 dark:bg-[#12122a] px-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/20 mb-5">
                <MessageCircle className="h-10 w-10 text-red-300 dark:text-red-500/40" />
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Chat WhatsApp</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 text-center">
                Selecione uma conversa na lista ao lado para visualizar e responder mensagens
              </p>
            </div>
          ) : (
            /* Message thread */
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {/* Messages Area */}
              <div
                ref={messagesScrollAreaRef}
                onScroll={handleMessagesScroll}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 bg-gray-50/30 dark:bg-[#12122a]"
                style={{
                  backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp')`,
                  backgroundSize: '400px auto',
                  backgroundRepeat: 'repeat',
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-4">
                        <span className="rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 px-5 py-1.5 text-xs font-semibold text-red-500 dark:text-red-400">
                          {group.date}
                        </span>
                      </div>

                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex mb-2 items-end gap-1.5",
                            msg.direction === "outgoing" ? "justify-end" : "justify-start"
                          )}
                        >
                          {/* Robot icon to the left of the bubble for bot messages */}
                          {msg.direction === "outgoing" && msg.fromBot && (
                            <div className="group/bot relative shrink-0 mb-1 cursor-help">
                              <Bot className="h-4 w-4 text-red-400 dark:text-red-500/60" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-gray-800 dark:bg-gray-700 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/bot:opacity-100 z-50">
                                Resposta automática do bot
                              </span>
                            </div>
                          )}
                          <div
                            className={cn(
                              "relative max-w-[70%] px-3 py-2 text-[14px] leading-snug",
                              msg.direction === "outgoing"
                                ? "text-white rounded-2xl rounded-br-sm border border-red-400"
                                : "bg-white dark:bg-[#1e1e38] text-gray-700 dark:text-gray-200 rounded-2xl rounded-bl-sm border-2 border-red-200 dark:border-red-500/30"
                            )}
                            style={
                              msg.direction === "outgoing"
                                ? { background: "linear-gradient(135deg, #ef4444, #ef4444)", boxShadow: "0 2px 8px rgba(220,38,38,0.15)" }
                                : { boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }
                            }
                          >
                            {(() => {
                              const mType = msg.messageType || 'text';
                              const hasMedia = msg.mediaUrl && mType !== 'text';
                              
                              // Renderizar mídia inline quando temos URL do S3
                              if (hasMedia && msg.mediaUrl) {
                                const isImage = mType === 'image' || mType === 'sticker';
                                const isAudio = mType === 'audio' || mType === 'ptt';
                                const isVideo = mType === 'video';
                                const isDocument = mType === 'document';
                                
                                return (
                                  <div className="space-y-1">
                                    {isImage && (
                                      <div className="relative">
                                        <img
                                          src={msg.mediaUrl}
                                          alt="Imagem"
                                          className="rounded-lg max-w-[220px] max-h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          loading="lazy"
                                          onClick={() => setImageModalUrl(msg.mediaUrl!)}
                                          onMouseEnter={(e) => {
                                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                                            setHoverImagePos({ x: rect.left, y: rect.top });
                                            setHoverMediaUrl(msg.mediaUrl!);
                                             setHoverMediaType('image');
                                          }}
                                          onMouseLeave={() => {
                                            hoverTimeoutRef.current = setTimeout(() => setHoverMediaUrl(null), 150);
                                          }}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                            if (fallback) (fallback as HTMLElement).style.display = 'block';
                                          }}
                                        />
                                        <p className="whitespace-pre-wrap break-words italic text-[13px] opacity-80 hidden">
                                          📷 Imagem indisponível
                                        </p>
                                      </div>
                                    )}
                                    {isAudio && (
                                      <audio
                                        controls
                                        preload="metadata"
                                        className="max-w-[220px] h-10"
                                        style={{ minWidth: '180px' }}
                                      >
                                        <source src={msg.mediaUrl} />
                                        Seu navegador n\u00e3o suporta \u00e1udio.
                                      </audio>
                                    )}
                                    {isVideo && (
                                      <video
                                        controls
                                        preload="metadata"
                                        className="rounded-lg max-w-[220px] max-h-[220px] object-cover cursor-pointer"
                                        playsInline
                                        onMouseEnter={(e) => {
                                          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                                          setHoverImagePos({ x: rect.left, y: rect.top });
                                          setHoverMediaUrl(msg.mediaUrl!);
                                          setHoverMediaType('video');
                                        }}
                                        onMouseLeave={() => {
                                          hoverTimeoutRef.current = setTimeout(() => {
                                            setHoverMediaUrl(null);
                                            if (hoverVideoRef.current) {
                                              hoverVideoRef.current.pause();
                                              hoverVideoRef.current = null;
                                            }
                                          }, 150);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setImageModalUrl(msg.mediaUrl!);
                                        }}
                                      >
                                        <source src={msg.mediaUrl} />
                                        Seu navegador não suporta vídeo.
                                      </video>
                                    )}
                                    {isDocument && (
                                      <a
                                        href={msg.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                                          msg.direction === 'outgoing'
                                            ? "bg-white/20 text-white hover:bg-white/30"
                                            : "bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30"
                                        )}
                                      >
                                        <FileText className="h-4 w-4 shrink-0" />
                                        Abrir documento
                                      </a>
                                    )}
                                    {msg.content && msg.content !== `[${mType}]` && (
                                      <p className="whitespace-pre-wrap break-words text-[13px] mt-1">{msg.content}</p>
                                    )}
                                  </div>
                                );
                              }
                              
                              // Fallback: mídia sem URL (mensagens antigas ou falha no download)
                              const mediaFallback: Record<string, { emoji: string; text: string }> = {
                                image: { emoji: "\ud83d\udcf7", text: msg.direction === 'outgoing' ? 'Imagem enviada' : 'O cliente enviou uma imagem. Abra o WhatsApp para visualizar.' },
                                audio: { emoji: "\ud83c\udfb5", text: msg.direction === 'outgoing' ? '\u00c1udio enviado' : 'O cliente enviou um \u00e1udio. Abra o WhatsApp para ouvir.' },
                                ptt: { emoji: "\ud83c\udfb5", text: msg.direction === 'outgoing' ? '\u00c1udio enviado' : 'O cliente enviou um \u00e1udio. Abra o WhatsApp para ouvir.' },
                                video: { emoji: "\ud83c\udfa5", text: msg.direction === 'outgoing' ? 'V\u00eddeo enviado' : 'O cliente enviou um v\u00eddeo. Abra o WhatsApp para assistir.' },
                                document: { emoji: "\ud83d\udcc4", text: msg.direction === 'outgoing' ? 'Documento enviado' : 'O cliente enviou um documento. Abra o WhatsApp para ver.' },
                                location: { emoji: "\ud83d\udccd", text: 'Localiza\u00e7\u00e3o compartilhada. Abra o WhatsApp para ver.' },
                                sticker: { emoji: "\ud83c\udf1f", text: msg.direction === 'outgoing' ? 'Sticker enviado' : 'O cliente enviou um sticker. Abra o WhatsApp para ver.' },
                                contact: { emoji: "\ud83d\udc64", text: 'Contato compartilhado. Abra o WhatsApp para ver.' },
                              };
                              const fallbackMedia = mType !== 'text' ? mediaFallback[mType] : null;
                              if (fallbackMedia) {
                                return (
                                  <p className="whitespace-pre-wrap break-words italic text-[13px] opacity-80">
                                    {fallbackMedia.emoji} {fallbackMedia.text}
                                  </p>
                                );
                              }
                              if (msg.content) {
                                return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
                              }
                              return null;
                            })()}
                            <div className="flex items-center gap-0.5 mt-0.5 justify-end">
                              <span
                                className={cn(
                                  "text-[11px]",
                                  msg.direction === "outgoing"
                                    ? "text-white/60"
                                    : "text-red-400 dark:text-red-400/60"
                                )}
                              >
                                {formatTime(msg.createdAt)}
                              </span>
                              {msg.direction === "outgoing" && (
                                <CheckCheck className="h-3 w-3 text-white/60" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="relative border-t border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#1a1a2e] shrink-0">
                {/* Shortcuts Dropdown */}
                {showShortcutsDropdown && (
                  <div ref={shortcutsDropdownRef} className="absolute bottom-full left-0 right-0 z-50 mx-3 mb-1">
                    <div className="bg-white dark:bg-[#1e1e38] border border-red-200 dark:border-red-500/40 rounded-xl shadow-lg overflow-hidden">
                      {/* Dropdown Header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-500/30">
                        <Zap className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-500 dark:text-red-400">Atalhos Rápidos</span>
                      </div>
                      {/* Dropdown Items */}
                      <div className="max-h-[420px] overflow-y-auto">
                        {filteredShortcuts.length === 0 ? (
                          <div className="flex flex-col items-center py-4 px-3">
                            <Zap className="h-6 w-6 text-gray-300 dark:text-gray-600 mb-1" />
                            <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum atalho encontrado</p>
                            <button
                              onClick={() => { setShowShortcutsDropdown(false); setMessageText(""); setShowShortcutsModal(true); }}
                              className="text-xs text-red-500 hover:text-red-500 font-medium mt-1"
                            >
                              Criar primeiro atalho
                            </button>
                          </div>
                        ) : (
                          filteredShortcuts.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleSelectShortcut(s.message)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-b border-gray-100 dark:border-gray-700/30 last:border-b-0"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/30 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-red-500 dark:text-red-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">/{s.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.message}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                  {/* + Button to open shortcuts modal */}
                  <button
                    onClick={() => setShowShortcutsModal(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1e1e35] hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-500/40 transition-colors shrink-0"
                    title="Atalhos rápidos"
                  >
                    <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={!isWhatsappConnected && !isSelectedPublicConversation ? "WhatsApp desconectado..." : "Digite / para atalhos..."}
                    spellCheck={true}
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    lang="pt-BR"
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-2 text-sm outline-none transition-colors",
                      !isWhatsappConnected && !isSelectedPublicConversation
                        ? "bg-gray-100 dark:bg-[#151530] border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed"
                        : "bg-gray-50 dark:bg-[#151530] border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/30 focus:border-red-300 dark:focus:border-red-500/50"
                    )}
                    disabled={sendMessageMutation.isPending || sendPublicReplyMutation.isPending || (!isWhatsappConnected && !isSelectedPublicConversation)}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending || sendPublicReplyMutation.isPending || (!isWhatsappConnected && !isSelectedPublicConversation)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors border",
                      messageText.trim()
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-500 shadow-sm"
                        : "bg-white dark:bg-[#1e1e35] text-red-300 dark:text-red-500/40 border-red-200 dark:border-gray-600"
                    )}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* ==================== SHORTCUTS MODAL ==================== */}
      {/* ==================== QR CODE CONNECTION MODAL ==================== */}
      {showQrCodeModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowQrCodeModal(false); setIsPollingQrCode(false); }} />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-[#1e1e38] rounded-2xl shadow-2xl w-[420px] max-w-[95vw] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden border-t-4 border-t-amber-500">
            <div className="px-6 pt-5 pb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl flex-shrink-0 bg-amber-100 dark:bg-amber-950/50">
                  <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Aguardando conexão...</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                </div>
                <button
                  onClick={() => { setShowQrCodeModal(false); setIsPollingQrCode(false); }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="flex flex-col items-center py-4">
                {/* QR Code */}
                <div className="bg-gray-50 dark:bg-[#151530] p-4 rounded-xl">
                  {(connectWhatsapp.data?.qrcode || whatsappStatus?.qrcode) ? (
                    <img
                      src={connectWhatsapp.data?.qrcode || whatsappStatus?.qrcode}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Instruções */}
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                  Abra o WhatsApp no seu celular, vá em <strong>Dispositivos conectados</strong> e escaneie o QR Code
                </p>
              </div>

              <button
                onClick={() => connectWhatsapp.mutate()}
                disabled={connectWhatsapp.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl h-10 font-semibold text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e35] hover:bg-gray-50 dark:hover:bg-[#252545] text-gray-700 dark:text-gray-200 transition-colors mt-4 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", connectWhatsapp.isPending && "animate-spin")} />
                Atualizar QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {showShortcutsModal && (
        <div id="shortcuts-modal-root" className="fixed inset-0 z-[80] flex items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowShortcutsModal(false); setEditingShortcutId(null); setShortcutTitle(""); setShortcutMessage(""); }} />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-[#1e1e38] rounded-2xl shadow-2xl w-[440px] max-w-[95vw] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex-1">Atalhos Rápidos</h3>
              <button
                onClick={() => { setShowShortcutsModal(false); setEditingShortcutId(null); setShortcutTitle(""); setShortcutMessage(""); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Existing shortcuts list */}
              {shortcuts.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Zap className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum atalho salvo</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Crie atalhos para enviar mensagens rápidas</p>
                </div>
              ) : (
                <DndContext
                  sensors={shortcutSensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  onDragEnd={handleShortcutDragEnd}
                >
                  <SortableContext
                    items={displayedShortcuts.map((s: any) => `shortcut-${s.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 mb-4">
                      {displayedShortcuts.map((s: any) => (
                        <SortableShortcutItem
                          key={s.id}
                          shortcut={s}
                          isEditing={editingShortcutId === s.id}
                          showSend={!!selectedConvId}
                          onSend={() => handleSendShortcut(s.message)}
                          onEdit={() => handleEditShortcut(s)}
                          onDelete={() => handleDeleteShortcut(s.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-gray-700/50 my-4" />

              {/* New/Edit Shortcut Form */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
                  {editingShortcutId ? "Editar Atalho" : "Novo Atalho"}
                </h4>

                <div className="mb-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                    <span className="text-red-500">Título</span> (ex: saudacao, reembolso)
                  </label>
                  <input
                    type="text"
                    value={shortcutTitle}
                    onChange={(e) => setShortcutTitle(e.target.value)}
                    placeholder="Ex: saudacao"
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#151530] border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/30 focus:border-red-300 dark:focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Mensagem</label>
                  <textarea
                    value={shortcutMessage}
                    onChange={(e) => setShortcutMessage(e.target.value)}
                    placeholder="Ex: Olá! Seja bem-vindo ao suporte..."
                    rows={3}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#151530] border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/30 focus:border-red-300 dark:focus:border-red-500/50 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-700/50">
              <button
                onClick={() => {
                  if (editingShortcutId) {
                    setEditingShortcutId(null);
                    setShortcutTitle("");
                    setShortcutMessage("");
                  } else {
                    setShowShortcutsModal(false);
                    setShortcutTitle("");
                    setShortcutMessage("");
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {editingShortcutId ? "Cancelar" : "Fechar"}
              </button>
              <button
                onClick={handleSaveShortcut}
                disabled={!shortcutTitle.trim() || !shortcutMessage.trim() || createShortcutMutation.isPending || updateShortcutMutation.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                {createShortcutMutation.isPending || updateShortcutMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== MEDIA MODAL (fullscreen overlay) ==================== */}
      {imageModalUrl && (() => {
        const isModalVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(imageModalUrl) || imageModalUrl.includes('video');
        return (
          <div
            data-image-modal
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setImageModalUrl(null); }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setImageModalUrl(null); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            {isModalVideo ? (
              <video
                src={imageModalUrl}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                controls
                autoPlay
                playsInline
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={imageModalUrl}
                alt="Imagem ampliada"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}
          </div>
        );
      })()}

      {/* ==================== HOVER ZOOM POPUP ==================== */}
      {hoverMediaUrl && !imageModalUrl && (() => {
        // Calculate the right edge of the chat panel
        const panelEl = panelRef.current;
        const panelRight = panelEl ? panelEl.getBoundingClientRect().right : window.innerWidth;
        const panelTop = panelEl ? panelEl.getBoundingClientRect().top : 0;
        const panelHeight = panelEl ? panelEl.getBoundingClientRect().height : window.innerHeight;
        // Available space to the right of the chat panel
        const availableRight = window.innerWidth - panelRight;
        // If there's space to the right (desktop), show there; otherwise overlay inside chat
        const showRight = availableRight > 200;
        // Responsive size: use available space or viewport proportions
        const maxW = showRight ? Math.min(availableRight - 40, 600) : Math.min(window.innerWidth * 0.4, 400);
        const maxH = Math.min(panelHeight - 40, window.innerHeight * 0.7);
        return (
          <div
            className="fixed z-[99998] pointer-events-none"
            style={{
              left: showRight ? panelRight + 20 : undefined,
              right: showRight ? undefined : 20,
              top: panelTop + (panelHeight - maxH) / 2,
              width: maxW,
              height: maxH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverMediaUrl(null);
                if (hoverVideoRef.current) {
                  hoverVideoRef.current.pause();
                  hoverVideoRef.current = null;
                }
              }, 150);
            }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
              {hoverMediaType === 'image' ? (
                <img
                  src={hoverMediaUrl}
                  alt="Preview"
                  className="rounded-lg object-contain"
                  style={{ maxWidth: maxW - 16, maxHeight: maxH - 16 }}
                />
              ) : (
                <video
                  ref={(el) => {
                    hoverVideoRef.current = el;
                    if (el) {
                      el.play().catch(() => {});
                    }
                  }}
                  src={hoverMediaUrl}
                  className="rounded-lg object-contain"
                  style={{ maxWidth: maxW - 16, maxHeight: maxH - 16 }}
                  controls
                  autoPlay
                  playsInline
                  muted
                />
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ==================== ORDER BAR WRAPPER ====================
// Separate component to isolate the tRPC query and avoid re-rendering the entire chat
function ChatOrderBarWrapper({
  phone,
  establishmentId,
  publicOrderId,
}: {
  phone: string;
  establishmentId: number;
  publicOrderId?: number | null;
}) {
  // Normalize phone: the DB stores phones in various formats, try the raw digits
  const cleanPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    // The DB may store with or without country code
    return digits;
  }, [phone]);

  const utils = trpc.useUtils();

  const isPublicOrderBar = !!publicOrderId;

  const { data: publicOrder, isLoading: isPublicOrderLoading } = trpc.publicMenu.getOrderById.useQuery(
    { orderId: publicOrderId ?? 0 },
    {
      enabled: isPublicOrderBar,
      staleTime: 30 * 1000, // 30s cache
      refetchInterval: 60 * 1000, // refresh every 60s (fallback)
    }
  );

  const { data: allOrders, isLoading: isPhoneOrdersLoading } = trpc.publicMenu.getOrdersByPhone.useQuery(
    { phone: cleanPhone, establishmentId },
    {
      enabled: !isPublicOrderBar && !!cleanPhone && !!establishmentId,
      staleTime: 30 * 1000, // 30s cache
      refetchInterval: 60 * 1000, // refresh every 60s (fallback)
    }
  );

  // Invalidar query quando SSE notifica mudança de status do pedido
  const invalidateOrderBarQueries = useCallback(() => {
    if (publicOrderId) {
      utils.publicMenu.getOrderById.invalidate({ orderId: publicOrderId });
      return;
    }

    utils.publicMenu.getOrdersByPhone.invalidate({ phone: cleanPhone, establishmentId });
  }, [utils, publicOrderId, cleanPhone, establishmentId]);

  const handleOrderUpdate = useCallback(() => {
    console.log("[ChatOrderBar] SSE order_update recebido, invalidando query...");
    invalidateOrderBarQueries();
  }, [invalidateOrderBarQueries]);

  const handleNewOrder = useCallback(() => {
    console.log("[ChatOrderBar] SSE new_order recebido, invalidando query...");
    invalidateOrderBarQueries();
  }, [invalidateOrderBarQueries]);

  // Conectar ao SSE para receber atualizações em tempo real
  useOrdersSSE({
    establishmentId,
    onOrderUpdate: handleOrderUpdate,
    onNewOrder: handleNewOrder,
    enabled: !!establishmentId && (isPublicOrderBar || !!cleanPhone),
  });

  // Mostrar apenas o pedido mais recente que NÃO está concluído ou cancelado
  // Pedidos com mais de 24h são considerados expirados (provavelmente não foram finalizados)
  const latestOrder = useMemo(() => {
    if (isPublicOrderBar) return publicOrder ? [publicOrder] : [];
    if (!allOrders || allOrders.length === 0) return [];
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    // Filtrar pedidos concluídos, cancelados e com mais de 24h
    const activeOrders = allOrders.filter((o: any) => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      const orderAge = now - new Date(o.createdAt).getTime();
      if (orderAge > TWENTY_FOUR_HOURS) return false;
      return true;
    });
    if (activeOrders.length === 0) return [];
    // Ordenar por data de criação (mais recente primeiro) e pegar apenas o primeiro
    const sorted = [...activeOrders].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    return [sorted[0]];
  }, [allOrders, isPublicOrderBar, publicOrder]);

  const isLoading = isPublicOrderBar ? isPublicOrderLoading : isPhoneOrdersLoading;

  return <ChatOrderBar orders={latestOrder as any} isLoading={isLoading} />;
}
