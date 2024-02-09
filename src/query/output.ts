import { getProp, titleCase } from "src/util";

import type { BaseParams } from "./params";
import { QueryType } from "./params";
import { PullRequestColumns } from "./column/pull-request";
import { IssueColumns } from "./column/issue";
import { RepoColumns } from "./column/repo";

const columns = {
	[QueryType.PullRequest]: PullRequestColumns,
	[QueryType.Issue]: IssueColumns,
	[QueryType.Repo]: RepoColumns,
};

export async function renderTable<T extends { items: unknown[] } | unknown[]>(
	params: BaseParams,
	result: T,
	el: HTMLElement,
) {
	const table = el.createEl("table", { cls: "github-link-table" });
	const thead = table.createEl("thead");
	for (const col of params.columns) {
		const th = thead.createEl("th");
		// Get predefined header if available
		th.setText(columns[params.queryType][col]?.header ?? titleCase(col));
	}
	const tbody = table.createEl("tbody");
	const items = Array.isArray(result) ? result : result.items;
	for (const row of items) {
		const tr = tbody.createEl("tr");
		for (const col of params.columns) {
			const cell = tr.createEl("td");
			const renderer = columns[params.queryType][col];
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
