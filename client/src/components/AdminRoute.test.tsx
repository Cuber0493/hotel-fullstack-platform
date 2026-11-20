import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import * as AuthContextModule from '../context/AuthContext';

describe('AdminRoute Component', () => {
  it('renders loading spinner while checking executive credentials', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isStaff: false,
      isAdmin: false,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Executive Analytics Portal</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating Executive Credentials/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated visitor to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isStaff: false,
      isAdmin: false,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Executive Analytics Portal</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div>Member Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Member Login Screen/i)).toBeInTheDocument();
    expect(screen.queryByText(/Executive Analytics Portal/i)).not.toBeInTheDocument();
  });

  it('renders 403 access restricted banner when authenticated as non-admin GUEST', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'usr-guest',
        name: 'Guest User',
        email: 'guest@example.com',
        role: 'GUEST',
      },
      token: 'jwt-access-token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isStaff: false,
      isAdmin: false,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Executive Analytics Portal</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Executive Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/guest@example.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/Executive Analytics Portal/i)).not.toBeInTheDocument();
  });

  it('renders executive admin view when user has ADMIN role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'usr-admin',
        name: 'Anya Mehta',
        email: 'admin@bombayreserve.com',
        role: 'ADMIN',
      },
      token: 'jwt-admin-token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isStaff: true,
      isAdmin: true,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Executive Analytics Portal</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Executive Analytics Portal/i)).toBeInTheDocument();
  });
});
