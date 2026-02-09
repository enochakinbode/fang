# Fang Theme Contribution Guide

This guide explains how to add and contribute a Vyper theme to Fang.

## Theme File Location

Add your theme file under `themes/`:

- `themes/<your-theme-name>.json`

Example:

- `themes/solarized-vyper-color-theme.json`

## Theme File Format

Your theme must be valid JSON and include a `tokenColors` array.

```json
{
  "tokenColors": [
    {
      "scope": ["keyword.control.vyper"],
      "settings": { "foreground": "#FF7B72" }
    }
  ]
}
```

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

- `vyper.theme.highlightSecurityDecorators = true|false`

Behavior:

- `true`: security decorators are forced to `#fb0b0b`
- `false`: security decorators use the same color as `storage.type.modifier.decorator.vyper`

Make sure your theme looks good in both modes.

## Make Theme Selectable in Settings

To expose your theme in the settings dropdown:

1. Add your theme name (without `.json`) to:
   - `contributes.configuration.properties.vyper.customTheme.enum` in `package.json`
2. Add a matching label to:
   - `contributes.configuration.properties.vyper.customTheme.enumDescriptions`

Example value:

- `solarized-vyper-color-theme`

## Validation Checklist

Before opening a PR:

- JSON parses correctly (no trailing commas)
- Required scopes are covered
- Contrast is readable
- Switching works for:
  - `vyper.customTheme`
  - `vyper.theme.highlightSecurityDecorators`
- No stale/non-existent scopes are included

## Recommended Testing

Test against snippets that include:

- decorators: `@external`, `@deploy`, `@payable`, `@view`
- security decorators: `@reentrant`
- declarations: `struct`, `flag`, `enum`, `event`
- builtins and low-level builtins
- environment access: `msg.sender`, `block.timestamp`, `self.<state_var>`

## Contribution Steps

1. Add your theme file under `themes/`
2. (Recommended) update `package.json` enum + enumDescriptions
3. Update `README.md` with your theme mention
4. Open a PR with:
   - screenshots
   - short palette rationale
   - checklist confirmation

