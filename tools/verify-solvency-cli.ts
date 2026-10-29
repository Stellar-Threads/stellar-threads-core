/**
 * CLI Tool: Verify Escrow and Financing On-Chain Solvency
 * Usage: npx ts-node tools/verify-solvency-cli.ts
 */
import { SolvencyAuditor } from '../src/services/solvencyAudit';
import { logger } from '../src/utils/logger';

async function runCli() {
  logger.info('Starting manual solvency audit of Stellar Threads contracts...');
  const auditor = new SolvencyAuditor();

  const report = await auditor.performFullAudit();
  console.log('\n--- Solvency Audit Verification Report ---');
  console.log(`Escrow Reserve Ratio: ${(report.escrowReserveRatio * 100).toFixed(2)}%`);
  console.log(`Financing Repayment Ratio: ${(report.financingRepaymentRatio * 100).toFixed(2)}%`);
  console.log(`Protocol Solvent: ${report.isSolvent ? 'YES (✅)' : 'NO (❌)'}`);
  console.log(`Timestamp: ${report.timestamp}\n`);

  if (!report.isSolvent) {
    process.exit(1);
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    logger.error('Solvency CLI audit failed', { error: err.message });
    process.exit(1);
  });
}
