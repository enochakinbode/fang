'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * language definition based on: https://raw.githubusercontent.com/Microsoft/vscode/master/extensions/python/syntaxes/MagicPython.tmLanguage.json (MIT)
 * compilation related parts taken from: https://github.com/trufflesuite/truffle/tree/develop/packages/truffle-compile-vyper (MIT)
 * */

/** imports */
const vscode = require("vscode");

const settings = require("./settings");
const mod_hover = require("./features/hover/hover.js");
/** global vars */
var activeEditor;

/** classdecs */


/** funcdecs */


/** event funcs */
async function onDidSave(document) {
    if (document.languageId != settings.LANGUAGE_ID) {
        console.log("Language ID mismatch");
        return;
    }

    const fileExtension = document.fileName.split('.').pop();

    if (fileExtension != "vy") {
        console.log("Skipping compilation for interface file");
        return;
    }
}

async function onDidChange(event) {
    if (vscode.window.activeTextEditor.document.languageId != settings.LANGUAGE_ID) {
        return;
    }

}
async function applyTokenColors(context) {
    try {
        const themeUri = vscode.Uri.joinPath(context.extensionUri, 'themes', 'vyper-spec-theme.json');
        const themeBytes = await vscode.workspace.fs.readFile(themeUri);
        const themeContent = new TextDecoder('utf-8').decode(themeBytes);
        const theme = JSON.parse(themeContent);

        if (theme.tokenColors && Array.isArray(theme.tokenColors)) {
            const config = vscode.workspace.getConfiguration();
            const currentCustomizations = config.get('editor.tokenColorCustomizations', {});

            // Merge with existing token color customizations
            const mergedCustomizations = {
                ...currentCustomizations,
                textMateRules: [
                    ...(currentCustomizations.textMateRules || []),
                    ...theme.tokenColors
                ]
            };

            await config.update('editor.tokenColorCustomizations', mergedCustomizations, vscode.ConfigurationTarget.Global);
        }
    } catch (error) {
        console.error('Failed to apply token colors:', error);
    }
}

function onInitModules(context, type) {
    mod_hover.init(context, type);

    // Apply token colors from theme file
    applyTokenColors(context);

    // Register restart LSP server command (not available in web mode)
    const restartCommand = vscode.commands.registerCommand('vyper.restartLspServer', async () => {
        vscode.window.showWarningMessage('Vyper LSP Server restart is not available in web mode. Please use the desktop version of VS Code.');
    });
    context.subscriptions.push(restartCommand);
}

function onActivate(context) {

    const active = vscode.window.activeTextEditor;
    activeEditor = active;

    registerDocType(settings.LANGUAGE_ID);

    function registerDocType(type) {
        // taken from: https://github.com/Microsoft/vscode/blob/master/extensions/python/src/pythonMain.ts ; slightly modified
        // autoindent while typing
        vscode.languages.setLanguageConfiguration(type, {
            onEnterRules: [
                {
                    beforeText: /^\s*(?:struct|flag|event|interface|def|class|for|if|elif|else).*?:\s*$/,
                    action: { indentAction: vscode.IndentAction.Indent }
                }
            ]
        });

        // Initialize modules including command registration
        onInitModules(context, type);
        onDidChange();
        onDidSave(active.document);

        /** event setup */
        /***** OnChange */
        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) {
                onDidChange();
            }
        }, null, context.subscriptions);
        /***** OnChange */
        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                onDidChange(event);
            }
        }, null, context.subscriptions);
        /***** OnSave */

        vscode.workspace.onDidSaveTextDocument(document => {
            onDidSave(document);
        }, null, context.subscriptions);

        /****** OnOpen */
        vscode.workspace.onDidOpenTextDocument(document => {
            onDidSave(document);
        }, null, context.subscriptions);

        /***** SignatureHelper */
        /*
        context.subscriptions.push(
            vscode.languages.registerSignatureHelpProvider(
                { language: type },
                new mod_signatures.VyperSignatureHelpProvider(),
                '(', ','
            )
        );
        */

    }
}

// Add deactivate function for consistency
function onDeactivate() {
    // No cleanup needed for web mode
}

/* exports */
exports.activate = onActivate;
exports.deactivate = onDeactivate;
