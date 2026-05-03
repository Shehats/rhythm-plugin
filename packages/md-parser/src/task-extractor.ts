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

export function extractTasks(ast: Root, filePath: string): IssueCandidate[] {
  const candidates: IssueCandidate[] = [];
  let currentHeading: string | undefined;

  visit(ast, (node) => {
    if (node.type === "heading") {
      const heading = node as Heading;
      currentHeading = inlineText(heading.children as PhrasingContent[]);
      return SKIP;
    }

    if (node.type === "listItem") {
      const item = node as ListItem;
      if (item.checked !== false) return;

      const firstParagraph = item.children.find((c) => c.type === "paragraph");
      if (!firstParagraph || !("children" in firstParagraph)) return;

      const title = inlineText(firstParagraph.children as PhrasingContent[]);
      if (!title.trim()) return;

      const bodyParts = item.children
        .slice(1)
        .map((c) => {
          if (c.type === "paragraph" && "children" in c) {
            return inlineText(c.children as PhrasingContent[]);
          }
          return "";
        })
        .filter(Boolean);

      const pos = item.position;
      const sourceRef = pos ? `${pos.start.line}-${pos.end.line}` : undefined;

      candidates.push({
        id: `md-task-${filePath}-${pos?.start.line ?? candidates.length}`,
        title: title.trim(),
        body: bodyParts.join("\n\n"),
        labels: [],
        milestone: currentHeading,
        sourceFile: filePath,
        source: "md-task",
        sourceRef,
      });

      return SKIP;
    }
  });

  return candidates;
}
