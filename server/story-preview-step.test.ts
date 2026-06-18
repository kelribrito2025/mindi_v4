import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Testes para o passo de pré-visualização (preview) no fluxo de criação de stories.
 * Valida que o CreateStoryDialog tem 4 passos: type → image → details → preview.
 */

describe("Story Preview Step - Fluxo de passos", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("deve ter o passo 'preview' no tipo de step", () => {
    expect(content).toContain('"type" | "image" | "details" | "preview"');
  });

  it("deve ter o estado inicial como 'type'", () => {
    expect(content).toContain('useState<"type" | "image" | "details" | "preview">("type")');
  });

  it("deve ter o step preview renderizado condicionalmente", () => {
    expect(content).toContain('step === "preview"');
  });

  it("deve ter botão de pré-visualizar no step de details", () => {
    expect(content).toContain("Pré-visualizar");
  });

  it("deve navegar de details para preview ao clicar em pré-visualizar", () => {
    expect(content).toContain('setStep("preview")');
  });

  it("deve ter botão de editar no preview que volta para details", () => {
    // O botão "Editar" no preview volta para details
    expect(content).toContain('onClick={() => setStep("details")}');
    expect(content).toContain("Editar");
  });

  it("deve ter botão de publicar no step preview", () => {
    expect(content).toContain("Publicar story");
  });

  it("deve chamar handlePublish ao clicar em publicar no preview", () => {
    expect(content).toContain("onClick={handlePublish}");
  });
});

describe("Story Preview Step - Elementos visuais do preview", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("deve ter o ícone Eye para indicar preview", () => {
    expect(content).toContain("Eye");
  });

  it("deve mostrar texto 'Como o cliente verá'", () => {
    expect(content).toContain("Como o cliente verá");
  });

  it("deve ter aspect ratio 9/16 no container do preview (formato story)", () => {
    expect(content).toContain('aspectRatio: "9/16"');
  });

  it("deve renderizar a imagem no preview", () => {
    // A imagem é renderizada dentro do preview
    expect(content).toContain("src={imagePreview}");
  });

  it("deve ter barras de progresso simuladas no preview", () => {
    expect(content).toContain("bg-white rounded-full w-[60%]");
  });

  it("deve ter header simulado com nome do restaurante", () => {
    expect(content).toContain("Seu restaurante");
  });
});

describe("Story Preview Step - Badge de preço no preview", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("deve renderizar badge circle no preview quando selecionado", () => {
    // Verifica que o preview tem badge circle com "por apenas"
    expect(content).toContain("por apenas");
  });

  it("deve renderizar badge ribbon no preview quando selecionado", () => {
    // Verifica que o preview tem badge ribbon com rotate
    expect(content).toContain('rotate(-40deg)');
  });

  it("deve renderizar badge top-center no preview quando selecionado", () => {
    // Verifica que o preview tem badge top-center com rounded-full
    expect(content).toContain("rounded-full shadow-xl border-2 border-white/80");
  });
});

describe("Story Preview Step - Overlay de promoção no preview", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("deve mostrar título da promoção no overlay do preview", () => {
    expect(content).toContain("{promoTitle.slice(0, 60)}");
  });

  it("deve mostrar texto da promoção no overlay do preview", () => {
    expect(content).toContain("{promoText.slice(0, 100)}");
  });

  it("deve mostrar countdown da promoção no preview", () => {
    expect(content).toContain("getPromoCountdownPreview()");
  });

  it("deve ter botão de ação no overlay do preview", () => {
    expect(content).toContain("{effectiveActionLabel}");
  });

  it("deve mostrar indicação quando não há produto vinculado", () => {
    expect(content).toContain("Sem produto vinculado");
  });
});

describe("Story Preview Step - Fluxo para tipo simple", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("deve ter botão pré-visualizar para tipo simple também", () => {
    // Para simple, o botão de pré-visualizar deve existir
    // Verificar que há setStep("preview") para simple
    const previewStepCount = (content.match(/setStep\("preview"\)/g) || []).length;
    expect(previewStepCount).toBeGreaterThanOrEqual(2); // pelo menos 2: um para simple e um para outros
  });
});

describe("Story Preview Step - Reset ao fechar", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("deve resetar step para 'type' ao fechar o dialog", () => {
    // handleClose deve resetar o step
    expect(content).toContain('setStep("type")');
  });

  it("deve limpar todos os campos ao fechar", () => {
    expect(content).toContain("setImagePreview(null)");
    expect(content).toContain("setPromoTitle(\"\")");
    expect(content).toContain("setPriceBadgeStyle(\"circle\")");
  });
});

describe("Story Preview Step - Descrição do dialog", () => {
  const dialogPath = path.resolve(__dirname, "../client/src/components/CreateStoryDialog.tsx");
  const content = fs.readFileSync(dialogPath, "utf-8");

  it("não deve mostrar título/descrição padrão no step preview (usa sr-only)", () => {
    expect(content).toContain("sr-only");
  });

  it("deve ter DialogTitle acessível no preview (sr-only)", () => {
    expect(content).toContain("Preview do Story");
  });
});
