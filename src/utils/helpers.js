import { nanoid } from 'nanoid';

export function generateId() {
  return nanoid(10);
}

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateInvoiceNumber(invoices) {
  if (!invoices || invoices.length === 0) return 'INV-0001';
  const nums = invoices
    .map(inv => {
      const match = inv.number && inv.number.match(/INV-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `INV-${String(max + 1).padStart(4, '0')}`;
}

export function generateQuoteNumber(quotes) {
  if (!quotes || quotes.length === 0) return 'QTE-0001';
  const nums = quotes
    .map(q => {
      const match = q.number && q.number.match(/QTE-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `QTE-${String(max + 1).padStart(4, '0')}`;
}

export function calculateLineItemAmount(qty, rate) {
  return (parseFloat(qty) || 0) * (parseFloat(rate) || 0);
}

export function calculateSubtotal(lineItems) {
  return lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
}

export function calculateTotal(subtotal, taxRate, discountRate = 0) {
  const discountAmount = subtotal * ((parseFloat(discountRate) || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  return afterDiscount + afterDiscount * ((parseFloat(taxRate) || 0) / 100);
}
