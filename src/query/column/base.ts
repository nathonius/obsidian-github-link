/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { parseUrl, repoAPIToBrowserUrl } from "src/github/url-parse";

import { DateFormat } from "src/util";
import type { TableResult } from "../query";
import type { IssueListResponse } from "src/github/response";

export interface ColumnGetter<T> {
	header: string;
	cell: (row: T, el: HTMLTableCellElement) => void | Promise<void>;
}
export type ColumnsMap = Record<string, ColumnGetter<TableResult[number]>>;

export function DateCell(value: string | undefined | null, el: HTMLTableCellElement) {
	el.classList.add("github-link-table-date");
	if (!value) {
		return;
	}

	const asDate = new Date(value);
	if (isNaN(asDate.valueOf())) {
		el.setText(value);
		return;
	}

	// TODO: Allow formatting this date via options.
	el.setText(DateFormat.DATE_SHORT.format(asDate));
}

/**
 * Issue and PR columns share types, so some columns are shared
 */
export const CommonIssuePRColumns: ColumnsMap = {
	number: {
		header: "Number",
		cell: (row, el) => {
			el.classList.add("github-link-table-issue-number");
			el.createEl("a", { text: `#${row.number}`, href: row.html_url, attr: { target: "_blank" } });
		},
	},
	repo: {
		header: "Repo",
		cell: (row, el) => {
			el.classList.add("github-link-table-repo");
			const url = repoAPIToBrowserUrl((row as IssueListResponse[number]).repository_url);
			const parsed = parseUrl(url);
			el.createEl("a", { text: parsed.repo, href: url, attr: { target: "_blank" } });
		},
	},
	author: {
		header: "Author",
		cell: (row, el) => {
			const anchor = el.createEl("a", {
				cls: "github-link-table-author",
				href: row.user?.html_url,
				attr: { target: "_blank" },
			});
			if (row.user?.avatar_url) {
				anchor.createEl("img", { cls: "github-link-table-avatar", attr: { src: row.user.avatar_url } });
			}
			anchor.createSpan({ text: row.user?.login });
		},
	},
	created: {
		header: "Created",
		cell: (row, el) => {
			DateCell(row.created_at, el);
		},
	},
	updated: {
		header: "Updated",
		cell: (row, el) => {
			DateCell(row.updated_at, el);
		},
	},
	closed: {
		header: "Closed",
		cell: (row, el) => {
			DateCell(row.closed_at, el);
		},
	},
};
