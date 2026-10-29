import crypto from 'crypto';

export class ProvenanceService {
  public generateTwinHash(productId: string, brand: string, material: string, serial: string): string {
    return crypto.createHash('sha256').update(`${productId}:${brand}:${material}:${serial}`).digest('hex');
  }

  public verifyTwinHash(hash: string, expectedHash: string): boolean {
    return hash.toLowerCase() === expectedHash.toLowerCase();
  }
}

export const globalProvenanceService = new ProvenanceService();
