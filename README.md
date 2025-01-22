# GitHub Link

[![Wiki Badge](https://img.shields.io/badge/wiki-documentation-blue?logo=github)](https://github.com/nathonius/obsidian-github-link/wiki)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nathonius_obsidian-github-link&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nathonius_obsidian-github-link) [![All Contributors](https://img.shields.io/github/all-contributors/nathonius/obsidian-github-link?color=ee8449)](#contributors)

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
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://nathan-smith.org"><img src="https://avatars.githubusercontent.com/u/4851889?v=4?s=100" width="100px;" alt="Nathan"/><br /><sub><b>Nathan</b></sub></a><br /><a href="#code-nathonius" title="Code">💻</a> <a href="#doc-nathonius" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://arongriffis.com"><img src="https://avatars.githubusercontent.com/u/50637?v=4?s=100" width="100px;" alt="Aron Griffis"/><br /><sub><b>Aron Griffis</b></sub></a><br /><a href="#code-agriffis" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nikclayton"><img src="https://avatars.githubusercontent.com/u/773100?v=4?s=100" width="100px;" alt="Nik Clayton"/><br /><sub><b>Nik Clayton</b></sub></a><br /><a href="#bug-nikclayton" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://tech.dreamleaves.org"><img src="https://avatars.githubusercontent.com/u/1074760?v=4?s=100" width="100px;" alt="Arnaud 'red' Rouyer"/><br /><sub><b>Arnaud 'red' Rouyer</b></sub></a><br /><a href="#code-joshleaves" title="Code">💻</a> <a href="#test-joshleaves" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://macwright.com/"><img src="https://avatars.githubusercontent.com/u/32314?v=4?s=100" width="100px;" alt="Tom MacWright"/><br /><sub><b>Tom MacWright</b></sub></a><br /><a href="#code-tmcw" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
