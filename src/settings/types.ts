import { LogLevel } from "../logger";

export interface GithubAccount {
	id: string;
	name: string;
	orgs: string[];
	token: string;
	customOAuth?: boolean;
	clientId?: string;
}

export interface GithubLinkPluginData {
	settings: GithubLinkPluginSettings;
	cache: string[] | null;
}

export interface GithubLinkPluginSettings {
	accounts: GithubAccount[];
	defaultAccount?: string;
	defaultPageSize: number;
	showPagination: boolean;
	showRefresh: boolean;
	showExternalLink: boolean;
	logLevel: LogLevel;
	tagTooltips: boolean;
	tagShowPRMergeable: boolean;
	cacheIntervalSeconds: number;
	maxCacheAgeHours: number;
	minRequestSeconds: number;
}

export const DEFAULT_SETTINGS: GithubLinkPluginSettings = {
	accounts: [],
	defaultPageSize: 10,
	showPagination: true,
	showRefresh: true,
	showExternalLink: true,
	logLevel: LogLevel.Error,
	tagTooltips: false,
	tagShowPRMergeable: false,
	cacheIntervalSeconds: 60,
	maxCacheAgeHours: 120,
	minRequestSeconds: 60,
};
