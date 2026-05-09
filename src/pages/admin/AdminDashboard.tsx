import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  Video, 
  Calendar, 
  GraduationCap,
  TrendingUp,
  Eye,
  Heart,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useArticles, useModules, useVideoSeries, useEvents, useJuniorModules } from '@/hooks/useContent';
import { useABTests } from '@/hooks/useABTesting';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

const statsCards = [
  { title: 'Total Articles', icon: FileText, key: 'articles', color: 'text-blue-600', bgColor: 'bg-blue-50', route: '/admin/articles' },
  { title: 'Modules', icon: BookOpen, key: 'modules', color: 'text-green-600', bgColor: 'bg-green-50', route: '/admin/modules' },
  { title: 'Video Series', icon: Video, key: 'videos', color: 'text-purple-600', bgColor: 'bg-purple-50', route: '/admin/videos' },
  { title: 'Events', icon: Calendar, key: 'events', color: 'text-orange-600', bgColor: 'bg-orange-50', route: '/admin/events' },
  { title: 'Junior Content', icon: GraduationCap, key: 'junior', color: 'text-pink-600', bgColor: 'bg-pink-50', route: '/admin/junior' },
  { title: 'A/B Tests', icon: TrendingUp, key: 'abTests', color: 'text-indigo-600', bgColor: 'bg-indigo-50', route: '/admin/ab-tests' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch data — no filter means ALL content (admin RLS gives access to all)
  const { data: articles, isLoading: loadingArticles, error: articlesError } = useArticles();
  const { data: modules, isLoading: loadingModules, error: modulesError } = useModules();
  const { data: videos, isLoading: loadingVideos, error: videosError } = useVideoSeries();
  const { data: events, isLoading: loadingEvents, error: eventsError } = useEvents();
  const { data: junior, isLoading: loadingJunior, error: juniorError } = useJuniorModules();
  const { data: abTests, isLoading: loadingABTests, error: abTestsError } = useABTests();

  const isLoading = loadingArticles || loadingModules || loadingVideos || loadingEvents || loadingJunior || loadingABTests;
  const hasErrors = articlesError || modulesError || videosError || eventsError || juniorError || abTestsError;

  const stats = {
    articles: articles?.length || 0,
    modules: modules?.length || 0,
    videos: videos?.length || 0,
    events: events?.length || 0,
    junior: junior?.length || 0,
    abTests: abTests?.length || 0,
  };

  const totalViews = (articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0) +
                     (modules?.reduce((sum, m) => sum + (m.views || 0), 0) || 0) +
                     (videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0);

  const totalLikes = (articles?.reduce((sum, a) => sum + (a.likes || 0), 0) || 0) +
                     (modules?.reduce((sum, m) => sum + (m.likes || 0), 0) || 0) +
                     (videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0) +
                     (junior?.reduce((sum, j) => sum + (j.likes || 0), 0) || 0);

  // Published vs draft counts
  const publishedArticles = articles?.filter(a => a.is_published).length || 0;
  const draftArticles = (articles?.length || 0) - publishedArticles;
  const publishedModules = modules?.filter(m => m.is_published).length || 0;
  const publishedVideos = videos?.filter(v => v.is_published).length || 0;
  const upcomingEvents = events?.filter(e => e.is_upcoming).length || 0;

  // Recent content (last 5 items across all types)
  const recentContent = [
    ...(articles?.slice(0, 3).map(a => ({ type: 'Article', title: a.title, id: a.id, published: a.is_published, date: a.created_at, route: `/admin/articles/${a.id}` })) || []),
    ...(modules?.slice(0, 2).map(m => ({ type: 'Module', title: m.title, id: m.id, published: m.is_published, date: m.created_at, route: `/admin/modules/${m.id}` })) || []),
    ...(videos?.slice(0, 2).map(v => ({ type: 'Video', title: v.title, id: v.id, published: v.is_published, date: v.created_at, route: `/admin/videos/${v.id}` })) || []),
    ...(events?.slice(0, 2).map(e => ({ type: 'Event', title: e.title, id: e.id, published: e.is_published, date: e.created_at, route: `/admin/events/${e.id}` })) || []),
    ...(junior?.slice(0, 2).map(j => ({ type: 'Junior', title: j.title, id: j.id, published: j.is_published, date: j.created_at, route: `/admin/junior/${j.id}` })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // Newsletter count
  const newsletterCount = articles?.filter(a => a.category === 'Newsletter').length || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['articles'] });
    queryClient.invalidateQueries({ queryKey: ['modules'] });
    queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
    queryClient.invalidateQueries({ queryKey: ['abTests'] });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your content and analytics.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Some data failed to load. This may be due to database permissions.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Ensure your admin role is properly configured in Supabase RLS policies.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card) => {
          const Icon = card.icon;
          const count = stats[card.key as keyof typeof stats];
          return (
            <Card key={card.key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(card.route)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{count}</div>
                    {card.key === 'articles' && newsletterCount > 0 && (
                      <span className="text-xs text-muted-foreground">({newsletterCount} newsletters)</span>
                    )}
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  className="mt-4 -ml-2 text-xs"
                  onClick={(e) => { e.stopPropagation(); navigate(card.route); }}
                >
                  Manage {card.title}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engagement Stats + Content Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Total Views
            </CardTitle>
            <CardDescription>Across all content types</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="text-4xl font-bold">{totalViews.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Total Likes
            </CardTitle>
            <CardDescription>Across all content types</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="text-4xl font-bold">{totalLikes.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-violet-600" />
              Content Status
            </CardTitle>
            <CardDescription>Published vs drafts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Published articles</span>
                  <Badge className="bg-green-100 text-green-800">{publishedArticles}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Drafts</span>
                  <Badge variant="secondary">{draftArticles}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Published modules</span>
                  <Badge className="bg-green-100 text-green-800">{publishedModules}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Upcoming events</span>
                  <Badge variant="outline">{upcomingEvents}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      {!isLoading && recentContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>Latest content across all types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(item.route)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="flex-shrink-0 text-xs">{item.type}</Badge>
                    <span className="font-medium text-sm truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.published ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Draft</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for content management</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/admin/articles/new')}>
            <FileText className="mr-2 h-4 w-4" />
            New Article
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/modules/new')}>
            <BookOpen className="mr-2 h-4 w-4" />
            New Module
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/videos/new')}>
            <Video className="mr-2 h-4 w-4" />
            New Video Series
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/events/new')}>
            <Calendar className="mr-2 h-4 w-4" />
            New Event
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/junior/new')}>
            <GraduationCap className="mr-2 h-4 w-4" />
            New Junior Module
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
