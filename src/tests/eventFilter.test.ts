import { describe, it, expect } from 'vitest';
import { filterEventsByTopic } from '../indexer/eventFilter';

describe('EventFilter Unit Tests', () => {
  it('should correctly filter events by topic substring', () => {
    const sample = [
      { topic: 'escrow:created' },
      { topic: 'passport:transferred' },
      { topic: 'escrow:funded' },
    ];
    const filtered = filterEventsByTopic(sample, 'escrow');
    expect(filtered.length).toBe(2);
  });
});
