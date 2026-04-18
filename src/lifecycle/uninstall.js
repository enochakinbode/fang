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
}

if (require.main === module) {
    main();
}

module.exports = {
    EXTENSION_ID,
    MANAGED_SERVER_DIR,
    getManagedServerCandidates,
    getProductUserDataRoots,
    main,
    removeIfPresent
};
