
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, Calendar, BarChart, Mic, Edit, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Bill, ApiCollection, Sponsor, Cosponsor, Committee, Summary, TextVersion, RelatedBill, Subject, PolicyArea } from '@/types';
import { getBillTypeSlug } from '@/lib/utils';
import { remark } from 'remark';
import html from 'remark-html';

// Interfaces for API responses, to be used internally in this file
interface ApiResponse {
  [key: string]: any;
}
interface TitlesResponse {
  titles?: Array<{ title: string; titleType: string; isForPortion?: string; }>;
}
interface SummariesResponse {
  summaries?: Array<{ updateDate: string; [key: string]: any; }>;
}
interface ActionsResponse {
  actions?: Array<{ actionDate: string; text: string; [key: string]: any; }>;
}
interface CommitteesResponse {
  committees?: Array<{ name: string; systemCode: string; activities: Array<{ name: string; date?: string; }>; [key: string]: any; }>;
}
interface SubjectsResponse {
  subjects?: { legislativeSubjects?: Array<{ name: string; }>; policyArea?: { name: string; }; };
  pagination?: { next?: string; };
}

// Function to fetch full bill details directly from the Congress API
async function getBillDetails(congress: number, billType: string, billNumber: string): Promise<Bill | null> {
    const API_KEY = process.env.CONGRESS_API_KEY;
    if (!API_KEY) {
        console.error("CONGRESS_API_KEY is not set.");
        return null;
    }

    const billTypeSlug = getBillTypeSlug(billType);
    const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billTypeSlug}/${billNumber}`;
    const basicUrl = `${baseUrl}?embed=sponsors&api_key=${API_KEY}`;

    try {
        const basicRes = await fetch(basicUrl, { next: { revalidate: 3600 } });
        if (!basicRes.ok) return null;

        const basicData: ApiResponse = await basicRes.json();
        const bill: Bill = basicData.bill;

        if (!bill) return null;

        // Initialize optional structures
        bill.sponsors = bill.sponsors || [];
        bill.committees = { count: 0, items: [] };
        bill.allSummaries = [];

        // Fetch summaries
        if (bill.summaries?.url) {
            const summaryRes = await fetch(`${bill.summaries.url}&api_key=${API_KEY}`);
            if (summaryRes.ok) {
                const summaryData: SummariesResponse = await summaryRes.json();
                const summaries = summaryData.summaries;
                if (summaries && summaries.length > 0) {
                    const sorted = [...summaries].sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
                    bill.allSummaries = sorted as any[];
                }
            }
        }
        
        return bill;
    } catch (error) {
        console.error(`Error fetching bill details for ${billType} ${billNumber}:`, error);
        return null;
    }
}


async function processMarkdown(markdown: string) {
    const result = await remark().use(html).process(markdown);
    return result.toString();
}

function OrganizationHeader({ group }: { group: any }) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {group.logoUrl && (
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Image 
                                src={group.logoUrl} 
                                alt={`${group.name} logo`} 
                                width={100} 
                                height={100}
                                data-ai-hint="logo"
                            />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold font-headline text-primary">{group.name}</h1>
                        <p className="mt-2 text-muted-foreground">{group.description}</p>
                        <a href={group.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4">
                            Visit Website <ExternalLink className="h-4 w-4"/>
                        </a>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {group.nonprofitStatus}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {group.yearsActive} years active</div>
                    <div className="flex items-center gap-2"><BarChart className="h-4 w-4" /> {group.billsSupportedCount} bills supported</div>
                </div>
            </CardContent>
        </Card>
    );
}

function ImpactSection() {
    return (
        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">How Your Voice Makes a Difference</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <Mic className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><strong>Informing Legislators:</strong> Your feedback provides valuable insight into constituent priorities, helping shape the focus of legislation.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><strong>Building Coalitions:</strong> High public support for a bill encourages more lawmakers to become cosponsors, increasing its chances of passage.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Edit className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><strong>Amending Legislation:</strong> Public opposition to specific clauses can lead to amendments that improve a bill before it becomes law.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <BarChart className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><strong>Demonstrating Mandates:</strong> Strong public sentiment can influence committee hearings and floor votes, showing clear support for or against a measure.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><strong>Holding Officials Accountable:</strong> Tracking how your representatives vote on issues you care about empowers you to make informed decisions at the ballot box.</span>
                    </li>
                </ul>
            </CardContent>
        </Card>
    );
}

function QuickActions() {
    return (
         <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Get More Involved</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" size="lg" disabled>Find Your Representatives</Button>
                <Button variant="outline" size="lg" disabled>Join Our Newsletter</Button>
                <Button variant="outline" size="lg" disabled>Volunteer Opportunities</Button>
                <Button variant="default" size="lg" disabled>Support Our Work</Button>
            </CardContent>
        </Card>
    );
}

export default async function GroupDetailPage({ params }: { params: { groupName: string } }) {
    const { groupName } = await params;
    const groupData = getAdvocacyGroupData(groupName);

    if (!groupData) {
        notFound();
    }
    
    // Fetch full bill details and process markdown for each priority bill
    const priorityBillsWithData = await Promise.all(
        (groupData.priorityBills || []).map(async (item) => {
            const billDetails = await getBillDetails(item.bill.congress!, item.bill.type!, item.bill.number!);
            const processedReasoning = await processMarkdown(item.reasoning);
            return {
                ...item,
                bill: billDetails || item.bill, // Fallback to partial data if fetch fails
                reasoning: processedReasoning,
            };
        })
    );
    
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <OrganizationHeader group={groupData} />

                {priorityBillsWithData && priorityBillsWithData.length > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold font-headline text-center">Priority Legislation</h2>
                        <div className="space-y-6">
                            {priorityBillsWithData.map((item, index) => (
                                <AdvocacyBillCard 
                                    key={index}
                                    bill={item.bill}
                                    position={item.position}
                                    reasoning={item.reasoning}
                                    actionButtonText={item.actionButtonText} 
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Coming Soon</CardTitle>
                            <CardContent className="pt-4">
                                <p className="text-muted-foreground">
                                    Detailed legislative priorities and supported bills for this organization will be available here shortly.
                                </p>
                            </CardContent>
                        </CardHeader>
                    </Card>
                )}

                <ImpactSection />
                <QuickActions />
            </div>
        </div>
    );
}
