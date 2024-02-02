import type { SearchIssueResponse } from "src/github/response";
import { CommonIssuePRColumns, type ColumnsMap } from "./base";

export const IssueColumns: ColumnsMap<SearchIssueResponse["items"][number]> = { ...CommonIssuePRColumns };
