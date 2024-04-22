import type { PullResponse } from "src/github/response";
import { IssueStatus, getIssueStatus, getPRStatus } from "src/github/response";
import { getIssue, getPullRequest } from "../github/github";

import type { ParsedUrl } from "../github/url-parse";
import { parseUrl } from "../github/url-parse";
import { setIcon } from "obsidian";
import { setIssueIcon, setPRIcon, setPRMergeableIcon } from "src/icon";
import { PluginSettings } from "src/plugin";
import { RequestError } from "src/util";

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

	createIconSection(config);
	createOrgSection(config, parsedUrl);
	createRepoSection(config, parsedUrl);

	// Add issue OR pr
	if (parsedUrl.issue !== undefined || parsedUrl.pr !== undefined) {
		// Remove org
		const orgIndex = config.sections.findIndex((section) => section.classList.contains("github-link-inline-org"));
		if (orgIndex !== -1) {
			config.sections.splice(orgIndex, 1);
		}

		if (parsedUrl.issue !== undefined) {
			createIssueSection(config, parsedUrl, container);
		} else if (parsedUrl.pr !== undefined) {
			createPullRequestSection(config, parsedUrl, container);
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

function createIconSection(config: TagConfig) {
	// Set default icon
	config.sections.push(config.icon);
	setIcon(config.icon, "github");
}

function createOrgSection(config: TagConfig, parsedUrl: ParsedUrl) {
	// Add org
	if (parsedUrl.org) {
		config.sections.push(
			createSpan({
				cls: "github-link-inline-org",
				text: parsedUrl.org,
			}),
		);
	}
}

function createRepoSection(config: TagConfig, parsedUrl: ParsedUrl) {
	// Add repo
	if (parsedUrl.repo) {
		config.sections.push(
			createSpan({
				cls: "github-link-inline-repo",
				text: parsedUrl.repo,
			}),
		);
	}
}

function createIssueSection(config: TagConfig, parsedUrl: ParsedUrl, container: HTMLAnchorElement) {
	if (parsedUrl.issue === undefined) {
		return;
	}
	setIssueIcon(config.icon, IssueStatus.Open);
	const issueContainer = createSpan({
		cls: "github-link-inline-issue-title",
		text: `${parsedUrl.issue}`,
	});
	config.sections.push(issueContainer);
	if (parsedUrl.org && parsedUrl.repo) {
		getIssue(parsedUrl.org, parsedUrl.repo, parsedUrl.issue)
			.then((issue) => {
				if (issue.title) {
					const status = getIssueStatus(issue);
					setIssueIcon(config.icon, status);
					issueContainer.setText(issue.title);
				}
			})
			.catch((err) => {
				createErrorSection(config, container, err);
			});
	}
}

function createPullRequestSection(config: TagConfig, parsedUrl: ParsedUrl, container: HTMLAnchorElement) {
	if (parsedUrl.pr === undefined) {
		return;
	}
	setPRIcon(config.icon, IssueStatus.Open);
	const prContainer = createSpan({
		cls: "github-link-inline-pr-title",
		text: `${parsedUrl.pr}`,
	});
	config.sections.push(prContainer);
	if (parsedUrl.org && parsedUrl.repo) {
		getPullRequest(parsedUrl.org, parsedUrl.repo, parsedUrl.pr)
			.then((pr) => {
				if (pr.title) {
					const status = getPRStatus(pr);
					setPRIcon(config.icon, status);
					prContainer.setText(pr.title);
				}
				createPullRequestMergeableSection(config, pr, container);
			})
			.catch((err) => {
				createErrorSection(config, container, err);
			});
	}
}

/**
 * Note that this function is called AFTER the tag has been built, so it adds itself to the dom.
 */
function createPullRequestMergeableSection(config: TagConfig, pullRequest: PullResponse, container: HTMLElement): void {
	if (!PluginSettings.tagShowPRMergeable || pullRequest.mergeable === null) {
		return;
	}
	const mergeableIcon = createSpan({ cls: ["github-link-inline-pr-mergeable-icon", "github-link-inline-icon"] });
	setPRMergeableIcon(mergeableIcon, pullRequest.mergeable);
	config.sections.push(mergeableIcon);
	container.appendChild(createTagSection(mergeableIcon));
}

function createErrorSection(config: TagConfig, container: HTMLAnchorElement, error: unknown) {
	const errorIcon = createSpan({
		cls: ["github-link-inline-error-icon", "github-link-inline-icon"],
	});
	setIcon(errorIcon, "lucide-alert-triangle");
	if (error instanceof RequestError) {
		errorIcon.ariaLabel = error.message;
	}
	config.sections.push(errorIcon);
	container.appendChild(createTagSection(errorIcon));
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
