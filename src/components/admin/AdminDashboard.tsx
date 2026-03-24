import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  Clock, 
  MessageSquare,
  TrendingUp,
  Activity,
  AlertTriangle,
  AlertCircle,
  ArrowUp,
  LineChart
} from 'lucide-react';
import { format, subDays, isBefore } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEffect, useState } from 'react';

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
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  todayMessages: number;
  weeklyGrowth: number;
}

interface AdminDashboardProps {
  systemMetrics: SystemMetrics;
  allUsers: AccessGrantWithProfile[];
}

// Animated counter component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{displayValue}</span>;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export const AdminDashboard = ({ systemMetrics, allUsers }: AdminDashboardProps) => {
  const [growthView, setGrowthView] = useState<'weekly' | 'cumulative'>('weekly');
  const metrics = [
    { 
      label: 'Total Users', 
      value: systemMetrics.totalUsers, 
      icon: Users, 
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10 ring-1 ring-blue-500/20',
      glow: 'shadow-blue-500/20'
    },
    { 
      label: 'Active Users', 
      value: systemMetrics.activeUsers, 
      icon: UserCheck, 
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
      glow: 'shadow-emerald-500/20'
    },
    { 
      label: 'Pending', 
      value: systemMetrics.pendingUsers, 
      icon: Clock, 
      gradient: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10 ring-1 ring-amber-500/20',
      glow: 'shadow-amber-500/20'
    },
    { 
      label: 'Messages Today', 
      value: systemMetrics.todayMessages, 
      icon: MessageSquare, 
      gradient: 'from-violet-500/20 to-violet-600/5',
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10 ring-1 ring-violet-500/20',
      glow: 'shadow-violet-500/20'
    },
  ];

  const recentUsers = allUsers.slice(0, 10);

  // Generate mock growth data (in a real app, this would be grouped by the backend)
  const growthData = Array.from({ length: 12 }).map((_, i) => {
    const isCumulative = growthView === 'cumulative';
    const baseVal = 10 + Math.floor(i * 2.5) + Math.floor(Math.random() * 15);
    return {
      name: `Wk ${i + 1}`,
      signups: isCumulative ? baseVal * (i + 1) : baseVal,
    };
  });

  // Calculate Churn Alerts (inactive > 14 days)
  // Since we don't have a reliable last_login in this mock payload, we use created_at as a proxy
  const fourteenDaysAgo = subDays(new Date(), 14);
  const churnAlerts = allUsers.filter(u => 
    u.is_active && isBefore(new Date(u.created_at), fourteenDaysAgo)
  ).slice(0, 4);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Premium Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div 
              key={metric.label} 
              variants={itemVariants}
            >
              <Card className={`relative overflow-hidden border border-border/50 shadow-lg ${metric.glow} bg-card/80 backdrop-blur-xl cursor-default`}>
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
                
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_70%)]" />
                
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                      <p className="text-3xl font-bold tracking-tight">
                        <AnimatedCounter value={metric.value} />
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-2xl ${metric.iconBg}`}>
                      <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Trend indicator */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/30">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Updated just now</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: User Growth Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="relative overflow-hidden border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                  <LineChart className="w-4 h-4 text-blue-500" />
                </div>
                User Growth
              </CardTitle>
              <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                <button
                  onClick={() => setGrowthView('weekly')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    growthView === 'weekly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setGrowthView('cumulative')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    growthView === 'cumulative' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cumulative
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end pt-4">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-3xl font-bold">{growthView === 'cumulative' ? '1,248' : '+24%'}</h3>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 font-normal">
                  <ArrowUp className="w-3 h-3" /> WoW Growth
                </Badge>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-border bg-background p-3 shadow-xl">
                              <p className="font-medium text-foreground">{payload[0].payload.name}</p>
                              <p className="text-sm text-blue-500 font-medium mt-1">{payload[0].value} Signups</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="signups" radius={[4, 4, 0, 0]}>
                      {growthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={growthView === 'cumulative' ? '#3b82f6' : '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Col: Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="relative overflow-hidden border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl h-full flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-2">
                {recentUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-background">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                              {(user.profiles?.company_name || user.profiles?.contact_person || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          {user.is_active && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-card" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {user.profiles?.company_name || user.profiles?.contact_person || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(user.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={user.is_active ? 'default' : 'secondary'}
                        className={`text-xs ${
                          user.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
      </div>

      {/* Churn Alerts Panel */}
      <motion.div variants={itemVariants}>
        <Card className="border border-red-500/20 bg-red-500/5 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Churn Risk Alerts
            </CardTitle>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-normal">
              14+ Days Inactive
            </Badge>
          </CardHeader>
          <CardContent>
            {churnAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts are currently flagged for high churn risk.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {churnAlerts.map(user => (
                  <div key={user.id} className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm truncate pr-2">
                        {user.profiles?.company_name || user.user_email || 'Unknown User'}
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase bg-muted/50">Pro</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-auto">
                      <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Last active 18 days ago</p>
                    </div>
                    <button className="text-xs text-primary font-medium hover:underline text-left mt-1">
                      Send Re-engagement Email &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
