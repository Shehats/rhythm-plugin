import { Notice, Plugin, TFile } from "obsidian";
import type { PluginSettings } from "@rhythm-plugin/types";
import { DEFAULT_SETTINGS } from "@rhythm-plugin/types";
import { parseCanvas } from "@rhythm-plugin/canvas-parser";
import { parseMarkdown } from "@rhythm-plugin/md-parser";
import { GitHubClient } from "@rhythm-plugin/github-client";
import { RhythmSettingTab } from "./settings.js";
import { registerCommands } from "./commands.js";
import { registerFileMenu } from "./file-menu.js";
import { IssuePreviewModal } from "./preview-modal.js";
import { detectFileType, readObsidianFile } from "./file-reader.js";

export default class RhythmPlugin extends Plugin {
  settings!: PluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new RhythmSettingTab(this.app, this));
    registerCommands(this);
    registerFileMenu(this);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async processFile(file: TFile): Promise<void> {
    const { githubPat, repoOwner, repoName } = this.settings;

    if (!githubPat || !repoOwner || !repoName) {
      new Notice(
        "Rhythm Plugin: configure your GitHub PAT, owner, and repo name in Settings first.",
      );
      return;
    }

    const type = detectFileType(file);
    if (type === "unsupported") return;

    let rawContent: string;
    try {
      rawContent = await readObsidianFile(this.app, file);
    } catch {
      new Notice(`Rhythm Plugin: could not read ${file.path}`);
      return;
    }

    const parsed =
      type === "canvas"
        ? parseCanvas(rawContent, file.path)
        : parseMarkdown(rawContent, file.path);

    if (parsed.candidates.length === 0) {
      new Notice("Rhythm Plugin: no issue candidates found in this file.");
      return;
    }

    const client = GitHubClient.fromPat(githubPat);
    const defaultLabels = this.settings.defaultLabels;

    new IssuePreviewModal(this.app, parsed.candidates, (selected) =>
      client.createIssues(repoOwner, repoName, selected, defaultLabels),
    ).open();
  }
}
