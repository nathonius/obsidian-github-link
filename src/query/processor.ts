import { type MarkdownPostProcessorContext } from "obsidian";
import { isPullRequestParams, isTableParams, processParams } from "./params";
import { renderTable } from "./output";
import { searchIssues } from "src/github/github";

export async function QueryProcessor(
	source: string,
	el: HTMLElement,
	_ctx: MarkdownPostProcessorContext,
): Promise<void> {
	const params = processParams(source);

	if (!params) {
		// TODO: show an error instead
		el.setText(source);
		return;
	}

	if (isTableParams(params)) {
		if (isPullRequestParams(params)) {
			const response = await searchIssues(params.query);
			renderTable(params, response, el);
		}
	}
}
