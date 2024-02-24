import type {
	IssueListParams,
	IssueListResponse,
	IssueResponse,
	IssueSearchResponse,
	IssueTimelineResponse,
	PullListParams,
	PullListResponse,
	PullResponse,
	RepoSearchResponse,
	TimelineCrossReferencedEvent,
} from "./response";
import { RequestError, sanitizeObject } from "src/util";
import { api, githubRequest } from "./api";

import { Cache } from "./cache";
import type { GithubAccount } from "src/settings";
import { Logger, PluginSettings } from "src/plugin";

const cache = new Cache();

function getAccount(org?: string): GithubAccount | undefined {
	Logger.debug(`Getting account and token for org ${org}`);
	const account =
		PluginSettings.accounts.find((acc) => acc.orgs.some((savedOrg) => savedOrg === org)) ??
		PluginSettings.accounts.find((acc) => acc.id === PluginSettings.defaultAccount);
	Logger.debug(account);
	return account;
}

function getToken(org?: string, query?: string): string | undefined {
	let _org = org;

	// Try and parse org from the query
	if (!org && query) {
		const match = query.match(/repo:(.+)\//);
		if (match && match[0] !== null) {
			_org = match[1];
		}
	}

	const account = getAccount(_org);
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

export async function getMyIssues(
	params: IssueListParams,
	org?: string,
	skipCache = false,
): Promise<IssueListResponse> {
	const account = getAccount(org);
	if (!account || !account.token) {
		return [];
	}
	const _params = sanitizeObject(params, {
		assignee: false,
		creator: false,
		direction: true,
		labels: true,
		mentioned: false,
		milestone: false,
		page: true,
		per_page: true,
		since: true,
		sort: true,
		state: true,
		filter: true,
		org: false,
		repo: false,
	});
	if (Array.isArray(_params.labels)) {
		_params.labels = _params.labels.join(",");
	}
	const cachedValue = cache.getIssueList(account.name, _params);
	if (cachedValue && !skipCache) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.listIssuesForToken(_params, account.token);
	cache.setIssueList(account.name, _params, response);
	return response;
}

export async function getIssuesForRepo(
	params: IssueListParams,
	org: string,
	repo: string,
	skipCache = false,
): Promise<IssueListResponse> {
	const _params = sanitizeObject(params, {
		assignee: true,
		creator: true,
		direction: true,
		labels: true,
		mentioned: true,
		milestone: true,
		page: true,
		per_page: true,
		since: true,
		sort: true,
		state: true,
		org: false,
		repo: false,
		filter: false,
	});
	if (Array.isArray(_params.labels)) {
		_params.labels = _params.labels.join(",");
	}
	const cachedValue = cache.getIssueListForRepo(org, repo, _params);
	if (cachedValue && !skipCache) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.listIssuesForRepo(org, repo, _params, getToken(org));
	cache.setIssueListForRepo(org, repo, _params, response);
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

export async function getPullRequestsForRepo(
	params: PullListParams,
	org: string,
	repo: string,
	skipCache = false,
): Promise<PullListResponse> {
	const _params = sanitizeObject(params, {
		org: false,
		repo: false,
		base: true,
		direction: true,
		head: true,
		page: true,
		per_page: true,
		sort: true,
		state: true,
	});
	const cachedValue = cache.getPullListForRepo(org, repo, _params);
	if (cachedValue && !skipCache) {
		return Promise.resolve(cachedValue);
	}

	const response = await api.listPullRequestsForRepo(org, repo, _params, getToken(org));
	cache.setPullListForRepo(org, repo, _params, response);
	return response;
}

export async function searchIssues(query: string, org?: string, skipCache = false): Promise<IssueSearchResponse> {
	const cachedResponse = cache.getIssueQuery(query);
	if (cachedResponse && !skipCache) {
		return Promise.resolve(cachedResponse);
	}

	const response = await api.searchIssues(query, getToken(org, query));
	cache.setIssueQuery(query, response);
	return response;
}

export async function searchRepos(query: string, org?: string): Promise<RepoSearchResponse> {
	const cachedResponse = cache.getRepoQuery(query);
	if (cachedResponse) {
		return Promise.resolve(cachedResponse);
	}

	const response = await api.searchRepos(query, getToken(org, query));
	cache.setRepoQuery(query, response);
	return response;
}

export async function getPRForIssue(timelineUrl: string, org?: string): Promise<string | null> {
	let response = cache.getGeneric(timelineUrl) as IssueTimelineResponse | null;
	if (response === null) {
		try {
			response = (await githubRequest({ url: timelineUrl }, getToken(org))).json;
		} catch (err) {
			// 404 means there's no timeline for this, we can ignore the error
			if (err instanceof RequestError && err.status === 404) {
				return null;
			} else {
				throw err;
			}
		}
	}
	if (!response) {
		return null;
	}
	cache.setGeneric(timelineUrl, response);
	// TODO: Figure out a better/more reliable way to do this.
	const crossRefEvent = response.find((_evt) => {
		const evt = _evt as Partial<TimelineCrossReferencedEvent>;
		return evt.event === "cross-referenced" && evt.source?.issue?.pull_request?.html_url;
	}) as TimelineCrossReferencedEvent | undefined;
	return crossRefEvent?.source.issue?.pull_request?.html_url ?? null;
}
