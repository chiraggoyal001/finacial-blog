import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  useModule,
  useCreateModule,
  useUpdateModule,
  useModuleChapters,
  useCreateModuleChapter,
  useUpdateModuleChapter,
  useDeleteModuleChapter,
} from '@/hooks/useContent';
import { TagInput } from '@/components/admin/TagInput';
import { ContentEditor, plainTextToHtml } from '@/components/admin/ContentEditor';
import { QuizEditor } from '@/components/admin/QuizEditor';
import type { DbModule, DbModuleChapter, QuizQuestion } from '@/lib/types';

interface ChapterForm {
  id?: string;
  title: string;
  content: string;
  read_time: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  sort_order: number;
  quiz_questions: QuizQuestion[];
  isNew?: boolean;
  isExpanded?: boolean;
}

export default function ModuleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const { data: existingModule, isLoading: loadingModule } = useModule(id || '');
  const { data: existingChapters } = useModuleChapters(isEditing ? id! : '');

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const createChapterMutation = useCreateModuleChapter();
  const updateChapterMutation = useUpdateModuleChapter();
  const deleteChapterMutation = useDeleteModuleChapter();

  const [formData, setFormData] = useState<Partial<DbModule>>({
    title: '',
    description: '',
    image: '',
    tag: { name: '', type: 'major' },
    total_read_time: '',
    youtube_playlist: '',
    is_published: false,
    seo_title: '',
    seo_description: '',
  });

  const [chapters, setChapters] = useState<ChapterForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);

  const DRAFT_KEY = `draft_module_${id || 'new'}`;

  // Auto-save logic
  useEffect(() => {
    if (isSubmitting || !formData.title) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ 
        formData, 
        chapters,
        updatedAt: new Date().toISOString()
      }));
      setLastAutoSaved(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, chapters, DRAFT_KEY, isSubmitting]);

  // Check for draft on mount
  useEffect(() => {
    const savedDraftStr = localStorage.getItem(DRAFT_KEY);
    if (!savedDraftStr || existingModule) return;

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
              const { formData: restoredData, chapters: restoredChapters } = JSON.parse(savedDraftStr);
              setFormData(prev => ({ ...prev, ...restoredData }));
              setChapters(restoredChapters || []);
              toast.success("Draft restored!");
            }
          }
        });
      }
    } catch (e) {
      console.error("Error parsing module draft", e);
    }
  }, [DRAFT_KEY, existingModule]);

  useEffect(() => {
    if (existingModule) {
      setFormData({
        title: existingModule.title,
        description: existingModule.description,
        image: existingModule.image,
        tag: existingModule.tag || { name: '', type: 'major' },
        total_read_time: existingModule.total_read_time,
        youtube_playlist: existingModule.youtube_playlist,
        is_published: existingModule.is_published,
        seo_title: existingModule.seo_title || '',
        seo_description: existingModule.seo_description || '',
      });
      // Clear draft once live data is loaded
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [existingModule, DRAFT_KEY]);

  useEffect(() => {
    if (existingChapters) {
      setChapters(
        existingChapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          content: ch.content,
          read_time: ch.read_time,
          tags: ch.tags || [],
          sort_order: ch.sort_order,
          quiz_questions: ch.quiz_questions || [],
          isNew: false,
          isExpanded: false,
        }))
      );
    }
  }, [existingChapters]);

  const addChapter = () => {
    setChapters(prev => [
      ...prev,
      {
        title: '',
        content: '',
        read_time: '',
        tags: [],
        sort_order: prev.length,
        quiz_questions: [],
        isNew: true,
        isExpanded: true,
      },
    ]);
  };

  const updateChapter = (index: number, updates: Partial<ChapterForm>) => {
    setChapters(prev => prev.map((ch, i) => (i === index ? { ...ch, ...updates } : ch)));
  };

  const removeChapter = (index: number) => {
    const chapter = chapters[index];
    if (chapter.id) {
      setDeleteChapterId(chapter.id);
    } else {
      setChapters(prev => prev.filter((_, i) => i !== index));
    }
  };

  const confirmDeleteChapter = async () => {
    if (!deleteChapterId || !id) return;
    try {
      await deleteChapterMutation.mutateAsync({ id: deleteChapterId, moduleId: id });
      setChapters(prev => prev.filter(ch => ch.id !== deleteChapterId));
      toast.success('Chapter deleted');
    } catch {
      toast.error('Failed to delete chapter');
    }
    setDeleteChapterId(null);
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChapters.length) return;
    [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
    newChapters.forEach((ch, i) => (ch.sort_order = i));
    setChapters(newChapters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let moduleId = id;

      // Auto-convert plain text content in chapters
      const processedChapters = chapters.map(ch => ({
        ...ch,
        content: ch.content.includes('<') ? ch.content : plainTextToHtml(ch.content),
      }));

      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...formData });

        // Update / Create chapters
        await Promise.all(processedChapters.map(chapter => {
          if (chapter.id && !chapter.isNew) {
            return updateChapterMutation.mutateAsync({
              id: chapter.id,
              module_id: id,
              title: chapter.title,
              content: chapter.content,
              read_time: chapter.read_time,
              tags: chapter.tags,
              sort_order: chapter.sort_order,
              quiz_questions: chapter.quiz_questions,
            });
          } else {
            return createChapterMutation.mutateAsync({
              module_id: id,
              title: chapter.title,
              content: chapter.content,
              read_time: chapter.read_time,
              tags: chapter.tags,
              sort_order: chapter.sort_order,
              quiz_questions: chapter.quiz_questions,
            });
          }
        }));
        toast.success('Module updated successfully');
      } else {
        const newModule = await createMutation.mutateAsync(
          formData as Omit<DbModule, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'chapters'>
        );
        moduleId = newModule.id;

        await Promise.all(processedChapters.map(chapter => 
          createChapterMutation.mutateAsync({
            module_id: newModule.id,
            title: chapter.title,
            content: chapter.content,
            read_time: chapter.read_time,
            tags: chapter.tags,
            sort_order: chapter.sort_order,
            quiz_questions: chapter.quiz_questions,
          })
        ));
        toast.success('Module created successfully');
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/admin/modules');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update module' : 'Failed to create module');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && loadingModule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/modules')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Module' : 'New Module'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Update module content and chapters' : 'Create a new learning module'}
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
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter module title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the module"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_read_time">Total Read Time</Label>
                  <Input
                    id="total_read_time"
                    value={formData.total_read_time}
                    onChange={(e) => setFormData({ ...formData, total_read_time: e.target.value })}
                    placeholder="e.g. 45 min"
                  />
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
                <Label htmlFor="youtube_playlist">YouTube Playlist URL</Label>
                <Input
                  id="youtube_playlist"
                  value={formData.youtube_playlist}
                  onChange={e => setFormData({ ...formData, youtube_playlist: e.target.value })}
                  placeholder="https://youtube.com/playlist?list=..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Cover Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Tag */}
        <Card>
          <CardHeader>
            <CardTitle>Module Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              selectedTags={formData.tag?.name ? [formData.tag] : []}
              onChange={tags => setFormData({ ...formData, tag: tags[0] || { name: '', type: 'major' } })}
              singleTag
              label="Head Tag (visible on card)"
            />
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

        {/* Chapters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chapters ({chapters.length})</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addChapter}>
                <Plus className="mr-2 h-4 w-4" />
                Add Chapter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapters.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No chapters yet. Add your first chapter.</p>
              </div>
            )}

            {chapters.map((chapter, index) => (
              <Card key={chapter.id || `new-${index}`} className="border-l-4 border-l-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Badge variant="outline">Ch. {index + 1}</Badge>
                      <span className="font-medium text-sm truncate max-w-[200px]">
                        {chapter.title || 'Untitled Chapter'}
                      </span>
                      {chapter.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => moveChapter(index, 'up')} disabled={index === 0}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => moveChapter(index, 'down')} disabled={index === chapters.length - 1}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => updateChapter(index, { isExpanded: !chapter.isExpanded })}>
                        {chapter.isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                        onClick={() => removeChapter(index)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {chapter.isExpanded && (
                  <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Chapter Title *</Label>
                        <Input
                          value={chapter.title}
                          onChange={e => updateChapter(index, { title: e.target.value })}
                          placeholder="Chapter title"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Read Time</Label>
                        <Input
                          value={chapter.read_time}
                          onChange={e => updateChapter(index, { read_time: e.target.value })}
                          placeholder="e.g., 10 min"
                        />
                      </div>
                    </div>

                    <ContentEditor
                      value={chapter.content}
                      onChange={content => updateChapter(index, { content })}
                      label="Chapter Content"
                      required
                    />

                    <TagInput
                      selectedTags={chapter.tags}
                      onChange={tags => updateChapter(index, { tags })}
                      label="Chapter Tags"
                    />

                    <QuizEditor
                      questions={chapter.quiz_questions}
                      onChange={quiz_questions => updateChapter(index, { quiz_questions })}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
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
                <Label htmlFor="published">Publish Module</Label>
                <p className="text-sm text-muted-foreground">Make this module visible to readers</p>
              </div>
              <Switch
                id="published"
                checked={formData.is_published}
                onCheckedChange={checked => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />{isEditing ? 'Update Module' : 'Create Module'}</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/modules')} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
          <div className="h-5">
            {lastAutoSaved && (
              <p className="text-[10px] text-muted-foreground text-center">
                Draft auto-saved at {lastAutoSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Delete Chapter Confirmation */}
      <AlertDialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chapter?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this chapter.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChapter} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
