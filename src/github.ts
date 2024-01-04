import { RequestUrlParam, requestUrl } from "obsidian";

import { OnVerificationCallback } from "@octokit/auth-oauth-device/dist-types/types";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { request } from "@octokit/request";

const baseApi = "https://api.github.com";

interface ParsedUrl {
	url: string;
	host: string;
	org?: string;
	repo?: string;
	issue?: number;
	pr?: number;
	code?: {
		branch?: string;
		path?: string;
	};
	commit?: string;
}

// TODO: Clean this file up, lots of junk in here

export async function githubRequest(config: RequestUrlParam, token?: string) {
	if (!config.headers) {
		config.headers = {};
	}
	config.headers.Accept = "application/vnd.github+json";
	config.headers["X-GitHub-Api-Version"] = "2022-11-28";
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	try {
		const response = await requestUrl(config);
		return response;
	} catch (err) {
		console.error(err);
		throw err;
	}
}

export async function getIssue(org: string, repo: string, issue: number, token?: string) {
	const result = await githubRequest({ url: `${baseApi}/repos/${org}/${repo}/issues/${issue}` }, token);
	return result.json as RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
}

export async function getPullRequest(org: string, repo: string, pr: number, token?: string) {
	const result = await githubRequest(
		{
			url: `${baseApi}/repos/${org}/${repo}/pulls/${pr}`,
		},
		token
	);
	return result.json as RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
}

export async function getCode(org: string, repo: string, path: string, branch: string, token?: string) {
	const result = await githubRequest(
		{
			url: `${baseApi}/repos/${org}/${repo}/contents/${path}?ref=${branch}`,
		},
		token
	);
	return result.json as RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
}

export function parseUrl(urlString: string): ParsedUrl {
	// Some potential URLs:
	// https://github.com/nathonius/alloy-theme
	// https://github.com/nathonius/obsidian-trello/issues/45
	// https://github.com/nathonius/obsidian-trello/pull/54
	// https://github.com/nathonius/obsidian-trello/blob/main/src/constants.ts
	// https://github.com/nathonius/obsidian-trello/blob/markdown/src/constants.ts
	// https://github.com/nathonius/obsidian-trello/blob/markdown/src/constants.ts#L44-L58
	// https://github.com/nathonius/obsidian-trello/commit/7ea069dd0641441ec20fb194f50e746a21abbaf1
	// https://github.com/nathonius/obsidian-trello/commit/7ea069dd0641441ec20fb194f50e746a21abbaf1#diff-8fa4b52909f895e8cda060d2035234e0a42ca2c7d3f8f8de1b35a056537bf199R35
	const url = new URL(urlString);
	const parsedUrl: ParsedUrl = { url: urlString, host: url.hostname };

	const urlParts = url.pathname.split("/");
	console.log(urlParts);
	if (urlParts.length >= 4) {
		switch (urlParts[3].toLowerCase()) {
			case "issues":
				if (urlParts[4]) {
					const issueNumber = parseInt(urlParts[4], 10);
					if (!isNaN(issueNumber)) {
						parsedUrl.issue = issueNumber;
					}
				}
				break;
			case "pull":
				if (urlParts[4]) {
					const prNumber = parseInt(urlParts[4], 10);
					if (!isNaN(prNumber)) {
						parsedUrl.pr = prNumber;
					}
				}
				break;
			case "blob":
				parsedUrl.code = {};
				if (urlParts[4]) {
					parsedUrl.code.branch = urlParts[4];
				}
				if (urlParts[5]) {
					const pathParts = urlParts.slice(5);
					parsedUrl.code.path = pathParts.join("/");
				}
				break;
			case "commit":
				if (urlParts[4]) {
					parsedUrl.commit = urlParts.slice(4).join("/");
				}
				break;
		}
	}
	if (urlParts.length >= 3) {
		parsedUrl.repo = urlParts[2];
	}
	if (urlParts.length >= 2) {
		parsedUrl.org = urlParts[1];
	}

	console.log(parsedUrl);
	return parsedUrl;
}

async function doFetch(url: RequestInfo | URL, options?: RequestInit | undefined): Promise<Response> {
	// Octokit always uses a url + options, not a Request object
	if (typeof url !== "string") {
		throw new Error("Something has gone horribly wrong and fetch has received unexpected arguments.");
	}
	if (options === undefined) {
		throw new Error("No options given to fetch.");
	}

	const headers = getHeaders(options.headers);
	const contentType = headers?.["Content-Type"];
	const params: RequestUrlParam = {
		url,
		headers,
		method: options.method,
		body: getBody(options.body),
		contentType,
	};
	const result = await requestUrl(params);
	const partialResult = {
		...result,
		url,
		headers: new Headers(result.headers),
		arrayBuffer: () => Promise.resolve(result.arrayBuffer),
		text: () => Promise.resolve(result.text),
		json: () => Promise.resolve(result.json),
	} as Omit<
		Response,
		"ok" | "body" | "statusText" | "redirected" | "type" | "clone" | "bodyUsed" | "blob" | "formData"
	>;
	return partialResult as Response;
}

function getHeaders(headers: HeadersInit | undefined): Record<string, string> | undefined {
	if (!headers) {
		return undefined;
	}
	if (headers instanceof Headers) {
		const result: Record<string, string> = {};
		headers.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}
	if (Array.isArray(headers)) {
		throw new Error("Got array headers, we don't know what to do with this yet.");
	}
	return headers;
}

function getBody(body: BodyInit | null | undefined): string | ArrayBuffer | undefined {
	if (!body) {
		return undefined;
	}
	if (body instanceof ArrayBuffer || typeof body === "string") {
		return body;
	}
	console.warn(`Got an unknown body parameter type, trying to stringify it.`);
	console.warn(body);
	try {
		return JSON.stringify(body);
	} catch {
		console.error("Could not stringify body parameter.");
		return undefined;
	}
}

export const auth = (verificationHandler: OnVerificationCallback) =>
	createOAuthDeviceAuth({
		clientType: "oauth-app",
		clientId: "baf0370cb98e1387d244",
		scopes: ["repo"],
		onVerification: verificationHandler,
		request: request.defaults({
			request: { fetch: doFetch },
		}),
	});
