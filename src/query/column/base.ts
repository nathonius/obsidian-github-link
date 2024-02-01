import type { SearchIssueResponse } from "src/github/response";
import { DateFormat } from "src/util";

export interface ColumnGetter<T> {
	header: string;
	cell: (row: T, el: HTMLTableCellElement) => void | Promise<void>;
}
export type ColumnsMap<T> = Record<string, ColumnGetter<T>>;

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
export const CommonIssuePRColumns: ColumnsMap<SearchIssueResponse["items"][number]> = {
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
