import type {
	CheckRunListResponse,
	CodeResponse,
	IssueListParams,
	IssueListResponse,
	IssueResponse,
	IssueSearchParams,
	IssueSearchResponse,
	LinkMeta,
	MaybePaginated,
	PaginationMeta,
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

	public queueRequest(config: RequestUrlParam, token?: string): Promise<MaybePaginated<RequestUrlResponse>> {
		// Responses we (probably) have cached will skip the queue
		if (getCache().get(config)) {
			return this.githubRequest(config, token);
		}

		const { resolve, reject, promise } = promiseWithResolvers<MaybePaginated<RequestUrlResponse>>();
		GitHubApi.q.push(() => {
			return this.githubRequest(config, token)
				.then((response) => {
					resolve(response);
				})
				.catch((err) => {
					reject(err);
				});
		});
		return promise;
	}

	public getPaginationMeta(response: RequestUrlResponse): MaybePaginated<RequestUrlResponse> {
		const meta = this.parseLinkHeader(response.headers["link"]);
		return { meta, response };
	}

	public parseLinkHeader(link: string | undefined): PaginationMeta {
		logger.debug(`Parsing link header: ${link}`);
		const paginationMeta: PaginationMeta = {};
		if (!link) {
			return paginationMeta;
		}
		const linkRelPattern = /<(?<url>http[^\s?]+)\?(?<qp>[^\s>]*)>;\s*rel="(?<rel>[^\s"]*)"/g;
		let match: RegExpExecArray | null = null;
		do {
			match = linkRelPattern.exec(link);
			logger.debug(match);
			if (match && match.groups) {
				const params = new URLSearchParams(match.groups.qp);
				const page = parseInt(params.get("page") ?? "");
				const per_page = parseInt(params.get("per_page") ?? "");
				if (isNaN(page) || isNaN(per_page)) {
					continue;
				}
				const linkMeta: LinkMeta = {
					url: match.groups.url,
					page,
					per_page,
				};
				paginationMeta[match.groups.rel as keyof PaginationMeta] = linkMeta;
			}
		} while (match);
		logger.debug(paginationMeta);
		return paginationMeta;
	}

	public async getIssue(org: string, repo: string, issue: number, token?: string): Promise<IssueResponse> {
		const { response } = await this.queueRequest(
			{ url: `${GitHubApi.baseApi}/repos/${org}/${repo}/issues/${issue}` },
			token,
		);

		return response.json as IssueResponse;
	}

	public async listIssuesForToken(params: IssueListParams, token: string): Promise<MaybePaginated<IssueListResponse>> {
		const url = this.addParams(`${GitHubApi.baseApi}/issues`, params as Record<string, unknown>);
		const { meta, response } = await this.queueRequest({ url }, token);
		return { meta, response: response.json as IssueListResponse };
	}

	public async listIssuesForRepo(
		org: string,
		repo: string,
		params: IssueListParams = {},
		token?: string,
	): Promise<MaybePaginated<IssueListResponse>> {
		const url = this.addParams(`${GitHubApi.baseApi}/repos/${org}/${repo}/issues`, params as Record<string, unknown>);
		const { meta, response } = await this.queueRequest({ url }, token);
		return { meta, response: response.json as IssueListResponse };
	}

	public async getPullRequest(org: string, repo: string, pr: number, token?: string): Promise<PullResponse> {
		const { response } = await this.queueRequest(
			{
				url: `${GitHubApi.baseApi}/repos/${org}/${repo}/pulls/${pr}`,
			},
			token,
		);
		return response.json as PullResponse;
	}

	public async listPullRequestsForRepo(
		org: string,
		repo: string,
		params: PullListParams = {},
		token?: string,
	): Promise<MaybePaginated<PullListResponse>> {
		const url = this.addParams(`${GitHubApi.baseApi}/repos/${org}/${repo}/pulls`, params as Record<string, unknown>);
		const { meta, response } = await this.queueRequest({ url }, token);
		return { meta, response: response.json as PullListResponse };
	}

	public async getCode(org: string, repo: string, path: string, branch: string, token?: string): Promise<CodeResponse> {
		const { response } = await this.queueRequest(
			{
				url: `${GitHubApi.baseApi}/repos/${org}/${repo}/contents/${path}?ref=${branch}`,
			},
			token,
		);
		return response.json as CodeResponse;
	}

	public async searchIssues(params: IssueSearchParams, token?: string): Promise<MaybePaginated<IssueSearchResponse>> {
		const url = this.addParams(`${GitHubApi.baseApi}/search/issues`, params);
		const { meta, response } = await this.githubRequest({ url }, token);
		return { meta, response: response.json as IssueSearchResponse };
	}

	public async listCheckRunsForRef(
		org: string,
		repo: string,
		ref: string,
		token?: string,
	): Promise<CheckRunListResponse> {
		const { response } = await this.githubRequest(
			{ url: `${GitHubApi.baseApi}/${org}/${repo}/commits/${ref}/check-runs` },
			token,
		);
		return response.json as CheckRunListResponse;
	}

	private async githubRequest(
		_config: RequestUrlParam,
		token?: string,
		skipCache = false,
	): Promise<MaybePaginated<RequestUrlResponse>> {
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
			return this.getPaginationMeta(cachedValue!.response);
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
				return this.getPaginationMeta(cachedValue.response);
			} else if (isSuccessResponse(response.status)) {
				getCache().set(config, response);
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

			return this.getPaginationMeta(response);
		} catch (err) {
			logger.debug(err);
			return Promise.reject(new RequestError(err as Error));
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
