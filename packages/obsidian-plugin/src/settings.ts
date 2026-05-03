import { App, PluginSettingTab, Setting } from "obsidian";
import type { RepoEntry } from "@rhythm-plugin/types";
import type RhythmPlugin from "./main.js";

export class RhythmSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: RhythmPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Rhythm Plugin — Repositories" });
    containerEl.createEl("p", {
      text: 'Each entry maps a GitHub repo ("owner/repo") to its Personal Access Token.',
      cls: "setting-item-description",
    });

    const listEl = containerEl.createDiv();
    this.renderList(listEl);

    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("+ Add Repository")
        .setCta()
        .onClick(async () => {
          this.plugin.settings.repos.push({ repo: "", pat: "", defaultLabels: [] });
          await this.plugin.saveSettings();
          this.renderList(listEl);
        }),
    );
  }

  private renderList(listEl: HTMLElement): void {
    listEl.empty();

    if (this.plugin.settings.repos.length === 0) {
      listEl.createEl("p", {
        text: "No repositories configured. Add one below.",
        cls: "setting-item-description",
      });
      return;
    }

    for (let i = 0; i < this.plugin.settings.repos.length; i++) {
      this.renderEntry(listEl, i);
    }
  }

  private renderEntry(listEl: HTMLElement, index: number): void {
    const entry: RepoEntry = this.plugin.settings.repos[index];

    const save = async () => {
      await this.plugin.saveSettings();
    };

    const wrapper = listEl.createDiv();
    wrapper.style.cssText =
      "border:1px solid var(--background-modifier-border);border-radius:6px;padding:0.75em;margin-bottom:0.75em;";

    new Setting(wrapper)
      .setName(`Repository ${index + 1}`)
      .setDesc('Format: "owner/repo" — e.g. octocat/hello-world')
      .addText((text) =>
        text
          .setPlaceholder("owner/repo")
          .setValue(entry.repo)
          .onChange(async (value) => {
            this.plugin.settings.repos[index].repo = value.trim();
            await save();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Remove")
          .onClick(async () => {
            this.plugin.settings.repos.splice(index, 1);
            await save();
            this.renderList(listEl);
          }),
      );

    new Setting(wrapper)
      .setName("Personal Access Token")
      .setDesc("Needs Issues: Read and write permission.")
      .addText((text) => {
        text.setPlaceholder("ghp_...").setValue(entry.pat).onChange(async (value) => {
          this.plugin.settings.repos[index].pat = value.trim();
          await save();
        });
        text.inputEl.setAttribute("type", "password");
        return text;
      });

    new Setting(wrapper)
      .setName("Default Labels")
      .setDesc("Comma-separated labels applied to every issue created for this repo.")
      .addText((text) =>
        text
          .setPlaceholder("bug, enhancement")
          .setValue(entry.defaultLabels.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.repos[index].defaultLabels = value
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean);
            await save();
          }),
      );
  }
}
