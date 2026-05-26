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
  MessageSquare,
  Shield,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  FileText,
  Hand,
  MessageCircle,
  WifiOff,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSystemSettings, useUpdateSystemSetting, useBotConfig, useUpdateBotConfig, useResetBotConfig, BotConfigKey } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// Bot Config Card Component (reusable)
// ═══════════════════════════════════════════════════════════════

interface BotConfigCardProps {
  configKey: BotConfigKey;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  isSafetyCritical?: boolean;
  children: (value: any, setValue: (v: any) => void) => React.ReactNode;
  extractValue: (config: any) => any;
  buildValue: (localState: any) => any;
  config: Record<string, any>;
  updateConfig: ReturnType<typeof useUpdateBotConfig>;
  resetConfig: ReturnType<typeof useResetBotConfig>;
}

function BotConfigCard({
  configKey,
  title,
  description,
  icon,
  iconBg,
  isSafetyCritical,
  children,
  extractValue,
  buildValue,
  config,
  updateConfig,
  resetConfig,
}: BotConfigCardProps) {
  const [localValue, setLocalValue] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (config && config[configKey] && !initialized) {
      setLocalValue(extractValue(config[configKey]));
      setInitialized(true);
    }
  }, [config, configKey, extractValue, initialized]);

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        key: configKey,
        value: buildValue(localValue),
      });
      toast.success(`${title} updated successfully!`);
    } catch (error) {
      toast.error(`Failed to update ${title}`);
    }
  };

  const handleReset = async () => {
    try {
      const result = await resetConfig.mutateAsync({ key: configKey });
      if (result?.value) {
        setLocalValue(extractValue(result.value));
      }
      toast.success(`${title} reset to default`);
    } catch (error) {
      toast.error(`Failed to reset ${title}`);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {isSafetyCritical && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-3 w-3" />
              <span className="text-[10px] font-medium">Safety-Critical</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {children(localValue, setLocalValue)}
      </CardContent>
      <CardFooter className="border-t pt-4 gap-2">
        <Button 
          className="flex-1" 
          onClick={handleSave} 
          disabled={updateConfig.isPending}
          size="sm"
        >
          <Save className="mr-2 h-3 w-3" />
          Save
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={resetConfig.isPending}>
              <RotateCcw className="mr-2 h-3 w-3" />
              Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace the current {title.toLowerCase()} with the original default value. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}


// ═══════════════════════════════════════════════════════════════
// Main Admin Settings Page
// ═══════════════════════════════════════════════════════════════

export default function AdminSettings() {
  const { data: settings, isLoading } = useSystemSettings();
  const { data: botConfig, isLoading: isBotConfigLoading } = useBotConfig();
  const updateSetting = useUpdateSystemSetting();
  const updateBotConfig = useUpdateBotConfig();
  const resetBotConfig = useResetBotConfig();

  const [aiPrompt, setAiPrompt] = useState('');
  const [banner, setBanner] = useState({
    text: '',
    isActive: false,
    backgroundColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    visiblePages: ['all']
  });
  const [partnerPlatforms, setPartnerPlatforms] = useState({
    isVisible: true,
    logos: {
      zerodha: true,
      groww: true,
      bloomberg: true,
      moneycontrol: true,
      upstox: true
    },
    badges: {
      factChecked: true,
      structuredPaths: true,
      topRated: true
    }
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
      if (settings.partner_platforms) {
        setPartnerPlatforms({
          isVisible: settings.partner_platforms.isVisible ?? true,
          logos: {
            zerodha: settings.partner_platforms.logos?.zerodha ?? true,
            groww: settings.partner_platforms.logos?.groww ?? true,
            bloomberg: settings.partner_platforms.logos?.bloomberg ?? true,
            moneycontrol: settings.partner_platforms.logos?.moneycontrol ?? true,
            upstox: settings.partner_platforms.logos?.upstox ?? true,
          },
          badges: {
            factChecked: settings.partner_platforms.badges?.factChecked ?? true,
            structuredPaths: settings.partner_platforms.badges?.structuredPaths ?? true,
            topRated: settings.partner_platforms.badges?.topRated ?? true,
          }
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

  const handleSavePartnerPlatforms = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'partner_platforms',
        value: partnerPlatforms
      });
      toast.success("Partner platforms and trust badges configuration updated!");
    } catch (error) {
      toast.error("Failed to update partner platforms configuration");
    }
  };

  if (isLoading || isBotConfigLoading) {
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
          Configure global platform behavior, AI personality, and bot management.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="bot-management" className="gap-2">
            <Bot className="h-4 w-4" />
            Bot Management
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* GENERAL TAB */}
        {/* ════════════════════════════════════════════════════════════ */}
        <TabsContent value="general" className="mt-6">
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
                        <SelectItem value="bg-primary text-primary-foreground">Primary (Deep Teal)</SelectItem>
                        <SelectItem value="bg-secondary text-secondary-foreground">Secondary (Warm Coral)</SelectItem>
                        <SelectItem value="bg-accent text-accent-foreground">Accent (Light Teal)</SelectItem>
                        <SelectItem value="rainbow">Rainbow (Flowing Gradient)</SelectItem>
                        <SelectItem value="bg-destructive text-destructive-foreground">Destructive (Red)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border border-border/40 rounded-lg overflow-hidden h-10 flex items-center bg-card">
                      <div className="w-full h-full relative flex items-center justify-center text-center">
                        {banner.backgroundColor === 'rainbow' ? (
                          <>
                            <style>
                              {`@keyframes fd-moving-banner {
                                  from { background-position: 0% 0;  }
                                  to { background-position: 100% 0;  }
                               }`}
                            </style>
                            <div className="absolute inset-0 bg-background/80" />
                            <div
                              className="absolute inset-0 z-0"
                              style={{
                                maskImage: "linear-gradient(to bottom, white, transparent), radial-gradient(circle at top center, white, transparent)",
                                maskComposite: "intersect",
                                WebkitMaskImage: "linear-gradient(to bottom, white, transparent), radial-gradient(circle at top center, white, transparent)",
                                WebkitMaskComposite: "source-in",
                                animation: "fd-moving-banner 20s linear infinite",
                                backgroundImage: "repeating-linear-gradient(70deg, hsla(174, 100%, 21%, 0.65) 0%, hsla(12, 89%, 62%, 0.65) 20%, hsla(174, 30%, 92%, 0.5) 40%, hsla(40, 20%, 98%, 0.4) 60%, hsla(174, 100%, 21%, 0.65) 80%)",
                                backgroundSize: "200% 100%",
                                filter: "saturate(1.5)",
                              }}
                            />
                            <span className="relative z-10 text-[10px] font-semibold text-foreground truncate px-2">
                              {banner.text || "Your message here..."}
                            </span>
                          </>
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center px-2 text-[10px] font-semibold truncate ${banner.backgroundColor}`}>
                            {banner.text || "Your message here..."}
                          </div>
                        )}
                      </div>
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

            {/* Partner Platforms & Badges Control */}
            <Card className="flex flex-col md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30">
                    <Palette className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle>Partner Platforms & Trust Badges</CardTitle>
                    <CardDescription>
                      Configure the visibility of the partner platforms segment and its contents on the home page.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Section Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle the entire Partner Platforms and Badges section.
                    </p>
                  </div>
                  <Switch
                    checked={partnerPlatforms.isVisible}
                    onCheckedChange={(val) => setPartnerPlatforms({ ...partnerPlatforms, isVisible: val })}
                  />
                </div>

                {partnerPlatforms.isVisible && (
                  <div className="grid gap-6 md:grid-cols-2 pt-2">
                    {/* Logos Visibility */}
                    <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                      <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                        <Sparkles className="h-4 w-4 text-teal-600" />
                        Featured Logos Visibility
                      </h4>
                      <div className="space-y-3 pt-1">
                        {[
                          { key: 'zerodha', label: 'Zerodha' },
                          { key: 'groww', label: 'Groww' },
                          { key: 'bloomberg', label: 'Bloomberg' },
                          { key: 'moneycontrol', label: 'Moneycontrol' },
                          { key: 'upstox', label: 'Upstox' },
                        ].map((logo) => (
                          <div key={logo.key} className="flex items-center justify-between">
                            <span className="text-xs font-medium">{logo.label}</span>
                            <Switch
                              checked={partnerPlatforms.logos[logo.key as keyof typeof partnerPlatforms.logos] !== false}
                              onCheckedChange={(val) => setPartnerPlatforms({
                                ...partnerPlatforms,
                                logos: {
                                  ...partnerPlatforms.logos,
                                  [logo.key]: val
                                }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Badges Visibility */}
                    <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                      <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                        <Shield className="h-4 w-4 text-secondary" />
                        Trust Badges Visibility
                      </h4>
                      <div className="space-y-3 pt-1">
                        {[
                          { key: 'factChecked', label: '100% Fact-Checked' },
                          { key: 'structuredPaths', label: 'Structured Paths' },
                          { key: 'topRated', label: 'Top Rated Platform' },
                        ].map((badge) => (
                          <div key={badge.key} className="flex items-center justify-between">
                            <span className="text-xs font-medium">{badge.label}</span>
                            <Switch
                              checked={partnerPlatforms.badges[badge.key as keyof typeof partnerPlatforms.badges] !== false}
                              onCheckedChange={(val) => setPartnerPlatforms({
                                ...partnerPlatforms,
                                badges: {
                                  ...partnerPlatforms.badges,
                                  [badge.key]: val
                                }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button className="w-full" onClick={handleSavePartnerPlatforms} disabled={updateSetting.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Partner Platforms Visibility Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* BOT MANAGEMENT TAB */}
        {/* ════════════════════════════════════════════════════════════ */}
        <TabsContent value="bot-management" className="mt-6">
          <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Bot Configuration</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  All prompts, compliance rules, and templates that control how the chatbot behaves are managed here. 
                  Changes take effect within 60 seconds. Items marked <span className="font-semibold">Safety-Critical</span> affect regulatory compliance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 1. Default System Prompt */}
            <BotConfigCard
              configKey="bot_default_system_prompt"
              title="Default System Prompt"
              description="Fallback identity when no custom AI prompt is set."
              icon={<Bot className="h-5 w-5 text-indigo-600" />}
              iconBg="bg-indigo-50 dark:bg-indigo-950/30"
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => cfg?.text || ''}
              buildValue={(val) => ({ text: val })}
            >
              {(value, setValue) => (
                <Textarea
                  placeholder="You are Gyaan, a friendly and knowledgeable..."
                  className="min-h-[150px] font-mono text-xs resize-none"
                  value={value || ''}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
            </BotConfigCard>

            {/* 2. Compliance Rules */}
            <BotConfigCard
              configKey="bot_compliance_rules"
              title="Compliance Rules"
              description="Instructions injected into every prompt to ensure regulatory compliance."
              icon={<Shield className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
              isSafetyCritical
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => (cfg?.rules || []).join('\n')}
              buildValue={(val) => ({ rules: (val || '').split('\n').filter((l: string) => l.trim()) })}
            >
              {(value, setValue) => (
                <>
                  <Textarea
                    placeholder="One rule per line..."
                    className="min-h-[150px] font-mono text-xs resize-none"
                    value={value || ''}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    One rule per line. These are injected as "COMPLIANCE RULES" in every prompt.
                  </p>
                </>
              )}
            </BotConfigCard>

            {/* 3. SEBI Disclaimer */}
            <BotConfigCard
              configKey="bot_sebi_disclaimer"
              title="SEBI Disclaimer"
              description="Footer disclaimer appended to all bot responses."
              icon={<FileText className="h-5 w-5 text-sky-600" />}
              iconBg="bg-sky-50 dark:bg-sky-950/30"
              isSafetyCritical
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => cfg?.text || ''}
              buildValue={(val) => ({ text: val })}
            >
              {(value, setValue) => (
                <Textarea
                  placeholder="⚠️ **Disclaimer**: This information is for educational purposes..."
                  className="min-h-[120px] font-mono text-xs resize-none"
                  value={value || ''}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
            </BotConfigCard>

            {/* 4. Blocked Phrases */}
            <BotConfigCard
              configKey="bot_blocked_phrases"
              title="Blocked Phrases"
              description="Words or phrases the bot must never include in responses."
              icon={<ShieldAlert className="h-5 w-5 text-red-600" />}
              iconBg="bg-red-50 dark:bg-red-950/30"
              isSafetyCritical
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => (cfg?.patterns || []).join('\n')}
              buildValue={(val) => ({ patterns: (val || '').split('\n').filter((l: string) => l.trim()) })}
            >
              {(value, setValue) => (
                <>
                  <Textarea
                    placeholder="One phrase per line..."
                    className="min-h-[150px] font-mono text-xs resize-none"
                    value={value || ''}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Removing phrases here weakens compliance filtering. Edit with caution.
                  </p>
                </>
              )}
            </BotConfigCard>

            {/* 5. Advice Patterns */}
            <BotConfigCard
              configKey="bot_advice_patterns"
              title="Advice Detection Patterns"
              description="Phrases that indicate the bot is giving specific investment advice."
              icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-50 dark:bg-amber-950/30"
              isSafetyCritical
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => (cfg?.patterns || []).join('\n')}
              buildValue={(val) => ({ patterns: (val || '').split('\n').filter((l: string) => l.trim()) })}
            >
              {(value, setValue) => (
                <>
                  <Textarea
                    placeholder="One pattern per line..."
                    className="min-h-[150px] font-mono text-xs resize-none"
                    value={value || ''}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    If the bot's response matches any pattern, a caveat is automatically appended.
                  </p>
                </>
              )}
            </BotConfigCard>

            {/* 6. Escalation Responses */}
            <BotConfigCard
              configKey="bot_escalation_responses"
              title="Escalation Responses"
              description="Canned responses shown when the bot detects distress or complex topics."
              icon={<Hand className="h-5 w-5 text-purple-600" />}
              iconBg="bg-purple-50 dark:bg-purple-950/30"
              isSafetyCritical
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => ({
                urgent: cfg?.urgent || '',
                recommend: cfg?.recommend || '',
                suggest: cfg?.suggest || '',
              })}
              buildValue={(val) => ({
                urgent: val?.urgent || '',
                recommend: val?.recommend || '',
                suggest: val?.suggest || '',
              })}
            >
              {(value, setValue) => (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-red-600">🆘 Urgent (Distress / Self-harm)</Label>
                    <Textarea
                      placeholder="Emergency response with helpline numbers..."
                      className="min-h-[80px] font-mono text-xs resize-none border-red-200 dark:border-red-900"
                      value={value?.urgent || ''}
                      onChange={(e) => setValue({ ...value, urgent: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-amber-600">⚠️ Recommend (Professional Advice Needed)</Label>
                    <Textarea
                      placeholder="Suggest consulting a SEBI-registered adviser..."
                      className="min-h-[60px] font-mono text-xs resize-none border-amber-200 dark:border-amber-900"
                      value={value?.recommend || ''}
                      onChange={(e) => setValue({ ...value, recommend: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-blue-600">💡 Suggest (Complex Topic)</Label>
                    <Textarea
                      placeholder="Suggest a financial adviser for complex decisions..."
                      className="min-h-[60px] font-mono text-xs resize-none"
                      value={value?.suggest || ''}
                      onChange={(e) => setValue({ ...value, suggest: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </BotConfigCard>

            {/* 7. Nudge Templates */}
            <BotConfigCard
              configKey="bot_nudge_templates"
              title="Nudge Opener Templates"
              description="Proactive chat messages sent to engage users based on their behavior."
              icon={<MessageCircle className="h-5 w-5 text-teal-600" />}
              iconBg="bg-teal-50 dark:bg-teal-950/30"
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => ({
                article_goal: cfg?.article_goal || '',
                calc_use: cfg?.calc_use || '',
                return_visit: cfg?.return_visit || '',
                deadline: cfg?.deadline || '',
                general: cfg?.general || '',
              })}
              buildValue={(val) => ({
                article_goal: val?.article_goal || '',
                calc_use: val?.calc_use || '',
                return_visit: val?.return_visit || '',
                deadline: val?.deadline || '',
                general: val?.general || '',
              })}
            >
              {(value, setValue) => (
                <div className="space-y-3">
                  {[
                    { key: 'article_goal', label: '📚 Article Goal Match', placeholder: 'Use {topic} for the article topic' },
                    { key: 'calc_use', label: '🧮 Calculator Use', placeholder: 'Use {calc_type} for the calculator type' },
                    { key: 'return_visit', label: '🔄 Return Visit', placeholder: 'Use {article_title} and {topic}' },
                    { key: 'deadline', label: '📅 Deadline', placeholder: 'Use {topic} for the relevant topic' },
                    { key: 'general', label: '💬 General', placeholder: 'Default opener when no specific trigger' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-[11px] font-medium">{label}</Label>
                      <Input
                        className="text-xs font-mono"
                        placeholder={placeholder}
                        value={value?.[key] || ''}
                        onChange={(e) => setValue({ ...value, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Use {'{'}<code>topic</code>{'}'}, {'{'}<code>article_title</code>{'}'}, {'{'}<code>calc_type</code>{'}'} as template variables.
                  </p>
                </div>
              )}
            </BotConfigCard>

            {/* 8. Fallback Response */}
            <BotConfigCard
              configKey="bot_fallback_response"
              title="Fallback Response"
              description="Shown when the bot is experiencing technical difficulties (circuit breaker open)."
              icon={<WifiOff className="h-5 w-5 text-gray-600" />}
              iconBg="bg-gray-100 dark:bg-gray-800/30"
              config={botConfig || {}}
              updateConfig={updateBotConfig}
              resetConfig={resetBotConfig}
              extractValue={(cfg) => cfg?.text || ''}
              buildValue={(val) => ({ text: val })}
            >
              {(value, setValue) => (
                <Textarea
                  placeholder="I'm experiencing technical difficulties..."
                  className="min-h-[120px] font-mono text-xs resize-none"
                  value={value || ''}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
            </BotConfigCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
