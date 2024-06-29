import { expect, jest, test } from "@jest/globals";
import { GithubLinkPlugin, PluginData, PluginSettings, getCache } from "./plugin";
import { beforeEach, describe } from "node:test";
import type { Plugin, RequestUrlResponse } from "obsidian";
import { App } from "obsidian";
import * as manifest from "../manifest.json";
import type { PluginMock } from "__mocks__/obsidian/Plugin";
import type { GithubLinkPluginSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";
import { CacheEntry, RequestCache } from "./github/cache";
import { LogLevel } from "./logger";

jest.mock("./settings/settings-tab");

function mockedPlugin(plugin: GithubLinkPlugin): PluginMock {
	return plugin as Plugin as PluginMock;
}

describe("GithubLinkPlugin", () => {
	let app: App;
	let plugin: GithubLinkPlugin;

	beforeEach(() => {
		app = new App();
	});

	test("should create", () => {
		plugin = new GithubLinkPlugin(app, manifest);
		expect(plugin).toBeTruthy();
	});

	test("should create cache instance", async () => {
		plugin = new GithubLinkPlugin(app, manifest);
		await plugin.onload();
		expect(getCache() instanceof RequestCache).toBeTruthy();
	});

	test("should load all required components", async () => {
		plugin = new GithubLinkPlugin(app, manifest);
		await plugin.onload();
		expect(plugin.addSettingTab).toHaveBeenCalled();
		expect(plugin.registerMarkdownPostProcessor).toHaveBeenCalled();
		expect(plugin.registerEditorExtension).toHaveBeenCalled();
		expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalled();
		expect(plugin.registerInterval).toHaveBeenCalled();
	});

	describe("loadData", () => {
		test("should initialize default settings", async () => {
			plugin = new GithubLinkPlugin(app, manifest);
			await plugin.onload();
			expect(PluginData).toBeDefined();
			expect(PluginData.cache).toEqual(null);
			expect(PluginData.settings).toEqual(DEFAULT_SETTINGS);
		});

		test("should load stored cache", async () => {
			const cacheEntry = new CacheEntry(
				{ url: "mock" },
				{ json: "mock" } as RequestUrlResponse,
				new Date(),
				null,
				null,
			);
			plugin = new GithubLinkPlugin(app, manifest);
			mockedPlugin(plugin).data = { cache: [cacheEntry.toJSON()] };
			await plugin.onload();
			expect(PluginData.cache).toEqual([cacheEntry.toJSON()]);
			expect(getCache().get(cacheEntry.request)).toEqual(cacheEntry);
		});

		test.each<{ stored: Partial<GithubLinkPluginSettings>; name: string }>([
			{ stored: { cacheIntervalSeconds: 69 }, name: "cacheIntervalSeconds" },
			{ stored: { defaultPageSize: 69 }, name: "defaultPageSize" },
			{ stored: { tagTooltips: true }, name: "tagTooltips" },
			{ stored: { tagTooltips: false }, name: "tagTooltips" },
			{ stored: { minRequestSeconds: 69 }, name: "minRequestSeconds" },
			{ stored: { logLevel: LogLevel.Debug }, name: "logLevel" },
			{ stored: { showPagination: !DEFAULT_SETTINGS.showPagination }, name: "showPagination" },
		])("should merge stored and default settings ($name)", async ({ stored }) => {
			plugin = new GithubLinkPlugin(app, manifest);
			mockedPlugin(plugin).data = { settings: stored };
			await plugin.onload();
			for (const [k, v] of Object.entries(stored)) {
				expect(PluginSettings[k as keyof GithubLinkPluginSettings]).toEqual(v);
			}
		});
	});
});
