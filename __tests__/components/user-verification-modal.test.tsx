import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserVerificationModal } from '@/components/user-verification-modal';

// Mock the useMembersByZip hook
jest.mock('@/hooks/useMembersByZip', () => ({
  useMembersByZip: () => ({
    representatives: [
      {
        name: 'Rep. John Doe',
        bioguideId: 'D000123',
        party: 'D',
        state: 'CA',
        district: '01'
      }
    ],
    loading: false,
    error: null
  })
}));

describe('UserVerificationModal Component', () => {
  const mockOnVerified = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onVerified: mockOnVerified
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render modal when isOpen is true', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
      expect(screen.getByText('Please provide your information to verify your identity with your representatives.')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<UserVerificationModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Verify Your Identity')).not.toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('State')).toBeInTheDocument();
      expect(screen.getByLabelText('ZIP Code')).toBeInTheDocument();
    });

    it('should have verify button initially disabled', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      expect(verifyButton).toBeDisabled();
    });
  });

  describe('form validation', () => {
    it('should enable verify button when all required fields are filled', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Smith' }
      });
      fireEvent.change(screen.getByLabelText('Street Address'), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText('City'), {
        target: { value: 'Anytown' }
      });
      fireEvent.change(screen.getByLabelText('State'), {
        target: { value: 'CA' }
      });
      fireEvent.change(screen.getByLabelText('ZIP Code'), {
        target: { value: '12345' }
      });
      
      await waitFor(() => {
        const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
        expect(verifyButton).not.toBeDisabled();
      });
    });

    it('should validate ZIP code format', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      const zipInput = screen.getByLabelText('ZIP Code');
      
      // Test invalid ZIP codes
      fireEvent.change(zipInput, { target: { value: '1234' } }); // Too short
      fireEvent.blur(zipInput);
      
      await waitFor(() => {
        expect(screen.getByText('ZIP code must be 5 or 9 digits')).toBeInTheDocument();
      });
      
      // Test valid ZIP code
      fireEvent.change(zipInput, { target: { value: '12345' } });
      fireEvent.blur(zipInput);
      
      await waitFor(() => {
        expect(screen.queryByText('ZIP code must be 5 or 9 digits')).not.toBeInTheDocument();
      });
    });

    it('should validate ZIP+4 format', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      const zipInput = screen.getByLabelText('ZIP Code');
      
      fireEvent.change(zipInput, { target: { value: '12345-6789' } });
      fireEvent.blur(zipInput);
      
      await waitFor(() => {
        expect(screen.queryByText('ZIP code must be 5 or 9 digits')).not.toBeInTheDocument();
      });
    });

    it('should require all fields to be filled', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      // Fill only some fields
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Smith' }
      });
      fireEvent.change(screen.getByLabelText('Street Address'), {
        target: { value: '123 Main St' }
      });
      // Leave city, state, zip empty
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      expect(verifyButton).toBeDisabled();
    });

    it('should trim whitespace from inputs', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: '  John Smith  ' }
      });
      fireEvent.change(screen.getByLabelText('Street Address'), {
        target: { value: '  123 Main St  ' }
      });
      fireEvent.change(screen.getByLabelText('City'), {
        target: { value: '  Anytown  ' }
      });
      fireEvent.change(screen.getByLabelText('State'), {
        target: { value: '  CA  ' }
      });
      fireEvent.change(screen.getByLabelText('ZIP Code'), {
        target: { value: '  12345  ' }
      });
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      
      await waitFor(() => {
        expect(mockOnVerified).toHaveBeenCalledWith({
          fullName: 'John Smith',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        });
      });
    });
  });

  describe('form submission', () => {
    const fillCompleteForm = () => {
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Smith' }
      });
      fireEvent.change(screen.getByLabelText('Street Address'), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText('City'), {
        target: { value: 'Anytown' }
      });
      fireEvent.change(screen.getByLabelText('State'), {
        target: { value: 'CA' }
      });
      fireEvent.change(screen.getByLabelText('ZIP Code'), {
        target: { value: '12345' }
      });
    };

    it('should call onVerified with form data when submitted', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      fillCompleteForm();
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      
      await waitFor(() => {
        expect(mockOnVerified).toHaveBeenCalledWith({
          fullName: 'John Smith',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        });
      });
    });

    it('should show loading state during verification', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      fillCompleteForm();
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      
      // Should show loading state immediately
      expect(screen.getByRole('button', { name: 'Verifying...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();
    });

    it('should prevent multiple submissions', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      fillCompleteForm();
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      fireEvent.click(verifyButton); // Second click
      
      await waitFor(() => {
        expect(mockOnVerified).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('modal interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking outside modal', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      // Find the backdrop/overlay and click it
      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle escape key to close modal', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('representative information', () => {
    it('should show representative information when available', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      expect(screen.getByText('Your Representative')).toBeInTheDocument();
      expect(screen.getByText('Rep. John Doe (D-CA-01)')).toBeInTheDocument();
    });

    it('should update representatives when ZIP code changes', async () => {
      // This would require mocking the hook to return different data
      // based on the ZIP code input
      render(<UserVerificationModal {...defaultProps} />);
      
      const zipInput = screen.getByLabelText('ZIP Code');
      fireEvent.change(zipInput, { target: { value: '90210' } });
      
      // Test would verify that hook is called with new ZIP code
      // and representatives are updated accordingly
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
    });

    it('should focus first input when opened', async () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Full Name')).toHaveFocus();
      });
    });

    it('should trap focus within modal', () => {
      render(<UserVerificationModal {...defaultProps} />);
      
      const firstInput = screen.getByLabelText('Full Name');
      const lastButton = screen.getByRole('button', { name: 'Verify Identity' });
      
      // Tab from last element should cycle to first
      lastButton.focus();
      fireEvent.keyDown(lastButton, { key: 'Tab' });
      
      expect(firstInput).toHaveFocus();
    });
  });

  describe('error handling', () => {
    it('should display error message when verification fails', async () => {
      const mockOnVerifiedError = jest.fn().mockRejectedValue(new Error('Verification failed'));
      
      render(<UserVerificationModal {...defaultProps} onVerified={mockOnVerifiedError} />);
      
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Smith' }
      });
      fireEvent.change(screen.getByLabelText('Street Address'), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText('City'), {
        target: { value: 'Anytown' }
      });
      fireEvent.change(screen.getByLabelText('State'), {
        target: { value: 'CA' }
      });
      fireEvent.change(screen.getByLabelText('ZIP Code'), {
        target: { value: '12345' }
      });
      
      const verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verification failed. Please check your information and try again.')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const mockOnVerifiedError = jest.fn()
        .mockRejectedValueOnce(new Error('Verification failed'))
        .mockResolvedValueOnce(undefined);
      
      render(<UserVerificationModal {...defaultProps} onVerified={mockOnVerifiedError} />);
      
      // Fill and submit form (first attempt - fails)
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Smith' } });
      fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Anytown' } });
      fireEvent.change(screen.getByLabelText('State'), { target: { value: 'CA' } });
      fireEvent.change(screen.getByLabelText('ZIP Code'), { target: { value: '12345' } });
      
      let verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Verification failed. Please check your information and try again.')).toBeInTheDocument();
      });
      
      // Retry
      verifyButton = screen.getByRole('button', { name: 'Verify Identity' });
      fireEvent.click(verifyButton);
      
      await waitFor(() => {
        expect(mockOnVerifiedError).toHaveBeenCalledTimes(2);
      });
    });
  });
});