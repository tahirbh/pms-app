// ============================================================
// Export Utilities — Excel and CSV export/import
// ============================================================
import * as XLSX from 'xlsx';
import moment from 'moment';
import { getProperties, getTenants, getAllLedgers, getExpenses } from './store';


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

/** Fetch all database tables and export to a single Excel file with multiple sheets (resolved and anonymized UUIDs) */
export const exportEntireDatabaseToExcel = async (): Promise<void> => {
  // Fetch only the properties, tenants, ledgers, and expenses (omitting invitations)
  const [properties, tenants, ledgers, expenses] = await Promise.all([
    getProperties(),
    getTenants(),
    getAllLedgers(),
    getExpenses()
  ]);

  // Create lookup maps for resolving IDs to human-readable names
  const propertyMap = new Map<string, string>();
  properties.forEach(p => {
    if (p.id && p.name) propertyMap.set(p.id, p.name);
  });

  const tenantMap = new Map<string, string>();
  tenants.forEach(t => {
    if (t.id && t.tenantName) tenantMap.set(t.id, t.tenantName);
  });

  // Map to clean datasets with reader-friendly column keys (excluding raw primary UUIDs)
  const propertiesData = properties.map(p => ({
    'Property Name': p.name,
    'Address': p.address,
    'Annual Rent': p.annualRent,
    'Image URL': p.imageUrl || '',
    'Created At': p.created_at ? moment(p.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
  }));

  const tenantsData = tenants.map(t => ({
    'Tenant Name': t.tenantName,
    'Property': propertyMap.get(t.propertyId) || 'Unknown',
    'Start Date': t.startDate,
    'End Date': t.endDate,
    'Calendar Mode': t.calendarMode,
    'Payment Plan': t.paymentPlan,
    'Is Active': t.isActive ? 'Yes' : 'No',
    'Iqama Number': t.iqamaNumber || '',
    'Sponsor Name': t.sponsorName || '',
    'Mobile Number': t.mobileNumber || '',
    'Annual Rent': t.annualRent || '',
    'Created At': t.created_at ? moment(t.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
  }));

  const ledgersData = ledgers.map(l => ({
    'Tenant': tenantMap.get(l.tenantId) || 'Unknown',
    'Due Date': l.dueDate,
    'Amount': l.amount,
    'Status': l.status,
    'Payment Mode': l.paymentMode || '',
    'Paid Date': l.paidDate || '',
    'Created At': l.created_at ? moment(l.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
  }));

  const expensesData = expenses.map(e => ({
    'Category': e.category,
    'Amount': e.amount,
    'Payment Mode': e.paymentMode,
    'Date': e.date,
    'Description': e.description || '',
    'Property': e.propertyId ? (propertyMap.get(e.propertyId) || 'Unknown') : 'All Properties',
    'Created At': e.created_at ? moment(e.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create safe worksheets with human-readable fallback headers
  const propertiesSheet = safeJsonToSheet(
    propertiesData,
    ['Property Name', 'Address', 'Annual Rent', 'Image URL', 'Created At']
  );
  const tenantsSheet = safeJsonToSheet(
    tenantsData,
    ['Tenant Name', 'Property', 'Start Date', 'End Date', 'Calendar Mode', 'Payment Plan', 'Is Active', 'Iqama Number', 'Sponsor Name', 'Mobile Number', 'Annual Rent', 'Created At']
  );
  const ledgersSheet = safeJsonToSheet(
    ledgersData,
    ['Tenant', 'Due Date', 'Amount', 'Status', 'Payment Mode', 'Paid Date', 'Created At']
  );
  const expensesSheet = safeJsonToSheet(
    expensesData,
    ['Category', 'Amount', 'Payment Mode', 'Date', 'Description', 'Property', 'Created At']
  );

  // Append worksheets (excluding Invitations)
  XLSX.utils.book_append_sheet(wb, propertiesSheet, 'Properties');
  XLSX.utils.book_append_sheet(wb, tenantsSheet, 'Tenants');
  XLSX.utils.book_append_sheet(wb, ledgersSheet, 'Contract Ledgers');
  XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');

  // Format filename PMS-current date & time
  const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
  const filename = `PMS-${timestamp}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, filename);
};
