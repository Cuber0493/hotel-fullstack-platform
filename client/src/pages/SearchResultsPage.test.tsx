import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SearchResultsPage } from './SearchResultsPage';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        rooms: [
          {
            id: 'room-101',
            roomTypeId: 'rt-heritage-suite',
            propertyId: 'prop-the-grand-colaba-mansion',
            propertyName: 'The Grand Colaba Mansion',
            propertySlug: 'the-grand-colaba-mansion',
            neighborhood: 'Colaba',
            roomTypeName: 'Colaba Heritage Suite',
            roomTypeSlug: 'colaba-heritage-suite',
            description: 'Palatial suite with private Victorian veranda overlooking the Arabian Sea.',
            baseRateInr: 22000,
            capacity: 2,
            amenities: ['Sea View', 'Balcony', 'Butler'],
            images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'],
            availableRoomsCount: 3,
            availableRoomNumbers: ['101', '102', '103'],
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 8,
          totalPages: 1,
        },
      },
    }),
  },
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Search failed'),
}));

describe('SearchResultsPage Component', () => {
  it('renders search controls, filters, and room results card', async () => {
    render(
      <BrowserRouter>
        <SearchResultsPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Available Havens & Suites/i)).toBeInTheDocument();
    expect(screen.getByText(/Neighborhood/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Colaba Heritage Suite/i)).toBeInTheDocument();
      expect(screen.getByText(/The Grand Colaba Mansion/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reserve/i })).toBeInTheDocument();
    });
  });
});
