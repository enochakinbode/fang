#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""
Generate Vyper TextMate grammar from VYPER_GRAMMAR_SPEC.toml.

The overall structure and scopes are driven by the TOML spec, while the
concrete builtin type list is fetched from the installed vyper package on each run so
it stays in sync with the compiler.
"""

import json, tomllib
from pathlib import Path


from vyper.semantics.types import PRIMITIVE_TYPES
from vyper.builtins.functions import DISPATCH_TABLE, STMT_DISPATCH_TABLE


ROOT = Path(__file__).resolve().parent.parent
SPEC_PATH = ROOT / "VYPER_GRAMMAR_SPEC.toml"

# All primitive Vyper base types (excluding internal $-prefixed entries).
BASE_TYPES = sorted(
    [name for name in PRIMITIVE_TYPES.keys() if not name.startswith("$")]
)

BUILTIN_FUNCTIONS = sorted(DISPATCH_TABLE.keys())
BUILTIN_RAW_FUNCTIONS = sorted(STMT_DISPATCH_TABLE.keys())


def _make_keyword_pattern(tokens: list[str]) -> str:
    """Create a match pattern from tokens.

    Tokens starting with '@' are handled separately because \\b (word
    boundary) does not work before non-word characters like '@'.
    For those we emit  @\\b(name)\\b  which matches the boundary between
    '@' (non-word) and the identifier (word).
    """
    if not tokens:
        return ""

    at_tokens = [t[1:].replace("|", "\\|") for t in tokens if t.startswith("@")]
    regular_tokens = [t.replace("|", "\\|") for t in tokens if not t.startswith("@")]

    parts: list[str] = []
    if at_tokens:
        inner = "|".join(at_tokens)
        parts.append(rf"@\b({inner})\b")
    if regular_tokens:
        inner = "|".join(regular_tokens)
        parts.append(rf"\b({inner})\b")

    return "|".join(parts)


def _make_vyper_type_pattern(items: list[str]) -> str:
    """Create a TextMate match pattern for Vyper base types."""
    if not items:
        return ""
    escaped = [item.replace("|", "\\|") for item in items]
    joined = " | ".join(escaped)
    # Match whole words not preceded by a dot (to avoid attributes).
    return f"(?x)\n  (?<!\\.) \\b(\n {joined})\\b\n"


def _generate_scope_from_path(path: str) -> str:
    """Generate TextMate scope from TOML table path.

    Examples:
        keywords.control -> keyword.control.vyper
        keywords.exceptions -> keyword.control.vyper (special case)
        types.builtin -> support.type.basetype.vyper
        modifiers.decorator -> storage.type.modifier.decorator.vyper
        modifiers.keyword -> storage.type.modifier.keyword.vyper
        functions.definition -> storage.type.function.vyper
    """
    parts = path.split(".")

    # Special mappings for top-level sections
    if parts[0] == "keywords":
        # exceptions shares the control scope
        if parts[1] == "exceptions":
            return "keyword.control.vyper"
        # Convert keywords.* to keyword.*.vyper
        return f"keyword.{'.'.join(parts[1:])}.vyper"

    elif parts[0] == "types":
        if parts[1] == "declaration":
            return "storage.type.definition.vyper"
        elif parts[1] == "builtin":
            return "support.type.basetype.vyper"
        elif parts[1] == "reference":
            return "support.type.reference.vyper"

    elif parts[0] == "modifiers":
        if parts[1] == "decorator":
            return "storage.type.modifier.decorator.vyper"
        elif parts[1] == "keyword":
            return "storage.type.modifier.keyword.vyper"
        elif parts[1] == "security":
            return "storage.type.modifier.security.vyper"

    elif parts[0] == "functions":
        if parts[1] == "definition":
            return "storage.type.function.vyper"
        elif parts[1] == "builtin":
            return "support.function.builtin.vyper"
        elif parts[1] == "builtin_lowlevel":
            return "support.function.builtin.lowlevel.vyper"

    elif parts[0] == "operators":
        if parts[1] == "all":
            return "keyword.operator.vyper"

    # Fallback: convert path to scope (shouldn't happen)
    return f"{'.'.join(parts)}.vyper"


def build_grammar(spec: dict) -> dict:
    language = spec["language"]
    top_level = spec["top_level"]["patterns"]

    grammar: dict = {
        "information_for_contributors": [
            "Vyper TextMate grammar generated from VYPER_GRAMMAR_SPEC.toml",
        ],
        "name": language["name"],
        "scopeName": language["scope_name"],
        "patterns": [{"include": f"#{name}"} for name in top_level],
        "repository": {},
    }

    repo = grammar["repository"]

    # Comments / strings / numbers are kept simple and mostly static.
    if "comments" in top_level:
        repo["comments"] = {
            "patterns": [
                {"name": "comment.line.number-sign.vyper", "match": "#.*"},
            ]
        }

    if "strings" in top_level:
        repo["strings"] = {
            "patterns": [
                {
                    "name": "string.quoted.double.vyper",
                    "begin": '"',
                    "end": '"',
                    "patterns": [
                        {
                            "name": "constant.character.escape.vyper",
                            "match": "\\\\.",
                        }
                    ],
                },
                {
                    "name": "string.quoted.single.vyper",
                    "begin": "'",
                    "end": "'",
                    "patterns": [
                        {
                            "name": "constant.character.escape.vyper",
                            "match": "\\\\.",
                        }
                    ],
                },
            ]
        }

    if "numbers" in top_level:
        repo["numbers"] = {
            "patterns": [
                {
                    "name": "constant.numeric.hex.vyper",
                    "match": "\\b0[xX][0-9a-fA-F_]+\\b",
                },
                {
                    "name": "constant.numeric.decimal.vyper",
                    "match": "\\b[0-9][0-9_]*\\b",
                },
            ]
        }

    # Keywords from [keywords.*] tables (nested TOML tables)
    if "keywords" in top_level and "keywords" in spec:

        def _collect_keyword_groups(
            node: dict, path_prefix: str = ""
        ) -> list[tuple[str, dict]]:
            """Collect keyword groups with their TOML paths."""
            groups: list[tuple[str, dict]] = []
            for key, value in node.items():
                current_path = f"{path_prefix}.{key}" if path_prefix else key
                if isinstance(value, dict):
                    # A leaf keyword group has a tokens list.
                    if "tokens" in value:
                        groups.append((current_path, value))
                    # Recurse into nested subtables (e.g. environment.self).
                    groups.extend(_collect_keyword_groups(value, current_path))
            return groups

        kw_groups = _collect_keyword_groups(spec["keywords"], "keywords")
        # Group by scope to combine patterns with the same scope
        scope_groups: dict[str, list[str]] = {}
        for path, group in kw_groups:
            scope = _generate_scope_from_path(path)
            tokens = group.get("tokens", [])
            if not tokens:
                continue

            if scope not in scope_groups:
                scope_groups[scope] = []
            scope_groups[scope].extend(tokens)

        kw_repo_patterns: list[dict] = []
        for scope, tokens in scope_groups.items():
            # Environment keywords should match attributes after the dot (e.g., block.timestamp)
            if scope == "keyword.environment.vyper":
                # Match keyword followed by optional dot-separated attributes: block.timestamp, tx.origin, etc.
                escaped = [t.replace("|", "\\|") for t in tokens]
                inner = "|".join(escaped)
                pattern = rf"\b({inner})(\.\w+)*\b"
            else:
                pattern = _make_keyword_pattern(tokens)

            kw_repo_patterns.append(
                {
                    "name": scope,
                    "match": pattern,
                }
            )

        if kw_repo_patterns:
            repo["keywords"] = {"patterns": kw_repo_patterns}

    # Types
    if "types" in top_level and "types" in spec:
        repo["types"] = {
            "patterns": [
                {"include": "#type-declarations"},
                {"include": "#type-references"},
                {"include": "#builtin-types"},
            ]
        }
        # Type declarations (struct, flag, enum, event) - highest precedence
        repo["type-declarations"] = {
            "patterns": [
                {
                    "name": _generate_scope_from_path("types.declaration"),
                    "match": "\\b(struct|flag|enum|event)\\b",
                }
            ]
        }
        repo["type-references"] = {
            "patterns": [
                {
                    "name": _generate_scope_from_path("types.reference"),
                    # Reference types (interface, HashMap, DynArray, Bytes, String)
                    "match": "\\b(interface|HashMap|DynArray|Bytes|String)\\b",
                }
            ]
        }
        # Builtin Vyper types are sourced directly from the vyper compiler.
        repo["builtin-types"] = {
            "patterns": [
                {
                    "name": _generate_scope_from_path("types.builtin"),
                    "match": _make_vyper_type_pattern(BASE_TYPES),
                }
            ]
        }

    # Modifiers based on [modifiers.*] (nested TOML tables)
    if "modifiers" in top_level and "modifiers" in spec:
        mod_patterns: list[dict] = []

        modifiers_spec = spec["modifiers"]

        # Security markers come first for precedence (highlighted red; @ is included in tokens from the TOML).
        security = modifiers_spec.get("security")
        if security:
            scope = _generate_scope_from_path("modifiers.security")
            tokens = security.get("tokens", [])
            if tokens:
                pattern = _make_keyword_pattern(tokens)
                mod_patterns.append(
                    {
                        "name": scope,
                        "match": pattern,
                    }
                )

        # Function decorators (@ is included in the token names from the TOML).
        decorators = modifiers_spec.get("decorator")
        if decorators:
            scope = _generate_scope_from_path("modifiers.decorator")
            tokens = decorators.get("tokens", [])
            if tokens:
                pattern = _make_keyword_pattern(tokens)
                mod_patterns.append(
                    {
                        "name": scope,
                        "match": pattern,
                    }
                )

        # Inline markers (no @, but still modifiers).
        markers = modifiers_spec.get("keyword")
        if markers:
            scope = _generate_scope_from_path("modifiers.keyword")
            tokens = markers.get("tokens", [])
            if tokens:
                mod_patterns.append(
                    {
                        "name": scope,
                        "match": _make_keyword_pattern(tokens),
                    }
                )

        if mod_patterns:
            repo["modifiers"] = {"patterns": mod_patterns}

    # Operators – kept as a simple catch‑all based on the configured scope
    if "operators" in top_level and "operators" in spec:
        op_scope = _generate_scope_from_path("operators.all")
        repo["operators"] = {
            "patterns": [
                {
                    "name": op_scope,
                    "match": r"[+\-*/%=<>!&|^~]+",
                }
            ]
        }

    # Functions – only `def` keyword and builtin function names for now.
    if "functions" in top_level and "functions" in spec:
        scope_def_kw = _generate_scope_from_path("functions.definition")
        scope_builtin = _generate_scope_from_path("functions.builtin")
        scope_builtin_ll = _generate_scope_from_path("functions.builtin_lowlevel")

        repo["functions"] = {
            "patterns": [
                {"include": "#function-definition"},
                {"include": "#builtin-functions"},
            ]
        }

        # Only highlight the `def` keyword itself.
        repo["function-definition"] = {
            "patterns": [
                {
                    "name": scope_def_kw,
                    "match": "\\b(def)\\b",
                },
            ]
        }

        repo["builtin-functions"] = {"patterns": []}
        if BUILTIN_FUNCTIONS:
            repo["builtin-functions"]["patterns"].append(
                {
                    "name": scope_builtin,
                    "match": _make_vyper_type_pattern(list(BUILTIN_FUNCTIONS)),
                }
            )
        if BUILTIN_RAW_FUNCTIONS:
            repo["builtin-functions"]["patterns"].append(
                {
                    "name": scope_builtin_ll,
                    "match": _make_vyper_type_pattern(list(BUILTIN_RAW_FUNCTIONS)),
                }
            )

    return grammar


def main() -> None:
    with SPEC_PATH.open("rb") as f:
        spec = tomllib.load(f)

    grammar = build_grammar(spec)
    print(json.dumps(grammar, indent=4, sort_keys=False))


if __name__ == "__main__":
    main()
