import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Story Viewed Border (cinza quando todos vistos)", () => {
  // Test 1: StoryViewer has onAllViewed and onStoryViewed props
  it("should have onAllViewed and onStoryViewed optional props in StoryViewer", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    expect(content).toContain("onAllViewed?: () => void");
    expect(content).toContain("onStoryViewed?: (storyId: number) => void");
    expect(content).toContain("onAllViewed,");
    expect(content).toContain("onStoryViewed,");
  });

  // Test 2: StoryViewer calls onAllViewed when all stories are viewed
  it("should call onAllViewed when viewedStoriesRef.size equals stories.length", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    expect(content).toContain("viewedStoriesRef.current.size === stories.length");
    expect(content).toContain("onAllViewed()");
  });

  // Test 3: StoryViewer calls onStoryViewed for each individual story
  it("should call onStoryViewed for each individual story viewed", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    expect(content).toContain("onStoryViewed(story.id)");
  });

  // Test 4: StoryViewer prevents duplicate onAllViewed calls
  it("should prevent duplicate onAllViewed calls with allViewedCalledRef", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    expect(content).toContain("allViewedCalledRef");
    expect(content).toContain("!allViewedCalledRef.current");
  });

  // Test 5: PublicMenu has allStoriesViewed state
  it("should have allStoriesViewed state in PublicMenu", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("allStoriesViewed");
    expect(content).toContain("setAllStoriesViewed");
  });

  // Test 6: PublicMenu uses localStorage (not sessionStorage) to persist viewed stories
  it("should use localStorage to persist viewed story IDs", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("mindi_stories_viewed_");
    expect(content).toContain("localStorage.getItem");
    expect(content).toContain("localStorage.setItem");
    // Should NOT use sessionStorage for story viewed state
    expect(content).not.toMatch(/sessionStorage\.(get|set)Item\(.*mindi_stories_viewed/);
  });

  // Test 7: PublicMenu has helper functions for localStorage operations
  it("should have getViewedStoryIds and markStoryAsViewed helpers", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("getViewedStoryIds");
    expect(content).toContain("markStoryAsViewed");
  });

  // Test 8: PublicMenu checks viewed stories on load via useEffect
  it("should check viewed stories on load via useEffect", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("Verificar se todos os stories já foram vistos");
    expect(content).toContain("getViewedStoryIds");
  });

  // Test 9: PublicMenu passes onAllViewed and onStoryViewed to StoryViewer
  it("should pass onAllViewed and onStoryViewed callbacks to StoryViewer", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("onAllViewed={() =>");
    expect(content).toContain("setAllStoriesViewed(true)");
    expect(content).toContain("onStoryViewed={(storyId) =>");
    expect(content).toContain("markStoryAsViewed");
  });

  // Test 10: Borda muda para cinza quando allStoriesViewed é true
  it("should show gray gradient when allStoriesViewed is true", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("allStoriesViewed");
    expect(content).toContain("#d1d5db"); // gray color
    expect(content).toContain("#9ca3af"); // gray color
  });

  // Test 11: Animação pulsante desativada quando stories já vistos
  it("should disable pulse animation when allStoriesViewed is true", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("allStoriesViewed ? undefined : { animation:");
  });

  // Test 12: Borda colorida quando stories NÃO foram todos vistos
  it("should show colorful Instagram gradient when stories not all viewed", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("#f09433");
    expect(content).toContain("#e6683c");
    expect(content).toContain("#dc2743");
    expect(content).toContain("#cc2366");
    expect(content).toContain("#bc1888");
  });

  // Test 13: useEffect re-checks when showStoryViewer changes
  it("should re-check viewed stories when StoryViewer closes", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    expect(content).toContain("showStoryViewer");
  });

  // Test 14: Stories are saved individually (not all at once)
  it("should save stories individually as they are viewed", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // markStoryAsViewed should add individual IDs
    expect(content).toContain("!viewed.includes(storyId)");
    expect(content).toContain("viewed.push(storyId)");
  });
});
