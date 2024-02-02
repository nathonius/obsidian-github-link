import { setIcon } from "obsidian";
import { IssueStatus } from "./github/response";

export function setPRIcon(icon: HTMLElement, status: IssueStatus) {
	if (status !== IssueStatus.Closed) {
		setIcon(icon, "git-pull-request-arrow");
	} else {
		setIcon(icon, "git-pull-request-closed");
	}
	icon.dataset.status = status;
}
