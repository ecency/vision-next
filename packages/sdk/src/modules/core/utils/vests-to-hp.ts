export function vestsToHp(vests: number, hivePerMVests: number): number {
  return (vests / 1e6) * hivePerMVests;
}
