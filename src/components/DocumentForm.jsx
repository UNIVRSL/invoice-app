import { useState } from 'react';
import LineItemsTable from './LineItemsTable';
import { useAppContext } from '../context/AppContext';
import { calculateSubtotal, calculateTotal, formatCurrency, generateId } from '../utils/helpers';
import './DocumentForm.css';

const MAX_PHOTOS = 5;
const MAX_PX = 1200;
const QUALITY = 0.78;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          const ratio = Math.min(MAX_PX / width, MAX_PX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const INVOICE_STATUSES = ['draft', 'sent', 'paid'];
const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined'];

export default function DocumentForm({ document: doc, type, onSave, onCancel }) {
  const { clients, materials } = useAppContext();
  const [form, setForm] = useState({
    ...doc,
    attachments: doc.attachments || [],
    quoteMaterials: doc.quoteMaterials || [],
  });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [matSearch, setMatSearch] = useState('');
  const [showMatList, setShowMatList] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);

  const filteredMaterials = matSearch.trim()
    ? materials.filter(m =>
        m.name?.toLowerCase().includes(matSearch.toLowerCase()) ||
        m.description?.toLowerCase().includes(matSearch.toLowerCase())
      )
    : materials;

  function addQuoteMaterial(material) {
    if (form.quoteMaterials.some(qm => qm.materialId === material.id)) return;
    const entry = {
      id: generateId(),
      materialId: material.id,
      name: material.name,
      description: material.description || '',
      price: material.price ?? null,
      photo: material.photo || null,
    };
    setForm(prev => {
      const next = [...prev.quoteMaterials, entry];
      const subtotal = calculateSubtotal(prev.lineItems) + materialsTotal(next);
      const total = calculateTotal(subtotal, prev.taxRate, prev.discountRate);
      return { ...prev, quoteMaterials: next, subtotal, total };
    });
    setMatSearch('');
    setShowMatList(false);
  }

  function removeQuoteMaterial(id) {
    setForm(prev => {
      const next = prev.quoteMaterials.filter(qm => qm.id !== id);
      const subtotal = calculateSubtotal(prev.lineItems) + materialsTotal(next);
      const total = calculateTotal(subtotal, prev.taxRate, prev.discountRate);
      return { ...prev, quoteMaterials: next, subtotal, total };
    });
  }

  async function handlePhotoAdd(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - (form.attachments?.length || 0);
    const toProcess = files.slice(0, remaining);
    setUploading(true);
    try {
      const compressed = await Promise.all(
        toProcess.map(async f => ({ id: generateId(), name: f.name, dataUrl: await compressImage(f) }))
      );
      setForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...compressed] }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handlePhotoRemove(id) {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  }

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

  function materialsTotal(quoteMaterials) {
    return (quoteMaterials || []).reduce((sum, qm) => sum + (parseFloat(qm.price) || 0), 0);
  }

  function handleLineItemsChange(lineItems) {
    const subtotal = calculateSubtotal(lineItems) + materialsTotal(form.quoteMaterials);
    const total = calculateTotal(subtotal, form.taxRate, form.discountRate);
    setForm(prev => ({ ...prev, lineItems, subtotal, total }));
  }

  function handleTaxRateChange(taxRate) {
    const subtotal = calculateSubtotal(form.lineItems) + materialsTotal(form.quoteMaterials);
    const total = calculateTotal(subtotal, taxRate, form.discountRate);
    setForm(prev => ({ ...prev, taxRate, subtotal, total }));
  }

  function handleDiscountRateChange(discountRate) {
    const subtotal = calculateSubtotal(form.lineItems) + materialsTotal(form.quoteMaterials);
    const total = calculateTotal(subtotal, form.taxRate, discountRate);
    setForm(prev => ({ ...prev, discountRate, subtotal, total }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const subtotal = calculateSubtotal(form.lineItems) + materialsTotal(form.quoteMaterials);
    const total = calculateTotal(subtotal, form.taxRate, form.discountRate);
    onSave({ ...form, subtotal, total });
  }

  const statuses = type === 'quote' ? QUOTE_STATUSES : INVOICE_STATUSES;
  const dateLabel = type === 'quote' ? 'Valid Until' : 'Due Date';
  const dateField = type === 'quote' ? 'validUntil' : 'dueDate';
  const lineSubtotal = calculateSubtotal(form.lineItems);
  const matTotal = materialsTotal(form.quoteMaterials);
  const subtotal = lineSubtotal + matTotal;
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

        {/* Materials section — quotes only */}
        {type === 'quote' && (
          <div className="doc-form-section">
            <div className="form-label" style={{ marginBottom: 8 }}>Materials</div>

            {/* Search picker */}
            {materials.length > 0 ? (
              <div className="qmat-picker-wrap">
                <div style={{ position: 'relative' }}>
                  <span className="qmat-search-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="qmat-search"
                    placeholder="Search materials to add..."
                    value={matSearch}
                    onChange={e => { setMatSearch(e.target.value); setShowMatList(true); }}
                    onFocus={() => setShowMatList(true)}
                    onBlur={() => setTimeout(() => setShowMatList(false), 150)}
                  />
                  {showMatList && filteredMaterials.length > 0 && (
                    <div className="qmat-dropdown">
                      {filteredMaterials.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className={`qmat-option${form.quoteMaterials.some(qm => qm.materialId === m.id) ? ' qmat-option--added' : ''}`}
                          onMouseDown={() => addQuoteMaterial(m)}
                        >
                          {m.photo && (
                            <img src={m.photo} alt={m.name} className="qmat-option-thumb" />
                          )}
                          <span className="qmat-option-info">
                            <span className="qmat-option-name">{m.name}</span>
                            {m.description && <span className="qmat-option-desc">{m.description}</span>}
                          </span>
                          <span className="qmat-option-price">
                            {m.price !== null && m.price !== undefined ? formatCurrency(m.price) : '—'}
                          </span>
                          {form.quoteMaterials.some(qm => qm.materialId === m.id) && (
                            <span className="qmat-option-added-label">Added</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="qmat-empty-hint">
                No materials saved yet.{' '}
                <span style={{ color: 'var(--color-text-muted)' }}>Add materials on the Materials page first.</span>
              </p>
            )}

            {/* Added materials list */}
            {form.quoteMaterials.length > 0 && (
              <div className="qmat-list">
                {form.quoteMaterials.map(qm => (
                  <div key={qm.id} className="qmat-row">
                    {qm.photo && (
                      <img
                        src={qm.photo}
                        alt={qm.name}
                        className="qmat-row-thumb"
                        onClick={() => setLightbox(qm.photo)}
                      />
                    )}
                    <div className="qmat-row-info">
                      <span className="qmat-row-name">{qm.name}</span>
                      {qm.description && <span className="qmat-row-desc">{qm.description}</span>}
                    </div>
                    <span className="qmat-row-price">
                      {qm.price !== null && qm.price !== undefined ? formatCurrency(qm.price) : '—'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon qmat-remove"
                      onClick={() => removeQuoteMaterial(qm.id)}
                      title="Remove"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Photo attachments */}
        <div className="doc-form-section">
          <div className="attachments-header">
            <span className="form-label">Photos</span>
            <span className="attachments-count">
              {form.attachments.length}/{MAX_PHOTOS}
            </span>
          </div>

          {form.attachments.length > 0 && (
            <div className="attachments-grid">
              {form.attachments.map(att => (
                <div key={att.id} className="attachment-thumb">
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    onClick={() => setLightbox(att.dataUrl)}
                    title={att.name}
                  />
                  <button
                    type="button"
                    className="attachment-remove"
                    onClick={() => handlePhotoRemove(att.id)}
                    title="Remove photo"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.attachments.length < MAX_PHOTOS && (
            <label className={`btn btn-secondary attachment-add-btn${uploading ? ' attachment-add-btn--disabled' : ''}`}>
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoAdd}
                disabled={uploading}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              {uploading ? 'Processing...' : 'Add Photos'}
            </label>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="lightbox-img" alt="Attachment" onClick={e => e.stopPropagation()} />
          <button type="button" className="lightbox-close" onClick={() => setLightbox(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </form>
  );
}
