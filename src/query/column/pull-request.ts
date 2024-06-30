import { getSearchResultIssueStatus, IssueStatus } from "../../github/response";
import { setPRIcon } from "../../icon";
import { titleCase } from "../../util";
import { CommonIssuePRColumns, type ColumnsMap } from "./base";

export const PullRequestColumns: ColumnsMap = {
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
