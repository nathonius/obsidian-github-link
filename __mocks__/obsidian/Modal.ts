import type { App, Scope, Modal } from "obsidian";

export class ModalMock implements Modal {
	constructor(public app: App) {}
	get scope(): Scope {
		throw new Error("Not implemented.");
	}
	get containerEl(): HTMLElement {
		throw new Error("Not implemented.");
	}
	get modalEl(): HTMLElement {
		throw new Error("Not implemented.");
	}
	get titleEl(): HTMLElement {
		throw new Error("Not implemented.");
	}
	get contentEl(): HTMLElement {
		throw new Error("Not implemented.");
	}
	shouldRestoreSelection: boolean = false;
	open(): void {
		throw new Error("Method not implemented.");
	}
	close(): void {
		throw new Error("Method not implemented.");
	}
	onOpen(): void {
		throw new Error("Method not implemented.");
	}
	onClose(): void {
		throw new Error("Method not implemented.");
	}
}
