import { describe, it, expect } from "vitest";

describe("Telegram Bot Token Validation", () => {
  it("should validate the bot token via getMe API", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token).toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.is_bot).toBe(true);
    expect(data.result.username).toBe("Mindi_pedidos_bot");
  });
});
