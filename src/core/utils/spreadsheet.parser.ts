import * as XLSX from 'xlsx';
import { BadRequestException } from '@nestjs/common';

export interface ParsedRow {
  [key: string]: string;
}

export interface BulkUploadResult {
  inserted: number;
  skippedDuplicates: number;
  invalidRows: Array<{ row: number; errors: string[] }>;
}

/** Normalise a spreadsheet column header → snake_case lowercase. */
const normaliseKey = (key: string): string =>
  key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

/**
 * Parse an XLSX or CSV buffer into an array of row objects.
 * Column headers are normalised to snake_case.
 * Throws BadRequestException if required headers are missing or the sheet is empty.
 */
export function parseSpreadsheet(
  buffer: Buffer,
  requiredHeaders: string[],
): ParsedRow[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  } catch {
    throw new BadRequestException(
      'Could not read the file. Make sure it is a valid .xlsx or .csv file.',
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestException('The spreadsheet has no sheets.');
  }

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: '', raw: false },
  );

  if (raw.length === 0) {
    throw new BadRequestException(
      'The spreadsheet is empty or contains only a header row.',
    );
  }

  const rows: ParsedRow[] = raw.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        normaliseKey(k),
        String(v ?? '').trim(),
      ]),
    ),
  );

  const foundKeys = Object.keys(rows[0] ?? {});
  const missing = requiredHeaders.filter((h) => !foundKeys.includes(h));
  if (missing.length > 0) {
    throw new BadRequestException(
      `Missing required column(s): ${missing.join(', ')}. ` +
        `Columns found: ${foundKeys.join(', ')}.`,
    );
  }

  return rows;
}

/**
 * De-duplicate rows by a given field (e.g. phone_number).
 * Empty values are treated as invalid and excluded.
 * Returns unique rows and the count of in-file duplicates skipped.
 */
export function deduplicateRows(
  rows: ParsedRow[],
  field: string,
): { unique: ParsedRow[]; duplicatesInFile: number } {
  const seen = new Set<string>();
  const unique: ParsedRow[] = [];
  let duplicatesInFile = 0;

  for (const row of rows) {
    const val = row[field]?.trim().toLowerCase();
    if (!val) {
      duplicatesInFile++;
      continue;
    }
    if (seen.has(val)) {
      duplicatesInFile++;
    } else {
      seen.add(val);
      unique.push(row);
    }
  }

  return { unique, duplicatesInFile };
}
