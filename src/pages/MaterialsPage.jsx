import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId, formatCurrency } from '../utils/helpers';
import { savePhoto, getPhotos, deletePhoto } from '../hooks/usePhotoStore';
import Modal from '../components/Modal';
import './MaterialsPage.css';

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

const EMPTY_FORM = { name: '', description: '', price: '', photoId: null, photoPreview: null };

export default function MaterialsPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useAppContext();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [photoMap, setPhotoMap] = useState({});

  // Resolve all material photos from IDB; also handle legacy `photo` dataUrl fields
  useEffect(() => {
    async function resolve() {
      const map = {};

      // Migrate legacy materials that still have `photo` dataUrl stored in localStorage
      const legacyMats = materials.filter(m => m.photo && !m.photoId);
      for (const m of legacyMats) {
        const photoId = m.id; // reuse material ID as photo ID
        await savePhoto(photoId, m.photo);
        updateMaterial(m.id, { photoId, photo: undefined });
        map[photoId] = m.photo;
      }

      // Resolve IDB-stored photos for current materials
      const ids = materials.filter(m => m.photoId).map(m => m.photoId);
      if (ids.length) {
        const resolved = await getPhotos(ids);
        Object.assign(map, resolved);
      }

      setPhotoMap(map);
    }
    resolve().catch(console.error);
  }, [materials.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(material) {
    setEditingId(material.id);
    // Support legacy material.photo for display while migration runs
    const preview = material.photoId
      ? (photoMap[material.photoId] || null)
      : (material.photo || null);
    setForm({
      name: material.name || '',
      description: material.description || '',
      price: material.price !== undefined ? String(material.price) : '',
      photoId: material.photoId || null,
      photoPreview: preview,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressImage(file);
      const photoId = generateId();
      await savePhoto(photoId, dataUrl);
      setPhotoMap(prev => ({ ...prev, [photoId]: dataUrl }));
      setForm(prev => ({ ...prev, photoId, photoPreview: dataUrl }));
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  function removePhoto() {
    // Don't delete from IDB yet — wait until save (user might cancel)
    setForm(prev => ({ ...prev, photoId: null, photoPreview: null }));
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price !== '' ? parseFloat(form.price) : null,
      photoId: form.photoId || null,
    };

    if (editingId) {
      const oldMaterial = materials.find(m => m.id === editingId);
      // Clean up old photo from IDB if it changed
      if (oldMaterial?.photoId && oldMaterial.photoId !== form.photoId) {
        deletePhoto(oldMaterial.photoId).catch(console.error);
        setPhotoMap(prev => { const next = { ...prev }; delete next[oldMaterial.photoId]; return next; });
      }
      updateMaterial(editingId, payload);
    } else {
      addMaterial({ ...payload, id: generateId() });
    }
    closeModal();
  }

  function handleDeleteConfirm() {
    if (deleteId) { deleteMaterial(deleteId); setDeleteId(null); }
  }

  const filtered = materials.filter(m => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="materials-page">
      <div className="page-header">
        <h1 className="page-title">Materials</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Material
        </button>
      </div>

      {/* Search */}
      <div className="materials-search-wrap">
        <span className="materials-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          className="materials-search"
          placeholder="Search materials..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <p>{search ? 'No materials match your search.' : 'No materials yet. Add your first one.'}</p>
        </div>
      ) : (
        <div className="materials-grid">
          {filtered.map(material => {
            const photoSrc = material.photoId ? photoMap[material.photoId] : material.photo;
            return (
              <div key={material.id} className="material-card" onClick={() => openEdit(material)}>
                {photoSrc ? (
                  <div
                    className="material-card-photo"
                    onClick={e => { e.stopPropagation(); setLightbox(photoSrc); }}
                  >
                    <img src={photoSrc} alt={material.name} />
                  </div>
                ) : (
                  <div className="material-card-photo material-card-photo--empty">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                )}
                <div className="material-card-body">
                  <div className="material-card-name">{material.name}</div>
                  {material.description && (
                    <div className="material-card-desc">{material.description}</div>
                  )}
                  {material.price !== null && material.price !== undefined && (
                    <div className="material-card-price">{formatCurrency(material.price)}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon material-delete-btn"
                  onClick={e => { e.stopPropagation(); setDeleteId(material.id); }}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
                    <path d="M10,11v6"/><path d="M14,11v6"/>
                    <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Material' : 'New Material'}
      >
        <form onSubmit={handleSave} className="material-form">
          {/* Photo upload */}
          <div className="material-form-photo-wrap">
            {form.photoPreview ? (
              <div className="material-form-photo-preview">
                <img src={form.photoPreview} alt="Material" />
                <button type="button" className="material-form-photo-remove" onClick={removePhoto} title="Remove photo">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <label className={`material-form-photo-upload${uploadingPhoto ? ' material-form-photo-upload--loading' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
                <span>{uploadingPhoto ? 'Processing...' : 'Add Photo'}</span>
              </label>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Name <span className="material-required">*</span></label>
            <input
              type="text"
              placeholder="e.g. PVC Pipe 1/2 inch"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description <span className="material-optional">(optional)</span></label>
            <textarea
              placeholder="Brand, size, specs..."
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              style={{ minHeight: 64 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price <span className="material-optional">(optional)</span></label>
            <div className="material-price-wrap">
              <span className="material-price-symbol">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={e => handleChange('price', e.target.value)}
                className="material-price-input"
              />
            </div>
          </div>

          <div className="material-form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save Changes' : 'Add Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Material"
      >
        <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this material?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="lightbox-img" alt="Material" onClick={e => e.stopPropagation()} />
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
