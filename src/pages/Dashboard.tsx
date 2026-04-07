import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Home, Users, Settings as SettingsIcon, LogOut, Receipt, Bell, AlertCircle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment-hijri';

// Force TS server to re-resolve the module if it was cached as missing
import Properties from './Properties.tsx';
import Tenants from './Tenants.tsx';
import Settings from './Settings.tsx';
import Expenses from './Expenses.tsx';
import TenantContractPage from './TenantContract.tsx';
import TenantLedger from './TenantLedger.tsx';
import Reports from './Reports.tsx';
import Pivot from './Pivot.tsx';
import { getProperties, getTenants, getExpenses, getAllLedgers } from '../utils/store.ts';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: '#ffebee', borderRadius: '8px', margin: '2rem' }}>
          <h2>💥 Component Crash</h2>
          <p><strong>{this.state.error?.message}</strong></p>
          <pre style={{ overflowX: 'auto', fontSize: '12px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardHome = () => {
  const { t } = useTranslation();
  const { currency, calendarMode } = useAppContext();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState({ expectedRent: 0, actualRent: 0, totalExpenses: 0, transferredAmount: 0, collectedRent: 0, cashInHand: 0, unpaidRent: 0 });
  const [utilizationData, setUtilizationData] = useState<{name: string, potential: number, contracted: number}[]>([]);
  const [ledgerStats, setLedgerStats] = useState({ paid: 0, overdue: 0, upcoming: 0 });
  const [notifications, setNotifications] = useState<{id: string, tenantId: string, name: string, type: 'overdue'|'upcoming', amount: number, date: string}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<Record<string, { collectedRent: number, totalExpenses: number, transferredAmount: number, unpaidRent: number }>>({});

  
  useEffect(() => {
    const loadAll = async () => {
      const props = await getProperties();
      const tenants = await getTenants();
      const expenses = await getExpenses();
      
      let expected = 0;
      let actual = 0;
      
      props.forEach(p => {
        const pTenants = tenants.filter(t => t.propertyId === p.id);
        const activeTenant = pTenants.find(t => t.isActive);
        const pActual = activeTenant ? p.annualRent : 0;
        
        expected += p.annualRent;
        actual += pActual;
      });

      let transferred = 0;
      let regularExp = 0;
      const histData: Record<string, { collectedRent: number, totalExpenses: number, transferredAmount: number, unpaidRent: number }> = {};
      const allYearsSet = new Set<string>();

      const currentGregorianYear = new Date().getFullYear().toString();
      const currentHijriYear = moment().format('iYYYY') + ' (H)';

      expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (isNaN(d.getTime())) return;
        const yearStr = d.getFullYear().toString();
        allYearsSet.add(yearStr);
        if (!histData[yearStr]) histData[yearStr] = { collectedRent: 0, totalExpenses: 0, transferredAmount: 0, unpaidRent: 0 };

        const isTransfer = (exp.category === 'Transfer to Owner' || exp.category === 'Transferred to Owner');
        
        if (isTransfer) {
          histData[yearStr].transferredAmount += exp.amount;
          if (yearStr === currentGregorianYear) transferred += exp.amount;
        } else {
          histData[yearStr].totalExpenses += exp.amount;
          if (yearStr === currentGregorianYear) regularExp += exp.amount;
        }
      });
      
      const allLedgers = await getAllLedgers();
      
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      let currentMonthPaid = 0;
      let totalCollected = 0;
      let totalUnpaid = 0;
      let totalOverdue = 0;
      let upcomingRent = 0;
      const notifs: typeof notifications = [];

      allLedgers.forEach(L => {
        const tnt = tenants.find(t => t.id === L.tenantId);
        if(!tnt) return;
        
        let ledgerDate: Date;
        let yearStr = 'N/A';
        if(tnt.calendarMode === 'hijri') {
          const m = moment(L.dueDate, 'iYYYY/iMM/iDD');
          ledgerDate = m.toDate();
          yearStr = m.format('iYYYY') + ' (H)';
        } else {
          ledgerDate = new Date(L.dueDate);
          yearStr = ledgerDate.getFullYear().toString();
        }

        allYearsSet.add(yearStr);
        if (!histData[yearStr]) histData[yearStr] = { collectedRent: 0, totalExpenses: 0, transferredAmount: 0, unpaidRent: 0 };
        
        if (L.status === 'Paid') {
          histData[yearStr].collectedRent += L.amount;
          if (yearStr === currentGregorianYear || yearStr === currentHijriYear) {
             totalCollected += L.amount;
          }
          // Count recent payments (last 30 days) towards "Current Month Paid" logic
          if (ledgerDate >= thirtyDaysAgo && ledgerDate <= thirtyDaysFromNow) {
            currentMonthPaid += L.amount;
          }
        } else {
          histData[yearStr].unpaidRent += L.amount;
          if (yearStr === currentGregorianYear || yearStr === currentHijriYear) {
             totalUnpaid += L.amount;
          }
          if (ledgerDate < today) {
            totalOverdue += L.amount;
            notifs.push({ id: L.id, tenantId: L.tenantId, name: tnt.tenantName, type: 'overdue', amount: L.amount, date: L.dueDate });
          } else if (ledgerDate <= thirtyDaysFromNow) {
            upcomingRent += L.amount;
            if (ledgerDate.getTime() - today.getTime() <= 10 * 24 * 60 * 60 * 1000) {
              notifs.push({ id: L.id, tenantId: L.tenantId, name: tnt.tenantName, type: 'upcoming', amount: L.amount, date: L.dueDate });
            }
          }
        }
      });
      
      let cashInHand = totalCollected - regularExp - transferred;

      setMetrics({ 
        expectedRent: expected, 
        actualRent: actual, 
        totalExpenses: regularExp, 
        transferredAmount: transferred,
        collectedRent: totalCollected,
        cashInHand: cashInHand,
        unpaidRent: totalUnpaid
      });
      
      setLedgerStats({ paid: currentMonthPaid, overdue: totalOverdue, upcoming: upcomingRent });
      setNotifications(notifs.sort((a: any, b: any) => a.type === 'overdue' ? -1 : (b.type === 'overdue' ? 1 : 0)));

      const sortedYears = Array.from(allYearsSet).sort((a, b) => a.localeCompare(b));
      setAvailableYears(sortedYears);
      if (sortedYears.length > 0) {
         setStartYear(sortedYears[0]);
         setEndYear(sortedYears[sortedYears.length - 1]);
      }
      setHistoricalData(histData);

      const buildUtil = props.map(p => {
        const pTenants = tenants.filter(t => t.propertyId === p.id);
        const activeTenant = pTenants.find(t => t.isActive);
        let contracted = activeTenant ? p.annualRent : 0;
        
        return {
          name: p.name,
          potential: p.annualRent,
          contracted
        };
      });
      setUtilizationData(buildUtil);
    };
    
    loadAll();
  }, []);

  const filteredHistMetrics = React.useMemo(() => {
    if (!startYear || !endYear) return { collectedRent: 0, totalExpenses: 0, transferredAmount: 0, cashInHand: 0, unpaidRent: 0 };
    const startIndex = availableYears.indexOf(startYear);
    const endIndex = availableYears.indexOf(endYear);
    let c = 0, e = 0, t = 0, u = 0;
    availableYears.forEach((y, i) => {
      if (i >= startIndex && i <= endIndex) {
         c += historicalData[y]?.collectedRent || 0;
         e += historicalData[y]?.totalExpenses || 0;
         t += historicalData[y]?.transferredAmount || 0;
         u += historicalData[y]?.unpaidRent || 0;
      }
    });
    return { collectedRent: c, totalExpenses: e, transferredAmount: t, unpaidRent: u, cashInHand: c - e - t };
  }, [startYear, endYear, availableYears, historicalData]);

  const handleCardClick = (type: string, isHistorical: boolean) => {
    let qStart = '';
    let qEnd = '';
    let qFilter = '';

    if (isHistorical) {
      if (startYear) {
        qStart = startYear.includes('(H)') ? `${startYear.split(' ')[0]}/01/01` : `${startYear}/01/01`;
      }
      if (endYear) {
        qEnd = endYear.includes('(H)') ? `${endYear.split(' ')[0]}/12/30` : `${endYear}/12/31`;
      }
    } else {
      if (calendarMode === 'hijri') {
        const cy = moment().format('iYYYY');
        qStart = `${cy}/01/01`;
        qEnd = `${cy}/12/30`;
      } else {
        const cy = new Date().getFullYear();
        qStart = `${cy}/01/01`;
        qEnd = `${cy}/12/31`;
      }
    }

    if (type === 'transferred_amount') qFilter = 'transfer';
    else if (type === 'total_expenses') qFilter = 'expense';
    else if (type === 'collected_rent') qFilter = 'income';

    if (type === 'unpaid_rent') {
       const params = new URLSearchParams();
       if (qStart) params.append('start', qStart);
       if (qEnd) params.append('end', qEnd);
       navigate(`/dashboard/all-ledgers?${params.toString()}`);
       return;
    }

    const params = new URLSearchParams();
    if (qStart) params.append('start', qStart);
    if (qEnd) params.append('end', qEnd);
    if (qFilter) params.append('filter', qFilter);

    navigate(`/dashboard/report?${params.toString()}`);
  };

  const barData = [
    { name: t('rent_comparison'), expected: metrics.expectedRent, actual: metrics.actualRent }
  ];

  const pieData = [
    { name: t('collected_rent'), value: metrics.collectedRent },
    { name: t('expense_label'), value: metrics.totalExpenses + metrics.transferredAmount },
  ];
  const COLORS = ['#10b981', '#ef4444'];
  const ledgerPieData = [
    { name: t('paid_rent') || 'Paid (30 Days)', value: ledgerStats.paid },
    { name: t('overdue_rent') || 'Overdue', value: ledgerStats.overdue },
    { name: t('upcoming_rent') || 'Upcoming (30 Days)', value: ledgerStats.upcoming }
  ];
  const LEDGER_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="glass-panel p-6 animate-slide-in relative">
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button 
          className="btn" 
          style={{ position: 'relative', padding: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={24} color="var(--primary)" />
          {notifications.length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '3rem', right: 0, width: '350px', zIndex: 50, padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
            <h4 style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', margin: 0, fontWeight: 600 }}>{t('notifications')}</h4>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_notifications')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((n: any) => (
                  <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }} onClick={() => navigate(`/dashboard/ledger/${n.tenantId}`)}>
                    <AlertCircle size={20} color={n.type === 'overdue' ? 'var(--danger)' : 'var(--accent)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {n.name}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: n.type === 'overdue' ? 'var(--danger)' : 'var(--accent)' }}>
                        {n.type === 'overdue' ? t('overdue_alert') : t('upcoming_alert')}: {n.amount.toLocaleString()} {currency}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t('due_date')}: {n.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem', paddingRight: '3rem' }}>{t('welcome_title')}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem' }}>{t('welcome_subtitle')}</p>

      {/* Summary Stat Cards - Current Year */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem 0' }}>📈 {t('current_year_metrics') || 'Current Year Metrics'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { key: 'projected_rent', label: t('projected_rent'), value: metrics.expectedRent, color: 'var(--secondary)', icon: '📋' },
          { key: 'collected_rent', label: t('collected_rent'), value: metrics.collectedRent, color: 'var(--primary)', icon: '✅' },
          { key: 'unpaid_rent', label: t('unpaid_rent') || 'Unpaid Rent', value: metrics.unpaidRent, color: 'var(--danger)', icon: '⚠️' },
          { key: 'transferred_amount', label: t('transferred_amount'), value: metrics.transferredAmount, color: 'var(--accent)', icon: '🏦' },
          { key: 'total_expenses', label: t('total_expenses'), value: metrics.totalExpenses, color: 'var(--danger)', icon: '💸' },
          { key: 'cash_in_hand', label: t('cash_in_hand'), value: metrics.cashInHand, color: 'var(--success)', icon: '💵' },
        ].map((card) => (
          <div 
            key={card.key} 
            className="glass-panel" 
            style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${card.color}`, display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => handleCardClick(card.key, false)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ fontSize: '1.4rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>
              {(card.value || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stat Cards - Historical Filtered */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>📅 {t('historical_metrics') || 'Historical Metrics'}</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{t('start_year') || 'Start Year'}</label>
            <select className="input" value={startYear} onChange={(e) => setStartYear(e.target.value)} style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{t('end_year') || 'End Year'}</label>
            <select className="input" value={endYear} onChange={(e) => setEndYear(e.target.value)} style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { key: 'collected_rent', label: t('collected_rent'), value: filteredHistMetrics.collectedRent, color: 'var(--primary)', icon: '✅' },
          { key: 'unpaid_rent', label: t('unpaid_rent') || 'Unpaid Rent', value: filteredHistMetrics.unpaidRent, color: 'var(--danger)', icon: '⚠️' },
          { key: 'transferred_amount', label: t('transferred_amount'), value: filteredHistMetrics.transferredAmount, color: 'var(--accent)', icon: '🏦' },
          { key: 'total_expenses', label: t('total_expenses'), value: filteredHistMetrics.totalExpenses, color: 'var(--danger)', icon: '💸' },
          { key: 'cash_in_hand', label: t('cash_in_hand'), value: filteredHistMetrics.cashInHand, color: 'var(--success)', icon: '💵' },
        ].map((card) => (
          <div 
            key={`hist-${card.key}`} 
            className="glass-panel" 
            style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${card.color}`, display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(var(--glass-bg), 0.4)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => handleCardClick(card.key, true)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ fontSize: '1.4rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>
              {(card.value || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>📊 {t('financial_analytics')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{t('financial_analytics_subtitle')}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Expected vs Actual Rent Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('expected_vs_actual')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('expected_vs_actual_sub')}</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${currency}`} />
                <Bar dataKey="expected" name={t('expected_annual')} fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name={t('actual_contracted')} fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('income_vs_expenses')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('income_vs_expenses_sub')}</p>
          <div style={{ width: '100%', height: 260 }}>
            {metrics.actualRent === 0 && metrics.totalExpenses === 0 ? (
              <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${currency}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
              <span style={{ display:'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{width: 12, height:12, borderRadius:'50%', background: COLORS[0]}}></span> {t('income')}</span>
              <span style={{ display:'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{width: 12, height:12, borderRadius:'50%', background: COLORS[1]}}></span> {t('expense_label')}</span>
            </div>
          </div>
        </div>

        {/* Ledger Collection 30-Day Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('ledger_revenue')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('ledger_revenue_sub')}</p>
          <div style={{ width: '100%', height: 260 }}>
            {ledgerStats.paid === 0 && ledgerStats.overdue === 0 && ledgerStats.upcoming === 0 ? (
              <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={ledgerPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ledgerPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={LEDGER_COLORS[index % LEDGER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${currency}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display:'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><span style={{width: 12, height:12, borderRadius:'50%', background: LEDGER_COLORS[0]}}></span> {t('paid_rent')}</span>
              <span style={{ display:'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><span style={{width: 12, height:12, borderRadius:'50%', background: LEDGER_COLORS[1]}}></span> {t('overdue_rent')}</span>
              <span style={{ display:'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><span style={{width: 12, height:12, borderRadius:'50%', background: LEDGER_COLORS[2]}}></span> {t('upcoming_rent')}</span>
            </div>
          </div>
        </div>

        {/* Building Utilization Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('building_utilization')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('building_utilization_sub')}</p>
          <div style={{ width: '100%', height: 320 }}>
            {utilizationData.length === 0 ? (
              <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={utilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${currency}`} />
                  <Bar dataKey="potential" name={t('potential_rent_annual')} fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contracted" name={t('actual_contracted_rent')} fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

import AllTenantsLedger from './AllTenantsLedger.tsx';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { path: '/dashboard/properties', label: t('properties'), icon: Home },
    { path: '/dashboard/tenants', label: t('tenants'), icon: Users },
    { path: '/dashboard/expenses', label: t('expenses'), icon: Receipt },
    { path: '/dashboard/all-ledgers', label: t('tenant_ledgers') || 'Tenant Ledgers', icon: Users },
    { path: '/dashboard/report', label: t('reports'), icon: FileText },
    { path: '/dashboard/pivot', label: t('pivot_reports') || 'Pivot', icon: FileText },
    { path: '/dashboard/settings', label: t('settings'), icon: SettingsIcon },
  ];

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* Sidebar Navigation */}
      <aside className="glass-panel sidebar">
        <div className="app-title" style={{ padding: '2rem 1.5rem', fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary)' }}>
          {t('app_title')}
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '8px' }}>
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.user_metadata?.full_name || user.email}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button 
            className="btn" 
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', background: 'transparent' }}
            onClick={handleSignOut}
          >
            <LogOut size={20} />
            <span className="sidebar-label">{t('sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content" style={{ overflowY: 'auto' }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="properties" element={<Properties />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="contract/:id" element={<TenantContractPage />} />
            <Route path="ledger/:id" element={<TenantLedger />} />
            <Route path="all-ledgers" element={<AllTenantsLedger />} />
            <Route path="report" element={<Reports />} />
            <Route path="pivot" element={<Pivot />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Dashboard;
