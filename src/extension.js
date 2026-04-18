'use strict';

/** * @author github.com/enochakinbode
 * @license MIT
 **/

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const settings = require("./settings");
const mod_hover = require("./features/hover/hover.js");
const mod_lsp = require("./features/lsp.js");
const managedVyperLsp = require("./features/managedVyperLsp.js");

/**
 * Helper to identify Vyper-specific TextMate rules
 */
function isVyperRule(rule) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    return scopes.some(s => typeof s === 'string' && s.includes('.vyper'));
}

/**
 * Applies custom token colors by injecting them into the user's global settings.
 * Also disables semantic highlighting for Vyper to ensure these colors are visible.
 */
async function applyTokenColors(context) {
    try {
        const config = vscode.workspace.getConfiguration('vyper');
        const customThemeName = config.get('customTheme', '');

        let themeFileName = (customThemeName && customThemeName.trim() !== '')
            ? `${customThemeName.trim().replace(/\.json$/, '')}.json`
            : 'vyper-color-theme.json';

        let themePath = path.join(context.extensionPath, 'themes', themeFileName);
        if (!fs.existsSync(themePath)) {
            console.warn(`[Vyper] Theme file not found: ${themePath}, falling back to default theme.`);
            themeFileName = 'vyper-color-theme.json';
            themePath = path.join(context.extensionPath, 'themes', themeFileName);
        }

        const themeContent = JSON.parse(fs.readFileSync(themePath, 'utf8'));
        const themeRules = themeContent.tokenColors || [];

        const editorConfig = vscode.workspace.getConfiguration();

        const inspect = editorConfig.inspect('editor.tokenColorCustomizations');
        const target = inspect && inspect.workspaceValue !== undefined
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;

        const currentCustomizations = inspect
            ? ((target === vscode.ConfigurationTarget.Workspace ? inspect.workspaceValue : inspect.globalValue) || {})
            : (editorConfig.get('editor.tokenColorCustomizations', {}) || {});

        const existingRules = currentCustomizations.textMateRules || [];
        const filteredRules = existingRules.filter(rule => !isVyperRule(rule));

        const highlightSecurity = config.get('theme.highlightSecurityDecorators', true);

        // Find base decorator color
        const decoratorRule = themeRules.find(r =>
            (Array.isArray(r.scope) ? r.scope.join(' ') : r.scope || '')
                .includes('storage.type.modifier.decorator.vyper')
        );
        const decoratorColor = decoratorRule?.settings?.foreground || '#D4D4D4';

        const finalVyperRules = themeRules.map(rule => {
            const scopeString = Array.isArray(rule.scope) ? rule.scope.join(' ') : (rule.scope || '');
            if (scopeString.includes('storage.type.modifier.security.vyper')) {
                return {
                    ...rule,
                    settings: { ...rule.settings, foreground: highlightSecurity ? '#fb0b0b' : decoratorColor }
                };
            }
            return rule;
        });

        const updatedCustomizations = {
            ...currentCustomizations,
            textMateRules: [...filteredRules, ...finalVyperRules]
        };

        // Apply the update to the detected target (Global or Workspace)
        await editorConfig.update('editor.tokenColorCustomizations', updatedCustomizations, target);

        // Also force the semantic highlighting off for the same target
        const vyperLangConfig = vscode.workspace.getConfiguration('[vyper]');
        await vyperLangConfig.update('editor.semanticHighlighting.enabled', false, target);

        console.log(`[Vyper] Applied ${themeFileName} theme at ${target === vscode.ConfigurationTarget.Workspace ? 'Workspace' : 'Global'} level.`);
    } catch (error) {
        console.error('[Vyper] Failed to apply token colors:', error);
    }
}

/**
 * Initializes all sub-modules
 */
async function onInitModules(context, type) {
    mod_hover.init(context, type);

    // Ensure theme is applied before LSP starts
    await applyTokenColors(context);

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

        // 2. Handle Theme/Decorator changes
        if (
            event.affectsConfiguration('vyper.customTheme') ||
            event.affectsConfiguration('vyper.theme.highlightSecurityDecorators') ||
            event.affectsConfiguration('vyper')
        ) {
            await applyTokenColors(context);
        }
    }));
}

/**
 * Cleanup on deactivation
 */
async function deactivate() {
    await mod_lsp.stop();

    // Cleanup the injected theme settings to leave the user's config clean
    const editorConfig = vscode.workspace.getConfiguration();
    const current = editorConfig.get('editor.tokenColorCustomizations', {});
    if (current.textMateRules) {
        const cleaned = current.textMateRules.filter(rule => !isVyperRule(rule));
        await editorConfig.update('editor.tokenColorCustomizations', { ...current, textMateRules: cleaned }, vscode.ConfigurationTarget.Global);
    }
}

exports.activate = activate;
exports.deactivate = deactivate;
