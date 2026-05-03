import { App, PluginSettingTab, Setting } from "obsidian";
import type RhythmPlugin from "./main.js";

export class RhythmSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: RhythmPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Rhythm Plugin Settings" });

    new Setting(containerEl)
      .setName("GitHub Personal Access Token")
      .setDesc("Token with repo scope to create issues.")
      .addText((text) =>
        text
          .setPlaceholder("ghp_...")
          .setValue(this.plugin.settings.githubPat)
          .onChange(async (value) => {
            this.plugin.settings.githubPat = value.trim();
            await this.plugin.saveSettings();
          }),
      )
      .then((s) => {
        s.controlEl.querySelector("input")?.setAttribute("type", "password");
      });

    new Setting(containerEl)
      .setName("Repository Owner")
      .setDesc("GitHub username or organization name.")
      .addText((text) =>
        text
          .setPlaceholder("octocat")
          .setValue(this.plugin.settings.repoOwner)
          .onChange(async (value) => {
            this.plugin.settings.repoOwner = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Repository Name")
      .setDesc("Name of the GitHub repository.")
      .addText((text) =>
        text
          .setPlaceholder("my-repo")
          .setValue(this.plugin.settings.repoName)
          .onChange(async (value) => {
            this.plugin.settings.repoName = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Default Labels")
      .setDesc("Comma-separated labels applied to every created issue.")
      .addText((text) =>
        text
          .setPlaceholder("bug, enhancement")
          .setValue(this.plugin.settings.defaultLabels.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.defaultLabels = value
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          }),
      );
  }
}
