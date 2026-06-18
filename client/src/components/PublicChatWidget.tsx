import { useState, useEffect, useRef, useCallback, memo } from "react";
import { MessageCircle, Send, X, Loader2, Paperclip, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface PublicChatWidgetProps {
  establishmentId: number;
  customerPhone: string;
  customerName: string;
  /** List of active order IDs (from localStorage userOrders) */
  activeOrderIds: number[];
  /** The display order number (e.g. "#P2") */
  orderNumber?: string;
  /** Move the floating chat above the mobile cart bar when both are visible. */
  isCartBarVisible?: boolean;
}

interface ChatMessage {
  id: number;
  content: string;
  direction: "incoming" | "outgoing";
  createdAt: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

/**
 * In the database, direction is from the RESTAURANT's perspective:
 * - "incoming" = message FROM customer TO restaurant
 * - "outgoing" = message FROM restaurant TO customer
 *
 * In the PUBLIC CHAT WIDGET (customer's view), we need to INVERT:
 * - DB "incoming" → customer sent it → show on RIGHT (outgoing in UI)
 * - DB "outgoing" → restaurant sent it → show on LEFT (incoming in UI)
 */
function invertDirection(dbDirection: "incoming" | "outgoing"): "incoming" | "outgoing" {
  return dbDirection === "incoming" ? "outgoing" : "incoming";
}

export const PublicChatWidget = memo(function PublicChatWidget({
  establishmentId,
  customerPhone,
  customerName,
  activeOrderIds,
  orderNumber,
  isCartBarVisible = false,
}: PublicChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastAdminMessage, setLastAdminMessage] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isOpenRef = useRef(isOpen);
  const messageTextRef = useRef(messageText);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cross-domain support: if localStorage has no active orders, query the DB
  const localOrderId = activeOrderIds[0] || 0;
  const { data: dbActiveOrder } = trpc.publicMenu.chatGetActiveOrder.useQuery(
    { phone: customerPhone, establishmentId },
    { enabled: !localOrderId && !!customerPhone && !!establishmentId, staleTime: 60_000 }
  );

  // Use local order first, fallback to DB order
  const orderId = localOrderId || dbActiveOrder?.orderId || 0;
  const displayOrderNumber = orderNumber || dbActiveOrder?.orderNumber || (orderId ? `#${orderId}` : "");

  // Keep refs in sync
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    messageTextRef.current = messageText;
  }, [messageText]);

  // Check if chat is available (has active order)
  const { data: canChatData } = trpc.publicMenu.chatCanChat.useQuery(
    { orderId, phone: customerPhone, establishmentId },
    { enabled: !!orderId && !!customerPhone && !!establishmentId, staleTime: 30_000 }
  );

  const canChat = canChatData?.canChat ?? false;

  // Load messages via tRPC query
  const { data: messagesData, isLoading: isLoadingMessagesQuery } = trpc.publicMenu.chatGetMessages.useQuery(
    { orderId, phone: customerPhone, establishmentId },
    { enabled: isOpen && !!orderId && !!customerPhone && !!establishmentId }
  );

  // Sync messages from query to state — INVERT direction for customer view
  useEffect(() => {
    if (messagesData) {
      const inverted = (messagesData as unknown as ChatMessage[]).map((msg) => ({
        ...msg,
        direction: invertDirection(msg.direction),
      }));
      // Only update state if messages actually changed (avoid unnecessary re-renders)
      setMessages((prev) => {
        if (prev.length === inverted.length && prev[prev.length - 1]?.id === inverted[inverted.length - 1]?.id) {
          return prev; // No change, keep same reference
        }
        return inverted;
      });
      setIsLoadingMessages(false);

      // Find the last admin message (direction "outgoing" in DB = from restaurant)
      const adminMessages = (messagesData as unknown as ChatMessage[]).filter(
        (m) => m.direction === "outgoing"
      );
      if (adminMessages.length > 0) {
        const lastMsg = adminMessages[adminMessages.length - 1];
        setLastAdminMessage(lastMsg.content);
      }
    }
  }, [messagesData]);

  useEffect(() => {
    setIsLoadingMessages(isLoadingMessagesQuery);
  }, [isLoadingMessagesQuery]);

  // Send message mutation
  const sendMutation = trpc.publicMenu.chatSend.useMutation();
  const sendImageMutation = trpc.publicMenu.chatSendImage.useMutation();

  // SSE connection for real-time admin replies
  useEffect(() => {
    if (!orderId || !customerPhone || !establishmentId || !canChat) return;

    let retryDelay = 2000;
    let retryAttempts = 0;
    const MAX_RECONNECT = 8;
    let mounted = true;

    function connect() {
      if (!mounted) return;

      const url = `/api/public-chat/stream?orderId=${orderId}&phone=${encodeURIComponent(
        customerPhone
      )}&establishmentId=${establishmentId}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        retryDelay = 2000;
        retryAttempts = 0;
      });

      const handlePublicChatMessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          // Admin reply: DB direction is "outgoing" (from restaurant)
          // In customer view, this is "incoming" (from restaurant to me)
          if (data.direction === "outgoing") {
            const newMsg: ChatMessage = {
              id: data.id || Date.now(),
              content: data.content,
              direction: "incoming", // show on left (from restaurant)
              createdAt: data.createdAt || new Date().toISOString(),
              mediaUrl: data.mediaUrl || null,
              mediaType: data.mediaType || null,
            };
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Update last admin message for bubble
            setLastAdminMessage(data.content);
            // Show bubble if chat is closed
            if (!isOpenRef.current) {
              setHasUnread(true);
              setShowBubble(true);
              // Auto-hide bubble after 10 seconds
              if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
              bubbleTimeoutRef.current = setTimeout(() => setShowBubble(false), 10000);
            }
          }
        } catch {
          /* ignore */
        }
      };

      es.addEventListener("public_chat_new_message", handlePublicChatMessage);
      // Compatibilidade com builds/abas antigos que ainda emitam o nome legado.
      es.addEventListener("public_chat_message", handlePublicChatMessage);

      es.onerror = () => {
        es.close();
        if (mounted && retryAttempts < MAX_RECONNECT) {
          retryAttempts++;
          const jitter = Math.random() * retryDelay * 0.3;
          setTimeout(connect, retryDelay + jitter);
          retryDelay = Math.min(retryDelay * 1.5, 20000);
        }
      };
    }

    connect();

    return () => {
      mounted = false;
      eventSourceRef.current?.close();
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [orderId, customerPhone, establishmentId, canChat]);

  // Show bubble on mount if there's an unread admin message
  useEffect(() => {
    if (lastAdminMessage && !isOpen) {
      setShowBubble(true);
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = setTimeout(() => setShowBubble(false), 8000);
    }
  }, [lastAdminMessage, isOpen]);

  // Scroll to bottom when messages change (only if user is near the bottom)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // Clear unread when chat opens
  useEffect(() => {
    if (isOpen && orderId) {
      setHasUnread(false);
      setShowBubble(false);
    }
  }, [isOpen, orderId]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = messageTextRef.current.trim();
    if (!text || !orderId || !customerPhone) return;

    // Optimistically add the message to local state (customer's own message = outgoing in UI)
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: text,
        direction: "outgoing" as const,
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessageText("");
    // Refocus input after sending
    setTimeout(() => inputRef.current?.focus(), 50);

    sendMutation.mutate(
      {
        orderId,
        phone: customerPhone,
        customerName,
        content: text,
        establishmentId,
      },
      {
        onSuccess: (data) => {
          // Update the temp message with the real ID
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: data.messageId } : m))
          );
        },
        onError: () => {
          // Remove the optimistic message on error
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setMessageText(text); // Restore the text
        },
      }
    );
  }, [orderId, customerPhone, customerName, establishmentId, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle image upload
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId || !customerPhone) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Formato não suportado. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande. O tamanho máximo é 5MB.");
      return;
    }

    setIsUploadingImage(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Full = reader.result as string;
      const base64 = base64Full.split(",")[1]; // Remove data:image/...;base64, prefix

      // Optimistically add image message
      const tempId = Date.now();
      const localPreview = URL.createObjectURL(file);
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          content: "📷 Imagem",
          direction: "outgoing" as const,
          createdAt: new Date().toISOString(),
          mediaUrl: localPreview,
          mediaType: "image",
        },
      ]);

      try {
        const result = await sendImageMutation.mutateAsync({
          orderId,
          phone: customerPhone,
          customerName,
          base64,
          mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          establishmentId,
        });

        // Update with real ID and URL
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: result.messageId, mediaUrl: result.mediaUrl }
              : m
          )
        );
      } catch {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert("Erro ao enviar imagem. Tente novamente.");
      } finally {
        setIsUploadingImage(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  }, [orderId, customerPhone, customerName, establishmentId, sendImageMutation]);

  // Don't render if no active orders or can't chat
  if (!canChat || !orderId) return null;

  // Truncate message for bubble (max 30 chars)
  const bubbleText = lastAdminMessage
    ? lastAdminMessage.length > 30
      ? lastAdminMessage.slice(0, 30) + "..."
      : lastAdminMessage
    : null;

  // Floating button (chat closed) - positioned at very bottom-right
  if (!isOpen) {
    return (
      <div
        className={cn(
          "fixed right-4 z-[60] flex items-center gap-2 transition-[bottom] duration-300 ease-out",
          isCartBarVisible ? "bottom-[4.35rem] md:bottom-6" : "bottom-6"
        )}
      >
        {/* Message bubble - to the left of the icon */}
        {showBubble && bubbleText && (
          <div
            className="animate-in fade-in slide-in-from-right-2 duration-300 relative max-w-[200px] rounded-xl bg-white px-3 py-2 text-xs text-gray-700 shadow-lg border border-gray-200 cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <p className="leading-snug">{bubbleText}</p>
            {/* Arrow pointing right */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-[-45deg]" />
          </div>
        )}

        {/* Chat icon button - 3% larger */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-[3.6rem] w-[3.6rem] items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-500 transition-transform hover:scale-105 active:scale-95"
          title="Chat com o restaurante"
        >
          <MessageCircle className="h-7 w-7" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
              !
            </span>
          )}
        </button>
      </div>
    );
  }

  // Chat panel (open)
  return (
    <div
      className={cn(
        "fixed right-4 z-[70] flex flex-col w-[340px] max-w-[calc(100vw-2rem)] h-[460px] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300",
        isCartBarVisible
          ? "bottom-[4.35rem] max-h-[calc(100vh-9rem)] md:bottom-4 md:max-h-[calc(100vh-6rem)]"
          : "bottom-4 max-h-[calc(100vh-6rem)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-red-500 text-white shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold leading-tight">Chat com o restaurante</h3>
          <p className="text-[11px] text-white/80">Pedido {displayOrderNumber}</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50/30"
        style={{
          backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp')`,
          backgroundSize: '400px auto',
          backgroundRepeat: 'repeat',
        }}
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-sm">
              <MessageCircle className="h-8 w-8 text-gray-400 mb-2 mx-auto" />
              <p className="text-sm text-gray-600 font-medium">Envie uma mensagem para o restaurante</p>
              <p className="text-xs text-gray-400 mt-1">Tire dúvidas sobre seu pedido</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.direction === "outgoing" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  msg.direction === "outgoing"
                    ? "bg-red-500 text-white rounded-br-md"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                )}
              >
                {/* Render image if present */}
                {msg.mediaUrl && msg.mediaType === "image" && (
                  <img
                    src={msg.mediaUrl}
                    alt="Imagem enviada"
                    className="rounded-lg mb-1.5 max-w-full max-h-[200px] object-cover cursor-pointer"
                    onClick={() => setPreviewImage(msg.mediaUrl!)}
                    loading="lazy"
                  />
                )}
                {/* Only show text content if it's not just the image placeholder */}
                {!(msg.mediaUrl && msg.mediaType === "image" && msg.content === "📷 Imagem") && (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    msg.direction === "outgoing" ? "text-white/70" : "text-gray-400"
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white shrink-0">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageSelect}
        />
        {/* Clip button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          title="Enviar imagem"
        >
          {isUploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          ) : (
            <Paperclip className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 transition-colors"
          maxLength={500}
        />
        <button
          onClick={handleSend}
          disabled={!messageText.trim() || sendMutation.isPending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
});

