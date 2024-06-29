import type { IssueListResponse, IssueSearchResponse } from "src/github/response";
import { getSearchResultIssueStatus } from "src/github/response";
import { CommonIssuePRColumns, type ColumnsMap } from "./base";
import { setIssueIcon } from "src/icon";
import { titleCase } from "src/util";
import { createTag } from "src/inline/inline";
import { getPRForIssue } from "src/github/github";

export const IssueColumns: ColumnsMap = {
	...CommonIssuePRColumns,
	status: {
		header: "Status",
		cell: (row, el) => {
			const wrapper = el.createDiv({ cls: "github-link-table-status" });
			const status = getSearchResultIssueStatus(row);
			const icon = wrapper.createSpan({ cls: "github-link-status-icon" });
			setIssueIcon(icon, status);
			wrapper.createSpan({
				text:
					(row as IssueSearchResponse["items"][number]).state_reason === "not_planned"
						? "Not Planned"
						: titleCase(status),
			});
		},
	},
	pr: {
		header: "PR",
		cell: async (_row, el) => {
			const row = _row as IssueListResponse[number];
			// TODO: Figure out how to include org here for private repos
			if (!row.timeline_url) {
				return;
			}
			const pullRequestUrl = await getPRForIssue(row.timeline_url);
			if (!pullRequestUrl) {
				return;
			}
			const tag = createTag(pullRequestUrl);
			el.appendChild(tag);
		},
	},
};
