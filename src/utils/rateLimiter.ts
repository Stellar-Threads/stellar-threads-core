import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(maxRequests = 100, windowMs = 60000) {
  const clients = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = clients.get(ip);
    if (!record || now > record.resetTime) {
      clients.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please retry in a few moments.',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    record.count++;
    next();
  };
}
