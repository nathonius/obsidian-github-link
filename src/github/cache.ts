import type { RequestUrlParam, RequestUrlResponse } from "obsidian";
import type {
	IssueListParams,
	IssueListResponse,
	IssueResponse,
	IssueSearchResponse,
	PullListParams,
	PullListResponse,
	PullResponse,
	RepoSearchResponse,
} from "./response";
import { logger } from "src/plugin";
import { isSuccessResponse } from "src/util";

interface CacheParams {
	request: RequestUrlParam;
	response: RequestUrlResponse;
	retrieved: number;
	etag: string | null;
	lastModified: string | null;
}

export class CacheEntry {
	constructor(
		public readonly request: RequestUrlParam,
		public readonly response: RequestUrlResponse,
		public retrieved: Date,
		public readonly etag: string | null,
		public readonly lastModified: string | null,
	) {}

	public static fromJSON(json: string): CacheEntry | null {
		let result: CacheEntry | null = null;
		try {
			const parsed = JSON.parse(json) as CacheParams;
			result = new CacheEntry(
				parsed.request,
				parsed.response,
				new Date(parsed.retrieved),
				parsed.etag,
				parsed.lastModified,
			);
		} catch (err) {
			logger.error("Failure reconstructing cache!");
			logger.error(err);
		}
		return result;
	}

	public toJSON(): string {
		const params: CacheParams = {
			request: this.request,
			response: this.response,
			retrieved: this.retrieved.getTime(),
			etag: this.etag,
			lastModified: this.lastModified,
		};
		return JSON.stringify(params);
	}
}

/**
 * Cache of responses to simple, non-search requests
 */
export class RequestCache {
	public cacheUpdated = false;
	private readonly entries: Record<string, CacheEntry> = {};

	constructor(storedCache: string[] | null) {
		if (storedCache) {
			try {
				for (const entryString of storedCache) {
					const entry = CacheEntry.fromJSON(entryString);
					if (!entry) {
						return;
					}
					this.entries[this.getCacheKey(entry.request)] = entry;
				}
			} catch (err) {
				logger.warn("Could not read stored cache data, cache will be cleared.");
				logger.warn(err);
			}
		}
	}

	public get(request: RequestUrlParam): CacheEntry | null {
		return this.entries[this.getCacheKey(request)] ?? null;
	}

	public set(request: RequestUrlParam, response: RequestUrlResponse): void {
		// Don't store bad responses
		if (!isSuccessResponse(response.status)) {
			logger.warn(`Attempted to cache a non-successful request: ${request.url}`);
			return;
		}

		const etag = response.headers.etag ?? null;
		const lastModified = response.headers["last-modified"] ?? null;

		// Slim down the data we store
		const _request: Partial<RequestUrlParam> = { url: request.url, body: request.body };
		const _response: Partial<RequestUrlResponse> = { json: response.json, status: response.status };

		const entry = new CacheEntry(
			_request as RequestUrlParam,
			_response as RequestUrlResponse,
			new Date(),
			etag,
			lastModified,
		);
		this.entries[this.getCacheKey(request)] = entry;
		this.cacheUpdated = true;
	}

	public remove(request: RequestUrlParam | string): void {
		if (typeof request === "string") {
			delete this.entries[request];
		} else {
			delete this.entries[this.getCacheKey(request)];
		}
		this.cacheUpdated = true;
	}

	public clean(maxAge: Date): number {
		let entriesDeleted = 0;
		for (const [k, v] of Object.entries(this.entries)) {
			if (v.retrieved < maxAge) {
				delete this.entries[k];
				entriesDeleted += 1;
			}
		}
		return entriesDeleted;
	}

	public update(request: RequestUrlParam | string): void {
		let entry: CacheEntry | null = null;
		if (typeof request === "string") {
			entry = this.entries[request];
		} else {
			entry = this.entries[this.getCacheKey(request)];
		}
		if (entry) {
			entry.retrieved = new Date();
		}
		this.cacheUpdated = true;
	}

	public toJSON(): string[] {
		return Object.values(this.entries).map((e) => e.toJSON());
	}

	private getCacheKey(request: RequestUrlParam): string {
		return request.url;
	}
}

class OldCacheEntry<T> {
	constructor(
		public value: T,
		public created: Date = new Date(),
		public ttl: number = 20,
	) {}

	get expired(): boolean {
		const expiry = this.created.getTime() + this.ttl * 60 * 1000;
		return new Date().getTime() > expiry;
	}
}

class OldQueryCache {
	public readonly issueCache: Record<string, OldCacheEntry<IssueSearchResponse>> = {};
	public readonly repoCache: Record<string, OldCacheEntry<RepoSearchResponse>> = {};
}

class OldRepoCache {
	public readonly issueCache: Record<number, OldCacheEntry<IssueResponse>> = {};
	public readonly issueListForRepoCache: Record<string, OldCacheEntry<IssueListResponse>> = {};
	public readonly pullCache: Record<string, OldCacheEntry<PullResponse>> = {};
	public readonly pullListForRepoCache: Record<string, OldCacheEntry<PullListResponse>> = {};
}

