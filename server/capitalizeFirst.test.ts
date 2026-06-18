import { describe, it, expect } from "vitest";

// Reimplementar a função para teste no servidor (a original está no client)
function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

describe("capitalizeFirst", () => {
  it("should capitalize the first letter of a string", () => {
    expect(capitalizeFirst("hello")).toBe("Hello");
    expect(capitalizeFirst("world")).toBe("World");
  });

  it("should handle already capitalized strings", () => {
    expect(capitalizeFirst("Hello")).toBe("Hello");
    expect(capitalizeFirst("WORLD")).toBe("WORLD");
  });

  it("should handle single character strings", () => {
    expect(capitalizeFirst("a")).toBe("A");
    expect(capitalizeFirst("Z")).toBe("Z");
  });

  it("should handle empty strings", () => {
    expect(capitalizeFirst("")).toBe("");
  });

  it("should handle strings with spaces", () => {
    expect(capitalizeFirst("hello world")).toBe("Hello world");
    expect(capitalizeFirst(" hello")).toBe(" hello");
  });

  it("should handle strings with numbers", () => {
    expect(capitalizeFirst("123abc")).toBe("123abc");
    expect(capitalizeFirst("a123")).toBe("A123");
  });

  it("should handle strings with special characters", () => {
    expect(capitalizeFirst("@hello")).toBe("@hello");
    expect(capitalizeFirst("café")).toBe("Café");
  });

  it("should handle Portuguese characters", () => {
    expect(capitalizeFirst("água")).toBe("Água");
    expect(capitalizeFirst("óleo")).toBe("Óleo");
    expect(capitalizeFirst("açúcar")).toBe("Açúcar");
  });
});
