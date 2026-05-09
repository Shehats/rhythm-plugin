import type { IssueCandidate } from "@rhythm-plugin/types";
import type { Root, ListItem, Heading, PhrasingContent } from "mdast";
import { visit, SKIP } from "unist-util-visit";

function inlineText(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text" || n.type === "inlineCode") return n.value;
      if ("children" in n) return inlineText(n.children as PhrasingContent[]);
      return "";
    })
    .join("");
}

const TASK_ITEM_RE = /^- \[[ xX]\]/;
const BACKGROUND_HEADING_RE = /^##\s+background\b/i;
const SECTION_STOP_RE = /^#{1,2}\s/;
const BUGS_HEADING_RE = /^bugs?$/i;

interface BackgroundSection {
  headingLine: number;
  fullText: string; // includes the "## Background" heading line
}

function extractBackgroundSections(rawLines: string[]): BackgroundSection[] {
  const sections: BackgroundSection[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    if (!BACKGROUND_HEADING_RE.test(rawLines[i])) continue;
    const headingLine = i;
    const lines = [rawLines[i]];
    let j = i + 1;
    while (j < rawLines.length && !SECTION_STOP_RE.test(rawLines[j])) {
      lines.push(rawLines[j]);
      j++;
    }
    sections.push({ headingLine, fullText: lines.join("\n").trimEnd() });
  }
  return sections;
}

function findBackground(taskLine: number, sections: BackgroundSection[]): string | undefined {
  let result: string | undefined;
  for (const s of sections) {
    if (s.headingLine < taskLine) result = s.fullText;
  }
  return result;
}

function extractBody(rawLines: string[], taskStartLineIdx: number): string {
  const bodyLines: string[] = [];
  let i = taskStartLineIdx + 1;
  while (i < rawLines.length) {
    const trimmed = rawLines[i].trimStart();
    if (trimmed.startsWith("```")) {
      // Collect the entire fenced code block. Strip list-item indentation from
      // each line but preserve relative indentation inside the fence.
      const indent = rawLines[i].length - trimmed.length;
      bodyLines.push(trimmed);
      i++;
      while (i < rawLines.length) {
        const raw = rawLines[i];
        const stripped = raw.length > indent ? raw.slice(indent) : raw.trimStart();
        bodyLines.push(stripped);
        i++;
        if (stripped.trimStart().startsWith("```")) break;
      }
    } else if (trimmed.startsWith("- ") && !TASK_ITEM_RE.test(trimmed)) {
      bodyLines.push(trimmed.slice(2));
      i++;
    } else if (trimmed === "-") {
      bodyLines.push("");
      i++;
    } else if (trimmed === "") {
      // Blank line: stop unless the next non-blank line opens a code fence,
      // in which case bridge across the gap so the fence is included in the body.
      let j = i + 1;
      while (j < rawLines.length && rawLines[j].trimStart() === "") j++;
      if (j < rawLines.length && rawLines[j].trimStart().startsWith("```")) {
        bodyLines.push("");
        i = j; // advance directly to the fence line
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return bodyLines.join("\n").trim();
}

export function extractTasks(ast: Root, filePath: string, rawContent: string): IssueCandidate[] {
  const rawLines = rawContent.split("\n");
  const backgroundSections = extractBackgroundSections(rawLines);
  const candidates: IssueCandidate[] = [];
  let currentHeading: string | undefined;
  let isBugsSection = false;

  visit(ast, (node) => {
    if (node.type === "heading") {
      const heading = node as Heading;
      const text = inlineText(heading.children as PhrasingContent[]);
      // Don't use "Background" as a milestone — it's a context section, not a sprint/workflow.
      if (!BACKGROUND_HEADING_RE.test(`## ${text}`)) {
        currentHeading = text;
      }
      isBugsSection = heading.depth === 2 && BUGS_HEADING_RE.test(text.trim());
      return SKIP;
    }

    if (node.type === "listItem") {
      const item = node as ListItem;
      if (item.checked !== false) return;

      const firstParagraph = item.children.find((c) => c.type === "paragraph");
      if (!firstParagraph || !("children" in firstParagraph)) return;

      const title = inlineText(firstParagraph.children as PhrasingContent[]);
      if (!title.trim()) return;

      const pos = item.position;
      // Use start.line so dot-body lines are found even when remark absorbs them
      // into the list item via lazy continuation (which advances end.line past them).
      const taskStartLineIdx = (pos?.start.line ?? 1) - 1;
      const taskBody = extractBody(rawLines, taskStartLineIdx);
      const background = findBackground(taskStartLineIdx, backgroundSections);
      const body = background
        ? taskBody
          ? `${taskBody}\n\n${background}`
          : background
        : taskBody;

      candidates.push({
        id: `md-task-${filePath}-${pos?.start.line ?? candidates.length}`,
        title: title.trim(),
        body,
        labels: isBugsSection ? ["bug"] : [],
        milestone: currentHeading,
        sourceFile: filePath,
        source: "md-task",
        sourceRef: pos ? `${pos.start.line}-${pos.end.line}` : undefined,
      });

      return SKIP;
    }
  });

  return candidates;
}
