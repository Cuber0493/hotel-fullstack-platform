import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { ManageBookingPage } from './pages/ManageBookingPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-reserve-50 text-charcoal-900 flex flex-col justify-between selection:bg-reserve-200">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:slug" element={<PropertyDetailPage />} />
              <Route path="/find-booking" element={<ManageBookingPage />} />
              <Route path="/enquiries" element={<EnquiriesPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/staff" element={<StaffDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
