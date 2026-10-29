import { StellarNetworkConfig } from '../types/network';

/**
 * Stellar Testnet Configuration for Stellar Threads Protocol
 * Explicitly centralized and type-safe to prevent production spillover.
 */
export const STELLAR_TESTNET_CONFIG: StellarNetworkConfig = {
  network: 'testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
  explorerUrl: 'https://stellar.expert/explorer/testnet',
  baseFeeStroops: '100', // 0.00001 XLM
  minAccountReserveXlm: '1.0', // Base reserve requirement
};

export const PROTOCOL_METADATA = {
  name: 'Stellar Threads',
  tagline: 'From design to ownership, powered by Stellar.',
  version: '1.0.0-alpha',
  description: 'Global decentralized fashion finance and trade protocol on the Stellar blockchain.',
  repository: 'https://github.com/Stellar-Threads',
};

export function getNetworkConfig(): StellarNetworkConfig {
  const envHorizon = process.env.STELLAR_HORIZON_URL;
  const envRpc = process.env.STELLAR_RPC_URL;
  const envPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE;

  // Enforce testnet passphrase guard to prevent accidental mainnet interaction
  if (envPassphrase && envPassphrase !== STELLAR_TESTNET_CONFIG.networkPassphrase) {
    throw new Error(
      `Safety guard violation: Active stage only allows Stellar Testnet. Received: "${envPassphrase}"`
    );
  }

  return {
    ...STELLAR_TESTNET_CONFIG,
    horizonUrl: envHorizon || STELLAR_TESTNET_CONFIG.horizonUrl,
    rpcUrl: envRpc || STELLAR_TESTNET_CONFIG.rpcUrl,
  };
}

/**
 * Redundant Soroban RPC fallback pool to safeguard backend against RPC downtime
 */
export const SOROBAN_RPC_FALLBACK_POOL: string[] = [
  'https://soroban-testnet.stellar.org',
  'https://rpc-testnet.stellar.org',
  'https://testnet.sorobanrpc.com',
];

export function getActiveRpcUrl(): string {
  return process.env.STELLAR_RPC_URL || SOROBAN_RPC_FALLBACK_POOL[0];
}
