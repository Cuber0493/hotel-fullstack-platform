import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    properties: [],
  }),
}));

describe('App Navigation and Layout', () => {
  it('renders brand header with 14 Mumbai Boutiques and navigation', () => {
    render(<App />);
    expect(screen.getAllByText(/THE BOMBAY RESERVE/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/14 Mumbai Boutique Havens/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Properties/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Find Reservation/i)).toBeInTheDocument();
  });
});
