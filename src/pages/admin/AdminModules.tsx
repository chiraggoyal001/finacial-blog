import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, MoreHorizontal, BookOpen, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDeleteModule, useUpdateModule } from '@/hooks/useContent';
import { useAdminModules } from '@/hooks/useAdmin';
import { downloadAsCSV } from '@/lib/export';
import type { DbModule } from '@/lib/types';

export default function AdminModules() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useAdminModules({
    page,
    limit: 25,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const modules = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 25));

  const deleteMutation = useDeleteModule();
  const updateMutation = useUpdateModule();

  const toggleSelectAll = () => {
    if (selectedIds.size === modules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(modules.map(m => m.id)));
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
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} modules?`)) {
      try {
        for (const id of Array.from(selectedIds)) {
          await deleteMutation.mutateAsync(id);
        }
        toast.success(`Deleted ${selectedIds.size} modules`);
        setSelectedIds(new Set());
        refetch();
      } catch {
        toast.error('Failed to delete some modules');
      }
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await updateMutation.mutateAsync({ id, is_published: publish });
      }
      toast.success(`${publish ? 'Published' : 'Unpublished'} ${selectedIds.size} modules`);
      setSelectedIds(new Set());
      refetch();
    } catch {
      toast.error('Failed to update some modules');
    }
  };

  const handleExport = () => {
    if (!modules.length) return;
    downloadAsCSV(
      modules.map(m => ({
        ID: m.id,
        Title: m.title,
        Tag: m.tag?.name || '',
        Published: m.is_published,
        Views: m.views,
        Created: new Date(m.created_at).toLocaleDateString()
      })),
      'modules_export'
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Module deleted successfully');
      setDeleteConfirmId(null);
      refetch();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const handleTogglePublish = async (module: DbModule) => {
    try {
      await updateMutation.mutateAsync({
        id: module.id,
        is_published: !module.is_published,
      });
      toast.success(module.is_published ? 'Module unpublished' : 'Module published');
      refetch();
    } catch (error) {
      toast.error('Failed to update module');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
          <p className="text-muted-foreground mt-1">
            Manage learning modules and their chapters
          </p>
        </div>
        <Button onClick={() => navigate('/admin/modules/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules..."
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
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleBulkPublish(true)}>Publish Selected</Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkPublish(false)}>Unpublish Selected</Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete Selected</Button>
                </>
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
                    checked={modules.length > 0 && selectedIds.size === modules.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Avg Rating</TableHead>
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
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="text-muted-foreground">No modules found</p>
                  </TableCell>
                </TableRow>
              ) : (
                modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="px-6">
                      <Checkbox 
                        checked={selectedIds.has(module.id)}
                        onCheckedChange={() => toggleSelect(module.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {module.image ? (
                          <img src={module.image} alt={module.title} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {module.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {module.tag && (
                        <Badge variant={module.tag.type === 'major' ? 'default' : 'secondary'}>
                          {module.tag.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {module.is_published ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Eye className="mr-1 h-3 w-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" /> Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{module.views}</TableCell>
                    <TableCell className="text-right">
                      {module.avg_rating > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          {Number(module.avg_rating).toFixed(1)}
                          <svg className="h-3 w-3 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/modules/${module.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(module)}>
                            {module.is_published ? (
                              <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
                            ) : (
                              <><Eye className="mr-2 h-4 w-4" /> Publish</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirmId(module.id)} className="text-red-600">
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the module and all its chapters.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteMutation.isPending} variant="destructive">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
