import path from 'path';
import { fileURLToPath } from 'url';
import { readCsvFile, writeCsvFile } from '../utils/csvUtils.js';
import { dataCleaningService } from '../services/dataCleaningService.js';
import { prisma, checkDatabaseConnection } from '../lib/prisma.js';
import { BookingStatus, RoomStatus } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const REJECTED_FILE = path.join(DATA_DIR, 'rejected.csv');

export interface RejectedRecord {
  [key: string]: unknown;
  dataset: string;
  recordId: string;
  identifier: string;
  rejectionReason: string;
  rawPayload: string;
  timestamp: string;
}

export interface ImportReportMetrics {
  properties: { read: number; imported: number; fixed: number; rejected: number };
  rooms: { read: number; imported: number; fixed: number; rejected: number };
  bookings: { read: number; imported: number; fixed: number; rejected: number };
  reviews: { read: number; imported: number; fixed: number; rejected: number };
  totalRead: number;
  totalImported: number;
  totalFixed: number;
  totalRejected: number;
  cleanYieldPercentage: string;
  rejectedReasons: Record<string, number>;
}

export async function runDataImportPipeline(): Promise<ImportReportMetrics> {
  const rejectedRecords: RejectedRecord[] = [];
  const rejectedReasons: Record<string, number> = {};

  const recordRejection = (dataset: string, recordId: string, identifier: string, reason: string, rawPayload: unknown) => {
    rejectedReasons[reason] = (rejectedReasons[reason] || 0) + 1;
    rejectedRecords.push({
      dataset,
      recordId,
      identifier,
      rejectionReason: reason,
      rawPayload: typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload),
      timestamp: new Date().toISOString(),
    });
  };

  const metrics: ImportReportMetrics = {
    properties: { read: 0, imported: 0, fixed: 0, rejected: 0 },
    rooms: { read: 0, imported: 0, fixed: 0, rejected: 0 },
    bookings: { read: 0, imported: 0, fixed: 0, rejected: 0 },
    reviews: { read: 0, imported: 0, fixed: 0, rejected: 0 },
    totalRead: 0,
    totalImported: 0,
    totalFixed: 0,
    totalRejected: 0,
    cleanYieldPercentage: '0.00%',
    rejectedReasons,
  };

  // 1. Read Raw Datasets
  const rawProperties = await readCsvFile(path.join(RAW_DIR, 'properties.csv')).catch(() => []);
  const rawRooms = await readCsvFile(path.join(RAW_DIR, 'rooms.csv')).catch(() => []);
  const rawBookings = await readCsvFile(path.join(RAW_DIR, 'bookings.csv')).catch(() => []);
  const rawReviews = await readCsvFile(path.join(RAW_DIR, 'reviews.csv')).catch(() => []);

  metrics.properties.read = rawProperties.length;
  metrics.rooms.read = rawRooms.length;
  metrics.bookings.read = rawBookings.length;
  metrics.reviews.read = rawReviews.length;

  const isPostgresConnected = await checkDatabaseConnection();
  const importedProperties: any[] = [];

  // 2. Process Properties (Upsert by slug)
  for (const rawProp of rawProperties) {
    if (!rawProp.name || !rawProp.id) {
      recordRejection('properties', rawProp.id || 'unknown', rawProp.name || '', 'MISSING_REQUIRED_FIELDS', rawProp);
      metrics.properties.rejected++;
      continue;
    }

    const propSlug = rawProp.id.replace('prop-', '');
    const propData = {
      id: rawProp.id,
      slug: propSlug,
      name: rawProp.name,
      city: 'Mumbai',
      neighborhood: rawProp.address.split(',')[1]?.trim() || 'Mumbai Central',
      address: rawProp.address,
      description: rawProp.description,
      heroImage: rawProp.imageUrls.split(';')[0] || '',
      galleryImages: rawProp.imageUrls.split(';'),
      amenities: rawProp.amenities.split(';'),
      checkInTime: '14:00',
      checkOutTime: '11:00',
      contactPhone: '+91 22 6900 1100',
      contactEmail: `concierge@${propSlug}.bombayreserve.com`,
    };

    if (isPostgresConnected) {
      await prisma.property.upsert({
        where: { slug: propSlug },
        update: propData,
        create: propData,
      });
    }

    importedProperties.push(propData);
    metrics.properties.imported++;
  }

  // 3. Process Rooms & Map Canonical Room Types
  const propertyRoomTypesMap = new Map<string, Map<string, any>>();
  const importedRoomsMap = new Map<string, any>();

  for (const rawRoom of rawRooms) {
    const canonicalRtName = dataCleaningService.mapRoomType(rawRoom.roomType);
    if (!canonicalRtName) {
      recordRejection('rooms', rawRoom.id, rawRoom.roomType, 'UNKNOWN_ROOM_TYPE_ALIAS', rawRoom);
      metrics.rooms.rejected++;
      continue;
    }

    if (canonicalRtName !== rawRoom.roomType) {
      metrics.rooms.fixed++;
    }

    const property = importedProperties.find((p) => p.id === rawRoom.propertyId);
    if (!property) {
      recordRejection('rooms', rawRoom.id, rawRoom.propertyId, 'PROPERTY_NOT_FOUND', rawRoom);
      metrics.rooms.rejected++;
      continue;
    }

    // Ensure RoomType exists on property
    if (!propertyRoomTypesMap.has(property.id)) {
      propertyRoomTypesMap.set(property.id, new Map());
    }
    const propTypes = propertyRoomTypesMap.get(property.id)!;

    let roomType = propTypes.get(canonicalRtName);
    if (!roomType) {
      const rtSlug = canonicalRtName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const baseRateParsed = parseFloat(rawRoom.baseRate) || 12000;
      roomType = {
        id: `rt-${property.slug}-${rtSlug}`,
        propertyId: property.id,
        slug: rtSlug,
        name: canonicalRtName,
        canonicalName: canonicalRtName,
        description: `Exquisitely appointed ${canonicalRtName} featuring handcrafted Bombay artisan decor and bespoke linens.`,
        basePrice: baseRateParsed,
        baseRateInr: baseRateParsed,
        maxGuests: canonicalRtName.toLowerCase().includes('suite') ? 4 : 2,
        capacity: canonicalRtName.toLowerCase().includes('suite') ? 4 : 2,
        bedCount: canonicalRtName.toLowerCase().includes('suite') ? 2 : 1,
        bedType: canonicalRtName.toLowerCase().includes('queen') ? 'Queen Bed' : 'King Bed',
        roomSizeSqFt: canonicalRtName.toLowerCase().includes('suite') ? 650 : 380,
        amenities: ['Air Conditioning', 'High Speed Wi-Fi', 'Ensuite Rain Shower', 'Espresso Machine'],
        images: property.galleryImages,
        totalInventory: 2,
      };

      if (isPostgresConnected) {
        await prisma.roomType.upsert({
          where: {
            propertyId_canonicalName: {
              propertyId: property.id,
              canonicalName: canonicalRtName,
            },
          },
          update: roomType,
          create: roomType,
        });
      }

      propTypes.set(canonicalRtName, roomType);
    }

    const roomData = {
      id: rawRoom.id,
      propertyId: property.id,
      roomTypeId: roomType.id,
      roomNumber: rawRoom.roomNumber,
      floor: `${rawRoom.roomNumber.charAt(0)}th Floor`,
      status: RoomStatus.AVAILABLE,
    };

    if (isPostgresConnected) {
      await prisma.room.upsert({
        where: {
          propertyId_roomNumber: {
            propertyId: property.id,
            roomNumber: rawRoom.roomNumber,
          },
        },
        update: roomData,
        create: roomData,
      });
    }

    importedRoomsMap.set(`${property.id}-${rawRoom.roomNumber}`, roomData);
    metrics.rooms.imported++;
  }

  // 4. Process Bookings (Deduplication, Currency, Date, and Postgres Upsert)
  const seenBookingCodes = new Set<string>();

  for (const rawBooking of rawBookings) {
    // Check 1: Deduplication
    if (seenBookingCodes.has(rawBooking.bookingCode)) {
      recordRejection('bookings', rawBooking.id, rawBooking.bookingCode, 'DUPLICATE_BOOKING_CODE', rawBooking);
      metrics.bookings.rejected++;
      continue;
    }

    // Check 2: Email validation
    if (!dataCleaningService.validateEmail(rawBooking.guestEmail)) {
      recordRejection('bookings', rawBooking.id, rawBooking.guestEmail, 'MISSING_OR_INVALID_EMAIL', rawBooking);
      metrics.bookings.rejected++;
      continue;
    }

    // Check 3: Date validation & typo auto-swap
    const dateResult = dataCleaningService.validateAndResolveDates(rawBooking.checkIn, rawBooking.checkOut);
    if ('error' in dateResult) {
      recordRejection('bookings', rawBooking.id, `${rawBooking.checkIn} to ${rawBooking.checkOut}`, dateResult.error, rawBooking);
      metrics.bookings.rejected++;
      continue;
    }

    if (dateResult.isSwapped) {
      metrics.bookings.fixed++;
    }

    // Check 4: Currency normalization
    const currencyResult = dataCleaningService.normalizeCurrency(rawBooking.rate);
    if (!currencyResult) {
      recordRejection('bookings', rawBooking.id, rawBooking.rate, 'INVALID_RATE_AMOUNT', rawBooking);
      metrics.bookings.rejected++;
      continue;
    }

    if (currencyResult.originalCurrency === 'USD') {
      metrics.bookings.fixed++;
    }

    seenBookingCodes.add(rawBooking.bookingCode);

    // Link Room
    const targetRoom = importedRoomsMap.get(`${rawBooking.propertyId}-${rawBooking.roomNumber}`);
    const validGuests = dataCleaningService.validateGuestCount(rawBooking.guests);

    if (isPostgresConnected) {
      await prisma.booking.upsert({
        where: { bookingCode: rawBooking.bookingCode },
        update: {
          guestName: rawBooking.guestName,
          guestEmail: rawBooking.guestEmail.toLowerCase().trim(),
          guestPhone: rawBooking.guestPhone,
          checkIn: dateResult.checkIn,
          checkOut: dateResult.checkOut,
          checkInDate: dateResult.checkIn,
          checkOutDate: dateResult.checkOut,
          totalGuests: validGuests,
          totalAmount: currencyResult.totalInr,
          totalInr: currencyResult.totalInr,
          originalAmount: currencyResult.totalInr,
          status: (rawBooking.status as BookingStatus) || BookingStatus.CONFIRMED,
          roomId: targetRoom?.id || null,
        },
        create: {
          id: rawBooking.id,
          bookingCode: rawBooking.bookingCode,
          guestName: rawBooking.guestName,
          guestEmail: rawBooking.guestEmail.toLowerCase().trim(),
          guestPhone: rawBooking.guestPhone,
          checkIn: dateResult.checkIn,
          checkOut: dateResult.checkOut,
          checkInDate: dateResult.checkIn,
          checkOutDate: dateResult.checkOut,
          totalGuests: validGuests,
          totalAmount: currencyResult.totalInr,
          totalInr: currencyResult.totalInr,
          originalAmount: currencyResult.totalInr,
          status: (rawBooking.status as BookingStatus) || BookingStatus.CONFIRMED,
          roomId: targetRoom?.id || null,
        },
      });
    }

    metrics.bookings.imported++;
  }

  // 5. Process Reviews
  for (const rawReview of rawReviews) {
    const validRating = dataCleaningService.validateRating(rawReview.rating);
    if (!validRating) {
      recordRejection('reviews', rawReview.id, `rating=${rawReview.rating}`, 'RATING_OUT_OF_RANGE', rawReview);
      metrics.reviews.rejected++;
      continue;
    }

    metrics.reviews.imported++;
  }

  // Compute Overall Totals
  metrics.totalRead = metrics.properties.read + metrics.rooms.read + metrics.bookings.read + metrics.reviews.read;
  metrics.totalImported = metrics.properties.imported + metrics.rooms.imported + metrics.bookings.imported + metrics.reviews.imported;
  metrics.totalFixed = metrics.properties.fixed + metrics.rooms.fixed + metrics.bookings.fixed + metrics.reviews.fixed;
  metrics.totalRejected = metrics.properties.rejected + metrics.rooms.rejected + metrics.bookings.rejected + metrics.reviews.rejected;

  if (metrics.totalRead > 0) {
    const yieldNum = (metrics.totalImported / metrics.totalRead) * 100;
    metrics.cleanYieldPercentage = `${yieldNum.toFixed(2)}%`;
  }

  // Write Quarantined Records to /server/data/rejected.csv
  await writeCsvFile(REJECTED_FILE, rejectedRecords, [
    'dataset',
    'recordId',
    'identifier',
    'rejectionReason',
    'rawPayload',
    'timestamp',
  ]);

  // Print Formatted Audit Report
  printImportReport(metrics, REJECTED_FILE);

  return metrics;
}

