import { logger } from '../utils/logger';

export function simulateFinancingWaterfall(principalStroops: bigint, yieldBps: number) {
  logger.info(`[SIMULATION] Simulating factoring waterfall for ${principalStroops} Stroops at ${yieldBps} bps`);
  const yieldAmount = (principalStroops * BigInt(yieldBps)) / 10000n;
  const totalRepayment = principalStroops + yieldAmount;
  logger.info(`[SIMULATION] Total repayment: ${totalRepayment} (Yield: ${yieldAmount})`);
  return { totalRepayment, yieldAmount };
}

if (require.main === module) {
  simulateFinancingWaterfall(100000000n, 1200);
}
