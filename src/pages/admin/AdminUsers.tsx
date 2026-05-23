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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  CircleDot,
  UserCheck,
  UserX,
  LogIn,
  Globe,
  Baby,
  Timer,
  Heart,
  Download,
  CheckSquare
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';

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

function getDateDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [onboardingFilter, setOnboardingFilter] = useState<string>('all');
  const [signupMethodFilter, setSignupMethodFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');

  const { data: profilesResponse, isLoading, refetch } = useProfiles({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery,
    roleFilter,
    subFilter,
    onboardingFilter,
    signupMethodFilter,
    regionFilter,
    professionFilter,
    ageGroupFilter,
    activityFilter,
    interestFilter
  });
  
  const users = profilesResponse?.data || [];
  const totalUsers = profilesResponse?.totalCount || 0;

  const updateSubscription = useUpdateUserSubscription();
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<ExtendedProfile | null>(null);
  const [showToggleSubDialog, setShowToggleSubDialog] = useState(false);
  const [toggleSubTarget, setToggleSubTarget] = useState<ExtendedProfile | null>(null);

  // We keep some client-derived options, but since we are paginating,
  // we could optionally use the full list or predefined constants.
  // For safety, we keep them derived from the current page's users
  // or you could replace them with standard arrays if you want all options available.
  const uniqueRegions = useMemo(() => {
    const regions = new Set(users.map(u => u.region).filter(Boolean) as string[]);
    return Array.from(regions).sort();
  }, [users]);

  const uniqueProfessions = useMemo(() => {
    const professions = new Set(users.map(u => u.profession).filter(Boolean) as string[]);
    return Array.from(professions).sort();
  }, [users]);

  const uniqueSignupMethods = useMemo(() => {
    const methods = new Set(users.map(u => u.signup_method).filter(Boolean) as string[]);
    return Array.from(methods).sort();
  }, [users]);

  const uniqueInterests = useMemo(() => {
    const interests = new Set<string>();
    users.forEach(u => {
      if (u.interests && Array.isArray(u.interests)) {
        u.interests.forEach(i => interests.add(i));
      }
    });
    return Array.from(interests).sort();
  }, [users]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (onboardingFilter !== 'all') count++;
    if (signupMethodFilter !== 'all') count++;
    if (regionFilter !== 'all') count++;
    if (professionFilter !== 'all') count++;
    if (ageGroupFilter !== 'all') count++;
    if (activityFilter !== 'all') count++;
    if (interestFilter !== 'all') count++;
    return count;
  }, [onboardingFilter, signupMethodFilter, regionFilter, professionFilter, ageGroupFilter, activityFilter, interestFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, id]);
    } else {
      setSelectedUserIds(prev => prev.filter(userId => userId !== id));
    }
  };

  const handleExportCSV = () => {
    const dataToExport = selectedUserIds.length > 0 
      ? users.filter(u => selectedUserIds.includes(u.id))
      : users;
    
    const formattedData = dataToExport.map(u => ({
      ID: u.id,
      FirstName: u.first_name,
      LastName: u.last_name,
      Email: u.email,
      Role: u.role,
      IsSubscribed: u.is_subscribed,
      OnboardingCompleted: u.onboarding_completed,
      SignupMethod: u.signup_method,
      Region: u.region || '',
      Profession: u.profession || '',
      Age: u.age || '',
      TotalActivities: u.total_activities,
      LastActive: u.last_active_at || 'Never',
      Joined: u.created_at
    }));
    
    downloadAsCSV(formattedData, 'users_export');
  };

  const totalPages = Math.max(1, Math.ceil(totalUsers / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

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

  const clearAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setSubFilter('all');
    setOnboardingFilter('all');
    setSignupMethodFilter('all');
    setRegionFilter('all');
    setProfessionFilter('all');
    setAgeGroupFilter('all');
    setActivityFilter('all');
    setInterestFilter('all');
    setCurrentPage(1);
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

  const getActivityLabel = (user: ExtendedProfile): string => {
    if (!user.last_active_at) return 'Never';
    const now = new Date();
    const lastActive = new Date(user.last_active_at);
    const diffDays = (now.getTime() - lastActive.getTime()) / 86400000;
    if (diffDays <= 7) return 'Active (7d)';
    if (diffDays <= 30) return 'Active (30d)';
    if (diffDays <= 90) return 'Active (90d)';
    return 'Inactive (90d+)';
  };

  const getActivityColor = (user: ExtendedProfile): string => {
    if (!user.last_active_at) return 'bg-gray-100 text-gray-800 border-gray-200';
    const now = new Date();
    const lastActive = new Date(user.last_active_at);
    const diffDays = (now.getTime() - lastActive.getTime()) / 86400000;
    if (diffDays <= 7) return 'bg-green-100 text-green-800 border-green-200';
    if (diffDays <= 30) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (diffDays <= 90) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
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
          {selectedUserIds.length > 0 && (
            <Badge variant="secondary" className="h-10 px-4 bg-muted">
              {selectedUserIds.length} Selected
            </Badge>
          )}
          <Button variant="outline" onClick={handleExportCSV} title="Export CSV">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Badge variant="outline" className="h-10 px-4">
            <Users className="mr-2 h-4 w-4" />
            {totalUsers} Total Users
          </Badge>
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh users">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            {/* Primary Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, region, profession, interests..."
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
                <Button
                  variant={showAdvancedFilters ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="h-5 min-w-5 px-1.5 text-[10px] ml-0.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                  {showAdvancedFilters ? (
                    <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters Section */}
            {showAdvancedFilters && (
              <div className="border rounded-lg p-4 bg-muted/30 mt-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Advanced Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({activeFilterCount} active)
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearAllFilters}>
                      <X className="h-3 w-3" /> Clear All
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {/* Onboarding Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> Onboarding
                    </label>
                    <Select value={onboardingFilter} onValueChange={(v) => { setOnboardingFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Signup Method Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <LogIn className="h-3 w-3" /> Signup Method
                    </label>
                    <Select value={signupMethodFilter} onValueChange={(v) => { setSignupMethodFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueSignupMethods.map(method => (
                          <SelectItem key={method} value={method} className="capitalize">
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Region
                    </label>
                    <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueRegions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                        {uniqueRegions.length === 0 && (
                          <SelectItem value="__none__" disabled>No regions</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Profession Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Profession
                    </label>
                    <Select value={professionFilter} onValueChange={(v) => { setProfessionFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueProfessions.map(profession => (
                          <SelectItem key={profession} value={profession}>
                            {profession}
                          </SelectItem>
                        ))}
                        {uniqueProfessions.length === 0 && (
                          <SelectItem value="__none__" disabled>No professions</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Group Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Baby className="h-3 w-3" /> Age Group
                    </label>
                    <Select value={ageGroupFilter} onValueChange={(v) => { setAgeGroupFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="18-25">18 - 25</SelectItem>
                        <SelectItem value="26-35">26 - 35</SelectItem>
                        <SelectItem value="36-50">36 - 50</SelectItem>
                        <SelectItem value="50+">50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activity Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Timer className="h-3 w-3" /> Activity
                    </label>
                    <Select value={activityFilter} onValueChange={(v) => { setActivityFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active-7">Active (last 7 days)</SelectItem>
                        <SelectItem value="active-30">Active (last 30 days)</SelectItem>
                        <SelectItem value="active-90">Active (last 90 days)</SelectItem>
                        <SelectItem value="inactive-90">Inactive (90d+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interest Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Interests
                    </label>
                    <Select value={interestFilter} onValueChange={(v) => { setInterestFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Interests</SelectItem>
                        {uniqueInterests.map(interest => (
                          <SelectItem key={interest} value={interest}>
                            {interest}
                          </SelectItem>
                        ))}
                        {uniqueInterests.length === 0 && (
                          <SelectItem value="__none__" disabled>No interests</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Filter Badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground mr-1">Filters:</span>
              {onboardingFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <UserCheck className="h-3 w-3" />
                  Onboarding: {onboardingFilter}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setOnboardingFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
              {signupMethodFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1 capitalize">
                  <LogIn className="h-3 w-3" />
                  Signup: {signupMethodFilter}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setSignupMethodFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
              {regionFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <MapPin className="h-3 w-3" />
                  Region: {regionFilter}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setRegionFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
              {professionFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Briefcase className="h-3 w-3" />
                  Profession: {professionFilter}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setProfessionFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
              {ageGroupFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Baby className="h-3 w-3" />
                  Age: {ageGroupFilter}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setAgeGroupFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
              {activityFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Timer className="h-3 w-3" />
                  {activityFilter === 'active-7' && 'Active (7d)'}
                  {activityFilter === 'active-30' && 'Active (30d)'}
                  {activityFilter === 'active-90' && 'Active (90d)'}
                  {activityFilter === 'inactive-90' && 'Inactive (90d+)'}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setActivityFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
              {interestFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Heart className="h-3 w-3" />
                  Interest: {interestFilter}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => { setInterestFilter('all'); setCurrentPage(1); }} />
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                    />
                  </TableHead>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Activities</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <span>No users found matching your filters.</span>
                        <Button variant="link" size="sm" onClick={clearAllFilters}>
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(c) => handleSelectUser(user.id, !!c)}
                        />
                      </TableCell>
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
                        <Badge variant="outline" className={cn("text-[10px]", getActivityColor(user))}>
                          <CircleDot className="mr-1 h-3 w-3" />
                          {getActivityLabel(user)}
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
        {totalUsers > ITEMS_PER_PAGE && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalUsers)} of {totalUsers} users
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
                    <Badge variant="outline" className={cn("text-[10px]", getActivityColor(selectedUser))}>
                      <CircleDot className="mr-1 h-3 w-3" />
                      {getActivityLabel(selectedUser)}
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