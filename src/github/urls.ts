/**
 * These are paths that begin with `https://github.com` but should not
 * be processed by the plugin.
 */
const knownPaths = [
	"about",
	"account",
	"codespaces",
	"dashboard",
	"discussions",
	"explore",
	"gist",
	"github-copilot",
	"issues",
	"logout",
	"marketplace",
	"mine",
	"new",
	"organizations",
	"projects",
	"pulls",
	"search",
	"security",
	"settings",
	"sponsors",
];

export function isAllowedPath(link: string): boolean {
	try {
		const url = new URL(link);
		const basePath = url.pathname.split("/")[1];
		if (knownPaths.includes(basePath)) {
			return false;
		}
	} catch (err) {
		return false;
	}
	return true;
}
