import type { CanvasData, CanvasGroupNode, CanvasTextNode, ParsedFile } from "@rhythm-plugin/types";
import { classifyTextNode } from "./classifier.js";
import { containsNode } from "./spatial.js";

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

  const candidates = textNodes.map((node) =>
    classifyTextNode(node, nodeGroupLabels.get(node.id) ?? [], filePath),
  );

  return { filePath, fileType: "canvas", candidates };
}
