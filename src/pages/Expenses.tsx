import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Receipt, Edit, Trash2, CheckCircle2, Download, Upload } from 'lucide-react';
import { getExpenses, saveExpense, updateExpense, deleteExpense, importExpenses } from '../utils/store';
import type { Expense } from '../utils/store';
import { useAppContext } from '../context/AppContext';
import { exportCSV, parseCSV, readFileAsText } from '../utils/exportUtils';
import ConfirmModal from '../components/ConfirmModal';
import DatePickerModule from "react-multi-date-picker";
const DatePicker = (DatePickerModule as any).default || DatePickerModule;
import arabic from "react-date-object/calendars/arabic";
import arabic_ar from "react-date-object/locales/arabic_ar";
import arabic_en from "react-date-object/locales/arabic_en";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import gregorian_ar from "react-date-object/locales/gregorian_ar";

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const { currency, calendarMode, language } = useAppContext();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string } | null>(null);
  
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Online'>('Cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const loadData = async () => {
    setExpenses(await getExpenses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = (exp?: Expense) => {
    if(exp) {
      setEditingId(exp.id);
      setCategory(exp.category);
      setAmount(exp.amount.toString());
      setPaymentMode(exp.paymentMode);
      setDescription(exp.description);
      setDate(exp.date);
    } else {
      setEditingId(null);
      setCategory('');
      setAmount('');
      setPaymentMode('Cash');
      setDescription('');
      setDate('');
    }
    setShowForm(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !date) return;
    
    if (editingId) {
      const existing = expenses.find(exp => exp.id === editingId);
      if(existing) {
        const updated: Expense = {
          ...existing,
          category,
          amount: parseFloat(amount),
          paymentMode,
          description,
          date
        };
        await updateExpense(updated);
      }
    } else {
      await saveExpense({
        category,
        amount: parseFloat(amount),
        paymentMode,
        description,
        date
      });
    }
    
    await loadData();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal) return;
    setConfirmModal(null);
    const ok = await deleteExpense(confirmModal.id);
    if (!ok) alert(t('failed_delete_expense'));
    await loadData();
  };

  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    const rows = parseCSV(text).map(r => ({
      category: r.category || 'Other',
      amount: parseFloat(r.amount) || 0,
      paymentMode: (r.paymentMode as any) || 'Cash',
      date: r.date || '',
      description: r.description || '',
    }));
    const count = await importExpenses(rows);
    alert(`✅ ${count} ${t('imported_msg')}`);
    await loadData();
    e.target.value = '';
  };

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Receipt /> {t('expenses_management')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn action-btn" onClick={() => exportCSV(expenses, 'expenses.csv')} style={{ background: 'var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} title="Export CSV">
            <Download size={16} /> <span className="btn-text">Export CSV</span>
          </button>
          <button className="btn action-btn" onClick={() => importRef.current?.click()} style={{ background: 'var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} title="Import CSV">
            <Upload size={16} /> <span className="btn-text">Import CSV</span>
          </button>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-primary action-btn" onClick={() => handleOpenForm()} title={t('add_expense')}>
            <Plus size={20} />
            <span className="btn-text">{t('add_expense')}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSaveExpense} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {editingId ? t('edit_expense') : t('log_expense')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">{t('select_category')}</option>
              <option value="Security Man Salary">{t('cat_salary')}</option>
              <option value="Maintenance">{t('cat_maintenance')}</option>
              <option value="Utility Bill - Water">{t('cat_util_water')}</option>
              <option value="Utility Bill - Electricity">{t('cat_util_elec')}</option>
              <option value="Utility Bill - Internet">{t('cat_util_net')}</option>
              <option value="Utility Bill - Others">{t('cat_util_other')}</option>
              <option value="Taxes">{t('cat_taxes')}</option>
              <option value="Transfer to Owner">{t('cat_transfer_owner')}</option>
              <option value="Other">{t('cat_other')}</option>
            </select>
            <input className="input-field" type="number" placeholder={`${t('amount_sar')} (${currency})`} value={amount} onChange={e => setAmount(e.target.value)} required />
            <select className="input-field" value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} required>
              <option value="Cash">{t('mode_cash')}</option>
              <option value="Bank">{t('mode_bank')}</option>
              <option value="Online">{t('mode_online')}</option>
            </select>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('date_label')} ({calendarMode})</label>
              <DatePicker
                value={date}
                onChange={(dateObject: any) => setDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
                calendar={calendarMode === 'hijri' ? arabic : gregorian}
                locale={calendarMode === 'hijri' ? (language === 'ar' ? arabic_ar : arabic_en) : (language === 'ar' ? gregorian_ar : gregorian_en)}
                calendarPosition="bottom-right"
                inputClass="input-field"
                containerStyle={{ width: '100%' }}
                format="YYYY/MM/DD"
                zIndex={9999}
                portal
              />
            </div>
          </div>
          <input className="input-field" placeholder={t('description_optional')} value={description} onChange={e => setDescription(e.target.value)} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)' }}>
              <CheckCircle2 size={20} /> {editingId ? t('update_expense') : t('save_expense')}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('no_expenses')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.map(exp => (
            <div key={exp.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0' }}>
                  <Receipt size={20} color="var(--primary)"/> {exp.category === 'Transfer to Owner' ? t('cat_transfer_owner') : exp.category}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => handleOpenForm(exp)} className="btn" style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white' }}>
                    <Edit size={16} />
                  </button>
                  <button type="button" onClick={() => handleDelete(exp.id)} className="btn" style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>{exp.description || t('no_description')}</p>
                <div style={{ fontSize: '0.875rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span><strong style={{ opacity: 0.8 }}>{t('payment_mode')}:</strong> {exp.paymentMode}</span>
                  <span><strong style={{ opacity: 0.8 }}>{t('date_label')}:</strong> {exp.date}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                  - {Math.round(exp.amount).toLocaleString()} {currency}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmModal?.isOpen}
        title={t('confirm_delete') || 'Confirm Deletion'}
        message={t('confirm_delete_expense_msg') || 'Are you sure you want to delete this expense entry?'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal(null)}
        variant="danger"
      />
    </div>
  );
};

export default Expenses;
