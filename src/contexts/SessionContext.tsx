'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LegiscanSession {
  session_id: number;
  state_id: number;
  state_abbr: string;
  year_start: number;
  year_end: number;
  session_name: string;
  session_title: string;
  name: string;
  special: number;
  sine_die: number;
  prefile: number;
}

interface SessionContextType {
  currentSession: LegiscanSession | null;
  setCurrentSession: (session: LegiscanSession | null) => void;
  sessions: LegiscanSession[];
  setSessions: (sessions: LegiscanSession[]) => void;
  currentState: string;
  setCurrentState: (state: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<LegiscanSession | null>(null);
  const [sessions, setSessions] = useState<LegiscanSession[]>([]);
  const [currentState, setCurrentState] = useState<string>('CA'); // Default to CA
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load sessions from multiple priority states on initial load
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    async function fetchInitialSessions() {
      setIsLoading(true);

      // Priority states to load sessions from
      const priorityStates = ['CA', 'NY', 'TX', 'FL', 'IL'];
      let allSessions: LegiscanSession[] = [];
      let selectedSession: LegiscanSession | null = null;

      try {
        // Load sessions from priority states
        for (const stateCode of priorityStates) {
          try {
            const response = await fetch(`/api/legiscan?action=sessions&state=${stateCode}`);

            if (!response.ok) {
              console.error(`Failed to fetch sessions for ${stateCode}: ${response.status}`);
              continue;
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.data?.sessions) {
              const stateSessions = data.data.sessions.map((session: LegiscanSession) => ({
                ...session,
                state_abbr: stateCode // Ensure state is marked
              }));
              
              allSessions = [...allSessions, ...stateSessions];
              
              // Auto-select the most recent session from the first successful state
              if (!selectedSession && stateSessions.length > 0) {
                selectedSession = stateSessions[0];
                setCurrentState(stateCode);
              }
            }
          } catch (error) {
            console.error(`Error fetching sessions for ${stateCode}:`, error);
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Sort all sessions by year (most recent first)
        allSessions.sort((a, b) => b.year_start - a.year_start);
        
        setSessions(allSessions);
        if (selectedSession) {
          setCurrentSession(selectedSession);
        }
        
      } catch (error) {
        console.error('Error in initial session fetch:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialSessions();
  }, []); // Only run once on mount

  // Fetch sessions when user manually changes state
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    async function fetchStateSpecificSessions() {
      if (!currentState) return;

      // Don't refetch if we already have sessions for this state
      const hasStateSession = sessions.some(session => session.state_abbr === currentState);
      if (hasStateSession) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/legiscan?action=sessions&state=${currentState}`);

        if (!response.ok) {
          console.error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (data.status === 'success' && data.data?.sessions) {
          const newSessions = data.data.sessions.map((session: LegiscanSession) => ({
            ...session,
            state_abbr: currentState
          }));

          // Add new sessions and sort by year
          const updatedSessions = [...sessions, ...newSessions].sort((a, b) => b.year_start - a.year_start);
          setSessions(updatedSessions);

          // Auto-select the most recent session from the new state if no session selected
          if (!currentSession && newSessions.length > 0) {
            setCurrentSession(newSessions[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        // Silently fail - the app can continue without session data
      } finally {
        setIsLoading(false);
      }
    }

    fetchStateSpecificSessions();
  }, [currentState, sessions, currentSession]);

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        setCurrentSession,
        sessions,
        setSessions,
        currentState,
        setCurrentState,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}