/* eslint-disable unused-imports/no-unused-vars */
import type { Notice } from "obsidian";

export class NoticeMock implements Notice {
	constructor(message: string | DocumentFragment, duration?: number | undefined) {}
	noticeEl!: HTMLElement;
	setMessage(message: string | DocumentFragment): this {
		throw new Error("Method not implemented.");
	}
	hide(): void {
		throw new Error("Method not implemented.");
	}
}
