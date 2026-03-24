import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

export const SUBSCRIPTION_PRICES: Record<string, number> = {
  free: 0,
  starter: 20,
  pro: 49,
  business: 99,
  enterprise: 0,
  unlimited: 0,
};

interface RevenueMetrics {
  mrr: number;
  arr: number;
  paidUsers: number;
  churnRisk: number;
  mrrGrowth: number;
}

interface PlanDistribution {
  name: string;
  users: number;
  revenue: number;
  color: string;
}

interface UserRevenue {
  id: string;
  email: string;
  plan: string;
  mrr: number;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  health: 'good' | 'at_risk' | 'churned';
  joinDate: string;
}

export const RevenueDashboard = () => {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [plans, setPlans] = useState<PlanDistribution[]>([]);
  const [users, setUsers] = useState<UserRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      // Fetch actual subscriptions and joined profiles
      const { data: subsData, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          subscription_tier,
          status,
          created_at,
          current_period_end,
          profiles:user_id (
            company_name,
            contact_person
          )
        `);
      
      if (error) throw error;

      let totalMrr = 0;
      let paidCount = 0;
      let churnRiskCount = 0;

      const planMap: Record<string, { users: number; revenue: number }> = {
        starter: { users: 0, revenue: 0 },
        pro: { users: 0, revenue: 0 },
        business: { users: 0, revenue: 0 },
      };

      const realUsers: UserRevenue[] = [];

      subsData?.forEach((sub: any) => {
        const tier = (sub.subscription_tier || 'free').toLowerCase();
        const price = SUBSCRIPTION_PRICES[tier] || 0;
        
        let health: 'good' | 'at_risk' | 'churned' = 'good';
        
        // Determine health based on status and period end
        if (sub.status === 'canceled' || sub.status === 'unpaid') {
          health = 'churned';
        } else if (sub.status === 'past_due') {
          health = 'at_risk';
          churnRiskCount++;
        }

        // Only count active/trialing paid tiers towards MRR
        if (price > 0 && (sub.status === 'active' || sub.status === 'trialing')) {
          totalMrr += price;
          paidCount++;
          
          if (planMap[tier]) {
            planMap[tier].users++;
            planMap[tier].revenue += price;
          }
        }

        // Add to user list if they are on a paid plan or have a status worth tracking
        if (tier !== 'free' || sub.status !== 'active') {
          const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
          const displayEmail = profile?.company_name || profile?.contact_person || sub.user_id.substring(0, 8);
          
          realUsers.push({
            id: sub.user_id,
            email: displayEmail,
            plan: tier,
            mrr: price,
            status: (sub.status as any) || 'active',
            health,
            joinDate: sub.created_at || new Date().toISOString()
          });
        }
      });

      setMetrics({
        mrr: totalMrr,
        arr: totalMrr * 12,
        paidUsers: paidCount,
        churnRisk: churnRiskCount,
        mrrGrowth: 0 // Cannot compute historically without a snapshots table
      });

      setPlans([
        { name: 'Starter', users: planMap.starter.users, revenue: planMap.starter.revenue, color: '#3b82f6' },
        { name: 'Pro', users: planMap.pro.users, revenue: planMap.pro.revenue, color: '#8b5cf6' },
        { name: 'Business', users: planMap.business.users, revenue: planMap.business.revenue, color: '#10b981' }
      ]);

      setUsers(realUsers.sort((a, b) => b.mrr - a.mrr));
    } catch (err) {
      console.error("Error fetching revenue data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'good': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Healthy</Badge>;
      case 'at_risk': return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">At Risk</Badge>;
      case 'churned': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Churned</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1.5 text-xs text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>;
      case 'past_due': return <span className="flex items-center gap-1.5 text-xs text-amber-500"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Past Due</span>;
      case 'canceled': return <span className="flex items-center gap-1.5 text-xs text-red-500"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Canceled</span>;
      case 'trialing': return <span className="flex items-center gap-1.5 text-xs text-blue-500"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Trialing</span>;
      default: return <span className="lowercase text-xs text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Revenue Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor MRR, plan distributions, and subscription health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-border bg-card/50">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5" /> {metrics.mrrGrowth}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{formatCurrency(metrics.mrr)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Annual Run Rate (ARR)</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{formatCurrency(metrics.arr)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-purple-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Active Paid Users</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{metrics.paidUsers}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-amber-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex items-center gap-1 text-red-500 text-sm font-medium bg-red-500/10 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5" /> 2.1%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Users at Churn Risk</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{metrics.churnRisk}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Plan Distribution Chart */}
        <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-border flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Plan Distribution</CardTitle>
            <CardDescription>MRR contribution by tier</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plans} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border bg-background p-3 shadow-xl">
                            <p className="font-medium text-foreground">{payload[0].payload.name}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-emerald-500 font-medium">{formatCurrency(payload[0].value as number)} MRR</p>
                              <p className="text-xs text-muted-foreground">{payload[0].payload.users} Active Users</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {plans.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 space-y-3">
              {plans.map(plan => (
                <div key={plan.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="font-medium text-foreground">{plan.name}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">{formatCurrency(plan.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Per-User Table */}
        <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent User Revenue</CardTitle>
              <CardDescription>Per-user billing status and health</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8">View All</Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[350px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">MRR</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">Joined {new Date(user.joinDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-background capitalize">{user.plan}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-foreground">
                        {formatCurrency(user.mrr)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {getHealthBadge(user.health)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueDashboard;
