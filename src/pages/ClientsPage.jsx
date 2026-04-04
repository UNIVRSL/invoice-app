import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import Modal from '../components/Modal';
import './ClientsPage.css';

const EMPTY_CLIENT = { name: '', company: '', email: '', phone: '', address: '' };

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // null = new, obj = existing
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [deleteId, setDeleteId] = useState(null);

  function openNew() {
    setEditingClient(null);
    setForm(EMPTY_CLIENT);
    setModalOpen(true);
  }

  function openEdit(client) {
    setEditingClient(client);
    setForm({ ...client });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingClient(null);
    setForm(EMPTY_CLIENT);
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingClient) {
      updateClient(editingClient.id, form);
    } else {
      addClient({ ...form, id: generateId() });
    }
    closeModal();
  }

  function handleDeleteConfirm() {
    if (deleteId) { deleteClient(deleteId); setDeleteId(null); }
  }

  const filtered = clients.filter(c => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Client
        </button>
      </div>

      {/* Search */}
      <div className="clients-search-wrap">
        <span className="clients-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          className="clients-search"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>{search ? 'No clients match your search.' : 'No clients yet. Add your first one.'}</p>
        </div>
      ) : (
        <div className="clients-grid">
          {filtered.map(client => (
            <div key={client.id} className="client-card" onClick={() => openEdit(client)}>
              <div className="client-card-avatar">
                {(client.name || '?')[0].toUpperCase()}
              </div>
              <div className="client-card-info">
                <div className="client-card-name">{client.name}</div>
                {client.company && <div className="client-card-company">{client.company}</div>}
                {client.email && <div className="client-card-detail">{client.email}</div>}
                {client.phone && <div className="client-card-detail">{client.phone}</div>}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon client-delete-btn"
                onClick={e => { e.stopPropagation(); setDeleteId(client.id); }}
                title="Delete client"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
                  <path d="M10,11v6"/><path d="M14,11v6"/>
                  <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingClient ? 'Edit Client' : 'New Client'}
      >
        <form onSubmit={handleSave} className="client-form">
          <div className="form-group">
            <label className="form-label">Name <span className="client-required">*</span></label>
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={e => handleFormChange('name', e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input
              type="text"
              placeholder="Company name"
              value={form.company}
              onChange={e => handleFormChange('company', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => handleFormChange('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={e => handleFormChange('phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              placeholder="Street, City, State ZIP"
              value={form.address}
              onChange={e => handleFormChange('address', e.target.value)}
              style={{ minHeight: 64 }}
            />
          </div>
          <div className="client-form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingClient ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Client"
      >
        <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          Are you sure you want to remove this client?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
