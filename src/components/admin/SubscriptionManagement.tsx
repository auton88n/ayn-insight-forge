import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  Edit2,
  Crown,
  Zap,
  Sparkles,
  UserCheck,
  RefreshCw,
  Calendar,
  Plus,
   AlertCircle,
    Settings2,
    Building,
    Infinity as InfinityIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUBSCRIPTION_TIERS, type TierKey } from '@/contexts/SubscriptionContext';

interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

interface ProfileData {
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
}

// Merged user data showing ALL users with optional subscription
interface MergedUserData {
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  subscription: UserSubscription | null;
  hasSubscriptionRecord: boolean;
}

interface RevenueMetrics {
  totalMRR: number;
  totalSubscribers: number;
  totalUsers: number;
  freeUsers: number;
  starterUsers: number;
  proUsers: number;
  businessUsers: number;
   enterpriseUsers: number;
   unlimitedUsers: number;
  noRecordUsers: number;
}

const tierConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  free: { icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
  starter: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  pro: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  business: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
   enterprise: { icon: Building, color: 'text-rose-500', bg: 'bg-rose-500/10' },
   unlimited: { icon: InfinityIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export const SubscriptionManagement = () => {
  const [mergedUsers, setMergedUsers] = useState<MergedUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<MergedUserData | null>(null);
  const [newTier, setNewTier] = useState<TierKey>('free');
  const [useCustomOverride, setUseCustomOverride] = useState(false);
  const [customLimit, setCustomLimit] = useState<number>(100);
  const [isUpdating, setIsUpdating] = useState(false);

  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalMRR: 0,
    totalSubscribers: 0,
    totalUsers: 0,
    freeUsers: 0,
    starterUsers: 0,
    proUsers: 0,
    businessUsers: 0,
     enterpriseUsers: 0,
     unlimitedUsers: 0,
    noRecordUsers: 0,
  });

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch ALL profiles (all users in the system)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, company_name, contact_person')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Security: Log admin bulk access to profiles
      if (profiles && profiles.length > 0) {
        supabase.from('security_logs').insert({
          action: 'admin_profiles_bulk_access',
          details: {
            count: profiles.length,
            context: 'subscription_management',
            timestamp: new Date().toISOString()
          },
          severity: 'high'
        });
      }

      // Fetch existing subscriptions
      const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*');

      if (subsError) throw subsError;

      // Create a map of subscriptions by user_id
      const subscriptionMap = new Map<string, UserSubscription>(
        (subs || []).map(sub => [sub.user_id, {
          id: sub.id,
          user_id: sub.user_id,
          stripe_customer_id: sub.stripe_customer_id,
          stripe_subscription_id: sub.stripe_subscription_id,
          subscription_tier: sub.subscription_tier || 'free',
          status: sub.status || 'inactive',
          current_period_end: sub.current_period_end,
          created_at: sub.created_at || new Date().toISOString(),
        }])
      );

      // Merge profiles with subscriptions (LEFT JOIN logic)
      const merged: MergedUserData[] = (profiles || []).map((profile: ProfileData) => ({
        user_id: profile.user_id,
        company_name: profile.company_name,
        contact_person: profile.contact_person,
        subscription: subscriptionMap.get(profile.user_id) || null,
        hasSubscriptionRecord: subscriptionMap.has(profile.user_id),
      }));

      setMergedUsers(merged);

      // Calculate metrics
       const tierCounts = { free: 0, starter: 0, pro: 0, business: 0, enterprise: 0, unlimited: 0 };
      let mrr = 0;
      let noRecordCount = 0;

      merged.forEach(user => {
        if (!user.hasSubscriptionRecord) {
          noRecordCount++;
          return;
        }
        const tier = user.subscription?.subscription_tier as TierKey;
        if (tier in tierCounts) {
          tierCounts[tier as keyof typeof tierCounts]++;
          const tierData = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
           if (user.subscription?.status === 'active' && tier !== 'free' && tier !== 'unlimited' && tierData && tierData.price > 0) {
            mrr += tierData.price || 0;
          }
        }
      });

      setMetrics({
        totalMRR: mrr,
        totalSubscribers: merged.filter(u => u.subscription?.status === 'active' && u.subscription?.subscription_tier !== 'free').length,
        totalUsers: merged.length,
        freeUsers: tierCounts.free,
        starterUsers: tierCounts.starter,
        proUsers: tierCounts.pro,
        businessUsers: tierCounts.business,
         enterpriseUsers: tierCounts.enterprise,
         unlimitedUsers: tierCounts.unlimited,
        noRecordUsers: noRecordCount,
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSetOrOverrideTier = async () => {
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      const tierData = SUBSCRIPTION_TIERS[newTier as keyof typeof SUBSCRIPTION_TIERS];
      const effectiveLimit = useCustomOverride ? customLimit : tierData?.limits.monthlyCredits;
      
      // Use upsert for robustness - handles both new and existing records
      // Only set core tier fields, never overwrite Stripe fields
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({ 
          user_id: editingUser.user_id,
          subscription_tier: newTier,
          status: newTier === 'free' ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      // UPSERT user_ai_limits to set credit limits
      if (tierData) {
        const isUnlimitedTier = newTier === 'unlimited' || newTier === 'enterprise';
        const { error: limitsError } = await supabase
          .from('user_ai_limits')
          .upsert({
            user_id: editingUser.user_id,
            monthly_messages: effectiveLimit,
            monthly_engineering: tierData.limits.monthlyEngineering,
            is_unlimited: isUnlimitedTier,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (limitsError) throw limitsError;
      }

      // Also update access_grants for compatibility
      const { error: grantsError } = await supabase
        .from('access_grants')
        .update({ 
          monthly_limit: effectiveLimit,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', editingUser.user_id);

      if (grantsError) console.error('Error updating access_grants:', grantsError);

      toast.success(`Tier set to ${tierData?.name || newTier}`);
      setEditingUser(null);
      setUseCustomOverride(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error('Failed to update user tier');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = mergedUsers.filter(user => {
    const matchesSearch = 
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterTier === 'all') return matchesSearch;
    if (filterTier === 'no-record') return matchesSearch && !user.hasSubscriptionRecord;
    return matchesSearch && user.subscription?.subscription_tier === filterTier;
  });

  const metricCards = [
    { 
      label: 'Monthly Revenue', 
      value: `$${metrics.totalMRR}`, 
      icon: DollarSign, 
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10'
    },
    { 
      label: 'Total Users', 
      value: metrics.totalUsers, 
      icon: Users, 
      gradient: 'from-slate-500/20 to-slate-600/5',
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-500/10'
    },
    { 
      label: 'Paid Subscribers', 
      value: metrics.totalSubscribers, 
      icon: UserCheck, 
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10'
    },
    { 
      label: 'No Record', 
      value: metrics.noRecordUsers, 
      icon: AlertCircle, 
      gradient: 'from-orange-500/20 to-orange-600/5',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="relative overflow-hidden border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-60`} />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${metric.iconBg}`}>
                    <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Distribution */}
      <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Subscription Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(tierConfig).map(([tier, config]) => {
              const Icon = config.icon;
              const countMap: Record<string, number> = {
                free: metrics.freeUsers,
                starter: metrics.starterUsers,
                pro: metrics.proUsers,
                business: metrics.businessUsers,
                enterprise: metrics.enterpriseUsers,
                unlimited: metrics.unlimitedUsers,
              };
              const count = countMap[tier] ?? 0;
              const total = metrics.totalUsers || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              
              return (
                <div key={tier} className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className={`mx-auto w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{tier}</p>
                  <p className="text-xs text-muted-foreground/60">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Subscriptions List */}
      <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              User Subscriptions
              <Badge variant="secondary" className="ml-2">
                {metrics.totalUsers} users
              </Badge>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchSubscriptions}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="no-record">No Record</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                 <SelectItem value="enterprise">Enterprise</SelectItem>
                 <SelectItem value="unlimited">Unlimited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const tier = user.subscription?.subscription_tier as keyof typeof tierConfig;
                  const config = user.hasSubscriptionRecord ? (tierConfig[tier] || tierConfig.free) : null;
                  const Icon = config?.icon || AlertCircle;
                  
                  return (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {(user.company_name || user.contact_person || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.company_name || user.contact_person || user.user_id.slice(0, 8)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {user.hasSubscriptionRecord ? (
                              <>
                                <Calendar className="w-3 h-3" />
                                {user.subscription?.current_period_end 
                                  ? `Renews ${format(new Date(user.subscription.current_period_end), 'MMM d, yyyy')}`
                                  : 'No billing date'
                                }
                              </>
                            ) : (
                              <span className="text-orange-500">No subscription record</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {user.hasSubscriptionRecord ? (
                          <>
                            <Badge 
                              variant="secondary" 
                              className={`${config?.bg} ${config?.color} border-0 gap-1.5`}
                            >
                              <Icon className="w-3 h-3" />
                              {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </Badge>
                            <Badge 
                              variant={user.subscription?.status === 'active' ? 'default' : 'secondary'}
                              className={user.subscription?.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-muted text-muted-foreground'
                              }
                            >
                              {user.subscription?.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setNewTier((user.subscription?.subscription_tier || 'free') as TierKey);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge 
                              variant="outline" 
                              className="border-orange-500/30 text-orange-500 gap-1.5"
                            >
                              <AlertCircle className="w-3 h-3" />
                              No Record
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => {
                                setEditingUser(user);
                                setNewTier('free');
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              Set Tier
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit/Set Tier Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser?.hasSubscriptionRecord 
                ? 'Override Subscription Tier' 
                : 'Set Subscription Tier'
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm text-muted-foreground">
                {editingUser?.company_name || editingUser?.contact_person || editingUser?.user_id}
              </p>
            </div>
            {editingUser?.hasSubscriptionRecord && (
              <div className="space-y-2">
                <Label>Current Tier</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {editingUser?.subscription?.subscription_tier || 'None'}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Tier</Label>
              <Select value={newTier} onValueChange={(v) => setNewTier(v as TierKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
                     // Format display text based on tier type
                     let displayText = '';
                     if (key === 'enterprise') {
                       displayText = 'Enterprise - Contact Sales';
                     } else if (key === 'unlimited') {
                       displayText = 'Unlimited (Admin Override)';
                     } else if (tier.limits.monthlyCredits === -1) {
                       displayText = `${tier.name} - Unlimited`;
                     } else if ('isDaily' in tier.limits && tier.limits.isDaily) {
                       displayText = `${tier.name} - $${tier.price}/mo (${tier.limits.monthlyCredits} credits/day)`;
                     } else {
                       displayText = `${tier.name} - $${tier.price}/mo (${tier.limits.monthlyCredits} credits)`;
                     }
                     return (
                       <SelectItem key={key} value={key}>
                         {displayText}
                       </SelectItem>
                     );
                   })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom Override Section */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="custom-override" className="text-sm font-medium">
                    Custom Credit Override
                  </Label>
                </div>
                <Switch
                  id="custom-override"
                  checked={useCustomOverride}
                  onCheckedChange={setUseCustomOverride}
                />
              </div>
              
              {useCustomOverride && (
                <div className="space-y-2">
                  <Label htmlFor="custom-limit" className="text-xs text-muted-foreground">
                    Custom monthly credits
                  </Label>
                  <Input
                    id="custom-limit"
                    type="number"
                    min={0}
                    value={customLimit}
                    onChange={(e) => setCustomLimit(Number(e.target.value))}
                    placeholder="Enter custom limit"
                  />
                </div>
              )}
              
              {/* Effective Credits Summary */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Effective credits:</span>
                  <span className="font-semibold">
                     {(() => {
                       const effectiveCredits = useCustomOverride 
                         ? customLimit 
                         : SUBSCRIPTION_TIERS[newTier]?.limits.monthlyCredits || 0;
                       return effectiveCredits === -1 ? 'Unlimited' : `${effectiveCredits} / month`;
                     })()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {editingUser?.hasSubscriptionRecord 
                ? `This will ${useCustomOverride ? 'set a custom credit limit' : 'apply tier defaults'}. Use with caution - this bypasses Stripe billing.`
                : `This will create a subscription record ${useCustomOverride ? 'with custom credits' : 'using tier defaults'}.`
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSetOrOverrideTier} disabled={isUpdating}>
              {isUpdating 
                ? 'Saving...' 
                : editingUser?.hasSubscriptionRecord 
                  ? 'Save Override' 
                  : 'Create Subscription'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
