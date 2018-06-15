'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StatusBarItem, window, StatusBarAlignment } from 'vscode';

import request = require('request');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "lgtm-ql" is active');

    let runQuery = new RunQuery();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.runQLQuery', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');

        runQuery.run();
    });

    context.subscriptions.push(runQuery);
    context.subscriptions.push(disposable);
}

class RunQuery {

    private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

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

        var r = request("https://lgtm.com/internal_api/v0.2/runQuery");
        console.log(r);


        return content.length;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}