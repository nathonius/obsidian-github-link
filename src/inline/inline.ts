import { setIcon } from "obsidian";
import { IssueStatus, getIssueStatus, getPRStatus } from "../github/response";
import { setFileIcon, setIssueIcon, setPRIcon, setPRMergeableIcon } from "../icon";

import { PluginSettings } from "../plugin";
import type { PullResponse } from "../github/response";
import { RequestError } from "../util";
import { parseUrl } from "../github/url-parse";
import type { ParsedUrl } from "../github/url-parse";
import { getIssue, getPullRequest } from "../github/github";
import { isAllowedPath } from "../github/urls";

interface TagConfig {
	icon: HTMLSpanElement;
	sections: HTMLElement[];
}

export function createTag(href: string): HTMLAnchorElement | null {
	const parsedUrl = parseUrl(href);
	if (!parsedUrl) {
		return null;
	}

	const container = createEl("a", { cls: "github-link-inline", href, attr: { target: "_blank" } });
	const config: TagConfig = {
		icon: createSpan({ cls: ["github-link-status-icon", "github-link-inline-icon"] }),
		sections: [],
	};

	createIconSection(config);
	createOrgSection(config, parsedUrl);
	createRepoSection(config, parsedUrl);

	// Add issue OR pr OR file
	if (parsedUrl.issue !== undefined || parsedUrl.pr !== undefined || parsedUrl.code !== undefined) {
		// Remove org
		const orgIndex = config.sections.findIndex((section) => section.classList.contains("github-link-inline-org"));
		if (orgIndex !== -1) {
			config.sections.splice(orgIndex, 1);
		}

		if (parsedUrl.issue !== undefined) {
			createIssueSection(config, parsedUrl, container);
		} else if (parsedUrl.pr !== undefined) {
			createPullRequestSection(config, parsedUrl, container);
		} else if (parsedUrl.code !== undefined) {
			createFileSection(config, parsedUrl, container);
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

function createFileSection(config: TagConfig, parsedUrl: ParsedUrl, _container: HTMLAnchorElement) {
	if (parsedUrl.code === undefined) {
		return;
	}
	const fileContainer = createSpan({ cls: "github-link-inline-file" });
	setFileIcon(config.icon);
	config.sections.push(fileContainer);
	if (parsedUrl.code.filename) {
		fileContainer.setText(parsedUrl.code.filename);
	} else if (parsedUrl.code.path) {
		fileContainer.setText(parsedUrl.code.path);
	}
	if (PluginSettings.tagShowFileLineNumber && parsedUrl.code.line) {
		fileContainer.appendChild(createSpan({ cls: "github-link-inline-file-line-number", text: parsedUrl.code.line }));
	}
	if (PluginSettings.tagShowFileBranchName && parsedUrl.code.branch) {
		fileContainer.appendChild(
			createSpan({ cls: "github-link-inline-file-branch", text: `(${parsedUrl.code.branch})` }),
		);
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

export function InlineRenderer(el: HTMLElement) {
	let githubLinks = Array.from(el.querySelectorAll<HTMLAnchorElement>(`a.external-link[href^="https://github.com"]`));

	// Filter out some special URLs from github
	githubLinks = githubLinks.filter((l) => isAllowedPath(l.href));

	for (const anchor of Array.from(githubLinks)) {
		if (anchor.href === anchor.innerText) {
			const container = createTag(anchor.href);
			if (container) {
				anchor.replaceWith(container);
			}
		}
	}
}
