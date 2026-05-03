# Rhythm Plugin

An Obsidian plugin that parses `.canvas` and `.md` files and creates GitHub issues from them. Works on desktop and mobile.

## Features

- Extract text cards from Obsidian Canvas files as GitHub issues
- Extract unchecked tasks (`- [ ]`) from Markdown files as GitHub issues
- Preview and deselect individual issues before submitting
- Multiple GitHub repos with per-repo PATs
- Group nodes on canvas become milestone/label on inner cards

## Installation

1. Build the plugin (see [Development](#development)) or download a release
2. Copy `dist/main.js` and `manifest.json` into your vault:
   ```
   <vault>/.obsidian/plugins/rhythm-plugin/
   ```
3. In Obsidian: **Settings → Community plugins → disable Safe mode → enable Rhythm Plugin**

## Configuration

Open **Settings → Rhythm Plugin** and add one or more repository entries. Each entry requires:

| Field | Example | Description |
|---|---|---|
| Repository | `octocat/my-repo` | `owner/repo` format |
| PAT | `ghp_...` | Personal Access Token with Issues: Read & write |
| Default Labels | `imported, backlog` | Comma-separated labels applied to every issue |

See [`packages/obsidian-plugin/data.example.json`](packages/obsidian-plugin/data.example.json) for the raw settings format (useful if you want to pre-populate settings by copying the file to `.obsidian/plugins/rhythm-plugin/data.json`).

**PAT scopes needed:**
- Public repo: `public_repo`
- Private repo: `repo`
- Fine-grained PAT: **Issues: Read and write** on the target repository

> Your PAT is stored in `.obsidian/plugins/rhythm-plugin/data.json` inside your vault. Do not commit this file to a public repository.

## Usage

### From a Canvas file

Right-click any `.canvas` file → **Create GitHub issues**, or open the file and run the command **Create GitHub issues from current file**.

**How canvas cards map to issues:**
- Each **text card** becomes one issue
- First line of the card → issue title (max 120 chars)
- Remaining text → issue body
- A line starting with `Acceptance:` is reformatted as an `## Acceptance Criteria` section
- Cards inside a **group** inherit the group's label as their milestone and label
- File nodes, link nodes, and group nodes themselves are ignored

Example canvas layout:
```
┌─ Sprint 1 ──────────────────────────────┐
│  ┌──────────────────┐                   │
│  │ Fix login bug    │                   │
│  │                  │                   │
│  │ Acceptance: user │                   │
│  │ can log in       │                   │
│  └──────────────────┘                   │
└──────────────────────────────────────────┘
```
Produces: issue titled **"Fix login bug"** with `## Acceptance Criteria` body, milestone = `Sprint 1`, label = `Sprint 1`.

### From a Markdown file

Right-click any `.md` file → **Create GitHub issues**, or use the command palette.

Only **unchecked GFM task list items** are extracted:

```markdown
## Sprint 1

- [ ] Fix the login bug        ← becomes an issue (milestone: Sprint 1)
- [ ] Add rate limiting        ← becomes an issue (milestone: Sprint 1)
- [x] Write unit tests         ← skipped (already checked)

## Sprint 2

- [ ] Redesign onboarding      ← becomes an issue (milestone: Sprint 2)
```

### Selecting a repo

- **1 repo configured** → goes straight to the issue preview
- **2+ repos configured** → a repo picker appears first

### Preview modal

Before any issues are created you see a list of all candidates. Uncheck any you want to skip, then click **Create Issues**.

## Development

### Prerequisites

- Node.js ≥ 18
- pnpm (`npm install -g pnpm`)

### Setup

```bash
git clone https://github.com/shehats/rhythm-plugin
cd rhythm-plugin
pnpm install
```

### Commands

```bash
pnpm test          # run all unit tests (vitest)
pnpm build         # build all packages
pnpm build:plugin  # build only the Obsidian plugin bundle → packages/obsidian-plugin/dist/
```

### Hot reload in Obsidian

```bash
# Symlink the dist folder into your vault
ln -s "$(pwd)/packages/obsidian-plugin/dist" \
      ~/your-vault/.obsidian/plugins/rhythm-plugin

cp packages/obsidian-plugin/manifest.json \
   ~/your-vault/.obsidian/plugins/rhythm-plugin/

# Watch mode
pnpm --filter obsidian-plugin run dev
```

### Package structure

```
packages/
  types/           # @rhythm-plugin/types — shared interfaces, no logic
  canvas-parser/   # @rhythm-plugin/canvas-parser — parses .canvas JSON
  md-parser/       # @rhythm-plugin/md-parser — parses .md task lists
  github-client/   # @rhythm-plugin/github-client — creates issues via fetch
  obsidian-plugin/ # the compiled Obsidian plugin
```

## Mobile

The plugin works on Obsidian mobile. It uses the standard `fetch` API (no Node.js dependencies). Install the plugin files the same way as desktop, via your phone's file manager or Obsidian Sync.

Settings (including PATs) are stored per-device and must be re-entered on each device unless you sync `.obsidian/` via Obsidian Sync or iCloud.
