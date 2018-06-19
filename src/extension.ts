'use strict';

import * as vscode from 'vscode';
import { StatusBarItem, window, StatusBarAlignment, workspace } from 'vscode';
import { LgtmService } from './lgtm';
import { Response } from 'request';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-lgtm-ql" is active');

    let lgtm = new LgtmService();
    let runQueryCommand = new RunQueryCommand(lgtm);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let runDisp = vscode.commands.registerCommand('extension.runQLQuery', () => {
        runQueryCommand.run();
    });

    context.subscriptions.push(runQueryCommand);
    context.subscriptions.push(runDisp);
}

class RunQueryCommand {

    private lgtm: LgtmService;
    private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

    constructor(lgtm: LgtmService) {
        this.lgtm = lgtm;
        this._statusBarItem.text = "lgtm ...";
    }

    public run() {
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
                this.lgtm.init(() => {
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
        const args = RunQueryCommand.parseQueryArgs(content.split("\n", 2));
        const lang = args["lang"];
        const projectKeys = args["projectKeys"];
        const queryString = content;

        this.lgtm.runQuery(lang, projectKeys, queryString, (error: any, response: Response, body: any) => {
            if (error !== null) {
                this._statusBarItem.text = `lgtm HTTP ✘: ${error}`;
                return;
            }

            const resp = JSON.parse(body);

            if (resp.status !== "success") {
                this._statusBarItem.text = `lgtm ✘ (${resp.error}): ${resp.message}`;
                return;
            }

            const queryKey = resp.data.key;
            const queryLink = `https://lgtm.com/query/${queryKey}`;

            this._statusBarItem.text = `lgtm ✓ #${queryLink}`;

            let html = `<h3>Results <a href="${queryLink}">${queryLink}</a></h3>`;

            resp.data.runs.forEach((element: any) => {
                html += `<p>Project: ${element.projectKey} ${element.key}</p>`;
            });

            // const queryRunKey = results.data.runs[0].key;
            // this.getCustomQueryRunResults(0, 3, false, queryRunKey);

            const w = window.createWebviewPanel("json", `Results #${queryKey}`, { viewColumn: vscode.ViewColumn.Two });
            w.webview.html = html + body;
            w.reveal();

            var keys: any = {};
            resp.data.runs.forEach((element: any) => {
                window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Running Query ${element.projectKey} (${element.key}) ...`,
                    cancellable: true
                }, (progress, token) => {
                    return new Promise((resolve, reject) => {
                        function sleep(ms: number) {
                            return new Promise(resolve => setTimeout(resolve, ms));
                        }

                        for (var i = 0; i < 10; i++) {
                            await sleep(10);

                        }
                        // keys[element.key] = {
                        //     total: 0,
                        //     progress: progress,
                        //     resolve: resolve,
                        //     reject: reject,
                        //     projectKey: element.projectKey
                        // };

                        var timer = setInterval(() => {
                            var queryRunKeys = "[" + Object.keys(keys).join(",") + "]";
                            console.log("Query run keys: " + queryRunKeys);
                            this.lgtm.getCustomQueryRunProgress(queryRunKeys, (error, response, body) => {
                                var resp = JSON.parse(body);
                                for (var k in resp.data) {
                                    var entry = resp.data[k];
                                    console.log(entry);
                                    if (entry.done === true) {
                                        console.log("Query done: " + k);
                                        keys[k].resolve();
                                        delete keys[k];
                                    } else {
                                        // console.log(`Key progress ${keys[k].projectKey} (#${k}): ${entry.done}/${entry.progress}/${keys[k].total}%`);
                                        console.log("Progress: " + entry.progress);
                                        console.log("Total: " + keys[k].total);
                                        var inc = entry.progress - keys[k].total;
                                        keys[k].total = entry.progress;
                                        keys[k].report({
                                            message: `Running Query ${keys[k].projectKey} (#${k}) [${entry.progress}%]`,
                                            increment: inc
                                        });
                                    }
                                }

                                console.log("Keys remaining: " + Object.keys(keys).length);
                                if (Object.keys(keys).length === 0) {
                                    console.log("All queries done");
                                    clearInterval(timer);
                                }
                            });
                        }, 2000);

                    });
                });
            });

            // var timer = setInterval(() => {
            //     var queryRunKeys = "[" + Object.keys(keys).join(",") + "]";
            //     console.log("Query run keys: " + queryRunKeys);
            //     this.lgtm.getCustomQueryRunProgress(queryRunKeys, (error, response, body) => {
            //         var resp = JSON.parse(body);
            //         for (var k in resp.data) {
            //             var entry = resp.data[k];
            //             console.log(entry);
            //             if (entry.done === true) {
            //                 console.log("Query done: " + k);
            //                 keys[k].resolve();
            //                 delete keys[k];
            //             } else {
            //                 // console.log(`Key progress ${keys[k].projectKey} (#${k}): ${entry.done}/${entry.progress}/${keys[k].total}%`);
            //                 console.log("Progress: " + entry.progress);
            //                 console.log("Total: " + keys[k].total);
            //                 var inc = entry.progress - keys[k].total;
            //                 keys[k].total = entry.progress;
            //                 keys[k].report({
            //                     message: `Running Query ${keys[k].projectKey} (#${k}) [${entry.progress}%]`,
            //                     increment: inc
            //                 });
            //             }
            //         }

            //         console.log("Keys remaining: " + Object.keys(keys).length);
            //         if (Object.keys(keys).length === 0) {
            //             console.log("All queries done");
            //             clearInterval(timer);
            //         }
            //     });
            // }, 2000);

            workspace.openTextDocument({ language: "json", content: body }).then(document => {
                window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Two }).
                    then(document => {

                    });
            });
        });
    }

    public display() {
        vscode.window.showInformationMessage('nonce: ' + this.lgtm.nonce);
        vscode.window.showInformationMessage('apiVersion: ' + this.lgtm.apiVersion);
    }

    public dispose() {
        this._statusBarItem.dispose();
    }

    public static parseQueryArgs(content: string[]) {
        const result: { [id: string]: string; } = {};
        content.map(function (e) {
            const m = e.match("//#(\\w+)=([,\\[\\]\\w]+)");
            console.log(m);
            if (m !== null && m.length === 3) {
                result[m[1]] = m[2];
            }
        });

        console.log(result);
        return result;
    }
}

export function deactivate() {
}