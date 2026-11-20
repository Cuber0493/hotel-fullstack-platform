import { env } from '../config/env.js';

export interface CurrencyNormalizationResult {
  totalInr: number;
  originalAmount: number;
  originalCurrency: string;
}

export type DateResolutionResult =
  | { checkIn: Date; checkOut: Date; isSwapped: boolean }
  | { error: 'INVALID_DATE_FORMAT' | 'ZERO_NIGHT_STAY' | 'INVALID_DATE_RANGE' };

/**
 * Explicit dictionary mapping OTA abbreviations, vendor variations, and descriptive titles
 * to canonical RoomType names.
 */
export const ROOM_TYPE_ALIASES: Record<string, string> = {
  // Deluxe King
  'deluxe king': 'Deluxe King',
  'dlx king': 'Deluxe King',
  'king deluxe room': 'Deluxe King',
  'deluxe king bed': 'Deluxe King',
  'deluxe room - king bed': 'Deluxe King',
  'dlx king room': 'Deluxe King',

  // Standard Queen
  'standard queen': 'Standard Queen',
  'std queen': 'Standard Queen',
  'classic queen': 'Standard Queen',
  'queen standard room': 'Standard Queen',
  'classic queen room': 'Standard Queen',
  'std queen room': 'Standard Queen',

  // Executive Suite
  'executive suite': 'Executive Suite',
  'exec ste': 'Executive Suite',
  'exec suite': 'Executive Suite',
  'executive club suite': 'Executive Suite',
  'suite - executive': 'Executive Suite',
  'exec suite room': 'Executive Suite',

  // Sea View Heritage Suite
  'sea view heritage suite': 'Sea View Heritage Suite',
  'bay view suite': 'Sea View Heritage Suite',
  'sea view ste': 'Sea View Heritage Suite',
  'heritage ocean suite': 'Sea View Heritage Suite',
  'coastal bay suite': 'Sea View Heritage Suite',

  // Presidential Suite
  'presidential suite': 'Presidential Suite',
  'pres suite': 'Presidential Suite',
  'the governor suite': 'Presidential Suite',
  'royal presidential suite': 'Presidential Suite',

  // Canonical Property-Specific Categories (Colaba, Marine Drive, Bandra, etc.)
  'heritage grand suite': 'Heritage Grand Suite',
  'victorian deluxe': 'Victorian Deluxe',
  "queen's necklace suite": "Queen's Necklace Suite",
  'queens necklace suite': "Queen's Necklace Suite",
  'sea breeze room': 'Sea Breeze Room',
  'artist studio suite': 'Artist Studio Suite',
  'gallery loft': 'Gallery Loft',
  'garden pavilion': 'Garden Pavilion',
  'malabar verandah suite': 'Malabar Verandah Suite',
  'pali hill loft': 'Pali Hill Loft',
  'portuguese courtyard room': 'Portuguese Courtyard Room',
  'horizon penthouse': 'Horizon Penthouse',
  'coastal premier room': 'Coastal Premier Room',
  'sunset beach suite': 'Sunset Beach Suite',
  'palm terrace deluxe': 'Palm Terrace Deluxe',
  "fisherman's loft": "Fisherman's Loft",
  'fishermans loft': "Fisherman's Loft",
  'driftwood studio': 'Driftwood Studio',
  'sea link vista suite': 'Sea Link Vista Suite',
  'executive skylight': 'Executive Skylight',
  'lakeview oasis': 'Lakeview Oasis',
  'forestview studio': 'Forestview Studio',
  'executive corner suite': 'Executive Corner Suite',
  'minimalist pod deluxe': 'Minimalist Pod Deluxe',
  "governor's suite": "Governor's Suite",
  'governors suite': "Governor's Suite",
  'vault room': 'Vault Room',
  'heritage balcony room': 'Heritage Balcony Room',
  'deco garden suite': 'Deco Garden Suite',
  'sunset promenade suite': 'Sunset Promenade Suite',
  'coastal studio': 'Coastal Studio',
};

export class DataCleaningService {
  /**
   * Resolves raw room-type names using the explicit alias mapping table.
   * Returns canonical name or null if unmapped.
   */
  public mapRoomType(rawName: string): string | null {
    if (!rawName || typeof rawName !== 'string') return null;
    const normalized = rawName.trim().toLowerCase().replace(/\s+/g, ' ');
    return ROOM_TYPE_ALIASES[normalized] || null;
  }

