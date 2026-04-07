import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { getProperties, getTenants, getExpenses, getAllLedgers } from '../utils/store';
import moment from 'moment-hijri';

const Pivot = () => {
  const { t } = useTranslation();
  const { currency } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [pivot1Data, setPivot1Data] = useState<any>({ years: [], data: {} }); 
  const [pivot2Data, setPivot2Data] = useState<any>({ years: [], data: {} }); 

  useEffect(() => {
    const loadAll = async () => {
      const props = await getProperties();
      const tenants = await getTenants();
      const expenses = await getExpenses();
      const ledgers = await getAllLedgers();

      setProperties(props);

      const allYears = new Set<string>();
      
      const p1: Record<string, Record<string, number>> = {}; // year -> propertyId -> collected rent
      const p2: Record<string, Record<string, number>> = {}; // year -> category -> amount

      // Process Ledgers
      ledgers.forEach(L => {
        const tnt = tenants.find(t => t.id === L.tenantId);
        if (!tnt) return;
        
        let ledgerDate: Date;
        let yearStr = 'N/A';
        if (tnt.calendarMode === 'hijri') {
          const m = moment(L.dueDate, 'iYYYY/iMM/iDD');
          ledgerDate = m.toDate();
          yearStr = m.format('iYYYY') + ' (H)';
        } else {
          ledgerDate = new Date(L.dueDate);
          yearStr = ledgerDate.getFullYear().toString();
        }

        allYears.add(yearStr);
        
        if (!p1[yearStr]) p1[yearStr] = {};
        if (!p2[yearStr]) p2[yearStr] = { collectedRent: 0, unpaidRent: 0, expense: 0, transfer: 0 };

        if (L.status === 'Paid') {
          p1[yearStr][tnt.propertyId] = (p1[yearStr][tnt.propertyId] || 0) + L.amount;
          p2[yearStr].collectedRent += L.amount;
        } else {
          p2[yearStr].unpaidRent += L.amount;
        }
      });

      // Process Expenses
      expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (isNaN(d.getTime())) return;
        const yearStr = d.getFullYear().toString();
        allYears.add(yearStr);
        
        if (!p2[yearStr]) p2[yearStr] = { collectedRent: 0, unpaidRent: 0, expense: 0, transfer: 0 };

        if (exp.category === 'Transfer to Owner' || exp.category === 'Transferred to Owner') {
          p2[yearStr].transfer += exp.amount;
        } else {
          p2[yearStr].expense += exp.amount;
        }
      });

      const sortedYears = Array.from(allYears).sort((a, b) => a.localeCompare(b));

      setPivot1Data({ years: sortedYears, data: p1 });
      setPivot2Data({ years: sortedYears, data: p2 });
      setLoading(false);
    };

    loadAll();
  }, []);

  if (loading) {
    return <div className="p-6">{t('loading')}...</div>;
  }

  // --- Calculations for Pivot 1 ---
  const years = pivot1Data.years;
  
  // Pivot 1 Cols Totals
  const p1ColTotals: Record<string, number> = {};
  properties.forEach(prop => { p1ColTotals[prop.id] = 0; });
  let p1GrandTotal = 0;

  // --- Calculations for Pivot 2 ---
  const p2Categories = [
    { key: 'collectedRent', label: t('collected_rent') || 'Total Collected Rent' },
    { key: 'expense', label: t('expenses') || 'Total Expenses' },
    { key: 'transfer', label: t('transferred_amount') || 'Transfer to Owner' },
    { key: 'unpaidRent', label: t('unpaid_rent') || 'Unpaid / Overdue Rent' }
  ];
  
  const p2ColTotals: Record<string, number> = {};
  p2Categories.forEach(cat => { p2ColTotals[cat.key] = 0; });
  let p2GrandTotal = 0;

  return (
    <div className="glass-panel p-6 animate-slide-in relative" style={{ minHeight: 'calc(100vh - 40px)' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem' }}>
        📊 {t('pivot_reports') || 'Historical Pivot Reports'}
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem' }}>
        {t('pivot_reports_sub') || 'Consolidated data history across all years'}
      </p>

      {/* PIVOT TABLE 1 */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1.5rem', color: 'var(--text-main)' }}>
          {t('building_income_by_year') || 'Building Income by Year'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'transparent' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)' }}>{t('year') || 'Year'}</th>
                {properties.map(p => (
                  <th key={p.id} style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)' }}>{p.name}</th>
                ))}
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--primary)', fontWeight: 800 }}>{t('row_total') || 'Row Total'}</th>
              </tr>
            </thead>
            <tbody>
              {years.length === 0 && (
                <tr><td colSpan={properties.length + 2} style={{ padding: '1rem', textAlign: 'center' }}>No Data</td></tr>
              )}
              {years.map((y: string) => {
                let rowTotal = 0;
                return (
                  <tr key={y} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-slate-500/10">
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{y}</td>
                    {properties.map(p => {
                      const val = (pivot1Data.data[y] && pivot1Data.data[y][p.id]) || 0;
                      rowTotal += val;
                      p1ColTotals[p.id] += val;
                      return (
                        <td key={p.id} style={{ padding: '0.75rem 1.5rem' }}>
                          {val.toLocaleString()} <span style={{fontSize:'0.7em', color:'var(--text-muted)'}}>{currency}</span>
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {rowTotal.toLocaleString()} <span style={{fontSize:'0.7em'}}>{currency}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(0,0,0,0.03)' }}>
                <td style={{ padding: '0.75rem 1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('column_total') || 'Column Total'}</td>
                {properties.map(p => {
                  p1GrandTotal += p1ColTotals[p.id];
                  return (
                    <td key={p.id} style={{ padding: '0.75rem 1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {p1ColTotals[p.id].toLocaleString()} <span style={{fontSize:'0.7em'}}>{currency}</span>
                    </td>
                  );
                })}
                <td style={{ padding: '0.75rem 1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {p1GrandTotal.toLocaleString()} <span style={{fontSize:'0.7em'}}>{currency}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PIVOT TABLE 2 */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1.5rem', color: 'var(--text-main)' }}>
          {t('financial_totals_by_year') || 'Financial Breakdown by Year'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'transparent' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)' }}>{t('year') || 'Year'}</th>
                {p2Categories.map(cat => (
                  <th key={cat.key} style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)' }}>{cat.label}</th>
                ))}
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--primary)', fontWeight: 800 }}>{t('row_total') || 'Row Total'}</th>
              </tr>
            </thead>
            <tbody>
              {years.length === 0 && (
                <tr><td colSpan={p2Categories.length + 2} style={{ padding: '1rem', textAlign: 'center' }}>No Data</td></tr>
              )}
              {years.map((y: string) => {
                let rowTotal = 0;
                return (
                  <tr key={y} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-slate-500/10">
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{y}</td>
                    {p2Categories.map(cat => {
                      const val = (pivot2Data.data[y] && pivot2Data.data[y][cat.key]) || 0;
                      rowTotal += val;
                      p2ColTotals[cat.key] += val;
                      return (
                        <td key={cat.key} style={{ padding: '0.75rem 1.5rem' }}>
                          {val.toLocaleString()} <span style={{fontSize:'0.7em', color:'var(--text-muted)'}}>{currency}</span>
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {rowTotal.toLocaleString()} <span style={{fontSize:'0.7em'}}>{currency}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(0,0,0,0.03)' }}>
                <td style={{ padding: '0.75rem 1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('column_total') || 'Column Total'}</td>
                {p2Categories.map(cat => {
                  p2GrandTotal += p2ColTotals[cat.key];
                  return (
                    <td key={cat.key} style={{ padding: '0.75rem 1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {p2ColTotals[cat.key].toLocaleString()} <span style={{fontSize:'0.7em'}}>{currency}</span>
                    </td>
                  );
                })}
                <td style={{ padding: '0.75rem 1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {p2GrandTotal.toLocaleString()} <span style={{fontSize:'0.7em'}}>{currency}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Pivot;
