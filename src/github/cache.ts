import type { RequestUrlParam, RequestUrlResponse } from "obsidian";
import { logger } from "../plugin";
import { isSuccessResponse, sanitizeObject } from "../util";

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
		const entry: CacheEntry | null = this.entries[this.getCacheKey(request)] ?? null;
		// Ensure headers are defined; some old cache entries might not have them
		if (entry && !entry.response.headers) {
			entry.response.headers = {};
		}
		return entry;
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
		const _response: Partial<RequestUrlResponse> = {
			json: response.json,
			status: response.status,
			headers: sanitizeObject(response.headers, { link: true }),
		};

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
