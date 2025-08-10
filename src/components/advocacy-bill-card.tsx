
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Bill {
    number: string;
    type: string;
    congress: number;
    title?: string;
}

interface AdvocacyBillCardProps {
    bill: Bill;
    position: string;
    reasoning: string;
    actionButtonText?: string;
}

const AdvocacyBillCard: React.FC<AdvocacyBillCardProps> = ({ bill, position, reasoning, actionButtonText }) => {
    const billId = `${bill.type.toUpperCase()}${bill.number}`;
    const billTitle = bill.title || `Legislation ${billId}`;

    // Determine badge color and text based on position
    const isSupport = position.toLowerCase().includes('support');
    const badgeVariant = isSupport ? 'default' : 'destructive';
    const badgeText = isSupport ? 'Support' : 'Oppose';

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>
                    <Link href={`/bill/${bill.congress}/${bill.type}/${bill.number}`} className="hover:underline">
                        {billTitle}
                    </Link>
                </CardTitle>
                <div className="flex items-center gap-2 pt-1">
                    <Badge variant={badgeVariant}>{badgeText}</Badge>
                    <span className="text-sm text-muted-foreground">{`Bill ID: ${billId}`}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div className="flex-grow">
                    <h3 className="font-semibold text-lg mb-2">
                        {position}
                    </h3>
                    <div 
                        className="prose prose-sm max-w-none text-muted-foreground prose-h3:font-semibold prose-h3:text-lg prose-h3:mb-2 prose-ul:list-disc prose-ul:pl-5 mb-4" 
                        dangerouslySetInnerHTML={{ __html: reasoning }} 
                    />
                </div>
                <div className="mt-auto pt-4">
                    {actionButtonText && (
                         <Button asChild className="w-full mb-2" size="sm">
                            <Link href="/advocacy-message">
                                {actionButtonText}
                            </Link>
                        </Button>
                    )}
                    <Button asChild className="w-full" size="sm" variant="outline">
                        <Link href={`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}`}>
                            Voice your opinion
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdvocacyBillCard;
