import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import { defaultTemplates } from '../utils/defaults';
import TemplateEditor from '../components/TemplateEditor';
import TemplatePreview from '../components/TemplatePreview';
import Modal from '../components/Modal';
import './TemplatesPage.css';

const BLANK_SECTIONS = [
  { id: 'header',    label: 'Header / Business Name', enabled: true,  order: 0 },
  { id: 'from',      label: 'From (Business Info)',   enabled: true,  order: 1 },
  { id: 'to',        label: 'To (Client Info)',        enabled: true,  order: 2 },
  { id: 'meta',      label: 'Document Details',        enabled: true,  order: 3 },
  { id: 'lineItems', label: 'Line Items Table',        enabled: true,  order: 4 },
  { id: 'totals',    label: 'Subtotal / Tax / Total',  enabled: true,  order: 5 },
  { id: 'notes',     label: 'Notes',                   enabled: true,  order: 6 },
  { id: 'terms',     label: 'Terms & Conditions',      enabled: false, order: 7 },
  { id: 'payment',   label: 'Payment Information',     enabled: false, order: 8 },
];

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useAppContext();
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [previewSections, setPreviewSections] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  function handleNew() {
    setEditing({
      id: generateId(),
      name: 'New Template',
      type: 'both',
      isDefault: false,
      sections: BLANK_SECTIONS.map(s => ({ ...s })),
    });
    setPreviewSections(null);
    setView('editor');
  }

  function handleEdit(template) {
    setEditing({ ...template, sections: template.sections.map(s => ({ ...s })) });
    setPreviewSections(null);
    setView('editor');
  }

  function handleSave(tmpl) {
    if (tmpl.isDefault) {
      // Save as copy
      const copy = { ...tmpl, id: generateId(), name: tmpl.name + ' (Copy)', isDefault: false };
      addTemplate(copy);
    } else {
      const exists = templates.some(t => t.id === tmpl.id);
      if (exists) updateTemplate(tmpl.id, tmpl);
      else addTemplate(tmpl);
    }
    setView('list');
    setEditing(null);
  }

  function handleCancel() {
    setView('list');
    setEditing(null);
    setPreviewSections(null);
  }

  function handleDeleteConfirm() {
    if (deleteId) { deleteTemplate(deleteId); setDeleteId(null); }
  }

  const livePreviewTemplate = editing && previewSections
    ? { ...editing, sections: previewSections }
    : editing;

  if (view === 'editor' && editing) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">
            {editing.isDefault ? `Editing: ${editing.name}` : editing.name}
          </h1>
        </div>
        <div className="template-editor-layout">
          <div className="template-editor-panel">
            <TemplateEditor
              template={editing}
              onSave={handleSave}
              onCancel={handleCancel}
              onSectionChange={sections => setPreviewSections(sections)}
            />
          </div>
          <div className="template-preview-panel">
            <TemplatePreview template={livePreviewTemplate} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Templates</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Template
        </button>
      </div>

      <div className="template-grid">
        {templates.map(tmpl => (
          <div key={tmpl.id} className="template-card" onClick={() => handleEdit(tmpl)}>
            <div className="template-card-header">
              <span className="template-card-name">{tmpl.name}</span>
              {tmpl.isDefault
                ? <span className="badge badge-sent">Default</span>
                : <span className="badge badge-draft">Custom</span>
              }
            </div>
            <div className="template-card-preview">
              <TemplatePreview template={tmpl} />
            </div>
            <div className="template-card-footer">
              <span className="template-card-sections">
                {tmpl.sections.filter(s => s.enabled).length} of {tmpl.sections.length} sections enabled
              </span>
              {!tmpl.isDefault && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={e => { e.stopPropagation(); setDeleteId(tmpl.id); }}
                  title="Delete template"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Template"
      >
        <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this template?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
