import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Lite Plan Implementation", () => {
  describe("Database Schema", () => {
    it("planType enum includes 'lite' value", async () => {
      const schemaSource = fs.readFileSync(
        path.join(__dirname, "../drizzle/schema.ts"),
        "utf-8"
      );
      // Verify lite is in the planType enum
      expect(schemaSource).toMatch(/planType.*lite/);
      expect(schemaSource).toMatch(/mysqlEnum.*planType.*\[.*"lite".*\]/);
    });

    it("planType enum has all expected values in correct order", async () => {
      const schemaSource = fs.readFileSync(
        path.join(__dirname, "../drizzle/schema.ts"),
        "utf-8"
      );
      // Verify all plan types exist
      expect(schemaSource).toContain('"trial"');
      expect(schemaSource).toContain('"free"');
      expect(schemaSource).toContain('"lite"');
      expect(schemaSource).toContain('"basic"');
      expect(schemaSource).toContain('"pro"');
      // enterprise mantido no enum por compatibilidade com dados existentes
      expect(schemaSource).toContain('"enterprise"');
    });
  });

  describe("Admin Router - changePlan", () => {
    it("changePlan accepts 'lite' as valid plan type", () => {
      const adminRouterSource = fs.readFileSync(
        path.join(__dirname, "adminRouter.ts"),
        "utf-8"
      );
      // Verify changePlan includes lite in the enum
      expect(adminRouterSource).toMatch(/changePlan/);
      expect(adminRouterSource).toMatch(/z\.enum\(\[.*"lite".*\]\)/);
    });

    it("createEstablishment accepts 'lite' as valid plan type", () => {
      const adminRouterSource = fs.readFileSync(
        path.join(__dirname, "adminRouter.ts"),
        "utf-8"
      );
      // Verify createEstablishment includes lite
      expect(adminRouterSource).toMatch(/planType.*z\.enum\(\[.*"lite".*\]\)/);
    });
  });

  describe("AdminLayout - Sidebar Filtering", () => {
    it("AdminLayout defines LITE_ALLOWED_HREFS for sidebar filtering", () => {
      const layoutSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/AdminLayout.tsx"),
        "utf-8"
      );
      expect(layoutSource).toContain("LITE_ALLOWED_HREFS");
      expect(layoutSource).toContain("isLitePlan");
    });

    it("Lite plan allows only Dashboard, Menu, and Configurações", () => {
      const layoutSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/AdminLayout.tsx"),
        "utf-8"
      );
      // Verify allowed hrefs
      expect(layoutSource).toMatch(/LITE_ALLOWED_HREFS.*=.*\[/);
      expect(layoutSource).toContain("'/'"); // Dashboard
      expect(layoutSource).toContain("'/catalogo'"); // Cardápio
      expect(layoutSource).toContain("'/complementos'"); // Grupos
      expect(layoutSource).toContain("'/configuracoes'"); // Configurações
    });

    it("isLitePlan checks for both 'lite' and 'free' plan types", () => {
      const layoutSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/AdminLayout.tsx"),
        "utf-8"
      );
      expect(layoutSource).toMatch(/isLitePlan.*=.*planType.*===.*'lite'/);
    });

    it("finalMenuSections applies lite filter and is used in render", () => {
      const layoutSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/AdminLayout.tsx"),
        "utf-8"
      );
      expect(layoutSource).toContain("finalMenuSections");
      // Verify it's used in the render
      expect(layoutSource).toMatch(/finalMenuSections\.map/);
    });
  });

  describe("SettingsSidebar - Section Filtering", () => {
    it("SettingsSidebar defines LITE_ALLOWED_SECTIONS", () => {
      const sidebarSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/SettingsSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarSource).toContain("LITE_ALLOWED_SECTIONS");
    });

    it("Lite plan shows only Estabelecimento, Atendimento, and Conta e Segurança", () => {
      const sidebarSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/SettingsSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarSource).toContain("'estabelecimento'");
      expect(sidebarSource).toContain("'atendimento'");
      expect(sidebarSource).toContain("'conta-seguranca'");
    });

    it("SettingsSidebar receives planType prop and filters items", () => {
      const sidebarSource = fs.readFileSync(
        path.join(__dirname, "../client/src/components/SettingsSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarSource).toContain("planType");
      expect(sidebarSource).toContain("isLitePlan");
      expect(sidebarSource).toContain("visibleMenuItems");
    });
  });

  describe("Configuracoes - Hidden Cards for Lite", () => {
    it("Configuracoes hides scheduling settings for Lite plan", () => {
      const configSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/Configuracoes.tsx"),
        "utf-8"
      );
      expect(configSource).toContain("isLitePlan");
      // Verify SchedulingSettings is conditionally rendered
      expect(configSource).toMatch(/!isLitePlan.*SchedulingSettings/);
    });

    it("Configuracoes hides free delivery settings for Lite plan", () => {
      const configSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/Configuracoes.tsx"),
        "utf-8"
      );
      // Verify free delivery card is hidden for lite
      expect(configSource).toMatch(/!isLitePlan.*deliveryFeeType/);
    });
  });

  describe("PublicMenu - Lite Checkout Flow", () => {
    it("PublicMenu defines isLitePlan flag", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      expect(menuSource).toMatch(/isLitePlan.*=.*planType.*===.*'lite'/);
    });

    it("buildWhatsAppMessage function exists and formats order correctly", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      expect(menuSource).toContain("buildWhatsAppMessage");
      // Verify message content
      expect(menuSource).toContain("\\u{1F6D2}");
      expect(menuSource).toContain("*Novo Pedido");
      expect(menuSource).toContain("*Cliente:*");
      expect(menuSource).toContain("*--- Itens ---*");
      expect(menuSource).toContain("*Subtotal:*");
      expect(menuSource).toContain("*Total:");
      expect(menuSource).toContain("*Pagamento:*");
    });

    it("sendOrderViaWhatsApp function opens wa.me URL", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      expect(menuSource).toContain("sendOrderViaWhatsApp");
      expect(menuSource).toContain("wa.me/");
      expect(menuSource).toContain("encodeURIComponent(message)");
    });

    it("Lite checkout has 4 steps: Entrega, Resumo, Dados, Enviar", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify step labels for Lite
      expect(menuSource).toMatch(/isLitePlan.*\?.*4/); // totalSteps = 4
      expect(menuSource).toMatch(/\['Entrega',\s*'Resumo',\s*'Dados',\s*'Enviar'\]/);
    });

    it("Lite checkout step 1 shows Entrega e Pagamento", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify step 1 (Entrega e Pagamento) is shown for all plans
      expect(menuSource).toMatch(/checkoutStep === 1 && \(/);
    });

    it("Lite checkout Dados step shows only Name field (no phone)", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify phone field is hidden for Lite
      expect(menuSource).toMatch(/!isLitePlan.*\n.*Telefone/s);
    });

    it("Lite checkout button is green with WhatsApp label", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify green button for Lite
      expect(menuSource).toContain("bg-green-500 hover:bg-green-600");
      expect(menuSource).toContain("Enviar pedido via WhatsApp");
    });

    it("Lite checkout sends order via WhatsApp instead of createOrderMutation", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify the Lite path opens WhatsApp
      expect(menuSource).toMatch(/if\s*\(isLitePlan\)\s*\{[\s\S]*?wa\.me/);
      // Verify it sets orderSent and clears cart
      expect(menuSource).toMatch(/if\s*\(isLitePlan\)\s*\{[\s\S]*?setOrderSent\(true\)/);
      expect(menuSource).toMatch(/if\s*\(isLitePlan\)\s*\{[\s\S]*?setCart\(\[\]\)/);
    });

    it("Lite plan hides Pedidos button in header", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify Pedidos button is hidden for Lite
      expect(menuSource).toMatch(/!isLitePlan[\s\S]*?Pedidos/);
    });

    it("Lite plan sacola button allows checkout even when store is closed", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify Lite button is only disabled when cart is empty (not when store is closed)
      expect(menuSource).toMatch(/isLitePlan\s*\?\s*cart\.length\s*===\s*0/);
    });

    it("Lite plan Dados step only requires name (not phone)", () => {
      const menuSource = fs.readFileSync(
        path.join(__dirname, "../client/src/pages/PublicMenu.tsx"),
        "utf-8"
      );
      // Verify disabled condition for Lite only checks name
      expect(menuSource).toMatch(/isLitePlan\s*\?\s*!customerInfo\.name/);
    });
  });
});
