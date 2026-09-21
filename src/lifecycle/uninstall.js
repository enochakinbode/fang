'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const EXTENSION_ID = 'enochakinbode.fang';
const MANAGED_SERVER_DIR = 'vyper-lsp';

function unique(items) {
    return [...new Set(items.filter(Boolean))];
}

function getProductUserDataRoots() {
    const home = os.homedir();
    const roots = [];

    if (process.env.VSCODE_USER_DATA_DIR) {
        roots.push(process.env.VSCODE_USER_DATA_DIR);
    }

    if (process.platform === 'darwin') {
        const appSupport = path.join(home, 'Library', 'Application Support');
        roots.push(
            path.join(appSupport, 'Code'),
            path.join(appSupport, 'Code - Insiders'),
            path.join(appSupport, 'VSCodium'),
            path.join(appSupport, 'Codium')
        );
    } else if (process.platform === 'win32') {
        const appData = process.env.APPDATA;
        roots.push(
            appData && path.join(appData, 'Code'),
            appData && path.join(appData, 'Code - Insiders'),
            appData && path.join(appData, 'VSCodium'),
            appData && path.join(appData, 'Codium')
        );
    } else {
        const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
        roots.push(
            path.join(configHome, 'Code'),
            path.join(configHome, 'Code - Insiders'),
            path.join(configHome, 'VSCodium'),
            path.join(configHome, 'codium')
        );
    }

    return unique(roots);
}

function getManagedServerCandidates() {
    return getProductUserDataRoots().map((root) =>
        path.join(root, 'User', 'globalStorage', EXTENSION_ID, MANAGED_SERVER_DIR)
    );
}

function removeIfPresent(targetPath) {
    if (!fs.existsSync(targetPath)) {
        return false;
    }

    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
}

/**
 * Returns true when the rule was injected by Fang, i.e. targets a `.vyper` scope.
 */
function isInjectedVyperRule(rule) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    return scopes.some((s) => typeof s === 'string' && s.includes('.vyper'));
}

/**
 * Removes everything Fang injected into a parsed settings object, in place.
 * Returns true if anything was removed. Non-Vyper customizations are kept.
 */
function cleanSettings(settings) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return false;
    }

    let changed = false;

    const tokenCustomizations = settings['editor.tokenColorCustomizations'];
    if (tokenCustomizations && typeof tokenCustomizations === 'object') {
        if (Array.isArray(tokenCustomizations.textMateRules)) {
            const filtered = tokenCustomizations.textMateRules.filter((rule) => !isInjectedVyperRule(rule));
            if (filtered.length !== tokenCustomizations.textMateRules.length) {
                changed = true;
                if (filtered.length === 0) {
                    delete tokenCustomizations.textMateRules;
                } else {
                    tokenCustomizations.textMateRules = filtered;
                }
            }
        }
        if (Object.keys(tokenCustomizations).length === 0) {
            delete settings['editor.tokenColorCustomizations'];
            changed = true;
        }
    }

    const vyperOverrides = settings['[vyper]'];
    if (vyperOverrides && typeof vyperOverrides === 'object') {
        if (Object.prototype.hasOwnProperty.call(vyperOverrides, 'editor.semanticHighlighting.enabled')) {
            delete vyperOverrides['editor.semanticHighlighting.enabled'];
            changed = true;
        }
        if (Object.keys(vyperOverrides).length === 0) {
            delete settings['[vyper]'];
        }
    }

    return changed;
}

function getCleanupSettingsPaths() {
    return getProductUserDataRoots().map((root) => path.join(root, 'User', 'settings.json'));
}

function cleanSettingsFile(settingsPath) {
    if (!fs.existsSync(settingsPath)) {
        return false;
    }

    let content;
    try {
        content = fs.readFileSync(settingsPath, 'utf8');
    } catch (error) {
        console.warn(`Failed to read settings file ${settingsPath}: ${error.message}`);
        return false;
    }

    let settings;
    try {
        settings = JSON.parse(content);
    } catch (error) {
        console.warn(`Skipping settings file ${settingsPath}: not valid JSON (${error.message})`);
        return false;
    }

    if (!cleanSettings(settings)) {
        return false;
    }

    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4) + '\n', 'utf8');
        console.log(`Removed Fang settings from ${settingsPath}`);
        return true;
    } catch (error) {
        console.warn(`Failed to write settings file ${settingsPath}: ${error.message}`);
        return false;
    }
}

function main() {
    for (const candidate of getManagedServerCandidates()) {
        try {
            if (removeIfPresent(candidate)) {
                console.log(`Removed Fang managed Vyper language server: ${candidate}`);
            }
        } catch (error) {
            console.warn(`Failed to remove Fang managed Vyper language server at ${candidate}: ${error.message}`);
        }
    }

    for (const settingsPath of getCleanupSettingsPaths()) {
        try {
            cleanSettingsFile(settingsPath);
        } catch (error) {
            console.warn(`Failed to clean settings file ${settingsPath}: ${error.message}`);
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    EXTENSION_ID,
    MANAGED_SERVER_DIR,
    cleanSettings,
    cleanSettingsFile,
    getCleanupSettingsPaths,
    getManagedServerCandidates,
    getProductUserDataRoots,
    main,
    removeIfPresent
};
