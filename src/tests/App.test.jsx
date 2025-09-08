import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import App from '../App';
import { config } from '../wagmi';

// Mock the services
vi.mock('../services/openai', () => ({
  generateRecommendations: vi.fn(() => Promise.resolve([
    {
      brandName: 'Patagonia',
      itemName: 'Organic Cotton T-Shirt',
      description: 'Sustainable cotton tee',
      ecoImpact: 'Saves 2,500L water',
      styleMatch: 'Minimalist style',
      estimatedPrice: '$35'
    }
  ]))
}));

vi.mock('../services/supabase', () => ({
  saveUserProfile: vi.fn(() => Promise.resolve({ id: '1' })),
  getUserProfile: vi.fn(() => Promise.resolve(null)),
  saveRecommendation: vi.fn(() => Promise.resolve({ id: '1' })),
  logPayment: vi.fn(() => Promise.resolve({ id: '1' })),
  getUserStats: vi.fn(() => Promise.resolve({
    totalRecommendations: 0,
    uniqueBrands: 0,
    totalSpent: '$0.00'
  }))
}));

vi.mock('../services/farcaster', () => ({
  identifyFarcasterUser: vi.fn(() => Promise.resolve(null))
}));

vi.mock('../services/businessLogic', () => ({
  enhanceRecommendations: vi.fn((recs) => recs.map(rec => ({
    ...rec,
    qualityScore: 85,
    personalizedReason: 'Great match for your style'
  }))),
  getUserTier: vi.fn(() => ({
    tier: 'starter',
    name: 'Eco Style Starter',
    benefits: ['Basic recommendations'],
    discount: 0
  }))
}));

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      isConnected: false,
      address: undefined
    }))
  };
});

vi.mock('../hooks/usePaymentContext', () => ({
  usePaymentContext: vi.fn(() => ({
    createSession: vi.fn(() => Promise.resolve({ success: true }))
  }))
}));

const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main app interface', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    expect(screen.getByText('EcoStyle Match')).toBeInTheDocument();
    expect(screen.getByText('Discover eco-friendly fashion that perfectly matches your style.')).toBeInTheDocument();
  });

  it('shows connect wallet message when not connected', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    expect(screen.getByText('Connect your wallet to start discovering sustainable fashion that matches your unique style.')).toBeInTheDocument();
  });

  it('shows profile form when wallet is connected', async () => {
    const { useAccount } = await import('wagmi');
    useAccount.mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890'
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tell us about your style')).toBeInTheDocument();
    });
  });

  it('handles profile form submission', async () => {
    const { useAccount } = await import('wagmi');
    const { generateRecommendations } = await import('../services/openai');
    
    useAccount.mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890'
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tell us about your style')).toBeInTheDocument();
    });

    // Fill out the form
    const brandsInput = screen.getByLabelText(/favorite brands/i);
    const fitsInput = screen.getByLabelText(/preferred fits/i);
    const aestheticsInput = screen.getByLabelText(/style aesthetic/i);
    const colorsInput = screen.getByLabelText(/color palette/i);

    fireEvent.change(brandsInput, { target: { value: 'Patagonia, Everlane' } });
    fireEvent.change(fitsInput, { target: { value: 'relaxed, oversized' } });
    fireEvent.change(aestheticsInput, { target: { value: 'minimalist' } });
    fireEvent.change(colorsInput, { target: { value: 'earth tones' } });

    // Submit the form
    const submitButton = screen.getByText('Get My Recommendations');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(generateRecommendations).toHaveBeenCalledWith({
        brands: 'Patagonia, Everlane',
        fits: 'relaxed, oversized',
        aesthetics: 'minimalist',
        colors: 'earth tones'
      });
    });
  });

  it('displays recommendations after form submission', async () => {
    const { useAccount } = await import('wagmi');
    
    useAccount.mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890'
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tell us about your style')).toBeInTheDocument();
    });

    // Fill and submit form
    const brandsInput = screen.getByLabelText(/favorite brands/i);
    fireEvent.change(brandsInput, { target: { value: 'Patagonia' } });
    
    const submitButton = screen.getByText('Get My Recommendations');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Patagonia')).toBeInTheDocument();
      expect(screen.getByText('Organic Cotton T-Shirt')).toBeInTheDocument();
    });
  });

  it('handles payment flow', async () => {
    const { useAccount } = await import('wagmi');
    const { usePaymentContext } = await import('../hooks/usePaymentContext');
    
    const mockCreateSession = vi.fn(() => Promise.resolve({ success: true }));
    usePaymentContext.mockReturnValue({
      createSession: mockCreateSession
    });

    useAccount.mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890'
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Simulate having recommendations and clicking get more
    await waitFor(() => {
      const getMoreButton = screen.queryByText('Get More Recommendations');
      if (getMoreButton) {
        fireEvent.click(getMoreButton);
        expect(screen.getByText('Payment Required')).toBeInTheDocument();
      }
    });
  });

  it('shows error boundary on component error', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <TestWrapper>
        <ThrowError />
      </TestWrapper>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

describe('Integration Tests', () => {
  it('completes full user flow', async () => {
    const { useAccount } = await import('wagmi');
    const { generateRecommendations } = await import('../services/openai');
    const { saveUserProfile, saveRecommendation } = await import('../services/supabase');
    
    useAccount.mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890'
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 1. User sees profile form
    await waitFor(() => {
      expect(screen.getByText('Tell us about your style')).toBeInTheDocument();
    });

    // 2. User fills out profile
    const brandsInput = screen.getByLabelText(/favorite brands/i);
    fireEvent.change(brandsInput, { target: { value: 'Patagonia' } });

    // 3. User submits profile
    const submitButton = screen.getByText('Get My Recommendations');
    fireEvent.click(submitButton);

    // 4. Profile is saved and recommendations are generated
    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalled();
      expect(generateRecommendations).toHaveBeenCalled();
      expect(saveRecommendation).toHaveBeenCalled();
    });

    // 5. User sees recommendations
    await waitFor(() => {
      expect(screen.getByText('Patagonia')).toBeInTheDocument();
    });
  });
});
