import { TFile } from "obsidian";
import type RhythmPlugin from "./main.js";
import { detectFileType } from "./file-reader.js";

export function registerFileMenu(plugin: RhythmPlugin): void {
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, abstractFile) => {
      if (!(abstractFile instanceof TFile)) return;
      if (detectFileType(abstractFile) === "unsupported") return;

      menu.addItem((item) =>
        item
          .setTitle("Create GitHub issues")
          .setIcon("github")
          .onClick(() => plugin.processFile(abstractFile)),
      );
    }),
  );
}
