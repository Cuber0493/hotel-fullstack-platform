import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BookingFlowPage } from './BookingFlowPage';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/properties/')) {
        return Promise.resolve({
          data: {
            property: {
              id: 'prop-the-grand-colaba-mansion',
              name: 'The Grand Colaba Mansion',
              neighborhood: 'Colaba',
              roomTypes: [
                {
                  id: 'rt-colaba-suite',
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
    }),
    post: vi.fn().mockResolvedValue({
      data: {
        booking: {
          id: 'bk-new',
          bookingCode: 'TBR-BOM-999888',
          status: 'CONFIRMED',
          totalAmount: 37000,
        },
      },
    }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  getAccessToken: vi.fn().mockReturnValue('mock-token'),
  setAccessToken: vi.fn(),
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Error occurred'),
}));

describe('BookingFlowPage Component', () => {
  it('renders booking step and reservation form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <BookingFlowPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Reservation/i)).toBeInTheDocument();
      expect(screen.getByText(/Stay Schedule/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Reservation/i })).toBeInTheDocument();
    });
  });
});
