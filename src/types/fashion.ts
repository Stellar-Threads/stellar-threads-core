/**
 * Stellar Threads Protocol — Core Domain Types
 * Modeling fashion commerce, identity, digital product passports, and on-chain escrow.
 */

export type DesignerVerificationStatus = 'unverified' | 'pending' | 'verified' | 'suspended';

export interface DesignerProfile {
  id: string;
  stellarAddress: string;
  brandName: string;
  legalEntity?: string;
  atelierLocation: {
    city: string;
    country: string;
    coordinates?: [number, number];
  };
  sustainabilityCertifications: string[];
  verificationStatus: DesignerVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export type GarmentLifecycleStage = 
  | 'concept'
  | 'sampling'
  | 'in_production'
  | 'quality_assured'
  | 'distributed'
  | 'owned'
  | 'recycled';

export interface FabricComposition {
  fiber: string;
  percentage: number;
  originCountry: string;
  isOrganicOrRecycled: boolean;
}

export interface GarmentPassport {
  id: string;
  rfidOrNfcTagId?: string;
  designerId: string;
  designerAddress: string;
  collectionName: string;
  garmentName: string;
  editionNumber: number;
  totalBatchSize: number;
  composition: FabricComposition[];
  manufacturingAtelier: string;
  currentLifecycleStage: GarmentLifecycleStage;
  tokenContractId?: string; // Soroban contract identifier in subsequent stages
  provenanceHistoryHash?: string;
  createdAt: string;
}

export type EscrowStatus = 
  | 'draft'
  | 'funded'
  | 'milestone_completed'
  | 'released'
  | 'disputed'
  | 'refunded';

export interface ProductionMilestone {
  index: number;
  title: string;
  description: string;
  releasePercentage: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ProductionEscrow {
  id: string;
  brandAddress: string;
  manufacturerAddress: string;
  orderReference: string;
  totalAmountXlm: string;
  depositedAmountXlm: string;
  status: EscrowStatus;
  milestones: ProductionMilestone[];
  sorobanContractAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAuditRecord {
  id: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amountXlm: string;
  memo?: string;
  memoType?: 'text' | 'id' | 'hash';
  ledgerIndex: number;
  confirmedAt: string;
  network: string;
}

export type GarmentCircularState = 'Active' | 'Transferred' | 'Retired' | 'Recycled' | 'Upcycled';

export interface GarmentProvenanceChain {
  originCountry: string;
  spinningMill?: string;
  dyeHouse?: string;
  materialComposition: string;
  carbonScoreKg: number;
  certHash: string;
  isOrganicGots: boolean;
}

export interface EscrowDisputePayload {
  orderId: number;
  reason: string;
  evidenceUri?: string;
  requestedRefundBps: number;
}
