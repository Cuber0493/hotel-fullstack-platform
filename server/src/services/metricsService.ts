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

import { prisma } from '../lib/prisma.js';
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
  private customDb: InstanceType<typeof DatabaseSync> | null = null;
  private isCustomMode = false;

  private getOrInitCustomDb() {
    if (!this.customDb) {
      this.customDb = new DatabaseSync(':memory:');
      this.customDb.exec(`
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
    return this.customDb;
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
    const db = this.getOrInitCustomDb();
    this.isCustomMode = true;
    db.exec(`DELETE FROM bookings; DELETE FROM rooms; DELETE FROM properties;`);

    const insertProp = db.prepare(
      `INSERT INTO properties (id, name, slug) VALUES (?, ?, ?)`
    );
    const insertRoom = db.prepare(
      `INSERT INTO rooms (id, property_id, room_number, status) VALUES (?, ?, ?, ?)`
    );
    const insertBooking = db.prepare(
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
  public async getMetrics(
    query: AdminMetricsQuery,
    skipAutoSync = false
  ): Promise<DashboardMetricsResponse> {
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

    if (this.isCustomMode) {
      return this.getCustomDbMetrics(fromDateStr, toDateStr, rangeDays, propertyFilter);
    }

    // -------------------------------------------------------------------------
    // PostgreSQL Direct SQL Aggregation via Prisma ($queryRaw)
    // -------------------------------------------------------------------------
    const propRows = await prisma.$queryRaw<any[]>`
      WITH date_range AS (
        SELECT
          ${fromDateStr}::date AS range_from,
          ${toDateStr}::date AS range_to,
          ${rangeDays}::int AS range_days
      ),
      property_inventory AS (
        SELECT
          p.id AS property_id,
          p.name AS property_name,
          p.slug AS property_slug,
          COUNT(r.id)::int AS total_rooms,
          (COUNT(r.id) * dr.range_days)::int AS room_nights_available
        FROM properties p
        CROSS JOIN date_range dr
        LEFT JOIN rooms r ON r."propertyId" = p.id
        WHERE (${propertyFilter}::text IS NULL OR p.id = ${propertyFilter} OR p.slug = ${propertyFilter})
        GROUP BY p.id, p.name, p.slug, dr.range_days
      ),
      booking_nights AS (
        SELECT
          r."propertyId" AS property_id,
          b.id AS booking_id,
          GREATEST(0, (LEAST(b."checkOutDate", dr.range_to) - GREATEST(b."checkInDate", dr.range_from)))::int AS overlap_nights,
          (b."totalAmount" / NULLIF((b."checkOutDate" - b."checkInDate"), 0))::float AS rate_per_night
        FROM bookings b
        JOIN rooms r ON b."roomId" = r.id
        CROSS JOIN date_range dr
        WHERE b.status != 'CANCELLED'
          AND b."checkInDate" < dr.range_to
          AND b."checkOutDate" > dr.range_from
          AND (${propertyFilter}::text IS NULL OR r."propertyId" = ${propertyFilter} OR r."propertyId" IN (SELECT id FROM properties WHERE slug = ${propertyFilter}))
      )
      SELECT
        pi.property_id,
        pi.property_name,
        pi.property_slug,
        pi.total_rooms,
        pi.room_nights_available,
        COALESCE(SUM(bn.overlap_nights), 0)::int AS room_nights_sold,
        ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0)::numeric, 2)::float AS room_revenue_inr,
        CASE
          WHEN pi.room_nights_available > 0
          THEN ROUND((COALESCE(SUM(bn.overlap_nights), 0)::numeric / pi.room_nights_available), 4)::float
          ELSE 0
        END AS occupancy_rate,
        CASE
          WHEN COALESCE(SUM(bn.overlap_nights), 0) > 0
          THEN ROUND((COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0)::numeric / SUM(bn.overlap_nights)), 2)::float
          ELSE 0
        END AS adr,
        CASE
          WHEN pi.room_nights_available > 0
          THEN ROUND((COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0)::numeric / pi.room_nights_available), 2)::float
          ELSE 0
        END AS revpar
      FROM property_inventory pi
      LEFT JOIN booking_nights bn ON bn.property_id = pi.property_id
      GROUP BY pi.property_id, pi.property_name, pi.property_slug, pi.total_rooms, pi.room_nights_available
      ORDER BY pi.property_name ASC;
    `;

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

    // Overall summary aggregation
    const overallTotalRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
    const overallRoomNightsAvailable = properties.reduce((acc, p) => acc + p.roomNightsAvailable, 0);
    const overallRoomNightsSold = properties.reduce((acc, p) => acc + p.roomNightsSold, 0);
    const overallRoomRevenueInr = Number(
      properties.reduce((acc, p) => acc + p.roomRevenueInr, 0).toFixed(2)
    );

    const overallOccupancyRate =
      overallRoomNightsAvailable > 0
        ? Math.round((overallRoomNightsSold / overallRoomNightsAvailable) * 10000) / 10000
        : 0;

    const overallAdr =
      overallRoomNightsSold > 0
        ? Math.round((overallRoomRevenueInr / overallRoomNightsSold) * 100) / 100
        : 0;

    const overallRevpar =
      overallRoomNightsAvailable > 0
        ? Math.round((overallRoomRevenueInr / overallRoomNightsAvailable) * 100) / 100
        : 0;

    const overall: MetricSummary = {
      totalRooms: overallTotalRooms,
      roomNightsAvailable: overallRoomNightsAvailable,
      roomNightsSold: overallRoomNightsSold,
      roomRevenueInr: overallRoomRevenueInr,
      occupancyRate: overallOccupancyRate,
      adr: overallAdr,
      revpar: overallRevpar,
    };

    // Daily trends query using PostgreSQL series generation
    const dailyRows = await prisma.$queryRaw<any[]>`
      WITH daily_series AS (
        SELECT generate_series(${fromDateStr}::date, (${toDateStr}::date - interval '1 day'), interval '1 day')::date AS day_date
      ),
      total_avail AS (
        SELECT COUNT(r.id)::int AS count_avail
        FROM rooms r
        JOIN properties p ON r."propertyId" = p.id
        WHERE (${propertyFilter}::text IS NULL OR p.id = ${propertyFilter} OR p.slug = ${propertyFilter})
      )
      SELECT
        ds.day_date::text AS date,
        ta.count_avail AS room_nights_available,
        COALESCE(COUNT(DISTINCT b.id), 0)::int AS room_nights_sold,
        ROUND(COALESCE(SUM(b."totalAmount" / NULLIF((b."checkOutDate" - b."checkInDate"), 0)), 0)::numeric, 2)::float AS room_revenue_inr
      FROM daily_series ds
      CROSS JOIN total_avail ta
      LEFT JOIN rooms r ON (${propertyFilter}::text IS NULL OR r."propertyId" = ${propertyFilter} OR r."propertyId" IN (SELECT id FROM properties WHERE slug = ${propertyFilter}))
      LEFT JOIN bookings b ON b."roomId" = r.id
        AND b.status != 'CANCELLED'
        AND b."checkInDate" <= ds.day_date
        AND b."checkOutDate" > ds.day_date
      GROUP BY ds.day_date, ta.count_avail
      ORDER BY ds.day_date ASC;
    `;

    const dailyTrends: DailyTrendItem[] = dailyRows.map((row) => {
      const avail = Number(row.room_nights_available);
      const sold = Number(row.room_nights_sold);
      const rev = Number(row.room_revenue_inr);
      const occ = avail > 0 ? Math.round((sold / avail) * 10000) / 10000 : 0;
      const adr = sold > 0 ? Math.round((rev / sold) * 100) / 100 : 0;
      const revpar = avail > 0 ? Math.round((rev / avail) * 100) / 100 : 0;

      return {
        date: row.date,
        roomNightsAvailable: avail,
        roomNightsSold: sold,
        roomRevenueInr: rev,
        occupancyRate: occ,
        adr,
        revpar,
      };
    });

    // Roll up daily trends to monthly trends
    const monthlyMap = new Map<string, { available: number; sold: number; revenue: number }>();
    for (const day of dailyTrends) {
      const month = day.date.slice(0, 7);
      const cur = monthlyMap.get(month) || { available: 0, sold: 0, revenue: 0 };
      cur.available += day.roomNightsAvailable;
      cur.sold += day.roomNightsSold;
      cur.revenue += day.roomRevenueInr;
      monthlyMap.set(month, cur);
    }

    const monthlyTrends: MonthlyTrendItem[] = Array.from(monthlyMap.entries()).map(([month, data]) => {
      const rev = Number(data.revenue.toFixed(2));
      const occ = data.available > 0 ? Math.round((data.sold / data.available) * 10000) / 10000 : 0;
      const adr = data.sold > 0 ? Math.round((rev / data.sold) * 100) / 100 : 0;
      const revpar = data.available > 0 ? Math.round((rev / data.available) * 100) / 100 : 0;

      return {
        month,
        roomNightsAvailable: data.available,
        roomNightsSold: data.sold,
        roomRevenueInr: rev,
        occupancyRate: occ,
        adr,
        revpar,
      };
    });

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

  private getCustomDbMetrics(
    fromDateStr: string,
    toDateStr: string,
    rangeDays: number,
    propertyFilter: string | null
  ): DashboardMetricsResponse {
    const db = this.getOrInitCustomDb();

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

    const propRows = db
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

    const overallTotalRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
    const overallRoomNightsAvailable = properties.reduce((acc, p) => acc + p.roomNightsAvailable, 0);
    const overallRoomNightsSold = properties.reduce((acc, p) => acc + p.roomNightsSold, 0);
    const overallRoomRevenueInr = Number(
      properties.reduce((acc, p) => acc + p.roomRevenueInr, 0).toFixed(2)
    );

    const overallOccupancyRate =
      overallRoomNightsAvailable > 0
        ? Math.round((overallRoomNightsSold / overallRoomNightsAvailable) * 10000) / 10000
        : 0;

    const overallAdr =
      overallRoomNightsSold > 0
        ? Math.round((overallRoomRevenueInr / overallRoomNightsSold) * 100) / 100
        : 0;

    const overallRevpar =
      overallRoomNightsAvailable > 0
        ? Math.round((overallRoomRevenueInr / overallRoomNightsAvailable) * 100) / 100
        : 0;

    const overall: MetricSummary = {
      totalRooms: overallTotalRooms,
      roomNightsAvailable: overallRoomNightsAvailable,
      roomNightsSold: overallRoomNightsSold,
      roomRevenueInr: overallRoomRevenueInr,
      occupancyRate: overallOccupancyRate,
      adr: overallAdr,
      revpar: overallRevpar,
    };

    const dailyTrendsSql = `
      WITH RECURSIVE days_series(d) AS (
        SELECT ?
        UNION ALL
        SELECT date(d, '+1 day') FROM days_series WHERE d < date(?, '-1 day')
      ),
      total_avail AS (
        SELECT COUNT(r.id) AS count_avail
        FROM rooms r
        JOIN properties p ON r.property_id = p.id
        WHERE (? IS NULL OR p.id = ? OR p.slug = ?)
      )
      SELECT
        ds.d AS date,
        ta.count_avail AS room_nights_available,
        COALESCE(COUNT(DISTINCT b.id), 0) AS room_nights_sold,
        ROUND(COALESCE(SUM(b.total_inr / MAX(1, CAST(julianday(b.check_out) - julianday(b.check_in) AS INT))), 0), 2) AS room_revenue_inr
      FROM days_series ds
      CROSS JOIN total_avail ta
      LEFT JOIN rooms r ON (? IS NULL OR r.property_id = ? OR r.property_id IN (SELECT id FROM properties WHERE slug = ?))
      LEFT JOIN bookings b ON b.room_id = r.id
        AND b.status != 'CANCELLED'
        AND b.check_in <= ds.d
        AND b.check_out > ds.d
      GROUP BY ds.d, ta.count_avail
      ORDER BY ds.d ASC;
    `;

    const dailyRows = db
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

    const dailyTrends: DailyTrendItem[] = dailyRows.map((row) => {
      const avail = Number(row.room_nights_available);
      const sold = Number(row.room_nights_sold);
      const rev = Number(row.room_revenue_inr);
      const occ = avail > 0 ? Math.round((sold / avail) * 10000) / 10000 : 0;
      const adr = sold > 0 ? Math.round((rev / sold) * 100) / 100 : 0;
      const revpar = avail > 0 ? Math.round((rev / avail) * 100) / 100 : 0;

      return {
        date: row.date,
        roomNightsAvailable: avail,
        roomNightsSold: sold,
        roomRevenueInr: rev,
        occupancyRate: occ,
        adr,
        revpar,
      };
    });

    const monthlyMap = new Map<string, { available: number; sold: number; revenue: number }>();
    for (const day of dailyTrends) {
      const month = day.date.slice(0, 7);
      const cur = monthlyMap.get(month) || { available: 0, sold: 0, revenue: 0 };
      cur.available += day.roomNightsAvailable;
      cur.sold += day.roomNightsSold;
      cur.revenue += day.roomRevenueInr;
      monthlyMap.set(month, cur);
    }

    const monthlyTrends: MonthlyTrendItem[] = Array.from(monthlyMap.entries()).map(([month, data]) => {
      const rev = Number(data.revenue.toFixed(2));
      const occ = data.available > 0 ? Math.round((data.sold / data.available) * 10000) / 10000 : 0;
      const adr = data.sold > 0 ? Math.round((rev / data.sold) * 100) / 100 : 0;
      const revpar = data.available > 0 ? Math.round((rev / data.available) * 100) / 100 : 0;

      return {
        month,
        roomNightsAvailable: data.available,
        roomNightsSold: data.sold,
        roomRevenueInr: rev,
        occupancyRate: occ,
        adr,
        revpar,
      };
    });

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
