import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Users, Mail, Clock } from 'lucide-react';
import { useEventAttendees } from '@/hooks/useContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AdminAttendeeListProps {
  eventId: string | null;
  eventName: string;
  onClose: () => void;
}

export default function AdminAttendeeList({ eventId, eventName, onClose }: AdminAttendeeListProps) {
  const { data: attendees, isLoading } = useEventAttendees(eventId || '');

  const downloadCsv = () => {
    if (!attendees) return;
    
    const headers = ['Name', 'Email', 'Status', 'Joined At'];
    const csvEscape = (val: string) => {
      // Wrap in quotes if the value contains commas, quotes, or newlines
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = attendees.map(a => [
      csvEscape(`${a.profiles.first_name} ${a.profiles.last_name}`),
      csvEscape(a.profiles.email),
      csvEscape(a.status),
      csvEscape(new Date(a.created_at).toLocaleString())
    ]);
    
    const csvContent = [
      headers.map(csvEscape).join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${eventName.replace(/\s+/g, '_')}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={!!eventId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle>Attendees</DialogTitle>
              <DialogDescription>
                List of users registered for "{eventName}"
              </DialogDescription>
            </div>
            {!isLoading && attendees && attendees.length > 0 && (
              <Button onClick={downloadCsv} size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : !attendees || attendees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No one has registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                attendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {attendee.profiles.first_name} {attendee.profiles.last_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" /> {attendee.profiles.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={attendee.status === 'registered' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                        {attendee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(attendee.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
