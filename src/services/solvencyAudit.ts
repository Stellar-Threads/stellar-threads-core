export interface SolvencyAuditReport {
  timestamp: string;
  isSolvent: boolean;
  totalVaultReservesStroops: string;
  totalLiabilitiesStroops: string;
  surplusStroops: string;
  reserveRatioPercent: string;
}

export class SolvencyAuditor {
  public auditReserves(vaultReserves: bigint, totalLiabilities: bigint): SolvencyAuditReport {
    const isSolvent = vaultReserves >= totalLiabilities;
    const surplus = vaultReserves - totalLiabilities;
    const ratio = totalLiabilities === 0n ? '100.00' : ((Number(vaultReserves) / Number(totalLiabilities)) * 100).toFixed(2);

    return {
      timestamp: new Date().toISOString(),
      isSolvent,
      totalVaultReservesStroops: vaultReserves.toString(),
      totalLiabilitiesStroops: totalLiabilities.toString(),
      surplusStroops: surplus.toString(),
      reserveRatioPercent: ratio,
    };
  }
}

export const globalSolvencyAuditor = new SolvencyAuditor();
