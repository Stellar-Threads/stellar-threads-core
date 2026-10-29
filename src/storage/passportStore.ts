export interface StoredPassport {
  productId: string;
  brandName: string;
  productName: string;
  creator: string;
  owner: string;
  integrityHash: string;
  status: string;
  createdAt: string;
}

export class PassportStore {
  private passports = new Map<string, StoredPassport>();

  public save(passport: StoredPassport): void {
    this.passports.set(passport.productId, passport);
  }

  public get(productId: string): StoredPassport | undefined {
    return this.passports.get(productId);
  }

  public listAll(): StoredPassport[] {
    return Array.from(this.passports.values());
  }

  public count(): number {
    return this.passports.size;
  }
}

export const globalPassportStore = new PassportStore();
