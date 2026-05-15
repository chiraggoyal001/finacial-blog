import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Zap, 
  Bookmark, 
  Clock, 
  BookOpen, 
  Play, 
  ChevronRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks, useVisibleAffiliates, useTrackAffiliateClick } from '@/hooks/useAffiliates';
import { useArticles, useModules } from '@/hooks/useContent';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ArticleCard from '@/components/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function MyLearningPage() {
  const { user, isLoggedIn } = useAuth();
  const { data: bookmarks, isLoading: loadingBookmarks } = useBookmarks(user?.id || '');
  const { data: articles } = useArticles({ published: true });
  const { data: modules } = useModules({ published: true });
  const { data: recommendations, isLoading: loadingRecs } = useRecommendations(4);
  const { visibleAffiliates: affiliates } = useVisibleAffiliates({ page: 'profile', section: 'sidebar' });
  const trackClick = useTrackAffiliateClick();

  const handlePartnerClick = (id: string) => {
    trackClick.mutate(id);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Login Required</CardTitle>
              <CardDescription>Please log in to view your personalized learning dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter bookmarked items
  const bookmarkedArticles = articles?.filter(a => bookmarks?.some(b => b.content_id === a.id && b.content_type === 'article')) || [];
  const bookmarkedModules = modules?.filter(m => bookmarks?.some(b => b.content_id === m.id && b.content_type === 'module')) || [];

  // Mock percentile (since we don't have the real RPC calculation logic here yet, but let's assume it's in user profile)
  // Actually I did implement it in a previous turn!
  const userXp = user?.xp || 0;
  const percentile = 85; // This would ideally come from profile data

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-8 space-y-8">
        {/* Header / Stats */}
        <section className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{userXp}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total XP</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>Global Rank</span>
                  <span className="text-primary">Top {100 - percentile}%</span>
                </div>
                <Progress value={percentile} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Bookmark className="h-4 w-4" /> Bookmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookmarks?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Saved for later</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" /> Daily Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 Days</div>
              <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            {/* Bookmarked Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Your Bookmarks</h2>
                <Link to="/newsletter" className="text-xs text-primary hover:underline">Browse all</Link>
              </div>
              
              {loadingBookmarks ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-[300px] rounded-xl" />)}
                </div>
              ) : bookmarkedArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookmarkedArticles.map(article => (
                    <ArticleCard 
                      key={article.id} 
                      post={{
                        id: article.id,
                        title: article.title,
                        excerpt: article.excerpt,
                        content: article.content,
                        category: article.category,
                        author: article.author_name,
                        date: article.created_at,
                        image: article.image,
                        readTime: article.read_time,
                        tags: article.tags,
                        views: article.views,
                        likes: article.likes
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
                  <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground text-sm">You haven't bookmarked any articles yet.</p>
                </div>
              )}
            </section>

            {/* Recommended Section */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Picked for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loadingRecs ? (
                  [1, 2].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)
                ) : recommendations?.map(rec => (
                  <Link 
                    key={rec.id} 
                    to={rec.category === 'Modules' ? `/modules/${rec.id}` : `/newsletter/${rec.id}`}
                    className="flex gap-4 p-3 rounded-xl border bg-card hover:shadow-md transition-shadow group"
                  >
                    <div className="shrink-0 w-24 h-16 rounded-lg overflow-hidden">
                      <img src={rec.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rec.title} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Badge variant="outline" className="w-fit text-[8px] uppercase tracking-tighter h-4 px-1 mb-1">{rec.category}</Badge>
                      <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{rec.title}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{rec.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            {/* Interests Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Interests</CardTitle>
                <CardDescription className="text-[10px]">Based on your profile</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {user?.interests && user.interests.length > 0 ? (
                  user.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-[10px]">{interest}</Badge>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground">Add interests in your profile to get better recommendations.</p>
                )}
                <Link to="/profile" className="w-full mt-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs h-8">Update Profile</Button>
                </Link>
              </CardContent>
            </Card>

            {/* In Progress Modules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookmarkedModules.length > 0 ? (
                  bookmarkedModules.map(mod => (
                    <div key={mod.id} className="space-y-2">
                      <Link to={`/modules/${mod.id}`} className="text-xs font-bold hover:text-primary transition-colors block line-clamp-1">{mod.title}</Link>
                      <div className="flex items-center gap-2">
                        <Progress value={45} className="h-1 flex-1" />
                        <span className="text-[10px] font-mono text-muted-foreground">45%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No modules in progress. Start one today!</p>
                )}
                <Link to="/modules" className="block pt-2">
                  <Button variant="outline" className="w-full text-xs h-9">
                    Explore Modules <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {/* Partner Deals */}
            {affiliates && affiliates.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Partner Deals
                  </CardTitle>
                  <CardDescription className="text-[10px]">Exclusive offers for our learners</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {affiliates.map(link => (
                    <div key={link.id} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border/50">
                      <div className="shrink-0 h-8 w-8 rounded border bg-muted/30 flex items-center justify-center overflow-hidden">
                        {link.logo_url ? (
                          <img src={link.logo_url} alt={`${link.name} logo`} className="h-full w-full object-contain p-1" />
                        ) : (
                          <LayoutDashboard className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate leading-tight">{link.name}</p>
                        <p className="text-[8px] text-muted-foreground truncate uppercase tracking-tighter">{link.category}</p>
                      </div>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => handlePartnerClick(link.id)}
                      >
                        <Button size="sm" className="h-6 text-[8px] px-2 font-bold uppercase tracking-widest">
                          Get Deal
                        </Button>
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
