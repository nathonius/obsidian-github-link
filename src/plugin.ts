import { GithubLinkPluginSettings, GithubLinkPluginSettingsTab } from "./settings";

import { InlineRenderer } from "./inline";
import { Plugin } from "obsidian";
import { getIssue } from "./github";

export let PluginSettings: GithubLinkPluginSettings = { accounts: [] };

export class GithubLinkPlugin extends Plugin {
	async onload() {
		PluginSettings = Object.assign({}, await this.loadData());
		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
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
