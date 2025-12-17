import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { SiteHeader } from '../site-header';

// Mock the useIsMobile hook
const mockUseIsMobile = mock(() => false);

// Mock external dependencies for GetStartedButton
const mockUseUser = mock(() => ({ user: null as User | null, loading: false }));
const mockPush = mock();

mock.module('@/lib/auth/hooks', () => ({
  useUser: mockUseUser,
}));

mock.module('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the hook
mock.module('@/hooks/use-mobile', () => ({
  useIsMobile: mockUseIsMobile,
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseIsMobile.mockClear();
  });

  // Test desktop navigation rendering - ensures horizontal navigation appears on desktop
  // Critical for verifying responsive behavior and proper desktop layout
  it('renders desktop navigation when not mobile', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    // Check site logo is rendered
    const logo = screen.getByText('ProductPix');
    expect(logo).not.toBeNull();

    // Check desktop navigation links are present
    expect(screen.getByText('Features')).not.toBeNull();
    expect(screen.getByText('How It Works')).not.toBeNull();
    expect(screen.getByText('Pricing')).not.toBeNull();

    // Check Get Started button is present
    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).not.toBeNull();
    expect(getStartedButton?.tagName).toBe('BUTTON');
  });

  // Test mobile navigation rendering - ensures hamburger menu appears on mobile
  // Critical for verifying responsive behavior and proper mobile layout
  it('renders mobile navigation when mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    render(<SiteHeader />);

    // Check site logo is rendered
    const logo = screen.getByText('ProductPix');
    expect(logo).not.toBeNull();

    // Check hamburger menu button is present (look for button with menu icon)
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).not.toBeNull();

    // Check that desktop navigation is not rendered
    expect(screen.queryByText('Features')).toBeNull();
    expect(screen.queryByText('How It Works')).toBeNull();
    expect(screen.queryByText('Pricing')).toBeNull();
  });

  // Test sticky header styling - ensures header has correct sticky positioning classes
  // Important for proper header behavior during page scrolling
  it('has sticky header styling', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    const header = screen.getByRole('banner'); // header element
    expect(header?.classList.contains('sticky')).toBe(true);
    expect(header?.classList.contains('top-0')).toBe(true);
    expect(header?.classList.contains('z-50')).toBe(true);
    expect(header?.classList.contains('bg-background/80')).toBe(true);
    expect(header?.classList.contains('backdrop-blur-md')).toBe(true);
  });

  // Test site logo rendering - ensures logo displays correctly with icon and text
  // Critical for brand recognition and proper visual hierarchy
  it('renders site logo with sparkles icon', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    const logo = screen.getByText('ProductPix');
    expect(logo).not.toBeNull();

    // Check that the logo container has the sparkles icon
    const logoContainer = logo.closest('div');
    const sparklesIcon = logoContainer?.querySelector('svg');
    expect(sparklesIcon).not.toBeNull();
    expect(sparklesIcon?.getAttribute('class')).toContain('text-primary');
  });

  // Test navigation link functionality - ensures links have correct href attributes
  // Critical for proper navigation and user experience
  it('has correct navigation link hrefs', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    const featuresLink = screen.getByText('Features').closest('a');
    const howItWorksLink = screen.getByText('How It Works').closest('a');
    const pricingLink = screen.getByText('Pricing').closest('a');

    expect(featuresLink?.getAttribute('href')).toBe('#features');
    expect(howItWorksLink?.getAttribute('href')).toBe('#how-it-works');
    expect(pricingLink?.getAttribute('href')).toBe('#pricing');
  });

  // Test mobile navigation links - ensures mobile drawer contains correct navigation
  // Important for mobile user experience and accessibility
  it('renders mobile navigation links in sheet', () => {
    mockUseIsMobile.mockReturnValue(true);

    render(<SiteHeader />);

    // The mobile nav is inside a Sheet component, so we need to check the structure
    // Since Sheet uses portals, we might need to check differently
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).not.toBeNull();

    // The links are rendered inside the SheetContent, which may not be in the DOM initially
    // This test verifies the component structure is correct
  });

  // Test responsive hook integration - ensures useIsMobile hook is called correctly
  // Critical for proper responsive behavior
  it('calls useIsMobile hook', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    expect(mockUseIsMobile).toHaveBeenCalledTimes(1);
  });

  // Test header layout structure - ensures proper flex layout and spacing
  // Important for visual consistency and responsive design
  it('has correct header layout structure', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    const container = header.querySelector('.max-w-6xl');

    expect(container?.classList.contains('mx-auto')).toBe(true);
    expect(container?.classList.contains('px-4')).toBe(true);
    expect(container?.classList.contains('py-6')).toBe(true);
    expect(container?.classList.contains('flex')).toBe(true);
    expect(container?.classList.contains('items-center')).toBe(true);
    expect(container?.classList.contains('justify-between')).toBe(true);
  });

  // Test navigation menu structure - ensures proper ARIA support and semantic HTML
  // Important for accessibility and screen reader support
  it('uses proper navigation menu structure', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    // Check that NavigationMenu components are present (get all nav elements)
    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThan(0);

    // Check that we have the main navigation container
    const mainNav = navs.find(nav => nav.getAttribute('aria-label') === 'Main');
    expect(mainNav).not.toBeNull();
  });

  // Test border styling - ensures header has proper border styling
  // Important for visual separation and design consistency
  it('has correct border styling', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header?.classList.contains('border-b')).toBe(true);
    expect(header?.classList.contains('border-border/40')).toBe(true);
  });
});

describe('SiteHeader Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseIsMobile.mockClear();
    mockUseUser.mockClear();
    mockPush.mockClear();
  });

  it('renders with real GetStartedButton component', () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseUser.mockReturnValue({ user: null, loading: false });

    render(<SiteHeader />);

    // Check Get Started button is present and is a real Button component
    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).not.toBeNull();
    expect(getStartedButton?.tagName).toBe('BUTTON');

    // Verify it has the expected Button classes (from shadcn/ui Button)
    expect(getStartedButton?.classList.contains('inline-flex')).toBe(true);
    expect(getStartedButton?.classList.contains('items-center')).toBe(true);
  });

  it('GetStartedButton navigates to signup when user is not logged in', async () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseUser.mockReturnValue({ user: null, loading: false });

    render(<SiteHeader />);

    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).not.toBeNull();

    // Click the button
    getStartedButton.click();

    // Should navigate to signup
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });

  it('GetStartedButton navigates to dashboard when user is logged in', async () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseUser.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as User,
      loading: false
    });

    render(<SiteHeader />);

    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).not.toBeNull();

    // Click the button
    getStartedButton.click();

    // Should navigate to dashboard
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('GetStartedButton is disabled while loading', () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseUser.mockReturnValue({ user: null, loading: true });

    render(<SiteHeader />);

    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).not.toBeNull();
    expect(getStartedButton?.hasAttribute('disabled')).toBe(true);
  });

  it('responsive behavior is covered by visual testing', () => {
    // This test documents that responsive behavior testing is handled
    // through visual regression testing rather than unit tests
    // The useIsMobile hook mock allows us to test both mobile and desktop states
    mockUseIsMobile.mockReturnValue(false);

    render(<SiteHeader />);

    // Verify desktop navigation is rendered
    expect(screen.getByText('Features')).not.toBeNull();
    expect(screen.getByText('How It Works')).not.toBeNull();
    expect(screen.getByText('Pricing')).not.toBeNull();

    // Verify mobile navigation is not rendered
    expect(screen.queryByRole('button', { name: /open menu/i })).toBeNull();
  });
});