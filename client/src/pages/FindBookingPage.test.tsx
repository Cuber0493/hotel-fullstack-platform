import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FindBookingPage } from './FindBookingPage';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('TBR-BOM-882194')) {
        return Promise.resolve({
          data: {
            booking: {
              id: 'bk-101',
              bookingCode: 'TBR-BOM-882194',
              guestName: 'Priya Sharma',
              guestEmail: 'priya.sharma@example.com',
              checkInDate: '2026-12-01',
              checkOutDate: '2026-12-04',
              totalAmount: 55500,
              status: 'CONFIRMED',
              items: [
                {
                  id: 'bki-1',
                  roomType: {
                    name: 'Colaba Heritage Suite',
                  },
                },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error('Reservation not found'));
    }),
  },
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Search error'),
}));

describe('FindBookingPage Component', () => {
  it('renders search input and retrieves itinerary by reference code', async () => {
    render(
      <BrowserRouter>
        <FindBookingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Find Your Reservation/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/TBR-BOM-XXXXXX/i);
    fireEvent.change(input, { target: { value: 'TBR-BOM-882194' } });

    const submitBtn = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('TBR-BOM-882194')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Status: CONFIRMED')).toBeInTheDocument();
      expect(screen.getByText(/Colaba Heritage Suite/i)).toBeInTheDocument();
    });
  });
});
