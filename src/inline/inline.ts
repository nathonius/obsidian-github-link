import { IssueStatus, getIssueStatus, getPRStatus } from "src/github/response";
import { getIssue, getPullRequest } from "../github/github";

import { parseUrl } from "../github/url-parse";
import { setIcon } from "obsidian";
import { setIssueIcon, setPRIcon } from "src/icon";

interface TagConfig {
	icon: HTMLSpanElement;
	sections: HTMLElement[];
}

export function createTag(href: string): HTMLAnchorElement {
	const parsedUrl = parseUrl(href);
	const container = createEl("a", { cls: "github-link-inline", href });
	const config: TagConfig = {
		icon: createSpan({ cls: ["github-link-status-icon", "github-link-inline-icon"] }),
		sections: [],
	};

	// Set default icon
	config.sections.push(config.icon);
	setIcon(config.icon, "github");

	// Add org
	if (parsedUrl.org) {
		config.sections.push(
			createSpan({
				cls: "github-link-inline-org",
				text: parsedUrl.org,
			}),
		);
	}

	// Add repo
	if (parsedUrl.repo) {
		config.sections.push(
			createSpan({
				cls: "github-link-inline-repo",
				text: parsedUrl.repo,
			}),
		);
	}

	// Add issue OR pr
	if (parsedUrl.issue !== undefined || parsedUrl.pr !== undefined) {
		// Remove org
		const orgIndex = config.sections.findIndex((section) => section.classList.contains("github-link-inline-org"));
		if (orgIndex !== -1) {
			config.sections.splice(orgIndex, 1);
		}

		if (parsedUrl.issue !== undefined) {
			setIssueIcon(config.icon, IssueStatus.Open);
			const issueContainer = createSpan({
				cls: "github-link-inline-issue-title",
				text: `${parsedUrl.issue}`,
			});
			config.sections.push(issueContainer);
			if (parsedUrl.org && parsedUrl.repo) {
				getIssue(parsedUrl.org, parsedUrl.repo, parsedUrl.issue).then((issue) => {
					if (issue.title) {
						const status = getIssueStatus(issue);
						setIssueIcon(config.icon, status);
						issueContainer.setText(issue.title);
					}
				});
			}
		} else if (parsedUrl.pr !== undefined) {
			// Get PR info
			setPRIcon(config.icon, IssueStatus.Open);
			const prContainer = createSpan({
				cls: "github-link-inline-pr-title",
				text: `${parsedUrl.pr}`,
			});
			config.sections.push(prContainer);
			if (parsedUrl.org && parsedUrl.repo) {
				getPullRequest(parsedUrl.org, parsedUrl.repo, parsedUrl.pr).then((pr) => {
					if (pr.title) {
						const status = getPRStatus(pr);
						setPRIcon(config.icon, status);
						prContainer.setText(pr.title);
					}
				});
			}
		}
	}

	// Add all sections
	for (const section of config.sections) {
		container.appendChild(createTagSection(section));
	}

	return container;
}

function createTagSection(...children: HTMLElement[]): HTMLDivElement {
	const section = createDiv({ cls: "github-link-inline-section" });
	section.append(...children);
	return section;
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
