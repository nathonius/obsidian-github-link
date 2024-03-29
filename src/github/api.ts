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
import type { CacheEntry } from "./cache";

type RequestConfig = RequestUrlParam & { headers: Record<string, string> };

export class GitHubApi {
	private static readonly baseApi = "https://api.github.com";
	private static rateLimitReset: Date | null = null;
	private static q = new Queue({ autostart: true, concurrency: 1 });

	public async queueRequest(config: RequestUrlParam, token?: string): Promise<RequestUrlResponse> {
		// Responses we (probably) have cached will skip the queue
		if (getCache().get(config)) {
			return this.githubRequest(config, token);
		}

		const { resolve, promise } = promiseWithResolvers<RequestUrlResponse>();
		GitHubApi.q.push(() => {
			return this.githubRequest(config, token).then((result) => {
				resolve(result);
			});
		});
		return promise;
	}

	public async getIssue(org: string, repo: string, issue: number, token?: string): Promise<IssueResponse> {
		const result = await this.queueRequest({ url: `${GitHubApi.baseApi}/repos/${org}/${repo}/issues/${issue}` }, token);

		return result.json as IssueResponse;
	}

	public async listIssuesForToken(params: IssueListParams, token: string): Promise<IssueListResponse> {
		const url = this.addParams(`${GitHubApi.baseApi}/issues`, params as Record<string, unknown>);
		const result = await this.queueRequest({ url }, token);
		return result.json as IssueListResponse;
	}

	public async listIssuesForRepo(
		org: string,
		repo: string,
		params: IssueListParams = {},
		token?: string,
	): Promise<IssueListResponse> {
		const url = this.addParams(`${GitHubApi.baseApi}/repos/${org}/${repo}/issues`, params as Record<string, unknown>);
		const result = await this.queueRequest({ url }, token);
		return result.json as IssueListResponse;
	}

	public async getPullRequest(org: string, repo: string, pr: number, token?: string): Promise<PullResponse> {
		const result = await this.queueRequest(
			{
				url: `${GitHubApi.baseApi}/repos/${org}/${repo}/pulls/${pr}`,
			},
			token,
		);
		return result.json as PullResponse;
	}

	public async listPullRequestsForRepo(
		org: string,
		repo: string,
		params: PullListParams = {},
		token?: string,
	): Promise<PullListResponse> {
		const url = this.addParams(`${GitHubApi.baseApi}/repos/${org}/${repo}/pulls`, params as Record<string, unknown>);
		const result = await this.queueRequest({ url }, token);
		return result.json as PullListResponse;
	}

	public async getCode(org: string, repo: string, path: string, branch: string, token?: string): Promise<CodeResponse> {
		const result = await this.queueRequest(
			{
				url: `${GitHubApi.baseApi}/repos/${org}/${repo}/contents/${path}?ref=${branch}`,
			},
			token,
		);
		return result.json as CodeResponse;
	}

	public async searchIssues(params: IssueSearchParams, token?: string): Promise<IssueSearchResponse> {
		const url = this.addParams(`${GitHubApi.baseApi}/search/issues`, params);
		const result = await this.githubRequest({ url }, token);
		return result.json as IssueSearchResponse;
	}

	private async githubRequest(
		_config: RequestUrlParam,
		token?: string,
		skipCache = false,
	): Promise<RequestUrlResponse> {
		if (GitHubApi.rateLimitReset !== null && GitHubApi.rateLimitReset > new Date()) {
			logger.warn(
				`GitHub rate limit exceeded. No more requests will be made until ${GitHubApi.rateLimitReset.toLocaleTimeString()}`,
			);
			throw new Error("GitHub rate limit exceeded.");
		} else if (GitHubApi.rateLimitReset !== null) {
			// Rate limit wait has passed, we can make requests again.
			GitHubApi.rateLimitReset = null;
		}

		const config = this.initHeaders(_config, token);

		// Check request cache first
		const cachedValue = getCache().get(config);
		if (this.cachedRequestIsRecent(cachedValue, skipCache)) {
			logger.debug(`Request was too recent. Returning cached value for: ${cachedValue?.request.url}`);
			logger.debug(cachedValue?.response);
			return cachedValue!.response;
		}

		this.setCacheHeaders(config, cachedValue);

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
				return this.githubRequest(config, token);
			} else if (!isNaN(rateLimitRemaining) && rateLimitRemaining === 0 && !isNaN(rateLimitResetSeconds)) {
				GitHubApi.rateLimitReset = new Date(rateLimitResetSeconds * 1000);
				let message = `GitHub rate limit exceeded. No more requests will be made until after ${GitHubApi.rateLimitReset.toLocaleTimeString()}`;
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

	/**
	 * Ensure headers object is initialized and common headers are added
	 */
	private initHeaders(config: RequestUrlParam, token?: string): RequestConfig {
		if (!config.headers) {
			config.headers = {};
		}
		config.headers.Accept = "application/vnd.github+json";
		config.headers["X-GitHub-Api-Version"] = "2022-11-28";
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config as RequestConfig;
	}

	/**
	 * Add available cache headers
	 */
	private setCacheHeaders(config: RequestConfig, cachedValue: CacheEntry | null): void {
		// Check for cache headers
		if (cachedValue?.etag) {
			config.headers["if-none-match"] = cachedValue.etag;
		}
		if (cachedValue?.lastModified) {
			config.headers["if-modified-since"] = cachedValue.lastModified;
		}
	}

	private addParams(href: string, params: Record<string, unknown>): string {
		const url = new URL(href);
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, `${value}`);
		}
		return url.toString();
	}

	/**
	 * Returns true if we can skip calling the API due to request age
	 */
	private cachedRequestIsRecent(cachedValue: CacheEntry | null, skipCache: boolean): boolean {
		if (skipCache || !cachedValue) {
			return false;
		}
		// Return the cached value if it was recent enough
		const minCacheAge = new Date(new Date().getTime() - PluginSettings.minRequestSeconds * 1000);
		return cachedValue.retrieved > minCacheAge;
	}
}
