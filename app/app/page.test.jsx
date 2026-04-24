import { render, screen, fireEvent } from '@/tests/test-utils';
import AppPage from './page';
import { describe, it, expect, vi } from 'vitest';

// Mock components used in page
vi.mock('@/components/app/AppNav', () => ({
  default: () => <nav data-testid="app-nav">Nav</nav>,
}));

vi.mock('@/components/app/PrizeGrid', () => ({
  default: () => <div data-testid="prize-grid">Prize Grid</div>,
}));

describe('AppPage', () => {
  it('renders landing state when not connected', () => {
    render(<AppPage />);
    
    expect(screen.getByText(/Save your deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Saving/i)).toBeInTheDocument();
  });

  it('changes state when Start Saving is clicked (placeholder logic)', () => {
    render(<AppPage />);
    
    const startButton = screen.getByText(/Start Saving/i);
    fireEvent.click(startButton);
    
    expect(screen.getByText(/View All Prizes/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Vaults/i)).toBeInTheDocument();
  });

  it('renders PrizeGrid', () => {
    render(<AppPage />);
    expect(screen.getByTestId('prize-grid')).toBeInTheDocument();
  });
});
