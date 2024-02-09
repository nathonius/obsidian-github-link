import type { RepoSearchResponse } from "src/github/response";
import type { ColumnsMap } from "./base";

export const RepoColumns: ColumnsMap<RepoSearchResponse["items"][number]> = {};
