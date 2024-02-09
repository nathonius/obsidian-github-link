import { type MarkdownPostProcessorContext } from "obsidian";
import type { TableParams } from "./params";
import { QueryType, isTableParams, isTableQueryParams, processParams } from "./params";
import { renderTable } from "./output";
import { searchIssues, getIssuesForRepo, getMyIssues, getPullRequestsForRepo } from "src/github/github";
import type { IssueListParams, PullListParams } from "src/github/response";

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

	if (isTableQueryParams(params)) {
		if (params.queryType === QueryType.Issue || params.queryType === QueryType.PullRequest) {
			const response = await searchIssues(params.query);
			renderTable(params, response, el);
		}
	} else if (isTableParams(params)) {
		if (params.queryType === QueryType.Issue) {
			const issueParams = params as TableParams<IssueListParams>;
			if (issueParams.org && issueParams.repo) {
				const response = await getIssuesForRepo(issueParams, issueParams.org, issueParams.repo);
				renderTable(params, response, el);
			} else {
				const response = await getMyIssues(issueParams, issueParams.org);
				renderTable(params, response, el);
			}
		} else if (params.queryType === QueryType.PullRequest) {
			console.log("Rendering pull table...");
			const pullParams = params as TableParams<PullListParams>;
			if (pullParams.org && pullParams.repo) {
				const response = await getPullRequestsForRepo(pullParams, pullParams.org, pullParams.repo);
				console.log("Got PRs");
				console.log(response);
				renderTable(params, response, el);
			}
		}
	}
}
