import { rpc, scValToNative } from '@stellar/stellar-sdk';
import { getContractsManifest } from '../contracts/config';
import { db, StoredContractEvent } from '../storage/db';
import { logger } from '../utils/logger';

export type EventListener = (event: StoredContractEvent) => void;

export class SorobanEventIndexer {
  private server: rpc.Server;
  private isRunning: boolean = false;
  private pollIntervalMs: number = 6000;
  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<EventListener> = new Set();
  private errorCount: number = 0;
  private lastError: string | null = null;

  constructor(rpcUrl?: string) {
    const manifest = getContractsManifest();
    this.server = new rpc.Server(rpcUrl || manifest.rpcUrl);
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private broadcast(event: StoredContractEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        logger.error('Error in event listener callback', { err });
      }
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Soroban Event Indexer started');

    // Run first sync immediately
    await this.poll();

    // Schedule regular polling
    this.timer = setInterval(() => {
      this.poll().catch((err) => {
        logger.error('Unhandled indexer error in polling loop', { err });
      });
    }, this.pollIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info('Soroban Event Indexer stopped');
  }

  public getStatus() {
    const state = db.getIndexerState();
    return {
      isRunning: this.isRunning,
      pollIntervalMs: this.pollIntervalMs,
      lastLedger: state.lastLedger,
      totalEventsIndexed: state.totalEvents,
      lastSyncAt: state.lastSyncAt,
      connectedClients: this.listeners.size,
      errorCount: this.errorCount,
      lastError: this.lastError,
    };
  }

  public async poll(): Promise<void> {
    const manifest = getContractsManifest();
    const contractMap: Record<string, 'designer_registry' | 'product_passport' | 'fashion_escrow'> = {
      [manifest.contracts.designer_registry.address]: 'designer_registry',
      [manifest.contracts.product_passport.address]: 'product_passport',
      [manifest.contracts.fashion_escrow.address]: 'fashion_escrow',
    };

    const contractIds = Object.keys(contractMap).filter(Boolean);
    if (contractIds.length === 0) return;

    try {
      const state = db.getIndexerState();
      let startLedger = state.lastLedger;

      // If never indexed, get latest ledger minus 200 (~15 mins history)
      if (!startLedger || startLedger === 0) {
        try {
          const latestInfo = await this.server.getLatestLedger();
          startLedger = Math.max(1, (latestInfo.sequence || 1000) - 200);
        } catch {
          startLedger = 1;
        }
      }

      const res = await this.server.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds,
          },
        ],
        limit: 100,
      });

      if (res.events && res.events.length > 0) {
        let maxLedgerSeen = startLedger;

        for (const rawEv of res.events) {
          const parsed = this.parseEvent(rawEv, contractMap);
          if (parsed) {
            const isNew = db.saveEvent(parsed);
            if (isNew) {
              logger.info(`Indexed new event: [${parsed.contractName}] ${parsed.eventType} (Tx: ${parsed.txHash})`);
              this.broadcast(parsed);
            }
          }
          if (rawEv.ledger && rawEv.ledger > maxLedgerSeen) {
            maxLedgerSeen = rawEv.ledger;
          }
        }

        db.updateIndexerState(maxLedgerSeen);
      } else if (res.latestLedger) {
        db.updateIndexerState(res.latestLedger);
      }

      this.errorCount = 0;
      this.lastError = null;
    } catch (err: any) {
      this.errorCount++;
      this.lastError = err?.message || String(err);
      logger.warn('Event indexer polling iteration encounter notice', { error: this.lastError });
    }
  }

  private parseEvent(
    raw: any,
    contractMap: Record<string, 'designer_registry' | 'product_passport' | 'fashion_escrow'>
  ): StoredContractEvent | null {
    try {
      const contractId = raw.contractId;
      const contractName = contractMap[contractId] || 'designer_registry';

      // Parse topics
      const topics: any[] = [];
      if (raw.topic) {
        for (const t of raw.topic) {
          try {
            topics.push(scValToNative(t));
          } catch {
            topics.push(String(t));
          }
        }
      }

      // Parse data
      let dataVal: any = {};
      if (raw.value) {
        try {
          dataVal = scValToNative(raw.value);
        } catch {
          dataVal = { raw: String(raw.value) };
        }
      }

      // Determine human-readable eventType
      let eventType = 'unknown';
      const topic0 = String(topics[0] || '');
      const topic1 = String(topics[1] || '');

      if (topic0 === 'designer' || contractName === 'designer_registry') {
        eventType = topic1 === 'reg' ? 'designer_registered' : (topic1 === 'updated' ? 'designer_updated' : 'designer_event');
      } else if (topic0 === 'passport' || contractName === 'product_passport') {
        eventType = topic1 === 'created' ? 'passport_created' : (topic1 === 'transf' ? 'passport_transferred' : 'passport_status_updated');
      } else if (topic0 === 'escrow' || contractName === 'fashion_escrow') {
        eventType = topic1 === 'created' ? 'escrow_created' : (topic1 === 'funded' ? 'escrow_funded' : (topic1 === 'release' ? 'escrow_released' : (topic1 === 'refund' ? 'escrow_refunded' : 'escrow_cancelled')));
      }

      const stored: StoredContractEvent = {
        id: raw.id || `${raw.txHash}-${raw.ledger}-${Math.random().toString(36).substring(7)}`,
        contractId,
        contractName,
        eventType,
        ledger: raw.ledger || 0,
        ledgerClosedAt: raw.ledgerClosedAt || new Date().toISOString(),
        txHash: raw.txHash || '',
        data: typeof dataVal === 'object' && dataVal !== null ? dataVal : { value: dataVal },
        indexedAt: new Date().toISOString(),
      };

      // Also update domain entity caches in DB
      this.syncDomainEntities(stored);

      return stored;
    } catch (e) {
      logger.error('Failed to parse raw event', { error: e });
      return null;
    }
  }

  private syncDomainEntities(event: StoredContractEvent): void {
    if (event.eventType === 'designer_registered' || event.eventType === 'designer_updated') {
      const d = event.data;
      if (Array.isArray(d) && d.length >= 3) {
        db.saveDesigner({
          stellarAddress: String(d[0]),
          brandName: String(d[1]),
          atelierLocation: 'Atelier Registered',
          metadataUri: String(d[2]),
          registeredAt: event.ledger,
          isVerified: true,
          indexedAt: new Date().toISOString(),
        });
      }
    } else if (event.eventType === 'passport_created') {
      const d = event.data;
      if (Array.isArray(d) && d.length >= 3) {
        db.savePassport({
          productId: String(d[0]),
          creator: String(d[1]),
          owner: String(d[1]),
          brandName: 'Brand Certified',
          productName: 'Haute Couture Passport',
          metadataUri: 'ipfs://passport',
          integrityHash: String(d[2]),
          totalEdition: 1,
          status: 1,
          createdAt: event.ledger,
          indexedAt: new Date().toISOString(),
        });
      }
    } else if (event.eventType === 'escrow_created') {
      const d = event.data;
      if (Array.isArray(d) && d.length >= 4) {
        db.saveEscrow({
          orderId: Number(d[0]),
          buyer: String(d[1]),
          seller: String(d[2]),
          token: 'XLM',
          amount: String(d[3]),
          orderRef: `ORD-${d[0]}`,
          state: 0,
          createdAt: event.ledger,
          fundedAt: 0,
          settledAt: 0,
          indexedAt: new Date().toISOString(),
        });
      }
    } else if (event.eventType === 'escrow_funded') {
      const d = event.data;
      if (Array.isArray(d) && d.length >= 1) {
        const orderId = Number(d[0]);
        const existing = db.getEscrow(orderId);
        if (existing) {
          existing.state = 1; // Funded
          existing.fundedAt = event.ledger;
          db.saveEscrow(existing);
        }
      }
    } else if (event.eventType === 'escrow_released') {
      const d = event.data;
      if (Array.isArray(d) && d.length >= 1) {
        const orderId = Number(d[0]);
        const existing = db.getEscrow(orderId);
        if (existing) {
          existing.state = 2; // Released
          existing.settledAt = event.ledger;
          db.saveEscrow(existing);
        }
      }
    } else if (event.eventType === 'escrow_refunded') {
      const d = event.data;
      if (Array.isArray(d) && d.length >= 1) {
        const orderId = Number(d[0]);
        const existing = db.getEscrow(orderId);
        if (existing) {
          existing.state = 3; // Refunded
          existing.settledAt = event.ledger;
          db.saveEscrow(existing);
        }
      }
    }
  }

  public getLatestCursor(): number {
    const state = db.getIndexerState();
    return state.lastLedger;
  }

}

export const eventIndexer = new SorobanEventIndexer();
