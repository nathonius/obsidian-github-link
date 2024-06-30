import type { MarkdownPostProcessorContext } from "obsidian";
import { GithubQuery } from "./query";

export async function QueryProcessor(
	source: string,
	el: HTMLElement,
	_ctx: MarkdownPostProcessorContext,
): Promise<void> {
	const query = new GithubQuery(el);
	await query.init(source);
}
