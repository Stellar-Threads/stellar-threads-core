import { logger } from '../utils/logger';

export function simulateEscrowLifecycle(orderId: number, amountStroops: bigint) {
  logger.info(`[SIMULATION] Starting escrow lifecycle for Order #${orderId} with ${amountStroops} Stroops`);
  const inspectorShare = (amountStroops * 250n) / 10000n; // 2.5% inspection fee
  const sellerShare = amountStroops - inspectorShare;
  logger.info(`[SIMULATION] Inspection fee: ${inspectorShare} | Atelier payout: ${sellerShare}`);
  return { sellerShare, inspectorShare };
}

if (require.main === module) {
  simulateEscrowLifecycle(101, 50000000n);
}
