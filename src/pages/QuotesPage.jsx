import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { createEmptyQuote } from '../utils/defaults';
import { generateQuoteNumber } from '../utils/helpers';
import DocumentList from '../components/DocumentList';
import DocumentForm from '../components/DocumentForm';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import './DocumentPage.css';

const STATUSES = ['draft', 'sent', 'accepted', 'declined'];

export default function QuotesPage() {
  const { quotes, addQuote, updateQuote, deleteQuote, settings } = useAppContext();
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  function handleNew() {
    const q = createEmptyQuote(settings);
    q.number = generateQuoteNumber(quotes);
    setEditing(q);
    setView('form');
  }

  function handleSelect(id) {
    const q = quotes.find(q => q.id === id);
    if (q) { setEditing({ ...q }); setView('form'); }
  }

  function handleSave(q) {
    const exists = quotes.some(item => item.id === q.id);
    if (exists) updateQuote(q.id, q);
    else addQuote(q);
    setView('list');
    setEditing(null);
  }

  function handleCancel() {
    setView('list');
    setEditing(null);
  }

  function handleDeleteConfirm() {
    if (deleteId) { deleteQuote(deleteId); setDeleteId(null); }
  }

  const filtered = quotes.filter(q => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!q.number?.toLowerCase().includes(term) && !q.to?.name?.toLowerCase().includes(term)) return false;
    }
    if (statusFilter && q.status !== statusFilter) return false;
    if (dateFrom && q.createdAt < dateFrom) return false;
    if (dateTo && q.createdAt > dateTo) return false;
    return true;
  });

  if (view === 'form' && editing) {
    return (
      <DocumentForm
        document={editing}
        type="quote"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quotes</h1>
        <button className="btn btn-primary new-btn" onClick={handleNew} title="New Quote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Quote
        </button>
      </div>

      <SearchFilter
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        statusOptions={STATUSES}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
      />

      <DocumentList
        documents={filtered}
        type="quote"
        onSelect={handleSelect}
        onDelete={id => setDeleteId(id)}
      />

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Quote"
      >
        <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this quote? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
