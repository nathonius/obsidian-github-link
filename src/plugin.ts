import type { GithubLinkPluginSettings } from "./settings";
import { GithubLinkPluginSettingsTab } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { Plugin } from "obsidian";
import { QueryProcessor } from "./query/processor";
import { createInlineViewPlugin } from "./inline/view-plugin";

export let PluginSettings: GithubLinkPluginSettings = { accounts: [] };

export class GithubLinkPlugin extends Plugin {
	async onload() {
		PluginSettings = Object.assign({}, await this.loadData());
		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
	}
}
