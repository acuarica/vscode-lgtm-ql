
# vscode-lgtm-ql (lgtm.com QL extension for VSCode)

The platform https://lgtm.com provides the web interface to run QL queries.
See:

> https://lgtm.com/query

It is the perfect place to start and learn the QL language.
When the size of your QL scripts get more complex, the web interface lack some IDE-like/offline features, as control version.
when developing more complex scripts...

This extension allows the user to run QL queries directly from VS Code.
Moreover, it provides an IDE-like experience when editing QL scripts.
It uses the REST services provided by lgtm.com,
to check and provide hover descriptions of symbols.

Before building the extension, we tried to automatize running the QL queries using python scripts.

Parsing doc comments to extract description.
Parser for QL.

Extension for lgtm service QL.
It allows to run scripts directly from VSCode.

## Features

* Check errors, *i.e.*, linting
* Running queries
* Fetching the results
* See definitions of predicates and classes

## Requirements

This extension needs an Internet connection to run queries on the lgtm.com platform.

## Extension Settings

This extension contributes the following settings:

* `lgtm.checkErrorsOnChange`: Check errors on lgtm.com while editing if true.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

-----------------------------------------------------------------------------------------------------------

## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (macOS) to see a list of Markdown snippets