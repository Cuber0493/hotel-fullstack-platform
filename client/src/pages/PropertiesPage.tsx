import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PropertySummary } from '../types';
import { apiRequest } from '../api/client';
import { MapPin, Search, ArrowRight, SlidersHorizontal, Check } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    searchParams.get('neighborhood') || ''
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [maxPrice, setMaxPrice] = useState<number>(
    searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 40000
  );

  const neighborhoods = [
    'All',
    'Colaba',
    'Marine Drive',
    'Kala Ghoda',
    'Malabar Hill',
    'Bandra',
    'Juhu',
    'Versova',
    'Worli',
    'Powai',
    'BKC',
    'Fort',
    'Dadar',
    'Girgaon',
  ];

  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedNeighborhood && selectedNeighborhood !== 'All') {
          queryParams.set('neighborhood', selectedNeighborhood);
        }
        if (searchQuery) {
          queryParams.set('search', searchQuery);
        }
        if (maxPrice < 40000) {
          queryParams.set('maxPrice', maxPrice.toString());
        }

        const res = await apiRequest<{ properties: PropertySummary[] }>(
          `/properties?${queryParams.toString()}`
        );
        setProperties(res.properties);
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [selectedNeighborhood, searchQuery, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold block mb-2">
          The Bombay Reserve Collection
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal-950">
          Our 14 Mumbai Sanctuaries
        </h1>
        <p className="text-sm text-charcoal-600 font-light mt-2">
          Select your ideal neighborhood, architectural style, and boutique room category.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-reserve-200 shadow-sm mb-12 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Keyword search input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-reserve-600" />
            <input
              type="text"
              placeholder="Search property name, ambiance, or amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
            />
          </div>

          {/* Price slider */}
          <div className="w-full md:w-72 flex items-center space-x-3 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-reserve-700 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-semibold text-charcoal-700 mb-1">
                <span>Max Starting Price</span>
                <span className="text-reserve-900">&#8377;{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={9000}
                max={40000}
                step={2000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-reserve-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Neighborhood Pill Filter */}
        <div className="pt-2 border-t border-reserve-100 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider shrink-0 mr-1">
            Precinct:
          </span>
          {neighborhoods.map((n) => {
            const isSelected = selectedNeighborhood === (n === 'All' ? '' : n);
            return (
              <button
                key={n}
                onClick={() => setSelectedNeighborhood(n === 'All' ? '' : n)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium text-xs ${
                  isSelected
                    ? 'bg-reserve-900 text-white shadow-sm'
                    : 'bg-reserve-50 text-charcoal-700 hover:bg-reserve-200 border border-reserve-200'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-reserve-200 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-reserve-50 rounded-2xl border border-reserve-200 p-8">
          <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
            No properties found matching your criteria
          </h3>
          <p className="text-xs text-charcoal-600 mb-4">
            Try adjusting your neighborhood selection or price range slider.
          </p>
          <button
            onClick={() => {
              setSelectedNeighborhood('');
              setSearchQuery('');
              setMaxPrice(40000);
            }}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-reserve-900 text-white"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {properties.map((property) => (
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

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {property.amenities.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-reserve-50 text-reserve-800 border border-reserve-200"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-reserve-100 flex items-center justify-between text-xs text-charcoal-600">
                  <span>{property.roomTypesCount} Room Types</span>
                  <span className="font-semibold text-reserve-800 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                    <span>Explore & Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
