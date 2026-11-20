import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal-950 text-reserve-100 border-t border-charcoal-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-charcoal-800">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <span className="font-serif text-2xl font-bold tracking-widest text-white block mb-3">
              THE BOMBAY RESERVE
            </span>
            <p className="text-xs text-reserve-300 leading-relaxed font-light mb-4">
              A private collective of 14 restored heritage and modern architectural boutique hotels across Mumbai.
            </p>
            <div className="flex items-center space-x-2 text-xs text-reserve-400">
              <Award className="w-4 h-4 text-reserve-400" />
              <span>Condé Nast Traveller Featured 2026</span>
            </div>
          </div>

          {/* Neighborhood Havens */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-reserve-300 mb-4">
              Boutique Precincts
            </h4>
            <ul className="space-y-2 text-xs text-reserve-200">
              <li>Colaba & Gateway Heritage</li>
              <li>Marine Drive Art Deco Promenades</li>
              <li>Pali Hill Portuguese Manors</li>
              <li>Juhu & Versova Coastal Sanctuaries</li>
              <li>Powai Lakefront & BKC Executive</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-reserve-300 mb-4">
              Guest Services
            </h4>
            <ul className="space-y-2 text-xs text-reserve-200">
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Explore 14 Properties
                </Link>
              </li>
              <li>
                <Link to="/find-booking" className="hover:text-white transition-colors">
                  Find & Manage Reservation
                </Link>
              </li>
              <li>
                <Link to="/enquiries" className="hover:text-white transition-colors">
                  Weddings & Corporate Retreats
                </Link>
              </li>
              <li>
                <Link to="/staff" className="hover:text-white transition-colors">
                  Staff & Front-Desk Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Concierge Contact */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-reserve-300 mb-4">
              Mumbai Concierge Desk
            </h4>
            <ul className="space-y-3 text-xs text-reserve-200">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-reserve-400 shrink-0 mt-0.5" />
                <span>14 B.K. Boman Behram Marg, Colaba, Mumbai 400001</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-reserve-400 shrink-0" />
                <span>+91 22 6900 1400 (24/7 Desk)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-reserve-400 shrink-0" />
                <span>concierge@bombayreserve.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-reserve-400">
          <p>&copy; {new Date().getFullYear()} The Bombay Reserve Collective. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Reservation</span>
            <span>Heritage Conservation Trust</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
