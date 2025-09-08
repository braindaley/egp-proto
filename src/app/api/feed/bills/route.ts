
import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, CongressApiResponse, FeedBill, Sponsor, Summary, Cosponsor, ApiCollection } from '@/types';
import { getFirestore, collection, getDocs, writeBatch, Timestamp, query, orderBy, limit, doc, where, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { convert } from 'html-to-text';
import { mapApiSubjectToAllowed } from '@/lib/subjects';

// This function determines a simplified status of the bill
function getBillStatus(latestActionText: string): string {
    const lowerCaseAction = latestActionText.toLowerCase();

    if (lowerCaseAction.includes('became public law') || 
        lowerCaseAction.includes('signed into law') ||
        lowerCaseAction.includes('public law no') ||
        lowerCaseAction.includes('signed by president')) {
        return 'Became Law';
    }
    if (lowerCaseAction.includes('presented to president') ||
        lowerCaseAction.includes('to president')) {
        return 'To President';
    }
    if (lowerCaseAction.includes('passed house') || 
        lowerCaseAction.includes('passed/agreed to in house') ||
        lowerCaseAction.includes('house agreed')) {
        return 'Passed House';
    }
    if (lowerCaseAction.includes('passed senate') || 
        lowerCaseAction.includes('passed/agreed to in senate') ||
        lowerCaseAction.includes('senate agreed') ||
        lowerCaseAction.includes('passed without objection')) {
        return 'Passed Senate';
    }
    // Check for bills that have been reported out of committee (more advanced)
    if (lowerCaseAction.includes('reported to house') ||
        lowerCaseAction.includes('reported to senate') ||
        lowerCaseAction.includes('placed on calendar') ||
        lowerCaseAction.includes('ordered to be reported') ||
        lowerCaseAction.includes('reported favorably')) {
        return 'Reported from Committee';
    }
    if (lowerCaseAction.includes('referred to') && lowerCaseAction.includes('committee')) {
        return 'In Committee';
    }
    if (lowerCaseAction.includes('committee')) {
        return 'In Committee';
    }
    return 'Introduced';
}

function calculateImportanceScore(bill: Bill, latestActionText: string): number {
  let score = 0;
  const actionText = (latestActionText || '').toLowerCase();
  
  // HIGH PRIORITY: Advanced legislative stages
  if (actionText.includes('became public law') || 
      actionText.includes('signed into law') ||
      actionText.includes('public law no') ||
      actionText.includes('signed by president')) score += 50;
  if (actionText.includes('presented to president')) score += 40;
  if (actionText.includes('passed house') && actionText.includes('passed senate')) score += 35;
  if (actionText.includes('passed house') || actionText.includes('passed senate')) score += 25;
  if (actionText.includes('floor vote') || actionText.includes('scheduled for vote')) score += 30;
  if (actionText.includes('reported by committee') || actionText.includes('committee reported')) score += 15;
  
  // MEDIUM PRIORITY: Committee activity vs just introduced  
  if (actionText.includes('committee') && !actionText.includes('referred to')) score += 8;
  if (actionText.includes('referred to the committee')) score += 2;
  
  // TOPIC PRIORITY: High-impact subjects
  const title = (bill.title || '').toLowerCase();
  const highPriorityTerms = ['budget', 'appropriation', 'defense', 'security', 'healthcare', 'infrastructure', 'economy', 'tax', 'climate', 'energy', 'education'];
  if (highPriorityTerms.some(term => title.includes(term))) score += 10;
  if (title.includes('bipartisan')) score += 15;
  
  // SUPPORT: Use cosponsors if available from detailed API call
  const cosponsorCount = bill.cosponsors?.count || 0;
  if (cosponsorCount > 50) score += 12;
  else if (cosponsorCount > 20) score += 8;
  else if (cosponsorCount > 10) score += 5;
  
  // AGE BONUS: Recent activity gets slight boost
  if (bill.latestAction?.actionDate) {
    const actionDate = new Date(bill.latestAction.actionDate);
    const daysSinceAction = (Date.now() - actionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAction <= 7) score += 3;
  }
  
  return Math.max(0, score);
}

// Function to generate AI explainer for a bill with caching
async function generateBillExplainer(bill: FeedBill, db: ReturnType<typeof getFirestore>): Promise<any> {
  const explainerCollection = collection(db, 'bill_explainers');
  const billId = `${bill.congress}-${bill.type}-${bill.number}`;
  const explainerDoc = doc(explainerCollection, billId);
  
  try {
    // Check if explainer already exists
    const existingDoc = await getDoc(explainerDoc);
    if (existingDoc.exists()) {
      const data = existingDoc.data();
      // Check if cache is less than 7 days old
      const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (data.cachedAt && data.cachedAt > sevenDaysAgo) {
        return data.explainerData;
      }
    }
    
    // Generate new explainer using Google AI
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.warn('Google AI API key not configured, using fallback explainer');
      return generateFallbackExplainer(bill);
    }
    
    const prompt = `You are creating an informative card for: ${bill.billNumber} - ${bill.shortTitle}

BILL INFORMATION:
- Title: ${bill.shortTitle}
- Number: ${bill.billNumber}  
- Summary: ${bill.summary || 'No detailed summary available'}
- Subject Areas: ${bill.subjects?.join(', ') || 'General legislation'}
- Sponsor Party: ${bill.sponsorParty}
- Latest Action: ${bill.latestAction?.text || 'No recent action'}
- Status: ${bill.status}

TASK: Create content that accurately reflects THIS specific bill, not generic political statements.

REQUIREMENTS:
1. HEADLINE: 4-6 words as a neutral question about THIS bill's specific topic
2. EXPLAINER: One sentence describing what THIS specific bill actually does (not generic political language)
3. SUPPORT: One argument why someone might support THIS specific bill (max 140 chars)
4. OPPOSE: One argument why someone might oppose THIS specific bill (max 140 chars)  
5. CLOSING: A neutral question inviting discussion about THIS bill

CRITICAL RULES:
- Base everything on the actual bill details provided, especially the summary
- Avoid generic phrases like "this bill focuses on" or "government overreach"
- Be specific to the bill's actual provisions and subject matter
- Use simple, clear language that explains the real policy impact
- No emojis, hashtags, or promotional language
- Present both sides fairly based on the actual bill content

Return valid JSON only with: headline, explainer, supportStatement, opposeStatement, closingQuestion`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`AI API error for bill ${billId}: ${response.status}`);
      return generateFallbackExplainer(bill);
    }
    
    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      return generateFallbackExplainer(bill);
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      // Validate required fields
      const requiredFields = ['headline', 'explainer', 'supportStatement', 'opposeStatement', 'closingQuestion'];
      for (const field of requiredFields) {
        if (!parsedResponse[field]) {
          throw new Error(`Missing field: ${field}`);
        }
      }
    } catch (parseError) {
      console.warn(`Failed to parse AI response for ${billId}:`, parseError);
      return generateFallbackExplainer(bill);
    }
    
    // Cache the successful response
    await setDoc(explainerDoc, {
      billId,
      explainerData: parsedResponse,
      cachedAt: Timestamp.now(),
      billTitle: bill.shortTitle,
      billNumber: bill.billNumber
    });
    
    return parsedResponse;
    
  } catch (error) {
    console.warn(`Error generating explainer for ${billId}:`, error);
    return generateFallbackExplainer(bill);
  }
}

