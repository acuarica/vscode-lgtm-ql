'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import { StatusBarItem, window, StatusBarAlignment, TextDocument, Diagnostic, languages, DiagnosticSeverity, Range, workspace } from 'vscode';
import { LgtmService, QueryRunProgressKeys } from './lgtm';

import fs = require('fs-extra');

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-lgtm-ql" is active');

    let lgtm = new LgtmService();
    let commands = new LgtmCommands(lgtm, context.extensionPath);

    context.subscriptions.push(vscode.commands.registerCommand('extension.checkErrors', () => {
        commands.withQlActiveEditor(doc => {
            commands.checkInit().then(() => {
                if (commands.dist === null) {
                    lgtm.getDist(commands.handleError, body => {
                        commands.dist = body.data;
                        commands._statusBarItem.text += `\ndist: ${commands.dist}`;
                        commands.checkErrors(doc, commands.dist);
                    });
                } else {
                    commands.checkErrors(doc, commands.dist);
                }
            });
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.runQuery', () => {
        commands.withQlActiveEditor(doc => {
            commands.checkInit().then(() => {
                commands.runQuery(doc);
            });
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.openQLQueryUrl', () => {
        commands.withQlActiveEditor(doc => {
            commands.openQLQueryUrl();
        });
    }));

    context.subscriptions.push(workspace.onDidChangeTextDocument(e => {
        commands.withQlDocument(e.document, doc => {
            commands.checkInit().then(() => {
                if (commands.dist === null) {
                    lgtm.getDist(commands.handleError, body => {
                        commands.dist = body.data;
                        commands._statusBarItem.text += `\ndist: ${commands.dist}`;
                        commands.checkErrors(doc, commands.dist);
                    });
                } else {
                    commands.checkErrors(doc, commands.dist);
                }
            });
        });
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
    public _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    private lastQueryLink: string | undefined;
    private _extensionPath: string;
    dist: string | null = null;

    constructor(lgtm: LgtmService, extensionPath: string) {
        this.lgtm = lgtm;
        this._statusBarItem.text = "lgtm ...";
        this._extensionPath = extensionPath;
    }

    checkInit() {
        return new Promise((resolve, reject) => {
            if (!this.lgtm.isInitiated()) {
                this._statusBarItem.text = "lgtm is starting ...";
                this.lgtm.init(error => {
                    this.handleError(error);
                    reject(error);
                }, () => {
                    this._statusBarItem.text = "lgtm ✓";
                    this._statusBarItem.tooltip = `lgtm service\n\nnonce: ${this.lgtm.nonce}\n\napiVersion: ${this.lgtm.apiVersion}`;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    withQlDocument(doc: TextDocument, action: (doc: TextDocument) => void) {
        if (doc.languageId === "ql") {
            this._statusBarItem.show();
            action(doc);
        } else {
            this._statusBarItem.hide();
        }
    }

    withQlActiveEditor(action: (doc: TextDocument) => void) {
        const editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        this.withQlDocument(editor.document, action);
    }

    checkErrors(doc: TextDocument, distribution: string) {
        const getSeverity = (severity: string) => {
            switch (severity) {
                case "Error":
                    return DiagnosticSeverity.Error;
                case "Warning":
                    return DiagnosticSeverity.Warning;
                default:
                    console.log(severity);
                    return DiagnosticSeverity.Information;
            }
        };

        this.lgtm.checkErrors(distribution, "JAVA", doc.getText(), this.handleError, body => {
            console.log("asdfasdf");
            const dc = languages.createDiagnosticCollection("hola");
            console.log(doc.uri);
            const ds: Diagnostic[] = [];
            body.data.errors.forEach(err => {
                ds.push({
                    range: new Range(
                        err.position.line - 1,
                        err.position.column - 1,
                        err.position.endLine - 1,
                        err.position.endColumn - 1
                    ),
                    message: err.message,
                    severity: getSeverity(err.severity)
                });
            });
            dc.set(doc.uri, ds);
        });
    }

    runQuery(doc: TextDocument) {
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

            const w = window.createWebviewPanel("json", `Results #${queryKey}`, { viewColumn: vscode.ViewColumn.Two }, { enableScripts: true });

            let html = "";

            const queryRunKeys: QueryRunProgressKeys = {};
            body.data.runs.forEach(r => {
                queryRunKeys[r.key] = {
                    done: r.done,
                    progress: 0
                };

                html += `<p>Project: ${r.projectKey} ${r.key}</p>
                    <div id='p${r.key}'></div>`;

                if (r.done) {
                    this.showRunResults(r.key, w);
                }
            });

            w.webview.html = this.getHtml(doc, queryLink, html + body);
            w.reveal();

            if (!allDone(queryRunKeys)) {
                this.displayProgress(queryRunKeys);
            } else {
                vscode.window.showInformationMessage("Queries done");
            }
        });
    }

    private getHtml(doc: vscode.TextDocument, queryLink: string, placeholder: string) {
        const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'media', 'main.js'));
        const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
        const displayName = path.basename(doc.fileName);

        return `<html> 
            <body>
            <h3>Results for ${displayName} <a href="${queryLink}">${queryLink}</a></h3>
            ${placeholder}
            <script src="${scriptUri}"></script>
            </body>
        </html>`;
    }

    public showRunResults(queryRunKey: string, panel: vscode.WebviewPanel) {

        // for (let i = 0; i < 2; i++) {
        //     vscode.workspace.openTextDocument({ language: "plaintext", content: "Hola " + i }).then(document => {
        //         window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Two, preview: false }).
        //             then(document => { });
        //     });
        // }

        this.lgtm.getCustomQueryRunResults(0, 3, false, queryRunKey, this.handleError, body => {
            panel.webview.postMessage({
                command: 'results',
                key: queryRunKey,
                body: JSON.stringify(body)
            });

            let csv = body.data.metadata.columns.join(",") + "\n";
            for (const row of body.data.rows) {
                csv += row.map(c => c.label).join(",") + "\n";
            }

            let tmpDir = workspace.rootPath;
            if (tmpDir !== undefined) {
                tmpDir += "/.tmp";
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir);
                }
                const csvPath = `${tmpDir}/${queryRunKey}.csv`;
                fs.writeFileSync(csvPath, csv);

                // Open CSV in Excel Viewer and clean up.
                workspace.openTextDocument(csvPath).then(doc => {
                    vscode.commands.executeCommand("csv.preview", doc.uri);
                });

                // vscode.workspace.openTextDocument({ language: "csv", content: csv }).then(document => {
                //     window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Two, preview: false }).
                //         then(editor => {
                //         });
                // });
            }

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