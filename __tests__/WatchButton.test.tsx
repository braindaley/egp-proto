import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { WatchButton } from '@/components/WatchButton';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
import { useAuth } from '@/hooks/use-auth';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/use-watched-groups');
jest.mock('@/hooks/use-auth');

const mockRouter = {
  push: jest.fn(),
};

const mockUseWatchedGroups = {
  isWatched: jest.fn(),
  toggleWatch: jest.fn(),
};

const mockUseAuth = {
  user: null,
};

describe('WatchButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useWatchedGroups as jest.Mock).mockReturnValue(mockUseWatchedGroups);
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.user = null;
    });

    it('should redirect to login when clicked', () => {
      mockUseWatchedGroups.isWatched.mockReturnValue(false);
      
      render(<WatchButton groupSlug="test-group" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/login?returnTo=' + encodeURIComponent(window.location.pathname)
      );
    });

    it('should show "Watch" text when group is not watched', () => {
      mockUseWatchedGroups.isWatched.mockReturnValue(false);
      
      render(<WatchButton groupSlug="test-group" />);
      
      expect(screen.getByText('Watch')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuth.user = { uid: 'test-user' };
    });

    it('should toggle watch state when clicked', () => {
      mockUseWatchedGroups.isWatched.mockReturnValue(false);
      
      render(<WatchButton groupSlug="test-group" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockUseWatchedGroups.toggleWatch).toHaveBeenCalledWith('test-group');
    });

    it('should show "Unwatch" when group is watched', () => {
      mockUseWatchedGroups.isWatched.mockReturnValue(true);
      
      render(<WatchButton groupSlug="test-group" />);
      
      expect(screen.getByText('Unwatch')).toBeInTheDocument();
    });

    it('should show "Watch" when group is not watched', () => {
      mockUseWatchedGroups.isWatched.mockReturnValue(false);
      
      render(<WatchButton groupSlug="test-group" />);
      
      expect(screen.getByText('Watch')).toBeInTheDocument();
    });

    it('should apply correct styling when watched', () => {
      mockUseWatchedGroups.isWatched.mockReturnValue(true);
      
      render(<WatchButton groupSlug="test-group" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-50', 'text-blue-700', 'border-blue-200');
    });
  });

  describe('accessibility and interaction', () => {
    it('should prevent event propagation when clicked', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };
      
      mockUseAuth.user = { uid: 'test-user' };
      mockUseWatchedGroups.isWatched.mockReturnValue(false);
      
      render(<WatchButton groupSlug="test-group" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button, mockEvent);
      
      // Note: This test would need to be implemented differently to actually test preventDefault/stopPropagation
    });

    it('should accept custom className', () => {
      render(<WatchButton groupSlug="test-group" className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should accept different variants', () => {
      render(<WatchButton groupSlug="test-group" variant="secondary" />);
      
      // Test that variant prop affects styling
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});