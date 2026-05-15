import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateAffiliate, useUpdateAffiliate, AffiliateVisibilityRules, AffiliateScheduling, AffiliateTargeting } from '@/hooks/useAffiliates';
import { toast } from 'sonner';
import { Loader2, Globe, Clock, Target, Bot, Info, Calendar, MapPin, Users } from 'lucide-react';
import { FINANCE_INTERESTS, INDIAN_STATES } from '@/lib/types';

interface AffiliateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

const CATEGORIES = ['Demat', 'Insurance', 'Mutual Funds', 'Credit Cards', 'Courses', 'Other'];

const PAGE_OPTIONS = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'articles', label: 'Articles' },
  { value: 'modules', label: 'Modules' },
  { value: 'videos', label: 'Videos' },
  { value: 'junior', label: 'Junior' },
  { value: 'events', label: 'Events' },
  { value: 'profile', label: 'Profile' },
];

const SECTION_OPTIONS = [
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'inline_content', label: 'Inline Content' },
  { value: 'footer', label: 'Footer' },
  { value: 'banner', label: 'Banner' },
];

const DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const PROFESSION_OPTIONS = [
  'Engineer', 'Doctor', 'Teacher', 'Student', 'Business Owner',
  'Freelancer', 'Homemaker', 'Retired', 'Salaried Employee',
];

