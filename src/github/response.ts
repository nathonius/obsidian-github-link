import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export type IssueResponse = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
export type PullResponse = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
export type CodeResponse = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