// Function to generate fallback explainer
function generateFallbackExplainer(bill: FeedBill): any {
  const titleLower = bill.shortTitle.toLowerCase();
  const subject = bill.subjects?.[0]?.toLowerCase() || 'policy';
  
  // Create variety based on bill properties hash
  const hashString = `${bill.billNumber}-${bill.shortTitle.slice(0, 20)}-${subject}-${bill.sponsorParty}-${bill.sponsorFullName}`;
  let hashCode = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hashCode = ((hashCode << 5) - hashCode) + char;
    hashCode = hashCode & hashCode; // Convert to 32-bit integer
  }
  const variant = Math.abs(hashCode) % 6;
  
  const headlines = [
    'Progress or setback?',
    'Necessary reform or overreach?',
    'Smart policy or government excess?', 
    'Innovation or bureaucracy?',
    'Public benefit or special interests?',
    'Long overdue or rushed decision?'
  ];
  
  const supportReasons = [
    `Could improve ${subject} outcomes for Americans`,
    `Addresses important gaps in current ${subject} policy`,
    `Would modernize outdated ${subject} regulations`, 
    `May provide needed oversight in ${subject} sector`,
    `Could create opportunities in ${subject} area`,
    `Responds to public concerns about ${subject}`
  ];
  
  const opposeReasons = [
    `May increase ${subject} costs without clear benefits`,
    `Could create unintended consequences in ${subject}`,
    `Might expand government role in ${subject} unnecessarily`,
    `May burden ${subject} stakeholders with new requirements`,
    `Could disrupt working ${subject} systems`,
    `Might lack sufficient funding for ${subject} implementation`
  ];
  
  let explainer = `This bill focuses on ${subject}`;
  if (titleLower.includes('establish') || titleLower.includes('create')) {
    explainer += ' and would establish new programs or agencies';
  } else if (titleLower.includes('reform') || titleLower.includes('improve')) {
    explainer += ' and would reform existing systems';
  } else if (titleLower.includes('fund') || titleLower.includes('appropriat')) {
    explainer += ' and would provide funding for programs';
  } else {
    explainer += ' with new requirements or changes';
  }
  
  return {
    headline: headlines[variant],
    explainer: explainer + '.',
    supportStatement: supportReasons[variant],
    opposeStatement: opposeReasons[variant],
    closingQuestion: 'What do you think?'
  };
}

