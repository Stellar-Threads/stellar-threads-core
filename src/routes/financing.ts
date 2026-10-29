import { Router, Request, Response } from 'express';
import { ProductionFinancingClient } from '../contracts/financingClient';

export const financingRouter = Router();

// GET /api/v1/financing/proposals - List production financing proposals
financingRouter.get('/proposals', async (_req: Request, res: Response) => {
  try {
    const client = new ProductionFinancingClient();
    const contractAddress = client.getAddress();

    const sampleProposals = [
      {
        id: 'prop-fw26-silk-run',
        applicant: 'GCCTT7IQVNIDYHAJXYGMUYGETJDYRVLCOMW2UGRWKVCUZ6I7CQY5ZWG4',
        title: 'Autumn/Winter Mulberry Silk Run',
        purpose: 'Ethical mulberry silk sourcing and artisanal hand-weaving for ready-to-wear coats.',
        targetAmount: '50000',
        minThreshold: '25000',
        currentFunded: '32500',
        deadline: '2026-11-15',
        repaymentTarget: '55000',
        status: 'FundingActive',
        metadataUri: 'ipfs://bafybeisilkmulberryrun2026',
      },
      {
        id: 'prop-organic-denim-01',
        applicant: 'GBA7VGY42OQ7H4R6Z4M64S3N673F26J5P7J6Z4O6M3V2S4K2O2L3M4N5',
        title: 'Zero-Waste Organic Indigo Denim Batch',
        purpose: 'Water-neutral denim production utilizing botanical indigo dye and recycled cotton.',
        targetAmount: '35000',
        minThreshold: '20000',
        currentFunded: '35000',
        deadline: '2026-10-30',
        repaymentTarget: '38500',
        status: 'Funded',
        metadataUri: 'ipfs://bafybeidenimzerowastebatch',
      },
    ];

    res.json({
      success: true,
      data: {
        contractAddress,
        proposals: sampleProposals,
        total: sampleProposals.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FINANCING_QUERY_ERROR',
        message: error.message || 'Failed to query financing proposals',
      },
    });
  }
});

// GET /api/v1/financing/proposals/:id - Get specific proposal
financingRouter.get('/proposals/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id || '');
    const client = new ProductionFinancingClient();

    let onChain = null;
    try {
      onChain = await client.getProposal(id);
    } catch {}

    res.json({
      success: true,
      data: {
        id,
        contractAddress: client.getAddress(),
        onChainRecord: onChain,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROPOSAL_LOOKUP_ERROR',
        message: error.message || 'Failed to lookup proposal',
      },
    });
  }
});

financingRouter.post('/calculate-roi', (req: Request, res: Response) => {
  const { principalStroops, yieldBps, durationDays } = req.body;
  if (!principalStroops || !yieldBps || !durationDays) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMETERS', message: 'principalStroops, yieldBps, and durationDays are required' },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const p = BigInt(principalStroops);
  const estYield = (p * BigInt(yieldBps) * BigInt(durationDays)) / (10000n * 365n);
  const totalReturn = p + estYield;

  res.json({
    success: true,
    data: {
      principalStroops: p.toString(),
      yieldBps,
      durationDays,
      estimatedYieldStroops: estYield.toString(),
      totalReturnStroops: totalReturn.toString(),
      effectiveApyPercent: (yieldBps / 100).toFixed(2),
    },
    timestamp: new Date().toISOString(),
  });
});
