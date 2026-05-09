import { describe, expect, it } from "vitest";
import {
  buildDiagramSection,
  generateArrowDiagram,
  generateLayoutDiagram,
} from "../diagram-generator.js";
import type { CanvasData } from "@rhythm-plugin/types";

const textNode = (id: string, text: string, x = 0, y = 0) => ({
  id, type: "text" as const, text, x, y, width: 100, height: 100,
});
const groupNode = (id: string, label: string, x = -50, y = -50) => ({
  id, type: "group" as const, label, x, y, width: 300, height: 300,
});
const edge = (id: string, fromNode: string, toNode: string, label?: string) => ({
  id, fromNode, toNode, ...(label ? { label } : {}),
});

describe("generateLayoutDiagram", () => {
  it("renders ungrouped text nodes at top level", () => {
    const data: CanvasData = { nodes: [textNode("t1", "Fix login bug")], edges: [] };
    const out = generateLayoutDiagram(data);
    expect(out).toContain('flowchart TD');
    expect(out).toContain('t1["Fix login bug"]');
  });

  it("renders grouped nodes inside a subgraph", () => {
    const data: CanvasData = {
      nodes: [groupNode("g1", "Sprint 1"), textNode("t1", "Fix login bug")],
      edges: [],
    };
    const out = generateLayoutDiagram(data);
    expect(out).toContain('subgraph g1["Sprint 1"]');
    expect(out).toContain('t1["Fix login bug"]');
    expect(out).toContain("end");
  });

  it("places ungrouped nodes outside subgraphs", () => {
    const data: CanvasData = {
      nodes: [
        groupNode("g1", "Sprint 1"),
        textNode("t1", "Inside", 0, 0),
        textNode("t2", "Outside", 500, 500),
      ],
      edges: [],
    };
    const out = generateLayoutDiagram(data);
    const subgraphEnd = out.indexOf("end");
    const outsideIdx = out.indexOf('t2["Outside"]');
    expect(outsideIdx).toBeGreaterThan(subgraphEnd);
  });

  it("escapes double quotes in labels", () => {
    const data: CanvasData = {
      nodes: [textNode("t1", 'Say "hello"')],
      edges: [],
    };
    const out = generateLayoutDiagram(data);
    expect(out).toContain("#quot;");
    expect(out).not.toContain('"hello"');
  });
});

describe("generateArrowDiagram", () => {
  it("returns empty string when there are no edges", () => {
    const data: CanvasData = { nodes: [textNode("t1", "A")], edges: [] };
    expect(generateArrowDiagram(data)).toBe("");
  });

  it("renders edges between nodes", () => {
    const data: CanvasData = {
      nodes: [textNode("t1", "Task A"), textNode("t2", "Task B")],
      edges: [edge("e1", "t1", "t2")],
    };
    const out = generateArrowDiagram(data);
    expect(out).toContain("flowchart LR");
    expect(out).toContain("t1 --> t2");
  });

  it("renders edge labels", () => {
    const data: CanvasData = {
      nodes: [textNode("t1", "Task A"), textNode("t2", "Task B")],
      edges: [edge("e1", "t1", "t2", "blocks")],
    };
    const out = generateArrowDiagram(data);
    expect(out).toContain('-->|"blocks"|');
  });

  it("declares each referenced node once", () => {
    const data: CanvasData = {
      nodes: [textNode("t1", "A"), textNode("t2", "B"), textNode("t3", "C")],
      edges: [edge("e1", "t1", "t2"), edge("e2", "t1", "t3")],
    };
    const out = generateArrowDiagram(data);
    const matches = out.match(/t1\[/g);
    expect(matches).toHaveLength(1);
  });
});

describe("buildDiagramSection", () => {
  it("wraps layout in <diagram> tags with mermaid fence", () => {
    const out = buildDiagramSection("flowchart TD\n  t1", "");
    expect(out).toContain("<diagram>");
    expect(out).toContain("</diagram>");
    expect(out).toContain("```mermaid");
  });

  it("omits <diagram_arrow> when arrows string is empty", () => {
    const out = buildDiagramSection("flowchart TD\n  t1", "");
    expect(out).not.toContain("<diagram_arrow>");
  });

  it("includes <diagram_arrow> when arrows string is provided", () => {
    const out = buildDiagramSection("flowchart TD", "flowchart LR\n  t1 --> t2");
    expect(out).toContain("<diagram_arrow>");
    expect(out).toContain("</diagram_arrow>");
  });
});
