
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Bill } from '@/types';
import { getBillTypeSlug } from '@/lib/utils';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AdvocacyBillCardProps {
    bill: Bill | Partial<Bill>;
    position: 'Support' | 'Oppose' | string;
    reasoning: string;
    actionButtonText: string;
    supportCount: number;
    opposeCount: number;
}

const AdvocacyBillCard: React.FC<AdvocacyBillCardProps> = ({ bill, position, reasoning, actionButtonText, supportCount, opposeCount }) => {
    if (!bill.type || !bill.number || !bill.congress) {
      return (
        <Card className="flex flex-col h-full items-center justify-center text-center">
            <CardHeader>
                <CardTitle>Bill Information Missing</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This advocacy card cannot be displayed because bill details are incomplete.</p>
            </CardContent>
        </Card>
      )
    }

    const billId = `${bill.type.toUpperCase()} ${bill.number}`;
    const billTitle = bill.title || `Legislation ${billId}`;
    const billTypeSlug = getBillTypeSlug(bill.type);

    const isSupport = position.toLowerCase() === 'support';
    const badgeVariant = isSupport ? 'default' : 'destructive';
    const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;

    return (
        <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-primary mb-1">{billId} &bull; {bill.congress}th Congress</p>
                        <CardTitle className="text-lg font-bold">
                            <Link href={`/bill/${bill.congress}/${billTypeSlug}/${bill.number}`} className="hover:underline">
                                {billTitle}
                            </Link>
                        </CardTitle>
                    </div>
                     <Badge variant={badgeVariant} className="flex items-center gap-2 text-base px-3 py-1.5">
                        <PositionIcon className="h-4 w-4" />
                        <span>{position}</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div 
                    className="prose prose-sm max-w-none text-muted-foreground prose-h3:font-semibold prose-h3:text-lg prose-h3:mb-2 prose-ul:list-disc prose-ul:pl-5 mb-4 flex-grow" 
                    dangerouslySetInnerHTML={{ __html: reasoning }} 
                />
                <div className="flex items-center justify-around text-center py-2 border-t border-b">
                    <div className="flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-5 w-5" />
                        <div>
                            <p className="font-bold text-lg">{supportCount.toLocaleString()}</p>
                            <p className="text-xs font-medium">Supporters</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 text-red-600">
                        <ThumbsDown className="h-5 w-5" />
                         <div>
                            <p className="font-bold text-lg">{opposeCount.toLocaleString()}</p>
                            <p className="text-xs font-medium">Opponents</p>
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-4">
                    <Button asChild className="w-full" size="lg">
                        <Link href={`/advocacy-message?congress=${bill.congress}&type=${billTypeSlug}&number=${bill.number}`}>
                           {actionButtonText} <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdvocacyBillCard;
