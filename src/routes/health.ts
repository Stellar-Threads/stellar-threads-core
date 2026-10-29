import { Router, Request, Response } from 'express';
import { getNetworkConfig } from '../config/stellar';
import { ApiResponse, HealthData } from '../types/api';
import { logger } from '../utils/logger';

const router = Router();
const startTime = Date.now();

/**
 * Pings the Soroban RPC node using JSON-RPC 2.0 getLatestLedger
 */
async function checkSorobanRpc(rpcUrl: string, timeoutMs = 4000) {
  const pingStart = Date.now();
  try {
    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getLatestLedger',
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const latencyMs = Date.now() - pingStart;

    if (!rpcRes.ok) {
      return {
        connected: false,
        latencyMs,
        error: `HTTP ${rpcRes.status}: ${rpcRes.statusText}`,
      };
    }

    const data = await rpcRes.json() as {
      result?: {
        id?: string;
        sequence?: number;
        protocolVersion?: number;
      };
      error?: { message?: string };
    };

    if (data.error) {
      return {
        connected: false,
        latencyMs,
        error: data.error.message || 'RPC method error',
      };
    }

    return {
      connected: true,
      latencyMs,
      sequence: data.result?.sequence,
      protocolVersion: data.result?.protocolVersion,
      ledgerId: data.result?.id,
    };
  } catch (err) {
    const latencyMs = Date.now() - pingStart;
    return {
      connected: false,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * GET /health/rpc
 * Dedicated Soroban RPC heartbeat check exposing latency and sync status
 */
router.get('/rpc', async (_req: Request, res: Response) => {
  const config = getNetworkConfig();
  const rpcResult = await checkSorobanRpc(config.rpcUrl);

  const payload = {
    status: rpcResult.connected ? 'healthy' : 'degraded',
    network: config.network,
    rpcUrl: config.rpcUrl,
    connected: rpcResult.connected,
    latencyMs: rpcResult.latencyMs,
    latestLedger: rpcResult.sequence,
    protocolVersion: rpcResult.protocolVersion,
    checkedAt: new Date().toISOString(),
    ...(rpcResult.error ? { error: rpcResult.error } : {}),
  };

  const response = {
    success: rpcResult.connected,
    data: payload,
    timestamp: new Date().toISOString(),
  };

  res.status(rpcResult.connected ? 200 : 503).json(response);
});

/**
 * GET /health
 * Overall service health check including Horizon connectivity
 */
router.get('/', async (_req: Request, res: Response) => {
  const config = getNetworkConfig();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  let horizonConnected = false;
  let latestLedger: number | undefined;
  let protocolVersion: number | undefined;
  let responseTimeMs = 0;

  const pingStart = Date.now();
  try {
    const horizonRes = await fetch(config.horizonUrl, { signal: AbortSignal.timeout(4000) });
    responseTimeMs = Date.now() - pingStart;

    if (horizonRes.ok) {
      const data = await horizonRes.json() as {
        history_latest_ledger?: number;
        current_protocol_version?: number;
        network_passphrase?: string;
      };
      horizonConnected = true;
      latestLedger = data.history_latest_ledger;
      protocolVersion = data.current_protocol_version;
    }
  } catch (err) {
    responseTimeMs = Date.now() - pingStart;
    logger.warn('Stellar Horizon health ping failed', {
      error: err instanceof Error ? err.message : String(err),
      horizonUrl: config.horizonUrl,
    });
  }

  const healthData: HealthData = {
    service: 'stellar-threads-core',
    protocol22Ready: true,
    storageStatus: 'connected',
    version: '1.0.0-alpha',
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    stellar: {
      status: horizonConnected ? 'healthy' : 'degraded',
      network: config.network,
      horizonConnected,
      latestLedger,
      protocolVersion,
      responseTimeMs,
      checkedAt: new Date().toISOString(),
    },
  };

  const response: ApiResponse<HealthData> = {
    success: true,
    data: healthData,
    timestamp: new Date().toISOString(),
  };

  const httpStatus = horizonConnected ? 200 : 503;
  res.status(httpStatus).json(response);
});

export default router;