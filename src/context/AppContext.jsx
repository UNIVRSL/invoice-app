import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultSettings, defaultTemplates } from '../utils/defaults';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('invoiceApp_settings', defaultSettings);
  const [invoices, setInvoices] = useLocalStorage('invoiceApp_invoices', []);
  const [quotes, setQuotes] = useLocalStorage('invoiceApp_quotes', []);
  const [templates, setTemplates] = useLocalStorage('invoiceApp_templates', defaultTemplates);
  const [clients, setClients] = useLocalStorage('invoiceApp_clients', []);
  const [materials, setMaterials] = useLocalStorage('invoiceApp_materials', []);

  // Settings
  function updateSettings(newSettings) {
    setSettings(newSettings);
  }

  // Invoices
  function addInvoice(invoice) {
    setInvoices(prev => [invoice, ...prev]);
  }
  function updateInvoice(id, updatedFields) {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updatedFields } : inv));
  }
  function deleteInvoice(id) {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }

  // Quotes
  function addQuote(quote) {
    setQuotes(prev => [quote, ...prev]);
  }
  function updateQuote(id, updatedFields) {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updatedFields } : q));
  }
  function deleteQuote(id) {
    setQuotes(prev => prev.filter(q => q.id !== id));
  }

  // Clients
  function addClient(client) {
    setClients(prev => [client, ...prev]);
  }
  function updateClient(id, updatedFields) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  }
  function deleteClient(id) {
    setClients(prev => prev.filter(c => c.id !== id));
  }

  // Materials
  function addMaterial(material) {
    setMaterials(prev => [material, ...prev]);
  }
  function updateMaterial(id, updatedFields) {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
  }
  function deleteMaterial(id) {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }

  // Templates
  function addTemplate(template) {
    setTemplates(prev => [...prev, template]);
  }
  function updateTemplate(id, updatedFields) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  }
  function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  return (
    <AppContext.Provider value={{
      settings, updateSettings,
      invoices, addInvoice, updateInvoice, deleteInvoice,
      quotes, addQuote, updateQuote, deleteQuote,
      templates, addTemplate, updateTemplate, deleteTemplate,
      clients, addClient, updateClient, deleteClient,
      materials, addMaterial, updateMaterial, deleteMaterial,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
