/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PluginSettingTab, Setting } from "obsidian";

import type { App } from "obsidian";
import { AuthModal } from "./auth-modal";
import type { GithubLinkPlugin } from "./plugin";
import { PluginSettings } from "./plugin";
import type { Verification } from "@octokit/auth-oauth-device/dist-types/types";
import { auth } from "./github/auth";

export interface GithubAccount {
	id: string;
	name: string;
	orgs: string[];
	token: string;
}

export interface GithubLinkPluginSettings {
	accounts: GithubAccount[];
	defaultAccount?: string;
}

export class GithubLinkPluginSettingsTab extends PluginSettingTab {
	authModal: AuthModal | null = null;
	newAccount: GithubAccount | null = null;

	constructor(
		public app: App,
		private readonly plugin: GithubLinkPlugin,
	) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "GitHub authentication" });

		containerEl.createEl("p", {
			text: "No authentication is required to reference public repositories. Providing a token allows referencing private repos, but the token is stored in plain text. You can create multiple accounts for multiple tokens.",
		});

		new Setting(containerEl).setName("Add account").addButton((button) => {
			button.setButtonText("");
			button.setIcon("plus");
			button.setTooltip("Add Account");
			button.onClick(() => {
				this.newAccount = { id: crypto.randomUUID(), name: "", orgs: [], token: "" };
				this.display();
			});
		});
		new Setting(containerEl)
			.setName("Default account")
			.setDesc("The account that will be used if no other users or organizations match.")
			.addDropdown((dropdown) => {
				const options = PluginSettings.accounts.reduce<Record<string, string>>((acc, account) => {
					acc[account.id] = account.name;
					return acc;
				}, {});
				dropdown.addOptions(options);
				dropdown.setValue(PluginSettings.defaultAccount ?? "");
				dropdown.onChange(async (value) => {
					const selectedAccount = PluginSettings.accounts.find((acc) => acc.id === value);
					if (selectedAccount) {
						PluginSettings.defaultAccount = selectedAccount.id;
						await this.saveSettings();
					}
				});
			});

		// TODO: Combine the new account and existing account rendering to reduce duplication
		if (this.newAccount !== null) {
			const accountContainer = containerEl.createDiv();
			const header = accountContainer.createEl("h3", { text: "New account" });
			new Setting(accountContainer)
				.setName("Account name")
				.setDesc("Required.")
				.addText((text) => {
					text.setValue(this.newAccount!.name);
					text.onChange((value) => {
						this.newAccount!.name = value;
						header.setText(value ?? "New account");
					});
				})
				.addButton((button) => {
					button.setIcon("trash");
					button.setTooltip("Delete account");
					button.onClick(() => {
						this.newAccount = null;
						this.display();
					});
				});
			new Setting(accountContainer)
				.setName("Orgs and users")
				.setDesc(
					"A comma separated list of the GitHub organizations and users this account should be used for. Optional.",
				)
				.addTextArea((text) => {
					text.setValue(this.newAccount!.orgs.join(", "));
					text.onChange((value) => {
						this.newAccount!.orgs = value.split(",");
					});
				});
			new Setting(accountContainer)
				.setName("Token")
				.setDesc(
					"A GitHub token, which can be generated automatically (recommended) or by creating a personal access token (not recommended unless org does not allow OAuth tokens). Required.",
				)
				.addButton((button) => {
					button.setButtonText("Generate Token");
					button.onClick(async () => {
						const authResult = await auth(this.tokenVerification.bind(this))({
							type: "oauth",
						});
						this.authModal?.close();
						this.authModal = null;
						this.newAccount!.token = authResult.token;
						this.display();
					});
				})
				.addText((text) => {
					text.setPlaceholder("Personal Access Token / OAuth Token");
					text.setValue(this.newAccount!.token);
					text.onChange((value) => {
						this.newAccount!.token = value;
					});
				});
			new Setting(accountContainer).addButton((button) => {
				button.setTooltip("Save account");
				button.setIcon("save");
				button.onClick(async () => {
					if (!this.newAccount || !this.newAccount.name || !this.newAccount.token) {
						return;
					}
					PluginSettings.accounts.unshift(this.newAccount);
					await this.saveSettings();
					this.newAccount = null;
					this.display();
				});
			});
		}

		for (const account of PluginSettings.accounts) {
			const accountContainer = containerEl.createDiv();
			accountContainer.createEl("h3", { text: account.name });
			new Setting(accountContainer)
				.setName("Account name")
				.addText((text) => {
					text.setValue(account.name);
					text.onChange((value) => {
						account.name = value;
						this.saveSettings();
					});
				})
				.addButton((button) => {
					button.setIcon("trash");
					button.setTooltip("Delete account");
					button.onClick(async () => {
						PluginSettings.accounts.remove(account);
						await this.saveSettings();
						this.display();
					});
				});
			new Setting(accountContainer)
				.setName("Orgs and users")
				.setDesc(
					"A comma separated list of the GitHub organizations and users this account should be used for.",
				)
				.addTextArea((text) => {
					text.setValue(account.orgs.join(", "));
					text.onChange((value) => {
						account.orgs = value.split(",").map((org) => org.trim());
						this.saveSettings();
					});
				});
			new Setting(accountContainer)
				.setName("Token")
				.setDesc(
					"A GitHub token, which can be generated automatically (recommended) or by creating a personal access token (not recommended unless org does not allow OAuth tokens).",
				)
				.addButton((button) => {
					button.setButtonText("Generate Token");
					button.onClick(async () => {
						const authResult = await auth(this.tokenVerification.bind(this))({
							type: "oauth",
						});
						this.authModal?.close();
						this.authModal = null;
						account.token = authResult.token;
						await this.saveSettings();
						this.display();
					});
				})
				.addText((text) => {
					text.setPlaceholder("Personal Access Token / OAuth Token");
					text.setValue(account.token);
					text.onChange((value) => {
						account.token = value;
						this.saveSettings();
					});
				});
		}
	}

	private saveSettings() {
		return this.plugin.saveData(PluginSettings);
	}

	private tokenVerification(verification: Verification) {
		this.authModal = new AuthModal(this.app, verification);
		this.authModal.open();
	}
}
