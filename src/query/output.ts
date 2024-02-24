import { getProp, titleCase } from "src/util";

import type { BaseParams } from "./params";
import { DEFAULT_COLUMNS } from "./column/defaults";
import { IssueColumns } from "./column/issue";
import { PullRequestColumns } from "./column/pull-request";
import { QueryType } from "./params";
import { RepoColumns } from "./column/repo";

const ALL_COLUMNS = {
	[QueryType.PullRequest]: PullRequestColumns,
	[QueryType.Issue]: IssueColumns,
	[QueryType.Repo]: RepoColumns,
};

export async function renderTable<T extends { items: unknown[] } | unknown[]>(
	params: BaseParams,
	result: T,
	el: HTMLElement,
) {
	const wrapper = el.createDiv({ cls: "github-link-table-wrapper" });
	const table = wrapper.createEl("table", { cls: "github-link-table" });
	const thead = table.createEl("thead");
	let columns = params.columns;
	if (!columns || columns.length === 0) {
		columns = DEFAULT_COLUMNS[params.queryType];
	}
	for (const col of columns) {
		const th = thead.createEl("th");
		// Get predefined header if available
		th.setText(ALL_COLUMNS[params.queryType][col]?.header ?? titleCase(col));
	}
	const tbody = table.createEl("tbody");
	const items = Array.isArray(result) ? result : result.items;
	for (const row of items) {
		const tr = tbody.createEl("tr");
		for (const col of columns) {
			const cell = tr.createEl("td");
			const renderer = ALL_COLUMNS[params.queryType][col];
			if (renderer) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				renderer.cell(row as any, cell);
			} else {
				const cellVal = getProp(row, col);
				if (cellVal !== null) {
					cell.setText(typeof cellVal === "string" ? cellVal : JSON.stringify(cellVal));
				} else {
					cell.setText("");
				}
			}
		}
	}
}
