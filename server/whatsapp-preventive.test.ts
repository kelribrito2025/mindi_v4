import { describe, expect, it } from "vitest";

/**
 * Testes para validar as correções preventivas do fluxo WhatsApp.
 * Testa que as funções exportadas existem e têm a assinatura correta,
 * e que a lógica de prevenção está integrada nos pontos corretos.
 */

describe("WhatsApp Preventive Fixes - Code Structure", () => {
  
  it("clearPhoneFromOtherEstablishments is exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.clearPhoneFromOtherEstablishments).toBe("function");
  });

  it("ensureNonGlobalBotApiKey is exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.ensureNonGlobalBotApiKey).toBe("function");
  });

  it("updateWhatsappStatus is exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.updateWhatsappStatus).toBe("function");
  });

  it("deleteWhatsappConfig is exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.deleteWhatsappConfig).toBe("function");
  });

  it("clearPhoneFromOtherEstablishments accepts correct parameters", async () => {
    const db = await import("./db");
    // Function should accept (establishmentId: number, phone: string)
    expect(db.clearPhoneFromOtherEstablishments.length).toBe(2);
  });

  it("ensureNonGlobalBotApiKey accepts correct parameters", async () => {
    const db = await import("./db");
    // Function should accept (establishmentId: number, establishmentName: string)
    expect(db.ensureNonGlobalBotApiKey.length).toBe(2);
  });

  it("updateWhatsappStatus accepts correct parameters", async () => {
    const db = await import("./db");
    // Function should accept (establishmentId, status, connectedPhone?, qrCode?)
    // .length returns the number of required params (2: establishmentId, status)
    expect(db.updateWhatsappStatus.length).toBeGreaterThanOrEqual(2);
  });
});

describe("WhatsApp Preventive Fixes - Integration Points", () => {
  
  it("getStatus procedure includes clearPhoneFromOtherEstablishments call", async () => {
    // Read the routers source to verify the preventive code is in place
    const fs = await import("fs");
    const routersSource = fs.readFileSync(
      new URL("./routers.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify clearPhoneFromOtherEstablishments is called in the getStatus flow
    expect(routersSource).toContain("clearPhoneFromOtherEstablishments");
    expect(routersSource).toContain("// PREVENÇÃO: Ao conectar com um número, limpar esse número de outros estabelecimentos");
  });

  it("getStatus procedure includes ensureNonGlobalBotApiKey call", async () => {
    const fs = await import("fs");
    const routersSource = fs.readFileSync(
      new URL("./routers.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify ensureNonGlobalBotApiKey is called in getStatus when connected
    expect(routersSource).toContain("ensureNonGlobalBotApiKey");
    expect(routersSource).toContain("// PREVENÇÃO: Garantir que existe API key não-global para o N8N");
  });

  it("disconnect procedure clears connectedPhone", async () => {
    const fs = await import("fs");
    const routersSource = fs.readFileSync(
      new URL("./routers.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify disconnect calls updateWhatsappStatus with null for connectedPhone
    expect(routersSource).toContain("// Atualizar status no banco — LIMPAR connectedPhone ao desconectar");
    expect(routersSource).toContain("updateWhatsappStatus(establishment.id, 'disconnected', null, null)");
  });

  it("establishment update mutation auto-creates non-global API key when bot is enabled", async () => {
    const fs = await import("fs");
    const routersSource = fs.readFileSync(
      new URL("./routers.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify the bot toggle creates API key
    expect(routersSource).toContain("if (data.whatsappBotEnabled === true)");
    expect(routersSource).toContain("ensureNonGlobalBotApiKey(id, est.name)");
    expect(routersSource).toContain("// PREVENÇÃO: Ao ativar o bot, garantir que existe API key não-global para o N8N");
  });

  it("updateWhatsappStatus properly handles null connectedPhone", async () => {
    const fs = await import("fs");
    const dbSource = fs.readFileSync(
      new URL("./db.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify the function checks for undefined (not null) before including connectedPhone
    expect(dbSource).toContain("if (connectedPhone !== undefined)");
    expect(dbSource).toContain("updateData.connectedPhone = connectedPhone");
  });

  it("clearPhoneFromOtherEstablishments uses ne() to exclude current establishment", async () => {
    const fs = await import("fs");
    const dbSource = fs.readFileSync(
      new URL("./db.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify the function uses ne() to exclude the current establishment
    expect(dbSource).toContain("ne(whatsappConfig.establishmentId, currentEstablishmentId)");
    expect(dbSource).toContain("eq(whatsappConfig.connectedPhone, phone)");
    expect(dbSource).toContain("set({ connectedPhone: null })");
  });

  it("ensureNonGlobalBotApiKey checks for existing key before creating", async () => {
    const fs = await import("fs");
    const dbSource = fs.readFileSync(
      new URL("./db.ts", import.meta.url).pathname.replace("file:", ""),
      "utf-8"
    );
    
    // Verify it checks for existing non-global key first
    expect(dbSource).toContain("eq(botApiKeys.isGlobal, false)");
    expect(dbSource).toContain("eq(botApiKeys.isActive, true)");
    expect(dbSource).toContain("return { apiKey: existing[0].apiKey, created: false }");
    // And creates new one if not found
    expect(dbSource).toContain("isGlobal: false");
    expect(dbSource).toContain("return { apiKey, created: true }");
  });
});
