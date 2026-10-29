import { describe, it, expect } from 'vitest';
import { FashionEscrowClient } from '../contracts/escrowClient';
import { ProductPassportClient } from '../contracts/passportClient';
import { ProductionFinancingClient } from '../contracts/financingClient';
import { DesignerRegistryClient } from '../contracts/designerClient';

describe('Contract Client Interface Parity Tests', () => {
  it('should verify all contract clients provide getContractId', () => {
    const escrow = new FashionEscrowClient();
    const passport = new ProductPassportClient();
    const financing = new ProductionFinancingClient();
    const designer = new DesignerRegistryClient();

    expect(escrow.getContractId()).toBeDefined();
    expect(passport.getContractId()).toBeDefined();
    expect(financing.getContractId()).toBeDefined();
    expect(designer.getContractId()).toBeDefined();
  });
});
