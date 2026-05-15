import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bot, 
  Bell, 
  Save, 
  Info, 
  Palette, 
  Eye, 
  EyeOff,
  Sparkles,
  Zap,
  MessageSquare
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();

  const [aiPrompt, setAiPrompt] = useState('');
  const [banner, setBanner] = useState({
    text: '',
    isActive: false,
    backgroundColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    visiblePages: ['all']
  });

  const AVAILABLE_PAGES = [
    { id: 'all', label: 'All Pages' },
    { id: '/', label: 'Home' },
    { id: '/newsletter', label: 'Newsletter' },
    { id: '/modules', label: 'Modules' },
    { id: '/videos', label: 'Videos' },
    { id: '/events', label: 'Events' },
    { id: '/junior', label: 'Junior' },
    { id: '/profile', label: 'Profile' },
  ];

  useEffect(() => {
    if (settings) {
      if (settings.ai_prompt) setAiPrompt(settings.ai_prompt.text);
      if (settings.system_banner) {
        setBanner({
          ...settings.system_banner,
          visiblePages: settings.system_banner.visiblePages || ['all']
        });
      }
    }
  }, [settings]);

  const togglePage = (pageId: string) => {
    let newPages = [...banner.visiblePages];
    if (pageId === 'all') {
      newPages = ['all'];
    } else {
      // Remove 'all' if specific page is selected
      newPages = newPages.filter(p => p !== 'all');
      if (newPages.includes(pageId)) {
        newPages = newPages.filter(p => p !== pageId);
        if (newPages.length === 0) newPages = ['all'];
      } else {
        newPages.push(pageId);
      }
    }
    setBanner({ ...banner, visiblePages: newPages });
  };

  const handleSaveAiPrompt = async () => {
    try {
      await updateSetting.mutateAsync({ 
        key: 'ai_prompt', 
        value: { text: aiPrompt } 
      });
      toast.success("AI Personality updated successfully!");
    } catch (error) {
      toast.error("Failed to update AI prompt");
    }
  };

  const handleSaveBanner = async () => {
    try {
      await updateSetting.mutateAsync({ 
        key: 'system_banner', 
        value: banner 
      });
      toast.success("System Banner updated!");
    } catch (error) {
      toast.error("Failed to update banner settings");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure global platform behavior and AI personality.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Personality Control */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <Bot className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>AI Chatbot Personality</CardTitle>
                <CardDescription>Define how the AI behaves and answers questions.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-instructions">System Instructions</Label>
              <Textarea
                id="ai-instructions"
                placeholder="You are a helpful assistant..."
                className="min-h-[200px] font-mono text-sm resize-none"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                This prompt is sent to the Gemma model before every user interaction.
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Pro Tip for Prompting
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Include rules like "Keep it simple for kids" or "Never give direct investment advice" to maintain safety and clarity.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button className="w-full" onClick={handleSaveAiPrompt} disabled={updateSetting.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save AI Configuration
            </Button>
          </CardFooter>
        </Card>

        {/* Communication Hub / Banner */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Communication Hub</CardTitle>
                <CardDescription>Manage the global announcement banner.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Banner Status</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle visibility for all users.
                </p>
              </div>
              <Switch
                checked={banner.isActive}
                onCheckedChange={(val) => setBanner({ ...banner, isActive: val })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-text">Announcement Message</Label>
              <Input
                id="banner-text"
                placeholder="e.g. New Stock Market module is now live!"
                value={banner.text}
                onChange={(e) => setBanner({ ...banner, text: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background Style</Label>
                <Select 
                  value={banner.backgroundColor} 
                  onValueChange={(val) => setBanner({ ...banner, backgroundColor: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-primary text-primary-foreground">Primary (Green)</SelectItem>
                    <SelectItem value="bg-secondary text-secondary-foreground">Secondary (Navy)</SelectItem>
                    <SelectItem value="bg-accent text-accent-foreground">Accent (Gold)</SelectItem>
                    <SelectItem value="bg-destructive text-destructive-foreground">Destructive (Red)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className={`h-10 rounded flex items-center justify-center px-2 text-[10px] font-medium truncate ${banner.backgroundColor}`}>
                  {banner.text || "Your message here..."}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">Page Visibility</Label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border bg-muted/30">
                {AVAILABLE_PAGES.map((page) => (
                  <label key={page.id} className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        banner.visiblePages.includes(page.id) 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-input group-hover:border-primary'
                      }`}
                      onClick={() => togglePage(page.id)}
                    >
                      {banner.visiblePages.includes(page.id) && (
                        <div className="w-2 h-2 bg-current rounded-full scale-125" />
                      )}
                    </div>
                    <span className="text-xs font-medium select-none" onClick={() => togglePage(page.id)}>
                      {page.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Tip: Selecting specific pages will hide the banner on all others.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button className="w-full" variant="outline" onClick={handleSaveBanner} disabled={updateSetting.isPending}>
              <Bell className="mr-2 h-4 w-4" />
              Update System Banner
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
