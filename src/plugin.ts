import { DEFAULT_SETTINGS, GithubLinkPluginSettingsTab } from "./settings";
import { Logger } from "./logger";

import type { GithubLinkPluginSettings } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { Plugin } from "obsidian";
import { QueryProcessor } from "./query/processor";
import { createInlineViewPlugin } from "./inline/view-plugin";
import { RequestCache } from "./github/cache";

export const PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export const logger = new Logger();
let cache: RequestCache;
export function getCache(): RequestCache {
	return cache;
}

export class GithubLinkPlugin extends Plugin {
	public cacheInterval: number | undefined;
	async onload() {
		Object.assign(PluginSettings, await this.loadData());
		logger.logLevel = PluginSettings.logLevel;

		cache = new RequestCache(PluginSettings.cache);

		// Clean cache
		const maxAge = new Date(new Date().getTime() - PluginSettings.maxCacheAgeHours * 60 * 60 * 1000);
		const entriesDeleted = cache.clean(maxAge);
		if (entriesDeleted > 0) {
			PluginSettings.cache = cache.toJSON();
			await this.saveData(PluginSettings);
			logger.info(`Cleaned ${entriesDeleted} entries from request cache.`);
		}

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
					PluginSettings.cache = cache.toJSON();
					await this.saveData(PluginSettings);
					cache.cacheUpdated = false;
					logger.info(`Saved request cache with ${PluginSettings.cache?.length} items.`);
				}
			}, PluginSettings.cacheIntervalSeconds * 1000),
		);
	}
}
