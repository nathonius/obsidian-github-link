import type { OnVerificationCallback } from "@octokit/auth-oauth-device/dist-types/types";
import type { RequestUrlParam } from "obsidian";
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { request } from "@octokit/request";
import { requestUrl } from "obsidian";

const defaultClientId = "baf0370cb98e1387d244";

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

export const auth = (verificationHandler: OnVerificationCallback, clientId: string = defaultClientId) =>
	createOAuthDeviceAuth({
		clientType: "oauth-app",
		clientId,
		scopes: ["repo"],
		onVerification: verificationHandler,
		request: request.defaults({
			request: { fetch: doFetch },
		}),
	});
