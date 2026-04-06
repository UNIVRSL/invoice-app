import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import { savePhoto, getPhoto, deletePhoto } from '../hooks/usePhotoStore';
import './SettingsPage.css';

const MAX_PX = 600;
const QUALITY = 0.85;

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
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const { settings, updateSettings } = useAppContext();
  const [local, setLocal] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings.logoPhotoId) {
      getPhoto(settings.logoPhotoId).then(data => {
        if (data) setLogoPreview(data);
      }).catch(console.error);
    }
  }, [settings.logoPhotoId]);

  function handleChange(field, value) {
    setLocal(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      const photoId = generateId();
      await savePhoto(photoId, dataUrl);
      // Delete old logo from IDB if replacing
      if (local.logoPhotoId) {
        deletePhoto(local.logoPhotoId).catch(console.error);
      }
      setLocal(prev => ({ ...prev, logoPhotoId: photoId }));
      setLogoPreview(dataUrl);
      setSaved(false);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleLogoRemove() {
    if (local.logoPhotoId) {
      deletePhoto(local.logoPhotoId).catch(console.error);
    }
    setLocal(prev => ({ ...prev, logoPhotoId: null }));
    setLogoPreview(null);
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    updateSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="settings-card">
        <div className="settings-section-header">
          <h2>Business Information</h2>
          <p className="settings-note">All fields are optional. Saved info auto-fills new invoices and quotes.</p>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          {/* Logo */}
          <div className="settings-row">
            <div className="form-group">
              <label className="form-label">Business Logo</label>
              <p className="settings-logo-hint">Appears on invoice previews and PDFs.</p>
              <div className="settings-logo-area">
                {logoPreview ? (
                  <div className="settings-logo-preview">
                    <img src={logoPreview} alt="Logo" />
                    <button type="button" className="settings-logo-remove" onClick={handleLogoRemove} title="Remove logo">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className={`settings-logo-upload${uploading ? ' settings-logo-upload--loading' : ''}`}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploading} />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span>{uploading ? 'Processing...' : 'Upload Logo'}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="settings-row">
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={local.businessName}
                onChange={e => handleChange('businessName', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row settings-row--two">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                placeholder="John"
                value={local.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                value={local.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={local.phone}
                onChange={e => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row settings-row--two">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                placeholder="New York"
                value={local.city}
                onChange={e => handleChange('city', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                placeholder="NY"
                value={local.state}
                onChange={e => handleChange('state', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary">Save Settings</button>
            {saved && <span className="settings-saved-msg">Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
