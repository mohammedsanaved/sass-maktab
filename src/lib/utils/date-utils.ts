/**
 * Formats a YYYY-MM string to a human-readable "Jan 2026" style.
 */
export const formatMonth = (monthStr: string): string => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return monthStr;
  }
};

/**
 * Formats a date to DD/MM/YYYY.
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return String(dateString);
  }
};

/**
 * Returns a YYYY-MM string from a Date object.
 */
export const getMonthStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Normalizes a date to the start of its month.
 */
export const normalizeToMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};
