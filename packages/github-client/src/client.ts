import { Octokit } from "@octokit/rest";
import type {
  CreateIssuesReport,
  IssueCandidate,
  IssueCreateResult,
} from "@rhythm-plugin/types";
import { mapCandidateToRequest } from "./mapper.js";

export class GitHubClient {
  private constructor(private readonly octokit: Octokit) {}

  static fromPat(pat: string): GitHubClient {
    return new GitHubClient(new Octokit({ auth: pat }));
  }

  async createIssue(
    owner: string,
    repo: string,
    candidate: IssueCandidate,
    defaultLabels: string[],
  ): Promise<IssueCreateResult> {
    const request = mapCandidateToRequest(candidate, defaultLabels);
    try {
      const { data } = await this.octokit.rest.issues.create({
        owner,
        repo,
        title: request.title,
        body: request.body,
        labels: request.labels,
      });
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
