'use strict';

const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
const settings = require('../settings');

let client = null;

function init(context, type) {
    // Check if LSP is enabled
    const config = settings.extensionConfig();
    if (config.lsp?.enabled === false) {
        console.log('ⓘ LSP is disabled in settings');
        return null;
    }

    // Get the language server command from settings
    const serverCommand = config.lsp?.serverCommand || 'vyper-lsp'; // Default command
    const serverArgs = config.lsp?.serverArgs || [];

    // Server options - defines how to start the language server
    const serverOptions = {
        run: {
            command: serverCommand,
            args: serverArgs,
            transport: TransportKind.stdio
        },
        debug: {
            command: serverCommand,
            args: serverArgs,
            transport: TransportKind.stdio
        }
    };

    // Client options - defines how VS Code communicates with the server
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: type }],
        synchronize: {
            // Synchronize file changes to the server
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.{vy,vyi}')
        },
        initializationOptions: {
            // Options to pass to the server during initialization
        }
    };

    // Create the language client
    client = new LanguageClient(
        'vyperLanguageServer',
        'Vyper Language Server',
        serverOptions,
        clientOptions
    );

    // ===== REQUEST HANDLERS =====
    // These handle requests FROM the server TO the client

    // Handle workspace/configuration request
    client.onRequest('workspace/configuration', (params) => {
        // Return configuration for the requested scope
        const config = vscode.workspace.getConfiguration('vyper');
        return config;
    });

    // Handle custom requests from the server
    client.onRequest('custom/request', (params) => {
        // Handle custom request
        return { result: 'custom response' };
    });

    // ===== NOTIFICATION HANDLERS =====
    // These handle notifications FROM the server TO the client

    // Handle window/showMessage notifications
    client.onNotification('window/showMessage', (params) => {
        const { type, message } = params;
        const messageType = type === 1 ? vscode.MessageType.Warning :
            type === 2 ? vscode.MessageType.Error :
                type === 3 ? vscode.MessageType.Info :
                    vscode.MessageType.Info;
        vscode.window.showMessage(message, messageType);
    });

    // Handle window/logMessage notifications
    client.onNotification('window/logMessage', (params) => {
        const { type, message } = params;
        console.log(`[LSP ${type}] ${message}`);
    });

    // Handle custom notifications from the server
    client.onNotification('custom/notification', (params) => {
        console.log('Custom notification received:', params);
    });

    // Handle telemetry/event notifications
    client.onNotification('telemetry/event', (params) => {
        // Handle telemetry data if needed
        console.log('Telemetry event:', params);
    });

    // ===== CLIENT EVENT HANDLERS =====

    // Handle errors
    client.onDidChangeState((event) => {
        if (event.newState === 2) { // Stopped
            console.log('Language server stopped');
        }
    });

    // Start the client - start() returns a Promise that resolves when ready
    client.start().then(() => {
        console.log('Vyper Language Server is ready');

        // Register custom request handlers that the CLIENT sends to the server
        // These are done via client.sendRequest()
    }).catch((error) => {
        console.error('Failed to start language server:', error);
    });

    // Add the client to subscriptions for cleanup
    context.subscriptions.push(client);

    return client;
}

function getClient() {
    return client;
}

// Restart the language server
async function restart(context, type) {
    if (client) {
        try {
            console.log('Restarting Vyper Language Server...');
            await client.stop();
            // Wait a bit before restarting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error stopping language server:', error);
        }
    }
    // Reinitialize the client
    return init(context, type);
}

// Send a request TO the server
async function sendRequest(method, params) {
    if (client && client.isRunning()) {
        return await client.sendRequest(method, params);
    }
    throw new Error('Language server is not running');
}

// Send a notification TO the server
function sendNotification(method, params) {
    if (client && client.isRunning()) {
        client.sendNotification(method, params);
    }
}

module.exports = {
    init,
    getClient,
    restart,
    sendRequest,
    sendNotification
};

