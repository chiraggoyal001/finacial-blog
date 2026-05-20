import { useState, useEffect, useRef, useCallback } from "react";
import { User, LogOut, Save, UserCircle, AlertCircle, CheckCircle2, Camera, X, Upload, Bell, CreditCard, ChevronRight, Shield } from "lucide-react";
import DataPrivacyPanel from "@/components/DataPrivacyPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FINANCE_INTERESTS, INDIAN_STATES } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { processImage, uploadAvatar, deleteAvatar } from "@/lib/avatar";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { ProfilePageSkeleton } from "@/components/skeletons";

const ProfilePage = () => {
  const { user, logout, updateProfile, markOnboardingComplete, updateUserAvatar, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    region: "",
    interests: [] as string[],
    hobbies: "",
    profession: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [completedFields, setCompletedFields] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "privacy">("profile");

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data from database on mount (includes onboarding data)
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProfile(true);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, onboarding_completed, age, region, interests, profession, hobbies, description, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          // Fall back to auth user data
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            age: user.age?.toString() || "",
            region: user.region || "",
            interests: user.interests || [],
            hobbies: user.hobbies || "",
            profession: user.profession || "",
            description: user.description || "",
          });
          setIsProfileComplete(false);
        } else if (profile) {
          // Use database data (includes onboarding fields)
          setFormData({
            firstName: profile.first_name || user.firstName || "",
            lastName: profile.last_name || user.lastName || "",
            age: profile.age?.toString() || "",
            region: profile.region || "",
            interests: profile.interests || [],
            hobbies: profile.hobbies || "",
            profession: profile.profession || "",
            description: profile.description || "",
          });
          
          // Set avatar preview if available
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
          
          // Check completion status
          const hasAllFields = profile.age && profile.region && profile.interests?.length > 0 && 
                               profile.profession && profile.hobbies && profile.description;
          setIsProfileComplete(hasAllFields || profile.onboarding_completed || false);
          
          // Count completed fields
          let count = 0;
          if (profile.age) count++;
          if (profile.region) count++;
          if (profile.interests && profile.interests.length > 0) count++;
          if (profile.profession) count++;
          if (profile.hobbies) count++;
          if (profile.description) count++;
          setCompletedFields(count);
        } else {
          // No profile row exists
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            age: "",
            region: "",
            interests: [],
            hobbies: "",
            profession: "",
            description: "",
          });
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setIsProfileComplete(false);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    if (!updateProfile) {
      toast.error("Profile update is not available");
      return;
    }

    // Validate age
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 99) {
        toast.error("Please enter a valid age between 1 and 99");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Update auth metadata
      const result = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? parseInt(formData.age) : undefined,
        region: formData.region,
        interests: formData.interests,
        hobbies: formData.hobbies,
        profession: formData.profession,
        description: formData.description,
      });

      // Also update profiles table in database
      if (result.success && user) {
        const { error: dbError } = await supabase
          .from("profiles")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            age: formData.age ? parseInt(formData.age) : null,
            region: formData.region || null,
            interests: formData.interests.length > 0 ? formData.interests : null,
            hobbies: formData.hobbies || null,
            profession: formData.profession || null,
            description: formData.description || null,
            onboarding_completed: true,
          })
          .eq("id", user.id);

        if (dbError) {
          console.error("Error updating database profile:", dbError);
        } else {
          // Recalculate completion status
          let count = 0;
          if (formData.age) count++;
          if (formData.region) count++;
          if (formData.interests.length > 0) count++;
          if (formData.profession) count++;
          if (formData.hobbies) count++;
          if (formData.description) count++;
          setCompletedFields(count);
          
          // Only mark as complete if ALL 6 fields are filled
          const hasAllFields = count === 6;
          setIsProfileComplete(hasAllFields);
          
          // Only update AuthContext (remove navbar badge) if all fields complete
          if (hasAllFields) {
            markOnboardingComplete();
          }
        }
      }

      if (result.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Start logout to show signing out overlay
      await logout();
      // Navigate immediately — the spinner remains visible during
      // the full page reload transition
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Unable to sign out. Please try again.");
    }
  };

  const handleSubscriptionToggle = async () => {
    if (!user) return;

    const newSubscriptionStatus = !user.isSubscribed;

    try {
      // Update subscription in database
      const { error } = await supabase
        .from("profiles")
        .update({
          is_subscribed: newSubscriptionStatus,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating subscription:", error);
        toast.error("Failed to update subscription. Please try again.");
        return;
      }

      // Update local user state
      if (updateProfile) {
        await updateProfile({
          isSubscribed: newSubscriptionStatus,
        });
      }

      if (newSubscriptionStatus) {
        toast.success("Subscribed! You're now subscribed to our newsletter.");
      } else {
        toast.success("Unsubscribed. You've been unsubscribed from our newsletter.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const getInitials = () => {
    const first = formData.firstName?.[0] || "";
    const last = formData.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getCompletionPercentage = () => {
    return Math.round((completedFields / 6) * 100);
  };

  // Avatar handling functions
  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    
    const result = await processImage(file);
    
    if (result.error) {
      toast.error(result.error);
      setIsUploadingAvatar(false);
      return;
    }

    // Show preview with blob URL immediately
    setAvatarPreview(result.url);

    // Upload to Supabase
    const uploadResult = await uploadAvatar(user.id, result.blob);
    
    if (uploadResult.error) {
      toast.error(uploadResult.error);
      setAvatarPreview(user.avatarUrl || null);
    } else {
      // Use permanent Supabase URL and update AuthContext
      if (uploadResult.url) {
        setAvatarPreview(uploadResult.url);
        updateUserAvatar(uploadResult.url);
      }
      toast.success("Profile picture updated successfully");
    }
    
    setIsUploadingAvatar(false);
  }, [user, toast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    setIsUploadingAvatar(true);
    
    const result = await deleteAvatar(user.id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setAvatarPreview(null);
      updateUserAvatar(null);
      toast.success("Profile picture removed");
    }
    
    setIsUploadingAvatar(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const navigate = useNavigate();

  // Sidebar menu items
  const sidebarItems = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "subscription" as const, label: "Subscription", icon: Bell },
    { id: "privacy" as const, label: "AI Privacy", icon: Shield },
  ];

  if (isLoadingProfile) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <Avatar className="h-12 w-12 bg-primary">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="text-lg font-semibold text-primary-foreground bg-primary">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate">
                      {formData.firstName} {formData.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Admin Portal — only visible to admins */}
                {isAdmin && (
                  <>
                    <Separator className="my-2" />
                    <button
                      onClick={() => navigate("/admin")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Portal
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </button>
                  </>
                )}

                {/* Sign Out Button */}
                <Separator className="my-4" />
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full gap-2 justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Completion or Success Banner — mutually exclusive */}
            {!isLoadingProfile && activeTab === "profile" && (
              isProfileComplete ? (
                <Alert className="mb-6 border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-300">
                    Profile Complete!
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Thank you for completing your profile. You'll now receive personalized content recommendations.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">
                    Complete Your Profile
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    <p className="mt-1">
                      You've filled {completedFields} of 6 profile fields ({getCompletionPercentage()}%).
                      Complete your profile to get personalized content recommendations.
                    </p>
                    <div className="mt-3 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${getCompletionPercentage()}%` }}
                      />
                    </div>
                  </AlertDescription>
                </Alert>
              )
            )}

            {activeTab === "profile" ? (
              <Card>
                <CardHeader className="text-center">
                  {/* Avatar Upload Section */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar
                        className={`h-24 w-24 bg-primary cursor-pointer transition-all duration-200 ${
                          isDragging ? "ring-4 ring-primary ring-offset-2" : ""
                        } ${isUploadingAvatar ? "opacity-70" : ""}`}
                        onClick={!avatarPreview ? triggerFileInput : undefined}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Profile"
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarFallback className="text-3xl font-semibold text-primary-foreground bg-primary">
                            {getInitials()}
                          </AvatarFallback>
                        )}

                        {/* Upload overlay */}
                        {!avatarPreview && !isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                        )}

                        {/* Loading spinner */}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </Avatar>

                      {/* Remove button (only shown when avatar exists) */}
                      {avatarPreview && !isUploadingAvatar && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                          title="Remove profile picture"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}

                      {/* Camera button (shown when avatar exists) */}
                      {avatarPreview && !isUploadingAvatar && (
                        <button
                          onClick={triggerFileInput}
                          className="absolute -bottom-1 -right-1 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
                          title="Change profile picture"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Upload hint */}
                  {!avatarPreview && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Click or drag & drop an image (max 5MB)
                    </p>
                  )}

                  <CardTitle className="text-2xl">Profile</CardTitle>
                  <CardDescription>
                    Manage your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          min="1"
                          max="99"
                          value={formData.age}
                          onChange={(e) => handleInputChange("age", e.target.value)}
                          placeholder="Enter your age"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">State/UT</Label>
                        <Select
                          value={formData.region}
                          onValueChange={(value) => handleInputChange("region", value)}
                        >
                          <SelectTrigger id="region">
                            <SelectValue placeholder="Select your state" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      Professional Information
                    </h3>
                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => handleInputChange("profession", e.target.value)}
                        placeholder="Enter your profession"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Finance Interests</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                        {FINANCE_INTERESTS.map((interest) => (
                          <div key={interest} className="flex items-center space-x-2">
                            <Checkbox
                              id={interest}
                              checked={formData.interests.includes(interest)}
                              onCheckedChange={() => handleInterestToggle(interest)}
                            />
                            <Label
                              htmlFor={interest}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {interest}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hobbies">Hobbies</Label>
                      <Input
                        id="hobbies"
                        value={formData.hobbies}
                        onChange={(e) => handleInputChange("hobbies", e.target.value)}
                        placeholder="Enter your hobbies"
                      />
                    </div>
                  </div>

                  {/* About You */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">About You</h3>
                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Save Button */}
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : activeTab === "subscription" ? (
              /* Subscription Tab */
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Bell className="h-6 w-6" />
                    Subscription
                  </CardTitle>
                  <CardDescription>
                    Manage your newsletter subscription and email preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subscription Status */}
                  <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        user?.isSubscribed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                      }`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {user?.isSubscribed ? "Subscribed" : "Not Subscribed"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.isSubscribed
                            ? "You're receiving our newsletter"
                            : "Subscribe to get the latest updates"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={user?.isSubscribed ? "outline" : "default"}
                      onClick={handleSubscriptionToggle}
                    >
                      {user?.isSubscribed ? "Unsubscribe" : "Subscribe"}
                    </Button>
                  </div>

                  {/* Subscription Benefits */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">What you'll get</h3>
                    <Separator />
                    <ul className="space-y-3">
                      {[
                        "Weekly financial insights and market updates",
                        "Exclusive content and early access to new modules",
                        "Personalized recommendations based on your interests",
                        "Event notifications and webinar invites",
                      ].map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mail Preferences (only shown when subscribed) */}
                  {user?.isSubscribed && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Email Preferences</h3>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Mail Frequency</p>
                              <p className="text-sm text-muted-foreground">
                                {user?.mailPreference === "intrusive" ? "Daily" : "Weekly"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : activeTab === "privacy" ? (
              <DataPrivacyPanel />
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
