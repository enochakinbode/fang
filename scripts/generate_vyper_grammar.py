#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""
@author github.com/tintinweb

Generate Vyper TextMate grammar entirely from Vyper's language specification
"""
import vyper
from vyper.builtins.functions import DISPATCH_TABLE, STMT_DISPATCH_TABLE
from vyper.semantics.types import PRIMITIVE_TYPES
import json


class VyperGrammarGenerator:
    builtin_functions = sorted(list(DISPATCH_TABLE.keys()))
    builtin_raw_functions = sorted(list(STMT_DISPATCH_TABLE.keys()))
    base_types = sorted([x for x in PRIMITIVE_TYPES.keys() if not x.startswith("$")])

    @staticmethod
    def create_match_pattern(items):
        """Create a TextMate match pattern from a list of items"""
        if not items:
            return ""
        # Escape special regex characters and join with |
        escaped = [item.replace("|", "\\|") for item in items]
        return f"(?x)\n  (?<!\\.) \\b(\n {' | '.join(escaped)})\\b\n"

    @staticmethod
    def generate():
        """Generate complete TextMate grammar from Vyper spec"""

        grammar = {
            "information_for_contributors": [
                "Vyper TextMate grammar generated from Vyper language specification",
                "All patterns are dynamically generated from vyper library",
            ],
            "name": "Vyper",
            "scopeName": "source.vyper",
            "patterns": [
                {"include": "#comments"},
                {"include": "#strings"},
                {"include": "#numbers"},
                {"include": "#keywords"},
                {"include": "#types"},
                {"include": "#modifiers"},
                {"include": "#functions"},
                {"include": "#special-variables"},
                {"include": "#operators"},
                {"include": "#punctuation"},
            ],
            "repository": {
                "comments": {
                    "patterns": [
                        {"name": "comment.line.number-sign.vyper", "match": "#.*"}
                    ]
                },
                "strings": {
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
                },
                "numbers": {
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
                },
                "keywords": {
                    "patterns": [
                        {
                            "name": "keyword.control.vyper",
                            "match": "\\b(if|elif|else|for|while|break|continue|return|pass|assert|raise|try|except|finally|with|as|from|import|def|class|lambda|yield|await|async|del|global|nonlocal|in|is|not|and|or)\\b",
                        },
                        {
                            "name": "keyword.other.vyper",
                            "match": "\\b(enum|struct|flag|event|interface|implements|uses|initializes|exports)\\b",
                        },
                    ]
                },
                "types": {
                    "patterns": [
                        {"include": "#builtin-types"},
                        {"include": "#type-references"},
                    ]
                },
                "type-references": {
                    "patterns": [
                        {
                            "name": "support.type.reference.vyper",
                            "match": "\\b(struct|flag|event|interface|HashMap|DynArray|Bytes|String)\\b",
                        }
                    ]
                },
                "builtin-types": {"patterns": []},
                "modifiers": {
                    "patterns": [
                        {
                            "name": "storage.type.modifier.visibility.vyper",
                            "match": "\\b(external|internal|public)\\b",
                        },
                        {
                            "name": "storage.type.modifier.mutability.vyper",
                            "match": "\\b(view|pure|nonpayable|payable)\\b",
                        },
                        {
                            "name": "storage.type.modifier.security.vyper",
                            "match": "\\b(nonreentrant|deploy)\\b",
                        },
                        {
                            "name": "storage.type.modifier.storage.vyper",
                            "match": "\\b(immutable|constant)\\b",
                        },
                        {
                            "name": "storage.type.modifier.other.vyper",
                            "match": "\\b(indexed|transient)\\b",
                        },
                    ]
                },
                "functions": {
                    "patterns": [
                        {"include": "#function-definition"},
                        {"include": "#function-call"},
                        {"include": "#builtin-functions"},
                    ]
                },
                "function-definition": {
                    "name": "meta.function.vyper",
                    "begin": "\\b(def)\\s+",
                    "end": "(:|#|$)",
                    "beginCaptures": {"1": {"name": "storage.type.function.vyper"}},
                    "patterns": [
                        {
                            "name": "entity.name.function.vyper",
                            "match": "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\b",
                        },
                        {
                            "name": "entity.name.function.constructor.vyper",
                            "match": "\\b(__init__)\\b",
                        },
                        {
                            "name": "entity.name.function.fallback.vyper",
                            "match": "\\b(__default__)\\b",
                        },
                    ],
                },
                "function-call": {
                    "name": "meta.function-call.vyper",
                    "begin": "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*(\\()",
                    "end": "\\)",
                    "beginCaptures": {
                        "1": {"name": "entity.name.function.vyper"},
                        "2": {"name": "punctuation.definition.arguments.begin.vyper"},
                    },
                    "endCaptures": {
                        "1": {"name": "punctuation.definition.arguments.end.vyper"}
                    },
                },
                "builtin-functions": {"patterns": []},
                "special-variables": {
                    "patterns": [
                        {
                            "name": "variable.language.special.msg.vyper",
                            "match": "\\b(msg)\\b",
                        },
                        {
                            "name": "variable.language.special.block.vyper",
                            "match": "\\b(block)\\b",
                        },
                        {
                            "name": "variable.language.special.tx.vyper",
                            "match": "\\b(tx)\\b",
                        },
                        {
                            "name": "variable.language.special.chain.vyper",
                            "match": "\\b(chain)\\b",
                        },
                        {
                            "name": "variable.language.special.log.vyper",
                            "match": "\\b(log)\\b",
                        },
                        {
                            "name": "variable.language.special.extcall.vyper",
                            "match": "\\b(extcall)\\b",
                        },
                        {
                            "name": "variable.language.special.staticcall.vyper",
                            "match": "\\b(staticcall)\\b",
                        },
                        {
                            "name": "variable.language.special.self.vyper",
                            "match": "\\b(self)\\b",
                        },
                    ]
                },
                "operators": {
                    "patterns": [
                        {
                            "name": "keyword.operator.arithmetic.vyper",
                            "match": "(\\+|\\-|\\*|/|%|\\*\\*|//)",
                        },
                        {
                            "name": "keyword.operator.comparison.vyper",
                            "match": "(==|!=|<=|>=|<|>)",
                        },
                        {
                            "name": "keyword.operator.logical.vyper",
                            "match": "(\\band\\b|\\bor\\b|\\bnot\\b)",
                        },
                        {
                            "name": "keyword.operator.bitwise.vyper",
                            "match": "(<<|>>|&|\\||\\^|~)",
                        },
                        {
                            "name": "keyword.operator.assignment.vyper",
                            "match": "(=|\\+=|\\-=|\\*=|/=|%=|&=|\\|=|\\^=|<<=|>>=|\\*\\*=|//=)",
                        },
                    ]
                },
                "punctuation": {
                    "patterns": [
                        {"name": "punctuation.separator.colon.vyper", "match": ":"},
                        {"name": "punctuation.separator.comma.vyper", "match": ","},
                        {
                            "name": "punctuation.definition.brackets.begin.vyper",
                            "match": "\\[",
                        },
                        {
                            "name": "punctuation.definition.brackets.end.vyper",
                            "match": "\\]",
                        },
                        {
                            "name": "punctuation.definition.parentheses.begin.vyper",
                            "match": "\\(",
                        },
                        {
                            "name": "punctuation.definition.parentheses.end.vyper",
                            "match": "\\)",
                        },
                        {
                            "name": "punctuation.definition.braces.begin.vyper",
                            "match": "\\{",
                        },
                        {
                            "name": "punctuation.definition.braces.end.vyper",
                            "match": "\\}",
                        },
                        {
                            "name": "punctuation.definition.arguments.begin.vyper",
                            "match": "\\(",
                        },
                        {
                            "name": "punctuation.definition.arguments.end.vyper",
                            "match": "\\)",
                        },
                    ]
                },
            },
        }

        # Add builtin types from Vyper
        if VyperGrammarGenerator.base_types:
            grammar["repository"]["builtin-types"]["patterns"].append(
                {
                    "name": "support.type.basetype.vyper",
                    "match": VyperGrammarGenerator.create_match_pattern(
                        VyperGrammarGenerator.base_types
                    ),
                }
            )

        # Add builtin functions from Vyper
        if VyperGrammarGenerator.builtin_functions:
            grammar["repository"]["builtin-functions"]["patterns"].append(
                {
                    "name": "support.function.builtin.vyper",
                    "match": VyperGrammarGenerator.create_match_pattern(
                        VyperGrammarGenerator.builtin_functions
                    ),
                }
            )

        # Add low-level builtin functions from Vyper
        if VyperGrammarGenerator.builtin_raw_functions:
            grammar["repository"]["builtin-functions"]["patterns"].append(
                {
                    "name": "support.function.builtin.lowlevel.vyper",
                    "match": VyperGrammarGenerator.create_match_pattern(
                        VyperGrammarGenerator.builtin_raw_functions
                    ),
                }
            )

        return grammar


if __name__ == "__main__":
    grammar = VyperGrammarGenerator.generate()
    print(json.dumps(grammar, indent=4, sort_keys=False))
