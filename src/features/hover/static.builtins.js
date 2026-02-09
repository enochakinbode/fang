'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * */

const BUILTINS = {
    "blockhash": {
        "prefix": "blockhash",
        "description": "blockhash(blockNumber: uint256) -> bytes32: hash of the given block - only works for 256 most recent, excluding current, blocks",
        "security": ["Do not rely on block.timestamp and blockhash as a source of randomness, unless you know what you are doing.", "Both the timestamp and the block hash can be influenced by miners to some degree. Bad actors in the mining community can for example run a casino payout function on a chosen hash and just retry a different hash if they did not receive any money.", "The current block timestamp must be strictly larger than the timestamp of the last block, but the only guarantee is that it will be somewhere between the timestamps of two consecutive blocks in the canonical chain.", "The block hashes are not available for all blocks for scalability reasons. You can only access the hashes of the most recent 256 blocks, all other values will be zero."]
    },
    "coinbase": {
        "prefix": "block.coinbase",
        "description": "block.coinbase (address): current block miner's address",
        "security": ""
    },
    "difficulty": {
        "prefix": "block.difficulty",
        "description": "block.difficulty (uint256): current block difficulty",
        "security": "Deprecated in favor of block.prevrandao after The Merge (EIP-4399); prefer using block.prevrandao."
    },
    "prevrandao": {
        "prefix": "block.prevrandao",
        "description": "block.prevrandao (bytes32): current randomness beacon provided by the beacon chain",
        "security": "Alias for the block.difficulty opcode after The Merge; recommended instead of block.difficulty."
    },
    "gaslimit": {
        "prefix": "block.gaslimit",
        "description": "block.gaslimit (uint256): current block's gas limit",
        "security": ""
    },
    "basefee": {
        "prefix": "block.basefee",
        "description": "block.basefee (uint256): current block's base fee",
        "security": ""
    },
    "blobbasefee": {
        "prefix": "block.blobbasefee",
        "description": "block.blobbasefee (uint256): current block's blob gas base fee",
        "security": ""
    },
    "number": {
        "prefix": "block.number",
        "description": "block.number (uint256): current block number",
        "security": "Can be manipulated by miner"
    },
    "prevhash": {
        "prefix": "block.prevhash",
        "description": "block.prevhash (bytes32): equivalent to blockhash(block.number - 1)",
        "security": ""
    },
    "timestamp": {
        "prefix": "block.timestamp",
        "description": "block.timestamp (uint256): current block epoch timestamp (seconds since Unix epoch)",
        "security": ["Do not rely on block.timestamp, now and blockhash as a source of randomness, unless you know what you are doing.", "Both the timestamp and the block hash can be influenced by miners to some degree. Bad actors in the mining community can for example run a casino payout function on a chosen hash and just retry a different hash if they did not receive any money.", "The current block timestamp must be strictly larger than the timestamp of the last block, but the only guarantee is that it will be somewhere between the timestamps of two consecutive blocks in the canonical chain."]
    },
    "gas": {
        "prefix": "msg.gas",
        "description": "msg.gas (uint256): remaining gas",
    },
    "mana": {
        "prefix": "msg.mana",
        "description": "msg.mana (uint256): remaining gas (alias for msg.gas)",
        "security": ""
    },
    "msg": {
        "prefix": "msg",
        "description": "msg",
        "security": "The values of all members of msg, including msg.sender and msg.value can change for every external function call."
    },
    "data": {
        "prefix": "msg.data",
        "description": "msg.data (Bytes): complete calldata, must be used inside len() or slice()",
        "security": ""
    },
    "sender": {
        "prefix": "msg.sender",
        "description": "msg.sender (address): sender of the message (current call)",
        "security": "The values of all members of msg, including msg.sender and msg.value can change for every external function call."
    },
    "value": {
        "prefix": "msg.value",
        "description": "msg.value (uint256): number of wei sent with the message",
        "security": "The values of all members of msg, including msg.sender and msg.value can change for every external function call."
    },
    "gasprice": {
        "prefix": "tx.gasprice",
        "description": "tx.gasprice (uint256): gas price of the current transaction in wei",
        "security": ""
    },
    "origin": {
        "prefix": "tx.origin",
        "description": "tx.origin (address): sender of the transaction (full call chain)",
        "security": "Do not use for authentication"
    },
    "chainid": {
        "prefix": "chain.id",
        "description": "chain.id (uint256): current chain ID (EIP-155)",
        "security": "Useful for preventing cross-chain replay attacks. Always verify chain ID when dealing with cross-chain operations."
    },
    "log": {
        "prefix": "log",
        "description": "log: emit an event, used for logging contract events",
        "security": "Events are not accessible from within contracts. They are only used for external logging and indexing."
    },
    "extcall": {
        "prefix": "extcall",
        "description": "extcall: call context for external calls that allow state modification",
        "security": "External calls can modify state and introduce reentrancy risks. Use @nonreentrant when appropriate."
    },
    "staticcall": {
        "prefix": "staticcall",
        "description": "staticcall: call context for read-only external calls that prevent state modification",
        "security": "Static calls are safer as they prevent state changes, but still validate all inputs and return values."
    },
    "abi_decode": {
        "prefix": "abi_decode",
        "description": "abi.decode(encoded_data: Bytes[N]) -> (...): ABI-decodes the given data, while the types are given in parentheses as second argument.",
        "security": ""
    },
    "abi_encode": {
        "prefix": "abi_encode",
        "description": "abi.encode(...) -> (Bytes[N]): ABI-encodes the given arguments",
        "security": ""
    },
    "assert": {
        "prefix": "assert",
        "description": ["assert test, [msg]: abort execution and revert state changes if the condition is not met", "assert test, UNREACHABLE: abort execution with an invalid opcode if the condition is met, all gas is consumed"],
        "security": ""
    },
    "raise": {
        "prefix": "raise",
        "description": ["raise: abort execution and revert state changes", "raise msg: abort execution and revert state changes, providing an explanatory string", "raise UNREACHABLE: abort execution with an invalid opcode, all gas is consumed"],
        "security": ""
    },
    "addmod": {
        "prefix": "addmod",
        "description": "addmod(x: uint256, y: uint256, k: uint256) -> uint256:\n\tcompute (x + y) % k where the addition is performed with arbitrary precision and does not wrap around at 2**256.",
        "security": ""
    },
    "mulmod": {
        "prefix": "mulmod",
        "description": "mulmod(x: uint256, y: uint256, k: uint256) -> uint256:\n\tcompute (x * y) % k where the multiplication is performed with arbitrary precision and does not wrap around at 2**256.",
        "security": ""
    },
    "keccak256": {
        "prefix": "keccak256",
        "description": "keccak256(Bytes[N]) -> bytes32:\n\tcompute the Keccak-256 hash of the input",
        "security": ""
    },
    "sha256": {
        "prefix": "sha256",
        "description": "sha256(Bytes[N]) -> bytes32:\n\tcompute the SHA-256 hash of the input",
    },
    "ecrecover": {
        "prefix": "ecrecover",
        "description": "ecrecover(hash, v, r, s) -> address:\n\trecover the address associated with the public key from elliptic curve signature or return empty(address) on error",
        "security": "Prior to Vyper 0.3.10, the ecrecover function could return an undefined (possibly nonzero) value for invalid inputs to ecrecover. For more information, please see Vyper GHSA-f5x6-7qgp-jhf3."
    },
    "_balance": {
        "prefix": ".balance",
        "description": "<address>.balance (uint256):\n\tbalance of the Address in Wei",
    },
    "send": {
        "prefix": "send",
        "description": "send(recipient: address, amount: uint256) -> bool:\n\tsend given amount of Wei to Address, reverts on failure, by default forwards 2300 gas stipend only if the value is non-zero",
        "security": "Always try using a pattern where the recipient withdraws the money"
    },
    "raw_call": {
        "prefix": "raw_call",
        "description": "raw_call(target, data, max_outsize=N) -> (bool, Bytes[N]):\n\tissue low-level CALL with the given payload, returns success condition and return data, forwards all available gas, adjustable",
    },
    "selfdestruct": {
        "prefix": "selfdestruct",
        "description": "selfdestruct(recipient: address):\n\tdestroy the current contract, sending its funds to the given Address"
    },
    "self": {
        "prefix": "self",
        "description": "self (current contract's type):\n\tthe current contract, implicitly convertible to Address",
        "security": ""
    },
    "for": {
        "prefix": "for",
        "description": "",
        "security": "LOOP - check for OOG conditions (locking ether, DoS, ...)"
    },
    "pragma": {
        "prefix": "pragma",
        "description": "",
        "security": "avoid using experimental features! avoid specifying version ^"
    },
    ">>": {
        "prefix": ">>",
        "description": "",
        "security": "Shifting is only available for 256-bit wide types. That is, x must be int256 or uint256, and y can be any unsigned integer. The right shift for int256 compiles to a signed right shift (EVM SAR instruction)."
    },
    "deploy": {
        "prefix": "deploy",
        "description": "Function is called only at deploy time",
        "security": ""
    },
    "external": {
        "prefix": "external",
        "description": "Function can only be called externally, it is part of the runtime selector table",
        "security": "Make sure to authenticate calls to this method as anyone can access it via external calls."
    },
    "internal": {
        "prefix": "internal",
        "description": "Function can only be called within the current contract"
    },
    "pure": {
        "prefix": "pure",
        "description": "Function does not read contract state or environment variables",
        "security": ["It is not possible to prevent functions from reading the state at the level of the EVM, it is only possible to prevent them from writing to the state (i.e. only view can be enforced at the EVM level, pure can not)."]
    },
    "view": {
        "prefix": "view",
        "description": "Function does not alter contract state"
    },
    "payable": {
        "prefix": "payable",
        "description": "Function is able to receive Ether",
        "security": "Ensure correct accounting and access control whenever receiving Ether."
    },
    "nonreentrant": {
        "prefix": "nonreentrant",
        "description": "Function cannot be called back into during an external call",
        "security": "Use to guard functions against reentrancy; do not mix with other reentrancy patterns without care."
    },
    "reentrant": {
        "prefix": "reentrant",
        "description": "Marks a function or code path as reentrant, opting out of nonreentrant-style protections.",
        "security": "Use only when you explicitly allow reentrancy; carefully review all external calls and state changes."
    },
    "codehash": {
        "prefix": "codehash",
        "description": "",
        "security": "Note that the result of address.codehash will be zero during constructor calls. Therefore it is not fit to use it to check if an address is a contract or not as this can be subverted by calling your contract in a constructor."
    },
    "len": {
        "prefix": "len",
        "description": "len(b: Bytes | String | DynArray[_Type, _Integer]) -> uint256: return the length of a given Bytes, String or DynArray",
        "security": ""
    },
    "max": {
        "prefix": "max",
        "description": "max(a: numeric, b: numeric) -> numeric: return the greater value of a and b. The input values may be any numeric type as long as they are both of the same type",
        "security": ""
    },
    "min": {
        "prefix": "min",
        "description": "min(a: numeric, b: numeric) -> numeric: return the lesser value of a and b. The input values may be any numeric type as long as they are both of the same type",
        "security": ""
    },
    "max_value": {
        "prefix": "max_value",
        "description": "max_value(type_) -> numeric: returns the maximum value of the numeric type specified by type_ (e.g., int128, uint256, decimal)",
        "security": ""
    },
    "min_value": {
        "prefix": "min_value",
        "description": "min_value(type_) -> numeric: returns the minimum value of the numeric type specified by type_ (e.g., int128, uint256, decimal)",
        "security": ""
    },
    "convert": {
        "prefix": "convert",
        "description": "convert(value, type_) -> Any: converts a variable or literal from one type to another. Returns a value of the type specified by type_",
        "security": "Be careful with type conversions as they may truncate or overflow values."
    },
    "empty": {
        "prefix": "empty",
        "description": "empty(typename) -> Any: return a value which is the default (zero-ed) value of its type. Useful for initializing new memory variables",
        "security": ""
    },
    "blobhash": {
        "prefix": "blobhash",
        "description": "blobhash(index: uint256) -> bytes32: return the versioned hash of the index-th BLOB associated with the current transaction (EIP-4844)",
        "security": ""
    },
    "raw_log": {
        "prefix": "raw_log",
        "description": "raw_log(topics: bytes32[4], data: Bytes | bytes32) -> None: provides low level access to the LOG opcodes, emitting a log without having to specify an ABI type",
        "security": ""
    },
    "raw_revert": {
        "prefix": "raw_revert",
        "description": "raw_revert(data: Bytes) -> None: provides low level access to the REVERT opcode, reverting execution with the specified data returned",
        "security": ""
    },
    "slice": {
        "prefix": "slice",
        "description": "slice(b: Bytes | bytes32 | String, start: uint256, length: uint256) -> Bytes | String: copy a list of bytes and return a specified slice. If the value being sliced is a Bytes or bytes32, the return type is Bytes. If it is a String, the return type is String",
        "security": "Ensure start and length are within bounds to avoid out-of-bounds access."
    },
    "unsafe_add": {
        "prefix": "unsafe_add",
        "description": "unsafe_add(a: uint256, b: uint256) -> uint256: addition without overflow checks",
        "security": "Unsafe operation - may overflow. Use only when you are certain overflow cannot occur."
    },
    "unsafe_sub": {
        "prefix": "unsafe_sub",
        "description": "unsafe_sub(a: uint256, b: uint256) -> uint256: subtraction without underflow checks",
        "security": "Unsafe operation - may underflow. Use only when you are certain underflow cannot occur."
    },
    "unsafe_mul": {
        "prefix": "unsafe_mul",
        "description": "unsafe_mul(a: uint256, b: uint256) -> uint256: multiplication without overflow checks",
        "security": "Unsafe operation - may overflow. Use only when you are certain overflow cannot occur."
    },
    "unsafe_div": {
        "prefix": "unsafe_div",
        "description": "unsafe_div(a: uint256, b: uint256) -> uint256: division without zero checks",
        "security": "Unsafe operation - will revert on division by zero. Ensure divisor is non-zero."
    }
}

module.exports = {
    BUILTINS
}