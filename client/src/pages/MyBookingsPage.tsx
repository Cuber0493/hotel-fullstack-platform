import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchMyBookings = async () => {
      try {
        const res = await apiRequest<{ bookings: Booking[] }>('/bookings/my-bookings');
        setBookings(res.bookings);
      } catch (err) {
        console.error('Failed to load my bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs uppercase tracking-wider text-charcoal-600">
        Loading your reservation portfolio...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold block mb-1">
          Guest Sanctuary Portfolio
        </span>
        <h1 className="text-3xl font-serif font-bold text-charcoal-950">
          My Reservations
        </h1>
        <p className="text-xs text-charcoal-600 mt-1">
          Welcome back, {user?.fullName}. Here are your upcoming and past reservations.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="p-10 rounded-2xl bg-reserve-50 border border-reserve-200 text-center">
          <p className="text-xs text-charcoal-600 mb-4">You have no active or past bookings.</p>
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-2.5 bg-reserve-900 text-white rounded-lg text-xs uppercase tracking-wider font-semibold"
          >
            Explore 14 Havens
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/find-booking`)}
              className="p-6 rounded-2xl bg-white border border-reserve-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
            >
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="font-mono text-sm font-bold text-reserve-900">
                    {b.bookingCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-800'
                        : b.status === 'CHECKED_IN'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-charcoal-100 text-charcoal-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-charcoal-700 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-reserve-600" />
                  <span>
                    {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                    {new Date(b.checkOutDate).toLocaleDateString()}
                  </span>
                  <span>&bull;</span>
                  <span>{b.totalGuests} Guests</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-serif font-bold text-base text-charcoal-950">
                  &#8377;{b.totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-reserve-800 flex items-center space-x-1">
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
