import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, X, Info } from 'lucide-react';
import type { TenantContract, Property } from '../utils/store';
import { useAppContext } from '../context/AppContext';
import DatePickerModule from "react-multi-date-picker";
const DatePicker = (DatePickerModule as any).default || DatePickerModule;
import arabic from "react-date-object/calendars/arabic";
import arabic_ar from "react-date-object/locales/arabic_ar";
import arabic_en from "react-date-object/locales/arabic_en";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import gregorian_ar from "react-date-object/locales/gregorian_ar";
import moment from 'moment-hijri';

interface ExtendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { 
    newRent: number; 
    updateMaster: boolean; 
    paymentPlan: 'Monthly' | '3 Month' | '6 Month' | 'Yearly';
    startDate: string;
    endDate: string;
  }) => void;
  tenant: TenantContract;
  property: Property;
}

const ExtendContractModal: React.FC<ExtendContractModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tenant, 
  property 
}) => {
  const { t } = useTranslation();
  const { currency, language, calendarMode } = useAppContext();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newRent, setNewRent] = useState<string>(property.annualRent.toString());
  const [updateMaster, setUpdateMaster] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'Monthly' | '3 Month' | '6 Month' | 'Yearly'>(tenant.paymentPlan || 'Monthly');

  // Initialize dates only once when modal opens
  useEffect(() => {
    if (isOpen) {
      if (tenant.calendarMode === 'hijri') {
        // Standardize to 12 months extension for Hijri
        const oldEnd = moment(tenant.endDate, 'iYYYY/iMM/iDD');
        const start = oldEnd.clone().add(1, 'days');
        const end = start.clone().add(1, 'iYear').subtract(1, 'days');
        setStartDate(start.format('iYYYY/iMM/iDD'));
        setEndDate(end.format('iYYYY/iMM/iDD'));
      } else {
        // Standardize to 12 months extension for Gregorian
        const oldEnd = moment(tenant.endDate, 'YYYY/MM/DD');
        const start = oldEnd.clone().add(1, 'days');
        const end = start.clone().add(1, 'year').subtract(1, 'days');
        setStartDate(start.format('YYYY/MM/DD'));
        setEndDate(end.format('YYYY/MM/DD'));
      }
      setNewRent(property.annualRent.toString());
      setPaymentPlan(tenant.paymentPlan || 'Yearly');
    }
  }, [isOpen, tenant, property]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      newRent: parseFloat(newRent) || property.annualRent,
      updateMaster,
      paymentPlan,
      startDate,
      endDate
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel animate-slide-in" style={{ padding: '2rem', maxWidth: '540px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
            {t('extend_contract_dialog_title')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Info Section */}
          <div style={{ background: 'rgba(128,128,128,0.05)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{tenant.tenantName}</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{property.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('previous_end') || 'Previous End'}:</p>
              <p style={{ margin: 0, fontWeight: 500 }}>{tenant.endDate}</p>
            </div>
          </div>

          {/* Dates Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                {t('start_date')} ({tenant.calendarMode})
              </label>
              <DatePicker
                value={startDate}
                onChange={(dateObject: any) => setStartDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
                calendar={tenant.calendarMode === 'hijri' ? arabic : gregorian}
                locale={tenant.calendarMode === 'hijri' ? (language === 'ar' ? arabic_ar : arabic_en) : (language === 'ar' ? gregorian_ar : gregorian_en)}
                calendarPosition="bottom-right"
                inputClass="input-field"
                containerStyle={{ width: '100%' }}
                format="YYYY/MM/DD"
                zIndex={10001}
                portal
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                {t('end_date')} ({tenant.calendarMode})
              </label>
              <DatePicker
                value={endDate}
                onChange={(dateObject: any) => setEndDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
                calendar={tenant.calendarMode === 'hijri' ? arabic : gregorian}
                locale={tenant.calendarMode === 'hijri' ? (language === 'ar' ? arabic_ar : arabic_en) : (language === 'ar' ? gregorian_ar : gregorian_en)}
                calendarPosition="bottom-right"
                inputClass="input-field"
                containerStyle={{ width: '100%' }}
                format="YYYY/MM/DD"
                zIndex={10001}
                portal
              />
            </div>
          </div>
          
          <div style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
             <Info size={14} /> {t('extension_tip') || 'System defaults to 12-month extension from previous end date.'}
          </div>

          {/* Rent Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                {t('current_rent')}
              </label>
              <div className="input-field" style={{ background: 'rgba(128,128,128,0.1)', cursor: 'not-allowed' }}>
                {property.annualRent.toLocaleString()} {currency}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                {t('new_rent_label')}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="input-field" 
                  type="number" 
                  value={newRent} 
                  onChange={(e) => setNewRent(e.target.value)}
                  style={{ paddingLeft: '3.5rem' }}
                />
                <span style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}>
                  {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Master Update Checkbox */}
          <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'var(--transition)' }} className="hover-highlight">
            <input 
              type="checkbox" 
              checked={updateMaster} 
              onChange={(e) => setUpdateMaster(e.target.checked)}
              style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{t('update_master_rent')}</span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('update_master_rent_hint')}
              </p>
            </div>
          </label>

          {/* Payment Plan Select */}
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
              {t('payment_plan')}
            </label>
            <select className="input-field" value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value as any)}>
              <option value="Monthly">{t('monthly')}</option>
              <option value="3 Month">{t('quarterly')}</option>
              <option value="6 Month">{t('semi_annual')}</option>
              <option value="Yearly">{t('yearly')}</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn" onClick={onClose} style={{ flex: 1 }}>
              {t('cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} style={{ flex: 2, background: 'var(--success)' }}>
              <CheckCircle2 size={20} />
              {t('confirm_extension')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtendContractModal;
