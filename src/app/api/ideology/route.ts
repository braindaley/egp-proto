import { NextRequest, NextResponse } from 'next/server';

interface IdeologyData {
  bioguide_id: string;
  bioname: string;
  nominate_dim1: number;
  nominate_dim2: number;
  chamber: string;
  party_code: number;
  state_abbrev: string;
  congress: number;
}

async function fetchCSVData(): Promise<IdeologyData[]> {
  const csvUrl = 'https://raw.githubusercontent.com/annikamore11/ideology_scores/main/congress_ideology.csv';
  
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch CSV data');
  }
  
  const csvText = await response.text();
  return parseCSV(csvText);
}

function parseCSV(csvData: string): IdeologyData[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  const records: IdeologyData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
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
    
    const record: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      const normalizedHeader = header.toLowerCase();
      
      // Convert numeric fields
      if (['congress', 'icpsr', 'state_icpsr', 'district_code', 'party_code', 'born', 'died', 
           'nominate_dim1', 'nominate_dim2', 'nominate_log_likelihood', 'nominate_geo_mean_probability',
           'nominate_number_of_votes', 'nominate_number_of_errors', 'nokken_poole_dim1', 'nokken_poole_dim2'].includes(normalizedHeader)) {
        const numValue = parseFloat(value);
        record[normalizedHeader] = isNaN(numValue) || value === '' ? null : numValue;
      } else {
        record[normalizedHeader] = value;
      }
    });
    
    records.push(record);
  }
  
  return records;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bioguideId = searchParams.get('bioguideId');
    
    // Fetch data from CSV
    const allData = await fetchCSVData();
    
    if (bioguideId) {
      // Find specific member's ideology score
      const memberData = allData.find(member => member.bioguide_id === bioguideId);
      
      if (!memberData) {
        return NextResponse.json(
          { success: false, error: 'Ideology data not found for this member' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: memberData
      });
    } else {
      // Return all ideology scores for histogram
      return NextResponse.json({
        success: true,
        data: allData
      });
    }
  } catch (error) {
    console.error('Error fetching ideology data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ideology data' },
      { status: 500 }
    );
  }
}