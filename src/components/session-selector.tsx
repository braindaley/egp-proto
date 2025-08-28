'use client';

import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';

const states = [
  { name: 'Alabama', abbr: 'AL' }, { name: 'Alaska', abbr: 'AK' },
  { name: 'Arizona', abbr: 'AZ' }, { name: 'Arkansas', abbr: 'AR' },
  { name: 'California', abbr: 'CA' }, { name: 'Colorado', abbr: 'CO' },
  { name: 'Connecticut', abbr: 'CT' }, { name: 'Delaware', abbr: 'DE' },
  { name: 'Florida', abbr: 'FL' }, { name: 'Georgia', abbr: 'GA' },
  { name: 'Hawaii', abbr: 'HI' }, { name: 'Idaho', abbr: 'ID' },
  { name: 'Illinois', abbr: 'IL' }, { name: 'Indiana', abbr: 'IN' },
  { name: 'Iowa', abbr: 'IA' }, { name: 'Kansas', abbr: 'KS' },
  { name: 'Kentucky', abbr: 'KY' }, { name: 'Louisiana', abbr: 'LA' },
  { name: 'Maine', abbr: 'ME' }, { name: 'Maryland', abbr: 'MD' },
  { name: 'Massachusetts', abbr: 'MA' }, { name: 'Michigan', abbr: 'MI' },
  { name: 'Minnesota', abbr: 'MN' }, { name: 'Mississippi', abbr: 'MS' },
  { name: 'Missouri', abbr: 'MO' }, { name: 'Montana', abbr: 'MT' },
  { name: 'Nebraska', abbr: 'NE' }, { name: 'Nevada', abbr: 'NV' },
  { name: 'New Hampshire', abbr: 'NH' }, { name: 'New Jersey', abbr: 'NJ' },
  { name: 'New Mexico', abbr: 'NM' }, { name: 'New York', abbr: 'NY' },
  { name: 'North Carolina', abbr: 'NC' }, { name: 'North Dakota', abbr: 'ND' },
  { name: 'Ohio', abbr: 'OH' }, { name: 'Oklahoma', abbr: 'OK' },
  { name: 'Oregon', abbr: 'OR' }, { name: 'Pennsylvania', abbr: 'PA' },
  { name: 'Rhode Island', abbr: 'RI' }, { name: 'South Carolina', abbr: 'SC' },
  { name: 'South Dakota', abbr: 'SD' }, { name: 'Tennessee', abbr: 'TN' },
  { name: 'Texas', abbr: 'TX' }, { name: 'Utah', abbr: 'UT' },
  { name: 'Vermont', abbr: 'VT' }, { name: 'Virginia', abbr: 'VA' },
  { name: 'Washington', abbr: 'WA' }, { name: 'West Virginia', abbr: 'WV' },
  { name: 'Wisconsin', abbr: 'WI' }, { name: 'Wyoming', abbr: 'WY' }
];

export function SessionSelector() {
  const { 
    currentSession, 
    setCurrentSession, 
    sessions, 
    setCurrentState, 
    isLoading 
  } = useSession();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Session:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="justify-between h-8 px-2 text-xs">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span className="truncate">
                  {currentSession 
                    ? `${currentSession.state_abbr} ${currentSession.year_start}-${currentSession.year_end}`
                    : 'Select Session'
                  }
                </span>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-64 overflow-y-auto">
          {isLoading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Loading sessions...
            </DropdownMenuItem>
          ) : sessions.length > 0 ? (
            sessions.map((session) => {
              const sessionStateName = states.find(s => s.abbr === session.state_abbr)?.name || session.state_abbr;
              return (
                <DropdownMenuItem 
                  key={`${session.state_abbr}-${session.session_id}`}
                  onClick={() => {
                    setCurrentSession(session);
                    setCurrentState(session.state_abbr);
                  }}
                  className={currentSession?.session_id === session.session_id ? "bg-accent" : ""}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium text-sm">{session.session_name || session.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1 rounded">{session.state_abbr}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sessionStateName} • {session.year_start}-{session.year_end}
                      {session.special ? ' (Special)' : ''}
                      {!session.sine_die ? ' (Active)' : ''}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem disabled>
              No sessions available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Full version for use in hamburger menu/settings
export function SessionSelectorFull() {
  const { 
    currentSession, 
    setCurrentSession, 
    sessions, 
    setCurrentState, 
    isLoading 
  } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span className="truncate">
              {currentSession 
                ? `${currentSession.state_abbr} ${currentSession.session_name || currentSession.name} (${currentSession.year_start}-${currentSession.year_end})`
                : 'Select Session'
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-64 overflow-y-auto">
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const sessionStateName = states.find(s => s.abbr === session.state_abbr)?.name || session.state_abbr;
              return (
                <DropdownMenuItem 
                  key={`${session.state_abbr}-${session.session_id}`}
                  onClick={() => {
                    setCurrentSession(session);
                    setCurrentState(session.state_abbr);
                  }}
                  className={currentSession?.session_id === session.session_id ? "bg-accent" : ""}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{session.session_name || session.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1 rounded">{session.state_abbr}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sessionStateName} • {session.year_start}-{session.year_end}
                      {session.special ? ' (Special Session)' : ''}
                      {!session.sine_die ? ' (Active)' : ''}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem disabled>
              No sessions available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}