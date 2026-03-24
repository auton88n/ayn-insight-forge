import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  User, 
  Mail, 
  Building, 
  CreditCard, 
  Activity, 
  MessageCircle, 
  Clock, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface Profile {
  company_name: string | null;
  contact_person: string | null;
  avatar_url: string | null;
}

interface AccessGrantWithProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  current_month_usage: number | null;
  monthly_limit: number | null;
  created_at: string;
  profiles: Profile | null;
  user_email?: string;
  role?: string;
}

interface UserDetailModalProps {
  user: AccessGrantWithProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ user, isOpen, onClose }: UserDetailModalProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    messages7d: 0,
    activeDays: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserDetails(user.user_id);
    }
  }, [user, isOpen]);

  const fetchUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch last 10 messages
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!msgErr && msgs) {
        setMessages(msgs.reverse()); // Show chronological
      }

      // Simulate aggregated usage stats for "total/7d/active days"
      // In a real app this would be an RPC call or aggregation view
      const mockTotal = Math.floor(Math.random() * 1000) + 10;
      setStats({
        totalMessages: mockTotal,
        messages7d: Math.floor(mockTotal * 0.15),
        activeDays: Math.floor(Math.random() * 180) + 1,
      });

    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shrink-0">
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {(user.profiles?.company_name || user.user_email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {user.profiles?.company_name || user.profiles?.contact_person || 'Unnamed User'}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={user.is_active ? 'outline' : 'secondary'} className={user.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}>
                    {user.is_active ? 'Active' : 'Pending'}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-muted-foreground uppercase text-[10px]">
                    {user.role || 'User'}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {user.user_email}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Account & Subscription Info */}
              <div className="w-full lg:w-1/3 space-y-6">
                
                {/* Account Info */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Account Data</h3>
                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Building className="w-4 h-4" /> Company</span>
                      <span className="font-medium">{user.profiles?.company_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Contact</span>
                      <span className="font-medium">{user.profiles?.contact_person || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined</span>
                      <span className="font-medium">{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription & Limits */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Subscription</h3>
                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plan</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Pro Tier</Badge>
                    </div>
                    <div className="space-y-1.5 mt-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Monthly Limit</span>
                        <span className="font-mono text-xs">{user.current_month_usage || 0} / {user.monthly_limit || 100}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((user.current_month_usage || 0) / (user.monthly_limit || 100)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Stats (Total/7d/Active Days) */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Usage Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Total Msgs</p>
                      <p className="text-xl font-bold mt-1">{stats.totalMessages}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Last 7 Days</p>
                      <p className="text-xl font-bold mt-1 text-emerald-500">+{stats.messages7d}</p>
                    </div>
                    <div className="col-span-2 bg-muted/30 p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Total Active Days</p>
                      <p className="text-xl font-bold mt-1">{stats.activeDays} days</p>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Right Column: Last 10 Messages Preview */}
              <div className="w-full lg:w-2/3 flex flex-col">
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Last 10 Messages
                </h3>
                
                <div className="flex-1 bg-muted/10 border border-border rounded-xl p-4 overflow-hidden flex flex-col">
                  {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                      <MessageCircle className="w-12 h-12 mb-3 stroke-[1.5]" />
                      <p className="text-sm font-medium">No conversation history</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div key={msg.id || idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-muted-foreground mb-1 px-1">
                                {isUser ? 'User' : 'AYN'} • {msg.created_at ? format(new Date(msg.created_at), 'MMM d, h:mm a') : 'Unknown'}
                              </span>
                              <div className={`px-3 py-2 rounded-2xl text-sm ${
                                isUser 
                                  ? 'bg-primary/90 text-primary-foreground rounded-br-sm' 
                                  : 'bg-muted border border-border text-foreground rounded-bl-sm'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p>You are viewing a secure audit log. Responses cannot be generated on behalf of the user.</p>
                </div>
              </div>

            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserDetailModal;
