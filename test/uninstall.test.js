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

test('removes injected vyper textMate rules and keeps other rules', () => {
    const settings = {
        'editor.tokenColorCustomizations': {
            textMateRules: [
                { scope: 'storage.type.modifier.security.vyper', settings: { foreground: '#fb0b0b' } },
                { scope: 'keyword.control.python', settings: { foreground: '#ff0000' } }
            ]
        }
    };

    assert.equal(uninstall.cleanSettings(settings), true);
    assert.deepEqual(settings['editor.tokenColorCustomizations'].textMateRules, [
        { scope: 'keyword.control.python', settings: { foreground: '#ff0000' } }
    ]);
});

test('drops editor.tokenColorCustomizations when only vyper rules remain', () => {
    const settings = {
        'editor.tokenColorCustomizations': {
            textMateRules: [
                { scope: 'comment.line.number-sign.vyper', settings: { foreground: '#75715E' } }
            ]
        }
    };

    assert.equal(uninstall.cleanSettings(settings), true);
    assert.equal('editor.tokenColorCustomizations' in settings, false);
});

test('removes the vyper semantic highlighting disable from [vyper]', () => {
    const settings = {
        '[vyper]': {
            'editor.semanticHighlighting.enabled': false,
            'editor.tabSize': 4
        }
    };

    assert.equal(uninstall.cleanSettings(settings), true);
    assert.equal('[vyper]' in settings, true);
    assert.deepEqual(settings['[vyper]'], { 'editor.tabSize': 4 });
});

test('drops [vyper] when it only holds Fang settings', () => {
    const settings = {
        '[vyper]': {
            'editor.semanticHighlighting.enabled': false
        }
    };

    assert.equal(uninstall.cleanSettings(settings), true);
    assert.equal('[vyper]' in settings, false);
});

test('leaves settings with no Fang entries untouched', () => {
    const settings = {
        'editor.tokenColorCustomizations': {
            textMateRules: [{ scope: 'keyword.control.python', settings: { foreground: '#ff0000' } }]
        }
    };

    assert.equal(uninstall.cleanSettings(settings), false);
});

test('cleans Fang settings from a settings.json file', () => {
    const root = makeTempDir();
    const settingsPath = path.join(root, 'settings.json');

    fs.writeFileSync(settingsPath, JSON.stringify({
        'editor.tokenColorCustomizations': {
            textMateRules: [{ scope: 'storage.type.modifier.security.vyper', settings: { foreground: '#fb0b0b' } }]
        },
        '[vyper]': {
            'editor.semanticHighlighting.enabled': false
        }
    }, null, 4));

    assert.equal(uninstall.cleanSettingsFile(settingsPath), true);
    assert.deepEqual(JSON.parse(fs.readFileSync(settingsPath, 'utf8')), {});
});

test('ignores missing settings files', () => {
    const root = makeTempDir();
    assert.equal(uninstall.cleanSettingsFile(path.join(root, 'nope.json')), false);
});

test('never rewrites invalid JSON settings', () => {
    const root = makeTempDir();
    const settingsPath = path.join(root, 'settings.json');

    fs.writeFileSync(settingsPath, '// a comment\n{\n  "editor.tabSize": 4,\n');
    assert.equal(uninstall.cleanSettingsFile(settingsPath), false);
    assert.equal(fs.readFileSync(settingsPath, 'utf8'), '// a comment\n{\n  "editor.tabSize": 4,\n');
});
