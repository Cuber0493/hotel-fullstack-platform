import React, { useState } from 'react';
import { RoomType, PropertyDetail, Booking } from '../types';
import { apiRequest } from '../api/client';
import { X, Calendar, User, Mail, Phone, CreditCard, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface BookingModalProps {
  property: PropertyDetail;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  property,
  roomType,
  checkInDate,
  checkOutDate,
  guests,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'CONFIRMED'>('DETAILS');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'ARRIVAL'>('CARD');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const totalAmount = roomType.basePrice * nights;
  const taxes = Math.round(totalAmount * 0.18); // 18% GST standard in luxury Indian hospitality
  const grandTotal = totalAmount + taxes;

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await apiRequest<{ booking: Booking; message: string }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          checkInDate,
          checkOutDate,
          totalGuests: guests,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
        }),
      });

      setConfirmedBooking(res.booking);
      setStep('CONFIRMED');
      if (onBookingSuccess) {
        onBookingSuccess(res.booking);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-reserve-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-charcoal-400 hover:text-charcoal-800 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step !== 'CONFIRMED' ? (
          <div>
            <div className="border-b border-reserve-200 pb-4 mb-6">
              <span className="text-[11px] uppercase tracking-widest text-reserve-700 font-semibold">
                Guaranteed Reservation
              </span>
              <h2 className="text-2xl font-serif font-bold text-charcoal-950 mt-1">
                {property.name}
              </h2>
              <p className="text-xs text-charcoal-600">
                {roomType.name} &bull; {nights} {nights === 1 ? 'Night' : 'Nights'} ({checkInDate} to {checkOutDate})
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-5">
              {/* Pricing breakdown banner */}
              <div className="bg-reserve-50 rounded-xl p-4 border border-reserve-200 text-xs space-y-2">
                <div className="flex justify-between text-charcoal-700">
                  <span>Room Rate ({nights} nights &times; &#8377;{roomType.basePrice.toLocaleString('en-IN')})</span>
                  <span>&#8377;{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-charcoal-700">
                  <span>GST & Luxury Hospitality Tax (18%)</span>
                  <span>&#8377;{taxes.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-reserve-300 pt-2 flex justify-between font-bold text-charcoal-950 text-sm">
                  <span>Total Payable</span>
                  <span className="text-reserve-800">&#8377;{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Guest details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Primary Guest Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Singhania"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Email Address (For Confirmation)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                    <input
                      type="email"
                      required
                      placeholder="vikram@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 99881"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Total Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={roomType.maxGuests}
                    value={guests}
                    readOnly
                    className="w-full px-3 py-2 text-xs rounded-lg border border-reserve-200 bg-reserve-100 text-charcoal-800 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Special Requests / Dietary / Arrival Time (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Late check-in after 9 PM, feather-free pillows, sea-view preference"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                />
              </div>

              {/* Payment selection simulation */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      paymentMethod === 'CARD'
                        ? 'border-reserve-800 bg-reserve-50 text-reserve-900 font-bold'
                        : 'border-reserve-200 text-charcoal-700 hover:bg-reserve-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-2 text-reserve-700" />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      paymentMethod === 'UPI'
                        ? 'border-reserve-800 bg-reserve-50 text-reserve-900 font-bold'
                        : 'border-reserve-200 text-charcoal-700 hover:bg-reserve-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-2 text-reserve-700" />
                    <span>UPI / NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ARRIVAL')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      paymentMethod === 'ARRIVAL'
                        ? 'border-reserve-800 bg-reserve-50 text-reserve-900 font-bold'
                        : 'border-reserve-200 text-charcoal-700 hover:bg-reserve-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mb-2 text-reserve-700" />
                    <span>Pay at Front-Desk</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50 shadow-md flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {loading ? 'Securing Sanctuary...' : `Confirm & Reserve • ₹${grandTotal.toLocaleString('en-IN')}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs uppercase tracking-widest text-reserve-700 font-bold">
              Reservation Confirmed
            </span>
            <h2 className="text-3xl font-serif font-bold text-charcoal-950 mt-1">
              Welcome to The Bombay Reserve
            </h2>

            <div className="my-6 p-6 rounded-2xl bg-reserve-50 border-2 border-dashed border-reserve-300 text-left max-w-lg mx-auto">
              <div className="flex justify-between items-start border-b border-reserve-200 pb-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-600 block">
                    Booking Reference
                  </span>
                  <span className="text-2xl font-mono font-bold text-reserve-900 tracking-wider">
                    {confirmedBooking?.bookingCode}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {confirmedBooking?.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <span className="text-charcoal-500 block">Property</span>
                  <span className="font-bold text-charcoal-900">{property.name}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">Room</span>
                  <span className="font-bold text-charcoal-900">{roomType.name}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">Stay Dates</span>
                  <span className="font-bold text-charcoal-900">
                    {checkInDate} &rarr; {checkOutDate}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">Lead Guest</span>
                  <span className="font-bold text-charcoal-900">{confirmedBooking?.guestName}</span>
                </div>
              </div>

              <div className="border-t border-reserve-200 pt-3 flex justify-between items-center text-xs">
                <span className="text-charcoal-600">Total Charged</span>
                <span className="text-base font-bold text-charcoal-950">
                  &#8377;{confirmedBooking?.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-xs text-charcoal-600 max-w-md mx-auto mb-6">
              A luxury confirmation folio has been sent to <strong>{confirmedBooking?.guestEmail}</strong>. 
              Our concierge desk is ready for your arrival.
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all shadow"
            >
              Close & View Itinerary
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
