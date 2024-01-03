import { App, PluginSettingTab, Setting } from "obsidian";

import { AuthModal } from "./auth-modal";
import { GithubLinkPlugin } from "./plugin";
import { Verification } from "@octokit/auth-oauth-device/dist-types/types";
import { auth } from "./github";

export interface GithubLinkPluginSettings {
	token?: string;
}

export class GithubLinkPluginSettingsTab extends PluginSettingTab {
	authModal: AuthModal | null = null;

	constructor(public app: App, private readonly plugin: GithubLinkPlugin) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "GitHub authentication" });

		containerEl.createEl(
			"p",
			"No authentication is required to reference public repositories. Providing a token allows referencing private repos, but the token is stored in plain text."
		);

		new Setting(containerEl)
			.setName("Token")
			.setDesc(
				"A GitHub token, which can be generated automatically (recommended) or by creating a personal access token (not recommended)."
			)
			.addButton((button) => {
				button.setButtonText("Generate Token");
				button.onClick(this.generateToken.bind(this));
			})
			.addText((text) => {
				text.setPlaceholder("Personal Access Token");
				if (this.plugin.settings.token) {
					text.setValue(this.plugin.settings.token);
				}
			});
	}

	private saveSettings() {
		return this.plugin.saveData(this.plugin.settings);
	}

	private async generateToken() {
		const authResult = await auth(this.tokenVerification.bind(this))({
			type: "oauth",
		});
		this.authModal?.close();
		this.authModal = null;
		this.plugin.settings.token = authResult.token;
		await this.saveSettings();
		this.display();
	}

	private tokenVerification(verification: Verification) {
		this.authModal = new AuthModal(this.app, verification);
		this.authModal.open();
	}
}
