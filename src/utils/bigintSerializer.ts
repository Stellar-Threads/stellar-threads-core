export function stringifyWithBigInt(value: unknown): string {
  return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

export function parseWithBigInt(jsonStr: string): unknown {
  return JSON.parse(jsonStr);
}
