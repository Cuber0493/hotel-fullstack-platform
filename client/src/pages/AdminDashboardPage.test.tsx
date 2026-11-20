import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        from: '2026-11-01',
        to: '2026-11-14',
        days: 14,
        overall: {
          totalRooms: 10,
          roomNightsSold: 45,
          roomNightsAvailable: 60,
          roomRevenueInr: 810000,
          occupancyRate: 0.75,
          adr: 18000,
          revpar: 13500,
        },
        properties: [
          {
            propertyId: 'prop-the-grand-colaba-mansion',
            propertyName: 'The Grand Colaba Mansion',
            propertySlug: 'the-grand-colaba-mansion',
            totalRooms: 10,
            roomNightsSold: 45,
            roomNightsAvailable: 60,
            roomRevenueInr: 810000,
            occupancyRate: 0.75,
            adr: 18000,
            revpar: 13500,
          },
        ],
        dailyTrends: [
          {
            date: '2026-11-01',
            roomNightsSold: 3,
            roomNightsAvailable: 4,
            roomRevenueInr: 54000,
            occupancyRate: 0.75,
            adr: 18000,
            revpar: 13500,
          },
        ],
        monthlyTrends: [],
      },
    }),
  },
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Failed to load metrics'),
}));

describe('AdminDashboardPage Component', () => {
  it('renders executive performance KPIs (Occupancy, ADR, RevPAR, Revenue)', async () => {
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Revenue & Performance Analytics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/75\.0%/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/18,000/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/13,500/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/The Grand Colaba Mansion/)[0]).toBeInTheDocument();
    });
  });
});
