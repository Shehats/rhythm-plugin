import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../parser.js";

describe("parseMarkdown — task extraction", () => {
  it("extracts unchecked tasks", () => {
    const content = `- [ ] Fix login bug\n- [ ] Add rate limiting`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].title).toBe("Fix login bug");
    expect(result.candidates[1].title).toBe("Add rate limiting");
  });

  it("skips checked tasks", () => {
    const content = `- [x] Already done\n- [ ] Still todo`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].title).toBe("Still todo");
  });

  it("captures nearest heading as milestone", () => {
    const content = `## Sprint 1\n\n- [ ] Fix login bug\n- [ ] Add rate limiting`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].milestone).toBe("Sprint 1");
    expect(result.candidates[1].milestone).toBe("Sprint 1");
  });

  it("updates milestone when heading changes", () => {
    const content = `## Sprint 1\n\n- [ ] Task A\n\n## Sprint 2\n\n- [ ] Task B`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].milestone).toBe("Sprint 1");
    expect(result.candidates[1].milestone).toBe("Sprint 2");
  });

  it("sets source to md-task", () => {
    const result = parseMarkdown("- [ ] Do something", "test.md");
    expect(result.candidates[0].source).toBe("md-task");
  });

  it("returns empty candidates for markdown with no unchecked tasks", () => {
    const content = `# Header\n\nSome prose here.\n\n- [x] Done task`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates).toHaveLength(0);
  });

  it("sets fileType to markdown", () => {
    const result = parseMarkdown("- [ ] Task", "test.md");
    expect(result.fileType).toBe("markdown");
  });
});
