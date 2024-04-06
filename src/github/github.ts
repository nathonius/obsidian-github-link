import type {
	CheckRunListResponse,
	IssueListParams,
	IssueListResponse,
	IssueResponse,
	IssueSearchParams,
	IssueSearchResponse,
	IssueTimelineResponse,
	PullListParams,
	PullListResponse,
	PullResponse,
	TimelineCrossReferencedEvent,
} from "./response";
import type { RemoveIndexSignature } from "src/util";
import { RequestError, sanitizeObject } from "src/util";
import { GitHubApi } from "./api";

import { OldCache } from "./cache";
import type { GithubAccount } from "src/settings";
import { PluginSettings } from "src/plugin";

const cache = new OldCache();
const tokenMatchRegex = /repo:(.+)\//;
const api = new GitHubApi();

function getAccount(org?: string): GithubAccount | undefined {
	const account =
		PluginSettings.accounts.find((acc) => acc.orgs.some((savedOrg) => savedOrg === org)) ??
		PluginSettings.accounts.find((acc) => acc.id === PluginSettings.defaultAccount);
	return account;
}

function getToken(org?: string, query?: string): string | undefined {
	let _org = org;

	// Try and parse org from the query
	if (!org && query) {
		const match = tokenMatchRegex.exec(query);
		if (match?.[0] !== null) {
			_org = match?.[1];
		}
	}

	const account = getAccount(_org);
	return account?.token;
}

export function getIssue(org: string, repo: string, issue: number): Promise<IssueResponse> {
	return api.getIssue(org, repo, issue, getToken(org));
}

export function getMyIssues(params: IssueListParams, org?: string, skipCache = false): Promise<IssueListResponse> {
	const account = getAccount(org);
	if (!account?.token) {
		return Promise.resolve([]);
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

	setPageSize(_params);

	if (Array.isArray(_params.labels)) {
		_params.labels = _params.labels.join(",");
	}

	return api.listIssuesForToken(_params, account.token);
}

export function getIssuesForRepo(
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

	setPageSize(_params);

	if (Array.isArray(_params.labels)) {
		_params.labels = _params.labels.join(",");
	}

	return api.listIssuesForRepo(org, repo, _params, getToken(org));
}

export function getPullRequest(org: string, repo: string, pullRequest: number): Promise<PullResponse> {
	return api.getPullRequest(org, repo, pullRequest, getToken(org));
}

export function getPullRequestsForRepo(params: PullListParams, org: string, repo: string): Promise<PullListResponse> {
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

	setPageSize(_params);
	return api.listPullRequestsForRepo(org, repo, _params, getToken(org));
}

export function listCheckRunsForRef(org: string, repo: string, ref: string): Promise<CheckRunListResponse> {
	return api.listCheckRunsForRef(org, repo, ref, getToken(org));
}

export async function searchIssues(
	params: RemoveIndexSignature<IssueSearchParams>,
	query: string,
	org?: string,
	skipCache = false,
): Promise<IssueSearchResponse> {
	const _params = sanitizeObject(params, {
		q: false,
		baseUrl: false,
		headers: false,
		mediaType: false,
		order: true,
		page: true,
		per_page: true,
		request: false,
		sort: true,
	});

	setPageSize(_params);
	_params.q = query;

	const cachedResponse = cache.getIssueQuery(query);
	if (cachedResponse && !skipCache) {
		return Promise.resolve(cachedResponse);
	}

	const response = await api.searchIssues(_params, getToken(org, query));
	cache.setIssueQuery(query, response);
	return response;
}

export async function getPRForIssue(timelineUrl: string, org?: string): Promise<string | null> {
	let response: IssueTimelineResponse | null = null;
	try {
		response = (await api.queueRequest({ url: timelineUrl }, getToken(org))).json;
	} catch (err) {
		// 404 means there's no timeline for this, we can ignore the error
		if (err instanceof RequestError && err.status === 404) {
			return null;
		} else {
			throw err;
		}
	}
	if (!response) {
		return null;
	}

	// TODO: Figure out a better/more reliable way to do this.
	const crossRefEvent = response.find((_evt) => {
		const evt = _evt as Partial<TimelineCrossReferencedEvent>;
		return evt.event === "cross-referenced" && evt.source?.issue?.pull_request?.html_url;
	}) as TimelineCrossReferencedEvent | undefined;
	return crossRefEvent?.source.issue?.pull_request?.html_url ?? null;
}

function setPageSize(params: { per_page?: number }): void {
	params.per_page = params.per_page ?? PluginSettings.defaultPageSize;
}
