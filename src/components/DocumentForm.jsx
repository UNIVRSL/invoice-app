import { useState } from 'react';
import LineItemsTable from './LineItemsTable';
import { useAppContext } from '../context/AppContext';
import { calculateSubtotal, calculateTotal, formatCurrency } from '../utils/helpers';
import './DocumentForm.css';

const INVOICE_STATUSES = ['draft', 'sent', 'paid'];
const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined'];

export default function DocumentForm({ document: doc, type, onSave, onCancel }) {
  const { clients } = useAppContext();
  const [form, setForm] = useState({ ...doc });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);

  const filteredClients = clientSearch.trim()
    ? clients.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.company?.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  function selectClient(client) {
    setForm(prev => ({
      ...prev,
      to: {
        name: client.name || '',
        email: client.email || '',
        address: [client.company, client.address].filter(Boolean).join('\n'),
      },
    }));
    setClientSearch(client.name);
    setShowClientList(false);
  }

  function clearClient() {
    setClientSearch('');
    setShowClientList(false);
    setForm(prev => ({ ...prev, to: { name: '', email: '', address: '' } }));
  }

  function setField(path, value) {
    setForm(prev => {
      const next = { ...prev };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        next[parent] = { ...prev[parent], [child]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  }

  function handleLineItemsChange(lineItems) {
    const subtotal = calculateSubtotal(lineItems);
    const total = calculateTotal(subtotal, form.taxRate, form.discountRate);
    setForm(prev => ({ ...prev, lineItems, subtotal, total }));
  }

  function handleTaxRateChange(taxRate) {
    const subtotal = calculateSubtotal(form.lineItems);
    const total = calculateTotal(subtotal, taxRate, form.discountRate);
    setForm(prev => ({ ...prev, taxRate, subtotal, total }));
  }

  function handleDiscountRateChange(discountRate) {
    const subtotal = calculateSubtotal(form.lineItems);
    const total = calculateTotal(subtotal, form.taxRate, discountRate);
    setForm(prev => ({ ...prev, discountRate, subtotal, total }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const subtotal = calculateSubtotal(form.lineItems);
    const total = calculateTotal(subtotal, form.taxRate, form.discountRate);
    onSave({ ...form, subtotal, total });
  }

  const statuses = type === 'quote' ? QUOTE_STATUSES : INVOICE_STATUSES;
  const dateLabel = type === 'quote' ? 'Valid Until' : 'Due Date';
  const dateField = type === 'quote' ? 'validUntil' : 'dueDate';
  const subtotal = calculateSubtotal(form.lineItems);
  const discountAmount = subtotal * ((parseFloat(form.discountRate) || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const total = calculateTotal(subtotal, form.taxRate, form.discountRate);

  return (
    <form className="doc-form" onSubmit={handleSubmit}>
      {/* Header row */}
      <div className="doc-form-header">
        <div className="doc-form-header-left">
          <button type="button" className="btn btn-ghost back-btn" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
            Back
          </button>
          <h2 className="doc-form-title">
            {doc.number ? doc.number : `New ${type === 'quote' ? 'Quote' : 'Invoice'}`}
          </h2>
        </div>
        <div className="doc-form-header-right">
          <select
            value={form.status}
            onChange={e => setField('status', e.target.value)}
            className="status-select"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </div>

      <div className="doc-form-body">
        {/* From / To */}
        <div className="doc-form-parties">
          <div className="doc-form-party">
            <div className="form-label">From</div>
            <div className="party-info">
              {form.from.businessName && <div className="party-biz">{form.from.businessName}</div>}
              {form.from.name && <div>{form.from.name}</div>}
              {form.from.phone && <div>{form.from.phone}</div>}
              {(form.from.city || form.from.state) && (
                <div>{[form.from.city, form.from.state].filter(Boolean).join(', ')}</div>
              )}
              {!form.from.businessName && !form.from.name && !form.from.phone && !form.from.city && (
                <span className="party-empty">Add business info in Settings</span>
              )}
            </div>
          </div>

          <div className="doc-form-party">
            <div className="form-label">Bill To</div>
            <div className="party-inputs">
              {/* Client picker */}
              {clients.length > 0 && (
                <div className="client-picker-wrap">
                  <div className="client-picker-input-row">
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Search saved clients..."
                        value={clientSearch}
                        onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                        onFocus={() => setShowClientList(true)}
                        onBlur={() => setTimeout(() => setShowClientList(false), 150)}
                        className="client-picker-search"
                      />
                      {showClientList && filteredClients.length > 0 && (
                        <div className="client-picker-dropdown">
                          {filteredClients.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              className="client-picker-option"
                              onMouseDown={() => selectClient(c)}
                            >
                              <span className="client-picker-option-name">{c.name}</span>
                              {c.company && <span className="client-picker-option-company">{c.company}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {clientSearch && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={clearClient} title="Clear">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
              <input
                type="text"
                placeholder="Client name"
                value={form.to.name}
                onChange={e => setField('to.name', e.target.value)}
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.to.email}
                onChange={e => setField('to.email', e.target.value)}
              />
              <textarea
                placeholder="Address"
                rows={2}
                value={form.to.address}
                onChange={e => setField('to.address', e.target.value)}
                style={{ minHeight: 60 }}
              />
            </div>
          </div>
        </div>

        {/* Document meta */}
        <div className="doc-form-meta">
          <div className="form-group">
            <label className="form-label">Number</label>
            <input
              type="text"
              value={form.number}
              onChange={e => setField('number', e.target.value)}
              placeholder="INV-0001"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={form.createdAt}
              onChange={e => setField('createdAt', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{dateLabel}</label>
            <input
              type="date"
              value={form[dateField]}
              onChange={e => setField(dateField, e.target.value)}
            />
          </div>
        </div>

        {/* Line items */}
        <div className="doc-form-section">
          <div className="form-label" style={{ marginBottom: 8 }}>Line Items</div>
          <LineItemsTable lineItems={form.lineItems} onChange={handleLineItemsChange} />
        </div>

        {/* Totals */}
        <div className="doc-form-totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {type === 'invoice' && (
            <div className="totals-row">
              <span>
                Discount (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="tax-input"
                  value={form.discountRate ?? 0}
                  onChange={e => handleDiscountRateChange(e.target.value)}
                />
                %)
              </span>
              <span className="totals-discount">
                {discountAmount > 0 ? `−${formatCurrency(discountAmount)}` : formatCurrency(0)}
              </span>
            </div>
          )}
          <div className="totals-row">
            <span>
              Tax (
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="tax-input"
                value={form.taxRate}
                onChange={e => handleTaxRateChange(e.target.value)}
              />
              %)
            </span>
            <span>{formatCurrency(afterDiscount * (parseFloat(form.taxRate) || 0) / 100)}</span>
          </div>
          <div className="totals-row totals-row--total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="doc-form-section">
          <label className="form-label">Notes</label>
          <textarea
            placeholder="Add any notes or payment instructions..."
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            style={{ marginTop: 6 }}
          />
        </div>
      </div>
    </form>
  );
}
