import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, CheckCircle2, Edit, Trash2, Home, Download, Upload } from 'lucide-react';
import { getProperties, saveProperty, updateProperty, deleteProperty, importProperties } from '../utils/store';
import type { Property } from '../utils/store';
import { useAppContext } from '../context/AppContext';
import { exportCSV, parseCSV, readFileAsText } from '../utils/exportUtils';

const Properties: React.FC = () => {
  const { t } = useTranslation();
  const { currency } = useAppContext();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const loadData = async () => {
    const data = await getProperties();
    setProperties(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenForm = (prop?: Property) => {
    if (prop) {
      setEditingId(prop.id);
      setName(prop.name);
      setAddress(prop.address);
      setAnnualRent(prop.annualRent.toString());
      setImageUrl(prop.imageUrl || '');
    } else {
      setEditingId(null);
      setName('');
      setAddress('');
      setAnnualRent('');
      setImageUrl('');
    }
    setShowForm(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !annualRent) return;
    
    if (editingId) {
      const updated: Property = {
        id: editingId,
        name,
        address,
        annualRent: parseFloat(annualRent),
        imageUrl
      };
      await updateProperty(updated);
    } else {
      await saveProperty({
        name,
        address,
        annualRent: parseFloat(annualRent),
        imageUrl
      });
    }
    
    await loadData();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm_delete') || 'Are you sure?')) {
      const ok = await deleteProperty(id);
      if (!ok) alert('Failed to delete Property. Check dependencies.');
      await loadData();
    }
  };

  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => exportCSV(properties, 'properties.csv');

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    const rows = parseCSV(text).map(r => ({
      name: r.name || '',
      address: r.address || '',
      annualRent: parseFloat(r.annualRent) || 0,
      imageUrl: r.imageUrl || '',
    }));
    const count = await importProperties(rows);
    alert(`✅ Imported ${count} properties!`);
    await loadData();
    e.target.value = '';
  };

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Building2 /> {t('properties')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn" onClick={handleExport} style={{ background: 'var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn" onClick={() => importRef.current?.click()} style={{ background: 'var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={16} /> Import CSV
          </button>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={20} />
            {t('add_property')}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSaveProperty} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255, 255, 255, 0.4)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {editingId ? 'Edit Property Details' : 'New Property Details'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input 
              className="input-field" 
              placeholder="Property Name" 
              value={name} onChange={e => setName(e.target.value)} required 
            />
            <input 
              className="input-field" type="number" 
              placeholder={`Annual Rent (${currency})`} 
              value={annualRent} onChange={e => setAnnualRent(e.target.value)} required 
            />
            <input 
              className="input-field" 
              placeholder="Address" 
              value={address} onChange={e => setAddress(e.target.value)} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Property Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="input-field"
                style={{ padding: '0.4rem' }}
              />
              {imageUrl && <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)' }}>
              <CheckCircle2 size={20} /> {editingId ? 'Update Property' : 'Save Property'}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {properties.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No properties created yet. Add one to get started.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {properties.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.3)', transition: 'var(--transition)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0' }}>
                    <Home size={20} color="var(--primary)"/> {p.name}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleOpenForm(p)} className="btn" style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white' }}>
                      <Edit size={16} />
                    </button>
                    <button type="button" onClick={() => handleDelete(p.id)} className="btn" style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {p.imageUrl && (
                  <div style={{ height: '200px', width: '100%', backgroundColor: '#e2e8f0', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.address || 'No address provided'}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.875rem' }}>{t('annual_rent')}:</span>
                  <span style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-main)' }}>
                    {p.annualRent.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;
