import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

let stateDataCache: any[] | null = null;

function loadStateData() {
  if (stateDataCache) {
    return stateDataCache;
  }
  
  try {
    const dataPath = path.join(process.cwd(), 'data', 'state_census_data.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    stateDataCache = JSON.parse(fileContent);
    return stateDataCache;
  } catch (error) {
    console.error('Error loading state census data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    const parsedData = loadStateData();
    
    let filteredData = parsedData;
    if (state) {
      filteredData = parsedData.filter(row => 
        row.NAME && row.NAME.toLowerCase() === state.toLowerCase()
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      totalRecords: parsedData.length,
      filteredRecords: filteredData.length,
      source: 'Local census data parsed from https://github.com/annikamore11/census_data'
    });
  } catch (error) {
    console.error('Error fetching state-level census data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch state-level census data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}