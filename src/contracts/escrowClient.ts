import {
  rpc,
  Address,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Operation,
  Keypair,
} from '@stellar/stellar-sdk';
import { getContractsManifest } from './config';

export interface OnChainEscrowOrder {
  order_id: number;
  buyer: string;
  seller: string;
  token: string;
  amount: string;
  order_ref: string;
  state: number; // 0: Created, 1: Funded, 2: Released, 3: Refunded, 4: Cancelled
  created_at: number;
  funded_at: number;
  settled_at: number;
}

export class FashionEscrowClient {
  private server: rpc.Server;
  private contractId: string;
  private passphrase: string;

  constructor(rpcUrl?: string, contractAddress?: string, passphrase?: string) {
    const manifest = getContractsManifest();
    this.server = new rpc.Server(rpcUrl || manifest.rpcUrl);
    this.contractId = contractAddress || manifest.contracts.fashion_escrow.address;
    this.passphrase = passphrase || manifest.networkPassphrase;
  }

  public getContractId(): string {
    return this.contractId;
  }

  /**
   * Check if an order exists
   */
  public async hasOrder(orderId: number): Promise<boolean> {
    try {
      const dummyAccount = Keypair.random();
      const tx = new TransactionBuilder(
        new (rpc as any).Account(dummyAccount.publicKey(), '0'),
        { fee: '100', networkPassphrase: this.passphrase }
      )
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: 'has_order',
            args: [nativeToScVal(BigInt(orderId), { type: 'u64' })],
          })
        )
        .setTimeout(30)
        .build();

      const sim: any = await this.server.simulateTransaction(tx);
      if (sim.result?.retval) {
        return Boolean(scValToNative(sim.result.retval));
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Read escrow order by ID
   */
  public async getOrder(orderId: number): Promise<OnChainEscrowOrder | null> {
    try {
      const dummyAccount = Keypair.random();
      const tx = new TransactionBuilder(
        new (rpc as any).Account(dummyAccount.publicKey(), '0'),
        { fee: '100', networkPassphrase: this.passphrase }
      )
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: 'get_order',
            args: [nativeToScVal(BigInt(orderId), { type: 'u64' })],
          })
        )
        .setTimeout(30)
        .build();

      const sim: any = await this.server.simulateTransaction(tx);
      if (sim.result?.retval) {
        const native = scValToNative(sim.result.retval);
        return {
          order_id: Number(native.order_id),
          buyer: native.buyer,
          seller: native.seller,
          token: native.token,
          amount: native.amount.toString(),
          order_ref: native.order_ref,
          state: Number(native.state),
          created_at: Number(native.created_at),
          funded_at: Number(native.funded_at),
          settled_at: Number(native.settled_at),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Build unsigned transaction to create an order
   */
  public async buildCreateOrderTx(
    buyerAddress: string,
    orderId: number,
    sellerAddress: string,
    tokenAddress: string,
    amount: string,
    orderRef: string
  ): Promise<string> {
    const account = await this.server.getAccount(buyerAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'create_order',
          args: [
            nativeToScVal(BigInt(orderId), { type: 'u64' }),
            new Address(buyerAddress).toScVal(),
            new Address(sellerAddress).toScVal(),
            new Address(tokenAddress).toScVal(),
            nativeToScVal(BigInt(amount), { type: 'i128' }),
            nativeToScVal(orderRef, { type: 'string' }),
          ],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  /**
   * Build unsigned transaction to fund an order
   */
  public async buildFundOrderTx(buyerAddress: string, orderId: number): Promise<string> {
    const account = await this.server.getAccount(buyerAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'fund_order',
          args: [nativeToScVal(BigInt(orderId), { type: 'u64' })],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  /**
   * Build unsigned transaction to release escrowed funds
   */
  public async buildReleaseFundsTx(buyerAddress: string, orderId: number): Promise<string> {
    const account = await this.server.getAccount(buyerAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'release_funds',
          args: [nativeToScVal(BigInt(orderId), { type: 'u64' })],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  /**
   * Build unsigned transaction to refund escrow
   */
  public async buildRefundFundsTx(sellerAddress: string, orderId: number): Promise<string> {
    const account = await this.server.getAccount(sellerAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'refund_funds',
          args: [nativeToScVal(BigInt(orderId), { type: 'u64' })],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  public async getOrderSettledStatus(orderId: number): Promise<boolean> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) return false;
      return order.state === 2 || order.state === 3 || order.state === 4;
    } catch {
      return false;
    }
  }

  public calculateBpsSplit(totalStroops: bigint, payeeBps: number, secondaryBps: number): { payee: bigint; secondary: bigint } {
    const secondary = (totalStroops * BigInt(secondaryBps)) / 10000n;
    const payee = totalStroops - secondary;
    return { payee, secondary };
  }

}
