export interface EnvConfig {
  nodeEnv: string;
  port: number;
  stellarNetwork: string;
  sorobanRpcUrl: string;
  horizonUrl: string;
}

export function loadEnvConfig(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '3001', 10);
  const stellarNetwork = process.env.STELLAR_NETWORK || 'testnet';
  const sorobanRpcUrl = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
  const horizonUrl = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';

  return {
    nodeEnv,
    port,
    stellarNetwork,
    sorobanRpcUrl,
    horizonUrl,
  };
}
