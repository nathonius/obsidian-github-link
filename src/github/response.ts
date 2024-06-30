import type * as OpenAPI from "@octokit/openapi-types";

import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export enum IssueStatus {
	Open = "open",
	Closed = "closed",
	Done = "done",
}

export interface PaginationParams {
	per_page?: number;
	page?: number;
}

export interface LinkMeta {
	url: string;
	page: number;
	per_page: number;
}

export interface PaginationMeta {
	first?: LinkMeta;
	prev?: LinkMeta;
	next?: LinkMeta;
	last?: LinkMeta;
}

export interface MaybePaginated<T> {
	meta: PaginationMeta;
	response: T;
}

// Response Types
export type IssueResponse = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
export type IssueListResponse = RestEndpointMethodTypes["issues"]["list"]["response"]["data"];
export type IssueSearchResponse = RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"];
export type PullResponse = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
export type PullListResponse = RestEndpointMethodTypes["pulls"]["list"]["response"]["data"];
export type CodeResponse = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
export type RepoSearchResponse = RestEndpointMethodTypes["search"]["repos"]["response"]["data"];
export type TimelineCrossReferencedEvent = OpenAPI.components["schemas"]["timeline-cross-referenced-event"];
export type IssueTimelineResponse = RestEndpointMethodTypes["issues"]["listEventsForTimeline"]["response"]["data"];
export type CheckRunListResponse = RestEndpointMethodTypes["checks"]["listForRef"]["response"]["data"];

export type UserResponse = IssueListResponse[number]["user"];

// Param Types
export type RepoSearchParams = RestEndpointMethodTypes["search"]["repos"]["parameters"];
export type IssueListParams = PaginationParams & {
	repo?: string;
	org?: string;
	milestone?: string;
	state?: "open" | "closed" | "all";
	assignee?: "none" | "*" | string;
	creator?: string;
	mentioned?: string;
	labels?: string | string[];
	sort?: "created" | "updated" | "comments";
	direction?: "asc" | "desc";
	since?: string;
	filter?: "assigned" | "created" | "mentioned" | "subscribed" | "repos" | "all";
};
export type PullListParams = PaginationParams & {
	repo?: string;
	org?: string;
	state?: "open" | "closed" | "all";
	head?: string;
	base?: string;
	sort?: "created" | "updated" | "popularity" | "long-running";
	direction?: "asc" | "desc";
};
export type IssueSearchParams = RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["parameters"];

export function getSearchResultIssueStatus(
	issue: Pick<IssueSearchResponse["items"][number], "state" | "state_reason" | "pull_request" | "closed_at">,
): IssueStatus {
	if (issue.pull_request?.merged_at || issue.state_reason === "completed") {
		return IssueStatus.Done;
	} else if (issue.closed_at || issue.state === "closed") {
		return IssueStatus.Closed;
	} else {
		return IssueStatus.Open;
	}
}

export function getIssueStatus(issue: IssueResponse): IssueStatus {
	if (issue.state === "open") {
		return IssueStatus.Open;
	} else if (issue.state_reason === "completed") {
		return IssueStatus.Done;
	} else {
		return IssueStatus.Closed;
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
