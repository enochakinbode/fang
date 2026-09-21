# Fang Theme Contribution Guide

This guide explains how to add and contribute a Vyper theme to Fang.

Fang themes are **real VS Code color themes**. They are contributed via `contributes.themes` and selected from the workbench **Color Theme** picker, exactly like any other VS Code theme.

## Theme File Location

Add your theme file under `themes/`:

- `themes/<your-theme-name>.json`

Example:

- `themes/solarized-vyper-color-theme.json`

## Theme File Format

Your theme is a standard VS Code color theme JSON file. It extends a base VS Code theme (set with `uiTheme` in `package.json`) and only overrides what it needs.

```json
{
    "$schema": "vscode://schemas/color-theme",
    "name": "Solarized Vyper",
    "tokenColors": [
        {
            "scope": ["keyword.control.vyper"],
            "settings": { "foreground": "#FF7B72" }
        }
    ]
}
```

- `$schema` and `name` are required.
- `tokenColors` is the array of TextMate scope rules.
- `colors` is optional. Omit it to inherit all editor/workbench chrome colors from the base theme (`vs-dark`, `vs`, etc.).

## Required Scope Coverage

At minimum, style these scopes:

- `keyword.control.vyper`
- `keyword.environment.vyper`
- `keyword.environment.self.vyper`
- `storage.type.definition.vyper`
- `storage.type.function.vyper`
- `storage.type.modifier.decorator.vyper`
- `storage.type.modifier.security.vyper`
- `storage.type.modifier.keyword.vyper`
- `support.type.basetype.vyper`
- `support.type.reference.vyper`
- `support.function.builtin.vyper`
- `support.function.builtin.lowlevel.vyper`
- `keyword.operator.vyper`
- `string.quoted.double.vyper`
- `string.quoted.single.vyper`
- `constant.numeric.decimal.vyper`
- `constant.numeric.hex.vyper`
- `comment.line.number-sign.vyper`

## Security Decorator Behavior

Fang supports:

- `vyper.theme.highlightSecurityDecorators = true|false` (default `true`)

Behavior:

- `true`: Fang injects a single override into `editor.tokenColorCustomizations` forcing `storage.type.modifier.security.vyper` to `#fb0b0b`. This is the **only** setting Fang writes to the user config, and it is removed on deactivation.
- `false`: no override is injected. The color from your theme's `storage.type.modifier.security.vyper` rule is used as-is.

So your theme's `storage.type.modifier.security.vyper` color is the "highlight off" state. Set it to the same value as your decorator rule (or a subtle tint) so the theme looks intentional in both modes.

## Make Theme Selectable in the Theme Picker

Add your theme to the `contributes.themes` array in `package.json`:

```json
"themes": [
    {
        "label": "Solarized Vyper",
        "uiTheme": "vs-dark",
        "path": "./themes/solarized-vyper-color-theme.json"
    }
]
```

- `label` appears in the Color Theme picker.
- `uiTheme` is the base theme to extend (`vs` for light, `vs-dark` for dark, `hc-black`/`hc-light` for high contrast).
- `path` is relative to the extension root.

Users pick it via **Preferences > Color Theme** (or `Cmd/Ctrl+K Cmd/Ctrl+T`).

## Validation Checklist

Before opening a PR:

- JSON parses correctly (no trailing commas)
- `$schema` and `name` are set
- Theme is listed under `contributes.themes` with a correct `uiTheme`
- Required scopes are covered
- Contrast is readable
- Security decorator toggle (`vyper.theme.highlightSecurityDecorators`) looks good both on and off
- The theme picker shows your theme and it activates on a `.vy` file

## Recommended Testing

Test against snippets that include:

- decorators: `@external`, `@deploy`, `@payable`, `@view`
- security decorators: `@reentrant`
- declarations: `struct`, `flag`, `enum`, `event`
- builtins and low-level builtins
- environment access: `msg.sender`, `block.timestamp`, `self.<state_var>`

## Contribution Steps

1. Add your theme file under `themes/`
2. Register it in `contributes.themes` in `package.json`
3. Update `README.md` with your theme mention
4. Open a PR with:
   - screenshots
   - short palette rationale
   - checklist confirmation