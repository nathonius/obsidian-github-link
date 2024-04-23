import type { App, PluginSettingTab, Plugin } from "obsidian";

export class PluginSettingTabMock implements PluginSettingTab {
	constructor(
		public app: App,
		public plugin: Plugin,
	) {}
	get containerEl(): HTMLElement {
		throw new Error("Not implemented.");
	}
	display() {
		throw new Error("Method not implemented.");
	}
	hide() {
		throw new Error("Method not implemented.");
	}
}
