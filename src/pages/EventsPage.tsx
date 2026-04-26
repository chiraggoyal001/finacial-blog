import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, MapPin, Clock, Users, Filter, Sparkles, Brain, Tent } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DUMMY_EVENTS } from "@/lib/data";
import type { EventType } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";

const EventsPage = () => {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const EVENT_TYPE_META: Record<EventType, { label: string; icon: React.ElementType; color: string; description: string }> = {
    community: { label: t("events.community"), icon: Users, color: "bg-primary/10 text-primary", description: t("events.communityDesc") },
    quiz: { label: t("events.quizzes"), icon: Brain, color: "bg-secondary/10 text-secondary", description: t("events.quizzesDesc") },
    bootcamp: { label: t("events.bootcamp"), icon: Tent, color: "bg-info/10 text-info", description: t("events.bootcampDesc") },
  };

  const locations = useMemo(() => Array.from(new Set(DUMMY_EVENTS.map((e) => e.location))).sort(), []);
  const eventDates = useMemo(() => DUMMY_EVENTS.filter((e) => e.isUpcoming).map((e) => new Date(e.date)), []);
  const filteredEvents = useMemo(() =>
    DUMMY_EVENTS.filter((e) => {
      if (!e.isUpcoming) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (locationFilter !== "all" && e.location !== locationFilter) return false;
      if (selectedDate) { if (new Date(e.date).toDateString() !== selectedDate.toDateString()) return false; }
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [typeFilter, locationFilter, selectedDate]);
  const pastEvents = DUMMY_EVENTS.filter((e) => !e.isUpcoming);

  const clearFilters = () => { setTypeFilter("all"); setLocationFilter("all"); setSelectedDate(undefined); };
  const hasActiveFilters = typeFilter !== "all" || locationFilter !== "all" || selectedDate;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-10 md:py-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-2">{t("events.tag")}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("events.title1")} <span className="text-primary">{t("events.title2")}</span></h1>
          <p className="mt-3 text-muted-foreground max-w-xl">{t("events.desc")}</p>
        </div>
      </section>

      <section className="container py-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-6">{t("events.typesOfEvents")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.keys(EVENT_TYPE_META) as EventType[]).map((type) => {
            const meta = EVENT_TYPE_META[type];
            const Icon = meta.icon;
            return (
              <Card key={type} className="cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:scale-105 hover:-translate-y-1 transition-all duration-300 transform border-border" onClick={() => setTypeFilter(type)}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`rounded-lg p-3 ${meta.color}`}><Icon className="h-6 w-6" /></div>
                  <div><h3 className="font-display font-semibold text-foreground">{meta.label}</h3><p className="text-sm text-muted-foreground mt-1">{meta.description}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container py-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-6">{t("events.upcoming")}</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border">
                <Skeleton className="aspect-[16/9] w-full" />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-3 pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <div className="space-y-6">
            <Card className="border-border overflow-hidden">
              <CardContent className="p-3">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="pointer-events-auto"
                  modifiers={{ event: eventDates }} modifiersClassNames={{ event: "bg-primary/20 text-primary font-bold rounded-full" }} />
              </CardContent>
            </Card>
            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2"><Filter className="h-4 w-4" /> {t("events.filters")}</h3>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("events.allTypes")}</SelectItem>
                  <SelectItem value="community">{t("events.community")}</SelectItem>
                  <SelectItem value="quiz">{t("events.quizzes")}</SelectItem>
                  <SelectItem value="bootcamp">{t("events.bootcamp")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("events.allLocations")}</SelectItem>
                  {locations.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-muted-foreground">{t("events.clearFilters")}</Button>}
            </div>
          </div>
          <div>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">{t("events.noEvents")}</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">{t("events.clearFilters")}</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredEvents.map((event) => {
                  const meta = EVENT_TYPE_META[event.type];
                  const Icon = meta.icon;
                  const spotsLeft = event.capacity && event.registered ? event.capacity - event.registered : null;
                  return (
                    <Link key={event.id} to={`/events/${event.id}`}>
                      <Card className="relative overflow-hidden hover:shadow-2xl hover:shadow-primary/20 hover:scale-105 hover:z-10 transition-all duration-300 transform border-border h-full">
                        <div className="aspect-[16/9] overflow-hidden"><img src={event.image} alt={event.title} className="w-full h-full object-cover" /></div>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={meta.color}><Icon className="h-3 w-3 mr-1" /> {meta.label}</Badge>
                            {event.tags.filter(tg => tg.type === "major").map(tg => <Badge key={tg.name} variant="secondary" className="text-xs">{tg.name}</Badge>)}
                          </div>
                          <h3 className="font-display font-semibold text-foreground leading-tight">{event.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                          </div>
                          {spotsLeft !== null && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(event.registered! / event.capacity!) * 100}%` }} /></div>
                              <span className="text-muted-foreground font-mono">{spotsLeft} {t("events.spotsLeft")}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </section>

      {pastEvents.length > 0 && (
        <section className="container py-10">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">{t("events.past")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pastEvents.map((event) => {
              const meta = EVENT_TYPE_META[event.type];
              const Icon = meta.icon;
              return (
                <Card key={event.id} className="overflow-hidden border-border opacity-75">
                  <div className="aspect-[16/9] overflow-hidden grayscale"><img src={event.image} alt={event.title} className="w-full h-full object-cover" /></div>
                  <CardContent className="p-4 space-y-2">
                    <Badge variant="outline" className={meta.color}><Icon className="h-3 w-3 mr-1" /> {meta.label}</Badge>
                    <h3 className="font-display font-semibold text-foreground text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      <span className="mx-1">·</span><MapPin className="h-3 w-3" /> {event.location}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <SubscribeSection />
      <Footer />
    </div>
  );
};

export default EventsPage;
