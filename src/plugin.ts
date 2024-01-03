import {
	GithubLinkPluginSettings,
	GithubLinkPluginSettingsTab,
} from "./settings";

import { Plugin } from "obsidian";
import { getIssue } from "./github";

export class GithubLinkPlugin extends Plugin {
	public settings: GithubLinkPluginSettings = {};
	async onload() {
		this.settings = Object.assign({}, await this.loadData());
		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.addCommand({
			id: "get-issue",
			name: "Get GitHub issue",
			callback: async () => {
				const result = await getIssue(
					"nathonius",
					"obsidian-trello",
					4
				);
				console.log(result);
			},
		});
	}
}
