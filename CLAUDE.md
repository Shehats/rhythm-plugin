# CLAUDE.md

## Project overview

pnpm workspace monorepo for an Obsidian plugin that parses `.canvas` / `.md` files and creates GitHub issues. Works on desktop and mobile (uses `fetch`, no Node.js deps in the hot path).

## Package layout

```
packages/
  types/           # @rhythm-plugin/types — TS interfaces only, no logic
  canvas-parser/   # @rhythm-plugin/canvas-parser — pure, unit-tested
  md-parser/       # @rhythm-plugin/md-parser — pure, unit-tested
  github-client/   # @rhythm-plugin/github-client — pure, unit-tested
  obsidian-plugin/ # esbuild CJS bundle, not unit-tested (Obsidian runtime required)
```

Dependency direction (one-way only):
```
obsidian-plugin → canvas-parser → types
               → md-parser     → types
               → github-client → types
```

## Key commands

```bash
pnpm install        # install all workspace deps
pnpm test           # vitest across canvas-parser, md-parser, github-client (23 tests)
pnpm build          # tsc build all packages + esbuild plugin
pnpm build:plugin   # esbuild only → packages/obsidian-plugin/dist/main.js
```

## Architecture notes

### Settings format

Stored in `.obsidian/plugins/rhythm-plugin/data.json` (Obsidian manages this via `loadData`/`saveData`).

```ts
interface RepoEntry { repo: string; pat: string; defaultLabels: string[] }
interface PluginSettings { repos: RepoEntry[] }
```

`repo` is always `"owner/repo"` format. `main.ts` splits on `/` to get owner and repo name before calling `GitHubClient`.

Migration from the old single-repo format (`githubPat`, `repoOwner`, `repoName`) is handled automatically in `loadSettings()`.

### Canvas parsing

- Only `text` nodes become issues — `group`, `file`, `link` nodes are skipped
- Spatial containment (`containsNode` in `spatial.ts`) uses AABB center-point test to detect which group a text node belongs to
- Group label → `milestone` + `labels[]` on inner text nodes
- `Acceptance:` anywhere in the card body gets reformatted as `## Acceptance Criteria`

### Markdown parsing

- Uses `remark-parse` + **`remark-gfm`** — the GFM plugin is required for `listItem.checked` to be populated; without it all task items are returned as plain list items with `checked: null`
- Only `checked === false` items are extracted (unchecked tasks)
- Nearest ancestor heading → `milestone`

### GitHub client

Uses raw `fetch` (not `@octokit/rest`) so it works in Obsidian mobile's non-Node runtime. Issues are created sequentially (not in parallel) to avoid rate limiting. Each call is individually try/caught so one failure doesn't abort the batch.

### Plugin UX flow

```
processFile(file)
  → parse file (canvas or md)
  → if 0 repos configured → Notice
  → if 1 repo → IssuePreviewModal
  → if 2+ repos → RepoPickerModal → IssuePreviewModal
```

## Important gotchas

- `remark-gfm` is a required dependency of `md-parser` — removing it silently breaks task extraction with no error
- `@octokit/rest` was removed in favour of raw `fetch` for mobile compatibility — do not re-add it
- esbuild build scripts must be explicitly allowed via `"pnpm": { "onlyBuiltDependencies": ["esbuild"] }` in root `package.json` (not `.npmrc`) for pnpm v10
- `data.json` contains real PATs — it is in `.gitignore` and must never be committed
- The `obsidian-plugin` package uses `"noEmit": true` in its tsconfig because esbuild handles the actual compilation; `tsc` is only used for type-checking there
