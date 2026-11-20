import fs from 'fs/promises';
import path from 'path';

/**
 * Parses an RFC 4180 compliant CSV string into an array of key-value objects.
 * Handles embedded commas, double quotes, and line breaks within quoted fields.
 */
export function parseCsv(csvContent: string): Record<string, string>[] {
  const content = csvContent.replace(/^\uFEFF/, ''); // Strip BOM
  if (!content.trim()) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: ""
          currentField += '"';
          i++; // Skip second quote
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Skip \n
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last field/row if content didn't end with newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  // Filter out completely empty rows
  const cleanRows = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (cleanRows.length === 0) return [];

  const headers = cleanRows[0].map((h) => h.trim());
  const dataRows = cleanRows.slice(1);

  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] !== undefined ? row[index] : '';
    });
    return record;
  });
}

/**
 * Formats an array of objects into RFC 4180 compliant CSV text.
 */
export function stringifyCsv(records: Record<string, unknown>[], customHeaders?: string[]): string {
  if (records.length === 0) return '';

  const headers = customHeaders || Object.keys(records[0]);

  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const lines = records.map((record) => headers.map((h) => escapeCell(record[h])).join(','));

  return [headerLine, ...lines].join('\n');
}

/**
 * Asynchronously reads and parses a CSV file from disk.
 */
export async function readCsvFile(filePath: string): Promise<Record<string, string>[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseCsv(content);
}

/**
 * Asynchronously writes an array of objects to a CSV file on disk.
 */
export async function writeCsvFile(
  filePath: string,
  records: Record<string, unknown>[],
  customHeaders?: string[]
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const csv = stringifyCsv(records, customHeaders);
  await fs.writeFile(filePath, csv, 'utf-8');
}
