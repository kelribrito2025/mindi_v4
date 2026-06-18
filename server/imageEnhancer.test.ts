import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock do generateImage antes de importar o módulo
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import { enhanceProductImage } from "./imageEnhancer";
import { generateImage } from "./_core/imageGeneration";

const mockGenerateImage = vi.mocked(generateImage);

describe("imageEnhancer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("enhanceProductImage", () => {
    it("deve chamar generateImage com a URL da imagem e o prompt correto", async () => {
      mockGenerateImage.mockResolvedValue({
        url: "https://s3.example.com/enhanced/123.png",
      });

      // Mock fetch para HEAD request (verificação de tamanho)
      global.fetch = vi.fn().mockResolvedValue({
        headers: new Map([["content-length", "1000000"]]) as any,
      }) as any;

      const result = await enhanceProductImage(
        "https://s3.example.com/products/burger.jpg",
        1
      );

      expect(mockGenerateImage).toHaveBeenCalledOnce();
      const callArgs = mockGenerateImage.mock.calls[0][0];
      
      // Verificar que o prompt contém instruções de food photography
      expect(callArgs.prompt).toContain("professional food photographer");
      expect(callArgs.prompt).toContain("IDENTIFY");
      expect(callArgs.prompt).toContain("THEMATIC SCENE");
      expect(callArgs.prompt).toContain("ENHANCE");
      expect(callArgs.prompt).toContain("CRITICAL RULES");
      
      // Verificar que a imagem original foi passada
      expect(callArgs.originalImages).toHaveLength(1);
      expect(callArgs.originalImages![0].url).toBe("https://s3.example.com/products/burger.jpg");
      expect(callArgs.originalImages![0].mimeType).toBe("image/jpeg");

      // Verificar resultado
      expect(result.enhancedUrl).toBe("https://s3.example.com/enhanced/123.png");
      expect(result.originalUrl).toBe("https://s3.example.com/products/burger.jpg");
    });

    it("deve detectar mime type correto para PNG", async () => {
      mockGenerateImage.mockResolvedValue({
        url: "https://s3.example.com/enhanced/123.png",
      });

      global.fetch = vi.fn().mockResolvedValue({
        headers: new Map([["content-length", "500000"]]) as any,
      }) as any;

      await enhanceProductImage(
        "https://s3.example.com/products/pizza.png",
        1
      );

      const callArgs = mockGenerateImage.mock.calls[0][0];
      expect(callArgs.originalImages![0].mimeType).toBe("image/png");
    });

    it("deve detectar mime type correto para WebP", async () => {
      mockGenerateImage.mockResolvedValue({
        url: "https://s3.example.com/enhanced/123.png",
      });

      global.fetch = vi.fn().mockResolvedValue({
        headers: new Map([["content-length", "500000"]]) as any,
      }) as any;

      await enhanceProductImage(
        "https://s3.example.com/products/sushi.webp",
        1
      );

      const callArgs = mockGenerateImage.mock.calls[0][0];
      expect(callArgs.originalImages![0].mimeType).toBe("image/webp");
    });

    it("deve lançar erro se a URL da imagem estiver vazia", async () => {
      await expect(enhanceProductImage("", 1)).rejects.toThrow(
        "URL da imagem é obrigatória"
      );
    });

    it("deve lançar erro se a imagem exceder 4MB", async () => {
      // Mock fetch HEAD retornando tamanho > 4MB
      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: (name: string) => name === "content-length" ? "5000000" : null,
        },
      }) as any;

      await expect(
        enhanceProductImage("https://s3.example.com/products/big.jpg", 1)
      ).rejects.toThrow("4MB");
    });

    it("deve continuar se não conseguir verificar o tamanho da imagem", async () => {
      mockGenerateImage.mockResolvedValue({
        url: "https://s3.example.com/enhanced/123.png",
      });

      // Mock fetch que falha
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as any;

      const result = await enhanceProductImage(
        "https://s3.example.com/products/burger.jpg",
        1
      );

      // Deve continuar mesmo com erro no HEAD
      expect(mockGenerateImage).toHaveBeenCalledOnce();
      expect(result.enhancedUrl).toBe("https://s3.example.com/enhanced/123.png");
    });

    it("deve lançar erro se generateImage não retornar URL", async () => {
      mockGenerateImage.mockResolvedValue({
        url: undefined,
      });

      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: () => null,
        },
      }) as any;

      await expect(
        enhanceProductImage("https://s3.example.com/products/burger.jpg", 1)
      ).rejects.toThrow("Falha ao gerar imagem melhorada");
    });

    it("deve incluir cenários temáticos no prompt para diferentes tipos de comida", async () => {
      mockGenerateImage.mockResolvedValue({
        url: "https://s3.example.com/enhanced/123.png",
      });

      global.fetch = vi.fn().mockResolvedValue({
        headers: { get: () => null },
      }) as any;

      await enhanceProductImage(
        "https://s3.example.com/products/food.jpg",
        1
      );

      const prompt = mockGenerateImage.mock.calls[0][0].prompt;
      
      // Verificar que o prompt menciona cenários temáticos para diferentes tipos de comida
      expect(prompt).toContain("Burger");
      expect(prompt).toContain("Pizza");
      expect(prompt).toContain("Sushi");
      expect(prompt).toContain("Dessert");
      expect(prompt).toContain("Coffee");
      expect(prompt).toContain("Salad");
      
      // Verificar regras críticas
      expect(prompt).toContain("EXACT SAME food");
      expect(prompt).toContain("do NOT change");
    });
  });
});
