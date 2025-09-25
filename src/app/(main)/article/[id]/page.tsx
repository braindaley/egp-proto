'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock article data - in a real app this would come from an API
const getArticleData = (id: string) => {
  // First check for specific articles
  const specificArticles: Record<string, any> = {
    '1': {
      id: 1,
      headline: "Worker Rights Protection Act Strengthens Union Organizing",
      category: "Economy & Work",
      image: "/api/placeholder/800/400",
      content: `A bipartisan coalition in Congress is advancing comprehensive legislation aimed at strengthening workers' rights to organize and collectively bargain. The Worker Rights Protection Act represents the most significant labor reform effort in decades, with provisions that would fundamentally reshape the relationship between employers and employees across the United States.

The legislation includes several key components designed to protect workers from retaliation when attempting to form unions. Under the proposed law, employers would face increased penalties for interfering with organizing efforts, and workers would gain new legal protections during union campaigns. The bill also establishes expedited procedures for union certification and mandates that employers provide equal access to workplace facilities for union organizers.

Labor advocates have praised the legislation as a critical step toward restoring balance in workplace power dynamics. "For too long, workers have faced intimidation and retaliation when trying to exercise their fundamental right to organize," said Maria Rodriguez, director of the National Labor Coalition. "This bill would level the playing field and give workers the protection they deserve."

The business community has expressed mixed reactions to the proposed legislation. While some industry groups have raised concerns about potential impacts on workplace flexibility and competitiveness, others have indicated support for provisions that would create more predictable labor relations frameworks.

Economic analysts suggest that the legislation could have far-reaching implications for wage growth and working conditions across multiple sectors. Recent studies indicate that workers in unionized workplaces earn approximately 20% more than their non-union counterparts and have access to better benefits and job security.

The bill is expected to face significant debate in both chambers of Congress, with key votes anticipated in the coming weeks. Supporters are mobilizing grassroots campaigns to build pressure on undecided lawmakers, while opponents are highlighting potential economic concerns.

If passed, the Worker Rights Protection Act would mark the most substantial expansion of labor rights since the National Labor Relations Act of 1935. The legislation reflects growing public support for workers' rights, with recent polling showing that 68% of Americans approve of labor unions.`,
      sources: [
        { name: "Reuters", icon: "https://www.reuters.com/favicon.ico", url: "https://reuters.com" },
        { name: "AP News", icon: "https://apnews.com/favicon.ico", url: "https://apnews.com" },
        { name: "CNN", icon: "https://cnn.com/favicon.ico", url: "https://cnn.com" },
        { name: "Washington Post", icon: "https://www.washingtonpost.com/favicon.ico", url: "https://washingtonpost.com" },
        { name: "NPR", icon: "https://www.npr.org/favicon.ico", url: "https://npr.org" },
        { name: "Bloomberg", icon: "https://www.bloomberg.com/favicon.ico", url: "https://bloomberg.com" },
        { name: "Politico", icon: "https://www.politico.com/favicon.ico", url: "https://politico.com" },
        { name: "The Hill", icon: "https://thehill.com/favicon.ico", url: "https://thehill.com" }
      ]
    },
    '2': {
      id: 2,
      headline: "Gun Safety Legislation Includes Universal Background Checks",
      category: "Gun Policy",
      image: "/api/placeholder/800/400",
      content: `Congressional leaders have introduced comprehensive gun safety legislation that includes universal background checks and enhanced restrictions on assault weapons. The Bipartisan Safer Communities Act represents a significant step forward in addressing gun violence while respecting Second Amendment rights.

The legislation mandates background checks for all gun sales, including private transactions and gun shows, closing what advocates call critical loopholes in the current system. The bill also includes provisions for extreme risk protection orders, commonly known as "red flag" laws, which would allow law enforcement to temporarily remove firearms from individuals deemed dangerous.

Gun violence prevention organizations have mobilized unprecedented support for the legislation, organizing rallies and advocacy campaigns across the country. "This bill saves lives while protecting constitutional rights," said David Thompson, spokesperson for Everytown for Gun Safety. "Universal background checks are supported by 90% of Americans, including gun owners."

The National Rifle Association and other gun rights groups have expressed opposition to certain provisions of the bill, arguing that law-abiding citizens should not face additional restrictions. However, some gun owners and sporting organizations have indicated support for enhanced background checks and safety measures.

Recent polling data shows strong public support for the legislation's key components. A recent survey found that 89% of Americans support universal background checks, while 68% support enhanced restrictions on high-capacity magazines. Support crosses party lines, with significant backing from both Democratic and Republican voters.

The bill includes funding for mental health programs and school safety initiatives, addressing some of the root causes of gun violence. It allocates $2.8 billion for community-based violence intervention programs and $300 million for mental health services in schools and communities.

Law enforcement organizations have largely endorsed the legislation, citing the need for comprehensive approaches to reducing gun violence. The Fraternal Order of Police and the International Association of Chiefs of Police have both issued statements supporting key provisions of the bill.

If enacted, the legislation would represent the most significant federal gun safety measure in nearly three decades. The bill's sponsors express optimism about its prospects, noting the bipartisan support and the urgency created by recent tragic events.`,
      sources: [
        { name: "CBS News", icon: "https://www.cbsnews.com/favicon.ico", url: "https://cbsnews.com" },
        { name: "ABC News", icon: "https://abcnews.go.com/favicon.ico", url: "https://abcnews.com" },
        { name: "NBC News", icon: "https://www.nbcnews.com/favicon.ico", url: "https://nbcnews.com" },
        { name: "The Hill", icon: "https://thehill.com/favicon.ico", url: "https://thehill.com" },
        { name: "USA Today", icon: "https://www.usatoday.com/favicon.ico", url: "https://usatoday.com" },
        { name: "Fox News", icon: "https://www.foxnews.com/favicon.ico", url: "https://foxnews.com" },
        { name: "MSNBC", icon: "https://www.msnbc.com/favicon.ico", url: "https://msnbc.com" },
        { name: "CNN", icon: "https://cnn.com/favicon.ico", url: "https://cnn.com" }
      ]
    }
  };

  // If we have a specific article, return it
  if (specificArticles[id]) {
    return specificArticles[id];
  }

  // Generate a generic article for any other ID
  const categories = [
    "Abortion", "Climate, Energy & Environment", "Criminal Justice", "Death Penalty",
    "Defense & National Security", "Discrimination & Prejudice", "Drug Policy",
    "Economy & Work", "Education", "Free Speech & Press", "Gun Policy", "Health Policy",
    "Immigration & Migration", "International Affairs", "LGBT Acceptance",
    "National Conditions", "Privacy Rights", "Religion & Government",
    "Social Security & Medicare", "Technology Policy Issues"
  ];

  // Get a consistent category based on the ID
  const categoryIndex = parseInt(id) % categories.length;
  const category = categories[categoryIndex];

  return {
    id: parseInt(id),
    headline: `Important Legislative Update on ${category}`,
    category: category,
    image: "/api/placeholder/800/400",
    content: `Congressional leaders are advancing significant legislation addressing ${category.toLowerCase()} policy priorities. This comprehensive bill represents a major step forward in addressing key challenges facing Americans across the nation.

The proposed legislation includes several critical provisions designed to strengthen protections and expand opportunities for affected communities. Lawmakers from both parties have engaged in extensive negotiations to craft a balanced approach that addresses various stakeholder concerns while maintaining focus on core policy objectives.

Advocacy organizations have mobilized grassroots campaigns to build support for the legislation, organizing town halls and community meetings nationwide. "This bill represents exactly the kind of forward-thinking policy we need," said a spokesperson for the National Policy Coalition. "It addresses real challenges facing families and communities across America."

Various stakeholder groups have provided input during the legislative process, with many expressing support for key provisions. Industry representatives, advocacy organizations, and community leaders have participated in committee hearings and stakeholder meetings to help shape the final legislation.

Policy experts suggest that the bill could have significant positive impacts if enacted. Research indicates that similar measures in other jurisdictions have led to improved outcomes and stronger protections for affected communities.

The legislation is expected to advance through both chambers of Congress in the coming weeks, with supporters working to build bipartisan coalitions. Committee leadership has indicated optimism about the bill's prospects and timeline for consideration.

Recent polling shows strong public support for the policy changes outlined in the legislation, with majorities of Americans across party lines expressing approval for the proposed reforms. This grassroots backing is expected to play a key role in building momentum for passage.

If signed into law, this legislation would represent one of the most significant policy advances in this area in recent years, reflecting growing recognition of the need for comprehensive reform and strengthened protections.`,
    sources: [
      { name: "Associated Press", icon: "https://apnews.com/favicon.ico", url: "https://apnews.com" },
      { name: "Reuters", icon: "https://www.reuters.com/favicon.ico", url: "https://reuters.com" },
      { name: "CNN", icon: "https://cnn.com/favicon.ico", url: "https://cnn.com" },
      { name: "NBC News", icon: "https://www.nbcnews.com/favicon.ico", url: "https://nbcnews.com" },
      { name: "CBS News", icon: "https://www.cbsnews.com/favicon.ico", url: "https://cbsnews.com" },
      { name: "Politico", icon: "https://www.politico.com/favicon.ico", url: "https://politico.com" },
      { name: "The Hill", icon: "https://thehill.com/favicon.ico", url: "https://thehill.com" },
      { name: "Washington Post", icon: "https://www.washingtonpost.com/favicon.ico", url: "https://washingtonpost.com" }
    ]
  };
};

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  const article = getArticleData(articleId);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Articles
      </Link>

      {/* Article Header */}
      <div className="mb-6">
        <Badge variant="secondary" className="mb-4">{article.category}</Badge>
        <h1 className="text-3xl font-bold mb-4 leading-tight">{article.headline}</h1>
      </div>

      {/* Article Image */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-8 rounded-lg overflow-hidden">
        <div className="text-muted-foreground/50 text-lg">News Image</div>
      </div>

      {/* News Sources Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Coverage by Major News Outlets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {article.sources.map((source: any, index: number) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={source.icon}
                  alt={`${source.name} favicon`}
                  className="w-4 h-4 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-4 h-4 bg-blue-500 rounded-sm flex-shrink-0 hidden"></div>
                <div className="font-medium text-sm text-gray-900 truncate">{source.name}</div>
              </div>
              <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {article.headline.slice(0, 60)}...
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Content */}
      <div className="prose prose-gray max-w-none mb-8">
        {article.content.split('\n\n').map((paragraph: string, index: number) => (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Call to Action */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-4">Have an Opinion on This Issue?</h3>
          <p className="text-gray-600 mb-6">
            Your voice matters. Contact your representatives and make your position known on this important legislation.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="px-8">
              Voice Your Opinion
            </Button>
            <Button size="lg" variant="outline" className="px-6">
              <Eye className="h-4 w-4 mr-2" />
              Watch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}