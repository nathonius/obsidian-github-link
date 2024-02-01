import type { SearchRepoResponse } from "src/github/response";
import type { ColumnsMap } from "./base";

export const RepoColumns: ColumnsMap<SearchRepoResponse["items"][number]> = {};
