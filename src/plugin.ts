import {
	GithubLinkPluginSettings,
	GithubLinkPluginSettingsTab,
} from "./settings";

import { Plugin } from "obsidian";

export class GithubLinkPlugin extends Plugin {
	public settings: GithubLinkPluginSettings = {};
	async onload() {
		this.settings = Object.assign({}, await this.loadData());
		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
	}
}
