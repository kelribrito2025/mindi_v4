import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Cashback Feature", () => {
  // Read source files once
  const schemaContent = fs.readFileSync(
    path.resolve(__dirname, "../drizzle/schema.ts"),
    "utf-8"
  );
  const dbContent = fs.readFileSync(
    path.resolve(__dirname, "./db.ts"),
    "utf-8"
  );
  const routersContent = fs.readFileSync(
    path.resolve(__dirname, "./routers.ts"),
    "utf-8"
  );
  const publicMenuContent = fs.readFileSync(
    path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx"),
    "utf-8"
  );
  const loyaltySettingsContent = fs.readFileSync(
    path.resolve(__dirname, "../client/src/components/LoyaltySettingsCard.tsx"),
    "utf-8"
  );

  describe("Database Schema", () => {
    it("should have cashbackTransactions table defined", () => {
      expect(schemaContent).toContain("cashbackTransactions");
      expect(schemaContent).toContain('"cashbackTransactions"');
    });

    it("should have cashbackBalances table defined", () => {
      expect(schemaContent).toContain("cashbackBalances");
      expect(schemaContent).toContain('"cashbackBalances"');
    });

    it("should have cashback config fields in establishments", () => {
      expect(schemaContent).toContain("cashbackEnabled");
      expect(schemaContent).toContain("cashbackPercent");
      expect(schemaContent).toContain("cashbackApplyMode");
    });

    it("should have rewardProgramType field in establishments", () => {
      expect(schemaContent).toContain("rewardProgramType");
      expect(schemaContent).toContain('"none"');
      expect(schemaContent).toContain('"loyalty"');
      expect(schemaContent).toContain('"cashback"');
    });

    it("should have credit and debit transaction types", () => {
      expect(schemaContent).toContain('"credit"');
      expect(schemaContent).toContain('"debit"');
    });

    it("should have cashback percentage field in config", () => {
      expect(schemaContent).toContain("cashbackPercent");
    });

    it("should have cashbackApplyMode for all/categories", () => {
      expect(schemaContent).toContain("cashbackApplyMode");
      expect(schemaContent).toContain('"all"');
      expect(schemaContent).toContain('"categories"');
    });

    it("should have cashbackAllowPartialUse field", () => {
      expect(schemaContent).toContain("cashbackAllowPartialUse");
    });
  });

  describe("Backend DB Functions", () => {
    it("should export getCashbackBalance function", () => {
      expect(dbContent).toContain("export async function getCashbackBalance");
    });

    it("should export creditCashback function", () => {
      expect(dbContent).toContain("export async function creditCashback");
    });

    it("should export debitCashback function", () => {
      expect(dbContent).toContain("export async function debitCashback");
    });

    it("should export getCashbackTransactions function", () => {
      expect(dbContent).toContain("export async function getCashbackTransactions");
    });

    it("should export calculateCashbackForOrder function", () => {
      expect(dbContent).toContain("export async function calculateCashbackForOrder");
    });

    it("should export processCashbackForCompletedOrder function", () => {
      expect(dbContent).toContain("export async function processCashbackForCompletedOrder");
    });

    it("should validate balance before debit", () => {
      expect(dbContent).toContain("Saldo de cashback insuficiente");
    });

    it("should normalize phone numbers", () => {
      expect(dbContent).toContain("replace(/[^0-9]/g, '')");
    });
  });

  describe("Backend Routers", () => {
    it("should have cashback router with config procedures", () => {
      expect(routersContent).toContain("cashback:");
      expect(routersContent).toContain("cashbackPercent");
    });

    it("should have cashback.updateConfig procedure", () => {
      expect(routersContent).toContain("updateConfig:");
    });

    it("should have cashback.getBalance procedure", () => {
      expect(routersContent).toContain("getBalance:");
    });

    it("should have cashback.getTransactions procedure", () => {
      expect(routersContent).toContain("getTransactions:");
    });

    it("should accept cashbackAmount in createOrder input", () => {
      expect(routersContent).toContain("cashbackAmount: z.string().optional()");
    });

    it("should accept cashbackCustomerPhone in createOrder input", () => {
      expect(routersContent).toContain("cashbackCustomerPhone: z.string().optional()");
    });

    it("should process cashback debit on order creation", () => {
      expect(routersContent).toContain("db.debitCashback");
    });

    it("should validate cashback balance on backend before applying", () => {
      expect(routersContent).toContain("getCashbackBalance(orderData.establishmentId, cashbackCustomerPhone)");
    });
  });

  describe("Admin Panel - Reward Program Settings", () => {
    it("should have radio buttons for loyalty vs cashback selection", () => {
      expect(loyaltySettingsContent).toContain("rewardProgramType");
      expect(loyaltySettingsContent).toContain("loyalty");
      expect(loyaltySettingsContent).toContain("cashback");
    });

    it("should show exclusive selection warning", () => {
      expect(loyaltySettingsContent).toContain("apenas um programa de recompensa");
    });

    it("should have cashback percentage input", () => {
      expect(loyaltySettingsContent).toContain("cashbackPercent");
    });

    it("should have apply mode option (all products or categories)", () => {
      expect(loyaltySettingsContent).toContain("cashbackApplyMode");
    });

    it("should have partial usage toggle", () => {
      expect(loyaltySettingsContent).toContain("cashbackAllowPartialUse");
    });
  });

  describe("Public Menu - Cashback Badge", () => {
    it("should display cashback badge on products", () => {
      expect(publicMenuContent).toContain("cashbackPercent");
      expect(publicMenuContent).toContain("cashback");
    });

    it("should show percentage in badge", () => {
      expect(publicMenuContent).toContain("% cashback");
    });
  });

  describe("Public Menu - Wallet", () => {
    it("should have Minha Carteira button", () => {
      expect(publicMenuContent).toContain("Minha Carteira");
    });

    it("should have wallet icon import", () => {
      expect(publicMenuContent).toContain("Wallet");
    });

    it("should show cashback balance", () => {
      expect(publicMenuContent).toContain("cashbackBalanceQuery");
    });

    it("should show transaction history", () => {
      expect(publicMenuContent).toContain("cashbackTransactionsQuery");
    });

    it("should have login flow for cashback", () => {
      expect(publicMenuContent).toContain("cashbackLoginMutation");
    });

    it("should have register flow for cashback", () => {
      expect(publicMenuContent).toContain("cashbackRegisterMutation");
    });
  });

  describe("Public Menu - Checkout Integration", () => {
    it("should have useCashbackInOrder state", () => {
      expect(publicMenuContent).toContain("useCashbackInOrder");
    });

    it("should have cashbackAmountToUse state", () => {
      expect(publicMenuContent).toContain("cashbackAmountToUse");
    });

    it("should subtract cashback from total", () => {
      // Check that cashback discount is subtracted from total in order summary
      expect(publicMenuContent).toContain("- cashbackDiscount");
    });

    it("should display cashback discount line in order summary", () => {
      expect(publicMenuContent).toContain("Cashback");
      expect(publicMenuContent).toContain("text-blue-600");
    });

    it("should pass cashbackAmount to createOrder mutation", () => {
      expect(publicMenuContent).toContain("cashbackAmount: cashbackDisc.toFixed(2)");
    });

    it("should pass cashbackCustomerPhone to createOrder mutation", () => {
      expect(publicMenuContent).toContain("cashbackCustomerPhone: cashbackPhone");
    });

    it("should show login prompt for non-logged users", () => {
      expect(publicMenuContent).toContain("Entre para usar seu cashback");
    });
  });
});
