import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, MoreHorizontal, Calendar, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useEvents, useDeleteEvent, useUpdateEvent } from '@/hooks/useContent';
import type { DbEvent } from '@/lib/types';

import AdminAttendeeList from './AdminAttendeeList';

const EVENT_TYPES = { community: 'Community', quiz: 'Quiz', bootcamp: 'Bootcamp' };

export default function AdminEvents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [attendeeEvent, setAttendeeEvent] = useState<{ id: string, title: string } | null>(null);

  const { data: events, isLoading } = useEvents();
  const deleteMutation = useDeleteEvent();
  const updateMutation = useUpdateEvent();

  const filteredEvents = events?.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Event deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleTogglePublish = async (event: DbEvent) => {
    try {
      await updateMutation.mutateAsync({ id: event.id, is_published: !event.is_published });
      toast.success(event.is_published ? 'Unpublished' : 'Published');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Manage community events and webinars</p>
        </div>
        <Button onClick={() => navigate('/admin/events/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : filteredEvents?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/events/new')}>Create first event</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Registrations</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {event.image ? <img src={event.image} alt={event.title} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Calendar className="h-5 w-5 text-muted-foreground" /></div>}
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground">{event.location} • {event.time}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || event.type}</Badge></TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {event.is_published ? <Badge className="bg-green-100 text-green-800 w-fit"><Eye className="mr-1 h-3 w-3" />Published</Badge> : <Badge variant="secondary" className="w-fit"><EyeOff className="mr-1 h-3 w-3" />Draft</Badge>}
                        {event.is_upcoming ? <Badge variant="outline" className="w-fit text-blue-600">Upcoming</Badge> : <Badge variant="outline" className="w-fit text-gray-500">Past</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{event.registered}{event.capacity && `/${event.capacity}`}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setAttendeeEvent({ id: event.id, title: event.title })}>
                            <Users className="mr-2 h-4 w-4" /> View Attendees
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(event)}>
                            {event.is_published ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</> : <><Eye className="mr-2 h-4 w-4" />Publish</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirmId(event.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
      </Card>

      <AdminAttendeeList 
        eventId={attendeeEvent?.id || null} 
        eventName={attendeeEvent?.title || ''} 
        onClose={() => setAttendeeEvent(null)} 
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the event.</AlertDialogDescription>
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
