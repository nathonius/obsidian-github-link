export interface ParsedUrl {
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

const apiRegex = /(https:\/\/)?api\.github\.com\/repos\//;

export function repoAPIToBrowserUrl(urlString: string): string {
	return urlString.replace(apiRegex, "https://github.com/");
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
	if (urlParts.length > 4) {
		const issueNumber = parseInt(urlParts[4], 10);
		switch (urlParts[3].toLowerCase()) {
			case "issues":
				if (!isNaN(issueNumber)) {
					parsedUrl.issue = issueNumber;
				}
				break;
			case "pull":
				if (!isNaN(issueNumber)) {
					parsedUrl.pr = issueNumber;
				}
				break;
			case "blob":
				parsedUrl.code = {};
				parsedUrl.code.branch = urlParts[4];
				if (urlParts[5]) {
					const pathParts = urlParts.slice(5);
					parsedUrl.code.path = pathParts.join("/");
				}
				break;
			case "commit":
				parsedUrl.commit = urlParts.slice(4).join("/");
				break;
		}
	}
	if (urlParts.length > 2) {
		parsedUrl.repo = urlParts[2];
	}
	if (urlParts.length > 1) {
		parsedUrl.org = urlParts[1];
	}

	return parsedUrl;
}
