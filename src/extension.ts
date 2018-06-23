'use strict';

import * as vscode from 'vscode';
import { StatusBarItem, window, StatusBarAlignment, TextDocument, Diagnostic, languages, DiagnosticSeverity, Range, workspace } from 'vscode';
import { LgtmService, QueryRunProgressKeys, Project } from './lgtm';
import fs = require('fs-extra');
import * as date from './date';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-lgtm-ql" is active');

    let lgtm = new LgtmService();
    let commands = new LgtmCommands(lgtm);

    context.subscriptions.push(vscode.commands.registerCommand('extension.checkErrors', () => {
        commands.withQlActiveEditor(doc => {
            commands.checkInit().then(() => {
                if (commands.dist === null) {
                    lgtm.getDist(commands.handleError, body => {
                        commands.dist = body.data;
                        commands.lgtmStatus.appendDist(commands.dist);
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

    const t: { timer: NodeJS.Timer | null } = { timer: null };
    context.subscriptions.push(workspace.onDidChangeTextDocument(e => {
        console.log("onChange: " + e.contentChanges[0].text);
        if (t.timer !== null) {
            clearTimeout(t.timer);
        }
        t.timer = setTimeout(() => {
            commands.withQlDocument(e.document, doc => {
                commands.checkInit().then(() => {
                    if (commands.dist === null) {
                        lgtm.getDist(commands.handleError, body => {
                            commands.dist = body.data;
                            commands.lgtmStatus.appendDist(commands.dist);
                            commands.checkErrors(doc, commands.dist);
                        });
                    } else {
                        commands.checkErrors(doc, commands.dist);
                    }
                    t.timer = null;
                });
            });
        }, 500);
    }));

    context.subscriptions.push(commands);
}

export function deactivate() {
}

function allDone(queryRunProgressKeys: QueryRunProgressKeys) {
    for (const key in queryRunProgressKeys) {
        if (!queryRunProgressKeys[key].done) {
            return false;
        }
    }
    return true;
}

class LgtmStatus {

    private statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

    constructor() {
        this.statusBarItem.text = "lgtm is starting ...";
        this.statusBarItem.tooltip = 'lgtm service';
        this.statusBarItem.show();
    }

    initiated(nonce: string, apiVersion: string) {
        this.statusBarItem.text = "lgtm ✓";
        this.statusBarItem.tooltip += `\n\nnonce: ${nonce}\n\napiVersion: ${apiVersion}`;
    }

    queryUrl(queryLink: string): any {
        this.statusBarItem.text = `lgtm ✓ @${queryLink}`;
        this.statusBarItem.command = "extension.openQLQueryUrl";
    }

    appendDist(dist: string) {
        this.statusBarItem.tooltip += `\n\ndist: ${dist}`;
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}

class LgtmCommands {

    private lgtm: LgtmService;
    lgtmStatus = new LgtmStatus();
    private lastQueryLink: string | undefined;
    dist: string | null = null;

    constructor(lgtm: LgtmService) {
        this.lgtm = lgtm;
        this.checkInit();
    }

    checkInit() {
        return new Promise((resolve, reject) => {
            if (!this.lgtm.isInitiated()) {
                this.lgtm.init(error => {
                    this.handleError(error);
                    reject(error);
                }, (nonce, apiVersion) => {
                    this.lgtmStatus.initiated(nonce, apiVersion);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    withQlDocument(doc: TextDocument, action: (doc: TextDocument) => void) {
        if (doc.languageId === "ql") {
            action(doc);
        }
    }

    withQlActiveEditor(action: (doc: TextDocument) => void) {
        const editor = window.activeTextEditor;
        if (!editor) {
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

        this.lgtm.getProjectsByKey(projectKeys, this.handleError, body => {
            const queryString = content;
            const ps = body;
            this.lgtm.runQuery(lang, projectKeys, queryString, this.handleError, body => {
                if (body.status !== "success") {
                    LgtmCommands.displayError(`(${body.error}): ${body.message}`);
                    return;
                }

                const queryKey = body.data.key;
                const queryLink = `https://lgtm.com/query/${queryKey}`;

                this.lastQueryLink = queryLink;
                this.lgtmStatus.queryUrl(queryLink);

                // const w = window.createWebviewPanel("json", `Results #${queryKey}`, { viewColumn: vscode.ViewColumn.Two }, { enableScripts: true });

                // let html = "";

                const queryKeyFolder = date.getDate() + '-' + queryKey;
                const queryRunKeys: QueryRunProgressKeys = {};
                const mapByQueryKey: { [key: string]: { project: Project, snapshotKey: string } } = {};
                body.data.runs.forEach(r => {
                    queryRunKeys[r.key] = {
                        done: r.done,
                        progress: 0
                    };

                    mapByQueryKey[r.key] = { project: ps.data.fullProjects[r.projectKey], snapshotKey: r.snapshotKey };
                    // html += `<p>Project: ${r.projectKey} ${r.key}</p>
                    //     <div id='p${r.key}'></div>`;

                    if (r.done) {
                        this.showRunResults(r.key, queryKeyFolder, ps.data.fullProjects[r.projectKey], r.snapshotKey);
                    }
                });

                // w.webview.html = this.getHtml(doc, queryLink, html + body);
                // w.reveal();

                if (!allDone(queryRunKeys)) {
                    this.displayProgress(queryRunKeys, queryRunKey => {
                        // ps.data.fullProjects[r.projectKey]
                        this.showRunResults(
                            queryRunKey,
                            queryKeyFolder,
                            mapByQueryKey[queryRunKey].project,
                            mapByQueryKey[queryRunKey].snapshotKey
                        );
                    });
                } else {
                    vscode.window.showInformationMessage("Queries done");
                }
            });
        });
    }

    public showRunResults(queryRunKey: string, queryKeyDir: string, project: Project, snapshotKey: string) {
        const url = "https://lgtm.com/projects";
        this.lgtm.getCustomQueryRunResults(0, 3, false, queryRunKey, this.handleError, body => {
            let csv = body.data.metadata.columns.join(",") + "\n";
            for (const row of body.data.rows) {
                csv += row.map(c => {
                    if (c.fileLocation === undefined) {
                        return `"${c.label}"`;
                    } else {
                        return `"${c.label}(${url}/${project.slug}/snapshot/${snapshotKey}/files${c.fileLocation.path}#L${c.fileLocation.line})"`;
                    }
                }).join(",") + "\n";
            }

            const p = project.displayName.replace('/', '-');
            let tmpDir = workspace.rootPath;
            if (tmpDir !== undefined) {
                tmpDir += "/.lgtm/" + queryKeyDir;
                if (!fs.existsSync(tmpDir)) {
                    fs.ensureDirSync(tmpDir);
                }
                const csvPath = `${tmpDir}/${queryRunKey}-${p}.csv`;
                fs.writeFileSync(csvPath, csv);

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

    public displayProgress(queryRunKeys: QueryRunProgressKeys, queryRunKeyDone: (queryRunKey: string) => void) {
        window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Running Query ...",
        }, progress => {
            return new Promise(resolve => {
                const inc = { totalProgress: 0 };
                var timer = setInterval(() => {
                    var qs = "[" + Object.keys(queryRunKeys).join(",") + "]";
                    console.log("Query run keys: " + qs);
                    this.lgtm.getCustomQueryRunProgress(qs, this.handleError, body => {
                        let message = "Running Queries: ";
                        let totalProgress = 0;
                        for (const key in body.data) {
                            const entry = body.data[key];
                            console.log(entry);

                            if (entry.done && !queryRunKeys[key].done) {
                                queryRunKeyDone(key);
                            }

                            queryRunKeys[key].done = entry.done;
                            queryRunKeys[key].progress = entry.progress;
                            message += entry.progress + "% ";
                            totalProgress += entry.progress;
                        }
                        if (allDone(queryRunKeys)) {
                            console.log("All queries done");
                            clearInterval(timer);
                            resolve();
                        } else {
                            console.log("Progress: " + message);
                            progress.report({
                                message: message,
                                increment: (totalProgress - inc.totalProgress) / Object.keys(body.data).length
                            });
                            inc.totalProgress = totalProgress;
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
        LgtmCommands.displayError(`HTTP: ${error}`);
    }

    public static displayError(message: string) {
        vscode.window.showErrorMessage('lgtm ✘ ' + message);
    }

    public dispose() {
        this.lgtmStatus.dispose();
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