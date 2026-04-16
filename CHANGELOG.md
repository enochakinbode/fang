# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-04-16

### Highlights

- Fang now prepares its own managed `vyper-lsp` environment, so users no longer need to install `vyper-lsp` manually.
- The managed server requires Python `3.12+` and installs pinned `vyper-lsp==0.1.4` on first use after user approval.
- `vyper.lsp.serverCommand` now defaults to Fang-managed mode when empty and remains available for custom language server environments.

### Docs and Packaging

- Updated README installation guidance to remove the manual `pip install vyper-lsp` step.
- Documented the pinned managed LSP caveat and custom-command escape hatch.
- Kept VSIX packaging generic and excluded rejected bundled-wheel artifacts from published packages.

## [0.1.4] - 2026-03-02

### Highlights

- Fixed VS Code Marketplace gallery banner contrast by treating Fang as a dark-themed banner so text renders light on the dark background in both light and dark modes.

## [0.1.3] - 2026-02-10

### Highlights

- Updated icon image to fix contrast issues for better visibility.

## [0.1.2] - 2026-02-10

### Highlights

- Release bump to `0.1.2` with refreshed extension branding/icon.
- Improved grammar and snippet coverage for newer Vyper module/decorator keywords.
- Cleaner README onboarding with stronger Marketplace/LSP install guidance and badges.
- Hover docs were simplified to reduce clutter from overly verbose examples.

### Syntax and Snippets

- Enhanced grammar/token handling for recently added Vyper keywords and decorators.
- Updated snippet packs to reflect the new keyword/decorator coverage and module patterns.
- Kept grammar generation aligned with `VYPER_GRAMMAR_SPEC.toml` and generator updates.


## [0.1.1] - 2026-02-09

### Highlights

- Theme switching is now first-class via `vyper.customTheme` (default set to `pythonic-vyper-color-theme`).
- New security decorator toggle: `vyper.theme.highlightSecurityDecorators`.
- LSP startup/restart flow was refactored for cleaner lifecycle handling and better reliability.
- Grammar generation is now driven by `VYPER_GRAMMAR_SPEC.toml` with updated scopes and precedence.

### Syntax, Themes, and Highlighting

- Updated TextMate grammar generation and scope mapping (`VYPER_GRAMMAR_SPEC.toml`, generator, tmLanguage).
- Improved decorator and keyword matching behavior (including `@`-prefixed decorators and environment attributes like `block.timestamp`).
- Synced `vyper-color-theme` and `pythonic-vyper-color-theme` with active grammar scopes and cleaned stale rules.

### LSP and Extension Behavior

- Fixed language client startup crash by adding missing debug server configuration.
- Refactored extension/LSP initialization to reduce config drift and repeated startup issues.
- Improved output channel behavior during restart flows.

### Snippets and Hover

- Updated builtins/snippets data and hover sources.
- Removed redundant assertion snippets from generated snippet bundles.

### Docs

- README refreshed with clearer install instructions, preview media, and settings guidance.
- Added dedicated theme contribution guide at `themes/GUIDE.md`.
