# GitHub Link

[![Wiki Badge](https://img.shields.io/badge/wiki-documentation-blue?logo=github)](https://github.com/nathonius/obsidian-github-link/wiki)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nathonius_obsidian-github-link&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nathonius_obsidian-github-link)[![All Contributors](https://img.shields.io/github/all-contributors/nathonius/obsidian-github-link?color=ee8449)](#contributors)

**Obsidian + GitHub ❤️**

Inject rich content from GitHub into your notes:

- GitHub links are transformed into tags showing issue and pull request titles, statuses, etc
- Use codeblocks to keep an up-to-date table of GitHub data inside a note

## Use

### Links

Github links are automatically transformed into tags. For example, pasting `https://github.com/nathonius/obsidian-github-link/issues/1` into a note will become:

![ExampleTag](doc/ExampleInlineTag.png)

### Table

You can also include a table with results from a search query using a `github-query` codeblock. For example:

````
```github-query
outputType: table
queryType: pull-request
query: "is:pr repo:nathonius/obsidian-github-link"
columns: [number, title, author, status]
```
````

This produces a table of results that refreshes upon opening the note.

![ExampleTable](doc/ExampleQueryResult.png)

See the [documentation](https://github.com/nathonius/obsidian-github-link/wiki) for more info.

## Updates

This project adheres to [semantic versioning](https://semver.org/). See the project [changelog](CHANGELOG.md) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for info on contributing to the project.

### Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
