import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Stories Admin - StoryViewer fullscreen (em vez de Dialog preview)", () => {
  const storiesPath = path.resolve(__dirname, "../client/src/pages/Stories.tsx");
  const content = fs.readFileSync(storiesPath, "utf-8");

  // Test 1: StoryViewer is imported
  it("should import StoryViewer component", () => {
    expect(content).toContain('import StoryViewer from "@/components/StoryViewer"');
  });

  // Test 2: Uses showStoryViewer state instead of previewStory
  it("should use showStoryViewer state", () => {
    expect(content).toContain("showStoryViewer");
    expect(content).toContain("setShowStoryViewer");
    expect(content).toContain("storyViewerIndex");
    expect(content).toContain("setStoryViewerIndex");
  });

  // Test 3: No longer uses previewStory state
  it("should not use previewStory state", () => {
    expect(content).not.toContain("previewStory");
  });

  // Test 4: StoryViewer is rendered with correct props
  it("should render StoryViewer with correct props", () => {
    expect(content).toContain("<StoryViewer");
    expect(content).toContain("restaurantName={");
    expect(content).toContain("restaurantLogo={");
    expect(content).toContain("initialIndex={storyViewerIndex}");
    expect(content).toContain("onClose={() => setShowStoryViewer(false)}");
  });

  // Test 5: Story circles open StoryViewer at correct index
  it("should open StoryViewer at the correct index when clicking a story circle", () => {
    expect(content).toContain("activeStories.findIndex(s => s.id === story.id)");
    expect(content).toContain("setStoryViewerIndex(idx >= 0 ? idx : 0)");
    expect(content).toContain("setShowStoryViewer(true)");
  });

  // Test 6: Delete mutation closes StoryViewer
  it("should close StoryViewer when a story is deleted", () => {
    // Find the onSuccess of deleteMutation
    const deleteStart = content.indexOf("deleteMutation = trpc.stories.delete.useMutation");
    const deleteSection = content.substring(deleteStart, deleteStart + 300);
    expect(deleteSection).toContain("setShowStoryViewer(false)");
  });

  // Test 7: No old Dialog preview modal remains
  it("should not have the old Dialog-based preview modal", () => {
    // The old modal had "Preview do Story" title and max-h-[70vh]
    expect(content).not.toContain("Preview do Story");
    expect(content).not.toContain("max-h-[70vh]");
    expect(content).not.toContain("Story preview");
  });

  // Test 8: Confirmation dialog for deletion still exists
  it("should still have the delete confirmation dialog", () => {
    expect(content).toContain("Excluir story?");
    expect(content).toContain("deleteConfirm");
    expect(content).toContain("Esta ação não pode ser desfeita");
  });
});
