import { describe, expect, it } from "vitest";
import { containsNode } from "../spatial.js";
import type { CanvasGroupNode, CanvasTextNode } from "@rhythm-plugin/types";

const group: CanvasGroupNode = { id: "g1", type: "group", x: 0, y: 0, width: 200, height: 200 };

describe("containsNode", () => {
  it("returns true when node center is inside group", () => {
    const node: CanvasTextNode = { id: "n1", type: "text", text: "x", x: 50, y: 50, width: 100, height: 100 };
    expect(containsNode(group, node)).toBe(true);
  });

  it("returns false when node center is outside group", () => {
    const node: CanvasTextNode = { id: "n2", type: "text", text: "x", x: 300, y: 300, width: 100, height: 100 };
    expect(containsNode(group, node)).toBe(false);
  });

  it("returns false when node center is exactly on the group edge", () => {
    // center at (200, 100) — on the right edge
    const node: CanvasTextNode = { id: "n3", type: "text", text: "x", x: 150, y: 0, width: 100, height: 200 };
    expect(containsNode(group, node)).toBe(false);
  });

  it("returns false when node is partially overlapping but center is outside", () => {
    const node: CanvasTextNode = { id: "n4", type: "text", text: "x", x: 180, y: 0, width: 100, height: 100 };
    expect(containsNode(group, node)).toBe(false);
  });
});
