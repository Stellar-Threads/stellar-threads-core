export function generateGarmentSku(brandCode: string, season: string, index: number): string {
  const cleanBrand = brandCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const cleanSeason = season.toUpperCase().slice(0, 4);
  const pad = String(index).padStart(4, '0');
  return `${cleanBrand}-${cleanSeason}-${pad}`;
}
