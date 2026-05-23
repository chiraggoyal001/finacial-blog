import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useDeleteArticle, useUpdateArticle } from '@/hooks/useContent';
import { useAdminArticles } from '@/hooks/useAdmin';
import type { DbArticle } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function AdminArticles() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);

  const { data: response, isLoading } = useAdminArticles({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery,
  });

  const articles = response?.data || [];
  const totalArticles = response?.totalCount || 0;

  const deleteMutation = useDeleteArticle();
  const updateMutation = useUpdateArticle();

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedArticleIds(articles.map(a => a.id));
    else setSelectedArticleIds([]);
  };

  const handleSelectArticle = (id: string, checked: boolean) => {
    if (checked) setSelectedArticleIds(prev => [...prev, id]);
    else setSelectedArticleIds(prev => prev.filter(aId => aId !== id));
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedArticleIds.length} articles?`)) return;
    try {
      await Promise.all(selectedArticleIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedArticleIds.length} articles deleted`);
      setSelectedArticleIds([]);
    } catch (error) {
      toast.error('Failed to delete some articles');
    }
  };

  const handleBulkTogglePublish = async () => {
    try {
      const selectedArticles = articles.filter(a => selectedArticleIds.includes(a.id));
      await Promise.all(selectedArticles.map(article => 
        updateMutation.mutateAsync({
          id: article.id,
          is_published: !article.is_published,
          published_at: !article.is_published ? new Date().toISOString() : null,
        })
      ));
      toast.success(`${selectedArticleIds.length} articles updated`);
      setSelectedArticleIds([]);
    } catch (error) {
      toast.error('Failed to update some articles');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Article deleted successfully');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const handleTogglePublish = async (article: DbArticle) => {
    try {
      await updateMutation.mutateAsync({
        id: article.id,
        is_published: !article.is_published,
        published_at: !article.is_published ? new Date().toISOString() : null,
      });
      toast.success(article.is_published ? 'Article unpublished' : 'Article published');
    } catch (error) {
      toast.error('Failed to update article');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground mt-1">
            Manage blog posts and newsletter content
          </p>
        </div>
        <Button onClick={() => navigate('/admin/articles/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      {/* Search and Bulk Actions */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
          {selectedArticleIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedArticleIds.length} Selected</Badge>
              <Button size="sm" variant="outline" onClick={handleBulkTogglePublish}>
                Toggle Publish
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/admin/articles/new')}
              >
                Create your first article
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={articles.length > 0 && selectedArticleIds.length === articles.length}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Avg Rating</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedArticleIds.includes(article.id)}
                        onCheckedChange={(c) => handleSelectArticle(article.id, !!c)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium line-clamp-1">{article.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(article.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.category}</Badge>
                    </TableCell>
                    <TableCell>{article.author_name}</TableCell>
                    <TableCell>
                      {article.is_published ? (
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
                    <TableCell className="text-right">{article.views}</TableCell>
                    <TableCell className="text-right">
                      {article.avg_rating > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          {Number(article.avg_rating).toFixed(1)}
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
                          <DropdownMenuItem onClick={() => navigate(`/admin/articles/${article.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(article)}>
                            {article.is_published ? (
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
                            onClick={() => setDeleteConfirmId(article.id)}
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
        {totalArticles > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalArticles)} of {totalArticles} articles
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * ITEMS_PER_PAGE >= totalArticles}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={(e) => {
                if (deleteConfirmId) handleDelete(deleteConfirmId);
              }}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
