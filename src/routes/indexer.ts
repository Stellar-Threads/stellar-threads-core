import { Router, Request, Response } from 'express';
import { eventIndexer } from '../indexer/eventIndexer';

const router = Router();

// GET /api/v1/indexer/status — Indexer operational status & metrics
router.get('/status', (_req: Request, res: Response) => {
  const status = eventIndexer.getStatus();
  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/indexer/poll — Trigger an immediate indexing poll
router.post('/poll', async (_req: Request, res: Response) => {
  await eventIndexer.poll();
  res.json({
    success: true,
    data: eventIndexer.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
