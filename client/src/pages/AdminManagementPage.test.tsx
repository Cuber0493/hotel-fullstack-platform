import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminManagementPage } from './AdminManagementPage';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/properties')) {
        return Promise.resolve({
          data: {
            properties: [
              {
                id: 'prop-1',
                slug: 'the-colaba-colonial',
                name: 'The Colaba Colonial',
                neighborhood: 'Colaba',
                address: '14 Boman Behram Marg',
                roomTypesCount: 2,
                roomsCount: 6,
                startingPrice: 16500,
              },
            ],
          },
        });
      }
      if (url.includes('/rooms/admin') || url.includes('/rooms')) {
        return Promise.resolve({
          data: {
            rooms: [
              {
                id: 'rm-101',
                roomNumber: '101',
                floor: 1,
                status: 'AVAILABLE',
                property: { name: 'The Colaba Colonial' },
                roomType: { name: 'Heritage Suite', basePrice: 18500 },
              },
            ],
          },
        });
      }
      if (url.includes('/bookings')) {
        return Promise.resolve({
          data: {
            bookings: [
              {
                id: 'bk-1',
                bookingCode: 'TBR-BOM-123456',
                guestName: 'Ananya Birla',
                guestEmail: 'ananya@example.com',
                status: 'CONFIRMED',
                totalAmount: 55500,
                checkInDate: '2026-12-01',
                checkOutDate: '2026-12-04',
              },
            ],
          },
        });
      }
      if (url.includes('/enquiries')) {
        return Promise.resolve({
          data: {
            enquiries: [
              {
                id: 'enq-1',
                name: 'Natasha Poonawalla',
                email: 'natasha@example.com',
                status: 'NEW',
                message: 'Private celebration in the heritage courtyard',
                createdAt: '2026-11-20T10:00:00Z',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(),
    patch: vi.fn(),
  },
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Error occurred'),
}));

describe('AdminManagementPage Component', () => {
  it('renders management console and properties tab', async () => {
    render(
      <BrowserRouter>
        <AdminManagementPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Management Console/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Properties/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Room Inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reservations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inquiries/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('The Colaba Colonial')).toBeInTheDocument();
    });
  });

  it('switches to bookings tab and shows reservation list', async () => {
    render(
      <BrowserRouter>
        <AdminManagementPage />
      </BrowserRouter>
    );

    const reservationsTab = screen.getByRole('button', { name: /Reservations/i });
    fireEvent.click(reservationsTab);

    await waitFor(() => {
      expect(screen.getByText('TBR-BOM-123456')).toBeInTheDocument();
      expect(screen.getByText('Ananya Birla')).toBeInTheDocument();
    });
  });
});
