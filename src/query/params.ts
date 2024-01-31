import type { SearchIssueParams, SearchRepoParams } from "src/github/response";

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
	query: string;
}

export type PullRequestParams = Omit<SearchIssueParams, "q"> & BaseParams;
export type IssueParams = Omit<SearchIssueParams, "q"> & BaseParams;
export type RepoParams = Omit<SearchRepoParams, "q"> & BaseParams;

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

export function isPullRequestParams(params: BaseParams): params is PullRequestParams {
	return params.queryType === QueryType.PullRequest;
}
export function isIssueParams(params: BaseParams): params is IssueParams {
	return params.queryType === QueryType.Issue;
}
export function isRepoParams(params: BaseParams): params is RepoParams {
	return params.queryType === QueryType.Repo;
}
export function isTableParams(params: BaseParams): params is TableParams {
	return params.outputType === OutputType.Table;
}
