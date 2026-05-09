import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useArticle, useCreateArticle, useUpdateArticle } from '@/hooks/useContent';
import { useAuth } from '@/contexts/AuthContext';
import { TagInput } from '@/components/admin/TagInput';
import { ContentEditor, plainTextToHtml } from '@/components/admin/ContentEditor';
import type { DbArticle } from '@/lib/types';

const CATEGORIES = ['Newsletter', 'Modules', 'Videos', 'Junior', 'Blog'];

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  // Fetch existing article if editing
  const { data: existingArticle, isLoading: loadingArticle } = useArticle(id || '');
  
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const [formData, setFormData] = useState<Partial<DbArticle>>({
    title: '',
    excerpt: '',
    content: '',
    category: 'Blog',
    author_name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Editorial Team',
    image: '',
    read_time: '',
    tags: [],
    is_published: false,
  });

  const [selectedTags, setSelectedTags] = useState<{ name: string; type: 'major' | 'minor' }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data when editing
  useEffect(() => {
    if (existingArticle) {
      setFormData(existingArticle);
      setSelectedTags(existingArticle.tags || []);
    }
  }, [existingArticle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Auto-convert plain text content
      const processedContent = formData.content && !formData.content.includes('<')
        ? plainTextToHtml(formData.content)
        : formData.content;

      const articleData = {
        ...formData,
        content: processedContent,
        tags: selectedTags,
        author_id: user?.id,
      };

      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...articleData });
        toast.success('Article updated successfully');
      } else {
        await createMutation.mutateAsync(articleData as Omit<DbArticle, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes'>);
        toast.success('Article created successfully');
      }
      navigate('/admin/articles');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update article' : 'Failed to create article');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && loadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/articles')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Update your article content' : 'Create a new article'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter article title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Input
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the article"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="read_time">Read Time</Label>
                <Input
                  id="read_time"
                  value={formData.read_time}
                  onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                  placeholder="e.g., 5 min"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Featured Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentEditor
              value={formData.content || ''}
              onChange={(content) => setFormData({ ...formData, content })}
              label="Article Content"
              placeholder="Write your article content..."
              required
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="published">Publish Article</Label>
                <p className="text-sm text-muted-foreground">
                  Make this article visible to readers
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Article' : 'Create Article'}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/articles')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
