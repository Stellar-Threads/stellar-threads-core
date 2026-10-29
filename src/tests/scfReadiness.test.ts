import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SCF Submission Readiness Tests', () => {
  it('should verify judging alignment and evaluator guide exist', () => {
    const scfPath = path.join(__dirname, '../../docs/SCF_JUDGING_ALIGNMENT.md');
    const evalPath = path.join(__dirname, '../../docs/EVALUATOR_QUICKSTART_GUIDE.md');

    expect(fs.existsSync(scfPath)).toBe(true);
    expect(fs.existsSync(evalPath)).toBe(true);
  });
});
