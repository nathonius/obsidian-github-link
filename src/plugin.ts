import type { GithubLinkPluginSettings } from "./settings";
import { GithubLinkPluginSettingsTab } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { Plugin } from "obsidian";
import { createInlineViewPlugin } from "./inline/view-plugin";
import { getIssue } from "./github";

export let PluginSettings: GithubLinkPluginSettings = { accounts: [] };

export class GithubLinkPlugin extends Plugin {
	async onload() {
		PluginSettings = Object.assign({}, await this.loadData());
		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.addCommand({
			id: "get-issue",
			name: "Get GitHub issue",
			callback: async () => {
				const result = await getIssue("nathonius", "obsidian-trello", 4);
				console.log(result);
			},
		});
	}
}
