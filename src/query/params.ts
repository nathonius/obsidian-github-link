import type { ListIssueParams, ListPullParams, SearchIssueParams, SearchRepoParams } from "src/github/response";

import { parseYaml } from "obsidian";

export enum OutputType {
	Table = "table",
}

export enum QueryType {
	PullRequest = "pull-request",
	Issue = "issue",
	Repo = "repo",
}

export interface BaseParams {
	outputType: OutputType;
	queryType: QueryType;
}

export type PullRequestListParams = ListPullParams & BaseParams;
export type IssueListParams = ListIssueParams & BaseParams;
export type PullRequestSearchParams = Omit<SearchIssueParams, "q"> & BaseParams & { query: string };
export type IssueSearchParams = Omit<SearchIssueParams, "q"> & BaseParams & { query: string };
export type RepoSearchParams = Omit<SearchRepoParams, "q"> & BaseParams & { query: string };

export type TableParams = { columns: string[] } & BaseParams;

export function processParams(source: string): BaseParams | null {
	let params: BaseParams;
	try {
		params = parseYaml(source);
	} catch (e) {
		console.error(`Github Link: YAML Parsing failed, attempting simplistic parsing\n${e}`);
		params = Object.fromEntries(source.split("\n").map((l) => l.split(/:\s?/)));
	}

	return params ?? null;
}

export function isSearchParams(
	params: BaseParams,
): params is PullRequestSearchParams | IssueSearchParams | RepoSearchParams {
	return Boolean((params as IssueSearchParams).query);
}
export function isPullRequestListParams(params: BaseParams): params is PullRequestListParams {
	return params.queryType === QueryType.PullRequest && !isPullRequestSearchParams(params);
}
export function isPullRequestSearchParams(params: BaseParams): params is PullRequestSearchParams {
	return params.queryType === QueryType.PullRequest && Boolean((params as PullRequestSearchParams)?.query);
}
export function isIssueListParams(params: BaseParams): params is IssueListParams {
	return params.queryType === QueryType.Issue && !isIssueSearchParams(params);
}
export function isIssueSearchParams(params: BaseParams): params is IssueSearchParams {
	return params.queryType === QueryType.Issue && Boolean((params as IssueSearchParams)?.query);
}
export function isRepoSearchParams(params: BaseParams): params is RepoSearchParams {
	return params.queryType === QueryType.Repo && Boolean((params as RepoSearchParams)?.query);
}
export function isTableParams(params: BaseParams): params is TableParams {
	return params.outputType === OutputType.Table;
}
