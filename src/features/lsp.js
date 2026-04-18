'use strict';

const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
const managedVyperLsp = require('./managedVyperLsp');

let client = null;
let outputChannel = null;
let declinedManagedInstallThisSession = false;

function getOutputChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Vyper Language Server');
    }
    return outputChannel;
}

async function stop() {
    if (client) {
        try {
            await client.stop();
            client.dispose();
            client = null;
            console.log('Vyper Language Server stopped');
        } catch (error) {
            console.error('Error stopping language server:', error);
        }
    }
}

async function init(context, type) {
    // 1. Force stop any existing client
    await stop();

    // 2. GET FRESH CONFIG - Do not rely on a static settings object
    const config = vscode.workspace.getConfiguration('vyper');
    const lspEnabled = config.get('lsp.enabled', true);

    if (!lspEnabled) {
        console.log('ⓘ LSP is disabled in settings');
        return null;
    }

    const configuredServerCommand = config.get('lsp.serverCommand', '');
    let progressReporter = null;
    let serverCommandInfo = null;

    try {
        serverCommandInfo = await managedVyperLsp.resolveServerCommand({
            context,
            serverCommand: configuredServerCommand,
            confirmInstall: async ({ packageVersion, python }) => {
                if (declinedManagedInstallThisSession) {
                    return false;
                }

                const pythonVersion = managedVyperLsp.formatPythonVersion(python.version);
                const choice = await vscode.window.showWarningMessage(
                    `Fang needs to prepare the built-in Vyper language server. This installs vyper-lsp ${packageVersion} into Fang's private storage using Python ${pythonVersion}.`,
                    'Install',
                    'Not Now'
                );

                const confirmed = choice === 'Install';
                if (!confirmed) {
                    declinedManagedInstallThisSession = true;
                }
                return confirmed;
            },
            withProgress: (task) => vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Preparing Vyper language server',
                    cancellable: false
                },
                async (progress) => {
                    progressReporter = progress;
                    try {
                        return await task();
                    } finally {
                        progressReporter = null;
                    }
                }
            ),
            reporter: (message) => {
                progressReporter?.report({ message });
            }
        });
    } catch (error) {
        const message = error?.message || String(error);
        console.error('Failed to resolve Vyper language server:', error);
        vscode.window.showErrorMessage(`Fang could not start the Vyper language server. ${message}`);
        return null;
    }

    const serverCommand = serverCommandInfo.command;
    const serverOptions = {
        run: { command: serverCommand, transport: TransportKind.stdio },
        debug: { command: serverCommand, transport: TransportKind.stdio }
    };

    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: type }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.{vy,vyi}')
        },
        outputChannel: getOutputChannel(),
    };

    client = new LanguageClient(
        'vyperLanguageServer',
        'Vyper Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client
    try {
        await client.start();
        console.log('Vyper Language Server is ready');
        context.subscriptions.push(client);
    } catch (error) {
        console.error('Failed to start language server:', error);
    }

    return client;
}

module.exports = {
    init,
    stop,
    getClient: () => client,
    restart: (context, type) => init(context, type)
};
