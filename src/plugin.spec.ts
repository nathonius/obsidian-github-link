import { expect, jest, test, describe, beforeEach, afterEach } from "@jest/globals";
import { App } from "obsidian";
import type { PluginMock } from "../__mocks__/obsidian/Plugin";
import * as manifest from "../manifest.json";
import { GithubLinkPlugin, PluginData, PluginSettings, getCache } from "./plugin";
import type { GithubLinkPluginSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";
import { RequestCache } from "./github/cache";
import { LogLevel } from "./logger";
import { DATA_VERSION } from "./settings/types";

jest.mock("./settings/settings-tab");

function mockedPlugin(plugin: GithubLinkPlugin): PluginMock {
	return plugin as unknown as PluginMock;
}

describe("GithubLinkPlugin", () => {
	let app: App;
	let plugin: GithubLinkPlugin;

	beforeEach(() => {
		app = new App();
	});

	afterEach(() => {
		// Close the cache DB connection so subsequent tests can open a fresh one
		if (getCache()) {
			getCache().close();
		}
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
	});

	describe("loadData", () => {
		test("should initialize default settings", async () => {
			plugin = new GithubLinkPlugin(app, manifest);
			await plugin.onload();
			expect(PluginData).toBeDefined();
			expect(PluginData.settings).toEqual(DEFAULT_SETTINGS);
			expect(PluginData.dataVersion).toEqual(DATA_VERSION);
		});

		test("should migrate stored cache from data.json to IndexedDB", async () => {
			const now = new Date();
			const cacheJson = JSON.stringify({
				request: { url: "https://api.github.com/repos/test/test/issues/1" },
				response: { json: { title: "mock" }, headers: {}, status: 200 },
				retrieved: now.getTime(),
				etag: null,
				lastModified: null,
			});
			plugin = new GithubLinkPlugin(app, manifest);
			mockedPlugin(plugin).data = { cache: [cacheJson], dataVersion: DATA_VERSION };
			await plugin.onload();

			// Cache should be accessible
			const entry = getCache().get({ url: "https://api.github.com/repos/test/test/issues/1" });
			expect(entry).not.toBeNull();
			expect(entry?.response.json).toEqual({ title: "mock" });

			// data.json cache should be cleared
			expect(PluginData.cache).toBeUndefined();
		});

		test.each<{ stored: Partial<GithubLinkPluginSettings>; name: string }>([
			{ stored: { defaultPageSize: 69 }, name: "defaultPageSize" },
			{ stored: { tagTooltips: !DEFAULT_SETTINGS.tagTooltips }, name: "tagTooltips" },
			{ stored: { minRequestSeconds: 69 }, name: "minRequestSeconds" },
			{ stored: { logLevel: LogLevel.Debug }, name: "logLevel" },
			{ stored: { showPagination: !DEFAULT_SETTINGS.showPagination }, name: "showPagination" },
			{ stored: { showRefresh: !DEFAULT_SETTINGS.showRefresh }, name: "showRefresh" },
			{ stored: { showExternalLink: !DEFAULT_SETTINGS.showExternalLink }, name: "showExternalLink" },
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
