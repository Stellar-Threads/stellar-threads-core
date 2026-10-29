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

export interface OnChainDesignerRecord {
  designer_address: string;
  brand_name: string;
  atelier_location: string;
  metadata_uri: string;
  registered_at: number;
  is_verified: boolean;
}

export class DesignerRegistryClient {
  private server: rpc.Server;
  private contractId: string;
  private passphrase: string;

  constructor(rpcUrl?: string, contractAddress?: string, passphrase?: string) {
    const manifest = getContractsManifest();
    this.server = new rpc.Server(rpcUrl || manifest.rpcUrl);
    this.contractId = contractAddress || manifest.contracts.designer_registry.address;
    this.passphrase = passphrase || manifest.networkPassphrase;
  }

  public getContractId(): string {
    return this.contractId;
  }

  /**
   * Check if an address is registered on-chain
   */
  public async hasDesigner(designerAddress: string): Promise<boolean> {
    try {
      const dummyAccount = Keypair.random();
      const tx = new TransactionBuilder(
        new (rpc as any).Account(dummyAccount.publicKey(), '0'),
        { fee: '100', networkPassphrase: this.passphrase }
      )
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: 'has_designer',
            args: [new Address(designerAddress).toScVal()],
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
   * Read designer record from Soroban contract
   */
  public async getDesigner(designerAddress: string): Promise<OnChainDesignerRecord | null> {
    try {
      const dummyAccount = Keypair.random();
      const tx = new TransactionBuilder(
        new (rpc as any).Account(dummyAccount.publicKey(), '0'),
        { fee: '100', networkPassphrase: this.passphrase }
      )
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: 'get_designer',
            args: [new Address(designerAddress).toScVal()],
          })
        )
        .setTimeout(30)
        .build();

      const sim: any = await this.server.simulateTransaction(tx);
      if (sim.result?.retval) {
        const native = scValToNative(sim.result.retval);
        return {
          designer_address: native.designer_address,
          brand_name: native.brand_name,
          atelier_location: native.atelier_location,
          metadata_uri: native.metadata_uri,
          registered_at: Number(native.registered_at),
          is_verified: Boolean(native.is_verified),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Build an unsigned transaction to register a designer
   */
  public async buildRegisterTx(
    sourceAddress: string,
    brandName: string,
    atelierLocation: string,
    metadataUri: string
  ): Promise<string> {
    const account = await this.server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'register_designer',
          args: [
            new Address(sourceAddress).toScVal(),
            nativeToScVal(brandName, { type: 'string' }),
            nativeToScVal(atelierLocation, { type: 'string' }),
            nativeToScVal(metadataUri, { type: 'string' }),
          ],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  /**
   * Build an unsigned transaction to update profile
   */
  public async buildUpdateTx(
    sourceAddress: string,
    brandName: string,
    atelierLocation: string,
    metadataUri: string
  ): Promise<string> {
    const account = await this.server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'update_profile',
          args: [
            new Address(sourceAddress).toScVal(),
            nativeToScVal(brandName, { type: 'string' }),
            nativeToScVal(atelierLocation, { type: 'string' }),
            nativeToScVal(metadataUri, { type: 'string' }),
          ],
        })
      )
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    return prepared.toXDR();
  }

  public formatDesignerTier(tierCode: number): string {
    switch (tierCode) {
      case 1: return 'Emerging';
      case 2: return 'VerifiedAtelier';
      case 3: return 'HauteCouture';
      default: return 'Standard';
    }
  }

}
