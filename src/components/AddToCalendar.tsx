import React from 'react';
import { CalendarPlus, ExternalLink, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AddToCalendarProps {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}

export const AddToCalendar = ({ title, description, location, startTime, endTime }: AddToCalendarProps) => {
  // Simple Google Calendar Link
  const getGoogleUrl = () => {
    const start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', title);
    url.searchParams.append('details', description);
    url.searchParams.append('location', location);
    url.searchParams.append('dates', `${start}/${end}`);
    return url.toString();
  };

  // Simple ICS generation logic
  const downloadIcs = () => {
    const start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Remind Me</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.open(getGoogleUrl(), '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadIcs}>
          <Download className="mr-2 h-4 w-4" />
          Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
