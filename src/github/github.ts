import type { IssueResponse, PullResponse, SearchIssueResponse, SearchRepoResponse } from "./response";

import { Cache } from "./cache";
import { PluginSettings } from "src/plugin";
import { api } from "./api";

const cache = new Cache();

function getToken(org?: string): string | undefined {
	const account =
		PluginSettings.accounts.find((acc) => acc.orgs.some((savedOrg) => savedOrg === org)) ??
		PluginSettings.accounts.find((acc) => acc.id === PluginSettings.defaultAccount);
	return account?.token;
}

export async function getIssue(org: string, repo: string, issue: number): Promise<IssueResponse> {
	const cachedValue = cache.getIssue(org, repo, issue);
	if (cachedValue) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.getIssue(org, repo, issue, getToken(org));
	cache.setIssue(org, repo, response);
	return response;
}

export async function getPullRequest(org: string, repo: string, pullRequest: number): Promise<PullResponse> {
	const cachedValue = cache.getPullRequest(org, repo, pullRequest);
	if (cachedValue) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.getPullRequest(org, repo, pullRequest, getToken(org));
	cache.setPullRequest(org, repo, response);
	return response;
}

export async function searchIssues(query: string, org?: string): Promise<SearchIssueResponse> {
	const cachedResponse = cache.getIssueQuery(query);
	if (cachedResponse) {
		return Promise.resolve(cachedResponse);
	}

	const response = await api.searchIssues(query, getToken(org));
	cache.setIssueQuery(query, response);
	return response;
}

export async function searchRepos(query: string, org?: string): Promise<SearchRepoResponse> {
	const cachedResponse = cache.getRepoQuery(query);
	if (cachedResponse) {
		return Promise.resolve(cachedResponse);
	}

	const response = await api.searchRepos(query, getToken(org));
	cache.setRepoQuery(query, response);
	return response;
}
