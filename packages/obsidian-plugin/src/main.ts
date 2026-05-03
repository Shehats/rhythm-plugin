import { Notice, Plugin, TFile } from "obsidian";
import type { PluginSettings, RepoEntry } from "@rhythm-plugin/types";
import { DEFAULT_SETTINGS } from "@rhythm-plugin/types";
import { parseCanvas } from "@rhythm-plugin/canvas-parser";
import { parseMarkdown } from "@rhythm-plugin/md-parser";
import { GitHubClient } from "@rhythm-plugin/github-client";
import { RhythmSettingTab } from "./settings.js";
import { registerCommands } from "./commands.js";
import { registerFileMenu } from "./file-menu.js";
import { IssuePreviewModal } from "./preview-modal.js";
import { RepoPickerModal } from "./repo-picker-modal.js";
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
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    // Migrate from single-repo format
    if (saved && "githubPat" in saved && saved.githubPat && this.settings.repos.length === 0) {
      this.settings.repos = [
        {
          repo: `${saved.repoOwner}/${saved.repoName}`,
          pat: saved.githubPat,
          defaultLabels: saved.defaultLabels ?? [],
        },
      ];
      await this.saveSettings();
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async processFile(file: TFile): Promise<void> {
    const { repos } = this.settings;

    if (repos.length === 0) {
      new Notice("Rhythm Plugin: add at least one repository in Settings.");
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

    if (repos.length === 1) {
      this.openPreviewModal(repos[0], file, parsed.candidates);
    } else {
      new RepoPickerModal(this.app, repos, (entry) => {
        this.openPreviewModal(entry, file, parsed.candidates);
      }).open();
    }
  }

  private openPreviewModal(
    entry: RepoEntry,
    _file: TFile,
    candidates: ReturnType<typeof parseCanvas>["candidates"],
  ): void {
    const [owner, repo] = entry.repo.split("/");
    const client = GitHubClient.fromPat(entry.pat);

    new IssuePreviewModal(this.app, candidates, (selected) =>
      client.createIssues(owner, repo, selected, entry.defaultLabels),
    ).open();
  }
}
