import { Router, Request, Response } from 'express';
import { db } from '../storage/db';
import { DesignerRegistryClient } from '../contracts/designerClient';
import { logger } from '../utils/logger';

const router = Router();
const designerClient = new DesignerRegistryClient();

// GET /api/v1/designers — List all indexed designers
router.get('/', (_req: Request, res: Response) => {
  const designers = db.getAllDesigners();
  res.json({
    success: true,
    data: {
      total: designers.length,
      contractId: designerClient.getContractId(),
      designers,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/designers/:address — Look up designer on-chain & in cache
router.get('/:address', async (req: Request, res: Response) => {
  const address = String(req.params.address);

  try {
    // 1. Try on-chain read first
    const onChainRecord = await designerClient.getDesigner(address);
    if (onChainRecord) {
      return res.json({
        success: true,
        data: {
          source: 'on_chain_soroban',
          designer: onChainRecord,
          contractId: designerClient.getContractId(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Fall back to cached indexed db
    const cached = db.getDesigner(address);
    if (cached) {
      return res.json({
        success: true,
        data: {
          source: 'indexed_db',
          designer: cached,
          contractId: designerClient.getContractId(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(404).json({
      success: false,
      error: {
        code: 'DESIGNER_NOT_FOUND',
        message: `No designer registered for address ${address}`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Error fetching designer', { error: err.message, address });
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: err.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/designers/prepare-register — Build unsigned transaction for wallet signing
router.post('/prepare-register', async (req: Request, res: Response) => {
  const { sourceAddress, brandName, atelierLocation, metadataUri } = req.body;

  if (!sourceAddress || !brandName || !atelierLocation) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing required registration parameters' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const xdr = await designerClient.buildRegisterTx(
      sourceAddress,
      brandName,
      atelierLocation,
      metadataUri || 'ipfs://placeholder'
    );

    return res.json({
      success: true,
      data: {
        xdr,
        contractId: designerClient.getContractId(),
        function: 'register_designer',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'TRANSACTION_BUILD_ERROR', message: err.message },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
