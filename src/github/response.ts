import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import type * as OpenAPI from "@octokit/openapi-types";

export enum IssueStatus {
	Open = "open",
	Closed = "closed",
	Done = "done",
}

// Response Types
export type IssueResponse = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
export type IssueListResponse = RestEndpointMethodTypes["issues"]["list"]["response"]["data"];
export type PullResponse = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
export type PullListResponse = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
export type CodeResponse = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
export type SearchRepoResponse = RestEndpointMethodTypes["search"]["repos"]["response"]["data"];
export type SearchIssueResponse = RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"];
export type TimelineCrossReferencedEvent = OpenAPI.components["schemas"]["timeline-cross-referenced-event"];

// Param Types
export type SearchRepoParams = RestEndpointMethodTypes["search"]["repos"]["parameters"];
export type ListIssueParams = RestEndpointMethodTypes["issues"]["list"]["parameters"];
export type ListPullParams = RestEndpointMethodTypes["pulls"]["list"]["parameters"];
export type SearchIssueParams = RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["parameters"];
export type IssueTimelineResponse = RestEndpointMethodTypes["issues"]["listEventsForTimeline"]["response"]["data"];

export function getSearchResultIssueStatus(issue: SearchIssueResponse["items"][number]): IssueStatus {
	if (issue.pull_request?.merged_at || issue.state_reason === "completed") {
		return IssueStatus.Done;
	} else if (issue.closed_at || issue.state === "closed") {
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
