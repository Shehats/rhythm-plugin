export type CanvasNodeType = "text" | "file" | "link" | "group";

export interface CanvasTextNode {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface CanvasFileNode {
  id: string;
  type: "file";
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  subpath?: string;
  color?: string;
}

export interface CanvasGroupNode {
  id: string;
  type: "group";
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface CanvasLinkNode {
  id: string;
  type: "link";
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CanvasNode = CanvasTextNode | CanvasFileNode | CanvasGroupNode | CanvasLinkNode;

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: "top" | "bottom" | "left" | "right";
  toNode: string;
  toSide?: "top" | "bottom" | "left" | "right";
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
