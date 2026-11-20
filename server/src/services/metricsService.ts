import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (location: string) => {
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
      all(...params: unknown[]): unknown[];
      get(...params: unknown[]): unknown;
    };
    close(): void;
  };
};
import { dataStore } from '../repositories/dataStore.js';
import { AdminMetricsQuery } from '../schemas/hotelSchemas.js';
import { ValidationError } from '../errors/AppError.js';
import { BookingStatus, RoomStatus } from '@prisma/client';

export interface PropertyMetricItem {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  totalRooms: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface MetricSummary {
  totalRooms: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface DailyTrendItem {
  date: string;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface MonthlyTrendItem {
  month: string;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface DashboardMetricsResponse {
  from: string;
  to: string;
  days: number;
  overall: MetricSummary;
  properties: PropertyMetricItem[];
  dailyTrends: DailyTrendItem[];
  monthlyTrends: MonthlyTrendItem[];
}

export class MetricsService {
  private db: InstanceType<typeof DatabaseSync>;

  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL,
        room_number TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY(property_id) REFERENCES properties(id)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        status TEXT NOT NULL,
        total_inr REAL NOT NULL,
        FOREIGN KEY(room_id) REFERENCES rooms(id)
      );

      CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON bookings(status, check_in, check_out, room_id);
    `);
  }

  /**
   * Synchronizes SQLite in-memory tables from the active dataStore.
   */
  public syncFromDataStore() {
    this.db.exec(`DELETE FROM bookings; DELETE FROM rooms; DELETE FROM properties;`);

    const insertProp = this.db.prepare(
      `INSERT INTO properties (id, name, slug) VALUES (?, ?, ?)`
    );
    const insertRoom = this.db.prepare(
      `INSERT INTO rooms (id, property_id, room_number, status) VALUES (?, ?, ?, ?)`
    );
    const insertBooking = this.db.prepare(
      `INSERT INTO bookings (id, room_id, check_in, check_out, status, total_inr) VALUES (?, ?, ?, ?, ?, ?)`
    );

    // 1. Properties & Rooms
    for (const prop of dataStore.properties) {
      insertProp.run(prop.id, prop.name, prop.slug);
      for (const rt of prop.roomTypes) {
        for (const r of rt.rooms) {
          insertRoom.run(r.id, prop.id, r.roomNumber, r.status);
        }
      }
    }

    // 2. Bookings
    for (const b of dataStore.bookings) {
      const roomId = b.items?.[0]?.roomId || (b as any).roomId;
      if (!roomId) continue;

      const checkInStr =
        b.checkInDate instanceof Date
          ? b.checkInDate.toISOString().split('T')[0]
          : String(b.checkInDate).slice(0, 10);

      const checkOutStr =
        b.checkOutDate instanceof Date
          ? b.checkOutDate.toISOString().split('T')[0]
          : String(b.checkOutDate).slice(0, 10);

      insertBooking.run(b.id, roomId, checkInStr, checkOutStr, b.status, b.totalAmount);
    }
  }

  /**
   * Ingests a custom small dataset directly for deterministic unit testing.
   */
  public syncFromCustomData(
    properties: { id: string; name: string; slug: string }[],
    rooms: { id: string; propertyId: string; roomNumber: string; status?: RoomStatus }[],
    bookings: {
      id: string;
      roomId: string;
      checkIn: string;
      checkOut: string;
      status: BookingStatus;
      totalInr: number;
    }[]
  ) {
    this.db.exec(`DELETE FROM bookings; DELETE FROM rooms; DELETE FROM properties;`);

    const insertProp = this.db.prepare(
      `INSERT INTO properties (id, name, slug) VALUES (?, ?, ?)`
    );
    const insertRoom = this.db.prepare(
      `INSERT INTO rooms (id, property_id, room_number, status) VALUES (?, ?, ?, ?)`
    );
    const insertBooking = this.db.prepare(
      `INSERT INTO bookings (id, room_id, check_in, check_out, status, total_inr) VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const p of properties) {
      insertProp.run(p.id, p.name, p.slug);
    }
    for (const r of rooms) {
      insertRoom.run(r.id, r.propertyId, r.roomNumber, r.status || RoomStatus.AVAILABLE);
    }
    for (const b of bookings) {
      insertBooking.run(b.id, b.roomId, b.checkIn, b.checkOut, b.status, b.totalInr);
    }
  }

  /**
   * Executes SQL aggregations to calculate Occupancy, ADR, RevPAR, and trend series.
   */
  public getMetrics(
    query: AdminMetricsQuery,
    skipAutoSync = false
  ): DashboardMetricsResponse {
    if (!skipAutoSync) {
      this.syncFromDataStore();
    }

    // Default dates: past 30 days to today if omitted
    let fromDateStr = query.from;
    let toDateStr = query.to;

    if (!fromDateStr || !toDateStr) {
      const now = new Date();
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      fromDateStr = fromDateStr || past30.toISOString().split('T')[0];
      toDateStr = toDateStr || now.toISOString().split('T')[0];
    }

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new ValidationError('Invalid date format for from or to parameters (expected YYYY-MM-DD)');
    }

