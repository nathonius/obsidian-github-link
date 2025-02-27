import { AppMock } from "./obsidian/App";
import { PluginMock } from "./obsidian/Plugin";
import { ModalMock } from "./obsidian/Modal";
import { PluginSettingTabMock } from "./obsidian/PluginSettingTab";
import { NoticeMock } from "./obsidian/Notice";
import { setIconMock } from "./obsidian/setIcon";

module.exports = {
	App: AppMock,
	Plugin: PluginMock,
	Modal: ModalMock,
	PluginSettingTab: PluginSettingTabMock,
	Notice: NoticeMock,
	setIcon: setIconMock,
};
