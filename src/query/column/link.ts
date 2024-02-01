import type { SearchIssueResponse } from "src/github/response";

interface LinkColumnMap<T> {
	prop: string;
	columnLabel: string;
	href: (row: T) => string;
	text: (row: T) => string;
}

export const PullRequestLinkColumns: Record<string, LinkColumnMap<SearchIssueResponse["items"][number]>> = {
	number: {
		prop: "number",
		columnLabel: "PR",
		href: (row) => row.html_url,
		text: (row) => `#${row.number}`,
	},
	repo: {
		prop: "",
	},
};
