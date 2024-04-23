/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from "@jest/globals";
import type { Editor } from "codemirror";
import type {
	App,
	Command,
	Component,
	EditorSuggest,
	EventRef,
	HoverLinkSource,
	ObsidianProtocolHandler,
	Plugin,
	PluginManifest,
	ViewCreator,
} from "obsidian";

export class PluginMock implements Plugin {
	public data: any = undefined;
	public intervals: number[] = [];
	public addSettingTab = jest.fn();
	public registerEditorExtension = jest.fn();
	public registerInterval = jest.fn((interval: number) => {
		this.intervals.push(interval);
		return interval;
	});
	public registerMarkdownCodeBlockProcessor = jest.fn(() => {
		return jest.fn(() => Promise.resolve());
	});
	public registerMarkdownPostProcessor = jest.fn(() => {
		return jest.fn(() => Promise.resolve());
	});

	constructor(
		public app: App,
		public manifest: PluginManifest,
	) {}

	addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => any): HTMLElement {
		throw new Error("Method not implemented.");
	}
	addStatusBarItem(): HTMLElement {
		throw new Error("Method not implemented.");
	}
	addCommand(command: Command): Command {
		throw new Error("Method not implemented.");
	}
	registerView(type: string, viewCreator: ViewCreator): void {
		throw new Error("Method not implemented.");
	}
	registerHoverLinkSource(id: string, info: HoverLinkSource): void {
		throw new Error("Method not implemented.");
	}
	registerExtensions(extensions: string[], viewType: string): void {
		throw new Error("Method not implemented.");
	}

	registerCodeMirror(callback: (cm: Editor) => any): void {
		throw new Error("Method not implemented.");
	}

	registerObsidianProtocolHandler(action: string, handler: ObsidianProtocolHandler): void {
		throw new Error("Method not implemented.");
	}
	registerEditorSuggest(editorSuggest: EditorSuggest<any>): void {
		throw new Error("Method not implemented.");
	}
	loadData(): Promise<any> {
		return Promise.resolve(this.data);
	}
	saveData(data: any): Promise<void> {
		this.data = data;
		return Promise.resolve();
	}
	load(): void {
		throw new Error("Method not implemented.");
	}
	onload(): void {
		throw new Error("Method not implemented.");
	}
	unload(): void {
		throw new Error("Method not implemented.");
	}
	onunload(): void {
		throw new Error("Method not implemented.");
	}
	addChild<T extends Component>(component: T): T {
		throw new Error("Method not implemented.");
	}
	removeChild<T extends Component>(component: T): T {
		throw new Error("Method not implemented.");
	}
	register(cb: () => any): void {
		throw new Error("Method not implemented.");
	}
	registerEvent(eventRef: EventRef): void {
		throw new Error("Method not implemented.");
	}
	registerDomEvent<K extends keyof WindowEventMap>(
		el: Window,
		type: K,
		callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions | undefined,
	): void;
	registerDomEvent<K extends keyof DocumentEventMap>(
		el: Document,
		type: K,
		callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions | undefined,
	): void;
	registerDomEvent<K extends keyof HTMLElementEventMap>(
		el: HTMLElement,
		type: K,
		callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions | undefined,
	): void;
	registerDomEvent(el: unknown, type: unknown, callback: unknown, options?: unknown): void {
		throw new Error("Method not implemented.");
	}
}
