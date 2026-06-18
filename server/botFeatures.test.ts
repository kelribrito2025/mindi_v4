import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Bot Features Configuration", () => {
  it("schema should have botOrdersEnabled and botQuestionsEnabled columns", async () => {
    const { establishments } = await import("../drizzle/schema");
    
    // Verify the columns exist in the schema
    expect(establishments.botOrdersEnabled).toBeDefined();
    expect(establishments.botQuestionsEnabled).toBeDefined();
  });

  it("establishment router accepts botOrdersEnabled and botQuestionsEnabled in update input", () => {
    const routerSource = fs.readFileSync(
      path.join(__dirname, "routers/establishment.ts"),
      "utf-8"
    );
    
    expect(routerSource).toContain("botOrdersEnabled: z.boolean().optional()");
    expect(routerSource).toContain("botQuestionsEnabled: z.boolean().optional()");
  });

  it("botApiRouter bot-status endpoint returns ordersEnabled and questionsEnabled", () => {
    const botApiSource = fs.readFileSync(
      path.join(__dirname, "botApiRouter.ts"),
      "utf-8"
    );
    
    expect(botApiSource).toContain("ordersEnabled: establishment.botOrdersEnabled");
    expect(botApiSource).toContain("questionsEnabled: establishment.botQuestionsEnabled");
  });

  it("botApiRouter POST /orders checks botOrdersEnabled before creating order", () => {
    const botApiSource = fs.readFileSync(
      path.join(__dirname, "botApiRouter.ts"),
      "utf-8"
    );
    
    // Verify the guard exists
    expect(botApiSource).toContain("BOT_ORDERS_DISABLED");
    expect(botApiSource).toContain("botOrdersEnabled");
    expect(botApiSource).toContain("A função de retirar pedidos pelo bot está desativada");
  });

  it("BotWhatsApp page has toggle controls for bot features", () => {
    const botPageSource = fs.readFileSync(
      path.join(__dirname, "../client/src/pages/BotWhatsApp.tsx"),
      "utf-8"
    );
    
    // Verify the page has the feature toggles
    expect(botPageSource).toContain("botOrdersEnabled");
    expect(botPageSource).toContain("botQuestionsEnabled");
    expect(botPageSource).toContain("Funcionalidades do Bot");
    expect(botPageSource).toContain("Responder perguntas");
    expect(botPageSource).toContain("Retirar pedidos");
    expect(botPageSource).toContain("handleToggleOrders");
    expect(botPageSource).toContain("handleToggleQuestions");
  });

  it("BotWhatsApp page disables toggles when bot is inactive", () => {
    const botPageSource = fs.readFileSync(
      path.join(__dirname, "../client/src/pages/BotWhatsApp.tsx"),
      "utf-8"
    );
    
    // Verify the toggles are disabled when bot is off
    expect(botPageSource).toContain("disabled={!botEnabled");
    expect(botPageSource).toContain("Ative o Mindi Bot acima para poder configurar as funcionalidades");
  });
});
