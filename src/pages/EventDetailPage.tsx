import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar as CalendarIcon, MapPin, Clock, Users, Filter, Share2, Brain, Tent, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DUMMY_EVENTS, SOCIAL_LINKS } from "@/lib/data";
import type { EventType } from "@/lib/types";

const EVENT_TYPE_META: Record<EventType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  community: { label: "Community", icon: Users, color: "bg-primary/10 text-primary", description: "Open meetups, workshops, and discussions with like-minded people." },
  quiz: { label: "Quizzes", icon: Brain, color: "bg-secondary/10 text-secondary", description: "Fun, competitive quiz nights to test and sharpen your knowledge." },
  bootcamp: { label: "Bootcamp", icon: Tent, color: "bg-info/10 text-info", description: "Intensive multi-day programs for deep, hands-on learning." },
};

const EventDetailPage = () => {
  const { eventId } = useParams();
  const event = DUMMY_EVENTS.find((e) => e.id === eventId);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const locations = useMemo(() => {
    const locs = new Set(DUMMY_EVENTS.map((e) => e.location));
    return Array.from(locs).sort();
  }, []);

  const eventDates = useMemo(() => {
    return DUMMY_EVENTS.filter((e) => e.isUpcoming).map((e) => new Date(e.date));
  }, []);

  const otherUpcoming = useMemo(() => {
    return DUMMY_EVENTS.filter((e) => {
      if (!e.isUpcoming || e.id === eventId) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (locationFilter !== "all" && e.location !== locationFilter) return false;
      if (selectedDate) {
        const evDate = new Date(e.date).toDateString();
        if (evDate !== selectedDate.toDateString()) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [eventId, typeFilter, locationFilter, selectedDate]);

  const clearFilters = () => {
    setTypeFilter("all");
    setLocationFilter("all");
    setSelectedDate(undefined);
  };

  const hasActiveFilters = typeFilter !== "all" || locationFilter !== "all" || selectedDate;

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Event not found</h1>
            <Link to="/events"><Button variant="link" className="mt-4">Back to Events</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const meta = EVENT_TYPE_META[event.type];
  const Icon = meta.icon;
  const spotsLeft = event.capacity && event.registered ? event.capacity - event.registered : null;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-10 md:py-16">
          <Link to="/events" className="text-sm text-primary hover:underline mb-4 inline-block">← All Events</Link>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={meta.color}><Icon className="h-3 w-3 mr-1" /> {meta.label}</Badge>
            {event.tags.map(t => (
              <Badge key={t.name} variant={t.type === "major" ? "secondary" : "outline"} className="text-xs">{t.name}</Badge>
            ))}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{event.title}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {event.time}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
          </div>
        </div>
      </section>

      {/* Event Type Previews */}
      <section className="container py-8">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">Explore Event Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(EVENT_TYPE_META) as EventType[]).map((type) => {
            const m = EVENT_TYPE_META[type];
            const I = m.icon;
            return (
              <Card key={type} className={`border-border ${event.type === type ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`rounded-lg p-2.5 ${m.color}`}><I className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-foreground">{m.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main content area */}
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Left: Filters + Calendar */}
          <div className="space-y-6">
            <Card className="border-border overflow-hidden">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="pointer-events-auto"
                  modifiers={{ event: eventDates }}
                  modifiersClassNames={{ event: "bg-primary/20 text-primary font-bold rounded-full" }}
                />
              </CardContent>
            </Card>
            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </h3>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Event type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="quiz">Quizzes</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-muted-foreground">
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Right: Event detail + upcoming */}
          <div className="space-y-8">
            {/* Current Event Detail */}
            <Card className="border-border overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-foreground leading-relaxed">{event.description}</p>
                {spotsLeft !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{event.registered} / {event.capacity} registered</span>
                      <span className="font-mono text-primary font-semibold">{spotsLeft} spots left</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(event.registered! / event.capacity!) * 100}%` }} />
                    </div>
                  </div>
                )}
                {event.isUpcoming && event.registrationUrl && (
                  <Button className="w-full sm:w-auto">
                    <ExternalLink className="h-4 w-4 mr-2" /> Register Now
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Share:</span>
              <a href={`https://x.com/intent/tweet?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">X</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">LinkedIn</a>
              <a href={`https://wa.me/?text=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">WhatsApp</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">Facebook</a>
            </div>

            {/* Other Upcoming Events */}
            {otherUpcoming.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-bold text-foreground mb-4">More Upcoming Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherUpcoming.map((ev) => {
                    const m = EVENT_TYPE_META[ev.type];
                    const I = m.icon;
                    return (
                      <Link key={ev.id} to={`/events/${ev.id}`}>
                        <Card className="overflow-hidden hover:shadow-md transition-shadow border-border h-full">
                          <div className="aspect-[16/9] overflow-hidden">
                            <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                          </div>
                          <CardContent className="p-4 space-y-2">
                            <Badge variant="outline" className={m.color}><I className="h-3 w-3 mr-1" /> {m.label}</Badge>
                            <h3 className="font-display font-semibold text-sm text-foreground">{ev.title}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" /> {new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              <span className="mx-1">·</span>
                              <MapPin className="h-3 w-3" /> {ev.location}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </div>
  );
};

export default EventDetailPage;
