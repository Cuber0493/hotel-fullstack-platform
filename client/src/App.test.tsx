import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    properties: [],
  }),
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    request: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  getAccessToken: vi.fn().mockReturnValue(null),
  setAccessToken: vi.fn(),
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Error'),
}));

describe('App Navigation and Layout', () => {
  it('renders brand header with 14 Mumbai Boutiques and navigation', async () => {
    render(<App />);
    expect(screen.getAllByText(/THE BOMBAY RESERVE/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/14 Mumbai Boutique Havens/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Properties/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Find Itinerary/i)).toBeInTheDocument();
    expect(screen.getByText(/Concierge & Events/i)).toBeInTheDocument();
  });
});
