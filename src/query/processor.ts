import { type MarkdownPostProcessorContext } from "obsidian";
import { isTableParams, processParams } from "./params";
import samplePRResponse from "./samplePRResponse";
import { renderTable } from "./output";
import type { SearchIssueResponse } from "src/github/response";

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

	// TODO: Get result

	if (isTableParams(params)) {
		renderTable(params, samplePRResponse as SearchIssueResponse, el);
	}
}
