import type { IssueResponse, PullResponse } from "./response";

import { Cache } from "./cache";
import { api } from "./api";
import { PluginSettings } from "src/plugin";

const cache = new Cache();

function getToken(org: string): string | undefined {
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
