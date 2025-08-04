import { NextResponse, type NextRequest } from 'next/server';

interface ReportReference {
    citation: string;
    updateDate: string;
    url: string;
}

interface ReportDetailResponse {
    report: {
        citation: string;
        title: string;
        reportType: string;
        updateDate: string;
        url: string;
    }
}

// Fetches the full details for a single report using its API URL
async function fetchReportDetail(reportUrl: string, apiKey: string): Promise<any> {
    try {
        const res = await fetch(`${reportUrl}&api_key=${apiKey}`);
        if (!res.ok) return null;
        const data: ReportDetailResponse = await res.json();
        
        // Find the web URL for viewing the report
        const webUrl = data.report.url?.replace('api.data.gov/congress/v3', 'www.congress.gov').replace('?format=json', '');

        return {
            citation: data.report.citation,
            title: data.report.title,
            type: data.report.reportType,
            url: webUrl,
            date: data.report.updateDate,
        };
    } catch {
        return null;
    }
}


export async function GET(req: NextRequest, { params }: { params: { committeeId: string } }) {
  const { committeeId } = params;
  const { searchParams } = new URL(req.url);
  const chamber = searchParams.get('chamber');
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!committeeId || !chamber || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const listUrl = `https://api.congress.gov/v3/committee/${chamber}/${committeeId}/reports?limit=5&api_key=${API_KEY}`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });
    
    if (!listRes.ok) {
        return NextResponse.json({ reports: [] });
    }
    
    const listData = await listRes.json();
    const reportReferences: ReportReference[] = listData.reports || [];

    if (reportReferences.length === 0) {
        return NextResponse.json({ reports: [] });
    }

    const reportDetailPromises = reportReferences
      .map(ref => fetchReportDetail(ref.url, API_KEY));
      
    const reports = (await Promise.all(reportDetailPromises)).filter(Boolean);

    return NextResponse.json({ reports });

  } catch (error) {
    console.error(`Error fetching committee reports:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