class OldOrgCache {
	public readonly repos: Record<string, OldRepoCache> = {};
	public readonly issueList: Record<string, OldCacheEntry<IssueListResponse>> = {};
}

/**
 * @deprecated Should remove this in the one place its still used, but need an alternative solution first
 */
export class OldCache {
	public readonly generic: Record<string, OldCacheEntry<unknown>> = {};
	public readonly orgs: Record<string, OldOrgCache> = {};
	public readonly queries = new OldQueryCache();

	getGeneric(url: string): unknown {
		return this.getCacheValue(this.generic[url] ?? null);
	}

	setGeneric(url: string, value: unknown): void {
		this.generic[url] = new OldCacheEntry(value);
	}

	getIssue(org: string, repo: string, issue: number): IssueResponse | null {
		const repoCache = this.getRepoCache(org, repo);
		return this.getCacheValue(repoCache.issueCache[issue] ?? null);
	}

	setIssue(org: string, repo: string, issue: IssueResponse): void {
		const issueCache = this.getRepoCache(org, repo).issueCache;
		const existingCache = issueCache[issue.number];
		if (existingCache) {
			const now = new Date();
			existingCache.created = now;
			existingCache.value = issue;
		} else {
			issueCache[issue.number] = new OldCacheEntry<IssueResponse>(issue);
		}
	}

	getIssueList(org: string, params: IssueListParams): IssueListResponse | null {
		const orgCache = this.getOrgCache(org);
		return this.getCacheValue(orgCache.issueList[JSON.stringify(params)] ?? null);
	}

	setIssueList(org: string, params: IssueListParams, value: IssueListResponse): void {
		const orgCache = this.getOrgCache(org);
		orgCache.issueList[JSON.stringify(params)] = new OldCacheEntry(value);
	}

	getIssueListForRepo(org: string, repo: string, params: IssueListParams): IssueListResponse | null {
		const repoCache = this.getRepoCache(org, repo);
		return this.getCacheValue(repoCache.issueListForRepoCache[JSON.stringify(params)] ?? null);
	}

	setIssueListForRepo(org: string, repo: string, params: IssueListParams, value: IssueListResponse): void {
		const repoCache = this.getRepoCache(org, repo);
		repoCache.issueListForRepoCache[JSON.stringify(params)] = new OldCacheEntry(value);
	}

	getPullRequest(org: string, repo: string, pullRequest: number): PullResponse | null {
		const repoCache = this.getRepoCache(org, repo);
		return this.getCacheValue(repoCache.pullCache[pullRequest] ?? null);
	}

	getPullListForRepo(org: string, repo: string, params: PullListParams): PullListResponse | null {
		const repoCache = this.getRepoCache(org, repo);
		return this.getCacheValue(repoCache.pullListForRepoCache[JSON.stringify(params)] ?? null);
	}

	setPullListForRepo(org: string, repo: string, params: PullListParams, value: PullListResponse): void {
		const repoCache = this.getRepoCache(org, repo);
		repoCache.pullListForRepoCache[JSON.stringify(params)] = new OldCacheEntry(value);
	}

	setPullRequest(org: string, repo: string, pullRequest: PullResponse): void {
		const pullCache = this.getRepoCache(org, repo).pullCache;
		const existingCache = pullCache[pullRequest.number];
		if (existingCache) {
			const now = new Date();
			existingCache.created = now;
			existingCache.value = pullRequest;
		} else {
			pullCache[pullRequest.number] = new OldCacheEntry<PullResponse>(pullRequest);
		}
	}

	getIssueQuery(query: string): IssueSearchResponse | null {
		return this.getCacheValue(this.queries.issueCache[query] ?? null);
	}

	setIssueQuery(query: string, result: IssueSearchResponse): void {
		this.queries.issueCache[query] = new OldCacheEntry<IssueSearchResponse>(result);
	}

	getRepoQuery(query: string): RepoSearchResponse | null {
		return this.getCacheValue(this.queries.repoCache[query] ?? null);
	}

	setRepoQuery(query: string, result: RepoSearchResponse): void {
		this.queries.repoCache[query] = new OldCacheEntry<RepoSearchResponse>(result);
	}

	private getOrgCache(org: string): OldOrgCache {
		let orgCache = this.orgs[org];
		if (!orgCache) {
			orgCache = this.orgs[org] = new OldOrgCache();
		}
		return orgCache;
	}

	private getRepoCache(org: string, repo: string) {
		const orgCache = this.getOrgCache(org);
		let repoCache = orgCache.repos[repo];
		if (!repoCache) {
			repoCache = orgCache.repos[repo] = new OldRepoCache();
		}
		return repoCache;
	}

	private getCacheValue<T>(cacheEntry: OldCacheEntry<T> | null): T | null {
		if (!cacheEntry || cacheEntry.expired) {
			return null;
		} else {
			return cacheEntry.value;
		}
	}
}
