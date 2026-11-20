import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, Search, BarChart3, Settings2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-serif text-xl font-bold border border-amber-600/40 shadow-inner group-hover:scale-105 transition-transform">
            R
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-stone-950 leading-none">
              THE BOMBAY RESERVE
            </span>
            <span className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mt-1">
              14 Mumbai Boutique Havens
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-stone-800">
          <Link to="/properties" className="hover:text-amber-700 transition-colors">
            Properties
          </Link>
          <Link
            to="/search"
            className="hover:text-amber-700 transition-colors flex items-center space-x-1.5"
          >
            <Search className="w-4 h-4 text-amber-600" />
            <span>Search Rooms</span>
          </Link>
          <Link to="/find-booking" className="hover:text-amber-700 transition-colors">
            Find Itinerary
          </Link>
          <Link to="/enquiries" className="hover:text-amber-700 transition-colors">
            Concierge & Events
          </Link>

          {user && (
            <Link
              to="/my-bookings"
              className="hover:text-amber-700 transition-colors flex items-center space-x-1"
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>My Bookings</span>
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                to="/admin"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors font-semibold"
              >
                <BarChart3 className="w-4 h-4 text-amber-700" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/admin/manage"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-300 hover:bg-stone-200 transition-colors font-semibold"
              >
                <Settings2 className="w-4 h-4 text-stone-700" />
                <span>Manage Hub</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-stone-950">
                  {user.name || user.fullName || user.email}
                </span>
                <span className="text-[10px] text-amber-700 uppercase font-semibold">
                  {user.role}
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                title="Sign Out"
                className="p-2 rounded-full text-stone-700 hover:text-red-700 hover:bg-red-50 border border-stone-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-md border border-stone-300 text-stone-900 hover:bg-stone-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-md bg-stone-900 text-white hover:bg-black shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
