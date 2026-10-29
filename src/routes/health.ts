import { Router, Request, Response } from 'express';
import { getNetworkConfig } from '../config/stellar';
import { ApiResponse, HealthData } from '../types/api';
import { logger } from '../utils/logger';

const router = Router();
const startTime = Date.now();

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