    if (toDate.getTime() <= fromDate.getTime()) {
      throw new ValidationError('to date must be after from date');
    }

    const rangeDays = Math.round(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const propertyFilter = query.propertyId || null;

    // -------------------------------------------------------------------------
    // 1. Property-level & Aggregate Metrics Query using Pure SQL Aggregation
    // -------------------------------------------------------------------------
    const propertyMetricsSql = `
      WITH date_range AS (
        SELECT
          ? AS range_from,
          ? AS range_to,
          ? AS range_days
      ),
      property_inventory AS (
        SELECT
          p.id AS property_id,
          p.name AS property_name,
          p.slug AS property_slug,
          COUNT(r.id) AS total_rooms,
          COUNT(r.id) * dr.range_days AS room_nights_available
        FROM properties p
        CROSS JOIN date_range dr
        LEFT JOIN rooms r ON r.property_id = p.id
        WHERE (? IS NULL OR p.id = ? OR p.slug = ?)
        GROUP BY p.id, p.name, p.slug, dr.range_days
      ),
      booking_nights AS (
        SELECT
          r.property_id AS property_id,
          b.id AS booking_id,
          MAX(0, CAST(julianday(MIN(b.check_out, dr.range_to)) - julianday(MAX(b.check_in, dr.range_from)) AS INT)) AS overlap_nights,
          CAST(b.total_inr AS REAL) / MAX(1, CAST(julianday(b.check_out) - julianday(b.check_in) AS INT)) AS rate_per_night
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        CROSS JOIN date_range dr
        WHERE b.status != 'CANCELLED'
          AND b.check_in < dr.range_to
          AND b.check_out > dr.range_from
          AND (? IS NULL OR r.property_id = ? OR r.property_id IN (SELECT id FROM properties WHERE slug = ?))
      )
      SELECT
        pi.property_id,
        pi.property_name,
        pi.property_slug,
        pi.total_rooms,
        pi.room_nights_available,
        COALESCE(SUM(bn.overlap_nights), 0) AS room_nights_sold,
        ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0), 2) AS room_revenue_inr,
        CASE
          WHEN pi.room_nights_available > 0
          THEN ROUND(CAST(COALESCE(SUM(bn.overlap_nights), 0) AS REAL) / pi.room_nights_available, 4)
          ELSE 0
        END AS occupancy_rate,
        CASE
          WHEN COALESCE(SUM(bn.overlap_nights), 0) > 0
          THEN ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0) / SUM(bn.overlap_nights), 2)
          ELSE 0
        END AS adr,
        CASE
          WHEN pi.room_nights_available > 0
          THEN ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0) / pi.room_nights_available, 2)
          ELSE 0
        END AS revpar
      FROM property_inventory pi
      LEFT JOIN booking_nights bn ON bn.property_id = pi.property_id
      GROUP BY pi.property_id, pi.property_name, pi.property_slug, pi.total_rooms, pi.room_nights_available
      ORDER BY pi.property_name ASC;
    `;

    const propRows = this.db
      .prepare(propertyMetricsSql)
      .all(
        fromDateStr,
        toDateStr,
        rangeDays,
        propertyFilter,
        propertyFilter,
        propertyFilter,
        propertyFilter,
        propertyFilter,
        propertyFilter
      ) as any[];

    const properties: PropertyMetricItem[] = propRows.map((row) => ({
      propertyId: row.property_id,
      propertyName: row.property_name,
      propertySlug: row.property_slug,
      totalRooms: Number(row.total_rooms),
      roomNightsAvailable: Number(row.room_nights_available),
      roomNightsSold: Number(row.room_nights_sold),
      roomRevenueInr: Number(row.room_revenue_inr),
      occupancyRate: Number(row.occupancy_rate),
      adr: Number(row.adr),
      revpar: Number(row.revpar),
    }));

    // Overall aggregate computation (rolled up from property rows or SQL)
    const overallTotalRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
    const overallAvailable = properties.reduce((acc, p) => acc + p.roomNightsAvailable, 0);
    const overallSold = properties.reduce((acc, p) => acc + p.roomNightsSold, 0);
    const overallRevenue = Math.round(
      properties.reduce((acc, p) => acc + p.roomRevenueInr, 0) * 100
    ) / 100;
    const overallOccupancy =
      overallAvailable > 0
        ? Math.round((overallSold / overallAvailable) * 10000) / 10000
        : 0;
    const overallAdr =
      overallSold > 0 ? Math.round((overallRevenue / overallSold) * 100) / 100 : 0;
    const overallRevpar =
      overallAvailable > 0
        ? Math.round((overallRevenue / overallAvailable) * 100) / 100
        : 0;

    const overall: MetricSummary = {
      totalRooms: overallTotalRooms,
      roomNightsAvailable: overallAvailable,
      roomNightsSold: overallSold,
      roomRevenueInr: overallRevenue,
      occupancyRate: overallOccupancy,
      adr: overallAdr,
      revpar: overallRevpar,
    };

    // -------------------------------------------------------------------------
    // 2. Daily Trends Query using Recursive Date Series
    // -------------------------------------------------------------------------
    const dailyTrendsSql = `
      WITH RECURSIVE
      date_range AS (
        SELECT ? AS range_from, ? AS range_to
      ),
      series(d) AS (
        SELECT range_from FROM date_range
        UNION ALL
        SELECT date(d, '+1 day') FROM series, date_range WHERE date(d, '+1 day') < date_range.range_to
      ),
      daily_inventory AS (
        SELECT
          s.d AS date_str,
          COUNT(r.id) AS room_nights_available
        FROM series s
        CROSS JOIN properties p
        LEFT JOIN rooms r ON r.property_id = p.id
        WHERE (? IS NULL OR p.id = ? OR p.slug = ?)
        GROUP BY s.d
      ),
      daily_bookings AS (
        SELECT
          s.d AS date_str,
          COUNT(b.id) AS room_nights_sold,
          COALESCE(SUM(CAST(b.total_inr AS REAL) / MAX(1, CAST(julianday(b.check_out) - julianday(b.check_in) AS INT))), 0) AS room_revenue_inr
        FROM series s
        LEFT JOIN bookings b ON b.status != 'CANCELLED'
          AND b.check_in <= s.d
          AND b.check_out > s.d
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE (? IS NULL OR r.property_id = ? OR r.property_id IN (SELECT id FROM properties WHERE slug = ?))
        GROUP BY s.d
      )
      SELECT
        di.date_str AS date,
        di.room_nights_available,
        COALESCE(db.room_nights_sold, 0) AS room_nights_sold,
        ROUND(COALESCE(db.room_revenue_inr, 0), 2) AS room_revenue_inr,
        CASE
          WHEN di.room_nights_available > 0
          THEN ROUND(CAST(COALESCE(db.room_nights_sold, 0) AS REAL) / di.room_nights_available, 4)
          ELSE 0
        END AS occupancy_rate,
        CASE
          WHEN COALESCE(db.room_nights_sold, 0) > 0
          THEN ROUND(COALESCE(db.room_revenue_inr, 0) / db.room_nights_sold, 2)
          ELSE 0
        END AS adr,
        CASE
          WHEN di.room_nights_available > 0
          THEN ROUND(COALESCE(db.room_revenue_inr, 0) / di.room_nights_available, 2)
          ELSE 0
        END AS revpar
      FROM daily_inventory di
      JOIN daily_bookings db ON db.date_str = di.date_str
      ORDER BY di.date_str ASC;
    `;

    const dailyRows = this.db
      .prepare(dailyTrendsSql)
      .all(
        fromDateStr,
        toDateStr,
        propertyFilter,
        propertyFilter,
        propertyFilter,
        propertyFilter,
        propertyFilter,
        propertyFilter
      ) as any[];

    const dailyTrends: DailyTrendItem[] = dailyRows.map((row) => ({
      date: row.date,
      roomNightsAvailable: Number(row.room_nights_available),
      roomNightsSold: Number(row.room_nights_sold),
      roomRevenueInr: Number(row.room_revenue_inr),
      occupancyRate: Number(row.occupancy_rate),
      adr: Number(row.adr),
      revpar: Number(row.revpar),
    }));

    // -------------------------------------------------------------------------
    // 3. Monthly Trends (Aggregated by YYYY-MM)
    // -------------------------------------------------------------------------
    const monthlyMap = new Map<
      string,
      { available: number; sold: number; revenue: number }
    >();

    for (const d of dailyTrends) {
      const month = d.date.substring(0, 7);
      const existing = monthlyMap.get(month) || { available: 0, sold: 0, revenue: 0 };
      existing.available += d.roomNightsAvailable;
      existing.sold += d.roomNightsSold;
      existing.revenue += d.roomRevenueInr;
      monthlyMap.set(month, existing);
    }

    const monthlyTrends: MonthlyTrendItem[] = Array.from(monthlyMap.entries()).map(
      ([month, data]) => {
        const revenue = Math.round(data.revenue * 100) / 100;
        const occupancy =
          data.available > 0
            ? Math.round((data.sold / data.available) * 10000) / 10000
            : 0;
        const adr = data.sold > 0 ? Math.round((revenue / data.sold) * 100) / 100 : 0;
        const revpar =
          data.available > 0 ? Math.round((revenue / data.available) * 100) / 100 : 0;

        return {
          month,
          roomNightsAvailable: data.available,
          roomNightsSold: data.sold,
          roomRevenueInr: revenue,
          occupancyRate: occupancy,
          adr,
          revpar,
        };
      }
    );

    return {
      from: fromDateStr,
      to: toDateStr,
      days: rangeDays,
      overall,
      properties,
      dailyTrends,
      monthlyTrends,
    };
  }
}

export const metricsService = new MetricsService();