// Function to process long title into shorter version
function processLongTitle(fullTitle: string): string {
  if (!fullTitle) return 'No title';
  
  // If it's already reasonably short (under 80 chars), keep it
  if (fullTitle.length <= 80) {
    return fullTitle;
  }
  
  // Try to find a shorter version by splitting on common separators
  const parts = fullTitle.split(/[;,]|\s+-\s+/);
  const firstPart = parts[0]?.trim();
  
  // If the first part is reasonable length and doesn't contain "official title", use it
  if (firstPart && firstPart.length <= 80 && !firstPart.toLowerCase().includes('official title')) {
    return firstPart;
  }
  
  // Otherwise, truncate intelligently
  if (fullTitle.length > 100) {
    const truncated = fullTitle.substring(0, 100);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 50 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  
  return fullTitle;
}

// Function to fetch member details including image
async function fetchMemberDetails(bioguideId: string, API_KEY: string): Promise<{imageUrl: string | null}> {
  try {
    const memberUrl = `https://api.congress.gov/v3/member/${bioguideId}?api_key=${API_KEY}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(memberUrl, { 
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache member images for 24 hours
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch member details for ${bioguideId}: ${response.status}`);
      return { imageUrl: null };
    }
    
    const data = await response.json();
    const imageUrl = data.member?.depiction?.imageUrl || null;
    
    return { imageUrl };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Member request timeout for ${bioguideId}`);
    } else {
      console.warn(`Error fetching member details for ${bioguideId}:`, error);
    }
    return { imageUrl: null };
  }
}

// Function to fetch detailed bill information
async function fetchBillDetails(congress: number, type: string, number: number, API_KEY: string): Promise<{
  sponsors: any[];
  cosponsors?: ApiCollection<Cosponsor> & { url: string };
  title?: string;
  subjects?: string[];
  summary?: string;
}> {
  try {
    const billUrl = `https://api.congress.gov/v3/bill/${congress}/${type.toLowerCase()}/${number}?api_key=${API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await Promise.race([
        fetch(billUrl, { signal: controller.signal, next: { revalidate: 3600 } }),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
    ]);
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch bill details for ${congress}/${type}/${number}: ${response.status}`);
      return { sponsors: [], subjects: ['General Legislation'], summary: undefined };
    }
    
    const data = await response.json();
    const bill = data.bill || {};
    
    // Fetch summary
    let summaryText: string | undefined = undefined;
    if (bill.summaries?.url) {
        try {
            const summaryRes = await fetch(`${bill.summaries.url}&api_key=${API_KEY}`);
            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                if (summaryData.summaries?.length > 0) {
                    const latestSummary = summaryData.summaries.sort((a: Summary, b: Summary) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime())[0];
                    summaryText = convert(latestSummary.text, { wordwrap: 130 });
                }
            }
        } catch (summaryError) {
            console.warn(`Could not fetch summary for ${bill.number}:`, summaryError);
        }
    }

    // Extract subjects - fetch from separate endpoint if needed
    let subjects: string[] = [];
    try {
      // Check if we have embedded subjects data
      if (bill.subjects?.policyArea?.name) {
        subjects.push(bill.subjects.policyArea.name);
      }
      if (bill.subjects?.legislativeSubjects && Array.isArray(bill.subjects.legislativeSubjects)) {
        const legSubjects = bill.subjects.legislativeSubjects
          .map((s: any) => s?.name)
          .filter(Boolean)
          .slice(0, 3);
        subjects.push(...legSubjects);
      }
      
      // If no embedded subjects but we have a subjects URL, fetch them
      if (subjects.length === 0 && bill.subjects?.url) {
        try {
          const subjectsRes = await fetch(`${bill.subjects.url}&api_key=${API_KEY}`);
          if (subjectsRes.ok) {
            const subjectsData = await subjectsRes.json();
            
            if (subjectsData.subjects?.policyArea?.name) {
              subjects.push(subjectsData.subjects.policyArea.name);
            }
            if (subjectsData.subjects?.legislativeSubjects && Array.isArray(subjectsData.subjects.legislativeSubjects)) {
              const legSubjects = subjectsData.subjects.legislativeSubjects
                .map((s: any) => s?.name)
                .filter(Boolean)
                .slice(0, 3);
              subjects.push(...legSubjects);
            }
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch subjects for ${bill.type} ${bill.number}:`, fetchError);
        }
      }
    } catch (subjectError) {
      console.warn('Error parsing subjects:', subjectError);
    }
    
    if (subjects.length === 0) {
      subjects = ['General Legislation'];
    }
    
    // Map API subjects to our standardized categories
    const mappedSubjects = subjects
      .map(subject => mapApiSubjectToAllowed(subject))
      .filter(Boolean) as string[];
    
    // Remove duplicates and ensure we have at least one subject
    const finalSubjects = [...new Set(mappedSubjects)];
    
    return {
      sponsors: bill.sponsors || [],
      cosponsors: bill.cosponsors,
      title: bill.title,
      subjects: finalSubjects.length > 0 ? finalSubjects : ['General Legislation'],
      summary: summaryText,
    };
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Timeout')) {
      console.warn(`Request timeout for bill ${congress}/${type}/${number}`);
    } else {
      console.warn(`Error fetching bill details for ${congress}/${type}/${number}:`, error);
    }
    return { sponsors: [], subjects: ['General Legislation'], summary: undefined };
  }
}

