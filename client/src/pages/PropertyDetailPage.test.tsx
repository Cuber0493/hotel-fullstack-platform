import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PropertyDetailPage } from './PropertyDetailPage';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        property: {
          id: 'prop-the-grand-colaba-mansion',
          slug: 'the-grand-colaba-mansion',
          name: 'The Grand Colaba Mansion',
          neighborhood: 'Colaba',
          address: '14 B.K. Boman Behram Marg, Colaba, Mumbai 400001',
          description: 'A restored 1912 Victorian-Edwardian mansion steps from the Gateway of India.',
          heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          galleryImages: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'],
          amenities: ['Heritage Courtyard Café', 'Artisanal Breakfast', 'Valet Parking'],
          checkInTime: '14:00',
          checkOutTime: '11:00',
          roomTypes: [
            {
              id: 'rt-heritage-suite',
              slug: 'heritage-suite',
              name: 'Colaba Heritage Suite',
              description: 'Palatial suite with private Victorian veranda overlooking the Arabian Sea.',
              basePrice: 18500,
              baseRateINR: 18500,
              capacity: 2,
              amenities: ['Private Veranda', 'Sea View'],
              images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'],
            },
          ],
        },
      },
    }),
  },
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Failed to load property'),
}));

describe('PropertyDetailPage Component', () => {
  it('renders property title, neighborhood, address, and room types', async () => {
    render(
      <MemoryRouter initialEntries={['/properties/the-grand-colaba-mansion']}>
        <Routes>
          <Route path="/properties/:slug" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/The Grand Colaba Mansion/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Colaba, Mumbai/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Colaba Heritage Suite/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Heritage Courtyard Café/i)[0]).toBeInTheDocument();
    });
  });
});
