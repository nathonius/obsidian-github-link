import type { SearchIssueResponse, SearchRepoResponse } from "src/github/response";
import { getProp, titleCase } from "src/util";

import type { TableParams } from "./params";

export function renderTable<T extends SearchIssueResponse | SearchRepoResponse>(
	params: TableParams,
	result: T,
	el: HTMLElement,
) {
	const table = el.createEl("table", { cls: "github-link-query-table" });
	const thead = table.createEl("thead");
	for (const col of params.columns) {
		thead.createEl("th", { text: titleCase(col) });
	}
	const tbody = table.createEl("tbody");
	for (const row of result.items) {
		const tr = tbody.createEl("tr");
		for (const col of params.columns) {
			const cell = tr.createEl("td");
			const cellVal = getProp(row, col);
			if (cellVal !== null) {
				cell.setText(typeof cellVal === "string" ? cellVal : JSON.stringify(cellVal));
			} else {
				cell.setText("");
			}
		}
	}
}
