import type { ColumnsMap } from "./base";
import type { RepoSearchResponse } from "src/github/response";

export const RepoColumns: ColumnsMap<RepoSearchResponse["items"][number]> = {};
