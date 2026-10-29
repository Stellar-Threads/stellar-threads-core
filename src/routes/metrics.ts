import { Router, Request, Response } from 'express';

const router = Router();
const processStartTime = Date.now();

router.get('/', (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - processStartTime) / 1000);
  const mem = process.memoryUsage();

  const metrics = `# HELP stellar_threads_uptime_seconds Total service uptime in seconds
# TYPE stellar_threads_uptime_seconds gauge
stellar_threads_uptime_seconds ${uptime}

# HELP stellar_threads_heap_used_bytes Process heap usage in bytes
# TYPE stellar_threads_heap_used_bytes gauge
stellar_threads_heap_used_bytes ${mem.heapUsed}

# HELP stellar_threads_rpc_circuit_state State of Soroban RPC circuit breaker (1=CLOSED, 0=OPEN)
# TYPE stellar_threads_rpc_circuit_state gauge
stellar_threads_rpc_circuit_state 1
`;

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

export default router;
