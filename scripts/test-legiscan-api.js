#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const LEGISCAN_API_KEY = process.env.LEGISCAN_API_KEY;
const LEGISCAN_BASE_URL = process.env.LEGISCAN_BASE_URL || 'https://api.legiscan.com';

async function testApi() {
  try {
    console.log('Testing Legiscan API...');
    console.log('API Key:', LEGISCAN_API_KEY ? 'Present' : 'Missing');
    console.log('Base URL:', LEGISCAN_BASE_URL);
    
    const url = new URL('/', LEGISCAN_BASE_URL);
    url.searchParams.set('key', LEGISCAN_API_KEY);
    url.searchParams.set('op', 'getSessionList');
    
    console.log('Making request to:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EGP-Test/1.0',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response text (first 1000 chars):', text.substring(0, 1000));
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON structure:', Object.keys(data));
      if (data.sessions) {
        console.log('Number of sessions:', data.sessions.length);
        console.log('First session:', data.sessions[0]);
      }
    } catch (jsonError) {
      console.log('Failed to parse as JSON:', jsonError.message);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testApi();