// ============================================================
// Export Utilities — CSV export and import
// ============================================================

/** Convert an array of objects to CSV and trigger a browser download */
export const exportCSV = (data: Record<string, any>[], filename: string): void => {
  if (!data || data.length === 0) { alert('No data to export.'); return; }

  const keys = Object.keys(data[0]).filter(k => k !== 'user_id'); // exclude internal field
  const header = keys.join(',');
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k] ?? '';
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
