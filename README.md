# GitHub Link

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nathonius_obsidian-github-link&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nathonius_obsidian-github-link)

**Obsidian + GitHub ❤️**

Transform boring GitHub links in notes into tags with rich content from GitHub, and query issues and pull requests within your notes.

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

The codeblock must be valid YAML. The following options are currently supported:

| Option       | Values                            | Description                                                                                                                                                                                       |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outputType` | `table`                           | Required. Only table is currently supported.                                                                                                                                                      |
| `queryType`  | `issue`, `pull-request`           | Required.                                                                                                                                                                                         |
| `columns`    | See Supported Columns list below. | Required. Should be an array of values.                                                                                                                                                           |
| `query`      | A valid GitHub search query.      | Required for custom queries, overrides other params. See the [GitHub docs](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) for more information. |

Other params will depend on the type of query. If the `query` parameter is provided, these other parameters will be ignored. Each section below describes a set of parameters for a certain query profile.

#### List My Assigned Issues

**Note:** this requires a valid token.

| Option      | Values                                                           | Description                                                                                      |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `org`       | Name of a user or organization.                                  | Will use token for default account if not given.                                                 |
| `filter`    | `assigned`, `created`, `mentioned`, `subscribed`, `repos`, `all` | What type of issues to return. `all` and `repos` return all issues, regardless of participation. |
| `state`     | `open`, `closed`, `all`                                          |                                                                                                  |
| `labels`    | Label or array of issue labels.                                  | Only matching issues will be included.                                                           |
| `sort`      | `created`, `updated`, `comments`                                 |                                                                                                  |
| `direction` | `desc`, `asc`                                                    |                                                                                                  |
| `since`     | `YYYY-MM-DDTHH:MM:SSZ`                                           | Minimum update date, in full ISO format.                                                         |
| `per_page`  | Integer.                                                         | Number of items to return per-page.                                                              |
| `page`      | Integer.                                                         | Page of results to use.                                                                          |

#### List Issues For Repo

| Option      | Values                                          | Description                              |
| ----------- | ----------------------------------------------- | ---------------------------------------- |
| `org`       | Name of a user or organization.                 | Required.                                |
| `repo`      | Repository name.                                | Required.                                |
| `milestone` | Issue milestone, milestone number, `*`, `none`. |                                          |
| `state`     | `open`, `closed`, `all`                         |                                          |
| `assignee`  | Name of a user, `*`, `none`.                    |                                          |
| `creator`   | Name of a user.                                 |                                          |
| `mentioned` | Name of a user.                                 |                                          |
| `labels`    | Label or array of issue labels.                 | Only matching issues will be included.   |
| `sort`      | `created`, `updated`, `comments`                |                                          |
| `direction` | `desc`, `asc`                                   |                                          |
| `since`     | `YYYY-MM-DDTHH:MM:SSZ`                          | Minimum update date, in full ISO format. |
| `per_page`  | Integer.                                        | Number of items to return per-page.      |
| `page`      | Integer.                                        | Page of results to use.                  |

#### List Pull Requests For Repo

| Option      | Values                                             | Description                                  |
| ----------- | -------------------------------------------------- | -------------------------------------------- |
| `org`       | Name of a user or organization.                    | Required.                                    |
| `repo`      | Repository name.                                   | Required.                                    |
| `state`     | `open`, `closed`, `all`                            |                                              |
| `head`      | `user:ref-name` or `org:ref-name`.                 | Filter to head user or org with branch name. |
| `base`      | `branch-name-base`                                 | Filter by base branch name.                  |
| `sort`      | `created`, `updated`, `popularity`, `long-running` |                                              |
| `direction` | `desc`, `asc`                                      |                                              |
| `per_page`  | Integer.                                           | Number of items to return per-page.          |
| `page`      | Integer.                                           | Page of results to use.                      |

#### Supported Columns

Any column not listed below can still be used if it is included in the API response. Nested values can be used by giving the json object notation string to reference the value. For example, `user.login` will get the raw value of the username from the API query response.

| Column                         | Types          | Description                                                    |
| ------------------------------ | -------------- | -------------------------------------------------------------- |
| `number`                       | `pull-request` | The PR number and a link to the PR.                            |
| `repo`                         | `pull-request` | A link to the repository.                                      |
| `author`                       | `pull-request` | The user who created the PR along with a small avatar.         |
| `status`                       | `pull-request` | The current status of the pull request.                        |
| `created`, `updated`, `closed` | `pull-request` | Formatted versions of the create, last update, and close date. |

## Setup

For public repositories, no extra configuration is required. For private repos, you'll need to log in through GitHub.

### Authentication

> ⚠️ **WARNING**: Tokens will be stored in plain text. Use at your own risk.

Authentication only requires a GitHub account. In GitHub Link plugin settings, add a new account. Give the account a name.

The plugin supports an automated authentication flow, or you can [generate your own token](https://github.com/settings/tokens). To use the automated flow, select "Generate Token". In the modal that appears, copy the code and open the authentication link. After pasting the auth link, you'll be prompted to allow access to the GitHub Link plugin. Once accepted, you can return to Obsidian and the token will be saved automatically.

## Plugin Compatibility

There are other plugins that provide some similar functionality:

- [GitHub Embeds](https://github.com/MrGVSV/obsidian-github-embeds)
- [GitHub Issue Augmentation](https://github.com/samprintz/obsidian-issue-augmentation-plugin)

These and GitHub Link are unlikely to be compatible and should not currently be used together.
