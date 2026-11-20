import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../context/AuthContext';

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
  getApiErrorMessage: vi.fn((err: any) => err?.message || 'Error occurred'),
}));

describe('LoginPage Component', () => {
  it('renders login form with email, password, and submit button', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Member Sign In/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/priya.sharma@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Your Account/i })).toBeInTheDocument();
  });

  it('displays client validation errors for empty inputs on submit', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In to Your Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });
});
