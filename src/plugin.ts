import { DEFAULT_SETTINGS, GithubLinkPluginSettingsTab } from "./settings";
import { LogLevel, verboseFactory } from "./util";

import type { GithubLinkPluginSettings } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { Plugin } from "obsidian";
import { QueryProcessor } from "./query/processor";
import { createInlineViewPlugin } from "./inline/view-plugin";

export let PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export let Logger = verboseFactory(LogLevel.Error);

export class GithubLinkPlugin extends Plugin {
	async onload() {
		PluginSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		Logger = verboseFactory(PluginSettings.logLevel);
		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
	}
}
