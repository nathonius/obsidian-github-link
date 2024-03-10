import { setIcon } from "obsidian";
import { IssueStatus } from "./github/response";

const PRIcon: Readonly<Record<IssueStatus, string>> = {
	[IssueStatus.Open]: "lucide-git-pull-request-arrow",
	[IssueStatus.Closed]: "lucide-git-pull-request-closed",
	[IssueStatus.Done]: "lucide-git-merge",
};

const IssueIcon: Readonly<Record<IssueStatus, string>> = {
	[IssueStatus.Open]: "lucide-circle-dot",
	[IssueStatus.Closed]: "lucide-circle-slash",
	[IssueStatus.Done]: "lucide-check-circle",
};

export function setPRIcon(icon: HTMLElement, status: IssueStatus) {
	setIcon(icon, PRIcon[status]);
	icon.dataset.status = status;
}

export function setIssueIcon(icon: HTMLElement, status: IssueStatus) {
	setIcon(icon, IssueIcon[status]);
	icon.dataset.status = status;
}
