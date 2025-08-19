#!/usr/bin/env node

const XLSX = require('xlsx');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

function parseExcelFile(filePath) {
  console.log(`Parsing ${filePath}...`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Get first sheet
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Found ${jsonData.length} records in ${path.basename(filePath)}`);
  
  return jsonData;
}

async function uploadToFirestore(collectionName, data) {
  console.log(`Uploading ${data.length} records to ${collectionName} collection...`);
  
  const batch = writeBatch(db);
  let batchCount = 0;
  const batchLimit = 500; // Firestore batch limit
  
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    let docId;
    
    if (collectionName === 'state_census') {
      // Use state name as document ID for state data
      docId = record.NAME?.toLowerCase().replace(/\s+/g, '_') || `state_${i}`;
    } else if (collectionName === 'district_census') {
      // Use GEOID for congressional districts
      docId = record.GEOID || `district_${i}`;
    } else {
      docId = `doc_${i}`;
    }
    
    const docRef = doc(collection(db, collectionName), docId);
    batch.set(docRef, record);
    batchCount++;
    
    // Commit batch when we reach the limit or it's the last item
    if (batchCount >= batchLimit || i === data.length - 1) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} records`);
      
      // Reset for next batch
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
    // Parse state-level data
    const stateData = parseExcelFile('/tmp/state_level_census_data.xlsx');
    console.log('Sample state record:', stateData[0]);
    
    // Parse congressional district data
    const districtData = parseExcelFile('/tmp/congressional_district_level_census_data.xlsx');
    console.log('Sample district record:', districtData[0]);
    
    // Upload to Firestore
    await uploadToFirestore('state_census', stateData);
    await uploadToFirestore('district_census', districtData);
    
    console.log('All data uploaded successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error importing census data:', error);
    process.exit(1);
  }
}

main();