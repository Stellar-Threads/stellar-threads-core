import { Router, Request, Response } from 'express';
import { getNetworkConfig } from '../config/stellar';
import { ApiResponse } from '../types/api';
import { StellarNetworkConfig } from '../types/network';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const config = getNetworkConfig();

  const response: ApiResponse<StellarNetworkConfig> = {
    success: true,
    data: config,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export default router;
