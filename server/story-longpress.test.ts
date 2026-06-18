import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Story Pointer Events Navigation (mobile + desktop)", () => {
  const viewerPath = path.resolve(__dirname, "../client/src/components/StoryViewer.tsx");
  const content = fs.readFileSync(viewerPath, "utf-8");

  it("should define LONG_PRESS_THRESHOLD constant", () => {
    expect(content).toContain("LONG_PRESS_THRESHOLD");
    expect(content).toMatch(/LONG_PRESS_THRESHOLD\s*=\s*400/);
  });

  it("should use Pointer Events instead of separate touch/mouse handlers", () => {
    // Must use onPointerDown/onPointerUp
    expect(content).toContain("onPointerDown={handlePointerDown}");
    expect(content).toContain("onPointerUp={handlePointerUp}");
    expect(content).toContain("onPointerCancel={handlePointerCancel}");
    // Must NOT have separate touch/mouse handlers on the container
    expect(content).not.toContain("onTouchStart={handleTouchStart}");
    expect(content).not.toContain("onTouchEnd={handleTouchEnd}");
    expect(content).not.toContain("onMouseDown={handleMouseDown}");
    expect(content).not.toContain("onMouseUp={handleMouseUp}");
  });

  it("should track active pointer ID to prevent multi-touch issues", () => {
    expect(content).toContain("activePointerIdRef");
    expect(content).toContain("e.pointerId");
  });

  it("should have debounce mechanism to prevent double navigation", () => {
    expect(content).toContain("lastNavTimeRef");
    expect(content).toContain("NAV_DEBOUNCE");
  });

  it("should use setPointerCapture for reliable pointer tracking", () => {
    expect(content).toContain("setPointerCapture");
  });

  it("should have handlePointerDown that records start time and pauses", () => {
    expect(content).toContain("handlePointerDown");
    expect(content).toContain("pointerStartTimeRef.current = Date.now()");
    expect(content).toContain("setPaused(true)");
  });

  it("should have handlePointerUp that checks press duration", () => {
    expect(content).toContain("handlePointerUp");
    expect(content).toContain("LONG_PRESS_THRESHOLD");
    expect(content).toContain("setPaused(false)");
  });

  it("should not navigate on long press release (>= threshold)", () => {
    const handlePointerUpStart = content.indexOf("handlePointerUp");
    const section = content.substring(handlePointerUpStart, handlePointerUpStart + 800);
    expect(section).toContain(">= LONG_PRESS_THRESHOLD");
    expect(section).toContain("return");
  });

  it("should navigate on quick tap based on tap position", () => {
    const handlePointerUpStart = content.indexOf("handlePointerUp");
    const section = content.substring(handlePointerUpStart, handlePointerUpStart + 800);
    expect(section).toContain("halfWidth");
    expect(section).toContain("goPrev()");
    expect(section).toContain("goNext()");
  });

  it("should use touch-action: none to prevent browser default behaviors", () => {
    expect(content).toContain('touchAction: "none"');
  });

  it("should have select-none class to prevent text selection", () => {
    expect(content).toContain("select-none");
  });

  it("should use updater function in goNext to avoid stale closure", () => {
    expect(content).toContain("setCurrentIndex((prev)");
    expect(content).toContain("prev < stories.length - 1");
  });

  it("should stop propagation on close button pointer events", () => {
    expect(content).toContain('onPointerDown={(e) => e.stopPropagation()}');
  });

  it("should have pointer-events-none on overlays and pointer-events-auto on buttons", () => {
    // Overlays should not block touches
    const overlayMatches = content.match(/pointer-events-none/g);
    expect(overlayMatches).toBeTruthy();
    expect(overlayMatches!.length).toBeGreaterThanOrEqual(3);
    // Buttons should be clickable
    const buttonMatches = content.match(/pointer-events-auto/g);
    expect(buttonMatches).toBeTruthy();
    expect(buttonMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
