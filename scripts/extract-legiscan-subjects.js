#!/usr/bin/env node

/**
 * Script to download current session bill data from Legiscan API
 * and extract all unique subject_name values
 */

const fs = require('fs');
const path = require('path');

// Import environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const LEGISCAN_API_KEY = process.env.LEGISCAN_API_KEY;
const LEGISCAN_BASE_URL = process.env.LEGISCAN_BASE_URL || 'https://api.legiscan.com';

if (!LEGISCAN_API_KEY) {
  console.error('LEGISCAN_API_KEY environment variable is required');
  process.exit(1);
}

async function makeRequest(operation, params = {}) {
  try {
    const url = new URL('/', LEGISCAN_BASE_URL);
    
    // Add API key and operation
    url.searchParams.set('key', LEGISCAN_API_KEY);
    url.searchParams.set('op', operation);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    console.log(`Making request to: ${operation} with params:`, params);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EGP-Legiscan-Extractor/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error making request to ${operation}:`, error.message);
    return null;
  }
}

async function getCurrentSessions() {
  console.log('Fetching current sessions...');
  const response = await makeRequest('getSessionList');
  
  if (!response || !response.sessions) {
    console.error('Failed to fetch sessions');
    return [];
  }
  
  // Filter to current/recent sessions (2024-2026)
  const currentSessions = response.sessions.filter(session => {
    return session.year_start >= 2024 && session.year_start <= 2026;
  });
  
  // Group sessions by state to get one per state
  const sessionsByState = {};
  currentSessions.forEach(session => {
    const stateAbbr = session.state_abbr || 'US';
    
    if (!sessionsByState[stateAbbr]) {
      sessionsByState[stateAbbr] = [];
    }
    sessionsByState[stateAbbr].push(session);
  });
  
  // Select best session from each state (prefer active, then most recent)
  const selectedSessions = [];
  Object.keys(sessionsByState).forEach(stateAbbr => {
    const stateSessions = sessionsByState[stateAbbr].sort((a, b) => {
      // Prioritize active sessions (sine_die = 0) and more recent years
      if (a.sine_die !== b.sine_die) {
        return a.sine_die - b.sine_die; // 0 comes before 1
      }
      return b.year_start - a.year_start; // More recent years first
    });
    
    selectedSessions.push(stateSessions[0]);
  });
  
  console.log(`Found sessions from ${selectedSessions.length} states/jurisdictions`);
  
  // Show session details
  selectedSessions.slice(0, 15).forEach(session => {
    console.log(`  ${session.state_abbr}: ${session.session_name} (${session.session_id}) - Active: ${session.sine_die === 0 ? 'Yes' : 'No'}`);
  });
  
  if (selectedSessions.length > 15) {
    console.log(`  ... and ${selectedSessions.length - 15} more states`);
  }
  
  return selectedSessions;
}

async function getSessionDataset(sessionId) {
  console.log(`Fetching dataset for session ${sessionId}...`);
  const response = await makeRequest('getDataset', { id: sessionId });
  
  if (!response) {
    console.error(`Failed to fetch dataset for session ${sessionId}`);
    return null;
  }
  
  return response;
}

async function getSessionMasterList(sessionId) {
  console.log(`Fetching master list for session ${sessionId}...`);
  const response = await makeRequest('getMasterList', { id: sessionId });
  
  if (!response || !response.masterlist) {
    console.error(`Failed to fetch master list for session ${sessionId}`);
    return [];
  }
  
  // Convert the masterlist object to an array
  const masterlist = response.masterlist;
  const bills = [];
  
  // Skip the 'session' key and get all numbered keys
  Object.keys(masterlist).forEach(key => {
    if (key !== 'session' && !isNaN(parseInt(key))) {
      bills.push(masterlist[key]);
    }
  });
  
  console.log(`Found ${bills.length} bills in master list`);
  return bills;
}

async function getBillDetails(billId) {
  const response = await makeRequest('getBill', { id: billId });
  
  if (!response || !response.bill) {
    console.error(`Failed to fetch bill ${billId}`);
    return null;
  }
  
  return response.bill;
}

function extractSubjectsFromBill(bill) {
  const subjects = new Set();
  
  // Look for subjects in various possible locations
  if (bill.subjects) {
    if (Array.isArray(bill.subjects)) {
      bill.subjects.forEach(subject => {
        if (typeof subject === 'string') {
          subjects.add(subject);
        } else if (subject.subject_name) {
          subjects.add(subject.subject_name);
        } else if (subject.name) {
          subjects.add(subject.name);
        }
      });
    }
  }
  
  if (bill.subject_name) {
    subjects.add(bill.subject_name);
  }
  
  if (bill.subject && bill.subject.name) {
    subjects.add(bill.subject.name);
  }
  
  return Array.from(subjects);
}

async function main() {
  console.log('Starting Legiscan subject extraction...');
  
  const allSubjects = new Set();
  const outputData = {
    timestamp: new Date().toISOString(),
    sessions_processed: 0,
    bills_processed: 0,
    subjects: [],
    raw_data: []
  };
  
  try {
    // Get current sessions
    const sessions = await getCurrentSessions();
    
    if (sessions.length === 0) {
      console.log('No current sessions found');
      return;
    }
    
    // Process all sessions (one per state)
    const sessionsToProcess = sessions;
    const targetBills = 250;
    const billsPerSession = Math.max(5, Math.ceil(targetBills / sessionsToProcess.length));
    
    console.log(`Processing ${sessionsToProcess.length} sessions...`);
    console.log(`Target: ${targetBills} bills (~${billsPerSession} per session)`);
    
    for (const session of sessionsToProcess) {
      console.log(`\n--- Processing ${session.state_abbr}: ${session.session_name} (${session.session_id}) ---`);
      
      // Try dataset first, fall back to master list
      let dataset = await getSessionDataset(session.session_id);
      
      if (dataset && dataset.dataset) {
        console.log('Using dataset response');
        outputData.raw_data.push({
          session_id: session.session_id,
          session_name: session.session_name,
          state: session.state_abbr,
          data_type: 'dataset',
          data: dataset.dataset
        });
        
        // Extract subjects from dataset
        if (dataset.dataset.bills) {
          dataset.dataset.bills.slice(0, billsPerSession).forEach(bill => {
            const subjects = extractSubjectsFromBill(bill);
            subjects.forEach(subject => allSubjects.add(subject));
            outputData.bills_processed++;
          });
        }
      } else {
        console.log('Dataset not available, trying master list...');
        const masterList = await getSessionMasterList(session.session_id);
        
        if (masterList.length > 0) {
          console.log(`Found ${masterList.length} bills in master list`);
          
          // Process more bills per session to reach target
          const billsToProcess = masterList.slice(0, billsPerSession);
          
          for (const billSummary of billsToProcess) {
            const billDetails = await getBillDetails(billSummary.bill_id);
            
            if (billDetails) {
              outputData.raw_data.push({
                session_id: session.session_id,
                session_name: session.session_name,
                state: session.state_abbr,
                data_type: 'bill',
                bill_id: billSummary.bill_id,
                data: billDetails
              });
              
              const subjects = extractSubjectsFromBill(billDetails);
              subjects.forEach(subject => allSubjects.add(subject));
              outputData.bills_processed++;
            }
            
            // Add delay to be respectful to API
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } else {
          console.log('No bills found in master list');
        }
      }
      
      outputData.sessions_processed++;
      
      console.log(`  Processed: ${outputData.bills_processed} total bills so far`);
      
      // Add delay between sessions
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Stop early if we hit our target
      if (outputData.bills_processed >= targetBills) {
        console.log(`\nReached target of ${targetBills} bills, stopping early.`);
        break;
      }
    }
    
    // Compile final results
    outputData.subjects = Array.from(allSubjects).sort();
    
    console.log(`\n--- Results ---`);
    console.log(`Sessions processed: ${outputData.sessions_processed}`);
    console.log(`Bills processed: ${outputData.bills_processed}`);
    console.log(`Unique subjects found: ${outputData.subjects.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '../data/legiscan-subjects.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
    
    // Also save just the subject list for easy review
    const subjectsOnlyPath = path.join(__dirname, '../data/legiscan-subjects-list.txt');
    fs.writeFileSync(subjectsOnlyPath, outputData.subjects.join('\n'));
    console.log(`Subject list saved to: ${subjectsOnlyPath}`);
    
    // Display subjects
    console.log('\n--- Unique Subject Names Found ---');
    outputData.subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject}`);
    });
    
  } catch (error) {
    console.error('Error during extraction:', error);
  }
}

// Run the script
main().catch(console.error);