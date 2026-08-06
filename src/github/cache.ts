import type { RequestUrlParam, RequestUrlResponse } from "obsidian";
import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import { logger } from "../plugin";
import { isSuccessResponse, sanitizeObject } from "../util";

const DB_NAME = "obsidian-github-link";
const STORE_NAME = "request-cache";
const DB_VERSION = 1;

export interface CacheEntryData {
	url: string;
	requestBody?: string;
	response: RequestUrlResponse;
	retrieved: number;
	etag: string | null;
	lastModified: string | null;
}

interface CacheDB extends DBSchema {
	[STORE_NAME]: {
		key: string;
		value: CacheEntryData;
		indexes: { "by-retrieved": number };
	};
}

export class CacheEntry {
	constructor(
		public readonly request: RequestUrlParam,
		public readonly response: RequestUrlResponse,
		public retrieved: Date,
		public readonly etag: string | null,
		public readonly lastModified: string | null,
	) {}

	public static fromStored(data: CacheEntryData): CacheEntry {
		return new CacheEntry(
			{ url: data.url, body: data.requestBody },
			data.response,
			new Date(data.retrieved),
			data.etag,
			data.lastModified,
		);
	}

	public static fromJSON(json: string): CacheEntry | null {
		try {
			const parsed = JSON.parse(json) as {
				request: RequestUrlParam;
				response: RequestUrlResponse;
				retrieved: number;
				etag: string | null;
				lastModified: string | null;
			};
			return new CacheEntry(
				parsed.request,
				parsed.response,
				new Date(parsed.retrieved),
				parsed.etag,
				parsed.lastModified,
			);
		} catch (err) {
			logger.error("Failure reconstructing cache!");
			logger.error(err);
			return null;
		}
	}

	public toStored(): CacheEntryData {
		return {
			url: this.request.url,
			requestBody: this.request.body as string | undefined,
			response: this.response,
			retrieved: this.retrieved.getTime(),
			etag: this.etag,
			lastModified: this.lastModified,
		};
	}
}

/**
 * Cache of responses to simple, non-search requests, backed by IndexedDB.
 */
export class RequestCache {
	private db: IDBPDatabase<CacheDB> | null = null;
	private memCache: Record<string, CacheEntry> = {};

	/**
	 * Open the IndexedDB database. Must be called before using the cache.
	 */
	public async init(): Promise<void> {
		this.db = await openDB<CacheDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: "url" });
				store.createIndex("by-retrieved", "retrieved");
			},
		});

		// Load all entries into memory for fast synchronous reads
		const all = await this.db.getAll(STORE_NAME);
		for (const data of all) {
			this.memCache[data.url] = CacheEntry.fromStored(data);
		}
	}

	/**
	 * Synchronous read from in-memory cache.
	 */
	public get(request: RequestUrlParam): CacheEntry | null {
		const entry: CacheEntry | null = this.memCache[this.getCacheKey(request)] ?? null;
		if (entry && !entry.response.headers) {
			entry.response.headers = {};
		}
		return entry;
	}

	public async set(request: RequestUrlParam, response: RequestUrlResponse): Promise<void> {
		if (!isSuccessResponse(response.status)) {
			logger.warn(`Attempted to cache a non-successful request: ${request.url}`);
			return;
		}

		const etag = response.headers.etag ?? null;
		const lastModified = response.headers["last-modified"] ?? null;

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

		const key = this.getCacheKey(request);
		this.memCache[key] = entry;
		await this.db?.put(STORE_NAME, entry.toStored());
	}

	public async remove(request: RequestUrlParam | string): Promise<void> {
		const key = typeof request === "string" ? request : this.getCacheKey(request);
		delete this.memCache[key];
		await this.db?.delete(STORE_NAME, key);
	}

	public async clean(maxAge: Date): Promise<number> {
		let entriesDeleted = 0;
		const keysToDelete: string[] = [];

		for (const [k, v] of Object.entries(this.memCache)) {
			if (v.retrieved < maxAge) {
				keysToDelete.push(k);
			}
		}

		for (const key of keysToDelete) {
			delete this.memCache[key];
			await this.db?.delete(STORE_NAME, key);
			entriesDeleted += 1;
		}

		return entriesDeleted;
	}

	public async update(request: RequestUrlParam | string): Promise<void> {
		const key = typeof request === "string" ? request : this.getCacheKey(request);
		const entry = this.memCache[key];
		if (entry) {
			entry.retrieved = new Date();
			await this.db?.put(STORE_NAME, entry.toStored());
		}
	}

	/**
	 * Import entries from the old JSON-based cache (data.json migration).
	 */
	public async importFromJSON(storedCache: string[]): Promise<number> {
		let imported = 0;
		for (const entryString of storedCache) {
			const entry = CacheEntry.fromJSON(entryString);
			if (entry) {
				const key = this.getCacheKey(entry.request);
				this.memCache[key] = entry;
				await this.db?.put(STORE_NAME, entry.toStored());
				imported += 1;
			}
		}
		return imported;
	}

	/**
	 * Close the IndexedDB connection.
	 */
	public close(): void {
		this.db?.close();
		this.db = null;
	}

	private getCacheKey(request: RequestUrlParam): string {
		return request.url;
	}
}
