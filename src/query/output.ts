import type { SearchIssueResponse, SearchRepoResponse } from "src/github/response";

import type { TableParams } from "./params";

export function renderTable<T extends SearchIssueResponse | SearchRepoResponse>(
	params: TableParams,
	result: T,
	el: HTMLElement,
) {
	const table = el.createEl("table", { cls: "github-link-query-table" });
	const thead = table.createEl("thead");
	for (const col of params.columns) {
		thead.createEl("th", { text: col });
	}
	const tbody = table.createEl("tbody");
	for (const row of result.items) {
		const tr = tbody.createEl("tr");
		for (const col of params.columns) {
			const cell = tr.createEl("td");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			cell.setText((row as any)[col] ?? "");
		}
	}
}
