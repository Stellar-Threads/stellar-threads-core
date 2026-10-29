import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Documentation Parity & Integrity Tests', () => {
  it('should verify all core documentation guides exist', () => {
    const docs = [
      'docs/VIDEO_DEMO_SCRIPT.md',
      'docs/ARCHITECTURE_DIAGRAMS.md',
      'docs/SOROBAN_SECURITY_CHECKLIST.md',
      'docs/HACKATHON_SUBMISSION_STORY.md',
      'docs/PITCH_DECK_SLIDES.md',
      'docs/RELEASE_NOTES_v1.0.0.md',
    ];

    docs.forEach(d => {
      const p = path.join(__dirname, '../../', d);
      expect(fs.existsSync(p)).toBe(true);
    });
  });
});
