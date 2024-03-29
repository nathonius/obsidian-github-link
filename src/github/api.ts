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
} from "./response";
import type { RequestUrlParam, RequestUrlResponse } from "obsidian";

import { RequestError, isSuccessResponse, promiseWithResolvers } from "src/util";
import { Notice, requestUrl } from "obsidian";
import { PluginSettings, getCache, logger } from "src/plugin";
import Queue from "queue";

const baseApi = "https://api.github.com";
let rateLimitReset: Date | null = null;
const q = new Queue({ autostart: true, concurrency: 1 });

export function addParams(href: string, params: Record<string, unknown>): string {
	const url = new URL(href);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, `${value}`);
	}
	return url.toString();
}

export async function queueRequest(config: RequestUrlParam, token?: string): Promise<RequestUrlResponse> {
	// Responses we (probably) have cached will skip the queue
	if (getCache().get(config)) {
		return githubRequest(config, token);
	}

	const { resolve, promise } = promiseWithResolvers<RequestUrlResponse>();
	q.push(() => {
		return githubRequest(config, token).then((result) => {
			resolve(result);
		});
	});
	return promise;
}

async function githubRequest(config: RequestUrlParam, token?: string, skipCache = false): Promise<RequestUrlResponse> {
	if (rateLimitReset !== null && rateLimitReset > new Date()) {
		logger.warn(
			`GitHub rate limit exceeded. No more requests will be made until ${rateLimitReset.toLocaleTimeString()}`,
		);
		throw new Error("GitHub rate limit exceeded.");
	} else if (rateLimitReset !== null) {
		// Rate limit wait has passed, we can make requests again.
		rateLimitReset = null;
	}

	if (!config.headers) {
		config.headers = {};
	}
	config.headers.Accept = "application/vnd.github+json";
	config.headers["X-GitHub-Api-Version"] = "2022-11-28";
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	// Check request cache first
	const cachedValue = getCache().get(config);

	// Return the cached value if it was recent enough
	const minCacheAge = new Date(new Date().getTime() - PluginSettings.minRequestSeconds * 1000);
	if (!skipCache && cachedValue?.retrieved && cachedValue.retrieved > minCacheAge) {
		logger.debug(`Request was too recent. Returning cached value for: ${config.url}`);
		logger.debug(cachedValue.response);
		return cachedValue.response;
	}

	// Check for cache headers
	if (cachedValue?.etag) {
		config.headers["if-none-match"] = cachedValue.etag;
	}
	if (cachedValue?.lastModified) {
		config.headers["if-modified-since"] = cachedValue.lastModified;
	}

	try {
		logger.debug(`Request: ${config.url}`);
		logger.debug(config);
		const response = await requestUrl(config);
		logger.debug(`Response (${config.url}):`);
		logger.debug(response);

		// Check for 304 response, return cached value
		if (cachedValue?.response && response.status === 304) {
			getCache().update(config);
			return cachedValue.response;
		} else if (isSuccessResponse(response.status)) {
			await getCache().set(config, response);
		}
		// Handle rate limit
		const retryAfterSeconds = parseInt(response.headers["retry-after"]);
		const rateLimitRemaining = parseInt(response.headers["x-ratelimit-remaining"]);
		const rateLimitResetSeconds = parseInt(response.headers["x-ratelimit-reset"]);
		if (!isNaN(retryAfterSeconds)) {
			logger.warn(`Got retry-after header with value ${retryAfterSeconds}`);
			await sleep(retryAfterSeconds * 1000);
			return githubRequest(config, token);
		} else if (!isNaN(rateLimitRemaining) && rateLimitRemaining === 0 && !isNaN(rateLimitResetSeconds)) {
			rateLimitReset = new Date(rateLimitResetSeconds * 1000);
			let message = `GitHub rate limit exceeded. No more requests will be made until after ${rateLimitReset.toLocaleTimeString()}`;
			if (!token) {
				message += " Consider adding an authentication token for a significantly higher rate limit.";
			}
			new Notice(message);
		} else if (!isNaN(rateLimitRemaining) && rateLimitRemaining <= 5) {
			logger.warn("GitHub rate limit approaching.");
		}

		return response;
	} catch (err) {
		throw new RequestError(err as Error);
	}
}

async function getIssue(org: string, repo: string, issue: number, token?: string): Promise<IssueResponse> {
	const result = await queueRequest({ url: `${baseApi}/repos/${org}/${repo}/issues/${issue}` }, token);

	return result.json as IssueResponse;
}

async function listIssuesForToken(params: IssueListParams, token: string): Promise<IssueListResponse> {
	const url = addParams(`${baseApi}/issues`, params as Record<string, unknown>);
	const result = await queueRequest({ url }, token);
	return result.json as IssueListResponse;
}

async function listIssuesForRepo(
	org: string,
	repo: string,
	params: IssueListParams = {},
	token?: string,
): Promise<IssueListResponse> {
	const url = addParams(`${baseApi}/repos/${org}/${repo}/issues`, params as Record<string, unknown>);
	const result = await queueRequest({ url }, token);
	return result.json as IssueListResponse;
}

async function getPullRequest(org: string, repo: string, pr: number, token?: string): Promise<PullResponse> {
	const result = await queueRequest(
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
	const result = await queueRequest({ url }, token);
	return result.json as PullListResponse;
}

async function getCode(org: string, repo: string, path: string, branch: string, token?: string): Promise<CodeResponse> {
	const result = await queueRequest(
		{
			url: `${baseApi}/repos/${org}/${repo}/contents/${path}?ref=${branch}`,
		},
		token,
	);
	return result.json as CodeResponse;
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
};
