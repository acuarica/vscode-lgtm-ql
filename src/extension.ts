'use strict';

import * as vscode from 'vscode';
import { StatusBarItem, window, StatusBarAlignment } from 'vscode';
import { LgtmService, QueryRunProgressKeys } from './lgtm';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-lgtm-ql" is active');

    let lgtm = new LgtmService();
    let commands = new LgtmCommands(lgtm);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('extension.runQLQuery', () => {
        commands.runQLQuery();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.openQLQueryUrl', () => {
        commands.openQLQueryUrl();
    }));

    context.subscriptions.push(commands);
}
function allDone(queryRunProgressKeys: QueryRunProgressKeys) {
    for (const key in queryRunProgressKeys) {
        if (!queryRunProgressKeys[key].done) {
            return false;
        }
    }
    return true;
}

class LgtmCommands {

    private lgtm: LgtmService;
    private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    private lastQueryLink: string | undefined;

    constructor(lgtm: LgtmService) {
        this.lgtm = lgtm;
        this._statusBarItem.text = "lgtm ...";
    }

    public runQLQuery() {
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        if (doc.languageId === "ql") {
            this._statusBarItem.show();
            if (!this.lgtm.isInitiated()) {
                this._statusBarItem.text = "lgtm is starting ...";
                this.lgtm.init(this.handleError, () => {
                    this._statusBarItem.text = "lgtm ✓";
                    this._statusBarItem.tooltip = `lgtm service\n\nnonce: ${this.lgtm.nonce}\n\napiVersion: ${this.lgtm.apiVersion}`;
                    this.sendQuery(doc);
                });
            } else {
                this.sendQuery(doc);
            }
        } else {
            this._statusBarItem.hide();
        }
    }

    private sendQuery(doc: vscode.TextDocument) {
        const content = doc.getText();
        const args = LgtmCommands.parseQueryArgs(content.split("\n", 2));
        const lang = args["lang"];
        const projectKeys = args["projectKeys"];
        const queryString = content;

        this.lgtm.runQuery(lang, projectKeys, queryString, this.handleError, body => {
            if (body.status !== "success") {
                LgtmCommands.displayError(`(${body.error}): ${body.message}`);
                return;
            }

            const queryKey = body.data.key;
            const queryLink = `https://lgtm.com/query/${queryKey}`;

            this.lastQueryLink = queryLink;
            this._statusBarItem.text = `lgtm ✓ @${queryLink}`;
            this._statusBarItem.command = "extension.openQLQueryUrl";

            let html = `<h3>Results <a href="${queryLink}">${queryLink}</a></h3>`;

            const queryRunKeys: QueryRunProgressKeys = {};
            body.data.runs.forEach(r => {
                queryRunKeys[r.key] = {
                    done: r.done,
                    progress: 0
                };

                html += `<p>Project: ${r.projectKey} ${r.key}</p>`;

                if (r.done) {
                    this.showRunResults(r.key);
                }
            });

            const w = window.createWebviewPanel("json", `Results #${queryKey}`, { viewColumn: vscode.ViewColumn.Two });
            w.webview.html = html + body;
            w.reveal();

            if (!allDone(queryRunKeys)) {
                this.displayProgress(queryRunKeys);
            } else {
                vscode.window.showInformationMessage("Queries done");
            }

        });
    }

    public showRunResults(queryRunKey: string) {
        this.lgtm.getCustomQueryRunResults(0, 3, false, queryRunKey, this.handleError, body => {
            vscode.workspace.openTextDocument({ language: "json", content: JSON.stringify(body) }).
                then(document => {
                    window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Two }).
                        then(document => {
                        });
                });
        });
    }

    public displayProgress(queryRunKeys: QueryRunProgressKeys) {
        window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Running Query ...",
        }, progress => {
            return new Promise(resolve => {
                var timer = setInterval(() => {
                    var qs = "[" + Object.keys(queryRunKeys).join(",") + "]";
                    console.log("Query run keys: " + qs);
                    this.lgtm.getCustomQueryRunProgress(qs, this.handleError, body => {
                        let message = "Running Queries: ";
                        for (const key in body.data) {
                            const entry = body.data[key];
                            console.log(entry);
                            queryRunKeys[key].done = entry.done;
                            queryRunKeys[key].progress = entry.progress;
                            message += entry.progress + "% ";
                        }
                        if (allDone(queryRunKeys)) {
                            console.log("All queries done");
                            clearInterval(timer);
                            resolve();
                        } else {
                            console.log("Progress: " + message);
                            progress.report({ message: message, increment: 10 });
                        }
                    });
                }, 2000);
            });
        });
    }

    public openQLQueryUrl() {
        if (this.lastQueryLink === undefined) {
            vscode.window.showWarningMessage("There is no query link to open.");
            return;
        }

        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(this.lastQueryLink));
    }

    public handleError(error: any) {
        this._statusBarItem.text = "lgtm ✘";
        LgtmCommands.displayError(`HTTP: ${error}`);
    }

    public static displayError(message: string) {
        vscode.window.showErrorMessage('lgtm ✘ ' + message);
    }

    public dispose() {
        this._statusBarItem.dispose();
    }

    public static parseQueryArgs(content: string[]) {
        const result: { [id: string]: string; } = {};
        content.map(function (e) {
            const m = e.match("//#(\\w+)=([,\\[\\]\\w]+)");
            console.log('Query arg match:', m);
            if (m !== null && m.length === 3) {
                result[m[1]] = m[2];
            }
        });

        console.log('args:', result);
        return result;
    }
}

export function deactivate() {
}