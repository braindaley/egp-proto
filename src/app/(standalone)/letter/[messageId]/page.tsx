'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { X, Reply, Mail, Plus } from 'lucide-react';

interface MessageReply {
  id: string;
  from: string;
  fromTitle?: string;
  receivedAt: any;
  content: string;
  isRead?: boolean;
}

interface MessageActivity {
  id: string;
  userId: string;
  billNumber?: string;
  billType?: string;
  congress?: string;
  billShortTitle?: string;
  billCurrentStatus?: string;
  userStance: 'support' | 'oppose';
  messageContent: string;
  recipients: Array<{
    name: string;
    bioguideId: string;
    email: string;
    party?: string;
    role?: string;
  }>;
  sentAt: any;
  deliveryStatus: string;
  personalDataIncluded?: string[];
  verifiedUserInfo?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    constituentDescription?: string;
  };
  userInfo?: any;
  isGeneralAdvocacy?: boolean;
  topic?: string;
  replies?: MessageReply[];
}

const SAMPLE_REPLIES: MessageReply[] = [
  {
    id: 'test-reply-1',
    from: 'Office of Senator John Smith',
    fromTitle: 'Legislative Correspondent',
    receivedAt: new Date(),
    content: `Dear Constituent,

Thank you for contacting my office regarding this important legislation. I appreciate you taking the time to share your thoughts and concerns with me.

I have carefully reviewed the bill and understand the impact it may have on our community. Your input is invaluable as I consider how to best represent the interests of our state.

Please know that I will keep your views in mind as this legislation moves through the Senate. My staff and I are committed to ensuring that your voice is heard in Washington.

Thank you again for reaching out. Please do not hesitate to contact my office if you have any further questions or concerns.

Sincerely,
Senator John Smith`,
    isRead: false,
  },
];

