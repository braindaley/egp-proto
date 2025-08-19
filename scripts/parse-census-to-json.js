#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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

function main() {
  try {
    // Create data directory
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // Parse state-level data
    const stateData = parseExcelFile('/tmp/state_level_census_data.xlsx');
    console.log('Sample state record:', stateData[0]);
    
    // Parse congressional district data
    const districtData = parseExcelFile('/tmp/congressional_district_level_census_data.xlsx');
    console.log('Sample district record:', districtData[0]);
    
    // Save as JSON files
    const stateOutputPath = path.join(dataDir, 'state_census_data.json');
    const districtOutputPath = path.join(dataDir, 'district_census_data.json');
    
    fs.writeFileSync(stateOutputPath, JSON.stringify(stateData, null, 2));
    fs.writeFileSync(districtOutputPath, JSON.stringify(districtData, null, 2));
    
    console.log(`State data saved to: ${stateOutputPath}`);
    console.log(`District data saved to: ${districtOutputPath}`);
    console.log('All data converted successfully!');
    
  } catch (error) {
    console.error('Error parsing census data:', error);
    process.exit(1);
  }
}

main();