import { describe, it, expect } from 'vitest';
import { StellarChannelManager } from '../services/channelManager';

describe('StellarChannelManager Unit Tests', () => {
  it('should acquire and release available channels in round-robin', () => {
    const manager = new StellarChannelManager(['KEY_A', 'KEY_B']);
    const ch1 = manager.acquireChannel();
    expect(ch1?.publicKey).toBe('KEY_A');

    const ch2 = manager.acquireChannel();
    expect(ch2?.publicKey).toBe('KEY_B');

    const ch3 = manager.acquireChannel();
    expect(ch3).toBeUndefined(); // Exhausted

    manager.releaseChannel('KEY_A');
    const reacquired = manager.acquireChannel();
    expect(reacquired?.publicKey).toBe('KEY_A');
  });
});
