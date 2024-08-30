import type { App } from "obsidian";
import { Setting } from "obsidian";
import type { Verification } from "@octokit/auth-oauth-device/dist-types/types";
import { AuthModal } from "../auth-modal";
import { auth } from "../github/auth";
import type { GithubAccount } from "./types";

export class AccountSettings {
	authModal: AuthModal | null = null;
	newAccount: GithubAccount | null = null;

	constructor(
		private readonly app: App,
		private readonly container: HTMLElement,
		private readonly saveCallback: () => Promise<void>,
		private readonly displayCallback: () => void,
		private readonly removeCallback: (account: GithubAccount) => Promise<void>,
	) {}

	public render(accounts: GithubAccount[]): void {
		for (const account of accounts) {
			this.renderAccountSetting(account);
		}
	}

	public renderNewAccount(
		container: HTMLElement,
		saveNewAccountCallback: (account: GithubAccount) => Promise<void>,
	): void {
		if (!this.newAccount) {
			this.newAccount = { id: crypto.randomUUID(), name: "", orgs: [], token: "", customOAuth: false };
		}
		// TODO: Combine the new account and existing account rendering to reduce duplication
		const accountContainer = container.createDiv();
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
					this.displayCallback();
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
					this.newAccount!.orgs = value.split(",").map((acc) => acc.trim());
				});
			});

		const oauthDesc = createFragment((fragment) => {
			fragment.appendText(
				"You can optionally provide your own OAuth app for more control and a larger request rate limit. See the ",
			);
			fragment.createEl("a", {
				text: "plugin documentation",
				href: "https://github.com/nathonius/obsidian-github-link/wiki/Authentication#custom-oauth-app",
			});
			fragment.appendText(" for instructions.");
		});
		const customOAuthSetting = new Setting(accountContainer)
			.setName("Use custom OAuth app")
			.setDesc(oauthDesc)
			.addToggle((toggle) => {
				toggle.setValue(this.newAccount!.customOAuth ?? false);
				toggle.onChange((value) => {
					this.newAccount!.customOAuth = value;
					this.displayCallback();
				});
			});
		if (this.newAccount.customOAuth) {
			customOAuthSetting.addText((text) => {
				text.setValue(this.newAccount!.clientId ?? "");
				text.setPlaceholder("Client ID");
				text.onChange((value) => {
					this.newAccount!.clientId = value;
				});
			});
		}

		new Setting(accountContainer)
			.setName("Token")
			.setDesc(
				"A GitHub token, which can be generated automatically (recommended) or by creating a personal access token (not recommended unless org does not allow OAuth tokens). Required.",
			)
			.addButton((button) => {
				button.setButtonText("Generate Token");
				button.onClick(async () => {
					const clientId = this.newAccount?.customOAuth ? this.newAccount.clientId : undefined;
					const authResult = await auth(
						this.tokenVerification.bind(this),
						clientId,
					)({
						type: "oauth",
					});
					this.authModal?.close();
					this.authModal = null;
					this.newAccount!.token = authResult.token;
					this.displayCallback();
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
			button.setButtonText("Save account");
			button.setTooltip("Save account");
			button.setIcon("save");
			button.onClick(async () => {
				if (!this.newAccount?.name) {
					return;
				}
				await saveNewAccountCallback(this.newAccount);
				this.newAccount = null;
				this.displayCallback();
			});
		});
	}

	public renderAccountSetting(account: GithubAccount, parent: HTMLElement = this.container): void {
		const accountContainer = parent.createDiv();
		accountContainer.createEl("h3", { text: account.name });

		new Setting(accountContainer)
			.setName("Account name")
			.addText((text) => {
				text.setValue(account.name);
				text.onChange((value) => {
					account.name = value;
					void this.saveCallback();
				});
			})
			.addButton((button) => {
				button.setIcon("trash");
				button.setTooltip("Delete account");
				button.onClick(async () => {
					await this.removeCallback(account);
					await this.saveCallback();
					this.displayCallback();
				});
			});

		new Setting(accountContainer)
			.setName("Orgs and users")
			.setDesc("A comma separated list of the GitHub organizations and users this account should be used for.")
			.addTextArea((text) => {
				text.setValue(account.orgs.join(", "));
				text.onChange((value) => {
					account.orgs = value.split(",").map((org) => org.trim());
					void this.saveCallback();
				});
			});

		const oauthDesc = createFragment((fragment) => {
			fragment.appendText(
				"You can optionally provide your own OAuth app for more control and a larger request rate limit. See the ",
			);
			fragment.createEl("a", { text: "plugin documentation", href: "#" });
			fragment.appendText(" for instructions.");
		});
		const customOAuthSetting = new Setting(accountContainer)
			.setName("Use custom OAuth app")
			.setDesc(oauthDesc)
			.addToggle((toggle) => {
				toggle.setValue(account.customOAuth ?? false);
				toggle.onChange((value) => {
					account.customOAuth = value;
					this.displayCallback();
				});
			});
		if (account.customOAuth) {
			customOAuthSetting.addText((text) => {
				text.setValue(account.clientId ?? "");
				text.setPlaceholder("Client ID");
				text.onChange((value) => {
					account.clientId = value;
					void this.saveCallback();
				});
			});
		}

		new Setting(accountContainer)
			.setName("Token")
			.setDesc(
				"A GitHub token, which can be generated automatically (recommended) or by creating a personal access token (not recommended unless org does not allow OAuth tokens).",
			)
			.addButton((button) => {
				button.setButtonText("Generate Token");
				button.onClick(async () => {
					const customClientId = account.customOAuth ? account.clientId : undefined;
					const authResult = await auth(
						this.tokenVerification.bind(this),
						customClientId,
					)({
						type: "oauth",
					});
					this.authModal?.close();
					this.authModal = null;
					account.token = authResult.token;
					await this.saveCallback();
					this.displayCallback();
				});
			})
			.addText((text) => {
				text.setPlaceholder("Personal Access Token / OAuth Token");
				text.setValue(account.token);
				text.onChange((value) => {
					account.token = value;
					void this.saveCallback();
				});
			});
	}

	private tokenVerification(verification: Verification) {
		this.authModal = new AuthModal(this.app, verification);
		this.authModal.open();
	}
}
