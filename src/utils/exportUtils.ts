// ============================================================
// Export Utilities — Excel and CSV export/import
// ============================================================
import * as XLSX from 'xlsx';
import moment from 'moment';
import { getProperties, getTenants, getAllLedgers, getExpenses, getMyInvitations } from './store';


/** Convert an array of objects to CSV and trigger a browser download */
export const exportCSV = (data: Record<string, any>[], filename: string): void => {
  if (!data || data.length === 0) { alert('No data to export.'); return; }

  const originalKeys = Object.keys(data[0]).filter(k => k !== 'user_id' && k !== 'id');
  const keys = ['SrNo', ...originalKeys];
  const header = keys.join(',');

  const rows = data.map((row, index) =>
    keys.map(k => {
      let val;
      if (k === 'SrNo') val = index + 1;
      else val = row[k] ?? '';
      
      // Wrap in quotes if contains comma, newline, or quote
      return String(val).includes(',') || String(val).includes('\n') || String(val).includes('"')
        ? `"${String(val).replace(/"/g, '""')}"`
        : String(val);
    }).join(',')
  );

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Parse a CSV text string into an array of objects */
export const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim().replace(/^"|"$/g, ''); });
    return obj;
  });
};

/** Read a File object and return its text content */
export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });

// Helper to safely convert JSON array to Sheet, even if empty, by providing default headers
const safeJsonToSheet = (data: any[], fallbackHeaders: string[]) => {
  if (!data || data.length === 0) {
    return XLSX.utils.aoa_to_sheet([fallbackHeaders]);
  }
  return XLSX.utils.json_to_sheet(data);
};

/** Fetch all database tables and export to a single Excel file with multiple sheets */
export const exportEntireDatabaseToExcel = async (): Promise<void> => {
  // Fetch all data sets concurrently using parallel promises
  const [properties, tenants, ledgers, expenses, invitations] = await Promise.all([
    getProperties(),
    getTenants(),
    getAllLedgers(),
    getExpenses(),
    getMyInvitations()
  ]);

  // Clean data helper (remove user_id which is a system internal UUID)
  const cleanData = (rows: any[]) => {
    return rows.map(({ user_id, ...rest }) => rest);
  };

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create safe worksheets
  const propertiesSheet = safeJsonToSheet(
    cleanData(properties),
    ['id', 'name', 'address', 'annualRent', 'imageUrl', 'created_at']
  );
  const tenantsSheet = safeJsonToSheet(
    cleanData(tenants),
    ['id', 'tenantName', 'propertyId', 'startDate', 'endDate', 'calendarMode', 'paymentPlan', 'isActive', 'iqamaNumber', 'sponsorName', 'mobileNumber', 'annualRent', 'created_at']
  );
  const ledgersSheet = safeJsonToSheet(
    cleanData(ledgers),
    ['id', 'tenantId', 'dueDate', 'amount', 'status', 'paymentMode', 'paidDate', 'created_at']
  );
  const expensesSheet = safeJsonToSheet(
    cleanData(expenses),
    ['id', 'category', 'amount', 'paymentMode', 'date', 'description', 'propertyId', 'created_at']
  );
  const invitationsSheet = safeJsonToSheet(
    cleanData(invitations),
    ['id', 'invitee_email', 'status', 'created_at']
  );

  // Append worksheets
  XLSX.utils.book_append_sheet(wb, propertiesSheet, 'Properties');
  XLSX.utils.book_append_sheet(wb, tenantsSheet, 'Tenants');
  XLSX.utils.book_append_sheet(wb, ledgersSheet, 'Contract Ledgers');
  XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');
  XLSX.utils.book_append_sheet(wb, invitationsSheet, 'Invitations');

  // Format filename PMS-current date & time
  const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
  const filename = `PMS-${timestamp}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, filename);
};
