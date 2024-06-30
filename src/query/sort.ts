import type { IssueSearchParams, IssueListParams, PullListParams } from "../github/response";
import type { QueryParams } from "./types";

/**
 * Utility function to transform generic param sort into sort for issue search
 */
export function searchSortFromQuery(params: QueryParams): IssueSearchParams["sort"] {
	if (params.sort !== "popularity" && params.sort !== "long-running") {
		return params.sort;
	}
	return undefined;
}

/**
 * Utility function to transform generic param sort into sort for issue list
 */
export function issueListSortFromQuery(params: QueryParams): IssueListParams["sort"] {
	if (params.sort && ["created", "updated", "comments"].includes(params.sort)) {
		return params.sort as IssueListParams["sort"];
	}
	return undefined;
}

/**
 * Utility function to transform generic param sort into sort for pull list
 */
export function pullListSortFromQuery(params: QueryParams): PullListParams["sort"] {
	if (params.sort && ["created", "updated", "popularity", "long-running"].includes(params.sort)) {
		return params.sort as PullListParams["sort"];
	}
	return undefined;
}
