import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from '@supabase/supabase-js';
import { supabaseApi } from '@/lib/supabaseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Search, 
  Download, 
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Filter,
  CheckSquare,
  ShieldCheck,
  Shield,
  User,
  Users,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
  role?: 'admin' | 'duty' | 'user';
}

interface UserManagementProps {
  session: Session;
  allUsers: AccessGrantWithProfile[];
  onRefresh: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2 }
  }
};

export const UserManagement = ({ session, allUsers, onRefresh }: UserManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'revoked'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'duty' | 'user'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Fetch user roles on mount
  const fetchUserRoles = useCallback(async () => {
    try {
      const rolesData = await supabaseApi.get('user_roles?select=user_id,role', session.access_token) as { user_id: string; role: string }[];
      const rolesMap = new Map<string, string>();
      if (Array.isArray(rolesData)) {
        rolesData.forEach((r) => {
          rolesMap.set(r.user_id, r.role);
        });
      }
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, [session.access_token]);

  // Load roles when component mounts or users change
  useEffect(() => {
    fetchUserRoles();
  }, [allUsers.length, fetchUserRoles]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        (user.profiles?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.profiles?.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.user_email?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'pending' && !user.is_active && !user.granted_at) ||
        (statusFilter === 'revoked' && !user.is_active && user.granted_at);

      const userRole = userRoles.get(user.user_id) || 'user';
      const matchesRole = 
        roleFilter === 'all' || roleFilter === userRole;
      
      return (matchesSearch || !searchQuery) && matchesStatus && matchesRole;
    });
  }, [allUsers, searchQuery, statusFilter, roleFilter, userRoles]);

  // Group users by role for organized display
  const groupedUsers = useMemo(() => {
    const groups = {
      admin: [] as typeof filteredUsers,
      duty: [] as typeof filteredUsers,
      user: [] as typeof filteredUsers,
    };
    
    filteredUsers.forEach(user => {
      const role = (userRoles.get(user.user_id) || 'user') as keyof typeof groups;
      groups[role].push(user);
    });
    
    return groups;
  }, [filteredUsers, userRoles]);

  // Role stats
  const roleStats = useMemo(() => ({
    admin: allUsers.filter(u => userRoles.get(u.user_id) === 'admin').length,
    duty: allUsers.filter(u => userRoles.get(u.user_id) === 'duty').length,
    user: allUsers.filter(u => !userRoles.get(u.user_id) || userRoles.get(u.user_id) === 'user').length,
  }), [allUsers, userRoles]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleActivate = async (userId: string) => {
    try {
      await supabaseApi.patch(
        `access_grants?user_id=eq.${userId}`,
        session.access_token,
        { is_active: true, granted_at: new Date().toISOString() }
      );
      toast.success('User activated');
      onRefresh();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await supabaseApi.patch(
        `access_grants?user_id=eq.${userId}`,
        session.access_token,
        { is_active: false }
      );
      toast.success('User deactivated');
      onRefresh();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  // Handle role change using secure RPC
  const handleRoleChange = async (userId: string, newRole: 'admin' | 'duty' | 'user') => {
    setChangingRole(userId);
    try {
      // Use the secure RPC function
      const { error } = await supabase.rpc('manage_user_role', {
        p_target_user_id: userId,
        p_new_role: newRole
      });

      if (error) {
        console.error('RPC error:', error);
        if (error.message.includes('Only admins')) {
          toast.error('Permission denied: Only admins can change roles');
        } else if (error.message.includes('Cannot demote yourself')) {
          toast.error('Cannot demote yourself');
        } else {
          toast.error('Failed to change role');
        }
        return;
      }
      
      // Update local state
      setUserRoles(prev => new Map(prev).set(userId, newRole));
      toast.success(`Role changed to ${newRole}`);
      onRefresh();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
    } finally {
      setChangingRole(null);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) return;
    
    try {
      const userIds = Array.from(selectedUsers);
      
      if (action === 'activate') {
        await Promise.all(
          userIds.map(userId =>
            supabaseApi.patch(
              `access_grants?user_id=eq.${userId}`,
              session.access_token,
              { is_active: true, granted_at: new Date().toISOString() }
            )
          )
        );
      } else if (action === 'deactivate') {
        await Promise.all(
          userIds.map(userId =>
            supabaseApi.patch(
              `access_grants?user_id=eq.${userId}`,
              session.access_token,
              { is_active: false }
            )
          )
        );
      } else if (action === 'delete') {
        await Promise.all(
          userIds.map(userId =>
            supabaseApi.delete(
              `access_grants?user_id=eq.${userId}`,
              session.access_token
            )
          )
        );
      }
      
      toast.success(`${action === 'delete' ? 'Deleted' : action === 'activate' ? 'Activated' : 'Deactivated'} ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      onRefresh();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Bulk action failed');
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Company', 'Contact', 'Status', 'Usage', 'Limit', 'Created'],
      ...filteredUsers.map(u => [
        u.profiles?.company_name || '',
        u.profiles?.contact_person || '',
        u.is_active ? 'Active' : 'Pending',
        u.current_month_usage || 0,
        u.monthly_limit || 'Unlimited',
        format(new Date(u.created_at), 'yyyy-MM-dd'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render a single user card
  const renderUserCard = (user: AccessGrantWithProfile) => {
    const role = userRoles.get(user.user_id) || 'user';
    const roleConfig = {
      admin: { label: 'Admin', variant: 'destructive' as const, icon: ShieldCheck },
      duty: { label: 'Duty', variant: 'default' as const, icon: Shield },
      user: { label: 'User', variant: 'secondary' as const, icon: User },
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const RoleIcon = config.icon;
    const isChangingRole = changingRole === user.user_id;

    return (
      <motion.div
        key={user.id}
        variants={itemVariants}
        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
          selectedUsers.has(user.user_id) 
            ? 'bg-primary/5 border-primary/20' 
            : 'bg-card hover:bg-muted/50 border-border/50'
        }`}
      >
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={selectedUsers.has(user.user_id)}
            onChange={() => toggleUserSelection(user.user_id)}
            className="w-4 h-4 rounded border-muted-foreground/30"
          />
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {(user.profiles?.company_name || user.user_email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {user.profiles?.company_name || user.profiles?.contact_person || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.user_email || format(new Date(user.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Badge - Clickable dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 gap-1.5"
                disabled={isChangingRole}
              >
                {isChangingRole ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RoleIcon className="w-3 h-3" />
                )}
                <span className="text-xs">{config.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Change Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleRoleChange(user.user_id, 'user')}
                disabled={role === 'user'}
              >
                <User className="w-4 h-4 mr-2" />
                User
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleRoleChange(user.user_id, 'duty')}
                disabled={role === 'duty'}
              >
                <Shield className="w-4 h-4 mr-2" />
                Duty
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleRoleChange(user.user_id, 'admin')}
                disabled={role === 'admin'}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Badge */}
          <Badge variant={user.is_active ? 'outline' : 'secondary'} className="text-xs">
            {user.is_active ? 'Active' : 'Pending'}
          </Badge>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.is_active ? (
                <DropdownMenuItem onClick={() => handleDeactivate(user.user_id)}>
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleActivate(user.user_id)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>{filteredUsers.length} users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedUsers.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedUsers.size} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate All
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" size="sm" onClick={exportUsers}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role Stats Bar */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={roleFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('all')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              All ({allUsers.length})
            </Button>
            <Button
              variant={roleFilter === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('admin')}
              className="gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Admins ({roleStats.admin})
            </Button>
            <Button
              variant={roleFilter === 'duty' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('duty')}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Duty ({roleStats.duty})
            </Button>
            <Button
              variant={roleFilter === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('user')}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              Users ({roleStats.user})
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? 'All Status' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('revoked')}>Revoked</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User List */}
          <ScrollArea className="h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={roleFilter}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users found
                  </p>
                ) : (
                  // Render grouped sections when showing all, otherwise flat list
                  roleFilter === 'all' ? (
                    <>
                      {/* Admins Section */}
                      {groupedUsers.admin.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-2">
                            <ShieldCheck className="w-4 h-4 text-destructive" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Admins ({groupedUsers.admin.length})
                            </span>
                          </div>
                          {groupedUsers.admin.map(user => renderUserCard(user))}
                        </div>
                      )}
                      
                      {/* Duty Section */}
                      {groupedUsers.duty.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Duty ({groupedUsers.duty.length})
                            </span>
                          </div>
                          {groupedUsers.duty.map(user => renderUserCard(user))}
                        </div>
                      )}
                      
                      {/* Users Section */}
                      {groupedUsers.user.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Users ({groupedUsers.user.length})
                            </span>
                          </div>
                          {groupedUsers.user.map(user => renderUserCard(user))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Flat list when filtered by role
                    filteredUsers.map(user => renderUserCard(user))
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};
