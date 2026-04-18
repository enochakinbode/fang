'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const uninstall = require('../src/lifecycle/uninstall');

function makeTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'fang-uninstall-'));
}

test('removes an existing managed server path', () => {
    const root = makeTempDir();
    const managedServerPath = path.join(root, 'User', 'globalStorage', uninstall.EXTENSION_ID, uninstall.MANAGED_SERVER_DIR);

    fs.mkdirSync(path.join(managedServerPath, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(managedServerPath, 'bin', 'vyper-lsp'), '');

    assert.equal(uninstall.removeIfPresent(managedServerPath), true);
    assert.equal(fs.existsSync(managedServerPath), false);
});

test('ignores missing managed server paths', () => {
    const root = makeTempDir();
    const managedServerPath = path.join(root, 'missing');

    assert.equal(uninstall.removeIfPresent(managedServerPath), false);
});

test('builds cleanup candidates under VS Code global storage', () => {
    const previousUserDataDir = process.env.VSCODE_USER_DATA_DIR;
    const root = makeTempDir();
    process.env.VSCODE_USER_DATA_DIR = root;

    try {
        const candidates = uninstall.getManagedServerCandidates();
        assert.ok(candidates.includes(path.join(root, 'User', 'globalStorage', uninstall.EXTENSION_ID, uninstall.MANAGED_SERVER_DIR)));
    } finally {
        if (previousUserDataDir === undefined) {
            delete process.env.VSCODE_USER_DATA_DIR;
        } else {
            process.env.VSCODE_USER_DATA_DIR = previousUserDataDir;
        }
    }
});
