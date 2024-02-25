import type {
	CodeResponse,
	IssueListParams,
	IssueListResponse,
	IssueResponse,
	IssueSearchParams,
	IssueSearchResponse,
	PullListParams,
	PullListResponse,
	PullResponse,
	RepoSearchResponse,
} from "./response";
import type { RequestUrlParam, RequestUrlResponse } from "obsidian";

import { Logger } from "src/plugin";
import { RequestError } from "src/util";
import { requestUrl } from "obsidian";

const baseApi = "https://api.github.com";

export function addParams(href: string, params: Record<string, unknown>): string {
	const url = new URL(href);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, `${value}`);
	}
	return url.toString();
}

export async function githubRequest(config: RequestUrlParam, token?: string): Promise<RequestUrlResponse> {
	if (!config.headers) {
		config.headers = {};
	}
	config.headers.Accept = "application/vnd.github+json";
	config.headers["X-GitHub-Api-Version"] = "2022-11-28";
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	Logger.debug(config);
	try {
		const response = await requestUrl(config);
		Logger.debug(response);
		return response;
	} catch (err) {
		throw new RequestError(err as Error);
	}
}

async function getIssue(org: string, repo: string, issue: number, token?: string): Promise<IssueResponse> {
	const result = await githubRequest({ url: `${baseApi}/repos/${org}/${repo}/issues/${issue}` }, token);

	return result.json as IssueResponse;
}

async function listIssuesForToken(params: IssueListParams = {}, token: string): Promise<IssueListResponse> {
	const url = addParams(`${baseApi}/issues`, params as Record<string, unknown>);
	const result = await githubRequest({ url }, token);
	return result.json as IssueListResponse;
}

async function listIssuesForRepo(
	org: string,
	repo: string,
	params: IssueListParams = {},
	token?: string,
): Promise<IssueListResponse> {
	const url = addParams(`${baseApi}/repos/${org}/${repo}/issues`, params as Record<string, unknown>);
	const result = await githubRequest({ url }, token);
	return result.json as IssueListResponse;
}

async function getPullRequest(org: string, repo: string, pr: number, token?: string): Promise<PullResponse> {
	const result = await githubRequest(
		{
			url: `${baseApi}/repos/${org}/${repo}/pulls/${pr}`,
		},
		token,
	);
	return result.json as PullResponse;
}

async function listPullRequestsForRepo(
	org: string,
	repo: string,
	params: PullListParams = {},
	token?: string,
): Promise<PullListResponse> {
	const url = addParams(`${baseApi}/repos/${org}/${repo}/pulls`, params as Record<string, unknown>);
	const result = await githubRequest({ url }, token);
	return result.json as PullListResponse;
}

async function getCode(org: string, repo: string, path: string, branch: string, token?: string): Promise<CodeResponse> {
	const result = await githubRequest(
		{
			url: `${baseApi}/repos/${org}/${repo}/contents/${path}?ref=${branch}`,
		},
		token,
	);
	return result.json as CodeResponse;
}

async function searchRepos(query: string, token?: string): Promise<RepoSearchResponse> {
	const result = await githubRequest({ url: `${baseApi}/search/repositories?q=${encodeURIComponent(query)}` }, token);
	return result.json as RepoSearchResponse;
}

async function searchIssues(params: IssueSearchParams, token?: string): Promise<IssueSearchResponse> {
	const url = addParams(`${baseApi}/search/issues`, params);
	const result = await githubRequest({ url }, token);
	return result.json as IssueSearchResponse;
}

export const api = {
	getIssue,
	listIssuesForToken,
	listIssuesForRepo,
	getPullRequest,
	listPullRequestsForRepo,
	getCode,
	searchIssues,
	searchRepos,
};
