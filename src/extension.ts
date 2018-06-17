'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StatusBarItem, window, StatusBarAlignment } from 'vscode';

import request = require('request');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log('Extension "lgtm-ql" is active');

    let runQuery = new RunQuery();
    let registerLgtm = new RegisterLgtm();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let runDisp = vscode.commands.registerCommand('extension.runQLQuery', () => {
        vscode.window.showInformationMessage('Hello World from Run QL!');
        runQuery.run();
    });

    let registerDisp = vscode.commands.registerCommand('extension.registerLgtm', () => {
        if (!runQuery.isRegistered()) {
            registerLgtm.register(runQuery);
        } else {
            runQuery.display();
        }
    });

    context.subscriptions.push(runQuery);

    context.subscriptions.push(runDisp);
    context.subscriptions.push(registerDisp);
}

class RunQuery {

    private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

    public nonce: string = "";
    public apiVersion: string = "";

    public isRegistered(): boolean {
        return this.nonce !== "" && this.apiVersion !== "";
    }

    public display() {
        vscode.window.showInformationMessage('nonce: ' + this.nonce);
        vscode.window.showInformationMessage('apiVersion: ' + this.apiVersion);
    }

    public run() {
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        if (doc.languageId === "ql") {
            let wordCount = this._sendQuery(doc);
            this._statusBarItem.text = wordCount !== 1 ? `${wordCount} Words` : '1 Word';
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }
    private _sendQuery(doc: vscode.TextDocument): number {
        let content = doc.getText();

        var projectKeys = "[39700035]";

        const r = request.post(
            "https://lgtm.com/internal_api/v0.2/runQuery", {
                jar: true,
                form: {
                    lang: "java",
                    projectKeys: projectKeys,
                    queryString: "import java\nfrom CastExpr ce select ce",
                    guessedLocation: "",
                    nonce: this.nonce,
                    apiVersion: this.apiVersion
                }
            }, function (error, response, body) {
                console.log('response:', response);
                console.log('error:', error);
                console.log('statusCode:', response && response.statusCode);
                console.log('body:', body);
            });
        console.log(r);

        return content.length;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class RegisterLgtm {

    public register(runQuery: RunQuery) {
        var extractValue = function (body: string, regex: string) {
            var m = body.match(regex);
            console.log(m);
            console.log(m[1]);
            return m[1];
        };

        request("https://lgtm.com/query", function (error, response, body) {
            console.log('response:', response);
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);

            runQuery.nonce = extractValue(body, "nonce: \"(\\w+)\"");
            console.log('nonce:', runQuery.nonce);
            runQuery.apiVersion = extractValue(body, "<div id=\"preloaded_content\" data-api-version=(\\w+)>");
            console.log('apiVersion:', runQuery.apiVersion);
            runQuery.display();
        });
    }
}

export function deactivate() {
}