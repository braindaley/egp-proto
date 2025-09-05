#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  "projectId": "egut-with-api",
  "appId": "1:891405266254:web:c03357060ea337cb1e421f",
  "storageBucket": "egut-with-api.firebasestorage.app",
  "apiKey": "AIzaSyDpn3QKPct12ZUwFwbLEQolbd4aGD-eyto",
  "authDomain": "egut-with-api.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "891405266254",
  "databaseURL": "https://egut-with-api.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading CSV from ${url}...`);
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log('CSV download completed');
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    // Handle CSV with proper quote parsing
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add the last value
    
    const record = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Convert numeric fields
      if (['congress', 'icpsr', 'state_icpsr', 'district_code', 'party_code', 'born', 'died', 
           'nominate_dim1', 'nominate_dim2', 'nominate_log_likelihood', 'nominate_geo_mean_probability',
           'nominate_number_of_votes', 'nominate_number_of_errors', 'nokken_poole_dim1', 'nokken_poole_dim2'].includes(header.toLowerCase())) {
        const numValue = parseFloat(value);
        record[header.toLowerCase()] = isNaN(numValue) || value === '' ? null : numValue;
      } else {
        record[header.toLowerCase()] = value;
      }
    });
    
    records.push(record);
  }
  
  console.log(`Parsed ${records.length} ideology records`);
  return records;
}

async function uploadToFirestore(collectionName, data) {
  console.log(`Uploading ${data.length} records to ${collectionName} collection...`);
  
  const batch = writeBatch(db);
  let batchCount = 0;
  const batchLimit = 500; // Firestore batch limit
  
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    
    // Use bioguide_id as document ID for easy lookup
    const docId = record.bioguide_id || `member_${i}`;
    
    const docRef = doc(collection(db, collectionName), docId);
    batch.set(docRef, record);
    batchCount++;
    
    // Commit batch when we reach the limit or it's the last item
    if (batchCount >= batchLimit || i === data.length - 1) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} records`);
      
      // Reset for next batch if there are more records
      if (i < data.length - 1) {
        const newBatch = writeBatch(db);
        Object.setPrototypeOf(batch, newBatch);
        batchCount = 0;
      }
    }
  }
  
  console.log(`Successfully uploaded ${data.length} records to ${collectionName}`);
}

async function main() {
  try {
    const csvUrl = 'https://raw.githubusercontent.com/annikamore11/ideology_scores/main/congress_ideology.csv';
    
    // Download and parse CSV data
    const csvData = await downloadCSV(csvUrl);
    const ideologyData = parseCSV(csvData);
    
    console.log('Sample ideology record:', ideologyData[0]);
    
    // Upload to Firestore
    await uploadToFirestore('ideology_scores', ideologyData);
    
    console.log('Ideology data uploaded successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error importing ideology data:', error);
    process.exit(1);
  }
}

main();