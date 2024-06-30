import { parseYaml, setIcon } from "obsidian";
import { searchIssues, getIssuesForRepo, getMyIssues, getPullRequestsForRepo } from "../github/github";
import type { MaybePaginated, PaginationMeta } from "../github/response";
import { PluginSettings } from "../plugin";
import { getProp, isEqual, titleCase } from "../util";
import { ALL_COLUMNS, DEFAULT_COLUMNS } from "./column/defaults";
import type { QueryParams, TableResult } from "./types";
import { OutputType, QueryType } from "./types";

export class GithubQuery {
	private params!: QueryParams;
	private result: TableResult | null = null;
	private resultMeta: PaginationMeta | null = null;

	constructor(private readonly hostElement: HTMLElement) {}

	public async init(source: string): Promise<void> {
		const parsedParams = this.parseCodeblock(source);
		if (!parsedParams) {
			console.error(`Github Link: simplistic parsing failed`);
		} else {
			await this.setParams(parsedParams);
		}
	}

	/**
	 * Setting the parameters triggers calling the API
	 */
	public async setParams(newParams: QueryParams = this.params, forceUpdate = false): Promise<void> {
		const currentParams = this.params;
		this.params = newParams;
		if (forceUpdate || !isEqual(currentParams, newParams)) {
			const result = await this.executeQuery(forceUpdate);
			if (result) {
				this.setResult(result.response, result.meta);
			}
		}
	}

	public setResult(result: TableResult, meta: PaginationMeta): void {
		this.result = result;
		this.resultMeta = meta;
		this.render();
	}

	public parseCodeblock(source: string): QueryParams | null {
		let params: QueryParams | null;
		try {
			params = parseYaml(source) as QueryParams;
		} catch (e) {
			console.error(`Github Link: YAML Parsing failed, attempting simplistic parsing`);
			console.error(e);
			params = Object.fromEntries(source.split("\n").map((l) => l.split(/:\s?/))) as QueryParams;
		}
		return params ?? null;
	}

	public async executeQuery(skipCache = false): Promise<MaybePaginated<TableResult> | null> {
		const params = this.params;
		if (params.outputType === OutputType.Table) {
			// Custom Query
			if (params.query && (params.queryType === QueryType.Issue || params.queryType === QueryType.PullRequest)) {
				const { meta, response } = await searchIssues(params, params.query, params.org, skipCache);
				return { meta, response: response.items };
			}
			// Issue query with org and repo provided
			else if (params.queryType === QueryType.Issue && params.org && params.repo) {
				return await getIssuesForRepo(params, params.org, params.repo, skipCache);
			}
			// Issue query without org or repo provided
			else if (params.queryType === QueryType.Issue) {
				return await getMyIssues(params, params.org, skipCache);
			}
			// Pull request query with org and repo provided
			else if (params.queryType === QueryType.PullRequest && params.org && params.repo) {
				return await getPullRequestsForRepo(params, params.org, params.repo, skipCache);
			}
		}
		return null;
	}

	public render(): void {
		if (!this.result) {
			throw new Error("Attempted to render table before there was a result.");
		}

		this.hostElement.empty();
		const tableWrapper = this.hostElement.createDiv({ cls: "github-link-table-wrapper" });
		const tableScrollWrapper = tableWrapper.createDiv({ cls: "github-link-table-scroll-wrapper" });
		const table = tableScrollWrapper.createEl("table", { cls: "github-link-table" });

		const queryType = this.params.queryType;

		// Use default columns if none are provided
		let columns = this.params.columns;
		if (!columns || columns.length === 0) {
			columns = DEFAULT_COLUMNS[queryType];
		}

		// Ensure columns are lowercase
		columns = columns.map((c) => c.toLowerCase());

		// Render
		this.renderFooter(this.params, this.result, this.resultMeta, tableWrapper);
		this.renderHeader(table, queryType, columns);
		this.renderBody(table, queryType, columns, this.result);
	}

