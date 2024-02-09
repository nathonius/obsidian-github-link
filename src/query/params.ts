import type { IssueListParams, PullListParams } from "src/github/response";

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
	columns: string[];
}

export type TableQueryParams<T> = Omit<T, "q"> & BaseParams & { query: string };
export type TableParams<T extends IssueListParams | PullListParams> = T & BaseParams;

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

export function isTableQueryParams<T>(params: BaseParams): params is TableQueryParams<T> {
	return params.outputType === OutputType.Table && Boolean((params as TableQueryParams<T>).query);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTableParams(params: BaseParams): params is TableParams<any> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return params.outputType === OutputType.Table && !(params as TableQueryParams<any>).query;
}
