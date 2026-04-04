import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import './SettingsPage.css';

export default function SettingsPage() {
  const { settings, updateSettings } = useAppContext();
  const [local, setLocal] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function handleChange(field, value) {
    setLocal(prev => ({ ...prev, [field]: value }));
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
