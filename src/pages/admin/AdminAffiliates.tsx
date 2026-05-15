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
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  BarChart3,
  Globe,
  Hash,
  Bot,
  Calendar,
  Target,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import AffiliateEditor from './AffiliateEditor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ITEMS_PER_PAGE = 20;
const CATEGORY_OPTIONS = ['All Categories', 'Demat', 'Insurance', 'Mutual Funds', 'Credit Cards', 'Courses', 'Other'];

function formatClickCount(count: number): string {
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
}

export default function AdminAffiliates() {
  const { data: links, isLoading, refetch } = useAffiliateLinks();
  const deleteMutation = useDeleteAffiliate();
  const updateAffiliate = useUpdateAffiliate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const filteredLinks = useMemo(() => {
    let list = links || [];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    }
    
    if (statusFilter === 'active') {
      list = list.filter(l => l.is_active);
    } else if (statusFilter === 'paused') {
      list = list.filter(l => !l.is_active);
    }
    
    if (categoryFilter !== 'all') {
      list = list.filter(l => l.category === categoryFilter);
    }
    
    return list;
  }, [links, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLinks = filteredLinks.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Affiliate link deleted');
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete link');
    }
  };

  const handleToggleActive = async (link: any) => {
    try {
      await updateAffiliate.mutateAsync({ id: link.id, is_active: !link.is_active });
      toast.success(link.is_active ? 'Link deactivated' : 'Link activated');
    } catch {
      toast.error('Failed to update link status');
    }
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

  const totalClicks = useMemo(() => {
    return (links || []).reduce((sum, l) => sum + (l.click_count || 0), 0);
  }, [links]);

  const activeLinks = useMemo(() => {
    return (links || []).filter(l => l.is_active).length;
  }, [links]);

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
            <div className="text-2xl font-bold">{links?.length || 0}</div>
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
            <div className="text-2xl font-bold text-amber-600">{(links?.length || 0) - activeLinks}</div>
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
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
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
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                      <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <LinkIcon className="h-8 w-8" />
                        <span>No affiliate links found.</span>
                        {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                          <Button variant="link" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }}>
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLinks.map((link) => (
                    <TableRow key={link.id}>
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
                              {(!link.visibility_rules?.pages?.length && (!link.targeting_rules || Object.keys(link.targeting_rules).length === 0) && (!link.scheduling || !Object.keys(link.scheduling).some(k => k !== 'timezone' && !!link.scheduling[k as keyof typeof link.scheduling]))) && (
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
                            onCheckedChange={() => handleToggleActive(link)}
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
                            <DropdownMenuItem onClick={() => handleToggleActive(link)}>
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
        {filteredLinks.length > ITEMS_PER_PAGE && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredLinks.length)} of {filteredLinks.length} links
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

      {/* Edit/Create Dialog */}
      <AffiliateEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        initialData={editingLink} 
      />

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