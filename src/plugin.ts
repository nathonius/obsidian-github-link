import { DEFAULT_SETTINGS, GithubLinkPluginSettingsTab } from "./settings";
import { Logger } from "./logger";

import type { GithubLinkPluginSettings } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { Plugin } from "obsidian";
import { QueryProcessor } from "./query/processor";
import { createInlineViewPlugin } from "./inline/view-plugin";

export const PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export const logger = new Logger();

export class GithubLinkPlugin extends Plugin {
	async onload() {
		Object.assign(PluginSettings, await this.loadData());
		logger.logLevel = PluginSettings.logLevel;

		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
	}
}
