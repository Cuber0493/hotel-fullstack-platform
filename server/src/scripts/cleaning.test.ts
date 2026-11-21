import { describe, it, expect, beforeEach } from 'vitest';
import { dataCleaningService } from '../services/dataCleaningService.js';
import { runDataImportPipeline } from './import.js';
import { generateRawCsvs } from './generateRawData.js';
import { readCsvFile } from '../utils/csvUtils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REJECTED_FILE = path.resolve(__dirname, '../../data/rejected.csv');

describe('Data Cleaning & Ingestion Pipeline Rules', () => {
  describe('Rule 1: Canonical Room-Type Alias Mapping', () => {
    it('maps common OTA variations and abbreviations to canonical names', () => {
      expect(dataCleaningService.mapRoomType('DLX King')).toBe('Deluxe King');
      expect(dataCleaningService.mapRoomType('King Deluxe Room')).toBe('Deluxe King');
      expect(dataCleaningService.mapRoomType('deluxe room - king bed')).toBe('Deluxe King');
      expect(dataCleaningService.mapRoomType('STD Queen')).toBe('Standard Queen');
      expect(dataCleaningService.mapRoomType('Classic Queen Room')).toBe('Standard Queen');
      expect(dataCleaningService.mapRoomType('Exec Ste')).toBe('Executive Suite');
      expect(dataCleaningService.mapRoomType('Suite - Executive')).toBe('Executive Suite');
      expect(dataCleaningService.mapRoomType('Pres Suite')).toBe('Presidential Suite');
      expect(dataCleaningService.mapRoomType('Queens Necklace Suite')).toBe("Queen's Necklace Suite");
    });

    it('handles case-insensitivity, leading/trailing whitespace, and extra spaces', () => {
      expect(dataCleaningService.mapRoomType('   dlx   king   ')).toBe('Deluxe King');
      expect(dataCleaningService.mapRoomType('EXEC SUITE')).toBe('Executive Suite');
      expect(dataCleaningService.mapRoomType('\tclassic queen\n')).toBe('Standard Queen');
    });

    it('returns null for unrecognized or arbitrary room names to trigger quarantine', () => {
      expect(dataCleaningService.mapRoomType('Bunk Bed Dormitory')).toBeNull();
      expect(dataCleaningService.mapRoomType('Tent on Rooftop')).toBeNull();
      expect(dataCleaningService.mapRoomType('')).toBeNull();
    });
  });

  describe('Rule 2: Currency Normalization (USD to Canonical INR)', () => {
    const fixedRate = 86.5;

    it('converts dollar formatted values ($150) to INR at the specified exchange rate', () => {
      const result = dataCleaningService.normalizeCurrency('$150', 'INR', fixedRate);
      expect(result).not.toBeNull();
      expect(result!.originalCurrency).toBe('USD');
      expect(result!.originalAmount).toBe(150);
      expect(result!.totalInr).toBe(Math.round(150 * 86.5 * 100) / 100); // 12975
    });

    it('converts USD suffix string ("120 USD") to INR with decimal precision', () => {
      const result = dataCleaningService.normalizeCurrency('120.50 USD', 'INR', fixedRate);
      expect(result).not.toBeNull();
      expect(result!.originalCurrency).toBe('USD');
      expect(result!.originalAmount).toBe(120.5);
      expect(result!.totalInr).toBe(Math.round(120.5 * 86.5 * 100) / 100); // 10423.25
    });

    it('normalizes domestic INR prices with symbols and comma formatting', () => {
      const result1 = dataCleaningService.normalizeCurrency('₹14,500');
      expect(result1).not.toBeNull();
      expect(result1!.originalCurrency).toBe('INR');
      expect(result1!.originalAmount).toBe(14500);
      expect(result1!.totalInr).toBe(14500);

      const result2 = dataCleaningService.normalizeCurrency('18500 INR');
      expect(result2!.totalInr).toBe(18500);

      const result3 = dataCleaningService.normalizeCurrency('12000');
      expect(result3!.totalInr).toBe(12000);
    });

    it('returns null for negative rates or invalid non-numeric strings', () => {
      expect(dataCleaningService.normalizeCurrency('-500')).toBeNull();
      expect(dataCleaningService.normalizeCurrency('Free Stay Promo')).toBeNull();
      expect(dataCleaningService.normalizeCurrency('')).toBeNull();
    });
  });

  describe('Rule 3: Check-In / Check-Out Validation and Auto-Swap', () => {
    it('accepts standard valid date sequences without swapping', () => {
      const res = dataCleaningService.validateAndResolveDates('2026-10-10', '2026-10-14');
      expect('error' in res).toBe(false);
      if (!('error' in res)) {
        expect(res.isSwapped).toBe(false);
        expect(res.checkIn.toISOString().startsWith('2026-10-10')).toBe(true);
        expect(res.checkOut.toISOString().startsWith('2026-10-14')).toBe(true);
      }
    });

    it('auto-repairs human calendar typo when checkOut is before checkIn (1 to 30 days)', () => {
      // User accidentally entered check-out date first (inverted by 4 days)
      const res = dataCleaningService.validateAndResolveDates('2026-10-14', '2026-10-10');
      expect('error' in res).toBe(false);
      if (!('error' in res)) {
        expect(res.isSwapped).toBe(true);
        expect(res.checkIn.toISOString().startsWith('2026-10-10')).toBe(true);
        expect(res.checkOut.toISOString().startsWith('2026-10-14')).toBe(true);
      }
    });

    it('quarantines same-day / zero-night bookings with ZERO_NIGHT_STAY', () => {
      const res = dataCleaningService.validateAndResolveDates('2026-10-10', '2026-10-10');
      expect('error' in res).toBe(true);
      if ('error' in res) {
        expect(res.error).toBe('ZERO_NIGHT_STAY');
      }
    });

    it('quarantines inverted dates where difference exceeds plausible human typo (>30 days)', () => {
      const res = dataCleaningService.validateAndResolveDates('2026-10-10', '2026-06-10');
      expect('error' in res).toBe(true);
      if ('error' in res) {
        expect(res.error).toBe('INVALID_DATE_RANGE');
      }
    });

    it('quarantines malformed date strings with INVALID_DATE_FORMAT', () => {
      const res = dataCleaningService.validateAndResolveDates('not-a-date', '2026-10-10');
      expect('error' in res).toBe(true);
      if ('error' in res) {
        expect(res.error).toBe('INVALID_DATE_FORMAT');
      }
    });
  });

  describe('Rule 4: Guest Email Validation', () => {
    it('validates standard email addresses correctly', () => {
      expect(dataCleaningService.validateEmail('guest@example.com')).toBe(true);
      expect(dataCleaningService.validateEmail('ananya.mehta@bombayreserve.in')).toBe(true);
    });

    it('rejects missing, empty, or syntactically invalid emails', () => {
      expect(dataCleaningService.validateEmail('')).toBe(false);
      expect(dataCleaningService.validateEmail('no-email-provided')).toBe(false);
      expect(dataCleaningService.validateEmail('guest@com')).toBe(false);
      expect(dataCleaningService.validateEmail('@example.com')).toBe(false);
      expect(dataCleaningService.validateEmail(null as unknown as string)).toBe(false);
    });
  });

  describe('Rule 5: Review Rating Boundaries (1 to 5)', () => {
    it('accepts integer ratings within 1 to 5', () => {
      expect(dataCleaningService.validateRating('1')).toBe(1);
      expect(dataCleaningService.validateRating(3)).toBe(3);
      expect(dataCleaningService.validateRating(5)).toBe(5);
    });

    it('rejects ratings outside 1 to 5 or fractional values', () => {
      expect(dataCleaningService.validateRating(0)).toBeNull();
      expect(dataCleaningService.validateRating(-1)).toBeNull();
      expect(dataCleaningService.validateRating(6)).toBeNull();
      expect(dataCleaningService.validateRating(10)).toBeNull();
      expect(dataCleaningService.validateRating(4.5)).toBeNull();
      expect(dataCleaningService.validateRating('five')).toBeNull();
    });
  });

  describe('End-to-End Pipeline & Idempotency', () => {
    beforeEach(async () => {
      // Ensure raw CSVs exist
      await generateRawCsvs();
    });

    it('processes raw datasets, repairs typos, quarantines bad rows to rejected.csv, and reports metrics', async () => {
      const metrics = await runDataImportPipeline();

      // Verified expectations
      expect(metrics.properties.imported).toBe(14);
      expect(metrics.rooms.imported).toBeGreaterThanOrEqual(80);
      expect(metrics.bookings.read).toBeGreaterThanOrEqual(3000);
      expect(metrics.bookings.imported).toBeGreaterThan(2500);
      expect(metrics.bookings.fixed).toBeGreaterThan(0); // Typos repaired
      expect(metrics.bookings.rejected).toBeGreaterThan(0); // Anomaly rows quarantined

      // Check rejected.csv output on disk
      const rejectedRows = await readCsvFile(REJECTED_FILE);
      expect(rejectedRows.length).toBeGreaterThan(0);
      expect(rejectedRows[0].rejectionReason).toBeDefined();

      const reasonsFound = new Set(rejectedRows.map((r) => r.rejectionReason));
      expect(reasonsFound.has('MISSING_OR_INVALID_EMAIL')).toBe(true);
      expect(reasonsFound.has('RATING_OUT_OF_RANGE')).toBe(true);
    });

    it('is idempotent: running the import pipeline a second time produces identical metrics without duplicating data', async () => {
      const run1 = await runDataImportPipeline();
      const run2 = await runDataImportPipeline();

      expect(run2.totalImported).toBe(run1.totalImported);
      expect(run2.totalRejected).toBe(run1.totalRejected);
      expect(run2.totalFixed).toBe(run1.totalFixed);
    }, 20000);
  });
});
