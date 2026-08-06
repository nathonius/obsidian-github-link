/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, GithubLinkPluginSettingsTab } from "./settings";
import { Logger } from "./logger";

import type { GithubLinkPluginData, GithubLinkPluginSettings } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { createInlineViewPlugin } from "./inline/view-plugin";
import { RequestCache } from "./github/cache";
import { QueryProcessor } from "./query/processor";
import { DATA_VERSION } from "./settings/types";
import { initKeychain, loadTokens, migrateTokens } from "./keychain";

export const PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export const PluginData: GithubLinkPluginData = { settings: PluginSettings, dataVersion: DATA_VERSION };
export const logger = new Logger();
let cache: RequestCache;

export function getCache(): RequestCache {
	return cache;
}

export class GithubLinkPlugin extends Plugin {
	async onload() {
		const data = (await this.loadData()) || {};

		Object.assign(PluginSettings, data.settings);
		Object.assign(PluginData, data);
		logger.logLevel = PluginSettings.logLevel;

		cache = new RequestCache();
		await cache.init();

		initKeychain(this.app.secretStorage);

		const needsSave = [this.keychainMigration(), await this.cacheMigration(data)].some((bool) => bool);
		if (needsSave) {
			await this.saveData(this.getDataForSave());
		}

		loadTokens(PluginSettings.accounts);

		// Clean cache on startup
		const maxAge = new Date(new Date().getTime() - PluginSettings.maxCacheAgeHours * 60 * 60 * 1000);
		const entriesDeleted = await cache.clean(maxAge);
		if (entriesDeleted > 0) {
			logger.info(`Cleaned ${entriesDeleted} entries from request cache.`);
		}

		// To show all icons, logger.debug(getIconIds());

		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
	}

	/**
	 * Returns plugin data with tokens stripped from accounts, for safe persistence to data.json.
	 */
	public getDataForSave(): GithubLinkPluginData {
		return {
			settings: {
				...PluginSettings,
				accounts: PluginSettings.accounts.map((acc) => ({ ...acc, token: "" })),
			},
			dataVersion: DATA_VERSION,
		};
	}

	/**
	 * Migrate from legacy plain-text secrets to obsidian keychain
	 */
	private keychainMigration(): boolean {
		if (PluginSettings.accounts.some((acc) => acc.token && !acc.tokenSecret)) {
			migrateTokens(PluginSettings.accounts);
			return true;
		}
		return false;
	}

	/**
	 * Migrate from legacy data.json cache to IndexedDB cache
	 */
	private async cacheMigration(
		data: GithubLinkPluginData & { settings: { cacheIntervalSeconds?: number } },
	): Promise<boolean> {
		let needsSave = false;

		if (data.settings.cacheIntervalSeconds) {
			delete data.settings.cacheIntervalSeconds;
			needsSave = true;
		}

		// Migrate cache from data.json to IndexedDB (one-time)
		if (data.cache && Array.isArray(data.cache) && data.cache.length > 0) {
			const imported = await cache.importFromJSON(data.cache);
			logger.info(`Migrated ${imported} cache entries from data.json to IndexedDB.`);
			needsSave = true;
		}

		return needsSave;
	}
}
