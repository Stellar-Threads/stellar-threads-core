import { Router, Request, Response } from 'express';
import { db } from '../storage/db';
import { eventIndexer } from '../indexer/eventIndexer';

const router = Router();

// GET /api/v1/events — Retrieve recent indexed events
router.get('/', (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const filter = (req.query.type as string) || undefined;

  const events = db.getEvents(limit, filter);

  res.json({
    success: true,
    data: {
      total: events.length,
      events,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/events/stream — Server-Sent Events (SSE) real-time feed
router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial handshake
  const initMsg = JSON.stringify({
    type: 'connected',
    message: 'Subscribed to Stellar Threads Soroban contract event stream',
    status: eventIndexer.getStatus(),
    timestamp: new Date().toISOString(),
  });
  res.write(`data: ${initMsg}\n\n`);

  // Subscribe to new indexed events
  const unsubscribe = eventIndexer.subscribe((event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      unsubscribe();
    }
  });

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      unsubscribe();
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});


router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: 'CONNECTED', timestamp: new Date().toISOString() });

  const keepAlive = setInterval(() => {
    sendEvent({ type: 'PING' });
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

export default router;
