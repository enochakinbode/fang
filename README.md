# Fang - Vyper Language Support

<img src="./images/icon_small_with_border.png" alt="Fang" width="24" height="24" /> **Fang** is a comprehensive VS Code extension for [Vyper](https://www.vyperlang.org/) smart contract development. It combines the best of both worlds by integrating Language Server Protocol (LSP) support with the robust syntax highlighting and code analysis features from the original vscode-vyper extension.

## About

Fang is built by combining:
- **[vyper-lsp](https://github.com/vyperlang/vyper-lsp)** - Official Vyper Language Server Protocol implementation for advanced IDE features
- **[vscode-vyper](https://github.com/tintinweb/vscode-vyper)** - Original Vyper extension codebase (forked) providing syntax highlighting, decorations, and hover information


> **Vyper Version Support:** Fang supports Vyper 0.4.1 and later (as supported by vyper-lsp).

## Features

- **Language Server Protocol (LSP)** - Advanced IDE features including:
  - Code completion and IntelliSense
  - Real-time diagnostics and error reporting
  - Go to definition and references
  - Symbol navigation
  - Hover documentation

- **Syntax Highlighting** - Full Vyper syntax support with color-coded keywords, types, and constructs. Includes security-focused visual indicators for unsafe operations, modifiers, and special functions. Modifier color scheme: <span style="color: #fb0b0b">@external</span>, <span style="color: #fb0b0b">@deploy</span>, <span style="color: #fb0b0b">@nonreentrant</span>; <span style="color: #47B0FA">@view</span>, <span style="color: #47B0FA">@payable</span>, <span style="color: #E5E7EB">@internal</span>, <span style="color: #E5E7EB">@pure</span>


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

### Custom Theme Support

Fang supports custom color themes for Vyper syntax highlighting. You can use a custom theme file by configuring:

```json
{
  "vyper.customThemeEnabled": true,
  "vyper.customTheme": "my-custom-theme"
}
```

This will load `themes/my-custom-theme.json` from the extension's `themes` folder (the `.json` extension is added automatically). 

To create a custom theme, see the example theme files in the `themes` folder (e.g., `vyper-color-theme.json` or `pythonic-vyper-color-theme.json`) for the expected format.

**Contributing Themes:** If you've created a custom theme that you'd like to share with the community, please open a Pull Request to add it to the extension's `themes` folder. This allows other users to benefit from your theme without needing to modify the extension themselves.

**Note:** If the custom theme file is not found, Fang will fall back to the default theme.

## Usage

### Basic Usage

1. Open a `.vy` or `.vyi` file
2. Syntax highlighting will activate automatically
3. LSP features (completion, diagnostics) will work if `vyper-lsp` is installed

### Commands

- **`vyper.restartLspServer`** - Restart the Vyper Language Server (useful if LSP becomes unresponsive)


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

Contributions are welcome! Please feel free to submit a Pull Request or open an issue on [GitHub](https://github.com/enochakinbode/fang/issues).

## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/enochakinbode/fang/issues).

## Links

- **GitHub Repository**: https://github.com/enochakinbode/fang
- **Vyper Language**: https://www.vyperlang.org/
- **Original vscode-vyper**: https://github.com/tintinweb/vscode-vyper
- **vyper-lsp**: https://github.com/vyperlang/vyper-lsp

---

**Fang** - Sharp tools for Vyper development 🐍

