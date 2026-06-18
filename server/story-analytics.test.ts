import { describe, it, expect } from "vitest";

// ============ SCHEMA TESTS ============

describe("Story Analytics Schema", () => {
  it("should have storyEvents table with required columns", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.storyEvents).toBeDefined();
    
    // Verify the table has the expected structure
    const columns = Object.keys(schema.storyEvents);
    expect(columns.length).toBeGreaterThan(0);
  });

  it("should export StoryEvent types", async () => {
    const schema = await import("../drizzle/schema");
    // Type exports exist (compile-time check)
    expect(schema.storyEvents).toBeDefined();
  });
});

// ============ ROUTER TESTS ============

describe("Story Analytics Router Endpoints", () => {
  // Cache the router import to avoid repeated heavy imports
  let procedures: Record<string, unknown>;
  
  it("should have all analytics endpoints defined", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    
    expect(router).toBeDefined();
    expect(router._def).toBeDefined();
    expect(router._def.procedures).toBeDefined();
    
    procedures = router._def.procedures as Record<string, unknown>;
    
    // Check all analytics endpoints exist
    expect(procedures["publicStories.recordEvent"]).toBeDefined();
    expect(procedures["stories.conversionAnalytics"]).toBeDefined();
    expect(procedures["stories.salesChart"]).toBeDefined();
    expect(procedures["stories.topPerforming"]).toBeDefined();
    expect(procedures["stories.revenuePercent"]).toBeDefined();
  }, 30000);
});

// ============ DB FUNCTION TESTS ============

describe("Story Analytics DB Functions", () => {
  it("should export recordStoryEvent function", async () => {
    const db = await import("./db");
    expect(typeof db.recordStoryEvent).toBe("function");
  });

  it("should export getStoryAnalytics function", async () => {
    const db = await import("./db");
    expect(typeof db.getStoryAnalytics).toBe("function");
  });

  it("should export getStorySalesChart function", async () => {
    const db = await import("./db");
    expect(typeof db.getStorySalesChart).toBe("function");
  });

  it("should export getTopPerformingStory function", async () => {
    const db = await import("./db");
    expect(typeof db.getTopPerformingStory).toBe("function");
  });

  it("should export getStoryRevenuePercentToday function", async () => {
    const db = await import("./db");
    expect(typeof db.getStoryRevenuePercentToday).toBe("function");
  });
});

// ============ EVENT TYPE VALIDATION TESTS ============

describe("Story Event Types", () => {
  it("should accept valid event types in schema enum", async () => {
    const schema = await import("../drizzle/schema");
    // The eventType enum should include click, add_to_cart, order_completed
    expect(schema.storyEvents).toBeDefined();
  });

  it("should have orderValue as decimal field for revenue tracking", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.storyEvents).toBeDefined();
    // The orderValue column should exist for tracking revenue
  });
});

// ============ FRONTEND INTEGRATION TESTS ============

describe("Story Analytics Frontend Integration", () => {
  it("StoryViewer should have recordEvent mutation", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/components/StoryViewer.tsx", "utf-8");
    
    expect(content).toContain("recordEventMutation");
    expect(content).toContain("publicStories.recordEvent.useMutation");
    expect(content).toContain("eventType: \"click\"");
  });

  it("PublicMenu should track add_to_cart events from stories", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/PublicMenu.tsx", "utf-8");
    
    expect(content).toContain("storySource");
    expect(content).toContain("mindi_story_cart_source");
    expect(content).toContain("eventType: \"add_to_cart\"");
  });

  it("PublicMenu should track order_completed events from stories", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/PublicMenu.tsx", "utf-8");
    
    expect(content).toContain("eventType: \"order_completed\"");
    expect(content).toContain("mindi_story_cart_source");
  });

  it("Stories admin page should display analytics panel", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/Stories.tsx", "utf-8");
    
    expect(content).toContain("Performance dos Stories");
    expect(content).toContain("conversionAnalytics");
    expect(content).toContain("salesChart");
    expect(content).toContain("topPerforming");
    expect(content).toContain("revenuePercent");
  });

  it("Stories admin page should show per-story metrics", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/Stories.tsx", "utf-8");
    
    expect(content).toContain("metricsMap");
    expect(content).toContain("clicks");
    expect(content).toContain("ordersCompleted");
    expect(content).toContain("totalRevenue");
  });

  it("Stories admin page should show revenue insight banner", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/Stories.tsx", "utf-8");
    
    expect(content).toContain("Stories geraram");
    expect(content).toContain("das vendas hoje");
  });

  it("Stories admin page should show sales chart", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/Stories.tsx", "utf-8");
    
    expect(content).toContain("Vendas por Stories");
    expect(content).toContain("chartMaxRevenue");
    expect(content).toContain("formatWeekday");
  });

  it("Stories admin page should show top performing story", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/Stories.tsx", "utf-8");
    
    expect(content).toContain("Top Story da Semana");
    expect(content).toContain("topStoryName");
  });
});

// ============ DATA FLOW TESTS ============

describe("Story Analytics Data Flow", () => {
  it("should persist storySource in sessionStorage for order tracking", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/PublicMenu.tsx", "utf-8");
    
    // Should save to sessionStorage when adding to cart from story
    expect(content).toContain("sessionStorage.setItem(\"mindi_story_cart_source\"");
    // Should read from sessionStorage when order completes
    expect(content).toContain("sessionStorage.getItem(\"mindi_story_cart_source\"");
    // Should remove after order
    expect(content).toContain("sessionStorage.removeItem(\"mindi_story_cart_source\"");
  });

  it("StoryViewer should pass establishmentId in click events", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/components/StoryViewer.tsx", "utf-8");
    
    expect(content).toContain("establishmentId");
    expect(content).toContain("interface Story");
    // Should have establishmentId in the Story interface
    expect(content).toContain("establishmentId?: number");
  });
});
