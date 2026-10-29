import { StellarNetworkConfig, NetworkHealthStatus } from './network';
import { DesignerProfile, GarmentPassport, ProductionEscrow } from './fashion';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthData {
  service: string;
  version: string;
  uptimeSeconds: number;
  environment: string;
  stellar: NetworkHealthStatus;
  protocol22Ready?: boolean;
  storageStatus?: string;
}

export interface ValidateAddressRequest {
  address: string;
}

export interface ValidateAddressResponse {
  address: string;
  isValid: boolean;
  error?: string;
}

export interface ValidatePaymentRequest {
  fromAddress: string;
  toAddress: string;
  amountXlm: string;
  memo?: string;
  memoType?: 'text' | 'id' | 'hash';
}

export interface ValidatePaymentResponse {
  isValid: boolean;
  errors: string[];
  sanitized: {
    fromAddress: string;
    toAddress: string;
    amountXlm: string;
    memo?: string;
    memoType?: string;
    estimatedBaseFeeXlm: string;
  };
}

export interface ProtocolInfo {
  name: string;
  tagline: string;
  version: string;
  network: string;
  modules: {
    name: string;
    status: 'active' | 'upcoming';
    description: string;
  }[];
}
