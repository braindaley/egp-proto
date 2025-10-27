import { NextResponse } from 'next/server';
import { getPolicyAreasForSiteCategory } from '@/lib/policy-area-mapping';
import type { SiteIssueCategory } from '@/lib/policy-area-mapping';

interface CongressBill {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
  originChamber: string;
  originChamberCode: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  [key: string]: any;
}

interface SimpleBill {
  type: string;
  number: string;
  title: string;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const congress = searchParams.get('congress') || '119';
  const limit = parseInt(searchParams.get('limit') || '4');

  console.log(`🚀 House-passed bills API called for category: ${category}`);

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Get the Congressional policy areas that map to this site category
    const policyAreas = getPolicyAreasForSiteCategory(category as SiteIssueCategory);
    console.log(`📋 Policy areas for "${category}":`, policyAreas);

    if (policyAreas.length === 0) {
      return NextResponse.json({
        bills: [],
        debug: { category, policyAreas: [], message: 'No policy areas found for category' }
      });
    }

    let allCandidates: CongressBill[] = [];

    // Search for bills in each policy area
    for (const policyArea of policyAreas) {
      try {
        // First, get bills by policy area
        const policyUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=50&sort=updateDate+desc&policyArea=${encodeURIComponent(policyArea)}`;

        console.log(`🔍 Fetching bills for policy area: "${policyArea}"`);

        const response = await fetch(policyUrl, {
          headers: { 'User-Agent': 'BillTracker/1.0' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.bills && data.bills.length > 0) {
            console.log(`📋 Found ${data.bills.length} bills for "${policyArea}"`);
            allCandidates = allCandidates.concat(data.bills);
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching bills for "${policyArea}":`, error);
      }
    }

    console.log(`📊 Total candidate bills: ${allCandidates.length}`);

    // Filter bills that have passed the House
    const housePassed: SimpleBill[] = [];

    for (const bill of allCandidates) {
      // Only check enough bills to get our limit
      if (housePassed.length >= limit) {
        break;
      }

      try {
        // Fetch detailed bill info including actions
        const billUrl = `https://api.congress.gov/v3/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}?api_key=${API_KEY}&format=json`;

        const billResponse = await fetch(billUrl, {
          headers: { 'User-Agent': 'BillTracker/1.0' },
        });

        if (billResponse.ok) {
          const billData = await billResponse.json();
          const billDetails = billData.bill;

          // Check if bill has passed the House by looking at latest action
          const latestAction = billDetails.latestAction?.text?.toLowerCase() || '';

          // Common phrases indicating House passage
          const housePassedIndicators = [
            'passed house',
            'passed/agreed to in house',
            'received in the senate',
            'message on senate action sent to the house',
          ];

          const hasPassedHouse = housePassedIndicators.some(indicator =>
            latestAction.includes(indicator)
          );

          if (hasPassedHouse) {
            console.log(`✅ House passed: ${bill.type} ${bill.number} - ${billDetails.latestAction?.text}`);

            const billTypeSlug = bill.type.toLowerCase().replace(/\./g, '');

            housePassed.push({
              type: bill.type,
              number: bill.number,
              title: bill.title || `${bill.type} ${bill.number}`,
              url: `/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`
            });
          } else {
            console.log(`❌ Not passed House: ${bill.type} ${bill.number} - ${billDetails.latestAction?.text}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error checking ${bill.type} ${bill.number}:`, error);
      }
    }

    console.log(`🎯 Final: ${housePassed.length} bills that passed the House`);

    const response = NextResponse.json({
      bills: housePassed,
      debug: {
        category,
        policyAreas,
        candidatesChecked: allCandidates.length,
        housePassedCount: housePassed.length
      }
    });

    // Cache for 1 hour since House passage data doesn't change frequently
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return response;

  } catch (error) {
    console.error('House-passed bills error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: errorMessage,
      bills: [],
      debug: { error: errorMessage }
    }, { status: 500 });
  }
}
