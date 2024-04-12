# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
## [0.0.0] - YYYY-MM-DD

### Changed

### Fixed

-->

<!-- ## Unreleased -->

## [0.7.0] - 2024-04-11

### Changed

- If a link is just a repo, the username or organization will be included as well
- Links to PRs will show a simple mergeable or not mergeable PR status
- Added support for custom oauth app. See [the wiki](https://github.com/nathonius/obsidian-github-link/wiki/Authentication#custom-oauth-app) for more info!

## [0.6.0] - 2024-03-29

### Changed

- ✨ A brand new cache layer! ✨
  - Improved performance
  - Reduced API calls that count against the rate limit
  - Cache saved to disk, so data is not lost when Obsidian closes
  - See the [wiki](https://github.com/nathonius/obsidian-github-link/wiki/Plugin-settings#cache-settings) for more information!
- Improvements in documentation of plugin settings
- Added a new contributing document
- Custom queries include a link to view the query results on GitHub


## [0.5.1] - 2024-03-16

### Changed

- Some extra logic to attempt to handle rate limit errors

### Fixed

- Corrected caching behavior of individual issues and PRs

## [0.5.0] - 2024-03-09

### Changed

- Documentation has moved to the new wiki
- New option to show tooltips on status icons
- More icons have been added to make issue and PR statuses clearer

### Fixed

- Issues closed as not planned will be gray instead of red

## [0.4.0] - 2024-02-24

### Changed

- Default page size set to 10, and configurable in settings
- Tables include a refresh button
- Log level setting for debugging

### Fixed

- Search queries for private repos work when not the default account
- Column names are now case-insensitive
- Tables horizontally scroll when appropriate
- GitHub links within markdown links are not transformed into tags

## [0.3.0] - 2024-02-09

### Changed

- Default column set for simple tables
- Some documentation and CI improvements

### Fixed

- Removed some extraneous logging

## [0.2.0] - 2024-02-09

### Changed

- Added columns for issue results
- Added support for simpler queries using dedicated endpoints for issues and pull requests

## [0.1.0] - 2024-02-01

Initial release.

[0.7.0]: https://github.com/nathonius/obsidian-github-link/compare/0.6.0...0.7.0
[0.6.0]: https://github.com/nathonius/obsidian-github-link/compare/0.5.1...0.6.0
[0.5.1]: https://github.com/nathonius/obsidian-github-link/compare/0.5.0...0.5.1
[0.5.0]: https://github.com/nathonius/obsidian-github-link/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/nathonius/obsidian-github-link/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/nathonius/obsidian-github-link/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/nathonius/obsidian-github-link/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/nathonius/obsidian-github-link/releases/tag/0.1.0
