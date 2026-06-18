import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Story Reset Viewed State (comparação de IDs)", () => {
  // Test 1: getActiveStoryIds helper exists in db.ts
  it("should have getActiveStoryIds helper in db.ts", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const content = fs.readFileSync(dbPath, "utf-8");
    
    expect(content).toContain("export async function getActiveStoryIds");
    expect(content).toContain("Promise<number[]>");
  });

  // Test 2: getActiveStoryIds returns only IDs
  it("should select only id column in getActiveStoryIds", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const content = fs.readFileSync(dbPath, "utf-8");
    
    const fnStart = content.indexOf("export async function getActiveStoryIds");
    const fnEnd = content.indexOf("export async function", fnStart + 1);
    const fnBody = content.substring(fnStart, fnEnd > -1 ? fnEnd : content.length);
    
    // Agora seleciona id, type e promoExpiresAt para filtrar promos expiradas
    expect(fnBody).toContain("id: stories.id");
    expect(fnBody).toContain(".map(r => r.id)");
  });

  // Test 3: hasActive route returns storyIds
  it("should return storyIds array in hasActive route", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    // Find hasActive section
    const hasActiveStart = content.indexOf("hasActive: publicProcedure");
    const hasActiveSection = content.substring(hasActiveStart, hasActiveStart + 300);
    
    expect(hasActiveSection).toContain("getActiveStoryIds");
    expect(hasActiveSection).toContain("storyIds: ids");
  });

  // Test 4: hasActive returns hasStories, count, and storyIds
  it("should return hasStories, count, and storyIds from hasActive", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    const hasActiveStart = content.indexOf("hasActive: publicProcedure");
    const hasActiveSection = content.substring(hasActiveStart, hasActiveStart + 300);
    
    expect(hasActiveSection).toContain("hasStories:");
    expect(hasActiveSection).toContain("count:");
    expect(hasActiveSection).toContain("storyIds:");
  });

  // Test 5: PublicMenu uses storyIds for comparison
  it("should compare storyIds with localStorage viewedIds in PublicMenu", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("storiesStatus.storyIds");
    expect(content).toContain("activeIds.every");
    expect(content).toContain("viewedIds.includes(id)");
  });

  // Test 6: PublicMenu resets allStoriesViewed when not all viewed
  it("should set allStoriesViewed based on comparison result", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // Find the useEffect that checks viewed stories
    const effectStart = content.indexOf("Verificar se todos os stories já foram vistos");
    const effectEnd = content.indexOf("}, [storiesStatus", effectStart);
    const effectBody = content.substring(effectStart, effectEnd);
    
    // Should set false when not all viewed
    expect(effectBody).toContain("setAllStoriesViewed(false)");
    // Should set based on allViewed result
    expect(effectBody).toContain("setAllStoriesViewed(allViewed)");
  });

  // Test 7: Comparison is ID-based, not count-based
  it("should use ID-based comparison instead of count-based", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    const effectStart = content.indexOf("Verificar se todos os stories já foram vistos");
    const effectEnd = content.indexOf("}, [storiesStatus", effectStart);
    const effectBody = content.substring(effectStart, effectEnd);
    
    // Should use .every() for ID comparison
    expect(effectBody).toContain("every");
    // Should NOT rely only on length comparison
    expect(effectBody).not.toContain("viewedIds.length >= (storiesStatus.count");
  });

  // Test 8: Stories are saved individually via onStoryViewed callback
  it("should save stories individually via onStoryViewed and markStoryAsViewed", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // The onStoryViewed callback should save individual IDs
    expect(content).toContain("onStoryViewed={(storyId) =>");
    expect(content).toContain("markStoryAsViewed(establishment.id, storyId)");
  });
});
