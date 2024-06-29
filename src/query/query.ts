import { parseYaml, setIcon } from "obsidian";
import { searchIssues, getIssuesForRepo, getMyIssues, getPullRequestsForRepo } from "../github/github";
import type {
	IssueListParams,
	IssueListResponse,
	IssueSearchParams,
	IssueSearchResponse,
	MaybePaginated,
	PaginationMeta,
	PullListParams,
	PullListResponse,
} from "../github/response";
import { PluginSettings, logger } from "../plugin";
import { getProp, isEqual, titleCase } from "../util";
import { ALL_COLUMNS, DEFAULT_COLUMNS } from "./column/defaults";

export type TableResult = IssueSearchResponse["items"] | IssueListResponse | PullListResponse;

export enum OutputType {
	Table = "table",
}

export enum QueryType {
	PullRequest = "pull-request",
	Issue = "issue",
	Repo = "repo",
}

export interface BaseParams {
	refresh?: boolean;
}

export function searchSortFromQuery(params: QueryParams): IssueSearchParams["sort"] {
	if (params.sort !== "popularity" && params.sort !== "long-running") {
		return params.sort;
	}
	return undefined;
}

export function issueListSortFromQuery(params: QueryParams): IssueListParams["sort"] {
	if (params.sort && ["created", "updated", "comments"].includes(params.sort)) {
		return params.sort as IssueListParams["sort"];
	}
	return undefined;
}

export function pullListSortFromQuery(params: QueryParams): PullListParams["sort"] {
	if (params.sort && ["created", "updated", "popularity", "long-running"].includes(params.sort)) {
		return params.sort as PullListParams["sort"];
	}
	return undefined;
}

/**
 * Not all fields are supported by all query types
 */
export interface QueryParams {
	outputType: OutputType;
	queryType: QueryType;
	columns: string[];

	/**
	 * Custom query. This will override most other options.
	 */
	query?: string;

	/**
	 * Pagination page size
	 */
	per_page?: number;

	/**
	 * Pagination page number
	 */
	page?: number;

	/**
	 * Repository name
	 */
	repo?: string;

	/**
	 * Organization or user name
	 */
	org?: string;
	milestone?: string;
	state?: "open" | "closed" | "all";
	assignee?: "none" | "*" | string;
	creator?: string;
	mentioned?: string;
	labels?: string | string[];

	/**
	 * "comments" - Issues only
	 * "popularity", "long-running" - Pull requests only
	 * "reactions" and "interactions" - Search only
	 */
	sort?:
		| "created"
		| "updated"
		| "comments"
		| "popularity"
		| "long-running"
		| "reactions"
		| "reactions-+1"
		| "reactions--1"
		| "reactions-smile"
		| "reactions-thinking_face"
		| "reactions-heart"
		| "reactions-tada"
		| "interactions";

	/**
	 * Sort direction, for most queries
	 */
	direction?: "asc" | "desc";
	/**
	 * Sort direction, for search queries
	 */
	order?: "asc" | "desc";
	since?: string;

	/**
	 * Issue filter type
	 */
	filter?: "assigned" | "created" | "mentioned" | "subscribed" | "repos" | "all";

	/**
	 * Pull request branch
	 */
	head?: string;

	/**
	 * Pull request target
	 */
	base?: string;
}

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
		const params = this.params;
		const el = this.hostElement;
		const result = this.result;
		const meta = this.resultMeta;

		el.empty();
		const tableWrapper = el.createDiv({ cls: "github-link-table-wrapper" });
		const tableScrollWrapper = tableWrapper.createDiv({ cls: "github-link-table-scroll-wrapper" });
		const table = tableScrollWrapper.createEl("table", { cls: "github-link-table" });

		// Create footer
		const footer = tableWrapper.createDiv({ cls: "github-link-table-footer" });

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

		// Add pagination to footer if enabled
		logger.debug("Meta for query");
		logger.debug(meta);
		if (PluginSettings.showPagination && this.hasSomeRel(meta)) {
			const pagination = footer.createDiv({ cls: "github-link-table-pagination" });

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

		// TODO: Add this to query params / settings?
		const showRefresh = true;
		if (showRefresh) {
			const refreshButton = footer.createEl("button", {
				cls: "clickable-icon",
				attr: { "aria-label": "Refresh Results" },
			});
			refreshButton.addEventListener("click", () => {
				void this.setParams(this.params, true);
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
		for (const row of result) {
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

	private hasSomeRel(meta: PaginationMeta | null): boolean {
		return Boolean(meta && (meta.first || meta.prev || meta.next || meta.last));
	}

	private getExternalLink(params: QueryParams, result: TableResult): string | null {
		return null;
	}
}
