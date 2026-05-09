import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, MoreHorizontal, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useModules, useDeleteModule, useUpdateModule } from '@/hooks/useContent';
import type { DbModule } from '@/lib/types';

export default function AdminModules() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: modules, isLoading } = useModules();
  const deleteMutation = useDeleteModule();
  const updateMutation = useUpdateModule();

  const filteredModules = modules?.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Module deleted successfully');
      setDeleteConfirmId(null);
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
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filteredModules?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No modules found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/admin/modules/new')}
              >
                Create your first module
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules?.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {module.image ? (
                          <img
                            src={module.image}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
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
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{module.views}</TableCell>
                    <TableCell className="text-right">{module.likes}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/modules/${module.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(module)}>
                            {module.is_published ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmId(module.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the module and all its chapters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
