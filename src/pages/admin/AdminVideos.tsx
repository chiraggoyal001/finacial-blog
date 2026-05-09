import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, MoreHorizontal, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useVideoSeries, useDeleteVideoSeries, useUpdateVideoSeries } from '@/hooks/useContent';
import type { DbVideoSeries } from '@/lib/types';

export default function AdminVideos() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: videos, isLoading } = useVideoSeries();
  const deleteMutation = useDeleteVideoSeries();
  const updateMutation = useUpdateVideoSeries();

  const filteredVideos = videos?.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Video series deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleTogglePublish = async (video: DbVideoSeries) => {
    try {
      await updateMutation.mutateAsync({ id: video.id, is_published: !video.is_published });
      toast.success(video.is_published ? 'Unpublished' : 'Published');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground mt-1">Manage video series and chapters</p>
        </div>
        <Button onClick={() => navigate('/admin/videos/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Series
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : filteredVideos?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/videos/new')}>Create first series</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Series</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos?.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {video.thumbnail ? <img src={video.thumbnail} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Video className="h-5 w-5 text-muted-foreground" /></div>}
                        <div>
                          <div className="font-medium">{video.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{video.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{video.tag && <Badge variant={video.tag.type === 'major' ? 'default' : 'secondary'}>{video.tag.name}</Badge>}</TableCell>
                    <TableCell>{video.total_duration}</TableCell>
                    <TableCell>{video.is_published ? <Badge className="bg-green-100 text-green-800"><Eye className="mr-1 h-3 w-3" />Published</Badge> : <Badge variant="secondary"><EyeOff className="mr-1 h-3 w-3" />Draft</Badge>}</TableCell>
                    <TableCell className="text-right">{video.views}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/videos/${video.id}`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(video)}>{video.is_published ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</> : <><Eye className="mr-2 h-4 w-4" />Publish</>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirmId(video.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
            <AlertDialogTitle>Delete video series?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the series and all its chapters.</AlertDialogDescription>
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
