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

  it("uses - lines as issue body", () => {
    const content = "- [ ] Fix login bug\n- The form throws a 500 error\n- when email has a + symbol";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("The form throws a 500 error\nwhen email has a + symbol");
  });

  it("stops body collection at a new task line", () => {
    const content = "- [ ] Fix login bug\n- Body line\n- [ ] Another task";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("Body line");
    expect(result.candidates[1].body).toBe("");
  });

  it("stops body collection at a blank line", () => {
    const content = "- [ ] Fix login bug\n- Body line\n\n- This does not belong";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("Body line");
  });

  it("handles Obsidian-indented body lines (  - body)", () => {
    const content = "- [ ] Fix login bug\n  - The form throws a 500 error\n  - when email has a +";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("The form throws a 500 error\nwhen email has a +");
  });

  it("leaves body empty when no - lines follow the task", () => {
    const result = parseMarkdown("- [ ] Fix login bug", "test.md");
    expect(result.candidates[0].body).toBe("");
  });

  it("supports bare - as an empty body line", () => {
    const content = "- [ ] Task\n- First\n-\n- Third";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("First\n\nThird");
  });

  it("collects a fenced code block in the body", () => {
    const content = "- [ ] Set up CI\n```yaml\nsteps:\n  - run: npm install\n```";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("```yaml\nsteps:\n  - run: npm install\n```");
  });

  it("collects dash lines and a code block together", () => {
    const content = "- [ ] Set up CI\n- Install deps first\n```bash\nnpm install\n```";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("Install deps first\n```bash\nnpm install\n```");
  });

  it("preserves relative indentation inside an indented code fence", () => {
    const content = "- [ ] Task\n  ```python\n  def foo():\n      return 1\n  ```";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("```python\ndef foo():\n    return 1\n```");
  });

  it("continues collecting dash lines after a code block", () => {
    const content = "- [ ] Task\n- before\n```\ncode\n```\n- after";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("before\n```\ncode\n```\nafter");
  });

  it("appends ## Background section to the issue body", () => {
    const content = [
      "## Background",
      "Some shared context.",
      "",
      "## Workflow",
      "- [ ] Do the thing",
      "  - implementation detail",
    ].join("\n");
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe(
      "implementation detail\n\n## Background\nSome shared context."
    );
  });

  it("does not use Background as a milestone", () => {
    const content = [
      "## Background",
      "Context.",
      "",
      "## Workflow",
      "- [ ] Task A",
    ].join("\n");
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].milestone).toBe("Workflow");
  });

  it("uses the last Background section before the task", () => {
    const content = [
      "## Background",
      "Context for sprint 1.",
      "",
      "## Sprint 1",
      "- [ ] Task A",
      "",
      "## Background",
      "Context for sprint 2.",
      "",
      "## Sprint 2",
      "- [ ] Task B",
    ].join("\n");
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("## Background\nContext for sprint 1.");
    expect(result.candidates[1].body).toBe("## Background\nContext for sprint 2.");
  });

  it("uses Background as body when task has no body lines of its own", () => {
    const content = ["## Background", "Key context.", "", "## Tasks", "- [ ] Bare task"].join("\n");
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("## Background\nKey context.");
  });

  it("includes Background with mermaid diagram in body", () => {
    const content = [
      "## Background",
      "See diagram below.",
      "",
      "```mermaid",
      "flowchart LR",
      "  A --> B",
      "```",
      "",
      "## Workflow",
      "- [ ] Implement flow",
      "  - use WorkflowBuilder",
    ].join("\n");
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe(
      "use WorkflowBuilder\n\n## Background\nSee diagram below.\n\n```mermaid\nflowchart LR\n  A --> B\n```"
    );
  });

  it("collects a code fence separated from body lines by a blank line", () => {
    const content = "- [ ] Task\n- context\n\n```bash\ncode\n```";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe("context\n\n```bash\ncode\n```");
  });

  it("adds 'bug' label to tasks under ## Bugs heading", () => {
    const content = `## Bugs\n\n- [ ] Login crashes on Safari\n- [ ] 500 on password reset`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].labels).toContain("bug");
    expect(result.candidates[1].labels).toContain("bug");
  });

  it("does not add 'bug' label to tasks outside ## Bugs heading", () => {
    const content = `## Features\n\n- [ ] Add dark mode`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].labels).not.toContain("bug");
  });

  it("clears bug label when heading changes away from Bugs", () => {
    const content = `## Bugs\n\n- [ ] Crash on load\n\n## Features\n\n- [ ] Add dark mode`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].labels).toContain("bug");
    expect(result.candidates[1].labels).not.toContain("bug");
  });

  it("matches 'Bug' heading (singular, case-insensitive)", () => {
    const content = `## Bug\n\n- [ ] Null pointer on login`;
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].labels).toContain("bug");
  });

  it("collects a mermaid block separated by a blank line (real-world pattern)", () => {
    const content =
      "- [ ] Create the payment workflow\n" +
      "  - Implement using WorkflowBuilder\n" +
      "  - Called from GET /checkout\n" +
      "\n" +
      "```mermaid\n" +
      "flowchart LR\n" +
      "  A --> B\n" +
      "```";
    const result = parseMarkdown(content, "test.md");
    expect(result.candidates[0].body).toBe(
      "Implement using WorkflowBuilder\nCalled from GET /checkout\n\n```mermaid\nflowchart LR\n  A --> B\n```"
    );
  });
});
