#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const LEGISCAN_API_KEY = process.env.LEGISCAN_API_KEY;
const LEGISCAN_BASE_URL = process.env.LEGISCAN_BASE_URL || 'https://api.legiscan.com';

async function testMasterList() {
  try {
    console.log('Testing master list API...');
    
    // Test with Alabama 2026 Regular Session (session_id: 2218) - should be active
    const sessionId = 2218;
    
    const url = new URL('/', LEGISCAN_BASE_URL);
    url.searchParams.set('key', LEGISCAN_API_KEY);
    url.searchParams.set('op', 'getMasterList');
    url.searchParams.set('id', sessionId);
    
    console.log('Making request to:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EGP-Test/1.0',
      },
    });
    
    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response text (first 1000 chars):', text.substring(0, 1000));
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON structure:', Object.keys(data));
      if (data.masterlist) {
        console.log('Number of bills:', data.masterlist.length);
        if (data.masterlist.length > 0) {
          console.log('First bill:', data.masterlist[0]);
        }
      }
    } catch (jsonError) {
      console.log('Failed to parse as JSON:', jsonError.message);
    }
    
  } catch (error) {
    console.error('Master list test failed:', error);
  }
}

testMasterList();