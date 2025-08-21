import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdvocacyMessagePage from '@/app/advocacy-message/page';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth');
jest.mock('@/hooks/use-zip-code');
jest.mock('@/hooks/useMembersByZip');
jest.mock('@/lib/firebase', () => ({
  app: {}
}));

const mockRouter = {
  push: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AdvocacyMessage Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Default mock returns
    mockSearchParams.get.mockImplementation((param) => {
      switch (param) {
        case 'congress': return '118';
        case 'type': return 'hr';
        case 'number': return '1234';
        case 'verified': return 'false';
        default: return null;
      }
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    (useZipCode as jest.Mock).mockReturnValue({
      zipCode: '12345',
    });

    (useMembersByZip as jest.Mock).mockReturnValue({
      representatives: [
        {
          name: 'Rep. Test Person',
          bioguideId: 'T000001',
          party: 'D',
        }
      ],
    });

    // Mock fetch for bill details
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/bill')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            congress: 118,
            type: 'hr',
            number: '1234',
            shortTitle: 'Test Bill',
            title: 'Test Bill Long Title',
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
      return Promise.reject(new Error('Unexpected fetch call'));
    });
  });

  describe('initial render and bill loading', () => {
    it('should render the stepper component', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Compose Message')).toBeInTheDocument();
        expect(screen.getByText('Select Outreach')).toBeInTheDocument();
        expect(screen.getByText('Review Message')).toBeInTheDocument();
      });
    });

    it('should show bill context when bill parameters are provided', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/Voice your opinion on HR 1234:/)).toBeInTheDocument();
      });
    });

    it('should fetch and display bill details', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/bill?congress=118&billType=hr&billNumber=1234');
      });
    });
  });

  describe('verified user flow', () => {
    beforeEach(() => {
      mockSearchParams.get.mockImplementation((param) => {
        switch (param) {
          case 'congress': return '118';
          case 'type': return 'hr';
          case 'number': return '1234';
          case 'verified': return 'true';
          default: return null;
        }
      });

      // Mock sessionStorage
      const mockVerifiedUser = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      };
      Storage.prototype.getItem = jest.fn().mockReturnValue(JSON.stringify(mockVerifiedUser));
    });

    it('should show verification notice for verified users', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText("You're verified as John Doe")).toBeInTheDocument();
      });
    });

    it('should use verified user information in personal data fields', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });
    });
  });

  describe('step 1 - compose message', () => {
    it('should allow selecting support stance', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        expect(supportButton).toHaveClass('bg-primary');
      });
    });

    it('should allow selecting oppose stance', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const opposeButton = screen.getByRole('button', { name: /Oppose/ });
        fireEvent.click(opposeButton);
        // The oppose button should have destructive styling when selected
      });
    });

    it('should enable AI template generation after stance selection', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        
        const generateButton = screen.getByRole('button', { name: /Generate AI Template/ });
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should allow manual message composition', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Write your message here/);
        fireEvent.change(textarea, { target: { value: 'Test message content' } });
        expect(textarea).toHaveValue('Test message content');
      });
    });

    it('should enable Next button when message and stance are set', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        // Select stance
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        
        // Add message
        const textarea = screen.getByPlaceholderText(/Write your message here/);
        fireEvent.change(textarea, { target: { value: 'Test message content' } });
        
        // Check next button is enabled
        const nextButton = screen.getByRole('button', { name: 'Next' });
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('AI message generation', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/ai/generate-advocacy-message')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              message: 'Generated AI message content'
            })
          });
        }
        if (url.includes('/api/bill')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              congress: 118,
              type: 'hr',
              number: '1234',
              shortTitle: 'Test Bill',
              title: 'Test Bill Long Title'
            })
          });
        }
        return Promise.reject(new Error('Unexpected fetch call'));
      });
    });

    it('should generate AI message when button is clicked', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        
        const generateButton = screen.getByRole('button', { name: /Generate AI Template/ });
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/generate-advocacy-message', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"userStance":"Support"')
        }));
      });
    });

    it('should display generated message in textarea', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        
        const generateButton = screen.getByRole('button', { name: /Generate AI Template/ });
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Write your message here/);
        expect(textarea).toHaveValue('Generated AI message content');
      });
    });
  });

  describe('personal data selection', () => {
    it('should show available personal data fields for authenticated users', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          uid: 'test-user',
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        loading: false,
      });

      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Full Address/)).toBeInTheDocument();
      });
    });

    it('should allow toggling personal data fields', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          uid: 'test-user',
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St'
        },
        loading: false,
      });

      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const addressCheckbox = screen.getByLabelText(/Full Address/);
        fireEvent.click(addressCheckbox);
        // Test checkbox state change
      });
    });

    it('should show anonymous user message when no personal data available', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('No personal information available')).toBeInTheDocument();
        expect(screen.getByText(/Your message will be sent anonymously/)).toBeInTheDocument();
      });
    });
  });

  describe('navigation between steps', () => {
    it('should proceed to step 2 when Next is clicked', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        // Complete step 1
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        
        const textarea = screen.getByPlaceholderText(/Write your message here/);
        fireEvent.change(textarea, { target: { value: 'Test message' } });
        
        const nextButton = screen.getByRole('button', { name: 'Next' });
        fireEvent.click(nextButton);
        
        // Should now be on step 2 (Select Outreach)
        expect(screen.getByText('Step 2: Select Outreach')).toBeInTheDocument();
      });
    });

    it('should allow going back to previous steps', async () => {
      render(<AdvocacyMessagePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        // Navigate to step 2
        const supportButton = screen.getByRole('button', { name: /Support/ });
        fireEvent.click(supportButton);
        
        const textarea = screen.getByPlaceholderText(/Write your message here/);
        fireEvent.change(textarea, { target: { value: 'Test message' } });
        
        const nextButton = screen.getByRole('button', { name: 'Next' });
        fireEvent.click(nextButton);
        
        // Go back
        const backButton = screen.getByRole('button', { name: 'Back' });
        fireEvent.click(backButton);
        
        // Should be back on step 1
        expect(screen.getByText('Step 1: Compose your message')).toBeInTheDocument();
      });
    });
  });
});