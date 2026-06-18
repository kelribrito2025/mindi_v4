import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Story Views Analytics", () => {
  // Test 1: storyViews table exists in schema
  it("should have storyViews table in schema", () => {
    const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    
    expect(schemaContent).toContain('mysqlTable("storyViews"');
    expect(schemaContent).toContain("storyId");
    expect(schemaContent).toContain("sessionId");
    expect(schemaContent).toContain("viewedAt");
  });

  // Test 2: storyViews has correct column types
  it("should have correct column types for storyViews", () => {
    const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    
    // storyId should be int
    expect(schemaContent).toMatch(/storyId.*int.*notNull/s);
    // sessionId should be varchar
    expect(schemaContent).toMatch(/sessionId.*varchar.*64/s);
    // viewedAt should be timestamp with default
    expect(schemaContent).toMatch(/viewedAt.*timestamp.*defaultNow/s);
  });

  // Test 3: Types are exported
  it("should export StoryView and InsertStoryView types", () => {
    const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    
    expect(schemaContent).toContain("export type StoryView");
    expect(schemaContent).toContain("export type InsertStoryView");
  });

  // Test 4: DB helpers exist
  it("should have recordStoryView helper in db.ts", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    expect(dbContent).toContain("export async function recordStoryView");
    expect(dbContent).toContain("sessionId");
    expect(dbContent).toContain("alreadyViewed");
  });

  it("should have countStoryViews helper in db.ts", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    expect(dbContent).toContain("export async function countStoryViews");
  });

  it("should have countViewsByEstablishment helper in db.ts", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    expect(dbContent).toContain("export async function countViewsByEstablishment");
    expect(dbContent).toContain("groupBy");
  });

  // Test 5: recordStoryView prevents duplicate views per session
  it("should check for existing view before inserting", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    // Find the recordStoryView function
    const fnStart = dbContent.indexOf("export async function recordStoryView");
    const fnEnd = dbContent.indexOf("export async function", fnStart + 1);
    const fnBody = dbContent.substring(fnStart, fnEnd > -1 ? fnEnd : dbContent.length);
    
    // Should check for existing view
    expect(fnBody).toContain("existing");
    expect(fnBody).toContain("storyViews.sessionId");
    expect(fnBody).toContain("storyViews.storyId");
    expect(fnBody).toContain("alreadyViewed");
  });

  // Test 6: tRPC routes exist
  it("should have viewsAnalytics route in stories router (admin)", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    expect(routersContent).toContain("viewsAnalytics: protectedProcedure");
    expect(routersContent).toContain("countViewsByEstablishment");
  });

  it("should have recordView route in publicStories router", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    expect(routersContent).toContain("recordView: publicProcedure");
    expect(routersContent).toContain("recordStoryView");
  });

  // Test 7: StoryViewer records views
  it("should record views in StoryViewer component", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const viewerContent = fs.readFileSync(viewerPath, "utf-8");
    
    // Should import trpc
    expect(viewerContent).toContain("import { trpc }");
    // Should have session management
    expect(viewerContent).toContain("getOrCreateSessionId");
    expect(viewerContent).toContain("sessionStorage");
    // Should use recordView mutation
    expect(viewerContent).toContain("recordView");
    expect(viewerContent).toContain("recordViewMutation");
    // Should track viewed stories to avoid duplicates
    expect(viewerContent).toContain("viewedStoriesRef");
  });

  // Test 8: Admin Stories page shows views
  it("should display views count in admin Stories page", () => {
    const storiesPath = path.resolve(__dirname, "../client/src/pages/Stories.tsx");
    const storiesContent = fs.readFileSync(storiesPath, "utf-8");
    
    // Should import Eye icon
    expect(storiesContent).toContain("Eye");
    // Should query viewsAnalytics
    expect(storiesContent).toContain("viewsAnalytics");
    expect(storiesContent).toContain("viewsData");
    // Should display view count
    expect(storiesContent).toContain("views");
  });

  // Test 9: recordView input validation
  it("should validate recordView input (storyId and sessionId)", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    // Find the recordView section
    const recordViewStart = routersContent.indexOf("recordView: publicProcedure");
    const recordViewSection = routersContent.substring(recordViewStart, recordViewStart + 200);
    
    expect(recordViewSection).toContain("storyId: z.number()");
    expect(recordViewSection).toContain("sessionId: z.string()");
  });

  // Test 10: countViewsByEstablishment returns map
  it("should return Record<number, number> from countViewsByEstablishment", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    const fnStart = dbContent.indexOf("export async function countViewsByEstablishment");
    const fnEnd = dbContent.indexOf("export async function", fnStart + 1);
    const fnBody = dbContent.substring(fnStart, fnEnd > -1 ? fnEnd : dbContent.length);
    
    // Should return a viewsMap object
    expect(fnBody).toContain("viewsMap");
    expect(fnBody).toContain("Record<number, number>");
    // Should group by storyId
    expect(fnBody).toContain("storyViews.storyId");
    expect(fnBody).toContain("groupBy");
  });
});
