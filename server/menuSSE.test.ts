import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addMenuPublicConnection,
  removeMenuPublicConnection,
  sendMenuPublicEvent,
  getMenuPublicConnectionCount,
} from "./_core/sse";

// Mock de um Response Express
function createMockResponse() {
  const res: any = {
    write: vi.fn().mockReturnValue(true),
    flush: vi.fn(),
    headersSent: true,
  };
  return res;
}

describe("Menu Public SSE Manager", () => {
  beforeEach(() => {
    // Limpar conexões entre testes removendo todas as conexões conhecidas
    // Como não há um método reset, vamos apenas garantir que os testes são independentes
  });

  it("deve adicionar uma conexão para um estabelecimento", () => {
    const res = createMockResponse();
    const establishmentId = 99999; // ID único para evitar conflitos

    addMenuPublicConnection(establishmentId, res);
    expect(getMenuPublicConnectionCount(establishmentId)).toBe(1);

    // Cleanup
    removeMenuPublicConnection(establishmentId, res);
  });

  it("deve remover uma conexão de um estabelecimento", () => {
    const res = createMockResponse();
    const establishmentId = 99998;

    addMenuPublicConnection(establishmentId, res);
    expect(getMenuPublicConnectionCount(establishmentId)).toBe(1);

    removeMenuPublicConnection(establishmentId, res);
    expect(getMenuPublicConnectionCount(establishmentId)).toBe(0);
  });

  it("deve suportar múltiplas conexões para o mesmo estabelecimento", () => {
    const res1 = createMockResponse();
    const res2 = createMockResponse();
    const establishmentId = 99997;

    addMenuPublicConnection(establishmentId, res1);
    addMenuPublicConnection(establishmentId, res2);
    expect(getMenuPublicConnectionCount(establishmentId)).toBe(2);

    // Cleanup
    removeMenuPublicConnection(establishmentId, res1);
    removeMenuPublicConnection(establishmentId, res2);
  });

  it("deve enviar evento para todas as conexões de um estabelecimento", () => {
    const res1 = createMockResponse();
    const res2 = createMockResponse();
    const establishmentId = 99996;

    addMenuPublicConnection(establishmentId, res1);
    addMenuPublicConnection(establishmentId, res2);

    sendMenuPublicEvent(establishmentId, "story_created", {
      id: 1,
      establishmentId,
      type: "image",
    });

    expect(res1.write).toHaveBeenCalledTimes(1);
    expect(res2.write).toHaveBeenCalledTimes(1);

    // Verificar formato do evento SSE
    const call1 = res1.write.mock.calls[0][0] as string;
    expect(call1).toContain("event: story_created");
    expect(call1).toContain('"id":1');

    // Cleanup
    removeMenuPublicConnection(establishmentId, res1);
    removeMenuPublicConnection(establishmentId, res2);
  });

  it("não deve enviar evento para conexões de outro estabelecimento", () => {
    const res1 = createMockResponse();
    const res2 = createMockResponse();
    const establishmentId1 = 99995;
    const establishmentId2 = 99994;

    addMenuPublicConnection(establishmentId1, res1);
    addMenuPublicConnection(establishmentId2, res2);

    sendMenuPublicEvent(establishmentId1, "story_deleted", {
      id: 1,
      establishmentId: establishmentId1,
    });

    expect(res1.write).toHaveBeenCalledTimes(1);
    expect(res2.write).not.toHaveBeenCalled();

    // Cleanup
    removeMenuPublicConnection(establishmentId1, res1);
    removeMenuPublicConnection(establishmentId2, res2);
  });

  it("deve lidar com evento para estabelecimento sem conexões", () => {
    // Não deve lançar erro
    expect(() => {
      sendMenuPublicEvent(99993, "story_created", { id: 1 });
    }).not.toThrow();
  });

  it("deve remover conexão com erro de write e continuar com as demais", () => {
    const resGood = createMockResponse();
    const resBad = createMockResponse();
    resBad.write = vi.fn().mockImplementation(() => {
      throw new Error("Connection closed");
    });
    const establishmentId = 99992;

    addMenuPublicConnection(establishmentId, resGood);
    addMenuPublicConnection(establishmentId, resBad);

    sendMenuPublicEvent(establishmentId, "story_created", { id: 1 });

    // A conexão boa deve ter recebido o evento
    expect(resGood.write).toHaveBeenCalledTimes(1);
    // A conexão com erro deve ter sido removida
    expect(getMenuPublicConnectionCount(establishmentId)).toBe(1);

    // Cleanup
    removeMenuPublicConnection(establishmentId, resGood);
  });
});
