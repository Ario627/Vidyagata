export function formatPercentFromBp(basisPoints: number): string {
  return `${String(basisPoints / 100).replace(".", ",")}%`;
}
