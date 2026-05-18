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
    date: '',
    time: '',
    location: 'Online',
    image: '',
    tags: [],
    is_upcoming: true,
    registration_url: '',
    capacity: undefined,
    is_published: false,
    virtual_lobby_url: '',
    recording_url: '',
  });

  // Compute is_upcoming from the event date
  const computedIsUpcoming = formData.date
    ? new Date(formData.date) >= new Date(new Date().toDateString())
    : true;

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingEvent) {
      // Only spread editable fields, not metadata
      const { id, created_at, updated_at, registered, ...editableFields } = existingEvent;
      setFormData({
        ...editableFields,
        date: existingEvent.date ? new Date(existingEvent.date).toISOString().split('T')[0] : '',
        tags: existingEvent.tags || [],
      });
    }
  }, [existingEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Auto-compute is_upcoming from the event date
      // Strip out any metadata fields that may have been spread into formData
      const { id, created_at, updated_at, registered, ...cleanData } = formData;
      const processedData = {
        ...cleanData,
        is_upcoming: computedIsUpcoming,
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
                <Label>Date *</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} placeholder="e.g., 14:00 - 16:00" />
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
                  Automatically determined from the event date
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                computedIsUpcoming 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {computedIsUpcoming ? 'Upcoming' : 'Past'}
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

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{isEditing ? 'Update Event' : 'Create Event'}</>}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/events')} disabled={isSubmitting}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
