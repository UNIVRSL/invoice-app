import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { createEmptyInvoice } from '../utils/defaults';
import { generateInvoiceNumber as genNum } from '../utils/helpers';
import DocumentList from '../components/DocumentList';
import DocumentForm from '../components/DocumentForm';
import DocumentPreview from '../components/DocumentPreview';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import './DocumentPage.css';

const STATUSES = ['draft', 'sent', 'paid'];

export default function InvoicesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, settings } = useAppContext();
  const [view, setView] = useState('list');       // list | preview | form
  const [selected, setSelected] = useState(null);  // invoice object for preview/edit
  const [deleteId, setDeleteId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  function handleNew() {
    const inv = createEmptyInvoice(settings);
    inv.number = genNum(invoices);
    setSelected(inv);
    setView('form');
  }

  function handleSelect(id) {
    const inv = invoices.find(i => i.id === id);
    if (inv) { setSelected({ ...inv }); setView('preview'); }
  }

  function handleEdit() {
    setView('form');
  }

  function handleSave(inv) {
    const exists = invoices.some(i => i.id === inv.id);
    if (exists) updateInvoice(inv.id, inv);
    else addInvoice(inv);
    setView('list');
    setSelected(null);
  }

  function handleCancel() {
    // If we came from preview, go back to preview; otherwise go to list
    if (view === 'form' && selected && invoices.some(i => i.id === selected.id)) {
      // Re-read the latest saved version for preview
      const latest = invoices.find(i => i.id === selected.id);
      setSelected({ ...latest });
      setView('preview');
    } else {
      setView('list');
      setSelected(null);
    }
  }

  function handleBack() {
    setView('list');
    setSelected(null);
  }

  function handleDeleteConfirm() {
    if (deleteId) { deleteInvoice(deleteId); setDeleteId(null); }
  }

  const filtered = invoices.filter(inv => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!inv.number?.toLowerCase().includes(term) && !inv.to?.name?.toLowerCase().includes(term)) return false;
    }
    if (statusFilter && inv.status !== statusFilter) return false;
    if (dateFrom && inv.createdAt < dateFrom) return false;
    if (dateTo && inv.createdAt > dateTo) return false;
    return true;
  });

  if (view === 'preview' && selected) {
    return (
      <DocumentPreview
        document={selected}
        type="invoice"
        onEdit={handleEdit}
        onBack={handleBack}
      />
    );
  }

  if (view === 'form' && selected) {
    return (
      <DocumentForm
        document={selected}
        type="invoice"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <button className="btn btn-primary new-btn" onClick={handleNew} title="New Invoice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Invoice
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
        type="invoice"
        onSelect={handleSelect}
        onDelete={id => setDeleteId(id)}
      />

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Invoice"
      >
        <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this invoice? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
