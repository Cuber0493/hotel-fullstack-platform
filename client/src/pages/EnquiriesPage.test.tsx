import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EnquiriesPage } from './EnquiriesPage';

describe('EnquiriesPage Component', () => {
  it('renders bespoke event inquiry form with input fields', () => {
    render(
      <BrowserRouter>
        <EnquiriesPage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Bespoke Events & Celebrations/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Natasha Poonawalla/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Submit Bespoke Enquiry/i })
    ).toBeInTheDocument();
  });
});
