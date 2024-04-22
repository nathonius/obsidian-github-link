import { expect, jest, test } from "@jest/globals";
import { GithubLinkPlugin } from "./plugin";
import { describe } from "node:test";
import { App } from "obsidian";
import * as manifest from "../manifest.json";

jest.mock("./settings/settings-tab");

describe("GithubLinkPlugin", () => {
	test("Should create", () => {
		const app = new App();
		const plugin = new GithubLinkPlugin(app, manifest);
		expect(plugin).toBeTruthy();
	});
});
