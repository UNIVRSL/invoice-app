import { calculateLineItemAmount, generateId, formatCurrency } from '../utils/helpers';
import './LineItemsTable.css';

export default function LineItemsTable({ lineItems, onChange }) {
  function handleFieldChange(id, field, value) {
    const updated = lineItems.map(item => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value };
      next.amount = calculateLineItemAmount(
        field === 'qty' ? value : next.qty,
        field === 'rate' ? value : next.rate
      );
      return next;
    });
    onChange(updated);
  }

  function addRow() {
    onChange([...lineItems, { id: generateId(), description: '', qty: 1, rate: 0, amount: 0 }]);
  }

  function removeRow(id) {
    if (lineItems.length === 1) return;
    onChange(lineItems.filter(item => item.id !== id));
  }

  return (
    <div className="line-items-wrap">
      <table className="line-items-table">
        <thead>
          <tr>
            <th className="col-desc">Description</th>
            <th className="col-qty">Qty</th>
            <th className="col-rate">Rate</th>
            <th className="col-amount">Amount</th>
            <th className="col-del"></th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map(item => (
            <tr key={item.id}>
              <td className="col-desc">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={e => handleFieldChange(item.id, 'description', e.target.value)}
                />
              </td>
              <td className="col-qty">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.qty}
                  onChange={e => handleFieldChange(item.id, 'qty', e.target.value)}
                />
              </td>
              <td className="col-rate">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.rate}
                  onChange={e => handleFieldChange(item.id, 'rate', e.target.value)}
                />
              </td>
              <td className="col-amount">
                <span className="line-amount">{formatCurrency(item.amount)}</span>
              </td>
              <td className="col-del">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => removeRow(item.id)}
                  disabled={lineItems.length === 1}
                  title="Remove row"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn btn-ghost add-line-btn" onClick={addRow}>
        + Add Line Item
      </button>
    </div>
  );
}
