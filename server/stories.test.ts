import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Stories Feature", () => {
  // Test 1: Schema has stories table
  it("should have stories table in schema", () => {
    const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    
    expect(schemaContent).toContain('export const stories = mysqlTable("stories"');
    expect(schemaContent).toContain("establishmentId");
    expect(schemaContent).toContain("imageUrl");
    expect(schemaContent).toContain("fileKey");
    expect(schemaContent).toContain("expiresAt");
    expect(schemaContent).toContain("createdAt");
  });

  // Test 2: Schema exports Story types
  it("should export Story and InsertStory types", () => {
    const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    
    expect(schemaContent).toContain("export type Story =");
    expect(schemaContent).toContain("export type InsertStory =");
  });

  // Test 3: DB helpers exist
  it("should have all required DB helpers for stories", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    expect(dbContent).toContain("export async function createStory");
    expect(dbContent).toContain("export async function getStoriesByEstablishment");
    expect(dbContent).toContain("export async function getActiveStoriesByEstablishment");
    expect(dbContent).toContain("export async function deleteStory");
    expect(dbContent).toContain("export async function getStoryById");
    expect(dbContent).toContain("export async function countActiveStories");
    expect(dbContent).toContain("export async function cleanupExpiredStories");
  });

  // Test 4: tRPC routes exist
  it("should have stories and publicStories routers in routers.ts", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    // Admin stories routes
    expect(routersContent).toContain("stories: router({");
    // Check list query exists
    expect(routersContent).toContain("list: protectedProcedure");
    // Check create mutation exists  
    expect(routersContent).toContain("create: protectedProcedure");
    // Check delete mutation exists
    expect(routersContent).toContain("delete: protectedProcedure");
    
    // Public stories routes
    expect(routersContent).toContain("publicStories: router({");
    // Check getActive and hasActive queries exist inside publicStories router
    const publicStoriesSection = routersContent.substring(
      routersContent.indexOf("publicStories: router({"),
      routersContent.length
    );
    expect(publicStoriesSection).toContain("getActive: publicProcedure");
    expect(publicStoriesSection).toContain("hasActive: publicProcedure");
  });

  // Test 5: Stories create mutation has limit check
  it("should enforce 5 stories limit in create mutation", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    // Find the stories create section
    const createSection = routersContent.substring(
      routersContent.indexOf("stories: router({"),
      routersContent.indexOf("publicStories: router({")
    );
    
    expect(createSection).toContain("countActiveStories");
    expect(createSection).toContain("activeCount >= 5");
    expect(createSection).toContain("Limite de 5 stories");
  });

  // Test 6: Stories create mutation processes images at 1080px
  it("should compress images to max 1080px width", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    const createSection = routersContent.substring(
      routersContent.indexOf("stories: router({"),
      routersContent.indexOf("publicStories: router({")
    );
    
    expect(createSection).toContain("processSingleImage(buffer, 1080");
  });

  // Test 7: Stories have 24h expiration
  it("should set 24h expiration on story creation", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    const createSection = routersContent.substring(
      routersContent.indexOf("stories: router({"),
      routersContent.indexOf("publicStories: router({")
    );
    
    expect(createSection).toContain("24 * 60 * 60 * 1000");
  });

  // Test 8: Stories delete also removes from S3
  it("should delete S3 file when deleting a story", () => {
    const routersPath = path.resolve(__dirname, "routers.ts");
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    
    const storiesSection = routersContent.substring(
      routersContent.indexOf("stories: router({"),
      routersContent.indexOf("publicStories: router({")
    );
    
    expect(storiesSection).toContain("mindiStorageDelete");
    expect(storiesSection).toContain("deleted.fileKey");
  });

  // Test 9: Admin page exists
  it("should have Stories admin page", () => {
    const storiesPagePath = path.resolve(__dirname, "../client/src/pages/Stories.tsx");
    const content = fs.readFileSync(storiesPagePath, "utf-8");
    
    expect(content).toContain("Stories");
    expect(content).toContain("trpc.stories.list.useQuery");
    expect(content).toContain("trpc.stories.delete.useMutation");
    expect(content).toContain("MAX_STORIES");
    // Check for Instagram-style round cards
    expect(content).toContain("rounded-full");
    expect(content).toContain("linear-gradient(45deg");
  });

  // Test 10: Stories route registered in App.tsx
  it("should have Stories route in App.tsx", () => {
    const appPath = path.resolve(__dirname, "../client/src/App.tsx");
    const content = fs.readFileSync(appPath, "utf-8");
    
    expect(content).toContain('import Stories from "./pages/Stories"');
    expect(content).toContain('path="/stories"');
  });

  // Test 11: Stories in sidebar navigation
  it("should have Stories link in AdminLayout sidebar", () => {
    const layoutPath = path.resolve(__dirname, "../client/src/components/AdminLayout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    
    expect(content).toContain('label: "Stories"');
    expect(content).toContain('href: "/stories"');
  });

  // Test 12: StoryViewer component exists with fullscreen behavior
  it("should have StoryViewer component with fullscreen behavior", () => {
    const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
    const content = fs.readFileSync(viewerPath, "utf-8");
    
    // Fullscreen overlay
    expect(content).toContain("fixed inset-0 z-[9999]");
    // Progress bars
    expect(content).toContain("stories.map");
    // Auto-advance timer
    expect(content).toContain("STORY_DURATION");
    expect(content).toContain("5000");
    // Navigation (tap left/right)
    expect(content).toContain("goNext");
    expect(content).toContain("goPrev");
    // Close button
    expect(content).toContain("onClose");
    // Restaurant info header
    expect(content).toContain("restaurantName");
    expect(content).toContain("restaurantLogo");
    // Keyboard navigation
    expect(content).toContain("ArrowRight");
    expect(content).toContain("ArrowLeft");
    expect(content).toContain("Escape");
  });

  // Test 13: PublicMenu integrates stories
  it("should integrate stories in PublicMenu", () => {
    const menuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
    const content = fs.readFileSync(menuPath, "utf-8");
    
    // Import StoryViewer
    expect(content).toContain('import StoryViewer from "@/components/StoryViewer"');
    // Query for stories status
    expect(content).toContain("trpc.publicStories.hasActive.useQuery");
    // Query for active stories (lazy)
    expect(content).toContain("trpc.publicStories.getActive.useQuery");
    // StoryViewer rendered
    expect(content).toContain("<StoryViewer");
    // Instagram gradient border
    expect(content).toContain("linear-gradient(45deg, #f09433");
    // Pulse animation
    expect(content).toContain("storyPulse");
    // State for viewer
    expect(content).toContain("showStoryViewer");
  });

  // Test 14: DB helpers filter expired stories correctly
  it("should filter expired stories in getActiveStoriesByEstablishment", () => {
    const dbPath = path.resolve(__dirname, "db.ts");
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    
    // getActiveStoriesByEstablishment should filter by expiresAt > now
    const activeFunc = dbContent.substring(
      dbContent.indexOf("async function getActiveStoriesByEstablishment"),
      dbContent.indexOf("async function deleteStory")
    );
    
    expect(activeFunc).toContain("gt(stories.expiresAt, now)");
    expect(activeFunc).toContain("new Date()");
  });
});
