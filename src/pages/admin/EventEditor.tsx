import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useEvent, useCreateEvent, useUpdateEvent } from '@/hooks/useContent';
import { TagInput } from '@/components/admin/TagInput';
import { ContentEditor, plainTextToHtml } from '@/components/admin/ContentEditor';
import type { DbEvent } from '@/lib/types';

export default function EventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const { data: existingEvent, isLoading } = useEvent(isEditing ? id! : '');
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const [formData, setFormData] = useState<Partial<DbEvent>>({
    title: '',
    description: '',
    type: 'community',
    start_time: '',
    end_time: '',
    location: 'Online',
    image: '',
    tags: [],
    registration_url: '',
    capacity: undefined,
    is_published: false,
    virtual_lobby_url: '',
    recording_url: '',
  });

  const formatDatetimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const isUpcoming = formData.start_time
    ? new Date(formData.start_time).getTime() >= Date.now()
    : true;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);

  const DRAFT_KEY = `draft_event_${id || 'new'}`;

  // Auto-save logic
  useEffect(() => {
    if (isSubmitting || !formData.title) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ 
        formData, 
        updatedAt: new Date().toISOString()
      }));
      setLastAutoSaved(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, DRAFT_KEY, isSubmitting]);

  // Check for draft on mount
  useEffect(() => {
    const savedDraftStr = localStorage.getItem(DRAFT_KEY);
    if (!savedDraftStr || existingEvent) return;

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
              const { formData: restoredData } = JSON.parse(savedDraftStr);
              setFormData(prev => ({ ...prev, ...restoredData }));
              toast.success("Draft restored!");
            }
          }
        });
      }
    } catch (e) {
      console.error("Error parsing event draft", e);
    }
  }, [DRAFT_KEY, existingEvent]);

  useEffect(() => {
    if (existingEvent) {
      // Only spread editable fields, not metadata
      const { id, created_at, updated_at, registered, ...editableFields } = existingEvent;
      setFormData({
        ...editableFields,
        start_time: formatDatetimeLocal(existingEvent.start_time),
        end_time: formatDatetimeLocal(existingEvent.end_time),
        tags: existingEvent.tags || [],
      });
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [existingEvent, DRAFT_KEY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.capacity !== undefined && formData.capacity <= 0) {
      toast.error('Capacity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const { id, created_at, updated_at, registered, ...cleanData } = formData;
      const processedData = {
        ...cleanData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : '',
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : '',
        description: formData.description && !formData.description.includes('<')
          ? plainTextToHtml(formData.description)
          : formData.description,
      };

      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...processedData });
        toast.success('Event updated');
      } else {
        await createMutation.mutateAsync(
          processedData as Omit<DbEvent, 'id' | 'created_at' | 'updated_at' | 'registered'>
        );
        toast.success('Event created');
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/admin/events');
    } catch {
      toast.error(isEditing ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Event' : 'New Event'}</h1>
          <p className="text-muted-foreground mt-1">{isEditing ? 'Update event details' : 'Create a new event'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Event title" required />
            </div>

            <ContentEditor
              value={formData.description || ''}
              onChange={description => setFormData({ ...formData, description })}
              label="Description"
              placeholder="Describe the event..."
              rows={6}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Type *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Online or city name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input type="datetime-local" value={formData.start_time || ''} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <Input type="datetime-local" value={formData.end_time || ''} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={formData.capacity || ''} onChange={e => setFormData({ ...formData, capacity: e.target.value ? Number(e.target.value) : undefined })} placeholder="Leave empty for unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Registration URL</Label>
                <Input value={formData.registration_url} onChange={e => setFormData({ ...formData, registration_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Virtual Lobby URL (Online)</Label>
                <Input value={formData.virtual_lobby_url || ''} onChange={e => setFormData({ ...formData, virtual_lobby_url: e.target.value })} placeholder="Link for Zoom/Meet" />
              </div>
              <div className="space-y-2">
                <Label>Recording URL (Post-event)</Label>
                <Input value={formData.recording_url || ''} onChange={e => setFormData({ ...formData, recording_url: e.target.value })} placeholder="Link to video recording" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
          <CardContent>
            <TagInput
              selectedTags={formData.tags || []}
              onChange={tags => setFormData({ ...formData, tags })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Event Status</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically determined from the event start date
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isUpcoming 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {isUpcoming ? 'Upcoming' : 'Past'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publish Event</Label>
                <p className="text-sm text-muted-foreground">Make visible to users</p>
              </div>
              <Switch checked={formData.is_published} onCheckedChange={checked => setFormData({ ...formData, is_published: checked })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{isEditing ? 'Update Event' : 'Create Event'}</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/events')} disabled={isSubmitting}>Cancel</Button>
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
    </div>
  );
}
