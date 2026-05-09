export type IssueSource = "canvas-text" | "md-task";

export interface IssueCandidate {
  id: string;
  title: string;
  body: string;
  labels: string[];
  milestone?: string;
  sourceFile: string;
  source: IssueSource;
  sourceRef?: string;
  blockedByNodeIds?: string[];
}

export interface ParsedFile {
  filePath: string;
  fileType: "canvas" | "markdown";
  candidates: IssueCandidate[];
}

export interface IssueCreateRequest {
  title: string;
  body: string;
  labels?: string[];
}

export interface IssueCreateResult {
  candidate: IssueCandidate;
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
}

export interface CreateIssuesReport {
  results: IssueCreateResult[];
  successCount: number;
  failureCount: number;
}
