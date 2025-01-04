import { expect, test, describe } from "@jest/globals";
import { matchRegexp } from './view-plugin';

// Some potential URLs:
const GITHUB_URLS = [
  // USER/ORG
  'https://github.com/nathonius',
  // REPO
  'https://github.com/nathonius/obsidian-github-link',
  'https://github.com/nathonius/obsidian-github-link/tree/main',
  'https://github.com/joshleaves/obsidian-github-link/tree/fix/156-linking-to-file',
  'https://github.com/nathonius/obsidian-github-link/blob/main/src/github/url-parse.ts',
  'https://github.com/nathonius/obsidian-github-link/blob/main/src/inline/view-plugin.ts#L21',
  'https://github.com/nathonius/obsidian-github-link/blob/main/src/inline/view-plugin.ts#L13-32',
  // ISSUES
  'https://github.com/nathonius/obsidian-github-link/issues',
  'https://github.com/nathonius/obsidian-github-link/issues/156',
  // PULLS
  'https://github.com/nathonius/obsidian-github-link/pulls',
  'https://github.com/nathonius/obsidian-github-link/pull/157',
  'https://github.com/nathonius/obsidian-github-link/pull/157/commits',
  'https://github.com/nathonius/obsidian-github-link/pull/157/commits/42d35e4c7070d2ec9f3bacf7f4a0561d9d7346bb',
  'https://github.com/nathonius/obsidian-github-link/pull/157/files',
]

describe('matchRegexp', () => {
  test('matches GitHub URLs on their own', () => {
    GITHUB_URLS.forEach(url => {
      const text = `${url}` // (...)
      const match = text.match(matchRegexp);
      expect(match).not.toBeNull();
      expect(match![0]).toBe(url);
    });
  });

  test('does not match URLs inside markdown links', () => {
    GITHUB_URLS.forEach(url => {
      const text = `[A link to GitHub](${url})`;
      const match = text.match(matchRegexp);
      expect(match).toBeNull();
    });
  });

  test('matches URLs ending a sentence', () => {
    GITHUB_URLS.forEach(url => {
      const text = `That's the end of the line for ${url}.`;
      const match = text.match(matchRegexp);
      expect(match).not.toBeNull();
      expect(match![0]).toBe(url);
    });
  });

  test('matches URLs ending a sentence that segues to another', () => {
    GITHUB_URLS.forEach(url => {
      const text = `That's the end of the line for ${url}. But not for this variable!`;
      const match = text.match(matchRegexp);
      expect(match).not.toBeNull();
      expect(match![0]).toBe(url);
    });
  });

  test('matches URLs in text with multiple lines', () => {
    GITHUB_URLS.forEach(url => {
      const text = `Some text
      ${url}
      more text.`;
      const match = text.match(matchRegexp);
      expect(match).not.toBeNull();
      expect(match![0]).toBe(url);
    });
  });

  test('matches URLs in text followed by another text', () => {
    GITHUB_URLS.forEach(url => {
      const text = `${url} is a cool plugin`;
      const match = text.match(matchRegexp);
      expect(match).not.toBeNull();
      expect(match![0]).toBe(url);
    })
  });
});
