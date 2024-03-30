# Pre-requisites

Before making a pull request, please make an associated issue. New features should be discussed with project maintainers first. Bug fixes require no discussion.

# Setup & Development

1. Clone the repo somewhere outside of your obsidian vault directory
2. `npm install` (once)
3. `npm run dev` to run a watch process that will rebuild the plugin automatically when files change
4. After making changes, in another terminal window, `cp main.js styles.css manifest.json /path/to/your/vault/.obsidian/plugins/obsidian-github-link`
5. Reload obsidian

# Code Standards

Code must meet the following standards:

- Conforms to the code style enforced by prettier
- Pass linting using the project's ESLint config (automated as a PR check)
- Pass a static code analysis scan by SonarCloud (automated as a PR check)
- Review by a project maintainer