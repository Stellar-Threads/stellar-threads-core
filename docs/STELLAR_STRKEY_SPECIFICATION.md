# Stellar Strkey Encoding Specification

## Overview
Stellar utilizes Base32-encoded strings called **Strkeys** for public keys, private seeds, and contract identifiers.

## Key Structure
A standard Account ID (G-Address):
1. **Version Byte**: `0x30` (ASCII 'G' in Base32) designating `ed25519PublicKey`.
2. **Payload**: 32-byte Ed25519 raw public key.
3. **Checksum**: 2-byte CRC-16-XMODEM checksum appended to the payload.
4. **Base32 Encoding**: Total of 35 bytes encoded into 56 RFC 4648 Base32 characters.

## Contract IDs (C-Address)
Contract identifiers use version byte `0x10` ('C') and follow the identical 56-character Base32 representation.
