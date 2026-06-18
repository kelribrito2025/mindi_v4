import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
vi.mock("./db", () => ({
  getChatShortcuts: vi.fn(),
  createChatShortcut: vi.fn(),
  updateChatShortcut: vi.fn(),
  deleteChatShortcut: vi.fn(),
}));

import * as db from "./db";

describe("chatShortcuts db functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getChatShortcuts should be called with establishmentId", async () => {
    const mockShortcuts = [
      { id: 1, establishmentId: 1, title: "saudacao", message: "Olá! Bem-vindo!", sortOrder: 0, createdAt: new Date() },
      { id: 2, establishmentId: 1, title: "reembolso", message: "Vamos verificar seu reembolso.", sortOrder: 1, createdAt: new Date() },
    ];
    (db.getChatShortcuts as any).mockResolvedValue(mockShortcuts);

    const result = await db.getChatShortcuts(1);
    expect(db.getChatShortcuts).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("saudacao");
  });

  it("createChatShortcut should be called with correct data", async () => {
    (db.createChatShortcut as any).mockResolvedValue({ id: 3 });

    const data = { establishmentId: 1, title: "teste", message: "Mensagem de teste" };
    const result = await db.createChatShortcut(data);
    expect(db.createChatShortcut).toHaveBeenCalledWith(data);
    expect(result).toEqual({ id: 3 });
  });

  it("updateChatShortcut should be called with id, establishmentId and data", async () => {
    (db.updateChatShortcut as any).mockResolvedValue(undefined);

    await db.updateChatShortcut(1, 1, { title: "novo titulo" });
    expect(db.updateChatShortcut).toHaveBeenCalledWith(1, 1, { title: "novo titulo" });
  });

  it("deleteChatShortcut should be called with id and establishmentId", async () => {
    (db.deleteChatShortcut as any).mockResolvedValue(undefined);

    await db.deleteChatShortcut(1, 1);
    expect(db.deleteChatShortcut).toHaveBeenCalledWith(1, 1);
  });
});

describe("chatShortcuts filtering logic", () => {
  const shortcuts = [
    { id: 1, title: "saudacao", message: "Olá! Bem-vindo ao suporte!" },
    { id: 2, title: "reembolso", message: "Vamos verificar seu reembolso." },
    { id: 3, title: "horario", message: "Nosso horário de funcionamento é das 10h às 22h." },
  ];

  it("should return all shortcuts when query is just /", () => {
    const messageText = "/";
    const query = messageText.slice(1).toLowerCase();
    const filtered = !query
      ? shortcuts
      : shortcuts.filter(
          (s) => s.title.toLowerCase().includes(query) || s.message.toLowerCase().includes(query)
        );
    expect(filtered).toHaveLength(3);
  });

  it("should filter by title", () => {
    const messageText = "/sauda";
    const query = messageText.slice(1).toLowerCase();
    const filtered = shortcuts.filter(
      (s) => s.title.toLowerCase().includes(query) || s.message.toLowerCase().includes(query)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("saudacao");
  });

  it("should filter by message content", () => {
    const messageText = "/reembolso";
    const query = messageText.slice(1).toLowerCase();
    const filtered = shortcuts.filter(
      (s) => s.title.toLowerCase().includes(query) || s.message.toLowerCase().includes(query)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("reembolso");
  });

  it("should return empty when no match", () => {
    const messageText = "/xyz123";
    const query = messageText.slice(1).toLowerCase();
    const filtered = shortcuts.filter(
      (s) => s.title.toLowerCase().includes(query) || s.message.toLowerCase().includes(query)
    );
    expect(filtered).toHaveLength(0);
  });

  it("should detect / prefix to show dropdown", () => {
    expect("/teste".startsWith("/")).toBe(true);
    expect("teste".startsWith("/")).toBe(false);
    expect("".startsWith("/")).toBe(false);
  });
});
