import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-stone-500 font-serif tracking-widest text-sm uppercase">
          Authenticating Executive Credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-stone-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">
          Executive Access Restricted
        </h2>
        <p className="text-stone-600 text-sm">
          Your current session ({user.email}) does not have administrative privileges. Please
          sign in with an authorized executive account to view this section.
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
