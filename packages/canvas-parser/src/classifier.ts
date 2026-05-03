import type { CanvasTextNode, IssueCandidate } from "@rhythm-plugin/types";

const ACCEPTANCE_RE = /^acceptance:/im;

export function classifyTextNode(
  node: CanvasTextNode,
  groupLabels: string[],
  filePath: string,
): IssueCandidate {
  const lines = node.text.trim().split("\n");
  const rawTitle = lines[0].trim();
  const title = rawTitle.length > 120 ? rawTitle.slice(0, 120) : rawTitle;
  const rest = lines.slice(1).join("\n").trim();

  let body: string;
  if (ACCEPTANCE_RE.test(rest)) {
    const match = rest.match(ACCEPTANCE_RE)!;
    const idx = rest.indexOf(match[0]);
    const before = rest.slice(0, idx).trim();
    const after = rest.slice(idx + match[0].length).trim();
    body = [before, before ? "\n\n## Acceptance Criteria\n" : "## Acceptance Criteria\n", after]
      .filter(Boolean)
      .join("");
  } else {
    body = rest;
  }

  return {
    id: node.id,
    title,
    body,
    labels: [...groupLabels],
    milestone: groupLabels[0],
    sourceFile: filePath,
    source: "canvas-text",
    sourceRef: node.id,
  };
}