export default function LetterPage() {
  const { messageId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState<MessageActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);

  // Check for test mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTestMode(localStorage.getItem('testAsPremium') === 'true' || process.env.NODE_ENV === 'development');
    }
  }, []);

  const addTestReply = async () => {
    if (!message || !messageId) return;

    const newReply: MessageReply = {
      id: `test-reply-${Date.now()}`,
      from: message.recipients[0]?.role === 'Senator'
        ? `Office of Senator ${message.recipients[0]?.name}`
        : `Office of Representative ${message.recipients[0]?.name}`,
      fromTitle: 'Legislative Correspondent',
      receivedAt: new Date(),
      content: SAMPLE_REPLIES[0].content.replace('Senator John Smith', message.recipients[0]?.name || 'Your Representative'),
      isRead: false,
    };

    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'user_messages', messageId as string);
      await updateDoc(docRef, {
        replies: arrayUnion(newReply)
      });

      setMessage({
        ...message,
        replies: [...(message.replies || []), newReply],
      });
    } catch (error) {
      console.error('Error adding test reply:', error);
    }
  };

  const clearTestReplies = async () => {
    if (!message || !messageId) return;

    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'user_messages', messageId as string);
      await updateDoc(docRef, {
        replies: []
      });

      setMessage({
        ...message,
        replies: [],
      });
    } catch (error) {
      console.error('Error clearing replies:', error);
    }
  };

  useEffect(() => {
    const fetchMessage = async () => {
      if (!messageId || !user) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'user_messages', messageId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const messageData = { id: docSnap.id, ...docSnap.data() } as MessageActivity;

          // Verify this message belongs to the current user
          if (messageData.userId === user.uid) {
            setMessage(messageData);
          } else {
            router.push('/dashboard/messages');
          }
        } else {
          router.push('/dashboard/messages');
        }
      } catch (error) {
        console.error('Error fetching message:', error);
        router.push('/dashboard/messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [messageId, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading letter...</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Letter not found</p>
      </div>
    );
  }

  const handleClose = () => {
    router.push('/dashboard/messages');
  };

  return (
    <div className="min-h-screen bg-secondary/30 p-8">
      {/* Close Button */}
      <div className="fixed top-6 right-6 z-10">
        <button
          onClick={handleClose}
          className="bg-white shadow-xl rounded-full p-3 hover:bg-gray-100 transition-all hover:scale-105 border border-gray-200"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Test Mode Controls */}
      {isTestMode && (
        <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-2">
          <button
            onClick={addTestReply}
            className="bg-blue-600 text-white shadow-xl rounded-lg px-4 py-2 hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Test Reply
          </button>
          {message?.replies && message.replies.length > 0 && (
            <button
              onClick={clearTestReplies}
              className="bg-gray-600 text-white shadow-xl rounded-lg px-4 py-2 hover:bg-gray-700 transition-all text-sm font-medium"
            >
              Clear Replies
            </button>
          )}
          <span className="text-xs text-gray-500 text-center">Test Mode</span>
        </div>
      )}

      {/* Paper Container */}
      <div className="max-w-4xl mx-auto">
        {/* Main Letter Paper */}
        <div
          className="bg-white shadow-2xl border border-gray-200"
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: '1.8',
            minHeight: '11in',
            width: '8.5in',
            maxWidth: '8.5in',
            margin: '0 auto',
            padding: '1in',
            position: 'relative'
          }}
        >
          {/* Date */}
          <div className="text-right mb-16 text-base">
            {format(message.sentAt?.toDate() || new Date(), 'MMMM d, yyyy')}
          </div>

          {/* Recipient Address */}
          <div className="mb-16 text-base">
            <div className="font-semibold text-lg mb-2">
              {message.recipients[0]?.role || 'Representative'} {message.recipients[0]?.name}
            </div>
            <div className="text-gray-700 leading-relaxed">
              {message.recipients[0]?.role === 'Senator' ? 'United States Senate' : 'House of Representatives'}<br />
              Washington, DC 20515
            </div>
          </div>

          {/* Salutation */}
          <div className="mb-12 text-base">
            Dear {message.recipients[0]?.role || 'Representative'} {message.recipients[0]?.name?.split(' ').slice(-1)[0]},
          </div>

          {/* Message Body */}
          <div className="mb-16 text-base leading-relaxed whitespace-pre-wrap text-justify">
            {message.messageContent}
          </div>

          {/* Signature Block */}
          <div className="mt-16">
            <div className="text-base mb-8">Sincerely,</div>
            <div className="space-y-2">
              <div className="font-medium text-base flex items-center gap-3">
                {message.verifiedUserInfo?.fullName || message.userInfo?.fullName || 'Your Constituent'}
                {(message.verifiedUserInfo?.fullName || message.userInfo?.fullName) && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {message.verifiedUserInfo ? 'Verified Voter' : 'Registered Member'}
                  </span>
                )}
              </div>

              {/* Show personal info that was included with the message */}
              <div className="text-gray-600 space-y-1 text-sm">
                {/* For verified users - show address if included */}
                {message.verifiedUserInfo && message.personalDataIncluded?.includes('address') && message.verifiedUserInfo.address && (
                  <div>Full Address: {message.verifiedUserInfo.address}, {message.verifiedUserInfo.city}, {message.verifiedUserInfo.state}, {message.verifiedUserInfo.zipCode}</div>
                )}

                {/* For logged-in users - show all included personal data */}
                {message.userInfo && message.personalDataIncluded?.map((field) => {
                  const value = message.userInfo[field];
                  if (!value || field === 'fullName') return null;

                  const fieldLabels: { [key: string]: string } = {
                    'fullAddress': 'Full Address',
                    'birthYear': 'Birth Year',
                    'gender': 'Gender',
                    'politicalAffiliation': 'Political Affiliation',
                    'education': 'Education',
                    'profession': 'Profession',
                    'militaryService': 'Military Service'
                  };

                  return (
                    <div key={field}>
                      {fieldLabels[field] || field}: {value}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer note */}
            <div className="text-xs text-gray-500 mt-12 pt-8 border-t border-gray-100 italic">
              This message was sent via the Electronic Government Platform on {format(message.sentAt?.toDate() || new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
            </div>
          </div>
        </div>

        {/* Bill Information Card - Separate from paper */}
        {message.billNumber && (
          <div className="mt-8 bg-white shadow-xl rounded-lg p-6 max-w-2xl mx-auto border border-gray-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">Regarding: {message.billType} {message.billNumber}</h3>
            <p className="text-gray-600 mb-2 leading-relaxed">{message.billShortTitle}</p>
            <p className="text-sm text-gray-500 mb-3">Status: {message.billCurrentStatus}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Your stance:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${message.userStance === 'support' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {message.userStance === 'support' ? 'Support' : 'Oppose'}
              </span>
            </div>
          </div>
        )}

        {/* Replies Section */}
        {message.replies && message.replies.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Reply className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                {message.replies.length} {message.replies.length === 1 ? 'Reply' : 'Replies'} Received
              </h2>
            </div>

            <div className="space-y-6">
              {message.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-white shadow-xl border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Reply Header */}
                  <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{reply.from}</p>
                          {reply.fromTitle && (
                            <p className="text-sm text-gray-600">{reply.fromTitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(reply.receivedAt?.toDate?.() || new Date(reply.receivedAt), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  {/* Reply Content */}
                  <div className="px-6 py-6">
                    <div
                      className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                      {reply.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}