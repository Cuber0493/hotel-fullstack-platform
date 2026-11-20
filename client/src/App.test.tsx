import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the brand name and tagline', () => {
    render(<App />);
    expect(screen.getByTestId('brand-logo')).toHaveTextContent('THE BOMBAY RESERVE');
    expect(screen.getByText(/14 Mumbai Havens/i)).toBeInTheDocument();
    expect(screen.getByText(/Architectural Sanctuaries Across Mumbai/i)).toBeInTheDocument();
  });
});
