export interface SyntheticScenario {
  designerAddress: string;
  brandName: string;
  orderId: number;
  escrowStroops: string;
  passportId: string;
  factoringTargetStroops: string;
}

export function generateSyntheticFashionScenario(seedIndex: number): SyntheticScenario {
  const pad = String(seedIndex).padStart(3, '0');
  return {
    designerAddress: `GBTYMGFXTESTADDRESS1234567890DESIGNER_${pad}`,
    brandName: `Atelier Stellar Haute ${pad}`,
    orderId: 1000 + seedIndex,
    escrowStroops: (BigInt(seedIndex + 1) * 100000000n).toString(),
    passportId: `PASSPORT-BIO-SILK-${pad}`,
    factoringTargetStroops: (BigInt(seedIndex + 5) * 200000000n).toString(),
  };
}
