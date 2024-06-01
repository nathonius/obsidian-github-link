import { getProp, titleCase } from "src/util";

import type { BaseParams } from "./params";
import { DEFAULT_COLUMNS } from "./column/defaults";
import { IssueColumns } from "./column/issue";
import { PluginSettings } from "src/plugin";
import { PullRequestColumns } from "./column/pull-request";
import { QueryType } from "./params";
import { RepoColumns } from "./column/repo";
import type { TableResult } from "./processor";
import { setIcon } from "obsidian";

const ALL_COLUMNS = {
	[QueryType.PullRequest]: PullRequestColumns,
	[QueryType.Issue]: IssueColumns,
	[QueryType.Repo]: RepoColumns,
};

export function renderTable(
	params: BaseParams,
	result: TableResult,
	el: HTMLElement,
	renderFn: (element: HTMLElement, skipCache?: boolean) => Promise<void>,
	externalLink?: string,
) {
	el.empty();
	const tableWrapper = el.createDiv({ cls: "github-link-table-wrapper" });
	const tableScrollWrapper = tableWrapper.createDiv({ cls: "github-link-table-scroll-wrapper" });
	const table = tableScrollWrapper.createEl("table", { cls: "github-link-table" });

	// Create footer
	const footer = tableWrapper.createDiv({ cls: "github-link-table-footer" });

	// Add external link to footer if available
	if (externalLink) {
		footer.createEl("a", {
			cls: "github-link-table-footer-external-link",
			text: "View on GitHub",
			href: externalLink,
		});
	}

	// Add pagination to footer if enabled
	if (PluginSettings.showPagination) {
	}

	if (params.refresh) {
		const refreshButton = footer.createEl("button", {
			cls: "clickable-icon",
			attr: { "aria-label": "Refresh Results" },
		});
		refreshButton.addEventListener("click", () => {
			void renderFn(el, true);
		});
		setIcon(refreshButton, "refresh-cw");
	}

	const thead = table.createEl("thead");
	let columns = params.columns;
	if (!columns || columns.length === 0) {
		columns = DEFAULT_COLUMNS[params.queryType];
	}

	// Ensure columns are lowercase
	columns = columns.map((c) => c.toLowerCase());

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
				void renderer.cell(row, cell);
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

function renderPagination(parent: HTMLDivElement, getPage: (page: number) => void): HTMLDivElement {}
