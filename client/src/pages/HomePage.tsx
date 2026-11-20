import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertySummary } from '../types';
import { apiRequest } from '../api/client';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Sparkles, Compass, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Search Bar state
  const [neighborhood, setNeighborhood] = useState('');
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

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await apiRequest<{ properties: PropertySummary[] }>('/properties');
        setProperties(res.properties);
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (neighborhood) params.set('neighborhood', neighborhood);
    if (checkInDate) params.set('checkInDate', checkInDate);
    if (checkOutDate) params.set('checkOutDate', checkOutDate);
    params.set('guests', guests.toString());
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-charcoal-950 text-white overflow-hidden">
        {/* Background Image with warm gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85"
            alt="The Bombay Reserve Luxury Haven"
            className="w-full h-full object-cover object-center opacity-40 scale-105 transform motion-safe:animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-reserve-300 text-xs uppercase tracking-widest font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-reserve-300" />
            <span>14 Handpicked Architectural Havens</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Intimate Luxury Across Mumbai&rsquo;s Storied Quarters
          </h1>

          <p className="text-base sm:text-lg text-reserve-200 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            From Victorian manors in Colaba and cliffside ocean villas in Bandra to lakefront Scandinavian lodges in Powai. Experience authentic boutique hospitality.
          </p>

          {/* Booking Quick Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl border border-reserve-200 text-charcoal-900 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center text-left"
          >
            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-reserve-800 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-reserve-600" />
                <span>Neighborhood</span>
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full text-xs font-semibold bg-reserve-50 border border-reserve-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-reserve-500"
              >
                <option value="">All Mumbai Precincts</option>
                <option value="Colaba">Colaba (Heritage)</option>
                <option value="Marine Drive">Marine Drive (Sea Front)</option>
                <option value="Bandra">Bandra West (Bohemian / Fort)</option>
                <option value="Juhu">Juhu Beach (Coast)</option>
                <option value="Kala Ghoda">Kala Ghoda (Arts District)</option>
                <option value="Powai">Powai Lake</option>
                <option value="BKC">Bandra Kurla Complex (BKC)</option>
                <option value="Worli">Worli Sea Face</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-reserve-800 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-reserve-600" />
                <span>Check-In</span>
              </label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full text-xs font-semibold bg-reserve-50 border border-reserve-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-reserve-500"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-reserve-800 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-reserve-600" />
                <span>Check-Out</span>
              </label>
              <input
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-xs font-semibold bg-reserve-50 border border-reserve-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-reserve-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[11px] uppercase font-bold tracking-wider text-reserve-800 mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-reserve-600" />
                <span>Guests</span>
              </label>
              <div className="flex space-x-2">
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-1/3 text-xs font-semibold bg-reserve-50 border border-reserve-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-3 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-1 shadow-md"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Properties Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold block mb-2">
              Curated Portfolio
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-950">
              The 14 Mumbai Boutiques
            </h2>
            <p className="text-sm text-charcoal-700 mt-2 max-w-xl font-light">
              Each property is an architectural dialogue with Mumbai&rsquo;s past and present—limited keys, personal butlers, and bespoke culinary dining.
            </p>
          </div>

          <button
            onClick={() => navigate('/properties')}
            className="mt-4 md:mt-0 text-xs font-semibold text-reserve-800 hover:text-reserve-950 flex items-center space-x-1 group"
          >
            <span>View All 14 Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-reserve-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {properties.slice(0, 6).map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.slug}`)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-reserve-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.heroImage}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-charcoal-900 border border-reserve-200">
                    {property.neighborhood}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-charcoal-950/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-serif font-bold text-reserve-200">
                    From &#8377;{property.startingPrice.toLocaleString('en-IN')} / night
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-charcoal-950 group-hover:text-reserve-800 transition-colors">
                      {property.name}
                    </h3>
                    <p className="text-xs text-charcoal-600 line-clamp-2 mt-2 font-light leading-relaxed">
                      {property.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-reserve-100 flex items-center justify-between text-xs text-charcoal-600">
                    <span>{property.roomTypesCount} Room Categories</span>
                    <span className="font-semibold text-reserve-800 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                      <span>Reserve Sanctuary</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Boutique Pillars */}
      <section className="bg-reserve-100 py-20 border-y border-reserve-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold block mb-2">
              The Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-950">
              Hospitality as Cultural Immersion
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-white border border-reserve-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-reserve-100 text-reserve-800 flex items-center justify-center mx-auto mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-2">
                Curated Micro-Districts
              </h3>
              <p className="text-xs text-charcoal-600 font-light leading-relaxed">
                Stay inside Mumbai&rsquo;s living history—from Victorian stone arcades to coastal Koli villages, curated with bespoke local neighborhood walking guides.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-reserve-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-reserve-100 text-reserve-800 flex items-center justify-center mx-auto mb-5">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-2">
                Hyper-Personal Butler Service
              </h3>
              <p className="text-xs text-charcoal-600 font-light leading-relaxed">
                Every reservation includes an attentive private concierge: unpacking, curated vinyl selection, artisanal afternoon high teas, and chauffeured transfers.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-reserve-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-reserve-100 text-reserve-800 flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-950 mb-2">
                Unmatched Privacy & Discretion
              </h3>
              <p className="text-xs text-charcoal-600 font-light leading-relaxed">
                Strict limits of 6 to 14 keys per property guarantee absolute tranquility, whether you are hosting an intimate soiree or seeking quiet creative respite.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
