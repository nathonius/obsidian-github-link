import { MarkdownPostProcessorContext, setIcon } from "obsidian";
import { getIssue, getPullRequest, parseUrl } from "./github";

import { PluginSettings } from "./plugin";

// import { PluginSettings } from "./plugin";

export async function InlineRenderer(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
	const githubLinks = el.querySelectorAll<HTMLAnchorElement>(`a.external-link[href^="https://github.com"]`);
	for (const anchor of Array.from(githubLinks)) {
		const url = anchor.href;
		const parsedUrl = parseUrl(url);

		let token: string | undefined;
		// Try and find the matching token
		if (parsedUrl.org) {
			let account = PluginSettings.accounts.find((acc) => acc.orgs.some((org) => org === parsedUrl.org));
			// Fall back to default token if available
			if (!account && PluginSettings.defaultAccount) {
				account = PluginSettings.accounts.find((acc) => acc.id === PluginSettings.defaultAccount);
			}
			token = account?.token;
		}

		const container = createEl("a", { cls: "gh-link-inline", href: url });
		const icon = container.createSpan({ cls: "gh-link-inline-icon" });
		setIcon(icon, "github"); // TODO: Set correct icon
		if (parsedUrl.repo) {
			container.createSpan({
				cls: "gh-link-inline-repo",
				text: parsedUrl.repo,
			});
		} else if (parsedUrl.org) {
			container.createSpan({
				cls: "gh-link-inline-org",
				text: parsedUrl.org,
			});
		}
		if (parsedUrl.repo && parsedUrl.org) {
			if (parsedUrl.issue !== undefined) {
				const issue = await getIssue(parsedUrl.org, parsedUrl.repo, parsedUrl.issue, token);
				if (issue.title) {
					setIcon(icon, "square-dot");
					container.createSpan({
						cls: "gh-link-inline-issue-title",
						text: issue.title,
					});
				}
			}
			if (parsedUrl.pr !== undefined) {
				const pull = await getPullRequest(parsedUrl.org, parsedUrl.repo, parsedUrl.pr, token);
				if (pull.title) {
					setIcon(icon, "git-pull-request-arrow");
					container.createSpan({
						cls: "gh-link-inline-pr-title",
						text: pull.title,
					});
				}
			}
			// TODO: add support for other stuff here
		}
		anchor.replaceWith(container);
	}
}
