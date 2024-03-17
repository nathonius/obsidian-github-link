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

class CacheEntry<T> {
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

class QueryCache {
	public readonly issueCache: Record<string, CacheEntry<IssueSearchResponse>> = {};
	public readonly repoCache: Record<string, CacheEntry<RepoSearchResponse>> = {};
}

class RepoCache {
	public readonly issueCache: Record<number, CacheEntry<IssueResponse>> = {};
	public readonly issueListForRepoCache: Record<string, CacheEntry<IssueListResponse>> = {};
	public readonly pullCache: Record<string, CacheEntry<PullResponse>> = {};
	public readonly pullListForRepoCache: Record<string, CacheEntry<PullListResponse>> = {};
}

class OrgCache {
	public readonly repos: Record<string, RepoCache> = {};
	public readonly issueList: Record<string, CacheEntry<IssueListResponse>> = {};
}

export class Cache {
	public readonly generic: Record<string, CacheEntry<unknown>> = {};
	public readonly orgs: Record<string, OrgCache> = {};
	public readonly queries = new QueryCache();

	getGeneric(url: string): unknown | null {
		return this.getCacheValue(this.generic[url] ?? null);
	}

	setGeneric(url: string, value: unknown): void {
		this.generic[url] = new CacheEntry(value);
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
			issueCache[issue.number] = new CacheEntry<IssueResponse>(issue);
		}
	}

	getIssueList(org: string, params: IssueListParams): IssueListResponse | null {
		const orgCache = this.getOrgCache(org);
		return this.getCacheValue(orgCache.issueList[JSON.stringify(params)] ?? null);
	}

	setIssueList(org: string, params: IssueListParams, value: IssueListResponse): void {
		const orgCache = this.getOrgCache(org);
		orgCache.issueList[JSON.stringify(params)] = new CacheEntry(value);
	}

	getIssueListForRepo(org: string, repo: string, params: IssueListParams): IssueListResponse | null {
		const repoCache = this.getRepoCache(org, repo);
		return this.getCacheValue(repoCache.issueListForRepoCache[JSON.stringify(params)] ?? null);
	}

	setIssueListForRepo(org: string, repo: string, params: IssueListParams, value: IssueListResponse): void {
		const repoCache = this.getRepoCache(org, repo);
		repoCache.issueListForRepoCache[JSON.stringify(params)] = new CacheEntry(value);
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
		repoCache.pullListForRepoCache[JSON.stringify(params)] = new CacheEntry(value);
	}

	setPullRequest(org: string, repo: string, pullRequest: PullResponse): void {
		const pullCache = this.getRepoCache(org, repo).pullCache;
		const existingCache = pullCache[pullRequest.id];
		if (existingCache) {
			const now = new Date();
			existingCache.created = now;
			existingCache.value = pullRequest;
		} else {
			pullCache[pullRequest.id] = new CacheEntry<PullResponse>(pullRequest);
		}
	}

	getIssueQuery(query: string): IssueSearchResponse | null {
		return this.getCacheValue(this.queries.issueCache[query] ?? null);
	}

	setIssueQuery(query: string, result: IssueSearchResponse): void {
		this.queries.issueCache[query] = new CacheEntry<IssueSearchResponse>(result);
	}

	getRepoQuery(query: string): RepoSearchResponse | null {
		return this.getCacheValue(this.queries.repoCache[query] ?? null);
	}

	setRepoQuery(query: string, result: RepoSearchResponse): void {
		this.queries.repoCache[query] = new CacheEntry<RepoSearchResponse>(result);
	}

	private getOrgCache(org: string): OrgCache {
		let orgCache = this.orgs[org];
		if (!orgCache) {
			orgCache = this.orgs[org] = new OrgCache();
		}
		return orgCache;
	}

	private getRepoCache(org: string, repo: string) {
		const orgCache = this.getOrgCache(org);
		let repoCache = orgCache.repos[repo];
		if (!repoCache) {
			repoCache = orgCache.repos[repo] = new RepoCache();
		}
		return repoCache;
	}

	private getCacheValue<T>(cacheEntry: CacheEntry<T> | null): T | null {
		if (!cacheEntry || cacheEntry.expired) {
			return null;
		} else {
			return cacheEntry.value;
		}
	}
}
