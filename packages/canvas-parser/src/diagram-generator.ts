import type {
  CanvasData,
  CanvasGroupNode,
  CanvasNode,
  CanvasTextNode,
  CanvasFileNode,
  CanvasLinkNode,
} from "@rhythm-plugin/types";
import { containsNode } from "./spatial.js";

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

function escapeLabel(text: string): string {
  return text.replace(/"/g, "#quot;").replace(/\n/g, " ").slice(0, 60);
}

function nodeLabel(node: CanvasNode): string {
  switch (node.type) {
    case "text":
      return (node as CanvasTextNode).text.split("\n")[0].trim();
    case "group":
      return (node as CanvasGroupNode).label ?? node.id;
    case "file": {
      const parts = (node as CanvasFileNode).file.split("/");
      const basename = parts[parts.length - 1];
      return basename.replace(/\.[^.]+$/, "");
    }
    case "link":
      return (node as CanvasLinkNode).url.slice(0, 40);
  }
}

export function generateLayoutDiagram(data: CanvasData): string {
  const lines: string[] = ["flowchart TD"];
  const groups = data.nodes.filter((n): n is CanvasGroupNode => n.type === "group");
  const nonGroupNodes = data.nodes.filter((n) => n.type !== "group");
  const groupedIds = new Set<string>();

  for (const group of groups) {
    lines.push(`  subgraph ${safeId(group.id)}["${escapeLabel(nodeLabel(group))}"]`);
    for (const node of nonGroupNodes) {
      if (containsNode(group, node)) {
        groupedIds.add(node.id);
        lines.push(`    ${safeId(node.id)}["${escapeLabel(nodeLabel(node))}"]`);
      }
    }
    lines.push("  end");
  }

  for (const node of nonGroupNodes) {
    if (!groupedIds.has(node.id)) {
      lines.push(`  ${safeId(node.id)}["${escapeLabel(nodeLabel(node))}"]`);
    }
  }

  return lines.join("\n");
}

export function generateArrowDiagram(data: CanvasData): string {
  if (!data.edges || data.edges.length === 0) return "";

  const lines: string[] = ["flowchart LR"];
  const labelMap = new Map(data.nodes.map((n) => [n.id, nodeLabel(n)]));

  // Declare each node referenced in edges (deduplicated)
  const referencedIds = new Set(data.edges.flatMap((e) => [e.fromNode, e.toNode]));
  for (const id of referencedIds) {
    const label = labelMap.get(id) ?? id;
    lines.push(`  ${safeId(id)}["${escapeLabel(label)}"]`);
  }

  for (const edge of data.edges) {
    const from = safeId(edge.fromNode);
    const to = safeId(edge.toNode);
    if (edge.label) {
      lines.push(`  ${from} -->|"${escapeLabel(edge.label)}"| ${to}`);
    } else {
      lines.push(`  ${from} --> ${to}`);
    }
  }

  return lines.join("\n");
}

export function buildDiagramSection(layout: string, arrows: string): string {
  const parts: string[] = [
    `<diagram>\n\`\`\`mermaid\n${layout}\n\`\`\`\n</diagram>`,
  ];
  if (arrows) {
    parts.push(`<diagram_arrow>\n\`\`\`mermaid\n${arrows}\n\`\`\`\n</diagram_arrow>`);
  }
  return parts.join("\n\n");
}
