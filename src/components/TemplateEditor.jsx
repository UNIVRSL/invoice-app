import { useState } from 'react';
import './TemplateEditor.css';

const UpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18,15 12,9 6,15"/>
  </svg>
);
const DownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

export default function TemplateEditor({ template, onSave, onCancel, onSectionChange }) {
  const [name, setName] = useState(template.name);
  const [sections, setSections] = useState(
    [...template.sections].sort((a, b) => a.order - b.order)
  );

  function toggle(id) {
    const updated = sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setSections(updated);
    onSectionChange && onSectionChange(updated);
  }

  function move(id, dir) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    // Swap orders
    const updated = sorted.map((s, i) => {
      if (i === idx) return { ...s, order: sorted[targetIdx].order };
      if (i === targetIdx) return { ...s, order: sorted[idx].order };
      return s;
    });
    const resorted = updated.sort((a, b) => a.order - b.order);
    setSections(resorted);
    onSectionChange && onSectionChange(resorted);
  }

  function handleSave() {
    onSave({ ...template, name, sections });
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="template-editor">
      <div className="template-editor-header">
        <button type="button" className="btn btn-ghost back-btn" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
          </svg>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {template.isDefault ? 'Save as Copy' : 'Save Template'}
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Custom Template"
          readOnly={template.isDefault}
          style={template.isDefault ? { background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' } : {}}
        />
        {template.isDefault && (
          <span className="template-editor-default-note">Default templates are saved as a copy when edited</span>
        )}
      </div>

      <div className="form-label" style={{ marginBottom: 8 }}>Sections</div>
      <div className="section-list">
        {sorted.map((section, idx) => (
          <div key={section.id} className={`section-row${section.enabled ? '' : ' section-row--disabled'}`}>
            <label className="section-toggle" title="Toggle section">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={() => toggle(section.id)}
              />
              <span className="section-toggle-track">
                <span className="section-toggle-thumb" />
              </span>
            </label>
            <span className="section-label">{section.label}</span>
            <div className="section-controls">
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => move(section.id, 'up')}
                disabled={idx === 0}
                title="Move up"
              >
                <UpIcon />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => move(section.id, 'down')}
                disabled={idx === sorted.length - 1}
                title="Move down"
              >
                <DownIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
