import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("delete confirmation modal (no window.confirm)", () => {
  const financasPath = path.resolve(
    __dirname,
    "../client/src/pages/Financas.tsx"
  );
  const financasContent = fs.readFileSync(financasPath, "utf-8");

  it("should NOT contain any window.confirm or bare confirm() calls", () => {
    // Match window.confirm(...) or standalone confirm(...) used as native browser dialog
    const windowConfirmMatches = financasContent.match(/window\.confirm\s*\(/g);
    expect(windowConfirmMatches).toBeNull();

    // Check for bare confirm( that is NOT part of showDeleteConfirm, payConfirm, setPayConfirm, deleteConfirm, setDeleteConfirm
    const lines = financasContent.split("\n");
    const bareConfirmLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip imports, comments, and known safe patterns
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("import")) continue;
      // Match standalone confirm( but not showDeleteConfirm, payConfirm*, deleteConfirm*
      if (/\bconfirm\s*\(/.test(trimmed) && !/showDeleteConfirm|payConfirm|deleteConfirm|setPayConfirm|setDeleteConfirm|AlertDialogAction|Confirmar/.test(trimmed)) {
        bareConfirmLines.push(trimmed);
      }
    }
    expect(bareConfirmLines).toEqual([]);
  });

  it("should import AlertDialog components from shadcn/ui", () => {
    expect(financasContent).toContain("AlertDialog");
    expect(financasContent).toContain("AlertDialogContent");
    expect(financasContent).toContain("AlertDialogAction");
    expect(financasContent).toContain("AlertDialogCancel");
    expect(financasContent).toContain("from \"@/components/ui/alert-dialog\"");
  });

  it("should have deleteConfirmOpen state and showDeleteConfirm callback", () => {
    expect(financasContent).toContain("deleteConfirmOpen");
    expect(financasContent).toContain("setDeleteConfirmOpen");
    expect(financasContent).toContain("showDeleteConfirm");
    expect(financasContent).toContain("deleteConfirmMessage");
    expect(financasContent).toContain("deleteConfirmAction");
  });

  it("should render the AlertDialog delete confirmation modal in JSX", () => {
    // Check that the AlertDialog is rendered with the correct open prop
    expect(financasContent).toContain("open={deleteConfirmOpen}");
    expect(financasContent).toContain("Confirmar exclusão");
    expect(financasContent).toContain("{deleteConfirmMessage}");
    expect(financasContent).toContain("Cancelar");
    expect(financasContent).toContain("Excluir");
  });

  it("should use showDeleteConfirm for all delete actions", () => {
    // All delete buttons should call showDeleteConfirm instead of confirm()
    const showDeleteConfirmCount = (financasContent.match(/showDeleteConfirm\(/g) || []).length;
    // We expect at least 4 usages: custom goal delete, expense delete (table), expense delete (mobile), recurring delete (table), recurring delete (mobile)
    expect(showDeleteConfirmCount).toBeGreaterThanOrEqual(4);
  });

  it("should style the Excluir button with red color", () => {
    // The AlertDialogAction for delete should have red styling
    expect(financasContent).toContain("bg-red-500 hover:bg-red-600");
  });
});
