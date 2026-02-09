'use strict';

const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');

let client = null;
let outputChannel = null;

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

    const serverCommand = config.get('lsp.serverCommand', 'vyper-lsp');
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