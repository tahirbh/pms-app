import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTenants, getProperties, getLedgersByTenant, deleteLedger, updateLedger } from '../utils/store';
import type { TenantContract, Property, ContractLedger } from '../utils/store';
import { ArrowLeft, CheckCircle2, Clock, CalendarDays, KeyRound, Building2, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ConfirmModal from '../components/ConfirmModal';
import DatePickerModule from "react-multi-date-picker";
const DatePicker = (DatePickerModule as any).default || DatePickerModule;
import arabic from "react-date-object/calendars/arabic";
import arabic_ar from "react-date-object/locales/arabic_ar";
import arabic_en from "react-date-object/locales/arabic_en";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import gregorian_ar from "react-date-object/locales/gregorian_ar";
import moment from 'moment-hijri';

const TenantLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currency, calendarMode, language } = useAppContext();
  const { t } = useTranslation();

  const [tenant, setTenant] = useState<TenantContract | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [ledgers, setLedgers] = useState<ContractLedger[]>([]);
  
  // State for the payment overlay
  const [payingLedger, setPayingLedger] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Online'>('Cash');
  const [paidDate, setPaidDate] = useState(calendarMode === 'hijri' ? moment().format('iYYYY/iMM/iDD') : new Date().toISOString().split('T')[0]);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'Pending' | 'Paid'>('Paid');

  // Batch states
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [batchMode, setBatchMode] = useState<'Cash' | 'Bank' | 'Online'>('Cash');
  const [batchDate, setBatchDate] = useState(calendarMode === 'hijri' ? moment().format('iYYYY/iMM/iDD') : new Date().toISOString().split('T')[0]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; ledgerId: string } | null>(null);

  const loadData = async () => {
    if (!id) return;
    const tenants = await getTenants();
    const tnt = tenants.find(x => x.id === id);
    if (tnt) {
      setTenant(tnt);
      const props = await getProperties();
      setProperty(props.find(p => p.id === tnt.propertyId) || null);
      setLedgers(await getLedgersByTenant(tnt.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const startEditing = (ledger: ContractLedger, forceStatus?: 'Paid' | 'Pending') => {
    setPayingLedger(ledger.id);
    setPaymentMode(ledger.paymentMode || 'Cash');
    setPaidDate(ledger.paidDate || (calendarMode === 'hijri' ? moment().format('iYYYY/iMM/iDD') : new Date().toISOString().split('T')[0]));
    setEditAmount(ledger.amount);
    setEditStatus(forceStatus || ledger.status);
  };

  const executePayment = async (ledgerId: string) => {
    await updateLedger(ledgerId, {
      status: editStatus,
      paymentMode,
      paidDate: editStatus === 'Paid' ? paidDate : null,
      amount: editAmount
    });
    setPayingLedger(null);
    await loadData();
  };

  const executeMarkAllPaid = async () => {
    const pending = ledgers.filter(l => l.status === 'Pending');
    if (pending.length === 0) return;

    for (const l of pending) {
      await updateLedger(l.id, {
        status: 'Paid',
        paymentMode: batchMode,
        paidDate: batchDate
      });
    }
    setIsMarkingAll(false);
    await loadData();
  };

  const executeDelete = (ledgerId: string) => {
    setDeleteModal({ isOpen: true, ledgerId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setDeleteModal(null);
    await deleteLedger(deleteModal.ledgerId);
    await loadData();
  };

  if (!tenant || !property) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>{t('loading_ledger')}</div>;

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <button className="btn" onClick={() => navigate(-1)} style={{ background: 'var(--glass-border)', padding: '0.5rem 1rem' }}>
          <ArrowLeft size={20}/> {t('back')}
        </button>
        <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>{t('payment_ledger')}</h2>
      </div>

      <div className="glass-panel" style={{ display: 'flex', gap: '3rem', padding: '2rem', marginBottom: '3rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} color="var(--primary)"/> {tenant.tenantName}
          </h3>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} /> {t('property_label')}: {property.name}
          </p>
        </div>
        <div style={{ borderLeft: '2px solid rgba(0,0,0,0.1)', paddingLeft: '3rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
            <CalendarDays size={18} /> {t('payment_plan_label')}: <strong>{tenant.paymentPlan}</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {t('contract_start')}: {tenant.startDate} — {t('contract_end')}: {tenant.endDate}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{t('automated_installments')}</h3>
        {ledgers.some(l => l.status === 'Pending') && (
          <button className="btn btn-primary" onClick={() => setIsMarkingAll(true)} style={{ background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} /> {t('mark_all_paid') || 'Mark All as Paid'}
          </button>
        )}
      </div>

      {isMarkingAll && (
        <div className="glass-panel animate-slide-in" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--success)' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)"/> {t('batch_payment_config') || 'Batch Payment Details'}
          </h4>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('payment_mode')}</label>
              <select className="input-field" value={batchMode} onChange={e => setBatchMode(e.target.value as any)}>
                <option value="Cash">{t('mode_cash')}</option>
                <option value="Bank">{t('mode_bank')}</option>
                <option value="Online">{t('mode_online')}</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('payment_date')}</label>
              <DatePicker
                value={batchDate}
                onChange={(dateObject: any) => setBatchDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" style={{ background: 'var(--success)', color: 'white', padding: '0.85rem 2rem' }} onClick={executeMarkAllPaid}>
                {t('confirm_all_paid') || 'Confirm All as Paid'}
              </button>
              <button className="btn" style={{ background: '#eee', padding: '0.85rem 1rem' }} onClick={() => setIsMarkingAll(false)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {ledgers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('no_ledgers_msg')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {ledgers.map((ledger, idx) => {
            const isPaid = ledger.status === 'Paid';
            const isPaying = payingLedger === ledger.id;

            return (
              <div key={ledger.id} className="glass-panel" style={{ 
                padding: '1.5rem',
                borderLeft: isPaid ? '6px solid var(--success)' : '6px solid orange',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', background: isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPaid ? <CheckCircle2 size={24} color="var(--success)"/> : <Clock size={24} color="orange"/>}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{t('installment_label')} {idx + 1}</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{t('due_date')}: {ledger.dueDate}</p>
                      {isPaid && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--success)' }}>{t('paid')}: {ledger.paidDate} — {ledger.paymentMode}</p>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      {Math.round(ledger.amount).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
                    </div>

                    {!isPaying && (
                      <>
                        {isPaid ? (
                          <button 
                            className="btn" 
                            style={{ padding: '0.5rem', background: 'var(--glass-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            onClick={() => startEditing(ledger)}
                            title={t('edit_ledger') || 'Edit Entry'}
                          >
                            <Edit3 size={16} />
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.5rem 1.5rem', background: 'var(--text-main)', borderRadius: '50px' }}
                            onClick={() => startEditing(ledger, 'Paid')}
                          >
                            {t('mark_as_paid')}
                          </button>
                        )}
                      </>
                    )}
                    
                    <button 
                      className="btn" 
                      style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      onClick={() => executeDelete(ledger.id)}
                      title={t('delete_invoice')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isPaying && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', animation: 'slideInUp 0.3s ease-out' }}>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('amount_label')}</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={editAmount} 
                        onChange={e => setEditAmount(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Status</label>
                      <select className="input-field" value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                        <option value="Pending">{t('status_pending') || 'Pending'}</option>
                        <option value="Paid">{t('status_paid') || 'Paid'}</option>
                      </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('payment_mode')}</label>
                      <select className="input-field" value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)}>
                        <option value="Cash">{t('mode_cash')}</option>
                        <option value="Bank">{t('mode_bank')}</option>
                        <option value="Online">{t('mode_online')}</option>
                      </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('payment_date')}</label>
                      <DatePicker
                        value={paidDate}
                        onChange={(dateObject: any) => setPaidDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
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
                    <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 100%' }}>
                      <button className="btn" style={{ background: 'var(--success)', color: 'white', padding: '0.85rem 2rem' }} onClick={() => executePayment(ledger.id)}>
                        {t('save') || 'Save Changes'}
                      </button>
                      <button className="btn" style={{ background: '#eee', padding: '0.85rem 1rem' }} onClick={() => setPayingLedger(null)}>
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteModal?.isOpen}
        title={t('delete_invoice')}
        message={t('confirm_delete_ledger')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(null)}
        variant="danger"
      />
    </div>
  );
};

export default TenantLedger;
