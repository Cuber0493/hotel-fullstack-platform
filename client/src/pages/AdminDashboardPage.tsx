import React, { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../api/client';
import { DashboardMetricsResponse } from '../types';
import {
  TrendingUp,
  Percent,
  DollarSign,
  Hotel,
  Calendar,
  Filter,
  BarChart3,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default dates: past 14 days to today
  const defaultTo = new Date().toISOString().split('T')[0];
  const defaultFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [propertyId, setPropertyId] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { from, to };
      if (propertyId) params.propertyId = propertyId;
      const res = await api.get<DashboardMetricsResponse>('/admin/metrics', { params });
      setMetrics(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [from, to, propertyId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
            Executive Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 mt-1">
            Revenue & Performance Analytics
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Real-time Occupancy, ADR, and RevPAR metrics calculated via SQL aggregation
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 border border-stone-200 rounded-2xl shadow-sm">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 mb-0.5">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 mb-0.5">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-stone-500 mb-0.5">
              Property
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none max-w-[180px]"
            >
              <option value="">All 14 Properties</option>
              {metrics?.properties.map((p) => (
                <option key={p.propertyId} value={p.propertyId}>
                  {p.propertyName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !metrics && (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-stone-500 font-serif tracking-widest text-xs uppercase">
            Aggregating Performance Metrics...
          </p>
        </div>
      )}

      {metrics && (
        <>
          {/* KPI Cards Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Occupancy Rate */}
            <div className="bg-white p-6 border border-stone-200 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                  Occupancy Rate
                </span>
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-stone-950">
                {`${(metrics.overall.occupancyRate * 100).toFixed(1)}%`}
              </div>
              <p className="text-xs text-stone-500">
                {metrics.overall.roomNightsSold} of {metrics.overall.roomNightsAvailable} room-nights
                sold
              </p>
            </div>

            {/* ADR */}
            <div className="bg-white p-6 border border-stone-200 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                  ADR (Avg Daily Rate)
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-stone-950">
                {`₹${metrics.overall.adr.toLocaleString('en-IN')}`}
              </div>
              <p className="text-xs text-stone-500">Revenue per occupied room night</p>
            </div>

            {/* RevPAR */}
            <div className="bg-white p-6 border border-stone-200 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                  RevPAR
                </span>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-stone-950">
                {`₹${metrics.overall.revpar.toLocaleString('en-IN')}`}
              </div>
              <p className="text-xs text-stone-500">
                Occupancy × ADR = RevPAR verified
              </p>
            </div>

            {/* Total Room Revenue */}
            <div className="bg-white p-6 border border-stone-200 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                  Total Room Revenue
                </span>
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-stone-950">
                {`₹${metrics.overall.roomRevenueInr.toLocaleString('en-IN')}`}
              </div>
              <p className="text-xs text-stone-500">Across {metrics.days} days in range</p>
            </div>
          </section>

          {/* Daily Trend Chart (Visual SVG Bars) */}
          <section className="bg-white p-6 sm:p-8 border border-stone-200 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-950 text-xl">
                  Daily Performance Trajectory
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Occupancy % and Revenue realization day by day
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5 text-stone-700">
                  <span className="w-3 h-3 bg-amber-600 rounded-sm" />
                  <span>Occupancy %</span>
                </div>
                <div className="flex items-center space-x-1.5 text-stone-700">
                  <span className="w-3 h-3 bg-stone-900 rounded-sm" />
                  <span>RevPAR (₹)</span>
                </div>
              </div>
            </div>

            {/* SVG Visual Representation */}
            <div className="h-64 flex items-end gap-2 pt-6 overflow-x-auto pb-4">
              {metrics.dailyTrends.map((d, idx) => {
                const occHeight = Math.max(12, Math.round(d.occupancyRate * 200));

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[42px] flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-stone-950 text-white text-[10px] p-2 rounded-lg pointer-events-none z-20 shadow-lg whitespace-nowrap">
                      <p className="font-bold">{d.date}</p>
                      <p>Occupancy: {(d.occupancyRate * 100).toFixed(1)}%</p>
                      <p>RevPAR: ₹{d.revpar.toLocaleString('en-IN')}</p>
                      <p>Sold: {d.roomNightsSold} / {d.roomNightsAvailable}</p>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${occHeight}px` }}
                      className="w-full max-w-[28px] bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-md group-hover:brightness-110 transition-all shadow-sm"
                    />

                    {/* Date Label */}
                    <span className="text-[10px] text-stone-500 mt-2 rotate-45 sm:rotate-0 font-mono">
                      {d.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Properties Performance Breakdown Table */}
          <section className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6 sm:p-8">
            <h3 className="font-serif font-bold text-stone-950 text-xl border-b border-stone-100 pb-3">
              Property Inventory & Yield Analysis
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500 font-semibold bg-stone-50">
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4 text-center">Rooms</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-center">Sold</th>
                    <th className="py-3 px-4 text-right">Revenue (INR)</th>
                    <th className="py-3 px-4 text-right">Occupancy</th>
                    <th className="py-3 px-4 text-right">ADR</th>
                    <th className="py-3 px-4 text-right">RevPAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 text-xs">
                  {metrics.properties.map((p) => (
                    <tr key={p.propertyId} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-stone-950">
                        {p.propertyName}
                      </td>
                      <td className="py-3.5 px-4 text-center">{p.totalRooms}</td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {p.roomNightsAvailable}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-800">
                        {p.roomNightsSold}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        ₹{p.roomRevenueInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                        {(p.occupancyRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        ₹{p.adr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-950">
                        ₹{p.revpar.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
