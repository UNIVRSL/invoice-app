import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { getPhotos } from '../hooks/usePhotoStore';
import './DocumentPreview.css';

export default function DocumentPreview({ document: doc, type, onEdit, onBack }) {
  const [photoMap, setPhotoMap] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    async function resolve() {
      const ids = [];
      (doc.attachments || []).forEach(a => { if (a.id) ids.push(a.id); });
      (doc.quoteMaterials || []).forEach(qm => { if (qm.photoId) ids.push(qm.photoId); });
      if (!ids.length) return;
      const resolved = await getPhotos(ids);
      setPhotoMap(resolved);
    }
    resolve().catch(console.error);
  }, [doc]);

  const dateLabel = type === 'quote' ? 'Valid Until' : 'Due Date';
  const dateValue = type === 'quote' ? doc.validUntil : doc.dueDate;
  const lineSubtotal = (doc.lineItems || []).reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);
  const matTotal = (doc.quoteMaterials || []).reduce((sum, qm) => sum + (parseFloat(qm.price) || 0), 0);
  const subtotal = lineSubtotal + matTotal;
  const discountRate = parseFloat(doc.discountRate) || 0;
  const discountAmount = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxRate = parseFloat(doc.taxRate) || 0;
  const taxAmount = afterDiscount * (taxRate / 100);

  return (
    <div className="doc-preview">
      {/* Header */}
      <div className="doc-preview-header">
        <div className="doc-preview-header-left">
          <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
            Back
          </button>
          <h2 className="doc-preview-title">{doc.number || 'Untitled'}</h2>
          <span className={`badge badge-${doc.status}`}>{doc.status}</span>
        </div>
        <div className="doc-preview-header-right">
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        </div>
      </div>

      <div className="doc-preview-body">
        {/* From / To */}
        <div className="doc-preview-parties">
          <div className="doc-preview-party">
            <div className="preview-label">From</div>
            <div className="preview-party-info">
              {doc.from?.businessName && <div className="preview-party-biz">{doc.from.businessName}</div>}
              {doc.from?.name && <div>{doc.from.name}</div>}
              {doc.from?.phone && <div>{doc.from.phone}</div>}
              {(doc.from?.city || doc.from?.state) && (
                <div>{[doc.from.city, doc.from.state].filter(Boolean).join(', ')}</div>
              )}
            </div>
          </div>
          <div className="doc-preview-party">
            <div className="preview-label">Bill To</div>
            <div className="preview-party-info">
              {doc.to?.name && <div className="preview-party-biz">{doc.to.name}</div>}
              {doc.to?.email && <div>{doc.to.email}</div>}
              {doc.to?.address && <div className="preview-address">{doc.to.address}</div>}
              {!doc.to?.name && !doc.to?.email && (
                <span className="preview-empty">No client info</span>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="doc-preview-meta">
          <div className="preview-meta-item">
            <span className="preview-label">Date</span>
            <span className="preview-meta-value">{doc.createdAt ? formatDate(doc.createdAt) : '—'}</span>
          </div>
          <div className="preview-meta-item">
            <span className="preview-label">{dateLabel}</span>
            <span className="preview-meta-value">{dateValue ? formatDate(dateValue) : '—'}</span>
          </div>
        </div>

        {/* Line Items */}
        {doc.lineItems && doc.lineItems.length > 0 && doc.lineItems.some(li => li.description) && (
          <div className="doc-preview-section">
            <div className="preview-label" style={{ marginBottom: 8 }}>Line Items</div>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="preview-col-num">Qty</th>
                  <th className="preview-col-num">Rate</th>
                  <th className="preview-col-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.lineItems.filter(li => li.description).map((li, i) => (
                  <tr key={i}>
                    <td>{li.description}</td>
                    <td className="preview-col-num">{li.quantity}</td>
                    <td className="preview-col-num">{formatCurrency(li.rate)}</td>
                    <td className="preview-col-num">{formatCurrency(li.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quote Materials */}
        {type === 'quote' && doc.quoteMaterials && doc.quoteMaterials.length > 0 && (
          <div className="doc-preview-section">
            <div className="preview-label" style={{ marginBottom: 8 }}>Materials</div>
            <div className="preview-materials-list">
              {doc.quoteMaterials.map(qm => {
                const photoSrc = qm.photoId ? photoMap[qm.photoId] : qm.photo;
                return (
                  <div key={qm.id} className="preview-material-row">
                    {photoSrc && (
                      <img
                        src={photoSrc}
                        alt={qm.name}
                        className="preview-material-thumb"
                        onClick={() => setLightbox(photoSrc)}
                      />
                    )}
                    <div className="preview-material-info">
                      <span className="preview-material-name">{qm.name}</span>
                      {qm.description && <span className="preview-material-desc">{qm.description}</span>}
                    </div>
                    <span className="preview-material-price">
                      {qm.price !== null && qm.price !== undefined ? formatCurrency(qm.price) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="doc-preview-totals">
          <div className="preview-totals-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountRate > 0 && (
            <div className="preview-totals-row">
              <span>Discount ({discountRate}%)</span>
              <span className="preview-discount">−{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="preview-totals-row">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="preview-totals-row preview-totals-row--total">
            <span>Total</span>
            <span>{formatCurrency(doc.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {doc.notes && (
          <div className="doc-preview-section">
            <div className="preview-label" style={{ marginBottom: 6 }}>Notes</div>
            <p className="preview-notes">{doc.notes}</p>
          </div>
        )}

        {/* Attachments */}
        {doc.attachments && doc.attachments.length > 0 && (
          <div className="doc-preview-section">
            <div className="preview-label" style={{ marginBottom: 10 }}>Photos</div>
            <div className="preview-attachments-grid">
              {doc.attachments.map(att => {
                const src = photoMap[att.id];
                if (!src) return null;
                return (
                  <div key={att.id} className="preview-attachment-thumb" onClick={() => setLightbox(src)}>
                    <img src={src} alt={att.name} title={att.name} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
    </div>
  );
}
