import type { QueryType } from "../types";
import { IssueColumns } from "./issue";
import { PullRequestColumns } from "./pull-request";
import { RepoColumns } from "./repo";

/*
We have to do this workaround with the QueryType enum because ts-jest does not support
using constant enums like this; see https://github.com/kulshekhar/ts-jest/pull/308/files
*/

export const DEFAULT_COLUMNS = {
	["issue" as QueryType]: ["number", "title", "author", "created", "status"],
	["pull-request" as QueryType]: ["number", "title", "author", "created", "status"],
	["repo" as QueryType]: [],
};

export const ALL_COLUMNS = {
	["issue" as QueryType]: IssueColumns,
	["pull-request" as QueryType]: PullRequestColumns,
	["repo" as QueryType]: RepoColumns,
};
