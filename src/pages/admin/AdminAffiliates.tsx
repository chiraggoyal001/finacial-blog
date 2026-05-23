import React, { useState, useMemo } from 'react';
import { 
  Link as LinkIcon, 
  Plus, 
  Search, 
  ExternalLink, 
  MousePointer2, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Eye,
  EyeOff,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Globe,
  Bot,
  Calendar,
  Target,
  Download
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { useAffiliateLinks, useDeleteAffiliate, useUpdateAffiliate } from '@/hooks/useAffiliates';
import { useAdminAffiliates } from '@/hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import AffiliateEditor from './AffiliateEditor';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadAsCSV } from '@/lib/export';

const CATEGORY_OPTIONS = ['All Categories', 'Demat', 'Insurance', 'Mutual Funds', 'Credit Cards', 'Courses', 'Other'];

function formatClickCount(count: number): string {
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
}

export default function AdminAffiliates() {
  // We keep the old hook for stats, but it might be slow for large datasets.
  // In a real production app with 10k rows, we'd replace this with a dedicated stats RPC.
  const { data: allLinks } = useAffiliateLinks(); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useAdminAffiliates({
    page,
    limit: 20,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined
  });

  const links = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  const deleteMutation = useDeleteAffiliate();
  const updateAffiliate = useUpdateAffiliate();
  const queryClient = useQueryClient();
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusToggleTarget, setStatusToggleTarget] = useState<any>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} links?`)) {
      try {
        for (const id of Array.from(selectedIds)) {
          await deleteMutation.mutateAsync(id);
        }
        toast.success(`Deleted ${selectedIds.size} links`);
        setSelectedIds(new Set());
        await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      } catch {
        toast.error('Failed to delete some links');
      }
    }
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      // Optimistic UI update
      queryClient.setQueriesData({ queryKey: ['admin-affiliates'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((l: any) => selectedIds.has(l.id) ? { ...l, is_active: isActive } : l)
        };
      });

      for (const id of Array.from(selectedIds)) {
        await updateAffiliate.mutateAsync({ id, is_active: isActive });
      }
      toast.success(`${isActive ? 'Activated' : 'Paused'} ${selectedIds.size} links`);
      setSelectedIds(new Set());
      await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    } catch {
      toast.error('Failed to update some links');
      await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Affiliate link deleted');
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    } catch {
      toast.error('Failed to delete link');
    }
  };

  const handleToggleActive = async (link: any) => {
    const newStatus = !link.is_active;
    try {
      // Optimistic UI update
      queryClient.setQueriesData({ queryKey: ['admin-affiliates'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((l: any) => l.id === link.id ? { ...l, is_active: newStatus } : l)
        };
      });

      await updateAffiliate.mutateAsync({ id: link.id, is_active: newStatus });
      toast.success(newStatus ? 'Link activated' : 'Link deactivated');
      await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    } catch {
      toast.error('Failed to update link status');
      await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    }
  };

  const confirmStatusToggle = (link: any) => {
    setStatusToggleTarget(link);
    setShowStatusDialog(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusToggleTarget) return;
    await handleToggleActive(statusToggleTarget);
    setShowStatusDialog(false);
    setStatusToggleTarget(null);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const openEditor = (link: any = null) => {
    setEditingLink(link);
    setIsEditorOpen(true);
  };

  const openDeleteConfirm = (link: any) => {
    setDeleteTarget(link);
    setShowDeleteDialog(true);
  };

  const handleExport = () => {
    if (!links.length) return;
    downloadAsCSV(
      links.map(l => ({
        ID: l.id,
        Name: l.name,
        Category: l.category,
        URL: l.url,
        Active: l.is_active,
        Clicks: l.click_count || 0,
        Created: new Date(l.created_at).toLocaleDateString()
      })),
      'affiliate_links_export'
    );
  };

  const totalClicks = useMemo(() => {
    return (allLinks || []).reduce((sum, l) => sum + (l.click_count || 0), 0);
  }, [allLinks]);

  const activeLinks = useMemo(() => {
    return (allLinks || []).filter(l => l.is_active).length;
  }, [allLinks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage partner links and track referral performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh links">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => openEditor()}>
            <Plus className="mr-2 h-4 w-4" />
            New Affiliate Link
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allLinks?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeLinks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{(allLinks?.length || 0) - activeLinks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatClickCount(totalClicks)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or description..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedIds.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      Bulk Actions <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange(true)}><Eye className="mr-2 h-4 w-4" /> Activate Selected</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange(false)}><EyeOff className="mr-2 h-4 w-4" /> Pause Selected</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-x border-b-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-6">
                    <Checkbox 
                      checked={links.length > 0 && selectedIds.size === links.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[200px]">Partner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="w-[140px]">Rules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <LinkIcon className="h-8 w-8" />
                        <span>No affiliate links found.</span>
                        {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                          <Button variant="link" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); setPage(1); }}>
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="px-6">
                        <Checkbox 
                          checked={selectedIds.has(link.id)}
                          onCheckedChange={() => toggleSelect(link.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                            {link.logo_url ? (
                              <img src={link.logo_url} alt={`${link.name} logo`} className="h-full w-full object-contain p-1" />
                            ) : (
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{link.name}</span>
                            <div className="flex items-center gap-2">
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-1"
                              >
                                Visit <ExternalLink className="h-2 w-2" />
                              </a>
                              <button 
                                onClick={() => handleCopyLink(link.url)}
                                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <Copy className="h-2 w-2" /> Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                          {link.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MousePointer2 className="h-3.5 w-3.5 text-primary" />
                          <span className="font-bold">{formatClickCount(link.click_count || 0)}</span>
                          <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest ml-0.5">clicks</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {link.chatbot_controlled ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 text-[9px] px-1.5 py-0 gap-0.5">
                                    <Bot className="h-2.5 w-2.5" /> Chatbot
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Controlled by chatbot AI</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <>
                              {link.visibility_rules?.pages?.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 text-muted-foreground">
                                        <Globe className="h-2.5 w-2.5" /> {link.visibility_rules.pages.length}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Visible on: {link.visibility_rules.pages.join(', ')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {link.targeting_rules && Object.keys(link.targeting_rules).length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 text-muted-foreground">
                                        <Target className="h-2.5 w-2.5" /> {Object.keys(link.targeting_rules).length}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Targeting rules active</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {link.scheduling && Object.keys(link.scheduling).some(k => k !== 'timezone' && !!link.scheduling[k as keyof typeof link.scheduling]) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 text-muted-foreground">
                                        <Calendar className="h-2.5 w-2.5" /> Sch
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Scheduled visibility</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {!link.chatbot_controlled && !link.visibility_rules?.pages?.length && !link.visibility_rules?.sections?.length && !link.visibility_rules?.content_ids?.length && !link.visibility_rules?.content_categories?.length && (!link.targeting_rules || Object.keys(link.targeting_rules).length === 0) && (!link.scheduling || !Object.keys(link.scheduling).some(k => k !== 'timezone' && !!link.scheduling[k as keyof typeof link.scheduling])) && (
                                <span className="text-[10px] text-muted-foreground italic">None</span>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={() => confirmStatusToggle(link)}
                            className="data-[state=checked]:bg-green-500"
                          />
                          <span className={`text-xs font-medium ${link.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {link.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Link Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditor(link)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmStatusToggle(link)}>
                              {link.is_active ? (
                                <><EyeOff className="mr-2 h-4 w-4" /> Deactivate</>
                              ) : (
                                <><Eye className="mr-2 h-4 w-4" /> Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(link.url)}>
                              <Copy className="mr-2 h-4 w-4" /> Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(link)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3 border-x border-b">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of {totalCount} links
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground min-w-[3rem] text-center">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Edit/Create Dialog */}
      <AffiliateEditor 
        isOpen={isEditorOpen} 
        onClose={async () => {
          setIsEditorOpen(false);
          // Clear editing link after dialog closes to prevent stale data issues
          setEditingLink(null);
          await queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
        }} 
        initialData={editingLink} 
      />

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusToggleTarget?.is_active ? (
                <><EyeOff className="h-5 w-5 text-amber-500" /> Deactivate Affiliate Link</>
              ) : (
                <><Eye className="h-5 w-5 text-green-500" /> Activate Affiliate Link</>
              )}
            </DialogTitle>
            <DialogDescription>
              {statusToggleTarget?.is_active ? (
                <>Are you sure you want to deactivate <strong>{statusToggleTarget?.name}</strong>? 
                It will no longer appear on the website until reactivated.</>
              ) : (
                <>Are you sure you want to activate <strong>{statusToggleTarget?.name}</strong>? 
                It will become visible on the website according to its visibility rules.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowStatusDialog(false); setStatusToggleTarget(null); }}>
              Cancel
            </Button>
            <Button 
              variant={statusToggleTarget?.is_active ? "secondary" : "default"}
              onClick={handleConfirmStatusToggle}
              disabled={updateAffiliate.isPending}
            >
              {updateAffiliate.isPending ? 'Updating...' : statusToggleTarget?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" /> Delete Affiliate Link
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? 
              This action cannot be undone. All tracking data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}