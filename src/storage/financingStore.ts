export interface StoredProposal {
  proposalId: string;
  applicant: string;
  targetAmount: string;
  currentFunded: string;
  repaymentTarget: string;
  status: string;
}

export class FinancingStore {
  private proposals = new Map<string, StoredProposal>();

  public save(proposal: StoredProposal): void {
    this.proposals.set(proposal.proposalId, proposal);
  }

  public get(proposalId: string): StoredProposal | undefined {
    return this.proposals.get(proposalId);
  }

  public listAll(): StoredProposal[] {
    return Array.from(this.proposals.values());
  }
}

export const globalFinancingStore = new FinancingStore();
