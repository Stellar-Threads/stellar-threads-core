import { describe, it, expect, vi } from 'vitest';
import { logger } from '../utils/logger';

describe('Logger Unit Tests', () => {
  it('should emit structured info log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Test log event', { sampleKey: 42 });

    expect(spy).toHaveBeenCalled();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('Test log event');
    expect(parsed.context.sampleKey).toBe(42);
    spy.mockRestore();
  });

  it('should emit structured error log to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Critical failure', { code: 'FATAL_RPC' });

    expect(spy).toHaveBeenCalled();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('Critical failure');
    spy.mockRestore();
  });
});
