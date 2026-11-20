import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import * as AuthContextModule from '../context/AuthContext';

vi.mock('../api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  getAccessToken: vi.fn().mockReturnValue(null),
  setAccessToken: vi.fn(),
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Invalid credentials'),
}));

describe('LoginPage Component - Form & Validation', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      isStaff: false,
      isAdmin: false,
      refreshUser: vi.fn(),
    });
  });

  it('renders login form with email, password, and submit button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Member Sign In/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/priya.sharma@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Your Account/i })).toBeInTheDocument();
  });

  it('displays client validation errors for empty fields on submit', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In to Your Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('displays client validation error for invalid email format', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/priya.sharma@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email-address' } });
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Your Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('displays client validation error when password is under 8 characters', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/priya.sharma@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    fireEvent.change(emailInput, { target: { value: 'guest@bombayreserve.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Your Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits valid credentials and navigates on success', async () => {
    mockLogin.mockResolvedValueOnce({
      id: 'usr-1',
      email: 'guest@bombayreserve.com',
      role: 'GUEST',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home Landing Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/priya.sharma@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    fireEvent.change(emailInput, { target: { value: 'guest@bombayreserve.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password@123' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Your Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('guest@bombayreserve.com', 'Password@123');
    });
  });

  it('displays server error banner when login credentials fail', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password combination'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/priya.sharma@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    fireEvent.change(emailInput, { target: { value: 'guest@bombayreserve.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword@123' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Your Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password combination/i)).toBeInTheDocument();
    });
  });
});
