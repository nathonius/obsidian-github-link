import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export enum IssueStatus {
	Open = "open",
	Closed = "closed",
	Done = "done",
}

export type IssueResponse = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
export type PullResponse = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
export type CodeResponse = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
export type SearchRepoParams = RestEndpointMethodTypes["search"]["repos"]["parameters"];
export type SearchRepoResponse = RestEndpointMethodTypes["search"]["repos"]["response"]["data"];
export type SearchIssueParams = RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["parameters"];
export type SearchIssueResponse = RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"];

export function getSearchResultPRStatus(pr: SearchIssueResponse["items"][number]): IssueStatus {
	if (pr.pull_request?.merged_at) {
		return IssueStatus.Done;
	} else if (pr.closed_at) {
		return IssueStatus.Closed;
	} else {
		return IssueStatus.Open;
	}
}

export function getPRStatus(pr: PullResponse): IssueStatus {
	if (pr.merged) {
		return IssueStatus.Done;
	} else if (pr.closed_at) {
		return IssueStatus.Closed;
	} else {
		return IssueStatus.Open;
	}
}
