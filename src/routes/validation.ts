import { Router, Request, Response } from 'express';
import { ApiResponse, ValidateAddressResponse, ValidatePaymentResponse } from '../types/api';
import { validateStellarAddress, validateXlmAmount, validateMemo } from '../utils/validation';
import { STELLAR_TESTNET_CONFIG } from '../config/stellar';

const router = Router();

router.post('/address', (req: Request, res: Response) => {
  const { address } = req.body || {};
  const result = validateStellarAddress(address);

  const data: ValidateAddressResponse = {
    address: typeof address === 'string' ? address : '',
    isValid: result.isValid,
    error: result.error,
  };

  const response: ApiResponse<ValidateAddressResponse> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

router.post('/payment', (req: Request, res: Response) => {
  const { fromAddress, toAddress, amountXlm, memo, memoType } = req.body || {};

  const errors: string[] = [];

  const fromCheck = validateStellarAddress(fromAddress);
  if (!fromCheck.isValid) {
    errors.push(`Sender address invalid: ${fromCheck.error}`);
  }

  const toCheck = validateStellarAddress(toAddress);
  if (!toCheck.isValid) {
    errors.push(`Recipient address invalid: ${toCheck.error}`);
  }

  if (fromAddress && toAddress && fromAddress.trim() === toAddress.trim()) {
    errors.push('Sender and recipient addresses cannot be identical');
  }

  const amountCheck = validateXlmAmount(amountXlm);
  if (!amountCheck.isValid) {
    errors.push(`Amount invalid: ${amountCheck.error}`);
  }

  const memoCheck = validateMemo(memo, memoType || 'text');
  if (!memoCheck.isValid) {
    errors.push(`Memo invalid: ${memoCheck.error}`);
  }

  const baseFeeXlm = (parseInt(STELLAR_TESTNET_CONFIG.baseFeeStroops, 10) / 10_000_000).toFixed(7);

  const data: ValidatePaymentResponse = {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      fromAddress: typeof fromAddress === 'string' ? fromAddress.trim() : '',
      toAddress: typeof toAddress === 'string' ? toAddress.trim() : '',
      amountXlm: typeof amountXlm === 'string' ? amountXlm.trim() : String(amountXlm || ''),
      memo: memoCheck.sanitizedMemo,
      memoType: memoType || 'text',
      estimatedBaseFeeXlm: baseFeeXlm,
    },
  };

  const response: ApiResponse<ValidatePaymentResponse> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export default router;
