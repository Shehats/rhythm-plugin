import type {
  CreateIssuesReport,
  IssueCandidate,
  IssueCreateResult,
} from "@rhythm-plugin/types";
import { mapCandidateToRequest } from "./mapper.js";

export class GitHubClient {
  private constructor(private readonly pat: string) {}

  static fromPat(pat: string): GitHubClient {
    return new GitHubClient(pat);
  }

  async createIssue(
    owner: string,
    repo: string,
    candidate: IssueCandidate,
    defaultLabels: string[],
  ): Promise<IssueCreateResult> {
    const request = mapCandidateToRequest(candidate, defaultLabels);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.pat}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            title: request.title,
            body: request.body,
            labels: request.labels,
          }),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `GitHub API error ${response.status}`);
      }
      const data = await response.json() as { number: number; html_url: string };
      return {
        candidate,
        success: true,
        issueNumber: data.number,
        issueUrl: data.html_url,
      };
    } catch (err) {
      return {
        candidate,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async createIssues(
    owner: string,
    repo: string,
    candidates: IssueCandidate[],
    defaultLabels: string[],
  ): Promise<CreateIssuesReport> {
    const results: IssueCreateResult[] = [];
    for (const candidate of candidates) {
      results.push(await this.createIssue(owner, repo, candidate, defaultLabels));
    }
    return {
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  }
}
