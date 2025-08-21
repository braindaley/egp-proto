import { renderHook, act } from '@testing-library/react';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
import { useAuth } from '@/hooks/use-auth';

// Mock useAuth hook
jest.mock('@/hooks/use-auth');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useWatchedGroups hook', () => {
  const mockUser = {
    uid: 'test-user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });
    });

    it('should return empty watched groups', () => {
      const { result } = renderHook(() => useWatchedGroups());
      
      expect(result.current.watchedGroups).toEqual([]);
    });

    it('should indicate group is not watched', () => {
      const { result } = renderHook(() => useWatchedGroups());
      
      expect(result.current.isWatched('test-group')).toBe(false);
    });

    it('should not persist changes when toggling watch', () => {
      const { result } = renderHook(() => useWatchedGroups());
      
      act(() => {
        result.current.toggleWatch('test-group');
      });
      
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });
    });

    it('should load watched groups from localStorage', () => {
      const storedGroups = ['group1', 'group2', 'group3'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedGroups));
      
      const { result } = renderHook(() => useWatchedGroups());
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('watchedGroups_test-user-123');
      expect(result.current.watchedGroups).toEqual(storedGroups);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useWatchedGroups());
      
      expect(result.current.watchedGroups).toEqual([]);
    });

    it('should return empty array when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useWatchedGroups());
      
      expect(result.current.watchedGroups).toEqual([]);
    });

    describe('isWatched functionality', () => {
      it('should return true for watched groups', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['group1', 'group2']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        expect(result.current.isWatched('group1')).toBe(true);
        expect(result.current.isWatched('group2')).toBe(true);
      });

      it('should return false for non-watched groups', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['group1', 'group2']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        expect(result.current.isWatched('group3')).toBe(false);
        expect(result.current.isWatched('nonexistent')).toBe(false);
      });

      it('should be case sensitive', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['TestGroup']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        expect(result.current.isWatched('TestGroup')).toBe(true);
        expect(result.current.isWatched('testgroup')).toBe(false);
        expect(result.current.isWatched('TESTGROUP')).toBe(false);
      });
    });

    describe('toggleWatch functionality', () => {
      it('should add group when not currently watched', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['existing-group']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        act(() => {
          result.current.toggleWatch('new-group');
        });
        
        expect(result.current.watchedGroups).toContain('new-group');
        expect(result.current.watchedGroups).toContain('existing-group');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'watchedGroups_test-user-123',
          JSON.stringify(['existing-group', 'new-group'])
        );
      });

      it('should remove group when currently watched', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['group1', 'group2', 'group3']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        act(() => {
          result.current.toggleWatch('group2');
        });
        
        expect(result.current.watchedGroups).toEqual(['group1', 'group3']);
        expect(result.current.watchedGroups).not.toContain('group2');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'watchedGroups_test-user-123',
          JSON.stringify(['group1', 'group3'])
        );
      });

      it('should handle toggling the same group multiple times', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        // Add group
        act(() => {
          result.current.toggleWatch('toggle-group');
        });
        expect(result.current.isWatched('toggle-group')).toBe(true);
        
        // Remove group
        act(() => {
          result.current.toggleWatch('toggle-group');
        });
        expect(result.current.isWatched('toggle-group')).toBe(false);
        
        // Add group again
        act(() => {
          result.current.toggleWatch('toggle-group');
        });
        expect(result.current.isWatched('toggle-group')).toBe(true);
      });

      it('should not add duplicate groups', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['existing-group']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        // Try to add the same group twice
        act(() => {
          result.current.toggleWatch('existing-group');
        });
        
        act(() => {
          result.current.toggleWatch('existing-group');
        });
        
        // Should add it back only once
        act(() => {
          result.current.toggleWatch('existing-group');
        });
        
        const groupCount = result.current.watchedGroups.filter(g => g === 'existing-group').length;
        expect(groupCount).toBe(1);
      });

      it('should persist changes to localStorage on every toggle', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['group1']));
        
        const { result } = renderHook(() => useWatchedGroups());
        
        act(() => {
          result.current.toggleWatch('group2');
        });
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'watchedGroups_test-user-123',
          JSON.stringify(['group1', 'group2'])
        );
        
        act(() => {
          result.current.toggleWatch('group1');
        });
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
        expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
          'watchedGroups_test-user-123',
          JSON.stringify(['group2'])
        );
      });
    });

    describe('user change handling', () => {
      it('should reload data when user changes', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['user1-group']));
        
        const { result, rerender } = renderHook(() => useWatchedGroups());
        
        expect(result.current.watchedGroups).toEqual(['user1-group']);
        
        // Change user
        const newUser = { uid: 'different-user' };
        (useAuth as jest.Mock).mockReturnValue({
          user: newUser,
          loading: false
        });
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['user2-group']));
        
        rerender();
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('watchedGroups_different-user');
        expect(result.current.watchedGroups).toEqual(['user2-group']);
      });

      it('should clear data when user logs out', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['group1', 'group2']));
        
        const { result, rerender } = renderHook(() => useWatchedGroups());
        
        expect(result.current.watchedGroups).toEqual(['group1', 'group2']);
        
        // User logs out
        (useAuth as jest.Mock).mockReturnValue({
          user: null,
          loading: false
        });
        
        rerender();
        
        expect(result.current.watchedGroups).toEqual([]);
      });
    });
  });

  describe('loading states', () => {
    it('should return empty array while auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });
      
      const { result } = renderHook(() => useWatchedGroups());
      
      expect(result.current.watchedGroups).toEqual([]);
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('should not call localStorage while auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: true
      });
      
      renderHook(() => useWatchedGroups());
      
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });
  });
});