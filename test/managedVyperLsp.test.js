'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createManagedVyperLsp } = require('../src/features/managedVyperLsp');

function makeTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'fang-managed-lsp-'));
}

function pythonSpawn(version = [3, 12, 7], executable = '/usr/bin/python3.12') {
    return () => ({
        status: 0,
        stdout: JSON.stringify({
            executable,
            version
        })
    });
}

function missingPythonSpawn() {
    return { status: 1, stdout: '', stderr: '' };
}

function multiPythonSpawn(entries) {
    return (command) => {
        const entry = entries[command];
        if (!entry) {
            return { status: 1, stdout: '', stderr: '' };
        }

        return {
            status: 0,
            stdout: JSON.stringify({
                executable: entry.executable ?? `/${command}`,
                version: entry.version
            })
        };
    };
}

function createExecFileMock(manager, globalStoragePath, platform, calls) {
    return (command, args, _options, callback) => {
        calls.push({ command, args });

        if (args[0] === '-m' && args[1] === 'venv') {
            const envPath = args[2];
            const envPython = manager.getManagedPythonPath(envPath, platform);
            fs.mkdirSync(path.dirname(envPython), { recursive: true });
            fs.writeFileSync(envPython, '');
            callback(null, '', '');
            return;
        }

        if (args[0] === '-m' && args[1] === 'pip' && args[2] === '--version') {
            callback(null, 'pip 24.0', '');
            return;
        }

        if (args[0] === '-m' && args[1] === 'pip' && args[2] === 'install') {
            const envPath = manager.getManagedEnvPath(globalStoragePath);
            const executable = manager.getManagedExecutablePath(envPath, platform);
            fs.mkdirSync(path.dirname(executable), { recursive: true });
            fs.writeFileSync(executable, '');
            callback(null, '', '');
            return;
        }

        callback(null, '', '');
    };
}

test('uses a custom server command without managed setup', async () => {
    const manager = createManagedVyperLsp({
        spawnSync() {
            throw new Error('python discovery should not run');
        }
    });

    const result = await manager.resolveServerCommand({
        serverCommand: 'vyper-lsp-custom'
    });

    assert.equal(result.mode, 'custom');
    assert.equal(result.command, 'vyper-lsp-custom');
});

test('empty server command resolves to the managed server', async () => {
    const globalStoragePath = makeTempDir();
    const calls = [];
    let manager;
    manager = createManagedVyperLsp({
        spawnSync: pythonSpawn([3, 12, 7]),
        execFile: (...args) => createExecFileMock(manager, globalStoragePath, 'darwin', calls)(...args)
    });

    const result = await manager.resolveServerCommand({
        serverCommand: '',
        globalStoragePath,
        platform: 'darwin',
        confirmInstall: async () => true
    });

    assert.equal(result.mode, 'managed');
    assert.match(result.command, /bin\/vyper-lsp$/);
});

test('fails clearly when Python is missing', async () => {
    const manager = createManagedVyperLsp({
        spawnSync: missingPythonSpawn
    });

    await assert.rejects(
        manager.ensureManagedServer({
            globalStoragePath: makeTempDir(),
            platform: 'linux'
        }),
        /could not find Python 3\.12 or newer/i
    );
});

test('fails clearly when Python is below 3.12', async () => {
    const manager = createManagedVyperLsp({
        spawnSync: pythonSpawn([3, 11, 9])
    });

    await assert.rejects(
        manager.ensureManagedServer({
            globalStoragePath: makeTempDir(),
            platform: 'linux'
        }),
        /requires Python 3\.12 or newer/i
    );
});

test('accepts Python 3.12, 3.13, and newer 3.x versions', () => {
    const manager = createManagedVyperLsp();

    assert.equal(manager.isSupportedPythonVersion({ major: 3, minor: 12, patch: 0 }), true);
    assert.equal(manager.isSupportedPythonVersion({ major: 3, minor: 13, patch: 1 }), true);
    assert.equal(manager.isSupportedPythonVersion({ major: 3, minor: 20, patch: 0 }), true);
});

