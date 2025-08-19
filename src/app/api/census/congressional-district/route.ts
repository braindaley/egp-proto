import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface DistrictCensusData {
  GEOID: string;
  NAME: string;
  state_name: string;
  total_pop: number;
  pct_female: number;
  pct_male: number;
  pct_white: number;
  pct_black: number;
  pct_am_indian: number;
  pct_asian: number;
  pct_pacificI: number;
  pct_other: number;
  pct_two_or_more: number;
  pct_divorced: number;
  pct_hs_or_higher: number;
  pct_ba_or_higher: number;
  pct_doctorate: number;
  pct_uninsured: number;
  med_household_income: number;
}

let districtDataCache: DistrictCensusData[] | null = null;

function loadDistrictData(): DistrictCensusData[] {
  if (districtDataCache) {
    return districtDataCache;
  }
  
  try {
    const dataPath = path.join(process.cwd(), 'data', 'district_census_data.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    districtDataCache = JSON.parse(fileContent);
    return districtDataCache || [];
  } catch (error) {
    console.error('Error loading district census data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    
    const parsedData = loadDistrictData();
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
        'hawaii': '15',
        'idaho': '16',
        'illinois': '17',
        'indiana': '18',
        'iowa': '19',
        'kansas': '20',
        'kentucky': '21',
        'louisiana': '22',
        'maine': '23',
        'maryland': '24',
        'massachusetts': '25',
        'michigan': '26',
        'minnesota': '27',
        'mississippi': '28',
        'missouri': '29',
        'montana': '30',
        'nebraska': '31',
        'nevada': '32',
        'new hampshire': '33',
        'new jersey': '34',
        'new mexico': '35',
        'new york': '36',
        'north carolina': '37',
        'north dakota': '38',
        'ohio': '39',
        'oklahoma': '40',
        'oregon': '41',
        'pennsylvania': '42',
        'rhode island': '44',
        'south carolina': '45',
        'south dakota': '46',
        'tennessee': '47',
        'texas': '48',
        'utah': '49',
        'vermont': '50',
        'virginia': '51',
        'washington': '53',
        'west virginia': '54',
        'wisconsin': '55',
        'wyoming': '56'
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
      source: 'Local census data parsed from https://github.com/annikamore11/census_data'
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