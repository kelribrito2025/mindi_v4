/**
 * Chat localStorage storage utility.
 * All conversations and messages are stored in the browser's localStorage.
 * Data is keyed by establishment (so different logins don't mix).
 */

// ==================== TYPES ====================

export interface LocalConversation {
  id: string; // remoteJid as unique key (e.g. "5511987654321@s.whatsapp.net")
  phone: string;
  contactName: string | null;
  profilePicUrl: string | null;
  status: "bot" | "human" | "closed";
  unreadCount: number;
  lastMessageAt: number; // timestamp ms
  lastMessageText: string;
}

export interface LocalMessage {
  id: string; // unique id (messageId from UAZAPI or generated)
  conversationId: string; // remoteJid
  direction: "incoming" | "outgoing";
  content: string;
  messageType: string;
  mediaUrl: string | null;
  createdAt: number; // timestamp ms
  fromBot?: boolean; // true if message was sent automatically by the bot (via webhook fromMe)
}

// ==================== KEYS ====================

const CONVERSATIONS_KEY = "mindi_chat_conversations";
const MESSAGES_KEY_PREFIX = "mindi_chat_messages_";
const MAX_MESSAGES_PER_CONV = 500; // limit per conversation to avoid localStorage bloat

// ==================== CONVERSATIONS ====================

export function getConversations(): LocalConversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const convs: LocalConversation[] = JSON.parse(raw);
    // Sort by lastMessageAt descending
    return convs.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  } catch {
    return [];
  }
}

export function getConversation(remoteJid: string): LocalConversation | null {
  const convs = getConversations();
  return convs.find((c) => c.id === remoteJid) || null;
}

export function upsertConversation(conv: LocalConversation): void {
  const convs = getConversations();
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    convs[idx] = { ...convs[idx], ...conv };
  } else {
    convs.push(conv);
  }
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
}

export function updateConversationPartial(
  remoteJid: string,
  updates: Partial<LocalConversation>
): void {
  const convs = getConversations();
  const idx = convs.findIndex((c) => c.id === remoteJid);
  if (idx >= 0) {
    convs[idx] = { ...convs[idx], ...updates };
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }
}

export function markConversationAsRead(remoteJid: string): void {
  updateConversationPartial(remoteJid, { unreadCount: 0 });
}

export function getTotalUnreadCount(): number {
  const convs = getConversations();
  return convs.reduce((sum, c) => sum + c.unreadCount, 0);
}

// ==================== MESSAGES ====================

function messagesKey(remoteJid: string): string {
  return MESSAGES_KEY_PREFIX + remoteJid;
}

export function getMessages(remoteJid: string): LocalMessage[] {
  try {
    const raw = localStorage.getItem(messagesKey(remoteJid));
    if (!raw) return [];
    const msgs: LocalMessage[] = JSON.parse(raw);
    // Sort by createdAt ascending (oldest first)
    return msgs.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export function addMessage(msg: LocalMessage): void {
  const key = messagesKey(msg.conversationId);
  const msgs = getMessages(msg.conversationId);

  // Avoid duplicates by id
  if (msgs.some((m) => m.id === msg.id)) return;

  msgs.push(msg);

  // Trim to max
  const trimmed = msgs.length > MAX_MESSAGES_PER_CONV
    ? msgs.slice(msgs.length - MAX_MESSAGES_PER_CONV)
    : msgs;

  localStorage.setItem(key, JSON.stringify(trimmed));
}

/**
 * Process an incoming SSE message event and store it locally.
 * Also updates the conversation list.
 */
export function processIncomingMessage(data: {
  remoteJid?: string | null;
  phone?: string;
  contactName?: string;
  profilePicUrl?: string;
  messageId?: string | null;
  id?: string | null;
  content?: string;
  messageType?: string;
  mediaUrl?: string;
  direction: "incoming" | "outgoing";
  timestamp?: number;
  fromMe?: boolean;
}): { conversation: LocalConversation; message: LocalMessage } | null {
  const remoteJid = typeof data.remoteJid === "string" ? data.remoteJid.trim() : "";
  if (remoteJid.length === 0) {
    console.warn("[chatStorage] Ignorando mensagem sem remoteJid", data);
    return null;
  }
  const messageIdentifier = data.messageId || data.id || null;
  const phone = data.phone || remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
  const now = data.timestamp || Date.now();
  const direction = data.fromMe ? "outgoing" : (data.direction || "incoming");

  // Create/update conversation
  const existing = getConversation(remoteJid);
  const conversation: LocalConversation = {
    id: remoteJid,
    phone,
    contactName: data.contactName || existing?.contactName || null,
    profilePicUrl: data.profilePicUrl || existing?.profilePicUrl || null,
    status: existing?.status || "bot",
    unreadCount: direction === "incoming"
      ? (existing?.unreadCount || 0) + 1
      : (existing?.unreadCount || 0),
    lastMessageAt: now,
    lastMessageText: data.content || `[${data.messageType || "text"}]`,
  };
  upsertConversation(conversation);

  // Create message
  const message: LocalMessage = {
    id: messageIdentifier || `local_${now}_${Math.random().toString(36).slice(2, 8)}`,
    conversationId: remoteJid,
    direction,
    content: data.content || "",
    messageType: data.messageType || "text",
    mediaUrl: data.mediaUrl || null,
    createdAt: now,
    fromBot: data.fromMe === true, // messages from webhook with fromMe=true are bot responses
  };
  addMessage(message);

  return { conversation, message };
}

/**
 * Add an outgoing message (sent by the user from the dashboard).
 */
export function addOutgoingMessage(
  remoteJid: string,
  text: string,
  messageId?: string
): LocalMessage {
  const now = Date.now();
  const msg: LocalMessage = {
    id: messageId || `out_${now}_${Math.random().toString(36).slice(2, 8)}`,
    conversationId: remoteJid,
    direction: "outgoing",
    content: text,
    messageType: "text",
    mediaUrl: null,
    createdAt: now,
    fromBot: false, // manual message from dashboard attendant
  };
  addMessage(msg);

  // Update conversation
  updateConversationPartial(remoteJid, {
    lastMessageAt: now,
    lastMessageText: text,
  });

  return msg;
}

/**
 * Clear all chat data from localStorage.
 */
export function clearAllChatData(): void {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key === CONVERSATIONS_KEY || key.startsWith(MESSAGES_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Update conversation status (bot/human/closed).
 */
export function updateConversationStatus(
  remoteJid: string,
  status: "bot" | "human" | "closed"
): void {
  updateConversationPartial(remoteJid, { status });
}
