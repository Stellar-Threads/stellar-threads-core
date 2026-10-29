import { Router, Request, Response } from 'express';
import { db } from '../storage/db';
import { ProductPassportClient } from '../contracts/passportClient';
import { logger } from '../utils/logger';

const router = Router();
const passportClient = new ProductPassportClient();

// GET /api/v1/passports — List all product passports
router.get('/', (_req: Request, res: Response) => {
  const passports = db.getAllPassports();
  res.json({
    success: true,
    data: {
      total: passports.length,
      contractId: passportClient.getContractId(),
      passports,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/passports/:id — Look up product passport by ID
router.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const onChain = await passportClient.getPassport(id);
    if (onChain) {
      return res.json({
        success: true,
        data: {
          source: 'on_chain_soroban',
          passport: onChain,
          contractId: passportClient.getContractId(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const cached = db.getPassport(id);
    if (cached) {
      return res.json({
        success: true,
        data: {
          source: 'indexed_db',
          passport: cached,
          contractId: passportClient.getContractId(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(404).json({
      success: false,
      error: { code: 'PASSPORT_NOT_FOUND', message: `Passport with ID ${id} not found` },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Error fetching passport', { error: err.message, id });
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: err.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/passports/verify — Verify integrity hash against on-chain record
router.post('/verify', async (req: Request, res: Response) => {
  const { productId, hash } = req.body;

  if (!productId || !hash) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'productId and hash are required' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const isValid = await passportClient.verifyIntegrity(productId, hash);
    return res.json({
      success: true,
      data: {
        productId,
        providedHash: hash,
        isValid,
        verificationType: 'cryptographic_hash_match',
        contractId: passportClient.getContractId(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_ERROR', message: err.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/passports/prepare-create — Build unsigned tx for passport minting
router.post('/prepare-create', async (req: Request, res: Response) => {
  const { sourceAddress, productId, brandName, productName, metadataUri, integrityHash, totalEdition } =
    req.body;

  if (!sourceAddress || !productId || !brandName || !productName || !integrityHash) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing required passport parameters' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const xdr = await passportClient.buildCreatePassportTx(
      sourceAddress,
      productId,
      brandName,
      productName,
      metadataUri || 'ipfs://placeholder',
      integrityHash,
      Number(totalEdition) || 1
    );

    return res.json({
      success: true,
      data: {
        xdr,
        contractId: passportClient.getContractId(),
        function: 'create_passport',
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


router.get('/qr/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  res.json({
    success: true,
    data: {
      productId,
      qrVerificationUrl: `https://stellar-threads.netlify.app/passports/${productId}`,
      nfcScanProtocol: 'NDEF-URI-V1',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
