import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Search, 
  User, 
  Bot, 
  Clock,
  Filter,
  RefreshCw,
  MoreVertical,
  Mail,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ChatUser {
  user_id: string;
  email: string;
  company_name: string | null;
  message_count: number;
  last_message_at: string;
  isActive: boolean;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  metadata?: any;
}

export const ConversationViewer = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users list with message counts
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Fetch users and their message usage from user_ai_limits
      const { data: limitsData, error: limitsErr } = await supabase
        .from('user_ai_limits')
        .select(`
          user_id,
          current_monthly_messages,
          updated_at
        `)
        .order('current_monthly_messages', { ascending: false });
        
      if (limitsErr) throw limitsErr;
      
      // Fetch corresponding profiles manually to avoid Foreign Key PostgREST crashes
      const userIds = limitsData?.map((l: any) => l.user_id).filter(Boolean) || [];
      const profilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, company_name, contact_person')
          .in('user_id', userIds);
          
        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.user_id] = p;
          });
        }
      }

      const realUsers: ChatUser[] = (limitsData || []).map((limit: any, i) => {
        const profile = profilesMap[limit.user_id];
        const displayEmail = profile?.company_name || profile?.contact_person || limit.user_id.substring(0, 8);
        
        return {
          user_id: limit.user_id,
          email: displayEmail,
          company_name: profile?.company_name || null,
          message_count: limit.current_monthly_messages || 0,
          last_message_at: limit.updated_at || new Date().toISOString(),
          isActive: (limit.current_monthly_messages || 0) > 0 // simple active heuristic
        };
      });

      setUsers(realUsers);
      setFilteredUsers(realUsers);
      if (realUsers.length > 0 && !selectedUser) {
        handleSelectUser(realUsers[0]);
      }
    } catch (err) {
      console.error('Error fetching chat users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch messages for a specific user
  const fetchMessages = async (userId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        setMessages([]); // No mock fallback - keep it real
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(users.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.company_name && u.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
    fetchMessages(user.user_id);
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[600px] flex flex-col space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            Conversation Viewer
          </h2>
          <p className="text-muted-foreground mt-1">
            Audit and review user interactions with AYN.
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoadingUsers}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Panel: User List */}
        <Card className="w-1/3 max-w-[350px] min-w-[280px] flex flex-col border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-border space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-muted border-0 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{filteredUsers.length} Users</span>
              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                <Filter className="w-3 h-3" /> Recent
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingUsers ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  No users found.
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.user_id}
                    onClick={() => handleSelectUser(user)}
                    className={`
                      p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3
                      ${selectedUser?.user_id === user.user_id 
                        ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                        : 'hover:bg-muted/50 border border-transparent'}
                    `}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      {user.isActive && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm text-foreground truncate block w-full pr-2">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate max-w-[100px]">{user.company_name || 'No Company'}</span>
                        <span className="shrink-0 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {user.message_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right Panel: Chat Interface */}
        <Card className="flex-1 flex flex-col border-border bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden relative">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border bg-muted/20 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground leading-tight">
                      {selectedUser.company_name || 'Unknown Company'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedUser.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last active {formatDistanceToNow(new Date(selectedUser.last_message_at))} ago
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Chat Messages Area */}
              <ScrollArea className="flex-1 p-6">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <MessageCircle className="w-16 h-16 mb-4 stroke-[1.5]" />
                    <p>No messages recorded for this user.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Timestamp separator */}
                    <div className="flex items-center justify-center mb-6">
                      <Badge variant="outline" className="bg-background text-muted-foreground font-normal text-xs">
                        {messages[0] ? format(new Date(messages[0].created_at), 'MMMM d, yyyy') : 'Past Conversation'}
                      </Badge>
                    </div>

                    {messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      
                      return (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className="shrink-0 mt-auto mb-1">
                              {isUser ? (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shadow-lg">
                                  <Bot className="w-4 h-4 text-background" />
                                </div>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-muted-foreground mb-1 mx-1 flex items-center gap-1">
                                {isUser ? 'User' : 'AYN'} • {format(new Date(msg.created_at), 'h:mm a')}
                              </span>
                              <div 
                                className={`
                                  px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                  ${isUser 
                                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                    : 'bg-muted border border-border/50 text-foreground rounded-bl-sm'}
                                `}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              {/* Fake Input Area (Read Only) */}
              <div className="p-4 bg-muted/20 border-t border-border mt-auto shrink-0 flex justify-center">
                <Badge variant="outline" className="bg-background/80 text-muted-foreground backdrop-blur-sm gap-2 py-1.5 px-4 font-normal">
                  <MessageCircle className="w-3.5 h-3.5" /> 
                  Read-only mode. Admins cannot reply directly as AYN.
                </Badge>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/5 opacity-80">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 border border-border shadow-inner">
                <MessageCircle className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Conversation Viewer</h3>
              <p className="max-w-md text-center text-sm">
                Select a user from the left panel to securely audit their raw conversation logs with AYN AI.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversationViewer;
