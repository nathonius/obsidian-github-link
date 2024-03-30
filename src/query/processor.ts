import { type MarkdownPostProcessorContext } from "obsidian";
import type { TableParams, TableQueryParams } from "./params";
import { QueryType, isTableParams, isTableQueryParams, processParams } from "./params";
import { renderTable } from "./output";
import { searchIssues, getIssuesForRepo, getMyIssues, getPullRequestsForRepo } from "src/github/github";
import type { IssueListParams, IssueSearchParams, PullListParams } from "src/github/response";

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

	const renderFn = async (element: HTMLElement, skipCache = false) => {
		let response: { items: unknown[] } | unknown[] | undefined = undefined;
		if (isTableQueryParams(params)) {
			if (params.queryType === QueryType.Issue || params.queryType === QueryType.PullRequest) {
				const queryParams = params as TableQueryParams<IssueSearchParams>;
				response = await searchIssues(params, params.query, queryParams.org, skipCache);
			}
		} else if (isTableParams(params)) {
			if (params.queryType === QueryType.Issue) {
				const issueParams = params as TableParams<IssueListParams>;
				if (issueParams.org && issueParams.repo) {
					response = await getIssuesForRepo(issueParams, issueParams.org, issueParams.repo, skipCache);
				} else {
					response = await getMyIssues(issueParams, issueParams.org, skipCache);
				}
			} else if (params.queryType === QueryType.PullRequest) {
				const pullParams = params as TableParams<PullListParams>;
				if (pullParams.org && pullParams.repo) {
					response = await getPullRequestsForRepo(pullParams, pullParams.org, pullParams.repo);
				}
			}
		}
		if (response) {
			renderTable(params, response, element, renderFn);
		}
	};
	await renderFn(el);
}
