import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getExpenses, getAllLedgers } from '../utils/store';
import type { Expense, ContractLedger } from '../utils/store';
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { currency, calendarMode, language } = useAppContext();

  const [startDate, setStartDate] = useState(() => {
    return calendarMode === 'hijri' 
      ? moment().subtract(30, 'days').format('iYYYY/iMM/iDD') 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return calendarMode === 'hijri' 
      ? moment().format('iYYYY/iMM/iDD') 
      : new Date().toISOString().split('T')[0];
  });

  const [incomes, setIncomes] = useState<ContractLedger[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      const allLedgers = await getAllLedgers();
      const allExpenses = await getExpenses();

      // Convert filter strings to internal generic Gregorian absolute points to cross-check natively globally
      let startBound: Date;
      let endBound: Date;
      
      if (calendarMode === 'hijri') {
        startBound = moment(startDate, 'iYYYY/iMM/iDD').toDate();
        endBound = moment(endDate, 'iYYYY/iMM/iDD').toDate();
      } else {
        startBound = new Date(startDate);
        endBound = new Date(endDate);
      }
      
      endBound.setHours(23, 59, 59, 999);

      // Filter Incomes (only strictly 'Paid' ledgers natively reflect guaranteed liquid income)
      const filteredIncomes = allLedgers.filter(L => {
        if (L.status !== 'Paid' || !L.paidDate) return false;
        // The ledger records its strictly fulfilled date natively as YYYY/MM/DD string representation representing its native calendar setting
        let pd: Date;
        // Since paidDate is populated literally based on the global format when it was marked paid, assuming it shares current calendar Mode constraints or universally mapped.
        // Actually, safest logic natively evaluates strings against bounds if they share identical structural parsing.
        if (L.paidDate.includes('144')) {
           pd = moment(L.paidDate, 'iYYYY/iMM/iDD').toDate();
        } else {
           pd = new Date(L.paidDate);
        }
        return pd >= startBound && pd <= endBound;
      });

      const filteredExpenses = allExpenses.filter(E => {
        let ed: Date;
        if (E.date.includes('144')) {
          ed = moment(E.date, 'iYYYY/iMM/iDD').toDate();
        } else {
          ed = new Date(E.date);
        }
        return ed >= startBound && ed <= endBound;
      });

      setIncomes(filteredIncomes);
      setExpenses(filteredExpenses);
    };

    fetchReport();
  }, [startDate, endDate, calendarMode]);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netRevenue = totalIncome - totalExpense;

  const barData = [
    { name: 'Income', amount: totalIncome, fill: '#10b981' },
    { name: 'Expenses', amount: totalExpense, fill: '#ef4444' }
  ];

  return (
    <div className="glass-panel p-6 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <FileText /> {t('income_expense_report') || 'Income & Expense Report'}
        </h2>
      </div>

      {/* Date Filters */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.4)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('start_date')}</label>
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
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('end_date')}</label>
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
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.3)', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpRight size={16} color="var(--success)" />
            {t('paid_rent') || 'Total Income'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {(totalIncome || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.3)', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowDownRight size={16} color="var(--danger)" />
            {t('expenses') || 'Total Expenses'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {(totalExpense || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white', border: 'none' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            {t('net_revenue') || 'Net Revenue'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {(netRevenue || 0).toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.8 }}>{currency}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel p-4" style={{ height: 350 }}>
           <ResponsiveContainer>
             <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${currency}`} />
               <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                 {barData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4" style={{ maxHeight: 350, overflowY: 'auto' }}>
          <h4 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            Recent Transactions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {incomes.map(inc => (
              <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                <span>Income (Ledger)</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{(inc.amount || 0).toLocaleString()}</span>
              </div>
            ))}
            {expenses.map(exp => (
              <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                <span>{exp.category}</span>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{(exp.amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;
