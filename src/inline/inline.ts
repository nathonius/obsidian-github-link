import { getIssue, getPullRequest } from "../github/github";

import { parseUrl } from "../github/url-parse";
import { setIcon } from "obsidian";

export async function createTag(href: string) {
	const parsedUrl = parseUrl(href);
	const container = createEl("a", { cls: "gh-link-inline-tag", href });

	// Add icon
	const icon = createTagSection(container).createSpan({ cls: "gh-link-inline-tag-icon" });
	setIcon(icon, "github");

	// Add repo
	if (parsedUrl.repo) {
		createTagSection(container).createSpan({
			cls: "gh-link-inline-tag-repo",
			text: parsedUrl.repo,
		});
	}

	// fall back to org if no repo found
	else if (parsedUrl.org) {
		createTagSection(container).createSpan({
			cls: "gh-link-inline-tag-org",
			text: parsedUrl.org,
		});
	}

	if (parsedUrl.repo && parsedUrl.org) {
		// Get issue info
		if (parsedUrl.issue !== undefined) {
			const issue = await getIssue(parsedUrl.org, parsedUrl.repo, parsedUrl.issue);
			if (issue.title) {
				setIcon(icon, "square-dot");
				if (issue.pull_request?.merged_at) {
					icon.dataset.status = "done";
				} else {
					icon.dataset.status = issue.state;
				}
				createTagSection(container).createSpan({
					cls: "gh-link-inline-tag-issue-title",
					text: issue.title,
				});
			}
		}

		// Get PR info
		if (parsedUrl.pr !== undefined) {
			const pull = await getPullRequest(parsedUrl.org, parsedUrl.repo, parsedUrl.pr);
			if (pull.title) {
				setIcon(icon, "git-pull-request-arrow");
				if (pull.merged) {
					icon.dataset.status = "done";
				} else {
					icon.dataset.status = pull.state;
				}
				createTagSection(container).createSpan({
					cls: "gh-link-inline-tag-pr-title",
					text: pull.title,
				});
			}
		}
		// TODO: add support for other stuff here
	}
	return container;
}

function createTagSection(parent: HTMLElement): HTMLElement {
	return parent.createDiv({ cls: "gh-link-inline-tag-section" });
}

export async function InlineRenderer(el: HTMLElement) {
	const githubLinks = el.querySelectorAll<HTMLAnchorElement>(`a.external-link[href^="https://github.com"]`);
	for (const anchor of Array.from(githubLinks)) {
		const container = await createTag(anchor.href);
		anchor.replaceWith(container);
	}
}
