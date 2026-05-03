import type { App, TFile } from "obsidian";

export async function readObsidianFile(app: App, file: TFile): Promise<string> {
  return app.vault.read(file);
}

export function detectFileType(file: TFile): "canvas" | "markdown" | "unsupported" {
  if (file.extension === "canvas") return "canvas";
  if (file.extension === "md") return "markdown";
  return "unsupported";
}
