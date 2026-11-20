import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Phone, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(defaultMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, fullName, phone);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(demoEmail, 'Password@123');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-8 border border-reserve-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-charcoal-400 hover:text-charcoal-800 p-1 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold">
            The Bombay Reserve
          </span>
          <h2 className="text-2xl font-serif font-bold text-charcoal-950 mt-1">
            {isRegister ? 'Create Guest Account' : 'Welcome to Your Sanctuary'}
          </h2>
          <p className="text-xs text-charcoal-600 mt-1">
            {isRegister
              ? 'Join our private collective for seamless reservations & bespoke privileges'
              : 'Sign in to access your reservation itinerary and concierge preferences'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Merchant"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 focus:border-transparent"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                <input
                  type="tel"
                  placeholder="+91 98200 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Complete Registration' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-xs text-reserve-700 hover:text-reserve-900 font-semibold"
          >
            {isRegister
              ? 'Already registered? Sign In'
              : "Don't have an account? Create One"}
          </button>
        </div>

        {/* Demo One-Click Logins for Convenience */}
        <div className="mt-6 pt-5 border-t border-reserve-200">
          <div className="flex items-center justify-center space-x-1 text-[11px] font-semibold text-reserve-800 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Instant Demo Logins</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('staff@bombayreserve.com')}
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-medium text-[11px] transition-colors"
            >
              Front-Desk Staff
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@bombayreserve.com')}
              className="py-1.5 px-2 bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-900 border border-charcoal-300 rounded font-medium text-[11px] transition-colors"
            >
              General Manager (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
