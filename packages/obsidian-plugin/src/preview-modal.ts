import { App, Modal, Notice, Setting } from "obsidian";
import type { IssueCandidate, CreateIssuesReport } from "@rhythm-plugin/types";

type OnConfirm = (selected: IssueCandidate[]) => Promise<CreateIssuesReport>;

export class IssuePreviewModal extends Modal {
  private selected: Set<string>;

  constructor(
    app: App,
    private readonly candidates: IssueCandidate[],
    private readonly onConfirm: OnConfirm,
  ) {
    super(app);
    this.selected = new Set(candidates.map((c) => c.id));
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Create GitHub Issues" });

    if (this.candidates.length === 0) {
      contentEl.createEl("p", { text: "No issue candidates found in this file." });
      new Setting(contentEl).addButton((btn) =>
        btn.setButtonText("Close").onClick(() => this.close()),
      );
      return;
    }

    const listEl = contentEl.createDiv({ cls: "rhythm-issue-list" });
    listEl.style.cssText = "max-height:60vh;overflow-y:auto;margin-bottom:1em;";

    for (const candidate of this.candidates) {
      const card = listEl.createDiv({ cls: "rhythm-issue-card" });
      card.style.cssText =
        "border:1px solid var(--background-modifier-border);border-radius:6px;padding:0.75em;margin-bottom:0.5em;";

      const header = card.createDiv();
      header.style.cssText = "display:flex;align-items:center;gap:0.5em;";

      const checkbox = header.createEl("input", { type: "checkbox" });
      checkbox.checked = this.selected.has(candidate.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.selected.add(candidate.id);
        else this.selected.delete(candidate.id);
      });

      header.createEl("strong", { text: candidate.title });

      if (candidate.labels.length > 0) {
        const labelsEl = header.createDiv();
        for (const label of candidate.labels) {
          const chip = labelsEl.createEl("span", { text: label });
          chip.style.cssText =
            "display:inline-block;background:var(--tag-background);color:var(--tag-color);border-radius:4px;padding:1px 6px;font-size:0.75em;margin-left:4px;";
        }
      }

      if (candidate.body) {
        const bodyPreview = candidate.body.slice(0, 200);
        const bodyEl = card.createEl("p", {
          text: bodyPreview + (candidate.body.length > 200 ? "…" : ""),
        });
        bodyEl.style.cssText = "margin:0.4em 0 0;font-size:0.85em;color:var(--text-muted);";
      }
    }

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => this.close()),
      )
      .addButton((btn) =>
        btn
          .setButtonText(`Create ${this.selected.size} Issue${this.selected.size !== 1 ? "s" : ""}`)
          .setCta()
          .onClick(async () => {
            const toCreate = this.candidates.filter((c) => this.selected.has(c.id));
            if (toCreate.length === 0) {
              new Notice("No issues selected.");
              return;
            }
            btn.setButtonText("Creating…").setDisabled(true);
            try {
              const report = await this.onConfirm(toCreate);
              this.close();
              new Notice(
                `Created ${report.successCount} issue${report.successCount !== 1 ? "s" : ""}` +
                  (report.failureCount > 0 ? ` (${report.failureCount} failed)` : ""),
              );
            } catch (err) {
              btn.setButtonText("Retry").setDisabled(false);
              new Notice(`Error: ${err instanceof Error ? err.message : String(err)}`);
            }
          }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