export function printImportReport(metrics: ImportReportMetrics, rejectedFilePath: string) {
  const line = '='.repeat(82);
  const subLine = '-'.repeat(82);

  console.log(`\n${line}`);
  console.log('              THE BOMBAY RESERVE - DATA IMPORT & CLEANING REPORT');
  console.log(line);
  console.log('Dataset         Read        Imported       Fixed (Repaired)   Rejected (Quarantined)');
  console.log(subLine);
  console.log(`Properties    ${String(metrics.properties.read).padStart(6)}      ${String(metrics.properties.imported).padStart(9)}      ${String(metrics.properties.fixed).padStart(12)}      ${String(metrics.properties.rejected).padStart(15)}`);
  console.log(`Rooms         ${String(metrics.rooms.read).padStart(6)}      ${String(metrics.rooms.imported).padStart(9)}      ${String(metrics.rooms.fixed).padStart(12)}      ${String(metrics.rooms.rejected).padStart(15)}`);
  console.log(`Bookings      ${String(metrics.bookings.read).padStart(6)}      ${String(metrics.bookings.imported).padStart(9)}      ${String(metrics.bookings.fixed).padStart(12)}      ${String(metrics.bookings.rejected).padStart(15)}`);
  console.log(`Reviews       ${String(metrics.reviews.read).padStart(6)}      ${String(metrics.reviews.imported).padStart(9)}      ${String(metrics.reviews.fixed).padStart(12)}      ${String(metrics.reviews.rejected).padStart(15)}`);
  console.log(subLine);
  console.log(`Total Rows:   ${String(metrics.totalRead).padStart(6)}      ${String(metrics.totalImported).padStart(9)}      ${String(metrics.totalFixed).padStart(12)}      ${String(metrics.totalRejected).padStart(15)}`);
  console.log(`Overall Clean Data Yield: ${metrics.cleanYieldPercentage}`);
  console.log(`\nBreakdown of Quarantined Records (written to ${rejectedFilePath}):`);

  for (const [reason, count] of Object.entries(metrics.rejectedReasons)) {
    console.log(`- ${reason.padEnd(28)}: ${count}`);
  }
  console.log(`${line}\n`);
}

// Execute if run directly from terminal
if (process.argv[1] && process.argv[1].endsWith('import.ts')) {
  runDataImportPipeline().catch((err) => {
    console.error('Data import pipeline failed:', err);
    process.exit(1);
  });
}
