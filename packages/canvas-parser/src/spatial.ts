import type { CanvasGroupNode, CanvasNode } from "@rhythm-plugin/types";

export function containsNode(group: CanvasGroupNode, node: CanvasNode): boolean {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  return (
    centerX > group.x &&
    centerX < group.x + group.width &&
    centerY > group.y &&
    centerY < group.y + group.height
  );
}
