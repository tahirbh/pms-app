import moment from 'moment-hijri';

export type RentCalculationResult = {
  activeDays: number;
  daysInBillingCycle: number;
  monthlyRent: number;
  dailyRate: number;
  currentMonthRentDue: number;
  totalContractDays: number;
  expectedContractRent: number;
};

export const calculateRent = (
  annualRent: number,
  startDate: string,
  endDate: string,
  calendarMode: 'gregorian' | 'hijri' = 'gregorian'
): RentCalculationResult => {
  if (!annualRent || !startDate || !endDate) {
    return {
      activeDays: 0,
      daysInBillingCycle: 0,
      monthlyRent: 0,
      dailyRate: 0,
      currentMonthRentDue: 0,
      totalContractDays: 0,
      expectedContractRent: 0,
    };
  }

  let activeDays = 0;
  let daysInBillingCycle = 0;
  let totalContractDays = 0;

  // Fallback if legacy tenants lack intrinsic calendar tags universally.
  const isHijri = calendarMode === 'hijri' || startDate.includes('144');
  const daysInYear = isHijri ? 354.36 : 365.25;

  if (isHijri) {
    const startM = moment(startDate.replace(/-/g, '/'), 'iYYYY/iMM/iDD');
    const leaveM = moment(endDate.replace(/-/g, '/'), 'iYYYY/iMM/iDD');

    activeDays = leaveM.iDate();
    daysInBillingCycle = moment.iDaysInMonth(leaveM.iYear(), leaveM.iMonth());
    
    totalContractDays = Math.ceil(leaveM.diff(startM, 'days'));
  } else {
    const startD = new Date(startDate);
    const leaveD = new Date(endDate);
    
    activeDays = leaveD.getDate();
    daysInBillingCycle = new Date(leaveD.getFullYear(), leaveD.getMonth() + 1, 0).getDate();
    
    const timeDiff = leaveD.getTime() - startD.getTime();
    totalContractDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Fallback safety
  if (totalContractDays < 0) totalContractDays = 0;

  const monthlyRent = annualRent / 12;
  const cycleDailyRate = monthlyRent / daysInBillingCycle;
  
  // Calculate average daily rate strictly for contract capping
  const averageDailyRate = annualRent / daysInYear;
  const expectedContractRent = Math.min(annualRent, totalContractDays * averageDailyRate);
  
  const currentMonthRentDue = activeDays * cycleDailyRate;

  return {
    activeDays,
    daysInBillingCycle,
    monthlyRent,
    dailyRate: cycleDailyRate,
    currentMonthRentDue,
    totalContractDays,
    expectedContractRent
  };
};
