import {
  rpc,
  Address,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Operation,
} from '@stellar/stellar-sdk';
import { getContractAddress, getNetworkConfig } from './config';

export interface FinancingProposal {
  proposalId: string;
  applicant: string;
  token: string;
  targetAmount: bigint;
  minThreshold: bigint;
  currentFunded: bigint;
  deadline: bigint;
  repaymentTarget: bigint;
  totalRepaid: bigint;
  purpose: string;
  metadataUri: string;
  status: number;
  createdAt: bigint;
}

export class ProductionFinancingClient {
  private server: rpc.Server;
  private contractAddress: string;
  private networkPassphrase: string;

  constructor(contractAddress?: string) {
    const config = getNetworkConfig();
    this.server = new rpc.Server(config.rpcUrl);
    this.networkPassphrase = config.networkPassphrase;
    this.contractAddress = contractAddress || getContractAddress('production_financing');
  }

  public getAddress(): string {
    return this.contractAddress;
  }

  public async getProposal(proposalId: string): Promise<FinancingProposal | null> {
    const tx = new TransactionBuilder(
      {
        accountId: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        sequenceNumber: () => '0',
        incrementSequenceNumber: () => {},
      } as any,
      { fee: '100', networkPassphrase: this.networkPassphrase }
    )
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractAddress,
          function: 'get_proposal',
          args: [nativeToScVal(proposalId, { type: 'string' })],
        })
      )
      .setTimeout(30)
      .build();

    const sim: any = await this.server.simulateTransaction(tx);
    if (sim.error || !sim.result?.retval) {
      return null;
    }

    const native = scValToNative(sim.result.retval);
    return {
      proposalId: native.proposal_id,
      applicant: native.applicant,
      token: native.token,
      targetAmount: native.target_amount,
      minThreshold: native.min_threshold,
      currentFunded: native.current_funded,
      deadline: native.deadline,
      repaymentTarget: native.repayment_target,
      totalRepaid: native.total_repaid,
      purpose: native.purpose,
      metadataUri: native.metadata_uri,
      status: native.status,
      createdAt: native.created_at,
    };
  }

  public async hasProposal(proposalId: string): Promise<boolean> {
    const tx = new TransactionBuilder(
      {
        accountId: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        sequenceNumber: () => '0',
        incrementSequenceNumber: () => {},
      } as any,
      { fee: '100', networkPassphrase: this.networkPassphrase }
    )
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractAddress,
          function: 'has_proposal',
          args: [nativeToScVal(proposalId, { type: 'string' })],
        })
      )
      .setTimeout(30)
      .build();

    const sim: any = await this.server.simulateTransaction(tx);
    if (sim.error || !sim.result?.retval) {
      return false;
    }
    return Boolean(scValToNative(sim.result.retval));
  }
}
