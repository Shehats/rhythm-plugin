export interface RepoEntry {
  repo: string;
  pat: string;
  defaultLabels: string[];
}

export interface PluginSettings {
  repos: RepoEntry[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
  repos: [],
};
