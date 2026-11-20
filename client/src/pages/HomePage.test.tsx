import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

vi.mock('../api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    properties: [
      {
        id: 'prop-the-colaba-colonial',
        slug: 'the-colaba-colonial',
        name: 'The Colaba Colonial',
        neighborhood: 'Colaba, South Mumbai',
        address: '14 B.K. Boman Behram Marg, Colaba',
        description: 'A restored 1912 Victorian-Edwardian mansion steps from the Gateway of India.',
        heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        galleryImages: [],
        amenities: ['Heritage Courtyard Café', 'Artisanal Breakfast'],
        checkInTime: '14:00',
        checkOutTime: '11:00',
        roomTypesCount: 3,
        startingPrice: 15500,
      },
    ],
  }),
}));

describe('HomePage Component', () => {
  it('renders hero title and quick search bar', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Intimate Luxury Across Mumbai/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/All Mumbai Precincts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });
});
