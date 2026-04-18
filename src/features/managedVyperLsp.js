'use strict';

const fs = require('fs');
const path = require('path');
const { execFile, spawnSync } = require('child_process');

const VYPER_LSP_VERSION = '0.1.4';
const MINIMUM_PYTHON = Object.freeze({ major: 3, minor: 12 });
const METADATA_FILE = 'fang-managed-vyper-lsp.json';
const VERSION_SCRIPT = 'import json, sys; print(json.dumps({"executable": sys.executable, "version": list(sys.version_info[:3])}))';

const installLocks = new Map();

function createManagedVyperLsp(deps = {}) {
    const fsImpl = deps.fs ?? fs;
    const fsp = fsImpl.promises ?? fs.promises;
    const pathImpl = deps.path ?? path;
    const spawnSyncImpl = deps.spawnSync ?? spawnSync;
    const execFileImpl = deps.execFile ?? execFile;
    const packageVersion = deps.packageVersion ?? VYPER_LSP_VERSION;

    function getManagedRootPath(globalStoragePath) {
        return pathImpl.join(globalStoragePath, 'vyper-lsp');
    }

    function getManagedEnvPath(globalStoragePath) {
        return pathImpl.join(getManagedRootPath(globalStoragePath), `vyper-lsp-${packageVersion}`);
    }

    function getMetadataPath(globalStoragePath) {
        return pathImpl.join(getManagedEnvPath(globalStoragePath), METADATA_FILE);
    }

    function getManagedExecutablePath(envPath, platform = process.platform) {
        if (platform === 'win32') {
            return path.win32.join(envPath, 'Scripts', 'vyper-lsp.exe');
        }
        return path.posix.join(envPath, 'bin', 'vyper-lsp');
    }

    function getManagedPythonPath(envPath, platform = process.platform) {
        if (platform === 'win32') {
            return path.win32.join(envPath, 'Scripts', 'python.exe');
        }
        return path.posix.join(envPath, 'bin', 'python');
    }

    function buildPythonCandidates(platform = process.platform) {
        if (platform === 'win32') {
            return [
                { command: 'py', args: ['-3.14'], label: 'py -3.14' },
                { command: 'py', args: ['-3.13'], label: 'py -3.13' },
                { command: 'py', args: ['-3.12'], label: 'py -3.12' },
                { command: 'python', args: [], label: 'python' },
                { command: 'python3', args: [], label: 'python3' }
            ];
        }

        return [
            { command: 'python3.14', args: [], label: 'python3.14' },
            { command: 'python3.13', args: [], label: 'python3.13' },
            { command: 'python3.12', args: [], label: 'python3.12' },
            { command: 'python3', args: [], label: 'python3' },
            { command: 'python', args: [], label: 'python' }
        ];
    }

    function parsePythonInfo(rawOutput) {
        const parsed = JSON.parse(rawOutput);
        const version = {
            major: parsed.version[0],
            minor: parsed.version[1],
            patch: parsed.version[2]
        };

        return {
            command: parsed.executable,
            version
        };
    }

    function comparePythonVersions(left, right) {
        if (left.major !== right.major) {
            return left.major - right.major;
        }
        if (left.minor !== right.minor) {
            return left.minor - right.minor;
        }
        return left.patch - right.patch;
    }

    function isSupportedPythonVersion(version) {
        return comparePythonVersions(version, { ...MINIMUM_PYTHON, patch: 0 }) >= 0;
    }

    function formatPythonVersion(version) {
        return `${version.major}.${version.minor}.${version.patch}`;
    }

    function discoverCompatiblePython(options = {}) {
        const platform = options.platform ?? process.platform;
        const candidates = options.candidates ?? buildPythonCandidates(platform);
        let bestUnsupported = null;
        const parseErrors = [];

        for (const candidate of candidates) {
            const result = spawnSyncImpl(candidate.command, [...candidate.args, '-c', VERSION_SCRIPT], {
                encoding: 'utf8',
                env: options.env ?? process.env,
                timeout: options.timeout ?? 5000,
                windowsHide: true
            });

            if (result.error || result.status !== 0) {
                continue;
            }

            try {
                const parsed = parsePythonInfo((result.stdout || '').trim());
                if (isSupportedPythonVersion(parsed.version)) {
                    return {
                        ...parsed,
                        launcherCommand: candidate.command,
                        launcherArgs: candidate.args,
                        label: candidate.label
                    };
                }

                if (!bestUnsupported || comparePythonVersions(parsed.version, bestUnsupported.version) > 0) {
                    bestUnsupported = parsed;
                }
            } catch (error) {
                parseErrors.push(error);
            }
        }

        if (bestUnsupported) {
            throw new Error(`Fang requires Python 3.12 or newer to prepare the built-in Vyper language server. Found Python ${formatPythonVersion(bestUnsupported.version)}.`);
        }

        if (parseErrors.length > 0) {
            throw parseErrors[0];
        }

        throw new Error('Fang could not find Python 3.12 or newer. Install Python 3.12+ or set vyper.lsp.serverCommand to your own vyper-lsp command.');
    }

    async function pathExists(candidatePath) {
        try {
            await fsp.access(candidatePath, fsImpl.constants.F_OK);
            return true;
        } catch (_error) {
            return false;
        }
    }

    async function readMetadata(globalStoragePath) {
        const metadataRaw = await fsp.readFile(getMetadataPath(globalStoragePath), 'utf8');
        return JSON.parse(metadataRaw);
    }

    async function inspectEnvironment(options = {}) {
        const globalStoragePath = options.globalStoragePath ?? options.context.globalStorageUri.fsPath;
        const platform = options.platform ?? process.platform;
        const python = discoverCompatiblePython(options);
        const envPath = getManagedEnvPath(globalStoragePath);
        const executablePath = getManagedExecutablePath(envPath, platform);
        let metadata = null;

        try {
            metadata = await readMetadata(globalStoragePath);
        } catch (_error) {
            metadata = null;
        }

        const ready = Boolean(
            metadata &&
            metadata.packageName === 'vyper-lsp' &&
            metadata.packageVersion === packageVersion &&
            await pathExists(executablePath)
        );

        return {
            ready,
            python,
            envPath,
            executablePath,
            globalStoragePath,
            metadata,
            platform
        };
    }

    function execFileAsync(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            execFileImpl(command, args, options, (error, stdout, stderr) => {
                if (error) {
                    error.stdout = stdout;
                    error.stderr = stderr;
                    reject(error);
                    return;
                }
                resolve({ stdout, stderr });
            });
        });
    }

    async function ensurePip(pythonPath) {
        try {
            await execFileAsync(pythonPath, ['-m', 'pip', '--version'], { windowsHide: true });
        } catch (_error) {
            await execFileAsync(pythonPath, ['-m', 'ensurepip', '--upgrade'], { windowsHide: true });
        }
    }

    async function rebuildEnvironment(state, reporter) {
        reporter?.('Creating Fang private Python environment');
        await fsp.mkdir(pathImpl.dirname(state.envPath), { recursive: true });
        await fsp.rm(state.envPath, { recursive: true, force: true });
        await execFileAsync(state.python.command, ['-m', 'venv', state.envPath], { windowsHide: true });

        const envPython = getManagedPythonPath(state.envPath, state.platform);
        reporter?.('Preparing pip');
        await ensurePip(envPython);

        reporter?.(`Installing vyper-lsp ${packageVersion}`);
        await execFileAsync(envPython, [
            '-m',
            'pip',
            'install',
            '--disable-pip-version-check',
            '--upgrade',
            `vyper-lsp==${packageVersion}`
        ], { windowsHide: true });

        const metadata = {
            packageName: 'vyper-lsp',
            packageVersion,
            pythonVersion: formatPythonVersion(state.python.version),
            pythonExecutable: state.python.command,
            createdAt: new Date().toISOString()
        };

        await fsp.writeFile(getMetadataPath(state.globalStoragePath), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    }

    async function ensureManagedServer(options = {}) {
        const state = await inspectEnvironment(options);
        if (state.ready) {
            return {
                command: state.executablePath,
                mode: 'managed',
                python: state.python,
                packageVersion
            };
        }

        if (typeof options.confirmInstall === 'function') {
            const confirmed = await options.confirmInstall({
                packageVersion,
                python: state.python,
                envPath: state.envPath
            });
            if (!confirmed) {
                throw new Error('Fang did not prepare the built-in Vyper language server because setup was not approved.');
            }
        }

        const lockKey = state.envPath;
        if (!installLocks.has(lockKey)) {
            installLocks.set(lockKey, (async () => {
                const runner = async () => {
                    await rebuildEnvironment(state, options.reporter);
                    return {
                        command: state.executablePath,
                        mode: 'managed',
                        python: state.python,
                        packageVersion
                    };
                };

                if (typeof options.withProgress === 'function') {
                    return options.withProgress(runner);
                }

                return runner();
            })().finally(() => {
                installLocks.delete(lockKey);
            }));
        }

        return installLocks.get(lockKey);
    }

    async function removeManagedServer(options = {}) {
        const globalStoragePath = options.globalStoragePath ?? options.context.globalStorageUri.fsPath;
        await fsp.rm(getManagedRootPath(globalStoragePath), { recursive: true, force: true });
    }

    async function resolveServerCommand(options = {}) {
        const configuredCommand = (options.serverCommand ?? '').trim();
        if (configuredCommand.length > 0) {
            return {
                command: configuredCommand,
                mode: 'custom'
            };
        }

        return ensureManagedServer(options);
    }

    return {
        METADATA_FILE,
        MINIMUM_PYTHON,
        VYPER_LSP_VERSION: packageVersion,
        buildPythonCandidates,
        comparePythonVersions,
        discoverCompatiblePython,
        ensureManagedServer,
        formatPythonVersion,
        getManagedEnvPath,
        getManagedExecutablePath,
        getManagedPythonPath,
        getManagedRootPath,
        getMetadataPath,
        inspectEnvironment,
        isSupportedPythonVersion,
        parsePythonInfo,
        removeManagedServer,
        resolveServerCommand
    };
}

module.exports = {
    ...createManagedVyperLsp(),
    createManagedVyperLsp
};
