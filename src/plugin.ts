import { DEFAULT_SETTINGS, GithubLinkPluginSettingsTab } from "./settings";
import { Logger } from "./logger";

import type { GithubLinkPluginData, GithubLinkPluginSettings } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { Plugin } from "obsidian";
import { QueryProcessor } from "./query/processor";
import { createInlineViewPlugin } from "./inline/view-plugin";
import { RequestCache } from "./github/cache";

export const PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export const PluginData: GithubLinkPluginData = { cache: null, settings: PluginSettings };
export const logger = new Logger();
let cache: RequestCache;
export function getCache(): RequestCache {
	return cache;
}

export class GithubLinkPlugin extends Plugin {
	public cacheInterval: number | undefined;
	async onload() {
		let data = (await this.loadData()) || {};

		// Migrate settings from data root to settings -- remove in v1.0.0
		if (data.accounts) {
			const newSettings: GithubLinkPluginSettings = {
				accounts: data.accounts ?? PluginSettings.accounts,
				cacheIntervalSeconds: data.cacheIntervalSeconds ?? PluginSettings.cacheIntervalSeconds,
				defaultPageSize: data.defaultPageSize ?? PluginSettings.defaultPageSize,
				logLevel: data.logLevel ?? PluginSettings.logLevel,
				maxCacheAgeHours: data.maxCacheAgeHours ?? PluginSettings.maxCacheAgeHours,
				minRequestSeconds: data.minRequestSeconds ?? PluginSettings.minRequestSeconds,
				tagShowPRMergeable: data.tagShowPRMergeable ?? PluginSettings.tagShowPRMergeable,
				tagTooltips: data.tagTooltips ?? PluginSettings.tagTooltips,
				defaultAccount: data.defaultAccount ?? PluginSettings.defaultAccount,
			};
			const newData: GithubLinkPluginData = {
				cache: data.cache ?? PluginData.cache,
				settings: newSettings,
			};
			await this.saveData(newData);
			data = newData;
		}

		Object.assign(PluginSettings, data.settings);
		Object.assign(PluginData, data);
		logger.logLevel = PluginSettings.logLevel;

		cache = new RequestCache(PluginData.cache);

		// Clean cache
		const maxAge = new Date(new Date().getTime() - PluginSettings.maxCacheAgeHours * 60 * 60 * 1000);
		const entriesDeleted = cache.clean(maxAge);
		if (entriesDeleted > 0) {
			PluginData.cache = cache.toJSON();
			await this.saveData(PluginSettings);
			logger.info(`Cleaned ${entriesDeleted} entries from request cache.`);
		}

		// To show all icons, logger.debug(getIconIds());

		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
		this.setCacheInterval();
	}

	/**
	 * Save cache at regular interval
	 */
	public setCacheInterval(): void {
		window.clearInterval(this.cacheInterval);
		this.cacheInterval = this.registerInterval(
			window.setInterval(async () => {
				logger.debug("Checking if cache needs a save.");
				if (cache.cacheUpdated) {
					PluginData.cache = cache.toJSON();
					await this.saveData(PluginData);
					cache.cacheUpdated = false;
					logger.info(`Saved request cache with ${PluginData.cache?.length} items.`);
				}
			}, PluginSettings.cacheIntervalSeconds * 1000),
		);
	}
}
