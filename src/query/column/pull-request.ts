import { getSearchResultPRStatus, IssueStatus, type SearchIssueResponse } from "src/github/response";
import { parseUrl, repoAPIToBrowserUrl } from "src/github/url-parse";
import { CommonIssuePRColumns, type ColumnsMap } from "./base";
import { setPRIcon } from "src/icon";
import { titleCase } from "src/util";

export const PullRequestColumns: ColumnsMap<SearchIssueResponse["items"][number]> = {
	...CommonIssuePRColumns,
	number: {
		header: "PR",
		cell: (row, el) => {
			el.classList.add("github-link-table-pr");
			el.createEl("a", { text: `#${row.number}`, href: row.html_url });
		},
	},
	repo: {
		header: "Repo",
		cell: (row, el) => {
			el.classList.add("github-link-table-repo");
			const url = repoAPIToBrowserUrl(row.repository_url);
			const parsed = parseUrl(url);
			el.createEl("a", { text: parsed.repo, href: url });
		},
	},
	author: {
		header: "Author",
		cell: (row, el) => {
			const anchor = el.createEl("a", { cls: "github-link-table-author" });
			if (row.user?.avatar_url) {
				anchor.createEl("img", { cls: "github-link-table-avatar", attr: { src: row.user.avatar_url } });
			}
			anchor.createSpan({ text: row.user?.login });
		},
	},
	status: {
		header: "Status",
		cell: (row, el) => {
			const wrapper = el.createDiv({ cls: "github-link-table-status" });
			const status = getSearchResultPRStatus(row);
			const icon = wrapper.createSpan({ cls: "github-link-status-icon" });
			setPRIcon(icon, status);
			wrapper.createSpan({ text: status === IssueStatus.Done ? "Merged" : titleCase(status) });
		},
	},
};
