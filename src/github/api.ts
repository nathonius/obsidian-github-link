import type { CodeResponse, IssueResponse, PullResponse } from "./response";

import type { RequestUrlParam } from "obsidian";
import { requestUrl } from "obsidian";

const baseApi = "https://api.github.com";

async function githubRequest(config: RequestUrlParam, token?: string) {
	if (!config.headers) {
		config.headers = {};
	}
	config.headers.Accept = "application/vnd.github+json";
	config.headers["X-GitHub-Api-Version"] = "2022-11-28";
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	try {
		const response = await requestUrl(config);
		return response;
	} catch (err) {
		console.error(err);
		throw err;
	}
}

async function getIssue(org: string, repo: string, issue: number, token?: string): Promise<IssueResponse> {
	const result = await githubRequest({ url: `${baseApi}/repos/${org}/${repo}/issues/${issue}` }, token);
	return result.json as IssueResponse;
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

async function getCode(org: string, repo: string, path: string, branch: string, token?: string): Promise<CodeResponse> {
	const result = await githubRequest(
		{
			url: `${baseApi}/repos/${org}/${repo}/contents/${path}?ref=${branch}`,
		},
		token,
	);
	return result.json as CodeResponse;
}

export const api = {
	getIssue,
	getPullRequest,
	getCode,
};
