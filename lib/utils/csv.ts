/**
 * Sanitize a CSV cell value to prevent CSV injection attacks.
 * Cells starting with =, +, -, @, \t, or \r are prefixed with a single quote
 * to prevent spreadsheet formula execution.
 */
export function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If the cell starts with a character that could trigger formula execution, prefix with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Sanitize and quote a CSV cell value, wrapping in double quotes and escaping internal quotes.
 */
export function sanitizeCsvQuotedCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const sanitized = sanitizeCsvCell(value);
  return `"${sanitized.replace(/"/g, '""')}"`;
}
