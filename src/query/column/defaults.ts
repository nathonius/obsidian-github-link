import { QueryType } from "../params";

export const DEFAULT_COLUMNS = {
	[QueryType.Issue]: ["number", "title", "author", "created", "status"],
	[QueryType.PullRequest]: ["number", "title", "author", "created", "status"],
	[QueryType.Repo]: [],
};
