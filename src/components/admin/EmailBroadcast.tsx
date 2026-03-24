import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';

type Segment = 'all' | 'active' | 'inactive' | 'paid' | 'free';

export const EmailBroadcast = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getRecipientEstimate = (s: Segment) => {
    switch(s) {
      case 'all': return 1240;
      case 'active': return 890;
      case 'inactive': return 350;
      case 'paid': return 142;
      case 'free': return 1098;
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and content are required');
      return;
    }
    
    setIsSending(true);
    
    // Simulate real Send API integration with Supabase Edge Functions / Resend
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      toast.success(`Broadcasting to ${getRecipientEstimate(segment)} users!`);
      setShowConfirm(false);
      setSubject('');
      setContent('');
    } catch (error) {
      toast.error('Failed to dispatch broadcast email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Broadcast
          </h2>
          <p className="text-muted-foreground mt-1">
            Dispatch mass email updates and newsletters directly to your user segments.
          </p>
        </div>
        <Button variant="outline" className="gap-2 bg-card/50">
          <Settings className="w-4 h-4" /> API Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor Settings / Right Column (Displayed First on Mobile) */}
        <div className="lg:col-span-1 space-y-6 lg:order-last">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-sm">Audience Segment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(['all', 'active', 'inactive', 'paid', 'free'] as Segment[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegment(s)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-sm ${
                      segment === s 
                        ? 'bg-primary/10 border-primary/30 text-foreground' 
                        : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="capitalize font-medium">{s} Users</span>
                    {segment === s && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 mt-6">
                <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-500">Estimated Reach</h4>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {getRecipientEstimate(segment).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-500/80 mt-1">Recipients in segment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-4 flex items-start gap-3 text-sm text-muted-foreground">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p>
                Broadcasts are dispatched immediately via Supabase Edge Functions using the Resend API. Please double-check formatting before sending.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Compose Email</CardTitle>
            <CardDescription>Variables: <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{firstName}}"}</code> <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{company}}"}</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Subject Line</label>
              <Input 
                placeholder="Product Update: Introducing New AI Features" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-foreground">Message Body (HTML Supported)</label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1.5 text-muted-foreground">
                  <Eye className="w-3 h-3" /> Preview
                </Button>
              </div>
              <Textarea 
                placeholder="Hi {{firstName}},&#10;&#10;We are excited to announce..." 
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm resize-y"
              />
            </div>

            <Button 
              size="lg" 
              className="w-full mt-4 text-base h-12 gap-2"
              onClick={() => setShowConfirm(true)}
              disabled={!subject.trim() || !content.trim()}
            >
              <Send className="w-5 h-5" />
              Prepare Broadcast
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Confirm Mass Broadcast</h3>
              <p className="text-muted-foreground text-sm mb-6">
                You are about to dispatch an email with the subject <strong className="text-foreground">"{subject}"</strong> to <strong className="text-foreground">{getRecipientEstimate(segment).toLocaleString()} recipients</strong> in the <span className="capitalize">{segment}</span> segment.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowConfirm(false)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-primary gap-2" 
                  onClick={handleSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Now
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmailBroadcast;
