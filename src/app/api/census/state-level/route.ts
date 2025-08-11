import { NextRequest, NextResponse } from 'next/server';

function parseCsvData(csvString: string) {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    const response = await fetch(
      'https://api.github.com/repos/annikamore11/census_data/contents/data/attribute/state_level_census_data.csv',
      {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const csvData = await response.text();
    const parsedData = parseCsvData(csvData);
    
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
      source: 'https://github.com/annikamore11/census_data'
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