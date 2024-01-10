import type { IssueResponse, PullResponse } from "./response";

import { Cache } from "./cache";
import { api } from "./api";

const cache = new Cache();

export async function getIssue(org: string, repo: string, issue: number, token?: string): Promise<IssueResponse> {
	const cachedValue = cache.getIssue(org, repo, issue);
	if (cachedValue) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.getIssue(org, repo, issue, token);
	cache.setIssue(org, repo, response);
	return response;
}

export async function getPullRequest(
	org: string,
	repo: string,
	pullRequest: number,
	token?: string,
): Promise<PullResponse> {
	const cachedValue = cache.getPullRequest(org, repo, pullRequest);
	if (cachedValue) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.getPullRequest(org, repo, pullRequest, token);
	cache.setPullRequest(org, repo, response);
	return response;
}
