import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useAuth } from '@/hooks/useAuth';
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
    seo_title: '',
    seo_description: '',
  });

  const [selectedTags, setSelectedTags] = useState<{ name: string; type: 'major' | 'minor' }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);

  const DRAFT_KEY = `draft_article_${id || 'new'}`;

  // Auto-save logic
  useEffect(() => {
    if (isSubmitting || !formData.title) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ 
        formData, 
        selectedTags,
        updatedAt: new Date().toISOString() 
      }));
      setLastAutoSaved(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, selectedTags, DRAFT_KEY, isSubmitting]);

  // Check for draft on mount
  useEffect(() => {
    const savedDraftStr = localStorage.getItem(DRAFT_KEY);
    if (!savedDraftStr || existingArticle) return;

    try {
      const { formData: draftData, updatedAt } = JSON.parse(savedDraftStr);
      const draftDate = new Date(updatedAt);
      const isRecent = (new Date().getTime() - draftDate.getTime()) < 1000 * 60 * 60 * 24; // 24 hours
      
      if (isRecent && draftData.title) {
        toast("Unsaved draft found", {
          description: `Saved ${draftDate.toLocaleTimeString()} - would you like to restore it?`,
          action: {
            label: "Restore",
            onClick: () => {
              const { formData: restoredData, selectedTags: draftTags } = JSON.parse(savedDraftStr);
              setFormData(prev => ({ ...prev, ...restoredData }));
              setSelectedTags(draftTags || []);
              toast.success("Draft restored!");
            }
          }
        });
      }
    } catch (e) {
      console.error("Error parsing draft", e);
    }
  }, [DRAFT_KEY, existingArticle]);

  // Load existing data when editing
  useEffect(() => {
    if (existingArticle) {
      setFormData(existingArticle);
      setSelectedTags(existingArticle.tags || []);
      // Clear draft once live data is loaded to avoid confusion
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [existingArticle, DRAFT_KEY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Auto-convert plain text content
      // Only convert if content is plain text (no HTML tags) and hasn't been previously HTML-encoded
      const isHtml = formData.content?.includes('<') && (formData.content?.includes('</') || formData.content?.includes('/>'));
      const processedContent = formData.content && !isHtml
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
        await createMutation.mutateAsync(articleData as Omit<DbArticle, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'avg_rating' | 'rating_count'>);
        toast.success('Article created successfully');
      }
      localStorage.removeItem(DRAFT_KEY);
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_for">Schedule for (Optional)</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={formData.scheduled_for ? new Date(formData.scheduled_for).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
                <p className="text-[10px] text-muted-foreground">Set a future date to auto-publish.</p>
              </div>
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

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ''}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="Custom title for search engines (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Meta Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description || ''}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Custom description for search results (optional)"
                rows={3}
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
        <div className="flex flex-col gap-4">
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
          <div className="h-4 text-[10px] text-muted-foreground text-center">
            {lastAutoSaved && `Draft auto-saved at ${lastAutoSaved.toLocaleTimeString()}`}
          </div>
        </div>
      </form>
    </div>
  );
}
