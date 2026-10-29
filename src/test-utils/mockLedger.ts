export interface MockLedgerState {
  currentLedger: number;
  timestamp: number;
  baseFee: number;
}

export class MockSorobanEnvironment {
  private state: MockLedgerState;

  constructor(initialLedger = 1000) {
    this.state = {
      currentLedger: initialLedger,
      timestamp: Math.floor(Date.now() / 1000),
      baseFee: 100,
    };
  }

  advanceLedger(count = 1): void {
    this.state.currentLedger += count;
    this.state.timestamp += count * 5; // ~5 seconds per Stellar ledger close
  }

  getState(): MockLedgerState {
    return { ...this.state };
  }
}
