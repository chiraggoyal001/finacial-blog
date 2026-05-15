import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  Video, 
  Calendar, 
  GraduationCap,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  Settings,
  Zap,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArticles, useModules, useVideoSeries, useEvents, useJuniorModules } from '@/hooks/useContent';
import { useABTests } from '@/hooks/useABTesting';
import { useAnalytics } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

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

  // Fetch data
  const { data: articles, isLoading: loadingArticles, error: articlesError } = useArticles();
  const { data: modules, isLoading: loadingModules, error: modulesError } = useModules();
  const { data: videos, isLoading: loadingVideos, error: videosError } = useVideoSeries();
  const { data: events, isLoading: loadingEvents, error: eventsError } = useEvents();
  const { data: junior, isLoading: loadingJunior, error: juniorError } = useJuniorModules();
  const { data: abTests, isLoading: loadingABTests, error: abTestsError } = useABTests();
  const { data: analytics, isLoading: loadingAnalytics } = useAnalytics();

  // Per-section loading to prevent one stuck query from freezing the entire dashboard
  const isLoadingStats = loadingArticles || loadingModules || loadingVideos || loadingEvents || loadingJunior || loadingABTests;
  const hasErrors = articlesError || modulesError || videosError || eventsError || juniorError || abTestsError;

  const stats = {
    articles: articles?.length || 0,
    modules: modules?.length || 0,
    videos: videos?.length || 0,
    events: events?.length || 0,
    junior: junior?.length || 0,
    abTests: abTests?.length || 0,
  };

  // Total views across all content
  const totalViews = (articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0) +
                     (modules?.reduce((sum, m) => sum + (m.views || 0), 0) || 0) +
                     (videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0);

  // Total ratings received
  const totalRatings = (articles?.reduce((sum, a) => sum + (a.rating_count || 0), 0) || 0) +
                       (modules?.reduce((sum, m) => sum + (m.rating_count || 0), 0) || 0) +
                       (videos?.reduce((sum, v) => sum + (v.rating_count || 0), 0) || 0) +
                       (junior?.reduce((sum, j) => sum + (j.rating_count || 0), 0) || 0);

  // Average rating across all content (weighted)
  const totalRatingSum = (articles?.reduce((sum, a) => sum + (a.avg_rating || 0) * (a.rating_count || 0), 0) || 0) +
                         (modules?.reduce((sum, m) => sum + (m.avg_rating || 0) * (m.rating_count || 0), 0) || 0) +
                         (videos?.reduce((sum, v) => sum + (v.avg_rating || 0) * (v.rating_count || 0), 0) || 0) +
                         (junior?.reduce((sum, j) => sum + (j.avg_rating || 0) * (j.rating_count || 0), 0) || 0);
  const overallAvgRating = totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(1) : '—';

  // Published vs draft counts
  const publishedArticles = articles?.filter(a => a.is_published).length || 0;
  const draftArticles = (articles?.length || 0) - publishedArticles;
  const publishedModules = modules?.filter(m => m.is_published).length || 0;
  const publishedVideos = videos?.filter(v => v.is_published).length || 0;
  const upcomingEvents = events?.filter(e => e.is_upcoming).length || 0;

  // Recent content
  const recentContent = [
    ...(articles?.slice(0, 3).map(a => ({ type: 'Article', title: a.title, id: a.id, published: a.is_published, date: a.created_at, route: `/admin/articles/${a.id}` })) || []),
    ...(modules?.slice(0, 2).map(m => ({ type: 'Module', title: m.title, id: m.id, published: m.is_published, date: m.created_at, route: `/admin/modules/${m.id}` })) || []),
    ...(videos?.slice(0, 2).map(v => ({ type: 'Video', title: v.title, id: v.id, published: v.is_published, date: v.created_at, route: `/admin/videos/${v.id}` })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['articles'] });
    queryClient.invalidateQueries({ queryKey: ['modules'] });
    queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
    queryClient.invalidateQueries({ queryKey: ['abTests'] });
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Insights</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Real-time behavioral analytics and content performance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingStats}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-medium">Total Views</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground">Across all content types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Live Articles</CardDescription>
            <CardTitle className="text-2xl font-bold">{publishedArticles}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground">{draftArticles} drafts in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Ratings</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalRatings.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground">Across {stats.articles + stats.modules + stats.videos + stats.junior} content items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-1">
              {overallAvgRating === '—' ? '—' : (
                <>
                  {overallAvgRating}
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground">1-5 scale • {totalRatings > 0 ? `${totalRatings} total` : 'No ratings yet'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Analytics Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Active Users (DAU)
            </CardTitle>
            <CardDescription>Unique visitors over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              {loadingAnalytics ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.dailyActive}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 10}} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <ChartTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="unique_users" 
                      name="Users"
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Performance Sidebar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" />
              Top Performing Content
            </CardTitle>
            <CardDescription>Most viewed articles and modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {loadingAnalytics ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : analytics?.contentPerformance?.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between group">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-xs font-medium truncate group-hover:text-primary transition-colors cursor-default">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">{item.content_type}</span>
                    </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold">{item.views.toLocaleString()}</p>
                      <p className="text-[8px] text-muted-foreground uppercase">Views</p>
                    </div>
                    <div className="text-right w-14">
                      <p className="text-xs font-medium flex items-center justify-end gap-0.5">
                        {item.avg_rating > 0 ? (
                          <>
                            {Number(item.avg_rating).toFixed(1)}
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </p>
                      <p className="text-[8px] text-muted-foreground uppercase">Rating</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground" onClick={() => navigate('/admin/articles')}>
              View all articles <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resource Management Shortcut */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="hover:shadow-md transition-shadow cursor-pointer py-4" onClick={() => navigate(card.route)}>
              <div className="flex flex-col items-center justify-center space-y-2 text-center">
                <div className={`${card.bgColor} p-2.5 rounded-xl`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-tight">{card.title.split(' ')[1] || card.title}</span>
                <span className="text-xl font-bold">{stats[card.key as keyof typeof stats]}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Management Hub</CardTitle>
            <CardDescription>Shortcut to administrative tools.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/admin/users')}>
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              User Directory
            </Button>
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4 text-orange-600" />
              Global Settings
            </Button>
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/admin/articles/new')}>
              <FileText className="mr-2 h-4 w-4 text-green-600" />
              New Newsletter
            </Button>
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/admin/ab-tests')}>
              <Zap className="mr-2 h-4 w-4 text-indigo-600" />
              New A/B Test
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Mini-Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Latest changes to your platform.</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContent.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="font-medium truncate flex-1">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}