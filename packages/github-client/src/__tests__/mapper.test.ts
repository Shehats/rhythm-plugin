import { describe, expect, it } from "vitest";
import { mapCandidateToRequest } from "../mapper.js";
import type { IssueCandidate } from "@rhythm-plugin/types";

function makeCandidate(overrides: Partial<IssueCandidate> = {}): IssueCandidate {
  return {
    id: "t1",
    title: "Fix login bug",
    body: "Some details",
    labels: ["bug"],
    sourceFile: "project.canvas",
    source: "canvas-text",
    ...overrides,
  };
}

describe("mapCandidateToRequest", () => {
  it("maps title and body with attribution prefix", () => {
    const req = mapCandidateToRequest(makeCandidate(), []);
    expect(req.title).toBe("Fix login bug");
    expect(req.body).toContain("> Imported from `project.canvas`");
    expect(req.body).toContain("Some details");
  });

  it("truncates title at 256 characters", () => {
    const longTitle = "A".repeat(300);
    const req = mapCandidateToRequest(makeCandidate({ title: longTitle }), []);
    expect(req.title.length).toBe(256);
  });

  it("merges candidate labels with defaultLabels and deduplicates", () => {
    const req = mapCandidateToRequest(makeCandidate({ labels: ["bug", "sprint-1"] }), [
      "bug",
      "enhancement",
    ]);
    expect(req.labels).toEqual(expect.arrayContaining(["bug", "sprint-1", "enhancement"]));
    expect(req.labels!.filter((l) => l === "bug")).toHaveLength(1);
  });

  it("returns empty labels array when no labels on either side", () => {
    const req = mapCandidateToRequest(makeCandidate({ labels: [] }), []);
    expect(req.labels).toEqual([]);
  });
});