test('creates the environment and installs pinned vyper-lsp on first run', async () => {
    const globalStoragePath = makeTempDir();
    const calls = [];
    const reported = [];
    let manager;
    manager = createManagedVyperLsp({
        spawnSync: pythonSpawn([3, 13, 2], '/opt/python3.13/bin/python'),
        execFile: (...args) => createExecFileMock(manager, globalStoragePath, 'linux', calls)(...args)
    });

    const result = await manager.ensureManagedServer({
        globalStoragePath,
        platform: 'linux',
        confirmInstall: async () => true,
        reporter: (message) => reported.push(message)
    });

    const venvCall = calls.find((call) => call.args[0] === '-m' && call.args[1] === 'venv');
    const pipInstall = calls.find((call) => call.args[0] === '-m' && call.args[1] === 'pip' && call.args[2] === 'install');
    const metadata = JSON.parse(fs.readFileSync(manager.getMetadataPath(globalStoragePath), 'utf8'));

    assert.equal(result.mode, 'managed');
    assert.ok(venvCall, 'expected venv creation');
    assert.ok(pipInstall, 'expected pip install');
    assert.ok(pipInstall.args.includes('vyper-lsp==0.1.4'));
    assert.equal(pipInstall.args.includes('--no-index'), false);
    assert.equal(metadata.packageVersion, '0.1.4');
    assert.deepEqual(reported, [
        'Creating Fang private Python environment',
        'Preparing pip',
        'Installing vyper-lsp 0.1.4'
    ]);
});

test('skips reinstall when metadata and executable are current', async () => {
    const globalStoragePath = makeTempDir();
    const calls = [];
    let manager;
    manager = createManagedVyperLsp({
        spawnSync: pythonSpawn([3, 12, 8]),
        execFile: (...args) => createExecFileMock(manager, globalStoragePath, 'darwin', calls)(...args)
    });

    await manager.ensureManagedServer({
        globalStoragePath,
        platform: 'darwin',
        confirmInstall: async () => true
    });
    calls.length = 0;

    const result = await manager.ensureManagedServer({
        globalStoragePath,
        platform: 'darwin',
        confirmInstall: async () => {
            throw new Error('confirm should not run');
        }
    });

    assert.equal(result.mode, 'managed');
    assert.equal(calls.length, 0);
});

test('rebuilds when metadata is stale', async () => {
    const globalStoragePath = makeTempDir();
    const calls = [];
    let manager;
    manager = createManagedVyperLsp({
        spawnSync: pythonSpawn([3, 12, 8]),
        execFile: (...args) => createExecFileMock(manager, globalStoragePath, 'linux', calls)(...args)
    });

    const envPath = manager.getManagedEnvPath(globalStoragePath);
    const executable = manager.getManagedExecutablePath(envPath, 'linux');
    fs.mkdirSync(path.dirname(executable), { recursive: true });
    fs.writeFileSync(executable, '');
    fs.writeFileSync(manager.getMetadataPath(globalStoragePath), JSON.stringify({
        packageName: 'vyper-lsp',
        packageVersion: '0.1.3'
    }));

    await manager.ensureManagedServer({
        globalStoragePath,
        platform: 'linux',
        confirmInstall: async () => true
    });

    const pipInstall = calls.find((call) => call.args[0] === '-m' && call.args[1] === 'pip' && call.args[2] === 'install');
    const metadata = JSON.parse(fs.readFileSync(manager.getMetadataPath(globalStoragePath), 'utf8'));

    assert.ok(pipInstall, 'expected reinstall');
    assert.equal(metadata.packageVersion, '0.1.4');
});

test('resolves executable paths for desktop platforms', () => {
    const manager = createManagedVyperLsp();

    assert.equal(manager.getManagedExecutablePath('/tmp/fang-env', 'darwin'), '/tmp/fang-env/bin/vyper-lsp');
    assert.equal(manager.getManagedExecutablePath('/tmp/fang-env', 'linux'), '/tmp/fang-env/bin/vyper-lsp');
    assert.equal(manager.getManagedExecutablePath('C:\\fang-env', 'win32'), 'C:\\fang-env\\Scripts\\vyper-lsp.exe');
});

test('removes the managed server directory on request', async () => {
    const globalStoragePath = makeTempDir();
    const manager = createManagedVyperLsp();
    const managedRoot = manager.getManagedRootPath(globalStoragePath);

    fs.mkdirSync(path.join(managedRoot, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(managedRoot, 'nested', 'file.txt'), '');

    await manager.removeManagedServer({ globalStoragePath });

    assert.equal(fs.existsSync(managedRoot), false);
});
