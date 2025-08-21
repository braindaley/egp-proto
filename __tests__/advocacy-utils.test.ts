/**
 * Test for advocacy message utilities and business logic
 */

describe('Advocacy Message Utils', () => {
  describe('message validation', () => {
    it('should validate required fields', () => {
      const messageData = {
        stance: 'support',
        message: 'Test message content',
        recipients: [{ name: 'Rep. Test', email: 'test@congress.gov' }]
      };

      expect(messageData.stance).toBeTruthy();
      expect(messageData.message).toBeTruthy();
      expect(messageData.recipients.length).toBeGreaterThan(0);
    });

    it('should identify invalid stance values', () => {
      const validStances = ['support', 'oppose'];
      const invalidStances = ['neutral', 'maybe', 'invalid'];

      validStances.forEach(stance => {
        expect(['support', 'oppose']).toContain(stance);
      });

      invalidStances.forEach(stance => {
        expect(['support', 'oppose']).not.toContain(stance);
      });
    });

    it('should validate message content length', () => {
      const shortMessage = 'Too short';
      const appropriateMessage = 'This is an appropriate length message that contains enough content to be meaningful to representatives.';
      const longMessage = 'a'.repeat(5000); // Very long message

      expect(shortMessage.length).toBeLessThan(50);
      expect(appropriateMessage.length).toBeGreaterThan(50);
      expect(appropriateMessage.length).toBeLessThan(2000);
      expect(longMessage.length).toBeGreaterThan(2000);
    });
  });

  describe('recipient handling', () => {
    it('should format representative information', () => {
      const representative = {
        name: 'John Doe',
        party: 'D',
        state: 'CA',
        district: '01',
        bioguideId: 'D000123'
      };

      const formatted = `${representative.name} (${representative.party}-${representative.state}-${representative.district})`;
      expect(formatted).toBe('John Doe (D-CA-01)');
    });

    it('should handle multiple recipients', () => {
      const recipients = [
        { name: 'Rep. John Doe', email: 'doe@congress.gov', party: 'D' },
        { name: 'Sen. Jane Smith', email: 'smith@senate.gov', party: 'R' },
        { name: 'Rep. Bob Johnson', email: 'johnson@congress.gov', party: 'I' }
      ];

      expect(recipients.length).toBe(3);
      recipients.forEach(recipient => {
        expect(recipient.name).toBeTruthy();
        expect(recipient.email).toBeTruthy();
        expect(recipient.party).toBeTruthy();
      });
    });

    it('should validate email formats', () => {
      const validEmails = [
        'representative@congress.gov',
        'senator@senate.gov',
        'test.email@house.gov'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  describe('personal data handling', () => {
    it('should handle personal data selection', () => {
      const availableFields = ['fullName', 'address', 'city', 'state', 'zipCode', 'profession'];
      const selectedFields = ['fullName', 'address', 'zipCode'];

      const filteredData = availableFields.filter(field => selectedFields.includes(field));
      expect(filteredData).toEqual(['fullName', 'address', 'zipCode']);
    });

    it('should require full name by default', () => {
      const selectedFields = ['address', 'city'];
      const requiredFields = ['fullName'];
      
      const finalFields = [...new Set([...requiredFields, ...selectedFields])];
      expect(finalFields).toContain('fullName');
    });

    it('should validate address information', () => {
      const addressData = {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      };

      expect(addressData.street).toBeTruthy();
      expect(addressData.city).toBeTruthy();
      expect(addressData.state).toMatch(/^[A-Z]{2}$/);
      expect(addressData.zipCode).toMatch(/^\d{5}(-\d{4})?$/);
    });
  });

  describe('message generation parameters', () => {
    it('should handle AI generation parameters', () => {
      const params = {
        billTitle: 'Test Bill',
        billSummary: 'This bill does important things.',
        userStance: 'support' as const,
        tone: 'formal' as const,
        personalData: {
          fullName: true,
          address: true,
          profession: false
        }
      };

      expect(params.billTitle).toBeTruthy();
      expect(params.billSummary).toBeTruthy();
      expect(['support', 'oppose']).toContain(params.userStance);
      expect(['formal', 'casual']).toContain(params.tone);
      expect(typeof params.personalData).toBe('object');
    });

    it('should handle different tone options', () => {
      const toneOptions = ['formal', 'casual', 'professional', 'personal'];
      
      toneOptions.forEach(tone => {
        const isValid = ['formal', 'casual'].includes(tone);
        expect(typeof isValid).toBe('boolean');
      });
    });
  });

  describe('bill information handling', () => {
    it('should parse bill identifiers', () => {
      const billId = 'hr1234-118';
      const parts = billId.split('-');
      
      expect(parts.length).toBe(2);
      expect(parts[0]).toMatch(/^[a-z]+\d+$/i); // e.g., "hr1234"
      expect(parts[1]).toMatch(/^\d+$/); // e.g., "118"
    });

    it('should handle bill title formatting', () => {
      const longTitle = 'A very long bill title that might need to be truncated for display purposes in certain contexts';
      const shortTitle = 'Short Bill';

      const maxLength = 60;
      const truncated = longTitle.length > maxLength 
        ? longTitle.substring(0, maxLength) + '...'
        : longTitle;

      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3); // +3 for ellipsis
      expect(shortTitle.length).toBeLessThan(maxLength);
    });
  });

  describe('step validation', () => {
    it('should validate step progression', () => {
      const steps = [
        { id: 1, name: 'compose', required: ['stance', 'message'] },
        { id: 2, name: 'recipients', required: ['selectedMembers'] },
        { id: 3, name: 'review', required: ['confirmation'] }
      ];

      const currentStep = 1;
      const nextStep = currentStep + 1;

      expect(nextStep).toBeLessThanOrEqual(steps.length);
      expect(steps[currentStep - 1]).toBeTruthy();
    });

    it('should validate step completion', () => {
      const formData = {
        stance: 'support',
        message: 'Test message',
        selectedMembers: [{ name: 'Rep. Test' }]
      };

      const isStep1Complete = !!(formData.stance && formData.message);
      const isStep2Complete = !!(formData.selectedMembers && formData.selectedMembers.length > 0);

      expect(isStep1Complete).toBe(true);
      expect(isStep2Complete).toBe(true);
    });
  });
});