export async function GET(req: NextRequest) {
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY || API_KEY === 'your_congress_api_key_here') {
    console.error('Missing CONGRESS_API_KEY environment variable');
    return NextResponse.json({ error: 'Server configuration error: Congress API key is missing or not set.' }, { status: 500 });
  }

  const db = getFirestore(app);
  const cacheCollection = collection(db, 'cached_bills');
  
  const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);

  try {
    const overallTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), 25000)
    );
    
    const processData = async () => {
      const latestCongress = '119';

      const q = query(cacheCollection, orderBy('cachedAt', 'desc'), limit(1));
      const cacheSnapshot = await getDocs(q);
      const latestDoc = cacheSnapshot.docs[0];

      if (latestDoc && latestDoc.data().cachedAt > fiveMinutesAgo) {
          const allCachedQuery = query(
            cacheCollection, 
            orderBy('importanceScore', 'desc'),
            limit(100)
          );
          const allDocsSnapshot = await getDocs(allCachedQuery);
          const cachedBillsForCongress = allDocsSnapshot.docs
            .map(doc => {
              const data = doc.data();
              const bill = data.billData as FeedBill;
              // Ensure explainer is included if it exists
              if (!bill.explainer && data.billData.explainer) {
                bill.explainer = data.billData.explainer;
              }
              return bill;
            })
            .filter(bill => bill.congress === 119 && bill.status !== 'Became Law');

          if (cachedBillsForCongress.length > 0) {
             console.log(`Serving ${cachedBillsForCongress.length} bills for Congress ${latestCongress} from fresh Firestore cache.`);
             return NextResponse.json({ bills: cachedBillsForCongress });
          }
      }

      console.log(`Cache is stale or empty for Congress ${latestCongress}. Fetching new data from Congress API.`);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const updatedSince = ninetyDaysAgo.toISOString().split('T')[0];
      const listUrl = `https://api.congress.gov/v3/bill/${latestCongress}?updatedSince=${updatedSince}&limit=100&sort=updateDate+desc&api_key=${API_KEY}`;
      
      const listRes = await fetch(listUrl, { next: { revalidate: 600 } });
      if (!listRes.ok) throw new Error(`Failed to fetch bill list from Congress API: ${listRes.status}`);
      
      const listData: CongressApiResponse = await listRes.json();
      const billItems: Bill[] = listData.bills || [];
      if (billItems.length === 0) return NextResponse.json({ bills: [] });

      console.log(`Fetched ${billItems.length} bills from Congress API. Now fetching detailed information...`);

      const feedBills: FeedBill[] = [];
      const batchSize = 15;
      
      for (let i = 0; i < billItems.length; i += batchSize) {
        const batch = billItems.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (bill): Promise<FeedBill | null> => {
          if (!bill || !bill.latestAction) return null;

          const status = getBillStatus(bill.latestAction.text);
          if (status === 'Became Law') return null;

          let billDetails;
          try {
            billDetails = await fetchBillDetails(bill.congress, bill.type, parseInt(bill.number, 10), API_KEY);
          } catch (error) {
            console.warn(`Failed to fetch details for bill ${bill.type} ${bill.number}:`, error);
            billDetails = { sponsors: [], subjects: ['General Legislation'], summary: '' };
          }
          
          let sponsorImageUrl: string | null = null;
          let sponsorFullName = 'Sponsor information unavailable';
          let sponsorParty = 'N/A';
          const primarySponsor = billDetails.sponsors[0];
          
          if (primarySponsor) {
            sponsorFullName = primarySponsor.fullName || 'Unknown';
            sponsorParty = primarySponsor.party || 'N/A';
            if (primarySponsor.bioguideId) {
              try {
                const memberDetails = await fetchMemberDetails(primarySponsor.bioguideId, API_KEY);
                sponsorImageUrl = memberDetails.imageUrl;
              } catch (imageError) {
                console.warn(`Failed to fetch image for ${primarySponsor.bioguideId}:`, imageError);
              }
            }
          }

          const billTitle = billDetails.title || bill.title;
          const importanceScore = calculateImportanceScore({
            ...bill,
            cosponsors: billDetails.cosponsors
          }, bill.latestAction.text);

          const feedBill: FeedBill = {
              shortTitle: processLongTitle(billTitle).trim(),
              billNumber: `${bill.type} ${bill.number}`,
              congress: bill.congress,
              type: bill.type,
              number: bill.number,
              latestAction: bill.latestAction,
              sponsorParty,
              sponsorFullName,
              sponsorImageUrl,
              committeeName: Array.isArray(billDetails.subjects) ? billDetails.subjects.join(', ') : 'General Legislation',
              subjects: Array.isArray(billDetails.subjects) ? billDetails.subjects : ['General Legislation'],
              status: status,
              importanceScore,
              summary: billDetails.summary,
          };
          
          // Generate explainer with caching (will be done in parallel after batch)
          return feedBill;
        });

        try {
          const batchResults = await Promise.allSettled(batchPromises);
          const validResults = batchResults
            .filter((result): result is PromiseFulfilledResult<FeedBill | null> => 
              result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value as FeedBill);
          
          feedBills.push(...validResults);
          
          if (i + batchSize < billItems.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (batchError) {
          console.warn(`Batch ${i} failed:`, batchError);
        }
      }
      
      console.log(`Processed ${feedBills.length} bills with detailed sponsor information.`);
      
      // Generate explainers for all bills in parallel (with caching)
      console.log('🤖 Generating AI explainers for bills...');
      const billsWithExplainers = await Promise.all(
        feedBills.map(async (bill) => {
          try {
            const explainer = await generateBillExplainer(bill, db);
            return { ...bill, explainer };
          } catch (error) {
            console.warn(`Failed to generate explainer for ${bill.billNumber}:`, error);
            return { ...bill, explainer: generateFallbackExplainer(bill) };
          }
        })
      );
      
      if (billsWithExplainers.length > 0) {
          console.log('💾 Starting to cache', billsWithExplainers.length, 'bills to Firestore...');
          try {
            const batch = writeBatch(db);
            billsWithExplainers.forEach((bill, index) => {
                const billId = `${bill.congress}-${bill.type}-${bill.number}`;
                const docRef = doc(cacheCollection, billId);
                console.log(`📝 Adding bill ${index + 1}/${billsWithExplainers.length} to cache: ${billId}`);
                // Sanitize bill data to remove undefined values
                const sanitizedBill = {
                    ...bill,
                    summary: bill.summary || '',
                    sponsorImageUrl: bill.sponsorImageUrl || null,
                    sponsorFullName: bill.sponsorFullName || 'Unknown',
                    sponsorParty: bill.sponsorParty || 'N/A',
                    committeeName: bill.committeeName || 'General Legislation',
                    subjects: (bill.subjects && bill.subjects.length > 0) ? bill.subjects : ['General Legislation'],
                    explainer: bill.explainer || generateFallbackExplainer(bill)
                };
                
                batch.set(docRef, {
                    billId: billId,
                    billData: sanitizedBill,
                    importanceScore: bill.importanceScore,
                    cachedAt: Timestamp.now(),
                    source: 'congress_api'
                });
            });
            await batch.commit();
            console.log(`✅ Successfully cached ${billsWithExplainers.length} bills with explainers to Firestore.`);
          } catch (cacheError) {
            console.error('🚨 Error caching bills to Firestore:', cacheError);
          }
      } else {
        console.log('⚠️ No bills to cache');
      }

      const sortedBills = billsWithExplainers.sort((a, b) => b.importanceScore - a.importanceScore);
      return NextResponse.json({ bills: sortedBills });
    };

    return await Promise.race([processData(), overallTimeout]);

  } catch (error) {
    console.error('Error in /api/feed/bills:', error);
    
    if (error instanceof Error && error.message === 'Operation timeout') {
      console.log('Operation timed out, checking for older cached data...');
      try {
        const oldCacheQuery = query(
          cacheCollection, 
          orderBy('importanceScore', 'desc'),
          limit(100)
        );
        const oldCacheSnapshot = await getDocs(oldCacheQuery);
        
        if (!oldCacheSnapshot.empty) {
          const bills = oldCacheSnapshot.docs
            .map(doc => {
              const data = doc.data();
              const bill = data.billData as FeedBill;
              // Ensure explainer is included if it exists
              if (!bill.explainer && data.billData.explainer) {
                bill.explainer = data.billData.explainer;
              }
              return bill;
            })
            .filter(bill => bill.congress === 119 && bill.status !== 'Became Law');
          console.log(`Serving ${bills.length} bills from older cache due to timeout.`);
          return NextResponse.json({ bills });
        }
      } catch (cacheError) {
        console.error('Failed to retrieve old cache:', cacheError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
