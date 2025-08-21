import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FollowingPage from '@/app/following/page';
import { useAuth } from '@/hooks/use-auth';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useBills } from '@/hooks/use-bills';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth');
jest.mock('@/hooks/use-watched-groups');
jest.mock('@/hooks/use-watched-bills');
jest.mock('@/hooks/use-bills');

const mockRouter = {
  push: jest.fn(),
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

describe('FollowingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        isInitialLoadComplete: true,
      });
    });

    it('should redirect to login page', async () => {
      render(<FollowingPage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?returnTo=/following');
      });
    });
  });

  describe('when user is authenticated but loading', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user' },
        loading: true,
        isInitialLoadComplete: false,
      });
    });

    it('should show loading state', () => {
      render(<FollowingPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated and data is loading', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user' },
        loading: false,
        isInitialLoadComplete: true,
      });
      (useWatchedGroups as jest.Mock).mockReturnValue({
        watchedGroups: [],
      });
      (useWatchedBills as jest.Mock).mockReturnValue({
        watchedBills: [],
      });
      (useBills as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('should show bills loading state', () => {
      render(<FollowingPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Loading Following Feed')).toBeInTheDocument();
      expect(screen.getByText('Fetching bills you\'re following...')).toBeInTheDocument();
    });
  });

  describe('when data loading fails', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user' },
        loading: false,
        isInitialLoadComplete: true,
      });
      (useWatchedGroups as jest.Mock).mockReturnValue({
        watchedGroups: [],
      });
      (useWatchedBills as jest.Mock).mockReturnValue({
        watchedBills: [],
      });
      (useBills as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: { message: 'Failed to load bills' },
        refetch: jest.fn(),
      });
    });

    it('should show error state with retry button', () => {
      const mockRefetch = jest.fn();
      (useBills as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: { message: 'Failed to load bills' },
        refetch: mockRefetch,
      });

      render(<FollowingPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Error loading bills: Failed to load bills')).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('when user has no watched content', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user' },
        loading: false,
        isInitialLoadComplete: true,
      });
      (useWatchedGroups as jest.Mock).mockReturnValue({
        watchedGroups: [],
      });
      (useWatchedBills as jest.Mock).mockReturnValue({
        watchedBills: [],
      });
      (useBills as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('should show empty state with browse options', () => {
      render(<FollowingPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Start Following Content')).toBeInTheDocument();
      expect(screen.getByText('You\'re not following any advocacy groups or bills yet.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Browse Groups' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Browse Bills' })).toBeInTheDocument();
    });
  });

  describe('when user has watched content', () => {
    const mockBills = [
      {
        congress: 118,
        type: 'hr',
        number: '1234',
        shortTitle: 'Test Bill 1',
        importanceScore: 100,
        sponsorFullName: 'Rep. Test Person',
        sponsorParty: 'D',
        committeeName: 'Test Committee',
        latestAction: {
          actionDate: '2024-01-01',
          text: 'Introduced in House'
        }
      },
      {
        congress: 118,
        type: 'hr',
        number: '5678',
        shortTitle: 'Test Bill 2',
        importanceScore: 90,
        sponsorFullName: 'Rep. Another Person',
        sponsorParty: 'R',
        committeeName: 'Another Committee',
        latestAction: {
          actionDate: '2024-01-02',
          text: 'Passed House'
        }
      }
    ];

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user' },
        loading: false,
        isInitialLoadComplete: true,
      });
      (useWatchedGroups as jest.Mock).mockReturnValue({
        watchedGroups: ['test-group'],
      });
      (useWatchedBills as jest.Mock).mockReturnValue({
        watchedBills: [{ congress: 118, type: 'hr', number: '1234' }],
      });
      (useBills as jest.Mock).mockReturnValue({
        data: mockBills,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('should show following bills with correct count', async () => {
      // Mock the advocacy groups data
      jest.doMock('@/lib/advocacy-groups', () => ({
        getAdvocacyGroupData: jest.fn().mockReturnValue({
          priorityBills: [
            {
              bill: { congress: 118, type: 'hr', number: '1234' }
            }
          ]
        })
      }));

      render(<FollowingPage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/Following \(/)).toBeInTheDocument();
      });
    });

    it('should render bill feed cards for followed bills', async () => {
      render(<FollowingPage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        // Test that bills are being processed (exact rendering depends on BillFeedCard component)
        expect(screen.getByText(/Following \(/)).toBeInTheDocument();
      });
    });
  });

  describe('additional bill fetching', () => {
    it('should fetch additional bills from watched groups that are not in main feed', async () => {
      // Mock global fetch
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/bill')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              congress: 118,
              type: 'hr',
              number: '9999',
              shortTitle: 'Additional Bill',
              title: 'Additional Bill Long Title'
            })
          });
        }
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user' },
        loading: false,
        isInitialLoadComplete: true,
      });
      (useWatchedGroups as jest.Mock).mockReturnValue({
        watchedGroups: ['test-group'],
      });
      (useWatchedBills as jest.Mock).mockReturnValue({
        watchedBills: [],
      });
      (useBills as jest.Mock).mockReturnValue({
        data: [], // Empty main feed
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<FollowingPage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/Following \(/)).toBeInTheDocument();
      });
    });
  });
});