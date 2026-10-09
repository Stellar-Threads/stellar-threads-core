import fs from 'fs';
import path from 'path';

export interface StoredDesigner {
  stellarAddress: string;
  brandName: string;
  atelierLocation: string;
  metadataUri: string;
  registeredAt: number;
  isVerified: boolean;
  indexedAt: string;
}

export interface StoredPassport {
  productId: string;
  creator: string;
  owner: string;
  brandName: string;
  productName: string;
  metadataUri: string;
  integrityHash: string;
  totalEdition: number;
  status: number; // 1: Active, 2: Transferred, 3: Retired
  createdAt: number;
  indexedAt: string;
}

export interface StoredEscrowOrder {
  orderId: number;
  buyer: string;
  seller: string;
  token: string;
  amount: string;
  orderRef: string;
  state: number; // 0: Created, 1: Funded, 2: Released, 3: Refunded, 4: Cancelled
  createdAt: number;
  fundedAt: number;
  settledAt: number;
  indexedAt: string;
}

export interface StoredContractEvent {
  id: string;
  contractId: string;
  contractName: 'designer_registry' | 'product_passport' | 'fashion_escrow';
  eventType: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  data: Record<string, unknown>;
  indexedAt: string;
}

export interface IndexerState {
  lastLedger: number;
  totalEvents: number;
  lastSyncAt: string;
}

interface DatabaseSchema {
  designers: Record<string, StoredDesigner>;
  passports: Record<string, StoredPassport>;
  escrows: Record<string, StoredEscrowOrder>;
  events: StoredContractEvent[];
  indexerState: IndexerState;
}

export class ProtocolDatabase {
  private filePath: string;
  private data: DatabaseSchema;

  constructor(filePath?: string) {
    this.filePath =
      filePath || path.resolve(__dirname, '..', '..', 'data', 'protocol_db.json');
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // Fallback on read failure
    }

    return {
      designers: {},
      passports: {},
      escrows: {},
      events: [],
      indexerState: {
        lastLedger: 0,
        totalEvents: 0,
        lastSyncAt: new Date().toISOString(),
      },
    };
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Event operations with deduplication
  public saveEvent(event: StoredContractEvent): boolean {
    const existing = this.data.events.some((e) => e.id === event.id);
    if (existing) {
      return false; // deduplicated
    }

    this.data.events.unshift(event);
    if (this.data.events.length > 500) {
      this.data.events = this.data.events.slice(0, 500);
    }
    this.data.indexerState.totalEvents++;
    this.save();
    return true;
  }

  public getEvents(limit = 50, filterType?: string): StoredContractEvent[] {
    let list = this.data.events;
    if (filterType) {
      list = list.filter((e) => e.eventType === filterType || e.contractName === filterType);
    }
    return list.slice(0, limit);
  }

  // Designer operations
  public saveDesigner(designer: StoredDesigner): void {
    this.data.designers[designer.stellarAddress] = designer;
    this.save();
  }

  public getDesigner(address: string): StoredDesigner | null {
    return this.data.designers[address] || null;
  }

  public getAllDesigners(): StoredDesigner[] {
    return Object.values(this.data.designers);
  }

  // Passport operations
  public savePassport(passport: StoredPassport): void {
    this.data.passports[passport.productId] = passport;
    this.save();
  }

  public getPassport(productId: string): StoredPassport | null {
    return this.data.passports[productId] || null;
  }

  public getAllPassports(): StoredPassport[] {
    return Object.values(this.data.passports);
  }

  // Escrow operations
  public saveEscrow(order: StoredEscrowOrder): void {
    this.data.escrows[order.orderId.toString()] = order;
    this.save();
  }

  public getEscrow(orderId: number): StoredEscrowOrder | null {
    return this.data.escrows[orderId.toString()] || null;
  }

  public getAllEscrows(): StoredEscrowOrder[] {
    return Object.values(this.data.escrows);
  }

  // Indexer state
  public getIndexerState(): IndexerState {
    return { ...this.data.indexerState };
  }

  public updateIndexerState(lastLedger: number): void {
    this.data.indexerState.lastLedger = Math.max(this.data.indexerState.lastLedger, lastLedger);
    this.data.indexerState.lastSyncAt = new Date().toISOString();
    this.save();
  }
}

export const db = new ProtocolDatabase();
