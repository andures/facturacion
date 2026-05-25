export function generateInvoiceNumber(prefix: string, nextNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(nextNumber).padStart(3, '0');
  return `${prefix}${year}-${padded}`;
}
