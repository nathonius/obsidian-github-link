/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Notice, PluginSettingTab, Setting } from "obsidian";

import type { App } from "obsidian";
import type { GithubLinkPlugin } from "../plugin";
import { LogLevel } from "../logger";
import { PluginData, PluginSettings, getCache } from "../plugin";
import type { GithubAccount, GithubLinkPluginData } from "./types";
import { DATA_VERSION, DEFAULT_SETTINGS } from "./types";
import { AccountSettings } from "./account";

export class GithubLinkPluginSettingsTab extends PluginSettingTab {
	private readonly accountSettings = new AccountSettings(
		this.app,
		this.containerEl,
		this.saveSettings.bind(this),
		this.display.bind(this),
		this.removeAccount.bind(this),
	);
	constructor(
		public app: App,
		private readonly plugin: GithubLinkPlugin,
	) {
		super(app, plugin);
	}

	public display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "GitHub authentication" });

		containerEl.createEl("p", {
			text: "No authentication is required to reference public repositories. Providing a token allows referencing private repos, but the token is stored in plain text. You can create multiple accounts for multiple tokens.",
		});

		const newAccountSection = containerEl.createDiv();
		new Setting(newAccountSection).setName("Add account").addButton((button) => {
			button.setButtonText("");
			button.setIcon("plus");
			button.setTooltip("Add Account");
			button.onClick(() => {
				this.accountSettings.renderNewAccount(newAccountSection, this.saveNewAccount.bind(this));
			});
		});

		if (this.accountSettings.newAccount) {
			this.accountSettings.renderNewAccount(newAccountSection, this.saveNewAccount.bind(this));
		}

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

		this.accountSettings.render(PluginSettings.accounts);

		containerEl.createEl("h2", { text: "Other settings" });

		new Setting(containerEl)
			.setName("Default result size")
			.setDesc("The maximum number of results that will be included in a table unless specified otherwise.")
			.addExtraButton((button) => {
				button.setIcon("rotate-ccw");
				button.setTooltip("Restore default");
				button.onClick(async () => {
					PluginSettings.defaultPageSize = DEFAULT_SETTINGS.defaultPageSize;
					await this.saveSettings();
					this.display();
				});
			})
			.addSlider((slider) => {
				const displayValue = createSpan({ text: PluginSettings.defaultPageSize.toString() });
				slider.sliderEl.parentElement?.prepend(displayValue);
				slider.setLimits(0, 30, 1);
				slider.setDynamicTooltip();
				slider.setValue(PluginSettings.defaultPageSize);
				slider.onChange((value) => {
					displayValue.setText(value.toString());
					PluginSettings.defaultPageSize = value;
					void this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Show external link")
			.setDesc("When using a custom query, an 'Open on GitHub' link can be added to view the results there.")
			.addToggle((toggle) => {
				toggle.setValue(PluginSettings.showExternalLink);
				toggle.onChange((value) => {
					PluginSettings.showExternalLink = value;
					void this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Show refresh button")
			.setDesc("Add a refresh button to tables to manually skip the cache.")
			.addToggle((toggle) => {
				toggle.setValue(PluginSettings.showRefresh);
				toggle.onChange((value) => {
					PluginSettings.showRefresh = value;
					void this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Show pagination")
			.setDesc("For query results with more than a single page of results, show pagination controls below the table.")
			.addToggle((toggle) => {
				toggle.setValue(PluginSettings.showPagination);
				toggle.onChange((value) => {
					PluginSettings.showPagination = value;
					void this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Status tooltips")
			.setDesc("Add a tooltip to issue and pull request status icons with status text")
			.addToggle((toggle) => {
				toggle.setValue(PluginSettings.tagTooltips);
				toggle.onChange((value) => {
					PluginSettings.tagTooltips = value;
					void this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Pull request mergeability")
			.setDesc("Add an icon to pull request tags to show whether or not the PR is mergeable")
			.addToggle((toggle) => {
				toggle.setValue(PluginSettings.tagShowPRMergeable);
				toggle.onChange((value) => {
					PluginSettings.tagShowPRMergeable = value;
					void this.saveSettings();
				});
			});

		containerEl.createEl("h3", { text: "Cache settings" });

		new Setting(containerEl)
			.setClass("github-link-sub-setting")
			.setName("Cache save interval (seconds)")
			.setDesc(
				"If it has been updated, cache will be saved to disk after this number of seconds while Obsidian is open.",
			)
			.addExtraButton((button) => {
				button.setIcon("rotate-ccw");
				button.setTooltip("Restore default");
				button.onClick(async () => {
					PluginSettings.cacheIntervalSeconds = DEFAULT_SETTINGS.cacheIntervalSeconds;
					await this.saveSettings();
					this.plugin.setCacheInterval();
					this.display();
				});
			})
			.addSlider((slider) => {
				const displayValue = createSpan({ text: PluginSettings.cacheIntervalSeconds.toString() });
				slider.sliderEl.parentElement?.prepend(displayValue);
				slider.setValue(PluginSettings.cacheIntervalSeconds);
				slider.setLimits(10, 1200, 10);
				slider.setDynamicTooltip();
				slider.onChange(async (value) => {
					PluginSettings.cacheIntervalSeconds = value;
					displayValue.setText(value.toString());
					await this.saveSettings();
					this.plugin.setCacheInterval();
				});
			});

		new Setting(containerEl)
			.setClass("github-link-sub-setting")
			.setName("Max cache age (hours)")
			.setDesc("Upon Obsidian startup, cache entries older than this many hours will be removed.")
			.addExtraButton((button) => {
				button.setIcon("rotate-ccw");
				button.setTooltip("Restore default");
				button.onClick(async () => {
					PluginSettings.maxCacheAgeHours = DEFAULT_SETTINGS.maxCacheAgeHours;
					await this.saveSettings();
					this.plugin.setCacheInterval();
					this.display();
				});
			})
			.addSlider((slider) => {
				const displayValue = createSpan({ text: PluginSettings.maxCacheAgeHours.toString() });
				slider.sliderEl.parentElement?.prepend(displayValue);
				slider.setValue(PluginSettings.maxCacheAgeHours);
				slider.setLimits(0, 170, 10);
				slider.setDynamicTooltip();
				slider.onChange(async (value) => {
					PluginSettings.maxCacheAgeHours = value;
					displayValue.setText(value.toString());
					await this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setClass("github-link-sub-setting")
			.setName("Minimum time between same request (seconds)")
			.setDesc(
				"If a request is made within this time frame for a value that is already cached, the cached value will be used without checking if it has changed.",
			)
			.addExtraButton((button) => {
				button.setIcon("rotate-ccw");
				button.setTooltip("Restore default");
				button.onClick(async () => {
					PluginSettings.minRequestSeconds = DEFAULT_SETTINGS.minRequestSeconds;
					await this.saveSettings();
					this.display();
				});
			})
			.addSlider((slider) => {
				const displayValue = createSpan({ text: PluginSettings.minRequestSeconds.toString() });
				slider.sliderEl.parentElement?.prepend(displayValue);
				slider.setValue(PluginSettings.minRequestSeconds);
				slider.setLimits(10, 1200, 10);
				slider.setDynamicTooltip();
				slider.onChange(async (value) => {
					PluginSettings.minRequestSeconds = value;
					displayValue.setText(value.toString());
					await this.saveSettings();
				});
			});

		new Setting(containerEl)
			.setClass("github-link-sub-setting")
			.setName("Clear cache")
			.setDesc("Seeing strange cache behavior? Clicking this will delete all cached responses.")
			.addButton((button) => {
				button.setIcon("trash");
				button.setButtonText("Clear cache");
				button.onClick(async () => {
					const itemsDeleted = getCache().clean(new Date());
					PluginData.cache = null;
					await this.saveSettings();
					new Notice(`Removed ${itemsDeleted} stored items from GitHub Link cache.`, 3000);
				});
			});

		new Setting(containerEl)
			.setName("Log level")
			.setDesc("Enable debug logging.")
			.addExtraButton((button) => {
				button.setIcon("rotate-ccw");
				button.setTooltip("Restore default");
				button.onClick(async () => {
					PluginSettings.logLevel = DEFAULT_SETTINGS.logLevel;
					await this.saveSettings();
					this.display();
				});
			})
			.addDropdown((dropdown) => {
				dropdown.addOptions({
					[LogLevel.Error]: "Error",
					[LogLevel.Warn]: "Warn",
					[LogLevel.Info]: "Info",
					[LogLevel.Debug]: "Debug",
				});
				dropdown.setValue(PluginSettings.logLevel.toString());
				dropdown.onChange((value) => {
					PluginSettings.logLevel = Number(value);
					void this.saveSettings();
				});
			});
	}

	private saveSettings() {
		const newData: GithubLinkPluginData = {
			cache: PluginData.cache,
			settings: PluginSettings,
			dataVersion: DATA_VERSION,
		};
		return this.plugin.saveData(newData);
	}

	private async removeAccount(account: GithubAccount): Promise<void> {
		PluginSettings.accounts.remove(account);
		await this.saveSettings();
	}

	private async saveNewAccount(account: GithubAccount): Promise<void> {
		PluginSettings.accounts.unshift(account);
		await this.saveSettings();
	}
}
