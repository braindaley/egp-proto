import { NextRequest, NextResponse } from 'next/server';

interface DistrictCensusData {
  GEOID: string;
  NAME: string;
  state_name: string;
  total_pop: string;
  pct_female: string;
  pct_male: string;
  pct_white: string;
  pct_black: string;
  pct_am_indian: string;
  pct_asian: string;
  pct_pacificI: string;
  pct_other: string;
  pct_two_or_more: string;
  pct_divorced: string;
  pct_hs_or_higher: string;
  pct_ba_or_higher: string;
  pct_doctorate: string;
  pct_uninsured: string;
  med_household_income: string;
}

function parseCSV(csvText: string): DistrictCensusData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  const data: DistrictCensusData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row as DistrictCensusData);
    }
  }
  
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    
    const response = await fetch(
      'https://api.github.com/repos/annikamore11/census_data/contents/data/attribute/congressional_district_level_census_data.csv',
      {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const csvData = await response.text();
    const parsedData = parseCSV(csvData);
    
    let filteredData = parsedData;
    
    // Filter by state if provided
    if (state) {
      filteredData = filteredData.filter(row => 
        row.state_name.toLowerCase() === state.toLowerCase()
      );
    }
    
    // Filter by district if provided (construct GEOID: state FIPS code + district number)
    if (district && state) {
      // Create state FIPS mapping for common states
      const stateFipsMap: { [key: string]: string } = {
        'alabama': '01',
        'alaska': '02',
        'arizona': '04',
        'arkansas': '05',
        'california': '06',
        'colorado': '08',
        'connecticut': '09',
        'delaware': '10',
        'florida': '12',
        'georgia': '13',
        // Add more states as needed
      };
      
      const stateFips = stateFipsMap[state.toLowerCase()];
      if (stateFips) {
        const districtNumber = district.padStart(2, '0');
        const geoid = stateFips + districtNumber;
        
        filteredData = filteredData.filter(row => row.GEOID === geoid);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length,
      source: 'https://github.com/annikamore11/census_data'
    });
  } catch (error) {
    console.error('Error fetching congressional district census data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch congressional district census data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}