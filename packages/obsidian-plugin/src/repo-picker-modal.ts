import { App, Modal, Setting } from "obsidian";
import type { RepoEntry } from "@rhythm-plugin/types";

export class RepoPickerModal extends Modal {
  constructor(
    app: App,
    private readonly repos: RepoEntry[],
    private readonly onPick: (entry: RepoEntry) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Select Repository" });

    for (const entry of this.repos) {
      new Setting(contentEl).setName(entry.repo).addButton((btn) =>
        btn
          .setButtonText("Use this repo")
          .onClick(() => {
            this.close();
            this.onPick(entry);
          }),
      );
    }

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Cancel").onClick(() => this.close()),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
