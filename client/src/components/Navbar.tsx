import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { Hotel, User as UserIcon, LogOut, ShieldCheck, Calendar, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isStaff, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-reserve-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full bg-reserve-900 text-reserve-300 flex items-center justify-center font-serif text-xl font-bold border border-reserve-700 shadow-inner group-hover:scale-105 transition-transform">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-charcoal-950 leading-none">
                THE BOMBAY RESERVE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-reserve-700 font-semibold mt-1">
                14 Mumbai Boutique Havens
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-charcoal-800">
            <Link to="/properties" className="hover:text-reserve-700 transition-colors">
              Properties
            </Link>
            <Link to="/find-booking" className="hover:text-reserve-700 transition-colors flex items-center space-x-1.5">
              <Search className="w-4 h-4 text-reserve-600" />
              <span>Find Reservation</span>
            </Link>
            <Link to="/enquiries" className="hover:text-reserve-700 transition-colors">
              Bespoke Enquiries
            </Link>
            {user && !isStaff && (
              <Link to="/my-bookings" className="hover:text-reserve-700 transition-colors flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-reserve-600" />
                <span>My Stays</span>
              </Link>
            )}
            {isStaff && (
              <Link
                to="/staff"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Front-Desk Portal</span>
              </Link>
            )}
          </nav>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-charcoal-950">{user.fullName}</span>
                  <span className="text-[10px] text-reserve-700 uppercase font-semibold">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-full text-charcoal-700 hover:text-red-700 hover:bg-red-50 border border-reserve-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-md border border-reserve-300 text-charcoal-900 hover:bg-reserve-100 transition-colors flex items-center space-x-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/properties')}
                  className="hidden sm:inline-flex px-5 py-2 text-xs uppercase tracking-wider font-semibold rounded-md bg-reserve-900 text-white hover:bg-charcoal-950 shadow-sm transition-all"
                >
                  Book Stay
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {authModalOpen && <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />}
    </>
  );
};
