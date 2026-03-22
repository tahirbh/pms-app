import moment from 'moment-hijri';
import { calculateRent } from './rentCalculator';
import type { ContractLedger } from './store';

export const generateLedgerSchedules = (
  tenantId: string,
  annualRent: number,
  startDateStr: string,
  endDateStr: string,
  paymentPlan: 'Monthly' | '3 Month' | '6 Month' | 'Yearly',
  calendarMode: 'gregorian' | 'hijri'
): Omit<ContractLedger, 'id' | 'created_at'>[] => {
  const ledgers: Omit<ContractLedger, 'id' | 'created_at'>[] = [];
  const intervalMonths = paymentPlan === 'Monthly' ? 1 : paymentPlan === '3 Month' ? 3 : paymentPlan === '6 Month' ? 6 : 12;
  
  // Format for moment parsing robustness
  const sDate = startDateStr.replace(/-/g, '/');
  const eDate = endDateStr.replace(/-/g, '/');
  
  let currentStr = sDate;
  
  while(true) {
    let nextDateStr = '';
    
    // Advance the internal chronometer by the designated interval constraint
    if (calendarMode === 'hijri') {
      const m = moment(currentStr, 'iYYYY/iMM/iDD');
      m.add(intervalMonths, 'iMonth');
      nextDateStr = m.format('iYYYY/iMM/iDD');
      
      const mEnd = moment(eDate, 'iYYYY/iMM/iDD');
      if (m.isAfter(mEnd) || m.isSame(mEnd)) {
        nextDateStr = eDate;
      }
    } else {
      const d = new Date(currentStr);
      d.setMonth(d.getMonth() + intervalMonths);
      const eD = new Date(eDate);
      
      if (d >= eD) {
        nextDateStr = eDate;
      } else {
        // Prevent JS locale formatting edge cases by forcing strict ISO padding
        nextDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    
    // Explicitly compute mathematical pro-rata yield over this exact interval
    const chunkRent = calculateRent(annualRent, currentStr, nextDateStr, calendarMode).expectedContractRent;
    
    // Filter $0 ghost chunks caused by exact date overlaps
    if (chunkRent > 0) {
      ledgers.push({
        tenantId,
        dueDate: currentStr, // The invoice effectively generates at the start of this chunk period
        amount: Math.round(chunkRent * 100) / 100,
        status: 'Pending',
        paymentMode: null,
        paidDate: null
      });
    }
    
    if (nextDateStr === eDate) break;
    currentStr = nextDateStr;
  }
  
  return ledgers;
};
