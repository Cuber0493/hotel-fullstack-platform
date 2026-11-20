import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { BookingFlowPage } from './BookingFlowPage';
import * as AuthContextModule from '../context/AuthContext';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  getAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
  setAccessToken: vi.fn(),
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Double booking conflict: dates unavailable'),
}));

describe('BookingFlowPage Component - Form Validation & Reservation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'usr-guest-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98200 11003',
        role: 'GUEST',
      },
      token: 'mock-jwt-token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isStaff: false,
      isAdmin: false,
      refreshUser: vi.fn(),
    });

    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/properties/')) {
        return Promise.resolve({
          data: {
            property: {
              id: 'prop-the-grand-colaba-mansion',
              slug: 'the-grand-colaba-mansion',
              name: 'The Grand Colaba Mansion',
              neighborhood: 'Colaba',
              roomTypes: [
                {
                  id: 'rt-colaba-suite',
                  slug: 'colaba-suite',
                  name: 'Colaba Heritage Suite',
                  basePrice: 18500,
                  capacity: 2,
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders booking step and stay summary with prefilled guest values', async () => {
    render(
      <MemoryRouter initialEntries={['/book?propertyId=prop-the-grand-colaba-mansion&roomTypeId=rt-colaba-suite&checkIn=2026-12-01&checkOut=2026-12-03&guests=2']}>
        <Routes>
          <Route path="/book" element={<BookingFlowPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Reservation/i)).toBeInTheDocument();
      expect(screen.getByText(/Stay Schedule/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Reservation/i })).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByDisplayValue('priya.sharma@example.com')).toBeInTheDocument();
  });

  it('calculates duration in nights and total INR tariff accurately', async () => {
    render(
      <MemoryRouter initialEntries={['/book?propertyId=prop-the-grand-colaba-mansion&roomTypeId=rt-colaba-suite&checkIn=2026-12-01&checkOut=2026-12-04&guests=2']}>
        <Routes>
          <Route path="/book" element={<BookingFlowPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // 3 nights @ 18,500 = ₹55,500
      expect(screen.getByText(/3 Night\(s\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/55,500/)[0]).toBeInTheDocument();
    });
  });

  it('validates contact details: displays error on short name or invalid phone', async () => {
    render(
      <MemoryRouter initialEntries={['/book?propertyId=prop-the-grand-colaba-mansion&roomTypeId=rt-colaba-suite']}>
        <Routes>
          <Route path="/book" element={<BookingFlowPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirm Reservation/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Priya Sharma');
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const phoneInput = screen.getByDisplayValue('+91 98200 11003');
    fireEvent.change(phoneInput, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /Confirm Reservation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Guest full name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Phone number must be at least 8 digits/i)).toBeInTheDocument();
    });
  });

  it('successfully submits valid booking and renders confirmation screen', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: {
        booking: {
          id: 'bk-confirmed-101',
          bookingCode: 'TBR-BOM-112233',
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-03',
          totalAmount: 37000,
          guestName: 'Priya Sharma',
          status: 'CONFIRMED',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/book?propertyId=prop-the-grand-colaba-mansion&roomTypeId=rt-colaba-suite&checkIn=2026-12-01&checkOut=2026-12-03&guests=2']}>
        <Routes>
          <Route path="/book" element={<BookingFlowPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirm Reservation/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm Reservation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('TBR-BOM-112233')).toBeInTheDocument();
      expect(screen.getByText(/Your Mumbai Stay Awaits/i)).toBeInTheDocument();
    });
  });

  it('displays server conflict error when double-booking is rejected with 409', async () => {
    (api.post as any).mockRejectedValueOnce(
      new Error('Selected suite has overlapping reservations for these dates')
    );

    render(
      <MemoryRouter initialEntries={['/book?propertyId=prop-the-grand-colaba-mansion&roomTypeId=rt-colaba-suite&checkIn=2026-12-01&checkOut=2026-12-03&guests=2']}>
        <Routes>
          <Route path="/book" element={<BookingFlowPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirm Reservation/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm Reservation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Selected suite has overlapping reservations for these dates/i)).toBeInTheDocument();
    });
  });
});
