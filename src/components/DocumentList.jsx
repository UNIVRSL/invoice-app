import { formatCurrency, formatDate } from '../utils/helpers';
import './DocumentList.css';

export default function DocumentList({ documents, type, onSelect, onDelete }) {
  const dateLabel = type === 'quote' ? 'Valid Until' : 'Due Date';
  const dateField = type === 'quote' ? 'validUntil' : 'dueDate';

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <p>No {type === 'quote' ? 'quotes' : 'invoices'} yet. Create your first one.</p>
      </div>
    );
  }

  return (
    <div className="doc-list">
      <table className="doc-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Client</th>
            <th>Date</th>
            <th>{dateLabel}</th>
            <th>Amount</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} className="doc-row" onClick={() => onSelect(doc.id)}>
              <td className="doc-number">{doc.number}</td>
              <td className="doc-client">{doc.to?.name || <span className="text-muted">—</span>}</td>
              <td className="doc-date">{formatDate(doc.createdAt)}</td>
              <td className="doc-date">{doc[dateField] ? formatDate(doc[dateField]) : <span className="text-muted">—</span>}</td>
              <td className="doc-amount">{formatCurrency(doc.total)}</td>
              <td>
                <span className={`badge badge-${doc.status}`}>{doc.status}</span>
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon doc-delete-btn"
                  onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
