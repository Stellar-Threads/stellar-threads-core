import { describe, it, expect, beforeEach } from 'vitest';
import { ProtocolDatabase, StoredContractEvent } from '../storage/db';
import path from 'path';
import fs from 'fs';

describe('Soroban Event Indexer and Storage Tests', () => {
  const testDbPath = path.resolve(__dirname, 'test_db.json');
  let testDb: ProtocolDatabase;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    testDb = new ProtocolDatabase(testDbPath);
  });

  it('should store and retrieve events with deduplication', () => {
    const event1: StoredContractEvent = {
      id: 'evt-001',
      contractId: 'CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR',
      contractName: 'designer_registry',
      eventType: 'designer_registered',
      ledger: 1001,
      ledgerClosedAt: new Date().toISOString(),
      txHash: '0x1234567890abcdef',
      data: { brand: 'Maison Lumina' },
      indexedAt: new Date().toISOString(),
    };

    const isNewFirst = testDb.saveEvent(event1);
    expect(isNewFirst).toBe(true);

    // Duplicate save attempt
    const isNewSecond = testDb.saveEvent(event1);
    expect(isNewSecond).toBe(false);

    const retrieved = testDb.getEvents(10);
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe('evt-001');
    expect(retrieved[0].contractName).toBe('designer_registry');
  });

  it('should update and persist indexer checkpoint state', () => {
    testDb.updateIndexerState(1050);
    const state = testDb.getIndexerState();
    expect(state.lastLedger).toBe(1050);

    // Next ledger should be higher
    testDb.updateIndexerState(1100);
    expect(testDb.getIndexerState().lastLedger).toBe(1100);
  });

  it('should store and retrieve designers correctly', () => {
    const designer = {
      stellarAddress: 'GATELIER1234567890ABCDEF',
      brandName: 'Atelier Sol',
      atelierLocation: 'Milan, Italy',
      metadataUri: 'ipfs://sol',
      registeredAt: 1000,
      isVerified: true,
      indexedAt: new Date().toISOString(),
    };

    testDb.saveDesigner(designer);
    const read = testDb.getDesigner('GATELIER1234567890ABCDEF');
    expect(read).not.toBeNull();
    expect(read?.brandName).toBe('Atelier Sol');
  });

  it('should store and retrieve product passports', () => {
    const passport = {
      productId: 'ST-LUX-001',
      creator: 'GCREATOR123',
      owner: 'GCREATOR123',
      brandName: 'Maison Lumina',
      productName: 'Silk Trench',
      metadataUri: 'ipfs://trench',
      integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      totalEdition: 10,
      status: 1,
      createdAt: 1000,
      indexedAt: new Date().toISOString(),
    };

    testDb.savePassport(passport);
    const read = testDb.getPassport('ST-LUX-001');
    expect(read).not.toBeNull();
    expect(read?.productName).toBe('Silk Trench');
  });

  it('should store and update escrow order states', () => {
    const order = {
      orderId: 1,
      buyer: 'GBUYER123',
      seller: 'GSELLER123',
      token: 'XLM',
      amount: '500000000',
      orderRef: 'ORD-001',
      state: 0, // Created
      createdAt: 1000,
      fundedAt: 0,
      settledAt: 0,
      indexedAt: new Date().toISOString(),
    };

    testDb.saveEscrow(order);
    expect(testDb.getEscrow(1)?.state).toBe(0);

    // Fund order
    order.state = 1;
    order.fundedAt = 1010;
    testDb.saveEscrow(order);
    expect(testDb.getEscrow(1)?.state).toBe(1);
  });
});
