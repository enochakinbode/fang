# Fang - Vyper Language Support

<img src="https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/icon_small_with_border.png" alt="Fang" width="24" height="24" /> **Fang** is a comprehensive VS Code extension for [Vyper](https://www.vyperlang.org/) smart contract development. It combines the best of both worlds by integrating Language Server Protocol (LSP) support with the robust syntax highlighting and code analysis features from the original vscode-vyper extension.

## About

Fang is built by combining:
- **[vyper-lsp](https://github.com/vyperlang/vyper-lsp)** - Official Vyper Language Server Protocol implementation for advanced IDE features
- **[vscode-vyper](https://github.com/tintinweb/vscode-vyper)** - Original Vyper extension codebase (forked) providing syntax highlighting, decorations, and hover information

## Installation

### From VS Code Marketplace

- Quick Open (`Ctrl/Cmd+P`): `ext install enochakinbode.fang`
- Or open Extensions (`Ctrl/Cmd+Shift+X`) and search for `Fang`

## Preview

### Pythonic Vyper Theme

![Fang Pythonic Theme](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FANG_DEFAULT_PYTHONIC_THEME.png)

### Vyper Theme

![Fang Vyper Theme](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FANG_VYPER_THEME.png)


### Security Decorators (On/Off)

| On | Off |
|---|---|
| ![Security Decorators On](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FANG_SECURITY_DECORATORS.png) | ![Security Decorators Off](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FANG_SECURITY_DECORATORS_OFF.png) |

### Diagnostics

![Fang Diagnostics](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FAND_DIAGNOSTICS.png)

### Settings

![Fang Settings](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FANG_SETTINGS.png)

### Snippets Demo

![Fang Snippets Demo](https://raw.githubusercontent.com/enochakinbode/fang/pilot/images/FANG_SNIPPETS.gif)




> **Vyper Version Support:** Fang supports Vyper 0.4.1 and later (as supported by vyper-lsp).



### Install `vyper-lsp` (required for LSP features)

Required for LSP features. Install with pip:

```bash
pip install vyper-lsp
```

**Verify installation:**
```bash
vyper-lsp --version
```

## Usage

### Basic Usage

1. Open a `.vy` or `.vyi` file.
2. Syntax highlighting activates automatically.
3. LSP features (completion, diagnostics, navigation) work when `vyper-lsp` is installed.

### Commands

- **`vyper.restartLspServer`** - Restart the Vyper Language Server (useful if LSP becomes unresponsive)


## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/enochakinbode/fang.git
cd fang

# Install dependencies
bun install

# Package the extension
vsce package
```


## Credits

Fang is built upon the excellent work of:

- **[vscode-vyper](https://github.com/tintinweb/vscode-vyper)** by [tintinweb](https://github.com/tintinweb) - Original extension providing syntax highlighting, decorations, and hover features
- **[vyper-lsp](https://github.com/vyperlang/vyper-lsp)** by the Vyper team - Official Language Server Protocol implementation

Special thanks to the original maintainers and contributors of both projects.

## License

MIT License - See [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue on [GitHub](https://github.com/enochakinbode/fang/issues).

### Contributing Themes

See `themes/GUIDE.md` for the full theme contribution guide (required scopes, validation checklist, and PR steps).


## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/enochakinbode/fang/issues).

## Links

- **GitHub Repository**: https://github.com/enochakinbode/fang
- **Vyper Language**: https://www.vyperlang.org/
- **Original vscode-vyper**: https://github.com/tintinweb/vscode-vyper
- **vyper-lsp**: https://github.com/vyperlang/vyper-lsp

---

**Fang** - Sharp tools for Vyper development 🐍