  /**
   * Normalizes prices quoted in USD or INR into canonical INR (DECIMAL 10,2).
   * Retains the original currency code and original amount for auditing.
   */
  public normalizeCurrency(
    rawAmount: string | number,
    defaultCurrency = 'INR',
    customExchangeRate?: number
  ): CurrencyNormalizationResult | null {
    if (rawAmount === null || rawAmount === undefined) return null;

    const rate = customExchangeRate || env.USD_TO_INR_RATE || 86.5;
    const str = String(rawAmount).trim();
    if (!str) return null;

    // Detect if currency is USD
    const isUsd = str.includes('$') || /usd/i.test(str);

    // Clean numeric portion: remove $, ₹, commas, letters, whitespace
    const cleanedNumberStr = str.replace(/[$₹,a-zA-Z\s]/g, '');
    const numericValue = parseFloat(cleanedNumberStr);

    if (isNaN(numericValue) || numericValue < 0) {
      return null;
    }

    if (isUsd) {
      const originalAmount = Math.round(numericValue * 100) / 100;
      const totalInr = Math.round(originalAmount * rate * 100) / 100;
      return {
        totalInr,
        originalAmount,
        originalCurrency: 'USD',
      };
    }

    const originalAmount = Math.round(numericValue * 100) / 100;
    return {
      totalInr: originalAmount,
      originalAmount,
      originalCurrency: defaultCurrency.toUpperCase(),
    };
  }

  /**
   * Validates checkIn and checkOut dates.
   * Auto-repairs plausible typos (swaps dates if checkOut < checkIn and stay is 1-30 days).
   * Rejects invalid dates, zero-night stays, or impossible inversions.
   */
  public validateAndResolveDates(checkInStr: string, checkOutStr: string): DateResolutionResult {
    if (!checkInStr || !checkOutStr) {
      return { error: 'INVALID_DATE_FORMAT' };
    }

    const inMatch = checkInStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const outMatch = checkOutStr.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!inMatch || !outMatch) {
      return { error: 'INVALID_DATE_FORMAT' };
    }

    const inY = parseInt(inMatch[1], 10);
    const inM = parseInt(inMatch[2], 10) - 1;
    const inD = parseInt(inMatch[3], 10);

    const outY = parseInt(outMatch[1], 10);
    const outM = parseInt(outMatch[2], 10) - 1;
    const outD = parseInt(outMatch[3], 10);

    const inDateUtc = new Date(Date.UTC(inY, inM, inD));
    const outDateUtc = new Date(Date.UTC(outY, outM, outD));

    if (isNaN(inDateUtc.getTime()) || isNaN(outDateUtc.getTime())) {
      return { error: 'INVALID_DATE_FORMAT' };
    }

    const diffMs = outDateUtc.getTime() - inDateUtc.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (diffMs === 0) {
      return { error: 'ZERO_NIGHT_STAY' };
    }

    if (diffMs > 0) {
      return { checkIn: inDateUtc, checkOut: outDateUtc, isSwapped: false };
    }

    // Inverted dates: checkOut is before checkIn
    const reversedDays = Math.round(Math.abs(diffMs) / dayMs);
    if (reversedDays >= 1 && reversedDays <= 30) {
      // Human typo swap (e.g. user selected check-out in the first date field)
      return {
        checkIn: outDateUtc,
        checkOut: inDateUtc,
        isSwapped: true,
      };
    }

    return { error: 'INVALID_DATE_RANGE' };
  }

  /**
   * Validates guest email address format.
   */
  public validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length < 5 || trimmed.length > 254) return false;
    // Standard RFC-like email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  }

  /**
   * Validates guest review ratings: must be integer 1 to 5.
   */
  public validateRating(ratingVal: string | number): number | null {
    if (ratingVal === null || ratingVal === undefined) return null;
    const num = Number(ratingVal);
    if (!Number.isInteger(num)) return null;
    if (num < 1 || num > 5) return null;
    return num;
  }

  /**
   * Validates total guest count (1-10 guests).
   */
  public validateGuestCount(guestsVal: string | number): number {
    const num = Number(guestsVal);
    if (isNaN(num) || num < 1) return 1;
    return Math.min(Math.floor(num), 10);
  }
}

export const dataCleaningService = new DataCleaningService();
