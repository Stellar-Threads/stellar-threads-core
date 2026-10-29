import { Router, Request, Response } from 'express';

const router = Router();

router.get('/overview', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalVolumeStroops: '125000000000',
      totalVolumeXlm: '12500.00',
      activeEscrowsCount: 42,
      registeredAteliersCount: 18,
      mintedPassportsCount: 156,
      financedCampaignsCount: 9,
      averageYieldApy: '12.50',
      protocolVersion: 'Protocol 22',
      updatedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
