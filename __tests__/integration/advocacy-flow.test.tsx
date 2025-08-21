import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import AdvocacyMessagePage from '@/app/advocacy-message/page';

// Integration test for the full advocacy message flow
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth');
jest.mock('@/hooks/use-zip-code');
jest.mock('@/hooks/useMembersByZip');

const mockRouter = { push: jest.fn() };

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Advocacy Message Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock search params for bill context
    jest.doMock('next/navigation', () => ({
      useRouter: () => mockRouter,
      useSearchParams: () => ({
        get: (param: string) => {
          switch (param) {
            case 'congress': return '118';
            case 'type': return 'hr';
            case 'number': return '1234';
            case 'verified': return 'false';
            default: return null;
          }
        }
      })
    }));

    // Mock auth hook
    require('@/hooks/use-auth').useAuth = jest.fn().mockReturnValue({
      user: null,
      loading: false
    });

    // Mock zip code hook
    require('@/hooks/use-zip-code').useZipCode = jest.fn().mockReturnValue({
      zipCode: '12345'
    });

    // Mock members by zip hook
    require('@/hooks/useMembersByZip').useMembersByZip = jest.fn().mockReturnValue({
      representatives: [
        {
          name: 'Rep. Test Person',
          bioguideId: 'T000001',
          party: 'D',
          state: 'CA',
          district: '01'
        }
      ]
    });

    // Mock API responses
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/bill')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            congress: 118,
            type: 'hr',
            number: '1234',
            shortTitle: 'Test Advocacy Bill',
            title: 'Test Advocacy Bill Full Title',
            sponsors: [{
              fullName: 'Rep. Bill Sponsor',
              party: 'D',
              bioguideId: 'S000001'
            }],
            committees: {
              items: [{
                name: 'Test Committee',
                systemCode: 'test01'
              }]
            }
          })
        });
      }
      if (url.includes('/api/ai/generate-advocacy-message')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            message: 'Dear Representative,\n\nI am writing to express my support for HR 1234...'
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });
  });

  it('should complete the full advocacy message flow for anonymous users', async () => {
    render(<AdvocacyMessagePage />, { wrapper: createWrapper() });

    // Wait for initial render and bill loading
    await waitFor(() => {
      expect(screen.getByText(/Voice your opinion on HR 1234:/)).toBeInTheDocument();
    });

    // Step 1: Compose Message
    expect(screen.getByText('Step 1: Compose your message')).toBeInTheDocument();

    // Select stance
    const supportButton = screen.getByRole('button', { name: /Support/ });
    fireEvent.click(supportButton);

    // Generate AI message
    const generateButton = screen.getByRole('button', { name: /Generate AI Template/ });
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });
    fireEvent.click(generateButton);

    // Wait for AI message generation
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Write your message here/);
      expect(textarea).toHaveValue('Dear Representative,\n\nI am writing to express my support for HR 1234...');
    });

    // Proceed to step 2
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    // Step 2: Select Outreach
    await waitFor(() => {
      expect(screen.getByText('Step 2: Select Outreach')).toBeInTheDocument();
    });

    // Select representative
    const repCheckbox = screen.getByLabelText(/Rep. Test Person/);
    fireEvent.click(repCheckbox);

    // Proceed to step 3
    const nextButton2 = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton2);

    // Step 3: Review Message
    await waitFor(() => {
      expect(screen.getByText('Step 3: Review Message')).toBeInTheDocument();
    });

    // Verify message preview
    expect(screen.getByText('Recipients (1)')).toBeInTheDocument();
    expect(screen.getByText(/Dear Representative/)).toBeInTheDocument();

    // Send message
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendButton);

    // Should proceed to sending screen
    await waitFor(() => {
      expect(screen.getByText('Sending Your Message')).toBeInTheDocument();
    });
  });

  it('should handle verified user flow', async () => {
    // Mock verified user session storage
    const mockVerifiedUser = {
      fullName: 'John Doe',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    };
    Storage.prototype.getItem = jest.fn().mockReturnValue(JSON.stringify(mockVerifiedUser));

    // Update search params to indicate verified user
    jest.doMock('next/navigation', () => ({
      useRouter: () => mockRouter,
      useSearchParams: () => ({
        get: (param: string) => {
          switch (param) {
            case 'congress': return '118';
            case 'type': return 'hr';
            case 'number': return '1234';
            case 'verified': return 'true';
            default: return null;
          }
        }
      })
    }));

    render(<AdvocacyMessagePage />, { wrapper: createWrapper() });

    // Should show verification notice
    await waitFor(() => {
      expect(screen.getByText("You're verified as John Doe")).toBeInTheDocument();
    });

    // Should show personal data fields populated with verified user info
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    // Complete the flow
    const supportButton = screen.getByRole('button', { name: /Support/ });
    fireEvent.click(supportButton);

    const textarea = screen.getByPlaceholderText(/Write your message here/);
    fireEvent.change(textarea, { target: { value: 'Test verified user message' } });

    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    // Select representative
    await waitFor(() => {
      const repCheckbox = screen.getByLabelText(/Rep. Test Person/);
      fireEvent.click(repCheckbox);
    });

    const nextButton2 = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton2);

    // Review and send
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      fireEvent.click(sendButton);
    });
  });

  it('should handle authenticated user flow', async () => {
    // Mock authenticated user
    require('@/hooks/use-auth').useAuth = jest.fn().mockReturnValue({
      user: {
        uid: 'test-user',
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave',
        city: 'Somewhere',
        state: 'TX',
        zipCode: '54321'
      },
      loading: false
    });

    render(<AdvocacyMessagePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Voice your opinion on HR 1234:/)).toBeInTheDocument();
    });

    // Should show personal data fields for authenticated user
    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Address/)).toBeInTheDocument();
    });

    // Complete flow faster since user is authenticated
    const supportButton = screen.getByRole('button', { name: /Support/ });
    fireEvent.click(supportButton);

    const textarea = screen.getByPlaceholderText(/Write your message here/);
    fireEvent.change(textarea, { target: { value: 'Test authenticated user message' } });

    let nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    // Select representative
    await waitFor(() => {
      const repCheckbox = screen.getByLabelText(/Rep. Test Person/);
      fireEvent.click(repCheckbox);
    });

    nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    // Should skip account creation step for authenticated users
    await waitFor(() => {
      expect(screen.getByText('Step 3: Review Message')).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendButton);
  });

  it('should handle errors gracefully', async () => {
    // Mock API error
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/ai/generate-advocacy-message')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'AI service unavailable' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(<AdvocacyMessagePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const supportButton = screen.getByRole('button', { name: /Support/ });
      fireEvent.click(supportButton);
    });

    const generateButton = screen.getByRole('button', { name: /Generate AI Template/ });
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });
    fireEvent.click(generateButton);

    // Should handle AI generation error gracefully
    // Note: The actual error handling depends on implementation
    // This test ensures the app doesn't crash
  });

  it('should validate required fields before allowing progression', async () => {
    render(<AdvocacyMessagePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toBeDisabled();
    });

    // Select stance but no message
    const supportButton = screen.getByRole('button', { name: /Support/ });
    fireEvent.click(supportButton);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toBeDisabled();
    });

    // Add message
    const textarea = screen.getByPlaceholderText(/Write your message here/);
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    // Now should be able to proceed
    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).not.toBeDisabled();
    });
  });
});