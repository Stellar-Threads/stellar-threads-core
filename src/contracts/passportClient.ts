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

export interface OnChainPassportRecord {
  product_id: string;
  creator: string;
  owner: string;
  brand_name: string;
  product_name: string;
  metadata_uri: string;
  integrity_hash: string;
  total_edition: number;
  status: number;
  created_at: number;
}

export class ProductPassportClient {
  private server: rpc.Server;
  private contractId: string;
  private passphrase: string;

  constructor(rpcUrl?: string, contractAddress?: string, passphrase?: string) {
    const manifest = getContractsManifest();
    this.server = new rpc.Server(rpcUrl || manifest.rpcUrl);
    this.contractId = contractAddress || manifest.contracts.product_passport.address;
    this.passphrase = passphrase || manifest.networkPassphrase;
  }

  public getContractId(): string {
    return this.contractId;
  }

  /**
   * Retrieve product passport record from Soroban contract
   */
  public async getPassport(productId: string): Promise<OnChainPassportRecord | null> {
    try {
      const dummyAccount = Keypair.random();
      const tx = new TransactionBuilder(
        new (rpc as any).Account(dummyAccount.publicKey(), '0'),
        { fee: '100', networkPassphrase: this.passphrase }
      )
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: 'get_passport',
            args: [nativeToScVal(productId, { type: 'string' })],
          })
        )
        .setTimeout(30)
        .build();

      const sim: any = await this.server.simulateTransaction(tx);
      if (sim.result?.retval) {
        const native = scValToNative(sim.result.retval);
        return {
          product_id: native.product_id,
          creator: native.creator,
          owner: native.owner,
          brand_name: native.brand_name,
          product_name: native.product_name,
          metadata_uri: native.metadata_uri,
          integrity_hash: native.integrity_hash,
          total_edition: Number(native.total_edition),
          status: Number(native.status),
          created_at: Number(native.created_at),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verify integrity hash against on-chain record
   */
  public async verifyIntegrity(productId: string, providedHash: string): Promise<boolean> {
    try {
      const dummyAccount = Keypair.random();
      const tx = new TransactionBuilder(
        new (rpc as any).Account(dummyAccount.publicKey(), '0'),
        { fee: '100', networkPassphrase: this.passphrase }
      )
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: 'verify_integrity',
            args: [
              nativeToScVal(productId, { type: 'string' }),
              nativeToScVal(providedHash, { type: 'string' }),
            ],
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
   * Build unsigned transaction to create a product passport
   */
  public async buildCreatePassportTx(
    sourceAddress: string,
    productId: string,
    brandName: string,
    productName: string,
    metadataUri: string,
    integrityHash: string,
    totalEdition: number
  ): Promise<string> {
    const account = await this.server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'create_passport',
          args: [
            new Address(sourceAddress).toScVal(),
            nativeToScVal(productId, { type: 'string' }),
            nativeToScVal(brandName, { type: 'string' }),
            nativeToScVal(productName, { type: 'string' }),
            nativeToScVal(metadataUri, { type: 'string' }),
            nativeToScVal(integrityHash, { type: 'string' }),
            nativeToScVal(totalEdition, { type: 'u32' }),
          ],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  /**
   * Build unsigned transaction to transfer passport
   */
  public async buildTransferPassportTx(
    sourceAddress: string,
    productId: string,
    newOwner: string
  ): Promise<string> {
    const account = await this.server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'transfer_passport',
          args: [
            nativeToScVal(productId, { type: 'string' }),
            new Address(sourceAddress).toScVal(),
            new Address(newOwner).toScVal(),
          ],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }
}
