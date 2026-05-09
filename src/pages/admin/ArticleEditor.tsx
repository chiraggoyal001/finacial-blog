import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import type { DbArticle } from '@/lib/types';

const CATEGORIES = ['Newsletter', 'Modules', 'Videos', 'Junior', 'Blog'];
const MAJOR_TAGS = ["Markets", "Investing", "Fintech", "Planning", "Economy"];
const MINOR_TAGS = ["Analysis", "Weekly", "Beginners", "Career", "Banking", "Tax", "Trends", "Deep Dive"];

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
      const articleData = {
        ...formData,
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

  const toggleTag = (tagName: string, type: 'major' | 'minor') => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.name === tagName);
      if (exists) {
        return prev.filter(t => t.name !== tagName);
      }
      return [...prev, { name: tagName, type }];
    });
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
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the article"
                rows={2}
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

            <div className="space-y-2">
              <Label htmlFor="image">Featured Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="content">Article Content (HTML) *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="<p>Your article content here...</p>"
                rows={15}
                required
              />
              <p className="text-xs text-muted-foreground">
                Supports HTML formatting
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Major Tags</Label>
              <div className="flex flex-wrap gap-2">
                {MAJOR_TAGS.map(tag => {
                  const isSelected = selectedTags.find(t => t.name === tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag, 'major')}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Minor Tags</Label>
              <div className="flex flex-wrap gap-2">
                {MINOR_TAGS.map(tag => {
                  const isSelected = selectedTags.find(t => t.name === tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'secondary' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag, 'minor')}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
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
