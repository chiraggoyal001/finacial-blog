import React, { useMemo, SyntheticEvent, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Calendar as CalendarIcon, MapPin, Clock, Users, Share2, Brain, Tent, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEvent, useEvents, useRegisterForEvent, useUnregisterFromEvent, useUserEventRegistration } from "@/hooks/useContent";
import type { EventType, BlogEvent } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/hooks/useTranslation";
import { CountdownTimer } from "@/components/CountdownTimer";
import { AddToCalendar } from "@/components/AddToCalendar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DataError from "@/components/DataError";
import { supabase } from "@/lib/supabase";

export async function loader({ params }: LoaderFunctionArgs) {
  const { eventId } = params;
  if (!eventId) return { initialDbEvent: null };

  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('is_published', true)
    .single();

  return { initialDbEvent: eventData };
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const EVENT_TYPE_META: Record<EventType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  community: { label: "Community", icon: Users, color: "bg-primary/10 text-primary", description: "Open meetups, workshops, and discussions with like-minded people." },
  quiz: { label: "Quizzes", icon: Brain, color: "bg-secondary/10 text-secondary", description: "Fun, competitive quiz nights to test and sharpen your knowledge." },
  bootcamp: { label: "Bootcamp", icon: Tent, color: "bg-info/10 text-info", description: "Intensive multi-day programs for deep, hands-on learning." },
};

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { initialDbEvent } = useLoaderData() as any;
  const { data: fetchedEvent, isLoading, error, refetch } = useEvent(eventId || "", { publishedOnly: true });
  
  const dbEvent = fetchedEvent || initialDbEvent;
  const { data: dbEvents } = useEvents({ published: true });
  const { user, isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const { data: registration } = useUserEventRegistration(eventId || "", user?.id);
  const registerMutation = useRegisterForEvent();
  const unregisterMutation = useUnregisterFromEvent();

  const event: BlogEvent | undefined = useMemo(() => {
    return dbEvent ? {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      start_time: dbEvent.start_time,
      end_time: dbEvent.end_time,
      location: dbEvent.location,
      image: dbEvent.image,
      type: dbEvent.type as EventType,
      capacity: dbEvent.capacity,
      registered: dbEvent.registered,
      tags: dbEvent.tags || [],
      virtualLobbyUrl: dbEvent.virtual_lobby_url,
    } : undefined;
  }, [dbEvent]);

  const isAttending = registration?.status === 'registered';
  const isWaitlisted = registration?.status === 'waitlisted';

  const otherUpcoming = useMemo(() => {
    if (!dbEvents) return [];
    return dbEvents
      .filter(e => e.id !== eventId && new Date(e.start_time) > new Date())
      .slice(0, 2);
  }, [dbEvents, eventId]);

  const isLobbyActive = useMemo(() => {
    if (!event?.start_time) return false;
    const startTime = new Date(event.start_time);
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    return diff <= 30 * 60 * 1000 && diff > -2 * 60 * 60 * 1000; // 30 mins before to 2 hours after
  }, [event]);

  const isUpcoming = useMemo(() => {
    if (!event?.end_time) return false;
    return new Date(event.end_time) > new Date();
  }, [event]);

  const handleRegister = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to register for events");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        eventId: eventId!,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
      });
      toast.success("Successfully registered for the event!");
    } catch (err) {
      toast.error("Failed to register for the event");
    }
  };

  const handleUnregister = async () => {
    try {
      await unregisterMutation.mutateAsync(eventId!);
      toast.success("Registration cancelled");
    } catch (err) {
      toast.error("Failed to cancel registration");
    }
  };

  useSEO({
    title: event?.title || "Event",
    description: event?.description || "Join our upcoming event",
    image: event?.image,
    type: 'event'
  });

  if (isLoading && !dbEvent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !dbEvent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Event Not Found"
            message="The event you are looking for might have been moved or is not yet published."
            onRetry={() => refetch()} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  const meta = EVENT_TYPE_META[event.type];
  const Icon = meta.icon;
  const spotsLeft = event.capacity && event.registered ? event.capacity - event.registered : null;
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

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
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
            <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {new Date(event.start_time).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> 
              {new Date(event.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - {new Date(event.end_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
          </div>
        </div>
      </section>

      {/* Countdown Urgency */}
      {new Date(event.start_time) > new Date() && (
        <section className="container py-6">
          <CountdownTimer targetDate={event.start_time} />
        </section>
      )}

      {/* Main Content */}
      <section className="container py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Current Event Detail */}
          <Card className="border-border overflow-hidden shadow-sm">
            <div className="aspect-[16/9] overflow-hidden relative">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" onError={handleImageError} />
              {isAttending && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-in fade-in zoom-in">
                  ✓ You're Registered
                </div>
              )}
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
                  <p className="text-muted-foreground" suppressHydrationWarning>
                    {event.location} · {new Date(event.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AddToCalendar 
                    title={event.title}
                    description={event.description}
                    location={event.location}
                    startTime={event.start_time}
                    endTime={event.end_time}
                  />
                </div>
              </div>

              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              
              {/* Capacity & Social Proof */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{event.registered} {t("events.registered")}</span>
                  </div>
                  {spotsLeft !== null && spotsLeft > 0 && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {spotsLeft} spots remaining
                    </Badge>
                  )}
                </div>
                {spotsLeft !== null && (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(event.registered! / event.capacity!) * 100}%` }} />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  Join {event.registered} other learners who are interested in this topic!
                </p>
              </div>

              {/* Dynamic Actions */}
              <div className="flex flex-wrap gap-3">
                {isUpcoming ? (
                  <>
                    {isAttending ? (
                      <>
                        {isLobbyActive && event.virtualLobbyUrl ? (
                          <a href={event.virtualLobbyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                            <Button className="w-full bg-green-600 hover:bg-green-700 animate-pulse">
                              <ExternalLink className="h-4 w-4 mr-2" /> Join Virtual Lobby
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" className="flex-1 sm:flex-initial text-destructive border-destructive hover:bg-destructive/10" 
                            onClick={handleUnregister} disabled={unregisterMutation.isPending}>
                            Cancel Registration
                          </Button>
                        )}
                      </>
                    ) : isWaitlisted ? (
                      <Button variant="secondary" className="flex-1 sm:flex-initial" disabled>
                        On Waitlist
                      </Button>
                    ) : spotsLeft !== null && spotsLeft <= 0 ? (
                      <Button className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600" onClick={handleRegister}>
                        Join Waitlist
                      </Button>
                    ) : (
                      <Button className="flex-1 sm:flex-initial h-12 px-8 text-base font-bold shadow-lg shadow-primary/20" 
                        onClick={handleRegister} disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                        Register Now
                      </Button>
                    )}
                  </>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>Event Ended</Button>
                )}
              </div>
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
                          <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" onError={handleImageError} />
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <Badge variant="outline" className={m.color}><I className="h-3 w-3 mr-1" /> {m.label}</Badge>
                          <h3 className="font-display font-semibold text-sm text-foreground">{ev.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1" suppressHydrationWarning>
                              <CalendarIcon className="h-3 w-3" /> {new Date(ev.start_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {ev.location}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </div>
  );
};

export default EventDetailPage;