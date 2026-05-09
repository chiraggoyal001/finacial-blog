import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Square, Trash2, Search, MoreHorizontal, FlaskConical, TrendingUp, Users, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useABTests, useCreateABTest, useUpdateABTest, useDeleteABTest } from '@/hooks/useABTesting';
import type { ABTest } from '@/lib/types';

const STATUS_BADGES = {
  draft: { variant: 'secondary' as const, label: 'Draft', icon: Square },
  running: { variant: 'default' as const, label: 'Running', icon: Play },
  paused: { variant: 'outline' as const, label: 'Paused', icon: Pause },
  completed: { variant: 'outline' as const, label: 'Completed', icon: TrendingUp },
};

export default function AdminABTests() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState<{ name: string; description: string; test_type: 'cta' | 'avatar' | 'mascot' | 'layout' }>({ name: '', description: '', test_type: 'cta' });

  const { data: tests, isLoading } = useABTests();
  const createMutation = useCreateABTest();
  const updateMutation = useUpdateABTest();
  const deleteMutation = useDeleteABTest();

  const filteredTests = tests?.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      toast.success(`Test ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Test deleted');
      setDeleteConfirmId(null);
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : filteredTests?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No A/B tests found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>Create your first test</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTests?.map((test) => {
                const status = STATUS_BADGES[test.status as keyof typeof STATUS_BADGES];
                const StatusIcon = status?.icon || FlaskConical;
                return (
                  <Card key={test.id} className="overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{test.name}</h3>
                              <Badge variant={status?.variant || 'outline'}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {status?.label || test.status}
                              </Badge>
                              <Badge variant="outline">{test.test_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {new Date(test.created_at).toLocaleDateString()}
                              {test.start_date && ` • Started ${new Date(test.start_date).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.status === 'draft' && (
                            <Button size="sm" onClick={() => handleStatusChange(test, 'running')}><Play className="mr-1 h-3 w-3" />Start</Button>
                          )}
                          {test.status === 'running' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(test, 'paused')}><Pause className="mr-1 h-3 w-3" />Pause</Button>
                          )}
                          {test.status === 'paused' && (
                            <Button size="sm" onClick={() => handleStatusChange(test, 'running')}><Play className="mr-1 h-3 w-3" />Resume</Button>
                          )}
                          {(test.status === 'running' || test.status === 'paused') && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(test, 'completed')}>Complete</Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/ab-tests/${test.id}`)}>Edit Test</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteConfirmId(test.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
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
