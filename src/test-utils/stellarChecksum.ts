/**
 * Stellar Strkey CRC-16 Checksum Calculation Utility
 * Implements CRC-16-XMODEM polynomial (0x1021) for public key validation.
 */
export function calculateStellarCrc16(data: Uint8Array): number {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    let byte = data[i];
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc & 0xffff;
}

export function isValidStellarGAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return address.startsWith('G') && address.length === 56;
}
