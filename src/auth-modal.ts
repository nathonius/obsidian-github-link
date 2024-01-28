import { Modal, setIcon } from "obsidian";

import type { App } from "obsidian";
import type { Verification } from "@octokit/auth-oauth-device/dist-types/types";

export class AuthModal extends Modal {
	constructor(
		app: App,
		private readonly verification: Verification,
	) {
		super(app);
	}
	onOpen(): void {
		this.titleEl.setText("Generate GitHub token");
		this.contentEl.empty();
		const wrapper = this.contentEl.createDiv({ cls: "gh-auth-modal" });
		wrapper.createEl("p", {
			text: "Copy the following code and paste it at the GitHub link below.",
		});
		const codeEl = wrapper.createDiv({
			cls: "gh-auth-code-section",
		});
		codeEl.createSpan({
			cls: "auth-code",
			text: this.verification.user_code,
		});
		const button = codeEl.createEl("button", {
			attr: { type: "button", "aria-label": "Copy Code" },
		});
		setIcon(button, "copy");
		button.addEventListener("click", this.copyToClipboard.bind(this));
		wrapper.createEl("a", {
			href: this.verification.verification_uri,
			text: this.verification.verification_uri,
		});
	}

	private copyToClipboard() {
		window.navigator.clipboard.writeText(this.verification.user_code);
	}
}
