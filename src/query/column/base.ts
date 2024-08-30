/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { parseUrl, repoAPIToBrowserUrl } from "../../github/url-parse";

import { DateFormat } from "../../util";
import type { IssueListResponse, UserResponse } from "../../github/response";
import type { TableResult } from "../types";

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

export function UserCell(user: UserResponse, el: HTMLElement): void {
	const anchor = el.createEl("a", {
		cls: "github-link-table-author",
		href: user?.html_url ?? "#",
		attr: { target: "_blank" },
	});
	if (user?.avatar_url) {
		anchor.createEl("img", { cls: "github-link-table-avatar", attr: { src: user.avatar_url } });
	}
	anchor.createSpan({ text: user?.login });
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
			el.createEl("a", { text: parsed?.repo ?? "Repo", href: url, attr: { target: "_blank" } });
		},
	},
	author: {
		header: "Author",
		cell: (row, el) => {
			UserCell(row.user, el);
		},
	},
	assignee: {
		header: "Assignee",
		cell: (row, el) => {
			UserCell(row.assignee, el);
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
	labels: {
		header: "Labels",
		cell: (row, el) => {
			const wrapper = el.createDiv({ cls: "github-link-table-labels" });
			for (const label of row.labels ?? []) {
				// When would the label just be a string?
				if (typeof label !== "string") {
					const labelEl = wrapper.createSpan({
						cls: "github-link-table-label",
						text: label.name,
					});
					if (label.color) {
						labelEl.style.setProperty("--status-color", `#${label.color}`);
					}
				}
			}
		},
	},
};
