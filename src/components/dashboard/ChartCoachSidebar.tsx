import { useState, useMemo } from 'react';
import { X, MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  updatedAt: number;
}

interface ChartCoachSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSwitchSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
  mobileMode?: boolean;
  open?: boolean;
}

function formatSessionTime(ts: number): string {
  const d = new Date(ts);
  try {
    if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  } catch {
    return '';
  }
}

function SessionItem({
  session,
  isActive,
  onSwitch,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSwitch: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const timeLabel = useMemo(() => formatSessionTime(session.updatedAt), [session.updatedAt]);
  const msgCount = session.messages.length;

  return (
    <button
      onClick={onSwitch}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
        "hover:bg-muted/70",
        isActive
          ? "bg-amber-500/10 border-l-2 border-l-amber-500"
          : "border-l-2 border-l-transparent"
      )}
    >
      <div className="flex items-start gap-2.5 pr-6">
        <MessageSquare className={cn(
          "h-3.5 w-3.5 mt-0.5 shrink-0",
          isActive ? "text-amber-500" : "text-muted-foreground"
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate leading-snug text-foreground">
            {session.title || 'New conversation'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {msgCount} message{msgCount !== 1 ? 's' : ''} · {timeLabel}
          </p>
        </div>
      </div>

      {/* Delete button — appears on hover */}
      <button
        onClick={onDelete}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2",
          "w-6 h-6 rounded-md flex items-center justify-center",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
        )}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </button>
  );
}

function SidebarBody({
  sessions,
  activeSessionId,
  onSwitchSession,
  onNewChat,
  onDeleteSession,
  onClose,
  showClose = true,
}: ChartCoachSidebarProps & { showClose?: boolean }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">Chat History</span>
          {sessions.length > 0 && (
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-medium">
              {sessions.length}
            </span>
          )}
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:border-amber-500/40 hover:text-amber-500 hover:bg-amber-500/5 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          New conversation
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No conversations yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Start chatting to save your history
            </p>
          </div>
        ) : (
          sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSwitch={() => onSwitchSession(session.id)}
              onDelete={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function ChartCoachSidebar(props: ChartCoachSidebarProps) {
  if (props.mobileMode) {
    return (
      <Sheet open={props.open} onOpenChange={open => { if (!open) props.onClose(); }}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Chat History</SheetTitle>
          </SheetHeader>
          <SidebarBody {...props} showClose={false} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-[240px] shrink-0 border-r border-border/50 bg-background/50 backdrop-blur-sm flex flex-col h-full">
      <SidebarBody {...props} />
    </div>
  );
}
