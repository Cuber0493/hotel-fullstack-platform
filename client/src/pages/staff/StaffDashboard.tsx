import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  StaffDashboardData,
  Booking,
  OccupancyGridData,
  Enquiry,
  BookingStatus,
  EnquiryStatus,
} from '../../types';
import { apiRequest } from '../../api/client';
import {
  ShieldCheck,
  Calendar,
  Users,
  Search,
  CheckCircle,
  LogOut,
  BedDouble,
  BarChart3,
  MessageSquare,
  Clock,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'BOOKINGS' | 'OCCUPANCY' | 'ENQUIRIES'>('DASHBOARD');

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Quick lookup search input
  const [quickSearch, setQuickSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Booking[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Bookings tab state
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Occupancy Grid tab state
  const [occupancyData, setOccupancyData] = useState<OccupancyGridData | null>(null);
  const [loadingOccupancy, setLoadingOccupancy] = useState(false);

  // Enquiries tab state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // Action status message
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff) {
      navigate('/');
    }
  }, [isStaff, navigate]);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await apiRequest<StaffDashboardData>('/staff/dashboard');
      setDashboardData(res);
    } catch (err) {
      console.error('Failed to fetch staff dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchBookings = async (status?: string) => {
    setLoadingBookings(true);
    try {
      const query = status ? `?status=${status}` : '';
      const res = await apiRequest<{ bookings: Booking[] }>(`/staff/bookings${query}`);
      setAllBookings(res.bookings);
    } catch (err) {
      console.error('Failed to fetch staff bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchOccupancy = async () => {
    setLoadingOccupancy(true);
    try {
      const res = await apiRequest<OccupancyGridData>('/staff/occupancy-grid?days=14');
      setOccupancyData(res);
    } catch (err) {
      console.error('Failed to fetch occupancy grid:', err);
    } finally {
      setLoadingOccupancy(false);
    }
  };

  const fetchEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await apiRequest<{ enquiries: Enquiry[] }>('/staff/enquiries');
      setEnquiries(res.enquiries);
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    if (isStaff) {
      fetchDashboard();
    }
  }, [isStaff]);

  useEffect(() => {
    if (activeTab === 'BOOKINGS') fetchBookings(bookingStatusFilter);
    if (activeTab === 'OCCUPANCY') fetchOccupancy();
    if (activeTab === 'ENQUIRIES') fetchEnquiries();
  }, [activeTab, bookingStatusFilter]);

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const res = await apiRequest<{ bookings: Booking[] }>(
        `/staff/bookings?search=${encodeURIComponent(quickSearch.trim())}`
      );
      setSearchResults(res.bookings);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await apiRequest(`/staff/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setActionMessage(`Booking status successfully updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 4000);
      fetchDashboard();
      if (activeTab === 'BOOKINGS') fetchBookings(bookingStatusFilter);
      if (searchResults) {
        setSearchResults((prev) =>
          prev ? prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)) : null
        );
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleUpdateEnquiry = async (
    enquiryId: string,
    newStatus: EnquiryStatus,
    notes?: string
  ) => {
    try {
      await apiRequest(`/staff/enquiries/${enquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, internalNotes: notes }),
      });
      setActionMessage(`Enquiry updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 4000);
      fetchEnquiries();
    } catch (err: any) {
      alert(err.message || 'Enquiry update failed');
    }
  };

  if (!isStaff) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-charcoal-900 pb-20">
      {/* Front-Desk Operations Header */}
      <div className="bg-charcoal-950 text-white border-b border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                The Bombay Reserve &bull; Front-Desk Command
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Operations &amp; Guest Services Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right text-xs">
              <span className="text-white font-bold block">{user?.fullName}</span>
              <span className="text-amber-400 text-[10px] uppercase font-semibold">
                {user?.role} Access
              </span>
            </div>
            <button
              onClick={() => {
                fetchDashboard();
                if (activeTab === 'BOOKINGS') fetchBookings(bookingStatusFilter);
              }}
              title="Refresh Data"
              className="p-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-reserve-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Operational Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 border-t border-charcoal-800/80 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'DASHBOARD'
                ? 'border-amber-400 text-amber-400 bg-charcoal-900'
                : 'border-transparent text-charcoal-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Today's Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'BOOKINGS'
                ? 'border-amber-400 text-amber-400 bg-charcoal-900'
                : 'border-transparent text-charcoal-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>All Reservations</span>
          </button>

          <button
            onClick={() => setActiveTab('OCCUPANCY')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'OCCUPANCY'
                ? 'border-amber-400 text-amber-400 bg-charcoal-900'
                : 'border-transparent text-charcoal-400 hover:text-white'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>14-Day Occupancy Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('ENQUIRIES')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'ENQUIRIES'
                ? 'border-amber-400 text-amber-400 bg-charcoal-900'
                : 'border-transparent text-charcoal-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Event Enquiries</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {actionMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Quick Search Bar across the entire system */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleQuickSearch} className="flex-1 w-full flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search guest by confirmation code (TBR-BOM-...), guest name, phone, or email..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2 bg-charcoal-900 hover:bg-black text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {searching ? 'Finding...' : 'Search Guest'}
            </button>
          </form>

          {searchResults !== null && (
            <button
              onClick={() => {
                setSearchResults(null);
                setQuickSearch('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Quick Search Results Dropdown / Table */}
        {searchResults !== null && (
          <div className="bg-white p-6 rounded-2xl border-2 border-amber-300 shadow-lg">
            <h3 className="text-sm font-bold text-charcoal-950 mb-3 flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-600" />
              <span>Search Results ({searchResults.length} matching stays)</span>
            </h3>

            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-500">No reservations matched your query.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {searchResults.map((b) => (
                  <div key={b.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-charcoal-900 text-sm">{b.bookingCode}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {b.guestName} &bull; {b.guestPhone} &bull; {b.guestEmail}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Dates: {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                        >
                          Check In Guest
                        </button>
                      )}
                      {b.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_OUT')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                        >
                          Check Out Guest
                        </button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-bold text-xs"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Today's Operational Desk */}
        {activeTab === 'DASHBOARD' && dashboardData && (
          <div className="space-y-8">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Expected Check-Ins Today
                </span>
                <span className="text-3xl font-serif font-bold text-charcoal-950 mt-1 block">
                  {dashboardData.metrics.todayCheckInsCount}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                  Arrivals Desk Ready
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Expected Check-Outs Today
                </span>
                <span className="text-3xl font-serif font-bold text-charcoal-950 mt-1 block">
                  {dashboardData.metrics.todayCheckOutsCount}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                  Departure Folios Queued
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Currently In-House
                </span>
                <span className="text-3xl font-serif font-bold text-charcoal-950 mt-1 block">
                  {dashboardData.metrics.currentInHouseCount}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold mt-1 block">
                  Keys Active
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Group Occupancy Rate
                </span>
                <span className="text-3xl font-serif font-bold text-amber-600 mt-1 block">
                  {dashboardData.metrics.occupancyRate}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Across 14 Mumbai Boutiques
                </span>
              </div>
            </div>

            {/* Arrivals and Departures Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Today's Arrivals */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-1 flex items-center justify-between">
                    <span>Expected Arrivals</span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {dashboardData.todayArrivals.length} Queued
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Verify lead identification and click Check In upon room handover.
                  </p>

                  {dashboardData.todayArrivals.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No further arrivals scheduled for today.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {dashboardData.todayArrivals.map((b) => (
                        <div key={b.id} className="py-3 flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-charcoal-900 block">{b.bookingCode}</span>
                            <span className="font-semibold text-slate-800">{b.guestName}</span>
                            <span className="text-slate-500 block text-[11px]">{b.guestPhone}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {b.status === 'CONFIRMED' ? (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                              >
                                Check In
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                                {b.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Departures */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-1 flex items-center justify-between">
                    <span>Expected Departures</span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {dashboardData.todayDepartures.length} Due
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Collect keys, reconcile room minibar items, and complete departure.
                  </p>

                  {dashboardData.todayDepartures.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No departures scheduled for today.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {dashboardData.todayDepartures.map((b) => (
                        <div key={b.id} className="py-3 flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-charcoal-900 block">{b.bookingCode}</span>
                            <span className="font-semibold text-slate-800">{b.guestName}</span>
                            <span className="text-slate-500 block text-[11px]">&#8377;{b.totalAmount.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {b.status === 'CHECKED_IN' ? (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_OUT')}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                              >
                                Complete Check-Out
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {b.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-4">
                Recent Reservation Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Guest Name</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-reserve-900">{b.bookingCode}</td>
                        <td className="p-3 font-medium text-slate-900">{b.guestName}</td>
                        <td className="p-3 text-slate-600">
                          {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : b.status === 'CHECKED_IN'
                                ? 'bg-blue-50 text-blue-800'
                                : b.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">&#8377;{b.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right">
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px]"
                            >
                              Check In
                            </button>
                          )}
                          {b.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_OUT')}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-[11px]"
                            >
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All Reservations List */}
        {activeTab === 'BOOKINGS' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-charcoal-950">
                  Master Reservation Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Search, verify guest status, and manage reservation lifecycles.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-600">Status:</span>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CHECKED_IN">CHECKED_IN</option>
                  <option value="CHECKED_OUT">CHECKED_OUT</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {loadingBookings ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading reservations...</div>
            ) : allBookings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No reservations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Guest</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Dates of Stay</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-reserve-900">{b.bookingCode}</td>
                        <td className="p-3 font-medium text-slate-900">{b.guestName}</td>
                        <td className="p-3 text-slate-600">
                          <div>{b.guestPhone}</div>
                          <div className="text-[10px] text-slate-400">{b.guestEmail}</div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : b.status === 'CHECKED_IN'
                                ? 'bg-blue-50 text-blue-800'
                                : b.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">&#8377;{b.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right space-x-1">
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px]"
                            >
                              Check In
                            </button>
                          )}
                          {b.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_OUT')}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-[11px]"
                            >
                              Check Out
                            </button>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px]"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: 14-Day Rolling Occupancy Grid */}
        {activeTab === 'OCCUPANCY' && occupancyData && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal-950">
                14-Day Rolling Occupancy Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Real-time room availability across properties. Number indicates remaining available rooms.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2 border border-slate-200 shrink-0 min-w-[200px]">Property / Room Type</th>
                    {occupancyData.dates.map((d) => (
                      <th key={d} className="p-2 border border-slate-200 text-center font-mono text-[10px]">
                        {d.slice(5)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {occupancyData.grid.map((prop) => (
                    <React.Fragment key={prop.propertyId}>
                      <tr className="bg-amber-50/70 font-bold text-amber-950">
                        <td colSpan={occupancyData.dates.length + 1} className="p-2 border border-slate-200">
                          {prop.propertyName}
                        </td>
                      </tr>
                      {prop.roomTypes.map((rt) => (
                        <tr key={rt.roomTypeId} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 pl-4 font-medium text-slate-800">
                            {rt.roomTypeName}
                          </td>
                          {rt.dates.map((cell) => (
                            <td
                              key={cell.date}
                              className={`p-2 border border-slate-200 text-center font-bold font-mono ${
                                cell.available === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : cell.booked > 0
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {cell.available}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Event Enquiries Pipeline */}
        {activeTab === 'ENQUIRIES' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal-950">
                Bespoke Event &amp; Celebration Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Triage guest event enquiries, update status, and log concierge notes.
              </p>
            </div>

            {loadingEnquiries ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading enquiries...</div>
            ) : enquiries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No active enquiries.</div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-900 text-sm">{enq.fullName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {enq.eventType}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Received: {new Date(enq.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center space-x-3">
                        <span>{enq.email}</span>
                        <span>&bull;</span>
                        <span>{enq.phone}</span>
                        {enq.estimatedGuests && (
                          <>
                            <span>&bull;</span>
                            <span>{enq.estimatedGuests} Guests</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 italic">
                        &ldquo;{enq.message}&rdquo;
                      </p>

                      {enq.internalNotes && (
                        <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          <span className="font-bold">Staff Note: </span>
                          <span>{enq.internalNotes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500 font-semibold">Status:</span>
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            handleUpdateEnquiry(enq.id, e.target.value as EnquiryStatus, enq.internalNotes || undefined)
                          }
                          className="px-2.5 py-1 rounded border border-slate-300 font-bold text-xs"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="QUOTED">QUOTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          const note = prompt('Add staff internal note:', enq.internalNotes || '');
                          if (note !== null) {
                            handleUpdateEnquiry(enq.id, enq.status, note);
                          }
                        }}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
                      >
                        {enq.internalNotes ? 'Edit Staff Note' : '+ Add Note'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