export default function AffiliateEditor({ isOpen, onClose, initialData }: AffiliateEditorProps) {
  const createMutation = useCreateAffiliate();
  const updateMutation = useUpdateAffiliate();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    logo_url: '',
    description: '',
    category: 'Other',
    is_active: true,
    chatbot_controlled: false,
    chatbot_prompt: '',
    visibility_rules: {
      pages: [] as string[],
      sections: [] as string[],
      content_ids: [] as string[],
      content_categories: [] as string[],
    },
    scheduling: {
      start_at: '',
      end_at: '',
      timezone: 'Asia/Calcutta',
      recurrence: undefined as { type: 'daily' | 'weekly'; days?: number[]; time_start?: string; time_end?: string } | undefined,
    },
    targeting_rules: {
      age_range: [undefined, undefined] as [number | undefined, number | undefined],
      regions: [] as string[],
      interests: [] as string[],
      subscription_status: 'all' as 'subscribed' | 'unsubscribed' | 'all',
      xp_range: [undefined, undefined] as [number | undefined, number | undefined],
      professions: [] as string[],
      onboarding_completed: undefined as boolean | undefined,
    },
    hasScheduling: false,
    hasRecurrence: false,
  });

  useEffect(() => {
    if (initialData) {
      const vr = initialData.visibility_rules || {};
      const sch = initialData.scheduling || {};
      const tr = initialData.targeting_rules || {};
      
      setFormData({
        name: initialData.name,
        url: initialData.url,
        logo_url: initialData.logo_url || '',
        description: initialData.description || '',
        category: initialData.category,
        is_active: initialData.is_active,
        chatbot_controlled: initialData.chatbot_controlled || false,
        chatbot_prompt: initialData.chatbot_prompt || '',
        visibility_rules: {
          pages: vr.pages || [],
          sections: vr.sections || [],
          content_ids: vr.content_ids || [],
          content_categories: vr.content_categories || [],
        },
        scheduling: {
          start_at: sch.start_at || '',
          end_at: sch.end_at || '',
          timezone: sch.timezone || 'Asia/Calcutta',
          recurrence: sch.recurrence || undefined,
        },
        targeting_rules: {
          age_range: [tr.age_range?.[0], tr.age_range?.[1]],
          regions: tr.regions || [],
          interests: tr.interests || [],
          subscription_status: tr.subscription_status || 'all',
          xp_range: [tr.xp_range?.[0], tr.xp_range?.[1]],
          professions: tr.professions || [],
          onboarding_completed: tr.onboarding_completed,
        },
        hasScheduling: !!(sch.start_at || sch.end_at || sch.recurrence),
        hasRecurrence: !!sch.recurrence,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        logo_url: '',
        description: '',
        category: 'Other',
        is_active: true,
        chatbot_controlled: false,
        chatbot_prompt: '',
        visibility_rules: { pages: [], sections: [], content_ids: [], content_categories: [] },
        scheduling: { start_at: '', end_at: '', timezone: 'Asia/Calcutta', recurrence: undefined },
        targeting_rules: { age_range: [undefined, undefined], regions: [], interests: [], subscription_status: 'all', xp_range: [undefined, undefined], professions: [], onboarding_completed: undefined },
        hasScheduling: false,
        hasRecurrence: false,
      });
    }
  }, [initialData, isOpen]);

  const toggleArrayItem = (field: string, value: string) => {
    setFormData(prev => {
      const arr = (prev as any).visibility_rules[field] || [];
      const newArr = arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value];
      return { ...prev, visibility_rules: { ...prev.visibility_rules, [field]: newArr } };
    });
  };

  const toggleTargetingArray = (field: string, value: string) => {
    setFormData(prev => {
      const arr = (prev.targeting_rules as any)[field] || [];
      const newArr = arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value];
      return { ...prev, targeting_rules: { ...prev.targeting_rules, [field]: newArr } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build clean scheduling object
    const scheduling: AffiliateScheduling = {};
    if (formData.hasScheduling) {
      if (formData.scheduling.start_at) scheduling.start_at = formData.scheduling.start_at;
      if (formData.scheduling.end_at) scheduling.end_at = formData.scheduling.end_at;
      scheduling.timezone = formData.scheduling.timezone;
      if (formData.hasRecurrence && formData.scheduling.recurrence) {
        scheduling.recurrence = formData.scheduling.recurrence;
      }
    }

    // Build clean targeting object
    const targeting: AffiliateTargeting = {};
    if (formData.targeting_rules.age_range[0] !== undefined || formData.targeting_rules.age_range[1] !== undefined) {
      targeting.age_range = [
        formData.targeting_rules.age_range[0] ?? 0,
        formData.targeting_rules.age_range[1] ?? 120,
      ];
    }
    if (formData.targeting_rules.regions.length > 0) targeting.regions = formData.targeting_rules.regions;
    if (formData.targeting_rules.interests.length > 0) targeting.interests = formData.targeting_rules.interests;
    if (formData.targeting_rules.subscription_status !== 'all') targeting.subscription_status = formData.targeting_rules.subscription_status;
    if (formData.targeting_rules.xp_range[0] !== undefined || formData.targeting_rules.xp_range[1] !== undefined) {
      targeting.xp_range = [
        formData.targeting_rules.xp_range[0] ?? 0,
        formData.targeting_rules.xp_range[1] ?? 999999,
      ];
    }
    if (formData.targeting_rules.professions.length > 0) targeting.professions = formData.targeting_rules.professions;
    if (formData.targeting_rules.onboarding_completed !== undefined) targeting.onboarding_completed = formData.targeting_rules.onboarding_completed;

    // Build clean visibility rules
    const visibility: AffiliateVisibilityRules = { pages: [], sections: [], content_ids: [], content_categories: [] };
    if (formData.visibility_rules.pages.length > 0) visibility.pages = formData.visibility_rules.pages;
    if (formData.visibility_rules.sections.length > 0) visibility.sections = formData.visibility_rules.sections;
    if (formData.visibility_rules.content_ids.length > 0) visibility.content_ids = formData.visibility_rules.content_ids;
    if (formData.visibility_rules.content_categories.length > 0) visibility.content_categories = formData.visibility_rules.content_categories;

    const payload = {
      name: formData.name,
      url: formData.url,
      logo_url: formData.logo_url || null,
      description: formData.description || null,
      category: formData.category,
      is_active: formData.is_active,
      chatbot_controlled: formData.chatbot_controlled,
      chatbot_prompt: formData.chatbot_prompt || null,
      visibility_rules: visibility,
      scheduling: scheduling,
      targeting_rules: targeting,
    };

    try {
      if (initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, ...payload });
        toast.success('Affiliate link updated');
      } else {
        await createMutation.mutateAsync(payload as any);
        toast.success('Affiliate link created');
      }
      onClose();
    } catch {
      toast.error('Failed to save affiliate link');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit' : 'Add New'} Affiliate Link</DialogTitle>
            <DialogDescription>
              Configure the partner details, visibility rules, scheduling, and targeting.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic" className="text-xs"><Info className="h-3 w-3 mr-1" /> Basic</TabsTrigger>
              <TabsTrigger value="visibility" className="text-xs" disabled={formData.chatbot_controlled}>
                <Globe className="h-3 w-3 mr-1" /> Where
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="text-xs" disabled={formData.chatbot_controlled}>
                <Clock className="h-3 w-3 mr-1" /> When
              </TabsTrigger>
              <TabsTrigger value="targeting" className="text-xs" disabled={formData.chatbot_controlled}>
                <Target className="h-3 w-3 mr-1" /> Who
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Basic Info */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Partner Name *</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Zerodha" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="is-active" className="text-xs">Active</Label>
                    <Switch 
                      id="is-active" 
                      checked={formData.is_active}
                      onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="url">Referral URL *</Label>
                <Input 
                  id="url" 
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..." 
                  type="url"
                  required 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input 
                  id="logo" 
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://.../logo.png" 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea 
                  id="desc" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe why users should use this..." 
                  rows={2}
                />
              </div>

              {/* Chatbot Control */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <div>
                      <Label className="font-semibold">Chatbot-Controlled</Label>
                      <p className="text-xs text-muted-foreground">
                        Let the chatbot decide when/whom to recommend this affiliate
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.chatbot_controlled}
                    onCheckedChange={(val) => setFormData({ ...formData, chatbot_controlled: val })}
                  />
                </div>

                {formData.chatbot_controlled && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="chatbot-prompt">Chatbot Prompt / Guidelines (Optional)</Label>
                      <Textarea 
                        id="chatbot-prompt" 
                        value={formData.chatbot_prompt}
                        onChange={(e) => setFormData({ ...formData, chatbot_prompt: e.target.value })}
                        placeholder="e.g. Recommend this demat account to users interested in stock trading..."
                        rows={3}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        This prompt is sent to the AI to guide when to recommend this affiliate.
                        If empty, the AI decides based on user context.
                      </p>
                    </div>
                    <div className="rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        When chatbot control is ON, the Where/When/Who tabs are disabled. 
                        The chatbot has full autonomy to show this affiliate inside the chat.
                        Website visibility rules below will be ignored.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Visibility (Where) */}
            <TabsContent value="visibility" className="space-y-4 pt-4">
              {formData.chatbot_controlled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Visibility rules are disabled for chatbot-controlled affiliates.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Visible on Pages</Label>
                    <div className="flex flex-wrap gap-2">
                      {PAGE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleArrayItem('pages', opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            formData.visibility_rules.pages.includes(opt.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:border-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Visible in Sections</Label>
                    <div className="flex flex-wrap gap-2">
                      {SECTION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleArrayItem('sections', opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            formData.visibility_rules.sections.includes(opt.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:border-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-categories">Content Categories (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const arr = formData.visibility_rules.content_categories;
                            const newArr = arr.includes(cat) ? arr.filter(v => v !== cat) : [...arr, cat];
                            setFormData({ ...formData, visibility_rules: { ...formData.visibility_rules, content_categories: newArr } });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            formData.visibility_rules.content_categories.includes(cat)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:border-primary'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Show on content matching these categories</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-ids">Specific Content IDs (optional)</Label>
                    <Input 
                      id="content-ids" 
                      value={formData.visibility_rules.content_ids.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        visibility_rules: {
                          ...formData.visibility_rules,
                          content_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      })}
                      placeholder="uuid1, uuid2, uuid3" 
                      className="font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Comma-separated UUIDs of specific articles/modules to show on</p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab 3: Scheduling (When) */}
            <TabsContent value="scheduling" className="space-y-4 pt-4">
              {formData.chatbot_controlled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Scheduling is disabled for chatbot-controlled affiliates.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-medium">Enable Scheduling</Label>
                    </div>
                    <Switch 
                      checked={formData.hasScheduling}
                      onCheckedChange={(val) => setFormData({ ...formData, hasScheduling: val })}
                    />
                  </div>

                  {formData.hasScheduling && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="start-at">Start Date/Time</Label>
                          <Input 
                            id="start-at" 
                            type="datetime-local"
                            value={formData.scheduling.start_at}
                            onChange={(e) => setFormData({ ...formData, scheduling: { ...formData.scheduling, start_at: e.target.value } })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="end-at">End Date/Time</Label>
                          <Input 
                            id="end-at" 
                            type="datetime-local"
                            value={formData.scheduling.end_at}
                            onChange={(e) => setFormData({ ...formData, scheduling: { ...formData.scheduling, end_at: e.target.value } })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={formData.scheduling.timezone} 
                          onValueChange={(val) => setFormData({ ...formData, scheduling: { ...formData.scheduling, timezone: val } })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Calcutta">Asia/Calcutta (IST)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Label className="font-medium">Recurrence</Label>
                          </div>
                          <Switch 
                            checked={formData.hasRecurrence}
                            onCheckedChange={(val) => {
                              setFormData({ ...formData, hasRecurrence: val });
                              if (val) {
                                setFormData({
                                  ...formData,
                                  hasRecurrence: true,
                                  scheduling: {
                                    ...formData.scheduling,
                                    recurrence: { type: 'weekly', days: [], time_start: '', time_end: '' }
                                  }
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  hasRecurrence: false,
                                  scheduling: { ...formData.scheduling, recurrence: undefined }
                                });
                              }
                            }}
                          />
                        </div>

                        {formData.hasRecurrence && formData.scheduling.recurrence && (
                          <>
                            <div className="grid gap-2">
                              <Label>Recurrence Type</Label>
                              <Select 
                                value={formData.scheduling.recurrence.type} 
                                onValueChange={(val: 'daily' | 'weekly') => setFormData({
                                  ...formData,
                                  scheduling: {
                                    ...formData.scheduling,
                                    recurrence: { ...formData.scheduling.recurrence!, type: val, days: val === 'daily' ? undefined : (formData.scheduling.recurrence?.days || []) }
                                  }
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly (Select Days)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {formData.scheduling.recurrence.type === 'weekly' && (
                              <div className="space-y-2">
                                <Label>Days of Week</Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {DAY_OPTIONS.map(day => (
                                    <button
                                      key={day.value}
                                      type="button"
                                      onClick={() => {
                                        const days = formData.scheduling.recurrence?.days || [];
                                        const newDays = days.includes(day.value) ? days.filter(d => d !== day.value) : [...days, day.value];
                                        setFormData({
                                          ...formData,
                                          scheduling: {
                                            ...formData.scheduling,
                                            recurrence: { ...formData.scheduling.recurrence!, days: newDays }
                                          }
                                        });
                                      }}
                                      className={`w-10 h-10 rounded-full text-xs font-medium border transition-colors ${
                                        (formData.scheduling.recurrence?.days || []).includes(day.value)
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-background border-input hover:border-primary'
                                      }`}
                                    >
                                      {day.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="time-start">Start Time</Label>
                                <Input 
                                  id="time-start" 
                                  type="time"
                                  value={formData.scheduling.recurrence.time_start || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    scheduling: {
                                      ...formData.scheduling,
                                      recurrence: { ...formData.scheduling.recurrence!, time_start: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="time-end">End Time</Label>
                                <Input 
                                  id="time-end" 
                                  type="time"
                                  value={formData.scheduling.recurrence.time_end || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    scheduling: {
                                      ...formData.scheduling,
                                      recurrence: { ...formData.scheduling.recurrence!, time_end: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab 4: Targeting (Who) */}
            <TabsContent value="targeting" className="space-y-4 pt-4">
              {formData.chatbot_controlled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Targeting rules are disabled for chatbot-controlled affiliates.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Min Age</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={120}
                        value={formData.targeting_rules.age_range[0] ?? ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          targeting_rules: {
                            ...formData.targeting_rules,
                            age_range: [e.target.value ? parseInt(e.target.value) : undefined, formData.targeting_rules.age_range[1]]
                          }
                        })}
                        placeholder="e.g. 18"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Max Age</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={120}
                        value={formData.targeting_rules.age_range[1] ?? ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          targeting_rules: {
                            ...formData.targeting_rules,
                            age_range: [formData.targeting_rules.age_range[0], e.target.value ? parseInt(e.target.value) : undefined]
                          }
                        })}
                        placeholder="e.g. 65"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Min XP</Label>
                      <Input 
                        type="number" 
                        min={0}
                        value={formData.targeting_rules.xp_range[0] ?? ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          targeting_rules: {
                            ...formData.targeting_rules,
                            xp_range: [e.target.value ? parseInt(e.target.value) : undefined, formData.targeting_rules.xp_range[1]]
                          }
                        })}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Max XP</Label>
                      <Input 
                        type="number" 
                        min={0}
                        value={formData.targeting_rules.xp_range[1] ?? ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          targeting_rules: {
                            ...formData.targeting_rules,
                            xp_range: [formData.targeting_rules.xp_range[0], e.target.value ? parseInt(e.target.value) : undefined]
                          }
                        })}
                        placeholder="e.g. 5000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subscription Status</Label>
                    <Select 
                      value={formData.targeting_rules.subscription_status} 
                      onValueChange={(val: 'subscribed' | 'unsubscribed' | 'all') => setFormData({
                        ...formData,
                        targeting_rules: { ...formData.targeting_rules, subscription_status: val }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="subscribed">Subscribed Only</SelectItem>
                        <SelectItem value="unsubscribed">Unsubscribed Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Onboarding Status</Label>
                    <Select 
                      value={formData.targeting_rules.onboarding_completed === undefined ? 'any' : String(formData.targeting_rules.onboarding_completed)} 
                      onValueChange={(val) => setFormData({
                        ...formData,
                        targeting_rules: { ...formData.targeting_rules, onboarding_completed: val === 'any' ? undefined : val === 'true' }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Status</SelectItem>
                        <SelectItem value="true">Completed Onboarding</SelectItem>
                        <SelectItem value="false">Not Completed Onboarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Regions</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg">
                      {INDIAN_STATES.map(state => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => toggleTargetingArray('regions', state)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                            formData.targeting_rules.regions.includes(state)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:border-primary'
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Interests</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg">
                      {FINANCE_INTERESTS.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleTargetingArray('interests', interest)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                            formData.targeting_rules.interests.includes(interest)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:border-primary'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Professions</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PROFESSION_OPTIONS.map(prof => (
                        <button
                          key={prof}
                          type="button"
                          onClick={() => toggleTargetingArray('professions', prof)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                            formData.targeting_rules.professions.includes(prof)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:border-primary'
                          }`}
                        >
                          {prof}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}