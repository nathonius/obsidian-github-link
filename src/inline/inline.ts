import { IssueStatus, getIssueStatus, getPRStatus } from "src/github/response";
import { getIssue, getPullRequest } from "../github/github";

import { parseUrl } from "../github/url-parse";
import { setIcon } from "obsidian";
import { setIssueIcon, setPRIcon } from "src/icon";

export function createTag(href: string) {
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
			setIssueIcon(icon, IssueStatus.Open);
			const issueContainer = createTagSection(container).createSpan({
				cls: "github-link-inline-issue-title",
				text: `${parsedUrl.issue}`,
			});
			getIssue(parsedUrl.org, parsedUrl.repo, parsedUrl.issue).then((issue) => {
				if (issue.title) {
					const status = getIssueStatus(issue);
					setIssueIcon(icon, status);
					issueContainer.setText(issue.title);
				}
			});
		}

		// Get PR info
		if (parsedUrl.pr !== undefined) {
			setPRIcon(icon, IssueStatus.Open);
			const prContainer = createTagSection(container).createSpan({
				cls: "github-link-inline-pr-title",
				text: `${parsedUrl.pr}`,
			});
			getPullRequest(parsedUrl.org, parsedUrl.repo, parsedUrl.pr).then((pr) => {
				if (pr.title) {
					const status = getPRStatus(pr);
					setPRIcon(icon, status);
					prContainer.setText(pr.title);
				}
			});
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
			const container = createTag(anchor.href);
			anchor.replaceWith(container);
		}
	}
}
