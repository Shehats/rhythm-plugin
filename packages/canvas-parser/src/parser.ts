import type { CanvasData, CanvasGroupNode, CanvasTextNode, IssueCandidate, ParsedFile } from "@rhythm-plugin/types";
import { classifyTextNode } from "./classifier.js";
import { buildDiagramSection, generateArrowDiagram, generateLayoutDiagram } from "./diagram-generator.js";
import { containsNode } from "./spatial.js";

const DEPENDS_ON_RE = /^depends on$/i;

export class CanvasParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanvasParseError";
  }
}

export function parseCanvas(rawJson: string, filePath: string): ParsedFile {
  let data: CanvasData;
  try {
    data = JSON.parse(rawJson) as CanvasData;
  } catch {
    throw new CanvasParseError(`Invalid JSON in canvas file: ${filePath}`);
  }

  if (!Array.isArray(data.nodes)) {
    throw new CanvasParseError(`Canvas file missing "nodes" array: ${filePath}`);
  }

  const groups = data.nodes.filter((n): n is CanvasGroupNode => n.type === "group");
  const textNodes = data.nodes.filter((n): n is CanvasTextNode => n.type === "text");

  // Map each text node to the labels of groups that contain it
  const nodeGroupLabels = new Map<string, string[]>();
  for (const node of textNodes) {
    const labels: string[] = [];
    for (const group of groups) {
      if (group.label && containsNode(group, node)) {
        labels.push(group.label);
      }
    }
    nodeGroupLabels.set(node.id, labels);
  }

  const diagramSection = buildDiagramSection(
    generateLayoutDiagram(data),
    generateArrowDiagram(data),
  );

  const candidates = textNodes.map((node) => {
    const candidate = classifyTextNode(node, nodeGroupLabels.get(node.id) ?? [], filePath);
    candidate.body = candidate.body
      ? `${candidate.body}\n\n---\n\n${diagramSection}`
      : diagramSection;
    return candidate;
  });

  const candidateById = new Map<string, IssueCandidate>(candidates.map((c) => [c.id, c]));
  for (const edge of (Array.isArray(data.edges) ? data.edges : [])) {
    if (!edge.label || !DEPENDS_ON_RE.test(edge.label.trim())) continue;
    const from = candidateById.get(edge.fromNode);
    if (!from) continue;
    (from.blockedByNodeIds ??= []).push(edge.toNode);
  }

  return { filePath, fileType: "canvas", candidates };
}
