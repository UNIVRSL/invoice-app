import './TemplatePreview.css';

const SAMPLE = {
  from: { businessName: 'Your Business', name: 'John Doe', phone: '(555) 000-0000', city: 'New York', state: 'NY' },
  to: { name: 'Client Name', email: 'client@example.com', address: '123 Main St\nNew York, NY 10001' },
  number: 'INV-0001',
  createdAt: 'Apr 3, 2026',
  dueDate: 'Apr 17, 2026',
  lineItems: [
    { description: 'Design services', qty: 10, rate: 100, amount: 1000 },
    { description: 'Development work', qty: 5, rate: 150, amount: 750 },
  ],
  subtotal: 1750,
  taxRate: 8,
  total: 1890,
  notes: 'Thank you for your business!',
};

const sectionRenderers = {
  header: () => (
    <div className="prev-header">
      <div className="prev-biz-name">{SAMPLE.from.businessName}</div>
    </div>
  ),
  from: () => (
    <div className="prev-from">
      <div className="prev-label">From</div>
      <div>{SAMPLE.from.name}</div>
      <div>{SAMPLE.from.phone}</div>
      <div>{SAMPLE.from.city}, {SAMPLE.from.state}</div>
    </div>
  ),
  to: () => (
    <div className="prev-to">
      <div className="prev-label">Bill To</div>
      <div><strong>{SAMPLE.to.name}</strong></div>
      <div>{SAMPLE.to.email}</div>
    </div>
  ),
  meta: () => (
    <div className="prev-meta">
      <div><span className="prev-label">Invoice</span> {SAMPLE.number}</div>
      <div><span className="prev-label">Date</span> {SAMPLE.createdAt}</div>
      <div><span className="prev-label">Due</span> {SAMPLE.dueDate}</div>
    </div>
  ),
  lineItems: () => (
    <table className="prev-table">
      <thead>
        <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
      </thead>
      <tbody>
        {SAMPLE.lineItems.map((item, i) => (
          <tr key={i}>
            <td>{item.description}</td>
            <td>{item.qty}</td>
            <td>${item.rate}</td>
            <td>${item.amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  totals: () => (
    <div className="prev-totals">
      <div className="prev-totals-row"><span>Subtotal</span><span>${SAMPLE.subtotal.toFixed(2)}</span></div>
      <div className="prev-totals-row"><span>Tax ({SAMPLE.taxRate}%)</span><span>${(SAMPLE.subtotal * SAMPLE.taxRate / 100).toFixed(2)}</span></div>
      <div className="prev-totals-row prev-totals-total"><span>Total</span><span>${SAMPLE.total.toFixed(2)}</span></div>
    </div>
  ),
  notes: () => (
    <div className="prev-notes">
      <div className="prev-label">Notes</div>
      <div>{SAMPLE.notes}</div>
    </div>
  ),
  terms: () => (
    <div className="prev-terms">
      <div className="prev-label">Terms & Conditions</div>
      <div>Payment is due within 14 days of invoice date.</div>
    </div>
  ),
  payment: () => (
    <div className="prev-payment">
      <div className="prev-label">Payment Information</div>
      <div>Bank transfer · Account: 0000-0000</div>
    </div>
  ),
};

export default function TemplatePreview({ template }) {
  const sorted = [...(template.sections || [])]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="template-preview-wrap">
      <div className="template-preview-label">Preview</div>
      <div className="template-preview-scaler">
        <div className="template-preview-page">
          {sorted.map(section => {
            const renderer = sectionRenderers[section.id];
            return renderer ? (
              <div key={section.id} className="prev-section">
                {renderer()}
              </div>
            ) : null;
          })}
          {sorted.length === 0 && (
            <div className="prev-empty">Enable sections to see a preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
