import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Loader2 } from 'lucide-react';

// Lazy-loaded page components for optimal bundle performance
const HomePage = React.lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const SearchResultsPage = React.lazy(() =>
  import('./pages/SearchResultsPage').then((m) => ({ default: m.SearchResultsPage }))
);
const PropertiesPage = React.lazy(() =>
  import('./pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage }))
);
const PropertyDetailPage = React.lazy(() =>
  import('./pages/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage }))
);
const BookingFlowPage = React.lazy(() =>
  import('./pages/BookingFlowPage').then((m) => ({ default: m.BookingFlowPage }))
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const MyBookingsPage = React.lazy(() =>
  import('./pages/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage }))
);
const FindBookingPage = React.lazy(() =>
  import('./pages/FindBookingPage').then((m) => ({ default: m.FindBookingPage }))
);
const EnquiriesPage = React.lazy(() =>
  import('./pages/EnquiriesPage').then((m) => ({ default: m.EnquiriesPage }))
);
const AdminDashboardPage = React.lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminManagementPage = React.lazy(() =>
  import('./pages/AdminManagementPage').then((m) => ({ default: m.AdminManagementPage }))
);

const PageFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 py-20 text-center">
    <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
    <span className="text-xs uppercase tracking-widest text-stone-500 font-serif">
      The Bombay Reserve
    </span>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public Guest Discovery */}
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/properties/:slug" element={<PropertyDetailPage />} />
                <Route path="/find-booking" element={<FindBookingPage />} />
                <Route path="/enquiries" element={<EnquiriesPage />} />

                {/* Authentication */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Guest Routes */}
                <Route
                  path="/book"
                  element={
                    <ProtectedRoute>
                      <BookingFlowPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/manage"
                  element={
                    <AdminRoute>
                      <AdminManagementPage />
                    </AdminRoute>
                  }
                />
                <Route path="/staff" element={<Navigate to="/admin" replace />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
