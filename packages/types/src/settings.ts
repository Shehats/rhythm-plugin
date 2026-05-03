export interface PluginSettings {
  githubPat: string;
  repoOwner: string;
  repoName: string;
  defaultLabels: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
  githubPat: "",
  repoOwner: "",
  repoName: "",
  defaultLabels: [],
};
