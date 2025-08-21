import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/generate-advocacy-message/route';

// Mock the AI service
jest.mock('@/ai/dev', () => ({
  generateAdvocacyMessage: jest.fn(),
}));

const { generateAdvocacyMessage } = require('@/ai/dev');

describe('/api/ai/generate-advocacy-message', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST request handling', () => {
    it('should generate advocacy message successfully', async () => {
      const mockGeneratedMessage = 'Dear Representative,\n\nI am writing to express my support for this important legislation...';
      
      generateAdvocacyMessage.mockResolvedValue({
        output: () => mockGeneratedMessage
      });

      const requestBody = {
        billTitle: 'Test Bill',
        billSummary: 'This bill addresses important issues.',
        userStance: 'Support',
        tone: 'Formal',
        personalData: {
          fullName: true,
          address: true
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(mockGeneratedMessage);
      expect(generateAdvocacyMessage).toHaveBeenCalledWith(expect.objectContaining({
        billTitle: 'Test Bill',
        billSummary: 'This bill addresses important issues.',
        userStance: 'Support',
        tone: 'Formal',
        personalData: {
          fullName: true,
          address: true
        }
      }));
    });

    it('should handle missing required fields', async () => {
      const requestBody = {
        billTitle: 'Test Bill',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    it('should handle AI generation errors', async () => {
      generateAdvocacyMessage.mockRejectedValue(new Error('AI service unavailable'));

      const requestBody = {
        billTitle: 'Test Bill',
        billSummary: 'This bill addresses important issues.',
        userStance: 'Support',
        tone: 'Formal',
        personalData: {
          fullName: true,
          address: false
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });

    it('should validate userStance values', async () => {
      const requestBody = {
        billTitle: 'Test Bill',
        billSummary: 'This bill addresses important issues.',
        userStance: 'Invalid', // Invalid stance
        tone: 'Formal',
        personalData: {
          fullName: true,
          address: true
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    it('should handle different tone options', async () => {
      const mockGeneratedMessage = 'Dear Representative,\n\nI would like to share my thoughts...';
      
      generateAdvocacyMessage.mockResolvedValue({
        output: () => mockGeneratedMessage
      });

      const requestBody = {
        billTitle: 'Test Bill',
        billSummary: 'This bill addresses important issues.',
        userStance: 'Oppose',
        tone: 'Casual',
        personalData: {
          fullName: false,
          address: false
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(mockGeneratedMessage);
      expect(generateAdvocacyMessage).toHaveBeenCalledWith(expect.objectContaining({
        tone: 'Casual',
        userStance: 'Oppose'
      }));
    });

    it('should handle personal data preferences correctly', async () => {
      const mockGeneratedMessage = 'Test generated message';
      
      generateAdvocacyMessage.mockResolvedValue({
        output: () => mockGeneratedMessage
      });

      const requestBody = {
        billTitle: 'Test Bill',
        billSummary: 'This bill addresses important issues.',
        userStance: 'Support',
        tone: 'Formal',
        personalData: {
          fullName: true,
          address: false,
          birthYear: false,
          profession: true
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai/generate-advocacy-message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generateAdvocacyMessage).toHaveBeenCalledWith(expect.objectContaining({
        personalData: {
          fullName: true,
          address: false,
          birthYear: false,
          profession: true
        }
      }));
    });
  });
});