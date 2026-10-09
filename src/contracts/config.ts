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
    production_financing: ContractDeploymentInfo;
  };
}

export const DEFAULT_CONTRACTS: DeploymentManifest = {
  network: 'testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  deployerPublicKey: 'GCCTT7IQVNIDYHAJXYGMUYGETJDYRVLCOMW2UGRWKVCUZ6I7CQY5ZWG4',
  deployedAt: '2026-10-09T23:06:31.080Z',
  contracts: {
    designer_registry: {
      name: 'DesignerRegistry',
      address: 'CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR',
    },
    product_passport: {
      name: 'ProductPassport',
      address: 'CD23NAGPWADWWFRGMDUM4GUFGIB52U73L3F5QURQSACWOHXLEKKE3ZVL',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CD23NAGPWADWWFRGMDUM4GUFGIB52U73L3F5QURQSACWOHXLEKKE3ZVL',
    },
    fashion_escrow: {
      name: 'FashionEscrow',
      address: 'CBULSNLLBDACPNNNM4JB5NL2XB56QP6FVU7HHIOTNUXKUBSU4JHJGV5D',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CBULSNLLBDACPNNNM4JB5NL2XB56QP6FVU7HHIOTNUXKUBSU4JHJGV5D',
    },
    production_financing: {
      name: 'ProductionFinancing',
      address: 'CAIK2L6D272O6RZA23LRL3QSHLDVXNZXD6BKXCYNEL6R35IEG3YXES3M',
      explorerUrl: 'https://stellar.expert/explorer/testnet/contract/CAIK2L6D272O6RZA23LRL3QSHLDVXNZXD6BKXCYNEL6R35IEG3YXES3M',
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

export function getNetworkConfig() {
  const manifest = getContractsManifest();
  return {
    rpcUrl: manifest.rpcUrl,
    networkPassphrase: manifest.networkPassphrase,
    network: manifest.network,
  };
}

export function getContractAddress(contractName: keyof DeploymentManifest['contracts']): string {
  const manifest = getContractsManifest();
  return manifest.contracts[contractName]?.address || DEFAULT_CONTRACTS.contracts[contractName]?.address;
}
