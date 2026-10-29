export interface StoredEscrow {
  orderId: number;
  buyer: string;
  seller: string;
  amount: string;
  orderRef: string;
  state: string;
  fundedAt?: number;
}

export class EscrowStore {
  private escrows = new Map<number, StoredEscrow>();

  public save(order: StoredEscrow): void {
    this.escrows.set(order.orderId, order);
  }

  public get(orderId: number): StoredEscrow | undefined {
    return this.escrows.get(orderId);
  }

  public listAll(): StoredEscrow[] {
    return Array.from(this.escrows.values());
  }
}

export const globalEscrowStore = new EscrowStore();
