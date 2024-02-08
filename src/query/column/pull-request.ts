import { getSearchResultIssueStatus, IssueStatus, type SearchIssueResponse } from "src/github/response";
import { CommonIssuePRColumns, type ColumnsMap } from "./base";
import { setPRIcon } from "src/icon";
import { titleCase } from "src/util";

export const PullRequestColumns: ColumnsMap<SearchIssueResponse["items"][number]> = {
	...CommonIssuePRColumns,
	status: {
		header: "Status",
		cell: (row, el) => {
			const wrapper = el.createDiv({ cls: "github-link-table-status" });
			const status = getSearchResultIssueStatus(row);
			const icon = wrapper.createSpan({ cls: "github-link-status-icon" });
			setPRIcon(icon, status);
			wrapper.createSpan({ text: status === IssueStatus.Done ? "Merged" : titleCase(status) });
		},
	},
};
