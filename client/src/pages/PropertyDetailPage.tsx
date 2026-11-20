import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client';
import { PropertyDetail, RoomType } from '../types';
import {
  MapPin,
  Clock,
  Sparkles,
  Users,
  Bed,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const PropertyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery Modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ property: PropertyDetail }>(`/properties/${slug}`);
        setProperty(res.data.property);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProperty();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-stone-500 font-serif tracking-widest text-sm uppercase">
          Curating Boutique Haven Details...
        </p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-stone-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">
          Property Not Found
        </h2>
        <p className="text-stone-600 text-sm">
          {error || `Unable to locate property '${slug}'.`}
        </p>
        <button
          onClick={() => navigate('/properties')}
          className="px-5 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold rounded-xl"
        >
          Return to All Properties
        </button>
      </div>
    );
  }

  const allImages = [
    property.heroImage,
    ...(property.galleryImages || []),
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero & Photo Gallery Showcase */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
              {property.neighborhood}, Mumbai
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-950 mt-1">
              {property.name}
            </h1>
            <p className="flex items-center space-x-1.5 text-stone-600 text-sm mt-2">
              <MapPin className="w-4 h-4 text-stone-400" />
              <span>{property.address}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setActivePhotoIdx(0);
              setGalleryOpen(true);
            }}
            className="px-5 py-2.5 bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs uppercase tracking-wider font-semibold rounded-xl shadow-sm transition-all"
          >
            View Gallery ({allImages.length} Photos)
          </button>
        </div>

        {/* Mosaic Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[420px] rounded-3xl overflow-hidden">
          <div
            onClick={() => {
              setActivePhotoIdx(0);
              setGalleryOpen(true);
            }}
            className="md:col-span-2 h-full cursor-pointer relative group overflow-hidden"
          >
            <img
              src={allImages[0]}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>

          <div className="hidden md:grid col-span-2 grid-cols-2 gap-4 h-full">
            {allImages.slice(1, 5).map((img, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActivePhotoIdx(idx + 1);
                  setGalleryOpen(true);
                }}
                className="h-full cursor-pointer relative group overflow-hidden rounded-xl"
              >
                <img
                  src={img}
                  alt={`${property.name} photo ${idx + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Details & Amenities */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-stone-200 pt-10">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-950 mb-3">
              The Experience
            </h2>
            <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-950 mb-4">
              Bespoke Amenities & Services
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200/80 p-3 rounded-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact & Policy Card */}
        <aside className="bg-stone-50 border border-stone-200 p-6 rounded-3xl h-fit space-y-6">
          <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-200 pb-3">
            Concierge & Policies
          </h3>

          <div className="space-y-4 text-xs text-stone-700">
            <div className="flex items-start space-x-2.5">
              <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Check-In / Check-Out</p>
                <p>Check-In from {property.checkInTime || '14:00'}</p>
                <p>Check-Out until {property.checkOutTime || '11:00'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Phone className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Direct Concierge</p>
                <p>{property.contactPhone || '+91 22 6900 1100'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Mail className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Concierge Desk</p>
                <p>{property.contactEmail || 'concierge@bombayreserve.com'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('room-selection');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-sm transition-all"
          >
            Select Room Category
          </button>
        </aside>
      </section>

      {/* Available Room Types */}
      <section id="room-selection" className="space-y-6 border-t border-stone-200 pt-10">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-950">
            Select Your Suite
          </h2>
          <p className="text-stone-600 text-sm mt-1">
            Tailored configurations and suites crafted for discerning travelers
          </p>
        </div>

        <div className="space-y-6">
          {property.roomTypes.map((rt) => {
            const suiteCover =
              rt.images?.[0] ||
              property.heroImage ||
              'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';

            return (
              <div
                key={rt.id}
                className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <img
                    src={suiteCover}
                    alt={rt.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 md:p-8 md:col-span-2 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <h3 className="font-serif text-2xl font-bold text-stone-950">
                        {rt.name}
                      </h3>
                      <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-stone-950">
                          ₹{rt.basePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-stone-500"> / night</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {rt.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700 pt-2 border-t border-stone-100">
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-amber-700" />
                        <span>Up to {rt.maxGuests} Guests</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Bed className="w-4 h-4 text-amber-700" />
                        <span>
                          {rt.bedCount} {rt.bedType} Bed(s)
                        </span>
                      </div>
                      {rt.roomSizeSqFt && (
                        <span>{rt.roomSizeSqFt} sq. ft.</span>
                      )}
                    </div>

                    {rt.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rt.amenities.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-stone-100 text-stone-800 text-[11px] px-2.5 py-1 rounded-md"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-stone-100">
                    <button
                      onClick={() => {
                        navigate(
                          `/book?propertyId=${property.id}&roomTypeId=${rt.id}`
                        );
                      }}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-sm transition-all"
                    >
                      Reserve This Suite
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gallery Lightbox Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setGalleryOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl w-full flex items-center justify-center">
            <button
              onClick={() =>
                setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
              }
              className="absolute left-2 p-3 rounded-full text-white/80 hover:text-white bg-black/50 hover:bg-black/70 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={allImages[activePhotoIdx]}
              alt={`Photo ${activePhotoIdx + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl"
            />

            <button
              onClick={() =>
                setActivePhotoIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-2 p-3 rounded-full text-white/80 hover:text-white bg-black/50 hover:bg-black/70 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute bottom-6 text-white/70 text-xs tracking-widest uppercase font-semibold">
            Photo {activePhotoIdx + 1} of {allImages.length}
          </div>
        </div>
      )}
    </div>
  );
};
