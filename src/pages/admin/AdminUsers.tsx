import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Calendar, 
  Shield, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  Activity,
  User as UserIcon,
  CreditCard,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Briefcase,
  Zap,
  Star,
  GraduationCap,
  AlertTriangle,
  UserCog,
  RefreshCw,
  Eye,
  X,
  Award,
  BookOpen,
  Hash,
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useProfiles, useUpdateUserSubscription, useUpdateUserRole, useSuspendUser, ExtendedProfile } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 25;

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useProfiles();
  const updateSubscription = useUpdateUserSubscription();
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<ExtendedProfile | null>(null);
  const [showToggleSubDialog, setShowToggleSubDialog] = useState(false);
  const [toggleSubTarget, setToggleSubTarget] = useState<ExtendedProfile | null>(null);

  const filteredUsers = useMemo(() => {
    let list = users || [];
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        u.email.toLowerCase().includes(q) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.region?.toLowerCase().includes(q) ||
        u.profession?.toLowerCase().includes(q)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }
    
    // Subscription filter
    if (subFilter === 'subscribed') {
      list = list.filter(u => u.is_subscribed);
    } else if (subFilter === 'free') {
      list = list.filter(u => !u.is_subscribed);
    }
    
    return list;
  }, [users, searchQuery, roleFilter, subFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const handleToggleSubscription = async () => {
    if (!toggleSubTarget) return;
    try {
      await updateSubscription.mutateAsync({ 
        userId: toggleSubTarget.id, 
        isSubscribed: !toggleSubTarget.is_subscribed 
      });
      toast.success(toggleSubTarget.is_subscribed ? "User unsubscribed" : "User upgraded to Pro");
      setShowToggleSubDialog(false);
      setToggleSubTarget(null);
    } catch (error) {
      toast.error("Failed to update subscription status");
    }
  };

  const handleRoleChange = async (user: ExtendedProfile, newRole: 'admin' | 'user') => {
    try {
      await updateRole.mutateAsync({ userId: user.id, newRole });
    } catch (error) {
      // Error toast is handled in the mutation
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    try {
      await suspendUser.mutateAsync({ userId: suspendTarget.id, suspend: true });
      toast.success('User account suspended');
      setShowSuspendDialog(false);
      setSuspendTarget(null);
    } catch (error) {
      toast.error('Failed to suspend account');
    }
  };

  const getOnboardingColor = (user: ExtendedProfile) => {
    if (user.onboarding_completed) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const getInterestBadges = (user: ExtendedProfile) => {
    if (!user.interests || user.interests.length === 0) return null;
    return user.interests.slice(0, 3).map((interest, i) => (
      <Badge key={i} variant="outline" className="text-[10px] mr-1 mb-1">
        {interest}
      </Badge>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your community, roles, and subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-10 px-4">
            <Users className="mr-2 h-4 w-4" />
            {users?.length || 0} Total Users
          </Badge>
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh users">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, region..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={subFilter} onValueChange={(v) => { setSubFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="subscribed">Subscribed (Pro)</SelectItem>
                  <SelectItem value="free">Free Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Activities</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <span>No users found matching your filters.</span>
                        <Button variant="link" size="sm" onClick={() => { setSearchQuery(''); setRoleFilter('all'); setSubFilter('all'); }}>
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}'s avatar`} className="h-full w-full object-cover" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="capitalize">
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => { setToggleSubTarget(user); setShowToggleSubDialog(true); }}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          {user.is_subscribed ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Pro
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 h-3 w-3" /> Free
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", getOnboardingColor(user))}>
                          {user.onboarding_completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.total_activities || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {getRelativeTime(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setToggleSubTarget(user); setShowToggleSubDialog(true); }}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              {user.is_subscribed ? 'Downgrade to Free' : 'Upgrade to Pro'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role === 'admin' ? (
                              <DropdownMenuItem onClick={() => handleRoleChange(user, 'user')}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRoleChange(user, 'admin')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => { setSuspendTarget(user); setShowSuspendDialog(true); }}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Pagination Footer */}
        {filteredUsers.length > ITEMS_PER_PAGE && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground min-w-[3rem] text-center">
                {safeCurrentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <SheetContent className="sm:max-w-md">
          {selectedUser && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-lg truncate">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </SheetTitle>
                    <SheetDescription className="truncate">{selectedUser.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-12rem)] pr-4 mt-6">
                <div className="space-y-6">
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={selectedUser.role === 'admin' ? 'default' : 'outline'} className="capitalize">
                      <Shield className="mr-1 h-3 w-3" /> {selectedUser.role || 'user'}
                    </Badge>
                    {selectedUser.is_subscribed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Star className="mr-1 h-3 w-3" /> Pro Member
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" /> Free Tier
                      </Badge>
                    )}
                    <Badge variant="outline" className={getOnboardingColor(selectedUser)}>
                      Onboarding: {selectedUser.onboarding_completed ? 'Complete' : 'Pending'}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Profile Info */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" /> Profile Info
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedUser.age && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Age</p>
                          <p className="text-sm flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {selectedUser.age}</p>
                        </div>
                      )}
                      {selectedUser.region && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Region</p>
                          <p className="text-sm flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {selectedUser.region}</p>
                        </div>
                      )}
                      {selectedUser.profession && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Profession</p>
                          <p className="text-sm flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> {selectedUser.profession}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">XP</p>
                        <p className="text-sm flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" /> {selectedUser.xp || 0}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Interests */}
                  {selectedUser.interests && selectedUser.interests.length > 0 && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" /> Interests
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.interests.map((interest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Engagement Stats */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" /> Engagement
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Activities</p>
                        <p className="text-sm font-semibold">{selectedUser.total_activities}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Sessions</p>
                        <p className="text-sm font-semibold">{selectedUser.total_sessions}</p>
                      </div>
                    </div>
                    {selectedUser.last_active_at && (
                      <div className="mt-3 space-y-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Last Active</p>
                        <p className="text-sm flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {getRelativeTime(selectedUser.last_active_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Account Info */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" /> Account Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Signup Method</span>
                        <span className="font-medium capitalize">{selectedUser.signup_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined</span>
                        <span className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs text-muted-foreground truncate ml-4">{selectedUser.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog: Toggle Subscription */}
      <Dialog open={showToggleSubDialog} onOpenChange={setShowToggleSubDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {toggleSubTarget?.is_subscribed ? 'Downgrade to Free' : 'Upgrade to Pro'}
            </DialogTitle>
            <DialogDescription>
              {toggleSubTarget?.is_subscribed 
                ? `Remove Pro subscription from ${toggleSubTarget?.first_name} ${toggleSubTarget?.last_name}?`
                : `Upgrade ${toggleSubTarget?.first_name} ${toggleSubTarget?.last_name} to Pro membership?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowToggleSubDialog(false)}>Cancel</Button>
            <Button 
              variant={toggleSubTarget?.is_subscribed ? "secondary" : "default"}
              onClick={handleToggleSubscription}
              disabled={updateSubscription.isPending}
            >
              {updateSubscription.isPending ? 'Updating...' : toggleSubTarget?.is_subscribed ? 'Downgrade' : 'Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Suspend */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Suspend Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {suspendTarget?.first_name} {suspendTarget?.last_name}?
              They will lose access to the platform. This action can be reversed by re-assigning a role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspendUser.isPending}
            >
              {suspendUser.isPending ? 'Suspending...' : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}