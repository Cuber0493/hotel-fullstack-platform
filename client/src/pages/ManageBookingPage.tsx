import React, { useState } from 'react';
import { Booking } from '../types';
import { apiRequest } from '../api/client';
import { Search, Calendar, User, Phone, Mail, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const ManageBookingPage: React.FC = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) return;

    setErrorMsg(null);
    setCancelSuccessMsg(null);
    setLoading(true);

    try {
      const res = await apiRequest<{ booking: Booking }>(
        `/bookings/${bookingCode.trim().toUpperCase()}`
      );
      setBooking(res.booking);
    } catch (err: any) {
      setBooking(null);
      setErrorMsg(err.message || 'Reservation not found. Please check your confirmation code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirmCancel = window.confirm(
      'Are you sure you wish to cancel this reservation? This action cannot be undone.'
    );
    if (!confirmCancel) return;

    setCancelling(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ booking: Booking; message: string }>(
        `/bookings/${booking.id}/cancel`,
        {
          method: 'PATCH',
          body: JSON.stringify({ reason: 'Cancelled by guest request online' }),
        }
      );
      setBooking(res.booking);
      setCancelSuccessMsg('Your reservation has been cancelled successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold block mb-2">
          Self-Service Concierge
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-950">
          Find Your Reservation
        </h1>
        <p className="text-xs text-charcoal-600 mt-2">
          Enter your 6-character confirmation code (e.g. <code>TBR-BOM-882194</code>) to view itinerary details or manage your stay.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleLookup}
        className="max-w-md mx-auto mb-12 flex space-x-3 items-center"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-reserve-600" />
          <input
            type="text"
            required
            placeholder="TBR-BOM-XXXXXX"
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs uppercase tracking-widest font-mono font-bold rounded-xl border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50 shadow"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {errorMsg && (
        <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {cancelSuccessMsg && (
        <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {/* Booking Voucher Display */}
      {booking && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-reserve-200 shadow-lg animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-reserve-200 pb-6 mb-6 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-500 block">
                Booking Reference
              </span>
              <span className="text-2xl font-mono font-bold text-reserve-900 tracking-wider">
                {booking.bookingCode}
              </span>
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : booking.status === 'CHECKED_IN'
                    ? 'bg-blue-50 text-blue-800 border border-blue-300'
                    : booking.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-800 border border-rose-300'
                    : 'bg-charcoal-100 text-charcoal-800'
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs mb-8">
            <div className="space-y-1">
              <span className="text-charcoal-500 block">Lead Guest</span>
              <span className="font-bold text-charcoal-900 text-sm flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-reserve-600" />
                <span>{booking.guestName}</span>
              </span>
              <span className="text-charcoal-600 block">{booking.guestEmail}</span>
              <span className="text-charcoal-600 block">{booking.guestPhone}</span>
            </div>

            <div className="space-y-1">
              <span className="text-charcoal-500 block">Dates of Stay</span>
              <span className="font-bold text-charcoal-900 text-sm flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-reserve-600" />
                <span>
                  {new Date(booking.checkInDate).toLocaleDateString()} &rarr;{' '}
                  {new Date(booking.checkOutDate).toLocaleDateString()}
                </span>
              </span>
              <span className="text-charcoal-600 block">{booking.totalGuests} Guests</span>
            </div>

            <div className="space-y-1">
              <span className="text-charcoal-500 block">Financial Summary</span>
              <span className="font-serif text-lg font-bold text-charcoal-950 block">
                &#8377;{booking.totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">All taxes inclusive</span>
            </div>
          </div>

          {booking.specialRequests && (
            <div className="mb-6 p-4 rounded-xl bg-reserve-50 border border-reserve-200 text-xs">
              <span className="font-bold text-charcoal-800 block mb-1">Special Preferences:</span>
              <p className="text-charcoal-600 italic">{booking.specialRequests}</p>
            </div>
          )}

          {booking.cancellationReason && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <span className="font-bold block mb-1">Cancellation Reason:</span>
              <p>{booking.cancellationReason}</p>
            </div>
          )}

          {/* Cancellation button if confirmed */}
          {booking.status === 'CONFIRMED' && (
            <div className="pt-6 border-t border-reserve-200 flex justify-end">
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
