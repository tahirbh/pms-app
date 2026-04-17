import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Edit, Trash2, Printer, Receipt, UserCircle, Calculator, Download, ArrowUpCircle } from 'lucide-react';
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

const Tenants: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currency, calendarMode, language } = useAppContext();
  
  const [tenants, setTenants] = useState<TenantContract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  
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
          mobileNumber
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
    
    await endTenantContract(tnt.id, leaveStr);
    await loadData();
  };

  const handleExtendContract = async (tnt: TenantContract) => {
    console.log('handleExtendContract started for:', tnt.tenantName);
    try {
      // Fetch all tenants to find historical contracts for the same person
      const allTenants = await getTenants();
      console.log('Fetched all tenants, count:', allTenants.length);
      
      const history = allTenants.filter(t => t.tenantName === tnt.tenantName);
      console.log('History for tenant:', history.length);
      
      // Sort by endDate to find the latest contract, being defensive about missing dates
      const latestContract = history.sort((a, b) => {
        const dateA = a.endDate || '';
        const dateB = b.endDate || '';
        return dateB.localeCompare(dateA);
      })[0] || tnt;

      console.log('Latest contract identified:', latestContract.startDate, 'to', latestContract.endDate);

      const incrementYear = (dateStr: string) => {
        if (!dateStr) return '';
        // Convert Arabic/Eastern numerals to Western numerals before parsing
        const convertToEnglish = (str: string) => str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
        
        const englishStr = convertToEnglish(dateStr);
        const separator = englishStr.includes('/') ? '/' : (englishStr.includes('-') ? '-' : '/');
        const parts = englishStr.split(separator);
        
        if (parts.length !== 3) return dateStr;
        const year = parseInt(parts[0], 10);
        if (isNaN(year)) return dateStr;
        
        // Pad month and day to ensure consistent formatting
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        
        const newYearStr = `${year + 1}${separator}${month}${separator}${day}`;
        
        // If the original date contained Arabic numerals, convert the new date back
        if (/[٠-٩]/.test(dateStr)) {
           return newYearStr.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
        }
        return newYearStr;
      };

      const calculatedStartDate = incrementYear(latestContract.startDate);
      const calculatedEndDate = incrementYear(latestContract.endDate);
      
      console.log('Calculated next period:', calculatedStartDate, 'to', calculatedEndDate);

      setConfirmModal({
        isOpen: true,
        title: t('extend_contract') || 'Extend Contract',
        message: `${t('extend_contract_confirm') || 'Extend contract based on historical data?'} \n` +
          `${t('tenant_name')}: ${tnt.tenantName}\n` +
          `${t('payment_plan')}: ${tnt.paymentPlan}\n` +
          `${t('start_date')}: ${calculatedStartDate}  →  ${t('end_date')}: ${calculatedEndDate}`,
        onConfirm: async () => {
          setConfirmModal(null);
          try {
            // Clone the tenant as a new active contract for the next year
            const newTenantData = {
              tenantName: latestContract.tenantName,
              propertyId: latestContract.propertyId,
              startDate: calculatedStartDate,
              endDate: calculatedEndDate,
              calendarMode: latestContract.calendarMode,
              paymentPlan: latestContract.paymentPlan || 'Monthly',
              iqamaNumber: latestContract.iqamaNumber || '',
              sponsorName: latestContract.sponsorName || '',
              mobileNumber: latestContract.mobileNumber || '',
              isActive: true
            };

            console.log('Saving new tenant contract...', newTenantData);
            const newTenant = await saveTenant(newTenantData);

            if (newTenant) {
              console.log('New tenant contract saved, ID:', newTenant.id);
              const prop = properties.find(p => p.id === tnt.propertyId);
              if (prop) {
                console.log('Generating ledgers for property:', prop.name);
                const ledgers = generateLedgerSchedules(
                  newTenant.id,
                  prop.annualRent,
                  calculatedStartDate,
                  calculatedEndDate,
                  tnt.paymentPlan || 'Monthly',
                  latestContract.calendarMode
                );
                console.log('Generated ledgers count:', ledgers.length);
                await saveLedgers(ledgers);
              }
              alert(`${t('contract_extended_success') || 'Contract extended successfully!'}`);
              await loadData();
            } else {
              throw new Error('saveTenant returned null');
            }
          } catch (err) {
            console.error('Error extending:', err);
            alert(`${t('contract_extend_failed') || 'Failed to extend.'}`);
          }
        }
      });

    } catch (err) {
      console.error('Error in handleExtendContract:', err);
      alert(`${t('contract_extend_failed') || 'Failed to extend contract.'} ${err instanceof Error ? err.message : ''}`);
    }
  };

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <UserCircle /> {t('tenants')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn action-btn" onClick={() => exportCSV(tenants, 'tenants.csv')} style={{ background: 'var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} title={t('export_csv_btn')}>
            <Download size={16} /> <span className="btn-text">{t('export_csv_btn')}</span>
          </button>
          <button className="btn btn-primary action-btn" onClick={() => handleOpenForm()} title={t('register_tenant')}>
            <UserPlus size={20} />
            <span className="btn-text">{t('register_tenant')}</span>
          </button>
        </div>
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
              {properties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.annualRent} {currency}/yr)</option>)}
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
          {tenants.map(tnt => {
            const prop = properties.find(p => p.id === tnt.propertyId);
              const res = prop ? calculateRent(prop.annualRent, tnt.startDate, tnt.endDate, tnt.calendarMode) : null;
              
              return (
                <div key={tnt.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: tnt.isActive ? '4px solid var(--success)' : '4px solid var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0', textTransform: 'capitalize' }}>
                      <UserCircle size={20} color="var(--primary)"/> {tnt.tenantName}
                    </h3>
                  
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {tnt.isActive && (
                        <button type="button" onClick={() => handleExtendContract(tnt)} className="btn" style={{ padding: '0.5rem', background: 'var(--accent)', color: 'white' }} title={t('extend_contract') || 'Extend Contract (Next Hijri Year)'}>
                          <ArrowUpCircle size={16} />
                        </button>
                      )}
                      <button type="button" onClick={() => navigate(`/dashboard/ledger/${tnt.id}`)} className="btn" style={{ padding: '0.5rem', background: 'var(--success)', color: 'white' }} title="View Ledger Account">
                        <Receipt size={16} />
                      </button>
                      <button type="button" onClick={() => navigate(`/dashboard/contract/${tnt.id}`)} className="btn" style={{ padding: '0.5rem', background: 'var(--secondary)', color: 'white' }} title="View Contract">
                        <Printer size={16} />
                      </button>
                      <button type="button" onClick={() => handleOpenForm(tnt)} className="btn" style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white' }}>
                        <Edit size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(tnt.id)} className="btn" style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white' }}>
                        <Trash2 size={16} />
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
                          <Calculator size={20} />
                        </button>
                      </div>

                      {res && (
                        <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                          <p><strong>{t('monthly_rent') || 'Monthly Rent'}:</strong> {Math.round(res?.monthlyRent || 0).toLocaleString()} {currency}</p>
                          <p>{t('active_days_leaving')} {res?.activeDays || 0}</p>
                          <p>{t('daily_rate')} {Math.round(res?.dailyRate || 0).toLocaleString()} {currency}</p>
                          <button 
                            type="button" 
                            className="btn" 
                            style={{ background: 'var(--danger)', color: 'white', marginTop: '0.5rem', width: '100%', fontSize: '0.875rem', padding: '0.5rem' }}
                            onClick={() => handleEndContract(tnt)}
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

      {confirmModal && confirmModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', paddingTop: '15vh', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ padding: '2rem', maxWidth: '400px', width: '100%', background: 'var(--bg, #ffffff)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: 'var(--text)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main, #000)' }}>{confirmModal.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-muted, #444)' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setConfirmModal(null)} style={{ background: '#eee', color: '#333' }}>{t('cancel')}</button>
              <button type="button" className="btn btn-primary" onClick={confirmModal.onConfirm} style={{ background: 'var(--success, #10b981)', color: '#fff' }}>{t('confirm') || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
