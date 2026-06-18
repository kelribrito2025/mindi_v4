import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Stories - Abrir no primeiro story não visto", () => {
  const publicMenuPath = path.resolve(__dirname, "../client/src/pages/PublicMenu.tsx");
  const content = fs.readFileSync(publicMenuPath, "utf-8");

  it("should have storyInitialIndex state", () => {
    expect(content).toContain("storyInitialIndex");
    expect(content).toContain("setStoryInitialIndex");
  });

  it("should pass initialIndex to StoryViewer", () => {
    expect(content).toContain("initialIndex={storyInitialIndex}");
  });

  it("should read viewedIds from localStorage via getViewedStoryIds when opening stories", () => {
    // The onClick handler should use getViewedStoryIds helper (which reads from localStorage)
    const onClickSection = content.substring(
      content.indexOf("onClick={async () => {"),
      content.indexOf("setShowStoryViewer(true);") + 30
    );
    expect(onClickSection).toContain("getViewedStoryIds(data.establishment.id)");
    expect(onClickSection).toContain("viewedIds.length > 0");
  });

  it("should find the first unviewed story index", () => {
    const onClickSection = content.substring(
      content.indexOf("onClick={async () => {"),
      content.indexOf("setShowStoryViewer(true);") + 30
    );
    expect(onClickSection).toContain("findIndex(s => !viewedIds.includes(s.id))");
    expect(onClickSection).toContain("firstUnviewedIdx");
  });

  it("should set startIndex to the first unviewed story", () => {
    const onClickSection = content.substring(
      content.indexOf("onClick={async () => {"),
      content.indexOf("setShowStoryViewer(true);") + 30
    );
    expect(onClickSection).toContain("setStoryInitialIndex(startIndex)");
  });

  it("should default to index 0 when no stories have been viewed", () => {
    const onClickSection = content.substring(
      content.indexOf("onClick={async () => {"),
      content.indexOf("setShowStoryViewer(true);") + 30
    );
    expect(onClickSection).toContain("let startIndex = 0");
  });
});
