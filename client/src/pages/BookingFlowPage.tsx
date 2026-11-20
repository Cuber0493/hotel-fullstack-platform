import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PropertySummary, RoomType, Booking } from '../types';
import {
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

const bookingFormSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be YYYY-MM-DD'),
  guests: z.coerce.number().min(1, 'At least 1 guest required'),
  guestName: z.string().min(2, 'Guest full name must be at least 2 characters'),
  guestEmail: z.string().email('Please enter a valid guest email'),
  guestPhone: z.string().min(8, 'Phone number must be at least 8 digits'),
  specialRequests: z.string().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export const BookingFlowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const propertyId = searchParams.get('propertyId');
  const roomTypeId = searchParams.get('roomTypeId');
  const defaultCheckIn = searchParams.get('checkIn') || '';
  const defaultCheckOut = searchParams.get('checkOut') || '';
  const defaultGuests = Number(searchParams.get('guests')) || 1;

  const [property, setProperty] = useState<PropertySummary | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      guests: defaultGuests,
      guestName: user?.name || user?.fullName || '',
      guestEmail: user?.email || '',
      guestPhone: user?.phone || '',
      specialRequests: '',
    },
  });

  const watchedCheckIn = watch('checkIn');
  const watchedCheckOut = watch('checkOut');

  // Load property and room type context
  useEffect(() => {
    const fetchContext = async () => {
      setLoadingProperty(true);
      try {
        if (propertyId) {
          const res = await api.get<{ property: any }>(`/properties/${propertyId}`);
          setProperty(res.data.property);
          if (roomTypeId && res.data.property.roomTypes) {
            const foundRt = res.data.property.roomTypes.find(
              (rt: any) => rt.id === roomTypeId || rt.slug === roomTypeId
            );
            setSelectedRoomType(foundRt || res.data.property.roomTypes[0]);
          } else if (res.data.property.roomTypes?.[0]) {
            setSelectedRoomType(res.data.property.roomTypes[0]);
          }
        }
      } catch (err) {
        setServerError(getApiErrorMessage(err));
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchContext();
  }, [propertyId, roomTypeId]);

  // Price Calculation
  const nights = React.useMemo(() => {
    if (!watchedCheckIn || !watchedCheckOut) return 1;
    const start = new Date(watchedCheckIn);
    const end = new Date(watchedCheckOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 1;
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [watchedCheckIn, watchedCheckOut]);

  const basePrice = selectedRoomType?.basePrice || 18500;
  const totalAmount = basePrice * nights;

  const onSubmit = async (data: BookingFormData) => {
    setServerError(null);
    try {
      const payload = {
        propertyId: property?.id || propertyId,
        roomTypeId: selectedRoomType?.id || roomTypeId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalGuests: data.guests,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        specialRequests: data.specialRequests,
      };

      const res = await api.post<{ booking: Booking }>('/bookings', payload);
      setConfirmedBooking(res.data.booking);
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err));
    }
  };

  // Success Confirmation View
  if (confirmedBooking) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-700">
              Reservation Confirmed
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 mt-1">
              Your Mumbai Stay Awaits
            </h1>
            <p className="text-stone-600 text-sm mt-2">
              A formal confirmation receipt has been dispatched to {confirmedBooking.guestEmail}.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-6 rounded-2xl max-w-md mx-auto text-left space-y-3 text-sm">
            <div className="flex justify-between border-b border-stone-200/80 pb-2">
              <span className="text-stone-500">Booking Reference</span>
              <span className="font-mono font-bold text-stone-950">
                {confirmedBooking.bookingCode}
              </span>
            </div>
            <div className="flex justify-between border-b border-stone-200/80 pb-2">
              <span className="text-stone-500">Dates</span>
              <span className="font-medium text-stone-900">
                {String(confirmedBooking.checkInDate).slice(0, 10)} to{' '}
                {String(confirmedBooking.checkOutDate).slice(0, 10)} ({nights} Nights)
              </span>
            </div>
            <div className="flex justify-between border-b border-stone-200/80 pb-2">
              <span className="text-stone-500">Guest</span>
              <span className="font-medium text-stone-900">{confirmedBooking.guestName}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold text-stone-950">Total Paid / Due</span>
              <span className="font-serif font-bold text-lg text-stone-950">
                ₹{confirmedBooking.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/my-bookings"
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-sm transition-all"
            >
              View in My Bookings
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950">
          Complete Your Reservation
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Review your stay details and provide guest arrival information
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl flex items-start space-x-2 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Stay details & Guest Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stay Dates Box */}
          <div className="bg-white p-6 sm:p-8 border border-stone-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Stay Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                  Check-In Date
                </label>
                <input
                  type="date"
                  {...register('checkIn')}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/50"
                />
                {errors.checkIn && (
                  <p className="mt-1 text-xs text-red-600">{errors.checkIn.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                  Check-Out Date
                </label>
                <input
                  type="date"
                  {...register('checkOut')}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/50"
                />
                {errors.checkOut && (
                  <p className="mt-1 text-xs text-red-600">{errors.checkOut.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Number of Guests
              </label>
              <select
                {...register('guests')}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
              {errors.guests && (
                <p className="mt-1 text-xs text-red-600">{errors.guests.message}</p>
              )}
            </div>
          </div>

          {/* Guest Information Box */}
          <div className="bg-white p-6 sm:p-8 border border-stone-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>Primary Guest Information</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('guestName')}
                  placeholder="Aanya Mehta"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white"
                />
                {errors.guestName && (
                  <p className="mt-1 text-xs text-red-600">{errors.guestName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register('guestEmail')}
                    placeholder="aanya@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white"
                  />
                  {errors.guestEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.guestEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    {...register('guestPhone')}
                    placeholder="+91 98200 11001"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white"
                  />
                  {errors.guestPhone && (
                    <p className="mt-1 text-xs text-red-600">{errors.guestPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                  Special Requests / Arrival Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  {...register('specialRequests')}
                  placeholder="Late check-in, high floor preference, airport pickup details..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white p-6 sm:p-8 border border-stone-200 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-stone-900 text-xl border-b border-stone-100 pb-3">
              Reservation Summary
            </h3>

            {loadingProperty ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold block">
                    {property?.name || 'Selected Property'}
                  </span>
                  <span className="font-serif font-bold text-lg text-stone-950">
                    {selectedRoomType?.name || 'Heritage Suite'}
                  </span>
                  <span className="text-xs text-stone-500 block mt-0.5">
                    {property?.neighborhood || 'Mumbai'}
                  </span>
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Rate per night</span>
                    <span className="font-semibold text-stone-900">
                      ₹{basePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-semibold text-stone-900">{nights} Night(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Heritage Fees</span>
                    <span className="font-semibold text-emerald-700">Included</span>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-4 flex justify-between items-baseline">
                  <span className="font-bold text-stone-900 text-base">Total INR</span>
                  <span className="font-serif font-bold text-2xl text-stone-950">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Securing Suite...</span>
                </>
              ) : (
                <>
                  <span>Confirm Reservation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center space-x-2 text-[11px] text-stone-500 pt-2 text-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instant Confirmation • No Booking Fees</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
