import { Router, Request, Response } from 'express';
import { db } from '../storage/db';
import { FashionEscrowClient } from '../contracts/escrowClient';
import { logger } from '../utils/logger';

const router = Router();
const escrowClient = new FashionEscrowClient();

// GET /api/v1/escrow/orders — List all escrow orders
router.get('/orders', (_req: Request, res: Response) => {
  const orders = db.getAllEscrows();
  res.json({
    success: true,
    data: {
      total: orders.length,
      contractId: escrowClient.getContractId(),
      orders,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/escrow/orders/:id — Retrieve specific order
router.get('/orders/:id', async (req: Request, res: Response) => {
  const orderId = parseInt(String(req.params.id));
  if (isNaN(orderId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Order ID must be a numeric integer' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const onChain = await escrowClient.getOrder(orderId);
    if (onChain) {
      return res.json({
        success: true,
        data: {
          source: 'on_chain_soroban',
          order: onChain,
          contractId: escrowClient.getContractId(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const cached = db.getEscrow(orderId);
    if (cached) {
      return res.json({
        success: true,
        data: {
          source: 'indexed_db',
          order: cached,
          contractId: escrowClient.getContractId(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: `Order #${orderId} not found` },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Error fetching escrow order', { error: err.message, orderId });
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: err.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/escrow/prepare-create — Prepare order creation transaction
router.post('/prepare-create', async (req: Request, res: Response) => {
  const { buyerAddress, orderId, sellerAddress, tokenAddress, amount, orderRef } = req.body;

  if (!buyerAddress || !orderId || !sellerAddress || !tokenAddress || !amount || !orderRef) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing required escrow order parameters' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const xdr = await escrowClient.buildCreateOrderTx(
      buyerAddress,
      Number(orderId),
      sellerAddress,
      tokenAddress,
      String(amount),
      orderRef
    );

    return res.json({
      success: true,
      data: {
        xdr,
        contractId: escrowClient.getContractId(),
        function: 'create_order',
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

// POST /api/v1/escrow/prepare-fund — Prepare fund transaction
router.post('/prepare-fund', async (req: Request, res: Response) => {
  const { buyerAddress, orderId } = req.body;

  if (!buyerAddress || !orderId) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'buyerAddress and orderId are required' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const xdr = await escrowClient.buildFundOrderTx(buyerAddress, Number(orderId));
    return res.json({
      success: true,
      data: {
        xdr,
        contractId: escrowClient.getContractId(),
        function: 'fund_order',
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

// POST /api/v1/escrow/prepare-release — Prepare release transaction
router.post('/prepare-release', async (req: Request, res: Response) => {
  const { buyerAddress, orderId } = req.body;

  if (!buyerAddress || !orderId) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'buyerAddress and orderId are required' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const xdr = await escrowClient.buildReleaseFundsTx(buyerAddress, Number(orderId));
    return res.json({
      success: true,
      data: {
        xdr,
        contractId: escrowClient.getContractId(),
        function: 'release_funds',
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

// POST /api/v1/escrow/prepare-refund — Prepare refund transaction
router.post('/prepare-refund', async (req: Request, res: Response) => {
  const { sellerAddress, orderId } = req.body;

  if (!sellerAddress || !orderId) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'sellerAddress and orderId are required' },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const xdr = await escrowClient.buildRefundFundsTx(sellerAddress, Number(orderId));
    return res.json({
      success: true,
      data: {
        xdr,
        contractId: escrowClient.getContractId(),
        function: 'refund_funds',
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
