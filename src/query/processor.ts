import type { MarkdownPostProcessorContext } from "obsidian";
import { GithubQuery } from "./query";

export function QueryProcessor(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext): void {
	new GithubQuery(source, el);
}
