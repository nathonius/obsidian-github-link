import { getSearchResultIssueStatus, type IssueSearchResponse } from "src/github/response";
import { CommonIssuePRColumns, type ColumnsMap } from "./base";
import { setIssueIcon } from "src/icon";
import { titleCase } from "src/util";
import { createTag } from "src/inline/inline";
import { getPRForIssue } from "src/github/github";

export const IssueColumns: ColumnsMap<IssueSearchResponse["items"][number]> = {
	...CommonIssuePRColumns,
	status: {
		header: "Status",
		cell: (row, el) => {
			const wrapper = el.createDiv({ cls: "github-link-table-status" });
			const status = getSearchResultIssueStatus(row);
			const icon = wrapper.createSpan({ cls: "github-link-status-icon" });
			setIssueIcon(icon, status, row.state_reason);
			wrapper.createSpan({ text: row.state_reason === "not_planned" ? "Not Planned" : titleCase(status) });
		},
	},
	pr: {
		header: "PR",
		cell: async (row, el) => {
			// TODO: Figure out how to include org here for private repos
			if (!row.timeline_url) {
				return;
			}
			console.log(row);
			const pullRequestUrl = await getPRForIssue(row.timeline_url);
			if (!pullRequestUrl) {
				return;
			}
			const tag = await createTag(pullRequestUrl);
			el.appendChild(tag);
		},
	},
};
