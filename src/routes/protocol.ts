import { Router, Request, Response } from 'express';
import { ApiResponse, ProtocolInfo } from '../types/api';
import { PROTOCOL_METADATA, STELLAR_TESTNET_CONFIG } from '../config/stellar';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const protocolInfo: ProtocolInfo = {
    name: PROTOCOL_METADATA.name,
    tagline: PROTOCOL_METADATA.tagline,
    version: PROTOCOL_METADATA.version,
    network: STELLAR_TESTNET_CONFIG.network,
    modules: [
      {
        name: 'Stellar Foundation & XLM Payments',
        status: 'active',
        description: 'Native Testnet XLM settlement, Freighter wallet integration, and on-chain verification.',
      },
      {
        name: 'Designer Sovereign Identity',
        status: 'upcoming',
        description: 'Decentralized atelier verification, brand key management, and cryptographic attestation.',
      },
      {
        name: 'Digital Garment Passport',
        status: 'upcoming',
        description: 'Verifiable product digital twins, fabric origin records, and NFC-linked provenance.',
      },
      {
        name: 'B2B Fashion Production Escrow',
        status: 'upcoming',
        description: 'Soroban smart-contract milestone-based escrow between fashion houses and manufacturers.',
      },
      {
        name: 'Pre-Order Crowd-Financing',
        status: 'upcoming',
        description: 'Direct designer-to-consumer micro-financing for zero-waste production batches.',
      },
      {
        name: 'Cross-Border Multi-Asset Settlement',
        status: 'upcoming',
        description: 'Instant settlement for global textile trade using Stellar asset rails (USDC/EURC).',
      },
    ],
  };

  const response: ApiResponse<ProtocolInfo> = {
    success: true,
    data: protocolInfo,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export default router;
