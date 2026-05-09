import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  useVideoSeriesItem, useCreateVideoSeries, useUpdateVideoSeries,
  useCreateVideoChapter, useUpdateVideoChapter, useDeleteVideoChapter,
} from '@/hooks/useContent';
import { TagInput } from '@/components/admin/TagInput';
import { QuizEditor } from '@/components/admin/QuizEditor';
import type { DbVideoSeries, DbVideoChapter, QuizQuestion } from '@/lib/types';

interface ChapterForm {
  id?: string;
  title: string;
  video_url: string;
  duration: string;
  description: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  sort_order: number;
  quiz_questions: QuizQuestion[];
  isNew?: boolean;
  isExpanded?: boolean;
}

export default function VideoSeriesEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const { data: existingSeries, isLoading } = useVideoSeriesItem(isEditing ? id! : '');
  const createMutation = useCreateVideoSeries();
  const updateMutation = useUpdateVideoSeries();
  const createChapterMutation = useCreateVideoChapter();
  const updateChapterMutation = useUpdateVideoChapter();
  const deleteChapterMutation = useDeleteVideoChapter();

  const [formData, setFormData] = useState<Partial<DbVideoSeries>>({
    title: '', description: '', thumbnail: '',
    tag: { name: '', type: 'major' },
    total_duration: '', linked_module_id: '', is_published: false,
  });

  const [chapters, setChapters] = useState<ChapterForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (existingSeries) {
      setFormData({
        title: existingSeries.title, description: existingSeries.description,
        thumbnail: existingSeries.thumbnail, tag: existingSeries.tag || { name: '', type: 'major' },
        total_duration: existingSeries.total_duration,
        linked_module_id: existingSeries.linked_module_id, is_published: existingSeries.is_published,
      });
      if (existingSeries.chapters) {
        setChapters(existingSeries.chapters.map(ch => ({
          id: ch.id, title: ch.title, video_url: ch.video_url, duration: ch.duration,
          description: ch.description, tags: ch.tags || [], sort_order: ch.sort_order,
          quiz_questions: ch.quiz_questions || [], isNew: false, isExpanded: false,
        })));
      }
    }
  }, [existingSeries]);

  const addChapter = () => {
    setChapters(prev => [...prev, {
      title: '', video_url: '', duration: '', description: '', tags: [],
      sort_order: prev.length, quiz_questions: [], isNew: true, isExpanded: true,
    }]);
  };

  const updateChapter = (index: number, updates: Partial<ChapterForm>) => {
    setChapters(prev => prev.map((ch, i) => (i === index ? { ...ch, ...updates } : ch)));
  };

  const removeChapter = (index: number) => {
    const chapter = chapters[index];
    if (chapter.id) setDeleteChapterId(chapter.id);
    else setChapters(prev => prev.filter((_, i) => i !== index));
  };

  const confirmDeleteChapter = async () => {
    if (!deleteChapterId || !id) return;
    try {
      await deleteChapterMutation.mutateAsync({ id: deleteChapterId, seriesId: id });
      setChapters(prev => prev.filter(ch => ch.id !== deleteChapterId));
      toast.success('Chapter deleted');
    } catch { toast.error('Failed to delete chapter'); }
    setDeleteChapterId(null);
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const arr = [...chapters];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    arr.forEach((ch, i) => (ch.sort_order = i));
    setChapters(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...formData });
        for (const ch of chapters) {
          if (ch.id && !ch.isNew) {
            await updateChapterMutation.mutateAsync({
              id: ch.id, series_id: id, title: ch.title, video_url: ch.video_url,
              duration: ch.duration, description: ch.description, tags: ch.tags,
              sort_order: ch.sort_order, quiz_questions: ch.quiz_questions,
            });
          } else {
            await createChapterMutation.mutateAsync({
              series_id: id, title: ch.title, video_url: ch.video_url,
              duration: ch.duration, description: ch.description, tags: ch.tags,
              sort_order: ch.sort_order, quiz_questions: ch.quiz_questions,
            });
          }
        }
        toast.success('Video series updated');
      } else {
        const newSeries = await createMutation.mutateAsync(
          formData as Omit<DbVideoSeries, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'chapters'>
        );
        for (const ch of chapters) {
          await createChapterMutation.mutateAsync({
            series_id: newSeries.id, title: ch.title, video_url: ch.video_url,
            duration: ch.duration, description: ch.description, tags: ch.tags,
            sort_order: ch.sort_order, quiz_questions: ch.quiz_questions,
          });
        }
        toast.success('Video series created');
      }
      navigate('/admin/videos');
    } catch { toast.error(isEditing ? 'Failed to update' : 'Failed to create'); }
    finally { setIsSubmitting(false); }
  };

  if (isEditing && isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/videos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Video Series' : 'New Video Series'}</h1>
          <p className="text-muted-foreground mt-1">{isEditing ? 'Update series and chapters' : 'Create a new video series'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Series Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Series title" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Series description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Duration</Label>
                <Input value={formData.total_duration} onChange={e => setFormData({ ...formData, total_duration: e.target.value })} placeholder="e.g., 2h 30min" />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Linked Module ID (optional)</Label>
              <Input value={formData.linked_module_id} onChange={e => setFormData({ ...formData, linked_module_id: e.target.value })} placeholder="UUID of related module" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Series Tag</CardTitle></CardHeader>
          <CardContent>
            <TagInput selectedTags={formData.tag?.name ? [formData.tag] : []} onChange={tags => setFormData({ ...formData, tag: tags[0] || { name: '', type: 'major' } })} singleTag label="Head Tag" />
          </CardContent>
        </Card>

        {/* Chapters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chapters ({chapters.length})</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addChapter}><Plus className="mr-2 h-4 w-4" />Add Chapter</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapters.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No chapters yet. Add your first video chapter.</p>
              </div>
            )}
            {chapters.map((ch, index) => (
              <Card key={ch.id || `new-${index}`} className="border-l-4 border-l-purple-400/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Badge variant="outline">Ep. {index + 1}</Badge>
                      <span className="font-medium text-sm truncate max-w-[200px]">{ch.title || 'Untitled'}</span>
                      {ch.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveChapter(index, 'up')} disabled={index === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveChapter(index, 'down')} disabled={index === chapters.length - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateChapter(index, { isExpanded: !ch.isExpanded })}>{ch.isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeChapter(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                {ch.isExpanded && (
                  <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={ch.title} onChange={e => updateChapter(index, { title: e.target.value })} placeholder="Episode title" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input value={ch.duration} onChange={e => updateChapter(index, { duration: e.target.value })} placeholder="e.g., 15:30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Video URL *</Label>
                      <Input value={ch.video_url} onChange={e => updateChapter(index, { video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={ch.description} onChange={e => updateChapter(index, { description: e.target.value })} placeholder="Episode description" rows={3} />
                    </div>
                    <TagInput selectedTags={ch.tags} onChange={tags => updateChapter(index, { tags })} label="Episode Tags" />
                    <QuizEditor questions={ch.quiz_questions} onChange={q => updateChapter(index, { quiz_questions: q })} />
                  </CardContent>
                )}
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publish Series</Label>
                <p className="text-sm text-muted-foreground">Make visible to viewers</p>
              </div>
              <Switch checked={formData.is_published} onCheckedChange={checked => setFormData({ ...formData, is_published: checked })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{isEditing ? 'Update Series' : 'Create Series'}</>}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/videos')} disabled={isSubmitting}>Cancel</Button>
        </div>
      </form>

      <AlertDialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete chapter?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this chapter.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteChapter} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
