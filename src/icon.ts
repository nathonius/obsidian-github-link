import { setIcon } from "obsidian";
import { IssueStatus } from "./github/response";
import { PluginSettings } from "./plugin";

const PRIcon: Readonly<Record<IssueStatus, string>> = {
	[IssueStatus.Open]: "lucide-git-pull-request-arrow",
	[IssueStatus.Closed]: "lucide-git-pull-request-closed",
	[IssueStatus.Done]: "lucide-git-merge",
};

const PRStatusText: Readonly<Record<IssueStatus, string>> = {
	[IssueStatus.Open]: "Pull request open",
	[IssueStatus.Closed]: "Pull request closed",
	[IssueStatus.Done]: "Pull request merged",
};

const IssueIcon: Readonly<Record<IssueStatus, string>> = {
	[IssueStatus.Open]: "lucide-circle-dot",
	[IssueStatus.Closed]: "lucide-circle-slash",
	[IssueStatus.Done]: "lucide-check-circle",
};

const IssueStatusText: Readonly<Record<IssueStatus, string>> = {
	[IssueStatus.Open]: "Issue open",
	[IssueStatus.Closed]: "Issue closed as not planned",
	[IssueStatus.Done]: "Issue closed as completed",
};

export function setPRIcon(icon: HTMLElement, status: IssueStatus) {
	if (PluginSettings.tagTooltips) {
		icon.setAttribute("aria-label", PRStatusText[status]);
	}

	setIcon(icon, PRIcon[status]);
	icon.classList.add("pull-request");
	icon.dataset.status = status;
}

export function setIssueIcon(icon: HTMLElement, status: IssueStatus) {
	if (PluginSettings.tagTooltips) {
		icon.setAttribute("aria-label", IssueStatusText[status]);
	}

	setIcon(icon, IssueIcon[status]);
	icon.classList.add("issue");
	icon.dataset.status = status;
}
