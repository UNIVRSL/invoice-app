import { generateId } from './helpers';

export const defaultSettings = {
  businessName: '',
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  state: '',
};

export function createEmptyInvoice(settings = defaultSettings) {
  const s = settings || defaultSettings;
  return {
    id: generateId(),
    number: '',
    type: 'invoice',
    status: 'draft',
    createdAt: new Date().toISOString().split('T')[0],
    dueDate: '',
    from: {
      businessName: s.businessName || '',
      name: [s.firstName, s.lastName].filter(Boolean).join(' '),
      phone: s.phone || '',
      city: s.city || '',
      state: s.state || '',
    },
    to: { name: '', email: '', address: '' },
    lineItems: [{ id: generateId(), description: '', qty: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    taxRate: 0,
    discountRate: 0,
    total: 0,
    notes: '',
    templateId: 'default-standard',
  };
}

export function createEmptyQuote(settings = defaultSettings) {
  const s = settings || defaultSettings;
  return {
    id: generateId(),
    number: '',
    type: 'quote',
    status: 'draft',
    createdAt: new Date().toISOString().split('T')[0],
    validUntil: '',
    from: {
      businessName: s.businessName || '',
      name: [s.firstName, s.lastName].filter(Boolean).join(' '),
      phone: s.phone || '',
      city: s.city || '',
      state: s.state || '',
    },
    to: { name: '', email: '', address: '' },
    lineItems: [{ id: generateId(), description: '', qty: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    taxRate: 0,
    total: 0,
    notes: '',
    templateId: 'default-standard',
  };
}

const DEFAULT_SECTIONS = [
  { id: 'header',    label: 'Header / Business Name', enabled: true,  order: 0 },
  { id: 'from',      label: 'From (Business Info)',   enabled: true,  order: 1 },
  { id: 'to',        label: 'To (Client Info)',        enabled: true,  order: 2 },
  { id: 'meta',      label: 'Document Details',        enabled: true,  order: 3 },
  { id: 'lineItems', label: 'Line Items Table',        enabled: true,  order: 4 },
  { id: 'totals',    label: 'Subtotal / Tax / Total',  enabled: true,  order: 5 },
  { id: 'notes',     label: 'Notes',                   enabled: true,  order: 6 },
  { id: 'terms',     label: 'Terms & Conditions',      enabled: false, order: 7 },
  { id: 'payment',   label: 'Payment Information',     enabled: false, order: 8 },
];

export const defaultTemplates = [
  {
    id: 'default-standard',
    name: 'Standard',
    type: 'both',
    isDefault: true,
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
  },
  {
    id: 'default-compact',
    name: 'Compact',
    type: 'both',
    isDefault: true,
    sections: DEFAULT_SECTIONS.map(s => ({
      ...s,
      enabled: !['notes', 'terms', 'payment'].includes(s.id),
    })),
  },
  {
    id: 'default-detailed',
    name: 'Detailed',
    type: 'both',
    isDefault: true,
    sections: DEFAULT_SECTIONS.map(s => ({ ...s, enabled: true })),
  },
];
