import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('MouCodeBrain extension is now active!');

    const disposable = vscode.commands.registerCommand('moucodebrain.ask', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        // Get user's question
        const question = await vscode.window.showInputBox({
            prompt: 'Ask MouCodeBrain about this code',
            placeHolder: 'e.g., What does this function do?'
        });

        if (!question) {
            return;
        }

        // Show progress indicator
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "MouCodeBrain is analyzing...",
            cancellable: false
        }, async (progress) => {
            try {
                // Get current repository context
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    throw new Error('No workspace folder found');
                }

                // Call your AI engine
                const response = await axios.post('http://localhost:8000/query', {
                    repo_id: workspaceFolder.name,
                    query: `Context from selected code:\n${selectedText}\n\nQuestion: ${question}`,
                    context: {
                        file_path: editor.document.fileName,
                        selected_code: selectedText
                    }
                });

                // Show response in a new panel
                const panel = vscode.window.createWebviewPanel(
                    'moucodebrain-response',
                    'MouCodeBrain Response',
                    vscode.ViewColumn.Beside,
                    {}
                );

                panel.webview.html = getWebviewContent(response.data.response);

            } catch (error) {
                vscode.window.showErrorMessage('Failed to get response from MouCodeBrain');
                console.error(error);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(response: string): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    line-height: 1.6;
                    color: #333;
                }
                pre {
                    background: #f4f4f4;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                code {
                    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
                }
            </style>
        </head>
        <body>
            <div class="response">
                ${response.replace(/\n/g, '<br>')}
            </div>
        </body>
        </html>
    `;
}

export function deactivate() { }