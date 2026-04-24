import { render, screen, fireEvent } from '@/tests/test-utils';
import AppNav from './AppNav';
import { describe, it, expect, vi } from 'vitest';
import { mockWagmiHooks } from '@/tests/mocks/wagmi';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/app'),
}));

// Mock AvaxConnectButton since it's a complex component from RainbowKit
vi.mock('../../AvaxConnectButton', () => ({
  AvaxConnectButton: () => <button data-testid="connect-button">Connect Wallet</button>,
}));

describe('AppNav', () => {
  it('renders logo and navigation links', () => {
    render(<AppNav />);
    
    // Check logo
    expect(screen.getByAltText(/VaultQuest Logo/i)).toBeInTheDocument();
    
    // Check desktop links
    expect(screen.getByRole('link', { name: 'Prizes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vault' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    // Set viewport to mobile
    window.innerWidth = 500;
    render(<AppNav />);
    
    const menuButton = screen.getByLabelText(/Toggle menu/i);
    fireEvent.click(menuButton);
    
    // Check if mobile links are visible
    const mobileLinks = screen.getAllByText('Prizes');
    expect(mobileLinks.length).toBeGreaterThan(1); // One desktop, one mobile
  });

  it('renders connect button', () => {
    render(<AppNav />);
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
  });
});
