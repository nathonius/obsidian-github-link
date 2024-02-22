import { getPRStatus } from "src/github/response";
import { getIssue, getPullRequest } from "../github/github";

import { parseUrl } from "../github/url-parse";
import { setIcon } from "obsidian";
import { setPRIcon } from "src/icon";

export async function createTag(href: string) {
	const parsedUrl = parseUrl(href);
	const container = createEl("a", { cls: "github-link-inline", href });

	// Add icon
	const icon = createTagSection(container).createSpan({
		cls: ["github-link-status-icon", "github-link-inline-icon"],
	});
	setIcon(icon, "github");

	// Add repo
	if (parsedUrl.repo) {
		createTagSection(container).createSpan({
			cls: "github-link-inline-repo",
			text: parsedUrl.repo,
		});
	}

	// fall back to org if no repo found
	else if (parsedUrl.org) {
		createTagSection(container).createSpan({
			cls: "github-link-inline-org",
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
					cls: "github-link-inline-issue-title",
					text: issue.title,
				});
			}
		}

		// Get PR info
		if (parsedUrl.pr !== undefined) {
			const pull = await getPullRequest(parsedUrl.org, parsedUrl.repo, parsedUrl.pr);
			if (pull.title) {
				const status = getPRStatus(pull);
				setPRIcon(icon, status);
				createTagSection(container).createSpan({
					cls: "github-link-inline-pr-title",
					text: pull.title,
				});
			}
		}
		// TODO: add support for other stuff here
	}
	return container;
}

function createTagSection(parent: HTMLElement): HTMLElement {
	return parent.createDiv({ cls: "github-link-inline-section" });
}

export async function InlineRenderer(el: HTMLElement) {
	const githubLinks = el.querySelectorAll<HTMLAnchorElement>(`a.external-link[href^="https://github.com"]`);
	for (const anchor of Array.from(githubLinks)) {
		if (anchor.href === anchor.innerText) {
			const container = await createTag(anchor.href);
			anchor.replaceWith(container);
		}
	}
}
