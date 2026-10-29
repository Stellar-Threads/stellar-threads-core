export interface FactoringTerms {
  proposalId: string;
  annualYieldBps: number;
  durationDays: number;
  estimatedReturnStroops: string;
  minBackerQuotaStroops: string;
}

export interface TrancheSchedule {
  milestoneIndex: number;
  description: string;
  disbursementBps: number;
  isDisbursed: boolean;
  disbursedTxHash?: string;
}

export interface BackerContributionRecord {
  contributor: string;
  proposalId: string;
  amountStroops: string;
  timestamp: string;
  claimableYieldStroops: string;
}
