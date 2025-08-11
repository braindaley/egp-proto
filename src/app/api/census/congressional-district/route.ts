import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      'https://api.github.com/repos/annikamore11/census_data/contents/data/attribute/congressional_district_level_census_data.csv',
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
    
    return NextResponse.json({
      success: true,
      data: csvData,
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