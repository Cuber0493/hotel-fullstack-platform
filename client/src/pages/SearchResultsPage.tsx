import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client';
import { RoomSearchResultItem, RoomSearchResponse } from '../types';
import {
  Search,
  Filter,
  Users,
  Calendar,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Bed,
} from 'lucide-react';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RoomSearchResultItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  });

  // Filter state initialized from URL query params
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [roomType, setRoomType] = useState(searchParams.get('roomType') || '');
  const [amenities, setAmenities] = useState<string[]>(
    searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'price_asc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: 8,
        sortBy,
        guests,
      };
      if (city) params.city = city;
      if (checkIn) params.checkIn = checkIn;
      if (checkOut) params.checkOut = checkOut;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (roomType) params.roomType = roomType;
      if (amenities.length > 0) params.amenities = amenities.join(',');

      const res = await api.get<RoomSearchResponse>('/rooms/search', { params });
      setResults(res.data.rooms);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [city, checkIn, checkOut, guests, minPrice, maxPrice, roomType, amenities, sortBy, page]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);

    const newParams = new URLSearchParams();
    if (city) newParams.set('city', city);
    if (checkIn) newParams.set('checkIn', checkIn);
    if (checkOut) newParams.set('checkOut', checkOut);
    if (guests > 1) newParams.set('guests', String(guests));
    if (minPrice) newParams.set('minPrice', minPrice);
    if (maxPrice) newParams.set('maxPrice', maxPrice);
    if (roomType) newParams.set('roomType', roomType);
    if (amenities.length > 0) newParams.set('amenities', amenities.join(','));
    newParams.set('sortBy', sortBy);
    newParams.set('page', '1');

    setSearchParams(newParams);
  };

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const popularAmenities = ['Sea View', 'Balcony', 'Butler', 'WiFi', 'Pool', 'Breakfast'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950">
          Available Havens & Suites
        </h1>
        <p className="mt-2 text-stone-600 text-sm">
          Discover hand-crafted suites across our 14 Mumbai collective properties
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 bg-white p-6 border border-stone-200 rounded-3xl shadow-sm h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center space-x-2 text-stone-900 font-serif font-bold text-lg">
              <Filter className="w-5 h-5 text-amber-600" />
              <span>Filters</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCity('');
                setCheckIn('');
                setCheckOut('');
                setGuests(1);
                setMinPrice('');
                setMaxPrice('');
                setRoomType('');
                setAmenities([]);
                setSortBy('price_asc');
                setPage(1);
                setSearchParams({});
              }}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} className="space-y-5">
            {/* Neighborhood / City */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Neighborhood
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Colaba, Bandra, Juhu..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/50"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 mb-1">
                  Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/50"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 mb-1">
                  Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/50"
                />
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/50"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Price Range (₹ INR)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-1/2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white"
                />
                <span className="text-stone-400">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-1/2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white"
                />
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                placeholder="Suite, Deluxe, Heritage..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white"
              />
            </div>

            {/* Amenities Checkboxes */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                Amenities
              </label>
              <div className="space-y-2">
                {popularAmenities.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-sm transition-all"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Results Section */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sorting & Result Counts Bar */}
          <div className="bg-white p-4 border border-stone-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-stone-600 font-medium">
              Showing <span className="font-bold text-stone-950">{pagination.total}</span> suites
              available
            </span>

            <div className="flex items-center space-x-2 text-sm">
              <ArrowUpDown className="w-4 h-4 text-stone-500" />
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-700">
                Sort By:
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-xs focus:bg-white focus:outline-none"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="capacity_desc">Capacity: High to Low</option>
                <option value="name_asc">Suite Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 animate-pulse"
                >
                  <div className="w-full h-52 bg-stone-200 rounded-2xl" />
                  <div className="h-5 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                  <div className="h-10 bg-stone-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                No Suites Match Your Search
              </h3>
              <p className="text-stone-600 text-sm max-w-md mx-auto">
                Try expanding your price range, clearing specific amenities, or adjusting your
                travel dates.
              </p>
            </div>
          )}

          {/* Results Grid */}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((room) => {
                const coverImage =
                  room.images?.[0] ||
                  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80';

                return (
                  <div
                    key={room.id}
                    className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={room.roomTypeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                          {room.neighborhood}
                        </div>
                        {room.availableRoomsCount > 0 && (
                          <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                            {room.availableRoomsCount} Available
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                        <div className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
                          {room.propertyName}
                        </div>
                        <h3 className="font-serif text-xl font-bold text-stone-950 group-hover:text-amber-800 transition-colors">
                          {room.roomTypeName}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2">
                          {room.description}
                        </p>

                        {/* Specs */}
                        <div className="flex items-center space-x-4 text-xs text-stone-700 pt-2 border-t border-stone-100">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-stone-500" />
                            <span>Up to {room.capacity} Guests</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Bed className="w-3.5 h-3.5 text-stone-500" />
                            <span>Boutique Luxury</span>
                          </div>
                        </div>

                        {/* Amenities Badges */}
                        {room.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {room.amenities.slice(0, 3).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="bg-stone-100 text-stone-700 text-[10px] font-medium px-2 py-0.5 rounded-md"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer / CTA */}
                    <div className="p-6 pt-0 flex items-center justify-between border-t border-stone-100/80 mt-4">
                      <div>
                        <span className="text-xs text-stone-500 block">From</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-bold font-serif text-stone-950">
                            ₹{room.baseRateInr.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-stone-500">/ night</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const queryParams = new URLSearchParams();
                          queryParams.set('propertyId', room.propertyId);
                          queryParams.set('roomTypeId', room.roomTypeId);
                          if (checkIn) queryParams.set('checkIn', checkIn);
                          if (checkOut) queryParams.set('checkOut', checkOut);
                          if (guests) queryParams.set('guests', String(guests));
                          navigate(`/book?${queryParams.toString()}`);
                        }}
                        className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-sm transition-all"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 pt-6">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-stone-700" />
              </button>
              <span className="text-xs font-semibold text-stone-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-stone-700" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
