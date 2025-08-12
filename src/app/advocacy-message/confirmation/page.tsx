'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ConfirmationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  
  const recipientCount = parseInt(searchParams.get('count') || '1');

  useEffect(() => {
    // Start the animation after a brief delay
    const timer = setTimeout(() => {
      let currentCount = 0;
      const interval = setInterval(() => {
        currentCount += 1;
        setVisibleMessages(currentCount);
        
        if (currentCount >= recipientCount) {
          clearInterval(interval);
          setTimeout(() => {
            setAnimationComplete(true);
          }, 500);
        }
      }, 150); // Show one message every 150ms

      return () => clearInterval(interval);
    }, 500);

    return () => clearTimeout(timer);
  }, [recipientCount]);

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {animationComplete ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <Mail className="h-16 w-16 text-blue-500 animate-pulse" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {animationComplete ? 'Your Voice Matters!' : 'Sending Messages...'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Animation showing messages being sent */}
          <div className="bg-secondary/20 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            <div className="space-y-2">
              {Array.from({ length: Math.max(visibleMessages, recipientCount) }).map((_, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-3 transition-all duration-300 ${
                    index < visibleMessages 
                      ? 'opacity-100 transform translate-x-0' 
                      : 'opacity-30 transform translate-x-4'
                  }`}
                >
                  <Mail 
                    className={`h-5 w-5 ${
                      index < visibleMessages ? 'text-green-500' : 'text-gray-400'
                    }`} 
                  />
                  <div className="h-2 bg-gray-200 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full bg-blue-500 rounded-full transition-all duration-500 ${
                        index < visibleMessages ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  {index < visibleMessages && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              {animationComplete 
                ? `${recipientCount} message${recipientCount !== 1 ? 's' : ''} sent successfully!`
                : `Sending ${visibleMessages} of ${recipientCount} messages...`
              }
            </p>
            
            {animationComplete && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your message has been sent and is now part of the democratic process. 
                  Every message sent helps shape the conversation.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    To keep track of your messages, visit your dashboard
                  </p>
                </div>
                
                <div className="flex justify-center space-x-4 pt-4">
                  <Button asChild>
                    <Link href="/dashboard" className="flex items-center space-x-2">
                      <span>Go to Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <Link href="/">
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ConfirmationPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8 max-w-2xl">
        <Card className="text-center">
          <CardContent className="p-8">
            <Mail className="h-16 w-16 text-blue-500 animate-pulse mx-auto mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
};

export default ConfirmationPage;