	private renderHeader(table: HTMLTableElement, queryType: QueryType, columns: string[]): void {
		const thead = table.createEl("thead");
		for (const col of columns) {
			const th = thead.createEl("th");
			// Get predefined header if available, otherwise try and create a title
			th.setText(ALL_COLUMNS[queryType][col]?.header ?? titleCase(col));
		}
	}

	private renderBody(table: HTMLTableElement, queryType: QueryType, columns: string[], result: TableResult): void {
		const tbody = table.createEl("tbody");
		for (const row of result) {
			const tr = tbody.createEl("tr");
			for (const col of columns) {
				this.renderCell(tr, queryType, col, row);
			}
		}
	}

	private renderCell(tr: HTMLTableRowElement, queryType: QueryType, column: string, row: TableResult[number]): void {
		const cell = tr.createEl("td");
		const renderer = ALL_COLUMNS[queryType][column];
		if (renderer) {
			void renderer.cell(row, cell);
		} else {
			const cellVal = getProp(row, column);
			if (cellVal !== null) {
				cell.setText(typeof cellVal === "string" ? cellVal : JSON.stringify(cellVal));
			} else {
				cell.setText("");
			}
		}
	}

	private renderFooter(
		params: QueryParams,
		result: TableResult,
		meta: PaginationMeta | null,
		parent: HTMLElement,
	): void {
		const footer = parent.createDiv({ cls: "github-link-table-footer" });

		// Add external link to footer if available
		const externalLink = this.getExternalLink(params, result);
		if (externalLink) {
			footer.createEl("a", {
				cls: "github-link-table-footer-external-link",
				text: "View on GitHub",
				href: externalLink,
				attr: { target: "_blank" },
			});
		}

		this.renderPagination(meta, footer);

		if (PluginSettings.showRefresh) {
			const refreshButton = footer.createEl("button", {
				cls: "clickable-icon",
				attr: { "aria-label": "Refresh Results" },
			});
			refreshButton.addEventListener("click", () => {
				void this.setParams(this.params, true);
			});
			setIcon(refreshButton, "refresh-cw");
		}
	}

	private renderPagination(meta: PaginationMeta | null, parent: HTMLElement): void {
		if (PluginSettings.showPagination && this.hasSomeRel(meta)) {
			const pagination = parent.createDiv({ cls: "github-link-table-pagination" });

			// First, previous
			if (meta?.first && (!meta.prev || meta.prev.page !== meta.first.page)) {
				const first = pagination.createEl("a", { text: "<<", href: "#", attr: { role: "button" } });
				first.addEventListener("click", () => {
					void this.setParams({ ...this.params, page: meta.first?.page });
				});
			}
			if (meta?.prev) {
				const prev = pagination.createEl("a", { text: meta.prev.page.toString(), href: "#", attr: { role: "button" } });
				prev.addEventListener("click", () => {
					void this.setParams({ ...this.params, page: meta.prev?.page });
				});
			}

			// Current Page
			pagination.createSpan({ text: (this.params.page ?? 1).toString() });

			// Next, last
			if (meta?.next) {
				const next = pagination.createEl("a", { text: meta.next.page.toString(), href: "#", attr: { role: "button" } });
				next.addEventListener("click", () => {
					void this.setParams({ ...this.params, page: meta.next?.page });
				});
			}
			if (meta?.last && (!meta.next || meta.next.page !== meta.last.page)) {
				const last = pagination.createEl("a", { text: ">>", href: "#", attr: { role: "button" } });
				last.addEventListener("click", () => {
					void this.setParams({ ...this.params, page: meta.last?.page });
				});
			}
		}
	}

	private hasSomeRel(meta: PaginationMeta | null): boolean {
		return Boolean(meta && (meta.first || meta.prev || meta.next || meta.last));
	}

	// TODO: implement this
	private getExternalLink(params: QueryParams, result: TableResult): string | null {
		return null;
	}
}
