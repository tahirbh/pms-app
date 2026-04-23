import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Edit, Trash2, Printer, Receipt, UserCircle, Download, ArrowUpCircle } from 'lucide-react';
import { getTenants, getProperties, saveTenant, updateTenant, deleteTenant, endTenantContract, saveLedgers, deleteLedgersByTenant } from '../utils/store';
import type { TenantContract, Property } from '../utils/store';
import { calculateRent } from '../utils/rentCalculator';
import DatePickerModule from "react-multi-date-picker";
const DatePicker = (DatePickerModule as any).default || DatePickerModule;
import arabic from "react-date-object/calendars/arabic";
import arabic_ar from "react-date-object/locales/arabic_ar";
import arabic_en from "react-date-object/locales/arabic_en";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import gregorian_ar from "react-date-object/locales/gregorian_ar";
import { generateLedgerSchedules } from '../utils/ledgerGenerator';
import type { RentCalculationResult } from '../utils/rentCalculator';
import { useAppContext } from '../context/AppContext';
import { exportCSV } from '../utils/exportUtils';
import ExtendContractModal from '../components/ExtendContractModal';
import ConfirmModal from '../components/ConfirmModal';
import { updateProperty } from '../utils/store';


const Tenants: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currency, calendarMode, language } = useAppContext();
  
  const [tenants, setTenants] = useState<TenantContract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [extendingContract, setExtendingContract] = useState<{ tenant: TenantContract; property: Property } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  
  const [tenantName, setTenantName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<'Monthly' | '3 Month' | '6 Month' | 'Yearly'>('Monthly');
  const [iqamaNumber, setIqamaNumber] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [leaveDateInput, setLeaveDateInput] = useState<{ [id: string]: string }>({});
  const [calcResults, setCalcResults] = useState<{ [id: string]: RentCalculationResult }>({});

  const loadData = async () => {
    setTenants(await getTenants());
    setProperties(await getProperties());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = (tnt?: TenantContract) => {
    if (tnt) {
      setEditingId(tnt.id);
      setTenantName(tnt.tenantName);
      setPropertyId(tnt.propertyId);
      setStartDate(tnt.startDate);
      setEndDate(tnt.endDate);
      setPaymentPlan(tnt.paymentPlan || 'Monthly');
      setIqamaNumber(tnt.iqamaNumber || '');
      setSponsorName(tnt.sponsorName || '');
      setMobileNumber(tnt.mobileNumber || '');
    } else {
      setEditingId(null);
      setTenantName('');
      setPropertyId('');
      setStartDate('');
      setEndDate('');
      setPaymentPlan('Monthly');
      setIqamaNumber('');
      setSponsorName('');
      setMobileNumber('');
    }
    setShowForm(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !propertyId || !startDate || !endDate) return;
    
    if (editingId) {
      const existing = tenants.find(tnt => tnt.id === editingId);
      if (existing) {
        const updated: TenantContract = {
          ...existing,
          tenantName,
          propertyId,
          startDate,
          endDate,
          calendarMode,
          paymentPlan,
          iqamaNumber,
          sponsorName,
          mobileNumber,
          annualRent: existing.annualRent || properties.find(p => p.id === propertyId)?.annualRent
        };
        await updateTenant(updated);
        
        await deleteLedgersByTenant(editingId);
        const prop = properties.find(p => p.id === propertyId);
        if (prop) {
           const ledgers = generateLedgerSchedules(
             editingId, 
             prop.annualRent, 
             startDate, 
             endDate, 
             paymentPlan, 
             calendarMode
           );
           await saveLedgers(ledgers);
        }
      }
    } else {
      const newTenant = await saveTenant({
        tenantName,
        propertyId,
        startDate,
        endDate,
        calendarMode,
        paymentPlan,
        iqamaNumber,
        sponsorName,
        mobileNumber,
        annualRent: properties.find(p => p.id === propertyId)?.annualRent,
        isActive: true
      });
      
      if (newTenant) {
        const prop = properties.find(p => p.id === propertyId);
        if (prop) {
           const ledgers = generateLedgerSchedules(
             newTenant.id, 
             prop.annualRent, 
             startDate, 
             endDate, 
             paymentPlan, 
             calendarMode
           );
           await saveLedgers(ledgers);
        }
      }
    }
    
    await loadData();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirm_delete') || 'Confirm Deletion',
      message: t('confirm_delete_msg') || 'Are you sure you want to delete this tenant?',
      onConfirm: async () => {
        setConfirmModal(null);
        const success = await deleteTenant(id);
        if (!success) alert(t('failed_delete_tenant'));
        await loadData();
      }
    });
  };

  const handleCalculateRent = (tnt: TenantContract) => {
    const leaveStr = leaveDateInput[tnt.id];
    if (!leaveStr) return;
    
    const prop = properties.find(p => p.id === tnt.propertyId);
    if (!prop) return;

    try {
      const result = calculateRent(prop.annualRent, tnt.startDate, leaveStr, tnt.calendarMode);
      setCalcResults({ ...calcResults, [tnt.id]: result });
    } catch (e) {
      alert(t('invalid_date_format'));
    }
  };

  const handleEndContract = async (tnt: TenantContract) => {
    const leaveStr = leaveDateInput[tnt.id];
    if (!leaveStr) return;
    
    if (window.confirm(t('confirm_delete'))) {
      await endTenantContract(tnt.id, leaveStr);
      // Refresh data
      const updated = await getTenants();
      setTenants(updated);
    }
  };


  const handleExtendContract = (tnt: TenantContract) => {
    const prop = properties.find(p => p.id === tnt.propertyId);
    if (!prop) return;
    setExtendingContract({ tenant: tnt, property: prop });
  };

  const handleConfirmExtension = async (data: { 
    newRent: number; 
    updateMaster: boolean; 
    paymentPlan: 'Monthly' | '3 Month' | '6 Month' | 'Yearly';
    startDate: string;
    endDate: string;
  }) => {
    if (!extendingContract) return;
    const { tenant: tnt, property: prop } = extendingContract;
    
    setExtendingContract(null);
    try {
      // 1. Update Property Master if requested
      if (data.updateMaster) {
        await updateProperty({ ...prop, annualRent: data.newRent });
      }

      // 2. Save new Tenant contract
      const newTenant = await saveTenant({
        tenantName: tnt.tenantName,
        propertyId: tnt.propertyId,
        startDate: data.startDate,
        endDate: data.endDate,
        calendarMode: tnt.calendarMode,
        paymentPlan: data.paymentPlan,
        iqamaNumber: tnt.iqamaNumber || '',
        sponsorName: tnt.sponsorName || '',
        mobileNumber: tnt.mobileNumber || '',
        annualRent: data.newRent,
        isActive: true
      });

      if (newTenant) {
        // 3. Generate ledgers with the NEW rent
        const ledgers = generateLedgerSchedules(
          newTenant.id,
          data.newRent,
          data.startDate,
          data.endDate,
          data.paymentPlan,
          tnt.calendarMode
        );
        await saveLedgers(ledgers);
        alert(`${t('contract_extended_success') || 'Contract extended successfully!'}`);
        await loadData();
      }
    } catch (err) {
      console.error('Error extending:', err);
      alert(`${t('contract_extend_failed') || 'Failed to extend.'}`);
    }
  };


  return (
    <div className="glass-panel p-8 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <UserCircle /> {t('tenants')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn action-btn" onClick={() => exportCSV(tenants, 'tenants.csv')} style={{ background: 'var(--glass-border)' }} title={t('export_csv_btn')}>
            <Download size={18} />
            <span className="btn-text">{t('export')}</span>
          </button>
          <button className="btn btn-primary action-btn" onClick={() => handleOpenForm()} title={t('register_tenant')}>
            <UserPlus size={18} />
            <span className="btn-text">{t('add')}</span>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder={t('search_tenants_placeholder') || "Search by name, property, mobile, or iqama..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSaveTenant} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {editingId ? t('edit_tenant') : t('new_tenant')}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input className="input-field" placeholder={t('tenant_name')} value={tenantName} onChange={e => setTenantName(e.target.value)} required />
            <select className="input-field" value={propertyId} onChange={e => setPropertyId(e.target.value)} required>
              <option value="">{t('select_property')}</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name} ({Math.round(p.annualRent).toLocaleString()} {currency}/yr)</option>)}
            </select>
            
            <input className="input-field" placeholder={t('iqama_number')} value={iqamaNumber} onChange={e => setIqamaNumber(e.target.value)} />
            <input className="input-field" placeholder={t('sponsor_name')} value={sponsorName} onChange={e => setSponsorName(e.target.value)} />
            <input className="input-field" placeholder={t('mobile_number', 'Mobile Number')} value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                {t('start_date')} ({calendarMode})
              </label>
              <DatePicker
                value={startDate}
                onChange={(dateObject: any) => setStartDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
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
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                {t('end_date')} ({calendarMode})
              </label>
              <DatePicker
                value={endDate}
                onChange={(dateObject: any) => setEndDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
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
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                {t('payment_plan')}
              </label>
              <select className="input-field" value={paymentPlan} onChange={e => setPaymentPlan(e.target.value as any)} required>
                <option value="Monthly">{t('monthly')}</option>
                <option value="3 Month">{t('quarterly')}</option>
                <option value="6 Month">{t('semi_annual')}</option>
                <option value="Yearly">{t('yearly')}</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)' }}>
              {editingId ? t('update_tenant') : t('save_tenant')}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      {tenants.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('no_tenants')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {tenants.filter(tnt => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const prop = properties.find(p => p.id === tnt.propertyId);
            return (
              tnt.tenantName.toLowerCase().includes(term) ||
              (prop?.name || '').toLowerCase().includes(term) ||
              (tnt.mobileNumber || '').toLowerCase().includes(term) ||
              (tnt.iqamaNumber || '').toLowerCase().includes(term) ||
              (tnt.sponsorName || '').toLowerCase().includes(term)
            );
          }).map(tnt => {
            const prop = properties.find(p => p.id === tnt.propertyId);
            const contractRentAmount = tnt.annualRent || prop?.annualRent || 0;
            const res = contractRentAmount > 0 ? calculateRent(contractRentAmount, tnt.startDate, tnt.endDate, tnt.calendarMode) : null;
              
              return (
                <div key={tnt.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: tnt.isActive ? '4px solid var(--success)' : '4px solid var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0', textTransform: 'capitalize' }}>
                      <UserCircle size={20} color="var(--primary)"/> {tnt.tenantName}
                    </h3>
                  
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {tnt.isActive && (
                        <button type="button" onClick={() => handleExtendContract(tnt)} className="btn action-btn" style={{ background: 'var(--accent)', color: 'white' }} title={t('extend_contract')}>
                          <ArrowUpCircle size={16} />
                          <span className="btn-text">{t('extend')}</span>
                        </button>
                      )}
                      <button type="button" onClick={() => navigate(`/dashboard/ledger/${tnt.id}`)} className="btn action-btn" style={{ background: 'var(--success)', color: 'white' }} title={t('view_payments')}>
                        <Receipt size={16} />
                        <span className="btn-text">{t('view')}</span>
                      </button>
                      <button type="button" onClick={() => navigate(`/dashboard/contract/${tnt.id}`)} className="btn action-btn" style={{ background: 'var(--secondary)', color: 'white' }} title={t('print_contract')}>
                        <Printer size={16} />
                        <span className="btn-text">{t('print')}</span>
                      </button>
                      <button type="button" onClick={() => handleOpenForm(tnt)} className="btn action-btn" style={{ background: 'var(--primary)', color: 'white' }} title={t('edit_tenant')}>
                        <Edit size={16} />
                        <span className="btn-text">{t('edit')}</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(tnt.id)} className="btn action-btn" style={{ background: 'var(--danger)', color: 'white' }} title={t('confirm_delete')}>
                        <Trash2 size={16} />
                        <span className="btn-text">{t('delete')}</span>
                      </button>
                    </div>
                  </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('property_label_inline')} {prop?.name || t('unknown_property')}</p>
                    {tnt.iqamaNumber && <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}><strong>{t('iqama_number')}:</strong> {tnt.iqamaNumber}</p>}
                    {tnt.sponsorName && <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}><strong>{t('sponsor_name')}:</strong> {tnt.sponsorName}</p>}
                    {tnt.mobileNumber && <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}><strong>{t('mobile_number', 'Mobile Number')}:</strong> {tnt.mobileNumber}</p>}
                    <p style={{ fontSize: '0.875rem' }}>{t('contract_prefix')} {tnt.startDate} {t('to_date')} {tnt.endDate} ({tnt.calendarMode})</p>
                    {!tnt.isActive && <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: 'var(--text-muted)', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>{t('ended_status')}</span>}
                  </div>
                  
                  {tnt.isActive && prop && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '300px' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <DatePicker
                          value={leaveDateInput[tnt.id] || ''}
                          onChange={(dateObject: any) => setLeaveDateInput({ ...leaveDateInput, [tnt.id]: dateObject ? dateObject.format('YYYY/MM/DD') : '' })}
                          calendar={calendarMode === 'hijri' ? arabic : gregorian}
                          locale={calendarMode === 'hijri' ? (language === 'ar' ? arabic_ar : arabic_en) : (language === 'ar' ? gregorian_ar : gregorian_en)}
                          calendarPosition="bottom-right"
                          inputClass="input-field"
                          placeholder={t('leave_date')}
                          containerStyle={{ flex: 1 }}
                          format="YYYY/MM/DD"
                          zIndex={9999}
                          portal
                        />
                        <button type="button" className="btn btn-primary" onClick={() => handleCalculateRent(tnt)} style={{ padding: '0 1rem', height: '100%' }}>
                          <span className="btn-text">{t('calculate')}</span>
                        </button>
                      </div>

                      {res && (
                        <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                          <p><strong>{t('monthly_rent') || 'Monthly Rent'}:</strong> {Math.round(res?.monthlyRent || 0).toLocaleString()} {currency}</p>
                          <p>{t('active_days_leaving')} {res?.activeDays || 0}</p>
                          <p>{t('daily_rate')} {Math.round(res?.dailyRate || 0).toLocaleString()} {currency}</p>
                          <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={() => handleEndContract(tnt)} 
                            style={{ marginTop: '0.5rem', width: '100%', background: 'var(--danger)' }}
                          >
                            {t('end_contract_now')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        onConfirm={confirmModal?.onConfirm || (() => {})}
        onCancel={() => setConfirmModal(null)}
        variant="danger"
      />

      {extendingContract && (
        <ExtendContractModal 
          isOpen={!!extendingContract}
          onClose={() => setExtendingContract(null)}
          onConfirm={handleConfirmExtension}
          tenant={extendingContract.tenant}
          property={extendingContract.property}
        />
      )}
    </div>

  );
};

export default Tenants;
