import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress') || '119';
  const stateParam = searchParams.get('state') || 'AR';
  const API_KEY = process.env.CONGRESS_API_KEY;

  const stateAbbr = stateParam?.trim().toUpperCase();
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    parameters: { congress, stateParam, stateAbbr },
    environment: {
      hasApiKey: !!API_KEY,
      apiKeyLength: API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    },
    tests: []
  };

  if (!API_KEY) {
    debugInfo.error = 'No API key found';
    return NextResponse.json(debugInfo);
  }

  try {
    // Test 1: Simple Senate call for current congress
    const senateUrl = `https://api.congress.gov/v3/member/Senate/${stateAbbr}/${congress}?api_key=${API_KEY}&limit=2`;
    debugInfo.tests.push({ name: 'Senate URL', url: senateUrl });
    
    const senateRes = await fetch(senateUrl);
    const senateData = await senateRes.json();
    
    debugInfo.tests.push({
      name: 'Senate Response',
      status: senateRes.status,
      ok: senateRes.ok,
      dataKeys: Object.keys(senateData),
      members: senateData.members?.length || 0,
      error: senateData.error || null,
      fullResponse: senateData
    });

    // Test 2: Try previous congress (118th) 
    const senate118Url = `https://api.congress.gov/v3/member/Senate/${stateAbbr}/118?api_key=${API_KEY}&limit=2`;
    debugInfo.tests.push({ name: 'Senate 118th URL', url: senate118Url });
    
    const senate118Res = await fetch(senate118Url);
    const senate118Data = await senate118Res.json();
    
    debugInfo.tests.push({
      name: 'Senate 118th Response',
      status: senate118Res.status,
      ok: senate118Res.ok,
      members: senate118Data.members?.length || 0,
      error: senate118Data.error || null
    });

    // Test 3: Small House call for current congress
    const houseUrl = `https://api.congress.gov/v3/member/House/${congress}?api_key=${API_KEY}&limit=10`;
    debugInfo.tests.push({ name: 'House URL', url: houseUrl });
    
    const houseRes = await fetch(houseUrl);
    const houseData = await houseRes.json();
    
    debugInfo.tests.push({
      name: 'House Response',
      status: houseRes.status,
      ok: houseRes.ok,
      dataKeys: Object.keys(houseData),
      members: houseData.members?.length || 0,
      error: houseData.error || null,
      sampleMember: houseData.members?.[0] || null
    });

    // Test 4: House for 118th congress
    const house118Url = `https://api.congress.gov/v3/member/House/118?api_key=${API_KEY}&limit=10`;
    debugInfo.tests.push({ name: 'House 118th URL', url: house118Url });
    
    const house118Res = await fetch(house118Url);
    const house118Data = await house118Res.json();
    
    debugInfo.tests.push({
      name: 'House 118th Response',
      status: house118Res.status,
      ok: house118Res.ok,
      members: house118Data.members?.length || 0,
      error: house118Data.error || null,
      sampleMember: house118Data.members?.[0] || null
    });

    // Test 5: Filter sample if we have data
    if (house118Data.members?.length > 0) {
      const stateMembers = house118Data.members.filter(member => {
        const memberState = member.state?.trim().toUpperCase();
        return memberState === stateAbbr;
      });
      
      debugInfo.tests.push({
        name: 'State Filtering Test (118th House)',
        targetState: stateAbbr,
        totalMembers: house118Data.members.length,
        stateMatches: stateMembers.length,
        allStates: [...new Set(house118Data.members.map(m => m.state))].sort(),
        sampleMemberStates: house118Data.members.slice(0, 10).map(m => ({ name: m.name, state: m.state }))
      });
    }

  } catch (error) {
    debugInfo.error = error.message;
    debugInfo.stack = error.stack;
  }

  return NextResponse.json(debugInfo);
}
