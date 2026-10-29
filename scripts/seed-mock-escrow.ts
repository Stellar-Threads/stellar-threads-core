/**
 * Seed Script: Populate initial mock fashion ateliers and escrows
 */
import { designerStore } from '../src/store/designerStore';
import { escrowStore } from '../src/store/escrowStore';
import { passportStore } from '../src/store/passportStore';
import { logger } from '../src/utils/logger';

export function seedInitialData(): void {
  logger.info('Seeding mock fashion data for demo environment...');

  designerStore.saveDesigner({
    designerAddress: 'GBTYMGFXTESTADDRESS1234567890DESIGNER1',
    brandName: 'Maison de Stellar',
    specialty: 'Sustainable Bio-Silk Evening Wear',
    tier: 'VerifiedAtelier',
    reputationScore: 98,
    registeredAt: new Date().toISOString(),
  });

  passportStore.savePassport({
    productId: 'PASSPORT-BIO-SILK-001',
    designer: 'GBTYMGFXTESTADDRESS1234567890DESIGNER1',
    materialsHash: 'sha256-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    batchSize: 50,
    status: 'Authentic',
    mintedAt: new Date().toISOString(),
  });

  escrowStore.saveOrder({
    orderId: 101,
    buyer: 'GBUYERTESTADDRESS1234567890BUYER1',
    designer: 'GBTYMGFXTESTADDRESS1234567890DESIGNER1',
    amountStroops: '500000000',
    status: 'Funded',
    createdAt: new Date().toISOString(),
  });

  logger.info('Demo seed data populated successfully.');
}

if (require.main === module) {
  seedInitialData();
}
