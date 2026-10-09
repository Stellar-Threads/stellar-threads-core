export type StellarNetworkName = 'testnet' | 'public' | 'futurenet' | 'standalone';

export interface StellarNetworkConfig {
  network: StellarNetworkName;
  networkPassphrase: string;
  horizonUrl: string;
  rpcUrl: string;
  friendbotUrl: string;
  explorerUrl: string;
  baseFeeStroops: string;
  minAccountReserveXlm: string;
}

export interface NetworkHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  network: StellarNetworkName;
  horizonConnected: boolean;
  latestLedger?: number;
  protocolVersion?: number;
  responseTimeMs?: number;
  checkedAt: string;
}
