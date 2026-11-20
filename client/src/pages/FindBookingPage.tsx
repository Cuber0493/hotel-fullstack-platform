import React, { useState } from 'react';
import { api, getApiErrorMessage } from '../api/client';
import { Booking } from '../types';
import { Search, Calendar, Users, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const FindBookingPage: React.FC = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) return;

    setLoading(true);
    setError(null);
    setBooking(null);
    try {
      const res = await api.get<{ booking: Booking }>(`/bookings/${bookingCode.trim()}`);
      setBooking(res.data.booking);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950">
          Find Your Reservation
        </h1>
        <p className="text-stone-600 text-sm">
          Enter your confirmation reference code (e.g., TBR-BOM-882194) to view your itinerary
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value)}
            placeholder="TBR-BOM-XXXXXX"
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-600/50 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !bookingCode.trim()}
          className="px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-2 text-sm max-w-lg mx-auto">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Booking Itinerary Card */}
      {booking && (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
                Itinerary Overview
              </span>
              <h2 className="text-2xl font-serif font-bold text-stone-950">
                {booking.items?.[0]?.roomType?.name || 'Heritage Suite'}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-stone-900 bg-stone-100 px-3 py-1 rounded-lg">
                {booking.bookingCode}
              </span>
              <span className="text-xs block text-emerald-700 font-semibold mt-1">
                Status: {booking.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-700">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-1">
              <span className="text-stone-400 uppercase tracking-wider block">Dates</span>
              <p className="font-medium text-stone-900 text-sm">
                {String(booking.checkInDate).slice(0, 10)} to{' '}
                {String(booking.checkOutDate).slice(0, 10)}
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-1">
              <span className="text-stone-400 uppercase tracking-wider block">Guest</span>
              <p className="font-medium text-stone-900 text-sm">{booking.guestName}</p>
              <p className="text-stone-500">{booking.guestEmail}</p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 flex justify-between items-baseline">
            <span className="text-stone-600 text-sm font-medium">Total Tariff Amount</span>
            <span className="font-serif font-bold text-2xl text-stone-950">
              ₹{booking.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
