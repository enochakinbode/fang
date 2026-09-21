'use strict';

/** * @author github.com/enochakinbode
 * @license MIT
 **/

const vscode = require("vscode");

const settings = require("./settings");
const mod_hover = require("./features/hover/hover.js");
const mod_lsp = require("./features/lsp.js");
const managedVyperLsp = require("./features/managedVyperLsp.js");

const SECURITY_SCOPE = 'storage.type.modifier.security.vyper';
const SECURITY_COLOR = '#fb0b0b';

/**
 * Matches textMate rules that Fang injects into the user config.
 */
function isInjectedVyperRule(rule) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    return scopes.some(s => typeof s === 'string' && s.includes('.vyper'));
}

/**
 * Applies the security decorator override (if enabled) by injecting a single
 * rule into `editor.tokenColorCustomizations`. The themes are contributed as
 * real themes now, so this is the only thing Fang writes to user settings.
 */
async function applyDecoratorOverride() {
    try {
        const config = vscode.workspace.getConfiguration('vyper');
        const highlightSecurity = config.get('theme.highlightSecurityDecorators', true);

        const editorConfig = vscode.workspace.getConfiguration();
        const inspect = editorConfig.inspect('editor.tokenColorCustomizations');
        const target = inspect && inspect.workspaceValue !== undefined
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;

        const currentCustomizations = inspect
            ? ((target === vscode.ConfigurationTarget.Workspace ? inspect.workspaceValue : inspect.globalValue) || {})
            : (editorConfig.get('editor.tokenColorCustomizations', {}) || {});

        const existingRules = currentCustomizations.textMateRules || [];
        const filteredRules = existingRules.filter(rule => !isInjectedVyperRule(rule));

        const textMateRules = highlightSecurity
            ? [...filteredRules, { scope: SECURITY_SCOPE, settings: { foreground: SECURITY_COLOR } }]
            : filteredRules;

        await editorConfig.update('editor.tokenColorCustomizations', {
            ...currentCustomizations,
            textMateRules
        }, target);

        // Keep the theme's token colors authoritative by disabling semantic tokens for Vyper.
        const vyperLangConfig = vscode.workspace.getConfiguration('[vyper]');
        await vyperLangConfig.update('editor.semanticHighlighting.enabled', false, target);

        console.log(`[Vyper] Security decorator highlighting ${highlightSecurity ? 'enabled' : 'disabled'} at ${target === vscode.ConfigurationTarget.Workspace ? 'Workspace' : 'Global'} level.`);
    } catch (error) {
        console.error('[Vyper] Failed to apply decorator override:', error);
    }
}

/**
 * Removes everything Fang injected into the user config:
 * - the injected `.vyper` textMate rule(s) (decorator override, plus any legacy theme pollution)
 * - the `[vyper]` semantic highlighting disable
 */
async function cleanupUserConfig() {
    try {
        const editorConfig = vscode.workspace.getConfiguration();
        const inspect = editorConfig.inspect('editor.tokenColorCustomizations');
        const vyperLangConfig = vscode.workspace.getConfiguration('[vyper]');
        const langInspect = vyperLangConfig.inspect('editor.semanticHighlighting.enabled');

        for (const target of [vscode.ConfigurationTarget.Global, vscode.ConfigurationTarget.Workspace]) {
            const value = target === vscode.ConfigurationTarget.Global ? inspect?.globalValue : inspect?.workspaceValue;
            if (value && Array.isArray(value.textMateRules) && value.textMateRules.some(isInjectedVyperRule)) {
                const cleaned = value.textMateRules.filter(rule => !isInjectedVyperRule(rule));
                await editorConfig.update('editor.tokenColorCustomizations', { ...value, textMateRules: cleaned }, target);
            }
            const langValue = target === vscode.ConfigurationTarget.Global ? langInspect?.globalValue : langInspect?.workspaceValue;
            if (langValue !== undefined) {
                await vyperLangConfig.update('editor.semanticHighlighting.enabled', undefined, target);
            }
        }
    } catch (error) {
        console.error('[Vyper] Failed to clean up injected settings:', error);
    }
}

/**
 * Initializes all sub-modules
 */
async function onInitModules(context, type) {
    mod_hover.init(context, type);

    // Ensure decorator override is applied before LSP starts
    await applyDecoratorOverride();

    // Register restart command
    const restartCommand = vscode.commands.registerCommand('vyper.restartLspServer', async () => {
        try {
            await mod_lsp.restart(context, type);
            vscode.window.showInformationMessage('Vyper LSP Server restarted');
        } catch (e) {
            vscode.window.showErrorMessage(`LSP Restart Failed: ${e.message}`);
        }
    });
    context.subscriptions.push(restartCommand);

    const clearManagedServerCommand = vscode.commands.registerCommand('vyper.clearManagedLspServer', async () => {
        try {
            await mod_lsp.stop();
            await managedVyperLsp.removeManagedServer({ context });
            vscode.window.showInformationMessage('Fang managed Vyper language server cleared. It will be prepared again the next time it is needed.');
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to clear Fang managed Vyper language server: ${e.message}`);
        }
    });
    context.subscriptions.push(clearManagedServerCommand);

    // Init LSP (it internally checks if enabled)
    await mod_lsp.init(context, type);
}

async function activate(context) {
    const type = settings.LANGUAGE_ID;

    // Language configuration
    vscode.languages.setLanguageConfiguration(type, {
        onEnterRules: [{
            beforeText: /^\s*(?:struct|flag|event|interface|def|class|for|if|elif|else).*?:\s*$/,
            action: { indentAction: vscode.IndentAction.Indent }
        }]
    });

    // Run module initialization
    await onInitModules(context, type);

    // Handle Configuration Changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async event => {
        // 1. Handle LSP toggle
        if (
            event.affectsConfiguration('vyper.lsp.enabled') ||
            event.affectsConfiguration('vyper.lsp.serverCommand')
        ) {
            const config = vscode.workspace.getConfiguration('vyper');
            if (config.get('lsp.enabled')) {
                await mod_lsp.init(context, type);
            } else {
                await mod_lsp.stop();
            }
        }

        // 2. Handle decorator highlight toggle
        if (event.affectsConfiguration('vyper.theme.highlightSecurityDecorators')) {
            await applyDecoratorOverride();
        }
    }));
}

/**
 * Cleanup on deactivation
 */
async function deactivate() {
    await mod_lsp.stop();

    // Remove injected settings so the user's config is left clean
    await cleanupUserConfig();
}

exports.activate = activate;
exports.deactivate = deactivate;
