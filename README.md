# Fang - Vyper Language Support

<img src="./images/icon_small_with_border.png" alt="Fang" width="24" height="24" /> **Fang** is a comprehensive VS Code extension for [Vyper](https://www.vyperlang.org/) smart contract development. It combines the best of both worlds by integrating Language Server Protocol (LSP) support with the robust syntax highlighting and code analysis features from the original vscode-vyper extension.

## About

Fang is built by combining:
- **[vyper-lsp](https://github.com/vyperlang/vyper-lsp)** - Official Vyper Language Server Protocol implementation for advanced IDE features
- **[vscode-vyper](https://github.com/tintinweb/vscode-vyper)** - Original Vyper extension codebase (forked) providing syntax highlighting, decorations, and hover information

This extension brings together the powerful LSP capabilities for code completion, diagnostics, and navigation with the proven syntax highlighting and security-focused code decorations from the original extension.

**Vyper Version Support:** Fang supports Vyper 0.4.1 and later (as supported by vyper-lsp).

## Features

### Core Features

- **Syntax Highlighting** - Full Vyper syntax support with color-coded keywords, types, and constructs
- **Language Server Protocol (LSP)** - Advanced IDE features including:
  - Code completion and IntelliSense
  - Real-time diagnostics and error reporting
  - Go to definition and references
  - Symbol navigation
  - Hover documentation

### Enhanced Features

- **Security-Focused Decorations** - Visual indicators for:
  - Potentially unsafe operations (low-level calls, selfdestruct, etc.)
  - Safe modifiers (nonreentrant, view, pure, etc.)
  - Special functions (constructors, fallbacks)
  - Block and transaction variables

- **Code Snippets** - Quick templates for:
  - Constructors (`__init__`)
  - Fallback functions (`__default__`)
  - Common patterns and structures
  - NatSpec documentation

- **Custom Color Theme** - Optimized color scheme for Vyper development

## Installation

TODO: 

## Installing vyper-lsp

Required for LSP features. Install with pip:

```bash
pip install vyper-lsp
```

**Verify installation:**
```bash
vyper-lsp --version
```

## Configuration

### LSP Settings

Configure the Language Server in VS Code settings:

```json
{
  "vyper.lsp.enabled": true,
  "vyper.lsp.serverCommand": "vyper-lsp",
  "vyper.lsp.serverArgs": []
}
```

## Usage

### Basic Usage

1. Open a `.vy` or `.vyi` file
2. Syntax highlighting will activate automatically
3. LSP features (completion, diagnostics) will work if `vyper-lsp` is installed

### Commands

- **`vyper.restartLspServer`** - Restart the Vyper Language Server (useful if LSP becomes unresponsive)

### Security Decorations

Visual indicators help identify:
- ⚠️ **Unsafe operations** - Highlighted in red (send, raw_call, selfdestruct, etc.)
- ✅ **Safe modifiers** - Highlighted in green (nonreentrant, view, pure, etc.)
- ℹ️ **Block/transaction variables** - Underlined for visibility
- 🔵 **Special functions** - Bold and underlined (constructors, fallbacks)

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/enochakinbode/fang.git
cd fang

# Install dependencies
npm install

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

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/enochakinbode/fang/issues).

## Links

- **GitHub Repository**: https://github.com/enochakinbode/fang
- **Vyper Language**: https://www.vyperlang.org/
- **Original vscode-vyper**: https://github.com/tintinweb/vscode-vyper
- **vyper-lsp**: https://github.com/vyperlang/vyper-lsp

---

**Fang** - Sharp tools for Vyper development 🐍

