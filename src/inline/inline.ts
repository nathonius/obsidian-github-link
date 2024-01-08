import { getIssue, getPullRequest, parseUrl } from "../github";

import { PluginSettings } from "../plugin";
import { setIcon } from "obsidian";

// TODO: Split some of this out, there's no reason I should be getting the token when creating this element
export async function createTag(href: string) {
	const parsedUrl = parseUrl(href);

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

	const container = createEl("a", { cls: "gh-link-inline", href });
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
				if (issue.pull_request?.merged_at) {
					icon.dataset.status = "done";
				} else {
					icon.dataset.status = issue.state;
				}
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
				if (pull.merged) {
					icon.dataset.status = "done";
				} else {
					icon.dataset.status = pull.state;
				}
				container.createSpan({
					cls: "gh-link-inline-pr-title",
					text: pull.title,
				});
			}
		}
		// TODO: add support for other stuff here
	}
	return container;
}

export async function InlineRenderer(el: HTMLElement) {
	const githubLinks = el.querySelectorAll<HTMLAnchorElement>(`a.external-link[href^="https://github.com"]`);
	for (const anchor of Array.from(githubLinks)) {
		const container = await createTag(anchor.href);
		anchor.replaceWith(container);
	}
}
