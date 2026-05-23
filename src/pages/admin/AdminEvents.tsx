import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, MoreHorizontal, Calendar, CheckCircle2, Users, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDeleteEvent, useUpdateEvent } from '@/hooks/useContent';
import { useAdminEvents } from '@/hooks/useAdmin';
import { downloadAsCSV } from '@/lib/export';
import AdminAttendeeList from './AdminAttendeeList';
import type { DbEvent } from '@/lib/types';

// Helper to compute event status from date rather than relying on stored is_upcoming
function computeEventStatus(date: string): 'upcoming' | 'past' | 'happening' {
  const eventDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  
  if (eventDate > today) return 'upcoming';
  if (eventDate < today) return 'past';
  return 'happening';
}

const EVENT_TYPES = { community: 'Community', quiz: 'Quiz', bootcamp: 'Bootcamp' };

export default function AdminEvents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [attendeeEvent, setAttendeeEvent] = useState<{ id: string, title: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useAdminEvents({
    page,
    limit: 25,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const events = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 25));

  const deleteMutation = useDeleteEvent();
  const updateMutation = useUpdateEvent();

  const toggleSelectAll = () => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} events?`)) {
      try {
        for (const id of Array.from(selectedIds)) {
          await deleteMutation.mutateAsync(id);
        }
        toast.success(`Deleted ${selectedIds.size} events`);
        setSelectedIds(new Set());
        refetch();
      } catch {
        toast.error('Failed to delete some events');
      }
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await updateMutation.mutateAsync({ id, is_published: publish });
      }
      toast.success(`${publish ? 'Published' : 'Unpublished'} ${selectedIds.size} events`);
      setSelectedIds(new Set());
      refetch();
    } catch {
      toast.error('Failed to update some events');
    }
  };

  const handleExport = () => {
    if (!events.length) return;
    downloadAsCSV(
      events.map(e => ({
        ID: e.id,
        Title: e.title,
        Type: EVENT_TYPES[e.type as keyof typeof EVENT_TYPES] || e.type,
        Date: new Date(e.date).toLocaleDateString(),
        Time: e.time,
        Location: e.location,
        Published: e.is_published,
        Registrations: e.registered,
        Capacity: e.capacity || 'Unlimited',
        Status: computeEventStatus(e.date)
      })),
      'events_export'
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Event deleted');
      setDeleteConfirmId(null);
      refetch();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleTogglePublish = async (event: DbEvent) => {
    try {
      await updateMutation.mutateAsync({ id: event.id, is_published: !event.is_published });
      toast.success(event.is_published ? 'Unpublished' : 'Published');
      refetch();
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleBulkPublish(true)}>Publish Selected</Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkPublish(false)}>Unpublish Selected</Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete Selected</Button>
                </>
              )}
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-6">
                  <Checkbox 
                    checked={events.length > 0 && selectedIds.size === events.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Registrations</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="text-muted-foreground">No events found</p>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="px-6">
                      <Checkbox 
                        checked={selectedIds.has(event.id)}
                        onCheckedChange={() => toggleSelect(event.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {event.image ? (
                          <img src={event.image} alt={event.title} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground">{event.location} • {event.time}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || event.type}</Badge>
                    </TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {event.is_published ? (
                          <Badge className="bg-green-100 text-green-800 w-fit"><Eye className="mr-1 h-3 w-3" />Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit"><EyeOff className="mr-1 h-3 w-3" />Draft</Badge>
                        )}
                        {(() => {
                          const status = computeEventStatus(event.date);
                          if (status === 'upcoming') return <Badge variant="outline" className="w-fit text-blue-600">Upcoming</Badge>;
                          if (status === 'happening') return <Badge className="bg-green-100 text-green-700 border-green-200 w-fit">Happening Today</Badge>;
                          return <Badge variant="outline" className="w-fit text-gray-500">Past</Badge>;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {event.registered}{event.capacity && `/${event.capacity}`}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setAttendeeEvent({ id: event.id, title: event.title })}>
                            <Users className="mr-2 h-4 w-4" /> View Attendees
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(event)}>
                            {event.is_published ? <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</> : <><Eye className="mr-2 h-4 w-4" /> Publish</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirmId(event.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, totalCount)} of {totalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
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
            <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteMutation.isPending} variant="destructive">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
