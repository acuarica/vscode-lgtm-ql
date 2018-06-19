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
    let runDisp = vscode.commands.registerCommand('extension.runQLQuery', async () => {


        let wait1 = async () => await new Promise((resolve) => { setTimeout(() => { resolve(); }, 3000); });
        let wait2 = async () => await new Promise((resolve) => { setTimeout(() => { resolve(); }, 1000); });

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Test 1: report only increment"
            },
            async (progress) => {
                await wait1();
                for (let i = 0; i < 10; ++i) {
                    progress.report({ increment: 1 });
                    await wait2();
                }
            });

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Test 2: report only message"
            },
            async (progress) => {
                await wait1();
                for (let i = 0; i < 15; ++i) {
                    progress.report({ message: `message ${i}` });
                    await wait2();
                }
            });

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Test 3: report message and increment, together"
            },
            async (progress) => {
                await wait1();
                for (let i = 0; i < 20; ++i) {
                    progress.report({ increment: 5, message: `message ${i}` });
                    await wait2();
                }
            });

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Test 4: report increment then message"
            },
            async (progress) => {
                await wait1();
                for (let i = 0; i < 25; ++i) {
                    progress.report({ increment: 10 });
                    progress.report({ message: `message ${i}` });
                    await wait2();
                }
            });

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Test 5: report message then increment"
            },
            async (progress) => {
                await wait1();
                for (let i = 0; i < 30; ++i) {
                    progress.report({ message: `message ${i}` });
                    progress.report({ increment: 15 });
                    await wait2();
                }
            });

        // runQueryCommand.run();
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

            let wait1 = async () => await new Promise((resolve) => { setTimeout(() => { resolve(); }, 1000); });
            let wait2 = async () => await new Promise((resolve) => { setTimeout(() => { resolve(); }, 2000); });
            let wait3 = async () => await new Promise((resolve) => { setTimeout(() => { resolve(); }, 3000); });

            var queryRunKeys: any = {};
            var i = 0;
            resp.data.runs.forEach((element: any) => {
                const key = element.key;
                i++;
                queryRunKeys[key] = {
                    projectKey: element.projectKey,
                    done: false,
                    progress: 0,
                    timeout: 3000 * i
                };

                setTimeout(async () => {

                    await window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Running Query ..."//,
                        // cancellable: true
                    }, async progress => {
                        await wait1();
                        progress.report({ increment: 10 });
                        progress.report({ message: key });
                        await new Promise((resolve) => { setTimeout(() => { resolve(); }, queryRunKeys[key].timeout); });
                        // for (let i = 0; i < 10; ++i) {
                        //     progress.report({ increment: 10 });
                        //     await wait2();
                        // }
                    });

                }, 500);

            });

            // this.getProgress(queryRunKeys, (message) => {
            // }, () => {
            // resolve();
            // });

            workspace.openTextDocument({ language: "json", content: body }).then(document => {
                window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Two }).
                    then(document => {
                    });
            });
        });
    }

    public getProgress(queryRunKeys: any, showProgress: (message: string) => void, done: () => void) {
        var timer = setInterval(() => {
            var qs = "[" + Object.keys(queryRunKeys).join(",") + "]";
            console.log("Query run keys: " + qs);
            this.lgtm.getCustomQueryRunProgress(qs, (error, response, body) => {
                var progressResponse: { data: any } = JSON.parse(body);
                var allDone = true;
                var message = "";
                for (var key in progressResponse.data) {
                    var entry: { done: boolean, progress: number } = progressResponse.data[key];
                    console.log(entry);
                    if (entry.done === false) {
                        allDone = false;
                    }
                    queryRunKeys[key].done = entry.done;
                    queryRunKeys[key].progress = entry.progress;
                    // progress.report({ message: `Project ${queryRunKeys[key].projectKey} ${queryRunKeys[key].progress}%` });
                    message += entry.progress + "<b>asdf</b>\n\n";
                }
                console.log(`All done: ${allDone}`);
                if (allDone) {
                    console.log("All queries done");
                    clearInterval(timer);
                    done();
                } else {
                    showProgress(message);
                }
            });
        }, 2000);
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