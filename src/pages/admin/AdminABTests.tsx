import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Square, Trash2, Search, MoreHorizontal, FlaskConical, TrendingUp, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCreateABTest, useUpdateABTest, useDeleteABTest } from '@/hooks/useABTesting';
import { useAdminABTests } from '@/hooks/useAdmin';
import { downloadAsCSV } from '@/lib/export';
import { useQueryClient } from '@tanstack/react-query';
import type { ABTest } from '@/lib/types';

const STATUS_BADGES = {
  draft: { variant: 'secondary' as const, label: 'Draft', icon: Square },
  running: { variant: 'default' as const, label: 'Running', icon: Play },
  paused: { variant: 'outline' as const, label: 'Paused', icon: Pause },
  completed: { variant: 'outline' as const, label: 'Completed', icon: TrendingUp },
};

export default function AdminABTests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState<{ name: string; description: string; test_type: 'cta' | 'avatar' | 'mascot' | 'layout' }>({ name: '', description: '', test_type: 'cta' });

  const { data, isLoading, refetch } = useAdminABTests({
    page,
    limit: 25,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const tests = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 25));

  const createMutation = useCreateABTest();
  const updateMutation = useUpdateABTest();
  const deleteMutation = useDeleteABTest();

  const toggleSelectAll = () => {
    if (selectedIds.size === tests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tests.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...newTest,
        status: 'draft',
        start_date: null,
        end_date: null,
        created_by: '',
      });
      toast.success('A/B Test created');
      setIsCreateDialogOpen(false);
      setNewTest({ name: '', description: '', test_type: 'cta' });
      refetch();
    } catch (error) {
      toast.error('Failed to create test');
    }
  };

  const handleStatusChange = async (test: ABTest, newStatus: string) => {
    try {
      const updates: Partial<ABTest> = { status: newStatus as any };
      if (newStatus === 'running' && !test.start_date) {
        updates.start_date = new Date().toISOString();
      }
      if (newStatus === 'completed' && !test.end_date) {
        updates.end_date = new Date().toISOString();
      }
      await updateMutation.mutateAsync({ id: test.id, ...updates });
      
      // Fix cache invalidation UI desync
      queryClient.invalidateQueries({ queryKey: ['admin-ab-tests'] });
      refetch();
      toast.success(`Test ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of Array.from(selectedIds)) {
        const test = tests.find(t => t.id === id);
        if (!test) continue;
        const updates: Partial<ABTest> = { status: newStatus as any };
        if (newStatus === 'running' && !test.start_date) {
          updates.start_date = new Date().toISOString();
        }
        if (newStatus === 'completed' && !test.end_date) {
          updates.end_date = new Date().toISOString();
        }
        await updateMutation.mutateAsync({ id, ...updates });
      }
      toast.success(`Updated ${selectedIds.size} tests to ${newStatus}`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-ab-tests'] });
      refetch();
    } catch {
      toast.error('Failed to update some tests');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} tests?`)) {
      try {
        for (const id of Array.from(selectedIds)) {
          await deleteMutation.mutateAsync(id);
        }
        toast.success(`Deleted ${selectedIds.size} tests`);
        setSelectedIds(new Set());
        refetch();
      } catch {
        toast.error('Failed to delete some tests');
      }
    }
  };

  const handleExport = () => {
    if (!tests.length) return;
    downloadAsCSV(
      tests.map(t => ({
        ID: t.id,
        Name: t.name,
        Type: t.test_type,
        Status: t.status,
        Created: new Date(t.created_at).toLocaleDateString(),
        Started: t.start_date ? new Date(t.start_date).toLocaleDateString() : 'N/A',
        Ended: t.end_date ? new Date(t.end_date).toLocaleDateString() : 'N/A'
      })),
      'ab_tests_export'
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Test deleted');
      setDeleteConfirmId(null);
      refetch();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground mt-1">Manage experiments for CTAs, avatars, and mascots</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Test</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>Set up a new experiment</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input value={newTest.name} onChange={(e) => setNewTest({ ...newTest, name: e.target.value })} placeholder="e.g., Homepage CTA Test" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newTest.description} onChange={(e) => setNewTest({ ...newTest, description: e.target.value })} placeholder="What are you testing?" />
              </div>
              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select value={newTest.test_type} onValueChange={(v) => setNewTest({ ...newTest, test_type: v as 'cta' | 'avatar' | 'mascot' | 'layout' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cta">Call-to-Action</SelectItem>
                    <SelectItem value="avatar">Avatar</SelectItem>
                    <SelectItem value="mascot">Mascot</SelectItem>
                    <SelectItem value="layout">Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Test</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('running')}><Play className="mr-2 h-4 w-4" /> Start Selected</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('paused')}><Pause className="mr-2 h-4 w-4" /> Pause Selected</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('completed')}><TrendingUp className="mr-2 h-4 w-4" /> Complete Selected</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-6">
                  <Checkbox 
                    checked={tests.length > 0 && selectedIds.size === tests.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-muted-foreground">No A/B tests found</p>
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => {
                  const status = STATUS_BADGES[test.status as keyof typeof STATUS_BADGES];
                  const StatusIcon = status?.icon || FlaskConical;
                  return (
                    <TableRow key={test.id}>
                      <TableCell className="px-6">
                        <Checkbox 
                          checked={selectedIds.has(test.id)}
                          onCheckedChange={() => toggleSelect(test.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{test.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">
                              {test.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{test.test_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status?.variant || 'outline'}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status?.label || test.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground flex flex-col gap-1">
                          <span>Created: {new Date(test.created_at).toLocaleDateString()}</span>
                          {test.start_date && <span>Started: {new Date(test.start_date).toLocaleDateString()}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/ab-tests/${test.id}`)}>
                              Edit Test
                            </DropdownMenuItem>
                            {test.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(test, 'running')}><Play className="mr-2 h-4 w-4" />Start</DropdownMenuItem>
                            )}
                            {test.status === 'running' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(test, 'paused')}><Pause className="mr-2 h-4 w-4" />Pause</DropdownMenuItem>
                            )}
                            {test.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(test, 'running')}><Play className="mr-2 h-4 w-4" />Resume</DropdownMenuItem>
                            )}
                            {(test.status === 'running' || test.status === 'paused') && (
                              <DropdownMenuItem onClick={() => handleStatusChange(test, 'completed')}><TrendingUp className="mr-2 h-4 w-4" />Complete</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteConfirmId(test.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, totalCount)} of {totalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the test and all its variants/assignments.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
