import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  Video, 
  Calendar, 
  GraduationCap,
  Users,
  TrendingUp,
  Eye,
  Heart,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArticles, useModules, useVideoSeries, useEvents, useJuniorModules } from '@/hooks/useContent';
import { useABTests } from '@/hooks/useABTesting';
import { Skeleton } from '@/components/ui/skeleton';

const statsCards = [
  { title: 'Total Articles', icon: FileText, key: 'articles', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'Modules', icon: BookOpen, key: 'modules', color: 'text-green-600', bgColor: 'bg-green-50' },
  { title: 'Video Series', icon: Video, key: 'videos', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { title: 'Events', icon: Calendar, key: 'events', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { title: 'Junior Content', icon: GraduationCap, key: 'junior', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { title: 'A/B Tests', icon: TrendingUp, key: 'abTests', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Fetch data
  const { data: articles, isLoading: loadingArticles } = useArticles();
  const { data: modules, isLoading: loadingModules } = useModules();
  const { data: videos, isLoading: loadingVideos } = useVideoSeries();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: junior, isLoading: loadingJunior } = useJuniorModules();
  const { data: abTests, isLoading: loadingABTests } = useABTests();

  const isLoading = loadingArticles || loadingModules || loadingVideos || loadingEvents || loadingJunior || loadingABTests;

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your content and analytics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="hover:shadow-md transition-shadow">
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
                  <div className="text-3xl font-bold">{stats[card.key as keyof typeof stats]}</div>
                )}
                <Button 
                  variant="ghost" 
                  className="mt-4 -ml-2 text-xs"
                  onClick={() => navigate(`/admin/${card.key === 'abTests' ? 'ab-tests' : card.key}`)}
                >
                  Manage {card.title}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
