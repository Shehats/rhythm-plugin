import { Notice } from "obsidian";
import type RhythmPlugin from "./main.js";
import { detectFileType } from "./file-reader.js";

export function registerCommands(plugin: RhythmPlugin): void {
  plugin.addCommand({
    id: "create-issues",
    name: "Create GitHub issues from current file",
    callback: async () => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        new Notice("No active file.");
        return;
      }
      const type = detectFileType(file);
      if (type === "unsupported") {
        new Notice("Rhythm Plugin only works with .canvas and .md files.");
        return;
      }
      await plugin.processFile(file);
    },
  });
}
