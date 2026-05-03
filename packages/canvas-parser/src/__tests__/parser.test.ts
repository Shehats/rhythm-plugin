import { describe, expect, it } from "vitest";
import { CanvasParseError, parseCanvas } from "../parser.js";

const FIXTURE_PATH = "test.canvas";

function makeCanvas(nodes: object[], edges: object[] = []) {
  return JSON.stringify({ nodes, edges });
}

describe("parseCanvas", () => {
  it("extracts text nodes as candidates", () => {
    const raw = makeCanvas([
      { id: "t1", type: "text", text: "Fix login bug\n\nSome details", x: 0, y: 0, width: 100, height: 100 },
    ]);
    const result = parseCanvas(raw, FIXTURE_PATH);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].title).toBe("Fix login bug");
    expect(result.candidates[0].body).toBe("Some details");
    expect(result.candidates[0].source).toBe("canvas-text");
  });

  it("assigns group label as milestone and label when text node is inside group", () => {
    const raw = makeCanvas([
      { id: "g1", type: "group", label: "Sprint 1", x: -50, y: -50, width: 400, height: 300 },
      { id: "t1", type: "text", text: "Build login", x: 0, y: 0, width: 200, height: 100 },
    ]);
    const result = parseCanvas(raw, FIXTURE_PATH);
    expect(result.candidates[0].milestone).toBe("Sprint 1");
    expect(result.candidates[0].labels).toContain("Sprint 1");
  });

  it("does not include group nodes as candidates", () => {
    const raw = makeCanvas([
      { id: "g1", type: "group", label: "Sprint 1", x: 0, y: 0, width: 400, height: 300 },
    ]);
    const result = parseCanvas(raw, FIXTURE_PATH);
    expect(result.candidates).toHaveLength(0);
  });

  it("reformats Acceptance: section in body", () => {
    const raw = makeCanvas([
      {
        id: "t1",
        type: "text",
        text: "Build login page\n\nAcceptance: users can log in",
        x: 0, y: 0, width: 100, height: 100,
      },
    ]);
    const result = parseCanvas(raw, FIXTURE_PATH);
    expect(result.candidates[0].body).toContain("## Acceptance Criteria");
    expect(result.candidates[0].body).toContain("users can log in");
  });

  it("returns empty candidates for empty nodes array", () => {
    const raw = makeCanvas([]);
    const result = parseCanvas(raw, FIXTURE_PATH);
    expect(result.candidates).toHaveLength(0);
  });

  it("throws CanvasParseError for malformed JSON", () => {
    expect(() => parseCanvas("{not json}", FIXTURE_PATH)).toThrow(CanvasParseError);
  });

  it("throws CanvasParseError when nodes array is missing", () => {
    expect(() => parseCanvas('{"edges":[]}', FIXTURE_PATH)).toThrow(CanvasParseError);
  });

  it("skips file and link nodes", () => {
    const raw = makeCanvas([
      { id: "f1", type: "file", file: "tasks.md", x: 0, y: 0, width: 100, height: 100 },
      { id: "l1", type: "link", url: "https://example.com", x: 200, y: 0, width: 100, height: 100 },
    ]);
    const result = parseCanvas(raw, FIXTURE_PATH);
    expect(result.candidates).toHaveLength(0);
  });
});
