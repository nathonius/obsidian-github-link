import { test, describe, expect, beforeAll } from "@jest/globals";
import { elementTestSetup } from "../../test/element";
import { createTag } from "./inline";

const selectors = {
	org: ".github-link-inline-org",
	repo: ".github-link-inline-repo",
	issueTitle: ".github-link-inline-issue-title",
	prTitle: ".github-link-inline-pr-title",
	file: ".github-link-inline-file",
};

describe("createTag", () => {
	beforeAll(() => {
		elementTestSetup();
	});
	test.each([
		{ url: "https://github.com/nathonius", user: "nathonius" },
		{ url: "https://github.com/nathonius/", user: "nathonius" },
		{ url: "https://github.com/sam.lake", user: "sam.lake" },
		{ url: "https://github.com/abraham_lincoln", user: "abraham_lincoln" },
	])("user only $user", ({ url, user }) => {
		const tag = createTag(url);
		expect(tag).toBeTruthy();
		const org = tag?.querySelector(selectors.org) as HTMLSpanElement;
		expect(org.innerText).toEqual(user);
		[selectors.repo, selectors.issueTitle, selectors.prTitle, selectors.file].forEach((s) => {
			expect(tag?.querySelector(s)).toBeFalsy();
		});
	});

	test.each([
		{ url: "https://github.com/nathonius/obsidian-github-link", user: "nathonius", repo: "obsidian-github-link" },
		{ url: "https://github.com/nathonius/obsidian.github.link", user: "nathonius", repo: "obsidian.github.link" },
	])("repo $repo", ({ url, user, repo }) => {
		const tag = createTag(url);
		expect(tag).toBeTruthy();
		const org = tag?.querySelector(selectors.org) as HTMLSpanElement;
		const repoEl = tag?.querySelector(selectors.repo) as HTMLSpanElement;
		expect(org.innerText).toEqual(user);
		expect(repoEl.innerText).toEqual(repo);
		[selectors.issueTitle, selectors.prTitle, selectors.file].forEach((s) => {
			expect(tag?.querySelector(s)).toBeFalsy();
		});
	});
});
