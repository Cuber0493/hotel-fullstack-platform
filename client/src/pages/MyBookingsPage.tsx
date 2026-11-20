import React, { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../api/client';
import { Booking } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ bookings: Booking[] }>('/bookings/my');
      setBookings(res.data.bookings);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api.patch(`/bookings/${cancelModalBooking.id}/cancel`, {
        reason: cancelReason || 'Cancelled by guest request',
      });
      setCancelModalBooking(null);
      setCancelReason('');
      await fetchMyBookings();
    } catch (err) {
      setCancelError(getApiErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950">
          My Reserved Stays
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Manage your itinerary, view confirmed suites, and review past visits
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-stone-500 font-serif tracking-widest text-xs uppercase">
            Loading Your Reservations...
          </p>
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900">
            No Reservations Found
          </h3>
          <p className="text-stone-600 text-sm max-w-sm mx-auto">
            You do not have any active or past reservations under this account.
          </p>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED';
            const roomTypeName =
              booking.items?.[0]?.roomType?.name || 'Heritage Collective Suite';

            return (
              <div
                key={booking.id}
                className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-stone-950 bg-stone-100 px-2.5 py-1 rounded-lg">
                      {booking.bookingCode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-stone-100 text-stone-600'
                          : booking.status === 'CHECKED_IN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    {roomTypeName}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-xs text-stone-600 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        {String(booking.checkInDate).slice(0, 10)} to{' '}
                        {String(booking.checkOutDate).slice(0, 10)}
                      </span>
                    </div>
                    <div>
                      <span>{booking.totalGuests} Guest(s)</span>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <p className="text-xs text-stone-500 italic">
                      "{booking.specialRequests}"
                    </p>
                  )}

                  {isCancelled && booking.cancellationReason && (
                    <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                      Cancelled: {booking.cancellationReason}
                    </p>
                  )}
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                      Total Tariff
                    </span>
                    <span className="font-serif font-bold text-2xl text-stone-950">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {!isCancelled && booking.status !== 'CHECKED_OUT' && (
                    <button
                      onClick={() => setCancelModalBooking(booking)}
                      className="mt-3 px-4 py-2 text-xs font-semibold text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                    >
                      Cancel Stay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl border border-stone-200">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-stone-950">
                Cancel Reservation {cancelModalBooking.bookingCode}?
              </h3>
              <p className="text-xs text-stone-600">
                Are you sure you wish to cancel your stay? This will release the allocated suite
                back into available collective inventory.
              </p>
            </div>

            {cancelError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Trip rescheduled, emergency, change of plans..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs uppercase tracking-wider font-semibold rounded-xl transition-all"
              >
                Keep Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
