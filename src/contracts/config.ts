import fs from 'fs';
import path from 'path';

export interface ContractDeploymentInfo {
  name: string;
  address: string;
  wasmHash?: string;
  uploadTxHash?: string;
  deploymentTxHash?: string;
  seedTxHash?: string;
  explorerUrl?: string;
}

export interface DeploymentManifest {
  network: string;
  networkPassphrase: string;
  rpcUrl: string;
  deployerPublicKey: string;
  deployedAt: string;
  contracts: {
    designer_registry: ContractDeploymentInfo;
    product_passport: ContractDeploymentInfo;
    fashion_escrow: ContractDeploymentInfo;
  };
}

export const DEFAULT_CONTRACTS: DeploymentManifest = {
  network: 'testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  deployerPublicKey: 'GCCTT7IQVNIDYHAJXYGMUYGETJDYRVLCOMW2UGRWKVCUZ6I7CQY5ZWG4',
  deployedAt: '2026-10-09T21:49:09.000Z',
  contracts: {
    designer_registry: {
      name: 'DesignerRegistry',
      address: 'CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR',
    },
    product_passport: {
      name: 'ProductPassport',
      address: 'CAJLI5PXVPQWOY4C2MCG7GII37IORAP4PL5AVX7GSOCUV6FH5FTW2E4U',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CAJLI5PXVPQWOY4C2MCG7GII37IORAP4PL5AVX7GSOCUV6FH5FTW2E4U',
    },
    fashion_escrow: {
      name: 'FashionEscrow',
      address: 'CBULSNLLBDACPNNNM4JB5NL2XB56QP6FVU7HHIOTNUXKUBSU4JHJGV5D',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CBULSNLLBDACPNNNM4JB5NL2XB56QP6FVU7HHIOTNUXKUBSU4JHJGV5D',
    },
  },
};

export function getContractsManifest(): DeploymentManifest {
  const manifestPath = path.resolve(__dirname, '..', '..', 'deployments', 'testnet.json');
  try {
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (data.contracts?.designer_registry?.address) {
        return data as DeploymentManifest;
      }
    }
  } catch {}

  return DEFAULT_CONTRACTS;
}
