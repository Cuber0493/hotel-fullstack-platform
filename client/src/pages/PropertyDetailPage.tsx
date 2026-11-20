import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyDetail, RoomAvailability, RoomType } from '../types';
import { apiRequest } from '../api/client';
import { BookingModal } from '../components/BookingModal';
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Bed,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';

export const PropertyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Availability query
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(2);
  const [availabilities, setAvailabilities] = useState<RoomAvailability[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Booking Modal State
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ property: PropertyDetail }>(`/properties/${slug}`);
        setProperty(res.property);
      } catch (err: any) {
        setErrorMsg(err.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [slug]);

  const handleCheckAvailability = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!slug) return;

    setCheckingAvailability(true);
    try {
      const res = await apiRequest<{ roomTypes: RoomAvailability[] }>(
        `/properties/${slug}/availability?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&guests=${guests}`
      );
      setAvailabilities(res.roomTypes);
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (property) {
      handleCheckAvailability();
    }
  }, [property]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-reserve-300 border-t-reserve-800 animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-widest text-reserve-700">Loading sanctuary details...</p>
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-2">Sanctuary Not Found</h2>
        <p className="text-xs text-charcoal-600 mb-6">{errorMsg || 'The requested property does not exist.'}</p>
        <button
          onClick={() => navigate('/properties')}
          className="px-6 py-2.5 bg-reserve-900 text-white text-xs uppercase tracking-wider font-semibold rounded-lg"
        >
          Return to Properties
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Top Banner Navigation */}
      <div className="bg-reserve-100/60 border-b border-reserve-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-charcoal-700">
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center space-x-1 hover:text-reserve-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All 14 Properties</span>
          </button>
          <span className="hidden sm:inline-block font-semibold text-reserve-800">
            {property.neighborhood}
          </span>
        </div>
      </div>

      {/* Property Title & Hero Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-reserve-100 border border-reserve-200 text-reserve-800 text-[10px] uppercase tracking-widest font-bold mb-3">
              <MapPin className="w-3 h-3 text-reserve-700" />
              <span>{property.neighborhood}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal-950">
              {property.name}
            </h1>
            <p className="text-xs text-charcoal-600 mt-2 flex items-center space-x-1.5">
              <span>{property.address}</span>
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-4 text-xs text-charcoal-700">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-reserve-700" />
              <span>Check-in: {property.checkInTime}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-reserve-700" />
              <span>Check-out: {property.checkOutTime}</span>
            </div>
          </div>
        </div>

        {/* Photography Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl overflow-hidden shadow-lg h-[460px]">
          <div className="md:col-span-2 h-full">
            <img
              src={property.heroImage}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4 h-full">
            <img
              src={property.galleryImages[0] || property.heroImage}
              alt={`${property.name} gallery 1`}
              className="w-full h-full object-cover"
            />
            <img
              src={property.galleryImages[1] || property.heroImage}
              alt={`${property.name} gallery 2`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Property Details & Booking Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Description & Amenities */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-reserve-700 font-bold mb-3">
              The Architecture & Provenance
            </h3>
            <p className="text-sm text-charcoal-800 leading-relaxed font-light whitespace-pre-line">
              {property.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-reserve-700 font-bold mb-4">
              Property Amenities & Privileges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center space-x-2.5 p-3 rounded-xl bg-reserve-50 border border-reserve-200 text-xs text-charcoal-800"
                >
                  <Sparkles className="w-4 h-4 text-reserve-700 shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Selection Grid */}
          <div className="pt-6 border-t border-reserve-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-reserve-700 font-bold">
                  Boutique Accommodations
                </h3>
                <h4 className="text-2xl font-serif font-bold text-charcoal-950 mt-1">
                  Available Rooms & Suites
                </h4>
              </div>
            </div>

            <div className="space-y-6">
              {(availabilities.length > 0 ? availabilities : property.roomTypes.map((rt) => ({
                roomType: rt,
                totalInventory: rt.totalInventory,
                availableInventory: rt.totalInventory,
                isAvailable: true,
                totalPrice: rt.basePrice,
                nights: 1,
              }))).map((item) => {
                const rt = item.roomType;
                return (
                  <div
                    key={rt.id}
                    className="p-6 rounded-2xl bg-white border border-reserve-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-reserve-400 transition-all"
                  >
                    <div className="md:w-1/3 h-48 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={rt.images[0] || property.heroImage}
                        alt={rt.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif text-xl font-bold text-charcoal-950">
                            {rt.name}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.isAvailable
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {item.isAvailable
                              ? `${item.availableInventory} Left`
                              : 'Sold Out'}
                          </span>
                        </div>

                        <p className="text-xs text-charcoal-600 font-light mt-1.5 leading-relaxed">
                          {rt.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-charcoal-700 mt-4">
                          <span className="flex items-center space-x-1">
                            <Bed className="w-3.5 h-3.5 text-reserve-700" />
                            <span>{rt.bedType}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Maximize2 className="w-3.5 h-3.5 text-reserve-700" />
                            <span>{rt.roomSizeSqFt} sq. ft.</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-reserve-700" />
                            <span>Max {rt.maxGuests} Guests</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-reserve-100 flex items-center justify-between">
                        <div>
                          <div className="text-base font-serif font-bold text-charcoal-950">
                            &#8377;{rt.basePrice.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-sans font-normal text-charcoal-600">
                              / night
                            </span>
                          </div>
                          {item.nights > 1 && (
                            <div className="text-[11px] text-reserve-800 font-medium">
                              Total for {item.nights} nights: &#8377;
                              {item.totalPrice.toLocaleString('en-IN')} + taxes
                            </div>
                          )}
                        </div>

                        <button
                          disabled={!item.isAvailable}
                          onClick={() => {
                            setSelectedRoomType(rt);
                            setBookingModalOpen(true);
                          }}
                          className="px-6 py-2.5 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                          {item.isAvailable ? 'Reserve Suite' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Date Selection & Concierge Widget */}
        <div className="space-y-6">
          <div className="sticky top-28 bg-white p-6 rounded-2xl border border-reserve-200 shadow-md">
            <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-1">
              Check Sanctuary Dates
            </h3>
            <p className="text-xs text-charcoal-600 mb-5">
              Select stay dates to view real-time inventory and pricing.
            </p>

            <form onSubmit={handleCheckAvailability} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-charcoal-700 mb-1">
                  Check-in Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-charcoal-700 mb-1">
                  Check-out Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-charcoal-700 mb-1">
                  Total Guests
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 font-medium"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkingAvailability}
                className="w-full py-3 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50 shadow"
              >
                {checkingAvailability ? 'Updating Rates...' : 'Update Availability'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-reserve-200 space-y-3 text-xs text-charcoal-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Complimentary Artisanal Breakfast Included</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Free Cancellation up to 48 hours prior</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Best Rate Guarantee Direct from Hotel</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-reserve-50 border border-reserve-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-reserve-800 block mb-1">
                Direct Hotel Concierge
              </span>
              <p className="text-xs text-charcoal-800 font-semibold">{property.contactPhone}</p>
              <p className="text-xs text-charcoal-600">{property.contactEmail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Checkout Modal */}
      {selectedRoomType && (
        <BookingModal
          property={property}
          roomType={selectedRoomType}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          guests={guests}
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedRoomType(null);
            handleCheckAvailability();
          }}
        />
      )}
    </div>
  );
};
