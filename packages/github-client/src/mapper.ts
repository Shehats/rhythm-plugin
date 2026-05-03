import type { IssueCandidate, IssueCreateRequest } from "@rhythm-plugin/types";

export function mapCandidateToRequest(
  candidate: IssueCandidate,
  defaultLabels: string[],
): IssueCreateRequest {
  const title =
    candidate.title.length > 256 ? candidate.title.slice(0, 256) : candidate.title;

  const attribution = `> Imported from \`${candidate.sourceFile}\`\n\n`;
  const body = attribution + (candidate.body ?? "");

  const allLabels = [...new Set([...candidate.labels, ...defaultLabels])];

  return { title, body, labels: allLabels };
}
