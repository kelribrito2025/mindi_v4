import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Tests to verify the celebration modal:
 * 1. Uses Dialog component (not Sheet) for the celebration view
 * 2. Unified for both mobile and desktop (single Dialog)
 * 3. Updated text with benefits list instead of old message
 * 4. "Setup completo" text instead of progress bar
 * 5. "Compartilhar Cardápio" button with share modal
 * 6. Share modal with copy link and WhatsApp share
 */

const welcomeChecklistPath = join(__dirname, "../client/src/components/WelcomeChecklist.tsx");
const source = readFileSync(welcomeChecklistPath, "utf-8");

// Helper: extract the celebration section (from CELEBRATION CONTENT marker to next top-level return)
function getCelebrationSection(): string {
  const celebrationStart = source.indexOf("// ==================== CELEBRATION CONTENT ====================");
  const ifIdx = source.indexOf("if (showCelebration)", celebrationStart);
  const returnInIf = source.indexOf("return (", ifIdx);
  const nextReturn = source.indexOf("  return (", returnInIf + 10);
  return source.substring(celebrationStart, nextReturn);
}

describe("Celebration modal structure", () => {
  it("should import Dialog components", () => {
    expect(source).toContain('from "@/components/ui/dialog"');
    expect(source).toContain("Dialog,");
    expect(source).toContain("DialogContent,");
  });

  it("should use Dialog in celebration, not Sheet", () => {
    const section = getCelebrationSection();
    expect(section).toContain("<Dialog");
    expect(section).toContain("<DialogContent");
    expect(section).not.toContain("<Sheet ");
    expect(section).not.toContain("<SheetContent");
  });

  it("should have a single unified Dialog for both mobile and desktop", () => {
    const section = getCelebrationSection();
    // Count the celebration Dialog (not the share modal)
    const dialogOpenTags = section.match(/<Dialog /g) || [];
    // Should have 2 Dialogs: celebration + share modal
    expect(dialogOpenTags.length).toBe(2);
    // Should NOT have responsive breakpoint classes that split mobile/desktop
    expect(section).not.toContain("hidden md:block");
  });

  it("should prevent closing by clicking outside", () => {
    const section = getCelebrationSection();
    expect(section).toContain("onInteractOutside");
    expect(section).toContain("preventDefault");
  });
});

describe("Celebration modal text content", () => {
  it("should have 'Setup completo' text instead of progress bar", () => {
    const section = getCelebrationSection();
    expect(section).toContain("Setup completo");
    expect(section).toContain("etapas concluídas");
  });

  it("should NOT have the old progress bar", () => {
    const section = getCelebrationSection();
    // The old progress bar had "Todos os passos concluídos" and a green gradient bar
    expect(section).not.toContain("Todos os passos concluídos");
    // Should not have the progress bar div
    expect(section).not.toContain("from-green-500 to-green-400 rounded-full w-full");
  });

  it("should have benefits list", () => {
    const section = getCelebrationSection();
    expect(section).toContain("Agora você já pode:");
    expect(section).toContain("Compartilhar seu cardápio");
    expect(section).toContain("Receber pedidos online");
    expect(section).toContain("Gerenciar pedidos no painel");
  });

  it("should still have PartyPopper icon and Parabéns title", () => {
    const section = getCelebrationSection();
    expect(section).toContain("<PartyPopper");
    expect(section).toContain("Parabéns!");
  });

  it("should have 'Ir para o Dashboard' button", () => {
    const section = getCelebrationSection();
    expect(section).toContain("Ir para o Dashboard");
    expect(section).toContain("<Rocket");
  });
});

describe("Share functionality", () => {
  it("should have 'Compartilhar Cardápio' button", () => {
    const section = getCelebrationSection();
    expect(section).toContain("Compartilhar Cardápio");
    expect(section).toContain("setShowShareModal(true)");
  });

  it("should have Share2 icon for the share button", () => {
    const section = getCelebrationSection();
    expect(section).toContain("<Share2");
  });

  it("should have a share modal with Dialog", () => {
    const section = getCelebrationSection();
    expect(section).toContain("showShareModal");
    expect(section).toContain("Compartilhar Cardápio");
  });

  it("should have copy link functionality", () => {
    const section = getCelebrationSection();
    expect(section).toContain("Copiar link");
    expect(section).toContain("handleCopyLink");
    expect(section).toContain("navigator.clipboard.writeText");
  });

  it("should have WhatsApp share functionality", () => {
    const section = getCelebrationSection();
    expect(section).toContain("Compartilhar no WhatsApp");
    expect(section).toContain("handleShareWhatsApp");
    expect(section).toContain("wa.me");
  });

  it("should construct menu URL from menuSlug", () => {
    expect(source).toContain("v2.mindi.com.br/menu/");
    expect(source).toContain("menuSlug");
  });

  it("should show the menu link in the share modal", () => {
    const section = getCelebrationSection();
    expect(section).toContain("{menuUrl}");
    expect(section).toContain("<Link2");
  });

  it("should show 'Copiado!' feedback after copying", () => {
    const section = getCelebrationSection();
    expect(section).toContain("linkCopied");
    expect(section).toContain("Copiado!");
  });
});

describe("handleDismissCelebration", () => {
  it("should exist and set dismissed in localStorage", () => {
    expect(source).toContain("handleDismissCelebration");
    expect(source).toContain('localStorage.setItem(dismissedKey, "true")');
  });
});
