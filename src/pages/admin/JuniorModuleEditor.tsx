import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  useJuniorModule, useCreateJuniorModule, useUpdateJuniorModule,
  useCreateJuniorChapter, useUpdateJuniorChapter, useDeleteJuniorChapter,
} from '@/hooks/useContent';
import { TagInput } from '@/components/admin/TagInput';
import { ContentEditor, plainTextToHtml } from '@/components/admin/ContentEditor';
import { QuizEditor } from '@/components/admin/QuizEditor';
import type { DbJuniorModule, DbJuniorChapter, QuizQuestion, JuniorContentType } from '@/lib/types';

interface ChapterForm {
  id?: string;
  title: string;
  content_type: JuniorContentType;
  content: string;
  video_url: string;
  duration: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  illustration: string;
  sort_order: number;
  quiz_questions: QuizQuestion[];
  isNew?: boolean;
  isExpanded?: boolean;
}

export default function JuniorModuleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const { data: existingModule, isLoading } = useJuniorModule(isEditing ? id! : '');
  const createMutation = useCreateJuniorModule();
  const updateMutation = useUpdateJuniorModule();
  const createChapterMutation = useCreateJuniorChapter();
  const updateChapterMutation = useUpdateJuniorChapter();
  const deleteChapterMutation = useDeleteJuniorChapter();

  const [formData, setFormData] = useState<Partial<DbJuniorModule>>({
    title: '', description: '', image: '',
    tag: { name: '', type: 'major' },
    content_type: 'video', total_duration: '', is_published: false,
  });

  const [chapters, setChapters] = useState<ChapterForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (existingModule) {
      setFormData({
        title: existingModule.title, description: existingModule.description,
        image: existingModule.image, tag: existingModule.tag || { name: '', type: 'major' },
        content_type: existingModule.content_type, total_duration: existingModule.total_duration,
        is_published: existingModule.is_published,
      });
      if (existingModule.chapters) {
        setChapters(existingModule.chapters.map(ch => ({
          id: ch.id, title: ch.title, content_type: ch.content_type,
          content: ch.content, video_url: ch.video_url, duration: ch.duration,
          tags: ch.tags || [], illustration: ch.illustration,
          sort_order: ch.sort_order, quiz_questions: ch.quiz_questions || [],
          isNew: false, isExpanded: false,
        })));
      }
    }
  }, [existingModule]);

  const addChapter = () => {
    setChapters(prev => [...prev, {
      title: '', content_type: formData.content_type || 'video',
      content: '', video_url: '', duration: '', tags: [],
      illustration: '', sort_order: prev.length, quiz_questions: [],
      isNew: true, isExpanded: true,
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
      await deleteChapterMutation.mutateAsync({ id: deleteChapterId, moduleId: id });
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
      const processedChapters = chapters.map(ch => ({
        ...ch,
        content: ch.content && !ch.content.includes('<') ? plainTextToHtml(ch.content) : ch.content,
      }));

      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...formData });
        for (const ch of processedChapters) {
          if (ch.id && !ch.isNew) {
            await updateChapterMutation.mutateAsync({
              id: ch.id, module_id: id, title: ch.title, content_type: ch.content_type,
              content: ch.content, video_url: ch.video_url, duration: ch.duration,
              tags: ch.tags, illustration: ch.illustration, sort_order: ch.sort_order,
              quiz_questions: ch.quiz_questions,
            });
          } else {
            await createChapterMutation.mutateAsync({
              module_id: id, title: ch.title, content_type: ch.content_type,
              content: ch.content, video_url: ch.video_url, duration: ch.duration,
              tags: ch.tags, illustration: ch.illustration, sort_order: ch.sort_order,
              quiz_questions: ch.quiz_questions,
            });
          }
        }
        toast.success('Module updated');
      } else {
        const newModule = await createMutation.mutateAsync(
          formData as Omit<DbJuniorModule, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'chapters'>
        );
        for (const ch of processedChapters) {
          await createChapterMutation.mutateAsync({
            module_id: newModule.id, title: ch.title, content_type: ch.content_type,
            content: ch.content, video_url: ch.video_url, duration: ch.duration,
            tags: ch.tags, illustration: ch.illustration, sort_order: ch.sort_order,
            quiz_questions: ch.quiz_questions,
          });
        }
        toast.success('Module created');
      }
      navigate('/admin/junior');
    } catch { toast.error(isEditing ? 'Failed to update' : 'Failed to create'); }
    finally { setIsSubmitting(false); }
  };

  if (isEditing && isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/junior')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Junior Module' : 'New Junior Module'}</h1>
          <p className="text-muted-foreground mt-1">{isEditing ? 'Update beginner content' : 'Create beginner-friendly content'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Module Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Module title" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Module description" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={formData.content_type} onValueChange={v => setFormData({ ...formData, content_type: v as JuniorContentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Duration</Label>
                <Input value={formData.total_duration} onChange={e => setFormData({ ...formData, total_duration: e.target.value })} placeholder="e.g., 30 min" />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Module Tag</CardTitle></CardHeader>
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
                <p className="text-muted-foreground">No chapters yet.</p>
              </div>
            )}
            {chapters.map((ch, index) => (
              <Card key={ch.id || `new-${index}`} className="border-l-4 border-l-pink-400/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Badge variant="outline">Ch. {index + 1}</Badge>
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={ch.title} onChange={e => updateChapter(index, { title: e.target.value })} placeholder="Chapter title" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select value={ch.content_type} onValueChange={v => updateChapter(index, { content_type: v as JuniorContentType })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input value={ch.duration} onChange={e => updateChapter(index, { duration: e.target.value })} placeholder="e.g., 10 min" />
                      </div>
                    </div>

                    {ch.content_type === 'video' && (
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input value={ch.video_url} onChange={e => updateChapter(index, { video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                      </div>
                    )}

                    <ContentEditor
                      value={ch.content}
                      onChange={content => updateChapter(index, { content })}
                      label="Content"
                      rows={8}
                    />

                    <div className="space-y-2">
                      <Label>Illustration URL</Label>
                      <Input value={ch.illustration} onChange={e => updateChapter(index, { illustration: e.target.value })} placeholder="https://..." />
                    </div>

                    <TagInput selectedTags={ch.tags} onChange={tags => updateChapter(index, { tags })} label="Tags" />
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
                <Label>Publish Module</Label>
                <p className="text-sm text-muted-foreground">Make visible to learners</p>
              </div>
              <Switch checked={formData.is_published} onCheckedChange={checked => setFormData({ ...formData, is_published: checked })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{isEditing ? 'Update Module' : 'Create Module'}</>}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/junior')} disabled={isSubmitting}>Cancel</Button>
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
