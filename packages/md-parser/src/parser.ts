import type { ParsedFile } from "@rhythm-plugin/types";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { extractTasks } from "./task-extractor.js";

export function parseMarkdown(content: string, filePath: string): ParsedFile {
  const ast = unified().use(remarkParse).use(remarkGfm).parse(content);
  const candidates = extractTasks(ast, filePath, content);
  return { filePath, fileType: "markdown", candidates };
}
